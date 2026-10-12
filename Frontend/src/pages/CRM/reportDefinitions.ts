import type { DealsReport, UsdTotal } from '../../utils/dealsApi';

/**
 * THE REPORTS, AS DATA.
 *
 * Every figure here traces to a field the SERVER computed. This replaced 68
 * hardcoded metric rows across ten hand-written cards — "$847K Revenue +12%",
 * "Alex: $342K #1", "Total: 247" — none of which came from a query.
 *
 * SLICE 5b (2026-10-12): the cards used to compute from the 500 newest deals
 * the page had loaded, so past 500 every card was silently partial. They now
 * FORMAT the totals of GET /deals/report (filters applied on the server, the
 * close-date range skipping aging exactly as `usesDateRange` declares) and the
 * lead stage counts of GET /leads/summary. Money follows the board's rule:
 * only trustworthy USD is summed; the rest is counted as "not in USD".
 *
 * WHAT A COMPUTE FUNCTION MAY NOT DO:
 *  - invent a number. Every row traces to a served field.
 *  - report 0 where the answer is "unknown". A rate with nothing decided is
 *    `unavailable`, not 0%.
 *  - drop rows it cannot classify. No source, no owner, no close date each get
 *    an explicit row or caveat — that is how a breakdown comes to disagree
 *    with the total above it.
 */

// ── Shapes ───────────────────────────────────────────────────────────────────

export type ReportSection =
  | 'sales' | 'pipeline' | 'activity' | 'leads' | 'revenue' | 'accounts' | 'custom';

export interface ReportData {
  /** The server's totals, already narrowed by the page's filters. */
  report: DealsReport;
  /** Lead counts by stage (`leads.stage`, NOT the `leads.status` lifecycle flag). */
  leadsTotal: number;
  leadsByStage: Record<string, number>;
  /** Null when the contact total could not load — shown as unknown, never 0. */
  contactCount: number | null;
  /** True while a close-date range is narrowing this report. */
  dateFiltered: boolean;
}

export interface ReportRow {
  label: string;
  value: string;
  /** Renders muted — for "none recorded" rows, which are facts, not results. */
  muted?: boolean;
}

export interface ReportResult {
  rows?: ReportRow[];
  /** Set when the report cannot be computed from what is there. */
  unavailable?: string;
  /** Set when the figures ARE real but incomplete, and the gap must be shown. */
  caveat?: string;
}

export interface ReportDef {
  id: string;
  title: string;
  icon: string;
  section: ReportSection;
  /** Whether the close-date range changes this report (mirrors the server). */
  usesDateRange: boolean;
  /** Whether the Owner filter changes this report. */
  usesOwner: boolean;
  compute: (data: ReportData) => ReportResult;
}

// ── Formatting ───────────────────────────────────────────────────────────────

export const money = (n: number): string =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000    ? `$${Math.round(n / 1_000)}K`
  : `$${Math.round(n).toLocaleString()}`;

/** "$12K", plus "+ N not in USD" when some deals had no USD amount. */
export const usd = (t: Pick<UsdTotal, 'value_usd' | 'unconverted'>): string =>
  `${money(t.value_usd)}${t.unconverted > 0 ? ` + ${t.unconverted} not in USD` : ''}`;

const pct = (part: number, whole: number): string =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—';

const total = (rows: UsdTotal[]): UsdTotal => rows.reduce(
  (t, r) => ({ count: t.count + r.count, value_usd: t.value_usd + r.value_usd, unconverted: t.unconverted + r.unconverted }),
  { count: 0, value_usd: 0, unconverted: 0 },
);

const ownerLabel = (r: { label: string; unresolved: boolean }) =>
  r.label + (r.unresolved && r.label !== 'Unassigned' ? ' (unmatched name)' : '');

/** The caveat every date-filtered report carries when rows were excluded. */
const closeDateCaveat = (d: ReportData): string | undefined => {
  const n = d.report.excluded_no_close_date;
  return d.dateFiltered && n > 0
    ? `${n} ${n === 1 ? 'deal has' : 'deals have'} no expected close date and ${n === 1 ? 'is' : 'are'} excluded from this date range.`
    : undefined;
};

const AGING: { bucket: DealsReport['aging'][number]['bucket']; label: string }[] = [
  { bucket: 'under-30', label: 'Under 30 days' },
  { bucket: '30-60', label: '30–60 days' },
  { bucket: '60-90', label: '60–90 days' },
  { bucket: 'over-90', label: 'Over 90 days' },
];

// ── The reports ──────────────────────────────────────────────────────────────

export const REPORTS: ReportDef[] = [
  /* ══ Sales ═══════════════════════════════════════════════════════════════ */
  {
    id: 'sales-by-rep', title: 'Sales by Rep', icon: '👥', section: 'sales',
    usesDateRange: true, usesOwner: true,
    // WON value per owner. An unresolved name keeps its own row ("unmatched
    // name") rather than being pooled into Unassigned.
    compute: (d) => {
      const rows = d.report.won_by_owner;
      if (rows.length === 0) {
        return {
          unavailable: d.dateFiltered
            ? 'No deals have been won with an expected close date in this range.'
            : 'No deals have been won yet, so there is nothing to attribute to a rep.',
        };
      }
      const all = total(rows);
      return {
        rows: rows.map(r => ({
          label: `${ownerLabel(r)}: ${r.count}`,
          value: `${usd(r)} · ${pct(r.value_usd, all.value_usd)}`,
          muted: r.unresolved,
        })),
        caveat: closeDateCaveat(d),
      };
    },
  },
  {
    id: 'win-loss', title: 'Win/Loss Analysis', icon: '📉', section: 'sales',
    usesDateRange: true, usesOwner: true,
    // Won / (won + lost) by stage TYPE, every pipeline — the server's
    // definition (decided 2026-10-12). The share is of DECIDED deals only.
    compute: (d) => {
      const { won, lost } = d.report.outcome;
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
    // Open value by stage, every pipeline, in the server's pipeline-then-
    // position order. A stage is named by its pipeline when more than one
    // pipeline has open deals, so two "Qualified" stages never merge.
    compute: (d) => {
      const rows = d.report.open_by_stage;
      if (rows.length === 0) {
        return { unavailable: 'No open deals, so there is no pipeline to break down.' };
      }
      const multi = new Set(rows.map(r => r.pipeline_id)).size > 1;
      return {
        rows: [
          { label: `Total open: ${total(rows).count}`, value: usd(total(rows)) },
          ...rows.map(r => ({ label: `${multi ? `${r.pipeline_name} · ` : ''}${r.name}: ${r.count}`, value: usd(r) })),
        ],
        caveat: closeDateCaveat(d),
      };
    },
  },
  {
    id: 'pipeline-by-owner', title: 'Pipeline by Owner', icon: '👤', section: 'pipeline',
    usesDateRange: true, usesOwner: true,
    compute: (d) => {
      const rows = d.report.open_by_owner;
      if (rows.length === 0) return { unavailable: 'No open deals to attribute to an owner.' };
      return {
        rows: rows.map(r => ({ label: `${ownerLabel(r)}: ${r.count}`, value: usd(r), muted: r.unresolved })),
        caveat: closeDateCaveat(d),
      };
    },
  },
  {
    id: 'aging-pipeline', title: 'Aging Pipeline', icon: '⏳', section: 'pipeline',
    // Age is measured from creation, which no close-date range reinterprets —
    // the server skips the range for this card.
    usesDateRange: false, usesOwner: true,
    compute: (d) => {
      const by = new Map(d.report.aging.map(a => [a.bucket, a]));
      const open = total(d.report.aging);
      if (open.count === 0) return { unavailable: 'No open deals, so there is nothing aging.' };
      const rows: ReportRow[] = AGING
        .filter(b => (by.get(b.bucket)?.count ?? 0) > 0)
        .map(b => ({ label: `${b.label}: ${by.get(b.bucket)!.count}`, value: usd(by.get(b.bucket)!) }));
      const undated = by.get('undated');
      if (undated && undated.count > 0) rows.push({ label: `No created date: ${undated.count}`, value: '—', muted: true });
      return {
        rows,
        caveat: 'Measured from when each deal was created. Time in the current stage — the better '
          + 'measure of a stalled deal — is not computed here yet.',
      };
    },
  },

  /* ══ Leads ═══════════════════════════════════════════════════════════════ */
  {
    id: 'lead-funnel', title: 'Lead Conversion Funnel', icon: '🔄', section: 'leads',
    usesDateRange: false, usesOwner: false,
    /*
     * CONVERSION COUNTS CONVERTED LEADS (Venkat, 2026-10-12). It was won /
     * (won + lost), so a lead converted through the real conversion flow
     * (stage 'converted', migration 059) counted as neither a success nor a
     * decision — the more leads a team converted properly, the less the funnel
     * showed it. Now (won + converted) / (won + converted + lost).
     * Disqualified leads are shown on their own row and are NOT in the
     * denominator — that is a default, not a decision; see the slice report.
     */
    compute: (d) => {
      const n = (stage: string) => d.leadsByStage[stage] ?? 0;
      const won = n('won'); const converted = n('converted'); const lost = n('lost');
      const success = won + converted;
      const rows: ReportRow[] = [
        { label: `Leads: ${d.leadsTotal}`, value: '' },
        { label: d.contactCount === null ? 'Contacts: unknown' : `Contacts: ${d.contactCount}`, value: '', muted: d.contactCount === null },
        { label: `Qualified: ${n('qualified')}`, value: '' },
        { label: `Converted: ${converted}`, value: '' },
        { label: `Won: ${won}`, value: '' },
        { label: `Lost: ${lost}`, value: '' },
      ];
      if (n('disqualified') > 0) rows.push({ label: `Disqualified: ${n('disqualified')}`, value: '', muted: true });
      rows.push(success + lost > 0
        ? { label: 'Conversion', value: `${pct(success, success + lost)} (${success} of ${success + lost})` }
        : { label: 'Conversion', value: 'No leads decided yet', muted: true });
      return { rows };
    },
  },

  /* ══ Revenue ═════════════════════════════════════════════════════════════ */
  {
    id: 'revenue-by-source', title: 'Revenue by Source', icon: '📊', section: 'revenue',
    usesDateRange: true, usesOwner: true,
    compute: (d) => {
      const rows = d.report.won_by_source;
      if (rows.length === 0) {
        return {
          unavailable: d.dateFiltered
            ? 'No deals won with an expected close date in this range.'
            : 'No deals have been won yet, so there is no revenue to attribute.',
        };
      }
      const all = total(rows);
      return {
        rows: rows.map(r => r.source === null
          ? { label: `No source recorded: ${r.count}`, value: `${usd(r)} · ${pct(r.value_usd, all.value_usd)}`, muted: true }
          : { label: `${r.source}: ${r.count}`, value: `${usd(r)} · ${pct(r.value_usd, all.value_usd)}` }),
        caveat: closeDateCaveat(d),
      };
    },
  },

  /* ══ Custom ══════════════════════════════════════════════════════════════ */
  {
    id: 'high-priority-deals', title: 'High Priority Deals', icon: '🎯', section: 'custom',
    usesDateRange: true, usesOwner: true,
    // "Expected close", never "closing": only an expectation is recorded.
    compute: (d) => {
      const h = d.report.high_priority;
      if (h.all.count === 0) return { unavailable: 'No deals are marked high priority.' };
      const rows: ReportRow[] = [
        { label: `High priority: ${h.all.count}`, value: usd(h.all) },
        { label: `Still open: ${h.open.count}`, value: usd(h.open) },
        { label: 'Expected close within the next 7 days', value: String(h.closing_7d) },
      ];
      if (h.open_no_close > 0) rows.push({ label: `No expected close date: ${h.open_no_close}`, value: '—', muted: true });
      return { rows, caveat: closeDateCaveat(d) };
    },
  },
];

export const reportsIn = (section: ReportSection) => REPORTS.filter(r => r.section === section);
