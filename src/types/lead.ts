export type LeadStatus = 'new' | 'working' | 'nurturing' | 'qualified' | 'unqualified' | 'converted' | 'lost';
export type LeadTemperature = 'hot' | 'warm' | 'cold' | 'frozen';
export type LeadGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note' | 'sms' | 'whatsapp' | 'linkedin' | 'demo' | 'proposal' | 'document' | 'visit';
export type ActivityDirection = 'inbound' | 'outbound';
export type ActivityStatus = 'planned' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  position?: string;
  department?: string;
  industry?: string;
  company_size?: string;
  annual_revenue?: number;
  website?: string;
  account_id?: string;
  contact_id?: string;
  owner_id: string;
  status: LeadStatus;
  temperature: LeadTemperature;
  grade?: LeadGrade;
  score: number;
  ai_score?: number;
  manual_score_override?: number;
  pipeline_id?: string;
  stage_id?: string;
  stage_entered_at?: string;
  estimated_value: number;
  probability: number;
  expected_close_date?: string;
  currency: string;
  source: string;
  source_detail?: string;
  campaign_id?: string;
  referring_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  custom_fields: Record<string, any>;
  enrichment_data: Record<string, any>;
  enriched_at?: string;
  email_opt_in: boolean;
  sms_opt_in: boolean;
  call_opt_in: boolean;
  do_not_contact: boolean;
  gdpr_consent: boolean;
  gdpr_consent_date?: string;
  is_qualified: boolean;
  qualified_at?: string;
  qualified_by?: string;
  qualification_notes?: string;
  converted_at?: string;
  converted_to_contact_id?: string;
  converted_to_deal_id?: string;
  converted_by?: string;
  first_contact_date?: string;
  last_contact_date?: string;
  last_activity_date?: string;
  next_follow_up_date?: string;
  last_email_sent_at?: string;
  last_email_opened_at?: string;
  last_email_clicked_at?: string;
  email_opens_count: number;
  email_clicks_count: number;
  page_views_count: number;
  meeting_count: number;
  call_count: number;
  email_sent_count: number;
  ai_recommendations: any[];
  automation_paused: boolean;
  automation_paused_until?: string;
  tags: string[];
  quick_notes?: string;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: ActivityType;
  direction?: ActivityDirection;
  status: ActivityStatus;
  subject: string;
  description?: string;
  outcome?: string;
  scheduled_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  location?: string;
  meeting_url?: string;
  recording_url?: string;
  participants: any[];
  attendees: string[];
  attachments: any[];
  related_entities: any[];
  custom_fields: Record<string, any>;
  automation_triggered: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  owner_id: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  content: string;
  is_pinned: boolean;
  mentions: string[];
  attachments: any[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_deleted: boolean;
  deleted_at?: string;
}

export interface LeadTask {
  id: string;
  lead_id: string;
  title: string;
  description?: string;
  task_type?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  completed_at?: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  assigned_to: string;
  depends_on_task_ids: string[];
  subtasks: any[];
  automation_triggered: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface LeadEmail {
  id: string;
  lead_id: string;
  direction: ActivityDirection;
  from_email: string;
  to_emails: string[];
  cc_emails: string[];
  bcc_emails: string[];
  subject: string;
  body_html?: string;
  body_text?: string;
  thread_id?: string;
  message_id?: string;
  in_reply_to?: string;
  template_id?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  bounced_at?: string;
  open_count: number;
  click_count: number;
  status: string;
  attachments: any[];
  tracking_enabled: boolean;
  created_at: string;
  created_by: string;
}

export interface LeadCall {
  id: string;
  lead_id: string;
  direction: ActivityDirection;
  from_number?: string;
  to_number?: string;
  duration_seconds?: number;
  outcome?: string;
  disposition?: string;
  recording_url?: string;
  transcription?: string;
  sentiment_score?: number;
  sentiment_analysis?: any;
  notes?: string;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  created_by: string;
}

export interface LeadMeeting {
  id: string;
  lead_id: string;
  title: string;
  description?: string;
  meeting_type?: string;
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  meeting_url?: string;
  attendees: any[];
  status: ActivityStatus;
  recording_url?: string;
  notes?: string;
  outcome?: string;
  next_steps?: string;
  reminder_sent: boolean;
  follow_up_created: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  category?: string;
  usage_count: number;
  created_at: string;
}

export interface LeadPipeline {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface LeadPipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  description?: string;
  color?: string;
  position: number;
  probability: number;
  requirements: any[];
  automations: any[];
  is_closed_won: boolean;
  is_closed_lost: boolean;
  created_at: string;
}

export interface LeadView {
  id: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  sort_by?: string;
  sort_order: string;
  columns: string[];
  is_default: boolean;
  is_public: boolean;
  is_system: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LeadAIInsight {
  id: string;
  lead_id: string;
  insight_type: string;
  title: string;
  description: string;
  confidence: number;
  priority: string;
  action_items: any[];
  supporting_data: Record<string, any>;
  status: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  dismissed_at?: string;
  dismissed_by?: string;
  created_at: string;
  expires_at?: string;
}

export interface LeadFilters {
  search?: string;
  status?: LeadStatus[];
  temperature?: LeadTemperature[];
  grade?: LeadGrade[];
  source?: string[];
  owner_id?: string[];
  tags?: string[];
  score_min?: number;
  score_max?: number;
  value_min?: number;
  value_max?: number;
  created_after?: string;
  created_before?: string;
  last_activity_after?: string;
  last_activity_before?: string;
}

export interface BulkOperation {
  operation: 'update_owner' | 'update_status' | 'update_stage' | 'add_tags' | 'remove_tags' | 'delete' | 'export' | 'send_email' | 'create_task';
  lead_ids: string[];
  parameters?: Record<string, any>;
}

export interface LeadEnrichmentRequest {
  lead_id: string;
  email?: string;
  company?: string;
  domain?: string;
}

export interface LeadEnrichmentResponse {
  person_data?: {
    full_name?: string;
    position?: string;
    seniority?: string;
    department?: string;
    linkedin_url?: string;
    twitter_url?: string;
  };
  company_data?: {
    name?: string;
    domain?: string;
    industry?: string;
    size?: string;
    revenue?: number;
    description?: string;
    logo_url?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
  };
  confidence: number;
}
