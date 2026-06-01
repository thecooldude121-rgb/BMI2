import React, { useState, useEffect } from 'react';
import { 
  X, Save, User, Building, DollarSign, Calendar, Target, 
  ArrowRight, ArrowLeft, Check, AlertCircle, Search, Plus,
  FileText, Tag, Globe, Briefcase, CreditCard, Settings,
  Zap, Lightbulb, Bot, Sparkles, Info
} from 'lucide-react';
import { Deal, Pipeline } from '../../types/deals';

interface CreateDealFormProps {
  deal?: Deal | null;
  pipelines: Pipeline[];
  accounts: any[];
  contacts: any[];
  users: any[];
  onSave: (dealData: Partial<Deal>) => void;
  onClose: () => void;
}

type FormStep = 'basic' | 'revenue' | 'details' | 'links' | 'review';

const CreateDealForm: React.FC<CreateDealFormProps> = ({
  deal,
  pipelines,
  accounts,
  contacts,
  users,
  onSave,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [formData, setFormData] = useState<Partial<Deal>>({
    name: '',
    accountId: '',
    contactId: '',
    ownerId: '',
    pipelineId: pipelines[0]?.id || '',
    stageId: pipelines[0]?.stages[0]?.id || '',
    amount: 0,
    currency: 'USD',
    probability: pipelines[0]?.stages[0]?.probability || 10,
    expectedCloseDate: '',
    dealType: 'new-business',
    leadSource: '',
    description: '',
    nextSteps: '',
    notes: '',
    tags: [],
    priority: 'medium',
    health: 'healthy',
    customFields: {}
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Load existing deal data if editing
  useEffect(() => {
    if (deal) {
      setFormData(deal);
    }
  }, [deal]);

  const steps: Array<{ id: FormStep; title: string; icon: React.ElementType; required: boolean }> = [
    { id: 'basic', title: 'Basic Information', icon: Briefcase, required: true },
    { id: 'revenue', title: 'Revenue Details', icon: DollarSign, required: true },
    { id: 'details', title: 'Deal Information', icon: FileText, required: false },
    { id: 'links', title: 'Links & Attachments', icon: Target, required: false },
    { id: 'review', title: 'Review & Save', icon: Check, required: false }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const validateStep = (step: FormStep): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 'basic':
        if (!formData.name) newErrors.name = '⚠️ Deal name is required';
        if (!formData.ownerId) newErrors.ownerId = '⚠️ Deal owner is required';
        if (!formData.pipelineId) newErrors.pipelineId = '⚠️ Pipeline is required';
        break;
      case 'revenue':
        if (!formData.amount || formData.amount <= 0) newErrors.amount = '⚠️ Amount must be greater than 0';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(steps[prevIndex].id);
  };

  const handleSubmit = async () => {
    if (!validateStep('basic') || !validateStep('revenue')) {
      setCurrentStep('basic');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      setErrors({ submit: 'Failed to save deal. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-update probability when stage changes
    if (field === 'stageId') {
      const pipeline = pipelines.find(p => p.id === formData.pipelineId);
      const stage = pipeline?.stages.find(s => s.id === value);
      if (stage) {
        setFormData(prev => ({ ...prev, probability: stage.probability }));
      }
    }

    // Clear errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const getAISuggestions = () => {
    const suggestions = [];
    
    if (formData.dealType === 'new-business' && !formData.expectedCloseDate) {
      suggestions.push('Set expected close date for better pipeline forecasting');
    }
    
    if (formData.amount && formData.amount > 100000 && formData.priority === 'medium') {
      suggestions.push('Consider marking high-value deals as high priority');
    }
    
    if (!formData.nextSteps) {
      suggestions.push('Add next steps to keep the deal moving forward');
    }
    
    return suggestions;
  };

  const renderBasicStep = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Briefcase className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
          <p className="text-gray-600">Essential details about your deal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deal Name *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter a descriptive deal name..."
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account (Company)
          </label>
          <select
            value={formData.accountId || ''}
            onChange={(e) => handleFieldChange('accountId', e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Account</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Contact
          </label>
          <select
            value={formData.contactId || ''}
            onChange={(e) => handleFieldChange('contactId', e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Contact</option>
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>{contact.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deal Owner *
          </label>
          <select
            value={formData.ownerId || ''}
            onChange={(e) => handleFieldChange('ownerId', e.target.value)}
            className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.ownerId ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">Select Owner</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
          {errors.ownerId && <p className="text-sm text-red-600 mt-1">{errors.ownerId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pipeline *
          </label>
          <select
            value={formData.pipelineId || ''}
            onChange={(e) => {
              const pipeline = pipelines.find(p => p.id === e.target.value);
              handleFieldChange('pipelineId', e.target.value);
              if (pipeline) {
                handleFieldChange('stageId', pipeline.stages[0]?.id || '');
              }
            }}
            className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.pipelineId ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">Select Pipeline</option>
            {pipelines.map(pipeline => (
              <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
            ))}
          </select>
          {errors.pipelineId && <p className="text-sm text-red-600 mt-1">{errors.pipelineId}</p>}
        </div>
      </div>
    </div>
  );

  const renderRevenueStep = () => {
    const selectedPipeline = pipelines.find(p => p.id === formData.pipelineId);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-green-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Revenue Details</h2>
            <p className="text-gray-600">Financial information and forecasting</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deal Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => handleFieldChange('amount', Number(e.target.value))}
                className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.currency || 'USD'}
              onChange={(e) => handleFieldChange('currency', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stage
            </label>
            <select
              value={formData.stageId || ''}
              onChange={(e) => handleFieldChange('stageId', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {selectedPipeline?.stages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Win Probability: {formData.probability}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.probability || 0}
              onChange={(e) => handleFieldChange('probability', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Close Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={formData.expectedCloseDate || ''}
                onChange={(e) => handleFieldChange('expectedCloseDate', e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deal Type
            </label>
            <select
              value={formData.dealType || 'new-business'}
              onChange={(e) => handleFieldChange('dealType', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="new-business">New Business</option>
              <option value="existing-business">Existing Business</option>
              <option value="upsell">Upsell</option>
              <option value="renewal">Renewal</option>
            </select>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Deal Value</p>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: formData.currency || 'USD'
                }).format(formData.amount || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Weighted Value ({formData.probability}%)</p>
              <p className="text-xl font-semibold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: formData.currency || 'USD'
                }).format((formData.amount || 0) * (formData.probability || 0) / 100)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-purple-100 rounded-lg">
          <FileText className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Deal Information</h2>
          <p className="text-gray-600">Additional details and classification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lead Source
          </label>
          <select
            value={formData.leadSource || ''}
            onChange={(e) => handleFieldChange('leadSource', e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Source</option>
            <option value="Website">Website</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Referral">Referral</option>
            <option value="Cold Email">Cold Email</option>
            <option value="Trade Show">Trade Show</option>
            <option value="Social Media">Social Media</option>
            <option value="Advertisement">Advertisement</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={formData.priority || 'medium'}
            onChange={(e) => handleFieldChange('priority', e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            rows={4}
            value={formData.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Describe the deal opportunity, customer needs, and solution..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Next Steps
          </label>
          <textarea
            rows={3}
            value={formData.nextSteps || ''}
            onChange={(e) => handleFieldChange('nextSteps', e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="What are the next actions to move this deal forward?"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags?.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              placeholder="Add tag..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.target as HTMLInputElement;
                  addTag(input.value);
                  input.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                addTag(input.value);
                input.value = '';
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-xl hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLinksStep = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-orange-100 rounded-lg">
          <Target className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Links & Attachments</h2>
          <p className="text-gray-600">Connect related records and upload files</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Records</h3>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-2">Account</h4>
              <p className="text-sm text-gray-600">
                {formData.accountId ? accounts.find(a => a.id === formData.accountId)?.name : 'No account selected'}
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-2">Primary Contact</h4>
              <p className="text-sm text-gray-600">
                {formData.contactId ? contacts.find(c => c.id === formData.contactId)?.name : 'No contact selected'}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Drop files here</h4>
            <p className="text-gray-600 mb-4">or click to browse</p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
              Choose Files
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Internal Notes
        </label>
        <textarea
          rows={4}
          value={formData.notes || ''}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Add internal notes about this deal..."
        />
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-green-100 rounded-lg">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Review & Save</h2>
          <p className="text-gray-600">Review your deal information before saving</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Summary</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Deal Name</label>
                <p className="text-gray-900">{formData.name || 'Untitled Deal'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Account</label>
                <p className="text-gray-900">
                  {formData.accountId ? accounts.find(a => a.id === formData.accountId)?.name : 'No account'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Owner</label>
                <p className="text-gray-900">
                  {formData.ownerId ? users.find(u => u.id === formData.ownerId)?.name : 'No owner'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Pipeline & Stage</label>
                <p className="text-gray-900">
                  {pipelines.find(p => p.id === formData.pipelineId)?.name} • {' '}
                  {pipelines.find(p => p.id === formData.pipelineId)?.stages.find(s => s.id === formData.stageId)?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: formData.currency || 'USD'
                  }).format(formData.amount || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Probability</span>
                <span className="font-semibold text-gray-900">{formData.probability}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weighted Value</span>
                <span className="font-semibold text-green-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: formData.currency || 'USD'
                  }).format((formData.amount || 0) * (formData.probability || 0) / 100)}
                </span>
              </div>
              {formData.expectedCloseDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Close</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(formData.expectedCloseDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {formData.description && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700 leading-relaxed">{formData.description}</p>
            </div>
          )}

          {formData.nextSteps && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
              <p className="text-gray-700 leading-relaxed">{formData.nextSteps}</p>
            </div>
          )}

          {formData.tags && formData.tags.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-hidden z-50 backdrop-blur-sm">
      <div className="h-full flex">
        {/* Main Form Area */}
        <div className="flex-1 bg-white overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Sparkles className="h-6 w-6 mr-3 text-purple-600" />
                    {deal ? 'Edit Deal' : 'Create New Deal'}
                  </h1>
                  <p className="text-gray-600 text-sm">Build your next revenue opportunity</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {errors.submit && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{errors.submit}</span>
                  </div>
                )}
                
                <button
                  onClick={() => setShowAIAssistant(!showAIAssistant)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm hover:from-purple-600 hover:to-purple-700 transition-all"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  AI Assistant
                </button>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">{currentStepIndex + 1} of {steps.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              
              {/* Step Navigation */}
              <div className="flex items-center justify-between mt-4 space-x-2">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = step.id === currentStep;
                  const isCompleted = index < currentStepIndex;
                  const isAccessible = index <= currentStepIndex;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => isAccessible && setCurrentStep(step.id)}
                      disabled={!isAccessible}
                      className={`flex-1 flex items-center justify-center p-3 rounded-xl text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                          : isCompleted
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : isAccessible
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="hidden md:inline">{step.title}</span>
                      <span className="md:hidden">{step.title.split(' ')[0]}</span>
                      {step.required && !isCompleted && !isActive && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-8">
            {/* AI Assistant Panel */}
            {showAIAssistant && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-purple-900 flex items-center">
                    <Bot className="h-5 w-5 mr-2" />
                    AI Deal Assistant
                  </h3>
                  <button onClick={() => setShowAIAssistant(false)} className="text-purple-600 hover:text-purple-800">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {getAISuggestions().map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-purple-200">
                      <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span className="text-sm text-purple-800">{suggestion}</span>
                    </div>
                  ))}
                  <button className="w-full flex items-center justify-center p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Help me optimize this deal
                  </button>
                </div>
              </div>
            )}

            {/* Step Content */}
            {currentStep === 'basic' && renderBasicStep()}
            {currentStep === 'revenue' && renderRevenueStep()}
            {currentStep === 'details' && renderDetailsStep()}
            {currentStep === 'links' && renderLinksStep()}
            {currentStep === 'review' && renderReviewStep()}
          </div>

          {/* Navigation Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="flex items-center px-6 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </button>
              
              <div className="flex items-center space-x-3">
                {currentStep === 'review' ? (
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? (
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {deal ? 'Update Deal' : 'Create Deal'}
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="w-96 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Deal Summary</h3>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Deal Value</h4>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: formData.currency || 'USD'
                }).format(formData.amount || 0)}
              </p>
              {formData.probability && formData.probability > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Weighted: {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: formData.currency || 'USD'
                  }).format((formData.amount || 0) * (formData.probability || 0) / 100)}
                </p>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Key Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Owner</span>
                  <span className="text-gray-900">
                    {formData.ownerId ? users.find(u => u.id === formData.ownerId)?.name : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pipeline</span>
                  <span className="text-gray-900">
                    {formData.pipelineId ? pipelines.find(p => p.id === formData.pipelineId)?.name : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stage</span>
                  <span className="text-gray-900">
                    {formData.stageId ? pipelines.find(p => p.id === formData.pipelineId)?.stages.find(s => s.id === formData.stageId)?.name : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="text-gray-900 capitalize">
                    {formData.dealType?.replace('-', ' ') || 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            {formData.tags && formData.tags.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDealForm;