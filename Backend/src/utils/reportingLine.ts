import { pool } from '../config/database';
import type { PoolClient } from 'pg';

/**
 * The two invariants on `users.manager_id` that Postgres cannot express.
 *
 * Migration 041 carries what a constraint can: the FK, and a CHECK that nobody
 * is their own manager. Neither of the rules below is expressible declaratively,
 * so they live here — in ONE place, rather than inline in the controller, for
 * the same reason `rolesAssignableBy` moved to utils/roles.ts: a rule copied to
 * a second call site is a rule that will eventually disagree with itself.
 *
 *   1. SAME WORKSPACE. `users.id` is a global primary key, so the FK is
 *      satisfied by a manager in another workspace. That is handled by
 *      `utils/tenantScope.ts` (`users` is already a ScopedTable there), not
 *      here — but it is half of the same problem and both halves are needed.
 *
 *   2. NO CYCLES. `A -> B -> A` satisfies every constraint on the table and
 *      makes any recursive walk of the reporting line non-terminating. That is
 *      what this module is for.
 */

/** Hard stop on the upward walk. A workspace this deep is a bug, not a hierarchy. */
const MAX_DEPTH = 64;

/**
 * Would setting `userId`'s manager to `managerId` create a cycle?
 *
 * Walks UPWARD from the proposed manager. If the walk reaches `userId`, the
 * proposed edge closes a loop — because `userId` would then be above its own
 * manager.
 *
 * Scoped to one tenant throughout: an unscoped walk could follow an edge into
 * another workspace and either miss a cycle or invent one.
 *
 * Returns true for the self-reference too, so a caller that skips the database
 * CHECK still gets a clean answer rather than a 23514.
 */
export async function wouldCreateCycle(
  userId: number,
  managerId: number,
  tenantId: string,
  client?: PoolClient,
): Promise<boolean> {
  if (userId === managerId) return true;

  const q = client ?? pool;
  let current: number | null = managerId;
  const seen = new Set<number>([userId]);

  for (let depth = 0; depth < MAX_DEPTH && current !== null; depth++) {
    if (seen.has(current)) return true;
    seen.add(current);

    const row = await q.query(
      'SELECT manager_id FROM users WHERE id = $1 AND tenant_id = $2',
      [current, tenantId],
    );
    // A manager outside this workspace, or one that does not exist, ends the
    // walk. It is not a cycle — it is a different failure, and tenantScope
    // rejects it on the write path before this is ever consulted.
    if (!row.rows[0]) return false;
    current = row.rows[0].manager_id as number | null;
  }

  // Hitting MAX_DEPTH means the chain is longer than any real org or already
  // loops in a way the `seen` set did not catch. Refuse rather than allow: a
  // false positive blocks one assignment, a false negative hangs a rollup.
  return current !== null;
}

/**
 * Direct reports of one user, within one workspace.
 *
 * The tenant predicate is on the ROW BEING RETURNED, not just the manager
 * lookup — so a report belonging to another workspace cannot be listed even if
 * a cross-workspace `manager_id` somehow exists on it.
 */
export async function directReports(
  managerId: number,
  tenantId: string,
): Promise<{ id: number; first_name: string; last_name: string; email: string; role: string }[]> {
  const result = await pool.query(
    `SELECT id, first_name, last_name, email, role
       FROM users
      WHERE manager_id = $1 AND tenant_id = $2 AND is_active = true
      ORDER BY first_name, last_name`,
    [managerId, tenantId],
  );
  return result.rows;
}
