import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Search, X, Building2, User, Sparkles, CheckCircle2, AlertTriangle, Briefcase, Target, Calendar } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { SmartSearchPanel } from '../../components/Deal/DealForm/SmartSearchPanel';
import { DealFormBasicInfo } from '../../components/Deal/DealForm/DealFormBasicInfo';
import { DealFormAccountContacts } from '../../components/Deal/DealForm/DealFormAccountContacts';
import { DealFormOwnership } from '../../components/Deal/DealForm/DealFormOwnership';
import { DealFormProductDetails } from '../../components/Deal/DealForm/DealFormProductDetails';
import { DealFormDescription } from '../../components/Deal/DealForm/DealFormDescription';
import { DealPreviewPanel } from '../../components/Deal/DealForm/DealPreviewPanel';
import { AIInsightsPanel } from '../../components/Deal/DealForm/AIInsightsPanel';
import { AIRecommendationsPanel } from '../../components/Deal/DealForm/AIRecommendationsPanel';
import { ValidationChecklistPanel } from '../../components/Deal/DealForm/ValidationChecklistPanel';
import { SaveOptionsPanel } from '../../components/Deal/DealForm/SaveOptionsPanel';
import { TipsHelpPanel } from '../../components/Deal/DealForm/TipsHelpPanel';
import { DuplicateCheckPanel } from '../../components/Deal/DealForm/DuplicateCheckPanel';
import { HRMSAdvantageModal } from '../../components/Deal/DealForm/HRMSAdvantageModal';
import { createDeal, updateDeal } from '../../utils/dealsApi';
import { parseAmountInput, convertToBaseCurrency, validateDealValue } from '../../utils/currencyUtils';
import { BASE_CURRENCY_CODE } from '../../config/currencies';
import { generateDealName } from '../../utils/dealNameGenerator';

export const ComprehensiveDealFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    dealName: '',
    dealValue: '',
    currency: 'USD',
    closeDate: '',
    stage: 'prospecting',
    probability: 25,
    accountId: '',
    accountName: '',
    primaryContactId: '',
    primaryContactName: '',
    contactRole: 'Champion',
    additionalContacts: [],
    owner: 'current-user',
    source: '',
    hrmsConnection: null,
    priority: 'Medium',
    tags: [],
    product: '',
    contractTerm: '',
    paymentTerms: '',
    description: '',
    nextSteps: '',
    sourceJourney: null as { type: 'lead' | 'contact' | 'account'; name: string; id: string } | null
  });

  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showSmartSearch, setShowSmartSearch] = useState(true);
  const [duplicateDeals, setDuplicateDeals] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({});
  const [saveOptions, setSaveOptions] = useState({
    viewDeal: true,
    createTask: false,
    sendEmail: false,
    scheduleMeeting: false,
    addAnother: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showHRMSModal, setShowHRMSModal] = useState(false);
  const [hrmsModalData, setHrmsModalData] = useState<any>(null);
  // true = user has manually typed a deal name → never auto-overwrite
  // false = name is empty or was auto-generated → safe to overwrite
  const [dealNameUserEdited, setDealNameUserEdited] = useState(false);

  // Load deal data if editing
  useEffect(() => {
    if (isEditMode && id) {
      loadDealData(id);
    } else {
      // Try to restore from localStorage
      const savedDraft = localStorage.getItem('deal-form-draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setFormData(draft);
          showToast('info', 'Draft restored from previous session');
        } catch (e) {
          console.error('Failed to restore draft', e);
        }
      }
    }
  }, [id, isEditMode]);

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    if (!isEditMode && hasUnsavedChanges) {
      setAutoSaveStatus('saving');
      const timer = setTimeout(() => {
        localStorage.setItem('deal-form-draft', JSON.stringify(formData));
        setAutoSaveStatus('saved');
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [formData, hasUnsavedChanges, isEditMode]);

  // Auto-generate deal name when account, product, or close date changes.
  // Skipped if the user has manually edited the name (dealNameUserEdited === true).
  useEffect(() => {
    if (dealNameUserEdited) return;
    const generated = generateDealName({
      accountName: formData.accountName,
      product: formData.product,
      closeDate: formData.closeDate,
    });
    if (generated && generated !== formData.dealName) {
      setFormData(prev => ({ ...prev, dealName: generated }));
    }
  }, [formData.accountName, formData.product, formData.closeDate, dealNameUserEdited]);

  // Check for duplicates when account/contact changes (debounced)
  useEffect(() => {
    if (formData.accountName && formData.dealValue) {
      const timer = setTimeout(() => {
        checkForDuplicates();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [formData.accountName, formData.dealValue]);

  // Mark as unsaved on any form change
  useEffect(() => {
    if (formData.dealName || formData.dealValue) {
      setHasUnsavedChanges(true);
      setAutoSaveStatus('unsaved');
    }
  }, [formData]);

  const loadDealData = async (dealId: string) => {
    // Mock loading existing deal data - Acme Corp deal
    const mockDeal = {
      dealName: 'Acme Corp - Enterprise Plan',
      dealValue: '50000',
      currency: 'USD',
      closeDate: '2026-03-15',
      stage: 'proposal',
      probability: 67,
      accountId: 'acc-1',
      accountName: 'Acme Corp',
      primaryContactId: 'con-2',
      primaryContactName: 'John Smith',
      contactRole: 'Champion',
      additionalContacts: [],
      owner: 'current-user',
      source: 'lead-gen-apollo',
      hrmsConnection: null,
      priority: 'High',
      tags: ['VIP', 'Enterprise', 'Hot Lead'],
      product: 'Enterprise Plan',
      contractTerm: 'Annual',
      paymentTerms: 'Net 30',
      description: 'Enterprise plan for 75-person SaaS company. Key needs: Automation, integration with Salesforce, reporting dashboards. Budget confirmed at $50K. Timeline: Q1 2026.',
      nextSteps: '1. Send proposal by Dec 10\n2. Schedule demo for stakeholders\n3. Get CEO introduction from John'
    };

    // Set selected account and contact for edit mode
    const mockAccount = {
      id: 'acc-1',
      type: 'account',
      name: 'Acme Corp',
      employees: '75 employees',
      industry: 'SaaS',
      revenue: '$12M revenue',
      primaryContact: 'John Smith (VP Sales)',
      avgDealSize: 50000,
      winRate: 68
    };

    const mockContact = {
      id: 'con-2',
      type: 'contact',
      name: 'John Smith',
      title: 'VP Sales',
      company: 'Acme Corp',
      email: 'john@acme.com',
      phone: '+1 555-0123'
    };

    setFormData(mockDeal as any);
    setSelectedAccount(mockAccount);
    setSelectedContact(mockContact);
    setShowSmartSearch(false);
    showToast('success', 'Loaded deal: Acme Corp - Enterprise Plan');
  };

  const checkForDuplicates = async () => {
    // Mock duplicate check
    const mockDuplicates = [
      {
        id: 'deal-123',
        name: 'Acme Corp - Enterprise',
        value: 50000,
        stage: 'Proposal',
        owner: 'Alex Rodriguez',
        createdDate: 'Nov 15, 2025'
      }
    ];
    // Only show if similar deal exists
    if (formData.accountName.toLowerCase().includes('acme') && formData.dealValue === '50000') {
      setDuplicateDeals(mockDuplicates);
    } else {
      setDuplicateDeals([]);
    }
  };

  const handleAccountSelect = (account: any) => {
    // Check for HRMS connection
    const isHRMS = account.isHRMS || account.name.toLowerCase().includes('techstart');

    if (isHRMS) {
      // Show HRMS modal for warm intro advantage
      setHrmsModalData({
        recruitedPerson: account.recruitedPerson || 'Sarah Lee',
        title: 'CFO',
        company: account.name,
        recruitmentDate: '2024-11-14'
      });
      setShowHRMSModal(true);

      // Store account for later use
      setSelectedAccount(account);
    } else {
      // Non-HRMS account - proceed normally
      processAccountSelection(account, false);
    }
  };

  const processAccountSelection = (account: any, isHRMS: boolean) => {
    setSelectedAccount(account);

    setFormData(prev => ({
      ...prev,
      accountId: account.id,
      accountName: account.name,
      source: isHRMS ? 'hrms' : prev.source,
      hrmsConnection: isHRMS ? {
        recruited: hrmsModalData?.recruitedPerson || account.recruitedPerson || 'Sarah Lee',
        recruitmentDate: hrmsModalData?.recruitmentDate || '2024-11-14'
      } : null,
      priority: isHRMS ? 'High' : prev.priority,
      sourceJourney: {
        type: 'account',
        name: account.name,
        id: account.id
      }
    }));

    // Generate AI suggestions based on account
    const baseWinRate = account.winRate || 68;
    const hrmsBoost = isHRMS ? 15 : 0; // HRMS adds +15% win probability

    const suggestions = {
      dealValue: account.avgDealSize || '50000',
      valueRange: `$${(account.avgDealSize * 0.9 / 1000).toFixed(0)}K - $${(account.avgDealSize * 1.1 / 1000).toFixed(0)}K`,
      closeDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      closeDays: 45,
      probability: Math.min(baseWinRate + hrmsBoost, 100),
      contact: account.primaryContact,
      isHRMS
    };
    setAiSuggestions(suggestions);
    setShowSmartSearch(false);

    if (isHRMS) {
      showToast('success', 'HRMS Advantage activated! Win probability boosted to 75%');
    }
  };

  const handleUseHRMSAdvantage = () => {
    if (selectedAccount) {
      processAccountSelection(selectedAccount, true);
    }
    setShowHRMSModal(false);
  };

  const handleSkipHRMSAdvantage = () => {
    if (selectedAccount) {
      processAccountSelection(selectedAccount, false);
    }
    setShowHRMSModal(false);
  };

  const handleContactSelect = (contact: any) => {
    // Check for HRMS connection on contact
    const isHRMS = contact.isHRMS || contact.source === 'HRMS Connection';

    if (isHRMS) {
      // Show HRMS modal for warm intro advantage
      setHrmsModalData({
        recruitedPerson: contact.name,
        title: contact.title,
        company: contact.company,
        recruitmentDate: '2024-11-14'
      });
      setShowHRMSModal(true);

      // Store contact for later use
      setSelectedContact(contact);
    } else {
      // Non-HRMS contact - proceed normally
      processContactSelection(contact, false);
    }
  };

  const processContactSelection = (contact: any, isHRMS: boolean) => {
    setSelectedContact(contact);

    setFormData(prev => ({
      ...prev,
      primaryContactId: contact.id,
      primaryContactName: contact.name,
      // If no account is linked yet, auto-fill company from the contact so
      // the deal name generator has enough context to fire
      ...(!prev.accountName && contact.company ? { accountName: contact.company } : {}),
      source: isHRMS ? 'hrms' : prev.source,
      hrmsConnection: isHRMS ? {
        recruited: contact.name,
        recruitmentDate: hrmsModalData?.recruitmentDate || '2024-11-14'
      } : prev.hrmsConnection,
      priority: isHRMS ? 'High' : prev.priority,
      sourceJourney: {
        type: 'contact',
        name: contact.name,
        id: contact.id
      }
    }));

    if (isHRMS) {
      showToast('success', 'HRMS Advantage activated! This is a warm intro opportunity');
    }
  };

  const handleApplyAISuggestions = () => {
    if (aiSuggestions) {
      setFormData(prev => ({
        ...prev,
        dealValue: aiSuggestions.dealValue,
        closeDate: aiSuggestions.closeDate,
        probability: aiSuggestions.probability
      }));
      showToast('success', 'Form auto-populated from AI suggestions');
    }
  };

  const handleChangeSelection = () => {
    setSelectedAccount(null);
    setSelectedContact(null);
    setAiSuggestions(null);
    setShowSmartSearch(true);
    setFormData(prev => ({
      ...prev,
      accountId: '',
      accountName: '',
      primaryContactId: '',
      primaryContactName: '',
      source: '',
      hrmsConnection: null
    }));
    showToast('info', 'Selection cleared, search again');
  };

  const handleSkipSmartCreation = () => {
    setShowSmartSearch(false);
    showToast('info', 'Creating deal from scratch');
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmed) return;
    }
    // Clear draft from localStorage
    localStorage.removeItem('deal-form-draft');
    navigate('/crm/deals');
  };

  const handleClearDraft = () => {
    localStorage.removeItem('deal-form-draft');
    showToast('info', 'Draft cleared');
  };

  // Validation functions
  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'dealName':
        if (!value || value.trim().length === 0) return 'Deal name is required';
        if (value.length < 5) return 'Deal name must be at least 5 characters';
        if (value.length > 100) return 'Deal name must not exceed 100 characters';
        return null;

      case 'dealValue':
        return validateDealValue(value?.toString() ?? '', formData.currency || BASE_CURRENCY_CODE);

      case 'closeDate':
        if (!value) return 'Close date is required';
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) return 'Close date cannot be in the past';
        return null;

      case 'accountName':
        if (!value || value.trim().length === 0) return 'Account is required';
        return null;

      case 'primaryContactName':
        if (!value || value.trim().length === 0) return 'Primary contact is required';
        return null;

      case 'owner':
        if (!value) return 'Deal owner is required';
        return null;

      case 'source':
        if (!value) return 'Deal source is required';
        return null;

      default:
        return null;
    }
  };

  const checkFieldWarning = (field: string, value: any): string | null => {
    if (field === 'closeDate' && value) {
      const selectedDate = new Date(value);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (selectedDate > oneYearFromNow) {
        return 'This close date is more than 1 year away. Are you sure?';
      }
    }
    return null;
  };

  // Calculate win probability based on multiple factors
  const calculateWinProbability = (data: any): number => {
    // Base probability from stage
    const stageProbability: Record<string, number> = {
      'prospecting': 20,
      'qualified': 40,
      'proposal': 60,
      'negotiation': 80,
      'closed-won': 100,
      'closed-lost': 0
    };

    let probability = stageProbability[data.stage] || 20;

    // Contact level boost
    if (data.contactRole === 'Decision Maker') probability += 10;
    if (data.contactRole === 'Champion') probability += 15;

    // HRMS connection boost
    if (data.source === 'hrms' || data.hrmsConnection) probability += 15;

    // Sweet-spot check always in USD so it works across all currencies
    const dealValue = parseAmountInput(data.dealValue?.toString() || '0');
    const dealValueUSD = convertToBaseCurrency(isNaN(dealValue) ? 0 : dealValue, data.currency || BASE_CURRENCY_CODE);
    if (dealValueUSD >= 40000 && dealValueUSD <= 60000) probability += 5;

    // Cap at 100%
    return Math.min(probability, 100);
  };

  // Forces a fresh auto-generated name regardless of whether the user had edited it.
  // Called by the "Regenerate" button in DealFormBasicInfo.
  const handleRegenerateDealName = () => {
    setDealNameUserEdited(false);
    const generated = generateDealName({
      accountName: formData.accountName,
      product: formData.product,
      closeDate: formData.closeDate,
    });
    if (generated) {
      setFormData(prev => ({ ...prev, dealName: generated }));
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    // When the user types in the deal name field, lock it from auto-overwriting
    if (field === 'dealName') {
      setDealNameUserEdited(value.length > 0);
    }

    // Strip non-numeric chars but keep one decimal point while user types
    if (field === 'dealValue' && value) {
      const stripped = value.toString().replace(/[^0-9.]/g, '');
      const parts = stripped.split('.');
      value = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : stripped;
    }

    // Update form data
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    // Validate field
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error || ''
    }));

    // Check for warnings
    const warning = checkFieldWarning(field, value);
    setFieldWarnings(prev => ({
      ...prev,
      [field]: warning || ''
    }));

    // Auto-update probability based on multiple factors
    if (['stage', 'contactRole', 'source', 'dealValue', 'hrmsConnection'].includes(field)) {
      const newProbability = calculateWinProbability(newData);
      setFormData(prev => ({ ...prev, probability: newProbability }));
    }
  };

  const validateForm = () => {
    const required = ['dealName', 'dealValue', 'closeDate', 'stage', 'accountName', 'primaryContactName', 'owner', 'source'];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);
    return missing.length === 0;
  };

  const buildPayload = () => {
    const rawValue = parseAmountInput(formData.dealValue?.toString() || '0') || 0;
    const currency = formData.currency || BASE_CURRENCY_CODE;
    const baseAmountUsd = convertToBaseCurrency(rawValue, currency);
    return {
      name: formData.dealName,
      value: rawValue,
      currency,
      base_amount_usd: baseAmountUsd,
      stage: formData.stage,
      probability: formData.probability,
      expected_close_date: formData.closeDate || undefined,
      assigned_to: formData.owner !== 'current-user' ? formData.owner : undefined,
      company_name: formData.accountName || undefined,
      contact_name: formData.primaryContactName || undefined,
      contact_title: formData.contactRole || undefined,
      source: formData.source || undefined,
      priority: formData.priority || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      product: formData.product || undefined,
      contract_term: formData.contractTerm || undefined,
      payment_terms: formData.paymentTerms || undefined,
      description: formData.description || undefined,
      next_step: formData.nextSteps || undefined,
    };
  };

  const handleSave = async (draft: boolean = false) => {
    if (!draft) {
      const errors: Record<string, string> = {};
      Object.keys(formData).forEach(key => {
        const error = validateField(key, formData[key as keyof typeof formData]);
        if (error) errors[key] = error;
      });

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        showToast('error', 'Please fix validation errors before saving');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (!validateForm()) {
        showToast('error', 'Please fill all required fields');
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload = buildPayload();
      let savedDealId = id;

      if (isEditMode && id) {
        await updateDeal(id, payload);
      } else {
        const result = await createDeal(payload);
        savedDealId = result.data?.id;
      }

      localStorage.removeItem('deal-form-draft');
      setHasUnsavedChanges(false);

      showToast('success', draft ? 'Draft saved' : 'Deal saved successfully!');

      if (!draft) {
        if (saveOptions.addAnother) {
          setFormData({
            dealName: '',
            dealValue: '',
            currency: 'USD',
            closeDate: '',
            stage: 'prospecting',
            probability: 25,
            accountId: '',
            accountName: '',
            primaryContactId: '',
            primaryContactName: '',
            contactRole: 'Champion',
            additionalContacts: [],
            owner: 'current-user',
            source: '',
            hrmsConnection: null,
            priority: 'Medium',
            tags: [],
            product: '',
            contractTerm: '',
            paymentTerms: '',
            description: '',
            nextSteps: '',
            sourceJourney: null
          });
          setShowSmartSearch(true);
          setSelectedAccount(null);
          setSelectedContact(null);
          setAiSuggestions(null);
          setValidationErrors({});
          setFieldWarnings({});
          setDealNameUserEdited(false);
          showToast('success', 'Ready to add another deal');
        } else if (savedDealId) {
          navigate(`/crm/deals/${savedDealId}`);
        } else {
          navigate('/crm/deals');
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save deal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getValidationStatus = () => {
    const total = 8;
    const completed = [
      formData.dealName,
      formData.dealValue,
      formData.closeDate,
      formData.stage,
      formData.accountName,
      formData.primaryContactName,
      formData.owner,
      formData.source
    ].filter(Boolean).length;

    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
      isValid: completed === total
    };
  };

  const validation = getValidationStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => navigate('/crm/deals')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Deals
          </button>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 font-medium">
            {isEditMode ? `Edit Deal: ${formData.dealName}` : 'Add New Deal'}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            {isEditMode ? `Edit Deal: ${formData.dealName}` : 'Add New Deal'}
          </h1>
          <div className="flex items-center space-x-3">
            {autoSaveStatus !== 'saved' && !isEditMode && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mr-2">
                <div className="flex items-center space-x-1">
                  {autoSaveStatus === 'saving' && <span className="animate-pulse">💾</span>}
                  {autoSaveStatus === 'unsaved' && <span>⚠️</span>}
                  <span>{autoSaveStatus === 'saving' ? 'Auto-saving...' : 'Unsaved changes'}</span>
                </div>
              </div>
            )}
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving || !validation.isValid}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Deal'}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {isEditMode ? 'Last Modified: Dec 7, 2025 by Alex Rodriguez' : 'Creating new deal...'}
          </div>
          {autoSaveStatus === 'saved' && hasUnsavedChanges && !isEditMode && (
            <div className="text-xs text-green-600 flex items-center space-x-1">
              <span>✅</span>
              <span>Draft auto-saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (65% width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Smart Deal Creation */}
            {showSmartSearch && (
              <SmartSearchPanel
                onAccountSelect={handleAccountSelect}
                onContactSelect={handleContactSelect}
                onSkip={handleSkipSmartCreation}
              />
            )}

            {/* AI Auto-populated Section */}
            {aiSuggestions && !showSmartSearch && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    <h2 className="text-lg font-bold text-gray-900">✅ Selected: {selectedAccount?.name || formData.accountName}</h2>
                  </div>
                  <button
                    onClick={handleChangeSelection}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Change Selection
                  </button>
                </div>

                <div className={`${aiSuggestions.isHRMS ? 'bg-gradient-to-br from-orange-50 to-purple-50' : 'bg-purple-50'} rounded-lg p-4 border ${aiSuggestions.isHRMS ? 'border-orange-200' : 'border-purple-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-purple-900">🤖 AI Auto-populated:</div>
                    {aiSuggestions.isHRMS && (
                      <div className="flex items-center space-x-1">
                        <Briefcase className="h-4 w-4 text-orange-600" />
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded">🏢 HRMS</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-800">• Account:</span>
                      <span className="font-medium text-purple-900">{selectedAccount?.name || formData.accountName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-800">• Contact:</span>
                      <span className="font-medium text-purple-900">{selectedContact?.name || aiSuggestions.contact}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-800">• Suggested Value:</span>
                      <span className="font-medium text-purple-900">{aiSuggestions.valueRange} (Based on company size & industry)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-800">• Suggested Close Date:</span>
                      <span className="font-medium text-purple-900">{aiSuggestions.closeDays} days ({new Date(aiSuggestions.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-800">• Win Probability:</span>
                      <span className="font-medium text-purple-900">{aiSuggestions.probability}% {aiSuggestions.isHRMS ? '(+15% HRMS boost!)' : '(Similar deals)'}</span>
                    </div>
                    {aiSuggestions.isHRMS && (
                      <div className="mt-3 p-2 bg-green-100 rounded border border-green-300">
                        <div className="text-xs font-bold text-green-900">🎉 Warm Intro Advantage Detected!</div>
                        <div className="text-xs text-green-800 mt-1">HRMS connection increases close rate by 33%</div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleApplyAISuggestions}
                    className={`mt-4 w-full px-4 py-2 ${aiSuggestions.isHRMS ? 'bg-orange-600 hover:bg-orange-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg font-medium transition-colors`}
                  >
                    Apply All Suggestions
                  </button>
                </div>
              </div>
            )}

            {/* Form Sections */}
            <DealFormBasicInfo
              formData={formData}
              onChange={handleFieldChange}
              aiSuggestions={aiSuggestions}
              validationErrors={validationErrors}
              fieldWarnings={fieldWarnings}
              isNameAutoGenerated={!dealNameUserEdited && !!formData.dealName}
              onRegenerateName={handleRegenerateDealName}
            />

            <DealFormAccountContacts
              formData={formData}
              onChange={handleFieldChange}
              selectedAccount={selectedAccount}
              selectedContact={selectedContact}
              onSearchAccount={() => setShowSmartSearch(true)}
              validationErrors={validationErrors}
            />

            <DealFormOwnership
              formData={formData}
              onChange={handleFieldChange}
              validationErrors={validationErrors}
            />

            <DealFormProductDetails
              formData={formData}
              onChange={handleFieldChange}
            />

            <DealFormDescription
              formData={formData}
              onChange={handleFieldChange}
            />
          </div>

          {/* Right Column (35% width) */}
          <div className="lg:col-span-1 space-y-6">
            <DealPreviewPanel formData={formData} />
            <AIInsightsPanel formData={formData} />
            <AIRecommendationsPanel
              formData={formData}
              onApplyRecommendation={(field, value) => handleFieldChange(field, value)}
            />
            <ValidationChecklistPanel validation={validation} formData={formData} />
            <SaveOptionsPanel
              options={saveOptions}
              onChange={setSaveOptions}
            />
            <TipsHelpPanel />
            {duplicateDeals.length > 0 && (
              <DuplicateCheckPanel
                duplicates={duplicateDeals}
                onViewDeal={(dealId) => window.open(`/crm/deals/${dealId}`, '_blank')}
                onMerge={() => showToast('info', 'Merge functionality would open')}
              />
            )}
          </div>
        </div>
      </div>

      {/* HRMS Advantage Modal */}
      {hrmsModalData && (
        <HRMSAdvantageModal
          isOpen={showHRMSModal}
          onClose={handleSkipHRMSAdvantage}
          onUseAdvantage={handleUseHRMSAdvantage}
          hrmsData={hrmsModalData}
        />
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-4 shadow-lg">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          <span className="text-sm text-gray-600">* Required fields</span>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/crm/deals')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving || !validation.isValid}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Deal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveDealFormPage;
