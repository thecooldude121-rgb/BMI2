export interface EmilyChenEnrichedField {
  id: string;
  label: string;
  icon: string;
  before: string | null;
  after: string;
  source: 'apollo' | 'zoominfo';
  confidence: number;
  enrichedAt: string;
  status: 'pending_review' | 'approved';
  warningMessage?: string;
  reviewStatus: 'pending' | 'accepted' | 'rejected' | 'auto_approved';
}

export interface EmilyChenDataSource {
  id: string;
  name: string;
  icon: string;
  status: string;
  lastSync: string;
  fieldsEnriched: number;
  confidence: number;
  responseTime: string;
  lowConfidenceFields: number;
}

export interface EmilyChenLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  title: string;
  company: string;
  website: string;
  industry: string;
  companySize: string;
  source: string;
  aiScore: number;
  status: string;
  ownerId: string;
  tags: string[];
  notes: string;
  enrichmentStatus: string;
  lastEnriched: string;
  createdAt: string;
  updatedAt: string;
}

export const emilyChenLead: EmilyChenLead = {
  id: "lead_004",
  firstName: "Emily",
  lastName: "Chen",
  email: "emily.chen@dataflow.com",
  phone: null,
  title: "Director of Marketing",
  company: "DataFlow",
  website: "dataflow.io",
  industry: "Data Analytics SaaS",
  companySize: "150-200",
  source: "intelligence",
  aiScore: 88,
  status: "new",
  ownerId: "user_123",
  tags: ["Marketing Leader", "SaaS"],
  notes: "Found via intelligence signal - company posted 5 marketing jobs",
  enrichmentStatus: "enriched_low_confidence",
  lastEnriched: "2025-01-06T08:00:00Z",
  createdAt: "2025-01-05T16:30:00Z",
  updatedAt: "2025-01-06T08:00:00Z"
};

export const emilyChenDataSources: EmilyChenDataSource[] = [
  {
    id: "apollo",
    name: "Apollo.io",
    icon: "🎯",
    status: "connected_low_confidence",
    lastSync: "4 hours ago",
    fieldsEnriched: 10,
    confidence: 68,
    responseTime: "2.1s",
    lowConfidenceFields: 5
  },
  {
    id: "zoominfo",
    name: "ZoomInfo",
    icon: "🎯",
    status: "connected",
    lastSync: "4 hours ago",
    fieldsEnriched: 6,
    confidence: 92,
    responseTime: "1.7s",
    lowConfidenceFields: 0
  }
];

export const emilyChenEnrichedFields = {
  lowConfidenceFields: [
    {
      id: "direct_phone",
      label: "Direct Phone",
      icon: "📱",
      before: null,
      after: "+1 (650) 555-0147",
      source: "apollo" as const,
      confidence: 58,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "pending_review" as const,
      warningMessage: "LOW confidence - Verify manually",
      reviewStatus: "pending" as const
    },
    {
      id: "mobile_phone",
      label: "Mobile Phone",
      icon: "📱",
      before: null,
      after: "+1 (650) 789-4321",
      source: "apollo" as const,
      confidence: 62,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "pending_review" as const,
      warningMessage: "MEDIUM confidence - Double-check recommended",
      reviewStatus: "pending" as const
    },
    {
      id: "annual_revenue",
      label: "Annual Revenue",
      icon: "💰",
      before: null,
      after: "$8M - $12M",
      source: "apollo" as const,
      confidence: 65,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "pending_review" as const,
      warningMessage: "MEDIUM confidence - Wide range estimate",
      reviewStatus: "pending" as const
    },
    {
      id: "years_in_role",
      label: "Years in Role",
      icon: "📅",
      before: null,
      after: "1.8 years",
      source: "apollo" as const,
      confidence: 55,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "pending_review" as const,
      warningMessage: "LOW confidence - Uncertain estimate",
      reviewStatus: "pending" as const
    },
    {
      id: "office_location",
      label: "Office Location",
      icon: "🏢",
      before: null,
      after: "Palo Alto, CA (approximate)",
      source: "apollo" as const,
      confidence: 68,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "pending_review" as const,
      warningMessage: "MEDIUM confidence - City-level only",
      reviewStatus: "pending" as const
    }
  ],

  highConfidenceFields: [
    {
      id: "email",
      label: "Email",
      icon: "📧",
      before: "emily.c@dataflow.com",
      after: "emily.chen@dataflow.com",
      source: "zoominfo" as const,
      confidence: 97,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "approved" as const,
      reviewStatus: "auto_approved" as const
    },
    {
      id: "linkedin",
      label: "LinkedIn Profile",
      icon: "💼",
      before: null,
      after: "linkedin.com/in/emilychen-marketing",
      source: "zoominfo" as const,
      confidence: 94,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "approved" as const,
      reviewStatus: "auto_approved" as const
    },
    {
      id: "job_title",
      label: "Job Title",
      icon: "💼",
      before: "Director of Marketing",
      after: "Director of Marketing",
      source: "zoominfo" as const,
      confidence: 100,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "approved" as const,
      reviewStatus: "auto_approved" as const
    },
    {
      id: "company_size",
      label: "Company Size",
      icon: "🏢",
      before: "150-200",
      after: "175 employees",
      source: "apollo" as const,
      confidence: 88,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "approved" as const,
      reviewStatus: "auto_approved" as const
    },
    {
      id: "industry",
      label: "Industry",
      icon: "🏭",
      before: "Data Analytics SaaS",
      after: "Data Analytics & Business Intelligence SaaS",
      source: "zoominfo" as const,
      confidence: 96,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "approved" as const,
      reviewStatus: "auto_approved" as const
    },
    {
      id: "founded_year",
      label: "Founded Year",
      icon: "📅",
      before: null,
      after: "2018",
      source: "zoominfo" as const,
      confidence: 99,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "approved" as const,
      reviewStatus: "auto_approved" as const
    },
    {
      id: "total_funding",
      label: "Total Funding",
      icon: "💵",
      before: null,
      after: "$15M (Series A)",
      source: "apollo" as const,
      confidence: 91,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "approved" as const,
      reviewStatus: "auto_approved" as const
    },
    {
      id: "company_website",
      label: "Company Website",
      icon: "🌐",
      before: "dataflow.io",
      after: "https://www.dataflow.io",
      source: "apollo" as const,
      confidence: 100,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "approved" as const,
      reviewStatus: "auto_approved" as const
    },
    {
      id: "seniority_level",
      label: "Seniority Level",
      icon: "📊",
      before: null,
      after: "Director",
      source: "zoominfo" as const,
      confidence: 98,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "approved" as const,
      reviewStatus: "auto_approved" as const
    },
    {
      id: "department",
      label: "Department",
      icon: "🏢",
      before: null,
      after: "Marketing & Growth",
      source: "apollo" as const,
      confidence: 92,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "approved" as const,
      reviewStatus: "auto_approved" as const
    },
    {
      id: "education",
      label: "Education",
      icon: "🎓",
      before: null,
      after: "MBA - Northwestern Kellogg, BS Marketing - USC",
      source: "apollo" as const,
      confidence: 86,
      enrichedAt: "2025-01-06T08:00:00Z",
      status: "approved" as const,
      reviewStatus: "auto_approved" as const
    }
  ]
};

export const emilyChenEnrichmentHistory = [
  {
    id: "enrich_001",
    timestamp: "2025-01-06T08:00:00Z",
    status: "success_low_confidence",
    fieldsEnriched: 16,
    sources: [
      { name: "Apollo.io", fields: 10, avgConfidence: 68, lowConfidenceCount: 5 },
      { name: "ZoomInfo", fields: 6, avgConfidence: 92, lowConfidenceCount: 0 }
    ],
    duration: "3.8s",
    triggeredBy: "auto",
    triggeredByUser: null,
    reviewStatus: "pending",
    lowConfidenceFields: 5
  }
];

export const emilyChenEnrichmentData = {
  leadId: emilyChenLead.id,
  firstName: emilyChenLead.firstName,
  lastName: emilyChenLead.lastName,
  leadTitle: emilyChenLead.title,
  leadCompany: emilyChenLead.company,
  source: emilyChenLead.source,
  score: emilyChenLead.aiScore,
  status: 'low_confidence',
  statusMessage: 'Enriched with low confidence (Review required)',
  lastEnriched: 'Jan 6, 2025 8:00 AM',
  lastEnrichedRelative: '4 hours ago',
  enrichedFields: 16,
  fieldsNeedingReview: 5,
  dataSources: emilyChenDataSources
};

export function getEmilyChenLowConfidenceFields() {
  return emilyChenEnrichedFields.lowConfidenceFields;
}

export function getEmilyChenHighConfidenceFields() {
  return emilyChenEnrichedFields.highConfidenceFields;
}

export function getAllEmilyChenFields() {
  return [...emilyChenEnrichedFields.lowConfidenceFields, ...emilyChenEnrichedFields.highConfidenceFields];
}

export function getEmilyChenFieldsByCategory() {
  const allFields = getAllEmilyChenFields();

  return {
    contactInfo: allFields.filter(f =>
      ['email', 'direct_phone', 'mobile_phone', 'linkedin'].includes(f.id)
    ),
    companyInfo: allFields.filter(f =>
      ['company_size', 'annual_revenue', 'industry', 'company_website', 'founded_year', 'total_funding'].includes(f.id)
    ),
    professionalDetails: allFields.filter(f =>
      ['job_title', 'seniority_level', 'department', 'years_in_role', 'office_location', 'education'].includes(f.id)
    )
  };
}

export const emilyChenQualificationData = {
  lead: {
    id: "lead_004",
    firstName: "Emily",
    lastName: "Chen",
    email: "emily.chen@dataflow.com",
    title: "Director of Marketing",
    company: "DataFlow",
    source: "intelligence",
    status: "new",
  },
  aiScore: {
    overall: 88,
    baseScore: 88,
    hrmsBonus: 0,
    grade: "A",
  },
  bant: {
    budget: { status: "confirmed", score: 5, range: "$40K - $60K", specificAmount: "$50K" },
    authority: { status: "influencer", score: 3, role: "Department Head" },
    need: { status: "urgent", score: 5 },
    timeline: { status: "immediate", score: 5, timeframe: "0-30 days" },
    overallScore: 18,
    maxScore: 20,
    recommendation: "QUALIFIED"
  },
  qualificationDecision: {
    status: "pending",
    recommendation: "qualify"
  }
};
