import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, TrendingUp,
  Users, DollarSign, Calendar, Edit, MoreVertical, ExternalLink,
  Plus, Star, Target, Briefcase, FileText, MessageSquare, Activity,
  TrendingDown, AlertCircle, CheckCircle2, Eye, Download, Upload,
  ChevronDown, ChevronRight, Clock, Zap, Award, BarChart3
} from 'lucide-react';
import { useAccounts } from '../../contexts/AccountsContext';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import AIAccountInsightsPanel from '../../components/Accounts/AIAccountInsightsPanel';

type TabType = 'overview' | 'contacts' | 'deals' | 'activities' | 'hrms' | 'documents';

const ComprehensiveAccountDetailView: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { getAccountById, getAccountContacts, getAccountDeals } = useAccounts();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const account = accountId ? getAccountById(accountId) : undefined;
  const contacts = accountId ? getAccountContacts(accountId) : [];
  const deals = accountId ? getAccountDeals(accountId) : [];

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

  const totalPipeline = deals?.reduce((sum, deal) => sum + (deal.amount || 0), 0) || 0;

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
            Accounts
          </button>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span>Accounts</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{account.name}</span>
          </div>
        </div>

        {/* Hero Header Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
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
                <div className="flex-1">
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

                  {/* Tags */}
                  {account.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {account.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>
                      Owner: {account.owner || 'Alex Rodriguez (You)'}
                    </span>
                    <span>
                      Created: {new Date(account.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span>
                      Last Modified: {new Date(account.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Health Score */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-gray-600">Account Health:</span>
                    <span className={`text-lg font-bold ${getHealthScoreColor(account.healthScore)}`}>
                      {account.healthScore || 0}/100
                    </span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor((account.healthScore || 0) / 20)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">|</span>
                    <span className="text-sm font-medium text-green-600">Status: Active</span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-2">
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* HRMS Connection Banner */}
            {account.hrmsConnection?.hasConnection && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-5 mb-6">
                <div className="flex items-start space-x-3">
                  <Building2 className="h-6 w-6 text-orange-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-bold text-orange-900">
                        HRMS CONNECTION - WARM RELATIONSHIP
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-orange-700">Connection Status</p>
                        <p className="text-sm font-semibold text-orange-900">Active HRMS Connection</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-700">Connection Type</p>
                        <p className="text-sm font-semibold text-orange-900">Direct Recruitment</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-700">Relationship Strength</p>
                        <p className="text-sm font-semibold text-orange-900">Very Strong</p>
                      </div>
                    </div>
                    <p className="text-sm text-orange-800 mb-2">
                      ✨ Recruited: {account.hrmsConnection.recruitedContacts?.map(c =>
                        `${c.name} (${c.position})`
                      ).join(', ')}
                    </p>
                    <p className="text-sm text-orange-700">
                      💡 Leverage recruitment relationship in outreach
                    </p>
                    <button className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
                      View HRMS Details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                <DollarSign className="h-4 w-4 mr-2" />
                Create Deal
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                <Users className="h-4 w-4 mr-2" />
                Add Contact
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {/* Total Pipeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-3xl font-bold text-gray-900">{formatRevenue(totalPipeline)}</p>
            <p className="text-sm text-gray-600 mt-1">Total Pipeline</p>
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              {deals.slice(0, 2).map((deal, idx) => (
                <p key={idx}>Deal {idx + 1}: {formatRevenue(deal.amount)}</p>
              ))}
            </div>
          </div>

          {/* Active Deals */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-3xl font-bold text-gray-900">{deals.length}</p>
            <p className="text-sm text-gray-600 mt-1">Active Deals</p>
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <p>Closed-Won: 0</p>
              <p>Closed-Lost: 0</p>
            </div>
          </div>

          {/* Contacts */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-3xl font-bold text-gray-900">{contacts.length}</p>
            <p className="text-sm text-gray-600 mt-1">Contacts</p>
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <p>Decision Makers: 1</p>
              <p>Influencers: 2</p>
              <p>Missing: 2</p>
            </div>
          </div>

          {/* Meetings */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-3xl font-bold text-gray-900">12</p>
            <p className="text-sm text-gray-600 mt-1">Meetings This Qtr</p>
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <p>Discovery: 3</p>
              <p>Demo: 4</p>
              <p>Proposal: 3</p>
              <p>Negotiation: 2</p>
            </div>
          </div>

          {/* Response Rate */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-3xl font-bold text-gray-900">85%</p>
            <p className="text-sm text-gray-600 mt-1">Response Rate</p>
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              <p>Avg Response Time: 3.2hrs</p>
              <p>Engagement Score: 95/100</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-6">
          Last Interaction: {account.lastActivityDate ?
            `${new Date(account.lastActivityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (2 days ago)` :
            'No recent activity'
          }
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: 'OVERVIEW', icon: Eye },
                { id: 'contacts', label: 'Contacts', icon: Users },
                { id: 'deals', label: 'Deals', icon: Briefcase },
                { id: 'activities', label: 'Activities', icon: Activity },
                { id: 'hrms', label: 'HRMS', icon: Building2 },
                { id: 'documents', label: 'Documents', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`
                      flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content (Will be added later) */}
                <div className="lg:col-span-2">
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    Left column content (HRMS Intelligence, Deals, Contacts, Activities)
                    <br />
                    <span className="text-sm">To be implemented next</span>
                  </div>
                </div>

                {/* Right Column - AI Insights */}
                <div className="lg:col-span-1">
                  <AIAccountInsightsPanel
                    accountId={account.id}
                    accountName={account.name}
                    healthScore={account.healthScore}
                    engagementScore={95}
                    dealPotentialScore={90}
                    relationshipScore={account.hrmsConnection?.hasConnection ? 95 : 75}
                    companyHealthScore={88}
                    hasHRMSConnection={account.hrmsConnection?.hasConnection}
                    pipelineValue={totalPipeline}
                    dealCount={deals.length}
                  />
                </div>
              </div>
            )}
            {activeTab !== 'overview' && (
              <div className="text-center py-12 text-gray-500">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} tab content
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveAccountDetailView;
