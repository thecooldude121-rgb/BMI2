import { describe, it, expect } from 'vitest';
import { RESERVED_RECORD_SEGMENTS, isReservedRecordSegment } from './reservedRouteSegments';

/**
 * The guard that stops "+ New Deal" from asking the API for a deal called "new".
 *
 * The positive cases matter less than the NEGATIVE ones: a guard that rejects
 * too much would refuse real records, and this project's ids are human-readable
 * and user-facing (`D052`, `C001`), so a false positive is a page the user
 * cannot open.
 */
describe('isReservedRecordSegment', () => {
  it.each(RESERVED_RECORD_SEGMENTS)('treats %s as an action, not an id', (segment) => {
    expect(isReservedRecordSegment(segment)).toBe(true);
  });

  it('is case-insensitive, because /deals/New is the same mistake', () => {
    expect(isReservedRecordSegment('New')).toBe(true);
    expect(isReservedRecordSegment('NEW')).toBe(true);
    expect(isReservedRecordSegment('  new  ')).toBe(true);
  });

  it.each([
    'D052', 'C001', 'CT001', 'T001',          // every id format in this project
    'newton', 'renew', 'addendum', 'created', // words that merely CONTAIN one
    'edited', 'newsletter',
  ])('does not mistake the real id or word %s for an action', (value) => {
    expect(isReservedRecordSegment(value)).toBe(false);
  });

  it('handles the absent param without throwing', () => {
    expect(isReservedRecordSegment(undefined)).toBe(false);
    expect(isReservedRecordSegment(null)).toBe(false);
    expect(isReservedRecordSegment('')).toBe(false);
  });
});
