/**
 * The internal notifications feed (Group A item 5, migration 065).
 *
 * Every writer calls these with the SAME client its own change runs on, inside
 * its transaction — so a notification exists exactly when the change it reports
 * committed. Each function is a no-op when there is nobody to tell:
 *   - no recipient (the record has no owner), or
 *   - the recipient IS the actor (you are never notified about your own action;
 *     the table's CHECK enforces the same rule underneath), or
 *   - nothing changed (re-assigning to the same owner, a move to the same stage).
 *
 * Bulk CSV IMPORTS do not notify — a default chosen while building, NOT
 * ratified: loading a file is not a personal event, and one import could
 * otherwise drop hundreds of rows into one person's feed.
 */
export interface Queryable {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }>;
}

type Ids = { tenantId: string; actorId: number | null | undefined };

const toId = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};

async function insert(
  db: Queryable, ids: Ids, recipient: number,
  type: string, entityType: 'lead' | 'deal', entityId: string | number, entityName: string | null,
  detail: Record<string, unknown> = {},
): Promise<void> {
  await db.query(
    `INSERT INTO notifications (tenant_id, user_id, type, entity_type, entity_id, entity_name, actor_user_id, detail)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [ids.tenantId, recipient, type, entityType, String(entityId), entityName, toId(ids.actorId), JSON.stringify(detail)],
  );
}

/** A lead or deal's owner changed: tell the NEW owner. */
export async function notifyOwnerChange(
  db: Queryable, ids: Ids,
  entityType: 'lead' | 'deal', entityId: string | number, entityName: string | null,
  before: unknown, after: unknown,
): Promise<void> {
  const to = toId(after);
  if (to === null || to === toId(before) || to === toId(ids.actorId)) return;
  await insert(db, ids, to, entityType === 'lead' ? 'lead_assigned' : 'deal_assigned', entityType, entityId, entityName);
}

/** A deal changed stage: tell its owner. Stages are recorded by NAME as they were then. */
export async function notifyDealStageChange(
  db: Queryable, ids: Ids,
  dealId: string, dealName: string | null, ownerId: unknown,
  fromStageId: string | null, toStageId: string | null,
): Promise<void> {
  const to = toId(ownerId);
  if (to === null || to === toId(ids.actorId) || !toStageId || fromStageId === toStageId) return;
  const names = await db.query(
    'SELECT id, name FROM pipeline_stages WHERE id = ANY($1::uuid[]) AND tenant_id = $2',
    [[fromStageId, toStageId].filter(Boolean), ids.tenantId],
  );
  const nameOf = (id: string | null) => names.rows.find(r => r.id === id)?.name ?? null;
  await insert(db, ids, to, 'deal_stage_changed', 'deal', dealId, dealName,
    { from_stage: nameOf(fromStageId), to_stage: nameOf(toStageId) });
}

/** A lead was converted: tell its owner (approved scope — owners only, never company-wide). */
export async function notifyLeadConverted(
  db: Queryable, ids: Ids,
  leadId: string | number, leadName: string | null, ownerId: unknown, dealId: string | null,
): Promise<void> {
  const to = toId(ownerId);
  if (to === null || to === toId(ids.actorId)) return;
  await insert(db, ids, to, 'lead_converted', 'lead', leadId, leadName, dealId ? { deal_id: dealId } : {});
}

/** "First Last", or the email, for a lead row. */
export const leadDisplayName = (r: { first_name?: string | null; last_name?: string | null; email?: string | null; company?: string | null }) =>
  [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || r.email || r.company || null;
