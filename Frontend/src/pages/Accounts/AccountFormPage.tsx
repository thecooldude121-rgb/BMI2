import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, SectionHeading } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { Field, inputClass, selectClass, textareaClass } from '../../components/ui/Field';
import PageHeader from '../../components/Layout/PageHeader';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { useAccounts } from '../../contexts/AccountsContext';
import { useAccountById } from '../../hooks/useAccountById';
import { fetchAccountsPage } from '../../utils/accountsApi';
import { fetchIndustries } from '../../utils/industriesApi';
import { useToast } from '../../contexts/ToastContext';
import { validateURL, formatURL, formatPhoneNumber, saveToLocalStorage, loadFromLocalStorage, clearLocalStorage } from '../../utils/accountFormUtils';
import type { EnhancedAccount } from '../../types/accounts';

/**
 * Add / edit account — H1 (2026-10-13): EVERY FIELD HERE IS A COLUMN ON `companies`.
 *
 * The form this replaces collected ~40 fields and saved 13. Legal / trade name,
 * sub-industry, specialization, target market, offices, founders, founded date,
 * employee growth, revenue history and currency, funding rounds, valuation,
 * tech stack, owner, status, priority, tags, account source, an "HRMS
 * connection" flag and notes all went into a `customFields` object that
 * mapAccountToPayload never sends — typed, then lost on Save under "Account
 * updated successfully". Decided: a field that cannot be saved is not
 * collected. Also removed, because they were invented:
 *   - "Last Modified: Nov 16, 2025 by Alex Rodriguez" — a literal on every account;
 *   - a preview reading "0 deals · 0 contacts" for every account — literals;
 *   - "Verified" ticks on name / industry / website — nothing verifies anything;
 *   - an "AI suggestions" panel of canned advice with no evidence, including an
 *     "HRMS opportunity" that crossed into another product;
 *   - "Save as Draft", which SAVED TO THE SERVER under a draft label;
 *   - a "Trade Name" placeholder of "TechStart" (a fixture name).
 *
 * Kept: the server-side duplicate-name check (slice 3b), the served industry
 * vocabulary (migration 045), success only after the server's 2xx, and a
 * browser-local draft for a NEW account (offered inline, never a browser dialog).
 * The accounts that need the missing fields (source, founded year, funding,
 * technology, lifecycle, owner, visibility, address line 2) are a schema
 * decision, listed in the Figma comparison.
 */

/** companies.size, as the database holds it. "1000+" is one band there. */
const SIZE_OPTIONS: { value: NonNullable<EnhancedAccount['accountSize']>; label: string }[] = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  // mapAccountToPayload stores this as '1000+'. The old form also offered
  // "5000+", which was stored as '1000+' too and read back as this band.
  { value: '1001-5000', label: '1000+ employees' },
];

export interface AccountFormData {
  name: string;
  industry: string;
  domain: string;
  website: string;
  phone: string;
  description: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  accountSize: EnhancedAccount['accountSize'] | '';
  /** companies.revenue (bigint). No currency column exists — see the help text. */
  annualRevenue: string;
}

const EMPTY: AccountFormData = {
  name: '', industry: '', domain: '', website: '', phone: '', description: '',
  street: '', city: '', state: '', postalCode: '', country: '', accountSize: '', annualRevenue: '',
};

const fromAccount = (a: EnhancedAccount): AccountFormData => ({
  name: a.name ?? '',
  industry: a.industry ?? '',
  domain: a.domain ?? '',
  website: a.website ?? '',
  phone: a.phone ?? '',
  description: a.description ?? '',
  street: a.billingAddress?.street ?? '',
  city: a.billingAddress?.city ?? '',
  state: a.billingAddress?.state ?? '',
  postalCode: a.billingAddress?.postalCode ?? '',
  country: a.billingAddress?.country ?? '',
  accountSize: a.accountSize ?? '',
  annualRevenue: a.annualRevenue ? String(a.annualRevenue) : '',
});

/** Exactly what mapAccountToPayload reads — nothing that would be dropped. */
export function toAccountPayload(f: AccountFormData): Partial<EnhancedAccount> {
  return {
    name: f.name.trim(),
    industry: f.industry,
    domain: f.domain.trim(),
    website: f.website.trim(),
    phone: f.phone.trim(),
    description: f.description.trim(),
    billingAddress: {
      street: f.street.trim(), city: f.city.trim(), state: f.state.trim(),
      postalCode: f.postalCode.trim(), country: f.country.trim(),
    },
    accountSize: f.accountSize || undefined,
    annualRevenue: f.annualRevenue.trim() ? Number(f.annualRevenue) : undefined,
  } as Partial<EnhancedAccount>;
}

/** The fields counted by the completeness line, as the frame's "12 of 14 fields". */
const COMPLETENESS: (keyof AccountFormData)[] = [
  'name', 'industry', 'domain', 'website', 'phone', 'description',
  'street', 'city', 'country', 'accountSize', 'annualRevenue',
];

type SaveAction = 'view' | 'contact' | 'deal' | 'another';

const AccountFormPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { createAccount, updateAccount } = useAccounts();
  const { showToast } = useToast();

  const isEditMode = !!accountId && accountId !== 'add';
  // By id from the server (slice 3b): the context held only the first 200.
  const { account: existingAccount } = useAccountById(isEditMode ? accountId : undefined);
  const draftKey = 'account-form-draft-v2-new';

  const [form, setForm] = useState<AccountFormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof AccountFormData, string>>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [draft, setDraft] = useState<AccountFormData | null>(null);

  const [industries, setIndustries] = useState<string[]>([]);
  const [industryError, setIndustryError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetchIndustries()
      .then(list => { if (live) setIndustries(list); })
      .catch(e => { if (live) setIndustryError(e instanceof Error ? e.message : 'Could not load the industry list'); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (isEditMode && existingAccount) { setForm(fromAccount(existingAccount)); setDirty(false); }
  }, [isEditMode, existingAccount]);

  // A NEW account's draft lives in this browser only. Offered inline — the old
  // form raised a window.confirm() on load.
  useEffect(() => {
    if (isEditMode) return;
    const saved = loadFromLocalStorage(draftKey) as AccountFormData | null;
    if (saved && typeof saved === 'object' && 'name' in saved) setDraft({ ...EMPTY, ...saved });
  }, [isEditMode]);
  const autosave = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isEditMode || !dirty) return;
    if (autosave.current) clearTimeout(autosave.current);
    autosave.current = setTimeout(() => saveToLocalStorage(draftKey, form), 5000);
    return () => { if (autosave.current) clearTimeout(autosave.current); };
  }, [form, dirty, isEditMode]);

  // Possible duplicates from a SERVER search (slice 3b).
  const [nameMatches, setNameMatches] = useState<EnhancedAccount[]>([]);
  useEffect(() => {
    const name = form.name.trim();
    if (name.length <= 2) { setNameMatches([]); return; }
    let cancelled = false;
    const t = setTimeout(() => {
      fetchAccountsPage({ search: name, limit: 5 })
        .then(r => { if (!cancelled) setNameMatches(r.accounts.filter(a => a.id !== accountId)); })
        .catch(() => { if (!cancelled) setNameMatches([]); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [form.name, accountId]);

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);

  const set = (field: keyof AccountFormData, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setDirty(true);
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof AccountFormData, string>> = {};
    if (!form.name.trim()) e.name = 'Company name is required';
    if (!form.industry) e.industry = 'Choose an industry';
    if (form.website.trim() && !validateURL(form.website.trim())) e.website = 'Enter a full URL, for example https://example.com';
    if (form.annualRevenue.trim() && !(Number(form.annualRevenue) >= 0)) e.annualRevenue = 'Enter a number of 0 or more';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (action: SaveAction) => {
    setSaveError(null);
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = toAccountPayload(form);
      let id: string;
      if (isEditMode) {
        await updateAccount(accountId!, payload);
        id = accountId!;
      } else {
        id = (await createAccount(payload)).id;
      }
      // Reached only after the server's 2xx.
      showToast('success', isEditMode ? 'Account updated' : 'Account created');
      setDirty(false);
      clearLocalStorage(draftKey);
      if (action === 'view') navigate(`/crm/accounts/${id}`);
      if (action === 'contact') navigate(`/crm/contacts/add?accountId=${encodeURIComponent(id)}&accountName=${encodeURIComponent(payload.name ?? '')}`);
      if (action === 'deal') navigate(`/crm/deals/add?accountId=${encodeURIComponent(id)}&accountName=${encodeURIComponent(payload.name ?? '')}`);
      if (action === 'another') { setForm(EMPTY); setErrors({}); }
    } catch (err) {
      // The server's own message, and the input is kept.
      setSaveError(err instanceof Error ? err.message : 'The account was not saved.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); void handleSave('view'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const leave = () => navigate(isEditMode ? `/crm/accounts/${accountId}` : '/crm/accounts');
  const filled = useMemo(() => COMPLETENESS.filter(k => String(form[k] ?? '').trim() !== '').length, [form]);

  const location = [form.city, form.state, form.country].filter(s => s.trim()).join(', ');
  const sizeLabel = SIZE_OPTIONS.find(o => o.value === form.accountSize)?.label;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account record"
        title={isEditMode ? 'Edit Account' : 'Add New Account'}
        description={isEditMode && existingAccount ? existingAccount.name : 'Only fields this CRM stores are shown.'}
        actions={
          <>
            {dirty && <span className="rounded-full bg-warning-100 px-2 py-0.5 text-xs font-semibold text-warning-700">Unsaved changes</span>}
            <Button variant="secondary" onClick={() => (dirty ? setShowCancel(true) : leave())}>Cancel</Button>
            <Button onClick={() => void handleSave('view')} disabled={isSaving}>
              <Save className="h-4 w-4" aria-hidden="true" /> {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      />

      {draft && (
        <Alert
          tone="info"
          title="An unsaved draft of a new account is stored in this browser."
          action={
            <span className="flex gap-2">
              <Button variant="secondary" onClick={() => { setForm(draft); setDirty(true); setDraft(null); }}>Restore</Button>
              <Button variant="ghost" onClick={() => { clearLocalStorage(draftKey); setDraft(null); }}>Discard</Button>
            </span>
          }
        />
      )}
      {saveError && <Alert tone="danger" title="The account was not saved">{saveError}</Alert>}
      {nameMatches.length > 0 && (
        <Alert tone="warning" title="Similar accounts already exist">
          <ul className="mt-1 space-y-1">
            {nameMatches.slice(0, 3).map(a => (
              <li key={a.id}>
                <a href={`/crm/accounts/${a.id}`} target="_blank" rel="noreferrer" className="font-semibold underline">{a.name}</a>
                {a.industry ? ` · ${a.industry}` : ''}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4">
            <SectionHeading title="Basic Information" />
            <Field label="Company name" required error={errors.name}>
              <input name="name" className={inputClass(!!errors.name)} value={form.name} onChange={e => set('name', e.target.value)} />
            </Field>
            <Field label="Industry" required error={errors.industry ?? (industryError ? `The industry list could not load — ${industryError}` : undefined)}>
              <select name="industry" className={selectClass(!!errors.industry)} value={form.industry}
                onChange={e => set('industry', e.target.value)} disabled={industries.length === 0 && !industryError}>
                <option value="">{industries.length === 0 && !industryError ? 'Loading…' : 'Choose an industry'}</option>
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
                {/* An existing value outside the list is shown, not silently blanked. */}
                {form.industry && !industries.includes(form.industry) && <option value={form.industry}>{form.industry}</option>}
              </select>
            </Field>
            <Field label="Description">
              <textarea name="description" className={textareaClass()} value={form.description} onChange={e => set('description', e.target.value)} />
            </Field>
          </Card>

          <Card className="space-y-4">
            <SectionHeading title="Contact Details" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Website" error={errors.website}>
                <input name="website" className={inputClass(!!errors.website)} value={form.website}
                  onChange={e => set('website', e.target.value)}
                  onBlur={() => form.website.trim() && set('website', formatURL(form.website.trim()))} placeholder="https://" />
              </Field>
              <Field label="Domain" help="Used to match contacts and leads to this account by email domain.">
                <input name="domain" className={inputClass()} value={form.domain} onChange={e => set('domain', e.target.value)} placeholder="example.com" />
              </Field>
              <Field label="Phone">
                <input name="phone" className={inputClass()} value={form.phone} onChange={e => set('phone', e.target.value)}
                  onBlur={() => form.phone.trim() && set('phone', formatPhoneNumber(form.phone.trim()))} />
              </Field>
            </div>
          </Card>

          <Card className="space-y-4">
            <SectionHeading title="Location" />
            <Field label="Street address">
              <input name="street" className={inputClass()} value={form.street} onChange={e => set('street', e.target.value)} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="City"><input name="city" className={inputClass()} value={form.city} onChange={e => set('city', e.target.value)} /></Field>
              <Field label="State / region"><input name="state" className={inputClass()} value={form.state} onChange={e => set('state', e.target.value)} /></Field>
              <Field label="Postal code"><input name="postalCode" className={inputClass()} value={form.postalCode} onChange={e => set('postalCode', e.target.value)} /></Field>
              <Field label="Country"><input name="country" className={inputClass()} value={form.country} onChange={e => set('country', e.target.value)} /></Field>
            </div>
          </Card>

          <Card className="space-y-4">
            <SectionHeading title="Company Details" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Company size">
                <select name="accountSize" className={selectClass()} value={form.accountSize ?? ''} onChange={e => set('accountSize', e.target.value)}>
                  {/* Empty is a real choice: an unknown size stays unknown. */}
                  <option value="">Not specified</option>
                  {SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Annual revenue" error={errors.annualRevenue}
                help="A number only — this CRM does not record the revenue's currency.">
                <input name="annualRevenue" type="number" min="0" className={inputClass(!!errors.annualRevenue)}
                  value={form.annualRevenue} onChange={e => set('annualRevenue', e.target.value)} />
              </Field>
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="space-y-2">
            <SectionHeading title="Preview" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-heading text-white">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{form.name.trim() || 'Company name'}</p>
                <p className="truncate text-sm text-brand-600">{[form.industry, form.city].filter(Boolean).join(' · ') || 'Industry · City'}</p>
              </div>
            </div>
            <dl className="space-y-1 text-sm">
              {form.website && <div className="flex gap-2"><dt className="text-ink-muted">Website</dt><dd className="truncate text-ink">{form.website}</dd></div>}
              {location && <div className="flex gap-2"><dt className="text-ink-muted">Location</dt><dd className="text-ink">{location}</dd></div>}
              {sizeLabel && <div className="flex gap-2"><dt className="text-ink-muted">Size</dt><dd className="text-ink">{sizeLabel}</dd></div>}
            </dl>
          </Card>

          <Card className="space-y-2" data-testid="completeness">
            <SectionHeading title="Data completeness" />
            <p className="text-sm text-ink">{filled} of {COMPLETENESS.length} fields filled</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
              <div className="h-full bg-brand-600" style={{ width: `${(filled / COMPLETENESS.length) * 100}%` }} />
            </div>
            <p className="text-xs text-ink-muted">Counts filled fields only. Nothing here is checked against an outside source.</p>
          </Card>

          <Card className="space-y-2">
            <SectionHeading title="Save Options" />
            <Button className="w-full" onClick={() => void handleSave('view')} disabled={isSaving}>Save &amp; View</Button>
            <Button variant="secondary" className="w-full" onClick={() => void handleSave('contact')} disabled={isSaving}>Save &amp; Add Contact</Button>
            <Button variant="secondary" className="w-full" onClick={() => void handleSave('deal')} disabled={isSaving}>Save &amp; Create Deal</Button>
            {!isEditMode && (
              <Button variant="secondary" className="w-full" onClick={() => void handleSave('another')} disabled={isSaving}>Save &amp; Add Another</Button>
            )}
            <p className="text-xs text-ink-muted">Ctrl/⌘ + S saves and opens the account.</p>
          </Card>
        </aside>
      </div>

      <ConfirmationModal
        isOpen={showCancel}
        type="warning"
        title="Discard changes?"
        message="Your changes to this account have not been saved."
        confirmLabel="Discard"
        onCancel={() => setShowCancel(false)}
        onConfirm={() => { clearLocalStorage(draftKey); setShowCancel(false); leave(); }}
      />
    </div>
  );
};

export default AccountFormPage;
