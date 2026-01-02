import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  TrendingUp,
  Activity,
  MessageSquare,
  FileText,
  Clock,
  User,
  Building,
  Tag,
  DollarSign,
  Target,
  Zap,
  ChevronDown,
  Linkedin,
  Globe,
  Users,
  TrendingDown,
  Plus,
  Upload,
  Send,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Bell
} from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  mobile?: string;
  linkedin?: string;
  company: string;
  position: string;
  department?: string;
  status: string;
  score: number;
  source: string;
  sourceDetail: string;
  assignedTo: string;
  createdAt: string;
  createdBy: string;
  lastContact: string;
  tags: string[];

  // Company info
  industry: string;
  companySize: string;
  annualRevenue: string;
  website: string;
  location: string;
  founded?: string;
  techStack?: string[];
  recentNews?: { title: string; date: string }[];

  // AI insights
  aiEnriched: boolean;
  enrichedFields?: number;
  scoreBreakdown?: {
    factor: string;
    points: number;
    description: string;
  }[];
  similarDeals?: {
    company: string;
    status: string;
    value: string;
  }[];
  recommendedActions?: {
    priority: string;
    action: string;
    reason: string;
    bestTime?: string;
  }[];
}

const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showCallLogger, setShowCallLogger] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showLostReasonForm, setShowLostReasonForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showEmailScheduler, setShowEmailScheduler] = useState(false);
  const [showAIMeetSetter, setShowAIMeetSetter] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState('');
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      setLoading(true);

      const mockLead: Lead = {
        id: id || '1',
        name: 'John Smith',
        email: 'john@acme.com',
        phone: '+1 555-0123',
        mobile: '+1 555-9999',
        linkedin: 'linkedin.com/in/johnsmith',
        company: 'Acme Corp',
        position: 'VP Sales',
        department: 'Sales',
        status: 'new',
        score: 85,
        source: 'Lead Gen Tool',
        sourceDetail: 'Apollo.io',
        assignedTo: 'System',
        createdAt: 'Nov 15, 2025',
        createdBy: 'System (Auto-import)',
        lastContact: 'Never',
        tags: ['VIP', 'Decision Maker', 'Hot Lead'],

        industry: 'SaaS, Project Management Software',
        companySize: '75 employees',
        annualRevenue: '$12M (estimated)',
        website: 'www.acmecorp.com',
        location: 'San Francisco, CA, USA',
        founded: '2018',
        techStack: ['AWS (Cloud Infrastructure)', 'Salesforce (Current CRM)', 'Slack (Communication)', 'HubSpot (Marketing)'],
        recentNews: [
          { title: 'Series B funding: $8M', date: 'Sep 2024' },
          { title: 'Expanded to 3 new markets', date: 'Q3 2024' }
        ],

        aiEnriched: true,
        enrichedFields: 12,
        scoreBreakdown: [
          { factor: 'Company size matches ICP (50-200 employees)', points: 15, description: 'Ideal company size' },
          { factor: 'Industry: SaaS (Target vertical)', points: 20, description: 'Perfect industry match' },
          { factor: 'Job title: Decision maker level', points: 25, description: 'High authority' },
          { factor: 'Tech stack compatible (Uses Salesforce, can switch)', points: 15, description: 'Easy migration' },
          { factor: 'Recent funding ($8M Series B)', points: 10, description: 'Budget availability: High' }
        ],
        similarDeals: [
          { company: 'TechStart Inc', status: 'Closed-Won', value: '$42K' },
          { company: 'BigCo Enterprise', status: 'In Progress', value: '$75K' }
        ],
        recommendedActions: [
          {
            priority: 'HIGH',
            action: 'Email Introduction Today',
            reason: 'Fresh lead, high score',
            bestTime: '2-4 PM (based on industry data)'
          },
          {
            priority: 'MEDIUM',
            action: 'LinkedIn Connection Request',
            reason: 'Decision maker outreach'
          },
          {
            priority: 'MEDIUM',
            action: 'Research Their Pain Points',
            reason: 'Check recent company news'
          }
        ]
      };

      setTimeout(() => {
        setLead(mockLead);
        setLoading(false);
      }, 500);
    };

    fetchLead();
  }, [id]);

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-500 text-white',
      contacted: 'bg-orange-500 text-white',
      qualified: 'bg-green-500 text-white',
      lost: 'bg-red-500 text-white'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const getStarRating = (score: number) => {
    const stars = Math.round((score / 100) * 5);
    return '⭐'.repeat(stars);
  };

  // Handler functions
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      navigate('/crm/leads');
      alert('✅ Lead deleted successfully');
    }
    setShowDeleteModal(false);
  };

  const handleStatusChange = (newStatus: string) => {
    if (lead) {
      setLead({ ...lead, status: newStatus });
      alert(`Status changed to ${newStatus}`);
    }
    setShowStatusDropdown(false);
  };

  const handleSendEmail = () => {
    alert('✅ Email sent successfully!');
    setShowEmailComposer(false);
  };

  const handleLogCall = () => {
    alert('✅ Call logged successfully!');
    setShowCallLogger(false);
  };

  const handleScheduleMeeting = () => {
    alert('✅ Meeting scheduled successfully!');
    setShowMeetingScheduler(false);
    setShowAIMeetSetter(false);
  };

  const handleConvert = () => {
    navigate('/crm/contacts/new', { state: { fromLead: lead } });
  };

  const handleMarkAsLost = (reason: string) => {
    if (lead) {
      setLead({ ...lead, status: 'lost' });
      alert(`Lead marked as lost. Reason: ${reason}`);
    }
    setShowLostReasonForm(false);
  };

  const handleAddActivity = (activityType: string) => {
    alert(`✅ ${activityType} activity added successfully!`);
    setShowActivityForm(false);
  };

  const handleAddNote = () => {
    alert('Note added successfully!');
    setShowNoteEditor(false);
  };

  const handleFileUpload = () => {
    alert('File uploaded successfully!');
    setShowFileUpload(false);
  };

  const handleUseTemplate = (templateName: string) => {
    setSelectedEmailTemplate(templateName);
    setShowEmailComposer(true);
  };

  const handleScheduleEmail = () => {
    alert('Email scheduled successfully!');
    setShowEmailScheduler(false);
    setShowEmailComposer(false);
  };

  const handleReEnrich = async () => {
    setEnriching(true);
    setTimeout(() => {
      setEnriching(false);
      alert('Lead data re-enriched successfully! 5 new data points added.');
    }, 2000);
  };

  const handleSetReminder = () => {
    alert('Reminder set successfully!');
    setShowReminderForm(false);
  };

  const aiSuggestedTimes = [
    'Tuesday, Nov 19 - 2:00 PM',
    'Tuesday, Nov 19 - 3:30 PM',
    'Wednesday, Nov 20 - 10:00 AM',
    'Wednesday, Nov 20 - 2:00 PM',
    'Thursday, Nov 21 - 11:00 AM'
  ];

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
            onClick={() => navigate('/crm/leads')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button onClick={() => navigate('/crm/leads')} className="hover:text-blue-600">
            Leads
          </button>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">{lead.name}</span>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <span>🎯</span>
              <span>Lead: {lead.name}</span>
            </h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/crm/leads/${id}/edit`)}
                className="flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-lg">{lead.position} at {lead.company}</p>
          <div className="flex items-center space-x-4 mt-3">
            <div className="flex items-center space-x-2 relative">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold ${getStatusColor(lead.status)} cursor-pointer hover:opacity-90`}
              >
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)} ▼
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full left-20 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {['new', 'contacted', 'qualified', 'lost'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Score:</span>
              <span className="text-xl font-bold text-green-800">{lead.score}/100</span>
              <span className="text-lg">{getStarRating(lead.score)}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowEmailComposer(true)}
            className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </button>
          <button
            onClick={() => setShowCallLogger(true)}
            className="flex items-center px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <Phone className="h-4 w-4 mr-2" />
            Log Call
          </button>
          <button
            onClick={() => setShowMeetingScheduler(true)}
            className="flex items-center px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </button>
          <button
            onClick={() => setShowConvertModal(true)}
            className="flex items-center px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
          >
            <Users className="h-4 w-4 mr-2" />
            Convert to Contact
          </button>
          <button
            onClick={() => setShowLostReasonForm(true)}
            className="flex items-center px-5 py-2.5 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Mark as Lost
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN (65% width) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>👤 BASIC INFORMATION</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Name</p>
                  <p className="text-base text-gray-900">{lead.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                  <p className="text-base text-gray-900">{lead.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                  <p className="text-base text-gray-900">{lead.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Mobile</p>
                  <p className="text-base text-gray-900">{lead.mobile}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500 mb-1">LinkedIn</p>
                  <a href={`https://${lead.linkedin}`} className="text-base text-blue-600 hover:underline flex items-center space-x-1">
                    <Linkedin className="h-4 w-4" />
                    <span>{lead.linkedin}</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Company</p>
                  <p className="text-base font-semibold text-gray-900">{lead.company}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Title</p>
                  <p className="text-base text-gray-900">{lead.position}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Department</p>
                  <p className="text-base text-gray-900">{lead.department}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">Source:</span>
                    <span className="text-sm text-gray-900">🎯 {lead.source} ({lead.sourceDetail})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">Added:</span>
                    <span className="text-sm text-gray-900">{lead.createdAt} by {lead.createdBy}</span>
                  </div>
                  {lead.aiEnriched && (
                    <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg mt-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">
                        🤖 AI Enriched: +{lead.enrichedFields} data points added
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                  <button className="px-3 py-1 border-2 border-dashed border-gray-300 rounded-full text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600">
                    + Add Tag
                  </button>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Building className="h-5 w-5 text-blue-600" />
                <span>🏢 COMPANY INFORMATION</span>
                <span className="text-sm font-normal text-purple-600">(🤖 AI Enriched)</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Company</p>
                  <p className="text-base font-semibold text-gray-900">{lead.company}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Industry</p>
                  <p className="text-base text-gray-900">{lead.industry}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Company Size</p>
                  <p className="text-base text-gray-900">{lead.companySize}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Annual Revenue</p>
                  <p className="text-base text-gray-900">{lead.annualRevenue}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Website</p>
                  <a href={`https://${lead.website}`} className="text-base text-blue-600 hover:underline flex items-center space-x-1">
                    <Globe className="h-4 w-4" />
                    <span>{lead.website}</span>
                  </a>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                  <p className="text-base text-gray-900">{lead.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Founded</p>
                  <p className="text-base text-gray-900">{lead.founded}</p>
                </div>
              </div>

              {lead.techStack && lead.techStack.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Tech Stack:</p>
                  <ul className="space-y-2">
                    {lead.techStack.map((tech, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <span className="text-sm text-gray-900">{tech}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lead.recentNews && lead.recentNews.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Recent News:</p>
                  <ul className="space-y-2">
                    {lead.recentNews.map((news, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-900">{news.title}</p>
                          <p className="text-xs text-gray-500">({news.date})</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => navigate('/crm/accounts/acme-corp')}
                className="mt-6 w-full px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                View Full Company Profile
              </button>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span>📋 ACTIVITY TIMELINE</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Upload className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">📥 Lead imported from Apollo.io</p>
                    <p className="text-xs text-gray-500 mt-1">Source: Lead Gen Tool</p>
                    <p className="text-xs text-gray-500 mt-1">Nov 15, 2025 - 10:23 AM</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">🤖 AI enrichment completed</p>
                    <ul className="text-xs text-gray-600 mt-2 space-y-1">
                      <li>• Added LinkedIn profile</li>
                      <li>• Enriched company data (12 fields)</li>
                      <li>• Calculated lead score: 85/100</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">Nov 15, 2025 - 10:25 AM</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowActivityForm(true)}
                className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Activity</span>
              </button>
            </div>

            {/* Notes & Files */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>📝 NOTES & FILES</span>
              </h3>

              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No notes or files yet.</p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => setShowNoteEditor(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Note</span>
                  </button>
                  <button
                    onClick={() => setShowFileUpload(true)}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload File</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (35% width) */}
          <div className="space-y-6">

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm border-2 border-purple-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <span>🤖 AI INSIGHTS</span>
              </h3>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-green-800 mb-2">{lead.score}/100</div>
                <div className="text-2xl mb-2">{getStarRating(lead.score)}</div>
                <p className="text-sm font-semibold text-gray-700">Rating: High Potential</p>
              </div>

              <div className="border-t-2 border-purple-300 pt-4 mb-4">
                <p className="text-sm font-bold text-gray-900 mb-4">━━━ Why This Score? ━━━━━━━━━━━━━━━━━━</p>

                {lead.scoreBreakdown && lead.scoreBreakdown.map((item, index) => (
                  <div key={index} className="mb-4 bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.factor}</p>
                        <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                        <p className="text-xs font-semibold text-green-700 mt-1">
                          Score impact: +{item.points} points
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-purple-300 pt-4">
                <p className="text-sm font-bold text-gray-900 mb-4">━━━ Similar to Successful Deals ━━━━━━━━━</p>
                <p className="text-sm text-gray-700 mb-3">This lead is 87% similar to:</p>
                {lead.similarDeals && lead.similarDeals.map((deal, index) => (
                  <div key={index} className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-900">• {deal.company}</span>
                    <span className="text-xs text-gray-600">({deal.status}, {deal.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommended Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Target className="h-5 w-5 text-orange-600" />
                <span>🎯 AI RECOMMENDED ACTIONS</span>
              </h3>

              <div className="mb-4">
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                  Priority: HIGH
                </span>
              </div>

              <div className="space-y-4">
                {lead.recommendedActions && lead.recommendedActions.map((action, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start space-x-2 mb-2">
                      <span className="font-bold text-gray-900">{index + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{action.action}</p>
                        <p className="text-xs text-gray-600 mt-1">Reason: {action.reason}</p>
                        {action.bestTime && (
                          <p className="text-xs text-gray-600 mt-1">Best time: {action.bestTime}</p>
                        )}
                        {index === 0 && (
                          <div className="mt-3 space-y-2">
                            <button
                              onClick={() => handleUseTemplate('VP Sales Intro')}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Template: [Use "VP Sales Intro"] →
                            </button>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleSendEmail}
                                className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                              >
                                Send Now
                              </button>
                              <button
                                onClick={() => setShowEmailScheduler(true)}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-medium hover:bg-gray-50"
                              >
                                Schedule
                              </button>
                            </div>
                          </div>
                        )}
                        {index === 1 && (
                          <button
                            onClick={() => window.open('https://linkedin.com/in/johnsmith', '_blank')}
                            className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 w-full"
                          >
                            Send via LinkedIn →
                          </button>
                        )}
                        {index === 2 && (
                          <button
                            onClick={() => alert('Recent company news:\n- Series B funding: $8M (Sep 2024)\n- Expanded to 3 new markets (Q3 2024)')}
                            className="mt-2 px-3 py-1.5 border border-gray-300 rounded text-xs font-medium hover:bg-gray-50 w-full"
                          >
                            View Company News
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-gray-900">4.</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">Schedule Discovery Call (Week of Nov 18)</p>
                      <p className="text-xs text-gray-600 mt-1">🤖 AI Meet Setter: Suggest optimal times?</p>
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => setShowAIMeetSetter(true)}
                          className="flex-1 px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700"
                        >
                          Yes, Suggest Times
                        </button>
                        <button
                          onClick={() => setShowMeetingScheduler(true)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-medium hover:bg-gray-50"
                        >
                          Schedule Manually
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Get More AI Help */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/crm/ai-copilot?query=Help me close the ${lead.name} deal at ${lead.company}`)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-2 text-sm font-medium transition-all"
                >
                  <Zap className="h-4 w-4" />
                  Get More AI Strategy for This Lead
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Ask AI Copilot for personalized strategy and talking points
                </p>
              </div>
            </div>

            {/* Integrations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                <span>🔗 INTEGRATIONS</span>
              </h3>

              <p className="text-sm font-medium text-gray-700 mb-3">Data Sources:</p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-900">Apollo.io (Lead Gen Tool)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-900">LinkedIn (Profile enrichment)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-900">Clearbit (Company data)</span>
                </div>
              </div>

              <div className="text-xs text-gray-600 mb-3">Last enriched: 2 hours ago</div>

              <button
                onClick={handleReEnrich}
                disabled={enriching}
                className={`w-full px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center space-x-2 ${enriching ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`h-4 w-4 ${enriching ? 'animate-spin' : ''}`} />
                <span>{enriching ? 'Enriching...' : 'Re-enrich Data'}</span>
              </button>
            </div>

            {/* Next Steps */}
            <div className="bg-orange-50 rounded-lg shadow-sm border-2 border-orange-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>⚠️ NEXT STEPS</span>
              </h3>

              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  This lead has NO activity yet.
                </p>
                <p className="text-sm text-gray-700 mb-2">Recommended:</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Contact within 24 hours</li>
                  <li>• Convert to Contact after qualification</li>
                </ul>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowReminderForm(true)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-white text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <Bell className="h-4 w-4" />
                  <span>Set Reminder</span>
                </button>
                <button
                  onClick={handleConvert}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                >
                  Convert Now
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Lead</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{lead?.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      {showEmailComposer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Send Email</h3>
            {selectedEmailTemplate && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">Template: <strong>{selectedEmailTemplate}</strong></p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="email"
                  value={lead?.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Enter subject..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={8}
                  placeholder="Enter your message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  defaultValue={selectedEmailTemplate === 'VP Sales Intro' ?
                    `Hi ${lead?.name},\n\nI hope this email finds you well. I wanted to reach out regarding...\n\nBest regards`
                    : ''}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSendEmail}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Send Email
              </button>
              <button
                onClick={() => setShowEmailComposer(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Logger Modal */}
      {showCallLogger && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Log Call</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Outbound Call</option>
                  <option>Inbound Call</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  placeholder="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={4}
                  placeholder="Call notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleLogCall}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Log Call
              </button>
              <button
                onClick={() => setShowCallLogger(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Scheduler Modal */}
      {showMeetingScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Schedule Meeting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                <input
                  type="text"
                  placeholder="Discovery Call"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleScheduleMeeting}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Schedule
              </button>
              <button
                onClick={() => setShowMeetingScheduler(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Meet Setter Modal */}
      {showAIMeetSetter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🤖 AI Suggested Meeting Times</h3>
            <p className="text-sm text-gray-600 mb-4">
              Based on {lead?.name}'s industry and role, here are the optimal times:
            </p>
            <div className="space-y-2 mb-6">
              {aiSuggestedTimes.map((time, index) => (
                <button
                  key={index}
                  onClick={handleScheduleMeeting}
                  className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{time}</span>
                    {index === 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        Best Match
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAIMeetSetter(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Convert to Contact Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Convert to Contact</h3>
            <p className="text-gray-600 mb-6">
              Convert <strong>{lead?.name}</strong> from {lead?.company} to a contact? This will move them from leads to contacts.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleConvert}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
              >
                Convert
              </button>
              <button
                onClick={() => setShowConvertModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Lost Form Modal */}
      {showLostReasonForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mark as Lost</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select id="lostReason" className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>No response</option>
                  <option>Not interested</option>
                  <option>Budget constraints</option>
                  <option>Chose competitor</option>
                  <option>Wrong timing</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  rows={4}
                  placeholder="Add any additional details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  const reason = (document.getElementById('lostReason') as HTMLSelectElement).value;
                  handleMarkAsLost(reason);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Mark as Lost
              </button>
              <button
                onClick={() => setShowLostReasonForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {showActivityForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Activity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                <select id="activityType" className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Call</option>
                  <option>Email</option>
                  <option>Meeting</option>
                  <option>Note</option>
                  <option>Task</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  placeholder="Activity details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  const type = (document.getElementById('activityType') as HTMLSelectElement).value;
                  handleAddActivity(type);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Add Activity
              </button>
              <button
                onClick={() => setShowActivityForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      {showNoteEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <textarea
                  rows={10}
                  placeholder="Enter your note here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddNote}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Save Note
              </button>
              <button
                onClick={() => setShowNoteEditor(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Upload File</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Drag and drop your file here</p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <input type="file" id="fileInput" className="hidden" />
                <label
                  htmlFor="fileInput"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block"
                >
                  Choose File
                </label>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleFileUpload}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Upload
              </button>
              <button
                onClick={() => setShowFileUpload(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Scheduler Modal */}
      {showEmailScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Schedule Email</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  💡 Best time to send: 2-4 PM (based on industry data)
                </p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleScheduleEmail}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Schedule Email
              </button>
              <button
                onClick={() => setShowEmailScheduler(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Form Modal */}
      {showReminderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Set Reminder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Follow up call</option>
                  <option>Send email</option>
                  <option>Check status</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Reminder notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSetReminder}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Set Reminder
              </button>
              <button
                onClick={() => setShowReminderForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetailPage;
