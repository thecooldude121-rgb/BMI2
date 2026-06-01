import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Calendar, Phone, Mail, FileText, User, DollarSign,
  Download, Search, ChevronDown, TrendingUp, CheckCircle,
  Clock, AlertCircle, ExternalLink, ChevronRight, Smile,
  Target, Upload, Bot
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'meeting' | 'call' | 'email' | 'task' | 'deal' | 'contact' | 'import';
  time: string;
  date: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  aiGenerated?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

const ComprehensiveActivityFeed: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('last-7-days');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [visibleActivitiesCount, setVisibleActivitiesCount] = useState(7);

  const activityTypes = [
    { id: 'all', label: 'All', icon: Activity },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'emails', label: 'Emails', icon: Mail },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'ai-generated', label: 'AI-Generated', icon: Bot },
    { id: 'high-priority', label: 'High Priority', icon: AlertCircle }
  ];

  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'meeting',
      time: '2:00 PM',
      date: 'today',
      title: 'Meeting: Acme Corp Product Demo',
      aiGenerated: true,
      priority: 'high',
      metadata: {
        participants: 'John Smith (VP Sales, Acme Corp)',
        duration: '45 minutes',
        deal: 'Acme Corp - Enterprise Plan ($50,000)',
        aiNotes: [
          'Budget confirmed: $50K',
          'Decision maker: John (CEO approval needed)',
          'Timeline: Q1 2026',
          'Concerns: Integration complexity, training time',
          'Sentiment: 😊 Positive (85% confidence)'
        ],
        dealUpdates: [
          { field: 'Amount', value: '$50,000', status: true },
          { field: 'Stage', value: 'Moved to Proposal', status: true },
          { field: 'Close Date', value: 'March 15, 2026', status: true }
        ],
        nextSteps: [
          { action: 'Send proposal addressing integration concerns', due: 'Nov 18' },
          { action: 'Schedule technical demo with IT team', due: 'Nov 22' }
        ]
      }
    },
    {
      id: '2',
      type: 'contact',
      time: '10:30 AM',
      date: 'today',
      title: 'New Contact Added from HRMS',
      aiGenerated: true,
      metadata: {
        contact: 'Sarah Lee',
        title: 'CFO',
        company: 'TechStart Inc',
        source: '🏢 HRMS Recruitment Data',
        enrichment: {
          dataPoints: 12,
          linkedIn: true,
          companyDetails: true,
          leadScore: 92
        },
        scoreReasons: [
          'Company size matches ICP (45 employees)',
          'Industry: FinTech (target vertical)',
          'Recent funding: $5M Series A',
          'Job title: Decision maker level'
        ],
        recommendation: 'Contact within 24 hours - High likelihood of success'
      }
    },
    {
      id: '3',
      type: 'email',
      time: '3:15 PM',
      date: 'yesterday',
      title: 'Email Sent: Proposal to TechStart Inc',
      metadata: {
        to: 'Sarah Lee (sarah@techstart.com)',
        subject: 'Proposal for BMI Sales Platform',
        attachments: 'Proposal_TechStart_v2.pdf (2.3 MB)',
        status: 'Opened on Nov 14, 4:23 PM (1 hour later)',
        engagement: 'Viewed 3 times, avg 4 mins per view',
        aiInsight: 'High engagement detected - Follow up within 24 hours'
      }
    },
    {
      id: '4',
      type: 'call',
      time: '10:30 AM',
      date: 'yesterday',
      title: 'Call Logged: BigCo Discovery Call',
      metadata: {
        contact: 'Mike Chen (Director of Operations)',
        duration: '15 minutes',
        outcome: 'Qualified - Budget confirmed',
        notes: 'Interested in Q1 2026 implementation. Budget: $75K. Will need CFO approval. Wants to see case studies from manufacturing industry.',
        nextSteps: [
          { action: 'Send manufacturing case studies', due: 'Nov 16' },
          { action: 'Schedule call with CFO', due: 'Nov 20' }
        ]
      }
    },
    {
      id: '5',
      type: 'deal',
      time: '4:00 PM',
      date: 'Nov 13',
      title: 'Deal Stage Changed: TechStart Inc',
      aiGenerated: true,
      metadata: {
        changedBy: 'Alex Rodriguez (You)',
        from: 'Proposal',
        to: 'Negotiation',
        oldValue: '$35,000',
        newValue: '$42,000',
        aiAnalysis: {
          oldScore: 78,
          newScore: 85,
          oldProbability: 45,
          newProbability: 67,
          reason: 'Stage progression + Price increase indicates strong buying intent'
        },
        recommendation: 'Send contract within 48 hours to maintain momentum'
      }
    },
    {
      id: '6',
      type: 'task',
      time: '11:00 AM',
      date: 'Nov 13',
      title: 'Task Completed: Follow up with Acme Corp',
      metadata: {
        assignedTo: 'You',
        dueDate: 'Nov 13',
        completedStatus: 'On time ✓',
        result: 'Email sent, Meeting scheduled for Nov 15'
      }
    },
    {
      id: '7',
      type: 'import',
      time: '10:00 AM',
      date: 'Nov 10',
      title: '25 Leads Imported from Apollo.io',
      aiGenerated: true,
      metadata: {
        source: '🎯 Lead Gen Tool',
        scoring: {
          high: 8,
          medium: 12,
          low: 5
        }
      }
    }
  ];

  const getActivityIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      meeting: Calendar,
      call: Phone,
      email: Mail,
      task: CheckCircle,
      deal: DollarSign,
      contact: User,
      import: Upload
    };
    const Icon = iconMap[type] || Activity;
    return <Icon className="h-5 w-5" />;
  };

  const getActivityColor = (type: string) => {
    const colorMap: Record<string, string> = {
      meeting: '#667eea',
      call: '#28a745',
      email: '#2563eb',
      task: '#ffc107',
      deal: '#dc3545',
      contact: '#667eea',
      import: '#6c757d'
    };
    return colorMap[type] || '#667eea';
  };

  const groupActivitiesByDate = (activities: ActivityItem[]) => {
    const groups: Record<string, ActivityItem[]> = {
      today: [],
      yesterday: [],
      Nov13: [],
      Nov10: []
    };

    activities.forEach(activity => {
      if (activity.date === 'today') groups.today.push(activity);
      else if (activity.date === 'yesterday') groups.yesterday.push(activity);
      else if (activity.date === 'Nov 13') groups.Nov13.push(activity);
      else if (activity.date === 'Nov 10') groups.Nov10.push(activity);
    });

    return groups;
  };

  const filterActivities = (activities: ActivityItem[]) => {
    return activities.filter(activity => {
      const matchesType = typeFilter === 'all' || activity.type === typeFilter;
      const matchesQuickFilter = activeFilter === 'all' ||
        (activeFilter === 'ai-generated' && activity.aiGenerated) ||
        (activeFilter === 'high-priority' && activity.priority === 'high') ||
        activeFilter === `${activity.type}s`;
      const matchesSearch = searchQuery === '' ||
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(activity.metadata).toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesQuickFilter && matchesSearch;
    });
  };

  const filteredActivities = filterActivities(activities);
  const groupedActivities = groupActivitiesByDate(filteredActivities);

  const handleLoadMore = () => {
    setVisibleActivitiesCount(prev => prev + 10);
  };

  const handleViewTranscript = () => {
    navigate('/crm/meetings/transcript');
  };

  const handleViewDeal = (dealId?: string) => {
    navigate('/crm/deals');
  };

  const handleViewContact = (contactId?: string) => {
    navigate('/crm/contacts');
  };

  const handleCreateDeal = () => {
    navigate('/crm/deals/create');
  };

  const handleSendEmail = (contactEmail?: string) => {
    navigate('/crm/activities');
  };

  const handleSendFollowup = () => {
    navigate('/crm/activities');
  };

  const handleEditNotes = () => {
    navigate('/crm/activities');
  };

  const handleSendContract = () => {
    navigate('/crm/deals');
  };

  const handleViewLeads = (importBatch?: string) => {
    navigate('/crm/leads');
  };

  const handleReviewScores = () => {
    navigate('/crm/leads');
  };

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'meeting', label: 'Meetings' },
    { value: 'call', label: 'Calls' },
    { value: 'email', label: 'Emails' },
    { value: 'task', label: 'Tasks' },
    { value: 'deal', label: 'Deals' },
    { value: 'contact', label: 'Contacts' }
  ];

  const userOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'you', label: 'You' },
    { value: 'team1', label: 'Team Member 1' },
    { value: 'team2', label: 'Team Member 2' }
  ];

  const dateOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last-7-days', label: 'Last 7 Days' },
    { value: 'last-30-days', label: 'Last 30 Days' },
    { value: 'custom', label: 'Custom' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center space-x-6">
            <button onClick={() => navigate('/crm')} className="text-2xl font-bold" style={{ color: '#667eea' }}>
              BMI CRM
            </button>
            <nav className="flex items-center space-x-6">
              <button onClick={() => navigate('/crm')} className="text-gray-700 hover:text-gray-900">Dashboard</button>
              <button onClick={() => navigate('/crm/leads')} className="text-gray-700 hover:text-gray-900">Leads</button>
              <button onClick={() => navigate('/crm/contacts')} className="text-gray-700 hover:text-gray-900">Contacts</button>
              <button onClick={() => navigate('/crm/accounts')} className="text-gray-700 hover:text-gray-900">Accounts</button>
              <button onClick={() => navigate('/crm/deals')} className="text-gray-700 hover:text-gray-900">Deals</button>
            </nav>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="flex items-center space-x-2 text-sm">
          <button onClick={() => navigate('/crm')} className="text-blue-600 hover:text-blue-700">Dashboard</button>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Activity Feed</span>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center" style={{ color: '#333333' }}>
            <Activity className="h-8 w-8 mr-3" style={{ color: '#667eea' }} />
            Recent Activities
          </h1>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <span>{typeOptions.find(opt => opt.value === typeFilter)?.label || 'All Types'}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showTypeDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {typeOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setTypeFilter(option.value);
                          setShowTypeDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <span>{userOptions.find(opt => opt.value === userFilter)?.label || 'All Users'}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showUserDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {userOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setUserFilter(option.value);
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowDateDropdown(!showDateDropdown)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <span>{dateOptions.find(opt => opt.value === dateFilter)?.label || 'Last 7 Days'}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showDateDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {dateOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setDateFilter(option.value);
                          setShowDateDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            {activityTypes.map((type) => {
              const Icon = type.icon;
              const isActive = activeFilter === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveFilter(type.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all ${
                    isActive
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={isActive ? { backgroundColor: '#667eea' } : {}}
                >
                  <Icon className="h-4 w-4" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-6 mb-8">
          {/* TODAY */}
          {groupedActivities.today.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <h2 className="px-4 text-lg font-bold text-gray-700">TODAY</h2>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div className="space-y-4">
                {groupedActivities.today.map((activity) => (
                  <div key={activity.id} className="bg-white rounded-xl p-6 border border-gray-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    {/* Meeting Activity */}
                    {activity.type === 'meeting' && activity.metadata && (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <div className="text-lg font-bold text-gray-700" style={{ minWidth: '80px' }}>
                              {activity.time}
                            </div>
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="p-2 rounded-lg mt-1" style={{ backgroundColor: `${getActivityColor(activity.type)}20` }}>
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1">
                                <div className="text-lg font-bold text-gray-900">{activity.title}</div>
                              </div>
                            </div>
                          </div>
                          {activity.aiGenerated && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#667eea' }}>
                              🤖 AI Generated
                            </span>
                          )}
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="text-sm">
                            <span className="font-semibold">Participants:</span> {activity.metadata.participants}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Duration:</span> {activity.metadata.duration}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Deal:</span> {activity.metadata.deal}
                          </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4 mb-4 border border-purple-200">
                          <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                            <Bot className="h-4 w-4 mr-2" />
                            AI Notes Auto-filled to CRM:
                          </h4>
                          <ul className="space-y-1">
                            {activity.metadata.aiNotes.map((note: string, idx: number) => (
                              <li key={idx} className="text-sm text-purple-900">• {note}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                          <h4 className="font-semibold text-green-900 mb-2">Deal Updated:</h4>
                          <ul className="space-y-1">
                            {activity.metadata.dealUpdates.map((update: any, idx: number) => (
                              <li key={idx} className="text-sm text-green-900 flex items-center">
                                • {update.field}: {update.value} {update.status && <CheckCircle className="h-4 w-4 ml-2 text-green-600" />}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                            <Bot className="h-4 w-4 mr-2" />
                            AI Recommended Next Steps:
                          </h4>
                          <ol className="space-y-2">
                            {activity.metadata.nextSteps.map((step: any, idx: number) => (
                              <li key={idx} className="text-sm text-blue-900">
                                {idx + 1}. {step.action}
                                <div className="text-xs text-blue-700 ml-4">(Due: {step.due})</div>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={handleViewTranscript}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>View Full Transcript</span>
                          </button>
                          <button
                            onClick={() => handleViewDeal()}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <span>View Deal</span>
                          </button>
                          <button
                            onClick={() => handleViewContact()}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <span>View Contact</span>
                          </button>
                        </div>
                      </>
                    )}

                    {/* Contact Activity */}
                    {activity.type === 'contact' && activity.metadata && (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <div className="text-lg font-bold text-gray-700" style={{ minWidth: '80px' }}>
                              {activity.time}
                            </div>
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="p-2 rounded-lg mt-1" style={{ backgroundColor: `${getActivityColor(activity.type)}20` }}>
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1">
                                <div className="text-lg font-bold text-gray-900">{activity.title}</div>
                              </div>
                            </div>
                          </div>
                          {activity.aiGenerated && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#667eea' }}>
                              🤖 AI Generated
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="text-sm">
                            <span className="font-semibold">Contact:</span> {activity.metadata.contact}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Title:</span> {activity.metadata.title}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Company:</span> {activity.metadata.company}
                          </div>
                          <div className="text-sm flex items-center">
                            <span className="font-semibold mr-2">Source:</span>
                            <span className="px-3 py-1 rounded-md text-xs font-semibold" style={{ backgroundColor: '#fff3cd', color: '#856404' }}>
                              {activity.metadata.source}
                            </span>
                          </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4 mb-4 border border-purple-200">
                          <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                            <Bot className="h-4 w-4 mr-2" />
                            AI Enrichment Completed:
                          </h4>
                          <ul className="space-y-1 text-sm text-purple-900">
                            <li>• Added {activity.metadata.enrichment.dataPoints} data points</li>
                            <li>• LinkedIn profile linked</li>
                            <li>• Company details enriched</li>
                            <li>• Lead score calculated: <span className="font-bold">{activity.metadata.enrichment.leadScore}/100 (High potential)</span></li>
                          </ul>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Why High Score:</h4>
                          <ul className="space-y-1">
                            {activity.metadata.scoreReasons.map((reason: string, idx: number) => (
                              <li key={idx} className="text-sm text-gray-700">• {reason}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-1 flex items-center">
                            <Bot className="h-4 w-4 mr-2" />
                            AI Recommendation:
                          </h4>
                          <p className="text-sm text-blue-900">{activity.metadata.recommendation}</p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewContact()}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            View Contact
                          </button>
                          <button
                            onClick={handleCreateDeal}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:shadow-lg transition-all"
                            style={{ backgroundColor: '#667eea' }}
                          >
                            Create Deal
                          </button>
                          <button
                            onClick={() => handleSendEmail()}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Send Email
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YESTERDAY */}
          {groupedActivities.yesterday.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <h2 className="px-4 text-lg font-bold text-gray-700">YESTERDAY (Nov 14)</h2>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div className="space-y-4">
                {groupedActivities.yesterday.map((activity) => (
                  <div key={activity.id} className="bg-white rounded-xl p-6 border border-gray-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    {/* Email Activity */}
                    {activity.type === 'email' && activity.metadata && (
                      <>
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="text-lg font-bold text-gray-700" style={{ minWidth: '80px' }}>
                            {activity.time}
                          </div>
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="p-2 rounded-lg mt-1" style={{ backgroundColor: `${getActivityColor(activity.type)}20` }}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                              <div className="text-lg font-bold text-gray-900">{activity.title}</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="text-sm">
                            <span className="font-semibold">To:</span> {activity.metadata.to}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Subject:</span> "{activity.metadata.subject}"
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Attachments:</span> {activity.metadata.attachments}
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-200">
                          <div className="text-sm text-green-900 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span className="font-semibold">Status:</span>&nbsp;{activity.metadata.status}
                          </div>
                          <div className="text-sm text-green-900 mt-1">
                            <span className="font-semibold">Engagement:</span> {activity.metadata.engagement}
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                          <div className="text-sm text-blue-900 flex items-center">
                            <Bot className="h-4 w-4 mr-2" />
                            <span className="font-semibold">AI Insight:</span>&nbsp;{activity.metadata.aiInsight}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewContact()}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            View Email
                          </button>
                          <button
                            onClick={handleSendFollowup}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:shadow-lg transition-all"
                            style={{ backgroundColor: '#667eea' }}
                          >
                            Send Follow-up
                          </button>
                          <button
                            onClick={() => handleViewDeal()}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            View Deal
                          </button>
                        </div>
                      </>
                    )}

                    {/* Call Activity */}
                    {activity.type === 'call' && activity.metadata && (
                      <>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${getActivityColor(activity.type)}20` }}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">{activity.time}</div>
                            <div className="text-xl font-bold text-gray-900">{activity.title}</div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="text-sm">
                            <span className="font-semibold">Contact:</span> {activity.metadata.contact}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Duration:</span> {activity.metadata.duration}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Outcome:</span> {activity.metadata.outcome}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
                          <p className="text-sm text-gray-700">"{activity.metadata.notes}"</p>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
                          <ul className="space-y-1">
                            {activity.metadata.nextSteps.map((step: any, idx: number) => (
                              <li key={idx} className="text-sm text-blue-900">
                                • {step.action} <span className="text-blue-700">(Due: {step.due})</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewContact()}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            View Contact
                          </button>
                          <button
                            onClick={() => handleViewDeal()}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            View Deal
                          </button>
                          <button
                            onClick={handleEditNotes}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit Notes
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOV 13 */}
          {groupedActivities.Nov13.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <h2 className="px-4 text-lg font-bold text-gray-700">Nov 13</h2>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div className="space-y-4">
                {groupedActivities.Nov13.map((activity) => (
                  <div key={activity.id} className="bg-white rounded-xl p-6 border border-gray-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    {/* Deal Activity */}
                    {activity.type === 'deal' && activity.metadata && (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <div className="text-lg font-bold text-gray-700" style={{ minWidth: '80px' }}>
                              {activity.time}
                            </div>
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="p-2 rounded-lg mt-1" style={{ backgroundColor: `${getActivityColor(activity.type)}20` }}>
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1">
                                <div className="text-lg font-bold text-gray-900">{activity.title}</div>
                              </div>
                            </div>
                          </div>
                          {activity.aiGenerated && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#667eea' }}>
                              🤖 AI Generated
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="text-sm">
                            <span className="font-semibold">Changed by:</span> {activity.metadata.changedBy}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">From:</span> {activity.metadata.from} <span className="mx-2">→</span> <span className="font-semibold">To:</span> {activity.metadata.to}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Deal Value:</span> {activity.metadata.oldValue} → {activity.metadata.newValue} (Updated)
                          </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4 mb-4 border border-purple-200">
                          <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                            <Bot className="h-4 w-4 mr-2" />
                            AI Analysis:
                          </h4>
                          <div className="space-y-1 text-sm text-purple-900">
                            <div>Deal Score: {activity.metadata.aiAnalysis.oldScore}/100 → {activity.metadata.aiAnalysis.newScore}/100 (Improved)</div>
                            <div>Win Probability: {activity.metadata.aiAnalysis.oldProbability}% → {activity.metadata.aiAnalysis.newProbability}%</div>
                            <div className="mt-2"><span className="font-semibold">Reason:</span> {activity.metadata.aiAnalysis.reason}</div>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-1 flex items-center">
                            <Bot className="h-4 w-4 mr-2" />
                            Recommendation:
                          </h4>
                          <p className="text-sm text-blue-900">{activity.metadata.recommendation}</p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewDeal()}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            View Deal
                          </button>
                          <button
                            onClick={handleSendContract}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:shadow-lg transition-all"
                            style={{ backgroundColor: '#667eea' }}
                          >
                            Send Contract
                          </button>
                        </div>
                      </>
                    )}

                    {/* Task Activity */}
                    {activity.type === 'task' && activity.metadata && (
                      <>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${getActivityColor(activity.type)}20` }}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">{activity.time}</div>
                            <div className="text-xl font-bold text-gray-900">{activity.title}</div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="text-sm">
                            <span className="font-semibold">Assigned to:</span> {activity.metadata.assignedTo}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Due Date:</span> {activity.metadata.dueDate}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Completed:</span> {activity.metadata.completedStatus}
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-200">
                          <div className="text-sm text-green-900">
                            <span className="font-semibold">Result:</span> {activity.metadata.result}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewContact()}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            View Contact
                          </button>
                          <button
                            onClick={() => handleViewDeal()}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            View Deal
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOV 10-12 */}
          {groupedActivities.Nov10.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <h2 className="px-4 text-lg font-bold text-gray-700">Nov 10-12</h2>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <div className="space-y-4">
                {groupedActivities.Nov10.map((activity) => (
                  <div key={activity.id} className="bg-white rounded-xl p-6 border border-gray-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    {/* Import Activity */}
                    {activity.type === 'import' && activity.metadata && (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${getActivityColor(activity.type)}20` }}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div>
                              <div className="text-xl font-bold text-gray-900">{activity.title}</div>
                              <div className="text-sm text-gray-600">Source: {activity.metadata.source}</div>
                              <div className="text-sm text-gray-600">Date: {activity.date}, {activity.time}</div>
                            </div>
                          </div>
                          {activity.aiGenerated && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#667eea' }}>
                              🤖 AI Generated
                            </span>
                          )}
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4 mb-4 border border-purple-200">
                          <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                            <Bot className="h-4 w-4 mr-2" />
                            AI Scoring Complete:
                          </h4>
                          <ul className="space-y-1 text-sm text-purple-900">
                            <li>• {activity.metadata.scoring.high} High-value leads (Score 80+)</li>
                            <li>• {activity.metadata.scoring.medium} Medium-value leads (Score 60-79)</li>
                            <li>• {activity.metadata.scoring.low} Low-value leads (Score &lt;60)</li>
                          </ul>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewLeads()}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            View Leads
                          </button>
                          <button
                            onClick={handleReviewScores}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:shadow-lg transition-all"
                            style={{ backgroundColor: '#667eea' }}
                          >
                            Review Scores
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Load More */}
          <div className="text-center">
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Load More Activities...
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div className="text-3xl font-bold mb-2" style={{ color: '#667eea' }}>47</div>
            <div className="text-sm text-gray-600">Activities</div>
            <div className="text-xs text-gray-500">Last 7 Days</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div className="text-3xl font-bold mb-2" style={{ color: '#667eea' }}>12</div>
            <div className="text-sm text-gray-600">Meetings</div>
            <div className="text-xs text-gray-500">This Week</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div className="text-3xl font-bold mb-2" style={{ color: '#667eea' }}>8</div>
            <div className="text-sm text-gray-600">AI-Generated</div>
            <div className="text-xs text-gray-500">This Week</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveActivityFeed;
