import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Video,
  Phone,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  Sparkles,
  Play,
  Download,
  Share2,
  Edit,
  MoreVertical,
  FileText,
  DollarSign,
  Building2,
  Mail,
  PhoneCall,
  ChevronRight,
  Target,
  TrendingUp,
  AlertCircle,
  Plus,
  Trash2,
  BarChart3,
  X
} from 'lucide-react';
import { sampleMeetings } from '../../utils/sampleMeetingsData';
import { Meeting, MeetingActionItem } from '../../types/meeting';
import { useToast } from '../../contexts/ToastContext';

export default function MeetingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Find the meeting - default to Acme Corp meeting for demo
  const meeting = sampleMeetings.find(m => m.id === id) || sampleMeetings.find(m => m.id === 'meeting_acme_001')!;

  const [showRecordingPlayer, setShowRecordingPlayer] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>(
    meeting.aiSummary?.actionItems || []
  );

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showReviewChangesModal, setShowReviewChangesModal] = useState(false);
  const [showSpeakingAnalysisModal, setShowSpeakingAnalysisModal] = useState(false);
  const [showSentimentModal, setShowSentimentModal] = useState(false);
  const [showRecordingSettingsModal, setShowRecordingSettingsModal] = useState(false);
  const [showEmailComposerModal, setShowEmailComposerModal] = useState(false);
  const [showScheduleCallModal, setShowScheduleCallModal] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showEmailAttendeesModal, setShowEmailAttendeesModal] = useState(false);
  const [showScheduleFollowUpModal, setShowScheduleFollowUpModal] = useState(false);
  const [showAddToReportModal, setShowAddToReportModal] = useState(false);
  const [showExportSummaryModal, setShowExportSummaryModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: meeting.title,
    date: meeting.startTime.split('T')[0],
    time: meeting.startTime.split('T')[1]?.substring(0, 5) || '10:00',
    duration: meeting.duration || 45,
    attendees: meeting.attendees.map(a => a.id),
    dealId: meeting.dealId
  });

  // Share form state
  const [shareForm, setShareForm] = useState({
    teamMembers: [] as string[],
    includeRecording: true,
    includeTranscript: true,
    includeAISummary: true,
    includeNotes: false,
    message: ''
  });

  // Recording settings state
  const [recordingSettings, setRecordingSettings] = useState({
    playbackSpeed: 1,
    quality: 'Auto',
    captions: false,
    autoAdvance: false
  });

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignee: '',
    priority: 'medium'
  });

  // Notes state
  const [notes, setNotes] = useState([
    { id: '1', text: 'John mentioned they need 2-factor authentication for compliance', timestamp: '10:30 AM', author: 'You' },
    { id: '2', text: 'Budget approved by Sarah (CEO) - mentioned in passing around 35 min mark', timestamp: '10:42 AM', author: 'You' }
  ]);
  const [noteText, setNoteText] = useState('');
  const [editNoteText, setEditNoteText] = useState('');

  // Export options state
  const [exportOptions, setExportOptions] = useState({
    includeSummary: true,
    includeActionItems: true,
    includeTranscript: false,
    includeNotes: true,
    format: 'pdf'
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowMoreMenu(false);
        setShowDownloadMenu(false);
      }
    };

    if (showMoreMenu || showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMoreMenu, showDownloadMenu]);

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" style={{ color: '#3b82f6' }} />;
      case 'call':
        return <Phone className="w-5 h-5" style={{ color: '#10b981' }} />;
      case 'in-person':
        return <Users className="w-5 h-5" style={{ color: '#f59e0b' }} />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'neutral':
        return '😐';
      case 'negative':
        return '☹️';
      default:
        return '😐';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return { bg: '#d1fae5', text: '#047857' };
      case 'neutral':
        return { bg: '#fef3c7', text: '#92400e' };
      case 'negative':
        return { bg: '#fee2e2', text: '#991b1b' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const toggleActionItem = (itemId: string) => {
    setActionItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
    showToast('Action item updated', 'success');
  };

  // Handler functions
  const handlePlayRecording = () => {
    setShowRecordingPlayer(true);
    setIsPlaying(true);
    showToast('Loading recording...', 'info');
    setTimeout(() => {
      const playerElement = document.getElementById('recording-player');
      if (playerElement) {
        playerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleViewTranscript = () => {
    showToast('Opening full transcript...', 'info');
    setTimeout(() => {
      navigate(`/crm/meetings/${meeting.id}/transcript`);
    }, 500);
  };

  const handleEditMeeting = () => {
    setShowEditModal(true);
    setShowMoreMenu(false);
  };

  const handleSaveEdit = () => {
    showToast('Meeting updated successfully', 'success');
    setShowEditModal(false);
  };

  const handleShareMeeting = () => {
    setShowShareModal(true);
  };

  const handleShare = () => {
    const selectedCount = shareForm.teamMembers.length;
    showToast(`Meeting shared with ${selectedCount} team member${selectedCount !== 1 ? 's' : ''}`, 'success');
    setShowShareModal(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://bmi.com/meetings/${meeting.id}`);
    showToast('Link copied to clipboard', 'success');
  };

  const handleDownload = (type: string) => {
    showToast(`Downloading ${type}...`, 'info');
    setShowDownloadMenu(false);
  };

  const handleDeleteMeeting = () => {
    showToast('Meeting deleted successfully', 'success');
    setShowDeleteModal(false);
    setTimeout(() => {
      navigate('/crm/meetings');
    }, 1000);
  };

  const handleMoreAction = (action: string) => {
    setShowMoreMenu(false);
    switch (action) {
      case 'duplicate':
        showToast('Meeting duplicated', 'success');
        break;
      case 'template':
        showToast('Meeting converted to template', 'success');
        break;
      case 'calendar':
        showToast('Added to calendar', 'success');
        break;
      case 'summary':
        showToast('Meeting summary sent', 'success');
        break;
      case 'archive':
        showToast('Meeting archived', 'success');
        break;
      case 'delete':
        setShowDeleteModal(true);
        break;
    }
  };

  // AI Intelligence handlers
  const handleJumpToTimestamp = (timestamp: number) => {
    setCurrentTime(timestamp);
    setShowRecordingPlayer(true);
    setIsPlaying(true);
    showToast('Jumping to key moment...', 'info');
    setTimeout(() => {
      const playerElement = document.getElementById('recording-player');
      if (playerElement) {
        playerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleCreateTask = () => {
    setTaskForm({
      title: '',
      description: `Follow-up from meeting: ${meeting.title}`,
      dueDate: '',
      assignee: '',
      priority: 'medium'
    });
    setShowCreateTaskModal(true);
  };

  const handleSaveTask = () => {
    showToast('Task created successfully', 'success');
    setShowCreateTaskModal(false);
  };

  const handleViewAllTasks = () => {
    showToast('Navigating to Activities...', 'info');
    setTimeout(() => {
      navigate('/crm/activities?meeting=' + meeting.id);
    }, 500);
  };

  const handleReviewChanges = () => {
    setShowReviewChangesModal(true);
  };

  const handleKeepAllChanges = () => {
    showToast('All AI updates applied to CRM', 'success');
    setShowReviewChangesModal(false);
  };

  const handleUndoUpdates = () => {
    showToast('AI updates reverted', 'success');
    setShowReviewChangesModal(false);
  };

  const handleAddToAgenda = (point: string) => {
    showToast('Added to next meeting agenda', 'success');
  };

  // Recording Player handlers
  const handleTogglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRecordingSettings = () => {
    setShowRecordingSettingsModal(true);
  };

  const handleSaveRecordingSettings = () => {
    showToast('Settings updated', 'success');
    setShowRecordingSettingsModal(false);
  };

  const handleDownloadRecording = () => {
    showToast('Downloading MP4 recording...', 'info');
  };

  const handleCopyRecordingLink = () => {
    const timestamp = currentTime > 0 ? `?t=${currentTime}` : '';
    navigator.clipboard.writeText(`https://bmi.com/meetings/${meeting.id}/recording${timestamp}`);
    showToast('Link copied with timestamp!', 'success');
  };

  // Attendee handlers
  const handleEmailAttendee = (attendee: any) => {
    setSelectedAttendee(attendee);
    setShowEmailComposerModal(true);
  };

  const handleScheduleCall = (attendee: any) => {
    setSelectedAttendee(attendee);
    setShowScheduleCallModal(true);
  };

  const handleSendEmail = () => {
    showToast(`Email sent to ${selectedAttendee?.name}`, 'success');
    setShowEmailComposerModal(false);
  };

  const handleScheduleMeeting = () => {
    showToast('Meeting scheduled successfully', 'success');
    setShowScheduleCallModal(false);
  };

  const handleShowSpeakingAnalysis = (attendee: any) => {
    setSelectedAttendee(attendee);
    setShowSpeakingAnalysisModal(true);
  };

  const handleShowSentimentTimeline = (attendee: any) => {
    setSelectedAttendee(attendee);
    setShowSentimentModal(true);
  };

  // Notes handlers
  const handleAddNote = () => {
    if (noteText.trim()) {
      const newNote = {
        id: Date.now().toString(),
        text: noteText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        author: 'You'
      };
      setNotes([...notes, newNote]);
      setNoteText('');
      setShowAddNoteModal(false);
      showToast('Note added successfully', 'success');
    }
  };

  const handleEditNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setEditNoteText(note.text);
      setEditingNoteId(noteId);
    }
  };

  const handleSaveEditNote = () => {
    if (editingNoteId && editNoteText.trim()) {
      setNotes(notes.map(n => n.id === editingNoteId ? { ...n, text: editNoteText } : n));
      setEditingNoteId(null);
      setEditNoteText('');
      showToast('Note updated successfully', 'success');
    }
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditNoteText('');
  };

  const handleDeleteNote = (noteId: string) => {
    setDeleteNoteId(noteId);
  };

  const handleConfirmDeleteNote = () => {
    if (deleteNoteId) {
      setNotes(notes.filter(n => n.id !== deleteNoteId));
      setDeleteNoteId(null);
      showToast('Note deleted successfully', 'success');
    }
  };

  // Document handlers
  const handleDownloadTranscript = () => {
    showToast('Downloading transcript (245 KB)...', 'info');
  };

  const handleDownloadRecordingFile = () => {
    showToast('Downloading recording (125 MB)...', 'info');
  };

  const handleViewDocument = (docId: string) => {
    showToast('Opening document...', 'info');
    setTimeout(() => {
      navigate(`/crm/documents/${docId}`);
    }, 500);
  };

  const handleViewAllDocuments = () => {
    showToast('Navigating to Documents...', 'info');
    setTimeout(() => {
      navigate('/crm/documents?meeting=' + meeting.id);
    }, 500);
  };

  // Quick Actions handlers
  const handleEmailAttendees = () => {
    setShowEmailAttendeesModal(true);
  };

  const handleSendEmailToAttendees = () => {
    showToast('Email sent to all attendees', 'success');
    setShowEmailAttendeesModal(false);
  };

  const handleScheduleFollowUp = () => {
    setShowScheduleFollowUpModal(true);
  };

  const handleSaveFollowUp = () => {
    showToast('Follow-up meeting scheduled', 'success');
    setShowScheduleFollowUpModal(false);
  };

  const handleShareRecording = () => {
    setShowShareModal(true);
  };

  const handleAddToReport = () => {
    setShowAddToReportModal(true);
  };

  const handleSaveToReport = () => {
    showToast('Meeting added to report', 'success');
    setShowAddToReportModal(false);
  };

  const handleReschedule = () => {
    setShowEditModal(true);
  };

  const handleExportSummary = () => {
    setShowExportSummaryModal(true);
  };

  const handleConfirmExport = () => {
    const format = exportOptions.format.toUpperCase();
    showToast(`Exporting summary as ${format}...`, 'info');
    setShowExportSummaryModal(false);
  };

  const keyMoments = [
    { time: '05:30', label: '💰 Budget discussion', timestamp: 330 },
    { time: '15:45', label: '📅 Timeline review', timestamp: 945 },
    { time: '22:10', label: '🔌 Integration concerns', timestamp: 1330 },
    { time: '35:20', label: '👔 CEO approval mentioned', timestamp: 2120 },
    { time: '40:00', label: '✅ Next steps agreed', timestamp: 2400 }
  ];

  const keyPointsData = [
    {
      icon: '💰',
      title: 'Budget Confirmed',
      details: 'Amount: $50,000 annually',
      timeline: '05:30 - 08:15',
      impact: '✅ Deal amount updated automatically',
      impactType: 'success'
    },
    {
      icon: '📅',
      title: 'Implementation Timeline',
      details: 'Duration: 6 months starting Q1 2026',
      timeline: '15:45 - 18:20',
      impact: '✅ Deal close date updated',
      impactType: 'success'
    },
    {
      icon: '🔌',
      title: 'Integration Requirements',
      details: 'Salesforce integration critical',
      timeline: '22:10 - 28:45',
      impact: '⚠️ Technical review needed',
      impactType: 'warning'
    },
    {
      icon: '👔',
      title: 'Decision Process',
      details: 'CEO approval required',
      timeline: '35:20 - 37:10',
      impact: '📋 Task created: "Get CEO intro"',
      impactType: 'info'
    }
  ];

  const sentimentTimeline = [
    { timeRange: '00:00 - 10:00', sentiment: 'positive', score: 90, note: '' },
    { timeRange: '10:01 - 25:00', sentiment: 'positive', score: 85, note: '' },
    { timeRange: '25:01 - 35:00', sentiment: 'neutral', score: 60, note: 'Discussing integration concerns' },
    { timeRange: '35:01 - 45:00', sentiment: 'positive', score: 88, note: '' }
  ];

  const crmUpdates = [
    {
      label: 'Deal amount',
      value: 'Confirmed at $50,000',
      previous: '(Previously: $50,000 - No change)'
    },
    {
      label: 'Deal close date',
      value: 'Updated to March 15, 2026',
      previous: '(Previously: March 2026)'
    },
    {
      label: 'Deal stage',
      value: 'Proposal → Proposal',
      previous: '(No stage change needed)'
    },
    {
      label: '4 tasks created automatically',
      value: 'See Action Items section above',
      previous: ''
    },
    {
      label: 'Competitor noted',
      value: 'Salesforce',
      previous: 'Added to deal competitive intel'
    },
    {
      label: 'Decision maker identified',
      value: 'CEO (needs intro)',
      previous: 'Suggested contact addition'
    }
  ];

  const talkingPoints = [
    {
      title: 'Salesforce Integration Capabilities',
      why: 'Main concern from John (mentioned 3x)',
      suggested: 'Show demo of API integration'
    },
    {
      title: 'ROI Calculation for 75-person team',
      why: 'John asked about cost justification',
      suggested: 'Prepare case study with similar size'
    },
    {
      title: 'Implementation Timeline Details',
      why: 'Concern about 6-month duration',
      suggested: 'Break down into phases'
    },
    {
      title: 'Customer Success Stories (SaaS sector)',
      why: 'Wants proof from similar companies',
      suggested: 'Share DataFlow case study'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => {
              showToast('Returning to Meetings List', 'info');
              setTimeout(() => navigate('/crm/meetings'), 500);
            }}
            className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Meetings
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">{meeting.title}</span>
        </div>
      </div>

      {/* Hero Header Section */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Title and Actions */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {getMeetingTypeIcon(meeting.type)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {meeting.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    {getMeetingTypeIcon(meeting.type)}
                    <span className="ml-1 capitalize">{meeting.type} Call</span>
                  </span>
                  <span>•</span>
                  <span>{formatDate(meeting.startTime)}</span>
                  <span>•</span>
                  <span>
                    {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                  </span>
                  <span>•</span>
                  <span>Duration: {meeting.duration} minutes</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleEditMeeting}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center space-x-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => handleMoreAction('duplicate')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Duplicate Meeting
                    </button>
                    <button
                      onClick={() => handleMoreAction('template')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Convert to Template
                    </button>
                    <button
                      onClick={() => handleMoreAction('calendar')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Add to Calendar
                    </button>
                    <button
                      onClick={() => handleMoreAction('summary')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Send Meeting Summary
                    </button>
                    <button
                      onClick={() => handleMoreAction('archive')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Archive Meeting
                    </button>
                    <button
                      onClick={() => handleMoreAction('delete')}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete Meeting
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Completed</span>
            </div>
            {meeting.aiProcessingStatus === 'processed' && (
              <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center space-x-1">
                <Sparkles className="w-4 h-4" />
                <span>AI Processed</span>
              </div>
            )}
          </div>

          {/* Attendees, Deal, Account */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm">
              <Users className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-600">Attendees:</span>
              <div className="ml-2 flex items-center space-x-2">
                {meeting.attendees.map((att, idx) => (
                  <React.Fragment key={att.id}>
                    <button
                      onClick={() => navigate(`/crm/contacts/${att.id}`)}
                      className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      {att.name} {att.title && `(${att.title})`}
                    </button>
                    {idx < meeting.attendees.length - 1 && <span className="text-gray-400">,</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
            {meeting.dealId && (
              <div className="flex items-center text-sm">
                <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Deal:</span>
                <button
                  onClick={() => navigate(`/crm/deals/${meeting.dealId}`)}
                  className="ml-2 text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  {meeting.dealTitle} - ${(meeting.dealValue! / 1000).toFixed(0)}K ({meeting.dealStage})
                </button>
              </div>
            )}
            {meeting.accountName && (
              <div className="flex items-center text-sm">
                <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Account:</span>
                <button
                  onClick={() => navigate(`/crm/accounts/${meeting.accountId}`)}
                  className="ml-2 text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  {meeting.accountName}
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePlayRecording}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Play Recording</span>
            </button>
            <button
              onClick={handleViewTranscript}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center space-x-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>View Transcript</span>
            </button>
            <button
              onClick={handleShareMeeting}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center space-x-2 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              {showDownloadMenu && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => handleDownload('Recording (MP4, 125 MB)')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Download Recording (MP4, 125 MB)
                  </button>
                  <button
                    onClick={() => handleDownload('Transcript (PDF, 245 KB)')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Download Transcript (PDF, 245 KB)
                  </button>
                  <button
                    onClick={() => handleDownload('AI Summary (PDF, 85 KB)')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Download AI Summary (PDF, 85 KB)
                  </button>
                  <button
                    onClick={() => handleDownload('All (ZIP, 126 MB)')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Download All (ZIP, 126 MB)
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center space-x-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (65% - 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Meeting Intelligence - UNIQUE DIFFERENTIATOR */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">AI Meeting Intelligence</h2>
                <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-medium">
                  UNIQUE DIFFERENTIATOR
                </span>
              </div>

              {meeting.aiSummary && (
                <>
                  {/* Meeting Summary */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">━━━</span> Meeting Summary <span className="ml-2">━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {meeting.aiSummary.summary}
                    </p>
                  </div>

                  {/* Key Points Discussed */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">━━━</span> Key Points Discussed <span className="ml-2">━━━━━━━━━━━━━━━━━━━━━━</span>
                    </h3>
                    <div className="space-y-4">
                      {keyPointsData.map((point, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{point.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-1">{point.title}</h4>
                              <p className="text-sm text-gray-600 mb-1">• {point.details}</p>
                              <p className="text-sm text-gray-500 mb-2">
                                • Timeline:
                                <button
                                  onClick={() => {
                                    const timestamp = parseInt(point.timeline.split(':')[0]) * 60 + parseInt(point.timeline.split(':')[1]);
                                    handleJumpToTimestamp(timestamp * 60);
                                  }}
                                  className="ml-1 text-blue-600 hover:text-blue-700 hover:underline font-medium"
                                >
                                  {point.timeline}
                                </button>
                              </p>
                              <div className={`text-sm font-medium ${
                                point.impactType === 'success' ? 'text-green-700' :
                                point.impactType === 'warning' ? 'text-amber-700' :
                                'text-blue-700'
                              }`}>
                                • Impact: {point.impact}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sentiment Analysis */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">━━━</span> Sentiment Analysis <span className="ml-2">━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
                    </h3>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Overall: {getSentimentEmoji(meeting.aiSummary.sentiment)} {meeting.aiSummary.sentiment.charAt(0).toUpperCase() + meeting.aiSummary.sentiment.slice(1)} ({meeting.aiSummary.sentimentScore}% confidence)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full"
                            style={{
                              width: `${meeting.aiSummary.sentimentScore}%`,
                              backgroundColor: getSentimentColor(meeting.aiSummary.sentiment).text
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Throughout Meeting:</h4>
                        <div className="space-y-2">
                          {sentimentTimeline.map((item, idx) => (
                            <div key={idx} className="flex items-center space-x-3">
                              <span className="text-sm text-gray-600 w-32">{item.timeRange}</span>
                              <div className="flex-1 flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full"
                                    style={{
                                      width: `${item.score}%`,
                                      backgroundColor: getSentimentColor(item.sentiment).text
                                    }}
                                  />
                                </div>
                                <span className="text-sm">
                                  {getSentimentEmoji(item.sentiment)} {item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)} ({item.score}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Key Moments:</h4>
                        <div className="space-y-1 text-sm">
                          <div className="text-green-700">✅ Very positive response to pricing (06:20)</div>
                          <div className="text-green-700">✅ Excited about automation features (12:45)</div>
                          <div className="text-amber-700">⚠️ Concerns about complexity (27:30)</div>
                          <div className="text-green-700">✅ Agreement on next steps (42:15)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Items */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">━━━</span> Action Items ({actionItems.length}) <span className="ml-2">━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
                    </h3>
                    <div className="space-y-3">
                      {actionItems.map((item, idx) => (
                        <div key={item.id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start space-x-3">
                            <button
                              onClick={() => toggleActionItem(item.id)}
                              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                item.completed
                                  ? 'bg-green-600 border-green-600'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className={`font-medium ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                    {idx + 1}. {item.description}
                                  </p>
                                  <div className="mt-1 text-sm text-gray-600 space-y-1">
                                    <div>Assigned: {item.assignee}</div>
                                    {item.dueDate && <div>Due: {formatDate(item.dueDate)}</div>}
                                    <div>
                                      Status: {item.completed ? '✅ Completed' : '⏳ Pending'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={handleCreateTask}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center space-x-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Task</span>
                      </button>
                      <button
                        onClick={handleViewAllTasks}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                      >
                        View All Tasks
                      </button>
                    </div>
                  </div>

                  {/* CRM Auto-Updates */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">━━━</span> CRM Auto-Updates <span className="ml-2">━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>
                    </h3>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-700 mb-4">AI automatically updated your CRM:</p>
                      <div className="space-y-3">
                        {crmUpdates.map((update, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-medium text-gray-900">{update.label}:</span>{' '}
                                <span className="text-gray-700">{update.value}</span>
                                {update.previous && (
                                  <div className="text-gray-500 ml-0">{update.previous}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-3">
                        <button
                          onClick={handleReviewChanges}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                          Review Changes
                        </button>
                        <button
                          onClick={handleUndoUpdates}
                          className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          Undo Updates
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Talking Points for Next Meeting */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">━━━</span> Talking Points for Next Meeting <span className="ml-2">━━━━━━━━━━━</span>
                    </h3>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-700 mb-4">Based on this conversation, discuss:</p>
                      <div className="space-y-3">
                        {talkingPoints.map((point, idx) => (
                          <div key={idx} className="border-l-4 border-purple-400 bg-purple-50 p-3 rounded">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 mb-1">
                                  🎯 {idx + 1}. {point.title}
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>Why: {point.why}</div>
                                  <div>Suggested: {point.suggested}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddToAgenda(point.title)}
                                className="ml-3 px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 whitespace-nowrap transition-colors"
                              >
                                Add to Agenda
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Recording Player */}
            {meeting.hasRecording && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Video className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Recording Player</h2>
                </div>

                <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <Play className="w-10 h-10 text-gray-900 ml-1" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">00:00</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full cursor-pointer">
                      <div className="h-2 bg-blue-600 rounded-full" style={{ width: '35%' }} />
                    </div>
                    <span className="text-sm text-gray-600">{meeting.duration}:00</span>
                  </div>
                </div>

                {/* Key Moments */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Key Moments - Click to jump:</h3>
                  <div className="space-y-1">
                    {keyMoments.map((moment, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleJumpToTimestamp(moment.timestamp)}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        • {moment.time} {moment.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleRecordingSettings}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    ⚙️ Settings
                  </button>
                  <button
                    onClick={handleDownloadRecording}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    📥 Download MP4
                  </button>
                  <button
                    onClick={handleCopyRecordingLink}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    🔗 Copy Link
                  </button>
                </div>
              </div>
            )}

            {/* Attendees */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Attendees ({meeting.attendees.length})</h2>
              </div>

              <div className="space-y-4">
                {meeting.attendees.map((attendee) => (
                  <div key={attendee.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {attendee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{attendee.name} {attendee.isHost && '(You)'}</h3>
                        {attendee.title && (
                          <p className="text-sm text-gray-600">{attendee.title} at {meeting.accountName}</p>
                        )}
                        {attendee.email && (
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4" />
                              <span>{attendee.email}</span>
                            </div>
                          </div>
                        )}
                        <div className="mt-3 text-sm">
                          <div className="text-gray-600 mb-1">💼 Role in meeting: {attendee.isHost ? 'Host/Sales Rep' : 'Customer/Champion'}</div>
                          <div className="text-gray-600">
                            🤖 Speaking time:{' '}
                            <button
                              onClick={() => handleShowSpeakingAnalysis(attendee)}
                              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                            >
                              {attendee.isHost ? '23 mins (51%)' : '22 mins (49%)'}
                            </button>
                          </div>
                          <div className="text-gray-600">
                            😊 Sentiment:{' '}
                            <button
                              onClick={() => handleShowSentimentTimeline(attendee)}
                              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                            >
                              Positive ({attendee.isHost ? '88' : '85'}%)
                            </button>
                          </div>
                          <div className="text-gray-600">💬 Key topics: {attendee.isHost ? 'Features, Pricing, Demo' : 'Budget, Timeline, CEO'}</div>
                        </div>
                        {!attendee.isHost && (
                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() => navigate(`/crm/contacts/${attendee.id}`)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                              View Contact
                            </button>
                            <button
                              onClick={() => handleEmailAttendee(attendee)}
                              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                              Email
                            </button>
                            <button
                              onClick={() => handleScheduleCall(attendee)}
                              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                              Schedule Call
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meeting Notes */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h2 className="text-xl font-bold text-gray-900">Meeting Notes</h2>
                </div>
                <button
                  onClick={() => setShowAddNoteModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Note</span>
                </button>
              </div>

              <div className="space-y-4">
                {notes.map((note, idx) => (
                  <div key={note.id} className={`border-l-4 p-4 rounded ${idx % 2 === 0 ? 'border-blue-400 bg-blue-50' : 'border-green-400 bg-green-50'}`}>
                    {editingNoteId === note.id ? (
                      <div>
                        <textarea
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEditNote}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEditNote}
                            className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{note.timestamp} - {note.author}</div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditNote(note.id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-700">{note.text}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (35% - 1 column, Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Meeting Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Meeting Details</span>
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-gray-500 font-medium mb-1">TYPE</div>
                      <div className="text-gray-900 capitalize">{meeting.type} Call</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-medium mb-1">STATUS</div>
                      <div className="text-green-700 flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Completed</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-gray-500 font-medium mb-1">DATE</div>
                      <div className="text-gray-900">{formatDate(meeting.startTime)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-medium mb-1">DURATION</div>
                      <div className="text-gray-900">{meeting.duration} minutes</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-gray-500 font-medium mb-1">TIME</div>
                      <div className="text-gray-900">{formatTime(meeting.startTime)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 font-medium mb-1">PLATFORM</div>
                      <div className="text-gray-900">Zoom</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-gray-500 font-medium mb-1">RECORDING STATUS</div>
                    <div className="text-green-700 flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Available (45 mins, 125 MB)</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-gray-500 font-medium mb-1">TRANSCRIPT STATUS</div>
                    <div className="text-green-700 flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Available (3,245 words)</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-gray-500 font-medium mb-1">AI PROCESSING</div>
                    <div className="text-green-700 flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed (Dec 7, 11:30 AM)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Records */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🔗 Linked Records</h3>

                {/* Deal */}
                {meeting.dealId && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <h4 className="font-bold text-gray-900">DEAL</h4>
                    </div>
                    <h5 className="font-medium text-gray-900 mb-2">{meeting.dealTitle} - Enterprise Plan</h5>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <div>${(meeting.dealValue! / 1000).toFixed(0)}K • {meeting.dealStage} Stage</div>
                      <div>Close: March 15, 2026</div>
                      <div className="pt-2 border-t border-gray-200">
                        <div>🤖 AI Health: 78/100</div>
                        <div>Win Probability: 67%</div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/crm/deals/${meeting.dealId}`)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center space-x-1"
                    >
                      <span>View Deal Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Account */}
                {meeting.accountName && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <h4 className="font-bold text-gray-900">ACCOUNT</h4>
                    </div>
                    <h5 className="font-medium text-gray-900 mb-2">{meeting.accountName}</h5>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <div>Industry: SaaS, Project Management</div>
                      <div>Size: 75 employees</div>
                      <div>Revenue: $12M annually</div>
                    </div>
                    <button
                      onClick={() => navigate(`/crm/accounts/${meeting.accountId}`)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center space-x-1"
                    >
                      <span>View Account Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Primary Contact */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <h4 className="font-bold text-gray-900">PRIMARY CONTACT</h4>
                  </div>
                  {meeting.attendees.filter(a => !a.isHost)[0] && (
                    <>
                      <h5 className="font-medium text-gray-900">{meeting.attendees.filter(a => !a.isHost)[0].name}</h5>
                      <p className="text-sm text-gray-600 mb-2">{meeting.attendees.filter(a => !a.isHost)[0].title}</p>
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{meeting.attendees.filter(a => !a.isHost)[0].email}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <div>Last contact: This meeting (Today)</div>
                          <div>Engagement: 92% response rate</div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/crm/contacts/${meeting.attendees.filter(a => !a.isHost)[0].id}`)}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center space-x-1"
                      >
                        <span>View Contact Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Related Documents */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📄 Related Documents (3)</h3>
                <div className="space-y-3">
                  <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start space-x-2">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">Meeting Transcript</h4>
                        <p className="text-xs text-gray-500">Acme_Meeting_Transcript.pdf</p>
                        <p className="text-xs text-gray-500">245 KB • Auto-generated</p>
                        <div className="mt-2 flex space-x-2">
                          <button
                            onClick={handleViewTranscript}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={handleDownloadTranscript}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start space-x-2">
                      <Video className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">Meeting Recording</h4>
                        <p className="text-xs text-gray-500">Acme_Meeting_Recording.mp4</p>
                        <p className="text-xs text-gray-500">125 MB • 45 minutes</p>
                        <div className="mt-2 flex space-x-2">
                          <button
                            onClick={handlePlayRecording}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            Play
                          </button>
                          <button
                            onClick={handleDownloadRecordingFile}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start space-x-2">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">Acme Corp Proposal v2</h4>
                        <p className="text-xs text-gray-500">Acme_Proposal_v2.pdf</p>
                        <p className="text-xs text-gray-500">2.4 MB • Discussed in meeting</p>
                        <div className="mt-2 flex space-x-2">
                          <button
                            onClick={() => handleViewDocument('doc_acme_proposal_v2')}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={handleDownloadRecordingFile}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleViewAllDocuments}
                  className="w-full mt-3 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 flex items-center justify-center space-x-1 transition-colors"
                >
                  <span>View All Documents</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Meeting Score */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 Meeting Score</h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-gray-900">85/100</span>
                    <span className="text-green-700 font-medium">Excellent</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">• Engagement:</span>
                    <span className="font-medium">92/100 ⭐⭐⭐⭐⭐</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">• Sentiment:</span>
                    <span className="font-medium">85/100 ⭐⭐⭐⭐⭐</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">• Outcome:</span>
                    <span className="font-medium">80/100 ⭐⭐⭐⭐</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">• Next Steps:</span>
                    <span className="font-medium">88/100 ⭐⭐⭐⭐⭐</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Why This Score?</span>
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• Both parties highly engaged</div>
                    <div>• Clear budget confirmation (+20)</div>
                    <div>• Positive sentiment throughout (+15)</div>
                    <div>• Concrete next steps defined (+18)</div>
                    <div>• Some concerns about complexity (-8)</div>
                    <div>• CEO approval adds uncertainty (-7)</div>
                  </div>
                </div>
              </div>

              {/* Impact on Deal */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Impact on Deal</span>
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">Win Probability:</div>
                    <div className="font-medium text-gray-900">Before: 65% ━━&gt; After: 67% (+2%)</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Deal Health:</div>
                    <div className="font-medium text-gray-900">Before: 76/100 ━━&gt; After: 78/100 (+2)</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Next Meeting Likelihood:</div>
                    <div className="font-medium text-green-700">95%</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Predicted Close Date:</div>
                    <div className="font-medium text-gray-900">March 12, 2026</div>
                    <div className="text-xs text-green-600">(3 days earlier than target)</div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">AI Recommendation:</h4>
                          <p className="text-xs text-gray-700">
                            Focus on technical demo addressing Salesforce integration to increase win probability to 75%+
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleEmailAttendees}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center space-x-2 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email Attendees</span>
                  </button>
                  <button
                    onClick={handleScheduleFollowUp}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center space-x-2 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Schedule Follow-up</span>
                  </button>
                  <button
                    onClick={handleShareRecording}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center space-x-2 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Recording</span>
                  </button>
                  <button
                    onClick={handleAddToReport}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center space-x-2 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Add to Report</span>
                  </button>
                  <button
                    onClick={handleReschedule}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center space-x-2 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Reschedule</span>
                  </button>
                  <button
                    onClick={handleExportSummary}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center space-x-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Summary</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Meeting Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Edit Meeting</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={editForm.time}
                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <select
                  value={editForm.duration}
                  onChange={(e) => setEditForm({ ...editForm, duration: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attendees</label>
                <div className="space-y-2">
                  {meeting.attendees.map((att) => (
                    <label key={att.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.attendees.includes(att.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditForm({ ...editForm, attendees: [...editForm.attendees, att.id] });
                          } else {
                            setEditForm({ ...editForm, attendees: editForm.attendees.filter(id => id !== att.id) });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{att.name}</span>
                    </label>
                  ))}
                </div>
                <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                  <Plus className="w-4 h-4" />
                  <span>Add Attendee</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link to Deal</label>
                <select
                  value={editForm.dealId}
                  onChange={(e) => setEditForm({ ...editForm, dealId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={meeting.dealId}>{meeting.dealTitle} - ${(meeting.dealValue! / 1000).toFixed(0)}K</option>
                </select>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Meeting Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Share Meeting</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Share with:</label>
                <select
                  multiple
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  size={3}
                  value={shareForm.teamMembers}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                    setShareForm({ ...shareForm, teamMembers: selected });
                  }}
                >
                  <option value="sarah">Sarah Chen</option>
                  <option value="mike">Mike Johnson</option>
                  <option value="emily">Emily Davis</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">What to share:</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={shareForm.includeRecording}
                      onChange={(e) => setShareForm({ ...shareForm, includeRecording: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Recording</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={shareForm.includeTranscript}
                      onChange={(e) => setShareForm({ ...shareForm, includeTranscript: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Transcript</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={shareForm.includeAISummary}
                      onChange={(e) => setShareForm({ ...shareForm, includeAISummary: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">AI Summary</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={shareForm.includeNotes}
                      onChange={(e) => setShareForm({ ...shareForm, includeNotes: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Notes</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message: (optional)</label>
                <textarea
                  value={shareForm.message}
                  onChange={(e) => setShareForm({ ...shareForm, message: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a message..."
                />
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 text-center">OR</p>
                <label className="block text-sm font-medium text-gray-700 mb-2">Copy link:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://bmi.com/meetings/${meeting.id}`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Delete Meeting?</h2>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this meeting? This will also delete:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="text-sm text-gray-600 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  <span>Recording (125 MB)</span>
                </li>
                <li className="text-sm text-gray-600 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  <span>Transcript (3,245 words)</span>
                </li>
                <li className="text-sm text-gray-600 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  <span>AI summary and insights</span>
                </li>
                <li className="text-sm text-gray-600 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  <span>2 manual notes</span>
                </li>
              </ul>
              <p className="text-sm text-red-600 font-medium">This action cannot be undone.</p>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMeeting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Delete Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Changes Modal */}
      {showReviewChangesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">AI CRM Updates Review</h2>
              <button
                onClick={() => setShowReviewChangesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm text-gray-700 mb-4 font-medium">Deal: Acme Corp - $50K</p>
              <h3 className="font-bold text-gray-900 mb-4">Changes made:</h3>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="font-medium text-gray-900">Close Date</span>
                  </div>
                  <div className="ml-7 text-sm space-y-1">
                    <div className="text-gray-600">Old: March 2026</div>
                    <div className="text-gray-900 font-medium">New: March 15, 2026</div>
                    <div className="text-green-600">Confidence: 95%</div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="font-medium text-gray-900">Tasks Created (4)</span>
                  </div>
                  <div className="ml-7 text-sm space-y-1">
                    <div>• Send proposal</div>
                    <div>• Integration details</div>
                    <div>• CEO introduction</div>
                    <div>• Schedule demo</div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="font-medium text-gray-900">Competitor Added</span>
                  </div>
                  <div className="ml-7 text-sm space-y-1">
                    <div className="text-gray-600">Name: Salesforce</div>
                    <div className="text-gray-600">Mentioned: 3 times</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowReviewChangesModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Review Individually
              </button>
              <button
                onClick={handleKeepAllChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Keep All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Speaking Analysis Modal */}
      {showSpeakingAnalysisModal && selectedAttendee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedAttendee.name} - Speaking Analysis</h2>
              <button
                onClick={() => setShowSpeakingAnalysisModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="mb-4">
                <p className="text-2xl font-bold text-gray-900">22 minutes (49%)</p>
                <p className="text-sm text-gray-600">Total speaking time</p>
              </div>

              <div className="mb-4">
                <h3 className="font-bold text-gray-900 mb-3">Speaking segments:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">00:30 - 08:45</span>
                    <span className="font-medium">8m 15s</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">10:20 - 16:30</span>
                    <span className="font-medium">6m 10s</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">22:00 - 29:45</span>
                    <span className="font-medium">7m 45s</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Longest uninterrupted:</span>
                  <span className="font-medium">4m 20s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg segment:</span>
                  <span className="font-medium">2m 45s</span>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end bg-gray-50">
              <button
                onClick={() => setShowSpeakingAnalysisModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sentiment Timeline Modal */}
      {showSentimentModal && selectedAttendee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedAttendee.name} - Sentiment Timeline</h2>
              <button
                onClick={() => setShowSentimentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="mb-6">
                <p className="text-2xl font-bold text-green-700">Positive (85%)</p>
                <p className="text-sm text-gray-600">Overall sentiment</p>
              </div>

              <h3 className="font-bold text-gray-900 mb-4">Sentiment throughout meeting:</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">00:00 - 15:00</span>
                    <span className="text-sm font-medium text-green-700">Very Positive (92%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">15:00 - 30:00</span>
                    <span className="text-sm font-medium text-green-700">Positive (78%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">30:00 - 45:00</span>
                    <span className="text-sm font-medium text-green-700">Very Positive (88%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end bg-gray-50">
              <button
                onClick={() => setShowSentimentModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording Settings Modal */}
      {showRecordingSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recording Settings</h2>
              <button
                onClick={() => setShowRecordingSettingsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Playback Speed</label>
                <select
                  value={recordingSettings.playbackSpeed}
                  onChange={(e) => setRecordingSettings({ ...recordingSettings, playbackSpeed: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x (Normal)</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                <select
                  value={recordingSettings.quality}
                  onChange={(e) => setRecordingSettings({ ...recordingSettings, quality: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Auto">Auto</option>
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={recordingSettings.captions}
                    onChange={(e) => setRecordingSettings({ ...recordingSettings, captions: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Enable Captions</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={recordingSettings.autoAdvance}
                    onChange={(e) => setRecordingSettings({ ...recordingSettings, autoAdvance: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Auto-advance to next key moment</span>
                </label>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowRecordingSettingsModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecordingSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      {showEmailComposerModal && selectedAttendee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Compose Email</h2>
              <button
                onClick={() => setShowEmailComposerModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To:</label>
                <input
                  type="email"
                  value={selectedAttendee.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject:</label>
                <input
                  type="text"
                  placeholder="Follow-up from our meeting"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message:</label>
                <textarea
                  rows={8}
                  placeholder={`Hi ${selectedAttendee.name},\n\nThank you for taking the time to meet with us today...`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowEmailComposerModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Call Modal */}
      {showScheduleCallModal && selectedAttendee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Schedule Call with {selectedAttendee.name}</h2>
              <button
                onClick={() => setShowScheduleCallModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Title:</label>
                <input
                  type="text"
                  placeholder="Follow-up call"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date:</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time:</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration:</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>30 minutes</option>
                  <option>45 minutes</option>
                  <option>60 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes:</label>
                <textarea
                  rows={3}
                  placeholder="Agenda items..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowScheduleCallModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleMeeting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Schedule Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Meeting Note</h2>
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={6}
                placeholder="Write your note here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">Rich text editor: Bold, Italic, Lists, Links</p>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowAddNoteModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Note Confirmation Modal */}
      {deleteNoteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delete this note?</h2>
              <p className="text-gray-600 mb-6">This action cannot be undone.</p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setDeleteNoteId(null)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteNote}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  Delete Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Attendees Modal */}
      {showEmailAttendeesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Email Attendees</h2>
              <button
                onClick={() => setShowEmailAttendeesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To:</label>
                <input
                  type="text"
                  value={meeting.attendees.filter(a => !a.isHost).map(a => a.name).join(', ')}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject:</label>
                <input
                  type="text"
                  defaultValue={`Follow-up: ${meeting.title}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message:</label>
                <textarea
                  rows={8}
                  defaultValue={`Hi team,\n\nThank you for attending our meeting today. Here's a summary of what we discussed:\n\n${meeting.aiSummary?.summary}\n\nBest regards`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowEmailAttendeesModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmailToAttendees}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      {showScheduleFollowUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Schedule Follow-up Meeting</h2>
              <button
                onClick={() => setShowScheduleFollowUpModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Title:</label>
                <input
                  type="text"
                  defaultValue={`Follow-up: ${meeting.title}`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attendees:</label>
                <input
                  type="text"
                  defaultValue={meeting.attendees.map(a => a.name).join(', ')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date:</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time:</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Linked Deal:</label>
                <input
                  type="text"
                  defaultValue={meeting.dealTitle}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowScheduleFollowUpModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFollowUp}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Schedule Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Report Modal */}
      {showAddToReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add to Report</h2>
              <button
                onClick={() => setShowAddToReportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Report:</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Q1 2026 Sales Activity</option>
                  <option>Enterprise Deals Pipeline</option>
                  <option>Weekly Team Performance</option>
                  <option>+ Create New Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Include:</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">Meeting summary</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">AI insights</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">Action items</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">Meeting score</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowAddToReportModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToReport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Add to Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Summary Modal */}
      {showExportSummaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Export Summary</h2>
              <button
                onClick={() => setShowExportSummaryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Include:</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeSummary}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeSummary: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Summary</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeActionItems}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeActionItems: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Action Items</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTranscript}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeTranscript: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Transcript</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeNotes}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeNotes: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Notes</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format:</label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template:</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Professional</option>
                  <option>Executive</option>
                  <option>Internal</option>
                </select>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowExportSummaryModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
