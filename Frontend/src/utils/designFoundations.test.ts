import { describe, it, expect } from 'vitest';
import { viewerBounds } from './activitiesApi';
import { selectClass, inputClass, filterSelectClass } from '../components/ui/Field';

/**
 * Design foundations decided 2026-10-13 (Venkat): weeks start on MONDAY
 * everywhere, and dropdowns are not painted as read-only fields.
 */
describe('weeks start on Monday', () => {
  const weekFrom = (d: Date) => new Date(viewerBounds(d).week_from);
  it('a Wednesday belongs to the week that began on the Monday before it', () => {
    const w = weekFrom(new Date(2026, 9, 14, 15, 0)); // Wed 14 Oct 2026
    expect([w.getFullYear(), w.getMonth(), w.getDate(), w.getDay(), w.getHours()]).toEqual([2026, 9, 12, 1, 0]);
  });
  it('a SUNDAY is the last day of its week, not the first of the next', () => {
    const w = weekFrom(new Date(2026, 9, 18, 9, 0)); // Sun 18 Oct 2026
    expect([w.getMonth(), w.getDate(), w.getDay()]).toEqual([9, 12, 1]);
    const end = new Date(viewerBounds(new Date(2026, 9, 18)).week_to);
    expect([end.getMonth(), end.getDate(), end.getDay()]).toEqual([9, 19, 1]);
  });
  it('a Monday starts its own week', () => {
    const w = weekFrom(new Date(2026, 9, 12, 0, 30));
    expect([w.getMonth(), w.getDate()]).toEqual([9, 12]);
  });
});

describe('dropdown styling', () => {
  it('the read-only fill never applies to a <select> (a select is :read-only by spec)', () => {
    for (const cls of [selectClass(), inputClass()]) {
      expect(cls.split(/\s+/)).not.toContain('read-only:bg-surface-readonly');
      expect(cls).toContain('[&:read-only:not(select)]:bg-surface-readonly');
    }
  });
  it('the filter dropdown is sized by its call site, not forced full width', () => {
    expect(filterSelectClass().split(/\s+/)).not.toContain('w-full');
    expect(filterSelectClass()).toContain('h-8');
  });
});
