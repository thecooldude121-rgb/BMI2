# BMI2 CRM Remediation — Ready-to-Paste Claude Code Prompts

Use these one at a time, in order. Paste exactly one phase's prompt, let
Claude Code finish and give you its summary, actually test what it tells you
to test, then move to the next prompt. Don't paste the next one until you've
looked at the current one's result.

Each prompt assumes `CRM_REMEDIATION_PLAN.md` is sitting in your repo root.

---

## Phase 0 — Safety net

```
Read CRM_REMEDIATION_PLAN.md in the repo root. Execute Phase 0 only
("Safety net"). Specifically:
1. Confirm the current working tree is fully committed to git. If not,
   commit everything as-is first, before making any other change.
2. Fix the JWT secret fallback in Backend/src/middleware/auth.ts, and check
   for the same pattern anywhere else jwt.sign or jwt.verify is called with
   a hardcoded fallback secret. The server should fail to start with a clear
   error if JWT_SECRET is missing from the environment — it must never
   silently sign or verify tokens using a default/fallback secret.

Do not touch anything else in the codebase.

When finished, commit with a clear message, then stop and tell me:
(a) exactly what changed and in which files,
(b) how I can manually verify it (e.g., what happens if I remove JWT_SECRET
    from .env and restart the server),
(c) anything you found along the way that wasn't in the plan.

Wait for me to say "continue" before doing anything else.
```

---

## Phase 1 — Multi-tenancy foundation

```
Read CRM_REMEDIATION_PLAN.md in the repo root. Execute Phase 1 only
("Multi-tenancy foundation").

Before writing any code, search the full schema history — migrate.ts, every
file in Backend/migrations/, and the runMigrations() function inside
Backend/src/index.ts — and list every table that currently exists. Report
this list to me first so I can confirm nothing is missing before you
proceed.

Then:
1. Add a tenants table (id, name, created_at).
2. Add tenant_id (UUID, NOT NULL, references tenants) to every existing
   table listed in the plan.
3. Insert exactly one tenant row and backfill every existing row in every
   table to that tenant_id, so nothing currently in the database breaks.
4. Update the JWT payload (in the login flow) to include the authenticated
   user's tenant_id.
5. Add a small shared helper for tenant-scoped queries, and use it in every
   controller so every SELECT/INSERT/UPDATE/DELETE is scoped to
   req.user.tenant_id. Go through each controller file one at a time
   (dealsController, contactsController, companiesController,
   leadsController, leadSubController, usersController, quotasController,
   forecastController) and tell me as you finish each one.

Do not touch frontend code or any module outside this backend scoping work
in this phase.

When finished, commit, then stop and summarize:
(a) which controllers you updated and confirmed are tenant-scoped,
(b) a concrete way for me to test that tenant isolation actually works
    (e.g., how to create a second tenant and confirm it can't see the
    first tenant's data),
(c) anything ambiguous you had to make a judgment call on.

Wait for me to say "continue" before doing anything else.
```

---

## Phase 2 — Reconnect Deals to the relations that already exist

```
Read CRM_REMEDIATION_PLAN.md in the repo root. Execute Phase 2 only
("Reconnect Deals to the relations that already exist").

Follow these steps in order:
1. Search migrate.ts, every file in Backend/migrations/, and index.ts's
   runMigrations() to confirm exactly which of these columns exist today on
   the deals table, and where each was added: company_name, contact_name,
   contact_email, contact_title, stage (as text), stakeholders,
   competitors. Report this to me before changing anything.
2. Write and run the one-time backfill migration described in the plan
   (match deals to existing accounts/contacts by name, creating new
   account/contact records where none match, and populate deals.account_id
   / deals.contact_id). Print or log a report of every row it touches so I
   can spot-check it before we move on.
3. Update dealsController.ts: join accounts and contacts for reads instead
   of using the stored text columns; accept account_id / contact_id in
   create and update instead of the free-text fields. Keep the old text
   columns in the table — just stop writing to them from new code, and mark
   them deprecated in a comment.
4. Update the frontend's deal creation/edit forms and dealsApi.ts to send
   account_id / contact_id, using a search-and-select UI built on the
   existing searchCompanies / searchContacts functions that are already in
   dealsApi.ts.
5. Consolidate all schema migrations into one ordered set of numbered files
   in Backend/migrations/ — fix the duplicate "006" numbering, and move any
   schema-changing code out of index.ts into that numbered sequence.

Do not touch the stage / stage_id reconnection in this phase — that is
Phase 3, handled separately because it also needs new validation behavior.

When finished, commit, then stop and summarize:
(a) what the backfill migration touched (counts are fine, don't need to
    list every row),
(b) how I can verify that both an old deal and a newly created deal show
    correct account/contact info via the join,
(c) anything you weren't sure how to resolve.

Wait for me to say "continue" before doing anything else.
```

---

## Phase 3 — Deal stage integrity: validation and audit trail

```
Read CRM_REMEDIATION_PLAN.md in the repo root, and if
/docs/CRM_Engine_Engineering_Specification.md exists, also read its
Section 2.1 (DealStageHistory), Section 3.2 (the stage-transition endpoint),
and user story US-CRM-006 for exact detail.

Execute Phase 3 only ("Deal stage integrity: validation and audit trail").
1. Add a deal_stage_history table (deal_id, from_stage_id, to_stage_id,
   changed_by, reason_code, changed_at).
2. Add a dedicated endpoint POST /api/v1/deals/:id/stage-transition that
   accepts { to_stage_id, reason_code? }, writes a deal_stage_history row on
   every change, and sets the deal's probability to the new stage's default
   (pipeline_stages.probability) unless the request explicitly includes an
   override — in which case store the override and note in
   deal_stage_history that it was manually overridden.
3. Remove stage / stage_id from the generic field list in updateDeal —
   stage changes must go through the new dedicated endpoint only, not the
   general-purpose PATCH.
4. Update the frontend's Kanban drag-and-drop (and any other UI that changes
   a deal's stage) to call the new endpoint instead of a generic deal
   update.

Do not change anything related to win_prob_ai in this phase — that is
Phase 4.

When finished, commit, then stop and summarize:
(a) what changed,
(b) how I can test it (move a deal between stages in the UI and confirm a
    deal_stage_history row was created, and that probability updated
    correctly),
(c) anything unresolved.

Wait for me to say "continue" before doing anything else.
```

---

## Phase 4 — Stop calling it AI until it is

```
Read CRM_REMEDIATION_PLAN.md in the repo root. Execute Phase 4 only
("Stop calling it AI until it is").

win_prob_ai is currently just a direct copy of the manually-entered
probability field (set as win_prob_ai: formData.probability in
ComprehensiveDealFormPage.tsx) — it is not model-derived in any way.

Either remove win_prob_ai as a redundant duplicate field, or repurpose it to
default from the new stage's probability (from Phase 3) with clear UI
labeling as a "stage-based estimate" rather than "AI." Do not present
anything as AI-powered in the UI unless it is actually happening.

Add a code comment marking this as a placeholder for the real,
historically-trained, non-linear probability model described in the CRM
spec Section 5.1 — that model is future work, not part of this phase.

When finished, commit, then stop and summarize what you changed and where
the placeholder comment lives.

Wait for me to say "continue" before doing anything else.
```

---

## Phase 5 — Wire the frontend to backends that already exist

```
Read CRM_REMEDIATION_PLAN.md in the repo root. Execute Phase 5 only
("Wire the frontend to backends that already exist").

First, audit AccountsContext.tsx, DataContext.tsx, and LeadContext.tsx and
report to me, for each one:
(a) whether it currently calls a real API or generates sample/mock data,
(b) whether a real backend endpoint already exists for that data.

Stop after this audit and wait for my confirmation before changing anything
— I may want to prioritize differently once I see what you find.

Once I confirm: for any context using mock data where a real backend
already exists (Accounts is the known case), replace the sample-data
generation with real API calls, following the same pattern already used in
dealsApi.ts. For anything with no real backend yet, leave the mock data in
place, but add a clear comment marking it as mock data with no backend yet.

When finished, commit, then stop and summarize what's now backed by real
data vs. still mock, and how I can verify it (e.g., refresh the Accounts
page and confirm data persists instead of resetting to sample data).

Wait for me to say "continue" before doing anything else.
```

---

## Phase 6 — Repo hygiene

```
Read CRM_REMEDIATION_PLAN.md in the repo root. Execute Phase 6 only
("Repo hygiene").

Move every root-level *_COMPLETE.md, *_TEST_REPORT.md,
*_VISUAL_REFERENCE.md, *_QUICK_TEST.md, and similar one-off per-feature
markdown files into /docs/archive/ — do not delete them, just relocate them
out of the repo root. Use your judgment on which root-level docs are living
references rather than one-off completion reports (e.g., README,
API_DOCUMENTATION.md) and leave those in place — tell me what you decided to
keep at root and why.

Create a single DEVLOG.md at the repo root for future feature-completion
notes, with a short note at the top establishing that convention going
forward instead of generating a new markdown file per feature.

When finished, commit, then tell me how many files you moved and what you
kept at root.

Wait for me to say "continue" before doing anything else.
```

---

## Phase 7a — Home / Sales Workspace

```
Read CRM_REMEDIATION_PLAN.md in the repo root, and if
/docs/CRM_Engine_Engineering_Specification.md exists, read its Section 5.2
("Home / Sales Workspace") and the related user stories in Section 4.1 for
exact detail.

Build the Home / Sales Workspace page: a "what changed since last login"
digest, a prioritized task list, and an AI Queue UI shell using the
confidence-scored accept/edit/reject pattern described in the spec. The AI
Queue can start wired to simple rule-based suggestions (not real ML) —
the interaction pattern (accept/edit/reject, never auto-applied) matters
more right now than the model behind it. Be clear in the UI and in code
comments that suggestions are rule-based for now, not AI-driven, consistent
with how we handled win_prob_ai in Phase 4.

When finished, commit, then summarize what you built and how to test it.

Wait for me to say "continue" before doing anything else.
```

---

## Phase 7b — Lead conversion

```
Read CRM_REMEDIATION_PLAN.md in the repo root, and if
/docs/CRM_Engine_Engineering_Specification.md exists, read Section 3.2 and
user story US-CRM-013 for exact detail.

First, check whether POST /leads/{id}/convert already exists anywhere in
the backend. Report what you find before doing anything else.

If it doesn't exist, or exists but doesn't do this: build it so that
converting a lead creates or matches an Account, a Contact, and a Deal in
a single transaction, and marks the original lead as converted with a link
to the resulting deal. If the lead's email matches an existing contact,
prompt for a merge rather than silently creating a duplicate.

When finished, commit, then summarize what you built or changed and how to
test it.

Wait for me to say "continue" before doing anything else.
```

---

## Phase 7c — Account 360

```
Read CRM_REMEDIATION_PLAN.md in the repo root, and if
/docs/CRM_Engine_Engineering_Specification.md exists, read Section 5.2
("Accounts") for exact detail.

This depends on Phase 5 already being done (Accounts wired to real data) —
confirm that's the case before proceeding, and stop to tell me if it isn't.

Build the Account 360 view: an account's open deals, linked contacts, and a
combined activity timeline, all on one page, sourced from the real
accounts/contacts/deals/activities data.

When finished, commit, then summarize what you built and how to test it.

Wait for me to say "continue" before doing anything else.
```

---

## Not yet — Deal Closing Guidance

Do not ask Claude Code to build this yet. It depends on the AI Meeting Agent
and Unified Revenue Intelligence modules, which don't exist in this codebase
yet. Revisit once those are underway.
