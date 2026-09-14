/**
 * Sales targets API client (migration 044).
 *
 *   GET  /targets?period=Q3+2026      roster + each person's profile and quota,
 *                                      with the rules the UI needs, SERVED
 *   PUT  /quotas                       per-period quota, currency, activity targets
 *   PUT  /targets/:userId/profile      seniority, ramp start, territory, product line
 *
 * Nothing here decides who may edit whom, which seniority levels exist, or
 * which activity targets are allowed. The server sends all three with the
 * roster (`can_edit`, `seniority_levels`, `activity_target_keys`) and the UI
 * renders them — the same arrangement as `assignable_roles`, adopted because a
 * client-side copy of the invite rule had already drifted before anyone noticed.
 * The label maps below are LOOKUPS for display, never lists of what exists.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Keeps the HTTP status so a 403's message can be shown as what it is. */
export class TargetsApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'TargetsApiError';
  }
}

async function unwrap(res: Response): Promise<Record<string, unknown>> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new TargetsApiError(json?.message || `Request failed (${res.status})`, res.status);
  return json;
}

export interface SalesProfile {
  seniority: string | null;
  /** YYYY-MM-DD, or null when not recorded. */
  ramp_start_date: string | null;
  territory: string | null;
  product_line: string | null;
}

export interface PeriodQuota {
  quota_amount: number;
  currency: string;
  activity_targets: Record<string, number>;
}

export interface TargetRow {
  user_id: number;
  name: string;
  email: string;
  role: string;
  manager_id: number | null;
  manager_name: string | null;
  /** null when nothing has been recorded — never a profile of placeholders. */
  profile: SalesProfile | null;
  /** null when no quota is set for the period. A quota of 0 is a real value. */
  quota: PeriodQuota | null;
  /** Server-decided: may THIS caller set this person's targets? */
  can_edit: boolean;
}

export interface TargetsRoster {
  rows: TargetRow[];
  periodLabel: string;
  seniorityLevels: string[];
  activityTargetKeys: string[];
  activityTargetMax: number | null;
  repsSetOwnTargets: boolean;
  canChangeSelfService: boolean;
}

export async function fetchTargets(period: string): Promise<TargetsRoster> {
  const res = await fetch(`${API_BASE}/targets?period=${encodeURIComponent(period)}`, { headers: getAuthHeaders() });
  const json = await unwrap(res);
  return {
    rows: (json.data ?? []) as TargetRow[],
    periodLabel: (json.period as { label?: string } | undefined)?.label ?? period,
    // Absent means NONE, never a local default: offering a value the server
    // refuses is the failure this whole arrangement exists to prevent.
    seniorityLevels: (json.seniority_levels ?? []) as string[],
    activityTargetKeys: (json.activity_target_keys ?? []) as string[],
    activityTargetMax: typeof json.activity_target_max === 'number' ? json.activity_target_max : null,
    repsSetOwnTargets: json.reps_set_own_targets === true,
    canChangeSelfService: json.can_change_self_service === true,
  };
}

/**
 * GET /targets/projection — the pipeline-coverage projection, plus the activity
 * targets and whether they can be measured at all.
 *
 * SAME ENDPOINT, SAME PERMISSION PATH as the roster: the server returns only
 * the people this caller may see (themselves, their reporting subtree, or
 * everyone for an admin). The guide panel therefore needs no query of its own,
 * which is the point — a second path to this data is a second place for the
 * read scoping to be forgotten.
 */
export interface ProjectionResponse {
  rows: import('./salesGuidance').ProjectionRow[];
  periodLabel: string;
  generatedAt: string | null;
  activityMeasurement: import('./salesGuidance').ActivityMeasurement;
}

export async function fetchProjection(period: string): Promise<ProjectionResponse> {
  const res = await fetch(
    `${API_BASE}/targets/projection?period=${encodeURIComponent(period)}`,
    { headers: getAuthHeaders() },
  );
  const json = await unwrap(res);
  const am = (json.activity_measurement ?? {}) as Record<string, unknown>;
  return {
    rows: (json.data ?? []) as import('./salesGuidance').ProjectionRow[],
    periodLabel: (json.period as { label?: string } | undefined)?.label ?? period,
    generatedAt: typeof json.generated_at === 'string' ? json.generated_at : null,
    // Absent means NOT measurable. An older server that does not send the field
    // must not be read as permission to compute an attainment it cannot back —
    // the same "absent means none" rule as editable_user_ids.
    activityMeasurement: {
      measurable: am.measurable === true,
      reason: typeof am.reason === 'string'
        ? am.reason
        : 'Activity attainment is not reported by this server.',
      activities_recorded: typeof am.activities_recorded === 'number' ? am.activities_recorded : 0,
    },
  };
}

export interface QuotaWrite {
  user_id: number;
  period_label: string;
  quota_amount: number;
  currency?: string;
  /** A key sent as null CLEARS that target. Omit the field to leave all unchanged. */
  activity_targets?: Record<string, number | null>;
}

export async function saveQuota(body: QuotaWrite): Promise<void> {
  const res = await fetch(`${API_BASE}/quotas`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(body),
  });
  await unwrap(res);
}

/** Partial: only the fields present are written; null clears one. */
export async function saveProfile(
  userId: number,
  fields: Partial<Record<keyof SalesProfile, string | null>>,
): Promise<void> {
  const res = await fetch(`${API_BASE}/targets/${encodeURIComponent(String(userId))}/profile`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(fields),
  });
  await unwrap(res);
}

// ── Periods ──────────────────────────────────────────────────────────────────
// Calendar quarters in UTC, the same bounds the server parses "Q3 2026" into.
// There is no fiscal-year setting to offset them by (GeneralPreferences labels
// that as not stored), so none is assumed.

export function quarterLabelFor(d: Date): string {
  return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;
}

export function shiftQuarter(label: string, by: number): string {
  const m = /^Q([1-4]) (\d{4})$/.exec(label);
  if (!m) return label;
  const index = Number(m[2]) * 4 + (Number(m[1]) - 1) + by;
  return `Q${(index % 4) + 1} ${Math.floor(index / 4)}`;
}

// ── Display labels: lookups, not lists ───────────────────────────────────────
// An unknown key renders as itself rather than disappearing.

const ACTIVITY_LABELS: Record<string, string> = {
  calls_per_week: 'Calls / week',
  meetings_per_week: 'Meetings / week',
  emails_per_week: 'Emails / week',
};
export const activityLabel = (key: string): string => ACTIVITY_LABELS[key] ?? key;

const SENIORITY_LABELS: Record<string, string> = {
  junior: 'Junior', mid: 'Mid-level', senior: 'Senior', lead: 'Lead',
};
export const seniorityLabel = (level: string): string => SENIORITY_LABELS[level] ?? level;
