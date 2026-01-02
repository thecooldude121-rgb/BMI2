export type PermissionType = 'read' | 'write' | 'delete' | 'share' | 'export' | 'import';
export type AccessLevel = 'none' | 'read' | 'read_write' | 'full';
export type SharingRuleType = 'public' | 'private' | 'conditional';
export type WorkflowTriggerType = 'create' | 'update' | 'delete' | 'schedule' | 'manual';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated';
export type ActivityType = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'export' | 'import' | 'permission_change';
export type SupportPriority = 'low' | 'medium' | 'high' | 'critical';
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// ============================================
// ROLES & PERMISSIONS
// ============================================

export interface SystemRole {
  id: string;
  name: string;
  description?: string;
  parent_role_id?: string;
  hierarchy_level: number;
  business_unit?: string;
  status?: string;
  is_system: boolean;
  is_active: boolean;
  permissions: Record<string, any>;
  restrictions: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
}

export interface SystemPermission {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: string;
  resource_type: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  access_level: AccessLevel;
  conditions: Record<string, any>;
  granted_at: string;
  granted_by: string;
}

export interface PermissionSet {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, any>;
  is_template: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface SystemProfile {
  id: string;
  name: string;
  description?: string;
  default_role_id?: string;
  permission_set_ids: string[];
  default_permissions: Record<string, any>;
  ui_preferences: Record<string, any>;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FieldPermission {
  id: string;
  role_id?: string;
  profile_id?: string;
  module_name: string;
  field_name: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  conditions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ModulePermission {
  id: string;
  role_id?: string;
  profile_id?: string;
  module_name: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_import: boolean;
  restrictions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================
// SHARING & ACCESS
// ============================================

export interface SharingRule {
  id: string;
  name: string;
  description?: string;
  module_name: string;
  rule_type: SharingRuleType;
  share_with_roles: string[];
  share_with_groups: string[];
  share_with_users: string[];
  access_level: AccessLevel;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface SharingCriteria {
  id: string;
  sharing_rule_id: string;
  field_name: string;
  operator: string;
  value: string;
  logical_operator: string;
  position: number;
  created_at: string;
}

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  parent_group_id?: string;
  group_type?: string;
  hierarchy_path?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role_in_group?: string;
  added_at: string;
  added_by: string;
}

export interface TemporaryAccess {
  id: string;
  user_id: string;
  resource_type: string;
  resource_id?: string;
  permissions: Record<string, any>;
  granted_by: string;
  granted_at: string;
  expires_at: string;
  reason?: string;
  is_active: boolean;
  revoked_at?: string;
  revoked_by?: string;
}

// ============================================
// SECURITY SETTINGS
// ============================================

export interface SecurityPolicy {
  id: string;
  policy_name: string;
  policy_type: string;
  settings: Record<string, any>;
  is_active: boolean;
  is_enforced: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

export interface PasswordPolicy {
  id: string;
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  expiry_days: number;
  history_count: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IPRestriction {
  id: string;
  ip_address: string;
  ip_range?: string;
  restriction_type: string;
  reason?: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export interface SessionSettings {
  id: string;
  timeout_minutes: number;
  idle_timeout_minutes: number;
  max_concurrent_sessions: number;
  require_reauth_for_sensitive: boolean;
  is_active: boolean;
  updated_at: string;
  updated_by: string;
}

export interface SSOConfiguration {
  id: string;
  provider_name: string;
  provider_type: string;
  client_id: string;
  client_secret?: string;
  auth_endpoint?: string;
  token_endpoint?: string;
  user_info_endpoint?: string;
  saml_metadata?: string;
  attribute_mapping: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface APIToken {
  id: string;
  user_id: string;
  token_name: string;
  token_hash: string;
  token_preview: string;
  scopes: string[];
  expires_at?: string;
  last_used_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface APIRateLimit {
  id: string;
  endpoint_pattern: string;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// AUDIT & ACTIVITY
// ============================================

export interface AuditLog {
  id: string;
  user_id?: string;
  activity_type: ActivityType;
  module_name?: string;
  record_id?: string;
  action: string;
  description?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ActivityFeed {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  title: string;
  description?: string;
  related_module?: string;
  related_record_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface LoginHistory {
  id: string;
  user_id: string;
  login_at: string;
  logout_at?: string;
  ip_address: string;
  user_agent?: string;
  device_fingerprint?: string;
  location?: Record<string, any>;
  login_method: string;
  is_successful: boolean;
  failure_reason?: string;
  session_id?: string;
}

export interface PermissionChange {
  id: string;
  target_user_id?: string;
  target_role_id?: string;
  change_type: string;
  permission_before?: Record<string, any>;
  permission_after?: Record<string, any>;
  changed_by: string;
  changed_at: string;
  reason?: string;
}

export interface DataAccessLog {
  id: string;
  user_id: string;
  module_name: string;
  record_id?: string;
  access_type: string;
  fields_accessed: string[];
  ip_address?: string;
  accessed_at: string;
}

export interface SuspiciousActivity {
  id: string;
  user_id?: string;
  activity_type: string;
  severity: string;
  description: string;
  details: Record<string, any>;
  ip_address?: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  detected_at: string;
}

// ============================================
// UI & FILTERS
// ============================================

export interface RoleFilters {
  search?: string;
  is_active?: boolean;
  hierarchy_level?: number;
  created_after?: string;
}

export interface AuditLogFilters {
  user_id?: string;
  activity_type?: ActivityType[];
  module_name?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface PermissionChangeFilters {
  target_user_id?: string;
  changed_by?: string;
  date_from?: string;
  date_to?: string;
}

// ============================================
// BULK OPERATIONS
// ============================================

export interface BulkRoleOperation {
  operation: 'assign_users' | 'update_permissions' | 'activate' | 'deactivate' | 'delete';
  role_ids: string[];
  parameters?: Record<string, any>;
}

export interface BulkPermissionOperation {
  operation: 'grant' | 'revoke' | 'update';
  user_ids: string[];
  permission_ids: string[];
  access_level?: AccessLevel;
}

// ============================================
// SETTINGS EXPORT/IMPORT
// ============================================

export interface SettingsExport {
  roles: SystemRole[];
  permissions: SystemPermission[];
  profiles: SystemProfile[];
  security_policies: SecurityPolicy[];
  exported_at: string;
  exported_by: string;
}

export interface SettingsImportResult {
  success: number;
  failed: number;
  errors: Array<{
    item: string;
    error: string;
  }>;
}

// ============================================
// ANALYTICS & INSIGHTS
// ============================================

export interface SecurityMetrics {
  total_users: number;
  active_sessions: number;
  failed_login_attempts_24h: number;
  suspicious_activities_count: number;
  api_calls_today: number;
  avg_session_duration_minutes: number;
}

export interface RoleHierarchyNode {
  role: SystemRole;
  children: RoleHierarchyNode[];
  user_count: number;
}

export interface PermissionConflict {
  type: 'redundant' | 'conflicting' | 'missing';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affected_roles: string[];
  recommendation: string;
}

// ============================================
// WIZARD & ONBOARDING
// ============================================

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  is_required: boolean;
  is_completed: boolean;
  data?: Record<string, any>;
}

export interface UserOnboarding {
  user_id: string;
  template_id: string;
  current_step: number;
  completed_steps: number[];
  status: string;
  started_at: string;
  completed_at?: string;
}

// ============================================
// COLLABORATION
// ============================================

export interface AdminNote {
  id: string;
  context_type: string;
  context_id?: string;
  content: string;
  is_pinned: boolean;
  mentions: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface SupportRequest {
  id: string;
  title: string;
  description: string;
  category?: string;
  priority: SupportPriority;
  status: SupportStatus;
  requested_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  change_type: string;
  current_value?: Record<string, any>;
  proposed_value?: Record<string, any>;
  justification?: string;
  requested_by: string;
  reviewed_by?: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
  review_notes?: string;
}

export interface SettingsVersion {
  id: string;
  setting_type: string;
  setting_id: string;
  version_number: number;
  snapshot: Record<string, any>;
  change_summary?: string;
  created_at: string;
  created_by: string;
}
