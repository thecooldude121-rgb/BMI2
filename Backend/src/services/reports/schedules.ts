import { pool } from '../../config/database';
import { canViewPredicateFor } from './access';

/**
 * SCHEDULED DELIVERY — access model only. P3 Phase 8.
 *
 * ─── WHAT IS DELIBERATELY ABSENT ──────────────────────────────────────────
 *
 * There is no send path here, and no endpoint that creates a schedule. Two
 * pieces of infrastructure this CRM does not have would be needed first — a job
 * runner, and a transactional mail provider (`EMAIL_TRANSPORT=log` renders to
 * the log and does NOT deliver) — and both are tracked separately.
 *
 * Shipping the UI over machinery that cannot fire would be a control promising
 * delivery that never happens: the dead-button failure this project keeps
 * removing. So the schema and the rule exist, tested, and nothing writes to
 * them yet.
 *
 * ─── THE RULE ─────────────────────────────────────────────────────────────
 *
 * A send RE-CHECKS EACH RECIPIENT AT SEND TIME. It does not send as its
 * creator, and it holds no snapshot of who could see the report when the
 * schedule was made.
 *
 * The consequences, which are the point:
 *   - revoke someone's grant and they stop receiving it on the NEXT send, with
 *     nothing to remember to clean up;
 *   - deactivate an account and it stops receiving mail;
 *   - the creator leaving changes nothing for anyone else, because the creator
 *     was never the authority for another person's access.
 */

/** Why a listed recipient would not be sent to. */
export type RecipientStatus = 'ok' | 'no_access' | 'inactive';

export interface ScheduleRecipient {
  user_id: number;
  email: string;
  name: string | null;
  status: RecipientStatus;
}

/**
 * Every recipient of a schedule, each with a verdict — NOT a filtered list.
 *
 * Returning the skipped ones is the whole reason this does not just `WHERE`
 * them away. A schedule that silently stops mailing someone is a support
 * mystery: the person says they stopped getting the report, and nothing
 * anywhere says why. With a status, the answer is a lookup.
 *
 * The visibility test is `canViewPredicateFor` — the same predicate
 * `GET /reports/:id` enforces with — applied per recipient in one query, so
 * delivery cannot drift from what the API would allow.
 */
export async function recipientsFor(
  scheduleId: string, tenantId: string,
): Promise<ScheduleRecipient[]> {
  const result = await pool.query(
    `SELECT rec.user_id,
            u.email,
            NULLIF(btrim(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '') AS name,
            u.is_active,
            ${canViewPredicateFor('r', 'rec.user_id')} AS may_view
       FROM saved_report_schedule_recipients rec
       JOIN saved_report_schedules s
         ON s.id = rec.schedule_id AND s.tenant_id = rec.tenant_id
       JOIN saved_reports r
         ON r.id = s.report_id AND r.tenant_id = s.tenant_id
       JOIN users u
         ON u.id = rec.user_id AND u.tenant_id = rec.tenant_id
      WHERE rec.schedule_id = $1
        AND rec.tenant_id = $2
      ORDER BY u.first_name, u.last_name`,
    [scheduleId, tenantId],
  );

  return result.rows.map(r => ({
    user_id: Number(r.user_id),
    email: r.email,
    name: r.name,
    // Order matters: an inactive account is reported as inactive even if they
    // would also pass the visibility test, because that is the more actionable
    // fact — "their account is off" has a different fix from "their access was
    // revoked".
    status: !r.is_active ? 'inactive' : r.may_view ? 'ok' : 'no_access',
  }));
}

/** The recipients a send would actually go to. */
export const deliverableTo = (recipients: ScheduleRecipient[]): ScheduleRecipient[] =>
  recipients.filter(r => r.status === 'ok');

/**
 * Whether a schedule has anyone left to send to.
 *
 * A schedule whose recipients have ALL lost access is not an error and must not
 * be deleted automatically — the grants may be restored tomorrow, and silently
 * discarding someone's configuration is worse than carrying a dormant row. It
 * is a state to surface, which is why this is a question rather than an action.
 */
export const hasNoDeliverableRecipients = (recipients: ScheduleRecipient[]): boolean =>
  recipients.length > 0 && deliverableTo(recipients).length === 0;
