# BMI2 CRM — Remediation & Completion Plan

This document exists to close the gap between the current BMI2 codebase and the
CRM Engine Engineering Specification (see `/docs/CRM_Engine_Engineering_Specification.md`
if present in this repo — read it for exact field names, endpoint shapes, and
acceptance criteria whenever a phase below references it).

## Ground rules for whoever (human or Claude Code) executes this plan

1. **Work one phase at a time, in order.** Do not start Phase 2 until Phase 1 is
   committed and confirmed working. Each phase should end with a git commit and
   a short plain-language summary of what changed.
2. **Before changing or removing anything, check whether it already exists.**
   Several of the gaps below exist because earlier work added a new column or
   file instead of reusing one that was already there. Search the codebase
   first.
3. **Never silently drop data.** Any migration that changes a column's meaning
   or removes a column must first backfill/migrate the data it holds, and must
   be reversible (keep the old column, marked deprecated, until a human
   confirms it's safe to drop it in a later cleanup pass).
4. **Ask before destructive schema changes** (dropping a column/table,
   renaming a table that other code depends on). Everything else, proceed and
   report back.
5. **After each phase, tell the person plainly**: what changed, what to
   manually test in the running app, and anything you were unsure about or
   skipped.
6. **Stay inside the phase's scope.** Don't refactor unrelated modules (HRMS,
   Meeting, Lead Generation, etc.) while working a CRM phase — they're handled
   separately, later, in Phase 7 onward.

---

## Phase 0 — Safety net (do this first, always)

- Confirm the current working tree is committed to git. If not, commit
  everything as-is before making any change in this plan, so every phase below
  is independently revertable.
- **Fix the JWT secret fallback.** `Backend/src/middleware/auth.ts` currently
  does `jwt.verify(token, process.env.JWT_SECRET || 'secret')`. Remove the
  fallback: if `JWT_SECRET` is not set, the server should fail to start with a
  clear error, not silently sign/verify tokens with the literal string
  `'secret'`. Apply the same fix everywhere a JWT is signed (check for
  `jwt.sign(` calls too).

**Test:** start the backend without `JWT_SECRET` set in `.env` — it should
refuse to start with a clear error message, not run in an insecure fallback
state.

---

## Phase 1 — Multi-tenancy foundation

**Why this is first:** every table in the platform is designed to be
tenant-scoped (see the Blueprint's Trust & Compliance Console and every module
spec). Right now there is no `tenant_id` anywhere in the schema. Adding it now,
with one tenant's worth of data, is a small job. Adding it after more tables
and features assume single-tenant is a rewrite.

1. Add a `tenants` table: `id UUID PK`, `name`, `created_at`.
2. Add `tenant_id UUID NOT NULL REFERENCES tenants(id)` to every existing
   table: `users`, `accounts`, `contacts`, `leads`, `deals`, `pipelines`,
   `pipeline_stages`, `activities`, `tasks`, `quotas`, `forecast_snapshots`,
   and every `lead_*` sub-table (`lead_notes`, `lead_tasks`, `lead_emails`,
   `lead_calls`, `lead_meetings`, `lead_views`, `tags`).
3. Insert exactly one row into `tenants` (e.g., your own organization), and
   backfill every existing row in every table above to that `tenant_id`, so
   nothing currently in the database breaks.
4. Update the JWT payload (`authController.ts` login) to include the
   authenticated user's `tenant_id`.
5. Add a small shared helper (e.g., `withTenant(query, params, tenantId)` or
   similar) and use it in **every** controller query, so every `SELECT`,
   `INSERT`, `UPDATE`, `DELETE` is scoped to `req.user.tenant_id`. Go
   controller by controller (`dealsController.ts`, `contactsController.ts`,
   `companiesController.ts`, `leadsController.ts`, `leadSubController.ts`,
   `usersController.ts`, `quotasController.ts`, `forecastController.ts`) —
   don't skip any.
6. Add a test: attempt to fetch a record belonging to a different
   `tenant_id` and confirm it returns 404, not the record.

**Test:** create a second tenant manually in the database, confirm a user in
tenant A cannot see or modify tenant B's deals/contacts/accounts via the API.

---

## Phase 2 — Reconnect Deals to the relations that already exist

**The problem:** `deals` already has proper foreign keys — `account_id`,
`contact_id`, `stage_id` — defined in the original schema. But
`dealsController.ts` reads and writes `company_name`, `contact_name`,
`contact_email`, `contact_title`, and a free-text `stage` column instead,
which aren't in any tracked migration. This means deal data can silently go
stale relative to the actual Account/Contact records.

1. Search the full schema history (`migrate.ts`, everything in
   `Backend/migrations/`, and the `runMigrations()` function inside
   `Backend/src/index.ts`) to confirm exactly which of `company_name`,
   `contact_name`, `contact_email`, `contact_title`, `stage` (as text),
   `stakeholders`, `competitors` actually exist as live columns today, and
   where they were added.
2. Write a one-time backfill migration:
   - For every deal with a non-null `company_name` and a null `account_id`:
     look up an existing `accounts` row with a matching name in the same
     tenant; if none exists, create one; set `deals.account_id` to it.
   - Do the same for `contact_name`/`contact_email` → `contacts` →
     `deals.contact_id`.
   - Log every row this touches (a simple printed report is fine) so it can
     be spot-checked before moving on.
3. Update `dealsController.ts`:
   - `getDeals` / `getDealById`: join `accounts` and `contacts` (not just
     `leads` as it does now) and return account/contact name via the join,
     not from a stored text column.
   - `createDeal` / `updateDeal`: accept `account_id` / `contact_id` in the
     request body instead of `company_name` / `contact_name` /
     `contact_email` / `contact_title`.
   - Keep the old text columns in place, but stop writing to them from new
     code. Mark them deprecated in a code comment.
4. Update the Frontend's deal creation/edit forms and `dealsApi.ts` /
   `DealPayload` to send `account_id` / `contact_id` (with a search-and-select
   UI against the real accounts/contacts API — reuse `searchCompanies` /
   `searchContacts` from `dealsApi.ts`, which already exist) instead of free
   text fields.
5. Do the same reconnection for `stage` (text) → `stage_id` (FK to
   `pipeline_stages`). This is a bigger change — see Phase 3, which handles
   stage specifically, since stage also needs new validation behavior, not
   just a foreign key swap.
6. **Consolidate migration governance.** Right now schema changes live in
   three places: inline `ALTER TABLE` statements in `migrate.ts`, numbered
   files in `Backend/migrations/` (which has two different files both
   numbered `006` — fix that collision), and a `runMigrations()` function
   inside `index.ts` that runs on every server boot. Pick one pattern —
   recommended: numbered files in `Backend/migrations/`, applied in order by
   a single migration runner, nothing schema-related left inside `index.ts`.
   Migrate every existing inline `ALTER TABLE` (from `migrate.ts` and
   `index.ts`) into properly numbered, ordered files in that folder, so a
   fresh clone + one migration command reproduces the actual current schema.

**Test:** open a deal created before this change and one created after; both
should show the correct account and contact via the join, and editing either
should update the real `accounts`/`contacts` row, not a disconnected text
copy. Run migrations against a completely empty database and confirm it ends
up matching your actual current production schema.

---

## Phase 3 — Deal stage integrity: validation and audit trail

Reference: CRM Engineering Specification, Section 2.1 (`DealStageHistory`),
Section 3.2 (`POST /deals/{id}/stage-transition`), user story US-CRM-006.

1. Add a `deal_stage_history` table: `id`, `deal_id` (FK), `from_stage_id`,
   `to_stage_id`, `changed_by` (FK users, nullable if automated later),
   `reason_code` (text, nullable), `changed_at`.
2. Add a dedicated endpoint `POST /api/v1/deals/:id/stage-transition` that:
   - Accepts `{ to_stage_id, reason_code? }`.
   - Writes a `deal_stage_history` row on every change.
   - Sets `deals.probability` to the new stage's default
     (`pipeline_stages.probability`) **unless** the request explicitly
     includes an override, in which case store the override and note in
     `deal_stage_history` that it was manually overridden.
3. Remove `stage` (and, once Phase 2's FK migration lands, `stage_id`) from
   the generic field list in `updateDeal` — stage changes must go through the
   new dedicated endpoint, not the general-purpose PATCH.
4. Update the Frontend's Kanban drag-and-drop and any other stage-changing UI
   to call the new endpoint instead of a generic deal update.

**Test:** move a deal between stages in the UI; confirm a
`deal_stage_history` row is created, and that the deal's probability updates
to the new stage's default unless you explicitly overrode it.

---

## Phase 4 — Stop calling it AI until it is

`win_prob_ai` is currently set directly from the manually-entered
`probability` field (`win_prob_ai: formData.probability` in
`ComprehensiveDealFormPage.tsx`) — it is not model-derived in any way.

1. Either remove `win_prob_ai` as a duplicate field, or repurpose it honestly:
   default it to the new stage's `pipeline_stages.probability` (see Phase 3),
   clearly labeled in the UI as "stage-based estimate," not "AI." Do not
   present it as AI-powered anywhere in the UI copy until an actual model
   exists.
2. Leave a clear code comment marking this as a placeholder for the real
   non-linear, historically-trained probability model described in the CRM
   spec (Section 5.1) — that model is future work, not part of this phase.

**Test:** confirm nothing in the UI claims AI-driven scoring that isn't
actually happening.

---

## Phase 5 — Wire the frontend to backends that already exist

Some modules already have a working backend that the frontend simply isn't
using — it's running on generated sample data instead (confirmed for
Accounts: `AccountsContext.tsx` imports `generateSampleAccounts` and never
calls the API, despite a working `accounts` table and controller existing).

1. Audit each of the following contexts and confirm whether they call the
   real API or generate sample data: `AccountsContext.tsx`, `DataContext.tsx`,
   `LeadContext.tsx`. Report findings before changing anything.
2. For each one confirmed to be mock-only where a real backend endpoint
   already exists (Accounts is the known case), replace the sample-data
   generation with real API calls, following the same pattern already used
   successfully in `dealsApi.ts`.
3. Where no real backend exists yet for what the frontend expects (this is
   expected for Meeting, HRMS, Lead Generation/Sequences, Prospects), leave
   the mock data in place **and clearly comment the file** to say so, e.g.
   `// MOCK DATA — no backend yet, see Phase 7 / respective module spec`.
   Do not silently leave this ambiguous.

**Test:** refresh the Accounts page after this phase — data should now
persist across refreshes and reflect real database state, not reset to
generated samples.

---

## Phase 6 — Repo hygiene

1. Move every root-level `*_COMPLETE.md`, `*_TEST_REPORT.md`,
   `*_VISUAL_REFERENCE.md`, `*_QUICK_TEST.md` and similar one-off
   per-feature files (there are ~479 of them) into `/docs/archive/`. Don't
   delete them — just get them out of the repo root.
2. Going forward, use a single running `DEVLOG.md` (or similar) for
   feature-completion notes instead of generating a new markdown file per
   feature. Note this convention at the top of that file.

**Test:** repo root should be readable at a glance after this phase.

---

## Phase 7 — Complete the remaining CRM spec pages (after Phases 0–6 are solid)

Only start this once the foundation above is in place — building more pages
on an ungrounded foundation just repeats the same problem at larger scale.

Reference `/docs/CRM_Engine_Engineering_Specification.md` Section 5.2 for
exact page-by-page detail. Priority order, matching that document's MVP
tagging:

1. **Home / Sales Workspace** — "what changed since last login" digest,
   priorities list, and an AI Queue *UI shell* (confidence-scored
   accept/edit/reject pattern) that can start wired to simple rule-based
   suggestions before any real ML exists — the interaction pattern matters
   more right now than the model behind it.
2. **Leads (in CRM context)** — confirm `POST /leads/{id}/convert` exists and
   creates/matches Account + Contact + Deal atomically in one transaction
   (spec Section 3.2, US-CRM-013). If it doesn't exist yet, build it.
3. **Account 360** — once Phase 5 wires Accounts to real data, add the
   combined view (open deals, contacts, activity timeline) described in
   spec Section 5.2.
4. **Deal Closing Guidance** — spec Section 4.7/5.4. This depends on the AI
   Meeting Agent and Revenue Intelligence modules existing, which they don't
   yet — treat this as a later milestone, not a Phase 7 task.

Do not attempt to build Lead Generation, AI Meeting Agent, Customer Success,
or any other module's *backend* as part of "completing the CRM" — those are
separate, larger efforts with their own specifications, to be scoped and
planned individually when you're ready to start them.
