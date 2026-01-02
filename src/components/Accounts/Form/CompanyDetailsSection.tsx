import React from 'react';
import { Building2, TrendingUp, Users, X } from 'lucide-react';

interface CompanyDetailsSectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  onAddOffice: () => void;
  onRemoveOffice: (id: string) => void;
  onUpdateOffice: (id: string, field: string, value: any) => void;
  onAddFounder: () => void;
  onRemoveFounder: (id: string) => void;
  onUpdateFounder: (id: string, field: string, value: string) => void;
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

  const calculateGrowthRate = () => {
    const history = formData.employeeGrowth;
    const years = Object.keys(history).sort();
    if (years.length < 2) return 0;
    const firstYear = years[0];
    const lastYear = years[years.length - 1];
    const growth = ((history[lastYear] - history[firstYear]) / history[firstYear]) * 100;
    return Math.round(growth);
  };

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
                    <input
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
                    <input
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
                    <input
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

          {/* Employee Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Employees
            </label>
            <div className="flex items-center">
              <input
                type="number"
                value={formData.employeeCount}
                onChange={(e) => onChange('employeeCount', parseInt(e.target.value) || 0)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="45"
              />
              <span className="ml-2 text-sm text-gray-600">employees</span>
            </div>
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
