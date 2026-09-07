import { pool } from '../config/database';

/**
 * Checking that a foreign id supplied by a client belongs to the caller's
 * workspace.
 *
 * WHY THIS EXISTS. Every FK in this schema references its parent's GLOBAL
 * primary key — `deals_lead_id_fkey` is `FOREIGN KEY (lead_id) REFERENCES
 * leads(id)`, with no tenant component, and the same is true of
 * contacts.company_id, contacts.owner_id and all four activities parents.
 * Postgres therefore ACCEPTS a row in workspace A whose lead_id names a lead in
 * workspace B. Referential integrity is satisfied; tenant isolation is not.
 *
 * That is only half a bug on its own. It became a live cross-workspace read
 * because the list queries joined those parents without a tenant predicate, so
 * `GET /deals` projected the other workspace's `lead_email`. Both halves are
 * now closed: the joins carry `AND parent.tenant_id = child.tenant_id` (so a
 * reference that already exists cannot be read through), and this module
 * refuses to create one in the first place.
 *
 * `leadSubController.assertLeadInTenant` and `contactsController.ownerIsInTenant`
 * were doing this correctly for two columns already. This generalises them so
 * the next FK column starts out checked rather than being remembered.
 *
 * See `src/__tests__/tenantIsolation.test.ts`, which fails without this.
 */

/**
 * The workspace-scoped tables a request body may reference by id.
 *
 * The KEY is all a caller can ever name; the VALUE is the literal identifier
 * interpolated into SQL. A table name never originates from user input — that
 * would be an injection point, and a parameter cannot stand in for an
 * identifier in Postgres.
 */
const SCOPED_TABLES = {
  leads: 'leads',
  deals: 'deals',
  contacts: 'contacts',
  companies: 'companies',
  users: 'users',
  activities: 'activities',
} as const;

export type ScopedTable = keyof typeof SCOPED_TABLES;

/** Singular noun for the message, so a 400 reads "…does not name a lead…". */
const SINGULAR: Record<ScopedTable, string> = {
  leads: 'lead',
  deals: 'deal',
  contacts: 'contact',
  companies: 'company',
  users: 'user',
  activities: 'activity',
};

/** True only when `id` names a row in `table` inside `tenantId`. */
export async function idInTenant(
  table: ScopedTable,
  id: unknown,
  tenantId: string,
): Promise<boolean> {
  const relation = SCOPED_TABLES[table];
  if (!relation) throw new Error(`idInTenant: ${String(table)} is not a scoped table`);
  try {
    const result = await pool.query(
      `SELECT 1 FROM ${relation} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return result.rowCount === 1;
  } catch (error) {
    // leads.id and users.id are integers, the rest are varchar. A client
    // sending "abc" for an integer column raises 22P02
    // (invalid_text_representation). That is a malformed id, which is exactly
    // "not a row in your workspace" — answer the question rather than turning a
    // bad request into a 500.
    if ((error as { code?: string }).code === '22P02') return false;
    throw error;
  }
}

export interface ForeignRef {
  /** The request-body field name, used verbatim in the error message. */
  field: string;
  table: ScopedTable;
  value: unknown;
}

/**
 * Validate several body-supplied foreign ids at once.
 *
 * Returns a message naming the first field that fails, or null when every
 * reference present belongs to the caller's workspace. Absent values
 * (undefined / null / '') are skipped: "no company" is legitimate, and an
 * update that omits a field must not be read as clearing it.
 */
export async function foreignIdsInTenant(
  refs: ForeignRef[],
  tenantId: string,
): Promise<string | null> {
  for (const { field, table, value } of refs) {
    if (value === undefined || value === null || value === '') continue;
    if (!(await idInTenant(table, value, tenantId))) {
      return `${field} does not name a ${SINGULAR[table]} in this workspace`;
    }
  }
  return null;
}

/**
 * Resolve a display NAME to a user id inside one workspace, or null.
 *
 * WHY THIS EXISTS. Deal ownership is moving from a name string to
 * `deals.assigned_to_user_id` (migration 039), but several forms still submit
 * only a name — the deal form's owner <select> uses the name as its option
 * value, and so does the detail page's assign-owner modal. Resolving on the
 * SERVER means every one of those writers starts producing resolved ownership
 * without each picker having to be rewritten first, and there is exactly one
 * place doing the matching rather than one per form.
 *
 * Returns null rather than guessing when:
 *   - no user in this workspace has that name (the "John Smith" case: 15 live
 *     deals name someone who was never a user), or
 *   - MORE THAN ONE does. Picking an arbitrary one of two same-named
 *     colleagues would be a silent mis-assignment, and a wrong owner is worse
 *     than an unresolved one.
 *
 * The tenant predicate is not optional: users.id is a global primary key, so
 * without it a name matching someone in another workspace would resolve to
 * their id and quietly hand them the deal.
 */
export async function userIdForName(
  name: unknown,
  tenantId: string,
): Promise<number | null> {
  if (typeof name !== 'string' || !name.trim()) return null;
  const result = await pool.query(
    `SELECT id FROM users
      WHERE tenant_id = $1
        AND lower(btrim(first_name || ' ' || last_name)) = lower(btrim($2))
      LIMIT 2`,
    [tenantId, name],
  );
  return result.rowCount === 1 ? Number(result.rows[0].id) : null;
}

/**
 * The display name for a user id inside one workspace, or null.
 *
 * The mirror of `userIdForName`, and it exists for the same reason the create
 * path carries `stage: stageRow.slug`: `RETURNING *` cannot join, so a create
 * that supplied only `assigned_to_user_id` would answer with
 * `assigned_to: null` and the client would show no owner until it refetched.
 * Resolving here keeps the create response identical in shape to what the read
 * paths project.
 *
 * Tenant-scoped for the usual reason — users.id is a global primary key.
 */
export async function userNameForId(
  userId: unknown,
  tenantId: string,
): Promise<string | null> {
  if (userId === null || userId === undefined || userId === '') return null;
  try {
    const result = await pool.query(
      `SELECT btrim(first_name || ' ' || last_name) AS name
         FROM users WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId],
    );
    const name = result.rows[0]?.name as string | undefined;
    return name && name.length ? name : null;
  } catch (error) {
    // Same 22P02 reasoning as idInTenant: a malformed id is simply not a user
    // in this workspace.
    if ((error as { code?: string }).code === '22P02') return null;
    throw error;
  }
}
