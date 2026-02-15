import React from 'react';
import { CampaignTemplate } from '../../utils/campaignTemplates';
import { Check } from 'lucide-react';

interface TemplateCardProps {
  template: CampaignTemplate;
  onSelect: (templateId: string) => void;
  isSelected?: boolean;
  isLoading?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  isSelected = false,
  isLoading = false
}) => {
  return (
    <div
      className={`
        relative border rounded-xl p-6 cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50 hover:scale-[1.02]'
        }
        ${isLoading ? 'animate-pulse pointer-events-none' : ''}
      `}
      style={{
        boxShadow: isSelected
          ? '0 4px 6px rgba(0, 0, 0, 0.1)'
          : undefined
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isLoading) {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '';
        }
      }}
      onClick={() => onSelect(template.id)}
    >
      {/* Checkmark badge when selected */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{template.icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">
            {template.name}
          </h3>
        </div>
        {template.type === 'multi_channel' && !isSelected && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
            Multi-channel
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4 border-b pb-4">
        {template.description}
      </p>

      {template.totalTouches > 0 && (
        <div className="mb-4 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{template.totalTouches}-touch sequence</span>
            <span className="text-gray-600">
              {template.type === 'email' ? '📧 Email only' :
               template.type === 'linkedin' ? '💼 LinkedIn only' :
               '🔗 Multi-channel'}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Duration: {template.duration} days
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">Perfect for:</p>
        <ul className="space-y-1">
          {template.perfectFor.map((item, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-start">
              <span className="mr-2">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {template.avgPerformance.openRate > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Avg Performance:</p>
          <div className="space-y-1">
            {template.type !== 'linkedin' && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">📊 Open rate:</span>
                <span className="font-semibold text-gray-900">
                  {template.avgPerformance.openRate}%
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">💬 Reply rate:</span>
              <span className="font-semibold text-gray-900">
                {template.avgPerformance.replyRate}%
              </span>
            </div>
            {template.avgPerformance.conversionRate > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">🎯 Conversion:</span>
                <span className="font-semibold text-gray-900">
                  {template.avgPerformance.conversionRate}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        className={`
          w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors
          ${isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(template.id);
        }}
      >
        {isSelected ? '✓ Selected' :
         template.id === 'custom_blank' ? 'Start from Scratch' : 'Select Template'}
      </button>
    </div>
  );
};
