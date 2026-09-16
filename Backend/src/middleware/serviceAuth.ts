import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest, protect } from './auth';

/**
 * Machine authentication, for another module calling this API.
 *
 * WHY A SEPARATE MIDDLEWARE RATHER THAN TEACHING `protect` ABOUT KEYS.
 * If `protect` accepted API keys, EVERY route it guards would accept them —
 * about sixty of them — and the only thing standing between a leaked key and
 * the whole API would be a scope check nobody had written yet. This is opt-in
 * by construction instead: a route accepts a key only by naming this middleware
 * and the scope it requires. A route that does not mention it cannot be reached
 * with a key, and that stays true for routes added later by someone who has
 * never read this file.
 *
 * WHEN NO KEY IS PRESENT IT DELEGATES TO `protect`, unchanged. So a route using
 * this still behaves exactly as before for the browser: same JWT, same live
 * account read, same 401s. This widens what may authenticate; it narrows
 * nothing.
 *
 * TWO HEADERS ACCEPTED, mirroring what Lead Gen's own account-intelligence
 * endpoint does for the reverse direction — `Authorization: Bearer <key>` or
 * `X-API-Key: <key>`. The Bearer form is what Lead Gen's HTTP client already
 * sends, so the integration needs no special case; X-API-Key exists for callers
 * that prefer to keep Bearer for user tokens.
 *
 * A KEY IS TOLD APART FROM A JWT BY ITS PREFIX, not by trying to verify it as a
 * token first. A JWT has three dot-separated base64 segments and never starts
 * with `bmk_`, so the test is exact and cheap, and a malformed JWT still gets
 * the JWT error path rather than a confusing "invalid API key".
 */

/** Issued keys look like bmk_<43 base64url chars>. */
export const SERVICE_KEY_PREFIX = 'bmk_';
export const SERVICE_KEY_BYTES = 32;

/**
 * Every scope this CRM recognises, and the endpoint each one exists for. Adding
 * a value here does nothing on its own — the route has to opt in as well.
 */
export const SERVICE_SCOPES = ['contacts:write', 'deals:read'] as const;
export type ServiceScope = (typeof SERVICE_SCOPES)[number];

export interface ServiceIdentity {
  id: string;
  name: string;
  scopes: string[];
}

/** Only the hash is stored, so lookup is by hash and the key never hits a log. */
export const hashServiceKey = (key: string): string =>
  crypto.createHash('sha256').update(key).digest('hex');

export const generateServiceKey = (): string =>
  `${SERVICE_KEY_PREFIX}${crypto.randomBytes(SERVICE_KEY_BYTES).toString('base64url')}`;

/** Reads a presented key from either accepted header, or null if there is none. */
function presentedKey(req: AuthRequest): string | null {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    const value = header.slice(7).trim();
    if (value.startsWith(SERVICE_KEY_PREFIX)) return value;
  }
  const alt = req.headers['x-api-key'];
  if (typeof alt === 'string' && alt.trim()) return alt.trim();
  return null;
}

/**
 * Guards one route, accepting either a scoped service key or an ordinary user
 * session.
 *
 * MUST BE DECLARED BEFORE the router's `router.use(protect)` line, because
 * Express runs middleware in declaration order and `protect` would otherwise
 * reject a key-bearing request before this ever ran. The routes that use it say
 * so where they are declared.
 */
export function serviceKeyOrProtect(scope: ServiceScope) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const key = presentedKey(req);
    // No key at all: this is an ordinary request, handled exactly as before.
    if (!key) return protect(req, res, next);

    try {
      const { rows } = await pool.query(
        `SELECT id, tenant_id, name, scopes, expires_at, revoked_at
           FROM service_credentials WHERE key_hash = $1`,
        [hashServiceKey(key)],
      );
      const cred = rows[0];

      // ONE MESSAGE for unknown, revoked and expired, the same reasoning as
      // acceptInvite's single rejection: telling them apart tells a prober which
      // keys once existed.
      const unusable =
        !cred ||
        cred.revoked_at ||
        (cred.expires_at && new Date(cred.expires_at).getTime() < Date.now());
      if (unusable) {
        res.status(401).json({ success: false, message: 'Invalid or revoked API key' });
        return;
      }

      // The scope check is separate from the 401 on purpose: the caller IS
      // authenticated, it is simply not allowed to do this. 403 says that, and
      // naming the missing scope is safe — it discloses nothing the holder of a
      // valid key does not already know about its own credential.
      const scopes: string[] = cred.scopes ?? [];
      if (!scopes.includes(scope)) {
        res.status(403).json({
          success: false,
          message: `This API key does not carry the "${scope}" scope`,
        });
        return;
      }

      /**
       * The identity handed downstream.
       *
       * `id` is NOT a users.id and must never be written to a column that
       * references one. Both endpoints reachable with a key were checked and
       * read only workspace scope (via requireTenantId) — neither touches
       * req.user.id — so nothing today can misuse it. The `svc:` prefix makes a
       * future misuse fail loudly on an integer cast rather than silently
       * attributing a machine's write to whichever user happens to have that id.
       *
       * `role` is 'service', which is in no requireRole list anywhere, so a key
       * cannot satisfy a role-gated route even if one ever opts into this
       * middleware by mistake.
       */
      req.user = {
        id: `svc:${cred.id}`,
        email: `${cred.name} (service credential)`,
        role: 'service',
        workspace_id: cred.tenant_id,
        tenant_id: cred.tenant_id,
      };
      req.service = { id: cred.id, name: cred.name, scopes };

      // Fire-and-forget: an admin needs to see whether a credential is in use,
      // but a failed bookkeeping write must not fail the caller's request.
      pool
        .query('UPDATE service_credentials SET last_used_at = NOW() WHERE id = $1', [cred.id])
        .catch((err) => console.warn('[service-auth] last_used_at update failed:', err?.message));

      next();
    } catch (err) {
      next(err);
    }
  };
}
