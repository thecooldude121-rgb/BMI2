import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { fetchActivities, type ActivityRecord } from '../../utils/activitiesApi';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, TrendingUp, AlertTriangle, Calendar, Users, BarChart3, Building2, Search, Download, Upload, Settings, Phone, Mail, Video, CheckCircle, Clock, FileText } from 'lucide-react';

interface Activity {
  id: string;
  // The live activities_type_check allows 12 values, not 5. getActivityIcon and
  // getStatusBadge both take a string with a default case, so widening is safe.
  type:
    | 'meeting' | 'call' | 'email' | 'task' | 'note'
    | 'sms' | 'whatsapp' | 'linkedin' | 'demo' | 'proposal' | 'document' | 'visit';
  title: string;
  time: string;
  date: string;
  relatedTo: {
    account: string;
    deal?: string;
    dealAmount?: string;
    contact?: string;
  };
  owner: string;
  status: 'completed' | 'upcoming' | 'overdue' | 'sent';
  duration?: string;
  location?: string;
  outcome?: 'positive' | 'neutral' | 'negative';
  notes?: string;
  source?: string;
  hrmsConnection?: {
    contactName: string;
    recruitedDate: string;
    closeRate?: string;
  };
  emailTracking?: {
    delivered: string;
    opens: Array<{ time: string; number: number }>;
    attachmentOpened?: string;
    engagement: string;
    reply?: {
      time: string;
      text: string;
    };
  };
  aiSummary?: {
    budget?: string;
    timeline?: string;
    concerns?: string[];
    competitor?: string;
    sentiment?: string;
    actionItems?: Array<{ item: string; status: string; dueDate?: string }>;
    talkingPoints?: string[];
    crmUpdates?: Array<{ field: string; value: string }>;
  };
  aiInsight?: string;
  riskAlert?: {
    message: string;
    healthDrop: string;
    lossRate: string;
    recommendation: string;
  };
}

const ActivitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'timeline' | 'byType' | 'byOwner' | 'byAccount' | 'calendar'>('timeline');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('All');
  const [filterOwner, setFilterOwner] = useState('All');
  const [filterRelated, setFilterRelated] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilters, setQuickFilters] = useState<string[]>([]);

  // PHASE 2: the activity feed is real. Errors surface instead of collapsing
  // into an empty timeline.
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await fetchActivities({ limit: 200 }));
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.message ?? 'Could not load activities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadActivities(); }, [loadActivities]);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filterType !== 'All' ||
      filterDate !== 'All' ||
      filterOwner !== 'All' ||
      filterRelated !== 'All' ||
      filterStatus !== 'All' ||
      searchQuery.length > 0 ||
      quickFilters.length > 0
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilterType('All');
    setFilterDate('All');
    setFilterOwner('All');
    setFilterRelated('All');
    setFilterStatus('All');
    setSearchQuery('');
    setQuickFilters([]);
  };

  // PHASE 2: these were the literals 247 / 45 / 32 / 18 / 12 / 15, two of them
  // with invented "+12%" / "+45%" trends. Derived from the loaded activities now.
  // The trends stay null: a period-over-period comparison needs a second query,
  // and a made-up percentage is what Phase 0 removed everywhere else.
  // `trend` is typed explicitly: every value is null today, and without the
  // annotation TS narrows it to `never` and the render's stat.trend.startsWith
  // stops compiling. Typed so a real period-over-period trend can be added
  // without touching the render.
  const stats = useMemo((): Array<{ label: string; value: string; trend: string | null; alert?: boolean }> => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfToday.getDay());

    const when = (r: ActivityRecord) => r.completed_at ?? r.scheduled_at ?? r.created_at;
    const inRange = (r: ActivityRecord, from: Date) => new Date(when(r)) >= from;
    const isToday = (r: ActivityRecord) => inRange(r, startOfToday);

    return [
      { label: 'Total', value: String(records.length), trend: null },
      { label: 'Today', value: String(records.filter(isToday).length), trend: null },
      { label: 'This Week', value: String(records.filter(r => inRange(r, startOfWeek)).length), trend: null },
      {
        label: 'Overdue',
        value: String(records.filter(r =>
          r.status === 'planned' && r.scheduled_at && new Date(r.scheduled_at) < now).length),
        trend: null,
        alert: true,
      },
      { label: 'Meetings Today', value: String(records.filter(r => r.type === 'meeting' && isToday(r)).length), trend: null },
      { label: 'Calls Today', value: String(records.filter(r => r.type === 'call' && isToday(r)).length), trend: null },
    ];
  }, [records]);

  /**
   * PHASE 2: ~200 lines of inline fixture activities used to sit here. The
   * activities table now has an API, so this maps the real rows onto the shape
   * this page renders.
   *
   * The local Activity shape is much richer than the table: aiSummary,
   * emailTracking, hrmsConnection, riskAlert and aiInsight have no columns and no
   * data source. They are left ABSENT — every render site already guards with
   * `activity.x && ...`, so those panels simply do not appear. Do not fill them
   * with placeholders; that is what Phase 0 spent its time removing.
   */
  const activities: Activity[] = useMemo(() => records.map((r): Activity => {
    const stamp = r.completed_at ?? r.scheduled_at ?? r.created_at;
    const d = new Date(stamp);
    const now = new Date();

    // Local status vocabulary is completed | upcoming | overdue | sent, which is
    // not the DB's. 'sent' is email-specific and not represented server-side.
    let status: Activity['status'];
    if (r.status === 'completed') status = 'completed';
    else if (r.scheduled_at && new Date(r.scheduled_at) < now) status = 'overdue';
    else status = 'upcoming';

    return {
      id: r.id,
      type: (r.type ?? 'note') as Activity['type'],
      title: r.subject,
      time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
      date: d.toLocaleDateString(),
      relatedTo: {
        // The server joins these, so no extra request per row.
        account: r.company_name ?? '',
        deal: r.deal_name ?? undefined,
        contact: r.contact_name?.trim() || r.lead_name || undefined,
      },
      owner: r.assigned_to ?? 'Unassigned',
      status,
      duration: r.duration != null ? `${r.duration} min` : undefined,
      // outcome is free text in the database; the local field is a
      // positive/neutral/negative enum, so the text goes to notes rather than
      // being coerced into a sentiment it does not express.
      notes: [r.description, r.outcome].filter(Boolean).join(' — ') || undefined,
    };
  }), [records]);

  /**
   * Group activities by calendar day, newest day first, naming today and
   * yesterday. Replaces four hardcoded date buckets.
   */
  const activityGroups = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const byDay = new Map<string, { key: string; label: string; sortKey: number; items: Activity[] }>();

    records.forEach((r, idx) => {
      const activity = activities[idx];
      if (!activity) return;
      const when = new Date(r.completed_at ?? r.scheduled_at ?? r.created_at);
      const dayStart = new Date(when.getFullYear(), when.getMonth(), when.getDate());
      const key = dayStart.toISOString().slice(0, 10);

      let label: string;
      if (dayStart.getTime() === startOfToday.getTime()) {
        label = `TODAY (${dayStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
      } else if (dayStart.getTime() === startOfYesterday.getTime()) {
        label = `YESTERDAY (${dayStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
      } else {
        label = dayStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }

      const existing = byDay.get(key);
      if (existing) existing.items.push(activity);
      else byDay.set(key, { key, label, sortKey: dayStart.getTime(), items: [activity] });
    });

    return Array.from(byDay.values()).sort((a, b) => b.sortKey - a.sortKey);
  }, [records, activities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Video className="w-5 h-5" />;
      case 'call': return <Phone className="w-5 h-5" />;
      case 'email': return <Mail className="w-5 h-5" />;
      case 'task': return <CheckCircle className="w-5 h-5" />;
      case 'note': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-600 text-sm font-medium">✅ Completed</span>;
      case 'upcoming':
        return <span className="text-blue-600 text-sm font-medium">🟢 Upcoming</span>;
      case 'overdue':
        return <span className="text-red-600 text-sm font-medium">⚠️ Overdue</span>;
      case 'sent':
        return <span className="text-green-600 text-sm font-medium">✅ Sent & Opened</span>;
      default:
        return null;
    }
  };

  const renderActivityCard = (activity: Activity) => {
    return (
      <div key={activity.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            {getActivityIcon(activity.type)}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>

            {activity.hrmsConnection && (
              <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="font-semibold text-purple-900 mb-1">🏢 HRMS CONNECTION</div>
                <div className="text-sm text-purple-800">
                  ✨ Recruited: {activity.hrmsConnection.contactName} - {activity.hrmsConnection.recruitedDate}
                </div>
                {activity.hrmsConnection.closeRate && (
                  <div className="text-sm text-purple-800">💡 {activity.hrmsConnection.closeRate} close rate</div>
                )}
              </div>
            )}

            <div className="space-y-2 text-sm text-gray-600 mb-3">
              <div>
                <span className="font-medium">Related To:</span>{' '}
                <button
                  onClick={() => navigate('/crm/accounts')}
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  {activity.relatedTo.account}
                </button>
                {activity.relatedTo.deal && (
                  <>
                    {' '}(
                    <button
                      onClick={() => navigate('/crm/deals')}
                      className="text-green-600 hover:text-green-800 hover:underline font-medium"
                    >
                      {activity.relatedTo.deal}
                    </button>)
                  </>
                )}
                {activity.relatedTo.contact && (
                  <>
                    {' '}&gt;{' '}
                    <button
                      onClick={() => navigate('/crm/contacts')}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {activity.relatedTo.contact}
                    </button>
                  </>
                )}
              </div>

              {activity.duration && (
                <div><span className="font-medium">Duration:</span> {activity.duration}</div>
              )}

              {activity.location && (
                <div><span className="font-medium">Location:</span> {activity.location}</div>
              )}

              {activity.notes && (
                <div className="italic text-gray-700">"{activity.notes}"</div>
              )}
            </div>

            {activity.emailTracking && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
                <div className="font-semibold text-gray-900">📊 Email Tracking:</div>
                <div>✅ Delivered: {activity.emailTracking.delivered}</div>
                {activity.emailTracking.opens.map((open, idx) => (
                  <div key={idx}>✅ Opened: {open.time}</div>
                ))}
                {activity.emailTracking.attachmentOpened && (
                  <div>📎 Attachment opened: {activity.emailTracking.attachmentOpened}</div>
                )}
                {activity.emailTracking.reply && (
                  <>
                    <div>✅ Replied: {activity.emailTracking.reply.time}</div>
                    <div className="mt-2 p-2 bg-white border border-gray-200 rounded italic text-gray-700">
                      {activity.emailTracking.reply.text}
                    </div>
                  </>
                )}
                {!activity.emailTracking.reply && (
                  <div className="mt-2 font-medium">Engagement: {activity.emailTracking.engagement}</div>
                )}
              </div>
            )}

            {activity.aiSummary && (
              <div className="mb-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="font-semibold text-purple-900 mb-3">🤖 AI MEETING SUMMARY</div>

                <div className="mb-3">
                  <div className="font-medium text-purple-900 mb-1">Key Points:</div>
                  <div className="space-y-1 text-sm text-purple-800">
                    {activity.aiSummary.budget && (
                      <div>• Budget {activity.aiSummary.budget} ✅</div>
                    )}
                    {activity.aiSummary.timeline && (
                      <div>• Timeline: {activity.aiSummary.timeline}</div>
                    )}
                    {activity.aiSummary.concerns && activity.aiSummary.concerns.length > 0 && (
                      <div>• Concerns: {activity.aiSummary.concerns.join(', ')}</div>
                    )}
                    {activity.aiSummary.competitor && (
                      <div>• Competitor: {activity.aiSummary.competitor}</div>
                    )}
                    {activity.aiSummary.sentiment && (
                      <div>• CEO approval needed</div>
                    )}
                  </div>
                </div>

                {activity.aiSummary.sentiment && (
                  <div className="mb-3 text-sm">
                    <span className="font-medium text-purple-900">Sentiment:</span> 😊 {activity.aiSummary.sentiment}
                  </div>
                )}

                {activity.aiSummary.actionItems && activity.aiSummary.actionItems.length > 0 && (
                  <div className="mb-3">
                    <div className="font-medium text-purple-900 mb-1">Action Items:</div>
                    <div className="space-y-1 text-sm text-purple-800">
                      {activity.aiSummary.actionItems.map((item, idx) => (
                        <div key={idx}>
                          {item.status === 'Done' ? '✅' : '⏳'} {item.item}
                          {item.dueDate && ` - ${item.status === 'Done' ? 'Done' : 'Due'} ${item.dueDate}`}
                          {!item.dueDate && item.status === 'Done' && ' - Completed'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activity.aiSummary.talkingPoints && activity.aiSummary.talkingPoints.length > 0 && (
                  <div className="mb-3">
                    <div className="font-medium text-purple-900 mb-1">Next Meeting Talking Points:</div>
                    <div className="space-y-1 text-sm text-purple-800">
                      {activity.aiSummary.talkingPoints.map((point, idx) => (
                        <div key={idx}>• {point}</div>
                      ))}
                    </div>
                  </div>
                )}

                {activity.aiSummary.crmUpdates && activity.aiSummary.crmUpdates.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <div className="font-medium text-purple-900 mb-1">CRM Auto-Updated:</div>
                    <div className="space-y-1 text-sm text-purple-800">
                      {activity.aiSummary.crmUpdates.map((update, idx) => (
                        <div key={idx}>• {update.field}: {update.value} ✅</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activity.riskAlert && (
              <div className="mb-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="font-semibold text-red-900 mb-2">🤖 AI RISK ALERT: {activity.riskAlert.message}</div>
                <div className="space-y-1 text-sm text-red-800">
                  <div>• No activity in 7 days (last: Nov 30)</div>
                  <div>• Deal health: {activity.riskAlert.healthDrop}</div>
                  <div>• Similar delays = {activity.riskAlert.lossRate}</div>
                  <div>• RECOMMENDED: {activity.riskAlert.recommendation}</div>
                </div>
              </div>
            )}

            {activity.aiInsight && (
              <div className="mb-3 p-2 bg-purple-50 rounded text-sm text-purple-900">
                🤖 AI: {activity.aiInsight}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="font-medium">Owner:</span> {activity.owner}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {getStatusBadge(activity.status)}
                </div>
                {activity.source && (
                  <div>
                    <span className="font-medium">Source:</span> {activity.source}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {activity.type === 'meeting' && activity.status === 'upcoming' && (
                  <>
                    <Button
                      onClick={() => {
                        if (activity.location?.includes('Zoom')) {
                          window.open('https://zoom.us/start', '_blank');
                        } else if (activity.location?.includes('Meet')) {
                          window.open('https://meet.google.com/', '_blank');
                        } else {
                          alert(`Opening meeting: ${activity.location || 'Virtual'}`);
                        }
                      }}
                      size="sm"
                    >
                      Join Meeting
                    </Button>
                    <button
                      onClick={() => navigate(`/crm/activities/${activity.id}`)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => alert('Reschedule functionality coming soon')}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Cancel meeting: ${activity.title}?`)) {
                          alert('Meeting cancelled');
                        }
                      }}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {activity.type === 'call' && activity.status === 'completed' && (
                  <>
                    <button
                      onClick={() => navigate(`/crm/activities/${activity.id}`)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => alert('Log Follow-up task functionality coming soon')}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      Log Follow-up
                    </button>
                    {activity.aiInsight && activity.aiInsight.includes('case study') && (
                      <button
                        onClick={() => alert('Opening email composer with case study attached...')}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                      >
                        Send Case Study Now
                      </button>
                    )}
                  </>
                )}

                {activity.type === 'email' && activity.status === 'sent' && (
                  <>
                    <button
                      onClick={() => navigate(`/crm/activities/${activity.id}`)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => alert('Opening email composer...')}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      Send Follow-up
                    </button>
                    <button
                      onClick={() => navigate('/crm/calendar')}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      Schedule Meeting
                    </button>
                  </>
                )}

                {activity.type === 'email' && activity.emailTracking?.reply && (
                  <>
                    <button
                      onClick={() => alert('Opening email conversation thread...')}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      View Conversation
                    </button>
                    <button
                      onClick={() => navigate('/crm/calendar')}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                    >
                      Schedule Meeting
                    </button>
                    <button
                      onClick={() => navigate('/crm/deals')}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      View Deal
                    </button>
                  </>
                )}

                {activity.type === 'task' && activity.status === 'completed' && (
                  <button
                    onClick={() => navigate(`/crm/activities/${activity.id}`)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    View Details
                  </button>
                )}

                {activity.type === 'task' && activity.status === 'overdue' && (
                  <>
                    <button
                      onClick={() => alert('Task marked as complete!')}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => alert('Reschedule task functionality coming soon')}
                      className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm font-medium"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => navigate('/crm/contacts')}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                    >
                      Contact Now
                    </button>
                    <button
                      onClick={() => alert('Escalate task to manager')}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      Escalate
                    </button>
                  </>
                )}

                {activity.type === 'meeting' && activity.status === 'completed' && activity.aiSummary && (
                  <>
                    <button
                      onClick={() => alert('Opening meeting transcript...')}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      View Transcript
                    </button>
                    <button
                      onClick={() => alert('Opening meeting recording...')}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      Play Recording
                    </button>
                    <button
                      onClick={() => navigate('/crm/deals')}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      View Deal
                    </button>
                  </>
                )}

                {activity.type === 'note' && (
                  <>
                    <button
                      onClick={() => navigate(`/crm/activities/${activity.id}`)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => alert('Edit note functionality coming soon')}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      Edit Note
                    </button>
                    <button
                      onClick={() => alert('Note shared with team!')}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      Share with Team
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              ⚡ Activities
            </h1>
            <p className="text-gray-600 mt-1">Track all customer interactions across your CRM</p>
          </div>
          <div className="flex gap-3">
            <Button >
              <Plus className="w-5 h-5" />
              Log Activity
            </Button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          {stats.map((stat, idx) => (
            <div key={idx} className={`bg-white rounded-lg border p-4 ${stat.alert ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
              <div className={`text-3xl font-bold mb-1 ${stat.alert ? 'text-orange-600' : 'text-gray-900'}`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
              {stat.trend && (
                <div className={`text-xs font-medium ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend}
                </div>
              )}
              {stat.alert && (
                <div className="text-xs font-medium text-orange-600">⚠️</div>
              )}
            </div>
          ))}
        </div>

        {/*
          PREVIEW PANEL — every figure below is a hardcoded literal.
          "32 activities, up 45%" and "18 overdue" sit directly above stat cards
          reading 0 Total and 0 Overdue, because `activities` has no rows. The
          contradiction is the tell.

          Labelled rather than removed or built, which is the treatment the owner
          settled on for the gamification panel and the CRMDashboard panels: AI
          features are Phase 2 per CLAUDE.md, so making these real is out of
          scope, and an unlabelled invented metric is the defect this project has
          spent several sessions removing. It became urgent when this page was
          added to the sidebar — until then nothing linked here.
        */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 mb-6 text-white">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <TrendingUp className="w-6 h-6" />
            <h2 className="text-xl font-bold">🤖 AI INSIGHTS</h2>
            <span className="ml-1 rounded border border-white/40 bg-white/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
              Preview · Sample content
            </span>
          </div>
          <p className="mb-4 text-sm text-white/80">
            These figures are examples, not calculated from your data. Your real activity
            counts are in the cards above.
          </p>

          <div className="space-y-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold mb-1">📈 High engagement: 32 activities, up 45%</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 text-sm font-medium">
                    View Activity Trends
                  </button>
                  <button className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 text-sm font-medium">
                    View Breakdown
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold mb-1">⏰ 18 overdue - Oldest: Acme 5 days</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 text-sm font-medium">
                    View Overdue
                  </button>
                  <button className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 text-sm font-medium">
                    Bulk Reschedule
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold mb-2">🏢 HRMS: 92% completion vs 67% others</div>
                  <div className="text-sm">TechStart: 15 activities 100%, DataFlow: 12 100%</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 text-sm font-medium">
                    View HRMS Activities
                  </button>
                  <button className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 text-sm font-medium">
                    View HRMS Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-5 gap-4 mb-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Type: All</option>
              <option>Meetings</option>
              <option>Calls</option>
              <option>Emails</option>
              <option>Tasks</option>
              <option>Notes</option>
            </select>

            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Date: All</option>
              <option>Today</option>
              <option>Yesterday</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Custom Range</option>
            </select>

            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Owner: All</option>
              <option>Alex Rodriguez</option>
              <option>Sarah Chen</option>
              <option>Mike Johnson</option>
            </select>

            <select
              value={filterRelated}
              onChange={(e) => setFilterRelated(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Related: All</option>
              <option>Accounts</option>
              <option>Deals</option>
              <option>Contacts</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Status: All</option>
              <option>Completed</option>
              <option>Upcoming</option>
              <option>Overdue</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                viewMode === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              Timeline
            </button>
            <button
              onClick={() => setViewMode('byType')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                viewMode === 'byType'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              By Type
            </button>
            <button
              onClick={() => setViewMode('byOwner')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                viewMode === 'byOwner'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              By Owner
            </button>
            <button
              onClick={() => setViewMode('byAccount')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                viewMode === 'byAccount'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              By Account
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">Quick Filters:</span>
              <button className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                My Open Tasks
                <span className="ml-1 px-1.5 py-0.5 bg-brand-600 text-white rounded text-xs">8</span>
              </button>
              <button className="px-3 py-1.5 bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100 text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overdue
                <span className="ml-1 px-1.5 py-0.5 bg-orange-600 text-white rounded text-xs">18</span>
              </button>
              <button className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center gap-2">
                <Video className="w-4 h-4" />
                Today's Meetings
                <span className="ml-1 px-1.5 py-0.5 bg-brand-600 text-white rounded text-xs">12</span>
              </button>
              <button className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                This Week
                <span className="ml-1 px-1.5 py-0.5 bg-brand-600 text-white rounded text-xs">32</span>
              </button>
              <button className="px-3 py-1.5 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                HRMS Activities
                <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white rounded text-xs">27</span>
              </button>
            </div>
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Empty State - No Activities at All */}
        {activities.length === 0 && !hasActiveFilters() && (
          <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
            <div className="text-gray-400 mb-6 text-6xl">
              📭
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Activities Found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by logging your first customer interaction or import from connected tools
            </p>

            <Button size="xl" className="mb-8">
              <Plus className="w-5 h-5" />
              Log Activity
            </Button>

            <div className="mb-8">
              <div className="text-sm text-gray-500 mb-4 flex items-center gap-3 justify-center">
                <div className="flex-1 h-px bg-gray-300 max-w-xs"></div>
                <span>Or import from:</span>
                <div className="flex-1 h-px bg-gray-300 max-w-xs"></div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Google Calendar
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Gmail
                </button>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  CSV
                </button>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 max-w-lg mx-auto">
              <div className="text-lg font-semibold text-blue-900 mb-3">💡 Quick Tips:</div>
              <ul className="text-left text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Log meetings to track customer conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Connect your calendar to sync automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Import past activities to see full history</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Filtered Empty State - No Results for Current Filters */}
        {activities.length === 0 && hasActiveFilters() && (
          <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
            <div className="text-gray-400 mb-6 text-6xl">
              🔍
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No Activities Match Your Filters
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search query
            </p>

            <Button
              onClick={clearAllFilters}
              size="xl" className="mb-8"
            >
              Clear All Filters
            </Button>

            <div className="bg-gray-50 rounded-lg p-6 max-w-lg mx-auto">
              <div className="text-sm font-semibold text-gray-700 mb-3">Active Filters:</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {filterType !== 'All' && (
                  <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700 flex items-center gap-2">
                    Type: {filterType}
                    <button onClick={() => setFilterType('All')} className="text-gray-500 hover:text-gray-700">×</button>
                  </span>
                )}
                {filterDate !== 'All' && (
                  <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700 flex items-center gap-2">
                    Date: {filterDate}
                    <button onClick={() => setFilterDate('All')} className="text-gray-500 hover:text-gray-700">×</button>
                  </span>
                )}
                {filterOwner !== 'All' && (
                  <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700 flex items-center gap-2">
                    Owner: {filterOwner}
                    <button onClick={() => setFilterOwner('All')} className="text-gray-500 hover:text-gray-700">×</button>
                  </span>
                )}
                {filterRelated !== 'All' && (
                  <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700 flex items-center gap-2">
                    Related: {filterRelated}
                    <button onClick={() => setFilterRelated('All')} className="text-gray-500 hover:text-gray-700">×</button>
                  </span>
                )}
                {filterStatus !== 'All' && (
                  <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700 flex items-center gap-2">
                    Status: {filterStatus}
                    <button onClick={() => setFilterStatus('All')} className="text-gray-500 hover:text-gray-700">×</button>
                  </span>
                )}
                {searchQuery && (
                  <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700 flex items-center gap-2">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-gray-700">×</button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'timeline' && (
          <>
            {/* Three distinct states. A failed fetch must not read as "no activity". */}
            {loadError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4">
                <p className="text-sm font-medium text-red-800">Could not load activities</p>
                <p className="mt-1 text-sm text-red-700">{loadError}</p>
              </div>
            )}
            {loading && !loadError && (
              <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
                Loading activities…
              </div>
            )}
            {!loading && !loadError && activities.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center">
                <p className="text-sm font-medium text-gray-900">No activity logged yet</p>
                <p className="mt-1 text-sm text-gray-600">
                  Calls, emails and meetings logged against a lead, deal, contact or account appear here.
                </p>
              </div>
            )}

            {/* PHASE 2: the timeline used to be four hardcoded groups filtered by
                the literal strings 'Today', 'Yesterday', 'Dec 5' and 'Dec 4',
                with a footer reading "Showing 9 of 247". Real dates never match
                those, so the feed would have rendered empty. Grouped by actual
                day now, newest first, with Today/Yesterday named as such. */}
            {!loading && !loadError && activityGroups.length > 0 && (
              <div className="space-y-6">
                {activityGroups.map(group => (
                  <div key={group.key}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-gray-400"></div>
                      <h2 className="text-base font-bold text-gray-900 tracking-wider px-3">{group.label}</h2>
                      <div className="flex-1 h-0.5 bg-gradient-to-l from-transparent via-gray-400 to-gray-400"></div>
                    </div>
                    <div className="space-y-4">
                      {group.items.map(renderActivityCard)}
                    </div>
                  </div>
                ))}
                <div className="text-center py-6 text-sm text-gray-500">
                  Showing {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivitiesPage;
