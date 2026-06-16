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
  name: string;
  days: number;
  startDate: string;
  endDate: string;
  status: 'completed' | 'current' | 'pending';
  benchmark?: number;
  benchmarkMin?: number;
  benchmarkMax?: number;
}

interface DealDetailsPanelProps {
  deal: {
    id?: string;
    dealName: string;
    amount: number;
    currency?: string;
    base_amount_usd?: number;
    stage: string;
    stageName: string;
    stageNumber: number;
    totalStages: number;
    closeDate: string;
    expectedCloseDate?: string;
    probability: number;
    daysInStage?: number;
    totalDealAge?: number;
    package?: string;
    contractTerm?: string;
    paymentTerms?: string;
    tags?: string[];
    owner?: string;
    accountName?: string;
    contactName?: string;
    contactTitle?: string;
    accountIndustry?: string;
    createdDate?: string;
    source?: string;
    dealType?: string;
    nextStep?: string;
    description?: string;
    winProbAI?: number;
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

// ── Stage colour map ──────────────────────────────────────────────────────────

const STAGE_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  prospecting:   { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  qualified:     { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  proposal:      { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  negotiation:   { bg: '#FAF5FF', text: '#7E22CE', dot: '#A855F7' },
  'closed-won':  { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  'closed-lost': { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
};

const STAGE_DESCRIPTIONS: Record<string, { label: string; desc: string; prob: number }> = {
  prospecting:   { label: 'Prospecting',   desc: 'Initial outreach; qualifying if this is a real opportunity.',      prob: 10 },
  qualified:     { label: 'Qualified',     desc: 'BANT confirmed — budget, authority, need, timeline established.',   prob: 25 },
  proposal:      { label: 'Proposal',      desc: 'Formal proposal or SOW submitted, awaiting response.',             prob: 50 },
  negotiation:   { label: 'Negotiation',   desc: 'Terms, pricing, or contract are being actively negotiated.',       prob: 75 },
  'closed-won':  { label: 'Closed Won',    desc: 'Contract signed. Deal is won.',                                    prob: 100 },
  'closed-lost': { label: 'Closed Lost',   desc: 'Opportunity lost — competitor selected or no decision.',           prob: 0 },
};

// ── Panel-level context (avoids prop-drilling dealId & onSaved) ───────────────

const PanelCtx = createContext<{
  dealId?: string;
  onSaved?: (apiKey: string, value: any) => void;
}>({});

// ── Select option lists ───────────────────────────────────────────────────────

const STAGE_OPTIONS = Object.entries(STAGE_DESCRIPTIONS).map(([v, s]) => ({ value: v, label: s.label }));

const DEAL_TYPE_OPTIONS = [
  { value: 'new-business',  label: 'New Business' },
  { value: 'upsell',        label: 'Upsell' },
  { value: 'renewal',       label: 'Renewal' },
  { value: 'expansion',     label: 'Expansion' },
  { value: 'cross-sell',    label: 'Cross-sell' },
];

const SOURCE_OPTIONS = [
  { value: 'lead-gen',        label: 'Lead Gen Tool' },
  { value: 'referral',        label: 'Referral' },
  { value: 'website',         label: 'Website' },
  { value: 'cold-outreach',   label: 'Cold Outreach' },
  { value: 'partner',         label: 'Partner' },
  { value: 'inbound',         label: 'Inbound' },
  { value: 'event',           label: 'Event' },
];

const CONTACT_ROLE_OPTIONS = [
  { value: 'champion',         label: 'Champion' },
  { value: 'decision-maker',   label: 'Decision Maker' },
  { value: 'economic-buyer',   label: 'Economic Buyer' },
  { value: 'end-user',         label: 'End User' },
  { value: 'influencer',       label: 'Influencer' },
  { value: 'coach',            label: 'Coach' },
  { value: 'blocker',          label: 'Blocker' },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: 'Net 30',    label: 'Net 30' },
  { value: 'Net 60',    label: 'Net 60' },
  { value: 'Net 90',    label: 'Net 90' },
  { value: 'Upfront',   label: 'Upfront' },
  { value: 'Monthly',   label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Annual',    label: 'Annual' },
];

// ── Owner rich popover ─────────────────────────────────────────────────────────

function OwnerPopover({ name }: { name: string }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getUsers().then(users => {
      const match = users.find(
        (u: any) => (u.full_name || u.name || '').toLowerCase() === name.toLowerCase()
      );
      setUser(match ?? null);
    }).catch(() => {});
  }, [name]);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 text-sm truncate">{name}</div>
          {(user?.team || user?.role) && (
            <div className="text-xs text-gray-500 truncate">
              {[user.team, user.role].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      </div>
      {(user?.email || user?.contact_email) && (
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-blue-600 truncate">
            {user.email || user.contact_email}
          </span>
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

// ── Stage info popover ────────────────────────────────────────────────────────

function StagePopover({ stageKey }: { stageKey: string }) {
  const info = STAGE_DESCRIPTIONS[stageKey.toLowerCase()] ?? null;
  const colors = STAGE_COLOR[stageKey.toLowerCase()] ?? STAGE_COLOR['prospecting'];
  if (!info) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.dot }} />
          {info.label}
        </span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">{info.desc}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Typical win probability</span>
        <span className="font-semibold text-gray-700">{info.prob}%</span>
      </div>
    </div>
  );
}

// ── EditableField ─────────────────────────────────────────────────────────────

type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'readonly';

interface EditableFieldProps {
  label: string;
  apiKey?: keyof DealPayload;
  rawValue?: string | number;
  type?: FieldType;
  options?: Array<{ value: string; label: string }>;
  children: React.ReactNode;
  popover?: React.ReactNode;
}

function EditableField({
  label,
  apiKey,
  rawValue,
  type = 'text',
  options,
  children,
  popover,
}: EditableFieldProps) {
  const { dealId, onSaved } = useContext(PanelCtx);
  const [hovered, setHovered]   = useState(false);
  const [editing, setEditing]   = useState(false);
  const [inputVal, setInputVal] = useState(String(rawValue ?? ''));
  const [saving, setSaving]     = useState(false);
  const [savedOk, setSavedOk]   = useState(false);
  const [saveErr, setSaveErr]   = useState(false);
  const [showPop, setShowPop]   = useState(false);

  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>(null);

  const canEdit = !!dealId && !!apiKey && type !== 'readonly';

  useEffect(() => {
    if (editing) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing]);

  // keep inputVal in sync when rawValue changes externally
  useEffect(() => {
    if (!editing) setInputVal(String(rawValue ?? ''));
  }, [rawValue, editing]);

  const startEdit = () => {
    setInputVal(String(rawValue ?? ''));
    setSaveErr(false);
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = async () => {
    const strRaw = String(rawValue ?? '');
    if (!dealId || !apiKey) { setEditing(false); return; }
    if (inputVal === strRaw) { setEditing(false); return; }

    setSaving(true);
    setSaveErr(false);
    try {
      const payload: Partial<DealPayload> = {
        [apiKey]: type === 'number' ? Number(inputVal) : inputVal,
      };
      await updateDeal(dealId, payload);
      onSaved?.(apiKey, type === 'number' ? Number(inputVal) : inputVal);
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
    <div
      className="flex flex-col gap-1 min-w-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowPop(false); }}
    >
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">
        {label}
      </span>

      {editing ? (
        <div className="flex items-start gap-1">
          {type === 'select' ? (
            <select
              ref={inputRef}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onBlur={save}
              className="text-sm border border-blue-400 rounded-md px-2 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
            >
              {options?.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              ref={inputRef}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onBlur={save}
              onKeyDown={e => { if (e.key === 'Escape') cancel(); }}
              rows={3}
              className="text-sm border border-blue-400 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full resize-none"
            />
          ) : (
            <input
              ref={inputRef}
              type={type}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onBlur={save}
              onKeyDown={e => {
                if (e.key === 'Enter') save();
                if (e.key === 'Escape') cancel();
              }}
              className="text-sm border border-blue-400 rounded-md px-2 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
            />
          )}
          {saving && <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin flex-shrink-0 mt-1" />}
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          {/* value + optional popover */}
          <div
            className="relative flex-1 min-w-0"
            onMouseEnter={() => popover && setShowPop(true)}
            onMouseLeave={() => setShowPop(false)}
          >
            <div className="text-sm text-gray-900 font-medium leading-snug min-h-[1.25rem]">
              {savedOk ? (
                <span className="flex items-center gap-1 text-green-600 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                </span>
              ) : saveErr ? (
                <span className="flex items-center gap-1 text-red-500 text-xs">
                  ✕ Save failed
                </span>
              ) : children}
            </div>

            {showPop && popover && (
              <div className="absolute left-0 top-full mt-1 z-50 min-w-[220px] max-w-xs bg-white border border-gray-200 rounded-xl shadow-xl p-3">
                {popover}
              </div>
            )}
          </div>

          {/* pencil — appears on row hover */}
          {canEdit && hovered && !savedOk && (
            <button
              onClick={startEdit}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title={`Edit ${label}`}
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Read-only Field (no edit) ─────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">
        {label}
      </span>
      <div className="text-sm text-gray-900 font-medium leading-snug min-h-[1.25rem]">
        {children}
      </div>
    </div>
  );
}

// ── Section (collapsible) ─────────────────────────────────────────────────────

function Section({
  title, icon, children, defaultOpen = true,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 py-3 hover:bg-gray-50 rounded transition-colors -mx-1 px-1"
      >
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex-1 text-left">
          {title}
        </span>
        {open
          ? <ChevronDown  className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-10 gap-y-4">{children}</div>;
}

function Dash() {
  return <span className="text-gray-300 font-normal">—</span>;
}

// ── Main component ────────────────────────────────────────────────────────────

export const DealDetailsPanel: React.FC<DealDetailsPanelProps> = ({
  deal,
  competitors,
  expandedBattleCard,
  isAdmin,
  battleCardRef,
  onDealUpdated,
}) => {
  const [openBattleCard, setOpenBattleCard]         = useState<string | null>(null);
  const [copiedCompetitor, setCopiedCompetitor]     = useState<string | null>(null);

  useEffect(() => {
    if (expandedBattleCard != null) setOpenBattleCard(expandedBattleCard);
  }, [expandedBattleCard]);

  const handleCopyTalkingPoints = (key: string, points: string[]) => {
    const text = points.map((p, i) => `${i + 1}. ${p}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCompetitor(key);
      setTimeout(() => setCopiedCompetitor(null), 2000);
    });
  };

  const stageColors =
    STAGE_COLOR[deal.stage?.toLowerCase()] ?? STAGE_COLOR['prospecting'];

  const stageProgressPct =
    deal.totalStages > 1
      ? Math.round(((deal.stageNumber - 1) / (deal.totalStages - 1)) * 100)
      : 0;

  const probabilityAmount =
    deal.probability > 0 && deal.amount > 0
      ? formatCurrency(
          (deal.amount * deal.probability) / 100,
          deal.currency || BASE_CURRENCY_CODE,
        )
      : null;

  // PanelCtx value — propagates dealId + save callback to all EditableFields
  const ctxValue = {
    dealId: deal.id,
    onSaved: (apiKey: string, value: any) => {
      // Map API key → deal display field key so parent state stays in sync
      const fieldMap: Record<string, string> = {
        name:                  'dealName',
        assigned_to:           'owner',
        expected_close_date:   'closeDate',
        deal_type:             'dealType',
        stage:                 'stage',
        description:           'description',
        next_step:             'nextStep',
        probability:           'probability',
        company_name:          'accountName',
        contact_name:          'contactName',
        contact_title:         'contactTitle',
        value:                 'amount',
        source:                'source',
        product:               'package',
        contract_term:         'contractTerm',
        payment_terms:         'paymentTerms',
      };
      const displayKey = fieldMap[apiKey] ?? apiKey;
      onDealUpdated?.({ [displayKey]: value });
    },
  };

  return (
    <PanelCtx.Provider value={ctxValue}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">

        {/* ── Panel header ── */}
        <div className="px-6 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
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

        <div className="px-6 py-1">

          {/* ── 1. Deal Overview ── */}
          <Section title="Deal Overview" defaultOpen>
            <FieldGrid>
              {/* Deal Number — read-only */}
              <Field label="Deal Number">
                {deal.id ? <span className="font-mono text-gray-700">#{deal.id}</span> : <Dash />}
              </Field>

              {/* Deal Owner — editable + rich popover */}
              <EditableField
                label="Deal Owner"
                apiKey="assigned_to"
                rawValue={deal.owner ?? ''}
                type="text"
                popover={deal.owner ? <OwnerPopover name={deal.owner} /> : undefined}
              >
                {deal.owner || <Dash />}
              </EditableField>

              {/* Deal Name — editable */}
              <EditableField
                label="Deal Name"
                apiKey="name"
                rawValue={deal.dealName}
                type="text"
              >
                <span className="truncate block">{deal.dealName}</span>
              </EditableField>

              {/* Closing Date — editable */}
              <EditableField
                label="Closing Date"
                apiKey="expected_close_date"
                rawValue={deal.closeDate ?? ''}
                type="date"
              >
                {deal.closeDate || <Dash />}
              </EditableField>

              {/* Pipeline — read-only */}
              <Field label="Pipeline">
                {deal.accountIndustry || deal.source || <Dash />}
              </Field>

              {/* Deal Status — read-only derived */}
              <Field label="Deal Status">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  Active
                </span>
              </Field>

              {/* Deal Type — editable select */}
              <EditableField
                label="Deal Type"
                apiKey="deal_type"
                rawValue={deal.dealType || deal.package || ''}
                type="select"
                options={DEAL_TYPE_OPTIONS}
              >
                {deal.dealType || deal.package ? (
                  <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700">
                    {deal.dealType || deal.package}
                  </span>
                ) : <Dash />}
              </EditableField>

              {/* Stage — editable select + info popover */}
              <EditableField
                label="Stage"
                apiKey="stage"
                rawValue={deal.stage ?? ''}
                type="select"
                options={STAGE_OPTIONS}
                popover={<StagePopover stageKey={deal.stage ?? ''} />}
              >
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: stageColors.bg, color: stageColors.text }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stageColors.dot }}
                  />
                  {deal.stageName}
                </span>
              </EditableField>

              {/* Requirements / Brief — editable textarea */}
              <EditableField
                label="Requirements / Brief"
                apiKey="description"
                rawValue={deal.description || deal.nextStep || ''}
                type="textarea"
              >
                {deal.description || deal.nextStep || <Dash />}
              </EditableField>

              {/* Probability — editable number */}
              <EditableField
                label="Probability (%)"
                apiKey="probability"
                rawValue={deal.probability}
                type="number"
              >
                {deal.probability > 0 ? `${deal.probability}%` : <Dash />}
              </EditableField>

              {/* Stage Progress — read-only derived */}
              <Field label="Stage Progress">
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${stageProgressPct}%`, backgroundColor: stageColors.dot }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-500 whitespace-nowrap">
                    {deal.stageNumber} / {deal.totalStages}
                  </span>
                </div>
              </Field>

              {/* Win Probability AI — read-only */}
              <Field label="Win Probability (AI)">
                {deal.winProbAI && deal.winProbAI > 0 ? `${deal.winProbAI}%` : <Dash />}
              </Field>
            </FieldGrid>
          </Section>

          {/* ── 2. Client & Partner Information ── */}
          <Section
            title="Client & Partner Information"
            icon={<Building2 className="h-3.5 w-3.5" />}
          >
            <FieldGrid>
              <EditableField
                label="Account Name"
                apiKey="company_name"
                rawValue={deal.accountName ?? ''}
                type="text"
              >
                {deal.accountName ? (
                  <span className="text-blue-600 hover:underline cursor-pointer">{deal.accountName}</span>
                ) : <Dash />}
              </EditableField>

              <EditableField
                label="Contact Name"
                apiKey="contact_name"
                rawValue={deal.contactName ?? ''}
                type="text"
              >
                {deal.contactName ? (
                  <span className="text-blue-600 hover:underline cursor-pointer">{deal.contactName}</span>
                ) : <Dash />}
              </EditableField>

              <EditableField
                label="Buying Role"
                apiKey="contact_title"
                rawValue={deal.contactTitle ?? ''}
                type="select"
                options={CONTACT_ROLE_OPTIONS}
              >
                {deal.contactTitle || <Dash />}
              </EditableField>

              <Field label="Account Industry">
                {deal.accountIndustry || <Dash />}
              </Field>
            </FieldGrid>
          </Section>

          {/* ── 3. Revenue Information ── */}
          <Section title="Revenue Information" defaultOpen>
            <FieldGrid>
              <Field label="Currency">{deal.currency || 'USD'}</Field>
              <Field label="Platform Fee (%)"><Dash /></Field>

              <Field label="Exchange Rate">1</Field>
              <Field label="Custom Fee ($)"><Dash /></Field>

              <EditableField
                label="Amount"
                apiKey="value"
                rawValue={deal.amount}
                type="number"
              >
                {deal.amount > 0
                  ? formatCurrency(deal.amount, deal.currency || BASE_CURRENCY_CODE)
                  : <Dash />}
              </EditableField>
              <Field label="License Fee ($)"><Dash /></Field>

              <Field label="NR Margin (%)"><Dash /></Field>
              <Field label="Onboarding Fee ($)"><Dash /></Field>

              <Field label="Probability Amount">
                {probabilityAmount || <Dash />}
              </Field>
              <Field label="White-labelling Fee ($)"><Dash /></Field>
            </FieldGrid>
          </Section>

          {/* ── 4. Deal Scope & Configuration ── */}
          <Section title="Deal Scope & Configuration" defaultOpen>
            <FieldGrid>
              <EditableField
                label="Package"
                apiKey="product"
                rawValue={deal.package ?? ''}
                type="text"
              >
                {deal.package || <Dash />}
              </EditableField>
              <Field label="Start Date"><Dash /></Field>

              <EditableField
                label="Contract Term"
                apiKey="contract_term"
                rawValue={deal.contractTerm ?? ''}
                type="text"
              >
                {deal.contractTerm || <Dash />}
              </EditableField>
              <Field label="End Date">{deal.closeDate || <Dash />}</Field>

              <EditableField
                label="Payment Terms"
                apiKey="payment_terms"
                rawValue={deal.paymentTerms ?? ''}
                type="select"
                options={PAYMENT_TERMS_OPTIONS}
              >
                {deal.paymentTerms || <Dash />}
              </EditableField>
              <Field label="Duration">{deal.contractTerm || <Dash />}</Field>

              <EditableField
                label="Source"
                apiKey="source"
                rawValue={deal.source ?? ''}
                type="select"
                options={SOURCE_OPTIONS}
              >
                {deal.source || <Dash />}
              </EditableField>
              <Field label="Country / Region"><Dash /></Field>
            </FieldGrid>

            {deal.tags && deal.tags.length > 0 && (
              <div className="mt-4">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {deal.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* ── 5. Commercial Documentations & Links ── */}
          <Section title="Commercial Documentations & Links" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-x-10 gap-y-4">
              {['Sales Drive Folder', 'Agreement', 'Account & Module Setup', 'Client Discovers'].map(doc => (
                <Field key={doc} label={doc}><Dash /></Field>
              ))}
            </div>
          </Section>

          {/* ── 6. Record Information ── */}
          <Section title="Record Information" defaultOpen={false}>
            <FieldGrid>
              <Field label="Created By">
                <div className="flex flex-col gap-0.5">
                  <span>{deal.owner || '—'}</span>
                  {deal.createdDate && (
                    <span className="text-[11px] text-gray-400 font-normal">{deal.createdDate}</span>
                  )}
                </div>
              </Field>
              <Field label="Discovery Date"><Dash /></Field>

              <Field label="Modified By"><Dash /></Field>
              <Field label="Source / Lead ID">{deal.source || <Dash />}</Field>
            </FieldGrid>
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
                  const key   = competitor.toLowerCase();
                  const card  = BATTLE_CARDS[key];
                  const isOpen = openBattleCard === key;

                  return (
                    <div key={competitor} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenBattleCard(isOpen ? null : key)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          {isOpen
                            ? <ChevronDown  className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            : <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-900">{competitor}</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                            Competitor
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {isOpen ? 'Hide' : 'View Battle Card'}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="border-t border-gray-200 bg-white">
                          {card ? (
                            <div className="p-4 space-y-4">
                              <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  <span className="text-[11px] font-bold text-green-800 uppercase tracking-wide">
                                    We Win When
                                  </span>
                                </div>
                                <ul className="space-y-1.5 pl-1">
                                  {card.weWinWhen.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                      <span className="text-green-500 font-bold flex-shrink-0 mt-0.5 text-xs">✓</span>
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                                  <span className="text-[11px] font-bold text-red-700 uppercase tracking-wide">
                                    They Win When
                                  </span>
                                </div>
                                <ul className="space-y-1.5 pl-1">
                                  {card.theyWinWhen.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                      <span className="text-red-400 font-bold flex-shrink-0 mt-0.5 text-xs">✕</span>
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">
                                    Killer Question
                                  </span>
                                </div>
                                <p className="text-sm text-blue-900 italic">"{card.killerQuestion}"</p>
                              </div>

                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Trophy className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wide">
                                    Proof Point
                                  </span>
                                </div>
                                <p className="text-sm text-purple-900">
                                  <span className="font-semibold">{card.proofPoint.company}:</span>{' '}
                                  {card.proofPoint.outcome}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => handleCopyTalkingPoints(key, card.weWinWhen)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  {copiedCompetitor === key ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-green-500" />
                                      <span className="text-green-700">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      Copy talking points
                                    </>
                                  )}
                                </button>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                  >
                                    Update Battle Card
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4">
                              <p className="text-sm text-gray-500">
                                No battle card data available for {competitor}.
                              </p>
                              {isAdmin && (
                                <button type="button" className="mt-2 text-xs text-blue-600 hover:underline">
                                  + Create Battle Card
                                </button>
                              )}
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
