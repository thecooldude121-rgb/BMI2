// Activity Timeline and Engagement Tracking Types

export type ActivityType =
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'email_replied'
  | 'call_made'
  | 'call_received'
  | 'call_missed'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'meeting_cancelled'
  | 'note_added'
  | 'status_changed'
  | 'form_submitted'
  | 'website_visit'
  | 'document_viewed'
  | 'linkedin_interaction'
  | 'task_created'
  | 'task_completed';

export type EngagementLevel = 'hot' | 'warm' | 'cold';

export interface Activity {
  id: string;
  prospectId: string;
  type: ActivityType;
  title: string;
  description?: string;
  details?: ActivityDetails;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ActivityDetails {
  // Email specific
  emailSubject?: string;
  emailBody?: string;
  emailThreadId?: string;
  openCount?: number;
  clickCount?: number;
  replyPreview?: string;

  // Call specific
  callDuration?: number;
  callRecordingUrl?: string;
  callNotes?: string;
  callOutcome?: 'connected' | 'voicemail' | 'no_answer' | 'busy';

  // Meeting specific
  meetingDuration?: number;
  meetingAttendees?: string[];
  meetingNotes?: string;
  meetingNextSteps?: string;
  meetingLocation?: string;
  meetingLink?: string;

  // Website tracking
  pagesVisited?: string[];
  timeOnSite?: number;
  referralSource?: string;

  // Document tracking
  documentName?: string;
  documentUrl?: string;
  timeSpentViewing?: number;
  pagesViewed?: number;

  // Status change
  previousStatus?: string;
  newStatus?: string;

  // Form submission
  formName?: string;
  formData?: Record<string, any>;

  // LinkedIn
  linkedinAction?: 'view_profile' | 'send_message' | 'connection_request' | 'endorsement';
}

export interface EmailThread {
  id: string;
  prospectId: string;
  subject: string;
  messages: EmailMessage[];
  participants: string[];
  lastActivityAt: string;
  isRead: boolean;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  timestamp: string;
  isRead: boolean;
  openCount: number;
  clickCount: number;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface ActivityLog {
  type: ActivityType;
  title: string;
  description: string;
  details: ActivityDetails;
  scheduledFor?: string;
  reminder?: ActivityReminder;
  attachments?: string[];
}

export interface ActivityReminder {
  enabled: boolean;
  datetime: string;
  notifyBefore: number;
  notifyMethod: 'email' | 'push' | 'both';
}

export interface UpcomingActivity {
  id: string;
  prospectId: string;
  prospectName: string;
  type: ActivityType;
  title: string;
  description?: string;
  scheduledFor: string;
  isOverdue: boolean;
  dueIn?: string;
  assignedTo: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface EngagementMetrics {
  prospectId: string;
  engagementLevel: EngagementLevel;
  totalActivities: number;
  lastActivityDate: string;
  daysSinceLastActivity: number;

  // Activity counts
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  callsMade: number;
  meetingsHeld: number;
  websiteVisits: number;
  documentsViewed: number;

  // Engagement scores
  emailEngagementRate: number;
  responseRate: number;
  averageResponseTime: number;

  // Trends
  activityTrend: 'increasing' | 'stable' | 'decreasing';
  weeklyActivityCount: number;
  monthlyActivityCount: number;
}

export interface EngagementHeatmap {
  date: string;
  activityCount: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityFilter {
  types?: ActivityType[];
  dateRange?: {
    start: string;
    end: string;
  };
  performedBy?: string[];
  searchQuery?: string;
}

export interface ActivityTemplate {
  id: string;
  name: string;
  type: ActivityType;
  title: string;
  description: string;
  details: Partial<ActivityDetails>;
  isDefault: boolean;
}

export interface TimelineGroup {
  date: string;
  displayDate: string;
  activities: Activity[];
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  email_sent: 'Email Sent',
  email_opened: 'Email Opened',
  email_clicked: 'Email Clicked',
  email_replied: 'Email Replied',
  call_made: 'Call Made',
  call_received: 'Call Received',
  call_missed: 'Call Missed',
  meeting_scheduled: 'Meeting Scheduled',
  meeting_completed: 'Meeting Completed',
  meeting_cancelled: 'Meeting Cancelled',
  note_added: 'Note Added',
  status_changed: 'Status Changed',
  form_submitted: 'Form Submitted',
  website_visit: 'Website Visit',
  document_viewed: 'Document Viewed',
  linkedin_interaction: 'LinkedIn Activity',
  task_created: 'Task Created',
  task_completed: 'Task Completed'
};

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  email_sent: 'Send',
  email_opened: 'MailOpen',
  email_clicked: 'MousePointerClick',
  email_replied: 'Reply',
  call_made: 'PhoneOutgoing',
  call_received: 'PhoneIncoming',
  call_missed: 'PhoneMissed',
  meeting_scheduled: 'Calendar',
  meeting_completed: 'CalendarCheck',
  meeting_cancelled: 'CalendarX',
  note_added: 'FileText',
  status_changed: 'ArrowRight',
  form_submitted: 'ClipboardList',
  website_visit: 'Globe',
  document_viewed: 'File',
  linkedin_interaction: 'Linkedin',
  task_created: 'Plus',
  task_completed: 'CheckCircle'
};

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  email_sent: 'blue',
  email_opened: 'green',
  email_clicked: 'purple',
  email_replied: 'teal',
  call_made: 'indigo',
  call_received: 'cyan',
  call_missed: 'red',
  meeting_scheduled: 'orange',
  meeting_completed: 'green',
  meeting_cancelled: 'gray',
  note_added: 'yellow',
  status_changed: 'blue',
  form_submitted: 'purple',
  website_visit: 'teal',
  document_viewed: 'pink',
  linkedin_interaction: 'blue',
  task_created: 'orange',
  task_completed: 'green'
};

export const ENGAGEMENT_LEVEL_CONFIG = {
  hot: {
    label: 'Hot',
    icon: 'Flame',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Highly engaged, responding quickly'
  },
  warm: {
    label: 'Warm',
    icon: 'Sun',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Moderately engaged, occasional responses'
  },
  cold: {
    label: 'Cold',
    icon: 'Snowflake',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Low engagement, rarely responding'
  }
};

export const CALL_OUTCOMES = [
  { value: 'connected', label: 'Connected', color: 'green' },
  { value: 'voicemail', label: 'Voicemail', color: 'yellow' },
  { value: 'no_answer', label: 'No Answer', color: 'gray' },
  { value: 'busy', label: 'Busy', color: 'orange' }
];

export const ACTIVITY_CATEGORIES = {
  communication: ['email_sent', 'email_opened', 'email_clicked', 'email_replied', 'call_made', 'call_received', 'linkedin_interaction'],
  meetings: ['meeting_scheduled', 'meeting_completed', 'meeting_cancelled'],
  engagement: ['website_visit', 'document_viewed', 'form_submitted'],
  internal: ['note_added', 'status_changed', 'task_created', 'task_completed']
};
