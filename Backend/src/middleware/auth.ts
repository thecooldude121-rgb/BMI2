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

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
