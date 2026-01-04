import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Send, Clock, Users, TrendingUp, Plus, Play, Pause, Settings, BarChart3 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft' | 'completed';
  type: 'email' | 'sequence';
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  openRate: string;
  clickRate: string;
  replyRate: string;
  startDate: string;
  lastActivity: string;
}

const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'paused' | 'draft'>('all');

  const campaigns: Campaign[] = [
    {
      id: '1',
      name: 'Q1 Enterprise Outreach',
      status: 'active',
      type: 'sequence',
      recipients: 250,
      sent: 250,
      opened: 163,
      clicked: 89,
      replied: 34,
      openRate: '65%',
      clickRate: '36%',
      replyRate: '14%',
      startDate: '2024-01-15',
      lastActivity: '2 hours ago'
    },
    {
      id: '2',
      name: 'HRMS Warm Leads Follow-up',
      status: 'active',
      type: 'email',
      recipients: 45,
      sent: 45,
      opened: 38,
      clicked: 25,
      replied: 12,
      openRate: '84%',
      clickRate: '56%',
      replyRate: '27%',
      startDate: '2024-01-20',
      lastActivity: '30 minutes ago'
    },
    {
      id: '3',
      name: 'Tech Startup Series A Campaign',
      status: 'active',
      type: 'sequence',
      recipients: 180,
      sent: 180,
      opened: 97,
      clicked: 52,
      replied: 18,
      openRate: '54%',
      clickRate: '29%',
      replyRate: '10%',
      startDate: '2024-01-10',
      lastActivity: '1 hour ago'
    },
    {
      id: '4',
      name: 'Product Launch Announcement',
      status: 'paused',
      type: 'email',
      recipients: 500,
      sent: 320,
      opened: 192,
      clicked: 77,
      replied: 23,
      openRate: '60%',
      clickRate: '24%',
      replyRate: '7%',
      startDate: '2024-01-05',
      lastActivity: '3 days ago'
    },
    {
      id: '5',
      name: 'Re-engagement Campaign',
      status: 'draft',
      type: 'sequence',
      recipients: 150,
      sent: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      openRate: '-',
      clickRate: '-',
      replyRate: '-',
      startDate: '-',
      lastActivity: 'Never'
    }
  ];

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'paused': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'draft': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    return type === 'email' ? <Mail className="h-4 w-4" /> : <Send className="h-4 w-4" />;
  };

  const handleToggleCampaign = (campaignId: string, currentStatus: Campaign['status']) => {
    if (currentStatus === 'active') {
      showToast('Campaign paused', 'success');
    } else if (currentStatus === 'paused') {
      showToast('Campaign resumed', 'success');
    } else {
      showToast('Campaign started', 'success');
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (selectedTab === 'all') return true;
    return campaign.status === selectedTab;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600 mt-1">Manage your email campaigns and sequences</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/lead-generation/sequences')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Send className="h-4 w-4" />
              Sequences
            </button>
            <button
              onClick={() => navigate('/lead-generation/campaigns/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Send className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Campaigns</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{campaigns.length}</div>
            <div className="text-xs text-gray-500 mt-1">3 active</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Total Recipients</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">1,125</div>
            <div className="text-xs text-green-600 mt-1">+15% this month</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Avg Open Rate</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">63%</div>
            <div className="text-xs text-purple-600 mt-1">+8% vs last month</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Total Replies</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">87</div>
            <div className="text-xs text-orange-600 mt-1">12% reply rate</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex items-center gap-1 px-6">
              <button
                onClick={() => setSelectedTab('all')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({campaigns.length})
              </button>
              <button
                onClick={() => setSelectedTab('active')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === 'active'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Active ({campaigns.filter(c => c.status === 'active').length})
              </button>
              <button
                onClick={() => setSelectedTab('paused')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === 'paused'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Paused ({campaigns.filter(c => c.status === 'paused').length})
              </button>
              <button
                onClick={() => setSelectedTab('draft')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === 'draft'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Drafts ({campaigns.filter(c => c.status === 'draft').length})
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {filteredCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => navigate(`/lead-generation/campaigns/${campaign.id}`)}
                        className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {campaign.name}
                      </button>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                        {getTypeIcon(campaign.type)}
                        {campaign.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {campaign.recipients} recipients
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {campaign.lastActivity}
                      </span>
                      {campaign.startDate !== '-' && (
                        <span>Started: {campaign.startDate}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status !== 'draft' && (
                      <button
                        onClick={() => handleToggleCampaign(campaign.id, campaign.status)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title={campaign.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {campaign.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/lead-generation/campaigns/${campaign.id}/analytics`)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Analytics"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/lead-generation/campaigns/${campaign.id}/settings`)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {campaign.sent > 0 && (
                  <div className="grid grid-cols-5 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Sent</div>
                      <div className="text-2xl font-bold text-gray-900">{campaign.sent}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Opened</div>
                      <div className="text-2xl font-bold text-blue-600">{campaign.opened}</div>
                      <div className="text-xs text-gray-500">{campaign.openRate}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Clicked</div>
                      <div className="text-2xl font-bold text-purple-600">{campaign.clicked}</div>
                      <div className="text-xs text-gray-500">{campaign.clickRate}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Replied</div>
                      <div className="text-2xl font-bold text-green-600">{campaign.replied}</div>
                      <div className="text-xs text-gray-500">{campaign.replyRate}</div>
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => navigate(`/lead-generation/campaigns/${campaign.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )}

                {campaign.status === 'draft' && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => navigate(`/lead-generation/campaigns/${campaign.id}/edit`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Continue Editing
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage;
