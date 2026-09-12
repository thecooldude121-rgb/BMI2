-- 043: retire `forecast_quotas`, and give `forecast_snapshots` a real rep identity.
--
-- Two changes to the forecast tables, in one migration because they are one
-- decision — "what identifies a rep in the forecast tables" — reached from two
-- directions. Elsewhere in this series migrations were kept apart when their
-- RATIONALES differed (039 structural, 040 vocabulary, 042 contract-breaking);
-- here the rationale is shared, so splitting would separate two halves of the
-- same answer.
--
-- ============================================================================
-- PART 1 — DROP `forecast_quotas`
-- ============================================================================
-- Confirmed immediately before writing this, not remembered from earlier:
--
--   rows in bmi_crm ................ 0
--   rows in bmi_crm_iso_test ....... 0
--   inbound foreign keys ........... none (both databases)
--   views depending on it .......... none (both databases)
--   executable code references ..... none
--
-- The only mentions anywhere are a design note recording that it is empty, a
-- comment in ForecastPage saying this migration would drop it, and
-- `000_baseline_schema.sql`, which CREATES it. That baseline is deliberately
-- NOT edited: an applied migration is a ledger entry, not a document to
-- revise (CLAUDE.md lesson 14 — a migration that has been applied is not
-- necessarily the migration in git, and the fix is never to rewrite the
-- ledger). So the table is created by 000 and dropped here, which is the
-- honest history.
--
-- WHY IT COULD NEVER HAVE BEEN USED, which is the real argument for dropping
-- rather than fixing it:
--
--   * NO `tenant_id` AT ALL. Every tenant-data table in this codebase carries
--     one and every query filters on it; this table structurally cannot, so
--     there is no way to store a row in it without creating a cross-tenant
--     read. It is unscopable, not merely unscoped.
--   * It keys on `employee_id character varying` — a reference to `employees`,
--     which is HRMS-OWNED. HRMS is a separate platform reached over the
--     SSO/API boundary, so a CRM forecast table keyed on an employee is a
--     boundary violation as well as a scoping one. `employees` itself has no
--     `tenant_id` either, so even joining to resolve the id is barred.
--   * `UNIQUE (employee_id, period, pipeline_id)` therefore spans tenants:
--     two workspaces could not hold a quota for the same period without
--     colliding.
--
-- It is superseded in every respect by `quotas` (migration 042), which is
-- tenant-scoped, keys on `users.id` inside this product, and has both halves
-- of the FK-ownership rule enforced. Two quota tables where one is
-- structurally incorrect is worse than one: the next reader has to work out
-- which is authoritative, and the wrong answer leaks across workspaces.
DROP TABLE IF EXISTS forecast_quotas;

-- ============================================================================
-- PART 2 — `forecast_snapshots` GETS A `user_id`, AND KEEPS ITS `rep_name`
-- ============================================================================
-- THE DECISION, recorded so it does not read as an oversight later:
--
-- Two options were on the table. (a) Migrate the snapshot's rep identity to
-- `user_id`, mirroring what 042 did to `quotas`. (b) Deliberately keep it
-- name-keyed as a denormalised point-in-time record, on the reasoning that a
-- snapshot's job is to preserve what was true then, including the name.
--
-- CHOSEN: (a) — WITH THE NAME RETAINED. That is a considered blend rather than
-- a dodge, and both halves are load-bearing:
--
--   `user_id` IS ADDED, because `rep_name` is NOT a passive record here. It is
--   a LIVE IDENTITY-MATCHING KEY, and two places prove it:
--
--     ForecastPage.tsx:1170  repRows.find(r => r.name === snap.rep_name)
--     ForecastPage.tsx:361   latest.has(row.rep_name) / latest.set(...)
--
--   The first joins a snapshot to a current rep to compute slippage; the
--   second de-duplicates snapshots per rep. Both match on a display string,
--   so option (b) would not have been "preserving history" — it would have
--   kept the exact defect 042 exists to remove, in a table that had merely
--   not been exercised yet. Concretely, name-only identity means a rep who is
--   renamed silently stops matching their own history, and two people who
--   share a display name are merged into one row by that UNIQUE. The feature
--   this table exists to enable — "commit accuracy trending and rep
--   historical accuracy", which the UI already advertises as unlocking at two
--   snapshots — IS cross-time rep matching, so it needs identity that
--   survives a rename.
--
--   `rep_name` IS KEPT, and this is where a snapshot genuinely differs from a
--   quota. In 042 the name was pure defect: it identified a person badly and
--   preserved nothing, so it was dropped. Here the name additionally records
--   WHAT THIS REP WAS CALLED ON THE DAY THE SNAPSHOT WAS TAKEN, which is real
--   historical information a reference cannot reconstruct — resolving
--   `user_id` later gives today's name, not the one on the forecast call.
--   Dropping it would destroy information; keeping it as a captured value
--   while identity moves to `user_id` loses nothing.
--
-- So: identity by reference, display by capture. The name stops being the key
-- and becomes what it should always have been — a recorded fact.

-- ── The reference ───────────────────────────────────────────────────────────
ALTER TABLE forecast_snapshots ADD COLUMN IF NOT EXISTS user_id INTEGER;

ALTER TABLE forecast_snapshots DROP CONSTRAINT IF EXISTS forecast_snapshots_user_id_fkey;
ALTER TABLE forecast_snapshots
  ADD CONSTRAINT forecast_snapshots_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ON DELETE SET NULL, THE OPPOSITE OF `quotas`, AND DELIBERATELY SO.
-- 042 gave `quotas.user_id` CASCADE because a quota without its person is
-- meaningless — a target nobody holds. A SNAPSHOT IS THE REVERSE: it is a
-- historical record, and history must outlive the person it describes.
-- Cascading here would let deleting one user silently rewrite past forecast
-- calls, which is precisely what an audit record must not permit. The row
-- survives with its `rep_name` intact, so it stays readable after the
-- reference is gone.

-- NULLABLE, and NOT NULL would be wrong for a second, independent reason.
-- ForecastPage snapshots every rep row it displays, and some of those rows
-- have no resolvable user: 20 of the 24 live deals still carry only a name
-- (15 of them "John Smith", who was never a user), which the page groups under
-- `COALESCE(assigned_to_user_id, assigned_to)`. A NOT NULL column would make
-- those rows unrecordable and silently drop ~$1.39M of pipeline out of every
-- snapshot. Nullable keeps the snapshot complete and honest about which rows
-- are attributed; `rep_name` remains NOT NULL and is the fallback identity for
-- exactly those.

-- ── Re-key uniqueness: one row per rep, per period, per day ─────────────────
-- The old key was UNIQUE (tenant_id, period_label, rep_name, snapshot_date),
-- which merged two distinct people sharing a display name into a single
-- snapshot row.
--
-- A plain UNIQUE on `user_id` cannot replace it, because NULLs are distinct in
-- a unique constraint: every unattributed row ("John Smith", "Unassigned")
-- would duplicate on each re-snapshot of the same day. So the key is a
-- FUNCTIONAL unique index on the identity the application actually uses —
-- the user id where one is known, and the name where it is not. That is the
-- same COALESCE the frontend groups by, enforced in the database.
DROP INDEX IF EXISTS forecast_snapshots_tenant_period_rep_date_uniq;
ALTER TABLE forecast_snapshots
  DROP CONSTRAINT IF EXISTS forecast_snapshots_tenant_period_rep_date_key;

CREATE UNIQUE INDEX forecast_snapshots_tenant_period_rep_date_uniq
  ON forecast_snapshots (
    tenant_id,
    period_label,
    snapshot_date,
    (COALESCE(user_id::text, rep_name))
  );

-- Reading a rep's history across snapshots — the trending feature's access
-- path — is by user, tenant-first like every index here.
CREATE INDEX IF NOT EXISTS forecast_snapshots_tenant_user_idx
  ON forecast_snapshots (tenant_id, user_id, period_label);

COMMENT ON COLUMN forecast_snapshots.user_id IS
  'The rep this snapshot row is about. Nullable: a snapshot also records rep rows whose ownership is only a name (see migration 039), and ON DELETE SET NULL because a historical record must outlive the person - the opposite of quotas.user_id, which CASCADEs. Added in 043.';

COMMENT ON COLUMN forecast_snapshots.rep_name IS
  'What this rep was CALLED when the snapshot was taken - a recorded historical fact, not an identity key. Kept deliberately in 043 while identity moved to user_id: resolving user_id later yields today name, not the one on that forecast call. Also the fallback identity for rows with no user_id.';

-- ── NO BACKFILL, and nothing to lose by it ──────────────────────────────────
-- `forecast_snapshots` holds 0 rows in both databases, verified immediately
-- before writing this, so there is no history to resolve and no decision being
-- guessed at. Had there been rows, resolving a name to an id would have been a
-- judgement call rather than a migration step — the "John Smith" case in 039,
-- where 15 rows named someone who was never a user, is exactly why this file
-- does not attempt it silently.
--
-- ── WHAT THE API DOES ───────────────────────────────────────────────────────
-- `GET /forecast/snapshots` returns BOTH fields. `rep_name` keeps its meaning
-- and its place in the response, so no consumer breaks; `user_id` is added
-- alongside so the client can match a snapshot to a rep by reference instead
-- of by string. `POST` accepts an optional `user_id` per rep and validates it
-- against the caller's workspace before insert, like every other foreign id
-- here — users.id is a global primary key, so the FK alone would accept
-- another workspace's colleague.
