import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  /**
   * `workspace_id` is the canonical token claim (the external SSO contract).
   * `tenant_id` is the same value under the name the database still uses, kept
   * so the 22-column rename can happen later without touching every controller.
   * Both are set here from the ONE claim — see the mapping in `protect`.
   */
  user?: { id: string; email: string; role: string; workspace_id: string; tenant_id: string };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
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
      workspace_id?: string; tenant_id?: string;
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

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      workspace_id: workspaceId,
      tenant_id: workspaceId,
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
