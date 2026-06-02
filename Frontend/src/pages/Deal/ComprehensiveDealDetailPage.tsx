import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDeal } from '../../utils/dealsApi';
import { ChevronRight } from 'lucide-react';
import { DealHeroSection } from '../../components/Deal/DealHeroSection';
import { AIDealIntelligence } from '../../components/Deal/AIDealIntelligence';
import { DealDetailsPanel } from '../../components/Deal/DealDetailsPanel';
import { DealAccountContacts } from '../../components/Deal/DealAccountContacts';
import { DealActivityTimeline } from '../../components/Deal/DealActivityTimeline';
import { DealNotesFiles } from '../../components/Deal/DealNotesFiles';
import { DealRightSidebar } from '../../components/Deal/DealRightSidebar';
import {
  StageChangeModal,
  UpdateAmountModal,
  AIBestTimeModal,
  FindCEOModal,
  AddContactModal,
  EmailComposerModal,
  CallLogModal,
  MeetingSchedulerModal
} from '../../components/Deal/DealModals';
import { useToast } from '../../contexts/ToastContext';

export const ComprehensiveDealDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [showStageChange, setShowStageChange] = useState(false);
  const [showUpdateAmount, setShowUpdateAmount] = useState(false);
  const [showBestTime, setShowBestTime] = useState(false);
  const [showFindCEO, setShowFindCEO] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showCallLog, setShowCallLog] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);

  const [emailDetails, setEmailDetails] = useState({ to: '', subject: '', body: '' });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Baseline deal shape — overwritten by API data on mount
  const [deal, setDeal] = useState<any>({
    id: id || '1',
    companyName: 'Loading…',
    dealName: 'Loading…',
    amount: 0,
    stage: 'prospecting',
    stageName: 'Prospecting',
    stageNumber: 1,
    totalStages: 6,
    closeDate: '',
    expectedCloseDate: '',
    owner: '',
    ownerId: '',
    createdDate: '',
    accountName: '',
    accountSize: '',
    accountIndustry: '',
    contactName: '',
    contactTitle: '',
    source: '',
    aiScore: 0,
    aiHealth: 'Unknown',
    daysAway: 0,
    probability: 0,
    daysInStage: 0,
    totalDealAge: 0,
    package: '',
    contractTerm: '',
    paymentTerms: '',
    tags: [] as string[],
  });

  useEffect(() => {
    if (!id) { setLoading(false); return; }

    const STAGE_MAP: Record<string, { name: string; number: number }> = {
      prospecting:  { name: 'Prospecting', number: 1 },
      qualified:    { name: 'Qualified',   number: 2 },
      proposal:     { name: 'Proposal',    number: 3 },
      negotiation:  { name: 'Negotiation', number: 4 },
      'closed-won': { name: 'Closed Won',  number: 5 },
      'closed-lost':{ name: 'Closed Lost', number: 6 },
    };

    const fmt = (iso: string) => {
      if (!iso) return '';
      const d = new Date(iso + 'T12:00:00');
      return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    getDeal(id)
      .then(({ data }) => {
        const stage = data.stage || 'prospecting';
        const stageInfo = STAGE_MAP[stage] ?? { name: stage.charAt(0).toUpperCase() + stage.slice(1), number: 1 };
        const closeDateIso: string = data.expected_close_date ?? '';
        const daysAway = closeDateIso
          ? Math.round((new Date(closeDateIso + 'T12:00:00').getTime() - Date.now()) / 86400000)
          : 0;
        const createdIso: string = data.created_at ?? '';
        const totalDealAge = createdIso
          ? Math.round((Date.now() - new Date(createdIso).getTime()) / 86400000)
          : 0;
        const rawTags = data.tags;
        const tags: string[] = Array.isArray(rawTags)
          ? rawTags
          : typeof rawTags === 'string'
            ? rawTags.replace(/[{}"]/g, '').split(',').filter(Boolean)
            : [];

        setDeal({
          id: data.id,
          dealName: data.name || data.title || 'Untitled Deal',
          companyName: data.company_name || '',
          accountName: data.company_name || '',
          amount: Number(data.value) || 0,
          stage,
          stageName: stageInfo.name,
          stageNumber: stageInfo.number,
          totalStages: 6,
          closeDate: fmt(closeDateIso),
          expectedCloseDate: fmt(closeDateIso),
          owner: data.assigned_to || '',
          ownerId: '',
          createdDate: fmt(createdIso.split('T')[0]),
          accountSize: '',
          accountIndustry: '',
          contactName: data.contact_name || '',
          contactTitle: data.contact_title || '',
          source: data.source || '',
          aiScore: 0,
          aiHealth: 'Unknown',
          daysAway,
          probability: Number(data.probability) || 0,
          daysInStage: 0,
          totalDealAge,
          package: data.product || '',
          contractTerm: data.contract_term || '',
          paymentTerms: data.payment_terms || '',
          tags,
        });
      })
      .catch((err) => setFetchError(err.message ?? 'Failed to load deal'))
      .finally(() => setLoading(false));
  }, [id]);

  const aiIntelligenceData = {
    winProbability: 67,
    healthScore: 78,
    insights: {
      positive: [
        { type: 'positive' as const, text: 'Deal size matches typical wins ($45-55K)', impact: '+15%' },
        { type: 'positive' as const, text: 'Stage progression on track (8 days in Proposal)', impact: '+12%' },
        { type: 'positive' as const, text: 'High engagement from contact (92% response rate)', impact: '+20%' },
        { type: 'positive' as const, text: 'Decision maker involved (VP level)', impact: '+10%' }
      ],
      warnings: [
        { type: 'warning' as const, text: 'Competitor mentioned (Salesforce)', impact: '-8%' },
        { type: 'warning' as const, text: 'No activity in 5 days', impact: '-12%' }
      ]
    },
    nextActions: [
      {
        priority: 'high' as const,
        title: 'Follow up today',
        reason: '5 days since last contact (deal at risk)',
        suggestion: 'Hi John, following up on proposal',
        actions: ['Send Email', 'Schedule Call']
      },
      {
        priority: 'medium' as const,
        title: 'Send ROI case study by Nov 20',
        reason: 'John mentioned "need proof" in meeting',
        suggestion: 'SaaS ROI case study - Success rate: 73%',
        actions: ['Send Case Study', 'Schedule']
      },
      {
        priority: 'medium' as const,
        title: 'Schedule demo for stakeholders',
        reason: 'Deal stuck in Proposal for 8 days',
        suggestion: 'Attendees: John Smith, CEO (TBD)',
        actions: ['Schedule Meeting', 'AI Find Best Time']
      },
      {
        priority: 'low' as const,
        title: 'Address Salesforce comparison',
        reason: 'Competitor mentioned 3x in conversations',
        suggestion: 'Talking points: Integration, pricing, support',
        actions: ['View Battle Card', 'Create Task']
      },
      {
        priority: 'low' as const,
        title: 'Request CEO introduction',
        reason: 'Final approval needed (CEO sign-off)',
        suggestion: 'Can you introduce me to your CEO?',
        actions: ['Draft Email', 'Create Task']
      }
    ],
    historicalData: 'Historical data: Similar deals have 72% win rate'
  };

  const stageHistory = [
    { name: 'Prospecting', days: 5, startDate: 'Nov 15', endDate: 'Nov 20', status: 'completed' as const },
    { name: 'Qualified', days: 12, startDate: 'Nov 20', endDate: 'Dec 2', status: 'completed' as const },
    { name: 'Proposal', days: 8, startDate: 'Dec 2', endDate: 'Present', status: 'current' as const },
    { name: 'Negotiation', days: 0, startDate: '', endDate: 'Estimated: 10-15 days', status: 'pending' as const },
    { name: 'Closed-Won', days: 0, startDate: '', endDate: 'Target: March 15, 2026', status: 'pending' as const }
  ];

  const accountData = {
    name: 'Acme Corp',
    industry: 'SaaS, Project Management',
    size: '75 employees',
    revenue: '$12M annually',
    location: 'San Francisco, CA',
    website: 'www.acmecorp.com',
    fundingRound: 'Series B',
    fundingAmount: '$8M',
    fundingDate: 'Sep 2024',
    growthRate: '45% YoY',
    hiringTrend: '+15 employees (Q3 2024)',
    techStack: ['AWS', 'Salesforce', 'Slack', 'HubSpot'],
    competitorMentioned: 'Salesforce'
  };

  const contacts = [
    {
      id: '1',
      name: 'John Smith',
      title: 'VP Sales',
      role: 'Champion' as const,
      email: 'john@acme.com',
      phone: '+1 555-0123',
      lastContact: 'Dec 2',
      daysAgo: 5,
      engagement: '92% response rate',
      status: 'active' as const
    },
    {
      id: '2',
      name: 'CEO Name - TBD',
      title: 'CEO',
      role: 'Decision Maker' as const,
      status: 'pending' as const
    }
  ];

  // Toggle between true/false to demonstrate both HRMS connection states
  const hrmsConnection = {
    hasHistory: true, // Set to true to show HRMS integration value
    opportunity: 'Consider recruiting from them',
    recruitedEmployee: {
      name: 'Sarah Lee',
      title: 'CFO',
      hiredDate: 'Nov 2024',
      status: 'Currently employed'
    }
  };

  const activities = [
    {
      id: '1',
      type: 'email' as const,
      date: 'Dec 2, 2025',
      time: '2:30 PM',
      title: 'Email Sent: Proposal Follow-up',
      to: 'John Smith',
      description: 'Subject: "Acme Corp Proposal - Next Steps"',
      status: '✅ Opened (Dec 2, 4:45 PM)',
      engagement: '3 opens, 6 mins read time',
      user: 'Alex Rodriguez'
    },
    {
      id: '2',
      type: 'stage_change' as const,
      date: 'Dec 2, 2025',
      time: '2:30 PM',
      title: 'Stage Changed: Qualified → Proposal',
      user: 'Alex Rodriguez'
    },
    {
      id: '3',
      type: 'meeting' as const,
      date: 'Nov 28, 2025',
      time: '2:00 PM',
      title: 'Meeting: Acme Corp Product Demo',
      description: 'Duration: 45 minutes\nLocation: Zoom (Recording available)\nAttendees: John Smith (Acme), Alex Rodriguez (Us)',
      hasRecording: true,
      hasTranscript: true,
      aiSummary: {
        keyPoints: [
          'Budget confirmed at $50K',
          'Timeline: Q1 2026 implementation',
          'Main concerns: Integration with Salesforce',
          'Competitor mentioned: Salesforce',
          'Need CEO approval for final decision'
        ],
        sentiment: {
          type: 'positive' as const,
          confidence: 82,
          notes: [
            'Excited about automation features',
            'Some hesitation about switching from SF'
          ]
        },
        actionItems: [
          { task: 'Send proposal (You)', owner: 'You', status: 'completed' as const },
          { task: 'Address integration (You)', owner: 'You', status: 'completed' as const },
          { task: 'CEO approval (John)', owner: 'John', status: 'pending' as const },
          { task: 'Technical demo (You)', owner: 'You', status: 'pending' as const, dueDate: 'Dec 10' }
        ],
        talkingPoints: [
          'Salesforce integration capabilities',
          'ROI calculation (show 240% ROI)',
          'Customer success stories (SaaS)'
        ],
        crmUpdates: [
          'Deal stage: Qualified → Proposal ✅',
          'Deal amount: $50K confirmed ✅',
          'Close date: March 15, 2026 ✅',
          '4 tasks created automatically ✅',
          'Competitor noted: Salesforce ✅'
        ]
      }
    },
    {
      id: '4',
      type: 'email' as const,
      date: 'Nov 25, 2025',
      time: '3:15 PM',
      title: 'Email Sent: Meeting Confirmation',
      description: 'Subject: "Demo scheduled for Nov 28"',
      status: '✅ Opened (Nov 25, 4:20 PM)',
      user: 'Alex Rodriguez'
    },
    {
      id: '5',
      type: 'call' as const,
      date: 'Nov 20, 2025',
      time: '10:30 AM',
      title: 'Call: Discovery Call',
      description: 'Duration: 25 minutes\nNotes: "Interested in automation features. Current pain: Manual data entry. Budget: $50K confirmed."',
      user: 'Alex Rodriguez'
    },
    {
      id: '6',
      type: 'stage_change' as const,
      date: 'Nov 20, 2025',
      time: '10:30 AM',
      title: 'Stage Changed: Prospecting → Qualified',
      user: 'Alex Rodriguez'
    },
    {
      id: '7',
      type: 'deal_created' as const,
      date: 'Nov 15, 2025',
      time: '9:00 AM',
      title: 'Deal Created',
      description: 'Created by: Alex Rodriguez\nSource: Converted from Lead (John Smith)\nInitial Value: $50,000\nInitial Stage: Prospecting\nAI Enrichment: +8 data points added',
      user: 'Alex Rodriguez'
    }
  ];

  const notes = [
    {
      id: '1',
      date: 'Dec 2, 2025',
      author: 'Alex Rodriguez',
      content: 'John seems interested but needs CEO approval. Need to position against Salesforce better. Focus on integration + pricing advantage.'
    },
    {
      id: '2',
      date: 'Nov 28, 2025',
      author: 'Alex Rodriguez',
      content: 'Demo went well. John is champion but CEO is final decision maker. Must get intro to CEO.'
    }
  ];

  const files = [
    { id: '1', name: 'Proposal_Acme_v2.pdf', size: '2.3 MB', date: 'Dec 2', type: 'pdf' as const },
    { id: '2', name: 'ROI_Case_Study_SaaS.pdf', size: '1.8 MB', date: 'Nov 28', type: 'pdf' as const },
    { id: '3', name: 'Integration_Guide.pdf', size: '950 KB', date: 'Dec 2', type: 'pdf' as const }
  ];

  const sidebarData = {
    dealScore: {
      overall: 78,
      breakdown: [
        { category: 'Engagement', score: 88, stars: 5 },
        { category: 'Deal Fit', score: 85, stars: 5 },
        { category: 'Progression', score: 72, stars: 4 },
        { category: 'Urgency', score: 65, stars: 3 }
      ],
      factors: [
        { text: 'High contact engagement', impact: 20 },
        { text: 'Budget confirmed', impact: 15 },
        { text: 'Decision maker involved', impact: 10 },
        { text: 'On-track stage progression', impact: 8 },
        { text: 'Stalled 5 days', impact: -12 },
        { text: 'Competitor risk', impact: -8 }
      ]
    },
    predictive: {
      winProbability: 67,
      expectedCloseDate: 'March 12, 2026',
      closeDateConfidence: 78,
      daysEarlier: 3,
      dealSizeConfidence: 85,
      predictedRange: '$48K - $52K range',
      currentAmount: 50000,
      riskLevel: 'medium' as const,
      primaryRisk: 'Competitor (Salesforce)',
      mitigation: 'Address in next meeting',
      churnRisk: 12,
      churnReason: 'Strong fit, high engagement',
      upsellOpportunity: 'medium' as const,
      upsellPotential: '+$25K (Premium features)',
      upsellTiming: 'After 6 months',
      recommendation: 'Focus on competitive differentiation and securing CEO meeting to increase win probability from 67% to 82%.'
    },
    similarDeals: [
      {
        id: 'deal-2',
        name: 'TechStart Inc - Growth Plan',
        similarity: 89,
        status: 'Negotiation',
        amount: 42000,
        winProbability: 85
      },
      {
        id: 'deal-3',
        name: 'StartCo - Basic Package',
        similarity: 82,
        status: 'Closed-Won',
        amount: 28000,
        timeline: '38 days (fast!)'
      },
      {
        id: 'deal-4',
        name: 'BigCo - Platform',
        similarity: 78,
        status: 'Proposal',
        challenge: 'Competitor risk'
      }
    ],
    similarInsights: {
      avgCloseTime: 42,
      currentDays: 32,
      avgDealSize: '$45K',
      currentDealSize: '$50K',
      commonObjection: 'Integration complexity',
      successFactor: 'Strong ROI demonstration',
      winStrategy: 'Focus on ease of migration'
    },
    metrics: {
      dealAge: 32,
      timeInStage: 8,
      avgStageDuration: 12,
      daysToClose: 45,
      meetings: 1,
      emailsSent: 3,
      emailsOpened: 3,
      calls: 1,
      lastActivityDays: 5,
      responseRate: 92,
      avgResponseTime: '2 hours',
      quarterlyForecast: 50000,
      weightedValue: 33500,
      quotaContribution: 4.2
    },
    dataSources: {
      createdFrom: ['Lead Gen (Apollo.io)', 'Lead: John Smith (Converted Nov 15)', 'Contact: John Smith', 'Account: Acme Corp'],
      enrichedFrom: ['Clearbit (Company data)', 'LinkedIn (Contact profile)', 'Salesforce (Tech stack)'],
      lastEnriched: '2 days ago',
      accuracy: 94
    }
  };

  const handleMoreAction = (action: string) => {
    switch (action) {
      case 'clone':
        showToast('Deal cloned successfully', 'success');
        break;
      case 'change-owner':
        showToast('Change owner dialog would open', 'info');
        break;
      case 'change-stage':
        setShowStageChange(true);
        break;
      case 'mark-won':
        showToast('Deal marked as won!', 'success');
        break;
      case 'mark-lost':
        showToast('Deal marked as lost', 'info');
        break;
      case 'archive':
        showToast('Deal archived', 'info');
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this deal?')) {
          showToast('Deal deleted', 'success');
          navigate('/crm/deals');
        }
        break;
      case 'export-pdf':
        showToast('Exporting deal as PDF...', 'success');
        break;
      case 'share':
        showToast('Share link copied to clipboard', 'success');
        break;
    }
  };

  const handleStageChange = () => {
    showToast('Deal moved to Negotiation stage', 'success');
  };

  const handleUpdateAmount = (newAmount: number, reason: string) => {
    showToast(`Deal amount updated to $${newAmount.toLocaleString()}`, 'success');
  };

  const handleSendEmail = (to: string, subject: string, body: string) => {
    setEmailDetails({ to, subject, body });
    setShowEmailComposer(true);
  };

  const handleScheduleMeeting = (details: any) => {
    showToast('Meeting scheduled successfully', 'success');
  };

  const handleAddCEO = (contact: any) => {
    showToast(`${contact.name} added to deal contacts`, 'success');
  };

  const handleAddContact = (contactId: string, role: string) => {
    showToast(`Contact added as ${role}`, 'success');
  };

  const handleViewAccount = () => {
    navigate(`/crm/accounts/${accountData.name.toLowerCase().replace(/\s+/g, '-')}`);
  };

  const handleAddToHRMS = () => {
    showToast('✅ Added to HRMS recruitment targets', 'success');
    setTimeout(() => {
      navigate('/hrms');
    }, 1500);
  };

  const handleRequestIntro = () => {
    setEmailDetails({
      to: 'john@acme.com',
      subject: 'Introduction to CEO',
      body: 'Hi John,\n\nWould you be able to introduce me to your CEO for final approval discussion?\n\nBest regards,'
    });
    setShowEmailComposer(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3" />
      Loading deal…
    </div>
  );

  if (fetchError) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-red-600 font-medium mb-2">Could not load deal</p>
      <p className="text-sm text-gray-500 mb-4">{fetchError}</p>
      <button onClick={() => navigate('/crm/deals')} className="text-blue-600 text-sm hover:underline">← Back to Deals</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 -mt-6">
      {/* sticky top-14 sticks at 56px (TopBar h-14) from viewport; -mt-6 on parent cancels main's p-6 padding */}
      <div className="sticky top-14 z-50 bg-white border-b border-gray-200 -mx-6 px-8 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => navigate('/crm/deals')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium shrink-0"
            >
              ← Deals
            </button>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-semibold text-gray-900 truncate">{deal.dealName}</h1>
          </div>
          <button
            onClick={() => navigate(`/crm/deals/${id}/edit`)}
            className="shrink-0 px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <DealHeroSection
        deal={deal}
        onEdit={() => navigate(`/crm/deals/${id}/edit`)}
        onMoreAction={handleMoreAction}
        onEmail={() => handleSendEmail('john@acme.com', 'Following up on proposal', '')}
        onCall={() => setShowCallLog(true)}
        onMeeting={() => setShowMeetingScheduler(true)}
        onMoveStage={() => setShowStageChange(true)}
        onUpdateAmount={() => setShowUpdateAmount(true)}
      />

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (65% width) */}
          <div className="lg:col-span-2 space-y-6">
            <AIDealIntelligence
              {...aiIntelligenceData}
              onSendEmail={handleSendEmail}
              onScheduleCall={() => setShowCallLog(true)}
              onScheduleMeeting={() => setShowMeetingScheduler(true)}
              onFindBestTime={() => setShowBestTime(true)}
            />
            <DealDetailsPanel deal={deal} stageHistory={stageHistory} />
            <DealAccountContacts
              account={accountData}
              contacts={contacts}
              hrmsConnection={hrmsConnection}
              onViewAccount={handleViewAccount}
              onAddToHRMS={handleAddToHRMS}
              onFindCEO={() => setShowFindCEO(true)}
              onRequestIntro={handleRequestIntro}
              onAddContact={() => setShowAddContact(true)}
            />
            <DealActivityTimeline
              activities={activities}
              daysSinceLastContact={5}
            />
            <DealNotesFiles notes={notes} files={files} />
          </div>

          {/* Right Sidebar (35% width) */}
          <div className="lg:col-span-1">
            <DealRightSidebar {...sidebarData} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <StageChangeModal
        isOpen={showStageChange}
        onClose={() => setShowStageChange(false)}
        currentStage="Proposal"
        nextStage="Negotiation"
        onConfirm={handleStageChange}
      />

      <UpdateAmountModal
        isOpen={showUpdateAmount}
        onClose={() => setShowUpdateAmount(false)}
        currentAmount={deal.amount}
        onUpdate={handleUpdateAmount}
      />

      <AIBestTimeModal
        isOpen={showBestTime}
        onClose={() => setShowBestTime(false)}
        contactName="John Smith"
        onSelectTime={(time) => {
          showToast(`Meeting time selected: ${time}`, 'success');
          setShowMeetingScheduler(true);
        }}
      />

      <FindCEOModal
        isOpen={showFindCEO}
        onClose={() => setShowFindCEO(false)}
        onAddContact={handleAddCEO}
      />

      <AddContactModal
        isOpen={showAddContact}
        onClose={() => setShowAddContact(false)}
        onAddContact={handleAddContact}
      />

      <EmailComposerModal
        isOpen={showEmailComposer}
        onClose={() => setShowEmailComposer(false)}
        to={emailDetails.to}
        subject={emailDetails.subject}
        body={emailDetails.body}
      />

      <CallLogModal
        isOpen={showCallLog}
        onClose={() => setShowCallLog(false)}
        contactName="John Smith"
      />

      <MeetingSchedulerModal
        isOpen={showMeetingScheduler}
        onClose={() => setShowMeetingScheduler(false)}
        attendees={['John Smith', 'Alex Rodriguez']}
        onSchedule={handleScheduleMeeting}
      />
    </div>
  );
};

export default ComprehensiveDealDetailPage;
