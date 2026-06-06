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

  const perContactBuckets = useMemo(() => {
    if (!contacts) return [];
    return contacts.map(contact => ({
      contact,
      buckets: computeWeeklyBuckets(
        activities.filter(a => a.contactId === contact.id).map(a => a.isoDate),
      ),
    })).filter(row => row.buckets.some(b => b > 0));
  }, [activities, contacts]);

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

        {heatmapView === 'combined' ? (
          /* Combined bar chart — 8 cells, opacity-scaled, oldest on left */
          <div>
            <div className="flex items-end gap-1 h-10">
              {[...combinedBuckets].reverse().map((count, i) => {
                const maxCount = Math.max(...combinedBuckets, 1);
                const heightPct = Math.max((count / maxCount) * 100, count > 0 ? 15 : 0);
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col justify-end"
                    title={`${count} activit${count === 1 ? 'y' : 'ies'} (${7 - i} weeks ago)`}
                  >
                    <div
                      className="rounded-sm bg-blue-500 transition-all"
                      style={{ height: `${heightPct}%`, opacity: count > 0 ? 0.3 + 0.7 * (count / Math.max(...combinedBuckets, 1)) : 0.08 }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-gray-400">8 wks ago</span>
              <span className="text-[9px] text-gray-400">This week</span>
            </div>
          </div>
        ) : (
          /* Per-contact rows — each scaled to its own max */
          <div className="space-y-2">
            {perContactBuckets.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-2">No contact-tagged activities yet</div>
            ) : perContactBuckets.map(({ contact, buckets }) => {
              const maxCount = Math.max(...buckets, 1);
              return (
                <div key={contact.id} className="flex items-center gap-2">
                  <span className="w-20 text-xs text-gray-600 truncate flex-shrink-0">{contact.name.split(' ')[0]}</span>
                  <div className="flex items-end gap-0.5 h-6 flex-1">
                    {[...buckets].reverse().map((count, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end h-6" title={`${count} activit${count === 1 ? 'y' : 'ies'}`}>
                        <div
                          className="rounded-sm bg-blue-500 transition-all"
                          style={{
                            height: count > 0 ? `${Math.max((count / maxCount) * 100, 20)}%` : '4px',
                            opacity: count > 0 ? 0.3 + 0.7 * (count / maxCount) : 0.08,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end">
              <span className="text-[9px] text-gray-400">← 8 wks ago · This week →</span>
            </div>
          </div>
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

      {/* Activity List */}
      <div className="space-y-8">
        {filteredActivities.map((activity) => (
          <div key={activity.id}>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-px flex-1 bg-gray-300"></div>
              <span className="text-sm font-bold text-gray-700">{activity.date}</span>
              <div className="h-px flex-1 bg-gray-300"></div>
            </div>

            <div className="relative pl-8 pb-8 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
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
