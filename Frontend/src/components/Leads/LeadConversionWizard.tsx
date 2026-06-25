// Guided 4-step lead conversion wizard.
// Replaces the thin ConversionWorkflowModal routing shim.
// TODO: replace stub ID generation with real entity-creation API calls when available.
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  X, UserPlus, Building2, TrendingUp, Link2,
  CheckCircle, XCircle, AlertCircle, ArrowRight, Loader2, Check,
} from 'lucide-react';
import type { Lead } from '../../types/lead';
import type { ConversionReadinessResult, ConversionReadinessState } from '../../utils/conversionReadiness';
import { TEAM_MEMBERS } from '../../utils/leadOwnerRouting';
import { useData } from '../../contexts/DataContext';
import { useLeads } from '../../contexts/LeadContext';
import { findDuplicates, computeRisk } from '../../utils/leadDuplicates';

// ── Types ──────────────────────────────────────────────────────────────────────

export type WizardPath =
  | 'contact'
  | 'contact_account'
  | 'contact_account_deal'
  | 'link_existing';

type WizardStep = 1 | 2 | 3 | 4;

interface DuplicateSuggestion {
  type:        'contact' | 'account';
  id:          string;
  name:        string;
  subtitle:    string;
  matchReason: string;
}

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
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
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
const MOCK_ACCOUNTS = [
  { id: 'acc_mock_1', name: 'Acme Corp',         industry: 'Technology'   },
  { id: 'acc_mock_2', name: 'Global Industries',  industry: 'Manufacturing'},
  { id: 'acc_mock_3', name: 'Horizon Partners',   industry: 'Finance'      },
  { id: 'acc_mock_4', name: 'Nexus Solutions',    industry: 'Consulting'   },
  { id: 'acc_mock_5', name: 'Apex Ventures',      industry: 'Healthcare'   },
];

// ── Pure helpers ───────────────────────────────────────────────────────────────

function defaultPath(state: ConversionReadinessState): WizardPath {
  if (state === 'ready_for_deal')           return 'contact_account_deal';
  if (state === 'ready_for_account_contact') return 'contact_account';
  return 'contact';
}

function defaultDealName(lead: Lead): string {
  const name = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ');
  return lead.company ? `${lead.company} — ${name}` : name;
}

function leadDisplayName(lead: Lead): string {
  return lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';
}

// TODO: replace with contacts/accounts search API when available.
function buildSuggestions(
  lead:     Lead,
  contacts: Array<{ id: string; firstName: string; lastName: string; email: string }>,
): DuplicateSuggestion[] {
  const sugs: DuplicateSuggestion[] = [];
  const domain = lead.email?.split('@')[1];

  if (domain) {
    contacts
      .filter(c => c.email?.split('@')[1] === domain)
      .slice(0, 2)
      .forEach(c =>
        sugs.push({
          type:        'contact',
          id:          c.id,
          name:        `${c.firstName} ${c.lastName}`,
          subtitle:    c.email,
          matchReason: `same email domain (@${domain})`,
        })
      );
  }

  if (lead.company) {
    const lc = lead.company.toLowerCase();
    MOCK_ACCOUNTS
      .filter(a => a.name.toLowerCase().includes(lc) || lc.includes(a.name.toLowerCase()))
      .slice(0, 2)
      .forEach(a =>
        sugs.push({
          type:        'account',
          id:          a.id,
          name:        a.name,
          subtitle:    a.industry,
          matchReason: 'company name match',
        })
      );
  }

  return sugs;
}

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
              s < current  ? 'bg-blue-600 text-white'
              : s === current ? 'bg-blue-600 text-white ring-2 ring-blue-200'
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
}

function PathCard({ icon, title, description, selected, recommended, onClick }: PathCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
        selected
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

// ── Suggestion row ────────────────────────────────────────────────────────────

function SuggestionRow({
  sug, linked, onLink, onUnlink,
}: {
  sug:      DuplicateSuggestion;
  linked:   boolean;
  onLink:   () => void;
  onUnlink: () => void;
}) {
  const Icon = sug.type === 'contact' ? UserPlus : Building2;
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
      linked ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
    }`}>
      <span className={`p-1.5 rounded-lg shrink-0 ${linked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
        <Icon size={12} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate">{sug.name}</p>
        <p className="text-[11px] text-gray-400 truncate">{sug.subtitle}</p>
        <p className="text-[10px] text-amber-600 mt-0.5">Match: {sug.matchReason}</p>
      </div>
      {linked ? (
        <button
          onClick={onUnlink}
          className="text-[11px] font-medium text-red-500 hover:text-red-700 shrink-0"
        >
          Unlink
        </button>
      ) : (
        <button
          onClick={onLink}
          className="text-[11px] font-medium text-blue-600 hover:text-blue-800 shrink-0 whitespace-nowrap"
        >
          Use this →
        </button>
      )}
    </div>
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
  const { contacts } = useData();
  const { leads: allLeads } = useLeads();

  // ── Duplicate detection (for Step 2 high-risk gating) ─────────────────────
  const leadDuplicateCandidates = useMemo(
    () => findDuplicates(lead, allLeads ?? []),
    [lead, allLeads],
  );
  const leadDuplicateRisk = computeRisk(leadDuplicateCandidates);

  // ── State ──────────────────────────────────────────────────────────────────

  const [step,        setStep]        = useState<WizardStep>(1);
  const [path,        setPath]        = useState<WizardPath>(() => defaultPath(readiness.state));
  const [notReadyAck, setNotReadyAck] = useState(false);

  // Step 2
  const [dupDismissed,    setDupDismissed]    = useState(false);
  const [linkedContactId, setLinkedContactId] = useState('');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [linkContactSearch, setLinkContactSearch] = useState('');
  const [linkAccountSearch, setLinkAccountSearch] = useState('');

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
      setPath(defaultPath(readiness.state));
      setNotReadyAck(false);
      setDupDismissed(false);
      setLinkedContactId('');
      setLinkedAccountId('');
      setLinkContactSearch('');
      setLinkAccountSearch('');
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

  const suggestions = useMemo(() => buildSuggestions(lead, contacts), [lead, contacts]);

  const needsAck      = NEEDS_ACK.has(readiness.state);
  const step1Disabled = needsAck && !notReadyAck;
  const hasCompany    = !!lead.company?.trim();

  const includesAccount = path === 'contact_account' || path === 'contact_account_deal';
  const includesDeal    = path === 'contact_account_deal';
  const isLinkExisting  = path === 'link_existing';

  const filteredContacts = contacts.filter(c => {
    const q = linkContactSearch.toLowerCase();
    return q === '' || `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  }).slice(0, 8);

  const filteredAccounts = MOCK_ACCOUNTS.filter(a => {
    const q = linkAccountSearch.toLowerCase();
    return q === '' || a.name.toLowerCase().includes(q) || a.industry.toLowerCase().includes(q);
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleConvert = useCallback(async () => {
    setConverting(true);
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
        accountName:  accountId
          ? (isLinkExisting && linkedAccountId
              ? MOCK_ACCOUNTS.find(a => a.id === linkedAccountId)?.name ?? lead.company ?? 'Account'
              : lead.company ?? 'Account')
          : undefined,
        dealId,
        dealName:     dealId ? dealName : undefined,
        ownerLabel:   ownerMember?.label ?? ownerId,
        carriedOver,
        isLinked:     isLinkExisting,
      };

      await onUpdateLead(lead.id, {
        status:                  'converted',
        converted_at:            new Date().toISOString(),
        converted_to_contact_id: contactId,
        ...(dealId    ? { converted_to_deal_id: dealId }  : {}),
        ...(accountId ? { account_id: accountId }         : {}),
      } as Partial<Lead>);

      setResult(res);
      setStep(4);
    } finally {
      setConverting(false);
    }
  }, [
    lead, isLinkExisting, linkedContactId, linkedAccountId,
    includesAccount, includesDeal, ownerId, carryTags, carryNotes, carryActs,
    dealName, onUpdateLead,
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
                <div className="space-y-2">
                  <PathCard
                    icon={<UserPlus size={15} />}
                    title="Create Contact"
                    description="Create a contact record only — no account or deal"
                    selected={path === 'contact'}
                    recommended={readiness.state === 'ready_for_contact'}
                    onClick={() => setPath('contact')}
                  />
                  <PathCard
                    icon={<Building2 size={15} />}
                    title="Create Contact + Account"
                    description={hasCompany ? `Links contact to a new ${lead.company} account` : 'Add a company name to enable this path'}
                    selected={path === 'contact_account'}
                    recommended={readiness.state === 'ready_for_account_contact'}
                    onClick={() => setPath('contact_account')}
                  />
                  <PathCard
                    icon={<TrendingUp size={15} />}
                    title="Create Contact + Account + Deal"
                    description={hasCompany ? 'Creates all three — recommended for qualified leads' : 'Add a company name to enable this path'}
                    selected={path === 'contact_account_deal'}
                    recommended={readiness.state === 'ready_for_deal'}
                    onClick={() => setPath('contact_account_deal')}
                  />
                  <PathCard
                    icon={<Link2 size={15} />}
                    title="Link to Existing"
                    description="Attach this lead to an existing contact and/or account"
                    selected={path === 'link_existing'}
                    recommended={false}
                    onClick={() => setPath('link_existing')}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: DUPLICATES ────────────────────────────────────────── */}
          {step === 2 && (
            <>
              {isLinkExisting ? (
                /* Link to existing — search dropdowns */
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Find Existing Records
                  </p>

                  {/* Contact search */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600">Link to Contact</label>
                    <input
                      type="text"
                      placeholder="Search by name or email…"
                      value={linkContactSearch}
                      onChange={e => setLinkContactSearch(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                    />
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {filteredContacts.length > 0 ? filteredContacts.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setLinkedContactId(linkedContactId === c.id ? '' : c.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors ${
                            linkedContactId === c.id
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <UserPlus size={12} className="text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">
                              {c.firstName} {c.lastName}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">{c.email}</p>
                          </div>
                          {linkedContactId === c.id && <Check size={12} className="text-blue-500 shrink-0" />}
                        </button>
                      )) : (
                        <p className="text-xs text-gray-400 py-2 text-center">No contacts found</p>
                      )}
                    </div>
                  </div>

                  {/* Account search */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600">Link to Account</label>
                    <input
                      type="text"
                      placeholder="Search by company name…"
                      value={linkAccountSearch}
                      onChange={e => setLinkAccountSearch(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                    />
                    <div className="space-y-1">
                      {filteredAccounts.map(a => (
                        <button
                          key={a.id}
                          onClick={() => setLinkedAccountId(linkedAccountId === a.id ? '' : a.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors ${
                            linkedAccountId === a.id
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <Building2 size={12} className="text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{a.name}</p>
                            <p className="text-[11px] text-gray-400">{a.industry}</p>
                          </div>
                          {linkedAccountId === a.id && <Check size={12} className="text-blue-500 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Heuristic duplicate suggestions */
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

                  <div className="flex items-start justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Match Suggestions
                    </p>
                    <span className="text-[10px] text-gray-400">
                      {suggestions.length} found
                    </span>
                  </div>

                  {suggestions.length > 0 ? (
                    <>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                        <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-amber-700">
                          These are pattern-based suggestions. Verify before linking.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {suggestions.map(sug => {
                          const isLinked =
                            (sug.type === 'contact' && linkedContactId === sug.id) ||
                            (sug.type === 'account' && linkedAccountId === sug.id);
                          return (
                            <SuggestionRow
                              key={`${sug.type}_${sug.id}`}
                              sug={sug}
                              linked={isLinked}
                              onLink={() => {
                                if (sug.type === 'contact') setLinkedContactId(sug.id);
                                else                        setLinkedAccountId(sug.id);
                              }}
                              onUnlink={() => {
                                if (sug.type === 'contact') setLinkedContactId('');
                                else                        setLinkedAccountId('');
                              }}
                            />
                          );
                        })}
                      </div>

                      {(linkedContactId || linkedAccountId) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                          <p className="text-xs text-blue-700 font-medium">
                            {[
                              linkedContactId && 'Contact will be linked instead of created.',
                              linkedAccountId && 'Account will be linked instead of created.',
                            ].filter(Boolean).join(' ')}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-6 text-center">
                      <CheckCircle className="h-8 w-8 text-green-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 font-medium">No duplicates found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        No existing contacts or accounts match this lead's email domain or company.
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
                <select
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
                      <input
                        type="text"
                        value={dealName}
                        onChange={e => setDealName(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Est. Value</label>
                        <input
                          type="number"
                          min={0}
                          value={dealValue}
                          onChange={e => setDealValue(Number(e.target.value))}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Stage</label>
                        <select
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
                <button
                  onClick={() => setStep(prev => (prev + 1) as WizardStep)}
                  disabled={
                    (step === 1 && step1Disabled) ||
                    (step === 2 && leadDuplicateRisk === 'high' && !dupDismissed)
                  }
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ArrowRight size={14} />
                </button>
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
