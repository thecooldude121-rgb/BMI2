import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { hashToken } from './invitesController';

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
  /** Optional so a row selected before migration 036 still satisfies the type. */
  token_version?: number;
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
      // The version this token was minted at. `protect` compares it against the
      // row on every request, so anything that increments the row ends this
      // session. Absent on tokens issued before migration 036 — read as 0
      // there, which is why the column defaults to 0. See
      // TOKEN_VERSION_DESIGN.md.
      token_version: user.token_version ?? 0,
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
 * REGISTRATION IS INVITE-ONLY.
 *
 * It used to be open: unauthenticated, any email domain, and it resolved
 * "exactly one workspace exists -> join it". One curl from a gmail.com address
 * created a `sales` account inside the tenant that could immediately read all 20
 * contacts, 15 companies, 24 deals and 15 tasks. That defeated the query-layer
 * isolation at the front door — token-only scoping is worth nothing if workspace
 * membership is available from a public form.
 *
 * The invite now supplies the workspace AND the role, so "which workspace does a
 * signup join" is no longer a defaulting question at all: it is answered by
 * whoever issued the invite. There is deliberately no fallback path.
 */
interface RedeemableInvite {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
}

async function redeemableInvite(
  token: unknown,
  submittedEmail: string,
): Promise<{ invite: RedeemableInvite } | { error: { status: number; message: string } }> {
  if (typeof token !== 'string' || token.length < 20) {
    return { error: { status: 400, message: 'A valid invite is required to create an account' } };
  }

  // Looked up by hash — the token itself never appears in a query or a log.
  const found = await pool.query(
    `SELECT id, workspace_id, email, role, expires_at, accepted_at, revoked_at
       FROM workspace_invites WHERE token_hash = $1`,
    [hashToken(token)],
  );
  const invite = found.rows[0];

  // One message for every rejection. Distinguishing "no such invite" from
  // "expired" from "already used" tells a probe which tokens once existed.
  const reject = { error: { status: 400, message: 'That invite is invalid, expired, or already used' } };
  if (!invite) return reject;
  if (invite.accepted_at || invite.revoked_at) return reject;
  if (new Date(invite.expires_at).getTime() < Date.now()) return reject;

  // The invite is bound to one address, so a leaked link cannot be redeemed by
  // someone else — which is the difference between an invite and a signup code.
  if (invite.email.trim().toLowerCase() !== submittedEmail.trim().toLowerCase()) {
    return { error: { status: 400, message: 'This invite was issued for a different email address' } };
  }

  return { invite };
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const { email, password, first_name, last_name, department, invite_token } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }
    if (String(password).length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      return;
    }

    const redeemed = await redeemableInvite(invite_token, String(email));
    if ('error' in redeemed) {
      res.status(redeemed.error.status).json({ success: false, message: redeemed.error.message });
      return;
    }
    const { invite } = redeemed;

    await client.query('BEGIN');

    // Claim the invite FIRST, and only if it is still open. Two requests racing
    // the same link both pass the read above; this UPDATE is what makes it
    // single-use, because the second one matches no row.
    const claimed = await client.query(
      `UPDATE workspace_invites SET accepted_at = NOW()
        WHERE id = $1 AND accepted_at IS NULL AND revoked_at IS NULL
        RETURNING id`,
      [invite.id],
    );
    if (!claimed.rows[0]) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'That invite is invalid, expired, or already used' });
      return;
    }

    // Scoped to the workspace, matching UNIQUE(tenant_id, lower(email)).
    const existing = await client.query(
      'SELECT id FROM users WHERE tenant_id = $1 AND lower(email) = lower($2)',
      [invite.workspace_id, email],
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({ success: false, message: 'That email is already registered in this workspace' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    // The ROLE COMES FROM THE INVITE, never from the request body. Previously
    // self-registration hardcoded 'sales'; now the inviter decides, and an
    // invitee still cannot choose their own privileges.
    const result = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, department, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, password_hash, first_name, last_name, role, department, avatar_url, tenant_id, token_version`,
      [email, password_hash, first_name, last_name, invite.role, department, invite.workspace_id],
    );

    await client.query('COMMIT');
    const user = result.rows[0] as UserRow;
    res.status(201).json({ success: true, token: signToken(user), user: safeUser(user) });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
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
    // created_at and last_login_at are here for the profile page, which shows
    // "Member since" and "Last login". Both are REAL columns on users, not
    // derived — the page previously rendered invented values for both.
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.department, u.avatar_url,
              u.is_active, u.created_at, u.last_login_at,
              u.tenant_id, u.tenant_id AS workspace_id
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

/**
 * PATCH /api/v1/auth/me — the signed-in user edits their own name and email.
 *
 * SELF ONLY. There is no `:id`: the row updated is the one the token names, so
 * this cannot be used to edit a colleague, and no role check is needed because
 * everyone may edit themselves.
 *
 * NO EMAIL CONFIRMATION STEP, deliberately. A verification link cannot be
 * delivered — EMAIL_TRANSPORT is `log`, which renders to the console and sends
 * nothing — so the honest choice is to change the address directly rather than
 * show a "check your inbox" screen for a message that will never arrive. That
 * is the same stance invites already take. It is a real simplification and is
 * recorded as such; when a transport is configured, this should become
 * request-then-confirm.
 */
export const updateMe = async (req: Request & { user?: any }, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.workspace_id ?? req.user?.tenant_id;
    if (!userId || !tenantId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { first_name, last_name, email } = req.body ?? {};

    // Same validation shape on every field that is present. An omitted field is
    // left alone; a field explicitly blanked is refused, because users.first_name
    // and last_name are NOT NULL and a blank email would orphan the account.
    for (const [field, value] of [['first_name', first_name], ['last_name', last_name]] as const) {
      if (value !== undefined && !String(value ?? '').trim()) {
        res.status(400).json({ success: false, message: `${field} cannot be blank` });
        return;
      }
      if (value !== undefined && String(value).trim().length > 50) {
        // users.first_name / last_name are VARCHAR(50); a longer value would be
        // a raw 22001 masked as a 500.
        res.status(400).json({ success: false, message: `${field} must be 50 characters or fewer` });
        return;
      }
    }
    if (email !== undefined) {
      const trimmed = String(email ?? '').trim();
      if (!trimmed) { res.status(400).json({ success: false, message: 'email cannot be blank' }); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        res.status(400).json({ success: false, message: 'That is not a valid email address' });
        return;
      }
      if (trimmed.length > 150) {
        res.status(400).json({ success: false, message: 'email must be 150 characters or fewer' });
        return;
      }
    }

    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (first_name !== undefined) { updates.push(`first_name = $${i++}`); params.push(String(first_name).trim()); }
    if (last_name !== undefined)  { updates.push(`last_name = $${i++}`);  params.push(String(last_name).trim()); }
    if (email !== undefined)      { updates.push(`email = $${i++}`);      params.push(String(email).trim()); }

    if (!updates.length) {
      res.status(400).json({ success: false, message: 'No fields to update' });
      return;
    }
    updates.push('updated_at = NOW()');
    params.push(userId, tenantId);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')}
        WHERE id = $${i++} AND tenant_id = $${i}
        RETURNING id, email, first_name, last_name, role, department, avatar_url, is_active,
                  created_at, last_login_at, tenant_id`,
      params,
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    res.json({ success: true, data: safeUser(result.rows[0]) });
  } catch (error) {
    // users_workspace_email_key is UNIQUE (tenant_id, email) — a unique INDEX
    // from migration 022, so it does not appear in pg_constraint. Taking a
    // colleague's address is a legitimate refusal the caller can act on, not a
    // server fault; same 409 shape as the duplicate-contact-email handling.
    // The constraint is workspace-scoped, so this discloses nothing about any
    // other workspace, and the same address stays free in all of them.
    const e = error as { code?: string; constraint?: string };
    if (e.code === '23505' && e.constraint === 'users_workspace_email_key') {
      res.status(409).json({
        success: false,
        message: 'Someone in this workspace already uses that email address',
      });
      return;
    }
    next(error);
  }
};

/**
 * POST /api/v1/auth/change-password
 *
 * Verifies the current password before setting a new one, so a stolen token
 * alone cannot change the credential it was minted from.
 *
 * SIGNS EVERY OTHER SESSION OUT. This comment used to say the opposite, and
 * said so at length: JWTs are stateless, `protect` only checked signature and
 * expiry, so a stolen token stayed live for up to JWT_EXPIRES_IN (7 days) after
 * its owner changed the password. Migration 036 closed that — `token_version` is
 * bumped in the UPDATE below and `protect` compares it against the account, so
 * every token minted before this call is refused on its next request.
 *
 * CLIENT CONTRACT: the caller's own token is invalidated too, so the fresh one
 * in the response MUST replace the stored session token. A client that ignores
 * it 401s on its very next request.
 */
export const changePassword = async (req: Request & { user?: any }, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.workspace_id ?? req.user?.tenant_id;
    if (!userId || !tenantId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { current_password, new_password } = req.body ?? {};
    if (!current_password || !new_password) {
      res.status(400).json({ success: false, message: 'current_password and new_password are required' });
      return;
    }
    // Matches the minimum register already enforces, so the two paths cannot
    // disagree about what a valid password is.
    if (String(new_password).length < 8) {
      res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
      return;
    }
    if (String(new_password) === String(current_password)) {
      res.status(400).json({ success: false, message: 'The new password must be different from the current one' });
      return;
    }

    const found = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = $1 AND tenant_id = $2',
      [userId, tenantId],
    );
    if (!found.rows[0]) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    const matches = await bcrypt.compare(String(current_password), found.rows[0].password_hash);
    if (!matches) {
      // Naming the real reason is right here, unlike login: the caller is
      // already authenticated as this account, so "your current password is
      // wrong" discloses nothing they do not know. The rate limiter is what
      // stops this being an oracle for guessing it.
      res.status(400).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    const hash = await bcrypt.hash(String(new_password), 10);

    // Bump the version IN THE UPDATE, so every other token for this account is
    // refused on its next request. `token_version + 1` is computed inside the
    // statement rather than read and written back: two concurrent bumps cannot
    // then read the same value and lose one — the read-then-write mistake this
    // project already paid for once with MAX(id) + 1.
    const updated = await pool.query(
      `UPDATE users
          SET password_hash = $1, token_version = token_version + 1, updated_at = NOW()
        WHERE id = $2 AND tenant_id = $3
        RETURNING id, email, password_hash, first_name, last_name, role, department,
                  avatar_url, tenant_id, token_version`,
      [hash, userId, tenantId],
    );

    // THE CALLER STAYS SIGNED IN. They have just proved knowledge of the current
    // password, so signing them out buys nothing and costs a re-login at the
    // moment they were being careful. Their own token is now stale like every
    // other, so a fresh one is issued here.
    //
    // CLIENT CONTRACT: the client MUST replace its stored token with this one.
    // Ignoring it means the next request 401s.
    res.json({
      success: true,
      message: 'Password updated',
      token: signToken(updated.rows[0]),
      // Now true, and actually true — this used to be a disclaimer.
      other_sessions_signed_out: true,
    });
  } catch (error) { next(error); }
};
