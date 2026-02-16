import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Mail, MessageSquare } from 'lucide-react';
import { CampaignTemplate } from '../../utils/campaignTemplates';

interface TemplateDetailsModalProps {
  template: CampaignTemplate;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
}

export const TemplateDetailsModal: React.FC<TemplateDetailsModalProps> = ({
  template,
  isOpen,
  onClose,
  onSelect,
}) => {
  const [expandedTouches, setExpandedTouches] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const toggleTouch = (touchNumber: number) => {
    const newExpanded = new Set(expandedTouches);
    if (newExpanded.has(touchNumber)) {
      newExpanded.delete(touchNumber);
    } else {
      newExpanded.add(touchNumber);
    }
    setExpandedTouches(newExpanded);
  };

  const handleSelect = () => {
    onSelect(template.id);
    onClose();
  };

  const highlightVariables = (text: string) => {
    return text.split(/({{[^}]+}})/).map((part, index) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        return (
          <span key={index} className="bg-blue-100 text-blue-700 px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{template.icon}</span>
            <h2 className="text-2xl font-bold text-gray-900">{template.name} Template</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-gray-600 mb-6">
            {template.totalTouches > 0
              ? `${template.totalTouches}-touch ${template.type.replace('_', '-')} sequence over ${template.duration} days`
              : template.description}
          </p>

          {template.sequences.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">This is a blank template</p>
              <p className="text-sm">You'll build your own custom sequence from scratch</p>
            </div>
          ) : (
            <div className="space-y-4">
              {template.sequences.map((touch, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
                >
                  <div className="bg-gray-50 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            Touch {touch.touchNumber}: {touch.touchName}
                          </span>
                          {touch.channel === 'email' ? (
                            <Mail className="w-4 h-4 text-blue-600" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Day {touch.delay === 0 ? '0' : touch.delay} • {touch.channel === 'email' ? 'Email' : 'LinkedIn'}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleTouch(touch.touchNumber)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        {expandedTouches.has(touch.touchNumber) ? (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-4 h-4" />
                            View Full {touch.channel === 'email' ? 'Email' : 'Message'}
                          </>
                        )}
                      </button>
                    </div>

                    {touch.channel === 'email' && touch.subjectLine && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">Subject:</div>
                        <div className="text-sm text-gray-900 font-medium">
                          {highlightVariables(touch.subjectLine)}
                        </div>
                      </div>
                    )}

                    {!expandedTouches.has(touch.touchNumber) && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">Preview:</div>
                        <div className="text-sm text-gray-700 line-clamp-2">
                          {touch.channel === 'email' ? touch.emailBody : touch.linkedInMessage}
                        </div>
                      </div>
                    )}

                    {touch.sendConditions && touch.sendConditions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Conditions:</div>
                        <div className="flex flex-wrap gap-2">
                          {touch.sendConditions.map((condition, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded"
                            >
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {touch.abTestingEnabled && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded inline-block">
                          A/B Testing Enabled
                        </div>
                      </div>
                    )}
                  </div>

                  {expandedTouches.has(touch.touchNumber) && (
                    <div className="bg-white p-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">Full Message:</div>
                      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-800 whitespace-pre-wrap font-mono">
                        {highlightVariables(
                          touch.channel === 'email' ? touch.emailBody : touch.linkedInMessage || ''
                        )}
                      </div>

                      {touch.abTestingEnabled && touch.abVariants && (
                        <div className="mt-4">
                          <div className="text-xs text-gray-500 mb-2">A/B Test Variants:</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 p-3 rounded">
                              <div className="text-xs font-semibold text-blue-900 mb-1">
                                Variant A
                              </div>
                              <div className="text-xs text-blue-800">
                                {highlightVariables(touch.abVariants.variantA.subjectLine)}
                              </div>
                            </div>
                            <div className="bg-green-50 p-3 rounded">
                              <div className="text-xs font-semibold text-green-900 mb-1">
                                Variant B
                              </div>
                              <div className="text-xs text-green-800">
                                {highlightVariables(touch.abVariants.variantB.subjectLine)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Close
          </button>
          {template.id !== 'custom_blank' && (
            <button
              onClick={handleSelect}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Select This Template
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
