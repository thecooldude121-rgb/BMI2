// Core CRM Types and Interfaces
export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'datetime' | 'select' | 'multiselect' | 'boolean' | 'textarea' | 'url';
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  entityType: 'lead' | 'contact' | 'deal' | 'account' | 'task' | 'activity';
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  entityType: 'deal' | 'lead';
  stages: PipelineStage[];
  isDefault: boolean;
  isActive: boolean;
  settings: {
    autoRotting: boolean;
    rottingDays: number;
    probabilityEnabled: boolean;
    forecastEnabled: boolean;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  color: string;
  position: number;
  probability: number;
  isClosedWon: boolean;
  isClosedLost: boolean;
  requirements?: string[];
  automations?: StageAutomation[];
}

export interface StageAutomation {
  id: string;
  trigger: 'enter' | 'exit' | 'duration';
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface AutomationAction {
  type: 'create_task' | 'send_email' | 'assign_user' | 'update_field' | 'create_activity' | 'send_notification' | 'webhook';
  parameters: Record<string, any>;
}

export interface Account {
  id: string;
  name: string;
  domain?: string;
  industry: string;
  type: 'prospect' | 'customer' | 'partner' | 'vendor';
  size: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | 'unknown';
  revenue?: number;
  employees?: number;
  description?: string;
  website?: string;
  phone?: string;
  address: Address;
  parentAccountId?: string;
  ownerId: string;
  tags: string[];
  customFields: Record<string, any>;
  socialProfiles: SocialProfile[];
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

export interface Contact {
  id: string;
  accountId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  position?: string;
  department?: string;
  isPrimary: boolean;
  status: 'active' | 'inactive' | 'bounced' | 'unsubscribed';
  leadSource?: string;
  ownerId: string;
  tags: string[];
  customFields: Record<string, any>;
  socialProfiles: SocialProfile[];
  preferences: ContactPreferences;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  lastContactedAt?: string;
}

export interface Lead {
  id: string;
  contactId?: string;
  accountId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  industry?: string;
  pipelineId: string;
  stageId: string;
  status: 'new' | 'working' | 'nurturing' | 'qualified' | 'unqualified';
  source: string;
  score: number;
  aiScore?: number;
  temperature: 'hot' | 'warm' | 'cold';
  estimatedValue?: number;
  probability?: number;
  expectedCloseDate?: string;
  ownerId: string;
  tags: string[];
  customFields: Record<string, any>;
  socialProfiles: SocialProfile[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  convertedAt?: string;
  convertedToContactId?: string;
  convertedToDealId?: string;
}

export interface Deal {
  id: string;
  name: string;
  accountId?: string;
  contactId?: string;
  pipelineId: string;
  stageId: string;
  value: number;
  currency: string;
  probability: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  closeReason?: string;
  ownerId: string;
  teamMembers: string[];
  tags: string[];
  customFields: Record<string, any>;
  products?: DealProduct[];
  competitors?: string[];
  lostReason?: string;
  wonReason?: string;
  description?: string;
  nextStep?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  stageHistory: StageHistoryEntry[];
}

export interface DealProduct {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface StageHistoryEntry {
  stageId: string;
  stageName: string;
  enteredAt: string;
  exitedAt?: string;
  duration?: number;
  userId: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'sms' | 'whatsapp' | 'linkedin' | 'demo' | 'proposal' | 'document';
  subject: string;
  description?: string;
  direction?: 'inbound' | 'outbound';
  status: 'planned' | 'completed' | 'cancelled' | 'no_show';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  outcome?: string;
  duration?: number;
  scheduledAt?: string;
  completedAt?: string;
  location?: string;
  meetingUrl?: string;
  recordingUrl?: string;
  createdBy: string;
  ownerId: string;
  relatedTo: ActivityRelation[];
  attendees: ActivityAttendee[];
  attachments: ActivityAttachment[];
  tags: string[];
  customFields: Record<string, any>;
  automationTriggered?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityRelation {
  entityType: 'lead' | 'contact' | 'deal' | 'account';
  entityId: string;
  isPrimary: boolean;
}

export interface ActivityAttendee {
  type: 'user' | 'contact' | 'external';
  id?: string;
  email: string;
  name: string;
  response?: 'pending' | 'accepted' | 'declined' | 'tentative';
  attended?: boolean;
}

export interface ActivityAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'call' | 'email' | 'meeting' | 'follow_up' | 'research' | 'proposal' | 'demo' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';
  dueDate?: string;
  completedAt?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  createdBy: string;
  assignedTo: string;
  relatedTo: ActivityRelation[];
  tags: string[];
  customFields: Record<string, any>;
  subtasks: Subtask[];
  dependencies: string[];
  automationTriggered?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  assignedTo?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'social' | 'direct_mail' | 'webinar' | 'event';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  budget?: number;
  targetAudience: CampaignAudience;
  content: CampaignContent;
  metrics: CampaignMetrics;
  automations: CampaignAutomation[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignAudience {
  segments: string[];
  filters: CampaignFilter[];
  excludeSegments?: string[];
  estimatedSize: number;
}

export interface CampaignFilter {
  field: string;
  operator: string;
  value: any;
}

export interface CampaignContent {
  subject?: string;
  body?: string;
  templateId?: string;
  attachments?: string[];
  landingPageUrl?: string;
  callToAction?: string;
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  converted: number;
  revenue: number;
}

export interface CampaignAutomation {
  trigger: 'opened' | 'clicked' | 'replied' | 'not_opened' | 'not_clicked';
  delay: number;
  actions: AutomationAction[];
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  entityType: 'lead' | 'contact' | 'deal' | 'account' | 'task' | 'activity';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  executionCount: number;
  lastExecutedAt?: string;
}

export interface WorkflowTrigger {
  type: 'record_created' | 'record_updated' | 'field_changed' | 'stage_changed' | 'time_based' | 'manual';
  field?: string;
  schedule?: string;
  conditions?: AutomationCondition[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'sales' | 'marketing' | 'support' | 'follow_up' | 'welcome' | 'nurture';
  category: string;
  isActive: boolean;
  variables: TemplateVariable[];
  attachments: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  defaultValue?: any;
  required: boolean;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  type: 'table' | 'chart' | 'dashboard';
  entityType: string;
  filters: ReportFilter[];
  groupBy: string[];
  metrics: ReportMetric[];
  chartType?: 'bar' | 'line' | 'pie' | 'funnel' | 'gauge';
  schedule?: ReportSchedule;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: any;
}

export interface ReportMetric {
  field: string;
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
  label: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
}

export interface Integration {
  id: string;
  name: string;
  type: 'email' | 'calendar' | 'telephony' | 'social' | 'marketing' | 'accounting' | 'support';
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  settings: Record<string, any>;
  credentials: Record<string, any>;
  syncSettings: SyncSettings;
  lastSyncAt?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: number;
  syncDirection: 'bidirectional' | 'import_only' | 'export_only';
  fieldMappings: FieldMapping[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
}

// Utility Types
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface SocialProfile {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'youtube';
  url: string;
  username?: string;
}

export interface ContactPreferences {
  emailOptIn: boolean;
  smsOptIn: boolean;
  callOptIn: boolean;
  marketingOptIn: boolean;
  preferredContactMethod: 'email' | 'phone' | 'sms' | 'whatsapp';
  timezone?: string;
  language?: string;
}

export interface AIInsight {
  id: string;
  type: 'lead_score' | 'deal_prediction' | 'next_action' | 'opportunity' | 'risk' | 'recommendation';
  entityType: string;
  entityId: string;
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  actionItems: string[];
  data: Record<string, any>;
  status: 'active' | 'acknowledged' | 'dismissed';
  createdAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface Notification {
  id: string;
  type: 'mention' | 'assignment' | 'reminder' | 'update' | 'milestone' | 'system';
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  userId: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}