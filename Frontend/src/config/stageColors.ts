/**
 * stageColors.ts — canonical deal stage badge color system.
 *
 * Single source of truth consumed by: DealsListView, DealsGridView,
 * DealsKanbanPage, DealDetailView, and any future stage badge.
 *
 * Design rules:
 *   • Active pipeline stages use a blue/indigo/violet progression.
 *     No active stage uses green or red — those are reserved for
 *     terminal outcomes only.
 *   • Closed-Won = emerald (success).
 *   • Closed-Lost = red (failure).
 *   • Qualified = sky-blue, visually distinct from Closed-Won emerald.
 */

export interface StageColorEntry {
  /** Hex fill for solid badge backgrounds and chart series. */
  bg: string;
  /** Text color rendered on top of `bg`. Always white for AA contrast. */
  text: string;
  /** Tailwind classes for soft/outlined badge variants (e.g. detail views). */
  tailwind: string;
  /** Very-light Tailwind bg for kanban column header pills. */
  columnBg: string;
}

export const STAGE_COLORS: Record<string, StageColorEntry> = {
  prospecting: {
    bg:       '#6366f1', // indigo-500
    text:     '#ffffff',
    tailwind: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    columnBg: 'bg-indigo-50',
  },
  qualified: {
    // Was #4CAF50 Material Green — now sky-blue to prevent visual
    // confusion with Closed-Won's emerald.
    bg:       '#0ea5e9', // sky-500
    text:     '#ffffff',
    tailwind: 'bg-sky-100 text-sky-800 border-sky-300',
    columnBg: 'bg-sky-50',
  },
  proposal: {
    bg:       '#f59e0b', // amber-500
    text:     '#ffffff',
    tailwind: 'bg-amber-100 text-amber-800 border-amber-300',
    columnBg: 'bg-amber-50',
  },
  negotiation: {
    bg:       '#8b5cf6', // violet-500
    text:     '#ffffff',
    tailwind: 'bg-violet-100 text-violet-800 border-violet-300',
    columnBg: 'bg-violet-50',
  },
  'closed-won': {
    // Emerald — success. Reserved for terminal outcomes only.
    bg:       '#10b981', // emerald-500
    text:     '#ffffff',
    tailwind: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    columnBg: 'bg-emerald-50',
  },
  'closed-lost': {
    // Red — failure. Reserved for terminal outcomes only.
    bg:       '#ef4444', // red-500
    text:     '#ffffff',
    tailwind: 'bg-red-100 text-red-800 border-red-300',
    columnBg: 'bg-red-50',
  },
};

const FALLBACK: StageColorEntry = {
  bg:       '#6b7280', // gray-500
  text:     '#ffffff',
  tailwind: 'bg-gray-100 text-gray-800 border-gray-300',
  columnBg: 'bg-gray-50',
};

/** Full entry for a stage ID, with gray fallback for unknown stages. */
export function getStageColors(stageId: string): StageColorEntry {
  return STAGE_COLORS[stageId] ?? FALLBACK;
}

/** `{ bg, text }` for inline-style solid badges. */
export function getStageStyle(stageId: string): { bg: string; text: string } {
  const { bg, text } = getStageColors(stageId);
  return { bg, text };
}

/** Tailwind class string for soft/outlined badge variants. */
export function getStageTailwindClasses(stageId: string): string {
  return getStageColors(stageId).tailwind;
}

/** Hex color for chart/graph series. Same as `bg`. */
export function getStageChartColor(stageId: string): string {
  return getStageColors(stageId).bg;
}
