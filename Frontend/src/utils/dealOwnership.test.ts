import { describe, it, expect } from 'vitest';
import {
  ownerIdentityOf, groupDealsByOwner, ownerFilterOptions, UNASSIGNED_LABEL,
} from './dealOwnership';

/**
 * The extracted ownership rule.
 *
 * THIS FILE EXISTS FOR A SPECIFIC REASON WORTH RECORDING: ForecastPage, which
 * this logic was extracted FROM, has no frontend test suite at all. The brief
 * asked for that suite to be re-run after the repoint to prove nothing
 * regressed; there was nothing to re-run. So the behaviours ForecastPage
 * depended on are pinned here directly instead, and the page itself was
 * re-verified in the browser against figures captured before the change.
 *
 * Each case below is a property that page relied on, and would have silently
 * lost if the extraction had been re-derived rather than moved.
 */
describe('ownerIdentityOf', () => {
  it('prefers the resolved user id, and takes the NAME from the row', () => {
    // The server resolves the name through a tenant-matched join (039); this
    // must never look a name up locally.
    const id = ownerIdentityOf({ assigned_to_user_id: 7, assigned_to: 'Alex Rodriguez' });
    expect(id).toMatchObject({ key: 'id:7', userId: 7, name: 'Alex Rodriguez', unresolved: false });
  });

  it('falls back to the NAME when there is no user id', () => {
    const id = ownerIdentityOf({ assigned_to_user_id: null, assigned_to: 'John Smith' });
    expect(id).toMatchObject({ key: 'name:John Smith', userId: null, unresolved: true });
  });

  it('labels a deal that names nobody as Unassigned', () => {
    for (const empty of [null, undefined, '', '   ']) {
      const id = ownerIdentityOf({ assigned_to_user_id: null, assigned_to: empty });
      expect(id.name).toBe(UNASSIGNED_LABEL);
      expect(id.key).toBe(`name:${UNASSIGNED_LABEL}`);
    }
  });

  it('PREFIXES THE KEY, so id 5 and a rep named "5" never collide', () => {
    // The property most likely to be lost in a re-derivation, and invisible
    // until two unrelated owners' deals merge into one total.
    const byId = ownerIdentityOf({ assigned_to_user_id: 5, assigned_to: 'Real User' });
    const byName = ownerIdentityOf({ assigned_to_user_id: null, assigned_to: '5' });
    expect(byId.key).toBe('id:5');
    expect(byName.key).toBe('name:5');
    expect(byId.key).not.toBe(byName.key);
  });

  it('accepts a numeric id arriving as a string, which is how JSON delivers it', () => {
    expect(ownerIdentityOf({ assigned_to_user_id: '7', assigned_to: 'Alex' }).key).toBe('id:7');
  });

  it('treats a non-numeric id as unresolved rather than producing `id:NaN`', () => {
    const id = ownerIdentityOf({ assigned_to_user_id: 'not-a-number', assigned_to: 'Alex' });
    expect(id.key).toBe('name:Alex');
    expect(id.userId).toBeNull();
  });

  it('names a resolved owner even when the row carries no display name', () => {
    // Better than blank: the row is still attributable and still groups.
    const id = ownerIdentityOf({ assigned_to_user_id: 9, assigned_to: null });
    expect(id).toMatchObject({ key: 'id:9', userId: 9, name: 'User 9' });
  });
});

describe('groupDealsByOwner', () => {
  const d = (assigned_to_user_id: number | null, assigned_to: string | null, id: string) =>
    ({ assigned_to_user_id, assigned_to, id });

  it('groups by the COALESCE key, keeping an unmatched name separate', () => {
    const groups = groupDealsByOwner([
      d(1, 'Alex', 'a'), d(1, 'Alex', 'b'),
      d(null, 'John Smith', 'c'),
      d(null, null, 'e'),
    ]);
    expect(groups.map(g => g.key)).toEqual(['id:1', 'name:John Smith', `name:${UNASSIGNED_LABEL}`]);
    expect(groups[0].deals).toHaveLength(2);
  });

  it('sorts the ownerless group LAST even when it is much the largest', () => {
    // It IS the largest group in the live workspace; letting size decide would
    // put the unattributed remainder at the top of every table.
    const groups = groupDealsByOwner([
      d(null, null, 'a'), d(null, null, 'b'), d(null, null, 'c'),
      d(1, 'Alex', 'd'),
    ]);
    expect(groups[groups.length - 1].name).toBe(UNASSIGNED_LABEL);
  });

  it('orders the rest by deal count, biggest first', () => {
    const groups = groupDealsByOwner([
      d(1, 'Alex', 'a'),
      d(2, 'Sam', 'b'), d(2, 'Sam', 'c'),
    ]);
    expect(groups.map(g => g.name)).toEqual(['Sam', 'Alex']);
  });

  it('returns nothing for no deals, rather than an Unassigned row', () => {
    expect(groupDealsByOwner([])).toEqual([]);
  });
});

describe('ownerFilterOptions', () => {
  it('is built from the DEALS, so an owner who is not a user still appears', () => {
    /*
     * The point of the whole helper. The Reports page's deleted filter listed
     * five colleagues, three of whom own no deals, and omitted "John Smith" —
     * who "owns" 15. A roster-built list repeats that; a deal-built one cannot.
     */
    const options = ownerFilterOptions([
      { assigned_to_user_id: 1, assigned_to: 'Alex' },
      { assigned_to_user_id: null, assigned_to: 'John Smith' },
      { assigned_to_user_id: null, assigned_to: 'John Smith' },
    ]);
    expect(options).toEqual([
      { key: 'name:John Smith', name: 'John Smith', unresolved: true, count: 2 },
      { key: 'id:1', name: 'Alex', unresolved: false, count: 1 },
    ]);
  });

  it('offers nobody when no deals exist, rather than a hardcoded roster', () => {
    expect(ownerFilterOptions([])).toEqual([]);
  });
});
