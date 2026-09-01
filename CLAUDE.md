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
- Database: **PostgreSQL**, accessed only through the Node backend API. **No Supabase.**
  (`pgAdmin 4` is a GUI client for administering the database — it is not part of the
  architecture.) An earlier version of this file said "PostgreSQL via Supabase
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)". That was wrong, inferred from a console
  warning, and it sent work down a dead end: `Frontend/src/lib/supabase.ts` and its callers
  are written against a backend that has never existed and never will.
  **A Supabase reference in this codebase is a defect to delete, never a dependency to wire
  up.** It is not an unconfigured integration and there is nothing to provision: no
  credentials, no project, no plan to create one. Encountering one — an import, a client
  init, an env var, a type, the package dependency — the correct action is removal, and
  never "make it work". Removal is sequenced with the Settings rebuild (see HANDOFF.md), so
  raise it rather than deleting it mid-task.
- Cache: Redis (sessions, tenant config, dashboard aggregates)
- File storage: S3-compatible (S3 or Cloudflare R2)

## Architecture rules (non-negotiable)
- **Multi-tenant.** Every table that holds tenant data has a `workspace_id` column, and
  *every single query* must filter by it. This is the #1 security requirement — a missed
  `workspace_id` filter is a data-leak bug between tenants, not a style issue. Flag it
  explicitly if you are about to skip one; that is a hard stop, not a nit.
- RBAC checks happen at the API layer, not just the UI.
- **The frontend must never query the database directly.** All data access goes through the
  backend API, where tenant scoping, FK ownership checks, and rate limiting are enforced in
  one place. A second data path is a second place for those to be forgotten — and the
  workspace-scoping work proved the point: the leak was not a missing `WHERE` clause but an
  unscoped `JOIN` and an unvalidated foreign id, both of which live in exactly the code a
  direct-from-browser query would bypass.
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
- **A foreign key supplied in a request body must be proven to belong to the caller's
  workspace before insert or update.** Every FK here references its parent's GLOBAL primary
  key (`deals_lead_id_fkey` is `REFERENCES leads(id)`, no tenant component), so Postgres
  happily accepts a row in workspace A pointing at workspace B. Referential integrity is
  satisfied and tenant isolation is not. Use `utils/tenantScope.ts`; the joins additionally
  carry `AND parent.tenant_id = child.tenant_id` so a reference that already exists cannot
  be read through either. Both halves are needed — the write creates the bad row, the join
  is what leaks it.
  - **The rejection is 400, and that is settled.** 403 and 422 were both considered; 400
    won because it matches the executable contract in `src/__tests__/tenantIsolation.test.ts`
    and is semantically defensible — from the caller's workspace that id simply is not a
    valid reference. Do not re-litigate it without changing the suite in the same commit.
  - The message names the FIELD and never discloses that the row exists elsewhere
    ("company_id does not name a company in this workspace"), for the same reason login
    returns one message for a bad password and an unknown email.
- **Transactional email goes through `services/email`, never a provider SDK at a call
  site.** Two consumers: workspace invites (built) and password reset (not built). The
  contract is `sendTransactional({ to, subject, template, vars })` — callers say what to
  send, not what it looks like. `EMAIL_TRANSPORT=log` renders to the log and **does not
  deliver**; the server refuses to boot if that is combined with `NODE_ENV=production`,
  because silently discarded invites and password resets are invisible until a customer
  reports never receiving one. Report `email_sent` from `ok && transport.delivers`, never
  from `ok` alone.
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
- **Never render a fabricated credential — no API keys, tokens, secrets, webhook URLs or
  connection strings. Not as a placeholder, not as an example, not behind a "regenerate"
  control.** A fake secret a user can copy is worse than a fake number they can only read:
  the number misleads inside the app, the secret leaves it. `IntegrationsContext` rendered
  `sk_live_abc123456789...` into an input with a copy-to-clipboard button, and a "regenerate"
  button that minted more with `Math.random()` — a string a user could carry into a config
  file, a ticket, or a message to a colleague, where it is indistinguishable from a real
  leaked key. This is the one fabrication class whose blast radius extends beyond the app, so
  it does not get labelled `PREVIEW · SAMPLE CONTENT` like a fake metric; it gets deleted. If
  a credential field has nothing real behind it, render an empty state, not a specimen.
- **Never mock at the provider level. A React context or provider that supplies fabricated
  data is the highest-severity form of this defect**, because every consumer inherits it
  invisibly and no individual component looks wrong. A page reading `useData()` is correct,
  idiomatic, reviewable code — and renders invented data anyway, so the defect is unfindable
  from the component you are looking at. `hooks/useDashboardData.ts:26` states the lesson
  exactly: *"Deliberately NOT a context. The dashboard is the only consumer, and a context is
  what let sample data spread to eighteen files unnoticed in the first place."* Copy that
  pattern — fetch, then pass down as props — rather than seeding provider state from a
  fixture. Three providers in this repo did the latter (`DataContext`, `AccountsContext`,
  `IntegrationsContext`); see `FABRICATED_DATA_AUDIT.md`.
- **A component tree with zero data-fetching calls is suspected fabricated code — report it,
  do not assume it is a work in progress.** Grep the whole tree for `fetch(`, the API client
  and the data contexts; if the count is zero across every file, the feature is backed by
  nothing no matter how finished the UI looks. This has now happened twice at whole-feature
  scale: the six-widget dashboard built from hardcoded literals, and a second complete Deals
  implementation (`components/Deals/`, 8 files, ~4,400 lines, routed and drag-and-droppable)
  whose data came from `generateSampleDeals()` — zero `fetch` calls in the entire directory,
  sitting next to the real `DataContext`-backed one. Both read as unfinished work; both were
  finished, and fake. The tell is cheap to check and the assumption is expensive.

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
- **Settings will be built fresh against the backend API.** There are two existing Settings
  trees and NEITHER is a starting point — both are dead code kept only as UI reference:
  - `pages/Settings/` (20 files) drives `contexts/SettingsContext.tsx`, whose 46 queries go
    to Supabase — a backend that does not exist. Not "unconfigured": wrong.
  - `pages/CRM/CRMSettings/` (36 files) has zero `fetch` and zero `localStorage`; it
    persists nothing at all.
  Do not extend, repair or migrate either one. When the Settings module is built, it talks
  to the Node API like every other page, and these two trees are deleted then.
- **CHECKLIST — when the new Settings module ships, do all four of these together.** This
  is the last of the Supabase removal, deliberately sequenced behind the rebuild because
  the importing files are the trees due for deletion. Do not let it become permanent debt:
  1. Delete `Frontend/src/lib/supabase.ts` (down to 12 lines — client construction only).
  2. `npm uninstall @supabase/supabase-js` in `Frontend/`.
  3. Delete `pages/Settings/` and `pages/CRM/CRMSettings/`, and
     `contexts/SettingsContext.tsx` with its 46 stripped-but-still-present queries.
  4. Rebuild `ProfileSettings` against real endpoints — and note that **the
     update-profile and change-password endpoints do not exist yet**; `authController`
     exposes only register / login / me. The form is disabled and labelled until they do.

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

1. **A probe you construct tests the endpoint, not the feature. A hand-written payload is
   not the UI's payload.** Every write endpoint the frontend calls was probed with curl and
   every one returned 201/200, which produced a confident and wrong conclusion: that lead
   conversion was the only structurally impossible feature. The probes omitted `status`,
   because a human writing a payload by hand sends the minimum. The real Add Lead form sends
   `status: 'new'`, which the API rejects — so creating a lead had never worked, and the
   probe passed straight over it. Two more never-worked features were sitting behind that
   gap. **Drive the real form, or copy the exact payload the client sends (read it off the
   network tab), before concluding an endpoint is healthy.** A green probe suite means the
   routes exist, nothing more.

2. **Watch the request count before trusting what the UI shows.** Verifying the fix to a
   lying status badge, the badge correctly read "New" after a rejected write and that was
   nearly recorded as a pass. It was not: the backend request log showed the count had not
   moved, so the click had never fired a request at all and the badge was unchanged for the
   wrong reason. A UI that looks right because nothing happened is indistinguishable from a
   UI that looks right because the code works. **Confirm the action actually reached the
   server — request count, backend log, network tab — and only then read the screen.** This
   is the same failure as a success toast over an unchanged database, one layer earlier.

3. **Fixing a data provider does not fix consumers that bypass it. When verifying a
   provider fix, confirm each consumer actually READS the provider.** A component that
   destructures a context and never uses it looks wired and is not. `GamificationPage` did
   exactly that: `const { leads, deals, tasks, employees } = useData()` followed by not one
   reference to any of them, while every figure on the page — level, XP, a 7-day streak, a
   team leaderboard, "92% confident" coach insights, challenge progress — was a hardcoded
   literal in local state. Rewiring `DataContext` to the database could not reach it,
   because it never consumed `DataContext`. The tell is cheap: TypeScript reports it as
   `TS6198: All destructured elements are unused`, which is one of the "noise" codes this
   project has twice been burned by ignoring. **A provider fix is verified per consumer,
   never once at the provider** — and the count of consumers you claim is the count you
   actually opened and cross-checked, not the count that imports the context.

4. **Verify the network response before reporting a failure — but a 200 is not evidence the
   screen is right.** A page was twice reported as broken ("0 accounts / could not load
   deals") when all three requests were returning 200; the screenshots were simply taken
   before the fetch resolved. So check the network log first, and note precisely what it
   proves: **that the request succeeded, not that the rendered value came from it.**
   `pages/Accounts/EnhancedAccountDetailView.tsx` is the documented counter-example — it
   fetches real contacts and activities on 200s, then renders `mockActivities` (an invented
   "Sarah Chen" timeline) and discards the real result, so "I checked the network log and saw
   200s" clears a page that is showing fabricated data. **For data correctness, cross-check
   the rendered value against the database row**: Nancy Wilson / FinSolve Ltd / 98 on screen,
   then `SELECT name, company, score FROM leads WHERE id = 36`, and FinSolve $120K on a deal
   card against `value = 120000.00`. Network log for "did it load"; a SQL query for "is it
   true". The two questions are separate and need separate evidence.
5. **Verify through the same entry point a real user uses.** Not the file you edited, not a
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

   **When a verification step cannot be performed as specified, say so explicitly and explain
   why it does or does not matter for that specific change. Never silently substitute a
   weaker check.** A substituted check reported as a clean pass is how a fix stays broken for
   three commits. Name what you could not do, what you did instead, and what that leaves
   unproven — then let the reader judge the gap. Worked examples from this project:
   - `/integrations` was verified by direct URL rather than a sidebar click, because a dev
     widget was intercepting the click. Stated, with the reason it was tolerable there: the
     object of verification was what the page *rendered*, not the nav path. Had the change
     been about navigation — as the Lead Generation deletion was, where sidebar absence was
     the whole point — the same substitution would have invalidated the result.
   - The `RecentActivity` route repair could not be exercised by click at all, because
     `activities` is 0 rows and the feed renders its empty state. Reported as not proven
     rather than counted as passing; fabricating an activity to force the path would have
     broken the no-fabricated-data rule to satisfy a verification rule.
6. **Type errors in this project have twice concealed live, user-facing bugs — treat the
   count as a signal, not noise.** `AccountFormPage` read `account.address` (the field is
   `billingAddress`) and wrote a key the payload mapper never read, so the account edit form
   loaded a blank address and saved nothing under a success toast — the compiler had been
   reporting it all along as 24 lines of "noise". Separately, changing `login()` from
   `Promise<boolean>` to `Promise<LoginResult>` produced **zero** errors, because its caller
   did `if (success)` and `if (object)` is always truthy — every failed sign-in would have
   looked successful. Triage the backlog by REACHABILITY (is the file routed? does it touch
   a real API?), never by error code.
7. **Never put a backtick inside SQL written in a JS template literal.** It closes the
   string and the file stops compiling. This has now happened twice in this project within
   hours — once in `activitiesController` and once in `dealsController`, both while writing
   a comment that quoted a SQL fragment. Quote SQL in comments with plain text, not
   backticks.
8. **Verify cleanup by re-counting, not by the delete returning without error.** A probe
   workspace and company survived a session because the cleanup script died part-way and the
   earlier statements' success was taken as the whole thing having run. They were only found
   by counting rows afterwards. Same shape as everything else here: check the end state, not
   the absence of an error.
9. **Corollaries seen in practice:** a broken reachability grep once reported every file as
   unimported and nearly caused a live, routed component to be deleted — resolve each import
   to a real path before calling code dead. A tool reporting success (e.g. a window resize)
   is not evidence the effect happened — read the real DOM or DB output. And after a
   "successful" save, confirm the value actually changed in Postgres.
