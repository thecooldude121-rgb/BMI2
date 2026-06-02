import React, { useState, useRef, useEffect } from 'react';
import { formatDisplayDate, daysFromNow, daysFromNowLabel } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Download, Settings, BarChart3, ChevronDown, ChevronUp, ArrowUp, ArrowDown,
  Building2, User, Calendar, Sparkles, Mail, Phone, Eye, MoreHorizontal, Plus,
  CheckCircle2, AlertTriangle, TrendingUp, Clock, Target, Zap, X, Check, Edit, Copy, Trash2
} from 'lucide-react';

interface Deal {
  id: string;
  companyName: string;
  dealName: string;
  accountName: string;
  amount: number;
  closeDate: string;
  stage: string;
  aiScore: number;
  contactName: string;
  contactTitle: string;
  owner: string;
  lastActivity: string;
  daysSinceContact: number;
  isHRMS: boolean;
  priority: 'high' | 'medium' | 'low';
  health: 'excellent' | 'healthy' | 'at-risk' | 'critical';
  source: string;
  status?: string;
  hrmsDetails?: string;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  deals: Deal[];
}

interface DealsListViewProps {
  stages: PipelineStage[];
  onDealClick: (dealId: string) => void;
  onStageChange?: (dealId: string, newStage: string) => void;
}

const DealsListView: React.FC<DealsListViewProps> = ({ stages, onDealClick, onStageChange }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [selectedCloseDate, setSelectedCloseDate] = useState<string>('all');
  const [selectedValue, setSelectedValue] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deal' | 'value' | 'stage' | 'closeDate' | 'health'>('closeDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [hoveredScore, setHoveredScore] = useState<string | null>(null);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [contextMenuDeal, setContextMenuDeal] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showStageModal, setShowStageModal] = useState<string | null>(null);
  const [showActionDropdown, setShowActionDropdown] = useState<string | null>(null);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState<Deal | null>(null);
  const [showCallModal, setShowCallModal] = useState<Deal | null>(null);
  const [showHRMSModal, setShowHRMSModal] = useState<Deal | null>(null);

  const allDeals: Deal[] = stages.flatMap(stage => stage.deals.map(deal => ({ ...deal, stage: stage.id })));

  const filteredDeals = allDeals.filter(deal => {
    const matchesSearch = searchTerm === '' ||
      deal.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contactName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = selectedStage === 'all' || deal.stage === selectedStage;
    const matchesOwner = selectedOwner === 'all' || deal.owner === selectedOwner;

    const matchesCloseDate = selectedCloseDate === 'all' ||
      (selectedCloseDate === 'week' && isWithinWeek(deal.closeDate)) ||
      (selectedCloseDate === 'month' && isWithinMonth(deal.closeDate)) ||
      (selectedCloseDate === 'quarter' && isWithinQuarter(deal.closeDate));

    const matchesValue = selectedValue === 'all' ||
      (selectedValue === '0-25k' && deal.amount < 25000) ||
      (selectedValue === '25-50k' && deal.amount >= 25000 && deal.amount < 50000) ||
      (selectedValue === '50-100k' && deal.amount >= 50000 && deal.amount < 100000) ||
      (selectedValue === '100k+' && deal.amount >= 100000);

    const matchesSource = selectedSource === 'all' || deal.source.includes(selectedSource);

    return matchesSearch && matchesStage && matchesOwner && matchesCloseDate && matchesValue && matchesSource;
  });

  const sortedDeals = [...filteredDeals].sort((a, b) => {
    let comparison = 0;
    switch(sortBy) {
      case 'deal':
        comparison = a.companyName.localeCompare(b.companyName);
        break;
      case 'value':
        comparison = a.amount - b.amount;
        break;
      case 'stage':
        const stageOrder = ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
        comparison = stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
        break;
      case 'closeDate':
        comparison = new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
        break;
      case 'health':
        comparison = a.aiScore - b.aiScore;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const isWithinWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return date >= today && date <= weekFromNow;
  };

  const isWithinMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return date >= today && date <= monthFromNow;
  };

  const isWithinQuarter = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const quarterFromNow = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    return date >= today && date <= quarterFromNow;
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  const formatDate = formatDisplayDate;
  const getDaysAway = daysFromNow;

  const getStageColor = (stageId: string) => {
    switch(stageId) {
      case 'prospecting': return { bg: '#2196F3', text: '#ffffff' };
      case 'qualified': return { bg: '#4CAF50', text: '#ffffff' };
      case 'proposal': return { bg: '#FF9800', text: '#ffffff' };
      case 'negotiation': return { bg: '#9C27B0', text: '#ffffff' };
      case 'closed-won': return { bg: '#2E7D32', text: '#ffffff' };
      case 'closed-lost': return { bg: '#D32F2F', text: '#ffffff' };
      default: return { bg: '#757575', text: '#ffffff' };
    }
  };

  const getStageName = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    return stage ? stage.name : stageId;
  };

  const getStageProgress = (stageId: string) => {
    const stageOrder = ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
    const currentIndex = stageOrder.indexOf(stageId);
    return `${currentIndex + 1} of ${stageOrder.length}`;
  };

  const getHealthText = (health: string) => {
    switch(health) {
      case 'excellent': return 'Excellent';
      case 'healthy': return 'Good';
      case 'at-risk': return 'Very Good';
      case 'critical': return 'Fair';
      default: return health;
    }
  };

  const getHealthStars = (aiScore: number) => {
    if (aiScore >= 90) return '⭐⭐⭐⭐⭐';
    if (aiScore >= 80) return '⭐⭐⭐⭐';
    if (aiScore >= 70) return '⭐⭐⭐';
    if (aiScore >= 60) return '⭐⭐';
    return '⭐';
  };

  const toggleRowExpansion = (dealId: string) => {
    setExpandedRows(prev =>
      prev.includes(dealId) ? prev.filter(id => id !== dealId) : [...prev, dealId]
    );
  };

  const toggleDealSelection = (dealId: string) => {
    setSelectedDeals(prev =>
      prev.includes(dealId) ? prev.filter(id => id !== dealId) : [...prev, dealId]
    );
  };

  const selectAllDeals = () => {
    if (selectedDeals.length === sortedDeals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(sortedDeals.map(d => d.id));
    }
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, dealId: string) => {
    e.preventDefault();
    setContextMenuDeal(dealId);
    setContextMenuPosition({ x: e.pageX, y: e.pageY });
  };

  const handleStageChange = (dealId: string, newStage: string) => {
    if (onStageChange) {
      onStageChange(dealId, newStage);
    }
    setShowStageModal(null);
  };

  const handleBulkDelete = () => {
    console.log('Deleting deals:', selectedDeals);
    setSelectedDeals([]);
    setShowDeleteModal(false);
  };

  useEffect(() => {
    setShowBulkActions(selectedDeals.length > 0);
  }, [selectedDeals]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenuDeal(null);
      setShowActionDropdown(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const totalValue = sortedDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const avgWinRate = 67;
  const closingThisWeek = sortedDeals.filter(d => isWithinWeek(d.closeDate)).length;
  const stalledDeals = sortedDeals.filter(d => d.daysSinceContact >= 5).length;
  const avgDaysCycle = 45;

  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="grid grid-cols-6 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-3xl font-bold text-blue-900">{sortedDeals.length}</div>
            <div className="text-sm text-blue-700 font-medium mt-1">Total Deals</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-3xl font-bold text-green-900">{formatCurrency(totalValue)}</div>
            <div className="text-sm text-green-700 font-medium mt-1">Total Value</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="text-3xl font-bold text-purple-900">{avgWinRate}%</div>
            <div className="text-sm text-purple-700 font-medium mt-1">Avg Win Rate</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="text-3xl font-bold text-orange-900">{closingThisWeek}</div>
            <div className="text-sm text-orange-700 font-medium mt-1">Closing This Week</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="text-3xl font-bold text-red-900">{stalledDeals}</div>
            <div className="text-sm text-red-700 font-medium mt-1">Stalled Deals</div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{avgDaysCycle}</div>
            <div className="text-sm text-gray-700 font-medium mt-1">Days Avg Cycle</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Stage:</label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              {stages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Owner:</label>
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="Alex Rodriguez">Alex Rodriguez</option>
              <option value="Sarah Chen">Sarah Chen</option>
              <option value="Mike Johnson">Mike Johnson</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Close Date:</label>
            <select
              value={selectedCloseDate}
              onChange={(e) => setSelectedCloseDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Value:</label>
            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="0-25k">$0-25K</option>
              <option value="25-50k">$25-50K</option>
              <option value="50-100k">$50-100K</option>
              <option value="100k+">$100K+</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Source:</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="Lead Gen">Lead Gen</option>
              <option value="HRMS">HRMS</option>
              <option value="Website">Website</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search deals, accounts, contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300">
              <BarChart3 className="h-4 w-4" />
              <span>View: List</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedDeals.length === sortedDeals.length && sortedDeals.length > 0}
                    onChange={selectAllDeals}
                    className="rounded border-gray-300"
                  />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('deal')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Deal / Account</span>
                    <SortIcon column="deal" />
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Value</span>
                    <SortIcon column="value" />
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('stage')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Stage</span>
                    <SortIcon column="stage" />
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('closeDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Close Date</span>
                    <SortIcon column="closeDate" />
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('health')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Health</span>
                    <SortIcon column="health" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedDeals.map((deal) => {
                const isExpanded = expandedRows.includes(deal.id);
                const isSelected = selectedDeals.includes(deal.id);
                const stageColor = getStageColor(deal.stage);
                const daysAway = getDaysAway(deal.closeDate);

                return (
                  <React.Fragment key={deal.id}>
                    <tr
                      className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                      onContextMenu={(e) => handleContextMenu(e, deal.id)}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDealSelection(deal.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span
                                className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                                onClick={() => navigate(`/crm/deals/${deal.id}`)}
                              >
                                {deal.companyName}
                              </span>
                              {deal.isHRMS && (
                                <span
                                  className="px-2 py-0.5 text-xs font-medium rounded cursor-pointer hover:opacity-80"
                                  style={{ backgroundColor: '#fff3cd', border: '1px solid #ff9800', color: '#e65100' }}
                                  onClick={(e) => { e.stopPropagation(); setShowHRMSModal(deal); }}
                                >
                                  HRMS
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{deal.dealName}</div>
                          </div>
                          <button onClick={() => toggleRowExpansion(deal.id)}>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div
                          className="text-lg font-bold cursor-pointer hover:underline"
                          style={{ color: '#667eea' }}
                          onClick={() => navigate(`/crm/deals/${deal.id}`)}
                        >
                          {formatCurrency(deal.amount)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative">
                          <div
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: stageColor.bg, color: stageColor.text }}
                            onClick={(e) => { e.stopPropagation(); setShowStageModal(deal.id); }}
                            onMouseEnter={() => setHoveredStage(deal.id)}
                            onMouseLeave={() => setHoveredStage(null)}
                          >
                            {getStageName(deal.stage)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Stage {getStageProgress(deal.stage)}
                          </div>

                          {/* Stage Timeline Tooltip */}
                          {hoveredStage === deal.id && (
                            <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
                              <div className="text-sm font-semibold text-gray-900 mb-3">Deal Progress:</div>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span className="text-gray-700">Prospecting (5 days)</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span className="text-gray-700">Qualified (8 days)</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span className="text-gray-700">Proposal (12 days)</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm font-medium">
                                  <div className="h-4 w-4 flex items-center justify-center">➡️</div>
                                  <span className="text-gray-900">{getStageName(deal.stage)} (15 days) [NOW]</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-400">
                                  <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
                                  <span>Closed-Won</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-400">
                                  <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
                                  <span>Closed-Lost</span>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                                <div>Total: 40 days in pipeline</div>
                                <div>Avg cycle: {avgDaysCycle} days</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{formatDate(deal.closeDate)}</div>
                        <div className="text-xs text-gray-500">{daysFromNowLabel(deal.closeDate)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative">
                          <div
                            className="flex items-center space-x-1 mb-1 cursor-pointer"
                            onMouseEnter={() => setHoveredScore(deal.id)}
                            onMouseLeave={() => setHoveredScore(null)}
                          >
                            <Sparkles className="h-3 w-3" style={{ color: '#667eea' }} />
                            <span className="font-bold text-sm" style={{ color: '#667eea' }}>{deal.aiScore}</span>
                          </div>
                          <div className="text-xs text-yellow-500">{getHealthStars(deal.aiScore)}</div>
                          <div className="text-xs text-gray-600">{getHealthText(deal.health)}</div>

                          {/* AI Score Tooltip */}
                          {hoveredScore === deal.id && (
                            <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
                              <div className="text-sm font-semibold text-gray-900 mb-3">
                                AI Health Score: {deal.aiScore}/100
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-start space-x-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                  <span className="text-gray-700">High engagement: +25</span>
                                </div>
                                {deal.isHRMS && (
                                  <div className="flex items-start space-x-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                    <span className="text-gray-700">HRMS connection: +20</span>
                                  </div>
                                )}
                                <div className="flex items-start space-x-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                  <span className="text-gray-700">Fast response time: +15</span>
                                </div>
                                <div className="flex items-start space-x-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                  <span className="text-gray-700">Deal progressing: +20</span>
                                </div>
                                <div className="flex items-start space-x-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                  <span className="text-gray-700">Strong champion: +12</span>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-sm font-medium text-gray-900">
                                  Rating: {getHealthText(deal.health)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative">
                          <button
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={(e) => { e.stopPropagation(); setShowActionDropdown(deal.id); }}
                          >
                            <MoreHorizontal className="h-4 w-4 text-gray-600" />
                          </button>

                          {/* Action Dropdown */}
                          {showActionDropdown === deal.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                              <button
                                onClick={() => navigate(`/crm/deals/${deal.id}/edit`)}
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Edit Deal</span>
                              </button>
                              <button
                                onClick={() => setShowStageModal(deal.id)}
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Target className="h-4 w-4" />
                                <span>Change Stage</span>
                              </button>
                              <button
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <User className="h-4 w-4" />
                                <span>Change Owner</span>
                              </button>
                              <button
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Clock className="h-4 w-4" />
                                <span>Log Activity</span>
                              </button>
                              <button
                                onClick={() => setShowEmailModal(deal)}
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Mail className="h-4 w-4" />
                                <span>Send Proposal</span>
                              </button>
                              <div className="border-t border-gray-200 my-1"></div>
                              <button
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Mark as Won</span>
                              </button>
                              <button
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                                <span>Mark as Lost</span>
                              </button>
                              <div className="border-t border-gray-200 my-1"></div>
                              <button
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Copy className="h-4 w-4" />
                                <span>Clone Deal</span>
                              </button>
                              <button
                                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete Deal</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="pl-12">
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <div className="flex items-center space-x-2 text-sm mb-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span
                                    className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                                    onClick={() => navigate(`/crm/contacts/${deal.id}`)}
                                  >
                                    {deal.contactName}
                                  </span>
                                  <span className="text-gray-600">({deal.contactTitle})</span>
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                  <span className="font-medium">Owner:</span>
                                  <span
                                    className="ml-1 cursor-pointer hover:text-blue-600"
                                    onClick={() => navigate('/settings/team')}
                                  >
                                    {deal.owner}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm mb-3">
                                  {deal.daysSinceContact >= 5 ? (
                                    <span className="flex items-center space-x-1 text-red-600">
                                      <AlertTriangle className="h-4 w-4" />
                                      <span>{deal.daysSinceContact} days no contact</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center space-x-1 text-green-600">
                                      <CheckCircle2 className="h-4 w-4" />
                                      <span>Active: {deal.lastActivity}</span>
                                    </span>
                                  )}
                                  <span className="text-gray-500">| {deal.source}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setShowEmailModal(deal)}
                                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                  >
                                    <Mail className="h-4 w-4" />
                                    <span>Email</span>
                                  </button>
                                  <button
                                    onClick={() => setShowCallModal(deal)}
                                    className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                                  >
                                    <Phone className="h-4 w-4" />
                                    <span>Call</span>
                                  </button>
                                  <button
                                    onClick={() => navigate(`/crm/deals/${deal.id}`)}
                                    className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span>View Deal</span>
                                  </button>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="text-xs font-semibold text-gray-700 uppercase mb-2">
                                  AI Insights
                                </div>
                                <div className="space-y-2">
                                  {deal.aiScore >= 80 && (
                                    <div className="flex items-start space-x-2 text-sm">
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                      <span className="text-gray-700">Strong engagement signals</span>
                                    </div>
                                  )}
                                  {deal.daysSinceContact >= 5 && (
                                    <div className="flex items-start space-x-2 text-sm">
                                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                      <span className="text-gray-700">No recent contact activity</span>
                                    </div>
                                  )}
                                  {deal.isHRMS && (
                                    <div className="flex items-start space-x-2 text-sm">
                                      <Building2 className="h-4 w-4 text-orange-500 mt-0.5" />
                                      <span className="text-gray-700">Connected to HRMS account</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {sortedDeals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No deals found matching your filters.</p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          Showing {sortedDeals.length} of {allDeals.length} deals
        </div>
      </div>

      {/* Context Menu */}
      {contextMenuDeal && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Edit className="h-4 w-4" />
            <span>Edit Deal</span>
          </button>
          <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Target className="h-4 w-4" />
            <span>Change Stage</span>
          </button>
          <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Copy className="h-4 w-4" />
            <span>Clone Deal</span>
          </button>
          <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
            <span>Delete Deal</span>
          </button>
        </div>
      )}

      {/* Stage Change Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Change Stage</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-2">
                {stages.map(stage => {
                  const deal = sortedDeals.find(d => d.id === showStageModal);
                  const isCurrentStage = deal?.stage === stage.id;
                  return (
                    <label key={stage.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="stage"
                        checked={isCurrentStage}
                        onChange={() => handleStageChange(showStageModal, stage.id)}
                        className="text-blue-600"
                      />
                      <span className={`text-sm ${isCurrentStage ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        {stage.name} {isCurrentStage && '(current)'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowStageModal(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Bulk Update ({selectedDeals.length} deals selected)
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Stage</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Owner</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Close Date</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Priority</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Tags</span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkUpdateModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowBulkUpdateModal(false)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Deals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete {selectedDeals.length} Deals?
                </h3>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Compose Email</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="email"
                    defaultValue={showEmailModal.contactName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    defaultValue={`Re: ${showEmailModal.dealName}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message..."
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowEmailModal(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowEmailModal(null)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Logging Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Log Call</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <input
                    type="text"
                    defaultValue={showCallModal.contactName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Call Duration</label>
                  <input
                    type="text"
                    placeholder="e.g., 15 minutes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Call Notes</label>
                  <textarea
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What was discussed..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Successful</option>
                    <option>No Answer</option>
                    <option>Left Voicemail</option>
                    <option>Follow-up Required</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCallModal(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCallModal(null)}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Call Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HRMS Modal */}
      {showHRMSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">HRMS Connection Details</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <Building2 className="h-6 w-6 text-orange-600" />
                  <div>
                    <div className="font-semibold text-gray-900">{showHRMSModal.companyName}</div>
                    <div className="text-sm text-gray-600">Connected to HRMS System</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Last Sync:</span>
                    <span className="text-sm font-medium text-gray-900">{showHRMSModal.lastActivity}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Data Quality:</span>
                    <span className="text-sm font-medium text-green-600">Excellent</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Integration Status:</span>
                    <span className="flex items-center space-x-1 text-sm font-medium text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Active</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowHRMSModal(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-6">
            <span className="text-sm font-medium text-gray-900">
              {selectedDeals.length} deals selected
            </span>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              <span>Change Stage</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors">
              <span>Change Owner</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowBulkUpdateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
            >
              Bulk Update
            </button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors">
              Export
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedDeals([])}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsListView;
