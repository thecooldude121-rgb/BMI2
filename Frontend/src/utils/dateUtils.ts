/**
 * Safely parse a date input that may be:
 *  - a YYYY-MM-DD string  ("2026-07-16")
 *  - a full ISO string    ("2026-07-16T18:30:00.000Z")
 *  - a JS Date object
 *
 * For YYYY-MM-DD strings we append T12:00:00 (local noon) to avoid the
 * date shifting to the previous day in IST (UTC+5:30) when the browser
 * parses a bare date as UTC midnight.
 */
const parseDate = (input: string | Date | null | undefined): Date | null => {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  // Full ISO string already contains timezone — parse as-is
  if (/^\d{4}-\d{2}-\d{2}T/.test(input)) {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  // Plain YYYY-MM-DD — anchor at local noon to avoid midnight UTC edge case
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const d = new Date(input + 'T12:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  // Fallback for any other format
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
};

/** Returns "Jul 16, 2026" or "Not set" for null/invalid input. */
export const formatDisplayDate = (input: string | Date | null | undefined): string => {
  const d = parseDate(input);
  if (!d) return 'Not set';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Returns integer days from today (positive = future, negative = past, 0 = today). */
export const daysFromNow = (input: string | Date | null | undefined): number => {
  const d = parseDate(input);
  if (!d) return 0;
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const targetMs = new Date(d).setHours(0, 0, 0, 0);
  const diff = Math.ceil((targetMs - todayMs) / (1000 * 60 * 60 * 24));
  return isNaN(diff) ? 0 : diff;
};

/** Returns human-readable label: "45 days away", "Today", "3 days ago", "Overdue by 5 days". */
export const daysFromNowLabel = (input: string | Date | null | undefined): string => {
  if (!parseDate(input)) return 'No date set';
  const days = daysFromNow(input);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1) return `${days} days away`;
  return `Overdue by ${Math.abs(days)} days`;
};
