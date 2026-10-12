import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Download, Upload, MoreVertical, Building2, Eye, Edit, Trash2, Users, DollarSign, Tag, Briefcase, X, UserCog, GitMerge } from 'lucide-react';
import { fetchAccountsPage, fetchAccountsSummary, deleteAccountViaAPI, type ListedAccount, type AccountsSummary } from '../../utils/accountsApi';
import { fetchIndustries } from '../../utils/industriesApi';
import { useToast } from '../../contexts/ToastContext';
import { EnhancedAccount } from '../../types/accounts';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { NotAvailableBadge } from '../../components/common/NotAvailable';

/** Accounts sort -> the server's allowlisted sort (slice 3b). */
const ACCOUNT_SORT = {
  name:    { sort: 'name', dir: 'asc' },
  recent:  { sort: 'updated_at', dir: 'desc' },
  created: { sort: 'created_at', dir: 'desc' },
} as const;

const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSources] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'created'>('name');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>('list');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  /*
   * SLICE 3b — ONE PAGE FROM THE SERVER. This page read AccountsContext, which
   * loads 200 accounts, 500 contacts and 500 deals once and joins them in the
   * browser; it then showed 3 at a time with a "Load More" over that capped set.
   * Now: GET /companies (search, ONE industry, sort, page) whose rows carry their
   * own contact and open-deal roll-ups, and GET /companies/summary for the tiles.
   */
  const PAGE = 25;
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<ListedAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [summary, setSummary] = useState<AccountsSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const industry = selectedIndustries[0];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    fetchAccountsPage({ search: debouncedSearch || undefined, industry, ...ACCOUNT_SORT[sortBy], limit: PAGE, offset: page * PAGE })
      .then(r => { if (!cancelled) { setRows(r.accounts); setTotal(r.total); setLoadState('ready'); setLoadError(null); } })
      .catch((e: Error) => { if (!cancelled) { setLoadState('error'); setLoadError(e.message); } });
    return () => { cancelled = true; };
  }, [debouncedSearch, industry, sortBy, page, reloadKey]);
  // A narrower query starts at page 1; a selection never spans pages.
  useEffect(() => { setPage(0); }, [debouncedSearch, industry, sortBy]);
  useEffect(() => { setSelectedAccountIds([]); }, [debouncedSearch, industry, sortBy, page]);

  useEffect(() => {
    let cancelled = false;
    fetchAccountsSummary()
      .then(sum => { if (!cancelled) { setSummary(sum); setSummaryError(null); } })
      .catch((e: Error) => { if (!cancelled) setSummaryError(e.message); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  // The workspace's real industry vocabulary (21 values, migration 045) — the
  // chips were six hardcoded names, three of which no account could hold.
  useEffect(() => { fetchIndustries().then(setIndustryOptions).catch(() => setIndustryOptions([])); }, []);

  /** "3 contacts" — the server's count for this account. */
  const contactCountLabel = (account: ListedAccount): string =>
    `${account.contactCount} contact${account.contactCount === 1 ? '' : 's'}`;

  /** Open deals linked to this account (deals.company_id), from the server. */
  const dealCountLabel = (account: ListedAccount): string =>
    account.openDealCount === 0 ? 'No open deals' : `${account.openDealCount} open`;

  const dealCountTitle = (account: ListedAccount): string => {
    if (account.openDealCount === 0) return 'No open deals are linked to this account';
    const usd = `$${Math.round(account.openDealValueUsd).toLocaleString()} in USD`;
    return account.openDealUnconverted > 0
      ? `${usd}, plus ${account.openDealUnconverted} deal${account.openDealUnconverted === 1 ? '' : 's'} whose amount is not known in USD`
      : usd;
  };

  const handleSearch = (term: string) => setSearchTerm(term);

  /** Select-all covers the rows ON THIS PAGE — the checkbox used to compare
   *  against the displayed rows but select every loaded row, hidden ones too. */
  const allOnPageSelected = rows.length > 0 && rows.every(r => selectedAccountIds.includes(r.id));
  const handleSelectAll = () => {
    setSelectedAccountIds(allOnPageSelected ? [] : rows.map(acc => acc.id));
  };

  const handleSelectAccount = (accountId: string) => {
    if (selectedAccountIds.includes(accountId)) {
      setSelectedAccountIds(selectedAccountIds.filter(id => id !== accountId));
    } else {
      setSelectedAccountIds([...selectedAccountIds, accountId]);
    }
  };

  const handleKPIClick = (type: string) => {
    switch (type) {
      case 'total':
        setSearchTerm(''); setSelectedIndustries([]);
        break;
      case 'deals':
        navigate('/crm/deals');
        break;
      case 'value':
        navigate('/crm/reports');
        break;
    }
  };

  const handleSortChange = (sortField: string) => {
    if (sortField === 'name' || sortField === 'recent' || sortField === 'created') setSortBy(sortField);
  };

  const handleCreateDeal = (account: EnhancedAccount) => {
    navigate('/crm/deals/create', { state: { accountId: account.id, accountName: account.name } });
  };



  const handleEditAccount = (account: EnhancedAccount) => {
    navigate(`/crm/accounts/${account.id}/edit`);
  };

  /** Real delete, with the server's answer shown — a 403 (sales) included. It
   *  had no error handling and no feedback either way. */
  const handleDeleteAccount = async (account: EnhancedAccount) => {
    if (!window.confirm(`Are you sure you want to delete "${account.name}"?`)) return;
    try {
      await deleteAccountViaAPI(account.id);
      addToast(`"${account.name}" deleted`, 'success');
      setReloadKey(k => k + 1);
    } catch (e) {
      addToast(`"${account.name}" was not deleted — ${(e as Error).message}`, 'error');
    }
  };

  const handleMergeAccount = (account: EnhancedAccount) => {
    navigate(`/crm/accounts/${account.id}/merge`);
  };

  const handleExportAccount = (account: EnhancedAccount) => {
    const data = JSON.stringify(account, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${account.name.replace(/\s+/g, '_')}_export.json`;
    a.click();
  };

  const handleBulkExport = () => {
    const selectedAccounts = rows.filter(acc => selectedAccountIds.includes(acc.id));
    const data = JSON.stringify(selectedAccounts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  /** Every selected account is attempted and each result counted — the loop
   *  stopped at the first failure as an unhandled rejection, silently leaving a
   *  partial delete. Success is reported only for what the server confirmed. */
  const handleBulkDelete = async () => {
    const ids = [...selectedAccountIds];
    if (!window.confirm(`Are you sure you want to delete ${ids.length} account(s)?`)) return;
    const results = await Promise.allSettled(ids.map(id => deleteAccountViaAPI(id)));
    const ok = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - ok;
    const firstError = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')?.reason as Error | undefined;
    if (failed === 0) addToast(`${ok} account${ok === 1 ? '' : 's'} deleted`, 'success');
    else addToast(`${ok} deleted, ${failed} not deleted${firstError ? ` — ${firstError.message}` : ''}`, ok > 0 ? 'warning' : 'error');
    setSelectedAccountIds([]);
    setReloadKey(k => k + 1);
  };

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-700'; // Dark green (Excellent)
    if (score >= 60) return 'text-green-500'; // Light green (Good)
    if (score >= 40) return 'text-yellow-600'; // Yellow (Needs Attention)
    return 'text-red-600'; // Red (At Risk)
  };

  const getHealthScoreLabel = (score?: number) => {
    if (!score) return 'N/A';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Attention';
    return 'At Risk';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'lead-gen': return '🎯';
      case 'manual': return '✍️';
      case 'partner': return '🤝';
      case 'website': return '🌐';
      case 'referral': return '👥';
      default: return '📋';
    }
  };

  const getSourceLabel = (source: string, details?: string) => {
    const labels = {
      'lead-gen': 'Lead Gen',
      'manual': 'Manual',
      'partner': 'Partner',
      'website': 'Website',
      'referral': 'Referral'
    };
    const label = labels[source as keyof typeof labels] || source;
    return details ? `${label} (${details})` : label;
  };



  const displayedAccounts = rows;

  return (
    <div>
      <CRMNavigation />
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center space-x-2 md:space-x-3">
            <Building2 className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            <span>Accounts</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
            Manage all your business accounts and organizations
          </p>
        </div>
        <div className="flex items-center space-x-2 md:space-x-3">
          <button
            onClick={() => navigate('/crm/accounts/import-export')}
            className="flex items-center px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Import</span>
          </button>
          <Button
            // Was setShowAddAccountForm(true) — a form nothing rendered, so the
            // button did nothing. The create page exists at /crm/accounts/new.
            onClick={() => navigate('/crm/accounts/new')}
            size="sm" className="md:px-4"
          >
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add Account</span>
          </Button>
        </div>
      </div>

      {/*
        THE PAGE USED TO RENDER NEITHER OF THESE. `AccountsContext` tracks
        `loading` and `error` and its own comment says the error exists to
        "distinguish broken from no accounts" — and this page destructured
        neither, so a failed load showed the previous figures, or zeros, with no
        indication at all.
      */}
      {loadState === 'error' && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4" role="alert">
          <p className="text-sm font-semibold text-red-900">Couldn't load accounts</p>
          <p className="mt-1 text-sm text-red-800">{loadError} — nothing below is from your data.</p>
          <button type="button" onClick={() => setReloadKey(k => k + 1)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100">
            Try again
          </button>
        </div>
      )}

      {/* KPI tiles — from GET /companies/summary (slice 3b), workspace-wide. They
          were summed in the browser from 200 accounts / 500 contacts / 500 deals. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4" data-testid="accounts-kpis">
        <div onClick={() => handleKPIClick('total')}
          className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary ? summary.accounts : '—'}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg"><Building2 className="h-5 w-5 text-blue-600" /></div>
          </div>
        </div>
        <div onClick={() => handleKPIClick('deals')}
          className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Open Deals on Accounts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary ? summary.open_deals_on_accounts : '—'}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {summary
                  ? (summary.open_deals_without_account > 0 ? `+ ${summary.open_deals_without_account} open with no account` : 'Every open deal has an account')
                  : (summaryError ?? 'Loading…')}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg"><Briefcase className="h-5 w-5 text-green-600" /></div>
          </div>
        </div>
        <div onClick={() => handleKPIClick('value')}
          className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Open Pipeline on Accounts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary ? `$${Math.round(summary.open_value_usd_on_accounts).toLocaleString()}` : '—'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {summary
                  ? (summary.open_unconverted_on_accounts > 0
                      ? `USD; + ${summary.open_unconverted_on_accounts} not in USD`
                      : 'USD, excludes closed deals')
                  : (summaryError ?? 'Loading…')}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg"><DollarSign className="h-5 w-5 text-purple-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Contacts on Accounts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary ? summary.contacts_on_accounts : '—'}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Linked to an account</p>
            </div>
            <div className="p-2 bg-teal-100 rounded-lg"><Users className="h-5 w-5 text-teal-600" /></div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 space-y-4">
        {/* Mobile: Collapsible Filters */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700"
        >
          <span>Filters {(selectedIndustries.length + selectedSources.length) > 0 && `(${selectedIndustries.length + selectedSources.length})`}</span>
          <Filter className="h-4 w-4" />
        </button>

        <div className={`space-y-3 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Industry:
              {/* ONE industry, filtered on the server, from the real vocabulary. */}
              <select value={industry ?? ''} aria-label="Industry"
                onChange={e => setSelectedIndustries(e.target.value ? [e.target.value] : [])}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg">
                <option value="">All</option>
                {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>
            {/* Size chips restyled without filtering; Source chips were sent as a
                status every account shares, so any choice hid every row. Neither
                can run on the server yet — "Coming soon". */}
            {['Size', 'Source'].map(label => (
              <span key={label} className="flex items-center gap-1.5 text-sm text-gray-400" aria-disabled="true" title={`${label} filter is coming soon`}>
                {label}: <NotAvailableBadge label="Soon" />
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by company name, domain..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="flex-1 md:flex-none px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {/* The sort was never applied. Name / Recent / Date added run on the
                  server; Value / Deals / Health need server sorts first. */}
              <option value="name">Sort: Name</option>
              <option value="recent">Sort: Recently updated</option>
              <option value="created">Sort: Date added</option>
              <option value="value" disabled>Value (coming soon)</option>
              <option value="deals" disabled>Deals (coming soon)</option>
              <option value="health" disabled>Health (coming soon)</option>
            </select>
            {/* These three used to set `viewMode` and nothing else: the value was
                read ONLY to style the buttons, never to choose a view, so the
                table rendered whatever you clicked. List and Grid now gate the
                render below.

                Kanban is disabled rather than left as a third dead button —
                there is no kanban view for accounts, and grouping them would need
                a decision about what the columns are (status? industry? owner?)
                that has not been made. */}
            <div className="hidden lg:flex items-center border border-gray-300 rounded-lg" role="group" aria-label="View mode">
              <button
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className={`px-3 py-2 text-sm border-l border-gray-300 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                ⊞ Grid
              </button>
              <button
                type="button"
                disabled
                title="There is no kanban view for accounts yet"
                className="px-3 py-2 text-sm border-l border-gray-300 text-gray-400 cursor-not-allowed flex items-center gap-1.5"
              >
                ≡ Kanban
                <NotAvailableBadge label="Soon" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedAccountIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <span className="text-sm font-medium text-blue-900">
              {selectedAccountIds.length} account{selectedAccountIds.length > 1 ? 's' : ''} selected on this page
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {/* Assign / Tag opened modals nothing rendered — "Coming soon". */}
              {[['Assign', UserCog], ['Tag', Tag]].map(([label, Icon]) => {
                const I = Icon as typeof Tag;
                return (
                  <button key={label as string} type="button" disabled title={`Bulk ${(label as string).toLowerCase()} is coming soon`}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed flex items-center gap-1">
                    <I className="h-4 w-4" /><span className="hidden sm:inline">{label as string}</span> <NotAvailableBadge label="Soon" />
                  </button>
                );
              })}
              <button
                onClick={handleBulkExport}
                className="px-3 py-1 text-sm border border-blue-300 rounded-lg hover:bg-blue-100 text-blue-700"
              >
                <Download className="h-4 w-4 inline mr-1" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm border border-red-300 rounded-lg hover:bg-red-100 text-red-700"
              >
                <Trash2 className="h-4 w-4 inline mr-1" />
                <span className="hidden sm:inline">Delete</span>
              </button>
              <button
                onClick={() => setSelectedAccountIds([])}
                className="px-3 py-1 text-sm text-blue-700 hover:text-blue-800 flex items-center border border-blue-300 rounded-lg hover:bg-blue-100"
              >
                <X className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Table - Desktop & Tablet. Hidden entirely in grid mode. */}
      <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${
        viewMode === 'list' ? 'hidden md:block' : 'hidden'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all accounts on this page"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Account</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">Industry</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden xl:table-cell">Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contacts</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Deals</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedAccounts.map((account) => (
                <React.Fragment key={account.id}>
                  <tr className="hover:bg-blue-50 hover:shadow-sm transition-all duration-150 cursor-pointer">
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.includes(account.id)}
                        onChange={() => handleSelectAccount(account.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => navigate(`/crm/accounts/${account.id}`)}
                                className="text-lg font-bold text-gray-900 hover:text-blue-600 text-left"
                              >
                                {account.name}
                              </button>
                            </div>
                            {account.website && (
                              <p className="text-sm text-blue-600 mt-0.5">{account.website.replace('https://', '').replace('http://', '')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="text-sm font-medium text-gray-900">{account.industry}</div>
                      {account.subIndustry && (
                        <div className="text-xs text-gray-600">{account.subIndustry}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell">
                      {/* Was `{account.employeeCount || 0} employees`, which
                          printed "0 employees" on every row: employeeCount has
                          no column, mapRowToAccount deliberately leaves it
                          undefined, and `|| 0` turned that honest absence into
                          a number. companies.size IS real and is what the size
                          filter above already uses. */}
                      <div className="text-sm text-gray-900">
                        {account.accountSize
                          ? `${account.accountSize} employees`
                          : <span className="text-gray-400">Not specified</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/crm/accounts/${account.id}#contacts`); }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {contactCountLabel(account)}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/crm/accounts/${account.id}#deals`); }}
                        title={dealCountTitle(account)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {dealCountLabel(account)}
                      </button>
                    </td>
                    <td className="px-4 py-4 relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === account.id ? null : account.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-500" />
                      </button>

                      {openMenuId === account.id && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => { navigate(`/crm/accounts/${account.id}`); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Account
                            </button>
                            <button
                              onClick={() => { handleEditAccount(account); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Account
                            </button>
                            <button
                              onClick={() => { handleDeleteAccount(account); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </button>
                            <button
                              onClick={() => { handleMergeAccount(account); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                              <GitMerge className="h-4 w-4 mr-2" />
                              Merge with Another
                            </button>
                            {/* These only closed the menu. Disabled and labelled until built. */}
                            <button type="button" disabled title="Adding a tag is coming soon"
                              className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center">
                              <Tag className="h-4 w-4 mr-2" />
                              Add Tag <NotAvailableBadge label="Soon" className="ml-auto" />
                            </button>
                            <button type="button" disabled title="Assigning an owner is coming soon"
                              className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center">
                              <UserCog className="h-4 w-4 mr-2" />
                              Assign Owner <NotAvailableBadge label="Soon" className="ml-auto" />
                            </button>
                            <button
                              onClick={() => { handleExportAccount(account); setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export Data
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* The expanded row (health score the API never returns, a fixed
                      "Opportunity: High-value target") was unreachable — nothing
                      called toggleRowExpansion — and fabricated. Removed (slice 3b). */}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {loadState === 'loading' && rows.length === 0 ? 'Loading accounts…'
              : total > 0 ? `Showing ${page * PAGE + 1}–${Math.min((page + 1) * PAGE, total)} of ${total} accounts`
              : loadState === 'ready' ? 'No accounts match' : ''}
          </div>
          {/* Server pages (slice 3b) — "Load More" showed 3 more of a capped 200. */}
          <div className="flex items-center gap-2" data-testid="accounts-pager">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loadState === 'loading'}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
            <span className="text-sm text-gray-600 tabular-nums">Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE))}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE >= total || loadState === 'loading'}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>

      {/* Card view. In list mode this is the mobile fallback (the table takes
          over at md and up). In grid mode it is THE view at every width, laid out
          in responsive columns — the markup was already a card, it just had no
          way to be chosen. */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
          : 'md:hidden space-y-4'
      }>
        {displayedAccounts.map((account) => (
          <div
            key={account.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >

            {/* Card Header */}
            <div className="p-4 space-y-3">
              {/* Account Name & Selection */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedAccountIds.includes(account.id)}
                    onChange={() => handleSelectAccount(account.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <button
                      onClick={() => navigate(`/crm/accounts/${account.id}`)}
                      className="text-lg font-bold text-gray-900 hover:text-blue-600 text-left"
                    >
                      {account.name}
                    </button>
                    {account.website && (
                      <p className="text-sm text-blue-600 mt-0.5">
                        {account.website.replace('https://', '').replace('http://', '')}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setOpenMenuId(openMenuId === account.id ? null : account.id)}
                  className="p-2 hover:bg-gray-100 rounded relative"
                >
                  <MoreVertical className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-600">Industry</p>
                  <p className="text-sm font-medium text-gray-900">{account.industry}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Employees</p>
                  <p className="text-sm font-medium text-gray-900">
                    {account.accountSize ?? <span className="text-gray-400">Not specified</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Contacts</p>
                  <button
                    onClick={() => navigate(`/crm/accounts/${account.id}#contacts`)}
                    className="text-sm font-bold text-blue-600"
                  >
                    {account.relatedContacts?.length ?? '—'}
                  </button>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Active Deals</p>
                  <button
                    onClick={() => navigate(`/crm/accounts/${account.id}#deals`)}
                    title={dealCountTitle(account)}
                    className="text-sm font-bold text-blue-600"
                  >
                    {dealCountLabel(account)}
                  </button>
                </div>
              </div>

              {/* Health Score & Source */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🤖</span>
                  <div>
                    <span className={`text-sm font-bold ${getHealthScoreColor(account.healthScore)}`}>
                      {account.healthScore || 0}/100
                    </span>
                    <p className="text-xs text-gray-600">{getHealthScoreLabel(account.healthScore)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span>{getSourceIcon(account.source)}</span>
                  <span className="text-xs text-gray-600">{getSourceLabel(account.source, account.sourceDetails)}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-2 pt-2">
                <Button
                  onClick={() => navigate(`/crm/accounts/${account.id}`)}
                  size="sm" fullWidth className="active:bg-blue-700"
                >
                  <Eye className="h-4 w-4 inline mr-1" />
                  View
                </Button>
                <button
                  onClick={() => handleCreateDeal(account)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg active:bg-gray-50"
                >
                  <Plus className="h-4 w-4 inline mr-1" />
                  Deal
                </button>
              </div>
            </div>

            {/* Action Menu Dropdown */}
            {openMenuId === account.id && (
              <div className="absolute right-4 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => { navigate(`/crm/accounts/${account.id}`); setOpenMenuId(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Account
                  </button>
                  <button
                    onClick={() => { handleEditAccount(account); setOpenMenuId(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Account
                  </button>
                  <button
                    onClick={() => { handleDeleteAccount(account); setOpenMenuId(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </button>
                  <button
                    onClick={() => { handleExportAccount(account); setOpenMenuId(null); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Mobile Pagination */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 text-center mb-3">
            {total > 0 ? `Showing ${page * PAGE + 1}–${Math.min((page + 1) * PAGE, total)} of ${total} accounts` : 'No accounts'}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} fullWidth variant="secondary">Previous</Button>
            <Button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE >= total} fullWidth>Next</Button>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
};

export default AccountsPage;
