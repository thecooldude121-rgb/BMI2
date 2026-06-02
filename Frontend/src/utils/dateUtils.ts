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

  // Full ISO string already carries timezone info — parse as-is
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // Plain YYYY-MM-DD — anchor at local noon to avoid midnight UTC edge case
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str + 'T12:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY (Indian format from manual entry)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [dd, mm, yyyy] = str.split('/');
    const d = new Date(`${yyyy}-${mm}-${dd}T12:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  // Fallback for any other parseable format
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

/** Returns "16 Jul 2026" or "Not set" for null / invalid input. */
export const formatDisplayDate = (input: string | Date | null | undefined): string => {
  const d = parseDate(input);
  if (!d) return 'Not set';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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