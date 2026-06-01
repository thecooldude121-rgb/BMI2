import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Mail, Phone, Globe, MapPin, TrendingUp,
  Users, DollarSign, Calendar, Edit, MoreVertical, ExternalLink,
  Plus, Star, Target, Briefcase, FileText, MessageSquare,
  Sparkles, Clock, Activity, Video, FileCheck
} from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { techstartMockData } from '../../utils/techstartMockData';

type TabType = 'overview' | 'contacts' | 'deals' | 'activities' | 'hrms' | 'documents';

const TechStartDetailView: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  const data = techstartMockData;
  const account = data.account;
  const metrics = data.metrics;
  const deals = data.deals;
  const contacts = data.contacts;
  const activities = data.activities;
  const hrms = data.hrms_intelligence;
  const insights = data.ai_insights;

  const handleCreateDeal = () => {
    console.log('[Navigate] Creating deal for TechStart Inc');
    navigate('/crm/deals/create?account=ACC-2024-0089');
  };

  const handleAddContact = () => {
    console.log('[Navigate] Adding contact for TechStart Inc');
    navigate('/crm/contacts/new?accountId=ACC-2024-0089&accountName=TechStart Inc');
  };

  const handleSendEmail = () => {
    console.log('[Action] Opening email composer');
    setShowEmailModal(true);
  };

  const handleScheduleMeeting = () => {
    console.log('[Action] Opening meeting scheduler');
    setShowMeetingModal(true);
  };

  const handleUploadDocument = () => {
    console.log('[Action] Opening document upload');
    alert('Document upload modal would open here');
  };

  const handleContactClick = (contactId: string) => {
    console.log(`[Navigate] Viewing contact: ${contactId}`);
    navigate(`/crm/contacts/${contactId}`);
  };

  const handleDealClick = (dealId: string) => {
    console.log(`[Navigate] Viewing deal: ${dealId}`);
    navigate(`/crm/deals/${dealId}`);
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Eye },
    { key: 'contacts', label: 'Contacts', icon: Users },
    { key: 'deals', label: 'Deals', icon: DollarSign },
    { key: 'activities', label: 'Activities', icon: Activity },
    { key: 'hrms', label: 'HRMS', icon: Target },
    { key: 'documents', label: 'Documents', icon: FileText }
  ];

  const renderStars = (count: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button
            onClick={() => navigate('/crm/accounts')}
            className="hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Accounts
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">{account.account_name}</span>
        </div>

        {/* Hero Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                {account.account_name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{account.account_name}</h1>
                  {account.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        tag === 'Hot' ? 'bg-red-100 text-red-700' :
                        tag === 'High Priority' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {account.industry}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {account.employees_total} employees
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {account.headquarters.city}, {account.headquarters.state}
                  </span>
                  <a
                    href={`https://${account.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    <Globe className="h-4 w-4" />
                    {account.website}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {account.hrms_connection && (
                <button
                  onClick={() => console.log('[Action] View HRMS details')}
                  className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  HRMS Connected
                </button>
              )}
              <button
                onClick={() => navigate(`/crm/accounts/${account.account_id}/edit`)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateDeal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Create Deal
            </button>
            <button
              onClick={handleAddContact}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Add Contact
            </button>
            <button
              onClick={handleSendEmail}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </button>
            <button
              onClick={handleScheduleMeeting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Schedule Meeting
            </button>
            <button
              onClick={handleUploadDocument}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Upload Document
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-5 gap-6">
            <button
              onClick={() => navigate('/crm/deals?account=ACC-2024-0089')}
              className="text-left hover:bg-gray-50 p-3 rounded-lg transition-colors"
            >
              <div className="text-2xl font-bold text-gray-900">${metrics.total_pipeline.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Pipeline</div>
            </button>
            <button
              onClick={() => navigate('/crm/deals?account=ACC-2024-0089')}
              className="text-left hover:bg-gray-50 p-3 rounded-lg transition-colors"
            >
              <div className="text-2xl font-bold text-gray-900">{metrics.active_deals_count}</div>
              <div className="text-sm text-gray-600">Active Deals</div>
            </button>
            <button
              onClick={() => navigate('/crm/contacts?account=ACC-2024-0089')}
              className="text-left hover:bg-gray-50 p-3 rounded-lg transition-colors"
            >
              <div className="text-2xl font-bold text-gray-900">{metrics.contacts_count}</div>
              <div className="text-sm text-gray-600">Contacts</div>
            </button>
            <button
              onClick={() => navigate('/crm/meetings?account=ACC-2024-0089')}
              className="text-left hover:bg-gray-50 p-3 rounded-lg transition-colors"
            >
              <div className="text-2xl font-bold text-gray-900">{metrics.meetings_this_quarter}</div>
              <div className="text-sm text-gray-600">Meetings This Qtr</div>
            </button>
            <div className="text-left p-3">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">{metrics.response_rate}%</div>
                <span className="text-xs text-green-600 font-medium">{metrics.response_rate_trend}</span>
              </div>
              <div className="text-sm text-gray-600">Response Rate</div>
            </div>
          </div>
        </div>

        {/* Last Interaction Bar */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <span className="text-sm font-medium text-gray-900">Last Contact: </span>
                <span className="text-sm text-gray-700">{metrics.days_since_last_interaction} days ago</span>
                <span className="text-sm text-gray-500 mx-2">•</span>
                <span className="text-sm text-gray-700">Email to Sarah Lee & Mike Chen</span>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View Details</button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
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
        </div>

        {/* Main Content Area */}
        <div className={`grid gap-6 ${(activeTab === 'overview' || activeTab === 'contacts') ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Left Column */}
          <div className={`space-y-6 ${(activeTab === 'overview' || activeTab === 'contacts') ? 'lg:col-span-2' : 'col-span-1'}`}>
            {activeTab === 'overview' && (
              <>
                {/* HRMS Intelligence */}
                {hrms && hrms.recruited_employees.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">HRMS Intelligence</h3>
                          <p className="text-sm text-green-700">Recruitment connection active</p>
                        </div>
                      </div>
                      <button
                        onClick={() => console.log('[Navigate] View full HRMS report')}
                        className="text-sm text-green-700 hover:text-green-800 font-medium"
                      >
                        View Full Report →
                      </button>
                    </div>

                    {hrms.recruited_employees.map((employee) => (
                      <div key={employee.employee_id} className="bg-white rounded-lg p-4 mb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{employee.name}</h4>
                            <p className="text-sm text-gray-600">{employee.former_position_at_account}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Now: {employee.current_position} at {employee.current_company}
                            </p>
                          </div>
                          <button
                            onClick={() => console.log('[Action] Contact Sarah for intro')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Contact for Intro
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {hrms.strategic_advantage_metrics.deal_close_rate_hrms}%
                        </div>
                        <div className="text-xs text-gray-600">Close Rate w/HRMS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-700">
                          {hrms.strategic_advantage_metrics.sales_cycle_hrms_days} days
                        </div>
                        <div className="text-xs text-gray-600">Sales Cycle</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Deals */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Active Deals</h3>
                    <button
                      onClick={handleCreateDeal}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Deal
                    </button>
                  </div>

                  <div className="space-y-4">
                    {deals.map((deal) => (
                      <button
                        key={deal.deal_id}
                        onClick={() => handleDealClick(deal.deal_id)}
                        className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{deal.deal_name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {deal.deal_type} • {deal.stage}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              ${deal.value.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">{deal.probability}% probability</div>
                          </div>
                        </div>

                        {deal.hrms_advantage?.active && (
                          <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
                            <div className="text-xs text-green-800 font-medium flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              HRMS Advantage Active
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Contact: {deal.primary_contact_name}</span>
                          <span>Close: {new Date(deal.expected_close_date).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
                    <button
                      onClick={() => setActiveTab('activities')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="space-y-4">
                    {activities.slice(0, 5).map((activity) => (
                      <div key={activity.activity_id} className="flex gap-4">
                        <div className="flex-shrink-0">
                          {activity.type === 'Email' && (
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Mail className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          {activity.type === 'Phone Call' && (
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Phone className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                          {activity.type === 'Meeting' && (
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Video className="h-4 w-4 text-purple-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {activity.type === 'Email' && activity.subject}
                                {activity.type === 'Phone Call' && activity.call_summary}
                                {activity.type === 'Meeting' && activity.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {activity.date} • {activity.time}
                              </p>
                            </div>
                            <button
                              onClick={() => console.log(`[Action] View activity ${activity.activity_id}`)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'contacts' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Contacts ({contacts.length})</h3>
                  <button
                    onClick={handleAddContact}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Contact
                  </button>
                </div>

                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div
                      key={contact.contact_id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <button
                              onClick={() => handleContactClick(contact.contact_id)}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                            >
                              {contact.name}
                            </button>
                            {contact.recruited_from_this_account && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                                Internal
                              </span>
                            )}
                            {renderStars(contact.relationship_strength)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{contact.title}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSendEmail}
                            className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                            title="Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleScheduleMeeting}
                            className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                            title="Schedule Meeting"
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Missing Contacts */}
                {data.missing_contacts && data.missing_contacts.length > 0 && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Missing Key Contacts</h4>
                    <div className="space-y-2">
                      {data.missing_contacts.map((missing, index) => (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">{missing.role}</h5>
                              <p className="text-xs text-gray-600 mt-1">{missing.why_important}</p>
                              <p className="text-xs text-blue-600 mt-1">{missing.how_to_find}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              missing.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {missing.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deals' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Active Deals</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {deals.length} deals worth ${metrics.total_pipeline.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={handleCreateDeal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Deal
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">${metrics.total_pipeline.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Pipeline</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">${metrics.weighted_pipeline.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Weighted Value</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-gray-900">{metrics.average_deal_probability}%</div>
                    <div className="text-sm text-gray-600">Avg Probability</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {deals.map((deal) => (
                    <button
                      key={deal.deal_id}
                      onClick={() => handleDealClick(deal.deal_id)}
                      className="w-full text-left border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{deal.deal_name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{deal.deal_type}</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{deal.stage}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">${deal.value.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{deal.probability}% probability</div>
                        </div>
                      </div>

                      {deal.hrms_advantage?.active && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-900">HRMS Advantage Active</span>
                          </div>
                          <ul className="space-y-1">
                            {deal.hrms_advantage.details.slice(0, 3).map((detail, index) => (
                              <li key={index} className="text-xs text-green-700">• {detail}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Primary Contact</div>
                          <div className="text-sm text-gray-900">{deal.primary_contact_name}</div>
                          <div className="text-xs text-gray-600">{deal.primary_contact_title}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Expected Close</div>
                          <div className="text-sm text-gray-900">{new Date(deal.expected_close_date).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-600">{deal.days_in_pipeline_total} days in pipeline</div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <div className="text-xs text-gray-500 mb-2">Health Score</div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${deal.ai_deal_health_score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{deal.ai_deal_health_score}/100</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
                    <p className="text-sm text-gray-600 mt-1">{activities.length} activities recorded</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option>All Types</option>
                      <option>Emails</option>
                      <option>Calls</option>
                      <option>Meetings</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.activity_id} className="flex gap-4">
                      <div className="flex-shrink-0">
                        {activity.type === 'Email' && (
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                        {activity.type === 'Phone Call' && (
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Phone className="h-5 w-5 text-green-600" />
                          </div>
                        )}
                        {activity.type === 'Meeting' && (
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Video className="h-5 w-5 text-purple-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-base font-semibold text-gray-900">
                              {activity.type === 'Email' && activity.subject}
                              {activity.type === 'Phone Call' && activity.call_summary}
                              {activity.type === 'Meeting' && activity.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.date} at {activity.time}
                            </p>
                          </div>
                          <button
                            onClick={() => console.log(`[Action] View activity ${activity.activity_id}`)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                          >
                            View Details
                          </button>
                        </div>

                        {activity.type === 'Email' && activity.status && (
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <span>Status: <strong className="text-green-600">{activity.status}</strong></span>
                            <span>Opens: <strong>{activity.total_opens}</strong></span>
                            <span>Avg Time: <strong>{activity.time_spent_avg_minutes} min</strong></span>
                          </div>
                        )}

                        {activity.type === 'Phone Call' && activity.duration_minutes && (
                          <div className="text-sm text-gray-600 mt-2">
                            Duration: <strong>{activity.duration_minutes} minutes</strong> with {activity.with}
                          </div>
                        )}

                        {activity.type === 'Meeting' && (
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <span>Duration: <strong>{activity.duration_minutes} min</strong></span>
                            <span>Platform: <strong>{activity.platform}</strong></span>
                            {activity.ai_notes_generated && (
                              <span className="text-blue-600 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI Notes Available
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'hrms' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">HRMS Intelligence</h3>

                {hrms && hrms.recruited_employees.length > 0 ? (
                  <div className="space-y-6">
                    {/* Recruited Employee Details */}
                    {hrms.recruited_employees.map((employee) => (
                      <div key={employee.employee_id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-xl font-semibold text-gray-900">{employee.name}</h4>
                            <p className="text-gray-600 mt-1">{employee.former_position_at_account}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Tenure at TechStart: {employee.tenure_at_account_period} ({employee.tenure_at_account_years} years)
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">{employee.performance_rating}</div>
                            <div className="text-xs text-gray-600">Performance Rating</div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="text-sm font-semibold text-gray-900 mb-2">Current Position</div>
                          <div className="text-sm text-gray-700">
                            {employee.current_position} at {employee.current_company}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Reports to: {employee.reports_to_name}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Can Provide Intros</div>
                            <div className="text-sm font-medium text-gray-900">
                              {employee.can_provide_intros ? 'Yes' : 'No'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Willingness to Help</div>
                            <div className="text-sm font-medium text-green-600">{employee.willingness_to_help}</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Strategic Advantage Metrics */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Strategic Advantage Metrics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-2xl font-bold text-green-600">
                            {hrms.strategic_advantage_metrics.deal_close_rate_hrms}%
                          </div>
                          <div className="text-sm text-gray-600">Close Rate with HRMS</div>
                          <div className="text-xs text-gray-500 mt-1">
                            vs {hrms.strategic_advantage_metrics.deal_close_rate_average}% average
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-2xl font-bold text-green-600">
                            {hrms.strategic_advantage_metrics.sales_cycle_hrms_days} days
                          </div>
                          <div className="text-sm text-gray-600">Sales Cycle</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {hrms.strategic_advantage_metrics.sales_cycle_improvement_percentage}% faster
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Strategic Guidance */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h4 className="text-base font-semibold text-gray-900 mb-3">Strategic Guidance</h4>
                      <ul className="space-y-2">
                        {hrms.strategic_guidance.map((guidance, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{guidance}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No HRMS connections for this account</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                    <p className="text-sm text-gray-600 mt-1">Files and attachments</p>
                  </div>
                  <button
                    onClick={handleUploadDocument}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </button>
                </div>

                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No documents uploaded yet</p>
                  <button
                    onClick={handleUploadDocument}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Upload your first document
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Only on Overview and Contacts tabs */}
          {(activeTab === 'overview' || activeTab === 'contacts') && (
            <div className="space-y-6">
              {/* Company Information */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Company Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Legal Name</div>
                    <div className="text-gray-900 font-medium">{account.legal_name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Industry</div>
                    <div className="text-gray-900">{account.industry}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Sub-Industry</div>
                    <div className="text-gray-900">{account.sub_industry}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Founded</div>
                    <div className="text-gray-900">{account.founded_date}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Employees</div>
                    <div className="text-gray-900">{account.employees_total} employees</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Annual Revenue</div>
                    <div className="text-gray-900">
                      ${(account.revenue.annual_revenue / 1000000).toFixed(1)}M
                      <span className="text-green-600 ml-2">{account.revenue.growth_yoy}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900">AI Account Insights</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Account Health</span>
                      <div className="flex items-center gap-2">
                        {renderStars(insights.account_health_stars)}
                        <span className="text-sm font-semibold text-gray-900">{insights.account_health_score}/100</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{insights.account_health_rating}</div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommendations</h4>
                    <div className="space-y-3">
                      {insights.recommendations.map((rec) => (
                        <div key={rec.priority} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-900 mb-1">{rec.action}</div>
                          <div className="text-xs text-gray-600 mb-2">{rec.focus || rec.strategy}</div>
                          <button
                            onClick={() => console.log(`[Action] ${rec.button_text}`)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {rec.button_text} →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Similar Accounts */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Similar Successful Accounts</h3>
                <div className="space-y-3">
                  {data.similar_accounts.map((similar) => (
                    <button
                      key={similar.account_id}
                      onClick={() => navigate(`/crm/accounts/${similar.account_id}`)}
                      className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-3 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{similar.account_name}</span>
                        <span className="text-xs text-gray-500">{similar.similarity_percentage}% match</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">{similar.industry} • {similar.employees} employees</div>
                      <div className="text-xs text-green-600 font-medium">
                        ${similar.closed_deal_value.toLocaleString()} in {similar.closed_deal_days} days
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Sources */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Data Sources</h3>
                <div className="space-y-2 text-sm mb-4">
                  {account.data_enrichment.sources.map((source, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>{source}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                  <span>Data Quality: {account.data_enrichment.data_quality}%</span>
                  <span>Updated: {account.data_enrichment.last_updated}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => console.log('[Action] Re-enrich data')}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded hover:bg-blue-100"
                  >
                    Re-enrich
                  </button>
                  <button
                    onClick={() => console.log('[Action] Verify data')}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                  >
                    Verify
                  </button>
                </div>
              </div>
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
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option>All contacts at TechStart Inc</option>
                  <option>Sarah Lee</option>
                  <option>Mike Chen</option>
                  <option>Lisa Wang</option>
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
              <button onClick={() => setShowMeetingModal(false)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option>Sarah Lee</option>
                  <option>Mike Chen</option>
                  <option>Lisa Wang</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
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

export default TechStartDetailView;
