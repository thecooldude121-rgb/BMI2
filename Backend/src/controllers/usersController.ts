import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest, DESTRUCTIVE_ACTION_ROLES } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import {
  ASSIGNABLE_ROLES, PRIVILEGED_ROLES, canAssign, canActOn, rolesAssignableBy,
} from '../utils/roles';

/**
 * GET /api/v1/users
 *
 * `?include_inactive=true` also returns deactivated members.
 *
 * THE RESPONSE CARRIES THE ROLE RULES, so the client never re-implements them.
 * Two additions, both derived from `utils/roles.ts` — the same module
 * `PATCH /users/:id/role` and `POST /invites` enforce with:
 *
 *   - envelope `assignable_roles` — exactly what this caller may hand out.
 *     A manager's list has no `admin` in it, so the picker cannot offer an
 *     option the server would refuse.
 *   - per-row `can_change_role` — false when the caller may not touch that
 *     person, which is the "never act on someone above your own role" guard.
 *     The row with it false gets NO control, not a disabled one: a disabled
 *     control advertises an action that does not exist for you.
 *
 * Both are empty/false for a caller who cannot reach the endpoint at all,
 * because this route is deliberately ungated (assignment pickers need the
 * roster) while the role change is not.
 *
 * WHY THE SERVER AND NOT A MIRROR IN THE CLIENT. `invitableRolesFor()` in
 * `usersApi.ts` is that mirror, written for the invite form, and it has already
 * drifted: it lists sales/manager/admin and omits `hr`, which the server's
 * ASSIGNABLE_ROLES has always included. Two lists that must agree are two lists
 * that will disagree — so this one is served, not copied.
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

    const callerRole = String(req.user?.role ?? '');
    const mayManageRoles = (DESTRUCTIVE_ACTION_ROLES as readonly string[]).includes(callerRole);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        can_change_role: mayManageRoles && canActOn(callerRole, row.role),
      })),
      assignable_roles: mayManageRoles ? rolesAssignableBy(callerRole) : [],
    });
  } catch (error) { next(error); }
};

/**
 * Roles that keep a workspace administrable. Mirrors DESTRUCTIVE_ACTION_ROLES.
 *
 * Now imported from utils/roles rather than declared here, because the
 * role-change endpoint below has to count exactly the same set as deactivation
 * does — the invariant is "at least one active admin or manager", and two
 * definitions of "privileged" would let one path protect a set the other did
 * not.
 */

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

/**
 * PATCH /api/v1/users/:id/role   body: { role }
 *
 * The gap CLAUDE.md tracked: a role was set ONCE, by an invite or by
 * `db:seed:users`, and could never be changed. A workspace whose only
 * privileged user was a manager could not promote them, so `requireRole('admin')`
 * screens — the stage-configuration screen among them — were unreachable by
 * anyone in it, and the only route to an admin was a new account created by an
 * invite that `EMAIL_TRANSPORT=log` delivers nowhere.
 *
 * FOUR GUARDS, WRITTEN SEPARATELY ON PURPOSE. They fail independently and a
 * single combined condition would catch only the cases where they overlap —
 * the same reasoning as the two guards on deactivateUser above.
 *
 *   1. The NEW role must be at or below the caller's own (`canAssign`). This is
 *      the invites rule, and it is literally the same function: a manager who
 *      cannot invite an admin but can promote one has not been stopped from
 *      escalating, only inconvenienced. 403.
 *
 *   2. The TARGET's CURRENT role must not be above the caller's (`canActOn`).
 *      Guard 1 alone bounds only what is handed out, which leaves the same
 *      escalation reachable from the other end: a manager cannot promote an
 *      admin, but could DEMOTE one to sales and remove the ceiling above
 *      themselves. 403.
 *
 *   3. The last active admin or manager cannot be demoted out of that set —
 *      by anyone, including themselves. Same invariant, same advisory lock and
 *      the same "count the OTHERS" query as deactivation, because these two
 *      endpoints can now break the invariant TOGETHER: one admin demoting
 *      while another deactivates, each reading a workspace that still has the
 *      other. Serializing them on the same key is what makes that impossible
 *      rather than unlikely. 409.
 *
 *   4. A no-op (already that role) returns 200 and writes nothing, so a
 *      double-submitted form does not bump a token_version twice and sign
 *      somebody out for no reason.
 *
 * SELF-DEMOTION IS ALLOWED WHEN SOMEBODY ELSE IS STILL PRIVILEGED, and this
 * deliberately differs from deactivateUser, which refuses self ALWAYS. The
 * difference is recoverability: deactivating yourself ends your session with no
 * way back in, while demoting yourself leaves you signed in and leaves another
 * admin able to reverse it — through this very endpoint, which did not exist
 * before. Guard 3 is what stops the version of it that is NOT recoverable.
 *
 * ON token_version: the bump here is for the CLIENT, not the control. The
 * server already reads the role from the row on every request
 * (`middleware/auth.ts` — "THE ROLE COMES FROM THE ROW, NOT THE CLAIM"), so a
 * role change takes effect on the very next request with a zero-length stale
 * window and needs no revocation to be enforced. What IS stale is the browser:
 * it caches the user object from login, so after a demotion it keeps offering
 * admin controls that now 403, and after a promotion it keeps hiding controls
 * the person may now use. Bumping forces a fresh sign-in, which is the cheap
 * way to make the two agree. That answers the open question CLAUDE.md recorded
 * against this endpoint — "whether a demotion should bump token_version so the
 * old role stops being honoured immediately" — and the answer is that the old
 * role is ALREADY not honoured; the bump buys client correctness, not security.
 */
export const changeUserRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const client = await pool.connect();
  try {
    const tenantId = requireTenantId(req);
    const callerRole = String(req.user?.role ?? '');
    const { role } = req.body as { role?: string };

    if (!role || !(ASSIGNABLE_ROLES as readonly string[]).includes(role)) {
      res.status(400).json({
        success: false,
        message: `role must be one of: ${ASSIGNABLE_ROLES.join(', ')}`,
      });
      return;
    }

    // Guard 1 — never above your own. Checked before the target is even looked
    // up: whether the caller may hand out this role does not depend on who
    // they are handing it to, and answering first means an unauthorised caller
    // learns nothing about who exists.
    if (!canAssign(callerRole, role)) {
      res.status(403).json({
        success: false,
        message: `A ${callerRole || 'user'} cannot assign the ${role} role. You can only assign roles at or below your own.`,
        assignable_roles: rolesAssignableBy(callerRole),
      });
      return;
    }

    // BEGIN before the lock, one COMMIT/ROLLBACK on every path: a client
    // released mid-transaction returns to the pool still holding the lock.
    await client.query('BEGIN');
    await lockWorkspaceMembership(client, tenantId);

    const target = await findMember(tenantId, req.params.id, client);
    if (!target) {
      await client.query('COMMIT');
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Guard 2 — you cannot reach above yourself, in either direction.
    if (!canActOn(callerRole, target.role)) {
      await client.query('COMMIT');
      res.status(403).json({
        success: false,
        message: `A ${callerRole || 'user'} cannot change the role of a ${target.role}.`,
      });
      return;
    }

    // Guard 4 — no-op. After the guards, so an unauthorised caller does not get
    // a 200 that confirms what role somebody holds.
    if (target.role === role) {
      await client.query('COMMIT');
      res.json({ success: true, data: target, message: `That account is already a ${role}` });
      return;
    }

    // Guard 3 — the last one standing. Counted INSIDE the lock and counting
    // OTHERS, exactly as deactivateUser does, and only when the change actually
    // removes the target from the privileged set: promoting a sales user, or
    // moving an admin to manager, cannot break the invariant and must not be
    // refused by it.
    const losesPrivilege = PRIVILEGED_ROLES.includes(target.role) && !PRIVILEGED_ROLES.includes(role);
    if (losesPrivilege) {
      const remaining = await client.query(
        `SELECT COUNT(*)::int AS n FROM users
          WHERE tenant_id = $1 AND is_active = true AND role = ANY($2::varchar[]) AND id <> $3`,
        [tenantId, PRIVILEGED_ROLES, target.id],
      );
      if (remaining.rows[0].n === 0) {
        await client.query('COMMIT');
        res.status(409).json({
          success: false,
          message: String(target.id) === String(req.user?.id)
            ? 'You are the last admin or manager in this workspace — promote someone else before changing your own role'
            : 'Cannot demote the last admin or manager in this workspace',
        });
        return;
      }
    }

    // Scoped to id AND tenant_id. A bump scoped only by tenant would sign out
    // the whole workspace including the acting admin — the same footgun called
    // out on deactivateUser.
    const updated = await client.query(
      `UPDATE users
          SET role = $3, token_version = token_version + 1, updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2
        RETURNING id, first_name, last_name, email, role, is_active`,
      [target.id, tenantId, role],
    );
    await client.query('COMMIT');
    res.json({
      success: true,
      data: updated.rows[0],
      message: `Role changed from ${target.role} to ${role}. They will need to sign in again.`,
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    next(error);
  } finally {
    client.release();
  }
};
