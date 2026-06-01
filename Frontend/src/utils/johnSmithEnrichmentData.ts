export interface JohnSmithDataSource {
  id: string;
  name: string;
  icon: string;
  status: 'fetching' | 'waiting' | 'success' | 'error' | 'queued';
  progress: number;
  estimatedTime: string;
  lastSync: string | null;
  fieldsEnriched: number;
  confidence: number | null;
  responseTime: string | null;
}

export interface EnrichedField {
  id: string;
  label: string;
  icon: string;
  before: string | null;
  after: string | null;
  source: string;
  confidence: number;
  enrichedAt: string;
  status: 'confirmed' | 'updated' | 'added';
}

export interface EnrichmentHistoryEntry {
  id: string;
  timestamp: string;
  status: string;
  fieldsEnriched: number;
  sources: Array<{ name: string; fields: number }>;
  duration: string;
  triggeredBy: string;
  triggeredByUser: string | null;
}

export interface JohnSmithEnrichmentData {
  leadId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  leadTitle: string;
  leadCompany: string;
  website: string;
  industry: string;
  companySize: string;
  score: number;
  source: string;
  status: 'enriching' | 'not_started' | 'enriched';
  enrichmentStatus: string;
  lastEnriched: string | null;
  startedAt: string;
  dataSources: JohnSmithDataSource[];
  totalFields: number;
  enrichedFields: number;
  estimatedCompletion: string;
}

export interface JohnSmithEnrichedData {
  contactInfo: EnrichedField[];
  companyInfo: EnrichedField[];
  professionalDetails: EnrichedField[];
}

export const johnSmithLead = {
  id: "lead_002",
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@acme.com",
  phone: "+1 (555) 123-4567",
  title: "VP Sales",
  company: "Acme Corp",
  website: "acme.com",
  industry: "Technology",
  companySize: "200-500",
  source: "apollo",
  aiScore: 78,
  status: "new",
  ownerId: "user_123",
  tags: ["Enterprise", "High Priority"],
  notes: "Reached out via LinkedIn last week",
  enrichmentStatus: "not_enriched",
  lastEnriched: null,
  createdAt: "2025-01-05T09:00:00Z",
  updatedAt: "2025-01-05T09:00:00Z"
};

export const johnSmithEnrichmentData: JohnSmithEnrichmentData = {
  leadId: 'lead_002',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@acme.com',
  phone: '+1 (555) 123-4567',
  leadTitle: 'VP Sales',
  leadCompany: 'Acme Corp',
  website: 'acme.com',
  industry: 'Technology',
  companySize: '200-500',
  score: 78,
  source: 'Apollo',
  status: 'enriching',
  enrichmentStatus: 'enriching',
  lastEnriched: null,
  startedAt: 'Just now',
  dataSources: [
    {
      id: 'apollo',
      name: 'Apollo.io',
      icon: '🎯',
      status: 'fetching',
      progress: 0,
      estimatedTime: '2.5s',
      lastSync: null,
      fieldsEnriched: 0,
      confidence: null,
      responseTime: null
    },
    {
      id: 'zoominfo',
      name: 'ZoomInfo',
      icon: '🎯',
      status: 'queued',
      progress: 0,
      estimatedTime: '2.5s',
      lastSync: null,
      fieldsEnriched: 0,
      confidence: null,
      responseTime: null
    }
  ],
  totalFields: 15,
  enrichedFields: 0,
  estimatedCompletion: '3 seconds'
};

export const johnSmithEnrichedFields: JohnSmithEnrichedData = {
  contactInfo: [
    {
      id: "email",
      label: "Email",
      icon: "📧",
      before: "john.smith@acme.com",
      after: "john.smith@acme.com",
      source: "apollo",
      confidence: 100,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "confirmed"
    },
    {
      id: "direct_phone",
      label: "Direct Phone",
      icon: "📱",
      before: "+1 (555) 123-4567",
      after: "+1 (415) 555-0198",
      source: "apollo",
      confidence: 92,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "updated"
    },
    {
      id: "linkedin",
      label: "LinkedIn Profile",
      icon: "💼",
      before: null,
      after: "linkedin.com/in/johnsmith-vpsales",
      source: "zoominfo",
      confidence: 95,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "added"
    },
    {
      id: "mobile_phone",
      label: "Mobile Phone",
      icon: "📱",
      before: null,
      after: "+1 (415) 555-0299",
      source: "apollo",
      confidence: 88,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "added"
    }
  ],

  companyInfo: [
    {
      id: "company_size",
      label: "Company Size",
      icon: "🏢",
      before: "200-500",
      after: "350 employees",
      source: "apollo",
      confidence: 96,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "updated"
    },
    {
      id: "annual_revenue",
      label: "Annual Revenue",
      icon: "💰",
      before: null,
      after: "$45M - $50M",
      source: "zoominfo",
      confidence: 85,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "added"
    },
    {
      id: "industry",
      label: "Industry",
      icon: "🏭",
      before: "Technology",
      after: "Enterprise Software - CRM Solutions",
      source: "apollo",
      confidence: 98,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "updated"
    },
    {
      id: "founded_year",
      label: "Founded Year",
      icon: "📅",
      before: null,
      after: "2015",
      source: "apollo",
      confidence: 100,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "added"
    },
    {
      id: "total_funding",
      label: "Total Funding",
      icon: "💵",
      before: null,
      after: "$35M (Series B)",
      source: "zoominfo",
      confidence: 93,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "added"
    },
    {
      id: "company_website",
      label: "Company Website",
      icon: "🌐",
      before: "acme.com",
      after: "https://www.acme.com",
      source: "apollo",
      confidence: 100,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "updated"
    }
  ],

  professionalDetails: [
    {
      id: "job_title",
      label: "Job Title",
      icon: "💼",
      before: "VP Sales",
      after: "Vice President of Sales",
      source: "apollo",
      confidence: 100,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "updated"
    },
    {
      id: "seniority_level",
      label: "Seniority Level",
      icon: "📊",
      before: null,
      after: "VP-Level",
      source: "zoominfo",
      confidence: 98,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "added"
    },
    {
      id: "department",
      label: "Department",
      icon: "🏢",
      before: null,
      after: "Sales & Business Development",
      source: "apollo",
      confidence: 96,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "added"
    },
    {
      id: "years_in_role",
      label: "Years in Role",
      icon: "📅",
      before: null,
      after: "3.2 years",
      source: "zoominfo",
      confidence: 89,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "added"
    },
    {
      id: "education",
      label: "Education",
      icon: "🎓",
      before: null,
      after: "MBA - Harvard Business School, BS Marketing - UCLA",
      source: "apollo",
      confidence: 94,
      enrichedAt: "2025-01-06T12:45:00Z",
      status: "added"
    }
  ]
};

export const johnSmithEnrichmentHistory: EnrichmentHistoryEntry[] = [
  {
    id: "enrich_001",
    timestamp: "2025-01-06T12:45:00Z",
    status: "success",
    fieldsEnriched: 15,
    sources: [
      { name: "Apollo.io", fields: 9 },
      { name: "ZoomInfo", fields: 6 }
    ],
    duration: "4.8s",
    triggeredBy: "auto",
    triggeredByUser: null
  }
];

export const johnSmithQualificationData = {
  lead: {
    id: "lead_002",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@acme.com",
    title: "VP Sales",
    company: "Acme Corp",
    source: "apollo",
    status: "new",
  },
  aiScore: {
    overall: 78,
    baseScore: 78,
    hrmsBonus: 0,
    grade: "B+",
  },
  bant: {
    budget: { status: "likely", score: 4, range: "$30K - $50K" },
    authority: { status: "influencer", score: 3, role: "Recommender" },
    need: { status: "important", score: 4 },
    timeline: { status: "short_term", score: 4, timeframe: "1-3 months" },
    overallScore: 15,
    maxScore: 20,
    recommendation: "QUALIFIED"
  },
  qualificationDecision: {
    status: "pending",
    recommendation: "qualify"
  }
};
