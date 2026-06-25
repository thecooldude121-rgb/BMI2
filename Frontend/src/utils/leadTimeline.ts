import type { Lead, LeadActivity, LeadLifecycleStage } from '../types/lead';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TimelineEventKind =
  | 'created'
  | 'enriched'
  | 'first_contact'
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'call_logged'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'note_added'
  | 'task_created'
  | 'whatsapp_sent'
  | 'qualified'
  | 'status_changed'
  | 'follow_up_set'
  | 'converted'
  | 'disqualified'
  | 'lost';

export type TimelineEventCategory =
  | 'system'
  | 'email'
  | 'call'
  | 'whatsapp'
  | 'meeting'
  | 'note'
  | 'task';

export interface TimelineEvent {
  id:        string;
  kind:      TimelineEventKind;
  category:  TimelineEventCategory;
  timestamp: string;
  title:     string;
  body?:     string;
  metadata?: {
    direction?:        'inbound' | 'outbound';
    outcome?:          string;
    duration_minutes?: number;
    activityStatus?:   string;
    newStatus?:        string;
  };
  source: 'system' | 'user';
}

// ── Private helpers ────────────────────────────────────────────────────────────

const STATUS_LABEL: Partial<Record<LeadLifecycleStage, string>> = {
  new:               'New',
  assigned:          'Assigned',
  enriching:         'Enriching',
  attempting_contact:'Attempting Contact',
  engaged:           'Engaged',
  qualified:         'Qualified',
  sales_accepted:    'Sales Accepted',
  nurture:           'Nurture',
  disqualified:      'Disqualified',
  converted:         'Converted',
  lost:              'Lost',
};

function fmtStatus(s: string): string {
  return STATUS_LABEL[s as LeadLifecycleStage]
    ?? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fmtReason(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function daysAgoNum(ts: string): number {
  return Math.floor((Date.now() - new Date(ts).getTime()) / 86_400_000);
}

function daysFromNowNum(ts: string): number {
  return Math.floor((new Date(ts).getTime() - Date.now()) / 86_400_000);
}

function leadName(lead: Lead): string {
  return lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'This lead';
}

// ── Activity → TimelineEvent ──────────────────────────────────────────────────

const ACT_KIND: Record<string, TimelineEventKind> = {
  email:    'email_sent',
  call:     'call_logged',
  whatsapp: 'whatsapp_sent',
  note:     'note_added',
  task:     'task_created',
  sms:      'email_sent',
  linkedin: 'email_sent',
  demo:     'meeting_completed',
  proposal: 'email_sent',
  document: 'note_added',
  visit:    'meeting_completed',
};

const ACT_CATEGORY: Record<string, TimelineEventCategory> = {
  email:    'email',
  call:     'call',
  whatsapp: 'whatsapp',
  note:     'note',
  task:     'task',
  sms:      'email',
  linkedin: 'email',
  demo:     'meeting',
  proposal: 'email',
  document: 'note',
  visit:    'meeting',
};

function activityToEvent(a: LeadActivity): TimelineEvent {
  const kind: TimelineEventKind =
    a.type === 'meeting'
      ? (a.status === 'planned' ? 'meeting_scheduled' : 'meeting_completed')
      : (ACT_KIND[a.type] ?? 'email_sent');

  const bodyParts: string[] = [];
  if (a.description) bodyParts.push(a.description);
  if (a.outcome && !a.description?.includes(a.outcome)) bodyParts.push(`Outcome: ${a.outcome}`);
  if (a.duration_minutes) bodyParts.push(`${a.duration_minutes} min`);

  return {
    id:        `act_${a.id}`,
    kind,
    category:  ACT_CATEGORY[a.type] ?? 'email',
    timestamp: a.completed_at ?? a.scheduled_at ?? a.created_at,
    title:     a.subject,
    body:      bodyParts.length > 0 ? bodyParts.join(' · ') : undefined,
    metadata: {
      direction:        a.direction,
      outcome:          a.outcome ?? undefined,
      duration_minutes: a.duration_minutes,
      activityStatus:   a.status,
    },
    source: 'user',
  };
}

// ── System events from lead fields ────────────────────────────────────────────

function buildSystemEvents(lead: Lead, skipEmailFields: boolean): TimelineEvent[] {
  const evts: TimelineEvent[] = [];

  evts.push({
    id:       `sys_created_${lead.id}`,
    kind:     'created',
    category: 'system',
    timestamp: lead.created_at,
    title:    `Lead created${lead.source ? ` · ${lead.source}` : ''}`,
    body:     lead.source_detail ?? undefined,
    source:   'system',
  });

  if (lead.enriched_at) {
    evts.push({
      id: `sys_enriched_${lead.id}`, kind: 'enriched', category: 'system',
      timestamp: lead.enriched_at, title: 'AI enrichment completed', source: 'system',
    });
  }

  if (lead.first_contact_date) {
    evts.push({
      id: `sys_first_contact_${lead.id}`, kind: 'first_contact', category: 'system',
      timestamp: lead.first_contact_date, title: 'First contact recorded', source: 'system',
    });
  }

  // Skip field-derived email events when user activities cover them
  if (!skipEmailFields) {
    if (lead.last_email_sent_at) {
      evts.push({
        id: `sys_email_sent_${lead.id}`, kind: 'email_sent', category: 'email',
        timestamp: lead.last_email_sent_at,
        title: `Email sent${lead.email_sent_count > 1 ? ` (${lead.email_sent_count} total)` : ''}`,
        source: 'system',
      });
    }
    if (lead.last_email_opened_at) {
      evts.push({
        id: `sys_email_opened_${lead.id}`, kind: 'email_opened', category: 'email',
        timestamp: lead.last_email_opened_at,
        title: `Email opened${lead.email_opens_count > 1 ? ` (${lead.email_opens_count}×)` : ''}`,
        source: 'system',
      });
    }
    if (lead.last_email_clicked_at) {
      evts.push({
        id: `sys_email_clicked_${lead.id}`, kind: 'email_clicked', category: 'email',
        timestamp: lead.last_email_clicked_at,
        title: `Link clicked${lead.email_clicks_count > 1 ? ` (${lead.email_clicks_count}×)` : ''}`,
        source: 'system',
      });
    }
  }

  if (lead.qualified_at) {
    evts.push({
      id: `sys_qualified_${lead.id}`, kind: 'qualified', category: 'system',
      timestamp: lead.qualified_at,
      title: `Qualified${lead.qualified_by ? ` · by ${lead.qualified_by}` : ''}`,
      body:  lead.qualification_notes ?? undefined,
      source: 'system',
    });
  }

  // TODO: when backend emits status_changed events with full history,
  // replace this single derived event with the full event log.
  if (lead.stage_entered_at) {
    if (lead.status === 'disqualified') {
      evts.push({
        id: `sys_status_${lead.id}`, kind: 'disqualified', category: 'system',
        timestamp: lead.stage_entered_at,
        title: `Disqualified${lead.disqualified_reason ? ` · ${fmtReason(lead.disqualified_reason)}` : ''}`,
        body:  lead.disqualified_reason_notes ?? undefined,
        metadata: { newStatus: lead.status },
        source: 'system',
      });
    } else if (lead.status === 'lost') {
      evts.push({
        id: `sys_status_${lead.id}`, kind: 'lost', category: 'system',
        timestamp: lead.stage_entered_at,
        title: `Lost${lead.lost_reason ? ` · ${fmtReason(lead.lost_reason)}` : ''}`,
        body:  lead.lost_reason_notes ?? undefined,
        metadata: { newStatus: lead.status },
        source: 'system',
      });
    } else if (lead.status !== 'new' && lead.status !== 'assigned') {
      evts.push({
        id: `sys_status_${lead.id}`, kind: 'status_changed', category: 'system',
        timestamp: lead.stage_entered_at,
        title: `Moved to ${fmtStatus(lead.status)}`,
        metadata: { newStatus: lead.status },
        source: 'system',
      });
    }
  }

  if (lead.converted_at) {
    const parts: string[] = [];
    if (lead.converted_to_contact_id) parts.push('Contact');
    if (lead.converted_to_deal_id)    parts.push('Deal');
    evts.push({
      id: `sys_converted_${lead.id}`, kind: 'converted', category: 'system',
      timestamp: lead.converted_at,
      title: `Converted${parts.length > 0 ? ` → ${parts.join(' & ')}` : ''}`,
      source: 'system',
    });
  }

  return evts;
}

// ── Public: buildTimeline ─────────────────────────────────────────────────────

export function buildTimeline(lead: Lead, activities?: LeadActivity[]): TimelineEvent[] {
  const acts       = activities ?? [];
  const systemEvts = buildSystemEvents(lead, acts.length > 0);
  const actEvts    = acts.map(activityToEvent);

  return [...systemEvts, ...actEvts]
    .filter(e => !!e.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ── Public: buildLastTouchSummary ─────────────────────────────────────────────

export function buildLastTouchSummary(lead: Lead): string {
  const candidates = [lead.last_contact_date, lead.last_email_sent_at, lead.last_activity_date]
    .filter(Boolean) as string[];

  if (candidates.length === 0) {
    const d = daysAgoNum(lead.created_at);
    return `Not yet contacted · Created ${d === 0 ? 'today' : `${d}d ago`}`;
  }

  const lastDate = [...candidates].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  )[0];
  const d     = daysAgoNum(lastDate);
  const label = d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d}d ago`;

  const parts: string[] = [`Last touched ${label}`];

  if (lead.email_opens_count > 0) {
    parts.push(`${lead.email_opens_count} email${lead.email_opens_count > 1 ? 's' : ''} opened`);
  } else if (lead.email_sent_count > 0) {
    parts.push(`${lead.email_sent_count} email${lead.email_sent_count > 1 ? 's' : ''} sent`);
  }

  if (lead.next_follow_up_date) {
    const df = daysFromNowNum(lead.next_follow_up_date);
    if (df < 0)        parts.push('Follow-up overdue');
    else if (df === 0) parts.push('Follow-up due today');
    else if (df === 1) parts.push('Follow-up due tomorrow');
    else               parts.push(`Follow-up in ${df}d`);
  }

  return parts.join(' · ');
}

// ── Public: buildSalesMemory ──────────────────────────────────────────────────

export function buildSalesMemory(lead: Lead, recentActivities?: LeadActivity[]): string {
  // TODO: replace with LLM-generated contextual summary when available.
  const name      = leadName(lead);
  const company   = lead.company ? ` at ${lead.company}` : '';
  const d         = daysAgoNum(lead.created_at);
  const weeks     = Math.floor(d / 7);
  const timeLabel =
    d === 0    ? 'today'
    : d === 1  ? 'yesterday'
    : weeks >= 2 ? `${weeks} weeks ago`
    : `${d} days ago`;

  const src = lead.source ? ` via ${lead.source}` : '';
  const s1  = `${name}${company} entered the pipeline${src} ${timeLabel}.`;

  // Outreach history
  const histParts: string[] = [];
  const acts = recentActivities ?? [];
  if (acts.length > 0) {
    const byType = acts.reduce<Record<string, LeadActivity[]>>((acc, a) => {
      (acc[a.type] ??= []).push(a);
      return acc;
    }, {});

    if (byType.email?.length) {
      const cnt  = byType.email.length;
      const subj = byType.email[0].subject;
      const clip = subj && subj.length > 30 ? `${subj.slice(0, 30)}…` : subj;
      histParts.push(`Emailed ${cnt === 1 ? 'once' : `${cnt}×`}${clip ? ` ("${clip}")` : ''}`);
    }
    if (byType.call?.length) {
      const cnt     = byType.call.length;
      const outcome = byType.call[0].outcome;
      histParts.push(`Called ${cnt === 1 ? 'once' : `${cnt}×`}${outcome ? ` (${outcome})` : ''}`);
    }
    if (byType.meeting?.length) {
      histParts.push(`Meeting ${byType.meeting[0].status === 'planned' ? 'scheduled' : 'held'}`);
    }
    if (byType.whatsapp?.length) {
      histParts.push(`WhatsApp: ${byType.whatsapp[0].outcome ?? 'sent'}`);
    }
  } else {
    if (lead.email_sent_count > 0) {
      const eng =
        lead.email_opens_count > 0
          ? ` (${lead.email_opens_count} opened${lead.email_clicks_count > 0 ? `, ${lead.email_clicks_count} clicked` : ''})`
          : ' (no opens)';
      histParts.push(`${lead.email_sent_count} email${lead.email_sent_count > 1 ? 's' : ''}${eng}`);
    }
    if (lead.call_count > 0) {
      histParts.push(`${lead.call_count} call${lead.call_count > 1 ? 's' : ''}`);
    }
    if (lead.meeting_count > 0) {
      histParts.push(`${lead.meeting_count} meeting${lead.meeting_count > 1 ? 's' : ''}`);
    }
  }
  const s2 = histParts.length > 0 ? `${histParts.join('; ')}.` : 'No outreach logged yet.';

  // Current state
  const score = lead.ai_score ?? lead.score;
  const s3    = `Status: ${fmtStatus(lead.status)} · Score ${score}/100${lead.is_qualified ? ' · Qualified' : ''}.`;

  // Next action
  let s4 = '';
  if (lead.next_follow_up_date) {
    const df    = daysFromNowNum(lead.next_follow_up_date);
    const label = df < 0 ? 'overdue' : df === 0 ? 'today' : df === 1 ? 'tomorrow' : `in ${df} days`;
    s4 = ` Follow-up due ${label}.`;
  } else if (!['converted', 'lost', 'disqualified'].includes(lead.status)) {
    s4 = ' No follow-up scheduled.';
  }

  return `${s1} ${s2} ${s3}${s4}`;
}
