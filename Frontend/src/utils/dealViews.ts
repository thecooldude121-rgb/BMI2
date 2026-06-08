/**
 * dealViews.ts — saved-view definitions for the Deals Pipeline.
 *
 * Architecture:
 *   A "saved view" is a named snapshot that combines two things:
 *     1. filterPreset  — presets for the existing dropdown filter controls
 *                        (owner, closeDate, value, source, sortBy).
 *     2. predicate     — an optional extra filter function for conditions that
 *                        cannot be expressed via the existing dropdowns
 *                        (aiScore, daysSinceContact, health, status, etc.).
 *
 *   The page's filterDeals() applies BOTH layers:
 *     existing dropdowns → always applied
 *     viewPredicate      → applied when a non-"all" view is active
 *
 *   Adding a new saved view:
 *     Append one object to SAVED_VIEWS below. No other file changes needed.
 *     If the view needs a dropdown preset only, omit `predicate`.
 *     If it needs a custom condition only, omit the filterPreset fields.
 *
 *   Combining saved views with manual overrides:
 *     When a user selects a view, the page presets the dropdowns AND sets the
 *     viewPredicate. The user can then further change individual dropdowns
 *     (additive refinement). The view chip stays highlighted. "Reset all"
 *     clears both the preset dropdowns and the predicate.
 */

import type { DealCard } from '../components/Deal/DealKanbanCard';
import { isWithinDays } from './dateUtils';
import type { ColumnKey, CloseDateFilter, ValueFilter, PipelineAgeFilter, HealthTierFilter } from './dealsColumns';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A user-created saved view — persisted to localStorage.
 * Captures the full page state so applyUserView() can restore it exactly.
 */
export type UserSavedView = {
  id: string;
  name: string;
  isPinned: boolean;
  isDefault: boolean;
  createdAt: string;
  // KanbanPage filter state
  selectedOwner: string;
  selectedCloseDateFilter: string;
  selectedValueFilter: string;
  selectedSourceFilter: string;
  sortBy: string;
  viewMode: 'kanban' | 'list' | 'grid' | 'calendar';
  cardDensity: 'standard' | 'compact';
  activeKpiFilter: 'closingWeek' | 'stalled' | null;
  // Column state (lifted from DealsListView)
  visibleColumns: ColumnKey[];
  columnOrder: ColumnKey[];
  // Filter state v2 — multi-select and range shapes.
  // v1 string fields remain for backward compatibility with saved views already in localStorage.
  selectedStagesV2?: string[];
  selectedOwnersV2?: string[];
  selectedSourcesV2?: string[];
  selectedHealthTiersV2?: HealthTierFilter[];
  closeDateFilterV2?: CloseDateFilter;
  valueFilterV2?: ValueFilter;
  pipelineAgeFilterV2?: PipelineAgeFilter;
};

/** Values for the existing dropdown filter controls. */
export interface DropdownFilterPreset {
  owner?: string;
  closeDate?: string;
  value?: string;
  source?: string;
  sortBy?: 'closeDate' | 'value' | 'health' | 'activity' | 'stage';
}

/** One saved view definition. */
export interface SavedView {
  /** Stable identifier used in state. */
  id: string;
  /** Chip label shown in the UI. */
  label: string;
  /** Short description shown as a tooltip. */
  description: string;
  /** Emoji shown on the chip — keeps the bar scannable at a glance. */
  emoji: string;
  /**
   * Dropdown values to preset when this view is applied.
   * Omitted fields are left at their current values.
   */
  filterPreset: DropdownFilterPreset;
  /**
   * Extra predicate for conditions that the dropdown controls cannot express.
   * Receives the deal and the current logged-in user's name (for owner-based
   * views). Return true to KEEP the deal, false to exclude it.
   *
   * Omit this field when the filterPreset alone is sufficient.
   */
  predicate?: (deal: DealCard, userName?: string) => boolean;
}

// ── Thresholds ────────────────────────────────────────────────────────────────
// Centralised so product can tune criteria without hunting through predicates.

const HIGH_VALUE_THRESHOLD         = 100_000;  // amount ≥ this → "high value"
const STALLED_DAYS                 = 5;         // daysSinceContact ≥ this → stalled
const NO_NEXT_STEP_STALE_DAYS      = 3;         // days without contact before "no next step" fires
const HIGH_PROBABILITY_AI_SCORE    = 75;        // aiScore ≥ this → best probability
const MANAGER_REVIEW_MIN_AMOUNT    = 50_000;    // min amount for manager review flag
const MANAGER_REVIEW_STALE_DAYS    = 4;         // days stale before manager review applies

// ── Saved view definitions ────────────────────────────────────────────────────

export const SAVED_VIEWS: SavedView[] = [
  // ── 0. All Deals (the default — clears everything) ──────────────────────
  {
    id:          'all',
    label:       'All Deals',
    description: 'Show every deal in the pipeline',
    emoji:       '📋',
    filterPreset: {
      owner:     'all',
      closeDate: 'all',
      value:     'all',
      source:    'all',
      sortBy:    'closeDate',
    },
    // No predicate — shows everything
  },

  // ── 1. My Deals ──────────────────────────────────────────────────────────
  // Uses the existing 'owner: me' dropdown — no predicate needed.
  {
    id:          'my-deals',
    label:       'My Deals',
    description: 'Deals assigned to you',
    emoji:       '👤',
    filterPreset: { owner: 'me', sortBy: 'closeDate' },
  },

  // ── 2. Closing This Month ────────────────────────────────────────────────
  // Uses the existing 'closeDate: month' dropdown — no predicate needed.
  {
    id:          'closing-month',
    label:       'Closing This Month',
    description: 'Active deals with a close date in the next 30 days',
    emoji:       '📅',
    filterPreset: { closeDate: 'month', sortBy: 'closeDate' },
  },

  // ── 3. No Next Step ──────────────────────────────────────────────────────
  // Requires a predicate — no dropdown covers the `status` field.
  // Criteria: no status/next-step text AND contact is going stale.
  {
    id:          'no-next-step',
    label:       'No Next Step',
    description: `Deals with no next step planned and no contact in ${NO_NEXT_STEP_STALE_DAYS}+ days`,
    emoji:       '⚠️',
    filterPreset: { sortBy: 'closeDate' },
    predicate: (deal) => {
      const hasNextStep = Boolean(deal.nextStep?.trim());
      return !hasNextStep && deal.daysSinceContact >= NO_NEXT_STEP_STALE_DAYS;
    },
  },

  // ── 4. Stalled > 5 Days ──────────────────────────────────────────────────
  // Requires a predicate — no dropdown covers daysSinceContact or health.
  {
    id:          'stalled',
    label:       `Stalled > ${STALLED_DAYS}d`,
    description: `Deals with no contact for ${STALLED_DAYS}+ days or marked as stalled`,
    emoji:       '🔴',
    filterPreset: { sortBy: 'activity' },
    predicate: (deal) =>
      deal.daysSinceContact >= STALLED_DAYS || deal.health === 'stalled',
  },

  // ── 5. High Value Deals ───────────────────────────────────────────────────
  // Could use value: '100k+' dropdown, but using a predicate gives us the
  // exact threshold from the central constant rather than a label string.
  {
    id:          'high-value',
    label:       'High Value',
    description: `Deals worth $${(HIGH_VALUE_THRESHOLD / 1000).toFixed(0)}K or more`,
    emoji:       '💎',
    filterPreset: { sortBy: 'value' },
    predicate: (deal) => deal.amount >= HIGH_VALUE_THRESHOLD,
  },

  // ── 6. HRMS-linked Deals ─────────────────────────────────────────────────
  // Uses source: 'hrms' preset AND a predicate so the isHRMS flag is the
  // authoritative check (source field could be inconsistently populated).
  {
    id:          'hrms',
    label:       'HRMS-linked',
    description: 'Deals connected to an HRMS recruitment event',
    emoji:       '🏢',
    filterPreset: { sortBy: 'health' },
    predicate: (deal) => deal.isHRMS,
  },

  // ── 7. Best Probability ───────────────────────────────────────────────────
  // Requires a predicate — no dropdown covers aiScore.
  {
    id:          'best-probability',
    label:       'Best Probability',
    description: `Deals with AI health score ≥ ${HIGH_PROBABILITY_AI_SCORE} and healthy status`,
    emoji:       '⭐',
    filterPreset: { sortBy: 'health' },
    predicate: (deal) =>
      deal.aiScore >= HIGH_PROBABILITY_AI_SCORE && deal.health === 'healthy',
  },

  // ── 8. Needs Manager Review ───────────────────────────────────────────────
  // High-value deals that are at risk or stalled — the combinations a manager
  // most needs to unblock. Requires a predicate.
  {
    id:          'manager-review',
    label:       'Needs Review',
    description: `At-risk or stalled deals worth $${(MANAGER_REVIEW_MIN_AMOUNT / 1000).toFixed(0)}K+ with ${MANAGER_REVIEW_STALE_DAYS}+ days inactive`,
    emoji:       '🚨',
    filterPreset: { sortBy: 'value' },
    predicate: (deal) =>
      (deal.health === 'at-risk' || deal.health === 'stalled' ||
       deal.daysSinceContact >= MANAGER_REVIEW_STALE_DAYS) &&
      deal.amount >= MANAGER_REVIEW_MIN_AMOUNT,
  },
];

// ── Helper — look up a view by id ─────────────────────────────────────────────

export const findView = (id: string): SavedView =>
  SAVED_VIEWS.find(v => v.id === id) ?? SAVED_VIEWS[0];

// ── Active-filter label builders ──────────────────────────────────────────────
// Used by the active-filter pill strip to describe each non-default filter.

const OWNER_LABELS: Record<string, string>      = { me: 'Owner: Me', team: 'My Team', unassigned: 'Unassigned' };
const CLOSE_DATE_LABELS: Record<string, string> = { week: 'Closes this week', month: 'Closes this month', quarter: 'Closes this quarter' };
const VALUE_LABELS: Record<string, string>      = { '0-25k': '$0–25K', '25-50k': '$25–50K', '50-100k': '$50–100K', '100k+': '$100K+' };
const SOURCE_LABELS: Record<string, string>     = { leadgen: 'Lead Gen', hrms: 'HRMS', website: 'Website', manual: 'Manual' };

export interface ActiveFilterPill {
  key: string;       // used as React key and to clear the specific filter
  label: string;
}

/**
 * Returns one pill descriptor for each non-default filter value.
 * The page renders these as dismissible chips below the filter dropdowns.
 */
export function getActiveFilterPills(
  activeViewId: string,
  owner: string,
  closeDate: string,
  value: string,
  source: string,
  account: string,
  search: string,
): ActiveFilterPill[] {
  const pills: ActiveFilterPill[] = [];

  // Active view (non-"all") counts as a single pill
  if (activeViewId && activeViewId !== 'all') {
    const v = findView(activeViewId);
    pills.push({ key: 'view', label: `${v.emoji} ${v.label}` });
  }

  if (owner     !== 'all' && OWNER_LABELS[owner])          pills.push({ key: 'owner',     label: OWNER_LABELS[owner] });
  if (closeDate !== 'all' && CLOSE_DATE_LABELS[closeDate]) pills.push({ key: 'closeDate', label: CLOSE_DATE_LABELS[closeDate] });
  if (value     !== 'all' && VALUE_LABELS[value])           pills.push({ key: 'value',     label: VALUE_LABELS[value] });
  if (source    !== 'all' && SOURCE_LABELS[source])         pills.push({ key: 'source',    label: SOURCE_LABELS[source] });
  if (account   === 'missing')                              pills.push({ key: 'account',   label: 'Missing account' });
  if (search.trim())                                        pills.push({ key: 'search',    label: `"${search.trim()}"` });

  return pills;
}

/** True when any filter is active (including a non-"all" saved view). */
export function isAnyFilterActive(
  activeViewId: string,
  owner: string,
  closeDate: string,
  value: string,
  source: string,
  search: string,
): boolean {
  return (
    activeViewId !== 'all' ||
    owner !== 'all' ||
    closeDate !== 'all' ||
    value !== 'all' ||
    source !== 'all' ||
    search.trim() !== ''
  );
}
