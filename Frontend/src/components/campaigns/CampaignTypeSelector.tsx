import React, { useState, useEffect } from 'react';
import { Mail, Linkedin, Workflow, Check, Lock, AlertTriangle, Info, Sparkles } from 'lucide-react';

export type CampaignType = 'email' | 'linkedin' | 'multi-channel' | null;

interface CampaignTypeSelectorProps {
  value: CampaignType;
  onChange: (type: CampaignType) => void;
  isLocked?: boolean;
  showError?: boolean;
  onSave?: () => void;
}

interface CampaignTypeOption {
  id: CampaignType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  features: string[];
  warning?: {
    type: 'warning' | 'info' | 'success';
    message: string;
  };
}

const campaignTypes: CampaignTypeOption[] = [
  {
    id: 'email',
    label: 'Email Only',
    icon: Mail,
    description: 'Traditional email outreach campaign',
    features: [
      'Email sequences',
      'Open rate tracking',
      'Click tracking',
      'A/B testing support',
      'Automated follow-ups'
    ],
    warning: {
      type: 'warning',
      message: 'Campaign type cannot be changed after creation'
    }
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Only',
    icon: Linkedin,
    description: 'LinkedIn connection and messaging campaign',
    features: [
      'Connection requests',
      'InMail messages',
      'Profile views tracking',
      'Limited to LinkedIn network',
      'No email tracking'
    ],
    warning: {
      type: 'warning',
      message: 'Open rate tracking not available for LinkedIn campaigns'
    }
  },
  {
    id: 'multi-channel',
    label: 'Multi-Channel',
    icon: Workflow,
    description: 'Combined email and LinkedIn outreach',
    features: [
      'Mix email and LinkedIn',
      'Cross-channel sequences',
      'Maximum reach',
      'Unified analytics',
      'Smart channel selection'
    ],
    warning: {
      type: 'success',
      message: 'Multi-channel campaigns allow mixing email and LinkedIn touches'
    }
  }
];

export const CampaignTypeSelector: React.FC<CampaignTypeSelectorProps> = ({
  value,
  onChange,
  isLocked = false,
  showError = false,
  onSave
}) => {
  const [hoveredType, setHoveredType] = useState<CampaignType>(null);
  const [justSelected, setJustSelected] = useState(false);

  const handleSelect = async (type: CampaignType) => {
    if (isLocked || type === value) return;

    onChange(type);
    setJustSelected(true);

    if (onSave) {
      await new Promise(resolve => setTimeout(resolve, 300));
      onSave();
    }

    setTimeout(() => {
      setJustSelected(false);
    }, 1000);
  };

  const getCardClasses = (type: CampaignType) => {
    const isSelected = value === type;
    const isHovered = hoveredType === type;

    if (isLocked && !isSelected) {
      return 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60';
    }

    if (isLocked && isSelected) {
      return 'bg-blue-50 border-blue-500 cursor-not-allowed';
    }

    if (isSelected) {
      return 'bg-blue-50 border-blue-500 border-2 shadow-md ring-4 ring-blue-100';
    }

    if (isHovered) {
      return 'bg-blue-50 border-gray-300 cursor-pointer transform -translate-y-1 shadow-lg';
    }

    return 'bg-white border-gray-300 cursor-pointer hover:shadow-md';
  };

  const selectedOption = campaignTypes.find(opt => opt.id === value);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900">
          Campaign Type
          <span className="text-red-500 ml-1">*</span>
        </label>
        {isLocked && value && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
            <Lock className="w-3 h-3" />
            <span>Type Locked</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {campaignTypes.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;
          const isHovered = hoveredType === option.id;
          const isDisabled = isLocked && !isSelected;

          return (
            <div
              key={option.id}
              onClick={() => handleSelect(option.id)}
              onMouseEnter={() => !isLocked && setHoveredType(option.id)}
              onMouseLeave={() => setHoveredType(null)}
              className={`
                relative rounded-xl border p-6 transition-all duration-200
                ${getCardClasses(option.id)}
              `}
            >
              {isLocked && isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="bg-gray-700 text-white rounded-full p-1.5">
                    <Lock className="w-3 h-3" />
                  </div>
                </div>
              )}

              {isSelected && !isLocked && (
                <div className="absolute top-3 right-3">
                  <div className="bg-blue-600 text-white rounded-full p-1.5 animate-scale-in">
                    <Check className="w-3 h-3 stroke-[3px]" />
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`
                  rounded-full p-4 transition-all duration-200
                  ${isSelected ? 'bg-blue-100' : isHovered ? 'bg-blue-50' : 'bg-gray-100'}
                  ${isDisabled ? 'bg-gray-200' : ''}
                `}>
                  <Icon className={`
                    w-8 h-8 transition-colors duration-200
                    ${isSelected ? 'text-blue-600' : isHovered ? 'text-blue-500' : 'text-gray-600'}
                    ${isDisabled ? 'text-gray-400' : ''}
                  `} />
                </div>

                <div className="space-y-2 w-full">
                  <h3 className={`
                    text-lg font-semibold transition-colors
                    ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                    ${isDisabled ? 'text-gray-500' : ''}
                  `}>
                    {option.label}
                  </h3>
                  <p className={`
                    text-sm transition-colors
                    ${isSelected ? 'text-blue-700' : 'text-gray-600'}
                    ${isDisabled ? 'text-gray-400' : ''}
                  `}>
                    {option.description}
                  </p>
                </div>

                <div className="w-full pt-2 border-t border-gray-200">
                  <ul className="space-y-2">
                    {option.features.map((feature, index) => (
                      <li
                        key={index}
                        className={`
                          text-xs text-left flex items-start gap-2
                          ${isSelected ? 'text-blue-700' : 'text-gray-600'}
                          ${isDisabled ? 'text-gray-400' : ''}
                        `}
                      >
                        <Check className={`
                          w-3 h-3 flex-shrink-0 mt-0.5
                          ${isSelected ? 'text-blue-600' : 'text-gray-400'}
                          ${isDisabled ? 'text-gray-300' : ''}
                        `} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {isSelected && !isLocked && justSelected && (
                  <div className="w-full pt-2">
                    <div className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full animate-fade-in">
                      <Check className="w-3 h-3" />
                      <span>Selected</span>
                    </div>
                  </div>
                )}
              </div>

              {isLocked && !isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80 rounded-xl">
                  <div className="text-center p-4">
                    <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-600 font-medium">
                      Cannot change type<br />after creation
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showError && !value && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Campaign type is required</p>
            <p className="text-red-600 text-xs mt-1">
              Please select a campaign type to continue.
            </p>
          </div>
        </div>
      )}

      {selectedOption && !isLocked && (
        <div className={`
          flex items-start gap-3 text-sm rounded-lg p-4 border-l-4 animate-slide-down
          ${selectedOption.warning?.type === 'warning' ? 'bg-amber-50 border-amber-500 text-amber-900' : ''}
          ${selectedOption.warning?.type === 'info' ? 'bg-blue-50 border-blue-500 text-blue-900' : ''}
          ${selectedOption.warning?.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : ''}
        `}>
          {selectedOption.warning?.type === 'warning' && (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          )}
          {selectedOption.warning?.type === 'info' && (
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
          )}
          {selectedOption.warning?.type === 'success' && (
            <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          )}
          <div className="flex-1">
            <p className="font-medium">
              {selectedOption.warning?.type === 'warning' && 'Important Notice'}
              {selectedOption.warning?.type === 'info' && 'Information'}
              {selectedOption.warning?.type === 'success' && 'Feature Enabled'}
            </p>
            <p className={`
              text-xs mt-1
              ${selectedOption.warning?.type === 'warning' ? 'text-amber-700' : ''}
              ${selectedOption.warning?.type === 'info' ? 'text-blue-700' : ''}
              ${selectedOption.warning?.type === 'success' ? 'text-emerald-700' : ''}
            `}>
              {selectedOption.warning?.message}
            </p>
          </div>
        </div>
      )}

      {isLocked && value && (
        <div className="flex items-start gap-3 text-sm bg-gray-50 border border-gray-300 rounded-lg p-4">
          <Lock className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-600" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Campaign Type Locked</p>
            <p className="text-xs text-gray-600 mt-1">
              The campaign type cannot be changed after the campaign has been created or saved as a draft. To use a different type, create a new campaign.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(-4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          0% {
            opacity: 0;
            transform: translateY(-8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
