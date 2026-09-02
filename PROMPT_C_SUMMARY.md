# Prompt C — round-trip regression suite

**Status:** delivered. 86 of 86 backend tests pass; `tsc --noEmit` clean.

The brief: protect against the failure mode this project has hit most often — *a success
state (toast, 200/201, green checkmark) with no real write behind it, or a write that
doesn't match what was submitted.*

The standard every test in this suite meets:

1. Submit through the real endpoint on the real Express app, with a real bcrypt login
   through `/auth/login` — not a hand-minted token, so `protect` and `requireTenantId`
   are actually exercised.
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
cd Backend && npm run test:isolation         # 86 tests
cd Frontend && npx vitest run                # 387 tests
```

`src/__tests__/setup.ts` **refuses to run against any database whose name does not end in
`_test`**. The suite creates, mutates and deletes rows; against `bmi_crm` that would
destroy live data. Do not weaken that guard.

Note: run each suite from its own directory. `npx vitest` from the repo root picks up a
mixed set of files without the DB guard configured and reports meaningless failures.

## Coverage by entity

| Entity | File | Tests | Create | Edit | Negatives | Isolation |
|---|---|---:|:---:|:---:|:---:|:---:|
| Contacts | `roundTrip.contacts.test.ts` | 7 | ✅ | ✅ | ✅ | ✅ |
| Accounts (companies) | `roundTrip.companies.test.ts` | 6 | ✅ | ✅ | ✅ | ✅ |
| Deals | `roundTrip.deals.test.ts` | 16 | ✅ | ✅ | ✅ | ✅ |
| Tasks | `roundTrip.tasks.test.ts` | 6 | ✅ | ✅ | ✅ | ✅ |
| Leads (incl. conversion) | `roundTrip.leads.test.ts` | 14 | ✅ | ✅ | ✅ | ✅ |
| Activities (manual logging) | `roundTrip.activities.test.ts` | 14 | ✅ | ✅ | ✅ | ✅ |
| CSV import | `roundTrip.csvImport.test.ts` | 5 | ✅ | n/a | ✅ | ✅ |
| Tenant isolation (pre-existing) | `tenantIsolation.test.ts` | 18 | — | — | — | ✅ |

**Negative cases are mandatory, not optional.** Every rejected submission asserts three
things: the response is a 4xx, **the row count is unchanged**, and the message is the real
server-side reason rather than a generic fallback — several tests assert explicitly that
the message does *not* match `/Internal Server Error/`. That last check is what caught two
of the three bugs below.

**Tenant isolation is asserted as a cross-cutting concern**, not one test: every entity
file creates a second workspace and confirms workspace B cannot read, list, or edit
workspace A's row, and that A's row is untouched afterwards. The activities file
additionally confirms that supplying `?tenant_id=<A>` on B's token does not widen B's
view — scope comes from the token and nowhere else.

## Regressions locked in, by name

- **Move Stage → `deal_stage_history`.** This modal previously performed zero writes while
  showing a success toast. The test asserts the deal's `stage` and `probability` changed
  *in the deal row*, and that a real history row exists with the correct `from_stage`,
  `to_stage`, `probability_override` and a non-null `changed_by` — queried from Postgres,
  never from the transition response body. A same-stage move writes no row; a transition
  missing `to_stage` is a 400 and leaves both the deal and the history untouched.

- **Close-date no-op save.** The highest-priority test in the brief: `expected_close_date`
  was found walking backward one day on every no-op save — data corruption, not a display
  bug. The test creates a deal with `2026-12-25`, then re-saves the **same** value three
  times, re-reading `to_char(expected_close_date,'YYYY-MM-DD')` after each and asserting it
  is byte-identical. Three iterations because a once-per-save drift needs more than one
  round trip to show. Locks in `9c858c1`.

- **Three jsonb serialization bugs on `updateDeal`** — `stakeholders`, `competitors`,
  `attachment_metadata`. All three are jsonb, all three were `JSON.stringify`'d on create
  and passed through the generic update loop **raw**, so node-pg serialized the JS array as
  a Postgres ARRAY literal, jsonb rejected it, and the edit returned a masked 500 having
  saved nothing. Each now has a four-part test: created with a value, edited to a different
  value, an explicit null clearing to `[]`, and an unrelated save preserving it. The
  deep-equal doubles as a double-encoding check, since node-pg parses jsonb back to JS and
  a JSON *string* would not match.

- **`tags` must stay raw.** The counterpart guard: `tags` shares that same loop but is
  `text[]`, so the raw array is exactly what the column wants. A test asserts it still
  round-trips as a real two-element array and not one string that merely looks like a list
  — the regression that "fix the whole loop" would have introduced.

- **Task filter buckets**, across two layers deliberately kept apart: the API returns
  `due_date` as an exact `YYYY-MM-DD` string with no timezone drift and `overdue=true`
  matches `CURRENT_DATE` while excluding completed tasks (backend); `localDay`/`dateOnly`
  bucket Overdue/Today/Upcoming correctly given that string, including the IST overnight
  window at 00:30 and 23:30 local (`Frontend/src/utils/dates.test.ts`).

- **CSV import**, per-row: a mixed batch commits valid rows, rejects an invalid one with
  the correct per-row reason, and catches a within-file duplicate — with the **first** of a
  duplicate pair winning, verified in Postgres. `dry_run` reports what would happen and
  writes nothing. A duplicate straddling two separate requests (the cross-chunk case) is
  caught by the second chunk.

- **Contact `buying_role`**, including the distinction the controller depends on: an
  explicit `null` clears the role, while omitting the field leaves it alone.

- **Account address fields.** `billingAddress` is a frontend grouping, not a column — it
  maps onto `street`/`city`/`state`/`country`/`zip_code`. The test submits that mapped
  shape and asserts an unrelated save does not disturb a stored address.

## Bugs this suite found

All three were the same shape — **a generic insert or update path letting Postgres do the
validating, then masking its error as a 500**:

| Bug | Location | Before | After | Commit |
|---|---|---|---|---|
| `size` written with no validation | `companiesController.updateCompany` | 500 `Internal Server Error` | clean 400 naming valid sizes | `84e2928` |
| `value` missing → not-null violation | `dealsController.createDeal` | 500 `Internal Server Error` | clean 400, `0` still valid | `84e2928` |
| 3 jsonb columns unserialized | `dealsController.updateDeal` | 500, nothing saved | writes correctly | `40cc5f8`, `4bd4171` |

The deals `value` fix is what unblocked the close-date regression test — that test's own
fixture hit the 500, so it had never actually executed. The jsonb audit was driven from
`information_schema` across deals, contacts, companies, tasks and leads, and every result
was confirmed by driving the real endpoint rather than inferred from reading. `companies`
and `tasks` have no jsonb or array columns at all; `leadsController.updateLead` already
handled its own `tags`/`custom_fields` split correctly and was the reference for the fix.

**No schema was changed.** `deals.value` remains `NUMERIC(12,2) NOT NULL` with no default:
whether a deal may have no value is a data-model decision, not something to settle as a
side effect of unmasking an error.

## Two caveats — read these before trusting the green

### 1. These are API-level round trips, not browser-driven UI submissions

Every test goes through the real Express app, the real router, the real middleware and a
real login. **No test drives an actual browser form.** Payload shapes were sourced from the
real client code where it mattered, but that is not the same as clicking the button.

**A bug specific to how a form serializes and sends its data would not be caught here.**
That is not hypothetical in this project — recorded lesson 1 is exactly this: every write
endpoint was probed with curl, every probe passed, and creating a lead had nevertheless
never worked, because the real Add Lead form sent `status: 'new'` and a hand-written
payload sent the minimum. This suite is a strictly stronger version of that same probe, and
it inherits the same blind spot.

The one place it was closed deliberately: the lead-conversion test submits the **exact
payload read off `LeadConversionWizard.tsx`**, not a hand-written one — and that is what
revealed the wizard cannot succeed at all (below).

### 2. The activity-timeline render is unproven

`roundTrip.activities.test.ts` verifies the **write** path of manual activity logging only.
Live `activities` is 0 rows, so the populated-timeline render has never been exercised. It
cannot be proven here without inventing data, and the project's no-fabricated-data rule
forbids seeding rows to force a path — a row this suite creates and deletes inside one run
is not usage data. **Reported as unproven rather than counted as passing.**

## Known gaps / explicitly out of scope

This suite does **not** provide full coverage. Specifically:

- **Browser-driven form submission** — see caveat 1. No form is clicked; a form-level
  serialization bug is invisible to this suite.
- **Populated activity-timeline render** — see caveat 2. Write path only.
- **Lead conversion does not exist server-side.** The brief's premise — that conversion now
  creates linked records — is **wrong**, verified three ways: there is no
  `POST /leads/:id/convert`, `leads` has none of `converted_at` /
  `converted_to_contact_id` / `converted_to_deal_id` / `account_id`, and
  `LeadConversionWizard.handleConvert` mints **client-side stub ids** (`cnt_`/`acc_`/
  `deal_`) and creates nothing. It sends `status: 'converted'`, but `leads.status` is
  `active | inactive | nurturing`, so the real Convert button is rejected today. This
  session's fix made it *fail honestly* rather than fake success. The tests lock in that
  honest failure and assert the stub ids exist nowhere in Postgres. **When conversion is
  really built, those tests are expected to fail — replace them with a positive round trip;
  do not loosen them.**
- **`deals.value` nullability** — left as-is by design; a data-model decision, still open.
- **`MAX(id) + 1` id generation** on companies/contacts/deals/tasks is still a race
  (CLAUDE.md records it). Not addressed; not a tenancy issue.
- **Documents timeline** — 0 rows, same situation as activities. Untested.
- **Password reset, rate-limit persistence, Settings module** — not built; out of scope.
- **RBAC / role-based permissions** are not asserted. Every workspace in this suite logs in
  as `admin`; nothing verifies that a `sales` role is refused where it should be.
- **Concurrency** — no test exercises two simultaneous writes to the same row.
- **`updateCompany` and `updateContact` still validate less than their create paths.**
  `size` is now checked on update, but the asymmetry is a pattern, not a single miss; other
  fields on those generic loops remain unvalidated on update.

## Commits

| Commit | Contents |
|---|---|
| `84e2928` | The suite (7 round-trip files + shared helpers), plus the `size` and `value` validation fixes |
| `40cc5f8` | `stakeholders` jsonb serialization on update, plus the cross-controller jsonb audit |
| `4bd4171` | `competitors` and `attachment_metadata` jsonb serialization, closing the audit |

Live data was untouched throughout: `bmi_crm` remains at 1 workspace, 20 contacts,
15 companies, 25 deals, 38 leads, 0 activities — re-counted after every run, not assumed.
