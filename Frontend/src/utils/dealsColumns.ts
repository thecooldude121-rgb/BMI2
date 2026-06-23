// dealsColumns.ts — column definitions shared between DealsListView and DealsKanbanPage.
// Extracted so both files can import ColumnKey and the default order without circular deps.

export type ColumnKey =
  | 'dealName' | 'account' | 'owner' | 'contact'
  | 'value' | 'stage' | 'closeDate' | 'lastActivity' | 'lastContact'
  | 'nextStep' | 'dealAge' | 'probability' | 'source'
  | 'health' | 'relationship' | 'competitor' | 'actions';

export const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'dealName',     label: 'Deal Name'       },
  { key: 'account',      label: 'Account'         },
  { key: 'owner',        label: 'Owner'           },
  { key: 'contact',      label: 'Primary Contact' },
  { key: 'value',        label: 'Value'           },
  { key: 'stage',        label: 'Stage'           },
  { key: 'closeDate',    label: 'Close Date'      },
  { key: 'lastActivity', label: 'Last Activity'   },
  { key: 'lastContact',  label: 'Last Contact'    },
  { key: 'nextStep',     label: 'Next Step'       },
  { key: 'dealAge',      label: 'Time in Pipeline' },
  { key: 'probability',  label: 'Probability'     },
  { key: 'source',       label: 'Source'          },
  { key: 'health',        label: 'Health'           },
  { key: 'relationship',  label: 'Relationship'     },
  { key: 'competitor',   label: 'Competitor'       },
  { key: 'actions',       label: 'Actions'          },
];

// Full column order — used as the default picker order and as reset order.
// 'relationship' is included so it appears in the column picker,
// but is excluded from DEFAULT_VISIBLE_COLUMNS so it is hidden by default.
export const DEFAULT_COLUMN_ORDER: ColumnKey[] = [
  'dealName', 'account', 'owner', 'contact',
  'value', 'stage', 'closeDate', 'lastActivity', 'lastContact',
  'nextStep', 'dealAge', 'probability', 'source',
  'health', 'relationship', 'competitor', 'actions',
];

// Columns visible on first load and after "Reset to default".
// Relationship is hidden by default — managers opt in via the column picker.
export const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = DEFAULT_COLUMN_ORDER.filter(
  k => k !== 'relationship' && k !== 'competitor' && k !== 'lastActivity'
);

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
