import React, { useState, useEffect, useRef } from 'react';
import { Building2, User, Eye, Search, Plus, X, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';
import {
  CONTACT_ROLES,
  DEFAULT_CONTACT_ROLE,
  hasSeniorBuyer,
  StakeholderContact,
} from '../../../config/contactRoles';
import { ContactAutocomplete, SearchedContact } from './ContactAutocomplete';

interface AccountMatch {
  name: string;
  dealCount: number;
  totalValue: number;
}

interface DealFormAccountContactsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  selectedAccount?: any;
  selectedContact?: any;
  onSearchAccount: () => void;
  validationErrors?: Record<string, string>;
  allDeals?: any[];
}

let _tempIdCounter = 0;
const tempId = () => `tmp-${++_tempIdCounter}-${Date.now()}`;

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n.toFixed(0)}`;

export const DealFormAccountContacts: React.FC<DealFormAccountContactsProps> = ({
  formData,
  onChange,
  selectedAccount,
  selectedContact,
  onSearchAccount,
  validationErrors = {},
  allDeals = [],
}) => {
  const additionalContacts: StakeholderContact[] = formData.additionalContacts ?? [];

  // Account duplicate-warning state
  const [accountMatches, setAccountMatches] = useState<AccountMatch[]>([]);
  const [suppressedFor, setSuppressedFor] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset verified badge when the user manually changes the account name
  const prevAccountName = useRef(formData.accountName);
  useEffect(() => {
    if (formData.accountName !== prevAccountName.current) {
      prevAccountName.current = formData.accountName;
      setIsVerified(false);
    }
  }, [formData.accountName]);

  // Debounced fuzzy match against allDeals company names
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = (formData.accountName ?? '').trim();

    if (q.length < 3 || !allDeals.length || q === suppressedFor || isVerified) {
      setAccountMatches([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const ql = q.toLowerCase();

      // Build company → {dealCount, totalValue} map from all deals
      const companyMap = new Map<string, AccountMatch>();
      allDeals.forEach((d: any) => {
        const name: string = d.company_name || '';
        if (!name) return;
        const key = name.toLowerCase();
        const entry = companyMap.get(key) ?? { name, dealCount: 0, totalValue: 0 };
        entry.dealCount += 1;
        entry.totalValue += parseFloat(d.value) || 0;
        companyMap.set(key, entry);
      });

      const matches: AccountMatch[] = [];
      companyMap.forEach((entry, key) => {
        if (key.includes(ql) || ql.includes(key)) matches.push(entry);
      });

      setAccountMatches(matches.slice(0, 3));
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [formData.accountName, allDeals, suppressedFor, isVerified]);

  const handleUseExisting = (match: AccountMatch) => {
    onChange('accountName', match.name);
    onChange('accountId', '');
    setIsVerified(true);
    setSuppressedFor(match.name);
    setAccountMatches([]);
  };

  const handleContinueNew = () => {
    setSuppressedFor(formData.accountName ?? '');
    setAccountMatches([]);
  };
  const missingBuyer = !hasSeniorBuyer(formData.contactRole, additionalContacts);

  const SentimentToggle = ({
    value,
    onChange: onSentimentChange,
  }: {
    value: string;
    onChange: (s: 'positive' | 'neutral' | 'negative') => void;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">Relationship</label>
      <div className="flex items-center gap-1.5">
        {(['positive', 'neutral', 'negative'] as const).map((s) => {
          const emoji = s === 'positive' ? '😊' : s === 'neutral' ? '😐' : '😟';
          const selected = (value || 'neutral') === s;
          const activeRing =
            s === 'positive' ? 'ring-green-400 bg-green-50' :
            s === 'neutral'  ? 'ring-gray-300 bg-gray-50'  :
                               'ring-red-400 bg-red-50';
          return (
            <button
              key={s}
              type="button"
              title={s.charAt(0).toUpperCase() + s.slice(1)}
              onClick={() => onSentimentChange(s)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-base transition-all ring-2 ${
                selected ? activeRing : 'ring-transparent hover:ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );

  const handleContactSelect = (contact: SearchedContact | null) => {
    if (contact) {
      onChange('primaryContactId', contact.id);
      onChange('primaryContactName', contact.name);
    } else {
      // null = new contact typed free-hand; keep the name, clear the linked ID
      onChange('primaryContactId', '');
    }
  };

  const addContact = () => {
    onChange('additionalContacts', [
      ...additionalContacts,
      { id: tempId(), name: '', email: '', title: '', role: DEFAULT_CONTACT_ROLE.id, sentiment: 'neutral', isPrimary: false },
    ]);
  };

  const updateContact = (id: string, field: keyof StakeholderContact, value: string) => {
    onChange(
      'additionalContacts',
      additionalContacts.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeContact = (id: string) => {
    onChange('additionalContacts', additionalContacts.filter(c => c.id !== id));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 lg:p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-4 lg:mb-6 pb-3 border-b border-gray-100">
        <div className="p-2 bg-green-50 rounded-lg">
          <Users className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">Account & Contacts</h2>
          <p className="text-xs text-gray-500">Link the company and key stakeholders for this deal</p>
        </div>
      </div>

      <div className="space-y-4 lg:space-y-5">
        {/* ── Account ─────────────────────────────────────────────── */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            Account <span className="text-red-500">*</span>
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                <CheckCircle2 className="h-3 w-3" />
                Verified Account
              </span>
            )}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => onChange('accountName', e.target.value)}
              placeholder="Search or enter company name…"
              className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                validationErrors.accountName
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            <button
              onClick={onSearchAccount}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Link</span>
            </button>
          </div>

          {/* Duplicate account warning */}
          {accountMatches.length > 0 && (
            <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 space-y-2">
              {accountMatches.map((match) => (
                <div key={match.name} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm min-w-0">
                      <span className="font-semibold text-amber-900">"{match.name}"</span>
                      <span className="text-amber-700"> already exists with </span>
                      <span className="font-medium text-amber-900">
                        {match.dealCount} deal{match.dealCount !== 1 ? 's' : ''} totalling {fmt(match.totalValue)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUseExisting(match)}
                    className="flex-shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors whitespace-nowrap"
                  >
                    Use This
                  </button>
                </div>
              ))}
              <div className="pt-1 border-t border-amber-200 flex justify-end">
                <button
                  type="button"
                  onClick={handleContinueNew}
                  className="text-xs text-amber-600 hover:text-amber-800 underline underline-offset-2 transition-colors"
                >
                  Continue with new entry
                </button>
              </div>
            </div>
          )}

          {validationErrors.accountName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.accountName}</p>
          )}
          {selectedAccount && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
              <div className="font-semibold text-blue-900 mb-1">{selectedAccount.name}</div>
              <div className="text-blue-700 text-xs">
                {[selectedAccount.industry, selectedAccount.employees, selectedAccount.revenue]
                  .filter(Boolean).join(' · ')}
              </div>
            </div>
          )}
        </div>

        {/* ── Primary Contact ──────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Primary Contact <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-gray-400">Lead stakeholder for this deal</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
            <div className="flex-1">
              <ContactAutocomplete
                value={formData.primaryContactName}
                onChange={(v) => {
                  onChange('primaryContactName', v);
                  // Free-typing clears any previously linked contact ID
                  if (formData.primaryContactId) onChange('primaryContactId', '');
                }}
                onContactSelect={handleContactSelect}
                accountName={formData.accountName}
                placeholder="Search or enter contact name…"
                hasError={!!validationErrors.primaryContactName}
              />
            </div>
            <select
              value={formData.contactRole ?? DEFAULT_CONTACT_ROLE.id}
              onChange={(e) => onChange('contactRole', e.target.value)}
              className="w-full sm:w-auto sm:min-w-[150px] px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm"
            >
              {CONTACT_ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          {validationErrors.primaryContactName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.primaryContactName}</p>
          )}

          <SentimentToggle
            value={formData.primaryContactSentiment || 'neutral'}
            onChange={(s) => onChange('primaryContactSentiment', s)}
          />

          {selectedContact && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Title</span>
                <span className="font-medium text-gray-900">{selectedContact.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{selectedContact.email}</span>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <button className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors">
                  <Eye className="h-3 w-3" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => {
                    onChange('primaryContactName', '');
                    onChange('primaryContactId', '');
                  }}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs font-medium transition-colors"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Additional Stakeholders ──────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Additional Stakeholders
              <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
            </label>
            {additionalContacts.length > 0 && (
              <span className="text-xs text-gray-400">{additionalContacts.length} added</span>
            )}
          </div>

          {/* Existing additional contacts */}
          {additionalContacts.map((contact, idx) => (
            <div
              key={contact.id}
              className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">
                  Stakeholder {idx + 1}
                </span>
                <button
                  onClick={() => removeContact(contact.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove stakeholder"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-white border border-gray-200 rounded-lg flex-shrink-0">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                  placeholder="Contact name…"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={contact.title ?? ''}
                  onChange={(e) => updateContact(contact.id, 'title', e.target.value)}
                  placeholder="Job title (optional)"
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={contact.role}
                  onChange={(e) => updateContact(contact.id, 'role', e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CONTACT_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              <SentimentToggle
                value={contact.sentiment || 'neutral'}
                onChange={(s) => updateContact(contact.id, 'sentiment', s)}
              />
            </div>
          ))}

          {/* Add button */}
          <button
            onClick={addContact}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Stakeholder</span>
          </button>
        </div>

        {/* ── No-senior-buyer advisory ─────────────────────────────── */}
        {missingBuyer && formData.primaryContactName && (
          <div className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">No Decision Maker or Economic Buyer attached</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Deals without a senior buyer role have lower close rates. Consider adding one as an additional stakeholder.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
