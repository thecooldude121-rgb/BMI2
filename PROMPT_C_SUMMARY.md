# Prompt C — round-trip regression suite (closing report)

**Status:** **194 of 194** backend tests pass across 14 files, over four consecutive full
runs. `tsc --noEmit` clean. **No `it.fails`, `it.skip`, `it.todo` or `.only` anywhere in the
suite** — a green run conceals nothing. Every data-layer finding raised during this work is
now either fixed or, in one case, named as an open architectural gap that is not a bug.

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
cd Backend && npm run test:isolation         # 194 tests
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
| RBAC | `roundTrip.rbac.test.ts` | 9 |
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

**Bug 9 was mine**, introduced by the fix for bug 8, and the most severe of the thirteen: SQL
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

## RBAC — covered, with a gap named as a finding

The backend expresses **exactly one** role policy anywhere:
`requireRole('admin','manager')` on the three `/invites` routes. **All 13 other route files
have zero role checks** — verified by grepping every one. Any authenticated user can perform
every data operation regardless of role.

CLAUDE.md states the rule plainly: *"RBAC checks happen at the API layer, not just the
UI."* The frontend has role gates; the API does not enforce them. **That is precisely the
arrangement the rule forbids, and it remains open.**

The suite therefore (1) tests the policy that exists — `sales` gets a clean 403 on invite
create, list and revoke and writes no row, `manager` and `admin` are permitted; (2) tests
the documented invariant that role comes from the token, attempted via body, query and
headers, with 401 kept distinct from 403; and (3) **characterises** the unenforced state,
labelled in the test names. (3) is not an endorsement — for data endpoints there is no policy
to test against, and asserting one would be inventing product rules in a test file. **When
RBAC lands, those three tests fail loudly and must be rewritten against the new policy,
never quietly deleted.**

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

- **RBAC is not enforced on 13 of 14 route files** — see above. An open finding against a
  stated architecture rule, and now the only one outstanding from this work.
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

Live data was untouched throughout: `bmi_crm` remains at 1 workspace, 20 contacts,
15 companies, 25 deals, 38 leads, 0 activities, 0 documents — re-counted after every run,
not assumed. The live id sequences sit at contacts 21, companies 16, deals 54, tasks 16.
