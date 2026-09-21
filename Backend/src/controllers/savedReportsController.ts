import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { foreignIdsInTenant } from '../utils/tenantScope';
import { buildReportQuery, ReportDefinitionError } from '../services/reports/queryBuilder';
import { REPORT_MODULES, REPORT_FIELDS } from '../services/reports/registry';
import {
  canViewPredicate, canEditPredicate, isOwnerPredicate,
  abilitiesFor, GRANT_LEVELS, type GrantLevel,
} from '../services/reports/access';
import { runReport, ReportTimeout } from '../services/reports/runner';

/**
 * SAVED REPORTS — definitions, and who may see them. P3 Phase 2.
 *
 * ─── VALIDATION IS COMPILATION ────────────────────────────────────────────
 *
 * A definition is valid if and only if the Phase 0 builder can turn it into
 * SQL. `buildReportQuery` is therefore the validator, and there is no second
 * set of rules here that could disagree with it — a definition that saves is a
 * definition that runs. The SQL is thrown away; only the fact that it compiled
 * matters.
 *
 * ─── ENFORCEMENT IS QUERY-LEVEL ───────────────────────────────────────────
 *
 * Every statement below carries its permission predicate in the WHERE clause,
 * so an unauthorised request matches zero rows rather than relying on a check a
 * future endpoint might forget. Zero rows becomes 404, never 403: the API does
 * not disclose that a report exists in a workspace you cannot see it in.
 */

const SELECT_COLUMNS = `
  r.id, r.name, r.description, r.category, r.definition,
  r.owner_id, r.created_at, r.updated_at,
  NULLIF(btrim(COALESCE(o.first_name,'') || ' ' || COALESCE(o.last_name,'')), '') AS owner_name,
  (SELECT g.level FROM saved_report_grants g
    WHERE g.report_id = r.id AND g.tenant_id = r.tenant_id AND g.user_id = $2) AS my_grant
`;

/**
 * Tenant-matched on BOTH sides. `users.id` is a global primary key, so without
 * `o.tenant_id = r.tenant_id` a report carrying another workspace's owner_id
 * would render that person's name — the unscoped-JOIN half of the leak this
 * project already paid for.
 */
const FROM_JOINS = `
  FROM saved_reports r
  LEFT JOIN users o ON o.id = r.owner_id AND o.tenant_id = r.tenant_id
`;

const shape = (row: Record<string, unknown>, userId: number) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: row.category,
  definition: row.definition,
  owner_id: row.owner_id === null ? null : Number(row.owner_id),
  owner_name: row.owner_name,
  created_at: row.created_at,
  updated_at: row.updated_at,
  // Served, not re-derived client-side. Same arrangement as assignable_roles.
  abilities: abilitiesFor(
    { owner_id: row.owner_id === null ? null : Number(row.owner_id) },
    (row.my_grant as GrantLevel | null) ?? null,
    userId,
  ),
});

/** Compile the definition to validate it. Returns a message, or null. */
function definitionError(definition: unknown, tenantId: string): string | null {
  try {
    buildReportQuery(definition as never, tenantId);
    return null;
  } catch (err) {
    if (err instanceof ReportDefinitionError) return err.message;
    // An unexpected failure is not a client error; let it surface as a 500
    // rather than being reported as a bad definition.
    throw err;
  }
}

/** GET /api/v1/reports — every report this caller may view. */
export const listReports = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = Number(req.user?.id);
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS}
        WHERE r.tenant_id = $1 AND ${canViewPredicate('r', 2)}
        ORDER BY r.name`,
      [tenantId, userId],
    );
    res.json({
      success: true,
      data: result.rows.map(r => shape(r, userId)),
      // The vocabularies the builder will accept, served so the client renders
      // the registry rather than keeping its own copy of it.
      modules: Object.entries(REPORT_MODULES).map(([key, m]) => ({
        key, label: m.label, joins: Object.keys(m.joins),
      })),
      fields: Object.entries(REPORT_FIELDS).map(([key, f]) => ({
        key, label: f.label, type: f.type, module: f.module, aggregatable: !!f.aggregatable,
      })),
      grant_levels: GRANT_LEVELS,
    });
  } catch (error) { next(error); }
};

/** GET /api/v1/reports/:id */
export const getReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = Number(req.user?.id);
    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS}
        WHERE r.tenant_id = $1 AND r.id = $3 AND ${canViewPredicate('r', 2)}`,
      [tenantId, userId, req.params.id],
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Report not found' }); return; }
    res.json({ success: true, data: shape(result.rows[0], userId) });
  } catch (error) { next(error); }
};

/** POST /api/v1/reports */
export const createReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = Number(req.user?.id);
    const { name, description, category, definition } = req.body ?? {};

    if (!name || !String(name).trim()) {
      res.status(400).json({ success: false, message: 'name is required' });
      return;
    }
    const bad = definitionError(definition, tenantId);
    if (bad) { res.status(400).json({ success: false, message: bad }); return; }

    const inserted = await pool.query(
      `INSERT INTO saved_reports (tenant_id, name, description, category, definition, owner_id)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING id`,
      [tenantId, String(name).trim(), description || null, category || null,
       JSON.stringify(definition), userId],
    );

    const created = await pool.query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} WHERE r.id = $3 AND r.tenant_id = $1`,
      [tenantId, userId, inserted.rows[0].id],
    );
    res.status(201).json({ success: true, data: shape(created.rows[0], userId) });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ success: false, message: 'A report with that name already exists in this workspace' });
      return;
    }
    next(error);
  }
};

const EDITABLE = ['name', 'description', 'category', 'definition'] as const;

/** PATCH /api/v1/reports/:id — owner, or a grant at level 'edit'. */
export const updateReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = Number(req.user?.id);
    const body = req.body ?? {};

    const fields = EDITABLE.filter(f => body[f] !== undefined);
    if (!fields.length) {
      res.status(400).json({ success: false, message: `No fields to update — send any of: ${EDITABLE.join(', ')}` });
      return;
    }
    if (body.name !== undefined && (body.name === null || !String(body.name).trim())) {
      res.status(400).json({ success: false, message: 'name cannot be blank' });
      return;
    }
    if (body.definition !== undefined) {
      const bad = definitionError(body.definition, tenantId);
      if (bad) { res.status(400).json({ success: false, message: bad }); return; }
    }

    /*
     * The permission predicate is IN THE UPDATE. A caller without edit rights
     * matches zero rows and is answered 404 — the write is not attempted and
     * then rejected, it never addresses the row at all.
     */
    const sets = fields.map((f, n) => `${f} = $${n + 4}${f === 'definition' ? '::jsonb' : ''}`).join(', ');
    const values = fields.map(f => (f === 'definition' ? JSON.stringify(body[f]) : body[f]));
    const updated = await pool.query(
      `UPDATE saved_reports r SET ${sets}, updated_at = NOW()
        WHERE r.tenant_id = $1 AND r.id = $3 AND ${canEditPredicate('r', 2)}
        RETURNING r.id`,
      [tenantId, userId, req.params.id, ...values],
    );
    if (!updated.rows[0]) { res.status(404).json({ success: false, message: 'Report not found' }); return; }

    const row = await pool.query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} WHERE r.id = $3 AND r.tenant_id = $1`,
      [tenantId, userId, req.params.id],
    );
    res.json({ success: true, data: shape(row.rows[0], userId) });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ success: false, message: 'A report with that name already exists in this workspace' });
      return;
    }
    next(error);
  }
};

/** DELETE /api/v1/reports/:id — the OWNER alone. See isOwnerPredicate. */
export const deleteReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = Number(req.user?.id);
    // Grants cascade with the report (composite FK, ON DELETE CASCADE).
    const deleted = await pool.query(
      `DELETE FROM saved_reports r
        WHERE r.tenant_id = $1 AND r.id = $3 AND ${isOwnerPredicate('r', 2)}
        RETURNING r.id`,
      [tenantId, userId, req.params.id],
    );
    if (!deleted.rows[0]) { res.status(404).json({ success: false, message: 'Report not found' }); return; }
    res.json({ success: true, data: { id: deleted.rows[0].id } });
  } catch (error) { next(error); }
};

/** GET /api/v1/reports/:id/grants — visible to anyone who may view the report. */
export const listGrants = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = Number(req.user?.id);
    const visible = await pool.query(
      `SELECT r.id FROM saved_reports r
        WHERE r.tenant_id = $1 AND r.id = $3 AND ${canViewPredicate('r', 2)}`,
      [tenantId, userId, req.params.id],
    );
    if (!visible.rows[0]) { res.status(404).json({ success: false, message: 'Report not found' }); return; }

    const grants = await pool.query(
      `SELECT g.user_id, g.level, g.created_at,
              NULLIF(btrim(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '') AS name,
              u.email
         FROM saved_report_grants g
         JOIN users u ON u.id = g.user_id AND u.tenant_id = g.tenant_id
        WHERE g.report_id = $1 AND g.tenant_id = $2
        ORDER BY u.first_name, u.last_name`,
      [req.params.id, tenantId],
    );
    res.json({
      success: true,
      data: grants.rows.map(g => ({ ...g, user_id: Number(g.user_id) })),
      grant_levels: GRANT_LEVELS,
    });
  } catch (error) { next(error); }
};

/**
 * PUT /api/v1/reports/:id/grants — the OWNER alone.
 * Body: { user_id, level: 'view' | 'edit' }
 *
 * Upserts, so re-granting at a different level changes it rather than failing.
 */
export const setGrant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = Number(req.user?.id);
    const { user_id, level } = req.body ?? {};

    if (!(GRANT_LEVELS as readonly string[]).includes(String(level))) {
      res.status(400).json({ success: false, message: `level must be one of: ${GRANT_LEVELS.join(', ')}` });
      return;
    }
    const grantee = Number(user_id);
    if (!Number.isInteger(grantee)) {
      res.status(400).json({ success: false, message: 'user_id must be a user id' });
      return;
    }
    // The composite FK would refuse a cross-workspace grantee anyway; this
    // turns a 23503 into the field-naming 400 the rest of the API uses, which
    // never discloses that the row exists elsewhere.
    const badRef = await foreignIdsInTenant([{ field: 'user_id', table: 'users', value: grantee }], tenantId);
    if (badRef) { res.status(400).json({ success: false, message: badRef }); return; }

    const owns = await pool.query(
      `SELECT r.id FROM saved_reports r
        WHERE r.tenant_id = $1 AND r.id = $3 AND ${isOwnerPredicate('r', 2)}`,
      [tenantId, userId, req.params.id],
    );
    if (!owns.rows[0]) { res.status(404).json({ success: false, message: 'Report not found' }); return; }

    if (grantee === userId) {
      // The owner already has everything; a self-grant would be a row that
      // means nothing and could only confuse a later reader of the table.
      res.status(400).json({ success: false, message: 'You already own this report' });
      return;
    }

    await pool.query(
      `INSERT INTO saved_report_grants (report_id, user_id, tenant_id, level, granted_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (report_id, user_id) DO UPDATE SET level = EXCLUDED.level`,
      [req.params.id, grantee, tenantId, String(level), userId],
    );
    res.json({ success: true, data: { user_id: grantee, level: String(level) } });
  } catch (error) { next(error); }
};

/** DELETE /api/v1/reports/:id/grants/:userId — the OWNER alone. */
export const revokeGrant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = Number(req.user?.id);
    const owns = await pool.query(
      `SELECT r.id FROM saved_reports r
        WHERE r.tenant_id = $1 AND r.id = $3 AND ${isOwnerPredicate('r', 2)}`,
      [tenantId, userId, req.params.id],
    );
    if (!owns.rows[0]) { res.status(404).json({ success: false, message: 'Report not found' }); return; }

    const removed = await pool.query(
      `DELETE FROM saved_report_grants
        WHERE report_id = $1 AND tenant_id = $2 AND user_id = $3
        RETURNING user_id`,
      [req.params.id, tenantId, Number(req.params.userId)],
    );
    if (!removed.rows[0]) { res.status(404).json({ success: false, message: 'That person has no grant on this report' }); return; }
    res.json({ success: true, data: { user_id: Number(removed.rows[0].user_id) } });
  } catch (error) { next(error); }
};

/**
 * POST /api/v1/reports/run — run a definition WITHOUT saving it.
 *
 * This is what the builder's preview pane calls. It needs no saved row and
 * therefore no grant check: you are running a definition you just supplied,
 * against your own workspace, on a connection that cannot see anyone else's
 * data. The tenant comes from the token, as everywhere.
 */
export const runAdHoc = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { definition } = req.body ?? {};
    if (!definition) {
      res.status(400).json({ success: false, message: 'definition is required' });
      return;
    }
    const run = await runReport(definition, tenantId);
    res.json({ success: true, ...run });
  } catch (error) {
    if (error instanceof ReportDefinitionError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof ReportTimeout) {
      // 504: the request was well-formed and the server gave up, which is a
      // different thing from the caller having asked for something invalid.
      res.status(504).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

/**
 * GET /api/v1/reports/:id/run — run a SAVED report.
 *
 * Requires view. The permission predicate is in the SELECT that fetches the
 * definition, so a caller without access never obtains a definition to run —
 * the check is not "may you run this" asked after loading it.
 */
export const runSaved = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = Number(req.user?.id);

    const found = await pool.query(
      `SELECT r.id, r.name, r.definition
         FROM saved_reports r
        WHERE r.tenant_id = $1 AND r.id = $3 AND ${canViewPredicate('r', 2)}`,
      [tenantId, userId, req.params.id],
    );
    if (!found.rows[0]) { res.status(404).json({ success: false, message: 'Report not found' }); return; }

    const run = await runReport(found.rows[0].definition, tenantId);
    res.json({
      success: true,
      report: { id: found.rows[0].id, name: found.rows[0].name },
      ...run,
    });
  } catch (error) {
    if (error instanceof ReportDefinitionError) {
      /*
       * A SAVED definition that no longer compiles is a 409, not a 400: the
       * caller did nothing wrong, and the stored report has outlived a registry
       * change. Saying so beats a 400 that implies bad input, and beats a
       * best-effort run that would report a wrong number.
       */
      res.status(409).json({
        success: false,
        message: `This saved report can no longer run: ${error.message}`,
      });
      return;
    }
    if (error instanceof ReportTimeout) {
      res.status(504).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};
