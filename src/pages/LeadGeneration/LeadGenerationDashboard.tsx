import React from 'react';
import {
  Target, TrendingUp, Building2, Sparkles, DollarSign,
  Calendar, FileText, Settings, Upload, PlusCircle,
  Bell, ArrowRight, Clock, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  companySignals,
  recentLeads,
  dashboardStats,
  aiInsights,
  CompanySignal,
  RecentLead
} from '../../utils/leadDiscoveryMockData';

const LeadGenerationDashboard: React.FC = () => {
  const navigate = useNavigate();

  const getSignalIcon = (type: CompanySignal['type']) => {
    switch (type) {
      case 'funding': return '💰';
      case 'hiring': return '📈';
      case 'product_launch': return '🚀';
      case 'hrms_event': return '🏢';
      case 'expansion': return '🌍';
      default: return '📊';
    }
  };

  const getSignalLabel = (type: CompanySignal['type']) => {
    switch (type) {
      case 'funding': return 'FUNDING';
      case 'hiring': return 'HIRING';
      case 'product_launch': return 'PRODUCT LAUNCH';
      case 'hrms_event': return 'HRMS EVENT';
      case 'expansion': return 'EXPANSION';
      default: return 'SIGNAL';
    }
  };

  const getSourceIcon = (source: RecentLead['source']) => {
    switch (source) {
      case 'hrms': return '🏢';
      case 'intent': return '🔔';
      case 'apollo': return '🎯';
      case 'manual': return '✍️';
      default: return '📊';
    }
  };

  const getSourceLabel = (source: RecentLead['source']) => {
    switch (source) {
      case 'hrms': return 'HRMS';
      case 'intent': return 'Intent';
      case 'apollo': return 'Apollo';
      case 'manual': return 'Manual';
      default: return 'Other';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusColor = (status: RecentLead['status']) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-50';
      case 'contacted': return 'text-orange-600 bg-orange-50';
      case 'qualified': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Target className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Lead Discovery Dashboard</h1>
              </div>
              <p className="text-gray-600 text-lg">AI-powered lead intelligence and real-time insights</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/lead-generation/import')}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Leads
              </button>
              <button
                onClick={() => navigate('/lead-generation/settings')}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-8 py-8 space-y-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardStats.totalLeads}</div>
              <div className="text-sm font-medium text-gray-600 mb-1">Total Leads</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardStats.newToday}</div>
              <div className="text-sm font-medium text-gray-600 mb-1">New Today</div>
              <div className="text-xs text-green-600 font-semibold">{dashboardStats.newTodayChange}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-blue-200 p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-white">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{dashboardStats.hrmsLeads}</div>
              <div className="text-sm font-medium text-gray-600 mb-1">🏢 HRMS Leads</div>
              <div className="text-xs text-blue-600 font-semibold">Warm!</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardStats.qualifiedLeads}</div>
              <div className="text-sm font-medium text-gray-600 mb-1">Qualified Leads</div>
              <div className="text-xs text-gray-500">{dashboardStats.qualifiedPercentage}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardStats.syncedToCRM}</div>
              <div className="text-sm font-medium text-gray-600 mb-1">Synced to CRM</div>
              <div className="text-xs text-gray-500">{dashboardStats.syncedPercentage}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{dashboardStats.avgScore}</div>
              <div className="text-sm font-medium text-gray-600 mb-1">Avg Score</div>
            </div>
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl shadow-lg">
          <div className="p-8 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Sparkles className="h-6 w-6 text-white" />
              <h2 className="text-2xl font-bold text-white">AI INSIGHTS & RECOMMENDATIONS</h2>
            </div>

            <div className="space-y-5">
              {/* Company Signals */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">💡</div>
                  <div className="flex-1">
                    <div className="text-white font-semibold mb-2">
                      {aiInsights.companySignals.total} new company signals detected this week
                    </div>
                    <div className="space-y-1 text-white/90 text-sm ml-4">
                      <div>• {aiInsights.companySignals.fundingAnnouncements} funding announcements (High buying intent!)</div>
                      <div>• {aiInsights.companySignals.hiringSignals} hiring signals (Sales teams expanding)</div>
                      <div>• {aiInsights.companySignals.productLaunches} product launches (Integration opportunities)</div>
                    </div>
                    <button
                      onClick={() => navigate('/lead-generation/signals')}
                      className="mt-3 text-white font-medium hover:text-blue-100 transition-colors flex items-center text-sm"
                    >
                      View Sales Intelligence Feed <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* HRMS Leads */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🏢</div>
                  <div className="flex-1">
                    <div className="text-white font-semibold mb-2">
                      {aiInsights.hrmsLeads.total} HRMS warm leads ready to contact
                    </div>
                    <div className="space-y-1 text-white/90 text-sm ml-4">
                      <div>• {aiInsights.hrmsLeads.conversionRate} higher conversion rate vs traditional leads</div>
                      <div>• Avg score: {aiInsights.hrmsLeads.avgScore}/100 (Excellent quality!)</div>
                    </div>
                    <button
                      onClick={() => navigate('/lead-generation/prospects?source=hrms')}
                      className="mt-3 text-white font-medium hover:text-blue-100 transition-colors flex items-center text-sm"
                    >
                      View HRMS Leads <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Email Performance */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">📧</div>
                  <div className="flex-1">
                    <div className="text-white font-semibold mb-2">
                      Email sequences performing well
                    </div>
                    <div className="space-y-1 text-white/90 text-sm ml-4">
                      <div>• "{aiInsights.emailPerformance.sequenceName}": {aiInsights.emailPerformance.openRate} open rate ({aiInsights.emailPerformance.openRateChange} vs benchmark)</div>
                      <div>• {aiInsights.emailPerformance.repliesToday} replies today - {aiInsights.emailPerformance.qualifiedLeads} qualified leads!</div>
                    </div>
                    <button
                      onClick={() => navigate('/lead-generation/analytics')}
                      className="mt-3 text-white font-medium hover:text-blue-100 transition-colors flex items-center text-sm"
                    >
                      View Campaign Analytics <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">⚡</div>
                  <div className="flex-1">
                    <div className="text-white font-semibold mb-3">Recommended Actions:</div>
                    <div className="space-y-2">
                      {aiInsights.recommendedActions.map((action, index) => (
                        <div key={index} className="flex items-start space-x-2 text-white/90 text-sm">
                          <span className="font-semibold">{index + 1}.</span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Highlights */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Latest Company Signals</h2>
                <span className="text-sm text-gray-500">(Last 24 Hours)</span>
              </div>
              <button
                onClick={() => navigate('/lead-generation/signals')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
              >
                View All Signals <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>

            <div className="space-y-4">
              {companySignals.map((signal) => (
                <div
                  key={signal.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xl">{getSignalIcon(signal.type)}</span>
                        <span className="text-xs font-bold text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                          {getSignalLabel(signal.type)}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {signal.timeAgo}
                        </span>
                      </div>

                      <div className="mb-2">
                        <h3 className="text-base font-semibold text-gray-900">{signal.title}</h3>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Source: {signal.source}</span>
                        <span className="flex items-center">
                          <Sparkles className="h-3 w-3 mr-1 text-blue-600" />
                          AI Score: {signal.aiScore}/100
                        </span>
                      </div>
                    </div>

                    <div>
                      {signal.isAutoAdded ? (
                        <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium border border-green-300">
                          Auto-added
                        </button>
                      ) : (
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          Add to Leads
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Leads (Last 10 Leads)</h2>
              <button
                onClick={() => navigate('/lead-generation/prospects')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All Leads → (450 total leads)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Lead Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Company</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Source</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-600">{lead.title}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{lead.company}</div>
                          <div className="text-sm text-gray-600">{lead.industry}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getSourceIcon(lead.source)}</span>
                          <span className="text-sm font-medium text-gray-700">{getSourceLabel(lead.source)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getScoreColor(lead.score)}`}>
                          {lead.score}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusColor(lead.status)}`}>
                            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">{lead.statusDetail}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/lead-generation/prospects/${lead.id}`)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            View
                          </button>
                          {lead.status === 'qualified' ? (
                            <button className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                              Sync
                            </button>
                          ) : (
                            <button className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                              Enrich
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-6">
            {/* Import Leads */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center space-x-3 mb-4">
                <Upload className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">📥 Import Leads</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/lead-generation/import/apollo')}
                  className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  Apollo.io
                </button>
                <button
                  onClick={() => navigate('/lead-generation/import/zoominfo')}
                  className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  ZoomInfo
                </button>
                <button
                  onClick={() => navigate('/lead-generation/import/csv')}
                  className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  CSV Upload
                </button>
              </div>
            </div>

            {/* Add Manual Lead */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center space-x-3 mb-4">
                <PlusCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">✍️ Add Manual Lead</h3>
              </div>
              <button
                onClick={() => navigate('/crm/leads/add')}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Quick Form
              </button>
            </div>

            {/* Configure Integrations */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="h-6 w-6 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">⚙️ Configure Integrations</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/integrations?filter=apollo')}
                  className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  Apollo.io
                </button>
                <button
                  onClick={() => navigate('/integrations?filter=zoominfo')}
                  className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  ZoomInfo
                </button>
                <button
                  onClick={() => navigate('/integrations?filter=crm')}
                  className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  CRM Sync
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadGenerationDashboard;
