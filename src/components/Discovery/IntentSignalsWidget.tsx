import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Activity, Filter, Calendar } from 'lucide-react';
import { intentSignalService } from '../../services/dataIntelligenceService';
import type { ProspectIntentSignal, IntentSignalStats, IntentSignalFilters } from '../../types/dataIntelligence';

interface IntentSignalsWidgetProps {
  prospectId?: string;
  showFilters?: boolean;
  maxItems?: number;
}

const IntentSignalsWidget: React.FC<IntentSignalsWidgetProps> = ({
  prospectId,
  showFilters = true,
  maxItems = 10
}) => {
  const [signals, setSignals] = useState<ProspectIntentSignal[]>([]);
  const [stats, setStats] = useState<IntentSignalStats | null>(null);
  const [filters, setFilters] = useState<IntentSignalFilters>({ prospect_id: prospectId });
  const [loading, setLoading] = useState(true);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: signalsData } = await intentSignalService.getIntentSignals(filters);
      setSignals(signalsData?.slice(0, maxItems) || []);

      if (prospectId) {
        const statsData = await intentSignalService.getIntentStats(prospectId);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading intent signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const getSignalIcon = (type: string): string => {
    const icons: Record<string, string> = {
      website_visit: '🌐',
      content_download: '📥',
      pricing_page_view: '💰',
      demo_request: '🎯',
      feature_research: '🔍',
      competitor_research: '⚔️',
      integration_research: '🔗',
      case_study_view: '📊',
      documentation_access: '📚',
      api_documentation: '⚙️',
      trial_signup: '✨',
      webinar_attendance: '📹',
      email_engagement: '✉️',
      social_engagement: '👥'
    };
    return icons[type] || '📌';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Intent Signals</h3>
              <p className="text-sm text-gray-600">Buying intent indicators</p>
            </div>
          </div>
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{stats.total_signals}</div>
              <div className="text-xs text-blue-700">Total Signals</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{stats.avg_intent_score}</div>
              <div className="text-xs text-green-700">Avg Score</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">{stats.top_topics.length}</div>
              <div className="text-xs text-orange-700">Active Topics</div>
            </div>
          </div>
        )}
      </div>

      {showFilterPanel && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.min_score || ''}
                onChange={(e) => setFilters({ ...filters, min_score: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic
              </label>
              <input
                type="text"
                value={filters.intent_topic || ''}
                onChange={(e) => setFilters({ ...filters, intent_topic: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search topics..."
              />
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {signals.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No intent signals detected</p>
            <p className="text-sm text-gray-500 mt-1">Signals will appear as prospects engage</p>
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl mt-0.5">{getSignalIcon(signal.signal_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {signal.intent_topic}
                      </h4>
                      <span className="text-xs text-gray-500 capitalize">
                        {signal.signal_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatRelativeTime(signal.detected_at)}
                      </span>
                      <span className="capitalize">
                        {signal.signal_source.replace(/_/g, ' ')}
                      </span>
                      <span className="text-gray-400">
                        {signal.confidence_level}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getScoreColor(signal.intent_score)}`}>
                    {signal.intent_score} - {getScoreLabel(signal.intent_score)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats && stats.top_topics.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
            Top Intent Topics
          </h4>
          <div className="space-y-2">
            {stats.top_topics.map((topic, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">{topic.topic}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500">{topic.count} signals</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getScoreColor(topic.avg_score)}`}>
                    {topic.avg_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntentSignalsWidget;
