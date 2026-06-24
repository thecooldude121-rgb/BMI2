import React from 'react';
import type { ConversionReadinessState } from '../../utils/conversionReadiness';

// ── Color tokens per state ────────────────────────────────────────────────────

const STATE_META: Record<ConversionReadinessState, { label: string; cls: string }> = {
  ready_for_deal:            { label: 'Deal ready',        cls: 'bg-green-100 text-green-700 border-green-200'  },
  ready_for_account_contact: { label: 'Acct + contact',    cls: 'bg-teal-100  text-teal-700  border-teal-200'   },
  ready_for_contact:         { label: 'Contact ready',     cls: 'bg-blue-100  text-blue-700  border-blue-200'   },
  needs_qualification:       { label: 'Needs qualification', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  needs_enrichment:          { label: 'Needs enrichment',  cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  not_ready:                 { label: 'Not ready',         cls: 'bg-gray-100  text-gray-500  border-gray-200'   },
};

// Statuses where the badge adds noise and should be hidden
const HIDDEN_STATUSES = new Set(['lost', 'disqualified', 'converted']);

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConversionReadinessBadge({
  state,
  leadStatus,
}: {
  state:      ConversionReadinessState;
  leadStatus: string;
}) {
  if (HIDDEN_STATUSES.has(leadStatus)) return null;

  const { label, cls } = STATE_META[state];
  return (
    <span
      className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full border leading-tight ${cls}`}
      title={`Conversion readiness: ${label}`}
    >
      {label}
    </span>
  );
}
