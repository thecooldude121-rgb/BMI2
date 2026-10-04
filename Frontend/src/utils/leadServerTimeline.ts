import type { Lead, LeadActivity } from '../types/lead';
import type { LeadStageHistoryRow } from './leadsApi';

/**
 * The Lead detail timeline, built ONLY from rows the server returned
 * (Figma 61:408: "Populated from server-confirmed CRM events").
 *
 * It replaced a timeline assembled from three client-side sources: activities
 * the composer had logged into React state (never sent anywhere, gone on
 * reload), an audit trail kept in this browser's localStorage, and events
 * synthesised from lead fields the API never returns. Every entry here is now
 * a database row: the lead's creation, a `lead_stage_history` move, or an
 * `activities` row.
 */
export interface ServerTimelineItem {
  id: string;
  kind: 'created' | 'stage' | 'activity';
  at: string;
  title: string;
  detail?: string;
  /** Activity type (call / email / meeting / note / task / whatsapp…). */
  activityType?: string;
  /** A manager override of the qualification gate — shown, never hidden. */
  override?: boolean;
}

export const stageLabel = (s: string | null | undefined): string => {
  if (!s) return '—';
  // DB 'contacted' is the UI's 'attempting_contact' (the status migration).
  const v = s === 'contacted' ? 'attempting_contact' : s;
  const words = v.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const activityTime = (a: Partial<LeadActivity>): string =>
  a.completed_at || a.scheduled_at || a.created_at || '';

export function buildServerTimeline(
  lead: Pick<Lead, 'created_at' | 'source'>,
  history: LeadStageHistoryRow[],
  activities: Partial<LeadActivity>[],
): ServerTimelineItem[] {
  const items: ServerTimelineItem[] = [];

  // Creation: the history's own creation row (from_stage NULL) when there is
  // one — it carries who and which stage — else the lead's created_at, which
  // predates stage history for older leads.
  const creationRow = history.find(h => h.from_stage === null);
  if (!creationRow && lead.created_at) {
    items.push({
      id: 'created', kind: 'created', at: lead.created_at,
      title: 'Lead created',
      detail: lead.source ? `Source: ${lead.source}` : undefined,
    });
  }

  for (const h of history) {
    const by = h.changed_by_name ? ` by ${h.changed_by_name}` : '';
    if (h.from_stage === null) {
      items.push({
        id: `stage-${h.id}`, kind: 'created', at: h.changed_at,
        title: `Lead created as ${stageLabel(h.to_stage)}`,
        detail: [lead.source ? `Source: ${lead.source}` : null, h.changed_by_name ? `Created by ${h.changed_by_name}` : null]
          .filter(Boolean).join(' · ') || undefined,
      });
      continue;
    }
    const overridden = h.qualification_override && h.unmet_criteria?.length
      ? `Qualification gate overridden (unmet: ${h.unmet_criteria.join(', ')})`
      : h.qualification_override ? 'Qualification gate overridden' : null;
    items.push({
      id: `stage-${h.id}`, kind: 'stage', at: h.changed_at,
      title: `${stageLabel(h.from_stage)} → ${stageLabel(h.to_stage)}${by}`,
      detail: [overridden, h.reason ? `Reason: ${h.reason}` : null].filter(Boolean).join(' · ') || undefined,
      override: h.qualification_override || undefined,
    });
  }

  for (const a of activities) {
    const at = activityTime(a);
    if (!at) continue;
    const bits = [a.outcome ? `Outcome: ${a.outcome}` : null, a.description || null].filter(Boolean);
    items.push({
      id: `activity-${a.id}`, kind: 'activity', at,
      title: a.subject || stageLabel(a.type),
      detail: bits.join(' · ') || undefined,
      activityType: a.type,
    });
  }

  return items.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());
}
