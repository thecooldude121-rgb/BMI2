import React, { useCallback, useEffect, useState } from 'react';
import { X, ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import type { Lead } from '../../types/lead';
import type { LeadSLAResult } from '../../utils/leadSla';
import { fetchActivitiesFromAPI, fetchLeadStageHistory } from '../../utils/leadsApi';
import type { LeadStageHistoryRow } from '../../utils/leadsApi';
import type { LeadActivity } from '../../types/lead';
import { buildServerTimeline, stageLabel } from '../../utils/leadServerTimeline';
import { followUpStatus } from '../../utils/leadFollowUp';
import { Button } from '../ui/Button';
import Badge from '../ui/Badge';
import Alert from '../ui/Alert';
import Card, { SectionHeading } from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import LeadFilesSection from './LeadFilesSection';

/**
 * The docked "Selected lead" panel beside the Leads list — Figma "Lead quick
 * drawer" (61:328), phase 3 slice 3B-2. It replaced an overlay drawer whose
 * activity tab built a timeline from lead fields the API never returns.
 *
 * Every line here is a stored field, a server row, a rule computed from this
 * lead alone (its SLA), or a labelled gap:
 *   Overview — SLA (per lead), stored fields, the status actions (the server
 *              decides; LeadsPage.moveLead reports a refusal), duplicates
 *              (detection across all leads is still coming soon), and what is
 *              genuinely unavailable.
 *   Activity — stage history + activities, fetched for this lead.
 *   Related  — the records a conversion created (migration 059).
 *   Files    — the lead's Documents (Group B item 12).
 */

type Tab = 'overview' | 'activity' | 'related' | 'files';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' }, { id: 'activity', label: 'Activity' },
  { id: 'related', label: 'Related' }, { id: 'files', label: 'Files' },
];

/** The stage a "Set …" button moves to next; null when the next step needs a gate or wizard. */
const NEXT_STAGE: Partial<Record<Lead['status'], Lead['status']>> = {
  new: 'attempting_contact', assigned: 'attempting_contact', enriching: 'attempting_contact',
  attempting_contact: 'engaged', engaged: 'qualified',
};
const MOVABLE: Lead['status'][] = ['new', 'assigned', 'enriching', 'attempting_contact', 'engaged', 'qualified', 'sales_accepted', 'nurture'];
const TERMINAL = new Set(['converted', 'lost', 'disqualified']);

export interface LeadSelectedPanelProps {
  lead: Lead;
  /** 1-based position among ALL matching leads (page offset included). */
  position: number;
  total: number;
  slaResult: LeadSLAResult;
  isDuplicateRisk: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onOpenRecord: () => void;
  onConvert: () => void;
  onUpdateStatus: (status: Lead['status']) => void;
  onGoTo: (path: string) => void;
  /** Bumps when a lead write lands, so the activity tab refetches. */
  refreshKey: number;
}

const fmt = (s?: string | null) =>
  s ? new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-start justify-between gap-3 py-1 text-xs leading-[18px]">
    <span className="text-ink-muted">{label}</span>
    <span className="text-right text-ink">{children}</span>
  </div>
);

const LeadSelectedPanel: React.FC<LeadSelectedPanelProps> = ({
  lead, position, total, slaResult, isDuplicateRisk, hasPrev, hasNext,
  onPrev, onNext, onClose, onOpenRecord, onConvert, onUpdateStatus, onGoTo, refreshKey,
}) => {
  const [tab, setTab] = useState<Tab>('overview');
  const [moreOpen, setMoreOpen] = useState(false);
  const [history, setHistory] = useState<LeadStageHistoryRow[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const name = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';
  const next = NEXT_STAGE[lead.status];
  const isActive = !TERMINAL.has(lead.status);

  const load = useCallback(() => {
    setLoadState('loading');
    Promise.all([fetchLeadStageHistory(lead.id), fetchActivitiesFromAPI(lead.id)])
      .then(([h, a]) => { setHistory(h); setActivities(a); setLoadState('ok'); setLoadedAt(new Date().toISOString()); })
      .catch(() => setLoadState('error'));
  }, [lead.id]);

  useEffect(() => { load(); }, [load, refreshKey]);
  useEffect(() => { setMoreOpen(false); }, [lead.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const timeline = buildServerTimeline(lead, history, activities);
  const sla = slaResult.firstResponse.severity === 'breached' ? slaResult.firstResponse
    : slaResult.followUp.severity === 'breached' ? slaResult.followUp
    : slaResult.stale.severity === 'breached' ? slaResult.stale : null;

  return (
    <aside aria-label={`Selected lead: ${name}`} className="flex flex-col gap-3 rounded-card border border-line bg-surface-panel p-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-brand-600">
            Selected lead{position > 0 ? ` · ${position} of ${total}` : ''}
          </p>
          <h2 className="truncate text-xl font-semibold leading-7 text-ink">{name}</h2>
          {(lead.position || lead.company) && (
            <p className="truncate text-sm text-ink-muted">{[lead.position, lead.company].filter(Boolean).join(' · ')}</p>
          )}
        </div>
        <button type="button" onClick={onClose} aria-label="Close lead preview" className="rounded p-1 text-ink-muted hover:bg-black/5 hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" disabled={!hasPrev} onClick={onPrev} leadingIcon={<ArrowLeft className="h-3.5 w-3.5" />}>Previous</Button>
        <Button variant="secondary" size="sm" onClick={onOpenRecord}>Open full record</Button>
        <Button variant="ghost" size="sm" disabled={!hasNext} onClick={onNext} trailingIcon={<ArrowRight className="h-3.5 w-3.5" />}>Next</Button>
      </div>

      <div role="tablist" aria-label="Lead sections" className="flex gap-4 border-b border-line">
        {TABS.map(t => (
          <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 pb-1.5 text-xs font-semibold transition-colors ${
              tab === t.id ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-muted hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div role="tabpanel" className="flex flex-col gap-3">
          {sla && (
            <Alert tone="warning" title={`SLA breached${sla.ageHours != null && sla.limitHours != null ? ` by ${Math.max(0, Math.round(sla.ageHours - sla.limitHours))} hours` : ''}`}
              action={<Button variant="secondary" size="sm" onClick={onOpenRecord}>Review</Button>}>
              Computed from this lead's own dates{lead.last_contact_date ? '' : ' — no contact has been logged'}.
            </Alert>
          )}

          <Card padding="md">
            <SectionHeading level={3} title="Lead overview" description="Stored fields from the server" />
            <div className="mt-2">
              <Row label="Email">{lead.email || '—'}</Row>
              <Row label="Phone">{lead.phone || '—'}</Row>
              <Row label="Source">{lead.source || '—'}</Row>
              <Row label="Owner">{lead.owner_name || 'Unassigned'}</Row>
              <Row label="Stored score">{lead.score ?? 0} · stored CRM value, not an AI score</Row>
              <Row label="Last contact">{lead.last_contact_date || 'No contact logged'}</Row>
              <Row label="Follow-up">{followUpStatus(lead.next_follow_up_date)?.label ?? 'None set'}</Row>
            </div>
          </Card>

          <Card padding="md" className="flex flex-col gap-2">
            <SectionHeading level={3} title="Status" description="Changes apply only after the server confirms saving." />
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{stageLabel(lead.status)}</Badge>
              {isActive && next && (
                <Button size="sm" onClick={() => onUpdateStatus(next)}>Set {stageLabel(next)}</Button>
              )}
              {isActive && (
                <div className="relative">
                  <Button variant="secondary" size="sm" onClick={() => setMoreOpen(v => !v)} aria-expanded={moreOpen}
                    trailingIcon={<ChevronDown className="h-3.5 w-3.5" />}>More statuses</Button>
                  {moreOpen && (
                    <div role="menu" className="absolute left-0 top-full z-20 mt-1 w-48 rounded-card border border-line bg-surface-panel py-1 shadow-lg">
                      {MOVABLE.filter(s => s !== lead.status).map(s => (
                        <button key={s} role="menuitem" type="button" onClick={() => { setMoreOpen(false); onUpdateStatus(s); }}
                          className="w-full px-3 py-1.5 text-left text-xs text-ink hover:bg-black/5">{stageLabel(s)}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card padding="md" className="flex flex-col gap-2">
            <SectionHeading level={3} title="Duplicate context" />
            <p className="text-xs leading-[18px] text-ink-muted">
              {isDuplicateRisk
                ? 'A possible duplicate was found among the loaded leads — open the record to review it.'
                : 'Duplicate detection across every lead in the workspace is coming soon; none is claimed here.'}
            </p>
          </Card>

          <Card padding="md" className="flex flex-col gap-2">
            <SectionHeading level={3} title="Availability" />
            <p className="text-xs leading-[18px] text-ink-muted">
              Assigning an owner, tags, enrichment and editing the record are not available in this workspace yet.
            </p>
            {isActive && (
              <div><Button variant="secondary" size="sm" onClick={onConvert}>Convert</Button></div>
            )}
          </Card>
        </div>
      )}

      {tab === 'activity' && (
        <div role="tabpanel" className="flex flex-col gap-3">
          {loadState === 'loading' && <p className="text-xs text-ink-muted" role="status">Loading activity…</p>}
          {loadState === 'error' && (
            <EmptyState tone="error" title="Activity could not load" reason="The server did not answer. Nothing here means there is nothing recorded."
              action={<Button variant="secondary" size="sm" onClick={load}>Retry</Button>} />
          )}
          {loadState === 'ok' && timeline.length === 0 && (
            <EmptyState title="Nothing recorded yet" reason="No stage changes or activities have been logged for this lead." />
          )}
          {loadState === 'ok' && timeline.length > 0 && (
            <ol className="flex flex-col gap-3" data-testid="panel-timeline">
              {timeline.map(item => (
                <li key={item.id} className="text-xs">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-ink">{item.title}</span>
                    <time className="shrink-0 text-ink-muted" dateTime={item.at}>{fmt(item.at)}</time>
                  </div>
                  {item.detail && <p className="mt-0.5 text-ink-muted">{item.detail}</p>}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {tab === 'related' && (
        <div role="tabpanel" className="flex flex-col gap-2 text-sm">
          {lead.status === 'converted' ? (
            <>
              {lead.converted_to_contact_id && <button type="button" className="text-left text-brand-600 underline" onClick={() => onGoTo(`/crm/contacts/${lead.converted_to_contact_id}`)}>Contact {lead.converted_to_contact_id}</button>}
              {lead.converted_to_company_id && <button type="button" className="text-left text-brand-600 underline" onClick={() => onGoTo(`/crm/accounts/${lead.converted_to_company_id}`)}>Account {lead.converted_to_company_id}</button>}
              {lead.converted_to_deal_id && <button type="button" className="text-left text-brand-600 underline" onClick={() => onGoTo(`/crm/deals/${lead.converted_to_deal_id}`)}>Deal {lead.converted_to_deal_id}</button>}
              {!lead.converted_to_contact_id && !lead.converted_to_company_id && !lead.converted_to_deal_id && (
                <p className="text-xs text-ink-muted">The records it was converted into have since been deleted.</p>
              )}
            </>
          ) : (
            <EmptyState title="No related records yet" reason="A lead gets a contact, account and deal when it is converted." />
          )}
        </div>
      )}

      {tab === 'files' && (
        <div role="tabpanel">
          <LeadFilesSection leadId={lead.id} />
        </div>
      )}

      <p className="pt-1 text-xs text-ink-muted">
        {loadedAt ? `Last server refresh ${fmt(loadedAt)}` : 'Not loaded yet'} · {activities.length} activit{activities.length === 1 ? 'y' : 'ies'}
      </p>
    </aside>
  );
};

export default LeadSelectedPanel;
