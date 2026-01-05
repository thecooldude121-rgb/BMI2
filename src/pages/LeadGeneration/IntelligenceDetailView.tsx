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
  Eye,
  Clock,
  Building2,
  TrendingUp,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Linkedin,
  Globe as WebIcon,
  Twitter,
  FileText,
  BarChart3,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

type SignalType = 'funding' | 'hiring' | 'product' | 'expansion';
type SignalStatus = 'new' | 'in_review' | 'converted' | 'dismissed';

interface DecisionMaker {
  name: string;
  title: string;
  email: string;
  phone?: string;
  linkedin?: string;
  role: 'decision_maker' | 'influencer' | 'champion';
}

interface IntelligenceSignal {
  id: string;
  type: SignalType;
  title: string;
  company: string;
  industry: string;
  employees: number;
  location: string;
  detectedAt: string;
  timeAgo: string;
  source: string;
  aiScore: number;
  status: SignalStatus;
  buyingIntent: number;

  // Company details
  companyDetails: {
    founded: string;
    website: string;
    revenue: string;
    techStack: string[];
    social: {
      linkedin?: string;
      twitter?: string;
      blog?: string;
    };
  };

  // Signal specific details
  fundingDetails?: {
    roundType: string;
    amount: string;
    announcedDate: string;
    leadInvestor: string;
    participatingInvestors: string[];
    valuation: string;
    useOfFunds: Array<{ category: string; percentage: number }>;
    pressReleaseUrl: string;
    crunchbaseUrl: string;
  };

  hiringDetails?: {
    jobTitles: string[];
    positionsCount: number;
    location: string;
    postedDate: string;
    jobPostingUrls: string[];
  };

  // AI Analysis
  aiAnalysis: {
    whyThisMatters: string[];
    recommendedActions: string[];
    similarCompaniesConverted: string[];
  };

  // Article/News
  article: {
    title: string;
    published: string;
    source: string;
    summary: string;
    fullTextUrl: string;
  };

  // Decision makers
  decisionMakers: DecisionMaker[];

  // Score breakdown
  scoreBreakdown: {
    funding: number;
    growthSignals: number;
    decisionMakers: number;
    techStackFit: number;
    companySize: number;
  };

  conversionProbability: number;
  expectedCloseRate: number;

  // Related signals
  relatedSignals: Array<{
    id: string;
    type: SignalType;
    title: string;
    timeAgo: string;
    score: number;
  }>;

  similarCompanies: Array<{
    id: string;
    name: string;
    type: SignalType;
    amount: string;
    industry: string;
    score: number;
    status: SignalStatus;
  }>;

  // Timeline
  timeline: Array<{
    date: string;
    event: string;
    source?: string;
    user?: string;
  }>;

  // Additional resources
  resources: {
    companyWebsite: string;
    linkedinPage: string;
    crunchbasePage: string;
    recentNews: Array<{
      title: string;
      source: string;
      url: string;
    }>;
  };
}

const IntelligenceDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDecisionMaker, setSelectedDecisionMaker] = useState<DecisionMaker | null>(null);

  // Mock data - in production this would come from API based on id
  const signal: IntelligenceSignal = {
    id: '1',
    type: 'funding',
    title: 'TechStart Inc raised $10M Series A',
    company: 'TechStart Inc',
    industry: 'FinTech',
    employees: 45,
    location: 'San Francisco, CA',
    detectedAt: 'Nov 15, 2024 at 10:30 AM',
    timeAgo: '2 hours ago',
    source: 'Crunchbase',
    aiScore: 88,
    status: 'new',
    buyingIntent: 85,

    companyDetails: {
      founded: '2019',
      website: 'techstart.com',
      revenue: '$8M (estimated)',
      techStack: ['AWS (Cloud)', 'Salesforce (CRM)', 'Slack (Collaboration)', 'Stripe (Payments)'],
      social: {
        linkedin: 'https://linkedin.com/company/techstart',
        twitter: 'https://twitter.com/techstart',
        blog: 'https://techstart.com/blog'
      }
    },

    fundingDetails: {
      roundType: 'Series A',
      amount: '$10 million',
      announcedDate: 'Nov 12, 2024',
      leadInvestor: 'Accel Partners (Lead)',
      participatingInvestors: ['Sequoia Capital', 'Y Combinator'],
      valuation: 'Post-money: $40M',
      useOfFunds: [
        { category: 'Expand sales team', percentage: 40 },
        { category: 'Product development', percentage: 30 },
        { category: 'Marketing & growth', percentage: 20 },
        { category: 'Operations', percentage: 10 }
      ],
      pressReleaseUrl: 'https://techstart.com/press/series-a',
      crunchbaseUrl: 'https://crunchbase.com/organization/techstart'
    },

    aiAnalysis: {
      whyThisMatters: [
        'Budget confirmed ($10M raised)',
        'Growth stage (Series A)',
        'Scaling teams (expansion mode)',
        'Decision makers accessible'
      ],
      recommendedActions: [
        'Contact within 48h (optimal window)',
        'Mention funding milestone',
        'Highlight scaling solutions',
        'Reference Series A success stories'
      ],
      similarCompaniesConverted: [
        'DataFlow Inc',
        'CloudNine Inc',
        'InnovateLabs'
      ]
    },

    article: {
      title: 'TechStart Inc Raises $10M Series A to Revolutionize FinTech',
      published: 'Nov 12, 2024',
      source: 'TechCrunch',
      summary: 'TechStart Inc, a San Francisco-based FinTech startup, announced today that it has raised $10 million in Series A funding led by Accel Partners. The company plans to use the funds to expand its sales team and accelerate product development.\n\n"This funding represents a major milestone for TechStart," said Robert Chen, CEO and Co-Founder. "We\'re excited to partner with Accel and leverage their expertise to scale our platform and reach more customers in the financial services industry."',
      fullTextUrl: 'https://techcrunch.com/techstart-series-a'
    },

    decisionMakers: [
      {
        name: 'Sarah Lee',
        title: 'CFO (Decision Maker)',
        email: 'sarah@techstart.com',
        phone: '+1 555-0456',
        linkedin: 'https://linkedin.com/in/sarahlee',
        role: 'decision_maker'
      },
      {
        name: 'Robert Chen',
        title: 'CEO & Co-Founder',
        email: 'robert@techstart.com',
        phone: '+1 555-0457',
        linkedin: 'https://linkedin.com/in/robertchen',
        role: 'decision_maker'
      },
      {
        name: 'Michael Zhang',
        title: 'CTO & Co-Founder',
        email: 'michael@techstart.com',
        linkedin: 'https://linkedin.com/in/michaelzhang',
        role: 'champion'
      }
    ],

    scoreBreakdown: {
      funding: 25,
      growthSignals: 20,
      decisionMakers: 15,
      techStackFit: 15,
      companySize: 13
    },

    conversionProbability: 67,
    expectedCloseRate: 45,

    relatedSignals: [
      {
        id: '2',
        type: 'hiring',
        title: 'Hired VP of Sales',
        timeAgo: '1 month ago',
        score: 82
      },
      {
        id: '3',
        type: 'hiring',
        title: 'Posted 3 Sales Engineer jobs',
        timeAgo: '2 weeks ago',
        score: 78
      }
    ],

    similarCompanies: [
      {
        id: '4',
        name: 'DataFlow Inc',
        type: 'funding',
        amount: '$12M Series A',
        industry: 'Data Analytics',
        score: 85,
        status: 'converted'
      },
      {
        id: '5',
        name: 'InnovateLabs',
        type: 'funding',
        amount: '$5M Seed',
        industry: 'HealthTech',
        score: 72,
        status: 'new'
      }
    ],

    timeline: [
      {
        date: 'Nov 15, 2024 - 10:30 AM',
        event: 'Signal detected',
        source: 'Crunchbase API'
      },
      {
        date: 'Nov 12, 2024 - 9:00 AM',
        event: 'Press release published',
        source: 'TechCrunch'
      },
      {
        date: 'Nov 15, 2024 - 12:15 PM',
        event: 'Viewed by Sarah C.',
        user: 'Sarah C.'
      }
    ],

    resources: {
      companyWebsite: 'https://techstart.com',
      linkedinPage: 'https://linkedin.com/company/techstart',
      crunchbasePage: 'https://crunchbase.com/organization/techstart',
      recentNews: [
        {
          title: 'TechStart Raises $10M',
          source: 'TechCrunch',
          url: 'https://techcrunch.com/techstart-series-a'
        },
        {
          title: 'Series A Funding Announcement',
          source: 'VentureBeat',
          url: 'https://venturebeat.com/techstart'
        },
        {
          title: 'TechStart Expands Team',
          source: 'Business Insider',
          url: 'https://businessinsider.com/techstart'
        }
      ]
    }
  };

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

  const color = getSignalColor(signal.type);
  const scoreStars = Math.round((signal.aiScore / 100) * 5);

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
          <span className="text-gray-900 font-medium">{signal.title}</span>
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
              <span className="font-medium">Signal Detected:</span> {signal.detectedAt} ({signal.timeAgo})
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
              onClick={() => setShowAddLeadModal(true)}
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
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <Star className="h-4 w-4" />
              <span>Add to Watch List</span>
            </button>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
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
                {/* Signal Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Signal Score:</span>
                    <span className="text-2xl font-bold text-purple-600">{signal.aiScore}/100</span>
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

                {/* Buying Intent */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Buying Intent:</span>
                    <span className="text-lg font-bold text-orange-600 flex items-center space-x-1">
                      <span>HIGH</span>
                      <span>🔥</span>
                    </span>
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
                  <div className="space-y-2">
                    {signal.aiAnalysis.whyThisMatters.map((matter, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{matter}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Actions */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Recommended Actions:</h3>
                  <ol className="space-y-2">
                    {signal.aiAnalysis.recommendedActions.map((action, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-sm font-semibold text-purple-600">{idx + 1}.</span>
                        <span className="text-sm text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Similar Companies */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Similar Companies That Converted:</h3>
                  <div className="flex flex-wrap gap-2">
                    {signal.aiAnalysis.similarCompaniesConverted.map((company, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                        • {company}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Signal Details */}
            {signal.fundingDetails && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className={`flex items-center space-x-3 mb-4 text-${color}-600`}>
                  <DollarSign className="h-6 w-6" />
                  <h2 className="text-xl font-bold text-gray-900">Funding Details</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Round Type</p>
                      <p className="text-base font-semibold text-gray-900">{signal.fundingDetails.roundType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-base font-semibold text-gray-900">{signal.fundingDetails.amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Announced</p>
                      <p className="text-base font-semibold text-gray-900">{signal.fundingDetails.announcedDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Valuation</p>
                      <p className="text-base font-semibold text-gray-900">{signal.fundingDetails.valuation}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Lead Investor:</p>
                    <p className="text-sm text-gray-700">• {signal.fundingDetails.leadInvestor}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Participating Investors:</p>
                    {signal.fundingDetails.participatingInvestors.map((investor, idx) => (
                      <p key={idx} className="text-sm text-gray-700">• {investor}</p>
                    ))}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Use of Funds:</p>
                    {signal.fundingDetails.useOfFunds.map((fund, idx) => (
                      <div key={idx} className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">• {fund.category}</span>
                        <span className="text-sm font-medium text-gray-900">({fund.percentage}%)</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                    <a
                      href={signal.fundingDetails.crunchbaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>View on Crunchbase</span>
                    </a>
                    <a
                      href={signal.fundingDetails.pressReleaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Read Press Release</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Full Article */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="h-6 w-6 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Press Coverage</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{signal.article.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span>Published: {signal.article.published}</span>
                    <span>Source: {signal.article.source}</span>
                  </div>
                </div>

                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {signal.article.summary}
                </div>

                <a
                  href={signal.article.fullTextUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <span>Read Full Article</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Related Content */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <ExternalLink className="h-6 w-6 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Additional Resources</h2>
              </div>

              <div className="space-y-3">
                <a
                  href={signal.resources.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Linkedin className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">LinkedIn Company Page</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>

                <a
                  href={signal.resources.crunchbasePage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Crunchbase Profile</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Recent News ({signal.resources.recentNews.length} articles):</p>
                  <div className="space-y-2">
                    {signal.resources.recentNews.map((news, idx) => (
                      <a
                        key={idx}
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        • {news.title} ({news.source})
                      </a>
                    ))}
                  </div>
                  <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All News →
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="h-6 w-6 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Signal History</h2>
              </div>

              <div className="space-y-4">
                {signal.timeline.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.date}</p>
                      <p className="text-sm text-gray-700">{item.event}</p>
                      {item.source && (
                        <p className="text-xs text-gray-500 mt-1">Source: {item.source}</p>
                      )}
                      {item.user && (
                        <p className="text-xs text-gray-500 mt-1">By: {item.user}</p>
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
              <div className="flex items-center space-x-3 mb-4">
                <Building2 className="h-6 w-6 text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">{signal.company}</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Industry</p>
                  <p className="text-sm font-medium text-gray-900">{signal.industry}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Founded</p>
                  <p className="text-sm font-medium text-gray-900">{signal.companyDetails.founded}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employees</p>
                  <p className="text-sm font-medium text-gray-900">{signal.employees}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">HQ</p>
                  <p className="text-sm font-medium text-gray-900">{signal.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  <p className="text-sm font-medium text-blue-600">{signal.companyDetails.website}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-sm font-medium text-gray-900">{signal.companyDetails.revenue}</p>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Tech Stack:</p>
                  <div className="space-y-1">
                    {signal.companyDetails.techStack.map((tech, idx) => (
                      <p key={idx} className="text-sm text-gray-700">• {tech}</p>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Social:</p>
                  <div className="flex items-center space-x-3">
                    {signal.companyDetails.social.linkedin && (
                      <a href={signal.companyDetails.social.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-5 w-5 text-gray-600 hover:text-blue-600" />
                      </a>
                    )}
                    {signal.companyDetails.social.twitter && (
                      <a href={signal.companyDetails.social.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-5 w-5 text-gray-600 hover:text-blue-400" />
                      </a>
                    )}
                    {signal.companyDetails.social.blog && (
                      <a href={signal.companyDetails.social.blog} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-5 w-5 text-gray-600 hover:text-gray-900" />
                      </a>
                    )}
                  </div>
                </div>

                <button className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                  View Full Profile
                </button>
              </div>
            </div>

            {/* Decision Makers */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Decision Makers ({signal.decisionMakers.length})
              </h2>

              <div className="space-y-4">
                {signal.decisionMakers.map((dm, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">{dm.name}</h3>
                        <p className="text-sm text-gray-600">{dm.title}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{dm.email}</span>
                      </div>
                      {dm.phone && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{dm.phone}</span>
                        </div>
                      )}
                      {dm.linkedin && (
                        <a
                          href={dm.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                        >
                          <Linkedin className="h-4 w-4" />
                          <span>LinkedIn Profile</span>
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDecisionMaker(dm);
                        setShowAddLeadModal(true);
                      }}
                      className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Add as Lead
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setShowAddLeadModal(true)}
                  className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Add All as Leads
                </button>
              </div>
            </div>

            {/* Lead Score Potential */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Target className="h-6 w-6 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">If Converted to Lead</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Estimated Score</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-3xl font-bold text-gray-900">{signal.aiScore}/100</p>
                    <div className="flex items-center space-x-1 flex-1">
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
                </div>

                <div className="pt-3 border-t border-blue-200">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Score Factors:</p>
                  <div className="space-y-2">
                    {Object.entries(signal.scoreBreakdown).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900">+{value} points</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">Conversion Probability:</span>
                    <span className="text-lg font-bold text-gray-900">{signal.conversionProbability}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded ${
                          i < signal.conversionProbability / 10 ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Expected Close Rate:</span>
                    <span className="text-lg font-bold text-orange-600">{signal.expectedCloseRate}% (High!)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Similar Signals */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Similar Signals</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Other {signal.company} Signals:</p>
                  <div className="space-y-2">
                    {signal.relatedSignals.map((rs) => (
                      <div key={rs.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-semibold text-gray-600 uppercase">{rs.type}</span>
                          <span className="text-xs text-gray-500">• {rs.timeAgo}</span>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{rs.title}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Score: {rs.score}/100</span>
                          <button
                            onClick={() => navigate(`/lead-generation/intelligence/${rs.id}`)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View Signal
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Similar Companies:</p>
                  <div className="space-y-2">
                    {signal.similarCompanies.map((sc) => (
                      <div key={sc.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <DollarSign className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-gray-900">{sc.name}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{sc.amount}</p>
                        <p className="text-xs text-gray-600 mb-2">Industry: {sc.industry}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Score: {sc.score}/100</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs">
                              {sc.status === 'converted' ? '✅ Converted' : '🟢 New'}
                            </span>
                            <button
                              onClick={() => navigate(`/lead-generation/intelligence/${sc.id}`)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>
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
                  onClick={() => setShowAddLeadModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Lead</span>
                </button>
                <button
                  onClick={() => setShowAddLeadModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  <Users className="h-4 w-4" />
                  <span>Create Multiple Leads</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  <Mail className="h-4 w-4" />
                  <span>Add to Sequence</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
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
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
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

      {/* Modals would go here - simplified for brevity */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add to Leads</h2>
            <p className="text-gray-600 mb-4">
              {selectedDecisionMaker
                ? `Create lead for ${selectedDecisionMaker.name}`
                : 'Convert this signal into leads for your pipeline'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddLeadModal(false);
                  setSelectedDecisionMaker(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  navigate(`/lead-generation/leads/new?from=intelligence&signalId=${signal.id}`);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
