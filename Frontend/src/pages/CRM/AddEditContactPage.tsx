import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, X, User, Briefcase, MapPin, Tag, FileText, Sparkles,
  CheckCircle, AlertTriangle, Phone, Mail, Linkedin, Building2, Link as LinkIcon,
  Globe, Twitter, Github, ExternalLink, Plus, Lightbulb, Info, Zap
} from 'lucide-react';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  linkedin: string;
  company: string;
  jobTitle: string;
  department: string;
  reportsTo: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  timezone: string;
  source: string;
  tags: string[];
  owner: string;
  status: string;
  notes: string;
}

const AddEditContactPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    linkedin: '',
    company: '',
    jobTitle: '',
    department: 'Sales',
    reportsTo: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    timezone: 'Pacific Time (PT)',
    source: 'Lead Gen Tool',
    tags: [],
    owner: 'Alex Rodriguez (You)',
    status: 'Active',
    notes: ''
  });

  const [enrichmentData, setEnrichmentData] = useState<any>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [duplicateContact, setDuplicateContact] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [postSaveActions, setPostSaveActions] = useState({
    createDeal: false,
    scheduleMeeting: false,
    sendWelcomeEmail: false,
    addToCampaign: false
  });
  const [isAIPanelCollapsed, setIsAIPanelCollapsed] = useState(false);
  const [existingAccount, setExistingAccount] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailValidation, setEmailValidation] = useState<{ status: 'valid' | 'invalid' | 'undeliverable' | null, message: string }>({ status: null, message: '' });
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [linkedinValidation, setLinkedinValidation] = useState<{ valid: boolean, message: string }>({ valid: true, message: '' });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLinkedinModal, setShowLinkedinModal] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      loadContactData(id);
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (formData.email && formData.email.includes('@')) {
      validateEmail(formData.email);
      checkForDuplicates();
      enrichContactData();
    } else if (formData.email) {
      validateEmail(formData.email);
    }
  }, [formData.email]);

  useEffect(() => {
    if (formData.company) {
      searchCompanies(formData.company);
      checkExistingAccount();
    }
  }, [formData.company]);

  useEffect(() => {
    if (formData.linkedin) {
      validateLinkedinUrl(formData.linkedin);
    }
  }, [formData.linkedin]);

  const loadContactData = (contactId: string) => {
    console.log('Loading contact data for:', contactId);
    setFormData({
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@acme.com',
      phone: '+1 555-0123',
      mobile: '+1 555-9999',
      linkedin: 'linkedin.com/in/johnsmith',
      company: 'Acme Corp',
      jobTitle: 'VP Sales',
      department: 'Sales',
      reportsTo: '',
      street: '123 Market Street',
      city: 'San Francisco',
      state: 'California',
      postalCode: '94103',
      country: 'United States',
      timezone: 'Pacific Time (PT)',
      source: 'Lead Gen Tool (Apollo.io, ZoomInfo)',
      tags: ['VIP', 'Decision Maker', 'Hot'],
      owner: 'Alex Rodriguez (You)',
      status: 'Active',
      notes: 'Met at SaaS Summit 2024. Very interested in automation features. Budget confirmed at $50K.'
    });
  };

  const enrichContactData = async () => {
    console.log('🔍 START: Enriching contact data for email:', formData.email);
    setIsEnriching(true);
    setEnrichmentError(null);

    // Simulate random network error (10% chance for demo)
    const shouldSimulateError = Math.random() < 0.1;

    setTimeout(() => {
      if (shouldSimulateError) {
        console.log('❌ Network error simulated');
        setIsEnriching(false);
        setEnrichmentError('⚠️ Could not connect to enrichment service. You can still save the contact.');
        return;
      }
      console.log('⏰ TIMEOUT: Processing enrichment for:', formData.email);
      let enrichedData: any = null;

      if (formData.email === 'sarah@techstart.com') {
        console.log('✅ MATCH: Found Sarah Lee data');
        enrichedData = {
          emailValid: true,
          linkedinFound: true,
          linkedinProfile: {
            name: 'Sarah Lee',
            title: 'CFO at TechStart Inc',
            url: 'https://linkedin.com/in/sarahlee'
          },
          phones: [
            { type: 'Direct', number: '+1 555-0456' }
          ],
          companyInfo: {
            name: 'TechStart Inc',
            industry: 'FinTech',
            size: '45 employees',
            revenue: '$8M (estimated)',
            location: 'New York, NY'
          },
          socialProfiles: {
            twitter: null,
            github: null
          },
          suggestedTags: [
            { tag: 'C-Level', reason: 'CFO-level executive indicates decision authority' },
            { tag: 'Decision Maker', reason: 'Financial decision maker for company purchases' }
          ],
          hrmsConnection: {
            found: true,
            recruitedDate: 'Nov 14, 2024',
            message: 'Sarah Lee was recruited from TechStart Inc on Nov 14, 2024'
          }
        };
      } else if (formData.email === 'john@acme.com') {
        console.log('✅ MATCH: Found John Smith data');
        enrichedData = {
          emailValid: true,
          linkedinFound: true,
          linkedinProfile: {
            name: 'Sarah Lee',
            title: 'CFO at TechStart Inc',
            url: 'https://linkedin.com/in/sarahlee'
          },
          phones: [
            { type: 'Direct', number: '+1 555-0456' }
          ],
          companyInfo: {
            name: 'TechStart Inc',
            industry: 'FinTech',
            size: '45 employees',
            revenue: '$8M (estimated)',
            location: 'New York, NY'
          },
          socialProfiles: {
            twitter: null,
            github: null
          },
          suggestedTags: [
            { tag: 'C-Level', reason: 'CFO-level executive indicates decision authority' },
            { tag: 'Decision Maker', reason: 'Financial decision maker for company purchases' }
          ],
          hrmsConnection: {
            found: true,
            recruitedDate: 'Nov 14, 2024',
            message: 'Sarah Lee was recruited from TechStart Inc on Nov 14, 2024'
          }
        };
      } else if (formData.email === 'john@acme.com') {
        enrichedData = {
          emailValid: true,
          linkedinFound: true,
          linkedinProfile: {
            name: 'John Smith',
            title: 'VP Sales at Acme Corp',
            url: 'https://linkedin.com/in/johnsmith'
          },
          phones: [
            { type: 'Direct', number: '+1 555-0123' },
            { type: 'Mobile', number: '+1 555-9999' }
          ],
          companyInfo: {
            name: 'Acme Corp',
            industry: 'SaaS',
            size: '75 employees',
            revenue: '$12M (estimated)',
            location: 'San Francisco, CA'
          },
          socialProfiles: {
            twitter: '@johnsmith',
            github: null
          },
          suggestedTags: [
            { tag: 'Decision Maker', reason: 'VP-level title indicates decision authority' },
            { tag: 'VIP', reason: 'Company size and role match ICP' },
            { tag: 'Tech Savvy', reason: 'Active on LinkedIn, has online presence' }
          ]
        };
      } else {
        console.log('⚠️ No specific data for this email, using generic enrichment');
        enrichedData = {
          emailValid: true,
          linkedinFound: false,
          phones: [],
          companyInfo: null,
          suggestedTags: []
        };
      }

      console.log('📊 FINAL: Setting enrichment data:', enrichedData);
      console.log('📊 Has LinkedIn?', enrichedData?.linkedinFound);
      console.log('📊 Has Phones?', enrichedData?.phones?.length > 0);
      console.log('📊 Has Company?', !!enrichedData?.companyInfo);
      setEnrichmentData(enrichedData);
      setIsEnriching(false);
      console.log('✅ DONE: Enrichment complete for:', formData.email);
    }, 1500);
  };

  const checkForDuplicates = () => {
    setTimeout(() => {
      if (formData.email === 'john@acme.com' && !isEditMode) {
        setDuplicateContact({
          name: 'John Smith',
          title: 'VP Sales',
          company: 'Acme Corp',
          email: 'john@acme.com',
          added: 'Nov 10, 2025',
          addedBy: 'Alex Rodriguez',
          lastContact: 'Nov 15, 2025',
          similarity: 98
        });
        setShowDuplicateWarning(true);
      } else if (formData.email === 'sarah@techstart.com' && !isEditMode) {
        setShowDuplicateWarning(false);
      } else {
        setShowDuplicateWarning(false);
      }
    }, 500);
  };

  const checkExistingAccount = () => {
    setTimeout(() => {
      if (formData.company.toLowerCase().includes('acme')) {
        setExistingAccount({
          name: 'Acme Corp',
          id: 'acme-corp-123',
          linked: isEditMode
        });
      } else {
        setExistingAccount(null);
      }
    }, 300);
  };

  const handleInputChange = (field: keyof ContactFormData, value: any) => {
    setHasUnsavedChanges(true);

    if (field === 'phone' || field === 'mobile') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const applyEnrichmentData = (field: string, value: any) => {
    console.log('Applying enrichment:', field, value);
    if (field === 'phone') {
      setFormData(prev => ({ ...prev, phone: value }));
    } else if (field === 'mobile') {
      setFormData(prev => ({ ...prev, mobile: value }));
    } else if (field === 'linkedin') {
      setFormData(prev => ({ ...prev, linkedin: value }));
    } else if (field === 'company') {
      const { companyInfo } = enrichmentData;
      setFormData(prev => ({
        ...prev,
        company: companyInfo.name,
        city: companyInfo.location.split(',')[0],
        state: companyInfo.location.split(',')[1]?.trim()
      }));
    }
  };

  const importAllData = () => {
    if (!enrichmentData) return;

    const nameParts = enrichmentData.linkedinProfile?.name?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const phone = enrichmentData.phones?.[0]?.number || '';
    const linkedin = enrichmentData.linkedinProfile?.url || '';
    const jobTitle = enrichmentData.linkedinProfile?.title?.split(' at ')[0] || '';
    const company = enrichmentData.companyInfo?.name || '';
    const locationParts = enrichmentData.companyInfo?.location?.split(', ') || [];
    const city = locationParts[0] || '';
    const state = locationParts[1] || '';

    setFormData(prev => ({
      ...prev,
      firstName,
      lastName,
      phone,
      linkedin,
      jobTitle,
      company,
      city,
      state
    }));

    if (enrichmentData.hrmsConnection?.found) {
      setFormData(prev => ({
        ...prev,
        source: '🏢 HRMS (Recruitment)'
      }));
    }

    alert('All data imported successfully!');
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setEmailValidation({ status: null, message: '' });
      return;
    }

    if (!emailRegex.test(email)) {
      setEmailValidation({ status: 'invalid', message: '⚠️ Invalid format' });
      return;
    }

    setTimeout(() => {
      if (email.includes('invalid') || email.includes('fake')) {
        setEmailValidation({ status: 'undeliverable', message: '❌ Not deliverable' });
      } else {
        setEmailValidation({ status: 'valid', message: '✅ Valid and deliverable' });
      }
    }, 500);
  };

  const validateLinkedinUrl = (url: string) => {
    if (!url.trim()) {
      setLinkedinValidation({ valid: true, message: '' });
      return;
    }

    const linkedinRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9_-]+\/?$/;

    if (!linkedinRegex.test(url)) {
      setLinkedinValidation({ valid: false, message: '⚠️ Invalid LinkedIn URL format' });
    } else {
      const username = url.split('/').filter(Boolean).pop();
      setLinkedinValidation({ valid: true, message: `✅ Valid (Username: ${username})` });
    }
  };

  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    if (cleaned.length <= 10) return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;

    return `+${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  };

  const searchCompanies = (query: string) => {
    if (query.length < 2) {
      setCompanySuggestions([]);
      setShowCompanySuggestions(false);
      return;
    }

    const mockCompanies = [
      { id: '1', name: 'Acme Corp', industry: 'SaaS', size: '75 employees' },
      { id: '2', name: 'TechStart Inc', industry: 'FinTech', size: '45 employees' },
      { id: '3', name: 'Global Solutions', industry: 'Consulting', size: '200 employees' },
      { id: '4', name: 'Innovation Labs', industry: 'Technology', size: '120 employees' }
    ];

    const filtered = mockCompanies.filter(company =>
      company.name.toLowerCase().includes(query.toLowerCase())
    );

    setCompanySuggestions(filtered);
    setShowCompanySuggestions(filtered.length > 0);

    if (filtered.some(c => c.name.toLowerCase() === query.toLowerCase())) {
      setExistingAccount(filtered.find(c => c.name.toLowerCase() === query.toLowerCase()));
    } else {
      setExistingAccount(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = '⚠️ First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = '⚠️ Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = '⚠️ Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '❌ Please enter a valid email address';
    }

    if (!formData.company.trim()) {
      newErrors.company = '⚠️ Company is required';
    } else if (formData.company.trim().length < 2) {
      newErrors.company = 'Company must be at least 2 characters';
    }

    if (!formData.source) {
      newErrors.source = '⚠️ Source is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert('⚠️ Please fill in all required fields');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);
    console.log('💾 Saving contact:', formData);
    console.log('📋 Post-save actions:', postSaveActions);

    setTimeout(() => {
      setIsSaving(false);
      setHasUnsavedChanges(false);

      if (postSaveActions.createDeal) {
        alert('✅ Contact saved! Creating deal...');
        console.log('🎯 Creating deal for contact...');
        const contactName = `${formData.firstName} ${formData.lastName}`.trim();
        const params = new URLSearchParams({
          contact: formData.email,
          contactName: contactName,
          contactId: formData.email,
          company: formData.company
        });
        navigate(`/crm/deals/create?${params.toString()}`);
      } else if (postSaveActions.scheduleMeeting) {
        alert('✅ Contact saved! Opening meeting scheduler...');
        console.log('📅 Opening meeting scheduler...');
      } else if (postSaveActions.sendWelcomeEmail) {
        alert('✅ Contact saved! Opening email composer...');
        console.log('📧 Opening email composer...');
      } else if (postSaveActions.addToCampaign) {
        alert('✅ Contact saved! Opening campaign selector...');
        console.log('📢 Opening campaign selector...');
      } else {
        alert('✅ Contact saved successfully!');
        if (isEditMode) {
          navigate(`/crm/contacts/${id}`);
        } else {
          navigate('/crm/contacts');
        }
      }
    }, 800);
  };

  const handleSaveAndAddAnother = () => {
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    console.log('💾 Saving contact:', formData);

    setTimeout(() => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      setEnrichmentData(null);
      setDuplicateContact(null);
      setShowDuplicateWarning(false);
      setErrors({});
      setEmailValidation({ status: null, message: '' });

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        mobile: '',
        linkedin: '',
        company: '',
        jobTitle: '',
        department: 'Sales',
        reportsTo: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
        timezone: 'Pacific Time (PT)',
        source: 'Lead Gen Tool (Apollo.io, ZoomInfo)',
        tags: [],
        owner: 'Alex Rodriguez (You)',
        status: 'Active',
        notes: ''
      });
      alert('✅ Contact created! Ready for next contact.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 800);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelModal(true);
    } else {
      navigate('/crm/contacts');
    }
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    navigate('/crm/contacts');
  };

  const handleApplySuggestion = (field: keyof ContactFormData, value: any, suggestionType: string) => {
    console.log(`✅ Applying ${suggestionType}:`, value);
    handleInputChange(field, value);
    alert(`✅ ${suggestionType} applied: ${value}`);
  };

  const handleApplyTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setHasUnsavedChanges(true);
      alert(`✅ Tag added: ${tag}`);
    }
  };

  const handleImportFromLinkedin = () => {
    setShowLinkedinModal(true);
  };

  const handleLinkedinScrape = () => {
    console.log('🔍 Scraping LinkedIn profile:', linkedinUrl);

    setTimeout(() => {
      const mockData = {
        firstName: 'Sarah',
        lastName: 'Lee',
        jobTitle: 'CFO',
        company: 'TechStart Inc',
        city: 'New York',
        state: 'NY'
      };

      setFormData(prev => ({ ...prev, ...mockData, linkedin: linkedinUrl }));
      setHasUnsavedChanges(true);
      setShowLinkedinModal(false);
      setLinkedinUrl('');
      alert('✅ 6 fields populated from LinkedIn profile');
    }, 1500);
  };

  const handleLinkToExistingAccount = () => {
    if (existingAccount) {
      console.log('🔗 Linking to existing account:', existingAccount.name);
      alert(`✅ Contact linked to existing account: ${existingAccount.name}`);
      setExistingAccount({ ...existingAccount, linked: true });
    }
  };

  const handleCreateNewAccount = () => {
    console.log('➕ Creating new account for:', formData.company);
    alert(`Account creation would open here for: ${formData.company}`);
  };

  const handleViewExistingContact = () => {
    if (duplicateContact) {
      window.open(`/crm/contacts/${duplicateContact.id}`, '_blank');
    }
  };

  const handleMergeDuplicate = () => {
    console.log('🔀 Opening merge wizard...');
    alert('Merge wizard would open here to combine contacts');
  };

  const handleSaveAnyway = () => {
    setShowDuplicateWarning(false);
    handleSave();
  };

  const handleViewLinkedInProfile = () => {
    if (enrichmentData?.linkedinProfile?.url) {
      window.open(enrichmentData.linkedinProfile.url, '_blank');
    }
  };

  const handleApplyAllCompanyData = () => {
    if (enrichmentData?.companyInfo) {
      const { name, industry, location } = enrichmentData.companyInfo;
      const [city, state] = location ? location.split(', ') : ['', ''];

      setFormData(prev => ({
        ...prev,
        company: name,
        city: city || prev.city,
        state: state || prev.state
      }));

      setHasUnsavedChanges(true);
      console.log('🏢 Creating account and linking contact...');
      alert(`✅ Company data applied. Account created for ${name}`);
    }
  };

  const handleSetHRMSSource = () => {
    setFormData(prev => ({ ...prev, source: '🏢 HRMS (Recruitment)' }));
    setHasUnsavedChanges(true);
    alert('✅ Source set to HRMS (Recruitment) - Warm intro opportunity!');
  };

  const departments = ['Sales', 'Marketing', 'Engineering', 'HR', 'Finance', 'Operations', 'Customer Success'];
  const sources = [
    'Lead Gen Tool (Apollo.io, ZoomInfo)',
    '🏢 HRMS (Recruitment)',
    'Converted from Lead',
    'Manual Entry',
    'Website Form',
    'Referral',
    'Event/Conference'
  ];
  const statuses = ['Active', 'Inactive', 'Do Not Contact'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <button onClick={() => navigate('/crm/contacts')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Contacts</span>
        </button>
        <div className="mt-2 text-sm text-gray-500">
          Contacts &gt; <span className="text-gray-900 font-medium">{isEditMode ? `${formData.firstName} ${formData.lastName} > Edit` : 'Add New Contact'}</span>
        </div>
      </div>

      {/* Header - STICKY */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <User className="h-8 w-8 text-blue-600" />
            <span>{isEditMode ? `Edit Contact: ${formData.firstName} ${formData.lastName}` : 'Add New Contact'}</span>
          </h1>
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/crm/contacts')} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Cancel
            </button>
            <button onClick={handleSave} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2">
              <Save className="h-5 w-5" />
              <span>Save Contact</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Feature Banner - UNIQUE */}
      {!isEditMode && (
        <div className="max-w-[1800px] mx-auto px-8 pt-6">
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-xl shadow-xl p-4 border-2 border-purple-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white rounded-full p-2">
                  <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg flex items-center space-x-2">
                    <span>⚡ AI-Powered Data Enrichment</span>
                    <span className="px-2 py-0.5 bg-yellow-400 text-purple-900 text-xs font-black rounded-full animate-pulse">AUTOMATIC</span>
                  </h3>
                  <p className="text-purple-100 text-sm">Just type an email - we'll automatically search LinkedIn, company databases, verify deliverability, and find phone numbers in real-time!</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 border border-white/30">
                <p className="text-white text-xs font-bold">NO ACTION REQUIRED</p>
                <p className="text-purple-100 text-xs">Happens automatically ✨</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Form (60%) */}
          <div className="col-span-1 lg:col-span-3 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>👤 Basic Information</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-4 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-4 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Smith"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-2 border ${errors.email || emailValidation.status === 'invalid' ? 'border-red-500' : emailValidation.status === 'undeliverable' ? 'border-orange-500' : emailValidation.status === 'valid' ? 'border-green-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="john@acme.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                {!errors.email && emailValidation.status === 'valid' && (
                  <p className="text-green-600 text-sm mt-2 flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>{emailValidation.message}</span>
                  </p>
                )}
                {!errors.email && emailValidation.status === 'invalid' && (
                  <p className="text-orange-600 text-sm mt-2 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{emailValidation.message}</span>
                  </p>
                )}
                {!errors.email && emailValidation.status === 'undeliverable' && (
                  <p className="text-orange-600 text-sm mt-2 flex items-center space-x-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>⚠️ This email may not be deliverable. Proceed anyway?</span>
                  </p>
                )}
                {/* AI Enrichment Status - UNIQUE FEATURE */}
                {formData.email && formData.email.includes('@') && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
                      <span className="text-sm font-bold text-purple-900">AI-Powered Enrichment</span>
                      <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full animate-pulse">AUTO</span>
                    </div>
                    {isEnriching ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                        <span className="text-xs text-purple-700">Searching LinkedIn, company databases, email verification...</span>
                      </div>
                    ) : enrichmentError ? (
                      <p className="text-xs text-orange-600 font-semibold flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{enrichmentError}</span>
                      </p>
                    ) : enrichmentData ? (
                      <p className="text-xs text-green-700 font-semibold flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>✨ Enrichment complete! Check AI Suggestions panel →</span>
                      </p>
                    ) : (
                      <p className="text-xs text-purple-700">Type an email to trigger automatic AI enrichment</p>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5550123"
                  />
                  {formData.phone && (
                    <p className="text-xs text-gray-500 mt-1">Auto-formatted: {formData.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5559999"
                  />
                  {formData.mobile && (
                    <p className="text-xs text-gray-500 mt-1">Auto-formatted: {formData.mobile}</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn Profile</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    className={`flex-1 px-4 py-2 border ${!linkedinValidation.valid ? 'border-red-500' : linkedinValidation.message ? 'border-green-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="linkedin.com/in/johnsmith"
                  />
                  <button onClick={handleImportFromLinkedin} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium flex items-center space-x-1">
                    <Sparkles className="h-4 w-4" />
                    <span>Auto-populate</span>
                  </button>
                </div>
                {linkedinValidation.message && !linkedinValidation.valid && (
                  <p className="text-orange-600 text-xs mt-1 flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{linkedinValidation.message}</span>
                  </p>
                )}
                {linkedinValidation.message && linkedinValidation.valid && (
                  <p className="text-green-600 text-xs mt-1 flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>{linkedinValidation.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <span>💼 Professional Information</span>
              </h2>
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      onFocus={() => formData.company.length >= 2 && setShowCompanySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)}
                      className={`w-full px-4 py-2 border ${errors.company ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Start typing company name..."
                    />
                    {showCompanySuggestions && companySuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {companySuggestions.map((company) => (
                          <div
                            key={company.id}
                            onClick={() => {
                              handleInputChange('company', company.name);
                              setExistingAccount(company);
                              setShowCompanySuggestions(false);
                            }}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">{company.name}</p>
                            <p className="text-xs text-gray-600">{company.industry} • {company.size}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
                {existingAccount && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    {existingAccount.linked ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="text-sm text-green-900 font-medium">✅ Linked to Account: {existingAccount.name}</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-blue-900 font-medium mb-2">💡 Existing account found: {existingAccount.name}</p>
                        <div className="flex items-center space-x-2">
                          <button onClick={handleLinkToExistingAccount} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center space-x-1">
                            <LinkIcon className="h-3 w-3" />
                            <span>Link to Existing</span>
                          </button>
                          <button onClick={handleCreateNewAccount} className="px-3 py-1.5 bg-white border border-blue-600 text-blue-600 rounded text-xs font-medium hover:bg-blue-50 flex items-center space-x-1">
                            <Plus className="h-3 w-3" />
                            <span>Create New Account</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="VP Sales"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reports To (Optional)</label>
                <input
                  type="text"
                  value={formData.reportsTo}
                  onChange={(e) => handleInputChange('reportsTo', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search for manager..."
                />
              </div>
            </div>

            {/* Location & Contact Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>📍 Location & Contact Details</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Market Street"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="San Francisco"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">State/Province</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="California"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="94103"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>United States</option>
                      <option>Canada</option>
                      <option>United Kingdom</option>
                      <option>Australia</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone (Auto-detected)</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>Pacific Time (PT)</option>
                    <option>Mountain Time (MT)</option>
                    <option>Central Time (CT)</option>
                    <option>Eastern Time (ET)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Categorization */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <Tag className="h-5 w-5 text-blue-600" />
                <span>🏷️ Categorization</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Source <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    className={`w-full px-4 py-2 border ${errors.source ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    {sources.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                  {errors.source && <p className="text-red-500 text-xs mt-1">{errors.source}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (Add multiple)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map(tag => {
                      const tagColors: Record<string, string> = {
                        'VIP': 'bg-yellow-100 text-yellow-800',
                        'Decision Maker': 'bg-blue-100 text-blue-800',
                        'Hot': 'bg-red-100 text-red-800',
                        'Champion': 'bg-green-100 text-green-800',
                        'Tech Savvy': 'bg-purple-100 text-purple-800'
                      };
                      return (
                        <span key={tag} className={`px-3 py-1 ${tagColors[tag] || 'bg-gray-100 text-gray-800'} rounded-full text-sm font-semibold flex items-center space-x-2`}>
                          <span>{tag}</span>
                          <button onClick={() => handleRemoveTag(tag)} className="hover:opacity-70">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                    <button className="px-3 py-1 border-2 border-dashed border-gray-300 text-gray-600 rounded-full hover:border-gray-400 transition-colors text-sm font-semibold">
                      + Add Tag
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Owner</label>
                    <select
                      value={formData.owner}
                      onChange={(e) => handleInputChange('owner', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>Alex Rodriguez (You)</option>
                      <option>Sarah Johnson</option>
                      <option>Mike Chen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>● {status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>📝 Additional Notes</span>
              </h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description/Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Met at SaaS Summit 2024. Very interested in automation features. Budget confirmed."
                />
                <p className="text-xs text-gray-500 mt-2">(Rich text editor: Bold, Italic, Lists, Links)</p>
              </div>
            </div>
          </div>

          {/* Right Column - AI Help (40%) */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Debug Info */}
            {console.log('🎨 RENDER: Right column')}
            {console.log('🎨 enrichmentData:', enrichmentData)}
            {console.log('🎨 isEnriching:', isEnriching)}
            {console.log('🎨 Panel should show?', enrichmentData && (enrichmentData.linkedinFound || (enrichmentData.phones && enrichmentData.phones.length > 0) || enrichmentData.companyInfo))}

            {/* AI Suggestions Panel - Collapsible */}
            {enrichmentData && (enrichmentData.linkedinFound || (enrichmentData.phones && enrichmentData.phones.length > 0) || enrichmentData.companyInfo) && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg border-2 border-purple-200 p-6 sticky top-24">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
                      <h3 className="text-xl font-bold text-gray-900">🤖 AI-Powered Data Enrichment</h3>
                      <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">AUTOMATIC</span>
                    </div>
                    <button
                      onClick={() => setIsAIPanelCollapsed(!isAIPanelCollapsed)}
                      className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                      title={isAIPanelCollapsed ? "Expand AI Panel" : "Collapse AI Panel"}
                    >
                      {isAIPanelCollapsed ? <ChevronDown className="h-5 w-5 text-purple-600" /> : <ChevronRight className="h-5 w-5 text-purple-600 rotate-90" />}
                    </button>
                  </div>
                  <div className="bg-purple-100 border-l-4 border-purple-600 p-3 rounded">
                    <p className="text-xs text-purple-900 font-bold mb-1">⚡ UNIQUE FEATURE - Real-Time Enrichment:</p>
                    <ul className="text-xs text-purple-800 space-y-0.5">
                      <li>✓ Email deliverability verification (Valid/Invalid)</li>
                      <li>✓ LinkedIn profile discovery (Name, Title, Company)</li>
                      <li>✓ Phone numbers (Direct line, Mobile)</li>
                      <li>✓ Company intelligence (Size, Revenue, Industry)</li>
                      <li>✓ Social profiles (Twitter, GitHub)</li>
                      <li>✓ AI-recommended tags (Decision Maker, VIP)</li>
                    </ul>
                    <p className="text-xs text-purple-900 font-bold mt-2 flex items-center space-x-1">
                      <Zap className="h-3 w-3" />
                      <span>ALL AUTOMATIC - No user action required!</span>
                    </p>
                  </div>
                </div>

                {!isAIPanelCollapsed && (
                  <>
                {isEnriching ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600 font-semibold">🔍 Searching multiple data sources...</p>
                    <p className="text-xs text-gray-500 mt-1">LinkedIn • Company Databases • Email Verification</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-3 border-2 border-green-300">
                      <p className="text-sm font-bold text-green-900 flex items-center space-x-1 mb-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>Enrichment Complete for: {formData.email}</span>
                      </p>
                      <p className="text-xs text-green-700">✨ Found {[enrichmentData.linkedinFound ? 'LinkedIn' : null, enrichmentData.phones?.length > 0 ? `${enrichmentData.phones.length} phone(s)` : null, enrichmentData.companyInfo ? 'Company data' : null].filter(Boolean).join(', ')}</p>
                    </div>

                    {/* Email Verification */}
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-1">📧 Email Verification:</p>
                      <p className="text-sm text-green-600 flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>✅ Valid and deliverable</span>
                      </p>
                    </div>

                    {/* LinkedIn Profile */}
                    {enrichmentData.linkedinFound && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">💼 LinkedIn Profile Found:</p>
                        <p className="text-sm text-gray-900 mb-2">{enrichmentData.linkedinProfile.name}</p>
                        <p className="text-sm text-gray-600 mb-3">{enrichmentData.linkedinProfile.title}</p>
                        <div className="flex items-center space-x-2 mb-3">
                          <button onClick={handleViewLinkedInProfile} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 flex items-center space-x-1">
                            <ExternalLink className="h-3 w-3" />
                            <span>View Profile</span>
                          </button>
                        </div>
                        {!isEditMode && (
                          <button
                            onClick={importAllData}
                            className="w-full px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-bold hover:from-green-700 hover:to-emerald-700 flex items-center justify-center space-x-2"
                          >
                            <Sparkles className="h-4 w-4" />
                            <span>✨ Import All Data (Auto-fill Form)</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Phone Numbers */}
                    {enrichmentData.phones && enrichmentData.phones.length > 0 && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">📱 Phone Numbers Found:</p>
                        <div className="space-y-2">
                          {enrichmentData.phones.map((phone: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">• {phone.type}: {phone.number}</span>
                              <button
                                onClick={() => handleApplySuggestion('phone', phone.number, 'Phone number')}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200"
                              >
                                Apply
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Company Information */}
                    {enrichmentData.companyInfo && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">🏢 Company Information:</p>
                        <p className="text-sm font-bold text-gray-900 mb-2">{enrichmentData.companyInfo.name}</p>
                        <ul className="text-xs text-gray-600 space-y-1 mb-3">
                          <li>• Industry: {enrichmentData.companyInfo.industry}</li>
                          <li>• Size: {enrichmentData.companyInfo.size}</li>
                          <li>• Revenue: {enrichmentData.companyInfo.revenue}</li>
                          <li>• Location: {enrichmentData.companyInfo.location}</li>
                        </ul>
                        <button
                          onClick={handleApplyAllCompanyData}
                          className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center space-x-2"
                        >
                          <Building2 className="h-4 w-4" />
                          <span>Apply All Company Data</span>
                        </button>
                      </div>
                    )}

                    {/* Social Media */}
                    {enrichmentData.socialProfiles && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">📊 Social Media Profiles:</p>
                        <div className="space-y-2">
                          {enrichmentData.socialProfiles.twitter && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">• Twitter: {enrichmentData.socialProfiles.twitter}</span>
                              <button className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200">Apply</button>
                            </div>
                          )}
                          {!enrichmentData.socialProfiles.github && (
                            <span className="text-sm text-gray-500">• GitHub: Not found</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recommended Tags */}
                    {enrichmentData.suggestedTags && enrichmentData.suggestedTags.length > 0 && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-3">🎯 Recommended Tags:</p>
                        <p className="text-xs text-gray-600 mb-3">Based on profile analysis:</p>
                        <div className="space-y-3">
                          {enrichmentData.suggestedTags.map((item: any, idx: number) => (
                            <div key={idx} className="pb-3 border-b border-gray-200 last:border-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-sm text-gray-900">{item.tag}</span>
                                <button
                                  onClick={() => handleApplyTag(item.tag)}
                                  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200"
                                >
                                  Apply
                                </button>
                              </div>
                              <p className="text-xs text-gray-600">Why: {item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </>
                )}
              </div>
            )}

            {/* HRMS Connection Panel (UNIQUE FEATURE) */}
            {enrichmentData?.hrmsConnection?.found && !isEditMode && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-lg border-2 border-orange-300 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Building2 className="h-6 w-6 text-orange-600" />
                  <h3 className="text-xl font-bold text-orange-900">🏢 HRMS Connection Found!</h3>
                  <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-bold rounded-full">UNIQUE</span>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg border-2 border-orange-200">
                    <p className="text-sm font-bold text-orange-900 mb-2">
                      {enrichmentData.hrmsConnection.message}
                    </p>
                    <p className="text-xs text-orange-700">
                      Recruited on: {enrichmentData.hrmsConnection.recruitedDate}
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                    <p className="text-sm font-semibold text-yellow-900 mb-2 flex items-center space-x-2">
                      <Lightbulb className="h-4 w-4" />
                      <span>💡 Recommendation:</span>
                    </p>
                    <p className="text-sm text-yellow-800 mb-3">
                      Select <strong>"HRMS (Recruitment)"</strong> as source
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-yellow-700">
                      <span className="font-bold">✨ Advantage:</span>
                      <span>Warm intro opportunity!</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSetHRMSSource}
                    className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-bold text-sm flex items-center justify-center space-x-2"
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Set Source to HRMS (Recruitment)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🔗 Quick Actions</h3>
              <p className="text-sm text-gray-600 mb-4">After saving this contact, you can:</p>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={postSaveActions.createDeal}
                    onChange={(e) => setPostSaveActions(prev => ({ ...prev, createDeal: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">☐ Create a deal for this contact</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={postSaveActions.scheduleMeeting}
                    onChange={(e) => setPostSaveActions(prev => ({ ...prev, scheduleMeeting: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">☐ Schedule a meeting</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={postSaveActions.sendWelcomeEmail}
                    onChange={(e) => setPostSaveActions(prev => ({ ...prev, sendWelcomeEmail: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">☐ Send welcome email</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={postSaveActions.addToCampaign}
                    onChange={(e) => setPostSaveActions(prev => ({ ...prev, addToCampaign: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">☐ Add to email campaign</span>
                </label>
              </div>
            </div>

            {/* Help & Tips */}
            <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>ℹ️ Help & Tips</span>
              </h3>
              <div className="space-y-3 text-sm text-blue-800">
                <p className="font-semibold mb-2">💡 Pro Tips:</p>
                <ul className="space-y-2 ml-4">
                  <li>• Use LinkedIn URL for auto-population</li>
                  <li>• Add tags to organize contacts better</li>
                  <li>• Link to existing account to avoid duplicates</li>
                  <li>• Set yourself as owner to track in your pipeline</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-blue-300">
                  <p className="font-bold text-orange-900 mb-2">🏢 UNIQUE: HRMS Connection</p>
                  <p className="text-sm text-orange-800">
                    If this contact was recruited by your company, select "HRMS (Recruitment)" as source for warm intro advantage!
                  </p>
                </div>
              </div>
            </div>

            {/* Duplicate Check */}
            {showDuplicateWarning && duplicateContact && (
              <div className="bg-yellow-50 rounded-xl shadow-lg border-2 border-yellow-400 p-6 animate-pulse">
                <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span>⚠️ POTENTIAL DUPLICATE</span>
                </h3>
                <p className="text-sm text-yellow-800 mb-4">⚠️ A contact with this email already exists. View existing or save anyway?</p>
                <div className="p-4 bg-white rounded-lg border border-yellow-300 mb-4 space-y-2">
                  <p className="font-bold text-gray-900 text-lg">{duplicateContact.name}</p>
                  <p className="text-sm text-gray-700">{duplicateContact.title}, {duplicateContact.company}</p>
                  <p className="text-sm text-gray-600">Email: {duplicateContact.email}</p>
                  <p className="text-sm text-gray-600">Added: {duplicateContact.added} by {duplicateContact.addedBy}</p>
                  <p className="text-sm text-gray-600">Last contact: {duplicateContact.lastContact}</p>
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <p className="text-sm font-bold text-yellow-700">Similarity: {duplicateContact.similarity}% match</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={handleViewExistingContact} className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium flex items-center justify-center space-x-1">
                    <ExternalLink className="h-4 w-4" />
                    <span>View Existing</span>
                  </button>
                  <button onClick={handleMergeDuplicate} className="flex-1 px-4 py-2 bg-white border-2 border-yellow-600 text-yellow-700 rounded-lg hover:bg-yellow-50 text-sm font-medium">
                    Merge
                  </button>
                  <button onClick={handleSaveAnyway} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                    Save Anyway
                  </button>
                </div>
              </div>
            )}

            {/* No Duplicates Found */}
            {!showDuplicateWarning && formData.email && formData.email.includes('@') && enrichmentData && !isEditMode && (
              <div className="bg-green-50 rounded-xl shadow-sm border-2 border-green-300 p-6">
                <h3 className="text-lg font-bold text-green-900 mb-2 flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>✅ Duplicate Check</span>
                </h3>
                <p className="text-sm text-green-800">⚠️ No existing contact found with this email</p>
                <p className="text-sm font-bold text-green-900 mt-2">✅ Safe to proceed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar (Sticky) */}
      <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 shadow-lg px-8 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span className="text-red-500">*</span> Required fields
          </p>
          <div className="flex items-center space-x-3">
            <button onClick={handleCancel} disabled={isSaving} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
            {!isEditMode && (
              <button onClick={handleSaveAndAddAnother} disabled={isSaving} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-gray-700 border-t-transparent rounded-full"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save & Add Another</span>
                )}
              </button>
            )}
            <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save Contact</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <h3 className="text-xl font-bold text-gray-900">Discard Changes?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. Are you sure you want to leave without saving?
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Keep Editing
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn Import Modal */}
      {showLinkedinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Linkedin className="h-8 w-8 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Import from LinkedIn</h3>
              </div>
              <button onClick={() => setShowLinkedinModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Paste a LinkedIn profile URL to automatically populate contact information
            </p>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowLinkedinModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkedinScrape}
                disabled={!linkedinUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar - Mobile Optimized */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl px-6 py-4 z-40 lg:hidden">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <button
            onClick={handleCancel}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span>{isSaving ? 'Saving...' : 'Save Contact'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditContactPage;
