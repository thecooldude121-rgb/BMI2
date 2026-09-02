import { describe, it, expect } from 'vitest';
import { localDay, dateOnly } from './dates';

/**
 * Round-trip regression suite (Prompt C) — task/calendar date bucketing.
 *
 * The timezone bug this guards against: `due_date` is a Postgres DATE (a
 * calendar day, no time, no timezone). Before the fix, the tasks API let the
 * pg driver build a JS Date at LOCAL midnight and serialised it with
 * `toISOString()` — in IST (UTC+5:30) that turns "2026-09-02" into
 * "2026-09-01T18:30:00.000Z", so a task due today read as due yesterday
 * (Overdue) for part of every morning. CLAUDE.md's target markets (India,
 * Middle East, Africa) are all ahead of UTC, so this window hits every day.
 *
 * These tests are host-timezone-independent BY DESIGN: `localDay` uses
 * getFullYear/getMonth/getDate (the *local* wall-clock date, whatever host
 * timezone the test happens to run in), so a fixed local Date always produces
 * the same calendar day regardless of where these tests execute — which is
 * exactly the property the tasks page and the calendar depend on to agree.
 */
describe('localDay', () => {
  it('formats a local wall-clock date as YYYY-MM-DD, zero-padded', () => {
    expect(localDay(new Date(2026, 0, 5))).toBe('2026-01-05'); // month 0 = January
    expect(localDay(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('a time just after local midnight is still THAT calendar day, not the previous one', () => {
    // This is precisely the failure mode toISOString() introduces for any
    // timezone ahead of UTC: local 00:30 is still the previous day in UTC.
    // localDay must never fall into that trap because it never converts to UTC.
    const justAfterMidnight = new Date(2026, 8, 2, 0, 30); // Sept 2, 2026, 00:30 local
    expect(localDay(justAfterMidnight)).toBe('2026-09-02');
  });

  it('a time just before local midnight is still THAT calendar day, not the next one', () => {
    const justBeforeMidnight = new Date(2026, 8, 2, 23, 45);
    expect(localDay(justBeforeMidnight)).toBe('2026-09-02');
  });

  it('defaults to "now" when called with no argument', () => {
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(localDay()).toBe(expected);
  });
});

describe('dateOnly', () => {
  it('passes an already-plain YYYY-MM-DD value through unchanged — no reinterpretation', () => {
    // This is the value shape the tasks API now sends (to_char(due_date, 'YYYY-MM-DD')).
    // Slicing it must never apply a timezone conversion it does not need.
    expect(dateOnly('2026-09-02')).toBe('2026-09-02');
    expect(dateOnly('2026-01-01')).toBe('2026-01-01');
  });

  it('returns null for null/undefined rather than throwing or returning a placeholder', () => {
    expect(dateOnly(null)).toBeNull();
    expect(dateOnly(undefined)).toBeNull();
  });

  it('returns null for an empty string, the same as for null — not an empty-string passthrough', () => {
    // Checked against every real caller before settling this: Calendar.tsx
    // does `const day = dateOnly(t.due_date); if (!day) continue;` and
    // TasksPage's overdue/upcoming predicates do `!!d && d < today`. None of
    // them distinguishes '' from null, and both dateOnly and TasksPage's
    // dueDay() are declared `string | null`, so null is the contract.
    //
    // null is also the safer of the two: '' is a valid Map key and sorts below
    // every real date, so a blank due_date returning '' would read as OVERDUE
    // anywhere a guard was forgotten. null cannot.
    expect(dateOnly('')).toBeNull();
  });
});

/**
 * Bucket assignment, exercised the way TasksPage actually uses these helpers:
 * compare the API's due_date string against localDay() of "now", never via a
 * UTC conversion of either side. This is the specific comparison HANDOFF.md
 * says the tasks list and calendar must agree on.
 */
describe('bucket comparison — the shape TasksPage/Calendar actually use', () => {
  const isOverdue = (dueDateStr: string, now: Date): boolean => dateOnly(dueDateStr)! < localDay(now);
  const isToday = (dueDateStr: string, now: Date): boolean => dateOnly(dueDateStr) === localDay(now);
  const isUpcoming = (dueDateStr: string, now: Date): boolean => dateOnly(dueDateStr)! > localDay(now);

  it('a task due exactly today is Today, never Overdue, at any local hour of today', () => {
    const dueToday = '2026-09-02';
    expect(isToday(dueToday, new Date(2026, 8, 2, 0, 5))).toBe(true);   // just after local midnight
    expect(isOverdue(dueToday, new Date(2026, 8, 2, 0, 5))).toBe(false);
    expect(isToday(dueToday, new Date(2026, 8, 2, 23, 55))).toBe(true); // just before local midnight
    expect(isOverdue(dueToday, new Date(2026, 8, 2, 23, 55))).toBe(false);
  });

  it('a task due yesterday is Overdue as of any time today', () => {
    expect(isOverdue('2026-09-01', new Date(2026, 8, 2, 0, 5))).toBe(true);
  });

  it('a task due tomorrow is Upcoming, never Today or Overdue', () => {
    const now = new Date(2026, 8, 2, 12, 0);
    expect(isUpcoming('2026-09-03', now)).toBe(true);
    expect(isToday('2026-09-03', now)).toBe(false);
    expect(isOverdue('2026-09-03', now)).toBe(false);
  });
});
