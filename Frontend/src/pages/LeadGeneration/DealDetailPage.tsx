import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, DollarSign, User, Building, Calendar, Target, 
  Edit, Share, Download, Eye, Settings, Activity, Mail,
  Phone, Video, CheckSquare, Clock, Star, TrendingUp,
  ChevronDown, ChevronUp, Plus, Tag, FileText
} from 'lucide-react';

const DealDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'emails' | 'history'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'financial']));

  // Mock deal data
  const deal = {
    id: id || '1',
    name: 'TechCorp Enterprise CRM Implementation',
    amount: 285000,
    currency: 'USD',
    stage: 'Proposal',
    probability: 75,
    expectedCloseDate: '2024-03-15',
    ownerId: 'user-1',
    ownerName: 'John Smith',
    accountId: 'acc-1',
    accountName: 'TechCorp Solutions',
    contactId: 'contact-1',
    contactName: 'Sarah Chen',
    description: 'Comprehensive CRM implementation for 500+ user enterprise client. Includes custom integrations, data migration, and 6-month support.',
    nextSteps: 'Schedule technical review meeting with IT team. Finalize integration requirements and timeline.',
    tags: ['enterprise', 'high-value', 'technology', 'custom-integration'],
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
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

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Target, count: null },
    { id: 'activity', name: 'Activity', icon: Activity, count: 12 },
    { id: 'emails', name: 'Emails', icon: Mail, count: 8 },
    { id: 'history', name: 'History', icon: Clock, count: 5 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/lead-generation/deals')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  <DollarSign className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{deal.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{deal.accountName}</span>
                    <span>•</span>
                    <span>{deal.contactName}</span>
                    <span>•</span>
                    <span>Owner: {deal.ownerName}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                {deal.stage}
              </span>
              
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors">
                <Target className="h-4 w-4 mr-2" />
                Update Stage
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </button>
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Phone className="h-4 w-4 mr-2" />
              Log Call
            </button>
            <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Video className="h-4 w-4 mr-2" />
              Schedule Meeting
            </button>
            <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              <CheckSquare className="h-4 w-4 mr-2" />
              Create Task
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mt-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <span>{tab.name}</span>
                      {tab.count !== null && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Deal Value */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Value</h3>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  ${deal.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">{deal.currency}</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Win Probability</span>
                    <span className="text-sm font-medium text-gray-900">{deal.probability}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${deal.probability}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Key Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Owner</p>
                  <p className="text-sm font-medium text-gray-900">{deal.ownerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account</p>
                  <p className="text-sm font-medium text-gray-900">{deal.accountName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="text-sm font-medium text-gray-900">{deal.contactName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expected Close</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(deal.expectedCloseDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {deal.tags.map((tag, index) => (
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
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {activeTab === 'overview' && (
              <>
                {/* Basic Information */}
                {renderCollapsibleSection(
                  'basic',
                  'Deal Information',
                  Target,
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Deal Name</label>
                        <p className="text-lg font-medium text-gray-900">{deal.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Stage</label>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {deal.stage}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                        <p className="text-gray-700 leading-relaxed">{deal.description}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Account</label>
                        <p className="text-lg font-medium text-gray-900">{deal.accountName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Primary Contact</label>
                        <p className="text-lg font-medium text-gray-900">{deal.contactName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Next Steps</label>
                        <p className="text-gray-700 leading-relaxed">{deal.nextSteps}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Information */}
                {renderCollapsibleSection(
                  'financial',
                  'Financial Details',
                  DollarSign,
                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
                        <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-3" />
                        <p className="text-sm font-medium text-green-600 mb-1">Deal Value</p>
                        <p className="text-3xl font-bold text-green-700">
                          ${deal.amount.toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
                        <Target className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                        <p className="text-sm font-medium text-blue-600 mb-1">Win Probability</p>
                        <p className="text-3xl font-bold text-blue-700">{deal.probability}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-200">
                        <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                        <p className="text-sm font-medium text-purple-600 mb-1">Weighted Value</p>
                        <p className="text-3xl font-bold text-purple-700">
                          ${Math.round(deal.amount * deal.probability / 100).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'activity' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Activity Timeline</h3>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Activity
                  </button>
                </div>
                
                <div className="text-center py-16">
                  <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Activity timeline will be implemented here</p>
                </div>
              </div>
            )}

            {activeTab === 'emails' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Email Communications</h3>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Mail className="h-4 w-4 mr-2" />
                    Compose Email
                  </button>
                </div>
                
                <div className="text-center py-16">
                  <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Email communications will be implemented here</p>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Deal History</h3>
                
                <div className="text-center py-16">
                  <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Deal history will be implemented here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetailPage;