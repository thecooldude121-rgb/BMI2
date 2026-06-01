export type MeetingType = 'video' | 'call' | 'in-person';
export type MeetingStatus = 'live' | 'upcoming' | 'completed' | 'cancelled';
export type AIProcessingStatus = 'processed' | 'processing' | 'not-recorded' | 'pending';
export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface MeetingAttendee {
  id: string;
  name: string;
  title?: string;
  email?: string;
  isHost?: boolean;
}

export interface MeetingActionItem {
  id: string;
  description: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
}

export interface MeetingAISummary {
  summary: string;
  keyPoints: string[];
  sentiment: SentimentType;
  sentimentScore: number;
  actionItems: MeetingActionItem[];
  nextSteps?: string[];
  concerns?: string[];
}

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  startTime: string;
  endTime: string;
  duration?: number;
  attendees: MeetingAttendee[];
  dealId?: string;
  dealTitle?: string;
  dealValue?: number;
  dealStage?: string;
  accountId?: string;
  accountName?: string;
  contactId?: string;
  location?: string;
  meetingUrl?: string;
  aiProcessingStatus: AIProcessingStatus;
  aiProcessingProgress?: number;
  aiSummary?: MeetingAISummary;
  hasRecording: boolean;
  recordingDuration?: number;
  hasTranscript: boolean;
  transcriptUrl?: string;
  recordingUrl?: string;
  prepNotes?: string[];
  notes?: string;
  tags?: string[];
  hrmsConnected?: boolean;
  hrmsRecruitedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingStats {
  totalMeetings: number;
  upcomingThisWeek: number;
  recordedMeetings: number;
  liveNow: number;
  aiProcessed: number;
  thisWeek: number;
}

export interface MeetingFilters {
  timeRange: 'all' | 'today' | 'this-week' | 'this-month' | 'custom';
  status: MeetingStatus | 'all';
  type: MeetingType | 'all';
  aiStatus: AIProcessingStatus | 'all';
  searchQuery: string;
  startDate?: string;
  endDate?: string;
}

export interface AIInsight {
  id: string;
  type: 'follow-up' | 'action-items' | 'sentiment' | 'opportunity';
  title: string;
  description: string;
  data?: any;
  priority: 'high' | 'medium' | 'low';
  actionLabel?: string;
  actionUrl?: string;
}
