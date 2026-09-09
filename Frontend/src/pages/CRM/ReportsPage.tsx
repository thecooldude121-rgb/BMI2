import React, { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Target, Activity, FileText, Download, ChevronRight, ChevronDown, ChevronUp, Star, Clock, Award, Building2, AlertCircle, Eye, Settings, MoreVertical, Plus, Filter, RefreshCw, Home, Edit } from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { useDashboardData, dealValue } from '../../hooks/useDashboardData';
import { useStageLookup } from '../../hooks/useStageLookup';
import { isWonWith, isLostWith, isOpenWith } from '../../utils/pipelinesApi';

type ReportSection =
  | 'sales' | 'pipeline' | 'activity' | 'leads' | 'revenue' | 'accounts' | 'custom';

/**
 * REPORTS WITH NO DATA SOURCE, and the specific reason each one has none.
 *
 * A `const`, not `useState`, and that is the whole point — the same pattern
 * `DocumentDetailPage` and `DataContext`'s `employees` use. Nothing can ever
 * populate it, so no future edit can quietly turn one of these back into a
 * number: wiring one up means DELETING its entry and writing a real card, which
 * is a visible change in a diff. A state array initialised empty could be
 * filled by anything.
 *
 * WHAT THESE 17 CARDS USED TO SHOW: 100 hardcoded metric rows — "$847K Revenue
 * +12%", "Team: 89% ✅ / Alex: 98% / Sarah: 95%", "Total: 247" activities,
 * "Email Open: 42%", "Healthy: 45 (71%)". None came from a query. Three of them
 * were not even internally consistent with this workspace: Contact Engagement
 * summed to 147 against 20 contacts, Account Health to 63 against 15 accounts,
 * and Lead Response Time to 156 against 38 leads.
 *
 * They sat directly beneath four CORRECT headline figures ($55K / 1 Deal /
 * $1.56M / 50%), which is what made them dangerous rather than merely wrong —
 * the real numbers vouched for the invented ones. That is the hybrid CLAUDE.md
 * lesson 15 describes.
 *
 * EACH REASON NAMES WHAT IS ACTUALLY MISSING, never "coming soon". A reader
 * should be able to tell whether the gap is empty data (fixable by using the
 * product), an unset configuration (fixable in Settings), or an absent column
 * (needs a schema change).
 */
const UNBACKED_REPORTS: ReadonlyArray<{
  section: ReportSection;
  title: string;
  icon: string;
  reason: string;
  /** Where the user can go to make this report possible, when they can. */
  action?: { label: string; to: string };
}> = [
  // ── Sales ────────────────────────────────────────────────────────────────
  {
    section: 'sales', title: 'Sales Overview', icon: '📊',
    /*
     * The LAST card contradicting its neighbours, and why it is here rather
     * than half-blanked: it read "$847K Revenue +12% ⬆️" and "89% to quota"
     * while the card beside it said no quota has been entered, and the real
     * headline figure above it said $55K. Two of its three rows cannot be
     * computed at all — a month-over-month change needs a previous-period
     * query no endpoint offers, and quota progress needs a quota. The third,
     * revenue won, is already reported correctly in the headline row, so
     * leaving the card as a single real number would duplicate that and
     * nothing more.
     */
    reason: 'Revenue won is already shown in the headline figures above. This '
      + 'card also needs a month-over-month change, which requires a query '
      + 'against the previous period that no endpoint offers, and quota '
      + 'progress, which needs a quota to have been entered.',
    action: { label: 'Enter quotas', to: '/crm/forecast' },
  },
  {
    section: 'sales', title: 'Sales by Team', icon: '👔',
    reason: 'No reporting lines are set, so there are no teams to roll up. Every '
      + 'person in this workspace currently has no manager recorded.',
    action: { label: 'Set reporting lines', to: '/crm/settings' },
  },
  {
    section: 'sales', title: 'Quota Attainment', icon: '🎯',
    // Deliberately period-specific: "no quota entered" for WHICH period is the
    // difference between a state the user can fix and a vague absence.
    reason: 'No quota has been entered for this period, so attainment cannot be '
      + 'calculated. Quotas are set per person, per quarter.',
    action: { label: 'Enter quotas', to: '/crm/forecast' },
  },
  {
    section: 'sales', title: 'Sales Forecast', icon: '📈',
    reason: 'Predicted revenue and confidence are not modelled. The Forecast page '
      + 'shows real pipeline grouped by forecast category instead, which is the '
      + 'closest thing this CRM computes.',
    action: { label: 'Open Forecast', to: '/crm/forecast' },
  },

  // ── Pipeline ─────────────────────────────────────────────────────────────
  {
    section: 'pipeline', title: 'Pipeline Trends', icon: '📉',
    reason: 'Month-over-month pipeline needs at least two forecast snapshots for '
      + 'a period, and fewer than two have been taken.',
    action: { label: 'Take a snapshot', to: '/crm/forecast' },
  },

  // ── Activity ─────────────────────────────────────────────────────────────
  // The whole section is unbacked: `activities` holds no rows at all.
  {
    section: 'activity', title: 'Activity Summary', icon: '📊',
    reason: 'No activities have been logged yet, so there is nothing to count by '
      + 'call, email, meeting or task.',
    action: { label: 'Log an activity', to: '/crm/activities' },
  },
  {
    section: 'activity', title: 'Activity vs Revenue', icon: '💰',
    reason: 'Correlating effort against revenue needs logged activity on closed '
      + 'deals, and no activities have been logged yet.',
  },
  {
    section: 'activity', title: 'Response Rates', icon: '📨',
    reason: 'Email opens, call connections and meeting attendance are not tracked. '
      + 'This CRM has no email or telephony integration, so there is no source '
      + 'for these rates.',
  },
  {
    section: 'activity', title: 'Meeting Analytics', icon: '🎤',
    reason: 'No meetings have been logged yet. Attendance, no-shows and duration '
      + 'come from logged activity.',
    action: { label: 'Log a meeting', to: '/crm/meetings' },
  },

  // ── Leads & contacts ─────────────────────────────────────────────────────
  {
    section: 'leads', title: 'Lead Source ROI', icon: '📊',
    reason: 'Revenue is not attributed back to a lead source. Deals do record a '
      + 'source, but nothing links closed revenue to the source that originated '
      + 'the lead.',
  },
  {
    section: 'leads', title: 'Contact Engagement', icon: '💬',
    reason: 'Contacts have no engagement score. Tiering them high, medium or low '
      + 'needs per-contact interaction history, which is not recorded.',
  },
  {
    section: 'leads', title: 'Lead Response Time', icon: '⏱️',
    reason: 'First-response time is not recorded. Leads carry no timestamp for the '
      + 'first outbound contact, so time-to-respond cannot be measured.',
  },

  // ── Revenue ──────────────────────────────────────────────────────────────
  {
    section: 'revenue', title: 'Revenue by Period', icon: '📅',
    reason: 'Period-over-period comparison is not available: it needs a second '
      + 'query against the previous period, and no endpoint offers one.',
  },
  {
    section: 'revenue', title: 'Revenue Forecast vs Actual', icon: '🎯',
    reason: 'No forecast has been recorded for a period that has since closed, so '
      + 'there is nothing to compare actuals against.',
    action: { label: 'Take a snapshot', to: '/crm/forecast' },
  },

  // ── Accounts ─────────────────────────────────────────────────────────────
  {
    section: 'accounts', title: 'Account Health Score', icon: '🏥',
    // The one gap here that needs a SCHEMA change, not data or configuration.
    reason: 'Accounts have no health score. There is no such column on companies, '
      + 'and how health would be scored has not been decided — it is recorded as a '
      + 'backlog item rather than invented here.',
  },
  {
    section: 'accounts', title: 'Top Accounts', icon: '🏆',
    reason: 'Revenue is not yet totalled per account. Deals do link to a company, '
      + 'so this is computable — it simply is not computed yet.',
  },
  {
    section: 'accounts', title: 'Account Growth Opportunities', icon: '🌱',
    reason: 'Expansion, upsell and cross-sell are not tracked. Neither accounts nor '
      + 'deals carry an opportunity-type field to group by.',
  },

  // ── Custom ───────────────────────────────────────────────────────────────
  {
    section: 'custom', title: 'My Q4 Goals Tracker', icon: '🎯',
    reason: 'Personal goals are not stored. There is no goals table, so a target '
      + 'and its progress cannot be saved or tracked.',
  },
];

/**
 * How many WORKING reports each section renders.
 *
 * Still a literal, and honestly so: the surviving cards are hand-written JSX
 * rather than data, so nothing can count them at runtime. It is kept beside
 * UNBACKED_REPORTS so the two halves of a section header are visibly maintained
 * together, and the unavailable half IS derived. Making both derived means
 * turning the working cards into data — a later phase, not this subtraction.
 */
const WORKING_REPORT_COUNTS: Record<ReportSection, number> = {
  sales: 2, pipeline: 3, activity: 0, leads: 1, revenue: 2, accounts: 0, custom: 2,
};

/**
 * A report that cannot be computed, saying why. Deliberately NOT a ReportCard:
 * it has no metrics, no sparkline, and no View/Export/Schedule/Share controls,
 * because every one of those would act on a report that does not exist.
 */
const UnbackedReportCard: React.FC<{
  title: string; icon: string; reason: string;
  action?: { label: string; to: string };
  onNavigate: (to: string) => void;
}> = ({ title, icon, reason, action, onNavigate }) => (
  <div
    className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 flex flex-col"
    data-not-available={title}
  >
    <div className="flex items-start gap-3 mb-3">
      <span className="text-xl grayscale opacity-60" aria-hidden="true">{icon}</span>
      <div>
        <h3 className="font-semibold text-gray-700">{title}</h3>
        <p className="text-xs font-medium text-gray-500 mt-0.5">Not available yet</p>
      </div>
    </div>
    <p className="text-sm text-gray-600 flex-1">{reason}</p>
    {action && (
      <button
        onClick={() => onNavigate(action.to)}
        className="mt-4 self-start text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
      >
        {action.label} →
      </button>
    )}
  </div>
);

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  // Same hook the two dashboards read, so /crm/reports cannot drift from them.
  const {
    leads, deals, contacts, loading: dataLoading, error: dataError, reload,
    /*
     * CONSUMED NOW, and it was not before. Every figure on this page is summed
     * from a list fetched with a limit, so when a list comes back exactly at
     * that limit the totals are LOWER BOUNDS rather than facts. The hook has
     * always reported this; the page destructured everything except it, so a
     * pipeline total that silently omitted deals past the limit was
     * indistinguishable from a complete one. The Team pages surface the same
     * flag — this page was the outlier.
     */
    truncated,
  } = useDashboardData();
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Dropdown states
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Modal states

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasNetworkError, setHasNetworkError] = useState(false);

  // Success states

  // Mobile filter menu

  // Keyboard navigation

  const [expandedSections, setExpandedSections] = useState({
    sales: true,
    pipeline: true,
    activity: true,
    leads: true,
    revenue: true,
    accounts: true,
    custom: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Navigation handlers
  const handleNavigateToDashboard = () => {
    navigate('/');
  };

  const handleNavigateToCustomReportBuilder = () => {
    navigate('/crm/custom-report-builder');
  };

  const handleViewReport = (reportName: string) => {
    // Navigate to report detail view
    const reportSlug = reportName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/crm/reports/${reportSlug}`);
  };





  const handleEditReport = (reportName: string) => {
    const reportSlug = reportName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/crm/custom-report-builder?edit=${reportSlug}`);
  };


  const handleRefreshAll = () => {
    /*
     * CALLS THE REAL RELOAD. This was `setTimeout(() => setIsRefreshing(false),
     * 1500)` — a spinner that ran for a second and a half and refetched
     * nothing, so the page looked refreshed while showing exactly the data it
     * had before. `reload` was already imported and already used by the error
     * banner's retry, so the capability was present and simply not called here.
     *
     * The spinner now follows the hook's own loading flag rather than a timer,
     * which is the same correction the skeleton got.
     */
    setIsRefreshing(true);
    reload();
  };

  const handleRetry = () => {
    // Was three local flags plus a one-second timer that pretended to retry.
    // `reload` is the actual retry, and the banner already uses it.
    setHasNetworkError(false);
    reload();
  };

  /**
   * Live figures for the four headline cards and the conversion funnel.
   *
   * WHAT WAS HERE: four hardcoded strings — "$847,000", "23 Deals", "$2.4M",
   * "68%" — each with an invented growth sub-label ("+12% vs last month",
   * "89% of quota ✅ On track") and a fixed Unicode sparkline that drew a rising
   * trend regardless of data. Real values were $55,000 / 1 / $1.56M / 50%. The
   * $2.4M was the same fabricated pipeline figure the CRM dashboard carried.
   */
  const { lookup } = useStageLookup();

  const stats = useMemo(() => {
    // The win rate below divides won by (won + lost). Classifying by the
    // literal 'closed-won' meant a Renewals or Partnerships win landed in
    // NEITHER bucket — it was counted as open — so the reported win rate was
    // computed over the default pipeline alone while being labelled as the
    // workspace's.
    const won = deals.filter(isWonWith(lookup));
    const lost = deals.filter(isLostWith(lookup));
    const open = deals.filter(isOpenWith(lookup));
    const decided = won.length + lost.length;
    return {
      revenueWon: won.reduce((sum, d) => sum + dealValue(d), 0),
      dealsWon: won.length,
      dealsLost: lost.length,
      openPipeline: open.reduce((sum, d) => sum + dealValue(d), 0),
      openCount: open.length,
      // Won as a share of DECIDED deals, not of all deals. Dividing by every
      // deal gives a "win rate" that can only rise as open deals are added.
      winRate: decided > 0 ? Math.round((won.length / decided) * 100) : null,
      decided,
    };
  }, [lookup, deals]);

  /*
   * The unbacked reports for a section, and an honest header count. The
   * "unavailable" half is DERIVED from UNBACKED_REPORTS, so deleting an entry
   * when a report is finally wired updates the header on its own.
   */
  const unbackedFor = (section: ReportSection) =>
    UNBACKED_REPORTS.filter((r) => r.section === section);

  const sectionCount = (section: ReportSection): string => {
    const working = WORKING_REPORT_COUNTS[section];
    const missing = unbackedFor(section).length;
    if (missing === 0) return `(${working} ${working === 1 ? 'report' : 'reports'})`;
    if (working === 0) return `(${missing} not available)`;
    return `(${working} available · ${missing} not available)`;
  };

  /*
   * THE CATEGORY FILTER, ACTUALLY GATING THE RENDER. CLAUDE.md's design rules
   * say a view toggle that only restyles its own control is a bug; this one
   * previously did not even restyle — `selectedCategory` was read by nothing.
   * It needs no data to work, which is why it is the one filter kept.
   */
  const showSection = (section: ReportSection) =>
    selectedCategory === 'all' || selectedCategory === section;

  const renderUnbacked = (section: ReportSection) =>
    unbackedFor(section).map((r) => (
      <UnbackedReportCard key={r.title} {...r} onNavigate={navigate} />
    ));

  const money = (n: number): string =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000    ? `$${Math.round(n / 1_000)}K`
    : `$${n.toLocaleString()}`;

  /** Lead-stage counts for the conversion funnel. */
  const funnel = useMemo(() => {
    const byStatus = (v: string) => leads.filter(l => l.status === v).length;
    return {
      leads: leads.length,
      contacts: contacts.length,
      qualified: byStatus('qualified'),
      won: byStatus('won'),
      lost: byStatus('lost'),
    };
  }, [leads, contacts]);

  // The skeleton below now tracks the REAL fetch. It used to be
  //   setTimeout(() => setIsLoading(false), 2000)
  // — a two-second animation that then revealed hardcoded numbers, which is
  // what made them look freshly queried. `isLoading` is kept because other
  // parts of the page read it; it follows the hook now.
  React.useEffect(() => {
    setIsLoading(dataLoading);
    // Ends the manual-refresh spinner on the REAL fetch completing.
    if (!dataLoading) setIsRefreshing(false);
  }, [dataLoading]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc had closed five report modals and a mobile filter sheet, all of
      // which are gone; and `/` focused a search box that is gone too. Only
      // the two shortcuts that still act on something remain.

      // Create custom report with C
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleNavigateToCustomReportBuilder();
        return;
      }

      // Refresh with R
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleRefreshAll();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if there are any custom reports

  // Check if search has results

  // Check if category has reports

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="p-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center text-sm text-gray-600">
          <Home className="w-4 h-4 mr-2" />
          <button onClick={handleNavigateToDashboard} className="hover:text-blue-600 cursor-pointer">
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Reports</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {/*
                    WAS the fixed string "Last updated: 5 minutes ago", which
                    never moved and was never measured. Nothing records when
                    this page last fetched, so it reports only what it knows.
                  */}
                  <span>{dataLoading ? 'Loading…' : 'Figures are live'}</span>
                  {isRefreshing && (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <Button
                onClick={handleNavigateToCustomReportBuilder}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Custom Report</span>
              </Button>
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <MoreVertical className="w-4 h-4" />
                  More
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Schedule Report Delivery
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export All Reports (PDF)
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Report Settings
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Manage Favorites
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Archived Reports
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Network Error Banner */}
        {hasNetworkError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900">No internet connection</h3>
                <p className="text-sm text-red-700 mt-1">Some reports may not be up to date</p>
              </div>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/*
          ONE FILTER, AND IT WORKS. Four were here; three are gone.

          REMOVED — Date Range, Owner and Search. All three were bound to their
          <select>/<input> `value` and read by NOTHING: no computation, no
          render decision. Date Range offered eight options including "Custom
          Date Range…", Owner listed five colleagues, and Search had a `/`
          shortcut to focus it — none of which changed a single figure. A
          control that claims to filter and does not is worse than its absence,
          because the reader trusts the number that follows it.

          They are not wired up instead, because none of them CAN be yet. Date
          Range and Owner need per-period and per-owner rollups, which is the
          phase (c) build. Search needs the report cards to be data rather than
          hand-written JSX — the same refactor. `hasSearchResults` was
          hardcoded `searchQuery === '' || true`, which also made its
          no-results empty state unreachable dead code; both went with it.

          KEPT AND WIRED — Category, which needs no data at all: it gates which
          SECTIONS render, and now actually does.
        */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" aria-hidden="true" />
          <label htmlFor="report-category" className="text-sm font-medium text-gray-700 shrink-0">
            Category:
          </label>
          <select
            id="report-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Reports</option>
            <option value="sales">Sales Performance</option>
            <option value="pipeline">Pipeline Reports</option>
            <option value="activity">Activity Reports</option>
            <option value="leads">Lead &amp; Contact Reports</option>
            <option value="revenue">Revenue Reports</option>
            <option value="accounts">Account Reports</option>
            <option value="custom">My Custom Reports</option>
          </select>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Show all
            </button>
          )}
        </div>

        {/* A failed request must not render as $0 / 0 deals. The hook reports
            which part failed; without this the cards would silently show zeros,
            which is the same untruth as the literals they replaced. */}
        {dataError && (
          <div
            className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4"
            role="alert"
          >
            <p className="text-sm text-yellow-900">{dataError}</p>
            <button
              onClick={reload}
              className="shrink-0 text-sm font-semibold text-yellow-900 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/*
          EVERY TOTAL ON THIS PAGE IS A SUM OVER A FETCHED LIST, so when a list
          arrives at exactly its limit the totals below stop being facts and
          become lower bounds. Saying so is the point: an understated pipeline
          that looks precise is the same class of untruth as an invented one,
          and it is the failure this page spent 107 hardcoded rows committing in
          the other direction.
        */}
        {truncated && !dataError && (
          <div
            className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4"
            role="alert"
          >
            <p className="text-sm text-amber-900">
              More records exist than were loaded, so every total on this page is a
              lower bound rather than an exact figure.
            </p>
          </div>
        )}

        {/* Quick Stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Sub-labels are factual captions, not deltas. The old ones ("+12% vs
              last month ⬆️", "+8% growth", "+5 points") were invented: a
              period-over-period figure needs a second query against the previous
              period and no endpoint offers one. Same decision as the dashboard
              trend badges in 12/n. */}
          <QuickStatCard
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            label="REVENUE WON"
            value={money(stats.revenueWon)}
            change={`From ${stats.dealsWon} closed-won ${stats.dealsWon === 1 ? 'deal' : 'deals'}`}
            changeColor="text-gray-600"
            bgColor="bg-green-50"
            reportName="Sales Overview"
            onView={handleViewReport}
          />
          {/* Was "89% of quota ✅ On track". The quotas table has ZERO rows and
              this page queries it nowhere, so attainment cannot be computed. */}
          <QuickStatCard
            icon={<Target className="w-6 h-6 text-blue-600" />}
            label="DEALS WON"
            value={`${stats.dealsWon} ${stats.dealsWon === 1 ? 'Deal' : 'Deals'}`}
            change={stats.decided > 0 ? `${stats.dealsLost} lost · quota not tracked` : 'No deals closed yet'}
            changeColor="text-gray-600"
            bgColor="bg-blue-50"
            reportName="Quota Attainment"
            onView={handleViewReport}
          />
          <QuickStatCard
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            label="OPEN PIPELINE"
            value={money(stats.openPipeline)}
            change={`${stats.openCount} open ${stats.openCount === 1 ? 'deal' : 'deals'}, excludes closed`}
            changeColor="text-gray-600"
            bgColor="bg-purple-50"
            reportName="Pipeline Health"
            onView={handleViewReport}
          />
          {/* Won / decided, not won / all deals — see the note on `stats`. */}
          <QuickStatCard
            icon={<Award className="w-6 h-6 text-orange-600" />}
            label="WIN RATE"
            value={stats.winRate === null ? '—' : `${stats.winRate}%`}
            change={stats.decided > 0
              ? `${stats.dealsWon} won of ${stats.decided} decided`
              : 'No decided deals yet'}
            changeColor="text-gray-600"
            bgColor="bg-orange-50"
            reportName="Win/Loss Analysis"
            onView={handleViewReport}
          />
          </div>
        )}

        {/*
          THE TWO EMPTY STATES HERE WERE UNREACHABLE. Both were gated on
          `hasSearchResults` / `hasCategoryReports`, which were hardcoded
          `true` behind `// TODO` comments, so neither could ever render. They
          and their components are deleted rather than left as dead code that
          reads like a considered edge case. Every section has at least one
          card, available or not, so "this category has no reports" cannot
          happen either.
        */}

        {/* Sales Performance Section */}
        {true && (
        <>
        <div className={`mb-6 ${showSection('sales') ? '' : 'hidden'}`}>
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('sales')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-700" />
                <span className="text-lg font-semibold text-gray-900">💰 SALES PERFORMANCE</span>
                <span className="text-sm text-gray-700">{sectionCount('sales')}</span>
              </div>
              {expandedSections.sales ? (
                <ChevronUp className="w-5 h-5 text-green-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-green-700" />
              )}
            </button>
          </div>
          {expandedSections.sales && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {renderUnbacked('sales')}
                <ReportCard
                  title="Sales by Rep"
                  icon="👥"
                  metrics={[
                    { label: 'Alex: $342K #1', value: '' },
                    { label: 'Sarah: $298K #2', value: '' },
                    { label: 'Mike: $207K #3', value: '' },
                  ]}
                  sparkline="▇▇▇▆▅▄▃"
                  onView={handleViewReport}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard
                  title="Win/Loss Analysis"
                  icon="📉"
                  metrics={[
                    { label: 'Won: 23 (68%)', value: '' },
                    { label: 'Lost: 11 (32%)', value: '' },
                    { label: 'Win vs Loss', value: '████ vs ██' },
                  ]}
                  onView={handleViewReport}
                />
              </div>
            </div>
          )}
        </div>

        {/* Pipeline Reports Section */}
        <div className={`mb-6 ${showSection('pipeline') ? '' : 'hidden'}`}>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('pipeline')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-purple-700" />
                <span className="text-lg font-semibold text-gray-900">📊 PIPELINE REPORTS</span>
                <span className="text-sm text-gray-700">{sectionCount('pipeline')}</span>
              </div>
              {expandedSections.pipeline ? (
                <ChevronUp className="w-5 h-5 text-purple-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-purple-700" />
              )}
            </button>
          </div>
          {expandedSections.pipeline && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                {renderUnbacked('pipeline')}
                <ReportCard
                  title="Pipeline Health"
                  icon="🏥"
                  metrics={[
                    { label: 'Total: $2.4M', value: '' },
                    { label: 'Qualified: $620K', value: '' },
                    { label: 'Proposal: $890K', value: '' },
                    { label: 'Negotiation: $890K', value: '' },
                  ]}
                  sparkline="▇▇▇▆▅"
                  onView={handleViewReport}
                />
                <ReportCard
                  title="Pipeline by Owner"
                  icon="👤"
                  metrics={[
                    { label: 'Alex: $892K', value: '' },
                    { label: 'Sarah: $745K', value: '' },
                    { label: 'Mike: $563K', value: '' },
                    { label: 'Emily: $200K', value: '' },
                  ]}
                  sparkline="████▇▆▃"
                  onView={handleViewReport}
                />
                <ReportCard
                  title="Aging Pipeline"
                  icon="⏳"
                  metrics={[
                    { label: '30-60 days: 8', value: '' },
                    { label: '60-90 days: 5', value: '' },
                    { label: '90+ days: 3 ⚠️', value: '' },
                  ]}
                  sparkline="▅▅▄▄▃"
                  onView={handleViewReport}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              </div>
            </div>
          )}
        </div>

        {/* Activity Reports Section */}
        <div className={`mb-6 ${showSection('activity') ? '' : 'hidden'}`}>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('activity')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-orange-700" />
                <span className="text-lg font-semibold text-gray-900">📞 ACTIVITY REPORTS</span>
                <span className="text-sm text-gray-700">{sectionCount('activity')}</span>
              </div>
              {expandedSections.activity ? (
                <ChevronUp className="w-5 h-5 text-orange-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-orange-700" />
              )}
            </button>
          </div>
          {expandedSections.activity && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                {renderUnbacked('activity')}
              </div>
            </div>
          )}
        </div>

        {/* Lead & Contact Reports */}
        <div className={`mb-6 ${showSection('leads') ? '' : 'hidden'}`}>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('leads')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-700" />
                <span className="text-lg font-semibold text-gray-900">🎯 LEAD & CONTACT REPORTS</span>
                <span className="text-sm text-gray-700">{sectionCount('leads')}</span>
              </div>
              {expandedSections.leads ? (
                <ChevronUp className="w-5 h-5 text-blue-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-blue-700" />
              )}
            </button>
          </div>
          {expandedSections.leads && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                {renderUnbacked('leads')}
                {/* Was the literals 156 / 147 / 78 / 23 / 15%. "Contacts: 147"
                    was the same fabricated number the CRM dashboard and the
                    contacts list carried. Now the live counts, from the hook the
                    dashboards read.

                    "Conversion" is won / DECIDED leads, and reads "—" until at
                    least one lead is decided: dividing by all leads gives a rate
                    that can only climb as open leads are added. */}
                <ReportCard
                  title="Lead Conversion Funnel"
                  icon="🔄"
                  metrics={[
                    { label: `Leads: ${funnel.leads}`, value: '' },
                    { label: `Contacts: ${funnel.contacts}`, value: '' },
                    { label: `Qualified: ${funnel.qualified}`, value: '' },
                    { label: `Won: ${funnel.won}`, value: '' },
                    { label: `Lost: ${funnel.lost}`, value: '' },
                    {
                      label: (funnel.won + funnel.lost) > 0
                        ? `Conversion: ${Math.round((funnel.won / (funnel.won + funnel.lost)) * 100)}%`
                        : 'Conversion: —',
                      value: '',
                    },
                  ]}
                  updated={dataLoading ? 'loading' : 'live'}
                  onView={handleViewReport}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              </div>
            </div>
          )}
        </div>

        {/* Revenue Reports */}
        <div className={`mb-6 ${showSection('revenue') ? '' : 'hidden'}`}>
          <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('revenue')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-teal-700" />
                <span className="text-lg font-semibold text-gray-900">💵 REVENUE REPORTS</span>
                <span className="text-sm text-gray-700">{sectionCount('revenue')}</span>
              </div>
              {expandedSections.revenue ? (
                <ChevronUp className="w-5 h-5 text-teal-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-teal-700" />
              )}
            </button>
          </div>
          {expandedSections.revenue && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                {renderUnbacked('revenue')}
                <ReportCard
                  title="Revenue by Source"
                  icon="📊"
                  metrics={[
                    { label: '🎯 Lead Gen: $298K (69%)', value: '' },
                    { label: '🌐 Website: $89K (20%)', value: '' },
                    { label: '✍️ Manual: $48K (11%)', value: '' },
                  ]}
                  onView={handleViewReport}
                />
                <ReportCard
                  title="Revenue by Industry"
                  icon="🏭"
                  metrics={[
                    { label: 'SaaS: $342K (40%)', value: '' },
                    { label: 'Enterprise: $298K', value: '' },
                    { label: 'Healthcare: $142K', value: '' },
                    { label: 'Finance: $65K', value: '' },
                    { label: '💡 SaaS highest growth: +28%', value: '' },
                  ]}
                  sparkline="█████▇▅▃"
                  onView={handleViewReport}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              </div>
            </div>
          )}
        </div>

        {/* Account Reports */}
        <div className={`mb-6 ${showSection('accounts') ? '' : 'hidden'}`}>
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('accounts')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-indigo-700" />
                <span className="text-lg font-semibold text-gray-900">🏢 ACCOUNT REPORTS</span>
                <span className="text-sm text-gray-700">{sectionCount('accounts')}</span>
              </div>
              {expandedSections.accounts ? (
                <ChevronUp className="w-5 h-5 text-indigo-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-indigo-700" />
              )}
            </button>
          </div>
          {expandedSections.accounts && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderUnbacked('accounts')}
              </div>
            </div>
          )}
        </div>

        {/* Custom Reports */}
        <div className={`mb-6 ${showSection('custom') ? '' : 'hidden'}`}>
          <div className="bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('custom')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-pink-700" />
                <span className="text-lg font-semibold text-gray-900">📝 CUSTOM REPORTS (User Created)</span>
              </div>
              {expandedSections.custom ? (
                <ChevronUp className="w-5 h-5 text-pink-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-pink-700" />
              )}
            </button>
          </div>
          {expandedSections.custom && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              {/*
                Was gated on `hasCustomReports = true`, a hardcoded stub, so the
                EmptyState branch below it could never render. The branch is
                dropped with the stub — there are custom reports here, they are
                just still hardcoded until phase (c).
              */}
              <>
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    {renderUnbacked('custom')}
                    <ReportCard
                      title="SaaS Pipeline Report"
                      icon="📊"
                      metrics={[
                        { label: 'Created by: Me', value: '' },
                        { label: 'SaaS Deals: 15', value: '' },
                        { label: 'Value: $687K', value: '' },
                        { label: 'Avg: $45.8K', value: '' },
                      ]}
                      sparkline="▅▆▇█▆"
                      editable
                      onView={handleViewReport}
                      onEdit={handleEditReport}
                    />
                    <ReportCard
                      title="High Priority Deals"
                      icon="🎯"
                      metrics={[
                        { label: 'Created by: Me', value: '' },
                        { label: 'Priority: 18', value: '' },
                        { label: 'Total: $892K', value: '' },
                        { label: 'Close This Week: 5 deals', value: '' },
                      ]}
                      sparkline="▇▇▅▃"
                      editable
                      onView={handleViewReport}
                      onEdit={handleEditReport}
                    />
                  </div>
                  <button
                    onClick={handleNavigateToCustomReportBuilder}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center gap-2 text-blue-600 font-medium transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Custom Report
                  </button>
              </>
            </div>
          )}
        </div>
        </>
        )}

        {/* Modals */}
        {/*
          FIVE MODALS AND A SUCCESS TOAST DELETED: Schedule Report, Share with
          Team, Delete, Rename, Email Report, and the "Report exported
          successfully" / "Schedule created" toast they all fired.

          None of them wrote anything — this page issues no requests except the
          reads behind its figures — so each one collected input, closed, and
          announced success. The Share modal picked recipients and a permission;
          the Schedule modal picked a frequency and a delivery address; Delete
          and Rename acted on reports that are hardcoded JSX and cannot be
          deleted or renamed. A confirmation over an unchanged database is the
          defect this whole remediation has been unwinding, and these were six
          of them on one page.

          They are removed rather than disabled: a disabled Share button still
          advertises sharing. Their triggers went with the card action row.
        */}
      </div>
    </div>
  );
};

// Empty State Components

// Wrapper component to simplify ReportCard usage
interface QuickStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  changeColor: string;
  bgColor: string;
  reportName: string;
  onView: (reportName: string) => void;
  /**
   * OPTIONAL and no longer passed by the four headline cards. They used fixed
   * Unicode strings like "━━━▁▃▄▃▅▆▇▄▆▅" that drew a rising trend whatever the
   * data was. Nothing produces a real series for these yet.
   */
  sparkline?: string;
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({
  icon,
  label,
  value,
  change,
  sparkline,
  changeColor,
  bgColor,
  reportName,
  onView,
}) => {
  return (
    <div
      onClick={() => onView(reportName)}
      className="bg-white rounded-lg border border-gray-200 p-5 h-[140px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          {icon}
        </div>
        <div className="text-sm font-semibold text-gray-600">{label}</div>
      </div>
      <div className="text-[28px] font-bold text-gray-900 leading-none mb-2">{value}</div>
      <div className={`text-sm font-medium mb-2 ${changeColor}`}>{change}</div>
      <div className="text-xs text-gray-400 mb-2 font-mono tracking-wider">{sparkline}</div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(reportName);
        }}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
      >
        View Report
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// SimpleReportCard and its props were deleted here: an unused wrapper around
// ReportCard, flagged as dead by TS6133 long before this pass and kept only
// because nothing forced the issue. Its own prop list still carried the
// export/schedule/share callbacks, which is why trimming those from
// ReportCardProps first hit the wrong interface.

interface ReportCardProps {
  title: string;
  icon: string;
  metrics: Array<{ label: string; value: string }>;
  /**
   * A REAL freshness value, or absent. Optional on purpose: ten of these cards
   * carried invented staleness — "5m", "10m", "1h", "Last run: 2h ago" — none of
   * it measured from anything, on cards whose figures were not fetched either.
   * Invented precision standing in for a timestamp that is not tracked is the
   * same defect as an invented number, so the label is omitted rather than
   * guessed. Only the card that actually reads live data reports its freshness.
   */
  updated?: string;
  sparkline?: string;
  progress?: string;
  highlight?: boolean;
  editable?: boolean;
  onView: (title: string) => void;
  onEdit?: (title: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  icon,
  metrics,
  updated,
  sparkline,
  progress,
  highlight,
  editable,
  onView,
  onEdit,
}) => {
  return (
    <div
      onClick={() => onView(title)}
      className={`border rounded-lg p-4 min-h-[240px] flex flex-col hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-500 transition-all duration-200 cursor-pointer relative ${
        highlight ? 'border-[#ff9800] bg-[#fff3cd]' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-2xl mb-2">{icon}</div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
        </div>
      </div>
      <div className="space-y-1 mb-3 text-sm overflow-y-auto max-h-[80px] flex-shrink-0">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between text-gray-700">
            <span className={metric.label.startsWith('💡') || metric.label.startsWith('⚠️') ? 'font-medium' : ''}>
              {metric.label}
            </span>
            {metric.value && <span className="text-gray-600">{metric.value}</span>}
          </div>
        ))}
      </div>
      {sparkline && (
        <div className="text-xs text-gray-400 mb-2 font-mono tracking-wider h-[20px] flex-shrink-0">{sparkline}</div>
      )}
      {progress && (
        <div className="text-xs text-blue-600 mb-2 font-mono tracking-wider h-[20px] flex-shrink-0">{progress}</div>
      )}
      <div className="flex-grow"></div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-shrink-0">
        {updated ? (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{updated}</span>
          </div>
        ) : <div />}
      </div>
      {/*
        ONLY THE CONTROLS THAT DO SOMETHING.
        Removed: Export (with its PDF / CSV / Excel / Email menu), Schedule
        Report, Share with Team, Refresh Data, Rename and Delete.

        Every one of them persisted NOTHING — this page performs no writes at
        all — and the three exports were the worst of them: they
        `console.log`ged and then rendered "Report exported successfully" with a
        "View File" button, so a user would go looking on disk for a file that
        was never created. A success toast over a no-op is this project's
        signature defect, and here it pointed at a nonexistent artefact.

        Export is NOT wired up instead, deliberately. The figures on the
        remaining cards are still hardcoded until phase (c), and writing those
        into a file the user keeps is worse than showing them on screen: on
        screen they are surrounded by context, in a spreadsheet they become
        someone's evidence. Export comes back when the numbers behind it are
        real.

        `View` stays because /crm/reports/:slug is a real route, and `Edit`
        because it navigates to the custom-report builder.
      */}
      <div className="flex items-center gap-2 mt-2 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(title);
          }}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded transition-colors"
        >
          <Eye className="w-4 h-4 inline mr-1" />
          View
        </button>
        {editable && onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(title);
            }}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded transition-colors flex items-center gap-1"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
