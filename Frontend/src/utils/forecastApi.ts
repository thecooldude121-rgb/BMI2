/**
 * Forecast — server totals (Group A item 4, slice 5c, 2026-10-13).
 *
 *   GET  /forecast/summary?period=&today=   the quarter by category and by rep
 *   POST /forecast/snapshots { period_label, today }   the SERVER computes and
 *        stores the snapshot; figures in the body are refused.
 *
 * Money is trusted USD only; deals with no USD amount are counted in
 * `unconverted`, never added. `today` is the viewer's local day
 * (utils/dates.localDay): undated deals count only when it is in the quarter.
 */

import { API_BASE } from '../config/backend';

const headers = (): HeadersInit => {
  const token = localStorage.getItem('authToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

export type ForecastCategoryKey = 'pipeline' | 'best-case' | 'commit' | 'closed';
export interface UsdTotal { count: number; value_usd: number; unconverted: number }

export interface RepForecast {
  key: string; label: string; user_id: number | null; unresolved: boolean;
  pipeline: UsdTotal; best_case: UsdTotal; commit: UsdTotal; closed: UsdTotal;
  deal_count: number; unconverted: number; commit_overdue: number;
}

export interface ForecastTopDeal {
  id: string; name: string | null; company_name: string | null; stage: string | null; owner: string;
  value: string | number; currency: string | null; base_amount_usd: string | number | null;
  expected_close_date: string | null; category: ForecastCategoryKey;
}

export interface ForecastSummary {
  period: string; quarter_start: string; quarter_end: string; as_of: string; include_undated: boolean;
  categories: Record<ForecastCategoryKey, UsdTotal>;
  reps: RepForecast[];
  top_deals: Record<ForecastCategoryKey, ForecastTopDeal[]>;
  top_per_category: number;
}

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Request failed (HTTP ${res.status})`);
  return json.data as T;
}

export async function fetchForecastSummary(period: string, today: string): Promise<ForecastSummary> {
  const qs = new URLSearchParams({ period, today });
  return unwrap<ForecastSummary>(await fetch(`${API_BASE}/forecast/summary?${qs}`, { headers: headers() }));
}

export async function takeForecastSnapshot(period: string, today: string): Promise<unknown[]> {
  return unwrap<unknown[]>(await fetch(`${API_BASE}/forecast/snapshots`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ period_label: period, today }),
  }));
}
