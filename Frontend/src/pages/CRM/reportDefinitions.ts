import { DashboardDeal, dealValue } from '../../hooks/useDashboardData';
import { StageLookup } from '../../utils/pipelinesApi';
import { groupDealsByOwner, UNASSIGNED_LABEL } from '../../utils/dealOwnership';

/**
 * THE REPORTS, AS DATA.
 *
 * Every figure here is computed from what was fetched. This replaces 68
 * hardcoded metric rows across ten hand-written cards — "$847K Revenue +12%",
 * "Alex: $342K #1", "Total: 247" — none of which came from a query.
 *
 * WHY DATA AND NOT JSX WITH REAL VALUES SUBSTITUTED. Three filters (Search,
 * Date Range, Owner) were removed in phase (b) because they could not work
 * against hand-written cards: there was nothing to filter. A card that is a
 * `compute(data)` function can be filtered, counted, searched and tested
 * without a browser — and this file is unit-tested directly, with no render.
 *
 * WHAT A COMPUTE FUNCTION MAY NOT DO:
 *  - invent a number. Every row traces to a fetched field.
 *  - report 0 where the answer is "unknown". A rate with no closed deals is
 *    `unavailable`, not 0%.
 *  - drop rows it cannot classify. A deal with no source becomes an explicit
 *    "No source recorded" row, never a silent omission — that is how a
 *    breakdown comes to disagree with the total above it.
 */

// ── Shapes ───────────────────────────────────────────────────────────────────

export type ReportSection =
  | 'sales' | 'pipeline' | 'activity' | 'leads' | 'revenue' | 'accounts' | 'custom';

/** A lead as the funnel reads it. `status` carries the STAGE vocabulary. */
export interface FunnelLead {
  /**
   * The frontend `Lead.status` field, which `leadsApi` maps from the DB column
   * `leads.stage` — NOT from `leads.status`, which is the separate lifecycle
   * flag `active|inactive|nurturing`. CLAUDE.md documents the two as a known
   * drift; conflating them here would make every funnel row read 0.
   */
  status?: string | null;
}

export interface ReportData {
  /** Already narrowed by the Date Range and Owner filters. */
  deals: DashboardDeal[];
  leads: FunnelLead[];
  contactCount: number;
  /** Won / lost / open, asked of the workspace's own stage configuration. */
  outcome: (d: DashboardDeal) => 'open' | 'won' | 'lost';
  /** For stage display names and ordering. */
  stageOf: StageLookup;
  /**
   * Deals a date filter had to exclude for having no expected close date.
   * Rendered as a caveat rather than absorbed, because 5 of the 24 live deals
   * have no close date and would otherwise vanish from a filtered view while
   * the remaining figures still looked complete.
   */
  excludedNoCloseDate: number;
  /** True while a date range is narrowing the set, for label honesty. */
  dateFiltered: boolean;
}

export interface ReportRow {
  label: string;
  value: string;
  /** Renders muted — for "none recorded" rows, which are facts, not results. */
  muted?: boolean;
}

export interface ReportResult {
  /** Absent when `unavailable` is set — there are no rows to show. */
  rows?: ReportRow[];
  /**
   * Set when the report cannot be computed from what is currently there. The
   * card then renders this sentence instead of rows — the same honest state
   * the permanently-unbacked reports get, but decided at runtime.
   */
  unavailable?: string;
  /** Set when the figures ARE real but incomplete, and the gap must be shown. */
  caveat?: string;
}

export interface ReportDef {
  id: string;
  title: string;
  icon: string;
  section: ReportSection;
  /** Whether the Date Range filter changes this report's numbers. */
  usesDateRange: boolean;
  /** Whether the Owner filter changes this report's numbers. */
  usesOwner: boolean;
  compute: (data: ReportData) => ReportResult;
}

// ── Formatting ───────────────────────────────────────────────────────────────

export const money = (n: number): string =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000    ? `$${Math.round(n / 1_000)}K`
  : `$${Math.round(n).toLocaleString()}`;

const pct = (part: number, whole: number): string =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—';

const sum = (deals: DashboardDeal[]) => deals.reduce((s, d) => s + dealValue(d), 0);

/** Days since an ISO timestamp, or null when there is none. */
const daysSince = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
};

/** The caveat every date-filtered report carries when rows were excluded. */
const closeDateCaveat = (d: ReportData): string | undefined =>
  d.dateFiltered && d.excludedNoCloseDate > 0
    ? `${d.excludedNoCloseDate} ${d.excludedNoCloseDate === 1 ? 'deal has' : 'deals have'} `
      + 'no expected close date and are excluded from this date range.'
    : undefined;

// ── The reports ──────────────────────────────────────────────────────────────

export const REPORTS: ReportDef[] = [
  /* ══ Sales ═══════════════════════════════════════════════════════════════ */
  {
    id: 'sales-by-rep', title: 'Sales by Rep', icon: '👥', section: 'sales',
    usesDateRange: true, usesOwner: true,
    /*
     * WON value per owner. Was "Alex: $342K #1 / Sarah: $298K #2 / Mike: $207K
     * #3" — a ranking of three people, two of whom own no deals at all.
     *
     * Grouped through `dealOwnership`, so an unresolved name gets its own row
     * rather than being folded into "Unassigned". That is what keeps the 15
     * deals attributed to "John Smith" visible instead of silently pooled.
     */
    compute: (d) => {
      const won = d.deals.filter(x => d.outcome(x) === 'won');
      if (won.length === 0) {
        return {
          unavailable: d.dateFiltered
            ? 'No deals have been won with an expected close date in this range.'
            : 'No deals have been won yet, so there is nothing to attribute to a rep.',
        };
      }
      const groups = groupDealsByOwner(won);
      const total = sum(won);
      return {
        rows: groups.map(g => ({
          label: g.name + (g.unresolved && g.name !== UNASSIGNED_LABEL ? ' (unmatched name)' : ''),
          value: `${money(sum(g.deals))} · ${pct(sum(g.deals), total)}`,
          muted: g.unresolved,
        })),
        caveat: closeDateCaveat(d),
      };
    },
  },
  {
    id: 'win-loss', title: 'Win/Loss Analysis', icon: '📉', section: 'sales',
    usesDateRange: true, usesOwner: true,
    /*
     * Was "Won: 23 (68%) / Lost: 11 (32%)" against a real 1 and 1.
     *
     * The share is of DECIDED deals, never of all deals: dividing by every
     * deal gives a "win rate" that can only fall as open deals are added.
     */
    compute: (d) => {
      const won = d.deals.filter(x => d.outcome(x) === 'won').length;
      const lost = d.deals.filter(x => d.outcome(x) === 'lost').length;
      const decided = won + lost;
      if (decided === 0) {
        return { unavailable: 'No deals have closed yet, so there is no win rate to report.' };
      }
      return {
        rows: [
          { label: `Won: ${won}`, value: pct(won, decided) },
          { label: `Lost: ${lost}`, value: pct(lost, decided) },
          { label: 'Of decided deals', value: String(decided), muted: true },
        ],
        caveat: closeDateCaveat(d),
      };
    },
  },

  /* ══ Pipeline ════════════════════════════════════════════════════════════ */
  {
    id: 'pipeline-health', title: 'Pipeline Health', icon: '🏥', section: 'pipeline',
    usesDateRange: true, usesOwner: true,
    /*
     * Open value by stage. Was "Total: $2.4M / Qualified: $620K / Proposal:
     * $890K / Negotiation: $890K" — a fixed ladder that did not match this
     * workspace's stages at all.
     *
     * Stage NAMES and their order come from the workspace's own configuration
     * via `stageOf`, never from literals: the whole point of migration 037 is
     * that a tenant names its own stages.
     */
    compute: (d) => {
      const open = d.deals.filter(x => d.outcome(x) === 'open');
      if (open.length === 0) {
        return { unavailable: 'No open deals, so there is no pipeline to break down.' };
      }
      /*
       * KEYED BY PIPELINE **AND** SLUG, not by slug alone.
       *
       * Two pipelines may name a stage with the same slug and a different
       * display name — a "qualified" in Sales and in Renewals. Keyed by slug
       * only, those merge into one row that carries whichever name was seen
       * first, so a stage silently absorbs another pipeline's deals and the
       * label is wrong for half of them. Found by the test for the ambiguous
       * slug case, not by review, immediately after widening the type to make
       * per-pipeline resolution possible at all.
       */
      const byStage = new Map<string, { name: string; index: number; value: number; n: number }>();
      let unresolved = 0;
      for (const deal of open) {
        const pipelineSlug = deal.pipeline_id ?? null;
        const meta = d.stageOf(deal.stage, pipelineSlug);
        if (!meta) { unresolved++; continue; }
        const key = `${pipelineSlug ?? '-'}::${meta.slug}`;
        const cur = byStage.get(key)
          ?? { name: meta.name, index: meta.index, value: 0, n: 0 };
        cur.value += dealValue(deal);
        cur.n += 1;
        byStage.set(key, cur);
      }
      const rows: ReportRow[] = [
        { label: 'Total open', value: money(sum(open)) },
        ...Array.from(byStage.values())
          .sort((a, b) => a.index - b.index)
          .map(s => ({ label: `${s.name}: ${s.n}`, value: money(s.value) })),
      ];
      // Never dropped silently — an unresolvable stage would otherwise make the
      // rows disagree with the total directly above them.
      if (unresolved > 0) {
        rows.push({ label: `Stage not recognised: ${unresolved}`, value: '—', muted: true });
      }
      return { rows, caveat: closeDateCaveat(d) };
    },
  },
  {
    id: 'pipeline-by-owner', title: 'Pipeline by Owner', icon: '👤', section: 'pipeline',
    usesDateRange: true, usesOwner: true,
    /*
     * OPEN value per owner — the same grouping as Sales by Rep, summing a
     * different set. Was "Alex: $892K / Sarah: $745K / Mike: $563K / Emily:
     * $200K", inventing pipeline for three people who own none.
     */
    compute: (d) => {
      const open = d.deals.filter(x => d.outcome(x) === 'open');
      if (open.length === 0) {
        return { unavailable: 'No open deals to attribute to an owner.' };
      }
      const groups = groupDealsByOwner(open);
      return {
        rows: groups.map(g => ({
          label: `${g.name}${g.unresolved && g.name !== UNASSIGNED_LABEL ? ' (unmatched name)' : ''}: ${g.deals.length}`,
          value: money(sum(g.deals)),
          muted: g.unresolved,
        })),
        caveat: closeDateCaveat(d),
      };
    },
  },
  {
    id: 'aging-pipeline', title: 'Aging Pipeline', icon: '⏳', section: 'pipeline',
    // Age is measured from creation, which no date range should reinterpret.
    usesDateRange: false, usesOwner: true,
    /*
     * AN APPROXIMATION, AND LABELLED AS ONE. Was "30-60 days: 8 / 60-90: 5 /
     * 90+: 3 ⚠️" from literals.
     *
     * True aging is time in the CURRENT STAGE — a deal three months old that
     * moved yesterday is not stalled. That needs `deal_stage_history`, which
     * exists and holds ZERO rows, so this measures age since creation instead
     * and says so in a caveat rather than presenting it as stage-aging.
     */
    compute: (d) => {
      const open = d.deals.filter(x => d.outcome(x) === 'open');
      if (open.length === 0) {
        return { unavailable: 'No open deals, so there is nothing aging.' };
      }
      const buckets = [
        { label: 'Under 30 days', min: 0, max: 30 },
        { label: '30–60 days', min: 30, max: 60 },
        { label: '60–90 days', min: 60, max: 90 },
        { label: 'Over 90 days', min: 90, max: Infinity },
      ];
      const counted = buckets.map(b => {
        const inBucket = open.filter(x => {
          const age = daysSince(x.created_at);
          return age != null && age >= b.min && age < b.max;
        });
        return { ...b, n: inBucket.length, value: sum(inBucket) };
      });
      const undated = open.filter(x => daysSince(x.created_at) == null).length;
      const rows: ReportRow[] = counted
        .filter(b => b.n > 0)
        .map(b => ({ label: `${b.label}: ${b.n}`, value: money(b.value) }));
      if (undated > 0) {
        rows.push({ label: `No created date: ${undated}`, value: '—', muted: true });
      }
      return {
        rows,
        caveat: 'Measured from when each deal was created. Time in the current '
          + 'stage — the better measure of a stalled deal — needs stage history, '
          + 'which is not being recorded yet.',
      };
    },
  },

  /* ══ Leads ═══════════════════════════════════════════════════════════════ */
  {
    id: 'lead-funnel', title: 'Lead Conversion Funnel', icon: '🔄', section: 'leads',
    // Lead stages carry no deal dates or owners.
    usesDateRange: false, usesOwner: false,
    /*
     * The one card on this page that was ALREADY real, moved into the array so
     * it is defined the same way as the rest. Its figures and behaviour are
     * unchanged: 38 / 20 / 14 / 4 / 2 against live data.
     */
    compute: (d) => {
      const byStage = (v: string) => d.leads.filter(l => l.status === v).length;
      const won = byStage('won');
      const lost = byStage('lost');
      const rows: ReportRow[] = [
        { label: `Leads: ${d.leads.length}`, value: '' },
        { label: `Contacts: ${d.contactCount}`, value: '' },
        { label: `Qualified: ${byStage('qualified')}`, value: '' },
        { label: `Won: ${won}`, value: '' },
        { label: `Lost: ${lost}`, value: '' },
      ];
      // Null, not 0%, when nothing has been decided.
      rows.push(won + lost > 0
        ? { label: 'Conversion', value: pct(won, won + lost) }
        : { label: 'Conversion', value: 'No leads decided yet', muted: true });
      return { rows };
    },
  },

  /* ══ Revenue ═════════════════════════════════════════════════════════════ */
  {
    id: 'revenue-by-source', title: 'Revenue by Source', icon: '📊', section: 'revenue',
    usesDateRange: true, usesOwner: true,
    /*
     * Was "🎯 Lead Gen: $298K (69%) / 🌐 Website: $89K (20%) / ✍️ Manual: $48K
     * (11%)" — and "Lead Gen" is the SEPARATE PLATFORM whose code was deleted
     * from this repo, so the largest slice attributed revenue to something that
     * is not part of this product.
     *
     * Sources are the vocabulary migration 040 normalised. 15 of the 24 live
     * deals record none, and those get their own row: dropping them would make
     * the slices add to a fraction of the real total while looking whole.
     */
    compute: (d) => {
      const won = d.deals.filter(x => d.outcome(x) === 'won');
      if (won.length === 0) {
        return {
          unavailable: d.dateFiltered
            ? 'No deals won with an expected close date in this range.'
            : 'No deals have been won yet, so there is no revenue to attribute.',
        };
      }
      const bySource = new Map<string, { value: number; n: number }>();
      let noSource = 0, noSourceValue = 0;
      for (const deal of won) {
        const src = (deal.source ?? '').trim();
        if (!src) { noSource++; noSourceValue += dealValue(deal); continue; }
        const cur = bySource.get(src) ?? { value: 0, n: 0 };
        cur.value += dealValue(deal); cur.n += 1;
        bySource.set(src, cur);
      }
      const total = sum(won);
      const rows: ReportRow[] = Array.from(bySource.entries())
        .sort((a, b) => b[1].value - a[1].value)
        .map(([src, v]) => ({ label: src, value: `${money(v.value)} · ${pct(v.value, total)}` }));
      if (noSource > 0) {
        rows.push({
          label: `No source recorded: ${noSource}`,
          value: `${money(noSourceValue)} · ${pct(noSourceValue, total)}`,
          muted: true,
        });
      }
      return { rows, caveat: closeDateCaveat(d) };
    },
  },

  /* ══ Custom ══════════════════════════════════════════════════════════════ */
  {
    id: 'high-priority-deals', title: 'High Priority Deals', icon: '🎯', section: 'custom',
    usesDateRange: true, usesOwner: true,
    /*
     * Was "Priority: 18 / Total: $892K / Close This Week: 5 deals". The real
     * count of High-priority deals is 6; 18 is how many are Medium.
     *
     * "CLOSING THIS WEEK" IS NOW LABELLED "expected close", which is the only
     * thing the data supports: there is no actual close date on a deal, only
     * `expected_close_date`. Saying "closing" of an expectation is the same
     * overstatement as an invented number, one word smaller.
     */
    compute: (d) => {
      const high = d.deals.filter(x => (x.priority ?? '').toLowerCase() === 'high');
      if (high.length === 0) {
        return { unavailable: 'No deals are marked high priority.' };
      }
      const open = high.filter(x => d.outcome(x) === 'open');
      const weekAway = new Date(); weekAway.setDate(weekAway.getDate() + 7);
      const soon = open.filter(x => {
        if (!x.expected_close_date) return false;
        const t = new Date(x.expected_close_date).getTime();
        return Number.isFinite(t) && t >= Date.now() && t <= weekAway.getTime();
      });
      const undated = open.filter(x => !x.expected_close_date).length;
      const rows: ReportRow[] = [
        { label: `High priority: ${high.length}`, value: money(sum(high)) },
        { label: `Still open: ${open.length}`, value: money(sum(open)) },
        { label: 'Expected close within 7 days', value: String(soon.length) },
      ];
      if (undated > 0) {
        rows.push({ label: `No expected close date: ${undated}`, value: '—', muted: true });
      }
      return { rows, caveat: closeDateCaveat(d) };
    },
  },
];

export const reportsIn = (section: ReportSection) => REPORTS.filter(r => r.section === section);

/**
 * The deals ONE report should see, given the active filters.
 *
 * A pure function, and here rather than in the page, because getting it wrong
 * is invisible: `usesDateRange` was consulted only for the footnote while every
 * card received the fully filtered set, so Aging Pipeline — which measures age
 * from creation and declares `usesDateRange: false` — silently answered a
 * different question the moment a quarter was selected (22 deals / $1.56M ->
 * 10 / $567K). It type-checked perfectly and looked plausible.
 *
 * Extracted so the rule is asserted directly rather than trusted.
 */
export function dealsForReport(
  def: Pick<ReportDef, 'usesDateRange' | 'usesOwner'>,
  deals: DashboardDeal[],
  opts: {
    bounds: { from: Date; to: Date } | null;
    ownerKey: string;
    ownerKeyOf: (d: DashboardDeal) => string;
  },
): DashboardDeal[] {
  let working = deals;
  if (def.usesDateRange && opts.bounds) {
    const { from, to } = opts.bounds;
    working = working.filter(d => {
      if (!d.expected_close_date) return false;
      const t = new Date(d.expected_close_date).getTime();
      // An unparseable date counts as missing, never as in-range.
      return Number.isFinite(t) && t >= from.getTime() && t <= to.getTime();
    });
  }
  if (def.usesOwner && opts.ownerKey !== 'all') {
    working = working.filter(d => opts.ownerKeyOf(d) === opts.ownerKey);
  }
  return working;
}
