/**
 * A lead's engagement COUNTS, derived from what was actually logged (scoring
 * fix, 2026-10-10). The frontend used to hardcode call / meeting / email-sent
 * counts to 0, so a lead with logged calls read "0 calls" and the engagement
 * factors could never score.
 *
 * Two places record lead activity, and both are counted:
 *   - `activities` rows with a lead_id — what the Lead detail and Leads list
 *     composers write;
 *   - the per-type tables `lead_calls`, `lead_emails`, `lead_meetings` — the
 *     older /leads/:id/calls | emails | meetings endpoints, still live.
 *
 * "Counts" mirrors what already counts as CONTACT (recordLeadContact):
 *   calls    — a completed call activity, or any lead_calls row (answered or not);
 *   meetings — a COMPLETED meeting (a planned one has not happened);
 *   emails sent — a completed, non-inbound email activity, or an outbound
 *     lead_emails row that is not a draft / failed / bounced / scheduled.
 * Email opens, clicks and page views have NO source in this CRM and are not
 * served at all — the client shows them as "not tracked", never as 0.
 *
 * Every subquery carries the tenant match, so another workspace's rows can
 * never be counted against a lead. Scalar subqueries in a select list run only
 * for the rows returned, i.e. after LIMIT — a page of 25, not 10,000 leads.
 * Assumes the lead table is aliased `l`.
 */
export const ENGAGEMENT_COLUMNS = `
  ((SELECT count(*) FROM activities a
     WHERE a.tenant_id = l.tenant_id AND a.lead_id = l.id AND a.type = 'call' AND a.status = 'completed')
 + (SELECT count(*) FROM lead_calls c
     WHERE c.tenant_id = l.tenant_id AND c.lead_id = l.id))::int AS call_count,
  ((SELECT count(*) FROM activities a
     WHERE a.tenant_id = l.tenant_id AND a.lead_id = l.id AND a.type = 'meeting' AND a.status = 'completed')
 + (SELECT count(*) FROM lead_meetings m
     WHERE m.tenant_id = l.tenant_id AND m.lead_id = l.id AND m.status = 'completed'))::int AS meeting_count,
  ((SELECT count(*) FROM activities a
     WHERE a.tenant_id = l.tenant_id AND a.lead_id = l.id AND a.type = 'email' AND a.status = 'completed'
       AND a.direction IS DISTINCT FROM 'inbound')
 + (SELECT count(*) FROM lead_emails e
     WHERE e.tenant_id = l.tenant_id AND e.lead_id = l.id AND e.direction IS DISTINCT FROM 'inbound'
       AND coalesce(e.status, 'sent') NOT IN ('draft', 'failed', 'bounced', 'scheduled')))::int AS email_sent_count`;

/**
 * The same counts for ONE lead, merged into a row a write returned (RETURNING *
 * cannot carry them). Every endpoint that answers with a lead uses this, so the
 * client never has to guess a count — a guessed 0 would read "0 calls" for a
 * lead with calls, the defect this module exists to remove.
 */
export async function withEngagement<T extends { id: number | string }>(
  db: { query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> },
  tenantId: string, row: T | undefined,
): Promise<T | undefined> {
  if (!row) return row;
  const r = await db.query(`SELECT ${ENGAGEMENT_COLUMNS} FROM leads l WHERE l.id = $1 AND l.tenant_id = $2`, [row.id, tenantId]);
  return { ...row, ...(r.rows[0] ?? {}) };
}
