# P3 design — saved reports and the tenant-scoped query builder

**Status: REVIEWED AND APPROVED 2026-09-19. All nine product decisions are made —
see §6, which now records the ANSWERS, not the questions. Phases 0 and 1 are
BUILT, and so are Phases 2 and 3.**

### Two things Phase 1 discovered that changed the design

1. **The application connects as a SUPERUSER that owns every table.** So RLS is
   unconditionally inert for it — which is exactly why the app is unaffected, and
   exactly why a reports pool misconfigured to use those credentials would have
   RLS silently inert while looking protected. An inert security layer is worse
   than an absent one. The pool therefore proves RLS is live BEHAVIOURALLY before
   serving anything (a query with no tenant set must return zero rows) and
   refuses outright if `REPORTS_DB_USER` equals `DB_USER` or is missing. There is
   no fallback to the app pool, deliberately.
2. **`users` carries `password_hash` and `token_version`**, so the reporting role
   gets COLUMN-level SELECT on four columns — which made `SELECT *` in the
   builder's scoped source wrong. `scopedSource()` now takes an optional
   projection from the registry. The security boundary is unchanged: the column
   names come from the registry, never a request.

### Confirmed build order

| Phase | What | State |
|---|---|---|
| **0** | Registry + generator, pure, no execution | **built** |
| **1** | Hardened execution: read-only role, RLS, restricted pool, `statement_timeout`, row cap | **built** (migration 055) |
| **2** | `saved_reports` + `saved_report_grants` + persistence + permissions | **built** (migration 056) |
| **3** | Run endpoints + provenance | **built** |
| **4** | `CustomReportBuilder` wired | next |
| **5** | `ReportDetailView` | |
| **6** | Canned reports, incl. Revenue by Industry and by-owner with disclosure | |
| **7** | Exports (CSV, then PDF/Excel) | |
| **8** | Scheduling | |
| **9** | Caching with result age (small, droppable) | |

**RLS moved from last to Phase 1 on Venkat's decision**, and it is better there
than originally argued for a reason underweighted at design time: adjacency lets
the two layers be mutation-tested AGAINST EACH OTHER — sabotage the generator's
tenant predicate and assert RLS still blocks the read, which demonstrates
independence rather than asserting it.

**Permissions folded into Phase 2** rather than staying a late phase: "owner may
grant edit rights to specific people" is not an enum, so `saved_report_grants`
must exist when `saved_reports` is created, or it becomes a second migration plus
a backfill.

**v1 grew.** Scheduling needs a job runner, which does not exist in this codebase
— no cron, no queue, no worker. That is larger new infrastructure than the RLS
work, and it is now in scope.

Every number below was measured against live `bmi_crm` on 2026-09-16, after the
test-data cleanup — not carried over from an earlier round.

---

## 1. `saved_reports` — what it stores

```sql
CREATE TABLE saved_reports (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    category     VARCHAR(100),
    definition   JSONB NOT NULL,
    owner_id     INTEGER,
    visibility   VARCHAR(20) NOT NULL DEFAULT 'private',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT saved_reports_owner_fkey
      FOREIGN KEY (owner_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE SET NULL,
    CONSTRAINT saved_reports_visibility_check
      CHECK (visibility IN ('private', 'workspace')),
    CONSTRAINT saved_reports_definition_shape_check
      CHECK (definition ? 'v' AND definition ? 'base'
             AND definition->>'base' IN ('deals','companies','leads','contacts','activities')),
    CONSTRAINT saved_reports_name_unique UNIQUE (tenant_id, name)
);
```

Notes on the choices, and why each is the way it is:

- **`owner_id` is a COMPOSITE FK to `users(id, tenant_id)`** — the same shape
  `user_sales_profiles` and `meetings.owner_id` use. A plain FK to `users(id)`
  would let a report in workspace A be owned by a user in workspace B, because
  `users.id` is a global primary key.
- **`ON DELETE SET NULL` on the owner, not CASCADE.** A saved report is
  workspace configuration that outlives the person who wrote it. Same call as
  `forecast_snapshots.user_id`; the opposite of `quotas.user_id`, which CASCADEs
  because a quota without its person is meaningless.
- **`definition` is JSONB and NEVER contains SQL.** See §1.1.
- **`definition->>'base'` is CHECK-constrained**, so a definition naming a table
  outside the allowlist cannot be stored *at all* — not by the API, not by a
  hand-typed `INSERT`. This is the both-layers pattern from migrations 049 and
  050: the controller validates the whole definition, and the database refuses
  the one field that decides which table gets read.
- **No `is_seed`/`is_test` on this table.** Saved reports are configuration, not
  records of anything.

### 1.1 The query definition — structured, versioned, no SQL

```jsonc
{
  "v": 1,                                  // definition_version; see below
  "base": "deals",                         // a MODULE KEY, not a table name
  "joins": ["companies"],                  // module keys, validated against the join graph
  "dimensions": [ { "field": "companies.industry" } ],
  "metrics": [
    { "agg": "sum",   "field": "deals.value" },
    { "agg": "count", "field": "deals.id"    }
  ],
  "filters": [
    { "field": "deals.stage_type", "op": "eq", "value": "won" },
    { "field": "deals.expected_close_date", "op": "between", "value": ["2026-07-01","2026-09-30"] }
  ],
  "sort":  [ { "by": "metric:0", "dir": "desc" } ],
  "limit": 200
}
```

**Every `field` is a KEY into a server-side registry, never a column name and
never a fragment.** `"companies.industry"` is a lookup, and the registry decides
that it means `c.industry`. `"deals.value; DROP TABLE"` is not a dangerous string
— it is a key that does not exist, and the request is a 400. Operators (`eq`,
`in`, `between`, `gte`…) are likewise keys mapping to fixed SQL; `value` is
always a bound parameter and never interpolated.

**`v` exists because this shape will change.** A saved report is stored config
that outlives the code that wrote it: a v1 definition must still run, or say
clearly that it cannot, after the registry grows. Reading a definition whose `v`
the server does not know is an error with a message, not a best-effort parse.

**This aligns with what the existing builder UI already produces** —
`ReportConfig` in `CustomReportBuilder.tsx` already has `dataSource`,
`selectedFields`, `filters`, `groupBy`, `sortBy`, `sortDirection` and
`calculations`. The UI does not need rewriting to feed this; it needs its field
pickers repointed at a served registry instead of local arrays. That is also the
project's served-not-mirrored rule: the client renders the registry the server
enforces, rather than keeping its own copy that drifts (the `hr` lesson).

---

## 2. The security model — why the `tenant_id` filter cannot be dropped

This is the part that matters. A user-defined query builder is the one place in
this codebase where a missed `workspace_id` predicate is not a bug in one
hand-written query but a bug in a *generator*, reachable by any report anyone
saves. The design is therefore about making the unsafe query **inexpressible**,
not about remembering to add a predicate.

### 2.1 Layer 1 — a registry, not free-form input (structural)

Two server-side constants, the only source of truth:

```ts
// Which modules exist, what table each is, and what may join to what.
const REPORT_MODULES = {
  deals:      { table: 'deals',      alias: 'd', joins: { companies: 'd.company_id = c.id',
                                                          leads:     'd.lead_id = l.id' } },
  companies:  { table: 'companies',  alias: 'c', joins: { } },
  contacts:   { table: 'contacts',   alias: 'ct', joins: { companies: 'ct.company_id = c.id' } },
  leads:      { table: 'leads',      alias: 'l', joins: { } },
  activities: { table: 'activities', alias: 'a', joins: { deals: 'a.deal_id = d.id', /* … */ } },
} as const;

// Which fields may be named, and what each one IS.
const REPORT_FIELDS = {
  'deals.value':              { sql: 'd.value',   type: 'number', aggregatable: true },
  'deals.stage_type':         { sql: 'ps.stage_type', type: 'enum', joinsVia: 'pipeline_stages' },
  'companies.industry':       { sql: 'c.industry', type: 'enum',  aggregatable: false },
  // …
} as const;
```

A client can only ever send keys. There is no code path that takes a table or
column name from a request and puts it into SQL.

### 2.2 Layer 2 — a table can only be named through a scoped source (the structural guarantee)

The important move. The generator does **not** emit `FROM deals d`. There is
exactly one function that can produce a FROM or JOIN source, and it always wraps
the table in a tenant-scoped inline view:

```ts
function scopedSource(moduleKey, params) {
  const m = REPORT_MODULES[moduleKey];               // unknown key throws
  params.push(tenantId);
  return `(SELECT * FROM ${m.table} WHERE tenant_id = $${params.length}) ${m.alias}`;
}
```

So the generated SQL looks like:

```sql
FROM (SELECT * FROM deals     WHERE tenant_id = $1) d
LEFT JOIN (SELECT * FROM companies WHERE tenant_id = $2) c
       ON d.company_id = c.id AND d.tenant_id = c.tenant_id
```

**Why this and not "remember the WHERE clause":** with a single `WHERE
tenant_id = $1` on the base table, a *join* to another table still needs its own
predicate, and that is exactly the omission that produced this project's real
leak — CLAUDE.md records it as "not a missing `WHERE` clause but an unscoped
`JOIN`". Here a table that has not been scoped cannot appear in the query,
because the only way to name one is through a function that scopes it. Forgetting
is not an available mistake.

**Joins additionally carry `AND parent.tenant_id = child.tenant_id`** — the
existing project rule, kept because every FK here references a global primary
key, so a reference that already crosses workspaces must not be readable through
either side.

### 2.3 Layer 3 — an assertion on the assembled SQL (cheap, not the guarantee)

Before execution: count the sources the generator created and count the
`tenant_id = $n` predicates in the emitted SQL. A mismatch throws rather than
executing. This is a tripwire for a future refactor, explicitly **not** the
guarantee — if it ever fires, layer 2 has been broken and that is the bug.

### 2.4 Recommended hardening — a read-only role with RLS *(product/infra decision)*

The strongest available belt, and I'd recommend it, but it is a decision rather
than a detail: execute report queries as a **dedicated read-only Postgres role**
with **row-level security** policies keyed on a per-transaction
`SET LOCAL app.tenant_id`. Then a bug in the generator cannot cross tenants at
all, and the report path additionally cannot write.

Cost, stated honestly: a new role, RLS policies on the five tables, and a second
connection pool. The app today uses one pool with no per-request session
variable, so this is new infrastructure rather than a flag. It is *not* required
for correctness of layers 1–3; it removes a whole class of future mistake.
**Flagging for Venkat** — see §6.

### 2.5 How I would mutation-test this boundary

Mutation testing is the project's established practice, and here it is the
deliverable rather than a nicety. Each mutation is applied in turn and must fail
a named test; a mutation that passes is a missing test, not a safe mutation.

| # | Mutation | Must fail |
|---|---|---|
| 1 | Drop `WHERE tenant_id` from `scopedSource` | "a report never returns another workspace's rows" |
| 2 | Drop `AND parent.tenant_id = child.tenant_id` from the join | "a cross-workspace FK cannot be read through a join" |
| 3 | Let `REPORT_FIELDS` fall through to the raw key | "an unknown field is a 400, not a column" + an injection test |
| 4 | Let `REPORT_MODULES` fall through to the raw key | "an unknown module is a 400" |
| 5 | Disable the layer-3 assertion | **nothing should fail** — if only this catches 1 or 2, defence in depth is absent and that is a finding |
| 6 | Accept `definition.base` without the CHECK (drop it in SQL) | "the DATABASE refuses a definition naming an unlisted table" |
| 7 | Interpolate `filter.value` instead of binding it | an injection test with `'; DROP TABLE deals; --` as a filter value |

Plus one **property test** rather than examples: for every module in the
registry, and every legal join pair, generate the SQL and assert the number of
`tenant_id = $` predicates equals the number of sources. That covers registry
entries added later, which is where the next mistake will actually be.

Plus the fixture the project already relies on: two workspaces, identical data,
and every report run asserted to return only the caller's rows — the shape
`tenantIsolation.test.ts` already uses.

---

## 3. Module scope — and why HRMS is excluded structurally, not by policy

Verified against `information_schema` on 2026-09-16:

| Module | `tenant_id` | In the registry |
|---|---|---|
| `deals` | yes | **yes** |
| `companies` | yes | **yes** |
| `leads` | yes | **yes** |
| `contacts` | yes | **yes** |
| `activities` | yes | **yes** |
| `pipeline_stages` | yes | yes — needed for `stage_type` (won/lost) |
| `users` | yes | dimension only (owner name) |
| **`employees`** | **NO** | **impossible** |

**`employees` has no `tenant_id` column at all.** That is not a policy
preference — `scopedSource` requires a tenant column to emit its predicate, so an
`employees` entry in `REPORT_MODULES` cannot be constructed. The HRMS boundary is
enforced by the same mechanism that enforces tenant isolation, which is the
strongest form of "do not join HRMS" available. This matches the call already made
in Meeting Agent (migration 049 deliberately omits `'employee'` from
`meetings.related_to_type`, unlike `tasks`).

**Two joins are real but nearly empty, and the design must not hide that:**

- `deals.assigned_to_user_id` — **1 of 21 deals (5%)**. Any "by owner" report is
  effectively unbacked through the FK; the legacy free-text `deals.assigned_to`
  is what actually carries ownership on live data. A by-owner report must either
  group on the text (and say it is a display name, not a user) or be listed as
  unbacked. **This is the same "a display name is not a key" problem migrations
  039–043 exist to remove, and it is not P3's job to fix.**
- `activities` — **0 rows**. Every activity-based report is honestly empty today,
  and the activity-attribution gap (no user reference on `activities`) is already
  tracked.

---

## 4. Seeded-vs-real disclosure

Current live figures, for the 18 visible (non-test) deals:

| | |
|---|---|
| Visible deals | **18** |
| With a `company_id` (the join "Revenue by Industry" needs) | **16 (89%)** |
| Of those 16: **seeded** | **13** |
| Of those 16: **real** | **3** |
| Seeded share of all visible deals | 15 of 18 (**83%**) |
| Companies with an `industry` | 15 of 15 (100%) |

**Coverage and provenance are two different numbers, and reporting either one
alone is misleading.** "89% of deals are linked to an account" is true and
invites the reader to trust the chart. "81% of the rows behind this chart are
demo data" is the fact that changes how they read it.

So every report result — canned or custom — carries a provenance block, and it is
computed by the runner rather than by each card:

```jsonc
"provenance": {
  "rows_returned":   16,
  "rows_seeded":     13,        // is_seed = true
  "rows_real":        3,
  "excluded_test":    3,        // is_test = true, excluded as everywhere else
  "coverage": { "join": "deals.company_id", "matched": 16, "of": 18 }
}
```

And the UI renders a **sentence**, not a badge:

> Based on 16 of 18 deals — **13 of them seeded demo data**, 3 real. Three deals
> have no account linked and are not counted.

Design rules that follow from Wave 6:

1. **Seeded rows are INCLUDED by default and disclosed.** Excluding them leaves
   "Revenue by Industry" describing three deals, which is the exact failure
   `UNBACKED_REPORTS` documents. Migration 052 deliberately added no query-level
   exclusion for `is_seed`, for this reason.
2. **`is_test` rows stay excluded**, as everywhere else in the app.
3. **A report whose input is >50% seeded says so above the chart, not in a
   footnote.** The threshold is a product choice (§6).
4. **If `rows_seeded` cannot be computed** — a module without `is_seed` — the
   block says so rather than reporting zero. A `0` that means "not measured" is
   the defect this project keeps removing.

---

## 5. What `ReportDetailView` needs to stop being a stub

It currently calls `getReportData(reportName)`, which branches on the URL slug
and returns hardcoded `chartData`, `pipelineData` and `tableData`. It needs
exactly three things:

1. **`GET /reports/:id`** — the saved report's name, description, category and
   definition, so the page can title itself and show what it is showing.
2. **`GET /reports/:id/run`** (optionally `?period=`) — `{ columns, rows,
   provenance }`. Its three existing fixtures map onto one result set:
   `tableData` → `rows`; `chartData` → the dimension/metric series; `pipelineData`
   → the same series when the dimension is a stage. One endpoint, three
   renderings.
3. **A route keyed on the report's ID, not a slug.** The slug is what let the
   page fabricate: `getReportData` *guessed* content from the URL text. A real
   report is a row; the URL should name it.

Two things it does today that must not survive: **exports** (`handleExportPDF`
was a `console.log`, now an honest alert) and **scheduling** (collects a
frequency and recipients that go nowhere). Both need the email service and a
scheduler, and both are out of P3 unless you want them in.

---

## 6. Product decisions — ANSWERED 2026-09-19

Recorded as answers so a later reader does not mistake this for an open list.

1. **Sharing: private by default; the owner may grant rights to specific people,
   at TWO LEVELS — `view` and `edit`** (refined 2026-09-21). `view` is the floor
   any share confers; `edit` sits on top and implies it. There is deliberately no
   edit-without-view, and it is not merely discouraged: one grant row per
   (report, user) holding one level makes that state UNREPRESENTABLE.
   This SUPERSEDES the `visibility` enum sketched in §1 — and there is no
   `visibility` column at all, because "private" is simply the absence of grants.
   A column beside the grants table would be two sources of truth for one
   question.
2. **Create/edit/delete** follows from (1): the owner, plus anyone holding an
   explicit edit grant.
3. **Seeded rows are NEVER user-excludable.** Included and disclosed, always. The
   builder has no code path that can filter `is_seed`, and a test asserts the
   emitted SQL never mentions it — the capability does not exist rather than
   being defaulted off.
4. **Threshold: 50%**, `MOSTLY_SEEDED_THRESHOLD` in `types.ts`.
5. **5,000 rows, 10s timeout, truncation always disclosed.** The builder asks for
   `MAX_ROWS + 1`, so truncation is DETECTED rather than assumed: a plain
   `LIMIT 5000` returning exactly 5,000 rows is indistinguishable from a report
   that genuinely has 5,000.
6. **Caching allowed; result age must always be shown when served from cache.**
   Phase 9, deliberately last — premature caching hides freshness bugs.
7. **RLS + read-only role: YES, build it now** — resequenced to Phase 1.
8. **No `assigned_to_user_id` backfill** — it would need the fuzzy name-matching
   this project refused elsewhere (039-043). "By owner" ships in Phase 6 with the
   same honest-disclosure treatment as the other weak joins. The registry
   therefore exposes BOTH `deals.assigned_to` ("Owner (name as entered)") and
   `deals.owner_name` ("Owner (linked user)"), labelled so a reader knows which
   one they are grouping on.
9. **Exports and scheduling are IN for v1** (Phases 7 and 8). The job runner does
   not exist yet.
