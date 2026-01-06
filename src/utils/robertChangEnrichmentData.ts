export interface RobertChangField {
  id: string;
  category: 'contact' | 'company' | 'professional';
  icon: string;
  label: string;
  value: string | null;
  status: 'available' | 'missing';
  source: 'manual' | 'none';
  canEdit: boolean;
  canSearch: boolean;
}

export const robertChangEnrichmentData = {
  leadId: 'lead-005',
  firstName: 'Robert',
  lastName: 'Chang',
  leadTitle: 'CEO',
  leadCompany: 'StartCo',
  source: 'Manual Entry',
  score: 65,
  status: 'failed',
  statusMessage: 'No enrichment data found',
  lastAttempt: '2026-01-06T11:00:00Z',
  lastAttemptRelative: 'just now',
  enrichedFields: 0,
  totalFields: 20,
  availableFields: 3,
  missingFields: 17,
  dataSources: [
    {
      id: 'apollo',
      name: 'Apollo.io',
      icon: '🎯',
      status: 'no_match',
      lastSync: 'Jan 6, 2025 11:00 AM',
      searchStatus: 'Complete',
      fieldsEnriched: 0,
      matchesFound: 0,
      responseTime: '1.4s'
    },
    {
      id: 'zoominfo',
      name: 'ZoomInfo',
      icon: '🎯',
      status: 'no_match',
      lastSync: 'Jan 6, 2025 11:00 AM',
      searchStatus: 'Complete',
      fieldsEnriched: 0,
      matchesFound: 0,
      responseTime: '1.4s'
    }
  ]
};

export const robertChangFields: RobertChangField[] = [
  // CONTACT INFORMATION (2/5 available)
  {
    id: 'email',
    category: 'contact',
    icon: '📧',
    label: 'Email',
    value: 'robert@startco.io',
    status: 'available',
    source: 'manual',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'direct_phone',
    category: 'contact',
    icon: '📱',
    label: 'Direct Phone',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'linkedin',
    category: 'contact',
    icon: '💼',
    label: 'LinkedIn Profile',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: true
  },
  {
    id: 'mobile_phone',
    category: 'contact',
    icon: '📱',
    label: 'Mobile Phone',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'office_location',
    category: 'contact',
    icon: '🏢',
    label: 'Office Location',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },

  // COMPANY INFORMATION (2/8 available)
  {
    id: 'company_name',
    category: 'company',
    icon: '🏢',
    label: 'Company Name',
    value: 'StartCo',
    status: 'available',
    source: 'manual',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'company_website',
    category: 'company',
    icon: '🌐',
    label: 'Company Website',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: true
  },
  {
    id: 'company_size',
    category: 'company',
    icon: '🏢',
    label: 'Company Size',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'annual_revenue',
    category: 'company',
    icon: '💰',
    label: 'Annual Revenue',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'industry',
    category: 'company',
    icon: '🏭',
    label: 'Industry',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'founded_year',
    category: 'company',
    icon: '📅',
    label: 'Founded Year',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'total_funding',
    category: 'company',
    icon: '💵',
    label: 'Total Funding',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'international_presence',
    category: 'company',
    icon: '🌍',
    label: 'International Presence',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },

  // PROFESSIONAL DETAILS (1/7 available)
  {
    id: 'job_title',
    category: 'professional',
    icon: '💼',
    label: 'Job Title',
    value: 'CEO',
    status: 'available',
    source: 'manual',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'seniority_level',
    category: 'professional',
    icon: '📊',
    label: 'Seniority Level',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'department',
    category: 'professional',
    icon: '🏢',
    label: 'Department',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'years_in_role',
    category: 'professional',
    icon: '📅',
    label: 'Years in Role',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'education',
    category: 'professional',
    icon: '🎓',
    label: 'Education',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'skills',
    category: 'professional',
    icon: '💪',
    label: 'Skills & Expertise',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  },
  {
    id: 'previous_companies',
    category: 'professional',
    icon: '📜',
    label: 'Previous Companies',
    value: null,
    status: 'missing',
    source: 'none',
    canEdit: true,
    canSearch: false
  }
];

export const robertChangEnrichmentHistory = [
  {
    id: 'history-1',
    timestamp: '2026-01-06T11:00:00Z',
    status: 'failed',
    message: 'Enrichment failed - No matching records',
    sources: [
      { name: 'Apollo.io', matches: 0 },
      { name: 'ZoomInfo', matches: 0 }
    ],
    duration: '2.8s',
    reason: 'Lead not found in external databases',
    triggeredBy: 'auto',
    fieldsEnriched: 0
  }
];

export const alternativeEnrichmentOptions = [
  {
    id: 'linkedin-search',
    icon: '🔍',
    title: 'Manual LinkedIn Search',
    description: 'Search for Robert Chang on LinkedIn and import profile',
    action: 'Search LinkedIn',
    recommended: true
  },
  {
    id: 'website-scrape',
    icon: '🌐',
    title: 'Company Website Scraping',
    description: "Visit StartCo's website and extract public information",
    actions: ['Visit Website', 'Scrape Data'],
    recommended: true
  },
  {
    id: 'manual-entry',
    icon: '✏️',
    title: 'Manual Data Entry',
    description: 'Fill in fields manually based on research',
    action: 'Start Manual Entry',
    recommended: false
  },
  {
    id: 'email-verification',
    icon: '📧',
    title: 'Email Verification',
    description: 'Verify email is valid and send outreach to gather info',
    action: 'Verify Email',
    recommended: false
  }
];

export const getContactFields = () => robertChangFields.filter(f => f.category === 'contact');
export const getCompanyFields = () => robertChangFields.filter(f => f.category === 'company');
export const getProfessionalFields = () => robertChangFields.filter(f => f.category === 'professional');

export const getAvailableFields = () => robertChangFields.filter(f => f.status === 'available');
export const getMissingFields = () => robertChangFields.filter(f => f.status === 'missing');
