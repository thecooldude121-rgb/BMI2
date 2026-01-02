import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, Star, TrendingUp,
  Activity, MessageSquare, FileText, Clock, User, Building, Tag,
  DollarSign, Target, Zap, ChevronDown, ChevronUp, Globe, ExternalLink,
  Copy, Send, Video, CheckCircle, AlertCircle, Bot, Sparkles,
  Database, Layers, BookOpen, Briefcase, Users, Settings, MoreHorizontal,
  LinkedinIcon, Twitter, Facebook, Instagram, Youtube, Trash2, Save
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { aiEngine } from '../../utils/aiEngine';

interface LeadDetail {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  industry: string;
  stage: string;
  status: string;
  score: number;
  aiScore: number;
  value: number;
  probability: number;
  source: string;
  assignedTo: string;
  createdAt: string;
  lastContact?: string;
  notes?: string;
  tags?: string[];
  temperature: 'hot' | 'warm' | 'cold';
  nextAction?: string;
  lastActivity?: string;
  
  // Enrichment data
  enrichment: {
    verified: boolean;
    emailValid: boolean;
    phoneValid: boolean;
    linkedinUrl?: string;
    twitterUrl?: string;
    companyDomain?: string;
    companySize?: string;
    companyRevenue?: string;
    companyFunding?: string;
    technologies?: string[];
    intent?: 'high' | 'medium' | 'low';
    buyingSignals?: string[];
    lastEnriched?: string;
    confidence: number;
  };
  
  // Account data
  account: {
    id: string;
    name: string;
    domain: string;
    industry: string;
    size: string;
    revenue: string;
    location: string;
    employees: number;
    founded: string;
    description: string;
    website?: string;
    phone?: string;
    socialProfiles?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
    };
    recentNews?: NewsItem[];
    competitors?: string[];
    technologies?: string[];
  };
  
  // Activity timeline
  activities: ActivityItem[];
  
  // AI insights
  aiInsights: AIInsight[];
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
}

interface ActivityItem {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'linkedin' | 'note' | 'task';
  title: string;
  description?: string;
  timestamp: string;
  outcome?: string;
  duration?: number;
  user: string;
}

interface AIInsight {
  id: string;
  type: 'persona_match' | 'buying_signal' | 'engagement_score' | 'next_action' | 'risk_assessment';
  title: string;
  description: string;
  confidence: number;
  actionItems: string[];
  priority: 'low' | 'medium' | 'high';
}

const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { leads, employees } = useData();
  
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'insights' | 'account'>('overview');
  const [expandedSections, setExpandedSections] = useState({
    contact: true,
    company: true,
    enrichment: true,
    insights: false
  });
  const [isEnriching, setIsEnriching] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      setLoading(true);
      
      // Find the lead from context data
      const foundLead = leads.find(l => l.id === id);
      
      if (foundLead) {
        // Enhance with Apollo.io-style data
        const enhancedLead: LeadDetail = {
          ...foundLead,
          firstName: foundLead.name.split(' ')[0] || '',
          lastName: foundLead.name.split(' ').slice(1).join(' ') || '',
          aiScore: aiEngine.scoreLeadFit(foundLead),
          temperature: foundLead.score > 80 ? 'hot' : foundLead.score > 60 ? 'warm' : 'cold',
          nextAction: 'Schedule discovery call',
          lastActivity: 'Emailed 2 days ago',
          
          enrichment: {
            verified: true,
            emailValid: true,
            phoneValid: true,
            linkedinUrl: `https://linkedin.com/in/${foundLead.name.toLowerCase().replace(' ', '')}`,
            twitterUrl: `https://twitter.com/${foundLead.name.toLowerCase().replace(' ', '')}`,
            companyDomain: `${foundLead.company.toLowerCase().replace(/\s+/g, '')}.com`,
            companySize: '201-500',
            companyRevenue: '$50M-$100M',
            companyFunding: 'Series B',
            technologies: ['Salesforce', 'HubSpot', 'AWS', 'Slack'],
            intent: 'high',
            buyingSignals: ['Job posting for sales roles', 'Recent funding round', 'Hiring VP of Sales'],
            lastEnriched: new Date().toISOString(),
            confidence: 92
          },
          
          account: {
            id: `account-${foundLead.id}`,
            name: foundLead.company,
            domain: `${foundLead.company.toLowerCase().replace(/\s+/g, '')}.com`,
            industry: foundLead.industry,
            size: '201-500',
            revenue: '$50M-$100M',
            location: 'San Francisco, CA',
            employees: 350,
            founded: '2015',
            description: `${foundLead.company} is a leading company in the ${foundLead.industry} industry, specializing in innovative solutions and cutting-edge technology.`,
            website: `https://${foundLead.company.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: '+1 (555) 123-4567',
            socialProfiles: {
              linkedin: `https://linkedin.com/company/${foundLead.company.toLowerCase().replace(/\s+/g, '')}`,
              twitter: `https://twitter.com/${foundLead.company.toLowerCase().replace(/\s+/g, '')}`,
              facebook: `https://facebook.com/${foundLead.company.toLowerCase().replace(/\s+/g, '')}`
            },
            recentNews: [
              {
                id: '1',
                title: `${foundLead.company} Raises $25M Series B Funding`,
                summary: 'Company announces significant funding round to accelerate growth and expand market presence.',
                url: '#',
                publishedAt: '2024-01-15',
                source: 'TechCrunch'
              },
              {
                id: '2',
                title: `${foundLead.company} Launches New Product Line`,
                summary: 'Innovative product launch targeting enterprise customers with advanced features.',
                url: '#',
                publishedAt: '2024-01-10',
                source: 'Business Wire'
              }
            ],
            competitors: ['CompetitorA', 'CompetitorB', 'CompetitorC'],
            technologies: ['Salesforce', 'HubSpot', 'AWS', 'Microsoft Office 365', 'Slack', 'Zoom']
          },
          
          activities: [
            {
              id: '1',
              type: 'email',
              title: 'Initial outreach email sent',
              description: 'Sent personalized introduction email with value proposition',
              timestamp: '2024-01-20T10:00:00Z',
              outcome: 'Opened, no reply yet',
              user: 'John Smith'
            },
            {
              id: '2',
              type: 'linkedin',
              title: 'LinkedIn connection request',
              description: 'Sent connection request with personalized message',
              timestamp: '2024-01-18T14:30:00Z',
              outcome: 'Accepted connection',
              user: 'John Smith'
            },
            {
              id: '3',
              type: 'call',
              title: 'Discovery call scheduled',
              description: 'Scheduled 30-minute discovery call to discuss requirements',
              timestamp: '2024-01-22T15:00:00Z',
              duration: 30,
              user: 'John Smith'
            }
          ],
          
          aiInsights: [
            {
              id: '1',
              type: 'persona_match',
              title: 'High Persona Match',
              description: 'This lead matches your highest-converting persona: Enterprise Tech Decision Makers',
              confidence: 94,
              actionItems: [
                'Focus on scalability and security benefits',
                'Mention similar customer success stories',
                'Propose enterprise-level features'
              ],
              priority: 'high'
            },
            {
              id: '2',
              type: 'buying_signal',
              title: 'Strong Buying Signals Detected',
              description: 'Multiple indicators suggest active evaluation of solutions',
              confidence: 87,
              actionItems: [
                'Accelerate outreach cadence',
                'Offer product demo',
                'Share relevant case studies'
              ],
              priority: 'high'
            },
            {
              id: '3',
              type: 'engagement_score',
              title: 'High Engagement Potential',
              description: 'Lead shows strong engagement patterns based on similar profiles',
              confidence: 82,
              actionItems: [
                'Personalize messaging with industry insights',
                'Reference recent company news',
                'Connect on LinkedIn first'
              ],
              priority: 'medium'
            }
          ]
        };
        
        setLead(enhancedLead);
      }
      
      setLoading(false);
    };

    fetchLead();
  }, [id, leads]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const enrichLead = async () => {
    setIsEnriching(true);
    // Simulate enrichment API call
    setTimeout(() => {
      if (lead) {
        setLead(prev => prev ? {
          ...prev,
          enrichment: {
            ...prev.enrichment,
            verified: true,
            emailValid: true,
            phoneValid: true,
            lastEnriched: new Date().toISOString(),
            confidence: 98
          }
        } : null);
      }
      setIsEnriching(false);
    }, 2000);
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unassigned';
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      email: Mail,
      call: Phone,
      meeting: Video,
      linkedin: MessageSquare,
      note: FileText,
      task: CheckCircle
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      email: 'text-blue-600 bg-blue-100',
      call: 'text-green-600 bg-green-100',
      meeting: 'text-purple-600 bg-purple-100',
      linkedin: 'text-indigo-600 bg-indigo-100',
      note: 'text-gray-600 bg-gray-100',
      task: 'text-orange-600 bg-orange-100'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const renderCollapsibleSection = (
    id: string,
    title: string,
    icon: React.ElementType,
    children: React.ReactNode,
    actions?: React.ReactNode
  ) => {
    const Icon = icon;
    const isExpanded = expandedSections[id as keyof typeof expandedSections];

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection(id as keyof typeof expandedSections)}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead Not Found</h2>
          <p className="text-gray-600 mb-4">The lead you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/lead-generation')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Lead Generation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/lead-generation')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
                    <div className={`w-3 h-3 rounded-full ${
                      lead.temperature === 'hot' ? 'bg-red-500' :
                      lead.temperature === 'warm' ? 'bg-orange-500' : 'bg-blue-500'
                    }`} />
                    {lead.enrichment.verified && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{lead.position} at {lead.company}</span>
                    <span>•</span>
                    <span>{lead.industry}</span>
                    <span>•</span>
                    <span>Lead #{lead.id}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
                <Star className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Score: {lead.score}</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 bg-purple-50 rounded-lg">
                <Bot className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">AI: {lead.aiScore}</span>
              </div>
              <button
                onClick={enrichLead}
                disabled={isEnriching}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {isEnriching ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Enrich Data
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <MoreHorizontal className="h-5 w-5 text-gray-600" />
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
              Call
            </button>
            <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Video className="h-4 w-4 mr-2" />
              Schedule Meeting
            </button>
            <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <MessageSquare className="h-4 w-4 mr-2" />
              LinkedIn Message
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Send className="h-4 w-4 mr-2" />
              Add to Sequence
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-6 mt-6">
            {[
              { id: 'overview', name: 'Overview', count: null },
              { id: 'activities', name: 'Activities', count: lead.activities.length },
              { id: 'insights', name: 'AI Insights', count: lead.aiInsights.length },
              { id: 'account', name: 'Account Intel', count: null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.name}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Quick Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-32">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Lead Intelligence</h3>
              
              {/* Score Breakdown */}
              <div className="space-y-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Bot className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">AI Score</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-700">{lead.aiScore}</p>
                  <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${lead.aiScore}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Lead Score</span>
                  </div>
                  <p className="text-3xl font-bold text-green-700">{lead.score}</p>
                  <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${lead.score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Deal Value</span>
                  <span className="font-semibold text-gray-900">${lead.value.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Probability</span>
                  <span className="font-semibold text-gray-900">{lead.probability}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Source</span>
                  <span className="font-semibold text-gray-900">{lead.source}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Owner</span>
                  <span className="font-semibold text-gray-900">{getEmployeeName(lead.assignedTo)}</span>
                </div>
              </div>

              {/* Data Quality */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Data Quality</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Verified</span>
                    {lead.enrichment.emailValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Phone Verified</span>
                    {lead.enrichment.phoneValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Profile Complete</span>
                    {lead.enrichment.verified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <span className="text-xs text-gray-500">
                    Confidence: {lead.enrichment.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {activeTab === 'overview' && (
              <>
                {/* Contact Information */}
                {renderCollapsibleSection(
                  'contact',
                  'Contact Information',
                  User,
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{lead.email}</p>
                            {lead.enrichment.emailValid && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>
                        <div className="ml-auto flex space-x-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <Phone className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">{lead.phone}</p>
                            {lead.enrichment.phoneValid && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>
                        <div className="ml-auto flex space-x-2">
                          <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                            <Copy className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                            <Phone className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {lead.enrichment.linkedinUrl && (
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <Globe className="h-5 w-5 text-blue-700" />
                          <div>
                            <p className="text-sm text-gray-600">LinkedIn</p>
                            <a 
                              href={lead.enrichment.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-blue-600 hover:text-blue-800"
                            >
                              View Profile
                            </a>
                          </div>
                          <div className="ml-auto">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2">Deal Potential</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Estimated Value</span>
                            <span className="font-bold text-green-800">${lead.value.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Win Probability</span>
                            <span className="font-bold text-green-800">{lead.probability}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Expected Revenue</span>
                            <span className="font-bold text-green-800">
                              ${Math.round(lead.value * (lead.probability / 100)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Lead Status</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              lead.stage === 'won' ? 'bg-green-100 text-green-800' :
                              lead.stage === 'qualified' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              lead.status === 'active' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Next Action: {lead.nextAction}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>,
                  <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Contact
                  </button>
                )}

                {/* Company Information */}
                {renderCollapsibleSection(
                  'company',
                  'Company Intelligence',
                  Building,
                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Company</p>
                          <p className="text-lg font-semibold text-gray-900">{lead.account.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Industry</p>
                          <p className="font-medium text-gray-900">{lead.account.industry}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Company Size</p>
                          <p className="font-medium text-gray-900">{lead.account.size} employees</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Revenue</p>
                          <p className="font-medium text-gray-900">{lead.account.revenue}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Location</p>
                          <p className="font-medium text-gray-900">{lead.account.location}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Founded</p>
                          <p className="font-medium text-gray-900">{lead.account.founded}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Website</p>
                          <a 
                            href={lead.account.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <span>{lead.account.domain}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Phone</p>
                          <p className="font-medium text-gray-900">{lead.account.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Technologies */}
                    {lead.account.technologies && lead.account.technologies.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-3">Technology Stack</p>
                        <div className="flex flex-wrap gap-2">
                          {lead.account.technologies.map((tech, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent News */}
                    {lead.account.recentNews && lead.account.recentNews.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Recent News</p>
                        <div className="space-y-3">
                          {lead.account.recentNews.map(news => (
                            <div key={news.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <h5 className="font-medium text-gray-900 mb-1">{news.title}</h5>
                              <p className="text-sm text-gray-600 mb-2">{news.summary}</p>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{news.source}</span>
                                <span>{new Date(news.publishedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>,
                  <button className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
                    <Building className="h-4 w-4 mr-2" />
                    View Account
                  </button>
                )}

                {/* Enrichment Data */}
                {renderCollapsibleSection(
                  'enrichment',
                  'Data Enrichment',
                  Database,
                  <div className="mt-6">
                    {/* Buying Signals */}
                    {lead.enrichment.buyingSignals && lead.enrichment.buyingSignals.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Zap className="h-5 w-5 mr-2 text-orange-500" />
                          Buying Signals
                        </h4>
                        <div className="space-y-2">
                          {lead.enrichment.buyingSignals.map((signal, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <Zap className="h-4 w-4 text-orange-600" />
                              <span className="text-sm text-orange-800 font-medium">{signal}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Intent Score */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Buying Intent</h4>
                      <div className={`p-4 rounded-lg border ${
                        lead.enrichment.intent === 'high' ? 'bg-red-50 border-red-200' :
                        lead.enrichment.intent === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold ${
                            lead.enrichment.intent === 'high' ? 'text-red-700' :
                            lead.enrichment.intent === 'medium' ? 'text-yellow-700' :
                            'text-blue-700'
                          }`}>
                            {lead.enrichment.intent?.charAt(0).toUpperCase() + lead.enrichment.intent?.slice(1)} Intent
                          </span>
                          <span className="text-sm text-gray-600">
                            Last updated: {new Date(lead.enrichment.lastEnriched || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Social Profiles */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Social Profiles</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {lead.enrichment.linkedinUrl && (
                          <a
                            href={lead.enrichment.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Globe className="h-4 w-4 text-blue-700" />
                            <span className="text-sm font-medium text-gray-900">LinkedIn</span>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </a>
                        )}
                        {lead.enrichment.twitterUrl && (
                          <a
                            href={lead.enrichment.twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Globe className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-medium text-gray-900">Twitter</span>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>,
                  <button
                    onClick={enrichLead}
                    disabled={isEnriching}
                    className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {isEnriching ? (
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    Enrich
                  </button>
                )}
              </>
            )}

            {activeTab === 'activities' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      <Plus className="h-4 w-4 mr-2" />
                      Log Activity
                    </button>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {lead.activities.map(activity => {
                    const Icon = getActivityIcon(activity.type);
                    const colorClasses = getActivityColor(activity.type);
                    
                    return (
                      <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-lg ${colorClasses}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                              <span className="text-sm text-gray-500">
                                {new Date(activity.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {activity.description && (
                              <p className="text-gray-600 mb-2">{activity.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>By {activity.user}</span>
                              {activity.duration && (
                                <span>{activity.duration} minutes</span>
                              )}
                              {activity.outcome && (
                                <span className="text-green-600">Outcome: {activity.outcome}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Bot className="h-6 w-6 text-purple-600" />
                    <h3 className="text-xl font-semibold text-purple-900">AI-Powered Insights</h3>
                  </div>
                  <p className="text-purple-700">
                    Our AI has analyzed this lead's profile, company data, and behavioral patterns to provide actionable insights.
                  </p>
                </div>

                {lead.aiInsights.map(insight => (
                  <div key={insight.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${
                          insight.priority === 'high' ? 'bg-red-100' :
                          insight.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          <Sparkles className={`h-5 w-5 ${
                            insight.priority === 'high' ? 'text-red-600' :
                            insight.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{insight.title}</h4>
                          <p className="text-gray-600">{insight.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-500">Confidence</span>
                        <p className="text-lg font-bold text-blue-600">{insight.confidence}%</p>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Recommended Actions:</h5>
                      <ul className="space-y-1">
                        {insight.actionItems.map((item, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'account' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Intelligence</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Company Overview</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                        <p className="text-sm text-gray-700">{lead.account.description}</p>
                      </div>
                      
                      {lead.account.competitors && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Competitors</h5>
                          <div className="flex flex-wrap gap-2">
                            {lead.account.competitors.map((competitor, index) => (
                              <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                                {competitor}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Social Presence</h4>
                    <div className="space-y-3">
                      {lead.account.socialProfiles?.linkedin && (
                        <a
                          href={lead.account.socialProfiles.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Globe className="h-5 w-5 text-blue-700" />
                          <span className="font-medium text-gray-900">LinkedIn Company Page</span>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </a>
                      )}
                      {lead.account.socialProfiles?.twitter && (
                        <a
                          href={lead.account.socialProfiles.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Globe className="h-5 w-5 text-blue-400" />
                          <span className="font-medium text-gray-900">Twitter</span>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </a>
                      )}
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

export default LeadDetailPage;