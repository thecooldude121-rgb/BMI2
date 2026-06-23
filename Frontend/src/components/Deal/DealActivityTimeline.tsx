import React, { useState, useMemo } from 'react';
import { Clock, Mail, Phone, Video, FileText, TrendingUp, User, Sparkles, CheckCircle2, Calendar, Eye, MessageSquare, Share2, Plus, Filter } from 'lucide-react';
import { computeWeeklyBuckets } from '../../utils/contactEngagement';
import { EmailDetailModal, ShareSummaryModal, LogActivityModal } from './DealActivityModals';
import { MeetingSchedulerModal } from './DealModals';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'stage_change' | 'deal_created';
  date: string;
  time: string;
  title: string;
  description?: string;
  status?: string;
  engagement?: string;
  aiSummary?: {
    keyPoints: string[];
    sentiment: {
      type: 'positive' | 'neutral' | 'negative';
      confidence: number;
      notes: string[];
    };
    actionItems: Array<{
      task: string;
      owner: string;
      status: 'completed' | 'pending';
      dueDate?: string;
    }>;
    talkingPoints: string[];
    crmUpdates: string[];
  };
  hasRecording?: boolean;
  hasTranscript?: boolean;
  user?: string;
  to?: string;
  from?: string;
  subject?: string;
  body?: string;
  contactId?: string | null;
  isoDate?: string;
}

interface DealActivityTimelineProps {
  activities: Activity[];
  daysSinceLastContact: number;
  contacts?: { id: string; name: string }[];
}

// ── Heatmap helpers ───────────────────────────────────────────────────────────

/** Returns "May 30–Jun 5" style label for a given bucket index (0 = current week). */
function getWeekLabel(bucketIdx: number): string {
  const now = new Date();
  const endMs   = now.getTime() - bucketIdx * 7 * 86_400_000;
  const startMs = endMs - 6 * 86_400_000;
  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(startMs)}–${fmt(endMs)}`;
}

/** Maps an activity count to a GitHub-style heat-intensity colour. */
function heatmapSquareColor(count: number): string {
  if (count === 0) return '#F3F4F6'; // gray-100
  if (count === 1) return '#DBEAFE'; // blue-100
  if (count <= 3)  return '#93C5FD'; // blue-300
  if (count <= 6)  return '#3B82F6'; // blue-500
  return '#1D4ED8';                   // blue-700
}

// ─────────────────────────────────────────────────────────────────────────────

export const DealActivityTimeline: React.FC<DealActivityTimelineProps> = ({ activities, daysSinceLastContact, contacts }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [heatmapView, setHeatmapView] = useState<'combined' | 'per-contact'>('combined');
  const [showEmailDetail, setShowEmailDetail] = useState(false);
  const [showShareSummary, setShowShareSummary] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [showScheduleFollowup, setShowScheduleFollowup] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // ── Heatmap data ─────────────────────────────────────────────────────────
  const combinedBuckets = useMemo(
    () => computeWeeklyBuckets(activities.map(a => a.isoDate)),
    [activities],
  );

  // Buckets for the primary contact (first in the contacts list)
  const primaryContactBuckets = useMemo(() => {
    const primary = contacts?.[0];
    if (!primary) return new Array(8).fill(0) as number[];
    return computeWeeklyBuckets(
      activities.filter(a => a.contactId === primary.id).map(a => a.isoDate),
    );
  }, [activities, contacts]);

  // Derived heatmap values — recomputed when toggle switches
  const { activeBuckets, heatmapTotal, heatmapPeakIdx, heatmapPeakCount } = useMemo(() => {
    const buckets = heatmapView === 'combined' ? combinedBuckets : primaryContactBuckets;
    const total      = buckets.reduce((s, n) => s + n, 0);
    const peakCount  = Math.max(...buckets, 0);
    const peakIdx    = peakCount > 0 ? buckets.indexOf(peakCount) : 0;
    return { activeBuckets: buckets, heatmapTotal: total, heatmapPeakIdx: peakIdx, heatmapPeakCount: peakCount };
  }, [heatmapView, combinedBuckets, primaryContactBuckets]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-600" />;
      case 'call':
        return <Phone className="h-5 w-5 text-green-600" />;
      case 'meeting':
        return <Video className="h-5 w-5 text-purple-600" />;
      case 'note':
        return <MessageSquare className="h-5 w-5 text-gray-600" />;
      case 'stage_change':
        return <TrendingUp className="h-5 w-5 text-orange-600" />;
      case 'deal_created':
        return <FileText className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'neutral':
        return '😐';
      case 'negative':
        return '😟';
      default:
        return '😐';
    }
  };

  const filteredActivities = useMemo(() => {
    const list = filterType === 'all'
      ? activities
      : activities.filter(a => a.type === filterType);
    return [...list].sort((a, b) => {
      const da = a.isoDate ?? '';
      const db = b.isoDate ?? '';
      return db.localeCompare(da); // YYYY-MM-DD sorts correctly lexicographically
    });
  }, [activities, filterType]);

  // Group sorted activities by calendar date — one separator per unique date
  const groupedActivities = useMemo(() => {
    const groups = new Map<string, { label: string; items: Activity[] }>();
    for (const activity of filteredActivities) {
      const key = activity.isoDate ?? activity.date;
      if (!groups.has(key)) {
        groups.set(key, { label: activity.date, items: [] });
      }
      groups.get(key)!.items.push(activity);
    }
    // Map preserves insertion order; filteredActivities is already descending,
    // so groups are naturally in newest-first order.
    return Array.from(groups.values());
  }, [filteredActivities]);

  const handleViewEmail = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowEmailDetail(true);
  };

  const handleViewTranscript = () => {
    showToast('success', 'Navigating to meeting transcript...');
    setTimeout(() => {
      navigate('/meeting-transcript');
    }, 500);
  };

  const handlePlayRecording = () => {
    showToast('success', 'Opening recording player...');
  };

  const handleShareSummary = (method: string) => {
    showToast('success', `Sharing summary via ${method}...`);
  };

  const handleAddNote = () => {
    showToast('success', 'Opening note editor...');
  };

  const handleLogActivity = (activity: { type: string; subject: string; notes: string; date: string }) => {
    showToast('success', `${activity.type} logged successfully!`);
  };

  const handleScheduleFollowup = () => {
    setShowScheduleFollowup(true);
  };

  const handleMeetingScheduled = (meetingData: any) => {
    showToast('success', 'Follow-up meeting scheduled!');
  };

  const handleLoadMore = () => {
    showToast('info', 'Loading more activities...');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Clock className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Activity Timeline</h2>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Activities</option>
            <option value="email">Emails</option>
            <option value="call">Calls</option>
            <option value="meeting">Meetings</option>
            <option value="note">Notes</option>
          </select>
          <button
            onClick={() => setShowLogActivity(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Log Activity
          </button>
        </div>
      </div>

      {/* ── Engagement Heatmap ── */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Engagement Heatmap (8 weeks)</span>
          <div className="flex items-center gap-0">
            <button
              onClick={() => setHeatmapView('combined')}
              className={`px-2.5 py-1 text-xs font-medium rounded-l-md border transition-colors ${
                heatmapView === 'combined'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Activity
            </button>
            <button
              onClick={() => setHeatmapView('per-contact')}
              className={`px-2.5 py-1 text-xs font-medium rounded-r-md border-t border-b border-r transition-colors ${
                heatmapView === 'per-contact'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              By Contact
            </button>
          </div>
        </div>

        {heatmapTotal === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-5 text-center gap-3">
            <p className="text-sm text-gray-500 max-w-xs">
              No activity recorded yet. Log your first activity to start tracking engagement.
            </p>
            <button
              onClick={() => setShowLogActivity(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Log Activity
            </button>
          </div>
        ) : (
          /* Coloured squares — oldest left, newest right */
          <>
            <div className="flex items-center gap-1 mb-1.5">
              {[...activeBuckets].reverse().map((count, displayIdx) => {
                const bucketIdx = 7 - displayIdx;
                return (
                  <div
                    key={displayIdx}
                    title={`Week of ${getWeekLabel(bucketIdx)}: ${count} activit${count === 1 ? 'y' : 'ies'}`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      backgroundColor: heatmapSquareColor(count),
                      flexShrink: 0,
                      cursor: 'default',
                    }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-[9px] text-gray-400">8 wks ago</span>
              <span className="text-[9px] text-gray-400">This week</span>
            </div>
            {/* Intensity legend — GitHub-style */}
            <div className="flex items-center justify-end gap-1 mb-2">
              <span className="text-[9px] text-gray-400 mr-0.5">Less</span>
              {['#F3F4F6', '#DBEAFE', '#93C5FD', '#3B82F6', '#1D4ED8'].map((hex) => (
                <div key={hex} style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: hex, flexShrink: 0 }} />
              ))}
              <span className="text-[9px] text-gray-400 ml-0.5">More</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Peak week: {getWeekLabel(heatmapPeakIdx)} ({heatmapPeakCount}{' '}
              {heatmapPeakCount === 1 ? 'activity' : 'activities'})
              {' · '}
              Total last 8 weeks: {heatmapTotal}{' '}
              {heatmapTotal === 1 ? 'activity' : 'activities'}
            </p>
          </>
        )}
      </div>

      {/* Today Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <div className="h-px flex-1 bg-gray-300"></div>
          <span className="text-sm font-bold text-gray-700">TODAY (Dec 7)</span>
          <div className="h-px flex-1 bg-gray-300"></div>
        </div>

        {daysSinceLastContact > 0 && (
          <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-300 mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-bold text-yellow-900">No activities today</span>
            </div>
            <div className="text-sm text-yellow-800 mb-3">
              ⚠️ <span className="font-semibold">{daysSinceLastContact} days since last contact</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowLogActivity(true)}
                className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
              >
                Log Activity
              </button>
              <button
                onClick={handleScheduleFollowup}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Schedule Follow-up
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity List — grouped by calendar date */}
      <div className="space-y-8">
        {groupedActivities.map((group) => (
          <div key={group.label}>
            {/* Single date separator for all activities on this day */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-px flex-1 bg-gray-300"></div>
              <span className="text-sm font-bold text-gray-700">{group.label}</span>
              <div className="h-px flex-1 bg-gray-300"></div>
            </div>

            {group.items.map((activity, itemIdx) => {
              const isLast = itemIdx === group.items.length - 1;
              return (
                <div
                  key={activity.id}
                  className={`relative pl-8 border-l-2 border-gray-200 ${isLast ? 'border-l-0 pb-0' : 'pb-8'}`}
                >
              <div className="absolute left-0 top-0 -translate-x-1/2 bg-white p-1 rounded-full border-2 border-gray-200">
                {getActivityIcon(activity.type)}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-bold text-gray-900">{activity.time}</span>
                      <span className="text-sm font-bold text-gray-900">{activity.title}</span>
                    </div>
                    {activity.to && (
                      <div className="text-sm text-gray-600">To: {activity.to}</div>
                    )}
                    {activity.description && (
                      <div className="text-sm text-gray-700 mt-2">{activity.description}</div>
                    )}
                  </div>
                </div>

                {activity.status && (
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="text-sm font-medium text-green-600">{activity.status}</span>
                  </div>
                )}

                {activity.engagement && (
                  <div className="text-sm text-gray-600 mt-1">
                    Engagement: <span className="font-medium">{activity.engagement}</span>
                  </div>
                )}

                {activity.user && (
                  <div className="text-sm text-gray-600 mt-2">
                    By: <span className="font-medium">{activity.user}</span>
                  </div>
                )}

                {/* AI Summary Section */}
                {activity.aiSummary && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-bold text-purple-900">AI Meeting Summary:</span>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-purple-200 space-y-4">
                      {/* Key Points */}
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-2">Key Points Discussed:</div>
                        <ul className="space-y-1">
                          {activity.aiSummary.keyPoints.map((point, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                              <span className="text-purple-600">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Sentiment Analysis */}
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-2">Sentiment Analysis:</div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">{getSentimentEmoji(activity.aiSummary.sentiment.type)}</span>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {activity.aiSummary.sentiment.type} ({activity.aiSummary.sentiment.confidence}% confidence)
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {activity.aiSummary.sentiment.notes.map((note, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                              <span className="text-gray-400">-</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Items */}
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-2">Action Items Extracted:</div>
                        <div className="space-y-2">
                          {activity.aiSummary.actionItems.map((item, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              {item.status === 'completed' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              ) : (
                                <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">{item.task}</span> ({item.owner}) - {' '}
                                <span className={item.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}>
                                  {item.status === 'completed' ? 'Completed' : `Due: ${item.dueDate || 'TBD'}`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Talking Points */}
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-2">Talking Points for Next Meeting:</div>
                        <ul className="space-y-1">
                          {activity.aiSummary.talkingPoints.map((point, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                              <span className="text-blue-600">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* CRM Auto-Updates - Enhanced Integration */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-bold text-green-900">🤖 AI Auto-Updated CRM</span>
                          </div>
                          <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded">AUTOMATION</span>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <ul className="space-y-2">
                            {activity.aiSummary.crmUpdates.map((update, idx) => (
                              <li key={idx} className="text-sm text-green-800 flex items-start space-x-2">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-600" />
                                <span className="font-medium">{update}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-2 text-xs text-green-700 italic">
                          ✨ All fields updated automatically from meeting transcript
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-3">
                      {activity.hasTranscript && (
                        <button
                          onClick={handleViewTranscript}
                          className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                        >
                          <Eye className="h-4 w-4 inline mr-1" />
                          View Full Transcript
                        </button>
                      )}
                      {activity.hasRecording && (
                        <button
                          onClick={handlePlayRecording}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                          <Video className="h-4 w-4 inline mr-1" />
                          Play Recording
                        </button>
                      )}
                      <button
                        onClick={() => setShowShareSummary(true)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Share2 className="h-4 w-4 inline mr-1" />
                        Share Summary
                      </button>
                      <button
                        onClick={handleAddNote}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4 inline mr-1" />
                        Add Note
                      </button>
                    </div>
                  </div>
                )}

                {activity.type !== 'meeting' && (
                  <div className="flex items-center space-x-2 mt-3">
                    <button
                      onClick={() => activity.type === 'email' ? handleViewEmail(activity) : showToast('info', 'Viewing details...')}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      View {activity.type === 'email' ? 'Email' : 'Details'}
                    </button>
                  </div>
                )}
              </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <button
        onClick={handleLoadMore}
        className="mt-6 w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
      >
        Load More Activities...
      </button>

      {/* Modals */}
      {selectedActivity && (
        <EmailDetailModal
          isOpen={showEmailDetail}
          onClose={() => setShowEmailDetail(false)}
          email={{
            from: selectedActivity.from || 'john@acme.com',
            to: selectedActivity.to || 'you@company.com',
            subject: selectedActivity.subject || selectedActivity.title,
            date: `${selectedActivity.date} at ${selectedActivity.time}`,
            body: selectedActivity.body || selectedActivity.description || 'Email content not available.'
          }}
        />
      )}

      <ShareSummaryModal
        isOpen={showShareSummary}
        onClose={() => setShowShareSummary(false)}
        onShare={handleShareSummary}
      />

      <LogActivityModal
        isOpen={showLogActivity}
        onClose={() => setShowLogActivity(false)}
        onSave={handleLogActivity}
      />

      <MeetingSchedulerModal
        isOpen={showScheduleFollowup}
        onClose={() => setShowScheduleFollowup(false)}
        onSchedule={handleMeetingScheduled}
        attendees={['John Smith', 'Alex Rodriguez']}
      />
    </div>
  );
};
