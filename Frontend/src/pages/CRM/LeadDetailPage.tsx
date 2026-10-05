import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Mail, Phone, CalendarDays, MoreHorizontal, ChevronDown, TrendingDown, X, Trash2,
  Check, AlertTriangle, StickyNote, Users, CheckCircle2, CircleDot, ListChecks,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Card, { SectionHeading } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import LeadScoreBreakdownPanel from '../../components/Lead/LeadScoreBreakdownPanel';
import LeadConversionWizard from '../../components/Leads/LeadConversionWizard';
import TerminalStatusModal from '../../components/Leads/TerminalStatusModal';
import OutreachComposer from '../../components/Leads/OutreachComposer';
import type { OutreachFollowUp } from '../../components/Leads/OutreachComposer';
import SalesMemoryBlock from '../../components/Leads/SalesMemoryBlock';
import MergeReviewModal from '../../components/Leads/MergeReviewModal';
import SourcePlaybookCard from '../../components/Leads/SourcePlaybookCard';
import LeadFollowUpCard from '../../components/Leads/LeadFollowUpCard';
import LeadFilesSection from '../../components/Leads/LeadFilesSection';
import { followUpStatus } from '../../utils/leadFollowUp';
import { useLeads } from '../../contexts/LeadContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLeadActions } from '../../hooks/useLeadActions';
import { usePermissions } from '../../hooks/usePermissions';
import {
  fetchLeadByIdFromAPI, fetchActivitiesFromAPI, fetchNotesFromAPI, fetchLeadStageHistory,
} from '../../utils/leadsApi';
import { useLogLeadActivity, LOGGED_LABEL } from '../../hooks/useLogLeadActivity';
import type { LeadStageHistoryRow } from '../../utils/leadsApi';
import { computeMultiFactorScore } from '../../utils/leadScoring/multiFactorScore';
import { computeConversionReadiness } from '../../utils/conversionReadiness';
import { findDuplicates } from '../../utils/leadDuplicates';
import { buildServerTimeline, stageLabel } from '../../utils/leadServerTimeline';
import type { Lead, LeadActivity, LeadNote, ActivityType } from '../../types/lead';
import type { TerminalAction } from '../../utils/leadReasons';

/**
 * LEAD DETAIL — rebuilt to Figma "Lead detail page" (61:408), phase 3,
 * 2026-10-05. Everything on screen is one of: a stored field, a row the server
 * returned, a deterministic rule shown WITH its reasons, or a labelled
 * "Coming soon". What changed beyond the look, because it was not honest:
 *
 *   - "Send email / Log call / Schedule meeting / Add note" NEVER SAVED. The
 *     composer's activity went into React state with a "Call logged" toast and
 *     was gone on reload. They now POST /leads/:id/activities (notes:
 *     /leads/:id/notes); the toast fires only on a 2xx, and a refusal keeps the
 *     composer open with the user's input and the server's message.
 *   - The timeline is server rows only (stage history + activities) — it used
 *     to mix in that React state and a localStorage audit trail. Each source
 *     loads separately; a failed source says so instead of reading as empty.
 *   - "Re-enrich Data" (a setTimeout, then "Lead data re-enriched") and "Set
 *     Reminder" ("Reminder set", nothing stored) are gone; file upload is a
 *     labelled "Coming soon". The follow-up date is no longer offered — there
 *     is no column for it, so the server dropped it.
 *   - Disqualify / lost / delete now check the write: they used to toast or
 *     navigate whatever the server said.
 *   - The bare score with a star rating and "High Potential", the canned
 *     "Contact this lead today" recommendations and the "Next steps" card are
 *     gone (Evidence-Based AI: no score or suggestion without its reasons).
 *     "Stored score" is shown as the frame shows it — the stored value, no
 *     verdict — and the rule-based breakdown keeps its factors.
 *   - Fields with NO column (mobile, department, website, location, company
 *     size, revenue, LinkedIn) always rendered "—"; they are not shown, and the
 *     card says what is not stored.
 */

const leadDisplayName = (lead: Lead) =>
  lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';

const fmtDateTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// The stage-transition endpoint is the only path for a stage change; `converted`
// is reached through conversion (the server answers 409 USE_CONVERSION), so it
// is not offered here.
const STATUS_OPTIONS = [
  'new', 'assigned', 'enriching', 'attempting_contact', 'engaged', 'qualified',
  'sales_accepted', 'nurture', 'disqualified', 'lost',
] as const;
const LIFECYCLE_ORDER: string[] = [...STATUS_OPTIONS.slice(0, 7), 'nurture', 'disqualified', 'converted', 'lost'];
const TERMINAL = new Set(['converted', 'lost', 'disqualified']);

type Source<T> = { status: 'loading' | 'ok' | 'error'; rows: T[]; error?: string };
const loadingSource = <T,>(): Source<T> => ({ status: 'loading', rows: [] });

/** A label / value row in the information cards (Figma: 12px muted label, 14px value). */
const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-[140px_1fr] gap-3 py-2">
    <dt className="text-xs leading-5 text-ink-muted">{label}</dt>
    <dd className="text-sm leading-5 text-ink break-words">{children}</dd>
  </div>
);

const TIMELINE_ICON: Record<string, React.ReactNode> = {
  created: <CircleDot className="h-3.5 w-3.5" />,
  stage: <Check className="h-3.5 w-3.5" />,
  call: <Phone className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  meeting: <CalendarDays className="h-3.5 w-3.5" />,
  note: <StickyNote className="h-3.5 w-3.5" />,
};

const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateLead, deleteLead, leads: allLeads, lastWriteErrorRef } = useLeads();
  const actions = useLeadActions(updateLead);
  const { showToast } = useToast();
  const { user } = useAuth();
  const { can } = usePermissions();

  const [lead, setLead] = useState<Lead | null>(null);
  const [leadState, setLeadState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [leadError, setLeadError] = useState<string | null>(null);
  const [history, setHistory] = useState<Source<LeadStageHistoryRow>>(loadingSource);
  const [activities, setActivities] = useState<Source<LeadActivity>>(loadingSource);
  const [notes, setNotes] = useState<Source<LeadNote>>(loadingSource);

  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [terminalModalAction, setTerminalModalAction] = useState<TerminalAction | null>(null);
  const [composerChannel, setComposerChannel] = useState<ActivityType | null>(null);
  const logActivity = useLogLeadActivity();

  // ── Loading ────────────────────────────────────────────────────────────────
  const loadLead = useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchLeadByIdFromAPI(id);
      if (data) { setLead(data); setLeadState('ok'); } else { setLeadState('missing'); }
    } catch (e) {
      setLeadError(e instanceof Error ? e.message : 'The lead could not be loaded.');
      setLeadState('error');
    }
  }, [id]);

  const loadSource = useCallback(<T,>(fetcher: (leadId: string) => Promise<T[]>, set: (s: Source<T>) => void) => {
    if (!id) return;
    fetcher(id)
      .then(rows => set({ status: 'ok', rows }))
      .catch(e => set({ status: 'error', rows: [], error: e instanceof Error ? e.message : 'Could not load.' }));
  }, [id]);

  const loadRelated = useCallback(() => {
    loadSource(fetchLeadStageHistory, setHistory);
    loadSource(fetchActivitiesFromAPI, setActivities);
    loadSource(fetchNotesFromAPI, setNotes);
  }, [loadSource]);

  useEffect(() => {
    setLeadState('loading');
    void loadLead();
    loadRelated();
  }, [loadLead, loadRelated]);

  // ── Writes — every success message waits for the server ───────────────────
  const applyStatusChange = async (newStatus: string) => {
    if (!lead) return;
    setShowStatusMenu(false);
    setPendingStatus(null);
    const accepted = await actions.changeStatus(lead, newStatus as Lead['status']);
    if (!accepted) {
      showToast(lastWriteErrorRef.current ?? 'Status change was refused — nothing was saved.', 'error');
      return;
    }
    showToast(`Lifecycle updated to ${stageLabel(newStatus)}`, 'success');
    void loadLead();
    loadSource(fetchLeadStageHistory, setHistory);
  };

  const handleStatusChange = (newStatus: string) => {
    if (!lead) return;
    setShowStatusMenu(false);
    if (newStatus === 'disqualified' || newStatus === 'lost') {
      setTerminalModalAction(newStatus as TerminalAction);
      return;
    }
    const cur = LIFECYCLE_ORDER.indexOf(lead.status);
    const next = LIFECYCLE_ORDER.indexOf(newStatus);
    const backward = cur > -1 && next > -1 && next < cur;
    const skips = ['new', 'assigned', 'enriching', 'attempting_contact'].includes(lead.status) && newStatus === 'qualified';
    if (backward || skips) { setPendingStatus(newStatus); return; }
    void applyStatusChange(newStatus);
  };

  const handleTerminalConfirm = async (reason: string, notesText: string) => {
    if (!lead || !terminalModalAction) return;
    const status = terminalModalAction;
    const ok = status === 'disqualified'
      ? await actions.disqualify(lead, reason, notesText || undefined)
      : await actions.markLost(lead, reason, notesText || undefined);
    if (!ok) {
      showToast(lastWriteErrorRef.current ?? `Could not mark this lead ${status} — nothing was saved.`, 'error');
      return;
    }
    setTerminalModalAction(null);
    showToast(`Lead marked ${status}`, 'success');
    void loadLead();
    loadSource(fetchLeadStageHistory, setHistory);
  };

  const handleDelete = async () => {
    if (!lead) return;
    const ok = await deleteLead(lead.id);
    setShowDeleteModal(false);
    if (!ok) {
      showToast(lastWriteErrorRef.current ?? 'The lead was not deleted.', 'error');
      return;
    }
    showToast('Lead deleted', 'success');
    navigate('/crm/leads');
  };

  const handleComposerSubmit = async (activity: LeadActivity, followUp?: OutreachFollowUp) => {
    if (!lead) return;
    const fu = followUp?.date
      ? { date: followUp.date, type: followUp.type, title: `Follow up (${followUp.type}) with ${leadDisplayName(lead)}`, assignedTo: user?.name }
      : undefined;
    if (!(await logActivity.save(lead.id, activity, fu))) return;   // composer stays open with the error
    const fuError = logActivity.followUpErrorRef.current;
    if (fu) void loadLead();
    if (activity.type === 'note') {
      loadSource(fetchNotesFromAPI, setNotes);
    } else {
      loadSource(fetchActivitiesFromAPI, setActivities);
      // A completed call / email / meeting sets last_contact on the server.
      void loadLead();
    }
    setComposerChannel(null);
    if (fuError) showToast(`${LOGGED_LABEL[activity.type] ?? 'Activity saved'} — but the follow-up was not set: ${fuError}`, 'error');
    else showToast(`${LOGGED_LABEL[activity.type] ?? 'Activity saved'}${fu ? ' · follow-up set' : ''}`, 'success');
  };

  const openComposer = (channel: ActivityType) => { logActivity.reset(); setComposerChannel(channel); };

  // ── Loading / missing / failed ─────────────────────────────────────────────
  if (leadState === 'loading') {
    return <div className="py-16 text-center text-sm text-ink-muted" role="status">Loading lead…</div>;
  }
  if (leadState === 'error') {
    return (
      <div className="mx-auto max-w-xl py-12">
        <EmptyState tone="error" title="This lead could not load" reason={leadError ?? 'The server did not answer.'}
          action={<Button variant="secondary" onClick={() => { setLeadState('loading'); void loadLead(); loadRelated(); }}>Retry</Button>} />
      </div>
    );
  }
  if (leadState === 'missing' || !lead) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <EmptyState title="Lead not found" reason="It does not exist in this workspace, or it was deleted."
          action={<Button onClick={() => navigate('/crm/leads')}>Back to Leads</Button>} />
      </div>
    );
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const displayName = leadDisplayName(lead);
  const mfs = computeMultiFactorScore(lead);
  const readiness = computeConversionReadiness(lead, mfs);
  const isActive = !TERMINAL.has(lead.status);
  const isConvertible = ['ready_for_deal', 'ready_for_account_contact', 'ready_for_contact'].includes(readiness.state);
  // Positive matches only, among the leads loaded in this browser — a match is
  // real; the ABSENCE of one proves nothing until duplicate detection runs
  // over every lead on the server (step 5 slice B).
  const duplicateCandidates = findDuplicates(lead, allLeads ?? []);
  const timeline = buildServerTimeline(lead, history.rows, activities.rows);
  const failedSources = [
    history.status === 'error' ? 'Stage history' : null,
    activities.status === 'error' ? 'Activities' : null,
  ].filter(Boolean) as string[];
  const timelineLoading = history.status === 'loading' || activities.status === 'loading';
  const location = [lead.city, lead.country].filter(Boolean).join(', ');
  const contactLine = [lead.email, lead.phone, location].filter(Boolean).join(' · ');
  // A value with no currency is shown as such — never with an assumed symbol.
  const valueText = (() => {
    if (lead.estimated_value == null) return 'Not recorded';
    if (!lead.currency) return `${lead.estimated_value.toLocaleString('en-IN')} · currency not recorded`;
    // Postgres accepts any three letters; Intl throws on a code it does not
    // know, which would take the whole page down. Fall back to the plain code.
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: lead.currency, maximumFractionDigits: 0 }).format(lead.estimated_value);
    } catch {
      return `${lead.currency} ${lead.estimated_value.toLocaleString('en-IN')}`;
    }
  })();
  const notRecorded = <span className="text-ink-muted">Not recorded</span>;

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-4 pt-6 pb-8 lg:px-1">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
        <Link to="/crm/leads" className="font-semibold text-brand-600 hover:text-brand-700">Leads</Link>
        <span className="text-ink-muted" aria-hidden="true">/</span>
        <span className="text-ink-muted" aria-current="page">{displayName}</span>
      </nav>

      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[32px] font-bold leading-10 text-ink">{displayName}</h1>
            <Badge tone="brand" data-testid="lead-status">{stageLabel(lead.status)}</Badge>
            <Badge tone="neutral" title="The score stored on this lead record. See Score breakdown for the factors.">
              Stored score {lead.score ?? 0}
            </Badge>
          </div>
          {(lead.position || lead.company) && (
            <p className="text-lg font-semibold leading-7 text-ink-heading">
              {[lead.position, lead.company].filter(Boolean).join(' · ')}
            </p>
          )}
          {contactLine && <p className="text-sm leading-[22px] text-ink-muted">{contactLine}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isActive ? (
            <div className="relative">
              <Button variant="secondary" onClick={() => setShowStatusMenu(v => !v)} aria-expanded={showStatusMenu}
                trailingIcon={<ChevronDown className="h-3.5 w-3.5" />}>
                Lifecycle: {stageLabel(lead.status)}
              </Button>
              {showStatusMenu && (
                <ul role="menu" className="absolute right-0 z-30 mt-1 max-h-72 w-56 overflow-y-auto rounded-card border border-line bg-surface-panel py-1 shadow-lg">
                  {STATUS_OPTIONS.filter(s => s !== lead.status).map(s => (
                    <li key={s}>
                      <button role="menuitem" onClick={() => handleStatusChange(s)}
                        className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-black/5">
                        {stageLabel(s)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
          {/* The lead editor (Group A item 1). Until it existed this button led to a
              blank page, then was disabled in slice 3B-2. */}
          <Button variant="secondary" onClick={() => navigate(`/crm/leads/${lead.id}/edit`)}>Edit</Button>
          <div className="relative">
            <Button variant="secondary" iconOnly aria-label="More options" leadingIcon={<MoreHorizontal className="h-4 w-4" />}
              onClick={() => setShowOverflowMenu(v => !v)} />
            {showOverflowMenu && (
              <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-card border border-line bg-surface-panel py-1 shadow-lg"
                onMouseLeave={() => setShowOverflowMenu(false)}>
                {isActive && (
                  <>
                    <button onClick={() => { setTerminalModalAction('lost'); setShowOverflowMenu(false); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink hover:bg-black/5">
                      <TrendingDown className="h-4 w-4 text-ink-muted" /> Mark as lost
                    </button>
                    <button onClick={() => { setTerminalModalAction('disqualified'); setShowOverflowMenu(false); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-ink hover:bg-black/5">
                      <X className="h-4 w-4 text-ink-muted" /> Mark as disqualified
                    </button>
                    {can('leads.delete') && <div className="my-1 border-t border-line" />}
                  </>
                )}
                {/* Hidden for roles that cannot delete — a courtesy; the server's
                    403 is the control, and a refusal is reported if it happens. */}
                {can('leads.delete') && (
                  <button onClick={() => { setShowDeleteModal(true); setShowOverflowMenu(false); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-danger-700 hover:bg-danger-50">
                    <Trash2 className="h-4 w-4" /> Delete lead
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick actions */}
      {isActive && (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => openComposer('email')} leadingIcon={<Mail className="h-3.5 w-3.5" />}>Log email</Button>
          <Button variant="secondary" onClick={() => openComposer('call')} leadingIcon={<Phone className="h-3.5 w-3.5" />}>Log call</Button>
          <Button variant="secondary" onClick={() => openComposer('meeting')} leadingIcon={<CalendarDays className="h-3.5 w-3.5" />}>Log meeting</Button>
          <Button variant="secondary" onClick={() => setShowConvertModal(true)} leadingIcon={<Users className="h-3.5 w-3.5" />}>Convert</Button>
        </div>
      )}

      {/* What this lead became (migration 059, server-written) */}
      {lead.status === 'converted' && (
        <Alert tone="success" title={`Converted${lead.converted_at ? ` on ${fmtDate(lead.converted_at)}` : ''}`}>
          <span data-testid="converted-panel" className="flex flex-wrap gap-4">
            {lead.converted_to_contact_id && <Link className="underline" to={`/crm/contacts/${lead.converted_to_contact_id}`}>Contact {lead.converted_to_contact_id}</Link>}
            {lead.converted_to_company_id && <Link className="underline" to={`/crm/accounts/${lead.converted_to_company_id}`}>Account {lead.converted_to_company_id}</Link>}
            {lead.converted_to_deal_id && <Link className="underline" to={`/crm/deals/${lead.converted_to_deal_id}`}>Deal {lead.converted_to_deal_id}</Link>}
            {!lead.converted_to_contact_id && !lead.converted_to_company_id && !lead.converted_to_deal_id && (
              <span>The records it was converted into have since been deleted.</span>
            )}
          </span>
        </Alert>
      )}

      {/* Possible duplicates */}
      {duplicateCandidates.length > 0 && (
        <Alert tone="warning"
          title={duplicateCandidates.length === 1 ? 'Possible duplicate found' : `${duplicateCandidates.length} possible duplicates found`}
          action={<Button variant="secondary" onClick={() => setShowMergeModal(true)}>Review</Button>}>
          {duplicateCandidates.slice(0, 3).map(c => {
            const other = (allLeads ?? []).find(l => l.id === c.leadId);
            if (!other) return null;
            return <p key={c.leadId}><strong>{leadDisplayName(other)}</strong>{other.company ? ` · ${other.company}` : ''} — {c.signals[0]?.reason}</p>;
          })}
          <p>Checked against the leads loaded in this browser, not every lead in the workspace.</p>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── Lead record ── */}
        <div className="flex min-w-0 flex-col gap-4">
          {isActive && (
            <Card padding="md" className="flex flex-col gap-3" data-testid="readiness-card">
              <SectionHeading title="Conversion readiness"
                description="Based on this lead's stored fields — a rule, not an AI score." />
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <ul className="flex flex-col gap-1.5">
                  {readiness.checklist.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-ink">
                      {item.met
                        ? <Check className="h-4 w-4 text-success-700" aria-label="met" />
                        : <AlertTriangle className="h-4 w-4 text-warning-700" aria-label="not met" />}
                      {item.label}
                    </li>
                  ))}
                </ul>
                <div className="flex max-w-[280px] flex-col items-start gap-2">
                  <Badge tone={isConvertible ? 'success' : 'warning'}>{readiness.label}</Badge>
                  {readiness.reasons.map((r, i) => <p key={i} className="text-xs leading-[18px] text-ink-muted">{r}</p>)}
                  {isConvertible && <Button onClick={() => setShowConvertModal(true)}>Convert lead</Button>}
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card padding="md">
              <SectionHeading title="Basic information" />
              <dl className="mt-2">
                <InfoRow label="Lead owner">{lead.owner_name || 'Unassigned'}</InfoRow>
                <InfoRow label="Lifecycle status">{stageLabel(lead.status)}</InfoRow>
                <InfoRow label="Source">{[lead.source, lead.source_detail].filter(Boolean).join(' · ') || '—'}</InfoRow>
                <InfoRow label="Priority">{lead.priority ? stageLabel(lead.priority) : notRecorded}</InfoRow>
                <InfoRow label="Email">{lead.email || '—'}</InfoRow>
                <InfoRow label="Phone">{lead.phone || notRecorded}</InfoRow>
                <InfoRow label="Mobile">{lead.mobile || notRecorded}</InfoRow>
                <InfoRow label="Follow-up">
                  {(() => { const f = followUpStatus(lead.next_follow_up_date); return f ? <Badge tone={f.tone}>{f.label}</Badge> : notRecorded; })()}
                </InfoRow>
                <InfoRow label="Last contacted">{lead.last_contact_date ? fmtDate(lead.last_contact_date) : 'No contact logged'}</InfoRow>
                <InfoRow label="Created">{fmtDateTime(lead.created_at)}</InfoRow>
                <InfoRow label="Last updated">{fmtDateTime(lead.updated_at)}</InfoRow>
              </dl>
              {lead.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {lead.tags.map(t => <Badge key={t} tone="brand">{t}</Badge>)}
                </div>
              )}
            </Card>
            <Card padding="md">
              <SectionHeading title="Company information" />
              <dl className="mt-2">
                <InfoRow label="Company">{lead.company || '—'}</InfoRow>
                <InfoRow label="Industry">{lead.industry || notRecorded}</InfoRow>
                <InfoRow label="Title">{lead.position || notRecorded}</InfoRow>
                <InfoRow label="Employees">{lead.company_size ? `${lead.company_size} employees` : notRecorded}</InfoRow>
                <InfoRow label="Website">
                  {lead.website
                    ? <a className="text-brand-600 hover:underline" href={/^https?:\/\//i.test(lead.website) ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer">{lead.website}</a>
                    : notRecorded}
                </InfoRow>
                <InfoRow label="Location">{location || notRecorded}</InfoRow>
                <InfoRow label="Est. value">{valueText}</InfoRow>
              </dl>
              <p className="mt-2 text-xs leading-[18px] text-ink-muted">Region and revenue are not stored for leads.</p>
            </Card>
          </div>

          <Card padding="md" className="flex flex-col gap-3">
            <SectionHeading title="Activity timeline" description="Server-recorded stage changes and logged activities." />
            {timelineLoading && <p className="text-sm text-ink-muted" role="status">Loading timeline…</p>}
            {!timelineLoading && timeline.length > 0 && (
              <ol className="flex flex-col gap-4" data-testid="lead-timeline">
                {timeline.map(item => (
                  <li key={item.id} className="flex gap-3">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      item.override ? 'bg-warning-100 text-warning-700' : 'bg-brand-50 text-brand-600'}`} aria-hidden="true">
                      {TIMELINE_ICON[item.activityType ?? item.kind] ?? <ListChecks className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">{item.title}</p>
                        <time className="text-xs text-ink-muted" dateTime={item.at}>{fmtDateTime(item.at)}</time>
                      </div>
                      {item.detail && <p className="mt-0.5 text-xs leading-[18px] text-ink-muted">{item.detail}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {!timelineLoading && timeline.length === 0 && failedSources.length === 0 && (
              <EmptyState title="Nothing recorded yet" reason="No stage changes or activities have been logged for this lead."
                action={isActive ? <Button variant="secondary" onClick={() => openComposer('call')}>Log a call</Button> : undefined} />
            )}
            {failedSources.length > 0 && (
              <Alert tone="danger" title={`${failedSources.join(' and ')} could not be loaded`}
                action={<Button variant="secondary" onClick={loadRelated}>Retry</Button>}>
                Anything shown above is real; this is not an empty timeline.
              </Alert>
            )}
          </Card>

          <Card padding="md" className="flex flex-col gap-3">
            <SectionHeading title="Notes & files"
              description={notes.status === 'ok' ? `${notes.rows.length} note${notes.rows.length === 1 ? '' : 's'}` : undefined}
              actions={isActive ? <Button variant="secondary" onClick={() => openComposer('note')}>Add note</Button> : undefined} />
            {notes.status === 'loading' && <p className="text-sm text-ink-muted" role="status">Loading notes…</p>}
            {notes.status === 'error' && (
              <Alert tone="danger" title="Notes could not be loaded"
                action={<Button variant="secondary" onClick={() => loadSource(fetchNotesFromAPI, setNotes)}>Retry</Button>}>
                {notes.error}
              </Alert>
            )}
            {notes.status === 'ok' && notes.rows.length > 0 && (
              <ul className="flex flex-col gap-3" data-testid="lead-notes">
                {notes.rows.map(n => (
                  <li key={n.id} className="text-sm text-ink">
                    <p className="whitespace-pre-wrap">{n.content}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{fmtDateTime(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
            {notes.status === 'ok' && notes.rows.length === 0 && (
              <p className="text-sm text-ink-muted">No notes yet.</p>
            )}
            {/* Real since Group B item 12: files are Documents linked to this lead. */}
            <div className="border-t border-line pt-3">
              <LeadFilesSection leadId={lead.id} ownerName={user?.name} onUploaded={name => showToast(`${name} uploaded`, 'success')} />
            </div>
          </Card>
        </div>

        {/* ── Intelligence rail ── */}
        <aside className="flex min-w-0 flex-col gap-4" aria-label="Lead guidance">
          {isActive && (
            <LeadFollowUpCard
              key={`${lead.next_follow_up_task_id ?? 'none'}-${lead.next_follow_up_date ?? ''}`}
              lead={lead}
              assignedTo={user?.name}
              onChanged={msg => { showToast(msg, 'success'); void loadLead(); }}
            />
          )}
          <SourcePlaybookCard lead={lead} />
          <SalesMemoryBlock lead={lead} recentActivities={activities.rows.slice(0, 5)} />
          <Card padding="md">
            <SectionHeading title="Score breakdown" description="Rule-based factors from this lead's stored fields." />
            <div className="mt-3"><LeadScoreBreakdownPanel multiFactorScore={mfs} lead={lead} /></div>
          </Card>
          <Card padding="md" className="flex flex-col gap-2" data-coming-soon="true">
            <div className="flex items-start justify-between gap-2">
              <SectionHeading title="Recommended action" />
              <Badge tone="neutral">Coming soon</Badge>
            </div>
            <p className="text-xs leading-[18px] text-ink-muted">
              Suggested next actions, each with the reasons behind it, arrive with the AI phase. Nothing is recommended until those reasons can be shown.
            </p>
          </Card>
          <Card padding="md" className="flex flex-col gap-2">
            <SectionHeading title="Lifecycle workflow" />
            <p className="text-xs leading-[18px] text-ink-muted">
              New → Assigned → Attempting contact → Engaged → Qualified → Sales accepted → Converted; or Nurture, Disqualified, Lost.
            </p>
            <p className="text-sm leading-5 text-ink">
              Qualifying needs an email or phone, a company and a recorded contact; a manager can override with a reason. Disqualified and lost need a reason. Conversion is only from Qualified or Sales accepted.
            </p>
            {lead.last_contact_date
              ? <p className="flex items-center gap-1.5 text-xs text-success-700"><CheckCircle2 className="h-3.5 w-3.5" /> Contact recorded {fmtDate(lead.last_contact_date)}</p>
              : <p className="text-xs text-ink-muted">No contact recorded yet — logging a completed call, email or meeting records one.</p>}
          </Card>
        </aside>
      </div>

      {/* ── Modals ── */}
      <ConfirmationModal
        isOpen={pendingStatus !== null}
        title="Confirm lifecycle change"
        message={pendingStatus
          ? LIFECYCLE_ORDER.indexOf(pendingStatus) < LIFECYCLE_ORDER.indexOf(lead.status)
            ? `Move back to "${stageLabel(pendingStatus)}"? Confirm this is intentional.`
            : `Skip ahead to "${stageLabel(pendingStatus)}"? Confirm this is intentional.`
          : ''}
        confirmLabel="Proceed"
        type="warning"
        onConfirm={() => pendingStatus && void applyStatusChange(pendingStatus)}
        onCancel={() => setPendingStatus(null)}
      />
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete lead"
        message={`Delete ${displayName}? This cannot be undone.`}
        confirmLabel="Delete"
        type="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setShowDeleteModal(false)}
      />
      {showConvertModal && (
        <LeadConversionWizard
          lead={lead}
          readiness={readiness}
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          onConverted={(res) => {
            // Fires only after the SERVER created/linked the records.
            actions.convert(lead, res.deal ? 'both' : 'contact', res.deal?.id ?? res.contact.id);
            setLead(res.lead);
            loadSource(fetchLeadStageHistory, setHistory);
          }}
        />
      )}
      {composerChannel && (
        <OutreachComposer
          lead={lead}
          initialChannel={composerChannel}
          submitting={logActivity.saving}
          error={logActivity.error}
          followUpAvailable
          onSubmit={(activity, followUp) => void handleComposerSubmit(activity, followUp)}
          onClose={() => { setComposerChannel(null); logActivity.reset(); }}
        />
      )}
      {showMergeModal && duplicateCandidates.length > 0 && (
        <MergeReviewModal
          lead={lead}
          candidateId={duplicateCandidates[0].leadId}
          allLeads={allLeads ?? []}
          candidates={duplicateCandidates}
          isOpen
          onClose={() => setShowMergeModal(false)}
        />
      )}
      <TerminalStatusModal
        open={terminalModalAction !== null}
        action={terminalModalAction ?? 'lost'}
        count={1}
        leadName={displayName}
        onConfirm={handleTerminalConfirm}
        onClose={() => setTerminalModalAction(null)}
      />
    </div>
  );
};

export default LeadDetailPage;
