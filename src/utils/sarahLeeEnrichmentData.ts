export interface EnrichedField {
  id: string;
  category: 'contact' | 'company' | 'professional';
  fieldName: string;
  icon: string;
  source: 'Apollo.io' | 'ZoomInfo';
  before: string;
  after: string;
  confidence: number;
  enrichedAt: string;
}

export interface DataSource {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected';
  lastSync: string;
  fieldsEnriched: number;
}

export interface EnrichmentHistoryEntry {
  id: string;
  timestamp: string;
  status: 'success' | 'partial' | 'failed';
  message: string;
  sources: string;
  duration: string;
}

export interface LeadEnrichmentData {
  leadId: string;
  leadName: string;
  leadTitle: string;
  leadCompany: string;
  source: string;
  score: number;
  status: 'enriched' | 'pending' | 'failed';
  lastEnriched: string;
  totalFields: number;
  dataSources: DataSource[];
  enrichedFields: EnrichedField[];
  history: EnrichmentHistoryEntry[];
}

export const sarahLeeEnrichmentData: LeadEnrichmentData = {
  leadId: 'lead-sarah-lee',
  leadName: 'Sarah Lee',
  leadTitle: 'CFO',
  leadCompany: 'TechStart Inc',
  source: 'HRMS',
  score: 92,
  status: 'enriched',
  lastEnriched: 'Jan 6, 2025 10:30 AM',
  totalFields: 20,
  dataSources: [
    {
      id: 'apollo',
      name: 'Apollo.io',
      icon: '🎯',
      status: 'connected',
      lastSync: '2h ago',
      fieldsEnriched: 12
    },
    {
      id: 'zoominfo',
      name: 'ZoomInfo',
      icon: '🎯',
      status: 'connected',
      lastSync: '2h ago',
      fieldsEnriched: 8
    }
  ],
  enrichedFields: [
    // CONTACT INFORMATION (5 fields)
    {
      id: 'email',
      category: 'contact',
      fieldName: 'Email',
      icon: '📧',
      source: 'Apollo.io',
      before: 'sarah.l@techstart.com',
      after: 'sarah.lee@techstart.com',
      confidence: 95,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'direct-phone',
      category: 'contact',
      fieldName: 'Direct Phone',
      icon: '📱',
      source: 'ZoomInfo',
      before: '(empty)',
      after: '+1 (415) 234-5678',
      confidence: 88,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'linkedin',
      category: 'contact',
      fieldName: 'LinkedIn Profile',
      icon: '💼',
      source: 'Apollo.io',
      before: '(empty)',
      after: 'linkedin.com/in/sarahlee-cfo',
      confidence: 92,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'mobile-phone',
      category: 'contact',
      fieldName: 'Mobile Phone',
      icon: '📱',
      source: 'Apollo.io',
      before: '(empty)',
      after: '+1 (415) 789-0123',
      confidence: 85,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'office-location',
      category: 'contact',
      fieldName: 'Office Location',
      icon: '🏢',
      source: 'ZoomInfo',
      before: 'San Francisco, CA',
      after: '123 Market St, San Francisco, CA 94103',
      confidence: 90,
      enrichedAt: '2 hours ago'
    },
    // COMPANY INFORMATION (8 fields)
    {
      id: 'company-size',
      category: 'company',
      fieldName: 'Company Size',
      icon: '🏢',
      source: 'Apollo.io',
      before: '50-100',
      after: '85 employees',
      confidence: 94,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'annual-revenue',
      category: 'company',
      fieldName: 'Annual Revenue',
      icon: '💰',
      source: 'ZoomInfo',
      before: '(empty)',
      after: '$12M - $15M',
      confidence: 87,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'industry',
      category: 'company',
      fieldName: 'Industry',
      icon: '🏭',
      source: 'Apollo.io',
      before: 'Technology',
      after: 'Enterprise SaaS - Financial Technology',
      confidence: 96,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'founded-year',
      category: 'company',
      fieldName: 'Founded Year',
      icon: '📅',
      source: 'ZoomInfo',
      before: '(empty)',
      after: '2019',
      confidence: 98,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'total-funding',
      category: 'company',
      fieldName: 'Total Funding',
      icon: '💵',
      source: 'Apollo.io',
      before: '(empty)',
      after: '$23M (Series A)',
      confidence: 91,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'company-website',
      category: 'company',
      fieldName: 'Company Website',
      icon: '🌐',
      source: 'Apollo.io',
      before: 'techstart.com',
      after: 'https://www.techstart.com',
      confidence: 100,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'company-hq',
      category: 'company',
      fieldName: 'Company HQ Address',
      icon: '🏢',
      source: 'ZoomInfo',
      before: '(empty)',
      after: '500 Howard St, San Francisco, CA 94105',
      confidence: 93,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'international-presence',
      category: 'company',
      fieldName: 'International Presence',
      icon: '🌍',
      source: 'Apollo.io',
      before: '(empty)',
      after: 'USA, UK, Germany',
      confidence: 89,
      enrichedAt: '2 hours ago'
    },
    // PROFESSIONAL DETAILS (7 fields)
    {
      id: 'job-title',
      category: 'professional',
      fieldName: 'Job Title',
      icon: '💼',
      source: 'Apollo.io',
      before: 'CFO',
      after: 'Chief Financial Officer',
      confidence: 100,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'seniority-level',
      category: 'professional',
      fieldName: 'Seniority Level',
      icon: '📊',
      source: 'ZoomInfo',
      before: '(empty)',
      after: 'C-Level Executive',
      confidence: 97,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'department',
      category: 'professional',
      fieldName: 'Department',
      icon: '🏢',
      source: 'Apollo.io',
      before: 'Finance',
      after: 'Finance & Operations',
      confidence: 95,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'years-in-role',
      category: 'professional',
      fieldName: 'Years in Role',
      icon: '📅',
      source: 'ZoomInfo',
      before: '(empty)',
      after: '2.5 years',
      confidence: 86,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'education',
      category: 'professional',
      fieldName: 'Education',
      icon: '🎓',
      source: 'Apollo.io',
      before: '(empty)',
      after: 'MBA - Stanford GSB, BS Finance - UC Berkeley',
      confidence: 92,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'skills',
      category: 'professional',
      fieldName: 'Skills & Expertise',
      icon: '💪',
      source: 'ZoomInfo',
      before: '(empty)',
      after: 'Financial Planning, M&A, Strategic Finance, SaaS',
      confidence: 88,
      enrichedAt: '2 hours ago'
    },
    {
      id: 'previous-companies',
      category: 'professional',
      fieldName: 'Previous Companies',
      icon: '📜',
      source: 'Apollo.io',
      before: '(empty)',
      after: 'Oracle (Senior Manager), Salesforce (Analyst)',
      confidence: 90,
      enrichedAt: '2 hours ago'
    }
  ],
  history: [
    {
      id: 'hist-1',
      timestamp: 'Jan 6, 2025 10:30 AM',
      status: 'success',
      message: 'Successfully enriched 20 fields',
      sources: 'Apollo.io (12 fields), ZoomInfo (8 fields)',
      duration: '3.2 seconds'
    },
    {
      id: 'hist-2',
      timestamp: 'Jan 5, 2025 2:15 PM',
      status: 'partial',
      message: 'Partial enrichment (ZoomInfo API timeout)',
      sources: 'Apollo.io (12 fields), ZoomInfo (0 fields)',
      duration: '8.5 seconds'
    },
    {
      id: 'hist-3',
      timestamp: 'Jan 4, 2025 9:00 AM',
      status: 'success',
      message: 'Initial enrichment completed',
      sources: 'Apollo.io (10 fields), ZoomInfo (6 fields)',
      duration: '4.1 seconds'
    }
  ]
};
