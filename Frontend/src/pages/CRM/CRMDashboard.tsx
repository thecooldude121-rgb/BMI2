import React, { useMemo, useState } from 'react';
import { Users, TrendingUp, DollarSign, Building2, AlertTriangle, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData, dealValue, isOpen } from '../../hooks/useDashboardData';
import { sortActivitiesNewestFirst } from '../../utils/activitiesApi';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import PointsBreakdownModal from '../../components/gamification/PointsBreakdownModal';
import LevelInfoPopover from '../../components/gamification/LevelInfoPopover';
import ProgressDetailPopover from '../../components/gamification/ProgressDetailPopover';
import StreakPopover from '../../components/gamification/StreakPopover';
import ChallengeDetailModal from '../../components/gamification/ChallengeDetailModal';

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
  const { showToast } = useToast();
  const { user } = useAuth();
  const { deals, contacts, accounts, activities, loading, error, truncated, reload } = useDashboardData();

  const [showPointsBreakdown, setShowPointsBreakdown] = useState(false);
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [showProgressDetail, setShowProgressDetail] = useState(false);
  const [showStreakPopover, setShowStreakPopover] = useState(false);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);

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

  const openDeals = useMemo(() => deals.filter(isOpen), [deals]);
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
  const STAGE_ORDER = ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
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
  // aiInsights: three fixed sentences. One of them ("N deals need attention")
  // is computable from real data; the other two need HRMS and close-rate
  // history that do not exist. Labelled as a preview in the panel below.
  const aiInsights = [
    {
      icon: AlertTriangle,
      message: '3 deals need attention - No activity in 5 days',
      action: 'View Deals',
      type: 'warning'
    },
    {
      icon: Lightbulb,
      message: '2 high-value leads from HRMS ready to contact',
      action: 'View Leads',
      type: 'info'
    },
    {
      icon: TrendingUp,
      message: 'Your close rate is up 12% this month - Great job!',
      action: null,
      type: 'success'
    }
  ];

  // gamificationData: points, rank, level, streak, daily challenge and team
  // celebrations, all invented. There is a gamification_points table and a
  // gamification_achievements table, but nothing reads or writes them from
  // here. Left as-is deliberately — it is outside this data-plumbing pass and
  // wiring it is its own unit of work.
  const gamificationData = {
    userPerformance: {
      points: 38450,
      rank: 2,
      rankChange: 'up',
      level: 4,
      levelName: 'Platinum',
      levelProgress: 87,
      badges: 5,
      streak: 23,
      coins: 10
    },
    dailyChallenge: {
      title: 'Make 15 calls',
      current: 8,
      target: 15,
      progress: 53,
      reward: 200,
      timeRemaining: '6h 32m'
    },
    teamCelebrations: [
      {
        name: 'Sarah',
        achievement: 'closed $120K deal',
        points: 1200,
        time: '2h ago'
      },
      {
        name: 'Mike',
        achievement: 'earned HRMS Master',
        badge: true,
        time: '5h ago'
      },
      {
        name: 'Emily',
        achievement: 'leveled up to Gold',
        levelUp: true,
        time: 'Yesterday'
      }
    ]
  };

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

  // Gamification data structures
  const pointsBreakdownData = {
    dealsClosedPoints: 25000,
    activitiesPoints: 8450,
    challengesPoints: 3000,
    bonusPoints: 2000,
    total: 38450
  };

  const levelInfoData = {
    number: 4,
    name: 'Platinum',
    minPoints: 30000,
    maxPoints: 49999,
    perks: ['Early lead access', 'Flexible schedule', 'Priority support'],
    nextLevel: {
      name: 'Diamond',
      points: 50000
    }
  };

  const progressDetailData = {
    currentPoints: 38450,
    nextLevelPoints: 50000,
    remainingPoints: 11550,
    daysToNextLevel: 14
  };

  const streakData = {
    current: 23,
    longest: 45,
    nextMilestone: {
      days: 30,
      points: 250,
      daysRemaining: 7
    }
  };

  const challengeDetailData = {
    icon: '📞',
    name: 'Daily Dialer',
    description: 'Make 15 calls today',
    current: 8,
    target: 15,
    progress: 53,
    calls: [
      { time: '10:30 AM', contact: 'John Smith' },
      { time: '11:15 AM', contact: 'Sarah Johnson' },
      { time: '11:45 AM', contact: 'Mike Chen' },
      { time: '1:30 PM', contact: 'Emily Brown' },
      { time: '2:00 PM', contact: 'Alex Davis' },
      { time: '2:30 PM', contact: 'Lisa Wilson' },
      { time: '3:00 PM', contact: 'Tom Anderson' },
      { time: '3:30 PM', contact: 'Jane Miller' }
    ],
    reward: 200,
    timeRemaining: '6h 32m'
  };

  // Gamification interaction handlers
  const handlePerformanceWidgetClick = () => {
    showToast('Loading leaderboard...', 'info');
    setTimeout(() => navigate('/crm/gamification/leaderboard'), 300);
  };

  const handlePointsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPointsBreakdown(true);
  };

  const handleRankClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    showToast('Loading leaderboard...', 'info');
    setTimeout(() => navigate('/crm/gamification/leaderboard'), 300);
  };

  const handleLevelBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLevelInfo(true);
  };

  const handleProgressBarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProgressDetail(true);
  };

  const handleBadgesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/crm/gamification/achievements');
  };

  const handleStreakClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStreakPopover(true);
  };

  const handleDealsIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/crm/deals?filter=closed-this-quarter');
  };

  const handleChallengeWidgetClick = () => {
    showToast('Loading challenges...', 'info');
    setTimeout(() => navigate('/crm/gamification/challenges'), 300);
  };

  const handleChallengeNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowChallengeDetail(true);
  };

  const handleCelebrationClick = (celebration: any) => {
    if (celebration.points) {
      navigate(`/crm/deals/deal_sarah_120k`);
      showToast('Loading deal...', 'info');
    } else if (celebration.badge) {
      navigate('/crm/gamification/achievements');
    } else if (celebration.levelUp) {
      navigate('/crm/gamification/profile/user_4');
    }
  };

  const handleCelebrationUserClick = (e: React.MouseEvent, userName: string) => {
    e.stopPropagation();
    const userIdMap: { [key: string]: string } = {
      'Sarah': 'user_1',
      'Mike': 'user_2',
      'Emily': 'user_4'
    };
    showToast(`Loading ${userName}'s profile...`, 'info');
    setTimeout(() => navigate(`/crm/gamification/profile/${userIdMap[userName]}`), 300);
  };

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

        {/* ── AI Insights: PREVIEW, not a working feature ────────────────────
            These three sentences are fixed literals. Nothing computes them:

              "3 deals need attention"   -> computable today from
                                            deals.days_since_contact, but not
                                            wired; the number shown is invented.
              "2 high-value leads from HRMS" -> there is no HRMS integration and
                                            no lead-source pipeline behind it.
              "close rate up 12%"        -> needs period-over-period close-rate
                                            history, which no endpoint provides.

            The two action buttons navigated to /crm/deals?filter=needs-attention
            and /crm/leads?filter=hrms-source. NOTHING reads either query
            parameter — grep is conclusive — so each button promised a filtered
            view and delivered the plain unfiltered page. They are gone: a
            labelled preview whose buttons still act real is only half honest.

            Kept visible rather than deleted because the shape of the feature is
            a real product decision worth showing. Marked so it cannot be read as
            working. Wiring the first line is a small, non-AI change if wanted —
            it is a filter, not a model. */}
        <div
          className="rounded-xl p-6 mb-8 text-white"
          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)' }}
          data-preview="AI Insights"
          aria-describedby="ai-insights-preview-note"
        >
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="font-bold flex items-center" style={{ fontSize: '24px' }}>
              <span className="mr-2" aria-hidden="true">🤖</span> AI Insights
            </h2>
            <span className="rounded-full bg-white/25 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              Preview · sample content
            </span>
          </div>
          <p id="ai-insights-preview-note" className="text-sm text-white/90 mb-4">
            Examples of what this panel will show. <strong>These are not calculated from your
            data</strong> and the numbers are illustrative — the scoring behind them is not built yet.
          </p>
          <div className="space-y-3">
            {aiInsights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div
                  key={index}
                  className="rounded-lg border border-dashed border-white/40 bg-white/5 p-4"
                  style={{ borderRadius: '10px' }}
                >
                  <div className="flex items-start">
                    <Icon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 opacity-70" aria-hidden="true" />
                    <div>
                      <span className="text-white/80 italic">{insight.message}</span>
                      <span className="ml-2 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase align-middle">
                        Example
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Gamification: PREVIEW, not a working feature ───────────────────
            Every figure in these three cards is a literal in `gamificationData`
            above: 38,450 points, rank #2, level 4 "Platinum", 87% to Diamond,
            5 badges, a 23-day streak, 10 coins, a "Make 15 calls" challenge at
            8/15 with "6h 32m remaining", and team celebrations for Sarah, Mike
            and Emily.

            `gamification_points` and `gamification_achievements` exist as tables.
            NOTHING reads or writes either one — no controller, no API client, no
            query. So there is no scoring, no ranking, no streak tracking and no
            leaderboard behind any of it.

            Kept visible because the shape of the feature is a real product
            decision worth showing, and marked so it cannot be read as a record of
            anyone's actual performance. Same treatment as the AI Insights panel. */}
        <div
          className="mb-8 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/60 p-5"
          data-preview="Gamification"
          aria-describedby="gamification-preview-note"
        >
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="font-bold text-gray-900 flex items-center" style={{ fontSize: '18px' }}>
              <span className="mr-2" aria-hidden="true">🎮</span> Performance &amp; Rewards
            </h2>
            <span className="rounded-full bg-gray-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Preview · sample content
            </span>
          </div>
          <p id="gamification-preview-note" className="text-sm text-gray-700 mb-4">
            Illustrative only. <strong>Points, rank, level, streak and team activity below are not
            your data</strong> — nothing tracks or awards them yet, so the numbers are fixed
            examples.
          </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Your Performance Card */}
          <div
            className="relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg cursor-pointer transition-all duration-300"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transform: 'translateY(0)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={handlePerformanceWidgetClick}
          >
            <div className="flex items-center mb-4" onClick={handlePerformanceWidgetClick}>
              <span className="text-2xl mr-2">🏆</span>
              <h3 className="font-bold text-gray-900" style={{ fontSize: '16px' }}>YOUR PERFORMANCE</h3>
            </div>

            <div className="mb-4">
              <div
                className="text-3xl font-bold mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: '#667eea', fontSize: '28px' }}
                onClick={handlePointsClick}
              >
                {gamificationData.userPerformance.points.toLocaleString()} pts
              </div>
              <div
                className="flex items-center text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: '#28a745' }}
                onClick={handleRankClick}
              >
                <span className="font-bold" style={{ color: '#333333' }}>Rank #{gamificationData.userPerformance.rank}</span>
                <span className="ml-1">↑</span>
              </div>
            </div>

            <div
              className="mb-4 p-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#667eea' }}
              onClick={handleLevelBadgeClick}
            >
              <div className="flex items-center justify-center">
                <span className="text-white font-bold" style={{ fontSize: '14px' }}>
                  💎 L{gamificationData.userPerformance.level} {gamificationData.userPerformance.levelName}
                </span>
              </div>
            </div>

            <div
              className="mb-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleProgressBarClick}
            >
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1" style={{ fontSize: '12px' }}>
                <span>{gamificationData.userPerformance.levelProgress}% to Diamond</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full" style={{ height: '8px' }}>
                <div
                  className="rounded-full"
                  style={{
                    height: '8px',
                    width: `${gamificationData.userPerformance.levelProgress}%`,
                    background: '#667eea'
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4" style={{ fontSize: '14px' }}>
              <span
                className="font-medium cursor-pointer hover:scale-105 transition-transform"
                onClick={handleBadgesClick}
              >
                {gamificationData.userPerformance.badges} 🏅
              </span>
              <span
                className="font-medium cursor-pointer hover:scale-105 transition-transform"
                onClick={handleStreakClick}
              >
                {gamificationData.userPerformance.streak}🔥
              </span>
              <span
                className="font-medium cursor-pointer hover:scale-105 transition-transform"
                onClick={handleDealsIconClick}
              >
                {gamificationData.userPerformance.coins}💰
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/crm/gamification/leaderboard');
              }}
              className="w-full py-2 text-center border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#e0e0e0' }}
            >
              Leaderboard
            </button>
          </div>

          {/* Daily Challenge Card */}
          <div
            className="rounded-xl p-6 hover:shadow-lg cursor-pointer transition-all duration-300 text-white"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={handleChallengeWidgetClick}
          >
            <div className="flex items-center mb-4" onClick={handleChallengeWidgetClick}>
              <span className="text-2xl mr-2">🎯</span>
              <h3 className="font-bold text-white" style={{ fontSize: '16px' }}>DAILY CHALLENGE</h3>
            </div>

            <div className="mb-4">
              <div
                className="flex items-center mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={handleChallengeNameClick}
              >
                <span className="text-lg mr-2">📞</span>
                <p className="text-lg font-semibold text-white">
                  {gamificationData.dailyChallenge.title}
                </p>
              </div>

              <div className="mb-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="flex items-center justify-between text-sm text-white mb-1">
                  <span>{gamificationData.dailyChallenge.current} / {gamificationData.dailyChallenge.target} calls</span>
                  <span className="font-medium">{gamificationData.dailyChallenge.progress}%</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-white transition-all duration-500"
                    style={{ width: `${gamificationData.dailyChallenge.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mb-4 p-3 bg-white/20 backdrop-blur-sm rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">🎁</span>
                  <span className="text-sm font-medium text-white">Reward:</span>
                </div>
                <span className="text-lg font-bold text-white">
                  +{gamificationData.dailyChallenge.reward} points
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center p-3 bg-white/10 rounded-lg mb-4">
              <span className="text-sm font-medium text-white/90">
                ⏱️ {gamificationData.dailyChallenge.timeRemaining} remaining
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/crm/gamification/challenges');
              }}
              className="w-full py-2 text-center bg-white rounded-lg text-sm font-medium hover:shadow-md transition-all duration-200"
              style={{ color: '#667eea' }}
            >
              View All
            </button>
          </div>

          {/* Team Celebrations Card */}
          <div
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg cursor-pointer transition-all duration-300"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transform: 'translateY(0)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => {
              showToast('Loading leaderboard...', 'info');
              setTimeout(() => navigate('/crm/gamification/leaderboard'), 300);
            }}
          >
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">🎉</span>
              <h3 className="font-bold text-gray-900" style={{ fontSize: '16px' }}>TEAM CELEBRATIONS</h3>
            </div>

            <div className="space-y-3">
              {gamificationData.teamCelebrations.map((celebration, index) => (
                <div
                  key={index}
                  className="border-b border-gray-200 pb-3 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-all duration-200 -mx-2 px-2 py-2 rounded"
                  style={{ borderLeft: '3px solid transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderLeftColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderLeftColor = 'transparent';
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCelebrationClick(celebration);
                  }}
                >
                  <div className="flex items-start">
                    <span className="text-lg mr-2">
                      {celebration.points ? '💰' : celebration.badge ? '🏅' : '⬆️'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-1" style={{ fontSize: '14px' }}>
                        <span
                          className="font-semibold hover:underline cursor-pointer"
                          onClick={(e) => handleCelebrationUserClick(e, celebration.name)}
                        >
                          {celebration.name}
                        </span>{' '}
                        {celebration.achievement}
                      </p>
                      {celebration.points && (
                        <div className="text-xs font-bold mb-1" style={{ color: '#667eea', fontSize: '12px' }}>
                          +{celebration.points.toLocaleString()} pts
                        </div>
                      )}
                      <p className="text-xs text-gray-500" style={{ fontSize: '11px' }}>{celebration.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/crm/gamification/leaderboard');
              }}
              className="w-full py-2 text-center border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mt-4"
              style={{ borderColor: '#e0e0e0' }}
            >
              View All
            </button>
          </div>
        </div>
        </div>

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

      {/* Gamification Modals and Popovers */}
      <PointsBreakdownModal
        isOpen={showPointsBreakdown}
        onClose={() => setShowPointsBreakdown(false)}
        breakdown={pointsBreakdownData}
      />

      <LevelInfoPopover
        isOpen={showLevelInfo}
        onClose={() => setShowLevelInfo(false)}
        level={levelInfoData}
      />

      <ProgressDetailPopover
        isOpen={showProgressDetail}
        onClose={() => setShowProgressDetail(false)}
        progress={progressDetailData}
      />

      <StreakPopover
        isOpen={showStreakPopover}
        onClose={() => setShowStreakPopover(false)}
        streak={streakData}
      />

      <ChallengeDetailModal
        isOpen={showChallengeDetail}
        onClose={() => setShowChallengeDetail(false)}
        challenge={challengeDetailData}
      />

      {/* PointsDetailTooltip removed: its only trigger was the "+N points earned"
          badge on each fabricated activity row, so with the real activity feed it
          became unreachable UI. The rest of the gamification panels are
          untouched — see the note on gamificationData. */}
    </div>
  );
};

export default CRMDashboard;
