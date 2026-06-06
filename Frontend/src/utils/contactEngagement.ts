// ─── Contact Engagement Utilities ────────────────────────────────────────────
// Pure functions — no React, no side-effects, fully unit-testable.
// All engagement analysis logic lives here; components stay display-only.

export type DotColor = 'green' | 'amber' | 'grey';
export type EngagementDirection = 'warming' | 'cooling' | 'steady';

export interface DirectionResult {
  direction: EngagementDirection;
  label: string;
  colorClass: string;   // tailwind text color
  bgClass: string;      // tailwind bg for badge
  borderClass: string;  // tailwind border for badge
}

// ─── Dot color ────────────────────────────────────────────────────────────────

/**
 * Maps a single response-time value (hours) to a display color.
 *   null or > 72h → grey (no/slow response)
 *   ≤ 24h         → green (fast)
 *   24–72h         → amber (moderate)
 */
export function dotColor(hours: number | null): DotColor {
  if (hours === null || hours > 72) return 'grey';
  if (hours <= 24) return 'green';
  return 'amber';
}

// ─── Engagement direction ─────────────────────────────────────────────────────

/**
 * Compares avg(last 2 non-null) vs avg(prev 2 non-null) from a newest-first
 * array of response times. ±20% band = Steady.
 *
 * Higher response time = taking longer = Cooling ↓
 * Lower  response time = responding faster = Warming ↑
 *
 * Requires at least 4 non-null values; returns Steady if insufficient data.
 */
export function computeEngagementDirection(dots: (number | null)[]): DirectionResult {
  const values = dots.filter((d): d is number => d !== null);

  if (values.length < 4) {
    return {
      direction: 'steady', label: 'Steady →',
      colorClass: 'text-gray-500', bgClass: 'bg-gray-50', borderClass: 'border-gray-200',
    };
  }

  const avgLast2 = (values[0] + values[1]) / 2;
  const avgPrev2 = (values[2] + values[3]) / 2;

  if (avgPrev2 === 0) {
    return {
      direction: 'steady', label: 'Steady →',
      colorClass: 'text-gray-500', bgClass: 'bg-gray-50', borderClass: 'border-gray-200',
    };
  }

  const ratio = avgLast2 / avgPrev2;

  if (ratio > 1.2) return {
    direction: 'cooling', label: 'Cooling ↓',
    colorClass: 'text-amber-700', bgClass: 'bg-amber-50', borderClass: 'border-amber-200',
  };
  if (ratio < 0.8) return {
    direction: 'warming', label: 'Warming ↑',
    colorClass: 'text-green-700', bgClass: 'bg-green-50', borderClass: 'border-green-200',
  };
  return {
    direction: 'steady', label: 'Steady →',
    colorClass: 'text-gray-500', bgClass: 'bg-gray-50', borderClass: 'border-gray-200',
  };
}

// ─── Silence alert ────────────────────────────────────────────────────────────

/**
 * Returns true when a previously-responsive contact has gone quiet.
 * Fires when:
 *   - daysAgo ≥ 5 (silent for 5+ days)
 *   - avg of non-null dot values < 48h (was responding quickly before)
 */
export function isSilenceAlert(
  daysAgo: number | undefined,
  dots: (number | null)[] | undefined,
): boolean {
  if (!daysAgo || daysAgo < 5) return false;
  if (!dots || dots.length === 0) return false;
  const nonNull = dots.filter((d): d is number => d !== null);
  if (nonNull.length === 0) return false;
  const avg = nonNull.reduce((a, b) => a + b, 0) / nonNull.length;
  return avg < 48;
}

// ─── Weekly heatmap bucketing ─────────────────────────────────────────────────

/**
 * Buckets an array of ISO date strings into 8 weekly slots.
 * Index 0 = current week (most recent), index 7 = 8 weeks ago (oldest).
 * Dates outside the window are silently ignored.
 *
 * @param isoDates  Array of ISO-8601 date strings (undefined/null entries skipped)
 * @param todayOverride  Optional Date for testing — defaults to new Date()
 */
export function computeWeeklyBuckets(
  isoDates: (string | undefined | null)[],
  todayOverride?: Date,
): number[] {
  const buckets = new Array(8).fill(0);
  const now = todayOverride ?? new Date();

  for (const isoDate of isoDates) {
    if (!isoDate) continue;
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) continue;
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(daysDiff / 7);
    if (weekIndex >= 0 && weekIndex < 8) {
      buckets[weekIndex]++;
    }
  }

  return buckets;
}
