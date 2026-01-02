import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Search, Globe, Linkedin, Twitter, MapPin, Building2, TrendingUp, DollarSign, Users, Zap, Tag, FileText, Upload } from 'lucide-react';
import { useAccounts } from '../../contexts/AccountsContext';
import { useToast } from '../../contexts/ToastContext';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import {
  validateURL,
  formatURL,
  formatLinkedInURL,
  formatPhoneNumber,
  formatCurrency,
  calculateCompanyAge,
  calculateGrowthRate,
  calculateTotalFunding,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage
} from '../../utils/accountFormUtils';
import AIEnrichmentSection from '../../components/Accounts/Form/AIEnrichmentSection';
import PreviewPanel from '../../components/Accounts/Form/PreviewPanel';
import DataQualityPanel from '../../components/Accounts/Form/DataQualityPanel';
import AISuggestionsPanel from '../../components/Accounts/Form/AISuggestionsPanel';
import LocationSection from '../../components/Accounts/Form/LocationSection';
import CompanyDetailsSection from '../../components/Accounts/Form/CompanyDetailsSection';
import FundingSection from '../../components/Accounts/Form/FundingSection';
import CRMSettingsSection from '../../components/Accounts/Form/CRMSettingsSection';
import ValidationTipsPanel from '../../components/Accounts/Form/ValidationTipsPanel';

interface Office {
  id: string;
  location: string;
  type: string;
  employees: number;
}

interface Founder {
  id: string;
  name: string;
  role: string;
}

interface FundingRound {
  id: string;
  roundName: string;
  amount: number;
  date: { month: string; year: number };
  leadInvestor: string;
  otherInvestors: string;
  isRecent?: boolean;
}

interface AccountFormData {
  companyName: string;
  legalName: string;
  tradeName: string;
  industry: string;
  subIndustry: string;
  specialization: string;
  targetMarket: string;
  website: string;
  companyPhone: string;
  linkedin: string;
  twitter: string;
  companyEmail: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  offices: Office[];
  foundedMonth: string;
  foundedYear: number;
  founders: Founder[];
  employeeCount: number;
  employeeGrowth: { [year: string]: number };
  annualRevenue: number;
  currency: string;
  revenueYear: number;
  isRevenueEstimated: boolean;
  revenueGrowth: number;
  revenueHistory: { [year: string]: number };
  totalFunding: number;
  fundingRounds: FundingRound[];
  estimatedValuation: number;
  isValuationEstimated: boolean;
  infrastructure: string;
  crmTools: string;
  devTools: string;
  accountOwner: string;
  accountStatus: string;
  priority: string;
  tags: string[];
  accountSource: string;
  hasHRMSConnection: boolean;
  notes: string;
}

const AccountFormPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { getAccountById, createAccount, updateAccount } = useAccounts();

  const isEditMode = !!accountId && accountId !== 'add';
  const existingAccount = isEditMode ? getAccountById(accountId) : null;

  const [formData, setFormData] = useState<AccountFormData>({
    companyName: existingAccount?.name || '',
    legalName: existingAccount?.name || '',
    tradeName: '',
    industry: existingAccount?.industry || '',
    subIndustry: '',
    specialization: '',
    targetMarket: '',
    website: existingAccount?.website || '',
    companyPhone: existingAccount?.phone || '',
    linkedin: existingAccount?.socialProfiles?.linkedin || '',
    twitter: '',
    companyEmail: existingAccount?.email || '',
    addressLine1: existingAccount?.address?.street || '',
    addressLine2: '',
    city: existingAccount?.address?.city || '',
    state: existingAccount?.address?.state || '',
    postalCode: existingAccount?.address?.zip || '',
    country: existingAccount?.address?.country || 'United States',
    offices: [],
    foundedMonth: '',
    foundedYear: 2018,
    founders: [],
    employeeCount: existingAccount?.employeeCount || 0,
    employeeGrowth: {},
    annualRevenue: existingAccount?.annualRevenue || 0,
    currency: 'USD',
    revenueYear: 2025,
    isRevenueEstimated: false,
    revenueGrowth: 0,
    revenueHistory: {},
    totalFunding: 0,
    fundingRounds: [],
    estimatedValuation: 0,
    isValuationEstimated: true,
    infrastructure: '',
    crmTools: '',
    devTools: '',
    accountOwner: existingAccount?.owner || 'Alex Rodriguez',
    accountStatus: existingAccount?.status || 'Active',
    priority: 'Medium',
    tags: existingAccount?.tags || [],
    accountSource: 'Manual',
    hasHRMSConnection: false,
    notes: '',
  });

  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [showEnrichment, setShowEnrichment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [duplicateAccounts, setDuplicateAccounts] = useState<any[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [companyAge, setCompanyAge] = useState('');
  const [growthRate, setGrowthRate] = useState('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { showToast } = useToast();
  const { filteredAccounts } = useAccounts();

  useEffect(() => {
    if (isEditMode && existingAccount) {
      setFormData({
        companyName: existingAccount.name || '',
        legalName: existingAccount.name || '',
        tradeName: existingAccount.customFields?.tradeName || '',
        industry: existingAccount.industry || '',
        subIndustry: existingAccount.customFields?.subIndustry || '',
        specialization: existingAccount.customFields?.specialization || '',
        targetMarket: existingAccount.customFields?.targetMarket || '',
        website: existingAccount.website || '',
        companyPhone: existingAccount.phone || '',
        linkedin: existingAccount.socialProfiles?.linkedin || '',
        twitter: existingAccount.socialProfiles?.twitter || '',
        companyEmail: existingAccount.email || '',
        addressLine1: existingAccount.address?.street || '',
        addressLine2: '',
        city: existingAccount.address?.city || '',
        state: existingAccount.address?.state || '',
        postalCode: existingAccount.address?.zip || '',
        country: existingAccount.address?.country || 'United States',
        offices: existingAccount.customFields?.offices || [],
        foundedMonth: '',
        foundedYear: 2018,
        founders: existingAccount.customFields?.founders || [],
        employeeCount: existingAccount.employeeCount || 0,
        employeeGrowth: existingAccount.customFields?.employeeGrowth || {},
        annualRevenue: existingAccount.annualRevenue || 0,
        currency: 'USD',
        revenueYear: 2025,
        isRevenueEstimated: false,
        revenueGrowth: 0,
        revenueHistory: existingAccount.customFields?.revenueHistory || {},
        totalFunding: existingAccount.customFields?.totalFunding || 0,
        fundingRounds: existingAccount.customFields?.fundingRounds || [],
        estimatedValuation: existingAccount.customFields?.estimatedValuation || 0,
        isValuationEstimated: true,
        infrastructure: existingAccount.customFields?.techStack?.infrastructure || '',
        crmTools: existingAccount.customFields?.techStack?.crmTools || '',
        devTools: existingAccount.customFields?.techStack?.devTools || '',
        accountOwner: existingAccount.owner || 'Alex Rodriguez',
        accountStatus: existingAccount.status || 'Active',
        priority: existingAccount.customFields?.priority || 'Medium',
        tags: existingAccount.tags || [],
        accountSource: existingAccount.customFields?.accountSource || 'Manual',
        hasHRMSConnection: existingAccount.customFields?.hasHRMSConnection || false,
        notes: existingAccount.customFields?.notes || '',
      });
    }
  }, [isEditMode, existingAccount]);

  useEffect(() => {
    const storageKey = `account-form-draft-${accountId || 'new'}`;
    const savedDraft = loadFromLocalStorage(storageKey);

    if (savedDraft && !isEditMode) {
      const shouldRestore = window.confirm('Found unsaved draft. Restore it?');
      if (shouldRestore) {
        setFormData(savedDraft);
        showToast('info', 'Draft restored');
      } else {
        clearLocalStorage(storageKey);
      }
    }
  }, []);

  useEffect(() => {
    if (hasUnsavedChanges) {
      const storageKey = `account-form-draft-${accountId || 'new'}`;

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        saveToLocalStorage(storageKey, formData);
      }, 30000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, hasUnsavedChanges, accountId]);

  useEffect(() => {
    if (formData.companyName.trim().length > 2) {
      const duplicates = filteredAccounts.filter(acc =>
        acc.name.toLowerCase().includes(formData.companyName.toLowerCase()) &&
        acc.id !== accountId
      );
      setDuplicateAccounts(duplicates);
      setShowDuplicateWarning(duplicates.length > 0);
    } else {
      setDuplicateAccounts([]);
      setShowDuplicateWarning(false);
    }
  }, [formData.companyName, filteredAccounts, accountId]);

  useEffect(() => {
    if (formData.foundedMonth && formData.foundedYear) {
      const age = calculateCompanyAge(formData.foundedMonth, formData.foundedYear);
      setCompanyAge(age);
    } else {
      setCompanyAge('');
    }
  }, [formData.foundedMonth, formData.foundedYear]);

  useEffect(() => {
    if (Object.keys(formData.employeeGrowth).length > 1) {
      const rate = calculateGrowthRate(formData.employeeGrowth);
      setGrowthRate(rate);
    } else {
      setGrowthRate('');
    }
  }, [formData.employeeGrowth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave('view');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave('view');
      }
      if (e.key === 'Escape' && showCancelModal) {
        setShowCancelModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCancelModal]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleInputChange = (field: keyof AccountFormData, value: any) => {
    setHasUnsavedChanges(true);
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addOffice = () => {
    const newOffice: Office = {
      id: Date.now().toString(),
      location: '',
      type: '',
      employees: 0,
    };
    setFormData(prev => ({ ...prev, offices: [...prev.offices, newOffice] }));
  };

  const removeOffice = (id: string) => {
    setFormData(prev => ({
      ...prev,
      offices: prev.offices.filter(o => o.id !== id),
    }));
  };

  const updateOffice = (id: string, field: keyof Office, value: any) => {
    setFormData(prev => ({
      ...prev,
      offices: prev.offices.map(o => o.id === id ? { ...o, [field]: value } : o),
    }));
  };

  const addFounder = () => {
    const newFounder: Founder = {
      id: Date.now().toString(),
      name: '',
      role: '',
    };
    setFormData(prev => ({ ...prev, founders: [...prev.founders, newFounder] }));
  };

  const removeFounder = (id: string) => {
    setFormData(prev => ({
      ...prev,
      founders: prev.founders.filter(f => f.id !== id),
    }));
  };

  const updateFounder = (id: string, field: keyof Founder, value: string) => {
    setFormData(prev => ({
      ...prev,
      founders: prev.founders.map(f => f.id === id ? { ...f, [field]: value } : f),
    }));
  };

  const addFundingRound = () => {
    const newRound: FundingRound = {
      id: Date.now().toString(),
      roundName: '',
      amount: 0,
      date: { month: 'January', year: 2024 },
      leadInvestor: '',
      otherInvestors: '',
    };
    setFormData(prev => ({ ...prev, fundingRounds: [...prev.fundingRounds, newRound] }));
  };

  const removeFundingRound = (id: string) => {
    setFormData(prev => ({
      ...prev,
      fundingRounds: prev.fundingRounds.filter(r => r.id !== id),
    }));
  };

  const updateFundingRound = (id: string, field: keyof FundingRound, value: any) => {
    setFormData(prev => ({
      ...prev,
      fundingRounds: prev.fundingRounds.map(r => r.id === id ? { ...r, [field]: value } : r),
    }));
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'This field is required';
    }
    if (!formData.industry) {
      newErrors.industry = 'This field is required';
    }
    if (!formData.website.trim()) {
      newErrors.website = 'This field is required';
    } else if (!validateURL(formData.website)) {
      newErrors.website = 'Invalid URL format. Example: https://example.com';
    }
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'This field is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'This field is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'This field is required';
    }
    if (!formData.country) {
      newErrors.country = 'This field is required';
    }
    if (!formData.accountOwner) {
      newErrors.accountOwner = 'This field is required';
    }
    if (!formData.accountStatus) {
      newErrors.accountStatus = 'This field is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showToast('error', 'Please fix errors before saving');
      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.getElementsByName(firstErrorField)[0];
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      return false;
    }

    return true;
  };

  const handleSave = async (action: 'view' | 'contact' | 'deal' | 'another' | 'draft' = 'view') => {
    if (action !== 'draft' && !validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const accountData = {
        id: isEditMode ? accountId : `ACC-${Date.now()}`,
        name: formData.companyName,
        industry: formData.industry,
        website: formData.website,
        phone: formData.companyPhone,
        email: formData.companyEmail,
        address: {
          street: formData.addressLine1,
          city: formData.city,
          state: formData.state,
          zip: formData.postalCode,
          country: formData.country,
        },
        employeeCount: formData.employeeCount,
        annualRevenue: formData.annualRevenue,
        owner: formData.accountOwner,
        status: formData.accountStatus,
        tags: formData.tags,
        socialProfiles: {
          linkedin: formData.linkedin,
          twitter: formData.twitter,
        },
        customFields: {
          legalName: formData.legalName,
          tradeName: formData.tradeName,
          subIndustry: formData.subIndustry,
          specialization: formData.specialization,
          targetMarket: formData.targetMarket,
          offices: formData.offices,
          foundedDate: formData.foundedMonth && formData.foundedYear ? `${formData.foundedMonth} ${formData.foundedYear}` : '',
          founders: formData.founders,
          employeeGrowth: formData.employeeGrowth,
          revenueHistory: formData.revenueHistory,
          totalFunding: formData.totalFunding,
          fundingRounds: formData.fundingRounds,
          estimatedValuation: formData.estimatedValuation,
          techStack: {
            infrastructure: formData.infrastructure,
            crmTools: formData.crmTools,
            devTools: formData.devTools,
          },
          priority: formData.priority,
          accountSource: formData.accountSource,
          hasHRMSConnection: formData.hasHRMSConnection,
          notes: formData.notes,
        },
      };

      let savedAccountId: string;

      if (isEditMode) {
        await updateAccount(accountId, accountData);
        savedAccountId = accountId;
        showToast('success', 'Account updated successfully');
      } else {
        const newAccount = await createAccount(accountData);
        savedAccountId = newAccount.id;
        showToast('success', 'Account created successfully');
      }

      setHasUnsavedChanges(false);
      const storageKey = `account-form-draft-${accountId || 'new'}`;
      clearLocalStorage(storageKey);

      switch (action) {
        case 'view':
          navigate(`/crm/accounts/${savedAccountId}`);
          break;
        case 'contact':
          showToast('info', 'Navigating to add contact...');
          setTimeout(() => {
            navigate(`/crm/contacts/add?accountId=${savedAccountId}&accountName=${accountData.name}`);
          }, 500);
          break;
        case 'deal':
          showToast('info', 'Navigating to create deal...');
          setTimeout(() => {
            navigate(`/crm/deals/add?accountId=${savedAccountId}&accountName=${accountData.name}`);
          }, 500);
          break;
        case 'another':
          showToast('success', 'Ready to add another account');
          setFormData({
            companyName: '',
            legalName: '',
            tradeName: '',
            industry: '',
            subIndustry: '',
            specialization: '',
            targetMarket: '',
            website: '',
            companyPhone: '',
            linkedin: '',
            twitter: '',
            companyEmail: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'United States',
            offices: [],
            foundedMonth: '',
            foundedYear: 2018,
            founders: [],
            employeeCount: 0,
            employeeGrowth: {},
            annualRevenue: 0,
            currency: 'USD',
            revenueYear: 2025,
            isRevenueEstimated: false,
            revenueGrowth: 0,
            revenueHistory: {},
            totalFunding: 0,
            fundingRounds: [],
            estimatedValuation: 0,
            isValuationEstimated: true,
            infrastructure: '',
            crmTools: '',
            devTools: '',
            accountOwner: 'Alex Rodriguez',
            accountStatus: 'Active',
            priority: 'Medium',
            tags: [],
            accountSource: 'Manual',
            hasHRMSConnection: false,
            notes: '',
          });
          setErrors({});
          setHasUnsavedChanges(false);
          break;
        case 'draft':
          showToast('info', 'Draft saved');
          break;
      }
    } catch (error) {
      console.error('Error saving account:', error);
      showToast('error', 'Failed to save account. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelModal(true);
    } else {
      if (isEditMode) {
        navigate(`/crm/accounts/${accountId}`);
      } else {
        navigate('/crm/accounts');
      }
    }
  };

  const confirmCancel = () => {
    const storageKey = `account-form-draft-${accountId || 'new'}`;
    clearLocalStorage(storageKey);
    setShowCancelModal(false);
    if (isEditMode) {
      navigate(`/crm/accounts/${accountId}`);
    } else {
      navigate('/crm/accounts');
    }
  };

  const handleURLBlur = (field: 'website' | 'linkedin') => {
    if (formData[field]) {
      const formatted = field === 'linkedin'
        ? formatLinkedInURL(formData[field])
        : formatURL(formData[field]);
      handleInputChange(field, formatted);
    }
  };

  const handlePhoneBlur = () => {
    if (formData.companyPhone) {
      const formatted = formatPhoneNumber(formData.companyPhone);
      handleInputChange('companyPhone', formatted);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <button onClick={() => navigate('/crm/accounts')} className="hover:text-gray-900">
              Accounts
            </button>
            <span className="mx-2">&gt;</span>
            {isEditMode && existingAccount && (
              <>
                <button onClick={() => navigate(`/crm/accounts/${accountId}`)} className="hover:text-gray-900">
                  {existingAccount.name}
                </button>
                <span className="mx-2">&gt;</span>
              </>
            )}
            <span className="text-gray-900">
              {isEditMode ? 'Edit Account' : 'Add New Account'}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                {isEditMode ? (
                  <span className="text-2xl">✏️</span>
                ) : (
                  <span className="text-2xl">➕</span>
                )}
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? `Edit Account: ${existingAccount?.name}` : 'Add New Account'}
                </h1>
              </div>
              {isEditMode && (
                <p className="text-sm text-gray-500 mt-2">
                  Last Modified: Nov 16, 2025 by Alex Rodriguez
                </p>
              )}
              {!isEditMode && (
                <p className="text-sm text-gray-500 mt-2">
                  Creating new account...
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave('view')}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {showDuplicateWarning && duplicateAccounts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 mb-2">Similar Account Exists</h3>
                <div className="space-y-2">
                  {duplicateAccounts.slice(0, 2).map(acc => (
                    <div key={acc.id} className="flex items-center justify-between bg-white rounded border border-yellow-200 p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{acc.name}</p>
                        <p className="text-xs text-gray-600">{acc.industry} • Owner: {acc.owner}</p>
                      </div>
                      <button
                        onClick={() => window.open(`/crm/accounts/${acc.id}`, '_blank')}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        View Account
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowDuplicateWarning(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Enrichment Section */}
            <AIEnrichmentSection
              onDataFound={setEnrichedData}
              onApplyData={(data) => {
                setFormData(prev => ({ ...prev, ...data }));
                setShowEnrichment(false);
              }}
            />

            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.companyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="TechStart Inc"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Name
                  </label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => handleInputChange('legalName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="TechStart Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trade Name
                  </label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(e) => handleInputChange('tradeName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="TechStart"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.industry ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Industry</option>
                    <option value="SaaS">SaaS</option>
                    <option value="FinTech">FinTech</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Technology">Technology</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                  {errors.industry && (
                    <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-Industry
                  </label>
                  <input
                    type="text"
                    value={formData.subIndustry}
                    onChange={(e) => handleInputChange('subIndustry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Banking Software, Payment Processing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Banking APIs, Real-time payments"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Market
                  </label>
                  <input
                    type="text"
                    value={formData.targetMarket}
                    onChange={(e) => handleInputChange('targetMarket', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mid-size banks, Credit unions, FinTech startups"
                  />
                </div>
              </div>
            </div>

            {/* Contact Details - Continued in next file part */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-blue-600" />
                Contact Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.website ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://www.techstart.com"
                    />
                    {formData.website && formData.website.match(/^https?:\/\/.+/) && (
                      <a
                        href={formData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                  {errors.website && (
                    <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.companyPhone}
                    onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (212) 555-0100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1 flex items-center space-x-2">
                      <Linkedin className="h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="/company/techstart-inc"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Full URL will be added automatically
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter
                  </label>
                  <div className="flex items-center space-x-2">
                    <Twitter className="h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="@techstart"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Email
                  </label>
                  <input
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="info@techstart.com"
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <LocationSection
              formData={formData}
              onChange={handleInputChange}
              errors={errors}
            />

            {/* Company Details Section */}
            <CompanyDetailsSection
              formData={formData}
              onChange={handleInputChange}
              onAddOffice={addOffice}
              onRemoveOffice={removeOffice}
              onUpdateOffice={updateOffice}
              onAddFounder={addFounder}
              onRemoveFounder={removeFounder}
              onUpdateFounder={updateFounder}
            />

            {/* Funding Section */}
            <FundingSection
              formData={formData}
              onChange={handleInputChange}
              onAddFundingRound={addFundingRound}
              onRemoveFundingRound={removeFundingRound}
              onUpdateFundingRound={updateFundingRound}
            />

            {/* Tech Stack & CRM Settings */}
            <CRMSettingsSection
              formData={formData}
              onChange={handleInputChange}
              onAddTag={addTag}
              onRemoveTag={removeTag}
            />
          </div>

          {/* Right Column - Preview & Panels */}
          <div className="space-y-6">
            <PreviewPanel formData={formData} />
            <DataQualityPanel formData={formData} />
            <AISuggestionsPanel formData={formData} onApplySuggestion={(field, value) => handleInputChange(field as keyof AccountFormData, value)} />
            <ValidationTipsPanel />

            {/* Save Options */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Save Options</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleSave('view')}
                  disabled={isSaving}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  Save & View Account
                </button>
                <button
                  onClick={() => handleSave('contact')}
                  disabled={isSaving}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
                >
                  Save & Add Contact
                </button>
                <button
                  onClick={() => handleSave('deal')}
                  disabled={isSaving}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
                >
                  Save & Create Deal
                </button>
                {!isEditMode && (
                  <button
                    onClick={() => handleSave('another')}
                    disabled={isSaving}
                    className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
                  >
                    Save & Add Another Account
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showCancelModal}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelModal(false)}
        type="warning"
      />
    </div>
  );
};

export default AccountFormPage;
