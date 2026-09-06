import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

/**
 * Workspace settings — the workspace half of Phase 1's "Auth + Workspace shell".
 *
 * SCOPE COMES FROM THE TOKEN, ALWAYS. There is no `:id` on these routes and no
 * workspace id is read from the body or query, so there is no shape in which a
 * caller can name a workspace other than their own. That is the same rule the
 * rest of the API follows and the reason the tenant-isolation suite passes; a
 * settings endpoint that accepted an id would be the one place it did not.
 *
 * The table is `tenants`, not `workspaces` — CLAUDE.md's spec name has not been
 * applied to the database. `settings` and `updated_at` arrive in migration 035.
 */

/** Stored inside tenants.settings. Everything here is optional and validated. */
interface WorkspaceSettings {
  timezone?: string;
  default_currency?: string;
}

/**
 * A slug is a URL-shaped identifier, and login uses it: when one password
 * verifies in more than one workspace, /auth/login answers `needsWorkspace`
 * with a list of {id, name, slug} and the client picks one. So it has to stay
 * something that can appear in a URL — lowercase, digits, single hyphens
 * between groups, no leading or trailing hyphen.
 *
 * Clients should key on `id`, not slug: slug is editable here, id never changes.
 */
const SLUG_SHAPE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX = 100;   // tenants.slug is VARCHAR(100)
const NAME_MAX = 255;

/**
 * ISO 4217 is three letters. deals.currency is VARCHAR(10) so the column would
 * accept more, but a currency that is not three letters is a typo, not a
 * currency, and it would spread into every deal created afterwards.
 */
const CURRENCY_SHAPE = /^[A-Z]{3}$/;

/**
 * A timezone is validated by ASKING THE PLATFORM, not by matching a list we
 * would then have to maintain as the IANA database changes. Intl throws a
 * RangeError for an unknown zone, which is exactly the check we want.
 */
function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate everything present in the body. Returns a caller-facing message or
 * null.
 *
 * ONE VALIDATOR, so there is no create/update asymmetry to drift apart. The
 * repeated defect this project has fixed a dozen times over is a field checked
 * on one path and written blind on the other; a workspace has no create path
 * today (provisioning is deferred to the Settings module per CLAUDE.md), and
 * when it gains one it calls this same function.
 */
function validate(body: Record<string, unknown>): string | null {
  if (body.name !== undefined) {
    const name = String(body.name ?? '').trim();
    if (!name) return 'name cannot be blank';
    if (name.length > NAME_MAX) return `name must be ${NAME_MAX} characters or fewer`;
  }

  if (body.slug !== undefined) {
    const slug = String(body.slug ?? '').trim();
    if (!slug) return 'slug cannot be blank';
    if (slug.length > SLUG_MAX) return `slug must be ${SLUG_MAX} characters or fewer`;
    if (!SLUG_SHAPE.test(slug)) {
      return 'slug must be lowercase letters, numbers and single hyphens, e.g. "acme-industries"';
    }
  }

  if (body.timezone !== undefined && body.timezone !== null) {
    const tz = String(body.timezone).trim();
    if (!tz) return 'timezone cannot be blank — omit it to leave it unset';
    if (!isValidTimezone(tz)) {
      return `"${tz}" is not a known IANA timezone, e.g. "Asia/Kolkata"`;
    }
  }

  if (body.default_currency !== undefined && body.default_currency !== null) {
    const cur = String(body.default_currency).trim().toUpperCase();
    if (!CURRENCY_SHAPE.test(cur)) {
      return 'default_currency must be a three-letter ISO 4217 code, e.g. "INR"';
    }
  }

  return null;
}

/** The shape every response here returns, so the client never has to guess. */
const shape = (row: {
  id: string; name: string; slug: string;
  settings: WorkspaceSettings | null;
  created_at: Date; updated_at: Date | null;
}) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  // Absent settings are reported as null rather than invented defaults: the
  // workspace genuinely has not chosen one, and a fabricated "UTC" would be
  // indistinguishable from a deliberate choice.
  timezone: row.settings?.timezone ?? null,
  default_currency: row.settings?.default_currency ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

/** GET /api/v1/workspace — the caller's own workspace. Any authenticated role. */
export const getWorkspace = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      'SELECT id, name, slug, settings, created_at, updated_at FROM tenants WHERE id = $1',
      [tenantId],
    );
    if (!result.rows[0]) {
      // Only reachable if the workspace was deleted while a token was live.
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }
    res.json({ success: true, data: shape(result.rows[0]) });
  } catch (error) { next(error); }
};

/**
 * PUT /api/v1/workspace — update name, slug, timezone, default_currency.
 *
 * Partial by design: an omitted field is left alone, so a client editing the
 * timezone cannot blank the name by not sending it.
 */
export const updateWorkspace = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);

    const invalid = validate(req.body);
    if (invalid) { res.status(400).json({ success: false, message: invalid }); return; }

    const updates: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (req.body.name !== undefined) {
      updates.push(`name = $${i++}`);
      params.push(String(req.body.name).trim());
    }
    if (req.body.slug !== undefined) {
      updates.push(`slug = $${i++}`);
      params.push(String(req.body.slug).trim());
    }

    // settings is MERGED, never replaced: `settings || $n::jsonb` keeps keys this
    // request did not mention. Overwriting the document would mean a client that
    // sends only a timezone silently drops the currency, which is the same class
    // of silent loss as a partial update clobbering a column.
    const settingsPatch: WorkspaceSettings = {};
    if (req.body.timezone !== undefined) {
      settingsPatch.timezone = req.body.timezone === null
        ? undefined
        : String(req.body.timezone).trim();
    }
    if (req.body.default_currency !== undefined) {
      settingsPatch.default_currency = req.body.default_currency === null
        ? undefined
        : String(req.body.default_currency).trim().toUpperCase();
    }
    // A key set to undefined is dropped by JSON.stringify, which is how an
    // explicit null CLEARS a setting rather than storing a null into it.
    const patchKeys = Object.keys(settingsPatch);
    if (patchKeys.length) {
      const cleared = patchKeys.filter(k => settingsPatch[k as keyof WorkspaceSettings] === undefined);
      const kept = JSON.stringify(settingsPatch);   // undefined keys drop out here

      // ONE assignment to `settings`, composed as a single expression, because
      // Postgres rejects "multiple assignments to same column" in one UPDATE.
      // Clearing a key and setting another in the same request is an ordinary
      // thing for a settings form to do, and building it as two assignments
      // produced a masked 500 — caught by the test below before it shipped.
      // Removals apply first, then the merge, so clearing and re-setting the
      // same key in one request ends with the new value rather than nothing.
      let expression = 'settings';
      for (const key of cleared) {
        expression = `${expression} - $${i++}::text`;
        params.push(key);
      }
      if (kept !== '{}') {
        expression = `(${expression}) || $${i++}::jsonb`;
        params.push(kept);
      }
      updates.push(`settings = ${expression}`);
    }

    if (!updates.length) {
      res.status(400).json({ success: false, message: 'No fields to update' });
      return;
    }

    updates.push('updated_at = NOW()');
    params.push(tenantId);

    const result = await pool.query(
      `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${i}
       RETURNING id, name, slug, settings, created_at, updated_at`,
      params,
    );
    if (!result.rows[0]) {
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }
    res.json({ success: true, data: shape(result.rows[0]) });
  } catch (error) {
    // tenants_slug_key is a unique INDEX created in migration 022 — note it does
    // NOT appear in pg_constraint, which makes it easy to miss when auditing.
    // Two workspaces sharing a slug would make login's `needsWorkspace` list
    // ambiguous, so the collision is a real refusal the caller can act on, not a
    // server fault. 409 matches deleteContact's 23503 handling and the duplicate
    // -email handling in contactsController.
    const e = error as { code?: string; constraint?: string };
    if (e.code === '23505' && e.constraint === 'tenants_slug_key') {
      res.status(409).json({
        success: false,
        message: 'That slug is already taken by another workspace',
      });
      return;
    }
    next(error);
  }
};

/**
 * The workspace's default deal currency, or null when unset.
 *
 * Used by createDeal so the setting actually drives new deals rather than only
 * displaying in Settings — the difference between a real preference and a
 * decorative one.
 */
export async function workspaceDefaultCurrency(tenantId: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT settings->>'default_currency' AS currency FROM tenants WHERE id = $1`,
    [tenantId],
  );
  return result.rows[0]?.currency ?? null;
}
