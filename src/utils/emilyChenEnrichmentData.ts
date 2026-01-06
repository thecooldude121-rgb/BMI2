export interface EmilyChenEnrichedField {
  id: string;
  label: string;
  icon: string;
  before: string;
  after: string;
  source: 'apollo' | 'zoominfo';
  confidence: number;
  enrichedAt: string;
  status: 'low' | 'medium' | 'high';
  autoApproved: boolean;
  confidenceNote?: string;
}

export const emilyChenEnrichmentData = {
  leadId: 'lead_004',
  firstName: 'Emily',
  lastName: 'Chen',
  leadTitle: 'Director of Marketing',
  leadCompany: 'DataFlow',
  source: 'Intelligence',
  score: 88,
  status: 'low_confidence',
  statusMessage: 'Enriched with low confidence (Review required)',
  lastEnriched: 'Jan 6, 2025 8:00 AM',
  lastEnrichedRelative: '4 hours ago',
  enrichedFields: 16,
  fieldsNeedingReview: 5,
  dataSources: [
    {
      id: 'apollo',
      name: 'Apollo.io',
      icon: '🎯',
      status: 'low_confidence',
      lastSync: '4 hours ago',
      fieldsEnriched: 10,
      lowConfidenceCount: 5,
      avgConfidence: 68,
      confidence: '68%',
      responseTime: '2.1s'
    },
    {
      id: 'zoominfo',
      name: 'ZoomInfo',
      icon: '🎯',
      status: 'connected',
      lastSync: '4 hours ago',
      fieldsEnriched: 6,
      lowConfidenceCount: 0,
      avgConfidence: 92,
      confidence: '92%',
      responseTime: '1.9s'
    }
  ]
};

export const emilyChenEnrichedFields: EmilyChenEnrichedField[] = [
  // LOW CONFIDENCE FIELDS (Need Review)
  {
    id: 'direct_phone',
    label: 'Direct Phone',
    icon: '📱',
    before: '(empty)',
    after: '+1 (650) 555-0147',
    source: 'apollo',
    confidence: 58,
    enrichedAt: '4 hours ago',
    status: 'low',
    autoApproved: false,
    confidenceNote: 'LOW - Verify manually'
  },
  {
    id: 'mobile_phone',
    label: 'Mobile Phone',
    icon: '📱',
    before: '(empty)',
    after: '+1 (650) 789-4321',
    source: 'apollo',
    confidence: 62,
    enrichedAt: '4 hours ago',
    status: 'medium',
    autoApproved: false,
    confidenceNote: 'MEDIUM - Double-check recommended'
  },
  {
    id: 'annual_revenue',
    label: 'Annual Revenue',
    icon: '💰',
    before: '(empty)',
    after: '$8M - $12M',
    source: 'apollo',
    confidence: 65,
    enrichedAt: '4 hours ago',
    status: 'medium',
    autoApproved: false,
    confidenceNote: 'MEDIUM - Wide range estimate'
  },
  {
    id: 'years_in_role',
    label: 'Years in Role',
    icon: '📅',
    before: '(empty)',
    after: '1.8 years',
    source: 'apollo',
    confidence: 55,
    enrichedAt: '4 hours ago',
    status: 'low',
    autoApproved: false,
    confidenceNote: 'LOW - Uncertain estimate'
  },
  {
    id: 'office_location',
    label: 'Office Location',
    icon: '🏢',
    before: '(empty)',
    after: 'Palo Alto, CA (approximate)',
    source: 'apollo',
    confidence: 68,
    enrichedAt: '4 hours ago',
    status: 'medium',
    autoApproved: false,
    confidenceNote: 'MEDIUM - City-level only'
  },

  // HIGH CONFIDENCE FIELDS (Auto-approved)
  {
    id: 'email',
    label: 'Email',
    icon: '📧',
    before: 'emily.c@dataflow.com',
    after: 'emily.chen@dataflow.com',
    source: 'zoominfo',
    confidence: 97,
    enrichedAt: '4 hours ago',
    status: 'high',
    autoApproved: true
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Profile',
    icon: '💼',
    before: '(empty)',
    after: 'linkedin.com/in/emilychen-marketing',
    source: 'zoominfo',
    confidence: 94,
    enrichedAt: '4 hours ago',
    status: 'high',
    autoApproved: true
  },
  {
    id: 'job_title',
    label: 'Job Title',
    icon: '💼',
    before: 'Marketing Director',
    after: 'Director of Marketing',
    source: 'zoominfo',
    confidence: 96,
    enrichedAt: '4 hours ago',
    status: 'high',
    autoApproved: true
  },
  {
    id: 'company_size',
    label: 'Company Size',
    icon: '👥',
    before: '50-100',
    after: '75 employees',
    source: 'apollo',
    confidence: 88,
    enrichedAt: '4 hours ago',
    status: 'high',
    autoApproved: true
  },
  {
    id: 'industry',
    label: 'Industry',
    icon: '🏢',
    before: 'Technology',
    after: 'Data Analytics & Business Intelligence',
    source: 'zoominfo',
    confidence: 93,
    enrichedAt: '4 hours ago',
    status: 'high',
    autoApproved: true
  },
  {
    id: 'company_website',
    label: 'Company Website',
    icon: '🌐',
    before: 'dataflow.com',
    after: 'https://www.dataflow.com',
    source: 'apollo',
    confidence: 99,
    enrichedAt: '4 hours ago',
    status: 'high',
    autoApproved: true
  },
  {
    id: 'company_phone',
    label: 'Company Phone',
    icon: '☎️',
    before: '(empty)',
    after: '+1 (650) 555-0100',
    source: 'apollo',
    confidence: 91,
    enrichedAt: '4 hours ago',
    status: 'high',
    autoApproved: true
  },
  {
    id: 'seniority_level',
    label: 'Seniority Level',
    icon: '📊',
    before: 'Manager',
    after: 'Director',
    source: 'zoominfo',
    confidence: 95,
    enrichedAt: '4 hours ago',
    status: 'high',
    autoApproved: true
  },
  {
    id: 'department',
    label: 'Department',
    icon: '🏛️',
    before: 'Marketing',
    after: 'Marketing & Growth',
    source: 'apollo',
    confidence: 89,
    enrichedAt: '4 hours ago',
    status: 'high',
    autoApproved: true
  },
  {
    id: 'location',
    label: 'Location',
    icon: '📍',
    before: 'California',
    after: 'San Francisco Bay Area, CA',
    source: 'zoominfo',
    confidence: 92,
    enrichedAt: '4 hours ago',
    status: 'high',
    autoApproved: true
  },
  {
    id: 'company_founded',
    label: 'Company Founded',
    icon: '📅',
    before: '(empty)',
    after: '2018',
    source: 'apollo',
    confidence: 87,
    enrichedAt: '4 hours ago',
    status: 'high',
    autoApproved: true
  }
];

export const emilyChenEnrichmentHistory = [
  {
    id: 'history_1',
    timestamp: 'Jan 6, 2025 8:00 AM',
    status: 'low_confidence',
    message: 'Enriched with low confidence scores',
    sources: [
      { name: 'Apollo.io', fields: 10, avgConfidence: 68 },
      { name: 'ZoomInfo', fields: 6, avgConfidence: 92 }
    ],
    duration: '3.8 seconds',
    fieldsNeedingReview: 5,
    totalFields: 16
  }
];

export function getEmilyChenLowConfidenceFields() {
  return emilyChenEnrichedFields.filter(f => f.confidence < 70);
}

export function getEmilyChenHighConfidenceFields() {
  return emilyChenEnrichedFields.filter(f => f.confidence >= 85);
}

export function getEmilyChenFieldsByCategory() {
  const fields = emilyChenEnrichedFields;

  return {
    contactInfo: fields.filter(f =>
      ['email', 'direct_phone', 'mobile_phone', 'linkedin'].includes(f.id)
    ),
    companyInfo: fields.filter(f =>
      ['company_size', 'annual_revenue', 'industry', 'company_website', 'company_phone', 'company_founded'].includes(f.id)
    ),
    professionalDetails: fields.filter(f =>
      ['job_title', 'seniority_level', 'department', 'years_in_role', 'location', 'office_location'].includes(f.id)
    )
  };
}
