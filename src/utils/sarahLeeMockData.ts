/**
 * Comprehensive mock data for Sarah Lee lead
 * Source: HRMS recruitment (Nov 2024)
 * Score: 92/100 (Top 5%, Excellent)
 */

export interface LeadDetailData {
  leadInfo: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    title: string;
    company: string;
    industry: string;
    companySize: string;
    companyRevenue: string;
    email: string;
    phone: string;
    linkedin: string;
    source: string;
    sourceDetail: string;
    status: string;
    owner: string;
    createdAt: string;
    createdAtRelative: string;
  };
  aiLeadScore: {
    overallScore: number;
    scorePercentile: string;
    scoreRating: string;
    fitScore: number;
    fitReason: string;
    engagementScore: number;
    engagementReason: string;
    intentScore: number;
    intentReason: string;
    hrmsBonus: {
      baseScore: number;
      bonusPercentage: number;
      bonusPoints: number;
      finalScore: number;
    };
    conversionProbability: number;
    conversionLabel: string;
    whyThisScore: string[];
  };
  enrichmentData: {
    company: {
      name: string;
      industry: string;
      revenue: string;
      revenueSource: string;
      employees: number;
      founded: number;
      headquarters: string;
      techStack: string[];
      recentNews: Array<{
        title: string;
        date: string;
        source: string;
      }>;
    };
    sources: Array<{
      name: string;
      lastUpdated: string;
      status: string;
    }>;
  };
  decisionMakers: Array<{
    id: string;
    name: string;
    title: string;
    role: string;
    email: string;
    linkedin: string;
    isThisLead: boolean;
    canCreateLead: boolean;
  }>;
  hrmsConnection: {
    recruited: string;
    company: string;
    employee: string;
    position: string;
    recruiter: string;
    placementFee: number;
    warmLeadAdvantages: string[];
  };
  intelligenceSignal: {
    signalType: string;
    signalIcon: string;
    event: string;
    date: string;
    source: string;
    aiAnalysis: string[];
    relatedSignals: Array<{
      title: string;
      date: string;
    }>;
  };
  activityTimeline: Array<{
    id: string;
    date: string;
    timeAgo: string;
    type: string;
    icon: string;
    title: string;
    description: string;
    by: string;
    automated: boolean;
  }>;
  notes: Array<{
    id: string;
    date: string;
    author: string;
    content: string;
  }>;
  files: Array<any>;
  aiRecommendations: Array<{
    icon: string;
    text: string;
    priority: string;
  }>;
  similarLeads: Array<{
    id: string;
    name: string;
    company: string;
    source: string;
    sourceIcon: string;
    score: number;
    industry: string;
  }>;
}

export const sarahLeeMockData: LeadDetailData = {
  leadInfo: {
    id: 'LEAD-2024-1567',
    firstName: 'Sarah',
    lastName: 'Lee',
    fullName: 'Sarah Lee',
    title: 'CFO',
    company: 'TechStart Inc',
    industry: 'FinTech',
    companySize: '45 employees',
    companyRevenue: '$8M (estimated)',
    email: 'sarah@techstart.com',
    phone: '+1 555-0456',
    linkedin: 'linkedin.com/in/sarahlee-cfo',
    source: 'HRMS',
    sourceDetail: 'Recruited Nov 2024',
    status: 'New',
    owner: 'Sarah C.',
    createdAt: 'Nov 15, 2024',
    createdAtRelative: 'Just now'
  },
  aiLeadScore: {
    overallScore: 92,
    scorePercentile: 'Top 5%',
    scoreRating: 'Excellent',
    fitScore: 90,
    fitReason: 'Company size matches ICP, Industry = FinTech',
    engagementScore: 85,
    engagementReason: 'No engagement yet, but high potential',
    intentScore: 88,
    intentReason: 'Recent funding $10M, Hiring signals',
    hrmsBonus: {
      baseScore: 69,
      bonusPercentage: 33,
      bonusPoints: 23,
      finalScore: 92
    },
    conversionProbability: 67,
    conversionLabel: 'High',
    whyThisScore: [
      '✅ HRMS warm lead',
      '✅ Recent funding $10M',
      '✅ Decision maker (CFO)',
      '✅ Company growth signals',
      '⚠️ No engagement yet (never contacted)'
    ]
  },
  enrichmentData: {
    company: {
      name: 'TechStart Inc',
      industry: 'FinTech (Financial Technology)',
      revenue: '$8M',
      revenueSource: 'Apollo.io',
      employees: 45,
      founded: 2019,
      headquarters: 'San Francisco, CA',
      techStack: [
        'AWS (Cloud Infrastructure)',
        'Salesforce (CRM)',
        'Slack (Team Collaboration)',
        'Stripe (Payment Processing)'
      ],
      recentNews: [
        {
          title: 'Raised $10M Series A',
          date: 'Nov 2024',
          source: 'TechCrunch'
        },
        {
          title: 'Hired VP of Sales',
          date: 'Oct 2024',
          source: 'LinkedIn'
        },
        {
          title: 'Expanding to NYC office',
          date: 'Nov 2024',
          source: 'Company Blog'
        }
      ]
    },
    sources: [
      {
        name: 'Apollo.io',
        lastUpdated: 'Nov 15, 2024',
        status: 'Active'
      },
      {
        name: 'ZoomInfo',
        lastUpdated: 'Nov 14, 2024',
        status: 'Active'
      },
      {
        name: 'Clearbit',
        lastUpdated: 'Nov 15, 2024',
        status: 'Active'
      },
      {
        name: 'LinkedIn',
        lastUpdated: 'Nov 15, 2024',
        status: 'Active'
      }
    ]
  },
  decisionMakers: [
    {
      id: 'LEAD-2024-1567',
      name: 'Sarah Lee',
      title: 'CFO',
      role: 'Decision Maker',
      email: 'sarah@techstart.com',
      linkedin: 'linkedin.com/in/sarahlee-cfo',
      isThisLead: true,
      canCreateLead: false
    },
    {
      id: 'DM-001',
      name: 'Robert Chen',
      title: 'CEO',
      role: 'Co-Founder',
      email: 'robert@techstart.com',
      linkedin: 'linkedin.com/in/robert-chen-ceo',
      isThisLead: false,
      canCreateLead: true
    },
    {
      id: 'DM-002',
      name: 'Michael Zhang',
      title: 'CTO',
      role: 'Co-Founder',
      email: 'michael@techstart.com',
      linkedin: 'linkedin.com/in/michael-zhang-cto',
      isThisLead: false,
      canCreateLead: true
    }
  ],
  hrmsConnection: {
    recruited: 'Nov 2024',
    company: 'TechStart Inc',
    employee: 'Sarah Lee',
    position: 'CFO',
    recruiter: 'Jane Smith (HRMS team)',
    placementFee: 15000,
    warmLeadAdvantages: [
      'Existing relationship through recruitment',
      '+33% score bonus applied',
      '2x higher close rate vs traditional leads',
      'Faster sales cycle (avg 3 weeks vs 7 weeks)'
    ]
  },
  intelligenceSignal: {
    signalType: 'Funding',
    signalIcon: '💰',
    event: 'Raised $10M Series A',
    date: 'Nov 12, 2024',
    source: 'Crunchbase',
    aiAnalysis: [
      'High buying intent (budget confirmed)',
      'Growth mode active (scaling team)',
      'Sales team expansion (3 sales jobs posted)'
    ],
    relatedSignals: [
      {
        title: 'Hired VP of Sales',
        date: 'Oct 2024'
      },
      {
        title: 'Posted 3 sales engineer jobs',
        date: 'Nov 2024'
      }
    ]
  },
  activityTimeline: [
    {
      id: 'ACT-001',
      date: 'Nov 15, 2024',
      timeAgo: 'Just now',
      type: 'lead_created',
      icon: '👤',
      title: 'Lead created from HRMS event',
      description: 'Source: HRMS recruitment • Auto-assigned to Sarah C. • Initial score: 92/100',
      by: 'System (Auto)',
      automated: true
    },
    {
      id: 'ACT-002',
      date: 'Nov 15, 2024',
      timeAgo: '10 minutes ago',
      type: 'enrichment',
      icon: '🔍',
      title: 'Lead enriched automatically',
      description: 'Apollo.io: +12 data points added • ZoomInfo: Company information • Clearbit: Tech stack identified',
      by: 'System (Auto-enrichment)',
      automated: true
    },
    {
      id: 'ACT-003',
      date: 'Nov 15, 2024',
      timeAgo: '5 minutes ago',
      type: 'note',
      icon: '📝',
      title: 'Note added by Sarah C.',
      description: 'High priority HRMS lead - Contact ASAP',
      by: 'Sarah C.',
      automated: false
    }
  ],
  notes: [
    {
      id: 'NOTE-001',
      date: 'Nov 15, 2024',
      author: 'Sarah C.',
      content: 'High priority HRMS lead - Contact ASAP. Mention our HRMS relationship and their recent funding round.'
    }
  ],
  files: [],
  aiRecommendations: [
    {
      icon: '⚡',
      text: 'Contact within 48h (High intent window)',
      priority: 'high'
    },
    {
      icon: '💬',
      text: 'Mention HRMS connection (Warm intro advantage)',
      priority: 'high'
    },
    {
      icon: '📧',
      text: 'Add to "HRMS Warm Lead" email sequence',
      priority: 'medium'
    },
    {
      icon: '✅',
      text: 'Complete BANT qualification',
      priority: 'medium'
    }
  ],
  similarLeads: [
    {
      id: 'LEAD-001',
      name: 'Emma Wilson',
      company: 'InnovateLabs',
      source: 'HRMS',
      sourceIcon: '🏢',
      score: 94,
      industry: 'HealthTech'
    },
    {
      id: 'LEAD-002',
      name: 'Alex Johnson',
      company: 'DataVerse',
      source: 'HRMS',
      sourceIcon: '🏢',
      score: 90,
      industry: 'Data Platform'
    },
    {
      id: 'LEAD-003',
      name: 'Robert Chang',
      company: 'DataFlow Inc',
      source: 'Intelligence',
      sourceIcon: '🔔',
      score: 85,
      industry: 'Data Analytics'
    }
  ]
};

// Additional related data for TechStart Inc company
export const techStartCompanyData = {
  companyId: 'ACC-2024-0089',
  name: 'TechStart Inc',
  industry: 'FinTech',
  employees: 45,
  revenue: 8000000,
  founded: 2019,
  headquarters: 'San Francisco, CA',
  website: 'www.techstart.com',
  linkedin: '/company/techstart-inc',
  twitter: '@techstart',
  description: 'FinTech company providing banking APIs and real-time payment solutions',

  fundingRounds: [
    {
      round: 'Seed',
      amount: 500000,
      date: '2019-07',
      investors: ['Y Combinator', 'Angel investors']
    },
    {
      round: 'Pre-Series A',
      amount: 2500000,
      date: '2020-03',
      lead: 'LocalGlobe',
      participants: ['Y Combinator']
    },
    {
      round: 'Series A',
      amount: 10000000,
      date: '2024-11',
      lead: 'Sequoia Capital',
      participants: ['Andreessen Horowitz', 'Y Combinator']
    }
  ],

  techStack: {
    infrastructure: ['AWS', 'Docker', 'Kubernetes'],
    crm: ['Salesforce'],
    communication: ['Slack'],
    payments: ['Stripe']
  },

  employeeGrowth: {
    '2023': 30,
    '2024': 38,
    '2025': 45,
    growthRate: '+50%'
  },

  revenueGrowth: {
    '2023': 3800000,
    '2024': 5500000,
    '2025': 8000000,
    growthRate: '+45% YoY'
  }
};

// Decision makers at TechStart Inc
export const techStartDecisionMakers = [
  {
    id: 'CON-2024-0234',
    name: 'Sarah Lee',
    title: 'CFO',
    email: 'sarah@techstart.com',
    phone: '+1 555-0456',
    linkedin: 'linkedin.com/in/sarahlee-cfo',
    role: 'Decision Maker',
    department: 'Finance',
    seniority: 'C-Level',
    isLead: true,
    leadId: 'LEAD-2024-1567',
    hrmsConnection: true,
    relationshipStrength: 'Very High'
  },
  {
    id: 'CON-POTENTIAL-001',
    name: 'Robert Chen',
    title: 'CEO & Co-Founder',
    email: 'robert@techstart.com',
    linkedin: 'linkedin.com/in/robert-chen-ceo',
    role: 'Final Decision Maker',
    department: 'Executive',
    seniority: 'C-Level',
    isLead: false,
    canCreateLead: true
  },
  {
    id: 'CON-POTENTIAL-002',
    name: 'Michael Zhang',
    title: 'CTO & Co-Founder',
    email: 'michael@techstart.com',
    linkedin: 'linkedin.com/in/michael-zhang-cto',
    role: 'Technical Decision Maker',
    department: 'Engineering',
    seniority: 'C-Level',
    isLead: false,
    canCreateLead: true
  }
];
