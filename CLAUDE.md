# Project: BMI Platform — AI CRM

## What this is
A multi-tenant B2B SaaS CRM. **This repo is the CRM platform.** It is not "module 1 of 4" —
that framing is retired. **Lead Generation and HRMS are separate products, with their own
repos and their own deployments**, connected to this one over SSO. They are not future
phases of this codebase, and no amount of "later" makes them belong here. **Meeting Agent's
status is undecided — mark it TBD; it is not in scope either way.** Do not build any of the
three.

Do not build AI features (email drafts, deal health scoring, next-best-action) yet either —
those are Phase 2. This phase is CRM core data + pipeline only.

Target users: Account Executives, Sales Managers, SDRs at IT Services / EdTech companies in
India, Middle East, and Africa.

> **Note:** This file was introduced late in the project. Earlier sessions ran without these
> rules loaded, so parts of the existing codebase may not comply. Where built code and this
> spec disagree, surface the conflict rather than silently following either one.

## Identity & SSO — this CRM is the identity provider
**This CRM owns workspaces, users, roles and authentication for the whole platform family.**
Lead Generation and HRMS authenticate against it; they do not have their own user stores.
The mechanics of that contract are in "Auth is the SSO contract" under Architecture rules
below — this section defines the boundary, not the protocol.

- **`workspace_id` is a shared identifier that external platforms CONSUME, never MINT.** It
  originates here and only here. If Lead Gen or HRMS ever mints one, two systems disagree
  about what a workspace is and every tenant-scoping guarantee in this file stops being
  enforceable. (The DB column is still `tenant_id`; the JWT claim and the external contract
  are both `workspace_id` — `middleware/auth.ts` maps between them in exactly one place.)
- **Cross-platform data exchange happens over a defined API boundary. Never assume shared
  database access to Lead Gen or HRMS tables.** No JOIN, no view, no second connection
  string, no "it's the same Postgres for now". A query that reaches another product's table
  is a design error even when it runs: that product owns its schema, is free to change it,
  and will not tell you.
- Anything from another platform arrives as a value this CRM stored, or as the response to a
  call this CRM made. It does not arrive as a row you can join to.
- `employees` is the worked example of getting this wrong — see "Open architecture question"
  below. It sits in this repo, has no `tenant_id`, and belongs to HRMS.

### "Leads" (ours) vs "Lead Generation Tool" (theirs) — do not conflate
The names differ by one word. The concepts do not overlap.

- **"Leads" IS part of this CRM and stays.** SLA tracking, duplicate detection, the
  qualification pipeline, lead scoring, and conversion to contact / account / deal. It lives
  at `/crm/leads`, in `pages/CRM/Lead*`, `components/Leads/` (plural), `types/leadDomain.ts`,
  and `Backend/src/controllers/leadsController.ts`. First-class CRM module.
- **"Lead Generation Tool" is the separate platform and does not belong in this repo.**
  Sourcing, prospect discovery, enrichment, outbound sequences, campaigns. Its code was
  deleted in `881857f` (118 files, 56,073 lines) and must not come back.
- We **work** leads that already exist; that product **finds** them. Before deleting, moving
  or "consolidating" anything with "lead" in its name, decide which of the two it is — and
  say which, out loud, in the commit message.

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
  HRMS — separate platforms, see "Identity & SSO" above — so all workspace-resolution logic
  lives server-side in `authController`: a
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
    value NUMERIC(12,2) NOT NULL,   -- NOT (15,2), and NOT nullable: see drift note below
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

### FIXED — `MAX(id) + 1` was a race. Ids now come from per-table sequences.
`companies`, `contacts`, `deals` and `tasks` used to generate their
`C001`/`CT001`/`D001`/`T001` ids in application code with
`SELECT MAX(CAST(SUBSTRING(id, n) AS INTEGER)) + 1`, reading the maximum in one statement
and inserting in another. Node yields at every `await`, so two concurrent creates computed
the same id and the second violated the primary key — arriving at the caller as an
unhandled 23505 that `errorHandler` masks as a bare `500 Internal Server Error`. None of
the four create paths was even inside a transaction.

**This was measured, not theorised**, and it was far worse than "a race under load":

| Concurrent creates | Before |
|---|---|
| 2 (one double-click) | 5 of 10 trials lost a write |
| 3 (two or three users) | 10 of 10 trials lost a write |
| 5 | 30 of 50 writes lost |
| 10 | `companies`/`deals`/`tasks` created only 3 of 10 |

The worst case was CSV import — the documented migration path from Salesforce/HubSpot: an
import racing a single form create reported `created=4 failed=1`, so a customer was told a
row of their own file was bad when the real cause was an id collision.

**Migration 031 creates one sequence per table and wires it as the column `DEFAULT`**
(`'C' || LPAD(nextval('companies_id_seq'), 3, '0')`, and so on), seeded with
`setval(..., COALESCE(max, 0) + 1, false)`. All 8 app-side computations are gone — the four
form-create paths and both CSV import paths — and no insert sends `id` any more.
`nextval()` is atomic, so the read-then-write window does not exist rather than being
narrower. Re-measured with the identical probe afterwards: **0 lost writes at N=2, 3, 5 and
10, on all four tables, and the CSV/form race reports `created=5 failed=0`.**
`roundTrip.idConcurrency.test.ts` keeps that permanently, and asserts ZERO losses
deliberately — "usually fine" is exactly what the old code looked like at N=1.

Ids keep their human-readable format on purpose: they are user-visible and referenced by
hand (HANDOFF.md names deal `D053`), and `varchar(10)` holds the prefix plus nine digits.
Sequences are **not** gap-free and that is accepted — a rolled-back insert or a CSV dry run
consumes its number. `nextval()` being non-transactional is precisely what makes it safe.

The sequences are deliberately **not** per-workspace, for the same reason the old scan was
not tenant-scoped: `id` is a global primary key on all four tables, so a per-workspace
sequence would regenerate `C001` in the second workspace and every insert would collide.

**Still open, and deliberately deferred: the id-count enumeration leak.** `C042` reveals
that 42 companies exist across all workspaces, because a sequence is shared and monotonic.
An earlier version of this file claimed the leak and the race "have one shared fix: move to
`gen_random_uuid()`, or a per-table sequence. Do them together, not separately." **That was
wrong on both counts and is why this note replaces it:** a per-table sequence fixes the
race and does nothing for the leak, so the two are not one fix; and insisting they move
together would have held a write-losing reliability bug hostage to a minor information
disclosure. They were separated on purpose.

Only a move to random/UUID ids closes both, and that is a much larger, product-visible
change — it would break every existing human-readable id and require rewriting **10 FK
columns across 6 tables** (`activities.company_id`/`contact_id`/`deal_id`,
`contacts.company_id`, `deals.company_id`, `quotes.company_id`/`contact_id`/`deal_id`,
`deal_stage_history.deal_id`, `sales_orders.deal_id`), plus widening `varchar(10)`
everywhere. `activities.id` already does this (`replace(gen_random_uuid()::text,'-','')` in
a `varchar(32)`) if that route is ever taken. Treat the leak as **lower severity than the
race was**: it discloses a row count, it does not lose data.

### Known schema drift (do not assume the spec above is what's deployed)
- `EnhancedAccount` uses `billingAddress`, **not** `address` — an earlier bug had the edit
  form reading `address.street`, silently discarding saved addresses.
- `companies` has **no** `accountOwner` or `accountStatus` columns.
- `leads.status` in the database is `active | inactive | nurturing`. The frontend
  `Lead.status` carries a different *stage* vocabulary (qualified / won / lost). These are
  two different fields — do not conflate them when writing SQL.
- **`deals` drifts from the spec above in four places.** All four verified directly against
  `bmi_crm` via `information_schema`, 2026-09-03:
  - **`value` is `NUMERIC(12,2)` and `NOT NULL` with no default** — not `DECIMAL(15,2)`
    nullable. A missing `value` therefore used to reach Postgres as a raw 23502 and surface
    as a masked 500 `Internal Server Error`, telling the caller nothing.
    **The fix was validation-only, deliberately: `createDeal` now rejects a missing or
    non-numeric or negative value with a clean 400, and the column was left alone.** No
    migration, no default, no nullability change. The reason it did not need one is that
    the real Add Deal form always sends a value — `ComprehensiveDealFormPage` sends
    `parseFloat(d.value) || 0` — so a blank amount arrives as a literal `0`, which is
    valid and stored as `0.00`. Whether a deal may have *no* value at all is a data-model
    question and is still open; it should not be settled as a side effect of unmasking an
    error. `roundTrip.deals.test.ts` pins both the 400s and the `0` boundary.
  - **`currency` is `NOT NULL DEFAULT 'USD'`**, not `DEFAULT 'INR'`. Worth knowing before
    writing anything that assumes INR for the India/MEA target market.
  - **`stage` is nullable with no default**, not `NOT NULL DEFAULT 'lead'`.
  - **There is no `close_date` column — it is `expected_close_date`.** This is the same
    shape as the `address` / `billingAddress` bug above, so treat it the same way: a query
    or form field written against `close_date` fails silently rather than loudly.

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
scoring, next-best-action. Omit these rather than half-building them. Meeting Agent is TBD
and out of scope; Lead Generation and HRMS are not "not in this phase" at all — they are
other products, and nothing about them is ever built here.

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

## Backlog — scoped, not built

Recorded here because it was scoped in a planning conversation OUTSIDE the repo and
therefore could not be found on disk. If a work item is agreed somewhere else, add a line
here in the same session, or the next person re-derives it or guesses wrong.

- **Item 5 — configurable deal pipeline stages. PHASE A IS DONE; Phase B is next.**
  Design in `PIPELINE_STAGES_DESIGN.md`, schema in migration 037. Phase A made stages real
  per-tenant rows (`pipeline_stages` gained `slug`, `stage_type`, `archived_at`) and
  `deals.stage_id` a NOT NULL foreign key, dual-written alongside the `stage` text column
  which is still what reads use. **Phase B is the cutover** — the stage-config API and
  admin UI, and the 26 frontend files carrying hardcoded stage knowledge, one vertical
  slice at a time with the Kanban first. Phase C drops `deals.stage` and `is_won`/`is_lost`.
- **Password reset — still its own separate, real gap, and NOT part of item 5.** It is
  detailed under "Known gaps in the auth shell" below and is blocked on a different
  decision entirely (a transactional email provider, sender domain, SPF/DKIM). The two
  share nothing but the word "configuration"; do not fold one into the other.
- **Structured qualification scoring would be built NEW, not recovered.** The Lead
  Generation Tool deletion (`881857f`) also took a BANT qualification framework with it —
  `components/LeadQualification/BANTFramework.tsx`, `AIScoreBreakdown.tsx`,
  `QualificationHistory.tsx` and `services/bantValidationService.ts`. That was correct:
  every importer was under `pages/LeadGeneration/`, no CRM-side file referenced any of it,
  and deleting it broke nothing. But it is now **fully gone from the repo** — two stray
  string mentions survive (`utils/leadScoring.ts`, `DealDetailsPanel.tsx`) and no
  implementation. So if structured qualification scoring is ever wanted in the CRM Leads
  module, do not go looking for it in git history expecting a starting point: it was
  fabricated UI with no fetch behind it, and the work is a new build.

- **Document access/download telemetry needs an events table, and is NOT built.**
  `DocumentDetailPage` rendered a per-document "12 views" and a download count, plus
  a "Last Viewed" date. None had a column: `access_count`, `download_count` and
  `last_accessed_at` do not exist on `documents`, and the counts were a hardcoded
  literal (`access_count || 12`) and a client-side counter that reset on reload. They
  read as an audit trail of who opened a file, which is why they were deleted rather
  than labelled. Recording them for real means a new append-only events table
  (document id, user id, action, timestamp, workspace) plus a write on the content
  endpoint — deliberately out of scope for what was meant to stay a small wiring fix,
  the same call made for the BANT framework and the `ROLE_MAP` fallback.
- **`documents.module` / `record_id` have no foreign key, so related-entity panels
  stay empty.** The detail page's related deal, account and contacts came from a
  fixture keyed off three hardcoded document ids. The real columns are a free-text
  module name and a free-text id with nothing constraining either, so resolving them
  needs the same decision `deals.pipeline_id` needs: become a real FK, or stay a
  loose reference and be validated on write. Until then those panels render their
  empty state rather than an invented deal.
- **Document sharing does not exist, and its modal never worked.**
  `ShareDocumentModal.onShare` passes one object; `handleShareDocument` took
  `(userId, visibility, message)`, so the object arrived as `userId`, the team-member
  lookup never matched, and every attempt fell into "Please select a user". Had it
  matched it would have toasted success for local state that vanished on reload.
  There is no `document_shares` table, no `visibility` column, and no endpoint
  honouring a permission or an expiry. The handler now says so; the modal still
  collects a permission and an expiry that go nowhere, which is the visible part of
  the gap.

## Roles — who may grant what

**Nobody may invite someone above their own role.** `POST /invites` is gated on
`requireRole('admin', 'manager')`, and the role in the body was validated only against the
full list — so a **manager could invite an admin**, accept the invite at a second address,
and hold an account that could do everything they could not, including deactivating them.
Two steps, no exploit required. `INVITABLE_BY` in `invitesController` now bounds it and
answers **403**; `invitableRolesFor()` keeps the UI picker in step so a manager is never
offered an option the server will refuse. The server is the control; the picker is a
courtesy.

### CLOSED — `PATCH /users/:id/role` changes an existing user's role
This was a tracked gap: a role was set **once**, by an invite or by `db:seed:users`, and
could never be changed, so a workspace whose only privileged user was a manager could not
promote them and everything gated on `requireRole('admin')` was unreachable from inside it.

The endpoint is gated on the same `DESTRUCTIVE_ACTION_ROLES` as deactivation, and applies
four guards that fail independently:

1. **Never assign a role above your own** — literally the invites rule, now shared:
   `INVITABLE_BY` moved to `utils/roles.ts` as `rolesAssignableBy`, because a manager who
   cannot *invite* an admin but can *promote* one has not been stopped. 403.
2. **Never act on someone who already holds a role above your own** (`canActOn`). Guard 1
   bounds only what is handed out, which leaves the same escalation reachable from the
   other end: a manager could demote the admin above them to `sales`, a role they ARE
   allowed to assign. 403.
3. **The last active admin or manager cannot be demoted out of that set**, by anyone
   including themselves — the same invariant, the same workspace-keyed
   `pg_advisory_xact_lock` and the same count-the-others query as deactivation. They share
   the lock because they can now break the invariant *together*: one admin demoting while
   another deactivates. 409.
4. **A no-op writes nothing**, so a double-submitted form does not bump `token_version`
   twice and sign somebody out for a change that did not happen.

Self-demotion IS allowed when someone else is still privileged, and deliberately differs
from `deactivateUser`, which refuses self always: deactivating yourself ends your session
with no way back, while demoting yourself leaves another admin able to reverse it.

**`token_version` is bumped, and the reason is the client, not the control.** `protect`
reads the role from the row on every request, so a role change is enforced on the very next
request with a zero-length stale window and needs no revocation — that answers the question
this note used to leave open. What is stale is the browser, which caches the user object
from login and would keep offering admin controls after a demotion. Bumping forces a fresh
sign-in so the two agree.

Coverage is `roundTrip.userRoles.test.ts` (14 tests). Every guard was mutation-tested —
each one disabled in turn, confirming a test fails — including the advisory lock, whose
removal fails the demote-races-deactivate test.

#### DONE — the role picker is wired, and the RULES ARE SERVED, not mirrored
`TeamManagement` renders it, and the important part is where its options come from.

**`GET /users` now carries the rules with the roster:** an envelope field
`assignable_roles` (this caller's `rolesAssignableBy`) and a per-row `can_change_role`
(`canActOn`). Both are computed by `utils/roles.ts` — the same module `PATCH
/users/:id/role` and `POST /invites` enforce with — so the client renders the rule instead
of re-deriving it. A manager therefore never SEES `admin` in the picker, and a row for
someone who outranks the caller gets **no control at all, not a disabled one**: a disabled
control advertises an action that does not exist for you.

Both are empty/false for a caller who cannot change roles, because `GET /users` is
deliberately ungated (assignment pickers need the roster) while the role change is not.

**Why served rather than mirrored, concretely:** `invitableRolesFor()` in `usersApi.ts` was
exactly that mirror, written for the invite form — and it had ALREADY DRIFTED. It listed
sales/manager/admin and omitted `hr`, which the server's `ASSIGNABLE_ROLES` included at the
time. That is the prediction "two lists that must agree will disagree" already come true,
in this repo, before anyone noticed.

> **`hr` IS NO LONGER A CRM ROLE**, so the two lists now agree on its absence. They agree
> because there is ONE list, not because the vocabularies happen to match — which is the
> whole point, and the reason this passage is kept in the past tense rather than deleted.
> See "The `hr` role is gone" below.

Other behaviour worth not regressing: the confirm button is **disabled on a no-op** (the
picker opens on the member's current role) because a no-op returns 200 and a success toast
for a change that did not happen is this project's signature failure; a **409 is rendered
inline, verbatim**, because the last-admin guard's message is the only part that says what
to do instead; and the **sign-out consequence is stated before confirming**, phrased for
yourself when the target is you.

#### DONE — the invite form reads a served list too, and the mirror is deleted
`GET /invites` now carries `assignable_roles`, from the same `rolesAssignableBy` that
`POST /invites` enforces with. No gate is needed there, unlike `GET /users`: the route is
already `requireRole('admin','manager')`, so everyone who reaches it may grant something.

**`invitableRolesFor()` and `INVITABLE_ROLES` are gone**, along with
`utils/invitableRoles.test.ts` — a test of deleted code tests nothing, and what it protected
(a manager is not offered `admin`) is now covered against the real server in
`roundTrip.userManagement.test.ts` and against the real component in
`TeamManagement.test.tsx`.

**What the mirror had actually cost, confirmed rather than hypothesised:** it listed
sales/manager/admin and omitted `hr`, so the invite form could not invite an HR user at all
even though the server accepted it. Nothing failed and nothing was logged — the option
simply was not there. That is the whole argument for serving a rule instead of copying it,
in one concrete bug. (`hr` has since been removed from the CRM outright; the argument does
not depend on the role, only on the copy.)

**No client-side copy of the assignable-role rule remains anywhere in the frontend.** Both
pickers read a served `assignable_roles`: `fetchInvites` for the invite form, `fetchRoster`
for the role picker.

### The `hr` role is gone from the CRM — deliberately, not by drift
HRMS is a separate platform reached over SSO (see "Identity & SSO"), so HR is not a CRM
persona and this CRM has no permission to grant one. `hr` is removed from
`ASSIGNABLE_ROLES` and `RANK` in `utils/roles.ts`, and from every frontend role map.

**Checked before removing, because the answer decides whether it orphans anyone: ZERO users
held `hr` in any workspace, and there were no pending invites at all.** No migration was
needed either — neither `users.role` nor `workspace_invites.role` has a CHECK constraint,
and `db:seed:users` hardcodes no roles (it reads existing rows and rotates their passwords).

**The distinction between "deliberately gone" and "accidentally missing" matters more here
than anywhere else in this file**, because `hr` IS this repo's canonical drift story — the
two passages above are about it. So the tests assert its absence ON PURPOSE:
- `roundTrip.userManagement.test.ts` renamed its case to "hr is DELIBERATELY absent" and
  asserts `POST /invites` with `role: 'hr'` returns **400**. That assertion carries the
  weight: a drifted list would still have ACCEPTED `role: 'hr'`; this refuses it.
- `TeamManagement.test.tsx` still feeds its mock `hr` on purpose. The property was never
  "hr is offered" — it is that the client keeps no vocabulary of its own. Reintroduce a
  client-side allowlist and `hr` is precisely what gets filtered, and that test fails.
- Both were mutation-tested: restoring `hr` to `ASSIGNABLE_ROLES` and `RANK` fails them.

### FIXED — `AuthContext`'s role map fails closed
`ROLE_MAP` in `contexts/AuthContext.tsx` used to fall back `?? 'Sales'`, so any role string
the UI did not recognise silently presented as a real role, with CRM navigation attached.
Found while removing `hr`. It now falls back to `'Unknown'`, which `hasPermission` maps to
`[]` — no module at all — and `TopBar` renders as "Unknown role" rather than a bare word
under someone's name.

This was always a DISPLAY-layer bug, never a privilege grant: the API is the control,
`requireRole` refuses any role it does not recognise and `rankOf` ranks unknown roles 0. It
still mattered, because a UI that shows you a door the server will not open is the same
class of defect as a success toast over an unchanged database. `users.role` has no CHECK
constraint, so an arbitrary string remains storable directly even though the API will not
produce one; `'Unknown'` is what the UI does when it meets one.

Pinned by `contexts/AuthContext.roleMapping.test.tsx` (10 tests), which drives a real
session — token in storage, `GET /auth/me` response — rather than poking provider state,
and asserts an unrecognised role is not ANY known role rather than merely checking one
value. Mutation-tested: restoring `?? 'Sales'` fails 9 of the 10.

### The live workspace has an admin again
It had four `sales` and one `manager` and **zero admins**, so the stage-configuration screen
was unreachable by anyone in it. `david@bmicrm.com` (David Kumar, user id 5) was promoted
`manager` -> `admin` on 2026-09-06 with a direct, scoped UPDATE — before the endpoint above
existed, and recorded here so the change is auditable rather than mysterious:

```sql
UPDATE users SET role = 'admin', token_version = token_version + 1, updated_at = NOW()
 WHERE email = 'david@bmicrm.com'
   AND tenant_id = '2f5b4330-6101-4aee-bd4f-8917a83cce6b'
   AND role = 'manager';
```

The `AND role = 'manager'` makes it a no-op if run twice against an already-promoted row,
and the `token_version` bump ends his existing sessions so the browser stops rendering the
manager view. **Any future promotion goes through the endpoint, not through SQL.**

## Pipeline stages

### Every workspace must be provisioned with a pipeline
`deals.stage_id` is NOT NULL (migration 037) and is resolved against the workspace's own
stage configuration, so **a workspace with no pipeline cannot create a single deal** — the
write fails with a 400 rather than anything that points at the real cause. Call
`provisionDefaultPipeline()` (`utils/pipelineStages.ts`) wherever a workspace is created.
Today only the test helpers create workspaces; **when real workspace creation ships in the
Settings module, it must call it too.** This was found by thirty round-trip tests failing
at once, not by the design.

Related: a stage is never accepted from a request body as an id. A caller names a stage by
slug and the server decides which row that is, scoped to the caller's workspace — so a
stage id from another workspace has no shape in which it can be sent.

### The stage IS `stage_id`. There is no `deals.stage` column (migration 038)
037 created the rows and backfilled `stage_id` while leaving the old varchar `deals.stage`
in place; 038 dropped it, along with `pipeline_stages.is_won` / `is_lost`. What that means
for anything written from here on:

- **The API still returns a `stage` field and it is still the slug** — projected as
  `ps.slug AS stage` through a tenant-matched join. That projection landed one phase before
  the drop precisely so the response shape would not change on the day the column went, and
  a before/after payload diff on live data confirmed it: 24 deals, zero differing fields or
  values, detail endpoint identical.
- **Won/lost is `stage_type`**, one NOT NULL column with a CHECK, not two independent
  nullable booleans that could disagree or both be true. Classify with the curried
  predicates in `utils/pipelinesApi.ts` (`isWonWith(lookup)`), never by comparing a slug to
  a literal — the whole point is that a workspace names its own stages.
- A query written against `deals.stage` now fails loudly instead of silently, which is the
  one respect in which this is easier than the `close_date` / `expected_close_date` drift
  above.

### TRACKED GAP — `deals.pipeline_id` is an unconstrained varchar slug
It holds a pipeline **slug** as `character varying` with **no foreign key**, so nothing
stops a typo'd or stale value from being stored, and nothing removes it when a pipeline is
renamed or deleted. The deal and its stage can therefore disagree about which pipeline they
are in — which is not hypothetical: it is what produced the live "Stage 1 of 6,
Prospecting" mis-render on a Renewals deal during Phase B.

Deliberately **not** folded into migration 038 — that migration's job was dropping columns,
and a schema change with a different rationale does not belong in the same transaction.
Same treatment as the role-change gap above: real, structural, not urgent. Whoever fixes it
has to decide first whether the column becomes a UUID FK to `pipelines(id)` (consistent with
`stage_id`, and it would then need `AND parent.tenant_id = child.tenant_id` on every join
like every other FK here) or stays a slug with a composite FK to a unique
`(tenant_id, slug)`. 038 asserts the two agree today, so the fix starts from a clean state.

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
- **CHECKLIST — when the new Settings module ships, do all of these together.** This
  is the last of the Supabase removal, deliberately sequenced behind the rebuild because
  the importing files are the trees due for deletion. Do not let it become permanent debt:
  1. Delete `Frontend/src/lib/supabase.ts` (down to 12 lines — client construction only).
  2. `npm uninstall @supabase/supabase-js` in `Frontend/`.
  3. Delete `pages/Settings/` and `contexts/SettingsContext.tsx` with its 46
     stripped-but-still-present queries.
     **CORRECTION — `pages/CRM/CRMSettings/` is NOT being deleted, and this line used
     to say it was.** The Settings module was not rebuilt as a new tree next to the two
     dead ones; it was rebuilt FILE BY FILE INSIDE `pages/CRM/CRMSettings/`, which is
     the tree routed at `/crm/settings`. `GeneralPreferences` (checkpoint 1),
     `TeamManagement` (checkpoint 2) and `ProfileSettings` / `PasswordSettings`
     (checkpoint 3) are now real API consumers living there. The rest of that directory
     is still unwired UI. So the deletion target is `pages/Settings/` only, and
     `pages/CRM/CRMSettings/` is shrinking one wired file at a time instead.
  4. **DONE (checkpoint 3).** `ProfileSettings` reads GET /auth/me and writes
     PATCH /auth/me; `PasswordSettings` posts to /auth/change-password and stores the
     reissued token. The claim that "the update-profile and change-password endpoints
     do not exist yet" was true when written and stopped being true at commit c0afb00.
  5. **CLOSED.** The navigation gap is fixed — see the route map below.

### Settings route structure (settled — do not reintroduce a second Settings page)
**`/crm/settings` is the Settings module.** It renders `pages/CRM/CRMSettings.tsx`, whose
Account, Preferences and Team sections are wired to the Node API. Every entry point in the
chrome goes there: the sidebar's pinned Settings link, the profile menu's "Profile
Settings" item, and `ForbiddenAccess`'s default return path.

**`/settings` redirects there** (`<Navigate replace />` in `App.tsx`). It used to render
`pages/Settings/SettingsPage` — the dead Supabase tree's hub — and leaving it reachable
would have meant a second, mostly-inert Settings page one bookmark away from the real one.

**The dead tree's files are kept, not deleted.** `SettingsPage`, `RolesManagement` and
`PermissionMatrix` remain as UI reference for whenever a real roles backend is designed.
Nothing in the app imports them any more; `pages/Settings/rolesPagesLabelling.test.tsx`
does, deliberately, so they keep compiling instead of rotting while they wait. Their
deletion stays on the Supabase checklist above.

**Three exceptions, deliberately left alone:** `/settings/integrations`,
`/settings/workflows` and `/settings/notifications` still render their own pages. They are
not part of the roles hub, nothing links to them (no `Link`, `NavLink` or `navigate()`
anywhere), and whether they belong under `/crm` is a separate decision. The redirect is
declared on the bare path, not as a wildcard, so it cannot swallow them by accident — and
a test asserts exactly that.

**Why this is written down at all:** three checkpoints of wired Settings work were
invisible from the product because the nav pointed at the other tree. That is lesson 5,
and a route constant produces no type error and no failing test when it regresses — so
`components/Layout/settingsNavigation.test.tsx` pins it.

## Suite stability — ONE tracked flake, six data points

**Canonical tracking lives here.** It accumulated across sessions in
`PROMPT_C_SUMMARY.md`, which is a dated session record rather than a live document, so the
tracking moved rather than being kept in two places that would drift.

**The signature, and all four parts must match before adding a data point:**

1. It only ever happens in a **full `npm run test:isolation` run**. The same file passes
   repeatedly in isolation, and the same full suite passes on re-run.
2. It presents as a **`401` whose body is `{}`** — which matches no 401 in this codebase,
   every one of which sends a JSON message — or as a ~30-second wait for a connection.
3. A failing run **leaves orphaned `rt-` tenants** in `bmi_crm_iso_test`, because the
   suite's `afterAll` never completes.
4. The affected test is a **different shape every time**, which is the strongest evidence
   that the cause is environmental — the shared `pg` pool under load — rather than anything
   in the test.

Ruled out already: `JWT_EXPIRES_IN` (7 days), and login rate limiting (both limiters set
`skipSuccessfulRequests`). Neither token expiry nor throttling explains it.

**Six affected files to date, all unrelated:** `roundTrip.idConcurrency`, `roundTrip.rbac`,
`roundTrip.deals` (a plain date assertion, with no timing or auth component of its own),
`roundTrip.bulkImportRaces`, `roundTrip.documents`, and — 2026-09-06, during the
role-change work — `roundTrip.deactivationRace`. That sixth one matched parts 1, 3 and 4 of
the signature directly: one failure in a full run, five clean full runs and five clean runs
of that file alone afterwards, and an orphaned `RT mutual-1-…` tenant left behind (since
deleted and re-counted). Part 2 could NOT be confirmed — the failing run's output was lost
before the test name was captured, so the bodyless 401 is inferred from the other three, not
observed. Recorded that way deliberately.

A mechanism consistent with all of it, and worth starting the eventual debugging pass from:
in that suite two requests race to deactivate each other and the test accepts `[200, 401,
409]`. A spurious 401 under pool pressure would pass the status assertion, skip its
deactivation, and leave TWO privileged members where the test asserts exactly one — a
failure that looks nothing like an auth problem in the output.

**It still deserves a dedicated debugging pass**, and the first thing to instrument is pool
acquisition (`pool.totalCount` / `idleCount` / `waitingCount`) during a full run, not any
individual test.

## CI

`.github/workflows/ci.yml` runs the backend round-trip suite against a real Postgres service
container and the frontend's tests, typecheck and `lint:hooks` on every PR and push to main.
The typecheck step compares `typecheck:count` against the number recorded in
`Frontend/TYPECHECK_BASELINE.md` rather than gating on zero.

### TRACKED FOLLOW-UP — CI pins Node 26 because `npm ci` is not version-portable here
The current lockfile was generated under npm 11 and `npm ci` fails outright under npm 10, so
moving CI to an LTS requires regenerating the lockfile under that npm FIRST. The full
reasoning, including the exact error and what was checked before pinning, is in the comment
on the frontend job's `setup-node` step — read it there rather than trusting a summary.

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

### NEVER rebase `remediation/phases-0-2` onto `main`. Merge.

This branch has deleted ~56,000 lines, and that makes rebasing it onto `main` a specific,
permanent hazard rather than a stylistic choice. It bit twice in one evening.

**Why a rebase is wrong here:** `git rebase main` replays 49 commits, and its *first* step
checks out main's tree — which writes every file this branch deleted back onto disk. Main
also already contains a later snapshot of some of this branch's work, so the replay conflicts
on commit 1 of 49 and cascades. **Merge instead** (`git merge main`), which produced exactly
one conflict; see commit `db785fb` for the reasoning.

**If a rebase is somehow already running, the recovery is not obvious — read this before
typing:**

1. **`git rebase --abort` is still the right command to stop it.** It resets HEAD back to the
   original branch. Do *not* reach for `--quit` here: git's docs are explicit that `--quit`
   leaves HEAD where the rebase left it, so on a half-replayed rebase it strands the branch
   at a partial state — a worse problem than the one you are escaping.
2. **`--abort` is not sufficient, and this is the trap.** It restores the branch ref and
   tracked files, but it does **not** remove files that are untracked on the branch it
   returns to. Every deleted file the rebase wrote to disk stays there, untracked. That is
   where two waves of resurrections came from — 79 files, then 50, including
   `pages/Auth/LoginWireframe.tsx`, a publicly reachable page asserting a security posture
   this product does not have. One `git add -A` re-commits all of it.
3. **So after any `--abort`, always do both:**
   - If `.git/rebase-merge` still exists, `git rebase --quit` to clear it. *That* is what
     `--quit` is for here — discarding stale state on a branch that is already correct. A
     leftover directory made `git status` report "currently editing a commit while
     rebasing... 48 remaining" for hours on a branch whose reflog was clean and linear.
   - Re-run the resurrection check: `git status --porcelain | grep '^??'` against a manifest
     of what this branch deleted. Check **after** the operation completes, against
     `git status`, not with `test -f` mid-operation — a check run during conflict resolution
     reported "zero resurrected" when the true answer was 79.

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
9. **A typed prop that is declared and never destructured looks wired and is not — the
   same trap as an unused destructure, one layer out.** This is a NEW variant of lesson 3,
   not a repeat of it: there, a provider fix could not reach a consumer that bypassed the
   provider; here, data cannot reach a consumer that *declares* the prop and never reads it.
   `DealDetailsPanel` declared `stageHistory?: Stage[]` and never destructured it, so the
   hardcoded five-row array the deal page passed in rendered nowhere at all. The Phase-1
   "stage history audit trail" therefore did not exist as a render — **and the fabrication
   is what concealed that**, because a prop with something being passed into it reads as
   supplied. Both halves have to be checked, and they fail independently: the page was
   passing invented data, and the panel was ignoring it. **When verifying a data fix,
   confirm the consuming component actually destructures the prop AND renders it** — grep
   the component body for the prop name, do not stop at the call site or the interface.
   Note TypeScript will NOT flag this: an unread prop in an interface is legal, unlike an
   unused destructure, which surfaces as `TS6133`/`TS6198`. The compiler catches lesson 3's
   shape and is silent on this one.
10. **Corollaries seen in practice:** a broken reachability grep once reported every file as
   unimported and nearly caused a live, routed component to be deleted — resolve each import
   to a real path before calling code dead. A tool reporting success (e.g. a window resize)
   is not evidence the effect happened — read the real DOM or DB output. And after a
   "successful" save, confirm the value actually changed in Postgres.
11. **`SELECT ... FOR UPDATE` on a JOIN can return a NULL for the joined side — and only
   under the contention it exists to handle.** When a locking SELECT blocks, Postgres
   re-runs the plan through EvalPlanQual after the blocker commits: it re-fetches the
   **locked** relation and reuses the tuple it already read from the other side. So
   `SELECT d.*, ps.slug AS stage FROM deals d LEFT JOIN pipeline_stages ps ON ps.id =
   d.stage_id ... FOR UPDATE OF d` sees the NEW `stage_id` against the OLD `ps` row, the
   join matches nothing, and the slug is NULL. `deal_stage_history` then recorded
   `from_stage = null` for a deal that plainly had a stage. **Lock the row alone, then
   resolve what you need in a second statement inside the same transaction.** Uncontended,
   both versions are identical, which is exactly why this survives ordinary testing.
12. **Test the test: a passing assertion under concurrency may never have raced at all.**
   The regression test for the above passed against the broken code twice, for two
   different wrong reasons. (a) A supertest `Test` is LAZY — assigning it to a variable and
   awaiting it after the COMMIT dispatches the request when there is no lock left to block
   on; force it with a trailing `.then(r => r)`. (b) `pg_stat_activity` is a statistics
   snapshot that Postgres caches **per transaction** (`stats_fetch_consistency` defaults to
   `cache`), so polling it from the connection holding the lock open returns the same
   pre-block snapshot forever and reports "not blocked" for as long as you care to loop.
   Poll from a different connection, and assert the block was actually observed before
   asserting anything about the result — an unproven race is a test that proves nothing.
13. **A green `lint:hooks` is only green if you ran it.** `npm run lint:hooks` gates
   `react-hooks/rules-of-hooks` on its own, precisely because a conditionally-called hook is
   a crash rather than a style nit. Two were shipped anyway (`DealSlideoutPanel`,
   `MobileDealPreview` — a `useStageLookup()` placed next to its first use, which sat below
   an `if (!x) return null`), and the gate flagged both the moment it was run. Neither
   `tsc` nor 521 unit tests said a word; the page threw "Rendered more hooks than during the
   previous render" on the first click. **Run it with the typecheck whenever a hook call is
   added or moved.**
14. **A migration that has been applied is not necessarily the migration in git.** Booting
   against `bmi_crm` reported 037's recorded checksum no longer matching the file: it had
   been applied from a working-copy draft and then edited before being committed. The
   runner refuses to proceed at that point — correctly, and it means no later migration can
   run until it is resolved. **Resolving it means proving equivalence, not overwriting the
   ledger:** build a scratch database from the committed migrations, diff the schema of
   every object the migration touches against live, and only then update the recorded
   checksum. Better: never apply a migration until the version you are applying is the
   version you have committed.
