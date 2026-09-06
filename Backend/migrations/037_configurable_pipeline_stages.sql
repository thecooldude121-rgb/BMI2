-- Migration 037: configurable pipeline stages — Phase A (additive).
--
-- Design: PIPELINE_STAGES_DESIGN.md, approved 2026-09-04. This is Phase A only:
-- schema, backfill, and the NOT NULL constraint. It changes no behaviour on its
-- own; the controller dual-write ships in the same commit, and the frontend
-- cutover is Phase B.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY THIS IS A RECONCILIATION AND NOT A CREATION
--
-- `pipelines` and `pipeline_stages` already existed, per-tenant and populated.
-- What did not exist was any agreement between them and the data. Three models
-- disagreed:
--   1. Frontend/src/config/pipelines.ts — 3 pipelines, 16 stages, slug ids.
--      This is what the app actually runs on.
--   2. Six hardcoded ['prospecting','qualified',…] literals in six files.
--   3. These two tables — ONE pipeline, UUID ids, display-cased names, read by
--      pipelinesController and nothing else.
-- deals.pipeline_id is varchar(50) holding slugs and is a foreign key to
-- nothing; pipelines.id is a UUID that no deal references. deals.stage holds
-- 'closed-won' while pipeline_stages.name holds 'Closed Won', joined in exactly
-- one place by lower(replace(name,' ','-')) — a match that worked by luck of the
-- current values. Two live deals sat in stages with no row at all.
--
-- THE BACKFILL IS DRIVEN BY WHAT DEALS REFERENCE, never by what `pipelines`
-- contains. Zero deals reference the existing pipeline row, so trusting it would
-- have produced stages nothing points at and missed the eight stages actually in
-- use. "No deal ends up pointing at a stage that doesn't exist" is satisfiable
-- in exactly one way: enumerate the deals first.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Widths, before anything writes a slug ────────────────────────────────
--
-- deals.stage is VARCHAR(20) and the longest value in use is 18 characters
-- ('partner-evaluation'). This migration introduces a dual-write period in which
-- the application writes a configurable stage's slug into that column, so a
-- stage named "Contract Under Legal Review" (slug 27 chars) would be SILENTLY
-- TRUNCATED — the actor-name overflow bug of migrations 032/034 all over again,
-- created by this very change. Fixed here rather than tracked as a follow-up.
--
-- 100 everywhere a stage slug can be stored, matching pipeline_stages.name
-- VARCHAR(100). A slug is derived from a name by mapping characters 1:1, so 100
-- is exactly enough and no path can truncate. Sizing to the current maximum is
-- how this class of bug happens; sizing to the source column's width is why it
-- cannot recur.
--
-- Increasing a varchar length limit is metadata-only in Postgres — no table
-- rewrite, and no existing value can be invalidated because every current value
-- already fits.
ALTER TABLE deals              ALTER COLUMN stage      TYPE VARCHAR(100);
ALTER TABLE deal_stage_history ALTER COLUMN from_stage TYPE VARCHAR(100);
ALTER TABLE deal_stage_history ALTER COLUMN to_stage   TYPE VARCHAR(100);

-- DELIBERATELY NOT WIDENED: deals.pipeline_id VARCHAR(50), which holds a
-- pipeline slug and has the same latent shape. Nothing in Phase A writes a new
-- value into it — pipeline CRUD is out of scope for this item — so this
-- migration does not create that risk and does not get to fix it silently. It
-- belongs with pipeline CRUD.
--
-- ALSO NOT TOUCHED: leads.stage VARCHAR(20). Same shape, entirely different
-- vocabulary (new/contacted/qualified/proposal/won/lost/nurture — a lead funnel,
-- not a deal pipeline) and a different feature. Named here so it is not
-- rediscovered as a surprise, and not folded in.

-- ── 2. Columns ──────────────────────────────────────────────────────────────

-- pipelines.slug: the backfill has to find the pipeline a deal already claims to
-- be in, and deals claim it by slug ('new-business'), not by UUID.
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- pipeline_stages:
--   slug        stable machine key, immutable across rename (see §2.1 of the
--               design). Renaming is the commonest configuration change and must
--               not silently empty every saved view that referenced the stage.
--   stage_type  replaces is_won + is_lost, which as two independent booleans can
--               encode is_won AND is_lost simultaneously with no CHECK to
--               prevent it. The booleans are KEPT for now and derived — dropping
--               them here would break pipelinesController and the frontend
--               PipelineStage interface in the same migration that adds their
--               replacement. They go in Phase C.
--   archived_at retirement. NULL = active. See §4: retiring never orphans a
--               deal, which is why it is the default path and DELETE is the
--               exception.
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS slug        VARCHAR(100);
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS stage_type  VARCHAR(10);
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- deals.stage_id. Nullable for now; SET NOT NULL is the last step of this file,
-- after the backfill has proved every row can be populated.
--
-- deals.stage (the text column) is KEPT and stays authoritative until Phase B.
-- Dropping it here would be the close_date/expected_close_date lesson: a query
-- written against a column that vanished fails silently rather than loudly, and
-- 26 frontend files plus several backend queries still read `stage`.
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id);

-- ── 3. Seed catalogue ───────────────────────────────────────────────────────
--
-- The 16 stages Frontend/src/config/pipelines.ts has shipped, used ONLY to give
-- backfilled rows a real display name, probability, colour and type instead of a
-- guess. Colours are the hex the existing pipeline_stages rows already use, so
-- an adopted row and a created row look identical.
--
-- NOTE THE TERMINAL SLUGS, because they are the concrete proof behind this
-- migration's refusal to infer stage_type from a slug suffix (§4 below):
-- partnerships ends at 'partner-active' (won) and 'partner-inactive' (lost).
-- Neither ends in -won or -lost. A `slug LIKE '%-won'` heuristic would have
-- classified both as open and quietly dropped a whole pipeline's outcomes out of
-- the forecast — using stages this codebase actually ships, not a hypothetical.
CREATE TEMP TABLE seed_stages (
  pipeline_slug VARCHAR(100),
  slug          VARCHAR(100),
  name          VARCHAR(100),
  probability   INT,
  color         VARCHAR(20),
  stage_type    VARCHAR(10),
  position      INT
) ON COMMIT DROP;

INSERT INTO seed_stages VALUES
  ('new-business', 'prospecting',         'Prospecting',  20,  '#6B7280', 'open', 1),
  ('new-business', 'qualified',           'Qualified',    40,  '#3B82F6', 'open', 2),
  ('new-business', 'proposal',            'Proposal',     60,  '#F59E0B', 'open', 3),
  ('new-business', 'negotiation',         'Negotiation',  80,  '#8B5CF6', 'open', 4),
  ('new-business', 'closed-won',          'Closed Won',   100, '#10B981', 'won',  5),
  ('new-business', 'closed-lost',         'Closed Lost',  0,   '#EF4444', 'lost', 6),
  ('renewals',     'renewal-review',      'Under Review', 60,  '#3B82F6', 'open', 1),
  ('renewals',     'renewal-quoted',      'Quoted',       75,  '#F59E0B', 'open', 2),
  ('renewals',     'renewal-negotiation', 'Negotiating',  85,  '#8B5CF6', 'open', 3),
  ('renewals',     'renewal-won',         'Renewed',      100, '#10B981', 'won',  4),
  ('renewals',     'renewal-lost',        'Churned',      0,   '#EF4444', 'lost', 5),
  ('partnerships', 'partner-intro',       'Introduction', 25,  '#6B7280', 'open', 1),
  ('partnerships', 'partner-evaluation',  'Evaluation',   45,  '#3B82F6', 'open', 2),
  ('partnerships', 'partner-agreement',   'Agreement',    70,  '#F59E0B', 'open', 3),
  ('partnerships', 'partner-onboarding',  'Onboarding',   90,  '#8B5CF6', 'open', 4),
  ('partnerships', 'partner-active',      'Active',       100, '#10B981', 'won',  5),
  ('partnerships', 'partner-inactive',    'Inactive',     0,   '#EF4444', 'lost', 6);

-- ── 4. Backfill ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  adopted   INT := 0;
  unclassified TEXT;
  orphaned  TEXT;
BEGIN
  -- 4a. ADOPT the pre-existing pipeline rather than duplicating or discarding it
  --     — but only on proof, since this is an inference from matching names.
  --
  -- This database has one "Standard Sales Pipeline" whose six stages normalise
  -- to exactly the new-business set, with curated probabilities (20/40/60/80/
  -- 100/0) and colours that would be thrown away by ignoring it. It is adopted
  -- as the pipeline slug whose deals it covers, if and only if its normalised
  -- stage names are a SUPERSET of the stages those deals actually use, and
  -- exactly one such slug matches. Otherwise it is left alone and a fresh
  -- pipeline is created, so a mismatch degrades to "harmless duplicate" rather
  -- than "wrong stages adopted".
  WITH deal_stage_sets AS (
    SELECT d.tenant_id, d.pipeline_id AS slug, array_agg(DISTINCT d.stage::text) AS stages
      FROM deals d
     WHERE d.stage IS NOT NULL
     GROUP BY 1, 2
  ),
  pipeline_stage_sets AS (
    SELECT p.id, p.tenant_id,
           array_agg(DISTINCT trim(both '-' from regexp_replace(lower(s.name), '[^a-z0-9]+', '-', 'g'))::text) AS stages
      FROM pipelines p
      JOIN pipeline_stages s ON s.pipeline_id = p.id AND s.tenant_id = p.tenant_id
     WHERE p.slug IS NULL
     GROUP BY 1, 2
  ),
  candidates AS (
    SELECT ps.id AS pipeline_uuid, ps.tenant_id, ds.slug,
           count(*) OVER (PARTITION BY ps.id) AS match_count
      FROM pipeline_stage_sets ps
      JOIN deal_stage_sets ds
        ON ds.tenant_id = ps.tenant_id
       AND ds.stages <@ ps.stages          -- deals' stages ⊆ pipeline's stages
  )
  UPDATE pipelines p
     SET slug = c.slug
    FROM candidates c
   WHERE p.id = c.pipeline_uuid
     AND c.match_count = 1;
  GET DIAGNOSTICS adopted = ROW_COUNT;
  IF adopted > 0 THEN
    RAISE NOTICE '037: adopted % existing pipeline(s) by proven stage-set match', adopted;
  END IF;

  -- 4b. Every remaining pipeline gets a slug from its own name, so the column
  --     can be NOT NULL and an un-adopted pipeline is still addressable rather
  --     than being a nameless orphan.
  UPDATE pipelines
     SET slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
   WHERE slug IS NULL;

  -- 4c. Create a pipeline row for every (tenant, pipeline_id, pipeline_name) a
  --     deal references and that does not exist yet. For this database that
  --     creates `renewals` and `partnerships`, which have never existed as rows
  --     despite live deals sitting in them.
  INSERT INTO pipelines (name, description, is_default, is_active, tenant_id, slug)
  SELECT DISTINCT ON (d.tenant_id, d.pipeline_id)
         coalesce(d.pipeline_name, initcap(replace(d.pipeline_id, '-', ' '))),
         'Backfilled by migration 037 from deals already in this pipeline',
         false, true, d.tenant_id, d.pipeline_id
    FROM deals d
   WHERE d.pipeline_id IS NOT NULL
     AND NOT EXISTS (
           SELECT 1 FROM pipelines p
            WHERE p.tenant_id = d.tenant_id AND p.slug = d.pipeline_id
         );

  -- 4c-2. A tenant with NO deals has nothing to backfill from and would end up
  --       with no pipeline at all — and a workspace with no pipeline cannot hold
  --       a deal, because stage_id is NOT NULL and resolves against the
  --       workspace's own configuration. Give every such tenant the default
  --       pipeline so no workspace is left unable to create its first deal.
  --
  --       Mirrors provisionDefaultPipeline() in src/utils/pipelineStages.ts,
  --       which does the same for a workspace created AFTER this migration ran.
  --       The two exist because they serve different moments — this one is a
  --       one-off catch-up, that one is the ongoing rule — and both must agree.
  INSERT INTO pipelines (name, description, is_default, is_active, tenant_id, slug)
  SELECT 'New Business', 'Standard pipeline for new customer acquisition',
         true, true, t.id, 'new-business'
    FROM tenants t
   WHERE NOT EXISTS (SELECT 1 FROM pipelines p WHERE p.tenant_id = t.id);

  -- 4d. Give the pre-existing stage rows their slug and stage_type.
  --     stage_type comes from the booleans that are already there — the most
  --     authoritative source available for a row someone curated by hand.
  UPDATE pipeline_stages
     SET slug = coalesce(slug, trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))),
         stage_type = coalesce(stage_type,
                        CASE WHEN is_won THEN 'won' WHEN is_lost THEN 'lost' ELSE 'open' END);

  -- 4e. Create a stage row for every stage a deal references, UNION every stage
  --     the history references, UNION the full seed set for any pipeline whose
  --     slug this codebase already ships.
  --
  --     The history half is empty in this database (0 rows) and is included
  --     anyway: a deal may have PASSED THROUGH a stage that no deal currently
  --     sits in, and omitting it would leave audit rows naming a stage the
  --     configuration does not list. Cheap now, impossible to reconstruct later.
  --
  --     THE SEED HALF EXISTS BECAUSE "ONLY WHAT DEALS REFERENCE" PRODUCES
  --     UNUSABLE PIPELINES, and the dry run proved it rather than the design
  --     predicting it. This database has one renewals deal (in 'renewal-quoted')
  --     and one partnerships deal (in 'partner-evaluation'), so a
  --     strictly-referenced backfill gave those two pipelines exactly ONE stage
  --     each and NO won or lost stage at all. A deal in such a pipeline could
  --     never be closed, and the §4 invariant — every pipeline keeps at least one
  --     open, won and lost stage — would be violated from birth.
  --
  --     Materialising the catalogue for a KNOWN pipeline slug is not invention:
  --     config/pipelines.ts is the configuration this product already ships and
  --     runs on, so writing it into the table is transcription. For an UNKNOWN
  --     slug (a pipeline a customer created that this codebase has never heard
  --     of) nothing is invented — only referenced stages are created, and 4f
  --     reports the pipeline as lacking an outcome stage so an admin can add one.
  WITH referenced AS (
    SELECT p.tenant_id, p.slug AS pipeline_slug, s.slug AS stage_slug
      FROM pipelines p
      JOIN seed_stages s ON s.pipeline_slug = p.slug
    UNION
    SELECT d.tenant_id, d.pipeline_id AS pipeline_slug, d.stage AS stage_slug
      FROM deals d
     WHERE d.stage IS NOT NULL AND d.pipeline_id IS NOT NULL
    UNION
    SELECT h.tenant_id, d.pipeline_id, h.to_stage
      FROM deal_stage_history h JOIN deals d ON d.id = h.deal_id
     WHERE h.to_stage IS NOT NULL
    UNION
    SELECT h.tenant_id, d.pipeline_id, h.from_stage
      FROM deal_stage_history h JOIN deals d ON d.id = h.deal_id
     WHERE h.from_stage IS NOT NULL
  ),
  target AS (
    SELECT r.tenant_id, r.stage_slug, p.id AS pipeline_uuid,
           s.name AS seed_name, s.probability AS seed_prob,
           s.color AS seed_color, s.stage_type AS seed_type, s.position AS seed_pos
      FROM referenced r
      JOIN pipelines p ON p.tenant_id = r.tenant_id AND p.slug = r.pipeline_slug
      LEFT JOIN seed_stages s
             ON s.pipeline_slug = r.pipeline_slug AND s.slug = r.stage_slug
     WHERE NOT EXISTS (
             SELECT 1 FROM pipeline_stages ex
              WHERE ex.tenant_id = r.tenant_id
                AND ex.pipeline_id = p.id
                AND ex.slug = r.stage_slug
           )
  )
  INSERT INTO pipeline_stages
    (pipeline_id, tenant_id, slug, name, probability, color, stage_type, position, is_won, is_lost)
  SELECT t.pipeline_uuid, t.tenant_id, t.stage_slug,
         -- A known slug keeps its shipped display name; an unknown one is
         -- title-cased from the slug. Never invented.
         coalesce(t.seed_name, initcap(replace(t.stage_slug, '-', ' '))),
         -- NULL, not 0, when unknown. 0 is a claim about win probability.
         t.seed_prob,
         coalesce(t.seed_color, '#6B7280'),
         coalesce(t.seed_type, 'open'),
         coalesce(t.seed_pos,
                  1000 + row_number() OVER (PARTITION BY t.pipeline_uuid ORDER BY t.stage_slug)),
         coalesce(t.seed_type, 'open') = 'won',
         coalesce(t.seed_type, 'open') = 'lost'
    FROM target t;

  -- 4f. Report every stage that fell back to 'open' because it was NOT in the
  --     allow-list, so an admin can classify it. THE MIGRATION DOES NOT GUESS
  --     AND DOES NOT STAY QUIET.
  --
  --     'open' is the safe default in one specific direction: mis-classifying a
  --     won stage as open UNDERSTATES the forecast. The opposite — a suffix
  --     heuristic marking a customer's "Won Back" re-engagement stage as
  --     terminal — inflates a revenue number, which is the fabricated-data
  --     failure mode wearing a different hat.
  SELECT string_agg(DISTINCT ps.slug, ', ') INTO unclassified
    FROM pipeline_stages ps
   WHERE ps.stage_type = 'open'
     AND NOT EXISTS (SELECT 1 FROM seed_stages s WHERE s.slug = ps.slug);
  IF unclassified IS NOT NULL THEN
    RAISE NOTICE '037: stage_type defaulted to ''open'' for unrecognised stages: %', unclassified;
    RAISE NOTICE '037: an admin should confirm whether any of these are won/lost outcomes.';
  END IF;

  -- 4f-2. Positions contiguous 1..N per pipeline, ordered by whatever each row
  --       already had. Backfilled rows from an unknown slug land at 1000+, which
  --       orders correctly but leaves gaps; the DEFERRABLE unique constraint
  --       added below is on (pipeline_id, position), so tidying now means the
  --       first reorder is not the thing that discovers a duplicate.
  WITH renumbered AS (
    SELECT id, row_number() OVER (PARTITION BY pipeline_id ORDER BY position, slug) AS pos
      FROM pipeline_stages
  )
  UPDATE pipeline_stages ps SET position = r.pos
    FROM renumbered r WHERE r.id = ps.id AND ps.position <> r.pos;

  -- 4f-3. Report any pipeline with no won or no lost stage. Not an exception:
  --       this can only happen for a pipeline slug the catalogue does not know,
  --       where inventing an outcome stage would be exactly the fabrication this
  --       migration refuses elsewhere. Named so an admin can fix it, because
  --       until they do, deals in that pipeline cannot be closed.
  SELECT string_agg(p.slug, ', ') INTO orphaned
    FROM pipelines p
   WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages s
                      WHERE s.pipeline_id = p.id AND s.stage_type = 'won')
      OR NOT EXISTS (SELECT 1 FROM pipeline_stages s
                      WHERE s.pipeline_id = p.id AND s.stage_type = 'lost');
  IF orphaned IS NOT NULL THEN
    RAISE NOTICE '037: pipeline(s) with no won and/or lost stage: %', orphaned;
    RAISE NOTICE '037: deals in these cannot be closed until an admin adds an outcome stage.';
  END IF;

  -- 4g. Point every deal at its stage row.
  UPDATE deals d
     SET stage_id = ps.id
    FROM pipelines p, pipeline_stages ps
   WHERE d.stage_id IS NULL
     AND d.stage IS NOT NULL
     AND p.tenant_id = d.tenant_id AND p.slug = d.pipeline_id
     AND ps.tenant_id = d.tenant_id AND ps.pipeline_id = p.id AND ps.slug = d.stage;

  -- 4h. Deals that never had a stage at all.
  --
  --     Zero rows in this database (25/25 are populated), but the column has
  --     always permitted NULL and stage_id is about to become NOT NULL. Such a
  --     deal is given its pipeline's first open stage — which is exactly the
  --     value createDeal would have supplied — rather than blocking the
  --     migration for everyone. That is applying a documented default to a row
  --     that predates the constraint, not inventing a measurement; and every
  --     affected id is named so it is not a silent change.
  SELECT string_agg(d.id, ', ') INTO orphaned
    FROM deals d WHERE d.stage_id IS NULL;
  IF orphaned IS NOT NULL THEN
    UPDATE deals d
       SET stage_id = ps.id,
           stage    = ps.slug
      FROM pipelines p, LATERAL (
             SELECT s.* FROM pipeline_stages s
              WHERE s.pipeline_id = p.id AND s.tenant_id = p.tenant_id
                AND s.stage_type = 'open' AND s.archived_at IS NULL
              ORDER BY s.position ASC LIMIT 1
           ) ps
     WHERE d.stage_id IS NULL
       AND p.tenant_id = d.tenant_id AND p.slug = d.pipeline_id;
    RAISE NOTICE '037: assigned the first open stage to deals that had none: %', orphaned;
  END IF;
END $$;

-- ── 5. Constraints ──────────────────────────────────────────────────────────

ALTER TABLE pipelines       ALTER COLUMN slug SET NOT NULL;
ALTER TABLE pipeline_stages ALTER COLUMN slug SET NOT NULL;
ALTER TABLE pipeline_stages ALTER COLUMN stage_type SET NOT NULL;
ALTER TABLE pipeline_stages ALTER COLUMN stage_type SET DEFAULT 'open';

ALTER TABLE pipeline_stages
  ADD CONSTRAINT pipeline_stages_type_check CHECK (stage_type IN ('open','won','lost'));

-- Scoped by tenant_id as well as pipeline_id. pipeline_id alone would be
-- sufficient (a pipeline belongs to one tenant), but naming tenant_id makes the
-- constraint self-evidently tenant-safe when read on its own, which is the
-- convention the rest of this schema follows.
ALTER TABLE pipelines
  ADD CONSTRAINT pipelines_tenant_slug_key UNIQUE (tenant_id, slug);
ALTER TABLE pipeline_stages
  ADD CONSTRAINT pipeline_stages_tenant_slug_key UNIQUE (tenant_id, pipeline_id, slug);

-- DEFERRABLE is not optional. Reordering rewrites positions 1..N inside one
-- transaction, so intermediate states legitimately collide; without DEFERRABLE
-- every reorder fails on the first swap, and it looks like a bug in the endpoint
-- rather than in this constraint.
ALTER TABLE pipeline_stages
  ADD CONSTRAINT pipeline_stages_position_key UNIQUE (pipeline_id, position)
  DEFERRABLE INITIALLY DEFERRED;

CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals (tenant_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_pos
  ON pipeline_stages (tenant_id, pipeline_id, position);

-- ── 6. Assertions — verify the END STATE by counting, not by the absence of an
--       error. Any failure aborts the whole migration; each file runs in a
--       transaction, so a half-applied reconciliation is not possible.
DO $$
DECLARE
  n_orphan_deals INT;
  n_cross_tenant INT;
  n_bad_type     INT;
BEGIN
  SELECT count(*) INTO n_orphan_deals FROM deals WHERE stage_id IS NULL;
  IF n_orphan_deals > 0 THEN
    RAISE EXCEPTION '037 aborted: % deal(s) still point at no stage', n_orphan_deals;
  END IF;

  -- pipeline_stages.id is a GLOBAL primary key with no tenant component, so
  -- Postgres would happily accept a deal in workspace A pointing at a stage in
  -- workspace B: referential integrity satisfied, tenant isolation not. This is
  -- the check that the backfill itself did not create such a row.
  SELECT count(*) INTO n_cross_tenant
    FROM deals d JOIN pipeline_stages s ON s.id = d.stage_id
   WHERE s.tenant_id <> d.tenant_id;
  IF n_cross_tenant > 0 THEN
    RAISE EXCEPTION '037 aborted: % deal(s) reference a stage in another workspace', n_cross_tenant;
  END IF;

  -- The booleans and stage_type must agree while both exist, or Phase C's
  -- deletion of the booleans would silently change behaviour.
  SELECT count(*) INTO n_bad_type FROM pipeline_stages
   WHERE (stage_type = 'won')  <> is_won
      OR (stage_type = 'lost') <> is_lost;
  IF n_bad_type > 0 THEN
    RAISE EXCEPTION '037 aborted: % stage(s) disagree between stage_type and is_won/is_lost', n_bad_type;
  END IF;
END $$;

-- ── 7. NOT NULL, per the settled open question.
--
-- "Not in any stage" is not a real business state: a deal's stage IS its
-- position in the process, and a stage-less deal cannot render on the Kanban at
-- all. That is what distinguishes this from the still-open deals.value question,
-- where "amount not yet known" IS an ordinary state of an early deal.
--
-- It lands here rather than in Phase C deliberately. Deferring would mean the
-- whole 26-file Phase B cutover runs with an invariant every consumer assumes
-- but nothing enforces — precisely when a NULL gets in. Safe to apply now
-- because the controller dual-write ships in the same commit as this migration,
-- and migrations run on boot, so schema and code land together.
--
-- No schema DEFAULT: "first open stage" is per-pipeline and cannot be expressed
-- in DDL. The application supplies it explicitly.
ALTER TABLE deals ALTER COLUMN stage_id SET NOT NULL;
