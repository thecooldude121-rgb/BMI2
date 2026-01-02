import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Mail, Plus, MoreHorizontal, ChevronDown, ChevronUp,
  User, Building, Calendar, DollarSign, Target, Phone, Video, FileText,
  Paperclip, Clock, Activity, MessageSquare, Star, Globe, Briefcase,
  Settings, Save, X, Check, AlertCircle, TrendingUp, Users, Tag,
  Download, Share, Copy, Eye, Trash2, Archive, Flag, Zap, Bot
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

interface DealDetailPageProps {
  dealId?: string;
}

const DealDetailPage: React.FC<DealDetailPageProps> = ({ dealId: propDealId }) => {
  const { id: paramDealId } = useParams();
  const navigate = useNavigate();
  const { deals, leads, employees, companies, contacts, activities, tasks } = useData();
  
  const dealId = propDealId || paramDealId;
  const deal = deals.find(d => d.id === dealId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic', 'financials', 'activities'])
  );
  const [editableFields, setEditableFields] = useState<Record<string, any>>({});
  const [showStageModal, setShowStageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');

  useEffect(() => {
    if (deal) {
      setEditableFields({
        name: deal.name,
        value: deal.value,
        probability: deal.probability,
        expectedCloseDate: deal.expectedCloseDate,
        notes: deal.notes || '',
        stage: deal.stage
      });
    }
  }, [deal]);

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Deal Not Found</h2>
          <button
            onClick={() => navigate('/crm/deals')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Deals
          </button>
        </div>
      </div>
    );
  }

  const stages = [
    { id: 'qualification', name: 'Qualification', color: '#6B7280', probability: 10 },
    { id: 'proposal', name: 'Proposal', color: '#3B82F6', probability: 25 },
    { id: 'negotiation', name: 'Negotiation', color: '#F59E0B', probability: 50 },
    { id: 'closed-won', name: 'Closed Won', color: '#10B981', probability: 100 },
    { id: 'closed-lost', name: 'Closed Lost', color: '#EF4444', probability: 0 }
  ];

  const currentStage = stages.find(s => s.id === deal.stage);
  const currentStageIndex = stages.findIndex(s => s.id === deal.stage);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unassigned';
  };

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.name : 'Unknown Lead';
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

  const handleFieldEdit = (field: string, value: any) => {
    setEditableFields(prev => ({ ...prev, [field]: value }));
  };

  const saveChanges = () => {
    // Here you would typically call an API to save changes
    console.log('Saving changes:', editableFields);
    setIsEditing(false);
  };

  const renderCollapsibleSection = (
    id: string,
    title: string,
    icon: React.ElementType,
    children: React.ReactNode,
    actions?: React.ReactNode
  ) => {
    const Icon = icon;
    const isExpanded = expandedSections.has(id);

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection(id)}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-3">
            {actions}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-gray-100">
            {children}
          </div>
        )}
      </div>
    );
  };

  const renderInlineEditField = (
    field: string,
    label: string,
    type: 'text' | 'number' | 'date' | 'textarea' = 'text',
    className?: string
  ) => {
    const value = editableFields[field];
    
    if (isEditing) {
      if (type === 'textarea') {
        return (
          <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <textarea
              value={value || ''}
              onChange={(e) => handleFieldEdit(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>
        );
      }
      
      return (
        <div className={className}>
          <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
          <input
            type={type}
            value={value || ''}
            onChange={(e) => handleFieldEdit(field, type === 'number' ? Number(e.target.value) : e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      );
    }

    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
        <p className="text-lg font-medium text-gray-900">
          {type === 'number' && field === 'value' ? formatCurrency(value || 0) : value || '-'}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/crm/deals')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{deal.name}</h1>
                  <span 
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: currentStage?.color }}
                  >
                    {currentStage?.name}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Deal #{deal.id}</span>
                  <span>•</span>
                  <span>{formatCurrency(deal.value)}</span>
                  <span>•</span>
                  <span>Owner: {getEmployeeName(deal.assignedTo)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </button>
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </>
                )}
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <MoreHorizontal className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Stage Progress Bar */}
          <div className="flex items-center space-x-2">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStageIndex
                        ? 'text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                    style={{
                      backgroundColor: index <= currentStageIndex ? stage.color : undefined
                    }}
                  >
                    {index + 1}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">{stage.name}</span>
                </div>
                {index < stages.length - 1 && (
                  <div className="w-12 h-1 mx-3 bg-gray-200 rounded">
                    <div
                      className="h-1 rounded transition-all duration-300"
                      style={{
                        width: index < currentStageIndex ? '100%' : '0%',
                        backgroundColor: stage.color
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-6 mt-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Related List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-32">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Related List</h3>
              <div className="space-y-3">
                {[
                  { name: 'Notes', count: 0, icon: FileText },
                  { name: 'Open Activities', count: 2, icon: Clock },
                  { name: 'Closed Activities', count: 5, icon: Check },
                  { name: 'Engagement Plan', count: 1, icon: Target },
                  { name: 'Attachments', count: 3, icon: Paperclip },
                  { name: 'Stage History', count: 1, icon: Activity },
                  { name: 'Competitors', count: 0, icon: Flag },
                  { name: 'Emails', count: 2, icon: Mail }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                      {item.count > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {activeTab === 'overview' && (
              <>
                {/* Deal Owner & Meta */}
                {renderCollapsibleSection(
                  'owner',
                  'Deal Owner & Classification',
                  User,
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Deal Owner</p>
                          <p className="font-semibold text-gray-900">{getEmployeeName(deal.assignedTo)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Deal Type</p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          New Business
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Territory</p>
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">United States</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Created By</p>
                        <p className="font-medium text-gray-900">{getEmployeeName(deal.assignedTo)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Created Date</p>
                        <p className="font-medium text-gray-900">{new Date(deal.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                        <p className="font-medium text-gray-900">{new Date(deal.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Basic Deal Information */}
                {renderCollapsibleSection(
                  'basic',
                  'Basic Information',
                  Briefcase,
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      {renderInlineEditField('name', 'Deal Name', 'text')}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Deal Number</p>
                        <p className="text-lg font-medium text-gray-900 font-mono">DEAL-{deal.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Associated Account</p>
                        <button className="text-lg font-medium text-blue-600 hover:text-blue-800 hover:underline">
                          {getLeadName(deal.leadId)} Company
                        </button>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Primary Contact</p>
                        <button className="text-lg font-medium text-blue-600 hover:text-blue-800 hover:underline">
                          {getLeadName(deal.leadId)}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {renderInlineEditField('value', 'Deal Amount', 'number')}
                      {renderInlineEditField('expectedCloseDate', 'Expected Close Date', 'date')}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Current Stage</p>
                        <button
                          onClick={() => setShowStageModal(true)}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: currentStage?.color }}
                        >
                          {currentStage?.name}
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </button>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Win Probability</p>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                          <span className="text-lg font-bold text-gray-900">{deal.probability}%</span>
                        </div>
                      </div>

                      {deal.source && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Source</p>
                          <div className="flex items-center space-x-2">
                            {deal.source === 'lead-gen' && deal.leadGenTool && (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                                <Target className="h-4 w-4 text-blue-600 mr-2" />
                                <span className="text-sm font-medium text-blue-900">
                                  Lead Gen ({deal.leadGenTool === 'apollo' ? 'Apollo.io' :
                                            deal.leadGenTool === 'zoominfo' ? 'ZoomInfo' :
                                            deal.leadGenTool === 'linkedin-sales-nav' ? 'LinkedIn Sales Navigator' :
                                            deal.leadGenTool === 'hunter' ? 'Hunter.io' :
                                            deal.leadGenTool === 'seamless' ? 'Seamless.ai' : 'Other'})
                                </span>
                              </span>
                            )}
                            {deal.source === 'hrms' && (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200">
                                <Building className="h-4 w-4 text-orange-600 mr-2" />
                                <span className="text-sm font-medium text-orange-900">HRMS Connection</span>
                              </span>
                            )}
                            {deal.source === 'referral' && (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                                <User className="h-4 w-4 text-green-600 mr-2" />
                                <span className="text-sm font-medium text-green-900">Referral</span>
                              </span>
                            )}
                            {deal.source === 'inbound' && (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
                                <Globe className="h-4 w-4 text-purple-600 mr-2" />
                                <span className="text-sm font-medium text-purple-900">Inbound</span>
                              </span>
                            )}
                            {deal.source === 'manual' && (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                                <Edit className="h-4 w-4 text-gray-600 mr-2" />
                                <span className="text-sm font-medium text-gray-900">Manual Entry</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      {renderInlineEditField('notes', 'Notes', 'textarea')}
                    </div>
                  </div>
                )}

                {/* Deal Financials */}
                {renderCollapsibleSection(
                  'financials',
                  'Financial Details',
                  DollarSign,
                  <div className="mt-6">
                    {/* Products/Line Items */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Products & Line Items</h4>
                        <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Product
                        </button>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-gray-900">Enterprise CRM License</p>
                                  <p className="text-sm text-gray-500">Annual subscription for 500 users</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">1</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(deal.value)}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(deal.value)}</td>
                              <td className="px-6 py-4">
                                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-600">Platform Fee</p>
                        <p className="text-xl font-bold text-blue-700">{formatCurrency(5000)}</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-purple-600">Custom Fee</p>
                        <p className="text-xl font-bold text-purple-700">{formatCurrency(2000)}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-600">License Fee</p>
                        <p className="text-xl font-bold text-green-700">{formatCurrency(deal.value - 7000)}</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm font-medium text-orange-600">Onboarding Fee</p>
                        <p className="text-xl font-bold text-orange-700">{formatCurrency(0)}</p>
                      </div>
                    </div>
                  </div>,
                  <button className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Update Pricing
                  </button>
                )}

                {/* Activities */}
                {renderCollapsibleSection(
                  'activities',
                  'Activities & Tasks',
                  Activity,
                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <button className="flex items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                        <Phone className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-blue-600 font-medium">Schedule Call</span>
                      </button>
                      <button className="flex items-center justify-center p-4 border-2 border-dashed border-green-300 rounded-lg hover:bg-green-50 transition-colors">
                        <Video className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-green-600 font-medium">Book Meeting</span>
                      </button>
                      <button className="flex items-center justify-center p-4 border-2 border-dashed border-purple-300 rounded-lg hover:bg-purple-50 transition-colors">
                        <FileText className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="text-purple-600 font-medium">Create Task</span>
                      </button>
                    </div>

                    {/* Activity Timeline */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Recent Activities</h4>
                      <div className="space-y-3">
                        {[
                          {
                            type: 'call',
                            title: 'Discovery Call Completed',
                            description: 'Discussed requirements and timeline with stakeholders',
                            time: '2 hours ago',
                            user: 'John Smith',
                            status: 'completed'
                          },
                          {
                            type: 'email',
                            title: 'Proposal Sent',
                            description: 'Sent detailed proposal with pricing breakdown',
                            time: '1 day ago',
                            user: 'Sarah Johnson',
                            status: 'completed'
                          },
                          {
                            type: 'meeting',
                            title: 'Demo Scheduled',
                            description: 'Product demonstration for decision makers',
                            time: 'Tomorrow 2:00 PM',
                            user: 'Mike Chen',
                            status: 'scheduled'
                          }
                        ].map((activity, index) => (
                          <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className={`p-2 rounded-full ${
                              activity.type === 'call' ? 'bg-blue-100' :
                              activity.type === 'email' ? 'bg-green-100' : 'bg-purple-100'
                            }`}>
                              {activity.type === 'call' && <Phone className="h-4 w-4 text-blue-600" />}
                              {activity.type === 'email' && <Mail className="h-4 w-4 text-green-600" />}
                              {activity.type === 'meeting' && <Video className="h-4 w-4 text-purple-600" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-medium text-gray-900">{activity.title}</h5>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  activity.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {activity.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>{activity.user}</span>
                                <span>•</span>
                                <span>{activity.time}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>,
                  <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </button>
                )}

                {/* Communication */}
                {renderCollapsibleSection(
                  'communication',
                  'Communication',
                  MessageSquare,
                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                        <Mail className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                        <h4 className="font-semibold text-gray-900 mb-2">Emails</h4>
                        <p className="text-2xl font-bold text-blue-600">12</p>
                        <p className="text-sm text-gray-600">Total sent</p>
                      </div>
                      <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                        <Phone className="h-8 w-8 text-green-600 mx-auto mb-3" />
                        <h4 className="font-semibold text-gray-900 mb-2">Calls</h4>
                        <p className="text-2xl font-bold text-green-600">8</p>
                        <p className="text-sm text-gray-600">Total calls</p>
                      </div>
                      <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                        <Video className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                        <h4 className="font-semibold text-gray-900 mb-2">Meetings</h4>
                        <p className="text-2xl font-bold text-purple-600">5</p>
                        <p className="text-sm text-gray-600">Completed</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stage History */}
                {renderCollapsibleSection(
                  'history',
                  'Stage History',
                  Clock,
                  <div className="mt-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Probability (%)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Revenue</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified By</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4">
                              <span 
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                                style={{ backgroundColor: currentStage?.color }}
                              >
                                {currentStage?.name}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(deal.value)}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{deal.probability}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(deal.value * (deal.probability / 100))}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">15 days</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{getEmployeeName(deal.assignedTo)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {renderCollapsibleSection(
                  'attachments',
                  'Attachments',
                  Paperclip,
                  <div className="mt-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                      <Paperclip className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Drop files here</h4>
                      <p className="text-gray-600 mb-4">or click to browse</p>
                      <button className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
                        Choose Files
                      </button>
                    </div>
                    
                    {/* Existing Attachments */}
                    <div className="mt-6 space-y-3">
                      {[
                        { name: 'Proposal_TechCorp_2024.pdf', size: '2.4 MB', type: 'PDF' },
                        { name: 'Contract_Draft.docx', size: '1.1 MB', type: 'Word' },
                        { name: 'Technical_Requirements.xlsx', size: '856 KB', type: 'Excel' }
                      ].map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <p className="text-sm text-gray-500">{file.size} • {file.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-blue-600 rounded">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-green-600 rounded">
                              <Download className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-600 rounded">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>,
                  <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload File
                  </button>
                )}
              </>
            )}

            {activeTab === 'timeline' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Deal Timeline</h3>
                <div className="space-y-6">
                  {/* Timeline items would go here */}
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Timeline view coming soon</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stage Change Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Change Stage</h3>
              <button onClick={() => setShowStageModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => {
                    handleFieldEdit('stage', stage.id);
                    setShowStageModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    stage.id === deal.stage
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-medium text-gray-900">{stage.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{stage.probability}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealDetailPage;