export type SearchOperator = 'AND' | 'OR' | 'NOT';

export type AlertFrequency = 'realtime' | 'daily' | 'weekly' | 'monthly';

export type AlertDelivery = 'email' | 'slack' | 'in_app' | 'webhook';

export type ExportFormat = 'csv' | 'excel' | 'json' | 'google_sheets';

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type BulkActionType =
  | 'add_to_sequence'
  | 'add_to_list'
  | 'export'
  | 'enrich'
  | 'update_status'
  | 'assign_owner'
  | 'delete'
  | 'update_field'
  | 'add_tag';

export interface BooleanSearchQuery {
  operator?: SearchOperator;
  term?: string;
  children?: BooleanSearchQuery[];
  field?: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  organization_id?: string;
  name: string;
  description?: string;
  query_text?: string;
  query_ast?: BooleanSearchQuery;
  filters: Record<string, any>;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  result_count: number;
  last_run_at?: string;
  is_favorite: boolean;
  folder?: string;
  tags: string[];
  sharing_settings: Record<string, any>;
  run_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  query_text: string;
  query_ast?: BooleanSearchQuery;
  filters: Record<string, any>;
  result_count: number;
  execution_time_ms?: number;
  clicked_results: string[];
  is_saved: boolean;
  saved_search_id?: string;
  created_at: string;
}

export interface SearchAlert {
  id: string;
  user_id: string;
  organization_id?: string;
  saved_search_id: string;
  name: string;
  frequency: AlertFrequency;
  delivery_channels: AlertDelivery[];
  threshold_count: number;
  is_active: boolean;
  is_paused: boolean;
  pause_until?: string;
  last_triggered_at?: string;
  total_triggers: number;
  notification_settings: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AlertTrigger {
  id: string;
  alert_id: string;
  triggered_at: string;
  new_results_count: number;
  matched_prospect_ids: string[];
  was_sent: boolean;
  sent_at?: string;
  delivery_status: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ExportJob {
  id: string;
  user_id: string;
  name: string;
  export_format: ExportFormat;
  status: ExportStatus;
  search_criteria: Record<string, any>;
  selected_fields: string[];
  total_records: number;
  processed_records: number;
  download_url?: string;
  expires_at?: string;
  is_scheduled: boolean;
  schedule_frequency?: string;
  next_run_at?: string;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface LookalikeModel {
  id: string;
  user_id: string;
  organization_id?: string;
  name: string;
  source_company_ids: string[];
  similarity_criteria: Record<string, any>;
  threshold_score: number;
  model_config: Record<string, any>;
  is_active: boolean;
  total_matches: number;
  last_computed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BulkOperation {
  id: string;
  user_id: string;
  operation_type: BulkActionType;
  target_ids: string[];
  operation_config: Record<string, any>;
  status: ExportStatus;
  total_items: number;
  processed_items: number;
  succeeded_items: number;
  failed_items: number;
  error_details: Array<{ id?: string; error: string }>;
  can_undo: boolean;
  undo_data?: Record<string, any>;
  started_at: string;
  completed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SearchSuggestion {
  id: string;
  query_text: string;
  suggestion_type: string;
  search_count: number;
  success_rate: number;
  avg_result_count: number;
  last_searched_at: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface FilterPreset {
  id: string;
  user_id: string;
  organization_id?: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  is_global: boolean;
  usage_count: number;
  is_favorite: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  industry?: string[];
  companySize?: string[];
  location?: string[];
  techStack?: string[];
  fundingStage?: string[];
  recentlyFunded?: boolean;
  fundingDays?: number;
  hiringActively?: boolean;
  newsMentions?: boolean;
  newsMentionsDays?: number;
  employeeGrowth?: 'growing' | 'stable' | 'declining';
  locationRadius?: {
    zipCode: string;
    miles: number;
  };
  excludeContacted?: boolean;
  customFields?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  name: string;
  title?: string;
  company?: string;
  location?: string;
  email?: string;
  phone?: string;
  relevanceScore: number;
  matchedTerms: string[];
  matchReasons: string[];
  lastActivity?: string;
  qualityScore: number;
  metadata: Record<string, any>;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  executionTime: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

export interface LookalikeResult extends SearchResult {
  similarityScore: number;
  similarityReasons: string[];
  sourceCompany: {
    id: string;
    name: string;
  };
}

export interface ComparisonProspect {
  id: string;
  name: string;
  company: string;
  title: string;
  email?: string;
  phone?: string;
  location: string;
  qualityScore: number;
  fields: Record<string, any>;
}

export interface BulkActionProgress {
  operationId: string;
  status: ExportStatus;
  progress: number;
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export interface QuickFilter {
  id: string;
  label: string;
  icon: string;
  filter: Partial<SearchFilters>;
  count?: number;
}

export interface AppliedFilter {
  field: string;
  label: string;
  value: any;
  displayValue: string;
}

export interface SearchKeyboardShortcut {
  key: string;
  modifier?: 'ctrl' | 'cmd' | 'shift' | 'alt';
  action: string;
  description: string;
}
