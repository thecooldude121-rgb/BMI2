import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, Briefcase, CheckCircle, FileText,
  Linkedin, MapPin, Save, Tag, User, X,
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { NotAvailable, NotAvailableBadge } from '../../components/common/NotAvailable';
import { useToast } from '../../contexts/ToastContext';
import {
  createContactViaAPI, fetchContactById, fetchContacts, updateContactViaAPI,
} from '../../utils/contactsApi';
import { getUsers, searchCompanies } from '../../utils/dealsApi';
import { findDuplicateMatches, computeRisk } from '../../utils/leadDuplicates';
import type { DuplicateMatch, DuplicateRisk } from '../../utils/leadDuplicates';
import type { Contact, ContactSource, ContactStatus } from '../../types/contact';

/**
 * Add / edit a contact.
 *
 * REBUILT. What was here before did not save, and did not load either:
 *
 *  - `handleSave` was a setTimeout(800) followed by "✅ Contact saved! Creating
 *    deal..." in four of its five branches. Nothing was persisted. The fifth
 *    branch said "This contact was NOT saved" — one function telling the truth
 *    and a lie depending on which checkbox was ticked.
 *  - `loadContactData(contactId)` ignored its argument and set John Smith of
 *    Acme Corp, "Budget confirmed at $50K", for every id. Opening any real
 *    contact for editing showed someone else's record — and saving would have
 *    overwritten yours with his.
 *  - `enrichContactData` was per-email fixtures with `Math.random() < 0.1`
 *    simulating a network failure. Its `formData.email === 'john@acme.com'`
 *    branch appeared twice; the first assigned Sarah Lee's LinkedIn profile,
 *    title and employer to John Smith, and the second was unreachable.
 *  - `checkForDuplicates` compared the email against the literal string
 *    'john@acme.com', so it fired for one address in the world.
 *  - `searchCompanies` filtered a hardcoded list of four companies.
 *  - `validateEmail` reported "✅ Valid and deliverable" whenever the address
 *    matched a regex and did not contain the substrings "invalid" or "fake".
 *    Nothing checked deliverability. Format is all that is claimed now.
 *  - `formatPhoneNumber` lost data: any number over 11 digits was truncated, so
 *    +44 20 7946 0958 was stored as "+4 420-794-6095" — a different number,
 *    missing its last digit. It now only reformats a 10-digit NANP number and
 *    otherwise leaves input exactly as typed.
 *
 * Migration 020 added the columns for the 11 fields the form collected and
 * threw away (address, timezone, source, status, tags, notes, owner). Everything
 * rendered below is now backed by a column, except where marked otherwise.
 */

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  linkedin: string;
  company: string;
  companyId?: string;
  jobTitle: string;
  department: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  timezone: string;
  source: ContactSource | '';
  tags: string[];
  ownerId: number | null;
  status: ContactStatus;
  notes: string;
}

const EMPTY_FORM: ContactFormData = {
  firstName: '', lastName: '', email: '', phone: '', mobile: '', linkedin: '',
  company: '', companyId: undefined, jobTitle: '', department: '',
  street: '', city: '', state: '', postalCode: '', country: '',
  timezone: '', source: '', tags: [], ownerId: null, status: 'active', notes: '',
};

const DEPARTMENTS = ['Sales', 'Marketing', 'Engineering', 'HR', 'Finance', 'Operations', 'Customer Success'];

/**
 * Labels for the values in contacts_source_check. The values are the
 * constraint's; only the labels are ours. 'converted' and 'event' are included
 * because the constraint allows them.
 */
const SOURCE_LABELS: Record<ContactSource, string> = {
  'lead-gen':  'Lead generation tool',
  'hrms':      'HRMS (recruitment)',
  'converted': 'Converted from a lead',
  'manual':    'Manual entry',
  'website':   'Website form',
  'referral':  'Referral',
  'event':     'Event / conference',
};

const STATUS_LABELS: Record<ContactStatus, string> = {
  'active':         'Active',
  'inactive':       'Inactive',
  'do-not-contact': 'Do not contact',
};

/**
 * IANA zone names, because that is what the column stores — a label like
 * "Pacific Time (PT)" cannot be used to compute a local time, which is the only
 * reason to record a timezone at all.
 */
const TIMEZONES = [
  'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Berlin', 'Europe/Madrid',
  'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore',
  'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
];

const SUGGESTED_TAGS = ['VIP', 'Decision Maker', 'Champion', 'Technical', 'Budget Holder'];

/**
 * Reformat only a 10-digit North American number. Anything else — an
 * international number, a partially typed one, an extension — is returned
 * untouched. The previous implementation reformatted everything and silently
 * discarded digits past the eleventh.
 */
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (value.trim().startsWith('+')) return value;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return value;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINKEDIN_RE = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9_%-]+\/?$/;

interface UserOption { id: number; first_name?: string; last_name?: string; email: string }
interface CompanyOption { id: string; name: string; industry?: string }

const RISK_STYLES: Record<DuplicateRisk, string> = {
  high:   'border-red-300 bg-red-50 text-red-900',
  medium: 'border-yellow-300 bg-yellow-50 text-yellow-900',
  low:    'border-gray-300 bg-gray-50 text-gray-800',
};

const AddEditContactPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { addToast } = useToast();

  const [formData, setFormData] = useState<ContactFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit-mode load. `notFound` is distinct from `loadError`: one means the
  // contact does not exist, the other means we could not find out.
  const [loading, setLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [users, setUsers] = useState<UserOption[]>([]);
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [showCompanyOptions, setShowCompanyOptions] = useState(false);

  // The pool the duplicate engine compares against, and what it found.
  const [contactPool, setContactPool] = useState<Contact[]>([]);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [newTag, setNewTag] = useState('');

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isEditMode || !id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    fetchContactById(id)
      .then(contact => {
        if (cancelled) return;
        if (!contact) { setNotFound(true); return; }
        setFormData({
          firstName: contact.name.split(' ')[0] ?? '',
          lastName: contact.name.split(' ').slice(1).join(' '),
          email: contact.email,
          phone: contact.phone ?? '',
          mobile: contact.mobile ?? '',
          linkedin: contact.linkedinUrl ?? '',
          company: contact.company ?? '',
          companyId: contact.companyId,
          jobTitle: contact.position ?? '',
          department: contact.department ?? '',
          street: contact.street ?? '',
          city: contact.city ?? '',
          state: contact.state ?? '',
          postalCode: contact.postalCode ?? '',
          country: contact.country ?? '',
          timezone: contact.timezone ?? '',
          source: contact.source ?? '',
          tags: contact.tags ?? [],
          ownerId: contact.ownerId ?? null,
          status: contact.status,
          notes: contact.notes ?? '',
        });
        // A freshly loaded record has no unsaved changes; the previous version
        // left this true, so cancelling always warned about losing work.
        setHasUnsavedChanges(false);
      })
      .catch(e => { if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Could not load this contact'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, isEditMode]);

  useEffect(() => {
    let cancelled = false;
    getUsers()
      .then(rows => { if (!cancelled) setUsers(rows as UserOption[]); })
      // A failed user list is not worth blocking the form over — the owner
      // select degrades to "no owner" and says why.
      .catch(() => { if (!cancelled) setUsers([]); });
    return () => { cancelled = true; };
  }, []);

  // Pool for duplicate detection. Fetched once — re-fetching per keystroke
  // would be a request per character.
  useEffect(() => {
    let cancelled = false;
    fetchContacts({ limit: 500 })
      .then(rows => { if (!cancelled) { setContactPool(rows); setPoolError(null); } })
      .catch(e => { if (!cancelled) setPoolError(e instanceof Error ? e.message : 'Could not check for duplicates'); });
    return () => { cancelled = true; };
  }, []);

  // ── Duplicate detection (the real engine, shared with leads) ──────────────

  const debounceRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    // Levenshtein over the whole pool on every keystroke is wasteful and
    // visibly janky past a few hundred rows, hence the debounce.
    debounceRef.current = window.setTimeout(() => {
      const hasIdentity = formData.email.trim() || formData.firstName.trim() || formData.phone.trim();
      if (!hasIdentity || contactPool.length === 0) { setDuplicates([]); return; }
      setDuplicates(findDuplicateMatches(
        {
          // In edit mode the record itself is in the pool and must not match
          // itself — findDuplicateMatches excludes by id.
          id: id ?? '__new__',
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          company: formData.company.trim() || undefined,
          first_name: formData.firstName.trim() || undefined,
          last_name: formData.lastName.trim() || undefined,
        },
        contactPool.map(c => ({
          id: c.id, email: c.email, phone: c.phone, company: c.company, full_name: c.name,
        })),
      ));
    }, 350);
    return () => window.clearTimeout(debounceRef.current);
  }, [formData.email, formData.phone, formData.company, formData.firstName, formData.lastName, contactPool, id]);

  const duplicateRisk = useMemo(
    () => (duplicates.length ? computeRisk(duplicates) : null),
    [duplicates],
  );
  const poolById = useMemo(() => new Map(contactPool.map(c => [c.id, c])), [contactPool]);

  // ── Company lookup (real /companies search) ───────────────────────────────

  const companyDebounce = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(companyDebounce.current);
    const q = formData.company.trim();
    if (q.length < 2) { setCompanyOptions([]); setShowCompanyOptions(false); return; }
    companyDebounce.current = window.setTimeout(() => {
      searchCompanies(q)
        .then((rows: CompanyOption[]) => {
          setCompanyOptions(rows);
          // Hide the list once the typed name is an exact match — there is
          // nothing left to choose.
          setShowCompanyOptions(rows.length > 0 && !rows.some(r => r.name.toLowerCase() === q.toLowerCase()));
        })
        .catch(() => { setCompanyOptions([]); setShowCompanyOptions(false); });
    }, 350);
    return () => window.clearTimeout(companyDebounce.current);
  }, [formData.company]);

  const linkedAccount = useMemo(
    () => companyOptions.find(c => c.name.toLowerCase() === formData.company.trim().toLowerCase()) ?? null,
    [companyOptions, formData.company],
  );

  // ── Field plumbing ────────────────────────────────────────────────────────

  const setField = useCallback(<K extends keyof ContactFormData>(field: K, value: ContactFormData[K]) => {
    setHasUnsavedChanges(true);
    setFormData(prev => ({
      ...prev,
      [field]: (field === 'phone' || field === 'mobile') ? formatPhoneNumber(String(value)) as ContactFormData[K] : value,
    }));
    setErrors(prev => (prev[field as string] ? { ...prev, [field as string]: '' } : prev));
  }, []);

  const emailFormatError = formData.email.trim() !== '' && !EMAIL_RE.test(formData.email);
  const linkedinFormatError = formData.linkedin.trim() !== '' && !LINKEDIN_RE.test(formData.linkedin);

  const validateForm = (): boolean => {
    const next: Record<string, string> = {};
    if (!formData.firstName.trim()) next.firstName = 'First name is required';
    if (!formData.lastName.trim()) next.lastName = 'Last name is required';
    if (!formData.email.trim()) next.email = 'Email is required';
    else if (!EMAIL_RE.test(formData.email)) next.email = 'Enter a valid email address';
    if (linkedinFormatError) next.linkedin = 'Enter a LinkedIn profile or company URL, or leave this blank';
    // Company is NOT required. contacts.company_id is nullable and a contact
    // with no employer on record is a legitimate row; the old form refused to
    // submit without one.
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const toPayload = (): Partial<Contact> => ({
    name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
    email: formData.email.trim(),
    phone: formData.phone.trim() || undefined,
    mobile: formData.mobile.trim() || undefined,
    linkedinUrl: formData.linkedin.trim() || undefined,
    // Only a company the API resolved to a real row can be linked; free text
    // has nowhere to go, and inventing an account would be worse.
    companyId: formData.companyId ?? linkedAccount?.id,
    position: formData.jobTitle.trim() || undefined,
    department: formData.department || undefined,
    street: formData.street.trim() || undefined,
    city: formData.city.trim() || undefined,
    state: formData.state.trim() || undefined,
    postalCode: formData.postalCode.trim() || undefined,
    country: formData.country.trim() || undefined,
    timezone: formData.timezone || undefined,
    source: formData.source || undefined,
    tags: formData.tags,
    ownerId: formData.ownerId ?? undefined,
    status: formData.status,
    notes: formData.notes.trim() || undefined,
  });

  const save = async (): Promise<Contact | null> => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      addToast('Fix the highlighted fields before saving', 'warning');
      return null;
    }
    setIsSaving(true);
    try {
      const saved = isEditMode && id
        ? await updateContactViaAPI(id, toPayload())
        : await createContactViaAPI(toPayload());
      setHasUnsavedChanges(false);
      addToast(`${saved.name} ${isEditMode ? 'updated' : 'created'}`, 'success');
      return saved;
    } catch (e) {
      // Duplicate email hits contacts_tenant_email_key; the API message names
      // the constraint, so surface it rather than a generic failure.
      addToast(e instanceof Error ? e.message : 'Could not save this contact', 'error');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    const saved = await save();
    if (saved) navigate(`/crm/contacts/${saved.id}`);
  };

  const handleSaveAndAddAnother = async () => {
    const saved = await save();
    if (!saved) return;
    setFormData(EMPTY_FORM);
    setErrors({});
    setDuplicates([]);
    // The new contact belongs in the pool, or creating two duplicates in a row
    // would go unflagged.
    setContactPool(prev => [saved, ...prev]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) setShowCancelModal(true);
    else navigate('/crm/contacts');
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t || formData.tags.includes(t)) return;
    setField('tags', [...formData.tags, t]);
    setNewTag('');
  };

  // ── Edit-mode gates ───────────────────────────────────────────────────────

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8"><p className="text-gray-600">Loading contact…</p></div>;
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-xl rounded-lg border border-gray-200 bg-white p-6">
          <h1 className="text-xl font-bold text-gray-900">Contact not found</h1>
          <p className="mt-2 text-gray-600">
            There is no contact with the id <code className="font-mono">{id}</code> in your account.
            It may have been deleted.
          </p>
          <Button className="mt-4" onClick={() => navigate('/crm/contacts')}>Back to contacts</Button>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-xl rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-bold text-red-900">Could not load this contact</h1>
          {/* Deliberately not an empty form: editing a blank form and saving
              would overwrite the real record with nothing. */}
          <p className="mt-2 text-red-800">{loadError}</p>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => window.location.reload()}>Try again</Button>
            <Button variant="secondary" onClick={() => navigate('/crm/contacts')}>Back to contacts</Button>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-2 border ${errors[field] ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <button
          onClick={() => navigate('/crm/contacts')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">Contacts</span>
        </button>
      </div>

      <div className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <User className="h-8 w-8 text-brand-600" aria-hidden="true" />
            <span>{isEditMode ? 'Edit Contact' : 'Add New Contact'}</span>
          </h1>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
            {!isEditMode && (
              <Button variant="secondary" onClick={handleSaveAndAddAnother} loading={isSaving}>
                Save &amp; add another
              </Button>
            )}
            <Button onClick={handleSave} loading={isSaving}>
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>{isEditMode ? 'Save changes' : 'Create contact'}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* ── Basic ─────────────────────────────────────────────────── */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <User className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <span>Basic information</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName" type="text" value={formData.firstName}
                    onChange={e => setField('firstName', e.target.value)}
                    className={inputClass('firstName')}
                    aria-invalid={!!errors.firstName}
                  />
                  {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName" type="text" value={formData.lastName}
                    onChange={e => setField('lastName', e.target.value)}
                    className={inputClass('lastName')}
                    aria-invalid={!!errors.lastName}
                  />
                  {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email" type="email" value={formData.email}
                  onChange={e => setField('email', e.target.value)}
                  className={inputClass('email')}
                  aria-invalid={!!errors.email || emailFormatError}
                />
                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                {/* Format only. Deliverability is not checked anywhere, and the
                    previous "✅ Valid and deliverable" said otherwise. */}
                {!errors.email && formData.email.trim() !== '' && (
                  <p className={`text-xs mt-1 ${emailFormatError ? 'text-red-600' : 'text-gray-500'}`}>
                    {emailFormatError
                      ? 'That does not look like an email address'
                      : 'Format looks right. Whether it can receive mail is not checked.'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    id="phone" type="tel" value={formData.phone}
                    onChange={e => setField('phone', e.target.value)}
                    className={inputClass('phone')}
                    placeholder="555-012-3456 or +44 20 7946 0958"
                  />
                </div>
                <div>
                  <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700 mb-2">Mobile</label>
                  <input
                    id="mobile" type="tel" value={formData.mobile}
                    onChange={e => setField('mobile', e.target.value)}
                    className={inputClass('mobile')}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="linkedin" className="block text-sm font-semibold text-gray-700 mb-2">
                  <Linkedin className="h-4 w-4 inline mr-1" aria-hidden="true" />LinkedIn URL
                </label>
                <input
                  id="linkedin" type="url" value={formData.linkedin}
                  onChange={e => setField('linkedin', e.target.value)}
                  className={inputClass('linkedin')}
                  placeholder="linkedin.com/in/username"
                  aria-invalid={!!errors.linkedin || linkedinFormatError}
                />
                {(errors.linkedin || linkedinFormatError) && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.linkedin ?? 'Enter a LinkedIn profile or company URL'}
                  </p>
                )}
              </div>
            </section>

            {/* ── Professional ──────────────────────────────────────────── */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <span>Professional information</span>
              </h2>

              <div className="relative">
                <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                <input
                  id="company" type="text" value={formData.company}
                  onChange={e => { setField('company', e.target.value); setField('companyId', undefined); }}
                  className={inputClass('company')}
                  placeholder="Start typing to search your accounts…"
                  autoComplete="off"
                />
                {showCompanyOptions && (
                  <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                    {companyOptions.map(c => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setField('company', c.name);
                            setField('companyId', c.id);
                            setShowCompanyOptions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-900">{c.name}</span>
                          {c.industry && <span className="text-gray-500"> · {c.industry}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Only a resolved account id actually links the records. */}
                {(formData.companyId ?? linkedAccount) ? (
                  <p className="mt-2 text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Linked to an existing account.
                  </p>
                ) : formData.company.trim() !== '' ? (
                  <p className="mt-2 text-xs text-gray-600">
                    No matching account, so the company name will not be saved — contacts store a
                    link to an account, not free text. Create the account first to link them.
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-semibold text-gray-700 mb-2">Job title</label>
                  <input
                    id="jobTitle" type="text" value={formData.jobTitle}
                    onChange={e => setField('jobTitle', e.target.value)}
                    className={inputClass('jobTitle')}
                  />
                </div>
                <div>
                  <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                  <select
                    id="department" value={formData.department}
                    onChange={e => setField('department', e.target.value)}
                    className={inputClass('department')}
                  >
                    <option value="">—</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <span className="block text-sm font-semibold text-gray-700 mb-2">
                  Reports to <NotAvailableBadge className="ml-1" />
                </span>
                <p className="text-sm text-gray-600">
                  Recording a manager needs a contact picker and a self-referencing column, neither
                  of which exists yet. The field was a free-text box that saved nowhere.
                </p>
              </div>
            </section>

            {/* ── Location ──────────────────────────────────────────────── */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <span>Location</span>
              </h2>
              <div>
                <label htmlFor="street" className="block text-sm font-semibold text-gray-700 mb-2">Street</label>
                <input id="street" type="text" value={formData.street}
                  onChange={e => setField('street', e.target.value)} className={inputClass('street')} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input id="city" type="text" value={formData.city}
                    onChange={e => setField('city', e.target.value)} className={inputClass('city')} />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">State / region</label>
                  <input id="state" type="text" value={formData.state}
                    onChange={e => setField('state', e.target.value)} className={inputClass('state')} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-semibold text-gray-700 mb-2">Postal code</label>
                  <input id="postalCode" type="text" value={formData.postalCode}
                    onChange={e => setField('postalCode', e.target.value)} className={inputClass('postalCode')} />
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  <input id="country" type="text" value={formData.country}
                    onChange={e => setField('country', e.target.value)} className={inputClass('country')} />
                </div>
                <div>
                  <label htmlFor="timezone" className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
                  <select id="timezone" value={formData.timezone}
                    onChange={e => setField('timezone', e.target.value)} className={inputClass('timezone')}>
                    <option value="">—</option>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* ── Categorisation ───────────────────────────────────────── */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <Tag className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <span>Categorisation</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="source" className="block text-sm font-semibold text-gray-700 mb-2">Source</label>
                  <select id="source" value={formData.source}
                    onChange={e => setField('source', e.target.value as ContactSource)} className={inputClass('source')}>
                    <option value="">—</option>
                    {(Object.keys(SOURCE_LABELS) as ContactSource[]).map(s => (
                      <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select id="status" value={formData.status}
                    onChange={e => setField('status', e.target.value as ContactStatus)} className={inputClass('status')}>
                    {(Object.keys(STATUS_LABELS) as ContactStatus[]).map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  {formData.status === 'do-not-contact' && (
                    <p className="text-xs text-gray-600 mt-1">
                      Recorded as a suppression flag. Nothing sends mail yet, so it is a note to
                      your team rather than an enforced block.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="owner" className="block text-sm font-semibold text-gray-700 mb-2">Owner</label>
                <select
                  id="owner"
                  value={formData.ownerId === null ? '' : String(formData.ownerId)}
                  onChange={e => setField('ownerId', e.target.value === '' ? null : Number(e.target.value))}
                  className={inputClass('owner')}
                >
                  <option value="">No owner</option>
                  {users.map(u => (
                    <option key={u.id} value={String(u.id)}>
                      {[u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email}
                    </option>
                  ))}
                </select>
                {users.length === 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    The user list could not be loaded, so no owner can be chosen right now.
                  </p>
                )}
              </div>

              <div className="mt-4">
                <label htmlFor="newTag" className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold flex items-center gap-2">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => setField('tags', formData.tags.filter(t => t !== tag))}
                        aria-label={`Remove tag ${tag}`}
                        className="hover:opacity-70"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    id="newTag" type="text" value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(newTag); } }}
                    placeholder="Add a tag and press Enter"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600"
                  />
                  <Button variant="secondary" onClick={() => addTag(newTag)} disabled={!newTag.trim()}>Add</Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUGGESTED_TAGS.filter(t => !formData.tags.includes(t)).map(t => (
                    <button
                      key={t} type="button" onClick={() => addTag(t)}
                      className="px-3 py-1 border border-dashed border-gray-300 text-gray-600 rounded-full text-sm hover:border-gray-400"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Notes ────────────────────────────────────────────────── */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <span>Notes</span>
              </h2>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                Description / notes
              </label>
              <textarea
                id="notes" rows={5} value={formData.notes}
                onChange={e => setField('notes', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600"
              />
            </section>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="space-y-6">

            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" aria-hidden="true" />
                <span>Duplicate check</span>
              </h3>

              {poolError && (
                <p className="text-sm text-red-700" role="alert">
                  {poolError} — no duplicate check was performed, so treat this as unknown rather
                  than clear.
                </p>
              )}

              {!poolError && duplicates.length === 0 && (
                <p className="text-sm text-gray-600">
                  {contactPool.length === 0
                    ? 'Checking against your existing contacts…'
                    : `No likely duplicates among ${contactPool.length} existing contacts.`}
                </p>
              )}

              {!poolError && duplicates.length > 0 && (
                <div className={`rounded-lg border p-3 ${RISK_STYLES[duplicateRisk ?? 'low']}`}>
                  <p className="text-sm font-semibold">
                    {duplicates.length} possible duplicate{duplicates.length === 1 ? '' : 's'} · {duplicateRisk} risk
                  </p>
                  <ul className="mt-2 space-y-2">
                    {duplicates.slice(0, 5).map(m => {
                      const c = poolById.get(m.id);
                      return (
                        <li key={m.id} className="text-xs">
                          <button
                            type="button"
                            onClick={() => window.open(`/crm/contacts/${m.id}`, '_blank', 'noopener')}
                            className="font-semibold underline"
                          >
                            {c?.name ?? m.id}
                          </button>
                          {c?.company && <span> · {c.company}</span>}
                          {/* Every signal states its own reason — the engine
                              produces these, they are not summarised away. */}
                          <ul className="mt-0.5 list-disc list-inside opacity-90">
                            {m.signals.map((s, i) => <li key={i}>{s.reason}</li>)}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 text-xs">
                    Saving is still allowed — this is a warning, not a block.
                  </p>
                </div>
              )}
            </section>

            {/* The old page had a large "🤖 AI-Powered Data Enrichment" panel
                here, populated from per-email fixtures. There is no enrichment
                provider configured and no column to store a result in. */}
            <NotAvailable
              feature="Enriching a contact from external sources"
              detail="No enrichment provider is connected, so job title, company size and social profiles cannot be looked up. Fields you enter by hand are saved normally."
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Discard changes?"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Keep editing</Button>
            <Button variant="danger" onClick={() => navigate('/crm/contacts')}>Discard</Button>
          </div>
        }
      >
        <p className="text-gray-700">
          You have unsaved changes to this contact. Discarding will lose them.
        </p>
      </Modal>
    </div>
  );
};

export default AddEditContactPage;
