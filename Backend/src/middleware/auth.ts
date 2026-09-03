import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

export interface AuthRequest extends Request {
  /**
   * `workspace_id` is the canonical token claim (the external SSO contract).
   * `tenant_id` is the same value under the name the database still uses, kept
   * so the 22-column rename can happen later without touching every controller.
   * Both are set here from the ONE claim — see the mapping in `protect`.
   */
  user?: {
    id: string; email: string; role: string; workspace_id: string; tenant_id: string;
    /**
     * Read live from the row alongside the auth check, so the four controllers
     * that need a display name (activities, deals, documents, tasks) do not each
     * query `users` again. See resolveActorName in those files.
     */
    first_name?: string; last_name?: string;
  };
}

/**
 * ASYNC, AND IT READS THE ACCOUNT. This used to verify the signature and expiry
 * and nothing else, which is why a demoted admin kept admin rights, a
 * deactivated user kept full access, and a password change revoked no other
 * session — each for up to JWT_EXPIRES_IN (7 days). See
 * TOKEN_VERSION_DESIGN.md.
 *
 * THE COST IS A NEW QUERY AND THERE WAS NOTHING TO RIDE ON — no middleware read
 * `users` before this. Measured against the live database, 200 runs: p50
 * 0.193ms, p95 0.379ms, p99 0.481ms. Against the project's "<2s for 95% of
 * interactions" that is ~0.02% of budget. A version claim cannot validate
 * itself, so catching a token that ANOTHER request invalidated requires a live
 * read; there is no variant of this that reads nothing.
 *
 * It also means the auth path now hard-depends on Postgres: if the database is
 * unreachable the API rejects everything rather than serving stale-but-signed
 * tokens. That is a deliberate change in failure mode.
 *
 * Express 4 does not catch a rejected promise from middleware, so everything
 * below stays inside one try/catch and answers 401 rather than hanging.
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');
    const decoded = jwt.verify(token, secret) as {
      id: string; email: string; role: string;
      workspace_id?: string; tenant_id?: string; token_version?: number;
    };

    // THE single place a token claim becomes request scope. Nothing downstream
    // may read workspace scope from a query string, body field or header — if it
    // did, UNIQUE(tenant_id, email) would be enforced in Postgres and bypassable
    // at the API.
    //
    // `tenant_id` is accepted as a fallback only so tokens signed before the
    // claim was renamed do not 500; it can be dropped once none are in flight.
    const workspaceId = decoded.workspace_id ?? decoded.tenant_id;
    if (!workspaceId) {
      res.status(401).json({ success: false, message: 'Token is missing workspace scope' });
      return;
    }

    // ── The live account read ────────────────────────────────────────────
    const account = await pool.query(
      `SELECT id, email, role, is_active, token_version, first_name, last_name
         FROM users WHERE id = $1 AND tenant_id = $2`,
      [decoded.id, workspaceId],
    );
    const row = account.rows[0];

    // No row: the account was deleted, or the token names a workspace it does
    // not belong to. Indistinguishable on purpose.
    if (!row) {
      res.status(401).json({ success: false, message: 'Your session is no longer valid. Please sign in again.' });
      return;
    }

    if (!row.is_active) {
      // Named plainly. The holder already knows which account this is, and
      // "invalid token" would send them to re-authenticate in a loop that
      // cannot succeed.
      res.status(401).json({ success: false, message: 'This account has been deactivated.' });
      return;
    }

    // A token minted before migration 036 carries no `token_version` claim.
    // Reading an absent claim as 0 is the rollout decision: every existing row
    // defaults to 0, so those tokens keep working — no global sign-out on
    // deploy — while any actual revocation moves the row to >= 1 and refuses
    // them here on the next request.
    //
    // REMOVE THIS FALLBACK once JWT_EXPIRES_IN (7 days) has elapsed since
    // deploy and no claimless tokens remain. A permanent "absent means 0" is a
    // permanent hole if the column default ever changes. Same treatment, and
    // same reason, as the tenant_id -> workspace_id claim fallback below.
    const claimedVersion = decoded.token_version ?? 0;
    if (claimedVersion !== row.token_version) {
      res.status(401).json({ success: false, message: 'Your session is no longer valid. Please sign in again.' });
      return;
    }

    req.user = {
      id: String(row.id),
      email: row.email,
      // THE ROLE COMES FROM THE ROW, NOT THE CLAIM. This is what closes the
      // stale-role window to zero rather than merely shortening it:
      // requireRole downstream reads live state without knowing anything
      // changed.
      role: row.role,
      workspace_id: workspaceId,
      tenant_id: workspaceId,
      first_name: row.first_name,
      last_name: row.last_name,
    };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Roles permitted to perform destructive or administrative actions.
 *
 * WHY THIS LIST, AND WHY IT IS SHORT. Until now `requireRole` was applied to
 * the three /invites routes and nowhere else, so all 13 other route files
 * enforced no role policy at all and any authenticated user could delete any
 * record — against CLAUDE.md's rule that "RBAC checks happen at the API layer,
 * not just the UI".
 *
 * There was no server-side permission matrix to restore, and the frontend's is
 * not one either: `utils/permissions.ts` uses a different role vocabulary
 * (sdr | senior_sdr | manager | admin) from the one the backend issues, covers
 * leads only, and is fed by a hardcoded stub user in CurrentUserContext rather
 * than the session — so it has never gated a real user. `AuthContext` has a
 * third, capitalised vocabulary of its own.
 *
 * So the policy enforced here is deliberately the narrow, no-lockout one:
 * DELETE and bulk actions require a manager or admin; create, read and update
 * stay open to every authenticated role. It matches the one policy the backend
 * already expressed (invites = admin|manager) and the shape of the frontend
 * leads matrix, where `leads.delete` and `leads.bulk_actions` are manager+
 * while `leads.edit_fields` is everyone. It cannot lock anyone out of daily
 * work: live workspaces hold `sales` and `manager` users, and `sales` keeps
 * everything except deletion.
 *
 * `sales` is the least-privileged role the backend actually issues. Note that
 * requireRole denies any role not in its list, so an unrecognised role — and
 * `users.role` has no CHECK constraint, so anything can be stored — is treated
 * as least-privileged rather than waved through. That is the safe direction.
 *
 * Row-level scoping (a `sales` user seeing only records they own) is NOT part
 * of this and remains an open product decision: it would change read behaviour
 * on every list endpoint and needs an owner_id backfill answer first.
 */
export const DESTRUCTIVE_ACTION_ROLES = ['admin', 'manager'] as const;

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
