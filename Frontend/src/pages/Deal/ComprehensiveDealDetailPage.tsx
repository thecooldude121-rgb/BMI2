import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDeal, updateDeal } from '../../utils/dealsApi';
import { formatDisplayDate, daysFromNow } from '../../utils/dateUtils';
import { calculateDealHealthScore } from '../../utils/dealHealthScore';
import { DealHealthScorePanel } from '../../components/Deal/DealForm/DealHealthScorePanel';
import { ChevronRight, X, Keyboard } from 'lucide-react';
import { DealHeroSection } from '../../components/Deal/DealHeroSection';
import { AIDealIntelligence } from '../../components/Deal/AIDealIntelligence';
import { DealDetailsPanel } from '../../components/Deal/DealDetailsPanel';
import { DealAccountContacts } from '../../components/Deal/DealAccountContacts';
import { BuyingCommitteeMap } from '../../components/Deal/BuyingCommitteeMap';
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
import { useAuth } from '../../contexts/AuthContext';
import type { DealValueHistoryEntry } from '../../types/dealManagement';
import { computeMomentum } from '../../utils/dealMomentum';
import type { MomentumInput } from '../../utils/dealMomentum';
import type { RevenueSchedule } from '../../components/Deal/RevenueTimeline';

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'ai-insights', label: 'AI Insights' },
  { id: 'people',      label: 'People' },
  { id: 'timeline',    label: 'Timeline' },
  { id: 'deal-info',   label: 'Deal Info' },
  { id: 'files-notes', label: 'Files & Notes' },
] as const;

export const ComprehensiveDealDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [showStageChange, setShowStageChange] = useState(false);
  const [showUpdateAmount, setShowUpdateAmount] = useState(false);
  const [showBestTime, setShowBestTime] = useState(false);
  const [showFindCEO, setShowFindCEO] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showCallLog, setShowCallLog] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [preSelectedContactRole, setPreSelectedContactRole] = useState('');
  const [expandedBattleCard, setExpandedBattleCard] = useState<string | null>(null);
  const [savedRevenueSchedule, setSavedRevenueSchedule] = useState<RevenueSchedule | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const isAdmin = true; // hardcoded until role-based access is wired
  const battleCardRef = useRef<HTMLDivElement>(null);
  const revenueTimelineRef = useRef<HTMLDivElement>(null);
  const overviewRef    = useRef<HTMLDivElement>(null);
  const aiInsightsRef  = useRef<HTMLDivElement>(null);
  const peopleRef      = useRef<HTMLDivElement>(null);
  const timelineRef    = useRef<HTMLDivElement>(null);
  const dealInfoRef    = useRef<HTMLDivElement>(null);
  const filesNotesRef  = useRef<HTMLDivElement>(null);

  const [emailDetails, setEmailDetails] = useState({ to: '', subject: '', body: '' });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Baseline deal shape — overwritten by API data on mount
  const [deal, setDeal] = useState<any>({
    id: id || '1',
    companyName: 'Loading…',
    dealName: 'Loading…',
    amount: 0,
    currency: 'USD',
    base_amount_usd: 0,
    stage: 'prospecting',
    stageName: 'Prospecting',
    stageNumber: 1,
    totalStages: 6,
    closeDate: '',
    expectedCloseDate: '',
    owner: '',
    ownerId: '',
    ownerInfo: undefined as any,
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
    winProbAI: 0,
    winProbOverrideReason: '',
    daysInStage: 0,
    totalDealAge: 0,
    package: '',
    contractTerm: '',
    paymentTerms: '',
    tags: [] as string[],
    nextStep: '',
    description: '',
    dealType: '',
    stakeholders: [] as any[],
    dealValueHistory: [] as DealValueHistoryEntry[],
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

    getDeal(id)
      .then(({ data }) => {
        const stage = data.stage || 'prospecting';
        const stageInfo = STAGE_MAP[stage] ?? { name: stage.charAt(0).toUpperCase() + stage.slice(1), number: 1 };
        const closeDateIso: string = data.expected_close_date ?? '';
        const daysAway = daysFromNow(closeDateIso);
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
          currency: data.currency || 'USD',
          base_amount_usd: Number(data.base_amount_usd) || 0,
          stage,
          stageName: stageInfo.name,
          stageNumber: stageInfo.number,
          totalStages: 6,
          closeDate: formatDisplayDate(closeDateIso),
          expectedCloseDate: formatDisplayDate(closeDateIso),
          owner: data.assigned_to || '',
          ownerId: data.owner_id || '',
          ownerInfo: {
            id: data.owner_id || undefined,
            name: data.assigned_to || '',
            email: data.owner_email || undefined,
            lastActiveAt: data.owner_last_active_at || undefined,
            outOfOffice: data.owner_out_of_office ? Boolean(data.owner_out_of_office) : undefined,
          },
          createdDate: formatDisplayDate(createdIso.split('T')[0]),
          accountSize: '',
          accountIndustry: '',
          contactName: data.contact_name || '',
          contactTitle: data.contact_title || '',
          source: data.source || '',
          aiScore: 0,
          aiHealth: 'Unknown',
          daysAway,
          probability: Number(data.probability) || 0,
          winProbAI: Number(data.win_prob_ai) || Number(data.probability) || 0,
          winProbOverrideReason: data.win_prob_override_reason || '',
          daysInStage: 0,
          totalDealAge,
          package: data.product || '',
          contractTerm: data.contract_term || '',
          paymentTerms: data.payment_terms || '',
          tags,
          nextStep: data.next_step || '',
          description: data.description || '',
          dealType: data.deal_type || '',
          stakeholders: Array.isArray(data.stakeholders) ? data.stakeholders : [],
          dealValueHistory: Array.isArray(data.value_history) ? data.value_history : [],
        });
      })
      .catch((err) => setFetchError(err.message ?? 'Failed to load deal'))
      .finally(() => setLoading(false));
  }, [id]);

  // Map loaded deal → formData shape expected by calculateDealHealthScore.
  // contactTitle is stored as the CRM role ID (champion, decision-maker, etc.)
  // because buildPayload sends contactRole as contact_title to the backend.
  const healthFormData = useMemo(() => ({
    dealName: deal.dealName,
    dealValue: String(deal.amount),
    closeDate: deal.closeDate,
    accountName: deal.accountName,
    primaryContactName: deal.contactName,
    contactRole: deal.contactTitle,
    additionalContacts: deal.stakeholders.filter((s: any) => !s.isPrimary),
    nextSteps: deal.nextStep,
    product: deal.package,
    source: deal.source,
    description: deal.description,
    dealType: deal.dealType,
  }), [deal]);

  const healthResult = useMemo(() => calculateDealHealthScore(healthFormData), [healthFormData]);

  // Demo Accelerating — replace these values to show Decelerating:
  // responseTimesHours:[12,24,48], daysSinceLastTwoWay:6, newStakeholdersLast14Days:0,
  // stageDaysVsBenchmark:5, stageBenchmark:12, activitiesLast7Days:1, activitiesPrior7Days:4
  const momentumInput: MomentumInput = {
    responseTimesHours:       [48, 24, 12],
    daysSinceLastTwoWay:      2,
    newStakeholdersLast14Days: 1,
    stageDaysVsBenchmark:     -3,
    stageBenchmark:           12,
    activitiesLast7Days:      4,
    activitiesPrior7Days:     2,
  };

  const momentumResult = useMemo(() => computeMomentum(momentumInput), []);

  // Revenue schedule seed data — branched by deal ID
  // TODO: replace with API field once revenueSchedule is persisted in the DB
  const seedRevenueSchedule = useMemo((): RevenueSchedule | null => {
    if (id === 'D036') {
      return {
        type: 'milestone',
        currency: 'USD',
        totalValue: 50000,
        installments: [
          { label: 'Contract Signing',       amount: 15000, dueDate: '1 Jun 2026',  status: 'paid'     },
          { label: 'Implementation Kickoff', amount: 20000, dueDate: '30 Jun 2026', status: 'upcoming' },
          { label: 'Go-Live',                amount: 15000, dueDate: '15 Aug 2026', status: 'upcoming' },
        ],
      };
    }
    if (id === 'D029') {
      return {
        type: 'recurring',
        currency: 'USD',
        totalValue: 15000,
        installments: [
          { label: 'Month 1', amount: 5000, dueDate: 'Jan 2025', status: 'overdue'  },
          { label: 'Month 2', amount: 5000, dueDate: 'Feb 2025', status: 'overdue'  },
          { label: 'Month 3', amount: 5000, dueDate: 'Mar 2025', status: 'upcoming' },
        ],
      };
    }
    return null;
  }, [id]);

  const activeRevenueSchedule = savedRevenueSchedule ?? seedRevenueSchedule;

  const handleViewRevenue = () => {
    setTimeout(() => {
      revenueTimelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Silently persist computed momentum_score to the DB
  useEffect(() => {
    if (!id) return;
    updateDeal(id, { momentum_score: momentumResult.level }).catch(() => {});
  }, [id, momentumResult.level]);

  // Global keyboard shortcuts — fires when focus is NOT in an input/textarea/select
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case 'e':
          handleSendEmail('john@acme.com', 'Following up on proposal', '');
          break;
        case 'c':
          setShowCallLog(true);
          break;
        case 'm':
          setShowMeetingScheduler(true);
          break;
        case 'p':
          showToast('Proposal creator coming soon', 'info');
          break;
        case 's':
          if (deal.stageNumber < deal.totalStages) setShowStageChange(true);
          break;
        case 'u':
          setShowUpdateAmount(true);
          break;
        case '?':
          setShowShortcuts(true);
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deal.stageNumber, deal.totalStages]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {
      'ai-insights': aiInsightsRef,
      'people':      peopleRef,
      'timeline':    timelineRef,
      'deal-info':   dealInfoRef,
      'files-notes': filesNotesRef,
    };
    setTimeout(() => {
      refMap[tabId]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Scrollspy — update activeTab as the user scrolls
  useEffect(() => {
    const sectionRefs: [string, React.RefObject<HTMLDivElement>][] = [
      ['ai-insights', aiInsightsRef],
      ['people',      peopleRef],
      ['timeline',    timelineRef],
      ['deal-info',   dealInfoRef],
      ['files-notes', filesNotesRef],
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const match = sectionRefs.find(([, ref]) => ref.current === entry.target);
            if (match) setActiveTab(match[0]);
          }
        }
      },
      { rootMargin: '-10% 0px -85% 0px', threshold: 0 },
    );
    sectionRefs.forEach(([, ref]) => {
      if (ref.current) observer.observe(ref.current);
    });
    return () => observer.disconnect();
  }, []);

  const aiIntelligenceData = {
    winProbability: deal.probability || 67,
    winProbAI: deal.winProbAI || deal.probability || 67,
    winProbConfidence: 78,
    winProbOverrideReason: deal.winProbOverrideReason || '',
    healthScore: healthResult.score,
    scoreBreakdown: [
      { category: 'Engagement',  score: 88, stars: 4 },
      { category: 'Deal Fit',    score: 85, stars: 4 },
      { category: 'Progression', score: 72, stars: 4 },
      { category: 'Urgency',     score: 65, stars: 3 },
    ],
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
        actions: ['View Battle Card', 'Create Task'],
        competitor: 'Salesforce'
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
    { name: 'Prospecting', days: 5,  startDate: 'Nov 15', endDate: 'Nov 20', status: 'completed' as const, benchmark: 7 },
    { name: 'Qualified',   days: 12, startDate: 'Nov 20', endDate: 'Dec 2',  status: 'completed' as const, benchmark: 10 },
    { name: 'Proposal',    days: 8,  startDate: 'Dec 2',  endDate: '',        status: 'current'   as const, benchmark: 12 },
    { name: 'Negotiation', days: 0,  startDate: '',        endDate: '',        status: 'pending'   as const, benchmark: 12, benchmarkMin: 10, benchmarkMax: 15 },
    { name: 'Closed-Won',  days: 0,  startDate: '',        endDate: '',        status: 'pending'   as const, benchmark: 5,  benchmarkMin: 3,  benchmarkMax: 7  },
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
    competitors: ['Salesforce', 'HubSpot']
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
      status: 'active' as const,
      // newest-first: 4h, 6h, 12h, 18h — Warming ↑ (avg(4,6)=5 vs avg(12,18)=15, ratio 0.33 < 0.8)
      // silence alert fires: daysAgo=5 ≥ 5 AND avg(4,6,12,18)=10h < 48h
      engagementDots: [4, 6, 12, 18] as (number | null)[],
      engagementBreakdown: {
        emailsSent: 8,
        emailsOpened: 7,
        emailsReplied: 6,
        callsMade: 3,
        callsAnswered: 2,
        meetingsScheduled: 2,
        meetingsAttended: 2,
      },
    },
    {
      id: '2',
      name: 'CEO Name - TBD',
      title: 'CEO',
      role: 'Decision Maker' as const,
      status: 'pending' as const,
    },
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
      user: 'Alex Rodriguez',
      contactId: '1',
      isoDate: '2026-06-04',
    },
    {
      id: '2',
      type: 'stage_change' as const,
      date: 'Dec 2, 2025',
      time: '2:30 PM',
      title: 'Stage Changed: Qualified → Proposal',
      user: 'Alex Rodriguez',
      contactId: null,
      isoDate: '2026-06-04',
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
      contactId: '1',
      isoDate: '2026-05-21',
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
      user: 'Alex Rodriguez',
      contactId: '1',
      isoDate: '2026-05-14',
    },
    {
      id: '5',
      type: 'call' as const,
      date: 'Nov 20, 2025',
      time: '10:30 AM',
      title: 'Call: Discovery Call',
      description: 'Duration: 25 minutes\nNotes: "Interested in automation features. Current pain: Manual data entry. Budget: $50K confirmed."',
      user: 'Alex Rodriguez',
      contactId: '1',
      isoDate: '2026-04-29',
    },
    {
      id: '6',
      type: 'stage_change' as const,
      date: 'Nov 20, 2025',
      time: '10:30 AM',
      title: 'Stage Changed: Prospecting → Qualified',
      user: 'Alex Rodriguez',
      contactId: null,
      isoDate: '2026-04-22',
    },
    {
      id: '7',
      type: 'deal_created' as const,
      date: 'Nov 15, 2025',
      time: '9:00 AM',
      title: 'Deal Created',
      description: 'Created by: Alex Rodriguez\nSource: Converted from Lead (John Smith)\nInitial Value: $50,000\nInitial Stage: Prospecting\nAI Enrichment: +8 data points added',
      user: 'Alex Rodriguez',
      contactId: null,
      isoDate: '2026-04-15',
    },
    // Additional activities to make heatmap patterns meaningful
    {
      id: '8',
      type: 'email' as const,
      date: 'Nov 30, 2025',
      time: '11:00 AM',
      title: 'Email Sent: ROI Case Study',
      to: 'John Smith',
      description: 'Subject: "SaaS ROI Case Study — 240% avg. return"',
      status: '✅ Opened (Nov 30, 2:15 PM)',
      user: 'Alex Rodriguez',
      contactId: '1',
      isoDate: '2026-05-28',
    },
    {
      id: '9',
      type: 'email' as const,
      date: 'Dec 1, 2025',
      time: '10:00 AM',
      title: 'Email Sent: CEO Introduction Request',
      to: 'John Smith',
      description: 'Subject: "Introduction to your CEO for final approval discussion"',
      user: 'Alex Rodriguez',
      contactId: '2',
      isoDate: '2026-06-01',
    },
    {
      id: '10',
      type: 'call' as const,
      date: 'Nov 22, 2025',
      time: '2:00 PM',
      title: 'Call: Post-Demo Follow-up',
      description: 'Duration: 15 minutes\nNotes: "John confirmed interest. Waiting on CEO calendar."',
      user: 'Alex Rodriguez',
      contactId: '1',
      isoDate: '2026-05-07',
    },
  ];

  const notes = [
    {
      id: '1',
      date: 'Dec 2, 2025',
      author: 'Alex Rodriguez',
      tags: ['Competitor', 'Stakeholder'],
      content: 'John seems interested but needs CEO approval.\n- Need to position against **Salesforce** more aggressively — this is their incumbent\n- Focus on **integration capabilities** first, then pricing\n- *Budget confirmed at $50K* — no flexibility issue\n@Alex to prep competitive battle card by EOW',
    },
    {
      id: '2',
      date: 'Nov 28, 2025',
      author: 'Alex Rodriguez',
      tags: ['Stakeholder', 'Follow-up'],
      content: 'Demo went *very well*. **John Smith** is our champion but CEO is the final DM.\n- Must get intro to CEO ASAP — deal cannot progress without it\n- Q1 2026 implementation deadline is firm on their side\n@Alex to send intro request email to John by end of this week',
    },
  ];

  const files = [
    {
      id: 'f1',
      name: 'Proposal_Acme_v2.pdf',
      size: '2.3 MB',
      date: 'Dec 2',
      uploadedBy: 'Alex Rodriguez',
      version: 2,
      isLatest: true,
      isSuperseded: false,
      baseId: 'proposal-acme',
      isSharedWithBuyer: true,
      buyerOpenedAt: 'Dec 5, 2025',
      shareLink: 'https://bmi.app/share/abc123',
    },
    {
      id: 'f1-v1',
      name: 'Proposal_Acme_v1.pdf',
      size: '2.1 MB',
      date: 'Nov 28',
      uploadedBy: 'Alex Rodriguez',
      version: 1,
      isLatest: false,
      isSuperseded: true,
      baseId: 'proposal-acme',
      isSharedWithBuyer: false,
    },
    {
      id: 'f2',
      name: 'ROI_Case_Study_SaaS.pdf',
      size: '1.8 MB',
      date: 'Nov 28',
      uploadedBy: 'Alex Rodriguez',
      version: 1,
      isLatest: true,
      isSuperseded: false,
      baseId: 'roi-case-study',
      isSharedWithBuyer: false,
    },
    {
      id: 'f3',
      name: 'Integration_Guide.pdf',
      size: '950 KB',
      date: 'Dec 2',
      uploadedBy: 'Sarah Lee',
      version: 1,
      isLatest: true,
      isSuperseded: false,
      baseId: 'integration-guide',
      isSharedWithBuyer: false,
    },
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
      case 'merge':
        showToast('Merge Deal feature coming soon', 'info');
        break;
      case 'change-owner':
        showToast('Use the "Assign Owner" button on the owner card', 'info');
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

  const handleAssignOwner = async (ownerName: string) => {
    setDeal((prev: any) => ({
      ...prev,
      owner: ownerName,
      ownerInfo: { ...(prev.ownerInfo || {}), name: ownerName },
    }));
    try {
      if (id) await updateDeal(id, { assigned_to: ownerName });
      showToast(`Owner assigned to ${ownerName}`, 'success');
    } catch {
      showToast('Failed to save owner assignment', 'error');
    }
  };

  const handleStageChange = () => {
    showToast('Deal moved to Negotiation stage', 'success');
  };

  const handleUpdateAmount = async (newAmount: number, reason: string) => {
    if (!id) return;
    const changedBy = user?.name || 'You';
    const historyEntry: DealValueHistoryEntry = {
      previousValue: deal.amount,
      newValue: newAmount,
      changedAt: new Date().toISOString(),
      changedBy,
      reason: reason || undefined,
    };
    const previousAmount = deal.amount;
    const previousHistory = deal.dealValueHistory || [];
    setDeal((prev: any) => ({
      ...prev,
      amount: newAmount,
      dealValueHistory: [historyEntry, ...previousHistory],
    }));
    try {
      await updateDeal(id, { value: newAmount, value_change_reason: reason || undefined });
      showToast(`Deal amount updated to $${newAmount.toLocaleString()}`, 'success');
    } catch {
      setDeal((prev: any) => ({
        ...prev,
        amount: previousAmount,
        dealValueHistory: previousHistory,
      }));
      showToast('Failed to update deal amount', 'error');
    }
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

  const handleViewBattleCard = (competitor: string) => {
    setExpandedBattleCard(competitor.toLowerCase());
    setTimeout(() => {
      battleCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
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
        deal={{ ...deal, aiScore: healthResult.score, aiHealth: healthResult.label }}
        onEdit={() => navigate(`/crm/deals/${id}/edit`)}
        onMoreAction={handleMoreAction}
        onEmail={() => handleSendEmail('john@acme.com', 'Following up on proposal', '')}
        onCall={() => setShowCallLog(true)}
        onMeeting={() => setShowMeetingScheduler(true)}
        onProposal={() => showToast('Proposal creator coming soon', 'info')}
        onMoveStage={() => setShowStageChange(true)}
        onUpdateAmount={() => setShowUpdateAmount(true)}
        onAssignOwner={handleAssignOwner}
        onShowShortcuts={() => setShowShortcuts(true)}
        momentumResult={momentumResult}
        revenueSchedule={activeRevenueSchedule}
        onViewRevenue={handleViewRevenue}
      />

      {/* Sticky Tab Navigation */}
      <div className="sticky top-[7rem] z-40 bg-white border-b border-gray-200 -mx-6 px-8">
        <div className="flex overflow-x-auto scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-8 py-8">
        <div ref={overviewRef} aria-hidden="true" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (65% width) */}
          <div className="lg:col-span-2 space-y-6">

            {/* AI Insights */}
            <div ref={aiInsightsRef}>
              <AIDealIntelligence
                {...aiIntelligenceData}
                winProbAI={aiIntelligenceData.winProbAI}
                winProbOverrideReason={aiIntelligenceData.winProbOverrideReason}
                onSendEmail={handleSendEmail}
                onScheduleCall={() => setShowCallLog(true)}
                onScheduleMeeting={() => setShowMeetingScheduler(true)}
                onFindBestTime={() => setShowBestTime(true)}
                onViewBattleCard={handleViewBattleCard}
              />
            </div>

            {/* People */}
            <div ref={peopleRef} className="space-y-6">
              <DealAccountContacts
                account={accountData}
                contacts={contacts}
                hrmsConnection={hrmsConnection}
                onViewAccount={handleViewAccount}
                onAddToHRMS={handleAddToHRMS}
                onFindCEO={() => setShowFindCEO(true)}
                onRequestIntro={handleRequestIntro}
                onAddContact={(role) => {
                  setPreSelectedContactRole(role || '');
                  setShowAddContact(true);
                }}
                onEmail={handleSendEmail}
                onCall={() => setShowCallLog(true)}
              />
              <BuyingCommitteeMap
                contacts={contacts}
                onAddContact={(role) => {
                  setPreSelectedContactRole(role || '');
                  setShowAddContact(true);
                }}
              />
            </div>

            {/* Timeline */}
            <div ref={timelineRef}>
              <DealActivityTimeline
                activities={activities}
                daysSinceLastContact={5}
                contacts={contacts.map(c => ({ id: c.id, name: c.name }))}
              />
            </div>

            {/* Deal Info */}
            <div ref={dealInfoRef}>
              <DealDetailsPanel
                deal={deal}
                stageHistory={stageHistory}
                competitors={accountData.competitors}
                expandedBattleCard={expandedBattleCard}
                isAdmin={isAdmin}
                battleCardRef={battleCardRef}
                revenueSchedule={activeRevenueSchedule}
                onSaveRevenueSchedule={(s) => setSavedRevenueSchedule(s)}
                revenueTimelineRef={revenueTimelineRef}
              />
            </div>

            {/* Files & Notes */}
            <div ref={filesNotesRef}>
              <DealNotesFiles notes={notes} files={files} />
            </div>
          </div>

          {/* Right Sidebar (35% width) */}
          <div className="lg:col-span-1 space-y-6">
            <DealHealthScorePanel formData={healthFormData} subtitle="Based on current deal completeness" />
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
        onClose={() => { setShowAddContact(false); setPreSelectedContactRole(''); }}
        onAddContact={handleAddContact}
        preSelectedRole={preSelectedContactRole || undefined}
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

      {/* ── Keyboard Shortcuts Modal ── */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowShortcuts(false); }}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowShortcuts(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-gray-600" />
                <h2 className="text-base font-semibold text-gray-900">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-xs text-gray-500 mb-5">
                Press these keys anywhere on the deal page — except when typing in a field.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Action</th>
                    <th className="text-right pb-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { action: 'Email',                   key: 'E',  desc: 'Open email composer'         },
                    { action: 'Call',                    key: 'C',  desc: 'Log a call'                  },
                    { action: 'Meeting',                 key: 'M',  desc: 'Schedule a meeting'           },
                    { action: 'Proposal',                key: 'P',  desc: 'Create a proposal'            },
                    { action: 'Move to Next Stage',      key: 'S',  desc: 'Advance pipeline stage'       },
                    { action: 'Update Amount',           key: 'U',  desc: 'Edit deal value'              },
                    { action: 'Open Shortcuts',          key: '?',  desc: 'Show this panel'              },
                  ].map(({ action, key, desc }) => (
                    <tr key={key} className="group">
                      <td className="py-2.5 pr-4">
                        <div className="font-medium text-gray-800">{action}</div>
                        <div className="text-xs text-gray-400">{desc}</div>
                      </td>
                      <td className="py-2.5 text-right">
                        <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-sm font-bold bg-gray-100 text-gray-700 border border-gray-300 rounded-lg shadow-[0_1px_0_0_rgba(0,0,0,0.15)] font-mono">
                          {key}
                        </kbd>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center">
              Shortcuts are disabled when typing in any input field
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprehensiveDealDetailPage;
