import React, { useEffect, useMemo, useState } from 'react';
import { Users, TrendingUp, DollarSign, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData, dealValue } from '../../hooks/useDashboardData';
import { useStageLookup } from '../../hooks/useStageLookup';
import SalesIntelligenceGuide from '../../components/Dashboard/SalesIntelligenceGuide';
import { isOpenWith } from '../../utils/pipelinesApi';
import { sortActivitiesNewestFirst } from '../../utils/activitiesApi';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { useAuth } from '../../contexts/AuthContext';
import { fetchPipelines, type ApiPipeline } from '../../utils/pipelinesApi';

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
 */
const CRMDashboard: React.FC = () => {
  const navigate = useNavigate();
  // useToast()'s only remaining callers were the gamification click handlers
  // ("Loading challenges...", "Loading Sarah's profile..."), deleted with the panel.
  const { user } = useAuth();
  const { deals, contacts, accounts, activities, loading, error, truncated, reload } = useDashboardData();


  // Get current date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // ── Derived from live data ────────────────────────────────────────────────
  //
  // Everything below replaces a literal. Where a figure needs data that does not
  // exist, the figure is gone rather than guessed — see each note.

  /** Absolute date and time. The old copy hardcoded "Nov 15, 2:00 PM". */
  const formatWhen = (v: string | null | undefined): string => {
    if (!v) return '';
    const d = new Date(v);
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const money = (n: number): string =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000    ? `$${Math.round(n / 1_000)}K`
    : `$${n}`;

  // See Dashboard.tsx: a won deal outside the default pipeline counted as open.
  const { lookup: outcomeLookup } = useStageLookup();
  const openDeals = useMemo(() => deals.filter(isOpenWith(outcomeLookup)), [deals, outcomeLookup]);
  const openPipeline = useMemo(
    () => openDeals.reduce((sum, d) => sum + dealValue(d), 0),
    [openDeals],
  );

  /** Deals whose expected close date falls in the next 7 days. A real count. */
  const closingThisWeek = useMemo(() => {
    const now = Date.now();
    const week = now + 7 * 86_400_000;
    return openDeals.filter(d => {
      if (!d.expected_close_date) return false;
      const t = new Date(d.expected_close_date).getTime();
      return Number.isFinite(t) && t >= now && t <= week;
    }).length;
  }, [openDeals]);

  const metrics = useMemo(() => [
    {
      label: 'Contacts',
      value: String(contacts.length),
      // The old sublabel was "+12 this week". A period-over-period figure needs
      // a second query against the previous period and no endpoint offers one,
      // so these are factual captions instead of invented deltas — the same
      // decision made for the other dashboard's trend badges in 12/n.
      caption: 'In your account',
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Deals',
      value: String(deals.length),
      caption: closingThisWeek === 1 ? '1 closing this week' : `${closingThisWeek} closing this week`,
      icon: TrendingUp,
      color: 'green',
    },
    {
      label: 'Open Pipeline',
      // Renamed from "Pipeline": the literal $2.4M was a total with no rule
      // behind it. This excludes closed-won and closed-lost, so it is a
      // forward-looking number and says so.
      value: money(openPipeline),
      caption: 'Excludes closed deals',
      icon: DollarSign,
      color: 'orange',
    },
    {
      label: 'Accounts',
      // Replaces "Target 89%". There is no quota or attainment data reachable
      // from here — quotas exist as a table but this page queries nothing — and
      // a target percentage is exactly the kind of number that cannot be
      // approximated. Accounts is a real CRM figure that agrees with /crm/accounts.
      value: String(accounts.length),
      caption: 'Companies on record',
      icon: Building2,
      color: 'indigo',
    },
  ], [contacts.length, deals.length, openPipeline, closingThisWeek, accounts.length]);

  /**
   * Pipeline by stage, from the deals themselves.
   *
   * The literals were 45/23/15/8/4 deals per stage against a real 1/9/8/3/1.
   * Stages are ordered by pipeline_stages.position where the deal's stage
   * matches one, and any stage outside that list follows — deals.stage holds
   * values like 'partner-evaluation' and 'renewal-quoted' that no pipeline stage
   * covers, and dropping them would understate the pipeline.
   *
   * The bar is each stage's share of the largest stage, so the widest bar is the
   * biggest stage. The old percentages (100/73/54/36/20) were fixed numbers
   * unrelated to any count.
   */
  /*
   * Stage order from the workspace, across ALL its pipelines.
   *
   * This was a six-slug literal, so on the dashboard's pipeline bar every
   * Renewals and Partnerships stage scored -1 and was pushed into the "unknown"
   * bucket that sorts last and alphabetically — below Closed Lost. The deals
   * were counted, but the chart implied they sat at the bottom of a funnel they
   * are not in.
   *
   * The dashboard deliberately aggregates across pipelines, so the order is the
   * concatenation of each pipeline's stages in its own order. That is honest
   * about what the chart is: several funnels drawn on one axis. Splitting it per
   * pipeline is a product decision, not a cutover one, and is left alone.
   */
  const [dashPipelines, setDashPipelines] = useState<ApiPipeline[]>([]);
  useEffect(() => {
    let cancelled = false;
    // A failed load leaves STAGE_ORDER empty, which sorts every stage
    // alphabetically rather than inventing a funnel order. The counts and values
    // on the bar are real either way — only the ordering degrades.
    fetchPipelines()
      .then(list => { if (!cancelled) setDashPipelines(list); })
      .catch(() => { /* order degrades to alphabetical; counts stay real */ });
    return () => { cancelled = true; };
  }, []);

  const STAGE_ORDER = useMemo(
    () => dashPipelines.flatMap(p => p.stages.map(st => st.slug)),
    [dashPipelines],
  );
  const pipelineStages = useMemo(() => {
    const byStage = new Map<string, { count: number; value: number }>();
    for (const d of deals) {
      const key = (d.stage ?? 'unknown').toLowerCase();
      const cur = byStage.get(key) ?? { count: 0, value: 0 };
      byStage.set(key, { count: cur.count + 1, value: cur.value + dealValue(d) });
    }
    const rows = [...byStage.entries()].map(([stage, v]) => ({ stage, ...v }));
    const maxCount = rows.reduce((m, r) => Math.max(m, r.count), 0);
    return rows
      .sort((a, b) => {
        const ia = STAGE_ORDER.indexOf(a.stage);
        const ib = STAGE_ORDER.indexOf(b.stage);
        // Unknown stages sort after the known ones, then alphabetically.
        if (ia === -1 && ib === -1) return a.stage.localeCompare(b.stage);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      })
      .map(r => ({
        ...r,
        label: r.stage.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        percentage: maxCount > 0 ? Math.round((r.count / maxCount) * 100) : 0,
      }));
  }, [deals]);

  /**
   * Recent activity, newest first. The old block was four fixed entries — an
   * "Acme Corp Product Demo" and a proposal "Sent to TechStart" — shown to
   * everyone. The activities table is genuinely empty, and an empty feed is the
   * correct output for a database with no logged activity.
   */
  const recentActivities = useMemo(
    () => sortActivitiesNewestFirst(activities).slice(0, 5),
    [activities],
  );

  /** Planned meetings in the future, soonest first. Real, from activities. */
  const upcomingMeetings = useMemo(() => {
    const now = Date.now();
    return activities
      .filter(a => a.type === 'meeting' && a.status === 'planned' && a.scheduled_at
        && new Date(a.scheduled_at).getTime() >= now)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
      .slice(0, 3);
  }, [activities]);

  /**
   * Highest-value open deals. The old list was Acme/TechStart/BigCo with
   * "score" values of 78/85/72 that no column produces — dropped rather than
   * mapped onto `probability`, which is a manually entered stage default and not
   * a health score. `next_step` is a real column and shown when set.
   */
  const topDeals = useMemo(
    () => [...openDeals].sort((a, b) => dealValue(b) - dealValue(a)).slice(0, 3),
    [openDeals],
  );

  // ── Not yet on real data ──────────────────────────────────────────────────
  //
  // `aiInsights` stood here: two fixed sentences rendered by the preview panel
  // this dashboard no longer has. Deleted with it rather than left behind —
  // an unused fixture is the next session's "why is this here", and TS6133
  // would have reported it as noise.

  // `gamificationData` lived here. Deleted with the panel below.

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
        {error && (
          <div
            className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4"
            role="alert"
          >
            <p className="text-sm text-yellow-900">{error}</p>
            <button
              onClick={reload}
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
                  <p className="text-sm text-gray-600">
                    {loading ? 'Loading pipeline…' : 'No deals yet.'}
                  </p>
                )}
                {pipelineStages.map(stage => (
                  <div key={stage.stage}>
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
                        <span className="font-semibold">{money(stage.value)}</span>
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
                  <strong>{openDeals.length} open {openDeals.length === 1 ? 'deal' : 'deals'}</strong>
                  {' '}worth {money(openPipeline)}, excluding closed.
                  {truncated && ' Showing the first 500 deals, so this is a lower bound.'}
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
                  <p className="text-sm text-gray-600">
                    {loading
                      ? 'Loading activity…'
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
                  <p className="text-sm text-gray-600">
                    {loading
                      ? 'Loading meetings…'
                      : 'No meetings are scheduled. Use Schedule meeting on a contact to add one.'}
                  </p>
                )}
                {upcomingMeetings.map(meeting => (
                  <div
                    key={meeting.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    style={{ borderRadius: '10px' }}
                  >
                    <p className="text-xs font-semibold text-gray-500 mb-1" style={{ fontSize: '11px' }}>
                      {formatWhen(meeting.scheduled_at)}
                    </p>
                    <p className="text-sm font-bold text-gray-900 mb-1" style={{ fontSize: '14px' }}>
                      {meeting.subject}
                    </p>
                    {meeting.contact_name && (
                      <p className="text-xs text-gray-600 mb-3" style={{ fontSize: '12px' }}>
                        Contact: {meeting.contact_name}
                      </p>
                    )}
                    <button
                      onClick={() => meeting.contact_id
                        ? navigate(`/crm/contacts/${meeting.contact_id}`)
                        : navigate('/crm/activities')}
                      className="w-full py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                ))}
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
                {topDeals.length === 0 && (
                  <p className="text-sm text-gray-600">
                    {loading ? 'Loading deals…' : 'No open deals.'}
                  </p>
                )}
                {topDeals.map((deal, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    style={{ borderRadius: '10px' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900" style={{ fontSize: '14px' }}>
                          {index + 1}. {deal.name || deal.title || deal.company_name || deal.id}
                        </p>
                        <p className="text-lg font-bold" style={{ fontSize: '18px', color: '#667eea' }}>
                          {money(dealValue(deal))}
                        </p>
                      </div>
                      {/* The "AI: 78/100" badge is gone. No model produces a deal
                          score, and `probability` is a manually entered stage
                          default — relabelling it as an AI score would be the
                          same claim in a different place. Probability is shown as
                          what it is. */}
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CRMDashboard;
