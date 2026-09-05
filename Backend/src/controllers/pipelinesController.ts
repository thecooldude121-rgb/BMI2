import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

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
