// ─── Forecast Category Configuration ─────────────────────────────────────────
// Forecast category is a managerial classification — separate from deal stage.
// Stage = where the deal is in the process (factual).
// Forecast Category = manager's confidence it closes this period (judgement).
//
// To add a category: append one entry. id is stable for analytics/reports.

export interface ForecastCategory {
  id: string;
  label: string;
  description: string;
  chipColor: 'green' | 'blue' | 'gray' | 'amber' | 'red';
}

export const FORECAST_CATEGORIES: ForecastCategory[] = [
  {
    id: 'commit',
    label: 'Commit',
    description: 'Rep and manager are confident this closes this period',
    chipColor: 'green',
  },
  {
    id: 'best-case',
    label: 'Best Case',
    description: 'Likely if everything goes right — in optimistic forecast',
    chipColor: 'blue',
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    description: 'In process, not expected to close this period',
    chipColor: 'gray',
  },
  {
    id: 'upside',
    label: 'Upside',
    description: 'Possible upside but not counted in base forecast',
    chipColor: 'amber',
  },
  {
    id: 'omit',
    label: 'Omit',
    description: 'Excluded from forecast — lost, on hold, or not applicable',
    chipColor: 'red',
  },
];

export const getForecastCategory = (id: string): ForecastCategory | undefined =>
  FORECAST_CATEGORIES.find(c => c.id === id);

// ─── Stage-to-Forecast suggestion map ────────────────────────────────────────
// Loose mapping from pipeline stage id → suggested forecast category.
// This is a suggestion only — users can always override.
// Covers all three pipelines (New Business, Renewals, Partnerships).
// To add org-specific overrides, extend this map.

const STAGE_SUGGESTION_MAP: Record<string, string> = {
  // New Business
  'prospecting':  'pipeline',
  'qualified':    'pipeline',
  'proposal':     'best-case',
  'negotiation':  'commit',
  'closed-won':   'commit',
  'closed-lost':  'omit',

  // Renewals
  'renewal-review':       'pipeline',
  'renewal-quoted':       'best-case',
  'renewal-negotiation':  'commit',
  'renewal-won':          'commit',
  'renewal-lost':         'omit',

  // Partnerships
  'partner-intro':       'pipeline',
  'partner-evaluation':  'pipeline',
  'partner-agreement':   'best-case',
  'partner-onboarding':  'best-case',
  'partner-active':      'commit',
  'partner-inactive':    'omit',
};

/**
 * Returns the suggested forecast category id for a given stage id.
 * Returns 'pipeline' as the safe fallback for any unknown stage.
 */
export const getSuggestedForecastCategory = (stageId: string): string =>
  STAGE_SUGGESTION_MAP[stageId] ?? 'pipeline';

/** Tailwind classes for a forecast category chip by color key. */
export const forecastChipClasses = (color: ForecastCategory['chipColor']): string => {
  const map: Record<ForecastCategory['chipColor'], string> = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue:  'bg-blue-50 text-blue-700 border-blue-100',
    gray:  'bg-gray-50 text-gray-600 border-gray-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red:   'bg-red-50 text-red-600 border-red-100',
  };
  return map[color];
};
