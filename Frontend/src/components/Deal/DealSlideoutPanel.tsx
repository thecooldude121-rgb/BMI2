/**
 * DealSlideoutPanel — right-side slideout panel for viewing and quick-editing
 * a deal without leaving the pipeline board.
 *
 * Architecture decisions:
 *
 * 1. createPortal → document.body
 *    The board uses overflow-x-auto / min-w-max containers. A panel mounted
 *    inside those containers would be clipped.  Portal renders above the DOM
 *    tree so it floats correctly over the board at any viewport width.
 *
 * 2. Two-state animation (isVisible flag separate from mount)
 *    Parent controls mount via dealId !== null.  Internal isVisible drives
 *    the CSS translate so the exit animation completes before the parent
 *    unmounts the component.  handleClose() → setIsVisible(false) →
 *    setTimeout(280ms) → onClose().
 *
 * 3. Abort controller on fetch
 *    If dealId changes before the first fetch resolves (user clicks a second
 *    card quickly), the stale response is discarded.
 *
 * 4. Focus management
 *    On open: focus moves to the close button.
 *    On close: focus restores to the element that was active before the panel
 *    opened (stored in previousFocusRef).
 *    ESC: global keydown listener, cleaned up on unmount.
 *    role="dialog" aria-modal="true" — native browser focus scoping when
 *    combined with the inert attribute on the backdrop.
 *
 * 5. Quick-edit pattern
 *    Each editable field shows a pencil icon on hover.  Click → input replaces
 *    static text.  Save (Enter/blur) → updateDeal API call → patches panel
 *    local state AND calls onDealUpdate so the board card syncs immediately.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import {
  X, ExternalLink, Edit2, Check, XCircle as CancelIcon,
  Building2, User, Calendar, Clock, Tag,
  ChevronRight, AlertTriangle, Sparkles,
  RefreshCw, FileText, CheckCircle2,
} from 'lucide-react';
import { getDeal, updateDeal } from '../../utils/dealsApi';
import {
  formatCloseDate,
  formatRelativeTime,
  daysFromNow,
} from '../../utils/dateUtils';
import { resolveDealState, STATE_TOKENS } from '../../utils/dealState';
import type { DealCard } from './DealKanbanCard';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Normalised deal shape used inside the panel — mapped from raw API data. */
interface PanelDeal {
  id: string;
  dealName: string;
  companyName: string;
  amount: number;
  currency: string;
  stage: string;
  stageName: string;
  closeDate: string;       // raw ISO — used for the date input value
  owner: string;
  contactName: string;
  contactTitle: string;
  source: string;
  probability: number;
  nextStep: string;
  description: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
  aiScore: number;
  health: 'healthy' | 'at-risk' | 'stalled';
  priority: 'high' | 'medium' | 'low';
  daysSinceContact: number;
  lastActivity: string;
  isHRMS: boolean;
}

export interface DealSlideoutPanelProps {
  /** The deal to show, or null when the panel should be closed/unmounted. */
  dealId: string | null;
  onClose: () => void;
  /** Navigate to the full record page — called by the "Open full record" button. */
  onNavigateToFull: (id: string) => void;
  /**
   * Called after a successful quick-edit save so the parent can patch the
   * card in the board's stages state without a full refetch.
   * `patch` uses the DealCard field names (not raw API names).
   */
  onDealUpdate: (dealId: string, patch: Partial<DealCard>) => void;
}

// ── Stage config ───────────────────────────────────────────────────────────────

const STAGES: { id: string; label: string }[] = [
  { id: 'prospecting',  label: 'Prospecting' },
  { id: 'qualified',    label: 'Qualified'   },
  { id: 'proposal',     label: 'Proposal'    },
  { id: 'negotiation',  label: 'Negotiation' },
  { id: 'closed-won',   label: 'Closed Won'  },
  { id: 'closed-lost',  label: 'Closed Lost' },
];

const STAGE_COLORS: Record<string, string> = {
  prospecting:   'bg-blue-100 text-blue-700',
  qualified:     'bg-green-100 text-green-700',
  proposal:      'bg-orange-100 text-orange-700',
  negotiation:   'bg-purple-100 text-purple-700',
  'closed-won':  'bg-emerald-100 text-emerald-700',
  'closed-lost': 'bg-red-100 text-red-700',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'USD'): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)    return `$${(amount / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name?: string): string {
  if (!name?.trim()) return '?';
  const p = name.trim().split(/\s+/);
  return p.length === 1
    ? p[0][0].toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/**
 * Maps raw API response → PanelDeal shape.
 * Mirrors the mapping in ComprehensiveDealDetailPage so both views stay
 * consistent if the backend schema changes.
 */
function mapApiToPanelDeal(data: any): PanelDeal {
  const STAGE_LABEL: Record<string, string> = {
    prospecting: 'Prospecting', qualified: 'Qualified',
    proposal: 'Proposal', negotiation: 'Negotiation',
    'closed-won': 'Closed Won', 'closed-lost': 'Closed Lost',
  };
  const stage = data.stage || 'prospecting';
  const rawTags = data.tags;
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === 'string'
    ? rawTags.replace(/[{}"]/g, '').split(',').filter(Boolean)
    : [];

  const health = (['healthy', 'at-risk', 'stalled'] as const).includes(data.health)
    ? (data.health as 'healthy' | 'at-risk' | 'stalled')
    : 'healthy';

  const priority = (['high', 'medium', 'low'] as const).includes(data.priority?.toLowerCase())
    ? (data.priority.toLowerCase() as 'high' | 'medium' | 'low')
    : 'medium';

  return {
    id:            data.id,
    dealName:      data.name || data.title || 'Untitled Deal',
    companyName:   data.company_name || '',
    amount:        Number(data.value) || 0,
    currency:      data.currency || 'USD',
    stage,
    stageName:     STAGE_LABEL[stage] ?? stage,
    closeDate:     data.expected_close_date ? data.expected_close_date.split('T')[0] : '',
    owner:         data.assigned_to || '',
    contactName:   data.contact_name || '',
    contactTitle:  data.contact_title || '',
    source:        data.source || '',
    probability:   Number(data.probability) || 0,
    nextStep:      data.next_step || '',
    description:   data.description || '',
    tags,
    updatedAt:     data.updated_at || '',
    createdAt:     data.created_at || '',
    // aiScore is stored as probability in the backend (0-100 win probability)
    aiScore:       Number(data.probability) || 0,
    health,
    priority,
    daysSinceContact: Number(data.days_since_contact) || 0,
    lastActivity:  data.updated_at || data.created_at || '',
    isHRMS:        Boolean(data.is_hrms),
  };
}

/**
 * Maps a panel field name + new value → a partial DealCard patch.
 * Used to keep the board card in sync after a quick-edit save.
 */
function toDealCardPatch(field: string, value: string): Partial<DealCard> {
  switch (field) {
    case 'stage':     return { stage: value };
    case 'closeDate': return { closeDate: value };
    case 'nextStep':  return { status: value };
    case 'owner':     return { owner: value };
    default:          return {};
  }
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

const SkeletonLine: React.FC<{ width?: string; height?: string }> = ({
  width = 'w-full', height = 'h-4',
}) => (
  <div className={`${width} ${height} bg-gray-100 rounded animate-pulse`} />
);

const SectionSkeleton: React.FC = () => (
  <div className="px-5 py-4 space-y-3">
    <SkeletonLine width="w-1/3" height="h-3" />
    <SkeletonLine />
    <SkeletonLine width="w-3/4" />
  </div>
);

const PanelSkeleton: React.FC = () => (
  <div>
    {/* Hero skeleton */}
    <div className="px-5 py-4 space-y-3 border-b border-gray-100">
      <SkeletonLine width="w-2/3" height="h-5" />
      <div className="flex space-x-2">
        <SkeletonLine width="w-24" height="h-6" />
        <SkeletonLine width="w-20" height="h-6" />
      </div>
    </div>
    <SectionSkeleton />
    <SectionSkeleton />
    <SectionSkeleton />
  </div>
);

// ── Editable field ─────────────────────────────────────────────────────────────

/**
 * Renders a field value that becomes an input when clicked.
 * Pencil icon reveals on hover — zero resting visual weight.
 */
interface EditableFieldProps {
  label: string;
  value: string;
  displayValue?: string;
  isEditing: boolean;
  isSaving: boolean;
  editType: 'text' | 'date' | 'select' | 'textarea';
  selectOptions?: { value: string; label: string }[];
  placeholder?: string;
  emptyText?: string;
  onStartEdit: () => void;
  onChangeValue: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  inputRef?: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label, value, displayValue, isEditing, isSaving,
  editType, selectOptions, placeholder, emptyText = '—',
  onStartEdit, onChangeValue, onSave, onCancel, inputRef,
}) => {
  const shown = displayValue ?? value;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editType !== 'textarea') { e.preventDefault(); onSave(); }
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="flex items-start justify-between py-2.5 group">
      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider w-24 flex-shrink-0 pt-0.5">
        {label}
      </span>

      {isEditing ? (
        /* ── Edit mode ── */
        <div className="flex-1 flex items-start space-x-1">
          <div className="flex-1">
            {editType === 'select' && (
              <select
                ref={inputRef as React.RefObject<HTMLSelectElement>}
                value={value}
                onChange={e => onChangeValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full text-[13px] text-gray-900 border border-indigo-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                autoFocus
              >
                {selectOptions?.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}
            {editType === 'date' && (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="date"
                value={value}
                onChange={e => onChangeValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full text-[13px] text-gray-900 border border-indigo-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                autoFocus
              />
            )}
            {editType === 'textarea' && (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={value}
                onChange={e => onChangeValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={2}
                className="w-full text-[13px] text-gray-900 border border-indigo-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                autoFocus
              />
            )}
            {editType === 'text' && (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={value}
                onChange={e => onChangeValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full text-[13px] text-gray-900 border border-indigo-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                autoFocus
              />
            )}
          </div>
          {/* Save / cancel buttons */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
            title="Save"
            aria-label="Save"
          >
            {isSaving
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
            title="Cancel"
            aria-label="Cancel edit"
          >
            <CancelIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        /* ── View mode — pencil appears on hover ── */
        <div className="flex-1 flex items-start justify-between min-w-0">
          <span className={`text-[13px] leading-snug truncate ${shown ? 'text-gray-900' : 'text-gray-400 italic'}`}>
            {shown || emptyText}
          </span>
          <button
            onClick={onStartEdit}
            className="flex-shrink-0 ml-2 p-1 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded opacity-0 group-hover:opacity-100 transition-all"
            title={`Edit ${label}`}
            aria-label={`Edit ${label}`}
          >
            <Edit2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Section wrapper ────────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border-b border-gray-100 last:border-0">
    <div className="px-5 py-1.5 bg-gray-50">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{title}</span>
    </div>
    <div className="px-5">{children}</div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const DealSlideoutPanel: React.FC<DealSlideoutPanelProps> = ({
  dealId,
  onClose,
  onNavigateToFull,
  onDealUpdate,
}) => {
  const [deal, setDeal] = useState<PanelDeal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Which field is currently being edited — only one at a time
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // isVisible drives the CSS slide/fade animation.
  // It lags slightly behind dealId so the exit animation completes before
  // the parent unmounts the component.
  const [isVisible, setIsVisible] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef       = useRef<HTMLDivElement>(null);
  // Store the element that was active when the panel opened so we can
  // restore focus when it closes.
  const previousFocusRef = useRef<Element | null>(null);

  // ── Mount/unmount animation ──────────────────────────────────────────────
  useEffect(() => {
    if (dealId) {
      previousFocusRef.current = document.activeElement;
      // requestAnimationFrame ensures the DOM has painted before we apply
      // the visible class — otherwise the CSS transition never fires.
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [dealId]);

  // ── Focus close button when panel becomes visible ────────────────────────
  useEffect(() => {
    if (isVisible) {
      closeButtonRef.current?.focus();
    }
  }, [isVisible]);

  // ── ESC key — close panel ────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dealId) handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  // ── Fetch deal data ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!dealId) { setDeal(null); setError(null); return; }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setEditingField(null);

    getDeal(dealId)
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setDeal(mapApiToPanelDeal(data));
      })
      .catch((err: any) => {
        if (controller.signal.aborted) return;
        setError(err.message || 'Failed to load deal');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [dealId]);

  // ── Close handler — triggers exit animation then calls onClose ───────────
  const handleClose = useCallback(() => {
    setIsVisible(false);
    // Wait for the 280ms CSS transition to complete before the parent unmounts
    setTimeout(() => {
      onClose();
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    }, 290);
  }, [onClose]);

  // ── Quick edit ────────────────────────────────────────────────────────────

  const startEdit = (field: string, currentValue: string) => {
    setSaveError(null);
    setEditingField(field);
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
    setSaveError(null);
  };

  const saveField = async (field: string) => {
    if (!deal || !dealId) return;
    setSaving(true);
    setSaveError(null);

    // Map panel field name → API payload key
    const API_KEY: Record<string, string> = {
      stage:     'stage',
      closeDate: 'expected_close_date',
      nextStep:  'next_step',
      owner:     'assigned_to',
    };

    try {
      await updateDeal(dealId, { [API_KEY[field]]: editValue } as any);

      // Patch local panel state so the view updates immediately
      setDeal(prev => prev ? { ...prev, [field]: editValue } : prev);

      // Sync the board card via parent callback
      onDealUpdate(dealId, toDealCardPatch(field, editValue));

      setEditingField(null);
    } catch (err: any) {
      setSaveError(err.message || 'Save failed — try again');
    } finally {
      setSaving(false);
    }
  };

  // Don't render anything (not even a portal) when there's no deal selected
  if (!dealId) return null;

  // ── Compute state chip for the deal ──────────────────────────────────────
  const closeDaysLeft = deal ? daysFromNow(deal.closeDate) : null;
  const isClosed      = deal ? ['closed-won', 'closed-lost'].includes(deal.stage) : false;

  // Build a minimal DealCard-compatible object so we can reuse resolveDealState
  const dealCardShape: DealCard | null = deal ? {
    id:               deal.id,
    companyName:      deal.companyName,
    dealName:         deal.dealName,
    accountName:      deal.companyName,
    amount:           deal.amount,
    closeDate:        deal.closeDate,
    stage:            deal.stage,
    aiScore:          deal.aiScore,
    contactName:      deal.contactName,
    contactTitle:     deal.contactTitle,
    owner:            deal.owner,
    lastActivity:     deal.lastActivity,
    daysSinceContact: deal.daysSinceContact,
    isHRMS:           deal.isHRMS,
    priority:         deal.priority,
    health:           deal.health,
    source:           deal.source,
    status:           deal.nextStep,
  } : null;

  const cardState = dealCardShape
    ? resolveDealState(dealCardShape, closeDaysLeft, isClosed)
    : null;
  const stateTokens = cardState ? STATE_TOKENS[cardState.primary] : null;

  // ── Portal content ────────────────────────────────────────────────────────
  return createPortal(
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      {/* Semi-transparent so the board remains visible behind the panel.
          Clicking it closes the panel — same pattern as HubSpot sidepanels. */}
      <div
        className={`fixed inset-0 z-40 bg-black/25 transition-opacity duration-[280ms] ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* ── Panel ────────────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slideout-deal-name"
        aria-describedby="slideout-deal-company"
        className={`fixed inset-y-0 right-0 z-50 flex flex-col
          w-full sm:w-[420px]
          bg-white shadow-2xl
          transition-transform duration-[280ms] ease-out
          ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >

        {/* ── Sticky header ─────────────────────────────────────────────── */}
        {/* Remains visible while content scrolls below. Contains the two
            primary navigation actions: close (stay on board) and open full
            record (navigate away — escalation path only). */}
        <div className="flex-shrink-0 flex items-start justify-between px-5 py-4 border-b border-gray-200 bg-white">
          <div className="flex-1 min-w-0 mr-3">
            <p
              id="slideout-deal-name"
              className="text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2"
            >
              {loading ? '…' : (deal?.dealName || 'Deal')}
            </p>
            {deal && (
              <p id="slideout-deal-company" className="text-[12px] text-gray-500 mt-0.5 truncate">
                {deal.companyName || '—'}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            {/* Open full record — shown only when deal is loaded */}
            {deal && (
              <button
                onClick={() => onNavigateToFull(deal.id)}
                className="flex items-center space-x-1 px-2.5 py-1.5 text-[12px] text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
                title="Open full record"
              >
                <span>Full record</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
            {/* Close button — always present, receives focus on panel open */}
            <button
              ref={closeButtonRef}
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close panel (Esc)"
              aria-label="Close deal panel"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Loading state */}
          {loading && <PanelSkeleton />}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
              <p className="text-[13px] font-medium text-gray-700 mb-1">Couldn't load this deal</p>
              <p className="text-[12px] text-gray-500 mb-4">{error}</p>
              <button
                onClick={() => {
                  // Re-trigger fetch by resetting error — the useEffect watches dealId
                  // which hasn't changed, so we need to force it by toggling error state
                  setError(null);
                  setLoading(true);
                  getDeal(dealId!)
                    .then(({ data }) => setDeal(mapApiToPanelDeal(data)))
                    .catch((e: any) => setError(e.message || 'Failed to load deal'))
                    .finally(() => setLoading(false));
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white text-[12px] font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Deal content */}
          {!loading && !error && deal && (
            <>
              {/* ── HERO: value + state + close date ──────────────────── */}
              {/* The three highest-signal fields visible above the fold.
                  State chip comes from the canonical resolveDealState() so it
                  matches the board card exactly. */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  {/* Amount */}
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">Value</p>
                    <p className="text-[22px] font-bold text-indigo-600 leading-none">
                      {deal.amount ? formatCurrency(deal.amount, deal.currency) : '—'}
                    </p>
                    {deal.probability > 0 && (
                      <p className="text-[11px] text-gray-500 mt-0.5">{deal.probability}% probability</p>
                    )}
                  </div>

                  {/* Stage badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STAGE_COLORS[deal.stage] || 'bg-gray-100 text-gray-700'}`}>
                    {deal.stageName}
                  </span>
                </div>

                {/* State chip + close date row */}
                <div className="flex items-center justify-between">
                  {cardState && stateTokens && (
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${stateTokens.chipBg} ${stateTokens.chipText}`}
                      title={cardState.description}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${stateTokens.chipDot}`} />
                      <span>{cardState.chipLabel}</span>
                    </span>
                  )}

                  <div className="flex items-center space-x-1.5 text-[12px]">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span className={
                      closeDaysLeft === null ? 'text-gray-400' :
                      closeDaysLeft < 0  ? 'text-red-600 font-medium' :
                      closeDaysLeft <= 7 ? 'text-amber-600 font-medium' :
                                           'text-gray-600'
                    }>
                      {formatCloseDate(deal.closeDate)}
                    </span>
                  </div>
                </div>

                {/* Save error (shown inline below the hero) */}
                {saveError && (
                  <p className="mt-2 text-[11px] text-red-600 bg-red-50 rounded px-2 py-1">{saveError}</p>
                )}
              </div>

              {/* ── QUICK EDIT FIELDS ─────────────────────────────────── */}
              {/* Three high-frequency editable fields: stage, close date,
                  next step.  Pencil icon reveals on row hover.  Only one
                  field edits at a time. */}
              <Section title="Deal details">
                {/* Stage */}
                <EditableField
                  label="Stage"
                  value={editingField === 'stage' ? editValue : deal.stage}
                  displayValue={deal.stageName}
                  isEditing={editingField === 'stage'}
                  isSaving={saving && editingField === 'stage'}
                  editType="select"
                  selectOptions={STAGES.map(s => ({ value: s.id, label: s.label }))}
                  onStartEdit={() => startEdit('stage', deal.stage)}
                  onChangeValue={setEditValue}
                  onSave={() => saveField('stage')}
                  onCancel={cancelEdit}
                />

                {/* Close date */}
                <EditableField
                  label="Close date"
                  value={editingField === 'closeDate' ? editValue : deal.closeDate}
                  displayValue={formatCloseDate(deal.closeDate)}
                  isEditing={editingField === 'closeDate'}
                  isSaving={saving && editingField === 'closeDate'}
                  editType="date"
                  emptyText="No close date"
                  onStartEdit={() => startEdit('closeDate', deal.closeDate)}
                  onChangeValue={setEditValue}
                  onSave={() => saveField('closeDate')}
                  onCancel={cancelEdit}
                />

                {/* Next step */}
                <EditableField
                  label="Next step"
                  value={editingField === 'nextStep' ? editValue : deal.nextStep}
                  isEditing={editingField === 'nextStep'}
                  isSaving={saving && editingField === 'nextStep'}
                  editType="textarea"
                  placeholder="What's the next action?"
                  emptyText="No next step set"
                  onStartEdit={() => startEdit('nextStep', deal.nextStep)}
                  onChangeValue={setEditValue}
                  onSave={() => saveField('nextStep')}
                  onCancel={cancelEdit}
                />

                {/* Owner */}
                <EditableField
                  label="Owner"
                  value={editingField === 'owner' ? editValue : deal.owner}
                  isEditing={editingField === 'owner'}
                  isSaving={saving && editingField === 'owner'}
                  editType="text"
                  placeholder="Deal owner name"
                  emptyText="Unassigned"
                  onStartEdit={() => startEdit('owner', deal.owner)}
                  onChangeValue={setEditValue}
                  onSave={() => saveField('owner')}
                  onCancel={cancelEdit}
                />
              </Section>

              {/* ── PEOPLE ────────────────────────────────────────────── */}
              <Section title="People">
                {/* Account */}
                <div className="flex items-center py-2.5 space-x-3">
                  <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-gray-900">
                      {deal.companyName || '—'}
                    </p>
                    {deal.source && (
                      <p className="text-[11px] text-gray-500">Source: {deal.source}</p>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="flex items-center py-2.5 space-x-3 border-t border-gray-50">
                  <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-gray-900">
                      {deal.contactName || '—'}
                    </p>
                    {deal.contactTitle && (
                      <p className="text-[11px] text-gray-500">{deal.contactTitle}</p>
                    )}
                  </div>
                </div>

                {/* Owner avatar */}
                <div className="flex items-center py-2.5 space-x-3 border-t border-gray-50">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: '#6366f1' }}
                    aria-label={`Owner: ${deal.owner}`}
                  >
                    {getInitials(deal.owner)}
                  </span>
                  <p className="text-[13px] text-gray-900">
                    {deal.owner || <span className="text-gray-400 italic">Unassigned</span>}
                  </p>
                </div>
              </Section>

              {/* ── ACTIVITY ──────────────────────────────────────────── */}
              <Section title="Activity">
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center space-x-2 text-[12px] text-gray-600">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span>Last activity</span>
                  </div>
                  <span className="text-[12px] font-medium text-gray-900">
                    {formatRelativeTime(deal.lastActivity, 'No activity recorded')}
                  </span>
                </div>
                {deal.daysSinceContact > 0 && (
                  <div className="flex items-center justify-between py-2.5 border-t border-gray-50">
                    <span className="text-[12px] text-gray-500">Days since contact</span>
                    <span className={`text-[12px] font-medium ${deal.daysSinceContact >= 7 ? 'text-red-600' : deal.daysSinceContact >= 3 ? 'text-amber-600' : 'text-gray-900'}`}>
                      {deal.daysSinceContact}d
                    </span>
                  </div>
                )}
                {deal.description && (
                  <div className="py-2.5 border-t border-gray-50">
                    <p className="text-[11px] font-medium text-gray-400 mb-1">Description</p>
                    <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-3">
                      {deal.description}
                    </p>
                  </div>
                )}
              </Section>

              {/* ── AI HEALTH ─────────────────────────────────────────── */}
              {!isClosed && deal.aiScore > 0 && (
                <Section title="AI Health">
                  <div className="py-3">
                    {/* Score bar */}
                    <div className="flex items-center space-x-3 mb-3">
                      <Sparkles className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${deal.aiScore}%`,
                            backgroundColor:
                              deal.aiScore >= 80 ? '#10b981' :
                              deal.aiScore >= 60 ? '#6366f1' : '#f59e0b',
                          }}
                        />
                      </div>
                      <span
                        className="text-[13px] font-bold w-8 text-right"
                        style={{
                          color:
                            deal.aiScore >= 80 ? '#10b981' :
                            deal.aiScore >= 60 ? '#6366f1' : '#f59e0b',
                        }}
                      >
                        {deal.aiScore}
                      </span>
                    </div>

                    {/* Top signals derived from deal data */}
                    {cardState && (
                      <p className="text-[12px] text-gray-500 leading-relaxed">
                        {cardState.description}
                      </p>
                    )}
                  </div>
                </Section>
              )}

              {/* ── TAGS ─────────────────────────────────────────────── */}
              {deal.tags.length > 0 && (
                <Section title="Tags">
                  <div className="flex flex-wrap gap-1.5 py-3">
                    {deal.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-full"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* ── NOTES & TASKS (empty state with escalation path) ── */}
              {/* These tables exist in the DB schema but the API endpoint
                  doesn't join them yet.  Show an empty state that points to
                  the full record rather than silently hiding the section. */}
              <Section title="Notes & Tasks">
                <div className="py-4 flex flex-col items-center text-center">
                  <FileText className="h-8 w-8 text-gray-200 mb-2" />
                  <p className="text-[12px] text-gray-500 mb-3">
                    Notes and tasks are available in the full record view.
                  </p>
                  <button
                    onClick={() => onNavigateToFull(deal.id)}
                    className="flex items-center space-x-1 text-[12px] text-indigo-600 font-medium hover:underline"
                  >
                    <span>Open full record</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Section>

              {/* ── Bottom spacer so last section isn't flush with viewport edge ── */}
              <div className="h-6" />
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
};

export default DealSlideoutPanel;
