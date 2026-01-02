import React from 'react';
import { Building2, MapPin, DollarSign, TrendingUp } from 'lucide-react';

interface PreviewPanelProps {
  formData: any;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ formData }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRevenue = (revenue: number) => {
    if (revenue >= 1000000) {
      return `$${(revenue / 1000000).toFixed(1)}M`;
    }
    return `$${(revenue / 1000).toFixed(0)}K`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-xl">👁️</span>
        <h3 className="text-sm font-semibold text-gray-900">Preview</h3>
      </div>

      <p className="text-xs text-gray-600 mb-4">
        How this account will appear:
      </p>

      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            {formData.companyName ? getInitials(formData.companyName) : 'AA'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">
              {formData.companyName || 'Company Name'}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {formData.industry || 'Industry'}
            </p>
            {(formData.city || formData.state) && (
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {formData.city && formData.state
                  ? `${formData.city}, ${formData.state}`
                  : formData.city || formData.state}
              </p>
            )}
            {formData.annualRevenue > 0 && (
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <DollarSign className="h-3 w-3 mr-1" />
                {formatRevenue(formData.annualRevenue)} revenue/year
              </p>
            )}

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.slice(0, 2).map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
              <span>0 deals</span>
              <span>0 contacts</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        This is how the account card will appear in the accounts list.
      </p>
    </div>
  );
};

export default PreviewPanel;
