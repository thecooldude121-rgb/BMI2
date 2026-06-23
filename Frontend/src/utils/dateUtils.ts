/**
 * Safely parse a date input that may be:
 *  - a YYYY-MM-DD string     ("2026-07-16")
 *  - a full ISO string       ("2026-07-16T18:30:00.000Z")
 *  - a DD/MM/YYYY string     ("16/07/2026") — common in Indian data entry
 *  - a JS Date object
 *  - null / undefined / ""   → returns null
 *
 * For YYYY-MM-DD strings we anchor at local noon (T12:00:00) so that the
 * IST UTC+5:30 offset cannot shift the date to the previous calendar day.
 */
const parseDate = (input: string | Date | null | undefined): Date | null => {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  const str = String(input).trim();
  if (!str) return null;

  let d: Date;

  // Full ISO string already carries timezone info — parse as-is
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    d = new Date(str);
  }
  // Plain YYYY-MM-DD — anchor at local noon to avoid midnight UTC edge case
  else if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    d = new Date(str + 'T12:00:00');
  }
  // DD/MM/YYYY (Indian format from manual entry)
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [dd, mm, yyyy] = str.split('/');
    d = new Date(`${yyyy}-${mm}-${dd}T12:00:00`);
  }
  // Fallback for any other parseable format
  else {
    d = new Date(str);
  }

  if (isNaN(d.getTime())) return null;

  // Reject nonsense years — DB corruption or 6-digit typos (e.g. "262026")
  // pass V8's parser but are never valid CRM dates.
  const y = d.getFullYear();
  if (y < 1900 || y > 2200) return null;

  return d;
};

// Month abbreviations are hardcoded so output is identical across all
// browser/OS/locale combinations. toLocaleDateString('en-IN') produces 'Sept'
// on some runtimes and 'Sep' on others — this eliminates that variance.
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;

/**
 * Returns "16 Jul 2026" — browser-independent, never "Invalid Date".
 * Exported so other components can call it instead of toLocaleDateString().
 */
export const formatDateShort = (d: Date): string => {
  const day  = String(d.getDate()).padStart(2, '0');
  const mon  = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${mon} ${year}`;
};

/**
 * Returns "16 Jul 2026, 14:30" — browser-independent short datetime.
 * Use instead of toLocaleString() to get consistent output everywhere.
 */
export const formatDateTimeShort = (input: string | Date | null | undefined): string => {
  const d = parseDate(input);
  if (!d) return '—';
  const date = formatDateShort(d);
  const h    = String(d.getHours()).padStart(2, '0');
  const m    = String(d.getMinutes()).padStart(2, '0');
  return `${date}, ${h}:${m}`;
};

/** Returns "16 Jul 2026" or "Not set" for null / invalid input. */
export const formatDisplayDate = (input: string | Date | null | undefined): string => {
  const d = parseDate(input);
  return d ? formatDateShort(d) : 'Not set';
};

/**
 * Returns integer days from today (positive = future, negative = past, 0 = today).
 * Returns null when the input is missing or cannot be parsed — callers can
 * distinguish "no date" from "today" and avoid displaying misleading labels.
 */
export const daysFromNow = (input: string | Date | null | undefined): number | null => {
  const d = parseDate(input);
  if (!d) return null;
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const targetMs = new Date(d).setHours(0, 0, 0, 0);
  const diff = Math.ceil((targetMs - todayMs) / (1000 * 60 * 60 * 24));
  return isNaN(diff) ? null : diff;
};

/**
 * Returns a human-readable close-date label.
 * Never returns NaN, "Invalid Date", or a raw ISO string.
 */
export const daysFromNowLabel = (input: string | Date | null | undefined): string => {
  const days = daysFromNow(input);
  if (days === null) return 'No close date set';
  if (days === 0)    return 'Closes today';
  if (days === 1)    return 'Closes tomorrow';
  if (days === -1)   return 'Closed yesterday';
  if (days > 1)      return `${days} days away`;
  if (days < -30)    return `Closed ${Math.abs(days)} days ago`;
  return `Overdue by ${Math.abs(days)} days`;
};

/**
 * Returns a Tailwind colour class for the close-date urgency card.
 *   green  → more than 30 days away
 *   amber  → 8–30 days away
 *   red    → 0–7 days away OR overdue
 *   gray   → no date set
 */
export const closeDateUrgencyClass = (input: string | Date | null | undefined): string => {
  const days = daysFromNow(input);
  if (days === null)  return 'bg-gray-50 border-gray-200 text-gray-700';
  if (days > 30)      return 'bg-green-50 border-green-200 text-green-900';
  if (days >= 8)      return 'bg-amber-50 border-amber-200 text-amber-900';
  return                     'bg-red-50 border-red-200 text-red-900';
};

/**
 * Converts any date input (ISO timestamp, YYYY-MM-DD, Date, null) to a
 * human-readable relative label.
 *
 * Rules:
 *   - within the same calendar day  → "Today"
 *   - yesterday                     → "Yesterday"
 *   - 2–6 days ago                  → "N days ago"
 *   - 7–29 days ago                 → "X days ago"   (keeps it specific for CRM)
 *   - 30+ days ago                  → "Jun 2, 2026"  (absolute, no ambiguity)
 *   - future timestamps             → formatted date (e.g. scheduled activities)
 *   - null / invalid / ""           → fallback string (default "No recent activity")
 *
 * Used for: lastActivity on cards, modal timestamps, created/updated labels.
 */
export const formatRelativeTime = (
  input: string | Date | null | undefined,
  fallback = 'No recent activity',
): string => {
  const d = parseDate(input);
  if (!d) return fallback;

  const nowMs  = Date.now();
  const diffMs = nowMs - d.getTime();
  const days   = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Future or exactly now — show the absolute date
  if (diffMs < 0) {
    return formatDateShort(d);
  }

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30)  return `${days} days ago`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  // Older than a year — show the absolute date
  return formatDateShort(d);
};

/**
 * Close-date display with a CRM-specific "No close date" fallback.
 * Use this everywhere a deal's close date is rendered — never use
 * formatDisplayDate directly for close dates.
 */
export const formatCloseDate = (input: string | Date | null | undefined): string => {
  const d = parseDate(input);
  return d ? formatDateShort(d) : 'No close date';
};

/**
 * Returns true when the input date falls between now and `n` calendar days
 * from now (inclusive). Returns false for missing, invalid, or past dates.
 *
 * Replaces the three duplicated isWithinWeek / isWithinMonth / isWithinQuarter
 * functions that existed independently in DealsListView and DealsGridView.
 *
 *   isWithinDays(closeDate, 7)  → this week
 *   isWithinDays(closeDate, 30) → this month
 *   isWithinDays(closeDate, 90) → this quarter
 */
export const isWithinDays = (
  input: string | Date | null | undefined,
  n: number,
): boolean => {
  const days = daysFromNow(input);
  if (days === null) return false;
  return days >= 0 && days <= n;
};

/**
 * Normalises a raw date field from the API before storing it in component state.
 *
 * Returns the raw value as-is (or '' for null/undefined).  The key guarantee:
 * do NOT split on 'T'.  PostgreSQL DATE columns serialise to ISO timestamps
 * like "2026-06-30T18:30:00.000Z" for UTC+5:30 timezones — splitting produces
 * "2026-06-29", shifting every date one day early.  parseDateMs and
 * formatCloseDate already handle full ISO strings correctly.
 *
 * @example
 *   closeDate: normalizeDateField(d.expected_close_date)
 *   nextStepDueDate: normalizeDateField(d.next_step_due_date)
 */
export const normalizeDateField = (raw: string | null | undefined): string => raw ?? '';

/**
 * Returns the date as milliseconds-since-epoch, or Infinity when the input is
 * missing or invalid. Safe to use in Array.sort() comparators — invalid/empty
 * dates sort to the end rather than producing NaN (which breaks V8's sort).
 *
 *   deals.sort((a, b) => parseDateMs(a.closeDate) - parseDateMs(b.closeDate))
 */
export const parseDateMs = (input: string | Date | null | undefined): number => {
  const d = parseDate(input);
  return d ? d.getTime() : Infinity;
};

/**
 * Returns a short human-readable relative label for a past date.
 * Future dates return '' (not a negative value).
 *
 *   same day  → "Today"
 *   1 day ago → "Yesterday"
 *   2–6 days  → "N days ago"
 *   7–29 days → "N weeks ago"
 *   30+ days  → "N months ago"
 */
export const formatRelativeDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const d = parseDate(dateStr);
  if (!d) return '';
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 0)   return '';               // future date — caller handles separately
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)   return `${days} days ago`;
  if (days < 30)  return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
};

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] as const;

/**
 * Formats a follow-up Date for display in the Urgency zone.
 * Uses midnight-normalised arithmetic to avoid time-of-day skew.
 *
 *   Today    → "Today"
 *   Tomorrow → "Tomorrow"
 *   2–6 days → "This {DayName}"  e.g. "This Friday"
 *   else     → "DD Mon"          e.g. "28 Jun"
 */
export const formatFollowUpDate = (date: Date): string => {
  const todayMs  = new Date().setHours(0, 0, 0, 0);
  const targetMs = new Date(date).setHours(0, 0, 0, 0);
  const diffDays = Math.round((targetMs - todayMs) / 86_400_000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays >= 2 && diffDays <= 6) return `This ${DAY_NAMES[date.getDay()]}`;

  // Overdue or far future — DD Mon format
  const day = String(date.getDate()).padStart(2, '0');
  const mon = MONTHS[date.getMonth()];
  return `${day} ${mon}`;
};