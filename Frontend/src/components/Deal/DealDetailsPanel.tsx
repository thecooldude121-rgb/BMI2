import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  ChevronDown, ChevronRight,
  Shield, AlertTriangle, Target, Trophy, CheckCircle2, XCircle, Copy, Check,
  Building2, FileText, Pencil, Loader2, Mail, Phone, User,
} from 'lucide-react';
import { formatCurrency, BASE_CURRENCY_CODE } from '../../utils/currencyUtils';
import { BATTLE_CARDS } from '../../config/battleCards';
import { updateDeal, getUsers } from '../../utils/dealsApi';
import type { RevenueSchedule } from './RevenueTimeline';
import type { DealPayload } from '../../utils/dealsApi';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stage {
  name: string; days: number; startDate: string; endDate: string;
  status: 'completed' | 'current' | 'pending';
  benchmark?: number; benchmarkMin?: number; benchmarkMax?: number;
}

interface DealDetailsPanelProps {
  deal: {
    id?: string; dealName: string; amount: number; currency?: string;
    base_amount_usd?: number; stage: string; stageName: string;
    stageNumber: number; totalStages: number; closeDate: string;
    expectedCloseDate?: string; probability: number; daysInStage?: number;
    totalDealAge?: number; package?: string; contractTerm?: string;
    paymentTerms?: string; tags?: string[]; owner?: string;
    accountName?: string; contactName?: string; contactTitle?: string;
    accountIndustry?: string; createdDate?: string; source?: string;
    dealType?: string; nextStep?: string; description?: string; winProbAI?: number;
    salesDriveFolder?: string; agreementUrl?: string; accountModuleSetup?: string;
    clientDiscovers?: string; discoveryDate?: string;
  };
  stageHistory?: Stage[];
  competitors?: string[];
  expandedBattleCard?: string | null;
  isAdmin?: boolean;
  battleCardRef?: React.RefObject<HTMLDivElement>;
  revenueSchedule?: RevenueSchedule | null;
  onSaveRevenueSchedule?: (schedule: RevenueSchedule) => void;
  revenueTimelineRef?: React.RefObject<HTMLDivElement>;
  onDealUpdated?: (updates: Record<string, any>) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGE_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  prospecting:   { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  qualified:     { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  proposal:      { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  negotiation:   { bg: '#FAF5FF', text: '#7E22CE', dot: '#A855F7' },
  'closed-won':  { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  'closed-lost': { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
};

const STAGE_INFO: Record<string, { label: string; desc: string; prob: number }> = {
  prospecting:   { label: 'Prospecting',  desc: 'Initial outreach; qualifying if this is a real opportunity.',    prob: 10  },
  qualified:     { label: 'Qualified',    desc: 'BANT confirmed — budget, authority, need, timeline established.', prob: 25  },
  proposal:      { label: 'Proposal',     desc: 'Formal proposal or SOW submitted, awaiting response.',           prob: 50  },
  negotiation:   { label: 'Negotiation',  desc: 'Terms, pricing or contract are being actively negotiated.',      prob: 75  },
  'closed-won':  { label: 'Closed Won',   desc: 'Contract signed. Deal is won.',                                  prob: 100 },
  'closed-lost': { label: 'Closed Lost',  desc: 'Opportunity lost — competitor selected or no decision.',         prob: 0   },
};

const STAGE_OPTIONS        = Object.entries(STAGE_INFO).map(([v, s]) => ({ value: v, label: s.label }));
const DEAL_TYPE_OPTIONS    = [
  { value: 'new-business', label: 'New Business' }, { value: 'upsell',    label: 'Upsell'    },
  { value: 'renewal',      label: 'Renewal'      }, { value: 'expansion', label: 'Expansion' },
  { value: 'cross-sell',   label: 'Cross-sell'   },
];
const SOURCE_OPTIONS       = [
  { value: 'lead-gen',       label: 'Lead Gen Tool' }, { value: 'referral',  label: 'Referral'  },
  { value: 'website',        label: 'Website'       }, { value: 'cold-outreach', label: 'Cold Outreach' },
  { value: 'partner',        label: 'Partner'       }, { value: 'inbound',   label: 'Inbound'   },
  { value: 'event',          label: 'Event'         },
];
const CONTACT_ROLE_OPTIONS = [
  { value: 'champion',       label: 'Champion'        }, { value: 'decision-maker',  label: 'Decision Maker'  },
  { value: 'economic-buyer', label: 'Economic Buyer'  }, { value: 'end-user',        label: 'End User'        },
  { value: 'influencer',     label: 'Influencer'      }, { value: 'coach',           label: 'Coach'           },
  { value: 'blocker',        label: 'Blocker'         },
];
const PAYMENT_TERMS_OPTIONS = [
  { value: 'Net 30',  label: 'Net 30'  }, { value: 'Net 60',    label: 'Net 60'    },
  { value: 'Net 90',  label: 'Net 90'  }, { value: 'Upfront',   label: 'Upfront'   },
  { value: 'Monthly', label: 'Monthly' }, { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Annual',  label: 'Annual'  },
];
const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — US Dollar'       }, { value: 'EUR', label: 'EUR — Euro'            },
  { value: 'GBP', label: 'GBP — British Pound'   }, { value: 'AED', label: 'AED — UAE Dirham'      },
  { value: 'SGD', label: 'SGD — Singapore Dollar'}, { value: 'INR', label: 'INR — Indian Rupee'    },
  { value: 'MYR', label: 'MYR — Malaysian Ringgit'}, { value: 'AUD', label: 'AUD — Australian Dollar'},
];

// ── Panel context ─────────────────────────────────────────────────────────────

const PanelCtx = createContext<{
  dealId?: string;
  onSaved?: (apiKey: string, value: any) => void;
}>({});

// ── Popovers ──────────────────────────────────────────────────────────────────

function OwnerPopover({ name }: { name: string }) {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    getUsers()
      .then(users => {
        const m = users.find(
          (u: any) => (u.full_name || u.name || '').toLowerCase() === name.toLowerCase()
        );
        setUser(m ?? null);
      })
      .catch(() => {});
  }, [name]);

  const initials = name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 text-sm">{name}</div>
          {(user?.team || user?.role) && (
            <div className="text-xs text-gray-500">{[user.team, user.role].filter(Boolean).join(', ')}</div>
          )}
        </div>
      </div>
      {(user?.email || user?.contact_email) && (
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-blue-600 truncate">{user.email || user.contact_email}</span>
        </div>
      )}
      {(user?.phone || user?.mobile) && (
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-700">{user.phone || user.mobile}</span>
        </div>
      )}
      {!user && (
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-400 italic">No additional info</span>
        </div>
      )}
    </div>
  );
}

function StagePopover({ stageKey }: { stageKey: string }) {
  const info   = STAGE_INFO[stageKey?.toLowerCase()] ?? null;
  const colors = STAGE_COLOR[stageKey?.toLowerCase()] ?? STAGE_COLOR['prospecting'];
  if (!info) return null;
  return (
    <div className="flex flex-col gap-2">
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold w-fit"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.dot }} />
        {info.label}
      </span>
      <p className="text-xs text-gray-600 leading-relaxed">{info.desc}</p>
      <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-2">
        <span className="text-gray-400">Typical win probability</span>
        <span className="font-semibold text-gray-700">{info.prob}%</span>
      </div>
    </div>
  );
}

// ── EditableRow — Zoho-style horizontal label | value | pencil ────────────────

type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'readonly';

interface EditableRowProps {
  label: string;
  apiKey?: keyof DealPayload;
  rawValue?: string | number;
  type?: FieldType;
  options?: Array<{ value: string; label: string }>;
  children: React.ReactNode;
  popover?: React.ReactNode;
}

function EditableRow({
  label, apiKey, rawValue, type = 'text', options, children, popover,
}: EditableRowProps) {
  const { dealId, onSaved } = useContext(PanelCtx);
  const [editing,  setEditing]  = useState(false);
  const [inputVal, setInputVal] = useState(String(rawValue ?? ''));
  const [saving,   setSaving]   = useState(false);
  const [savedOk,  setSavedOk]  = useState(false);
  const [saveErr,  setSaveErr]  = useState(false);
  const [showPop,  setShowPop]  = useState(false);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>(null);

  const canEdit = !!dealId && !!apiKey && type !== 'readonly';

  useEffect(() => { if (!editing) setInputVal(String(rawValue ?? '')); }, [rawValue, editing]);
  useEffect(() => { if (editing) setTimeout(() => inputRef.current?.focus(), 0); }, [editing]);

  const cancel = () => setEditing(false);

  const save = async () => {
    if (!dealId || !apiKey) { setEditing(false); return; }
    if (inputVal === String(rawValue ?? '')) { setEditing(false); return; }
    setSaving(true); setSaveErr(false);
    try {
      const val = type === 'number' ? Number(inputVal) : inputVal;
      await updateDeal(dealId, { [apiKey]: val } as Partial<DealPayload>);
      onSaved?.(apiKey as string, val);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    } catch {
      setSaveErr(true);
      setTimeout(() => setSaveErr(false), 3000);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  return (
    <div className={`group/row flex items-start gap-3 px-2 py-2 rounded-lg transition-colors ${canEdit ? 'hover:bg-blue-50/50 cursor-default' : ''}`}>
      {/* label col — fixed width */}
      <span className="w-40 flex-shrink-0 text-sm text-gray-400 font-medium pt-0.5 leading-snug">
        {label}
      </span>

      {/* value col */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-start gap-1.5">
            {type === 'select' ? (
              <select
                ref={inputRef}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onBlur={save}
                className="text-sm border border-blue-400 rounded-md px-2 py-0.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              >
                {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : type === 'textarea' ? (
              <textarea
                ref={inputRef}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onBlur={save}
                onKeyDown={e => { if (e.key === 'Escape') cancel(); }}
                rows={3}
                className="text-sm border border-blue-400 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-full resize-none"
              />
            ) : (
              <input
                ref={inputRef}
                type={type}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onBlur={save}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
                className="text-sm border border-blue-400 rounded-md px-2 py-0.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              />
            )}
            {saving && <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />}
          </div>
        ) : (
          <div
            className="relative"
            onMouseEnter={() => popover && setShowPop(true)}
            onMouseLeave={() => setShowPop(false)}
          >
            <div className="text-sm text-gray-900 font-medium leading-snug">
              {savedOk ? (
                <span className="flex items-center gap-1 text-green-600 text-xs font-normal">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                </span>
              ) : saveErr ? (
                <span className="text-red-500 text-xs font-normal">✕ Save failed — try again</span>
              ) : children}
            </div>

            {/* hover popover */}
            {showPop && popover && (
              <div className="absolute left-0 top-full mt-2 z-[100] min-w-[220px] max-w-xs bg-white border border-gray-200 rounded-xl shadow-2xl p-3">
                {popover}
              </div>
            )}
          </div>
        )}
      </div>

      {/* pencil — visible on row hover via CSS group */}
      {canEdit && !editing && (
        <button
          onClick={() => { setInputVal(String(rawValue ?? '')); setEditing(true); }}
          className="opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-100 border border-transparent hover:border-blue-200"
          title={`Edit ${label}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {/* spacer so layout doesn't shift when button disappears */}
      {canEdit && editing && <div className="w-6 flex-shrink-0" />}
      {!canEdit && <div className="w-6 flex-shrink-0" />}
    </div>
  );
}

// ── Read-only row (no edit) ───────────────────────────────────────────────────

function ReadonlyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-2 py-2">
      <span className="w-40 flex-shrink-0 text-sm text-gray-400 font-medium pt-0.5 leading-snug">{label}</span>
      <div className="flex-1 text-sm text-gray-900 font-medium leading-snug">{children}</div>
      <div className="w-6 flex-shrink-0" />
    </div>
  );
}

// ── Section (collapsible) ─────────────────────────────────────────────────────

function Section({
  title, icon, children, defaultOpen = true,
}: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 py-3 hover:bg-gray-50 rounded transition-colors"
      >
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex-1 text-left">
          {title}
        </span>
        {open
          ? <ChevronDown  className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  const rows: React.ReactNode[] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(
      <div key={i} className="grid grid-cols-2 gap-x-4 divide-x divide-gray-50">
        <div>{items[i]}</div>
        <div className="pl-4">{items[i + 1] ?? null}</div>
      </div>
    );
  }
  return <div className="space-y-0">{rows}</div>;
}

function Dash() {
  return <span className="text-gray-300">—</span>;
}

// ── Main component ────────────────────────────────────────────────────────────

export const DealDetailsPanel: React.FC<DealDetailsPanelProps> = ({
  deal, competitors, expandedBattleCard, isAdmin, battleCardRef, onDealUpdated,
}) => {
  const [openBattleCard,    setOpenBattleCard]    = useState<string | null>(null);
  const [copiedCompetitor,  setCopiedCompetitor]  = useState<string | null>(null);

  useEffect(() => {
    if (expandedBattleCard != null) setOpenBattleCard(expandedBattleCard);
  }, [expandedBattleCard]);

  const handleCopyTalkingPoints = (key: string, points: string[]) => {
    navigator.clipboard.writeText(points.map((p, i) => `${i + 1}. ${p}`).join('\n')).then(() => {
      setCopiedCompetitor(key);
      setTimeout(() => setCopiedCompetitor(null), 2000);
    });
  };

  const stageColors  = STAGE_COLOR[deal.stage?.toLowerCase()] ?? STAGE_COLOR['prospecting'];
  const stageProgressPct = deal.totalStages > 1
    ? Math.round(((deal.stageNumber - 1) / (deal.totalStages - 1)) * 100) : 0;
  const probabilityAmount = deal.probability > 0 && deal.amount > 0
    ? formatCurrency((deal.amount * deal.probability) / 100, deal.currency || BASE_CURRENCY_CODE)
    : null;

  const FIELD_MAP: Record<string, string> = {
    name: 'dealName', assigned_to: 'owner', expected_close_date: 'closeDate',
    deal_type: 'dealType', stage: 'stage', description: 'description',
    next_step: 'nextStep', probability: 'probability', company_name: 'accountName',
    contact_name: 'contactName', contact_title: 'contactTitle', value: 'amount',
    source: 'source', product: 'package', contract_term: 'contractTerm',
    payment_terms: 'paymentTerms', currency: 'currency',
    sales_drive_folder: 'salesDriveFolder', agreement_url: 'agreementUrl',
    account_module_setup: 'accountModuleSetup', client_discovers: 'clientDiscovers',
    discovery_date: 'discoveryDate',
  };

  const ctxValue = {
    dealId: deal.id,
    onSaved: (apiKey: string, value: any) => {
      onDealUpdated?.({ [FIELD_MAP[apiKey] ?? apiKey]: value });
    },
  };

  return (
    <PanelCtx.Provider value={ctxValue}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">

        {/* header */}
        <div className="px-6 py-3.5 border-b border-gray-100 bg-gray-50 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">Deal Information</span>
          </div>
          {deal.id && (
            <span className="text-xs text-gray-400 font-mono bg-white border border-gray-200 px-2 py-0.5 rounded">
              #{deal.id}
            </span>
          )}
        </div>

        <div className="px-4 py-1">

          {/* ── 1. Deal Overview ── */}
          <Section title="Deal Overview" defaultOpen>
            <TwoCol>
              <ReadonlyRow label="Deal Number">
                {deal.id ? <span className="font-mono text-gray-700">#{deal.id}</span> : <Dash />}
              </ReadonlyRow>

              <EditableRow label="Deal Owner" apiKey="assigned_to" rawValue={deal.owner ?? ''}
                popover={deal.owner ? <OwnerPopover name={deal.owner} /> : undefined}>
                {deal.owner || <Dash />}
              </EditableRow>

              <EditableRow label="Deal Name" apiKey="name" rawValue={deal.dealName}>
                <span className="truncate block">{deal.dealName}</span>
              </EditableRow>

              <EditableRow label="Closing Date" apiKey="expected_close_date"
                rawValue={deal.closeDate ?? ''} type="date">
                {deal.closeDate || <Dash />}
              </EditableRow>

              <ReadonlyRow label="Pipeline">
                {deal.accountIndustry || deal.source || <Dash />}
              </ReadonlyRow>

              <ReadonlyRow label="Deal Status">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />Active
                </span>
              </ReadonlyRow>

              <EditableRow label="Deal Type" apiKey="deal_type"
                rawValue={deal.dealType || deal.package || ''} type="select" options={DEAL_TYPE_OPTIONS}>
                {deal.dealType || deal.package
                  ? <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700">{deal.dealType || deal.package}</span>
                  : <Dash />}
              </EditableRow>

              <EditableRow label="Stage" apiKey="stage" rawValue={deal.stage ?? ''}
                type="select" options={STAGE_OPTIONS}
                popover={<StagePopover stageKey={deal.stage ?? ''} />}>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: stageColors.bg, color: stageColors.text }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: stageColors.dot }} />
                  {deal.stageName}
                </span>
              </EditableRow>

              <EditableRow label="Requirements / Brief" apiKey="description"
                rawValue={deal.description || deal.nextStep || ''} type="textarea">
                {deal.description || deal.nextStep || <Dash />}
              </EditableRow>

              <EditableRow label="Probability (%)" apiKey="probability"
                rawValue={deal.probability} type="number">
                {deal.probability > 0 ? `${deal.probability}%` : <Dash />}
              </EditableRow>

              <ReadonlyRow label="Stage Progress">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${stageProgressPct}%`, backgroundColor: stageColors.dot }} />
                  </div>
                  <span className="text-[11px] text-gray-500 whitespace-nowrap">
                    {deal.stageNumber} / {deal.totalStages}
                  </span>
                </div>
              </ReadonlyRow>

              <ReadonlyRow label="Win Probability (AI)">
                {deal.winProbAI && deal.winProbAI > 0 ? `${deal.winProbAI}%` : <Dash />}
              </ReadonlyRow>
            </TwoCol>
          </Section>

          {/* ── 2. Client & Partner Information ── */}
          <Section title="Client & Partner Information" icon={<Building2 className="h-3.5 w-3.5" />}>
            <TwoCol>
              <EditableRow label="Account Name" apiKey="company_name" rawValue={deal.accountName ?? ''}>
                {deal.accountName
                  ? <span className="text-blue-600 hover:underline cursor-pointer">{deal.accountName}</span>
                  : <Dash />}
              </EditableRow>

              <EditableRow label="Contact Name" apiKey="contact_name" rawValue={deal.contactName ?? ''}>
                {deal.contactName
                  ? <span className="text-blue-600 hover:underline cursor-pointer">{deal.contactName}</span>
                  : <Dash />}
              </EditableRow>

              <EditableRow label="Buying Role" apiKey="contact_title"
                rawValue={deal.contactTitle ?? ''} type="select" options={CONTACT_ROLE_OPTIONS}>
                {deal.contactTitle || <Dash />}
              </EditableRow>

              <ReadonlyRow label="Account Industry">
                {deal.accountIndustry || <Dash />}
              </ReadonlyRow>
            </TwoCol>
          </Section>

          {/* ── 3. Revenue Information ── */}
          <Section title="Revenue Information" defaultOpen>
            <TwoCol>
              <EditableRow label="Currency" apiKey="currency"
                rawValue={deal.currency || 'USD'} type="select" options={CURRENCY_OPTIONS}>
                {deal.currency || 'USD'}
              </EditableRow>

              <ReadonlyRow label="Platform Fee (%)"><Dash /></ReadonlyRow>
              <ReadonlyRow label="Exchange Rate">1</ReadonlyRow>
              <ReadonlyRow label="Custom Fee ($)"><Dash /></ReadonlyRow>

              <EditableRow label="Amount" apiKey="value" rawValue={deal.amount} type="number">
                {deal.amount > 0
                  ? formatCurrency(deal.amount, deal.currency || BASE_CURRENCY_CODE)
                  : <Dash />}
              </EditableRow>

              <ReadonlyRow label="License Fee ($)"><Dash /></ReadonlyRow>
              <ReadonlyRow label="NR Margin (%)"><Dash /></ReadonlyRow>
              <ReadonlyRow label="Onboarding Fee ($)"><Dash /></ReadonlyRow>

              <ReadonlyRow label="Probability Amount">
                {probabilityAmount || <Dash />}
              </ReadonlyRow>

              <ReadonlyRow label="White-labelling Fee ($)"><Dash /></ReadonlyRow>
            </TwoCol>
          </Section>

          {/* ── 4. Deal Scope & Configuration ── */}
          <Section title="Deal Scope & Configuration" defaultOpen>
            <TwoCol>
              <EditableRow label="Package" apiKey="product" rawValue={deal.package ?? ''}>
                {deal.package || <Dash />}
              </EditableRow>

              <ReadonlyRow label="Start Date"><Dash /></ReadonlyRow>

              <EditableRow label="Contract Term" apiKey="contract_term" rawValue={deal.contractTerm ?? ''}>
                {deal.contractTerm || <Dash />}
              </EditableRow>

              <ReadonlyRow label="End Date">{deal.closeDate || <Dash />}</ReadonlyRow>

              <EditableRow label="Payment Terms" apiKey="payment_terms"
                rawValue={deal.paymentTerms ?? ''} type="select" options={PAYMENT_TERMS_OPTIONS}>
                {deal.paymentTerms || <Dash />}
              </EditableRow>

              <ReadonlyRow label="Duration">{deal.contractTerm || <Dash />}</ReadonlyRow>

              <EditableRow label="Source" apiKey="source"
                rawValue={deal.source ?? ''} type="select" options={SOURCE_OPTIONS}>
                {deal.source || <Dash />}
              </EditableRow>

              <ReadonlyRow label="Country / Region"><Dash /></ReadonlyRow>
            </TwoCol>

            {deal.tags && deal.tags.length > 0 && (
              <div className="px-2 mt-3">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tags</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {deal.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* ── 5. Commercial Docs & Links ── */}
          <Section title="Commercial Documentations & Links" defaultOpen={false}>
            <TwoCol>
              <EditableRow label="Sales Drive Folder" apiKey="sales_drive_folder"
                rawValue={deal.salesDriveFolder ?? ''} type="text">
                {deal.salesDriveFolder
                  ? <a href={deal.salesDriveFolder} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block text-xs">
                      {deal.salesDriveFolder}
                    </a>
                  : <Dash />}
              </EditableRow>

              <EditableRow label="Agreement" apiKey="agreement_url"
                rawValue={deal.agreementUrl ?? ''} type="text">
                {deal.agreementUrl
                  ? <a href={deal.agreementUrl} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block text-xs">
                      {deal.agreementUrl}
                    </a>
                  : <Dash />}
              </EditableRow>

              <EditableRow label="Account & Module Setup" apiKey="account_module_setup"
                rawValue={deal.accountModuleSetup ?? ''} type="text">
                {deal.accountModuleSetup
                  ? <a href={deal.accountModuleSetup} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block text-xs">
                      {deal.accountModuleSetup}
                    </a>
                  : <Dash />}
              </EditableRow>

              <EditableRow label="Client Discovers" apiKey="client_discovers"
                rawValue={deal.clientDiscovers ?? ''} type="text">
                {deal.clientDiscovers
                  ? <a href={deal.clientDiscovers} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block text-xs">
                      {deal.clientDiscovers}
                    </a>
                  : <Dash />}
              </EditableRow>
            </TwoCol>
          </Section>

          {/* ── 6. Record Information ── */}
          <Section title="Record Information" defaultOpen={false}>
            <TwoCol>
              <ReadonlyRow label="Created By">
                <div className="flex flex-col">
                  <span>{deal.owner || '—'}</span>
                  {deal.createdDate && <span className="text-[11px] text-gray-400 font-normal">{deal.createdDate}</span>}
                </div>
              </ReadonlyRow>

              <EditableRow label="Discovery Date" apiKey="discovery_date"
                rawValue={deal.discoveryDate ?? ''} type="date">
                {deal.discoveryDate || <Dash />}
              </EditableRow>

              <ReadonlyRow label="Modified By"><Dash /></ReadonlyRow>

              <ReadonlyRow label="Source / Lead ID">{deal.source || <Dash />}</ReadonlyRow>
            </TwoCol>
          </Section>

          {/* ── 7. Competitive Intelligence ── */}
          {competitors && competitors.length > 0 && (
            <div ref={battleCardRef} className="border-t border-gray-100 pt-1 pb-4">
              <div className="flex items-center gap-2 py-3">
                <Shield className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Competitive Intelligence
                </span>
              </div>
              <div className="space-y-2">
                {competitors.map(competitor => {
                  const key    = competitor.toLowerCase();
                  const card   = BATTLE_CARDS[key];
                  const isOpen = openBattleCard === key;
                  return (
                    <div key={competitor} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenBattleCard(isOpen ? null : key)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-semibold text-gray-900">{competitor}</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded">Competitor</span>
                        </div>
                        <span className="text-xs text-gray-400">{isOpen ? 'Hide' : 'View Battle Card'}</span>
                      </button>

                      {isOpen && (
                        <div className="border-t border-gray-200 bg-white">
                          {card ? (
                            <div className="p-4 space-y-4">
                              <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span className="text-[11px] font-bold text-green-800 uppercase tracking-wide">We Win When</span>
                                </div>
                                <ul className="space-y-1.5 pl-1">
                                  {card.weWinWhen.map((pt, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                      <span className="text-green-500 font-bold text-xs mt-0.5">✓</span>{pt}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <XCircle className="h-4 w-4 text-red-400" />
                                  <span className="text-[11px] font-bold text-red-700 uppercase tracking-wide">They Win When</span>
                                </div>
                                <ul className="space-y-1.5 pl-1">
                                  {card.theyWinWhen.map((pt, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                      <span className="text-red-400 font-bold text-xs mt-0.5">✕</span>{pt}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Target className="h-4 w-4 text-blue-600" />
                                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">Killer Question</span>
                                </div>
                                <p className="text-sm text-blue-900 italic">"{card.killerQuestion}"</p>
                              </div>
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Trophy className="h-4 w-4 text-purple-600" />
                                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wide">Proof Point</span>
                                </div>
                                <p className="text-sm text-purple-900">
                                  <span className="font-semibold">{card.proofPoint.company}:</span> {card.proofPoint.outcome}
                                </p>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => handleCopyTalkingPoints(key, card.weWinWhen)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  {copiedCompetitor === key
                                    ? <><Check className="h-3.5 w-3.5 text-green-500" /><span className="text-green-700">Copied!</span></>
                                    : <><Copy className="h-3.5 w-3.5" />Copy talking points</>}
                                </button>
                                {isAdmin && (
                                  <button type="button" className="text-xs text-blue-600 hover:text-blue-800 hover:underline">
                                    Update Battle Card
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4">
                              <p className="text-sm text-gray-500">No battle card data for {competitor}.</p>
                              {isAdmin && <button type="button" className="mt-2 text-xs text-blue-600 hover:underline">+ Create Battle Card</button>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </PanelCtx.Provider>
  );
};
