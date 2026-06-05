/**
 * ForecastPage — manager-facing quarter/category view.
 *
 * Purpose: period roll-up for pipeline review, commit tracking, and
 *          rep comparison. Distinct from /crm/deals which is the rep's
 *          daily kanban workspace.
 *
 * Data source: same fetchDeals() API as the Deals page — no extra backend
 * endpoints are needed for the current feature set.
 *
 * Live features (real data):
 *   - Forecast category breakdown: Pipeline / Best Case / Commit / Closed
 *   - Quarter roll-up: filter by current or next quarter
 *   - Rep comparison table: aggregated by assigned_to
 *   - Summary KPIs: total per category for the selected period
 *
 * Not yet available (requires historical snapshots):
 *   - Slippage tracking
 *   - Commit vs Actual analysis
 *
 * Category inference (when forecast_category is null):
 *   closed-won  → Closed
 *   negotiation → Commit
 *   proposal    → Best Case
 *   prospecting / qualified → Pipeline
 *   closed-lost → excluded from forecast
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, ChevronLeft, ChevronRight, TrendingUp, DollarSign,
  CheckCircle2, Clock, AlertTriangle, Users, BarChart3, Info,
  ArrowRight,
} from 'lucide-react';
import { fetchDeals } from '../../utils/dealsApi';
import { daysFromNow, formatCloseDate, parseDateMs } from '../../utils/dateUtils';

// ── Types ─────────────────────────────────────────────────────────────────────

type ForecastCategory = 'pipeline' | 'best-case' | 'commit' | 'closed';

interface ForecastDeal {
  id: string;
  name: string;
  company: string;
  owner: string;
  value: number;
  stage: string;
  closeDate: string;
  category: ForecastCategory;
}

interface RepRow {
  name: string;
  pipeline: number;
  bestCase: number;
  commit: number;
  closed: number;
  dealCount: number;
}

interface QuarterBounds {
  label: string;       // "Q2 2026"
  start: Date;
  end: Date;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the start and end of a calendar quarter offset from today.
 * offset=0 → current quarter, offset=1 → next quarter.
 */
function getQuarterBounds(offset = 0): QuarterBounds {
  const now = new Date();
  const year = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3); // 0-indexed quarter
  const targetQ = q + offset;
  const adjustedYear = year + Math.floor(targetQ / 4);
  const adjustedQ = ((targetQ % 4) + 4) % 4;

  const start = new Date(adjustedYear, adjustedQ * 3, 1);
  const end   = new Date(adjustedYear, adjustedQ * 3 + 3, 0); // last day of quarter
  return {
    label: `Q${adjustedQ + 1} ${adjustedYear}`,
    start,
    end,
  };
}

/**
 * Maps a raw API deal to a ForecastCategory.
 * Returns null for closed-lost deals (excluded from forecast).
 */
function inferCategory(deal: any): ForecastCategory | null {
  const explicit = (deal.forecast_category || '').toLowerCase().trim();
  if (explicit === 'commit')                          return 'commit';
  if (explicit === 'best case' || explicit === 'best-case') return 'best-case';
  if (explicit === 'pipeline')                        return 'pipeline';
  if (explicit === 'closed')                          return 'closed';

  // Fall back to stage
  const stage = (deal.stage || '').toLowerCase();
  if (stage === 'closed-won')  return 'closed';
  if (stage === 'closed-lost') return null;
  if (stage === 'negotiation') return 'commit';
  if (stage === 'proposal')    return 'best-case';
  return 'pipeline'; // prospecting, qualified, or unknown
}

const fmt = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ForecastCategory, {
  label: string;
  description: string;
  accentColor: string;
  bgClass: string;
  textClass: string;
  badgeClass: string;
  icon: React.ReactNode;
}> = {
  pipeline: {
    label: 'Pipeline',
    description: 'Prospecting & Qualified — early stage opportunities',
    accentColor: '#6366f1',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-700',
    badgeClass: 'bg-indigo-100 text-indigo-700',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  'best-case': {
    label: 'Best Case',
    description: 'Proposal stage — possible if everything goes right',
    accentColor: '#f59e0b',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    badgeClass: 'bg-amber-100 text-amber-700',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  commit: {
    label: 'Commit',
    description: 'Negotiation — rep is committing to this close',
    accentColor: '#10b981',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  closed: {
    label: 'Closed Won',
    description: 'Already closed this period',
    accentColor: '#64748b',
    bgClass: 'bg-slate-50',
    textClass: 'text-slate-700',
    badgeClass: 'bg-slate-100 text-slate-700',
    icon: <DollarSign className="h-4 w-4" />,
  },
};

const CATEGORIES: ForecastCategory[] = ['pipeline', 'best-case', 'commit', 'closed'];

// ── Sub-components ────────────────────────────────────────────────────────────

const DealRow: React.FC<{ deal: ForecastDeal }> = ({ deal }) => {
  const daysLeft = daysFromNow(deal.closeDate);
  const urgency =
    daysLeft === null ? 'text-gray-400' :
    daysLeft < 0     ? 'text-red-600 font-medium' :
    daysLeft <= 7    ? 'text-amber-600 font-medium' :
    'text-gray-500';

  return (
    <div className="flex items-start justify-between py-2 px-3 hover:bg-gray-50 rounded-md transition-colors group">
      <div className="min-w-0 flex-1 mr-2">
        <p className="text-[12px] font-medium text-gray-900 truncate leading-snug">{deal.name}</p>
        <p className="text-[11px] text-gray-400 truncate">{deal.company || '—'}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-[12px] font-semibold text-gray-900 tabular-nums">{fmt(deal.value)}</p>
        <p className={`text-[10px] ${urgency}`}>{formatCloseDate(deal.closeDate)}</p>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const ForecastPage: React.FC = () => {
  const navigate = useNavigate();
  const [rawDeals, setRawDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quarterOffset, setQuarterOffset] = useState(0); // 0 = current, 1 = next
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setRefreshing(true);
    fetchDeals()
      .then(deals => setRawDeals(deals))
      .catch(() => setRawDeals([]))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [refreshKey]);

  // ── Derived state ───────────────────────────────────────────────────────────
  const quarter = useMemo(() => getQuarterBounds(quarterOffset), [quarterOffset]);

  /**
   * All deals mapped to ForecastDeal, excluding closed-lost.
   * Filtered to the selected quarter's expected_close_date window,
   * except Closed deals which are filtered to close date in the quarter.
   */
  const forecastDeals = useMemo((): ForecastDeal[] => {
    return rawDeals
      .map((d: any): ForecastDeal | null => {
        const category = inferCategory(d);
        if (!category) return null; // closed-lost: exclude

        const closeDate = d.expected_close_date
          ? d.expected_close_date.split('T')[0]
          : '';

        return {
          id:        d.id,
          name:      d.name || d.title || 'Untitled',
          company:   d.company_name || '',
          owner:     d.assigned_to || 'Unassigned',
          value:     parseFloat(d.value) || 0,
          stage:     d.stage || '',
          closeDate,
          category,
        };
      })
      .filter((d): d is ForecastDeal => d !== null)
      .filter(d => {
        // No close date set — include in pipeline/best-case/commit views
        // but NOT in closed view (closed-won deals should have a close date)
        if (!d.closeDate) return d.category !== 'closed';

        const closeMs = parseDateMs(d.closeDate);
        // parseDateMs returns Infinity for missing/invalid/out-of-range dates
        if (!isFinite(closeMs)) return d.category !== 'closed';

        // For closed deals: must have closed in the selected quarter
        // For active deals: expected close date must fall in the quarter
        return closeMs >= quarter.start.getTime() && closeMs <= quarter.end.getTime();
      });
  }, [rawDeals, quarter]);

  // Group deals by category
  const categorized = useMemo((): Record<ForecastCategory, ForecastDeal[]> => ({
    pipeline:   forecastDeals.filter(d => d.category === 'pipeline'),
    'best-case': forecastDeals.filter(d => d.category === 'best-case'),
    commit:     forecastDeals.filter(d => d.category === 'commit'),
    closed:     forecastDeals.filter(d => d.category === 'closed'),
  }), [forecastDeals]);

  // Summary KPIs
  const totals = useMemo(() => ({
    pipeline: categorized.pipeline.reduce((s, d) => s + d.value, 0),
    bestCase: categorized['best-case'].reduce((s, d) => s + d.value, 0),
    commit:   categorized.commit.reduce((s, d) => s + d.value, 0),
    closed:   categorized.closed.reduce((s, d) => s + d.value, 0),
  }), [categorized]);

  // Rep comparison — aggregate all non-closed deals + closed
  const repRows = useMemo((): RepRow[] => {
    const map = new Map<string, RepRow>();
    forecastDeals.forEach(d => {
      const existing = map.get(d.owner) ?? {
        name: d.owner, pipeline: 0, bestCase: 0, commit: 0, closed: 0, dealCount: 0
      };
      existing.dealCount += 1;
      if (d.category === 'pipeline')   existing.pipeline += d.value;
      if (d.category === 'best-case')  existing.bestCase  += d.value;
      if (d.category === 'commit')     existing.commit    += d.value;
      if (d.category === 'closed')     existing.closed    += d.value;
      map.set(d.owner, existing);
    });
    return Array.from(map.values())
      .sort((a, b) => (b.commit + b.closed) - (a.commit + a.closed));
  }, [forecastDeals]);

  const maxRepTotal = useMemo(
    () => Math.max(...repRows.map(r => r.pipeline + r.bestCase + r.commit + r.closed), 1),
    [repRows]
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleRefresh = () => setRefreshKey(k => k + 1);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-6 -mt-6 px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div>
              <h1 className="text-[15px] font-semibold text-gray-900 leading-none">Forecast</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {loading ? 'Loading…' : `${forecastDeals.length} deal${forecastDeals.length !== 1 ? 's' : ''} · ${quarter.label}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quarter selector */}
            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden text-[13px]">
              <button
                onClick={() => setQuarterOffset(o => o - 1)}
                className="px-2 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-200"
                title="Previous quarter"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-3 py-1.5 font-medium text-gray-700 min-w-[80px] text-center">
                {quarter.label}
              </span>
              <button
                onClick={() => setQuarterOffset(o => o + 1)}
                className="px-2 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors border-l border-gray-200"
                title="Next quarter"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => navigate('/crm/deals')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200 transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Deals Board</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">

        {/* ── Summary KPIs ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { key: 'pipeline',   label: 'Pipeline',   value: totals.pipeline, color: '#6366f1', count: categorized.pipeline.length   },
            { key: 'best-case',  label: 'Best Case',  value: totals.bestCase, color: '#f59e0b', count: categorized['best-case'].length },
            { key: 'commit',     label: 'Commit',     value: totals.commit,   color: '#10b981', count: categorized.commit.length     },
            { key: 'closed',     label: 'Closed Won', value: totals.closed,   color: '#64748b', count: categorized.closed.length     },
          ] as const).map(stat => (
            <div
              key={stat.key}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden flex"
            >
              <div className="w-1 flex-shrink-0" style={{ backgroundColor: stat.color }} />
              <div className="flex-1 px-4 py-3">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                  {stat.label}
                </p>
                <p className="text-[22px] font-semibold text-gray-900 tabular-nums leading-none mb-1">
                  {loading ? '—' : fmt(stat.value)}
                </p>
                <p className="text-[11px] text-gray-400">
                  {loading ? '—' : `${stat.count} deal${stat.count !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Category swimlanes ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
              Forecast Categories
            </h2>
            <span className="text-[11px] text-gray-400">·</span>
            <span className="text-[11px] text-gray-400">{quarter.label}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {CATEGORIES.map(cat => {
              const cfg   = CATEGORY_CONFIG[cat];
              const deals = categorized[cat];
              const total = deals.reduce((s, d) => s + d.value, 0);

              return (
                <div
                  key={cat}
                  className="bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden"
                >
                  {/* Column header */}
                  <div
                    className="px-4 py-3 border-b border-gray-100"
                    style={{ borderTop: `3px solid ${cfg.accentColor}` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className={`flex items-center gap-1.5 ${cfg.textClass}`}>
                        {cfg.icon}
                        <span className="text-[12px] font-semibold">{cfg.label}</span>
                      </div>
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${cfg.badgeClass}`}>
                        {deals.length}
                      </span>
                    </div>
                    <p className="text-[18px] font-bold text-gray-900 tabular-nums">
                      {fmt(total)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{cfg.description}</p>
                  </div>

                  {/* Deal list */}
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-50" style={{ maxHeight: '320px' }}>
                    {deals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4">
                        <p className="text-[12px] text-gray-400 text-center">No deals in this category for {quarter.label}</p>
                      </div>
                    ) : (
                      <div className="p-1">
                        {deals.map(deal => (
                          <DealRow key={deal.id} deal={deal} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Rep forecast comparison ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
              Rep Forecast Comparison
            </h2>
            <span className="text-[11px] text-gray-400">·</span>
            <span className="text-[11px] text-gray-400">{quarter.label}</span>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {repRows.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-[13px] text-gray-400">No rep data for this period</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[180px]">Rep</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right" style={{ color: '#6366f1' }}>Pipeline</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right" style={{ color: '#f59e0b' }}>Best Case</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right" style={{ color: '#10b981' }}>Commit</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right" style={{ color: '#64748b' }}>Closed Won</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {repRows.map((rep, i) => {
                    const rowTotal = rep.pipeline + rep.bestCase + rep.commit + rep.closed;
                    const barWidth = Math.round((rowTotal / maxRepTotal) * 100);
                    return (
                      <tr key={rep.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: '#6366f1' }}
                            >
                              {rep.name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                            </span>
                            <div>
                              <p className="text-[13px] font-medium text-gray-900 leading-none">{rep.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{rep.dealCount} deal{rep.dealCount !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className="text-[13px] font-medium text-gray-700">{fmt(rep.pipeline)}</span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className="text-[13px] font-medium text-gray-700">{fmt(rep.bestCase)}</span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className="text-[13px] font-semibold text-emerald-700">{fmt(rep.commit)}</span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className="text-[13px] font-medium text-gray-700">{fmt(rep.closed)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${barWidth}%`, backgroundColor: '#6366f1' }}
                              />
                            </div>
                            <span className="text-[12px] font-semibold text-gray-900 tabular-nums w-14 text-right">
                              {fmt(rowTotal)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals footer */}
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-semibold text-gray-700">Total</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="text-[12px] font-semibold text-gray-900">{fmt(totals.pipeline)}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="text-[12px] font-semibold text-gray-900">{fmt(totals.bestCase)}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="text-[12px] font-semibold text-gray-900">{fmt(totals.commit)}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="text-[12px] font-semibold text-gray-900">{fmt(totals.closed)}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="text-[12px] font-semibold text-gray-900">
                        {fmt(totals.pipeline + totals.bestCase + totals.commit + totals.closed)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* ── Coming soon — features requiring historical data ──────────────── */}
        <div className="rounded-lg border border-dashed border-gray-200 bg-white px-5 py-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-gray-700 mb-1">
                Slippage tracking and commit history are not yet available
              </p>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                These features require period-level forecast snapshots — a point-in-time
                record of what each rep committed at the start of the quarter.
                Once snapshots are established, this section will show slipped deals,
                commit accuracy, and week-over-week coverage trend.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ForecastPage;
