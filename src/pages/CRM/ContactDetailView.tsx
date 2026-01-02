import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Calendar, DollarSign, Edit, MoreVertical, ExternalLink, MapPin,
  Building2, Linkedin, Cake, Plus, FileText, Upload, Target, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Sparkles, Users, BarChart3, Zap, Play, Share2, Globe, Star,
  User, MessageSquare, Send, Download
} from 'lucide-react';
import { sampleContacts } from '../../utils/sampleContacts';
import ActiveDealsSection from '../../components/Contact/ActiveDealsSection';

const ContactDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const contact = sampleContacts.find(c => c.id === id) || sampleContacts[0];

  // State management for modals and forms
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showCallLogger, setShowCallLogger] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [showDealForm, setShowDealForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [emailScheduleMode, setEmailScheduleMode] = useState<'now' | 'later' | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  const mockContact = {
    name: 'John Smith',
    title: 'VP Sales',
    company: 'Acme Corp',
    email: 'john@acme.com',
    phone: '+1 555-0123',
    linkedin: '/in/johnsmith',
    location: 'San Francisco, CA',
    source: 'Lead Gen (Apollo.io)',
    added: 'Nov 15, 2025',
    tags: ['VIP', 'Decision Maker', 'Hot'],
    aiEnriched: true,
    enrichedDataPoints: 12
  };

  const mockData = {
    engagement: {
      score: 87,
      level: 'Very High',
      meetingsLast30Days: 3,
      sentimentAvg: 85,
      emailResponseRate: 92,
      industryAvg: 35,
      responseTime: '2 hours'
    },
    health: {
      status: 'Healthy & Active',
      strengths: [
        'Responds quickly (avg 2 hours)',
        'High meeting attendance (100%)',
        'Positive sentiment in conversations (85%)',
        'Influencer in organization (VP level)'
      ],
      risks: [{
        text: 'Competitor mention in last meeting',
        action: 'Address competitive positioning'
      }]
    },
    deal: {
      title: 'Acme Corp - Enterprise Plan',
      value: 50000,
      stage: 'Proposal',
      closeDate: 'March 15, 2026',
      owner: 'Alex Rodriguez (You)',
      aiHealth: 78,
      winProbability: 67,
      daysInStage: 8,
      lastActivity: 'Nov 15 (Meeting)'
    },
    timeline: [
      {
        date: 'Today (Nov 15)',
        time: '2:00 PM',
        type: 'meeting',
        title: 'Acme Corp Product Demo',
        duration: '45 minutes',
        location: 'Zoom (Recording available)',
        hasAiNotes: true
      },
      {
        date: 'Yesterday (Nov 14)',
        time: '3:15 PM',
        type: 'email',
        title: 'Proposal Preview',
        status: 'Opened 3 times',
        engagement: '3 opens, 4 mins avg read time'
      },
      {
        date: 'Nov 13',
        time: '10:30 AM',
        type: 'call',
        title: 'Discovery Call',
        duration: '25 minutes',
        notes: 'Interested in automation features. Current pain: Manual data entry.'
      },
      {
        date: 'Nov 10',
        time: '9:00 AM',
        type: 'created',
        title: 'Contact Created',
        source: 'Converted from Lead (Apollo.io)',
        enrichment: '+12 data points added'
      }
    ],
    scores: {
      overall: 87,
      breakdown: {
        engagement: 92,
        dealPotential: 85,
        responsiveness: 95,
        influence: 78
      }
    },
    predictions: {
      closeProbability: 67,
      optimalContactTime: 'Nov 18 (Tuesday) at 2-4 PM',
      churnRisk: 8,
      upsellOpportunity: 'Medium',
      upsellValue: 25000
    },
    similarContacts: [
      { name: 'Sarah Lee', title: 'CFO, TechStart', similarity: 89, deal: '$42K - Negotiation' },
      { name: 'Mike Chen', title: 'Director, BigCo', similarity: 82, deal: '$75K - Qualified' }
    ]
  };

  // Action handlers
  const handleEditContact = () => {
    navigate(`/crm/contacts/${id}/edit`);
  };

  const handleMoreOptions = (action: string) => {
    setShowMoreOptions(false);
    switch (action) {
      case 'delete':
        if (confirm('Are you sure you want to delete this contact?')) {
          console.log('Delete contact');
          navigate('/crm/contacts');
        }
        break;
      case 'merge':
        console.log('Open merge contact dialog');
        break;
      case 'export':
        console.log('Export contact data');
        break;
      case 'share':
        console.log('Share contact');
        break;
    }
  };

  const handleEmailComposer = () => {
    setShowEmailComposer(true);
    console.log('Open email composer');
  };

  const handleCallLogger = () => {
    setShowCallLogger(true);
    console.log('Open call logging form');
  };

  const handleMeetingScheduler = () => {
    setShowMeetingScheduler(true);
    console.log('Open meeting scheduler');
  };

  const handleCreateDeal = () => {
    setShowDealForm(true);
    console.log('Open deal creation form with contact:', mockContact.name);
  };

  const handleSendEmail = (mode: 'now' | 'later') => {
    setEmailScheduleMode(mode);
    setShowEmailComposer(true);
    console.log(`Send email ${mode}`);
  };

  const handleCreateTask = () => {
    setShowTaskForm(true);
    console.log('Open task creation form');
  };

  const handleAddNote = () => {
    setShowNoteEditor(true);
    console.log('Open note editor');
  };

  const handleViewDeal = () => {
    navigate(`/crm/deals/${id}`);
  };

  const handleUpdateStage = () => {
    console.log('Open stage update dropdown');
  };

  const handleViewAccount = () => {
    navigate(`/crm/accounts/${id}`);
  };

  const handleSearchHRMS = () => {
    navigate(`/hrms/search?company=${encodeURIComponent(mockContact.company)}`);
  };

  const handleAddRecruitmentTarget = () => {
    console.log('Add to recruitment target list');
    alert(`${mockContact.company} added to recruitment target list`);
  };

  const handleViewTranscript = () => {
    navigate(`/crm/meetings/${id}/transcript`);
  };

  const handlePlayRecording = () => {
    console.log('Play meeting recording');
    alert('Opening meeting recording player...');
  };

  const handleShareSummary = () => {
    console.log('Share AI summary');
    alert('AI summary copied to clipboard and ready to share');
  };

  const handleViewEmail = () => {
    console.log('View email details');
  };

  const handleSendFollowup = () => {
    setShowEmailComposer(true);
    console.log('Open email composer with follow-up context');
  };

  const handleViewLeadHistory = () => {
    navigate(`/crm/leads/${id}`);
  };

  const handleLoadMoreActivities = () => {
    console.log('Load more activities');
  };

  const handleFileUpload = () => {
    setShowFileUpload(true);
    console.log('Open file upload dialog');
  };

  const handleDownloadFile = (filename: string) => {
    console.log('Download file:', filename);
  };

  const handleViewSimilarContact = (contactId: string) => {
    navigate(`/crm/contacts/${contactId}`);
  };

  const handleReEnrich = () => {
    console.log('Re-enriching contact data...');
    alert('Re-enriching contact data from Apollo.io, LinkedIn, and Clearbit...');
  };

  const handleVerifyData = () => {
    console.log('Open data verification wizard');
    alert('Opening data verification wizard...');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <button onClick={() => navigate('/crm/contacts')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /><span className="text-sm">Contacts</span>
        </button>
        <div className="mt-2 text-sm text-gray-500">Contacts &gt; <span className="text-gray-900 font-medium">{mockContact.name}</span></div>
      </div>

      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-6">
            <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {contact.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 flex items-center space-x-3">
                  <span>{mockContact.name}</span>
                  {mockContact.tags.includes('VIP') && <span className="text-2xl">⭐</span>}
                </h1>
                <p className="text-xl text-gray-600 mt-1">{mockContact.title} at {mockContact.company}</p>
                <div className="flex items-center space-x-2 text-gray-500 mt-2">
                  <MapPin className="h-4 w-4" /><span>{mockContact.location}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <a href={`mailto:${mockContact.email}`} className="text-blue-600 hover:underline">{mockContact.email}</a>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  <a href={`tel:${mockContact.phone}`} className="text-gray-700 hover:underline">{mockContact.phone}</a>
                </div>
                <div className="flex items-center space-x-2">
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  <a href="#" className="text-blue-700 hover:underline">{mockContact.linkedin}</a>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Cake className="h-4 w-4" /><span>Added: {mockContact.added}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 font-medium">Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {mockContact.tags.map((tag, idx) => {
                    const colors: Record<string, string> = {
                      VIP: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                      'Decision Maker': 'bg-blue-100 text-blue-800 border-blue-300',
                      Hot: 'bg-red-100 text-red-800 border-red-300'
                    };
                    return (
                      <span key={idx} className={`px-3 py-1 text-xs rounded-full font-semibold border ${colors[tag] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 font-medium">🎯 Source: {mockContact.source}</span>
                </div>
                {mockContact.aiEnriched && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-purple-700 font-medium">🤖 AI Enriched: +{mockContact.enrichedDataPoints} data points</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleEditContact} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit Contact">
              <Edit className="h-5 w-5 text-gray-600" />
            </button>
            <div className="relative">
              <button onClick={() => setShowMoreOptions(!showMoreOptions)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="More Options">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
              {showMoreOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <button onClick={() => handleMoreOptions('merge')} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">Merge Contact</button>
                  <button onClick={() => handleMoreOptions('export')} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">Export Data</button>
                  <button onClick={() => handleMoreOptions('share')} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">Share Contact</button>
                  <hr className="my-2" />
                  <button onClick={() => handleMoreOptions('delete')} className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 text-sm">Delete Contact</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center space-x-3">
          <button onClick={handleEmailComposer} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2 shadow-lg">
            <Mail className="h-5 w-5" /><span>Email</span>
          </button>
          <button onClick={handleCallLogger} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2 shadow-lg">
            <Phone className="h-5 w-5" /><span>Call</span>
          </button>
          <button onClick={handleMeetingScheduler} className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2 shadow-lg">
            <Calendar className="h-5 w-5" /><span>Schedule Meeting</span>
          </button>
          <button onClick={handleCreateDeal} className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center space-x-2 shadow-lg">
            <DollarSign className="h-5 w-5" /><span>Create Deal</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="col-span-2 space-y-6">
            {/* AI Relationship Intelligence */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg border-2 border-purple-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Sparkles className="h-6 w-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">AI Relationship Intelligence</h2>
                <span className="px-3 py-1 bg-purple-200 text-purple-800 text-xs font-bold rounded-full ml-2">UNIQUE</span>
              </div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">Engagement Score: {mockData.engagement.score}/100</h3>
                  <span className="text-sm font-semibold text-purple-700">{mockData.engagement.level}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full" style={{ width: `${mockData.engagement.score}%` }}></div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p className="mb-2"><strong>Based on:</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• {mockData.engagement.meetingsLast30Days} meetings in last 30 days (↑ High frequency)</li>
                    <li>• Average meeting sentiment: 😊 {mockData.engagement.sentimentAvg}% Positive</li>
                    <li>• Email response rate: {mockData.engagement.emailResponseRate}% (Industry avg: {mockData.engagement.industryAvg}%)</li>
                    <li>• Average response time: {mockData.engagement.responseTime}</li>
                  </ul>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Relationship Health</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-bold">{mockData.health.status}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Strengths:</span>
                    </h4>
                    <div className="space-y-2">
                      {mockData.health.strengths.map((strength, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-sm">
                          <span className="text-green-600 mt-0.5">✅</span>
                          <span className="text-gray-700">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span>Risks:</span>
                    </h4>
                    {mockData.health.risks.map((risk, idx) => (
                      <div key={idx} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start space-x-2 text-sm">
                          <span className="text-orange-600 mt-0.5">⚠️</span>
                          <div>
                            <p className="text-gray-700 font-medium">{risk.text}</p>
                            <p className="text-orange-700 text-xs mt-1">Action: {risk.action}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Deals */}
            <ActiveDealsSection 
              deal={mockData.deal}
              onViewDeal={() => navigate(`/crm/deals/${id}`)}
              onUpdateStage={() => alert('Update stage')}
            />

            {/* Account Info with HRMS */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Building2 className="h-6 w-6 text-gray-700" />
                  <span>Account Information</span>
                </h2>
                <button onClick={handleViewAccount} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1">
                  <span>View Account</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Company:</span><span className="font-semibold">{mockContact.company}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Industry:</span><span>SaaS, Project Management</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Size:</span><span>75 employees</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Revenue:</span><span>$12M annually (estimated)</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Location:</span><span>{mockContact.location}</span></div>
              </div>
              <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                <h3 className="font-bold text-orange-900 mb-2 flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>🔗 UNIQUE: HRMS Connection</span>
                </h3>
                <p className="text-sm text-orange-800 mb-3">⚠️ No recruitment data for Acme Corp</p>
                <p className="text-sm text-orange-700 mb-3">💡 Opportunity: Check if we've recruited from them</p>
                <div className="flex items-center space-x-2">
                  <button onClick={handleSearchHRMS} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
                    Search HRMS Data
                  </button>
                  <button onClick={handleAddRecruitmentTarget} className="px-4 py-2 bg-white border-2 border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 text-sm font-medium">
                    Add to Recruitment Target
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <h2 className="text-2xl font-bold mb-6">📋 Activity Timeline</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="text-sm font-semibold text-gray-500 mb-2">TODAY (Nov 15) - 2:00 PM</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">🎤 Meeting: Acme Corp Product Demo</h3>
                  <p className="text-sm text-gray-600 mb-4">Duration: 45 minutes | Location: Zoom</p>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-bold text-purple-900 mb-3">🤖 AI Meeting Summary:</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Key Points:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          <li>Budget confirmed at $50K</li>
                          <li>Timeline: Q1 2026 implementation</li>
                          <li>Main concerns: Integration complexity</li>
                          <li>Competitor mentioned: Salesforce</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Sentiment: <span className="text-green-600">😊 85% Positive</span></p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">CRM Auto-Updated:</p>
                        <div className="space-y-1 text-gray-600">
                          <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>Deal stage: Qualified → Proposal</span></div>
                          <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>Deal amount: $50K</span></div>
                          <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>3 tasks created automatically</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <button onClick={handleViewTranscript} className="px-3 py-2 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700">View Full Transcript</button>
                      <button onClick={handlePlayRecording} className="px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center space-x-1">
                        <Play className="h-3 w-3" /><span>Play Recording</span>
                      </button>
                      <button onClick={handleShareSummary} className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 flex items-center space-x-1">
                        <Share2 className="h-3 w-3" /><span>Share Summary</span>
                      </button>
                      <button onClick={handleAddNote} className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200">Add Note</button>
                    </div>
                  </div>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="text-sm font-semibold text-gray-500 mb-2">YESTERDAY (Nov 14) - 3:15 PM</div>
                  <h3 className="text-lg font-bold text-gray-900">📧 Email Sent: Proposal Preview</h3>
                  <p className="text-sm text-gray-600 mb-3">Status: ✅ Opened | Engagement: 3 opens, 4 mins read time</p>
                  <div className="flex items-center space-x-2">
                    <button onClick={handleViewEmail} className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200">View Email</button>
                    <button onClick={handleSendFollowup} className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200">Send Follow-up</button>
                  </div>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="text-sm font-semibold text-gray-500 mb-2">Nov 13 - 10:30 AM</div>
                  <h3 className="text-lg font-bold text-gray-900">📞 Call: Discovery Call</h3>
                  <p className="text-sm text-gray-600 mb-2">Duration: 25 minutes</p>
                  <p className="text-sm text-gray-700 italic mb-3">Notes: "Interested in automation features. Current pain: Manual data entry."</p>
                  <button onClick={() => setExpandedActivity(expandedActivity === 'call-1' ? null : 'call-1')} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View Details →</button>
                </div>
                <div className="border-l-4 border-gray-400 pl-4">
                  <div className="text-sm font-semibold text-gray-500 mb-2">Nov 10 - 9:00 AM</div>
                  <h3 className="text-lg font-bold text-gray-900">👤 Contact Created</h3>
                  <p className="text-sm text-gray-600 mb-2">Source: Converted from Lead (Apollo.io)</p>
                  <p className="text-sm text-purple-600 font-medium mb-3">🤖 AI Enrichment: +12 data points added</p>
                  <button onClick={handleViewLeadHistory} className="text-xs text-blue-600 hover:text-blue-700 font-medium">View Lead History →</button>
                </div>
                <div className="mt-6 text-center">
                  <button onClick={handleLoadMoreActivities} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">
                    Load More Activities...
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Contact Score */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <h3 className="text-xl font-bold mb-4">🎯 Contact Score</h3>
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-purple-600">87</div>
                <div className="text-sm text-gray-600">out of 100</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full" style={{ width: '87%' }}></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Engagement</span>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-bold">92</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Deal Potential</span>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-bold">85</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Responsiveness</span>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-bold">95</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Predictions */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200 p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span>🔮 Predictive Insights</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">Deal Close Probability</span>
                    <span className="text-lg font-bold text-blue-700">{mockData.predictions.closeProbability}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${mockData.predictions.closeProbability}%` }}></div>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Optimal Next Contact:</p>
                  <p className="text-sm text-blue-700 font-medium">📅 {mockData.predictions.optimalContactTime}</p>
                  <p className="text-xs text-gray-600 mt-1">Why: John's email open patterns show highest engagement during afternoon hours</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-gray-700">Churn Risk: <span className="text-green-600">🟢 Low ({mockData.predictions.churnRisk}%)</span></p>
                  <p className="text-xs text-gray-600 mt-1">Why: High engagement, deal progressing well</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-semibold text-gray-700">Upsell Opportunity: <span className="text-yellow-700">🟡 {mockData.predictions.upsellOpportunity}</span></p>
                  <p className="text-xs text-gray-600 mt-1">Potential: +${mockData.predictions.upsellValue.toLocaleString()} (Add-on modules)</p>
                  <p className="text-xs text-gray-600">Best timing: After 3 months of usage</p>
                </div>
              </div>
            </div>

            {/* Similar Contacts */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-700" />
                <span>🤝 Similar Contacts</span>
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">Based on role, company, behavior patterns:</p>
                {mockData.similarContacts.map((similar, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                    <p className="font-semibold text-sm">{idx + 1}. {similar.name}</p>
                    <p className="text-xs text-gray-600">{similar.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-semibold text-blue-600">Similarity: {similar.similarity}%</span>
                      <span className="text-xs text-gray-600">Deal: {similar.deal}</span>
                    </div>
                    <button onClick={() => handleViewSimilarContact(similar.name.toLowerCase().replace(' ', '-'))} className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">View Contact →</button>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">💡 Learn from similar closed-won deals:</p>
                  <ul className="space-y-1 text-xs text-blue-800">
                    <li>• Avg close time: 45 days</li>
                    <li>• Avg deal size: $48K</li>
                    <li>• Common objection: Pricing</li>
                    <li>• Success factor: Strong ROI story</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="bg-white rounded-xl shadow-lg border p-6">
              <h3 className="text-lg font-bold mb-4">🔗 Data Sources</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Apollo.io (Lead Gen)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">LinkedIn (Profile data)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Clearbit (Company intel)</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-3">Last enriched: 2 hours ago</p>
                <p className="text-xs text-gray-500 mb-4">Accuracy: 94%</p>
                <div className="flex items-center space-x-2">
                  <button onClick={handleReEnrich} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium">
                    Re-enrich Now
                  </button>
                  <button onClick={handleVerifyData} className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-medium">
                    Verify Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailView;
