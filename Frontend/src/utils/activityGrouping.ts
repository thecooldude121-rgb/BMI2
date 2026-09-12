import type { ActivityRecord } from './activitiesApi';

/**
 * Grouping for the Activities page's By Type / By Owner / By Account views.
 *
 * Pure and separate from the page on purpose: `activities` is 0 rows in every
 * tenant of the live database, so these functions cannot be exercised against
 * real data at all. Fixtures in `activityGrouping.test.ts` are the only place
 * the behaviour is provable, and fabricating activity rows to make a live check
 * possible would break a real rule to satisfy a verification one.
 *
 * THREE DECISIONS, recorded because each had a wrong answer that looks right:
 *
 * 1. **Buckets come from the data, never from the vocabulary.** `ACTIVITY_TYPES`
 *    lists twelve types. Rendering all twelve, ten of them empty, would put ten
 *    rows on screen that describe nothing — a fabricated row in a different
 *    costume. Only values actually present get a bucket.
 *
 * 2. **Absence is its own bucket, labelled, and always sorted last.** A null
 *    type, an unassigned owner and an activity with no company are real states.
 *    Dropping those rows would make the group counts disagree with the page's
 *    own total, which is how a 63-vs-15 mismatch got onto ReportsPage; folding
 *    them into a real bucket would attribute work to a person or account that
 *    did not do it.
 *
 * 3. **Group on the RECORD, not the display model.** `ActivitiesPage` maps
 *    `type: (r.type ?? 'note')`, so a null type presents as a note. Grouping on
 *    that would file every untyped activity under Note and report a type nobody
 *    chose. The record is the truth; the display model has already guessed.
 */

export type ActivityGroupMode = 'type' | 'owner' | 'account';

export interface ActivityGroup<T> {
  /** Stable identity for React keys. Prefixed so a bucket can never collide
   *  with the sentinel below. */
  key: string;
  label: string;
  items: T[];
  /** True for the "no value recorded" bucket, so the UI can style it as an
   *  absence rather than a category. */
  isUnattributed: boolean;
}

const UNATTRIBUTED_LABEL: Record<ActivityGroupMode, string> = {
  type: 'No type recorded',
  owner: 'Unassigned',
  account: 'No account linked',
};

/**
 * The bucket a record belongs to: `[key, label]`, or null when the field is
 * absent.
 *
 * Account is keyed on `company_id` and LABELLED with `company_name` — identity
 * by reference, display by capture, the same split migration 043 settled for
 * `forecast_snapshots`. Two accounts may share a display name; they must not
 * share a bucket.
 *
 * Activities hang off exactly one parent (lead, deal, contact OR company), so a
 * deal's activity carries no `company_id` and lands in "No account linked".
 * Rolling it up to the deal's company would mean matching on `company_name`,
 * which is the defect migrations 039-043 exist to remove. The view states the
 * coverage instead of guessing.
 */
function bucketOf(record: ActivityRecord, mode: ActivityGroupMode): [string, string] | null {
  if (mode === 'type') {
    const t = record.type?.trim();
    return t ? [`type:${t}`, t] : null;
  }
  if (mode === 'owner') {
    const o = record.assigned_to?.trim();
    return o ? [`owner:${o}`, o] : null;
  }
  const id = record.company_id?.trim();
  if (!id) return null;
  const name = record.company_name?.trim();
  return [`account:${id}`, name || id];
}

/**
 * Groups `items` by the matching `records` entry.
 *
 * The two arrays are INDEX-PAIRED, which is how `ActivitiesPage` already pairs
 * its record list with its display list. A record with no counterpart is
 * skipped rather than grouped against the wrong item.
 *
 * Order is count descending, then label A-Z for ties — deterministic, and it
 * needs no opinion about which activity type or which rep ranks above another.
 * The unattributed bucket is appended last regardless of size, because "we do
 * not know" is not a leader even when it is the largest.
 */
export function groupActivities<T>(
  mode: ActivityGroupMode,
  records: ActivityRecord[],
  items: T[],
): ActivityGroup<T>[] {
  const buckets = new Map<string, ActivityGroup<T>>();
  let unattributed: ActivityGroup<T> | null = null;

  records.forEach((record, i) => {
    if (i >= items.length) return;
    const item = items[i];

    const bucket = bucketOf(record, mode);
    if (!bucket) {
      unattributed ??= { key: `unattributed:${mode}`, label: UNATTRIBUTED_LABEL[mode], items: [], isUnattributed: true };
      unattributed.items.push(item);
      return;
    }

    const [key, label] = bucket;
    const existing = buckets.get(key);
    if (existing) existing.items.push(item);
    else buckets.set(key, { key, label, items: [item], isUnattributed: false });
  });

  const ordered = Array.from(buckets.values()).sort(
    (a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label),
  );

  /**
   * Two buckets that share a display name get their id appended.
   *
   * Keying on the id is what keeps two different accounts apart (see
   * `bucketOf`), and the live render proved why the LABEL then needs work too:
   * with C001 and C002 both named "Acme Ltd", the page showed "Acme Ltd" twice
   * with one row each, which reads as a rendering bug rather than as two
   * genuinely distinct accounts. Disambiguating only on collision keeps the
   * common case clean — no id is shown when a name is unique.
   */
  const nameCounts = new Map<string, number>();
  ordered.forEach(g => nameCounts.set(g.label, (nameCounts.get(g.label) ?? 0) + 1));
  const disambiguated = ordered.map(g =>
    (nameCounts.get(g.label) ?? 0) > 1
      ? { ...g, label: `${g.label} (${g.key.slice(g.key.indexOf(':') + 1)})` }
      : g,
  );

  return unattributed ? [...disambiguated, unattributed] : disambiguated;
}

/**
 * How much of the set a grouping could actually attribute, for the coverage line
 * the view renders above itself.
 *
 * This exists because "By Account" is expected to attribute very little — see
 * `bucketOf` — and a view that groups 3 of 24 rows while looking complete is
 * worse than one that says so. Same reasoning as `UNBACKED_REPORTS` on
 * ReportsPage.
 */
export function groupingCoverage<T>(groups: ActivityGroup<T>[]): {
  attributed: number;
  unattributed: number;
  total: number;
  buckets: number;
} {
  const unattributed = groups.find(g => g.isUnattributed)?.items.length ?? 0;
  const attributed = groups.filter(g => !g.isUnattributed).reduce((n, g) => n + g.items.length, 0);
  return {
    attributed,
    unattributed,
    total: attributed + unattributed,
    buckets: groups.filter(g => !g.isUnattributed).length,
  };
}
