import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { getEmailService } from '../services/email';

/**
 * Workspace invites.
 *
 * Registration is invite-only (migration 024), so this is how an account comes
 * to exist. Deliberately backend-only for now: the Settings module will provide
 * the UI, and leaving the endpoint unbuilt would have meant either keeping open
 * registration or having no way to onboard anyone.
 *
 * DELIVERY. The invite is emailed through EmailService. Until a sender domain is
 * provisioned the configured transport is the log transport, which renders the
 * message to the log and does NOT deliver it — so the response still reports
 * `email_sent: false` and still returns the accept URL for the admin to pass on
 * by hand. That is the honest state of the feature, not a placeholder: the send
 * is attempted, and what actually happened is what gets reported.
 *
 * The invite is NOT rolled back when delivery fails. The record is valid and the
 * link works; losing it because a mail provider was briefly down would be worse
 * than an admin having to re-send. `email_sent` tells the caller which happened.
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
    const acceptUrl = `${appUrl}/register?invite=${token}`;

    // Who is inviting, for the email body. Scoped to the workspace like every
    // other read; falls back to a neutral phrase rather than inventing a name.
    const inviterRow = req.user?.id
      ? await pool.query(
          `SELECT TRIM(CONCAT(first_name, ' ', last_name)) AS name
             FROM users WHERE id = $1 AND tenant_id = $2`,
          [req.user.id, workspaceId],
        )
      : null;
    const workspaceRow = await pool.query('SELECT name FROM tenants WHERE id = $1', [workspaceId]);

    const mail = getEmailService();
    const sent = await mail.sendTransactional({
      to: email,
      subject: `You've been invited to ${workspaceRow.rows[0]?.name ?? 'a workspace'} on BMI Platform`,
      template: 'workspace-invite',
      vars: {
        workspaceName: workspaceRow.rows[0]?.name ?? 'your workspace',
        inviterName: inviterRow?.rows[0]?.name || 'An administrator',
        acceptUrl,
        expiresInDays: ttl,
      },
    });

    // `delivers` is what separates "the provider accepted it" from "nothing was
    // actually emailed". The log transport returns ok:true because it did its job;
    // reporting that as email_sent would be a fabricated success.
    const emailDelivered = sent.ok && mail.delivers;
    if (!sent.ok) {
      console.error(`invite ${inserted.rows[0].id}: email send failed — ${sent.error}`);
    }

    res.status(201).json({
      success: true,
      invite: inserted.rows[0],
      email_sent: emailDelivered,
      // Still returned while nothing is delivered, so an admin has a way to get
      // the link to the invitee at all. Once a real transport is configured this
      // should be dropped from the response — a working invite link in an API
      // payload is a secret sitting somewhere it does not need to be.
      ...(emailDelivered ? {} : { accept_url: acceptUrl }),
      note: emailDelivered
        ? undefined
        : mail.delivers
          ? 'Email delivery failed — send this link to the invitee yourself.'
          : `Email transport is "${mail.transportName}", which does not deliver mail. Send this link to the invitee yourself.`,
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
