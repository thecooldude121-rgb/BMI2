import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

/**
 * GET /api/v1/users
 *
 * `?include_inactive=true` also returns deactivated members.
 *
 * THE DEFAULT IS DELIBERATELY UNCHANGED. Every existing caller — owner pickers,
 * assignment dropdowns — wants active people only, and quietly widening this
 * would start offering deactivated colleagues as assignees everywhere. The
 * Settings user list is the one screen that needs the full roster, because a
 * screen for managing deactivation cannot be the one screen that hides
 * deactivated users, so it opts in explicitly.
 */
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const includeInactive = String(req.query.include_inactive ?? '').toLowerCase() === 'true';

    const result = await pool.query(
      `SELECT id, first_name, last_name, email, role, department, is_active, last_login_at, created_at
         FROM users
        WHERE tenant_id = $1 ${includeInactive ? '' : 'AND is_active = true'}
        ORDER BY is_active DESC, first_name`,
      [tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

/** Roles that keep a workspace administrable. Mirrors DESTRUCTIVE_ACTION_ROLES. */
const PRIVILEGED_ROLES = ['admin', 'manager'];

/**
 * Shared by deactivate and reactivate: find the target INSIDE the caller's
 * workspace. A user in another workspace must be indistinguishable from one
 * that does not exist, so this returns null and the caller answers 404.
 */
async function findMember(tenantId: string, id: string, db: Queryable = pool) {
  const result = await db.query(
    'SELECT id, first_name, last_name, email, role, is_active FROM users WHERE id = $1 AND tenant_id = $2',
    [id, tenantId],
  );
  return result.rows[0] ?? null;
}

/** Anything that can run a query — the pool, or a client inside a transaction. */
type Queryable = { query: (sql: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }> };

/**
 * Serialize privileged-membership changes within ONE workspace.
 *
 * THE RACE THIS CLOSES, measured before the fix: two admins deactivating each
 * other simultaneously each read "one other privileged member remains" — A sees
 * B, B sees A — and both proceed. Seven of eight trials left the workspace with
 * ZERO active admins or managers: unable to invite, unable to change its
 * settings, unable to promote anyone, and with nothing in the product able to
 * undo it from the inside. Guard 2 was a check-then-write, and the count it
 * checked was stale by the time the write landed.
 *
 * Same pattern as the concurrent company-import duplicate fix: hold the lock
 * across the CHECK and the WRITE so the second request reads committed state.
 * Keyed on the workspace rather than the target, because the invariant is
 * workspace-wide — "at least one active admin or manager" — so two deactivations
 * of DIFFERENT users in the same workspace must still serialize against each
 * other. That is the whole race.
 *
 * The two-int4 form with a literal namespace as the first key keeps this lock
 * space distinct from companiesController's, which uses hashtext(tenant) first.
 *
 * `_xact` releases on commit or rollback, so there is no unlock to forget — but
 * it must be taken inside a transaction, and every exit path below must end the
 * transaction or the client returns to the pool still holding it.
 */
async function lockWorkspaceMembership(db: Queryable, tenantId: string): Promise<void> {
  await db.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', ['users_privileged', tenantId]);
}

/**
 * POST /api/v1/users/:id/deactivate — soft. Sets is_active = false; the row,
 * and everything it owns, stays.
 *
 * TWO INDEPENDENT GUARDS. They are written as separate checks on purpose
 * rather than one combined condition, because a single condition would only
 * catch the case where they overlap and would silently permit either one alone:
 *
 *   1. You cannot deactivate yourself — even when other admins exist. Locking
 *      yourself out is never what the click meant.
 *   2. You cannot remove the last active admin or manager — even when it is
 *      somebody else. A workspace with none cannot invite, cannot change its
 *      settings, and cannot promote anyone, and nothing in the product can undo
 *      that from the inside.
 *
 * Guard 2 counts admins and managers OTHER than the target, so deactivating an
 * ordinary member never trips it, and it does not assume the caller is
 * privileged — a token issued before a role change still passes requireRole
 * while its holder is no longer counted.
 */
export const deactivateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);

    // BEGIN before the lock, and one COMMIT/ROLLBACK on every path below: a
    // client released mid-transaction goes back into the pool still holding
    // this lock, and the next deactivation in that workspace would block until
    // the connection was recycled.
    await client.query('BEGIN');
    await lockWorkspaceMembership(client, tenantId);

    const target = await findMember(tenantId, req.params.id, client);
    if (!target) {
      await client.query('COMMIT');
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Guard 1 — self. Checked first because it is about who is asking, not
    // about the state of the workspace.
    if (String(target.id) === String(req.user?.id)) {
      await client.query('COMMIT');
      res.status(409).json({ success: false, message: 'You cannot deactivate your own account' });
      return;
    }

    // Guard 2 — the last one standing. Read INSIDE the lock, so a concurrent
    // deactivation in this workspace has either already committed (and is
    // counted) or is waiting behind us (and will re-read after we commit).
    const remaining = await client.query(
      `SELECT COUNT(*)::int AS n FROM users
        WHERE tenant_id = $1 AND is_active = true AND role = ANY($2::varchar[]) AND id <> $3`,
      [tenantId, PRIVILEGED_ROLES, target.id],
    );
    if (PRIVILEGED_ROLES.includes(target.role) && remaining.rows[0].n === 0) {
      await client.query('COMMIT');
      res.status(409).json({
        success: false,
        message: 'Cannot deactivate the last admin or manager in this workspace',
      });
      return;
    }

    if (!target.is_active) {
      await client.query('COMMIT');
      res.json({ success: true, data: target, message: 'That account was already deactivated' });
      return;
    }

    // Bump the TARGET's token_version so their existing sessions stop working
    // immediately rather than when their token happens to expire — up to 7 days
    // later. Scoped to id AND tenant_id: a bare bump, or one scoped by tenant,
    // would sign out the whole workspace including the acting admin.
    const updated = await client.query(
      `UPDATE users
          SET is_active = false, token_version = token_version + 1, updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2
        RETURNING id, first_name, last_name, email, role, is_active`,
      [target.id, tenantId],
    );
    await client.query('COMMIT');
    res.json({ success: true, data: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    next(error);
  } finally {
    client.release();
  }
};

/** POST /api/v1/users/:id/reactivate — the way back, so deactivation is not a trap. */
export const reactivateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const target = await findMember(tenantId, req.params.id);
    if (!target) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    // NO LOCK HERE, deliberately: reactivation only ADDS an active privileged
    // member, so it cannot break the "at least one" invariant no matter how it
    // interleaves with a concurrent deactivation.
    //
    // DELIBERATELY NO token_version BUMP. There is no live session to revoke —
    // the account was deactivated, so every token it held is already refused by
    // `protect`. Bumping would sign out nobody and would only invalidate the
    // tokens the user is about to be issued.
    const updated = await pool.query(
      `UPDATE users SET is_active = true, updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2
        RETURNING id, first_name, last_name, email, role, is_active`,
      [target.id, tenantId],
    );
    res.json({ success: true, data: updated.rows[0] });
  } catch (error) { next(error); }
};
