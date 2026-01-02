import {
  EnhancedAccount,
  AccountActivity,
  AccountNote,
  AccountDocument,
  AccountContact,
  AccountDeal,
  AccountView,
  AccountWorkflow
} from '../types/accounts';

export const generateSampleAccounts = () => {
  const accounts: EnhancedAccount[] = [
    // 1. Acme Corp
    {
      id: 'acc_001',
      name: 'Acme Corp',
      accountNumber: 'ACC-001',
      type: 'customer',
      industry: 'SaaS',
      subIndustry: 'Project Management',
      accountSize: '51-200',
      annualRevenue: 12000000,
      revenueCurrency: 'USD',
      employeeCount: 75,
      website: 'https://www.acmecorp.com',
      phone: '+1-555-0100',
      email: 'contact@acmecorp.com',
      billingAddress: {
        street: '123 Tech Boulevard',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'United States'
      },
      shippingAddress: {
        street: '123 Tech Boulevard',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'United States'
      },
      description: 'Leading SaaS company specializing in project management solutions.',
      businessModel: 'B2B SaaS',
      foundingYear: 2015,
      status: 'active',
      rating: 'warm',
      priority: 'high',
      source: 'lead-gen',
      sourceDetails: 'Apollo.io',
      ownerId: 'user_001',
      linkedinUrl: 'https://linkedin.com/company/acme-corp',
      customFields: {},
      tags: ['saas', 'project-management'],
      healthScore: 78,
      engagementScore: 75,
      firstContactDate: '2024-01-15T10:00:00Z',
      lastActivityDate: '2025-11-20T14:30:00Z',
      dataConsent: true,
      doNotContact: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2025-11-20T14:30:00Z',
      createdBy: 'user_001',
      updatedBy: 'user_001',
      relatedContacts: [
        { id: 'c1', accountId: 'acc_001', name: 'John Smith', role: 'VP Sales', email: 'john@acmecorp.com', isPrimary: true },
        { id: 'c2', accountId: 'acc_001', name: 'Jane Doe', role: 'Product Manager', email: 'jane@acmecorp.com', isPrimary: false }
      ],
      relatedDeals: [
        { id: 'd1', accountId: 'acc_001', name: 'Acme - Enterprise', amount: 50000, stage: 'Proposal', closeDate: '2026-03-15', probability: 60 }
      ]
    },

    // 2. TechStart Inc (HRMS CONNECTION)
    {
      id: 'acc_002',
      name: 'TechStart Inc',
      accountNumber: 'ACC-002',
      type: 'customer',
      industry: 'FinTech',
      subIndustry: 'Banking',
      accountSize: '11-50',
      annualRevenue: 8000000,
      revenueCurrency: 'USD',
      employeeCount: 45,
      website: 'https://www.techstart.com',
      phone: '+1-555-0200',
      email: 'info@techstart.com',
      billingAddress: {
        street: '456 Finance Ave',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States'
      },
      shippingAddress: {
        street: '456 Finance Ave',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States'
      },
      description: 'Fast-growing FinTech company with 45% YoY growth specializing in banking solutions.',
      businessModel: 'B2B SaaS',
      foundingYear: 2020,
      status: 'active',
      rating: 'hot',
      priority: 'high',
      source: 'hrms',
      sourceDetails: 'Recruitment',
      hrmsConnection: {
        hasConnection: true,
        recruitedEmployees: 1,
        lastRecruitmentDate: '2024-11-15',
        recruitedContacts: [
          { name: 'Sarah Lee', position: 'CFO', dateRecruited: '2024-11-15' }
        ]
      },
      ownerId: 'user_001',
      linkedinUrl: 'https://linkedin.com/company/techstart',
      customFields: {
        growth_rate: '+45% YoY'
      },
      tags: ['fintech', 'high-growth', 'hrms-connection'],
      healthScore: 92,
      engagementScore: 90,
      firstContactDate: '2024-09-10T10:00:00Z',
      lastActivityDate: '2025-11-28T16:00:00Z',
      dataConsent: true,
      doNotContact: false,
      createdAt: '2024-09-10T10:00:00Z',
      updatedAt: '2025-11-28T16:00:00Z',
      createdBy: 'user_001',
      updatedBy: 'user_001',
      relatedContacts: [
        { id: 'c3', accountId: 'acc_002', name: 'Sarah Lee', role: 'CFO', email: 'sarah@techstart.com', isPrimary: true },
        { id: 'c4', accountId: 'acc_002', name: 'Mike Chen', role: 'CTO', email: 'mike@techstart.com', isPrimary: false },
        { id: 'c5', accountId: 'acc_002', name: 'Lisa Wang', role: 'VP Ops', email: 'lisa@techstart.com', isPrimary: false }
      ],
      relatedDeals: [
        { id: 'd2', accountId: 'acc_002', name: 'TechStart - Growth', amount: 42000, stage: 'Negotiation', closeDate: '2026-02-28', probability: 75 },
        { id: 'd3', accountId: 'acc_002', name: 'TechStart - Add-on', amount: 18000, stage: 'Proposal', closeDate: '2026-03-31', probability: 60 }
      ]
    },

    // 3. BigCo Enterprise (PARTIAL HRMS CONNECTION)
    {
      id: 'acc_003',
      name: 'BigCo Enterprise',
      accountNumber: 'ACC-003',
      type: 'customer',
      industry: 'Manufacturing',
      subIndustry: 'Hardware',
      accountSize: '201-500',
      annualRevenue: 45000000,
      revenueCurrency: 'USD',
      employeeCount: 200,
      website: 'https://www.bigco.com',
      phone: '+1-555-0300',
      email: 'contact@bigco.com',
      billingAddress: {
        street: '789 Industrial Blvd',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'United States'
      },
      shippingAddress: {
        street: '789 Industrial Blvd',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'United States'
      },
      description: 'Major manufacturing company specializing in hardware and industrial equipment.',
      businessModel: 'B2B Manufacturing',
      foundingYear: 1995,
      stockSymbol: 'BIGC',
      status: 'active',
      rating: 'hot',
      priority: 'high',
      source: 'manual',
      sourceDetails: 'Trade Show',
      hrmsConnection: {
        hasConnection: true,
        recruitedEmployees: 2,
        lastRecruitmentDate: '2024-08-20',
        recruitedContacts: [
          { name: 'David Miller', position: 'Operations Manager', dateRecruited: '2023-05-10' },
          { name: 'Jennifer Brown', position: 'Supply Chain Director', dateRecruited: '2024-08-20' }
        ]
      },
      ownerId: 'user_002',
      linkedinUrl: 'https://linkedin.com/company/bigco',
      customFields: {
        stock_exchange: 'NASDAQ'
      },
      tags: ['manufacturing', 'enterprise', 'public-company', 'hrms-connection'],
      healthScore: 85,
      engagementScore: 83,
      firstContactDate: '2023-02-20T10:00:00Z',
      lastActivityDate: '2025-11-25T11:30:00Z',
      dataConsent: true,
      doNotContact: false,
      createdAt: '2023-02-20T10:00:00Z',
      updatedAt: '2025-11-25T11:30:00Z',
      createdBy: 'user_002',
      updatedBy: 'user_002',
      relatedContacts: [
        { id: 'c6', accountId: 'acc_003', name: 'Mike Chen', role: 'Director Ops', email: 'mchen@bigco.com', isPrimary: true },
        { id: 'c7', accountId: 'acc_003', name: 'David Kumar', role: 'IT Manager', email: 'dkumar@bigco.com', isPrimary: false },
        { id: 'c8', accountId: 'acc_003', name: 'Susan Park', role: 'VP Engineering', email: 'spark@bigco.com', isPrimary: false },
        { id: 'c9', accountId: 'acc_003', name: 'Robert Lee', role: 'Procurement Head', email: 'rlee@bigco.com', isPrimary: false }
      ],
      relatedDeals: [
        { id: 'd4', accountId: 'acc_003', name: 'BigCo - Platform', amount: 75000, stage: 'Qualified', closeDate: '2026-04-30', probability: 50 },
        { id: 'd5', accountId: 'acc_003', name: 'BigCo - Integration', amount: 35000, stage: 'Proposal', closeDate: '2026-03-15', probability: 65 },
        { id: 'd6', accountId: 'acc_003', name: 'BigCo - Training', amount: 12000, stage: 'Negotiation', closeDate: '2026-02-28', probability: 80 }
      ]
    },

    // 4. StartCo
    {
      id: 'acc_004',
      name: 'StartCo',
      accountNumber: 'ACC-004',
      type: 'customer',
      industry: 'E-commerce',
      subIndustry: 'Retail',
      accountSize: '11-50',
      annualRevenue: 3000000,
      revenueCurrency: 'USD',
      employeeCount: 30,
      website: 'https://www.startco.com',
      phone: '+1-555-0400',
      email: 'hello@startco.com',
      billingAddress: {
        street: '321 Commerce Street',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'United States'
      },
      shippingAddress: {
        street: '321 Commerce Street',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'United States'
      },
      description: 'Emerging e-commerce startup with recent seed funding of $2M in Q2 2025.',
      businessModel: 'B2C E-commerce',
      foundingYear: 2023,
      status: 'active',
      rating: 'warm',
      priority: 'medium',
      source: 'website',
      sourceDetails: 'Contact Form',
      ownerId: 'user_003',
      linkedinUrl: 'https://linkedin.com/company/startco',
      customFields: {
        funding: '$2M Seed (Q2 2025)'
      },
      tags: ['e-commerce', 'startup', 'funded'],
      healthScore: 74,
      engagementScore: 70,
      firstContactDate: '2025-06-01T10:00:00Z',
      lastActivityDate: '2025-11-15T09:00:00Z',
      dataConsent: true,
      doNotContact: false,
      createdAt: '2025-06-01T10:00:00Z',
      updatedAt: '2025-11-15T09:00:00Z',
      createdBy: 'user_003',
      updatedBy: 'user_003',
      relatedContacts: [
        { id: 'c10', accountId: 'acc_004', name: 'Lisa Wong', role: 'CEO', email: 'lisa@startco.com', isPrimary: true }
      ],
      relatedDeals: [
        { id: 'd7', accountId: 'acc_004', name: 'StartCo - Basic', amount: 28000, stage: 'Proposal', closeDate: '2025-12-31', probability: 55 }
      ]
    },

    // 5. InnovateLabs (NO DEALS - OPPORTUNITY)
    {
      id: 'acc_005',
      name: 'InnovateLabs',
      accountNumber: 'ACC-005',
      type: 'prospect',
      industry: 'HealthTech',
      subIndustry: 'MedTech',
      accountSize: '51-200',
      annualRevenue: 25000000,
      revenueCurrency: 'USD',
      employeeCount: 120,
      website: 'https://www.innovatelabs.com',
      phone: '+1-555-0500',
      email: 'info@innovatelabs.com',
      billingAddress: {
        street: '555 Medical Drive',
        city: 'Boston',
        state: 'MA',
        postalCode: '02115',
        country: 'United States'
      },
      shippingAddress: {
        street: '555 Medical Drive',
        city: 'Boston',
        state: 'MA',
        postalCode: '02115',
        country: 'United States'
      },
      description: 'Innovative health technology company developing cutting-edge medical devices.',
      businessModel: 'B2B MedTech',
      foundingYear: 2018,
      status: 'active',
      rating: 'cold',
      priority: 'medium',
      source: 'lead-gen',
      sourceDetails: 'ZoomInfo',
      ownerId: 'user_002',
      linkedinUrl: 'https://linkedin.com/company/innovatelabs',
      customFields: {},
      tags: ['healthtech', 'medtech', 'opportunity'],
      healthScore: 58,
      engagementScore: 45,
      firstContactDate: '2025-10-01T10:00:00Z',
      lastActivityDate: '2025-10-15T14:00:00Z',
      dataConsent: true,
      doNotContact: false,
      createdAt: '2025-10-01T10:00:00Z',
      updatedAt: '2025-10-15T14:00:00Z',
      createdBy: 'user_002',
      updatedBy: 'user_002',
      relatedContacts: [
        { id: 'c11', accountId: 'acc_005', name: 'David Kumar', role: 'CTO', email: 'dkumar@innovatelabs.com', isPrimary: true },
        { id: 'c12', accountId: 'acc_005', name: 'Emma Wilson', role: 'VP Product', email: 'ewilson@innovatelabs.com', isPrimary: false }
      ],
      relatedDeals: []
    }
  ];

  const views: AccountView[] = [
    {
      id: 'view_001',
      name: 'All Accounts',
      description: 'View all accounts',
      isDefault: true,
      filters: {},
      sortBy: 'name',
      sortOrder: 'asc',
      visibleColumns: ['name', 'industry', 'status', 'healthScore'],
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'view_002',
      name: 'HRMS Connections',
      description: 'Accounts with HRMS recruitment connections',
      isDefault: false,
      filters: { source: ['hrms'] },
      sortBy: 'healthScore',
      sortOrder: 'desc',
      visibleColumns: ['name', 'industry', 'status', 'healthScore'],
      createdBy: 'user_001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'view_003',
      name: 'High Priority',
      description: 'High priority accounts',
      isDefault: false,
      filters: { priority: ['high', 'critical'] },
      sortBy: 'healthScore',
      sortOrder: 'desc',
      visibleColumns: ['name', 'industry', 'priority', 'healthScore'],
      createdBy: 'user_001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  return {
    accounts,
    activities: [],
    notes: [],
    documents: [],
    accountContacts: [],
    accountDeals: [],
    views,
    workflows: []
  };
};
