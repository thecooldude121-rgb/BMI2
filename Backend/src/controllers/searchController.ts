import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

/**
 * GLOBAL SEARCH — GET /api/v1/search?q=  (Group B item 10, v1 scope approved
 * 2026-10-05: leads, contacts, accounts, deals; meetings and tasks are NOT in v1).
 *
 *   - Every query is scoped to the caller's workspace (tenant_id = $1). Like the
 *     list endpoints, results are workspace-wide; the "sales see their own
 *     leads" filter is a display preference, not security (ratified 2026-10-03).
 *   - The term is a parameter, never interpolated; LIKE wildcards in it are
 *     escaped, so "50%" matches the text "50%", not everything.
 *   - At most PER_TYPE rows per type, plus `has_more` (one extra row fetched)
 *     — never an invented total.
 *   - Test-flagged deals are excluded, as GET /deals excludes them.
 *
 * Plain ILIKE is fine at today's size; at 10k rows per table the planned
 * upgrade is pg_trgm GIN indexes (an extension the server has available but this
 * database has not enabled) — same query shape, no API change.
 */

export const PER_TYPE = 5;
export const MIN_QUERY = 2;
export const MAX_QUERY = 100;

const likeEscape = (s: string) => s.replace(/[\\%_]/g, m => `\\${m}`);

export const search = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const raw = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (raw.length < MIN_QUERY) {
      res.status(400).json({ success: false, message: `Search needs at least ${MIN_QUERY} characters.` });
      return;
    }
    if (raw.length > MAX_QUERY) {
      res.status(400).json({ success: false, message: `Search is limited to ${MAX_QUERY} characters.` });
      return;
    }
    const term = `%${likeEscape(raw)}%`;
    const limit = PER_TYPE + 1;

    const [leads, contacts, accounts, deals] = await Promise.all([
      pool.query(
        `SELECT id, first_name, last_name, email, company, stage
           FROM leads
          WHERE tenant_id = $1
            AND (coalesce(first_name,'') || ' ' || coalesce(last_name,'') ILIKE $2
                 OR email ILIKE $2 OR coalesce(company,'') ILIKE $2)
          ORDER BY created_at DESC, id DESC
          LIMIT $3`, [tenantId, term, limit]),
      pool.query(
        `SELECT c.id, c.first_name, c.last_name, c.email, co.name AS company
           FROM contacts c
           LEFT JOIN companies co ON co.id = c.company_id AND co.tenant_id = c.tenant_id
          WHERE c.tenant_id = $1
            AND (coalesce(c.first_name,'') || ' ' || coalesce(c.last_name,'') ILIKE $2
                 OR coalesce(c.email,'') ILIKE $2)
          ORDER BY c.created_at DESC, c.id DESC
          LIMIT $3`, [tenantId, term, limit]),
      pool.query(
        `SELECT id, name, domain, industry
           FROM companies
          WHERE tenant_id = $1
            AND (name ILIKE $2 OR coalesce(domain,'') ILIKE $2)
          ORDER BY name ASC, id ASC
          LIMIT $3`, [tenantId, term, limit]),
      pool.query(
        `SELECT d.id, d.name, d.company_name, d.value, d.currency, ps.slug AS stage
           FROM deals d
           LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id
          WHERE d.tenant_id = $1
            AND d.is_test = false
            AND (coalesce(d.name,'') ILIKE $2 OR coalesce(d.company_name,'') ILIKE $2)
          ORDER BY d.created_at DESC, d.id DESC
          LIMIT $3`, [tenantId, term, limit]),
    ]);

    const pack = <T>(rows: T[]) => ({ rows: rows.slice(0, PER_TYPE), has_more: rows.length > PER_TYPE });
    res.json({
      success: true,
      data: {
        q: raw,
        leads: pack(leads.rows),
        contacts: pack(contacts.rows),
        accounts: pack(accounts.rows),
        deals: pack(deals.rows),
      },
    });
  } catch (error) { next(error); }
};
