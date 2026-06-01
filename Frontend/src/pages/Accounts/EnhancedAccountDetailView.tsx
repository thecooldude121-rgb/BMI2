import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, TrendingUp,
  Users, DollarSign, Calendar, Edit, MoreVertical, ExternalLink,
  Plus, Star, Target, Briefcase, FileText, MessageSquare,
  TrendingDown, AlertCircle, CheckCircle2, Eye, Download,
  Upload, ChevronDown, ChevronRight, GitMerge, Trash2, Copy, Archive
} from 'lucide-react';
import { useAccounts } from '../../contexts/AccountsContext';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import AIAccountInsightsPanel from '../../components/Accounts/AIAccountInsightsPanel';
import HRMSIntelligencePanel from '../../components/Accounts/HRMSIntelligencePanel';
import CompanyInformationPanel from '../../components/Accounts/CompanyInformationPanel';
import ActiveDealsSection from '../../components/Accounts/ActiveDealsSection';
import EnhancedContactsSection from '../../components/Accounts/EnhancedContactsSection';
import OrganizationChart from '../../components/Accounts/OrganizationChart';
import RecentActivitiesTimeline from '../../components/Accounts/RecentActivitiesTimeline';
import SimilarAccountsPanel from '../../components/Accounts/SimilarAccountsPanel';
import DataSourcesPanel from '../../components/Accounts/DataSourcesPanel';
import EnhancedMetricsBar from '../../components/Accounts/EnhancedMetricsBar';
import LastInteractionBar from '../../components/Accounts/LastInteractionBar';

type TabType = 'overview' | 'contacts' | 'deals' | 'activities' | 'hrms' | 'docs';

const EnhancedAccountDetailView: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { getAccountById, getAccountContacts, getAccountDeals } = useAccounts();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showOrgChart, setShowOrgChart] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const account = accountId ? getAccountById(accountId) : undefined;
  const contacts = accountId ? getAccountContacts(accountId) : [];
  const deals = accountId ? getAccountDeals(accountId) : [];

  const handleCreateDeal = () => {
    navigate(`/crm/deals/create?accountId=${accountId}&accountName=${account?.name}`);
  };

  const handleAddContact = () => {
    navigate(`/crm/contacts/new?accountId=${accountId}&accountName=${account?.name}`);
  };

  const handleSendEmail = () => {
    setShowEmailModal(true);
  };

  const handleScheduleMeeting = () => {
    setShowMeetingModal(true);
  };

  const handleUploadDocument = () => {
    alert('Document upload functionality coming soon');
  };

  const handleViewHRMSDetails = () => {
    setActiveTab('hrms');
    setTimeout(() => {
      const hrmsSection = document.getElementById('hrms-intelligence');
      if (hrmsSection) {
        hrmsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleEditAccount = () => {
    navigate(`/crm/accounts/${accountId}/edit`);
  };

  const handleMergeAccount = () => {
    navigate(`/crm/accounts/${accountId}/merge`);
  };

  const handleDeleteAccount = () => {
    if (window.confirm(`Are you sure you want to delete "${account?.name}"?`)) {
      alert('Delete functionality will be implemented with backend integration');
      navigate('/crm/accounts');
    }
  };

  const handleDuplicateAccount = () => {
    alert('Duplicate account functionality coming soon');
  };

  const handleArchiveAccount = () => {
    if (window.confirm(`Are you sure you want to archive "${account?.name}"?`)) {
      alert('Archive functionality will be implemented with backend integration');
    }
  };

  const handleSearchLinkedIn = () => {
    const query = encodeURIComponent(`${account?.name} employees`);
    window.open(`https://www.linkedin.com/search/results/people/?keywords=${query}`, '_blank');
  };

  const handleAskForIntro = () => {
    alert('Request introduction functionality coming soon');
  };

  const handleExpandOrgChart = () => {
    setShowOrgChart(!showOrgChart);
  };

  const handleFindMissingContacts = () => {
    alert('Find missing contacts functionality coming soon');
  };

  const handleViewAllActivities = () => {
    navigate(`/crm/activities?accountId=${accountId}`);
  };

  const handleLogActivity = () => {
    alert('Log activity functionality coming soon');
  };

  if (!account) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Account not found</p>
          <button
            onClick={() => navigate('/crm/accounts')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-green-500';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreLabel = (score?: number) => {
    if (!score) return 'N/A';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Attention';
    return 'At Risk';
  };

  const formatRevenue = (amount?: number) => {
    if (!amount) return 'Not specified';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  // Mock metrics - Replace with real data
  const metrics = {
    totalPipeline: deals?.reduce((sum, deal) => sum + (deal.amount || 0), 0) || 0,
    activeDeals: deals?.length || 0,
    contacts: contacts?.length || 0,
    meetingsThisQuarter: 12,
    responseRate: 85
  };

  const enhancedMetrics = [
    {
      title: 'Total Pipeline',
      value: formatRevenue(metrics.totalPipeline),
      details: [
        { label: 'Deal 1', value: deals?.[0] ? formatRevenue(deals[0].amount) : '-' },
        { label: 'Deal 2', value: deals?.[1] ? formatRevenue(deals[1].amount) : '-' }
      ],
      trend: { direction: 'up' as const, value: '+5%' }
    },
    {
      title: 'Active Deals',
      value: metrics.activeDeals.toString(),
      details: [
        { label: 'Weighted', value: formatRevenue(metrics.totalPipeline * 0.67) },
        { label: 'Prob Avg', value: '61%' }
      ]
    },
    {
      title: 'Contacts',
      value: metrics.contacts.toString(),
      details: [
        { label: 'Decision Makers', value: '1' },
        { label: 'Influencers', value: '2' },
        { label: 'Missing', value: '2' }
      ]
    },
    {
      title: 'Meetings This Qtr',
      value: metrics.meetingsThisQuarter.toString(),
      details: [
        { label: 'Discovery', value: '3' },
        { label: 'Demo', value: '4' },
        { label: 'Proposal', value: '3' },
        { label: 'Negotiation', value: '2' }
      ]
    },
    {
      title: 'Response Rate',
      value: `${metrics.responseRate}%`,
      details: [
        { label: 'Avg Response', value: '3.2hrs' },
        { label: 'Trend', value: '+12%' }
      ],
      trend: { direction: 'up' as const, value: '+12%' }
    }
  ];

  const similarAccounts = [
    {
      id: 'similar-1',
      name: 'FinnovateX',
      similarity: 87,
      industry: 'FinTech',
      employeeCount: 50,
      hasHRMSConnection: true,
      recruitedCount: 2,
      dealValue: 55000,
      daysToClose: 35,
      keySuccess: 'CEO intro from recruited employee'
    },
    {
      id: 'similar-2',
      name: 'BankTech Solutions',
      similarity: 82,
      industry: 'Banking Software',
      employeeCount: 40,
      hasHRMSConnection: true,
      recruitedCount: 1,
      dealValue: 48000,
      daysToClose: 40,
      keySuccess: 'Strong HRMS relationship'
    }
  ];

  const dataSources = [
    { name: 'LinkedIn', status: 'active' as const, lastUpdated: '2 hours ago', url: 'https://linkedin.com' },
    { name: 'Crunchbase', status: 'active' as const, lastUpdated: '2 hours ago', url: 'https://crunchbase.com' },
    { name: 'Clearbit', status: 'active' as const, lastUpdated: '2 hours ago' },
    { name: 'HRMS Module', status: 'active' as const, lastUpdated: '2 hours ago' },
    { name: 'Google News', status: 'active' as const, lastUpdated: '2 hours ago' }
  ];

  // Mock data for new components
  const mockDeals = deals?.map(deal => ({
    id: deal.id,
    name: deal.name,
    stage: deal.stage || 'Qualification',
    value: deal.amount || 0,
    closeDate: new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    probability: 70,
    health: 'good' as const,
    lastActivity: '2 days ago',
    daysInStage: 15,
    nextStep: 'Schedule demo with decision maker'
  })) || [];

  const mockContacts = contacts?.map((contact, idx) => ({
    id: contact.id,
    name: contact.name,
    title: contact.title || 'Contact',
    email: contact.email,
    phone: contact.phone,
    role: idx === 0 ? 'decision-maker' as const : idx === 1 ? 'champion' as const : 'influencer' as const,
    isHRMSConnection: account.hrmsConnection?.hasConnection && idx === 1,
    engagementScore: idx === 0 ? 95 : idx === 1 ? 90 : 75,
    lastContactDate: '3 days ago',
    totalInteractions: 12
  })) || [];

  const mockActivities = [
    {
      id: '1',
      type: 'meeting' as const,
      title: 'Product Demo with Sarah Chen',
      description: 'Demonstrated key features for Q1 expansion',
      contactName: 'Sarah Chen',
      timestamp: '2 hours ago',
      aiSummary: 'Positive meeting. Sarah showed strong interest in enterprise features. Identified 3 key pain points we can solve.',
      outcome: 'Sarah committed to scheduling follow-up with CEO',
      nextSteps: ['Send follow-up email with pricing', 'Schedule CEO meeting']
    },
    {
      id: '2',
      type: 'email' as const,
      title: 'Proposal sent',
      contactName: 'Sarah Chen',
      timestamp: '1 day ago',
      aiSummary: 'Sent comprehensive proposal for $180K deal. Highlighted ROI and implementation timeline.'
    },
    {
      id: '3',
      type: 'call' as const,
      title: 'Discovery call',
      contactName: 'John Smith',
      timestamp: '3 days ago',
      aiSummary: 'Initial discovery call went well. Company is scaling fast and needs better tools.',
      nextSteps: ['Share case studies', 'Intro to Sarah Chen']
    }
  ];

  const mockOrgChart = {
    id: 'ceo',
    name: 'John Smith',
    title: 'CEO',
    department: 'Executive',
    isContact: true,
    role: 'decision-maker' as const,
    email: 'john@company.com',
    reports: [
      {
        id: 'vp-hr',
        name: 'Sarah Chen',
        title: 'VP of HR',
        department: 'Human Resources',
        isContact: true,
        role: 'champion' as const,
        email: 'sarah@company.com',
        phone: '555-0123',
        reports: []
      },
      {
        id: 'cto',
        name: 'Mike Johnson',
        title: 'CTO',
        department: 'Technology',
        isContact: true,
        role: 'influencer' as const,
        email: 'mike@company.com',
        reports: []
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/crm/accounts')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Accounts</span>
          </button>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span>Accounts</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{account.name}</span>
          </div>
        </div>

        {/* Hero Header Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
              {/* Left: Company Info */}
              <div className="flex items-start space-x-4 mb-4 md:mb-0">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {account.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center space-x-2">
                    <Building2 className="h-7 w-7 text-blue-600" />
                    <span>{account.name}</span>
                  </h1>
                  <p className="text-gray-600 mt-1">{account.industry}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {account.billingAddress.city}, {account.billingAddress.state}
                    </span>
                    {account.website && (
                      <a
                        href={account.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        {account.website.replace('https://', '').replace('http://', '')}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                    <span className="text-gray-700">
                      <Users className="h-4 w-4 inline mr-1" />
                      {account.employeeCount || 0} employees
                    </span>
                    <span className="text-gray-700">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      {formatRevenue(account.annualRevenue)}/year
                    </span>
                    {account.customFields?.growth_rate && (
                      <span className="text-green-600 font-medium">
                        <TrendingUp className="h-4 w-4 inline mr-1" />
                        Growth: {account.customFields.growth_rate}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleEditAccount}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title="Edit Account"
                >
                  <Edit className="h-5 w-5 text-gray-600" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="More Actions"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-600" />
                  </button>

                  {/* Actions Dropdown Menu */}
                  {showActionsMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowActionsMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              handleMergeAccount();
                              setShowActionsMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <GitMerge className="h-4 w-4 mr-3" />
                            Merge with Another
                          </button>
                          <button
                            onClick={() => {
                              handleDuplicateAccount();
                              setShowActionsMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <Copy className="h-4 w-4 mr-3" />
                            Duplicate Account
                          </button>
                          <button
                            onClick={() => {
                              handleArchiveAccount();
                              setShowActionsMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <Archive className="h-4 w-4 mr-3" />
                            Archive Account
                          </button>
                          <div className="border-t border-gray-200 my-1" />
                          <button
                            onClick={() => {
                              handleDeleteAccount();
                              setShowActionsMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <Trash2 className="h-4 w-4 mr-3" />
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tags and Owner */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                Enterprise
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                High Priority
              </span>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                Hot
              </span>
              <span className="text-sm text-gray-600 ml-4">
                Owner: <span className="font-medium text-gray-900">Alex Rodriguez (You)</span>
              </span>
            </div>

            {/* Account Health Score */}
            <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
              <span className="text-2xl">🤖</span>
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">Account Health:</span>
                  <span className={`text-2xl font-bold ${getHealthScoreColor(account.healthScore)}`}>
                    {account.healthScore || 0}/100
                  </span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor((account.healthScore || 0) / 20)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* HRMS Connection Highlight */}
            {account.hrmsConnection?.hasConnection && (
              <div className="bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50 border-2 border-orange-400 rounded-lg p-6 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="text-4xl animate-bounce-slow">🏢</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <h3 className="text-xl font-bold text-orange-900">
                        HRMS CONNECTION - WARM RELATIONSHIP
                      </h3>
                      <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded">
                        UNIQUE
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-orange-800">
                        ✨ Recruited: {account.hrmsConnection.recruitedContacts?.map(c => `${c.name} (${c.position})`).join(', ')} - Nov 2024
                      </p>
                      <p className="text-sm font-semibold text-orange-700">
                        💡 Leverage recruitment relationship in outreach
                      </p>
                    </div>
                    <button
                      onClick={handleViewHRMSDetails}
                      className="mt-4 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700"
                    >
                      View HRMS Details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCreateDeal}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Create Deal
              </button>
              <button
                onClick={handleAddContact}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Users className="h-4 w-4 mr-2" />
                Add Contact
              </button>
              <button
                onClick={handleSendEmail}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </button>
              <button
                onClick={handleScheduleMeeting}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </button>
              <button
                onClick={handleUploadDocument}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Bar */}
        <EnhancedMetricsBar metrics={enhancedMetrics} />

        {/* Last Interaction Bar */}
        <div className="mt-6 mb-6">
          <LastInteractionBar
            lastInteractionDate="Nov 14, 2025"
            daysAgo={2}
            engagementScore={95}
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-x-auto">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'overview', label: 'Overview', icon: Eye },
              { key: 'contacts', label: 'Contacts', icon: Users },
              { key: 'deals', label: 'Deals', icon: DollarSign },
              { key: 'activities', label: 'Activities', icon: MessageSquare },
              { key: 'hrms', label: 'HRMS', icon: Building2 },
              { key: 'docs', label: 'Documents', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Two Column Layout - Responsive based on active tab */}
        <div className={`grid gap-6 ${(activeTab === 'overview' || activeTab === 'contacts') ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Left Column */}
          <div className={`space-y-6 ${(activeTab === 'overview' || activeTab === 'contacts') ? 'lg:col-span-2' : 'col-span-1'}`}>
            {activeTab === 'overview' && (
              <>
                {/* HRMS Intelligence Panel */}
                {account.hrmsConnection?.hasConnection && (
                  <HRMSIntelligencePanel
                    hasConnection={true}
                    connectedSince="June 2024"
                    contactName="Sarah Chen"
                    contactRole="VP of HR"
                    employeeCount={account.employeeCount}
                    recentHires={35}
                    attritionRate={8}
                  />
                )}

                {/* Active Deals Section */}
                <ActiveDealsSection
                  deals={mockDeals}
                  onDealClick={(id) => navigate(`/crm/deals/${id}`)}
                  onAddDeal={handleCreateDeal}
                />

                {/* Enhanced Contacts Section */}
                <EnhancedContactsSection
                  contacts={mockContacts}
                  onContactClick={(id) => navigate(`/crm/contacts/${id}`)}
                  onAddContact={handleAddContact}
                  onSearchLinkedIn={handleSearchLinkedIn}
                  onAskForIntro={handleAskForIntro}
                  onExpandOrgChart={handleExpandOrgChart}
                  onFindMissingContacts={handleFindMissingContacts}
                  onViewAllActivities={handleViewAllActivities}
                />

                {/* Organization Chart */}
                <OrganizationChart
                  data={mockOrgChart}
                  onContactClick={(id) => navigate(`/crm/contacts/${id}`)}
                  showExpanded={true}
                />

                {/* Recent Activities Timeline */}
                <RecentActivitiesTimeline
                  activities={mockActivities}
                  onActivityClick={(id) => console.log('Activity clicked:', id)}
                  onViewAll={handleViewAllActivities}
                  onLogActivity={handleLogActivity}
                  maxItems={10}
                />
              </>
            )}

            {activeTab === 'contacts' && (
              <>
                {/* Legacy content - keep for now */}
                {account.hrmsConnection?.hasConnection && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Building2 className="h-6 w-6 mr-2 text-orange-600" />
                      HRMS INTELLIGENCE
                      <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                        UNIQUE DIFFERENTIATOR
                      </span>
                    </h2>

                    {/* Recruitment Relationship */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">━━</span> Recruitment Relationship <span className="ml-2">━━━━━━━━━━</span>
                      </h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-green-600">🟢</span>
                          <span className="font-semibold text-green-900">Status: Active HRMS Connection</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">✨ Recruited Employees:</h4>

                        {account.hrmsConnection.recruitedContacts?.map((contact, idx) => (
                          <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-lg font-bold text-gray-900">{idx + 1}. {contact.name}</p>
                                  <p className="text-sm text-gray-700">Position: {contact.position} at {account.name}</p>
                                  <p className="text-sm text-gray-700">Recruited: Nov 14, 2024</p>
                                  <p className="text-sm text-gray-700">By: Jane Wilson (HR Manager)</p>
                                  <p className="text-sm text-gray-700">Current: Works at Your Company</p>
                                  <p className="text-sm text-green-700 font-medium">Status: ✅ Active employee</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <button
                                  onClick={() => alert('HRMS profile integration coming soon')}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                  View Employee Profile in HRMS
                                </button>
                                <button
                                  onClick={handleSendEmail}
                                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                                >
                                  Contact {contact.name.split(' ')[0]} for Intro
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strategic Advantage */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">━━</span> Strategic Advantage <span className="ml-2">━━━━━━━━━</span>
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-3">💡 How to Leverage:</h4>
                        <ul className="space-y-2 text-sm text-blue-800">
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Reference recruitment in outreach</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Ask Sarah for warm introduction</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Mention shared relationship</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Higher trust = Faster sales cycle</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* HRMS Connection Impact */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">📊 HRMS Connection Impact:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="text-2xl font-bold text-green-700">67%</div>
                          <div className="text-sm text-green-800">Deal close rate</div>
                          <div className="text-xs text-green-600 mt-1">(vs 35% avg)</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="text-2xl font-bold text-blue-700">30 days</div>
                          <div className="text-sm text-blue-800">Sales cycle</div>
                          <div className="text-xs text-blue-600 mt-1">(vs 45 days avg)</div>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <div className="text-2xl font-bold text-purple-700">+32%</div>
                          <div className="text-sm text-purple-800">Win probability</div>
                          <div className="text-xs text-purple-600 mt-1">higher than avg</div>
                        </div>
                      </div>
                    </div>

                    {/* Recruitment History */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">━━</span> Recruitment History <span className="ml-2">━━━━━━━━━</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total recruited from {account.name}</p>
                          <p className="text-xl font-bold text-gray-900">{account.hrmsConnection.recruitedEmployees || 1} employee</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Date range</p>
                          <p className="text-xl font-bold text-gray-900">2024</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Retention rate</p>
                          <p className="text-xl font-bold text-green-600">100%</p>
                          <p className="text-xs text-gray-600">(all still employed)</p>
                        </div>
                      </div>
                    </div>

                    {/* Future Opportunities */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">🎯 Future Opportunities:</h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <ul className="space-y-2 text-sm text-yellow-800">
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{account.name} is growing (+45% YoY)</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Likely hiring more talent</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Target for future recruitment</span>
                          </li>
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Build deeper relationship</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-6">
                      <button
                        onClick={() => alert('Full HRMS report will open in new tab')}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      >
                        View Full HRMS Report
                      </button>
                      <button
                        onClick={() => alert('Add recruitment target functionality coming soon')}
                        className="px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50"
                      >
                        Add Recruitment Target
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Deals Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <DollarSign className="h-6 w-6 mr-2 text-green-600" />
                      ACTIVE DEALS ({deals?.length || 0})
                    </h2>
                    <button
                      onClick={() => navigate(`/crm/deals?accountId=${accountId}`)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>

                  {deals && deals.length > 0 ? (
                    <div className="space-y-4">
                      {deals.map((deal, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{deal.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">Owner: Alex Rodriguez (You)</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Value</p>
                                <p className="text-lg font-bold text-gray-900">{formatRevenue(deal.amount)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Stage</p>
                                <p className="text-lg font-semibold text-blue-600">{deal.stage}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Close Date</p>
                                <p className="font-medium text-gray-900">
                                  {new Date(deal.closeDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Contact</p>
                                <p className="font-medium text-gray-900">Sarah Lee (CFO)</p>
                              </div>
                            </div>

                            {/* AI Deal Health */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">🤖 AI Deal Health:</span>
                                <span className="text-lg font-bold text-green-600">85/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div className="bg-green-500 h-3 rounded-full" style={{ width: '85%' }}></div>
                              </div>
                              <p className="text-sm text-green-600 font-medium mt-1">Very Good</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t border-gray-100">
                              <div>
                                <p className="text-gray-600">Win Probability</p>
                                <p className="font-bold text-green-600">67%</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Days in Stage</p>
                                <p className="font-medium text-gray-900">12 days</p>
                              </div>
                            </div>

                            {account.hrmsConnection?.hasConnection && (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                                <p className="text-sm font-semibold text-orange-900 mb-2">🏢 HRMS Advantage Active:</p>
                                <ul className="space-y-1 text-xs text-orange-800">
                                  <li>• Used recruitment relationship in outreach</li>
                                  <li>• Sarah provided warm intro to decision makers</li>
                                  <li>• Win probability +32% vs cold outreach</li>
                                </ul>
                              </div>
                            )}

                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => navigate(`/crm/deals/${deal.id}`)}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                              >
                                View Full Deal
                              </button>
                              <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                                Update Stage
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No active deals</p>
                    </div>
                  )}

                  <button className="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600">
                    <Plus className="h-4 w-4 inline mr-2" />
                    Create New Deal
                  </button>
                </div>

                {/* Contacts Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <Users className="h-6 w-6 mr-2 text-blue-600" />
                      CONTACTS AT THIS ACCOUNT ({contacts?.length || 0})
                    </h2>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View All
                    </button>
                  </div>

                  {contacts && contacts.length > 0 ? (
                    <div className="space-y-4">
                      {contacts.slice(0, 3).map((contact, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-lg font-bold text-blue-600">
                                  {contact.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900">{contact.name}</h3>
                              <p className="text-sm text-gray-600">{contact.role}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <a href={`mailto:${contact.email}`} className="flex items-center hover:text-blue-600">
                                  <Mail className="h-4 w-4 mr-1" />
                                  {contact.email}
                                </a>
                                {contact.phone && (
                                  <a href={`tel:${contact.phone}`} className="flex items-center hover:text-blue-600">
                                    <Phone className="h-4 w-4 mr-1" />
                                    {contact.phone}
                                  </a>
                                )}
                              </div>

                              {/* HRMS Recruited Badge */}
                              {account.hrmsConnection?.recruitedContacts?.some(rc => rc.name === contact.name) && (
                                <div className="mt-3 bg-orange-50 border border-orange-300 rounded-lg p-3">
                                  <p className="text-sm font-bold text-orange-900 mb-1">
                                    🏢 RECRUITED FROM THIS COMPANY (Nov 2024)
                                  </p>
                                  <p className="text-xs text-orange-800">✨ Now works at your company!</p>
                                  <p className="text-xs text-orange-800">💡 Can provide warm introductions</p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                <div>
                                  <p className="text-gray-600">Relationship</p>
                                  <div className="flex items-center mt-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                      />
                                    ))}
                                    <span className="ml-2 text-xs font-medium">Excellent</span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-gray-600">Last Contact</p>
                                  <p className="font-medium text-gray-900 mt-1">Nov 14, 2025</p>
                                  <p className="text-xs text-gray-600">(2 days ago)</p>
                                </div>
                              </div>

                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                  View Contact
                                </button>
                                <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                                  Email
                                </button>
                                {account.hrmsConnection?.recruitedContacts?.some(rc => rc.name === contact.name) ? (
                                  <button className="px-3 py-1 bg-orange-100 border border-orange-300 text-orange-700 text-sm rounded hover:bg-orange-200">
                                    Internal Chat
                                  </button>
                                ) : (
                                  <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                                    Schedule Meeting
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No contacts yet</p>
                    </div>
                  )}

                  <button className="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600">
                    <Plus className="h-4 w-4 inline mr-2" />
                    Add New Contact
                  </button>

                  {/* Missing Key Contacts */}
                  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">🔍 Missing Key Contacts:</h4>
                    <p className="text-sm text-yellow-800 mb-3">🤖 AI suggests finding:</p>
                    <ul className="space-y-1 text-sm text-yellow-800">
                      <li>• CEO (Decision maker for large deals)</li>
                      <li>• VP Product (Stakeholder for features)</li>
                    </ul>
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700">
                        Search LinkedIn
                      </button>
                      <button className="px-3 py-1 border border-yellow-400 text-yellow-700 text-sm rounded hover:bg-yellow-100">
                        Ask Sarah for Intro
                      </button>
                    </div>
                  </div>
                </div>

                {/* Organization Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <Target className="h-6 w-6 mr-2 text-purple-600" />
                      ORGANIZATION CHART
                    </h2>
                    <button
                      onClick={() => setShowOrgChart(!showOrgChart)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                    >
                      {showOrgChart ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                      {showOrgChart ? 'Collapse' : 'Expand'}
                    </button>
                  </div>

                  {showOrgChart && (
                    <>
                      <p className="text-sm text-gray-600 mb-6">(Built from contacts + AI suggestions)</p>

                      <div className="space-y-6">
                        {/* CEO Level */}
                        <div className="flex flex-col items-center">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
                            <p className="font-medium text-gray-700">[Unknown CEO]</p>
                            <p className="text-xs text-gray-500 mt-1">🤖 Need to identify</p>
                          </div>
                          <div className="w-0.5 h-8 bg-gray-300"></div>
                        </div>

                        {/* Executive Level */}
                        <div className="flex justify-center gap-8">
                          {/* Sarah Lee */}
                          <div className="flex flex-col items-center">
                            <div className="border-2 border-orange-300 rounded-lg p-4 text-center bg-orange-50">
                              <p className="font-bold text-orange-900">Sarah Lee</p>
                              <p className="text-sm text-orange-700">CFO</p>
                              <div className="flex justify-center mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                ))}
                              </div>
                              <p className="text-xs text-orange-700 mt-2 font-semibold">(Former - Now at Your Co.)</p>
                            </div>
                          </div>

                          {/* Mike Chen */}
                          <div className="flex flex-col items-center">
                            <div className="border-2 border-blue-300 rounded-lg p-4 text-center bg-blue-50">
                              <p className="font-bold text-blue-900">Mike Chen</p>
                              <p className="text-sm text-blue-700">CTO</p>
                              <div className="flex justify-center mt-1">
                                {[...Array(4)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                ))}
                                <Star className="h-3 w-3 text-gray-300" />
                              </div>
                              <p className="text-xs text-blue-700 mt-2">(Current Contact)</p>
                            </div>
                            <div className="w-0.5 h-8 bg-gray-300"></div>
                          </div>

                          {/* Lisa Wang */}
                          <div className="flex flex-col items-center">
                            <div className="border-2 border-green-300 rounded-lg p-4 text-center bg-green-50">
                              <p className="font-bold text-green-900">Lisa Wang</p>
                              <p className="text-sm text-green-700">VP Ops</p>
                              <div className="flex justify-center mt-1">
                                {[...Array(3)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                ))}
                                {[...Array(2)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 text-gray-300" />
                                ))}
                              </div>
                              <p className="text-xs text-green-700 mt-2">(Current Contact)</p>
                            </div>
                          </div>
                        </div>

                        {/* VP Product - AI Suggested */}
                        <div className="flex flex-col items-center">
                          <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 text-center bg-purple-50">
                            <p className="font-medium text-purple-700">[Unknown VP Product]</p>
                            <p className="text-xs text-purple-600 mt-1">🤖 Suggested</p>
                          </div>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="mt-6 bg-gray-50 rounded-lg p-4 text-xs">
                        <p className="font-semibold text-gray-900 mb-2">Legend:</p>
                        <div className="space-y-1 text-gray-700">
                          <p>⭐⭐⭐⭐⭐ = Known contact, strong relationship</p>
                          <p>⭐⭐⭐⭐ = Known contact, good relationship</p>
                          <p>🤖 = AI-suggested, not yet in CRM</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                          Expand Org Chart
                        </button>
                        <button className="px-4 py-2 border border-purple-300 text-purple-700 text-sm rounded-lg hover:bg-purple-50">
                          Find Missing Contacts
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <MessageSquare className="h-6 w-6 mr-2 text-green-600" />
                    RECENT ACTIVITIES
                  </h2>

                  <div className="space-y-4">
                    {/* Activity 1 */}
                    <div className="flex items-start space-x-3 pb-4 border-b border-gray-100">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Nov 14, 3:00 PM</p>
                        <p className="font-medium text-gray-900 mt-1">
                          📧 Email: Sent proposal to Sarah Lee
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          Subject: "Growth Plan Proposal for TechStart"
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Status: ✅ Opened (Nov 14, 4:15 PM)
                        </p>
                        <button className="text-sm text-blue-600 hover:text-blue-700 mt-2">
                          View Email →
                        </button>
                      </div>
                    </div>

                    {/* Activity 2 */}
                    <div className="flex items-start space-x-3 pb-4 border-b border-gray-100">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Nov 13, 2:00 PM</p>
                        <p className="font-medium text-gray-900 mt-1">
                          📞 Call: Mike Chen - Technical discussion
                        </p>
                        <p className="text-sm text-gray-700 mt-1">Duration: 20 minutes</p>
                        <p className="text-sm text-gray-700">Notes: "Discussed integration requirements"</p>
                        <button className="text-sm text-blue-600 hover:text-blue-700 mt-2">
                          View Details →
                        </button>
                      </div>
                    </div>

                    {/* Activity 3 */}
                    <div className="flex items-start space-x-3 pb-4 border-b border-gray-100">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Nov 12, 10:00 AM</p>
                        <p className="font-medium text-gray-900 mt-1">
                          🎤 Meeting: TechStart - Discovery Call
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          Attendees: Sarah Lee, Mike Chen
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          🤖 AI Summary: Budget confirmed, timeline Q1
                        </p>
                        <p className="text-sm text-gray-700">
                          Sentiment: 😊 Positive (82%)
                        </p>
                        <button className="text-sm text-blue-600 hover:text-blue-700 mt-2">
                          View AI Notes →
                        </button>
                      </div>
                    </div>

                    {/* Activity 4 */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Nov 10, 4:00 PM</p>
                        <p className="font-medium text-gray-900 mt-1">
                          👤 Contact Added: Lisa Wang (VP Operations)
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          Source: Referral from Sarah Lee
                        </p>
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    View All Activities
                  </button>
                </div>
              </>
            )}

            {activeTab === 'deals' && (
              <>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <DollarSign className="h-7 w-7 mr-3 text-green-600" />
                      All Deals with {account.name}
                    </h2>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      New Deal
                    </button>
                  </div>

                  {/* Deal Statistics */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-700">{deals?.length || 0}</div>
                      <div className="text-sm text-green-800">Active Deals</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-700">{formatRevenue(metrics.totalPipeline)}</div>
                      <div className="text-sm text-blue-800">Total Value</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-700">67%</div>
                      <div className="text-sm text-purple-800">Avg Win Rate</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-700">30d</div>
                      <div className="text-sm text-orange-800">Avg Sales Cycle</div>
                    </div>
                  </div>

                  {/* Deals List */}
                  {deals && deals.length > 0 ? (
                    <div className="space-y-6">
                      {deals.map((deal, idx) => (
                        <div key={idx} className="border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{deal.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">Owner: Alex Rodriguez (You)</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">{formatRevenue(deal.amount)}</div>
                              <div className="text-sm text-gray-600">Deal Value</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                            <div>
                              <p className="text-sm text-gray-600">Stage</p>
                              <p className="text-lg font-semibold text-blue-600">{deal.stage}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Close Date</p>
                              <p className="font-medium text-gray-900">
                                {new Date(deal.closeDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Win Probability</p>
                              <p className="font-bold text-green-600">67%</p>
                            </div>
                          </div>

                          {/* AI Deal Health */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">AI Deal Health:</span>
                              <span className="text-lg font-bold text-green-600">85/100</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div className="bg-green-500 h-3 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                            <p className="text-sm text-green-600 font-medium mt-1">Very Good - On Track</p>
                          </div>

                          {account.hrmsConnection?.hasConnection && (
                            <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mb-4">
                              <p className="text-sm font-bold text-orange-900 mb-2">
                                HRMS Advantage Active:
                              </p>
                              <ul className="space-y-1 text-sm text-orange-800">
                                <li>• Leveraged recruitment relationship in outreach</li>
                                <li>• Sarah provided warm intro to decision makers</li>
                                <li>• Win probability +32% vs cold outreach</li>
                              </ul>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            <div>
                              <p className="text-gray-600">Next Step</p>
                              <p className="font-medium text-gray-900">Demo scheduled for Nov 20</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Days in Stage</p>
                              <p className="font-medium text-gray-900">12 days</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/crm/deals/${deal.id}`)}
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              View Full Deal
                            </button>
                            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                              Update Stage
                            </button>
                            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                              Add Note
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No deals yet</p>
                      <p className="text-sm mt-2">Create your first deal with this account</p>
                      <button className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <Plus className="h-4 w-4 inline mr-2" />
                        Create First Deal
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'activities' && (
              <>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <MessageSquare className="h-7 w-7 mr-3 text-green-600" />
                      Activity Timeline
                    </h2>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Log Activity
                    </button>
                  </div>

                  {/* Activity Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <Mail className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                      <div className="text-2xl font-bold text-blue-700">24</div>
                      <div className="text-xs text-blue-800">Emails</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <Phone className="h-6 w-6 mx-auto text-green-600 mb-2" />
                      <div className="text-2xl font-bold text-green-700">8</div>
                      <div className="text-xs text-green-800">Calls</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                      <Calendar className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                      <div className="text-2xl font-bold text-purple-700">5</div>
                      <div className="text-xs text-purple-800">Meetings</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                      <FileText className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                      <div className="text-2xl font-bold text-orange-700">12</div>
                      <div className="text-xs text-orange-800">Notes</div>
                    </div>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-2 mb-6 flex-wrap">
                    <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                      All Activities
                    </button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                      Emails
                    </button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                      Calls
                    </button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                      Meetings
                    </button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                      Notes
                    </button>
                  </div>

                  {/* Activities Timeline */}
                  <div className="space-y-6">
                    {/* Activity 1 - Email */}
                    <div className="flex items-start space-x-4 pb-6 border-b border-gray-200">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-600">Nov 14, 2025 - 3:00 PM</p>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            Email
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Sent proposal to Sarah Lee
                        </h3>
                        <p className="text-sm text-gray-700 mb-3">
                          <strong>Subject:</strong> "Growth Plan Proposal for TechStart Inc"
                        </p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-green-700">
                            <strong>Status:</strong> Opened on Nov 14, 4:15 PM (1 hour later)
                          </p>
                          <p className="text-xs text-green-600 mt-1">High engagement - opened 3 times</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            View Email →
                          </button>
                          <button className="text-sm text-gray-600 hover:text-gray-700">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Activity 2 - Call */}
                    <div className="flex items-start space-x-4 pb-6 border-b border-gray-200">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Phone className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-600">Nov 13, 2025 - 2:00 PM</p>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Call
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Call with Mike Chen - Technical Discussion
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                          <div>
                            <p className="text-gray-600">Duration</p>
                            <p className="font-medium text-gray-900">20 minutes</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Call Type</p>
                            <p className="font-medium text-gray-900">Outbound</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-gray-900 mb-2">Notes:</p>
                          <p className="text-sm text-gray-700">
                            Discussed technical integration requirements. Mike confirmed API access needed.
                            Timeline looks good for Q1 implementation. Next step: Schedule demo with full team.
                          </p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-blue-900 mb-1">AI Sentiment Analysis:</p>
                          <p className="text-sm text-blue-700">Positive (85%) - Strong interest in product</p>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          View Full Details →
                        </button>
                      </div>
                    </div>

                    {/* Activity 3 - Meeting */}
                    <div className="flex items-start space-x-4 pb-6 border-b border-gray-200">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-600">Nov 12, 2025 - 10:00 AM</p>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                            Meeting
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Discovery Call with TechStart Team
                        </h3>
                        <div className="mb-3">
                          <p className="text-sm text-gray-600">Attendees:</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">Sarah Lee (CFO)</span>
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">Mike Chen (CTO)</span>
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">You</span>
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                          <p className="text-sm font-bold text-blue-900 mb-2">AI Meeting Summary:</p>
                          <ul className="space-y-1 text-sm text-blue-800">
                            <li>• Budget confirmed: $45K allocated</li>
                            <li>• Timeline: Q1 2025 implementation</li>
                            <li>• Decision makers: Sarah (budget), Mike (technical)</li>
                            <li>• Competitors: Evaluating 2 other solutions</li>
                            <li>• Next steps: Technical demo needed</li>
                          </ul>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-green-900">
                            Sentiment: Positive (82%)
                          </p>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          View AI Meeting Notes →
                        </button>
                      </div>
                    </div>

                    {/* Activity 4 - Note */}
                    <div className="flex items-start space-x-4 pb-6 border-b border-gray-200">
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-600">Nov 11, 2025 - 4:30 PM</p>
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                            Note
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Research on TechStart's competitors
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700">
                            Researched their main competitors. Found they're currently using legacy system
                            that lacks key features our product provides. Pain points: slow reporting,
                            limited integrations. This aligns perfectly with our value prop.
                          </p>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Edit Note
                        </button>
                      </div>
                    </div>

                    {/* Activity 5 - Contact Added */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-600">Nov 10, 2025 - 4:00 PM</p>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                            System
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Contact Added: Lisa Wang
                        </h3>
                        <p className="text-sm text-gray-700">
                          Added Lisa Wang (VP Operations) to account
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Source: Referral from Sarah Lee
                        </p>
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-6 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Load More Activities
                  </button>
                </div>
              </>
            )}

            {activeTab === 'hrms' && (
              <div id="hrms-intelligence">
                {account.hrmsConnection?.hasConnection ? (
                  <HRMSIntelligencePanel
                    hasConnection={true}
                    connectedSince="June 2024"
                    contactName="Sarah Chen"
                    contactRole="VP of HR"
                    employeeCount={account.employeeCount}
                    recentHires={35}
                    attritionRate={8}
                  />
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-8">
                    <div className="text-center">
                      <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        No HRMS Connection
                      </h2>
                      <p className="text-gray-600 mb-6">
                        This account doesn't have any recruitment relationship with your company yet.
                      </p>
                      <button
                        onClick={() => alert('HRMS database search functionality coming soon')}
                        className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                      >
                        Check HRMS Database
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'docs' && (
              <>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <FileText className="h-7 w-7 mr-3 text-blue-600" />
                      Documents & Files
                    </h2>
                    <button
                      onClick={handleUploadDocument}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </button>
                  </div>

                  {/* Storage Stats */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Storage Used</span>
                      <span className="text-sm font-medium text-gray-900">24.5 MB / 100 MB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24.5%' }}></div>
                    </div>
                  </div>

                  {/* Document Categories */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <button className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                      <FileText className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-blue-900">All Files</p>
                      <p className="text-lg font-bold text-blue-700">8</p>
                    </button>
                    <button className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
                      <FileText className="h-6 w-6 text-green-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-green-900">Proposals</p>
                      <p className="text-lg font-bold text-green-700">3</p>
                    </button>
                    <button className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100">
                      <FileText className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-purple-900">Contracts</p>
                      <p className="text-lg font-bold text-purple-700">2</p>
                    </button>
                    <button className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100">
                      <FileText className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-orange-900">Other</p>
                      <p className="text-lg font-bold text-orange-700">3</p>
                    </button>
                  </div>

                  {/* Documents List */}
                  <div className="space-y-3">
                    {/* Document 1 */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">TechStart_Proposal_Q1_2025.pdf</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>Proposal</span>
                            <span>•</span>
                            <span>2.4 MB</span>
                            <span>•</span>
                            <span>Uploaded Nov 14, 2025</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Document 2 */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">Service_Agreement_Draft.docx</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>Contract</span>
                            <span>•</span>
                            <span>0.8 MB</span>
                            <span>•</span>
                            <span>Uploaded Nov 12, 2025</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Document 3 */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">Meeting_Notes_Nov_12.pdf</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>Notes</span>
                            <span>•</span>
                            <span>0.3 MB</span>
                            <span>•</span>
                            <span>Uploaded Nov 12, 2025</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Document 4 */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">Technical_Requirements.xlsx</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>Spreadsheet</span>
                            <span>•</span>
                            <span>1.2 MB</span>
                            <span>•</span>
                            <span>Uploaded Nov 10, 2025</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Document 5 */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">Company_Overview_Presentation.pptx</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>Presentation</span>
                            <span>•</span>
                            <span>5.8 MB</span>
                            <span>•</span>
                            <span>Uploaded Nov 8, 2025</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-50 rounded">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Upload Zone */}
                  <div className="mt-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (Max 10MB)
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column (1/3 width) - Sidebar - Conditional based on active tab */}
          {(activeTab === 'overview' || activeTab === 'contacts') && (
            <div className="space-y-6">
              {/* Company Information Panel */}
              <CompanyInformationPanel
                legalName={account.name}
                industry={account.industry}
                subIndustry={account.subIndustry}
                employeeCount={account.employeeCount}
                annualRevenue={account.annualRevenue}
                growthRate={account.customFields?.growth_rate}
                foundedYear="2015"
                headquarters={`${account.billingAddress.city}, ${account.billingAddress.state}`}
                website={account.website}
                keyTechnologies={['Salesforce', 'HubSpot', 'Slack', 'AWS']}
              />

              {/* AI Account Insights - Comprehensive Panel */}
              <AIAccountInsightsPanel
                accountId={account.id}
                accountName={account.name}
                healthScore={account.healthScore}
                engagementScore={95}
                dealPotentialScore={90}
                relationshipScore={account.hrmsConnection?.hasConnection ? 95 : 75}
                companyHealthScore={88}
                hasHRMSConnection={account.hrmsConnection?.hasConnection}
                pipelineValue={metrics.totalPipeline}
                dealCount={deals.length}
              />

              {/* Similar Successful Accounts */}
              <SimilarAccountsPanel
                accounts={similarAccounts}
                onAccountClick={(id) => navigate(`/crm/accounts/${id}`)}
              />

              {/* Data Sources Panel */}
              <DataSourcesPanel
                sources={dataSources}
                dataQuality={96}
                lastEnrichment="2 hours ago"
                onReEnrich={() => console.log('Re-enriching...')}
                onVerifyData={() => console.log('Verifying data...')}
                onReportIssue={() => console.log('Reporting issue...')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Email</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option>All contacts at {account?.name}</option>
                  {contacts.map(contact => (
                    <option key={contact.id}>{contact.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea rows={6} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Meeting</h3>
              <button onClick={() => setShowMeetingModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  {contacts.map(contact => (
                    <option key={contact.id}>{contact.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Meeting title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Meeting room or video link" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Meeting agenda and notes" />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Schedule Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAccountDetailView;
