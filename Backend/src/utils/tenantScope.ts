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
