/**
 * WHO OWNS A DEAL — one answer, shared.
 *
 * Extracted from ForecastPage, which had the only correct implementation of
 * this and had it inline. The Reports page then needed the same grouping for
 * two of its cards, and a second copy of a rule this subtle is a rule that
 * will diverge: the `id:` / `name:` prefixes below exist to stop a collision
 * that is invisible until it happens, and a re-derivation would very likely
 * drop them.
 *
 * THE GROUPING IS `COALESCE(assigned_to_user_id, assigned_to)`, deliberately.
 * Migration 039 made ownership a reference, but 20 of the 24 live deals still
 * carry only a name — 15 of them "John Smith", who was never a user, worth
 * $1.39M between them. Grouping by id alone would collapse all of that into a
 * single "Unassigned" row and delete lines a forecast reader relies on.
 *
 * THIS IS A TRANSITION MEASURE AND NOT THE PERMANENT SHAPE. Once ownership is
 * backfilled, grouping should move to the id alone and the name branch should
 * be deleted rather than left as a permanent fallback. Stated here as well as
 * in ForecastPage so whoever backfills finds it from either direction.
 *
 * WHY `useTeamPerformance` DOES NOT USE THIS, which looks like an oversight and
 * is not: that hook produces one row per ROSTER MEMBER, and a name with no user
 * behind it is not a member — "John Smith" cannot appear in a list of people
 * who can be given a quota or a manager. It therefore buckets resolved owners
 * and reports the remainder as one honest `unattributed` total. Same data, two
 * legitimately different questions: "how is each PERSON doing" versus "where is
 * all the pipeline". Do not unify them without deciding which question the
 * caller is asking.
 */

/** What the UI shows when a deal names nobody at all. */
export const UNASSIGNED_LABEL = 'Unassigned';

/** The minimum a deal must carry to be attributed. */
export interface OwnedDeal {
  assigned_to_user_id?: number | string | null;
  assigned_to?: string | null;
}

export interface OwnerIdentity {
  /**
   * The grouping key: `id:<userId>` where ownership resolved, `name:<string>`
   * where it did not.
   *
   * THE PREFIX IS LOAD-BEARING. Without it a user id of 5 and a rep literally
   * named "5" produce the same key and their deals merge. Cheap to keep, and
   * the kind of defect that surfaces once as an inexplicable total.
   */
  key: string;
  /** Null when ownership is only a name. */
  userId: number | null;
  /** Display name — the resolved user's, the legacy string, or Unassigned. */
  name: string;
  /** True when this row is a name with no user behind it. */
  unresolved: boolean;
}

const hasValue = (v: unknown): boolean =>
  v !== null && v !== undefined && String(v).trim() !== '';

/** How a single deal is attributed. Pure, and the only place the rule lives. */
export function ownerIdentityOf(deal: OwnedDeal): OwnerIdentity {
  const raw = deal.assigned_to_user_id;
  if (hasValue(raw)) {
    const userId = Number(raw);
    if (Number.isInteger(userId)) {
      return {
        key: `id:${userId}`,
        userId,
        // The NAME still comes from the row: the server resolves it through a
        // tenant-matched join (039), so this never resolves an id locally.
        name: (deal.assigned_to ?? '').trim() || `User ${userId}`,
        unresolved: false,
      };
    }
  }
  const name = (deal.assigned_to ?? '').trim() || UNASSIGNED_LABEL;
  return { key: `name:${name}`, userId: null, name, unresolved: true };
}

export interface OwnerGroup<T> extends OwnerIdentity {
  deals: T[];
}

/**
 * Groups deals by owner, biggest group first, with the ownerless row LAST.
 *
 * Unassigned sorts last regardless of size on purpose: it is the largest group
 * in this workspace today, and letting it head the table would make the
 * unattributed remainder look like the top performer.
 */
export function groupDealsByOwner<T extends OwnedDeal>(deals: T[]): Array<OwnerGroup<T>> {
  const groups = new Map<string, OwnerGroup<T>>();
  for (const deal of deals) {
    const id = ownerIdentityOf(deal);
    const existing = groups.get(id.key);
    if (existing) existing.deals.push(deal);
    else groups.set(id.key, { ...id, deals: [deal] });
  }
  return Array.from(groups.values()).sort((a, b) => {
    if (a.name === UNASSIGNED_LABEL) return 1;
    if (b.name === UNASSIGNED_LABEL) return -1;
    return b.deals.length - a.deals.length;
  });
}

/**
 * The owner options a filter should offer: the people who actually own
 * something here, plus the unresolved names that are really in the data.
 *
 * Built from the deals rather than from the roster, and that is the point. The
 * Reports page used to hardcode five colleagues, three of whom own nothing, and
 * omitted "John Smith" — who "owns" 15 deals and is not a user. A filter built
 * from the roster would repeat the omission; one built from the data cannot.
 */
export function ownerFilterOptions<T extends OwnedDeal>(
  deals: T[],
): Array<{ key: string; name: string; unresolved: boolean; count: number }> {
  return groupDealsByOwner(deals).map(g => ({
    key: g.key, name: g.name, unresolved: g.unresolved, count: g.deals.length,
  }));
}
