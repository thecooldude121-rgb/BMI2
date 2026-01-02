import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Plus,
  MoreVertical,
  Video,
  Phone,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Zap,
  BarChart3,
  Target,
  Search,
  Filter,
  Download,
  List,
  Play,
  FileText,
  MapPin,
  Building2,
  DollarSign,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Edit,
  Trash2,
  Share2,
  X
} from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { sampleMeetings, meetingStats, aiInsights } from '../../utils/sampleMeetingsData';
import { Meeting, MeetingFilters } from '../../types/meeting';
import ScheduleMeetingModal from '../../components/Meeting/ScheduleMeetingModal';
import RecordingPlayerModal from '../../components/Meeting/RecordingPlayerModal';
import ActionItemsPanel from '../../components/Meeting/ActionItemsPanel';
import HRMSConnectionModal from '../../components/Meeting/HRMSConnectionModal';
import BulkTaskCreatorModal from '../../components/Meeting/BulkTaskCreatorModal';
import PrepNotesModal from '../../components/Meeting/PrepNotesModal';
import { useToast } from '../../contexts/ToastContext';

export default function MeetingsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [filters, setFilters] = useState<MeetingFilters>({
    timeRange: 'all',
    status: 'all',
    type: 'all',
    aiStatus: 'all',
    searchQuery: ''
  });

  const [modals, setModals] = useState({
    scheduleMeeting: false,
    recordingPlayer: false,
    actionItems: false,
    hrmsConnection: false,
    bulkTaskCreator: false,
    moreOptions: false,
    prepNotes: false
  });

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; meeting: Meeting } | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [highlightedMeetings, setHighlightedMeetings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredMeetings = useMemo(() => {
    let filtered = [...sampleMeetings];

    if (filters.status !== 'all') {
      filtered = filtered.filter(m => m.status === filters.status);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(m => m.type === filters.type);
    }

    if (filters.aiStatus !== 'all') {
      filtered = filtered.filter(m => m.aiProcessingStatus === filters.aiStatus);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(query) ||
        m.attendees.some(a => a.name.toLowerCase().includes(query)) ||
        m.dealTitle?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [filters]);

  const liveMeetings = filteredMeetings.filter(m => m.status === 'live');
  const todayMeetings = filteredMeetings.filter(m => {
    const meetingDate = new Date(m.startTime);
    const today = new Date();
    return m.status === 'completed' &&
      meetingDate.toDateString() === today.toDateString();
  });
  const upcomingMeetings = filteredMeetings.filter(m => m.status === 'upcoming');
  const yesterdayMeetings = filteredMeetings.filter(m => {
    const meetingDate = new Date(m.startTime);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return m.status === 'completed' &&
      meetingDate.toDateString() === yesterday.toDateString();
  });
  const olderMeetings = filteredMeetings.filter(m => {
    const meetingDate = new Date(m.startTime);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const today = new Date();
    return m.status === 'completed' &&
      meetingDate < yesterday &&
      meetingDate.toDateString() !== today.toDateString();
  });

  const getTimeDisplay = (meeting: Meeting) => {
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);
    const now = new Date();

    if (meeting.status === 'live') {
      const minutesAgo = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
      return `Started: ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} (${minutesAgo} minutes ago)`;
    }

    if (meeting.status === 'upcoming') {
      const hoursUntil = Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60));
      const minutesUntil = Math.floor((start.getTime() - now.getTime()) / (1000 * 60));

      if (hoursUntil >= 24) {
        return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
      } else if (hoursUntil > 0) {
        return `⏰ In ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`;
      } else if (minutesUntil > 0) {
        return `⏰ In ${minutesUntil} minutes`;
      } else {
        return 'Starting now';
      }
    }

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} (${meeting.duration} mins)`;
  };

  const getMeetingIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" style={{ color: '#3b82f6' }} />;
      case 'call':
        return <Phone className="h-4 w-4" style={{ color: '#10b981' }} />;
      case 'in-person':
        return <Users className="h-4 w-4" style={{ color: '#f59e0b' }} />;
      default:
        return <Calendar className="h-4 w-4" />;
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

  const handleStatsClick = (type: string) => {
    switch (type) {
      case 'upcoming-week':
        setFilters({ ...filters, status: 'upcoming', timeRange: 'this-week' });
        break;
      case 'recorded':
        setFilters({ ...filters, status: 'completed' });
        break;
      case 'live':
        setFilters({ ...filters, status: 'live' });
        document.getElementById('live-section')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'ai-processed':
        setFilters({ ...filters, aiStatus: 'processed' });
        break;
      case 'this-week':
        setFilters({ ...filters, timeRange: 'this-week' });
        break;
      default:
        setFilters({ ...filters, status: 'all', timeRange: 'all', aiStatus: 'all' });
    }
  };

  const handleFollowUpMeetingsClick = () => {
    const meetingIds = ['meeting_acme_001', 'meeting_techstart_002', 'meeting_bigco_upcoming_001'];
    setHighlightedMeetings(meetingIds);
    setFilters({ ...filters, searchQuery: '' });
    setTimeout(() => setHighlightedMeetings([]), 5000);
  };

  const handleCreateBulkTasks = () => {
    setModals({ ...modals, bulkTaskCreator: true });
  };

  const handleOpenRecording = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setModals({ ...modals, recordingPlayer: true });
  };

  const handleOpenActionItems = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setModals({ ...modals, actionItems: true });
  };

  const handleOpenHRMSModal = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setModals({ ...modals, hrmsConnection: true });
  };

  const handleOpenPrepNotes = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setModals({ ...modals, prepNotes: true });
  };

  const handleAddToCalendar = (meeting: Meeting) => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${meeting.title}
DTSTART:${new Date(meeting.startTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(meeting.endTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DESCRIPTION:${meeting.notes || ''}
LOCATION:${meeting.location || ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meeting.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Calendar event downloaded', 'success');
  };

  const handleGetDirections = (meeting: Meeting) => {
    if (meeting.location) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meeting.location)}`;
      window.open(mapsUrl, '_blank');
      showToast('Opening Google Maps...', 'info');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, meeting: Meeting) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, meeting });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const hasActiveFilters = () => {
    return filters.status !== 'all' ||
           filters.type !== 'all' ||
           filters.aiStatus !== 'all' ||
           filters.searchQuery !== '';
  };

  const clearAllFilters = () => {
    setFilters({
      timeRange: 'all',
      status: 'all',
      type: 'all',
      aiStatus: 'all',
      searchQuery: ''
    });
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    showToast('Opening meeting...', 'info');
    if (meeting.meetingUrl) {
      window.open(meeting.meetingUrl, '_blank');
    }
  };

  React.useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const MeetingCard = ({ meeting }: { meeting: Meeting }) => {
    const isLive = meeting.status === 'live';
    const isUpcoming = meeting.status === 'upcoming';
    const isProcessing = meeting.aiProcessingStatus === 'processing';
    const isProcessed = meeting.aiProcessingStatus === 'processed';
    const isHighlighted = highlightedMeetings.includes(meeting.id);

    return (
      <div
        className={`bg-white rounded-lg border p-5 hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative ${
          isLive ? 'border-l-4 border-l-red-600 border-r border-r-gray-200 border-t border-t-gray-200 border-b border-b-gray-200 shadow-md' : isHighlighted ? 'border-orange-400 border-2 shadow-lg' : 'border-gray-200'
        }`}
        onClick={() => navigate(`/crm/meetings/${meeting.id}`)}
        onContextMenu={(e) => handleContextMenu(e, meeting)}
      >
        {meeting.hrmsConnected && (
          <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" title="HRMS Connected" />
        )}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {isLive && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#dc2626' }} />
                LIVE
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              {getMeetingIcon(meeting.type)}
              <span className="text-sm font-medium capitalize">{meeting.type === 'in-person' ? 'In-Person' : meeting.type === 'video' ? 'Video Call' : 'Call'}</span>
            </div>
            {isUpcoming && meeting.prepNotes && meeting.prepNotes.length > 0 && (
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {getTimeDisplay(meeting)}
              </div>
            )}
            {isProcessed && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#d1fae5', color: '#047857' }}>
                <CheckCircle className="h-3.5 w-3.5" />
                AI Processed ✓
              </div>
            )}
            {isProcessing && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#e0e7ff', color: '#667eea' }}>
                <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: '#667eea', borderTopColor: 'transparent' }} />
                Processing... {meeting.aiProcessingProgress}%
              </div>
            )}
          </div>
        </div>

        <h3 className="font-bold mb-2" style={{ fontSize: '18px', color: '#333' }}>{meeting.title}</h3>
        <p className="mb-4" style={{ fontSize: '14px', color: '#666' }}>{getTimeDisplay(meeting)}</p>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2" style={{ fontSize: '13px', color: '#888' }}>
            <Users className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span>
              Attendees:{' '}
              {meeting.attendees.map((a, i) => (
                <span key={a.id}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/crm/contacts/${a.id}`);
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    {a.name}
                  </button>
                  {a.title && (
                    <span className="text-gray-600"> ({a.title})</span>
                  )}
                  {i < meeting.attendees.length - 1 && ', '}
                </span>
              ))}
            </span>
          </div>

          {meeting.dealTitle && (
            <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#888' }}>
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span>
                Deal:{' '}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/crm/deals/${meeting.dealId || 'deal-acme'}`);
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  {meeting.dealTitle} - ${(meeting.dealValue! / 1000).toFixed(0)}K
                </button>
                <span className="text-gray-600"> ({meeting.dealStage})</span>
              </span>
            </div>
          )}

          {meeting.accountName && (
            <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#888' }}>
              <Building2 className="h-4 w-4 text-gray-400" />
              <span>
                Account:{' '}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/crm/accounts/${meeting.accountId || 'account-acme'}`);
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  {meeting.accountName}
                </button>
              </span>
            </div>
          )}

          {meeting.hrmsConnected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenHRMSModal(meeting);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:shadow-md border"
              style={{
                backgroundColor: '#fff3cd',
                borderColor: '#ff9800',
                fontSize: '13px'
              }}
            >
              <Building2 className="h-4 w-4" style={{ color: '#ff9800' }} />
              <span className="font-medium" style={{ color: '#ff9800' }}>
                🏢 HRMS Connected {meeting.hrmsRecruitedDate && `- Recruited ${new Date(meeting.hrmsRecruitedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
              </span>
            </button>
          )}

          {meeting.location && (
            <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#888' }}>
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>Location: {meeting.location}</span>
            </div>
          )}
        </div>

        {isProcessing && meeting.aiProcessingProgress && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold text-amber-900">
                🤖 AI processing... {meeting.aiProcessingProgress}%
              </span>
            </div>
            <div className="relative w-full h-2 bg-amber-200 rounded-full overflow-hidden mb-2">
              <div
                className="absolute top-0 left-0 h-full bg-amber-600 transition-all duration-300"
                style={{ width: `${meeting.aiProcessingProgress}%` }}
              />
            </div>
            <p className="text-xs text-amber-700">
              Transcript ready in {Math.ceil((100 - meeting.aiProcessingProgress) / 20)} mins
            </p>
          </div>
        )}

        {isLive && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-sm text-red-700 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-medium">Recording in progress...</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-red-600">
              <Sparkles className="h-4 w-4" />
              <span>AI transcribing live</span>
            </div>
          </div>
        )}

        {isUpcoming && meeting.prepNotes && meeting.prepNotes.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-3">
              <Sparkles className="h-4 w-4" />
              Prep Tips:
            </div>
            <ul className="space-y-1.5">
              {meeting.prepNotes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-blue-700">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isProcessed && meeting.aiSummary && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2" style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
              <Sparkles className="h-4 w-4" style={{ color: '#667eea' }} />
              AI Summary:
            </div>
            <p className="mb-3" style={{ fontSize: '14px', color: '#555' }}>{meeting.aiSummary.summary}</p>

            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  backgroundColor: meeting.aiSummary.sentiment === 'positive' ? '#d1fae5' : meeting.aiSummary.sentiment === 'negative' ? '#fee2e2' : '#fef3c7',
                  fontSize: '13px'
                }}
              >
                <span className="text-lg">{getSentimentEmoji(meeting.aiSummary.sentiment)}</span>
                <span className="font-medium capitalize">{meeting.aiSummary.sentiment}</span>
                <span style={{ color: '#666' }}>({meeting.aiSummary.sentimentScore}%)</span>
              </div>
            </div>

            {meeting.aiSummary.actionItems.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenActionItems(meeting);
                }}
                className="flex items-center gap-2 font-medium hover:shadow-md px-3 py-2 rounded-lg transition-all border"
                style={{
                  fontSize: '13px',
                  color: '#667eea',
                  backgroundColor: '#f5f7ff',
                  borderColor: '#667eea'
                }}
              >
                <CheckCircle className="h-4 w-4" />
                <span>{meeting.aiSummary.actionItems.length} action items {meeting.aiSummary.actionItems.every(a => a.completed) ? 'completed' : 'created automatically'}</span>
              </button>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 text-sm text-amber-700 mb-2">
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span className="font-medium">AI processing... Transcript ready in 5 mins</span>
            </div>
            {meeting.hasRecording && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Play className="h-4 w-4" />
                <span>Recording: {meeting.recordingDuration} mins</span>
              </div>
            )}
          </div>
        )}

        {(meeting.hasTranscript || meeting.hasRecording || (!meeting.hasRecording && meeting.status === 'completed' && !isProcessing)) && (
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
            {meeting.hasRecording ? (
              <div className="flex items-center gap-1.5">
                <Play className="h-4 w-4" />
                <span>Recording: {meeting.recordingDuration} mins</span>
              </div>
            ) : (meeting.status === 'completed' && !isProcessing && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <Play className="h-4 w-4" />
                <span>Recording: Not available</span>
              </div>
            ))}
            {meeting.hasTranscript && (
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>Transcript available{meeting.notes ? ' (from notes)' : ''}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          {isLive ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinMeeting(meeting);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Join Meeting
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/crm/meetings/${meeting.id}/transcript`);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                View Live Transcript
              </button>
            </>
          ) : isUpcoming ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (meeting.type === 'in-person') {
                    navigate(`/crm/meetings/${meeting.id}`);
                  } else {
                    handleJoinMeeting(meeting);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {meeting.type === 'in-person' ? 'View Details' : 'Join Early'}
              </button>
              {meeting.prepNotes && meeting.prepNotes.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenPrepNotes(meeting);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  View Prep Notes
                </button>
              )}
              {meeting.type === 'in-person' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGetDirections(meeting);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Get Directions
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast('Reschedule functionality coming soon', 'info');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Reschedule
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCalendar(meeting);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Add to Calendar
              </button>
            </>
          ) : isProcessing ? (
            <>
              <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                View Details
              </button>
              <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed" disabled>
                Wait for AI Summary
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/crm/meetings/${meeting.id}`);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Details
              </button>
              {meeting.hasRecording && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenRecording(meeting);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Play Recording
                </button>
              )}
              {meeting.hasTranscript && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/crm/meetings/${meeting.id}/transcript`);
                  }}
                  className={`${meeting.hasRecording ? '' : 'flex-1'} px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2`}
                >
                  <FileText className="h-4 w-4" />
                  View Transcript
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
            </div>
            <p className="text-gray-600">Manage your meetings and AI-powered insights</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModals({ ...modals, scheduleMeeting: true })}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Schedule Meeting
            </button>
            <div className="relative">
              <button
                onClick={() => setModals({ ...modals, moreOptions: !modals.moreOptions })}
                className="p-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
              {modals.moreOptions && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export All Meetings (CSV)
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Calendar Sync Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Recording Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Processing Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    View Archived Meetings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-8">
          <button
            onClick={() => handleStatsClick('all')}
            className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-all text-left cursor-pointer hover:border-gray-300"
          >
            <div className="text-3xl font-bold text-gray-900 mb-1">{meetingStats.totalMeetings}</div>
            <div className="text-sm text-gray-600">Total Meetings</div>
          </button>
          <button
            onClick={() => handleStatsClick('upcoming-week')}
            className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-all text-left cursor-pointer hover:border-blue-300"
          >
            <div className="text-3xl font-bold text-blue-600 mb-1">{meetingStats.upcomingThisWeek}</div>
            <div className="text-sm text-gray-600">Upcoming This Week</div>
          </button>
          <button
            onClick={() => handleStatsClick('recorded')}
            className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-all text-left cursor-pointer hover:border-green-300"
          >
            <div className="text-3xl font-bold text-green-600 mb-1">{meetingStats.recordedMeetings}</div>
            <div className="text-sm text-gray-600">Recorded Meetings</div>
          </button>
          <button
            onClick={() => handleStatsClick('live')}
            className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-all text-left cursor-pointer hover:border-red-300"
          >
            <div className="text-3xl font-bold text-red-600 mb-1 flex items-center gap-2">
              {meetingStats.liveNow}
              {meetingStats.liveNow > 0 && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            </div>
            <div className="text-sm text-gray-600">Live Now</div>
          </button>
          <button
            onClick={() => handleStatsClick('ai-processed')}
            className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-all text-left cursor-pointer hover:border-purple-300"
          >
            <div className="text-3xl font-bold text-purple-600 mb-1">{meetingStats.aiProcessed}</div>
            <div className="text-sm text-gray-600">AI Processed</div>
          </button>
          <button
            onClick={() => handleStatsClick('this-week')}
            className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-all text-left cursor-pointer hover:border-gray-300"
          >
            <div className="text-3xl font-bold text-gray-900 mb-1">{meetingStats.thisWeek}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 mb-8 text-white">
          <div className="flex items-start gap-3 mb-2">
            <Sparkles className="h-6 w-6 flex-shrink-0 mt-1" />
            <h2 className="text-2xl font-bold">AI Insights</h2>
          </div>

          <div className="space-y-6 mt-6">
            {aiInsights.map((insight) => (
              <div key={insight.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {insight.type === 'follow-up' && <Zap className="h-5 w-5" />}
                      {insight.type === 'action-items' && <BarChart3 className="h-5 w-5" />}
                      {insight.type === 'sentiment' && <Target className="h-5 w-5" />}
                      <h3 className="text-lg font-semibold">{insight.title}</h3>
                    </div>
                    <p className="text-white/90">{insight.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        if (insight.type === 'follow-up') {
                          handleFollowUpMeetingsClick();
                        } else if (insight.type === 'action-items') {
                          navigate('/crm/activities');
                        } else if (insight.type === 'sentiment') {
                          navigate('/crm/reports');
                        }
                      }}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                      {insight.actionLabel}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    {insight.type === 'follow-up' && insight.id === 'insight-1' && (
                      <button
                        onClick={handleCreateBulkTasks}
                        className="px-4 py-2 bg-white text-purple-600 hover:bg-white/90 rounded-lg transition-colors font-medium"
                      >
                        Create Tasks
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.timeRange}
                onChange={(e) => setFilters({ ...filters, timeRange: e.target.value as any })}
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              >
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="live">Live</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
              >
                <option value="all">All</option>
                <option value="call">Call</option>
                <option value="video">Video</option>
                <option value="in-person">In-Person</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.aiStatus}
                onChange={(e) => setFilters({ ...filters, aiStatus: e.target.value as any })}
              >
                <option value="all">All</option>
                <option value="processed">Processed</option>
                <option value="processing">Processing</option>
                <option value="not-recorded">Not Recorded</option>
              </select>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search meetings, attendees, deals..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2">
                Sort: Date (Newest)
                <ChevronRight className="h-4 w-4 rotate-90" />
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2">
                <List className="h-4 w-4" />
                View: List
              </button>
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    </div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <div className="h-10 bg-gray-200 rounded flex-1"></div>
                    <div className="h-10 bg-gray-200 rounded flex-1"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-16 text-center">
              <div className="text-6xl mb-4">🎤</div>
              {hasActiveFilters() ? (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No meetings found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Try adjusting your filters or search terms
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Clear All Filters
                  </button>
                </>
              ) : sampleMeetings.length === 0 ? (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No meetings yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Schedule your first meeting to get started with AI-powered meeting intelligence
                  </p>
                  <button
                    onClick={() => setModals({ ...modals, scheduleMeeting: true })}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Schedule Meeting
                  </button>
                </>
              ) : null}
            </div>
          ) : (
            <>
              {liveMeetings.length > 0 && (
                <div id="live-section" className="mb-8">
                  <div className="sticky top-0 bg-gray-50 z-10 flex items-center gap-3 py-3 mb-6">
                    <div className="flex-1 h-px bg-gray-300" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: '#dc2626' }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#dc2626' }} />
                      LIVE NOW ({liveMeetings.length})
                    </h2>
                    <div className="flex-1 h-px bg-gray-300" />
                  </div>
                  <div className="space-y-4">
                    {liveMeetings.map(meeting => (
                      <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                  </div>
                </div>
              )}

              {todayMeetings.length > 0 && (
                <div className="mb-8">
                  <div className="sticky top-0 bg-gray-50 z-10 flex items-center gap-3 py-3 mb-6">
                    <div className="flex-1 h-px bg-gray-300" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>
                      TODAY ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                    </h2>
                    <div className="flex-1 h-px bg-gray-300" />
                  </div>
                  <div className="space-y-4">
                    {todayMeetings.map(meeting => (
                      <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                  </div>
                </div>
              )}

              {upcomingMeetings.length > 0 && (
                <div className="mb-8">
                  <div className="sticky top-0 bg-gray-50 z-10 flex items-center gap-3 py-3 mb-6">
                    <div className="flex-1 h-px bg-gray-300" />
                    <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      UPCOMING
                    </h2>
                    <div className="flex-1 h-px bg-gray-300" />
                  </div>
                  <div className="space-y-4">
                    {upcomingMeetings.map(meeting => (
                      <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                  </div>
                </div>
              )}

              {yesterdayMeetings.length > 0 && (
                <div className="mb-8">
                  <div className="sticky top-0 bg-gray-50 z-10 flex items-center gap-3 py-3 mb-6">
                    <div className="flex-1 h-px bg-gray-300" />
                    <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      YESTERDAY ({new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                    </h2>
                    <div className="flex-1 h-px bg-gray-300" />
                  </div>
                  <div className="space-y-4">
                    {yesterdayMeetings.map(meeting => (
                      <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                  </div>
                </div>
              )}

              {olderMeetings.length > 0 && (
                <div className="mb-8">
                  <div className="sticky top-0 bg-gray-50 z-10 flex items-center gap-3 py-3 mb-6">
                    <div className="flex-1 h-px bg-gray-300" />
                    <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                      OLDER
                    </h2>
                    <div className="flex-1 h-px bg-gray-300" />
                  </div>
                  <div className="space-y-4">
                    {olderMeetings.map(meeting => (
                      <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {filteredMeetings.length > 0 && (
            <div className="text-center py-8">
              <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Load More Meetings... (Showing {filteredMeetings.length} of {meetingStats.totalMeetings} meetings)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ScheduleMeetingModal
        isOpen={modals.scheduleMeeting}
        onClose={() => setModals({ ...modals, scheduleMeeting: false })}
        onSchedule={(meetingData) => {
          showToast('Meeting scheduled successfully', 'success');
          console.log('Meeting data:', meetingData);
        }}
      />

      {selectedMeeting && (
        <>
          <RecordingPlayerModal
            isOpen={modals.recordingPlayer}
            onClose={() => {
              setModals({ ...modals, recordingPlayer: false });
              setSelectedMeeting(null);
            }}
            meeting={{
              title: selectedMeeting.title,
              date: new Date(selectedMeeting.startTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
              duration: selectedMeeting.duration || 45,
              keyMoments: [
                { timestamp: '00:00', label: 'Introduction' },
                { timestamp: '05:30', label: 'Budget discussion', isKey: true },
                { timestamp: '15:45', label: 'Timeline review' },
                { timestamp: '32:10', label: 'Integration concerns' },
                { timestamp: '40:00', label: 'Next steps' }
              ]
            }}
          />

          <ActionItemsPanel
            isOpen={modals.actionItems}
            onClose={() => {
              setModals({ ...modals, actionItems: false });
              setSelectedMeeting(null);
            }}
            actionItems={selectedMeeting.aiSummary?.actionItems || []}
            meetingTitle={selectedMeeting.title}
          />

          <HRMSConnectionModal
            isOpen={modals.hrmsConnection}
            onClose={() => {
              setModals({ ...modals, hrmsConnection: false });
              setSelectedMeeting(null);
            }}
            hrmsData={{
              companyName: selectedMeeting.accountName || '',
              contactName: selectedMeeting.attendees[0]?.name || '',
              contactTitle: selectedMeeting.attendees[0]?.title || '',
              recruitmentDate: selectedMeeting.hrmsRecruitedDate || ''
            }}
          />

          <PrepNotesModal
            isOpen={modals.prepNotes}
            onClose={() => {
              setModals({ ...modals, prepNotes: false });
              setSelectedMeeting(null);
            }}
            meeting={{
              title: selectedMeeting.title,
              attendees: selectedMeeting.attendees.map(a => ({
                name: a.name,
                title: a.title || ''
              })),
              dealValue: selectedMeeting.dealValue,
              dealStage: selectedMeeting.dealStage,
              lastActivity: 'Email (Dec 5)',
              topics: selectedMeeting.prepNotes || [
                'Technical requirements',
                'Integration capabilities',
                'Implementation timeline',
                'Pricing structure'
              ],
              documents: [
                'Technical_Requirements.docx',
                'Integration_Guide.pdf'
              ],
              insights: [
                'Attendee mentioned SAP integration in last email',
                'Timeline pressure: Start Q1 2025',
                'Budget approval expected by end of month'
              ],
              suggestedQuestions: [
                "What's your current tech stack?",
                "Who else needs to be involved in the decision?",
                "What's your decision timeline?",
                "Are there any immediate blockers we should address?"
              ]
            }}
          />
        </>
      )}

      <BulkTaskCreatorModal
        isOpen={modals.bulkTaskCreator}
        onClose={() => setModals({ ...modals, bulkTaskCreator: false })}
        meetingCount={3}
        meetings={[
          { title: 'Acme Corp - Proposal Review', id: 'meeting_acme_001' },
          { title: 'TechStart Inc - Contract Negotiation', id: 'meeting_techstart_002' },
          { title: 'BigCo Enterprise - Discovery Call', id: 'meeting_bigco_upcoming_001' }
        ]}
        onCreateTasks={(taskData) => {
          showToast('3 tasks created successfully', 'success');
          console.log('Bulk tasks:', taskData);
        }}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              navigate(`/crm/meetings/${contextMenu.meeting.id}/edit`);
              closeContextMenu();
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Meeting
          </button>
          <button
            onClick={() => {
              showToast('Reschedule functionality coming soon', 'info');
              closeContextMenu();
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Reschedule
          </button>
          <button
            onClick={() => {
              showToast('Meeting cancelled', 'info');
              closeContextMenu();
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel Meeting
          </button>
          {contextMenu.meeting.hasRecording && (
            <button
              onClick={() => {
                showToast('Recording shared', 'success');
                closeContextMenu();
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share Recording
            </button>
          )}
          {contextMenu.meeting.hasTranscript && (
            <button
              onClick={() => {
                showToast('Transcript exported', 'success');
                closeContextMenu();
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Transcript
            </button>
          )}
          <div className="h-px bg-gray-200 my-2" />
          <button
            onClick={() => {
              showToast('Meeting deleted', 'success');
              closeContextMenu();
            }}
            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Meeting
          </button>
        </div>
      )}
    </div>
  );
}
