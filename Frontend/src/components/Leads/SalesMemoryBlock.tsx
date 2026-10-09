
import { Brain, Clock } from 'lucide-react';
import type { Lead, LeadActivity } from '../../types/lead';
import { buildSalesMemory } from '../../utils/leadTimeline';
import { dayOrInstant } from '../../utils/dates';

interface Props {
  lead:              Lead;
  recentActivities?: LeadActivity[];
}

function fmtDate(ts?: string): string | null {
  if (!ts) return null;
  return dayOrInstant(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SalesMemoryBlock({ lead, recentActivities }: Props) {
  const summary     = buildSalesMemory(lead, recentActivities);
  const lastUpdated = lead.last_activity_date ?? lead.last_contact_date ?? lead.updated_at;

  return (
    <div className="rounded-card border border-line bg-surface-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-4 w-4 text-ink-muted shrink-0" />
        <h3 className="text-sm font-bold text-ink">Sales Memory</h3>
        <span className="text-xs text-ink-muted ml-auto font-normal" title="A fixed template over this lead's stored fields and logged activities — not AI">From stored data</span>
      </div>

      <p className="text-sm text-ink leading-relaxed">{summary}</p>

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-line">
        <Clock className="h-3 w-3 text-ink-muted" />
        <span className="text-xs text-ink-muted">
          Based on data from {fmtDate(lastUpdated) ?? 'today'}
        </span>
      </div>
    </div>
  );
}
