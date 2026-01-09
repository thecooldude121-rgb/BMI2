import React, { useState, useEffect } from 'react';
import { X, Settings, Lightbulb, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import {
  enrichmentFieldsConfig,
  calculateEnrichmentCost,
  getSelectedFieldsCount,
  getTotalFieldsCount,
  type EnrichmentField as ConfigField,
} from '../../utils/enrichmentFieldsConfig';

interface EnrichmentField {
  id: string;
  label: string;
  selected: boolean;
  cost: number;
}

interface FieldCategory {
  id: string;
  name: string;
  expanded: boolean;
  fields: EnrichmentField[];
}

interface EnrichmentSettings {
  mode: 'auto' | 'manual';
  frequency: string;
  confidenceThreshold: string;
  dataSourcePriority: string;
  notifications: {
    onComplete: boolean;
    dailySummary: boolean;
    onFailure: boolean;
    lowConfidence: boolean;
  };
}

interface ConfigureEnrichmentFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: EnrichmentSettings, selectedFields: string[]) => void;
}

const ConfigureEnrichmentFieldsModal: React.FC<ConfigureEnrichmentFieldsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [enrichmentMode, setEnrichmentMode] = useState<'auto' | 'manual'>(enrichmentFieldsConfig.mode);
  const [frequency, setFrequency] = useState(enrichmentFieldsConfig.settings.autoEnrichFrequency);
  const [confidenceThreshold, setConfidenceThreshold] = useState(String(enrichmentFieldsConfig.settings.confidenceThreshold));
  const [dataSourcePriority, setDataSourcePriority] = useState(enrichmentFieldsConfig.settings.dataSourcePriority);
  const [notifications, setNotifications] = useState({
    onComplete: enrichmentFieldsConfig.settings.notifications.enrichmentComplete,
    dailySummary: enrichmentFieldsConfig.settings.notifications.dailySummary,
    onFailure: enrichmentFieldsConfig.settings.notifications.enrichmentFailures,
    lowConfidence: enrichmentFieldsConfig.settings.notifications.lowConfidenceFields,
  });

  const [categories, setCategories] = useState<FieldCategory[]>([
    {
      id: enrichmentFieldsConfig.fieldCategories.contactInfo.id,
      name: enrichmentFieldsConfig.fieldCategories.contactInfo.label,
      expanded: enrichmentFieldsConfig.fieldCategories.contactInfo.expanded,
      fields: enrichmentFieldsConfig.fieldCategories.contactInfo.fields.map(f => ({ ...f })),
    },
    {
      id: enrichmentFieldsConfig.fieldCategories.companyInfo.id,
      name: enrichmentFieldsConfig.fieldCategories.companyInfo.label,
      expanded: enrichmentFieldsConfig.fieldCategories.companyInfo.expanded,
      fields: enrichmentFieldsConfig.fieldCategories.companyInfo.fields.map(f => ({ ...f })),
    },
    {
      id: enrichmentFieldsConfig.fieldCategories.professionalDetails.id,
      name: enrichmentFieldsConfig.fieldCategories.professionalDetails.label,
      expanded: enrichmentFieldsConfig.fieldCategories.professionalDetails.expanded,
      fields: enrichmentFieldsConfig.fieldCategories.professionalDetails.fields.map(f => ({ ...f })),
    },
  ]);

  const toggleCategory = (categoryId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
      )
    );
  };

  const toggleField = (categoryId: string, fieldId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              fields: cat.fields.map(field =>
                field.id === fieldId ? { ...field, selected: !field.selected } : field
              ),
            }
          : cat
      )
    );
  };

  const selectAllCategory = (categoryId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              fields: cat.fields.map(field => ({ ...field, selected: true })),
            }
          : cat
      )
    );
  };

  const getTotalFields = () => {
    return categories.reduce((sum, cat) => sum + cat.fields.length, 0);
  };

  const getSelectedFieldsCount = () => {
    if (enrichmentMode === 'auto') return getTotalFields();
    return categories.reduce(
      (sum, cat) => sum + cat.fields.filter(f => f.selected).length,
      0
    );
  };

  const calculateCost = () => {
    const config = {
      ...enrichmentFieldsConfig,
      mode: enrichmentMode,
      fieldCategories: {
        contactInfo: { ...enrichmentFieldsConfig.fieldCategories.contactInfo, fields: categories[0].fields },
        companyInfo: { ...enrichmentFieldsConfig.fieldCategories.companyInfo, fields: categories[1].fields },
        professionalDetails: { ...enrichmentFieldsConfig.fieldCategories.professionalDetails, fields: categories[2].fields },
      },
      settings: {
        ...enrichmentFieldsConfig.settings,
        dataSourcePriority,
      },
    };

    const costs = calculateEnrichmentCost(config, dataSourcePriority);

    return {
      apollo: costs.apollo.toFixed(2),
      zoomInfo: costs.zoomInfo.toFixed(2),
      total: costs.total.toFixed(2),
      monthly: costs.monthly.toFixed(2),
    };
  };

  const handleSave = () => {
    const selectedFields = categories.flatMap(cat =>
      cat.fields.filter(f => f.selected).map(f => f.id)
    );

    const settings: EnrichmentSettings = {
      mode: enrichmentMode,
      frequency,
      confidenceThreshold,
      dataSourcePriority,
      notifications,
    };

    onSave(settings, selectedFields);
    onClose();
  };

  const handleReset = () => {
    setEnrichmentMode(enrichmentFieldsConfig.mode);
    setFrequency(enrichmentFieldsConfig.settings.autoEnrichFrequency);
    setConfidenceThreshold(String(enrichmentFieldsConfig.settings.confidenceThreshold));
    setDataSourcePriority(enrichmentFieldsConfig.settings.dataSourcePriority);
    setNotifications({
      onComplete: enrichmentFieldsConfig.settings.notifications.enrichmentComplete,
      dailySummary: enrichmentFieldsConfig.settings.notifications.dailySummary,
      onFailure: enrichmentFieldsConfig.settings.notifications.enrichmentFailures,
      lowConfidence: enrichmentFieldsConfig.settings.notifications.lowConfidenceFields,
    });
    setCategories([
      {
        id: enrichmentFieldsConfig.fieldCategories.contactInfo.id,
        name: enrichmentFieldsConfig.fieldCategories.contactInfo.label,
        expanded: enrichmentFieldsConfig.fieldCategories.contactInfo.expanded,
        fields: enrichmentFieldsConfig.fieldCategories.contactInfo.fields.map(f => ({ ...f })),
      },
      {
        id: enrichmentFieldsConfig.fieldCategories.companyInfo.id,
        name: enrichmentFieldsConfig.fieldCategories.companyInfo.label,
        expanded: enrichmentFieldsConfig.fieldCategories.companyInfo.expanded,
        fields: enrichmentFieldsConfig.fieldCategories.companyInfo.fields.map(f => ({ ...f })),
      },
      {
        id: enrichmentFieldsConfig.fieldCategories.professionalDetails.id,
        name: enrichmentFieldsConfig.fieldCategories.professionalDetails.label,
        expanded: enrichmentFieldsConfig.fieldCategories.professionalDetails.expanded,
        fields: enrichmentFieldsConfig.fieldCategories.professionalDetails.fields.map(f => ({ ...f })),
      },
    ]);
  };

  const costs = calculateCost();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configure Enrichment Fields</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Enrichment Mode:
            </label>
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={enrichmentMode === 'auto'}
                  onChange={() => setEnrichmentMode('auto')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Auto-enrich all fields (Recommended)</div>
                  <div className="text-sm text-gray-600">Automatically enrich all available data fields</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={enrichmentMode === 'manual'}
                  onChange={() => setEnrichmentMode('manual')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Manual field selection</div>
                  <div className="text-sm text-gray-600">Choose specific fields to enrich</div>
                </div>
              </label>
            </div>
          </div>

          {enrichmentMode === 'manual' && (
            <div>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <div className="font-medium text-gray-900">SELECT FIELDS TO ENRICH:</div>
                </div>
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {categories.map(category => (
                    <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {category.expanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          {category.name} ({category.fields.length} fields)
                        </button>
                        {category.expanded && (
                          <button
                            onClick={() => selectAllCategory(category.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Select All
                          </button>
                        )}
                      </div>
                      {category.expanded && (
                        <div className="p-3 space-y-2 bg-white">
                          {category.fields.map(field => (
                            <label
                              key={field.id}
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={field.selected}
                                onChange={() => toggleField(category.id, field.id)}
                                className="text-blue-600 focus:ring-blue-500 rounded"
                              />
                              <span className="text-sm text-gray-700">{field.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="text-sm text-gray-600 font-medium pt-2">
                    Selected: {getSelectedFieldsCount()} of {getTotalFields()} fields
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-3">
              <div className="flex items-center gap-2 text-blue-900 font-medium">
                <Settings className="w-4 h-4" />
                ENRICHMENT SETTINGS
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Enrich Frequency:
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {enrichmentFieldsConfig.frequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {enrichmentFieldsConfig.frequencyOptions.find(opt => opt.value === frequency)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confidence Threshold:
                </label>
                <select
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {enrichmentFieldsConfig.confidenceThresholdOptions.map((option) => (
                    <option key={option.value} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {enrichmentFieldsConfig.confidenceThresholdOptions.find(opt => String(opt.value) === confidenceThreshold)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Data Source Priority:
                </label>
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  {enrichmentFieldsConfig.dataSourcePriorityOptions.map((option) => (
                    <label key={option.value} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        checked={dataSourcePriority === option.value}
                        onChange={() => setDataSourcePriority(option.value)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Notifications:
                </label>
                <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.onComplete}
                      onChange={(e) =>
                        setNotifications({ ...notifications, onComplete: e.target.checked })
                      }
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="text-sm text-gray-700">Notify me when enrichment completes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.dailySummary}
                      onChange={(e) =>
                        setNotifications({ ...notifications, dailySummary: e.target.checked })
                      }
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="text-sm text-gray-700">Send daily enrichment summary</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.onFailure}
                      onChange={(e) =>
                        setNotifications({ ...notifications, onFailure: e.target.checked })
                      }
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="text-sm text-gray-700">Alert on enrichment failures</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.lowConfidence}
                      onChange={(e) =>
                        setNotifications({ ...notifications, lowConfidence: e.target.checked })
                      }
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="text-sm text-gray-700">Notify on low confidence fields</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900 mb-1">PRO TIP</div>
                <p className="text-sm text-blue-800">
                  Auto-enriching all fields gives the most complete data. Manual selection is useful
                  when you want to save API costs or only need specific information.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-green-900 mb-2">ESTIMATED COST</div>
                <div className="space-y-2 text-sm">
                  <div className="text-green-800">
                    <div className="font-medium mb-1">Current settings:</div>
                    <div className="ml-2 space-y-0.5 text-xs">
                      <div>• Fields to enrich: {getSelectedFieldsCount()} of {getTotalFields()}</div>
                      <div>
                        • Frequency:{' '}
                        {enrichmentFieldsConfig.frequencyOptions.find(opt => opt.value === frequency)?.label || frequency}
                      </div>
                    </div>
                  </div>
                  <div className="text-green-800">
                    <div className="font-medium mb-1">Estimated API costs:</div>
                    <div className="ml-2 space-y-0.5 text-xs">
                      <div>• Apollo.io: ~${costs.apollo} per enrichment</div>
                      <div>• ZoomInfo: ~${costs.zoomInfo} per enrichment</div>
                      <div className="font-medium text-green-900">• Total: ~${costs.total} per lead enrichment</div>
                    </div>
                  </div>
                  <div className="text-green-800 bg-green-100 rounded p-2 mt-2">
                    <div className="font-medium">Monthly estimate (100 leads):</div>
                    <div className="text-base font-semibold text-green-900">
                      100 leads × ${costs.total} = ${costs.monthly}/month
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigureEnrichmentFieldsModal;
