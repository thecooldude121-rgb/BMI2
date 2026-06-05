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
import { DealHealthScorePanel } from '../../components/Deal/DealForm/DealHealthScorePanel';
import { AIInsightsPanel } from '../../components/Deal/DealForm/AIInsightsPanel';
import { AIRecommendationsPanel } from '../../components/Deal/DealForm/AIRecommendationsPanel';
import { PostSaveModal, PostSaveAction } from '../../components/Deal/DealForm/PostSaveModal';
import { EmailToDealPanel } from '../../components/Deal/DealForm/EmailToDealPanel';
import { TipsHelpPanel } from '../../components/Deal/DealForm/TipsHelpPanel';
import { DuplicateCheckPanel } from '../../components/Deal/DealForm/DuplicateCheckPanel';
import { HRMSAdvantageModal } from '../../components/Deal/DealForm/HRMSAdvantageModal';
import { createDeal, updateDeal, fetchDeals } from '../../utils/dealsApi';
import { useData } from '../../contexts/DataContext';
import { parseAmountInput, convertToBaseCurrency, validateDealValue } from '../../utils/currencyUtils';
import { BASE_CURRENCY_CODE } from '../../config/currencies';
import { generateDealName } from '../../utils/dealNameGenerator';
import { DEFAULT_PIPELINE, getPipeline, getStageProbability } from '../../config/pipelines';
import { DEFAULT_DEAL_TYPE } from '../../config/dealTypes';
import { DEFAULT_CONTACT_ROLE, getContactRole, StakeholderContact } from '../../config/contactRoles';
import { Competitor } from '../../config/competitors';
import { getSuggestedForecastCategory } from '../../config/forecastCategories';
import { getSuggestedDealValue, valueMatchesSuggestion, PriceResult } from '../../utils/productPricingEngine';
import { DealFormAttachments } from '../../components/Deal/DealForm/DealFormAttachments';
import { AttachedFile } from '../../config/attachments';
import { MobileHealthScoreBar } from '../../components/Deal/DealForm/MobileHealthScoreBar';
import { MobileDealPreview } from '../../components/Deal/DealForm/MobileDealPreview';
import { MobileAIRecommendations } from '../../components/Deal/DealForm/MobileAIRecommendations';
import { calculateDealHealthScore } from '../../utils/dealHealthScore';

export const ComprehensiveDealFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addDeal: addDealToContext } = useData();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState({
    dealName: '',
    dealValue: '',
    currency: 'USD',
    closeDate: '',
    pipelineId: DEFAULT_PIPELINE.id,
    pipelineName: DEFAULT_PIPELINE.name,
    dealType: DEFAULT_DEAL_TYPE.id,
    stage: DEFAULT_PIPELINE.stages[0].id,
    probability: DEFAULT_PIPELINE.stages[0].probability,
    accountId: '',
    accountName: '',
    primaryContactId: '',
    primaryContactName: '',
    contactEmail: '',
    contactRole: DEFAULT_CONTACT_ROLE.id,
    additionalContacts: [] as StakeholderContact[],
    competitors: [] as Competitor[],
    forecastCategory: '',
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
    closeDateOverrideReason: '',
    sourceJourney: null as { type: 'lead' | 'contact' | 'account'; name: string; id: string } | null
  });

  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showSmartSearch, setShowSmartSearch] = useState(true);
  const [duplicateDeals, setDuplicateDeals] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [postSaveModal, setPostSaveModal] = useState<{ open: boolean; dealId: string | undefined; dealName: string }>({
    open: false,
    dealId: undefined,
    dealName: '',
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [hasDraftRestored, setHasDraftRestored] = useState(false);
  const [allDeals, setAllDeals] = useState<any[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showHRMSModal, setShowHRMSModal] = useState(false);
  const [hrmsModalData, setHrmsModalData] = useState<any>(null);
  // true = user has manually typed a deal name → never auto-overwrite
  // false = name is empty or was auto-generated → safe to overwrite
  const [dealNameUserEdited, setDealNameUserEdited] = useState(false);
  // true = user manually selected a forecast category → stage changes won't overwrite
  const [forecastCategoryUserSet, setForecastCategoryUserSet] = useState(false);
  // true = user manually typed a deal value → catalog suggestions won't overwrite
  const [dealValueUserEdited, setDealValueUserEdited] = useState(false);
  // Win probability override — rep can manually set their own percentage
  const [winProbOverrideEnabled, setWinProbOverrideEnabled] = useState(false);
  const [winProbOverrideValue, setWinProbOverrideValue] = useState<number | ''>('');
  const [winProbOverrideReason, setWinProbOverrideReason] = useState('');
  // Valid attachments fed back from DealFormAttachments via onValidFilesChange
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  // Incrementing this key remounts DealFormAttachments, resetting all its internal state
  const [attachmentResetKey, setAttachmentResetKey] = useState(0);

  // Fetch all deals once on mount — used for both duplicate deal check and account warning
  useEffect(() => {
    fetchDeals().then(setAllDeals).catch(() => {});
  }, []);

  // Load deal data if editing
  useEffect(() => {
    if (isEditMode && id) {
      loadDealData(id);
    } else {
      // Try to restore from localStorage
      const savedDraft = localStorage.getItem('deal-form-draft');
      if (savedDraft) {
        try {
          const { formData: savedForm, attachmentMeta } = JSON.parse(savedDraft);
          // Discard the draft if formData is missing or not a plain object —
          // a corrupted/partial draft would set formData to undefined and crash.
          if (!savedForm || typeof savedForm !== 'object' || Array.isArray(savedForm)) {
            localStorage.removeItem('deal-form-draft');
            return;
          }
          setFormData(savedForm);
          setHasDraftRestored(true);
          // File objects are not serialisable — attachments are not restored from draft.
          // The user will need to re-select files after restoring a draft.
          void attachmentMeta;
          showToast('info', 'Draft restored from previous session');
        } catch {
          localStorage.removeItem('deal-form-draft');
        }
      }
    }
  }, [id, isEditMode]);

  // Auto-save to localStorage every 30 seconds (File objects stripped — not serialisable)
  useEffect(() => {
    if (!isEditMode && hasUnsavedChanges) {
      setAutoSaveStatus('saving');
      const timer = setTimeout(() => {
        const attachmentMeta = attachments.map(f => ({
          id: f.id, name: f.name, size: f.size, extension: f.extension,
          addedAt: f.addedAt.toISOString(),
        }));
        localStorage.setItem('deal-form-draft', JSON.stringify({ formData, attachmentMeta }));
        setAutoSaveStatus('saved');
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [formData, attachments, hasUnsavedChanges, isEditMode]);

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

  // Auto-apply catalog price when product or contract term changes,
  // unless the rep has already typed a custom value.
  useEffect(() => {
    if (dealValueUserEdited || !formData.product) return;
    const suggestion = getSuggestedDealValue(
      formData.product,
      formData.contractTerm || 'Annual',
      formData.currency || 'USD'
    );
    if (suggestion.hasData) {
      setFormData(prev => ({ ...prev, dealValue: String(suggestion.amount) }));
    }
  }, [formData.product, formData.contractTerm, formData.currency, dealValueUserEdited]);

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
      description: '',
      nextSteps: '',
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
    if (!formData.accountName.trim()) { setDuplicateDeals([]); return; }
    try {
      const all = allDeals.length ? allDeals : await fetchDeals();
      const q = formData.accountName.toLowerCase();
      const matches = all
        .filter((d: any) => (d.company_name || d.name || '').toLowerCase().includes(q))
        .filter((d: any) => !isEditMode || d.id !== id) // exclude self in edit mode
        .slice(0, 5)
        .map((d: any) => ({
          id: d.id,
          name: d.name || d.title || 'Untitled',
          value: parseFloat(d.value) || 0,
          stage: d.stage || '',
          owner: d.assigned_to || '',
          createdDate: d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        }));
      setDuplicateDeals(matches);
    } catch {
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
      contactEmail: contact.email || '',
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
      // Route through handleFieldChange so dealValueUserEdited is set to true,
      // preventing the catalog auto-apply effect from overwriting the value.
      handleFieldChange('dealValue', String(aiSuggestions.dealValue));
      handleFieldChange('closeDate', aiSuggestions.closeDate);
      // Probability is derived, update directly without triggering field-level side effects
      setFormData(prev => ({ ...prev, probability: aiSuggestions.probability }));
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
    setHasDraftRestored(false);
    setFormData({
      dealName: '', dealValue: '', currency: 'USD', closeDate: '',
      pipelineId: DEFAULT_PIPELINE.id, pipelineName: DEFAULT_PIPELINE.name,
      dealType: DEFAULT_DEAL_TYPE.id, stage: DEFAULT_PIPELINE.stages[0].id,
      probability: DEFAULT_PIPELINE.stages[0].probability,
      accountId: '', accountName: '', primaryContactId: '', primaryContactName: '',
      contactEmail: '', contactRole: DEFAULT_CONTACT_ROLE.id,
      additionalContacts: [] as StakeholderContact[], competitors: [] as Competitor[],
      forecastCategory: '', owner: 'current-user', source: '', hrmsConnection: null,
      priority: 'Medium', tags: [], product: '', contractTerm: '', paymentTerms: '',
      description: '', nextSteps: '', closeDateOverrideReason: '', sourceJourney: null,
    });
    setAttachments([]);
    setAttachmentResetKey(k => k + 1);
    setShowSmartSearch(true);
    setSelectedAccount(null);
    setSelectedContact(null);
    setAiSuggestions(null);
    showToast('info', 'Draft discarded — starting fresh');
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

  // Returns true only for fully valid dates (year 2000-2099) that are before today
  const isValidCloseDate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return false;
    const y = d.getFullYear();
    return y >= 2000 && y <= 2099;
  };

  const isCloseDatePast = (dateStr: string): boolean => {
    if (!isValidCloseDate(dateStr)) return false;
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const checkFieldWarning = (field: string, value: any): string | null => {
    if (field === 'closeDate' && value && isValidCloseDate(value)) {
      const selectedDate = new Date(value + 'T12:00:00');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        return 'Close date is in the past. Allowed for migrations or corrections.';
      }
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
    // Base probability comes from the pipeline config — never stale across pipelines
    let probability = getStageProbability(data.pipelineId || DEFAULT_PIPELINE.id, data.stage);

    // Contact level boost — check primary and all additional stakeholders
    const allRoles: string[] = [
      data.contactRole,
      ...((data.additionalContacts ?? []) as StakeholderContact[]).map(c => c.role),
    ];
    if (allRoles.some(r => getContactRole(r).id === 'decision-maker')) probability += 10;
    if (allRoles.some(r => getContactRole(r).id === 'champion'))       probability += 15;
    if (allRoles.some(r => getContactRole(r).id === 'economic-buyer')) probability += 10;

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

  const handlePipelineChange = (pipelineId: string) => {
    const pipeline = getPipeline(pipelineId);
    const firstStage = pipeline.stages[0];

    // Check if the current stage exists in the new pipeline
    const stageStillValid = pipeline.stages.some(s => s.id === formData.stage);
    const newStage = stageStillValid ? formData.stage : firstStage.id;

    const suggestedCategory = !forecastCategoryUserSet
      ? getSuggestedForecastCategory(newStage)
      : formData.forecastCategory;

    if (!forecastCategoryUserSet && suggestedCategory && suggestedCategory !== formData.forecastCategory) {
      showToast('info', `Forecast category updated to "${suggestedCategory}" based on pipeline`);
    }

    const newData = {
      ...formData,
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      stage: newStage,
      forecastCategory: suggestedCategory,
    };

    setFormData({
      ...newData,
      probability: calculateWinProbability(newData),
    });
  };

  const handleFieldChange = (field: string, value: any) => {
    // Pipeline changes are handled by a dedicated handler
    if (field === 'pipelineId') {
      handlePipelineChange(value);
      return;
    }

    // When the user types in the deal name field, lock it from auto-overwriting
    if (field === 'dealName') {
      setDealNameUserEdited(value.length > 0);
    }

    // When user manually types a deal value, lock it from catalog overwriting
    if (field === 'dealValue') {
      setDealValueUserEdited(true);
    }

    // When user manually picks a forecast category, lock it from suggestion overwriting
    if (field === 'forecastCategory') {
      setForecastCategoryUserSet(!!value);
    }

    // When stage changes directly, suggest a forecast category if user hasn't set one
    if (field === 'stage' && !forecastCategoryUserSet) {
      const suggested = getSuggestedForecastCategory(value);
      setFormData(prev => ({ ...prev, forecastCategory: suggested }));
    }

    // Strip non-numeric chars but keep one decimal point while user types
    if (field === 'dealValue' && value) {
      const stripped = value.toString().replace(/[^0-9.]/g, '');
      const parts = stripped.split('.');
      value = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : stripped;
    }

    // newData is used below by calculateWinProbability; keep it in scope.
    // setFormData uses a functional updater so that batched calls (e.g. bulk AI accept)
    // chain off each other instead of all overwriting the same stale snapshot.
    const newData = { ...formData, [field]: value };
    setFormData(prev => {
      let updated = { ...prev, [field]: value };
      if (field === 'closeDate' && !isCloseDatePast(value)) {
        updated = { ...updated, closeDateOverrideReason: '' };
      }
      return updated;
    });

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
    if (['stage', 'contactRole', 'additionalContacts', 'source', 'dealValue', 'hrmsConnection'].includes(field)) {
      const newProbability = calculateWinProbability(newData);
      setFormData(prev => ({ ...prev, probability: newProbability }));
    }
  };

  const validateForm = () => {
    const required = ['dealName', 'dealValue', 'closeDate', 'dealType', 'stage', 'accountName', 'primaryContactName', 'owner', 'source'];
    const missing = required.filter(field => !formData[field as keyof typeof formData]);
    return missing.length === 0;
  };

  const effectiveWinProbability = winProbOverrideEnabled && winProbOverrideValue !== ''
    ? Number(winProbOverrideValue)
    : formData.probability;

  const buildPayload = () => {
    const rawValue = parseAmountInput(formData.dealValue?.toString() || '0') || 0;
    const currency = formData.currency || BASE_CURRENCY_CODE;
    const baseAmountUsd = convertToBaseCurrency(rawValue, currency);
    return {
      name: formData.dealName,
      value: rawValue,
      currency,
      base_amount_usd: baseAmountUsd,
      pipeline_id: formData.pipelineId,
      pipeline_name: formData.pipelineName,
      deal_type: formData.dealType,
      stage: formData.stage,
      probability: effectiveWinProbability,
      win_prob_ai: formData.probability,
      win_prob_override_reason: winProbOverrideEnabled && winProbOverrideReason.trim()
        ? winProbOverrideReason.trim()
        : undefined,
      expected_close_date: formData.closeDate || undefined,
      close_date_is_past: isCloseDatePast(formData.closeDate),
      close_date_override_reason: formData.closeDateOverrideReason?.trim() || undefined,
      assigned_to: formData.owner || undefined,
      company_name: formData.accountName || undefined,
      contact_name: formData.primaryContactName || undefined,
      contact_email: formData.contactEmail || undefined,
      contact_title: formData.contactRole || undefined,
      stakeholders: [
        // Primary contact always first
        ...(formData.primaryContactName ? [{
          id: formData.primaryContactId || 'primary',
          name: formData.primaryContactName,
          role: formData.contactRole || DEFAULT_CONTACT_ROLE.id,
          isPrimary: true,
        }] : []),
        // Additional stakeholders
        ...((formData.additionalContacts ?? []) as StakeholderContact[])
          .filter(c => c.name.trim())
          .map(c => ({ ...c, isPrimary: false })),
      ],
      forecast_category: formData.forecastCategory || undefined,
      competitors: (formData.competitors ?? []) as Competitor[],
      // Only valid files are included — error files are never saved
      attachment_metadata: attachments.map(f => ({
        id: f.id,
        name: f.name,
        size: f.size,
        extension: f.extension,
        addedAt: f.addedAt.toISOString(),
      })),
      source: formData.source || undefined,
      priority: formData.priority || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      product: formData.product || undefined,
      contract_term: formData.contractTerm || undefined,
      payment_terms: formData.paymentTerms || undefined,
      // .trim() prevents whitespace-only strings from reaching the backend
      description: formData.description?.trim() || undefined,
      next_step: formData.nextSteps?.trim() || undefined,
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
      if (import.meta.env.DEV) {
        console.log('[DealForm] Saving payload — value check:', {
          formDataDealValue: formData.dealValue,
          payloadValue: payload.value,
          dealValueUserEdited,
        });
      }
      let savedDealId = id;

      if (isEditMode && id) {
        await updateDeal(id, payload);
      } else {
        const result = await createDeal(payload);
        savedDealId = result.data?.id;
        // Sync into DataContext so the pipeline/list view reflects the new deal
        // without requiring a page refresh. Stage is cast loosely because
        // DealManagementPage normalises unrecognised stages to 'qualified'.
        const rawValue = parseAmountInput(formData.dealValue?.toString() || '0') || 0;
        addDealToContext({
          name: formData.dealName,
          title: formData.dealName,
          leadId: '',
          value: rawValue,
          stage: formData.stage as any,
          probability: effectiveWinProbability,
          expectedCloseDate: formData.closeDate || '',
          assignedTo: formData.owner || 'current-user',
          description: formData.description || undefined,
          nextStep: formData.nextSteps || undefined,
        });
      }

      localStorage.removeItem('deal-form-draft');
      setHasUnsavedChanges(false);

      if (draft) {
        showToast('success', 'Draft saved');
      } else {
        setPostSaveModal({ open: true, dealId: savedDealId, dealName: formData.dealName });
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save deal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetFormForAnother = () => {
    setFormData({
      dealName: '',
      dealValue: '',
      currency: 'USD',
      closeDate: '',
      pipelineId: DEFAULT_PIPELINE.id,
      pipelineName: DEFAULT_PIPELINE.name,
      dealType: DEFAULT_DEAL_TYPE.id,
      stage: DEFAULT_PIPELINE.stages[0].id,
      probability: DEFAULT_PIPELINE.stages[0].probability,
      accountId: '',
      accountName: '',
      primaryContactId: '',
      primaryContactName: '',
      contactEmail: '',
      contactRole: DEFAULT_CONTACT_ROLE.id,
      additionalContacts: [] as StakeholderContact[],
      competitors: [] as Competitor[],
      forecastCategory: '',
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
      closeDateOverrideReason: '',
      sourceJourney: null,
    });
    setShowSmartSearch(true);
    setSelectedAccount(null);
    setSelectedContact(null);
    setAiSuggestions(null);
    setValidationErrors({});
    setFieldWarnings({});
    setDealNameUserEdited(false);
    setForecastCategoryUserSet(false);
    setDealValueUserEdited(false);
    setAttachments([]);
    setAttachmentResetKey(k => k + 1);
  };

  const handlePostSaveAction = (action: PostSaveAction) => {
    const { dealId, dealName } = postSaveModal;
    setPostSaveModal(prev => ({ ...prev, open: false }));

    switch (action) {
      case 'view':
        navigate(dealId ? `/crm/deals/${dealId}` : '/crm/deals');
        break;
      case 'task':
        navigate('/crm/tasks', { state: { createTask: true, dealId, dealName } });
        break;
      case 'email':
        navigate('/crm/activities', { state: { composeEmail: true, dealId, dealName } });
        break;
      case 'meeting':
        navigate('/crm/meetings', { state: { createMeeting: true, dealId, dealName } });
        break;
      case 'another':
        resetFormForAnother();
        showToast('success', 'Ready to add another deal');
        break;
      case 'dismiss':
        navigate('/crm/deals');
        break;
    }
  };

  const getValidationStatus = () => {
    const total = 9;
    // Close date is complete whenever it holds a valid, reasonable date value
    const closeDateComplete = isValidCloseDate(formData.closeDate);
    const completed = [
      formData.dealName,
      formData.dealValue,
      closeDateComplete ? formData.closeDate : '',
      formData.dealType,
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

  // Compute catalog price suggestion for the current product + term + currency
  const catalogSuggestion: PriceResult = formData.product
    ? getSuggestedDealValue(formData.product, formData.contractTerm || 'Annual', formData.currency || 'USD')
    : { hasData: false, reason: 'No product selected' };

  return (
    <div className="min-h-screen bg-gray-50 -mt-4 lg:-mt-6">
      {/* sticky top-14 = sticks at 56px (TopBar h-14) from viewport; negative margins cancel outer p-4/p-6 so header spans edge-to-edge */}
      <div className="sticky top-14 z-50 bg-white border-b border-gray-200 -mx-4 lg:-mx-6 px-4 lg:px-8 py-2 lg:py-1.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {isEditMode ? `Edit Deal: ${formData.dealName}` : 'Add New Deal'}
            </h1>
            {hasDraftRestored && !isEditMode && (
              <button
                onClick={handleClearDraft}
                className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors"
              >
                Discard draft
              </button>
            )}
            {autoSaveStatus === 'saved' && hasUnsavedChanges && !isEditMode && (
              <span className="text-xs text-green-600">✅ Auto-saved</span>
            )}
            {autoSaveStatus !== 'saved' && !isEditMode && (
              <span className="text-xs text-gray-500">
                {autoSaveStatus === 'saving' ? '💾 Saving...' : '⚠️ Unsaved'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCancel}
              className="flex-1 sm:flex-none px-4 py-2.5 sm:py-1.5 text-sm sm:text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors min-h-[44px] sm:min-h-0"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="flex-1 sm:flex-none px-4 py-2.5 sm:py-1.5 text-sm sm:text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-0"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving || !validation.isValid}
              className="flex-1 sm:flex-none px-4 py-2.5 sm:py-1.5 text-sm sm:text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-0"
            >
              {isSaving ? 'Saving...' : 'Save Deal'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="-mx-4 lg:-mx-6 px-2 pt-3 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 lg:gap-6">
          {/* Left Column */}
          <div className="space-y-4 lg:space-y-6">
            {/* Email-to-Deal Assist */}
            <EmailToDealPanel
              formData={formData}
              onApplyField={handleFieldChange}
            />

            {/* Inline health score — mobile/tablet only */}
            <MobileHealthScoreBar formData={formData} />

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
              catalogSuggestion={catalogSuggestion}
              dealValueUserEdited={dealValueUserEdited}
              onApplyCatalogPrice={(amount) => {
                // Apply through handleFieldChange so dealValueUserEdited is set to true
                // and the catalog auto-apply effect cannot override this value again.
                handleFieldChange('dealValue', String(amount));
              }}
              winProbOverrideEnabled={winProbOverrideEnabled}
              winProbOverrideValue={winProbOverrideValue}
              winProbOverrideReason={winProbOverrideReason}
              onEnableOverride={() => {
                setWinProbOverrideEnabled(true);
                setWinProbOverrideValue(formData.probability);
              }}
              onDisableOverride={() => {
                setWinProbOverrideEnabled(false);
                setWinProbOverrideValue('');
                setWinProbOverrideReason('');
              }}
              onOverrideValueChange={setWinProbOverrideValue}
              onOverrideReasonChange={setWinProbOverrideReason}
            />

            {/* Inline deal preview — mobile/tablet only */}
            <MobileDealPreview
              formData={formData}
              winProbOverrideEnabled={winProbOverrideEnabled}
              winProbOverrideValue={winProbOverrideValue}
            />

            <DealFormAccountContacts
              formData={formData}
              onChange={handleFieldChange}
              selectedAccount={selectedAccount}
              selectedContact={selectedContact}
              onSearchAccount={() => setShowSmartSearch(true)}
              validationErrors={validationErrors}
              allDeals={allDeals}
            />

            <DealFormOwnership
              formData={formData}
              onChange={handleFieldChange}
              validationErrors={validationErrors}
            />

            {/* Inline AI recommendations — mobile/tablet only */}
            <MobileAIRecommendations
              formData={formData}
              onApplyRecommendation={handleFieldChange}
            />

            <DealFormProductDetails
              formData={formData}
              onChange={handleFieldChange}
            />

            <DealFormDescription
              formData={formData}
              onChange={handleFieldChange}
            />

            <DealFormAttachments
              key={attachmentResetKey}
              onValidFilesChange={setAttachments}
            />
          </div>

          {/* Right Column — desktop sidebar only */}
          <div className="hidden lg:block space-y-6">
            <DealHealthScorePanel formData={formData} />
            <DealPreviewPanel
              formData={formData}
              winProbOverrideEnabled={winProbOverrideEnabled}
              winProbOverrideValue={winProbOverrideValue}
            />
            <AIInsightsPanel
              formData={formData}
              winProbOverrideEnabled={winProbOverrideEnabled}
              winProbOverrideValue={winProbOverrideValue}
              winProbOverrideReason={winProbOverrideReason}
            />
            <AIRecommendationsPanel
              formData={formData}
              onApplyRecommendation={(field, value) => handleFieldChange(field, value)}
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

      {/* Floating save bar — mobile/tablet only */}
      {(() => {
        const healthResult = calculateDealHealthScore(formData);
        const scoreColor =
          healthResult.tier === 'green'  ? 'bg-emerald-500' :
          healthResult.tier === 'yellow' ? 'bg-amber-500'   :
                                           'bg-red-500';
        return (
          <div
            className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-lg flex items-center justify-between px-4"
            style={{ paddingTop: '12px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${scoreColor}`}>
                {healthResult.score}
              </div>
              <span className="text-xs text-gray-500">/ 100</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="h-11 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={isSaving || !validation.isValid}
                className="h-11 px-5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving…' : 'Save Deal'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Post-save action modal */}
      <PostSaveModal
        isOpen={postSaveModal.open}
        dealName={postSaveModal.dealName}
        dealId={postSaveModal.dealId}
        onAction={handlePostSaveAction}
      />

      {/* HRMS Advantage Modal */}
      {hrmsModalData && (
        <HRMSAdvantageModal
          isOpen={showHRMSModal}
          onClose={handleSkipHRMSAdvantage}
          onUseAdvantage={handleUseHRMSAdvantage}
          hrmsData={hrmsModalData}
        />
      )}
    </div>
  );
};

export default ComprehensiveDealFormPage;
