// Bulk actions types for Prospects module

export type BulkActionType =
  | 'change_status'
  | 'add_tags'
  | 'remove_tags'
  | 'assign_to'
  | 'add_to_sequence'
  | 'add_to_list'
  | 'export'
  | 'delete'
  | 'adjust_score'
  | 'send_email'
  | 'add_note'
  | 'merge_duplicates'
  | 'enrich_data';

export type BulkActionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface BulkActionConfig {
  type: BulkActionType;
  targetIds: string[];
  params?: Record<string, any>;
}

export interface BulkActionProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

export interface BulkActionResult {
  id: string;
  type: BulkActionType;
  status: BulkActionStatus;
  progress: BulkActionProgress;
  startedAt: string;
  completedAt?: string;
  canUndo: boolean;
  undoData?: any;
}

export interface BulkActionHistoryItem {
  id: string;
  type: BulkActionType;
  targetCount: number;
  params: Record<string, any>;
  result: BulkActionResult;
  performedBy: string;
  performedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface EmailSequence {
  id: string;
  name: string;
  stepCount: number;
  active: boolean;
}

export interface ProspectList {
  id: string;
  name: string;
  prospectCount: number;
  isShared: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface BulkActionOptions {
  // Change Status
  newStatus?: string;

  // Tags
  tagsToAdd?: string[];
  tagsToRemove?: string[];

  // Assignment
  assignToUserId?: string;

  // Sequence
  sequenceId?: string;
  startStep?: number;

  // List
  listId?: string;

  // Export
  exportFormat?: 'csv' | 'excel';
  exportFields?: string[];

  // Score Adjustment
  scoreAdjustment?: {
    leadScore?: number;
    aiScore?: number;
    qualityScore?: number;
  };

  // Email
  emailTemplateId?: string;
  emailSubject?: string;
  emailBody?: string;

  // Note
  noteText?: string;

  // Enrichment
  enrichmentProvider?: string;
}

export const BULK_ACTION_LABELS: Record<BulkActionType, string> = {
  change_status: 'Change Status',
  add_tags: 'Add Tags',
  remove_tags: 'Remove Tags',
  assign_to: 'Assign To',
  add_to_sequence: 'Add to Sequence',
  add_to_list: 'Add to List',
  export: 'Export',
  delete: 'Delete',
  adjust_score: 'Adjust Score',
  send_email: 'Send Email',
  add_note: 'Add Note',
  merge_duplicates: 'Merge Duplicates',
  enrich_data: 'Enrich Data'
};

export const BULK_ACTION_ICONS: Record<BulkActionType, string> = {
  change_status: 'RefreshCw',
  add_tags: 'Tag',
  remove_tags: 'TagOff',
  assign_to: 'UserPlus',
  add_to_sequence: 'Zap',
  add_to_list: 'ListPlus',
  export: 'Download',
  delete: 'Trash2',
  adjust_score: 'TrendingUp',
  send_email: 'Mail',
  add_note: 'FileText',
  merge_duplicates: 'GitMerge',
  enrich_data: 'Database'
};

export const DESTRUCTIVE_ACTIONS: BulkActionType[] = ['delete', 'merge_duplicates'];
