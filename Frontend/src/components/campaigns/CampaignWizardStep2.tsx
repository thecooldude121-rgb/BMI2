import React, { useState, useEffect, useCallback } from 'react';
import { TemplateCard } from './TemplateCard';
import { campaignTemplates, CampaignTemplate } from '../../utils/campaignTemplates';
import { useToast } from '../../contexts/ToastContext';
import { ChevronRight, ChevronLeft, AlertTriangle, ArrowRight, X, Grid3X3, Table, Loader2 } from 'lucide-react';
import CancelCampaignButton from './CancelCampaignButton';
import SaveDraftButton from './SaveDraftButton';

interface CampaignWizardStep2Props {
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  onCancel?: () => void;
  initialData?: Partial<Step2Data>;
}

export interface Step2Data {
  selectedTemplateId: string | null;
  selectedTemplate: CampaignTemplate | null;
}

export const CampaignWizardStep2: React.FC<CampaignWizardStep2Props> = ({
  onNext,
  onBack,
  onCancel,
  initialData
}) => {
  const { addToast } = useToast();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    initialData?.selectedTemplateId || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [isTipFadingOut, setIsTipFadingOut] = useState(false);

  useEffect(() => {
    const tipDismissed = localStorage.getItem('campaign_template_tip_dismissed');
    if (tipDismissed === 'true') {
      setShowTip(false);
    }
  }, []);

  const handlePrevious = useCallback(async () => {
    if (selectedTemplateId) {
      console.log('Auto-saving before going back to Step 1');
      await handleAutoSave(selectedTemplateId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onBack();
  }, [selectedTemplateId, onBack]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious]);

  const selectedTemplate = selectedTemplateId
    ? campaignTemplates.find(t => t.id === selectedTemplateId) || null
    : null;

  const showScratchWarning = selectedTemplateId === 'custom_blank';

  useEffect(() => {
    setHasChanges(selectedTemplateId !== initialData?.selectedTemplateId);
  }, [selectedTemplateId, initialData?.selectedTemplateId]);

  const handleTemplateSelect = async (templateId: string) => {
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setSelectedTemplateId(templateId);

      const template = campaignTemplates.find(t => t.id === templateId);
      if (template) {
        addToast(`Template "${template.name}" selected`, 'success');
      }

      await handleAutoSave(templateId);
    } catch (error) {
      console.error('Error selecting template:', error);
      addToast('Failed to select template', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSave = async (templateId: string) => {
    try {
      console.log('Auto-saving selected template:', templateId);
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Template auto-saved successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleNext = async () => {
    if (!selectedTemplateId) {
      addToast('⚠️ Please select a template or start from scratch', 'error');
      return;
    }

    setIsNavigating(true);
    const startTime = Date.now();

    try {
      await handleAutoSave(selectedTemplateId);

      console.log('Loading sequences for template:', selectedTemplateId);

      if (selectedTemplateId === 'custom_blank') {
        console.log('Loading empty sequence builder for "Start from Scratch"');
      } else if (selectedTemplateId === 'cold_outreach_basic') {
        console.log('Loading 5 pre-filled touches for "Cold Outreach" template');
      } else {
        console.log(`Loading sequences for ${selectedTemplate?.name}`);
      }

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      onNext({
        selectedTemplateId,
        selectedTemplate
      });
    } catch (error) {
      console.error('Error during navigation:', error);
      addToast('Failed to proceed to next step', 'error');
      setIsNavigating(false);
    }
  };

  const handleNavigateBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  const handleDismissTip = () => {
    setIsTipFadingOut(true);
    setTimeout(() => {
      setShowTip(false);
      localStorage.setItem('campaign_template_tip_dismissed', 'true');
    }, 500);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <button
          onClick={handlePrevious}
          disabled={isNavigating}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Back to Basic Info</span>
        </button>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          {/* Progress Tracker */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
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

          {/* Action Buttons - Top Right */}
          <div className="flex items-start gap-3">
            <SaveDraftButton
              onSave={async () => {
                console.log('Manual draft save');
                addToast('Draft saved successfully', 'success');
              }}
              hasChanges={hasChanges}
              autoSaveInterval={5000}
            />
            <CancelCampaignButton onClick={handleNavigateBack} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Select Campaign Template
            </h2>
            <p className="text-gray-600">
              Choose a pre-built template or start from scratch
            </p>
          </div>
          <button
            onClick={() => setShowComparisonView(!showComparisonView)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showComparisonView ? (
              <>
                <Grid3X3 className="w-4 h-4" />
                Card View
              </>
            ) : (
              <>
                <Table className="w-4 h-4" />
                Compare Templates
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Warning for Start from Scratch */}
        {showScratchWarning && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 mb-1">
                Building from scratch
              </p>
              <p className="text-sm text-amber-700">
                You'll need to build your sequence from scratch in the next step. This gives you complete control but requires more setup time.
              </p>
            </div>
          </div>
        )}

        {/* Comparison Table View */}
        {showComparisonView ? (
          <div className="mb-8 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-900">Feature</th>
                  {campaignTemplates
                    .filter(t => t.id !== 'custom_blank')
                    .map(template => (
                      <th key={template.id} className="text-center p-4">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-2xl">{template.icon}</span>
                          <span className="font-semibold text-gray-900 text-sm">
                            {template.name}
                          </span>
                          <button
                            onClick={() => handleTemplateSelect(template.id)}
                            disabled={isLoading}
                            className={`
                              text-xs px-3 py-1.5 rounded-lg font-medium transition-colors
                              ${selectedTemplateId === template.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }
                            `}
                          >
                            {selectedTemplateId === template.id ? '✓ Selected' : 'Select'}
                          </button>
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">Touches</td>
                  {campaignTemplates
                    .filter(t => t.id !== 'custom_blank')
                    .map(template => (
                      <td key={template.id} className="p-4 text-center text-gray-700">
                        {template.totalTouches}
                      </td>
                    ))}
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">Duration</td>
                  {campaignTemplates
                    .filter(t => t.id !== 'custom_blank')
                    .map(template => (
                      <td key={template.id} className="p-4 text-center text-gray-700">
                        {template.duration} days
                      </td>
                    ))}
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">Channel</td>
                  {campaignTemplates
                    .filter(t => t.id !== 'custom_blank')
                    .map(template => (
                      <td key={template.id} className="p-4 text-center">
                        <span className={`
                          text-xs px-2 py-1 rounded
                          ${template.type === 'email' ? 'bg-blue-100 text-blue-700' :
                            template.type === 'linkedin' ? 'bg-purple-100 text-purple-700' :
                            'bg-green-100 text-green-700'}
                        `}>
                          {template.type === 'email' ? 'Email' :
                           template.type === 'linkedin' ? 'LinkedIn' :
                           'Multi-channel'}
                        </span>
                      </td>
                    ))}
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">Open Rate</td>
                  {campaignTemplates
                    .filter(t => t.id !== 'custom_blank')
                    .map(template => (
                      <td key={template.id} className="p-4 text-center">
                        {template.type === 'linkedin' ? (
                          <span className="text-gray-400 text-sm">N/A</span>
                        ) : (
                          <span className={`
                            font-semibold
                            ${template.avgPerformance.openRate >= 40 ? 'text-green-600' :
                              template.avgPerformance.openRate >= 25 ? 'text-blue-600' :
                              'text-gray-700'}
                          `}>
                            {template.avgPerformance.openRate}%
                          </span>
                        )}
                      </td>
                    ))}
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">Reply Rate</td>
                  {campaignTemplates
                    .filter(t => t.id !== 'custom_blank')
                    .map(template => (
                      <td key={template.id} className="p-4 text-center">
                        <span className={`
                          font-semibold
                          ${template.avgPerformance.replyRate >= 15 ? 'text-green-600' :
                            template.avgPerformance.replyRate >= 8 ? 'text-blue-600' :
                            'text-gray-700'}
                        `}>
                          {template.avgPerformance.replyRate}%
                        </span>
                      </td>
                    ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">Best For</td>
                  {campaignTemplates
                    .filter(t => t.id !== 'custom_blank')
                    .map(template => (
                      <td key={template.id} className="p-4 text-center">
                        <div className="text-xs text-gray-600 space-y-1">
                          {template.perfectFor.slice(0, 2).map((item, idx) => (
                            <div key={idx}>{item}</div>
                          ))}
                        </div>
                      </td>
                    ))}
                </tr>
              </tbody>
            </table>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Higher open and reply rates indicate better engagement. Choose based on your audience and campaign goals.
              </p>
            </div>
          </div>
        ) : (
          /* Template Grid - 3 columns */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {campaignTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleTemplateSelect}
                isSelected={selectedTemplateId === template.id}
                isLoading={isLoading && selectedTemplateId === template.id}
              />
            ))}
          </div>
        )}

        {/* Dismissible Tip Box */}
        {showTip && !showComparisonView && (
          <div
            className={`
              mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3
              transition-all duration-500
              ${isTipFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
            `}
          >
            <span className="text-2xl flex-shrink-0">💡</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">
                TIP
              </p>
              <p className="text-sm text-blue-800">
                Templates can be customized after selection. You'll be able to edit email content, adjust timing, add or remove touches, and personalize every aspect of your campaign in the next step.
              </p>
            </div>
            <button
              onClick={handleDismissTip}
              className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors"
              aria-label="Dismiss tip"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={isNavigating}
            className="flex items-center gap-2 px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous: Basic Info</span>
          </button>

          <button
            onClick={handleNext}
            disabled={!selectedTemplateId || isNavigating}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200
              ${selectedTemplateId && !isNavigating
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isNavigating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Next: Build Sequence</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
