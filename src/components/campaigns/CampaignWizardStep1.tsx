import React, { useState } from 'react';
import { CampaignNameInput } from './CampaignNameInput';
import { CampaignDescriptionTextarea } from './CampaignDescriptionTextarea';
import { CampaignTypeSelector, CampaignType } from './CampaignTypeSelector';
import { ChevronRight, Info } from 'lucide-react';

interface CampaignWizardStep1Props {
  onNext: (data: Step1Data) => void;
  initialData?: Partial<Step1Data>;
}

export interface Step1Data {
  campaignName: string;
  objective: string;
  description: string;
  campaignType: CampaignType;
}

export const CampaignWizardStep1: React.FC<CampaignWizardStep1Props> = ({
  onNext,
  initialData
}) => {
  const [formData, setFormData] = useState<Step1Data>({
    campaignName: initialData?.campaignName || '',
    objective: initialData?.objective || '',
    description: initialData?.description || '',
    campaignType: initialData?.campaignType || null
  });

  const [isNameValid, setIsNameValid] = useState(false);
  const [showTypeError, setShowTypeError] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const existingCampaignNames = [
    'Q4 2024 Holiday Campaign',
    'New Year Product Launch',
    'Spring Sales Initiative'
  ];

  const handleNext = () => {
    if (!isNameValid || !formData.campaignName.trim()) {
      return;
    }

    if (!formData.campaignType) {
      setShowTypeError(true);
      const typeSection = document.getElementById('campaign-type-section');
      if (typeSection) {
        typeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setShowTypeError(false);
    onNext(formData);
  };

  const canProceed = isNameValid &&
                     formData.campaignName.trim().length >= 5 &&
                     formData.campaignType !== null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div className="ml-2 text-sm font-medium text-gray-900">Basic Info</div>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div className="ml-2 text-sm font-medium text-gray-500">Select Template</div>
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Basic Information
          </h2>
          <p className="text-gray-600">
            Set up the foundation for your campaign
          </p>
        </div>

        <div className="space-y-6">
          <CampaignNameInput
            value={formData.campaignName}
            onChange={(value) => setFormData(prev => ({ ...prev, campaignName: value }))}
            existingNames={existingCampaignNames}
            onValidationChange={setIsNameValid}
          />

          <div className="space-y-2">
            <label htmlFor="campaign-objective" className="block text-sm font-medium text-gray-900">
              Campaign Objective
            </label>
            <select
              id="campaign-objective"
              value={formData.objective}
              onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 focus:outline-none"
            >
              <option value="">Select an objective...</option>
              <option value="lead_generation">Lead Generation</option>
              <option value="product_launch">Product Launch</option>
              <option value="re_engagement">Re-engagement</option>
              <option value="event_promotion">Event Promotion</option>
              <option value="nurture">Nurture Campaign</option>
              <option value="customer_retention">Customer Retention</option>
            </select>
          </div>

          <CampaignDescriptionTextarea
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            onSave={() => console.log('Description auto-saved')}
          />

          <div id="campaign-type-section">
            <CampaignTypeSelector
              value={formData.campaignType}
              onChange={(type) => {
                setFormData(prev => ({ ...prev, campaignType: type }));
                setShowTypeError(false);
              }}
              isLocked={isLocked}
              showError={showTypeError}
              onSave={() => console.log('Campaign type auto-saved')}
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Campaign Setup Tips</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Choose campaign type carefully - it cannot be changed later</li>
                  <li>Multi-channel campaigns provide maximum flexibility</li>
                  <li>Email-only campaigns are best for content-rich outreach</li>
                  <li>LinkedIn-only campaigns work well for executive targeting</li>
                </ul>
              </div>
            </div>
          </div>

          {!isLocked && formData.campaignType && (
            <div className="flex justify-end">
              <button
                onClick={() => setIsLocked(true)}
                className="text-xs text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded border border-gray-300 hover:border-gray-400 transition-colors"
              >
                🔒 Simulate Type Lock (for testing)
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`
              px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
              ${canProceed
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Next: Select Template
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
