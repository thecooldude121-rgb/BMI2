import React from 'react';
import { Brain, Clock } from 'lucide-react';
import type { Lead, LeadActivity } from '../../types/lead';
import { buildSalesMemory } from '../../utils/leadTimeline';

interface Props {
  lead:              Lead;
  recentActivities?: LeadActivity[];
}

function fmtDate(ts?: string): string | null {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SalesMemoryBlock({ lead, recentActivities }: Props) {
  const summary     = buildSalesMemory(lead, recentActivities);
  const lastUpdated = lead.last_activity_date ?? lead.last_contact_date ?? lead.updated_at;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-4 w-4 text-slate-600 shrink-0" />
        <h3 className="text-sm font-bold text-slate-800">Sales Memory</h3>
        <span className="text-[10px] text-slate-400 ml-auto font-normal">Auto-generated</span>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60">
        <Clock className="h-3 w-3 text-slate-400" />
        <span className="text-[11px] text-slate-400">
          Based on data from {fmtDate(lastUpdated) ?? 'today'}
        </span>
      </div>
    </div>
  );
}
