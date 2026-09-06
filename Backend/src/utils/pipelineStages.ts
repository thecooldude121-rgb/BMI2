import { pool } from '../config/database';
import type { PoolClient } from 'pg';

/**
 * Resolving a deal's stage to a real, workspace-owned `pipeline_stages` row.
 *
 * PIPELINE_STAGES_DESIGN.md, phases A-C. Migration 037 made stages real rows and
 * added `deals.stage_id NOT NULL`; this module is what keeps that column
 * populated. It was written for the dual-write period, when `deals.stage` (text)
 * was still authoritative for reads. That period is over: migration 038 dropped
 * the text column, so stage_id is now the ONLY representation of a deal's stage
 * and this resolver is the only way one gets set.
 *
 * WHY A SHARED MODULE AND NOT A FUNCTION PER CONTROLLER. Four write paths set a
 * deal's stage — createDeal, updateDeal, the stage-transition endpoint and the
 * bulk stage action — and `stage_id` is NOT NULL, so any one of them that forgot
 * to resolve it would turn an ordinary write into a raw 23502 masked as a bare
 * 500. That is the failure this project has already paid for with
 * `deals.value`. One resolver, called by all four.
 *
 * TENANT SCOPING IS NOT OPTIONAL HERE. `pipeline_stages.id` is a global primary
 * key with no tenant component, so Postgres would accept a deal in workspace A
 * pointing at a stage in workspace B: referential integrity satisfied, tenant
 * isolation not. Every query in this file filters on `tenant_id`, and the
 * resolver takes the tenant id as a required argument rather than an optional
 * one so it cannot be omitted by accident.
 */

/** The columns any caller here needs. Never `SELECT *` — position and type matter. */
export interface StageRow {
  id: string;
  slug: string;
  name: string;
  probability: number | null;
  stage_type: 'open' | 'won' | 'lost';
  position: number;
  archived_at: string | null;
  pipeline_id: string;
}

const STAGE_COLUMNS =
  's.id, s.slug, s.name, s.probability, s.stage_type, s.position, s.archived_at, s.pipeline_id';

type Queryable = Pick<PoolClient, 'query'>;

/** Use the caller's transaction when it has one, so reads see its own writes. */
const q = (client?: Queryable): Queryable => client ?? pool;

/**
 * The stage a deal names, by pipeline slug and stage slug.
 *
 * Returns null when the pair names nothing in this workspace — which is the
 * same answer for "no such stage" and "that stage belongs to someone else", by
 * design. Callers turn null into a 400 that names the field and never discloses
 * that the row exists elsewhere, exactly as the login and FK-ownership messages
 * do.
 */
export async function findStage(
  tenantId: string,
  pipelineSlug: string,
  stageSlug: string,
  client?: Queryable,
): Promise<StageRow | null> {
  const result = await q(client).query(
    `SELECT ${STAGE_COLUMNS}
       FROM pipeline_stages s
       JOIN pipelines p
         ON p.id = s.pipeline_id
        -- Both halves of the project's FK rule: the parent is matched on tenant
        -- as well as id, so a mismatched pair cannot be read through the join.
        AND p.tenant_id = s.tenant_id
      WHERE s.tenant_id = $1 AND p.slug = $2 AND s.slug = $3`,
    [tenantId, pipelineSlug, stageSlug],
  );
  return (result.rows[0] as StageRow) ?? null;
}

/**
 * The stage a new deal starts in when the caller did not name one: the first
 * OPEN, non-archived stage of its own pipeline.
 *
 * THIS FIXES A LATENT BUG, not just a NOT NULL constraint. `createDeal`
 * defaulted `pipeline_id || 'new-business'` and `stage || 'prospecting'`
 * INDEPENDENTLY, so creating a deal with `pipeline_id: 'renewals'` and no stage
 * produced a renewals deal sitting in `prospecting` — a stage that does not
 * exist in that pipeline at all. Unreachable through the Add Deal form, which
 * always sends a stage, but reachable through the API. Resolving the default
 * from the deal's own pipeline makes the inconsistency unrepresentable.
 *
 * A retired stage is never chosen: `archived_at IS NULL`. Retiring the entry
 * stage should stop new deals landing there, which is the whole point of
 * retirement.
 */
export async function findDefaultStage(
  tenantId: string,
  pipelineSlug: string,
  client?: Queryable,
): Promise<StageRow | null> {
  const result = await q(client).query(
    `SELECT ${STAGE_COLUMNS}
       FROM pipeline_stages s
       JOIN pipelines p ON p.id = s.pipeline_id AND p.tenant_id = s.tenant_id
      WHERE s.tenant_id = $1 AND p.slug = $2
        AND s.stage_type = 'open' AND s.archived_at IS NULL
      ORDER BY s.position ASC
      LIMIT 1`,
    [tenantId, pipelineSlug],
  );
  return (result.rows[0] as StageRow) ?? null;
}

/** The message a rejected stage produces. Names the field; discloses nothing else. */
export const STAGE_NOT_IN_WORKSPACE =
  'stage does not name a stage in this workspace';

export const PIPELINE_HAS_NO_OPEN_STAGE =
  'That pipeline has no open stage to start a deal in';

export interface ResolvedStage {
  /** Present when resolution succeeded. */
  stage?: StageRow;
  /** Present when it failed; the caller returns it as a clean 400. */
  error?: string;
}

/**
 * What every write path calls: resolve an optional stage slug against a
 * pipeline, falling back to that pipeline's entry stage.
 *
 * Returns a message rather than throwing, because all four callers turn it into
 * the same 400 and a thrown error would reach `errorHandler` and be masked as a
 * 500 — the exact shape this project keeps unmasking.
 */
export async function resolveStageForWrite(
  tenantId: string,
  pipelineSlug: string,
  stageSlug: string | null | undefined,
  client?: Queryable,
): Promise<ResolvedStage> {
  const wanted = typeof stageSlug === 'string' ? stageSlug.trim() : '';

  if (wanted) {
    const stage = await findStage(tenantId, pipelineSlug, wanted, client);
    return stage ? { stage } : { error: STAGE_NOT_IN_WORKSPACE };
  }

  const fallback = await findDefaultStage(tenantId, pipelineSlug, client);
  return fallback ? { stage: fallback } : { error: PIPELINE_HAS_NO_OPEN_STAGE };
}


/**
 * The pipeline a brand-new workspace starts with.
 *
 * WHY THIS EXISTS AT ALL — found by the test suite, not by the design.
 * Migration 037 made `deals.stage_id` NOT NULL and resolves it from the
 * workspace's own configuration. A workspace with no pipeline therefore has no
 * stage to resolve, and EVERY deal creation in it fails with a 400. The
 * migration backfills existing workspaces from their existing deals, but a
 * workspace created afterwards has no deals to backfill from — so it would be
 * born unable to hold a deal. Thirty round-trip tests failed on exactly that,
 * which is how it surfaced.
 *
 * Only the default pipeline is provisioned, not all three the catalogue knows.
 * `renewals` and `partnerships` exist in this database because live deals
 * already referenced them, which is a fact about migrated data, not a claim that
 * every workspace wants three pipelines. A new workspace gets one and adds more.
 *
 * MUST BE CALLED WHEREVER A WORKSPACE IS CREATED. Today that is only the test
 * helpers — CLAUDE.md defers real workspace creation to the Settings module —
 * so when that is built, this call goes with it or the new workspace cannot
 * create a deal.
 */
export const DEFAULT_PIPELINE_TEMPLATE = {
  slug: 'new-business',
  name: 'New Business',
  description: 'Standard pipeline for new customer acquisition',
  stages: [
    { slug: 'prospecting', name: 'Prospecting', probability: 20,  color: '#6B7280', stage_type: 'open' },
    { slug: 'qualified',   name: 'Qualified',   probability: 40,  color: '#3B82F6', stage_type: 'open' },
    { slug: 'proposal',    name: 'Proposal',    probability: 60,  color: '#F59E0B', stage_type: 'open' },
    { slug: 'negotiation', name: 'Negotiation', probability: 80,  color: '#8B5CF6', stage_type: 'open' },
    { slug: 'closed-won',  name: 'Closed Won',  probability: 100, color: '#10B981', stage_type: 'won'  },
    { slug: 'closed-lost', name: 'Closed Lost', probability: 0,   color: '#EF4444', stage_type: 'lost' },
  ],
} as const;

/**
 * Give a workspace its starting pipeline. Idempotent: a workspace that already
 * has any pipeline is left exactly as it is, so this can be called defensively
 * without a second one appearing.
 */
export async function provisionDefaultPipeline(
  tenantId: string,
  client?: Queryable,
): Promise<void> {
  const db = q(client);

  const existing = await db.query(
    'SELECT 1 FROM pipelines WHERE tenant_id = $1 LIMIT 1',
    [tenantId],
  );
  if (existing.rowCount) return;

  const pipeline = await db.query(
    `INSERT INTO pipelines (name, description, slug, is_default, is_active, tenant_id)
     VALUES ($1, $2, $3, true, true, $4)
     RETURNING id`,
    [
      DEFAULT_PIPELINE_TEMPLATE.name,
      DEFAULT_PIPELINE_TEMPLATE.description,
      DEFAULT_PIPELINE_TEMPLATE.slug,
      tenantId,
    ],
  );
  const pipelineId = pipeline.rows[0].id as string;

  // One statement rather than six round trips. `position` is 1..N by catalogue
  // order so the board renders in the intended sequence.
  //
  // is_won / is_lost were written here too, as their own parameters rather than
  // derived in SQL — reusing the stage_type placeholder in a boolean comparison
  // made Postgres deduce "inconsistent types for parameter $5". Migration 038
  // dropped both columns, so the workaround goes with them.
  const stages = DEFAULT_PIPELINE_TEMPLATE.stages;
  const COLS = 8;
  const rows = stages
    .map((_, n) =>
      '(' + Array.from({ length: COLS }, (_, c) => `$${n * COLS + c + 1}`).join(',') + ')')
    .join(', ');

  await db.query(
    `INSERT INTO pipeline_stages
       (pipeline_id, tenant_id, slug, name, stage_type, probability, color, position)
     VALUES ${rows}`,
    stages.flatMap((st, n) => [
      pipelineId, tenantId, st.slug, st.name, st.stage_type, st.probability, st.color, n + 1,
    ]),
  );
}
