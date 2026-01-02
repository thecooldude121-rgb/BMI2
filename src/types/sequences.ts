// Enhanced Sequences & Campaign Automation Types
// Comprehensive type definitions for Apollo.io-style sequence automation

import { SearchFilter, TimeRange } from './leadGeneration';

// =====================================================
// CORE SEQUENCE TYPES
// =====================================================

export type SequenceStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type SequenceStepType = 'email' | 'linkedin' | 'sms' | 'whatsapp' | 'call' | 'manual_task' | 'wait';
export type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'failed' | 'unsubscribed' | 'bounced';
export type StepExecutionStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'skipped' | 'bounced';
export type ConditionType = 'email_opened' | 'email_clicked' | 'email_replied' | 'email_bounced' | 'linkedin_connected' | 'call_completed' | 'meeting_booked' | 'time_based' | 'custom_field';
export type ConditionAction = 'continue' | 'skip_step' | 'end_sequence' | 'move_to_step' | 'branch_path_a' | 'branch_path_b';
export type TemplateCategory = 'cold_outreach' | 'follow_up' | 'meeting_request' | 'proposal' | 'closing' | 'nurture' | 're_engagement';
export type IntentSignalType = 'multiple_opens' | 'rapid_clicks' | 'forward_email' | 'calendar_click' | 'long_read_time' | 'reply_positive' | 'reply_negative' | 'unsubscribe' | 'spam_complaint';
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
export type CalendarProvider = 'google' | 'outlook' | 'calendly' | 'apple';

// =====================================================
// EMAIL SEQUENCE
// =====================================================

export interface EmailSequence {
  id: string;
  name: string;
  description?: string;

  // Ownership
  ownerId: string;
  teamIds: string[];

  // Status
  status: SequenceStatus;
  isActive: boolean;

  // Configuration
  settings: SequenceSettings;
  steps: SequenceStep[];

  // Targeting
  audienceFilters: SearchFilter[];
  excludeFilters: SearchFilter[];

  // Performance Metrics
  enrolledCount: number;
  activeCount: number;
  completedCount: number;
  repliedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  meetingsBookedCount: number;

  // Performance Rates (0-100)
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  meetingBookedRate: number;

  // AI Optimization
  aiOptimizationEnabled: boolean;
  aiSuggestionsCount: number;
  lastAiOptimizationAt?: string;

  // Organization
  tags: string[];
  folder?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  archivedAt?: string;
}

export interface SequenceSettings {
  // Reply Handling
  stopOnReply: boolean;
  stopOnAutoReply: boolean;
  stopOnOutOfOffice: boolean;

  // Tracking
  trackOpens: boolean;
  trackClicks: boolean;

  // Compliance
  respectUnsubscribes: boolean;

  // Throttling
  maxEmailsPerDay: number;

  // Schedule
  sendingSchedule: SendingSchedule;
}

export interface SendingSchedule {
  monday: TimeRange[];
  tuesday: TimeRange[];
  wednesday: TimeRange[];
  thursday: TimeRange[];
  friday: TimeRange[];
  saturday: TimeRange[];
  sunday: TimeRange[];
  timezone: string;
}

// =====================================================
// SEQUENCE STEPS
// =====================================================

export interface SequenceStep {
  id: string;
  sequenceId: string;

  // Step Configuration
  stepNumber: number;
  stepType: SequenceStepType;
  name?: string;
  description?: string;

  // Timing
  delayDays: number;
  delayHours: number;
  sendTime?: string; // HH:MM format
  timezone: string;
  skipWeekends: boolean;
  respectTimezone: boolean;

  // Content (for email, SMS, WhatsApp, LinkedIn)
  templateId?: string;
  subject?: string;
  body?: string;

  // Personalization
  variables: Record<string, any>;
  personalizationEnabled: boolean;

  // Settings
  isActive: boolean;
  isAbTest: boolean;

  // Flowchart Position (for visual builder)
  positionX: number;
  positionY: number;

  // Branch Information
  parentStepId?: string;
  branchPath?: string; // 'main', 'branch_a', 'branch_b', etc.

  // Conditions
  conditions: SequenceStepCondition[];

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface SequenceStepCondition {
  id: string;
  stepId: string;

  // Condition Configuration
  conditionType: ConditionType;
  conditionOperator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  conditionValue?: string;

  // Action
  action: ConditionAction;
  targetStepId?: string;

  // Additional Parameters
  parameters: Record<string, any>;
  waitDurationHours: number;

  // Priority for multiple conditions
  priority: number;

  createdAt: string;
}

// =====================================================
// SEQUENCE ENROLLMENTS
// =====================================================

export interface SequenceEnrollment {
  id: string;
  sequenceId: string;
  prospectId: string;

  // Status
  status: EnrollmentStatus;
  currentStepId?: string;
  currentStepNumber: number;

  // Timing
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  pausedAt?: string;
  nextStepScheduledAt?: string;

  // Progress
  stepsCompleted: number;
  stepsTotal: number;

  // Engagement
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;

  // Exit reason
  exitReason?: string;
  exitStepId?: string;

  // A/B Test Assignment
  abTestVariant?: string;

  // Metadata
  enrolledBy?: string;
  metadata: Record<string, any>;
}

export interface SequenceStepExecution {
  id: string;
  enrollmentId: string;
  stepId: string;

  // Execution Details
  status: StepExecutionStatus;
  scheduledAt: string;
  executedAt?: string;
  completedAt?: string;

  // Outcome
  outcome?: string;
  errorMessage?: string;

  // Engagement Data
  engagementData: EngagementData;

  // Content Snapshot (for historical record)
  contentSnapshot?: Record<string, any>;

  // Channel-specific data
  channelMessageId?: string;
  channelMetadata: Record<string, any>;

  createdAt: string;
}

export interface EngagementData {
  opened?: boolean;
  openedAt?: string;
  openCount?: number;
  clicked?: boolean;
  clickedAt?: string;
  clickCount?: number;
  clickedUrls?: string[];
  replied?: boolean;
  repliedAt?: string;
  replyContent?: string;
  replySentiment?: 'positive' | 'neutral' | 'negative';
  bounced?: boolean;
  bouncedAt?: string;
  bounceReason?: string;
  unsubscribed?: boolean;
  unsubscribedAt?: string;
}

// =====================================================
// EMAIL TEMPLATES
// =====================================================

export interface EmailTemplate {
  id: string;
  name: string;
  category: TemplateCategory;

  // Content
  subject: string;
  body: string;

  // Metadata
  description?: string;
  industry?: string;
  persona?: string;

  // Variables
  variables: TemplateVariable[];

  // Performance Metrics
  usageCount: number;
  openRate: number;
  replyRate: number;
  clickRate: number;

  // A/B Testing
  hasVariants: boolean;
  activeVariantId?: string;
  variants?: TemplateVariant[];

  // Access Control
  isActive: boolean;
  isPublic: boolean;
  ownerId: string;
  teamIds: string[];

  // Organization
  tags: string[];
  folder?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'list';
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

export interface TemplateVariant {
  id: string;
  templateId: string;

  // Variant Details
  variantName: string;
  subject: string;
  body: string;

  // A/B Testing
  weight: number; // Percentage (0-100)
  isActive: boolean;
  isWinner: boolean;

  // Performance
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  repliedCount: number;

  openRate: number;
  clickRate: number;
  replyRate: number;

  // Statistical Significance
  confidenceLevel: number;
  isStatisticallySignificant: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// ANALYTICS & PERFORMANCE
// =====================================================

export interface SequenceAnalyticsDaily {
  id: string;
  sequenceId: string;
  date: string; // YYYY-MM-DD

  // Volume Metrics
  enrolledCount: number;
  activeCount: number;
  completedCount: number;

  // Engagement Metrics
  emailsSent: number;
  emailsDelivered: number;
  emailsOpened: number;
  uniqueOpens: number;
  emailsClicked: number;
  uniqueClicks: number;
  emailsReplied: number;
  emailsBounced: number;

  // Conversion Metrics
  meetingsBooked: number;
  dealsCreated: number;

  // Rates
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  meetingBookedRate: number;

  // Intent Signals
  highIntentCount: number;
  mediumIntentCount: number;
  lowIntentCount: number;

  createdAt: string;
}

export interface SequenceStepAnalytics {
  id: string;
  stepId: string;
  sequenceId: string;

  // Volume
  totalSent: number;
  totalDelivered: number;

  // Engagement
  totalOpened: number;
  uniqueOpens: number;
  totalClicked: number;
  uniqueClicks: number;
  totalReplied: number;
  totalBounced: number;

  // Rates
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  conversionRate: number;

  // Timing Analytics
  avgTimeToOpenMinutes: number;
  avgTimeToReplyHours: number;

  // Drop-off Analysis
  dropOffCount: number;
  dropOffRate: number;

  // Best Performing Times
  bestSendDay?: string;
  bestSendHour?: number;

  lastCalculatedAt: string;
}

export interface SequencePerformanceMetrics {
  sequenceId: string;
  sequenceName: string;

  // Time Period
  startDate: string;
  endDate: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all_time';

  // Volume
  totalEnrolled: number;
  totalActive: number;
  totalCompleted: number;

  // Engagement
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalReplied: number;
  totalBounced: number;

  // Conversion
  meetingsBooked: number;
  dealsCreated: number;
  revenue: number;

  // Rates
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  meetingBookedRate: number;
  dealConversionRate: number;

  // Funnel Data
  funnelData: FunnelStepData[];

  // Trend Data
  trendData: TrendDataPoint[];
}

export interface FunnelStepData {
  stepNumber: number;
  stepName: string;
  stepType: SequenceStepType;
  enrolledCount: number;
  completedCount: number;
  conversionRate: number;
  dropOffCount: number;
  dropOffRate: number;
}

export interface TrendDataPoint {
  date: string;
  enrolled: number;
  opened: number;
  clicked: number;
  replied: number;
  meetingsBooked: number;
}

// =====================================================
// INTENT SIGNALS
// =====================================================

export interface SequenceIntentSignal {
  id: string;
  prospectId: string;
  sequenceId: string;
  enrollmentId?: string;

  // Signal Details
  signalType: IntentSignalType;
  signalScore: number; // -100 to +100

  // Context
  stepId?: string;
  executionId?: string;

  // Signal Data
  signalData: Record<string, any>;

  // Timing
  detectedAt: string;

  // Aggregation
  aggregateScore: number;
}

export interface ProspectIntentProfile {
  prospectId: string;
  sequenceId: string;

  // Overall Intent
  overallScore: number; // 0-100
  intentLevel: 'hot' | 'warm' | 'cold';

  // Signal Breakdown
  positiveSignals: SequenceIntentSignal[];
  negativeSignals: SequenceIntentSignal[];
  neutralSignals: SequenceIntentSignal[];

  // Engagement Pattern
  engagementVelocity: 'increasing' | 'stable' | 'decreasing';
  lastEngagementAt?: string;
  daysSinceLastEngagement: number;

  // Recommendations
  nextBestAction: string;
  priority: 'high' | 'medium' | 'low';
}

// =====================================================
// CALENDAR & MEETINGS
// =====================================================

export interface CalendarIntegration {
  id: string;
  userId: string;

  // Provider Details
  provider: CalendarProvider;
  providerAccountId?: string;
  providerEmail?: string;

  // OAuth Tokens
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;

  // Settings
  settings: Record<string, any>;
  isActive: boolean;

  // Sync Status
  lastSyncAt?: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  syncErrors: string[];

  // Calendly-style booking
  bookingLink?: string;
  bookingEnabled: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface SequenceMeeting {
  id: string;
  sequenceId: string;
  enrollmentId: string;
  prospectId: string;

  // Meeting Details
  meetingTitle?: string;
  meetingTime: string;
  meetingDurationMinutes: number;
  meetingTimezone: string;

  // Location
  meetingUrl?: string;
  meetingLocation?: string;

  // Status
  status: MeetingStatus;

  // Outcome
  outcome?: string;
  outcomeNotes?: string;
  nextSteps?: string;

  // Attribution
  bookingStepId?: string;
  bookedFromCalendarLink: boolean;

  // Metadata
  bookedAt: string;
  completedAt?: string;
  cancelledAt?: string;

  // Integration
  calendarEventId?: string;
  calendarProvider?: CalendarProvider;
}

// =====================================================
// AI OPTIMIZATION
// =====================================================

export interface AISequenceSuggestion {
  id: string;
  sequenceId: string;

  // Suggestion Details
  suggestionType: 'copy_improvement' | 'timing_optimization' | 'step_addition' | 'branch_logic' | 'subject_line' | 'personalization';
  suggestionTitle: string;
  suggestionDescription?: string;

  // Content
  originalContent?: Record<string, any>;
  suggestedContent: Record<string, any>;

  // AI Metadata
  aiModel: string;
  confidenceScore: number;
  reasoning?: string;

  // Expected Impact
  expectedImprovementPercentage?: number;
  expectedMetric?: 'open_rate' | 'reply_rate' | 'meeting_booked_rate';

  // Status
  status: 'pending' | 'accepted' | 'rejected' | 'applied';
  appliedAt?: string;
  appliedBy?: string;

  // Actual Performance (after applying)
  actualImprovementPercentage?: number;
  performanceData?: Record<string, any>;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface AIOptimizationRequest {
  sequenceId: string;
  optimizationType: 'full' | 'subject_lines' | 'body_content' | 'timing' | 'flow';
  targetMetric: 'open_rate' | 'reply_rate' | 'meeting_booked_rate';
  context?: {
    industry?: string;
    persona?: string;
    previousPerformance?: SequencePerformanceMetrics;
  };
}

export interface AIGeneratedCopy {
  subject: string;
  body: string;
  variables: TemplateVariable[];
  confidence: number;
  reasoning: string;
  alternatives: Array<{
    subject: string;
    body: string;
    score: number;
  }>;
}

// =====================================================
// SEQUENCE CLONING
// =====================================================

export interface SequenceClone {
  id: string;
  originalSequenceId: string;
  clonedSequenceId: string;

  // Clone Details
  cloneType: 'full' | 'partial' | 'template';
  clonedWithData: boolean;
  clonedWithEnrollments: boolean;

  // Metadata
  clonedAt: string;
  clonedBy: string;
  cloneNotes?: string;
}

export interface CloneSequenceOptions {
  sequenceId: string;
  newName: string;
  cloneSteps: boolean;
  cloneConditions: boolean;
  cloneTemplates: boolean;
  cloneSettings: boolean;
  cloneEnrollments: boolean;
  resetPerformanceMetrics: boolean;
  ownerId?: string;
}

// =====================================================
// FLOWCHART BUILDER TYPES
// =====================================================

export interface FlowchartNode {
  id: string;
  type: 'step' | 'branch' | 'condition' | 'merge';
  position: { x: number; y: number };
  data: SequenceStep | BranchNode | ConditionNode;
  connections: FlowchartConnection[];
}

export interface BranchNode {
  id: string;
  label: string;
  condition: SequenceStepCondition;
  paths: Array<{
    label: string;
    targetNodeId: string;
  }>;
}

export interface ConditionNode {
  id: string;
  label: string;
  conditions: SequenceStepCondition[];
  operator: 'AND' | 'OR';
}

export interface FlowchartConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  type: 'default' | 'conditional' | 'branch_a' | 'branch_b';
}

export interface FlowchartBuilderState {
  nodes: FlowchartNode[];
  connections: FlowchartConnection[];
  selectedNodeId?: string;
  isDragging: boolean;
  zoom: number;
  panOffset: { x: number; y: number };
}

// =====================================================
// BULK OPERATIONS
// =====================================================

export interface BulkEnrollmentRequest {
  sequenceId: string;
  prospectIds: string[];
  startImmediately: boolean;
  startDate?: string;
  abTestVariant?: string;
  metadata?: Record<string, any>;
}

export interface BulkEnrollmentResult {
  success: boolean;
  enrolledCount: number;
  failedCount: number;
  duplicateCount: number;
  errors: Array<{
    prospectId: string;
    error: string;
  }>;
}

export interface BulkUnenrollmentRequest {
  enrollmentIds: string[];
  reason: string;
  pauseInsteadOfRemove?: boolean;
}

// =====================================================
// FILTERS & SEARCH
// =====================================================

export interface SequenceFilters {
  status?: SequenceStatus[];
  ownerId?: string;
  teamIds?: string[];
  tags?: string[];
  folder?: string;
  search?: string;
  minOpenRate?: number;
  minReplyRate?: number;
  hasEnrollments?: boolean;
  isActive?: boolean;
  createdDateRange?: { start: string; end: string };
}

export interface SequenceSortOptions {
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'enrolledCount' | 'openRate' | 'replyRate' | 'meetingBookedRate';
  sortOrder: 'asc' | 'desc';
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface SequenceValidationResult {
  isValid: boolean;
  errors: SequenceValidationError[];
  warnings: SequenceValidationWarning[];
}

export interface SequenceValidationError {
  type: 'missing_step' | 'invalid_timing' | 'broken_branch' | 'missing_template' | 'invalid_condition';
  message: string;
  stepId?: string;
}

export interface SequenceValidationWarning {
  type: 'performance' | 'compliance' | 'best_practice';
  message: string;
  suggestion: string;
  stepId?: string;
}

export interface SequenceTestResult {
  success: boolean;
  prospectId: string;
  stepsExecuted: number;
  engagementSimulated: EngagementData;
  branchPathTaken: string[];
  estimatedDuration: number; // in days
}

// =====================================================
// DEFAULT VALUES & CONSTANTS
// =====================================================

export const DEFAULT_SEQUENCE_SETTINGS: SequenceSettings = {
  stopOnReply: true,
  stopOnAutoReply: true,
  stopOnOutOfOffice: false,
  trackOpens: true,
  trackClicks: true,
  respectUnsubscribes: true,
  maxEmailsPerDay: 50,
  sendingSchedule: {
    monday: [{ start: '09:00', end: '17:00' }],
    tuesday: [{ start: '09:00', end: '17:00' }],
    wednesday: [{ start: '09:00', end: '17:00' }],
    thursday: [{ start: '09:00', end: '17:00' }],
    friday: [{ start: '09:00', end: '17:00' }],
    saturday: [],
    sunday: [],
    timezone: 'America/New_York'
  }
};

export const STEP_TYPE_ICONS = {
  email: 'Mail',
  linkedin: 'Linkedin',
  sms: 'MessageSquare',
  whatsapp: 'MessageCircle',
  call: 'Phone',
  manual_task: 'CheckSquare',
  wait: 'Clock'
};

export const STEP_TYPE_COLORS = {
  email: 'blue',
  linkedin: 'indigo',
  sms: 'green',
  whatsapp: 'emerald',
  call: 'orange',
  manual_task: 'purple',
  wait: 'gray'
};

export const INTENT_SIGNAL_SCORES = {
  multiple_opens: 15,
  rapid_clicks: 20,
  forward_email: 25,
  calendar_click: 30,
  long_read_time: 10,
  reply_positive: 40,
  reply_negative: -20,
  unsubscribe: -50,
  spam_complaint: -100
};
