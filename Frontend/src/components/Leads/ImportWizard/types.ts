import type { LeadStatus } from '../../../types/lead';

export type { LeadStatus };

export type ImportStep = 1 | 2 | 3 | 4 | 5 | 6;

export type CRMField =
  | 'first_name' | 'last_name' | 'full_name'
  | 'email' | 'phone'
  | 'company' | 'position' | 'industry' | 'department' | 'company_size'
  | 'website' | 'linkedin_url'
  | 'city' | 'country'
  | 'source' | 'source_detail'
  | 'utm_source' | 'utm_medium' | 'utm_campaign'
  | 'tags' | 'notes'
  | 'skip';

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ColumnMapping {
  csvHeader: string;
  crmField: CRMField;
  autoDetected: boolean;
}

export type ValidationTier = 'ok' | 'warning' | 'error';

export interface RowIssue {
  field: string;
  message: string;
  tier: 'error' | 'warning';
}

export interface RowValidation {
  tier: ValidationTier;
  issues: RowIssue[];
}

export interface ParsedRow {
  index: number;
  raw: Record<string, string>;
  mapped: Partial<Record<CRMField, string>>;
  validation: RowValidation;
  isDuplicate: boolean;
  duplicateMatch?: { id: string; name: string; email?: string };
}

export type DuplicateAction = 'skip' | 'merge_review' | 'create_new';

export interface ImportRules {
  defaultStatus: LeadStatus;
  defaultOwnerId: string;
  sourceOverride: string;
  tags: string[];
  triggerEnrichment: boolean;
  duplicateAction: DuplicateAction;
}

export interface ImportProgress {
  processed: number;
  total: number;
}

export interface ImportResult {
  imported: number;
  failed: number;
  duplicatesSkipped: number;
  duplicatesMergeQueued: number;
  duplicatesCreated: number;
  warnings: number;
  errorRowsSkipped: number;
  enrichmentQueued: number;
}

export const DEFAULT_RULES: ImportRules = {
  defaultStatus: 'new',
  defaultOwnerId: '',
  sourceOverride: '',
  tags: [],
  triggerEnrichment: false,
  duplicateAction: 'skip',
};
