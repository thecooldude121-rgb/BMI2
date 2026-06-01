import React, { useState, useRef, useEffect } from 'react';
import { CampaignTemplate } from '../../utils/campaignTemplates';
import { Check, ArrowRight, Info } from 'lucide-react';
import { TemplateDetailsModal } from './TemplateDetailsModal';

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const handleInfoMouseEnter = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    showTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
      setTooltipPosition({ x: e.clientX + 10, y: e.clientY + 10 });
    }, 300);
  };

  const handleInfoMouseMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showTooltip) {
      setTooltipPosition({ x: e.clientX + 10, y: e.clientY + 10 });
    }
  };

  const handleInfoMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 200);
  };
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
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {template.name}
            </h3>
            {template.stats && (
              <div
                className="relative"
                onMouseEnter={handleInfoMouseEnter}
                onMouseMove={handleInfoMouseMove}
                onMouseLeave={handleInfoMouseLeave}
              >
                <Info className="w-4 h-4 text-gray-400 hover:text-blue-600 cursor-help transition-colors" />
              </div>
            )}
          </div>
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

      {template.totalTouches > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDetailsModal(true);
          }}
          className="w-full mb-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 transition-colors"
        >
          View Sequence Details
          <ArrowRight className="w-4 h-4" />
        </button>
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

      <TemplateDetailsModal
        template={template}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onSelect={onSelect}
      />

      {showTooltip && template.stats && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          <div className="bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 p-4 min-w-[280px] animate-in fade-in duration-150">
            <div className="mb-3 pb-3 border-b border-gray-700">
              <h4 className="font-semibold text-sm">{template.name} Template</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Used by campaigns:</span>
                <span className="font-semibold">{template.stats.campaignsUsing.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Avg success rate:</span>
                <span className="font-semibold">{template.stats.avgSuccessRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Best for:</span>
                <span className="font-semibold">{template.stats.bestFor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Daily limit:</span>
                <span className="font-semibold">{template.stats.recommendedDailyLimit} leads</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
