import React, { useState, useEffect } from 'react';
import { History, FileText, RefreshCw, Plus, Eye } from 'lucide-react';

interface HistoryEvent {
  id: string;
  type: 'note' | 'status_change' | 'created';
  timestamp: string;
  user: string;
  description: string;
  details?: string;
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
        description: 'Notes Added',
        details: 'Had discovery call. Strong interest. Budget confirmed.'
      },
      {
        id: '2',
        type: 'status_change',
        timestamp: 'Jan 4, 2025 11:20 AM',
        user: 'System',
        description: 'Status Changed',
        details: 'Status: New → Contacted'
      },
      {
        id: '3',
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
                          <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 mt-2">
                            {event.details}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 italic">
                            "{event.details.substring(0, 50)}
                            {event.details.length > 50 ? '...' : ''}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {event.details && (
                    <button
                      onClick={() => toggleExpand(event.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      {expandedEvent === event.id ? 'Hide' : 'View'} Details
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
