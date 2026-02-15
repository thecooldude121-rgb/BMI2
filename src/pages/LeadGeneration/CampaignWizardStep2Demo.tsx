import React, { useState } from 'react';
import { CampaignWizardStep2, Step2Data } from '../../components/campaigns/CampaignWizardStep2';
import { useNavigate } from 'react-router-dom';

const CampaignWizardStep2Demo: React.FC = () => {
  const navigate = useNavigate();
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);

  const handleNext = (data: Step2Data) => {
    console.log('Step 2 data:', data);
    setStep2Data(data);
    alert(`Template selected: ${data.selectedTemplate?.name || 'None'}\n\nIn production, this would navigate to Step 3: Build Sequence`);
  };

  const handleBack = () => {
    navigate('/demo/campaign-wizard-step1');
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/lead-generation/campaigns');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <CampaignWizardStep2
        onNext={handleNext}
        onBack={handleBack}
        onCancel={handleCancel}
        initialData={step2Data || undefined}
      />

      {/* Debug Panel */}
      {step2Data && (
        <div className="max-w-6xl mx-auto mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Debug: Selected Template Data
          </h3>
          <pre className="bg-gray-50 rounded-lg p-4 overflow-auto text-xs">
            {JSON.stringify(step2Data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CampaignWizardStep2Demo;
