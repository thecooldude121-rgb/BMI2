import React, { useState, useEffect } from 'react';
import { History, FileText, RefreshCw, Plus, Eye } from 'lucide-react';

interface HistoryEvent {
  id: string;
  type: 'note' | 'status_change' | 'created' | 'score_adjusted' | 'bant_updated';
  timestamp: string;
  user: string;
  userRole?: string;
  description: string;
  details?: string;
  metadata?: {
    callDuration?: string;
    callType?: string;
    keyTopics?: string[];
    previousValue?: string;
    newValue?: string;
  };
}

interface QualificationHistoryProps {
  leadId: string;
}

const QualificationHistory: React.FC<QualificationHistoryProps> = ({ leadId }) => {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [leadId]);

  const loadHistory = async () => {
    const mockEvents: HistoryEvent[] = [
      {
        id: '1',
        type: 'note',
        timestamp: 'Jan 5, 2025 3:45 PM',
        user: 'John Smith',
        userRole: 'Senior AE',
        description: 'Notes Added',
        details: 'Had discovery call. Strong interest. Budget confirmed at $75K. Sarah is evaluating 2 other vendors but likes our HRMS relationship advantage.',
        metadata: {
          callDuration: '45 minutes',
          callType: 'Discovery',
          keyTopics: ['Budget', 'Timeline', 'Pain Points']
        }
      },
      {
        id: '2',
        type: 'bant_updated',
        timestamp: 'Jan 5, 2025 2:30 PM',
        user: 'John Smith',
        userRole: 'Senior AE',
        description: 'BANT Assessment Updated',
        details: 'Updated budget and timeline information',
        metadata: {
          previousValue: 'Budget: Unknown',
          newValue: 'Budget: $50K-$100K (Confirmed)'
        }
      },
      {
        id: '3',
        type: 'score_adjusted',
        timestamp: 'Jan 5, 2025 1:15 PM',
        user: 'Emily Chen',
        userRole: 'Sales Manager',
        description: 'AI Score Manually Adjusted',
        details: 'Adjusted score based on warm introduction from CEO',
        metadata: {
          previousValue: '85',
          newValue: '92'
        }
      },
      {
        id: '4',
        type: 'status_change',
        timestamp: 'Jan 4, 2025 11:20 AM',
        user: 'System',
        description: 'Status Changed',
        details: 'Status: New → Contacted'
      },
      {
        id: '5',
        type: 'created',
        timestamp: 'Oct 15, 2024 9:00 AM',
        user: 'HRMS System',
        description: 'Lead Created',
        details: 'Source: HRMS placement at TechStart Inc'
      }
    ];

    setEvents(mockEvents);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'status_change':
        return <RefreshCw className="h-5 w-5 text-orange-600" />;
      case 'created':
        return <Plus className="h-5 w-5 text-green-600" />;
      case 'score_adjusted':
        return <RefreshCw className="h-5 w-5 text-purple-600" />;
      case 'bant_updated':
        return <FileText className="h-5 w-5 text-green-600" />;
      default:
        return <History className="h-5 w-5 text-gray-600" />;
    }
  };

  const getEventEmoji = (type: string) => {
    switch (type) {
      case 'note':
        return '📝';
      case 'status_change':
        return '🔄';
      case 'created':
        return '➕';
      case 'score_adjusted':
        return '🎯';
      case 'bant_updated':
        return '✏️';
      default:
        return '📋';
    }
  };

  const toggleExpand = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            QUALIFICATION HISTORY
          </h2>
        </div>
      </div>

      <div className="p-6">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No history events yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getEventEmoji(event.type)}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {event.timestamp} - {event.description}
                        </div>
                        <div className="text-sm text-gray-600">
                          By: {event.user}
                        </div>
                      </div>
                    </div>

                    {event.details && (
                      <div className="ml-11">
                        {expandedEvent === event.id ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                  Date & Time:
                                </p>
                                <p className="text-sm text-gray-900">{event.timestamp}</p>
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                  Action:
                                </p>
                                <p className="text-sm text-gray-900">{event.description}</p>
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                  By:
                                </p>
                                <p className="text-sm text-gray-900">
                                  {event.user} {event.userRole && `(${event.userRole})`}
                                </p>
                              </div>

                              {event.type === 'note' && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Notes:
                                  </p>
                                  <p className="text-sm text-gray-700 bg-white rounded p-3 border border-gray-200">
                                    {event.details}
                                  </p>
                                </div>
                              )}

                              {event.metadata && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Metadata:
                                  </p>
                                  <div className="bg-white rounded p-3 border border-gray-200 space-y-1">
                                    {event.metadata.callDuration && (
                                      <p className="text-sm text-gray-700">
                                        • Call duration: {event.metadata.callDuration}
                                      </p>
                                    )}
                                    {event.metadata.callType && (
                                      <p className="text-sm text-gray-700">
                                        • Call type: {event.metadata.callType}
                                      </p>
                                    )}
                                    {event.metadata.keyTopics && event.metadata.keyTopics.length > 0 && (
                                      <p className="text-sm text-gray-700">
                                        • Key topics: {event.metadata.keyTopics.join(', ')}
                                      </p>
                                    )}
                                    {event.metadata.previousValue && (
                                      <p className="text-sm text-gray-700">
                                        • Previous: {event.metadata.previousValue}
                                      </p>
                                    )}
                                    {event.metadata.newValue && (
                                      <p className="text-sm text-gray-700">
                                        • New: {event.metadata.newValue}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {!event.metadata && event.type !== 'note' && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                    Details:
                                  </p>
                                  <p className="text-sm text-gray-700 bg-white rounded p-3 border border-gray-200">
                                    {event.details}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 italic">
                            "{event.details.substring(0, 60)}
                            {event.details.length > 60 ? '...' : ''}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {event.details && (
                    <button
                      onClick={() => toggleExpand(event.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                    >
                      <Eye className="h-4 w-4" />
                      {expandedEvent === event.id ? 'Close' : 'View Details'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QualificationHistory;
