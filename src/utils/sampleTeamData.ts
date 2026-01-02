import { TeamMember, Team, TeamActivity, TeamStats, Territory, TeamGoal, TeamLeaderboard } from '../types/team';

export const teamMembers: TeamMember[] = [
  {
    id: 'tm_001',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    avatar: 'SC',
    role: 'sales_manager',
    title: 'Sales Manager',
    department: 'Sales',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    status: 'active',
    joinedDate: '2023-01-15',
    territory: 'West Coast',
    quota: 500000,
    performance: {
      dealsWon: 45,
      dealsClosed: 52,
      revenue: 2340000,
      quotaAttainment: 117,
      activitiesLogged: 342,
      averageResponseTime: 2.3
    },
    metrics: {
      leadsConverted: 78,
      avgDealSize: 45000,
      winRate: 86.5,
      pipelineValue: 890000
    },
    permissions: ['all'],
    lastActive: new Date().toISOString(),
    skills: ['Enterprise Sales', 'SaaS', 'Negotiation', 'Team Leadership']
  },
  {
    id: 'tm_002',
    name: 'Michael Rodriguez',
    email: 'michael.r@company.com',
    avatar: 'MR',
    role: 'account_executive',
    title: 'Senior Account Executive',
    department: 'Sales',
    phone: '+1 (555) 234-5678',
    location: 'New York, NY',
    status: 'active',
    joinedDate: '2023-03-22',
    reportsTo: 'tm_001',
    territory: 'East Coast',
    quota: 400000,
    performance: {
      dealsWon: 38,
      dealsClosed: 42,
      revenue: 1840000,
      quotaAttainment: 115,
      activitiesLogged: 298,
      averageResponseTime: 1.8
    },
    metrics: {
      leadsConverted: 65,
      avgDealSize: 48000,
      winRate: 90.5,
      pipelineValue: 720000
    },
    permissions: ['deals', 'leads', 'contacts', 'activities'],
    lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    skills: ['Enterprise Sales', 'Account Management', 'Closing', 'Prospecting']
  },
  {
    id: 'tm_003',
    name: 'Emily Johnson',
    email: 'emily.j@company.com',
    avatar: 'EJ',
    role: 'account_executive',
    title: 'Account Executive',
    department: 'Sales',
    phone: '+1 (555) 345-6789',
    location: 'Austin, TX',
    status: 'active',
    joinedDate: '2023-06-10',
    reportsTo: 'tm_001',
    territory: 'Central',
    quota: 350000,
    performance: {
      dealsWon: 32,
      dealsClosed: 38,
      revenue: 1520000,
      quotaAttainment: 108,
      activitiesLogged: 276,
      averageResponseTime: 2.1
    },
    metrics: {
      leadsConverted: 58,
      avgDealSize: 40000,
      winRate: 84.2,
      pipelineValue: 650000
    },
    permissions: ['deals', 'leads', 'contacts', 'activities'],
    lastActive: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    skills: ['Mid-Market Sales', 'Product Demos', 'Relationship Building']
  },
  {
    id: 'tm_004',
    name: 'David Kim',
    email: 'david.kim@company.com',
    avatar: 'DK',
    role: 'sales_development_rep',
    title: 'Sales Development Representative',
    department: 'Sales',
    phone: '+1 (555) 456-7890',
    location: 'Seattle, WA',
    status: 'active',
    joinedDate: '2024-01-08',
    reportsTo: 'tm_001',
    quota: 150000,
    performance: {
      dealsWon: 18,
      dealsClosed: 22,
      revenue: 680000,
      quotaAttainment: 113,
      activitiesLogged: 412,
      averageResponseTime: 1.5
    },
    metrics: {
      leadsConverted: 92,
      avgDealSize: 31000,
      winRate: 81.8,
      pipelineValue: 380000
    },
    permissions: ['leads', 'contacts', 'activities'],
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    skills: ['Cold Calling', 'Lead Qualification', 'Email Outreach', 'BANT']
  },
  {
    id: 'tm_005',
    name: 'Jessica Martinez',
    email: 'jessica.m@company.com',
    avatar: 'JM',
    role: 'account_executive',
    title: 'Account Executive',
    department: 'Sales',
    phone: '+1 (555) 567-8901',
    location: 'Chicago, IL',
    status: 'away',
    joinedDate: '2023-08-15',
    reportsTo: 'tm_001',
    territory: 'Midwest',
    quota: 380000,
    performance: {
      dealsWon: 28,
      dealsClosed: 35,
      revenue: 1420000,
      quotaAttainment: 93,
      activitiesLogged: 245,
      averageResponseTime: 2.7
    },
    metrics: {
      leadsConverted: 51,
      avgDealSize: 41000,
      winRate: 80.0,
      pipelineValue: 590000
    },
    permissions: ['deals', 'leads', 'contacts', 'activities'],
    lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    skills: ['SMB Sales', 'Consultative Selling', 'Follow-up']
  },
  {
    id: 'tm_006',
    name: 'Robert Taylor',
    email: 'robert.t@company.com',
    avatar: 'RT',
    role: 'sales_development_rep',
    title: 'SDR',
    department: 'Sales',
    phone: '+1 (555) 678-9012',
    location: 'Boston, MA',
    status: 'active',
    joinedDate: '2024-02-20',
    reportsTo: 'tm_001',
    quota: 140000,
    performance: {
      dealsWon: 15,
      dealsClosed: 19,
      revenue: 580000,
      quotaAttainment: 103,
      activitiesLogged: 389,
      averageResponseTime: 1.9
    },
    metrics: {
      leadsConverted: 86,
      avgDealSize: 30500,
      winRate: 78.9,
      pipelineValue: 340000
    },
    permissions: ['leads', 'contacts', 'activities'],
    lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    skills: ['Prospecting', 'Social Selling', 'Discovery Calls']
  },
  {
    id: 'tm_007',
    name: 'Amanda Wilson',
    email: 'amanda.w@company.com',
    avatar: 'AW',
    role: 'customer_success',
    title: 'Customer Success Manager',
    department: 'Customer Success',
    phone: '+1 (555) 789-0123',
    location: 'Denver, CO',
    status: 'active',
    joinedDate: '2023-05-12',
    quota: 200000,
    performance: {
      dealsWon: 22,
      dealsClosed: 24,
      revenue: 980000,
      quotaAttainment: 122,
      activitiesLogged: 318,
      averageResponseTime: 1.2
    },
    metrics: {
      leadsConverted: 42,
      avgDealSize: 41000,
      winRate: 91.7,
      pipelineValue: 420000
    },
    permissions: ['contacts', 'accounts', 'activities'],
    lastActive: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    skills: ['Customer Retention', 'Upselling', 'Account Management', 'Support']
  },
  {
    id: 'tm_008',
    name: 'James Anderson',
    email: 'james.a@company.com',
    avatar: 'JA',
    role: 'account_executive',
    title: 'Account Executive',
    department: 'Sales',
    phone: '+1 (555) 890-1234',
    location: 'Miami, FL',
    status: 'offline',
    joinedDate: '2023-09-28',
    reportsTo: 'tm_001',
    territory: 'Southeast',
    quota: 360000,
    performance: {
      dealsWon: 26,
      dealsClosed: 32,
      revenue: 1280000,
      quotaAttainment: 89,
      activitiesLogged: 218,
      averageResponseTime: 3.1
    },
    metrics: {
      leadsConverted: 48,
      avgDealSize: 40000,
      winRate: 81.3,
      pipelineValue: 520000
    },
    permissions: ['deals', 'leads', 'contacts', 'activities'],
    lastActive: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    skills: ['Territory Management', 'Relationship Building', 'Forecasting']
  }
];

export const teams: Team[] = [
  {
    id: 'team_001',
    name: 'Enterprise Sales Team',
    description: 'Focused on closing large enterprise deals',
    leaderId: 'tm_001',
    members: ['tm_001', 'tm_002', 'tm_003'],
    createdDate: '2023-01-01',
    quota: 1250000,
    territory: 'National',
    performance: {
      totalRevenue: 5700000,
      quotaAttainment: 114,
      dealsWon: 115,
      avgDealCycle: 45
    }
  },
  {
    id: 'team_002',
    name: 'SDR Team',
    description: 'Lead generation and qualification team',
    leaderId: 'tm_001',
    members: ['tm_004', 'tm_006'],
    createdDate: '2023-01-01',
    quota: 290000,
    performance: {
      totalRevenue: 1260000,
      quotaAttainment: 108,
      dealsWon: 33,
      avgDealCycle: 32
    }
  }
];

export const recentTeamActivities: TeamActivity[] = [
  {
    id: 'ta_001',
    userId: 'tm_002',
    userName: 'Michael Rodriguez',
    userAvatar: 'MR',
    action: 'Won Deal',
    description: 'Closed $85,000 deal with TechCorp Industries',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    type: 'deal',
    relatedId: 'deal_001',
    relatedName: 'TechCorp Industries - Platform License'
  },
  {
    id: 'ta_002',
    userId: 'tm_004',
    userName: 'David Kim',
    userAvatar: 'DK',
    action: 'Qualified Lead',
    description: 'Qualified lead from Enterprise Co. - Budget: $120K',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    type: 'lead',
    relatedId: 'lead_001',
    relatedName: 'Enterprise Co.'
  },
  {
    id: 'ta_003',
    userId: 'tm_003',
    userName: 'Emily Johnson',
    userAvatar: 'EJ',
    action: 'Scheduled Meeting',
    description: 'Demo call scheduled with CloudScale Inc.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: 'meeting',
    relatedId: 'meeting_001',
    relatedName: 'CloudScale Inc. - Product Demo'
  },
  {
    id: 'ta_004',
    userId: 'tm_007',
    userName: 'Amanda Wilson',
    userAvatar: 'AW',
    action: 'Upsold Customer',
    description: 'Expanded license for DataFlow Systems ($42K)',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    type: 'deal',
    relatedId: 'deal_002',
    relatedName: 'DataFlow Systems - Expansion'
  },
  {
    id: 'ta_005',
    userId: 'tm_005',
    userName: 'Jessica Martinez',
    userAvatar: 'JM',
    action: 'Created Proposal',
    description: 'Sent proposal to Innovate Labs',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    type: 'activity',
    relatedId: 'activity_001',
    relatedName: 'Innovate Labs Proposal'
  },
  {
    id: 'ta_006',
    userId: 'tm_006',
    userName: 'Robert Taylor',
    userAvatar: 'RT',
    action: 'Completed Call',
    description: '30 cold calls completed - 8 new leads generated',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    type: 'activity'
  },
  {
    id: 'ta_007',
    userId: 'tm_002',
    userName: 'Michael Rodriguez',
    userAvatar: 'MR',
    action: 'Moved Deal',
    description: 'Advanced Global Systems to Negotiation stage',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    type: 'deal',
    relatedId: 'deal_003',
    relatedName: 'Global Systems - Enterprise Plan'
  },
  {
    id: 'ta_008',
    userId: 'tm_003',
    userName: 'Emily Johnson',
    userAvatar: 'EJ',
    action: 'Updated Contact',
    description: 'Added new decision maker at Acme Corp',
    timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    type: 'contact',
    relatedId: 'contact_001',
    relatedName: 'John Doe - Acme Corp'
  }
];

export const teamStats: TeamStats = {
  totalMembers: 8,
  activeMembers: 6,
  totalRevenue: 8640000,
  quotaAttainment: 112,
  dealsWon: 148,
  dealsInProgress: 67,
  avgDealSize: 42300,
  avgWinRate: 84.3,
  totalPipeline: 3610000,
  activitiesThisWeek: 487
};

export const territories: Territory[] = [
  {
    id: 'terr_001',
    name: 'West Coast',
    region: 'CA, OR, WA, NV',
    assignedTo: ['tm_001', 'tm_004'],
    accounts: 145,
    revenue: 3200000,
    quota: 2800000,
    color: '#3b82f6'
  },
  {
    id: 'terr_002',
    name: 'East Coast',
    region: 'NY, MA, PA, NJ',
    assignedTo: ['tm_002', 'tm_006'],
    accounts: 132,
    revenue: 2840000,
    quota: 2600000,
    color: '#10b981'
  },
  {
    id: 'terr_003',
    name: 'Central',
    region: 'TX, OK, KS',
    assignedTo: ['tm_003'],
    accounts: 98,
    revenue: 1520000,
    quota: 1400000,
    color: '#f59e0b'
  },
  {
    id: 'terr_004',
    name: 'Midwest',
    region: 'IL, MI, OH, IN',
    assignedTo: ['tm_005'],
    accounts: 87,
    revenue: 1420000,
    quota: 1500000,
    color: '#8b5cf6'
  },
  {
    id: 'terr_005',
    name: 'Southeast',
    region: 'FL, GA, NC, SC',
    assignedTo: ['tm_008'],
    accounts: 76,
    revenue: 1280000,
    quota: 1400000,
    color: '#ef4444'
  }
];

export const teamGoals: TeamGoal[] = [
  {
    id: 'goal_001',
    title: 'Q1 Revenue Target',
    description: 'Hit $2.5M in revenue for Q1 2026',
    targetValue: 2500000,
    currentValue: 2340000,
    unit: 'revenue',
    deadline: '2026-03-31',
    assignedTo: ['tm_001', 'tm_002', 'tm_003'],
    priority: 'high',
    status: 'on-track'
  },
  {
    id: 'goal_002',
    title: 'Enterprise Deals',
    description: 'Close 15 enterprise deals this quarter',
    targetValue: 15,
    currentValue: 12,
    unit: 'deals',
    deadline: '2026-03-31',
    assignedTo: ['tm_002', 'tm_003'],
    priority: 'high',
    status: 'on-track'
  },
  {
    id: 'goal_003',
    title: 'Lead Generation',
    description: 'Generate 500 qualified leads',
    targetValue: 500,
    currentValue: 420,
    unit: 'activities',
    deadline: '2026-02-28',
    assignedTo: ['tm_004', 'tm_006'],
    priority: 'medium',
    status: 'at-risk'
  },
  {
    id: 'goal_004',
    title: 'Product Demos',
    description: 'Conduct 100 product demonstrations',
    targetValue: 100,
    currentValue: 67,
    unit: 'meetings',
    deadline: '2026-03-15',
    assignedTo: ['tm_003', 'tm_005'],
    priority: 'medium',
    status: 'behind'
  },
  {
    id: 'goal_005',
    title: 'Customer Expansion',
    description: 'Upsell 20 existing customers',
    targetValue: 20,
    currentValue: 22,
    unit: 'deals',
    deadline: '2026-02-28',
    assignedTo: ['tm_007'],
    priority: 'low',
    status: 'completed'
  }
];

export const leaderboard: TeamLeaderboard = {
  period: 'month',
  rankings: [
    {
      memberId: 'tm_002',
      memberName: 'Michael Rodriguez',
      avatar: 'MR',
      rank: 1,
      score: 1840000,
      metric: 'Revenue',
      change: 2,
      badges: ['Top Performer', 'Deal Closer', 'Quick Response']
    },
    {
      memberId: 'tm_003',
      memberName: 'Emily Johnson',
      avatar: 'EJ',
      rank: 2,
      score: 1520000,
      metric: 'Revenue',
      change: 1,
      badges: ['Consistent', 'Team Player']
    },
    {
      memberId: 'tm_005',
      memberName: 'Jessica Martinez',
      avatar: 'JM',
      rank: 3,
      score: 1420000,
      metric: 'Revenue',
      change: -1,
      badges: ['Steady Eddie']
    },
    {
      memberId: 'tm_008',
      memberName: 'James Anderson',
      avatar: 'JA',
      rank: 4,
      score: 1280000,
      metric: 'Revenue',
      change: 0,
      badges: []
    },
    {
      memberId: 'tm_007',
      memberName: 'Amanda Wilson',
      avatar: 'AW',
      rank: 5,
      score: 980000,
      metric: 'Revenue',
      change: 3,
      badges: ['Rising Star', 'Customer Champion']
    },
    {
      memberId: 'tm_004',
      memberName: 'David Kim',
      avatar: 'DK',
      rank: 6,
      score: 680000,
      metric: 'Revenue',
      change: 1,
      badges: ['Most Active']
    },
    {
      memberId: 'tm_006',
      memberName: 'Robert Taylor',
      avatar: 'RT',
      rank: 7,
      score: 580000,
      metric: 'Revenue',
      change: -2,
      badges: []
    }
  ]
};
