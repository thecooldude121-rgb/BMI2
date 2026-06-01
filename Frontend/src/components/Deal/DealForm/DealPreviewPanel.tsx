import React from 'react';
import { Eye } from 'lucide-react';
import { formatCurrency, convertToBaseCurrency } from '../../../utils/currencyUtils';
import { BASE_CURRENCY_CODE } from '../../../config/currencies';

interface DealPreviewPanelProps {
  formData: any;
}

export const DealPreviewPanel: React.FC<DealPreviewPanelProps> = ({ formData }) => {
  const getStageEmoji = (stage: string) => {
    const emojiMap: Record<string, string> = {
      'prospecting': '🔵',
      'qualified': '🟢',
      'proposal': '🟠',
      'negotiation': '🤝',
      'closed-won': '🎉',
      'closed-lost': '❌'
    };
    return emojiMap[stage] || '📊';
  };

  const getStageName = (stage: string) => {
    const nameMap: Record<string, string> = {
      'prospecting': 'Prospecting',
      'qualified': 'Qualified',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'closed-won': 'Closed-Won',
      'closed-lost': 'Closed-Lost'
    };
    return nameMap[stage] || 'Unknown';
  };

  const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const currency = formData.currency || BASE_CURRENCY_CODE;
  const rawAmount = parseFloat((formData.dealValue || '0').toString().replace(/,/g, ''));
  const amount = isNaN(rawAmount) ? 0 : rawAmount;
  const baseAmount = convertToBaseCurrency(amount, currency);

  const getDaysAway = (closeDate: string) => {
    if (!closeDate) return '-- days away';
    const today = new Date();
    const target = new Date(closeDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days away`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Eye className="h-6 w-6 text-gray-600" />
        <h2 className="text-lg font-bold text-gray-900">👁️ DEAL PREVIEW</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">How this deal will appear:</p>

      <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
        <div className="flex items-start space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            {getInitials(formData.accountName || formData.dealName)}
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 mb-1">
              {formData.dealName || 'Deal Name'}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(amount, currency)}
            </div>
            {currency !== BASE_CURRENCY_CODE && amount > 0 && (
              <div className="text-xs text-gray-400 mt-0.5">
                ≈ {formatCurrency(baseAmount, BASE_CURRENCY_CODE)} {BASE_CURRENCY_CODE}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-lg">{getStageEmoji(formData.stage)}</span>
            <span className="font-medium text-gray-900">{getStageName(formData.stage)} (Stage 1 of 6)</span>
          </div>

          <div>
            <div className="text-sm text-gray-600">Close: {formData.closeDate || 'Not set'}</div>
            <div className="text-sm text-gray-600">{getDaysAway(formData.closeDate)}</div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">🤖 {formData.probability}% Win Probability</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${formData.probability}%` }}
              ></div>
            </div>
          </div>

          {formData.primaryContactName && (
            <div className="text-sm text-gray-700">
              👤 {formData.primaryContactName} ({formData.contactRole})
            </div>
          )}

          <div className="text-sm text-gray-700">
            Owner: {formData.owner === 'current-user' ? 'Alex Rodriguez' : 'Owner'}
          </div>

          {formData.sourceJourney && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-blue-700">🔗</span>
                <span className="text-blue-900 font-medium">
                  Created from {formData.sourceJourney.type === 'lead' ? 'Lead' : formData.sourceJourney.type === 'contact' ? 'Contact' : 'Account'}: {formData.sourceJourney.name}
                </span>
              </div>
            </div>
          )}

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 italic">
        This is how the deal will appear in the pipeline (Kanban/List/Grid views)
      </p>
    </div>
  );
};
