import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  Users,
  Rocket,
  Globe,
  Plus,
  BellOff,
  Star,
  MoreHorizontal,
  ExternalLink,
  Bell,
  Share2,
  Download,
  Clock,
  Building2,
  TrendingUp,
  Mail,
  Phone,
  Linkedin,
  Globe as WebIcon,
  Twitter,
  FileText,
  Target,
  CheckCircle,
  Copy,
  Check,
  X,
  Calendar,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { getIntelligenceSignalById, type IntelligenceSignal, type DecisionMaker } from '../../utils/intelligenceSignalMockData';
import { useToast } from '../../contexts/ToastContext';

type SignalType = 'funding' | 'hiring' | 'product' | 'expansion';
type SignalStatus = 'new' | 'in_review' | 'converted' | 'dismissed';

const IntelligenceDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [showMoreActionsMenu, setShowMoreActionsMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedDecisionMaker, setSelectedDecisionMaker] = useState<DecisionMaker | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [createMultiple, setCreateMultiple] = useState(false);
  const [selectedDMs, setSelectedDMs] = useState<string[]>([]);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissNote, setDismissNote] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderNote, setReminderNote] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [selectedSequence, setSelectedSequence] = useState('');
  const [sequenceDecisionMakers, setSequenceDecisionMakers] = useState<string[]>([]);

  const signal = getIntelligenceSignalById(id || '1');

  if (!signal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Signal Not Found</h2>
          <p className="text-gray-600 mb-4">The intelligence signal you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/lead-generation/intelligence')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Intelligence Feed
          </button>
        </div>
      </div>
    );
  }

  const getSignalIcon = (type: SignalType) => {
    switch (type) {
      case 'funding':
        return <DollarSign className="h-8 w-8" />;
      case 'hiring':
        return <Users className="h-8 w-8" />;
      case 'product':
        return <Rocket className="h-8 w-8" />;
      case 'expansion':
        return <Globe className="h-8 w-8" />;
    }
  };

  const getSignalColor = (type: SignalType) => {
    switch (type) {
      case 'funding':
        return 'orange';
      case 'hiring':
        return 'green';
      case 'product':
        return 'blue';
      case 'expansion':
        return 'purple';
    }
  };

  const getStatusBadge = (status: SignalStatus) => {
    switch (status) {
      case 'new':
        return <span className="text-green-600 font-medium">🟢 New Signal</span>;
      case 'in_review':
        return <span className="text-yellow-600 font-medium">🟡 In Review</span>;
      case 'converted':
        return <span className="text-blue-600 font-medium">✅ Converted to Lead</span>;
      case 'dismissed':
        return <span className="text-red-600 font-medium">❌ Dismissed</span>;
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    showToast('Email copied to clipboard', 'success');
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    showToast('Phone copied to clipboard', 'success');
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleAddToWatchList = () => {
    showToast('Added to watch list', 'success');
    setShowMoreActionsMenu(false);
  };

  const handleExportSignal = () => {
    showToast('Exporting signal data...', 'success');
    setShowMoreActionsMenu(false);
  };

  const handleDismiss = () => {
    if (!dismissReason) {
      showToast('Please select a reason', 'error');
      return;
    }
    showToast('Signal dismissed', 'success');
    setShowDismissModal(false);
    setTimeout(() => navigate('/lead-generation/intelligence'), 1000);
  };

  const handleSetReminder = () => {
    if (!reminderDate || !reminderTime) {
      showToast('Please select date and time', 'error');
      return;
    }
    showToast('Reminder set successfully', 'success');
    setShowReminderModal(false);
  };

  const handleShare = () => {
    if (selectedTeamMembers.length === 0) {
      showToast('Please select team members', 'error');
      return;
    }
    showToast(`Shared with ${selectedTeamMembers.length} team member(s)`, 'success');
    setShowShareModal(false);
  };

  const handleAddToSequence = () => {
    if (!selectedSequence || sequenceDecisionMakers.length === 0) {
      showToast('Please select sequence and decision makers', 'error');
      return;
    }
    showToast(`Added ${sequenceDecisionMakers.length} decision maker(s) to sequence`, 'success');
    setShowSequenceModal(false);
  };

  const handleCreateLead = () => {
    if (createMultiple) {
      navigate(`/lead-generation/leads/new?from=intelligence&signalId=${signal.id}&multiple=true&dms=${selectedDMs.join(',')}`);
    } else {
      navigate(`/lead-generation/leads/new?from=intelligence&signalId=${signal.id}&dm=${selectedDecisionMaker?.email || signal.decisionMakers[0].email}`);
    }
  };

  const handleAddAllAsLeads = () => {
    showToast(`Creating ${signal.decisionMakers.length} leads...`, 'success');
    setTimeout(() => {
      navigate('/lead-generation/leads?filter=created:today');
    }, 1500);
  };

  const color = getSignalColor(signal.type);
  const scoreStars = Math.round((signal.aiScore / 100) * 5);

  const teamMembers = [
    { id: '1', name: 'John Doe', role: 'Sales Manager' },
    { id: '2', name: 'Jane Smith', role: 'Account Executive' },
    { id: '3', name: 'Mike Johnson', role: 'BDR' }
  ];

  const sequences = [
    { id: '1', name: 'Funding Congratulations' },
    { id: '2', name: 'New Customer Outreach' },
    { id: '3', name: 'Enterprise Sales Sequence' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => navigate('/lead-generation/dashboard')}
            className="hover:text-blue-600 transition-colors"
          >
            Dashboard
          </button>
          <span>&gt;</span>
          <button
            onClick={() => navigate('/lead-generation/intelligence')}
            className="hover:text-blue-600 transition-colors"
          >
            Sales Intelligence
          </button>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">{signal.company} Funding</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className={`bg-${color}-50 border-b border-${color}-200 px-8 py-6`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div className={`flex items-center space-x-3 text-${color}-600`}>
              {getSignalIcon(signal.type)}
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                {signal.type} Signal
              </h2>
            </div>
            <button
              onClick={() => navigate('/lead-generation/intelligence')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Feed</span>
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {signal.title}
          </h1>

          <div className="flex items-center space-x-4 text-gray-600 mb-4">
            <span className="font-medium">{signal.industry}</span>
            <span>|</span>
            <span>{signal.employees} employees</span>
            <span>|</span>
            <span>{signal.location}</span>
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
            <div>
              <span className="font-medium">Detected:</span> {signal.detectedAt} ({signal.timeAgo})
            </div>
            <div>
              <span className="font-medium">Source:</span> {signal.source}
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">AI Score:</span>
              <span className="text-lg font-bold text-gray-900">{signal.aiScore}/100</span>
              <span>{'⭐'.repeat(scoreStars)}</span>
            </div>
          </div>

          <div className="mb-4">
            <span className="text-sm font-semibold text-gray-700 mr-2">Status:</span>
            {getStatusBadge(signal.status)}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setCreateMultiple(false);
                setShowAddLeadModal(true);
              }}
              className={`flex items-center space-x-2 px-4 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 transition-colors text-sm font-medium`}
            >
              <Plus className="h-4 w-4" />
              <span>Add to Leads</span>
            </button>
            <button
              onClick={() => setShowDismissModal(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <BellOff className="h-4 w-4" />
              <span>Dismiss Signal</span>
            </button>
            <button
              onClick={handleAddToWatchList}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Star className="h-4 w-4" />
              <span>Add to Watch List</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMoreActionsMenu(!showMoreActionsMenu)}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMoreActionsMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  <button
                    onClick={() => {
                      setShowReminderModal(true);
                      setShowMoreActionsMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Bell className="h-4 w-4" />
                    <span>Set Reminder</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowShareModal(true);
                      setShowMoreActionsMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share with Team</span>
                  </button>
                  <button
                    onClick={handleExportSignal}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Signal Data</span>
                  </button>
                  <button
                    onClick={() => {
                      showToast('Reported as inaccurate', 'success');
                      setShowMoreActionsMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>Report Inaccurate</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column (65%) */}
          <div className="col-span-2 space-y-6">
            {/* AI Analysis */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Target className="h-6 w-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">AI Intelligence</h2>
              </div>

              <div className="space-y-4">
                {/* Signal Score - Clickable */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Signal Score:</span>
                    <button
                      onClick={() => setShowScoreModal(true)}
                      className="text-2xl font-bold text-purple-600 hover:text-purple-700 cursor-pointer underline decoration-dotted"
                    >
                      {signal.aiScore}/100
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded ${
                          i < signal.aiScore / 10 ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm font-medium text-purple-600 ml-2">Excellent</span>
                  </div>
                </div>

                {/* Buying Intent - Clickable */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Buying Intent:</span>
                    <button
                      onClick={() => setShowIntentModal(true)}
                      className="text-lg font-bold text-orange-600 flex items-center space-x-1 hover:text-orange-700 cursor-pointer underline decoration-dotted"
                    >
                      <span>HIGH</span>
                      <span>🔥</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded ${
                          i < signal.buyingIntent / 10 ? 'bg-orange-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm font-medium text-orange-600 ml-2">{signal.buyingIntent}%</span>
                  </div>
                </div>

                {/* Why This Matters */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Why This Matters:</h3>
                  <div className="space-y-1">
                    {signal.aiAnalysis.whyThisMatters.map((matter, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{matter}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Actions */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Recommended Actions:</h3>
                  <div className="space-y-1">
                    {signal.aiAnalysis.recommendedActions.map((action, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <Target className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Similar Companies */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Similar Companies That Converted:</h3>
                  <div className="flex flex-wrap gap-2">
                    {signal.aiAnalysis.similarCompaniesConverted.map((company, idx) => {
                      const similarCompany = signal.similarCompanies.find(sc => sc.name === company);
                      return (
                        <button
                          key={idx}
                          onClick={() => similarCompany && navigate(`/lead-generation/intelligence/${similarCompany.id}`)}
                          className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700 transition-colors"
                        >
                          {company}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Funding Details */}
            {signal.fundingDetails && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                  <h2 className="text-xl font-bold text-gray-900">Funding Details</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Round Type:</span>
                    <p className="text-base text-gray-900">{signal.fundingDetails.roundType}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Amount:</span>
                    <p className="text-base text-gray-900 font-bold">{signal.fundingDetails.amount}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Announced:</span>
                    <p className="text-base text-gray-900">{signal.fundingDetails.announcedDate}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Valuation:</span>
                    <p className="text-base text-gray-900">{signal.fundingDetails.valuation}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-sm font-semibold text-gray-700">Lead Investor:</span>
                  <p className="text-base text-gray-900">{signal.fundingDetails.leadInvestor}</p>
                </div>

                <div className="mt-4">
                  <span className="text-sm font-semibold text-gray-700">Participating Investors:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {signal.fundingDetails.participatingInvestors.map((investor, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {investor}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-sm font-semibold text-gray-700 mb-2 block">Use of Funds:</span>
                  <div className="space-y-2">
                    {signal.fundingDetails.useOfFunds.map((fund, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">{fund.category}</span>
                            <span className="text-sm font-medium text-gray-900">{fund.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-600 h-2 rounded-full"
                              style={{ width: `${fund.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 mt-4">
                  <a
                    href={signal.fundingDetails.crunchbaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View on Crunchbase →</span>
                  </a>
                  <a
                    href={signal.fundingDetails.pressReleaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Read Press Release →</span>
                  </a>
                </div>
              </div>
            )}

            {/* Full Article */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Full Article</h2>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">{signal.article.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <span>Published: {signal.article.published}</span>
                <span>|</span>
                <span>Source: {signal.article.source}</span>
              </div>

              <p className="text-gray-700 whitespace-pre-line mb-4">{signal.article.summary}</p>

              <a
                href={signal.article.fullTextUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Read Full Article →</span>
              </a>
            </div>

            {/* Related Content */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Related Content</h2>

              <div className="space-y-3">
                <a
                  href={signal.resources.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <WebIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Company Website</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>

                <a
                  href={signal.resources.linkedinPage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Linkedin className="h-5 w-5 text-blue-700" />
                    <span className="text-sm font-medium text-gray-900">View on LinkedIn →</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>

                <a
                  href={signal.resources.crunchbasePage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-900">View on Crunchbase →</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent News:</h3>
                <div className="space-y-2">
                  {signal.resources.recentNews.map((news, idx) => (
                    <a
                      key={idx}
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{news.title}</p>
                        <p className="text-xs text-gray-500">{news.source}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Activity Timeline</h2>

              <div className="space-y-4">
                {signal.timeline.map((event, idx) => (
                  <div key={idx} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{event.event}</span>
                        <span className="text-xs text-gray-500">{event.date}</span>
                      </div>
                      {event.source && (
                        <p className="text-xs text-gray-500 mt-1">Source: {event.source}</p>
                      )}
                      {event.user && (
                        <p className="text-xs text-gray-500 mt-1">By: {event.user}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (35%) */}
          <div className="space-y-6">
            {/* Company Overview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Company Overview</h2>
                <button
                  onClick={() => showToast('Opening full company profile...', 'info')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Full Profile
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Industry:</span>
                  <p className="text-gray-900">{signal.industry}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Founded:</span>
                  <p className="text-gray-900">{signal.companyDetails.founded}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Employees:</span>
                  <p className="text-gray-900">{signal.employees}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">HQ:</span>
                  <p className="text-gray-900">{signal.location}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Website:</span>
                  <a
                    href={`https://${signal.companyDetails.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {signal.companyDetails.website}
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Revenue:</span>
                  <p className="text-gray-900">{signal.companyDetails.revenue}</p>
                </div>
              </div>

              <div className="mt-4">
                <span className="font-semibold text-gray-700 text-sm block mb-2">Tech Stack:</span>
                <div className="flex flex-wrap gap-2">
                  {signal.companyDetails.techStack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded cursor-pointer hover:bg-blue-100 transition-colors"
                      title={`Click for details about ${tech}`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <span className="font-semibold text-gray-700 text-sm block mb-2">Social:</span>
                <div className="flex space-x-2">
                  {signal.companyDetails.social.linkedin && (
                    <a
                      href={signal.companyDetails.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Linkedin className="h-4 w-4 text-blue-700" />
                    </a>
                  )}
                  {signal.companyDetails.social.twitter && (
                    <a
                      href={signal.companyDetails.social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Twitter className="h-4 w-4 text-blue-400" />
                    </a>
                  )}
                  {signal.companyDetails.social.blog && (
                    <a
                      href={signal.companyDetails.social.blog}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-gray-700" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Decision Makers */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Decision Makers ({signal.decisionMakers.length})</h2>
                <button
                  onClick={handleAddAllAsLeads}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add All as Leads
                </button>
              </div>

              <div className="space-y-4">
                {signal.decisionMakers.map((dm, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedDecisionMaker(dm);
                        setShowContactModal(true);
                      }}
                      className="text-base font-bold text-gray-900 hover:text-blue-600 mb-1 text-left"
                    >
                      {dm.name}
                    </button>
                    <p className="text-sm text-gray-600 mb-3">{dm.title}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{dm.email}</span>
                        </div>
                        <button
                          onClick={() => handleCopyEmail(dm.email)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Copy email"
                        >
                          {copiedEmail === dm.email ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {dm.phone && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{dm.phone}</span>
                          </div>
                          <button
                            onClick={() => handleCopyPhone(dm.phone!)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copy phone"
                          >
                            {copiedPhone === dm.phone ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      )}

                      {dm.linkedin && (
                        <a
                          href={dm.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <Linkedin className="h-4 w-4" />
                          <span>LinkedIn Profile</span>
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDecisionMaker(dm);
                        setCreateMultiple(false);
                        setShowAddLeadModal(true);
                      }}
                      className="w-full mt-3 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add as Lead
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead Score Potential */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Lead Score Potential</h2>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Estimated Score:</span>
                    <span className="text-2xl font-bold text-blue-600">{signal.aiScore}/100</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded ${
                          i < signal.aiScore / 10 ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">Score Factors:</h3>
                  <button
                    onClick={() => setShowScoreModal(true)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between py-1 hover:bg-gray-50 px-2 rounded transition-colors">
                      <span className="text-sm text-gray-700">Funding</span>
                      <span className="text-sm font-medium text-gray-900">+{signal.scoreBreakdown.funding} points</span>
                    </div>
                    <div className="flex items-center justify-between py-1 hover:bg-gray-50 px-2 rounded transition-colors">
                      <span className="text-sm text-gray-700">Growth signals</span>
                      <span className="text-sm font-medium text-gray-900">+{signal.scoreBreakdown.growthSignals}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 hover:bg-gray-50 px-2 rounded transition-colors">
                      <span className="text-sm text-gray-700">Decision makers</span>
                      <span className="text-sm font-medium text-gray-900">+{signal.scoreBreakdown.decisionMakers}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 hover:bg-gray-50 px-2 rounded transition-colors">
                      <span className="text-sm text-gray-700">Tech stack fit</span>
                      <span className="text-sm font-medium text-gray-900">+{signal.scoreBreakdown.techStackFit}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 hover:bg-gray-50 px-2 rounded transition-colors">
                      <span className="text-sm text-gray-700">Company size</span>
                      <span className="text-sm font-medium text-gray-900">+{signal.scoreBreakdown.companySize}</span>
                    </div>
                  </button>
                </div>

                <div>
                  <button
                    onClick={() => setShowIntentModal(true)}
                    className="w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Conversion Probability:</span>
                      <span className="text-base font-bold text-green-600">{signal.conversionProbability}%</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded ${
                            i < signal.conversionProbability / 10 ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Expected Close Rate:</span>
                    <span className="text-base font-bold text-orange-600">{signal.expectedCloseRate}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">High!</p>
                </div>
              </div>
            </div>

            {/* Similar Signals */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Similar Signals</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Other TechStart Inc Signals:</h3>
                  <div className="space-y-2">
                    {signal.relatedSignals.map((rs) => (
                      <button
                        key={rs.id}
                        onClick={() => navigate(`/lead-generation/intelligence/${rs.id}`)}
                        className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{rs.title}</span>
                          <span className="text-xs text-gray-500">{rs.timeAgo}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 uppercase">{rs.type}</span>
                          <span className="text-xs font-medium text-blue-600">Score: {rs.score}/100</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Similar Companies:</h3>
                  <div className="space-y-2">
                    {signal.similarCompanies.map((sc) => (
                      <button
                        key={sc.id}
                        onClick={() => navigate(`/lead-generation/intelligence/${sc.id}`)}
                        className="w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-gray-900">{sc.name}</span>
                          <span className="text-xs font-medium text-blue-600">Score: {sc.score}/100</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{sc.amount}</span>
                          <span className="text-xs text-gray-600">{sc.industry}</span>
                        </div>
                        <span className={`text-xs mt-1 inline-block ${sc.status === 'converted' ? 'text-green-600' : 'text-orange-600'}`}>
                          {sc.status === 'converted' ? '✅ Converted' : '🟢 New'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCreateMultiple(false);
                    setShowAddLeadModal(true);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Lead</span>
                </button>
                <button
                  onClick={() => {
                    setCreateMultiple(true);
                    setSelectedDMs(signal.decisionMakers.map(dm => dm.email));
                    setShowAddLeadModal(true);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  <Users className="h-4 w-4" />
                  <span>Create Multiple Leads</span>
                </button>
                <button
                  onClick={() => {
                    setSequenceDecisionMakers(signal.decisionMakers.map(dm => dm.email));
                    setShowSequenceModal(true);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Mail className="h-4 w-4" />
                  <span>Add to Sequence</span>
                </button>
                <button
                  onClick={handleAddToWatchList}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Star className="h-4 w-4" />
                  <span>Watch Company</span>
                </button>
                <button
                  onClick={() => setShowReminderModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Bell className="h-4 w-4" />
                  <span>Set Reminder</span>
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share with Team</span>
                </button>
                <button
                  onClick={handleExportSignal}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Signal Data</span>
                </button>
                <button
                  onClick={() => setShowDismissModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  <BellOff className="h-4 w-4" />
                  <span>Dismiss Signal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {createMultiple ? 'Create Multiple Leads' : 'Create Lead'}
            </h2>

            {createMultiple ? (
              <div>
                <p className="text-gray-600 mb-4">Select decision makers to create leads for:</p>
                <div className="space-y-2 mb-4">
                  {signal.decisionMakers.map((dm) => (
                    <label key={dm.email} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedDMs.includes(dm.email)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDMs([...selectedDMs, dm.email]);
                          } else {
                            setSelectedDMs(selectedDMs.filter(email => email !== dm.email));
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{dm.name}</p>
                        <p className="text-xs text-gray-600">{dm.title}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">
                  {selectedDecisionMaker
                    ? `Create lead for ${selectedDecisionMaker.name} (${selectedDecisionMaker.title})`
                    : 'Convert this signal into a lead for your pipeline'}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddLeadModal(false);
                  setSelectedDecisionMaker(null);
                  setCreateMultiple(false);
                  setSelectedDMs([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {createMultiple ? `Create ${selectedDMs.length} Leads` : 'Create Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Modal */}
      {showDismissModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Dismiss Signal</h2>
            <p className="text-gray-600 mb-4">Why are you dismissing this signal?</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <select
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reason</option>
                  <option value="not_interested">Not interested</option>
                  <option value="wrong_industry">Wrong industry</option>
                  <option value="already_contacted">Already contacted</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note (optional)</label>
                <textarea
                  value={dismissNote}
                  onChange={(e) => setDismissNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDismissModal(false);
                  setDismissReason('');
                  setDismissNote('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Set Reminder</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                <textarea
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Follow up on funding announcement..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setReminderDate('');
                  setReminderTime('');
                  setReminderNote('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSetReminder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Set Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Share with Team</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Team Members</label>
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <label key={member.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTeamMembers.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTeamMembers([...selectedTeamMembers, member.id]);
                          } else {
                            setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== member.id));
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-600">{member.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Note (optional)</label>
                <textarea
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="This looks like a great opportunity for..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setSelectedTeamMembers([]);
                  setShareNote('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sequence Modal */}
      {showSequenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add to Sequence</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Sequence</label>
                <select
                  value={selectedSequence}
                  onChange={(e) => setSelectedSequence(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a sequence</option>
                  {sequences.map((seq) => (
                    <option key={seq.id} value={seq.id}>{seq.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Decision Makers</label>
                <div className="space-y-2">
                  {signal.decisionMakers.map((dm) => (
                    <label key={dm.email} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sequenceDecisionMakers.includes(dm.email)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSequenceDecisionMakers([...sequenceDecisionMakers, dm.email]);
                          } else {
                            setSequenceDecisionMakers(sequenceDecisionMakers.filter(email => email !== dm.email));
                          }
                        }}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{dm.name}</p>
                        <p className="text-xs text-gray-600">{dm.title}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSequenceModal(false);
                  setSelectedSequence('');
                  setSequenceDecisionMakers([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToSequence}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add to Sequence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Breakdown Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Score Breakdown</h2>
              <button onClick={() => setShowScoreModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Funding</span>
                  <span className="text-lg font-bold text-purple-600">+{signal.scoreBreakdown.funding}</span>
                </div>
                <p className="text-xs text-gray-600">Fresh Series A funding indicates strong buying intent</p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Growth Signals</span>
                  <span className="text-lg font-bold text-blue-600">+{signal.scoreBreakdown.growthSignals}</span>
                </div>
                <p className="text-xs text-gray-600">Hiring and expansion activities detected</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Decision Makers</span>
                  <span className="text-lg font-bold text-green-600">+{signal.scoreBreakdown.decisionMakers}</span>
                </div>
                <p className="text-xs text-gray-600">Key decision makers identified and accessible</p>
              </div>

              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Tech Stack Fit</span>
                  <span className="text-lg font-bold text-orange-600">+{signal.scoreBreakdown.techStackFit}</span>
                </div>
                <p className="text-xs text-gray-600">Using compatible technologies</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Company Size</span>
                  <span className="text-lg font-bold text-gray-600">+{signal.scoreBreakdown.companySize}</span>
                </div>
                <p className="text-xs text-gray-600">Optimal company size for ICP</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-900">Total Score</span>
                <span className="text-2xl font-bold text-purple-600">{signal.aiScore}/100</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Intent Factors Modal */}
      {showIntentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Buying Intent Factors</h2>
              <button onClick={() => setShowIntentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Overall Intent:</span>
                <span className="text-2xl font-bold text-orange-600 flex items-center space-x-1">
                  <span>{signal.buyingIntent}%</span>
                  <span>🔥</span>
                </span>
              </div>
              <p className="text-sm text-gray-600">High buying intent detected based on multiple signals</p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Budget Available</span>
                </div>
                <p className="text-xs text-gray-600 ml-6">$10M funding round just closed</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Expansion Mode</span>
                </div>
                <p className="text-xs text-gray-600 ml-6">40% of funds allocated to sales team expansion</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Timing</span>
                </div>
                <p className="text-xs text-gray-600 ml-6">Signal detected within optimal 48-hour window</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Decision Maker Access</span>
                </div>
                <p className="text-xs text-gray-600 ml-6">Direct contact information for C-level executives</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">Historical data shows {signal.conversionProbability}% conversion rate for similar signals</p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && selectedDecisionMaker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Contact Details</h2>
              <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedDecisionMaker.name}</h3>
                <p className="text-sm text-gray-600">{selectedDecisionMaker.title}</p>
                <span className={`text-xs px-2 py-1 rounded-full inline-block mt-2 ${
                  selectedDecisionMaker.role === 'decision_maker' ? 'bg-green-100 text-green-700' :
                  selectedDecisionMaker.role === 'influencer' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {selectedDecisionMaker.role === 'decision_maker' ? 'Decision Maker' :
                   selectedDecisionMaker.role === 'influencer' ? 'Influencer' : 'Champion'}
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedDecisionMaker.email}</span>
                  </div>
                  <button
                    onClick={() => handleCopyEmail(selectedDecisionMaker.email)}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                  >
                    {copiedEmail === selectedDecisionMaker.email ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {selectedDecisionMaker.phone && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-900">{selectedDecisionMaker.phone}</span>
                    </div>
                    <button
                      onClick={() => handleCopyPhone(selectedDecisionMaker.phone!)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copiedPhone === selectedDecisionMaker.phone ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}

                {selectedDecisionMaker.linkedin && (
                  <a
                    href={selectedDecisionMaker.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Linkedin className="h-5 w-5 text-blue-700" />
                      <span className="text-sm text-blue-700 font-medium">View LinkedIn Profile</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-blue-700" />
                  </a>
                )}
              </div>

              <button
                onClick={() => {
                  setShowContactModal(false);
                  setCreateMultiple(false);
                  setShowAddLeadModal(true);
                }}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligenceDetailView;
