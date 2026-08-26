import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

/**
 * Workspace invites.
 *
 * Registration is invite-only (migration 024), so this is how an account comes
 * to exist. Deliberately backend-only for now: the Settings module will provide
 * the UI, and leaving the endpoint unbuilt would have meant either keeping open
 * registration or having no way to onboard anyone.
 *
 * EMAIL DELIVERY IS NOT WIRED YET. `createInvite` returns the accept URL in its
 * response so an admin can pass it on out of band, and says so in the payload
 * rather than implying a mail was sent. When EmailService lands, the send goes
 * here and the URL stops being returned.
 */

/** Roles an invite may grant. Mirrors what the app understands. */
const ASSIGNABLE_ROLES = ['sales', 'manager', 'hr', 'admin'] as const;

/** Long enough that guessing is hopeless; url-safe so it survives an email client. */
const TOKEN_BYTES = 32;
const DEFAULT_TTL_DAYS = 7;

/**
 * Only the HASH is stored. A leaked invites table is then a list of digests, not
 * a set of working links — the same rule that will apply to password-reset
 * tokens, and the reason lookup is by hash rather than by comparing a secret.
 */
const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const createInvite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workspaceId = requireTenantId(req);
    const { email, role = 'sales', expires_in_days } = req.body as {
      email?: string; role?: string; expires_in_days?: number;
    };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, message: 'A valid email is required' });
      return;
    }
    if (!ASSIGNABLE_ROLES.includes(role as typeof ASSIGNABLE_ROLES[number])) {
      res.status(400).json({ success: false, message: `role must be one of: ${ASSIGNABLE_ROLES.join(', ')}` });
      return;
    }

    // Already a member of THIS workspace? Inviting again would either fail at
    // registration or imply a second account is possible.
    const existing = await pool.query(
      'SELECT 1 FROM users WHERE tenant_id = $1 AND lower(email) = lower($2)',
      [workspaceId, email],
    );
    if (existing.rowCount) {
      res.status(409).json({ success: false, message: 'That person is already a member of this workspace' });
      return;
    }

    const ttl = Math.min(Math.max(Number(expires_in_days) || DEFAULT_TTL_DAYS, 1), 30);
    const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url');

    // Re-inviting is normal, so supersede any open invite for this address
    // rather than colliding with the partial unique index.
    await pool.query(
      `UPDATE workspace_invites SET revoked_at = NOW()
        WHERE workspace_id = $1 AND lower(email) = lower($2)
          AND accepted_at IS NULL AND revoked_at IS NULL`,
      [workspaceId, email],
    );

    const inserted = await pool.query(
      `INSERT INTO workspace_invites (workspace_id, email, token_hash, role, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + ($6 || ' days')::interval)
       RETURNING id, email, role, expires_at, created_at`,
      [workspaceId, email, hashToken(token), role, req.user?.id ?? null, String(ttl)],
    );

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    res.status(201).json({
      success: true,
      invite: inserted.rows[0],
      // Returned because nothing emails it yet. Stated plainly so no one assumes
      // the invitee has been contacted.
      accept_url: `${appUrl}/register?invite=${token}`,
      email_sent: false,
      note: 'Email delivery is not configured yet — send this link to the invitee yourself.',
    });
  } catch (error) { next(error); }
};

export const listInvites = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workspaceId = requireTenantId(req);
    // No token or hash is ever returned — an admin listing invites must not be
    // able to recover a link they did not just create.
    const result = await pool.query(
      `SELECT i.id, i.email, i.role, i.expires_at, i.accepted_at, i.revoked_at, i.created_at,
              TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS invited_by_name,
              CASE
                WHEN i.accepted_at IS NOT NULL THEN 'accepted'
                WHEN i.revoked_at  IS NOT NULL THEN 'revoked'
                WHEN i.expires_at  < NOW()     THEN 'expired'
                ELSE 'pending'
              END AS status
         FROM workspace_invites i
         LEFT JOIN users u ON u.id = i.invited_by AND u.tenant_id = i.workspace_id
        WHERE i.workspace_id = $1
        ORDER BY i.created_at DESC
        LIMIT 200`,
      [workspaceId],
    );
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (error) { next(error); }
};

export const revokeInvite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const workspaceId = requireTenantId(req);
    const result = await pool.query(
      `UPDATE workspace_invites SET revoked_at = NOW()
        WHERE id = $1 AND workspace_id = $2 AND accepted_at IS NULL AND revoked_at IS NULL
        RETURNING id`,
      [req.params.id, workspaceId],
    );
    if (!result.rows[0]) {
      res.status(404).json({ success: false, message: 'No open invite with that id in this workspace' });
      return;
    }
    res.json({ success: true, message: 'Invite revoked' });
  } catch (error) { next(error); }
};

/** Shared with authController.register so the hashing rule lives in one place. */
export { hashToken };
