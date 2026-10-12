import type { Lead } from '../types/lead';
import type { LeadSLAResult } from './leadSla';

export interface SourceStats {
  source:               string;
  total:                number;
  qualifiedRate:        number; // % status in qualified|sales_accepted|converted
  conversionReadyRate:  number; // % status in qualified|sales_accepted (currently in pipeline)
  staleRate:            number; // % stale SLA track breached
  duplicateRate:        number; // % has at least one duplicate candidate
  disqualifiedRate:     number; // % status === 'disqualified'
  slaBreachRate:        number; // % overall SLA track breached
  avgScore:             number;
}

const QUALIFIED_STATUSES        = new Set(['qualified', 'sales_accepted', 'converted']);
const CONVERSION_READY_STATUSES = new Set(['qualified', 'sales_accepted']);

export function computeSourceAnalytics(
  leads: Lead[],
  duplicateSet: { has(key: string): boolean },
  slaMap: ReadonlyMap<string, LeadSLAResult>,
): SourceStats[] {
  const groups = new Map<string, Lead[]>();
  for (const lead of leads) {
    const src = lead.source?.trim() || 'Unknown';
    if (!groups.has(src)) groups.set(src, []);
    groups.get(src)!.push(lead);
  }

  const stats: SourceStats[] = [];
  for (const [source, group] of groups) {
    const n = group.length;
    let qualified = 0, conversionReady = 0, stale = 0, duplicate = 0, disqualified = 0, slaBreach = 0, scoreSum = 0, scored = 0;

    for (const l of group) {
      // An unknown score is left OUT of the average, never averaged in as 0.
      const sc = l.ai_score ?? l.score;
      if (sc != null) { scoreSum += sc; scored++; }
      if (QUALIFIED_STATUSES.has(l.status))        qualified++;
      if (CONVERSION_READY_STATUSES.has(l.status)) conversionReady++;
      if (l.status === 'disqualified')              disqualified++;
      if (duplicateSet.has(l.id))                  duplicate++;
      const sla = slaMap.get(l.id);
      if (sla?.stale.severity === 'breached')       stale++;
      if (sla?.overall === 'breached')              slaBreach++;
    }

    const pct = (x: number) => n > 0 ? Math.round((x / n) * 100) : 0;
    stats.push({
      source,
      total:               n,
      qualifiedRate:       pct(qualified),
      conversionReadyRate: pct(conversionReady),
      staleRate:           pct(stale),
      duplicateRate:       pct(duplicate),
      disqualifiedRate:    pct(disqualified),
      slaBreachRate:       pct(slaBreach),
      avgScore:            scored > 0 ? Math.round(scoreSum / scored) : 0,
    });
  }

  return stats.sort((a, b) => b.total - a.total);
}
