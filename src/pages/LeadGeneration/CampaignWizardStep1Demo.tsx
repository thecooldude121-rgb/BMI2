import React, { useState } from 'react';
import { CampaignWizardStep1, Step1Data } from '../../components/campaigns/CampaignWizardStep1';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CampaignWizardStep1Demo: React.FC = () => {
  const navigate = useNavigate();
  const [submittedData, setSubmittedData] = useState<Step1Data | null>(null);

  const handleNext = (data: Step1Data) => {
    console.log('Step 1 Data:', data);
    setSubmittedData(data);
  };

  const handleReset = () => {
    setSubmittedData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/lead-generation/campaigns')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Campaigns
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Create New Campaign</h1>
              <p className="text-sm text-gray-500">Step 1: Basic Information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8 px-6">
        {!submittedData ? (
          <CampaignWizardStep1 onNext={handleNext} />
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Step 1 Complete!
                </h2>
                <p className="text-gray-600">
                  Your campaign basic information has been saved
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 mb-3">Submitted Data:</h3>

                <div>
                  <p className="text-sm font-medium text-gray-700">Campaign Name:</p>
                  <p className="text-lg text-gray-900">{submittedData.campaignName}</p>
                </div>

                {submittedData.objective && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Objective:</p>
                    <p className="text-gray-900">{submittedData.objective.split('_').map(word =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}</p>
                  </div>
                )}

                {submittedData.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Description:</p>
                    <p className="text-gray-900">{submittedData.description}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-2.5 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Start Over
                </button>
                <button
                  onClick={() => console.log('Proceeding to Step 2...')}
                  className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue to Step 2
                </button>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Next Step:</span> You'll select a campaign template to customize your outreach sequence.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <h3 className="font-semibold text-gray-900 mb-2">Testing Guide</h3>
        <div className="text-xs text-gray-600 space-y-2">
          <p><strong>Try these interactions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Type in the Campaign Name field</li>
            <li>Watch the character counter update</li>
            <li>Try typing over 100 characters</li>
            <li>Leave field empty and blur to see error</li>
            <li>Enter valid name to see checkmark</li>
            <li>Wait 5 seconds to see auto-save</li>
            <li>Try these names to test duplicates: "Q4 2024 Holiday Campaign"</li>
            <li>Try invalid characters: &lt; &gt; / \ |</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
