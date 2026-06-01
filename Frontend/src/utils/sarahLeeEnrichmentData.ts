export interface EnrichedField {
  id: string;
  category: 'contact' | 'company' | 'professional';
  fieldName: string;
  icon: string;
  source: 'Apollo.io' | 'ZoomInfo';
  before: string | null;
  after: string;
  confidence: number;
  enrichedAt: string;
  status: 'added' | 'updated';
}

export interface DataSource {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'disconnected';
  lastSync: string;
  fieldsEnriched: number;
  confidence: number;
  responseTime: string;
}

export interface EnrichmentHistoryEntry {
  id: string;
  timestamp: string;
  status: 'success' | 'partial' | 'failed';
  message: string;
  sources: string;
  duration: string;
  triggeredBy: 'auto' | 'manual';
  triggeredByUser: string | null;
  fieldsEnriched: number;
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
      lastSync: '2 hours ago',
      fieldsEnriched: 12,
      confidence: 93,
      responseTime: '1.8s'
    },
    {
      id: 'zoominfo',
      name: 'ZoomInfo',
      icon: '🎯',
      status: 'connected',
      lastSync: '2 hours ago',
      fieldsEnriched: 8,
      confidence: 89,
      responseTime: '2.1s'
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
      enrichedAt: '2 hours ago',
      status: 'updated'
    },
    {
      id: 'direct-phone',
      category: 'contact',
      fieldName: 'Direct Phone',
      icon: '📱',
      source: 'ZoomInfo',
      before: null,
      after: '+1 (415) 234-5678',
      confidence: 88,
      enrichedAt: '2 hours ago',
      status: 'added'
    },
    {
      id: 'linkedin',
      category: 'contact',
      fieldName: 'LinkedIn Profile',
      icon: '💼',
      source: 'Apollo.io',
      before: null,
      after: 'linkedin.com/in/sarahlee-cfo',
      confidence: 92,
      enrichedAt: '2 hours ago',
      status: 'added'
    },
    {
      id: 'mobile-phone',
      category: 'contact',
      fieldName: 'Mobile Phone',
      icon: '📱',
      source: 'Apollo.io',
      before: null,
      after: '+1 (415) 789-0123',
      confidence: 85,
      enrichedAt: '2 hours ago',
      status: 'added'
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
      enrichedAt: '2 hours ago',
      status: 'updated'
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
      enrichedAt: '2 hours ago',
      status: 'updated'
    },
    {
      id: 'annual-revenue',
      category: 'company',
      fieldName: 'Annual Revenue',
      icon: '💰',
      source: 'ZoomInfo',
      before: null,
      after: '$12M - $15M',
      confidence: 87,
      enrichedAt: '2 hours ago',
      status: 'added'
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
      enrichedAt: '2 hours ago',
      status: 'updated'
    },
    {
      id: 'founded-year',
      category: 'company',
      fieldName: 'Founded Year',
      icon: '📅',
      source: 'ZoomInfo',
      before: null,
      after: '2019',
      confidence: 98,
      enrichedAt: '2 hours ago',
      status: 'added'
    },
    {
      id: 'total-funding',
      category: 'company',
      fieldName: 'Total Funding',
      icon: '💵',
      source: 'Apollo.io',
      before: null,
      after: '$23M (Series A)',
      confidence: 91,
      enrichedAt: '2 hours ago',
      status: 'added'
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
      enrichedAt: '2 hours ago',
      status: 'updated'
    },
    {
      id: 'company-hq',
      category: 'company',
      fieldName: 'Company HQ Address',
      icon: '🏢',
      source: 'ZoomInfo',
      before: null,
      after: '500 Howard St, San Francisco, CA 94105',
      confidence: 93,
      enrichedAt: '2 hours ago',
      status: 'added'
    },
    {
      id: 'international-presence',
      category: 'company',
      fieldName: 'International Presence',
      icon: '🌍',
      source: 'Apollo.io',
      before: null,
      after: 'USA, UK, Germany',
      confidence: 89,
      enrichedAt: '2 hours ago',
      status: 'added'
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
      enrichedAt: '2 hours ago',
      status: 'updated'
    },
    {
      id: 'seniority-level',
      category: 'professional',
      fieldName: 'Seniority Level',
      icon: '📊',
      source: 'ZoomInfo',
      before: null,
      after: 'C-Level Executive',
      confidence: 97,
      enrichedAt: '2 hours ago',
      status: 'added'
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
      enrichedAt: '2 hours ago',
      status: 'updated'
    },
    {
      id: 'years-in-role',
      category: 'professional',
      fieldName: 'Years in Role',
      icon: '📅',
      source: 'ZoomInfo',
      before: null,
      after: '2.5 years',
      confidence: 86,
      enrichedAt: '2 hours ago',
      status: 'added'
    },
    {
      id: 'education',
      category: 'professional',
      fieldName: 'Education',
      icon: '🎓',
      source: 'Apollo.io',
      before: null,
      after: 'MBA - Stanford GSB, BS Finance - UC Berkeley',
      confidence: 92,
      enrichedAt: '2 hours ago',
      status: 'added'
    },
    {
      id: 'skills',
      category: 'professional',
      fieldName: 'Skills & Expertise',
      icon: '💪',
      source: 'ZoomInfo',
      before: null,
      after: 'Financial Planning, M&A, Strategic Finance, SaaS Metrics',
      confidence: 88,
      enrichedAt: '2 hours ago',
      status: 'added'
    },
    {
      id: 'previous-companies',
      category: 'professional',
      fieldName: 'Previous Companies',
      icon: '📜',
      source: 'Apollo.io',
      before: null,
      after: 'Oracle (Senior Manager), Salesforce (Financial Analyst)',
      confidence: 90,
      enrichedAt: '2 hours ago',
      status: 'added'
    }
  ],
  history: [
    {
      id: 'enrich_003',
      timestamp: 'Jan 6, 2025 10:30 AM',
      status: 'success',
      message: 'Successfully enriched 20 fields',
      sources: 'Apollo.io (12 fields), ZoomInfo (8 fields)',
      duration: '3.2s',
      triggeredBy: 'auto',
      triggeredByUser: null,
      fieldsEnriched: 20
    },
    {
      id: 'enrich_002',
      timestamp: 'Jan 5, 2025 2:15 PM',
      status: 'partial',
      message: 'Partial enrichment - ZoomInfo API timeout',
      sources: 'Apollo.io (12 fields), ZoomInfo (0 fields)',
      duration: '8.5s',
      triggeredBy: 'manual',
      triggeredByUser: 'John Smith',
      fieldsEnriched: 12
    },
    {
      id: 'enrich_001',
      timestamp: 'Jan 4, 2025 9:00 AM',
      status: 'success',
      message: 'Initial enrichment completed',
      sources: 'Apollo.io (10 fields), ZoomInfo (6 fields)',
      duration: '4.1s',
      triggeredBy: 'auto',
      triggeredByUser: null,
      fieldsEnriched: 16
    }
  ]
};
