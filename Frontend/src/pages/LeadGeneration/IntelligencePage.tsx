import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, Sparkles, TrendingUp, CheckCircle, Search, Filter, ArrowRight } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { companySignals } from '../../utils/leadDiscoveryMockData';

const IntelligencePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'funding': return '💰';
      case 'hiring': return '📈';
      case 'product_launch': return '🚀';
      case 'hrms_event': return '🏢';
      case 'expansion': return '🌍';
      default: return '📊';
    }
  };

  const getSignalLabel = (type: string) => {
    switch (type) {
      case 'funding': return 'FUNDING';
      case 'hiring': return 'HIRING';
      case 'product_launch': return 'PRODUCT LAUNCH';
      case 'hrms_event': return 'HRMS EVENT';
      case 'expansion': return 'EXPANSION';
      default: return 'SIGNAL';
    }
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'funding': return 'bg-green-50 border-green-200';
      case 'hiring': return 'bg-blue-50 border-blue-200';
      case 'product_launch': return 'bg-purple-50 border-purple-200';
      case 'hrms_event': return 'bg-orange-50 border-orange-200';
      case 'expansion': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const handleAddToLeads = (signalId: string) => {
    showToast('Lead created successfully!', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bell className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Sales Intelligence</h1>
            </div>
            <p className="text-gray-600 text-lg">Real-time company signals and buying intent data</p>
          </div>
          <button
            onClick={() => navigate('/lead-generation/settings/intelligence')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Configure Signals
          </button>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">127</div>
            <div className="text-sm font-medium text-gray-600">Total Signals</div>
            <div className="text-xs text-blue-600 mt-1">Last 7 days</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200 p-4 text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">23</div>
            <div className="text-sm font-medium text-gray-600">💰 Funding</div>
            <div className="text-xs text-green-600 mt-1">High intent</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200 p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">45</div>
            <div className="text-sm font-medium text-gray-600">📈 Hiring</div>
            <div className="text-xs text-blue-600 mt-1">Growing teams</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-200 p-4 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">34</div>
            <div className="text-sm font-medium text-gray-600">🏢 HRMS</div>
            <div className="text-xs text-orange-600 mt-1">Warm leads</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-200 p-4 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">25</div>
            <div className="text-sm font-medium text-gray-600">🚀 Launches</div>
            <div className="text-xs text-purple-600 mt-1">New products</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-6 w-6 text-white" />
            <h2 className="text-2xl font-bold text-white">AI Intelligence Insights</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-white font-semibold mb-2">Top Intent Signals</div>
              <div className="text-white/90 text-sm">
                23 companies showing high buying intent based on funding announcements
              </div>
              <button
                onClick={() => setSelectedFilter('funding')}
                className="mt-3 text-white font-medium hover:text-blue-100 transition-colors flex items-center text-sm"
              >
                View Signals <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-white font-semibold mb-2">HRMS Integration</div>
              <div className="text-white/90 text-sm">
                34 warm leads from HRMS events with 33% higher conversion rate
              </div>
              <button
                onClick={() => setSelectedFilter('hrms_event')}
                className="mt-3 text-white font-medium hover:text-blue-100 transition-colors flex items-center text-sm"
              >
                View HRMS Leads <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-white font-semibold mb-2">Hiring Surge</div>
              <div className="text-white/90 text-sm">
                45 companies actively hiring, indicating growth and expansion
              </div>
              <button
                onClick={() => setSelectedFilter('hiring')}
                className="mt-3 text-white font-medium hover:text-blue-100 transition-colors flex items-center text-sm"
              >
                View Hiring Signals <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search signals by company, type, or keyword..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Signals</option>
                <option value="funding">Funding</option>
                <option value="hiring">Hiring</option>
                <option value="product_launch">Product Launch</option>
                <option value="hrms_event">HRMS Events</option>
                <option value="expansion">Expansion</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="h-4 w-4" />
                More Filters
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {companySignals.map((signal) => (
              <div
                key={signal.id}
                className={`p-6 rounded-lg border-2 hover:shadow-md transition-all ${getSignalColor(signal.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getSignalIcon(signal.type)}</span>
                      <span className="text-xs font-bold text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
                        {getSignalLabel(signal.type)}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {signal.timeAgo}
                      </span>
                      <span className="flex items-center text-sm">
                        <Sparkles className="h-3 w-3 mr-1 text-blue-600" />
                        <span className="font-semibold text-gray-700">AI Score: {signal.aiScore}/100</span>
                      </span>
                    </div>

                    <button
                      onClick={() => navigate(`/lead-generation/intelligence/${signal.id}`)}
                      className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors text-left mb-2"
                    >
                      {signal.title}
                    </button>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <button
                        onClick={() => navigate(`/lead-generation/companies/${signal.company}`)}
                        className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {signal.company}
                      </button>
                      <span>Source: {signal.source}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white border border-gray-200">
                        <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                        High Intent
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {signal.isAutoAdded ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium border border-green-300 cursor-not-allowed flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Auto-added
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddToLeads(signal.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Add to Leads
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/lead-generation/intelligence/${signal.id}`)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing 1-{companySignals.length} of 127 signals
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                Previous
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                2
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                3
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligencePage;
