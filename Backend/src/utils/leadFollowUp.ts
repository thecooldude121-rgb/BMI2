/**
 * Lead follow-ups (Group B item 11, v1 approved 2026-10-05): a follow-up IS a
 * row in `tasks` — type 'follow-up', related_to_type 'lead', related_to_id the
 * lead's id as text, a DATE due_date (no time of day in v1, no notification
 * delivery). No new column: the "next follow-up" is derived, so it can never
 * disagree with the task list.
 *
 * Both fragments assume the lead table is aliased `l` and carry the tenant
 * match, so a task from another workspace can never be counted against a lead.
 *
 * Dates are returned as TEXT 'YYYY-MM-DD' (to_char). node-pg parses a DATE into
 * a JavaScript Date at the server's local midnight, which serialises as the
 * PREVIOUS day in UTC from an IST server ("2026-05-28" -> "2026-05-27T18:30Z").
 * That affects every DATE column today and is tracked separately; these new
 * fields side-step it rather than inherit it.
 */

const OPEN_FOLLOW_UP = `
  t.tenant_id = l.tenant_id
  AND t.related_to_type = 'lead'
  AND t.related_to_id = l.id::text
  AND t.type = 'follow-up'
  AND t.status <> 'completed'
  AND t.due_date IS NOT NULL`;

/** LEFT JOIN exposing the earliest open follow-up as `fu.due` / `fu.id`. */
export const FOLLOW_UP_JOIN = `
  LEFT JOIN LATERAL (
    SELECT t.id, to_char(t.due_date, 'YYYY-MM-DD') AS due
      FROM tasks t
     WHERE ${OPEN_FOLLOW_UP}
     ORDER BY t.due_date ASC, t.id ASC
     LIMIT 1
  ) fu ON true`;

/** The columns to select alongside l.* when FOLLOW_UP_JOIN is present. */
export const FOLLOW_UP_COLUMNS = `fu.due AS next_follow_up_date, fu.id AS next_follow_up_task_id`;

/**
 * True when the lead has an open follow-up due BEFORE today. "Today" is the
 * database's CURRENT_DATE (the server's time zone, Asia/Kolkata on live).
 */
export const OVERDUE_FOLLOW_UP = `EXISTS (
  SELECT 1 FROM tasks t
   WHERE ${OPEN_FOLLOW_UP}
     AND t.due_date < CURRENT_DATE)`;
