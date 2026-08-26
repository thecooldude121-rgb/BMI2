# Handoff — read before starting work

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

## 1. Item 4 — Lead Generation deletion. UNSTARTED. Do not delete before review.

The decision is made: Lead Gen and HRMS are **separate platforms consuming this CRM over
SSO**, not modules in this repo. So the Lead Generation *tool* is out of product, not just
out of phase, and deleting it is correct.

**The trap is the name.** Two unrelated things both say "lead":

| | Lines | Verdict |
|---|---|---|
| `Frontend/src/pages/LeadGeneration/` (42 files) | 28,206 | **DELETE** — the prospecting/enrichment tool |
| `Frontend/src/components/LeadGeneration/` (11 files) | 3,536 | **DELETE** — same tool |
| `Frontend/src/components/Leads/` (36 files) | — | **KEEP** — CRM leads UI |
| `Frontend/src/utils/lead*.ts` (32 files) | — | **KEEP** — SLA, NBA, scoring, dedupe engines |
| `Backend/src/routes/leads.ts` (29 routes) | — | **KEEP** — CRM |
| `Backend/src/controllers/leadSubController.ts` | — | **KEEP** — CRM |
| 7 `lead_*` tables (`leads`, `lead_notes`, `lead_tasks`, `lead_emails`, `lead_calls`, `lead_meetings`, `lead_views`) | — | **KEEP** — CRM, all workspace-scoped |

**Required before deleting anything:** produce the full file list and the
tool-vs-module mapping for the repo owner's review. That is an explicit instruction, not a
formality.

### Hand-verify `Frontend/src/components/Deals/` — do NOT trust a reachability grep

A live, routed component in that directory has been **nearly deleted twice** on faulty
reachability analysis. Both near-misses came from a grep that reported everything as
unimported.

Known facts, verified by resolving imports to real paths:

- `components/Deals/DealsModule.tsx` **is imported** by `pages/CRM/DealsPage.tsx` — live.
- `components/Deals/DealDetailPage.tsx` **is imported** by `DealsModule.tsx` — live.
- `components/Deal/DealDetailPage.tsx` (singular `Deal`) had zero importers and was
  correctly deleted. **Three sibling files shared that basename.** Two are live.
- `pages/CRM/DealsListView.tsx` was wrongly reported dead in an audit; it **is imported** by
  `DealsKanbanPage.tsx`.

Resolve every candidate import to an actual file path before calling anything dead.

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
corrected). Residual code remains, and **it is in the live path** — `lib/supabase.ts` calls
`createClient` at module scope, so it initialises at app boot and emits a console warning.

Footprint to remove:

- `Frontend/src/lib/supabase.ts` — the client, with a `https://placeholder.supabase.co`
  fallback so it "works" without config
- 8 files importing it: `contexts/SettingsContext.tsx`,
  `components/Permissions/{APIIntegrationsPanel,UserGroupManagement,AuditFeed}.tsx`,
  `pages/Settings/AuditTrail.tsx`, `pages/CRM/CRMSettings/ProfileSettings.tsx`,
  `pages/Discovery/SavedSearchesPage.tsx`, `services/documentsService.ts`
- 14 files mention Supabase in total
- `@supabase/supabase-js ^2.57.4` in `Frontend/package.json`
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` references

Sweep every import, client init, env var, type and the package dependency. Note the overlap
with §2 — several of these files are the Settings trees that are being deleted anyway, so
sequence the two together rather than fixing files that are about to go.

---

## 4. Known gaps — real, and deliberately not fixed

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
