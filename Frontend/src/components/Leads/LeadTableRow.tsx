import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical, Clock, Phone, Mail, Calendar,
  AlertCircle, CalendarClock, Bot, Pencil,
  Target, Users, PenLine, Globe, CircleDot, Eye,
  MessageSquare, MessageCircle, RotateCcw, TrendingUp,
  Briefcase, ArrowRightCircle, Heart, XCircle,
  GitMerge, UserCheck, Tag, Sparkles, Archive, Trash2,
} from 'lucide-react';
import type { Lead } from '../../types/lead';
import type { ModalId } from '../../hooks/useLeadsPageState';
import { formatRelativeDate, formatFollowUpDate } from '../../utils/dateUtils';
import {
  getPrimaryAction, getSecondaryActions,
  type ActionId, type ActionVariant, type LeadAction,
} from '../../utils/leadActions';
import { computeNBA } from '../../utils/leadNBA/engine';
import type { NBAResult } from '../../utils/leadNBA/engine';
import { computeConversionReadiness } from '../../utils/conversionReadiness';
import ConversionReadinessBadge from './ConversionReadinessBadge';
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

// ── Types ─────────────────────────────────────────────────────────────────────

export type LeadTableRowProps = {
  lead:             Lead;
  isSelected:       boolean;
  onToggleSelect:   (id: string) => void;
  onNavigate:       (id: string) => void;
  onGoTo:           (path: string) => void;
  onOpenModal:      (modal: ModalId, lead: Lead) => void;
  onUpdateStatus:   (id: string, status: Lead['status']) => void;
  isDuplicateRisk:  boolean;
  isOverdue:        boolean;
  isUntouched:      boolean;
  slaResult?:       LeadSLAResult;
};

// ── Sub-helpers ───────────────────────────────────────────────────────────────

function statusBadge(status: Lead['status']): { label: string; cls: string } {
  switch (status) {
    case 'new':               return { label: 'New',               cls: 'bg-blue-100 text-blue-700' };
    case 'assigned':          return { label: 'Assigned',          cls: 'bg-indigo-100 text-indigo-700' };
    case 'enriching':         return { label: 'Enriching',         cls: 'bg-cyan-100 text-cyan-700' };
    case 'attempting_contact': return { label: 'Attempting',       cls: 'bg-orange-100 text-orange-700' };
    case 'engaged':           return { label: 'Engaged',           cls: 'bg-emerald-100 text-emerald-700' };
    case 'qualified':         return { label: 'Qualified',         cls: 'bg-green-100 text-green-700' };
    case 'sales_accepted':    return { label: 'Sales Accepted',    cls: 'bg-teal-100 text-teal-700' };
    case 'nurture':           return { label: 'Nurture',           cls: 'bg-purple-100 text-purple-700' };
    case 'disqualified':      return { label: 'Disqualified',      cls: 'bg-gray-100 text-gray-500' };
    case 'converted':         return { label: 'Converted',         cls: 'bg-teal-100 text-teal-600' };
    case 'lost':              return { label: 'Lost',              cls: 'bg-red-100 text-red-500' };
    default:                  return { label: status,              cls: 'bg-gray-100 text-gray-500' };
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-500';
}

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-green-500';
    case 'B': return 'bg-blue-500';
    case 'C': return 'bg-yellow-500';
    case 'D': return 'bg-orange-500';
    case 'F': return 'bg-red-500';
    default:  return 'bg-gray-400';
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

// ── CTA button classes per variant ────────────────────────────────────────────

const CTA_CLS: Record<ActionVariant, string> = {
  urgent:  'bg-red-500 text-white hover:bg-red-600 border border-transparent',
  warn:    'border border-amber-200 text-amber-700 hover:bg-amber-50',
  ready:   'bg-green-500 text-white hover:bg-green-600 border border-transparent',
  active:  'border border-blue-200 text-blue-600 hover:bg-blue-50',
  teal:    'border border-teal-200 text-teal-700 hover:bg-teal-50',
  default: 'border border-gray-200 text-gray-600 hover:bg-gray-50',
  muted:   'border border-gray-100 text-gray-400 hover:bg-gray-50',
  danger:  'border border-red-200 text-red-600 hover:bg-red-50',
};

// ── Menu item classes per variant ─────────────────────────────────────────────

function menuItemCls(variant: ActionVariant): string {
  if (variant === 'danger') return 'text-red-600 hover:bg-red-50';
  if (variant === 'muted')  return 'text-gray-400 hover:bg-gray-50';
  if (variant === 'ready')  return 'text-green-700 hover:bg-green-50';
  if (variant === 'teal')   return 'text-teal-700 hover:bg-teal-50';
  return 'text-gray-700 hover:bg-gray-50';
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
  isDuplicateRisk,
  isOverdue,
  isUntouched,
  slaResult = HEALTHY_SLA_RESULT,
}) => {
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
  const signals = { isDuplicateRisk, isOverdue, isUntouched };
  const mfs             = computeMultiFactorScore(lead);
  const expl            = explainScore(lead, mfs);
  const nbaResult: NBAResult = computeNBA(lead, { ...signals, slaResult, mfs });
  const readiness       = computeConversionReadiness(lead, mfs);
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
        onOpenModal('convertLead', lead);
        break;
      case 'convert_to_deal':
      case 'complete_qualification':
        onOpenModal('convertLead', lead);
        break;
      case 'create_deal':
        onGoTo(`/crm/deals/new?leadId=${lead.id}`);
        break;
      case 'view_deal':
        if (lead.converted_to_deal_id) onGoTo(`/crm/deals/${lead.converted_to_deal_id}`);
        break;
      case 'view_details':
        onNavigate(lead.id);
        break;
      case 'edit_lead':
        onOpenModal('editLead', lead);
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
        onOpenModal('confirmDelete', lead);
        break;
    }
  }

  // ── Display values ────────────────────────────────────────────────────────
  const displayScore    = lead.manual_score_override ?? lead.ai_score ?? lead.score ?? 0;
  const { label: statusLabel, cls: statusCls } = statusBadge(lead.status);
  const followUpDate    = lead.next_follow_up_date ? new Date(lead.next_follow_up_date) : null;
  const isOverdueFollowUp = followUpDate !== null && followUpDate < new Date();

  // ── Row classes ───────────────────────────────────────────────────────────
  const rowCls = [
    'group border-b border-gray-100 transition-colors duration-100 cursor-pointer',
    isSelected ? 'bg-blue-50 hover:bg-blue-50' : 'hover:bg-gray-50',
    isOverdue ? 'border-l-4 border-l-red-400' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
    <tr className={rowCls} onClick={() => onNavigate(lead.id)}>

      {/* ── Zone 1: Checkbox ─────────────────────────────────────────────── */}
      <td className="w-12 px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(lead.id)}
          onClick={e => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </td>

      {/* ── Zone 2: Identity ─────────────────────────────────────────────── */}
      <td className="w-72 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-sm text-gray-900 flex items-center gap-1">
            {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—'}
            {slaResult.escalate && <EscalationMarker />}
          </span>
          {(lead.company || lead.position) && (
            <span className="text-xs text-gray-500 truncate">
              {[lead.company, lead.position].filter(Boolean).join(' · ')}
            </span>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              onClick={e => e.stopPropagation()}
              className="text-xs text-gray-400 hover:text-blue-500 truncate max-w-[240px]"
            >
              {lead.email}
            </a>
          )}
          {(isDuplicateRisk || isUntouched) && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {isDuplicateRisk && (
                <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] px-1.5 py-0.5 rounded-full">
                  Duplicate
                </span>
              )}
              {isUntouched && (
                <span className="bg-gray-100 text-gray-500 border border-gray-200 text-[10px] px-1.5 py-0.5 rounded-full">
                  Unworked
                </span>
              )}
            </div>
          )}
        </div>
      </td>

      {/* ── Zone 3: Qualification ────────────────────────────────────────── */}
      <td className="w-48 px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full w-fit ${statusCls}`}>
            {statusLabel}
          </span>
          <ConversionReadinessBadge state={readiness.state} leadStatus={lead.status} />
          <div
            className="relative flex items-center gap-1"
            onMouseEnter={() => setScoreHovered(true)}
            onMouseLeave={() => setScoreHovered(false)}
          >
            <span className={`text-lg font-bold ${scoreColor(displayScore)}`}>
              {displayScore}
            </span>
            {lead.manual_score_override != null && (
              <Pencil size={10} className="text-gray-400" title="Manual override" />
            )}
            {lead.grade && (
              <span
                className={`${gradeColor(lead.grade)} text-white text-[10px] font-bold w-4 h-4 rounded flex items-center justify-center ml-1`}
              >
                {lead.grade}
              </span>
            )}
            {/* Feedback dot — persists across sessions */}
            {feedbackMark && (
              <span
                title={`Feedback: ${FEEDBACK_META[feedbackMark].label}`}
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  feedbackMark === 'accurate' ? 'bg-green-500' :
                  feedbackMark === 'bad_data' ? 'bg-red-500'   : 'bg-amber-500'
                }`}
              />
            )}
            {/* Sparkles icon — visible on row hover, opens explainability drawer */}
            <button
              onClick={e => { e.stopPropagation(); setDrawerOpen(true); }}
              title="Score explanation & feedback"
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 p-0.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500"
            >
              <Sparkles size={10} />
            </button>
            {scoreHovered && <ScoreTooltip mfs={mfs} explanation={expl} />}
          </div>
          {lead.probability > 0 && (
            <span className="text-[10px] text-gray-400">P: {lead.probability}%</span>
          )}
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <SourceIcon source={lead.source} />
            <span>{lead.source || '—'}</span>
          </div>
        </div>
      </td>

      {/* ── Zone 4: Engagement ───────────────────────────────────────────── */}
      <td className="w-44 px-4 py-3">
        <div className="flex flex-col gap-1">
          {lead.last_contact_date ? (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={10} className="shrink-0" />
              {formatRelativeDate(lead.last_contact_date) || lead.last_contact_date}
            </span>
          ) : (
            <span className="text-xs text-gray-300 italic">Never contacted</span>
          )}
          {(lead.call_count > 0 || lead.email_sent_count > 0 || lead.meeting_count > 0) && (
            <div className="flex items-center gap-2">
              {lead.call_count > 0 && (
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                  <Phone size={9} />{lead.call_count}
                </span>
              )}
              {lead.email_sent_count > 0 && (
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                  <Mail size={9} />{lead.email_sent_count}
                </span>
              )}
              {lead.meeting_count > 0 && (
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                  <Calendar size={9} />{lead.meeting_count}
                </span>
              )}
            </div>
          )}
        </div>
      </td>

      {/* ── Zone 5: Urgency ──────────────────────────────────────────────── */}
      <td className="w-56 px-4 py-3">
        <div className="flex flex-col gap-1">
          <SLABadge result={slaResult} />
          {followUpDate ? (
            isOverdueFollowUp ? (
              <span className="text-xs font-medium text-red-500 flex items-center gap-1">
                <AlertCircle size={10} className="shrink-0" />
                Overdue · {formatFollowUpDate(followUpDate)}
              </span>
            ) : (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <CalendarClock size={10} className="shrink-0" />
                {formatFollowUpDate(followUpDate)}
              </span>
            )
          ) : (
            <span className="text-xs text-gray-300 italic">No follow-up set</span>
          )}
          {lead.quick_notes ? (
            <p className="text-[10px] text-gray-400 line-clamp-2 flex items-start gap-1">
              <Bot size={9} className="mt-0.5 shrink-0" />
              {lead.quick_notes}
            </p>
          ) : (
            <span className="text-[10px] text-gray-300 italic">No AI insights yet</span>
          )}
        </div>
      </td>

      {/* ── Zone 6: Actions ──────────────────────────────────────────────── */}
      <td
        className="w-44 px-4 py-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 justify-end">
          {/* Primary CTA */}
          <button
            onClick={() => handleAction(primaryAction)}
            className={`text-xs font-medium px-2.5 py-1 rounded-md whitespace-nowrap flex items-center gap-1 ${CTA_CLS[primaryAction.variant]}`}
          >
            <ActionIcon id={primaryAction.id} />
            {primaryAction.label}
          </button>

          {/* ⋯ overflow menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              aria-label="More actions"
            >
              <MoreVertical size={14} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                {secondaryGroups.map((group, gi) => (
                  <React.Fragment key={group.id}>
                    {gi > 0 && <div className="my-1 border-t border-gray-100" />}
                    {group.items.map(action => (
                      <button
                        key={action.id}
                        onClick={() => handleAction(action)}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 ${menuItemCls(action.variant)}`}
                      >
                        <ActionIcon id={action.id} />
                        {action.label}
                      </button>
                    ))}
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
      onFeedbackSubmit={(type) => setFeedbackMark(type)}
    />
    </>
  );
};

export default LeadTableRow;
