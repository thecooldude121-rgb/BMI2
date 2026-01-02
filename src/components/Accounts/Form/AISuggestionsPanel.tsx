import React from 'react';
import { Lightbulb, TrendingUp, UserPlus, Target, Briefcase } from 'lucide-react';

interface AISuggestionsPanelProps {
  formData: any;
  onApplySuggestion: (field: string, value: any) => void;
}

const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  formData,
  onApplySuggestion,
}) => {
  const generateSuggestions = () => {
    const suggestions = [];

    if (formData.totalFunding > 5000000 && !formData.tags.includes('Well Funded')) {
      suggestions.push({
        id: '1',
        icon: <TrendingUp className="h-4 w-4" />,
        title: 'Add Tag: "Well Funded"',
        reason: `Raised $${(formData.totalFunding / 1000000).toFixed(1)}M in funding`,
        action: () => onApplySuggestion('tags', [...formData.tags, 'Well Funded']),
      });
    }

    if (formData.annualRevenue > 5000000 && formData.priority !== 'High') {
      suggestions.push({
        id: '2',
        icon: <Target className="h-4 w-4" />,
        title: 'Priority: Set to "High"',
        reason: `$${(formData.annualRevenue / 1000000).toFixed(1)}M revenue indicates high value`,
        action: () => onApplySuggestion('priority', 'High'),
      });
    }

    if (formData.employeeCount > 100 && !formData.hasHRMSConnection) {
      suggestions.push({
        id: '3',
        icon: <Briefcase className="h-4 w-4" />,
        title: 'HRMS Opportunity: High-growth company',
        reason: `${formData.employeeCount} employees, likely hiring`,
        action: () => onApplySuggestion('hasHRMSConnection', true),
      });
    }

    if (formData.industry === 'FinTech' && formData.crmTools.toLowerCase().includes('salesforce')) {
      suggestions.push({
        id: '4',
        icon: <Target className="h-4 w-4" />,
        title: 'Sales Opportunity Detected',
        reason: 'Using Salesforce = opportunity to switch!',
        action: () => {},
      });
    }

    if (!formData.founders || formData.founders.length === 0) {
      suggestions.push({
        id: '5',
        icon: <UserPlus className="h-4 w-4" />,
        title: 'Add Key Contacts',
        reason: 'No founders or key contacts added yet',
        action: () => {},
      });
    }

    return suggestions;
  };

  const suggestions = generateSuggestions();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h3 className="text-sm font-semibold text-gray-900">AI Suggestions</h3>
      </div>

      <p className="text-xs text-gray-600 mb-4">
        Based on data analysis:
      </p>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className="pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
          >
            <div className="flex items-start space-x-2 mb-2">
              <span className="text-blue-600 mt-0.5">{suggestion.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {index + 1}. {suggestion.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Reason: {suggestion.reason}
                </p>
              </div>
            </div>
            {suggestion.action && (
              <button
                onClick={suggestion.action}
                className="w-full px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded hover:bg-blue-100"
              >
                Apply
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AISuggestionsPanel;
