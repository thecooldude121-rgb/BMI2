import React, { useState, useEffect, useRef } from 'react';
import { CampaignNameInput } from './CampaignNameInput';
import { CampaignDescriptionTextarea } from './CampaignDescriptionTextarea';
import { CampaignTypeSelector, CampaignType } from './CampaignTypeSelector';
import CampaignTargetMetrics from './CampaignTargetMetrics';
import CampaignTagsInput from './CampaignTagsInput';
import CampaignOwnerDropdown from './CampaignOwnerDropdown';
import CampaignCollaboratorsSelect from './CampaignCollaboratorsSelect';
import SaveDraftButton from './SaveDraftButton';
import UnsavedChangesModal from './UnsavedChangesModal';
import CancelCampaignButton from './CancelCampaignButton';
import DiscardChangesModal from './DiscardChangesModal';
import { useToast } from '../../contexts/ToastContext';
import { ChevronRight, Info } from 'lucide-react';

interface CampaignWizardStep1Props {
  onNext: (data: Step1Data) => void;
  onCancel?: () => void;
  initialData?: Partial<Step1Data>;
}

export interface Step1Data {
  campaignName: string;
  objective: string;
  description: string;
  campaignType: CampaignType;
  targetMetrics: {
    openRate: number | null;
    replyRate: number | null;
    opportunities: number | null;
    revenue: number | null;
  };
  tags: string[];
  ownerId: string;
  collaboratorIds: string[];
}

export const CampaignWizardStep1: React.FC<CampaignWizardStep1Props> = ({
  onNext,
  onCancel,
  initialData
}) => {
  const { addToast } = useToast();

  const [formData, setFormData] = useState<Step1Data>({
    campaignName: initialData?.campaignName || '',
    objective: initialData?.objective || '',
    description: initialData?.description || '',
    campaignType: initialData?.campaignType || null,
    targetMetrics: initialData?.targetMetrics || {
      openRate: null,
      replyRate: null,
      opportunities: null,
      revenue: null
    },
    tags: initialData?.tags || [],
    ownerId: initialData?.ownerId || 'current_user',
    collaboratorIds: initialData?.collaboratorIds || []
  });

  const [isNameValid, setIsNameValid] = useState(false);
  const [showTypeError, setShowTypeError] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Draft saving state
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const initialFormDataRef = useRef<Step1Data>(formData);

  // Error states
  const [showOwnerError, setShowOwnerError] = useState(false);

  const existingCampaignNames = [
    'Q4 2024 Holiday Campaign',
    'New Year Product Launch',
    'Spring Sales Initiative'
  ];

  // Detect changes
  useEffect(() => {
    const hasFormChanged = JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);
    setHasChanges(hasFormChanged);
  }, [formData]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to proceed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (canProceed && !isNavigating) {
          handleNext();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canProceed, isNavigating, formData]);

  // Save draft function
  const handleSaveDraft = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In real app, save to database
      console.log('Draft saved:', formData);

      // Update initial data to match current (no longer has changes)
      initialFormDataRef.current = { ...formData };
      setHasChanges(false);

      addToast('Draft saved successfully', 'success');

    } catch (error) {
      console.error('Failed to save draft:', error);
      addToast('Failed to save draft. Retrying...', 'error');
      throw error; // Re-throw for SaveDraftButton to handle retry
    }
  };

  // Navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Handle navigation with unsaved changes
  const handleNavigationWithChanges = (callback: () => void) => {
    if (hasChanges) {
      setPendingNavigation(() => callback);
      setShowUnsavedModal(true);
    } else {
      callback();
    }
  };

  // Unsaved changes modal handlers
  const handleSaveAndExit = async () => {
    try {
      await handleSaveDraft();
      setShowUnsavedModal(false);
      if (pendingNavigation) {
        pendingNavigation();
        setPendingNavigation(null);
      }
    } catch (error) {
      // Error is handled in handleSaveDraft
    }
  };

  const handleExitWithoutSaving = () => {
    setShowUnsavedModal(false);
    setHasChanges(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleCancelExit = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  // Cancel button handlers
  const handleCancelClick = () => {
    if (hasChanges) {
      setShowDiscardModal(true);
    } else {
      handleNavigateBack();
    }
  };

  const handleSaveDraftAndClose = async () => {
    setIsSaving(true);
    try {
      await handleSaveDraft();
      setShowDiscardModal(false);
      addToast('Draft saved', 'success');
      handleNavigateBack();
    } catch (error) {
      // Error is handled in handleSaveDraft
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setShowDiscardModal(false);
    setHasChanges(false);
    addToast('Changes discarded', 'info');
    handleNavigateBack();
  };

  const handleCancelDiscard = () => {
    setShowDiscardModal(false);
  };

  const handleNavigateBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Default behavior: go back in history or to campaigns list
      window.history.back();
    }
  };

  const handleNext = async () => {
    // Validate campaign name
    if (!isNameValid || !formData.campaignName.trim() || formData.campaignName.trim().length < 5) {
      const nameInput = document.querySelector('[name="campaignName"]') as HTMLElement;
      if (nameInput) {
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInput.focus();
      }
      return;
    }

    // Validate campaign type
    if (!formData.campaignType) {
      setShowTypeError(true);
      const typeSection = document.getElementById('campaign-type-section');
      if (typeSection) {
        typeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Validate owner
    if (!formData.ownerId) {
      setShowOwnerError(true);
      const ownerSection = document.querySelector('[data-section="owner"]') as HTMLElement;
      if (ownerSection) {
        ownerSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      addToast('Please select a campaign owner', 'error');
      return;
    }

    // All validations passed
    setShowTypeError(false);
    setShowOwnerError(false);
    setIsNavigating(true);

    try {
      // Auto-save before navigation
      console.log('Auto-saving before proceeding to Step 2...');
      await handleSaveDraft();

      // Brief delay for smooth transition and scroll to top
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        onNext(formData);
        setIsNavigating(false);
      }, 300);
    } catch (error) {
      console.error('Error saving before navigation:', error);
      setIsNavigating(false);
      // Still proceed with navigation even if save fails
      addToast('Proceeding without saving', 'info');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        onNext(formData);
      }, 100);
    }
  };

  const canProceed = isNameValid &&
                     formData.campaignName.trim().length >= 5 &&
                     formData.campaignType !== null &&
                     formData.ownerId !== null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSaveAndExit={handleSaveAndExit}
        onExitWithoutSaving={handleExitWithoutSaving}
        onCancel={handleCancelExit}
      />

      {/* Discard Changes Modal */}
      <DiscardChangesModal
        isOpen={showDiscardModal}
        onSaveDraft={handleSaveDraftAndClose}
        onDiscardChanges={handleDiscardChanges}
        onCancel={handleCancelDiscard}
        isSaving={isSaving}
      />

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

          {/* Action Buttons - Top Right */}
          <div className="flex items-start gap-3">
            <SaveDraftButton
              onSave={handleSaveDraft}
              hasChanges={hasChanges}
              autoSaveInterval={5000}
            />
            <CancelCampaignButton onClick={handleCancelClick} />
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

          <CampaignTargetMetrics
            values={formData.targetMetrics}
            onChange={(metrics) => setFormData(prev => ({ ...prev, targetMetrics: metrics }))}
          />

          <CampaignTagsInput
            tags={formData.tags}
            onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
          />

          <div data-section="owner">
            <CampaignOwnerDropdown
              selectedOwnerId={formData.ownerId}
              onChange={(ownerId) => {
                setFormData(prev => ({ ...prev, ownerId }));
                setShowOwnerError(false);
              }}
            />
            {showOwnerError && !formData.ownerId && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span>
                <span>Campaign owner is required</span>
              </p>
            )}
          </div>

          <CampaignCollaboratorsSelect
            selectedCollaboratorIds={formData.collaboratorIds}
            onChange={(collaboratorIds) => setFormData(prev => ({ ...prev, collaboratorIds }))}
            ownerId={formData.ownerId}
          />
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

          {/* Required vs Optional Fields */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-2 text-gray-900">Required to Continue:</p>
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-2">
                    {formData.campaignName.trim().length >= 5 ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">○</span>
                    )}
                    <span className={formData.campaignName.trim().length >= 5 ? 'text-gray-600 line-through' : ''}>
                      Campaign Name (min 5 characters)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.campaignType ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">○</span>
                    )}
                    <span className={formData.campaignType ? 'text-gray-600 line-through' : ''}>
                      Campaign Type
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.ownerId ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">○</span>
                    )}
                    <span className={formData.ownerId ? 'text-gray-600 line-through' : ''}>
                      Campaign Owner
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 italic">
                  All other fields are optional and can be filled in later
                </p>
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

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          {/* Keyboard Shortcut Hint */}
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
            </kbd>
            <span>+</span>
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
              Enter
            </kbd>
            <span className="ml-1">to continue</span>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!canProceed || isNavigating}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all duration-200
              flex items-center gap-2 min-w-[200px] justify-center
              ${canProceed && !isNavigating
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isNavigating ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Next: Select Template</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
