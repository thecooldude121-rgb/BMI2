export interface MichaelTorresDataSource {
  id: string;
  name: string;
  icon: string;
  status: 'success' | 'error' | 'fetching' | 'waiting';
  progress: number;
  estimatedTime: string;
  lastSync: string | null;
  fieldsEnriched: number;
  confidence: number | null;
  responseTime: string | null;
  errorMessage?: string;
}

export interface MichaelTorresEnrichedField {
  id: string;
  label: string;
  icon: string;
  before: string | null;
  after: string | null;
  source: string | null;
  confidence: number | null;
  enrichedAt: string | null;
  status: 'confirmed' | 'updated' | 'added' | 'missing';
  errorReason?: string;
}

export interface MichaelTorresEnrichmentHistory {
  id: string;
  timestamp: string;
  status: 'partial' | 'success' | 'failed';
  fieldsEnriched: number;
  sources: Array<{ name: string; fields: number; status: string }>;
  duration: string;
  triggeredBy: string;
  triggeredByUser: string | null;
  errorMessage?: string;
  errorDetails?: string;
}

export interface MichaelTorresEnrichmentData {
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
  status: 'partial' | 'enriched' | 'not_started';
  enrichmentStatus: string;
  lastEnriched: string;
  startedAt: string;
  dataSources: MichaelTorresDataSource[];
  totalFields: number;
  enrichedFields: number;
  estimatedCompletion: string;
}

export const michaelTorresLead = {
  id: "lead_003",
  firstName: "Michael",
  lastName: "Torres",
  email: "michael.torres@bigco.com",
  phone: null,
  title: "Chief Technology Officer",
  company: "BigCo",
  website: "https://www.bigco.com",
  industry: "Enterprise Cloud Computing & Infrastructure",
  companySize: "1,250 employees",
  source: "zoominfo",
  aiScore: 82,
  status: "contacted",
  ownerId: "user_123",
  tags: ["Enterprise", "Tech Leader"],
  notes: "Interested in cloud migration solutions",
  enrichmentStatus: "partial",
  lastEnriched: "2025-01-05T14:15:00Z",
  createdAt: "2025-01-04T09:00:00Z",
  updatedAt: "2025-01-05T14:15:00Z"
};

export const michaelTorresEnrichmentData: MichaelTorresEnrichmentData = {
  leadId: 'lead_003',
  firstName: 'Michael',
  lastName: 'Torres',
  email: 'm.torres@bigco.com',
  phone: '+1 (555) 789-0123',
  leadTitle: 'CTO',
  leadCompany: 'BigCo',
  website: 'bigco.com',
  industry: 'Technology',
  companySize: '1000+',
  score: 82,
  source: 'ZoomInfo',
  status: 'partial',
  enrichmentStatus: 'partial',
  lastEnriched: 'Jan 5, 2025 2:15 PM (1 day ago)',
  startedAt: 'Jan 5, 2025 2:15 PM',
  dataSources: [
    {
      id: 'apollo',
      name: 'Apollo.io',
      icon: '🎯',
      status: 'success',
      progress: 100,
      estimatedTime: '2.5s',
      lastSync: '1 day ago',
      fieldsEnriched: 8,
      confidence: 96,
      responseTime: '2.3s'
    },
    {
      id: 'zoominfo',
      name: 'ZoomInfo',
      icon: '🎯',
      status: 'error',
      progress: 0,
      estimatedTime: '3s',
      lastSync: '1 day ago (failed)',
      fieldsEnriched: 0,
      confidence: null,
      responseTime: '10.8s (timeout)',
      errorMessage: 'API timeout - did not respond within 10 seconds'
    }
  ],
  totalFields: 11,
  enrichedFields: 8,
  estimatedCompletion: 'Incomplete - Retry needed'
};

export const michaelTorresEnrichedFields: MichaelTorresEnrichedField[] = [
  {
    id: "email",
    label: "Email",
    icon: "📧",
    before: "m.torres@bigco.com",
    after: "michael.torres@bigco.com",
    source: "apollo",
    confidence: 96,
    enrichedAt: "1 day ago",
    status: "updated"
  },
  {
    id: "direct_phone",
    label: "Direct Phone",
    icon: "📱",
    before: null,
    after: null,
    source: null,
    confidence: null,
    enrichedAt: null,
    status: "missing",
    errorReason: "ZoomInfo failed - retry to enrich this field"
  },
  {
    id: "linkedin",
    label: "LinkedIn Profile",
    icon: "💼",
    before: null,
    after: "linkedin.com/in/michaeltorres-cto",
    source: "apollo",
    confidence: 93,
    enrichedAt: "1 day ago",
    status: "added"
  },
  {
    id: "company_size",
    label: "Company Size",
    icon: "🏢",
    before: "1000+",
    after: "1,250 employees",
    source: "apollo",
    confidence: 97,
    enrichedAt: "1 day ago",
    status: "updated"
  },
  {
    id: "annual_revenue",
    label: "Annual Revenue",
    icon: "💰",
    before: null,
    after: null,
    source: null,
    confidence: null,
    enrichedAt: null,
    status: "missing",
    errorReason: "ZoomInfo failed - retry to enrich this field"
  },
  {
    id: "industry",
    label: "Industry",
    icon: "🏭",
    before: "Technology",
    after: "Enterprise Cloud Computing & Infrastructure",
    source: "apollo",
    confidence: 99,
    enrichedAt: "1 day ago",
    status: "updated"
  },
  {
    id: "company_website",
    label: "Company Website",
    icon: "🌐",
    before: "bigco.com",
    after: "https://www.bigco.com",
    source: "apollo",
    confidence: 100,
    enrichedAt: "1 day ago",
    status: "updated"
  },
  {
    id: "company_phone",
    label: "Company Phone",
    icon: "📞",
    before: null,
    after: "+1 (415) 555-0199",
    source: "apollo",
    confidence: 92,
    enrichedAt: "1 day ago",
    status: "added"
  },
  {
    id: "job_title",
    label: "Job Title",
    icon: "💼",
    before: "CTO",
    after: "Chief Technology Officer",
    source: "apollo",
    confidence: 100,
    enrichedAt: "1 day ago",
    status: "updated"
  },
  {
    id: "seniority_level",
    label: "Seniority Level",
    icon: "📊",
    before: null,
    after: null,
    source: null,
    confidence: null,
    enrichedAt: null,
    status: "missing",
    errorReason: "ZoomInfo failed - retry to enrich this field"
  },
  {
    id: "department",
    label: "Department",
    icon: "🏢",
    before: null,
    after: "Technology & Engineering",
    source: "apollo",
    confidence: 94,
    enrichedAt: "1 day ago",
    status: "added"
  }
];

export const michaelTorresEnrichmentHistory: MichaelTorresEnrichmentHistory[] = [
  {
    id: "enrich_002",
    timestamp: "Jan 5, 2025 2:15 PM",
    status: "partial",
    fieldsEnriched: 8,
    sources: [
      { name: "Apollo.io", fields: 8, status: "success" },
      { name: "ZoomInfo", fields: 0, status: "failed" }
    ],
    duration: "10.8s",
    triggeredBy: "manual",
    triggeredByUser: "John Smith",
    errorMessage: "API timeout - did not respond within 10 seconds",
    errorDetails: "ZoomInfo API did not respond within 10 seconds. Apollo.io data was saved successfully. Please retry ZoomInfo enrichment."
  },
  {
    id: "enrich_001",
    timestamp: "Jan 4, 2025 9:00 AM",
    status: "partial",
    fieldsEnriched: 8,
    sources: [
      { name: "Apollo.io", fields: 8, status: "success" },
      { name: "ZoomInfo", fields: 0, status: "failed" }
    ],
    duration: "11.2s",
    triggeredBy: "auto",
    triggeredByUser: null,
    errorMessage: "Connection timeout",
    errorDetails: "Initial enrichment attempt failed for ZoomInfo. Connection timeout after 10 seconds."
  }
];

export const getMichaelTorresFieldsByCategory = () => {
  const contactInfo = michaelTorresEnrichedFields.filter(f =>
    ['email', 'direct_phone', 'linkedin'].includes(f.id)
  );

  const companyInfo = michaelTorresEnrichedFields.filter(f =>
    ['company_size', 'annual_revenue', 'industry', 'company_website', 'company_phone'].includes(f.id)
  );

  const professionalDetails = michaelTorresEnrichedFields.filter(f =>
    ['job_title', 'seniority_level', 'department'].includes(f.id)
  );

  return { contactInfo, companyInfo, professionalDetails };
};

export const getMichaelTorresFieldsBySource = (source: string) => {
  return michaelTorresEnrichedFields.filter(f => f.source === source);
};

export const getMichaelTorresMissingFields = () => {
  return michaelTorresEnrichedFields.filter(f => f.status === 'missing');
};

export const michaelTorresQualificationData = {
  lead: {
    id: "lead_003",
    firstName: "Michael",
    lastName: "Torres",
    email: "michael.torres@bigco.com",
    title: "CTO",
    company: "BigCo",
    source: "zoominfo",
    status: "contacted",
  },
  aiScore: {
    overall: 82,
    baseScore: 82,
    hrmsBonus: 0,
    grade: "A-",
  },
  bant: {
    budget: { status: "unknown", score: 2, range: "Not discussed" },
    authority: { status: "decision_maker", score: 5, role: "Technical Decision Maker" },
    need: { status: "nice_to_have", score: 2 },
    timeline: { status: "long_term", score: 2, timeframe: "3-6 months" },
    overallScore: 11,
    maxScore: 20,
    recommendation: "NEEDS MORE INFO"
  },
  qualificationDecision: {
    status: "pending",
    recommendation: "needs_more_info"
  }
};
