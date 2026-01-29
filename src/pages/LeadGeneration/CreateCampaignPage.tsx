import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  X,
  Mail,
  Share2,
  Linkedin,
  RefreshCw,
  Calendar,
  Target,
  Users,
  Settings,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Zap,
  AlertTriangle,
  Lightbulb,
  Plus,
  Search,
  UserCircle,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  Link,
  Paperclip,
  Type
} from 'lucide-react';

type CampaignStep = 1 | 2 | 3 | 4 | 5 | 6;
type CampaignGoalType = 'meetings' | 'demos' | 'trials' | 'opportunities' | '';

interface CampaignFormData {
  name: string;
  description: string;
  type: 'email' | 'multi-channel' | 'linkedin';
  goalType: CampaignGoalType;
  template: string;
  sequence: SequenceTouch[];
  leads: string[];
  settings: CampaignSettings;
  targetMetrics: {
    openRate: string;
    replyRate: string;
    opportunities: string;
    revenue: string;
  };
  tags: string[];
  owner: string;
  collaborators: string[];
}

interface SequenceTouch {
  touch: number;
  name: string;
  channel: string;
  delay: number;
  delayUnit: string;
  subject: string;
  content: string;
  abTestEnabled: boolean;
  variantASubject?: string;
  variantBSubject?: string;
  sendConditions: {
    onlyIfOpened: boolean;
    onlyIfClicked: boolean;
    onlyIfNotReplied: boolean;
  };
}

interface CampaignSettings {
  sendTimeOptimization: boolean;
  timezoneAware: boolean;
  businessHoursOnly: boolean;
  dailySendLimit: number;
  abTestingEnabled: boolean;
  stopOnReply: boolean;
  stopOnUnsubscribe: boolean;
}

const campaignTemplates = [
  {
    id: 'cold-outreach',
    name: 'Cold Outreach',
    icon: Mail,
    touchCount: 5,
    channel: 'Email only',
    perfectFor: ['New prospects', 'Cold outreach', 'Enterprise'],
    avgOpenRate: 28,
    avgReplyRate: 8,
    description: '5-touch email sequence designed for cold outreach'
  },
  {
    id: 'warm-intro',
    name: 'Warm Intro',
    icon: Sparkles,
    touchCount: 3,
    channel: 'Email only',
    perfectFor: ['HRMS leads', 'Referrals', 'Warm intros'],
    avgOpenRate: 55,
    avgReplyRate: 20,
    description: '3-touch sequence for warm introductions'
  },
  {
    id: 're-engagement',
    name: 'Re-engagement',
    icon: RefreshCw,
    touchCount: 4,
    channel: 'Multi-channel',
    perfectFor: ['Dormant leads', '90+ days inactive', 'Win-back'],
    avgOpenRate: 18,
    avgReplyRate: 5,
    description: '4-touch multi-channel sequence for re-engagement'
  },
  {
    id: 'event-followup',
    name: 'Event Follow-up',
    icon: Calendar,
    touchCount: 3,
    channel: 'LinkedIn focus',
    perfectFor: ['Conference leads', 'Webinar attendees', 'Event networking'],
    avgOpenRate: null,
    avgReplyRate: 12,
    description: '3-touch LinkedIn-focused follow-up'
  },
  {
    id: 'trial-followup',
    name: 'Trial Follow-up',
    icon: Target,
    touchCount: 5,
    channel: 'Email only',
    perfectFor: ['Demo attendees', 'Free trial users', 'Product trials'],
    avgOpenRate: 42,
    avgReplyRate: 15,
    description: '5-touch email sequence for trial users'
  },
  {
    id: 'custom',
    name: 'Start from Scratch',
    icon: Zap,
    touchCount: 0,
    channel: 'Build your own',
    perfectFor: ['Unique campaigns', 'Custom workflows', 'A/B testing'],
    avgOpenRate: null,
    avgReplyRate: null,
    description: 'Build your own custom sequence from scratch'
  }
];

const CreateCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<CampaignStep>(1);
  const [newTag, setNewTag] = useState('');
  const [collaboratorSearch, setCollaboratorSearch] = useState('');
  const [expandedTouches, setExpandedTouches] = useState<number[]>([1]);
  const [enrollmentMethod, setEnrollmentMethod] = useState<'manual' | 'auto'>('manual');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [leadFilters, setLeadFilters] = useState({
    source: '',
    score: '',
    bant: '',
    industry: '',
    companySize: '',
    stage: '',
    search: ''
  });
  const [quickFilter, setQuickFilter] = useState<string>('');
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    type: 'email',
    goalType: '',
    template: '',
    sequence: [],
    leads: [],
    settings: {
      sendTimeOptimization: true,
      timezoneAware: true,
      businessHoursOnly: true,
      dailySendLimit: 50,
      abTestingEnabled: false,
      stopOnReply: true,
      stopOnUnsubscribe: true
    },
    targetMetrics: {
      openRate: '',
      replyRate: '',
      opportunities: '',
      revenue: ''
    },
    tags: [],
    owner: 'user_adithya',
    collaborators: []
  });

  const availableCollaborators = [
    { id: 'user_sarah', name: 'Sarah Chen', avatar: '👤' },
    { id: 'user_mike', name: 'Mike Johnson', avatar: '👤' },
    { id: 'user_emily', name: 'Emily Rodriguez', avatar: '👤' },
    { id: 'user_david', name: 'David Park', avatar: '👤' }
  ];

  const steps = [
    { number: 1, label: 'Basic Info', icon: Mail, status: currentStep > 1 ? 'complete' : currentStep === 1 ? 'current' : 'pending' },
    { number: 2, label: 'Template', icon: Sparkles, status: currentStep > 2 ? 'complete' : currentStep === 2 ? 'current' : 'pending' },
    { number: 3, label: 'Sequence', icon: Share2, status: currentStep > 3 ? 'complete' : currentStep === 3 ? 'current' : 'pending' },
    { number: 4, label: 'Leads', icon: Users, status: currentStep > 4 ? 'complete' : currentStep === 4 ? 'current' : 'pending' },
    { number: 5, label: 'Settings', icon: Settings, status: currentStep > 5 ? 'complete' : currentStep === 5 ? 'current' : 'pending' },
    { number: 6, label: 'Review', icon: CheckCircle, status: currentStep === 6 ? 'current' : 'pending' }
  ];

  const handleSaveDraft = () => {
    console.log('Saving draft:', formData);
    navigate('/lead-generation/campaigns');
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as CampaignStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as CampaignStep);
    }
  };

  const getDefaultSequence = (templateId: string): SequenceTouch[] => {
    if (templateId === 'cold-outreach') {
      return [
        {
          touch: 1,
          name: 'Initial Outreach',
          channel: 'Email',
          delay: 0,
          delayUnit: 'immediately',
          subject: "Quick question about {{company}}'s growth",
          content: `Hi {{firstName}},\n\nI noticed {{company}} recently {{hrmsSource}} and wanted to reach out.\n\nWe help {{industry}} companies like yours solve {{painPoint}} and achieve measurable results in {{timeline}}.\n\nWould you be open to a quick 15-minute call next week?\n\nBest,\n{{senderName}}`,
          abTestEnabled: true,
          variantASubject: "Quick question about {{company}}'s growth",
          variantBSubject: "{{firstName}}, saw your recent post",
          sendConditions: { onlyIfOpened: false, onlyIfClicked: false, onlyIfNotReplied: false }
        },
        {
          touch: 2,
          name: 'Follow-up',
          channel: 'Email',
          delay: 3,
          delayUnit: 'days',
          subject: 'Following up - {{firstName}}',
          content: `Hi {{firstName}},\n\nJust wanted to follow up on my previous email. Have you had a chance to review it?\n\nI'd love to discuss how we can help {{company}} achieve {{benefit}}.\n\nBest,\n{{senderName}}`,
          abTestEnabled: false,
          sendConditions: { onlyIfOpened: true, onlyIfClicked: false, onlyIfNotReplied: true }
        },
        {
          touch: 3,
          name: 'Value Proposition',
          channel: 'Email',
          delay: 5,
          delayUnit: 'days',
          subject: 'How {{competitorCompany}} increased revenue by 40%',
          content: `Hi {{firstName}},\n\nI wanted to share a quick case study that might be relevant to {{company}}.\n\nWe recently helped {{competitorCompany}} increase their revenue by 40% in just 6 months.\n\nWould you like to learn more?\n\nBest,\n{{senderName}}`,
          abTestEnabled: false,
          sendConditions: { onlyIfOpened: false, onlyIfClicked: false, onlyIfNotReplied: true }
        },
        {
          touch: 4,
          name: 'Case Study',
          channel: 'Email',
          delay: 2,
          delayUnit: 'days',
          subject: 'Thought this might interest you, {{firstName}}',
          content: `Hi {{firstName}},\n\nI came across this case study and immediately thought of {{company}}.\n\n[Link to case study]\n\nLet me know if you'd like to discuss how we could achieve similar results for you.\n\nBest,\n{{senderName}}`,
          abTestEnabled: false,
          sendConditions: { onlyIfOpened: false, onlyIfClicked: false, onlyIfNotReplied: true }
        },
        {
          touch: 5,
          name: 'Break-up Email',
          channel: 'Email',
          delay: 4,
          delayUnit: 'days',
          subject: 'Should I close your file?',
          content: `Hi {{firstName}},\n\nI haven't heard back from you, so I'm assuming the timing isn't right.\n\nI'll close your file for now, but feel free to reach out if things change.\n\nBest of luck!\n{{senderName}}`,
          abTestEnabled: false,
          sendConditions: { onlyIfOpened: false, onlyIfClicked: false, onlyIfNotReplied: true }
        }
      ];
    }
    return [];
  };

  const handleTemplateSelect = (templateId: string) => {
    const defaultSequence = getDefaultSequence(templateId);
    setFormData({ ...formData, template: templateId, sequence: defaultSequence });
    setExpandedTouches([1]);
    handleNext();
  };

  const toggleTouchExpanded = (touchNumber: number) => {
    setExpandedTouches(prev =>
      prev.includes(touchNumber)
        ? prev.filter(t => t !== touchNumber)
        : [...prev, touchNumber]
    );
  };

  const updateTouch = (touchNumber: number, field: string, value: any) => {
    setFormData({
      ...formData,
      sequence: formData.sequence.map(touch =>
        touch.touch === touchNumber
          ? { ...touch, [field]: value }
          : touch
      )
    });
  };

  const deleteTouchFromSequence = (touchNumber: number) => {
    setFormData({
      ...formData,
      sequence: formData.sequence
        .filter(touch => touch.touch !== touchNumber)
        .map((touch, index) => ({ ...touch, touch: index + 1 }))
    });
    setExpandedTouches(prev => prev.filter(t => t !== touchNumber));
  };

  const duplicateTouch = (touchNumber: number) => {
    const touchToDuplicate = formData.sequence.find(t => t.touch === touchNumber);
    if (touchToDuplicate) {
      const newTouch = {
        ...touchToDuplicate,
        touch: formData.sequence.length + 1,
        name: `${touchToDuplicate.name} (Copy)`
      };
      setFormData({
        ...formData,
        sequence: [...formData.sequence, newTouch]
      });
    }
  };

  const renderProgressTracker = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
        Progress Tracker
      </h2>

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm mb-2
                  ${step.status === 'complete' ? 'bg-green-500 text-white' :
                    step.status === 'current' ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-500'}
                `}>
                  {step.status === 'complete' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-900">{step.label}</div>
                  <div className="text-xs text-gray-500">
                    {step.status === 'complete' ? '✓ Complete' :
                     step.status === 'current' ? '← Current' :
                     'Not started'}
                  </div>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-1 mx-2 mb-12
                  ${steps[index + 1].status !== 'pending' ? 'bg-green-500' : 'bg-gray-200'}
                `} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleToggleCollaborator = (collaboratorId: string) => {
    if (formData.collaborators.includes(collaboratorId)) {
      setFormData({ ...formData, collaborators: formData.collaborators.filter(id => id !== collaboratorId) });
    } else {
      setFormData({ ...formData, collaborators: [...formData.collaborators, collaboratorId] });
    }
  };

  const renderStep1BasicInfo = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">STEP 1: BASIC INFORMATION</h2>
      <p className="text-sm text-gray-600 mb-8">Let's start with the basics</p>

      <div className="space-y-8">
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Campaign Details
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Q1 2025 Enterprise Outreach"
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Choose a clear, descriptive name. You can always change it later.
                </p>
                <span className="text-xs text-gray-500">({formData.name.length}/100 chars)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Targeting VP and C-level at SaaS companies with 100-500 employees"
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="text-right mt-1">
                <span className="text-xs text-gray-500">({formData.description.length}/500 chars)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Campaign Type *
          </label>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setFormData({ ...formData, type: 'email' })}
              className={`p-5 border-2 rounded-lg text-left transition-all ${
                formData.type === 'email'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {formData.type === 'email' ? '⦿' : '○'}
                <Mail className={`h-5 w-5 ${formData.type === 'email' ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">Email Only</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="font-medium mb-1">Best for:</div>
                <div>• Wide reach</div>
                <div>• Scalable</div>
                <div>• Trackable metrics</div>
              </div>
            </button>

            <button
              onClick={() => setFormData({ ...formData, type: 'linkedin' })}
              className={`p-5 border-2 rounded-lg text-left transition-all ${
                formData.type === 'linkedin'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {formData.type === 'linkedin' ? '⦿' : '○'}
                <Linkedin className={`h-5 w-5 ${formData.type === 'linkedin' ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">LinkedIn Only</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="font-medium mb-1">Best for:</div>
                <div>• C-level targets</div>
                <div>• Relationship bldg</div>
                <div>• High-value leads</div>
              </div>
            </button>

            <button
              onClick={() => setFormData({ ...formData, type: 'multi-channel' })}
              className={`p-5 border-2 rounded-lg text-left transition-all ${
                formData.type === 'multi-channel'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {formData.type === 'multi-channel' ? '⦿' : '○'}
                <Share2 className={`h-5 w-5 ${formData.type === 'multi-channel' ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">Multi-Channel</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="font-medium mb-1">Best for:</div>
                <div>• Maximum coverage</div>
                <div>• Complex sequences</div>
                <div>• Multi-touch</div>
              </div>
            </button>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700">Campaign type cannot be changed after creation</p>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Goal (Optional)
          </label>
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: 'meetings', label: 'Meetings', icon: Calendar },
              { id: 'demos', label: 'Demos', icon: Target },
              { id: 'trials', label: 'Trials', icon: Sparkles },
              { id: 'opportunities', label: 'Opportunities', icon: TrendingUp }
            ].map((goal) => (
              <button
                key={goal.id}
                onClick={() => setFormData({ ...formData, goalType: goal.id as CampaignGoalType })}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  formData.goalType === goal.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg mb-1">{formData.goalType === goal.id ? '⦿' : '○'}</div>
                <div className="text-sm font-medium text-gray-900">{goal.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Target Metrics (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Open Rate (%)
              </label>
              <input
                type="number"
                value={formData.targetMetrics.openRate}
                onChange={(e) => setFormData({
                  ...formData,
                  targetMetrics: { ...formData.targetMetrics, openRate: e.target.value }
                })}
                placeholder="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Industry avg: 25%</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Reply Rate (%)
              </label>
              <input
                type="number"
                value={formData.targetMetrics.replyRate}
                onChange={(e) => setFormData({
                  ...formData,
                  targetMetrics: { ...formData.targetMetrics, replyRate: e.target.value }
                })}
                placeholder="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Industry avg: 7%</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Opportunities
              </label>
              <input
                type="number"
                value={formData.targetMetrics.opportunities}
                onChange={(e) => setFormData({
                  ...formData,
                  targetMetrics: { ...formData.targetMetrics, opportunities: e.target.value }
                })}
                placeholder="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Revenue ($)
              </label>
              <input
                type="number"
                value={formData.targetMetrics.revenue}
                onChange={(e) => setFormData({
                  ...formData,
                  targetMetrics: { ...formData.targetMetrics, revenue: e.target.value }
                })}
                placeholder="500000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (Optional)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Add a tag..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Tags help organize and filter campaigns
          </p>
        </div>

        <div className="border-b border-gray-200 pb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Owner *
          </label>
          <div className="relative">
            <select
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="user_adithya">👤 Adithya (You)</option>
              <option value="user_sarah">👤 Sarah Chen</option>
              <option value="user_mike">👤 Mike Johnson</option>
              <option value="user_emily">👤 Emily Rodriguez</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Collaborators (Optional)
          </label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={collaboratorSearch}
              onChange={(e) => setCollaboratorSearch(e.target.value)}
              placeholder="Search team members..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {collaboratorSearch && (
            <div className="border border-gray-200 rounded-lg mb-3 max-h-48 overflow-y-auto">
              {availableCollaborators
                .filter(c => c.name.toLowerCase().includes(collaboratorSearch.toLowerCase()))
                .map((collaborator) => (
                  <button
                    key={collaborator.id}
                    onClick={() => {
                      handleToggleCollaborator(collaborator.id);
                      setCollaboratorSearch('');
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <UserCircle className="h-5 w-5 text-gray-400" />
                    <span className="text-sm">{collaborator.name}</span>
                    {formData.collaborators.includes(collaborator.id) && (
                      <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                    )}
                  </button>
                ))}
            </div>
          )}

          {formData.collaborators.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-2">Selected:</p>
              <div className="flex flex-wrap gap-2">
                {formData.collaborators.map((collabId) => {
                  const collaborator = availableCollaborators.find(c => c.id === collabId);
                  return collaborator ? (
                    <span
                      key={collabId}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      <UserCircle className="h-4 w-4" />
                      {collaborator.name}
                      <button
                        onClick={() => handleToggleCollaborator(collabId)}
                        className="hover:text-gray-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2Template = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">STEP 2: SELECT TEMPLATE</h2>
      <p className="text-sm text-gray-600 mb-8">Choose a pre-built template or start from scratch</p>

      <div className="border-b border-gray-200 pb-2 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Recommended Templates
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {campaignTemplates.map((template) => {
          const Icon = template.icon;
          const isSelected = formData.template === template.id;

          return (
            <div
              key={template.id}
              className={`border-2 rounded-lg p-5 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-500' : 'text-gray-500'}`} />
                  <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wide">
                    {template.name}
                  </h3>
                </div>
                <div className="border-b border-gray-300 mb-3"></div>
              </div>

              <div className="space-y-4 mb-6 min-h-[280px]">
                <div className="space-y-1">
                  <div className="text-sm text-gray-700 font-medium">
                    {template.touchCount > 0 ? `${template.touchCount}-touch sequence` : 'Build your own'}
                  </div>
                  <div className="text-sm text-gray-600">{template.channel}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">Perfect for:</div>
                  <ul className="space-y-1">
                    {template.perfectFor.map((item, idx) => (
                      <li key={idx} className="text-xs text-gray-600">• {item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-700 mb-2">Avg Performance:</div>
                  {template.avgOpenRate !== null && (
                    <div className="text-xs text-gray-600 mb-1">📊 {template.avgOpenRate}% open rate</div>
                  )}
                  {template.avgReplyRate !== null && (
                    <div className="text-xs text-gray-600">💬 {template.avgReplyRate}% reply rate</div>
                  )}
                  {template.avgOpenRate === null && template.avgReplyRate === null && (
                    <div className="text-xs text-gray-500 italic">
                      No pre-set<br />performance data
                    </div>
                  )}
                  {template.avgOpenRate === null && template.avgReplyRate !== null && (
                    <div className="text-xs text-gray-500">📊 N/A (LinkedIn)</div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleTemplateSelect(template.id)}
                className={`w-full px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                  isSelected
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {template.id === 'custom' ? 'Start from Scratch' : 'Select Template'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <span className="font-semibold">TIP:</span> Templates can be customized after selection. Your changes won't affect the template.
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3Sequence = () => {
    const selectedTemplate = campaignTemplates.find(t => t.id === formData.template);
    const totalDuration = formData.sequence.reduce((sum, touch) => sum + (typeof touch.delay === 'number' ? touch.delay : 0), 0);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">STEP 3: BUILD SEQUENCE</h2>
          <button
            onClick={() => {
              const newTouch: SequenceTouch = {
                touch: formData.sequence.length + 1,
                name: `Touch ${formData.sequence.length + 1}`,
                channel: 'Email',
                delay: 3,
                delayUnit: 'days',
                subject: '',
                content: '',
                abTestEnabled: false,
                sendConditions: { onlyIfOpened: false, onlyIfClicked: false, onlyIfNotReplied: false }
              };
              setFormData({ ...formData, sequence: [...formData.sequence, newTouch] });
              setExpandedTouches([...expandedTouches, newTouch.touch]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Touch
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-8">Create your multi-touch outreach sequence</p>

        {/* Sequence Overview */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Sequence Overview
          </h3>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-600">Template: </span>
              <span className="font-medium text-gray-900">{selectedTemplate?.name || 'None'}</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div>
              <span className="text-gray-600">Total Touches: </span>
              <span className="font-medium text-gray-900">{formData.sequence.length}</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div>
              <span className="text-gray-600">Est. Duration: </span>
              <span className="font-medium text-gray-900">{totalDuration} days</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div>
              <span className="text-gray-600">Channel: </span>
              <span className="font-medium text-gray-900">{selectedTemplate?.channel || 'Email'}</span>
            </div>
          </div>
        </div>

        {/* Touch Cards */}
        <div className="space-y-6">
          {formData.sequence.map((touch, index) => {
            const isExpanded = expandedTouches.includes(touch.touch);
            const cumulativeDays = formData.sequence
              .slice(0, index + 1)
              .reduce((sum, t) => sum + (typeof t.delay === 'number' ? t.delay : 0), 0);

            return (
              <div key={touch.touch} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                {/* Touch Header */}
                <div className="bg-gray-50 border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">
                      TOUCH {touch.touch} - {touch.name}
                    </h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Touch Content */}
                <div className="p-5">
                  {/* Timing Info */}
                  <div className="mb-4 text-sm text-gray-600">
                    <div className="mb-2">
                      <span className="font-medium">Timing: </span>
                      {touch.delay === 0 ? (
                        'Immediately when lead enrolled'
                      ) : index === 0 ? (
                        `${touch.delay} ${touch.delayUnit} after enrollment`
                      ) : (
                        `${touch.delay} ${touch.delayUnit} after Touch ${touch.touch - 1} (${cumulativeDays} days total)`
                      )}
                    </div>
                    {touch.delay > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Delay: </span>
                        <select
                          value={touch.delay}
                          onChange={(e) => updateTouch(touch.touch, 'delay', parseInt(e.target.value))}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <select
                          value={touch.delayUnit}
                          onChange={(e) => updateTouch(touch.touch, 'delayUnit', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="days">days</option>
                          <option value="hours">hours</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="mb-4 text-sm">
                    <span className="font-medium text-gray-700">Channel: </span>
                    <span className="text-gray-900">📧 {touch.channel}</span>
                  </div>

                  {isExpanded ? (
                    <>
                      {/* Send Conditions */}
                      {touch.touch > 1 && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-3">Send Conditions (Optional)</div>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={touch.sendConditions.onlyIfOpened}
                                onChange={(e) => updateTouch(touch.touch, 'sendConditions', {
                                  ...touch.sendConditions,
                                  onlyIfOpened: e.target.checked
                                })}
                                className="rounded border-gray-300"
                              />
                              Only send if Touch {touch.touch - 1} was opened
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={touch.sendConditions.onlyIfClicked}
                                onChange={(e) => updateTouch(touch.touch, 'sendConditions', {
                                  ...touch.sendConditions,
                                  onlyIfClicked: e.target.checked
                                })}
                                className="rounded border-gray-300"
                              />
                              Only send if Touch {touch.touch - 1} was clicked
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={touch.sendConditions.onlyIfNotReplied}
                                onChange={(e) => updateTouch(touch.touch, 'sendConditions', {
                                  ...touch.sendConditions,
                                  onlyIfNotReplied: e.target.checked
                                })}
                                className="rounded border-gray-300"
                              />
                              Only send if Touch {touch.touch - 1} was NOT replied
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Subject Line */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subject Line <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={touch.subject}
                          onChange={(e) => updateTouch(touch.touch, 'subject', e.target.value)}
                          placeholder="Enter subject line..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          ({touch.subject.length}/100 chars)
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-blue-700">
                            <span className="font-semibold">Personalization variables:</span> {'{'}{'{'} firstName {'}'}{'}'}, {'{'}{'{'} lastName {'}'}{'}'}, {'{'}{'{'} company {'}'}{'}'}, {'{'}{'{'} title {'}'}{'}'}, {'{'}{'{'} industry {'}'}{'}'}
                          </div>
                        </div>
                      </div>

                      {/* Email Body */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Body <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={touch.content}
                          onChange={(e) => updateTouch(touch.touch, 'content', e.target.value)}
                          placeholder="Enter email content..."
                          rows={10}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          ({touch.content.length}/2000 chars)
                        </div>
                      </div>

                      {/* Toolbar */}
                      <div className="flex items-center gap-2 mb-6">
                        <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                          <Type className="h-4 w-4" />
                          Insert Variable
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                          <Type className="h-4 w-4" />
                          Format Text
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                          <Link className="h-4 w-4" />
                          Add Link
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                          <Paperclip className="h-4 w-4" />
                          Add Attachment
                        </button>
                      </div>

                      {/* A/B Testing */}
                      <div className="mb-6 p-4 border border-gray-300 rounded-lg">
                        <label className="flex items-center gap-2 mb-4">
                          <input
                            type="checkbox"
                            checked={touch.abTestEnabled}
                            onChange={(e) => updateTouch(touch.touch, 'abTestEnabled', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm font-medium text-gray-700">Enable A/B testing for this touch</span>
                        </label>

                        {touch.abTestEnabled && (
                          <>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="text-sm font-semibold text-gray-700 mb-3">VARIANT A (50%)</div>
                                <div className="text-xs text-gray-600 mb-2">
                                  Subject: {touch.variantASubject || touch.subject}
                                </div>
                                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                  Edit Variant A
                                </button>
                              </div>
                              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="text-sm font-semibold text-gray-700 mb-3">VARIANT B (50%)</div>
                                <div className="text-xs text-gray-600 mb-2">
                                  Subject: {touch.variantBSubject || 'Alternative subject'}
                                </div>
                                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                  Edit Variant B
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-700 font-medium">Winner Selection:</span>
                                <label className="flex items-center gap-1">
                                  <input type="radio" name={`winner-${touch.touch}`} defaultChecked className="text-blue-500" />
                                  <span className="text-gray-600">Automatic (after 100 sends)</span>
                                </label>
                                <label className="flex items-center gap-1">
                                  <input type="radio" name={`winner-${touch.touch}`} className="text-blue-500" />
                                  <span className="text-gray-600">Manual</span>
                                </label>
                              </div>
                            </div>

                            <div className="mt-3">
                              <label className="text-sm text-gray-700 font-medium">Winning Metric: </label>
                              <select className="ml-2 px-3 py-1 border border-gray-300 rounded text-sm">
                                <option>Open Rate</option>
                                <option>Click Rate</option>
                                <option>Reply Rate</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Preview */}
                      <div className="mb-6">
                        <div className="text-sm font-medium text-gray-700 mb-3">Preview</div>
                        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 font-mono text-sm space-y-2">
                          <div className="text-gray-600">
                            <span className="font-semibold">From:</span> adithya@movingwalls.com
                          </div>
                          <div className="text-gray-600">
                            <span className="font-semibold">To:</span> john.smith@acmecorp.com
                          </div>
                          <div className="text-gray-600">
                            <span className="font-semibold">Subject:</span> {touch.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                              const replacements: Record<string, string> = {
                                firstName: 'John',
                                company: 'Acme Corp',
                                title: 'VP of Sales'
                              };
                              return replacements[key] || `{${key}}`;
                            })}
                          </div>
                          <div className="border-t border-gray-300 my-2"></div>
                          <div className="text-gray-900 whitespace-pre-wrap">
                            {touch.content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                              const replacements: Record<string, string> = {
                                firstName: 'John',
                                lastName: 'Smith',
                                company: 'Acme Corp',
                                title: 'VP of Sales',
                                industry: 'SaaS',
                                hrmsSource: 'hired a new VP of Sales',
                                painPoint: 'lead generation challenges',
                                timeline: '3-6 months',
                                senderName: 'Adithya',
                                benefit: 'faster growth',
                                competitorCompany: 'Similar Corp'
                              };
                              return replacements[key] || `{{${key}}}`;
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => toggleTouchExpanded(touch.touch)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <ChevronUp className="h-4 w-4" />
                          Collapse Touch {touch.touch}
                        </button>
                        <button
                          onClick={() => deleteTouchFromSequence(touch.touch)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Touch
                        </button>
                        <button
                          onClick={() => duplicateTouch(touch.touch)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                          Duplicate Touch
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Collapsed State */}
                      <div className="text-sm text-gray-600 mb-4">
                        <div className="mb-2">
                          <span className="font-medium">Subject: </span>
                          {touch.subject || 'Not set'}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleTouchExpanded(touch.touch)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ChevronDown className="h-4 w-4" />
                        Expand to edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Touch Button (Bottom) */}
        <button
          onClick={() => {
            const newTouch: SequenceTouch = {
              touch: formData.sequence.length + 1,
              name: `Touch ${formData.sequence.length + 1}`,
              channel: 'Email',
              delay: 3,
              delayUnit: 'days',
              subject: '',
              content: '',
              abTestEnabled: false,
              sendConditions: { onlyIfOpened: false, onlyIfClicked: false, onlyIfNotReplied: false }
            };
            setFormData({ ...formData, sequence: [...formData.sequence, newTouch] });
            setExpandedTouches([...expandedTouches, newTouch.touch]);
          }}
          className="flex items-center gap-2 px-4 py-2 mt-6 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Touch
        </button>

        {/* Sequence Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <div className="flex items-start gap-2 mb-2">
            <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-semibold text-blue-700">SEQUENCE TIPS</div>
          </div>
          <ul className="ml-7 space-y-1 text-sm text-blue-700">
            <li>• Keep subject lines under 50 characters for better open rates</li>
            <li>• Use personalization variables to increase relevance</li>
            <li>• Space touches 2-5 days apart for optimal engagement</li>
            <li>• Always include clear call-to-action</li>
            <li>• A/B test subject lines to find what works best</li>
          </ul>
        </div>
      </div>
    );
  };

  const mockLeads = [
    { id: '1', name: 'John Smith', title: 'VP of Sales', company: 'Acme Corp', industry: 'SaaS', employees: '250 emp', score: 92, bantScore: 18, bantMax: 20, source: 'HRMS', sourceType: 'Warm', stage: 'New', selected: true },
    { id: '2', name: 'Sarah Johnson', title: 'CEO', company: 'TechStart Inc', industry: 'SaaS', employees: '150 emp', score: 88, bantScore: 16, bantMax: 20, source: 'Apollo', sourceType: 'Cold', stage: 'New', selected: true },
    { id: '3', name: 'Mike Chen', title: 'Director, Marketing', company: 'Global Solutions', industry: 'Enterprise', employees: '500+', score: 85, bantScore: 15, bantMax: 20, source: 'ZoomInfo', sourceType: 'Cold', stage: 'New', selected: true },
    { id: '4', name: 'Lisa Park', title: 'Marketing Manager', company: 'StartupXYZ', industry: 'SaaS', employees: '20 emp', score: 45, bantScore: 8, bantMax: 20, source: 'Manual', sourceType: '', stage: 'New', selected: false },
    { id: '5', name: 'David Brown', title: 'VP Operations', company: 'Enterprise Co', industry: 'Finance', employees: '1000+', score: 78, bantScore: 14, bantMax: 20, source: 'Intelligence', sourceType: 'Warm', stage: 'Contacted', selected: true },
    { id: '6', name: 'Emily Davis', title: 'CMO', company: 'FastGrow Inc', industry: 'SaaS', employees: '300 emp', score: 91, bantScore: 17, bantMax: 20, source: 'HRMS', sourceType: 'Warm', stage: 'New', selected: true },
    { id: '7', name: 'Robert Wilson', title: 'CTO', company: 'Tech Innovations', industry: 'Technology', employees: '450 emp', score: 87, bantScore: 16, bantMax: 20, source: 'Apollo', sourceType: 'Cold', stage: 'New', selected: true },
    { id: '8', name: 'Jennifer Martinez', title: 'VP Sales', company: 'CloudBase', industry: 'SaaS', employees: '200 emp', score: 83, bantScore: 15, bantMax: 20, source: 'ZoomInfo', sourceType: 'Cold', stage: 'Qualified', selected: true },
  ];

  const filteredLeads = useMemo(() => {
    let filtered = [...mockLeads];

    if (quickFilter === 'high-score') {
      filtered = filtered.filter(l => l.score >= 80);
    } else if (quickFilter === 'bant-qualified') {
      filtered = filtered.filter(l => l.bantScore >= 15);
    } else if (quickFilter === 'hrms') {
      filtered = filtered.filter(l => l.source === 'HRMS');
    } else if (quickFilter === 'new-week') {
      filtered = filtered.filter(l => l.stage === 'New');
    }

    if (leadFilters.source) {
      filtered = filtered.filter(l => l.source === leadFilters.source);
    }
    if (leadFilters.score === 'high') {
      filtered = filtered.filter(l => l.score >= 80);
    } else if (leadFilters.score === 'medium') {
      filtered = filtered.filter(l => l.score >= 60 && l.score < 80);
    } else if (leadFilters.score === 'low') {
      filtered = filtered.filter(l => l.score < 60);
    }
    if (leadFilters.bant === 'qualified') {
      filtered = filtered.filter(l => l.bantScore >= 15);
    } else if (leadFilters.bant === 'needs-info') {
      filtered = filtered.filter(l => l.bantScore >= 10 && l.bantScore < 15);
    } else if (leadFilters.bant === 'not-qualified') {
      filtered = filtered.filter(l => l.bantScore < 10);
    }
    if (leadFilters.industry) {
      filtered = filtered.filter(l => l.industry === leadFilters.industry);
    }
    if (leadFilters.stage) {
      filtered = filtered.filter(l => l.stage === leadFilters.stage);
    }
    if (leadFilters.search) {
      const search = leadFilters.search.toLowerCase();
      filtered = filtered.filter(l =>
        l.name.toLowerCase().includes(search) ||
        l.company.toLowerCase().includes(search) ||
        l.title.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [leadFilters, quickFilter]);

  const selectedLeads = filteredLeads.filter(l => l.selected);
  const selectedCount = selectedLeads.length;

  const toggleLeadSelection = (leadId: string) => {
    const lead = mockLeads.find(l => l.id === leadId);
    if (lead) {
      lead.selected = !lead.selected;
      setSelectedLeadIds(prev =>
        lead.selected
          ? [...prev, leadId]
          : prev.filter(id => id !== leadId)
      );
    }
  };

  const clearAllSelections = () => {
    mockLeads.forEach(l => l.selected = false);
    setSelectedLeadIds([]);
  };

  const resetFilters = () => {
    setLeadFilters({
      source: '',
      score: '',
      bant: '',
      industry: '',
      companySize: '',
      stage: '',
      search: ''
    });
    setQuickFilter('');
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    return '🔴';
  };

  const getBantBadge = (bantScore: number) => {
    if (bantScore >= 15) return '✅';
    if (bantScore >= 10) return '⚠️';
    return '❌';
  };

  const enrollmentStats = useMemo(() => {
    const hrmsCount = selectedLeads.filter(l => l.source === 'HRMS').length;
    const apolloCount = selectedLeads.filter(l => l.source === 'Apollo').length;
    const zoomInfoCount = selectedLeads.filter(l => l.source === 'ZoomInfo').length;
    const intelligenceCount = selectedLeads.filter(l => l.source === 'Intelligence').length;

    const highScoreCount = selectedLeads.filter(l => l.score >= 80).length;
    const mediumScoreCount = selectedLeads.filter(l => l.score >= 60 && l.score < 80).length;
    const lowScoreCount = selectedLeads.filter(l => l.score < 60).length;

    const qualifiedCount = selectedLeads.filter(l => l.bantScore >= 15).length;
    const needsInfoCount = selectedLeads.filter(l => l.bantScore >= 10 && l.bantScore < 15).length;
    const notQualifiedCount = selectedLeads.filter(l => l.bantScore < 10).length;

    const totalSends = selectedCount * formData.sequence.length;
    const estimatedCost = (totalSends * 0.10).toFixed(2);

    return {
      hrms: hrmsCount,
      apollo: apolloCount,
      zoomInfo: zoomInfoCount,
      intelligence: intelligenceCount,
      highScore: highScoreCount,
      mediumScore: mediumScoreCount,
      lowScore: lowScoreCount,
      qualified: qualifiedCount,
      needsInfo: needsInfoCount,
      notQualified: notQualifiedCount,
      totalSends,
      estimatedCost
    };
  }, [selectedLeads, selectedCount, formData.sequence.length]);

  const renderStep4Leads = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">STEP 4: SELECT LEADS</h2>
      <p className="text-sm text-gray-600 mb-8">Choose which leads to enroll in this campaign</p>

      {/* Enrollment Method */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Enrollment Method
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => setEnrollmentMethod('manual')}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              enrollmentMethod === 'manual'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                checked={enrollmentMethod === 'manual'}
                onChange={() => setEnrollmentMethod('manual')}
                className="text-blue-500"
              />
              <span className="font-semibold text-gray-900">SELECT FROM EXISTING LEADS</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Manually choose specific leads to add to this campaign
            </p>
            {enrollmentMethod === 'manual' && (
              <div className="text-xs font-medium text-blue-600">[Selected]</div>
            )}
          </div>

          <div
            onClick={() => setEnrollmentMethod('auto')}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              enrollmentMethod === 'auto'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                checked={enrollmentMethod === 'auto'}
                onChange={() => setEnrollmentMethod('auto')}
                className="text-blue-500"
              />
              <span className="font-semibold text-gray-900">AUTO-ENROLL NEW LEADS</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Automatically enroll leads that match your criteria
            </p>
            {enrollmentMethod === 'auto' ? (
              <div className="text-xs font-medium text-blue-600">[Selected]</div>
            ) : (
              <div className="text-xs font-medium text-gray-600">[Select]</div>
            )}
          </div>
        </div>
      </div>

      {enrollmentMethod === 'manual' && (
        <>
          {/* Filter Section */}
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Filter Leads
            </h3>

            {/* Dropdowns */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <select
                value={leadFilters.source}
                onChange={(e) => setLeadFilters({ ...leadFilters, source: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Source</option>
                <option value="HRMS">HRMS</option>
                <option value="Apollo">Apollo</option>
                <option value="ZoomInfo">ZoomInfo</option>
                <option value="Intelligence">Intelligence</option>
                <option value="Manual">Manual</option>
              </select>

              <select
                value={leadFilters.score}
                onChange={(e) => setLeadFilters({ ...leadFilters, score: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Score</option>
                <option value="high">High (80+)</option>
                <option value="medium">Medium (60-79)</option>
                <option value="low">Low (&lt;60)</option>
              </select>

              <select
                value={leadFilters.bant}
                onChange={(e) => setLeadFilters({ ...leadFilters, bant: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">BANT</option>
                <option value="qualified">Qualified</option>
                <option value="needs-info">Needs Info</option>
                <option value="not-qualified">Not Qualified</option>
              </select>

              <select
                value={leadFilters.industry}
                onChange={(e) => setLeadFilters({ ...leadFilters, industry: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Industry</option>
                <option value="SaaS">SaaS</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
              </select>

              <select
                value={leadFilters.companySize}
                onChange={(e) => setLeadFilters({ ...leadFilters, companySize: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Company Size</option>
                <option value="small">Small (1-50)</option>
                <option value="medium">Medium (51-500)</option>
                <option value="large">Large (500+)</option>
              </select>

              <select
                value={leadFilters.stage}
                onChange={(e) => setLeadFilters({ ...leadFilters, stage: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Stage</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
              </select>
            </div>

            {/* Search and Reset */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={leadFilters.search}
                  onChange={(e) => setLeadFilters({ ...leadFilters, search: e.target.value })}
                  placeholder="Search by name, company, email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                Reset Filters
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Quick Filters
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setQuickFilter(quickFilter === 'high-score' ? '' : 'high-score')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'high-score'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⭐ High Score (80+)
              </button>
              <button
                onClick={() => setQuickFilter(quickFilter === 'bant-qualified' ? '' : 'bant-qualified')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'bant-qualified'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✅ BANT Qualified
              </button>
              <button
                onClick={() => setQuickFilter(quickFilter === 'hrms' ? '' : 'hrms')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'hrms'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🤝 HRMS Leads
              </button>
              <button
                onClick={() => setQuickFilter(quickFilter === 'new-week' ? '' : 'new-week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'new-week'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🆕 New This Week
              </button>
            </div>
          </div>

          {/* Selected Leads Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Selected Leads: {selectedCount}
              </h3>
              <button
                onClick={clearAllSelections}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <X className="h-4 w-4" />
                Clear All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      BANT
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.slice(0, 5).map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={lead.selected}
                          onChange={() => toggleLeadSelection(lead.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-xs text-gray-500">{lead.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{lead.company}</div>
                        <div className="text-xs text-gray-500">{lead.industry}, {lead.employees}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{lead.score}</div>
                        <div className="text-lg">{getScoreBadge(lead.score)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{lead.bantScore}/{lead.bantMax}</div>
                        <div className="text-lg">{getBantBadge(lead.bantScore)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{lead.source}</div>
                        {lead.sourceType && (
                          <div className="text-xs text-gray-500">({lead.sourceType})</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{lead.stage}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              Showing 5 of {selectedCount} selected
            </div>
          </div>

          {/* Enrollment Preview */}
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-gray-700" />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Enrollment Preview
              </h3>
            </div>

            <div className="mb-4">
              <div className="text-lg font-bold text-gray-900">Total Leads: {selectedCount}</div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">By Source:</div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>• HRMS: {enrollmentStats.hrms} ({Math.round(enrollmentStats.hrms / selectedCount * 100)}%)</div>
                  <div>• Apollo: {enrollmentStats.apollo} ({Math.round(enrollmentStats.apollo / selectedCount * 100)}%)</div>
                  <div>• ZoomInfo: {enrollmentStats.zoomInfo} ({Math.round(enrollmentStats.zoomInfo / selectedCount * 100)}%)</div>
                  <div>• Intelligence: {enrollmentStats.intelligence} ({Math.round(enrollmentStats.intelligence / selectedCount * 100)}%)</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">By Score:</div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>• High (80+): {enrollmentStats.highScore} ({Math.round(enrollmentStats.highScore / selectedCount * 100)}%)</div>
                  <div>• Medium (60-79): {enrollmentStats.mediumScore} ({Math.round(enrollmentStats.mediumScore / selectedCount * 100)}%)</div>
                  <div>• Low (&lt;60): {enrollmentStats.lowScore} ({Math.round(enrollmentStats.lowScore / selectedCount * 100)}%)</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">By BANT:</div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>• Qualified: {enrollmentStats.qualified} ({Math.round(enrollmentStats.qualified / selectedCount * 100)}%)</div>
                  <div>• Needs Info: {enrollmentStats.needsInfo} ({Math.round(enrollmentStats.needsInfo / selectedCount * 100)}%)</div>
                  <div>• Not Qualified: {enrollmentStats.notQualified} ({Math.round(enrollmentStats.notQualified / selectedCount * 100)}%)</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div><span className="font-medium">Estimated Sends:</span> {enrollmentStats.totalSends} emails ({selectedCount} leads × {formData.sequence.length} touches)</div>
              <div><span className="font-medium">Estimated Duration:</span> 14 days</div>
              <div><span className="font-medium">Estimated Cost:</span> ${enrollmentStats.estimatedCost} (API credits for personalization)</div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-yellow-800 mb-2">IMPORTANT NOTES</div>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li>• Leads already in active campaigns will be skipped</li>
                  <li>• Leads who unsubscribed will be automatically excluded</li>
                  <li>• You can add more leads after campaign starts</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {enrollmentMethod === 'auto' && (
        <div className="border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-500 mb-4">
            <Zap className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm">Auto-enrollment configuration will be available here</p>
            <p className="text-xs mt-2">Set criteria for automatic lead enrollment</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep5Settings = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">STEP 5: CONFIGURE SETTINGS</h2>
      <p className="text-sm text-gray-600 mb-8">Fine-tune your campaign behavior</p>

      <div className="max-w-2xl space-y-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium text-gray-900">Send Time Optimization</div>
              <div className="text-sm text-gray-500">AI determines best send time for each lead</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.settings.sendTimeOptimization}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, sendTimeOptimization: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium text-gray-900">Timezone Aware</div>
              <div className="text-sm text-gray-500">Send based on recipient's timezone</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.settings.timezoneAware}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, timezoneAware: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium text-gray-900">Business Hours Only</div>
              <div className="text-sm text-gray-500">Send only during business hours (9 AM - 5 PM)</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.settings.businessHoursOnly}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, businessHoursOnly: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Send Limit
          </label>
          <input
            type="number"
            value={formData.settings.dailySendLimit}
            onChange={(e) => setFormData({
              ...formData,
              settings: { ...formData.settings, dailySendLimit: parseInt(e.target.value) || 50 }
            })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Maximum emails to send per day</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium text-gray-900">Stop on Reply</div>
              <div className="text-sm text-gray-500">Pause sequence when lead replies</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.settings.stopOnReply}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, stopOnReply: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium text-gray-900">Stop on Unsubscribe</div>
              <div className="text-sm text-gray-500">Remove lead from sequence if they unsubscribe</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.settings.stopOnUnsubscribe}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, stopOnUnsubscribe: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep6Review = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">STEP 6: REVIEW & LAUNCH</h2>
      <p className="text-sm text-gray-600 mb-8">Review your campaign before launching</p>

      <div className="max-w-3xl space-y-6">
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Campaign Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="ml-2 font-medium">{formData.name || 'Not set'}</span>
            </div>
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2 font-medium capitalize">{formData.type}</span>
            </div>
            <div>
              <span className="text-gray-500">Template:</span>
              <span className="ml-2 font-medium">{formData.template || 'Not selected'}</span>
            </div>
            <div>
              <span className="text-gray-500">Daily Limit:</span>
              <span className="ml-2 font-medium">{formData.settings.dailySendLimit} emails/day</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              console.log('Launching campaign:', formData);
              navigate('/lead-generation/campaigns');
            }}
            className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            🚀 Launch Campaign
          </button>
          <button
            onClick={handleSaveDraft}
            className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            💾 Save as Draft
          </button>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1BasicInfo();
      case 2: return renderStep2Template();
      case 3: return renderStep3Sequence();
      case 4: return renderStep4Leads();
      case 5: return renderStep5Settings();
      case 6: return renderStep6Review();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-8 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/lead-generation/campaigns')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Campaigns
            </button>

            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">📧 CREATE NEW CAMPAIGN</h1>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveDraft}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </button>
                <button
                  onClick={() => navigate('/lead-generation/campaigns')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {renderProgressTracker()}

        {renderCurrentStep()}

        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Navigation</h3>
          <div className="flex items-center justify-between">
            {currentStep === 1 ? (
              <button
                onClick={() => navigate('/lead-generation/campaigns')}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous: {steps[currentStep - 2].label}
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={currentStep === 6}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 6
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {currentStep === 1 ? 'Next: Select Template' :
               currentStep === 2 ? 'Next: Build Sequence' :
               currentStep === 3 ? 'Next: Select Leads' :
               currentStep === 4 ? 'Next: Configure Settings' :
               currentStep === 5 ? 'Next: Review & Launch' :
               'Complete'}
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
