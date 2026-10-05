import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Download, Archive, XCircle, Trash2, CalendarDays } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Lead } from '../../types/lead';
import ConfirmationModal from '../common/ConfirmationModal';
import { inputClass } from '../ui/Field';
import { localToday } from '../../utils/leadFollowUp';

/**
 * The bulk bar — Figma "Bulk bar" (61:157): an inline indigo bar above the
 * table, white-surface action buttons, Delete tinted red. Rebuilt 2026-10-05
 * (phase 3, slice 3B-2). Behaviour changes, each because the old control lied:
 *
 *   - CONVERT is "Convert unavailable", disabled. It opened a confirmation
 *     promising "Convert N leads to contacts? This marks them as Converted.",
 *     and confirming produced "not available yet". Conversion is per lead,
 *     through the wizard (POST /leads/:id/convert).
 *   - SET FOLLOW-UP creates one follow-up TASK per selected lead (Group B item
 *     11). Before that it wrote a column that did not exist and said "Follow-up
 *     set for N leads".
 *   - The "More" menu's Assign owner / Tags / Enrich / Merge review queue only
 *     toasted "coming soon" on click; they are gone from the bar (the frame does
 *     not show them; each is a tracked item).
 *   - The status menu no longer offers Converted (the server always refuses —
 *     USE_CONVERSION) or Disqualified / Lost, which need a reason: those go
 *     through their own buttons, which collect one.
 *
 * The page runs each write and reports what the SERVER did (LeadsPage.runBulk).
 */

export type FollowUpType = 'call' | 'email' | 'meeting';

export type BulkActionBarProps = {
  selectedIds:         string[];
  selectedLeads:       Lead[];
  totalFiltered:       number;
  isPageFullySelected: boolean;
  areAllFiltered:      boolean;
  onSelectAllFiltered: () => void;
  onClearSelection:    () => void;
  onChangeStatus:      (status: Lead['status']) => void;
  /** Creates one follow-up task per selected lead (the page awaits each). */
  onSetFollowUp:       (date: string, type: FollowUpType) => void;
  onExport:            () => void;
  /** Kept for the page's handler; bulk conversion is not offered. */
  onConvert:           (ids: string[]) => void;
  onArchive:           () => void;
  onDisqualify:        () => void;
  onOpenTerminalModal: (action: 'disqualified' | 'lost') => void;
  onDelete:            () => void;
  onToast:             (msg: string, type?: 'success' | 'info' | 'error') => void;
  canConvert:          boolean;
  canDelete:           boolean;
};

/** Stages a bulk move may target directly (see the note above). */
const BULK_STATUSES: Array<{ value: Lead['status']; label: string }> = [
  { value: 'new',                label: 'New' },
  { value: 'assigned',           label: 'Assigned' },
  { value: 'enriching',          label: 'Enriching' },
  { value: 'attempting_contact', label: 'Attempting contact' },
  { value: 'engaged',            label: 'Engaged' },
  { value: 'qualified',          label: 'Qualified' },
  { value: 'sales_accepted',     label: 'Sales accepted' },
  { value: 'nurture',            label: 'Nurture' },
];

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedIds,
  onClearSelection,
  onChangeStatus,
  onSetFollowUp,
  onExport,
  onOpenTerminalModal,
  onDelete,
  canDelete,
}) => {
  const count  = selectedIds.length;
  const plural = count !== 1 ? 's' : '';

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusOpen,    setStatusOpen]    = useState(false);
  const [followUpOpen,  setFollowUpOpen]  = useState(false);
  const [followUpDate,  setFollowUpDate]  = useState('');
  const statusRef = useRef<HTMLDivElement>(null);
  const followUpRef = useRef<HTMLDivElement>(null);

  // Layered Escape: confirm dialog → status menu → clear the selection.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmDelete) { setConfirmDelete(false); return; }
      if (statusOpen || followUpOpen) { setStatusOpen(false); setFollowUpOpen(false); return; }
      onClearSelection();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [confirmDelete, statusOpen, followUpOpen, onClearSelection]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (followUpRef.current && !followUpRef.current.contains(e.target as Node)) setFollowUpOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <div
        role="toolbar"
        aria-label={`${count} lead${plural} selected. Bulk actions toolbar.`}
        className="flex flex-col gap-2 rounded-card bg-brand-900 p-2.5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 pr-1 text-sm font-semibold text-white">
            {count} selected
            <button
              type="button"
              onClick={onClearSelection}
              aria-label="Clear selection"
              className="rounded p-0.5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>

          <div className="relative" ref={statusRef}>
            <Button variant="secondary" onClick={() => setStatusOpen(v => !v)}
              aria-haspopup="menu" aria-expanded={statusOpen}
              trailingIcon={<ChevronDown className="h-3.5 w-3.5" />}>
              Set status
            </Button>
            {statusOpen && (
              <div role="menu" aria-label="Lead status"
                className="absolute left-0 top-full z-20 mt-1 w-48 rounded-card border border-line bg-surface-panel py-1 shadow-lg">
                {BULK_STATUSES.map(s => (
                  <button key={s.value} role="menuitem" type="button"
                    onClick={() => { onChangeStatus(s.value); setStatusOpen(false); }}
                    className="w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-black/5">
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Real since Group B item 11: one follow-up task per selected lead. */}
          <div className="relative" ref={followUpRef}>
            <Button variant="secondary" onClick={() => setFollowUpOpen(v => !v)} aria-haspopup="dialog" aria-expanded={followUpOpen}
              leadingIcon={<CalendarDays className="h-3.5 w-3.5" />}>
              Set follow-up
            </Button>
            {followUpOpen && (
              <div role="dialog" aria-label="Set follow-up"
                className="absolute left-0 top-full z-20 mt-1 flex w-64 flex-col gap-2 rounded-card border border-line bg-surface-panel p-3 shadow-lg">
                <label className="flex flex-col gap-1 text-xs font-semibold text-ink">
                  Due on
                  <input type="date" min={localToday()} value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className={inputClass()} />
                </label>
                <p className="text-xs text-ink-muted">Creates a follow-up task for each of the {count} selected lead{plural}.</p>
                <Button size="sm" disabled={!followUpDate}
                  onClick={() => { onSetFollowUp(followUpDate, 'call'); setFollowUpOpen(false); setFollowUpDate(''); }}>
                  Set for {count} lead{plural}
                </Button>
              </div>
            )}
          </div>

          <Button variant="secondary" onClick={onExport}
            aria-label={`Export ${count} selected lead${plural} as CSV`}
            leadingIcon={<Download className="h-3.5 w-3.5" />}>
            Export
          </Button>

          <Button variant="secondary" disabled
            title="Convert leads one at a time from the lead's record — bulk conversion is not available">
            Convert unavailable
          </Button>

          <Button variant="secondary" onClick={() => onOpenTerminalModal('lost')}
            leadingIcon={<Archive className="h-3.5 w-3.5" />}>
            Archive / Lost
          </Button>

          <Button variant="secondary" onClick={() => onOpenTerminalModal('disqualified')}
            leadingIcon={<XCircle className="h-3.5 w-3.5" />}>
            Disqualify
          </Button>

          {canDelete && (
            <Button variant="secondary" onClick={() => setConfirmDelete(true)}
              leadingIcon={<Trash2 className="h-3.5 w-3.5" />}
              className="!bg-danger-100 !text-danger-700 hover:!bg-danger-50">
              Delete
            </Button>
          )}
        </div>

        {/* No "Select all N filtered results": with numbered pages only the rows on
            this page are loaded, so it would claim leads it never selected.
            Selecting across pages needs a server-side bulk action. */}
      </div>

      <ConfirmationModal
        isOpen={confirmDelete}
        title="Delete leads"
        message={`Permanently delete ${count} lead${plural}? This cannot be undone.`}
        confirmLabel="Delete"
        type="danger"
        onConfirm={() => { setConfirmDelete(false); onDelete(); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
};

export default BulkActionBar;
