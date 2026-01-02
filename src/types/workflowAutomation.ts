export type CRMProvider = 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export type SyncFrequency = 'realtime' | 'every_15min' | 'hourly' | 'daily' | 'manual';

export type SyncDirection = 'bidirectional' | 'platform_to_crm' | 'crm_to_platform';

export type ConflictResolution = 'crm_wins' | 'platform_wins' | 'most_recent_wins' | 'manual';

export type WorkflowTriggerType =
  | 'prospect_added'
  | 'status_changed'
  | 'email_opened'
  | 'email_replied'
  | 'meeting_booked'
  | 'form_submitted'
  | 'webhook'
  | 'scheduled'
  | 'manual';

export type WorkflowActionType =
  | 'send_email'
  | 'create_task'
  | 'update_crm'
  | 'send_slack'
  | 'send_teams'
  | 'add_to_sequence'
  | 'enrich_data'
  | 'score_lead'
  | 'wait_delay'
  | 'webhook_call'
  | 'update_field'
  | 'add_tag'
  | 'assign_owner';

export type NotificationChannel = 'slack' | 'teams' | 'email' | 'webhook';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type SequenceChannelType = 'email' | 'linkedin' | 'phone' | 'sms' | 'wait';

export interface CRMIntegration {
  id: string;
  user_id: string;
  organization_id?: string;
  provider: CRMProvider;
  connection_name: string;
  status: IntegrationStatus;
  oauth_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  instance_url?: string;
  api_version?: string;
  sync_frequency: SyncFrequency;
  sync_direction: SyncDirection;
  conflict_resolution: ConflictResolution;
  last_sync_at?: string;
  last_sync_status?: string;
  sync_errors_count: number;
  is_active: boolean;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CRMFieldMapping {
  id: string;
  integration_id: string;
  platform_object: string;
  crm_object: string;
  platform_field: string;
  crm_field: string;
  field_type: string;
  is_bidirectional: boolean;
  transform_function?: string;
  is_required: boolean;
  default_value?: string;
  mapping_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CRMSyncLog {
  id: string;
  integration_id: string;
  sync_type: string;
  direction: SyncDirection;
  started_at: string;
  completed_at?: string;
  status: ExecutionStatus;
  records_processed: number;
  records_succeeded: number;
  records_failed: number;
  error_details: Array<{
    record_id?: string;
    error: string;
    details?: string;
  }>;
  sync_summary: Record<string, any>;
  created_at: string;
}

export interface WorkflowStep {
  id: string;
  type: WorkflowActionType;
  config: Record<string, any>;
  conditions?: WorkflowCondition[];
  next_step_id?: string;
  on_success_step_id?: string;
  on_failure_step_id?: string;
  position: { x: number; y: number };
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logic?: 'and' | 'or';
}

export interface WorkflowAutomation {
  id: string;
  user_id: string;
  organization_id?: string;
  name: string;
  description?: string;
  trigger_type: WorkflowTriggerType;
  trigger_config: Record<string, any>;
  workflow_steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  is_active: boolean;
  execution_count: number;
  success_count: number;
  failure_count: number;
  avg_duration_ms: number;
  last_executed_at?: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  trigger_data: Record<string, any>;
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  steps_executed: Array<{
    step_id: string;
    status: ExecutionStatus;
    started_at: string;
    completed_at?: string;
    result?: any;
    error?: string;
  }>;
  current_step: number;
  error_message?: string;
  error_details?: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
}

export interface NotificationConfiguration {
  id: string;
  user_id: string;
  organization_id?: string;
  name: string;
  channel: NotificationChannel;
  webhook_url: string;
  trigger_events: string[];
  filter_rules: Record<string, any>;
  message_template?: string;
  is_active: boolean;
  delivery_count: number;
  failure_count: number;
  last_delivered_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  configuration_id: string;
  event_type: string;
  event_data: Record<string, any>;
  status: ExecutionStatus;
  sent_at: string;
  delivered_at?: string;
  response_code?: number;
  response_body?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

export interface ChromeExtensionSession {
  id: string;
  user_id: string;
  session_token: string;
  extension_id: string;
  browser_info: Record<string, any>;
  last_activity_at: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

export interface MultiChannelSequenceStep {
  id: string;
  step_number: number;
  channel: SequenceChannelType;
  delay_days: number;
  delay_hours: number;
  template_id?: string;
  template_content?: string;
  conditions?: WorkflowCondition[];
  is_active: boolean;
  metadata: Record<string, any>;
}

export interface SequencePerformanceByChannel {
  channel: SequenceChannelType;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger_type: WorkflowTriggerType;
  steps: WorkflowStep[];
  icon: string;
  is_popular: boolean;
}

export interface IntegrationHealthStatus {
  integration_id: string;
  is_healthy: boolean;
  issues: Array<{
    type: 'error' | 'warning';
    message: string;
    suggestion?: string;
  }>;
  last_check: string;
}

export interface SyncStatistics {
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  total_records_synced: number;
  average_sync_duration_ms: number;
  last_7_days: Array<{
    date: string;
    syncs: number;
    records: number;
    errors: number;
  }>;
}
