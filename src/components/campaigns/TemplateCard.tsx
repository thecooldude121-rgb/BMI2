import React from 'react';
import { CampaignTemplate } from '../../utils/campaignTemplates';

interface TemplateCardProps {
  template: CampaignTemplate;
  onSelect: (templateId: string) => void;
  isSelected?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  isSelected = false
}) => {
  return (
    <div
      className={`
        border rounded-xl p-6 cursor-pointer transition-all
        ${isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
        }
      `}
      onClick={() => onSelect(template.id)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{template.icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">
            {template.name}
          </h3>
        </div>
        {template.type === 'multi_channel' && (
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
