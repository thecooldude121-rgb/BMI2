# Project: BMI Platform — AI CRM (Module 1 of 4)

## What this is
A multi-tenant B2B SaaS CRM — the first module of a larger platform (AI CRM, Meeting Agent,
Lead Generation Tool, HRMS Lite). **Only the AI CRM module is in scope right now.** Do not
build Meeting Agent, Lead Gen, or HRMS features unless explicitly asked — they are future
phases. Do not build AI features (email drafts, deal health scoring, next-best-action) yet
either — those are Phase 2. This phase is CRM core data + pipeline only.

Target users: Account Executives, Sales Managers, SDRs at IT Services / EdTech companies in
India, Middle East, and Africa.

> **Note:** This file was introduced late in the project. Earlier sessions ran without these
> rules loaded, so parts of the existing codebase may not comply. Where built code and this
> spec disagree, surface the conflict rather than silently following either one.

## Tech stack (fixed — do not substitute without asking)
- Build tool / dev server: **Vite** (dev server runs on port 5173)
- Frontend: React + TypeScript
- Styling: Tailwind CSS + shadcn/ui components
- Icons: Lucide React
- Backend: Node.js (separate `backend` service)
- Database: PostgreSQL via **Supabase** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Cache: Redis (sessions, tenant config, dashboard aggregates)
- File storage: S3-compatible (S3 or Cloudflare R2)

## Architecture rules (non-negotiable)
- **Multi-tenant.** Every table that holds tenant data has a `workspace_id` column, and
  *every single query* must filter by it. This is the #1 security requirement — a missed
  `workspace_id` filter is a data-leak bug between tenants, not a style issue. Flag it
  explicitly if you are about to skip one; that is a hard stop, not a nit.
- RBAC checks happen at the API layer, not just the UI.
- All timestamps are `TIMESTAMPTZ`. All primary keys are UUID (`gen_random_uuid()`).
- Soft delete only where noted; no hard deletes without explicit ask.

## No fabricated data — ever
This project has already lost multiple sessions to fake data presented as real (a dashboard
of six widgets built entirely from hardcoded literals with no queries behind them; stale
counts like "147 contacts" and "$2.4M pipeline" surviving across pages).

- Never fill a UI gap with a hardcoded literal, sample number, or invented row.
- If a component needs data that has no backing table or column yet, **stop and propose the
  schema addition** — do not mock it.
- If a panel is intentionally not yet functional, label it visibly in the UI
  (e.g. `PREVIEW · SAMPLE CONTENT` with a "not calculated from your data" note) so it can
  never be mistaken for live data.
- Empty states are correct and expected. An honest empty list beats an invented one.
- Never leave test/seed records (`*-test`, `probe@`, "Isolation Test Co", etc.) in live
  data. Clean up any record you create for verification **in the same session you create
  it** — do not let it become the next session's mystery.

## Core data model (spec — reconcile against actual DB before relying on it)
```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'free',
    modules TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    settings JSONB DEFAULT '{}'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, email)
);

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    industry VARCHAR(100),
    size VARCHAR(50),
    location VARCHAR(255),
    website VARCHAR(255),
    enriched_data JSONB DEFAULT '{}',
    owner_id UUID REFERENCES users(id),
    health_score INT DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES users(id),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    title VARCHAR(100),
    linkedin_url VARCHAR(255),
    enriched_data JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    lead_score INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, email)
);

CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    primary_contact_id UUID REFERENCES contacts(id),
    owner_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    value DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'INR',
    stage VARCHAR(100) NOT NULL DEFAULT 'lead',
    close_date DATE,
    probability INT DEFAULT 0,
    health_score INT DEFAULT 50,
    source VARCHAR(100),
    competitor VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- email, call, meeting, task, note
    direction VARCHAR(20),     -- inbound, outbound
    subject VARCHAR(500),
    content TEXT,
    metadata JSONB DEFAULT '{}',
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id),
    company_id UUID REFERENCES companies(id),
    deal_id UUID REFERENCES deals(id),
    owner_id UUID REFERENCES users(id),
    ai_suggested BOOLEAN DEFAULT FALSE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(50) DEFAULT 'medium',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
Key indexes: `contacts(workspace_id, email)`, `companies(workspace_id, domain)`,
`deals(workspace_id, owner_id, stage)`, `activities(workspace_id, contact_id, occurred_at)`,
`tasks(workspace_id, owner_id, status, due_date)`.

### Known schema drift (do not assume the spec above is what's deployed)
- `EnhancedAccount` uses `billingAddress`, **not** `address` — an earlier bug had the edit
  form reading `address.street`, silently discarding saved addresses.
- `companies` has **no** `accountOwner` or `accountStatus` columns.
- `leads.status` in the database is `active | inactive | nurturing`. The frontend
  `Lead.status` carries a different *stage* vocabulary (qualified / won / lost). These are
  two different fields — do not conflate them when writing SQL.

## CRM pages in scope for this phase (build in this order)
1. **Auth + Workspace shell** — login, workspace creation, invite users, AppShell layout
2. **Contacts** — list view, add contact, contact detail + activity timeline, merge
   duplicates, tags
3. **Companies / Accounts** — list view, account detail, related deals, account team
   (champion / decision-maker / influencer / blocker), buying committee map
4. **Deals / Pipeline** — Kanban with drag-and-drop, deal cards, list view, deal detail with
   timeline / tasks / stakeholders / documents, stage history audit trail
5. **Activities / Tasks** — task list (mine / overdue / today / upcoming), manual activity
   logging, calendar view
6. **Dashboard** — pipeline snapshot, today's tasks, recent activity feed (build last, once
   the above have real data to summarize)

Explicitly **not** in this phase: Gmail/Outlook email sync, AI email drafts, deal health
scoring, next-best-action, Meeting Agent, Lead Gen, HRMS. Omit these rather than
half-building them.

## Design system (apply consistently — do not invent new patterns)
**Colors:**
- Primary: `#6366F1` (buttons/links), `#4F46E5` (active)
- Neutral: `#FFFFFF` (bg), `#374151` (body text), `#111827` (headings)
- Semantic: success `#22C55E`, warning `#F59E0B`, error `#EF4444`, info `#3B82F6`

**Typography:** Inter. H1 32px/700, H2 24px/600, H3 20px/600, Body 14px/400, Caption 12px/500.

**Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px.

**Core components (shadcn/ui base):** AppShell, Sidebar, TopBar, PageHeader, DataTable,
KanbanBoard / KanbanCard, Timeline, StatCard, Badge, Avatar, Modal, Drawer, Toast,
EmptyState, SkeletonLoader. Every list / dashboard / report needs a real EmptyState that
explains why it's empty and offers a primary action.

**Accessibility:** WCAG 2.1 AA — visible focus states, sufficient contrast, keyboard
navigation on the Kanban board and all forms.

**View toggles must actually gate the render.** A List/Grid/Kanban toggle that only restyles
its buttons is a bug. If a view isn't built, disable the button and label it — don't leave a
dead third option.

## Non-functional requirements
- Page loads < 2s for 95% of interactions
- All PII encrypted at rest; TLS in transit
- CSV import for contacts/companies is the real migration path from Salesforce/HubSpot for
  early customers — build it properly, with a per-row error report for failed rows. Not an
  afterthought, and never a dead button.

## Working style
- Before writing code for a new page or feature, give a short plan (tables / endpoints /
  components touched) and wait for a go-ahead if it's a new area of the app.
- Build one vertical slice at a time (e.g. Contacts fully working end-to-end) before moving
  to the next, rather than scaffolding all pages shallowly at once.
- Check in between stages. Don't run through a multi-item list in a single pass.

### Recorded lessons — prefer a check over an inference
These were learned the hard way in this project. The shared principle: **when you can verify
something directly, do that instead of reasoning about what should be true.**

1. **Verify the network response before reporting a failure.** A page was twice reported as
   broken ("0 accounts / could not load deals") when all three requests were returning 200 —
   the screenshots were simply taken before the fetch resolved. Check the network log first.
2. **Verify through the same entry point a real user uses.** Not the file you edited, not a
   direct URL, not hand-supplied state — a real login, the real nav, a real session. This
   rule has now been earned three times in three different disguises:
   - A dashboard fix was correct and invisible for three commits, because `Sidebar.tsx`
     links "Dashboard" to `/crm/dashboard` while the fix was verified at `/dashboard`.
   - Contacts, Accounts, Deals and Reports were all reported "verified live" while the
     frontend had **no working login at all** — `AuthContext.login` was mock, nothing ever
     wrote `authToken`, and every real request returned 401. Pages only loaded because a
     token had been pasted into `localStorage` by hand at the start of each check.
   - An account form was reported fixed on the strength of a success toast; the database
     showed the value had never changed.

   **If you have to manufacture a credential, seed a value, or poke internal state to make
   something work, that is a finding — not a setup step.** Stop and report it. The workaround
   is the bug telling you where it lives.
3. **Corollaries seen in practice:** a broken reachability grep once reported every file as
   unimported and nearly caused a live, routed component to be deleted — resolve each import
   to a real path before calling code dead. A tool reporting success (e.g. a window resize)
   is not evidence the effect happened — read the real DOM or DB output. And after a
   "successful" save, confirm the value actually changed in Postgres.
