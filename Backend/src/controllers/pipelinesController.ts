import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { resolveActorName } from '../utils/actorName';

/**
 * Pipelines and their stages.
 *
 * PHASE A UPDATE (migration 037): every stage now carries `slug` (the stable
 * machine key that survives a rename), `stage_type` ('open' | 'won' | 'lost',
 * replacing the two booleans that could contradict each other) and
 * `archived_at` (retirement). is_won / is_lost are still selected because the
 * frontend PipelineStage interface still reads them; they go in Phase C.
 *
 * Frontend/src/utils/dealsApi.ts:27 has called GET /api/v1/pipelines since it
 * was written, and there was no such route — every call 404'd, and the function
 * swallowed it (`if (!res.ok) return []`), so the UI silently rendered an empty
 * pipeline list. Meanwhile `pipelines` (1 row) and `pipeline_stages` (6 rows,
 * properly ordered with probabilities) sat in the database unreachable.
 *
 * Stages are nested under their pipeline in one round trip, since no caller
 * wants a pipeline without them.
 */
export const getPipelines = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { include_inactive } = req.query;

    let pipelineQuery = 'SELECT * FROM pipelines WHERE tenant_id = $1';
    if (include_inactive !== 'true') pipelineQuery += ' AND is_active = true';
    // Retired stages are hidden by default: a stage picker must not offer one,
    // and a board rendering them as empty columns would suggest they are still
    // in use. `include_archived=true` is for the admin screen that manages them,
    // and for a board that wants to show a retired column still holding deals.
    const archivedFilter = req.query.include_archived === 'true' ? '' : ' AND s.archived_at IS NULL';
    pipelineQuery += ' ORDER BY is_default DESC, name ASC';

    const [pipelines, stages] = await Promise.all([
      pool.query(pipelineQuery, [tenantId]),
      pool.query(
        `SELECT id, pipeline_id, slug, name, probability, position, color,
                stage_type, archived_at, is_won, is_lost
         FROM pipeline_stages s
         WHERE s.tenant_id = $1${archivedFilter}
         ORDER BY s.pipeline_id, s.position ASC`,
        [tenantId],
      ),
    ]);

    const stagesByPipeline = new Map<string, any[]>();
    for (const s of stages.rows) {
      const list = stagesByPipeline.get(s.pipeline_id) ?? [];
      list.push(s);
      stagesByPipeline.set(s.pipeline_id, list);
    }

    const data = pipelines.rows.map(p => ({
      ...p,
      stages: stagesByPipeline.get(p.id) ?? [],
    }));

    res.json({ success: true, data, count: data.length });
  } catch (error) { next(error); }
};

export const getPipelineById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const [pipeline, stages] = await Promise.all([
      pool.query('SELECT * FROM pipelines WHERE id = $1 AND tenant_id = $2', [req.params.id, tenantId]),
      pool.query(
        `SELECT id, pipeline_id, slug, name, probability, position, color,
                stage_type, archived_at, is_won, is_lost
         FROM pipeline_stages
         WHERE pipeline_id = $1 AND tenant_id = $2
         ORDER BY position ASC`,
        [req.params.id, tenantId],
      ),
    ]);
    if (!pipeline.rows[0]) {
      res.status(404).json({ success: false, message: 'Pipeline not found' });
      return;
    }
    res.json({ success: true, data: { ...pipeline.rows[0], stages: stages.rows } });
  } catch (error) { next(error); }
};

/** GET /api/v1/pipelines/:id/stages — stages alone, for stage pickers. */
export const getPipelineStages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      `SELECT id, pipeline_id, slug, name, probability, position, color,
                stage_type, archived_at, is_won, is_lost
       FROM pipeline_stages
       WHERE pipeline_id = $1 AND tenant_id = $2
       ORDER BY position ASC`,
      [req.params.id, tenantId],
    );
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// STAGE CONFIGURATION — create, rename, reorder, retire, delete.
//
// PIPELINE_STAGES_DESIGN.md §4 and §5. Phase A made stages real rows; Phase B
// let the UI read them. This is what finally makes them CONFIGURABLE, which is
// the feature as originally scoped — until now a workspace's stages were
// per-tenant in the schema and unchangeable in practice.
//
// EVERY WRITE HERE IS ADMIN-ONLY (Q5, settled). Reads stay open to any
// authenticated user because the Kanban needs the stage list to render at all,
// and gating that would break the board for sales. Widening writes to `manager`
// is a one-line change in routes/pipelines.ts if that is ever wanted.
// ─────────────────────────────────────────────────────────────────────────────

import { PoolClient } from 'pg';

/**
 * THE FIXED PALETTE (design open question 4, settled as part of this screen).
 *
 * A free colour picker cannot coexist with the design system's rule that "no
 * active stage uses green or red — those are reserved for terminal outcomes"
 * (config/stageColors.ts). An admin who picks green for an open stage does not
 * see a rule being broken; they see a colour they liked. So the server accepts
 * only these, and the UI offers only these.
 *
 * Greens and reds are present but are NOT offered for open stages — the check
 * below enforces the rule rather than trusting the client to.
 */
export const STAGE_PALETTE = {
  slate:   '#6B7280',
  sky:     '#3B82F6',
  amber:   '#F59E0B',
  violet:  '#8B5CF6',
  indigo:  '#6366F1',
  emerald: '#10B981',
  red:     '#EF4444',
} as const;

const OUTCOME_ONLY_COLORS = new Set<string>([STAGE_PALETTE.emerald, STAGE_PALETTE.red]);
const PALETTE_VALUES = new Set<string>(Object.values(STAGE_PALETTE));

const STAGE_TYPES = ['open', 'won', 'lost'] as const;
type StageType = (typeof STAGE_TYPES)[number];

/** Lowercase, non-alphanumerics to single hyphens, trimmed. Matches migration 037. */
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Serialise stage-configuration writes for one PIPELINE.
 *
 * Keyed on the pipeline, NOT on the stage row — this is the mutual-deactivation
 * race from commit 2205494 in a different costume. Two admins each retiring a
 * DIFFERENT won stage both read "there is another won stage", both proceed, and
 * the pipeline ends with none. Locking the target row cannot help, because the
 * two transactions touch different rows. `_xact` releases on commit or rollback.
 */
async function lockPipelineConfig(db: Pick<PoolClient, 'query'>, pipelineId: string): Promise<void> {
  await db.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', ['pipeline_stage_config', pipelineId]);
}

/** The pipeline, if it belongs to this workspace. Null otherwise — never 403 vs 404. */
async function ownedPipeline(db: Pick<PoolClient, 'query'>, id: string, tenantId: string) {
  const r = await db.query('SELECT id, name, slug FROM pipelines WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return r.rows[0] ?? null;
}

/**
 * Validate a colour against the palette, and against the outcome rule.
 * Returns a message or null.
 */
function colorProblem(color: unknown, stageType: StageType): string | null {
  if (color === undefined || color === null) return null;
  const hex = String(color).toUpperCase();
  if (!PALETTE_VALUES.has(hex)) {
    return 'color must be one of the palette colours';
  }
  if (stageType === 'open' && OUTCOME_ONLY_COLORS.has(hex)) {
    return 'green and red are reserved for won and lost stages';
  }
  return null;
}

/**
 * The invariant every destructive path checks: a pipeline keeps at least one
 * open, one won and one lost stage.
 *
 * Forecasting, win rate and the board's terminal columns all assume a won and a
 * lost stage exist; a pipeline without one produces a dashboard that is WRONG
 * rather than empty. Archived stages do not count — a retired won stage is not
 * available to move a deal into, so it cannot be the pipeline's only one.
 *
 * `excludeId` is the row about to be removed or retyped, so the count reflects
 * the state AFTER the change rather than before it.
 */
async function missingOutcomeAfter(
  db: Pick<PoolClient, 'query'>,
  pipelineId: string,
  excludeId: string | null,
  becoming?: StageType,
): Promise<string | null> {
  const r = await db.query(
    `SELECT stage_type, count(*)::int AS n
       FROM pipeline_stages
      WHERE pipeline_id = $1 AND archived_at IS NULL AND ($2::uuid IS NULL OR id <> $2)
      GROUP BY stage_type`,
    [pipelineId, excludeId],
  );
  const counts: Record<string, number> = { open: 0, won: 0, lost: 0 };
  for (const row of r.rows) counts[row.stage_type] = row.n;
  if (becoming) counts[becoming] += 1;

  for (const t of STAGE_TYPES) {
    if (counts[t] === 0) {
      return `A pipeline must keep at least one ${t} stage`;
    }
  }
  return null;
}

/** POST /api/v1/pipelines/:id/stages */
export const createStage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);
    const { name, stage_type, probability, color, position } = req.body ?? {};

    const trimmed = String(name ?? '').trim();
    if (!trimmed) { res.status(400).json({ success: false, message: 'name is required' }); return; }
    if (trimmed.length > 100) {
      res.status(400).json({ success: false, message: 'name must be 100 characters or fewer' });
      return;
    }
    const type: StageType = STAGE_TYPES.includes(stage_type) ? stage_type : 'open';
    if (stage_type !== undefined && !STAGE_TYPES.includes(stage_type)) {
      res.status(400).json({ success: false, message: "stage_type must be 'open', 'won' or 'lost'" });
      return;
    }
    if (probability !== undefined && probability !== null) {
      const p = Number(probability);
      if (!Number.isInteger(p) || p < 0 || p > 100) {
        res.status(400).json({ success: false, message: 'probability must be a whole number from 0 to 100' });
        return;
      }
    }
    const badColor = colorProblem(color, type);
    if (badColor) { res.status(400).json({ success: false, message: badColor }); return; }

    // The slug is derived once and never changes again, so a name that slugifies
    // to nothing ("!!!") has to be refused here rather than producing a stage
    // with an empty key.
    const slug = slugify(trimmed);
    if (!slug) {
      res.status(400).json({ success: false, message: 'name must contain at least one letter or number' });
      return;
    }

    await client.query('BEGIN');
    const pipeline = await ownedPipeline(client, req.params.id, tenantId);
    if (!pipeline) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Pipeline not found' });
      return;
    }
    await lockPipelineConfig(client, pipeline.id);

    const dupe = await client.query(
      'SELECT 1 FROM pipeline_stages WHERE tenant_id = $1 AND pipeline_id = $2 AND slug = $3',
      [tenantId, pipeline.id, slug],
    );
    if (dupe.rowCount) {
      await client.query('ROLLBACK');
      // 409, not 400: the request is well-formed and the name is legal; it
      // conflicts with the pipeline's current state.
      res.status(409).json({ success: false, message: `This pipeline already has a stage called "${trimmed}"` });
      return;
    }

    // Append by default. An explicit position inserts, shifting the rest down —
    // done in one UPDATE under the deferrable unique constraint so intermediate
    // collisions are legal until commit.
    const maxPos = await client.query(
      'SELECT COALESCE(MAX(position), 0)::int AS m FROM pipeline_stages WHERE pipeline_id = $1',
      [pipeline.id],
    );
    let pos = maxPos.rows[0].m + 1;
    if (position !== undefined && position !== null) {
      const requested = Number(position);
      if (!Number.isInteger(requested) || requested < 1) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, message: 'position must be a whole number of 1 or more' });
        return;
      }
      pos = Math.min(requested, maxPos.rows[0].m + 1);
      await client.query(
        'UPDATE pipeline_stages SET position = position + 1 WHERE pipeline_id = $1 AND position >= $2',
        [pipeline.id, pos],
      );
    }

    const created = await client.query(
      `INSERT INTO pipeline_stages
         (pipeline_id, tenant_id, slug, name, stage_type, probability, color, position, is_won, is_lost)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, pipeline_id, slug, name, probability, position, color, stage_type, archived_at`,
      [
        pipeline.id, tenantId, slug, trimmed, type,
        probability === undefined || probability === null ? null : Number(probability),
        color ? String(color).toUpperCase() : STAGE_PALETTE.slate,
        pos, type === 'won', type === 'lost',
      ],
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: created.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally { client.release(); }
};

/**
 * PATCH /api/v1/pipelines/:id/stages/:stageId
 *
 * Renames, recolours, re-probabilities, retypes, retires and un-retires.
 *
 * THE SLUG IS NEVER WRITABLE. It is the stable machine key: `deals.stage` holds
 * it, `deal_stage_history` records it, saved views filter on it and the API
 * takes it. Letting a rename change it would silently empty every saved view
 * that referenced the stage and orphan every history row — with no error
 * anywhere, which is the class of failure this project keeps finding late.
 * Renaming changes `name` only, and everything keeps working.
 */
export const updateStage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);
    const { name, stage_type, probability, color, archived } = req.body ?? {};

    if ('slug' in (req.body ?? {})) {
      res.status(400).json({
        success: false,
        message: 'A stage slug cannot be changed. Rename the stage instead — its key stays stable so saved views and history keep working.',
      });
      return;
    }

    await client.query('BEGIN');
    const pipeline = await ownedPipeline(client, req.params.id, tenantId);
    if (!pipeline) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Pipeline not found' });
      return;
    }
    await lockPipelineConfig(client, pipeline.id);

    const existing = await client.query(
      `SELECT id, slug, name, stage_type, archived_at FROM pipeline_stages
        WHERE id = $1 AND pipeline_id = $2 AND tenant_id = $3`,
      [req.params.stageId, pipeline.id, tenantId],
    );
    if (!existing.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Stage not found' });
      return;
    }
    const before = existing.rows[0];
    const nextType: StageType = stage_type !== undefined ? stage_type : before.stage_type;

    if (stage_type !== undefined && !STAGE_TYPES.includes(stage_type)) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: "stage_type must be 'open', 'won' or 'lost'" });
      return;
    }
    if (name !== undefined && !String(name).trim()) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'name cannot be blank' });
      return;
    }
    if (name !== undefined && String(name).trim().length > 100) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'name must be 100 characters or fewer' });
      return;
    }
    if (probability !== undefined && probability !== null) {
      const p = Number(probability);
      if (!Number.isInteger(p) || p < 0 || p > 100) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, message: 'probability must be a whole number from 0 to 100' });
        return;
      }
    }
    const badColor = colorProblem(color, nextType);
    if (badColor) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: badColor });
      return;
    }

    // RETIRING or RETYPING can strip a pipeline of its last outcome stage. Both
    // are checked against the state the change would produce, under the lock.
    const retiring = archived === true && !before.archived_at;
    const retyping = stage_type !== undefined && stage_type !== before.stage_type;
    if (retiring || retyping) {
      const problem = await missingOutcomeAfter(
        client, pipeline.id, before.id, retiring ? undefined : nextType,
      );
      if (problem) {
        await client.query('ROLLBACK');
        res.status(409).json({ success: false, message: problem });
        return;
      }
    }

    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (name !== undefined)        { sets.push(`name = $${i++}`);        params.push(String(name).trim()); }
    if (probability !== undefined) { sets.push(`probability = $${i++}`); params.push(probability === null ? null : Number(probability)); }
    if (color !== undefined)       { sets.push(`color = $${i++}`);       params.push(String(color).toUpperCase()); }
    if (stage_type !== undefined) {
      sets.push(`stage_type = $${i++}`); params.push(stage_type);
      // The booleans are still selected by this controller and read by the
      // frontend's PipelineStage interface; Phase C drops them. Kept in step
      // here so the two never disagree while both exist.
      sets.push(`is_won = $${i++}`);  params.push(stage_type === 'won');
      sets.push(`is_lost = $${i++}`); params.push(stage_type === 'lost');
    }
    if (archived !== undefined) {
      sets.push(`archived_at = ${archived ? 'NOW()' : 'NULL'}`);
    }
    if (!sets.length) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'No fields to update' });
      return;
    }
    params.push(before.id, tenantId);

    const updated = await client.query(
      `UPDATE pipeline_stages SET ${sets.join(', ')}
        WHERE id = $${i++} AND tenant_id = $${i}
        RETURNING id, pipeline_id, slug, name, probability, position, color, stage_type, archived_at`,
      params,
    );

    await client.query('COMMIT');
    res.json({ success: true, data: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally { client.release(); }
};

/**
 * PUT /api/v1/pipelines/:id/stages/order — body { stage_ids: [...] }
 *
 * TAKES THE COMPLETE ORDER, and validates it is exactly this pipeline's set.
 *
 * Per-stage position patches cannot express a reorder atomically: two concurrent
 * ones interleave into an order neither admin asked for, and a dropped request
 * leaves a gap. A PARTIAL array is refused rather than accepted, because
 * accepting one would silently drop the stages it omitted to the end.
 *
 * The unique constraint on (pipeline_id, position) is DEFERRABLE INITIALLY
 * DEFERRED (migration 037) precisely so the intermediate states of this rewrite
 * are legal. Without that every reorder fails on the first swap.
 */
export const reorderStages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);
    const { stage_ids } = req.body ?? {};

    if (!Array.isArray(stage_ids) || stage_ids.some(x => typeof x !== 'string')) {
      res.status(400).json({ success: false, message: 'stage_ids must be an array of stage ids' });
      return;
    }

    await client.query('BEGIN');
    const pipeline = await ownedPipeline(client, req.params.id, tenantId);
    if (!pipeline) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Pipeline not found' });
      return;
    }
    await lockPipelineConfig(client, pipeline.id);

    const current = await client.query(
      'SELECT id FROM pipeline_stages WHERE pipeline_id = $1 AND tenant_id = $2',
      [pipeline.id, tenantId],
    );
    const owned = new Set<string>(current.rows.map(r => r.id));
    const given = new Set<string>(stage_ids);

    if (given.size !== stage_ids.length) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'stage_ids contains the same stage more than once' });
      return;
    }
    if (given.size !== owned.size || [...given].some(id => !owned.has(id))) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: `stage_ids must list every stage in this pipeline exactly once (${owned.size} expected, ${given.size} given)`,
      });
      return;
    }

    for (let n = 0; n < stage_ids.length; n++) {
      await client.query(
        'UPDATE pipeline_stages SET position = $1 WHERE id = $2 AND pipeline_id = $3 AND tenant_id = $4',
        [n + 1, stage_ids[n], pipeline.id, tenantId],
      );
    }

    const after = await client.query(
      `SELECT id, pipeline_id, slug, name, probability, position, color, stage_type, archived_at
         FROM pipeline_stages WHERE pipeline_id = $1 AND tenant_id = $2 ORDER BY position ASC`,
      [pipeline.id, tenantId],
    );
    await client.query('COMMIT');
    res.json({ success: true, data: after.rows, count: after.rowCount });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally { client.release(); }
};

/**
 * DELETE /api/v1/pipelines/:id/stages/:stageId[?reassign_to=<stage id>]
 *
 * THE DECISION FROM §4, and the reason RETIRE is the expected path rather than
 * this one. Retiring keeps the deals where they are and stops new ones arriving;
 * nothing is orphaned and no reference is nulled. Deleting is for a stage
 * created by mistake, and it BLOCKS when deals are still in it:
 *
 *   - Deals present, no reassign_to  -> 409 naming the count.
 *   - `?reassign_to=<id>`            -> moves them in ONE transaction, writing a
 *                                       deal_stage_history row each, then deletes.
 *
 * WHY 409 AND NOT THE SETTLED 400. CLAUDE.md fixes 400 for "this FK does not
 * name a row in your workspace" and says not to re-litigate it. This is a
 * different situation and does not touch that rule: the id IS valid and visible
 * to the caller, and the request is well-formed. What fails is a conflict with
 * current state — the textbook 409. `reassign_to` naming a stage in another
 * workspace still gets the settled 400 shape.
 *
 * deal_stage_history NEVER blocks a delete: it holds text snapshots with no FK
 * (design §2.4), so the audit trail survives the stage it refers to. An audit
 * row records what was true then.
 */
export const deleteStage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);
    const reassignTo = typeof req.query.reassign_to === 'string' ? req.query.reassign_to : null;

    await client.query('BEGIN');
    const pipeline = await ownedPipeline(client, req.params.id, tenantId);
    if (!pipeline) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Pipeline not found' });
      return;
    }
    await lockPipelineConfig(client, pipeline.id);

    const target = await client.query(
      `SELECT id, slug, name, stage_type FROM pipeline_stages
        WHERE id = $1 AND pipeline_id = $2 AND tenant_id = $3`,
      [req.params.stageId, pipeline.id, tenantId],
    );
    if (!target.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Stage not found' });
      return;
    }
    const stage = target.rows[0];

    const problem = await missingOutcomeAfter(client, pipeline.id, stage.id);
    if (problem) {
      await client.query('ROLLBACK');
      res.status(409).json({ success: false, message: problem });
      return;
    }

    const counted = await client.query(
      'SELECT count(*)::int AS n FROM deals WHERE stage_id = $1 AND tenant_id = $2',
      [stage.id, tenantId],
    );
    const dealCount = counted.rows[0].n;

    if (dealCount > 0) {
      if (!reassignTo) {
        await client.query('ROLLBACK');
        res.status(409).json({
          success: false,
          message: `${dealCount} deal${dealCount === 1 ? ' is' : 's are'} still in "${stage.name}". Move ${dealCount === 1 ? 'it' : 'them'} to another stage first, or retire this stage instead — retiring keeps the deals where they are.`,
          deals_in_stage: dealCount,
        });
        return;
      }

      const dest = await client.query(
        `SELECT id, slug, name, probability, archived_at FROM pipeline_stages
          WHERE id = $1 AND pipeline_id = $2 AND tenant_id = $3`,
        [reassignTo, pipeline.id, tenantId],
      );
      if (!dest.rows[0]) {
        await client.query('ROLLBACK');
        // The settled 400 shape: names the field, discloses nothing about
        // whether the row exists elsewhere.
        res.status(400).json({ success: false, message: 'reassign_to does not name a stage in this pipeline' });
        return;
      }
      if (dest.rows[0].id === stage.id) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, message: 'reassign_to cannot be the stage being deleted' });
        return;
      }
      if (dest.rows[0].archived_at) {
        await client.query('ROLLBACK');
        res.status(409).json({ success: false, message: `"${dest.rows[0].name}" is retired, so deals cannot be moved into it` });
        return;
      }

      const moving = await client.query(
        'SELECT id, stage, probability FROM deals WHERE stage_id = $1 AND tenant_id = $2 FOR UPDATE',
        [stage.id, tenantId],
      );
      const changedBy = resolveActorName(req);
      for (const d of moving.rows) {
        const nextProbability = dest.rows[0].probability ?? d.probability ?? null;
        await client.query(
          `UPDATE deals SET stage = $1, stage_id = $2, probability = $3, updated_at = NOW()
            WHERE id = $4 AND tenant_id = $5`,
          [dest.rows[0].slug, dest.rows[0].id, nextProbability, d.id, tenantId],
        );
        // Every moved deal gets an audit row. A stage deletion that silently
        // relocated deals would be indistinguishable from data loss when someone
        // later asks why a deal is where it is.
        await client.query(
          `INSERT INTO deal_stage_history
             (deal_id, from_stage, to_stage, probability, probability_override,
              reason_code, changed_by, tenant_id)
           VALUES ($1,$2,$3,$4,false,'stage-deleted',$5,$6)`,
          [d.id, d.stage, dest.rows[0].slug, nextProbability, changedBy, tenantId],
        );
      }
    }

    await client.query(
      'DELETE FROM pipeline_stages WHERE id = $1 AND pipeline_id = $2 AND tenant_id = $3',
      [stage.id, pipeline.id, tenantId],
    );
    // Close the gap the delete leaves, so positions stay 1..N.
    const remaining = await client.query(
      'SELECT id FROM pipeline_stages WHERE pipeline_id = $1 ORDER BY position ASC',
      [pipeline.id],
    );
    for (let n = 0; n < remaining.rows.length; n++) {
      await client.query('UPDATE pipeline_stages SET position = $1 WHERE id = $2', [n + 1, remaining.rows[n].id]);
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      message: dealCount > 0
        ? `"${stage.name}" deleted; ${dealCount} deal${dealCount === 1 ? '' : 's'} moved.`
        : `"${stage.name}" deleted.`,
      deals_reassigned: dealCount,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally { client.release(); }
};

/** GET /api/v1/pipelines/palette — the colours an admin may choose from. */
export const getStagePalette = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: Object.entries(STAGE_PALETTE).map(([name, hex]) => ({
      name, hex, outcome_only: OUTCOME_ONLY_COLORS.has(hex),
    })),
  });
};
