import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';

type CampaignStep = 1 | 2 | 3 | 4 | 5 | 6;

interface CampaignFormData {
  name: string;
  description: string;
  type: 'email' | 'multi-channel' | 'linkedin';
  goal: string;
  template: string;
  sequence: SequenceTouch[];
  leads: string[];
  settings: CampaignSettings;
}

interface SequenceTouch {
  touch: number;
  channel: string;
  delay: number | string;
  subject: string;
  content?: string;
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
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    type: 'email',
    goal: '',
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
    }
  });

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

  const handleTemplateSelect = (templateId: string) => {
    setFormData({ ...formData, template: templateId });
    handleNext();
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

  const renderStep1BasicInfo = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">STEP 1: BASIC INFORMATION</h2>
      <p className="text-sm text-gray-600 mb-8">Tell us about your campaign</p>

      <div className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Q1 2025 Enterprise Outreach"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the purpose and goals of this campaign..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Type *
          </label>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setFormData({ ...formData, type: 'email' })}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                formData.type === 'email'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Mail className={`h-6 w-6 mb-2 ${formData.type === 'email' ? 'text-blue-500' : 'text-gray-400'}`} />
              <div className="font-medium text-sm">Email</div>
              <div className="text-xs text-gray-500">Email-only sequence</div>
            </button>

            <button
              onClick={() => setFormData({ ...formData, type: 'multi-channel' })}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                formData.type === 'multi-channel'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Share2 className={`h-6 w-6 mb-2 ${formData.type === 'multi-channel' ? 'text-blue-500' : 'text-gray-400'}`} />
              <div className="font-medium text-sm">Multi-channel</div>
              <div className="text-xs text-gray-500">Email + LinkedIn + Calls</div>
            </button>

            <button
              onClick={() => setFormData({ ...formData, type: 'linkedin' })}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                formData.type === 'linkedin'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Linkedin className={`h-6 w-6 mb-2 ${formData.type === 'linkedin' ? 'text-blue-500' : 'text-gray-400'}`} />
              <div className="font-medium text-sm">LinkedIn</div>
              <div className="text-xs text-gray-500">LinkedIn-only sequence</div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Goal
          </label>
          <input
            type="text"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            placeholder="e.g., Book 50 demo calls, Generate 200 MQLs"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-blue-900 mb-1">Pro Tip</div>
              <div className="text-sm text-blue-700">
                Clear campaign names and goals help your team understand performance at a glance. Include the quarter, target audience, or primary objective.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2Template = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">STEP 2: SELECT TEMPLATE</h2>
      <p className="text-sm text-gray-600 mb-8">Choose a pre-built template or start from scratch</p>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Recommended Templates
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {campaignTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <div
              key={template.id}
              className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-bold text-gray-900">{template.name}</h3>
              </div>

              <div className="space-y-3 mb-6">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{template.touchCount > 0 ? `${template.touchCount}-touch` : 'Custom'}</span> sequence
                </div>
                <div className="text-sm text-gray-600">{template.channel}</div>

                <div>
                  <div className="text-xs font-medium text-gray-700 mb-2">Perfect for:</div>
                  <ul className="space-y-1">
                    {template.perfectFor.map((item, idx) => (
                      <li key={idx} className="text-xs text-gray-600">• {item}</li>
                    ))}
                  </ul>
                </div>

                {(template.avgOpenRate !== null || template.avgReplyRate !== null) && (
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-2">Avg Performance:</div>
                    {template.avgOpenRate !== null && (
                      <div className="text-xs text-gray-600">📊 {template.avgOpenRate}% open rate</div>
                    )}
                    {template.avgReplyRate !== null && (
                      <div className="text-xs text-gray-600">💬 {template.avgReplyRate}% reply rate</div>
                    )}
                  </div>
                )}

                {template.avgOpenRate === null && template.avgReplyRate === null && (
                  <div className="text-xs text-gray-500 italic">
                    No pre-set performance data
                  </div>
                )}
              </div>

              <button
                onClick={() => handleTemplateSelect(template.id)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
              >
                {template.id === 'custom' ? 'Start from Scratch' : 'Select Template'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <span className="font-medium">Tip:</span> Templates can be customized after selection. Your changes won't affect the template.
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3Sequence = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">STEP 3: BUILD SEQUENCE</h2>
      <p className="text-sm text-gray-600 mb-8">Configure your campaign touches and timing</p>

      <div className="text-center py-20 text-gray-500">
        <Share2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p>Sequence builder will be configured here</p>
        <p className="text-sm mt-2">Based on selected template: {formData.template || 'None'}</p>
      </div>
    </div>
  );

  const renderStep4Leads = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">STEP 4: SELECT LEADS</h2>
      <p className="text-sm text-gray-600 mb-8">Choose which leads to enroll in this campaign</p>

      <div className="text-center py-20 text-gray-500">
        <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p>Lead selection interface will be configured here</p>
      </div>
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
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous: {currentStep > 1 ? steps[currentStep - 2].label : ''}
            </button>

            <button
              onClick={handleNext}
              disabled={currentStep === 6}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 6
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Next: {currentStep < 6 ? steps[currentStep].label : ''}
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
