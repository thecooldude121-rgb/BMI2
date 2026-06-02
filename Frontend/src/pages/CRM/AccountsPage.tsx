import React, { useState } from 'react';
import { formatDisplayDate } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Download, Upload, MoreVertical, Building2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Eye, Edit, Trash2, Users, DollarSign, Calendar, Tag, ExternalLink, Briefcase, Target, UserPlus, X, Copy, UserCog, FileText, GitMerge } from 'lucide-react';
import { useAccounts } from '../../contexts/AccountsContext';
import { EnhancedAccount } from '../../types/accounts';
import CRMNavigation from '../../components/CRM/CRMNavigation';

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
    deleteAccount
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
  const [showHRMSModal, setShowHRMSModal] = useState(false);
  const [selectedHRMSAccount, setSelectedHRMSAccount] = useState<EnhancedAccount | null>(null);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [displayCount, setDisplayCount] = useState(3);

  const kpis = getKPIs();

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
      case 'hrms':
        setSelectedSources(['hrms']);
        applyFilter({ status: ['hrms'] as any });
        break;
    }
  };

  const handleSortChange = (sortField: string) => {
    setSortBy(sortField);
  };

  const handleViewHRMSHistory = (account: EnhancedAccount) => {
    setSelectedHRMSAccount(account);
    setShowHRMSModal(true);
  };

  const handleAddToHRMSTarget = (account: EnhancedAccount) => {
    alert(`Account "${account.name}" added to HRMS recruitment target list!\n\nA task has been created for the HR team.`);
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
      case 'hrms': return '🏢';
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
      'hrms': 'HRMS',
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
  const sources = ['lead-gen', 'hrms', 'manual', 'partner', 'website'];

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
          <button
            onClick={() => setShowAddAccountForm(true)}
            className="flex items-center px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add Account</span>
          </button>
        </div>
      </div>

      {/* Stats Bar - 6 KPI Cards */}
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
              <p className="text-xs text-gray-600">Active Deals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.totalDeals}</p>
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
              <p className="text-xs text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${(kpis.totalRevenue / 1000000).toFixed(1)}M</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Active Deals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">23</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Target className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => handleKPIClick('hrms')}
          className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">From HRMS</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.hrmsAccounts}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserPlus className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.totalContacts}</p>
            </div>
            <div className="p-2 bg-teal-100 rounded-lg">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
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
            <div className="hidden lg:flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm border-l border-gray-300 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                ⊞ Grid
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 text-sm border-l border-gray-300 ${viewMode === 'kanban' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              >
                ≡ Kanban
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

      {/* Accounts Table - Desktop & Tablet */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hidden md:block">
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
                              {account.hrmsConnection?.hasConnection && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded border border-orange-300">🏢 HRMS</span>
                              )}
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
                      <div className="text-sm text-gray-900">{account.employeeCount || 0} employees</div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/crm/accounts/${account.id}#contacts`); }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {account.relatedContacts?.length || 0} contact{(account.relatedContacts?.length || 0) !== 1 ? 's' : ''}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/crm/accounts/${account.id}#deals`); }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {account.relatedDeals?.length || 0} active
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

                          {/* HRMS Connection Highlight */}
                          {account.hrmsConnection?.hasConnection && (
                            <div
                              onClick={() => handleViewHRMSHistory(account)}
                              className="bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50 border-2 border-orange-400 rounded-lg p-5 cursor-pointer hover:shadow-lg hover:border-orange-500 transition-all duration-200 hover:scale-[1.01] animate-pulse-slow"
                              style={{ backgroundColor: '#fff3cd' }}
                            >
                              <div className="flex items-start space-x-4">
                                <div className="text-3xl animate-bounce-slow">🏢</div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="text-base font-bold text-orange-900">
                                      HRMS CONNECTION
                                    </h4>
                                    <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded">UNIQUE</span>
                                  </div>
                                  <p className="text-sm font-bold text-orange-800 mb-1">
                                    ✨ Recruited: {account.hrmsConnection.recruitedContacts?.map(c => `${c.name} (${c.position})`).join(', ')}
                                  </p>
                                  {account.hrmsConnection.recruitedEmployees && account.hrmsConnection.recruitedEmployees > 1 && (
                                    <p className="text-sm font-semibold text-orange-700 mt-1">
                                      🔗 Existing relationship advantage - {account.hrmsConnection.recruitedEmployees} employees recruited
                                    </p>
                                  )}
                                  <p className="text-sm font-bold text-orange-800 mt-2">
                                    💡 Warm intro opportunity!
                                  </p>
                                  <p className="text-xs text-orange-700 mt-2 italic font-medium">
                                    Click to view full HRMS history →
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

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
                            <button
                              onClick={() => handleCreateDeal(account)}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Plus className="h-4 w-4 inline mr-1" />
                              Create Deal
                            </button>
                            <button
                              onClick={() => handleAddContact(account)}
                              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              <UserPlus className="h-4 w-4 inline mr-1" />
                              Add Contact
                            </button>
                            {account.hrmsConnection?.hasConnection && (
                              <button
                                onClick={() => handleViewHRMSHistory(account)}
                                className="px-4 py-2 text-sm bg-orange-100 text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-200"
                              >
                                <FileText className="h-4 w-4 inline mr-1" />
                                View HRMS History
                              </button>
                            )}
                            {!account.hrmsConnection?.hasConnection && account.source !== 'hrms' && (
                              <button
                                onClick={() => handleAddToHRMSTarget(account)}
                                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                <UserPlus className="h-4 w-4 inline mr-1" />
                                Add to HRMS Target List
                              </button>
                            )}
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {displayedAccounts.map((account) => (
          <div
            key={account.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* HRMS Connection Banner - Top Priority on Mobile */}
            {account.hrmsConnection?.hasConnection && (
              <div
                onClick={() => handleViewHRMSHistory(account)}
                className="bg-gradient-to-r from-orange-400 to-yellow-400 p-3 cursor-pointer active:opacity-80"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🏢</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">HRMS CONNECTION - UNIQUE!</p>
                    <p className="text-xs text-white">Warm intro opportunity - Tap for details</p>
                  </div>
                  <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">UNIQUE</span>
                </div>
              </div>
            )}

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
                  <p className="text-sm font-medium text-gray-900">{account.employeeCount || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Contacts</p>
                  <button
                    onClick={() => navigate(`/crm/accounts/${account.id}#contacts`)}
                    className="text-sm font-bold text-blue-600"
                  >
                    {account.relatedContacts?.length || 0}
                  </button>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Active Deals</p>
                  <button
                    onClick={() => navigate(`/crm/accounts/${account.id}#deals`)}
                    className="text-sm font-bold text-blue-600"
                  >
                    {account.relatedDeals?.length || 0}
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
                <button
                  onClick={() => navigate(`/crm/accounts/${account.id}`)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg active:bg-blue-700"
                >
                  <Eye className="h-4 w-4 inline mr-1" />
                  View
                </button>
                <button
                  onClick={() => handleCreateDeal(account)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg active:bg-gray-50"
                >
                  <Plus className="h-4 w-4 inline mr-1" />
                  Deal
                </button>
                {account.hrmsConnection?.hasConnection && (
                  <button
                    onClick={() => handleViewHRMSHistory(account)}
                    className="px-3 py-2 text-sm bg-orange-100 text-orange-700 border border-orange-300 rounded-lg active:bg-orange-200"
                  >
                    🏢
                  </button>
                )}
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
            <button
              onClick={handleLoadMore}
              className="w-full px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              Load More...
            </button>
          )}
        </div>
      </div>

      {/* HRMS History Modal */}
      {showHRMSModal && selectedHRMSAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Building2 className="h-6 w-6 mr-2 text-orange-600" />
                HRMS Connection History
              </h2>
              <button
                onClick={() => setShowHRMSModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedHRMSAccount.name}</h3>
                <p className="text-sm text-gray-600">{selectedHRMSAccount.website}</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-3">Recruited Employees</h4>
                <div className="space-y-3">
                  {selectedHRMSAccount.hrmsConnection?.recruitedContacts?.map((contact, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        <p className="text-sm text-gray-600">{contact.position}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        Recruited: {new Date(contact.dateRecruited).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Recruited</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedHRMSAccount.hrmsConnection?.recruitedEmployees || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Last Recruitment</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedHRMSAccount.hrmsConnection?.lastRecruitmentDate
                      ? new Date(selectedHRMSAccount.hrmsConnection.lastRecruitmentDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Cross-Sell Opportunities</h4>
                <p className="text-sm text-green-800">
                  ✨ Strong existing relationship through {selectedHRMSAccount.hrmsConnection?.recruitedEmployees || 0} recruited employee(s)
                </p>
                <p className="text-sm text-green-700 mt-1">
                  💡 High probability of warm introductions and referrals
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowHRMSModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigate(`/crm/accounts/${selectedHRMSAccount.id}`);
                  setShowHRMSModal(false);
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Full Account
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AccountsPage;
