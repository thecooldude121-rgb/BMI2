import React, { useState, useEffect, useCallback } from 'react';
import {
  X, ExternalLink, ChevronUp, ChevronDown,
  Mail, Phone, MapPin, Building2, Calendar, Clock,
  User, CheckCircle, XCircle, Circle, MessageSquare,
  Zap, Activity, TrendingUp, Briefcase, Link2,
} from 'lucide-react';
import type { Lead } from '../../types/lead';
import { buildTimeline, buildLastTouchSummary } from '../../utils/leadTimeline';
import ActivityTimeline from './ActivityTimeline';
import type { LeadSLAResult } from '../../utils/leadSla';
import type { ModalId } from '../../hooks/useLeadsPageState';
import type { ActionId, ActionVariant } from '../../utils/leadActions';
import { getSecondaryActions } from '../../utils/leadActions';
import { computeMultiFactorScore } from '../../utils/leadScoring/multiFactorScore';
import { computeNBA } from '../../utils/leadNBA/engine';
import type { NBAPriority } from '../../utils/leadNBA/engine';
import { computeConversionReadiness } from '../../utils/conversionReadiness';
import { explainScore } from '../../utils/leadScoring/scoreExplainer';
import SLABadge from './SLABadge';
import ConversionReadinessBadge from './ConversionReadinessBadge';
import ScoreExplainabilityDrawer from './ScoreExplainabilityDrawer';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'activity' | 'qualification' | 'notes' | 'actions';

export interface LeadQuickDrawerProps {
  lead:            Lead;
  slaResult:       LeadSLAResult;
  hasPrev:         boolean;
  hasNext:         boolean;
  isDuplicateRisk: boolean;
  isOverdue:       boolean;
  isUntouched:     boolean;
  onClose:         () => void;
  onGoTo:          (path: string) => void;
  onPrevLead:      () => void;
  onNextLead:      () => void;
  onOpenModal:     (modal: ModalId, lead: Lead) => void;
  onUpdateStatus:  (id: string, status: Lead['status']) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CLS: Record<Lead['status'], string> = {
  new:               'bg-blue-100 text-blue-700',
  assigned:          'bg-indigo-100 text-indigo-700',
  enriching:         'bg-cyan-100 text-cyan-700',
  attempting_contact:'bg-orange-100 text-orange-700',
  engaged:           'bg-emerald-100 text-emerald-700',
  qualified:         'bg-green-100 text-green-700',
  sales_accepted:    'bg-teal-100 text-teal-700',
  nurture:           'bg-purple-100 text-purple-700',
  disqualified:      'bg-gray-100 text-gray-500',
  converted:         'bg-teal-100 text-teal-600',
  lost:              'bg-red-100 text-red-500',
};

const STATUS_LABEL: Record<Lead['status'], string> = {
  new:               'New',
  assigned:          'Assigned',
  enriching:         'Enriching',
  attempting_contact:'Attempting',
  engaged:           'Engaged',
  qualified:         'Qualified',
  sales_accepted:    'Sales Accepted',
  nurture:           'Nurture',
  disqualified:      'Disqualified',
  converted:         'Converted',
  lost:              'Lost',
};

const NBA_PRIORITY_CLS: Record<NBAPriority, { card: string; badge: string; label: string }> = {
  urgent: { card: 'bg-red-50 border-red-200',    badge: 'bg-red-100 text-red-700',    label: 'Urgent'   },
  high:   { card: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700',label: 'High'     },
  medium: { card: 'bg-blue-50 border-blue-200',   badge: 'bg-blue-100 text-blue-700',  label: 'Medium'   },
  low:    { card: 'bg-gray-50 border-gray-200',   badge: 'bg-gray-100 text-gray-600',  label: 'Low'      },
};

const VARIANT_BTN: Record<ActionVariant, string> = {
  urgent:  'bg-red-600 text-white hover:bg-red-700',
  warn:    'border border-amber-400 text-amber-700 hover:bg-amber-50',
  ready:   'bg-green-600 text-white hover:bg-green-700',
  active:  'border border-blue-400 text-blue-700 hover:bg-blue-50',
  teal:    'border border-teal-400 text-teal-700 hover:bg-teal-50',
  default: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  muted:   'border border-gray-200 text-gray-500 hover:bg-gray-50',
  danger:  'border border-red-200 text-red-600 hover:bg-red-50',
};

const CONTACT_ACTION_IDS = new Set<ActionId>([
  'call_now','contact_now','follow_up_now','contact','follow_up',
  'check_in','revive','send_first_outreach','book_discovery',
]);

const CONVERT_ACTION_IDS = new Set<ActionId>([
  'convert_to_deal','convert_to_contact','complete_qualification','create_deal',
]);

function fmtDate(d?: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysAgo(d?: string): string {
  if (!d) return 'never';
  const diff = Math.round((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (diff === 0) return 'today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
}

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-400';
}

// ── Score mini-bar ────────────────────────────────────────────────────────────

function ScoreBar({ label, score, barCls, textCls }: {
  label: string; score: number; barCls: string; textCls: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className={`font-semibold ${textCls}`}>{score}</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${barCls} rounded-full`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────

function Field({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-[11px] text-gray-400 uppercase tracking-wide w-20 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-gray-800 break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {value || <span className="text-gray-300">—</span>}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LeadQuickDrawer({
  lead,
  slaResult,
  hasPrev, hasNext,
  isDuplicateRisk, isOverdue, isUntouched,
  onClose, onGoTo, onPrevLead, onNextLead,
  onOpenModal, onUpdateStatus,
}: LeadQuickDrawerProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const [visible, setVisible] = useState(false);
  const [showScoreDrawer, setShowScoreDrawer] = useState(false);

  // Slide in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Reset tab when lead changes
  useEffect(() => { setTab('overview'); }, [lead.id]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as Element).tagName;
      const editable = ['INPUT','TEXTAREA','SELECT'].includes(tag);
      if (e.key === 'Escape') { onClose(); return; }
      if (editable) return;
      if (e.key === 'ArrowUp')   { e.preventDefault(); onPrevLead(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); onNextLead(); }
      if (e.key === 'Enter')     { onGoTo(`/crm/leads/${lead.id}`); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lead.id, onClose, onPrevLead, onNextLead, onGoTo]);

  // Pre-compute derived data once per render
  const mfs         = computeMultiFactorScore(lead);
  const nbaResult   = computeNBA(lead, { isDuplicateRisk, isOverdue, isUntouched, slaResult, mfs });
  const readiness   = computeConversionReadiness(lead, mfs);
  const explanation = explainScore(lead, mfs);
  const score       = lead.ai_score ?? lead.score ?? 0;
  const displayName = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';

  // Additional workflow actions (excluding the top NBA)
  const workflowActions = getSecondaryActions(lead, { isDuplicateRisk, isOverdue, isUntouched })
    .find(g => g.id === 'workflow')?.items.slice(0, 2) ?? [];

  // Action dispatcher
  const handleAction = useCallback((actionId: ActionId) => {
    if (CONTACT_ACTION_IDS.has(actionId)) { onOpenModal('contactLead', lead); return; }
    if (CONVERT_ACTION_IDS.has(actionId)) { onOpenModal('convertLead', lead); return; }
    switch (actionId) {
      case 'view_deal':
        if (lead.converted_to_deal_id) onGoTo(`/crm/deals/${lead.converted_to_deal_id}`);
        break;
      case 'mark_disqualified':
        onOpenModal('terminalDisqualify', lead);
        break;
      case 'archive':
        onOpenModal('terminalLost', lead);
        break;
      case 'mark_nurture':
        onUpdateStatus(lead.id, 'nurture');
        break;
      case 'enrich':
      case 'reenrich':
        onOpenModal('enrichLead', lead);
        break;
      case 'merge_duplicate':
        onOpenModal('mergeDuplicate', lead);
        break;
      case 'view_details':
        onGoTo(`/crm/leads/${lead.id}`);
        break;
    }
  }, [lead, onOpenModal, onGoTo, onUpdateStatus]);

  // ── Tab definitions ─────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',      label: 'Overview'  },
    { id: 'activity',      label: 'Activity'  },
    { id: 'qualification', label: 'Qualify'   },
    { id: 'notes',         label: 'Notes'     },
    { id: 'actions',       label: 'Actions'   },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-250 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label={`Lead details: ${displayName}`}
      >

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
          {/* Prev / Next */}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              onClick={onPrevLead}
              disabled={!hasPrev}
              title="Previous lead (↑)"
              className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={onNextLead}
              disabled={!hasNext}
              title="Next lead (↓)"
              className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">
              {[lead.company, lead.position].filter(Boolean).join(' · ') || 'No company'}
            </p>
          </div>

          {/* Status + Score */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_CLS[lead.status]}`}>
            {STATUS_LABEL[lead.status]}
          </span>
          <span className={`text-sm font-bold shrink-0 ${scoreColor(score)}`}>{score}</span>

          {/* SLA badge */}
          <div className="shrink-0"><SLABadge result={slaResult} /></div>

          {/* Open full page */}
          <button
            onClick={() => onGoTo(`/crm/leads/${lead.id}`)}
            title="Open full details (Enter)"
            className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0"
          >
            <ExternalLink size={15} />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex border-b border-gray-200 shrink-0 bg-white">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px',
                tab === t.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-200',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="p-4 space-y-4">

              {/* Score strip */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">Score</div>
                </div>
                <div className="flex-1 space-y-1.5">
                  <ScoreBar label="Fit"        score={mfs.fitScore.score}        barCls="bg-blue-500"   textCls="text-blue-600"   />
                  <ScoreBar label="Intent"     score={mfs.intentScore.score}     barCls="bg-purple-500" textCls="text-purple-600" />
                  <ScoreBar label="Engagement" score={mfs.engagementScore.score} barCls="bg-green-500"  textCls="text-green-600"  />
                </div>
                <ConversionReadinessBadge state={readiness.state} leadStatus={lead.status} />
              </div>

              {/* Contact info */}
              <section>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <User size={10} /> Contact
                </h4>
                <div className="space-y-0">
                  {lead.email && (
                    <div className="flex items-center gap-2 py-1.5 border-b border-gray-50">
                      <Mail size={12} className="text-gray-400 shrink-0" />
                      <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline truncate">{lead.email}</a>
                    </div>
                  )}
                  {(lead.phone || lead.mobile) && (
                    <div className="flex items-center gap-2 py-1.5 border-b border-gray-50">
                      <Phone size={12} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-800">{lead.phone || lead.mobile}</span>
                    </div>
                  )}
                  {lead.linkedin_url && (
                    <div className="flex items-center gap-2 py-1.5 border-b border-gray-50">
                      <Link2 size={12} className="text-gray-400 shrink-0" />
                      <a
                        href={lead.linkedin_url.startsWith('http') ? lead.linkedin_url : `https://${lead.linkedin_url}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        LinkedIn
                      </a>
                    </div>
                  )}
                  {!lead.email && !lead.phone && !lead.mobile && (
                    <p className="text-xs text-gray-400 py-1.5">No contact details</p>
                  )}
                </div>
              </section>

              {/* Company */}
              {(lead.company || lead.industry || lead.company_size) && (
                <section>
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Building2 size={10} /> Company
                  </h4>
                  <div className="space-y-0">
                    <Field label="Company" value={lead.company} />
                    <Field label="Title"   value={lead.position} />
                    <Field label="Dept"    value={lead.department} />
                    <Field label="Industry" value={lead.industry} />
                    <Field label="Size"    value={lead.company_size} />
                    {(lead.city || lead.country) && (
                      <div className="flex items-center gap-2 py-1.5 border-b border-gray-50">
                        <MapPin size={11} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-800">
                          {[lead.city, lead.state, lead.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Related entities */}
              {(lead.converted_to_deal_id || lead.contact_id || lead.account_id) && (
                <section>
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Link2 size={10} /> Related
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {lead.converted_to_deal_id && (
                      <button
                        onClick={() => onGoTo(`/crm/deals/${lead.converted_to_deal_id}`)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors"
                      >
                        <Briefcase size={11} /> View Deal
                      </button>
                    )}
                    {lead.contact_id && (
                      <button
                        onClick={() => onGoTo(`/crm/contacts/${lead.contact_id}`)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <User size={11} /> View Contact
                      </button>
                    )}
                    {lead.account_id && (
                      <button
                        onClick={() => onGoTo(`/crm/accounts/${lead.account_id}`)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Building2 size={11} /> View Account
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Source */}
              {lead.source && (
                <section>
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Source</h4>
                  <p className="text-sm text-gray-700">
                    {lead.source}
                    {lead.source_detail && <span className="text-gray-400"> · {lead.source_detail}</span>}
                  </p>
                </section>
              )}
            </div>
          )}

          {/* ── ACTIVITY ─────────────────────────────────────────────────── */}
          {tab === 'activity' && (
            <div className="p-4 space-y-4">

              {/* Engagement stats row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Mail,     label: 'Emails',    val: lead.email_sent_count ?? 0 },
                  { icon: Phone,    label: 'Calls',     val: lead.call_count ?? 0        },
                  { icon: Calendar, label: 'Meetings',  val: lead.meeting_count ?? 0     },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <div className="text-lg font-bold text-gray-800">{val}</div>
                    <div className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
                      <Icon size={10} /> {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Last-touch summary banner */}
              {(() => {
                const touchSummary = buildLastTouchSummary(lead);
                const hasOverdue   = touchSummary.includes('overdue');
                return (
                  <div className={`px-3 py-2 rounded-lg text-xs leading-relaxed ${
                    hasOverdue
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-amber-50 border border-amber-200 text-amber-800'
                  }`}>
                    {touchSummary}
                  </div>
                );
              })()}

              {/* Timeline */}
              {/* TODO: lift activities to Map<leadId, LeadActivity[]> in LeadsPage to share with LeadQuickDrawer. */}
              <ActivityTimeline
                events={buildTimeline(lead)}
                onLogActivity={() => onOpenModal('contactLead', lead)}
                compact
              />

              <button
                onClick={() => onGoTo(`/crm/leads/${lead.id}`)}
                className="w-full text-center text-xs text-blue-500 hover:text-blue-700 transition-colors py-1"
              >
                Full activity history on the detail page →
              </button>
            </div>
          )}

          {/* ── QUALIFICATION ────────────────────────────────────────────── */}
          {tab === 'qualification' && (
            <div className="p-4 space-y-4">

              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Qualification status</p>
                  <div className="flex items-center gap-2">
                    {lead.is_qualified ? (
                      <><CheckCircle size={14} className="text-green-600" /><span className="text-sm font-semibold text-green-700">Qualified</span></>
                    ) : (
                      <><XCircle size={14} className="text-gray-400" /><span className="text-sm font-semibold text-gray-500">Not yet qualified</span></>
                    )}
                  </div>
                  {lead.qualified_at && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {fmtDate(lead.qualified_at)}{lead.qualified_by ? ` · ${lead.qualified_by}` : ''}
                    </p>
                  )}
                </div>
                <ConversionReadinessBadge state={readiness.state} leadStatus={lead.status} />
              </div>

              {/* Qualification notes */}
              {lead.qualification_notes && (
                <section>
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</h4>
                  <p className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
                    {lead.qualification_notes}
                  </p>
                </section>
              )}

              {/* Checklist */}
              <section>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Conversion checklist</h4>
                <div className="space-y-1.5">
                  {readiness.checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {item.met
                        ? <CheckCircle size={13} className="text-green-500 shrink-0" />
                        : <Circle size={13} className="text-gray-300 shrink-0" />
                      }
                      <span className={`text-xs ${item.met ? 'text-gray-700' : 'text-gray-400'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
                {readiness.reasons.length > 0 && (
                  <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                    {readiness.reasons.map((r, i) => (
                      <p key={i} className="text-xs text-amber-700">{r}</p>
                    ))}
                  </div>
                )}
              </section>

              {/* SLA */}
              {slaResult.overall !== 'na' && (
                <section>
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">SLA status</h4>
                  <SLABadge result={slaResult} />
                </section>
              )}
            </div>
          )}

          {/* ── NOTES ────────────────────────────────────────────────────── */}
          {tab === 'notes' && (
            <div className="p-4 space-y-4">
              {lead.quick_notes ? (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                  <p className="text-[11px] text-amber-600 font-semibold uppercase tracking-wide mb-1">Quick note</p>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{lead.quick_notes}</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare size={28} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No notes yet</p>
                </div>
              )}

              <button
                onClick={() => onOpenModal('contactLead', lead)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <MessageSquare size={14} /> Add Note
              </button>
            </div>
          )}

          {/* ── ACTIONS ──────────────────────────────────────────────────── */}
          {tab === 'actions' && (
            <div className="p-4 space-y-4">

              {/* Primary NBA action */}
              <section>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Suggested next action</h4>
                <div className={`border rounded-xl p-3.5 space-y-2 ${NBA_PRIORITY_CLS[nbaResult.priority].card}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${NBA_PRIORITY_CLS[nbaResult.priority].badge}`}>
                      {NBA_PRIORITY_CLS[nbaResult.priority].label}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{nbaResult.action.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{nbaResult.reason}</p>
                  <button
                    onClick={() => handleAction(nbaResult.action.id)}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${VARIANT_BTN[nbaResult.action.variant]}`}
                  >
                    {nbaResult.action.label} →
                  </button>
                </div>
              </section>

              {/* Additional workflow actions */}
              {workflowActions.length > 0 && (
                <section>
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Also relevant</h4>
                  <div className="flex flex-wrap gap-2">
                    {workflowActions.map(action => (
                      <button
                        key={action.id}
                        onClick={() => handleAction(action.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${VARIANT_BTN[action.variant]}`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Score breakdown */}
              <section>
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <TrendingUp size={10} /> Score factors
                </h4>
                <div className="space-y-2.5 bg-gray-50 rounded-lg p-3">
                  <ScoreBar label="Fit"        score={mfs.fitScore.score}        barCls="bg-blue-500"   textCls="text-blue-600"   />
                  <ScoreBar label="Intent"     score={mfs.intentScore.score}     barCls="bg-purple-500" textCls="text-purple-600" />
                  <ScoreBar label="Engagement" score={mfs.engagementScore.score} barCls="bg-green-500"  textCls="text-green-600"  />
                  <ScoreBar label="Confidence" score={mfs.confidenceScore.score} barCls="bg-gray-400"   textCls="text-gray-500"   />
                </div>
                <button
                  onClick={() => setShowScoreDrawer(true)}
                  className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <TrendingUp size={11} /> View full score breakdown →
                </button>
              </section>

              {/* Terminal actions */}
              {!['disqualified', 'lost', 'converted'].includes(lead.status) && (
                <section className="pt-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenModal('terminalDisqualify', lead)}
                      className="flex-1 py-2 text-xs font-medium border border-gray-200 text-gray-500 rounded-lg hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Mark Disqualified
                    </button>
                    <button
                      onClick={() => onOpenModal('terminalLost', lead)}
                      className="flex-1 py-2 text-xs font-medium border border-gray-200 text-gray-500 rounded-lg hover:border-amber-200 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      Mark Lost
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">↑↓ navigate · Esc close · Enter open full page</p>
          <button
            onClick={() => onGoTo(`/crm/leads/${lead.id}`)}
            className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
          >
            <ExternalLink size={11} /> Full details
          </button>
        </div>
      </div>

      {/* Score explainability drawer — layers on top */}
      <ScoreExplainabilityDrawer
        isOpen={showScoreDrawer}
        lead={lead}
        mfs={mfs}
        explanation={explanation}
        nbaResult={nbaResult}
        onClose={() => setShowScoreDrawer(false)}
      />
    </>
  );
}

