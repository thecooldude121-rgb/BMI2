import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Globe, MapPin, Phone, Edit, MoreVertical,
  Eye, Users, DollarSign, MessageSquare, FileText, GitMerge, Trash2,
  Copy, Archive, AlertCircle, Download,
} from 'lucide-react';
import { useAccounts } from '../../contexts/AccountsContext';
import { fetchContacts, updateContactViaAPI } from '../../utils/contactsApi';
import { fetchActivities, type ActivityRecord } from '../../utils/activitiesApi';
import { fetchDealsForAccount, type RelatedDeal } from '../../utils/dealsApi';
import { documentsService, type Document as DocumentRecord } from '../../services/documentsService';
import { formatDisplayDate } from '../../utils/dateUtils';
import type { Contact } from '../../types/contact';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import CompanyInformationPanel from '../../components/Accounts/CompanyInformationPanel';
import ActiveDealsSection, { type Deal as SectionDeal } from '../../components/Accounts/ActiveDealsSection';
import AccountContactsSection from '../../components/Accounts/AccountContactsSection';
import RecentActivitiesTimeline, { type ActivityItem } from '../../components/Accounts/RecentActivitiesTimeline';
import EnhancedMetricsBar from '../../components/Accounts/EnhancedMetricsBar';

/**
 * Account detail — Phase-1 item 3: "account detail, related deals, account
 * team (champion / decision-maker / influencer / blocker)".
 *
 * ─── WHY THIS FILE WAS REWRITTEN RATHER THAN EDITED ─────────────────────────
 *
 * This page is the one place in the project where "check the network log"
 * actively misleads. It issued real, successful requests for contacts and
 * activities — and then rendered invented data over the top of them. Anyone
 * verifying it by watching for 200s saw three green requests and concluded the
 * page was sound. Every value below is now cross-checked against its Postgres
 * row instead.
 *
 * What was here, in four layers:
 *
 * 1. THREE mock consts. `mockDeals` injected probability: 70, health: 'good',
 *    lastActivity: '2 days ago', daysInStage: 15 and nextStep: 'Schedule demo
 *    with decision maker' into every row. `mockContacts` mapped over
 *    REALLY-FETCHED contacts and injected engagementScore: idx === 0 ? 95 :
 *    idx === 1 ? 90 : 75 — index-based fabrication two lines below a comment
 *    explaining the adjacent index-based `role` had been deleted for being
 *    exactly that. `mockActivities` was wholly invented ("Product Demo with
 *    Sarah Chen", an aiSummary, "2 hours ago") AND IT IS WHAT RENDERED, while
 *    the real `accountActivities` fetch fed one filtered count and was never
 *    displayed. `mockOrgChart` invented a reporting hierarchy.
 *
 * 2. FIVE components whose props could only be satisfied with invented values,
 *    now deleted: AIAccountInsightsPanel (invented scores at the call site AND
 *    invented DEFAULTS in its own signature — healthScore = 92, engagement =
 *    95 — over a hardcoded body: "Upsell Opportunity: High, +$35K in Q1 2026",
 *    "Churn Risk: Low (5%)", "Ask Sarah for warm intro"), HRMSIntelligencePanel
 *    (defaults contactName = 'Sarah Chen', employeeCount = 450), OrganizationChart,
 *    SimilarAccountsPanel and DataSourcesPanel (dataQuality={96},
 *    lastEnrichment="2 hours ago" over an empty source list).
 *
 *    The DEFAULTS are the part worth remembering: removing an invented prop at
 *    the call site does nothing when the component supplies the same invention
 *    from its own signature. That is a fabrication you cannot see from the page.
 *
 * 3. TWO ENTIRE TABS of inline fabricated JSX, which no audit of the mock
 *    consts would have found. Activities rendered "24 Emails / 8 Calls / 5
 *    Meetings / 12 Notes" and a timeline of "Sent proposal to Sarah Lee ...
 *    Opened on Nov 14, 4:15 PM" as literal markup — against an `activities`
 *    table holding 0 rows. Documents rendered "24.5 MB / 100 MB" of storage
 *    and TechStart_Proposal_Q1_2025.pdf against 0 document rows.
 *
 * 4. LastInteractionBar, called with lastInteractionDate="Nov 14, 2025"
 *    daysAgo={2} engagementScore={95} — three literals, no source for any.
 *    And a hero reading `{account.employeeCount || 0} employees`, which
 *    printed "0 employees" on every account because companies stores a `size`
 *    band and accountsApi correctly leaves employeeCount undefined.
 *
 * ─── WHAT IS REAL NOW ───────────────────────────────────────────────────────
 *   account       companies row, via AccountsContext -> /companies
 *   contacts      /contacts?account_id=  (contacts.company_id is a real FK)
 *   buying role   contacts.buying_role (migration 026), settable in the UI
 *   deals         /deals?company_id=     (deals.company_id, migration 027)
 *   activities    /activities?company_id=
 *   documents     /documents?module=companies&record_id=
 *
 * Empty is the expected answer for most of these today, and each empty state
 * says WHY it is empty rather than implying the account has no history.
 */

type TabType = 'overview' | 'contacts' | 'deals' | 'activities' | 'docs';

const TABS = [
  { key: 'overview',   label: 'Overview',   icon: Eye },
  { key: 'contacts',   label: 'Contacts',   icon: Users },
  { key: 'deals',      label: 'Deals',      icon: DollarSign },
  { key: 'activities', label: 'Activities', icon: MessageSquare },
  { key: 'docs',       label: 'Documents',  icon: FileText },
  // The HRMS tab is gone. HRMS is a separate platform reached across the SSO
  // boundary, `employees` has no tenant_id so nothing here may join it, and
  // every account rendered the panel's invented defaults or nothing at all.
] as const;

const EnhancedAccountDetailView: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { getAccountById, deleteAccount, loading: accountsLoading, error: accountsError } = useAccounts();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const account = accountId ? getAccountById(accountId) : undefined;

  // ── Related records ───────────────────────────────────────────────────────
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactsLoading, setContactsLoading] = useState(true);

  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const [deals, setDeals] = useState<RelatedDeal[]>([]);
  const [dealsError, setDealsError] = useState<string | null>(null);
  const [dealsLoading, setDealsLoading] = useState(true);

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const loadContacts = useCallback(async () => {
    if (!accountId) return;
    setContactsLoading(true);
    try {
      setContacts(await fetchContacts({ companyId: accountId, limit: 200 }));
      setContactsError(null);
    } catch (e: any) {
      setContactsError(e?.message ?? 'Could not load contacts');
    } finally {
      setContactsLoading(false);
    }
  }, [accountId]);

  useEffect(() => { void loadContacts(); }, [loadContacts]);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;

    // Four independent requests, each with its own error state. allSettled is
    // deliberate: a failing documents request must cost the documents tab, not
    // the whole page. Each failure is SURFACED — returning [] on error is what
    // makes a broken request indistinguishable from an account with no history.
    setActivitiesLoading(true); setDealsLoading(true); setDocumentsLoading(true);
    Promise.allSettled([
      fetchActivities({ company_id: accountId, limit: 200 }),
      fetchDealsForAccount(accountId),
      documentsService.loadDocuments({ entity_type: 'companies', entity_id: accountId, limit: 100 }),
    ]).then(([actRes, dealRes, docRes]) => {
      if (cancelled) return;
      if (actRes.status === 'fulfilled') { setActivities(actRes.value); setActivitiesError(null); }
      else setActivitiesError(actRes.reason?.message ?? 'Could not load activity');
      setActivitiesLoading(false);

      if (dealRes.status === 'fulfilled') { setDeals(dealRes.value); setDealsError(null); }
      else setDealsError(dealRes.reason?.message ?? 'Could not load deals');
      setDealsLoading(false);

      if (docRes.status === 'fulfilled') { setDocuments(docRes.value.data); setDocumentsError(null); }
      else setDocumentsError(docRes.reason?.message ?? 'Could not load documents');
      setDocumentsLoading(false);
    });

    return () => { cancelled = true; };
  }, [accountId]);

  // ── Derived, all from real rows ───────────────────────────────────────────

  const meetingsThisQuarter = useMemo(() => {
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    return activities.filter(a => {
      if (a.type !== 'meeting') return false;
      const when = a.completed_at ?? a.scheduled_at ?? a.created_at;
      return when ? new Date(when) >= quarterStart : false;
    }).length;
  }, [activities]);

  const pipelineValue = useMemo(
    () => deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    [deals],
  );

  const formatMoney = (amount: number) => {
    if (!amount) return '$0';
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount}`;
  };

  /**
   * Only figures with a query behind them.
   *
   * Deleted from this bar and NOT replaced, because nothing stores them:
   * response rate, average response time, contact influence tiers, per-stage
   * meeting counts, weighted-pipeline probability averages, and every trend
   * arrow — a period-over-period comparison needs a second query, and an
   * invented percentage is what this work exists to remove.
   */
  const metrics = useMemo(() => [
    {
      title: 'Linked Pipeline',
      value: formatMoney(pipelineValue),
      subtitle: deals.length === 0 ? 'No deals linked' : undefined,
      details: deals.slice(0, 2).map(d => ({
        label: d.name,
        value: formatMoney(Number(d.value) || 0),
      })),
    },
    { title: 'Linked Deals', value: String(deals.length), details: [] },
    { title: 'Contacts', value: String(contacts.length), details: [] },
    { title: 'Activities', value: String(activities.length), details: [] },
    { title: 'Meetings This Qtr', value: String(meetingsThisQuarter), details: [] },
  ], [pipelineValue, deals, contacts.length, activities.length, meetingsThisQuarter]);

  /** Real deals in the section's shape. The invented fields are simply absent. */
  const sectionDeals: SectionDeal[] = useMemo(
    () => deals.map(d => ({
      id: d.id,
      name: d.name,
      stage: d.stage ?? 'unknown',
      value: Number(d.value) || 0,
      closeDate: d.expected_close_date
        ? formatDisplayDate(d.expected_close_date)
        : 'No close date',
      probability: d.probability ?? 0,
      // health, lastActivity, daysInStage and nextStep are optional on the
      // Deal type and stay unset. They were 'good' / '2 days ago' / 15 /
      // 'Schedule demo with decision maker' on every row.
    })),
    [deals],
  );

  /** Real activities in the timeline's shape. */
  const timelineItems: ActivityItem[] = useMemo(
    () => activities.map(a => {
      const whenIso = a.completed_at ?? a.scheduled_at ?? a.created_at ?? '';
      return {
        id: a.id,
        type: (['email', 'call', 'meeting', 'note', 'task', 'proposal'].includes(a.type ?? '')
          ? a.type
          : 'other') as ActivityItem['type'],
        title: a.subject || '(no subject)',
        description: a.description ?? undefined,
        contactName: a.contact_name ?? undefined,
        // The full instant, not a truncated ISO date: these are TIMESTAMPTZ and
        // splitting on 'T' shifts the day across a timezone boundary.
        timestamp: whenIso ? formatDisplayDate(whenIso) : 'No date',
        // aiSummary, outcome and nextSteps stay unset. The invented timeline
        // carried an aiSummary on every entry; nothing generates one.
      };
    }),
    [activities],
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleSetBuyingRole = async (contactId: string, role: string | null) => {
    // Writes through the real endpoint, then re-reads. Optimistic local state
    // would show the role as saved before the server had accepted it — the
    // success-toast-over-an-unchanged-database pattern this project keeps
    // hitting. buying_role is validated against contacts_buying_role_check
    // server-side, so a bad value is rejected rather than stored.
    await updateContactViaAPI(contactId, { buyingRole: role ?? '' });
    await loadContacts();
  };

  const handleDeleteAccount = async () => {
    if (!accountId) return;
    if (!window.confirm(`Delete "${account?.name}"? This cannot be undone.`)) return;
    try {
      await deleteAccount(accountId);
      navigate('/crm/accounts');
    } catch (e: any) {
      alert(`Could not delete this account: ${e?.message ?? 'unknown error'}`);
    }
  };

  // Accounts have no is_archived column (deals gained one in migration 018;
  // companies did not). Say so rather than claim it happened.
  const notBuilt = (what: string) => () => alert(`${what} is not available yet.`);

  // ── Render ────────────────────────────────────────────────────────────────

  if (accountsLoading && !account) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMNavigation />
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          <div className="h-32 bg-white rounded-lg border border-gray-200 animate-pulse" />
          <div className="h-24 bg-white rounded-lg border border-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (accountsError && !account) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMNavigation />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-900 font-medium">Could not load accounts</p>
          <p className="text-sm text-gray-600 mt-1">{accountsError}</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Account not found</p>
          <button onClick={() => navigate('/crm/accounts')} className="mt-4 text-blue-600 hover:text-blue-700">
            Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  const location = [account.billingAddress?.city, account.billingAddress?.state, account.billingAddress?.country]
    .filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/crm/accounts')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Accounts</span>
          </button>
        </div>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex items-start space-x-4 mb-4 md:mb-0 min-w-0">
              <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600">
                  {account.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-7 w-7 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{account.name}</span>
                </h1>
                {account.industry && <p className="text-gray-600 mt-1">{account.industry}</p>}

                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                  {location && (
                    <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{location}</span>
                  )}
                  {account.website && (
                    <a href={account.website} target="_blank" rel="noopener noreferrer"
                       className="flex items-center text-blue-600 hover:text-blue-700">
                      <Globe className="h-4 w-4 mr-1" />
                      {account.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {account.phone && (
                    <span className="flex items-center"><Phone className="h-4 w-4 mr-1" />{account.phone}</span>
                  )}
                </div>

                {/* companies stores a SIZE BAND ('201-500'), not a headcount.
                    The old hero read `{account.employeeCount || 0} employees`
                    and printed "0 employees" on every account, because
                    employeeCount has no column and accountsApi correctly
                    leaves it undefined. */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                  {account.accountSize && (
                    <span className="text-gray-700">
                      <Users className="h-4 w-4 inline mr-1" />{account.accountSize} employees
                    </span>
                  )}
                  {account.annualRevenue != null && (
                    <span className="text-gray-700">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      {formatMoney(account.annualRevenue)} annual revenue
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button onClick={() => navigate(`/crm/accounts/${accountId}/edit`)}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="Edit account">
                <Edit className="h-5 w-5 text-gray-600" />
              </button>
              <div className="relative">
                <button onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="More actions">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>
                {showActionsMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                      <button onClick={() => { navigate(`/crm/accounts/${accountId}/merge`); setShowActionsMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <GitMerge className="h-4 w-4" /> Merge account
                      </button>
                      {/* These three say plainly that nothing happened. They used
                          to alert "will be implemented with backend integration"
                          and navigate away as though the action had worked. */}
                      <button onClick={() => { notBuilt('Duplicating an account')(); setShowActionsMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50 flex items-center gap-2">
                        <Copy className="h-4 w-4" /> Duplicate
                      </button>
                      <button onClick={() => { notBuilt('Archiving accounts')(); setShowActionsMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50 flex items-center gap-2">
                        <Archive className="h-4 w-4" /> Archive
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button onClick={() => { handleDeleteAccount(); setShowActionsMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <Trash2 className="h-4 w-4" /> Delete account
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Metrics ───────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <EnhancedMetricsBar metrics={metrics} />
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-x-auto">
          <div className="flex border-b border-gray-200">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const count =
                tab.key === 'contacts'   ? contacts.length
                : tab.key === 'deals'      ? deals.length
                : tab.key === 'activities' ? activities.length
                : tab.key === 'docs'       ? documents.length
                : null;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabType)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    activeTab === tab.key
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {count !== null && (
                    <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-1.5">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Panels ────────────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {activeTab === 'overview' && (
            <>
              <CompanyInformationPanel
                legalName={account.name}
                industry={account.industry}
                annualRevenue={account.annualRevenue}
                headquarters={location || undefined}
                website={account.website}
                /* foundedYear="2015" and keyTechnologies={['Salesforce',
                   'HubSpot','Slack','AWS']} were passed here as literals. There
                   are no columns for either, and no enrichment provider. The
                   panel's remaining optional props (subIndustry, growthRate,
                   stockSymbol, fundingRound, totalFunding) are left unset for
                   the same reason. */
              />
              <AccountContactsSection
                contacts={contacts}
                loading={contactsLoading}
                error={contactsError}
                onSetBuyingRole={handleSetBuyingRole}
                onContactClick={(id) => navigate(`/crm/contacts/${id}`)}
                onAddContact={() => navigate(`/crm/contacts/new?accountId=${accountId}`)}
              />
              <AccountDeals
                deals={sectionDeals}
                loading={dealsLoading}
                error={dealsError}
                accountName={account.name}
                onDealClick={(id) => navigate(`/crm/deals/${id}`)}
                onAddDeal={() => navigate(`/crm/deals/create?accountId=${accountId}`)}
              />
            </>
          )}

          {activeTab === 'contacts' && (
            <AccountContactsSection
              contacts={contacts}
              loading={contactsLoading}
              error={contactsError}
              onSetBuyingRole={handleSetBuyingRole}
              onContactClick={(id) => navigate(`/crm/contacts/${id}`)}
              onAddContact={() => navigate(`/crm/contacts/new?accountId=${accountId}`)}
            />
          )}

          {activeTab === 'deals' && (
            <AccountDeals
              deals={sectionDeals}
              loading={dealsLoading}
              error={dealsError}
              accountName={account.name}
              onDealClick={(id) => navigate(`/crm/deals/${id}`)}
              onAddDeal={() => navigate(`/crm/deals/create?accountId=${accountId}`)}
            />
          )}

          {activeTab === 'activities' && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              {activitiesError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  Could not load activity for this account: {activitiesError}
                </div>
              ) : activitiesLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map(i => <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />)}
                </div>
              ) : timelineItems.length === 0 ? (
                <div className="text-center py-10">
                  <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No activity has been logged against this account.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Emails, calls, meetings and notes recorded against this
                    company appear here. Log them from the Activities page.
                  </p>
                </div>
              ) : (
                <RecentActivitiesTimeline
                  activities={timelineItems}
                  onActivityClick={(id) => navigate(`/crm/activities/${id}`)}
                  onViewAll={() => navigate(`/crm/activities?accountId=${accountId}`)}
                  maxItems={100}
                />
              )}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-indigo-600" />
                Documents
                {!documentsLoading && <span className="text-sm font-normal text-gray-400">{documents.length}</span>}
              </h2>
              {/* This tab rendered a storage quota bar ("24.5 MB / 100 MB"),
                  four category counts and a list of named PDFs, all as literal
                  markup, against a documents table holding zero rows. There is
                  no per-account storage quota in this product either. */}
              {documentsError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  Could not load documents: {documentsError}
                </div>
              ) : documentsLoading ? (
                <div className="space-y-3">
                  {[0, 1].map(i => <div key={i} className="h-14 bg-gray-50 rounded animate-pulse" />)}
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No documents are attached to this account.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Files uploaded against this company appear here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {documents.map(d => (
                    <li key={d.id} className="py-3 flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{d.name}</p>
                        <p className="text-xs text-gray-500">
                          {d.file_size ? `${(d.file_size / 1024 / 1024).toFixed(1)} MB` : 'Size unknown'}
                          {' · '}{formatDisplayDate(d.created_at)}
                          {d.owner_name ? ` · ${d.owner_name}` : ''}
                        </p>
                      </div>
                      {d.file_url && (
                        <a href={d.file_url} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                          <Download className="h-3 w-3" /> Download
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Related deals, with the empty state the new foreign key makes necessary.
 *
 * "No deals linked" is NOT "this account has no deals" — deals.company_id is
 * new and 22 of 25 deals carry no link, so the distinction has to be drawn or
 * the page reports a zero that reads as a fact about the business. This is the
 * same zero the page used to show for every account, when getAccountDeals()
 * filtered a permanently-empty sample array.
 */
const AccountDeals: React.FC<{
  deals: SectionDeal[];
  loading: boolean;
  error: string | null;
  accountName: string;
  onDealClick: (id: string) => void;
  onAddDeal: () => void;
}> = ({ deals, loading, error, accountName, onDealClick, onAddDeal }) => {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
        Could not load deals for this account: {error}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
        <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
        {[0, 1].map(i => <div key={i} className="h-16 bg-gray-50 rounded animate-pulse" />)}
      </div>
    );
  }
  if (deals.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-indigo-600" /> Deals
        </h2>
        <div className="text-center py-8">
          <DollarSign className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No deals are linked to {accountName}.</p>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            A deal is linked to an account by its company field. Deals that only
            record a company <em>name</em> as free text will not appear here
            until they are linked — most existing deals are in that state.
          </p>
          <button
            onClick={onAddDeal}
            className="mt-3 text-xs bg-indigo-600 text-white rounded px-3 py-1.5 hover:bg-indigo-700 font-medium"
          >
            Create a deal for this account
          </button>
        </div>
      </div>
    );
  }
  return <ActiveDealsSection deals={deals} onDealClick={onDealClick} onAddDeal={onAddDeal} />;
};

export default EnhancedAccountDetailView;
