import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building, Globe, MapPin, Users, DollarSign, 
  TrendingUp, Star, Target, Zap, Plus, ChevronDown, ChevronUp,
  Clock, Activity, FileText, Mail, Phone, Calendar, Tag,
  Edit, Share, Download, Eye, Settings, Sparkles, Bot
} from 'lucide-react';
import { Company } from '../../types/leadGeneration';

const CompanyDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'prospects' | 'activity' | 'insights'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'metrics', 'technology']));

  // Mock company data
  const company: Company = {
    id: id || '1',
    name: 'TechCorp Solutions',
    domain: 'techcorp.com',
    website: 'https://techcorp.com',
    industry: 'Software',
    subIndustry: 'Enterprise Software',
    description: 'TechCorp Solutions is a leading provider of enterprise software solutions, specializing in CRM, automation tools, and business intelligence platforms. Founded in 2015, the company has grown rapidly to serve over 500 enterprise clients worldwide.',
    founded: 2015,
    employeeCount: 750,
    employeeRange: '500-1000',
    annualRevenue: 50000000,
    revenueRange: '$50M-$100M',
    headquarters: {
      street: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'United States',
      postalCode: '94105'
    },
    locations: [
      { city: 'New York', state: 'NY', country: 'United States' },
      { city: 'London', country: 'United Kingdom' },
      { city: 'Toronto', state: 'ON', country: 'Canada' }
    ],
    technologies: [
      { id: '1', name: 'React', category: 'Frontend Framework', confidence: 95 },
      { id: '2', name: 'Node.js', category: 'Backend Runtime', confidence: 90 },
      { id: '3', name: 'AWS', category: 'Cloud Platform', confidence: 85 },
      { id: '4', name: 'MongoDB', category: 'Database', confidence: 80 }
    ],
    techStack: ['React', 'Node.js', 'AWS', 'MongoDB', 'Kubernetes', 'Docker', 'TypeScript'],
    socialProfiles: [
      { platform: 'linkedin', url: 'https://linkedin.com/company/techcorp', followers: 15000, verified: true },
      { platform: 'twitter', url: 'https://twitter.com/techcorp', followers: 8500, verified: true }
    ],
    logoUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    fundingStage: 'Series B',
    totalFunding: 25000000,
    lastFundingDate: '2023-06-15',
    investors: ['Sequoia Capital', 'Andreessen Horowitz', 'Index Ventures'],
    alexaRank: 15000,
    monthlyVisitors: 250000,
    prospectCount: 45,
    contactedCount: 12,
    repliedCount: 3,
    tags: ['enterprise', 'saas', 'high-growth', 'series-b'],
    customFields: {
      'Decision Timeline': 'Q2 2024',
      'Budget Range': '$100K-$500K',
      'Current Solution': 'Salesforce',
      'Pain Points': 'Scalability, Integration complexity',
      'Key Stakeholders': 'CTO, VP Engineering, Head of Sales'
    },
    ownerId: 'user1',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    dataQuality: 92,
    enrichmentStatus: 'enriched',
    lastEnrichedAt: '2024-01-20T10:00:00Z'
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
    { id: 'overview', name: 'Overview', icon: Building, count: null },
    { id: 'prospects', name: 'Prospects', icon: Users, count: company.prospectCount },
    { id: 'activity', name: 'Activity', icon: Activity, count: 15 },
    { id: 'insights', name: 'AI Insights', icon: Sparkles, count: 3 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/lead-generation/companies')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  {company.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                    {company.fundingStage && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                        {company.fundingStage}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{company.industry}</span>
                    <span>•</span>
                    <span>{company.employeeRange} employees</span>
                    <span>•</span>
                    <span>{company.headquarters.city}, {company.headquarters.country}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900">Quality: {company.dataQuality}%</span>
              </div>
              
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                <Share className="h-4 w-4 mr-2" />
                Share
              </button>
              
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors">
                <Target className="h-4 w-4 mr-2" />
                Find Prospects
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Prospects</p>
                  <p className="text-2xl font-bold text-blue-700">{company.prospectCount}</p>
                </div>
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Contacted</p>
                  <p className="text-2xl font-bold text-green-700">{company.contactedCount}</p>
                </div>
                <Mail className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Replied</p>
                  <p className="text-2xl font-bold text-purple-700">{company.repliedCount}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Response Rate</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {company.contactedCount > 0 ? Math.round((company.repliedCount / company.contactedCount) * 100) : 0}%
                  </p>
                </div>
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
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
            {/* Company Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Website</p>
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {company.domain}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Headquarters</p>
                    <p className="text-sm font-medium text-gray-900">
                      {company.headquarters.city}, {company.headquarters.state} {company.headquarters.country}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Employees</p>
                    <p className="text-sm font-medium text-gray-900">{company.employeeCount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="text-sm font-medium text-gray-900">{company.revenueRange}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Founded</p>
                    <p className="text-sm font-medium text-gray-900">{company.founded}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Funding Info */}
            {company.fundingStage && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Funding Stage</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {company.fundingStage}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Funding</p>
                    <p className="text-lg font-bold text-green-600">
                      ${(company.totalFunding! / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Funding</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(company.lastFundingDate!).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Investors</p>
                    <div className="space-y-1">
                      {company.investors!.map(investor => (
                        <span key={investor} className="block text-sm text-gray-900">{investor}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {company.tags.map((tag, index) => (
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
                  'Basic Information',
                  Building,
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Company Name</label>
                        <p className="text-lg font-medium text-gray-900">{company.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Industry</label>
                        <p className="text-lg font-medium text-gray-900">{company.industry}</p>
                        {company.subIndustry && (
                          <p className="text-sm text-gray-600">{company.subIndustry}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                        <p className="text-gray-700 leading-relaxed">{company.description}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Website</label>
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-lg font-medium text-blue-600 hover:text-blue-800"
                        >
                          {company.domain}
                        </a>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Employee Count</label>
                        <p className="text-lg font-medium text-gray-900">{company.employeeCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Annual Revenue</label>
                        <p className="text-lg font-medium text-gray-900">{company.revenueRange}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Technology Stack */}
                {renderCollapsibleSection(
                  'technology',
                  'Technology Stack',
                  Zap,
                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {company.technologies.map(tech => (
                        <div key={tech.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{tech.name}</h4>
                            <span className="text-xs text-gray-500">{tech.confidence}%</span>
                          </div>
                          <p className="text-sm text-gray-600">{tech.category}</p>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${tech.confidence}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">All Technologies</h4>
                      <div className="flex flex-wrap gap-2">
                        {company.techStack.map(tech => (
                          <span key={tech} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Fields */}
                {Object.keys(company.customFields).length > 0 && renderCollapsibleSection(
                  'custom',
                  'Custom Fields',
                  Settings,
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(company.customFields).map(([key, value]) => (
                      <div key={key} className="p-4 bg-gray-50 rounded-lg">
                        <label className="block text-sm font-medium text-gray-600 mb-1">{key}</label>
                        <p className="text-sm font-medium text-gray-900">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'prospects' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Company Prospects</h3>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="h-4 w-4 mr-2" />
                    Find More Prospects
                  </button>
                </div>
                
                <div className="text-center py-16">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Prospect list will be implemented here</p>
                </div>
              </div>
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

            {activeTab === 'insights' && (
              <div className="space-y-6">
                {/* AI Insights */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Bot className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">AI Company Insights</h3>
                      <p className="text-sm text-gray-600">Powered by machine learning analysis</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">High Growth Potential</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        This company shows strong growth indicators with recent Series B funding and expanding team.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Ideal Customer Profile Match</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        87% match with your ideal customer profile based on industry, size, and technology stack.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-gray-900">Optimal Outreach Timing</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Best time to contact: Tuesday-Thursday, 10 AM - 2 PM PST based on industry patterns.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailPage;