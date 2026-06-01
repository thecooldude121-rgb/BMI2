// Enterprise Lead Generation Types - Apollo.io Inspired
export interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  personalEmail?: string;
  phone?: string;
  mobilePhone?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  
  // Job Information
  title: string;
  seniority: 'C-Level' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor' | 'Other';
  department: string;
  functions: string[];
  
  // Company Information
  companyId: string;
  companyName: string;
  companyDomain: string;
  companyIndustry: string;
  companySize: string;
  companyRevenue?: string;
  companyLocation: string;
  
  // Lead Information
  leadSource: string;
  leadStatus: 'new' | 'contacted' | 'replied' | 'interested' | 'not_interested' | 'unqualified' | 'qualified';
  leadScore: number;
  aiScore: number;
  temperature: 'hot' | 'warm' | 'cold';
  
  // Engagement
  emailStatus: 'valid' | 'invalid' | 'risky' | 'unknown';
  lastContactedAt?: string;
  lastEngagedAt?: string;
  engagementLevel: 'high' | 'medium' | 'low' | 'none';
  
  // Sequences & Campaigns
  activeSequences: string[];
  campaignHistory: CampaignInteraction[];
  
  // Metadata
  tags: string[];
  customFields: Record<string, any>;
  notes: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  
  // Data Enrichment
  enrichmentStatus: 'pending' | 'enriched' | 'failed';
  enrichmentData?: EnrichmentData;
  dataQuality: number;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  website?: string;
  
  // Basic Info
  industry: string;
  subIndustry?: string;
  description?: string;
  founded?: number;
  
  // Size & Revenue
  employeeCount: number;
  employeeRange: string;
  annualRevenue?: number;
  revenueRange?: string;
  
  // Location
  headquarters: Address;
  locations: Address[];
  
  // Technology
  technologies: Technology[];
  techStack: string[];
  
  // Social & Web
  socialProfiles: SocialProfile[];
  logoUrl?: string;
  
  // Financials
  fundingStage?: 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C+' | 'IPO' | 'Private';
  totalFunding?: number;
  lastFundingDate?: string;
  investors?: string[];
  
  // Metrics
  alexaRank?: number;
  monthlyVisitors?: number;
  
  // Lead Generation
  prospectCount: number;
  contactedCount: number;
  repliedCount: number;
  
  // Metadata
  tags: string[];
  customFields: Record<string, any>;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  
  // Data Quality
  dataQuality: number;
  enrichmentStatus: 'pending' | 'enriched' | 'failed';
  lastEnrichedAt?: string;
}

export interface Technology {
  id: string;
  name: string;
  category: string;
  confidence: number;
  firstDetected?: string;
  lastDetected?: string;
}

export interface Address {
  street?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface SocialProfile {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'crunchbase';
  url: string;
  followers?: number;
  verified?: boolean;
}

export interface EnrichmentData {
  personalEmails: string[];
  phoneNumbers: string[];
  socialProfiles: SocialProfile[];
  workHistory: WorkExperience[];
  education: Education[];
  skills: string[];
  interests: string[];
  companyData?: CompanyEnrichment;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface Education {
  school: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
}

export interface CompanyEnrichment {
  employees: number;
  revenue: number;
  growth: number;
  technologies: Technology[];
  competitors: string[];
  news: NewsItem[];
}

export interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface LeadList {
  id: string;
  name: string;
  description?: string;
  type: 'static' | 'dynamic' | 'smart';
  
  // Filters for dynamic lists
  filters: SearchFilter[];
  
  // Static list members
  prospectIds: string[];
  
  // Metadata
  prospectCount: number;
  lastUpdated: string;
  ownerId: string;
  isShared: boolean;
  sharedWith: string[];
  
  // Sequence Integration
  activeSequences: string[];
  
  // Tags & Organization
  tags: string[];
  folder?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: any;
  values?: any[];
  logic?: 'AND' | 'OR';
}

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: SearchFilter[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  columns: string[];
  isPublic: boolean;
  ownerId: string;
  usageCount: number;
  lastUsed: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSequence {
  id: string;
  name: string;
  description?: string;
  
  // Configuration
  steps: SequenceStep[];
  settings: SequenceSettings;
  
  // Targeting
  audienceFilters: SearchFilter[];
  excludeFilters: SearchFilter[];
  
  // Status & Metrics
  status: 'draft' | 'active' | 'paused' | 'completed';
  enrolledCount: number;
  activeCount: number;
  completedCount: number;
  repliedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  
  // Performance
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  
  // Metadata
  ownerId: string;
  teamIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}

export interface SequenceStep {
  id: string;
  stepNumber: number;
  type: 'email' | 'linkedin' | 'call' | 'manual_task' | 'wait';
  
  // Timing
  delayDays: number;
  delayHours: number;
  sendTime?: string; // HH:MM format
  timezone: string;
  
  // Content
  templateId?: string;
  subject?: string;
  body?: string;
  
  // Conditions
  conditions: StepCondition[];
  
  // Settings
  isActive: boolean;
  skipWeekends: boolean;
  respectTimezone: boolean;
}

export interface StepCondition {
  type: 'email_opened' | 'email_clicked' | 'email_replied' | 'email_bounced' | 'linkedin_connected' | 'call_completed';
  action: 'continue' | 'skip_step' | 'end_sequence' | 'move_to_step';
  targetStepId?: string;
}

export interface SequenceSettings {
  stopOnReply: boolean;
  stopOnAutoReply: boolean;
  stopOnOutOfOffice: boolean;
  trackOpens: boolean;
  trackClicks: boolean;
  respectUnsubscribes: boolean;
  maxEmailsPerDay: number;
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

export interface TimeRange {
  start: string; // HH:MM
  end: string;   // HH:MM
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  
  // Categorization
  category: 'cold_outreach' | 'follow_up' | 'meeting_request' | 'proposal' | 'closing' | 'nurture';
  industry?: string;
  persona?: string;
  
  // Variables
  variables: TemplateVariable[];
  
  // Performance
  usageCount: number;
  openRate: number;
  replyRate: number;
  clickRate: number;
  
  // A/B Testing
  variants: TemplateVariant[];
  
  // Metadata
  isActive: boolean;
  isPublic: boolean;
  ownerId: string;
  teamIds: string[];
  tags: string[];
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
  name: string;
  subject: string;
  body: string;
  weight: number; // Percentage of traffic
  performance: VariantPerformance;
}

export interface VariantPerformance {
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
}

export interface CampaignInteraction {
  campaignId: string;
  sequenceId?: string;
  stepId?: string;
  type: 'email_sent' | 'email_opened' | 'email_clicked' | 'email_replied' | 'email_bounced' | 'linkedin_sent' | 'call_logged';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface BulkAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'engagement' | 'organization' | 'data' | 'sequences';
  requiresConfirmation: boolean;
  parameters?: BulkActionParameter[];
}

export interface BulkActionParameter {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'number';
  required: boolean;
  options?: { value: string; label: string; }[];
}

export interface SearchCriteria {
  // Person Filters
  personTitle?: string[];
  personSeniority?: string[];
  personDepartment?: string[];
  personLocation?: string[];
  
  // Company Filters
  companyIndustry?: string[];
  companySize?: string[];
  companyRevenue?: string[];
  companyLocation?: string[];
  companyTechnology?: string[];
  companyFunding?: string[];
  
  // Engagement Filters
  emailStatus?: string[];
  leadStatus?: string[];
  lastContactedRange?: DateRange;
  
  // Custom Filters
  customFields?: Record<string, any>;
  
  // Boolean Logic
  logic: 'AND' | 'OR';
}

export interface DateRange {
  start?: string;
  end?: string;
  preset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year';
}

export interface DataEnrichmentJob {
  id: string;
  name: string;
  type: 'person' | 'company' | 'both';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  
  // Input
  inputType: 'list' | 'csv' | 'search_results';
  inputData: any;
  
  // Configuration
  enrichmentFields: string[];
  providers: string[];
  
  // Progress
  totalRecords: number;
  processedRecords: number;
  enrichedRecords: number;
  failedRecords: number;
  
  // Results
  results?: EnrichmentResult[];
  errors?: EnrichmentError[];
  
  // Metadata
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface EnrichmentResult {
  recordId: string;
  recordType: 'person' | 'company';
  enrichedFields: Record<string, any>;
  confidence: number;
  provider: string;
  cost: number;
}

export interface EnrichmentError {
  recordId: string;
  error: string;
  provider: string;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  
  // Scheduling
  startTime: string;
  endTime: string;
  timezone: string;
  
  // Participants
  organizer: string;
  attendees: MeetingAttendee[];
  
  // Meeting Details
  type: 'discovery' | 'demo' | 'proposal' | 'closing' | 'follow_up' | 'internal';
  location?: string;
  meetingUrl?: string;
  dialInNumber?: string;
  
  // Status
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  
  // Related Records
  prospectIds: string[];
  companyId?: string;
  dealId?: string;
  
  // Content
  agenda?: string;
  notes?: string;
  recording?: MeetingRecording;
  
  // Follow-up
  actionItems: ActionItem[];
  nextSteps?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface MeetingAttendee {
  id: string;
  type: 'user' | 'prospect' | 'external';
  email: string;
  name: string;
  response: 'pending' | 'accepted' | 'declined' | 'tentative';
  attended?: boolean;
  joinedAt?: string;
  leftAt?: string;
}

export interface MeetingRecording {
  id: string;
  url: string;
  duration: number;
  transcript?: string;
  highlights: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  keyTopics: string[];
}

export interface ActionItem {
  id: string;
  description: string;
  assigneeId: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed';
  completedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  
  // Classification
  type: 'call' | 'email' | 'linkedin' | 'research' | 'follow_up' | 'demo' | 'proposal' | 'meeting' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';
  
  // Timing
  dueDate?: string;
  scheduledAt?: string;
  completedAt?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  
  // Assignment
  assigneeId: string;
  createdBy: string;
  
  // Related Records
  prospectIds: string[];
  companyId?: string;
  dealId?: string;
  sequenceId?: string;
  
  // Content
  notes?: string;
  outcome?: string;
  
  // Subtasks
  subtasks: Subtask[];
  
  // Metadata
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface Deal {
  id: string;
  name: string;
  
  // Basic Information
  prospectId?: string;
  companyId: string;
  ownerId: string;
  
  // Financial
  amount: number;
  currency: string;
  stage: string;
  probability: number;
  
  // Timing
  expectedCloseDate?: string;
  actualCloseDate?: string;
  
  // Classification
  dealType: 'new_business' | 'expansion' | 'renewal' | 'upsell';
  leadSource: string;
  
  // Content
  description?: string;
  nextSteps?: string;
  
  // Products
  products: DealProduct[];
  
  // Competition
  competitors: string[];
  lostReason?: string;
  wonReason?: string;
  
  // Metadata
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  activities: string[];
  meetings: string[];
  emails: string[];
  tasks: string[];
}

export interface DealProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

export interface Email {
  id: string;
  
  // Recipients
  fromEmail: string;
  toEmails: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  
  // Content
  subject: string;
  body: string;
  htmlBody?: string;
  
  // Metadata
  threadId?: string;
  messageId: string;
  inReplyTo?: string;
  
  // Status
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'spam';
  direction: 'inbound' | 'outbound';
  
  // Timing
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  repliedAt?: string;
  
  // Tracking
  opens: EmailOpen[];
  clicks: EmailClick[];
  
  // Sequence
  sequenceId?: string;
  stepId?: string;
  
  // Related Records
  prospectIds: string[];
  companyId?: string;
  dealId?: string;
  
  // Attachments
  attachments: EmailAttachment[];
  
  // Metadata
  tags: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailOpen {
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export interface EmailClick {
  timestamp: string;
  url: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export interface EmailAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

// Analytics & Reporting
export interface AnalyticsMetrics {
  // Overview
  totalProspects: number;
  totalCompanies: number;
  totalDeals: number;
  totalRevenue: number;
  
  // Engagement
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  
  // Conversion
  leadsGenerated: number;
  meetingsBooked: number;
  dealsCreated: number;
  dealsClosed: number;
  
  // Rates
  openRate: number;
  clickRate: number;
  replyRate: number;
  meetingBookedRate: number;
  dealConversionRate: number;
  
  // Time Period
  period: string;
  startDate: string;
  endDate: string;
}

export interface PerformanceMetrics {
  userId: string;
  userName: string;
  
  // Activity
  emailsSent: number;
  callsMade: number;
  meetingsBooked: number;
  
  // Results
  leadsGenerated: number;
  dealsCreated: number;
  revenue: number;
  
  // Efficiency
  responseRate: number;
  meetingShowRate: number;
  dealConversionRate: number;
  avgDealSize: number;
  avgSalesCycle: number;
  
  // Rankings
  rank: number;
  totalUsers: number;
  
  // Period
  period: string;
}

// Search & Discovery
export interface SearchQuery {
  id: string;
  name?: string;
  
  // Filters
  personFilters: PersonFilters;
  companyFilters: CompanyFilters;
  
  // Logic
  logic: 'AND' | 'OR';
  
  // Results
  estimatedResults: number;
  actualResults?: number;
  
  // Metadata
  createdAt: string;
  lastRun?: string;
}

export interface PersonFilters {
  titles?: string[];
  seniorities?: string[];
  departments?: string[];
  functions?: string[];
  locations?: string[];
  keywords?: string[];
  excludeKeywords?: string[];
}

export interface CompanyFilters {
  industries?: string[];
  subIndustries?: string[];
  employeeRanges?: string[];
  revenueRanges?: string[];
  locations?: string[];
  technologies?: string[];
  fundingStages?: string[];
  keywords?: string[];
  excludeKeywords?: string[];
}

// Integration Types
export interface Integration {
  id: string;
  name: string;
  type: 'email' | 'calendar' | 'crm' | 'data_provider' | 'social' | 'telephony';
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  
  // Configuration
  settings: Record<string, any>;
  credentials: Record<string, any>;
  
  // Sync
  lastSyncAt?: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  syncErrors?: string[];
  
  // Usage
  apiCallsUsed: number;
  apiCallsLimit: number;
  
  // Metadata
  connectedBy: string;
  connectedAt: string;
  updatedAt: string;
}

// Workflow & Automation
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  
  // Trigger
  trigger: WorkflowTrigger;
  
  // Conditions
  conditions: WorkflowCondition[];
  
  // Actions
  actions: WorkflowAction[];
  
  // Status
  isActive: boolean;
  
  // Execution
  executionCount: number;
  lastExecutedAt?: string;
  
  // Metadata
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTrigger {
  type: 'record_created' | 'record_updated' | 'field_changed' | 'email_opened' | 'email_clicked' | 'email_replied' | 'sequence_completed' | 'meeting_scheduled' | 'deal_stage_changed';
  entityType: 'prospect' | 'company' | 'deal' | 'email' | 'meeting';
  field?: string;
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
  logic: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'create_task' | 'send_email' | 'add_to_sequence' | 'update_field' | 'create_deal' | 'schedule_meeting' | 'send_notification' | 'webhook';
  parameters: Record<string, any>;
  delay?: number; // minutes
}

// Export default configurations
export const DEFAULT_SEARCH_FILTERS: SearchFilter[] = [];

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

export const BULK_ACTIONS: BulkAction[] = [
  {
    id: 'add_to_sequence',
    name: 'Add to Sequence',
    description: 'Add selected prospects to an email sequence',
    icon: 'Mail',
    category: 'engagement',
    requiresConfirmation: false,
    parameters: [
      {
        name: 'sequenceId',
        label: 'Select Sequence',
        type: 'select',
        required: true,
        options: []
      }
    ]
  },
  {
    id: 'add_to_list',
    name: 'Add to List',
    description: 'Add selected prospects to a list',
    icon: 'List',
    category: 'organization',
    requiresConfirmation: false,
    parameters: [
      {
        name: 'listId',
        label: 'Select List',
        type: 'select',
        required: true,
        options: []
      }
    ]
  },
  {
    id: 'assign_owner',
    name: 'Assign Owner',
    description: 'Assign selected prospects to a team member',
    icon: 'User',
    category: 'organization',
    requiresConfirmation: false,
    parameters: [
      {
        name: 'ownerId',
        label: 'Select Owner',
        type: 'select',
        required: true,
        options: []
      }
    ]
  },
  {
    id: 'add_tags',
    name: 'Add Tags',
    description: 'Add tags to selected prospects',
    icon: 'Tag',
    category: 'organization',
    requiresConfirmation: false,
    parameters: [
      {
        name: 'tags',
        label: 'Tags',
        type: 'multiselect',
        required: true,
        options: []
      }
    ]
  },
  {
    id: 'export',
    name: 'Export',
    description: 'Export selected prospects to CSV',
    icon: 'Download',
    category: 'data',
    requiresConfirmation: false
  },
  {
    id: 'delete',
    name: 'Delete',
    description: 'Delete selected prospects',
    icon: 'Trash',
    category: 'data',
    requiresConfirmation: true
  }
];