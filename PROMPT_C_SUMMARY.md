# Prompt C — round-trip regression suite

**Status:** 176 of 176 backend tests pass, across 12 files, over six consecutive full runs.
`tsc --noEmit` clean. No `it.fails`, `it.skip`, `it.todo` or `.only` anywhere in the suite —
a green run means what it says.

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
cd Backend && npm run test:isolation         # 176 tests
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
| RBAC | `roundTrip.rbac.test.ts` | 9 |
| Tenant isolation (pre-existing) | `tenantIsolation.test.ts` | 18 |

**Negative cases are mandatory.** Every rejected submission asserts three things: a 4xx,
**the row count unchanged**, and that the message is the real server-side reason — many
tests assert explicitly that it does *not* match `/Internal Server Error/`. That check
caught most of the bugs below.

**Tenant isolation is cross-cutting**, not one file: every entity creates a second workspace
and confirms B cannot read, list or edit A's row, and that A's row is untouched afterwards.
Activities and RBAC additionally confirm that supplying `?tenant_id=` or a role in the body,
query or headers does not widen the caller's scope — it comes from the token and nowhere
else.

## Regressions locked in, by name

- **Move Stage → `deal_stage_history`.** The modal once performed zero writes while showing
  a success toast. Asserts the deal's `stage` and `probability` changed *in the row*, and
  that a history row exists with correct `from_stage`, `to_stage`, `probability_override`
  and a non-null `changed_by`. A same-stage move writes no row; a transition missing
  `to_stage` is a 400 leaving both deal and history untouched.

- **Close-date no-op save.** `expected_close_date` once walked backward a day on every
  no-op save. Creates with `2026-12-25`, re-saves the **same** value three times, re-reading
  `to_char(...)` after each and asserting it is byte-identical. Locks in `9c858c1`.

- **Three jsonb serialization bugs** — `stakeholders`, `competitors`,
  `attachment_metadata`. All were `JSON.stringify`'d on create and passed raw through
  `updateDeal`'s generic loop, so node-pg emitted a Postgres array literal, jsonb rejected
  it, and the edit 500'd having saved nothing. Each has a four-part test: created with a
  value, edited, cleared with an explicit null, and preserved by an unrelated save.

- **`tags` must stay raw.** The counterpart guard: `tags` shares that loop but is `text[]`,
  so the raw array is correct. A test asserts it still round-trips as a real two-element
  array — the regression "fix the whole loop" would have caused.

- **Sixteen create-vs-update validation asymmetries.** Required fields stay required on
  update across contacts, companies, deals, tasks and leads. The worst was `updateDeal`
  accepting a **negative value** and storing it, silently corruptible pipeline totals
  through the ordinary edit endpoint.

- **Id generation under concurrency** — see below. Asserts **zero** lost writes at N=2, 3,
  5 and 10 on all four tables, plus a CSV import racing a form create, plus the >999
  boundary.

- **Task filter buckets**, across two layers deliberately: the API returns `due_date` as an
  exact `YYYY-MM-DD` with no drift and `overdue=true` matches `CURRENT_DATE` excluding
  completed tasks; `localDay`/`dateOnly` bucket Overdue/Today/Upcoming correctly given that
  string, including the IST overnight window at 00:30 and 23:30 local
  (`Frontend/src/utils/dates.test.ts`).

- **CSV import**, per row: a mixed batch commits valid rows, rejects an invalid one with the
  correct reason, and catches a within-file duplicate with the **first** of the pair
  winning. `dry_run` reports and writes nothing. A duplicate straddling two requests is
  caught by the second.

- **Contact `buying_role`** — explicit `null` clears, omission leaves alone.

- **Account address fields.** `billingAddress` is a frontend grouping mapping onto
  `street`/`city`/`state`/`country`/`zip_code`; the test submits that shape and asserts an
  unrelated save does not disturb a stored address.

## The id race — closed, and measured rather than assumed

`companies`, `contacts`, `deals` and `tasks` generated ids in application code with
`SELECT MAX(CAST(SUBSTRING(id, n) AS INTEGER)) + 1`, reading the maximum in one statement
and inserting in another. Node yields at every `await`, so concurrent creates computed the
same id and the loser collided on the primary key, arriving as a masked 500. None of the
four create paths was even inside a transaction.

| Concurrent creates | Before | After |
|---|---|---|
| 2 (one double-click) | 5 of 10 trials lost a write | **0 of 10, 0/20 writes** |
| 3 (two or three users) | 10 of 10 trials lost a write | **0 of 10, 0/30 writes** |
| 5 | 30 of 50 writes lost | **0 of 50** |
| 10 | companies/deals/tasks created 3 of 10 | **10 of 10, distinct ids** |
| CSV import vs form create | `created=4 failed=1` | **`created=5 failed=0`** |

The "after" column is the same probe re-run against the fixed code, not inferred from a
green suite. The CSV row mattered most: import is the documented migration path from
Salesforce/HubSpot, and a concurrent form create made it report a row of the customer's own
file as failed when the cause was an id collision.

Fixed by per-table sequences wired as the column `DEFAULT` (migration 031), then corrected
in migration 033 — see the padding bug below. Ids keep their human-readable format
(`C001`/`CT001`/`D001`/`T001`) because they are user-visible and referenced by hand.

**The id-count enumeration leak is deliberately deferred as a separate, lower-severity
item.** `C042` still reveals that 42 companies exist across all workspaces, because a
sequence is shared and monotonic. An earlier note in CLAUDE.md claimed the race and the leak
"have one shared fix… do them together, not separately"; that was wrong on both counts — a
sequence fixes the race and does nothing for the leak, and coupling them would have held a
write-losing reliability bug hostage to an information disclosure. **It discloses a row
count; it does not lose data.** Only random/UUID ids close both, at the cost of every
existing human-readable id and rewriting 10 FK columns across 6 tables
(`activities.company_id`/`contact_id`/`deal_id`, `contacts.company_id`, `deals.company_id`,
`quotes.company_id`/`contact_id`/`deal_id`, `deal_stage_history.deal_id`,
`sales_orders.deal_id`). `activities.id` already uses that scheme if the route is ever taken.

## RBAC — covered, with a gap named as a finding

The backend expresses **exactly one** role policy anywhere:
`requireRole('admin','manager')` on the three `/invites` routes. **All 13 other route files
have zero role checks** — verified by grepping every one. So any authenticated user can
perform every data operation regardless of role.

CLAUDE.md states the rule plainly: *"RBAC checks happen at the API layer, not just the
UI."* The frontend has role gates (4 roles, 9 permissions, a `DevRoleSwitcher`); the API
does not enforce them. **That is precisely the arrangement the rule forbids, and it is an
open finding, not a closed item.**

What the suite therefore does:

1. **Tests the policy that exists.** A `sales` user gets a clean 403 on invite create, list
   and revoke, and writes no invite row; `manager` and `admin` are permitted.
2. **Tests the invariant that is documented.** Role comes from the token and cannot be
   asserted by the client — attempted via body, query string and headers — and 401 for
   anonymous stays distinct from 403 for the wrong role.
3. **Characterises the unenforced state**, labelled as such in the test names: a `sales`
   user can create, edit and delete a company, move a deal stage and write audit history,
   and read contacts they do not own.

(3) is **not an endorsement.** For data endpoints there is no policy to test against, and
asserting one would be inventing product rules in a test file. When RBAC lands, those three
tests fail loudly and must be **rewritten against the new policy, never quietly deleted.**

## Concurrency — covered

Distinct from id generation: concurrent writes to the **same existing row**. The existing
`FOR UPDATE` lock in `transitionDealStage` holds up.

- A **double-submitted** stage move writes **exactly one** history row — the second request
  finds the deal already in the target stage and no-ops. Two rows would double-count one
  user action.
- Two **different** simultaneous moves leave a coherent deal and an unbroken trail.
- Concurrent value edits land on a value that was actually submitted, never a blend.
- A re-completed task keeps its **first** `completed_at` rather than drifting.
- A duplicate-email create submitted twice at once returns exactly `[201, 409]` with one
  row — validating the `23505` catch under real concurrency rather than in principle.

**Worth knowing:** `deal_stage_history.changed_at` defaults to `now()`, which in Postgres
**is** `transaction_timestamp()` — the transaction's *start* time. Two near-simultaneous
transitions can commit in the opposite order to their timestamps, and `id` is a random uuid
so it breaks no tie. **The audit trail cannot be reliably ordered by `changed_at` under
concurrency.** The test reconstructs the chain by following `from_stage → to_stage` instead.
Not fixed; recorded.

## Documents — tested, two bugs found and fixed

Was previously listed as untested. Now 11 tests: the API round trip, the honest empty state,
validation (missing name, `module`/`record_id` supplied together, invalid module, a parent
from another workspace, upload with no file), tenant isolation both ways, and delete
verified by re-counting.

Both bugs found here are fixed:

1. **`POST /documents` was broken for essentially every real user.**
   `documents.uploaded_by` was `VARCHAR(10)` while `createDocument` writes
   `resolveActorName(req)` into it — `first_name last_name`, or the email as fallback. The
   suite's own actor "Round Tripper" is 13 characters, so Postgres returned *value too long
   for type character varying(10)* and `errorHandler` masked it as a bare 500. Not
   client-avoidable: the value is derived server-side. Widened to `VARCHAR(255)` in
   migration 032 — **not** 100, despite `activities.created_by` being the obvious
   precedent, because 100 is insufficient and copying it would have reproduced the bug at a
   higher threshold (`first_name`+`last_name` reach 101; `email` reaches 150).

2. **`DELETE /documents/:id` returned 200 for another workspace's document.** Never a
   cross-tenant hole — the query carries `AND tenant_id = $2`, matched zero rows, and the
   body honestly said `deleted: 0` — but the **status lied**, and a client checking
   `res.ok` would report deleting a file it never touched. The single form shared a handler
   with the bulk form and inherited partial-success semantics. Now 404, keyed off
   `req.params.id` so **bulk semantics are unchanged**, which a test pins.

## Two caveats — read these before trusting the green

### 1. These are API-level round trips, not browser-driven UI submissions

Every test goes through the real Express app, router, middleware and a real login. **No test
drives an actual browser form.** Payload shapes were sourced from real client code where it
mattered, but that is not the same as clicking the button.

**A bug specific to how a form serializes and sends its data would not be caught here.**
That is not hypothetical: recorded lesson 1 is exactly this — every write endpoint was
probed with curl, every probe passed, and creating a lead had nevertheless never worked,
because the real Add Lead form sent `status: 'new'` while a hand-written payload sent the
minimum. This suite is a stronger version of that probe and inherits the same blind spot.

The one place it is closed deliberately: the lead-conversion test submits the **exact
payload read off `LeadConversionWizard.tsx`**, which is what revealed that the wizard cannot
succeed at all.

### 2. The activity-timeline render is unproven

`roundTrip.activities.test.ts` verifies the **write** path of manual activity logging only.
Live `activities` is 0 rows, so the populated-timeline render has never been exercised. It
cannot be proven without inventing data, and the no-fabricated-data rule forbids seeding
rows to force a path — a row created and deleted inside one run is not usage data.
**Reported as unproven rather than counted as passing.**

## Known gaps / explicitly out of scope

This suite does **not** provide full coverage. Specifically:

- **Browser-driven form submission** — caveat 1. No form is clicked.
- **Populated activity-timeline render** — caveat 2. Write path only. The same applies to
  the populated *documents* timeline as rendered, though the documents API is now covered.
- **RBAC is not enforced on 13 of 14 route files** — see above. Covered by tests only in the
  sense that the gap is characterised and the one real policy is verified. **This is an open
  finding against a stated architecture rule.**
- **The id-count enumeration leak** (`C042` reveals a global row count) — deliberately
  deferred, lower severity than the race was, and only closed by a move to random ids.
- **`activities.created_by` and `assigned_to` are `VARCHAR(100)`** and receive the same
  `resolveActorName` value that overflowed `documents.uploaded_by`. A 101-character name or
  a longer email fallback will overflow them in the same masked-500 way. **Latent, logged in
  migration 032, not fixed** — a separate call.
- **`deal_stage_history` cannot be ordered by `changed_at` under concurrency** — see above.
  Not fixed; recorded.
- **Three symmetric validation gaps remain closed but their class does not:** `updateCompany`
  and `updateContact` still validate less than their create paths on fields beyond those
  swept. The asymmetry was a pattern, not a finite list.
- **Lead conversion does not exist server-side.** Verified three ways: no
  `POST /leads/:id/convert`, no `converted_at`/`converted_to_contact_id`/
  `converted_to_deal_id`/`account_id` columns, and `LeadConversionWizard.handleConvert`
  mints **client-side stub ids** and creates nothing. It sends `status: 'converted'`, but
  `leads.status` is `active | inactive | nurturing`, so the real Convert button is rejected
  today. This session's fix made it *fail honestly* rather than fake success. The tests lock
  in that honest failure and assert the stub ids exist nowhere. **When conversion is really
  built, those tests are expected to fail — replace them with a positive round trip; do not
  loosen them.**
- **`deals.value` nullability** — left as `NOT NULL` by design; an open data-model question.
- **Password reset, rate-limit persistence, Settings module** — not built; out of scope.
- **Concurrency beyond the cases above** — no test covers a bulk action racing a single
  write, or two CSV imports racing each other.

## Commits

| Commit | Contents |
|---|---|
| `84e2928` | The suite (7 round-trip files + helpers), plus the `size` and `value` validation fixes |
| `40cc5f8` | `stakeholders` jsonb serialization on update, plus the cross-controller jsonb audit |
| `4bd4171` | `competitors` and `attachment_metadata` jsonb serialization |
| `2df40df` | This summary, first version |
| `9128755` | CLAUDE.md: four `deals` schema drifts recorded, and why `value` was fixed by validation |
| `9ebf2b9` | 16 create-vs-update validation asymmetries |
| `5edeb2c` | Three symmetric masked 500s: `due_date`, `score`, duplicate email |
| `a98d654` | Per-table id sequences — the `MAX(id)+1` race closed |
| `dab579c` | Phase 4: RBAC, concurrency and documents coverage; two document bugs found |
| `a20c604` | Both document bugs fixed, plus the id-padding truncation bug (migration 033) |

Live data was untouched throughout: `bmi_crm` remains at 1 workspace, 20 contacts,
15 companies, 25 deals, 38 leads, 0 activities, 0 documents — re-counted after every run,
not assumed. The live id sequences sit at contacts 21, companies 16, deals 54, tasks 16.
