import { describe, it, expect } from 'vitest';
import { describeBulk } from './describeBulk';

describe('describeBulk', () => {
  it('reports the plain count when everything was found', () => {
    expect(describeBulk({ affected: 3, requested: 3, not_found: [] }, 'Deleted'))
      .toBe('Deleted 3 contacts');
  });

  it('reports the real number, not the number selected', () => {
    // The whole point: 4 were selected, 3 existed. Saying "Deleted 4" is the
    // kind of small untruth this page was made of.
    expect(describeBulk({ affected: 3, requested: 4, not_found: ['CT999'] }, 'Deleted'))
      .toBe('Deleted 3 of 4 contacts — 1 no longer exists');
  });

  it('uses the singular for one contact', () => {
    expect(describeBulk({ affected: 1, requested: 1, not_found: [] }, 'Archived'))
      .toBe('Archived 1 contact');
  });

  it('says zero rather than implying success', () => {
    expect(describeBulk({ affected: 0, requested: 2, not_found: ['A', 'B'] }, 'Assigned'))
      .toBe('Assigned 0 of 2 contacts — 2 no longer exist');
  });

  it('takes the past tense verbatim, so irregular verbs read correctly', () => {
    // Deriving this by appending 'd' gave 'Assignd' and 'Unassignd'.
    expect(describeBulk({ affected: 2, requested: 2, not_found: [] }, 'Unassigned'))
      .toBe('Unassigned 2 contacts');
    expect(describeBulk({ affected: 1, requested: 1, not_found: [] }, 'Added the tag "VIP" to'))
      .toBe('Added the tag "VIP" to 1 contact');
  });
});
