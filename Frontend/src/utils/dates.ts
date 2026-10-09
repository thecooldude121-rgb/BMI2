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

/**
 * A DATE-column value ("YYYY-MM-DD", or a string starting with one) as a Date at
 * LOCAL midnight of that calendar day. Never `new Date("YYYY-MM-DD")`: the spec
 * parses that form as UTC midnight, which is the previous evening west of UTC
 * and 05:30 the same day in IST — so "due today" read as overdue for most of
 * every day. Returns null for anything that is not a calendar day.
 */
export function parseLocalDay(value: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Whole calendar days from `today` to `day` (positive = in the future, 0 = today,
 * negative = past). Counted on the calendar, not by dividing milliseconds, so a
 * DST change in between cannot make it off by one. null if `day` is not a day.
 */
export function calendarDaysUntil(day: string | null | undefined, today: Date = new Date()): number | null {
  const d = parseLocalDay(day);
  if (!d) return null;
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b - a) / 86_400_000);
}

/**
 * The instant a calendar day ENDS locally — a deadline "due on D" is overdue
 * only after this. Only for a bare "YYYY-MM-DD": a full timestamp is already a
 * deadline instant, and returns null so the caller uses it as-is.
 */
export function endOfLocalDay(day: string | null | undefined): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(day ?? ''))) return null;
  const d = parseLocalDay(day);
  return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) : null;
}

/**
 * For fields that may hold EITHER a calendar day or a timestamp (e.g.
 * `last_activity_date ?? last_contact_date ?? created_at`): a bare
 * "YYYY-MM-DD" is read as local midnight of that day, anything else as the
 * instant it names. Use instead of `new Date(value)` wherever a DATE column
 * can arrive.
 */
export function dayOrInstant(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? (parseLocalDay(value) as Date) : new Date(value);
}
