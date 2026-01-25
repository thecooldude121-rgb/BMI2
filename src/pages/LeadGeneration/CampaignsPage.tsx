import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Share2,
  Linkedin,
  Rocket,
  Search,
  RotateCcw,
  MoreVertical,
  Play,
  Pause,
  Copy,
  Archive,
  Trash2,
  Edit,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import LeadGenNavigation from '../../components/LeadGeneration/LeadGenNavigation';
import { Campaign, CampaignFilters } from '../../types/campaigns';
import { campaignsMockData, campaignTemplates } from '../../utils/campaignsMockData';

const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns] = useState<Campaign[]>(campaignsMockData);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'performance'>('newest');
  const [perPage, setPerPage] = useState(20);

  const [filters, setFilters] = useState<CampaignFilters>({
    search: '',
    status: 'all',
    type: 'all',
    template: 'all',
    performance: 'all',
    dateRange: 'all'
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'paused': return '🟡';
      case 'scheduled': return '🔵';
      case 'draft': return '⚪';
      case 'completed': return '🟢';
      case 'archived': return '⚫';
      default: return '⚪';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'paused': return 'Paused';
      case 'scheduled': return 'Sched';
      case 'draft': return 'Draft';
      case 'completed': return 'Comp';
      case 'archived': return 'Archiv';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'multi-channel': return <Share2 className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'email': return 'Email';
      case 'multi-channel': return 'Multi-channel';
      case 'linkedin': return 'LinkedIn';
      default: return type;
    }
  };

  const getProgressBarColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-500';
    if (rate >= 40) return 'bg-blue-500';
    if (rate >= 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredCampaigns = useMemo(() => {
    let filtered = [...campaigns];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search) ||
        c.template.toLowerCase().includes(search)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(c => c.type === filters.type);
    }

    if (filters.template !== 'all') {
      filtered = filtered.filter(c => c.template === filters.template);
    }

    if (filters.performance !== 'all') {
      filtered = filtered.filter(c => {
        const avgRate = (c.openRate + c.replyRate) / 2;
        if (filters.performance === 'high') return avgRate >= 20;
        if (filters.performance === 'medium') return avgRate >= 10 && avgRate < 20;
        if (filters.performance === 'low') return avgRate < 10;
        return true;
      });
    }

    return filtered;
  }, [campaigns, filters]);

  const sortedCampaigns = useMemo(() => {
    const sorted = [...filteredCampaigns];

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'performance':
        return sorted.sort((a, b) => {
          const avgA = (a.openRate + a.replyRate) / 2;
          const avgB = (b.openRate + b.replyRate) / 2;
          return avgB - avgA;
        });
      default:
        return sorted;
    }
  }, [filteredCampaigns, sortBy]);

  const statistics = useMemo(() => {
    const active = campaigns.filter(c => c.status === 'active').length;
    const totalLeads = campaigns.reduce((sum, c) => sum + c.leadsCount, 0);
    const avgOpen = campaigns.filter(c => c.sentCount > 0).reduce((sum, c) => sum + c.openRate, 0) / campaigns.filter(c => c.sentCount > 0).length || 0;
    const avgReply = campaigns.filter(c => c.sentCount > 0).reduce((sum, c) => sum + c.replyRate, 0) / campaigns.filter(c => c.sentCount > 0).length || 0;

    return {
      activeCampaigns: active,
      totalLeads,
      avgOpenRate: avgOpen,
      avgReplyRate: avgReply
    };
  }, [campaigns]);

  const toggleCampaign = (id: string) => {
    const newSelected = new Set(selectedCampaigns);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCampaigns(newSelected);
  };

  const toggleAllCampaigns = () => {
    if (selectedCampaigns.size === sortedCampaigns.length) {
      setSelectedCampaigns(new Set());
    } else {
      setSelectedCampaigns(new Set(sortedCampaigns.map(c => c.id)));
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      template: 'all',
      performance: 'all',
      dateRange: 'all'
    });
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateWithYear = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderProgressBar = (current: number, total: number, rate: number) => {
    if (total === 0) return <span className="text-gray-400 text-xs">N/A</span>;

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{rate}%</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[60px]">
            <div
              className={`h-full ${getProgressBarColor(rate)} transition-all`}
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>
        <div className="text-xs text-gray-500">{current}/{total}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LeadGenNavigation />

      <div className="px-8 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-6 w-6 text-blue-500" />
                <h1 className="text-2xl font-bold text-gray-900">CAMPAIGNS</h1>
              </div>
              <p className="text-sm text-gray-600">Manage your multi-channel outreach campaigns</p>
            </div>
            <button
              onClick={() => navigate('/lead-generation/campaigns/create')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              <Rocket className="h-5 w-5" />
              Create Campaign
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Filters & Search
          </h2>

          <div className="grid grid-cols-5 gap-3 mb-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Status ▼</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Type ▼</option>
              <option value="email">Email</option>
              <option value="multi-channel">Multi-channel</option>
              <option value="linkedin">LinkedIn</option>
            </select>

            <select
              value={filters.template}
              onChange={(e) => setFilters({ ...filters, template: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Template ▼</option>
              {campaignTemplates.map(template => (
                <option key={template} value={template}>{template}</option>
              ))}
            </select>

            <select
              value={filters.performance}
              onChange={(e) => setFilters({ ...filters, performance: e.target.value as any })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Performance ▼</option>
              <option value="high">High (&gt;20%)</option>
              <option value="medium">Medium (10-20%)</option>
              <option value="low">Low (&lt;10%)</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Date Range ▼</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search campaigns by name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Filters
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Campaign Statistics (Quick Overview)
          </h2>

          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🟢</span>
                <span className="text-sm font-medium text-gray-700">Active</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{statistics.activeCampaigns}</div>
              <div className="text-sm text-gray-600">campaigns</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📊</span>
                <span className="text-sm font-medium text-gray-700">Total Leads</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{statistics.totalLeads.toLocaleString()}</div>
              <div className="text-sm text-gray-600">enrolled</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📧</span>
                <span className="text-sm font-medium text-gray-700">Avg Open Rate</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{statistics.avgOpenRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">across campaigns</div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💬</span>
                <span className="text-sm font-medium text-gray-700">Avg Reply</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{statistics.avgReplyRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">across campaigns</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Campaign List
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First ▼</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="performance">Performance</option>
              </select>
            </div>
          </div>

          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {sortedCampaigns.length} of {campaigns.length} campaigns
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCampaigns.size === sortedCampaigns.length && sortedCampaigns.length > 0}
                      onChange={toggleAllCampaigns}
                      className="h-4 w-4 text-blue-500 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Campaign Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Leads
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Send Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Open Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Reply Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Conversion
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.has(campaign.id)}
                        onChange={() => toggleCampaign(campaign.id)}
                        className="h-4 w-4 text-blue-500 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 mb-1">{campaign.name}</div>
                        {campaign.description && (
                          <div className="text-sm text-gray-500">{campaign.description}</div>
                        )}
                        {campaign.notes && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-amber-600">{campaign.notes}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getStatusIcon(campaign.status)}</span>
                        <span className="text-sm text-gray-700">{getStatusLabel(campaign.status)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(campaign.type)}
                        <span className="text-sm text-gray-700">{getTypeLabel(campaign.type)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700">{campaign.template}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-medium text-gray-900">{campaign.leadsCount}</span>
                    </td>
                    <td className="px-4 py-4">
                      {renderProgressBar(campaign.sentCount, campaign.leadsCount, campaign.sendRate)}
                    </td>
                    <td className="px-4 py-4">
                      {campaign.type === 'linkedin' ? (
                        <div className="text-xs text-gray-500">LinkedIn<br/>metrics</div>
                      ) : (
                        renderProgressBar(campaign.openCount, campaign.sentCount, campaign.openRate)
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {renderProgressBar(campaign.replyCount, campaign.sentCount, campaign.replyRate)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">{campaign.conversionRate}%</div>
                        <div className="text-xs text-gray-500">{campaign.conversionCount} opps</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-700">
                        {formatDate(campaign.createdAt)}
                        <div className="text-xs text-gray-500">{new Date(campaign.createdAt).getFullYear()}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === campaign.id ? null : campaign.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-400" />
                        </button>

                        {activeDropdown === campaign.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                              <BarChart3 className="h-4 w-4" />
                              View Analytics
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                              <Edit className="h-4 w-4" />
                              Edit Campaign
                            </button>
                            {campaign.status === 'active' ? (
                              <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                                <Pause className="h-4 w-4" />
                                Pause Campaign
                              </button>
                            ) : campaign.status === 'paused' ? (
                              <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                                <Play className="h-4 w-4" />
                                Resume Campaign
                              </button>
                            ) : null}
                            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                              <Copy className="h-4 w-4" />
                              Duplicate
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                              <Archive className="h-4 w-4" />
                              Archive
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left border-t border-gray-200">
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing 1-{sortedCampaigns.length} of {campaigns.length}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  ◀ Previous
                </button>
                <button className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-medium">
                  1
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Next ▶
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Per page:</span>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage;
