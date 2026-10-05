import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Card, { SectionHeading } from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Field, { inputClass, selectClass, textareaClass } from '../../components/ui/Field';
import { useToast } from '../../contexts/ToastContext';
import { useLeads } from '../../contexts/LeadContext';
import { fetchLeadByIdFromAPI, saveLeadViaAPI } from '../../utils/leadsApi';
import type { LeadEditPayload } from '../../utils/leadsApi';
import type { Lead } from '../../types/lead';

/**
 * EDIT LEAD — /crm/leads/:id/edit. Group A item 1 (2026-10-05).
 *
 * There was no lead editor at all: the route did not exist, and both Edit
 * entry points (Lead detail, the row menu) opened a blank page until they were
 * disabled in slice 3B-2. Laid out after the Figma "Add lead" frame (61:701).
 *
 * Rules it keeps:
 *   - Only CHANGED fields are sent, so a save cannot overwrite a field this form
 *     did not touch.
 *   - Success is shown only after the server confirms (PUT /leads/:id 2xx); a
 *     refusal keeps every input and shows the server's message.
 *   - The lifecycle stage is NOT editable here — it changes only through the
 *     transition endpoint (the gate + history), i.e. the lifecycle menu.
 *   - Owner is shown, not edited: owner pickers move to the real user list in
 *     Group A item 8, and a picker of placeholder names is what that item removes.
 *   - Blank means "not recorded": clearing a field stores NULL, never a default.
 */

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
const SOURCES = ['Website', 'Referral', 'HRMS', 'Lead Gen', 'Manual'];
const CURRENCIES = ['INR', 'USD', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'EGP', 'ZAR', 'KES', 'NGN', 'GBP', 'EUR'];

type FormKey =
  | 'first_name' | 'last_name' | 'email' | 'phone' | 'mobile' | 'company' | 'position' | 'industry'
  | 'source' | 'source_detail' | 'utm_source' | 'utm_medium' | 'utm_campaign' | 'referral_contact'
  | 'department' | 'priority' | 'value' | 'currency' | 'company_size' | 'website' | 'linkedin_url'
  | 'city' | 'country' | 'notes' | 'tags';
type FormState = Record<FormKey, string>;

const fromLead = (l: Lead): FormState => ({
  first_name: l.first_name ?? '', last_name: l.last_name ?? '', email: l.email ?? '', phone: l.phone ?? '',
  mobile: l.mobile ?? '', company: l.company ?? '', position: l.position ?? '', industry: l.industry ?? '',
  source: l.source ?? '', source_detail: l.source_detail ?? '', utm_source: l.utm_source ?? '',
  utm_medium: l.utm_medium ?? '', utm_campaign: l.utm_campaign ?? '', referral_contact: l.referral_contact ?? '',
  department: l.department ?? '', priority: l.priority ?? '',
  value: l.estimated_value == null ? '' : String(l.estimated_value), currency: l.currency ?? '',
  company_size: l.company_size ?? '', website: l.website ?? '', linkedin_url: l.linkedin_url ?? '',
  city: l.city ?? '', country: l.country ?? '', notes: l.notes ?? '', tags: (l.tags ?? []).join(', '),
});

/** The changed fields, in the API's own names; blank -> null ("not recorded"). */
export function diffLeadForm(before: FormState, after: FormState): LeadEditPayload {
  const out: Record<string, unknown> = {};
  (Object.keys(after) as FormKey[]).forEach(k => {
    if (after[k].trim() === before[k].trim()) return;
    const v = after[k].trim();
    if (k === 'tags') out.tags = v ? v.split(',').map(t => t.trim()).filter(Boolean) : [];
    else if (k === 'value') out.value = v === '' ? null : Number(v);
    else if (k === 'first_name' || k === 'email') out[k] = v;   // required: never null
    else out[k] = v === '' ? null : v;
  });
  return out as LeadEditPayload;
}

/** Client-side checks that mirror the server's, so most mistakes never round-trip. */
export function validateLeadForm(f: FormState): Partial<Record<FormKey, string>> {
  const e: Partial<Record<FormKey, string>> = {};
  if (!f.first_name.trim()) e.first_name = 'First name is required.';
  if (!f.email.trim()) e.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'This does not look like an email address.';
  if (f.value.trim() !== '') {
    const n = Number(f.value);
    if (!Number.isFinite(n) || n < 0) e.value = 'Enter a number of zero or more.';
  }
  return e;
}

const LeadEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { notifyWrite } = useLeads();

  const [lead, setLead] = useState<Lead | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initial, setInitial] = useState<FormState | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchLeadByIdFromAPI(id)
      .then(l => {
        if (!l) { setState('missing'); return; }
        setLead(l); const f = fromLead(l); setInitial(f); setForm(f); setState('ok');
      })
      .catch(e => { setLoadError(e instanceof Error ? e.message : 'The lead could not be loaded.'); setState('error'); });
  }, [id]);

  const errors = useMemo(() => (form ? validateLeadForm(form) : {}), [form]);
  const changes = useMemo(() => (initial && form ? diffLeadForm(initial, form) : {}), [initial, form]);
  const changedCount = Object.keys(changes).length;

  if (state === 'loading') return <p className="py-16 text-center text-sm text-ink-muted" role="status">Loading lead…</p>;
  if (state === 'error') {
    return <div className="mx-auto max-w-xl py-12"><EmptyState tone="error" title="This lead could not load" reason={loadError ?? 'The server did not answer.'} /></div>;
  }
  if (state === 'missing' || !lead || !form || !initial) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <EmptyState title="Lead not found" reason="It does not exist in this workspace, or it was deleted."
          action={<Button onClick={() => navigate('/crm/leads')}>Back to Leads</Button>} />
      </div>
    );
  }

  const set = (k: FormKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => (prev ? { ...prev, [k]: e.target.value } : prev));
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Lead';
  const err = (k: FormKey) => (touched ? errors[k] : undefined);

  const save = async () => {
    setTouched(true);
    if (Object.keys(errors).length || changedCount === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveLeadViaAPI(lead.id, changes);
      notifyWrite();
      showToast('Lead saved', 'success');
      navigate(`/crm/leads/${lead.id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'The lead was not saved.');
    } finally {
      setSaving(false);
    }
  };

  const sourceOptions = form.source && !SOURCES.includes(form.source) ? [form.source, ...SOURCES] : SOURCES;
  const currencyOptions = form.currency && !CURRENCIES.includes(form.currency) ? [form.currency, ...CURRENCIES] : CURRENCIES;
  const actions = (
    <>
      <Button variant="secondary" onClick={() => navigate(`/crm/leads/${lead.id}`)} disabled={saving}>Cancel</Button>
      <Button onClick={() => void save()} loading={saving} disabled={changedCount === 0}>
        {changedCount === 0 ? 'No changes' : 'Save lead'}
      </Button>
    </>
  );

  return (
    <form
      className="mx-auto flex max-w-[1240px] flex-col gap-4 pt-6 pb-8"
      onSubmit={e => { e.preventDefault(); void save(); }}
      noValidate
    >
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
        <Link to="/crm/leads" className="font-semibold text-brand-600 hover:text-brand-700">Leads</Link>
        <span className="text-ink-muted" aria-hidden="true">/</span>
        <Link to={`/crm/leads/${lead.id}`} className="font-semibold text-brand-600 hover:text-brand-700">{name}</Link>
        <span className="text-ink-muted" aria-hidden="true">/</span>
        <span className="text-ink-muted" aria-current="page">Edit</span>
      </nav>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] font-bold leading-10 text-ink">Edit lead</h1>
          <p className="text-sm leading-[22px] text-ink-muted">
            Changes are saved only when the server confirms them. The lifecycle stage changes from the lead's page.
          </p>
        </div>
        <div className="flex gap-2">{actions}</div>
      </header>

      {saveError && <Alert tone="danger" title="The lead was not saved">{saveError} Your changes are still here.</Alert>}

      <Card padding="md" className="flex flex-col gap-3">
        <SectionHeading title="Core information" description="First name and email are required." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="First name" required error={err('first_name')}><input className={inputClass(!!err('first_name'))} value={form.first_name} onChange={set('first_name')} /></Field>
          <Field label="Last name"><input className={inputClass()} value={form.last_name} onChange={set('last_name')} /></Field>
          <Field label="Work email" required error={err('email')}><input type="email" className={inputClass(!!err('email'))} value={form.email} onChange={set('email')} /></Field>
          <Field label="Phone"><input className={inputClass()} value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Mobile"><input className={inputClass()} value={form.mobile} onChange={set('mobile')} /></Field>
          <Field label="Company"><input className={inputClass()} value={form.company} onChange={set('company')} /></Field>
          <Field label="Job title"><input className={inputClass()} value={form.position} onChange={set('position')} /></Field>
          <Field label="Department"><input className={inputClass()} value={form.department} onChange={set('department')} /></Field>
        </div>
      </Card>

      <Card padding="md" className="flex flex-col gap-3">
        <SectionHeading title="Lead source" description="Where this lead came from. Tracking values are kept exactly as entered." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Source">
            <select className={selectClass()} value={form.source} onChange={set('source')}>
              <option value="">Not recorded</option>
              {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Source detail" help="For example, the page or event the lead came from.">
            <input className={inputClass()} value={form.source_detail} onChange={set('source_detail')} />
          </Field>
          <Field label="UTM source"><input className={inputClass()} value={form.utm_source} onChange={set('utm_source')} /></Field>
          <Field label="UTM medium"><input className={inputClass()} value={form.utm_medium} onChange={set('utm_medium')} /></Field>
          <Field label="UTM campaign"><input className={inputClass()} value={form.utm_campaign} onChange={set('utm_campaign')} /></Field>
          <Field label="Referral contact"><input className={inputClass()} value={form.referral_contact} onChange={set('referral_contact')} /></Field>
        </div>
      </Card>

      <Card padding="md" className="flex flex-col gap-3">
        <SectionHeading title="Assignment" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Owner" help="Choosing an owner from your team arrives with the owner-picker work.">
            <input className={inputClass()} value={lead.owner_name || 'Unassigned'} readOnly />
          </Field>
          <Field label="Priority">
            <select className={selectClass()} value={form.priority} onChange={set('priority')}>
              <option value="">Not recorded</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card padding="md" className="flex flex-col gap-3">
        <SectionHeading title="Additional details" description="Optional. Blank means not recorded." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Industry"><input className={inputClass()} value={form.industry} onChange={set('industry')} /></Field>
          <Field label="Company size">
            <select className={selectClass()} value={form.company_size} onChange={set('company_size')}>
              <option value="">Not recorded</option>
              {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
            </select>
          </Field>
          <Field label="Estimated deal value" error={err('value')}>
            <input inputMode="decimal" className={inputClass(!!err('value'))} value={form.value} onChange={set('value')} />
          </Field>
          <Field label="Currency" help={form.value.trim() && !form.currency ? 'A value without a currency is shown as "currency not recorded".' : undefined}>
            <select className={selectClass()} value={form.currency} onChange={set('currency')}>
              <option value="">Not recorded</option>
              {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Website"><input className={inputClass()} value={form.website} onChange={set('website')} /></Field>
          <Field label="LinkedIn"><input className={inputClass()} value={form.linkedin_url} onChange={set('linkedin_url')} /></Field>
          <Field label="City"><input className={inputClass()} value={form.city} onChange={set('city')} /></Field>
          <Field label="Country"><input className={inputClass()} value={form.country} onChange={set('country')} /></Field>
          <Field label="Tags" help="Separate tags with commas." className="md:col-span-2">
            <input className={inputClass()} value={form.tags} onChange={set('tags')} />
          </Field>
          <Field label="Notes" className="md:col-span-2">
            <textarea className={textareaClass()} value={form.notes} onChange={set('notes')} />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end gap-2">{actions}</div>
    </form>
  );
};

export default LeadEditPage;
