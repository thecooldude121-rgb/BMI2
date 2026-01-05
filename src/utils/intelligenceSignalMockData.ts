export interface DecisionMaker {
  name: string;
  title: string;
  email: string;
  phone?: string;
  linkedin?: string;
  role: 'decision_maker' | 'influencer' | 'champion';
}

export interface IntelligenceSignal {
  id: string;
  type: 'funding' | 'hiring' | 'product' | 'expansion';
  title: string;
  company: string;
  industry: string;
  employees: number;
  location: string;
  detectedAt: string;
  timeAgo: string;
  source: string;
  aiScore: number;
  status: 'new' | 'in_review' | 'converted' | 'dismissed';
  buyingIntent: number;

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

  aiAnalysis: {
    whyThisMatters: string[];
    recommendedActions: string[];
    similarCompaniesConverted: string[];
  };

  article: {
    title: string;
    published: string;
    source: string;
    summary: string;
    fullTextUrl: string;
  };

  decisionMakers: DecisionMaker[];

  scoreBreakdown: {
    funding: number;
    growthSignals: number;
    decisionMakers: number;
    techStackFit: number;
    companySize: number;
  };

  conversionProbability: number;
  expectedCloseRate: number;

  relatedSignals: Array<{
    id: string;
    type: 'funding' | 'hiring' | 'product' | 'expansion';
    title: string;
    timeAgo: string;
    score: number;
  }>;

  similarCompanies: Array<{
    id: string;
    name: string;
    type: 'funding' | 'hiring' | 'product' | 'expansion';
    amount: string;
    industry: string;
    score: number;
    status: 'new' | 'in_review' | 'converted' | 'dismissed';
  }>;

  timeline: Array<{
    date: string;
    event: string;
    source?: string;
    user?: string;
  }>;

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

export const techStartSignal: IntelligenceSignal = {
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
    techStack: [
      'AWS (Cloud)',
      'Salesforce (CRM)',
      'Slack (Collaboration)',
      'Stripe (Payments)'
    ],
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
    participatingInvestors: [
      'Sequoia Capital',
      'Y Combinator'
    ],
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
    summary: `TechStart Inc, a San Francisco-based FinTech startup, announced today that it has raised $10 million in Series A funding led by Accel Partners. The company plans to use the funds to expand its sales team and accelerate product development.

"This funding represents a major milestone for TechStart," said Robert Chen, CEO and Co-Founder. "We're excited to partner with Accel and leverage their expertise to scale our platform and reach more customers in the financial services industry."

The funding will enable TechStart to double its sales team over the next 12 months and accelerate product development to meet growing demand from enterprise customers.`,
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

export const getAllIntelligenceSignals = (): IntelligenceSignal[] => {
  return [techStartSignal];
};

export const getIntelligenceSignalById = (id: string): IntelligenceSignal | undefined => {
  const signals = getAllIntelligenceSignals();
  return signals.find(signal => signal.id === id);
};
