import { TRUSTED_USD } from './accountRollups';
import { OWNER_KEY, OWNER_LABEL } from './dealOwnerSql';
import { ListQueryError } from './listQuery';

/**
 * The quarter's forecast, computed on the SERVER (Group A item 4, slice 5c).
 *
 * ForecastPage fetched the 500 newest deals, classified and summed them in the
 * browser with no warning past the cap, and POSTed those per-rep sums as
 * permanent forecast snapshots. GET /forecast/summary and POST
 * /forecast/snapshots now share THIS function, so the page and a saved
 * snapshot cannot disagree.
 *
 * CATEGORY — the page's own rules (`inferCategory`), unchanged:
 *   an explicit forecast_category wins (commit / best case / pipeline / closed);
 *   else a WON stage is closed and a LOST stage is dropped (stage_type, every
 *   pipeline); else slug 'negotiation' is commit, 'proposal' best case, and
 *   everything else pipeline.
 * QUARTER — expected_close_date inside the quarter. A deal with no close date
 *   counts only when the viewer's day is inside the quarter, and never as
 *   closed (the page's rule).
 * MONEY — trusted USD only; every other deal counted in `unconverted`.
 * There is no probability weighting here, deliberately.
 */

export const FORECAST_CATEGORY = `CASE
  WHEN lower(btrim(coalesce(d.forecast_category, ''))) = 'commit' THEN 'commit'
  WHEN lower(btrim(coalesce(d.forecast_category, ''))) IN ('best case', 'best-case') THEN 'best-case'
  WHEN lower(btrim(coalesce(d.forecast_category, ''))) = 'pipeline' THEN 'pipeline'
  WHEN lower(btrim(coalesce(d.forecast_category, ''))) = 'closed' THEN 'closed'
  WHEN ps.stage_type = 'won' THEN 'closed'
  WHEN ps.stage_type = 'lost' THEN NULL
  WHEN ps.slug = 'negotiation' THEN 'commit'
  WHEN ps.slug = 'proposal' THEN 'best-case'
  ELSE 'pipeline' END`;

export const CATEGORIES = ['pipeline', 'best-case', 'commit', 'closed'] as const;
export type Category = typeof CATEGORIES[number];

/** "Q4 2026" -> its first and last calendar day. */
export function quarterOf(period: string): { start: string; end: string } {
  const m = /^Q([1-4]) (\d{4})$/.exec(String(period ?? '').trim());
  if (!m) throw new ListQueryError('period must look like "Q4 2026"');
  const q = Number(m[1]); const y = Number(m[2]);
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(Date.UTC(y, q * 3, 0)).getUTCDate();
  return { start: `${y}-${pad(q * 3 - 2)}-01`, end: `${y}-${pad(q * 3)}-${pad(lastDay)}` };
}

export function calendarDay(v: unknown, field: string): string {
  const s = String(v ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) !== s) {
    throw new ListQueryError(`${field} must be a calendar date in YYYY-MM-DD format`);
  }
  return s;
}

interface Queryable { query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> }

export interface UsdTotal { count: number; value_usd: number; unconverted: number }
export interface RepForecast {
  key: string; label: string; user_id: number | null; unresolved: boolean;
  pipeline: UsdTotal; best_case: UsdTotal; commit: UsdTotal; closed: UsdTotal;
  deal_count: number; unconverted: number;
  /** For the page's inspection cues. */
  commit_overdue: number;
}

const TOP_PER_CATEGORY = 25;

export async function computeForecast(db: Queryable, tenantId: string, period: string, today: string) {
  const { start, end } = quarterOf(period);
  const includeUndated = today >= start && today <= end;
  const params = [tenantId, start, end, includeUndated, today];
  const inQuarter = `(
       (d.expected_close_date BETWEEN $2::date AND $3::date)
    OR (d.expected_close_date IS NULL AND $4::boolean AND (${FORECAST_CATEGORY}) <> 'closed'))`;
  const base = `
      FROM deals d
      JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id
      LEFT JOIN users au ON au.id = d.assigned_to_user_id AND au.tenant_id = d.tenant_id
     WHERE d.tenant_id = $1 AND d.is_test = false AND d.is_archived = false
       AND $5::date IS NOT NULL
       AND (${FORECAST_CATEGORY}) IS NOT NULL
       AND ${inQuarter}`;
  const usd = `COALESCE(sum(d.base_amount_usd) FILTER (WHERE ${TRUSTED_USD('d')}), 0)::float8 AS value_usd,
               (count(*) FILTER (WHERE NOT ${TRUSTED_USD('d')}))::int AS unconverted, count(*)::int AS count`;

  const [byRepCat, top] = await Promise.all([
    db.query(
      `SELECT ${OWNER_KEY} AS key, ${OWNER_LABEL} AS label, d.assigned_to_user_id AS user_id,
              (${FORECAST_CATEGORY}) AS category, ${usd},
              (count(*) FILTER (WHERE (${FORECAST_CATEGORY}) = 'commit' AND d.expected_close_date < $5::date))::int AS commit_overdue
         ${base}
        GROUP BY 1, 2, 3, 4`, params),
    db.query(
      `SELECT * FROM (
         SELECT d.id, d.name, d.company_name, ps.slug AS stage, ${OWNER_LABEL} AS owner,
                d.value, d.currency, d.base_amount_usd, to_char(d.expected_close_date, 'YYYY-MM-DD') AS expected_close_date,
                (${FORECAST_CATEGORY}) AS category,
                ROW_NUMBER() OVER (PARTITION BY (${FORECAST_CATEGORY})
                                   ORDER BY d.base_amount_usd DESC NULLS LAST, d.value DESC, d.id) AS rn
           ${base}) t
        WHERE rn <= ${TOP_PER_CATEGORY}
        ORDER BY category, rn`, params),
  ]);

  const zero = (): UsdTotal => ({ count: 0, value_usd: 0, unconverted: 0 });
  const field = (c: Category) => (c === 'best-case' ? 'best_case' : c) as 'pipeline' | 'best_case' | 'commit' | 'closed';
  const reps = new Map<string, RepForecast>();
  const categories: Record<Category, UsdTotal> = { pipeline: zero(), 'best-case': zero(), commit: zero(), closed: zero() };
  for (const r of byRepCat.rows) {
    const rep = reps.get(r.key) ?? {
      key: r.key, label: r.label, user_id: r.user_id ?? null, unresolved: r.user_id == null,
      pipeline: zero(), best_case: zero(), commit: zero(), closed: zero(), deal_count: 0, unconverted: 0, commit_overdue: 0,
    };
    const c = r.category as Category;
    rep[field(c)] = { count: r.count, value_usd: r.value_usd, unconverted: r.unconverted };
    rep.deal_count += r.count;
    rep.unconverted += r.unconverted;
    rep.commit_overdue += r.commit_overdue;
    reps.set(r.key, rep);
    const cat = categories[c];
    cat.count += r.count; cat.value_usd += r.value_usd; cat.unconverted += r.unconverted;
  }
  const repList = Array.from(reps.values()).sort((a, b) =>
    a.label === 'Unassigned' ? 1 : b.label === 'Unassigned' ? -1
      : (b.commit.value_usd + b.closed.value_usd) - (a.commit.value_usd + a.closed.value_usd) || a.label.localeCompare(b.label));
  const topDeals: Record<Category, any[]> = { pipeline: [], 'best-case': [], commit: [], closed: [] };
  for (const { rn: _rn, ...row } of top.rows) topDeals[row.category as Category].push(row);

  return {
    period, quarter_start: start, quarter_end: end, as_of: today, include_undated: includeUndated,
    categories, reps: repList, top_deals: topDeals, top_per_category: TOP_PER_CATEGORY,
  };
}
