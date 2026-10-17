import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { foreignIdsInTenant } from '../utils/tenantScope';
import { buildReportQuery, ReportDefinitionError } from '../services/reports/queryBuilder';
import { REPORT_MODULES, REPORT_FIELDS } from '../services/reports/registry';
import { runReport, ReportTimeout } from '../services/reports/runner';
import { ReportsPoolUnavailable } from '../config/reportsDatabase';
import {
  canViewPredicate, canEditPredicate, isOwnerPredicate,
  canViewOrAdminPredicate, canDeletePredicate, isOwnerlessPredicate,
  abilitiesFor, GRANT_LEVELS, type GrantLevel,
} from '../services/reports/access';

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
 *
 * ─── OWNERLESS REPORTS (step c, decided by Venkat 2026-10-16) ─────────────
 *
 * A workspace admin may view, delete or transfer a report whose owner is gone or
 * deactivated — see isOwnerlessPredicate. "Admin" is the caller's LIVE role
 * (protect re-reads it on every request), bound into the query as a boolean.
 */

/** The caller's live role, as the boolean the ownerless predicates bind. */
const isAdminCaller = (req: AuthRequest): boolean => req.user?.role === 'admin';

const DISPLAY_NAME = (a: string) =>
  `COALESCE(NULLIF(btrim(COALESCE(${a}.first_name,'') || ' ' || COALESCE(${a}.last_name,'')), ''), ${a}.email)`;

const SELECT_COLUMNS = `
  r.id, r.name, r.description, r.category, r.definition,
  r.owner_id, r.created_at, r.updated_at,
  NULLIF(btrim(COALESCE(o.first_name,'') || ' ' || COALESCE(o.last_name,'')), '') AS owner_name,
  (SELECT g.level FROM saved_report_grants g
    WHERE g.report_id = r.id AND g.tenant_id = r.tenant_id AND g.user_id = $2) AS my_grant,
  ${isOwnerlessPredicate('r')} AS ownerless
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

const shape = (row: Record<string, unknown>, userId: number, isAdmin: boolean) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  category: row.category,
  definition: row.definition,
  owner_id: row.owner_id === null ? null : Number(row.owner_id),
  owner_name: row.owner_name,
  created_at: row.created_at,
  updated_at: row.updated_at,
  ownerless: row.ownerless === true,
  // Served, not re-derived client-side. Same arrangement as assignable_roles.
  abilities: abilitiesFor(
    { owner_id: row.owner_id === null ? null : Number(row.owner_id), ownerless: row.ownerless === true },
    (row.my_grant as GrantLevel | null) ?? null,
    userId,
    isAdmin,
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
        WHERE r.tenant_id = $1 AND ${canViewOrAdminPredicate('r', 2, 3)}
        ORDER BY r.name`,
      [tenantId, userId, isAdminCaller(req)],
    );
    res.json({
      success: true,
      data: result.rows.map(r => shape(r, userId, isAdminCaller(req))),
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
        WHERE r.tenant_id = $1 AND r.id = $3 AND ${canViewOrAdminPredicate('r', 2, 4)}`,
      [tenantId, userId, req.params.id, isAdminCaller(req)],
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Report not found' }); return; }
    res.json({ success: true, data: shape(result.rows[0], userId, isAdminCaller(req)) });
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
    res.status(201).json({ success: true, data: shape(created.rows[0], userId, isAdminCaller(req)) });
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
    res.json({ success: true, data: shape(row.rows[0], userId, isAdminCaller(req)) });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ success: false, message: 'A report with that name already exists in this workspace' });
      return;
    }
    next(error);
  }
};

/** DELETE /api/v1/reports/:id — the owner, or an admin on an ownerless report. */
export const deleteReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = Number(req.user?.id);
    // Grants cascade with the report (composite FK, ON DELETE CASCADE).
    const deleted = await pool.query(
      `DELETE FROM saved_reports r
        WHERE r.tenant_id = $1 AND r.id = $3 AND ${canDeletePredicate('r', 2, 4)}
        RETURNING r.id`,
      [tenantId, userId, req.params.id, isAdminCaller(req)],
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
        WHERE r.tenant_id = $1 AND r.id = $3 AND ${canViewOrAdminPredicate('r', 2, 4)}`,
      [tenantId, userId, req.params.id, isAdminCaller(req)],
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
 * GET /api/v1/reports/:id/transfer-candidates — an admin, on an ownerless report.
 * The people the report may be transferred to: ACTIVE members of THIS workspace,
 * and nobody else. The picker renders this list; the transfer itself re-checks.
 */
export const listTransferCandidates = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const report = await pool.query(
      `SELECT r.id FROM saved_reports r
        WHERE r.tenant_id = $1 AND r.id = $2 AND $3::boolean AND ${isOwnerlessPredicate('r')}`,
      [tenantId, req.params.id, isAdminCaller(req)],
    );
    if (!report.rows[0]) { res.status(404).json({ success: false, message: 'Report not found' }); return; }

    const people = await pool.query(
      `SELECT u.id, ${DISPLAY_NAME('u')} AS name, u.email
         FROM users u
        WHERE u.tenant_id = $1 AND u.is_active IS TRUE
        ORDER BY name, u.id`,
      [tenantId],
    );
    res.json({ success: true, data: people.rows.map(p => ({ ...p, id: Number(p.id) })) });
  } catch (error) { next(error); }
};

/**
 * POST /api/v1/reports/:id/transfer — an admin, on an ownerless report.
 * Body: { to_user_id } — an ACTIVE member of the same workspace.
 *
 * One transaction: lock the report row ALONE (a locking SELECT that also reads
 * another table can see a mixed snapshot under contention — lesson 11), then
 * re-check that it is still ownerless, then move ownership, drop any grant the new
 * owner held (an owner has everything), and record the transfer.
 */
export const transferReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let tenantId: string;
  try { tenantId = requireTenantId(req); } catch (error) { next(error); return; }
  const userId = Number(req.user?.id);
  const toUserId = Number(req.body?.to_user_id);
  if (!Number.isInteger(toUserId)) {
    res.status(400).json({ success: false, message: 'to_user_id must be a user id' });
    return;
  }
  const notFound = () => res.status(404).json({ success: false, message: 'Report not found' });
  if (!isAdminCaller(req)) { notFound(); return; }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query(
      `SELECT id, name, owner_id FROM saved_reports WHERE tenant_id = $1 AND id = $2 FOR UPDATE`,
      [tenantId, req.params.id],
    );
    const report = locked.rows[0];
    if (!report) { await client.query('ROLLBACK'); notFound(); return; }

    const ownerless = await client.query(
      `SELECT ${isOwnerlessPredicate('r')} AS ownerless FROM saved_reports r WHERE r.tenant_id = $1 AND r.id = $2`,
      [tenantId, report.id],
    );
    // An owned report is absent to an admin, exactly as on every other route.
    if (ownerless.rows[0]?.ownerless !== true) { await client.query('ROLLBACK'); notFound(); return; }

    const target = await client.query(
      `SELECT u.id, ${DISPLAY_NAME('u')} AS name FROM users u
        WHERE u.id = $1 AND u.tenant_id = $2 AND u.is_active IS TRUE`,
      [toUserId, tenantId],
    );
    if (!target.rows[0]) {
      await client.query('ROLLBACK');
      // Names the field; never says whether the id exists elsewhere.
      res.status(400).json({ success: false, message: 'to_user_id does not name an active member of this workspace' });
      return;
    }

    const names = await client.query(
      `SELECT u.id, ${DISPLAY_NAME('u')} AS name FROM users u
        WHERE u.tenant_id = $1 AND u.id = ANY($2::int[])`,
      [tenantId, [userId, ...(report.owner_id === null ? [] : [Number(report.owner_id)])]],
    );
    const nameOf = (id: number | null) => (id === null ? null : names.rows.find(r => Number(r.id) === id)?.name ?? null);
    const fromUserId = report.owner_id === null ? null : Number(report.owner_id);

    await client.query(
      `UPDATE saved_reports SET owner_id = $3, updated_at = NOW() WHERE tenant_id = $1 AND id = $2`,
      [tenantId, report.id, toUserId],
    );
    await client.query(
      `DELETE FROM saved_report_grants WHERE tenant_id = $1 AND report_id = $2 AND user_id = $3`,
      [tenantId, report.id, toUserId],
    );
    const record = await client.query(
      `INSERT INTO saved_report_transfers
         (tenant_id, report_id, report_name, from_user_id, from_user_name,
          to_user_id, to_user_name, transferred_by, transferred_by_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, from_user_id, from_user_name, to_user_id, to_user_name,
                 transferred_by, transferred_by_name, transferred_at`,
      [tenantId, report.id, report.name, fromUserId, nameOf(fromUserId),
       toUserId, target.rows[0].name, userId, nameOf(userId) ?? String(req.user?.email ?? userId)],
    );
    await client.query('COMMIT');

    const row = await pool.query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} WHERE r.id = $3 AND r.tenant_id = $1`,
      [tenantId, userId, report.id],
    );
    res.json({ success: true, data: shape(row.rows[0], userId, true), transfer: record.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => { /* the original error is what matters */ });
    next(error);
  } finally {
    client.release();
  }
};

/**
 * The run endpoints' shared error answers. Only the definition error differs
 * between ad-hoc (400: you sent it) and saved (409: it has outlived a registry
 * change), so the caller says which.
 */
function sendRunError(res: Response, error: unknown, definitionStatus: 400 | 409): boolean {
  if (error instanceof ReportDefinitionError) {
    res.status(definitionStatus).json({
      success: false,
      message: definitionStatus === 409 ? `This saved report can no longer run: ${error.message}` : error.message,
    });
    return true;
  }
  if (error instanceof ReportTimeout) {
    // 504: the request was well-formed and the server gave up, which is a
    // different thing from the caller having asked for something invalid.
    res.status(504).json({ success: false, message: error.message });
    return true;
  }
  if (error instanceof ReportsPoolUnavailable) {
    // 503, never a masked 500: reports are switched off or the safety check has
    // not passed, and nothing was run. The detail (which setting, which check)
    // is for the server log, not the caller.
    console.error(`reports unavailable: ${error.message}`);
    res.status(503).json({
      success: false,
      message: 'Reports are not available right now. Nothing was run. Try again in a moment.',
    });
    return true;
  }
  return false;
}

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
    if (!sendRunError(res, error, 400)) next(error);
  }
};

/**
 * GET /api/v1/reports/:id/run — run a SAVED report.
 *
 * Requires view — the same predicate as GET /reports/:id, so a workspace admin
 * may run an OWNERLESS report exactly as they may view it, and nothing more.
 * The predicate is in the SELECT that fetches the definition, so a caller
 * without access never obtains a definition to run.
 */
export const runSaved = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const userId = Number(req.user?.id);

    const found = await pool.query(
      `SELECT r.id, r.name, r.definition
         FROM saved_reports r
        WHERE r.tenant_id = $1 AND r.id = $3 AND ${canViewOrAdminPredicate('r', 2, 4)}`,
      [tenantId, userId, req.params.id, isAdminCaller(req)],
    );
    if (!found.rows[0]) { res.status(404).json({ success: false, message: 'Report not found' }); return; }

    const run = await runReport(found.rows[0].definition, tenantId);
    res.json({
      success: true,
      report: { id: found.rows[0].id, name: found.rows[0].name },
      ...run,
    });
  } catch (error) {
    if (!sendRunError(res, error, 409)) next(error);
  }
};
