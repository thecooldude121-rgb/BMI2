import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, Building, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import { useLeads } from '../../contexts/LeadContext';
import { suggestOwner, TEAM_MEMBERS } from '../../utils/leadOwnerRouting';
import type { Lead } from '../../types/lead';
import { findDuplicates, computeRisk } from '../../utils/leadDuplicates';
import type { DuplicateRisk } from '../../utils/leadDuplicates';

const SOURCES = ['Website', 'Referral', 'HRMS', 'Lead Gen', 'Manual', 'LinkedIn', 'Cold Email'];

type Props = {
  onClose: () => void;
  onSuccess: (lead: Lead) => void;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  ownerId: string;
};

const INIT: FormState = { firstName: '', lastName: '', email: '', phone: '', company: '', source: '', ownerId: '' };

export default function QuickAddLeadModal({ onClose, onSuccess }: Props) {
  const { createLead, leads } = useLeads();
  const [form, setForm] = useState<FormState>(INIT);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'submit', string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [duplicate, setDuplicate] = useState<Lead | null>(null);
  const [duplicateRisk, setDuplicateRisk] = useState<DuplicateRisk | null>(null);
  const [duplicateReason, setDuplicateReason] = useState<string>('');
  const [overrideDuplicate, setOverrideDuplicate] = useState(false);
  const [ownerTouched, setOwnerTouched] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { firstInputRef.current?.focus(); }, []);

  // Auto-suggest owner when source changes (unless user manually set it)
  useEffect(() => {
    if (ownerTouched) return;
    const suggestion = suggestOwner(form.source);
    setForm(f => ({ ...f, ownerId: suggestion ? suggestion.id : '' }));
  }, [form.source, ownerTouched]);

  // Client-side duplicate detection — 4-signal engine
  useEffect(() => {
    if (!leads) return;
    // Build a stub Lead from the form for detection
    const stub: Lead = {
      id: '__new__',
      first_name: form.firstName.trim(),
      last_name:  form.lastName.trim(),
      email:      form.email.trim() || undefined,
      phone:      form.phone.trim() || undefined,
      company:    form.company.trim() || undefined,
    } as unknown as Lead;

    const candidates = findDuplicates(stub, leads);
    if (candidates.length === 0) {
      setDuplicate(null);
      setDuplicateRisk(null);
      setDuplicateReason('');
      setOverrideDuplicate(false);
      return;
    }
    const top = candidates[0];
    const match = leads.find(l => l.id === top.leadId) ?? null;
    setDuplicate(match);
    setDuplicateRisk(computeRisk(candidates));
    setDuplicateReason(top.signals[0]?.reason ?? 'Similar lead found');
    if (!match) setOverrideDuplicate(false);
  }, [form.firstName, form.lastName, form.email, form.phone, form.company, leads]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  }

  function handleOwnerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setOwnerTouched(true);
    setForm(f => ({ ...f, ownerId: e.target.value }));
  }

  function validate(): Partial<Record<string, string>> {
    const errs: Partial<Record<string, string>> = {};
    if (!form.firstName.trim()) errs.firstName = 'First name required';
    if (!form.email.trim() && !form.phone.trim()) errs.email = 'Email or phone required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.source) errs.source = 'Source required';
    if (duplicate && !overrideDuplicate) errs.duplicate = 'Acknowledge the duplicate to continue';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const result = await createLead({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        full_name: [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(' '),
        email:   form.email.trim() || undefined,
        phone:   form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        source:  form.source,
        owner_id: form.ownerId || 'unassigned',
        status: 'new',
        score: 50,
        email_opt_in: true,
        call_opt_in: true,
      });
      if (result) {
        onSuccess(result);
      } else {
        setErrors({ submit: 'Failed to create lead — please try again.' });
      }
    } catch {
      setErrors({ submit: 'Failed to create lead — please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  // Escape key closes
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const suggestion = suggestOwner(form.source);
  const ownerLabel = TEAM_MEMBERS.find(m => m.id === form.ownerId)?.label;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quick Add Lead</h2>
            <p className="text-xs text-gray-500 mt-0.5">Capture the essentials — add details later</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Submit error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{errors.submit}</div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  ref={firstInputRef}
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Jane"
                  className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                />
              </div>
              {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Smith"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email {!form.phone && <span className="text-gray-400">(or phone)</span>}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane@company.com"
                className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone {!form.email && <span className="text-gray-400">(or email)</span>}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="Acme Corp"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Duplicate warning */}
          {duplicate && duplicateRisk && (
            <div className={`p-3 rounded-lg border ${
              duplicateRisk === 'high'   ? 'bg-red-50 border-red-200' :
              duplicateRisk === 'medium' ? 'bg-amber-50 border-amber-200' :
                                          'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                  duplicateRisk === 'high' ? 'text-red-500' :
                  duplicateRisk === 'medium' ? 'text-amber-500' : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${
                    duplicateRisk === 'high' ? 'text-red-800' :
                    duplicateRisk === 'medium' ? 'text-amber-800' : 'text-gray-700'
                  }`}>
                    {duplicateRisk === 'high' ? 'High confidence duplicate' : duplicateRisk === 'medium' ? 'Possible duplicate' : 'Low risk duplicate'}
                    {': '}
                    {duplicate.full_name || [duplicate.first_name, duplicate.last_name].filter(Boolean).join(' ')}
                    {duplicate.company && ` at ${duplicate.company}`}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{duplicateReason}</p>
                  <label className="flex items-center gap-1.5 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overrideDuplicate}
                      onChange={e => setOverrideDuplicate(e.target.checked)}
                      className={`rounded ${
                        duplicateRisk === 'high' ? 'border-red-400 text-red-600 focus:ring-red-500' :
                        'border-amber-400 text-amber-600 focus:ring-amber-500'
                      }`}
                    />
                    <span className={`text-xs ${duplicateRisk === 'high' ? 'text-red-700' : 'text-amber-700'}`}>
                      Still add as a separate lead
                    </span>
                  </label>
                </div>
              </div>
              {errors.duplicate && <p className="text-xs text-red-600 mt-1">{errors.duplicate}</p>}
            </div>
          )}

          {/* Source */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Source *</label>
            <select
              name="source"
              value={form.source}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.source ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            >
              <option value="">Select source…</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.source && <p className="text-xs text-red-600 mt-1">{errors.source}</p>}
          </div>

          {/* Owner with suggestion */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Assigned To</label>
            {suggestion && !ownerTouched && (
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-blue-600">Suggested: {suggestion.label} based on source</span>
              </div>
            )}
            <select
              value={form.ownerId}
              onChange={handleOwnerChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Add Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
