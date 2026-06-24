import React from 'react';
import { X, CheckCircle, XCircle, ArrowRight, Building2, UserPlus, TrendingUp, AlertCircle } from 'lucide-react';
import type { Lead } from '../../types/lead';
import type { ConversionReadinessResult, ConversionReadinessState } from '../../utils/conversionReadiness';

// ── Color tokens ──────────────────────────────────────────────────────────────

const STATE_CHIP: Record<ConversionReadinessState, string> = {
  ready_for_deal:            'bg-green-100 text-green-700 border-green-200',
  ready_for_account_contact: 'bg-teal-100  text-teal-700  border-teal-200',
  ready_for_contact:         'bg-blue-100  text-blue-700  border-blue-200',
  needs_qualification:       'bg-amber-100 text-amber-700 border-amber-200',
  needs_enrichment:          'bg-orange-100 text-orange-700 border-orange-200',
  not_ready:                 'bg-gray-100  text-gray-500  border-gray-200',
};

// ── Checklist row ─────────────────────────────────────────────────────────────

function CheckRow({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {met
        ? <CheckCircle size={13} className="text-green-500 shrink-0" />
        : <XCircle    size={13} className="text-gray-300  shrink-0" />
      }
      <span className={met ? 'text-gray-800' : 'text-gray-400'}>{label}</span>
    </div>
  );
}

// ── Path button ───────────────────────────────────────────────────────────────

function PathButton({
  icon, title, description, variant, onClick,
}: {
  icon:        React.ReactNode;
  title:       string;
  description: string;
  variant:     'primary' | 'secondary';
  onClick:     () => void;
}) {
  const base = 'w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors';
  const cls  =
    variant === 'primary'
      ? `${base} bg-green-600 border-green-600 text-white hover:bg-green-700`
      : `${base} bg-white border-gray-200 text-gray-700 hover:bg-gray-50`;

  return (
    <button className={cls} onClick={onClick}>
      <span className={`shrink-0 ${variant === 'primary' ? 'text-white' : 'text-gray-400'}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${variant === 'primary' ? 'text-white' : 'text-gray-800'}`}>
          {title}
        </p>
        <p className={`text-xs mt-0.5 ${variant === 'primary' ? 'text-green-100' : 'text-gray-500'}`}>
          {description}
        </p>
      </div>
      <ArrowRight size={14} className={variant === 'primary' ? 'text-green-200' : 'text-gray-300'} />
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ConversionWorkflowModalProps {
  lead:                   Lead;
  readiness:              ConversionReadinessResult;
  isOpen:                 boolean;
  onClose:                () => void;
  onCreateContact:        () => void;
  onCreateAccountContact: () => void;
  onCreateDeal:           () => void;
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function ConversionWorkflowModal({
  lead, readiness, isOpen, onClose,
  onCreateContact, onCreateAccountContact, onCreateDeal,
}: ConversionWorkflowModalProps) {
  if (!isOpen) return null;

  const displayName = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';
  const { state, label, checklist, reasons } = readiness;

  const isSalesAccepted           = lead.status === 'sales_accepted';
  const isReadyForDeal            = state === 'ready_for_deal';
  const isReadyForAccountContact  = state === 'ready_for_account_contact';
  const isReadyForContact         = state === 'ready_for_contact';
  const hasAnyPath = isReadyForDeal || isReadyForAccountContact || isReadyForContact;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0 pr-3">
            <h2 className="text-base font-bold text-gray-900">Convert Lead</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate">{displayName}</p>
            {lead.company && (
              <p className="text-xs text-gray-400 truncate">{lead.company}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATE_CHIP[state]}`}>
              {label}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Sales-accepted banner */}
          {isSalesAccepted && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-2.5">
              <p className="text-xs font-semibold text-teal-800">
                Sales-accepted lead — finalize conversion to close the loop.
              </p>
            </div>
          )}

          {/* Readiness checklist */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">
              Readiness Checklist
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {checklist.map((item, i) => (
                <CheckRow key={i} label={item.label} met={item.met} />
              ))}
            </div>
          </div>

          {/* Blockers / reasons */}
          {reasons.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 space-y-1">
              {reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-800">
                  <AlertCircle size={12} className="shrink-0 mt-0.5 text-amber-500" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Conversion paths */}
          {hasAnyPath ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">
                Conversion Paths
              </p>
              <div className="space-y-2">

                {/* Create Deal (only when ready_for_deal) */}
                {isReadyForDeal && (
                  <PathButton
                    icon={<TrendingUp size={16} />}
                    title="Create Deal"
                    description="Creates deal + contact + account — recommended path"
                    variant="primary"
                    onClick={onCreateDeal}
                  />
                )}

                {/* Create Account + Contact */}
                {(isReadyForDeal || isReadyForAccountContact) && (
                  <PathButton
                    icon={<Building2 size={16} />}
                    title="Create Account + Contact"
                    description="Links contact to a new or existing account"
                    variant={isReadyForAccountContact ? 'primary' : 'secondary'}
                    onClick={onCreateAccountContact}
                  />
                )}

                {/* Create Contact only */}
                <PathButton
                  icon={<UserPlus size={16} />}
                  title="Create Contact"
                  description={
                    isReadyForContact && !isReadyForAccountContact && !isReadyForDeal
                      ? 'Creates a contact record from this lead'
                      : 'Contact only — no account or deal created'
                  }
                  variant={isReadyForContact && !isReadyForAccountContact && !isReadyForDeal ? 'primary' : 'secondary'}
                  onClick={onCreateContact}
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-4 text-center">
              <p className="text-sm font-semibold text-gray-700 mb-1">Not ready to convert</p>
              <p className="text-xs text-gray-500">
                Address the items above before converting this lead.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
