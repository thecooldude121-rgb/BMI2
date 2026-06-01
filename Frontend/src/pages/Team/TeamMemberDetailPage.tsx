import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRight, Mail, Calendar, Video, Briefcase, Target, Trophy, TrendingUp, Clock, BarChart3, Building2, Users, Phone, MessageSquare, CheckCircle, ExternalLink, Plus, CreditCard as Edit2, Trash2, MapPin, Globe, Hash, AlertCircle, ChevronDown, ChevronUp, X, Send, FileText, MoreVertical, StickyNote, Share2, RefreshCw, Download, Link2, Copy, Settings, Shield, Activity } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { DirectReportsSection } from '../../components/Team/DirectReportsSection';
import { TeamEmailComposerModal } from '../../components/Team/TeamEmailComposerModal';
import { ScheduleCallModal } from '../../components/Team/ScheduleCallModal';
import { ScheduleMeetingModal } from '../../components/Team/ScheduleMeetingModal';
import { CreateTaskModal } from '../../components/Team/CreateTaskModal';
import { AddNoteModal } from '../../components/Team/AddNoteModal';
import { ShareDocumentModal } from '../../components/Team/ShareDocumentModal';

type Role = 'CEO' | 'VP' | 'Manager' | 'Rep' | 'Admin' | 'Analyst' | 'Support';

interface TeamMemberDetail {
  id: string;
  name: string;
  initials: string;
  role: string;
  email: string;
  phone: string;
  manager: string;
  managerId: string;
  status: 'Active' | 'Inactive';
  memberSince: string;
  lastActive: string;
  location: string;
  timezone: string;
  team: string;
  department: string;
  employeeNumber: string;
  metrics: {
    activeDeals: number;
    activeDealsChange: string;
    activeDealsChangeValue: number;
    totalPipeline: string;
    totalPipelineValue: number;
    pipelineChange: string;
    pipelineChangePct: number;
    pipelinePrevious: string;
    wonDeals: number;
    wonDealsQ: string;
    wonDealsPrevQ: number;
    winRate: number;
    winRateComparison: string;
    winRateTeamAvg: number;
    winRateTrend: string;
    quotaAttainment: number;
    quotaTarget: string;
    quotaActual: string;
    quotaStatus: string;
    avgCycle: string;
    avgCycleDays: number;
    cycleChange: string;
    cycleChangeDays: number;
    cycleTeamAvg: string;
  };
  hrmsLeads?: HRMSLead[];
  directReports?: DirectReport[];
}

interface DirectReport {
  id: string;
  name: string;
  initials: string;
  role: string;
  email: string;
  phone: string;
  photoColor: string;
  status: 'active' | 'inactive';
  memberSince: string;
  reportsTo: string;
  reportsToId: string;
  activeDeals: number;
  pipeline: string;
  pipelineValue: number;
  winRate: number;
  quota: string;
  quotaValue: number;
  quotaAttainment: number;
  performanceLabel: string;
  lastActivityType: string;
  lastActivity: string;
  lastActivityDate: string;
  activityStatus: string;
  coachingStatus: {
    needsAttention: boolean;
    last1on1: string;
    next1on1: string;
    performanceTrend: string;
  };
}

interface HRMSLead {
  id: string;
  company: string;
  companyIndustry: string;
  companySize: string;
  companyRevenue: string;
  value: string;
  contact: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  contactLinkedIn: string;
  recruitedEmployee: string;
  recruitedDate: string;
  recruitedPosition: string;
  recruitedBy: string;
  employmentStatus: string;
  stage: string;
  probability: number;
  hrmsBonus: number;
  closeDate: string;
  dealAge: string;
  lastActivity: string;
  context: string;
  decisionMakers: string[];
  painPoints: string[];
  nextSteps: string[];
}

interface Deal {
  id: string;
  dealId: string;
  name: string;
  fullName: string;
  value: string;
  valueNum: number;
  stage: string;
  probability: number;
  closeDate: string;
  age: string;
  ageDays: number;
  source: string;
  isHRMS: boolean;
  contact: string;
  lastActivity: string;
  nextStep: string;
}

interface Contact {
  id: string;
  name: string;
  company: string;
  title: string;
  lastContact: string;
  isHRMS: boolean;
}

interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task';
  icon: string;
  contact: string;
  company: string;
  date: string;
  relativeDate: string;
  duration?: string;
  attendees?: number;
  subject: string;
  description: string;
  outcome: string;
  sentiment: string;
  sentimentEmoji: string;
  nextAction: string;
  relatedDeal: string;
  relatedDealValue: string;
  tags: string[];
}

interface CoachingNote {
  id: string;
  date: string;
  author: string;
  authorRole: string;
  authorTitle: string;
  managerId: string;
  visibility: string;
  content: string;
  focusAreas: string[];
  developmentGoals?: string[];
  performanceRating: string;
  achievement?: string;
  nextReview?: string;
}

const TEAM_MEMBER_DATA: Record<string, TeamMemberDetail> = {
  '2': {
    id: '2',
    name: 'Sarah Chen',
    initials: 'SC',
    role: 'Sales Manager',
    email: 'sarah@bmi.com',
    phone: '555-0001',
    manager: 'John Smith',
    managerId: '5',
    status: 'Active',
    memberSince: 'Oct 1, 2024',
    lastActive: '2 hours ago',
    location: 'San Francisco, CA',
    timezone: 'PST (UTC-8)',
    team: 'Sales East',
    department: 'Sales',
    employeeNumber: 'EMP-001234',
    metrics: {
      activeDeals: 12,
      activeDealsChange: '+3 vs LM',
      activeDealsChangeValue: 3,
      totalPipeline: '$680K',
      totalPipelineValue: 680000,
      pipelineChange: '+15% MoM',
      pipelineChangePct: 15,
      pipelinePrevious: '$591K',
      wonDeals: 8,
      wonDealsQ: 'This Q',
      wonDealsPrevQ: 6,
      winRate: 72,
      winRateComparison: 'Above avg',
      winRateTeamAvg: 67,
      winRateTrend: '+5% vs last quarter',
      quotaAttainment: 108,
      quotaTarget: '$630K',
      quotaActual: '$680K',
      quotaStatus: 'On target',
      avgCycle: '45 days',
      avgCycleDays: 45,
      cycleChange: '-5 days',
      cycleChangeDays: -5,
      cycleTeamAvg: '52 days'
    },
    hrmsLeads: [
      {
        id: 'hrms_lead_001',
        company: 'DataFlow Inc',
        companyIndustry: 'Technology - Data Analytics',
        companySize: '150 employees',
        companyRevenue: '$25M annual',
        value: '$120,000',
        contact: 'Emma Wilson',
        contactTitle: 'VP Engineering',
        contactEmail: 'emma.wilson@dataflow.com',
        contactPhone: '555-1001',
        contactLinkedIn: 'linkedin.com/in/emmawilson',
        recruitedEmployee: 'Emma Wilson',
        recruitedDate: 'Oct 15, 2025',
        recruitedPosition: 'Senior Software Engineer',
        recruitedBy: 'HR Team - Jennifer Martinez',
        employmentStatus: 'Active employee',
        stage: 'Qualified',
        probability: 65,
        hrmsBonus: 33,
        closeDate: 'Jan 30, 2026',
        dealAge: '45 days',
        lastActivity: '2 hours ago (phone call)',
        context: 'Emma Wilson was hired by your company\'s HR team as a Senior Software Engineer on Oct 15, 2025. She previously served as VP Engineering at DataFlow Inc, where she led a team of 25 engineers for 4 years. This creates a warm introduction opportunity with DataFlow Inc. Emma\'s former colleagues speak highly of her, and she maintains strong relationships with the executive team. Leverage this trusted connection for credible outreach.',
        decisionMakers: [
          'Emma Wilson (VP Engineering) - Your recruited employee',
          'Marcus Chen (CEO)',
          'Sarah Thompson (CFO)',
          'David Park (CTO) - Emma\'s former peer'
        ],
        painPoints: [
          'Legacy data infrastructure needs modernization',
          'Scaling challenges with current analytics platform',
          'Integration issues with cloud services'
        ],
        nextSteps: [
          'Follow-up call scheduled Dec 15, 2024',
          'Product demo requested for Dec 20, 2024',
          'Proposal due: Dec 28, 2024'
        ]
      },
      {
        id: 'hrms_lead_002',
        company: 'BigCo Enterprise',
        companyIndustry: 'Enterprise Software',
        companySize: '500 employees',
        companyRevenue: '$120M annual',
        value: '$95,000',
        contact: 'Alex Johnson',
        contactTitle: 'CTO',
        contactEmail: 'alex.johnson@bigco.com',
        contactPhone: '555-2002',
        contactLinkedIn: 'linkedin.com/in/alexjohnson',
        recruitedEmployee: 'Alex Johnson',
        recruitedDate: 'Sep 22, 2025',
        recruitedPosition: 'Solutions Architect',
        recruitedBy: 'HR Team - Jennifer Martinez',
        employmentStatus: 'Active employee',
        stage: 'Proposal',
        probability: 70,
        hrmsBonus: 33,
        closeDate: 'Feb 15, 2026',
        dealAge: '62 days',
        lastActivity: 'Yesterday (email sent)',
        context: 'Alex Johnson was hired by your company\'s HR team as a Solutions Architect on Sep 22, 2025. He previously held the position of CTO at BigCo Enterprise, where he managed technology strategy for 6 years. Alex brings deep technical expertise and maintains excellent relationships with BigCo\'s leadership team. This warm connection significantly accelerates trust-building and deal progression.',
        decisionMakers: [
          'Alex Johnson (CTO) - Your recruited employee',
          'Jennifer Wu (CEO)',
          'Michael Roberts (VP Operations)',
          'Lisa Chen (CFO)'
        ],
        painPoints: [
          'Need to consolidate multiple vendor solutions',
          'Security compliance requirements',
          'Cost optimization goals for 2026'
        ],
        nextSteps: [
          'Awaiting response to updated proposal (sent yesterday)',
          'Legal review in progress',
          'Contract negotiation expected mid-Jan 2026'
        ]
      }
    ],
    directReports: [
      {
        id: '1',
        name: 'Alex Rodriguez',
        initials: 'AR',
        role: 'Sales Representative',
        email: 'alex@bmi.com',
        phone: '555-0002',
        photoColor: '#3b82f6',
        status: 'active',
        memberSince: 'Oct 1, 2024',
        reportsTo: 'Sarah Chen',
        reportsToId: '2',
        activeDeals: 8,
        pipeline: '$450,000',
        pipelineValue: 450000,
        winRate: 67,
        quota: '$432,000',
        quotaValue: 432000,
        quotaAttainment: 104,
        performanceLabel: 'Solid performer',
        lastActivityType: 'Phone call with prospect',
        lastActivity: '2 hours ago',
        lastActivityDate: 'Dec 13, 2024 at 2:00 PM PST',
        activityStatus: 'Active (recent engagement)',
        coachingStatus: {
          needsAttention: false,
          last1on1: 'Dec 8, 2024',
          next1on1: 'Dec 20, 2024',
          performanceTrend: 'Steady'
        }
      },
      {
        id: '4',
        name: 'Emily Davis',
        initials: 'ED',
        role: 'Sales Representative',
        email: 'emily@bmi.com',
        phone: '555-0004',
        photoColor: '#3b82f6',
        status: 'active',
        memberSince: 'Oct 1, 2024',
        reportsTo: 'Sarah Chen',
        reportsToId: '2',
        activeDeals: 5,
        pipeline: '$280,000',
        pipelineValue: 280000,
        winRate: 65,
        quota: '$260,000',
        quotaValue: 260000,
        quotaAttainment: 108,
        performanceLabel: 'On track',
        lastActivityType: 'Email to prospect',
        lastActivity: '5 hours ago',
        lastActivityDate: 'Dec 13, 2024 at 11:00 AM PST',
        activityStatus: 'Active',
        coachingStatus: {
          needsAttention: false,
          last1on1: 'Dec 9, 2024',
          next1on1: 'Dec 22, 2024',
          performanceTrend: 'Improving'
        }
      }
    ]
  },
  '1': {
    id: '1',
    name: 'Alex Rodriguez',
    initials: 'AR',
    role: 'Sales Representative',
    email: 'alex@bmi.com',
    phone: '555-0002',
    manager: 'Sarah Chen',
    managerId: '2',
    status: 'Active',
    memberSince: 'Oct 1, 2024',
    lastActive: '2 hours ago',
    location: 'San Francisco, CA',
    timezone: 'PST (UTC-8)',
    team: 'Sales East',
    department: 'Sales',
    employeeNumber: 'EMP-001235',
    metrics: {
      activeDeals: 8,
      activeDealsChange: '+2 vs LM',
      activeDealsChangeValue: 2,
      totalPipeline: '$450K',
      totalPipelineValue: 450000,
      pipelineChange: '+12% MoM',
      pipelineChangePct: 12,
      pipelinePrevious: '$402K',
      wonDeals: 6,
      wonDealsQ: 'This Q',
      wonDealsPrevQ: 4,
      winRate: 67,
      winRateComparison: 'Above avg',
      winRateTeamAvg: 65,
      winRateTrend: '+3% vs last quarter',
      quotaAttainment: 104,
      quotaTarget: '$432K',
      quotaActual: '$450K',
      quotaStatus: 'Exceeding target',
      avgCycle: '42 days',
      avgCycleDays: 42,
      cycleChange: '-3 days',
      cycleChangeDays: -3,
      cycleTeamAvg: '52 days'
    }
  }
};

const DEALS: Deal[] = [
  {
    id: 'd1',
    dealId: 'deal_001',
    name: 'DataFlow Inc',
    fullName: 'DataFlow Inc - Enterprise Analytics Platform',
    value: '$120K',
    valueNum: 120000,
    stage: 'Qualified',
    probability: 65,
    closeDate: 'Jan 30, \'26',
    age: '45 days',
    ageDays: 45,
    source: 'HRMS',
    isHRMS: true,
    contact: 'Emma Wilson',
    lastActivity: '2 hours ago',
    nextStep: 'Product demo on Dec 20'
  },
  {
    id: 'd2',
    dealId: 'deal_002',
    name: 'BigCo Enterprise',
    fullName: 'BigCo Enterprise - Infrastructure Upgrade',
    value: '$95K',
    valueNum: 95000,
    stage: 'Proposal',
    probability: 70,
    closeDate: 'Feb 15, \'26',
    age: '62 days',
    ageDays: 62,
    source: 'HRMS',
    isHRMS: true,
    contact: 'Alex Johnson',
    lastActivity: 'Yesterday',
    nextStep: 'Awaiting legal review'
  },
  {
    id: 'd3',
    dealId: 'deal_003',
    name: 'TechVision Corp',
    fullName: 'TechVision Corp - Cloud Migration',
    value: '$85K',
    valueNum: 85000,
    stage: 'Negotiation',
    probability: 80,
    closeDate: 'Dec 31, \'25',
    age: '78 days',
    ageDays: 78,
    source: 'Cold Outreach',
    isHRMS: false,
    contact: 'Michael Chen',
    lastActivity: '3 days ago',
    nextStep: 'Contract review'
  },
  {
    id: 'd4',
    dealId: 'deal_004',
    name: 'CloudStart Solutions',
    fullName: 'CloudStart Solutions - SaaS Platform',
    value: '$65K',
    valueNum: 65000,
    stage: 'Qualified',
    probability: 50,
    closeDate: 'Jan 15, \'26',
    age: '32 days',
    ageDays: 32,
    source: 'Referral',
    isHRMS: false,
    contact: 'Lisa Martinez',
    lastActivity: '5 days ago',
    nextStep: 'Follow-up meeting Dec 20'
  },
  {
    id: 'd5',
    dealId: 'deal_005',
    name: 'Innovation Labs',
    fullName: 'Innovation Labs - Custom Development',
    value: '$110K',
    valueNum: 110000,
    stage: 'Proposal',
    probability: 60,
    closeDate: 'Feb 1, \'26',
    age: '54 days',
    ageDays: 54,
    source: 'Cold Outreach',
    isHRMS: false,
    contact: 'Robert Kim',
    lastActivity: '1 week ago',
    nextStep: 'Send revised proposal'
  }
];

const CONTACTS: Contact[] = [
  { id: 'c1', name: 'Emma Wilson', company: 'DataFlow Inc', title: 'VP Eng', lastContact: '2 days ago', isHRMS: true },
  { id: 'c2', name: 'Alex Johnson', company: 'BigCo Enterprise', title: 'CTO', lastContact: '1 week ago', isHRMS: true },
  { id: 'c3', name: 'Michael Chen', company: 'TechVision Corp', title: 'CEO', lastContact: '3 days ago', isHRMS: false },
  { id: 'c4', name: 'Lisa Martinez', company: 'CloudStart Sol', title: 'VP Sales', lastContact: '5 days ago', isHRMS: false },
  { id: 'c5', name: 'Robert Kim', company: 'Innovation Labs', title: 'Director', lastContact: '1 week ago', isHRMS: false }
];

const ACTIVITIES: Activity[] = [
  {
    id: 'activity_001',
    type: 'call',
    icon: '📞',
    contact: 'Emma Wilson',
    company: 'DataFlow Inc',
    date: 'Dec 13, 2024 at 2:00 PM PST',
    relativeDate: '2 hours ago',
    duration: '35 minutes',
    subject: 'Pricing discussion for enterprise plan',
    description: 'Discussed pricing options for enterprise plan. Emma is positive about moving forward with the qualified package. She mentioned budget approval is likely by end of month. Follow-up scheduled for next week to address any technical questions from her team.',
    outcome: 'Positive',
    sentiment: 'Very Positive',
    sentimentEmoji: '😊',
    nextAction: 'Product demo Dec 20',
    relatedDeal: 'DataFlow Inc',
    relatedDealValue: '$120K',
    tags: ['HRMS', 'Pricing', 'Positive']
  },
  {
    id: 'activity_002',
    type: 'email',
    icon: '✉️',
    contact: 'Alex Johnson',
    company: 'BigCo Enterprise',
    date: 'Dec 12, 2024 at 4:30 PM PST',
    relativeDate: 'Yesterday',
    subject: 'Updated Proposal - Q1 2026 Implementation',
    description: 'Sent updated proposal with revised timeline based on Alex\'s feedback from last week. Adjusted implementation schedule to start Q1 2026 instead of Q4 2025. Included detailed project plan and resource allocation. Awaiting response.',
    outcome: 'Pending Response',
    sentiment: 'Neutral (waiting)',
    sentimentEmoji: '😐',
    nextAction: 'Follow up if no response by Dec 15',
    relatedDeal: 'BigCo Enterprise',
    relatedDealValue: '$95K',
    tags: ['HRMS', 'Proposal', 'Follow-up Needed']
  },
  {
    id: 'activity_003',
    type: 'meeting',
    icon: '🤝',
    contact: 'Michael Chen',
    company: 'TechVision Corp',
    date: 'Dec 10, 2024 at 10:00 AM PST',
    relativeDate: '3 days ago',
    duration: '1 hour',
    attendees: 4,
    subject: 'Product Demo - Cloud Migration Solution',
    description: 'Product demo completed successfully. Client impressed with features, especially the automated migration tools and security compliance features. Michael confirmed this addresses their main pain points. Moving to negotiation stage. Waiting for legal review of contract before final signatures.',
    outcome: 'Excellent',
    sentiment: 'Very Positive',
    sentimentEmoji: '😊',
    nextAction: 'Contract review with legal',
    relatedDeal: 'TechVision Corp',
    relatedDealValue: '$85K',
    tags: ['Demo', 'Positive', 'Negotiation']
  },
  {
    id: 'activity_004',
    type: 'task',
    icon: '✅',
    contact: 'Lisa Martinez',
    company: 'CloudStart Solutions',
    date: 'Dec 8, 2024',
    relativeDate: '5 days ago',
    subject: 'Follow-up materials after discovery call',
    description: 'Sent follow-up materials including case studies, ROI calculator, and technical documentation after initial discovery call. Lisa confirmed receipt and interest. Scheduled next meeting for Dec 20 to discuss technical requirements in detail.',
    outcome: 'Completed',
    sentiment: 'Positive',
    sentimentEmoji: '😊',
    nextAction: 'Technical deep-dive Dec 20',
    relatedDeal: 'CloudStart Solutions',
    relatedDealValue: '$65K',
    tags: ['Follow-up', 'Discovery', 'Materials Sent']
  },
  {
    id: 'activity_005',
    type: 'call',
    icon: '📞',
    contact: 'Lisa Martinez',
    company: 'CloudStart Solutions',
    date: 'Dec 6, 2024 at 11:00 AM PST',
    relativeDate: '1 week ago',
    duration: '45 minutes',
    subject: 'Discovery call - Requirements gathering',
    description: 'Discovery call to understand CloudStart\'s requirements and pain points. Identified 3 key challenges: 1) Current platform doesn\'t scale, 2) Integration complexity, 3) High maintenance costs. Our enterprise solution is a good fit for all three. Lisa is the primary decision maker with $100K budget authority.',
    outcome: 'Qualified',
    sentiment: 'Positive',
    sentimentEmoji: '😊',
    nextAction: 'Send follow-up materials (completed)',
    relatedDeal: 'CloudStart Solutions',
    relatedDealValue: '$65K',
    tags: ['Discovery', 'Qualified', 'Budget Confirmed']
  }
];

const COACHING_NOTES: CoachingNote[] = [
  {
    id: 'note_001',
    date: 'Dec 10, 2024',
    author: 'John Smith',
    authorRole: 'Director',
    authorTitle: 'Sales Director',
    managerId: '5',
    visibility: 'Manager+ only',
    content: 'Sarah continues to excel with HRMS-sourced leads. Her approach to leveraging warm introductions is exemplary - she effectively uses the recruitment connection to build credibility quickly. Suggested she mentor junior reps on this strategy to scale best practices across the team. Pipeline velocity improved 20% MoM, largely due to HRMS lead quality.',
    focusAreas: [
      'Scale HRMS strategy across team',
      'Mentor junior reps on warm introduction techniques',
      'Continue strong relationship management'
    ],
    developmentGoals: [
      'Lead HRMS training session in January',
      'Document HRMS playbook for team'
    ],
    performanceRating: 'Exceeding Expectations'
  },
  {
    id: 'note_002',
    date: 'Nov 15, 2024',
    author: 'John Smith',
    authorRole: 'Director',
    authorTitle: 'Sales Director',
    managerId: '5',
    visibility: 'Manager+ only',
    content: 'Strong performance this quarter. Win rate of 72% significantly exceeds team average of 67%. Sarah is excellent at relationship building and maintains consistent follow-through with prospects. Working on shortening sales cycles further through better qualification in early stages. Recommended attending advanced MEDDIC training in Q1 2026.',
    focusAreas: [
      'Improve early-stage qualification',
      'Shorten sales cycle from 45 to 40 days',
      'Maintain high win rate'
    ],
    developmentGoals: [
      'Complete MEDDIC certification Q1 2026',
      'Reduce time in Qualified stage by 15%'
    ],
    performanceRating: 'Exceeds Expectations'
  },
  {
    id: 'note_003',
    date: 'Oct 5, 2024',
    author: 'John Smith',
    authorRole: 'Director',
    authorTitle: 'Sales Director',
    managerId: '5',
    visibility: 'Manager+ only',
    content: 'First HRMS lead (DataFlow Inc) converted successfully to Qualified stage. This validates our HRMS integration strategy. Sarah effectively used the recruitment connection with Emma Wilson to build trust and credibility quickly, cutting through initial prospecting friction. Encouraged Sarah to document her approach for team training materials. This is a replicable playbook we can scale.',
    focusAreas: [
      'Document HRMS approach',
      'Share learnings with team',
      'Continue HRMS lead nurturing'
    ],
    achievement: 'First HRMS lead conversion - Validated HRMS integration ROI',
    performanceRating: 'Exceeds Expectations',
    nextReview: 'Nov 15, 2024'
  }
];

const HRMS_SUMMARY = {
  totalLeads: 2,
  totalPipeline: '$215,000',
  avgProbability: '67.5%',
  conversionRate: '50%',
  hrmsAdvantage: '+33%',
  avgSalesCycle: '38 days',
  coldSalesCycle: '52 days'
};

export default function TeamMemberDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const location = useLocation();
  const navigationState = location.state as { from?: string } | null;
  const [currentRole, setCurrentRole] = useState<Role>('Manager');
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Modal states
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [hrmsModalOpen, setHrmsModalOpen] = useState(false);
  const [selectedHrmsLead, setSelectedHrmsLead] = useState<HRMSLead | null>(null);
  const [editNoteModalOpen, setEditNoteModalOpen] = useState(false);
  const [deleteNoteModalOpen, setDeleteNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CoachingNote | null>(null);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [oneOnOneModalOpen, setOneOnOneModalOpen] = useState(false);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const [shareDocModalOpen, setShareDocModalOpen] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string>('');

  // Ref for more actions dropdown
  const moreActionsRef = useRef<HTMLDivElement>(null);

  const member = TEAM_MEMBER_DATA[id || '2'];

  // Keyboard shortcuts: E, C, M, T, N, D, A
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea and modal is not open
      const isTyping = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      const hasModalOpen = emailModalOpen || scheduleModalOpen || addNoteOpen || callModalOpen ||
                          meetingModalOpen || taskModalOpen || noteModalOpen || documentModalOpen;

      if (isTyping || hasModalOpen) return;

      const key = e.key.toLowerCase();
      if (key === 'e') {
        e.preventDefault();
        handleSendEmail();
      } else if (key === 'c') {
        e.preventDefault();
        handleScheduleCall();
      } else if (key === 'm') {
        e.preventDefault();
        setMeetingModalOpen(true);
      } else if (key === 't') {
        e.preventDefault();
        setTaskModalOpen(true);
      } else if (key === 'n') {
        e.preventDefault();
        setNoteModalOpen(true);
      } else if (key === 'd') {
        e.preventDefault();
        setDocumentModalOpen(true);
      } else if (key === 'a') {
        e.preventDefault();
        setMoreActionsOpen(!moreActionsOpen);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [emailModalOpen, scheduleModalOpen, addNoteOpen, callModalOpen, meetingModalOpen, taskModalOpen, noteModalOpen, documentModalOpen, moreActionsOpen]);

  // Close more actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(e.target as Node)) {
        setMoreActionsOpen(false);
      }
    };

    if (moreActionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [moreActionsOpen]);

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-md text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Member Not Found</h2>
          <button
            onClick={() => navigate('/team')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Team
          </button>
        </div>
      </div>
    );
  }

  // Comprehensive role-based permissions
  const canViewHRMS = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const canManageNotes = ['CEO', 'VP', 'Manager', 'Admin'].includes(currentRole);
  const canScheduleMeetings = currentRole === 'Manager';
  const canAddNotes = ['CEO', 'VP', 'Manager'].includes(currentRole);

  // Direct Reports visibility logic
  const isViewingOwnProfile = id === '2' && currentRole === 'Manager'; // Sarah viewing her own profile
  const isManagersManager = id === '2' && ['CEO', 'VP'].includes(currentRole); // John/higher viewing Sarah
  const canViewDirectReports = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole) && currentRole !== 'Rep';
  const canTakeDirectReportActions = ['CEO', 'VP', 'Manager', 'Admin'].includes(currentRole);
  const canEditCoachingNotes = isViewingOwnProfile || (isManagersManager && currentRole !== 'Admin');
  const showDirectReportsReadOnly = currentRole === 'Analyst' || currentRole === 'Admin';
  const canEditNotes = currentRole === 'Manager' || currentRole === 'CEO';
  const canViewPerformance = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const canViewDeals = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const canViewContacts = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const canViewActivities = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const canViewCoachingNotes = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const hasFullAccess = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const hasLimitedView = currentRole === 'Rep';
  const hasNoAccess = currentRole === 'Support';

  // Quick Actions Toolbar - Role-based button visibility
  const showQuickActionsToolbar = !hasNoAccess; // Show for all except Support
  const canSendEmail = !hasNoAccess; // All roles can send email
  const canScheduleCall = ['CEO', 'VP', 'Manager', 'Admin'].includes(currentRole);
  const canScheduleMeetingAction = ['CEO', 'VP', 'Manager', 'Admin'].includes(currentRole);
  const canCreateTask = ['CEO', 'VP', 'Manager', 'Admin'].includes(currentRole);
  const canAddNoteAction = ['CEO', 'VP', 'Manager'].includes(currentRole);
  const canShareDocument = ['Manager', 'Admin'].includes(currentRole);
  const canUseMoreActions = !hasNoAccess;

  // More Actions dropdown - role-specific options
  const canViewAllDeals = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const canViewAllContacts2 = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const canViewAllActivities2 = ['CEO', 'VP', 'Manager', 'Admin', 'Analyst'].includes(currentRole);
  const canSchedule1on1Action = ['CEO', 'VP', 'Manager'].includes(currentRole);

  // Toggle functions
  const toggleLeadExpansion = (leadId: string) => {
    const newExpanded = new Set(expandedLeads);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
    }
    setExpandedLeads(newExpanded);
  };

  const toggleActivityExpansion = (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const toggleNoteExpansion = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  // Navigation handlers
  const handleBackToTeam = () => {
    if (navigationState?.from === 'settings') {
      navigate('/crm/settings/team');
      showToast('Returning to Team Management', 'info');
    } else {
      navigate('/team');
      showToast('Returning to Team Performance', 'info');
    }
  };

  const handleViewManagerProfile = () => {
    navigate(`/team/${member.managerId}`);
    showToast(`Loading ${member.manager}'s profile`, 'info');
  };

  const handleViewCalendar = () => {
    navigate('/calendar');
    showToast(`Opening ${member.name}'s calendar`, 'info');
  };

  const handleViewAllDeals = () => {
    navigate('/deals');
    showToast(`Loading ${member.name}'s deals`, 'info');
  };

  const handleViewAllContacts = () => {
    navigate('/contacts');
    showToast(`Loading ${member.name}'s contacts`, 'info');
  };

  const handleViewAllActivities = () => {
    navigate('/activity');
    showToast(`Loading ${member.name}'s activities`, 'info');
  };

  const handleViewDeal = (dealId: string, dealName: string) => {
    navigate(`/deals/${dealId}`);
    showToast(`Opening ${dealName}`, 'info');
  };

  const handleViewContact = (contactId: string, contactName: string) => {
    navigate(`/contacts/${contactId}`);
    showToast(`Opening ${contactName}'s profile`, 'info');
  };

  const handleViewAccount = (accountId: string, accountName: string) => {
    navigate(`/accounts/${accountId}`);
    showToast(`Opening ${accountName}`, 'info');
  };

  const handleViewLead = (leadId: string, leadName: string) => {
    navigate(`/leads/${leadId}`);
    showToast(`Opening ${leadName}`, 'info');
  };

  // Direct Reports handlers
  const handleViewReportProfile = (reportId: string) => {
    navigate(`/team/${reportId}`);
    const report = member.directReports?.find(r => r.id === reportId);
    if (report) {
      showToast(`Loading ${report.name}'s profile`, 'info');
    }
  };

  const handleEmailReport = (email: string) => {
    setSelectedContact(email);
    setEmailModalOpen(true);
  };

  const handleScheduleCallWithReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setCallModalOpen(true);
  };

  const handleSchedule1on1WithReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setOneOnOneModalOpen(true);
  };

  // Modal handlers
  const handleSchedule1on1 = () => {
    setScheduleModalOpen(true);
  };

  const handleSendEmail = (recipient?: string) => {
    setSelectedContact(recipient || member.email);
    setEmailModalOpen(true);
  };

  const handleScheduleCall = () => {
    setCallModalOpen(true);
  };

  const handleCallSchedule = async (callData: {
    date: string;
    time: string;
    duration: number;
    callType: 'phone' | 'video' | 'inperson';
    phoneNumber?: string;
    videoLink?: string;
    subject: string;
    notes: string;
    sendInvite: boolean;
    addToCalendar: boolean;
  }) => {
    // Format date and time for display
    const callDate = new Date(callData.date + 'T' + callData.time);
    const formattedDate = callDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const formattedTime = callDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Create activity log
    const activity = {
      id: `call-${Date.now()}`,
      type: 'Call Scheduled' as const,
      with: member.name,
      withEmail: member.email,
      date: callData.date,
      time: callData.time,
      formattedDateTime: `${formattedDate} at ${formattedTime} ${member.timezone || 'PST'}`,
      duration: `${callData.duration} minutes`,
      callType: callData.callType,
      phoneNumber: callData.phoneNumber,
      videoLink: callData.videoLink,
      subject: callData.subject,
      notes: callData.notes,
      status: 'Scheduled' as const,
      timestamp: new Date().toISOString(),
      sendInvite: callData.sendInvite,
      addToCalendar: callData.addToCalendar,
      relatedTo: `${member.name} (Team Member)`
    };

    // In a real app, this would:
    // 1. Create calendar event via Google Calendar/Outlook API
    // 2. Send calendar invite to member's email
    // 3. Generate Zoom link if video call
    // 4. Set reminder 15 minutes before
    // 5. Save to database
    // 6. Add to Activities (Screen 6.1)

    console.log('Call Activity Logged:', activity);

    // Show success toast with formatted details
    const callTypeDisplay = {
      phone: 'Phone Call',
      video: 'Video Call',
      inperson: 'In-Person Meeting'
    }[callData.callType];

    showToast(
      `${callTypeDisplay} scheduled with ${member.name} for ${formattedDate} at ${formattedTime}`,
      'success'
    );

    setCallModalOpen(false);
  };

  const handleScheduleMeeting = () => {
    setMeetingModalOpen(true);
  };

  const handleCreateTask = () => {
    setTaskModalOpen(true);
  };

  const handleAddNote = () => {
    setNoteModalOpen(true);
  };

  const handleShareDocument = () => {
    setDocumentModalOpen(true);
  };

  const handleContactAction = (contactName: string) => {
    setSelectedContact(contactName);
    setContactModalOpen(true);
  };

  const handleViewHRMS = (lead: HRMSLead) => {
    setSelectedHrmsLead(lead);
    setHrmsModalOpen(true);
  };

  const handleEditNote = (note: CoachingNote) => {
    setSelectedNote(note);
    setEditNoteModalOpen(true);
  };

  const handleDeleteNote = (note: CoachingNote) => {
    setSelectedNote(note);
    setDeleteNoteModalOpen(true);
  };

  const confirmDeleteNote = () => {
    if (selectedNote) {
      showToast('Coaching note deleted successfully', 'success');
      setDeleteNoteModalOpen(false);
      setSelectedNote(null);
    }
  };

  const saveSchedule = () => {
    showToast(`1-on-1 scheduled with ${member.name}`, 'success');
    setScheduleModalOpen(false);
  };

  const handleEmailSend = async (emailData: {
    subject: string;
    body: string;
    template: string;
    attachments?: File[];
  }) => {
    // Log activity to activity timeline
    const activity = {
      id: `email-${Date.now()}`,
      type: 'Email' as const,
      to: member.name,
      toEmail: member.email,
      subject: emailData.subject,
      body: emailData.body,
      template: emailData.template,
      date: new Date().toISOString(),
      timestamp: new Date().toLocaleString(),
      status: 'Sent' as const,
      relatedTo: `${member.name} (Team Member)`,
      attachmentCount: emailData.attachments?.length || 0
    };

    // In a real app, this would:
    // 1. Send email via Gmail/Outlook integration
    // 2. Save to database
    // 3. Add to Sarah Chen's activity timeline

    console.log('Email Activity Logged:', activity);

    showToast(`Email sent to ${member.name}`, 'success');
    setEmailModalOpen(false);
  };

  const handleEmailSaveDraft = async (emailData: {
    subject: string;
    body: string;
    template: string;
  }) => {
    // Save draft to database
    const draft = {
      id: `draft-${Date.now()}`,
      to: member.email,
      toName: member.name,
      subject: emailData.subject,
      body: emailData.body,
      template: emailData.template,
      savedAt: new Date().toISOString(),
      status: 'Draft' as const
    };

    // In a real app, save to database
    console.log('Email Draft Saved:', draft);

    showToast('Email saved as draft', 'success');
    // Keep modal open so user can continue editing
  };

  const handleMeetingSchedule = async (meetingData: {
    meetingType: '1-on-1' | 'team' | 'client';
    date: string;
    time: string;
    duration: number;
    locationType: 'office' | 'video' | 'external';
    locationDetails: string;
    subject: string;
    agenda: string;
    agendaTemplate?: string;
    additionalAttendees: string[];
    recurring: 'one-time' | 'weekly' | 'biweekly' | 'monthly';
    reminders: { fifteenMin: boolean; oneDay: boolean };
  }) => {
    // Format date and time
    const meetingDateTime = new Date(meetingData.date + 'T' + meetingData.time);
    const formattedDate = meetingDateTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const formattedTime = meetingDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Create activity log
    const activity = {
      id: `meeting-${Date.now()}`,
      type: 'Meeting Scheduled' as const,
      meetingType: meetingData.meetingType,
      with: member.name,
      withEmail: member.email,
      date: meetingData.date,
      time: meetingData.time,
      formattedDateTime: `${formattedDate} at ${formattedTime} ${member.timezone || 'PST'}`,
      duration: `${meetingData.duration} minutes`,
      locationType: meetingData.locationType,
      locationDetails: meetingData.locationDetails,
      subject: meetingData.subject,
      agenda: meetingData.agenda,
      agendaTemplate: meetingData.agendaTemplate,
      additionalAttendees: meetingData.additionalAttendees,
      recurring: meetingData.recurring,
      reminders: meetingData.reminders,
      status: 'Scheduled' as const,
      timestamp: new Date().toISOString(),
      relatedTo: `${member.name} (Team Member)`,
      isOneOnOne: meetingData.meetingType === '1-on-1'
    };

    // In a real app, this would:
    // 1. Create calendar event
    // 2. Send invites to all attendees
    // 3. Generate video link if needed
    // 4. Set reminders
    // 5. Add to Activities
    // 6. If 1-on-1: Add to Coaching Notes timeline

    console.log('Meeting Activity Logged:', activity);

    const meetingTypeDisplay = meetingData.meetingType === '1-on-1' ? '1-on-1' :
                                meetingData.meetingType === 'team' ? 'Team Meeting' : 'Client Meeting';

    showToast(
      `${meetingTypeDisplay} scheduled with ${member.name} for ${formattedDate} at ${formattedTime}`,
      'success'
    );

    setMeetingModalOpen(false);
  };

  const handleTaskCreate = async (taskData: {
    assignedTo: string;
    title: string;
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    relatedTo: 'deal' | 'contact' | 'team' | 'other';
    relatedEntity: string;
    sendReminder: boolean;
  }) => {
    // Format due date
    const dueDate = new Date(taskData.dueDate);
    const formattedDueDate = dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Create activity log
    const activity = {
      id: `task-${Date.now()}`,
      type: 'Task Assigned' as const,
      taskTitle: taskData.title,
      assignedTo: taskData.assignedTo,
      assignedBy: currentRole,
      dueDate: taskData.dueDate,
      formattedDueDate,
      priority: taskData.priority,
      description: taskData.description,
      relatedTo: taskData.relatedTo,
      relatedEntity: taskData.relatedEntity || member.name,
      sendReminder: taskData.sendReminder,
      status: 'Pending' as const,
      timestamp: new Date().toISOString()
    };

    // In a real app, this would:
    // 1. Create task in system
    // 2. Send notification to assignee
    // 3. Add to assignee's task list
    // 4. Add to Activities timeline
    // 5. Set reminder if enabled

    console.log('Task Activity Logged:', activity);

    showToast(`Task created for ${taskData.assignedTo}`, 'success');

    setTaskModalOpen(false);
  };

  const handleNoteSave = async (noteData: {
    noteType: 'coaching' | 'general' | 'meeting';
    date: string;
    subject: string;
    content: string;
    focusAreas: string[];
    developmentGoals: string;
    visibility: 'private' | 'shared';
  }) => {
    // Format date
    const noteDate = new Date(noteData.date);
    const formattedDate = noteDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Create coaching note
    const note = {
      id: `note-${Date.now()}`,
      type: noteData.noteType,
      about: member.name,
      aboutEmail: member.email,
      date: noteData.date,
      formattedDate,
      subject: noteData.subject,
      content: noteData.content,
      focusAreas: noteData.focusAreas,
      developmentGoals: noteData.developmentGoals,
      visibility: noteData.visibility,
      author: currentRole,
      authorName: 'Current User',
      timestamp: new Date().toISOString(),
      status: 'Active' as const
    };

    // In a real app, this would:
    // 1. Add to Coaching Notes section
    // 2. Add to member's coaching timeline
    // 3. Save to database
    // 4. Optional: Notify member if shared
    // 5. Link to performance reviews

    console.log('Coaching Note Saved:', note);

    const noteTypeDisplay = noteData.noteType === 'coaching' ? 'Coaching note' :
                             noteData.noteType === 'general' ? 'General note' : 'Meeting note';

    showToast(`${noteTypeDisplay} added for ${member.name}`, 'success');

    setNoteModalOpen(false);
  };

  const handleDocumentShare = async (documentData: {
    documentSource: 'library' | 'upload';
    documentName: string;
    documentType?: string;
    file?: File;
    message: string;
    permission: 'view' | 'edit' | 'download';
    expires: 'never' | '7days' | '30days' | '90days';
  }) => {
    // Create activity log
    const activity = {
      id: `document-${Date.now()}`,
      type: 'Document Shared' as const,
      documentName: documentData.documentName,
      documentType: documentData.documentType,
      sharedWith: member.name,
      sharedWithEmail: member.email,
      sharedBy: currentRole,
      documentSource: documentData.documentSource,
      fileSize: documentData.file ? `${(documentData.file.size / 1024).toFixed(0)} KB` : 'N/A',
      message: documentData.message,
      permission: documentData.permission,
      expires: documentData.expires,
      timestamp: new Date().toISOString(),
      status: 'Shared' as const
    };

    // In a real app, this would:
    // 1. Upload document (if new)
    // 2. Grant permissions to Sarah Chen
    // 3. Send email notification with link
    // 4. Add to Shared Documents section
    // 5. Sync with Google Drive/Dropbox if connected
    // 6. Track document views and downloads

    console.log('Document Shared Activity:', activity);

    showToast(`Document shared with ${member.name}`, 'success');

    setDocumentModalOpen(false);
  };

  // More Actions handlers
  const handleViewPerformanceDashboard = () => {
    setMoreActionsOpen(false);
    showToast('Opening performance dashboard...', 'info');
  };

  const handleRefreshData = () => {
    setMoreActionsOpen(false);
    showToast('Refreshing profile data...', 'info');
    setTimeout(() => {
      showToast('Profile data refreshed', 'success');
    }, 1000);
  };

  const handleExportProfile = () => {
    setMoreActionsOpen(false);
    showToast('Generating profile export...', 'info');
    setTimeout(() => {
      showToast('Profile exported successfully', 'success');
    }, 1500);
  };

  const handleCopyProfileLink = () => {
    setMoreActionsOpen(false);
    const profileUrl = `${window.location.origin}/team/${member.id}`;
    navigator.clipboard.writeText(profileUrl);
    showToast('Profile link copied to clipboard', 'success');
  };

  const handleCopyEmail = () => {
    setMoreActionsOpen(false);
    navigator.clipboard.writeText(member.email);
    showToast('Email address copied', 'success');
  };

  const handleUserSettings = () => {
    setMoreActionsOpen(false);
    if (currentRole === 'Admin' || currentRole === 'CEO') {
      navigate('/settings/team');
      showToast('Opening user settings...', 'info');
    } else {
      showToast('Admin access required', 'error');
    }
  };

  const handleViewAuditLog = () => {
    setMoreActionsOpen(false);
    if (currentRole === 'Admin' || currentRole === 'CEO') {
      showToast('Opening audit log...', 'info');
    } else {
      showToast('Admin access required', 'error');
    }
  };

  const saveNote = () => {
    showToast('Coaching note added successfully', 'success');
    setAddNoteOpen(false);
  };

  const updateNote = () => {
    showToast('Coaching note updated successfully', 'success');
    setEditNoteModalOpen(false);
    setSelectedNote(null);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-5 h-5 text-blue-600" />;
      case 'email': return <Mail className="w-5 h-5 text-green-600" />;
      case 'meeting': return <Video className="w-5 h-5 text-purple-600" />;
      case 'task': return <CheckCircle className="w-5 h-5 text-orange-600" />;
      default: return <MessageSquare className="w-5 h-5 text-slate-600" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'call': return 'Call';
      case 'email': return 'Email';
      case 'meeting': return 'Meeting';
      case 'task': return 'Task Completed';
      default: return 'Activity';
    }
  };

  // Support role - No Access
  if (hasNoAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Access Restricted</h2>
          <p className="text-slate-600 mb-6">
            Team member profiles are not available for Support role. Contact your administrator for access.
          </p>
          <button
            onClick={() => navigate('/team')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-8">
        {/* Role Switcher */}
        <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl shadow-sm p-4 mb-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Role-Based View Testing:</h3>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as Role)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CEO">CEO (Full Access)</option>
              <option value="VP">VP (Full Access)</option>
              <option value="Manager">Manager (Own Team)</option>
              <option value="Rep">Rep (No Direct Reports)</option>
              <option value="Admin">Admin (Read-Only)</option>
              <option value="Analyst">Analyst (Read-Only)</option>
              <option value="Support">Support (No Access)</option>
            </select>
          </div>
          <div className="text-xs text-slate-600">
            {currentRole === 'CEO' && '✅ Can view all direct reports, schedule meetings, full access to all data'}
            {currentRole === 'VP' && '✅ Can view direct reports, schedule meetings, view performance data'}
            {currentRole === 'Manager' && '✅ Viewing own team - Full access to direct reports and all actions'}
            {currentRole === 'Rep' && '❌ Direct Reports section hidden - Reps don\'t see team structure'}
            {currentRole === 'Admin' && '⚠️ Read-only access - Can view but not schedule 1-on-1s'}
            {currentRole === 'Analyst' && '⚠️ Read-only access - Data visibility for analysis only'}
            {currentRole === 'Support' && '❌ No access to team performance data'}
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            {navigationState?.from === 'settings' ? (
              <>
                <button
                  onClick={() => navigate('/crm/settings')}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                >
                  Settings
                </button>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <button
                  onClick={handleBackToTeam}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                >
                  Team Management
                </button>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 font-medium">{member.name}</span>
              </>
            ) : (
              <>
                <button
                  onClick={handleBackToTeam}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                >
                  Team
                </button>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700 font-medium">{member.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-white">{member.initials}</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-800">{member.name}</h1>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {member.status}
                  </span>
                </div>
                <p className="text-lg text-slate-600 mb-2">{member.role}</p>
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {member.email}
                  </span>
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {member.phone}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {member.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {member.timezone}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                  <span>Team: <span className="font-medium text-blue-600">{member.team}</span></span>
                  <span>•</span>
                  <span>Department: <span className="font-medium">{member.department}</span></span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {member.employeeNumber}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  Reports to: <button onClick={handleViewManagerProfile} className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">{member.manager}</button> (Director)
                </p>
                <p className="text-sm text-slate-500">
                  Member since: {member.memberSince} | Last active: {member.lastActive}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {canScheduleMeetings && (
              <button
                onClick={handleSchedule1on1}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Schedule 1-on-1
              </button>
            )}
            <button
              onClick={handleViewCalendar}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              View Calendar
            </button>
            <button
              onClick={() => handleSendEmail()}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>
          </div>
        </div>

        {/* Quick Actions Toolbar - Sticky */}
        {showQuickActionsToolbar && (
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-6 py-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-slate-600 font-medium">Quick Actions:</span>

              {canSendEmail && (
                <button
                  onClick={() => handleSendEmail()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
              )}

              {canScheduleCall && (
                <button
                  onClick={handleScheduleCall}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Schedule Call
                </button>
              )}

              {canScheduleMeetingAction && (
                <button
                  onClick={handleScheduleMeeting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  Sched Meeting
                </button>
              )}

              {canCreateTask && (
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Create Task
                </button>
              )}

              {canAddNoteAction && (
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <StickyNote className="w-4 h-4" />
                  Add Note
                </button>
              )}

              {canShareDocument && (
                <button
                  onClick={handleShareDocument}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Document
                </button>
              )}

              {canUseMoreActions && (
                <div className="relative" ref={moreActionsRef}>
                  <button
                    onClick={() => setMoreActionsOpen(!moreActionsOpen)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 flex items-center gap-2"
                  >
                    <MoreVertical className="w-4 h-4" />
                    More Actions
                  </button>

                  {moreActionsOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-20">
                      <button
                        onClick={handleViewPerformanceDashboard}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        View Performance Dashboard
                      </button>
                      <button
                        onClick={() => {
                          handleViewCalendar();
                          setMoreActionsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        View Calendar
                      </button>
                      <button
                        onClick={() => {
                          handleViewAllDeals();
                          setMoreActionsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Briefcase className="w-4 h-4" />
                        View Deals
                      </button>
                      <button
                        onClick={() => {
                          handleViewAllContacts();
                          setMoreActionsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        View Contacts
                      </button>
                      <button
                        onClick={() => {
                          handleViewAllActivities();
                          setMoreActionsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Activity className="w-4 h-4" />
                        View Activities
                      </button>

                      <div className="border-t border-slate-200 my-1"></div>

                      <button
                        onClick={handleRefreshData}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Data
                      </button>
                      <button
                        onClick={handleExportProfile}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Profile (CSV/PDF)
                      </button>
                      <button
                        onClick={handleCopyProfileLink}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Link2 className="w-4 h-4" />
                        Copy Profile Link
                      </button>
                      <button
                        onClick={handleCopyEmail}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Email Address
                      </button>

                      {(currentRole === 'Admin' || currentRole === 'CEO') && (
                        <>
                          <div className="border-t border-slate-200 my-1"></div>
                          <button
                            onClick={handleUserSettings}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            User Settings (Admin only)
                          </button>
                          <button
                            onClick={handleViewAuditLog}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            View Audit Log (Admin only)
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {canViewPerformance && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Performance Metrics
          </h2>
          <div className="grid grid-cols-6 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-700">Active Deals</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{member.metrics.activeDeals}</div>
              <div className="text-xs text-green-600">{member.metrics.activeDealsChange}</div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-700">Total Pipeline</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{member.metrics.totalPipeline}</div>
              <div className="text-xs text-green-600">{member.metrics.pipelineChange}</div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-slate-700">Won Deals</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{member.metrics.wonDeals}</div>
              <div className="text-xs text-slate-500">{member.metrics.wonDealsQ}</div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <h3 className="text-sm font-semibold text-slate-700">Win Rate</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{member.metrics.winRate}%</div>
              <div className="text-xs text-green-600">{member.metrics.winRateComparison}</div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-700">Quota Attainmnt</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{member.metrics.quotaAttainment}%</div>
              <div className="text-xs text-green-600">{member.metrics.quotaStatus}</div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-semibold text-slate-700">Avg Cycle</h3>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">{member.metrics.avgCycle}</div>
              <div className="text-xs text-green-600">{member.metrics.cycleChange}</div>
            </div>
          </div>
        </div>
        )}

        {/* Limited View Message for Rep Role */}
        {hasLimitedView && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Limited Profile View</h3>
                <p className="text-sm text-slate-600">
                  Contact your manager for detailed performance information.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Direct Reports Section - Role-based visibility */}
        {member.directReports && member.directReports.length > 0 && canViewDirectReports && (
          <DirectReportsSection
            reports={member.directReports}
            onViewTeam={() => navigate('/team')}
            onViewProfile={handleViewReportProfile}
            onEmail={canTakeDirectReportActions ? handleEmailReport : undefined}
            onScheduleCall={canTakeDirectReportActions ? handleScheduleCallWithReport : undefined}
            onSchedule1on1={canTakeDirectReportActions && !showDirectReportsReadOnly ? handleSchedule1on1WithReport : undefined}
          />
        )}

        {/* HRMS Connection Section */}
        {canViewHRMS && member.hrmsLeads && member.hrmsLeads.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">HRMS-Sourced Leads</h2>
                <p className="text-sm text-slate-600">
                  {member.name} benefits from {member.hrmsLeads.length} recruitment-powered opportunities
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {member.hrmsLeads.map((lead, index) => {
                const isExpanded = expandedLeads.has(lead.id);
                return (
                  <div key={lead.id} className="bg-white rounded-lg p-6 border border-orange-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-800">
                            {index + 1}. {lead.company}
                          </h3>
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                            {lead.companyIndustry}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {lead.companySize}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            {lead.companyRevenue}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">
                          <span className="font-semibold">Contact:</span> {lead.contact} ({lead.contactTitle})
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {lead.contactEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.contactPhone}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">
                          <span className="font-semibold">Recruited:</span> {lead.recruitedDate} as {lead.recruitedPosition} | <span className="font-semibold">Stage:</span> <span className="text-blue-600 font-medium">{lead.stage}</span>
                        </p>
                        <p className="text-sm text-slate-600 mb-1">
                          <span className="font-semibold">Close Probability:</span> {lead.probability}% <span className="text-orange-600 font-medium">(+{lead.hrmsBonus}% HRMS bonus)</span> | <span className="font-semibold">Close:</span> {lead.closeDate}
                        </p>
                        <p className="text-xs text-slate-500">
                          Deal Age: {lead.dealAge} | Last Activity: {lead.lastActivity}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-slate-800">{lead.value}</div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        Recruitment Context
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{lead.context}</p>
                    </div>

                    <button
                      onClick={() => toggleLeadExpansion(lead.id)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 mb-3"
                    >
                      <span>View Detailed Intelligence</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div className="space-y-3 mb-4 border-t border-orange-200 pt-4">
                        <div className="bg-slate-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            Key Decision Makers
                          </h4>
                          <ul className="space-y-1">
                            {lead.decisionMakers.map((dm, i) => (
                              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>{dm}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                            Pain Points Identified
                          </h4>
                          <ul className="space-y-1">
                            {lead.painPoints.map((pp, i) => (
                              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                <span className="text-orange-600 mt-1">•</span>
                                <span>{pp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Next Steps
                          </h4>
                          <ul className="space-y-1">
                            {lead.nextSteps.map((step, i) => (
                              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                <span className="text-green-600 mt-1">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewLead(lead.id, lead.company)}
                        className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        View Lead Details
                      </button>
                      <button
                        onClick={() => handleViewDeal(lead.id, lead.company)}
                        className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        View Deal
                      </button>
                      <button
                        onClick={() => handleContactAction(lead.contact)}
                        className="px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Contact {lead.contact.split(' ')[0]}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 mb-4">
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-800 mb-2">HRMS Lead Advantage:</h4>
                  <p className="text-sm text-slate-700 mb-3">
                    These recruitment-sourced leads have a {HRMS_SUMMARY.hrmsAdvantage} higher close rate compared to cold outreach.
                    Total HRMS pipeline: {HRMS_SUMMARY.totalPipeline}
                  </p>
                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="text-slate-600">Avg Probability</div>
                      <div className="font-semibold text-slate-800">{HRMS_SUMMARY.avgProbability}</div>
                    </div>
                    <div>
                      <div className="text-slate-600">Conversion Rate</div>
                      <div className="font-semibold text-slate-800">{HRMS_SUMMARY.conversionRate}</div>
                    </div>
                    <div>
                      <div className="text-slate-600">HRMS Cycle</div>
                      <div className="font-semibold text-slate-800">{HRMS_SUMMARY.avgSalesCycle}</div>
                    </div>
                    <div>
                      <div className="text-slate-600">Cold Cycle</div>
                      <div className="font-semibold text-slate-800">{HRMS_SUMMARY.coldSalesCycle}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/hrms/dashboard')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              View in HRMS System
            </button>
          </div>
        )}

        {/* Assigned Deals */}
        {canViewDeals && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-600" />
              Assigned Deals ({DEALS.length} active)
            </h2>
            <button
              onClick={handleViewAllDeals}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 hover:underline transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold text-slate-700">Deal Name</th>
                  <th className="pb-3 text-sm font-semibold text-slate-700">Contact</th>
                  <th className="pb-3 text-sm font-semibold text-slate-700">Value</th>
                  <th className="pb-3 text-sm font-semibold text-slate-700">Stage</th>
                  <th className="pb-3 text-sm font-semibold text-slate-700">Probability</th>
                  <th className="pb-3 text-sm font-semibold text-slate-700">Age</th>
                  <th className="pb-3 text-sm font-semibold text-slate-700">Close Date</th>
                  <th className="pb-3 text-sm font-semibold text-slate-700">Next Step</th>
                </tr>
              </thead>
              <tbody>
                {DEALS.map((deal) => (
                  <tr key={deal.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {deal.isHRMS && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewHRMS(member.hrmsLeads?.find(l => l.company === deal.name) || member.hrmsLeads?.[0]!);
                              }}
                              className="hover:scale-110 transition-transform"
                              title="HRMS-sourced lead (+33% close rate)"
                            >
                              <Building2 className="w-4 h-4 text-orange-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleViewDeal(deal.id, deal.fullName)}
                            className="font-medium text-slate-800 hover:text-blue-600 hover:underline text-left transition-colors"
                          >
                            {deal.name}
                          </button>
                        </div>
                        <span className="text-xs text-slate-500">{deal.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-slate-700">{deal.contact}</td>
                    <td className="py-3 text-sm font-medium text-slate-800">{deal.value}</td>
                    <td className="py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        deal.stage === 'Negotiation' ? 'bg-green-100 text-green-700' :
                        deal.stage === 'Proposal' ? 'bg-blue-100 text-blue-700' :
                        deal.stage === 'Qualified' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {deal.stage}
                      </span>
                    </td>
                    <td className="py-3 text-sm">
                      <span className={`font-medium ${
                        deal.probability >= 70 ? 'text-green-600' :
                        deal.probability >= 50 ? 'text-yellow-600' :
                        'text-slate-600'
                      }`}>
                        {deal.probability}%
                      </span>
                    </td>
                    <td className="py-3 text-sm text-slate-600">{deal.age}</td>
                    <td className="py-3 text-sm text-slate-600">{deal.closeDate}</td>
                    <td className="py-3 text-sm">
                      <span className="text-slate-700 text-xs">{deal.nextStep}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-slate-500 text-center">
            Showing 5 of 12 deals
          </div>
        </div>
        )}

        {/* Assigned Contacts */}
        {canViewContacts && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Assigned Contacts (24 contacts)
            </h2>
            <button
              onClick={handleViewAllContacts}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 hover:underline transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold text-slate-700">Contact Name</th>
                  <th className="pb-3 text-sm font-semibold text-slate-700">Company</th>
                  <th className="pb-3 text-sm font-semibold text-slate-700">Title</th>
                  <th className="pb-3 text-sm font-semibold text-slate-700">Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {CONTACTS.map((contact) => (
                  <tr key={contact.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {contact.isHRMS && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewHRMS(member.hrmsLeads?.[0]!);
                            }}
                            className="hover:scale-110 transition-transform"
                            title="Recruited employee (warm connection)"
                          >
                            <Building2 className="w-4 h-4 text-orange-600" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewContact(contact.id, contact.name)}
                          className="font-medium text-slate-800 hover:text-blue-600 hover:underline text-left transition-colors"
                        >
                          {contact.name}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-sm">
                      <button
                        onClick={() => handleViewAccount(contact.id, contact.company)}
                        className="text-slate-600 hover:text-blue-600 hover:underline transition-colors"
                      >
                        {contact.company}
                      </button>
                    </td>
                    <td className="py-3 text-sm text-slate-600">{contact.title}</td>
                    <td className="py-3 text-sm text-slate-600">{contact.lastContact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-slate-500 text-center">
            Showing 5 of 24 contacts
          </div>
        </div>
        )}

        {/* Recent Activity */}
        {canViewActivities && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Recent Activity (47 Total, Showing 5)
            </h2>
            <button
              onClick={handleViewAllActivities}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 hover:underline transition-colors"
            >
              View All Activities <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {ACTIVITIES.map((activity) => {
              const isExpanded = expandedActivities.has(activity.id);
              return (
              <div
                key={activity.id}
                onClick={() => toggleActivityExpansion(activity.id)}
                className="bg-slate-50 rounded-lg p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 bg-white rounded-lg border-2 border-slate-200 flex items-center justify-center text-xl">
                      {activity.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            activity.type === 'call' ? 'bg-blue-100 text-blue-700' :
                            activity.type === 'email' ? 'bg-purple-100 text-purple-700' :
                            activity.type === 'meeting' ? 'bg-green-100 text-green-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {getActivityLabel(activity.type)}
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-600">{activity.relativeDate}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 mb-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewContact('c1', activity.contact);
                            }}
                            className="hover:text-blue-600 hover:underline transition-colors"
                          >
                            {activity.contact}
                          </button>
                          {' - '}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewAccount('a1', activity.company);
                            }}
                            className="hover:text-blue-600 hover:underline transition-colors"
                          >
                            {activity.company}
                          </button>
                        </h3>
                        <p className="text-xs text-slate-500 mb-2">{activity.date}</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center gap-1 text-sm mb-1">
                          <span>{activity.sentimentEmoji}</span>
                          <span className={`font-medium ${
                            activity.sentiment.includes('Positive') ? 'text-green-600' :
                            activity.sentiment.includes('Neutral') ? 'text-slate-600' :
                            'text-yellow-600'
                          }`}>
                            {activity.sentiment}
                          </span>
                        </div>
                      </div>
                    </div>

                    {activity.duration && (
                      <div className="flex items-center gap-3 text-xs text-slate-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Duration: {activity.duration}
                        </span>
                        {activity.attendees && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {activity.attendees} attendees
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-lg p-3 mb-3">
                      <h4 className="text-xs font-semibold text-slate-700 mb-1">Subject:</h4>
                      <p className="text-sm font-medium text-slate-800 mb-2">{activity.subject}</p>
                      <h4 className="text-xs font-semibold text-slate-700 mb-1">Description:</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{activity.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-white border border-slate-200 rounded-lg p-2">
                        <div className="text-xs text-slate-600 mb-0.5">Outcome</div>
                        <div className={`text-sm font-medium ${
                          activity.outcome === 'Positive' || activity.outcome === 'Excellent' || activity.outcome === 'Qualified' || activity.outcome === 'Completed' ? 'text-green-600' :
                          activity.outcome === 'Pending Response' ? 'text-yellow-600' :
                          'text-slate-700'
                        }`}>
                          {activity.outcome}
                        </div>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-2">
                        <div className="text-xs text-slate-600 mb-0.5">Next Action</div>
                        <div className="text-sm font-medium text-blue-600">{activity.nextAction}</div>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-2">
                        <div className="text-xs text-slate-600 mb-0.5">Related Deal</div>
                        <div className="text-sm font-medium text-slate-800">{activity.relatedDeal}</div>
                        <div className="text-xs text-slate-600">{activity.relatedDealValue}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">Tags:</span>
                      {activity.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-300 flex items-center justify-center">
                  <button
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActivityExpansion(activity.id);
                    }}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Show More Details
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xs text-slate-600 mb-1">Phone Calls</div>
                <div className="text-lg font-bold text-slate-800">18</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-600 mb-1">Emails</div>
                <div className="text-lg font-bold text-slate-800">15</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-600 mb-1">Meetings</div>
                <div className="text-lg font-bold text-slate-800">8</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-600 mb-1">Tasks</div>
                <div className="text-lg font-bold text-slate-800">6</div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-1">
                Date Range: Last 90 days | Most Active: Last 30 days (32 activities) | Avg: 12 activities/week
              </p>
              <p className="text-sm text-slate-500">
                Showing 5 of 47 total activities
              </p>
            </div>
          </div>
        </div>
        )}

        {/* Coaching Notes */}
        {canViewCoachingNotes && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                Coaching Notes (3 Total, Showing All)
              </h2>
              {canAddNotes && (
                <button
                  onClick={() => setAddNoteOpen(!addNoteOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900 mb-2">Coaching Notes Permissions:</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="font-semibold text-amber-800 mb-1">Who Can View:</div>
                      <ul className="text-amber-700 space-y-0.5">
                        <li>• Manager: View, Add, Edit, Delete all notes</li>
                        <li>• CEO: View, Add notes (cannot edit others' notes)</li>
                        <li>• VP: View, Add notes (for department members only)</li>
                        <li>• Admin, Analyst: View all notes (read-only)</li>
                        <li>• Rep: Cannot view coaching notes</li>
                        <li>• Support: No access to team member profiles</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-amber-800 mb-1">Who Can Add Notes:</div>
                      <ul className="text-amber-700 space-y-0.5">
                        <li>• Manager: Can add/edit/delete all notes</li>
                        <li>• CEO: Can add notes (cannot edit others')</li>
                        <li>• VP: Can add notes for department members</li>
                        <li>• Admin, Analyst, Rep, Support: Cannot add notes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {addNoteOpen && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5 mb-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">New Coaching Note</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Note Content</label>
                    <textarea
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={5}
                      placeholder="Enter detailed coaching note..."
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Focus Areas (comma separated)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Scale HRMS strategy, Mentor team, Improve qualification"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Development Goals (comma separated)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Complete certification, Document playbook"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Performance Rating</label>
                    <select className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Exceeding Expectations</option>
                      <option>Exceeds Expectations</option>
                      <option>Meets Expectations</option>
                      <option>Needs Improvement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Achievement (optional)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Notable achievements or milestones"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={saveNote}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Save Note
                  </button>
                  <button
                    onClick={() => setAddNoteOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {COACHING_NOTES.map((note, index) => (
                <div key={note.id} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-6 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-800">
                          Coaching Note {index + 1}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {note.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">{note.date}</span>
                        </span>
                        <span>•</span>
                        <span>
                          Author: <span className="font-medium text-blue-600">{note.author}</span> ({note.authorTitle}, Manager ID: {note.managerId})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {note.visibility}
                        </span>
                      </div>
                    </div>
                    {canEditNotes && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit note"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note)}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
                    <h4 className="text-xs font-semibold text-slate-700 mb-2">Note Content:</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{note.content}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                        <Target className="w-3 h-3 text-blue-600" />
                        Focus Areas:
                      </h4>
                      <ul className="space-y-1">
                        {note.focusAreas.map((area, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {note.developmentGoals && (
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          Development Goals:
                        </h4>
                        <ul className="space-y-1">
                          {note.developmentGoals.map((goal, idx) => (
                            <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-green-600 mt-0.5">•</span>
                              <span>{goal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">Performance Rating:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        note.performanceRating.includes('Exceeding') || note.performanceRating.includes('Exceeds')
                          ? 'bg-green-100 text-green-700'
                          : note.performanceRating.includes('Meets')
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {note.performanceRating}
                      </span>
                    </div>

                    {note.achievement && (
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs font-semibold text-slate-700">Achievement:</span>
                        <span className="text-xs font-medium text-green-600">{note.achievement}</span>
                      </div>
                    )}

                    {note.nextReview && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-slate-700">Next Review:</span>
                        <span className="text-xs font-medium text-blue-600">{note.nextReview}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Actions Available: <span className="font-medium">Edit, Delete</span> (Manager+ only)
                    </span>
                    <span className="text-xs text-slate-500">
                      Role Access: <span className="font-medium">{currentRole}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-sm text-slate-500 text-center">
              Showing 3 of 3 total coaching notes
            </div>
          </div>
        )}
      </div>

      {/* Schedule 1-on-1 Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Schedule 1-on-1 with {member.name}</h2>
              <button onClick={() => setScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                <input type="date" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Time</label>
                <input type="time" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Duration</label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Meeting Topic</label>
                <input type="text" placeholder="e.g., Q4 Performance Review" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Location / Link</label>
                <input type="text" placeholder="Office or Zoom link" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={saveSchedule} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Schedule Meeting
                </button>
                <button onClick={() => setScheduleModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      <TeamEmailComposerModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        memberName={member.name}
        memberEmail={member.email}
        currentUserEmail="john.smith@company.com"
        onSend={handleEmailSend}
        onSaveDraft={handleEmailSaveDraft}
      />

      {/* Contact Action Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Contact {selectedContact}</h2>
              <button onClick={() => setContactModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              <button onClick={() => { setContactModalOpen(false); handleSendEmail(selectedContact); }} className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-3">
                <Mail className="w-5 h-5" />
                Send Email
              </button>
              <button onClick={() => { setContactModalOpen(false); handleSchedule1on1(); }} className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                Schedule Call
              </button>
              <button onClick={() => { setContactModalOpen(false); showToast('Activity logged successfully', 'success'); }} className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-3">
                <FileText className="w-5 h-5" />
                Log Activity
              </button>
              <button onClick={() => { setContactModalOpen(false); handleViewContact('c1', selectedContact); }} className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-3">
                <Users className="w-5 h-5" />
                View Contact Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HRMS Info Modal */}
      {hrmsModalOpen && selectedHrmsLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">HRMS Connection Details</h2>
                <p className="text-sm text-slate-600 mt-1">{selectedHrmsLead.company}</p>
              </div>
              <button onClick={() => setHrmsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-blue-900 mb-2">Recruited Employee</h3>
                <p className="text-lg font-semibold text-blue-800">{selectedHrmsLead.recruitedEmployee}</p>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div>
                    <span className="text-slate-600">Position:</span>
                    <p className="font-medium text-slate-800">{selectedHrmsLead.recruitedPosition}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Recruited Date:</span>
                    <p className="font-medium text-slate-800">{selectedHrmsLead.recruitedDate}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Recruited By:</span>
                    <p className="font-medium text-slate-800">{selectedHrmsLead.recruitedBy}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Status:</span>
                    <p className="font-medium text-green-600">{selectedHrmsLead.employmentStatus}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-2">HRMS Advantage</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedHrmsLead.context}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setHrmsModalOpen(false); handleViewDeal(selectedHrmsLead.id, selectedHrmsLead.company); }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  View Full Deal
                </button>
                <button onClick={() => setHrmsModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editNoteModalOpen && selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Edit Coaching Note</h2>
              <button onClick={() => setEditNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Note Content</label>
                <textarea rows={6} defaultValue={selectedNote.content} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Focus Areas (comma separated)</label>
                <input type="text" defaultValue={selectedNote.focusAreas.join(', ')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Development Goals (comma separated)</label>
                <input type="text" defaultValue={selectedNote.developmentGoals?.join(', ')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Performance Rating</label>
                <select defaultValue={selectedNote.performanceRating} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Exceeding Expectations</option>
                  <option>Exceeds Expectations</option>
                  <option>Meets Expectations</option>
                  <option>Needs Improvement</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={updateNote} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Update Note
                </button>
                <button onClick={() => setEditNoteModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Note Confirmation Modal */}
      {deleteNoteModalOpen && selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Delete Coaching Note?</h2>
              <button onClick={() => setDeleteNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. The coaching note from {selectedNote.date} will be permanently deleted.
                </p>
              </div>
              <p className="text-sm text-slate-700">
                Are you sure you want to delete this coaching note? All information including focus areas, development goals, and performance ratings will be lost.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={confirmDeleteNote} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                Delete Note
              </button>
              <button onClick={() => setDeleteNoteModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Call Modal */}
      <ScheduleCallModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        memberName={member.name}
        memberEmail={member.email}
        memberPhone={member.phone}
        memberTimezone={member.timezone}
        onSchedule={handleCallSchedule}
      />

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={meetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        memberName={member.name}
        memberEmail={member.email}
        memberTimezone={member.timezone}
        onSchedule={handleMeetingSchedule}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        memberName={member.name}
        memberEmail={member.email}
        onCreateTask={handleTaskCreate}
      />

      {/* Add Note Modal */}
      <AddNoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        memberName={member.name}
        memberEmail={member.email}
        onSaveNote={handleNoteSave}
      />

      {/* Share Document Modal */}
      <ShareDocumentModal
        isOpen={documentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
        memberName={member.name}
        memberEmail={member.email}
        onShare={handleDocumentShare}
      />

      {/* Schedule 1-on-1 Modal for Direct Reports */}
      {oneOnOneModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Schedule 1-on-1</h2>
              <button onClick={() => setOneOnOneModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Team Member
                </label>
                <input
                  type="text"
                  value={member.directReports?.find(r => r.id === selectedReportId)?.name || ''}
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meeting Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meeting Type
                </label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Performance Review</option>
                  <option>Career Development</option>
                  <option>Goal Setting</option>
                  <option>Coaching Session</option>
                  <option>General Check-in</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Agenda Items
                </label>
                <textarea
                  rows={4}
                  placeholder="List topics to discuss..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  showToast('1-on-1 scheduled successfully', 'success');
                  setOneOnOneModalOpen(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Schedule 1-on-1
              </button>
              <button
                onClick={() => setOneOnOneModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Document Modal */}
      {shareDocModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Share Document</h2>
              <button
                onClick={() => setShareDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Document
                </label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Q4 Performance Review.pdf</option>
                  <option>Sales Playbook 2026.pdf</option>
                  <option>Product Training Guide.pdf</option>
                  <option>Territory Plan Q1.pdf</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Share with
                </label>
                <input
                  type="text"
                  defaultValue={member.email}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Add a message..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-slate-700">Allow editing</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  showToast('Document shared successfully', 'success');
                  setShareDocModalOpen(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Share Document
              </button>
              <button
                onClick={() => setShareDocModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {addTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Create Task</h2>
              <button
                onClick={() => setAddTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Follow up with customer..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assign To
                </label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>{member.name}</option>
                  <option>Myself</option>
                  <option>Other team member...</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priority
                  </label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Task details..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  showToast('Task created successfully', 'success');
                  setAddTaskModalOpen(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Task
              </button>
              <button
                onClick={() => setAddTaskModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
