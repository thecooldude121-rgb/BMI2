/**
 * Calendar-day helpers, shared by every surface that buckets or groups by a
 * DATE column.
 *
 * WHY THESE EXIST RATHER THAN toISOString().slice(0, 10)
 * A DATE in Postgres is a calendar day with no time and no timezone.
 * toISOString() converts to UTC first, so for part of every day outside UTC it
 * reports the wrong day. The direction of the error depends on the offset: in
 * IST (UTC+5:30) local 00:00-05:29 is still the previous day in UTC, so a task
 * due today reads as overdue every morning; west of Greenwich the same error
 * lands in the evening. CLAUDE.md's target markets — India, the Middle East and
 * Africa — are all ahead of UTC, so the morning window is the one that would be
 * hit daily.
 *
 * This lives in one file because the tasks list and the calendar must agree
 * about what day a task falls on. Two copies of this logic is two chances to
 * fix one and not the other.
 */

/** Today (or any Date) as YYYY-MM-DD in the viewer's own timezone. */
export function localDay(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * The calendar day of a value that came from a DATE column.
 *
 * The tasks API casts due_date to text so it arrives as "YYYY-MM-DD" already;
 * slicing is then exact rather than a reinterpretation. Any endpoint that has
 * NOT had that fix still sends a full ISO timestamp, and slicing that would
 * reintroduce the UTC shift — so use this only on values known to be date-only,
 * and fix the endpoint rather than compensating here.
 */
export function dateOnly(value: string | null | undefined): string | null {
  return value ? String(value).slice(0, 10) : null;
}
