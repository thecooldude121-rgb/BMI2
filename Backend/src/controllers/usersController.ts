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
async function findMember(tenantId: string, id: string) {
  const result = await pool.query(
    'SELECT id, first_name, last_name, email, role, is_active FROM users WHERE id = $1 AND tenant_id = $2',
    [id, tenantId],
  );
  return result.rows[0] ?? null;
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
  try {
    const tenantId = requireTenantId(req);
    const target = await findMember(tenantId, req.params.id);
    if (!target) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    // Guard 1 — self. Checked first because it is about who is asking, not
    // about the state of the workspace.
    if (String(target.id) === String(req.user?.id)) {
      res.status(409).json({ success: false, message: 'You cannot deactivate your own account' });
      return;
    }

    // Guard 2 — the last one standing. Evaluated on its own terms: how many
    // ACTIVE privileged members would remain if this one went?
    const remaining = await pool.query(
      `SELECT COUNT(*)::int AS n FROM users
        WHERE tenant_id = $1 AND is_active = true AND role = ANY($2::varchar[]) AND id <> $3`,
      [tenantId, PRIVILEGED_ROLES, target.id],
    );
    if (PRIVILEGED_ROLES.includes(target.role) && remaining.rows[0].n === 0) {
      res.status(409).json({
        success: false,
        message: 'Cannot deactivate the last admin or manager in this workspace',
      });
      return;
    }

    if (!target.is_active) {
      res.json({ success: true, data: target, message: 'That account was already deactivated' });
      return;
    }

    // Bump the TARGET's token_version so their existing sessions stop working
    // immediately, rather than when their token happens to expire — up to 7
    // days later. Without this, deactivation is a control that does not control
    // anything for a week.
    //
    // SCOPED TO id AND tenant_id, and this is the whole point: a bare
    // `UPDATE users SET token_version = token_version + 1`, or one scoped by
    // tenant, would sign out the entire workspace including the admin doing the
    // deactivating — and it would look like an outage, not a bug. A test reads
    // both rows and asserts the acting admin's version is untouched.
    //
    // `token_version + 1` is computed inside the UPDATE so concurrent bumps
    // cannot lose one.
    const updated = await pool.query(
      `UPDATE users
          SET is_active = false, token_version = token_version + 1, updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2
        RETURNING id, first_name, last_name, email, role, is_active`,
      [target.id, tenantId],
    );
    res.json({ success: true, data: updated.rows[0] });
  } catch (error) { next(error); }
};

/** POST /api/v1/users/:id/reactivate — the way back, so deactivation is not a trap. */
export const reactivateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const target = await findMember(tenantId, req.params.id);
    if (!target) { res.status(404).json({ success: false, message: 'User not found' }); return; }

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
