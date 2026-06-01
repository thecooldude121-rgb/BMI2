import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Edit, Plus, Linkedin, MapPin, Building,
  Globe, ExternalLink, Calendar, Clock, TrendingUp, MessageSquare,
  FileText, Activity, Target, Zap, CheckCircle, Eye, BarChart3
} from 'lucide-react';

interface Prospect {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  linkedin?: string;
  location?: string;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified';
  leadScore: number;
  aiScore: number;
  qualityScore: number;
  tags: string[];
  industry?: string;
  companySize?: string;
  website?: string;
  emailsSent: number;
  emailsOpened: number;
  lastContacted?: string;
  responseRate: number;
}

interface Activity {
  id: string;
  type: 'email_sent' | 'email_opened' | 'email_replied' | 'status_changed' | 'note_added' | 'called' | 'meeting_scheduled';
  description: string;
  timestamp: string;
  user: string;
}

interface Note {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}

const ProspectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'notes' | 'engagement'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    const fetchProspect = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockProspect: Prospect = {
          id: id || '1',
          name: 'Sarah Chen',
          title: 'Chief Technology Officer',
          company: 'TechCorp Solutions',
          email: 'sarah.chen@techcorp.com',
          phone: '+1-555-0101',
          linkedin: 'https://linkedin.com/in/sarahchen',
          location: 'San Francisco, CA',
          status: 'qualified',
          leadScore: 92,
          aiScore: 88,
          qualityScore: 95,
          tags: ['enterprise', 'decision-maker', 'tech-leader'],
          industry: 'Software',
          companySize: '500-1000 employees',
          website: 'https://techcorp.com',
          emailsSent: 12,
          emailsOpened: 8,
          lastContacted: '2 days ago',
          responseRate: 67
        };

        setProspect(mockProspect);
        setError(null);
      } catch (err) {
        setError('Failed to load prospect details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProspect();
  }, [id]);

  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'email_sent',
      description: 'Sent introduction email',
      timestamp: '2024-01-20T10:00:00Z',
      user: 'John Smith'
    },
    {
      id: '2',
      type: 'email_opened',
      description: 'Opened email: Introduction to our platform',
      timestamp: '2024-01-20T11:30:00Z',
      user: 'Sarah Chen'
    },
    {
      id: '3',
      type: 'status_changed',
      description: 'Status changed from "Contacted" to "Qualified"',
      timestamp: '2024-01-21T09:15:00Z',
      user: 'John Smith'
    },
    {
      id: '4',
      type: 'note_added',
      description: 'Added note: Very interested in enterprise solution',
      timestamp: '2024-01-21T14:00:00Z',
      user: 'John Smith'
    }
  ];

  const mockNotes: Note[] = [
    {
      id: '1',
      content: 'Had a great call with Sarah. She is looking for a solution to replace Salesforce. Budget approved for Q1. Follow up next week with technical demo.',
      author: 'John Smith',
      timestamp: '2024-01-21T14:00:00Z'
    },
    {
      id: '2',
      content: 'Sarah mentioned they are scaling fast and need better automation. Pain points: data silos and manual processes.',
      author: 'John Smith',
      timestamp: '2024-01-20T16:30:00Z'
    }
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-700 border-blue-200',
      contacted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      qualified: 'bg-green-100 text-green-700 border-green-200',
      unqualified: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.new;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      email_sent: <Mail className="h-5 w-5 text-blue-600" />,
      email_opened: <Eye className="h-5 w-5 text-green-600" />,
      email_replied: <MessageSquare className="h-5 w-5 text-purple-600" />,
      status_changed: <TrendingUp className="h-5 w-5 text-orange-600" />,
      note_added: <FileText className="h-5 w-5 text-gray-600" />,
      called: <Phone className="h-5 w-5 text-indigo-600" />,
      meeting_scheduled: <Calendar className="h-5 w-5 text-pink-600" />
    };
    return icons[type as keyof typeof icons] || <Activity className="h-5 w-5 text-gray-600" />;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prospect details...</p>
        </div>
      </div>
    );
  }

  if (error || !prospect) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Prospect Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The prospect you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/lead-generation/prospects')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Prospects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/lead-generation/prospects')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(prospect.name)}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{prospect.name}</h1>
                <p className="text-lg text-gray-600">
                  {prospect.title} at {prospect.company}
                </p>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(prospect.status)}`}>
                    {prospect.status.charAt(0).toUpperCase() + prospect.status.slice(1)}
                  </span>
                  {prospect.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </button>
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </button>
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Edit className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex border-b border-gray-200">
            {(['overview', 'activity', 'notes', 'engagement'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <a href={`mailto:${prospect.email}`} className="text-blue-600 hover:underline">
                      {prospect.email}
                    </a>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{prospect.phone}</span>
                    <span className="text-sm text-gray-500">📱 Mobile</span>
                  </div>
                  {prospect.linkedin && (
                    <div className="flex items-center space-x-3">
                      <Linkedin className="h-5 w-5 text-gray-400" />
                      <a
                        href={prospect.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        LinkedIn Profile
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                  {prospect.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{prospect.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Company Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <button className="text-blue-600 hover:underline font-semibold">
                      {prospect.company}
                    </button>
                  </div>
                  {prospect.industry && (
                    <div className="flex items-center space-x-3">
                      <Target className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{prospect.industry}</span>
                    </div>
                  )}
                  {prospect.companySize && (
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{prospect.companySize}</span>
                    </div>
                  )}
                  {prospect.website && (
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-gray-400" />
                      <a
                        href={prospect.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        {prospect.website}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {prospect.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                  <button className="px-3 py-1.5 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-600 transition-colors">
                    + Add Tag
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Lead Scoring</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Lead Score</span>
                      <span className="text-lg font-bold text-gray-900">{prospect.leadScore}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getScoreColor(prospect.leadScore)}`}
                        style={{ width: `${prospect.leadScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">AI Score</span>
                      <span className="text-lg font-bold text-gray-900">{prospect.aiScore}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getScoreColor(prospect.aiScore)}`}
                        style={{ width: `${prospect.aiScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Quality Score</span>
                      <span className="text-lg font-bold text-gray-900">{prospect.qualityScore}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getScoreColor(prospect.qualityScore)}`}
                        style={{ width: `${prospect.qualityScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Emails sent</span>
                    <span className="text-lg font-bold text-gray-900">{prospect.emailsSent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Emails opened</span>
                    <span className="text-lg font-bold text-gray-900">{prospect.emailsOpened}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last contacted</span>
                    <span className="text-sm font-semibold text-gray-900">{prospect.lastContacted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response rate</span>
                    <span className="text-lg font-bold text-green-600">{prospect.responseRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Activity Timeline</h3>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Activity
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {mockActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.description}</p>
                        <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {getTimeAgo(activity.timestamp)}
                          </span>
                          <span>•</span>
                          <span>by {activity.user}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Note</h3>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type your note here... (Markdown supported)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                ></textarea>
                <div className="flex justify-end mt-3">
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Save Note
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {mockNotes.map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 mb-3">{note.content}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {note.author} • {getTimeAgo(note.timestamp)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:underline">Edit</button>
                          <button className="text-red-600 hover:underline">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'engagement' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Email Engagement</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-700">Introduction Email</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-700">Product Demo Invite</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Follow-up #3</span>
                    <Eye className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Click-through rate</span>
                    <span className="font-bold text-gray-900">42%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Website Visits</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total visits</span>
                    <span className="text-lg font-bold text-gray-900">7</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pages viewed</span>
                    <span className="text-lg font-bold text-gray-900">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg. time on site</span>
                    <span className="text-sm font-semibold text-gray-900">5m 32s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last visit</span>
                    <span className="text-sm font-semibold text-gray-900">3 hours ago</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Engagement Score</h3>
              <div className="flex items-center space-x-6">
                <div className="flex-1">
                  <div className="w-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full h-4"></div>
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">82</div>
                  <div className="text-sm text-gray-600">High Engagement</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProspectDetailPage;
