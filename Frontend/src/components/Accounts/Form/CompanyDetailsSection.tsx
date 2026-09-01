import React from 'react';
import { Building2, X } from 'lucide-react';
import type { AccountFormData, Office, Founder } from '../../../pages/Accounts/AccountFormPage';

interface CompanyDetailsSectionProps {
  formData: any;
  onChange: (field: keyof AccountFormData, value: any) => void;
  onAddOffice: () => void;
  onRemoveOffice: (id: string) => void;
  onUpdateOffice: (id: string, field: keyof Office, value: any) => void;
  onAddFounder: () => void;
  onRemoveFounder: (id: string) => void;
  onUpdateFounder: (id: string, field: keyof Founder, value: string) => void;
}

const CompanyDetailsSection: React.FC<CompanyDetailsSectionProps> = ({
  formData,
  onChange,
  onAddOffice,
  onRemoveOffice,
  onUpdateOffice,
  onAddFounder,
  onRemoveFounder,
  onUpdateFounder,
}) => {
  const calculateCompanyAge = () => {
    if (!formData.foundedYear) return '';
    const now = new Date();
    const years = now.getFullYear() - formData.foundedYear;
    const months = now.getMonth() + 1;
    return `${years} years, ${months} months`;
  };

  // calculateGrowthRate removed: declared, never read.

  return (
    <>
      {/* Additional Offices */}
      {formData.offices && formData.offices.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Offices</h2>

          <div className="space-y-4">
            {formData.offices.map((office: any, index: number) => (
              <div key={office.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Office #{index + 1}</span>
                  <button
                    onClick={() => onRemoveOffice(office.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input aria-label="Location"
                      type="text"
                      value={office.location}
                      onChange={(e) => onUpdateOffice(office.id, 'location', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      placeholder="San Francisco, CA"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <input aria-label="Type"
                      type="text"
                      value={office.type}
                      onChange={(e) => onUpdateOffice(office.id, 'type', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      placeholder="Engineering hub"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Employees
                    </label>
                    <input aria-label="Employees"
                      type="number"
                      value={office.employees}
                      onChange={(e) => onUpdateOffice(office.id, 'employees', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      placeholder="15"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onAddOffice}
            className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + Add Another Office
          </button>
        </div>
      )}

      {formData.offices && formData.offices.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Offices</h2>
          <button
            onClick={onAddOffice}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            + Add Office
          </button>
        </div>
      )}

      {/* Company Details */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building2 className="h-5 w-5 mr-2 text-blue-600" />
          Company Details
        </h2>

        <div className="space-y-4">
          {/* Founded Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Founded Date
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.foundedMonth}
                onChange={(e) => onChange('foundedMonth', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Month</option>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <select
                value={formData.foundedYear}
                onChange={(e) => onChange('foundedYear', parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {formData.foundedYear && (
              <p className="mt-1 text-xs text-gray-500">
                Company Age: {calculateCompanyAge()} (auto-calculated)
              </p>
            )}
          </div>

          {/* Founders */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Founders
            </label>
            {formData.founders && formData.founders.length > 0 && (
              <div className="space-y-3 mb-3">
                {formData.founders.map((founder: any, index: number) => (
                  <div key={founder.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Founder #{index + 1}</span>
                      <button
                        onClick={() => onRemoveFounder(founder.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={founder.name}
                          onChange={(e) => onUpdateFounder(founder.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          placeholder="Robert Chang"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={founder.role}
                          onChange={(e) => onUpdateFounder(founder.id, 'role', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          placeholder="CEO"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={onAddFounder}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add Founder
            </button>
          </div>

          {/* The "Number of Employees" input was here, and it was a live
              data-loss bug of the same shape as the address one fixed above it:
              the user typed a headcount, pressed Save, was told the account was
              saved, and the value went nowhere. `companies` has no headcount
              column, so mapAccountToPayload never sent it — and the accounts
              list then rendered `employeeCount || 0`, turning that absence into
              "0 employees" on every row.

              Removed rather than backed by a new column, by the owner's
              decision: `companies.size` already stores an employee BAND
              ('201-500'), it is what the list column and the size filter both
              read, and a second headcount field would duplicate it. The size
              band is edited through the Company Size select below, which did
              not previously exist anywhere on this form — so `companies.size`
              was a real, list-filterable column with no way to set it. */}

          {/* Company Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Size
            </label>
            <select
              aria-label="Company Size"
              value={formData.accountSize}
              onChange={(e) => onChange('accountSize', e.target.value)}
              className="w-56 px-3 py-2 border border-gray-300 rounded-lg"
            >
              {/* Empty is a real choice: companies.size is nullable and an
                  unknown size must stay unknown rather than defaulting into
                  the smallest band. */}
              <option value="">Not specified</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="501-1000">501-1000 employees</option>
              <option value="1001-5000">1001-5000 employees</option>
              <option value="5000+">5000+ employees</option>
            </select>
          </div>

          {/* Annual Revenue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Revenue
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">$</span>
                <input
                  type="number"
                  value={formData.annualRevenue}
                  onChange={(e) => onChange('annualRevenue', parseFloat(e.target.value) || 0)}
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="8000000"
                />
              </div>
              <select
                value={formData.currency}
                onChange={(e) => onChange('currency', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              <select
                value={formData.revenueYear}
                onChange={(e) => onChange('revenueYear', parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center mt-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={formData.isRevenueEstimated}
                onChange={(e) => onChange('isRevenueEstimated', e.target.checked)}
                className="mr-2"
              />
              Estimated
            </label>
          </div>

          {/* Revenue Growth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Revenue Growth
            </label>
            <div className="flex items-center">
              <input
                type="number"
                value={formData.revenueGrowth}
                onChange={(e) => onChange('revenueGrowth', parseFloat(e.target.value) || 0)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="45"
              />
              <span className="ml-2 text-sm text-gray-600">% YoY</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompanyDetailsSection;
