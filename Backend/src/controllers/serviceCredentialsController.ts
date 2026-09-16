import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import {
  SERVICE_SCOPES, generateServiceKey, hashServiceKey, type ServiceScope,
} from '../middleware/serviceAuth';

/**
 * Service credentials — the keys another module uses to call this API.
 *
 * Issued and revoked by an admin, never self-service. The plaintext key is
 * returned EXACTLY ONCE, at creation or rotation, because only its hash is
 * stored; every read path below returns the prefix so a credential can be
 * identified on screen, and never anything that could be presented as a key.
 */

/** The prefix kept in the clear for identification — enough to recognise, not to use. */
const prefixOf = (key: string): string => key.slice(0, 12);

const PUBLIC_COLUMNS = `
  c.id, c.name, c.key_prefix, c.scopes, c.expires_at, c.last_used_at,
  c.revoked_at, c.created_at,
  (c.revoked_at IS NULL AND (c.expires_at IS NULL OR c.expires_at > NOW())) AS is_active,
  NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), '') AS created_by_name
`;

function invalidScopes(raw: unknown): string | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return `scopes must be a non-empty array; allowed: ${SERVICE_SCOPES.join(', ')}`;
  }
  const bad = raw.filter((s) => !SERVICE_SCOPES.includes(s as ServiceScope));
  if (bad.length) {
    return `unknown scope(s): ${bad.join(', ')}. Allowed: ${SERVICE_SCOPES.join(', ')}`;
  }
  return null;
}

/** GET /service-credentials — never returns a key or a hash. */
export const listServiceCredentials = async (
  req: AuthRequest, res: Response, next: NextFunction,
): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      `SELECT ${PUBLIC_COLUMNS}
         FROM service_credentials c
         LEFT JOIN users u ON u.id = c.created_by AND u.tenant_id = c.tenant_id
        WHERE c.tenant_id = $1
        ORDER BY c.created_at DESC
        LIMIT 200`,
      [tenantId],
    );
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      // Travels with the list so a create form is populated by the same
      // vocabulary the server enforces, rather than a copy that can drift.
      available_scopes: SERVICE_SCOPES,
    });
  } catch (error) { next(error); }
};

/** POST /service-credentials — issues a key, shown once. */
export const createServiceCredential = async (
  req: AuthRequest, res: Response, next: NextFunction,
): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const body = (req.body ?? {}) as Record<string, unknown>;

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) { res.status(400).json({ success: false, message: 'name is required' }); return; }
    if (name.length > 100) {
      res.status(400).json({ success: false, message: 'name must be 100 characters or fewer' });
      return;
    }

    const scopeError = invalidScopes(body.scopes);
    if (scopeError) { res.status(400).json({ success: false, message: scopeError }); return; }

    // Optional. Omitted means no expiry, which is the normal case for an
    // integration -- the whole point is that it does not break on a timer the
    // way the borrowed admin JWT did.
    let expiresAt: Date | null = null;
    if (body.expires_at !== undefined && body.expires_at !== null) {
      const parsed = new Date(String(body.expires_at));
      if (Number.isNaN(parsed.getTime())) {
        res.status(400).json({ success: false, message: 'expires_at must be an ISO date' });
        return;
      }
      expiresAt = parsed;
    }

    const key = generateServiceKey();
    const inserted = await pool.query(
      `INSERT INTO service_credentials (tenant_id, name, key_prefix, key_hash, scopes, expires_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, name, key_prefix, scopes, expires_at, created_at`,
      [tenantId, name, prefixOf(key), hashServiceKey(key), body.scopes as string[], expiresAt,
       Number.isInteger(req.user?.id as any) ? req.user?.id : Number(req.user?.id) || null],
    );

    res.status(201).json({
      success: true,
      data: {
        ...inserted.rows[0],
        // Shown once. There is no read path that can return it again.
        api_key: key,
      },
      notice:
        'Copy this key now — only a hash is stored, so it cannot be shown again. ' +
        'Send it as "Authorization: Bearer <key>" or "X-API-Key: <key>".',
    });
  } catch (error) {
    // (tenant_id, lower(name)) is unique among live credentials.
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({
        success: false,
        message: 'A service credential with that name already exists in this workspace',
      });
      return;
    }
    next(error);
  }
};

/**
 * POST /service-credentials/:id/rotate — new key, same credential.
 *
 * The row keeps its id, name and scopes, so whatever the credential authorises
 * does not silently change during a rotation; only the secret moves. The
 * previous key stops working immediately, which is the point.
 */
export const rotateServiceCredential = async (
  req: AuthRequest, res: Response, next: NextFunction,
): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const key = generateServiceKey();
    const updated = await pool.query(
      `UPDATE service_credentials
          SET key_prefix = $3, key_hash = $4, updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND revoked_at IS NULL
        RETURNING id, name, key_prefix, scopes, expires_at, created_at`,
      [req.params.id, tenantId, prefixOf(key), hashServiceKey(key)],
    );
    if (!updated.rows[0]) {
      res.status(404).json({ success: false, message: 'No active service credential with that id in this workspace' });
      return;
    }
    res.json({
      success: true,
      data: { ...updated.rows[0], api_key: key },
      notice: 'The previous key stopped working immediately. Update the calling module with this one.',
    });
  } catch (error) { next(error); }
};

/**
 * DELETE /service-credentials/:id — revoke.
 *
 * A timestamp, not a delete, so a revoked credential stays visible and
 * auditable rather than vanishing from the list it was on yesterday.
 */
export const revokeServiceCredential = async (
  req: AuthRequest, res: Response, next: NextFunction,
): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const updated = await pool.query(
      `UPDATE service_credentials SET revoked_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2 AND revoked_at IS NULL
        RETURNING id`,
      [req.params.id, tenantId],
    );
    if (!updated.rows[0]) {
      res.status(404).json({ success: false, message: 'No active service credential with that id in this workspace' });
      return;
    }
    res.json({ success: true, message: 'Service credential revoked' });
  } catch (error) { next(error); }
};
