# Prompt C — round-trip regression suite (closing report)

**Status:** **208 tests across 14 files. 15 of 16 consecutive full runs pass.** `tsc
--noEmit` clean. **No `it.fails`, `it.skip`, `it.todo` or `.only` anywhere in the suite** —
a green run conceals nothing.

Every finding raised during this work is now fixed. The residual 1-in-16 failure is a
**suite-stability problem, not a product defect** — it is always in
`roundTrip.idConcurrency`, the file firing the heaviest concurrent bursts, and presents as
either a spurious 401 with no response body or a 30-second wait for a database connection.
It is described under *Suite stability* below, honestly, rather than rounded up to green.

The brief: protect against the failure mode this project has hit most often — *a success
state (toast, 200/201, green checkmark) with no real write behind it, or a write that
doesn't match what was submitted.*

The standard every test meets:

1. Submit through the real endpoint on the real Express app, with a real bcrypt login
   through `/auth/login` — not a hand-minted token, so `protect` and `requireTenantId` are
   actually exercised.
2. Re-read the record **directly from Postgres** through `pool` — never app state, never a
   cached response, never the response body of the write itself.
3. Assert every submitted field holds the expected value.
4. Clean up in the same run, and **verify cleanup by re-counting** — not by the delete
   returning without error.

A passing toast, a 201, or app state updating are insufficient on their own. The assertion
is against the database.

## How to run it

```bash
cd Backend && npm run test:isolation:setup   # once — creates bmi_crm_iso_test
cd Backend && npm run test:isolation         # 208 tests
cd Frontend && npx vitest run                # 387 tests
```

`src/__tests__/setup.ts` **refuses to run against any database whose name does not end in
`_test`**. The suite creates, mutates and deletes rows; against `bmi_crm` that would destroy
live data. Do not weaken that guard.

Run each suite from its own directory. `npx vitest` from the repo root picks up a mixed set
of files without the DB guard configured and reports meaningless failures.

## Coverage

| Area | File | Tests |
|---|---|---:|
| Contacts | `roundTrip.contacts.test.ts` | 18 |
| Accounts (companies) | `roundTrip.companies.test.ts` | 9 |
| Deals | `roundTrip.deals.test.ts` | 24 |
| Tasks | `roundTrip.tasks.test.ts` | 17 |
| Leads (incl. conversion) | `roundTrip.leads.test.ts` | 26 |
| Activities (manual logging) | `roundTrip.activities.test.ts` | 14 |
| Documents | `roundTrip.documents.test.ts` | 11 |
| CSV import | `roundTrip.csvImport.test.ts` | 5 |
| Id generation under load | `roundTrip.idConcurrency.test.ts` | 20 |
| Concurrent writes to one row | `roundTrip.concurrency.test.ts` | 5 |
| Bulk-vs-single & import-vs-import races | `roundTrip.bulkImportRaces.test.ts` | 12 |
| Actor-name width | `roundTrip.actorName.test.ts` | 6 |
| RBAC | `roundTrip.rbac.test.ts` | 23 |
| Tenant isolation (pre-existing) | `tenantIsolation.test.ts` | 18 |

**Negative cases are mandatory.** Every rejected submission asserts three things: a 4xx,
**the row count unchanged**, and that the message is the real server-side reason — many
tests assert explicitly that it does *not* match `/Internal Server Error/`. That single
check caught most of the bugs below.

**Tenant isolation is cross-cutting**, not one file: every entity creates a second workspace
and confirms B cannot read, list or edit A's row, and that A's row is untouched. Activities
and RBAC additionally confirm that supplying `?tenant_id=` or a role in the body, query or
headers does not widen scope — it comes from the token and nowhere else.

## Bugs found and fixed

Every one shares a shape: **a write reaching Postgres unvalidated, and its real error masked
as `500 Internal Server Error`.**

| # | Bug | Fix |
|---|---|---|
| 1 | `updateCompany` wrote `size` with no validation | clean 400 (`84e2928`) |
| 2 | `createDeal` accepted a missing `value` against a NOT NULL column | clean 400, `0` still valid (`84e2928`) |
| 3 | Three jsonb columns passed raw through `updateDeal` | stringified as create does (`40cc5f8`, `4bd4171`) |
| 4 | 16 create-vs-update validation asymmetries | required fields stay required (`9ebf2b9`) |
| 5 | `tasks.due_date` accepted garbage and ambiguous slash dates | strict `YYYY-MM-DD` (`5edeb2c`) |
| 6 | `leads.score` rejected non-integers with a 500 | 400 mirroring `leads_score_check` (`5edeb2c`) |
| 7 | Duplicate contact email 500'd on **both** create and update | clean 409 (`5edeb2c`) |
| 8 | `MAX(id)+1` race lost writes on a double-click | per-table sequences (`a98d654`) |
| 9 | `LPAD` truncation repeated every id past 999 | `next_prefixed_id()` (`a20c604`) |
| 10 | `documents.uploaded_by` was `VARCHAR(10)` | widened to 255 (`a20c604`) |
| 11 | `DELETE /documents/:id` returned a false 200 | 404, bulk untouched (`a20c604`) |
| 12 | Actor name overflowed three `VARCHAR(100)` columns | widened to 255 (`dfb0d5a`) |
| 13 | Concurrent account imports duplicated a company name | per-name advisory lock (`9ca4096`) |
| 14 | No role enforcement on 13 of 14 route files | destructive actions gated (`15ebe59`) |

**Bug 9 was mine**, introduced by the fix for bug 8, and the most severe of the fourteen: SQL
`LPAD` truncates where JavaScript `padStart` does not, so `lpad('1007',3,'0')` is `'100'`.
Every create would have failed permanently from the 1000th row onward. No live data was
affected (sequences sat at 21/16/54/16), and the concurrency suite is what pushed the test
database past 999 and exposed it.

## The id race — closed, measured not assumed

| Concurrent creates | Before | After |
|---|---|---|
| 2 (one double-click) | 5 of 10 trials lost a write | **0 of 10, 0/20 writes** |
| 3 (two or three users) | 10 of 10 trials lost a write | **0 of 10, 0/30 writes** |
| 5 | 30 of 50 writes lost | **0 of 50** |
| 10 | companies/deals/tasks created 3 of 10 | **10 of 10, distinct ids** |
| CSV import vs form create | `created=4 failed=1` | **`created=5 failed=0`** |

The "after" column is the same probe re-run against the fixed code. Ids keep their
human-readable format (`C001`/`CT001`/`D001`/`T001`) because they are user-visible and
referenced by hand. Two tests go to the >999 boundary deliberately, since a fresh database
starts at 1 and nothing else would reach it.

**The id-count enumeration leak is deliberately deferred as a separate, lower-severity
item.** `C042` still reveals that 42 companies exist across all workspaces. An earlier
CLAUDE.md note claimed the race and the leak "have one shared fix… do them together"; that
was wrong twice over — a sequence fixes the race and does nothing for the leak, and coupling
them would have held a write-losing bug hostage to an information disclosure. **It discloses
a row count; it does not lose data.** Only random/UUID ids close both, at the cost of every
existing id and 10 FK columns across 6 tables.

## Concurrency — covered

**Same-row writes.** The existing `FOR UPDATE` in `transitionDealStage` holds up: a
double-submitted stage move writes **exactly one** history row; two different simultaneous
moves leave a coherent deal and an unbroken trail; concurrent value edits land on a
submitted value, never a blend; a re-completed task keeps its **first** `completed_at`; a
duplicate-email create submitted twice at once returns exactly `[201, 409]` with one row.

**Bulk vs single delete — sound.** Verified across 10 runs after bug 11 changed
single-delete's status semantics: a bulk and a single delete of the same document have
exactly one claim it (never both, never neither) and the row is gone once; a bulk request
overlapping two singles across four documents accounts for all four with no double-count; a
losing single reports 404, never a false 200.

**Import vs import — sound for contacts.** Two concurrent imports of distinct rows both
fully succeed with distinct ids — the direct analogue of the bug-8 collision, now clean. Two
imports of the *same* rows create each email exactly once, and the losing rows say
"already exists" rather than `rowErrorMessage`'s generic fallback, because
`contacts_tenant_email_key` backstops the pre-insert check. A dry run racing a real import
commits nothing.

**Import vs import for accounts — was the last open finding, now closed.** Six simultaneous
imports of one company name used to produce six rows, ten trials out of ten, every request
reporting `created=1`, because `companies` has no unique constraint and the importer's dedupe
was a check-then-write. Closed with a **per-name advisory lock** —
`pg_advisory_xact_lock(hashtext(tenant_id), hashtext(lower(name)))`, taken inside the import
transaction immediately before the duplicate SELECT so the check and the insert are covered
together.

**A unique index was deliberately NOT used, and remains the named alternative.** A `UNIQUE`
index on `companies(tenant_id, lower(name))` would also close this race, but it would forbid
two accounts ever sharing a name in one workspace — which is currently permitted by design
when done knowingly and one at a time (HANDOFF.md's open design question). That is a larger
product decision nobody has made. The lock changes nothing about what a sequential caller may
do. **If the constraint route is ever chosen, it supersedes this lock and the lock should be
removed with it.**

Verified against the *specific* intended outcome, not merely "no longer six rows". The
sequential baseline was measured first — the second of two duplicate imports returns
`created=0, skipped=1`, reason `An account named "X" already exists (C1110)` — and the
concurrent case now reproduces exactly that, **10 trials out of 10**: one creation, five
skips, one row stored, every skip naming the id of the row that won.

**No throughput regression**, proven deterministically rather than by wall clock: with one
name's key held in a separate transaction, an import of a *different* name completed in 4ms
while an import of the *same* name was still waiting after 1200ms and finished on release.
Eight concurrent imports of eight distinct names all created in 13ms.

**The cost it introduces, contained and pinned.** Two imports whose files share names in
*opposite* order can each hold what the other wants; Postgres aborts one with `40P01`
(confirmed directly with a two-client probe, not inferred). The per-row savepoint contains
it — each name still ends with exactly one row, nothing duplicated or lost — but the aborted
row reported `rowErrorMessage`'s generic "This row could not be saved". That generic fallback
was a regression from this change, so `40P01`/`40001` now map to *"This row clashed with
another import running at the same time — retry it"*. Eliminating the deadlock outright would
mean locking every name in a file up front in sorted order, which reorders row processing and
the indices the report is keyed to — not worth it while the outcome is already correct.

**`createCompany` was deliberately left without a lock.** It has no duplicate-name check to
wrap: it validates name presence and size and inserts. There is no check-then-write race
there, and adding a lock would either serialize same-name creates for no benefit or require
inventing a duplicate check — forbidding exactly the deliberate same-name creation this fix
preserves. Verified it is the only such path: `resolveCompany` in the contacts importer reads
and never creates.

**Worth knowing:** `deal_stage_history.changed_at` defaults to `now()`, which in Postgres
**is** `transaction_timestamp()` — the transaction's *start* time. Two near-simultaneous
transitions can commit in the opposite order to their timestamps, and `id` is a random uuid
so it breaks no tie. **The audit trail cannot be reliably ordered by `changed_at` under
concurrency.** The test reconstructs the chain by following `from_stage → to_stage`. Not
fixed; recorded.

## RBAC — now enforced at the API layer

`requireRole` was applied to the three `/invites` routes and **nowhere else**, so all 13
other route files enforced no role policy and any authenticated user could delete any
record — against CLAUDE.md's rule that *"RBAC checks happen at the API layer, not just the
UI."*

**There was no permission matrix to restore.** The frontend does not supply one either; it
supplies three mutually inconsistent ones:

| Source | Roles | Fed by |
|---|---|---|
| **DB + JWT** (authoritative) | `sales` (4 live users), `manager` (1), **no `admin`** | real login |
| `AuthContext` | `Admin\|Sales\|HR\|Manager` + its own permission map | real session |
| `permissions.ts` / `usePermissions` | `sdr\|senior_sdr\|manager\|admin` — **leads only** | a **hardcoded stub user** |
| CLAUDE.md spec | `DEFAULT 'user'` | — |

`users.role` has no CHECK constraint, so any string is storable, and `sales` is absent from
`permissions.ts`'s union entirely — `ROLE_PERMISSIONS['sales']` is `undefined` and
`roleHas` would throw, latent only because the real role never reaches that model.

**The enforced policy is therefore deliberately narrow: DELETE and bulk actions require
`manager` or `admin`; create, read and update stay open to every authenticated role.** It
matches the one policy the backend already expressed (invites = admin|manager) and the
shape of the frontend leads matrix, where `leads.delete` and `leads.bulk_actions` are
manager+ while `leads.edit_fields` is everyone.

**It locks nobody out, which was the binding constraint:** live workspaces contain no
`admin` at all, so any rule requiring one would have been unsatisfiable by all five users.
`requireRole` denies any role not in its list, so an unrecognised role is treated as
least-privileged rather than waved through — the safe direction given the missing
constraint.

Ten routes gated, with `DESTRUCTIVE_ACTION_ROLES` defined once in `middleware/auth.ts`:
DELETE on contacts, companies, deals, tasks, activities, leads and documents (both `:id`
and bulk), plus `POST /contacts/bulk` and `POST /deals/bulk`.

**Deliberately not gated, each for a stated reason:**

- **`createCompany`** — it has no duplicate-name check or destructive step to gate.
- **`DELETE /leads/:id/notes/:noteId`** — authored content, and a soft delete; gating it
  would stop an SDR retracting their own note.
- **`DELETE /leads/meta/views/:viewId`** — personal UI configuration.
- **Row-level scoping** (a `sales` user seeing only records they own) — an open product
  decision: it changes read behaviour on every list endpoint and needs an `owner_id`
  backfill answer first. A test states this rather than leaving it to be discovered.

The three tests that previously *characterised* the unenforced state were written to fail
loudly when RBAC landed, and one did. They were **rewritten against the real policy, not
deleted**: 23 tests now cover a `sales` user refused on all five record types with the row
proven to survive, a **`manager` permitted on all five with the delete proven to have
happened** (the no-lockout check that matters most), both bulk endpoints, and the three
things the policy leaves open.

## Suite stability — reported, not rounded up

208 tests; **15 of 16 consecutive full runs pass.** The failure is always in
`roundTrip.idConcurrency` and appears as a spurious `401` with no response body, or a
30-second wait for a connection.

Evidence it is test infrastructure rather than a product defect: every 401 path in the
codebase sends a JSON message, so a bodyless 401 is not one of them; 600 concurrent creates
against the same endpoint in isolation produced zero failures; and the RBAC, contacts and
documents files each pass 6 of 6 in isolation. The suite shares one 20-connection pool in a
single process while several files fire bursts of ten.

Two of my own test defects were found and fixed while narrowing this, taking the rate from
roughly one run in four down to one in sixteen:

- **A leaked pooled connection.** The lock-scope test took `pool.connect()`, began a
  transaction, took an advisory lock, and released the client in `finally` *without rolling
  back*. node-pg does not roll back on release, so a failed assertion returned that
  connection to the pool still holding the lock and a later import of that name blocked to
  the 30s timeout — in whichever file hit it, which is why the symptom surfaced in a
  different file from its cause.
- **36 email fixtures built from `Date.now()` alone.** Inside `it.each` blocks whose cases
  share a prefix, two can collide within one millisecond — and a duplicate now correctly
  returns 409 rather than the masked 500 it used to, so an earlier fix turned a latent
  fixture collision into a visible flake. All now carry a random suffix; the convention is
  documented in `helpers.ts`.

Also fixed: `teardownWorkspace` never deleted `documents`, so a tenant delete failed with
`documents_tenant_id_fkey` once the RBAC suite began creating them.

**A failing run leaves orphaned `rt-` tenants behind**, because `afterAll` does not
complete — four were found by re-counting and removed. Making the teardown resilient to a
mid-run failure is not done.

## Two caveats — read these before trusting the green

### 1. These are API-level round trips, not browser-driven UI submissions

Every test goes through the real Express app, router, middleware and a real login. **No test
drives an actual browser form.** Payload shapes were sourced from real client code where it
mattered, but that is not the same as clicking the button.

**A bug specific to how a form serializes and sends its data would not be caught here.**
Recorded lesson 1 is exactly this: every write endpoint was probed with curl, every probe
passed, and creating a lead had nevertheless never worked, because the real Add Lead form
sent `status: 'new'` while a hand-written payload sent the minimum. This suite is a stronger
version of that probe and inherits the same blind spot.

The one place it is closed deliberately: the lead-conversion test submits the **exact payload
read off `LeadConversionWizard.tsx`**, which is what revealed the wizard cannot succeed.

### 2. The activity-timeline render is unproven

`roundTrip.activities.test.ts` verifies the **write** path of manual activity logging only.
Live `activities` is 0 rows, so the populated-timeline render has never been exercised. It
cannot be proven without inventing data, and the no-fabricated-data rule forbids seeding to
force a path — a row created and deleted inside one run is not usage data. **Reported as
unproven rather than counted as passing.** The same applies to the populated *documents*
timeline, though the documents API is now covered.

## Known gaps / explicitly out of scope

- ~~Changing a password does not sign other sessions out~~ — **CLOSED by migration
  036.** `POST /auth/change-password` now bumps `token_version`, so every other token
  for that account is refused on its next request, and returns a fresh token so the
  caller stays signed in (`other_sessions_signed_out: true`, and now actually true).
  **Client contract:** the client must replace its stored token from that response.
  The test that used to demonstrate the gap was inverted, not deleted.
- **Email changes have no confirmation step.** `PATCH /auth/me` updates the address
  directly. A verification link cannot be delivered while `EMAIL_TRANSPORT` is `log`,
  so showing "check your inbox" for a message that will never arrive would be the
  dishonest option — the same stance invites already take. A real simplification, to
  become request-then-confirm once a transport is configured.
- ~~A demoted admin keeps admin-level API access until their token expires~~ and
  ~~a deactivated user's token keeps working~~ — **both CLOSED by migration 036.**
  `protect` now reads the account on every request and takes `role`, `is_active` and
  `token_version` from the row rather than the claim, so a demotion or a deactivation
  takes effect on the **next request** instead of in up to 7 days. See
  `TOKEN_VERSION_DESIGN.md` for the design and the measured cost (one indexed lookup,
  p95 **0.379 ms**, about 0.02% of the "<2s for 95%" budget). The claim that this
  needed no per-request query was wrong and is corrected there.
  - **Two consequences worth knowing.** The auth path now hard-depends on Postgres:
    if the database is unreachable the API rejects everything rather than serving
    stale-but-signed tokens — a deliberate change in failure mode. And the rollout
    fallback (an absent `token_version` claim reads as 0) is **dead code once 7 days
    have passed since deploy and should be removed then**; a permanent "absent means
    0" is a permanent hole if the column default ever changes.
  - **Still open:** `JWT_EXPIRES_IN` remains 7 days. Migration 036 makes that
    survivable, not correct.
- **Row-level ownership scoping is not implemented.** RBAC now gates destructive actions,
  but a `sales` user still reads every record in the workspace. Deferred as a product
  decision, pinned by a test that fails if it is ever implemented silently.
- **`DELETE` on lead notes and saved views checks no OWNERSHIP**, so any workspace member
  can delete another's. A missing ownership predicate rather than a missing role check;
  found while scoping the RBAC work and reported, not fixed.
- **Suite stability: a bodyless-401 flake, NOT confined to one file.**
  **TRACKING HAS MOVED TO CLAUDE.md ("Suite stability — ONE tracked flake"), which now owns
  the signature and the running list of affected files. The account below is kept as the
  dated record of how it accumulated; add new data points to CLAUDE.md, not here.**
  Previously recorded as
  always occurring in `roundTrip.idConcurrency`; it has since appeared in
  `roundTrip.rbac.test.ts` as well, so that characterisation was wrong. It presents as a
  `401` whose body is `{}` — which matches no 401 in the codebase, since every one of them
  sends a JSON message — or as a 30-second wait for a connection. Two candidate causes are
  now **ruled out**: `JWT_EXPIRES_IN` is `7d`, and both login limiters set
  `skipSuccessfulRequests`, so neither token expiry nor throttling explains it. Confirmed
  pre-existing and not caused by the Settings work; each affected file passes repeatedly in
  isolation. A failing run also leaves orphaned `rt-` tenants behind, because `afterAll`
  does not complete. **Deserves a dedicated debugging pass once Settings is finished**,
  rather than being chased mid-feature.
  - **Third data point, 2026-09-04 (Settings UI 3/3).** `roundTrip.deals.test.ts` >
    "edit: a REAL change to expected_close_date persists exactly as sent" failed once in a
    full-suite run and did not reproduce in three further full runs, nor on a clean stash
    of the branch. So the affected set is now `idConcurrency`, `rbac` and `deals` — three
    unrelated files, which further weakens any single-file explanation and fits the
    connection-pool-pressure hypothesis: all three failures are full-suite-only and pass in
    isolation. Not chased; recorded so the eventual debugging pass starts with three
    samples instead of one. The deals case is a plain date assertion with no timing,
    concurrency or auth component of its own, which is itself evidence the cause is
    environmental rather than in the test.
  - **Fourth data point, 2026-09-05 (pipeline stages Phase A).**
    `roundTrip.bulkImportRaces.test.ts` > "six concurrent imports of one account name
    create it exactly once" failed once in a full-suite run and passed in isolation and in
    two further full runs. That is four unrelated files now — `idConcurrency`, `rbac`,
    `deals`, `bulkImportRaces` — every one full-suite-only. Not chased, per instruction.
  - **Fifth data point, 2026-09-05 (pipeline stages Phase B slice 2).**
    `roundTrip.documents.test.ts` > "tenant isolation: workspace B cannot read, list or
    delete workspace A's document" failed once in a full run, passed in isolation and on
    the next full run. Five unrelated files now, and the affected test is a different
    SHAPE each time — id concurrency, RBAC, a plain date assertion, an import race, tenant
    isolation. That variety is the strongest evidence yet that the cause is the shared
    connection pool rather than anything in the tests themselves.
- **The id-count enumeration leak** (`C042` reveals a global row count) — deferred, lower
  severity than the race was, closed only by a move to random ids.
- **Browser-driven form submission** — caveat 1. No form is clicked.
- **Populated activity and documents timelines as rendered** — caveat 2.
- **`deal_stage_history` cannot be ordered by `changed_at` under concurrency** — recorded,
  not fixed.
- **Actor-name width is fixed on all five columns that receive it**, but adjacent columns are
  unexamined: `deals.assigned_to`, `leads.assigned_to`, `quotes.assigned_to` and
  `audit_log.changed_by` are `VARCHAR(100)` receiving a **body-supplied** value (a different
  source, so a different question), and eight `VARCHAR(10)` `created_by`/`assigned_to`
  columns sit on unbuilt tables (`blueprints`, `email_templates`, `macros`, `pipelines`,
  `quotes`, `signals`, `web_forms`, `workflow_rules`) — none written by these controllers,
  but the same latent shape if those features are ever built.
- **The create-vs-update validation asymmetry was a *pattern*, not a finite list.** The 16
  swept are not a guarantee about every other field on those generic update loops.
- **Lead conversion does not exist server-side.** Verified three ways: no
  `POST /leads/:id/convert`, none of the `converted_*`/`account_id` columns, and
  `LeadConversionWizard.handleConvert` mints **client-side stub ids** and creates nothing. It
  sends `status: 'converted'`, but `leads.status` is `active | inactive | nurturing`, so the
  real Convert button is rejected today. This session's fix made it *fail honestly* rather
  than fake success. The tests lock in that honest failure and assert the stub ids exist
  nowhere. **When conversion is built, those tests are expected to fail — replace them with
  a positive round trip; do not loosen them.**
- **`deals.value` nullability** — left `NOT NULL` by design; an open data-model question.
- **Password reset, rate-limit persistence, Settings module** — not built; out of scope.
- **Untested races:** a bulk action racing a single write on deals or contacts (only
  documents is covered), and three-way import contention.

## A non-bug, recorded so it is not rediscovered

The suspected NULL-`last_name` case — `${first_name} ${last_name}` yielding `"Solo null"`
when a surname is absent — **is unreachable.** `users.first_name` and `users.last_name` are
both `NOT NULL`. The probe written to confirm it failed for that reason. No fix needed.

## Commits

| Commit | Contents |
|---|---|
| `84e2928` | The suite (7 files + helpers), plus the `size` and `value` validation fixes |
| `40cc5f8` | `stakeholders` jsonb serialization, plus the cross-controller jsonb audit |
| `4bd4171` | `competitors` and `attachment_metadata` jsonb serialization |
| `2df40df` | This summary, first version |
| `9128755` | CLAUDE.md: four `deals` schema drifts, and why `value` was fixed by validation |
| `9ebf2b9` | 16 create-vs-update validation asymmetries |
| `5edeb2c` | Three symmetric masked 500s: `due_date`, `score`, duplicate email |
| `a98d654` | Per-table id sequences — the `MAX(id)+1` race closed |
| `dab579c` | RBAC, concurrency and documents coverage; two document bugs found |
| `a20c604` | Both document bugs fixed, plus the id-padding truncation bug |
| `495a182` | Summary refreshed to 176 tests |
| `dfb0d5a` | Actor-name overflow confirmed and fixed; two races investigated |
| `9ca4096` | Concurrent-import duplicate race closed with a per-name advisory lock |
| `15ebe59` | RBAC enforced at the API layer; destructive actions gated to manager/admin |

Live data was untouched throughout: `bmi_crm` remains at 1 workspace, 20 contacts,
15 companies, 25 deals, 38 leads, 0 activities, 0 documents — re-counted after every run,
not assumed. The live id sequences sit at contacts 21, companies 16, deals 54, tasks 16.
