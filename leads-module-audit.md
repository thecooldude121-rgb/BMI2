# Leads Module Audit

**Date:** 2026-06-17  
**Auditor:** Senior Staff Product Engineer  
**Status:** Pre-enhancement audit — no code changed

---

## 1. Current Architecture

### Component Tree

```
App.tsx
  └─ LeadProvider (LeadContext.tsx)           ← wraps entire app
       └─ /crm/* → CRMModule.tsx
            ├─ /leads           → LeadsPage.tsx       (923 lines)
            ├─ /leads/new       → AddLeadPage.tsx     (452 lines)
            ├─ /leads/import    → ImportLeadsPage.tsx
            ├─ /leads/integrations → IntegrationsPage (external)
            └─ /leads/:id       → LeadDetailPage.tsx  (1405 lines)
```

### Data Flow (Intended vs Actual)

**Intended:**
```
LeadsPage → useLeads() [LeadContext] → leadsApi.ts → Express /api/v1/leads → PostgreSQL
```

**Actual:**
```
LeadsPage → useLeads() ← IMPORTED but contextLeads is NEVER used
LeadsPage → local mockLeads[] ← 45 hardcoded records rendered directly

LeadDetailPage → useEffect() ← NEVER calls API; sets hardcoded mockLead
LeadDetailPage → always renders "John Smith" regardless of URL :id param
```

### State Management

| Layer | What it manages | Real or Stub? |
|---|---|---|
| `LeadContext` | `leads[]`, `loading`, `error`, filters, views | `leads` is real (from API); everything else is stub |
| `LeadContext` activities/notes/tasks | Stubs returning `[]` or `null` | Stub — DB tables don't exist yet |
| `LeadsPage` local state | `leads` from `mockLeads[]` | **Hardcoded — ignores context** |
| `LeadDetailPage` local state | Single `lead` from `mockLead` object | **Hardcoded — ignores API** |

### Backend Coverage

| Endpoint | Status |
|---|---|
| `GET /api/v1/leads` | Working — supports `stage`, `owner_id`, `search`, `limit`, `offset` |
| `GET /api/v1/leads/:id` | Working |
| `POST /api/v1/leads` | Working |
| `PUT /api/v1/leads/:id` | Working — uses `UPDATABLE_FIELDS` whitelist |
| `DELETE /api/v1/leads/:id` | Working |
| Bulk operations | Missing — no backend endpoint |
| Score calculation | Missing — done in-memory only (always returns 0) |
| Activities/Notes/Tasks | Missing — no DB tables |

---

## 2. Mock Data Locations

| File | What's hardcoded | Risk |
|---|---|---|
| `LeadsPage.tsx:57–181` | 45 full lead records in `mockLeads[]` | High — blocks real data from showing |
| `LeadDetailPage.tsx:117–180` | Full single-lead `mockLead` object | Critical — detail page is 100% fake |
| `LeadContext.tsx:212–228` | `enrichLead()` returns fake "John Doe" enrichment | Low — not called from active UI |
| `LeadDetailPage.tsx:151–179` | Score breakdown, similar deals, recommended actions | Medium — all fake |

---

## 3. Field Name Mismatches

This is the most dangerous debt — three competing schemas for the same entity:

| Concept | DB / API (`leadsController.ts`) | Frontend type (`types/lead.ts`) | Local mock (`LeadsPage.tsx`) |
|---|---|---|---|
| Name | `first_name`, `last_name` | `first_name`, `last_name`, `full_name?` | `name` (single string) |
| Stage/Status | `stage` (column) | `stage_id?`, `status` (LeadStatus) | `status: 'new'\|'contacted'\|'qualified'\|'lost'` |
| Score | `score` (number) | `score`, `ai_score?` | `aiScore` |
| Created date | `created_at` | `created_at` | `addedDate` (formatted string) |
| Last contact | not in DB | `last_contact_date?` | `lastContact` (formatted string) |

`mapRowToLead()` in `leadsApi.ts` always hardcodes `status: 'new'` regardless of what the DB returns — so every lead from the real API will always appear as "New".

`AddLeadPage.tsx` sends `company_name` to the API but the backend inserts into `company` — the company field silently drops on create.

---

## 4. Dead / Orphaned Code

| File | Problem |
|---|---|
| `components/CRM/LeadCard.tsx` | Imports `Lead` from `DataContext` (old arch) and `aiEngine`. Not imported anywhere in active routes. Dead code. |
| `components/CRM/LeadForm.tsx` | Imports `addLead` from `DataContext` (old arch). Not used anywhere. Dead code. |
| `pages/CRM/SimpleAddLeadPage.tsx` | 279 lines. Not wired to any route in `CRMModule.tsx`. Dead code. |
| `LeadsPage.tsx:33` | `const { leads: contextLeads } = useLeads()` — imported but never referenced again. |
| Multiple `Lead` AI components | `components/Lead/AIInsightsModal.tsx`, `AIScoreInsightsPanel.tsx`, `LeadScoreBreakdownPanel.tsx` — none imported from the active leads pages. |

---

## 5. Unimplemented UI

| Feature | UI Exists? | Backend Exists? | Wired? |
|---|---|---|---|
| Grid view (card layout) | Button exists in toolbar | N/A | No — `viewMode` state toggles but no conditional JSX |
| Kanban view (status columns) | Button exists in toolbar | N/A | No — same issue |
| Lead detail (real data) | Full 1405-line page | Yes (`GET /leads/:id`) | No — always shows mock |
| Activity timeline | UI state wired | No DB tables | Stub |
| Notes | Modal states exist | No DB tables | Stub |
| Tasks from lead | — | No DB tables | Stub |
| Score breakdown | Rendered in detail page | Not an API | Hardcoded array |
| Bulk assign | UI exists | No endpoint | `alert()` only |
| Sort label | Dropdown exists | N/A | Always shows "Score (High to Low)" regardless of selection |
| Import leads | Route exists | No backend | Page likely incomplete |

---

## 6. Type Safety Issues

1. **`handleBulkStatusChange`** casts to `as any` — bypasses type checking on status values
2. **`Lead` interface defined 3 times**: once in `types/lead.ts` (canonical), once locally in `LeadsPage.tsx`, once locally in `LeadDetailPage.tsx`
3. **`LeadStatus`** in `types/lead.ts` has 7 values; local mock only uses 4 of them (`new`, `contacted`, `qualified`, `lost`) — `working`, `nurturing`, `unqualified` would be filtered out
4. **`mapRowToLead`** always sets `status: 'new'` — DB stage values are silently ignored
5. **`calculateLeadScore`** reads `email_opens_count`, `meeting_count` etc — all always 0 from `mapRowToLead` — always returns 0

---

## 7. UX Regressions

- `stats.newToday` checks for string `'Nov 15'` inside `addedDate` — will always be 0 for real data
- `stats.importedThisWeek` uses `new Date(l.addedDate)` on formatted strings like `"Nov 15, 2025"` — works by accident in Chrome but fragile
- `handleArchiveLead` and `handleReactivateLead` use `alert()` and `window.confirm()` — primitive and jarring
- Closing any action dropdown requires clicking elsewhere (no click-outside handler) — dropdowns compete with each other
- Sort dropdown label is always static — user can't tell what sort is active

---

## 8. Risks

| Risk | Severity | Notes |
|---|---|---|
| LeadsPage never shows real DB data | **Critical** | `contextLeads` imported but unused; mock data renders |
| LeadDetailPage is 100% mock | **Critical** | Any real lead navigated to shows John Smith |
| `company_name` vs `company` mismatch on create | **High** | Company field silently dropped on new leads |
| `status` always `'new'` from API | **High** | Filters break when real data loaded |
| Grid/Kanban buttons non-functional | **Medium** | Users click, nothing changes — trust damage |
| Dead LeadCard/LeadForm components | **Low** | Confusion for future devs; adds bundle weight |
| All activity/notes/tasks are stubs | **Medium** | Core engagement features appear wired but silently do nothing |

---

## 9. Quick Wins (Low-risk, High-value)

1. **Wire `contextLeads` into the render** — replace `leads` local state with `contextLeads` from `useLeads()`; remove `mockLeads[]` constant
2. **Fix `mapRowToLead` `status` field** — map `row.stage` to `status` instead of hardcoding `'new'`
3. **Fix `company_name` → `company` in `AddLeadPage`** — one-line fix
4. **Fix sort label** — make it dynamic based on `sortBy` state
5. **Fix `stats.newToday`** — use `created_at` ISO date comparison instead of string match
6. **Delete orphaned files** — `LeadCard.tsx`, `LeadForm.tsx`, `SimpleAddLeadPage.tsx` (verify unused first)
7. **Replace `alert()`/`window.confirm()`** — use inline toast or inline state feedback

---

## 10. Recommended Refactor Order

### Phase 1 — Data Integrity (no UI change, unblocks everything)
1. Fix `mapRowToLead`: map `stage` → `status`, stop hardcoding `'new'`
2. Fix `AddLeadPage`: `company_name` → `company` in the create payload
3. Wire `LeadsPage` to real data: swap local `mockLeads` for `contextLeads`; add `useEffect` to call `fetchLeads()` on mount
4. Fix `LeadDetailPage`: replace `mockLead` with real `fetchLeadByIdFromAPI(id)` call

### Phase 2 — View Completeness
5. Implement Grid view: card-based layout rendered when `viewMode === 'grid'`
6. Implement Kanban view: status-column layout rendered when `viewMode === 'kanban'` (uses existing `status` filter categories)
7. Fix dynamic sort label
8. Fix stats calculations to use ISO dates

### Phase 3 — Action Reliability
9. Replace all `alert()`/`window.confirm()` with in-page feedback
10. Wire bulk assign to `executeBulkOperation` (already in context)
11. Fix click-outside for all dropdowns

### Phase 4 — Feature Build-out (requires new DB tables)
12. Activity logging (needs `lead_activities` DB table + backend route)
13. Notes (needs `lead_notes` table)
14. Tasks from lead (needs `lead_tasks` table)
15. Score calculation using real engagement data

---

## 11. Files Most Likely to Change

| File | Reason |
|---|---|
| `pages/CRM/LeadsPage.tsx` | Remove mock data, wire to context, add grid/kanban renders |
| `pages/CRM/LeadDetailPage.tsx` | Replace mock with real API fetch; consolidate Lead type |
| `utils/leadsApi.ts` | Fix `status` field in `mapRowToLead`; consider adding bulk endpoint |
| `pages/CRM/AddLeadPage.tsx` | Fix `company_name` field name |
| `contexts/LeadContext.tsx` | Minor — stub cleanup when DB tables are added |
| `types/lead.ts` | Minor — reconcile `status` vs `stage` naming once DB schema is settled |

### Files Likely to be Deleted
- `components/CRM/LeadCard.tsx` (dead)
- `components/CRM/LeadForm.tsx` (dead)
- `pages/CRM/SimpleAddLeadPage.tsx` (unrouted)
