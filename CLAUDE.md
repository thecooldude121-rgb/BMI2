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
- **Auth is the SSO contract.** This CRM is the identity provider for Lead Generation and
  HRMS later, so all workspace-resolution logic lives server-side in `authController`: a
  client sends credentials and receives either a token or the set of workspaces to choose
  between. It never decides, and can never assert, which workspace a session belongs to.
  - The JWT's canonical claim is **`workspace_id`**. The DB column is still `tenant_id`;
    `middleware/auth.ts` maps claim -> request scope in exactly ONE place, so the rename can
    land later without breaking an external consumer.
  - Scope comes from the token and nowhere else — never a query param, body field or header.
    Otherwise `UNIQUE(tenant_id, email)` is enforced in Postgres and bypassable at the API.
    (Verified: a workspace-2 token passing `?workspace_id=<workspace-1>` still reads 0 rows.)
  - Login verifies the **password before disclosing any workspace**. Listing the workspaces
    an email belongs to and then asking for a password turns the endpoint into a
    membership-enumeration oracle. Failed auth returns one identical message whether or not
    the email exists.
  - Workspace provisioning is explicit. No "first workspace wins" fallback: one workspace is
    used because it is the only one, and a second makes `workspace_slug` required.
- **Registration is INVITE-ONLY, and this is a security boundary, not a workflow
  preference.** Open self-registration was a live exposure: `POST /auth/register` was
  unauthenticated, accepted any email domain, and resolved "one workspace exists -> join
  it", so a single curl from a gmail.com address produced a `sales` account that could read
  every contact, company and deal in the tenant. Query-layer isolation is worthless if
  workspace membership is obtainable from a public form — the front door matters as much as
  the queries.
  - An invite names the workspace AND the role, so neither is ever defaulted, and an
    invitee cannot choose their own privileges.
  - Invite tokens are stored as SHA-256 hashes, bound to one email address, single-use
    (claimed inside the registration transaction, so two requests racing one link cannot
    both win), and expiring. Same rules will apply to password-reset tokens.
  - Every rejection returns one identical message. Distinguishing "no such invite" from
    "expired" from "already used" tells a probe which tokens once existed.
- **Credential endpoints are rate limited, per IP and per email.** Per-IP alone is beaten by
  spraying one password across accounts from a botnet; per-email alone by rotating accounts
  from one host. Both run and either can reject. Emit standard `RateLimit-*` headers
  (draft-8) and 429 — a DAST scan looks for these. Store is in-process memory today: counters
  reset on restart and are NOT shared across instances, so `store` is the seam for
  `rate-limit-redis` once Redis is wired. Behind a proxy, `TRUST_PROXY` must be set or every
  request looks like it came from the load balancer and the per-IP budget becomes one global
  budget.
  - Tune with the shared-NAT case in mind. A 10-per-15-minutes per-IP login budget locked
    out its own verification run; an office behind one address would have read that as an
    outage. Successful logins do not consume the anti-brute-force budget — only failures are
    evidence of an attack.
- **No advertised demo credentials.** A "Demo Access" panel on the login page named an
  account that never existed. Real credentials come from `cd Backend && npm run db:seed:users`,
  which rotates the seeded users' passwords and prints them once to the console.
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

### Open architecture question — `employees` belongs to HRMS, not here
The `employees` table exists in this repo and has **no `tenant_id` column at all**, so an
employee reference cannot be workspace-scoped. Do **not** write a migration to scope it:
HRMS is a separate platform reached over the SSO/API boundary, so an employees table
probably should not live in the CRM at all.

Decide first: **drop it here and reference employees across the API boundary, or keep a
local mirror.** Until that is decided:
- **Do not JOIN `employees` to anything.** `tasks.related_to_type = 'employee'` is
  therefore the one `related_to_id` value that is not validated against the caller's
  workspace (`tasksController.RELATED_TABLE` omits it deliberately, with a comment). That
  is safe only for as long as nothing joins the table — the moment a query renders an
  employee name next to a task, it is a cross-workspace read.

### Known defect — `MAX(id) + 1` is a race, independent of tenancy
`companies`, `contacts`, `deals` and `tasks` all generate their `C001`/`CT001`/`D001`/`T001`
ids with `SELECT MAX(CAST(SUBSTRING(id, n) AS INTEGER)) + 1`. Two concurrent creates read
the same maximum and the second one violates the primary key — this has nothing to do with
workspaces and is not fixed by any tenant predicate.

Note also that these four queries are deliberately **not** scoped by `tenant_id`, and must
not be: `id` is a global primary key on all four tables, so scoping the scan would make the
second workspace regenerate `C001` and every insert would fail. The residual leak (the id
reveals a global row count) and the race have **one shared fix**: move to
`gen_random_uuid()`, or a per-table sequence. Do them together, not separately.

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

## Known gaps in the auth shell
- **Password reset is NOT built.** The "Forgot password?" link goes nowhere. It needs, in
  dependency order: transactional email delivery (provider, sender domain, SPF/DKIM) — this
  is the decision that blocks everything else; a `password_resets` table of single-use
  expiring tokens stored **hashed**, so a leaked table is not a set of live keys; rate
  limiting per email and per IP; request and confirm endpoints; and two screens.
- **Login rate limiting is NOT production-ready.** The limiter works and is verified, but
  its store is in-process memory: counters reset on every deploy and are not shared between
  instances, so N instances multiply every budget by N and a rolling restart clears an
  attacker's accumulated count. Redis is already named in the stack; `store` in
  `middleware/rateLimit.ts` is the single seam for `rate-limit-redis`. Treat the current
  state as a speed bump, not a control — and note a DAST scan against one instance will
  pass it while a real deployment behind several would not.
- **Workspace creation, user invites and the workspace switcher are deferred** to the
  Settings module. Registration joins the single existing workspace, and the server asks for
  a `workspace_slug` once more than one exists rather than guessing.

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

### One session per worktree
Two Claude Code sessions ran in this tree at once and it cost real time: one committed the
other's **uncommitted** `index.ts` refactor without the `app.ts` it imports, leaving a HEAD
that did not compile, and left an isolation-probe tenant behind in `bmi_crm` while the other
session was auditing live-data hygiene. Each session also saw `CLAUDE.md` and
`tsconfig.json` change underneath it mid-task.

Run **one session at a time in a given worktree**, or give each session its own
(`git worktree add`). And in any session:
- **Check `git status` before starting**, and again before committing.
- **Never stage a file you did not edit.** An unfamiliar uncommitted change is far more
  likely to be another session's work in progress than something abandoned — ask, don't
  assume, and don't commit around it.
- If a file changes under you mid-task, stop and reconcile rather than overwriting.

### Replacing this file — diff it first
When a replacement CLAUDE.md is handed over, **diff it against the existing one and report
which rules are being dropped before accepting it.** This is not bureaucracy: the rule
"never put a backtick in SQL inside a JS template literal" was in an earlier version of
this file, did not survive a replacement, and the same bug broke the backend build within
hours — in a different controller, written by someone else. A rule that only exists in one
session's memory is a rule that will be relearned the expensive way.

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
3. **Type errors in this project have twice concealed live, user-facing bugs — treat the
   count as a signal, not noise.** `AccountFormPage` read `account.address` (the field is
   `billingAddress`) and wrote a key the payload mapper never read, so the account edit form
   loaded a blank address and saved nothing under a success toast — the compiler had been
   reporting it all along as 24 lines of "noise". Separately, changing `login()` from
   `Promise<boolean>` to `Promise<LoginResult>` produced **zero** errors, because its caller
   did `if (success)` and `if (object)` is always truthy — every failed sign-in would have
   looked successful. Triage the backlog by REACHABILITY (is the file routed? does it touch
   a real API?), never by error code.
4. **Never put a backtick inside SQL written in a JS template literal.** It closes the
   string and the file stops compiling. This has now happened twice in this project within
   hours — once in `activitiesController` and once in `dealsController`, both while writing
   a comment that quoted a SQL fragment. Quote SQL in comments with plain text, not
   backticks.
5. **Corollaries seen in practice:** a broken reachability grep once reported every file as
   unimported and nearly caused a live, routed component to be deleted — resolve each import
   to a real path before calling code dead. A tool reporting success (e.g. a window resize)
   is not evidence the effect happened — read the real DOM or DB output. And after a
   "successful" save, confirm the value actually changed in Postgres.
