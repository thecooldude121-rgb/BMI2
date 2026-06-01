import React, { useState } from 'react';
import { CampaignWizardStep3, Step3Data } from '../../components/campaigns/CampaignWizardStep3';
import { useNavigate } from 'react-router-dom';
import { campaignTemplates } from '../../utils/campaignTemplates';

const CampaignWizardStep3Demo: React.FC = () => {
  const navigate = useNavigate();

  const coldOutreachTemplate = campaignTemplates.find(t => t.id === 'cold_outreach');

  const [step3Data, setStep3Data] = useState<Step3Data | null>(null);

  const handleNext = (data: Step3Data) => {
    console.log('Step 3 data:', data);
    setStep3Data(data);
    alert(`Sequence configured:\n\nTotal Touches: ${data.totalTouches}\nDuration: ${data.estimatedDuration} days\nChannel: ${data.channel}\n\nIn production, this would navigate to Step 4: Select Leads`);
  };

  const handleBack = () => {
    navigate('/demo/campaign-wizard-step2');
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/lead-generation/campaigns');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <CampaignWizardStep3
        onNext={handleNext}
        onBack={handleBack}
        onCancel={handleCancel}
        selectedTemplate={coldOutreachTemplate || null}
        initialData={step3Data || undefined}
      />

      {/* Debug Panel */}
      {step3Data && (
        <div className="max-w-6xl mx-auto mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Debug: Sequence Data
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Touches</p>
              <p className="text-3xl font-bold text-blue-600">{step3Data.totalTouches}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600 mb-1">Duration</p>
              <p className="text-3xl font-bold text-green-600">{step3Data.estimatedDuration} days</p>
            </div>
          </div>
          <pre className="bg-gray-50 rounded-lg p-4 overflow-auto text-xs">
            {JSON.stringify(step3Data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CampaignWizardStep3Demo;
