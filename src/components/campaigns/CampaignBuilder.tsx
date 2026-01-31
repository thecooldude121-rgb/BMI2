import React, { useState } from 'react';
import { campaignTemplates } from '../../utils/campaignTemplates';
import { TemplateCard } from './TemplateCard';

export const CampaignBuilder: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(2);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const handleNext = () => {
    if (selectedTemplateId) {
      setCurrentStep(3);
      const selectedTemplate = campaignTemplates.find(t => t.id === selectedTemplateId);
      console.log('Selected template:', selectedTemplate);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <div className="ml-2 text-sm font-medium text-gray-900">Basic Info</div>
            </div>
            <div className="w-16 h-0.5 bg-blue-500"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div className="ml-2 text-sm font-medium text-gray-900">Select Template</div>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div className="ml-2 text-sm font-medium text-gray-500">Build Sequence</div>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <div className="ml-2 text-sm font-medium text-gray-500">Select Leads</div>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-semibold">
                5
              </div>
              <div className="ml-2 text-sm font-medium text-gray-500">Settings</div>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-semibold">
                6
              </div>
              <div className="ml-2 text-sm font-medium text-gray-500">Review</div>
            </div>
          </div>
        </div>
      </div>

      {currentStep === 2 && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Select Template
            </h2>
            <p className="text-gray-600">
              Choose a pre-built template or start from scratch
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Recommended Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaignTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                  isSelected={selectedTemplateId === template.id}
                />
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">TIP:</span> Templates can be customized after selection.
              Your changes won't affect the template.
            </p>
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Previous: Basic Info
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedTemplateId}
              className={`
                px-6 py-2 rounded-lg font-medium transition-colors
                ${selectedTemplateId
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Next: Build Sequence
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
