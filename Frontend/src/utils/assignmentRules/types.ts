// ── Condition types ──────────────────────────────────────────────────────────

export type ConditionField =
  | 'source'
  | 'score'
  | 'territory'
  | 'persona'
  | 'company_size'
  | 'business_hours'
  | 'tags'
  | 'availability';

export type ConditionOp =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'in' | 'not_in'
  | 'gte' | 'lte' | 'between';

export interface BusinessHoursValue {
  startHour: number;  // 0–23
  endHour: number;    // 0–23
  days: number[];     // 0=Sun … 6=Sat
  timezone: string;   // IANA timezone string
}

export interface RuleCondition {
  id: string;
  field: ConditionField;
  op: ConditionOp;
  // Runtime shapes:
  //   string       → equals | not_equals | contains | not_contains
  //   string[]     → in | not_in
  //   number       → gte | lte
  //   [num, num]   → between
  //   BusinessHoursValue → business_hours field (op ignored in evaluation)
  value: unknown;
}

// ── Action types ─────────────────────────────────────────────────────────────

export type OwnershipMode = 'direct_user' | 'round_robin' | 'weighted_round_robin' | 'queue';

export interface AssignmentAction {
  mode: OwnershipMode;
  userId?: string;                       // direct_user
  userIds?: string[];                    // round_robin | queue | weighted_round_robin
  weights?: Record<string, number>;      // weighted_round_robin: userId → weight (default 1)
}

export interface FollowUpTaskConfig {
  enabled: boolean;
  type: 'call' | 'email' | 'meeting';
  dueInHours: number;
  title: string;
}

// ── Rule ─────────────────────────────────────────────────────────────────────

export interface AssignmentRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;                      // 1 = highest; matches array index + 1
  conditionGrouping: 'all' | 'any';     // AND vs OR across conditions
  conditions: RuleCondition[];
  action: AssignmentAction;
  followUpTask?: FollowUpTaskConfig;
  createdAt: string;
  updatedAt: string;
}

// ── Territory ────────────────────────────────────────────────────────────────

export interface TerritoryDefinition {
  id: string;
  name: string;
  countries: string[];
  cities: string[];
}

// ── Evaluation result ────────────────────────────────────────────────────────

export interface ConditionTrace {
  conditionId: string;
  field: ConditionField;
  op: ConditionOp;
  expected: unknown;
  actual: unknown;
  passed: boolean;
  reason: string;
}

export interface RuleTrace {
  ruleId: string;
  ruleName: string;
  enabled: boolean;
  grouping: 'all' | 'any';
  conditionResults: ConditionTrace[];
  matched: boolean;
  skipReason?: string;   // e.g., "rule disabled"
}

export interface AssignmentResult {
  matched: boolean;
  ruleId: string | null;
  ruleName: string | null;
  assignedUserId: string | null;
  assignedUserLabel: string | null;
  mode: OwnershipMode | null;
  followUpTask: FollowUpTaskConfig | null;
  reason: string;
  trace: RuleTrace[];
}

// ── Field/operator metadata (used by RuleEditor) ─────────────────────────────

export const FIELD_LABELS: Record<ConditionField, string> = {
  source:         'Lead Source',
  score:          'Lead Score',
  territory:      'Territory',
  persona:        'Persona / Title',
  company_size:   'Company Size',
  business_hours: 'Business Hours',
  tags:           'Tags',
  availability:   'Availability',
};

export const PERSONA_PRESETS: Record<string, string[]> = {
  Executive:              ['VP', 'Vice President', 'Chief', 'President', 'Director', 'Head of', 'SVP', 'EVP', 'CTO', 'CEO', 'CFO', 'COO', 'CMO', 'CRO', 'Partner'],
  Practitioner:           ['Manager', 'Lead', 'Senior', 'Principal', 'Architect', 'Staff'],
  'Individual Contributor': ['Engineer', 'Analyst', 'Specialist', 'Associate', 'Coordinator', 'Developer', 'Consultant'],
};

export const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-1000', '1001+'] as const;
export type CompanySize = typeof COMPANY_SIZE_OPTIONS[number];

export const SOURCE_OPTIONS = [
  'Website', 'Referral', 'HRMS', 'Lead Gen', 'Manual',
  'LinkedIn', 'Cold Email', 'Trade Show', 'Social Media',
] as const;

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
