-- 038: drop the legacy stage columns left behind by 037.
--
-- Phase C of the configurable-pipeline-stages work. 037 was additive on purpose
-- — it created pipeline_stages rows, backfilled deals.stage_id from the varchar
-- deals.stage, and left BOTH representations in place so the ~40-file frontend
-- and controller cutover could land incrementally with a working rollback at
-- every step. That cutover is done (C0/C1a/C1b), so the duplicates go.
--
-- Three columns die here:
--   deals.stage            -- a free varchar; the stage now IS pipeline_stages
--                             via deals.stage_id, and the API projects
--                             ps.slug AS stage so the response shape is unchanged.
--   pipeline_stages.is_won  \_ superseded by stage_type ('open'|'won'|'lost'),
--   pipeline_stages.is_lost /  which is NOT NULL with a CHECK, unlike two
--                              independent nullable booleans that could both be
--                              true or disagree with each other.
--
-- UNLIKE 037 THIS IS NOT REVERSIBLE BY RE-RUNNING ANYTHING. A dropped column
-- takes its data with it. The safety net is (a) the assertions below, which
-- abort the transaction before the DROP if the data does not support it, and
-- (b) a pg_dump taken immediately before applying it:
--   ~/bmi2-backups/bmi_crm_pre_migration038_2026-09-06.dump

-- ── 1. Assertions. Everything the dropped columns could still be telling us
--       must already be derivable from what survives, or this aborts.
DO $$
DECLARE
  n_null_stage_id  INT;
  n_unjoinable     INT;
  n_cross_tenant   INT;
  n_wrong_pipeline INT;
  n_drift          INT;
  n_bad_type       INT;
BEGIN
  -- stage_id is already NOT NULL (037 step 7), so this can only fail if that
  -- constraint were dropped between then and now. Cheap, and the whole
  -- migration rests on it: after the DROP, a deal with no stage_id has no stage
  -- at all, and there is no column left to recover it from.
  SELECT count(*) INTO n_null_stage_id FROM deals WHERE stage_id IS NULL;
  IF n_null_stage_id > 0 THEN
    RAISE EXCEPTION '038 aborted: % deal(s) have no stage_id', n_null_stage_id;
  END IF;

  -- The FK guarantees the row exists; it does not guarantee we can reach it,
  -- because every read in this codebase joins with the tenant predicate
  -- (AND ps.tenant_id = d.tenant_id). A row that satisfies the FK but not the
  -- join reads as a NULL stage to the API and would become unrecoverable here.
  SELECT count(*) INTO n_unjoinable
    FROM deals d LEFT JOIN pipeline_stages s
      ON s.id = d.stage_id AND s.tenant_id = d.tenant_id
   WHERE s.id IS NULL;
  IF n_unjoinable > 0 THEN
    RAISE EXCEPTION '038 aborted: % deal(s) do not resolve a stage through the tenant-scoped join', n_unjoinable;
  END IF;

  -- Same check without the tenant predicate, to name the cause precisely if the
  -- one above ever fires: FK satisfied, tenant isolation not.
  SELECT count(*) INTO n_cross_tenant
    FROM deals d JOIN pipeline_stages s ON s.id = d.stage_id
   WHERE s.tenant_id <> d.tenant_id;
  IF n_cross_tenant > 0 THEN
    RAISE EXCEPTION '038 aborted: % deal(s) reference a stage in another workspace', n_cross_tenant;
  END IF;

  -- deals.pipeline_id is a varchar SLUG with no foreign key (tracked as its own
  -- follow-up in CLAUDE.md, deliberately not fixed here). So the deal and its
  -- stage can disagree about which pipeline they are in, and nothing in the
  -- schema prevents it. That is what produced the live "Stage 1 of 6,
  -- Prospecting" mis-render on a Renewals deal during Phase B.
  SELECT count(*) INTO n_wrong_pipeline
    FROM deals d
    JOIN pipeline_stages s ON s.id = d.stage_id AND s.tenant_id = d.tenant_id
    JOIN pipelines p       ON p.id = s.pipeline_id
   WHERE d.pipeline_id IS NOT NULL AND d.pipeline_id <> p.slug;
  IF n_wrong_pipeline > 0 THEN
    RAISE EXCEPTION '038 aborted: % deal(s) sit in a stage belonging to a different pipeline', n_wrong_pipeline;
  END IF;

  -- THE GATE. While both representations exist the dual-write keeps them equal;
  -- one row where they differ means the column is carrying information the slug
  -- does not, and dropping it would silently change that deal's stage. The
  -- instruction was explicit that a mismatch is its own bug to resolve, never
  -- something to paper over by assuming the new column is right.
  SELECT count(*) INTO n_drift
    FROM deals d JOIN pipeline_stages s ON s.id = d.stage_id
   WHERE d.stage IS DISTINCT FROM s.slug;
  IF n_drift > 0 THEN
    RAISE EXCEPTION '038 aborted: % deal(s) drifted between deals.stage and pipeline_stages.slug', n_drift;
  END IF;

  -- And the booleans must still agree with stage_type, for the same reason:
  -- if they disagree, one of the two is the truth and this migration is about
  -- to delete a coin flip.
  SELECT count(*) INTO n_bad_type FROM pipeline_stages
   WHERE (stage_type = 'won')  <> COALESCE(is_won, false)
      OR (stage_type = 'lost') <> COALESCE(is_lost, false);
  IF n_bad_type > 0 THEN
    RAISE EXCEPTION '038 aborted: % stage(s) disagree between stage_type and is_won/is_lost', n_bad_type;
  END IF;
END $$;

-- ── 2. Replace the index that depends on the column before dropping it.
--
-- idx_deals_tenant_active is (tenant_id, stage) WHERE NOT archived AND NOT test
-- — the covering index for the main list query. DROP COLUMN would take it with
-- it and leave that query to a sequential scan, silently. The stage_id
-- equivalent is created first so there is no window without one.
CREATE INDEX IF NOT EXISTS idx_deals_tenant_active_stage_id
  ON deals (tenant_id, stage_id)
  WHERE is_archived = false AND is_test = false;

DROP INDEX IF EXISTS idx_deals_tenant_active;

-- ── 3. The drops.
ALTER TABLE deals            DROP COLUMN stage;
ALTER TABLE pipeline_stages  DROP COLUMN is_won;
ALTER TABLE pipeline_stages  DROP COLUMN is_lost;

-- ── 4. Prove the drop happened as intended rather than trusting the DDL to
--       have applied — same reason 037 asserts after its backfill.
DO $$
DECLARE n INT;
BEGIN
  SELECT count(*) INTO n FROM information_schema.columns
   WHERE table_schema = 'public'
     AND ((table_name = 'deals'           AND column_name = 'stage')
       OR (table_name = 'pipeline_stages' AND column_name IN ('is_won', 'is_lost')));
  IF n <> 0 THEN
    RAISE EXCEPTION '038 aborted: % legacy stage column(s) survived the drop', n;
  END IF;
END $$;
