// Guided 4-step lead conversion wizard.
// Replaces the thin ConversionWorkflowModal routing shim.
// TODO: replace stub ID generation with real entity-creation API calls when available.
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';
import {
  X, UserPlus, Building2, TrendingUp, Link2,
  CheckCircle, XCircle, AlertCircle, ArrowRight, Loader2, Check,
} from 'lucide-react';
import type { Lead } from '../../types/lead';
import type { ConversionReadinessResult, ConversionReadinessState } from '../../utils/conversionReadiness';
import { TEAM_MEMBERS } from '../../utils/leadOwnerRouting';
import { useLeads } from '../../contexts/LeadContext';
import { findDuplicates, computeRisk } from '../../utils/leadDuplicates';
import { getPlaybook } from '../../utils/leadSourcePlaybook';

// ── Types ──────────────────────────────────────────────────────────────────────

export type WizardPath =
  | 'contact'
  | 'contact_account'
  | 'contact_account_deal'
  | 'link_existing';

type WizardStep = 1 | 2 | 3 | 4;

interface ConversionResult {
  contactId:    string;
  contactName:  string;
  accountId?:   string;
  accountName?: string;
  dealId?:      string;
  dealName?:    string;
  ownerLabel:   string;
  carriedOver:  string[];
  isLinked:     boolean;
}

export interface LeadConversionWizardProps {
  lead:         Lead;
  readiness:    ConversionReadinessResult;
  isOpen:       boolean;
  onClose:      () => void;
  /** Must report whether the write was accepted. Returning void is how this
   *  wizard used to show "Conversion complete" for a rejected 400. */
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<boolean>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const NEEDS_ACK = new Set<ConversionReadinessState>([
  'not_ready', 'needs_enrichment', 'needs_qualification', 'ready_for_contact',
]);

const WARN_TEXT: Partial<Record<ConversionReadinessState, string>> = {
  not_ready:           'This lead does not meet the minimum conversion criteria. Verify this is the right action.',
  needs_enrichment:    'Data confidence is low — enriching the profile first is recommended.',
  needs_qualification: 'This lead is not yet formally qualified. Qualify before converting for best results.',
  ready_for_contact:   'Only a contact record can be created — company info is missing for an account.',
};

const DEAL_STAGES = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won'];

// Static mock accounts — used for "link to existing" dropdown.
// TODO: replace with live account search when search API exists.
// ── Pure helpers ───────────────────────────────────────────────────────────────

function defaultPath(state: ConversionReadinessState, source?: string): WizardPath {
  const playbook = getPlaybook(source);
  // HRMS and other noDealPath sources are locked to contact-only
  if (playbook.noDealPath) return 'contact';
  // Playbook's preferred path takes precedence unless readiness says deal is ready
  if (state === 'ready_for_deal') return 'contact_account_deal';
  return playbook.conversionPath;
}

function defaultDealName(lead: Lead): string {
  const name = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ');
  return lead.company ? `${lead.company} — ${name}` : name;
}

function leadDisplayName(lead: Lead): string {
  return lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';
}

// buildSuggestions() lived here. Both of its branches were fabricated: contacts
// came from DataContext (which seeds React state from generateSampleData() and
// never touches the network) and accounts came from a MOCK_ACCOUNTS array defined
// in this file — five invented companies, ids 'acc_mock_1'..'acc_mock_5'. Its
// matching was also far weaker than the real engine: contacts matched on email
// DOMAIN EQUALITY alone, which flags every colleague at a shared domain, capped
// arbitrarily at two; accounts matched on bidirectional substring containment of
// the company name.
//
// Removed rather than repointed. Real match suggestions need contact and account
// SEARCH ENDPOINTS that do not exist yet — see HANDOFF.md for the scoped item.
// The real lead-vs-lead duplicate detection (findDuplicates from
// utils/leadDuplicates, a tested 4-signal engine running against LeadContext's
// API-backed leads) is untouched and still gates step 2.

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Path',
  2: 'Duplicates',
  3: 'Configure',
  4: 'Result',
};

function StepIndicator({ current }: { current: WizardStep }) {
  const steps: WizardStep[] = [1, 2, 3, 4];
  return (
    <div className="flex items-center gap-0 px-6 pt-5 pb-4 shrink-0">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
              s < current  ? 'bg-brand-600 text-white'
              : s === current ? 'bg-brand-600 text-white ring-2 ring-blue-200'
              : 'bg-gray-100 text-gray-400'
            }`}>
              {s < current ? <Check size={10} /> : s}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap ${
              s === current ? 'text-blue-600' : s < current ? 'text-gray-500' : 'text-gray-300'
            }`}>
              {STEP_LABELS[s]}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 mb-4 ${s < current ? 'bg-blue-300' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Path card ─────────────────────────────────────────────────────────────────

interface PathCardProps {
  icon:        React.ReactNode;
  title:       string;
  description: string;
  selected:    boolean;
  recommended: boolean;
  onClick:     () => void;
  /** Renders the card inert with a reason, for a path that is not built yet.
   *  A selectable option that cannot work is worse than a visibly disabled one. */
  disabled?:   boolean;
  disabledNote?: string;
}

function PathCard({ icon, title, description, selected, recommended, onClick, disabled, disabledNote }: PathCardProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      title={disabled ? disabledNote : undefined}
      className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
        disabled
          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
          : selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <span className={`p-2 rounded-lg shrink-0 ${selected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${selected ? 'text-blue-800' : 'text-gray-800'}`}>
            {title}
          </span>
          {recommended && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">
              Recommended
            </span>
          )}
        </div>
        <p className={`text-xs mt-0.5 ${selected ? 'text-blue-600' : 'text-gray-500'}`}>{description}</p>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
        selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
      }`}>
        {selected && <Check size={9} className="text-white" />}
      </div>
    </button>
  );
}

// ── Checklist row ─────────────────────────────────────────────────────────────

function CheckRow({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {met
        ? <CheckCircle size={11} className="text-green-500 shrink-0" />
        : <XCircle    size={11} className="text-gray-300  shrink-0" />}
      <span className={met ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function LeadConversionWizard({
  lead, readiness, isOpen, onClose, onUpdateLead,
}: LeadConversionWizardProps) {
  const { leads: allLeads, lastWriteErrorRef } = useLeads();

  // ── Duplicate detection (for Step 2 high-risk gating) ─────────────────────
  const leadDuplicateCandidates = useMemo(
    () => findDuplicates(lead, allLeads ?? []),
    [lead, allLeads],
  );
  const leadDuplicateRisk = computeRisk(leadDuplicateCandidates);

  // ── State ──────────────────────────────────────────────────────────────────

  const [step,        setStep]        = useState<WizardStep>(1);
  const [path,        setPath]        = useState<WizardPath>(() => defaultPath(readiness.state, lead.source));
  const [notReadyAck, setNotReadyAck] = useState(false);

  // Step 2
  const [dupDismissed,    setDupDismissed]    = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [linkedContactId, setLinkedContactId] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState('');

  // Step 3
  const [ownerId,    setOwnerId]    = useState(lead.owner_id ?? TEAM_MEMBERS[0]?.id ?? '');
  const [carryTags,  setCarryTags]  = useState(true);
  const [carryNotes, setCarryNotes] = useState(true);
  const [carryActs,  setCarryActs]  = useState(false);
  const [dealName,   setDealName]   = useState(() => defaultDealName(lead));
  const [dealValue,  setDealValue]  = useState(lead.estimated_value ?? 0);
  const [dealStage,  setDealStage]  = useState('Prospecting');

  // Step 4
  const [result,     setResult]     = useState<ConversionResult | null>(null);
  const [converting, setConverting] = useState(false);

  // Reset everything when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPath(defaultPath(readiness.state, lead.source));
      setNotReadyAck(false);
      setDupDismissed(false);
      setLinkedContactId('');
      setLinkedAccountId('');
      setConvertError(null);
      setOwnerId(lead.owner_id ?? TEAM_MEMBERS[0]?.id ?? '');
      setCarryTags(true);
      setCarryNotes(true);
      setCarryActs(false);
      setDealName(defaultDealName(lead));
      setDealValue(lead.estimated_value ?? 0);
      setDealStage('Prospecting');
      setResult(null);
      setConverting(false);
    }
  }, [isOpen]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const sourcePlaybook = getPlaybook(lead.source);
  const isNoDealPath   = !!sourcePlaybook.noDealPath;

  const needsAck      = NEEDS_ACK.has(readiness.state);
  const step1Disabled = needsAck && !notReadyAck;
  const hasCompany    = !!lead.company?.trim();

  const includesAccount = path === 'contact_account' || path === 'contact_account_deal';
  const includesDeal    = path === 'contact_account_deal';
  const isLinkExisting  = path === 'link_existing';

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleConvert = useCallback(async () => {
    setConverting(true);
    setConvertError(null);
    try {
      const ts = Date.now();
      const contactId = (isLinkExisting && linkedContactId) ? linkedContactId : `cnt_${ts}`;
      const accountId = !includesAccount && !isLinkExisting ? undefined
        : (isLinkExisting && linkedAccountId) ? linkedAccountId
        : includesAccount ? `acc_${ts}` : undefined;
      const dealId    = includesDeal ? `deal_${ts}` : undefined;

      const ownerMember = TEAM_MEMBERS.find(m => m.id === ownerId);
      const carriedOver: string[] = [];
      if (carryTags  && lead.tags?.length > 0)   carriedOver.push('Tags');
      if (carryNotes && lead.quick_notes)          carriedOver.push('Notes');
      if (carryActs  && (lead.call_count > 0 || lead.email_sent_count > 0)) {
        carriedOver.push('Activities');
      }

      const res: ConversionResult = {
        contactId,
        contactName:  leadDisplayName(lead),
        accountId,
        accountName:  accountId ? (lead.company ?? 'Account') : undefined,
        dealId,
        dealName:     dealId ? dealName : undefined,
        ownerLabel:   ownerMember?.label ?? ownerId,
        carriedOver,
        isLinked:     isLinkExisting,
      };

      // The write decides what the user is told. This previously ignored the
      // result and advanced to step 4 unconditionally, so a rejected 400 produced
      // a "Conversion complete" screen naming a contact and account that were
      // never created. Lead conversion is not implemented server-side at all (no
      // converted_* columns, and 'converted' is not a valid stage), so today this
      // branch is ALWAYS the one that runs.
      const accepted = await onUpdateLead(lead.id, {
        status:                  'converted',
        converted_at:            new Date().toISOString(),
        converted_to_contact_id: contactId,
        ...(dealId    ? { converted_to_deal_id: dealId }  : {}),
        ...(accountId ? { account_id: accountId }         : {}),
      } as Partial<Lead>);

      if (!accepted) {
        // Read through the ref: state set during the await is not visible to this
        // closure, so `lastWriteError` would still be null here.
        setConvertError(
          lastWriteErrorRef.current ??
          'The server rejected the conversion and nothing was saved.'
        );
        return;
      }

      setResult(res);
      setStep(4);
    } finally {
      setConverting(false);
    }
  }, [
    lead, isLinkExisting, linkedContactId, linkedAccountId,
    includesAccount, includesDeal, ownerId, carryTags, carryNotes, carryActs,
    dealName, onUpdateLead, lastWriteErrorRef,
  ]);

  if (!isOpen) return null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget && step !== 4) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Convert Lead</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {leadDisplayName(lead)}{lead.company ? ` · ${lead.company}` : ''}
            </p>
          </div>
          {step < 4 && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Step indicator */}
        {step < 4 && <StepIndicator current={step} />}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">

          {/* ── STEP 1: PATH ──────────────────────────────────────────────── */}
          {step === 1 && (
            <>
              {/* Readiness */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Conversion Readiness
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    readiness.state === 'ready_for_deal'            ? 'bg-green-100 text-green-700'
                    : readiness.state === 'ready_for_account_contact' ? 'bg-teal-100 text-teal-700'
                    : readiness.state === 'ready_for_contact'         ? 'bg-blue-100 text-blue-700'
                    : readiness.state === 'needs_qualification'       ? 'bg-amber-100 text-amber-700'
                    : readiness.state === 'needs_enrichment'          ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-500'
                  }`}>
                    {readiness.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {readiness.checklist.map((item, i) => (
                    <CheckRow key={i} label={item.label} met={item.met} />
                  ))}
                </div>
              </div>

              {/* Soft warning + ack checkbox */}
              {needsAck && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {WARN_TEXT[readiness.state] ?? 'This lead may not be ready to convert.'}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={notReadyAck}
                      onChange={e => setNotReadyAck(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-amber-500"
                    />
                    <span className="text-xs text-amber-800 font-medium">
                      I understand this lead may not be fully ready — proceed anyway.
                    </span>
                  </label>
                </div>
              )}

              {/* Path selection */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">
                  Choose Conversion Path
                </p>

                {/* HRMS / noDealPath note */}
                {isNoDealPath && (
                  <div className="mb-3 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
                    <AlertCircle size={12} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-800">
                      {sourcePlaybook.displayName} leads are typically candidates or internal contacts — deal creation is not applicable.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <PathCard
                    icon={<UserPlus size={15} />}
                    title="Create Contact"
                    description="Create a contact record only — no account or deal"
                    selected={path === 'contact'}
                    recommended={readiness.state === 'ready_for_contact' || isNoDealPath}
                    onClick={() => setPath('contact')}
                  />
                  {!isNoDealPath && (
                    <PathCard
                      icon={<Building2 size={15} />}
                      title="Create Contact + Account"
                      description={hasCompany ? `Links contact to a new ${lead.company} account` : 'Add a company name to enable this path'}
                      selected={path === 'contact_account'}
                      recommended={readiness.state === 'ready_for_account_contact'}
                      onClick={() => setPath('contact_account')}
                    />
                  )}
                  {!isNoDealPath && (
                    <PathCard
                      icon={<TrendingUp size={15} />}
                      title="Create Contact + Account + Deal"
                      description={hasCompany ? 'Creates all three — recommended for qualified leads' : 'Add a company name to enable this path'}
                      selected={path === 'contact_account_deal'}
                      recommended={readiness.state === 'ready_for_deal'}
                      onClick={() => setPath('contact_account_deal')}
                    />
                  )}
                  <PathCard
                    icon={<Link2 size={15} />}
                    title={isNoDealPath ? 'Link to Existing Contact' : 'Link to Existing'}
                    description={isNoDealPath ? 'Attach this lead to an existing contact record' : 'Attach this lead to an existing contact and/or account'}
                    selected={path === 'link_existing'}
                    recommended={false}
                    onClick={() => setPath('link_existing')}
                    disabled
                    disabledNote="Needs contact and account search against the database — not built yet."
                  />
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: DUPLICATES ────────────────────────────────────────── */}
          {step === 2 && (
            <>
              {isLinkExisting ? (
                /* Link to existing — UNAVAILABLE. The contact picker read
                   DataContext (sample-seeded, never networked) and the account
                   picker read a MOCK_ACCOUNTS array in this file. Removing the
                   fiction leaves nothing real to offer, so the path is disabled
                   and labelled rather than populated — the same treatment as a
                   dead view toggle. Needs contact/account search endpoints. */
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Find Existing Records
                  </p>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">
                        Linking to existing records is not available yet
                      </p>
                      <p className="text-[11px] text-amber-700 mt-1">
                        This needs contact and account search against the database. The
                        pickers here previously listed sample data, so anything selected
                        would not have referred to a real record. Choose one of the other
                        paths on the previous step.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Real lead-vs-lead duplicate detection */
                <div className="space-y-4">
                  {/* High-risk lead duplicate gating */}
                  {leadDuplicateRisk === 'high' && !dupDismissed && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-red-800">High-confidence duplicate detected</p>
                          <p className="text-[11px] text-red-700 mt-0.5">
                            {leadDuplicateCandidates[0]?.signals[0]?.reason ?? 'Existing lead matches key fields.'}
                            {' '}Consider merging instead.
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dupDismissed}
                          onChange={e => setDupDismissed(e.target.checked)}
                          className="rounded border-red-400 text-red-600"
                        />
                        <span className="text-xs text-red-700">
                          I've reviewed the potential duplicate — proceed with conversion
                        </span>
                      </label>
                    </div>
                  )}

                  {/* The fabricated "Match Suggestions" panel was here — see the note
                      at the top of this file. What remains is the real thing:
                      lead-vs-lead duplicate detection from utils/leadDuplicates,
                      whose high-risk result gates this step just above. */}
                  {leadDuplicateRisk !== 'high' && (
                    <div className="py-6 text-center">
                      <CheckCircle className="h-8 w-8 text-green-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 font-medium">
                        No high-confidence duplicate leads
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Checked against your existing leads on email, phone, company domain
                        and name. Matching against existing contacts and accounts needs
                        search endpoints that are not built yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: CONFIGURE ─────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Owner */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Owner</label>
                <select aria-label="Owner"
                  value={ownerId}
                  onChange={e => setOwnerId(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-white"
                >
                  {TEAM_MEMBERS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Carry-over */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Carry Over</p>
                <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-3">
                  {[
                    { label: `Tags (${lead.tags?.length ?? 0})`,       checked: carryTags,  set: setCarryTags,  disabled: !lead.tags?.length },
                    { label: 'Quick notes',                             checked: carryNotes, set: setCarryNotes, disabled: !lead.quick_notes  },
                    { label: 'Activity history (as related records)',   checked: carryActs,  set: setCarryActs,  disabled: false              },
                  ].map(({ label, checked, set, disabled }) => (
                    <label key={label} className={`flex items-center gap-2.5 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={checked && !disabled}
                        disabled={disabled}
                        onChange={e => set(e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-blue-500"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Deal fields — only if path includes deal */}
              {includesDeal && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Deal Details</p>
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Deal Name</label>
                      <input aria-label="Deal Name"
                        type="text"
                        value={dealName}
                        onChange={e => setDealName(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Est. Value</label>
                        <input aria-label="Est. Value"
                          type="number"
                          min={0}
                          value={dealValue}
                          onChange={e => setDealValue(Number(e.target.value))}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Stage</label>
                        <select aria-label="Stage"
                          value={dealStage}
                          onChange={e => setDealStage(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-white"
                        >
                          {DEAL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: RESULT ────────────────────────────────────────────── */}
          {step === 4 && result && (
            <div className="space-y-4 pt-2">
              {/* Success banner */}
              <div className="flex flex-col items-center py-6">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Conversion complete</h3>
                <p className="text-sm text-gray-500 mt-1 text-center">
                  {result.isLinked ? 'Lead linked to existing records' : 'New records created successfully'}
                </p>
              </div>

              {/* What was created */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {result.isLinked ? 'Linked Records' : 'Created Records'}
                </p>

                <div className="space-y-2.5">
                  {/* Contact */}
                  <div className="flex items-center gap-3">
                    <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600 shrink-0">
                      <UserPlus size={12} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800">{result.contactName}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{result.contactId}</p>
                    </div>
                    <button
                      onClick={() => window.open(`/crm/contacts/${result.contactId}`, '_self')}
                      className="text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5 shrink-0"
                    >
                      View <ArrowRight size={9} />
                    </button>
                  </div>

                  {/* Account */}
                  {result.accountId && (
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 rounded-lg bg-teal-100 text-teal-600 shrink-0">
                        <Building2 size={12} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800">{result.accountName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{result.accountId}</p>
                      </div>
                      <button
                        onClick={() => window.open(`/crm/accounts/${result.accountId}`, '_self')}
                        className="text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5 shrink-0"
                      >
                        View <ArrowRight size={9} />
                      </button>
                    </div>
                  )}

                  {/* Deal */}
                  {result.dealId && (
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 rounded-lg bg-green-100 text-green-600 shrink-0">
                        <TrendingUp size={12} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800">{result.dealName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{result.dealId}</p>
                      </div>
                      <button
                        onClick={() => window.open(`/crm/deals/${result.dealId}`, '_self')}
                        className="text-[11px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5 shrink-0"
                      >
                        View <ArrowRight size={9} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Carry-over summary */}
              {result.carriedOver.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle size={12} className="text-green-500 shrink-0" />
                  <span>Carried over: {result.carriedOver.join(', ')}</span>
                </div>
              )}

              {/* Owner */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle size={12} className="text-green-500 shrink-0" />
                <span>Assigned to: <span className="font-medium text-gray-700">{result.ownerLabel}</span></span>
              </div>
            </div>
          )}

        </div>

        {/* A rejected write is reported, not hidden. This wizard used to advance to
            the success screen regardless of what the server said. */}
        {convertError && (
          <div
            role="alert"
            className="shrink-0 mx-6 mb-1 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2"
          >
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-800">
                Conversion failed — nothing was saved
              </p>
              <p className="text-[11px] text-red-700 mt-1">{convertError}</p>
              <p className="text-[11px] text-red-600 mt-1">
                Lead conversion is not implemented on the server yet. The lead is unchanged.
              </p>
            </div>
          </div>
        )}

        {/* Footer navigation */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {step === 4 ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
            >
              Back to Lead
            </button>
          ) : (
            <>
              {/* Back / Cancel */}
              <button
                onClick={step === 1 ? onClose : () => setStep(prev => (prev - 1) as WizardStep)}
                className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {step === 1 ? 'Cancel' : '← Back'}
              </button>

              {/* Next / Convert */}
              {step < 3 ? (
                <Button
                  onClick={() => setStep(prev => (prev + 1) as WizardStep)}
                  disabled={
                    (step === 1 && step1Disabled) ||
                    (step === 2 && leadDuplicateRisk === 'high' && !dupDismissed)
                  }
                  size="lg" className="font-semibold rounded-xl disabled:opacity-40"
                >
                  Next <ArrowRight size={14} />
                </Button>
              ) : (
                <button
                  onClick={handleConvert}
                  disabled={converting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors"
                >
                  {converting ? (
                    <><Loader2 size={14} className="animate-spin" /> Converting…</>
                  ) : (
                    <><Check size={14} /> Convert Lead</>
                  )}
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
