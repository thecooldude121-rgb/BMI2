export interface CompanySignal {
  id: string;
  type: 'funding' | 'hiring' | 'product_launch' | 'hrms_event' | 'expansion';
  title: string;
  company: string;
  description: string;
  source: string;
  aiScore: number;
  timeAgo: string;
  isAutoAdded?: boolean;
}

export interface RecentLead {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  source: 'hrms' | 'intent' | 'apollo' | 'manual';
  score: number;
  status: 'new' | 'contacted' | 'qualified';
  statusDetail: string;
  timeAgo: string;
}

export const companySignals: CompanySignal[] = [
  {
    id: '1',
    type: 'funding',
    title: 'TechStart Inc raised $10M Series A',
    company: 'TechStart Inc',
    description: 'Series A funding round led by Accel Partners',
    source: 'Crunchbase',
    aiScore: 88,
    timeAgo: '2 hours ago'
  },
  {
    id: '2',
    type: 'hiring',
    title: 'DataFlow posted 5 Sales Engineer jobs',
    company: 'DataFlow Inc',
    description: 'Expanding sales team across multiple regions',
    source: 'LinkedIn',
    aiScore: 85,
    timeAgo: '5 hours ago'
  },
  {
    id: '3',
    type: 'product_launch',
    title: 'Acme Corp launched new enterprise product line',
    company: 'Acme Corp',
    description: 'New B2B SaaS platform for enterprise customers',
    source: 'Company Blog',
    aiScore: 78,
    timeAgo: '1 day ago'
  },
  {
    id: '4',
    type: 'hrms_event',
    title: 'Emma Wilson hired at DataFlow Inc as VP Marketing',
    company: 'DataFlow Inc',
    description: 'New executive hire with strong B2B SaaS background',
    source: 'HRMS Integration',
    aiScore: 92,
    timeAgo: '3 hours ago',
    isAutoAdded: true
  },
  {
    id: '5',
    type: 'expansion',
    title: 'InnovateLabs opened new office in Austin, TX',
    company: 'InnovateLabs',
    description: 'Geographic expansion into Texas market',
    source: 'Google News',
    aiScore: 72,
    timeAgo: '6 hours ago'
  }
];

export const recentLeads: RecentLead[] = [
  {
    id: '1',
    name: 'Sarah Lee',
    title: 'CFO',
    company: 'TechStart Inc',
    industry: 'FinTech',
    source: 'hrms',
    score: 92,
    status: 'new',
    statusDetail: 'Just added',
    timeAgo: 'Just now'
  },
  {
    id: '2',
    name: 'Robert Chang',
    title: 'CEO',
    company: 'DataFlow Inc',
    industry: 'Data Analytics',
    source: 'intent',
    score: 85,
    status: 'new',
    statusDetail: '2h ago',
    timeAgo: '2h ago'
  },
  {
    id: '3',
    name: 'John Smith',
    title: 'VP Sales',
    company: 'Acme Corp',
    industry: 'SaaS',
    source: 'apollo',
    score: 78,
    status: 'contacted',
    statusDetail: 'Email sent',
    timeAgo: '5h ago'
  },
  {
    id: '4',
    name: 'Emma Wilson',
    title: 'VP Marketing',
    company: 'InnovateLabs',
    industry: 'HealthTech',
    source: 'hrms',
    score: 94,
    status: 'new',
    statusDetail: 'Just added',
    timeAgo: '3h ago'
  },
  {
    id: '5',
    name: 'Michael Torres',
    title: 'CTO',
    company: 'BigCo Enter',
    industry: 'Manufacturing',
    source: 'apollo',
    score: 68,
    status: 'qualified',
    statusDetail: 'Ready→CRM',
    timeAgo: '1 day ago'
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    title: 'Director',
    company: 'StartCo',
    industry: 'E-commerce',
    source: 'manual',
    score: 55,
    status: 'new',
    statusDetail: '30m ago',
    timeAgo: '30m ago'
  },
  {
    id: '7',
    name: 'David Kumar',
    title: 'CFO',
    company: 'TechFlow',
    industry: 'SaaS',
    source: 'apollo',
    score: 72,
    status: 'contacted',
    statusDetail: 'In sequence',
    timeAgo: '2 days ago'
  },
  {
    id: '8',
    name: 'Jessica Park',
    title: 'CEO',
    company: 'CloudNine Inc',
    industry: 'Cloud Services',
    source: 'intent',
    score: 88,
    status: 'new',
    statusDetail: '4h ago',
    timeAgo: '4h ago'
  },
  {
    id: '9',
    name: 'Alex Johnson',
    title: 'VP Ops',
    company: 'DataVerse',
    industry: 'Data Platform',
    source: 'hrms',
    score: 90,
    status: 'qualified',
    statusDetail: 'Ready→CRM',
    timeAgo: '1 day ago'
  },
  {
    id: '10',
    name: 'Maria Garcia',
    title: 'Director',
    company: 'NextGen Labs',
    industry: 'BioTech',
    source: 'apollo',
    score: 65,
    status: 'new',
    statusDetail: '1h ago',
    timeAgo: '1h ago'
  }
];

export const dashboardStats = {
  totalLeads: 450,
  newToday: 35,
  newTodayChange: '+12%',
  hrmsLeads: 45,
  qualifiedLeads: 180,
  qualifiedPercentage: '40%',
  syncedToCRM: 150,
  syncedPercentage: '33%',
  avgScore: 72
};

export const aiInsights = {
  companySignals: {
    total: 50,
    fundingAnnouncements: 12,
    hiringSignals: 18,
    productLaunches: 20
  },
  hrmsLeads: {
    total: 12,
    conversionRate: '33%',
    avgScore: 92
  },
  emailPerformance: {
    sequenceName: 'New Customer Outreach',
    openRate: '65%',
    openRateChange: '+12%',
    repliesToday: 8,
    qualifiedLeads: 3
  },
  recommendedActions: [
    'Follow up with 15 leads who opened emails (high intent)',
    'Enrich 23 new leads from Apollo.io import',
    'Qualify 8 HRMS leads before end of week'
  ]
};
