# Fabricated data audit — repo-wide, deliberate

**Report only. Nothing was changed, deleted or fixed.** Run against `04e9219` on
`remediation/phases-0-2`, working tree clean.

Prior finds were all incidental — the CRM dashboard widgets, the second Deals implementation,
the ReportsPage stat cards, and `aiEngine.ts:128`. This is the first pass that went looking.

**Headline: 21 findings. The four prior finds were symptoms, not the disease.**
`contexts/DataContext.tsx` is a fabricated-data provider wired into `App.tsx`, and it is the
common cause behind roughly half of everything below. `useDashboardData.ts:26` already names
the mechanism in a comment: *"a context is what let sample data spread to eighteen files
unnoticed in the first place."*

Two of the four prior finds turn out to be **incompletely remediated**, and the flagged
`aiEngine.ts:128` turns out to be **dead**, while a different line in that same file is live.

---

## Method, and what each pass was good for

1. **Route-target reachability.** Resolved every relative import in `Frontend/src` (537 files;
   only `main.tsx → ./index.css` unresolved) into a graph, then BFS from `main.tsx`/`App.tsx`.
   Parsed all 71 `<Route>` declarations across the four router files (`App.tsx`, `CRMModule`,
   `HRMSModule`, `AccountsModule`) and mapped each to its page file. For each route target,
   propagated "does this subtree reach a `fetch()`" transitively.
2. **Naming-pattern grep** for `mock*`, `sample*`, `dummy*`, `fake*`, `generate*Data`.
3. **Literal scan** for currency and percentage literals rendered in JSX, then read each hit
   in context to separate live JSX from remediation comments.
4. **`utils/aiEngine.ts` read end to end**, as instructed, not just line 128.
5. **Backend swept too**, since the brief said repo-wide.

**One methodological correction worth recording.** My first zero-fetch pass flagged 82 pages,
including `pages/CRM/DealsListView.tsx` — which is the *live, real* deals list. It receives
data as **props** from the fetching `DealsKanbanPage`. Import-graph analysis cannot see prop
flow. So the zero-fetch test is only trustworthy on **route targets**, which have no parent to
hand them data. Every verdict below is anchored on a route target or on a direct literal read.

---

## Tier 1 — Reachable, unlabelled, and misleading

Ordered by blast radius.

### F1 · `contexts/DataContext.tsx:223–252` — the vector
**Fabricates:** ten entity collections, wholesale — `leads`, `companies`, `contacts`,
`activities`, `emailTemplates`, `sequences`, `deals`, `tasks`, `employees`, `meetings`, all
seeded from `generateSampleData()` (`utils/sampleData.ts`, 434 loc) plus `utils/sampleDeals.ts`
(104 loc). **The file contains no `fetch` call of any kind.** It is pure in-memory invented
state, and it is mounted in `App.tsx`.

Someone knew in part: a comment at line 225 says sample deals *"do NOT appear on the Kanban
board, which fetches exclusively from the real API."* That carve-out is real and holds — I
verified `/crm/deals` renders genuine DB rows. But it protects exactly one consumer. Every
other reader of `useData()` gets fabrication:

| Consumer | Reads | Routed at |
|---|---|---|
| `pages/Analytics/Analytics.tsx:8` | leads, deals, tasks, employees | `/analytics` |
| `pages/CRM/GamificationPage.tsx:97` | leads, deals, tasks, employees | `/crm/gamification` |
| `pages/Calendar/Calendar.tsx:7` | meetings, leads, employees | `/calendar` |
| `pages/HRMS/EmployeesPage.tsx:6` | employees | `/hrms/employees` |
| `pages/HRMS/AttendancePage.tsx:17` | employees | `/hrms/attendance` |
| `pages/HRMS/ReportsPage.tsx:6` | employees, tasks | `/hrms/reports` |
| `components/Leads/LeadConversionWizard.tsx:287` | contacts | inside the **live** `/crm/leads` |

`LeadConversionWizard` is the one that should worry you most: it sits inside the genuinely-real
Leads module and uses fabricated `contacts` for duplicate matching, so a real lead can be
checked for duplicates against invented people.

Two consumers are harmless — `components/CRM/CompanyForm.tsx:12` and
`pages/Deal/ComprehensiveDealFormPage.tsx:48` take only mutators (`addCompany`, `addDeal`).

**Disposition: wire to real data.** This is not a delete — it is the app's data provider, and
`hooks/useDashboardData.ts` is the proven pattern to copy (it fetches from five real API
modules and is deliberately *not* a context, for precisely this reason). Until it is rewired,
every page in that table is showing invented data.

### F2 · `pages/CRM/ReportsPage.tsx:664–1100+` — prior find, only half fixed
**Fabricates:** the report catalogue. **33 `<ReportCard>`s, 30 with a hardcoded `updated="5m"`
freshness stamp, 19 with fixed Unicode sparklines**, and dozens of invented metrics:
`'$847K Revenue'` / `'+12% ⬆️'`, `'89% to quota'`, `'Alex: $342K #1'`, `'Sarah: $298K #2'`,
`'Mike: $207K #3'`, `'Dec: $2.4M +14%'`, `'Accuracy: 89%'`, `'Correlation: 87%'`.

The page's **top stat cards were correctly remediated** — the comment at lines 179–183
documents the old `$847,000 / 23 Deals / $2.4M / 68%` literals and their replacement with real
values, and `useDashboardData` genuinely fetches. The catalogue below was left untouched with
the same numbers. Two aggravating details: `Alex` / `Sarah` / `Mike` are the **real seeded user
names**, and `updated="5m"` asserts freshness. There is no PREVIEW label anywhere on the page.
`$2.4M` is the exact figure `CLAUDE.md` names as a known fabricated literal — it survives here.

**Disposition: label as preview** (the cards advertise reports that do not exist yet, so
labelling is honest and cheap), **or delete the catalogue**. Do not leave `updated="5m"`.

### F3 · `pages/CRM/AICopilotPage.tsx` — 1,207 lines of scripted "AI"
**Fabricates:** an entire pre-written AI conversation. 85 currency literals, 43 percentages.
Specimens: `value: '$50K'` (138), `'HRMS Connection (92% AI Score) - WARM LEAD'` (168),
`'High close probability (85%)'` (174), `'These 3 deals represent $187K in pipeline value with
84% average close probability. Focusing here could close $157K this month.'` (217), and a full
forecast script — `**Target:** $250,000`, `**Progress:** $127,500 closed (51% of target)`,
`**Gap:** $122,500 needed`, then `Scenario 1: Conservative (70% confidence)` /
`Moderate (55%)` / `Optimistic (30%)` (258–278). Named individuals ("Emily", "Robert").

Routed at `/crm/ai-copilot`, zero fetch in the entire subtree. Presented as a working copilot
reporting on your pipeline. Also `AI features are Phase 2` per `CLAUDE.md`, so this is
out-of-phase as well as invented.

**Disposition: delete.** Labelling a 1,200-line scripted dialogue as "preview" does not make
it useful, and it is out of phase regardless.

### F4 · `contexts/AccountsContext.tsx:127–133` + `:493` → `EnhancedAccountDetailView.tsx:36`
**Fabricates:** seven collections on the accounts side — `activities`, `notes`, `documents`,
`accountContacts`, `accountDeals`, `views`, `workflows` — from `generateSampleAccounts()`
(`utils/sampleAccountsData.ts`, 386 loc).

This one is the most deceptive shape in the report, because the page is **partially migrated**.
`accounts` itself starts `[]` and is fetched via `utils/accountsApi`. A comment at
`EnhancedAccountDetailView.tsx:38` records that contacts and activities *were* moved to real
endpoints (`/contacts?account_id=`, `/activities?company_id=`). But line 36 still calls
`getAccountDeals(accountId)`, which at `AccountsContext.tsx:493` filters the sample-seeded
`accountDeals`. **So on `/accounts/:accountId`, the Related Deals panel is invented while the
contacts and activities beside it are real** — the real panels lend credibility to the fake one.

`CLAUDE.md` lists "Companies / Accounts — account detail, related deals" as in-scope Phase-1
work, so this is a gap in committed scope, not a future feature.

**Disposition: wire to real data.** `utils/dealsApi.ts` already exists; deals carry
`company_id`. This is a small, well-defined fix.

### F5 · `utils/aiEngine.ts` — the flagged line is dead; a different one is live
Audited end to end as instructed, and the result inverts the original note.

- **`aiEngine.generateRecommendations()` (lines 92–150) is never called.** Confirmed: the only
  invoked methods anywhere in the repo are `aiEngine.scoreLeadFit` and
  `aiEngine.predictDealOutcome`. The `generateRecommendations` hits in `utils/leadScoring.ts`
  are an unrelated private method of a different class. So **`confidence: 0.85` at line 122
  — the `:128` originally flagged — renders nothing today.** It is dead code inside a live
  file, along with its siblings `confidence: 0.9` (105) and `0.8` (144). *Worth noting the
  middle one is the most dishonest of the three even so: its description, "Based on your
  closed-won deals, focus on Healthcare and Technology sectors", is a fixed string gated only
  on `wonDeals.length > 0` — it never reads the deals it cites.*
- **What IS live:** the invented persona table at lines 23–56 — three personas with fabricated
  `avgDealValue` (150000 / 75000 / 100000), `conversionRate` (0.35 / 0.28 / 0.32) and
  `avgSalesCycle` (90 / 120 / 75). These are invented industry benchmarks, and
  `scoreLeadFit()` reads them at line 63 (`this.personas.find(...)`, then `score += 20` and
  `+= 15`). `scoreLeadFit` is rendered at `Analytics.tsx:18`.
- **Also live:** `predictDealOutcome` (210) is rendered at `Analytics.tsx:213–225` under an
  **"AI Predictions"** heading, printing `{prediction.probability}%` and "Expected close: N
  days". To be fair to it, the arithmetic is derived from its inputs, not from the personas —
  but its inputs are DataContext's fabricated deals (F1), so the output is invented either
  way, and "AI Predictions" describes arithmetic on `deal.probability`. It also divides by
  `similarDeals.length` with no zero guard, so an empty pipeline yields `NaN`.
- Minor: `winRate` (220) is computed and never used.

**Disposition: delete `generateRecommendations` outright** (dead, no UI to label). **Label or
remove the Analytics "AI Predictions" panel** — Phase-2 AI, and it cannot be honest while F1
stands.

### F6–F13 · Routed pages with zero data calls and invented figures
All are route targets, all have zero `fetch` in their entire import subtree, none carry a
PREVIEW label. Grouped because the disposition is the same for each.

| # | File | Route | Sample of what it invents |
|---|---|---|---|
| F6 | `pages/CRM/ReportDetailView.tsx` (1,202 loc) | `/crm/reports/:reportSlug` | `$2.4M`, `$847,000`, `12.5%` — same figures as F2 |
| F7 | `pages/CRM/CustomReportBuilder.tsx` (2,222 loc) | `/crm/custom-report-builder` | `$892K`, `$49.6K`, `$75K`, `38%` |
| F8 | `pages/CRM/AIResponseDetailView.tsx` (984 loc) | `/crm/ai-copilot/response/:id` | `$95K`, `$80K`, `$42K` |
| F9 | `pages/Team/TeamMemberDetailPage.tsx` (3,221 loc) | `/team/:memberId` | `$215,000`, `$120K`, **`$120M`**, 24 array literals |
| F10 | `pages/Team/TeamPerformancePage.tsx` (755 loc) | `/team` | `$1.2M`, `$450K`, `$315K`, `$280K` |
| F11 | `pages/CRM/GamificationLeaderboard.tsx` (734 loc) | `/crm/gamification/leaderboard` | `$1.5M`, `$1.2M`, `$680K`, `$590K` |
| F12 | `pages/Activity/ComprehensiveActivityFeed.tsx` (1,080 loc) | `/crm/activities/all` | `$5M`, `$75K`, `$50,000`, `$42,000` |
| F13 | `pages/CRM/MeetingsPage.tsx` (1,275) + `MeetingDetailPage.tsx` (2,811) | `/crm/meetings`, `/crm/meetings/:id` | fed by `utils/sampleMeetingsData.ts` (333 loc); MeetingDetailPage adds 19 percentage literals |

F11 deserves a specific note: the *same* gamification content is correctly labelled
"Preview · sample content" on `CRMDashboard`, but the dedicated leaderboard page it links to
carries no label at all and adds invented revenue figures. The label was applied to the panel
and not to the page behind it.

**Disposition: label as preview** for anything you intend to build (Team, Gamification,
Meetings, Activity feed); **delete** F7/F8 and the report-detail view if reporting is not being
built this phase. Every one of these is out of the Phase-1 page list in `CLAUDE.md`.

### F14 · `pages/Accounts/TechStartDetailView.tsx` (1,103 loc) ← `utils/techstartMockData.ts` (818 loc)
**Fabricates:** an entire named customer account — "TechStart" — with its own 818-line data
file. Reachable through the accounts module. This is a single fake company presented as a real
account record. **Disposition: delete.** It is a demo fixture living in the product.

**RESOLVED — both files deleted with the F25 account-detail rebuild.** Two details found on
the way out that the original entry did not capture, and both sharpen the finding:

1. **How it was reachable was worse than "through the accounts module".** `AccountsModule`
   special-cased a single hardcoded id — `if (accountId === 'ACC-2024-0089') return
   <TechStartDetailView />` — so the fake company sat behind one specific URL on a public
   route, for an id format this database does not use (real company ids are `C001`..`C015`).
   A reader of the route table sees `/:accountId -> AccountDetailRouter` and has no reason
   to suspect a second detail page hides inside it.
2. **Zero data calls across 1,103 lines** — no `fetch`, no API client, no context import.
   That is the detection rule in `CLAUDE.md` firing again, and it makes this the **third**
   whole feature in this repo backed entirely by literals, after the six-widget dashboard
   and the second Deals implementation at `/lead-generation/deals`. All three read as
   unfinished work; all three were finished, and fake.

The route now goes straight to `EnhancedAccountDetailView` for every id.

### F15 · `pages/CRM/CRMSettings/TeamManagement.tsx` (1,081 loc) ← `utils/teamManagementMockData.ts` (959 loc)
**Fabricates:** a full team roster with roles and permissions. Inside `CRMSettings/`, which
`HANDOFF.md` §2 already marks as dead code awaiting the Settings rebuild.
**Disposition: delete with the Settings trees** — already sequenced, no separate action.

### F16 · `pages/CRM/MeetingTranscriptViewer.tsx` (796 loc) ← `utils/meetingTranscriptMockData.ts` (768 loc)
**Fabricates:** a complete invented meeting transcript. Routed at
`/crm/meetings/:meetingId/transcript`. Meeting Agent is an explicitly future module in
`CLAUDE.md`. **Disposition: delete.**

### F17 · `utils/leadAdapters.ts:163` — an invented formula, not invented data
`const confidenceScore = Math.round(overallScore * 0.15)`. The `0.15` has no stated basis; this
is a confidence score conjured by multiplying another score by an arbitrary constant, then
surfaced as `confidenceScore` on the lead domain object. Borderline for this audit — the
*pipeline* is real, the *number* is meaningless. Flagging because "confidence" implies a
statistical claim. **Disposition: wire to real data or rename** so it does not read as a
computed confidence.

---

## Tier 2 — Backend

### F18 · `Backend/src/controllers/leadSubController.ts:485`
`confidence: 0.7` returned as a literal from `enrichLead`. The rest of that response echoes
real DB columns and the query is correctly tenant-scoped, so this is one invented field in an
otherwise honest handler. I found **no frontend consumer** reading the `confidence` field off
the enrich response, so it is not currently rendered.

Otherwise **the backend is clean**: no mock/sample/fake generators outside `seed`/`scripts`, no
`Math.random()` in any response path, no other hardcoded confidence/score/probability.

**Disposition: delete the field** (or return `null`) — cheap, and it stops a fake number
becoming real the moment someone renders it.

---

## Tier 3 — Dead code (unreachable; lowest priority)

Eight non-test files are unreachable from `main.tsx`/`App.tsx`. Fabrication-relevant ones:

| # | File | Note |
|---|---|---|
| F19 | `pages/CRM/CompaniesPage.tsx` (231 loc) | **not routed**; reads `companies, contacts, leads` from the fabricated `useData()` |
| F20 | `components/CRM/CompanyForm.tsx` (300 loc) | unreachable; mutator-only, so no fabrication of its own |
| F21 | `components/Permissions/{SharingRuleBuilder,UserGroupManagement,WhatIfSimulator}.tsx` (1,351 loc) | unreachable; two of these are also Supabase importers per `HANDOFF.md` §3 |

**Disposition: delete**, but sequence with the Settings rebuild — `components/Permissions/`
overlaps the Supabase footprint already tracked in §3.

---

## Already handled — recorded so nobody re-flags them

- **`pages/CRM/CRMDashboard.tsx`** — two panels properly labelled `Preview · sample content`
  (lines 531, 587) with explicit "these are not calculated from your data" / "not your data"
  notes. `gamificationData.teamCelebrations` (256) renders at line 798 **inside** the labelled
  block. Correct as-is.
- **`pages/CRM/CRMDashboard.tsx` stat cards** — remediated; the `$2.4M` / `Target 89%` /
  `147 Contacts` literals now exist only in explanatory comments (lines 18–24, 110–124,
  903–910). Do not mistake those comments for live findings; I nearly did.
- **`pages/Dashboard.tsx`** — remediated; the `+12% / +8% / +15% / +5%` trend badges were
  removed rather than replaced, with the reasoning recorded at lines 24–30.
- **`pages/CRM/ReportsPage.tsx` top stat cards** — remediated (but see F2 for the catalogue).
- **`hooks/useDashboardData.ts`** — genuinely real. Fetches from five API modules. This is the
  reference pattern for fixing F1.

---

## Confidence statement — what this did NOT cover

Read this part before treating the count as complete. **21 findings is a floor, not a total.**

**Blind spots I know about:**

1. **Prop-drilled fabrication is under-covered.** My structural test follows imports, not prop
   flow. A page that legitimately fetches but passes a hardcoded array down to a child will
   pass the zero-fetch test. I caught F2 and F4 by literal scanning, not by the graph — so the
   graph's clean bill on a *fetching* page means little. Any of the 35 route targets that do
   reach real data could carry a fabricated panel I did not read line by line.
2. **My literal scan keyed on `$` and `%` only.** Bare counts (`147`), invented dates, made-up
   person and company names, star ratings, streaks, and health scores without a currency or
   percent symbol would not have matched. F1 was found structurally and F14/F16 by filename —
   not by the literal scan. Fabrication that renders plain integers is the most likely thing
   still hiding.
3. **I did not run the app for this audit.** Every finding is static analysis plus reading.
   I did not click all 71 routes, so I cannot say what a given page *visibly* renders — only
   what the source says it renders. A panel may be behind a tab, a flag, or an empty-state
   guard I did not trace.
4. **Conditional fallbacks were not systematically hunted.** The dangerous shape is
   `data.length ? data : SAMPLE` — real until the fetch is empty or fails, then silently fake.
   `DataContext` is that shape at the provider level, but I did not grep exhaustively for the
   pattern inside individual components. This is the highest-value follow-up.
5. **The two dead Settings trees (56 files) were surveyed, not audited.** They are already
   slated for deletion in `HANDOFF.md` §2, so I did not read them closely. If that decision
   ever reverses, they need their own pass — F15 is the one finding I happened to surface there
   and there are almost certainly more.
6. **`components/` was not swept as thoroughly as `pages/`.** I checked reachable components
   over 250 lines for zero-fetch subtrees, but small presentational components legitimately
   take props, which makes the signal weak there — so I did not read them. A hardcoded array
   inside a mid-sized component is a plausible miss.
7. **Line-number precision varies.** Where I cite a range (F2, F3) the fabrication is spread
   across it rather than sitting on one line; treat those as entry points, not exact locations.

**Where I would look next, in order:** grep for the `?:`-fallback-to-sample pattern across all
reachable components; re-scan for bare-integer literals in JSX; then walk the 35 data-reaching
route targets panel by panel, since that is exactly the population my strongest test cannot
see into.

**One thing I am confident about:** F1 is the root cause, and fixing it will change what
several other findings even look like. `Analytics`, `Calendar`, `GamificationPage` and the
three HRMS pages have no fabricated literals of their own — they are honest code rendering a
lying provider. Rewire `DataContext` and those six stop being findings without being touched.

---
---

# Appendix — the two gap-closers

Both **report only**; nothing changed. These were the follow-ups named in the confidence
statement above, run deliberately. **They found 6 new findings, one of which outranks most of
the original report, and they force one correction to F4.**

Revised total: **27 findings.**

## Appendix A · Pass 1 — conditional fallback shapes

Searched for `|| SAMPLE`, `?? mockX`, `.length ? data : sample`, `catch { setX(sample) }`,
`isEmpty ? fixture : data`, plus frontend `Math.random()` in display paths and hardcoded
`'N ago'` freshness strings.

**Headline: the classic `data.length ? data : SAMPLE` shape is essentially absent today — one
instance existed and was already removed.** But the *provider-level* variant of it is alive and
is the worst single item in this audit.

### F22 · `contexts/IntegrationsContext.tsx:204–281` — NEW, and a different risk class
**Fabricates:** the entire integrations subsystem, at provider level. Mounted in `App.tsx`.
**Zero `fetch` calls in the file.** Inside a `try` block it unconditionally sets
`setConnectedIntegrations(mockConnected)`, `setAvailableIntegrations(mockAvailable)`,
`setApiCredentials(mockApiCredentials)` — the `catch` is therefore vestigial.

Three separate hazards, escalating:

1. **False system state.** `mockConnected` declares `LEAD GENERATION CONNECTOR`
   (`currentProvider: Apollo.io`) and `EMAIL CONNECTOR` with `status: 'connected'`. The UI
   asserts live third-party integrations are connected when none exist. This is the same class
   of defect as the deleted `LoginWireframe` — the interface making a claim about system state
   that is not true — and it is arguably worse, because a settings screen reading "connected"
   is exactly what someone checks before debugging why data isn't syncing.
2. **A fabricated credential, rendered and copyable.** Line 274:
   `apiKey: 'sk_live_abc123456789defghijklmnopqrstuvwxyz'`, plus
   `webhookUrl: 'https://api.bmi-crm.com/webhooks/user_alex123'`. Both are rendered into input
   fields at `pages/Integrations/IntegrationsHub.tsx:386` and `:411`, each with a
   **copy-to-clipboard button** (`:391`, `:416`) and passed onward at `:498`/`:504`. The
   `sk_live_` prefix is the industry convention for a *live* secret key. A user can copy it,
   paste it into a real integration, or into a bug report or screenshot.
3. **A fake mutation.** Line 366:
   `const newApiKey = \`sk_live_${Math.random().toString(36).substring(2)}\`` — the
   "regenerate key" control manufactures a new fake credential client-side. The control appears
   to work, which is how a dead button becomes a misleading one.

**Reachable:** yes — `/integrations` (`pages/Integrations/IntegrationsHub.tsx`), plus the
provider is app-wide.
**Disposition: delete** the mock block and let the panels render empty states. Integrations are
not in the Phase-1 page list. Do **not** merely label this one: a labelled fake `sk_live_` key
is still a copyable fake secret, and the "connected" badges would still be false.

### F23 · `pages/CRM/MeetingDetailPage.tsx:15` — a fallback that disguises a miss
```
const meeting = sampleMeetings.find(m => m.id === id)
             || sampleMeetings.find(m => m.id === 'meeting_acme_001')!;
```
**Fabricates:** identity. Any unrecognised meeting id silently renders a specific fixture
("meeting_acme_001") rather than a not-found state, so a wrong URL produces a confident,
detailed, wrong record. The non-null assertion `!` guarantees it never reports failure.
Already inside F13's scope, but this specific behaviour is worse than "the page uses fixtures".
**Disposition: delete** with F13.

### Already remediated — cited as proof the shape is real here
`pages/CRM/DocumentsLibrary.tsx:348–351` carries a comment recording that this file *used to*
`catch` a failed fetch, show `MOCK_DOCUMENTS`, and call `setError(null)` with the note
*"Don't show error when using mock data"* — and that the fetch failed "every single time, and
the library only ever displayed fixtures." That is precisely the failure-only fabrication you
described, it did happen in this codebase, and it is fixed. Worth keeping in the record as the
canonical example.

### `Math.random()` — mostly benign, two exceptions
20 call sites. Eighteen are legitimate local id generation for optimistically-created records
(`contexts/AccountsContext.tsx` ×8, `utils/auditLog.ts`, `rulesStore.ts`, filter-row keys, temp
tag ids). The two that are not: **F22's fake key generator** above, and
`contexts/SettingsContext.tsx:912` (`bmi_` token minting) — the latter inside the dead Settings
tree already slated for deletion in `HANDOFF.md` §2, so no separate action.

## Appendix B · Pass 2 — literal scan, currency/percent anchors removed

Re-scanned the 35 data-reaching route targets — the population the import graph cannot clear —
for `'N ago'` freshness strings, hardcoded person names, and bare integer properties
(`probability:`, `score:`, `daysInStage:`, `engagementScore:`, `totalInteractions:`).

**This pass justified itself: the single largest new finding is here, on a core Phase-1 page
that my structural test had cleared as "reaches real data".**

| File | `'N ago'` | named people | bare int props |
|---|---|---|---|
| `pages/Deal/ComprehensiveDealDetailPage.tsx` | 1 | **26** | 4 |
| `pages/CRM/DocumentDetailPage.tsx` | 0 | **19** | 0 |
| `pages/Accounts/EnhancedAccountDetailView.tsx` | **6** | **18** | 3 |
| `pages/CRM/ImportLeadsPage.tsx` | 1 | 6 | 1 |
| `pages/CRM/CRMDashboard.tsx` | 0 | 4 | 7 |
| `pages/CRM/DocumentsLibrary.tsx` | 0 | 4 | 0 |
| `pages/Accounts/AccountFormPage.tsx`, `ReportsPage.tsx` | 0 | 3 | 0 |
| `AddEditContactPage.tsx`, `ActivitiesPage.tsx` | 0 | 2 | 0 |
| `AddLeadPage.tsx`, `ContactDetailView.tsx`, `DealsKanbanPage.tsx` | ≤1 | 1 | ≤1 |

`CRMDashboard`'s counts are inside its two correctly-labelled preview panels — already handled,
not re-flagged.

### F24 · `pages/Deal/ComprehensiveDealDetailPage.tsx:427–600` — NEW, severe
**Reachable at `/crm/deals/:id`** — a core Phase-1 page, reached by clicking any deal on the
Kanban board I verified renders genuine database rows. The page does reach real data, which is
exactly why the structural pass cleared it. Four fabricated blocks, all rendered:

- **`stageHistory` (427–434)** — an invented stage audit trail: `Prospecting 5 days (Nov 15 →
  Nov 20, benchmark 7)`, `Qualified 12 days (Nov 20 → Dec 2, benchmark 10)`, `Proposal 8 days`,
  with `benchmarkMin`/`benchmarkMax` ranges. `CLAUDE.md` names "stage history audit trail" as
  in-scope Phase-1 work, and there is a real `deal_stage_history` table in the database.
- **`accountData` (436–449)** — invented company intelligence: `name: 'Acme Corp'`,
  `revenue: '$12M annually'`, `size: '75 employees'`, `location: 'San Francisco, CA'`,
  `fundingRound: 'Series B'`, `fundingAmount: '$8M'`, `growthRate: '45% YoY'`,
  `hiringTrend: '+15 employees (Q3 2024)'`, `techStack`, `competitors`.
- **`contacts` (451+)** — invented stakeholders with roles: `John Smith, VP Sales, Champion,
  john@acme.com, +1 555-0123, lastContact: 'Dec 2', daysAgo: 5`. Rendered at `:1371`, `:1386`,
  `:1400`. "Stakeholders" is also a named Phase-1 deliverable.
- **`activities` (497+)** — invented timeline: emails to John Smith, `user: 'Alex Rodriguez'`,
  `'Duration: 45 minutes\nLocation: Zoom (Recording available)'`. Rendered at `:1398`.

**Every deal shows the same Acme Corp funding round, the same champion, and the same stage
dates**, regardless of which deal you opened. This is a decision surface, not a report.
**Disposition: wire to real data** for `stageHistory` (the table exists) and stakeholders
(contacts carry `company_id`); **delete** `accountData`'s funding/growth/hiring fields — there
is no enrichment provider and `CLAUDE.md` puts enrichment out of phase.

**RESOLVED — page rebuilt against the database.** Corrections to this entry, all found while
wiring it, and each one changes the picture:

- **There were TEN hardcoded blocks, not four.** Also rendering: `aiIntelligenceData` (an
  invented win probability, a four-category score breakdown, four "next best actions"),
  `hrmsConnection`, `notes`, `files`, `sidebarData` (the entire AI Insights rail — deal score
  78, win probability 67%, three "similar deals" with similarity percentages, a predicted
  `$48K - $52K` range, churn and upsell figures, a data-sources panel claiming Clearbit and
  LinkedIn were syncing), and — in `DealHeroSection`, one component up — `VELOCITY_STAGE_AVG`,
  a hardcoded per-stage benchmark map driving a "Moving Fast / Slowing / Stalled" verdict and
  "6d to avg". That last one is the same benchmark fabrication as `stageHistory`'s, which is
  why a per-file literal scan missed it: it lived in the component, not the page.
- **The stakeholders were already in the database and already being fetched.**
  `deals.stakeholders` is a real jsonb column, written by the deal form, carrying buying roles
  (champion / decision-maker / economic-buyer / technical-evaluator / legal-procurement) on 5
  of 25 deals. The page mapped it into state at `:207` and then rendered the invented `contacts`
  array beside it. So no schema addition was needed on the deal side at all — the fix was to
  render data the page was already holding.
- **`deal_stage_history` was empty for a reason, and the reason was a second bug.**
  Nothing wrote to it: `handleStageSelect` called `updateDeal()` (a plain field update), and
  the Move Stage modal's confirm handler called nothing at all — it fired
  `showToast('Deal moved to Negotiation stage', 'success')` and returned. Both now go through
  `POST /deals/:id/stage-transition`.
- **And nothing rendered it either.** `DealDetailsPanel` declared `stageHistory?: Stage[]` and
  never destructured it, so the fabricated array went nowhere. **The Phase-1 "stage history
  audit trail" did not exist as a render**, and the fabrication concealed that by making the
  prop look supplied. Now recorded as lesson 9 in `CLAUDE.md`.

Wired: stage history (new `DealStageHistory` + `buildStageSpans`, 8 tests), activities, notes
(activities of type `note`), files (documents), stakeholders, and the account via the new
`deals.company_id`. Deleted: the AI Insights tab and its four components (1,593 loc), company
enrichment, HRMS, the velocity benchmark, and `"TODAY (Dec 7)"` — printed on every deal, every
day of the year.

### F25 · CORRECTION to F4 — `EnhancedAccountDetailView.tsx` is worse than reported
F4 said the Related Deals panel reads sample data. That was incomplete. The real shape is
**fabricated fields grafted onto genuine records, plus real data fetched and then discarded:**

- **`mockDeals` (267–280)** maps over deals and injects `probability: 70`, `health: 'good'`,
  `lastActivity: '2 days ago'`, `daysInStage: 15`,
  `nextStep: 'Schedule demo with decision maker'` into **every** row. Name, stage and value are
  real; everything else is a constant.
- **`mockContacts` (282–298)** maps over the **really-fetched** contacts and injects
  `engagementScore: idx === 0 ? 95 : idx === 1 ? 90 : 75`, `lastContactDate: '3 days ago'`,
  `totalInteractions: 12`. Note this is index-based fabrication sitting two lines below a
  comment explaining that the adjacent index-based `role` assignment was removed for being
  exactly that. The same defect survived the fix to its neighbour.
- **`mockActivities` (300+)** is entirely invented — "Product Demo with Sarah Chen", an
  `aiSummary`, `timestamp: '2 hours ago'` — and **it is what renders**, at `:716`. The real
  `accountActivities`, fetched from `/activities?company_id=` at `:47–58`, is used only for a
  filtered computation at `:157–162` and never displayed.

**This last point is the most dangerous single fact in the audit.** The page issues real,
successful network requests and then renders invented data. Anyone applying this project's own
"verify the network response before reporting a failure" rule would see 200s and conclude the
page is sound. It defeats the primary verification heuristic in `CLAUDE.md`.

*Already remediated on this page, for the record:* `similarAccounts` and `dataSources` were
emptied (comment at `:249–264`); the latter had claimed five external enrichment integrations
were "active, updated 2 hours ago".

**RESOLVED — page rebuilt against the database.** The three mock consts were the visible layer;
three more were underneath, and this entry understated the page by a wide margin:

- **`mockOrgChart`** — a fourth invented block, a full reporting hierarchy (John Smith CEO ->
  Sarah Chen VP HR, Mike Johnson CTO). No org-chart data exists in any table.
- **FIVE components whose props could ONLY be satisfied with invented values.** The important
  finding here is that three of them carried invented **default parameter values in their own
  signatures**: `AIAccountInsightsPanel` defaults `healthScore = 92, engagementScore = 95,
  dealPotentialScore = 90, relationshipScore = 95, companyHealthScore = 88, pipelineValue =
  60000`; `HRMSIntelligencePanel` defaults `contactName = 'Sarah Chen', contactRole = 'VP of
  HR', employeeCount = 450, recentHires = 35, attritionRate = 8`. **Removing the invented prop
  at the call site would have changed nothing** — the component supplies the same invention
  from its own signature, and the page looks clean while the screen does not. This is a
  fabrication that is invisible from the consuming file, and it is a distinct variant worth
  naming alongside the provider-level one. `AIAccountInsightsPanel`'s body was hardcoded too:
  "Upsell Opportunity: High, +$35K in Q1 2026", "Churn Risk: Low (5%)", "Ask Sarah for a warm
  intro". All five deleted (1,445 loc), plus `EnhancedContactsSection`, whose required
  `engagementScore` / `lastContactDate` / `totalInteractions` props were the reason
  `mockContacts` had to invent them in the first place.
- **TWO ENTIRE TABS of inline fabricated JSX**, which no scan of the `mock*` consts would have
  found because the literals are in the markup. The Activities tab rendered "24 Emails / 8
  Calls / 5 Meetings / 12 Notes" and a timeline of "Sent proposal to Sarah Lee ... Opened on
  Nov 14, 4:15 PM" — against an `activities` table holding **0 rows**. The Documents tab
  rendered a storage quota ("24.5 MB / 100 MB", a quota this product does not have) and
  `TechStart_Proposal_Q1_2025.pdf` — against **0 document rows**.
- **`LastInteractionBar`** was called with `lastInteractionDate="Nov 14, 2025" daysAgo={2}
  engagementScore={95}`: three literals, no source for any of them. Deleted.
- **The hero printed "0 employees" on every account** — `{account.employeeCount || 0}`, where
  `employeeCount` has no column and `accountsApi` correctly leaves it undefined. Not invented,
  but a fabricated-looking zero produced by a `||` fallback over an honest absence. It now
  shows the real `companies.size` band.

**And the "Active Deals 0 / Total Pipeline $0" every account reported was itself the bug.**
`getAccountDeals()` filtered `accountDeals`, seeded from `generateSampleAccounts()` — which
by this point returned `[]` for six of its seven collections, so the filter always returned
nothing while 25 real deals existed. An honest-looking zero is still a wrong answer, and it is
harder to spot than an invented number because it looks like a correct empty state. Fixed by
`deals.company_id` (migration 027) plus `/deals?company_id=`; `generateSampleAccounts` and its
385-line file are deleted.

### F26 · `pages/CRM/ImportLeadsPage.tsx:60–80` — reachable, in-scope, misleading
**Fabricates:** an integration roster — `Apollo.io` with `status: 'connected'`,
`lastSync: '2 hours ago'`, `totalImported: 1234`, `autoSync: true`,
`assignedTo: 'Alex Rodriguez (You)'`. Same false-system-state class as F22, on a page that
otherwise reaches real data. Routed at `/crm/leads/import`. Aggravating: `CLAUDE.md` calls CSV
import "the real migration path from Salesforce/HubSpot for early customers... never a dead
button", so this page is committed scope and a fake "1,234 imported" undermines it.
**Disposition: delete** the integration roster; keep the real CSV path.

### F27 · `pages/CRM/DocumentDetailPage.tsx:267` — `getMockDocuments()`
**Fabricates:** document records and audit entries (`user_name: 'Alex Rodriguez'` at `:143`,
`:433`; `owner_name` at `:190`, `:215`; `created_by_name` at `:419`). Routed at
`/crm/documents/:documentId`, and it reaches real data — so this is another mixed page. Its
sibling `DocumentsLibrary.tsx` had the *same* `MOCK_DOCUMENTS` pattern and it was fixed there;
the detail page kept it. **Disposition: wire to real data** — `services/documentsService.ts`
already exists and is real.

## Revised severity ranking, both passes folded in

1. **F1** `DataContext` — provider-level, 7 consumers, root cause
2. **F22** `IntegrationsContext` — provider-level, fake `sk_live_` credential with a copy
   button, false "connected" status
3. **F24** deal detail — invented stage history, stakeholders and company intel on a core
   Phase-1 decision page
4. **F25** account detail — fabricated fields on real records; real fetches discarded
5. **F1's consumer** `LeadConversionWizard` — fabricated contacts driving duplicate matching
6. **F26** import page — false "connected / 1,234 imported"
7. F3 AICopilot, F2 ReportsPage catalogue, F27 document detail, then the rest as ranked above.

## Sequencing — where I'd differ from your order

Your order is right on principle: **decision paths before display surfaces.** I'd change it in
two places, both because of findings that did not exist when you wrote it.

**Agreed, unchanged: `LeadConversionWizard` first.** Fabricated contacts deciding whether a real
lead is a duplicate is the only place in the audit where invented data can cause a *write* — a
wrongly-merged or wrongly-rejected lead. It outranks everything.

**I'd insert F22 (`IntegrationsContext`) second, before rewiring DataContext.** It is not a
display bug either. A copyable `sk_live_` string and two integrations badged "connected" are
claims a user can act on, and it is a delete rather than a rewire — hours, not days. Clearing a
credential-shaped fake early is worth more than its size suggests, and it is the same class of
defect as the `LoginWireframe` page you had me delete for asserting a security posture we don't
have.

**Then DataContext**, as you had it — six findings resolve untouched, and the
`useDashboardData` pattern is already proven.

**I'd promote F24 (deal detail) to sit with `/accounts/:accountId`, not after ReportsPage.**
Both are partially-migrated Phase-1 pages, both are the same shape, and `/crm/deals/:id` is
more trafficked than the account detail view. Fix them as one unit while the shape is fresh —
and note F25's finding that the account page *discards real fetched activities*, which makes it
a false-negative generator for any future verification, not just a display problem.

**Then ReportsPage catalogue** — agreed, biggest by volume, lowest by risk. One amendment: drop
the 30 `updated="5m"` stamps even if the cards stay, because a freshness claim is the part that
converts a placeholder into a lie.

**Then aiEngine — label, don't build.** Agreed, with the refinement from F5: `:128` is dead
code, so **delete** `generateRecommendations` rather than label it. What needs labelling is the
Analytics "AI Predictions" panel, and note it cannot be made honest before F1 lands, since its
inputs are DataContext's fabricated deals.

## Confidence — what these two passes still did not cover

Better than before, and still not complete.

- **Pass 2 keyed on a fixed list of seeded names** (`Sarah Chen`, `Alex Rodriguez`, …) and a
  fixed list of integer property names. Invented data using other names, or bare integers under
  property names I didn't enumerate, would still be missed.
- **I did not read the 13 files in the Pass-2 table below the top four.** Their low counts
  (1–4 hits) are plausibly legitimate — a name in a placeholder attribute, a real default — but
  I confirmed only the top four by reading them.
- **Pass 1 cannot find a fallback expressed across statements** — e.g. `if (!rows.length) {
  rows = SEED }` several lines from the fetch, or a fallback inside a custom hook. My greps were
  single-line and pattern-bound.
- **Still no runtime verification.** Everything here is static. F24's blocks in particular may
  be superseded at render time by props I did not trace through four component layers, though
  the `contacts={contacts}` / `activities={activities}` bindings at `:1371–1400` argue against
  it.
- **`components/` remains the weakest-covered tree**, for the reason given in the main report:
  prop-taking components legitimately have no fetch, so neither the structural test nor the
  literal scan produces a clean signal there.

The one structural claim I'd now make with confidence: **fabrication in this codebase clusters
at providers and on detail pages.** Providers (`DataContext`, `AccountsContext`,
`IntegrationsContext`) because one mock reaches every consumer invisibly; detail pages
(`/crm/deals/:id`, `/accounts/:accountId`, `/crm/documents/:id`, `/crm/meetings/:id`) because a
detail view needs many fields, most tables only have a few, and the gap got filled with
literals. List pages are comparatively clean. If a 28th finding exists, that is where to look.

---

# Finding 28 — `MOCK_ACCOUNTS`, and the structural prediction holding up

Found while narrowing the lead-conversion wizard, not by either audit pass.

### F28 · `components/Leads/LeadConversionWizard.tsx:73` — REMOVED
**Fabricated:** five invented companies — `acc_mock_1` "Acme Corp" (Technology),
`acc_mock_2` "Global Industries" (Manufacturing), `acc_mock_3` "Horizon Partners" (Finance),
`acc_mock_4` "Nexus Solutions" (Consulting), `acc_mock_5` "Apex Ventures" (Healthcare) —
declared as a `MOCK_ACCOUNTS` const **inside the component file itself**, independent of
`DataContext`.

**Reachable:** yes, and on a write path. It fed three things: the account branch of
`buildSuggestions()`, the `filteredAccounts` picker in the wizard's "Link to Existing" step,
and a name lookup inside `handleConvert`. Selecting one of these accounts was intended to
write `account_id: 'acc_mock_1'` onto a real `leads` row.

**Disposition: deleted** (done). `buildSuggestions` went with it — its contact branch was
equally fabricated, reading `DataContext`, and its matching was weaker than the real engine
besides: contacts on email-**domain** equality alone, which flags every colleague at a shared
domain, arbitrarily capped at two; accounts on bidirectional substring containment of the
company name. The "Link to Existing" path is now **disabled and labelled** rather than
populated by fiction, because removing both fabricated sources left it nothing real to offer.
`findDuplicates` from `utils/leadDuplicates.ts` — the tested 4-signal engine — was untouched
and still gates the duplicates step.

### The structural claim is holding

The main report closed by predicting that fabrication in this codebase clusters at
**providers** and **detail pages**, that list pages are comparatively clean, and that a 28th
finding would be found in one of those places rather than on a list page.

F28 landed on a **detail-page modal** — the conversion wizard, reachable from
`/crm/leads/:id`. Not a list page. That is now three for three:

| Finding | Where | Shape |
|---|---|---|
| F1 `DataContext` | provider | ten collections seeded from a fixture |
| F22 `IntegrationsContext` | provider | whole subsystem + a fake `sk_live_` credential |
| F28 `MOCK_ACCOUNTS` | detail-page modal | a const array inside the component file |

The mechanism is also consistent: a detail view needs many fields, most tables have few, and
the gap gets filled with literals — which is why `/crm/deals/:id` (F24),
`/accounts/:accountId` (F25), `/crm/documents/:id` (F27) and now the lead conversion wizard
all carry it, while `LeadsPage`, `ContactsPage` and `DealsKanbanPage` are clean.

**Revised total: 28 findings.** F22 and F28 are fixed; F24, F25, F27 and the rest remain open.
The blind spots named in the original confidence statement still stand, and F28 is direct
evidence for the strongest of them: it was in a file both passes had touched, and neither
pass flagged it, because a const array in a modal is not a zero-fetch page and carries no
currency or percent symbol.
