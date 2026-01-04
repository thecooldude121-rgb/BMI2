import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Linkedin, MoreHorizontal, Plus, Send,
  Building, MapPin, Users, DollarSign, Calendar, TrendingUp,
  Briefcase, Globe, ExternalLink, Bot, Sparkles, Database,
  CheckCircle, AlertCircle, RefreshCw, FileText, Upload, Clock,
  Target, Zap, Award, Settings
} from 'lucide-react';

interface DecisionMaker {
  id: string;
  name: string;
  position: string;
  email: string;
  isCurrentLead?: boolean;
}

interface SimilarLead {
  id: string;
  name: string;
  company: string;
  source: 'hrms' | 'intelligence' | 'apollo';
  score: number;
  industry: string;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  details: string;
  timestamp: string;
  user: string;
}

interface LeadData {
  id: string;
  name: string;
  position: string;
  company: string;
  industry: string;
  employees: number;
  revenue: string;
  score: number;
  email: string;
  phone: string;
  linkedinUrl: string;
  status: string;
  statusColor: string;
  source: 'hrms' | 'intelligence' | 'apollo' | 'manual';

  scoreBreakdown: {
    fit: number;
    engagement: number;
    intent: number;
  };

  hrmsBonus?: {
    baseScore: number;
    bonusPercent: number;
    bonusPoints: number;
    finalScore: number;
    recruited: string;
    recruiter: string;
    placementFee: number;
  };

  intelligenceSignal?: {
    type: string;
    event: string;
    date: string;
    source: string;
    aiAnalysis: string[];
    relatedSignals: string[];
  };

  conversionProbability: number;

  whyThisScore: {
    positive: string[];
    negative: string[];
  };

  recommendations: {
    action: string;
    reason: string;
  }[];

  companyInfo: {
    name: string;
    industry: string;
    revenue: string;
    employees: number;
    founded: string;
    location: string;
    techStack: string[];
    recentNews: {
      title: string;
      date: string;
    }[];
  };

  decisionMakers: DecisionMaker[];
  similarLeads: SimilarLead[];

  enrichmentSources: {
    name: string;
    date: string;
    verified: boolean;
  }[];

  activities: ActivityItem[];

  notes: {
    id: string;
    content: string;
    author: string;
    timestamp: string;
  }[];
}

const leadData: Record<string, LeadData> = {
  '1': {
    id: '1',
    name: 'Sarah Lee',
    position: 'CFO',
    company: 'TechStart Inc',
    industry: 'FinTech',
    employees: 45,
    revenue: '$8M',
    score: 92,
    email: 'sarah@techstart.com',
    phone: '+1 555-0456',
    linkedinUrl: 'https://linkedin.com/in/sarahlee',
    status: 'New',
    statusColor: 'green',
    source: 'hrms',

    scoreBreakdown: {
      fit: 90,
      engagement: 85,
      intent: 88
    },

    hrmsBonus: {
      baseScore: 69,
      bonusPercent: 33,
      bonusPoints: 23,
      finalScore: 92,
      recruited: 'Nov 2024',
      recruiter: 'Jane Smith',
      placementFee: 15000
    },

    conversionProbability: 67,

    whyThisScore: {
      positive: [
        'HRMS warm lead',
        'Recent funding $10M',
        'Decision maker (CFO)',
        'Company growth signal'
      ],
      negative: [
        'No engagement yet'
      ]
    },

    recommendations: [
      {
        action: 'Contact within 48h',
        reason: 'High intent window'
      },
      {
        action: 'Mention HRMS connection',
        reason: 'Warm intro advantage'
      },
      {
        action: 'Add to "HRMS Warm Lead" sequence',
        reason: 'Proven conversion path'
      },
      {
        action: 'Complete BANT qualification',
        reason: 'Ready for qualification'
      }
    ],

    companyInfo: {
      name: 'TechStart Inc',
      industry: 'FinTech',
      revenue: '$8M',
      employees: 45,
      founded: '2019',
      location: 'San Francisco, CA',
      techStack: ['AWS', 'Salesforce', 'Slack', 'Stripe'],
      recentNews: [
        { title: 'Raised $10M Series A', date: 'Nov 2024' },
        { title: 'Hired VP of Sales', date: 'Nov 2024' },
        { title: 'Expanding to NYC', date: 'Oct 2024' }
      ]
    },

    decisionMakers: [
      {
        id: '1',
        name: 'Sarah Lee',
        position: 'CFO, Decision Maker',
        email: 'sarah@techstart.com',
        isCurrentLead: true
      },
      {
        id: '2',
        name: 'Robert Chen',
        position: 'CEO, Co-Founder',
        email: 'robert@techstart.com'
      },
      {
        id: '3',
        name: 'Michael Zhang',
        position: 'CTO, Co-Founder',
        email: 'michael@techstart.com'
      }
    ],

    similarLeads: [
      {
        id: '2',
        name: 'Emma Wilson',
        company: 'InnovateLabs',
        source: 'hrms',
        score: 94,
        industry: 'HealthTech'
      },
      {
        id: '3',
        name: 'Alex Johnson',
        company: 'DataVerse',
        source: 'hrms',
        score: 90,
        industry: 'Data'
      },
      {
        id: '4',
        name: 'Robert Chang',
        company: 'DataFlow',
        source: 'intelligence',
        score: 85,
        industry: 'Data'
      }
    ],

    enrichmentSources: [
      { name: 'Apollo.io', date: 'Nov 15', verified: true },
      { name: 'ZoomInfo', date: 'Nov 14', verified: true },
      { name: 'Clearbit', date: 'Nov 15', verified: true },
      { name: 'LinkedIn', date: 'Nov 15', verified: true }
    ],

    activities: [
      {
        id: '1',
        type: 'Lead created from HRMS',
        description: 'Source: HRMS recruitment',
        details: 'Auto-assigned to Sarah C.\nInitial score: 92/100',
        timestamp: 'Nov 15, 2024 - Just now',
        user: 'System (Auto)'
      },
      {
        id: '2',
        type: 'Lead enriched',
        description: 'Apollo.io: +12 data pts',
        details: 'ZoomInfo: Company info\nClearbit: Tech stack',
        timestamp: 'Nov 15, 2024 - 10m ago',
        user: 'System (Auto)'
      },
      {
        id: '3',
        type: 'Note added',
        description: '"High priority HRMS lead - Contact ASAP"',
        details: '',
        timestamp: 'Nov 15, 2024 - 5m ago',
        user: 'Sarah C.'
      }
    ],

    notes: [
      {
        id: '1',
        content: 'High priority HRMS lead - Contact ASAP. Mention our HRMS relationship and their recent funding round.',
        author: 'Sarah C.',
        timestamp: 'Nov 15, 2024'
      }
    ]
  }
};

const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEnriching, setIsEnriching] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);

  const lead = leadData[id || '1'] || leadData['1'];

  const handleEnrich = () => {
    setIsEnriching(true);
    setTimeout(() => setIsEnriching(false), 2000);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'hrms': return '🏢';
      case 'intelligence': return '🔔';
      case 'apollo': return '🎯';
      default: return '✍️';
    }
  };

  const renderScoreDots = (score: number) => {
    const filled = Math.ceil(score / 10);
    return (
      <div className="flex items-center space-x-1">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full ${
              i < filled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button onClick={() => navigate('/lead-generation')} className="hover:text-blue-600">
            Dashboard
          </button>
          <span>›</span>
          <button onClick={() => navigate('/lead-generation/leads')} className="hover:text-blue-600">
            Leads
          </button>
          <span>›</span>
          <span className="text-gray-900 font-medium">{lead.name}</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <button
              onClick={() => navigate('/lead-generation/leads')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{getSourceIcon(lead.source)}</span>
                <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
              </div>
              <div className="flex items-center space-x-4 text-gray-600 mb-3">
                <span>{lead.position} at {lead.company}</span>
                <span>•</span>
                <span>{lead.industry}</span>
                <span>•</span>
                <span>{lead.employees} employees</span>
                <span>•</span>
                <span>{lead.revenue} revenue</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <a href={`mailto:${lead.email}`} className="flex items-center space-x-1 text-blue-600 hover:text-blue-700">
                  <Mail className="h-4 w-4" />
                  <span>{lead.email}</span>
                </a>
                <a href={`tel:${lead.phone}`} className="flex items-center space-x-1 text-blue-600 hover:text-blue-700">
                  <Phone className="h-4 w-4" />
                  <span>{lead.phone}</span>
                </a>
                <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-blue-600 hover:text-blue-700">
                  <Linkedin className="h-4 w-4" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Score: {lead.score}/100</div>
              {renderScoreDots(lead.score)}
              <div className="mt-2 text-sm">
                <span className="text-2xl">{getSourceIcon(lead.source)}</span>
                <span className="ml-1 text-gray-600">{lead.source.toUpperCase()} Source</span>
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${lead.statusColor}-100 text-${lead.statusColor}-700`}>
                  <span className={`w-2 h-2 rounded-full bg-${lead.statusColor}-500 mr-2`}></span>
                  Status: {lead.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Phone className="h-4 w-4 mr-2" />
            Call
          </button>
          <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add to Sequence
          </button>
          <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <CheckCircle className="h-4 w-4 mr-2" />
            Qualify
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings className="h-4 w-4 mr-2" />
            More
          </button>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 65% */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Lead Intelligence */}
            <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-blue-50 rounded-xl border border-purple-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Bot className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-purple-900">AI INSIGHTS</h2>
              </div>

              <div className="space-y-6">
                {/* Overall Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-900">Overall Score: {lead.score}/100</span>
                    <span className="text-xs text-purple-700">(Top 5%)</span>
                  </div>
                  {renderScoreDots(lead.score)}
                </div>

                {/* Score Breakdown */}
                <div>
                  <h3 className="text-sm font-semibold text-purple-900 mb-3">Score Breakdown:</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-purple-800">Fit: {lead.scoreBreakdown.fit}/100</span>
                      </div>
                      {renderScoreDots(lead.scoreBreakdown.fit)}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-purple-800">Engagement: {lead.scoreBreakdown.engagement}/100</span>
                      </div>
                      {renderScoreDots(lead.scoreBreakdown.engagement)}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-purple-800">Intent: {lead.scoreBreakdown.intent}/100</span>
                      </div>
                      {renderScoreDots(lead.scoreBreakdown.intent)}
                    </div>
                  </div>
                </div>

                {/* HRMS Bonus */}
                {lead.hrmsBonus && (
                  <div className="bg-white/80 rounded-lg p-4 border border-purple-300">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-2xl">🏢</span>
                      <h4 className="text-sm font-semibold text-purple-900">HRMS Bonus: +{lead.hrmsBonus.bonusPercent}%</h4>
                    </div>
                    <div className="space-y-1 text-sm text-purple-800">
                      <div className="flex justify-between">
                        <span>Base Score:</span>
                        <span className="font-medium">{lead.hrmsBonus.baseScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>After Bonus:</span>
                        <span className="font-medium">{lead.hrmsBonus.finalScore} ⬆️</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conversion Probability */}
                <div>
                  <h3 className="text-sm font-semibold text-purple-900 mb-2">Conversion Probability:</h3>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-purple-700">{lead.conversionProbability}%</span>
                    <span className="text-sm text-purple-800">(High!)</span>
                  </div>
                  <div className="mt-2">
                    {renderScoreDots(lead.conversionProbability)}
                  </div>
                </div>

                {/* Why This Score */}
                <div>
                  <h3 className="text-sm font-semibold text-purple-900 mb-3">Why This Score?</h3>
                  <div className="space-y-2">
                    {lead.whyThisScore.positive.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-purple-800">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                    {lead.whyThisScore.negative.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-purple-800">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Actions */}
                <div>
                  <h3 className="text-sm font-semibold text-purple-900 mb-3">Recommended Actions:</h3>
                  <ol className="space-y-2">
                    {lead.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="text-sm text-purple-800">
                        <span className="font-medium">{index + 1}. {rec.action}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* Enrichment Data */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Database className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Company Information</h2>
                </div>
                <button
                  onClick={handleEnrich}
                  disabled={isEnriching}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {isEnriching ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Enriching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-enrich Data
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Company</p>
                  <p className="font-semibold text-gray-900">{lead.companyInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Industry</p>
                  <p className="font-semibold text-gray-900">{lead.companyInfo.industry}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Revenue</p>
                  <p className="font-semibold text-gray-900">{lead.companyInfo.revenue} <span className="text-xs text-gray-500">(Apollo.io)</span></p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Employees</p>
                  <p className="font-semibold text-gray-900">{lead.companyInfo.employees}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Founded</p>
                  <p className="font-semibold text-gray-900">{lead.companyInfo.founded}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">HQ</p>
                  <p className="font-semibold text-gray-900">{lead.companyInfo.location}</p>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">Tech Stack:</p>
                <div className="flex flex-wrap gap-2">
                  {lead.companyInfo.techStack.map((tech, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recent News */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Recent News:</p>
                <div className="space-y-2">
                  {lead.companyInfo.recentNews.map((news, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">• {news.title}</span>
                      <span className="text-gray-500">({news.date})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Decision Makers Found */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Users className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Decision Makers Found ({lead.decisionMakers.length})</h2>
              </div>

              <div className="space-y-4">
                {lead.decisionMakers.map((dm) => (
                  <div key={dm.id} className={`p-4 rounded-lg border ${dm.isCurrentLead ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                          {dm.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-gray-900">{dm.name}</p>
                            {dm.isCurrentLead && (
                              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">This lead</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{dm.position}</p>
                          <p className="text-sm text-blue-600">{dm.email}</p>
                          <div className="flex items-center space-x-3 mt-2">
                            <a href="#" className="text-sm text-blue-600 hover:text-blue-700">LinkedIn</a>
                            {!dm.isCurrentLead && (
                              <>
                                <span className="text-gray-300">|</span>
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Add Lead</button>
                              </>
                            )}
                            {dm.isCurrentLead && (
                              <>
                                <span className="text-gray-300">|</span>
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HRMS Connection */}
            {lead.hrmsBonus && (
              <div className="bg-purple-50 rounded-xl border-2 border-purple-300 shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-3xl">🏢</span>
                  <h2 className="text-xl font-bold text-purple-900">FROM HRMS</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-purple-700 mb-1">Recruited:</p>
                    <p className="font-semibold text-purple-900">{lead.hrmsBonus.recruited}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 mb-1">Company:</p>
                    <p className="font-semibold text-purple-900">{lead.company}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 mb-1">Employee:</p>
                    <p className="font-semibold text-purple-900">{lead.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 mb-1">Position:</p>
                    <p className="font-semibold text-purple-900">{lead.position}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 mb-1">Recruiter:</p>
                    <p className="font-semibold text-purple-900">{lead.hrmsBonus.recruiter}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 mb-1">Placement Fee:</p>
                    <p className="font-semibold text-purple-900">${lead.hrmsBonus.placementFee.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-white/80 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Target className="h-5 w-5 text-purple-600" />
                    <h3 className="text-sm font-semibold text-purple-900">Warm Lead Advantage:</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-purple-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Existing relationship</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-purple-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>+33% score bonus</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-purple-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>2x higher close rate</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-purple-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Faster sales cycle</span>
                    </div>
                  </div>
                </div>

                <button className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Building className="h-4 w-4 mr-2" />
                  View in HRMS Module
                </button>
              </div>
            )}

            {/* Intelligence Signal */}
            {lead.intelligenceSignal && (
              <div className="bg-orange-50 rounded-xl border-2 border-orange-300 shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-3xl">🔔</span>
                  <h2 className="text-xl font-bold text-orange-900">Intelligence Signal</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-orange-700 mb-1">Signal Type:</p>
                    <p className="font-semibold text-orange-900">{lead.intelligenceSignal.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-orange-700 mb-1">Event:</p>
                    <p className="font-semibold text-orange-900">{lead.intelligenceSignal.event}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-orange-700 mb-1">Date:</p>
                      <p className="font-semibold text-orange-900">{lead.intelligenceSignal.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-orange-700 mb-1">Source:</p>
                      <p className="font-semibold text-orange-900">{lead.intelligenceSignal.source}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-orange-900 mb-2">AI Analysis:</p>
                    <div className="space-y-1">
                      {lead.intelligenceSignal.aiAnalysis.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-orange-800">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-orange-900 mb-2">Related Signals:</p>
                    <div className="space-y-1">
                      {lead.intelligenceSignal.relatedSignals.map((item, index) => (
                        <p key={index} className="text-sm text-orange-800">• {item}</p>
                      ))}
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                    View Full Signal
                  </button>
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Clock className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Activity History</h2>
              </div>

              <div className="space-y-4">
                {lead.activities.map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-b-0">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900">{activity.timestamp}</p>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">{activity.type}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      {activity.details && (
                        <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{activity.details}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">By: {activity.user}</p>
                    </div>
                  </div>
                ))}
                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2">
                  Load More Activity...
                </button>
              </div>
            </div>

            {/* Notes & Files */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">Notes ({lead.notes.length})</h2>
                  </div>
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </button>
                </div>

                <div className="space-y-3">
                  {lead.notes.map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{note.author}</span>
                        <span className="text-xs text-gray-500">{note.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-700">"{note.content}"</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Upload className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">Files (0)</h2>
                  </div>
                  <button
                    onClick={() => setShowFileModal(true)}
                    className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload File
                  </button>
                </div>
                <p className="text-sm text-gray-500">No files uploaded yet</p>
              </div>
            </div>
          </div>

          {/* Right Column - 35% */}
          <div className="space-y-6">
            {/* Lead Score Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Target className="h-6 w-6 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">AI Lead Score</h2>
              </div>

              <div className="text-center mb-6">
                <p className="text-5xl font-bold text-blue-600 mb-2">{lead.score}/100</p>
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {renderScoreDots(lead.score)}
                </div>
                <p className="text-sm font-semibold text-green-600">Excellent!</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Fit Score: {lead.scoreBreakdown.fit}/100</span>
                  </div>
                  {renderScoreDots(lead.scoreBreakdown.fit)}
                  <p className="text-xs text-gray-500 mt-1">(Company size, Industry)</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Engagement: {lead.scoreBreakdown.engagement}/100</span>
                  </div>
                  {renderScoreDots(lead.scoreBreakdown.engagement)}
                  <p className="text-xs text-gray-500 mt-1">(Email opens, site visits)</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Intent: {lead.scoreBreakdown.intent}/100</span>
                  </div>
                  {renderScoreDots(lead.scoreBreakdown.intent)}
                  <p className="text-xs text-gray-500 mt-1">(Funding signal, Hiring)</p>
                </div>
              </div>

              {lead.hrmsBonus && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">🏢</span>
                    <h3 className="text-sm font-semibold text-purple-900">HRMS Bonus Applied</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-purple-800">
                      <span>Base Score:</span>
                      <span className="font-medium">{lead.hrmsBonus.baseScore}</span>
                    </div>
                    <div className="flex justify-between text-purple-800">
                      <span>Bonus: +{lead.hrmsBonus.bonusPercent}%</span>
                      <span className="font-medium">+{lead.hrmsBonus.bonusPoints} points</span>
                    </div>
                    <div className="flex justify-between text-purple-900 font-bold">
                      <span>Final Score:</span>
                      <span>{lead.hrmsBonus.finalScore} 🚀</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Conversion Probability:</p>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-gray-900">{lead.conversionProbability}%</span>
                </div>
                <div className="mt-2">
                  {renderScoreDots(lead.conversionProbability)}
                </div>
              </div>

              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                View Score History
              </button>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Bot className="h-6 w-6 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">Next Best Actions</h2>
              </div>

              <div className="space-y-4 mb-6">
                {lead.recommendations.map((rec, index) => (
                  <div key={index}>
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">{index === 0 ? '⚡' : index === 1 ? '💬' : index === 2 ? '📧' : '✅'}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{index + 1}. {rec.action}</p>
                        <p className="text-xs text-gray-600">({rec.reason})</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">Why These Actions?</p>
                <div className="space-y-1 text-xs text-blue-800">
                  <p>• HRMS leads convert 2x better</p>
                  <p>• Funding = Budget confirmed</p>
                  <p>• CFO = Decision maker</p>
                </div>
              </div>
            </div>

            {/* Similar Leads */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Similar Leads (3)</h2>

              <div className="space-y-3">
                {lead.similarLeads.map((similar) => (
                  <div key={similar.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{similar.name}</p>
                      <span className="text-xl">{getSourceIcon(similar.source)}</span>
                    </div>
                    <p className="text-xs text-gray-600">{similar.company}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{similar.source.toUpperCase()} | {similar.industry}</span>
                      <span className="text-xs font-semibold text-blue-600">Score: {similar.score}</span>
                    </div>
                    <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                      [View Lead]
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Enrichment Sources */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Enrichment Sources</h2>

              <div className="space-y-2 mb-4">
                {lead.enrichmentSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      {source.verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className="text-gray-900">{source.name}</span>
                    </div>
                    <span className="text-gray-500">({source.date})</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mb-4">Last Updated: Nov 15, 2024</p>

              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure Sources
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailPage;
