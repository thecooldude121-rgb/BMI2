import React, { useState } from 'react';
import {
  Star, Zap, Mail, Phone, Calendar, FileText, MessageSquare,
  CheckCircle, XCircle, TrendingUp, TrendingDown, Clock,
  Send, CheckSquare, ArrowRight, ExternalLink, Plus, Activity,
  UserCheck, GitMerge, ThumbsUp,
} from 'lucide-react';
import type { TimelineEvent, TimelineEventKind, TimelineEventCategory } from '../../utils/leadTimeline';

// ── Chip config ───────────────────────────────────────────────────────────────

type FilterId = 'all' | TimelineEventCategory | 'audit';

const BASE_CHIPS: { id: FilterId; label: string }[] = [
  { id: 'all',      label: 'All'      },
  { id: 'system',   label: 'System'   },
  { id: 'email',    label: 'Email'    },
  { id: 'call',     label: 'Call'     },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'meeting',  label: 'Meeting'  },
  { id: 'note',     label: 'Note'     },
  { id: 'task',     label: 'Task'     },
];

const EVENT_COLOR: Record<TimelineEventKind, string> = {
  created:           'bg-blue-100 text-blue-600',
  enriched:          'bg-purple-100 text-purple-600',
  first_contact:     'bg-green-100 text-green-600',
  email_sent:        'bg-blue-100 text-blue-600',
  email_opened:      'bg-amber-100 text-amber-600',
  email_clicked:     'bg-amber-100 text-amber-600',
  call_logged:       'bg-green-100 text-green-600',
  meeting_scheduled: 'bg-purple-100 text-purple-600',
  meeting_completed: 'bg-teal-100 text-teal-600',
  note_added:        'bg-gray-100 text-gray-600',
  task_created:      'bg-orange-100 text-orange-600',
  whatsapp_sent:     'bg-emerald-100 text-emerald-600',
  qualified:         'bg-teal-100 text-teal-600',
  status_changed:    'bg-gray-100 text-gray-500',
  follow_up_set:     'bg-amber-100 text-amber-600',
  converted:         'bg-green-100 text-green-600',
  disqualified:      'bg-red-100 text-red-500',
  lost:              'bg-red-100 text-red-500',
  owner_changed:     'bg-indigo-100 text-indigo-600',
  merged:            'bg-violet-100 text-violet-600',
  score_feedback:    'bg-sky-100 text-sky-600',
};

// ── Relative time ─────────────────────────────────────────────────────────────

function fmtRelative(ts: string): string {
  const diff  = Date.now() - new Date(ts).getTime();
  const d     = new Date(ts);
  if (diff < 0) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <   1) return 'Just now';
  if (mins  <  60) return `${mins}m ago`;
  if (hours <  24) return `${hours}h ago`;
  if (days  ===  1) return 'Yesterday';
  if (days  <   7) return `${days}d ago`;
  if (days  <  31) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    ...(days > 365 ? { year: 'numeric' } : {}),
  });
}

// ── Event icon ────────────────────────────────────────────────────────────────

function EventIcon({ kind, sz }: { kind: TimelineEventKind; sz: number }) {
  switch (kind) {
    case 'created':           return <Star size={sz} />;
    case 'enriched':          return <Zap size={sz} />;
    case 'first_contact':     return <CheckCircle size={sz} />;
    case 'email_sent':        return <Send size={sz} />;
    case 'email_opened':      return <Mail size={sz} />;
    case 'email_clicked':     return <ExternalLink size={sz} />;
    case 'call_logged':       return <Phone size={sz} />;
    case 'meeting_scheduled': return <Calendar size={sz} />;
    case 'meeting_completed': return <CheckCircle size={sz} />;
    case 'note_added':        return <FileText size={sz} />;
    case 'task_created':      return <CheckSquare size={sz} />;
    case 'whatsapp_sent':     return <MessageSquare size={sz} />;
    case 'qualified':         return <CheckCircle size={sz} />;
    case 'status_changed':    return <ArrowRight size={sz} />;
    case 'follow_up_set':     return <Clock size={sz} />;
    case 'converted':         return <TrendingUp size={sz} />;
    case 'disqualified':      return <XCircle size={sz} />;
    case 'lost':              return <TrendingDown size={sz} />;
    case 'owner_changed':     return <UserCheck size={sz} />;
    case 'merged':            return <GitMerge size={sz} />;
    case 'score_feedback':    return <ThumbsUp size={sz} />;
    default:                  return <Activity size={sz} />;
  }
}

// ── Event row ─────────────────────────────────────────────────────────────────

function EventRow({ event, compact }: { event: TimelineEvent; compact: boolean }) {
  const color = EVENT_COLOR[event.kind] ?? 'bg-gray-100 text-gray-500';
  const sz    = compact ? 10 : 12;

  return (
    <div className={`flex items-start gap-3 ${compact ? 'py-2' : 'py-3'} border-b border-gray-100 last:border-0`}>
      <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${color}`}>
        <EventIcon kind={event.kind} sz={sz} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-medium text-gray-800 leading-snug ${compact ? 'text-xs' : 'text-[13px]'}`}>
            {event.title}
          </p>
          <span className={`text-gray-400 whitespace-nowrap shrink-0 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
            {fmtRelative(event.timestamp)}
          </span>
        </div>
        {event.body && (
          <p className={`text-gray-500 mt-0.5 line-clamp-2 leading-relaxed ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {event.body}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  events:         TimelineEvent[];
  onLogActivity?: () => void;
  compact?:       boolean;
}

export default function ActivityTimeline({ events, onLogActivity, compact = false }: Props) {
  const [filter, setFilter] = useState<FilterId>('all');

  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc.all = (acc.all ?? 0) + 1;
    // System chip excludes audit events — they have their own chip
    if (e.source !== 'audit') acc[e.category] = (acc[e.category] ?? 0) + 1;
    if (e.source === 'audit') acc.audit = (acc.audit ?? 0) + 1;
    return acc;
  }, { all: 0 });

  const auditCount = counts.audit ?? 0;
  // Only show chips that have at least one event; "All" always shows
  const chips: { id: FilterId; label: string }[] = [
    ...BASE_CHIPS.filter(c => c.id === 'all' || (counts[c.id] ?? 0) > 0),
    ...(auditCount > 0 ? [{ id: 'audit' as FilterId, label: 'Audit' }] : []),
  ];

  const visible =
    filter === 'all'   ? events :
    filter === 'audit' ? events.filter(e => e.source === 'audit') :
    // System filter excludes audit events so they don't bleed in
    filter === 'system'
      ? events.filter(e => e.category === 'system' && e.source !== 'audit')
      : events.filter(e => e.category === filter);

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
        {chips.map(chip => {
          const cnt    = counts[chip.id] ?? 0;
          const active = filter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setFilter(chip.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 ${
                active
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {chip.label}
              <span className={`text-[10px] min-w-[14px] px-1 py-0.5 rounded-full leading-none text-center ${
                active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* Events list */}
      {visible.length > 0 ? (
        <div>
          {visible.map(evt => (
            <EventRow key={evt.id} event={evt} compact={compact} />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            {filter === 'all' ? 'No activity recorded yet' : `No ${filter} events`}
          </p>
        </div>
      )}

      {/* Log Activity CTA */}
      {onLogActivity && (
        <button
          onClick={onLogActivity}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <Plus size={14} /> Log Activity
        </button>
      )}
    </div>
  );
}
