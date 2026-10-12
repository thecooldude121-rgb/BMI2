import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, TrendingUp, DollarSign, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SalesIntelligenceGuide from '../../components/Dashboard/SalesIntelligenceGuide';
import { fetchActivitiesPage, type ActivityRecord } from '../../utils/activitiesApi';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDealsSummary, fetchDealsPage, type DealsSummary } from '../../utils/dealsApi';
import { fetchContactsPage } from '../../utils/contactsApi';
import { fetchAccountsSummary } from '../../utils/accountsApi';
import { fetchMeetingsInWindow, type Meeting } from '../../utils/meetingsApi';
import { formatAmountUSD } from '../../utils/currencyUtils';
import { localDay } from '../../utils/dates';

/** One independent server read per panel: its own loading, error and retry. */
function useLoad<T>(load: () => Promise<T>): { data: T | null; error: string | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    load()
      .then(v => { if (!cancelled) { setData(v); setError(null); } })
      .catch(e => { if (!cancelled) setError(e?.message ?? 'Could not load'); });
    return () => { cancelled = true; };
    // `load` is a stable module-level call per panel; `key` is the retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { data, error, reload: useCallback(() => setKey(k => k + 1), []) };
}

/** A row's base_amount_usd may be shown as USD (the server's TRUSTED_USD rule). */
const trustedUsd = (d: { currency?: string | null; value?: unknown; base_amount_usd?: unknown }): number | null => {
  if (d.base_amount_usd === null || d.base_amount_usd === undefined) return null;
  const base = Number(d.base_amount_usd);
  const usdCurrency = (d.currency ?? 'USD').toUpperCase() === 'USD';
  return usdCurrency || base !== Number(d.value) ? base : null;
};

/** "$12K" plus, when some deals had no USD amount, "+ N not in USD". */
const usdLabel = (value: number, unconverted: number) =>
  `${formatAmountUSD(value)}${unconverted > 0 ? ` + ${unconverted} not in USD` : ''}`;

/**
 * /crm/dashboard — the dashboard the sidebar actually links to.
 *
 * WHAT WAS WRONG
 * This file had no fetch, no API client and no useEffect. Every panel was a
 * literal array under a comment reading "// Sample data", so the page showed the
 * same numbers to everyone forever: 147 Contacts (the real count is 20), 23
 * Deals (25), a $2.4M pipeline ($1.86M open), and a "Target 89%" with no quota
 * data behind it anywhere.
 *
 * It also disagreed with pages/Dashboard.tsx, which was put on real data in
 * Phase 3 (12/n) — and that one turned out to be the unreachable one, because
 * Sidebar.tsx links "Dashboard" to /crm/dashboard, not /dashboard. The fix for
 * the real page had been verified on a route nobody clicks.
 *
 * Both dashboards now read useDashboardData(), so there is ONE source and the
 * tiles cannot drift from the Contacts, Deals and Accounts pages again.
 *
 * Panels with no data source render honest empty states rather than invented
 * content — see each one below for what it needs.
 *
 * SLICE 5a (2026-10-12): every figure is a SERVER figure. The page read
 * useDashboardData(), which loads at most 500 rows per table, so past 500 the
 * tiles stopped counting, Top Deals missed any large deal older than the
 * newest 500, and Upcoming Meetings looked for meetings inside the 20 newest
 * activities. Now: GET /deals/summary (open / won / lost, USD, closing soon,
 * stage breakdown across pipelines — in pipeline order from the server, which
 * also removes the stage-order memo that went stale after pipelines loaded),
 * the real contact and account totals, open deals by USD value, the newest
 * activities, and real meetings from the Meetings module. Money follows the
 * board's rule: only trustworthy USD is summed; the rest is "not in USD".
 */
const CRMDashboard: React.FC = () => {
  const navigate = useNavigate();
  // useToast()'s only remaining callers were the gamification click handlers
  // ("Loading challenges...", "Loading Sarah's profile..."), deleted with the panel.
  const { user } = useAuth();
  const today = new Date();
  const deals = useLoad<DealsSummary>(() => fetchDealsSummary(localDay(new Date())));
  const contacts = useLoad(() => fetchContactsPage({ limit: 1, offset: 0 }).then(r => r.total));
  const accounts = useLoad(() => fetchAccountsSummary().then(r => r.accounts));
  const topDeals = useLoad(() => fetchDealsPage({ stage_type: 'open', sort: 'base_amount_usd', dir: 'desc', limit: 3, offset: 0 }));
  const recent = useLoad(() => fetchActivitiesPage({ limit: 5, offset: 0 }));
  const meetings = useLoad<{ meetings: Meeting[]; total: number }>(() => {
    const now = new Date();
    return fetchMeetingsInWindow(now, new Date(now.getTime() + 7 * 86_400_000), 3);
  });

  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  /** Absolute date and time. The old copy hardcoded "Nov 15, 2:00 PM". */
  const formatWhen = (v: string | null | undefined): string => {
    if (!v) return '';
    const d = new Date(v);
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const s = deals.data;
  const soon = s?.closing_soon;
  const metrics = [
    {
      label: 'Contacts',
      // A period-over-period delta ("+12 this week") needs a second query
      // against the previous period; these are factual captions instead.
      value: contacts.data === null ? '—' : contacts.data.toLocaleString(),
      caption: contacts.error ? 'Could not load' : 'In your account',
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Deals',
      value: s ? s.total.toLocaleString() : '—',
      caption: deals.error ? 'Could not load'
        : soon ? `${soon.count} closing in the next ${soon.days} days` : '',
      icon: TrendingUp,
      color: 'green',
    },
    {
      label: 'Open Pipeline',
      value: s ? formatAmountUSD(s.open.value_usd) : '—',
      caption: deals.error ? 'Could not load'
        : s ? `${s.open.count} open deals${s.open.unconverted ? ` · ${s.open.unconverted} not in USD` : ''}` : '',
      icon: DollarSign,
      color: 'orange',
    },
    {
      label: 'Accounts',
      // Replaces "Target 89%" — no attainment figure can be approximated here.
      value: accounts.data === null ? '—' : accounts.data.toLocaleString(),
      caption: accounts.error ? 'Could not load' : 'Companies on record',
      icon: Building2,
      color: 'indigo',
    },
  ];

  /**
   * Pipeline by stage, from the server, every pipeline, in the server's
   * pipeline-then-position order. The bar is each stage's share of the
   * largest stage. The literals here were once 45/23/15/8/4 deals per stage.
   */
  const pipelineStages = useMemo(() => {
    const rows = s?.by_stage ?? [];
    const maxCount = rows.reduce((m, r) => Math.max(m, r.count), 0);
    const multiPipeline = new Set(rows.map(r => r.pipeline_id)).size > 1;
    return rows.map(r => ({
      key: r.stage_id,
      label: multiPipeline ? `${r.pipeline_name} · ${r.name}` : r.name,
      count: r.count,
      value: usdLabel(r.value_usd, r.unconverted),
      percentage: maxCount > 0 ? Math.round((r.count / maxCount) * 100) : 0,
    }));
  }, [s]);

  const recentActivities: ActivityRecord[] = recent.data?.activities ?? [];
  const upcomingMeetings: Meeting[] = meetings.data?.meetings ?? [];
  const loadErrors = [deals, contacts, accounts].filter(x => x.error);
  const reloadAll = () => { deals.reload(); contacts.reload(); accounts.reload(); topDeals.reload(); recent.reload(); meetings.reload(); };

  // Navigation handlers
  const handleMetricClick = (metric: string) => {
    switch (metric) {
      case 'Contacts':
        navigate('/crm/contacts');
        break;
      case 'Deals':
        navigate('/crm/deals');
        break;
      case 'Open Pipeline':
        navigate('/crm/deals');
        break;
      case 'Accounts':
        navigate('/crm/accounts');
        break;
    }
  };

  // The gamification modal fixtures and click handlers lived here.
  // Deleted with the panel below.

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: '"Segoe UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* CRM Top Navigation */}
      <CRMNavigation />

      {/* Greeting Section */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#333333', fontSize: '28px' }}>
          {/* Was the literal "Welcome back, Alex!", shown to every user on
              every visit. The session was never the problem — the TopBar on
              this same screen renders the real name correctly — the greeting
              simply never asked. Falls back to a name-free greeting rather
              than to a placeholder name. */}
          👋 Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </h1>
        <p className="text-gray-600" style={{ fontSize: '14px' }}>Today is {dateString}</p>
      </div>

      <div className="px-8 py-6" style={{ marginTop: '30px' }}>
        {/* A failed request must not render as a zero. The hook reports WHICH
            part failed, so a blank tile is never mistaken for "none". */}
        {loadErrors.length > 0 && (
          <div
            className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4"
            role="alert"
          >
            <p className="text-sm text-yellow-900">
              Some totals could not load — {loadErrors.map(x => x.error).join(' · ')}. Tiles showing “—” are unknown, not zero.
            </p>
            <button
              onClick={reloadAll}
              className="shrink-0 text-sm font-semibold text-yellow-900 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {metrics.map((metric, index) => {
            const colors = getColorClasses(metric.color);
            const Icon = metric.icon;
            return (
              <div
                key={index}
                onClick={() => handleMetricClick(metric.label)}
                className={`${colors.bg} border ${colors.border} rounded-xl p-6 hover:shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1`}
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`h-8 w-8 ${colors.text}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {metric.label}
                </div>
                <div className="text-xs text-gray-600">
                  {metric.caption}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Sales Intelligence Guide ──────────────────────────────────────
            REPLACES the "AI Insights" preview that stood here: two fixed
            sentences ("3 deals need attention", "close rate up 12% this
            month"), labelled PREVIEW · SAMPLE CONTENT because nothing computed
            them, with two buttons that pointed at query parameters no page
            read.

            What replaces them is not an AI feature and is not named as one. It
            is arithmetic over the workspace's own closed deals and quotas
            (GET /targets/projection), and every figure it shows arrives with
            the numbers behind it or is not shown at all. Where the history is
            too thin the panel says so in those words rather than estimating —
            which on live data today is what it will say for everyone, because
            no quota has been set yet.

            It fetches nothing of its own beyond that one endpoint, whose
            response is already scoped to the people the caller may see. */}
        <SalesIntelligenceGuide />

        {/*
          * THE GAMIFICATION PANEL WAS HERE, AND IS DELETED (Venkat, 2026-09-15,
          * on the BANT-framework precedent).
          *
          * It rendered three cards of fabricated performance data — 38,450
          * points, rank #2, level 4 "Platinum", a 23-day streak, a daily
          * challenge at 8/15 with "6h 32m remaining", and team celebrations
          * naming invented colleagues. `gamification_points`,
          * `gamification_achievements` and `gamification_badges` exist as
          * tables, hold 0 rows, and nothing read or wrote any of them.
          *
          * A PREVIEW badge was not enough: a leaderboard naming people puts
          * invented colleagues on a screen beside real ones, which is a
          * different kind of claim from an invented number.
          *
          * CORRECTION TO THE NOTE THAT SAT HERE: it said this block's JSX was
          * "interleaved with the surrounding layout" and could not be excised.
          * That was WRONG. The cause was a bug in the throwaway script used to
          * check it — JSX comments were blanked with a regex that collapsed
          * their newlines, shifting every line number after the first
          * multi-line comment. The element was always a self-contained subtree
          * (lines 577-852). Located with the TypeScript compiler the second
          * time, rather than counted with a regex.
          */}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - 60% */}
          <div className="lg:col-span-3 space-y-6">
            {/* Pipeline by Stage */}
            <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900 flex items-center" style={{ fontSize: '20px', color: '#333333' }}>
                  📊 Pipeline by Stage
                </h2>
                <button
                  onClick={() => navigate('/crm/deals')}
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#667eea' }}
                >
                  View Deals →
                </button>
              </div>
              <div className="space-y-4 mb-6">
                {pipelineStages.length === 0 && (
                  <p className="text-sm text-gray-600" role={deals.error ? 'alert' : undefined}>
                    {deals.error ? `The pipeline could not load — ${deals.error}` : s ? 'No deals yet.' : 'Loading pipeline…'}
                  </p>
                )}
                {pipelineStages.map(stage => (
                  <div key={stage.key} data-testid={`stage-${stage.key}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700" style={{ fontSize: '14px' }}>
                        {stage.label}
                      </span>
                      <div className="flex items-center space-x-3 text-sm text-gray-600" style={{ fontSize: '14px' }}>
                        {/* "deals", not "leads": these are rows from the deals
                            table. The old copy switched between the two words
                            based on the stage name. The per-stage "N from Lead
                            Gen tool" tooltip is gone — deals carry a free-text
                            `source`, not a lead-gen attribution. */}
                        <span>{stage.count} {stage.count === 1 ? 'deal' : 'deals'}</span>
                        <span className="font-semibold">{stage.value}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${stage.percentage}%`,
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Was: "AI Prediction: 67% probability to close $1.2M this quarter".
                  No model exists and no quarter-boundary aggregate is queried, so
                  both the percentage and the amount were invented. Replaced with
                  the one figure that is real. */}
              <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#f0f3ff', border: '1px solid #667eea' }}>
                <p className="text-sm" style={{ color: '#333333', fontSize: '14px' }}>
                  {s ? (
                    <span data-testid="pipeline-summary">
                      <strong>{s.open.count} open {s.open.count === 1 ? 'deal' : 'deals'}</strong>
                      {' '}worth {usdLabel(s.open.value_usd, s.open.unconverted)}, excluding closed.{' '}
                      Win rate{' '}
                      {s.win_rate.value === null
                        ? 'not yet measurable — no deal has been won or lost'
                        : <strong>{Math.round(s.win_rate.value * 100)}%</strong>}
                      {s.win_rate.value !== null && ` (${s.win_rate.won} won of ${s.win_rate.sample_size} decided, all time, all pipelines)`}.
                    </span>
                  ) : (deals.error ? 'Deal totals could not load.' : 'Loading…')}
                </p>
              </div>

              <button
                onClick={() => navigate('/crm/deals')}
                className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View Deals Board
              </button>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
              <h2 className="font-bold text-gray-900 mb-6 flex items-center" style={{ fontSize: '20px', color: '#333333' }}>
                ⚡ Recent Activities
              </h2>
              {/* Was four fixed entries — an "Acme Corp Product Demo" with AI
                  notes, a proposal "Sent to TechStart" — plus a "+N points
                  earned" badge per row. The activities table is empty, so every
                  one of them was invented, and the points came from nothing.
                  Real rows now; an empty feed is the correct output for a
                  database with no logged activity. */}
              <div className="space-y-4 mb-4">
                {recentActivities.length === 0 && (
                  <p className="text-sm text-gray-600" role={recent.error ? 'alert' : undefined}>
                    {recent.error ? `Recent activity could not load — ${recent.error}`
                      : !recent.data ? 'Loading activity…'
                      : 'No activity has been logged yet. Log a call, email or meeting from a contact to see it here.'}
                  </p>
                )}
                {recentActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    style={{ borderRadius: '10px' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1" style={{ fontSize: '12px' }}>
                          {formatWhen(activity.completed_at ?? activity.scheduled_at ?? activity.created_at)}
                        </p>
                        <p className="text-sm font-semibold text-gray-900" style={{ fontSize: '14px' }}>
                          {activity.type ? `${activity.type}: ` : ''}{activity.subject}
                        </p>
                        <p className="text-xs text-gray-600 mt-1" style={{ fontSize: '12px' }}>
                          {[
                            activity.contact_name || activity.company_name || activity.deal_name,
                            activity.status,
                            activity.created_by && `logged by ${activity.created_by}`,
                          ].filter(Boolean).join(' · ')}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-gray-600 mt-1" style={{ fontSize: '12px' }}>
                            {activity.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate('/crm/activities')}
                        className="ml-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex-shrink-0"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Was /crm/activities/all, a 1,079-line feed of hardcoded
                  invented people with zero fetch calls, now deleted. This is the
                  real activities page — where the "View" button beside each row
                  already went. */}
              <button
                onClick={() => navigate('/crm/activities')}
                className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View All Activities
              </button>
            </div>
          </div>

          {/* Right Column - 40% */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Meetings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
              <h2 className="font-bold text-gray-900 mb-6 flex items-center" style={{ fontSize: '20px', color: '#333333' }}>
                📅 Upcoming Meetings
              </h2>
              {/* Was two fixed meetings — "TechStart Discovery Call, Sarah Lee
                  (CFO)" and "Acme Corp Follow-up, John Smith (VP Sales)" — each
                  claiming "AI Note Taker: Enabled", with a Join button opening
                  https://meet.google.com/sample-meeting-link. No meeting URL is
                  stored anywhere, so joining is gone; scheduling a meeting from a
                  contact now puts a real row here. */}
              <div className="space-y-4 mb-4">
                {upcomingMeetings.length === 0 && (
                  <p className="text-sm text-gray-600" role={meetings.error ? 'alert' : undefined}>
                    {meetings.error ? `Meetings could not load — ${meetings.error}`
                      : !meetings.data ? 'Loading meetings…'
                      : 'No meetings in the next 7 days. Meetings scheduled in the Meetings module appear here.'}
                  </p>
                )}
                {upcomingMeetings.map(meeting => (
                  <div
                    key={meeting.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    style={{ borderRadius: '10px' }}
                  >
                    <p className="text-xs font-semibold text-gray-500 mb-1" style={{ fontSize: '11px' }}>
                      {formatWhen(meeting.date)}
                    </p>
                    <p className="text-sm font-bold text-gray-900 mb-3" style={{ fontSize: '14px' }}>
                      {meeting.title}
                    </p>
                    <button
                      onClick={() => navigate(`/crm/meetings/${encodeURIComponent(meeting.id)}`)}
                      className="w-full py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                ))}
                {meetings.data && meetings.data.total > upcomingMeetings.length && (
                  <p className="text-xs text-gray-600">Showing {upcomingMeetings.length} of {meetings.data.total} meetings in the next 7 days.</p>
                )}
              </div>
              <button
                onClick={() => navigate('/calendar')}
                className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View Calendar
              </button>
            </div>

            {/* Top Deals to Focus On */}
            <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
              <h2 className="font-bold text-gray-900 mb-6 flex items-center" style={{ fontSize: '20px', color: '#333333' }}>
                🎯 Top Deals to Focus On
              </h2>
              <div className="space-y-4">
                {(topDeals.data?.deals.length ?? 0) === 0 && (
                  <p className="text-sm text-gray-600" role={topDeals.error ? 'alert' : undefined}>
                    {topDeals.error ? `Top deals could not load — ${topDeals.error}` : !topDeals.data ? 'Loading deals…' : 'No open deals.'}
                  </p>
                )}
                {topDeals.data?.deals.map((deal: any, index: number) => {
                  const usd = trustedUsd(deal);
                  return (
                  <div
                    key={deal.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    style={{ borderRadius: '10px' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900" style={{ fontSize: '14px' }}>
                          {index + 1}. {deal.name || deal.title || deal.company_name || deal.id}
                        </p>
                        <p className="text-lg font-bold" style={{ fontSize: '18px', color: '#667eea' }}>
                          {usd !== null ? formatAmountUSD(usd) : `${deal.currency ?? ''} ${Number(deal.value).toLocaleString()} · not in USD`}
                        </p>
                      </div>
                      {/* Probability shown as what it is — a stage default or a
                          rep's entry — never relabelled as an AI score. */}
                      {deal.probability != null && (
                        <div className="px-2 py-1 rounded" style={{ backgroundColor: '#e8eaf6' }}>
                          <span className="text-xs font-semibold" style={{ color: '#667eea', fontSize: '11px' }}>
                            {deal.probability}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-600 mb-2">
                      <span className="px-2 py-1 rounded-full font-medium" style={{ backgroundColor: '#e8eaf6', color: '#667eea', fontSize: '11px' }}>
                        {deal.stage}
                      </span>
                    </div>
                    {deal.next_step && (
                      <p className="text-xs text-gray-700 mb-3" style={{ fontSize: '12px' }}>
                        <strong>Next:</strong> {deal.next_step}
                      </p>
                    )}
                    <button
                      onClick={() => navigate(`/crm/deals/${deal.id}`)}
                      className="w-full py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-300"
                      style={{ borderRadius: '8px' }}
                    >
                      View Deal
                    </button>
                  </div>
                  );
                })}
                {topDeals.data && (
                  <p className="text-xs text-gray-600">
                    Ranked by USD value across {topDeals.data.total} open {topDeals.data.total === 1 ? 'deal' : 'deals'}; a deal with no USD amount ranks last.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CRMDashboard;
