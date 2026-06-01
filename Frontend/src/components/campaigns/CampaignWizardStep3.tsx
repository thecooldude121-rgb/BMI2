import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Plus, Mail, Linkedin, ChevronDown, ChevronRight as ChevronRightIcon, MoreVertical } from 'lucide-react';
import { CampaignTemplate, SequenceTouch } from '../../utils/campaignTemplates';
import { useToast } from '../../contexts/ToastContext';
import CancelCampaignButton from './CancelCampaignButton';
import SaveDraftButton from './SaveDraftButton';
import { MaxTouchesWarningModal } from './MaxTouchesWarningModal';

interface CampaignWizardStep3Props {
  onNext: (data: Step3Data) => void;
  onBack: () => void;
  onCancel?: () => void;
  initialData?: Partial<Step3Data>;
  selectedTemplate: CampaignTemplate | null;
}

export interface Step3Data {
  sequences: SequenceTouch[];
  totalTouches: number;
  estimatedDuration: number;
  channel: 'email' | 'linkedin' | 'multi_channel';
}

export const CampaignWizardStep3: React.FC<CampaignWizardStep3Props> = ({
  onNext,
  onBack,
  onCancel,
  initialData,
  selectedTemplate
}) => {
  const { addToast } = useToast();

  const [sequences, setSequences] = useState<SequenceTouch[]>(
    initialData?.sequences || selectedTemplate?.sequences || []
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedTouches, setExpandedTouches] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('campaignWizardExpandedTouches');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch {
        return new Set([1]);
      }
    }
    return new Set([1]);
  });
  const [showMaxTouchesWarning, setShowMaxTouchesWarning] = useState(false);
  const touchRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const subjectInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    setHasChanges(JSON.stringify(sequences) !== JSON.stringify(initialData?.sequences));
  }, [sequences, initialData?.sequences]);

  useEffect(() => {
    localStorage.setItem('campaignWizardExpandedTouches', JSON.stringify(Array.from(expandedTouches)));
  }, [expandedTouches]);

  const calculateEstimatedDuration = useCallback((touches: SequenceTouch[]): number => {
    if (touches.length === 0) return 0;

    let totalDays = 0;
    touches.forEach(touch => {
      if (touch.delayUnit === 'days') {
        totalDays += touch.delay;
      } else if (touch.delayUnit === 'hours') {
        totalDays += touch.delay / 24;
      }
    });

    return Math.ceil(totalDays);
  }, []);

  const determineChannel = useCallback((touches: SequenceTouch[]): 'email' | 'linkedin' | 'multi_channel' => {
    if (touches.length === 0) return 'email';

    const hasEmail = touches.some(t => t.channel === 'email');
    const hasLinkedIn = touches.some(t => t.channel === 'linkedin');

    if (hasEmail && hasLinkedIn) return 'multi_channel';
    if (hasLinkedIn) return 'linkedin';
    return 'email';
  }, []);

  const totalTouches = sequences.length;
  const estimatedDuration = calculateEstimatedDuration(sequences);
  const channel = determineChannel(sequences);
  const MAX_TOUCHES = 10;

  const handleAutoSave = async () => {
    try {
      console.log('Auto-saving sequence data');
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Sequence auto-saved successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handlePrevious = useCallback(async () => {
    if (hasChanges) {
      console.log('Auto-saving before going back to Step 2');
      await handleAutoSave();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onBack();
  }, [hasChanges, onBack]);

  const handleNext = async () => {
    if (sequences.length === 0) {
      addToast('⚠️ Please add at least one touch to your sequence', 'error');
      return;
    }

    setIsNavigating(true);
    const startTime = Date.now();

    try {
      await handleAutoSave();

      console.log('Proceeding to Step 4 with sequences:', sequences.length);

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 500 - elapsedTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      onNext({
        sequences,
        totalTouches,
        estimatedDuration,
        channel
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

  const toggleTouchExpansion = useCallback((touchNumber: number) => {
    setExpandedTouches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(touchNumber)) {
        newSet.delete(touchNumber);
      } else {
        newSet.add(touchNumber);
      }
      return newSet;
    });
  }, []);

  const handleAddTouch = useCallback(async () => {
    if (sequences.length >= MAX_TOUCHES) {
      setShowMaxTouchesWarning(true);
      return;
    }

    const newTouchNumber = sequences.length + 1;
    const previousTouch = sequences[sequences.length - 1];

    const defaultChannel: 'email' | 'linkedin' = previousTouch?.channel || 'email';

    const newTouch: SequenceTouch = {
      touchNumber: newTouchNumber,
      touchName: `Touch ${newTouchNumber}`,
      channel: defaultChannel,
      delay: 3,
      delayUnit: 'days',
      subjectLine: '',
      emailBody: `Hi {{firstName}},

[Your message here]

Best regards,
{{senderName}}`,
      linkedInMessage: defaultChannel === 'linkedin' ? `Hi {{firstName}},

[Your message here]

Best,
{{senderName}}` : undefined
    };

    setSequences(prev => [...prev, newTouch]);

    setExpandedTouches(prev => new Set([...prev, newTouchNumber]));

    await handleAutoSave();

    setTimeout(() => {
      const touchElement = touchRefs.current[newTouchNumber];
      if (touchElement) {
        touchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
          const subjectInput = subjectInputRefs.current[newTouchNumber];
          if (subjectInput) {
            subjectInput.focus();
          }
        }, 500);
      }
    }, 100);

    addToast(`Touch ${newTouchNumber} added`, 'success');
  }, [sequences, MAX_TOUCHES, handleAutoSave, addToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleAddTouch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleAddTouch]);

  const getChannelDisplay = () => {
    if (channel === 'email') return 'Email';
    if (channel === 'linkedin') return 'LinkedIn';
    return 'Multi-channel';
  };

  const getChannelIcon = () => {
    if (channel === 'email') return <Mail className="w-4 h-4" />;
    if (channel === 'linkedin') return <Linkedin className="w-4 h-4" />;
    return (
      <div className="flex items-center gap-1">
        <Mail className="w-3.5 h-3.5" />
        <Linkedin className="w-3.5 h-3.5" />
      </div>
    );
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
          <span className="text-sm font-medium">Back to Template Selection</span>
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
            <div className="w-16 h-0.5 bg-green-500"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                ✓
              </div>
              <div className="ml-2 text-sm font-medium text-gray-900">Template</div>
            </div>
            <div className="w-16 h-0.5 bg-blue-500"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div className="ml-2 text-sm font-medium text-gray-900">Build Sequence</div>
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
                await handleAutoSave();
                addToast('Draft saved successfully', 'success');
              }}
              hasChanges={hasChanges}
              autoSaveInterval={5000}
            />
            <CancelCampaignButton onClick={handleNavigateBack} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Build Your Sequence
          </h2>
          <p className="text-gray-600">
            Create or customize your campaign touches
          </p>
        </div>

        {/* 21. Sequence Overview Panel */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Template */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-xl">
                {selectedTemplate?.icon || '✨'}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Template</p>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedTemplate?.name || 'Custom'}
                </p>
              </div>
            </div>

            <div className="h-10 w-px bg-gray-300"></div>

            {/* Total Touches */}
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total Touches</p>
              <p className="text-2xl font-bold text-blue-600">{totalTouches}</p>
            </div>

            <div className="h-10 w-px bg-gray-300"></div>

            {/* Est. Duration */}
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Est. Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {estimatedDuration} {estimatedDuration === 1 ? 'day' : 'days'}
              </p>
            </div>

            <div className="h-10 w-px bg-gray-300"></div>

            {/* Channel */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                {getChannelIcon()}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Channel</p>
                <p className="text-sm font-semibold text-gray-900">{getChannelDisplay()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 22. Add Touch Button (Top Right of Sequence Section) */}
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Sequence Touches {sequences.length > 0 && `(${sequences.length}/${MAX_TOUCHES})`}
          </h3>
          <button
            onClick={handleAddTouch}
            disabled={sequences.length >= MAX_TOUCHES}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${sequences.length < MAX_TOUCHES
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
            title={sequences.length >= MAX_TOUCHES ? 'Maximum 10 touches per campaign' : 'Add new touch (Ctrl/Cmd + N)'}
          >
            <Plus className="w-4 h-4" />
            <span>Add Touch</span>
          </button>
        </div>

        {/* Sequence Builder Area */}
        <div className="mb-8">
          {sequences.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    No touches yet
                  </h3>
                  <p className="text-gray-600">
                    {selectedTemplate?.id === 'custom_blank'
                      ? 'Add your first touch to start building your sequence'
                      : 'Template touches will appear here'}
                  </p>
                </div>
                <button
                  onClick={handleAddTouch}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add First Touch
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sequences.map((touch, index) => {
                const isExpanded = expandedTouches.has(touch.touchNumber);
                return (
                  <div
                    key={index}
                    ref={el => touchRefs.current[touch.touchNumber] = el}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* 23. Touch Card Header - Always Visible */}
                    <div
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleTouchExpansion(touch.touchNumber)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {touch.touchNumber}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                TOUCH {touch.touchNumber} - {touch.touchName}
                              </h4>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="font-medium">
                                Timing: {touch.delay === 0 ? 'Immediately' : `Wait ${touch.delay} ${touch.delayUnit}`}
                              </span>
                              <span>|</span>
                              <span className="flex items-center gap-1.5">
                                <span>Channel:</span>
                                {touch.channel === 'email' ? (
                                  <>
                                    <Mail className="w-4 h-4" />
                                    <span>Email</span>
                                  </>
                                ) : (
                                  <>
                                    <Linkedin className="w-4 h-4" />
                                    <span>LinkedIn</span>
                                  </>
                                )}
                              </span>
                            </div>
                            {!isExpanded && touch.subjectLine && (
                              <p className="text-sm text-gray-500 mt-2 truncate">
                                Subject: {touch.subjectLine}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>
                          <button
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTouchExpansion(touch.touchNumber);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-700 transition-transform duration-300" />
                            ) : (
                              <ChevronRightIcon className="w-5 h-5 text-gray-700 transition-transform duration-300" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Touch Card Body - Collapsible */}
                    <div
                      className={`
                        overflow-hidden transition-all duration-300 ease-in-out
                        ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
                      `}
                    >
                      <div className="px-6 pb-6 pt-0 border-t border-gray-100">
                        <div className="space-y-4 mt-4">
                          {/* Touch Name Input */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Touch Name
                            </label>
                            <input
                              type="text"
                              placeholder="Enter touch name..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              defaultValue={touch.touchName}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Channel & Timing */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Channel
                              </label>
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                defaultValue={touch.channel}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="email">📧 Email</option>
                                <option value="linkedin">💼 LinkedIn</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Delay After Previous
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  defaultValue={touch.delay}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <select
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  defaultValue={touch.delayUnit}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="hours">hours</option>
                                  <option value="days">days</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Subject Line */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Subject Line
                            </label>
                            <input
                              ref={el => subjectInputRefs.current[touch.touchNumber] = el}
                              type="text"
                              placeholder="Enter subject line..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              defaultValue={touch.subjectLine}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Email Body */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Body
                            </label>
                            <textarea
                              placeholder="Enter email body..."
                              rows={6}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                              defaultValue={touch.emailBody}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Available variables: {'{{firstName}}'}, {'{{lastName}}'}, {'{{company}}'}, {'{{senderName}}'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {sequences.length < MAX_TOUCHES && (
                <button
                  onClick={handleAddTouch}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Another Touch
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={isNavigating}
            className="flex items-center gap-2 px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous: Template</span>
          </button>

          <button
            onClick={handleNext}
            disabled={sequences.length === 0 || isNavigating}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200
              ${sequences.length > 0 && !isNavigating
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
                <span>Next: Select Leads</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Max Touches Warning Modal */}
      <MaxTouchesWarningModal
        isOpen={showMaxTouchesWarning}
        onClose={() => setShowMaxTouchesWarning(false)}
      />
    </div>
  );
};
