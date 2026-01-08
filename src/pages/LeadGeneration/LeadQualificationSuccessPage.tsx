import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Mail,
  Calendar,
  FileText,
  Sparkles,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  User,
  Building2,
  Lightbulb
} from 'lucide-react';

interface OpportunityDetails {
  opportunityId: string;
  opportunityName: string;
  amount: number;
  closeDate: string;
  stage: string;
  probability: number;
  owner: string;
  type: string;
}

interface NextStep {
  title: string;
  date: string;
  description: string;
  actions: Array<{ label: string; primary?: boolean }>;
}

const LeadQualificationSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);

  const leadData = {
    name: 'Sarah Lee',
    title: 'Chief Financial Officer',
    company: 'TechStart Inc',
    status: 'Qualified',
    aiScore: 92,
    bantScore: 20,
    maxBantScore: 20,
    source: 'hrms'
  };

  const opportunityDetails: OpportunityDetails = {
    opportunityId: 'OPP-2025-00142',
    opportunityName: 'TechStart Inc - CFO',
    amount: 75000,
    closeDate: 'Feb 15, 2025',
    stage: 'Discovery',
    probability: 40,
    owner: 'John Smith (Senior AE)',
    type: 'New Business'
  };

  const syncedActions = [
    { icon: CheckCircle, text: 'Lead status updated to "Qualified"', color: 'text-emerald-600' },
    { icon: CheckCircle, text: `CRM opportunity created (${opportunityDetails.opportunityId})`, color: 'text-emerald-600' },
    { icon: CheckCircle, text: 'Contact & company data synced (13 fields)', color: 'text-emerald-600' },
    { icon: CheckCircle, text: 'BANT assessment synced to CRM', color: 'text-emerald-600' },
    { icon: CheckCircle, text: 'Enrichment data synced (20 fields)', color: 'text-emerald-600' },
    { icon: CheckCircle, text: 'Qualification notes added to CRM', color: 'text-emerald-600' },
    { icon: CheckCircle, text: 'Email sent to John Smith', color: 'text-emerald-600' },
    { icon: CheckCircle, text: 'Calendar reminder created (Jan 15 demo)', color: 'text-emerald-600' }
  ];

  const nextSteps: NextStep[] = [
    {
      title: 'Demo Scheduled',
      date: 'Jan 15, 2025 at 2:00 PM',
      description: 'with Sarah Lee & technical team',
      actions: [
        { label: 'Add to Calendar', primary: true },
        { label: 'Send Invite' }
      ]
    },
    {
      title: 'Proposal Deadline',
      date: 'Jan 30, 2025',
      description: 'Custom proposal with $75K pricing',
      actions: [
        { label: 'Start Proposal', primary: true },
        { label: 'View Template' }
      ]
    },
    {
      title: 'Decision Meeting',
      date: 'Feb 10, 2025',
      description: 'Final presentation to CFO + CEO',
      actions: [
        { label: 'Schedule Meeting', primary: true }
      ]
    },
    {
      title: 'Target Close',
      date: 'Feb 15, 2025',
      description: 'Contract signing & onboarding kickoff',
      actions: []
    }
  ];

  const notification = {
    to: 'john.smith@company.com',
    subject: 'New Qualified Lead - Sarah Lee (TechStart)',
    sentAt: 'Jan 6, 2025 2:30 PM',
    preview: 'Hi John, A new high-value lead has been qualified and assigned to you. Sarah Lee (CFO at TechStart Inc) has a BANT score of 20/20 with confirmed budget of $75K. Demo scheduled for Jan 15...'
  };

  useEffect(() => {
    if (autoRedirect && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (autoRedirect && countdown === 0) {
      navigate('/lead-generation/leads');
    }
  }, [countdown, autoRedirect, navigate]);

  const handleCancelAutoRedirect = () => {
    setAutoRedirect(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-gray-600';
  };

  const getScoreBarFill = (score: number) => {
    return Math.round((score / 100) * 10);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SUCCESS!</h1>
          <p className="text-xl text-gray-600">Lead Qualified & Synced to CRM</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {leadData.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{leadData.name}</h2>
              <p className="text-gray-600">{leadData.title} @ {leadData.company}</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">Status: Qualified</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    AI Score: <span className={`${getScoreColor(leadData.aiScore)} font-bold`}>{leadData.aiScore}/100</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-6 rounded-sm ${
                          i < getScoreBarFill(leadData.aiScore) ? 'bg-emerald-600' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    BANT Score: <span className="text-emerald-600 font-bold">{leadData.bantScore}/{leadData.maxBantScore}</span> (Perfect)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">CRM OPPORTUNITY CREATED</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Opportunity ID</p>
              <p className="font-semibold text-gray-900">{opportunityDetails.opportunityId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Opportunity Name</p>
              <p className="font-semibold text-gray-900">{opportunityDetails.opportunityName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-semibold text-gray-900">${opportunityDetails.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Close Date</p>
              <p className="font-semibold text-gray-900">{opportunityDetails.closeDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stage</p>
              <p className="font-semibold text-gray-900">{opportunityDetails.stage}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Probability</p>
              <p className="font-semibold text-gray-900">{opportunityDetails.probability}%</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Owner</p>
              <p className="font-semibold text-gray-900">{opportunityDetails.owner}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <ExternalLink className="h-4 w-4" />
            View in CRM
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">WHAT HAPPENED</h3>
          </div>
          <div className="space-y-2">
            {syncedActions.map((action, index) => (
              <div key={index} className="flex items-start gap-3">
                <action.icon className={`h-5 w-5 ${action.color} flex-shrink-0 mt-0.5`} />
                <span className="text-sm text-gray-700">{action.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">NEXT STEPS</h3>
          </div>
          <div className="space-y-4">
            {nextSteps.map((step, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{index + 1}. {step.title}</h4>
                    <p className="text-sm text-blue-600 font-medium">{step.date}</p>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
                {step.actions.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {step.actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                          action.primary
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">NOTIFICATION SENT</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-600 w-20">To:</span>
              <span className="text-sm text-gray-900">{notification.to}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-600 w-20">Subject:</span>
              <span className="text-sm text-gray-900">{notification.subject}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-600 w-20">Sent:</span>
              <span className="text-sm text-gray-900">{notification.sentAt}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 font-medium mb-2">Preview:</p>
            <p className="text-sm text-gray-700">{notification.preview}</p>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View Full Email →
          </button>
        </div>

        {leadData.source === 'hrms' && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 p-6 mb-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">PRO TIP</h3>
                <p className="text-sm text-gray-700">
                  This was a warm HRMS lead with 33% higher conversion rate. Make sure to mention your company's
                  existing relationship through the recruitment placement when reaching out.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate('/lead-generation/leads')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lead List
          </button>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              <ExternalLink className="h-4 w-4" />
              View in CRM
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
              <Mail className="h-4 w-4" />
              Contact Lead
            </button>
          </div>
        </div>

        {autoRedirect && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Redirecting to Lead List in {countdown} seconds...{' '}
              <button
                onClick={handleCancelAutoRedirect}
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Cancel Auto-redirect
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadQualificationSuccessPage;
