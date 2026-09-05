# Item 5 — Configurable pipeline stages (design proposal, NOT implemented)

Same standing as `TOKEN_ACCESS`/`a1750b2`: this is a design to argue with before any code
is written. Nothing here is built. Every fact about the current state was read out of
`bmi_crm` or the source on 2026-09-04 and is cited so it can be re-checked rather than
believed.

---

## 1. The finding that changes the shape of this work

**The table already exists, is per-tenant, and is populated.** `pipeline_stages` and
`pipelines` are both live in `bmi_crm`, both carry `tenant_id NOT NULL` with FKs to
`tenants`, and `pipeline_stages` already has `name`, `position`, `probability`, `color`,
`is_won` and `is_lost`. That is very close to the table this item was scoped to create.

So the work is **not "add a table"**. It is **"reconcile three disagreeing stage models
onto one"** — which is a different job, with a different risk profile, and one that has to
be got right in a migration rather than designed on a blank page.

One caveat on the existing notes, stated precisely rather than as a gotcha:
`PROMPT_C_SUMMARY.md:378` lists `pipelines` among "unbuilt tables". Read as *the pipeline
feature is unbuilt*, that is fair — nothing writes to either table. Read as *the tables are
empty scaffolding*, it is not: both exist with `tenant_id`, and `pipeline_stages` holds six
seeded rows with curated probabilities and colors that this design deliberately adopts
rather than discards (§3, step 2). Worth pinning down before anyone plans on a blank
page.

### The three models, as they actually are today

| # | Where | Contents | Who reads it |
|---|---|---|---|
| 1 | `Frontend/src/config/pipelines.ts` | 3 pipelines (`new-business`, `renewals`, `partnerships`), slug ids, 16 stages total | 5 frontend files. **This is what the app runs on.** |
| 2 | Six hardcoded `['prospecting','qualified',…]` literals | the 6 new-business stages only | `DealsListView` (×3), `DealsGridView`, `CRMDashboard`, `dealVelocity`, `dealDataQuality` |
| 3 | DB `pipelines` + `pipeline_stages` | **1** pipeline ("Standard Sales Pipeline", UUID id), 6 stages, display-cased names | `pipelinesController` only |

They disagree in every way that matters:

- **Ids don't match.** `deals.pipeline_id` is `varchar(50)` holding slugs
  (`new-business`), while `pipelines.id` is a UUID. `deals.pipeline_id` is **not a foreign
  key to anything** — it is free text with a default of `'new-business'`.
- **Names don't match.** `deals.stage` holds `closed-won`; `pipeline_stages.name` holds
  `Closed Won`. The one place that joins them does it through
  `lower(replace(name,' ','-'))` (`dealsController.ts:490`) — a normalising match that
  works by luck of the current values.
- **Two pipelines exist only in TypeScript.** `renewals` and `partnerships` are in
  `config/pipelines.ts` and are referenced by live deals, but have no row in `pipelines`.
- **Two live deals sit in stages with no DB row at all** (`renewal-quoted`,
  `partner-evaluation`). For those, the probability lookup above silently finds nothing and
  falls through to the existing value. That is not a crash; it is a stage default that
  quietly does not apply.
- **Model 2 is wrong for those deals by construction.** A six-element `stageOrder` array
  cannot sort a `renewal-quoted` deal. It sorts to the end, or to `-1`, depending on the
  file.

### Nothing consumes the DB model
`dealsApi.getPipelines()` exists and now throws properly on failure — but **no component
calls it.** `LeadContext.fetchPipelines` is `async () => { setPipelines([]); }`, a stub.
So `pipelinesController` serves a correct answer that reaches no screen. This is the
lesson-3 shape again: an endpoint can be right and still reach nothing.

### Current data (2026-09-04)

```
tenants: 1
deals:   25, across 3 pipeline_id slugs and 8 distinct stage values
  new-business (23):  qualified 9, proposal 8, negotiation 3, closed-won 1,
                      closed-lost 1, prospecting 1
  renewals (1):       renewal-quoted
  partnerships (1):   partner-evaluation
pipelines:            1 row  (no deal references its UUID)
pipeline_stages:      6 rows (Prospecting…Closed Lost, probabilities 20/40/60/80/100/0)
deal_stage_history:   0 rows
forecast_entries:     0 rows      forecast_quotas: 0 rows      blueprints: 0 rows
```

The empty tables matter: **the migration's blast radius today is 25 deals in one tenant.**
This is the cheapest moment this change will ever have. It still has to be written to be
correct for N tenants, because it will be run against a populated database later.

---

## 2. Schema

### 2.1 `pipeline_stages` — three columns added, two replaced

```sql
ALTER TABLE pipeline_stages
  ADD COLUMN slug        VARCHAR(50),          -- stable machine key, set once
  ADD COLUMN stage_type  VARCHAR(10),          -- 'open' | 'won' | 'lost'
  ADD COLUMN archived_at TIMESTAMPTZ;          -- retirement; NULL = active
```

**`slug` — why a stage needs a stable key that is not its name.**
Renaming is the single most common configuration change, and a rename must not break
anything. Three things depend on a stage's identity surviving a rename: the API filter
(`GET /deals?stage=qualified`), saved views (`utils/savedViewPresets.ts` stores stage
predicates), and any bookmarked URL. If the only key is the display name, renaming
"Qualified" to "Sales Qualified" silently empties every saved view that referenced it —
and does so with no error anywhere, which is exactly the class of failure this codebase
keeps finding late.

So: **`slug` is assigned at creation from the name, and is immutable thereafter.** Rename
changes `name` only. Unique per pipeline:

```sql
ALTER TABLE pipeline_stages
  ADD CONSTRAINT pipeline_stages_slug_key UNIQUE (tenant_id, pipeline_id, slug);
```

Scoped by `tenant_id` as well as `pipeline_id` — belt and braces, and it makes the
constraint self-evidently tenant-safe when read on its own.

**`stage_type` replaces `is_won` + `is_lost`.** Two independent booleans can encode
`is_won = true AND is_lost = true`, which is meaningless, and the current table has no
CHECK preventing it. A single column cannot:

```sql
ALTER TABLE pipeline_stages
  ADD CONSTRAINT pipeline_stages_type_check CHECK (stage_type IN ('open','won','lost'));
```

The booleans are **kept and derived** for one migration cycle rather than dropped, because
`pipelinesController` selects them by name and the frontend `PipelineStage` interface reads
`isWon`/`isLost`. Dropping them in the same migration that adds `stage_type` would break
both at once. They are dropped in Phase C (§6).

**`archived_at` is the retirement mechanism** and is discussed in §4.

### 2.2 `pipelines` — a slug too

```sql
ALTER TABLE pipelines
  ADD COLUMN slug VARCHAR(50),
  ADD CONSTRAINT pipelines_slug_key UNIQUE (tenant_id, slug);
```

Needed because `deals.pipeline_id` holds `'new-business'`, and the backfill has to be able
to find or create the pipeline a deal already claims to be in.

### 2.3 `deals.stage` → `deals.stage_id`

```sql
ALTER TABLE deals ADD COLUMN stage_id UUID REFERENCES pipeline_stages(id);
CREATE INDEX idx_deals_stage_id ON deals (tenant_id, stage_id);
```

**A FK, not a text column with a CHECK.** A CHECK constraint cannot express "must be one of
this tenant's stages", and validating in application code only is precisely the second data
path CLAUDE.md rules out.

**This FK needs the project's standard tenant treatment.** `pipeline_stages(id)` is a
global primary key with no tenant component, so Postgres will happily accept a deal in
workspace A pointing at a stage in workspace B — referential integrity satisfied, tenant
isolation not. Per CLAUDE.md this needs **both halves**:

1. The write proves ownership via `utils/tenantScope.ts` before insert/update, rejecting
   with **400** and a message naming the field
   (`"stage_id does not name a stage in this workspace"`) — the settled contract in
   `src/__tests__/tenantIsolation.test.ts`, not re-litigated here.
2. Every join carries `AND pipeline_stages.tenant_id = deals.tenant_id`, so a bad row that
   somehow exists cannot be read back through a join either.

**`deals.stage` (the text column) is kept, not dropped, until Phase C** — and the reason is
the `close_date` / `expected_close_date` lesson. A query written against a column that has
been renamed out from under it fails silently rather than loudly. 26 frontend files and
several backend queries reference `stage`; they get moved deliberately, not by yanking the
column.

**Note the width trap.** `deals.stage` is `varchar(20)`; the longest value in use is 18
chars (`partner-evaluation`). A customer stage called "Contract Under Legal Review" slugs to
27 characters and would be **silently truncated** on write — the actor-name overflow bug
this project already paid for once. `pipeline_stages.slug` is therefore `varchar(50)`, and
during dual-write (Phase A) the app writes the slug to `deals.stage` **only if it fits**,
logging when it does not, rather than truncating. That asymmetry is temporary and is the
main reason Phase C exists rather than being optional.

### 2.4 `deal_stage_history` — deliberately stays text

`from_stage` / `to_stage` stay `varchar(64)` **snapshots**, with no FK added.

An audit row records what was true at the time. If history held an FK, deleting a stage
would either cascade (destroying the audit trail) or block forever (making stages
undeletable once any deal has ever passed through — which is almost immediately). Both are
worse than a text snapshot that says "this deal moved to 'Qualified' on the 4th", which
remains true and readable after the stage is gone.

An optional `to_stage_id UUID` may be added later purely as a join convenience for
analytics, nullable and with `ON DELETE SET NULL`. It is **not** part of this design and is
not needed for anything currently built.

---

## 3. The migration and its backfill

One numbered file in `Backend/migrations/` per §6 of `CRM_REMEDIATION_PLAN.md`. It must be
idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`) because this project runs migrations
on boot.

### The governing rule
**The backfill is driven by what deals actually reference — never by what the `pipelines`
table happens to contain.** The existing `pipelines` row is referenced by zero deals; a
backfill that trusted it would produce stages nothing points at, and miss the eight stages
deals really use. The instruction "no deal ends up pointing at a stage that doesn't exist"
is satisfiable in exactly one way: enumerate the deals first.

### Steps

**Step 1 — pipelines, from `DISTINCT (tenant_id, pipeline_id, pipeline_name)` on `deals`.**
Insert a `pipelines` row for each, `slug = deals.pipeline_id`, `name = deals.pipeline_name`.
For this database that creates `renewals` and `partnerships`, which have never existed as
rows.

**Step 2 — adopt the pre-existing pipeline rather than duplicating it, but only on proof.**
The existing "Standard Sales Pipeline" has six stages whose normalised names
(`lower(replace(name,' ','-'))`) are exactly `{prospecting, qualified, proposal,
negotiation, closed-won, closed-lost}` — precisely the new-business stage set, with curated
probabilities (20/40/60/80/100/0) and colors that would be thrown away by ignoring it.

So the migration **adopts** it as the `new-business` pipeline — sets its slug — **if and
only if** that normalised set is a superset of the new-business stages the tenant's deals
actually use. If the assertion fails, it does not adopt; it creates a fresh pipeline and
leaves the old one untouched and flagged. Adoption is an inference from matching names, so
it is written as a checked inference, not an assumption.

**Step 3 — stages, from the union of two sources.**

```
DISTINCT (tenant_id, pipeline_id, stage)          FROM deals
UNION
DISTINCT (tenant_id, from_stage), (tenant_id, to_stage)  FROM deal_stage_history
```

The history half is empty today (0 rows) and is included anyway: a deal may have *passed
through* a stage that no deal currently sits in, and dropping it would leave history
referring to a stage the config does not list. Cheap now, impossible to reconstruct later.

For each stage not already present as a row:
- `slug` = the value as found (already slug-shaped).
- `name` = the seed catalogue's display name if the slug is one this codebase shipped
  (`config/pipelines.ts`'s 16), else title-cased from the slug.
- `probability` = the catalogue's value if known, else **NULL**, not a guess.
- `position` = appended after existing stages, in catalogue order where known.
- `stage_type` — see below.

**Step 4 — `stage_type`, and the one place I refuse to infer.**

Derived, in this order:
1. From existing `is_won` / `is_lost` where a row already exists.
2. From an **explicit allow-list** of the terminal slugs this codebase has actually shipped:
   `closed-won`, `renewal-won`, `partner-won` → `won`; `closed-lost`, `renewal-lost`,
   `partner-lost` → `lost`.
3. Everything else → `open`.

**No suffix heuristic.** Matching `%-won` would be tempting and would be wrong: a workspace
with a stage called "Won Back" or "Lost Deal Review" — a perfectly ordinary re-engagement
stage — would be classified as terminal, and `stage_type` drives forecasting, the win-rate
on the dashboard, and the Kanban's terminal columns. A stage silently marked `won` inflates
a revenue number, which is the fabricated-data failure mode wearing a different hat.

The migration therefore **prints every stage it classified as `open` by fallback rather
than by the allow-list**, so an admin can correct them. It does not guess and it does not
stay quiet. `stage_type` is left NOT NULL with default `'open'` — the safe direction, since
mis-classifying a won stage as open understates the forecast rather than inflating it.

**Step 5 — populate `deals.stage_id`**, joining on `(tenant_id, pipeline slug, stage slug)`.

**Step 6 — assert, and fail the migration if the assertion fails.**

```sql
-- Must be zero. If it is not, stop: some deal points at no stage.
SELECT count(*) FROM deals WHERE stage_id IS NULL AND stage IS NOT NULL;
-- Must be zero. Cross-tenant reference.
SELECT count(*) FROM deals d JOIN pipeline_stages s ON s.id = d.stage_id
 WHERE s.tenant_id <> d.tenant_id;
```

Per the project's own lesson: verify by re-counting the end state, not by the statements
returning without error.

**A note on `deals.stage IS NULL`.** The column is nullable with no default and 25/25 rows
are currently populated, but the schema permits NULL. Those deals get `stage_id = NULL` and
are **not** assigned a stage by the migration. Inventing a starting stage for a deal that
never had one is a data-model decision, not a migration's call — the same reasoning that
left `deals.value` alone when its missing-value 500 was fixed. Whether stage becomes NOT
NULL is listed as an open question in §7.

---

## 4. Deleting or retiring a stage that still has deals

This is the decision the item explicitly asks for. **Two distinct operations, because they
answer two different questions.**

### Retire (`PATCH …/stages/:id  { "archived_at": "now" }`) — the expected path
- Sets `archived_at`. **Nothing is orphaned and no reference is nulled.**
- Deals already in the stage **stay there** and still render, with the column marked
  retired on the board.
- The stage disappears from stage *pickers*, so no deal can move **into** it.
- Reversible: clear `archived_at`.

This is what "we stopped using Discovery" actually means, and it is the right default. A
CRM's stage list is history as much as configuration.

### Delete (`DELETE …/stages/:id`) — for genuine mistakes, and it blocks
- If **any live deal** references the stage → **409 Conflict**, body names the count:
  `"3 deals are still in this stage. Move them to another stage first, or retire the stage
  instead."`
- With `?reassign_to=<stage id>` → in **one transaction**: validate the target is in the
  same pipeline and same tenant and is not archived, `UPDATE deals SET stage_id = target`,
  write a `deal_stage_history` row per moved deal recording the reassignment, then delete.
- `deal_stage_history` never blocks a delete, because it holds text snapshots (§2.4).

**Why 409 here and not the settled 400.** CLAUDE.md fixes **400** for *"this FK does not
name a row in your workspace"* and says not to re-litigate it. This is a different
situation and does not touch that rule: the id **is** valid and visible to the caller, and
the request is well-formed. What fails is a conflict with current state — the textbook 409.
The 400 case still applies here for `reassign_to` naming a stage in another workspace, and
uses the settled message shape.

### Invariants enforced on both paths
A pipeline must retain **at least one `open`, at least one `won`, and at least one `lost`
stage.** Forecasting, win-rate and the Kanban's terminal columns all assume a won and a
lost stage exist; a pipeline without one produces a dashboard that is wrong rather than
empty. Retiring or deleting the last stage of any type → 409 naming which.

**Concurrency: the lock is on the pipeline, not the stage row.** This is the
mutual-deactivation race from commit `2205494`, exactly: two admins each retiring a
*different* won-stage at the same moment both read "there is another won stage", both
proceed, and the pipeline ends with none. Locking the target row does not help, because the
two transactions touch different rows.

```sql
SELECT pg_advisory_xact_lock(hashtextextended('pipeline_stage_config', 0), hashtext(pipeline_id::text));
```

taken **before** the count, in the same transaction, so the check and the write cannot
interleave. Same shape and same reasoning as the admin guard; the test should mirror
`roundTrip.deactivationRace.test.ts` and assert zero bad end-states across concurrent
attempts, not "usually fine".

---

## 5. API surface

All under `/api/v1/pipelines`. **Writes are `requireRole('admin')`; reads are any
authenticated user** — everyone needs the stage list to render a board, and gating reads
would break the Kanban for sales users. Admin-only for writes as instructed; widening to
manager is a one-line change and is noted, not taken.

| Method | Path | Role | Notes |
|---|---|---|---|
| `GET` | `/pipelines` | any | exists; gains `slug`, `stage_type`, `archived_at`. `?include_archived=true` to see retired stages. |
| `GET` | `/pipelines/:id/stages` | any | exists; same additions. |
| `POST` | `/pipelines/:id/stages` | admin | `{name, stage_type, probability?, color?, position?}`. Derives `slug`; 409 on slug collision within the pipeline. Appends if `position` omitted. |
| `PATCH` | `/pipelines/:id/stages/:sid` | admin | `name`, `probability`, `color`, `stage_type`, `archived_at`. **Never `slug`** (§2.1). Changing the last won/lost stage's type hits the §4 invariant. |
| `PUT` | `/pipelines/:id/stages/order` | admin | `{stage_ids: [...]}` — the **complete** ordered list. |
| `DELETE` | `/pipelines/:id/stages/:sid` | admin | 409 unless empty; `?reassign_to=` moves first. |

### Reorder takes the whole array, and why
Per-stage `position` patches cannot express a reorder atomically: two concurrent patches
interleave into an order neither admin asked for, and a dropped request leaves a gap. The
endpoint therefore takes the full permutation and **validates it is exactly the set of that
pipeline's stage ids** — no additions, no omissions. A partial array is a 400, because
accepting one would silently drop the stages it omitted.

Positions are rewritten 1..N inside one transaction under the same pipeline advisory lock.
The unique constraint must be deferrable, or the intermediate states collide:

```sql
ALTER TABLE pipeline_stages
  ADD CONSTRAINT pipeline_stages_position_key
  UNIQUE (pipeline_id, position) DEFERRABLE INITIALLY DEFERRED;
```

Without `DEFERRABLE` this constraint makes every reorder fail on the first swap — a detail
worth writing down because it looks like a bug in the endpoint when it appears.

### Pipeline CRUD is *not* in this item
Deals reference three pipelines; only one exists as a row. The backfill (§3) fixes that
data, but creating/renaming/deleting **pipelines** is a larger surface with its own
questions (what happens to deals when a pipeline is deleted; can a deal move between
pipelines and what does that mean for its stage). Out of scope, listed in §7.

---

## 6. Rollout — three phases, because the frontend is the expensive half

**Phase A — additive. No behaviour change, nothing can break.**
Migration adds columns, backfills, populates `deals.stage_id`, asserts. `deals.stage` stays
authoritative; the app dual-writes both. Round-trip tests for the backfill against a
seeded multi-tenant fixture, including a tenant whose deals use stages the catalogue has
never heard of.

**Phase B — flip the source of truth. This is where the work is.**
Stage-config API + admin UI under Settings (which now has a real, reachable home at
`/crm/settings` — see the route map in CLAUDE.md). Writes validate `stage_id` via
`tenantScope`. Frontend fetches stages from `GET /pipelines` and the **26 files carrying
hardcoded stage knowledge are cut over** — 6 with six-element `stageOrder` arrays,
`config/pipelines.ts` becomes a fallback-free API read, `config/stageColors.ts` becomes a
lookup keyed on the stage's stored `color`.

That count is the honest cost of this item, and it is why it is a design doc first. It is
also why Phase B should be **one vertical slice at a time** per CLAUDE.md's working style —
Kanban first, since it is the screen the feature exists for — rather than 26 files in one
pass.

**Phase C — cleanup.** `deals.stage_id` becomes `NOT NULL` (pending §7's answer), the
`deals.stage` text column is dropped, and `is_won`/`is_lost` are dropped now that
`stage_type` is the only reader.

---

## 7. Open questions

**Q1 and Q2 are SETTLED (2026-09-05). Q3-Q5 remain open and are Phase B concerns.**

1. **SETTLED — `deals.stage_id` IS `NOT NULL`, applied at the end of Phase A.**
   The `deals.value` precedent points the other way here, and the distinction is the
   point: that question stays open because *"amount not yet known"* is a genuine state of
   an early deal. *"Not in any stage"* is not — a deal's stage IS its position in the
   process, and a stage-less deal cannot render on the Kanban at all. The data agreed
   (25/25 populated, and the column had been nullable the whole time), and so did both
   write paths: the form sends `stages[0].id`, `createDeal` did `stage || 'prospecting'` —
   the same shape as `parseFloat(d.value) || 0`. Applied in Phase A rather than Phase C so
   the 26-file Phase B cutover does not run with an invariant everything assumes and
   nothing enforces. No schema default: "first open stage" is per-pipeline and cannot be
   expressed in DDL, so the application supplies it.
2. **SETTLED — stages belong to a pipeline**, matching the existing FK. Renaming
   "Qualified" in New Business does not rename it in Renewals. Changing this is a larger
   redesign, not a Phase A decision.
3. **`partner-evaluation` and `renewal-quoted` have no `probability`.** Backfilled as NULL.
   Should the UI show "not set", or should forecasting treat NULL as 0? Recommend "not set"
   and exclude from weighted forecast, since 0 is a claim.
4. **Colors.** `pipeline_stages.color` holds hex (`#3B82F6`); `config/stageColors.ts` holds
   a curated Tailwind palette with an accessibility rule ("no active stage uses green or
   red — those are reserved for terminal outcomes"). If admins pick arbitrary colors that
   rule is unenforceable. Recommend a fixed palette to choose from rather than a free
   color picker, so the rule survives.
5. **Widening writes to `manager`.** Instructed admin-only; flagging that a sales manager
   owning their team's pipeline is a plausible ask.

---

## 6a. Phase B progress — slice 1 of n: the Kanban board

**Done.** The board's columns come from `GET /pipelines` instead of a six-element
literal, filtered to one pipeline at a time with a selector for the others.

**The hardcoded array was not merely inflexible — it deleted data from the board.**
Deals were bucketed with `filter(d => d.stage === stage.id)`, so any deal whose stage was
not one of the six matched no column and vanished with no empty state, no warning and no
count. Two live deals were invisible on the pipeline board for exactly that reason. There
is now an `unplacedDeals` banner that names any deal matching no column and links to it, so
the failure cannot be silent again.

**A pipeline selector was part of the slice, not a nice-to-have.** Showing one pipeline's
stages is right — seventeen columns across three pipelines is not a board — but without a
way to reach the others, the cutover would have swapped one silent drop for a different
one.

**Still hardcoded, and deliberately left for later slices:** the six
`['prospecting','qualified',…]` literals in `DealsListView` (×3), `DealsGridView`,
`CRMDashboard`, `dealVelocity` and `dealDataQuality`; `STAGE_LADDER` and `STAGE_KEY_MAP` on
the deal detail page; `config/stageColors.ts`; and `STAGES_REQUIRING_NEXT_STEP` on the
board (a coaching prompt, not a data path).

### Slice 2 — the deal detail page

**Done.** `STAGE_LADDER` and `STAGE_MAP` (the page) and `ORDERED_STAGES`,
`STAGE_KEY_MAP` and `STAGE_HEX` (the hero) are gone — **five** parallel copies of "every
pipeline has these same six stages", all keyed on a stage number 1-6. The page now resolves
the deal's own pipeline from `GET /pipelines`.

What they got wrong, verified in the real app: a Renewals deal rendered **"Stage 1 of 6"
with Prospecting highlighted**, because `STAGE_MAP` had no entry for `renewal-quoted` and
fell through to its `{ number: 1 }` default. It now reads "Stage 2 of 5" with the Renewals
vocabulary and a weighted value from the stage's real 75%.

**Two further bugs fixed, neither of them anticipated.** "Mark as Won" wrote the literal
`'closed-won'` for every deal regardless of pipeline — wrong for Renewals, whose won stage
is `renewal-won` — and it used `updateDeal()`, a plain field write, so marking a deal won
recorded **no `deal_stage_history` row at all**, despite this file's own comment saying a
move must. Both now resolve the pipeline's own outcome stage by `stage_type` and route
through the transition endpoint. The stage strip's terminal detection had the same shape
(`num === 5` / `num === 6`), which in Renewals pointed at Negotiating and Renewed.

### Slice 3 — the read-only sort/group/colour paths

**Done.** Every remaining hardcoded stage literal in the frontend is gone —
`grep "'prospecting', 'qualified'"` over non-test source now returns zero. New shared
`buildStageLookup()` resolves a stage by (pipeline, slug) and returns its type, position
among all stages and position among OPEN stages.

**"Read-only" did not mean low-risk, and neither engine had a single test.** That is why
the suite stayed green while both changed semantics.

- `dealDataQuality` inferred outcomes from SUBSTRINGS — `.includes('won')`,
  `.includes('lost')`, `.includes('closed')`. Already wrong on shipped stages: Partnerships
  ends at `partner-active` and `partner-inactive`, neither of which contains any of those
  words, so a **won partnerships deal was treated as open** and chased for missing next
  steps and close dates. Its "early stage" test named two new-business stages, so in any
  other pipeline every open stage was "late".
- `dealVelocity`'s `CLOSED_STAGES` was `{closed-won, closed-lost}`, so velocity — a metric
  its own comment calls "past-tense and not actionable" — was computed for already-closed
  Renewals and Partnerships deals. And `ACTIVE_STAGES.indexOf` returned -1 for all of them,
  taking a branch that assigned **stageProgress = 0.5**, so a deal one step from won and
  one fresh out of the first stage scored identically.
- `DealsGridView` and `DealsListView` rendered **"Stage 0 of 6"** for those deals.
- `DealsListView`'s sort comparator ranked an unknown stage at -1, i.e. *above* the first
  real stage.
- `config/stageColors.ts` fell back to gray, silently dropping the design system's rule
  that green and red are reserved for outcomes — a win and an open stage looked identical.

**A bug I introduced and caught in the browser, not in tests:** moving the stage-lookup
declarations into `DealsListView` put them below a `useMemo` that used them, and the list
view died with "Cannot access 'metaFor' before initialization". The suite was green — no
test renders that component — and only loading the page found it.

### Slice 4 — the stage-configuration API and admin screen

**Done.** §5's endpoints (create / rename+recolour+retype+retire / reorder / delete), all
admin-only, plus `GET /pipelines/palette`, and a rebuilt Deal Stages screen driving them.
Q4 (fixed palette) and Q5 (admin-only) are settled and built in.

**THREE screens were inventing three different stage lists**, none matching the database or
each other: `PipelineSettings` (PROSPECTING/QUALIFIED/… plus an "avg days" column with no
column behind it), `DealStages` (Qualification / Needs Analysis / …) and
`StageProbabilities` (the same five, read-only). An admin opening "Deal Stages" saw a stage
called "Needs Analysis" that has never existed here. All three nav entries now render the
one real screen.

**Q4, settled: the palette is served by the API, not hardcoded in the client**, and the
server refuses green or red on an open stage. A free colour picker cannot coexist with "no
active stage uses green or red" — an admin choosing green does not see a rule being broken,
they see a colour they liked. The UI does not offer them there either; the check exists in
both places because only one of them is enforcement.

### FINDING — this workspace has no admin, so the screen it ships is unreachable

`users` holds four `sales` and one `manager`. Nothing else. Q5 settled admin-only without
anyone checking whether an admin exists, so as shipped **no one in this workspace can
configure a stage.**

Not a deadlock: `POST /invites` allows `admin` *or* `manager` to issue an invite, and
`ASSIGNABLE_ROLES` includes `admin`, so the manager can invite one. Two things follow, and
both are decisions rather than bugs to fix here:

1. **There is no endpoint to change an existing user's role at all** — `routes/users.ts` has
   only list / deactivate / reactivate. A role is set once, by an invite or the seed script.
   So promoting the existing manager is impossible through the product; an admin can only be
   a *new* account. Combined with `EMAIL_TRANSPORT=log`, which does not deliver, the invite
   token is visible only in the server log.
2. **A manager can invite an admin, which is a privilege-escalation path.** Standard RBAC
   says you cannot grant a role above your own. Whether that is intended is an auth
   decision, not a stage-configuration one, so it is recorded here rather than changed.

### Phase C — reframed into three steps, because it is not one

The grep before touching anything found the gate is **not zero**, and found a structural
blocker the design had not accounted for: `getDeals` selects `d.*` and the write paths use
`RETURNING *`, so `stage` is in the API's JSON only because the column exists. Dropping it
would change the response shape and turn **167 frontend reads of `deal.stage` into
`undefined`** — no type error, no failing test.

- **C0 — DONE.** The deals queries project `pipeline_stages.slug AS stage`, so the API's
  `stage` field is independent of the column before the column goes. Additive; the response
  is byte-identical today because the two values are provably the same.
- **C1a — DONE.** All 29 outcome-by-literal sites across 13 files now ask the workspace's
  configuration. Design **Q3 is settled**: an unset probability is EXCLUDED from the
  weighted forecast, never counted as zero, and the exclusion count is shown on the card.
- **C1b — DONE.** The 5 deal-form files read the workspace's pipelines, and
  **`config/pipelines.ts` is deleted** — the last hardcoded stage catalogue in the
  frontend. A stage an admin adds is immediately usable when creating a deal; one they
  retire stops being offered, which matters because since Phase A the server refuses a
  stage that is not in the deal's pipeline, so offering a stale one produced a 400 the
  user could do nothing about.
- **C2 — DONE.** Migration 038 drops `deals.stage`, `pipeline_stages.is_won` and
  `pipeline_stages.is_lost`, together with every backend reference to them. Applied to
  `bmi_crm`; the API's response shape is unchanged (see below).

**The drift gate, checked before writing C0 and now pinned in the suite:** zero mismatches
between `deals.stage` and the derived slug across every live deal, zero deals whose stage
belongs to a different pipeline than the deal, zero null `stage_id`. Two new tests assert
both while the suite's data exists — a check run against the test database *afterwards*
passes vacuously, because teardown empties it.

**C0 relied on column order** while both existed: two fields were named `stage` and
node-pg's row object takes the last. Verified against this pg version rather than assumed.
With 038 applied there is no duplicate any more and the alias is the only source, so the
test that used to corrupt `deals.stage` now asserts the field is still returned AND that the
column is gone from `information_schema` — unread and absent are different states, and only
the second one stops something writing it again.

### C2 — what was actually verified

- **The drift gate re-run on live data immediately before migrating**: 25 deals, 0
  column-vs-slug mismatches, 0 null `stage_id`, 0 unjoinable through the tenant-scoped
  join, 0 cross-tenant, 0 stage-from-the-wrong-pipeline, 0 `is_won`/`is_lost` disagreements
  with `stage_type`. The same six assertions are re-run *inside* migration 038, which
  aborts the transaction rather than dropping a column the data does not support.
- **`pg_dump` before applying**: `~/bmi2-backups/bmi_crm_pre_migration038_2026-09-06.dump`.
  A dropped column is not recoverable by re-running anything, unlike the additive phases.
- **Response shape, measured rather than argued.** The pre-C2 backend was booted from a
  detached worktree at the previous commit against live data and its payloads captured,
  then 038 was applied and the same three endpoints captured again. `GET /deals` — 24
  deals, identical id set, **zero differing field names and zero differing values**;
  `GET /deals/:id` — identical. `GET /pipelines` loses exactly `is_won` and `is_lost` from
  each stage object, with every other value identical, and the frontend has zero readers of
  either.
- **Through the real UI**: Kanban renders all three pipelines; every column count and total
  cross-checked against SQL (Prospecting 1/$30K, Qualified 8/$465K, Proposal 8/$699K,
  Negotiation 3/$261K, and Renewals' own vocabulary with 1/$24K in Quoted). Closed
  Won/Closed Lost cards read "Won"/"Lost", which is `stage_type` classification, not a slug
  literal.
- **An index was carried across, not lost.** `idx_deals_tenant_active` was
  `(tenant_id, stage) WHERE NOT archived AND NOT test` — the covering index for the main
  list query, and `DROP COLUMN` would have taken it silently. 038 creates the `stage_id`
  equivalent first, then drops the old one.

**Two bugs C2 turned up, neither predicted by the plan.** Both are written up in CLAUDE.md's
recorded lessons (11-13) because the mechanism generalises:

1. `SELECT ... FOR UPDATE` **on a join** returned a NULL slug under contention — Postgres'
   EvalPlanQual re-fetches the locked row but reuses the already-read joined tuple, so the
   new `stage_id` met the old stage row and the LEFT JOIN matched nothing. The audit trail
   recorded `from_stage = null`. Both lock sites now lock the deal alone and resolve the
   slug in a second statement. A deterministic regression test pins it, and the test itself
   had to be fixed twice before it failed against the broken code.
2. Two conditionally-called hooks (`DealSlideoutPanel`, `MobileDealPreview`) crashed the
   deal slideout with "Rendered more hooks than during the previous render" — introduced in
   C1b, invisible to `tsc` and to 521 unit tests, and caught by clicking a card. The
   existing `npm run lint:hooks` gate flags both; it had simply not been run.

### Q3 — settled, and the premise had changed

The design said `partner-evaluation` and `renewal-quoted` would be backfilled NULL. They
were not: the Phase A fix that materialises a known pipeline's full catalogue — made
because "backfill only what deals reference" produced pipelines with no won or lost stage —
also gave them their catalogue probabilities of 45 and 75. **There are zero NULL-probability
stages and zero affected deals today**, so the rule is prospective: NULL is reachable
because the admin screen makes probability optional.

**A sum is a sum**: excluding an unassessed deal and counting it as zero produce the SAME
total. The entire difference is whether the shortfall is declared, which is why the count
is rendered on the card and not only in a tooltip.

`aiScore` could not carry the distinction — it is mapped `d.probability || 0`, so unset and
an explicit 0% arrive identical. A `probabilityRaw` field preserves the NULL.

### Outstanding verification, carried forward deliberately

- **A manual drag-and-drop spot-check on the Kanban is still owed.** The gesture cannot be
  driven by the available tooling — `@hello-pangea/dnd` ignores synthetic mouse events and
  the keyboard lift did not complete either. The handler calls the same
  `transitionDealStage` the confirm dialog exercises end to end, so the write path is
  proven and only the gesture is not. **The Kanban cutover should not be called fully
  verified until someone drags a card by hand.**
- **The Renewals deal card does not open the slideout panel on click.** Found while
  verifying C2 in the browser: clicking the one deal in the Renewals pipeline fires no
  request at all (backend network log unchanged), while the same gesture on a
  Standard-pipeline card fetches `GET /deals/D019` and renders the panel. Not caused by the
  column drop — no column participates in an onClick — and not investigated further here
  rather than being folded into a migration checkpoint. Worth its own look.
- **`mark-won` / `mark-lost` use `window.confirm`.** A native dialog, in a codebase whose
  every other confirmation is a custom modal, and it blocks browser automation outright —
  so that path is verified by unit test only, not through the UI. Worth replacing when the
  detail page is next touched; not folded into this slice because it is a UI-convention
  change rather than a stage-configuration one.

## 7a. What Phase A found that the design did not predict

Recorded because each was discovered by building or testing rather than by planning, and
because two of them changed the design.

- **A workspace with no pipeline cannot hold a deal at all.** `stage_id` is NOT NULL and
  resolves against the workspace's own configuration, so a workspace created *after* the
  migration has nothing to resolve and every deal creation in it fails. Thirty round-trip
  tests failed on this. Fixed with `provisionDefaultPipeline()`, called wherever a
  workspace is created, plus a migration step for any existing tenant with no deals to
  backfill from. **When real workspace creation is built, it must call it.**
- **"Backfill only what deals reference" produces unusable pipelines.** The dry run gave
  `renewals` and `partnerships` exactly ONE stage each and NO won or lost stage, because
  only one deal sat in each. Deals in them could never be closed. The backfill now
  materialises the full catalogue for a pipeline slug this codebase already ships —
  transcription, not invention — and reports any pipeline still lacking an outcome stage.
- **The suffix heuristic would have been wrong on real data, not hypothetically.** The
  partnerships pipeline ends at `partner-active` (won) and `partner-inactive` (lost).
  Neither ends in `-won` or `-lost`. A `LIKE '%-won'` rule would have dropped a whole
  pipeline's outcomes out of the forecast, using stages this product actually ships.
- **`createDeal` defaulted pipeline and stage independently**, so a deal created with
  `pipeline_id: 'renewals'` and no stage was written into `prospecting` — a stage not in
  that pipeline. Unreachable from the form, reachable from the API. Resolving the default
  from the deal's own pipeline makes it unrepresentable.
- **The bulk stage action never validated anything**: any string was written to every
  selected deal. It now resolves per deal against that deal's own pipeline, since a
  selection can span pipelines, and reports what it could not move instead of silently
  counting it as "already in that state".

## 8. What this design deliberately does not do

- **Does not touch `blueprint_stages`.** Different table, different feature (`blueprints` is
  0 rows and unbuilt). Not folded in.
- **Does not add `to_stage_id` to `deal_stage_history`.** §2.4.
- **Does not build pipeline CRUD.** §5.
- **Does not re-open the 400-vs-409 FK-rejection rule.** §4 explains why the new 409 is a
  different case, not an exception to it.
- **Does not delete `config/pipelines.ts` in Phase A.** It stays as the seed catalogue the
  backfill reads its display names and probabilities from, and is removed in Phase B when
  the API becomes the source.
