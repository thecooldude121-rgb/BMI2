import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import {
  MAX_IMPORT_ROWS, runImport, created, skipped, failed, tooLong, firstProblem,
} from '../utils/csvImport';

export const getCompanies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { industry, search, limit = 50, offset = 0 } = req.query;
    let query = `SELECT * FROM companies WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let i = 2;
    if (industry) { query += ` AND industry = $${i++}`; params.push(industry); }
    if (search)   { query += ` AND name ILIKE $${i}`; params.push(`%${search}%`); i++; }
    query += ` ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) { next(error); }
};

export const getCompanyById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const [company, contacts] = await Promise.all([
      pool.query('SELECT * FROM companies WHERE id = $1 AND tenant_id = $2', [req.params.id, tenantId]),
      pool.query('SELECT * FROM contacts WHERE company_id = $1 AND tenant_id = $2 ORDER BY is_primary DESC, created_at', [req.params.id, tenantId]),
    ]);
    if (!company.rows[0]) { res.status(404).json({ success: false, message: 'Company not found' }); return; }
    res.json({ success: true, data: { ...company.rows[0], contacts: contacts.rows } });
  } catch (error) { next(error); }
};

export const createCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { id, name, domain, industry, size, revenue, website, phone, description, street, city, state, country, zip_code } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400).json({ success: false, message: 'name is required' });
      return;
    }
    // companies.size has a CHECK constraint; validate rather than emit a raw 500.
    const VALID_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'unknown'];
    if (size && !VALID_SIZES.includes(size)) {
      res.status(400).json({ success: false, message: `size must be one of: ${VALID_SIZES.join(', ')}` });
      return;
    }

    // companies.id is a NOT NULL varchar with no default. It used to be taken
    // straight from the request body, so any POST without an id was a raw 23502
    // — and a client generating its own id can collide. Generate it here when
    // absent, matching the existing C001 style and the D001/CT001 schemes in
    // dealsController/contactsController.
    let companyId = id;
    if (!companyId) {
      // DELIBERATELY NOT SCOPED BY TENANT, and this is load-bearing.
      // companies.id is a GLOBAL primary key (companies_pkey PRIMARY KEY (id)), so ids must be
      // unique across every workspace. Adding `AND tenant_id = $n` here would make
      // the second workspace generate C001 again and every insert would fail with
      // a duplicate-key error. The scan for missing tenant filters flags this line;
      // it is a false positive.
      //
      // It IS a small information leak: the id a caller receives reveals the global
      // row count. The fix for that is a per-workspace sequence or a uuid, NOT a
      // tenant predicate.
      const maxResult = await pool.query(
        `SELECT MAX(CAST(SUBSTRING(id, 2) AS INTEGER)) AS max_num FROM companies WHERE id ~ '^C[0-9]+$'`
      );
      companyId = `C${String((maxResult.rows[0].max_num || 0) + 1).padStart(3, '0')}`;
    }

    const result = await pool.query(
      `INSERT INTO companies (id, name, domain, industry, size, revenue, website, phone, description, street, city, state, country, zip_code, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [companyId, name, domain, industry, size, revenue, website, phone, description, street, city, state, country, zip_code, tenantId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const fields = ['name','domain','industry','size','revenue','website','phone','description','street','city','state','country','zip_code'];
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(req.body[f]); } });
    if (!updates.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    updates.push(`updated_at = NOW()`);
    params.push(req.params.id, tenantId);
    const result = await pool.query(`UPDATE companies SET ${updates.join(', ')} WHERE id = $${i++} AND tenant_id = $${i} RETURNING *`, params);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Company not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const deleteCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query('DELETE FROM companies WHERE id = $1 AND tenant_id = $2 RETURNING id', [req.params.id, tenantId]);
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Company not found' }); return; }
    res.json({ success: true, message: 'Company deleted' });
  } catch (error) { next(error); }
};

// ─────────────────────────────────────────────────────────────────────────────
// CSV import
// ─────────────────────────────────────────────────────────────────────────────

/** Mapped field names, not raw CSV headers — the alias table lives client-side. */
interface CompanyImportRow {
  name?: string;
  domain?: string;
  industry?: string;
  size?: string;
  revenue?: string | number;
  website?: string;
  phone?: string;
  description?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());
const orNull = (v: string): string | null => (v === '' ? null : v);

/** Mirrors companies_size_check. Duplicated only to produce a better message. */
const VALID_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'unknown'];

/**
 * POST /companies/import
 *
 * Body: { rows: CompanyImportRow[], dry_run?: boolean }
 *
 * NOTE ON DUPLICATES, because this differs from contacts in a way that matters:
 * `companies` has NO unique constraint — not on name, not on domain. The
 * database will not stop a workspace accumulating fifteen rows named "Acme
 * Corp", so the name check below is the ONLY thing standing between a
 * re-run import and a duplicated account list. That makes the dry run more
 * valuable here than on contacts, where the constraint is a backstop.
 *
 * Whether that constraint should exist is a product question, not a hygiene
 * fix — divisions and regional entities can legitimately share a display name.
 * It is logged as an open design question in HANDOFF.md and deliberately not
 * decided here.
 */
export const importCompanies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);
    const { rows, dry_run } = req.body as { rows?: unknown; dry_run?: unknown };

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ success: false, message: 'rows must be a non-empty array' });
      return;
    }
    if (rows.length > MAX_IMPORT_ROWS) {
      res.status(400).json({
        success: false,
        message: `An import is limited to ${MAX_IMPORT_ROWS} rows at a time; this request had ${rows.length}`,
      });
      return;
    }

    const summary = await runImport<CompanyImportRow>(
      client,
      rows as CompanyImportRow[],
      dry_run === true,
      async (row, _index, tx) => {
        const name = str(row.name);
        if (!name) return failed('Missing required field: name');

        const lengthProblem = firstProblem(
          tooLong(name, 100, 'Name'),
          tooLong(str(row.domain), 100, 'Domain'),
          tooLong(str(row.industry), 50, 'Industry'),
          tooLong(str(row.website), 200, 'Website'),
          tooLong(str(row.phone), 20, 'Phone'),
          tooLong(str(row.street), 150, 'Street'),
          tooLong(str(row.city), 50, 'City'),
          tooLong(str(row.state), 50, 'State'),
          tooLong(str(row.country), 50, 'Country'),
          tooLong(str(row.zip_code), 20, 'Zip code'),
        );
        if (lengthProblem) return failed(lengthProblem);

        const size = str(row.size);
        if (size && !VALID_SIZES.includes(size)) {
          return failed(`"${size}" is not a valid company size. Use one of: ${VALID_SIZES.join(', ')}`);
        }

        // revenue is a bigint. A non-numeric value would be a 22P02 the user
        // cannot read, and silently dropping it would lose data they supplied.
        let revenue: number | null = null;
        const revenueRaw = str(row.revenue);
        if (revenueRaw) {
          // Tolerate the separators and currency marks a spreadsheet produces.
          const cleaned = revenueRaw.replace(/[,\s₹$€£]/g, '');
          if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
            return failed(`"${revenueRaw}" is not a number, so it cannot be saved as revenue`);
          }
          revenue = Math.round(Number(cleaned));
        }

        // Catches both an existing account and a name repeated earlier in this
        // same file — rows inserted earlier in the transaction are visible.
        const dup = await tx.query(
          'SELECT id FROM companies WHERE tenant_id = $1 AND lower(name) = lower($2) LIMIT 1',
          [tenantId, name],
        );
        if (dup.rowCount) {
          return skipped(`An account named "${name}" already exists (${dup.rows[0].id})`);
        }

        // Same MAX(id)+1 scheme, same deliberate absence of a tenant predicate
        // (companies.id is a GLOBAL primary key), same known cross-request race
        // as createCompany. See CLAUDE.md — the race and the id-leak share one
        // fix and are not addressed here.
        const maxResult = await tx.query(
          `SELECT MAX(CAST(SUBSTRING(id, 2) AS INTEGER)) AS max_num FROM companies WHERE id ~ '^C[0-9]+$'`,
        );
        const id = `C${String((maxResult.rows[0].max_num || 0) + 1).padStart(3, '0')}`;

        const inserted = await tx.query(
          `INSERT INTO companies (
             id, tenant_id, name, domain, industry, size, revenue, website, phone,
             description, street, city, state, country, zip_code
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
           RETURNING id`,
          [
            id, tenantId, name, orNull(str(row.domain)), orNull(str(row.industry)),
            orNull(size), revenue, orNull(str(row.website)), orNull(str(row.phone)),
            orNull(str(row.description)), orNull(str(row.street)), orNull(str(row.city)),
            orNull(str(row.state)), orNull(str(row.country)), orNull(str(row.zip_code)),
          ],
        );

        return created(inserted.rows[0].id);
      },
    );

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};
