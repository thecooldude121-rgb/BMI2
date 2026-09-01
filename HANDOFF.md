# Handoff — read before starting work

## BLOCKING — do not rebase remediation/phases-0-2 onto main until this is done

main carries merged PRs #1 (user/venkat/crmsettingmodule) and #3 (user/radhar10/test)
that landed while this branch was removing fabricated data and Supabase code. Both must
be audited BEFORE rebase, because rebasing silently absorbs whatever they contain.

Audit must answer, for each PR:
- Does it query the backend API, or reintroduce direct-DB / Supabase access?
  (CLAUDE.md forbids the frontend querying the database directly.)
- Does it contain fabricated data? Apply the FABRICATED_DATA_AUDIT.md test: component
  trees rendering business data with zero fetch calls, hardcoded literals, mock arrays.
- Does it conflict with the 118-file deletion or the LeadContext rewrite?

If the audit is skipped, the entire fabricated-data and Supabase removal effort can be
undone by a merge without anyone noticing.

### AUDIT COMPLETE — findings below. Decision to lift this block is the owner's.

**The headline is reassuring, and the branch names are lying.** Nothing hostile landed. But
do not rebase on the assumption that main contains a new module, because it does not.

**PR #1 `user/venkat/crmsettingmodule` — despite the name, contains NO settings module.**
It is *this branch's own error-swallowing sweep*, committed by someone else and merged.
Four files, and they are exactly the sweep's four: `utils/leadsApi.ts` (385 lines),
`contexts/LeadContext.tsx` (166), `pages/CRM/AddLeadPage.tsx` (16), `utils/dealsApi.ts` (8).
Verified by content, not by diffstat coincidence: it contains the `errorMessage()` helper
(26 references), `guardRead`/`guardWrite` (29 references), and the distinctive comment
"One place that turns a rejected response into a message worth showing" verbatim. The branch
tip commits are named "commit commit" and "check the local".
- Backend API vs Supabase: **neither reintroduced.** It touches only those four files.
- Fabricated data: **none.** It is the opposite — it removes swallowed errors.
- Conflict: it is an **earlier snapshot of the same work** now committed here as `d684943`.
  A rebase will conflict on all four files, and the resolution is "take this branch": the
  local version is a strict superset, adding the `useLeadActions` and
  `LeadDetailPage.applyStatusChange` caller fixes that PR #1 does not have.

**PR #3 `user/radhar10/test` — a single trailing space.** The entire diff is one whitespace
character added after `name: string;` in `contexts/AuthContext.tsx`. Zero functional change,
nothing to audit.

**`4e2e33b` "Add CRM remediation plan and spec docs"** — 1,201 lines across
`CRM_REMEDIATION_PLAN.md`, `CRM_REMEDIATION_PROMPTS.md` and
`docs/CRM_Engine_Engineering_Specification.md`. **Already in this branch's history** (it is
an ancestor of the merge-base), so it is not incoming work. Zero Supabase mentions in all
three.

**What main actually is: behind this branch, not ahead of it.** Merge-base is `a00c673`.
Since then main added only the four sweep files and the one-space AuthContext change. The
267 files that exist on main but not here are **the files this branch deleted** — the
118-file Lead Generation removal plus `LoginWireframe.tsx` and the Supabase client surface.
`main` still has `Frontend/src/lib/supabase.ts`; this branch stripped it. So the risk is the
reverse of what was feared: a careless merge in the *other* direction (this branch into main,
or main's state winning a conflict) would resurrect the deleted code. A rebase of this branch
onto main is safe on that count, because the deletions are recorded as commits here.

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

### CORRECTION — the status/stage vocabulary mismatch breaks TWO more features

Found by the error-swallowing sweep, which is the point of it: these were invisible while
every failure returned null. **Both are one-line-ish fixes but they are behaviour changes,
so they are recorded, not fixed.**

The root cause is one asymmetry. `updateLeadViaAPI` maps `status` -> `stage` before sending
(`leadsApi.ts`, and it must, because the frontend's `Lead.status` carries the *stage*
vocabulary while the DB's `leads.status` is `active|inactive|nurturing`). **`createLeadViaAPI`
does not do that mapping.** Everything downstream follows from that.

**1. Creating a lead from the Add Lead form has NEVER worked.**
`AddLeadPage.tsx:146` sends `status: 'new'`. Unmapped, that hits the controller's `status`
validator and returns **400 `status must be one of: active, inactive, nurturing`**. Verified
through the real form: nothing was written, `leads` stayed at 38. Before the sweep the page
caught the null, reset itself, and showed nothing at all. The fix is to give
`createLeadViaAPI` the same `status` -> `stage` mapping `updateLeadViaAPI` already has —
but confirm that is the intended direction before applying it.

**2. Most of the lead status dropdown is rejected.**
`LeadDetailPage`'s dropdown offers the frontend vocabulary — New, Assigned, Enriching,
Attempting Contact, Engaged, Qualified, Sales Accepted, Nurture, Disqualified, Converted,
Lost. `VALID_STAGES` is `new, contacted, qualified, proposal, won, lost`. So **Assigned,
Enriching, Attempting Contact, Engaged, Sales Accepted, Nurture, Disqualified and Converted
all 400.** Only New, Qualified and Lost can succeed. Verified live: picking "Assigned"
returns 400 and leaves `stage = new`.

This needs a decision, not a patch: either the DB stage vocabulary grows to match the
product's lead lifecycle (a migration plus the CHECK constraint), or the dropdown is
narrowed to what the backend accepts. `EARLY_STAGES` in `LeadDetailPage.tsx:127` already
hardcodes the richer vocabulary, so the frontend was built for the former.

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


### Fabricated data still in the tree — three finds, one pattern

Tracked here rather than mentioned in passing, because this is now a **recurring class of
defect in this codebase, not three coincidences**. Each was a finished-looking surface with
nothing behind it, and each was initially read as unfinished work rather than as fabrication.

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

Current clean state: **1 workspace, 5 users, 20 contacts, 15 companies, 25 deals
(1 `is_test`), 38 leads, 0 activities, 0 invites.**

`D053` "Demo Company ABC" is flagged `is_test = true`, not deleted, pending a decision.
Restore with `UPDATE deals SET is_test = false WHERE id = 'D053';`
