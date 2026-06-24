// ── Field identifiers ─────────────────────────────────────────────────────────

export type FilterFieldId =
  | 'status'
  | 'source'
  | 'score'
  | 'lead_age'
  | 'last_contact_age'
  | 'next_action_due'
  | 'company'
  | 'position'
  | 'country'
  | 'city'
  | 'enrichment_status'
  | 'conversion_readiness'
  | 'duplicate_risk'
  | 'sla_first_response'
  | 'sla_follow_up'
  | 'sla_stale'
  | 'sla_escalation'
  | 'disqualified_reason'
  | 'lost_reason';

// ── Operators ─────────────────────────────────────────────────────────────────

export type FilterOperator =
  // Enum
  | 'is' | 'is_not' | 'is_any_of' | 'is_none_of'
  // Numeric
  | 'equals' | 'not_equals'
  | 'greater_than' | 'greater_than_or_equal'
  | 'less_than'    | 'less_than_or_equal'
  | 'between' | 'is_empty'
  // Date-derived
  | 'within_last_n_days' | 'before_n_days_ago'
  | 'after_date' | 'before_date'
  | 'is_overdue' | 'date_is_empty'
  // Text
  | 'contains' | 'not_contains' | 'starts_with' | 'text_is_empty'
  // Boolean-ish
  | 'is_true' | 'is_false';

// ── Value ─────────────────────────────────────────────────────────────────────

export type FilterValue =
  | string
  | number
  | boolean
  | string[]         // is_any_of / is_none_of
  | [number, number] // between
  | null;

// ── Core types ────────────────────────────────────────────────────────────────

export type FilterCondition = {
  id:       string;
  fieldId:  FilterFieldId;
  operator: FilterOperator;
  value:    FilterValue;
};

export type GroupLogic = 'AND' | 'OR';

export type FilterGroup = {
  id:         string;
  name:       string;
  logic:      GroupLogic;
  conditions: FilterCondition[];
};

export type AdvancedFilter = {
  groups: FilterGroup[];
  // Groups always combine with AND between them
};

// ── Field metadata ────────────────────────────────────────────────────────────

export type FilterFieldMeta = {
  id:               FilterFieldId;
  label:            string;
  category:         'enum' | 'numeric' | 'date' | 'text' | 'boolean';
  allowedOperators: FilterOperator[];
  valueOptions?:    { label: string; value: string }[];
};

export const SLA_SEVERITY_OPTIONS = [
  { label: 'Healthy',  value: 'healthy' },
  { label: 'At Risk',  value: 'at_risk' },
  { label: 'Breached', value: 'breached' },
];

// TODO: Add 'owner' field filter when user directory API is available
export const FILTER_FIELDS: FilterFieldMeta[] = [
  {
    id: 'status',
    label: 'Status',
    category: 'enum',
    allowedOperators: ['is', 'is_not', 'is_any_of', 'is_none_of'],
    valueOptions: [
      { label: 'New',               value: 'new'               },
      { label: 'Assigned',          value: 'assigned'          },
      { label: 'Enriching',         value: 'enriching'         },
      { label: 'Attempting Contact', value: 'attempting_contact' },
      { label: 'Engaged',           value: 'engaged'           },
      { label: 'Qualified',         value: 'qualified'         },
      { label: 'Sales Accepted',    value: 'sales_accepted'    },
      { label: 'Nurture',           value: 'nurture'           },
      { label: 'Disqualified',      value: 'disqualified'      },
      { label: 'Converted',         value: 'converted'         },
      { label: 'Lost',              value: 'lost'              },
    ],
  },
  {
    id: 'source',
    label: 'Source',
    category: 'enum',
    allowedOperators: ['is', 'is_not', 'is_any_of', 'is_none_of'],
    valueOptions: [
      { label: 'Lead Gen', value: 'Lead Gen' },
      { label: 'HRMS',     value: 'HRMS' },
      { label: 'Manual',   value: 'Manual' },
      { label: 'Website',  value: 'Website' },
    ],
  },
  {
    id: 'score',
    label: 'AI Score',
    category: 'numeric',
    allowedOperators: [
      'equals', 'not_equals',
      'greater_than', 'greater_than_or_equal',
      'less_than', 'less_than_or_equal',
      'between', 'is_empty',
    ],
  },
  {
    id: 'lead_age',
    label: 'Lead Age (days)',
    category: 'date',
    allowedOperators: ['within_last_n_days', 'before_n_days_ago', 'after_date', 'before_date', 'date_is_empty'],
  },
  {
    id: 'last_contact_age',
    label: 'Last Contacted',
    category: 'date',
    allowedOperators: ['within_last_n_days', 'before_n_days_ago', 'after_date', 'before_date', 'date_is_empty', 'is_overdue'],
  },
  {
    id: 'next_action_due',
    label: 'Next Follow-up Due',
    category: 'date',
    allowedOperators: ['within_last_n_days', 'before_n_days_ago', 'after_date', 'before_date', 'date_is_empty', 'is_overdue'],
  },
  {
    id: 'company',
    label: 'Company',
    category: 'text',
    allowedOperators: ['contains', 'not_contains', 'starts_with', 'text_is_empty'],
  },
  {
    id: 'position',
    label: 'Job Title / Persona',
    category: 'text',
    allowedOperators: ['contains', 'not_contains', 'starts_with', 'text_is_empty'],
  },
  {
    id: 'country',
    label: 'Territory (Country)',
    category: 'text',
    allowedOperators: ['is', 'is_not', 'is_any_of', 'contains', 'text_is_empty'],
  },
  {
    id: 'city',
    label: 'City',
    category: 'text',
    allowedOperators: ['contains', 'not_contains', 'starts_with', 'text_is_empty'],
  },
  {
    id: 'enrichment_status',
    label: 'Enrichment Status',
    category: 'boolean',
    allowedOperators: ['is_true', 'is_false'],
    // is_true = enriched_at is not null; is_false = enriched_at is null
  },
  {
    id: 'conversion_readiness',
    label: 'Conversion Readiness',
    category: 'enum',
    allowedOperators: ['is', 'is_not', 'is_any_of', 'is_none_of'],
    valueOptions: [
      { label: 'Any ready state',          value: 'any_ready'                },
      { label: 'Ready for deal',           value: 'ready_for_deal'           },
      { label: 'Ready for account + contact', value: 'ready_for_account_contact' },
      { label: 'Ready for contact',        value: 'ready_for_contact'        },
      { label: 'Needs qualification',      value: 'needs_qualification'      },
      { label: 'Needs enrichment',         value: 'needs_enrichment'         },
      { label: 'Not ready',                value: 'not_ready'                },
    ],
  },
  {
    id: 'duplicate_risk',
    label: 'Duplicate Risk',
    category: 'boolean',
    allowedOperators: ['is_true', 'is_false'],
    // is_true = email domain appears > 1 time in dataset
  },
  {
    id: 'sla_first_response',
    label: 'First-Response SLA',
    category: 'enum',
    allowedOperators: ['is', 'is_not'],
    valueOptions: SLA_SEVERITY_OPTIONS,
  },
  {
    id: 'sla_follow_up',
    label: 'Follow-Up SLA',
    category: 'enum',
    allowedOperators: ['is', 'is_not'],
    valueOptions: [...SLA_SEVERITY_OPTIONS, { label: 'N/A (no follow-up set)', value: 'na' }],
  },
  {
    id: 'sla_stale',
    label: 'Stale Lead SLA',
    category: 'enum',
    allowedOperators: ['is', 'is_not'],
    valueOptions: SLA_SEVERITY_OPTIONS,
  },
  {
    id: 'sla_escalation',
    label: 'Escalation Required',
    category: 'boolean',
    allowedOperators: ['is_true', 'is_false'],
  },
];

// ── Field categories (for grouped selector) ───────────────────────────────────

export const FILTER_FIELD_CATEGORIES: Record<string, FilterFieldId[]> = {
  Pipeline:     ['status', 'source', 'score'],
  Timing:       ['lead_age', 'last_contact_age', 'next_action_due'],
  Details:      ['company', 'position', 'country', 'city'],
  Intelligence: ['enrichment_status', 'conversion_readiness', 'duplicate_risk'],
  SLA:          ['sla_first_response', 'sla_follow_up', 'sla_stale', 'sla_escalation'],
};

// ── Operator labels ───────────────────────────────────────────────────────────

export const OPERATOR_CHIP_LABELS: Record<FilterOperator, string> = {
  is:                    'is',
  is_not:                'is not',
  is_any_of:             'is any of',
  is_none_of:            'is none of',
  equals:                '=',
  not_equals:            '≠',
  greater_than:          '>',
  greater_than_or_equal: '≥',
  less_than:             '<',
  less_than_or_equal:    '≤',
  between:               'between',
  is_empty:              'is empty',
  within_last_n_days:    'within last',
  before_n_days_ago:     'more than',
  after_date:            'after',
  before_date:           'before',
  is_overdue:            'is overdue',
  date_is_empty:         'has no date',
  contains:              'contains',
  not_contains:          "doesn't contain",
  starts_with:           'starts with',
  text_is_empty:         'is empty',
  is_true:               'is yes',
  is_false:              'is no',
};

export const OPERATOR_FULL_LABELS: Record<FilterOperator, string> = {
  is:                    'is',
  is_not:                'is not',
  is_any_of:             'is any of',
  is_none_of:            'is none of',
  equals:                'equals',
  not_equals:            'does not equal',
  greater_than:          'is greater than',
  greater_than_or_equal: 'is greater than or equal to',
  less_than:             'is less than',
  less_than_or_equal:    'is less than or equal to',
  between:               'is between',
  is_empty:              'is empty',
  within_last_n_days:    'within the last N days',
  before_n_days_ago:     'more than N days ago',
  after_date:            'after',
  before_date:           'before',
  is_overdue:            'is overdue',
  date_is_empty:         'has no date set',
  contains:              'contains',
  not_contains:          'does not contain',
  starts_with:           'starts with',
  text_is_empty:         'is empty',
  is_true:               'is yes',
  is_false:              'is no',
};
