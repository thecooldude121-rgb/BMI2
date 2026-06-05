import React, { useState, useEffect } from 'react';
import { formatDisplayDate, formatCloseDate, formatRelativeTime, daysFromNow, daysFromNowLabel, isWithinDays, parseDateMs } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Download, Settings, BarChart3, ChevronDown,
  Building2, User, Calendar, Sparkles, Mail, Phone, Eye, MoreHorizontal,
  CheckCircle2, AlertTriangle, TrendingUp, Clock, Target, X, Edit, Copy, Trash2,
  FileText
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

interface DealsGridViewProps {
  stages: PipelineStage[];
  onDealClick: (dealId: string) => void;
  onStageChange?: (dealId: string, newStage: string) => void;
}

const DealsGridView: React.FC<DealsGridViewProps> = ({ stages, onDealClick, onStageChange }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [selectedCloseDate, setSelectedCloseDate] = useState<string>('all');
  const [selectedValue, setSelectedValue] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [showActionDropdown, setShowActionDropdown] = useState<string | null>(null);
  const [showStageModal, setShowStageModal] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState<Deal | null>(null);
  const [showCallModal, setShowCallModal] = useState<Deal | null>(null);
  const [showHRMSModal, setShowHRMSModal] = useState<Deal | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showProposalModal, setShowProposalModal] = useState<Deal | null>(null);
  const [showScoreTooltip, setShowScoreTooltip] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{ dealId: string; x: number; y: number } | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(12);

  const allDeals: Deal[] = stages.flatMap(stage => stage.deals.map(deal => ({ ...deal, stage: stage.id })));

  const filteredDeals = allDeals.filter(deal => {
    const matchesSearch = searchTerm === '' ||
      deal.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contactName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = selectedStage === 'all' || deal.stage === selectedStage;
    const matchesOwner = selectedOwner === 'all' || deal.owner === selectedOwner;

    const matchesCloseDate = selectedCloseDate === 'all' ||
      (selectedCloseDate === 'week'    && isWithinDays(deal.closeDate, 7))  ||
      (selectedCloseDate === 'month'   && isWithinDays(deal.closeDate, 30)) ||
      (selectedCloseDate === 'quarter' && isWithinDays(deal.closeDate, 90));

    const matchesValue = selectedValue === 'all' ||
      (selectedValue === '0-25k' && deal.amount < 25000) ||
      (selectedValue === '25-50k' && deal.amount >= 25000 && deal.amount < 50000) ||
      (selectedValue === '50-100k' && deal.amount >= 50000 && deal.amount < 100000) ||
      (selectedValue === '100k+' && deal.amount >= 100000);

    const matchesSource = selectedSource === 'all' || deal.source.includes(selectedSource);

    return matchesSearch && matchesStage && matchesOwner && matchesCloseDate && matchesValue && matchesSource;
  });

  const displayedDeals = filteredDeals.slice(0, displayLimit);

  // Replaced isWithinWeek/Month/Quarter with isWithinDays from dateUtils — null-safe, no duplication.

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  const formatDate = formatCloseDate; // formatCloseDate returns "No close date" for missing values
  const getDaysAway = daysFromNow;

  const getStageColor = (stageId: string) => {
    switch(stageId) {
      case 'prospecting': return { bg: '#2196F3', text: '#ffffff', emoji: '🔵' };
      case 'qualified': return { bg: '#4CAF50', text: '#ffffff', emoji: '🟢' };
      case 'proposal': return { bg: '#FF9800', text: '#ffffff', emoji: '🟠' };
      case 'negotiation': return { bg: '#9C27B0', text: '#ffffff', emoji: '🟣' };
      case 'closed-won': return { bg: '#2E7D32', text: '#ffffff', emoji: '🟢' };
      case 'closed-lost': return { bg: '#D32F2F', text: '#ffffff', emoji: '🔴' };
      default: return { bg: '#757575', text: '#ffffff', emoji: '⚪' };
    }
  };

  const getStageName = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    return stage ? stage.name : stageId;
  };

  const getStageProgress = (stageId: string) => {
    const stageOrder = ['prospecting', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
    const currentIndex = stageOrder.indexOf(stageId);
    return `Stage ${currentIndex + 1} of ${stageOrder.length}`;
  };

  const getHealthText = (health: string) => {
    switch(health) {
      case 'excellent': return 'Excellent';
      case 'healthy': return 'Very Good';
      case 'at-risk': return 'Good';
      case 'critical': return 'Fair';
      default: return health;
    }
  };

  const getProgressBarWidth = (aiScore: number) => {
    return `${aiScore}%`;
  };

  const getProgressBarColor = (aiScore: number) => {
    if (aiScore >= 90) return '#4CAF50';
    if (aiScore >= 80) return '#8BC34A';
    if (aiScore >= 70) return '#FFC107';
    if (aiScore >= 60) return '#FF9800';
    return '#F44336';
  };

  const handleStageChange = (dealId: string, newStage: string) => {
    if (onStageChange) {
      onStageChange(dealId, newStage);
    }
    setShowStageModal(null);
  };

  const handleDelete = (dealId: string) => {
    console.log('Deleting deal:', dealId);
    setShowDeleteModal(null);
  };

  const loadMore = () => {
    setDisplayLimit(prev => prev + 12);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setShowActionDropdown(null);
      setShowScoreTooltip(null);
      setShowContextMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, dealId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu({ dealId, x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCard) return;

      const currentIndex = displayedDeals.findIndex(d => d.id === selectedCard);
      if (currentIndex === -1) return;

      const columns = window.innerWidth >= 1536 ? 4 : window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;

      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          newIndex = Math.min(currentIndex + 1, displayedDeals.length - 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.min(currentIndex + columns, displayedDeals.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.max(currentIndex - columns, 0);
          break;
        default:
          return;
      }

      if (newIndex !== currentIndex) {
        setSelectedCard(displayedDeals[newIndex].id);
        document.querySelector(`[data-deal-id="${displayedDeals[newIndex].id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard, displayedDeals]);

  const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const avgWinRate = 67;
  const closingThisWeek = filteredDeals.filter(d => isWithinDays(d.closeDate, 7)).length;
  const stalledDeals = filteredDeals.filter(d => d.daysSinceContact >= 5).length;
  const avgDaysCycle = 45;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="grid grid-cols-6 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-3xl font-bold text-blue-900">{filteredDeals.length}</div>
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
              <span>View: Grid</span>
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

      {/* Deals Grid */}
      <div className="px-8 py-6">
        {displayedDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals found</h3>
            <p className="text-sm text-gray-600 mb-6">Try adjusting your filters or search criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStage('all');
                setSelectedOwner('all');
                setSelectedCloseDate('all');
                setSelectedValue('all');
                setSelectedSource('all');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-5 gap-y-6">
              {displayedDeals.map((deal) => {
              const stageColor = getStageColor(deal.stage);
              const daysAway = getDaysAway(deal.closeDate);
              const isStalled = deal.daysSinceContact >= 7;
              const isWon = deal.stage === 'closed-won';
              const isLost = deal.stage === 'closed-lost';

              return (
                <div
                  key={deal.id}
                  data-deal-id={deal.id}
                  tabIndex={0}
                  className={`bg-white rounded-xl p-5 min-h-[420px] w-full max-w-[340px] mx-auto
                    shadow-[0_2px_8px_rgba(0,0,0,0.08)]
                    hover:shadow-[0_6px_16px_rgba(0,0,0,0.12)] hover:-translate-y-1
                    transition-all duration-200 cursor-pointer relative border
                    ${selectedCard === deal.id ? 'border-blue-500 bg-blue-50' : 'border-transparent'}
                    ${isWon ? 'border-l-4 border-l-green-500' : ''}
                    ${isLost ? 'border-l-4 border-l-red-500 opacity-60' : ''}
                    ${isStalled && !isWon && !isLost ? 'border-l-4 border-l-red-500' : ''}
                    hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  onClick={() => { setSelectedCard(deal.id); navigate(`/crm/deals/${deal.id}`); }}
                  onContextMenu={(e) => handleContextMenu(e, deal.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`/crm/deals/${deal.id}`);
                    }
                  }}
                  onFocus={() => setSelectedCard(deal.id)}
                >
                {/* HRMS Orange Accent Line */}
                {deal.isHRMS && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500 rounded-t-xl"></div>
                )}

                {/* Company & Deal Name */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <span className="font-bold text-gray-900 text-lg">{deal.companyName}</span>
                    </div>
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
                  <div className="text-sm text-gray-600 ml-7">{deal.dealName}</div>
                </div>

                {/* Deal Value */}
                <div className="mb-4">
                  <div className="text-3xl font-bold" style={{ color: '#667eea' }}>
                    {formatCurrency(deal.amount)}
                  </div>
                </div>

                {/* Stage */}
                <div className="mb-4">
                  <div
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: stageColor.bg, color: stageColor.text }}
                    onClick={(e) => { e.stopPropagation(); setShowStageModal(deal.id); }}
                  >
                    <span className="mr-2">{stageColor.emoji}</span>
                    <span>{getStageName(deal.stage)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getStageProgress(deal.stage)}
                  </div>
                </div>

                {/* Close Date */}
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">Close: {formatDate(deal.closeDate)}</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-6">
                    {daysFromNowLabel(deal.closeDate)}
                  </div>
                </div>

                {/* AI Health Score */}
                <div className="mb-4 pb-4 border-b border-gray-100 relative">
                  <div
                    className="flex items-center space-x-2 mb-2 cursor-pointer hover:opacity-80"
                    onClick={(e) => { e.stopPropagation(); setShowScoreTooltip(deal.id); }}
                  >
                    <Sparkles className="h-4 w-4" style={{ color: '#667eea' }} />
                    <span className="font-bold text-lg" style={{ color: '#667eea' }}>{deal.aiScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: getProgressBarWidth(deal.aiScore),
                        backgroundColor: getProgressBarColor(deal.aiScore)
                      }}
                    ></div>
                  </div>
                  <div className="text-xs font-medium text-gray-700">
                    {getHealthText(deal.health)}
                  </div>

                  {/* AI Score Tooltip */}
                  {showScoreTooltip === deal.id && (
                    <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-900 text-white rounded-lg shadow-xl p-4 z-50">
                      <div className="mb-3">
                        <div className="font-bold text-sm mb-2">AI Health Score Breakdown</div>
                        <div className="text-xs text-gray-300">Overall Score: {deal.aiScore}/100</div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Engagement Level:</span>
                          <span className="font-medium">+25</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Response Rate:</span>
                          <span className="font-medium">+22</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Deal Velocity:</span>
                          <span className="font-medium">+18</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Budget Alignment:</span>
                          <span className="font-medium">+15</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Stakeholder Coverage:</span>
                          <span className="font-medium">+12</span>
                        </div>
                      </div>
                      <div className="absolute -bottom-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <div
                    className="flex items-center space-x-2 mb-1 cursor-pointer hover:text-blue-600"
                    onClick={(e) => { e.stopPropagation(); navigate(`/crm/contacts/${deal.id}`); }}
                  >
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 text-sm">{deal.contactName}</span>
                  </div>
                  <div className="text-xs text-gray-600 ml-6">{deal.contactTitle}</div>
                </div>

                {/* Owner */}
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <div className="text-xs text-gray-600 mb-1">Owner:</div>
                  <div
                    className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                    onClick={(e) => { e.stopPropagation(); navigate(`/settings/team/${deal.owner.toLowerCase().replace(' ', '-')}`); }}
                  >
                    {deal.owner}
                  </div>
                </div>

                {/* Activity Status */}
                <div className="mb-4">
                  {deal.daysSinceContact >= 5 ? (
                    <div className="flex items-center space-x-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 font-medium">{deal.daysSinceContact} days</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 ml-6">
                    {deal.daysSinceContact >= 5
                      ? `${deal.daysSinceContact}d no contact`
                      : formatRelativeTime(deal.lastActivity, 'No recent activity')}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowEmailModal(deal); }}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowCallModal(deal); }}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/crm/deals/${deal.id}`); }}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Deal</span>
                  </button>
                </div>

                {/* More Options */}
                <div className="mt-3 pt-3 border-t border-gray-100 relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowActionDropdown(deal.id); }}
                    className="w-full flex items-center justify-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MoreHorizontal className="h-5 w-5 text-gray-600" />
                  </button>

                  {/* Action Dropdown */}
                  {showActionDropdown === deal.id && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/crm/deals/${deal.id}/edit`); }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit Deal</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowStageModal(deal.id); }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Target className="h-4 w-4" />
                        <span>Change Stage</span>
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="h-4 w-4" />
                        <span>Change Owner</span>
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Clock className="h-4 w-4" />
                        <span>Log Activity</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowProposalModal(deal); setShowActionDropdown(null); }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Send Proposal</span>
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Mark as Won</span>
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                        <span>Mark as Lost</span>
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Clone Deal</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteModal(deal.id); }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Deal</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
            </div>

            {/* Load More / Status */}
            <div className="mt-8 text-center">
              {displayedDeals.length < filteredDeals.length ? (
                <button
                  onClick={loadMore}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Load More ({filteredDeals.length - displayedDeals.length} remaining)
                </button>
              ) : (
                <p className="text-sm text-gray-600">
                  Showing all {displayedDeals.length} deals
                </p>
              )}
            </div>
          </>
        )}
      </div>

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
                  const deal = displayedDeals.find(d => d.id === showStageModal);
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Deal?</h3>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
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
                    <span className="text-sm font-medium text-gray-900">{formatRelativeTime(showHRMSModal.lastActivity, '—')}</span>
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

      {/* Send Proposal Modal */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Send Proposal</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">{showProposalModal.companyName}</div>
                      <div className="text-sm text-gray-600">{showProposalModal.dealName} - {formatCurrency(showProposalModal.amount)}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Template</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Enterprise Solution Proposal</option>
                    <option>Standard Package Proposal</option>
                    <option>Custom Integration Proposal</option>
                    <option>Growth Plan Proposal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Send To</label>
                  <input
                    type="email"
                    defaultValue={showProposalModal.contactName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    defaultValue={`Proposal for ${showProposalModal.dealName}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a personalized message..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="attachPricing" className="rounded" defaultChecked />
                  <label htmlFor="attachPricing" className="text-sm text-gray-700">Attach pricing breakdown</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="attachTimeline" className="rounded" defaultChecked />
                  <label htmlFor="attachTimeline" className="text-sm text-gray-700">Attach implementation timeline</label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowProposalModal(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowProposalModal(null)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right-Click Context Menu */}
      {showContextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[60] min-w-[180px]"
          style={{ top: showContextMenu.y, left: showContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { navigate(`/crm/deals/${showContextMenu.dealId}/edit`); setShowContextMenu(null); }}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Deal</span>
          </button>
          <button
            onClick={() => { setShowStageModal(showContextMenu.dealId); setShowContextMenu(null); }}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Target className="h-4 w-4" />
            <span>Change Stage</span>
          </button>
          <button
            onClick={() => setShowContextMenu(null)}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <User className="h-4 w-4" />
            <span>Change Owner</span>
          </button>
          <button
            onClick={() => setShowContextMenu(null)}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Clock className="h-4 w-4" />
            <span>Log Activity</span>
          </button>
          <button
            onClick={() => {
              const deal = displayedDeals.find(d => d.id === showContextMenu.dealId);
              if (deal) setShowProposalModal(deal);
              setShowContextMenu(null);
            }}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
          >
            <FileText className="h-4 w-4" />
            <span>Send Proposal</span>
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => setShowContextMenu(null)}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Mark as Won</span>
          </button>
          <button
            onClick={() => setShowContextMenu(null)}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
            <span>Mark as Lost</span>
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => setShowContextMenu(null)}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Copy className="h-4 w-4" />
            <span>Clone Deal</span>
          </button>
          <button
            onClick={() => { setShowDeleteModal(showContextMenu.dealId); setShowContextMenu(null); }}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Deal</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DealsGridView;
