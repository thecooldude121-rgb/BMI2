import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Plus,
  Settings,
  ChevronDown,
  Linkedin,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  TrendingUp,
  Building,
  Users,
  Target,
  Zap,
  FileText,
  Upload,
  DollarSign,
  Calendar,
  AlertCircle,
  Bell,
  Star,
  Edit3,
  Trash2,
  Download,
  X,
  Search,
  BarChart3,
  Activity
} from 'lucide-react';
import { sarahLeeMockData } from '../../utils/sarahLeeMockData';

const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lead = sarahLeeMockData;

  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showCallLogger, setShowCallLogger] = useState(false);
  const [showSequenceDropdown, setShowSequenceDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showScoreHistory, setShowScoreHistory] = useState(false);
  const [showEnrichmentDetails, setShowEnrichmentDetails] = useState<string | null>(null);
  const [showNewsModal, setShowNewsModal] = useState<any>(null);
  const [showRelatedSignals, setShowRelatedSignals] = useState(false);
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const [showRecruiterModal, setShowRecruiterModal] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState<any>(null);

  const sequences = [
    'HRMS Warm Lead Sequence',
    'New Customer Outreach',
    'Product Launch Follow-up',
    'Create New Sequence'
  ];

  const handleEmailClick = () => {
    setShowEmailComposer(true);
  };

  const handleCallClick = () => {
    setShowCallLogger(true);
  };

  const handleQualifyClick = () => {
    navigate('/lead-generation/leads/qualify/' + id);
  };

  const handleReEnrich = async () => {
    setEnriching(true);
    setTimeout(() => {
      setEnriching(false);
      alert('Lead data re-enriched successfully! 5 new data points added.');
    }, 2000);
  };

  const handleAddToSequence = (sequenceName: string) => {
    if (sequenceName === 'Create New Sequence') {
      navigate('/lead-generation/sequences/new');
    } else {
      alert(`Added to sequence: ${sequenceName}`);
    }
    setShowSequenceDropdown(false);
  };

  const handleMoreAction = (action: string) => {
    setShowMoreDropdown(false);
    switch (action) {
      case 'edit':
        navigate(`/lead-generation/leads/${id}/edit`);
        break;
      case 'assign':
        alert('Assign to User modal would open');
        break;
      case 'change-status':
        setShowStatusDropdown(true);
        break;
      case 'sync':
        alert('Syncing to CRM...');
        setTimeout(() => alert('Synced successfully!'), 1000);
        break;
      case 'convert':
        navigate('/crm/contacts/new', { state: { fromLead: lead } });
        break;
      case 'disqualify':
        if (confirm('Mark this lead as disqualified?')) {
          alert('Lead marked as disqualified');
        }
        break;
      case 'export':
        alert('Exporting lead data...');
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this lead?')) {
          navigate('/lead-generation/leads');
          alert('Lead deleted successfully');
        }
        break;
    }
  };

  const handleCreateLead = (dm: any) => {
    setShowCreateLeadModal(dm);
  };

  const handleConfirmCreateLead = () => {
    alert(`Creating lead for ${showCreateLeadModal.name}...`);
    setShowCreateLeadModal(null);
    setTimeout(() => {
      alert('Lead created successfully!');
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'New': 'bg-green-500 text-white',
      'Contacted': 'bg-blue-500 text-white',
      'Qualified': 'bg-purple-500 text-white',
      'Lost': 'bg-red-500 text-white'
    };
    return colors[status] || 'bg-gray-500 text-white';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button onClick={() => navigate('/lead-generation/dashboard')} className="hover:text-blue-600">
            Dashboard
          </button>
          <span>&gt;</span>
          <button onClick={() => navigate('/lead-generation/leads')} className="hover:text-blue-600">
            Leads
          </button>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">{lead.leadInfo.fullName}</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{lead.leadInfo.fullName}</h1>
            <p className="text-lg text-gray-600 mb-3">{lead.leadInfo.title} at {lead.leadInfo.company}</p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Status:</span>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={`relative px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(lead.leadInfo.status)} hover:opacity-90 cursor-pointer`}
                >
                  {lead.leadInfo.status} 🟢 ▼
                  {showStatusDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      {['New', 'Contacted', 'Qualified', 'Lost'].map((status) => (
                        <button
                          key={status}
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Status changed to ${status}`);
                            setShowStatusDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  )}
                </button>
              </div>
              <button
                onClick={() => setShowScoreHistory(true)}
                className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-1 rounded-lg cursor-pointer"
              >
                <span className="text-gray-500">Score:</span>
                <span className="text-xl font-bold text-green-700">{lead.aiLeadScore.overallScore}/100</span>
                <span className="text-xs text-gray-500">(Top 5%)</span>
              </button>
              <button
                onClick={() => {
                  const section = document.getElementById('hrms-section');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 cursor-pointer"
              >
                <Building className="h-4 w-4" />
                <span>🏢 HRMS Source</span>
              </button>
            </div>
            <div className="flex items-center space-x-4 mt-3 text-sm">
              <button
                onClick={handleEmailClick}
                className="text-blue-600 hover:underline flex items-center space-x-1"
              >
                <Mail className="h-4 w-4" />
                <span>{lead.leadInfo.email}</span>
              </button>
              <button
                onClick={handleCallClick}
                className="text-blue-600 hover:underline flex items-center space-x-1"
              >
                <Phone className="h-4 w-4" />
                <span>{lead.leadInfo.phone}</span>
              </button>
              <a
                href={`https://${lead.leadInfo.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center space-x-1"
              >
                <Linkedin className="h-4 w-4" />
                <span>LinkedIn</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleEmailClick}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </button>
          <button
            onClick={handleCallClick}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call
          </button>
          <div className="relative">
            <button
              onClick={() => setShowSequenceDropdown(!showSequenceDropdown)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Sequence
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
            {showSequenceDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {sequences.map((seq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddToSequence(seq)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${idx === sequences.length - 1 ? 'border-t border-gray-200 font-medium text-blue-600' : 'text-gray-700'} first:rounded-t-lg last:rounded-b-lg`}
                  >
                    {seq}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleQualifyClick}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Qualify
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMoreDropdown(!showMoreDropdown)}
              className="flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              <Settings className="h-4 w-4 mr-2" />
              More
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
            {showMoreDropdown && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button onClick={() => handleMoreAction('edit')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg">
                  <Edit3 className="h-4 w-4 inline mr-2" />Edit Lead
                </button>
                <button onClick={() => handleMoreAction('assign')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Users className="h-4 w-4 inline mr-2" />Assign to User
                </button>
                <button onClick={() => handleMoreAction('change-status')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Activity className="h-4 w-4 inline mr-2" />Change Status
                </button>
                <button onClick={() => handleMoreAction('sync')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <RefreshCw className="h-4 w-4 inline mr-2" />Sync to CRM Now
                </button>
                <button onClick={() => handleMoreAction('convert')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Users className="h-4 w-4 inline mr-2" />Convert to Contact
                </button>
                <button onClick={() => handleMoreAction('disqualify')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <X className="h-4 w-4 inline mr-2" />Mark as Disqualified
                </button>
                <button onClick={() => handleMoreAction('export')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Download className="h-4 w-4 inline mr-2" />Export Lead Data
                </button>
                <button onClick={() => handleMoreAction('delete')} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg border-t border-gray-200">
                  <Trash2 className="h-4 w-4 inline mr-2" />Delete Lead
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            {/* AI Insights Panel */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-sm border-2 border-blue-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <span>🤖 AI INSIGHTS</span>
              </h3>
              <div className="space-y-3">
                {lead.aiRecommendations.map((rec, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (rec.text.includes('Contact within 48h')) {
                        handleEmailClick();
                      } else if (rec.text.includes('Mention HRMS')) {
                        navigator.clipboard.writeText('I wanted to reach out following your recent placement at TechStart Inc...');
                        alert('Template text copied to clipboard!');
                      } else if (rec.text.includes('Add to')) {
                        setShowSequenceDropdown(true);
                      } else if (rec.text.includes('BANT')) {
                        handleQualifyClick();
                      }
                    }}
                    className="w-full text-left bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{rec.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{rec.text}</p>
                        <span className={`text-xs font-medium ${rec.priority === 'high' ? 'text-red-600' : 'text-orange-600'}`}>
                          {rec.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Enrichment Data Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span>🏢 ENRICHMENT DATA</span>
                </h3>
                <button
                  onClick={handleReEnrich}
                  disabled={enriching}
                  className="flex items-center px-3 py-1.5 text-sm border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${enriching ? 'animate-spin' : ''}`} />
                  {enriching ? 'Enriching...' : 'Re-enrich Data'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Tech Stack:</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.enrichmentData.company.techStack.map((tech, idx) => (
                      <button
                        key={idx}
                        onClick={() => alert(`${tech}\n\nThis company uses ${tech}. Potential integration opportunity!`)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 cursor-pointer"
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Recent News:</p>
                  <ul className="space-y-2">
                    {lead.enrichmentData.company.recentNews.map((news, idx) => (
                      <li key={idx}>
                        <button
                          onClick={() => setShowNewsModal(news)}
                          className="flex items-start space-x-2 hover:bg-gray-50 p-2 rounded-lg w-full text-left"
                        >
                          <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 hover:text-blue-600">{news.title}</p>
                            <p className="text-xs text-gray-500">{news.date} • {news.source}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Decision Makers Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>👥 DECISION MAKERS</span>
              </h3>

              <div className="space-y-3">
                {lead.decisionMakers.map((dm, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {dm.name} {dm.isThisLead && <span className="text-xs text-blue-600">(Current Lead)</span>}
                      </p>
                      <p className="text-xs text-gray-600">{dm.title} • {dm.role}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!dm.isThisLead && (
                        <>
                          <a
                            href={`https://${dm.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-white"
                          >
                            View
                          </a>
                          {dm.canCreateLead && (
                            <button
                              onClick={() => handleCreateLead(dm)}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Add Lead
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HRMS Connection Section */}
            <div id="hrms-section" className="bg-purple-50 rounded-lg shadow-sm border-2 border-purple-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Building className="h-5 w-5 text-purple-600" />
                <span>🏢 HRMS CONNECTION</span>
              </h3>

              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Recruited</p>
                    <p className="text-sm font-medium text-gray-900">{lead.hrmsConnection.recruited}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Position</p>
                    <p className="text-sm font-medium text-gray-900">{lead.hrmsConnection.position}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Recruiter</p>
                    <button
                      onClick={() => setShowRecruiterModal(true)}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {lead.hrmsConnection.recruiter}
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Placement Fee</p>
                    <button
                      onClick={() => setShowFeeBreakdown(true)}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      ${lead.hrmsConnection.placementFee.toLocaleString()}
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Warm Lead Advantages:</p>
                  <ul className="space-y-1">
                    {lead.hrmsConnection.warmLeadAdvantages.map((adv, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <span className="text-xs text-gray-600">{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => navigate('/hrms')}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
              >
                🏢 View in HRMS Module
              </button>
            </div>

            {/* Intelligence Signal Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Target className="h-5 w-5 text-orange-600" />
                <span>🎯 INTELLIGENCE SIGNAL</span>
              </h3>

              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-start space-x-3 mb-3">
                  <span className="text-3xl">{lead.intelligenceSignal.signalIcon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{lead.intelligenceSignal.event}</p>
                    <p className="text-xs text-gray-600">{lead.intelligenceSignal.date} • {lead.intelligenceSignal.source}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">🤖 AI Analysis:</p>
                  <ul className="space-y-1">
                    {lead.intelligenceSignal.aiAnalysis.map((analysis, idx) => (
                      <li key={idx} className="text-xs text-gray-600">• {analysis}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate('/lead-generation/intelligence/' + id)}
                    className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                  >
                    View Full Signal
                  </button>
                  <button
                    onClick={() => setShowRelatedSignals(true)}
                    className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-white text-sm font-medium"
                  >
                    Related Signals
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span>📋 ACTIVITY TIMELINE</span>
              </h3>

              <div className="space-y-4">
                {lead.activityTimeline.map((activity) => (
                  <div key={activity.id} className="border-l-2 border-gray-200 pl-4">
                    <button
                      onClick={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
                      className="w-full text-left hover:bg-gray-50 p-2 rounded-lg -ml-2"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-xl">{activity.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          {expandedActivity === activity.id && (
                            <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.timeAgo} • {activity.by}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              <button className="mt-4 w-full px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                Load More Activity...
              </button>
            </div>

            {/* Notes & Files */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>📝 NOTES & FILES</span>
              </h3>

              {lead.notes.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {lead.notes.map((note) => (
                    <div key={note.id} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <p className="text-sm text-gray-900">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-2">{note.author} • {note.date}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">No notes yet.</p>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowNoteEditor(true)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Note</span>
                </button>
                <button
                  onClick={() => setShowFileUpload(true)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload File</span>
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">

            {/* AI Lead Score Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <span>⭐ AI LEAD SCORE</span>
              </h3>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-green-700 mb-2">{lead.aiLeadScore.overallScore}/100</div>
                <div className="text-sm font-medium text-gray-600 mb-1">{lead.aiLeadScore.scoreRating}</div>
                <div className="text-xs text-gray-500">{lead.aiLeadScore.scorePercentile}</div>
                <button
                  onClick={() => setShowScoreHistory(true)}
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  View Score History →
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Fit Score</span>
                    <span className="text-xs font-bold text-gray-900">{lead.aiLeadScore.fitScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${lead.aiLeadScore.fitScore}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{lead.aiLeadScore.fitReason}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Engagement</span>
                    <span className="text-xs font-bold text-gray-900">{lead.aiLeadScore.engagementScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${lead.aiLeadScore.engagementScore}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{lead.aiLeadScore.engagementReason}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">Intent</span>
                    <span className="text-xs font-bold text-gray-900">{lead.aiLeadScore.intentScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${lead.aiLeadScore.intentScore}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{lead.aiLeadScore.intentReason}</p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs font-medium text-purple-900 mb-2">🏢 HRMS Bonus Applied</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Base Score: {lead.aiLeadScore.hrmsBonus.baseScore}</p>
                  <p>HRMS Bonus: +{lead.aiLeadScore.hrmsBonus.bonusPoints} pts (+{lead.aiLeadScore.hrmsBonus.bonusPercentage}%)</p>
                  <p className="font-bold text-purple-900">Final: {lead.aiLeadScore.hrmsBonus.finalScore}/100</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Why This Score?</p>
                <ul className="space-y-1">
                  {lead.aiLeadScore.whyThisScore.map((reason, idx) => (
                    <li key={idx} className="text-xs text-gray-600">{reason}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Similar Leads */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>👥 SIMILAR LEADS</span>
              </h3>

              <div className="space-y-3">
                {lead.similarLeads.map((similar) => (
                  <button
                    key={similar.id}
                    onClick={() => navigate(`/lead-generation/leads/${similar.id}`)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{similar.name}</p>
                      <span className="text-xs font-bold text-green-700">{similar.score}/100</span>
                    </div>
                    <p className="text-xs text-gray-600">{similar.company}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{similar.sourceIcon} {similar.source}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{similar.industry}</span>
                    </div>
                  </button>
                ))}
              </div>

              <button className="mt-4 w-full px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                View All Similar Leads
              </button>
            </div>

            {/* Enrichment Sources */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                <span>🔗 ENRICHMENT SOURCES</span>
              </h3>

              <div className="space-y-2 mb-4">
                {lead.enrichmentData.sources.map((source, idx) => (
                  <button
                    key={idx}
                    onClick={() => setShowEnrichmentDetails(source.name)}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-900">{source.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{source.lastUpdated}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => navigate('/lead-generation/settings')}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Configure Sources</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* All Modals */}
      {showEmailComposer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Compose Email</h3>
              <button onClick={() => setShowEmailComposer(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="email"
                  value={lead.leadInfo.email}
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
                  defaultValue={`Following up on your new role at ${lead.leadInfo.company}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  rows={10}
                  placeholder="Enter your message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  defaultValue={`Hi ${lead.leadInfo.firstName},\n\nCongratulations on your new role as ${lead.leadInfo.title} at ${lead.leadInfo.company}! I wanted to reach out following your recent placement.\n\nGiven your company's recent funding and growth plans, I thought you might be interested in...\n\nBest regards`}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  alert('Email sent successfully!');
                  setShowEmailComposer(false);
                }}
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

      {showCallLogger && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Log Call</h3>
              <button onClick={() => setShowCallLogger(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Connected</option>
                  <option>Voicemail</option>
                  <option>No Answer</option>
                  <option>Busy</option>
                </select>
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
                onClick={() => {
                  alert('Call logged successfully!');
                  setShowCallLogger(false);
                }}
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

      {showNoteEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add Note</h3>
              <button onClick={() => setShowNoteEditor(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div>
              <textarea
                rows={8}
                placeholder="Enter your note here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  alert('Note added successfully!');
                  setShowNoteEditor(false);
                }}
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

      {showFileUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Upload File</h3>
              <button onClick={() => setShowFileUpload(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
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
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  alert('File uploaded successfully!');
                  setShowFileUpload(false);
                }}
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

      {showScoreHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Score History</h3>
              <button onClick={() => setShowScoreHistory(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-6">
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Score Trend Chart</p>
                <p className="text-sm text-gray-500 mt-2">Nov 15: 92/100 (Initial score)</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm font-medium text-gray-900">Nov 15, 2024 - Score: 92/100</p>
                <p className="text-xs text-gray-600 mt-1">Lead created • HRMS bonus applied (+23 points)</p>
              </div>
            </div>
            <button
              onClick={() => setShowScoreHistory(false)}
              className="mt-6 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showNewsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">News Article</h3>
              <button onClick={() => setShowNewsModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{showNewsModal.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{showNewsModal.date} • {showNewsModal.source}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  This is a key signal showing company growth and investment. Use this in your outreach to demonstrate awareness of their recent success.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNewsModal(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showRelatedSignals && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Related Signals</h3>
              <button onClick={() => setShowRelatedSignals(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-3">
              {lead.intelligenceSignal.relatedSignals.map((signal, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{signal.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{signal.date}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowRelatedSignals(false)}
              className="mt-6 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showFeeBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Placement Fee Breakdown</h3>
              <button onClick={() => setShowFeeBreakdown(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base Fee (20%)</span>
                <span className="text-sm font-medium text-gray-900">$12,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Premium Bonus</span>
                <span className="text-sm font-medium text-gray-900">$3,000</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-gray-900">$15,000</span>
              </div>
            </div>
            <button
              onClick={() => setShowFeeBreakdown(false)}
              className="mt-6 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showRecruiterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Recruiter Contact</h3>
              <button onClick={() => setShowRecruiterModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-base font-medium text-gray-900">Jane Smith</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Team</p>
                <p className="text-base font-medium text-gray-900">HRMS Team</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base text-blue-600">jane.smith@company.com</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-base text-gray-900">+1 555-0199</p>
              </div>
            </div>
            <button
              onClick={() => setShowRecruiterModal(false)}
              className="mt-6 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showEnrichmentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Enrichment Details: {showEnrichmentDetails}</h3>
              <button onClick={() => setShowEnrichmentDetails(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Data Points Provided:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Email address</li>
                  <li>• Phone number</li>
                  <li>• LinkedIn profile</li>
                  <li>• Company information</li>
                  <li>• Tech stack data</li>
                </ul>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-base font-medium text-gray-900">Nov 15, 2024</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowEnrichmentDetails(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showCreateLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Create New Lead</h3>
              <button onClick={() => setShowCreateLeadModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Create a new lead for <strong>{showCreateLeadModal.name}</strong>?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">{showCreateLeadModal.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Title</p>
                  <p className="text-sm font-medium text-gray-900">{showCreateLeadModal.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Company</p>
                  <p className="text-sm font-medium text-gray-900">{lead.leadInfo.company}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-blue-600">{showCreateLeadModal.email}</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleConfirmCreateLead}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Lead
              </button>
              <button
                onClick={() => setShowCreateLeadModal(null)}
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
