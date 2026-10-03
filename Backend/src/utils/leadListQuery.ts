/**
 * SERVER-SIDE LEAD LIST QUERY — step 5 slice A (pagination), approved 2026-10-03.
 *
 * The Leads page used to load at most 50 leads (the API default, sent no limit)
 * and then filter, sort and page those 50 in the browser — silently, with no
 * total. This module turns the page's filters into ONE parameterised WHERE and
 * ORDER BY so the database pages over EVERY lead and returns a real total.
 *
 * SAFETY: no request value is ever interpolated into SQL. Columns come only from
 * the allowlists below; every value is a $n parameter. Anything not recognised
 * is a FilterError (400) — never silently ignored, because an ignored filter
 * returns a list that looks filtered and is not.
 *
 * Mirrors, exactly, what the page did client-side:
 *   - the status vocabulary migration (DB 'contacted' is the UI's
 *     'attempting_contact'; a 'new' lead WITH an owner shows as 'assigned');
 *   - the status chip groups;
 *   - source as a case-insensitive substring;
 *   - score bands on the score column;
 *   - search over first name, last name, email and company;
 *   - the advanced filter's AND-of-groups / per-group AND|OR semantics.
 */

export class FilterError extends Error {}

type Param = string | number | string[] | null;

export interface LeadListParams {
  status?: string;          // a UI status value or a chip group key
  source?: string;
  score_band?: string;      // '80-100' | '60-79' | 'below-60'
  search?: string;
  assigned_to_user_id?: string;
  insight?: string;         // 'untouched' | 'ready_to_convert'
  filter?: string;          // JSON AdvancedFilter
  sort?: string;
  stages?: string;          // comma list of UI statuses (Kanban lanes)
}

/** UI status -> SQL predicate over the DB row (the client migration layer, server-side). */
function statusPredicate(status: string, p: (v: Param) => string): string {
  switch (status) {
    case 'attempting_contact': return `l.stage IN ('attempting_contact', 'contacted')`;
    case 'new':                return `(l.stage = 'new' AND l.assigned_to IS NULL AND l.assigned_to_user_id IS NULL)`;
    case 'assigned':           return `(l.stage = 'assigned' OR (l.stage = 'new' AND (l.assigned_to IS NOT NULL OR l.assigned_to_user_id IS NOT NULL)))`;
    default:
      if (!/^[a-z_]+$/.test(status)) throw new FilterError(`status ${status} is not a lead status`);
      return `l.stage = ${p(status)}`;
  }
}

/** The page's chip groups (useLeadsPageState.STATUS_GROUPS). */
export const STATUS_GROUPS: Record<string, string[]> = {
  __incoming__:    ['new', 'assigned'],
  __in_progress__: ['enriching', 'attempting_contact', 'engaged'],
  __qualified__:   ['qualified', 'sales_accepted'],
  __nurturing__:   ['nurture'],
  __closed__:      ['converted', 'disqualified', 'lost'],
};

const anyStatus = (statuses: string[], p: (v: Param) => string) =>
  `(${statuses.map(s => statusPredicate(s, p)).join(' OR ')})`;

/** Sorts that are real SQL. The rest depend on client-computed scores (slice B). */
export const SQL_SORTS: Record<string, string> = {
  newest:          'l.created_at DESC, l.id DESC',
  oldest:          'l.created_at ASC, l.id ASC',
  score_high_low:  'l.score DESC NULLS LAST, l.id DESC',
  score_low_high:  'l.score ASC NULLS FIRST, l.id ASC',
  recently_active: 'l.last_contact DESC NULLS LAST, l.id DESC',
};

// ── Advanced filter ───────────────────────────────────────────────────────────

/** Fields with a real column. Everything else in the UI builder is Coming soon. */
export const SERVER_FILTER_FIELDS = [
  'status', 'source', 'score', 'lead_age', 'last_contact_age', 'company', 'position',
] as const;

const DATE_COL: Record<string, string> = { lead_age: 'l.created_at', last_contact_age: 'l.last_contact' };
const TEXT_COL: Record<string, string> = { company: 'l.company', position: 'l.position' };

const likeEscape = (s: string) => s.replace(/[\\%_]/g, m => `\\${m}`);

function num(v: unknown, what: string): number {
  const n = Number(v);
  if (v === null || v === '' || !Number.isFinite(n)) throw new FilterError(`${what} needs a number`);
  return n;
}
function strList(v: unknown, what: string): string[] {
  if (!Array.isArray(v) || v.some(x => typeof x !== 'string')) throw new FilterError(`${what} needs a list of values`);
  return v as string[];
}

function conditionSql(c: any, p: (v: Param) => string): string {
  const { fieldId, operator, value } = c ?? {};
  if (!SERVER_FILTER_FIELDS.includes(fieldId)) {
    throw new FilterError(`filtering on ${String(fieldId)} is not available yet`);
  }
  const what = `${fieldId} ${operator}`;

  if (fieldId === 'status' || fieldId === 'source') {
    const one = (v: string) => fieldId === 'status' ? statusPredicate(v, p) : `coalesce(l.source, '') = ${p(v)}`;
    switch (operator) {
      case 'is':         if (typeof value !== 'string') throw new FilterError(`${what} needs a value`); return one(value);
      case 'is_not':     if (typeof value !== 'string') throw new FilterError(`${what} needs a value`); return `NOT ${one(value)}`;
      case 'is_any_of':  { const l = strList(value, what); return l.length ? `(${l.map(one).join(' OR ')})` : 'FALSE'; }
      case 'is_none_of': { const l = strList(value, what); return l.length ? `NOT (${l.map(one).join(' OR ')})` : 'TRUE'; }
    }
  }

  if (fieldId === 'score') {
    const col = 'coalesce(l.score, 0)';
    switch (operator) {
      case 'is_empty':              return 'coalesce(l.score, 0) = 0';
      case 'equals':                return `${col} = ${p(num(value, what))}`;
      case 'not_equals':            return `${col} <> ${p(num(value, what))}`;
      case 'greater_than':          return `${col} > ${p(num(value, what))}`;
      case 'greater_than_or_equal': return `${col} >= ${p(num(value, what))}`;
      case 'less_than':             return `${col} < ${p(num(value, what))}`;
      case 'less_than_or_equal':    return `${col} <= ${p(num(value, what))}`;
      case 'between': {
        if (!Array.isArray(value) || value.length !== 2) throw new FilterError(`${what} needs two numbers`);
        return `${col} BETWEEN ${p(num(value[0], what))} AND ${p(num(value[1], what))}`;
      }
    }
  }

  if (DATE_COL[fieldId]) {
    const col = DATE_COL[fieldId];
    switch (operator) {
      case 'date_is_empty':      return `${col} IS NULL`;
      case 'is_overdue':         return `(${col} IS NOT NULL AND ${col} < NOW())`;
      // daysSince(col) <= n  <=>  col >= NOW() - n days
      case 'within_last_n_days': return `(${col} IS NOT NULL AND ${col} >= NOW() - make_interval(days => ${p(num(value, what))}::int))`;
      case 'before_n_days_ago':  return `(${col} IS NOT NULL AND ${col} <  NOW() - make_interval(days => ${p(num(value, what))}::int))`;
      case 'after_date':
      case 'before_date': {
        if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new FilterError(`${what} needs a date`);
        return `(${col} IS NOT NULL AND ${col} ${operator === 'after_date' ? '>' : '<'} ${p(value)}::timestamptz)`;
      }
    }
  }

  if (TEXT_COL[fieldId]) {
    const col = `coalesce(${TEXT_COL[fieldId]}, '')`;
    const needText = () => { if (typeof value !== 'string') throw new FilterError(`${what} needs text`); return value; };
    switch (operator) {
      case 'text_is_empty': return `btrim(${col}) = ''`;
      case 'contains':      return `${col} ILIKE ${p(`%${likeEscape(needText())}%`)}`;
      case 'not_contains':  return `${col} NOT ILIKE ${p(`%${likeEscape(needText())}%`)}`;
      case 'starts_with':   return `${col} ILIKE ${p(`${likeEscape(needText())}%`)}`;
    }
  }

  throw new FilterError(`operator ${String(operator)} is not supported for ${fieldId}`);
}

function advancedFilterSql(raw: string, p: (v: Param) => string): string | null {
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { throw new FilterError('filter must be valid JSON'); }
  if (!parsed || !Array.isArray(parsed.groups)) throw new FilterError('filter.groups must be a list');
  const groups = parsed.groups.filter((g: any) => Array.isArray(g?.conditions) && g.conditions.length > 0);
  if (groups.length === 0) return null;
  // Groups combine with AND; conditions within a group with the group's logic.
  return groups.map((g: any) => {
    if (g.logic !== 'AND' && g.logic !== 'OR') throw new FilterError('a filter group\'s logic must be AND or OR');
    return `(${g.conditions.map((c: any) => conditionSql(c, p)).join(g.logic === 'AND' ? ' AND ' : ' OR ')})`;
  }).join(' AND ');
}

// ── Builder ───────────────────────────────────────────────────────────────────

export interface BuiltLeadQuery {
  where: string;      // without the WHERE keyword; always includes the tenant
  params: Param[];
  orderBy: string;
}

export function buildLeadListQuery(tenantId: string, q: LeadListParams): BuiltLeadQuery {
  const params: Param[] = [tenantId];
  const p = (v: Param) => { params.push(v); return `$${params.length}`; };
  const where: string[] = ['l.tenant_id = $1'];

  if (q.status && q.status !== 'all') {
    where.push(STATUS_GROUPS[q.status] ? anyStatus(STATUS_GROUPS[q.status], p) : statusPredicate(q.status, p));
  }
  if (q.stages) {
    const list = q.stages.split(',').map(s => s.trim()).filter(Boolean);
    if (list.length) where.push(anyStatus(list, p));
  }
  if (q.source && q.source !== 'all') {
    where.push(`coalesce(l.source, '') ILIKE ${p(`%${likeEscape(q.source)}%`)}`);
  }
  if (q.score_band && q.score_band !== 'all') {
    const s = 'coalesce(l.score, 0)';
    if (q.score_band === '80-100') where.push(`${s} >= 80`);
    else if (q.score_band === '60-79') where.push(`${s} >= 60 AND ${s} < 80`);
    else if (q.score_band === 'below-60') where.push(`${s} < 60`);
    else throw new FilterError(`score_band must be 80-100, 60-79 or below-60`);
  }
  if (q.search && q.search.trim()) {
    const term = p(`%${likeEscape(q.search.trim())}%`);
    where.push(`(coalesce(l.first_name,'') || ' ' || coalesce(l.last_name,'') ILIKE ${term}
              OR l.email ILIKE ${term} OR coalesce(l.company,'') ILIKE ${term})`);
  }
  if (q.assigned_to_user_id) {
    const n = Number(q.assigned_to_user_id);
    if (!Number.isInteger(n)) throw new FilterError('assigned_to_user_id must be a user id');
    where.push(`l.assigned_to_user_id = ${p(n)}`);
  }
  if (q.insight) {
    if (q.insight === 'untouched') {
      where.push(`(l.last_contact IS NULL OR l.last_contact < CURRENT_DATE - 30)`);
    } else if (q.insight === 'ready_to_convert') {
      where.push(`l.stage IN ('qualified', 'sales_accepted')`);
    } else {
      throw new FilterError(`the ${q.insight} insight is not available yet`);
    }
  }
  if (q.filter) {
    const adv = advancedFilterSql(q.filter, p);
    if (adv) where.push(adv);
  }

  const sort = q.sort || 'newest';
  const orderBy = SQL_SORTS[sort];
  if (!orderBy) throw new FilterError(`sorting by ${sort} is not available yet`);

  return { where: where.join(' AND '), params, orderBy };
}
