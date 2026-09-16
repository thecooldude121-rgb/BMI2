# Project: BMI Platform — AI CRM

## What this is
A multi-tenant B2B SaaS CRM. **This repo is the CRM platform.** It is not "module 1 of 4" —
that framing is retired. **Lead Generation and HRMS are separate products, with their own
repos and their own deployments**, connected to this one over SSO. They are not future
phases of this codebase, and no amount of "later" makes them belong here. Do not build
Lead Generation or HRMS here.

**MEETING AGENT IS IN SCOPE — a NEW decision from Venkat on 2026-09-15, not a
clarification of an existing one.** This file said, until that date, that its status was
"undecided — mark it TBD; it is not in scope either way", and there was no documented
exception permitting it tighter CRM integration. There is now. Recorded with its date
because it was put to this session as something already settled, and it was not — the same
care the "confirmed against the running Lead Gen service" correction needed.

Venkat's words: *"a separate module which will have the tasks shown, meeting notes and
activities based on the note with a button to push to the deals or accounts."* So it is a
separate MODULE that integrates with CRM records, not a standalone sellable product like
Lead Gen and HRMS, and not a fourth thing forbidden here. Scope is deliberately narrow —
see "Meeting Agent" below. **No recording, no transcription, no AI summarisation.**

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
- **`MODULE_LINK_ENCRYPTION_KEY` must never be rotated once a module link exists.**
  It encrypts `module_links.api_key_encrypted` — the credential this CRM uses to call Lead
  Gen. Rotating it does not error: the link row still says connected, `secretBox` fails to
  decrypt, and every account-intelligence panel quietly reports "not linked" instead. There
  is no re-encrypt path, because the plaintext is not stored anywhere to re-encrypt from.
  Recovery is generating a fresh setup code in Settings > Connected Modules and re-running
  the handshake from Lead Gen. Treat it like a database password. It is also lazily read, so
  a deployment with no module link boots fine without it — and the first symptom of a
  MISSING key is a 500 on redeem saying so, which is how it was found.
- **Machine callers use a service credential, never a person's login.** `POST /contacts`
  and `GET /deals` accept `bmk_…` keys (migration 054, `middleware/serviceAuth.ts`) because
  Lead Gen calls both and has no session. The keys are scoped (`contacts:write`,
  `deals:read`), hashed at rest, and opt-in PER ROUTE — a route that does not name
  `serviceKeyOrProtect` cannot be reached with one, which is what keeps a leaked key small.
  Do not "simplify" this by teaching `protect` about keys: that would open ~60 routes at
  once. The predecessor was an admin's JWT minted for the integration, which expired in 7
  days and carried full admin rights; do not go back to that.
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
  nothing no matter how finished the UI looks. **Follow the imports — see lesson 15.** That
  clause about the API client and the data contexts is doing real work and has been skipped:
  three pages were called zero-fetch on `grep -c 'fetch(' <page>` alone when the fetch was
  one import away, in a hook or a service module. This has now happened twice at whole-feature
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
- **`companies` has no `health_score` column either, and the spec above says it does.**
  Found during the ReportsPage audit (2026-09-09), where an "Account Health Score" card
  reported "Healthy: 45 (71%) / At Risk: 12 / Critical: 6" from hardcoded literals. Two
  separate problems, and the second is why this is a backlog item rather than a quick fix:
  1. **The column does not exist**, so nothing on `companies` can be read as health. The
     spec's `health_score INT DEFAULT 50` was never deployed. (`deals` does have one —
     `health_score` is real there — which is probably how the spec acquired it for
     `companies` too.)
  2. **The numbers did not even sum.** 45 + 12 + 6 = 63 buckets against **15** accounts.
     Any figure that disagrees with the row count by 4x was never derived from anything,
     and two neighbouring cards had the same tell — Contact Engagement summed to 147
     against 20 contacts, Lead Response Time to 156 against 38 leads.
  **DO NOT add the column and backfill 50.** A default health score is a fabricated
  metric wearing a schema: every account would render "50 — healthy" having been measured
  by nothing, which is exactly the class of defect this project keeps removing. Deciding
  what health MEANS here (engagement recency? open pipeline? support signals? none of
  which are currently recorded) is the actual work, and it is a product decision, not a
  migration. The card now states the gap instead.
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

### Recorded live-data correction — D043's close date was in the year 262026
Found while looking for the quarter the deals actually close in, during the 042 live check.
One deal carried `expected_close_date = 262026-09-30` — a typo'd year, almost certainly a
mis-keyed `2026`. It is recorded here for the same reason the admin promotion below is:
a direct write to live data should be auditable rather than mysterious.

```sql
UPDATE deals
   SET expected_close_date = make_date(
         2026,
         EXTRACT(MONTH FROM expected_close_date)::int,
         EXTRACT(DAY   FROM expected_close_date)::int),
       updated_at = NOW()
 WHERE id = 'D043'
   AND tenant_id = '2f5b4330-6101-4aee-bd4f-8917a83cce6b'
   AND EXTRACT(YEAR FROM expected_close_date) = 262026;
```

Month and day are carried through from the existing value rather than retyped, so the
statement structurally cannot change anything but the year; the `EXTRACT(YEAR ...) = 262026`
predicate makes a second run a no-op. Verified by **re-querying the row** (`2026-09-30`,
month and day intact) rather than by trusting `UPDATE 1`, and by re-counting: zero deals now
hold a date outside 2000-2100.

**Two things this does NOT fix, deliberately:**
- **`D043` is named "Moving Walls - DOOH Platform - Jun 2026" and now closes 30 Sep.** The
  name and the date disagree, and which one is wrong is a question for whoever owns the
  deal — not something to guess at while correcting a year.
- **Nothing prevents the next one.** There is no CHECK constraint and no client-side bound
  on `expected_close_date`, so a four-keystroke slip in a date field still stores a year
  260,000 years out. A `CHECK` or a form-level range would be the real fix; this was a
  one-row correction, and widening it into a schema change is the bundling this project
  keeps separating on purpose.

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
scoring, next-best-action. Omit these rather than half-building them. Meeting Agent IS in
scope as of 2026-09-15 (notes/tasks/activities only — see above); Lead Generation and HRMS
are not "not in this phase" at all — they are other products, and nothing about them is
ever built here.

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
### DONE (migration 043) — the forecast tables, and how a rep is identified in them

**`forecast_quotas` IS DROPPED.** Confirmed immediately before dropping, not from memory:
0 rows in both databases, no inbound foreign keys, no dependent views, and no executable
code reference anywhere. It could never have been used correctly — it had **no `tenant_id`
at all**, so it was *unscopable* rather than merely unscoped, and it keyed on
`employee_id character varying`, a reference to the **HRMS-owned** `employees` table, which
is a boundary violation on top of a scoping one. Its `UNIQUE (employee_id, period,
pipeline_id)` therefore spanned tenants. `quotas` (042) supersedes it in every respect.
`000_baseline_schema.sql` still creates it and 043 drops it — the baseline is a ledger
entry, not a document to revise (lesson 14).

**`forecast_snapshots.rep_name` — THE DECISION, recorded so it is never mistaken for an
oversight.** Two options were live: migrate identity to `user_id` mirroring 042, or keep it
name-keyed as a deliberately denormalised point-in-time record. **Chosen: migrate to
`user_id`, AND KEEP `rep_name`.** Both halves are load-bearing and the blend is considered,
not a dodge:

- **`user_id` was added because `rep_name` was not a passive record — it was a LIVE
  IDENTITY-MATCHING KEY.** Two call sites proved it rather than one argument:
  `ForecastPage.tsx` matched a snapshot to a current rep with
  `repRows.find(r => r.name === snap.rep_name)` and de-duplicated snapshots with
  `latest.has(row.rep_name)`. So "preserve the name" would not have been preserving
  history; it would have kept the exact defect 042 removed, in a table that had simply
  never been exercised. A renamed rep silently stopped matching their own history — and the
  slippage column then compared their past commit against `nowCommit ?? 0`, reading as if
  they had dropped their entire forecast rather than as a failed match. Two people sharing a
  display name matched each other's rows. The feature the table exists for — "commit
  accuracy trending and rep historical accuracy", which the UI already advertises as
  unlocking at two snapshots — **is** cross-time rep matching.
- **`rep_name` was kept because a snapshot differs from a quota.** In 042 the name was pure
  defect: it identified a person badly and preserved nothing, so it went. Here it *also*
  records what the rep was **called on the day the snapshot was taken** — real historical
  information a reference cannot reconstruct, since resolving `user_id` later yields
  *today's* name. Identity by reference, display by capture.

Three consequences worth not regressing:

- **`ON DELETE SET NULL`, the OPPOSITE of `quotas.user_id`, which CASCADEs.** A quota
  without its person is meaningless; a snapshot is history and must outlive the person it
  describes. Cascading would let deleting one user silently rewrite past forecast calls.
- **`user_id` is NULLABLE, and NOT NULL would be wrong.** ForecastPage snapshots every rep
  row it shows, and 20 of the 24 live deals still carry only a name. A required column would
  make those unrecordable and drop ~$1.39M of pipeline out of every snapshot. `rep_name`
  stays `NOT NULL` and is the fallback identity for exactly those rows.
- **Uniqueness is a FUNCTIONAL index**, `(tenant_id, period_label, snapshot_date,
  COALESCE(user_id::text, rep_name))` — the same identity the frontend groups by, enforced
  in the database. A plain `UNIQUE` on `user_id` cannot work: NULLs are distinct, so every
  unattributed row would duplicate on each re-snapshot. `ON CONFLICT` must restate the
  expression for Postgres to infer it.

**A bug this produced, worth the warning:** the controller's validation map was first keyed
by `rep_name`, so two reps sharing one collapsed to a single entry and *both* rows were
written against the second rep's id. That is the same name-as-key defect being removed from
the table, reintroduced one layer up in the code removing it — caught by the test for the
very case it breaks, not by review. It is keyed by position now. `roundTrip.forecastSnapshots.test.ts`
(12 tests) pins all of the above; the re-keyed index was mutation-tested by restoring the
old constraint, which fails the shared-name test.

- **`deals.company_id` backfill — INVESTIGATED 2026-09-16, and the earlier estimate in
  this file was WRONG in a useful direction.** It said "9 have a free-text `company_name`,
  and matching on that name resolves exactly 1 more". Measured directly: there are **25**
  deals (not 24), **10** carry a `company_name`, and exact name matching against
  `companies` resolves **0** of the unlinked ones — the live names are variants
  ("TechCorp" vs the company row "TechCorp Inc"), which is the display-name fragility this
  project keeps running into.
  **The name was the wrong key to measure. `deals.lead_id` is the right one: 15 of 25
  deals carry one, every one resolves, and every one of those leads has both a company
  name AND an email.** The email's DOMAIN matched against `companies.domain` is a real key.
  Of the 22 unlinked deals:
  - **13 are confidently inferable** — the lead's email domain AND the lead's company name
    independently resolve to the SAME company, with **0 ambiguous matches** (no domain or
    name matches more than one company) and **0 disagreements**. INR 963,000 of value.
  - **2 need a human** (D006 ManufactPro, D010 AutomEdge): the name matches a company but
    the lead's domain does not — `manufact.com` vs the company's `manufactpro.com`, and
    `automatedge.com` vs `automedge.com`. Near-misses that are either a second legitimate
    domain or a typo, and guessing either way is a fabrication.
  - **7 CANNOT be inferred by any method, because the account does not exist.** D017
    TechStart, dlj22yl Zenith Corp, D026/D030 Acme Corp, D042/D043 Moving Walls, D053 Demo
    Company — none has a row in `companies` at all, under any name. INR 847,000. These need
    accounts CREATED (a data-entry decision, not a query), or the deals accepted as
    accountless.
  **THE CAVEAT THAT DECIDES HOW TO RUN IT: the method cannot be validated against known-good
  data.** The 3 deals that already carry a `company_id` have NO `lead_id`, so the inferable
  set and the ground-truth set are disjoint — there is no row where the inference can be
  checked against a human-confirmed answer. Two independent keys agreeing on all 13 with
  zero ambiguity is strong, but it is corroboration, not validation. A backfill should
  therefore be reviewed before it is committed (13 rows is a readable list), not run blind.
  **What this buys P3:** coverage goes from 3/25 (12%) to 16/25 (64%), or 18/25 (72%) if
  the two near-misses are confirmed. All 15 companies have an `industry`, so "Revenue by
  Industry" becomes computable — but at 64% it still needs the coverage stated on the card
  rather than presented as complete.
  Two smaller things found on the way: **`dlj22yl` is a deal id that does not match the
  `D###` format** every other deal uses (Zenith Corp — Enterprise Suite, INR 72,000,
  created 2026-05-25), and **"Demo Company" (D053)** looks like test data left in live.
  Both worth a decision before a cleanup pass.

- **Superseded note on the old estimate:**
  Only **3 of 25** deals carry a `company_id`; 10 have a free-text `company_name`. So "Revenue by Industry" and the
  "SaaS Pipeline Report" cannot be built: `industry` lives on `companies` (all 15 have
  one), and the join key to reach it is missing on 87% of deals. A breakdown built anyway
  would describe three deals and omit twenty-one **while looking complete** — worse than a
  truncation warning, which at least admits itself. Matching on `company_name` was
  rejected for the reason migrations 039-043 exist: a display name is not a key.
  Both cards sit in ReportsPage's `UNBACKED_REPORTS` stating the coverage number. The fix
  is a data task (link existing deals to accounts), not a build, and it unblocks both at
  once. Same treatment as the document-telemetry and BANT items: real, structural, not
  urgent.

- **Agent Capability 2 foundation — user targets, one industry vocabulary, pipeline
  projection. BUILT (migrations 044, 045). The dashboard "Sales Intelligence Guide" panel
  that consumes it is BUILT TOO (2026-09-14) — see "The Sales Intelligence Guide panel"
  below.** The decisions below were
  agreed in the session that built it; they are recorded so they are neither re-litigated
  nor guessed at:
  - **Targets extend `quotas`, they do not duplicate it.** Per-period fields
    (`quota_amount`, `currency`, `activity_targets`) live on `quotas`; per-person fields
    (`seniority`, `ramp_start_date`, `territory`, `product_line`) in `user_sales_profiles`,
    tenant-consistent by a COMPOSITE FK to `users(id, tenant_id)`. There is no
    `user_targets` table. The reporting line is `users.manager_id` (041). `territories` and
    `products` were NOT used — neither has a `tenant_id`, the `employees` defect again.
  - **Who sets whose targets — CONFIRMED POLICY, ratified 2026-09-14.** Admin: anyone.
    Manager: anyone in their reporting SUBTREE, at any depth — not direct reports only.
    Anyone: themselves, only when `tenants.settings.reps_set_own_targets` is on (off by
    default). One function, `utils/targets.canSetTargetsFor`, served as
    `editable_user_ids` / `can_edit`. `PUT /quotas` was open to every role before 044.
    `canActOn` still bounds it, so a manager cannot set an admin's targets even inside
    their own subtree.

    > The subtree rule REPLACED a direct-reports-only rule that shipped in 044. That
    > earlier rule was a default chosen while building, not a decision anyone had made,
    > and it was reported as though it had been — which is the mistake worth remembering
    > here, not the rule. If a permission in this file has no ratification date on it,
    > treat it as somebody's default and ask.

  - **Who SEES whose targets — CONFIRMED POLICY, ratified 2026-09-14.** `GET /quotas`,
    `GET /targets` and `GET /targets/projection` return a person's row to that person, to
    everyone ABOVE them in the reporting chain (to the top, not one level), and to admins.
    They were open to every authenticated caller in the workspace until then.
    - **`canReadTargetsOf`, and it is NOT `canSetTargetsFor` with the arrow reversed.**
      Two deliberate asymmetries: no `canActOn` on the read (chain membership is the rule
      as decided, and someone is only above you because an admin put them there), and the
      self case is not gated on `reps_set_own_targets` (that toggle governs writing your
      own target, and a target you cannot see is one you cannot work to).
    - **A row you may not see is ABSENT, never redacted and never a 403** — the same
      reason the FK rejection names only the field. Everything editable is readable, and
      a test asserts that containment rather than assuming it.
    - **`GET /quotas` also serves `visible_user_ids`.** Its rows are merged CLIENT-SIDE
      against a rep list built from deals, so an absent row is ambiguous — "no quota set"
      and "not yours to see" are the same absence, and ForecastPage printed "Not set" over
      both. `GET /targets` needs no such field: its rows ARE the visible people.
    - **This is the ONE place in the CRM where row-level visibility is settled.** Deals,
      contacts and `GET /users` are still workspace-wide; the general question
      `middleware/auth.ts` records stays open. Targets are compensation, which is why they
      went first and why they do not wait for it.
  - **Both rules are one relation, `reportingLine.chainAbove`** — `A` may act on `B`
    exactly when `chainAbove(edges, B)` contains `A`, and `B` is visible to `A` on the
    same test. The walk is cycle-safe and depth-capped (nothing in Postgres stops
    `A -> B -> A`; only `wouldCreateCycle` does, and only on the write path), and the
    reporting graph is loaded WITHOUT an `is_active` filter on purpose: a deactivated
    middle manager must not sever the subtree beneath them.
  - **FALLOUT ON THE FORECAST PAGE, fixed with the rule.** `teamProjected` comes from
    deals (unfiltered); `totalQuota` now comes from quotas (filtered). For anyone but an
    admin those are different populations, so the gap banner and the footer attainment
    were dividing one by the other and producing a percentage of nothing. Both are now
    shown only when the populations agree, with a note naming how many quotas the viewer
    cannot see in their place. A real per-scope forecast — comparing a subtree's pipeline
    against a subtree's quota — is the follow-up, and is deliberately NOT guessed at
    here.
  - **Projection bars** (`PROJECTION_RULES`): a win rate needs 10 closures with a RECORDED
    close time in the trailing 365 days, at least one of them won; cycle length and deal
    size need 5 won deals. The rep's own history first, else the workspace's (labelled),
    else NULL plus a reason — never a default. A close time comes ONLY from
    `deal_stage_history`; `createDeal` writes none, so a deal created directly in a won
    stage is untimed — both live closed deals (D005, D006) are. Only deals in the quota's
    currency count; the rest are reported by currency, never converted.
  - **Industry**: `companies.industry` is constrained to 21 values (045) and served at
    `GET /companies/industries`; the workspace's OWN industry is
    `tenants.settings.business_industry`, same list.
  - **Deferred, deliberately:** `ramp_start_date` is stored but NOT applied to the
    projection (how a ramping rep's quota is prorated is undecided policy); no stored
    "pipeline quota" (required pipeline is computed, and a typed one would be a second
    answer); `leads.industry` (a different vocabulary in live use — Enterprise, Cloud,
    Pharma…) and `deals.account_industry` (free text, NULL on all 25 deals) are not
    constrained; `CompanyForm` / `CompaniesPage` are unrouted dead code carrying a stale
    industry list; whether `createDeal` should write a history row when a deal is created
    straight into a closed stage (which would make those closures datable) is its own
    decision. (The projection's read visibility is no longer deferred — it follows
    `GET /quotas`, and `GET /quotas` is now scoped to the reporting chain: see the
    confirmed read policy above.)

- **The Sales Intelligence Guide panel — BUILT 2026-09-14, and what it replaced.**
  `components/Dashboard/SalesIntelligenceGuide.tsx`, rendered by `CRMDashboard` (the
  `/crm/dashboard` the sidebar actually links to). Three role views off ONE request to
  `GET /targets/projection`, whose response is already scoped by `canReadTargetsOf` — the
  panel deliberately issues no roster query of its own, and a test asserts it makes exactly
  one call, because a second path is a second place for the read scoping to be forgotten.
  - **It replaced the "AI Insights" preview**: two fixed sentences ("3 deals need
    attention", "close rate up 12% this month") behind a PREVIEW · SAMPLE CONTENT label.
    The replacement is NOT named or presented as AI — it is arithmetic over the workspace's
    own deals and quotas, and Phase-2 AI remains out of scope.
  - **The rules live in `utils/salesGuidance.ts`, pure and separately tested**, because
    every one of them is a claim about a person's performance. `Problem` has no shape
    without its `evidence` string, so no code path can render a verdict without the numbers
    that produced it.
  - **A conversion verdict compares a rep against the workspace ONLY when
    `win_rate.basis === 'rep'`.** When the projection fell back to the workspace figure the
    two numbers are the same number. `win_rate_workspace` was added to the payload for this
    — always the workspace's, even when `win_rate` already is — so the comparison has a
    visible basis instead of being asserted.
  - **`not_enough_data` and `no_quota` are grey, never amber or red, and produce no
    problems at all.** "We cannot tell" is not "you are behind", and colouring an absence of
    data as a warning is an accusation the data does not support. The roll-up also COUNTS
    those people rather than filtering them out, so it cannot describe three people while
    claiming to describe five.
  - A failed load renders an error, never an empty roster — an empty roster reads as
    "nobody is off pace", which is the worst possible failure mode for this panel.

- **TRACKED GAP — activity targets CANNOT BE MEASURED, and the reason is structural.**
  `quotas.activity_targets` stores real per-week calls/meetings/emails targets (044) and
  Settings writes them. Nothing can measure attainment, because **the deployed `activities`
  table has no user reference at all**: its actor columns are `created_by` and
  `assigned_to`, both `character varying` holding free-text names. (The spec earlier in
  this file shows `user_id UUID REFERENCES users(id)` and `occurred_at`; neither was
  deployed — the same class of drift as `close_date` / `expected_close_date`.)
  Attributing an activity to a rep would therefore mean matching on a DISPLAY NAME, which
  is the defect migrations 039-043 exist to remove and which was rejected for
  `deals.company_name` for the same reason. So the API reports
  `activity_measurement: { measurable: false, reason, activities_recorded }` and the panel
  shows the targets with "Attainment is not calculated" — never a shortfall, and never
  silence, since silence over an unmeasured target reads as "you are meeting it".
  `activities_recorded` is real and is what separates "nothing is logged in this workspace
  at all" (it is 0 live) from "this person did nothing" — a distinction a guidance panel
  must not get wrong in the accusatory direction.
  **The fix is a migration giving `activities` an `assigned_to_user_id` FK the way 039 gave
  one to `deals`, plus a writer on the create path.** Deliberately not done with the panel:
  it is a schema decision, and with 0 rows recorded there would still be nothing to measure.

- **ANSWERED — the buying-committee data structure EXISTS and is real. Do not rebuild it.**
  `contacts.buying_role` is a `varchar` with a CHECK constraint (migration 026) over eight
  values: `champion`, `decision-maker`, `economic-buyer`, `influencer`,
  `technical-evaluator`, `user`, `legal-procurement`, `blocker-detractor`. It is validated
  in `contactsController` (`BUYING_ROLES`), typed in `types/contact.ts`, labelled in
  `config/contactRoles.ts`, and consumed by `components/Deal/BuyingCommitteeMap.tsx`
  through the deal page's stakeholders — which correctly EXCLUDES a stakeholder with no
  stored role rather than defaulting them onto a seat. All 20 live contacts have NULL.
  - **One fabrication remains in that component and is NOT fixed here** (it was out of the
    guide panel's scope): `BuyingCommitteeMap.tsx` renders a fixed line reading
    *"AI Insight: Decision Maker and Economic Buyer not yet aligned — deals with both
    engaged close 2.4× faster"*. The 2.4× is a literal; nothing computes it, and no endpoint
    could. It is an evaluative statistic with no basis and should be deleted the way
    `DocumentDetailPage`'s "12 views" was.

- **There is no "AI Insights Panel" on the routed Reports page.** `pages/CRM/ReportsPage.tsx`
  has never had one (`git log -S` finds nothing). The only Reports-shaped AI Insights tab is
  in `pages/Settings/AnalyticsReporting.tsx`, which is inside the DEAD Supabase Settings
  tree that `/settings` no longer reaches. Anything specified against "Reports' AI Insights
  Panel" has no existing surface to fill.

- **Meeting Agent — BUILT, FRONT TO BACK, 2026-09-15/16. Migration 049.**
  The UI is `MeetingsPage` (list + create), `MeetingDetailPage` (note, push, tasks,
  activities) and three modals: `NewMeetingModal`, `PushToRecordModal`,
  `LogActivityModal`. `MeetingsUI.test.tsx` pins it (12 tests).
  - **THE ANTI-INFERENCE RULE IS KEPT ON THE CLIENT TOO, and that is where the temptation
    actually lives.** The "log an activity" subject field starts EMPTY even when the note is
    full of `ACTION:` / `TODO:` / `Next steps:` phrasing, and no suggestion list, highlight
    or "items detected" affordance is rendered anywhere. A pre-filled field is accepted far
    more often than it is read, so pre-filling from the note IS the Phase-2 extraction
    feature, arriving through the side door. Mutation-tested: pre-filling the subject by
    splitting the note on `ACTION:` fails two tests.
  - **~4,800 lines of fabrication deleted with it.** `sampleMeetingsData` (47 meetings, 35
    "recorded", 42 "AI processed", an AI-insights strip naming Acme/TechStart/BigCo),
    `meetingTranscriptMockData`, and five modals that could not be rewired because their
    contents were fiction — `ScheduleMeetingModal` offered a hardcoded contact and deal
    list and collected `recordMeeting` / `enableAI` settings for capabilities this module
    does not have.
  - **No "recorded", "live now" or "AI processed" tiles replaced them.** A tile that always
    reads 0 still implies the thing is being measured. The two counts shown — total, and
    how many are not yet linked — are derived from the rows actually fetched.
  - **`MeetingTranscriptViewer` is an honest stub, not a deletion.** Transcription is out
    of scope; the route is kept so a bookmark lands on that explanation rather than on a
    convincing transcript of a conversation nobody had.
  - Original backend notes follow.

- **Meeting Agent backend — 2026-09-15. Migration 049.** `meetingsController` +
  `routes/meetings.ts`: list, detail, create, patch, `PUT /:id/relation` (the push-to-deal
  action) and `POST /:id/activities`. `utils/meetingsApi.ts` is the client.
  `roundTrip.meetings.test.ts` pins it (21 tests).
  - **THE POLYMORPHIC REFERENCE IS FIXED HERE, THIRD TIME LUCKY.** 049 adds a CHECK
    restricting `meetings.related_to_type` to deal/company/contact/lead, plus a pair CHECK
    (both columns or neither), and the controller proves the id belongs to the caller's
    workspace with `foreignIdsInTenant` — the same arrangement `tasksController` uses. Both
    halves are needed and both are tested: a CHECK cannot scope a polymorphic id, and a
    controller can be bypassed. **`documents.module` / `record_id` is still unfixed and is
    now the only remaining instance.**
  - **'employee' is deliberately absent from the type list, unlike `tasks`.** `employees`
    has no `tenant_id` and belongs to HRMS; a new module must not inherit that hole.
  - **`meetings.id` had NO DEFAULT** — varchar(10) NOT NULL with nothing generating it, so
    a meeting could never be created at all. Nothing had ever exercised it because the only
    reader was a fabricated fixture. 049 gives it a sequence, the way 031 did for the other
    four tables.
  - **`meetings_type_check` already existed with its own vocabulary** —
    `sales-call | internal | client-meeting`. The controller's first draft invented
    `call/video/in-person/internal/other` and every create returned a masked 500. Read the
    constraint; do not reason about what it should be. An omitted type stays NULL rather
    than being defaulted, because picking one classifies the meeting on the caller's behalf.
  - **ACTIVITIES, NOT `action_items` — the call and the reason.** "Activities based on the
    note" creates rows in `activities`, because that is the table the deal and account feeds
    read; `action_items` is a column nothing else queries, so it would produce a list
    visible only on the page that wrote it. `action_items` is left in place as the note's own
    checklist. **Nothing is inferred from note text** — no parser, no keywords, no model. A
    test feeds a note full of "ACTION:" and "TODO:" and asserts ZERO activities are created.
  - Still open: `activities` has no `meeting_id`, so provenance is carried in the activity's
    description text (`From meeting MTG001: …`). Deliberate — the reference is one-way and
    for reading, not a key anything joins on.

- **Gamification — DELETED 2026-09-15 (Venkat's call, BANT-framework precedent). ONE PIECE
  REMAINS.** Gone: `GamificationPage`, `GamificationLeaderboard`, both routes, the sidebar's
  "Leaderboard" entry, the `gamification` role permission, and the dashboard's dead
  "View All" button. It was ~2,400 lines of fabricated points, levels and streaks plus a
  leaderboard of invented colleagues ("John Smith", "Sarah Johnson", "Mike Chen"), blocked
  on a scoring model that does not exist and an event source never built; the three
  `gamification_*` tables hold 0 rows and nothing reads them.
  - **NOW COMPLETE (2026-09-16).** The dashboard's "Performance & Rewards" panel and
    `components/gamification/` (6 files) are gone too; `CRMDashboard` went 1,157 -> 625
    lines. Nothing but explanatory comments mentions gamification anywhere.
  - **AND A CORRECTION WORTH KEEPING.** The previous note here said that panel's JSX was
    "interleaved with the surrounding layout" and could not be excised. **That was wrong.**
    The element was always a self-contained subtree (lines 577-852). The false conclusion
    came from a bug in the throwaway script used to check it: JSX comments were blanked with
    a regex that collapsed their newlines, which shifted every line number after the first
    multi-line comment and made the depth count nonsense. Located with the TypeScript
    compiler the second time instead of a regex. **The lesson is not about JSX — it is that
    a conclusion from a one-off script deserves the same scepticism as a conclusion from a
    test, and "I could not do it" is a claim that needs checking like any other.**

- **Facade pages — fabrication removed or labelled, 2026-09-15.** From the six-page audit:
  - **AI Copilot: the canned transcripts are DELETED, not labelled** (~855 lines). They did
    not merely invent numbers, they asserted specific CRM facts about named people
    ("Last contact: 5 days ago", "Email open rate: Opened 2x but no response") in the voice
    of an assistant reading the database, then recommended actions from them. A badge is not
    enough for that class: the label does not travel with the sentence once somebody pastes
    it into a deal note. The page now answers every question the same way — that it is not
    built. Same treatment for **`AIResponseDetailView`** (~1,100 lines: "87% probability of
    closing", "Competitor activity detected (LinkedIn mentions of Salesforce eval)").
  - **`CustomReportBuilder`: the false success toast is gone.** "Report created
    successfully" fired after a `setTimeout` and a fake progress bar, with no `reports`
    table and no endpoint behind it — a success toast over a database that did not change,
    in the place a user trusts it most. It now says the report was not saved, and does not
    navigate away (being bounced to a list that does not contain your report reads as a save
    that worked). The delete handler's "Report deleted" is gone for the same reason.
  - **`ReportDetailView`: labelled, exports made honest** (they were `console.log`), and
    **the HRMS branch of its fake data removed** — it returned "HRMS Generated Leads: 412"
    and rows like "HRMS: Global Tech", encoding a cross-module read that would be a design
    error if it were ever made real, and sample data is exactly how that gets made real.
  - **`IntegrationsPage`: labelled.** It was already honest about having no data
    (`integrations` starts `[]` and nothing populates it) and renders NO fabricated
    credentials — but "Connect" opens a placeholder, so the label says so.
  - `components/common/PreviewBanner.tsx` is the convention in one place now, with a
    REQUIRED `detail` prop: a bare badge tells a reader something is wrong without saying
    what.
  - **Still facades, deliberately: CustomReportBuilder and ReportDetailView's real builds
    (P3) and AI Copilot's (P4).** The report pair needs a `saved_reports` table and a query
    builder that renders tenant-scoped SQL — the security-sensitive part, and partly blocked
    on the `deals.company_id` backfill. AI Copilot needs Phase 2 to open.

- **DONE (migration 051) — `deals.company_id` backfilled for 13 deals, and what the
  investigation found underneath it.**
  Coverage 3/25 -> **16/25 (64%)**. The 13 mappings are LITERAL pairs in the migration, not
  a join, so the decision is auditable; dry-run against `bmi_crm` in a rolled-back
  transaction, then applied through the runner and **verified by re-querying the rows**.
  D006/D010 (domain near-misses) and the 7 accountless deals were left untouched.
  - **The inference key was `deals.lead_id`, not `company_name`.** Exact name matching
    resolves 0 — live names are variants ("TechCorp" vs the row "TechCorp Inc"). Through the
    lead, the email DOMAIN and the company NAME resolve to the same company for 13 deals,
    with zero ambiguity and zero disagreements.
  - **The method could not be validated against known-good data** — the 3 deals that
    already had a `company_id` have no `lead_id`, so ground truth and inferable set are
    disjoint. Corroboration, not validation. Applied on explicit approval.

- **THE LIVE WORKSPACE'S CORE DATA IS A SYNTHETIC SEED LOAD. Established 2026-09-16, and it
  changes how every figure in this CRM should be read.**
  - **Two populations, separated by timestamp and unmistakable.** 15 companies created at
    **exactly 00:00:00.000** on a 14-day cadence (2025-06-01 -> 2026-01-01); 15 leads and 15
    deals (D001-D015) likewise at exact midnight on a 5-day cadence (2026-01-10 ->
    2026-04-05); 20 contacts across 20 distinct days. Nobody creates 15 deals at midnight on
    a tidy cadence. **The 13 deals just backfilled are all from this seeded set** — so
    "Revenue by Industry" will mostly describe invented accounts, and should say so.
  - **The second population is hand-created: 10 deals and 23 leads, 2026-05-25 to
    2026-06-03, with realistic sub-second timestamps.** These are the ones that could NOT be
    linked to an account — because **no company or contact was created in that window at
    all** (0 companies, 0 contacts). Somebody typed deals with free-text company names and
    never created the accounts. That is the whole explanation for the 7 "unresolvable"
    deals; it is not a second seed load.
  - **NO SEEDER EXISTS IN THIS REPO.** No migration inserts demo rows, `seedUsers.ts` only
    rotates passwords, and git history contains no deleted seeder. Whatever wrote the
    synthetic core came from outside this repository — so this is NOT the migration
    auto-apply hazard repeating, and there is no script here to remove. It also means the
    load cannot be re-run or reversed from anything in the tree.
  - **THE FIXTURE NAMES ARE NOT A COINCIDENCE.** The 23 leads of 2026-05-25 include
    `john.smith2@acmecorp.com` (Acme Corporation), `sarah.lee2@techstart.com` (TechStart
    Inc), `mike.chen@bigco.com` (BigCo Enterprise) and `rachel.green@startco.com` (StartCo
    Solutions) — four of the five hardcoded contacts from the deleted
    `ScheduleMeetingModal` fixture (John Smith/Acme Corp, Sarah Lee/TechStart, Mike
    Chen/BigCo, Emma Wilson/DataFlow, Lisa Wong/StartCo), with `2` suffixes on the emails to
    dodge the `UNIQUE(tenant_id, email)` constraint against the first load. The facade
    fixtures and the live rows share a source.
  - **`D053` "Demo Company" (USD 300,000) is already flagged `is_test = true`** and
    `getDeals` excludes test rows unless `include_test=true`, as does the projection loader.
    So it is contained: it corrupts no figure today. It is clutter, not a live defect.
  - **`dlj22yl` predates the id sequences.** Migration 031 wired `deals.id` to a sequence on
    2026-09-03; that deal was created 2026-05-25, when ids still came from app code or the
    client. Its base36-looking id is a client-minted one from before the backend owned
    generation — a historical artefact, not an active bug. The sequence is at 54 and the
    highest `D###` is 53, so it is consistent.
  - **Nothing depends on these rows**: of the 7, only D043 has a single related document;
    no activities, tasks, stage history or quotes on any of them.

- **DONE (migrations 052, 053) — the live workspace's data is now labelled by provenance.**
  - **`is_seed` is a NEW column, deliberately NOT `is_test`, and the distinction matters.**
    `is_test` already means "hide this row" and is enforced as such (`getDeals` appends
    `AND d.is_test = false` unless `include_test=true`; `loadProjectionDeals` excludes it
    unconditionally). The synthetic rows are 15 of 25 deals, ALL 15 companies, all 38 leads
    and 20 of 21 contacts — most of what the app has to show. Flagging them `is_test` would
    empty the deals list, the dashboard and the pipeline board. So:
      `is_test` = "this row is debris; do not show it"
      `is_seed` = "this row is demo data; SHOW it, but say so when you summarise it"
    **052 changes no query and excludes nothing.** The column exists so a report can
    DISCLOSE its input.
  - **FOR P3's "Revenue by Industry" CARD, THIS IS THE REQUIREMENT:** the card must state how
    much of its input is seeded, not merely its coverage. Of the 16 deals now carrying a
    `company_id`, **13 are seeded** — so a coverage figure alone ("64% of deals linked")
    would be true and still misleading. Blanket-excluding the seeded rows is NOT the answer
    either: that leaves the card describing three deals, which is the exact failure
    `UNBACKED_REPORTS` already documents.
  - **053 labelled D017, D026 and D030 `is_test`** (TechStart Inc AED 50,000; Acme Corp USD
    75,000; Acme Corp USD 60,000). Fixture names — "Acme" appears in 44 source files,
    "TechStart" in 16, both from the deleted ScheduleMeetingModal lists. Labelled rather than
    deleted: one boolean, reversible, and it gets them out of every production view via the
    exclusion that already exists.
  - **053 DELETED D053 "Demo Company" (USD 300,000)**, which was already `is_test = true` and
    therefore already invisible everywhere. Backed up first as a restorable INSERT at
    `Backend/migrations/_backups/D053_demo_company_row.sql` — a deletion with a backup beside
    it is recoverable. The migration re-checks dependents at apply time and RAISEs rather
    than deleting if any exist, so applying it elsewhere later cannot silently orphan
    something.
  - Live now: 24 deals, **21 visible**, 15 seeded.

- **STILL PENDING A DECISION — D042, D043 and dlj22yl are NOT deleted.** The dependency check
  is done and is in the report; the one dependent is a document on D043 named
  **`test-upload-deal`** (1,381 bytes, application/pdf, uploaded by David Kumar 2026-09-11)
  — a test upload, not a business document. **Delete it through the documents API, not SQL:**
  `deleteDocuments` also removes the stored blob via `deleteFile(storage_key)`, so a raw SQL
  delete would orphan the file in the store.

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
- **CLOSED (migration 050) — `documents.module` / `record_id` is constrained, and that was
  the LAST unconstrained polymorphic reference in the schema.** All three are now handled:
  `tasks` (controller-only, deliberately — see its `RELATED_TABLE` note on `employee`),
  `meetings` (049, both layers), `documents` (050, both layers).
  - **Half of it was already done and the backlog note was stale — checked before writing
    anything.** `documentsController` already had `VALID_MODULES`, a COMPLETE `MODULE_TABLE`
    (`account` -> companies, `activity` -> activities), a `foreignIdsInTenant` check on
    create/update/upload, and both-or-neither validation, all covered by
    `roundTrip.documents.test.ts`.
  - **What 050 adds is the DATABASE half**, which did not exist: a CHECK on `module` and a
    pair CHECK forbidding a half-set reference. A controller guard binds ONE writer; the CSV
    importer, a future endpoint, a backfill or a hand-typed UPDATE all bypass it.
  - The record_id's WORKSPACE still cannot be enforced in Postgres and is not: the target
    table varies per row, and every FK here references a global primary key anyway. That
    half stays in the controller. Both halves, neither substituting for the other.
  - Safe on live data, verified rather than assumed: 3 documents, modules `contact` and
    `deal`, no half-set pairs, all three record_ids resolving inside their own tenant. The
    migration was also dry-run against `bmi_crm` inside a rolled-back transaction.
  - A test walks the controller's `VALID_MODULES` and asserts Postgres accepts each one, so
    the two lists drifting apart fails a test rather than a user's upload — the `hr` lesson.

- **The related-entity panels on `DocumentDetailPage` are still empty, and that is
  separate.** The detail page's related deal, account and contacts came from a
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

**Observed 2026-09-13 and deliberately NOT counted as data points**, because part 3 was not
met — nothing was orphaned. Four single-test 30-second timeouts, each in a different,
unrelated test (`roundTrip.targets` "GET /quotas serves editable_user_ids", `roundTrip.rbac`
"deleting a lead note", `roundTrip.profile` "negative: … short new_password",
`roundTrip.tokenVersion` "attribution still works without the per-controller users
query" — that file then passed 13/13 three times alone), plus one
non-timeout failure (`roundTrip.userManagement` "lists the workspace members", 253 ms) whose
assertion text was not captured. None reproduced on rerun. The first two coincided with a
second vitest process started from a parallel shell call (lesson 17); the third and fourth
happened in full runs with nothing else running. One thing for the debugging pass to weigh: part 3
presumes the failure kills `afterAll`. A single test that times out still lets `afterAll`
run, so a timeout-shaped instance of this flake would never orphan a tenant — the signature
as written may be excluding exactly these.

**Observed 2026-09-14, and it CAPTURED THE 401 BODY FOR THE FIRST TIME — which points
somewhere other than the pool.** During the targets-visibility work: five full runs, two of
which failed with exactly one test each (`roundTrip.contacts` "edit: buying_role actually
persists" on one of them; the other run's test name was not captured), three clean. The
file passed 18/18 alone immediately afterwards, and **zero `rt-` tenants were orphaned**, so
part 3 was not met — the same as the 2026-09-13 batch.

The body was this, on a `PUT /api/v1/contacts/:id` that expected 200:

```json
{"type":"error","error":{"type":"authentication_error","message":"Invalid authentication"},"request_id":null}
```

**That is an Anthropic API error envelope. This codebase cannot produce it** — no controller,
no middleware and no error handler emits `request_id`, and `protect`'s 401 is
`{ success: false, message: ... }`. So the response did not come from the Express app under
test, which reframes the working theory: not "the pool returned an error that surfaced as a
401", but **the request left the app and was answered by something else**. supertest binds an
ephemeral port on 127.0.0.1, so a request escaping to an outside endpoint means an
interception layer — an HTTP proxy, a patched global `fetch`/agent, or an undici hook — is in
play for at least some requests under load. `HTTP_PROXY`/`HTTPS_PROXY` were NOT set in the
shell that ran it, so if this is a proxy it is being installed by something else in the
process.

**THIRD CAPTURE, 2026-09-16.** Identical body again, character for character, this time
failing `roundTrip.projection` ("test-flagged deals never count toward the history") on a
`POST /deals/:id/stage-transition` expecting 200. The file then passed 8/8 alone, the next
full run passed 589/589, and zero `rt-` tenants were orphaned. Three captures now, three
unrelated test files (`roundTrip.contacts`, `roundTrip.leads`, `roundTrip.projection`), one
byte-identical body — and two of the three were in a DIFFERENT WORKTREE with its own
`node_modules`. The affected test is arbitrary; the response is not.

**BOUNDED INVESTIGATION, 2026-09-16 — CONCLUSION: THIS IS NOT A CODEBASE BUG.** Time-boxed
on instruction, and it resolved further than expected. Three facts, each checked directly:

1. **Every 401 this codebase can emit has the shape `{ success: false, message }`.** All
   eight sites (`middleware/auth.ts` x6, `authController.ts` x2) were enumerated. None emits
   `type`, `error` or `request_id`.
2. **No backend dependency contains the string `authentication_error`** — grepped across the
   whole of `Backend/node_modules`. There is no `@anthropic-ai` package in the backend at
   all.
3. **Nothing patches HTTP in the test path.** No `globalThis.fetch` assignment, no
   `setGlobalDispatcher`, no `ProxyAgent`, no interceptor in `setup.ts`, `vitest.config.ts`
   or `app.ts`; and `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NODE_OPTIONS` and
   `NODE_EXTRA_CA_CERTS` are all unset in the test process.

So the response is **not producible by the process under test or by anything it loads**. It
arrives from outside Node, between supertest's loopback request and the app — i.e. the
ENVIRONMENT the suite runs in, not this repository. That also explains every part of the
signature that made it look mysterious: why the affected test is arbitrary, why it is
byte-identical each time, why it self-resolves on retry, and why it followed the suite into
a different worktree with a fresh `node_modules`.

**A FOURTH HIT THE SAME DAY CONFIRMED THE `{}` VARIANT IS THE SAME THING.**
`roundTrip.userRoles` failed with `real login failed — {}` — the bodyless 401 of the
ORIGINAL signature, not the Anthropic-shaped one. Passed 17/17 alone, 593/593 on the next
full run, nothing orphaned. So the two shapes this file has tracked separately are one
phenomenon seen through two clients: supertest's `login.status !== 200` path stringifies an
empty body, while an assertion that dumps `res.body` shows the envelope. That resolves the
"part 2 could not be confirmed" caveat recorded on 2026-09-06.

**Practical guidance: retry, do not debug.** A single unexplained 401 in a full run whose
file then passes alone is this, and re-running is the correct response. Do not add retries
or timeouts to the suite to paper over it — that would mask a real auth regression later.
Stop here unless it starts failing on re-run too, which would be a different bug.

Two consequences for the eventual debugging pass:
- **Instrumenting the pg pool may be looking in the wrong place.** Do it, but capture the
  RESPONSE BODY of every unexpected 401 first — it is cheap, and one body has already moved
  the theory further than six data points of shape did.
- The historical "401 whose body is `{}`" may be the same thing seen through a client that
  dropped the body, rather than a distinct signature.

**It still deserves a dedicated debugging pass**, and the first thing to instrument is pool
acquisition (`pool.totalCount` / `idleCount` / `waitingCount`) during a full run, not any
individual test — alongside the body capture above.

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
15. **`grep -c 'fetch(' <page>` DOES NOT ANSWER "is this page wired". Follow every
   service and hook module the page imports, and look for the fetch THERE.** The
   no-fabricated-data rule above says a component tree with zero data-fetching calls is
   suspected fabricated code — and the cheap way to check that is exactly the check that
   fails, because in this codebase the fetch usually is not in the page.

   **This is a documented rule rather than a one-off note because it produced three wrong
   conclusions in a single session, twice at whole-page scale:**
   - **`ReportsPage.tsx`** was reported as a zero-fetch fabricated tree in a scoping
     report and in a PR description. It imports `useDashboardData()` and derives its four
     headline stats — Revenue Won, Deals Won, Open Pipeline, Win Rate — from live deals.
     One card even reports "quota not tracked" honestly. It is a HYBRID: real headline
     numbers above 107 hardcoded metric rows, which makes it more dangerous than a fake
     page, not less — the correct figures vouch for the invented ones.
   - **`DocumentsLibrary.tsx`** was reported the same way. `documentsService.ts` already
     calls the real Node API and `loadDocuments()` already populates the list. The actual
     fabrication was the SIDEBAR COUNTS and the recent-documents strip, so the page showed
     a correctly-empty list beside a sidebar advertising 247 documents.
   - **`contexts/IntegrationsContext.tsx`** was listed as a live fabricated provider when
     it had already been remediated: every field initialises empty and `generateApiKey`
     THROWS rather than minting a fake key.

   In each case `grep -c 'fetch(' <file>` returned 0 and the claim was made on that alone.
   Two of the three reached a PR description before being corrected.

   **What to run instead**, before saying a page is unwired:
   ```
   grep -nE "^import .*(use[A-Z]|Api'|apiClient|Service'|Context')" <file>
   ```
   then open each hit and check for the fetch inside it. A page that imports
   `useDashboardData`, a `*Api.ts`, a `*Service.ts` or a data context is wired until
   proven otherwise.

   **And the inverse matters just as much:** "wired" is not "honest". Both hybrids above
   fetch real data AND render invented data beside it. So the question is never
   *does this page fetch* — it is *does every figure on screen come from what it
   fetched*, which is answered per figure, not per file. This is lesson 3 and lesson 9 one
   level out: there, data could not reach a consumer that bypassed or ignored it; here, a
   consumer reads real data for some values and literals for the rest.

16. **A gate that ran BEFORE your last edit has not gated that edit. Re-run the full
   gate as the final step, after every change — comments included.** The full gate is
   tests + typecheck + `lint:hooks` + a build or browser check, and the last of those is
   not optional padding: it is the only member that catches a file which no longer
   parses.

   Earned on the mobile-nav commit. 547 tests, `lint:hooks` and a typecheck error-set
   diff all ran clean; *then* a z-index note was added as a JSX comment placed directly
   under `return (`, which is a syntax error. Vite refused to compile the module and
   served an error page in its place. Nothing in the already-passing gate knew: the run
   predated the edit, and the edit looked like the safest category of change there is.
   It was caught only because a browser check happened afterwards for an unrelated
   reason, and it would otherwise have been committed as a non-compiling file behind a
   green report.

   Three things this generalises to, all of which this project has the scars for:

   - **"It's only a comment" is not a safety argument.** A comment is a token stream
     edit like any other. Lesson 7 is the same failure with a backtick instead of a
     brace — twice, both times inside a comment quoting SQL.
   - **The claim you publish is the state you last measured, not the state on disk.**
     Reporting a gate result from before the final edit is the same defect as a success
     toast over an unchanged database (lesson 2) and a 200 that vouches for a rendered
     value it never produced (lesson 4): evidence attached to the wrong moment.
   - **Order the gate so the cheap parse check is last, not first.** `tsc` passes on a
     file Babel/Vite cannot parse in JSX position, and vitest never imported the module
     at all, so neither one was ever going to catch this. Load the page, or run the
     build.

17. **Two shell commands issued in parallel share ONE working directory — so one of them
   can run somewhere you did not send it.** In the targets session a frontend
   `cd Frontend && npx vitest` ran inside `Backend/`, because the parallel backend call's
   `cd` landed in between. It pointed the round-trip suite at `.env`'s `bmi_crm`, and the
   only thing that kept it off live data was `src/__tests__/setup.ts` refusing any
   `DB_NAME` not ending in `_test`. The tell was a "frontend" check printing backend file
   names and an empty typecheck count. **Wrap every directory-dependent command in a
   subshell — `(cd /abs/path && …)` — and never run two test suites in parallel calls;**
   sequence them in one call, which also keeps timing evidence clean (see the flake
   observations above).

   The same session found the companion hazard: **the backend dev server
   (`ts-node-dev --respawn`) restarts on any `src/` edit and applies pending migrations to
   live `bmi_crm` on boot.** A migration is therefore applied to live the moment backend
   code is touched after writing it — lesson 14 without a `db:migrate` ever being typed.
   Finalise and validate the migration FIRST (apply it to `bmi_crm_iso_test`, and run it
   against live inside a transaction that is rolled back), then edit backend source.
