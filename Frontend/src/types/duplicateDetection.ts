// Duplicate Detection and Merge System Types

export type DuplicateConfidence = 'exact' | 'high' | 'medium' | 'low';
export type MergeStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
export type DuplicateAction = 'view' | 'merge' | 'save_new' | 'dismiss' | 'cancel';

export interface DuplicateMatch {
  id: string;
  prospectId: string;
  duplicateProspectId: string;
  confidence: number;
  confidenceLevel: DuplicateConfidence;
  matchingFields: MatchingField[];
  matchingRules: MatchingRule[];
  detectedAt: string;
  detectedBy: 'automatic' | 'manual' | 'import';
  status: 'active' | 'dismissed' | 'merged';
  dismissedBy?: string;
  dismissedAt?: string;
  dismissReason?: string;
}

export interface MatchingField {
  field: string;
  value1: any;
  value2: any;
  similarity: number;
  matchType: 'exact' | 'fuzzy' | 'partial';
}

export interface MatchingRule {
  name: string;
  field: string;
  confidence: number;
  description: string;
  enabled: boolean;
}

export interface DuplicateGroup {
  id: string;
  prospects: ProspectSummary[];
  confidence: number;
  confidenceLevel: DuplicateConfidence;
  matchingFields: string[];
  detectedAt: string;
  matchCount: number;
}

export interface ProspectSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName: string;
  jobTitle?: string;
  linkedinUrl?: string;
  createdAt: string;
  lastActivityAt?: string;
  activityCount: number;
  dataQualityScore: number;
}

export interface MergeRequest {
  id: string;
  masterProspectId: string;
  duplicateProspectIds: string[];
  fieldSelections: FieldSelection[];
  mergeOptions: MergeOptions;
  requestedBy: string;
  requestedAt: string;
  status: MergeStatus;
  completedAt?: string;
  error?: string;
}

export interface FieldSelection {
  field: string;
  selectedProspectId: string;
  selectedValue: any;
  alternatives: FieldAlternative[];
  hasConflict: boolean;
  autoSelected: boolean;
}

export interface FieldAlternative {
  prospectId: string;
  value: any;
  dataQualityScore: number;
  source: string;
  lastUpdated: string;
  isVerified: boolean;
}

export interface MergeOptions {
  preserveActivities: boolean;
  combineTags: boolean;
  mergeNotes: boolean;
  updateReferences: boolean;
  archiveDuplicates: boolean;
  deleteDuplicates: boolean;
  notifyOwners: boolean;
  generateReport: boolean;
}

export interface MergePreview {
  masterProspect: ProspectSummary;
  mergedData: Record<string, any>;
  conflicts: MergeConflict[];
  warnings: string[];
  activityCount: number;
  tagsCount: number;
  notesCount: number;
  referencesCount: number;
}

export interface MergeConflict {
  field: string;
  label: string;
  values: ConflictValue[];
  suggestion?: string;
  reason?: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ConflictValue {
  prospectId: string;
  prospectName: string;
  value: any;
  displayValue: string;
  dataQualityScore: number;
  isVerified: boolean;
  lastUpdated: string;
  source: string;
}

export interface MergeResult {
  success: boolean;
  mergedProspectId: string;
  mergedFields: number;
  archivedProspectIds: string[];
  activityMergeCount: number;
  tagsMergeCount: number;
  notesMergeCount: number;
  updatedReferences: number;
  timestamp: string;
  auditLogId: string;
  canUndo: boolean;
  undoExpiresAt?: string;
}

export interface MergeAuditLog {
  id: string;
  mergeRequestId: string;
  masterProspectId: string;
  duplicateProspectIds: string[];
  performedBy: string;
  performedAt: string;
  fieldChanges: FieldChange[];
  beforeSnapshot: Record<string, any>;
  afterSnapshot: Record<string, any>;
  status: MergeStatus;
  canRollback: boolean;
  rollbackExpiresAt?: string;
  rolledBackAt?: string;
  rolledBackBy?: string;
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  source: 'master' | 'duplicate' | 'manual';
  prospectId: string;
}

export interface DuplicateDetectionConfig {
  autoDetectOnCreate: boolean;
  showWarningModal: boolean;
  enabledRules: MatchingRule[];
  minimumConfidence: number;
  fuzzyMatchThreshold: number;
  scanFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  notifyOnDuplicates: boolean;
  autoMergeThreshold?: number;
}

export interface DuplicateScanResult {
  totalProspects: number;
  duplicatesFound: number;
  duplicateGroups: DuplicateGroup[];
  scanStartedAt: string;
  scanCompletedAt: string;
  scanDuration: number;
}

export interface RollbackRequest {
  mergeAuditLogId: string;
  reason: string;
  requestedBy: string;
  requestedAt: string;
}

export interface RollbackResult {
  success: boolean;
  restoredProspectIds: string[];
  error?: string;
  timestamp: string;
}

export const MATCHING_RULES: MatchingRule[] = [
  {
    name: 'Exact Email Match',
    field: 'email',
    confidence: 100,
    description: 'Email addresses are identical',
    enabled: true
  },
  {
    name: 'LinkedIn Profile Match',
    field: 'linkedinUrl',
    confidence: 100,
    description: 'LinkedIn profiles are identical',
    enabled: true
  },
  {
    name: 'Phone Number Match',
    field: 'phone',
    confidence: 95,
    description: 'Phone numbers are identical',
    enabled: true
  },
  {
    name: 'Name + Company Match',
    field: 'name_company',
    confidence: 90,
    description: 'Similar name and same company',
    enabled: true
  },
  {
    name: 'Name + Email Domain Match',
    field: 'name_domain',
    confidence: 85,
    description: 'Similar name and same email domain',
    enabled: true
  },
  {
    name: 'Name + Phone Match',
    field: 'name_phone',
    confidence: 80,
    description: 'Similar name and same phone number',
    enabled: true
  }
];

export const DEFAULT_MERGE_OPTIONS: MergeOptions = {
  preserveActivities: true,
  combineTags: true,
  mergeNotes: true,
  updateReferences: true,
  archiveDuplicates: true,
  deleteDuplicates: false,
  notifyOwners: true,
  generateReport: true
};

export const CONFIDENCE_THRESHOLDS = {
  exact: 95,
  high: 85,
  medium: 70,
  low: 50
};

export const MERGEABLE_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'companyName',
  'jobTitle',
  'linkedinUrl',
  'location',
  'industry',
  'companySize',
  'website',
  'notes',
  'status'
];

export const REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'companyName'
];

export const FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email Address',
  phone: 'Phone Number',
  companyName: 'Company Name',
  jobTitle: 'Job Title',
  linkedinUrl: 'LinkedIn Profile',
  location: 'Location',
  industry: 'Industry',
  companySize: 'Company Size',
  website: 'Website',
  notes: 'Notes',
  status: 'Status'
};

export const MERGE_UNDO_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
