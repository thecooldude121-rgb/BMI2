import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { 
  X, Save, ChevronRight, ChevronDown, User, Building, DollarSign, 
  Calendar, Phone, Mail, Video, FileText, Paperclip, Zap, Lightbulb,
  Check, AlertCircle, ArrowLeft, ArrowRight, Sparkles, Plus, Search,
  Clock, Target, Globe, Briefcase, CreditCard, Settings, Users, Bot
} from 'lucide-react';
import { Deal, DealFormData, ValidationErrors } from '../../types/deal';
import DealBasicInfo from './DealBasicInfo';
import DealFinancialDetails from './DealFinancialDetails';
import DealActivityPlanning from './DealActivityPlanning';
import DealSummary from './DealSummary';

interface CreateDealWizardProps {
  onClose?: () => void;
  onSave?: (dealData: Partial<Deal>) => Promise<void>;
  existingDeal?: Partial<Deal>;
}

type WizardStep = 'ownership' | 'basic' | 'financial' | 'activities' | 'attachments';

const CreateDealWizard: React.FC<CreateDealWizardProps> = ({
  onClose,
  onSave,
  existingDeal
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addDeal } = useData();
  
  // Default handlers if not provided
  const handleClose = onClose || (() => navigate('/crm/deals'));
  const saveDealFunction = onSave || (async (dealData: Partial<Deal>) => {
    try {
      console.log('Creating deal with data:', dealData);
      
      // Convert Deal format to the format expected by addDeal
      const dealForContext = {
        title: dealData.name || 'Untitled Deal',
        name: dealData.name || 'Untitled Deal',
        leadId: dealData.contactId || '',
        value: dealData.amount || 0,
        stage: dealData.stageId as 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost' || 'qualification',
        probability: dealData.probability || 10,
        expectedCloseDate: dealData.closingDate || '',
        assignedTo: dealData.ownerId || '1',
        notes: dealData.description || ''
      };
      
      console.log('Converted deal data:', dealForContext);
      addDeal(dealForContext);
      
      // Show success message
      console.log('Deal created successfully!');
      
      // Clear draft from localStorage
      localStorage.removeItem('dealDraft');
      
      // Navigate back to deals page
      setTimeout(() => {
        navigate('/crm/deals');
      }, 100);
    } catch (error) {
      console.error('Failed to create deal:', error);
      setSaveError('Failed to create deal. Please try again.');
    }
  });
  const [currentStep, setCurrentStep] = useState<WizardStep>('ownership');
  const [formData, setFormData] = useState<DealFormData>({
    // Ownership & Classification
    ownerId: '1', // Default to current user
    dealType: 'new-business',
    country: 'US',
    
    // Basic Information
    name: '',
    pipelineId: 'default-pipeline',
    accountId: '',
    contactId: '',
    amount: 0,
    currency: 'USD',
    closingDate: '',
    stageId: 'qualification',
    probability: 10,
    
    // Financial Details
    platformFee: 0,
    customFee: 0,
    licenseFee: 0,
    onboardingFee: 0,
    
    // Products
    products: [],
    
    // Additional
    description: '',
    tags: [],
    nextSteps: '',
    plannedActivities: []
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [saveError, setSaveError] = useState<string>('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['ownership']));

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft();
    }, 30000);
    return () => clearInterval(interval);
  }, [formData]);

  // Load draft from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('dealDraft');
    if (savedDraft && !existingDeal) {
      try {
        const draftData = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...draftData }));
        setIsDraftSaved(true);
      } catch (error) {
        console.error('Failed to load draft:', error);
        localStorage.removeItem('dealDraft');
      }
    }
  }, [existingDeal]);
  // Load existing deal data if editing
  useEffect(() => {
    if (existingDeal) {
      setFormData(prev => ({ ...prev, ...existingDeal }));
    }
  }, [existingDeal]);

  // Pre-fill contact info from URL params (from post-save action)
  useEffect(() => {
    const contactEmail = searchParams.get('contact');
    const contactName = searchParams.get('contactName');
    const contactId = searchParams.get('contactId');
    const company = searchParams.get('company');

    if (contactEmail) {
      console.log('🎯 Pre-filling deal with contact:', contactEmail);
      setFormData(prev => ({
        ...prev,
        contactId: contactId || contactEmail,
        accountId: company || '',
        name: contactName ? `${contactName} - Deal` : 'New Deal'
      }));
    }
  }, [searchParams]);

  // Listen for create deal events from summary panel
  useEffect(() => {
    const handleCreateDeal = (event: CustomEvent) => {
      console.log('CreateDealWizard: Received createDeal event');
      handleWizardSubmit();
    };
    
    window.addEventListener('createDeal', handleCreateDeal as EventListener);
    return () => window.removeEventListener('createDeal', handleCreateDeal as EventListener);
  }, [formData]);
  const steps: Array<{ id: WizardStep; title: string; icon: React.ElementType; required: boolean; }> = [
    { id: 'ownership', title: 'Ownership & Classification', icon: User, required: true },
    { id: 'basic', title: 'Basic Information', icon: Briefcase, required: true },
    { id: 'financial', title: 'Financial Details', icon: DollarSign, required: true },
    { id: 'activities', title: 'Activity Planning', icon: Target, required: false },
    { id: 'attachments', title: 'Attachments', icon: Paperclip, required: false }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const saveDraft = useCallback(async () => {
    try {
      // Only save if there's meaningful data
      if (!formData.name && formData.amount === 0) {
        return;
      }
      
      localStorage.setItem('dealDraft', JSON.stringify(formData));
      setIsDraftSaved(true);
      setSaveError('');
      setTimeout(() => setIsDraftSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save draft:', error);
      setSaveError('Failed to save draft');
      setTimeout(() => setSaveError(''), 3000);
    }
  }, [formData]);

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: ValidationErrors = {};

    switch (step) {
      case 'ownership':
        if (!formData.ownerId) newErrors.ownerId = '⚠️ Deal owner is required';
        if (!formData.dealType) newErrors.dealType = '⚠️ Deal type is required';
        if (!formData.country) newErrors.country = '⚠️ Country is required';
        break;
      case 'basic':
        if (!formData.name) newErrors.name = '⚠️ Deal name is required';
        if (!formData.pipelineId) newErrors.pipelineId = '⚠️ Pipeline is required';
        if (formData.amount <= 0) newErrors.amount = '⚠️ Amount must be greater than 0';
        break;
      case 'financial':
        if (formData.amount !== (formData.platformFee + formData.customFee + formData.licenseFee + formData.onboardingFee)) {
          newErrors.amount = '⚠️ Total fees must equal deal amount';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
      setCurrentStep(steps[nextIndex].id);
      setExpandedSections(new Set([steps[nextIndex].id]));
    }
  };

  const prevStep = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(steps[prevIndex].id);
    setExpandedSections(new Set([steps[prevIndex].id]));
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleWizardSubmit = async () => {
    setSaveError('');
    
    // Validate all required steps
    const requiredSteps = steps.filter(step => step.required).map(step => step.id);
    const isValid = requiredSteps.every(step => validateStep(step));

    if (!isValid) {
      setSaveError('Please complete all required fields before saving');
      return;
    }

    setIsLoading(true);
    try {
      await saveDealFunction(formData);
    } catch (error) {
      console.error('Failed to save deal:', error);
      setSaveError('Failed to create deal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAISuggestions = () => {
    // AI-powered suggestions based on deal data
    const suggestions = [];
    
    if (formData.dealType === 'new-business' && !formData.plannedActivities.length) {
      suggestions.push('Schedule discovery call within 2 days');
    }
    
    if (formData.amount > 50000 && formData.stageId === 'qualification') {
      suggestions.push('Consider involving senior stakeholder early');
    }
    
    return suggestions;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-hidden z-50 backdrop-blur-sm">
      <div className="h-full flex">
        {/* Main Form Area */}
        <div className="flex-1 bg-white overflow-y-auto">
          {/* Enhanced Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10 shadow-sm">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-4">
                <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Sparkles className="h-6 w-6 mr-3 text-purple-600" />
                    {existingDeal ? 'Edit Deal' : 'Create New Deal'}
                  </h1>
                  <p className="text-gray-600 text-sm">Build your next revenue opportunity</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {isDraftSaved && (
                  <div className="flex items-center space-x-2 text-green-600 animate-fade-in">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Draft saved</span>
                  </div>
                )}
                
                {saveError && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{saveError}</span>
                  </div>
                )}
                
                <button
                  onClick={saveDraft}
                  disabled={!formData.name && formData.amount === 0}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </button>
                
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
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 animate-slide-down">
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
                    Help me fill this deal
                  </button>
                </div>
              </div>
            )}

            {/* Form Sections */}
            {currentStep === 'ownership' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Ownership & Classification</h2>
                    <p className="text-gray-600">Define who owns this deal and classify it for better tracking</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Deal Owner *
                    </label>
                    <select
                      value={formData.ownerId}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerId: e.target.value }))}
                      className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.ownerId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select owner...</option>
                      <option value="user1">John Smith (Sales)</option>
                      <option value="user2">Sarah Johnson (Sales Manager)</option>
                      <option value="user3">Mike Chen (Account Executive)</option>
                    </select>
                    {errors.ownerId && <p className="text-sm text-red-600">{errors.ownerId}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Deal Type *
                    </label>
                    <select
                      value={formData.dealType}
                      onChange={(e) => setFormData(prev => ({ ...prev, dealType: e.target.value }))}
                      className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.dealType ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="new-business">New Business</option>
                      <option value="existing-business">Existing Business</option>
                      <option value="upsell">Upsell</option>
                      <option value="renewal">Renewal</option>
                      <option value="cross-sell">Cross-sell</option>
                    </select>
                    {errors.dealType && <p className="text-sm text-red-600">{errors.dealType}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Country *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      className={`w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.country ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                    </select>
                    {errors.country && <p className="text-sm text-red-600">{errors.country}</p>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'basic' && (
              <DealBasicInfo 
                formData={formData}
                setFormData={setFormData}
                errors={errors}
              />
            )}

            {currentStep === 'financial' && (
              <DealFinancialDetails
                formData={formData}
                setFormData={setFormData}
                errors={errors}
              />
            )}

            {currentStep === 'activities' && (
              <DealActivityPlanning
                formData={formData}
                setFormData={setFormData}
              />
            )}

            {currentStep === 'attachments' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Paperclip className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Attachments</h2>
                    <p className="text-gray-600">Upload proposals, contracts, and supporting documents</p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
                  <Paperclip className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Drop files here</h3>
                  <p className="text-gray-600 mb-4">or click to browse</p>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
                    Choose Files
                  </button>
                </div>
              </div>
            )}
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
                <button
                  onClick={handleWizardSubmit}
                  disabled={isLoading}
                  className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Create Deal
                </button>
                
                {currentStepIndex < steps.length - 1 && (
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

        {/* Sticky Summary Sidebar */}
        <DealSummary 
          formData={formData}
          onClose={onClose}
          isDraftSaved={isDraftSaved}
        />
      </div>
    </div>
  );
};

export default CreateDealWizard;