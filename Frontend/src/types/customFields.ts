// Custom Fields System Types

export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'dropdown'
  | 'multi_select'
  | 'checkbox'
  | 'textarea'
  | 'rich_text'
  | 'currency'
  | 'percentage';

export type FieldStatus = 'active' | 'archived' | 'draft';
export type ValidationRuleType = 'required' | 'min' | 'max' | 'pattern' | 'custom';

export interface CustomField {
  id: string;
  name: string;
  key: string;
  type: FieldType;
  description?: string;
  helpText?: string;
  defaultValue?: any;
  placeholder?: string;
  required: boolean;
  searchable: boolean;
  showInTable: boolean;
  showInForm: boolean;
  section: string;
  order: number;
  status: FieldStatus;
  validationRules: ValidationRule[];
  properties: FieldProperties;
  conditionalLogic?: ConditionalLogic;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface FieldProperties {
  // Text properties
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  multiline?: boolean;

  // Number properties
  min?: number;
  max?: number;
  step?: number;
  decimalPlaces?: number;
  unit?: string;

  // Dropdown/Multi-select properties
  options?: FieldOption[];
  allowCustom?: boolean;
  maxSelections?: number;

  // Date properties
  dateFormat?: string;
  minDate?: string;
  maxDate?: string;
  defaultToToday?: boolean;

  // Currency properties
  currency?: string;
  showSymbol?: boolean;

  // URL properties
  openInNewTab?: boolean;
  validateUrl?: boolean;

  // Email properties
  validateEmail?: boolean;
  checkDeliverability?: boolean;

  // Phone properties
  internationalFormat?: boolean;
  autoFormat?: boolean;
  countryCode?: string;

  // Rich text properties
  allowImages?: boolean;
  allowLinks?: boolean;
  maxHeight?: number;
}

export interface FieldOption {
  id: string;
  label: string;
  value: string;
  color?: string;
  icon?: string;
  order: number;
  archived?: boolean;
}

export interface ValidationRule {
  id: string;
  type: ValidationRuleType;
  value?: any;
  message: string;
  enabled: boolean;
}

export interface ConditionalLogic {
  enabled: boolean;
  conditions: Condition[];
  action: 'show' | 'hide' | 'require' | 'disable';
  operator: 'and' | 'or';
}

export interface Condition {
  fieldKey: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
}

export interface FieldSection {
  id: string;
  name: string;
  key: string;
  description?: string;
  icon?: string;
  order: number;
  collapsible: boolean;
  defaultCollapsed: boolean;
  fields: string[];
}

export interface FieldTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: Partial<CustomField>[];
  sections?: Partial<FieldSection>[];
  icon?: string;
  isDefault?: boolean;
}

export interface FieldValue {
  fieldKey: string;
  value: any;
  updatedAt: string;
  updatedBy: string;
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: FieldError[];
}

export interface FieldError {
  fieldKey: string;
  fieldName: string;
  message: string;
  type: ValidationRuleType;
}

export interface FieldDependency {
  sourceFieldKey: string;
  targetFieldKey: string;
  mapping: DependencyMapping[];
}

export interface DependencyMapping {
  sourceValue: any;
  targetValue: any;
  action?: 'set_value' | 'set_options' | 'show' | 'hide';
}

export interface FieldMigration {
  id: string;
  fromFieldKey: string;
  toFieldKey: string;
  transformFunction?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  recordsUpdated: number;
  errors: string[];
  createdAt: string;
  completedAt?: string;
}

export const FIELD_TYPE_CONFIG: Record<FieldType, FieldTypeConfig> = {
  text: {
    label: 'Text',
    icon: 'Type',
    description: 'Single line text input',
    defaultProperties: {
      maxLength: 255
    },
    supportedValidations: ['required', 'min', 'max', 'pattern']
  },
  number: {
    label: 'Number',
    icon: 'Hash',
    description: 'Numeric input with validation',
    defaultProperties: {
      decimalPlaces: 0,
      step: 1
    },
    supportedValidations: ['required', 'min', 'max']
  },
  email: {
    label: 'Email',
    icon: 'Mail',
    description: 'Email address with validation',
    defaultProperties: {
      validateEmail: true
    },
    supportedValidations: ['required', 'pattern']
  },
  phone: {
    label: 'Phone',
    icon: 'Phone',
    description: 'Phone number with formatting',
    defaultProperties: {
      internationalFormat: true,
      autoFormat: true
    },
    supportedValidations: ['required', 'pattern']
  },
  url: {
    label: 'URL',
    icon: 'Link',
    description: 'Website URL with validation',
    defaultProperties: {
      validateUrl: true,
      openInNewTab: true
    },
    supportedValidations: ['required', 'pattern']
  },
  date: {
    label: 'Date',
    icon: 'Calendar',
    description: 'Date picker',
    defaultProperties: {
      dateFormat: 'MM/DD/YYYY'
    },
    supportedValidations: ['required']
  },
  dropdown: {
    label: 'Dropdown',
    icon: 'ChevronDown',
    description: 'Single selection from list',
    defaultProperties: {
      options: [],
      allowCustom: false
    },
    supportedValidations: ['required']
  },
  multi_select: {
    label: 'Multi-select',
    icon: 'ListChecks',
    description: 'Multiple selections from list',
    defaultProperties: {
      options: [],
      maxSelections: 10
    },
    supportedValidations: ['required']
  },
  checkbox: {
    label: 'Checkbox',
    icon: 'CheckSquare',
    description: 'Boolean yes/no value',
    defaultProperties: {},
    supportedValidations: []
  },
  textarea: {
    label: 'Text Area',
    icon: 'AlignLeft',
    description: 'Multi-line text input',
    defaultProperties: {
      maxLength: 5000
    },
    supportedValidations: ['required', 'min', 'max']
  },
  rich_text: {
    label: 'Rich Text',
    icon: 'FileText',
    description: 'Formatted text editor',
    defaultProperties: {
      allowImages: true,
      allowLinks: true
    },
    supportedValidations: ['required']
  },
  currency: {
    label: 'Currency',
    icon: 'DollarSign',
    description: 'Monetary value with currency',
    defaultProperties: {
      currency: 'USD',
      showSymbol: true,
      decimalPlaces: 2
    },
    supportedValidations: ['required', 'min', 'max']
  },
  percentage: {
    label: 'Percentage',
    icon: 'Percent',
    description: 'Percentage value (0-100)',
    defaultProperties: {
      min: 0,
      max: 100,
      decimalPlaces: 0
    },
    supportedValidations: ['required', 'min', 'max']
  }
};

export interface FieldTypeConfig {
  label: string;
  icon: string;
  description: string;
  defaultProperties: Partial<FieldProperties>;
  supportedValidations: ValidationRuleType[];
}

export const DEFAULT_SECTIONS: FieldSection[] = [
  {
    id: 'contact_info',
    name: 'Contact Information',
    key: 'contact_info',
    description: 'Basic contact details',
    icon: 'User',
    order: 1,
    collapsible: true,
    defaultCollapsed: false,
    fields: ['firstName', 'lastName', 'email', 'phone']
  },
  {
    id: 'company_details',
    name: 'Company Details',
    key: 'company_details',
    description: 'Company and job information',
    icon: 'Building',
    order: 2,
    collapsible: true,
    defaultCollapsed: false,
    fields: ['companyName', 'jobTitle', 'industry', 'companySize']
  },
  {
    id: 'qualification',
    name: 'Qualification',
    key: 'qualification',
    description: 'Lead qualification data',
    icon: 'Target',
    order: 3,
    collapsible: true,
    defaultCollapsed: false,
    fields: ['leadScore', 'status', 'source']
  },
  {
    id: 'custom',
    name: 'Custom Fields',
    key: 'custom',
    description: 'Additional custom information',
    icon: 'Plus',
    order: 4,
    collapsible: true,
    defaultCollapsed: true,
    fields: []
  }
];

export const FIELD_TEMPLATES: FieldTemplate[] = [
  {
    id: 'sales_qualified',
    name: 'Sales Qualified Lead',
    description: 'Standard fields for sales-qualified leads',
    category: 'Sales',
    icon: 'TrendingUp',
    isDefault: true,
    fields: [
      {
        name: 'Budget',
        key: 'budget',
        type: 'currency',
        required: true,
        section: 'qualification',
        properties: { currency: 'USD' }
      },
      {
        name: 'Timeline',
        key: 'timeline',
        type: 'dropdown',
        required: true,
        section: 'qualification',
        properties: {
          options: [
            { id: '1', label: 'Immediate (< 1 month)', value: 'immediate', order: 1 },
            { id: '2', label: 'Short-term (1-3 months)', value: 'short_term', order: 2 },
            { id: '3', label: 'Long-term (3+ months)', value: 'long_term', order: 3 }
          ]
        }
      },
      {
        name: 'Authority',
        key: 'authority',
        type: 'dropdown',
        required: true,
        section: 'qualification',
        properties: {
          options: [
            { id: '1', label: 'Decision Maker', value: 'decision_maker', order: 1 },
            { id: '2', label: 'Influencer', value: 'influencer', order: 2 },
            { id: '3', label: 'End User', value: 'end_user', order: 3 }
          ]
        }
      }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Lead',
    description: 'Fields for enterprise-level opportunities',
    category: 'Enterprise',
    icon: 'Building2',
    fields: [
      {
        name: 'Company Revenue',
        key: 'company_revenue',
        type: 'currency',
        section: 'company_details',
        properties: { currency: 'USD' }
      },
      {
        name: 'Employee Count',
        key: 'employee_count',
        type: 'number',
        section: 'company_details',
        properties: { min: 1 }
      },
      {
        name: 'Key Stakeholders',
        key: 'key_stakeholders',
        type: 'textarea',
        section: 'qualification'
      }
    ]
  }
];

export const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
];

export const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: '12/31/2024' },
  { value: 'DD/MM/YYYY', label: '31/12/2024' },
  { value: 'YYYY-MM-DD', label: '2024-12-31' },
  { value: 'MMM DD, YYYY', label: 'Dec 31, 2024' },
  { value: 'DD MMM YYYY', label: '31 Dec 2024' }
];
