import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { formatDisplayDate } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Download, Upload, MoreVertical, Building2, AlertTriangle, Eye, Edit, Trash2, Users, DollarSign, Tag, Briefcase, Target, UserPlus, X, UserCog, GitMerge } from 'lucide-react';
import { useAccounts } from '../../contexts/AccountsContext';
import { EnhancedAccount } from '../../types/accounts';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { NotAvailableBadge } from '../../components/common/NotAvailable';

const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    filteredAccounts,
    currentView,
    views,
    applyFilter,
    applyView,
    setSelectedAccountIds,
    selectedAccountIds,
    executeBulkAction,
    getKPIs,
    deleteAccount,
    dealStats,
    loading,
    refreshing,
    lastLoadedAt,
    error,
    refreshAccounts,
  } = useAccounts();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>('list');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [displayCount, setDisplayCount] = useState(3);

  /**
   * REVALIDATE ON MOUNT, and this is the engineering call worth recording.
   *
   * The audit measured ZERO requests when navigating to this page, while every
   * other CRM page fired 2-14. That is not a cache: `AccountsProvider` wraps the
   * whole of CRMModule, so its one `refreshAccounts()` runs when the CRM module
   * mounts and never again for the life of the session. Navigating in from Deals
   * at 17:00 therefore rendered figures fetched at 09:00 — "Total Accounts 15 /
   * Open Deals 24 / Open Pipeline $1.6M" whose only claim to being current was
   * that nothing said otherwise.
   *
   * A timestamp alone would have been an admission with no remedy: "these are
   * eight hours old" and no way to act on it but a full page reload. So the page
   * asks again on mount AND says when the data is from.
   *
   * Stale-while-revalidate, not a blocking refetch — the context sets
   * `refreshing` rather than `loading` once a load has succeeded, so an existing
   * table is never blanked on a revisit. A failed revalidation leaves the old
   * timestamp standing, because the data on screen really is from then.
   */
  useEffect(() => { void refreshAccounts(); }, [refreshAccounts]);

  const kpis = getKPIs();

  /**
   * Contact count for a row. `undefined` means the join has not resolved (still
   * loading, or /contacts failed) and must NOT print as 0 — the previous code
   * was `relatedContacts?.length || 0`, which collapsed "unknown" into "none".
   */
  const contactCountLabel = (account: EnhancedAccount): string => {
    const n = account.relatedContacts?.length;
    if (n === undefined) return '—';
    return `${n} contact${n === 1 ? '' : 's'}`;
  };

  /**
   * Deal count for a row, and why an empty result is shown as "—" not "0".
   *
   * `deals` has no account_id — only a free-text company_name — so a deal is
   * matched to an account by name. Of 25 deals, 10 carry a name and 1 matches an
   * account exactly. Printing "0 active" on the other 16 would assert those
   * accounts have no deals, which is not something the data supports; "—" says
   * we do not know. A real count is shown wherever a match exists.
   */
  const dealCountLabel = (account: EnhancedAccount): string => {
    const n = account.relatedDeals?.length;
    if (n === undefined || n === 0) return '—';
    return `${n} active`;
  };

  const dealCountTitle = (account: EnhancedAccount): string => {
    const n = account.relatedDeals?.length;
    if (n === undefined) return 'Deals could not be loaded';
    if (n === 0) return 'No deals could be matched to this account. Deals record a company name rather than a link to an account, so a deal naming this company differently will not appear here.';
    return `${n} open deal${n === 1 ? '' : 's'} matched by company name`;
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilter({ search: term });
  };

  const handleFilterChange = () => {
    applyFilter({
      search: searchTerm,
      industry: selectedIndustries.length > 0 ? selectedIndustries : undefined,
      status: selectedSources.length > 0 ? selectedSources as any : undefined
    });
  };

  const handleSelectAll = () => {
    if (selectedAccountIds.length === filteredAccounts.length) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(filteredAccounts.map(acc => acc.id));
    }
  };

  const handleSelectAccount = (accountId: string) => {
    if (selectedAccountIds.includes(accountId)) {
      setSelectedAccountIds(selectedAccountIds.filter(id => id !== accountId));
    } else {
      setSelectedAccountIds([...selectedAccountIds, accountId]);
    }
  };

  const toggleRowExpansion = (accountId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedRows(newExpanded);
  };

  const handleKPIClick = (type: string) => {
    switch (type) {
      case 'total':
        applyFilter({});
        break;
      case 'deals':
        navigate('/crm/deals');
        break;
      case 'value':
        navigate('/analytics');
        break;
    }
  };

  const handleSortChange = (sortField: string) => {
    setSortBy(sortField);
  };

  const handleCreateDeal = (account: EnhancedAccount) => {
    navigate('/crm/deals/create', { state: { accountId: account.id, accountName: account.name } });
  };

  const handleAddContact = (account: EnhancedAccount) => {
    navigate('/crm/contacts/new', { state: { accountId: account.id, accountName: account.name } });
  };

  const handleEditAccount = (account: EnhancedAccount) => {
    navigate(`/crm/accounts/${account.id}/edit`);
  };

  const handleDeleteAccount = async (account: EnhancedAccount) => {
    if (window.confirm(`Are you sure you want to delete "${account.name}"?`)) {
      await deleteAccount(account.id);
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
    const selectedAccounts = filteredAccounts.filter(acc => selectedAccountIds.includes(acc.id));
    const data = JSON.stringify(selectedAccounts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedAccountIds.length} account(s)?`)) {
      for (const id of selectedAccountIds) {
        await deleteAccount(id);
      }
      setSelectedAccountIds([]);
    }
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 3);
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

  const formatRevenue = (revenue?: number) => {
    if (!revenue) return 'N/A';
    if (revenue >= 1000000) return `$${(revenue / 1000000).toFixed(1)}M`;
    if (revenue >= 1000) return `$${(revenue / 1000).toFixed(0)}K`;
    return `$${revenue}`;
  };

  const industries = ['SaaS', 'FinTech', 'Manufacturing', 'Healthcare', 'E-commerce', 'Retail'];
  const sizes = ['1-10', '11-50', '51-200', '201-500', '500+'];
  const sources = ['lead-gen', 'manual', 'partner', 'website'];

  const displayedAccounts = filteredAccounts.slice(0, displayCount);

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
            onClick={() => setShowAddAccountForm(true)}
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
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4" role="alert">
          <p className="text-sm font-semibold text-red-900">Couldn't load accounts</p>
          <p className="mt-1 text-sm text-red-800">
            {error}{' '}
            {lastLoadedAt
              ? 'The figures below are from the last successful load and may be out of date.'
              : 'Nothing below was loaded from your data.'}
          </p>
          <button
            type="button"
            onClick={() => { void refreshAccounts(); }}
            disabled={refreshing}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
          >
            {refreshing ? 'Retrying…' : 'Try again'}
          </button>
        </div>
      )}

      {/* When the figures are from, stated rather than implied. Only ever shows a
          timestamp a successful load actually set. */}
      {!error && lastLoadedAt && (
        <p className="text-xs text-gray-500">
          {refreshing
            ? 'Refreshing…'
            : `Showing data loaded at ${new Date(lastLoadedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}
        </p>
      )}

      {/* Stats Bar - 6 KPI Cards. Hidden on the very first load, where there are
          no figures yet and zeros would be a claim rather than a count. */}
      {loading && !lastLoadedAt ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
          Loading accounts…
        </div>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <div
          onClick={() => handleKPIClick('total')}
          className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.totalAccounts}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => handleKPIClick('deals')}
          className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Open Deals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dealStats ? kpis.totalDeals : '—'}
              </p>
              {/* Says "across all accounts" because deals carry no account_id
                  and cannot be attributed to one — see dealStats. Without this
                  the number reads as "deals belonging to these accounts". */}
              <p className="text-[11px] text-gray-500 mt-0.5">
                {dealStats ? 'Across all accounts' : 'Could not load deals'}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Briefcase className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => handleKPIClick('value')}
          className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Open Pipeline</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dealStats ? `$${(kpis.totalRevenue / 1_000_000).toFixed(2)}M` : '—'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {dealStats ? 'Excludes closed deals' : 'Could not load deals'}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        {/* A second "Active Deals" card lived here with the literal value 23,
            beside the derived one above that read 0. It had no click handler and
            no data source; its agreement with today's open-deal count was
            coincidence. Removed — one card, one number, from the API. */}

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.totalContacts}</p>
              {/* Real: contacts.company_id is a foreign key, so this IS per-account. */}
              <p className="text-[11px] text-gray-500 mt-0.5">Linked to these accounts</p>
            </div>
            <div className="p-2 bg-teal-100 rounded-lg">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
          </div>
        </div>
      </div>
      )}

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
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 w-full md:w-20">Industry:</span>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              All ▼
            </button>
            {industries.map(industry => (
              <button
                key={industry}
                onClick={() => {
                  const newSelected = selectedIndustries.includes(industry)
                    ? selectedIndustries.filter(i => i !== industry)
                    : [...selectedIndustries, industry];
                  setSelectedIndustries(newSelected);
                  handleFilterChange();
                }}
                className={`px-3 py-1 text-sm rounded-lg border ${
                  selectedIndustries.includes(industry)
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {industry}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 w-full md:w-20">Size:</span>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              All ▼
            </button>
            {sizes.map(size => (
              <button
                key={size}
                onClick={() => {
                  const newSelected = selectedSizes.includes(size)
                    ? selectedSizes.filter(s => s !== size)
                    : [...selectedSizes, size];
                  setSelectedSizes(newSelected);
                }}
                className={`px-3 py-1 text-sm rounded-lg border ${
                  selectedSizes.includes(size)
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 w-full md:w-20">Source:</span>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              All ▼
            </button>
            {sources.map(source => (
              <button
                key={source}
                onClick={() => {
                  const newSelected = selectedSources.includes(source)
                    ? selectedSources.filter(s => s !== source)
                    : [...selectedSources, source];
                  setSelectedSources(newSelected);
                  handleFilterChange();
                }}
                className={`px-3 py-1 text-sm rounded-lg border capitalize ${
                  selectedSources.includes(source)
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getSourceIcon(source)} {source.replace('-', ' ')}
              </button>
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
              <option value="name">Sort: Name</option>
              <option value="value">Value</option>
              <option value="deals">Deals</option>
              <option value="health">Health</option>
              <option value="recent">Recent</option>
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
              {selectedAccountIds.length} account{selectedAccountIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowBulkAssignModal(true)}
                className="px-3 py-1 text-sm border border-blue-300 rounded-lg hover:bg-blue-100 text-blue-700"
              >
                <UserCog className="h-4 w-4 inline mr-1" />
                <span className="hidden sm:inline">Assign</span>
              </button>
              <button
                onClick={() => setShowBulkTagModal(true)}
                className="px-3 py-1 text-sm border border-blue-300 rounded-lg hover:bg-blue-100 text-blue-700"
              >
                <Tag className="h-4 w-4 inline mr-1" />
                <span className="hidden sm:inline">Tag</span>
              </button>
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
                    checked={selectedAccountIds.length === displayedAccounts.length && displayedAccounts.length > 0}
                    onChange={handleSelectAll}
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
                            <button
                              onClick={() => { setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                              <Tag className="h-4 w-4 mr-2" />
                              Add Tag
                            </button>
                            <button
                              onClick={() => { setOpenMenuId(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                              <UserCog className="h-4 w-4 mr-2" />
                              Assign Owner
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

                  {/* Expanded Row Content */}
                  {expandedRows.has(account.id) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 bg-gray-50">
                        <div className="space-y-4 max-w-6xl">
                          {/* Location & Revenue */}
                          <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center space-x-2">
                              <span>📍</span>
                              <span className="text-gray-700">
                                {account.billingAddress.city}, {account.billingAddress.state}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span>💰</span>
                              <span className="text-gray-700">
                                Revenue: {formatRevenue(account.annualRevenue)}/year
                                {account.annualRevenue ? '' : ' (estimated)'}
                              </span>
                            </div>
                            {account.stockSymbol && (
                              <div className="flex items-center space-x-2">
                                <span>📊</span>
                                <span className="text-gray-700">Public Company ({account.stockSymbol})</span>
                              </div>
                            )}
                            {account.customFields?.growth_rate && (
                              <div className="flex items-center space-x-2">
                                <span>🚀</span>
                                <span className="text-gray-700">Growth: {account.customFields.growth_rate}</span>
                              </div>
                            )}
                          </div>

                          {/* Active Deals */}
                          {account.relatedDeals && account.relatedDeals.length > 0 ? (
                            <div className="space-y-2 bg-white rounded-lg p-3 border border-gray-200">
                              {account.relatedDeals.length === 1 ? (
                                <div className="text-sm">
                                  <span className="font-semibold text-gray-900">Active Deal: </span>
                                  <button
                                    onClick={() => navigate(`/crm/deals/${account.relatedDeals![0].id}`)}
                                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                  >
                                    {account.relatedDeals[0].name} ({formatRevenue(account.relatedDeals[0].amount)})
                                  </button>
                                  <div className="text-xs text-gray-600 mt-1">
                                    Stage: {account.relatedDeals[0].stage} | Close: {formatDisplayDate(account.relatedDeals[0].closeDate)}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-gray-900">Active Deals:</p>
                                  {account.relatedDeals.map((deal, idx) => (
                                    <div key={idx} className="text-sm text-gray-700 ml-2">
                                      • <button
                                        onClick={() => navigate(`/crm/deals/${deal.id}`)}
                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                      >
                                        {deal.name}
                                      </button> ({formatRevenue(deal.amount)}) - {deal.stage}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="text-orange-700">⚠️ No active deals</span>
                              <span className="text-gray-600">💡 Opportunity: High-value target</span>
                            </div>
                          )}

                          {/* Contacts */}
                          {account.relatedContacts && account.relatedContacts.length > 0 && (
                            <div className="text-sm bg-white rounded-lg p-3 border border-gray-200">
                              <span className="font-semibold text-gray-900">Contacts: </span>
                              <span className="text-gray-700">
                                {account.relatedContacts.slice(0, 3).map((c, idx) => (
                                  <span key={idx}>
                                    <button
                                      onClick={() => navigate(`/crm/contacts/${c.id}`)}
                                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                    >
                                      {c.name}
                                    </button> <span className="text-xs text-gray-600">({c.role})</span>
                                    {idx < Math.min(2, account.relatedContacts!.length - 1) ? ', ' : ''}
                                  </span>
                                ))}
                                {account.relatedContacts.length > 3 && (
                                  <button
                                    onClick={() => navigate(`/crm/accounts/${account.id}`)}
                                    className="text-blue-600 hover:text-blue-800 hover:underline ml-1 font-medium"
                                  >
                                    +{account.relatedContacts.length - 3} more
                                  </button>
                                )}
                              </span>
                            </div>
                          )}

                          {/* Source & Health Score */}
                          <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                              <span className="text-xl">{getSourceIcon(account.source)}</span>
                              <span className="text-gray-900 font-medium">
                                Source: {getSourceLabel(account.source, account.sourceDetails)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                              <span className="text-lg">🤖</span>
                              <div>
                                <span className={`font-bold text-base ${getHealthScoreColor(account.healthScore)}`}>
                                  {account.healthScore || 0}/100
                                </span>
                                <span className={`text-xs font-semibold ml-2 ${getHealthScoreColor(account.healthScore)}`}>
                                  ({getHealthScoreLabel(account.healthScore)})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2 pt-2">
                            <button
                              onClick={() => navigate(`/crm/accounts/${account.id}`)}
                              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4 inline mr-1" />
                              View
                            </button>
                            <Button
                              onClick={() => handleCreateDeal(account)}
                            >
                              <Plus className="h-4 w-4 inline mr-1" />
                              Create Deal
                            </Button>
                            <button
                              onClick={() => handleAddContact(account)}
                              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              <UserPlus className="h-4 w-4 inline mr-1" />
                              Add Contact
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {Math.min(displayCount, filteredAccounts.length)} of {filteredAccounts.length} accounts
          </div>
          {displayCount < filteredAccounts.length && (
            <button
              onClick={handleLoadMore}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg"
            >
              Load More...
            </button>
          )}
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
            Showing {Math.min(displayCount, filteredAccounts.length)} of {filteredAccounts.length} accounts
          </div>
          {displayCount < filteredAccounts.length && (
            <Button
              onClick={handleLoadMore}
              fullWidth
            >
              Load More...
            </Button>
          )}
        </div>
      </div>

      </div>
    </div>
  );
};

export default AccountsPage;
