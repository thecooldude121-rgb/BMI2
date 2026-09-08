import { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRight, Mail, Calendar, Video, Briefcase, Target, Trophy, TrendingUp, Clock, BarChart3, Users, Phone, MessageSquare, CheckCircle, Plus, CreditCard as Edit2, Trash2, AlertCircle, X, FileText, MoreVertical, StickyNote, Share2, RefreshCw, Download, Link2, Copy, Settings, Shield, Activity } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { NotAvailable } from '../../components/common/NotAvailable';
import { DirectReportsSection } from '../../components/Team/DirectReportsSection';
import { useTeamPerformance } from '../../hooks/useTeamPerformance';
import { TeamEmailComposerModal } from '../../components/Team/TeamEmailComposerModal';
import { ScheduleCallModal } from '../../components/Team/ScheduleCallModal';
import { ScheduleMeetingModal } from '../../components/Team/ScheduleMeetingModal';
import { CreateTaskModal } from '../../components/Team/CreateTaskModal';
import { AddNoteModal } from '../../components/Team/AddNoteModal';
import { ShareDocumentModal } from '../../components/Team/ShareDocumentModal';

type Role = 'CEO' | 'VP' | 'Manager' | 'Rep' | 'Admin' | 'Analyst' | 'Support';

/*
 * `Role` above drives ONLY the developer "View as" switcher further down, which
 * simulates access control this product does not enforce here. It is a
 * pre-existing defect, left in place deliberately so this change stays about
 * data, and reported rather than silently kept. Real RBAC is enforced at the
 * API; the equivalent simulator on TeamPerformancePage was deleted when that
 * page was rewritten.
 */

/*
 * THE FIXTURES THAT USED TO LIVE HERE ARE GONE — 369 lines of them.
 *
 * `TEAM_MEMBER_DATA` held two invented employees (ids '1' and '2') with
 * invented phone numbers, offices, timezones, employee numbers and a 24-field
 * `metrics` block. Because it had only two entries and the page read
 * `TEAM_MEMBER_DATA[id || '2']`, THREE OF THE FIVE REAL USERS in this
 * workspace rendered "Member Not Found" — confirmed live at /team/5, which is
 * a real admin. Identity now comes from the roster, so every real user
 * resolves and nobody who does not exist does.
 *
 * `DEALS`, `CONTACTS` and `ACTIVITIES` were still POPULATED and still
 * RENDERING after cd667e2, which only blanked the metric cards. That page
 * therefore showed invented deals, an invented contact book ("Emma Wilson,
 * VP Eng, DataFlow Inc") and an invented activity feed AS THE WORK OF A REAL,
 * NAMED EMPLOYEE. Deals are now this person's real rows; contacts and
 * activities have no per-user endpoint yet and render an honest empty state.
 *
 * What is NOT recoverable from `users`, and so is labelled rather than
 * invented: phone, office location, timezone, team and employee number. Those
 * are HRMS-owned employee attributes, and HRMS is a separate platform reached
 * over the API boundary — see CLAUDE.md's "Identity & SSO". The CRM has no
 * column for any of them and must not grow one to fill a card.
 */

interface CoachingNote {
  id: string;
  date: string;
  author: string;
  authorRole: string;
  authorTitle: string;
  managerId: string;
  visibility: string;
  content: string;
  focusAreas: string[];
  developmentGoals?: string[];
  performanceRating: string;
  achievement?: string;
  nextReview?: string;
}

/**
 * ALWAYS EMPTY, AND THAT IS A DECISION RATHER THAN A GAP.
 *
 * This held three invented coaching notes — each an INVENTED PERFORMANCE
 * JUDGEMENT ABOUT A REAL NAMED EMPLOYEE, attributed to a real named manager
 * ("John Smith, Sales Director"), carrying a performance rating badge
 * ("Exceeding Expectations"), focus areas, development goals and an
 * achievement line.
 *
 * There is NO `coaching_notes` TABLE, so none of it was ever a record and
 * nothing entered through the Add Note control is saved. The content is deleted
 * rather than captioned for the same reason as the metrics above: a written
 * performance judgement attributed to a named manager is actionable outside the
 * software.
 *
 * The array is kept and emptied rather than removed so the section, its
 * handlers and its edit/delete modals stay intact and compiling — wiring this
 * up means giving it real rows, not rebuilding the surface. Same pattern as
 * `DataContext`'s permanently-empty `employees`.
 */
const COACHING_NOTES: CoachingNote[] = [];

export default function TeamMemberDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const location = useLocation();
  const navigationState = location.state as { from?: string } | null;
  const [currentRole, setCurrentRole] = useState<Role>('Manager');
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Modal states
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [editNoteModalOpen, setEditNoteModalOpen] = useState(false);
  const [deleteNoteModalOpen, setDeleteNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CoachingNote | null>(null);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const [shareDocModalOpen, setShareDocModalOpen] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);

  /** Compact money for the metric cards. Same shape as the team page's. */
  const metricMoney = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000   ? `$${Math.round(n / 1_000)}K`
    : `$${n}`;

  // Ref for more actions dropdown
  const moreActionsRef = useRef<HTMLDivElement>(null);

  /*
   * REAL DATA. `useTeamPerformance` already computes per-member rollups and
   * resolves direct reports from `users.manager_id`, so this page finds its
   * person in that result rather than fetching a second time or keeping its
   * own copy of the arithmetic.
   *
   * There is no `GET /users/:id`, and none is needed: `GET /users` returns the
   * whole workspace roster (it is deliberately ungated so assignment pickers
   * can read it), so the person is found in a list that is already loaded.
   */
  const { members, loading, error, period, truncated } = useTeamPerformance();
  const row = members.find((r) => String(r.member.id) === String(id));

  /*
   * The identity fields, mapped from the roster row. Fields with NO COLUMN in
   * `users` are `null` and the UI labels them — never filled with a plausible
   * value. See the note at the top of this file for why phone, location,
   * timezone, team and employee number are absent rather than pending.
   */
  const member = row && {
    id:             String(row.member.id),
    name:           row.member.name || row.member.email,
    initials:       row.member.initials,
    email:          row.member.email,
    role:           row.member.role,
    department:     row.member.department,
    status:         row.member.status,
    manager:        row.member.managerName,
    managerId:      row.member.managerId,
    memberSince:    row.member.createdAt,
    lastActive:     row.member.lastLoginAt,
    // Each report resolved to its own rollup, so the section shows real
    // pipeline and quota per person rather than a name alone.
    directReports:  row.directReports
      .map((r) => members.find((m) => String(m.member.id) === String(r.id)))
      .filter((m): m is NonNullable<typeof m> => m != null),
    // No column in `users` for any of these — HRMS owns them.
    phone:          null,
    location:       null,
    timezone:       null,
    team:           null,
    employeeNumber: null,
  };

  // Keyboard shortcuts: E, C, M, T, N, D, A
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea and modal is not open
      const isTyping = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      const hasModalOpen = emailModalOpen || scheduleModalOpen || addNoteOpen || callModalOpen ||
                          meetingModalOpen || taskModalOpen || noteModalOpen || documentModalOpen;

      if (isTyping || hasModalOpen) return;

      const key = e.key.toLowerCase();
      if (key === 'e') {
        e.preventDefault();
        handleSendEmail();
      } else if (key === 'c') {
        e.preventDefault();
        handleScheduleCall();
      } else if (key === 'm') {
        e.preventDefault();
        setMeetingModalOpen(true);
      } else if (key === 't') {
        e.preventDefault();
        setTaskModalOpen(true);
      } else if (key === 'n') {
        e.preventDefault();
        setNoteModalOpen(true);
      } else if (key === 'd') {
        e.preventDefault();
        setDocumentModalOpen(true);
      } else if (key === 'a') {
        e.preventDefault();
        setMoreActionsOpen(!moreActionsOpen);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [emailModalOpen, scheduleModalOpen, addNoteOpen, callModalOpen, meetingModalOpen, taskModalOpen, noteModalOpen, documentModalOpen, moreActionsOpen]);

  // Close more actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(e.target as Node)) {
        setMoreActionsOpen(false);
      }
    };

    if (moreActionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [moreActionsOpen]);

  /*
   * LOADING IS NOT "NOT FOUND", and separating them is the whole point of this
   * block. The roster arrives asynchronously now, so the old single `!member`
   * branch would flash "Member Not Found" at every real user on every load —
   * the same shape as CLAUDE.md lesson 4, where screenshots taken before a
   * fetch resolved were twice reported as a broken page.
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-8">
        <p className="text-sm text-slate-500">Loading team member…</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-md text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            {/* A failed roster fetch is a different fact from a bad id. */}
            {error ? 'Could not load this member' : 'Member not found'}
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            {error
              ? `${error} Try again, or go back to the team list.`
              : 'Nobody in this workspace has that id. They may have been removed.'}
          </p>
          <Button onClick={() => navigate('/team')} size="lg">
            Back to Team
          </Button>
        </div>
      </div>
    );
  }

  // Comprehensive role-based permissions
  const canScheduleMeetings = currentRole === 'Manager';
  const canAddNotes = ['CEO', 'VP', 'Manager'].includes(currentRole);

  // Direct Reports visibility logic
  const canViewDirectReports = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole) && currentRole !== 'Rep';
  const canTakeDirectReportActions = ['CEO', 'VP', 'Manager', 'Admin'].includes(currentRole);
  const canEditNotes = currentRole === 'Manager' || currentRole === 'CEO';
  const canViewPerformance = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const canViewDeals = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const canViewContacts = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const canViewActivities = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const canViewCoachingNotes = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const hasLimitedView = currentRole === 'Rep';
  const hasNoAccess = currentRole === 'Support';

  // Quick Actions Toolbar - Role-based button visibility
  const showQuickActionsToolbar = !hasNoAccess; // Show for all except Support
  const canSendEmail = !hasNoAccess; // All roles can send email
  const canScheduleCall = ['CEO', 'VP', 'Manager', 'Admin'].includes(currentRole);
  const canScheduleMeetingAction = ['CEO', 'VP', 'Manager', 'Admin'].includes(currentRole);
  const canCreateTask = ['CEO', 'VP', 'Manager', 'Admin'].includes(currentRole);
  const canAddNoteAction = ['CEO', 'VP', 'Manager'].includes(currentRole);
  const canShareDocument = ['Manager', 'Admin'].includes(currentRole);
  const canUseMoreActions = !hasNoAccess;

  // Toggle functions
  const toggleNoteExpansion = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  // Navigation handlers
  const handleBackToTeam = () => {
    if (navigationState?.from === 'settings') {
      navigate('/crm/settings/team');
      showToast('Returning to Team Management', 'info');
    } else {
      navigate('/team');
      showToast('Returning to Team Performance', 'info');
    }
  };

  const handleViewManagerProfile = () => {
    navigate(`/team/${member.managerId}`);
    showToast(`Loading ${member.manager}'s profile`, 'info');
  };

  const handleViewCalendar = () => {
    navigate('/calendar');
    showToast(`Opening ${member.name}'s calendar`, 'info');
  };

  const handleViewAllDeals = () => {
    navigate('/deals');
    showToast(`Loading ${member.name}'s deals`, 'info');
  };

  const handleViewAllContacts = () => {
    navigate('/contacts');
    showToast(`Loading ${member.name}'s contacts`, 'info');
  };

  const handleViewAllActivities = () => {
    navigate('/activity');
    showToast(`Loading ${member.name}'s activities`, 'info');
  };

  const handleViewContact = (contactId: string, contactName: string) => {
    navigate(`/contacts/${contactId}`);
    showToast(`Opening ${contactName}'s profile`, 'info');
  };

  // Direct Reports handlers
  const handleEmailReport = (email: string) => {
    setSelectedContact(email);
    setEmailModalOpen(true);
  };

  // Modal handlers
  const handleSchedule1on1 = () => {
    setScheduleModalOpen(true);
  };

  const handleSendEmail = (recipient?: string) => {
    setSelectedContact(recipient || member.email);
    setEmailModalOpen(true);
  };

  const handleScheduleCall = () => {
    setCallModalOpen(true);
  };

  const handleCallSchedule = async (callData: {
    date: string;
    time: string;
    duration: number;
    callType: 'phone' | 'video' | 'inperson';
    phoneNumber?: string;
    videoLink?: string;
    subject: string;
    notes: string;
    sendInvite: boolean;
    addToCalendar: boolean;
  }) => {
    // Format date and time for display
    const callDate = new Date(callData.date + 'T' + callData.time);
    const formattedDate = callDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const formattedTime = callDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Create activity log
    const activity = {
      id: `call-${Date.now()}`,
      type: 'Call Scheduled' as const,
      with: member.name,
      withEmail: member.email,
      date: callData.date,
      time: callData.time,
      formattedDateTime: `${formattedDate} at ${formattedTime} ${member.timezone || 'PST'}`,
      duration: `${callData.duration} minutes`,
      callType: callData.callType,
      phoneNumber: callData.phoneNumber,
      videoLink: callData.videoLink,
      subject: callData.subject,
      notes: callData.notes,
      status: 'Scheduled' as const,
      timestamp: new Date().toISOString(),
      sendInvite: callData.sendInvite,
      addToCalendar: callData.addToCalendar,
      relatedTo: `${member.name} (Team Member)`
    };

    // In a real app, this would:
    // 1. Create calendar event via Google Calendar/Outlook API
    // 2. Send calendar invite to member's email
    // 3. Generate Zoom link if video call
    // 4. Set reminder 15 minutes before
    // 5. Save to database
    // 6. Add to Activities (Screen 6.1)

    console.log('Call Activity Logged:', activity);

    // Show success toast with formatted details
    const callTypeDisplay = {
      phone: 'Phone Call',
      video: 'Video Call',
      inperson: 'In-Person Meeting'
    }[callData.callType];

    showToast(
      `${callTypeDisplay} scheduled with ${member.name} for ${formattedDate} at ${formattedTime}`,
      'success'
    );

    setCallModalOpen(false);
  };

  const handleScheduleMeeting = () => {
    setMeetingModalOpen(true);
  };

  const handleCreateTask = () => {
    setTaskModalOpen(true);
  };

  const handleAddNote = () => {
    setNoteModalOpen(true);
  };

  const handleShareDocument = () => {
    setDocumentModalOpen(true);
  };

  const handleEditNote = (note: CoachingNote) => {
    setSelectedNote(note);
    setEditNoteModalOpen(true);
  };

  const handleDeleteNote = (note: CoachingNote) => {
    setSelectedNote(note);
    setDeleteNoteModalOpen(true);
  };

  const confirmDeleteNote = () => {
    if (selectedNote) {
      showToast('Coaching note deleted successfully', 'success');
      setDeleteNoteModalOpen(false);
      setSelectedNote(null);
    }
  };

  const saveSchedule = () => {
    showToast(`1-on-1 scheduled with ${member.name}`, 'success');
    setScheduleModalOpen(false);
  };

  const handleEmailSend = async (emailData: {
    subject: string;
    body: string;
    template: string;
    attachments?: File[];
  }) => {
    // Log activity to activity timeline
    const activity = {
      id: `email-${Date.now()}`,
      type: 'Email' as const,
      to: member.name,
      toEmail: member.email,
      subject: emailData.subject,
      body: emailData.body,
      template: emailData.template,
      date: new Date().toISOString(),
      timestamp: new Date().toLocaleString(),
      status: 'Sent' as const,
      relatedTo: `${member.name} (Team Member)`,
      attachmentCount: emailData.attachments?.length || 0
    };

    // In a real app, this would:
    // 1. Send email via Gmail/Outlook integration
    // 2. Save to database
    // 3. Add to Sarah Chen's activity timeline

    console.log('Email Activity Logged:', activity);

    showToast(`Email sent to ${member.name}`, 'success');
    setEmailModalOpen(false);
  };

  const handleEmailSaveDraft = async (emailData: {
    subject: string;
    body: string;
    template: string;
  }) => {
    // Save draft to database
    const draft = {
      id: `draft-${Date.now()}`,
      to: member.email,
      toName: member.name,
      subject: emailData.subject,
      body: emailData.body,
      template: emailData.template,
      savedAt: new Date().toISOString(),
      status: 'Draft' as const
    };

    // In a real app, save to database
    console.log('Email Draft Saved:', draft);

    showToast('Email saved as draft', 'success');
    // Keep modal open so user can continue editing
  };

  const handleMeetingSchedule = async (meetingData: {
    meetingType: '1-on-1' | 'team' | 'client';
    date: string;
    time: string;
    duration: number;
    locationType: 'office' | 'video' | 'external';
    locationDetails: string;
    subject: string;
    agenda: string;
    agendaTemplate?: string;
    additionalAttendees: string[];
    recurring: 'one-time' | 'weekly' | 'biweekly' | 'monthly';
    reminders: { fifteenMin: boolean; oneDay: boolean };
  }) => {
    // Format date and time
    const meetingDateTime = new Date(meetingData.date + 'T' + meetingData.time);
    const formattedDate = meetingDateTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const formattedTime = meetingDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Create activity log
    const activity = {
      id: `meeting-${Date.now()}`,
      type: 'Meeting Scheduled' as const,
      meetingType: meetingData.meetingType,
      with: member.name,
      withEmail: member.email,
      date: meetingData.date,
      time: meetingData.time,
      formattedDateTime: `${formattedDate} at ${formattedTime} ${member.timezone || 'PST'}`,
      duration: `${meetingData.duration} minutes`,
      locationType: meetingData.locationType,
      locationDetails: meetingData.locationDetails,
      subject: meetingData.subject,
      agenda: meetingData.agenda,
      agendaTemplate: meetingData.agendaTemplate,
      additionalAttendees: meetingData.additionalAttendees,
      recurring: meetingData.recurring,
      reminders: meetingData.reminders,
      status: 'Scheduled' as const,
      timestamp: new Date().toISOString(),
      relatedTo: `${member.name} (Team Member)`,
      isOneOnOne: meetingData.meetingType === '1-on-1'
    };

    // In a real app, this would:
    // 1. Create calendar event
    // 2. Send invites to all attendees
    // 3. Generate video link if needed
    // 4. Set reminders
    // 5. Add to Activities
    // 6. If 1-on-1: Add to Coaching Notes timeline

    console.log('Meeting Activity Logged:', activity);

    const meetingTypeDisplay = meetingData.meetingType === '1-on-1' ? '1-on-1' :
                                meetingData.meetingType === 'team' ? 'Team Meeting' : 'Client Meeting';

    showToast(
      `${meetingTypeDisplay} scheduled with ${member.name} for ${formattedDate} at ${formattedTime}`,
      'success'
    );

    setMeetingModalOpen(false);
  };

  const handleTaskCreate = async (taskData: {
    assignedTo: string;
    title: string;
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    relatedTo: 'deal' | 'contact' | 'team' | 'other';
    relatedEntity: string;
    sendReminder: boolean;
  }) => {
    // Format due date
    const dueDate = new Date(taskData.dueDate);
    const formattedDueDate = dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Create activity log
    const activity = {
      id: `task-${Date.now()}`,
      type: 'Task Assigned' as const,
      taskTitle: taskData.title,
      assignedTo: taskData.assignedTo,
      assignedBy: currentRole,
      dueDate: taskData.dueDate,
      formattedDueDate,
      priority: taskData.priority,
      description: taskData.description,
      relatedTo: taskData.relatedTo,
      relatedEntity: taskData.relatedEntity || member.name,
      sendReminder: taskData.sendReminder,
      status: 'Pending' as const,
      timestamp: new Date().toISOString()
    };

    // In a real app, this would:
    // 1. Create task in system
    // 2. Send notification to assignee
    // 3. Add to assignee's task list
    // 4. Add to Activities timeline
    // 5. Set reminder if enabled

    console.log('Task Activity Logged:', activity);

    showToast(`Task created for ${taskData.assignedTo}`, 'success');

    setTaskModalOpen(false);
  };

  const handleNoteSave = async (noteData: {
    noteType: 'coaching' | 'general' | 'meeting';
    date: string;
    subject: string;
    content: string;
    focusAreas: string[];
    developmentGoals: string;
    visibility: 'private' | 'shared';
  }) => {
    // Format date
    const noteDate = new Date(noteData.date);
    const formattedDate = noteDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Create coaching note
    const note = {
      id: `note-${Date.now()}`,
      type: noteData.noteType,
      about: member.name,
      aboutEmail: member.email,
      date: noteData.date,
      formattedDate,
      subject: noteData.subject,
      content: noteData.content,
      focusAreas: noteData.focusAreas,
      developmentGoals: noteData.developmentGoals,
      visibility: noteData.visibility,
      author: currentRole,
      authorName: 'Current User',
      timestamp: new Date().toISOString(),
      status: 'Active' as const
    };

    // In a real app, this would:
    // 1. Add to Coaching Notes section
    // 2. Add to member's coaching timeline
    // 3. Save to database
    // 4. Optional: Notify member if shared
    // 5. Link to performance reviews

    console.log('Coaching Note Saved:', note);

    const noteTypeDisplay = noteData.noteType === 'coaching' ? 'Coaching note' :
                             noteData.noteType === 'general' ? 'General note' : 'Meeting note';

    showToast(`${noteTypeDisplay} added for ${member.name}`, 'success');

    setNoteModalOpen(false);
  };

  const handleDocumentShare = async (documentData: {
    documentSource: 'library' | 'upload';
    documentName: string;
    documentType?: string;
    file?: File;
    message: string;
    permission: 'view' | 'edit' | 'download';
    expires: 'never' | '7days' | '30days' | '90days';
  }) => {
    // Create activity log
    const activity = {
      id: `document-${Date.now()}`,
      type: 'Document Shared' as const,
      documentName: documentData.documentName,
      documentType: documentData.documentType,
      sharedWith: member.name,
      sharedWithEmail: member.email,
      sharedBy: currentRole,
      documentSource: documentData.documentSource,
      fileSize: documentData.file ? `${(documentData.file.size / 1024).toFixed(0)} KB` : 'N/A',
      message: documentData.message,
      permission: documentData.permission,
      expires: documentData.expires,
      timestamp: new Date().toISOString(),
      status: 'Shared' as const
    };

    // In a real app, this would:
    // 1. Upload document (if new)
    // 2. Grant permissions to Sarah Chen
    // 3. Send email notification with link
    // 4. Add to Shared Documents section
    // 5. Sync with Google Drive/Dropbox if connected
    // 6. Track document views and downloads

    console.log('Document Shared Activity:', activity);

    showToast(`Document shared with ${member.name}`, 'success');

    setDocumentModalOpen(false);
  };

  // More Actions handlers
  const handleViewPerformanceDashboard = () => {
    setMoreActionsOpen(false);
    showToast('Opening performance dashboard...', 'info');
  };

  const handleRefreshData = () => {
    setMoreActionsOpen(false);
    showToast('Refreshing profile data...', 'info');
    setTimeout(() => {
      showToast('Profile data refreshed', 'success');
    }, 1000);
  };

  const handleExportProfile = () => {
    setMoreActionsOpen(false);
    showToast('Generating profile export...', 'info');
    setTimeout(() => {
      showToast('Profile exported successfully', 'success');
    }, 1500);
  };

  const handleCopyProfileLink = () => {
    setMoreActionsOpen(false);
    const profileUrl = `${window.location.origin}/team/${member.id}`;
    navigator.clipboard.writeText(profileUrl);
    showToast('Profile link copied to clipboard', 'success');
  };

  const handleCopyEmail = () => {
    setMoreActionsOpen(false);
    navigator.clipboard.writeText(member.email);
    showToast('Email address copied', 'success');
  };

  const handleUserSettings = () => {
    setMoreActionsOpen(false);
    if (currentRole === 'Admin' || currentRole === 'CEO') {
      navigate('/settings/team');
      showToast('Opening user settings...', 'info');
    } else {
      showToast('Admin access required', 'error');
    }
  };

  const handleViewAuditLog = () => {
    setMoreActionsOpen(false);
    if (currentRole === 'Admin' || currentRole === 'CEO') {
      showToast('Opening audit log...', 'info');
    } else {
      showToast('Admin access required', 'error');
    }
  };

  const saveNote = () => {
    showToast('Coaching note added successfully', 'success');
    setAddNoteOpen(false);
  };

  const updateNote = () => {
    showToast('Coaching note updated successfully', 'success');
    setEditNoteModalOpen(false);
    setSelectedNote(null);
  };

  // Support role - No Access
  if (hasNoAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Access Restricted</h2>
          <p className="text-slate-600 mb-6">
            Team member profiles are not available for Support role. Contact your administrator for access.
          </p>
          <Button
            onClick={() => navigate('/team')}
            size="lg"
          >
            Back to Team
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-8">
        {/* Role Switcher */}
        <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl shadow-sm p-4 mb-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Role-Based View Testing:</h3>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as Role)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CEO">CEO (Full Access)</option>
              <option value="VP">VP (Full Access)</option>
              <option value="Manager">Manager (Own Team)</option>
              <option value="Rep">Rep (No Direct Reports)</option>
              <option value="Admin">Admin (Read-Only)</option>
              <option value="Analyst">Analyst (Read-Only)</option>
              <option value="Support">Support (No Access)</option>
            </select>
          </div>
          <div className="text-xs text-slate-600">
            {currentRole === 'CEO' && '✅ Can view all direct reports, schedule meetings, full access to all data'}
            {currentRole === 'VP' && '✅ Can view direct reports, schedule meetings, view performance data'}
            {currentRole === 'Manager' && '✅ Viewing own team - Full access to direct reports and all actions'}
            {currentRole === 'Rep' && '❌ Direct Reports section hidden - Reps don\'t see team structure'}
            {currentRole === 'Admin' && '⚠️ Read-only access - Can view but not schedule 1-on-1s'}
            {currentRole === 'Analyst' && '⚠️ Read-only access - Data visibility for analysis only'}
            {currentRole === 'Support' && '❌ No access to team performance data'}
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            {navigationState?.from === 'settings' ? (
              <>
                <button
                  onClick={() => navigate('/crm/settings')}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                >
                  Settings
                </button>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <button
                  onClick={handleBackToTeam}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                >
                  Team Management
                </button>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 font-medium">{member.name}</span>
              </>
            ) : (
              <>
                <button
                  onClick={handleBackToTeam}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                >
                  Team
                </button>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 font-medium">{member.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-white">{member.initials}</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-800">{member.name}</h1>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {member.status}
                  </span>
                </div>
                <p className="text-lg text-slate-600 mb-2">{member.role}</p>
                {/*
                  IDENTITY, and what is NOT here matters as much as what is.
                  Removed rather than left blank: phone, office location,
                  timezone, team and employee number. `users` has no column for
                  any of them — they are HRMS-owned employee attributes, and
                  HRMS is a separate platform reached over the API boundary
                  (CLAUDE.md, "Identity & SSO"). An icon beside an empty value
                  reads as a loading failure; the field simply not being here
                  reads as what it is. The CRM must not grow a column to fill a
                  card either.

                  Also gone: the literal "(Director)" that used to follow the
                  manager's name, which was an invented job title attached to
                  whoever happened to be above this person.
                */}
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {member.email}
                  </span>
                  {/* department IS a real column, and is nullable. */}
                  {member.department && (
                    <span>Department: <span className="font-medium">{member.department}</span></span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  Reports to:{' '}
                  {member.managerId && member.manager ? (
                    <button
                      onClick={handleViewManagerProfile}
                      className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      {member.manager}
                    </button>
                  ) : (
                    <span className="italic text-slate-400">Not set</span>
                  )}
                </p>
                <p className="text-sm text-slate-500">
                  Member since{' '}
                  {member.memberSince
                    ? new Date(member.memberSince).toLocaleDateString()
                    : '—'}
                  {' · '}
                  {/* Null means never signed in — a real state, not a gap. */}
                  {member.lastActive
                    ? `last signed in ${new Date(member.lastActive).toLocaleDateString()}`
                    : 'never signed in'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {canScheduleMeetings && (
              <Button
                onClick={handleSchedule1on1}
              >
                <Calendar className="w-4 h-4" />
                Schedule 1-on-1
              </Button>
            )}
            <button
              onClick={handleViewCalendar}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              View Calendar
            </button>
            <button
              onClick={() => handleSendEmail()}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>
          </div>
        </div>

        {/* Quick Actions Toolbar - Sticky */}
        {showQuickActionsToolbar && (
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-6 py-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-slate-600 font-medium">Quick Actions:</span>

              {canSendEmail && (
                <button
                  onClick={() => handleSendEmail()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
              )}

              {canScheduleCall && (
                <button
                  onClick={handleScheduleCall}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Schedule Call
                </button>
              )}

              {canScheduleMeetingAction && (
                <button
                  onClick={handleScheduleMeeting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  Sched Meeting
                </button>
              )}

              {canCreateTask && (
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Create Task
                </button>
              )}

              {canAddNoteAction && (
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <StickyNote className="w-4 h-4" />
                  Add Note
                </button>
              )}

              {canShareDocument && (
                <button
                  onClick={handleShareDocument}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Document
                </button>
              )}

              {canUseMoreActions && (
                <div className="relative" ref={moreActionsRef}>
                  <button
                    onClick={() => setMoreActionsOpen(!moreActionsOpen)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                  >
                    <MoreVertical className="w-4 h-4" />
                    More Actions
                  </button>

                  {moreActionsOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-20">
                      <button
                        onClick={handleViewPerformanceDashboard}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        View Performance Dashboard
                      </button>
                      <button
                        onClick={() => {
                          handleViewCalendar();
                          setMoreActionsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        View Calendar
                      </button>
                      <button
                        onClick={() => {
                          handleViewAllDeals();
                          setMoreActionsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Briefcase className="w-4 h-4" />
                        View Deals
                      </button>
                      <button
                        onClick={() => {
                          handleViewAllContacts();
                          setMoreActionsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        View Contacts
                      </button>
                      <button
                        onClick={() => {
                          handleViewAllActivities();
                          setMoreActionsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Activity className="w-4 h-4" />
                        View Activities
                      </button>

                      <div className="border-t border-slate-200 my-1"></div>

                      <button
                        onClick={handleRefreshData}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Data
                      </button>
                      <button
                        onClick={handleExportProfile}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Profile (CSV/PDF)
                      </button>
                      <button
                        onClick={handleCopyProfileLink}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Link2 className="w-4 h-4" />
                        Copy Profile Link
                      </button>
                      <button
                        onClick={handleCopyEmail}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Email Address
                      </button>

                      {(currentRole === 'Admin' || currentRole === 'CEO') && (
                        <>
                          <div className="border-t border-slate-200 my-1"></div>
                          <button
                            onClick={handleUserSettings}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            User Settings (Admin only)
                          </button>
                          <button
                            onClick={handleViewAuditLog}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            View Audit Log (Admin only)
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/*
          PERFORMANCE METRICS — REAL, and this is the stopgap from cd667e2 being
          retired rather than relabelled.

          Its comment listed exactly what was missing. Five of the six cards are
          now computable and are computed:
            quota records per user      -> migration 042 (quotas.user_id)
            a manager relation on users -> migration 041 (users.manager_id)
            ownership as a reference    -> migration 039 (assigned_to_user_id)

          The SIXTH — average sales cycle — still has no source: it needs either
          `activities` rows or stage-history timings per deal, and it keeps its
          label rather than being given a plausible number. Wiring five cards
          and inventing the sixth would be the hybrid CLAUDE.md lesson 15
          describes, where correct figures vouch for an invented one.

          NULL IS NOT ZERO here for the same reasons as the team page: no closed
          deals means no win rate, and no quota row means no target. Both are
          this person's real state today.
        */}
        {canViewPerformance && row && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Performance Metrics
            </h2>
            <span className="text-xs text-slate-500">Quota period {period}</span>
          </div>

          {truncated && (
            <p role="alert" className="mb-3 text-xs text-amber-700">
              More deals exist than were loaded, so these totals are lower bounds.
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-700">Open Deals</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{row.openCount}</div>
              <div className="text-xs text-slate-400">Assigned to this person</div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-700">Open Pipeline</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">
                {row.openValue > 0 ? metricMoney(row.openValue) : '—'}
              </div>
              <div className="text-xs text-slate-400">Sum of open deal values</div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-slate-700">Won Deals</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{row.wonCount}</div>
              <div className="text-xs text-slate-400">
                {row.wonValue > 0 ? `${metricMoney(row.wonValue)} closed` : 'Nothing closed yet'}
              </div>
            </div>

            {/* No closed deals means NO win rate. 0% would say they lose everything. */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <h3 className="text-sm font-semibold text-slate-700">Win Rate</h3>
              </div>
              {row.winRate == null
                ? <div className="text-2xl font-bold text-slate-300 mb-1">—</div>
                : <div className="text-3xl font-bold text-slate-800 mb-1">{row.winRate}%</div>}
              <div className="text-xs text-slate-400">
                {row.winRate == null
                  ? 'No deals closed yet'
                  : `${row.wonCount} won of ${row.wonCount + row.lostCount} closed`}
              </div>
            </div>

            {/* No quota row means NO target — not $0, and not 0% attainment. */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-slate-700">Quota</h3>
              </div>
              {row.quota == null
                ? <div className="text-2xl font-bold text-slate-300 mb-1">—</div>
                : <div className="text-3xl font-bold text-slate-800 mb-1">
                    {row.attainment != null ? `${row.attainment}%` : metricMoney(row.quota)}
                  </div>}
              <div className="text-xs text-slate-400">
                {row.quota == null
                  ? `No quota entered for ${period}`
                  : `${metricMoney(row.wonValue)} of ${metricMoney(row.quota)}`}
              </div>
            </div>

            {/*
              THE ONE CARD WITH NO SOURCE. Average sales cycle needs per-deal
              stage timings or activity rows; neither is available per user, and
              `activities` is empty. Labelled, not filled.
            */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Avg Cycle</h3>
              </div>
              <div className="text-2xl font-bold text-slate-300 mb-1">—</div>
              <div className="text-xs text-slate-400">Not calculated from your data</div>
            </div>
          </div>
        </div>
        )}

        {/* Limited View Message for Rep Role */}
        {hasLimitedView && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Limited Profile View</h3>
                <p className="text-sm text-slate-600">
                  Contact your manager for detailed performance information.
                </p>
              </div>
            </div>
          </div>
        )}

        {/*
          RENDERED EVEN WHEN EMPTY, which is the change. It used to be hidden
          unless the fixture supplied reports, so "nobody reports to this
          person" and "we have no idea" looked identical — and with
          `users.manager_id` all NULL today, empty is the honest answer for
          everyone. The section's own EmptyState says so and points at where a
          reporting line is set.

          `onScheduleCall` and `onSchedule1on1` are GONE, not repointed: this
          page performs zero fetches, so both opened a modal that persisted
          nothing, and the 1-on-1 one showed a fabricated `last1on1` /
          `next1on1` history. There is no meetings-per-report table behind
          either.
        */}
        {canViewDirectReports && (
          <DirectReportsSection
            reports={member.directReports}
            period={period}
            onViewTeam={() => navigate('/team')}
            onEmail={canTakeDirectReportActions ? handleEmailReport : undefined}
          />
        )}

        {/*
          REAL DEALS — this person's own rows, from `assigned_to_user_id`
          (migration 039), carried through `useTeamPerformance`.

          It used to render the `DEALS` fixture: invented opportunities with
          invented values and next steps, under a hardcoded "Showing 5 of 12
          deals". The count in the heading is now the real length, and the
          empty state is the honest answer for four of the five real users,
          because 20 of the 24 live deals carry no owner id at all.
        */}
        {canViewDeals && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-600" />
              Assigned Deals ({row?.deals.length ?? 0})
            </h2>
            <button
              onClick={handleViewAllDeals}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 hover:underline transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {truncated && (
            <p role="alert" className="mb-3 text-xs text-amber-700">
              More deals exist than were loaded, so this list may be incomplete.
            </p>
          )}

          {(row?.deals.length ?? 0) === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-700">No deals are assigned to this person</p>
              <p className="text-sm text-slate-500 mt-1">
                Set an owner on a deal to see it here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Deal', 'Company', 'Stage', 'Value', 'Close date'].map((h, i) => (
                      <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider ${
                        i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {row?.deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/crm/deals/${deal.id}`)}
                          className="text-sm font-semibold text-slate-800 hover:text-blue-600 text-left"
                        >
                          {deal.name || deal.id}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {deal.company_name || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {deal.stage || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                        {Number(deal.value ?? 0).toLocaleString(undefined, {
                          style: 'currency', currency: 'USD', maximumFractionDigits: 0,
                        })}
                      </td>
                      {/* No close date is a real state — 8 live deals have none. */}
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {deal.expected_close_date
                          ? new Date(deal.expected_close_date).toLocaleDateString()
                          : <span className="text-slate-400 italic">No close date</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        {/*
          CONTACTS ARE NOT WIRED PER PERSON, and are no longer invented. This
          rendered five fabricated people — "Emma Wilson, VP Eng, DataFlow
          Inc", "Michael Chen, CEO, TechVision Corp" — as this employee's book,
          under a hardcoded "Showing 5 of 24 contacts".

          `contacts.owner_id` is real, so this is answerable, but GET /contacts
          exposes no owner filter today. Adding one is a backend change, so the
          section states the gap instead of guessing at it.
        */}
        {canViewContacts && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Assigned Contacts
          </h2>
          <NotAvailable
            feature="Contacts owned by this person"
            detail="Contacts do record an owner, but the contacts endpoint cannot yet filter by one, so this list is not calculated from your data. It stays empty rather than showing sample contacts."
          />
        </div>
        )}

        {/*
          ACTIVITY IS NOT WIRED, and now says so instead of inventing a feed.
          What used to render here: five fabricated activities attributed to
          this named person, plus a summary of hardcoded literals — "32
          activities" in the last 30 days, "12 activities/week", "Showing 5 of
          47 total activities", and per-type counts of 8 and 6.

          `activities` is a real table with a real `user_id`, but there is no
          endpoint that returns one user's activities, and the table holds ZERO
          rows — so even wired, the honest render today is this empty state.
          Building the endpoint is a backend change and a separate unit.
        */}
        {canViewActivities && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Recent Activity
          </h2>
          <NotAvailable
            feature="Per-person activity feed"
            detail="Activity is recorded against a user, but there is no endpoint yet that returns one person's activity, and the activities table is currently empty. This section stays blank rather than showing a sample timeline."
          />
        </div>
        )}

        {/* Coaching Notes */}
        {canViewCoachingNotes && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                Coaching Notes
              </h2>
              {canAddNotes && (
                <Button
                  onClick={() => setAddNoteOpen(!addNoteOpen)}
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </Button>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900 mb-2">Coaching Notes Permissions:</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-semibold text-amber-800 mb-1">Who Can View:</div>
                      <ul className="text-amber-700 space-y-0.5">
                        <li>• Manager: View, Add, Edit, Delete all notes</li>
                        <li>• CEO: View, Add notes (cannot edit others' notes)</li>
                        <li>• VP: View, Add notes (for department members only)</li>
                        <li>• Admin, Analyst: View all notes (read-only)</li>
                        <li>• Rep: Cannot view coaching notes</li>
                        <li>• Support: No access to team member profiles</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-amber-800 mb-1">Who Can Add Notes:</div>
                      <ul className="text-amber-700 space-y-0.5">
                        <li>• Manager: Can add/edit/delete all notes</li>
                        <li>• CEO: Can add notes (cannot edit others')</li>
                        <li>• VP: Can add notes for department members</li>
                        <li>• Admin, Analyst, Rep, Support: Cannot add notes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {addNoteOpen && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5 mb-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">New Coaching Note</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Note Content</label>
                    <textarea aria-label="Note Content"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={5}
                      placeholder="Enter detailed coaching note..."
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Focus Areas (comma separated)</label>
                    <input aria-label="Focus Areas (comma separated)"
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Mentor team, Improve qualification"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Development Goals (comma separated)</label>
                    <input aria-label="Development Goals (comma separated)"
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Complete certification, Document playbook"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Performance Rating</label>
                    <select aria-label="Performance Rating" className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Exceeding Expectations</option>
                      <option>Exceeds Expectations</option>
                      <option>Meets Expectations</option>
                      <option>Needs Improvement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Achievement (optional)</label>
                    <input aria-label="Achievement (optional)"
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Notable achievements or milestones"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={saveNote}
                  >
                    Save Note
                  </Button>
                  <button
                    onClick={() => setAddNoteOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* COACHING_NOTES is permanently empty (see its definition), so this
                list renders nothing. The placeholder explains why, rather than
                leaving a blank section that reads as a loading failure. */}
            {COACHING_NOTES.length === 0 && (
              <NotAvailable
                feature="Coaching notes"
                detail="Coaching notes are not stored yet — there is no table behind this section, so nothing entered here is saved and no history can be shown for this person."
              />
            )}

            <div className="space-y-5">
              {COACHING_NOTES.map((note, index) => (
                <div key={note.id} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-6 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-800">
                          Coaching Note {index + 1}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {note.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">{note.date}</span>
                        </span>
                        <span>•</span>
                        <span>
                          Author: <span className="font-medium text-blue-600">{note.author}</span> ({note.authorTitle}, Manager ID: {note.managerId})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {note.visibility}
                        </span>
                      </div>
                    </div>
                    {canEditNotes && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit note"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note)}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
                    <h4 className="text-xs font-semibold text-slate-700 mb-2">Note Content:</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{note.content}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                        <Target className="w-3 h-3 text-blue-600" />
                        Focus Areas:
                      </h4>
                      <ul className="space-y-1">
                        {note.focusAreas.map((area, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {note.developmentGoals && (
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          Development Goals:
                        </h4>
                        <ul className="space-y-1">
                          {note.developmentGoals.map((goal, idx) => (
                            <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-green-600 mt-0.5">•</span>
                              <span>{goal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">Performance Rating:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        note.performanceRating.includes('Exceeding') || note.performanceRating.includes('Exceeds')
                          ? 'bg-green-100 text-green-700'
                          : note.performanceRating.includes('Meets')
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {note.performanceRating}
                      </span>
                    </div>

                    {note.achievement && (
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs font-semibold text-slate-700">Achievement:</span>
                        <span className="text-xs font-medium text-green-600">{note.achievement}</span>
                      </div>
                    )}

                    {note.nextReview && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-slate-700">Next Review:</span>
                        <span className="text-xs font-medium text-blue-600">{note.nextReview}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Actions Available: <span className="font-medium">Edit, Delete</span> (Manager+ only)
                    </span>
                    <span className="text-xs text-slate-500">
                      Role Access: <span className="font-medium">{currentRole}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-sm text-slate-500 text-center">
              Showing 3 of 3 total coaching notes
            </div>
          </div>
        )}
      </div>

      {/* Schedule 1-on-1 Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Schedule 1-on-1 with {member.name}</h2>
              <button onClick={() => setScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                <input aria-label="Date" type="date" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Time</label>
                <input aria-label="Time" type="time" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Duration</label>
                <select aria-label="Duration" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Meeting Topic</label>
                <input aria-label="Meeting Topic" type="text" placeholder="e.g., Q4 Performance Review" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Location / Link</label>
                <input aria-label="Location / Link" type="text" placeholder="Office or Zoom link" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={saveSchedule} fullWidth>
                  Schedule Meeting
                </Button>
                <button onClick={() => setScheduleModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      <TeamEmailComposerModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        memberName={member.name}
        memberEmail={member.email}
        currentUserEmail="john.smith@company.com"
        onSend={handleEmailSend}
        onSaveDraft={handleEmailSaveDraft}
      />

      {/* Contact Action Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Contact {selectedContact}</h2>
              <button onClick={() => setContactModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              <Button onClick={() => { setContactModalOpen(false); handleSendEmail(selectedContact); }} fullWidth>
                <Mail className="w-5 h-5" />
                Send Email
              </Button>
              <button onClick={() => { setContactModalOpen(false); handleSchedule1on1(); }} className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                Schedule Call
              </button>
              <button onClick={() => { setContactModalOpen(false); showToast('Activity logged successfully', 'success'); }} className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-3">
                <FileText className="w-5 h-5" />
                Log Activity
              </button>
              <button onClick={() => { setContactModalOpen(false); handleViewContact('c1', selectedContact); }} className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-3">
                <Users className="w-5 h-5" />
                View Contact Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editNoteModalOpen && selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Edit Coaching Note</h2>
              <button onClick={() => setEditNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Note Content</label>
                <textarea aria-label="Note Content" rows={6} defaultValue={selectedNote.content} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Focus Areas (comma separated)</label>
                <input aria-label="Focus Areas (comma separated)" type="text" defaultValue={selectedNote.focusAreas.join(', ')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Development Goals (comma separated)</label>
                <input aria-label="Development Goals (comma separated)" type="text" defaultValue={selectedNote.developmentGoals?.join(', ')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Performance Rating</label>
                <select aria-label="Performance Rating" defaultValue={selectedNote.performanceRating} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Exceeding Expectations</option>
                  <option>Exceeds Expectations</option>
                  <option>Meets Expectations</option>
                  <option>Needs Improvement</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={updateNote} fullWidth>
                  Update Note
                </Button>
                <button onClick={() => setEditNoteModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Note Confirmation Modal */}
      {deleteNoteModalOpen && selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Delete Coaching Note?</h2>
              <button onClick={() => setDeleteNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. The coaching note from {selectedNote.date} will be permanently deleted.
                </p>
              </div>
              <p className="text-sm text-slate-700">
                Are you sure you want to delete this coaching note? All information including focus areas, development goals, and performance ratings will be lost.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={confirmDeleteNote} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                Delete Note
              </button>
              <button onClick={() => setDeleteNoteModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Call Modal */}
      <ScheduleCallModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        memberName={member.name}
        memberEmail={member.email}
        memberPhone={member.phone ?? undefined}
        memberTimezone={member.timezone ?? undefined}
        onSchedule={handleCallSchedule}
      />

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={meetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        memberName={member.name}
        memberEmail={member.email}
        memberTimezone={member.timezone ?? undefined}
        onSchedule={handleMeetingSchedule}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        memberName={member.name}
        memberEmail={member.email}
        onCreateTask={handleTaskCreate}
      />

      {/* Add Note Modal */}
      <AddNoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        memberName={member.name}
        memberEmail={member.email}
        onSaveNote={handleNoteSave}
      />

      {/* Share Document Modal */}
      <ShareDocumentModal
        isOpen={documentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
        memberName={member.name}
        memberEmail={member.email}
        onShare={handleDocumentShare}
      />

      {/*
        THE SCHEDULE 1-ON-1 MODAL IS GONE. Nothing could open it any more once
        the fabricated direct-report actions were removed, and it never
        persisted anything — this page performs zero fetches. It also displayed
        an invented `last1on1` / `next1on1` history for a real named employee,
        and there is no table behind a 1-on-1 at all. Restoring it means
        deciding where a recurring manager meeting is stored, not re-adding a
        form.
      */}

      {/* Share Document Modal */}
      {shareDocModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Share Document</h2>
              <button
                onClick={() => setShareDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Document
                </label>
                <select aria-label="Document" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Q4 Performance Review.pdf</option>
                  <option>Sales Playbook 2026.pdf</option>
                  <option>Product Training Guide.pdf</option>
                  <option>Territory Plan Q1.pdf</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Share with
                </label>
                <input aria-label="Share with"
                  type="text"
                  defaultValue={member.email}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message (Optional)
                </label>
                <textarea aria-label="Message (Optional)"
                  rows={3}
                  placeholder="Add a message..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-slate-700">Allow editing</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <Button
                onClick={() => {
                  showToast('Document shared successfully', 'success');
                  setShareDocModalOpen(false);
                }}
                fullWidth
              >
                Share Document
              </Button>
              <button
                onClick={() => setShareDocModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {addTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Create Task</h2>
              <button
                onClick={() => setAddTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Task Title
                </label>
                <input aria-label="Task Title"
                  type="text"
                  placeholder="e.g., Follow up with customer..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assign To
                </label>
                <select aria-label="Assign To" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>{member.name}</option>
                  <option>Myself</option>
                  <option>Other team member...</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Due Date
                  </label>
                  <input aria-label="Due Date"
                    type="date"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priority
                  </label>
                  <select aria-label="Priority" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea aria-label="Description"
                  rows={4}
                  placeholder="Task details..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <Button
                onClick={() => {
                  showToast('Task created successfully', 'success');
                  setAddTaskModalOpen(false);
                }}
                fullWidth
              >
                Create Task
              </Button>
              <button
                onClick={() => setAddTaskModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
