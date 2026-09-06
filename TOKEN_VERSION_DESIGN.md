# Design — `token_version`: making session state live

**Status: proposal. Nothing here is implemented.** Written for review before code,
because it changes the authentication path.

## The problem, and the one thing that causes it

Three findings recorded in `PROMPT_C_SUMMARY.md` are one root cause:

| Finding | Today's behaviour |
|---|---|
| A demoted admin keeps admin rights | up to `JWT_EXPIRES_IN` = **7 days** |
| A **deactivated** user keeps full API access | up to **7 days** |
| A password change does not revoke other sessions | up to **7 days** |

`middleware/auth.ts:protect` verifies the JWT's **signature and expiry and nothing
else**. It never reads the account. So every fact the API acts on — role,
whether the account still exists, whether it is active — is a snapshot taken at
login and trusted for a week.

### A correction to my earlier report

I claimed this approach "needs no per-request query." **That was wrong, and it is
the central thing this design has to be honest about.** A version claim cannot
validate itself: to notice that *another* request invalidated this token — an
admin deactivating this user, someone changing their role — something must be
read live. There is no version of this fix that reads nothing.

### Severity correction, in the other direction

**No API path changes a user's role today.** `users` exposes GET, deactivate and
reactivate; `PATCH /auth/me` explicitly refuses `role`; roles are otherwise set
once at invite time. Verified by grep for `SET role` across the controllers —
zero hits. So the stale-**role** finding is reachable only by editing the
database directly, and its practical severity today is low.

The **deactivated-user** finding is different and is the one that matters: item 2
shipped a deactivation feature through the API, and its effect can be ignored by
the deactivated user for up to seven days. That is a control that does not
control anything for a week.

---

## 1. Where the comparison happens, and what it costs

### It is a new query. There is nothing to ride on.

I checked: **no middleware reads `users`.** `requireTenantId` reads only the
request. So this is genuinely one additional round trip on every authenticated
request, not a field added to an existing lookup.

Four controllers — activities, deals, documents, tasks — already read `users`
mid-request via `resolveActorName`. For those, this would be a *second* read.
See the mitigation below.

### Measured, not asserted

One `SELECT id, role, is_active, token_version FROM users WHERE id = $1 AND tenant_id = $2`,
run 200 times from Node against the live database:

```
p50 = 0.193 ms   p95 = 0.379 ms   p99 = 0.481 ms   max = 0.697 ms
10 concurrent   = 10.689 ms total  (~1 ms each, pool contention visible)
```

`EXPLAIN ANALYZE` reports a **sequential** scan at 0.394 ms — because `users`
holds 5 rows and Postgres will not use an index on a table that small. At scale
this becomes a `users_pkey` lookup, which is cheaper, not dearer. The dominant
cost is the round trip and pool acquisition, not the plan.

**Against the non-functional requirement** — "page loads < 2s for 95% of
interactions" — this adds **0.379 ms at p95, about 0.02% of that budget.**
Typical endpoints already issue 1–3 queries, so this is roughly +25–50% in query
*count* and a rounding error in wall-clock.

### Where exactly

In `protect`, immediately after `jwt.verify` succeeds and the workspace claim is
resolved. It must be inside `protect` and not in individual controllers: the
point is that no authenticated route can forget it.

```
verify signature + expiry          (unchanged)
resolve workspace_id claim         (unchanged)
→ SELECT role, is_active, token_version FROM users WHERE id AND tenant_id
   ├ no row              → 401  (account deleted)
   ├ is_active = false   → 401  "This account has been deactivated"
   ├ token_version ≠ claim → 401  "Your session is no longer valid — sign in again"
   └ otherwise: req.user.role = the DB's role, NOT the claim's
```

Reading the role from the database and **overwriting the claim** is what fixes
the stale-role finding with a zero-second window. `requireRole` then reads live
state without knowing anything changed.

### Mitigation for the double read

`protect` should attach the row it fetched to `req.user` (`first_name`,
`last_name`), and `resolveActorName` should use it instead of querying again.
For the four controllers above that turns +1 query into **net zero**. Worth
doing in the same change; it is a small refactor of one helper that already
exists in four copies.

### What was considered and rejected

- **Short-lived access tokens + refresh.** No per-request read, but revocation
  still waits for the access token to expire — a 5–15 minute window in which a
  deactivated user still has access. It also needs a refresh endpoint, rotation,
  client storage changes and a revocation list for the refresh tokens
  themselves, which is a live read by another name. Much larger change, strictly
  weaker guarantee.
- **Caching the row in process for 5–10 s.** Cuts the query but reintroduces a
  revocation window and is per-instance, so N instances give N windows. Redis is
  already named in the stack and `store` in `middleware/rateLimit.ts` is the
  precedent for that seam; this is the right *later* optimisation, once there is
  a reason. Not now: 0.379 ms does not need optimising.

---

## 2. Does the user's own password change survive its own bump?

**Decision: yes — `POST /auth/change-password` returns a fresh token and the
caller stays signed in. Every other session for that user dies.**

Rationale: the caller has just proved knowledge of the current password, so
signing them out buys nothing and costs them a re-login at the exact moment they
were being careful. It is also what every product people have used does.

**This is a client contract change**, and the reason it must be stated rather
than assumed: the response body gains a `token`, and a client that ignores it
will find its next request 401ing, because its own token's version is now stale.
So:

```
POST /auth/change-password  →  200 {
  success: true,
  message: 'Password updated',
  token: '<new JWT>',              // NEW — the client must replace its stored token
  other_sessions_signed_out: true  // was false; now true, and true
}
```

The existing `other_sessions_signed_out: false` becomes `true` and stops being a
disclaimer. The test that currently *demonstrates* a pre-change token still
working must be **inverted**, not deleted — it becomes the proof that revocation
happens.

---

## 3. Rollout for tokens issued before this ships

Tokens already in the wild carry **no `token_version` claim**. Both obvious
options are bad:

- *Treat a missing claim as valid* — every pre-deploy token bypasses revocation
  entirely for up to 7 days, which is the whole window the change exists to
  close.
- *Treat a missing claim as invalid* — correct, but signs every user out on
  deploy.

**Decision: treat a missing claim as version `0`, and compare it.**

`token_version INTEGER NOT NULL DEFAULT 0` means every existing row is already
at 0, so a claimless token compares equal and **keeps working — no forced
re-login on deploy.** The moment anything revokes that user (deactivation,
password change, role change, explicit sign-out-everywhere) their version
becomes ≥ 1 and the claimless token is refused on its next request.

This is strictly better than either simple option: no global logout, and no
bypass window for anyone who has actually been revoked. The only tokens that
stay valid are the ones nothing has revoked, which is correct.

Once `JWT_EXPIRES_IN` (7 days) has passed after deploy, no claimless tokens
remain and the fallback is dead code. It should be **removed then**, with a dated
note — a permanent "treat absent as 0" is a permanent hole if the default ever
changes. `authController` already carries exactly this pattern for the
`tenant_id` → `workspace_id` claim rename, with the same "drop it once none are
in flight" comment; this follows it.

---

## 4. Events that bump, and the scoping rule

| Event | Bumps whose version? |
|---|---|
| `POST /users/:id/deactivate` | **the target's only** |
| Role change (no API path today) | the target's only |
| `POST /auth/change-password` | the caller's own, then reissue their token |
| Future "sign out everywhere" | the caller's own |
| `POST /users/:id/reactivate` | **nobody** — nothing to revoke, and the user held no valid session anyway |

**The scoping rule, which is what the tests below exist to enforce:**

```sql
UPDATE users SET token_version = token_version + 1
 WHERE id = $target AND tenant_id = $callers_tenant
```

Two properties matter. It is scoped to the caller's workspace, so an admin cannot
revoke sessions in another tenant. And `token_version + 1` is computed **inside
the UPDATE**, so two concurrent bumps cannot both read the same value and lose
one — the read-then-write mistake this project has already paid for once with
`MAX(id) + 1`.

### Required test coverage

Beyond the round-trip basics, these four are the point of the change:

1. **An admin deactivating another user bumps ONLY the target.** Read both rows:
   the target's version increments, **the acting admin's does not change at
   all** — and the admin's own token still works on the next request. This is
   the guard against a bare `UPDATE users SET token_version = token_version + 1`
   or one scoped by tenant instead of id, either of which would sign the whole
   workspace out and look like an outage.
2. **A deactivated user's existing token stops working immediately** — not on
   expiry. Mint a token, deactivate via the API as an admin, then reuse the
   token: 401. This is the finding being closed, so it is tested as the
   before/after it is.
3. **A password change reissues the caller's token and kills the others.** The
   pre-change token 401s; the token returned in the response works.
4. **A missing claim behaves as version 0.** Sign a token without the claim, use
   it (works), bump the user's version, use it again (401). This is the rollout
   decision, and it is the one thing no ordinary code path will exercise.

Plus: **cross-tenant** — an admin in workspace A cannot bump a user in workspace
B (404, and B's version unchanged); and **concurrency** — two simultaneous
deactivations of the same user leave `token_version` at +1, not +2 or +1-lost.

---

## What this does NOT fix

- **The token still cannot be revoked mid-request.** A request already past
  `protect` completes.
- **It does not shorten `JWT_EXPIRES_IN`.** Seven days remains long for an
  access token; this makes the length survivable rather than correct. A separate
  decision.
- **It adds a hard dependency on the database to the auth path.** If Postgres is
  unreachable, `protect` fails and the API rejects everything rather than
  serving stale-but-signed tokens. That is the right trade for a CRM, but it is
  a change in failure mode and should be a deliberate one.
- **Nothing here touches the missing ownership checks** on lead notes and saved
  views, which are a different finding.

## Schema

```sql
-- Migration 036 (proposed)
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
```

One column, no backfill, no index — it is only ever read by primary key
alongside the row it lives on.

## Estimate

Roughly half a day: the migration, the `protect` change, the `signToken` claim,
three bump sites, the `resolveActorName` consolidation, and the tests above —
including inverting the two existing tests that currently assert the old
behaviour, which must be rewritten rather than deleted.
