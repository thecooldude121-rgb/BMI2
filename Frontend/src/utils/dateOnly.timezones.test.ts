import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseLocalDay, calendarDaysUntil, endOfLocalDay, dayOrInstant, localDay } from './dates';
import { daysFromNow, formatRelativeDate } from './dateUtils';
import { computeNBA } from './leadNBA/engine';
import { computeLeadSLA } from './leadSla/engine';
import type { Lead } from '../types/lead';

/**
 * Data-correctness slice (2026-10-06). A DATE column is a calendar DAY, and the
 * API now sends it as "YYYY-MM-DD". `new Date("YYYY-MM-DD")` reads that as UTC
 * midnight — 05:30 the same day in IST and the PREVIOUS evening in New York — so
 * "due today" read as overdue for most of every day, and a date rendered with
 * toLocaleDateString showed yesterday west of UTC.
 *
 * Each case runs under several fixed zones (process.env.TZ is honoured by Node
 * at runtime), at a wall-clock time chosen to sit inside the old error window.
 */
const ZONES = ['Asia/Kolkata', 'Asia/Dubai', 'America/New_York', 'Pacific/Kiritimati', 'UTC'];
const ORIGINAL_TZ = process.env.TZ;

function at(tz: string, y: number, m: number, d: number, h: number, min = 0) {
  process.env.TZ = tz;
  vi.setSystemTime(new Date(y, m - 1, d, h, min));
}

const lead = (o: Partial<Lead>) => ({ id: 'L1', status: 'engaged', created_at: '2026-01-01T00:00:00Z', ...o }) as unknown as Lead;

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); process.env.TZ = ORIGINAL_TZ; });

describe.each(ZONES)('calendar days in %s', (tz) => {
  it('parseLocalDay is local midnight of that day; dayOrInstant keeps timestamps as instants', () => {
    at(tz, 2026, 10, 6, 9);
    const d = parseLocalDay('2026-10-06')!;
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 6, 0]);
    expect(localDay(dayOrInstant('2026-10-06'))).toBe('2026-10-06');
    expect(dayOrInstant('2026-10-06T10:00:00Z').toISOString()).toBe('2026-10-06T10:00:00.000Z');
    expect(parseLocalDay('not a date')).toBeNull();
  });

  it('calendarDaysUntil: today is 0, yesterday -1, tomorrow 1 — early morning AND late evening', () => {
    for (const hour of [0, 1, 6, 23]) {
      at(tz, 2026, 10, 6, hour, 30);
      expect(calendarDaysUntil('2026-10-06')).toBe(0);
      expect(calendarDaysUntil('2026-10-05')).toBe(-1);
      expect(calendarDaysUntil('2026-10-07')).toBe(1);
    }
  });

  it('endOfLocalDay is the following local midnight', () => {
    at(tz, 2026, 10, 6, 9);
    expect(endOfLocalDay('2026-10-06')!.getTime()).toBe(new Date(2026, 9, 7).getTime());
  });

  it('formatRelativeDate: before noon, today is "Today" and yesterday is "Yesterday"', () => {
    at(tz, 2026, 10, 6, 8);
    expect(formatRelativeDate('2026-10-06')).toBe('Today');
    expect(formatRelativeDate('2026-10-05')).toBe('Yesterday');
  });

  it('a follow-up due TODAY is not overdue (NBA, SLA); one due yesterday is', () => {
    at(tz, 2026, 10, 6, 20);
    expect(computeNBA(lead({ next_follow_up_date: '2026-10-06', last_contact_date: '2026-10-05' })).action.id).not.toBe('follow_up_now');
    expect(computeLeadSLA(lead({ next_follow_up_date: '2026-10-06' })).followUp.severity).toBe('healthy');
    expect(computeNBA(lead({ next_follow_up_date: '2026-10-05', last_contact_date: '2026-10-05' })).action.id).toBe('follow_up_now');
    expect(computeLeadSLA(lead({ next_follow_up_date: '2026-10-05' })).followUp.severity).not.toBe('healthy');
  });
});

describe('daysFromNow across a DST change', () => {
  it('New York, 1 Nov 2026 (a 25-hour day): tomorrow is 1 day away, not 2', () => {
    at('America/New_York', 2026, 11, 1, 9);
    expect(daysFromNow('2026-11-02')).toBe(1);
    expect(calendarDaysUntil('2026-11-02')).toBe(1);
  });
});

describe('endOfLocalDay only reinterprets a bare calendar day', () => {
  it('a full timestamp is already a deadline instant: null, so the caller keeps it', () => {
    expect(endOfLocalDay('2026-10-06T10:00:00Z')).toBeNull();
  });
});
