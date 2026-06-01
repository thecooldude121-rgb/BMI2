import React, { useState, useEffect } from 'react';
import { Briefcase, AlertCircle, Bell, CheckCircle, TrendingUp } from 'lucide-react';
import { jobChangeService } from '../../services/dataIntelligenceService';
import type { ProspectJobChange } from '../../types/dataIntelligence';

interface JobChangeAlertsWidgetProps {
  prospectId?: string;
  showPendingOnly?: boolean;
  maxItems?: number;
  onAlertClick?: (jobChange: ProspectJobChange) => void;
}

const JobChangeAlertsWidget: React.FC<JobChangeAlertsWidgetProps> = ({
  prospectId,
  showPendingOnly = false,
  maxItems = 10,
  onAlertClick
}) => {
  const [jobChanges, setJobChanges] = useState<ProspectJobChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobChanges();
  }, [prospectId, showPendingOnly]);

  const loadJobChanges = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (prospectId) filters.prospect_id = prospectId;
      if (showPendingOnly) filters.alert_sent = false;

      const { data } = await jobChangeService.getJobChanges(filters);
      setJobChanges(data?.slice(0, maxItems) || []);
    } catch (error) {
      console.error('Error loading job changes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAlertSent = async (jobChangeId: string) => {
    try {
      await jobChangeService.markAlertSent(jobChangeId);
      loadJobChanges();
    } catch (error) {
      console.error('Error marking alert as sent:', error);
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return { color: 'bg-green-100 text-green-700', label: 'High Confidence' };
    if (score >= 60) return { color: 'bg-blue-100 text-blue-700', label: 'Medium Confidence' };
    return { color: 'bg-yellow-100 text-yellow-700', label: 'Low Confidence' };
  };

  const getChangeTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      promotion: '📈',
      new_job: '🚀',
      company_change: '🏢',
      title_change: '👔',
      role_change: '🔄'
    };
    return icons[type] || '💼';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = jobChanges.filter(jc => !jc.alert_sent).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Job Change Alerts</h3>
              <p className="text-sm text-gray-600">Real-time career movement tracking</p>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-orange-100 rounded-full">
              <Bell className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">
                {pendingCount} pending
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {jobChanges.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No job changes detected</p>
            <p className="text-sm text-gray-500 mt-1">
              We'll notify you when prospects change roles
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobChanges.map((jobChange) => {
              const confidenceBadge = getConfidenceBadge(jobChange.confidence_score);

              return (
                <div
                  key={jobChange.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    !jobChange.alert_sent
                      ? 'border-orange-200 bg-orange-50 hover:border-orange-300'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  } cursor-pointer`}
                  onClick={() => onAlertClick?.(jobChange)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getChangeTypeIcon(jobChange.change_type)}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-gray-900 capitalize">
                            {jobChange.change_type.replace(/_/g, ' ')}
                          </span>
                          {!jobChange.alert_sent && (
                            <span className="px-2 py-0.5 bg-orange-600 text-white text-xs font-semibold rounded">
                              NEW
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          Detected {formatDate(jobChange.detected_at)}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${confidenceBadge.color}`}>
                      {confidenceBadge.label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {jobChange.previous_title && (
                      <div className="flex items-start text-sm">
                        <span className="text-gray-500 w-20 flex-shrink-0">From:</span>
                        <span className="text-gray-700 font-medium">
                          {jobChange.previous_title}
                          {jobChange.previous_company && (
                            <span className="text-gray-500"> at {jobChange.previous_company}</span>
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start text-sm">
                      <span className="text-gray-500 w-20 flex-shrink-0">To:</span>
                      <span className="text-green-700 font-semibold">
                        {jobChange.new_title}
                        {jobChange.new_company && (
                          <span className="text-gray-900"> at {jobChange.new_company}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                      <span className="capitalize">Source: {jobChange.source}</span>
                      {jobChange.verified_at && (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </span>
                      )}
                    </div>
                    {!jobChange.alert_sent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAlertSent(jobChange.id);
                        }}
                        className="flex items-center px-3 py-1.5 text-xs font-semibold text-orange-700 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                      >
                        <Bell className="h-3 w-3 mr-1" />
                        Mark as Sent
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {jobChanges.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Showing {jobChanges.length} recent job changes
            </span>
            <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              View All Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobChangeAlertsWidget;
