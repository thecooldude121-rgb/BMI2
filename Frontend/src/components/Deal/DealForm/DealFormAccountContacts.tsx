import React from 'react';
import { Building2, User, Eye, Search, Plus, Sparkles, Users } from 'lucide-react';

interface DealFormAccountContactsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  selectedAccount?: any;
  selectedContact?: any;
  onSearchAccount: () => void;
  validationErrors?: Record<string, string>;
}

export const DealFormAccountContacts: React.FC<DealFormAccountContactsProps> = ({
  formData,
  onChange,
  selectedAccount,
  selectedContact,
  onSearchAccount,
  validationErrors = {}
}) => {
  const contactRoles = ['Champion', 'Decision Maker', 'Influencer', 'User', 'Technical Evaluator'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6 pb-3 border-b border-gray-100">
        <div className="p-2 bg-green-50 rounded-lg">
          <Users className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Account & Contacts</h2>
          <p className="text-xs text-gray-500">Link the company and key contacts for this deal</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account: <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => onChange('accountName', e.target.value)}
              placeholder="Search or enter company name..."
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
              <span>Link to Account</span>
            </button>
          </div>
          {validationErrors.accountName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.accountName}</p>
          )}

          {selectedAccount && (
            <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">💡</span>
                <span className="text-sm font-semibold text-blue-900">Existing account found: {selectedAccount.name}</span>
              </div>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Industry: {selectedAccount.industry} | {selectedAccount.employees} | {selectedAccount.revenue}</div>
              </div>
              <div className="flex items-center space-x-2 mt-3">
                <button
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  Link to Existing
                </button>
                <button
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
                >
                  Create New Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Contact: <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={formData.primaryContactName}
              onChange={(e) => onChange('primaryContactName', e.target.value)}
              placeholder="Search or enter contact name..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              Select Contact
            </button>
          </div>

          {selectedContact && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-semibold text-gray-900 mb-3">Contact Details:</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{selectedContact.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium text-gray-900">{selectedContact.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{selectedContact.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-gray-900">+1 555-0123</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-3">
                <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>View Contact</span>
                </button>
                <button className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors">
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contact Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Role in Deal:
          </label>
          <select
            value={formData.contactRole}
            onChange={(e) => onChange('contactRole', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {contactRoles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {/* Additional Contacts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Contacts <span className="text-gray-500">(Optional)</span>:
          </label>
          <button className="w-full px-4 py-3 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors flex items-center justify-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add Another Contact</span>
          </button>

          <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-purple-900 font-medium">AI Suggestion: Add CEO for final approval</span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors">
                  Find CEO
                </button>
                <button className="px-3 py-1.5 bg-purple-200 text-purple-800 rounded-lg hover:bg-purple-300 text-sm font-medium transition-colors">
                  Add to Deal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
