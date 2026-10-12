import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Building, Mail, Phone, DollarSign, Tag, Globe, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useLeads } from '../../contexts/LeadContext';
import { fetchUsers, type WorkspaceUser } from '../../utils/usersApi';
import type { Lead } from '../../types/lead';

// ── Source mode config ────────────────────────────────────────────────────────

type SourceMode = 'Website' | 'Referral' | 'HRMS' | 'Lead Gen' | 'Manual';

const SOURCE_MODES: { id: SourceMode; icon: string; label: string; hint: string }[] = [
  { id: 'Website',  icon: '🌐', label: 'Website',  hint: 'Inbound form fill, organic' },
  { id: 'Referral', icon: '🤝', label: 'Referral', hint: 'Referred by an existing contact' },
  { id: 'HRMS',     icon: '🏢', label: 'HRMS',     hint: 'From HR or recruiting system' },
  { id: 'Lead Gen', icon: '🎯', label: 'Lead Gen', hint: 'Apollo, ZoomInfo, outbound list' },
  { id: 'Manual',   icon: '✍️', label: 'Manual',   hint: 'Direct entry, trade show, other' },
];

/**
 * The server's own vocabularies (Backend utils/leadProfileFields.ts). The form
 * used to offer "201-1000", "1001+" and an "urgent" priority, none of which the
 * server accepts — choosing one made the save fail.
 */
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] as const;
const PRIORITIES = ['low', 'medium', 'high'] as const;
/** ISO 4217 codes for the markets this CRM serves; the server checks ^[A-Z]{3}$. */
const CURRENCIES = ['INR', 'AED', 'SAR', 'QAR', 'USD', 'EUR', 'GBP', 'ZAR', 'NGN', 'KES', 'EGP'] as const;

const SOURCE_REQUIRED_FIELDS: Record<SourceMode, string[]> = {
  Website:  [],
  Referral: ['source_detail'],
  HRMS:     [],
  'Lead Gen': [],
  Manual:   [],
};

// ── Component ─────────────────────────────────────────────────────────────────

const INIT_FORM = {
  firstName:    '',
  lastName:     '',
  email:        '',
  phone:        '',
  company:      '',
  position:     '',
  industry:     '',
  companySize:  '',
  department:   '',
  dealValue:    '',
  currency:     '',
  // No default: a priority nobody chose is a classification the form invented.
  priority:     '',
  linkedIn:     '',
  // City and country are real columns (migration 063); the old free-text
  // "Address" had no column and was collected, then never sent.
  city:         '',
  country:      '',
  tags:         '',
  notes:        '',
  /** A workspace user's id (GET /users), or '' for unassigned. */
  ownerId:      '',
  // source-specific
  sourceDetail:  '',
  utmSource:     '',
  utmMedium:     '',
  utmCampaign:   '',
};

type FormState = typeof INIT_FORM;

export default function AddLeadPage() {
  const navigate = useNavigate();
  const { createLead, leads, lastWriteErrorRef } = useLeads();

  const [sourceMode, setSourceMode] = useState<SourceMode | null>(null);
  const [form, setForm] = useState<FormState>(INIT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'submit' | 'duplicate', string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [duplicate, setDuplicate] = useState<Lead | null>(null);
  const [overrideDuplicate, setOverrideDuplicate] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  // The owner picker is the workspace's real user list. It used to offer
  // placeholder queues ("SDR Team", "HR Partner") that named nobody and were
  // stored as free text.
  const [users, setUsers] = useState<WorkspaceUser[] | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchUsers()
      .then(u => { if (!cancelled) setUsers(u); })
      .catch(e => { if (!cancelled) setUsersError(e?.message ?? 'Could not load the team'); });
    return () => { cancelled = true; };
  }, []);

  // Client-side duplicate check
  useEffect(() => {
    if (!leads) return;
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim().replace(/\D/g, '');
    const match = leads.find(l => {
      if (email && l.email?.toLowerCase() === email) return true;
      if (phone.length >= 7 && l.phone?.replace(/\D/g, '') === phone) return true;
      return false;
    }) ?? null;
    setDuplicate(match);
    if (!match) setOverrideDuplicate(false);
  }, [form.email, form.phone, leads]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  }

  function selectMode(mode: SourceMode) {
    setSourceMode(mode);
    // Pre-fill source-specific fields reset
    setForm(f => ({ ...f, sourceDetail: '', utmSource: '', utmMedium: '', utmCampaign: '', department: '', companySize: '' }));
    setErrors({});
  }

  function validate(): Partial<Record<string, string>> {
    const errs: Partial<Record<string, string>> = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.email.trim() && !form.phone.trim()) errs.email = 'Email or phone is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.company.trim()) errs.company = 'Company is required';
    if (sourceMode === 'Referral' && !form.sourceDetail.trim()) errs.sourceDetail = 'Referring contact is required';
    if (form.dealValue && !form.currency) errs.currency = 'Choose the currency of the deal value';
    if (duplicate && !overrideDuplicate) errs.duplicate = 'Acknowledge the duplicate to continue';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setIsLoading(true);
    try {
      // `value` is the API's column name; the frontend Lead type calls it
      // estimated_value on READ, which is why this payload is typed loosely.
      const payload: Partial<Lead> & { value?: number } = {
        first_name:    form.firstName.trim(),
        last_name:     form.lastName.trim(),
        full_name:     [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(' '),
        email:         form.email.trim() || undefined,
        phone:         form.phone.trim() || undefined,
        company:       form.company.trim(),
        position:      form.position.trim() || undefined,
        industry:      form.industry || undefined,
        department:    form.department.trim() || undefined,
        company_size:  form.companySize || undefined,
        source:        sourceMode ?? 'Manual',
        source_detail: form.sourceDetail.trim() || undefined,
        utm_source:    form.utmSource.trim() || undefined,
        utm_medium:    form.utmMedium.trim() || undefined,
        utm_campaign:  form.utmCampaign.trim() || undefined,
        // Every key below is one the server reads (createLead + leadProfileFields).
        // It used to send estimated_value and quick_notes, which it does not, so
        // the deal value and notes were silently dropped; owner_id 'unassigned',
        // stored as an owner literally named "unassigned"; and score 50, a number
        // nothing measured. A new lead's score is now UNKNOWN (NULL).
        assigned_to_user_id: form.ownerId ? Number(form.ownerId) : undefined,
        value:         form.dealValue ? Number(form.dealValue) : undefined,
        currency:      form.dealValue ? form.currency || undefined : undefined,
        priority:      (form.priority || undefined) as Lead['priority'],
        city:          form.city.trim() || undefined,
        country:       form.country.trim() || undefined,
        status:        'new',
        tags:          form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        linkedin_url:  form.linkedIn.trim() || undefined,
        notes:         form.notes.trim() || undefined,
        email_opt_in:  true,
        call_opt_in:   true,
      };
      const result = await createLead(payload);

      if (result) {
        navigate('/crm/leads');
      } else {
        // Show what the server actually said. "Please try again" is wrong advice
        // for a duplicate email or a validation failure — retrying an identical
        // payload fails identically. Read the ref, not the state: state set during
        // the await above is not visible to this closure yet.
        setErrors({
          submit: lastWriteErrorRef.current ?? 'The server rejected the lead and nothing was saved.',
        });
      }
    } catch (err: any) {
      setErrors({
        submit: err?.message || lastWriteErrorRef.current || 'The server rejected the lead and nothing was saved.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const inputCls = (field: string) =>
    `w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field as keyof typeof errors] ? 'border-red-300 bg-red-50' : 'border-gray-300'
    }`;
  const iconInputCls = (field: string) =>
    `w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field as keyof typeof errors] ? 'border-red-300 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-8 py-5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/crm/leads')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Lead</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {sourceMode ? `${SOURCE_MODES.find(m => m.id === sourceMode)?.icon} ${sourceMode} — select a different source to switch modes` : 'Choose how this lead came in to get source-specific fields'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Source Mode Picker */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Lead Source</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {SOURCE_MODES.map(mode => (
              <button
                key={mode.id}
                type="button"
                onClick={() => selectMode(mode.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all ${
                  sourceMode === mode.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <span className="text-xl leading-none">{mode.icon}</span>
                <span className="text-xs font-semibold leading-tight">{mode.label}</span>
              </button>
            ))}
          </div>
          {sourceMode && (
            <p className="text-xs text-gray-500 mt-2">{SOURCE_MODES.find(m => m.id === sourceMode)?.hint}</p>
          )}
        </div>

        {/* Form — only show once source is selected */}
        {sourceMode && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Submit error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{errors.submit}</div>
            )}

            {/* Core Fields */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Details</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input name="firstName" value={form.firstName} onChange={handleChange}
                      placeholder="Jane" className={iconInputCls('firstName')} />
                  </div>
                  {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input aria-label="Last Name" name="lastName" value={form.lastName} onChange={handleChange}
                    placeholder="Smith" className={inputCls('lastName')} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email {!form.phone && <span className="text-gray-400 font-normal text-xs">(or phone)</span>}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="jane@company.com" className={iconInputCls('email')} />
                  </div>
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone {!form.email && <span className="text-gray-400 font-normal text-xs">(or email)</span>}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                      placeholder="+1 (555) 123-4567" className={iconInputCls('phone')} />
                  </div>
                </div>
              </div>

              {/* Duplicate warning */}
              {duplicate && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-amber-800">
                        A lead with this {form.email && duplicate.email?.toLowerCase() === form.email.toLowerCase() ? 'email' : 'phone'} already exists:{' '}
                        <strong>{duplicate.full_name || [duplicate.first_name, duplicate.last_name].filter(Boolean).join(' ')}</strong>
                        {duplicate.company && ` at ${duplicate.company}`}
                      </p>
                      <label className="flex items-center gap-1.5 mt-2 cursor-pointer">
                        <input type="checkbox" checked={overrideDuplicate}
                          onChange={e => setOverrideDuplicate(e.target.checked)}
                          className="rounded border-amber-400 text-amber-600 focus:ring-amber-500" />
                        <span className="text-xs text-amber-700">Still add as a separate lead</span>
                      </label>
                    </div>
                  </div>
                  {errors.duplicate && <p className="text-xs text-red-600 mt-1">{errors.duplicate}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input name="company" value={form.company} onChange={handleChange}
                    placeholder="Acme Corporation" className={iconInputCls('company')} />
                </div>
                {errors.company && <p className="text-xs text-red-600 mt-1">{errors.company}</p>}
              </div>
            </div>

            {/* Source-Specific Fields */}
            {sourceMode === 'Referral' && (
              <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-6 space-y-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Referral Details</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referring Contact *</label>
                  <input aria-label="Referring Contact" name="sourceDetail" value={form.sourceDetail} onChange={handleChange}
                    placeholder="e.g. Sarah Johnson (Acme) or sarah@acme.com"
                    className={inputCls('sourceDetail')} />
                  {errors.sourceDetail && <p className="text-xs text-red-600 mt-1">{errors.sourceDetail}</p>}
                  <p className="text-xs text-gray-500 mt-1">Name or email of the person who referred this lead</p>
                </div>
              </div>
            )}

            {(sourceMode === 'Website' || sourceMode === 'Lead Gen') && (
              <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6 space-y-4">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                  {sourceMode === 'Website' ? 'UTM Tracking' : 'Campaign Details'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UTM Source</label>
                    <input aria-label="UTM Source" name="utmSource" value={form.utmSource} onChange={handleChange}
                      placeholder="google" className={inputCls('utmSource')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UTM Medium</label>
                    <input aria-label="UTM Medium" name="utmMedium" value={form.utmMedium} onChange={handleChange}
                      placeholder="cpc" className={inputCls('utmMedium')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UTM Campaign</label>
                    <input aria-label="UTM Campaign" name="utmCampaign" value={form.utmCampaign} onChange={handleChange}
                      placeholder="summer-2026" className={inputCls('utmCampaign')} />
                  </div>
                </div>
              </div>
            )}

            {sourceMode === 'HRMS' && (
              <div className="bg-white rounded-xl border border-yellow-200 shadow-sm p-6 space-y-4">
                <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">HRMS Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input aria-label="Department" name="department" value={form.department} onChange={handleChange}
                      placeholder="Engineering" className={inputCls('department')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                    <select aria-label="Company Size" name="companySize" value={form.companySize} onChange={handleChange}
                      className={inputCls('companySize')}>
                      <option value="">Select size</option>
                      {COMPANY_SIZES.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Owner with suggestion */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignment</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <select aria-label="Assigned To" name="ownerId" value={form.ownerId} onChange={handleChange}
                  disabled={users === null && !usersError} className={inputCls('ownerId')}>
                  <option value="">{users === null && !usersError ? 'Loading the team…' : 'Unassigned'}</option>
                  {(users ?? []).map(u => <option key={u.id} value={String(u.id)}>{u.displayName}</option>)}
                </select>
                {usersError && (
                  <p className="text-xs text-red-600 mt-1" role="alert">
                    The team could not load ({usersError}). The lead can still be saved unassigned.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select aria-label="Priority" name="priority" value={form.priority} onChange={handleChange} className={inputCls('priority')}>
                  <option value="">Not set</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {/* Additional Details (collapsible) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowExtra(x => !x)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Additional Details</span>
                {showExtra ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {showExtra && (
                <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                      <input aria-label="Job Title" name="position" value={form.position} onChange={handleChange}
                        placeholder="VP of Engineering" className={inputCls('position')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                      <select aria-label="Industry" name="industry" value={form.industry} onChange={handleChange} className={inputCls('industry')}>
                        <option value="">Select industry</option>
                        {['Technology','Healthcare','Finance','Manufacturing','Retail','Education','Real Estate','Consulting'].map(i =>
                          <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Est. Deal Value</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input aria-label="Est. Deal Value" name="dealValue" type="number" min="0" value={form.dealValue} onChange={handleChange}
                            placeholder="25000" className={iconInputCls('dealValue')} />
                        </div>
                        <select aria-label="Currency" name="currency" value={form.currency} onChange={handleChange}
                          className={`${inputCls('currency')} w-28`}>
                          <option value="">Currency</option>
                          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {errors.currency && <p className="text-xs text-red-600 mt-1">{errors.currency}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input name="linkedIn" type="url" value={form.linkedIn} onChange={handleChange}
                          placeholder="https://linkedin.com/in/…" className={iconInputCls('linkedIn')} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input name="tags" value={form.tags} onChange={handleChange}
                        placeholder="enterprise, hot-lead, decision-maker" className={iconInputCls('tags')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input aria-label="City" name="city" value={form.city} onChange={handleChange}
                        placeholder="Bengaluru" className={inputCls('city')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input aria-label="Country" name="country" value={form.country} onChange={handleChange}
                        placeholder="India" className={inputCls('country')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea aria-label="Notes" name="notes" rows={3} value={form.notes} onChange={handleChange}
                      placeholder="Any additional context about this lead…"
                      className={`${inputCls('notes')} resize-none`} />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pb-8">
              <button type="button" onClick={() => navigate('/crm/leads')}
                className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isLoading}
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                {isLoading ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Lead
              </button>
            </div>
          </form>
        )}

        {/* Prompt when no source selected */}
        {!sourceMode && (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
            <p className="text-sm">Select a source above to continue</p>
          </div>
        )}
      </div>
    </div>
  );
}
