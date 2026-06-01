import React from 'react';
import { Building2, User, Eye, Search, Plus, X, AlertTriangle, Users } from 'lucide-react';
import {
  CONTACT_ROLES,
  DEFAULT_CONTACT_ROLE,
  hasSeniorBuyer,
  StakeholderContact,
} from '../../../config/contactRoles';

interface DealFormAccountContactsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  selectedAccount?: any;
  selectedContact?: any;
  onSearchAccount: () => void;
  validationErrors?: Record<string, string>;
}

let _tempIdCounter = 0;
const tempId = () => `tmp-${++_tempIdCounter}-${Date.now()}`;

export const DealFormAccountContacts: React.FC<DealFormAccountContactsProps> = ({
  formData,
  onChange,
  selectedAccount,
  selectedContact,
  onSearchAccount,
  validationErrors = {},
}) => {
  const additionalContacts: StakeholderContact[] = formData.additionalContacts ?? [];
  const missingBuyer = !hasSeniorBuyer(formData.contactRole, additionalContacts);

  const addContact = () => {
    onChange('additionalContacts', [
      ...additionalContacts,
      { id: tempId(), name: '', email: '', title: '', role: DEFAULT_CONTACT_ROLE.id, isPrimary: false },
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
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6 pb-3 border-b border-gray-100">
        <div className="p-2 bg-green-50 rounded-lg">
          <Users className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Account & Contacts</h2>
          <p className="text-xs text-gray-500">Link the company and key stakeholders for this deal</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Account ─────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account <span className="text-red-500">*</span>
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

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={formData.primaryContactName}
              onChange={(e) => onChange('primaryContactName', e.target.value)}
              placeholder="Search or enter contact name…"
              className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                validationErrors.primaryContactName
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            <select
              value={formData.contactRole ?? DEFAULT_CONTACT_ROLE.id}
              onChange={(e) => onChange('contactRole', e.target.value)}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {CONTACT_ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          {validationErrors.primaryContactName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.primaryContactName}</p>
          )}

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

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={contact.title ?? ''}
                  onChange={(e) => updateContact(contact.id, 'title', e.target.value)}
                  placeholder="Job title (optional)"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={contact.role}
                  onChange={(e) => updateContact(contact.id, 'role', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CONTACT_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>
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
