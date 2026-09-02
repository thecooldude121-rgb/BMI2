# Handoff — read before starting work

## DONE — CSV import for Contacts and Accounts is built and real.

Phase-1 item 5. Both surfaces parse, validate, insert, and report **every**
rejected row with its own reason. Neither was a working feature before:

- **Contacts** — the modal was honestly labelled `<NotAvailable>` (an earlier
  session had already stripped out a version that accepted a file, showed a
  green tick, and never read the bytes). It now imports.
- **Accounts** — the Import button navigated to `AccountImportExport.tsx`, twelve
  lines reading "This component will handle CSV/XLS import and export
  functionality." See the audit-tooling gap below: because it never used
  `<NotAvailable>`, it was in no inventory of unfinished work.

**One parser, one panel, one report format.** `utils/csvParse.ts` (moved out of
the Leads wizard, two silent bugs fixed — a quoted newline tore a row in two, and
a blank header shifted every later column, so the app's own export could not be
read back in). `components/CRM/CsvImportPanel.tsx` is shared by both surfaces so
they cannot drift. `Backend/src/utils/csvImport.ts` holds the per-row SAVEPOINT
machinery.

**Design decisions, with the reasoning in the files:** server-side insert rather
than N POSTs from the browser (duplicate detection has to see the whole
workspace; `fetchContacts` caps at 200). Per-row savepoint, not one transaction
per file, so 397 good rows are not held hostage by 3 bad ones. Dry run = the real
inserts, rolled back, so the preview cannot disagree with the commit. Company
linking is **exact case-insensitive name match only**; no match or an ambiguous
match imports unlinked and says so. Alias-based column recognition with a visible
recognised/ignored list — a full drag-to-map UI was explicitly deferred.

### Migration 029 — and a CORRECTION to its own comment

`contacts.source` gained `'import'`. Pure widening; all 20 contacts had
`source IS NULL`, so nothing could be invalidated. `'import'` is provenance the
importer writes and is deliberately **absent from `SELECTABLE_SOURCES`** in the
Add Contact form — a hand-keyed contact must not be able to claim it arrived in a
bulk migration. `SOURCE_LABELS` still carries a label for it so imported contacts
render correctly, and the form preserves an unselectable value it was given
rather than blanking it on save.

**The migration's header comment says the vocabulary lives in four places plus
one compiler-enforced. That is wrong — it is six, and it cannot be corrected in
the file** because 029 is applied and editing it changes the checksum, which
makes the runner refuse to start (this is exactly what 028 exists to document).
The full list:

1. `contacts_source_check` — the authority
2. `SOURCES` in `Backend/src/controllers/contactsController.ts`
3. `ContactSource` in `Frontend/src/types/contact.ts`
4. `SOURCES` in `Frontend/src/utils/contactsApi.ts`
5. `SOURCE_LABELS` in `AddEditContactPage.tsx` — `Record<ContactSource, …>`
6. `SOURCE_BADGES` in `ContactsPage.tsx` — `Record<ContactSource, …>`
7. `SOURCE_LABELS` in `ContactDetailView.tsx` — `Record<ContactSource, …>`

**Sites 6 and 7 were found by the compiler, not by my grep** — which is the
argument for keeping these as `Record<Union, …>` rather than a partial map with a
fallback. A grep table is a claim; a `Record` is enforcement. Adding a source
value is a build failure until every render site has a label, and that is the
design working.

### Verified, and what was NOT

Real sign-out, real login through the dev-login autofill, real sidebar
navigation, real file upload through the actual `<input type="file">`. A 4-row
contacts CSV and a 3-row accounts CSV, each carrying deliberate failures.

- Dry run wrote nothing: contacts stayed at 20 across the preview.
- `POST /contacts/import` → 200 in the network log, followed by the list refetch.
- Every inserted field cross-checked against its Postgres row, not against the
  200: `company_id = C001` from the exact name match, `owner_id = 2` from the
  owner email, tags split on `;`, `source = 'import'`, `tenant_id` scoped.
  `revenue 25000000` parsed from a quoted `"25,000,000"`.
- The rejected rows wrote nothing (0 rows for the bad-email contact and the
  bad-size account) and the duplicate did **not** overwrite its existing row —
  CT001 kept its own job title rather than taking the CSV's.
- Cleanup re-counted, not assumed: back to **20 contacts / 15 companies / 25
  deals / 38 leads / 0 activities**, with a residue sweep for
  `source = 'import'` and the test domains both returning 0.

**Chunking and the report were then proven with a real 620-row file** (a second
pass, after the first report listed them as unexercised):

- The client sent **two** POSTs (500 + 120), not one oversized request.
- Indices survive the boundary: failures planted at local indices 19 and 49 of
  chunk 2 were reported as file rows **521** and **551**, not 21 and 51.
- Postgres: 637 = 20 + 617, ids `CT021`–`CT637`, 617 distinct and contiguous, no
  collisions across two transactions.
- Download report: a real 13,116-byte file, `617 created / 2 failed / 1 skipped`,
  correct reasons, RFC-4180 quoting intact.
- Cleaned up and re-counted to 20/15/25/38/0 with four residue sweeps at 0.

### FIXED in that pass — a cross-chunk duplicate was invisible in the preview

Worth reading even though it is closed, because the shape recurs anywhere work is
split across requests.

**Symptom:** the preview said 618 importable; the commit imported 617.

**Cause:** each chunk is its own request and its own transaction. The server's
duplicate check sees rows inserted earlier in *its* transaction, which is what
makes "already in your workspace" and "appears twice in your file" one mechanism
— but only within a chunk. During a DRY RUN each chunk rolls back, so chunk 2
could not see chunk 1's rows and a duplicate straddling the boundary went
unreported. At commit, chunk 1 had committed, so the same duplicate WAS caught.
Nothing was corrupted and no row was silently dropped; the commit was correct and
reported the skip. But a preview that disagrees with the commit is precisely what
the dry run exists to rule out.

**Fix:** `findWithinFileDuplicates` in `utils/csvImportSpec.ts` resolves
within-file duplicates over the whole file **before** it is chunked, so the answer
cannot depend on where the split falls. Flagged rows are never sent;
`spliceResults` in `utils/importApi.ts` translates the server's subset-relative
indices back to file rows and merges the two sets. The server keeps its own check
as the authority for everything else. Re-verified with the same file: preview 617,
commit 617, Postgres 617.

**The generalisable bit:** any per-request check becomes wrong the moment the work
is chunked, and a dry run hides it because rollback removes exactly the state the
next chunk needed. If you add another batched endpoint, ask what its checks assume
about seeing earlier rows.

## DONE — F24 and F25 are built. Read this before picking up the next item.

Both are committed: `bf3f197` (F24, deal detail) and `007dad7` (F25, account
detail), with `63904d1` adding lesson 9 to `CLAUDE.md` between them. The full
reasoning is in those commit messages and in the RESOLVED blocks now attached to
F14/F24/F25 in `FABRICATED_DATA_AUDIT.md`. What follows is only what a next
session needs that is not obvious from the diff.

### Three migrations landed. 026 and 028 are one change; read 028 first.

| # | What | State |
|---|---|---|
| 026 | `contacts.buying_role`, nullable, no default, **no backfill** | applied |
| 027 | `deals.company_id` + FK + index, backfill of 3 rows | applied |
| 028 | corrects 026's CHECK to the real `contactRoles.ts` ids | applied |

026 wrote its CHECK from memory as `end-user`/`blocker`; the actual ids are
`user`/`blocker-detractor`. **028 exists because an applied migration must never
be edited** — the runner refuses to start when a ledgered checksum changes. I
edited 026 to annotate it, caught it, and reverted; if you see a note about 028
missing from 026, that is why. The vocabulary now matches
`config/contactRoles.ts` in three places: the DB CHECK, `BUYING_ROLES` in
`contactsController`, and the role picker.

**027's backfill is thin on purpose and will not improve on its own.** 3 of 25
deals are linked (D052 exact; D019 and D020 inferred, written by id, reversible
with `UPDATE deals SET company_id = NULL WHERE id IN ('D019','D020')`). The other
22: **15 have an empty `company_name`** and 7 name a company with no row in
`companies`. So "related deals" is built and correct and will show empty on
almost every account until someone links them. The account page says which of
the two it is; do not "fix" that empty state.

### The two things most likely to bite you next

1. **`getContactRole()` falls back to Champion.** `config/contactRoles.ts` exports
   both `getContactRole` (defaults to `CONTACT_ROLES[0]`, correct for a form
   control that must show something selected) and the new **`findContactRole`**
   (returns `undefined`, correct for rendering stored data). Using the wrong one
   labels every unassigned person the deal's champion. That is the same defect
   class as the `'influencer'` fallback this work removed, and the compiler
   cannot see it.
2. **A default parameter value is fabrication you cannot see from the page.**
   Three deleted account components carried invented defaults in their own
   signatures (`healthScore = 92`, `contactName = 'Sarah Chen'`,
   `employeeCount = 450`). Stripping the invented prop at the call site would
   have left the screen unchanged. When you remove a fabricated prop, open the
   component and check its signature. This is a sibling of lesson 9 and is
   recorded in the F25 block of `FABRICATED_DATA_AUDIT.md`.

### Verified live, and what was NOT

Real login, real sidebar nav, every rendered value cross-checked against its
Postgres row — never against a 200, because `/accounts/:accountId` is the page
where the network log misleads. A real Move Stage click wrote the first row
`deal_stage_history` has ever held; a real role click wrote `buying_role` and
moved both coverage advisories.

**Unproven, and stated as such: the populated path for `activities` and
`documents`.** Both tables hold 0 rows, so only the empty states were
exercised. Do not fabricate a row to close it. See the section below — this is
now ONE shared gap across three pages, not a per-page item.

### The populated activity timeline is ONE unproven path, shared by three pages

Do not budget it three times, and do not try to prove it per page.

`ComprehensiveDealDetailPage` (F24), `/accounts/:accountId` (F25) and
`pages/CRM/ContactDetailView.tsx` (Phase-1 item 2, built in `cb05815`) all read
the **same `activities` table** through the same `utils/activitiesApi.ts`, filter
it by their own parent id (`deal_id` / `company_id` / `contact_id`), and render
the same sorted-timeline-plus-empty-state pattern. All three empty states are
verified. None of the three populated renders is, because `activities` has never
held a row.

**It closes automatically for all three the first time anyone logs a real
activity through the app in normal use.** One row proves the shape; no separate
proof is needed per page. When that happens, open whichever page the activity
hangs off and confirm the timeline renders — then the other two follow from the
same code path, and the remaining check is only that each page filters by the
right parent id.

**Why it is deliberately still open:** creating a row to demonstrate that an
empty state works would be fabricating data in service of a verification rule —
the owner ruled on exactly this on 2026-09-02 and declined it. The Move Stage
precedent does not transfer: that write was incidental to exercising a real
feature, whereas this one would exist only to be looked at. An honest "unproven"
outlives a row invented to tick it off.

`documents` (0 rows) is the same situation on the deal and account pages, and
closes the same way.

All verification writes reverted and re-counted, not assumed: 20 contacts /
0 with a `buying_role`, 15 companies, 25 deals / 3 linked, 0 activities,
0 `deal_stage_history`.

### OPEN DESIGN QUESTION — should deals reference contacts by id, or by name?

**Not a bug. Do not "fix" it in a cleanup pass.** The owner's decision on
2026-09-02 was explicitly *not now*: it deserves its own scoped session with the
schema implications thought through, not a rider on a triage batch.

Two symptoms, one question:

- `deals` has **no `contact_id`**. The only link to a person is
  `deals.contact_email`, free text. `dealsController` documents why a backfill
  would set zero rows today: of 25 deals exactly one carries a contact_email and
  it matches no contact.
- `deals.stakeholders` is a jsonb array of `{ name, title, email, role }`
  objects with **no FK to `contacts`**. It is real, user-entered data and it is
  what the deal detail page now renders — but the people in it are strings. The
  same human can exist as a `contacts` row and as a stakeholder name and nothing
  connects them.

Since migration 026 the deal committee and the account team share one role
vocabulary (`config/contactRoles.ts`), so they *describe* people the same way
while still being two unlinked sets. That is the state to resolve.

What a session picking this up has to settle, in order:
1. Is a stakeholder a **reference to a contact**, or a **deal-local record of a
   person** who may not be in the CRM? Both are defensible; they give different
   schemas. A reference means a join table (`deal_stakeholders`) with a role
   column; a deal-local record means keeping jsonb and accepting the duplication.
2. If a reference: what happens to the ~10 existing stakeholder entries whose
   names may not match any contact? They cannot be dropped.
3. `deals.contact_id` for the primary contact is the smaller, separable half and
   may be worth doing first — but only alongside a contact picker in the deal
   form, or the column is dead schema (the same trap `deals.company_id` avoided
   by shipping with the account link already in the form).
4. Every new FK references a GLOBAL primary key, so both halves of the tenant
   rule apply: validate on write with `utils/tenantScope.ts`, and carry
   `AND parent.tenant_id = child.tenant_id` on every join.

### FINDING — the Contacts list silently caps at 200, and the stat card lies

**Pre-existing, not introduced by the CSV import work — but import is what makes
it reachable for the first time.** Recording the cause so the next session does
not have to rediscover it.

With 637 contacts in the database, `/crm/contacts` displayed **"200 Total
Contacts"** and listed 200 rows. No pagination, no "showing 200 of 637", nothing
indicating rows are missing. The headline number is simply wrong.

**Cause, traced:** `fetchContacts` in `utils/contactsApi.ts` sends
`limit=200` (its own default; the API's default is 50). `ContactsPage:76` then
sets `total: contacts.length`, so the card reports the size of the page, not the
size of the table.

**And the true total is not currently available to fix it with.** `getContacts`
returns `count: result.rowCount` — the number of rows *this query returned*,
which under `LIMIT 200` is 200, not 637. So the response already carries a field
named `count` that looks like the answer and is not. Anything that fixes this
needs a real `SELECT count(*)` over the same filters, returned as a distinct
field.

**Why it was previously unreachable and now is not:** the workspace held 20
contacts, and every path that created one made a single row at a time — the form,
the API, lead conversion. Passing 200 by hand was not realistic. A CSV import
crosses it in one action; 617 rows took one click. So a wrong number that was
theoretical is now a normal outcome of a supported workflow, which puts it in the
"lying number" class this project tracks rather than in the "latent" pile.

**The fix is one of two, and NOT built:**
1. **Real pagination** — the list gains page controls and `offset`, and the stat
   card reads a real total. Correct, and the larger job: the page filters, sorts
   and searches client-side over the loaded array today, so paginating means
   moving those server-side or they silently apply to one page only. That
   coupling is the actual cost, not the page controls.
2. **Send the true count separately from the capped rows** — add a
   `SELECT count(*)` under the same `WHERE` to `getContacts` and return it as its
   own field (not the existing `count`, which is the page size and should
   probably be renamed while you are there). `fetchContacts` returns
   `{ contacts, total }`; the card shows the real number and the list says it is
   showing the first 200. Still much smaller than option 1, honest, and does not
   pretend the list is complete — but note it IS a backend change, not a
   frontend-only one. Does not block option 1 later.

Prefer 2 now and 1 when the list is next worked on. **Note the same shape almost
certainly applies to Accounts** (`fetchAccounts(limit = 200)`) — check it at the
same time rather than fixing one and leaving the twin.

### OPEN DESIGN QUESTION — may two companies in one workspace share a name?

**Not a bug, and deliberately NOT bundled into the CSV import work** where it
surfaced. The owner ruled on 2026-09-02 that this is a product decision
deserving its own consideration, not a hygiene fix to ride along on a narrow
task — the same call made for deals-to-contacts above.

`companies` has **no unique constraint at all**: not on `name`, not on `domain`.
Only `companies_pkey` on `id` and the `size` CHECK. Contrast `contacts`, which
has `contacts_tenant_email_key UNIQUE (tenant_id, email)`. So nothing stops a
workspace holding fifteen rows named "Acme Corp", and a careless accounts import
is the most likely way to create them.

The question a session picking this up has to settle first, because the answer
decides whether the constraint is correct at all: **can two legitimately
different companies share a display name?** Divisions, subsidiaries and regional
entities ("Acme Corp" in India and in the UAE, both real accounts with different
owners and deals) are the case that argues no constraint. If they can, the fix
is not uniqueness but disambiguation — `domain`, or a parent-company reference.

If a constraint IS wanted, `UNIQUE (tenant_id, lower(name))` is the shape, and
note it needs a data check first: run
`SELECT lower(name), count(*) FROM companies GROUP BY 1 HAVING count(*) > 1;`
before writing it, or the migration fails on existing rows. (15 companies today,
no duplicates, so it would apply cleanly right now — that will not stay true.)

**What CSV import does in the meantime, and why it is sufficient without the
constraint:** contact rows naming a company are linked by exact,
case-insensitive name match only. A name matching **two or more** companies is
ambiguous, so the contact imports **unlinked** with that stated as the row's
reason, rather than the importer guessing. Under-linking is visible and
reversible; a contact silently attached to the wrong Acme is neither.

### Findings raised but deliberately NOT fixed — pick these up or decide against them

**RESOLVED in `ecf137a` + `3698114`** (the A/B/C/D triage batch): the dashboard's
hardcoded "Welcome back, Alex!", the `employeeCount || 0` → "0 employees" bug in
three more places, the account form's silently-discarded `employeeCount`/`email`
(removed, with a real Company Size select added — `companies.size` had been a
list-filterable column with no way to set it), the client-minted `ACC-${Date.now()}`
id, a fake 500ms save delay, the form-section prop types, and the Industry select
that made 9 of 15 accounts unsavable. Raw type errors 307 → 289.

Still open:

- **`AccountsPage` has ~9 `TS6133` unused symbols**, among them `views`,
  `currentView` and `applyView` — destructured from `AccountsContext` and never
  read. The whole saved-views surface (six context methods) is unwired: nothing
  renders a view picker. Either build the picker or remove the slice; do not
  leave it looking supported. I corrected a comment in `AccountsContext` that
  wrongly claimed AccountsPage consumes it.
- **A real stage-duration average is now computable** from `deal_stage_history`
  and should live in the API response beside `days_since_contact`, not in a
  component. `DealHeroSection` keeps an optional `avgStageDuration` prop for it;
  the hardcoded `VELOCITY_STAGE_AVG` map that used to fill it is gone.

### Still open from the original fabricated-data tally

F2 ReportsPage · F3 AICopilotPage · F5 `aiEngine` · F6–F13 · F16 · F26
ImportLeadsPage · F27 DocumentDetailPage. F14 (TechStart) and F24/F25 are now
closed; F14's entry carries the two extra findings from its removal.

---

## RESOLVED — main has been merged in. Audit was completed first; findings below.

The block that stood here is lifted. main is fully merged into this branch as of `db785fb`
(`git rev-list --count remediation/phases-0-2..main` = 0). What the audit found, kept because
it explains the shape of the history:

- **PR #1 `user/venkat/crmsettingmodule` contained no settings module.** It was this branch's
  own error-swallowing sweep, committed elsewhere and merged — confirmed by content, not by
  diffstat resemblance. No Supabase, no fabricated data. See the PROCESS HAZARD section in §4.
- **PR #3 `user/radhar10/test`** was a single trailing whitespace character in
  `contexts/AuthContext.tsx`.
- **Merged, not rebased, and deliberately.** `git rebase main` began replaying 49 commits and
  conflicted on the first — main's PR #1 already held a *later* snapshot of the sweep, so a
  rebase replays this branch's incremental history onto content that already contains its end
  state. That cascades. The merge produced exactly one conflict (`LeadContext.tsx`), resolved
  in this branch's favour.
- **Verified after merging:** zero of the 267 files main carries and this branch deleted came
  back (checked against a manifest captured beforehand); `lib/supabase.ts` is still the
  12-line stub with zero `.from()` queries, not main's 380-line version; all four sweep files
  carry the sweep rather than main's earlier snapshot; zero `TS2307`/`TS2304`; build clean;
  318/318 tests.

**The standing rule this leaves behind:** before absorbing any future branch, audit it by
content. And note the direction of danger — main is *behind* this branch, so a merge that
lets main's state win would resurrect the Lead Generation tool and the Supabase client.

---

Written at the end of a long session, for a session that starts cold. `CLAUDE.md` is the
authority on rules; this file is the authority on **current state and traps**.

Last commits (newest first):

```
644fec7  Item 3: EmailService abstraction, log transport, invites attempt delivery
b5a5508  Tenant isolation: scope every JOIN, refuse foreign ids from another workspace
c49db28  CLAUDE.md: rate-limit store is a known gap, diff replacements of this file
c462d4e  Items 1 + 2: close open self-registration, rate limit credential endpoints
7434cf2  1b: workspace-scoped identity, password-before-disclosure login, and a way in
83203cf  1a: real authentication — the frontend had none
```

---

## 0. Concurrent sessions share this worktree

**More than one session works in this repo at the same time.** During the last session a
second one independently created `Backend/src/app.ts`, `Backend/src/utils/tenantScope.ts`,
`Backend/src/__tests__/`, `vitest.config.ts` and `tsconfig.test.json`, and edited six
controllers — while this session was mid-task in the same directory.

Consequences that already bit:

- The backend build broke on an uncommitted edit that was not this session's work.
- This session almost duplicated `tenantScope.ts`, which the other session had already
  written and wired.

**Therefore: run `git status` before you start and before you edit anything.** An
uncommitted change is not abandoned work — **ask.** Do not "clean up" a dirty file, and do
not assume a file you did not write is yours to rewrite.

---

## 1. Item 4 — Lead Generation deletion. DONE. 118 files, 56,073 lines removed.

Lead Gen and HRMS are **separate platforms consuming this CRM over SSO**, not modules in
this repo. The Lead Generation *tool* was out of product, not just out of phase. It is gone.
Approved by the repo owner against a full file-level mapping before a single file was
deleted. That mapping — tiers, the resolved import chains, the kept side, and the
verification ledger — is preserved here:
<https://claude.ai/code/artifact/8b5b1bab-f31b-4ed9-b0f2-966b7f0d8718>

**What went, in two tiers:**

| | Files | Lines |
|---|---|---|
| **Tier A** — the tool itself: `pages/LeadGeneration/`, `components/LeadGeneration/` | 53 | 31,742 |
| **Tier B** — orphaned by the cascade, nothing else reached it | 65 | 24,307 |

Tier B was the part the earlier estimate missed: `components/campaigns/` (17),
`components/Deals/` (7 of 8), `components/LeadQualification/` (11), 22 per-persona mock/
enrichment fixtures in `utils/`, 4 `types/`, 2 `services/`, `pages/CRM/DealsPage.tsx`,
`pages/Discovery/SavedSearchesPage.tsx`. Verified by simulation before deleting: reachable
file count dropped 511 -> 393 and the newly-unreachable set was **exactly** those 65 files.

**KEEP side, verified intact and untouched** — 75 files, 21,910 lines: `components/Leads/`
(36), `pages/CRM/{LeadsPage,LeadDetailPage,AddLeadPage,ImportLeadsPage}.tsx`, `utils/lead*`
incl. `leadNBA/ leadScoring/ leadSla/` (26), `types/{lead,leadDomain,leadFilter,leadScoring}`,
`contexts/LeadContext.tsx` + `hooks/useLead*`, and `components/Lead/LeadScoreBreakdownPanel.tsx`
(singular `Lead`, one file, live via `pages/CRM/LeadDetailPage.tsx:7`).
**Backend: zero changes.** All 29 routes in `routes/leads.ts` and all 7 `lead_*` tables
intact; `POST /leads/:id/enrich` is still consumed by `utils/leadsApi.ts`. Not one KEEP file
imported a deleted module. Two `utils/lead*` files were NOT keeps despite the name:
`utils/leadDiscoveryMockData.ts` and `types/leadGeneration.ts` were tool-only.

### The `components/Deals/` trap — resolved, and it was worse than recorded

The previous note said `components/Deals/DealsModule.tsx` is imported by
`pages/CRM/DealsPage.tsx`, therefore live. **Correct one hop, wrong two hops.**
`DealsPage.tsx` is a 14-line shell routed ONLY at `/lead-generation/deals`
(`LeadGenerationModule.tsx:15,66`); it appears nowhere in `CRMModule.tsx`. So 7 of the 8
files in that directory died with the tool. The live CRM deals page is a different tree
entirely: `Sidebar.tsx:30` -> `/crm/deals` -> `CRMModule.tsx:72` -> `DealsKanbanPage.tsx`
-> `DealsListView`/`DealsGridView`/`components/Deal/` (singular).

**One file in there was load-bearing:** `components/Deals/AdvancedFilterBuilder.tsx` (591
lines), imported type-only by `pages/CRM/DealsListView.tsx:13`. `rm -rf components/Deals/`
would have broken `/crm/deals`. It was extracted first with `git mv` (recorded as `R100`,
history preserved) to **`components/Deal/AdvancedFilterBuilder.tsx`** — beside its
consumer's other dependencies — and its import repointed. `components/Deals/` no longer
exists; `components/Deal/` is the single home for CRM deals components.

**Lesson, generalised:** an import edge proves the edge, not reachability. Resolve the chain
all the way to a route in `App.tsx`, and check the sidebar href a real user clicks. A
`pages/CRM/` path is not evidence of being CRM code.

**What the deletion also removed:** `components/Deals/` was a second, complete, fabricated
Deals implementation — kanban, drag-and-drop, bulk actions, filters — with **zero** `fetch`
calls across all 8 files, fed by `generateSampleDeals()`, live at `/lead-generation/deals`
next to the real `DataContext`-backed one. That is the second whole feature in this repo
backed by nothing. `CLAUDE.md` now carries the rule that a zero-fetch component tree is
suspected fabricated code, to be reported rather than assumed to be work in progress.

### Repairs made alongside the deletion (these were regressions, not cleanup)

- `components/Dashboard/RecentActivity.tsx:68` navigated to `/lead-generation/leads/:id`.
  Live via `pages/Dashboard.tsx` — a dashboard activity row would have landed on a dead
  route. Repointed to `/crm/leads/:id` (`CRMModule.tsx:61`).
- `components/Layout/Sidebar.tsx` — `Lead Generation` nav entry removed, plus the `Target`
  icon import it left unused.
- `components/Layout/TopBar.tsx` — `/lead-generation` breadcrumb label removed.
- `contexts/AuthContext.tsx:168-169` — `lead-generation` removed from the Manager and Sales
  RBAC module lists (vestigial; nothing called `hasPermission('lead-generation')`).
- `App.tsx` — 12 lazy imports and 13 routes removed (`/lead-generation/*` plus 12 `/demo/*`).

**Two dangling string references were deliberately left**, both out of scope:
`components/navigation/BreadcrumbNav.tsx:35` has a `lead-generation` label but is imported
only by the dead `pages/Settings/` tree (§2 says do not touch it); `utils/aiEngine.ts:128`
tags a recommendation `relatedTo: 'lead-generation'` — that file is a separate finding, a
hardcoded AI recommendation with an invented `confidence: 0.85`, reachable from
`pages/Analytics/Analytics.tsx`. Phase-2 AI plus fabricated data; not this task.

**Verification:** typecheck raw errors 535 -> 388 (147 eliminated), **zero `TS2307`
"cannot find module" and zero `TS2304`** — no import was left dangling. `npm run build`
clean. 318/318 vitest tests pass. Then verified live through a real login and real sidebar
navigation — see §6 for the standard that was applied.

---

## 2. Tier 2 decision — both Settings trees are dead code

`Frontend/src/pages/Settings/` and `Frontend/src/pages/CRM/CRMSettings/` are **written
against Supabase, which this project does not use.** They query a backend that has never
existed.

**Decision: keep both as UI reference only. Settings is rebuilt fresh against the backend
API. Delete both once the new module lands.** Do not repair them, and do not wire them to
the real API — they are a design reference, not a starting point.

---

## 3. Outstanding: repo-wide Supabase sweep

Supabase is **not** part of the architecture (`CLAUDE.md` was wrong about this and has been
corrected). The database is plain PostgreSQL, reached only through the Node backend;
`pgAdmin 4` is a GUI client the owner administers it with and is not part of the running
system. **A Supabase reference here is a defect to delete, never a dependency to wire up** —
there are no credentials to obtain and no project to provision.

Residual code remains, and **it is in the live path** — `lib/supabase.ts` calls
`createClient` at module scope, so it initialises at app boot and emits a console warning.

Footprint to remove:

- `Frontend/src/lib/supabase.ts` — the client, with a `https://placeholder.supabase.co`
  fallback so it "works" without config
- **6 files importing it** (recounted, not inherited — the earlier figure of 8 was wrong
  twice over): `contexts/SettingsContext.tsx`,
  `components/Permissions/{APIIntegrationsPanel,UserGroupManagement,AuditFeed}.tsx`,
  `pages/Settings/AuditTrail.tsx`, `pages/CRM/CRMSettings/ProfileSettings.tsx`.
  `pages/Discovery/SavedSearchesPage.tsx` was deleted with the Lead Generation tool (§1) —
  it was unreachable dead code carrying a live Supabase import, exactly the "defect that
  looks like an unconfigured integration" trap, so it went now rather than later.
  `services/documentsService.ts` was never an importer: it mentions Supabase only in a
  header comment saying it used to be one. **All 6 remaining importers are inside the two
  dead Settings trees or `components/Permissions/`** — so this sweep is now entirely
  subsumed by the Settings rebuild in §2. There is no Supabase import left outside it.
- **Do not plan this as separate work.** It was scoped as a standalone repo-wide sweep when
  the footprint was believed to be 8 importers spread across the app. It is not: every
  remaining importer dies when §2's Settings rebuild deletes `pages/Settings/`,
  `pages/CRM/CRMSettings/` and `components/Permissions/`. What is left over afterwards is
  three lines of cleanup, not a sweep: delete `lib/supabase.ts`, drop
  `@supabase/supabase-js` from `Frontend/package.json`, and remove the
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` references. Budget it as a tail on the
  Settings work, not as its own item, or it gets planned twice.
- 11 files mention Supabase in total (was 14). `SavedSearchesPage.tsx` and
  `services/disqualificationService.ts` went with the Lead Gen deletion;
  `pages/Auth/LoginWireframe.tsx` was deleted outright — see below.
- The four non-importer mentions are comments and are harmless:
  `pages/CRM/DocumentsLibrary.tsx`, `services/documentsService.ts`, `utils/leadsApi.ts`
  (all three say "this used to be Supabase") and `utils/meetingTranscriptMockData.ts`.

### `LoginWireframe.tsx` — deleted, and why it did not wait for the sweep

`pages/Auth/LoginWireframe.tsx` (400 lines, routed at `/login/wireframe`) was **not** dead
code: it was a **publicly reachable page** — `RouteShell`, not `RequireAuth`, the same
bracket as `/login` — asserting a security posture this product does not have. It claimed:

| Wireframe claim | Reality |
|---|---|
| "CSRF Protection: Handled by Supabase" | no CSRF middleware exists; no Supabase either |
| "Secure Storage: HTTP-only cookies for tokens" | token lives in `localStorage`; the server never calls `res.cookie` |
| "JWT tokens with automatic refresh" | one 7-day JWT, `JWT_EXPIRES_IN` default, no refresh or rotation |
| "Rate Limiting: max 5 attempts, 5-minute lockout" | real windows are 15 and 60 minutes, different budgets |
| tech-stack list: "Supabase Auth · HTTPS Only · CSRF Protection" | none of the three describe this system |

Deleted rather than corrected. Its reference value was nil: `pages/Auth/Login.tsx` is the
real, working login and therefore the real design, while the wireframe documented a Supabase
flow that never existed — so as a "design reference" it pointed the wrong way. Rewriting 400
lines to re-describe what `Login.tsx` already implements produces a stale duplicate, not a
reference.

**Read the deeper hazard, because it survives the file:** the doc did not merely overstate a
control, it described the *opposite storage model*. Under the current design — Bearer token
in an `Authorization` header — CSRF is largely not applicable, because nothing is attached
to a cross-site request automatically. Under the cookie model the wireframe described, CSRF
protection becomes **mandatory**, and there is none. Anyone who had implemented that page as
spec'd would have built the exact configuration where its own headline claim was both
required and absent.
- `@supabase/supabase-js ^2.57.4` in `Frontend/package.json`
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` references

Sweep every import, client init, env var, type and the package dependency. Note the overlap
with §2 — several of these files are the Settings trees that are being deleted anyway, so
sequence the two together rather than fixing files that are about to go.

---

## 4. Known gaps — real, and deliberately not fixed

### CORRECTION — `lib/supabase.ts` is NOT gone; the sweep item is still open

A previous report of mine described it as "gone". It is not, and the distinction matters
because "gone" would have closed a sweep item that remains open:

- **This branch:** 12 lines. Client construction only — `createClient` plus the
  `https://placeholder.supabase.co` fallback. **Zero `.from()` queries.**
- **main:** 380 lines, **ten `.from()` query helpers.**

So the *queries* are gone and the *client* is not. It still calls `createClient` at module
scope, so it initialises at app boot and still emits the console warning. Its actual deletion
is step 1 of the four-step checklist in §2, sequenced behind the Settings rebuild. Do not
tick it off until `Frontend/src/lib/supabase.ts` does not exist and
`@supabase/supabase-js` is out of `package.json`.

### RESOLVED — 79 deleted files were sitting in the working tree as untracked

Discovered after merging main. Every one of the 79 is on the manifest of files this branch
deleted and main still carries — `components/LeadGeneration/` (11),
`components/LeadQualification/` (11), `components/Deals/`, `components/Discovery/`,
`components/Prospects/`, `components/Contact/`, and per-persona fabricated mock data
(`johnSmithEnrichmentData`, `leadDiscoveryMockData`, `crmSyncMockData`,
`intelligenceSignalMockData`, and more). All are byte-identical to main's versions and all
carry mtime 17:10:05, which is the merge writing main's tree to disk.

**Git itself is correct.** HEAD contains zero `components/LeadGeneration/` files, the
deletions are committed, and nothing was re-added to the index — verified with
`git ls-files --error-unmatch`, which reports them unknown to git. The build is clean and
318/318 tests pass, so nothing imports them.

**Why it mattered:** a single `git add -A` would have re-committed the entire Lead
Generation tool and the fabricated mock data in one move, silently undoing the 118-file
deletion.

**Removed** with `git clean -fd`, authorised by the owner after confirming the list was
exactly the 79 untracked paths on the deletion manifest and nothing else — the safety check
compared the untracked set against the manifest and found zero strays, and `git clean -nd`
was diffed against that list before running. Re-verified afterwards the corrected way, with
the merge commit already in place: 0 manifest files on disk, 0 untracked entries per
`git status`, 0 files under `components/LeadGeneration/` or `components/Deals/` in HEAD.
Build clean and 383 raw type errors unchanged afterwards, confirming nothing depended on
them.

**Process note, and it is mine to own:** my post-merge verification reported "zero
resurrected" and that was wrong. Re-running the identical check now returns 79, so the check
is sound and I cannot reconstruct why it passed — most likely I ran it before the merge wrote
the files. The lesson is that a passing resurrection check must be re-run *after* the merge
commit exists, not during conflict resolution, and cross-checked against `git status` for
untracked entries rather than against `test -f` alone.

### SECURITY — the API leaks a stack trace with absolute filesystem paths

**Not a nice-to-have. This is the class of finding a CASA DAST scan flags.**

`POST /api/v1/leads` with an email that already exists returns **HTTP 500** with the raw
Postgres error *and a `stack` field*:

```
{"success":false,
 "message":"duplicate key value violates unique constraint \"leads_tenant_email_key\"",
 "stack":"error: duplicate key ...\n  at /Users/venkatraj/Desktop/BMI2/Backend/node_modules/pg-pool/index.js:45:11\n  at createLead (/Users/venkatraj/Desktop/BMI2/Backend/src/controllers/leadsController.ts:100:20)"}
```

Three separate defects in one response:

1. **Information disclosure.** The stack discloses the absolute directory layout, the
   developer's home directory name, the dependency tree and internal source paths. Check
   whether the error handler emits `stack` unconditionally or only outside production — if
   unconditionally, every 500 in the app leaks this, not just this endpoint.
2. **Wrong status code.** A unique-constraint violation on a user-supplied email is a
   client error, not a server error. It should be **409 Conflict** (or 400) with a message
   naming the field — the same shape settled for FK rejections in `CLAUDE.md`. A 500 also
   tells monitoring the server is broken when it is working correctly.
3. **Raw database text as a user-facing message.** "duplicate key value violates unique
   constraint leads_tenant_email_key" discloses the schema and is not a sentence a user can
   act on. Reachable from the Add Lead form: enter an existing email, tick "Still add as a
   separate lead", submit.

Fix all three together, and audit the error middleware rather than this one controller.

### Latent-broken: `sendEmail` cannot succeed as wired

`POST /leads/:leadId/emails` requires `from_email` (`leadSubController.ts:231`), and
`LeadContext.sendEmail` does not supply it — it adds only `direction` and `sent_at`. It has
**zero UI callers today**, so nothing is visibly broken, but it will 400 the moment anyone
wires it up. Verified: the endpoint returns 201 when `from_email` is present. Decide where
the sender address comes from (the authenticated user's email is the obvious answer) when
the feature is built.

### Nine of eighteen lead write paths have no UI callers

`createNote`, `updateNote`, `deleteNote`, `sendEmail`, `logCall`, `scheduleMeeting`,
`createTag`, `deleteView`, `enrichLead` are reachable in code but called from nothing.
They were fixed along with the rest in the error-swallowing sweep rather than skipped, so
the swallow trap is not lying in wait for whoever wires them. Reachable paths, for contrast:
`updateLead` (15 call sites), `updateView` (4), `createLead` / `deleteLead` (3 each),
`createActivity` / `updateActivity` / `createTask` / `updateTask` / `createView` (2 each).

### RESOLVED — lead stage vocabulary expanded (migration 025)

**Decision made: expand the API to match the product, not narrow the product to match the
API.** The richer vocabulary was load-bearing, not aspirational — `utils/leadSla/` keys on
eight stage values of which seven were rejected, `utils/leadNBA/` and the Leads page pipeline
on eleven, `utils/conversionReadiness.ts` on five. Narrowing would have deleted working SLA
and next-best-action behaviour to satisfy a CHECK constraint nobody had revisited.

`leads_stage_check` now allows fourteen values: the original six (`new, contacted, qualified,
proposal, won, lost`) plus `assigned, enriching, attempting_contact, engaged, sales_accepted,
nurture, disqualified, converted`. `VALID_STAGES` in `leadsController.ts` matches, and
`STATUS_OPTIONS` in `LeadDetailPage.tsx` offers the eleven the frontend has labels for.

**One row changed.** Lead 13 (Mia Thompson) held `stage='contacted'` **and**
`status='nurturing'` — a lifecycle value leaked into the record-state column, which is why
`leadAdapters.ts` and `leadSorting.ts` both carried a "legacy alias for nurture" branch. It
is now `stage='nurture', status='active'`. Note this overwrote a real `stage` value:
`contacted` became `nurture`, on the grounds that `nurturing` was the more specific signal.
Distribution went `contacted 3 -> 2`, `nurture 0 -> 1`; 38 rows throughout.

**Two things deliberately not done:**

- **The drafted migration in `types/lead.ts` was deleted, not applied.** It read
  `UPDATE leads SET status = 'nurture' WHERE status = 'nurturing'` and two siblings — all
  operating on `status`, where the runtime lifecycle lives in `stage`
  (`mapRowToLead` reads `row.stage` and never reads `row.status`). Applying it would have
  written lifecycle values into the record-state column and baked the confusion in. The
  comment is gone so nobody applies it later; the corresponding note in `leadAdapters.ts` was
  rewritten to justify its alias branches by live data instead.
- **`leads.status` keeps `nurturing` in its own CHECK.** Dropping a permitted value is a
  separate narrowing change and nothing writes it any more.

**Follow-up, smaller than it was:** `leads.status` is a column the product does not read at
all — `mapRowToLead` ignores it, and it now holds only `active` (36) / `inactive` (2). Decide
whether it becomes a real archive flag with a frontend field, or is dropped. **Correction to
an earlier note of mine: there is no `Lead.is_active`.** I misattributed a `LeadPipeline`
field at `types/lead.ts:299`. Nothing reads a lead-level active flag, so there is no
duplication to resolve — just an unused column.

Verified end to end: 025 in `schema_migrations`; constraint holds all fourteen; lead 13
moved; create through the real Add Lead form returned `POST 201`; update to a
previously-rejected stage (`engaged`) through the real dropdown returned `PUT 200` and
persisted, with the UI and Postgres agreeing. Both test records removed and re-counted —
38/20/15/25, zero residue.

### PROCESS HAZARD — resurrected files reappear as untracked after git operations

**This happened TWICE in one evening: 79 files, then 50.** Every one was a file this branch
had deliberately deleted and that `main` still carries. All byte-identical to main's versions,
all appearing as untracked (`??`) in the working tree, git itself always correct — HEAD never
contained them and nothing was re-indexed.

**Why it is dangerous rather than merely untidy:** a single `git add -A` re-commits the
entire 56,000-line Lead Generation tool, the fabricated mock data, and
`pages/Auth/LoginWireframe.tsx` — a publicly reachable page asserting "CSRF Protection:
Handled by Supabase" and HTTP-only cookie storage for a product that has neither. One
careless command undoes the whole removal effort.

**CAUSE ESTABLISHED — it was an aborted rebase, and it leaves a trap behind.**
`git rebase main` on this branch replays 49 commits; its first step checks out main's tree,
which writes every file this branch deleted back to disk. `git rebase --abort` restores the
branch ref and the tracked files but does **not** remove files that are untracked on the
branch being returned to — so main's deleted files stay on disk as untracked. Confirmed by
mtime: `.git/rebase-merge` and the first 79 resurrected files shared the timestamp
`17:10:19`.

Worse, the abort left `.git/rebase-merge` in place, so `git status` reported
"You are currently editing a commit while rebasing... 48 remaining" hours later, on a branch
that was not mid-rebase at all — the reflog showed a clean linear history. Cleared with
`git rebase --quit`, which discards the stale state without touching the branch.

**THE RULE, plainly — now also in `CLAUDE.md` under the worktree section:**

1. **Never rebase this branch onto main. Merge.** (`db785fb` has the rationale.)
2. If a rebase is already running, **`--abort` is still the correct way to stop it** — it
   resets HEAD to the original branch. Do NOT substitute `--quit`: git's docs are explicit
   that `--quit` leaves HEAD where the rebase left it, stranding a half-replayed branch.
3. **`--abort` is not enough.** Afterwards, always: clear `.git/rebase-merge` with
   `git rebase --quit` **if it survives** (that is `--quit`'s correct role — discarding stale
   state on a branch that is already correct), and re-run the resurrection check against
   `git status --porcelain | grep '^??'`, after the operation, not during it.

**The check, and the corrected way to run it:** keep a manifest of what this branch deleted
(`comm -13` HEAD's tree against main's), then after any merge/rebase/checkout compare it
against `git status --porcelain | grep '^??'` — **not** `test -f` in isolation, and **after**
the merge commit exists rather than during conflict resolution. A check run mid-merge reported
"zero resurrected" when the answer was 79. Both waves were cleared with `git clean -fd` after
confirming zero strays against the manifest and diffing `git clean -nd` against that list.

### PROCESS HAZARD — a broad `git add` absorbs whatever another session is holding

Seen in both directions in one evening, which is why it is recorded as a pattern rather than
an incident:

- This session's uncommitted sweep was committed by another session onto
  `user/venkat/crmsettingmodule` and merged as PR #1 (see below).
- Then commit `884c716` ("Dev-login autofill"), written by that other session, swept up this
  session's uncommitted `CLAUDE.md` (+25) and `HANDOFF.md` (+160) edits along with its own
  three files. The content survived and is correct — but the documentation for F1, F14, the
  F24/F25 handoff and two CLAUDE.md lessons are attributed to a commit about login autofill.

Nothing was lost either time, and neither session did anything malicious — `git add -A` and
`git commit -a` simply take everything in the tree. **The rule that prevents it: stage by
explicit path, never `-A` or `-a`, whenever `git status` shows a file you did not edit.**
And read the commit above yours before assuming your own work is missing.

### PROCESS HAZARD — a session's working tree was committed to a misleadingly-named branch

Recognise this pattern rather than re-deriving it. During this work:

1. This session's **uncommitted** sweep changes were committed by someone else onto
   `user/venkat/crmsettingmodule`, with commit messages "commit commit" and
   "check the local", and merged to main as **PR #1**.
2. The remaining working tree was stashed as *"temp before branch switch"* and the worktree
   was moved to `main`.
3. From the next session's point of view this looks alarming and is not: `RoleSwitcher.tsx`
   appears reverted (it is just main's copy, which never had the fix), a foreign "CRM
   settings module" appears to have landed (there is no settings module in that branch at
   all), and this branch's work appears lost (it was intact — 8 commits on the branch, 4
   files in the stash).

**The lesson: a branch name is not evidence of its contents.** PR #1 was audited by content
— it contains this branch's `errorMessage()` helper (26 references), `guardRead`/`guardWrite`
(29 references) and a distinctive comment verbatim — which is the only reliable way to tell
whose work it is. Before concluding that foreign code landed, diff the branch and read it.

Also: **main is behind this branch, not ahead.** The 267 files present on main and absent
here are the ones this branch deleted, and main still carries the 380-line
`lib/supabase.ts`. The dangerous direction is a merge where main's state wins, which would
resurrect the Lead Generation tool and the Supabase client surface in one move.

### Useful negative result — the API surface is sound

Worth having written down because it bounds the problem. Every endpoint the frontend calls
was probed with a real token against the running server:

- **All 13 route groups exist** (`auth`, `leads`, `deals`, `companies`, `contacts`,
  `pipelines`, `activities`, `tasks`, `documents`, `users`, `invites`, `quotas`, `forecast`).
- **Every read returned 200.** Activities, notes, tasks, emails, calls, meetings, tags,
  views, pipelines, users.
- **Every write returned 201/200** — notes, tasks, activities, calls, meetings, tags, views,
  enrich — except `logEmail`, which needs `from_email` (above).
- **Every endpoint works when sent a payload it accepts.** Corrected claim: an earlier draft
  of this note said lead conversion was the only structurally impossible feature. That was
  based on curl probes that omitted `status`, so they passed where the real UI fails — see
  the vocabulary-mismatch section above for the two features that also cannot succeed.
  **Methodological lesson: a hand-written probe payload is not the UI's payload.** Probe
  with exactly what the client sends, or drive the real form.

So the swallowed errors were hiding *capability that works*, not a second dead feature. The
9 probe records created during this sweep were deleted and verified by re-count: all
`lead_*` sub-tables back to 0, `leads` back to 38, zero `AUDIT-PROBE` residue.

### Lead conversion has NEVER worked — scoped Phase 1 item, not a regression

**Read this first: nothing was rolled back.** The Convert Lead wizard could not have saved a
conversion on any day of this project's life. It was narrowed to fail honestly instead of
falsely reporting success, and the feature below is what would make it actually work. If you
see the wizard now showing "Conversion failed — nothing was saved", that is the fix, not the
break.

What was wrong, verified against the running API rather than inferred:

- `handleConvert` never created anything. It minted ids from a timestamp —
  `cnt_${Date.now()}`, `acc_${...}`, `deal_${...}` — and sent them as if records existed.
  There is no POST to contacts, accounts or deals anywhere in the flow.
- `leadsApi` maps `status` -> `stage`, so the request carried `stage: 'converted'`.
  `VALID_STAGES` is `new, contacted, qualified, proposal, won, lost`. Sending exactly that
  payload returns **HTTP 400**, `"stage must be one of: ..."`.
- The conversion fields alone return **HTTP 400**, `"No valid fields to update"` — they are
  not in `UPDATABLE_FIELDS`.
- **The columns do not exist.** On `leads`, of `converted_at`, `converted_to_contact_id`,
  `converted_to_deal_id`, `account_id`, none are present. Only `status` is.
- `updateLeadViaAPI` caught the 400, logged it and returned `null`; the wizard ignored the
  falsy result and advanced to step 4. Fixed — it throws now, and the wizard renders the
  server's message.
- `LeadContext.convertLead` (line ~378) is itself a stub returning `{ contactId: undefined,
  dealId: undefined }`. `detectDuplicates` returns `[]` and `mergeLeads` returns `true`
  without doing anything. That stub is the natural home for the real implementation.

**To build it, in dependency order:**

1. **Migration** — add to `leads`: `converted_at TIMESTAMPTZ`,
   `converted_to_contact_id UUID REFERENCES contacts(id)`,
   `converted_to_deal_id UUID REFERENCES deals(id)`,
   `account_id UUID REFERENCES companies(id)`. All nullable. Note the FK caveat in
   `CLAUDE.md`: these reference GLOBAL primary keys, so Postgres will happily accept a row
   in workspace A pointing at workspace B — the write must be validated (step 4).
2. **Settle the stage/status vocabulary.** `VALID_STAGES` and `VALID_STATUSES` are two
   different vocabularies and `leadsApi` silently maps one onto the other. Decide whether
   "converted" is a stage, a status, or neither (it may belong only in `converted_at` being
   non-null). Do not add `'converted'` to `VALID_STAGES` without deciding — the frontend
   `Lead.status` / DB `leads.status` mismatch is already recorded as known schema drift.
3. **Extend `UPDATABLE_FIELDS`** in `leadsController` with the new columns, once they exist.
4. **Real record creation with FK ownership validation.** Conversion creates a contact, and
   optionally a company and a deal, then links them. Every FK must be proven to belong to
   the caller's workspace before insert — use `utils/tenantScope.ts`, reject with 400 naming
   the field, per the settled contract in `src/__tests__/tenantIsolation.test.ts`. Do it in
   ONE transaction: a half-converted lead pointing at a contact that failed to insert is
   worse than a failed conversion.
5. **Contact and account search endpoints**, to replace the two pickers. The wizard's
   "Link to Existing" path is currently **disabled and labelled** because its contact list
   came from `DataContext` (sample-seeded) and its account list from a `MOCK_ACCOUNTS` array
   in the wizard file. Both are deleted. Re-enable the path only when real search exists.
6. **Match suggestions** — deleted along with `buildSuggestions`, whose matching was far
   weaker than the real engine (contacts on email-DOMAIN equality alone, which flags every
   colleague at a shared domain; accounts on bidirectional substring containment). If
   suggestions come back, route them through `utils/leadDuplicates.ts`, not a new heuristic.

**Left alone deliberately:** `findDuplicates` from `utils/leadDuplicates.ts` — a tested
4-signal engine (email, phone, company domain, name similarity via levenshtein) running
against `LeadContext`'s API-backed leads. It is real, it works, and it still gates step 2.
Verified live: it correctly flagged "Liam Johnson · Similar name (medium)" against a real lead.

**Also note the same swallow pattern remains in ~10 other `leadsApi` functions**
(`createLeadViaAPI`, `createNoteViaAPI`, `createTaskViaAPI`, `logEmailViaAPI`,
`logCallViaAPI`, `scheduleMeetingViaAPI`, and others all `catch` -> `console.error` ->
`return null`). Only `updateLeadViaAPI` was fixed, to keep the narrowing pass narrow. Each
is a place where a rejected write can read as a successful one.


### RESOLVED — F1: DataContext reads the database (commit 69dfefc)

The audit's root cause. Six collections now come from the API (leads, contacts, companies,
deals, activities, tasks) through six adapters that map DB shapes to the provider's camelCase
vocabulary. Fields with no source are left `null`/`0`/`[]`, never a plausible default.
Failures surface on `error`; returning `[]` would claim something about the data rather than
the request. `utils/sampleData.ts` (433 loc) and `utils/sampleDeals.ts` (103 loc) are
deleted, and fifteen unconsumed mutators went with them — with real data behind the provider,
an in-memory-only `addLead` would inject a phantom row into a real dataset.

Two collections are empty on purpose, and the difference is the point:
- **`employees` — permanently empty.** No `tenant_id` on that table, and HRMS is a separate
  platform over the SSO boundary. The three HRMS pages render `<NotAvailable>` — "not built
  yet", accurate for a future platform. **The HRMS boundary question stays open in CLAUDE.md;
  this does not pre-empt it.**
- **`meetings` — empty because there are no rows,** not because the feature is missing.
  Calendar says "No upcoming meetings". No data is not the same as no feature; keep that
  distinction in any new empty state.

Verified against Postgres rather than merely observed: Analytics matches on three independent
figures — Total Pipeline $1,644,000 = `sum(value)`, Won Revenue $55,000 = the single
closed-won deal, Active Deals 22 = 24 − 1 won − 1 lost. All six fetches return 200.

**Honest scope of that verification: ONE consumer was confirmed rendering real values, not
three.** The others render correct absences. See F14 immediately below for why — it is the
more useful half of this finding.

### F14 — GamificationPage. OPEN. Disposition decided: LABEL, do not build.

`pages/CRM/GamificationPage.tsx` destructured `leads, deals, tasks, employees` from
`useData()` and never read one of them. Every figure is a hardcoded literal in local state:
Level 12, 2.8K XP, a 7-day streak, a three-person leaderboard, "92% confident" AI coach
insights, challenge progress bars, "Team Average 720 / Top Performer 1240". Fixing
`DataContext` could not reach it, because it never consumed `DataContext`. The dead
destructure and import are removed so the page no longer misrepresents itself as data-driven;
the fabrication is untouched.

**Disposition, decided by the owner: label it `PREVIEW · SAMPLE CONTENT`, do not build it.**
Gamification is Phase-2 work and is absent from the Phase-1 page list. Building real scoring
would mean designing an XP and levelling model nobody has specified — inventing a system to
justify invented numbers. Labelling is the honest treatment, and it is the same treatment
already applied successfully to the two panels on `CRMDashboard`. Copy that pattern: a
visible badge plus an explicit "these are not calculated from your data" note. Do not
partially wire it — a real deal count next to an invented XP total is worse than either.

### Fabricated data — the running tally

Tracked here because this is a **recurring class of defect, not a series of coincidences.**
Each was a finished-looking surface with nothing behind it, and each was first read as
unfinished work rather than as fabrication.

**Fixed:** F1 `DataContext` (the root cause, 69dfefc) · the CRM dashboard widgets · the
second Deals implementation (deleted with the Lead Gen tool) · F22 `IntegrationsContext`
including its copyable fake `sk_live_` key · F28 `MOCK_ACCOUNTS` in the conversion wizard.

**Open, with dispositions:** F14 GamificationPage (label — see above) · F24
`ComprehensiveDealDetailPage` and F25 `/accounts/:accountId` (**build properly — these ARE
the Phase-1 deal-detail and account-detail pages**) · F27 `DocumentDetailPage`
(`getMockDocuments()`) · F2 ReportsPage catalogue (33 cards, 30 fake `updated="5m"` stamps) ·
F3 AICopilotPage (1,207 lines of scripted AI) · F5 `aiEngine` persona benchmarks · F6–F13 and
F16 as listed in FABRICATED_DATA_AUDIT.md.

| # | Where | What | Status |
|---|---|---|---|
| 1 | CRM dashboard | six widgets built from hardcoded literals, no queries; stale "147 contacts" / "$2.4M pipeline" surviving across pages | fixed earlier; the surviving gamification panel is now correctly labelled `PREVIEW · SAMPLE CONTENT` with a "not your data" note |
| 2 | `components/Deals/` | a second, complete Deals implementation — kanban, drag-and-drop, bulk actions, filters — **zero `fetch` calls across 8 files**, fed by `generateSampleDeals()`, routed at `/lead-generation/deals` | **deleted** with the Lead Gen tool (§1) |
| 3 | `utils/aiEngine.ts:128` | a hardcoded "AI recommendation" — `type: 'persona_match'`, an invented `confidence: 0.85`, and made-up advice ("focus on Healthcare and Technology sectors", "Target companies with 500+ employees") presented as derived from closed-won deals | **OPEN** — reachable from `pages/Analytics/Analytics.tsx` |

On #3: agreed it is not for now. AI features are Phase 2 per `CLAUDE.md` and this is one of
them, so the fix is not to make the recommendation real — it is to either remove the block
or label it `PREVIEW · SAMPLE CONTENT` like the gamification panel, so a user cannot mistake
an invented confidence score for a computed one. It is reachable today, which is what makes
it worth tracking. Check the rest of `aiEngine.ts` at the same time; line 128 was found
incidentally while sweeping for `lead-generation` strings, so it is unlikely to be the only
fabricated block in that file.

**The detection rule now lives in `CLAUDE.md`:** a component tree with zero data-fetching
calls is suspected fabricated code, to be reported rather than assumed to be a work in
progress. Grep the tree for `fetch(`, the API clients and the data contexts; a count of zero
across every file means the feature is backed by nothing regardless of how finished the UI
looks. That check is cheap and has now paid for itself three times.

### AUDIT-TOOLING GAP — `grep -rl NotAvailable src/` misses future-tense promises

Found during the CSV import audit (2026-09-02) and worth fixing in how the sweep
is run, not just noting once.

`NotAvailable.tsx` says its own count is the inventory of unfinished work:
"`grep -rl NotAvailable src/` is a live inventory of what is unfinished", and wiring a
feature up means deleting one, so the count only goes down. That is true for every surface
that adopted the convention — and it silently excludes the ones that never did.

`pages/Accounts/AccountImportExport.tsx` was the counter-example. Twelve lines, routed and
reachable at `/crm/accounts/import-export` from the Accounts page's **Import** button, and
its entire body was:

```
<h1>Import & Export</h1>
<p>This component will handle CSV/XLS import and export functionality.</p>
```

No `NotAvailable`, so it appeared in no inventory. It is not fabricated data — it invents
nothing — but it fails in the adjacent way: a **future-tense promise** presented as a
destination. The button works, the navigation succeeds, and the user lands on a page that
says the feature will exist. That reads as "not built yet" to a developer and as "broken"
to a customer, and unlike a dead button it leaves no trace in a grep.

**So add a second pattern to the fabrication sweep.** Alongside the zero-`fetch` check,
grep for the future tense and for placeholder prose:

```
grep -rniE --include="*.tsx" "will (handle|be implemented|support)|coming soon|to be implemented" src/
```

Any hit that is a *rendered string* rather than a comment is a surface making a promise to
a user without the project's own label on it. The fix is the same each time: render
`<NotAvailable>` so it joins the inventory, or build the thing. Comments using the same
words are fine — it is the JSX that lies.

**Calibrated against the tree on 2026-09-02, because an uncalibrated grep is how a
future session wastes a day on 36 non-findings.** It returned 38 hits, and the split
matters more than the total:

| Pattern | Hits | Verdict |
|---|---|---|
| `coming soon` | 36 | **Almost all fine.** Toasts and badges in `BulkActionBar`, `MeetingsPage`, `LeadsPage`, `ComprehensiveDealDetailPage`, `AvailableIntegrationCard`. These are *honest* — they tell the user the thing is not built. They are the opposite of the fake-success-toast defect. High volume, low signal. |
| `will handle` / `to be implemented` | 2 | **This is the signal.** One was a comment; one was `AccountImportExport.tsx`, the finding above. |

So weight the `will (handle|be implemented|support)` family, not `coming soon`. And note
the distinction the counts encode: a control that *says* it does nothing is honest, however
many there are; a page that says the feature is coming while a button routes users to it is
not. Volume is not severity here.

**Password reset is not built.** Blocked on nothing now except a sender domain. Needs, in
order: a `password_resets` table of single-use expiring tokens stored **hashed**; rate
limiting per email and per IP; request + confirm endpoints; two screens. The
`password-reset` email template already exists in `services/email/templates.ts`.

**Resend adapter is UNVERIFIED against a live account.** No sender domain is provisioned,
no test send has been made (by instruction — do not email anyone without an explicit
address and an explicit ask). The request shape follows Resend's documented
`POST /emails`; **the first real send is what confirms it.** `EMAIL_FROM` must be on a
domain with SPF and DKIM.

**Invite delivery is currently a log line.** `EMAIL_TRANSPORT=log` renders the full message
to the log and does **not** deliver. `createInvite` therefore still returns `accept_url` so
an admin can forward it by hand, and reports `email_sent: false`. Once a real transport is
configured, **drop `accept_url` from the response** — a working invite link in an API
payload is a secret in a place it does not need to be. The server refuses to boot on
`EMAIL_TRANSPORT=log` with `NODE_ENV=production`.

**Rate limiting is not production-ready.** In-process memory store: counters reset on
deploy and are not shared across instances, so N instances multiply every budget by N. A
DAST scan against one instance will pass this while a real multi-instance deployment would
not — this is the kind of thing that becomes a CASA finding months later. `store` in
`middleware/rateLimit.ts` is the seam for `rate-limit-redis`.

**~56,000 lines of out-of-scope code remain reachable**, and HRMS / Lead Generation /
Leaderboard are still in the sidebar. Item 4 covers Lead Gen only.

---

## 5. 200 type errors remain — a signal, not noise

`npx tsc -p tsconfig.app.json --noEmit` reports 535 raw; 335 are unused-symbol
(`TS6133`/`6192`/`6198`). **200 are real.**

**Type errors in this project have twice concealed live, user-facing bugs:**

1. `AccountFormPage` read `account.address` when the field is `billingAddress`, and wrote a
   key the payload mapper never read. The account edit form loaded a blank address and saved
   nothing — under a success toast. The compiler had been reporting it all along as 24 lines
   of "noise".
2. Changing `login()` from `Promise<boolean>` to `Promise<LoginResult>` produced **zero**
   errors, because the caller did `if (success)` and `if (object)` is always truthy. Every
   failed sign-in would have looked successful.

**Triage by reachability** — is the file routed? does it touch a real API? — never by error
code. Rough split: 72 unbuilt LeadGen/Settings surfaces, 57 fixture files, ~30 real routed
paths (**these matter**), ~8 dead code, 6 DataContext.

---

## 6. How to run and verify

```
cd Backend  && npm run dev                  # :5001
cd Frontend && npm run dev                  # :5173
cd Backend  && npm run db:migrate           # 26 migrations, ledgered
cd Backend  && npm run db:seed:users        # rotates seeded passwords, prints once
cd Backend  && npm run test:isolation:setup # once — creates bmi_crm_iso_test
cd Backend  && npm run test:isolation       # 18 tests, tenant isolation
cd Frontend && npx vitest run               # 318 tests
```

**Nobody knows the seeded passwords until you run `db:seed:users`** — it prints them once
and stores nothing recoverable. There is no advertised demo account, deliberately.

**Verification standard (earned four times over):** verify through the same entry point a
real user uses — real login, real nav, real session. Not a hand-pasted token, not a direct
URL, not internal state. **If you have to manufacture a credential to make something work,
that is a finding, not a setup step.** Check the database after a write, not the status
code. And verify cleanup by re-counting rows, not by the delete returning without error.

Current clean state: **1 workspace, 5 users, 20 contacts (0 with a
`buying_role`), 15 companies, 25 deals (3 with a `company_id`, 1 `is_test`),
38 leads, 0 activities, 0 `deal_stage_history`, 0 documents, 0 invites.**

`D053` "Demo Company ABC" is flagged `is_test = true`, not deleted, pending a decision.
Restore with `UPDATE deals SET is_test = false WHERE id = 'D053';`
