// dealsColumns.ts — column definitions shared between DealsListView and DealsKanbanPage.
// Extracted so both files can import ColumnKey and the default order without circular deps.

export type ColumnKey =
  | 'dealName' | 'account' | 'owner' | 'contact'
  | 'value' | 'stage' | 'closeDate' | 'lastActivity'
  | 'nextStep' | 'dealAge' | 'probability' | 'source'
  | 'health' | 'actions';

export const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'dealName',     label: 'Deal Name'       },
  { key: 'account',      label: 'Account'         },
  { key: 'owner',        label: 'Owner'           },
  { key: 'contact',      label: 'Primary Contact' },
  { key: 'value',        label: 'Value'           },
  { key: 'stage',        label: 'Stage'           },
  { key: 'closeDate',    label: 'Close Date'      },
  { key: 'lastActivity', label: 'Last Activity'   },
  { key: 'nextStep',     label: 'Next Step'       },
  { key: 'dealAge',      label: 'Deal Age'        },
  { key: 'probability',  label: 'Probability'     },
  { key: 'source',       label: 'Source'          },
  { key: 'health',       label: 'Health'          },
  { key: 'actions',      label: 'Actions'         },
];

// Used as both the default column order and the default visible-column set.
export const DEFAULT_COLUMN_ORDER: ColumnKey[] = [
  'dealName', 'account', 'owner', 'contact',
  'value', 'stage', 'closeDate', 'lastActivity',
  'nextStep', 'dealAge', 'probability', 'source',
  'health', 'actions',
];

// ── Filter state types (shared between DealsListView and DealsKanbanPage) ─────

export type CloseDateFilter = {
  preset: 'all' | 'thisWeek' | 'thisMonth' | 'thisQuarter' | 'overdue' | 'custom';
  from?: string;
  to?: string;
};

export type ValueFilter = { min: number | null; max: number | null };

export type PipelineAgeFilter = { min: number | null; max: number | null };

/** Uses ScoreTier values from dealHealthDrivers ('strong' | 'fair' | 'weak'). */
export type HealthTierFilter = 'strong' | 'fair' | 'weak';
