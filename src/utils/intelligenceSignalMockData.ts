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

const dataFlowSignal: IntelligenceSignal = {
  id: '2',
  type: 'hiring',
  title: 'DataFlow Inc posted 5 Sales Engineer jobs',
  company: 'DataFlow Inc',
  industry: 'Data Analytics',
  employees: 120,
  location: 'Austin, TX',
  detectedAt: '2024-11-15T10:00:00Z',
  timeAgo: '5 hours ago',
  source: 'LinkedIn Jobs API',
  aiScore: 85,
  status: 'new',
  buyingIntent: 78,

  companyDetails: {
    founded: '2019',
    website: 'https://dataflow.com',
    revenue: '$8M ARR',
    techStack: ['Python', 'AWS', 'Snowflake', 'Tableau'],
    social: {
      linkedin: 'https://linkedin.com/company/dataflow',
      twitter: 'https://twitter.com/dataflow'
    }
  },

  hiringDetails: {
    jobTitles: ['Sales Engineer (5 positions)'],
    positionsCount: 5,
    location: 'Remote + Austin HQ',
    postedDate: 'Nov 15, 2024',
    jobPostingUrls: [
      'https://linkedin.com/jobs/dataflow-sales-engineer-1',
      'https://linkedin.com/jobs/dataflow-sales-engineer-2'
    ]
  },

  aiAnalysis: {
    whyThisMatters: [
      'Scaling sales team rapidly',
      'High buying intent - Need tools for new hires',
      'Growth stage company',
      'Technical sales focus'
    ],
    recommendedActions: [
      'Contact VP Sales immediately',
      'Highlight onboarding solutions',
      'Mention sales enablement tools',
      'Reference similar data companies'
    ],
    similarCompaniesConverted: [
      'Tableau',
      'Looker',
      'Mode Analytics'
    ]
  },

  article: {
    title: 'DataFlow Expands Sales Team with 5 New Hires',
    published: 'Nov 15, 2024',
    source: 'LinkedIn',
    summary: 'DataFlow Inc is rapidly expanding its sales engineering team with 5 new positions. The company is looking for technical sales professionals to help scale their data analytics platform.',
    fullTextUrl: 'https://linkedin.com/jobs/dataflow'
  },

  decisionMakers: [
    {
      name: 'Robert Chang',
      title: 'CEO',
      email: 'robert@dataflow.com',
      phone: '+1 555-0789',
      linkedin: 'https://linkedin.com/in/robertchang',
      role: 'decision_maker'
    },
    {
      name: 'Emma Wilson',
      title: 'VP Sales',
      email: 'emma@dataflow.com',
      phone: '+1 555-0790',
      linkedin: 'https://linkedin.com/in/emmawilson',
      role: 'decision_maker'
    }
  ],

  scoreBreakdown: {
    funding: 18,
    growthSignals: 25,
    decisionMakers: 15,
    techStackFit: 15,
    companySize: 12
  },

  conversionProbability: 62,
  expectedCloseRate: 40,

  relatedSignals: [],

  timeline: [
    {
      date: 'Nov 15, 2024 - 10:00 AM',
      event: 'Signal detected',
      source: 'LinkedIn Jobs API'
    }
  ],

  resources: {
    companyWebsite: 'https://dataflow.com',
    linkedinPage: 'https://linkedin.com/company/dataflow',
    crunchbasePage: 'https://crunchbase.com/organization/dataflow',
    recentNews: []
  }
};

const acmeSignal: IntelligenceSignal = {
  id: '3',
  type: 'product',
  title: 'Acme Corp launched new enterprise product line',
  company: 'Acme Corp',
  industry: 'SaaS',
  employees: 75,
  location: 'New York, NY',
  detectedAt: '2024-11-14T09:00:00Z',
  timeAgo: '1 day ago',
  source: 'Company Blog + TechCrunch',
  aiScore: 78,
  status: 'in_review',
  buyingIntent: 70,

  companyDetails: {
    founded: '2018',
    website: 'https://acme.com',
    revenue: '$15M ARR',
    techStack: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    social: {
      linkedin: 'https://linkedin.com/company/acme',
      twitter: 'https://twitter.com/acmecorp',
      blog: 'https://acme.com/blog'
    }
  },

  aiAnalysis: {
    whyThisMatters: [
      'Product expansion indicates growth',
      'Enterprise focus - Higher deal sizes',
      'Integration opportunities',
      'New product needs supporting tools'
    ],
    recommendedActions: [
      'Contact CTO about integrations',
      'Highlight enterprise features',
      'Mention API capabilities',
      'Reference similar SaaS companies'
    ],
    similarCompaniesConverted: [
      'Salesforce',
      'HubSpot',
      'Zendesk'
    ]
  },

  article: {
    title: 'Acme Corp Launches Enterprise Analytics Platform',
    published: 'Nov 14, 2024',
    source: 'TechCrunch',
    summary: 'Acme Corp today announced the launch of its new Enterprise Analytics Platform, targeting Fortune 500 companies with advanced data visualization and reporting capabilities.',
    fullTextUrl: 'https://techcrunch.com/acme-enterprise-launch'
  },

  decisionMakers: [
    {
      name: 'John Smith',
      title: 'CTO',
      email: 'john@acme.com',
      phone: '+1 555-0800',
      linkedin: 'https://linkedin.com/in/johnsmith',
      role: 'decision_maker'
    },
    {
      name: 'Lisa Anderson',
      title: 'VP Product',
      email: 'lisa@acme.com',
      linkedin: 'https://linkedin.com/in/lisaanderson',
      role: 'champion'
    }
  ],

  scoreBreakdown: {
    funding: 15,
    growthSignals: 22,
    decisionMakers: 15,
    techStackFit: 14,
    companySize: 12
  },

  conversionProbability: 58,
  expectedCloseRate: 38,

  relatedSignals: [],

  timeline: [
    {
      date: 'Nov 14, 2024 - 9:00 AM',
      event: 'Signal detected',
      source: 'Company Blog'
    },
    {
      date: 'Nov 14, 2024 - 2:00 PM',
      event: 'Moved to In Review',
      user: 'Mike J.'
    }
  ],

  resources: {
    companyWebsite: 'https://acme.com',
    linkedinPage: 'https://linkedin.com/company/acme',
    crunchbasePage: 'https://crunchbase.com/organization/acme',
    recentNews: [
      {
        title: 'Acme Launches Enterprise Platform',
        source: 'TechCrunch',
        url: 'https://techcrunch.com/acme-enterprise-launch'
      }
    ]
  }
};

const innovateLabsSignal: IntelligenceSignal = {
  id: '4',
  type: 'expansion',
  title: 'InnovateLabs opened new office in Austin, TX',
  company: 'InnovateLabs',
  industry: 'HealthTech',
  employees: 30,
  location: 'Boston, MA',
  detectedAt: '2024-11-12T14:00:00Z',
  timeAgo: '3 days ago',
  source: 'Google News + LinkedIn',
  aiScore: 72,
  status: 'new',
  buyingIntent: 65,

  companyDetails: {
    founded: '2021',
    website: 'https://innovatelabs.com',
    revenue: '$3M ARR',
    techStack: ['React', 'Python', 'GCP', 'Firebase'],
    social: {
      linkedin: 'https://linkedin.com/company/innovatelabs'
    }
  },

  aiAnalysis: {
    whyThisMatters: [
      'Geographic expansion signals growth',
      'New office needs infrastructure',
      'Hiring 15 new employees',
      'Setting up new location'
    ],
    recommendedActions: [
      'Contact HR about office setup',
      'Offer onboarding solutions',
      'Mention multi-location management',
      'Reference other HealthTech clients'
    ],
    similarCompaniesConverted: [
      'HealthHub',
      'MedTech Solutions',
      'CareConnect'
    ]
  },

  article: {
    title: 'InnovateLabs Expands to Austin',
    published: 'Nov 12, 2024',
    source: 'Google News',
    summary: 'InnovateLabs announces new Austin office opening in December 2024, planning to hire 15 employees for the new location.',
    fullTextUrl: 'https://news.google.com/innovatelabs-austin'
  },

  decisionMakers: [
    {
      name: 'David Kim',
      title: 'CEO',
      email: 'david@innovatelabs.com',
      phone: '+1 555-0900',
      linkedin: 'https://linkedin.com/in/davidkim',
      role: 'decision_maker'
    }
  ],

  scoreBreakdown: {
    funding: 12,
    growthSignals: 20,
    decisionMakers: 10,
    techStackFit: 15,
    companySize: 15
  },

  conversionProbability: 55,
  expectedCloseRate: 35,

  relatedSignals: [],

  timeline: [
    {
      date: 'Nov 12, 2024 - 2:00 PM',
      event: 'Signal detected',
      source: 'Google News'
    }
  ],

  resources: {
    companyWebsite: 'https://innovatelabs.com',
    linkedinPage: 'https://linkedin.com/company/innovatelabs',
    crunchbasePage: 'https://crunchbase.com/organization/innovatelabs',
    recentNews: []
  }
};

const cloudNineSignal: IntelligenceSignal = {
  id: '5',
  type: 'funding',
  title: 'CloudNine Inc raised $18M Series B',
  company: 'CloudNine Inc',
  industry: 'Cloud Services',
  employees: 90,
  location: 'Seattle, WA',
  detectedAt: '2024-11-08T09:00:00Z',
  timeAgo: '1 week ago',
  source: 'Crunchbase API',
  aiScore: 88,
  status: 'converted',
  buyingIntent: 82,

  companyDetails: {
    founded: '2018',
    website: 'https://cloudnine.com',
    revenue: '$12M ARR',
    techStack: ['Kubernetes', 'Docker', 'AWS', 'Terraform'],
    social: {
      linkedin: 'https://linkedin.com/company/cloudnine',
      twitter: 'https://twitter.com/cloudnine'
    }
  },

  fundingDetails: {
    roundType: 'Series B',
    amount: '$18 million',
    announcedDate: 'Nov 8, 2024',
    leadInvestor: 'Sequoia Capital',
    participatingInvestors: ['Andreessen Horowitz', 'Index Ventures'],
    valuation: 'Post-money: $75M',
    useOfFunds: [
      { category: 'Engineering team expansion', percentage: 45 },
      { category: 'Sales & marketing', percentage: 30 },
      { category: 'Product development', percentage: 15 },
      { category: 'Operations', percentage: 10 }
    ],
    pressReleaseUrl: 'https://cloudnine.com/press/series-b',
    crunchbaseUrl: 'https://crunchbase.com/organization/cloudnine'
  },

  aiAnalysis: {
    whyThisMatters: [
      'Mature funding round',
      'Established company with traction',
      'Cloud infrastructure focus',
      'Already converted to lead!'
    ],
    recommendedActions: [
      'Follow up on converted lead',
      'Nurture relationship',
      'Track deal progress',
      'Monitor for expansion opportunities'
    ],
    similarCompaniesConverted: [
      'AWS Partners',
      'CloudFlare',
      'DigitalOcean'
    ]
  },

  article: {
    title: 'CloudNine Raises $18M Series B',
    published: 'Nov 8, 2024',
    source: 'TechCrunch',
    summary: 'CloudNine Inc announced $18M Series B funding led by Sequoia Capital to expand cloud infrastructure platform.',
    fullTextUrl: 'https://techcrunch.com/cloudnine-series-b'
  },

  decisionMakers: [
    {
      name: 'Jessica Park',
      title: 'CEO',
      email: 'jessica@cloudnine.com',
      phone: '+1 555-1000',
      linkedin: 'https://linkedin.com/in/jessicapark',
      role: 'decision_maker'
    }
  ],

  scoreBreakdown: {
    funding: 25,
    growthSignals: 20,
    decisionMakers: 15,
    techStackFit: 15,
    companySize: 13
  },

  conversionProbability: 68,
  expectedCloseRate: 45,

  relatedSignals: [],

  timeline: [
    {
      date: 'Nov 8, 2024 - 9:00 AM',
      event: 'Signal detected',
      source: 'Crunchbase API'
    },
    {
      date: 'Nov 8, 2024 - 3:00 PM',
      event: 'Converted to Lead',
      user: 'Sarah C.'
    }
  ],

  resources: {
    companyWebsite: 'https://cloudnine.com',
    linkedinPage: 'https://linkedin.com/company/cloudnine',
    crunchbasePage: 'https://crunchbase.com/organization/cloudnine',
    recentNews: [
      {
        title: 'CloudNine Raises $18M',
        source: 'TechCrunch',
        url: 'https://techcrunch.com/cloudnine-series-b'
      }
    ]
  }
};

const smallBizSignal: IntelligenceSignal = {
  id: '6',
  type: 'hiring',
  title: 'SmallBiz Inc posted 2 marketing jobs',
  company: 'SmallBiz Inc',
  industry: 'E-commerce',
  employees: 5,
  location: 'Remote',
  detectedAt: '2024-11-01T11:00:00Z',
  timeAgo: '2 weeks ago',
  source: 'LinkedIn Jobs API',
  aiScore: 45,
  status: 'dismissed',
  buyingIntent: 30,

  companyDetails: {
    founded: '2023',
    website: 'https://smallbiz.com',
    revenue: '$500K ARR',
    techStack: ['Shopify', 'WordPress'],
    social: {
      linkedin: 'https://linkedin.com/company/smallbiz'
    }
  },

  hiringDetails: {
    jobTitles: ['Marketing Specialist (2 positions)'],
    positionsCount: 2,
    location: 'Remote',
    postedDate: 'Nov 1, 2024',
    jobPostingUrls: [
      'https://linkedin.com/jobs/smallbiz-marketing'
    ]
  },

  aiAnalysis: {
    whyThisMatters: [
      'Company too small for ICP',
      'Marketing roles not sales focused',
      'Limited budget indicated',
      'Signal dismissed - low priority'
    ],
    recommendedActions: [
      'Monitor for future growth',
      'Re-evaluate in 6 months',
      'Track funding announcements',
      'Consider for SMB product line'
    ],
    similarCompaniesConverted: []
  },

  article: {
    title: 'SmallBiz Hiring Marketing Team',
    published: 'Nov 1, 2024',
    source: 'LinkedIn',
    summary: 'SmallBiz Inc is looking to expand its marketing efforts with 2 new marketing specialist positions.',
    fullTextUrl: 'https://linkedin.com/jobs/smallbiz'
  },

  decisionMakers: [
    {
      name: 'Tom Wilson',
      title: 'Founder',
      email: 'tom@smallbiz.com',
      linkedin: 'https://linkedin.com/in/tomwilson',
      role: 'decision_maker'
    }
  ],

  scoreBreakdown: {
    funding: 5,
    growthSignals: 10,
    decisionMakers: 10,
    techStackFit: 10,
    companySize: 10
  },

  conversionProbability: 25,
  expectedCloseRate: 15,

  relatedSignals: [],

  timeline: [
    {
      date: 'Nov 1, 2024 - 11:00 AM',
      event: 'Signal detected',
      source: 'LinkedIn Jobs API'
    },
    {
      date: 'Nov 1, 2024 - 4:00 PM',
      event: 'Dismissed',
      user: 'Mike J.'
    }
  ],

  resources: {
    companyWebsite: 'https://smallbiz.com',
    linkedinPage: 'https://linkedin.com/company/smallbiz',
    crunchbasePage: '',
    recentNews: []
  }
};

export const getAllIntelligenceSignals = (): IntelligenceSignal[] => {
  return [
    techStartSignal,
    dataFlowSignal,
    acmeSignal,
    innovateLabsSignal,
    cloudNineSignal,
    smallBizSignal
  ];
};

export const getIntelligenceSignalById = (id: string): IntelligenceSignal | undefined => {
  const signals = getAllIntelligenceSignals();
  return signals.find(signal => signal.id === id);
};
