import React, { useState } from 'react';
import {
  ChevronRight, ChevronLeft, Check, X, Plus, Trash2,
  Users, Database, Filter, Calendar, AlertCircle, Info
} from 'lucide-react';

interface SharingRule {
  id?: string;
  name: string;
  description: string;
  module: string;
  logicOperator: 'AND' | 'OR';
  conditions: RuleCondition[];
  targetType: 'role' | 'group' | 'user';
  targetId: string;
  accessLevel: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
  expiresAt: string;
}

interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface SharingRuleBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: SharingRule) => void;
  existingRule?: SharingRule;
}

export const SharingRuleBuilder: React.FC<SharingRuleBuilderProps> = ({
  isOpen,
  onClose,
  onSave,
  existingRule
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [rule, setRule] = useState<SharingRule>(existingRule || {
    name: '',
    description: '',
    module: '',
    logicOperator: 'AND',
    conditions: [],
    targetType: 'role',
    targetId: '',
    accessLevel: { read: true, write: false, delete: false },
    expiresAt: ''
  });

  const [errors, setErrors] = useState<string[]>([]);

  const modules = [
    { id: 'leads', name: 'Leads' },
    { id: 'deals', name: 'Deals' },
    { id: 'contacts', name: 'Contacts' },
    { id: 'accounts', name: 'Accounts' }
  ];

  const fieldOperators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' }
  ];

  const steps = [
    { number: 1, name: 'Module', icon: Database },
    { number: 2, name: 'Conditions', icon: Filter },
    { number: 3, name: 'Target', icon: Users },
    { number: 4, name: 'Access', icon: Check },
    { number: 5, name: 'Review', icon: Info }
  ];

  const addCondition = () => {
    setRule({
      ...rule,
      conditions: [
        ...rule.conditions,
        { id: Date.now().toString(), field: '', operator: 'equals', value: '' }
      ]
    });
  };

  const removeCondition = (id: string) => {
    setRule({
      ...rule,
      conditions: rule.conditions.filter(c => c.id !== id)
    });
  };

  const updateCondition = (id: string, field: keyof RuleCondition, value: string) => {
    setRule({
      ...rule,
      conditions: rule.conditions.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      )
    });
  };

  const validateStep = () => {
    const newErrors: string[] = [];

    switch (currentStep) {
      case 1:
        if (!rule.name.trim()) newErrors.push('Rule name is required');
        if (!rule.module) newErrors.push('Module selection is required');
        break;
      case 2:
        if (rule.conditions.length === 0) newErrors.push('At least one condition is required');
        rule.conditions.forEach((c, i) => {
          if (!c.field) newErrors.push(`Condition ${i + 1}: Field is required`);
          if (!c.value) newErrors.push(`Condition ${i + 1}: Value is required`);
        });
        break;
      case 3:
        if (!rule.targetId) newErrors.push('Target selection is required');
        break;
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(Math.min(5, currentStep + 1));
    }
  };

  const prevStep = () => {
    setErrors([]);
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const handleSave = () => {
    if (validateStep()) {
      onSave(rule);
      onClose();
    }
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={rule.name}
                onChange={(e) => setRule({ ...rule, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Regional Sales Access"
                aria-required="true"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={rule.description}
                onChange={(e) => setRule({ ...rule, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe the purpose of this rule"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Module <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => setRule({ ...rule, module: module.id })}
                    className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      rule.module === module.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    aria-pressed={rule.module === module.id}
                  >
                    <Database className="h-6 w-6 mb-2 text-blue-600" />
                    <p className="font-semibold text-gray-900">{module.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Rule Conditions</h3>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Logic:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setRule({ ...rule, logicOperator: 'AND' })}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      rule.logicOperator === 'AND'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    aria-pressed={rule.logicOperator === 'AND'}
                  >
                    AND
                  </button>
                  <button
                    onClick={() => setRule({ ...rule, logicOperator: 'OR' })}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      rule.logicOperator === 'OR'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    aria-pressed={rule.logicOperator === 'OR'}
                  >
                    OR
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {rule.conditions.map((condition, index) => (
                <div key={condition.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full mt-2">
                      {index + 1}
                    </span>
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Field</label>
                        <input
                          type="text"
                          value={condition.field}
                          onChange={(e) => updateCondition(condition.id, 'field', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Field name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Operator</label>
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {fieldOperators.map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                        <input
                          type="text"
                          value={condition.value}
                          onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Value"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeCondition(condition.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 mt-6"
                      aria-label="Remove condition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addCondition}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5" />
              <span>Add Condition</span>
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Target Type</label>
              <div className="grid grid-cols-3 gap-3">
                {['role', 'group', 'user'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setRule({ ...rule, targetType: type as any, targetId: '' })}
                    className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      rule.targetType === type
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    aria-pressed={rule.targetType === type}
                  >
                    <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="font-semibold text-gray-900 capitalize">{type}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select {rule.targetType.charAt(0).toUpperCase() + rule.targetType.slice(1)} <span className="text-red-500">*</span>
              </label>
              <select
                value={rule.targetId}
                onChange={(e) => setRule({ ...rule, targetId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-required="true"
              >
                <option value="">Select {rule.targetType}...</option>
                <option value="1">Sample {rule.targetType} 1</option>
                <option value="2">Sample {rule.targetType} 2</option>
                <option value="3">Sample {rule.targetType} 3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date (Optional)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={rule.expiresAt}
                  onChange={(e) => setRule({ ...rule, expiresAt: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Leave empty for no expiration</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Access Level Permissions</h3>

            <div className="space-y-3">
              {Object.keys(rule.accessLevel).map((key) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      rule.accessLevel[key as keyof typeof rule.accessLevel] ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">{key}</p>
                      <p className="text-sm text-gray-600">
                        {key === 'read' && 'View and access data'}
                        {key === 'write' && 'Create and modify data'}
                        {key === 'delete' && 'Remove data permanently'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={rule.accessLevel[key as keyof typeof rule.accessLevel]}
                    onChange={(e) => setRule({
                      ...rule,
                      accessLevel: { ...rule.accessLevel, [key]: e.target.checked }
                    })}
                    className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
                  />
                </label>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review & Confirm</h3>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Rule Name</p>
                <p className="text-lg font-semibold text-gray-900">{rule.name}</p>
              </div>

              {rule.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900">{rule.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Module</p>
                  <span className="inline-flex items-center px-3 py-1 bg-white rounded-full text-sm font-medium text-blue-600 border border-blue-200">
                    {modules.find(m => m.id === rule.module)?.name}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Target</p>
                  <span className="inline-flex items-center px-3 py-1 bg-white rounded-full text-sm font-medium text-green-600 border border-green-200 capitalize">
                    {rule.targetType}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Conditions ({rule.logicOperator})</p>
                <div className="space-y-2">
                  {rule.conditions.map((condition, index) => (
                    <div key={condition.id} className="bg-white rounded-lg p-3 text-sm">
                      <span className="font-medium">{condition.field}</span>
                      {' '}<span className="text-gray-600">{condition.operator}</span>{' '}
                      <span className="font-medium text-blue-600">{condition.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Access Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(rule.accessLevel).filter(([, v]) => v).map(([key]) => (
                    <span
                      key={key}
                      className="inline-flex items-center px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-900 border border-gray-200 capitalize"
                    >
                      <Check className="h-3 w-3 mr-1 text-green-600" />
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sharing-rule-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 id="sharing-rule-title" className="text-2xl font-bold text-gray-900">
              Sharing Rule Builder
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
              aria-label="Close builder"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentStep === step.number
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : currentStep > step.number
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step.number ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    currentStep === step.number ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                    currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4" role="alert">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900">Validation Errors</h4>
                <ul className="mt-2 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700">• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {renderStepContent()}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="text-sm text-gray-600">
            Step {currentStep} of {steps.length}
          </div>

          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <Check className="h-4 w-4" />
              <span>Finish</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
