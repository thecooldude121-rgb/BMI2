import React, { useState, useRef, useEffect } from 'react';
import {
  X, ChevronDown, Download, ArrowRightCircle, Archive,
  XCircle, Trash2, UserCheck, Tag, Sparkles, GitMerge,
  CalendarDays, MoreHorizontal,
} from 'lucide-react';
import type { Lead } from '../../types/lead';
import ConfirmationModal from '../common/ConfirmationModal';

// ── Types ─────────────────────────────────────────────────────────────────────

export type FollowUpType = 'call' | 'email' | 'meeting';

type ConfirmKind = 'convert' | 'delete';

export type BulkActionBarProps = {
  selectedIds:         string[];
  selectedLeads:       Lead[];
  totalFiltered:       number;
  isPageFullySelected: boolean;
  areAllFiltered:      boolean;
  onSelectAllFiltered: () => void;
  onClearSelection:    () => void;
  onChangeStatus:      (status: Lead['status']) => void;
  onSetFollowUp:       (date: string, type: FollowUpType) => void;
  onExport:            () => void;
  onConvert:           (ids: string[]) => void;
  onArchive:           () => void;
  onDisqualify:        () => void;
  onOpenTerminalModal: (action: 'disqualified' | 'lost') => void;
  onDelete:            () => void;
  onToast:             (msg: string, type?: 'success' | 'info' | 'error') => void;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_STATUSES: Array<{ value: Lead['status']; label: string; cls: string }> = [
  { value: 'new',               label: 'New',               cls: 'text-blue-700'    },
  { value: 'assigned',          label: 'Assigned',          cls: 'text-indigo-700'  },
  { value: 'enriching',         label: 'Enriching',         cls: 'text-cyan-700'    },
  { value: 'attempting_contact', label: 'Attempting Contact', cls: 'text-orange-700' },
  { value: 'engaged',           label: 'Engaged',           cls: 'text-emerald-700' },
  { value: 'qualified',         label: 'Qualified',         cls: 'text-green-700'   },
  { value: 'sales_accepted',    label: 'Sales Accepted',    cls: 'text-teal-700'    },
  { value: 'nurture',           label: 'Nurture',           cls: 'text-purple-700'  },
  { value: 'disqualified',      label: 'Disqualified',      cls: 'text-gray-500'    },
  { value: 'converted',         label: 'Converted',         cls: 'text-teal-700'    },
  { value: 'lost',              label: 'Lost',              cls: 'text-red-500'     },
];

// ── Component ─────────────────────────────────────────────────────────────────

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedIds,
  selectedLeads,
  totalFiltered,
  isPageFullySelected,
  areAllFiltered,
  onSelectAllFiltered,
  onClearSelection,
  onChangeStatus,
  onSetFollowUp,
  onExport,
  onConvert,
  onArchive,
  onDisqualify,
  onOpenTerminalModal,
  onDelete,
  onToast,
}) => {
  const count  = selectedIds.length;
  const plural = count !== 1 ? 's' : '';

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [confirmKind,  setConfirmKind]  = useState<ConfirmKind | null>(null);
  const [statusOpen,   setStatusOpen]   = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [moreOpen,     setMoreOpen]     = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpType, setFollowUpType] = useState<FollowUpType>('call');

  const statusRef   = useRef<HTMLDivElement>(null);
  const followUpRef = useRef<HTMLDivElement>(null);
  const moreRef     = useRef<HTMLDivElement>(null);

  // ── Keyboard: layered Escape (confirm → dropdowns → clear selection) ───────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmKind !== null) { setConfirmKind(null); return; }
      if (statusOpen || followUpOpen || moreOpen) {
        setStatusOpen(false); setFollowUpOpen(false); setMoreOpen(false);
        return;
      }
      onClearSelection();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [confirmKind, statusOpen, followUpOpen, moreOpen, onClearSelection]);

  // ── Outside-click: close all dropdowns ────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current   && !statusRef.current.contains(e.target as Node))   setStatusOpen(false);
      if (followUpRef.current && !followUpRef.current.contains(e.target as Node)) setFollowUpOpen(false);
      if (moreRef.current     && !moreRef.current.contains(e.target as Node))     setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Convert logic ──────────────────────────────────────────────────────────
  const convertibleLeads = selectedLeads.filter(l => l.status === 'qualified');
  const convertibleCount = convertibleLeads.length;
  const skippedCount     = count - convertibleCount;

  // ── Confirm dialog config ──────────────────────────────────────────────────
  const confirmMessages: Record<ConfirmKind, { title: string; message: string; label: string; type: 'warning' | 'danger' | 'info'; action: () => void }> = {
    convert: {
      title:   'Convert to Contacts',
      message: convertibleCount === 0
        ? 'No qualified leads are selected. Only leads with status "Qualified" can be converted.'
        : skippedCount > 0
          ? `Convert ${convertibleCount} qualified lead${convertibleCount !== 1 ? 's' : ''} to contacts? ${skippedCount} non-qualified lead${skippedCount !== 1 ? 's' : ''} will be skipped. This marks them as Converted.`
          : `Convert ${count} lead${plural} to contacts? This marks them as Converted.`,
      label:   'Convert',
      type:    'info',
      action:  () => onConvert(convertibleLeads.map(l => l.id)),
    },
    delete: {
      title:   'Delete Leads',
      message: `Permanently delete ${count} lead${plural}? This cannot be undone.`,
      label:   'Delete',
      type:    'danger',
      action:  onDelete,
    },
  };

  const handleConfirm = () => {
    if (!confirmKind) return;
    confirmMessages[confirmKind].action();
    setConfirmKind(null);
  };

  // ── Follow-up apply ────────────────────────────────────────────────────────
  const handleApplyFollowUp = () => {
    if (!followUpDate) return;
    onSetFollowUp(followUpDate, followUpType);
    setFollowUpOpen(false);
    setFollowUpDate('');
    setFollowUpType('call');
  };

  // ── Convert click ──────────────────────────────────────────────────────────
  const handleConvertClick = () => {
    if (convertibleCount === 0) {
      onToast('No qualified leads selected — only "Qualified" leads can be converted', 'info');
      return;
    }
    setConfirmKind('convert');
  };

  const cfg = confirmKind ? confirmMessages[confirmKind] : null;

  const menuItemCls = 'w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-50';

  return (
    <>
      {/* ── Positioned container ──────────────────────────────────────────── */}
      <div
        role="toolbar"
        aria-label={`${count} lead${plural} selected. Bulk actions toolbar.`}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2"
      >
        {/* ── Select-all banner ─────────────────────────────────────────── */}
        {isPageFullySelected && !areAllFiltered && totalFiltered > count && (
          <div className="bg-blue-600 text-white text-xs rounded-full px-4 py-1.5 shadow-lg flex items-center gap-2 whitespace-nowrap">
            <span>All {count} on this page selected.</span>
            <button
              onClick={onSelectAllFiltered}
              className="font-semibold underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-blue-600 rounded"
            >
              Select all {totalFiltered} filtered results
            </button>
          </div>
        )}
        {areAllFiltered && totalFiltered > 0 && (
          <div className="bg-blue-600 text-white text-xs rounded-full px-4 py-1.5 shadow-lg whitespace-nowrap">
            All {totalFiltered} filtered lead{totalFiltered !== 1 ? 's' : ''} selected.
          </div>
        )}

        {/* ── Main action bar ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 px-4 py-3 flex items-center gap-2">

          {/* Count + clear */}
          <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              {count} lead{plural} selected
            </span>
            <button
              onClick={onClearSelection}
              aria-label="Clear selection"
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ── Status ────────────────────────────────────────────────── */}
          <div className="relative" ref={statusRef}>
            <button
              onClick={() => { setStatusOpen(v => !v); setFollowUpOpen(false); setMoreOpen(false); }}
              aria-label="Change status"
              aria-haspopup="listbox"
              aria-expanded={statusOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Status <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {statusOpen && (
              <div
                role="listbox"
                aria-label="Lead status"
                className="absolute bottom-full left-0 mb-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10"
              >
                {ALL_STATUSES.map(s => (
                  <button
                    key={s.value}
                    role="option"
                    onClick={() => { onChangeStatus(s.value); setStatusOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 font-medium ${s.cls}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Follow-up date + type ──────────────────────────────────── */}
          <div className="relative" ref={followUpRef}>
            <button
              onClick={() => { setFollowUpOpen(v => !v); setStatusOpen(false); setMoreOpen(false); }}
              aria-label="Set follow-up date and type"
              aria-haspopup="dialog"
              aria-expanded={followUpOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Follow-up <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {followUpOpen && (
              <div
                role="dialog"
                aria-label="Set follow-up"
                className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10"
              >
                <p className="text-xs font-semibold text-gray-700 mb-3">
                  Set Follow-up for {count} Lead{plural}
                </p>

                <label className="block text-xs text-gray-500 mb-1" htmlFor="bulk-followup-date">
                  Date
                </label>
                <input
                  id="bulk-followup-date"
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />

                {/* Action type — UI only, not persisted to DB */}
                <label className="block text-xs text-gray-500 mb-1">
                  Action type
                </label>
                <div className="flex gap-1.5 mb-4" role="group" aria-label="Follow-up action type">
                  {(['call', 'email', 'meeting'] as FollowUpType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setFollowUpType(t)}
                      aria-pressed={followUpType === t}
                      className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
                        followUpType === t
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleApplyFollowUp}
                  disabled={!followUpDate}
                  className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Set Follow-up
                </button>
              </div>
            )}
          </div>

          {/* ── Export ────────────────────────────────────────────────── */}
          <button
            onClick={onExport}
            aria-label={`Export ${count} selected lead${plural} as CSV`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>

          {/* ── Convert ───────────────────────────────────────────────── */}
          <button
            onClick={handleConvertClick}
            aria-label={`Convert ${convertibleCount} qualified lead${convertibleCount !== 1 ? 's' : ''} to contacts`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <ArrowRightCircle className="h-3.5 w-3.5" />
            Convert{convertibleCount > 0 && convertibleCount < count ? ` (${convertibleCount})` : ''}
          </button>

          {/* ── Archive ───────────────────────────────────────────────── */}
          <button
            onClick={() => onOpenTerminalModal('lost')}
            aria-label={`Archive ${count} selected lead${plural}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-200 rounded-lg text-sm font-medium text-gray-600 hover:text-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </button>

          {/* ── More ▾ ────────────────────────────────────────────────── */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => { setMoreOpen(v => !v); setStatusOpen(false); setFollowUpOpen(false); }}
              aria-label="More bulk actions"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <MoreHorizontal className="h-4 w-4" />
              More
            </button>
            {moreOpen && (
              <div
                role="menu"
                aria-label="More bulk actions"
                className="absolute bottom-full right-0 mb-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10"
              >
                {/* Stubs */}
                <button
                  role="menuitem"
                  onClick={() => { onToast('Assign owner — coming soon', 'info'); setMoreOpen(false); }}
                  className={`${menuItemCls} text-gray-700`}
                >
                  <UserCheck className="h-3.5 w-3.5 shrink-0" /> Assign Owner
                </button>
                <button
                  role="menuitem"
                  onClick={() => { onToast('Bulk tagging — coming soon', 'info'); setMoreOpen(false); }}
                  className={`${menuItemCls} text-gray-700`}
                >
                  <Tag className="h-3.5 w-3.5 shrink-0" /> Add / Remove Tags
                </button>
                <button
                  role="menuitem"
                  onClick={() => { onToast('Bulk enrichment — coming soon', 'info'); setMoreOpen(false); }}
                  className={`${menuItemCls} text-gray-700`}
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" /> Enrich Selected
                </button>
                <button
                  role="menuitem"
                  onClick={() => { onToast('Merge review queue — coming soon', 'info'); setMoreOpen(false); }}
                  className={`${menuItemCls} text-gray-700`}
                >
                  <GitMerge className="h-3.5 w-3.5 shrink-0" /> Merge Review Queue
                </button>

                <div className="my-1 border-t border-gray-100" />

                <button
                  role="menuitem"
                  onClick={() => { onOpenTerminalModal('disqualified'); setMoreOpen(false); }}
                  className={`${menuItemCls} text-orange-600 hover:bg-orange-50`}
                >
                  <XCircle className="h-3.5 w-3.5 shrink-0" /> Mark Disqualified
                </button>

                <div className="my-1 border-t border-gray-100" />

                <button
                  role="menuitem"
                  onClick={() => { setConfirmKind('delete'); setMoreOpen(false); }}
                  className={`${menuItemCls} text-red-600 hover:bg-red-50`}
                >
                  <Trash2 className="h-3.5 w-3.5 shrink-0" /> Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Confirm dialog ────────────────────────────────────────────────── */}
      {cfg && (
        <ConfirmationModal
          isOpen={confirmKind !== null}
          title={cfg.title}
          message={cfg.message}
          confirmLabel={cfg.label}
          type={cfg.type}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmKind(null)}
        />
      )}
    </>
  );
};

export default BulkActionBar;
