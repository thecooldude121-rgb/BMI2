/**
 * ForecastPage — manager-facing quarter/category view.
 *
 * Purpose: period roll-up for pipeline review, commit tracking, and
 *          rep comparison. Distinct from /crm/deals (rep daily workspace).
 *
 * Live features:
 *   - Forecast category breakdown: Pipeline / Best Case / Commit / Closed
 *   - Quarter roll-up with pacing bar
 *   - Team gap-to-goal projection
 *   - Rep comparison table with projected attainment + inspection cues
 *   - Deal-level risk flags (overdue, concentrated value)
 *   - Quota inline editing
 *   - Snapshot capture for slippage tracking
 *
 * Requires historical snapshots:
 *   - Commit accuracy trending (week-over-week)
 *   - Rep historical accuracy
 *   - Quarter-over-quarter comparison
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, ChevronLeft, ChevronRight, TrendingUp, DollarSign,
  CheckCircle2, Clock, AlertTriangle, Users, BarChart3, Info,
  ArrowRight, Camera, Pencil, Check, X, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import { daysFromNow, formatCloseDate, parseDateMs, normalizeDateField } from '../../utils/dateUtils';
import { formatAmountUSD } from '../../utils/currencyUtils';

const API_BASE = 'http://localhost:5001/api/v1';
function authHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

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
  label: string;
  start: Date;
  end: Date;
}

interface QuotaRow {
  rep_name: string;
  quota_amount: number;
}

interface SnapshotRow {
  rep_name: string;
  snapshot_date: string;
  pipeline: number;
  best_case: number;
  commit: number;
  closed: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getQuarterBounds(offset = 0): QuarterBounds {
  const now = new Date();
  const year = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3);
  const targetQ = q + offset;
  const adjustedYear = year + Math.floor(targetQ / 4);
  const adjustedQ = ((targetQ % 4) + 4) % 4;

  const start = new Date(adjustedYear, adjustedQ * 3, 1);
  // P0 fix: use end-of-day so deals closing on the last day of the quarter
  // aren't excluded by a noon-vs-midnight timestamp comparison.
  const end = new Date(adjustedYear, adjustedQ * 3 + 3, 0, 23, 59, 59, 999);
  return { label: `Q${adjustedQ + 1} ${adjustedYear}`, start, end };
}

function inferCategory(deal: any): ForecastCategory | null {
  const explicit = (deal.forecast_category || '').toLowerCase().trim();
  if (explicit === 'commit')                                return 'commit';
  if (explicit === 'best case' || explicit === 'best-case') return 'best-case';
  if (explicit === 'pipeline')                              return 'pipeline';
  if (explicit === 'closed')                                return 'closed';

  const stage = (deal.stage || '').toLowerCase();
  if (stage === 'closed-won')  return 'closed';
  if (stage === 'closed-lost') return null;
  if (stage === 'negotiation') return 'commit';
  if (stage === 'proposal')    return 'best-case';
  return 'pipeline';
}

const fmt = formatAmountUSD;

const fmtCell = (n: number): string => n === 0 ? '—' : fmt(n);

const formatStageName = (stage: string): string => {
  const labels: Record<string, string> = {
    prospecting:           'Prospecting',
    qualified:             'Qualified',
    proposal:              'Proposal',
    negotiation:           'Negotiation',
    'closed-won':          'Closed Won',
    'closed-lost':         'Closed Lost',
    'renewal-quoted':      'Renewal Quoted',
    'renewal-negotiation': 'Renewal Negotiation',
    'partner-evaluation':  'Partner Evaluation',
  };
  if (!stage) return '';
  return labels[stage] ?? stage.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
  explainer: string;
}> = {
  pipeline: {
    label:       'Pipeline',
    description: 'Prospecting & Qualified — early stage opportunities',
    accentColor: '#6366f1',
    bgClass:     'bg-indigo-50',
    textClass:   'text-indigo-700',
    badgeClass:  'bg-indigo-100 text-indigo-700',
    icon:        <TrendingUp className="h-4 w-4" />,
    explainer:   'Early-stage deals that could close this quarter but have high uncertainty. Treat as upside — not a number you can plan around.',
  },
  'best-case': {
    label:       'Best Case',
    description: 'Proposal stage — possible if everything goes right',
    accentColor: '#f59e0b',
    bgClass:     'bg-amber-50',
    textClass:   'text-amber-700',
    badgeClass:  'bg-amber-100 text-amber-700',
    icon:        <BarChart3 className="h-4 w-4" />,
    explainer:   'Active proposals with a confirmed decision timeline. Included in the stretch scenario — not relied on for quota attainment.',
  },
  commit: {
    label:       'Commit',
    description: 'Negotiation — rep is committing to this close',
    accentColor: '#10b981',
    bgClass:     'bg-emerald-50',
    textClass:   'text-emerald-700',
    badgeClass:  'bg-emerald-100 text-emerald-700',
    icon:        <CheckCircle2 className="h-4 w-4" />,
    explainer:   'The rep is putting their name on this closing in the quarter. Contract in negotiation, verbal agreement exists, or purchasing is in motion. This is the number managers use to call the quarter.',
  },
  closed: {
    label:       'Closed Won',
    description: 'Already closed this period',
    accentColor: '#64748b',
    bgClass:     'bg-slate-50',
    textClass:   'text-slate-700',
    badgeClass:  'bg-slate-100 text-slate-700',
    icon:        <DollarSign className="h-4 w-4" />,
    explainer:   'Revenue already recognized this quarter. Locked in — improves attainment and reduces the remaining gap. The only category where the number is certain.',
  },
};

const CATEGORIES: ForecastCategory[] = ['pipeline', 'best-case', 'commit', 'closed'];

// ── Sub-components ────────────────────────────────────────────────────────────

const DealRow: React.FC<{ deal: ForecastDeal; categoryTotal: number }> = ({ deal, categoryTotal }) => {
  const daysLeft = daysFromNow(deal.closeDate);
  const urgency =
    daysLeft === null ? 'text-gray-400' :
    daysLeft < 0      ? 'text-red-600 font-medium' :
    daysLeft <= 7     ? 'text-amber-600 font-medium' :
    'text-gray-500';

  const secondaryText  = deal.company || (deal.stage ? formatStageName(deal.stage) : '');
  const secondaryMuted = !deal.company;

  // P1: risk flags — overdue takes precedence over concentration
  const isOverdue      = daysLeft !== null && daysLeft < 0;
  const isConcentrated = !isOverdue && categoryTotal > 0 && deal.value >= categoryTotal * 0.5;

  return (
    <div className="flex items-start justify-between py-2 px-3 hover:bg-gray-50 rounded-md transition-colors">
      <div className="min-w-0 flex-1 mr-2">
        <div className="flex items-center gap-1.5 mb-0.5">
          {isOverdue && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" title="Close date has passed" />
          )}
          {isConcentrated && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="This deal is ≥50% of this category's value" />
          )}
          <p className="text-[12px] font-medium text-gray-900 truncate leading-snug">{deal.name}</p>
        </div>
        {secondaryText && (
          <p className={`text-[11px] truncate ${secondaryMuted ? 'text-gray-300 italic' : 'text-gray-400'}`}>
            {secondaryText}
          </p>
        )}
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
  const [rawDeals, setRawDeals]               = useState<any[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [fetchError, setFetchError]           = useState(false);
  const [quarterOffset, setQuarterOffset]     = useState(0);
  const [refreshKey, setRefreshKey]           = useState(0);
  const [explanationOpen, setExplanationOpen] = useState(false);

  const [quotas, setQuotas]                         = useState<QuotaRow[]>([]);
  const [editingQuota, setEditingQuota]             = useState<string | null>(null);
  const [editingQuotaValue, setEditingQuotaValue]   = useState('');
  const [savingQuota, setSavingQuota]               = useState(false);

  const [snapshots, setSnapshots]           = useState<SnapshotRow[]>([]);
  const [takingSnapshot, setTakingSnapshot] = useState(false);
  const [snapshotTaken, setSnapshotTaken]   = useState(false);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  // P0: inline fetch with limit=500 and an explicit fetchError state so that
  // "backend unreachable" is distinguishable from "empty quarter."
  useEffect(() => {
    setRefreshing(true);
    setFetchError(false);
    const token = localStorage.getItem('authToken');
    fetch(`${API_BASE}/deals?limit=500`, {
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
      .then(r => { if (!r.ok) throw new Error('API error'); return r.json(); })
      .then(json => setRawDeals(json.success ? json.data : []))
      .catch(() => { setRawDeals([]); setFetchError(true); })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [refreshKey]);

  const quarter = useMemo(() => getQuarterBounds(quarterOffset), [quarterOffset]);

  // P1: Quarter pacing — week number, days left, completion percentage
  const quarterPacing = useMemo(() => {
    const nowMs     = Date.now();
    const totalMs   = quarter.end.getTime() - quarter.start.getTime();
    const elapsedMs = nowMs - quarter.start.getTime();
    const rawPct    = Math.round((elapsedMs / totalMs) * 100);
    const isFuture  = elapsedMs < 0;
    const isPast    = elapsedMs > totalMs;
    const isCurrent = !isFuture && !isPast;
    const pct       = isFuture ? 0 : isPast ? 100 : Math.max(0, Math.min(100, rawPct));
    const daysLeft  = Math.max(0, Math.ceil((quarter.end.getTime() - nowMs) / 86400000));
    const weekNum   = Math.max(1, Math.ceil(elapsedMs / (7 * 86400000)));
    const totalWeeks = Math.round(totalMs / (7 * 86400000));
    return { pct, daysLeft, weekNum, totalWeeks, isCurrent, isFuture, isPast };
  }, [quarter]);

  useEffect(() => {
    const encoded = encodeURIComponent(quarter.label);
    Promise.all([
      fetch(`${API_BASE}/quotas?period=${encoded}`, { headers: authHeaders() })
        .then(r => r.json()).then(j => j.success ? j.data : []).catch(() => []),
      fetch(`${API_BASE}/forecast/snapshots?period=${encoded}`, { headers: authHeaders() })
        .then(r => r.json()).then(j => j.success ? j.data : []).catch(() => []),
    ]).then(([q, s]) => {
      setQuotas(q.map((r: any) => ({ rep_name: r.rep_name, quota_amount: parseFloat(r.quota_amount) || 0 })));
      const latest = new Map<string, SnapshotRow>();
      (s as any[]).forEach((row: any) => {
        if (!latest.has(row.rep_name)) {
          latest.set(row.rep_name, {
            rep_name:      row.rep_name,
            snapshot_date: row.snapshot_date,
            pipeline:  parseFloat(row.pipeline)  || 0,
            best_case: parseFloat(row.best_case) || 0,
            commit:    parseFloat(row.commit)    || 0,
            closed:    parseFloat(row.closed)    || 0,
          });
        }
      });
      setSnapshots(Array.from(latest.values()));
    });
  }, [quarter.label, refreshKey]);

  // ── Derived state ───────────────────────────────────────────────────────────

  const forecastDeals = useMemo((): ForecastDeal[] => {
    const nowMs            = Date.now();
    const isCurrentQuarter = nowMs >= quarter.start.getTime() && nowMs <= quarter.end.getTime();

    return rawDeals
      .map((d: any): ForecastDeal | null => {
        const category = inferCategory(d);
        if (!category) return null;

        // P0 fix: keep the full ISO string rather than splitting on 'T'.
        // Splitting truncates to the UTC date and shows IST dates one day early
        // (e.g. DB stores 2026-06-30, API returns 2026-06-29T18:30:00Z,
        //  split gives "2026-06-29" — one day wrong).
        const closeDate = normalizeDateField(d.expected_close_date);

        const rawName    = (d.name || d.title || '').trim();
        const coName     = (d.company_name || '').trim();
        const stageLabel = formatStageName(d.stage || '');
        const resolvedName = rawName
          || (coName && stageLabel ? `${coName} · ${stageLabel}`
              : coName              ? coName
              : stageLabel          ? `${stageLabel} Deal`
              :                       'Unnamed Deal');

        return {
          id:       d.id,
          name:     resolvedName,
          company:  coName,
          owner:    d.assigned_to || 'Unassigned',
          value:    parseFloat(d.value) || 0,
          stage:    d.stage || '',
          closeDate,
          category,
        };
      })
      .filter((d): d is ForecastDeal => d !== null)
      .filter(d => {
        if (!d.closeDate) {
          // P0 fix: undated deals are active-but-unscheduled. Show them only
          // when the user is viewing the current quarter — not in past/future
          // period navigation where they would appear as phantom data.
          return d.category !== 'closed' && isCurrentQuarter;
        }
        const closeMs = parseDateMs(d.closeDate);
        if (!isFinite(closeMs)) {
          // Typo year (e.g. "262026-09-30") — treat like no date.
          return d.category !== 'closed' && isCurrentQuarter;
        }
        return closeMs >= quarter.start.getTime() && closeMs <= quarter.end.getTime();
      });
  }, [rawDeals, quarter]);

  const categorized = useMemo((): Record<ForecastCategory, ForecastDeal[]> => ({
    pipeline:    forecastDeals.filter(d => d.category === 'pipeline'),
    'best-case': forecastDeals.filter(d => d.category === 'best-case'),
    commit:      forecastDeals.filter(d => d.category === 'commit'),
    closed:      forecastDeals.filter(d => d.category === 'closed'),
  }), [forecastDeals]);

  const totals = useMemo(() => ({
    pipeline: categorized.pipeline.reduce((s, d) => s + d.value, 0),
    bestCase: categorized['best-case'].reduce((s, d) => s + d.value, 0),
    commit:   categorized.commit.reduce((s, d) => s + d.value, 0),
    closed:   categorized.closed.reduce((s, d) => s + d.value, 0),
  }), [categorized]);

  const repRows = useMemo((): RepRow[] => {
    const map = new Map<string, RepRow>();
    forecastDeals.forEach(d => {
      const existing = map.get(d.owner) ?? {
        name: d.owner, pipeline: 0, bestCase: 0, commit: 0, closed: 0, dealCount: 0,
      };
      existing.dealCount += 1;
      if (d.category === 'pipeline')  existing.pipeline += d.value;
      if (d.category === 'best-case') existing.bestCase  += d.value;
      if (d.category === 'commit')    existing.commit    += d.value;
      if (d.category === 'closed')    existing.closed    += d.value;
      map.set(d.owner, existing);
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.name === 'Unassigned') return 1;
      if (b.name === 'Unassigned') return -1;
      return (b.commit + b.closed) - (a.commit + a.closed);
    });
  }, [forecastDeals]);

  const maxRepTotal = useMemo(
    () => Math.max(...repRows.map(r => r.pipeline + r.bestCase + r.commit + r.closed), 1),
    [repRows],
  );

  // P1: Inspection flags — coaching cues for the manager, shown in the rep table
  const repInspectionFlags = useMemo((): Map<string, string[]> => {
    const map = new Map<string, string[]>();
    repRows.forEach(rep => {
      if (rep.name === 'Unassigned') return;
      const flags: string[] = [];
      // Past mid-quarter with best-case but zero commit
      if (quarterPacing.isCurrent && quarterPacing.pct > 50 && rep.commit === 0 && rep.bestCase > 0) {
        flags.push('no-commit');
      }
      // Entire commit from a single deal — concentration risk
      const commitDeals = categorized.commit.filter(d => d.owner === rep.name);
      if (commitDeals.length === 1 && rep.commit > 0) flags.push('single-deal');
      // Any commit deal has a past close date
      if (commitDeals.some(d => { const dl = daysFromNow(d.closeDate); return dl !== null && dl < 0; })) {
        flags.push('overdue');
      }
      if (flags.length > 0) map.set(rep.name, flags);
    });
    return map;
  }, [repRows, categorized, quarterPacing]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleRefresh = () => setRefreshKey(k => k + 1);

  const handleSaveQuota = async (repName: string) => {
    const amount = parseFloat(editingQuotaValue.replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount < 0) return;
    setSavingQuota(true);
    try {
      const res = await fetch(`${API_BASE}/quotas`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ rep_name: repName, period_label: quarter.label, quota_amount: amount }),
      });
      const json = await res.json();
      if (json.success) {
        setQuotas(prev => {
          const idx = prev.findIndex(q => q.rep_name === repName);
          const updated = { rep_name: repName, quota_amount: amount };
          return idx >= 0 ? prev.map((q, i) => i === idx ? updated : q) : [...prev, updated];
        });
      }
    } finally {
      setSavingQuota(false);
      setEditingQuota(null);
    }
  };

  const handleTakeSnapshot = async () => {
    setTakingSnapshot(true);
    try {
      const reps = repRows.map(r => ({
        rep_name:   r.name,
        pipeline:   r.pipeline,
        best_case:  r.bestCase,
        commit:     r.commit,
        closed:     r.closed,
        deal_count: r.dealCount,
      }));
      await fetch(`${API_BASE}/forecast/snapshots`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ period_label: quarter.label, reps }),
      });
      setSnapshotTaken(true);
      setTimeout(() => setSnapshotTaken(false), 3000);
      setRefreshKey(k => k + 1);
    } finally {
      setTakingSnapshot(false);
    }
  };

  // ── Gap-to-goal values ──────────────────────────────────────────────────────
  const totalQuota    = quotas.reduce((s, q) => s + q.quota_amount, 0);
  const teamProjected = totals.closed + totals.commit;
  const teamGap       = Math.max(0, totalQuota - teamProjected);
  const showGapBanner = !loading && totalQuota > 0;

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
                {loading
                  ? 'Loading…'
                  : fetchError
                  ? 'Data unavailable'
                  : `${forecastDeals.length} deal${forecastDeals.length !== 1 ? 's' : ''} · ${quarter.label}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              onClick={handleTakeSnapshot}
              disabled={takingSnapshot || repRows.length === 0}
              title="Capture today's pipeline state for slippage tracking"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-md border transition-colors disabled:opacity-50
                ${snapshotTaken
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {snapshotTaken
                ? <><Check className="h-3.5 w-3.5" /><span>Snapshot saved</span></>
                : <><Camera className="h-3.5 w-3.5" /><span>{takingSnapshot ? 'Saving…' : 'Take Snapshot'}</span></>
              }
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

        {/* P1: Quarter pacing bar */}
        {!loading && !fetchError && (
          <div className="mt-2.5 pt-2.5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-400">
                {quarterPacing.isFuture
                  ? `Starts ${quarter.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : quarterPacing.isPast
                  ? `${quarter.label} — closed`
                  : `Week ${quarterPacing.weekNum} of ${quarterPacing.totalWeeks} · ${quarterPacing.daysLeft} day${quarterPacing.daysLeft !== 1 ? 's' : ''} remaining`
                }
              </span>
              <span className="text-[11px] font-medium text-gray-500 tabular-nums">{quarterPacing.pct}%</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  quarterPacing.isPast   ? 'bg-gray-400'   :
                  quarterPacing.pct > 75 ? 'bg-red-400'    :
                  quarterPacing.pct > 50 ? 'bg-amber-400'  :
                                           'bg-indigo-400'
                }`}
                style={{ width: `${quarterPacing.pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-8 py-6 space-y-6">

        {/* ── Error state ──────────────────────────────────────────────────── */}
        {fetchError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-[13px] text-red-700 flex-1">
              Unable to load deal data — check that the backend server is running on port 5001.
            </p>
            <button
              onClick={handleRefresh}
              className="text-[12px] font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Summary KPIs ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { key: 'pipeline',  label: 'Pipeline',   value: totals.pipeline, color: '#6366f1', count: categorized.pipeline.length   },
            { key: 'best-case', label: 'Best Case',  value: totals.bestCase, color: '#f59e0b', count: categorized['best-case'].length },
            { key: 'commit',    label: 'Commit',     value: totals.commit,   color: '#10b981', count: categorized.commit.length     },
            { key: 'closed',    label: 'Closed Won', value: totals.closed,   color: '#64748b', count: categorized.closed.length     },
          ] as const).map(stat => (
            <div key={stat.key} className="bg-white rounded-lg border border-gray-200 overflow-hidden flex">
              <div className="w-1 flex-shrink-0" style={{ backgroundColor: stat.color }} />
              <div className="flex-1 px-4 py-3">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">{stat.label}</p>
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

        {/* ── P1: Gap-to-goal banner ────────────────────────────────────────── */}
        {showGapBanner && (
          <div className={`rounded-lg border px-5 py-3.5 flex items-center gap-5 ${
            teamProjected >= totalQuota ? 'bg-emerald-50 border-emerald-200' :
            teamGap <= totals.bestCase  ? 'bg-amber-50  border-amber-200'   :
                                          'bg-red-50    border-red-200'
          }`}>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900">
                {teamProjected >= totalQuota
                  ? `Team is on track — ${fmt(teamProjected)} projected vs ${fmt(totalQuota)} quota`
                  : `Team projects ${fmt(teamProjected)} against ${fmt(totalQuota)} quota`
                }
              </p>
              {teamGap > 0 && (
                <p className="text-[12px] text-gray-600 mt-0.5">
                  Gap: <span className="font-semibold">{fmt(teamGap)}</span> needed ·{' '}
                  {totals.bestCase >= teamGap
                    ? <span className="text-emerald-700">{fmt(totals.bestCase)} available in Best Case</span>
                    : <span className="text-red-600">Best Case covers only {fmt(totals.bestCase)} of that gap</span>
                  }
                </p>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              {(() => {
                const pct = Math.round((teamProjected / totalQuota) * 100);
                return (
                  <>
                    <p className={`text-[22px] font-bold tabular-nums leading-none ${
                      pct >= 100 ? 'text-emerald-600' : pct >= 70 ? 'text-amber-600' : 'text-red-500'
                    }`}>{pct}%</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">projected attainment</p>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Category swimlanes ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
              Forecast Categories
            </h2>
            <span className="text-[11px] text-gray-400">·</span>
            <span className="text-[11px] text-gray-400">{quarter.label}</span>
            {/* P2: collapsible confidence explainer */}
            <button
              onClick={() => setExplanationOpen(o => !o)}
              className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Info className="h-3 w-3" />
              <span>How categories work</span>
              {explanationOpen
                ? <ChevronUp className="h-3 w-3" />
                : <ChevronDown className="h-3 w-3" />
              }
            </button>
          </div>

          {/* P2: Category explainer panel */}
          {explanationOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {CATEGORIES.map(cat => {
                const cfg = CATEGORY_CONFIG[cat];
                return (
                  <div key={cat} className="flex items-start gap-2.5">
                    <span className={`mt-0.5 flex-shrink-0 ${cfg.textClass}`}>{cfg.icon}</span>
                    <div>
                      <p className={`text-[11px] font-semibold mb-0.5 ${cfg.textClass}`}>{cfg.label}</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{cfg.explainer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {CATEGORIES.map(cat => {
              const cfg   = CATEGORY_CONFIG[cat];
              const deals = categorized[cat];
              const total = deals.reduce((s, d) => s + d.value, 0);

              return (
                <div key={cat} className="bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100" style={{ borderTop: `3px solid ${cfg.accentColor}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className={`flex items-center gap-1.5 ${cfg.textClass}`}>
                        {cfg.icon}
                        <span className="text-[12px] font-semibold">{cfg.label}</span>
                      </div>
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${cfg.badgeClass}`}>
                        {deals.length}
                      </span>
                    </div>
                    <p className="text-[18px] font-bold text-gray-900 tabular-nums">{fmt(total)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{cfg.description}</p>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-gray-50" style={{ maxHeight: '320px' }}>
                    {deals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 gap-2">
                        <div className={`w-8 h-8 rounded-full ${cfg.bgClass} flex items-center justify-center ${cfg.textClass} opacity-60`}>
                          {cfg.icon}
                        </div>
                        <p className="text-[12px] text-gray-400 text-center leading-snug">
                          No {cfg.label.toLowerCase()} deals<br />closing in {quarter.label}
                        </p>
                      </div>
                    ) : (
                      <div className="p-1">
                        {/* P1: pass categoryTotal for concentration risk flag */}
                        {deals.map(deal => (
                          <DealRow key={deal.id} deal={deal} categoryTotal={total} />
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
            <h2 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Rep Forecast Comparison</h2>
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
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[200px]">Rep</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: '#6366f1' }}>Pipeline</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: '#f59e0b' }}>Best Case</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: '#10b981' }}>Commit</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: '#64748b' }}>Closed Won</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Quota</th>
                    {/* P1: renamed to Proj. Attainment = (Closed + Commit) / Quota */}
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right" title="(Closed + Commit) ÷ Quota — projected mid-quarter attainment">Proj. Attainment</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {repRows.map((rep, i) => {
                    const isUnassigned = rep.name === 'Unassigned';
                    const rowTotal  = rep.pipeline + rep.bestCase + rep.commit + rep.closed;
                    const barWidth  = Math.round((rowTotal / maxRepTotal) * 100);
                    const quotaRow  = quotas.find(q => q.rep_name === rep.name);
                    const quota     = quotaRow?.quota_amount ?? 0;
                    // P1: projected = closed + commit (not just closed)
                    const projected = rep.closed + rep.commit;
                    const attainPct = quota > 0 ? Math.round((projected / quota) * 100) : null;
                    const isEditing = editingQuota === rep.name;
                    const flags     = repInspectionFlags.get(rep.name) ?? [];
                    const initials  = isUnassigned
                      ? '–'
                      : rep.name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

                    return (
                      <tr key={rep.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: isUnassigned ? '#9ca3af' : '#6366f1' }}
                            >
                              {initials}
                            </span>
                            <div>
                              {/* P1: inspection cue badges inline with name */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className={`text-[13px] font-medium leading-none ${isUnassigned ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                                  {rep.name}
                                </p>
                                {flags.includes('overdue') && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600" title="Has overdue deal in Commit">
                                    Overdue
                                  </span>
                                )}
                                {flags.includes('no-commit') && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700" title="Past mid-quarter with no commit">
                                    No commit
                                  </span>
                                )}
                                {flags.includes('single-deal') && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700" title="Entire commit is a single deal">
                                    1-deal risk
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5">{rep.dealCount} deal{rep.dealCount !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className="text-[13px] font-medium text-gray-700">{fmtCell(rep.pipeline)}</span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className="text-[13px] font-medium text-gray-700">{fmtCell(rep.bestCase)}</span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={`text-[13px] font-semibold ${rep.commit > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                            {fmtCell(rep.commit)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className="text-[13px] font-medium text-gray-700">{fmtCell(rep.closed)}</span>
                        </td>

                        {/* Quota — inline editable */}
                        <td className="px-4 py-3 text-right tabular-nums">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                autoFocus
                                value={editingQuotaValue}
                                onChange={e => setEditingQuotaValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveQuota(rep.name);
                                  if (e.key === 'Escape') setEditingQuota(null);
                                }}
                                className="w-24 text-right text-[12px] border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                placeholder="e.g. 200000"
                              />
                              <button onClick={() => handleSaveQuota(rep.name)} disabled={savingQuota} className="text-emerald-600 hover:text-emerald-700">
                                <Check className="h-3 w-3" />
                              </button>
                              <button onClick={() => setEditingQuota(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingQuota(rep.name); setEditingQuotaValue(quota > 0 ? quota.toString() : ''); }}
                              className="group flex items-center gap-1 ml-auto text-[13px] font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                              title="Click to set quota"
                            >
                              <span>{quota > 0 ? fmt(quota) : <span className="text-gray-300 italic text-[12px]">Not set</span>}</span>
                              <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                            </button>
                          )}
                        </td>

                        {/* P1: Projected attainment = (Closed + Commit) / Quota */}
                        <td className="px-4 py-3 text-right tabular-nums">
                          {attainPct === null
                            ? <span className="text-[12px] text-gray-300">—</span>
                            : (
                              <div>
                                <span className={`text-[13px] font-semibold ${attainPct >= 100 ? 'text-emerald-600' : attainPct >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
                                  {attainPct}%
                                </span>
                                {rep.commit > 0 && (
                                  <p className="text-[9px] text-gray-400 mt-0.5 tabular-nums">
                                    {fmt(rep.closed)} + {fmt(rep.commit)}
                                  </p>
                                )}
                              </div>
                            )
                          }
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
                    {(() => {
                      // P1: footer attainment also uses projected (Closed + Commit)
                      const totalAttain = totalQuota > 0
                        ? Math.round(((totals.closed + totals.commit) / totalQuota) * 100)
                        : null;
                      return (
                        <>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className="text-[12px] font-semibold text-gray-900">
                              {totalQuota > 0 ? fmt(totalQuota) : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {totalAttain !== null
                              ? <span className={`text-[12px] font-semibold ${totalAttain >= 100 ? 'text-emerald-600' : totalAttain >= 70 ? 'text-amber-600' : 'text-red-500'}`}>
                                  {totalAttain}%
                                </span>
                              : <span className="text-[12px] text-gray-300">—</span>
                            }
                          </td>
                        </>
                      );
                    })()}
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

        {/* ── Slippage & commit accuracy ────────────────────────────────────── */}
        {snapshots.length > 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              <span className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider">Slippage vs Snapshot</span>
              <span className="ml-2 text-[11px] text-gray-400">
                Snapshot: {snapshots[0]?.snapshot_date
                  ? new Date(snapshots[0].snapshot_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '—'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[180px]">Rep</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Snap Commit</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Now Commit</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Slippage</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Snap Closed</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Now Closed</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Δ Closed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {snapshots.map((snap, i) => {
                    const current    = repRows.find(r => r.name === snap.rep_name);
                    const nowCommit  = current?.commit ?? 0;
                    const nowClosed  = current?.closed ?? 0;
                    const slippage   = snap.commit - nowCommit;
                    const deltaClose = nowClosed - snap.closed;
                    return (
                      <tr key={snap.rep_name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-2.5 text-[13px] font-medium text-gray-800">{snap.rep_name}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-[12px] text-gray-500">{fmtCell(snap.commit)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-[12px] font-medium text-gray-800">{fmtCell(nowCommit)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {slippage === 0
                            ? <span className="text-[12px] text-gray-300">—</span>
                            : <span className={`text-[12px] font-semibold ${slippage > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                {slippage > 0 ? '▼ ' : '▲ '}{fmt(Math.abs(slippage))}
                              </span>
                          }
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-[12px] text-gray-500">{fmtCell(snap.closed)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-[12px] font-medium text-gray-800">{fmtCell(nowClosed)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {deltaClose === 0
                            ? <span className="text-[12px] text-gray-300">—</span>
                            : <span className={`text-[12px] font-semibold ${deltaClose > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {deltaClose > 0 ? '+' : ''}{fmt(deltaClose)}
                              </span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* P2: roadmap notice for features that need more snapshots */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <p className="text-[11px] text-gray-400 flex-1">
                <span className="font-medium text-gray-500">Commit accuracy trending</span> and rep historical accuracy unlock once two or more snapshots exist for this period.
              </p>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide flex-shrink-0">
                {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ) : (
          /* P2: No snapshots yet — workflow onboarding guide */
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider">Slippage &amp; Commit Accuracy</span>
              <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                No snapshot yet
              </span>
            </div>
            <div className="px-5 py-5">
              <p className="text-[12px] font-medium text-gray-700 mb-4">
                Snapshots let you see how the forecast changes week to week — commit drift, closed acceleration, and slippage per rep.
              </p>
              <div className="space-y-3.5">
                {[
                  {
                    step: '1', color: 'bg-indigo-100 text-indigo-700',
                    title: 'Start of quarter',
                    body: 'Take a baseline snapshot to record the opening commit and pipeline for the period.',
                  },
                  {
                    step: '2', color: 'bg-amber-100 text-amber-700',
                    title: 'Each week before your forecast call',
                    body: 'Take a new snapshot. The Slippage table will appear showing how commit has moved since the previous one.',
                  },
                  {
                    step: '3', color: 'bg-gray-100 text-gray-400',
                    title: 'Over time',
                    body: 'Commit accuracy trending and rep historical accuracy unlock once two or more snapshots exist for this period.',
                    roadmap: true,
                  },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${item.color}`}>
                      {item.step}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-medium text-gray-700">{item.title}</p>
                        {item.roadmap && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 uppercase tracking-wide">
                            Coming soon
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[11px] text-gray-400">
                  Click <span className="font-medium text-gray-600">Take Snapshot</span> in the header to capture today's pipeline state.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForecastPage;
