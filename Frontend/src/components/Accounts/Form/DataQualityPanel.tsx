import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface DataQualityPanelProps {
  formData: any;
}

const DataQualityPanel: React.FC<DataQualityPanelProps> = ({ formData }) => {
  const calculateQualityScore = () => {
    let score = 0;
    const checks = [
      { field: 'companyName', weight: 20, label: 'Company Name' },
      { field: 'industry', weight: 15, label: 'Industry' },
      { field: 'website', weight: 15, label: 'Website' },
      { field: 'city', weight: 10, label: 'Location' },
      { field: 'employeeCount', weight: 10, label: 'Employee Count', checkValue: (val: number) => val > 0 },
      { field: 'annualRevenue', weight: 10, label: 'Revenue', checkValue: (val: number) => val > 0 },
      { field: 'linkedin', weight: 10, label: 'LinkedIn' },
      { field: 'companyPhone', weight: 5, label: 'Phone Number' },
      { field: 'companyEmail', weight: 5, label: 'Email' },
    ];

    const fieldStatuses: { [key: string]: 'verified' | 'estimated' | 'missing' } = {};

    checks.forEach(check => {
      const value = formData[check.field];
      const isValid = check.checkValue
        ? check.checkValue(value)
        : value && value.toString().trim() !== '';

      if (isValid) {
        score += check.weight;
        fieldStatuses[check.label] = check.field === 'annualRevenue' ? 'estimated' : 'verified';
      } else {
        fieldStatuses[check.label] = 'missing';
      }
    });

    return { score, fieldStatuses };
  };

  const { score, fieldStatuses } = calculateQualityScore();

  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 70) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 50) return { label: 'Fair', color: 'text-yellow-600' };
    return { label: 'Needs Improvement', color: 'text-red-600' };
  };

  const scoreLabel = getScoreLabel(score);

  const missingFields = Object.entries(fieldStatuses)
    .filter(([_, status]) => status === 'missing')
    .map(([field, _]) => field);

  const criticalFields = ['Company Name', 'Industry', 'Website', 'Location'];
  const criticalMissing = missingFields.filter(field => criticalFields.includes(field));
  const mediumMissing = missingFields.filter(field => !criticalFields.includes(field));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-xl">🎯</span>
        <h3 className="text-sm font-semibold text-gray-900">Data Quality</h3>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Score:</span>
          <span className={`text-lg font-bold ${scoreLabel.color}`}>
            {score}/100
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              score >= 90
                ? 'bg-green-600'
                : score >= 70
                ? 'bg-blue-600'
                : score >= 50
                ? 'bg-yellow-600'
                : 'bg-red-600'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className={`text-xs ${scoreLabel.color}`}>{scoreLabel.label}</p>
      </div>

      <div className="space-y-2 mb-4">
        {Object.entries(fieldStatuses)
          .filter(([_, status]) => status !== 'missing')
          .map(([field, status]) => (
            <div key={field} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{field}:</span>
              {status === 'verified' ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center text-yellow-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Estimated
                </span>
              )}
            </div>
          ))}
      </div>

      {missingFields.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Missing Fields:</p>
          <div className="space-y-1">
            {criticalMissing.map(field => (
              <div key={field} className="flex items-center text-sm text-red-600">
                <XCircle className="h-4 w-4 mr-1" />
                <span>{field} (Critical)</span>
              </div>
            ))}
            {mediumMissing.map(field => (
              <div key={field} className="flex items-center text-sm text-yellow-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>{field} (Medium)</span>
              </div>
            ))}
          </div>

          <button className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Find Missing Data
          </button>
        </div>
      )}
    </div>
  );
};

export default DataQualityPanel;
