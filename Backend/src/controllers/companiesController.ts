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
    // The id normally comes from the column DEFAULT (migration 031:
    // 'C' || LPAD(nextval('companies_id_seq'), 3, '0')). The old MAX(id)+1 here
    // read the maximum in one statement and inserted in another; Node yields
    // between them, so two concurrent creates produced the same id and the
    // second collided as a masked 500 — measured at 7 of 10 lost writes with
    // ten concurrent requests. nextval() is atomic, so the id column is simply
    // omitted from the INSERT and Postgres fills it.
    //
    // An explicitly supplied id is still honoured, unchanged, so no existing
    // caller breaks. Nothing in the frontend sends one; note that a client
    // choosing its own id can still collide with a value the sequence reaches
    // later, exactly as it could collide with MAX+1 before. That is a property
    // of accepting client ids at all, not of this migration.
    const explicitId = id !== undefined && id !== null && String(id).trim() !== '';
    const cols = [
      ...(explicitId ? ['id'] : []),
      'name', 'domain', 'industry', 'size', 'revenue', 'website', 'phone',
      'description', 'street', 'city', 'state', 'country', 'zip_code', 'tenant_id',
    ];
    const vals: any[] = [
      ...(explicitId ? [id] : []),
      name, domain, industry, size, revenue, website, phone,
      description, street, city, state, country, zip_code, tenantId,
    ];
    const result = await pool.query(
      `INSERT INTO companies (${cols.join(', ')})
       VALUES (${cols.map((_, n) => `$${n + 1}`).join(',')}) RETURNING *`,
      vals
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    // companies.size has a CHECK constraint, and this path used to write to it
    // with no validation at all: an invalid size reached Postgres, came back as
    // a raw 23514, and errorHandler masked it as a 500 "Internal Server Error"
    // — while createCompany returned a clean, specific 400 for the same input.
    // Validate here too, with the same message, so the two paths agree.
    const { size } = req.body;
    if (size !== undefined && size !== null && !VALID_SIZES.includes(size)) {
      res.status(400).json({ success: false, message: `size must be one of: ${VALID_SIZES.join(', ')}` });
      return;
    }
    // createCompany rejects a blank name; this path wrote it. An explicit null
    // hit companies.name NOT NULL as a masked 500, and an empty or
    // whitespace-only string was stored as an account with no name at all.
    if (req.body.name !== undefined && !String(req.body.name ?? '').trim()) {
      res.status(400).json({ success: false, message: 'name cannot be blank' });
      return;
    }
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

        // Id comes from the column DEFAULT (migration 031), as everywhere else.
        // `RETURNING id` still yields it, which is all this handler used it for.
        const inserted = await tx.query(
          `INSERT INTO companies (
             tenant_id, name, domain, industry, size, revenue, website, phone,
             description, street, city, state, country, zip_code
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           RETURNING id`,
          [
            tenantId, name, orNull(str(row.domain)), orNull(str(row.industry)),
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
