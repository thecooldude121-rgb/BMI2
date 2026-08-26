import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

/**
 * Authentication and workspace resolution.
 *
 * This CRM is the identity provider for two future platforms (Lead Generation
 * and HRMS) over SSO, so ALL workspace-resolution logic lives here, server-side.
 * A client — this frontend or another platform — sends credentials and gets back
 * either a token or the set of workspaces to choose from. It never decides which
 * workspace a session belongs to, and it can never assert one.
 */

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
};

// Cast: jsonwebtoken types expiresIn as a `StringValue` template literal that an
// env-var string cannot narrow to.
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

interface UserRow {
  id: number | string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  department: string | null;
  avatar_url: string | null;
  tenant_id: string;
  workspace_name?: string;
  workspace_slug?: string;
}

/**
 * Mint a session token.
 *
 * `workspace_id` is the CANONICAL claim. The database column is still
 * `tenant_id` (that rename is tracked separately and touches 22 columns), so the
 * mapping happens here and in the auth middleware — two places, both deliberate
 * — rather than leaking the internal name into the external SSO contract.
 *
 * Nothing else may carry workspace scope. The API derives it from this claim
 * only, never from a query parameter or body field, or the DB-level
 * UNIQUE(tenant_id, email) would be enforced in Postgres and bypassable at the
 * API.
 */
function signToken(user: UserRow): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      workspace_id: user.tenant_id,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function safeUser(user: UserRow) {
  const { password_hash: _ignored, ...rest } = user;
  return { ...rest, workspace_id: user.tenant_id };
}

/**
 * Which workspace does a new registration join?
 *
 * Replaces `SELECT id FROM tenants ORDER BY created_at LIMIT 1` — "first
 * workspace wins", an implicit default that silently misroutes every signup the
 * moment a second workspace exists.
 *
 * Explicit rules, and it fails loudly rather than guessing:
 *   - a slug was supplied      -> that workspace, or 404
 *   - exactly one exists       -> that one (unambiguous, not "first")
 *   - several exist, no slug   -> 400 asking for one
 *   - none exist               -> 500; the deployment is not provisioned
 */
async function resolveWorkspaceForRegistration(
  slug: string | undefined,
): Promise<{ id: string } | { error: { status: number; message: string } }> {
  if (slug) {
    const found = await pool.query('SELECT id FROM tenants WHERE slug = $1', [slug]);
    if (!found.rows[0]) {
      return { error: { status: 404, message: `No workspace with slug "${slug}"` } };
    }
    return { id: found.rows[0].id };
  }

  const all = await pool.query('SELECT id, slug FROM tenants');
  if (all.rows.length === 1) return { id: all.rows[0].id };
  if (all.rows.length === 0) {
    return { error: { status: 500, message: 'No workspace is configured on this deployment' } };
  }
  return {
    error: {
      status: 400,
      message: `workspace_slug is required: this deployment has ${all.rows.length} workspaces`,
    },
  };
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, first_name, last_name, department, workspace_slug } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }
    if (String(password).length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      return;
    }

    const resolved = await resolveWorkspaceForRegistration(workspace_slug);
    if ('error' in resolved) {
      res.status(resolved.error.status).json({ success: false, message: resolved.error.message });
      return;
    }
    const workspaceId = resolved.id;

    // Scoped to the workspace, matching UNIQUE(tenant_id, lower(email)) from
    // migration 022. The old check was global, so one person could never join a
    // second workspace — the spec explicitly allows that.
    const existing = await pool.query(
      'SELECT id FROM users WHERE tenant_id = $1 AND lower(email) = lower($2)',
      [workspaceId, email],
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: 'That email is already registered in this workspace' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    // Self-registration always gets the baseline 'sales' role — elevated roles
    // (admin/manager/hr) can only be granted by an existing admin, never by the
    // signup payload itself.
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, department, tenant_id)
       VALUES ($1, $2, $3, $4, 'sales', $5, $6)
       RETURNING id, email, password_hash, first_name, last_name, role, department, avatar_url, tenant_id`,
      [email, password_hash, first_name, last_name, department, workspaceId],
    );

    const user = result.rows[0] as UserRow;
    res.status(201).json({ success: true, token: signToken(user), user: safeUser(user) });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/login
 *
 * Body: { email, password, workspace_id? }
 *
 * PASSWORD FIRST, THEN DISCLOSURE. The candidate set is every active user with
 * this email across all workspaces, but a workspace is only ever named in the
 * response if the supplied password actually verified against THAT user's hash.
 *
 * Doing it the other way round — listing the workspaces an email belongs to and
 * then asking for a password — turns this endpoint into a way to enumerate which
 * organisations any address is a member of. That is a disclosure bug even though
 * no session is issued, so the ordering here is load-bearing, not stylistic.
 *
 * Outcomes:
 *   no password matches      -> 401, identical message whether or not the email exists
 *   exactly one matches      -> 200 { token, user }
 *   several match            -> 200 { needsWorkspace: true, workspaces: [...] }
 *                               and the client re-posts with workspace_id
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, workspace_id } = req.body;
    if (!email || !password) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const candidates = await pool.query(
      `SELECT u.*, t.name AS workspace_name, t.slug AS workspace_slug
         FROM users u
         JOIN tenants t ON t.id = u.tenant_id
        WHERE lower(u.email) = lower($1) AND u.is_active = true`,
      [email],
    );

    // Verify against every candidate BEFORE anything is disclosed.
    const verified: UserRow[] = [];
    for (const row of candidates.rows as UserRow[]) {
      if (await bcrypt.compare(password, row.password_hash)) verified.push(row);
    }

    if (verified.length === 0) {
      // Same message for "no such email" and "wrong password" — distinguishing
      // them tells an attacker which addresses are registered.
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // A workspace was chosen: honour it only if the password verified for THAT
    // workspace. Trusting the id alone would let a caller pick any workspace
    // from the list and be handed a session in it.
    if (workspace_id) {
      const chosen = verified.find(u => u.tenant_id === workspace_id);
      if (!chosen) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }
      await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [chosen.id])
        .catch(() => { /* column may not exist yet; never fail a login over telemetry */ });
      res.json({ success: true, token: signToken(chosen), user: safeUser(chosen) });
      return;
    }

    if (verified.length === 1) {
      const user = verified[0];
      await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id])
        .catch(() => { /* see above */ });
      res.json({ success: true, token: signToken(user), user: safeUser(user) });
      return;
    }

    // Ambiguous. Only workspaces whose password verified are named, and no token
    // is issued until one is chosen.
    res.json({
      success: true,
      needsWorkspace: true,
      workspaces: verified.map(u => ({
        id: u.tenant_id,
        name: u.workspace_name,
        slug: u.workspace_slug,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request & { user?: any }, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Scoped to the workspace in the token as well as the user id. The id alone
    // is sufficient today, but scoping every read the same way means no query in
    // this codebase reads a user row without a workspace filter.
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.department, u.avatar_url,
              u.is_active, u.tenant_id, u.tenant_id AS workspace_id
         FROM users u
        WHERE u.id = $1 AND u.tenant_id = $2`,
      [req.user?.id, req.user?.workspace_id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
