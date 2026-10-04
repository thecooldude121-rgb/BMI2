import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical, Phone, Mail, Calendar,
  Pencil,
  Target, Users, PenLine, Globe, CircleDot, Eye,
  MessageSquare, MessageCircle, RotateCcw, TrendingUp,
  Briefcase, ArrowRightCircle, Heart, XCircle,
  GitMerge, UserCheck, Tag, Sparkles, Archive, Trash2, Info,
} from 'lucide-react';
import type { Lead } from '../../types/lead';
import type { ModalId } from '../../hooks/useLeadsPageState';
import { formatRelativeDate } from '../../utils/dateUtils';
import { getSecondaryActions, type ActionId, type ActionVariant, type LeadAction } from '../../utils/leadActions';
import { computeNBA } from '../../utils/leadNBA/engine';
import type { NBAResult } from '../../utils/leadNBA/engine';
import SLABadge, { EscalationMarker } from './SLABadge';
import type { LeadSLAResult } from '../../utils/leadSla';
import { HEALTHY_SLA_RESULT } from '../../utils/leadSla';
import ScoreTooltip from './ScoreTooltip';
import ScoreExplainabilityDrawer from './ScoreExplainabilityDrawer';
import { computeMultiFactorScore } from '../../utils/leadScoring/multiFactorScore';
import { explainScore } from '../../utils/leadScoring/scoreExplainer';
import {
  getFeedbackState,
  FEEDBACK_META,
  type FeedbackType,
} from '../../utils/leadScoring/scoreFeedback';
import { useLeadActions } from '../../hooks/useLeadActions';
import { useLeads } from '../../contexts/LeadContext';
import Badge from '../ui/Badge';
import { Button } from '../ui/Button';

/**
 * Not built, so offered DISABLED and labelled rather than as a live item that
 * only toasts "coming soon" on click (Honest Feedback). Editing is real now
 * (/crm/leads/:id/edit, Group A item 1). Re-enrich is on hold (vendor decision
 * pending); owner and tags have their own items.
 */
const COMING_SOON_ACTIONS = new Set<ActionId>(['assign_owner', 'add_tag', 'enrich', 'reenrich']);

// ── Types ─────────────────────────────────────────────────────────────────────

export type LeadTableRowProps = {
  lead:             Lead;
  isSelected:       boolean;
  onToggleSelect:   (id: string) => void;
  onNavigate:       (id: string) => void;
  onGoTo:           (path: string) => void;
  onOpenModal:      (modal: ModalId, lead: Lead) => void;
  onUpdateStatus:   (id: string, status: Lead['status']) => void;
  duplicateRisk?:   'low' | 'medium' | 'high';
  isOverdue:        boolean;
  isUntouched:      boolean;
  slaResult?:       LeadSLAResult;
  canConvert:       boolean;
  canDelete:        boolean;
};

// ── Sub-helpers ───────────────────────────────────────────────────────────────

function statusBadge(status: Lead['status']): { label: string; cls: string } {
  // Figma: one indigo pill for working stages; amber / green / red only where
  // the stage itself says so (nurture, qualified / converted, lost).
  const brand = 'bg-brand-50 text-brand-600';
  switch (status) {
    case 'new':               return { label: 'New',            cls: brand };
    case 'assigned':          return { label: 'Assigned',       cls: brand };
    case 'enriching':         return { label: 'Enriching',      cls: brand };
    case 'attempting_contact': return { label: 'Contacted',     cls: brand };
    case 'engaged':           return { label: 'Engaged',        cls: brand };
    case 'qualified':         return { label: 'Qualified',      cls: 'bg-success-100 text-success-700' };
    case 'sales_accepted':    return { label: 'Sales Accepted', cls: 'bg-success-100 text-success-700' };
    case 'nurture':           return { label: 'Nurturing',      cls: 'bg-warning-100 text-warning-700' };
    case 'disqualified':      return { label: 'Disqualified',   cls: 'bg-surface-sunken text-ink-secondary' };
    case 'converted':         return { label: 'Converted',      cls: 'bg-success-100 text-success-700' };
    case 'lost':              return { label: 'Lost',           cls: 'bg-danger-100 text-danger-700' };
    default:                  return { label: status,           cls: 'bg-surface-sunken text-ink-secondary' };
  }
}

function SourceIcon({ source }: { source: string }) {
  switch (source) {
    case 'Lead Gen': return <Target size={10} />;
    case 'HRMS':     return <Users size={10} />;
    case 'Manual':   return <PenLine size={10} />;
    case 'Website':  return <Globe size={10} />;
    default:         return <CircleDot size={10} />;
  }
}

// ── Action icon lookup ────────────────────────────────────────────────────────

function ActionIcon({ id }: { id: ActionId }): JSX.Element | null {
  switch (id) {
    case 'call_now':
    case 'contact_now':
    case 'contact':             return <Phone size={11} />;
    case 'follow_up_now':
    case 'follow_up':           return <MessageSquare size={11} />;
    case 'send_first_outreach': return <Mail size={11} />;
    case 'book_discovery':      return <Calendar size={11} />;
    case 'check_in':            return <MessageCircle size={11} />;
    case 'revive':              return <RotateCcw size={11} />;
    case 'convert_to_contact':     return <UserCheck size={11} />;
    case 'convert_to_deal':
    case 'complete_qualification': return <TrendingUp size={11} />;
    case 'create_deal':         return <Briefcase size={11} />;
    case 'view_deal':           return <ArrowRightCircle size={11} />;
    case 'view_details':        return <Eye size={11} />;
    case 'edit_lead':           return <Pencil size={11} />;
    case 'assign_owner':        return <UserCheck size={11} />;
    case 'add_tag':             return <Tag size={11} />;
    case 'enrich':
    case 'reenrich':            return <Sparkles size={11} />;
    case 'mark_nurture':        return <Heart size={11} />;
    case 'mark_disqualified':   return <XCircle size={11} />;
    case 'merge_duplicate':     return <GitMerge size={11} />;
    case 'archive':             return <Archive size={11} />;
    case 'delete':              return <Trash2 size={11} />;
    default:                    return null;
  }
}

// ── Menu item classes per variant ─────────────────────────────────────────────

function menuItemCls(variant: ActionVariant): string {
  if (variant === 'danger') return 'text-danger-700 hover:bg-danger-50';
  if (variant === 'muted')  return 'text-ink-muted hover:bg-black/5';
  if (variant === 'ready')  return 'text-success-700 hover:bg-success-50';
  return 'text-ink hover:bg-black/5';
}

// ── Component ─────────────────────────────────────────────────────────────────

const LeadTableRow: React.FC<LeadTableRowProps> = ({
  lead,
  isSelected,
  onToggleSelect,
  onNavigate,
  onGoTo,
  onOpenModal,
  onUpdateStatus,
  duplicateRisk,
  isOverdue,
  isUntouched,
  slaResult = HEALTHY_SLA_RESULT,
  canConvert,
  canDelete,
}) => {
  const { updateLead } = useLeads();
  const actions = useLeadActions(updateLead);

  const [menuOpen,      setMenuOpen]      = useState(false);
  const [scoreHovered,  setScoreHovered]  = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [feedbackMark,  setFeedbackMark]  = useState<FeedbackType | null>(
    () => getFeedbackState(lead.id),
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // ── Action computation ────────────────────────────────────────────────────
  const isDuplicateRisk = duplicateRisk != null;
  const signals = { isDuplicateRisk, isOverdue, isUntouched };
  const mfs             = computeMultiFactorScore(lead);
  const expl            = explainScore(lead, mfs);
  const nbaResult: NBAResult = computeNBA(lead, { ...signals, slaResult, mfs });
  const primaryAction   = nbaResult.action;
  const secondaryGroups = getSecondaryActions(lead, signals);

  function handleAction(action: LeadAction): void {
    setMenuOpen(false);
    switch (action.id) {
      case 'call_now':
      case 'contact_now':
      case 'contact':
      case 'follow_up_now':
      case 'follow_up':
      case 'send_first_outreach':
      case 'book_discovery':
      case 'check_in':
      case 'revive':
        onOpenModal('contactLead', lead);
        break;
      case 'convert_to_contact':
        if (canConvert) onOpenModal('convertLead', lead);
        break;
      case 'convert_to_deal':
      case 'complete_qualification':
        if (canConvert) onOpenModal('convertLead', lead);
        break;
      case 'create_deal':
        onGoTo(`/crm/deals/new?leadId=${lead.id}`);
        break;
      case 'view_deal':
        if (lead.converted_to_deal_id) onGoTo(`/crm/deals/${lead.converted_to_deal_id}`);
        break;
      case 'view_details':
        onGoTo(`/crm/leads/${lead.id}`);
        break;
      case 'edit_lead':
        onGoTo(`/crm/leads/${lead.id}/edit`);
        break;
      case 'assign_owner':
        onOpenModal('assignOwner', lead);
        break;
      case 'add_tag':
        onOpenModal('addTag', lead);
        break;
      case 'enrich':
      case 'reenrich':
        onOpenModal('enrichLead', lead);
        break;
      case 'mark_nurture':
        onUpdateStatus(lead.id, 'nurture');
        break;
      case 'mark_disqualified':
        onOpenModal('terminalDisqualify', lead);
        break;
      case 'merge_duplicate':
        onOpenModal('mergeDuplicate', lead);
        break;
      case 'archive':
        onOpenModal('terminalLost', lead);
        break;
      case 'delete':
        if (canDelete) onOpenModal('confirmDelete', lead);
        break;
    }
  }

  // ── Display values ────────────────────────────────────────────────────────
  const displayScore = lead.manual_score_override ?? lead.ai_score ?? lead.score ?? 0;
  const { label: statusLabel, cls: statusCls } = statusBadge(lead.status);
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';
  const recency = lead.last_contact_date ? (formatRelativeDate(lead.last_contact_date) || lead.last_contact_date) : null;

  // ── Row classes (Figma "Lead row" 61:185) ─────────────────────────────────
  const rowCls = [
    'group border-b border-line transition-colors duration-100 cursor-pointer',
    isSelected ? 'bg-brand-50' : 'hover:bg-black/[0.03]',
    isOverdue ? 'border-l-4 border-l-danger-700' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
    <tr className={rowCls} onClick={() => onNavigate(lead.id)}>

      {/* ── Selection ────────────────────────────────────────────────────── */}
      <td className="w-12 px-4 py-2.5 align-top">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(lead.id)}
          onClick={e => e.stopPropagation()}
          aria-label={`Select ${name}`}
          className="mt-1 h-4 w-4 cursor-pointer rounded border-line text-brand-600 focus:ring-brand-600"
        />
      </td>

      {/* ── Identity: name, company (indigo), email ─────────────────────── */}
      <td className="w-72 px-4 py-2.5 align-top">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-sm font-semibold leading-5 text-ink">
            {name}
            {slaResult.escalate && <EscalationMarker />}
          </span>
          {lead.company && <span className="truncate text-xs leading-[18px] text-brand-600">{lead.company}</span>}
          {(lead.email || lead.city || lead.position) && (
            <span className="max-w-[260px] truncate text-xs leading-[18px] text-ink-muted">
              {/* Figma: "amina@gulfaxis.ae · Dubai" — city when recorded, else the title */}
              {[lead.email, lead.city || lead.position].filter(Boolean).join(' · ')}
            </span>
          )}
          {(isDuplicateRisk || isUntouched) && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {duplicateRisk === 'high' && <Badge tone="danger">High risk dup</Badge>}
              {duplicateRisk === 'medium' && <Badge tone="warning">Possible dup</Badge>}
              {duplicateRisk === 'low' && <Badge tone="neutral">Low risk dup</Badge>}
              {isUntouched && <Badge tone="neutral">Unworked</Badge>}
            </div>
          )}
        </div>
      </td>

      {/* ── Qualification: status + the STORED score, no verdict colour ──── */}
      <td className="w-48 px-4 py-2.5 align-top">
        <div className="flex flex-col items-start gap-1">
          <span className={`inline-block w-fit rounded-full px-2 py-[3px] text-xs font-semibold leading-[18px] ${statusCls}`}>
            {statusLabel}
          </span>
          <div
            className="relative flex items-center gap-1"
            onMouseEnter={() => setScoreHovered(true)}
            onMouseLeave={() => setScoreHovered(false)}
          >
            {/* Figma "84 stored": the value on the record, not a judgement —
                it used to be a large green / yellow / red number. */}
            <span className="text-xs leading-[18px] text-ink-muted">{displayScore} stored</span>
            {lead.manual_score_override != null && (
              <Pencil size={10} className="text-ink-muted" aria-label="Manual override" />
            )}
            {feedbackMark && (
              <span
                title={`Feedback: ${FEEDBACK_META[feedbackMark].label}`}
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  feedbackMark === 'accurate' ? 'bg-success-700' :
                  feedbackMark === 'bad_data' ? 'bg-danger-700' : 'bg-warning-700'
                }`}
              />
            )}
            <button
              onClick={e => { e.stopPropagation(); setDrawerOpen(true); }}
              aria-label={`Why ${name} has this score`}
              className="ml-0.5 rounded p-0.5 text-ink-muted opacity-0 transition-opacity hover:bg-brand-50 hover:text-brand-600 focus:opacity-100 group-hover:opacity-100"
            >
              <Info size={11} />
            </button>
            {scoreHovered && <ScoreTooltip mfs={mfs} explanation={expl} />}
          </div>
        </div>
      </td>

      {/* ── Engagement: source · last contact, then owner ───────────────── */}
      <td className="w-44 px-4 py-2.5 align-top">
        <div className="flex flex-col gap-1 text-xs leading-[18px]">
          <span className="flex items-center gap-1 font-semibold text-ink">
            <SourceIcon source={lead.source} />
            {[lead.source || '—', recency].filter(Boolean).join(' · ')}
          </span>
          <span className="text-ink-muted">{recency ? (lead.owner_name || 'Unassigned') : 'Never contacted'}</span>
        </div>
      </td>

      {/* ── Urgency: the per-lead SLA (computed from this lead alone) ─────── */}
      <td className="w-56 px-4 py-2.5 align-top">
        <SLABadge result={slaResult} />
      </td>

      {/* ── Actions: Open (Figma) + the rule-based actions in ⋯ ──────────── */}
      <td className="w-44 px-4 py-2.5 align-top" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" onClick={() => onNavigate(lead.id)} aria-label={`Open ${name}`}>Open</Button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
              className="rounded p-1 text-ink-muted hover:bg-black/5 hover:text-ink"
              aria-label={`More actions for ${name}`}
              aria-expanded={menuOpen}
            >
              <MoreVertical size={14} />
            </button>

            {menuOpen && (
              <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-56 rounded-card border border-line bg-surface-panel py-1 shadow-lg">
                {[{ id: 'primary', items: [primaryAction] }, ...secondaryGroups].map((group, gi) => (
                  <React.Fragment key={group.id}>
                    {gi > 0 && <div className="my-1 border-t border-line" />}
                    {group.items.map(action => {
                      const isConvertAction = action.id === 'convert_to_contact' || action.id === 'convert_to_deal' || action.id === 'complete_qualification';
                      const isDeleteAction  = action.id === 'delete';
                      // Destructive actions are hidden when not permitted (vs disabled)
                      if (isDeleteAction && !canDelete) return null;
                      if (gi > 0 && action.id === primaryAction.id) return null;
                      const blocked = isConvertAction && !canConvert;
                      const soon = COMING_SOON_ACTIONS.has(action.id);
                      return (
                        <button
                          key={`${group.id}-${action.id}`}
                          role="menuitem"
                          onClick={() => !blocked && !soon && handleAction(action)}
                          disabled={blocked || soon}
                          title={soon ? 'Coming soon' : blocked ? 'Not available for your role' : undefined}
                          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs ${
                            blocked || soon ? 'cursor-not-allowed text-ink-muted' : menuItemCls(action.variant)
                          }`}
                        >
                          <ActionIcon id={action.id} />
                          {action.label}
                          {soon && <span className="ml-auto text-[11px]">coming soon</span>}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>

    {/* Score explainability drawer — portal-rendered to avoid table nesting issues */}
    <ScoreExplainabilityDrawer
      isOpen={drawerOpen}
      lead={lead}
      mfs={mfs}
      explanation={expl}
      nbaResult={nbaResult}
      onClose={() => setDrawerOpen(false)}
      initialFeedback={feedbackMark}
      onFeedbackSubmit={(type) => {
        setFeedbackMark(type);
        actions.recordFeedback(lead, type, lead.ai_score ?? lead.score);
      }}
    />
    </>
  );
};

export default LeadTableRow;
