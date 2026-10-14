import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

/**
 * POST /api/v1/leads/duplicate-check — slice 6b (Group A item 4).
 *
 * The lead duplicate checks (Add Lead, Quick Add, the CSV import, Lead detail,
 * the conversion wizard) compared against LeadContext's 50 preloaded leads, so
 * lead #51 was never checked. This answers, for 1..1000 candidate rows at once,
 * the existing lead in the CALLER'S workspace each row matches — one request
 * for a whole import instead of one per row.
 *
 * A row matches on, in priority order: the same email (case-insensitive), the
 * same phone digits (7+), or the same company AND last name (case-insensitive)
 * — the rules the import already used, now run over every lead.
 *
 * Body: { rows: [{ email?, phone?, company?, last_name? }], exclude_id? }
 * Reply: { data: [{ index, match: lead | null }] } in row order.
 */
const MAX_ROWS = 1000;
const s = (v: unknown) => (typeof v === 'string' ? v : '');

export const checkLeadDuplicates = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const rows = req.body?.rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_ROWS) {
      res.status(400).json({ success: false, message: `rows must be an array of 1 to ${MAX_ROWS} items` });
      return;
    }
    const excludeRaw = req.body?.exclude_id;
    const exclude = excludeRaw === undefined || excludeRaw === null || excludeRaw === '' ? null : Number(excludeRaw);
    if (exclude !== null && !Number.isInteger(exclude)) {
      res.status(400).json({ success: false, message: 'exclude_id must be a lead id' });
      return;
    }

    const emails = rows.map(r => s(r?.email).trim().toLowerCase());
    const phones = rows.map(r => s(r?.phone).replace(/\D/g, ''));
    const companies = rows.map(r => s(r?.company).trim().toLowerCase());
    const lastNames = rows.map(r => s(r?.last_name).trim().toLowerCase());

    // Hash joins on normalised keys, so a 1000-row import against 10,000 leads
    // is three equality joins, not a regex per pair. Every candidate lead is
    // pinned to the caller's workspace before any join.
    const result = await pool.query(
      `WITH r AS (
         SELECT t.email, t.phone, t.company, t.last_name, (t.idx - 1)::int AS idx
           FROM unnest($2::text[], $3::text[], $4::text[], $5::text[]) WITH ORDINALITY
                AS t(email, phone, company, last_name, idx)
       ),
       lp AS (
         SELECT l.id, l.first_name, l.last_name, l.email, l.phone, l.company, l.stage,
                lower(l.email) AS e,
                regexp_replace(COALESCE(l.phone, ''), '\\D', '', 'g') AS d,
                lower(l.company) AS c, lower(l.last_name) AS ln
           FROM leads l
          WHERE l.tenant_id = $1 AND ($6::int IS NULL OR l.id <> $6::int)
       ),
       m AS (
         SELECT r.idx, 1 AS pri, lp.* FROM r JOIN lp ON r.email <> '' AND lp.e = r.email
         UNION ALL
         SELECT r.idx, 2 AS pri, lp.* FROM r JOIN lp ON length(r.phone) >= 7 AND lp.d = r.phone
         UNION ALL
         SELECT r.idx, 3 AS pri, lp.* FROM r JOIN lp
             ON r.company <> '' AND r.last_name <> '' AND lp.c = r.company AND lp.ln = r.last_name
       )
       SELECT DISTINCT ON (idx) idx, pri, id, first_name, last_name, email, phone, company, stage
         FROM m ORDER BY idx, pri, id`,
      [tenantId, emails, phones, companies, lastNames, exclude],
    );

    const byIdx = new Map<number, Record<string, unknown>>();
    for (const row of result.rows) {
      const { idx, pri, ...lead } = row;
      byIdx.set(idx, { ...lead, matched_on: pri === 1 ? 'email' : pri === 2 ? 'phone' : 'company_last_name' });
    }
    res.json({ success: true, data: rows.map((_: unknown, index: number) => ({ index, match: byIdx.get(index) ?? null })) });
  } catch (err) {
    next(err);
  }
};
