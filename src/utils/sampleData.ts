import { Lead, Company, Contact, Activity, EmailTemplate, Sequence, Deal, Task, Employee, Meeting } from '../types/crm';

export const generateSampleData = () => {
  const companies: Company[] = [
    {
      id: '1',
      name: 'TechCorp Solutions',
      industry: 'Technology',
      size: 'Medium',
      website: 'https://techcorp.com',
      phone: '+1-555-0101',
      address: '123 Tech Street, San Francisco, CA 94105',
      description: 'Leading technology solutions provider',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      customFields: {}
    },
    {
      id: '2',
      name: 'Global Manufacturing Inc',
      industry: 'Manufacturing',
      size: 'Large',
      website: 'https://globalmfg.com',
      phone: '+1-555-0102',
      address: '456 Industrial Blvd, Detroit, MI 48201',
      description: 'International manufacturing company',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
      customFields: {}
    },
    {
      id: '3',
      name: 'StartupX',
      industry: 'Technology',
      size: 'Small',
      website: 'https://startupx.io',
      phone: '+1-555-0103',
      address: '789 Innovation Ave, Austin, TX 78701',
      description: 'Innovative startup in AI space',
      createdAt: new Date('2024-01-17'),
      updatedAt: new Date('2024-01-17'),
      customFields: {}
    }
  ];

  const contacts: Contact[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@techcorp.com',
      phone: '+1-555-1001',
      position: 'CEO',
      companyId: '1',
      leadSource: 'Website',
      tags: ['decision-maker', 'tech-savvy'],
      socialProfiles: {
        linkedin: 'https://linkedin.com/in/johnsmith'
      },
      preferences: {
        communicationMethod: 'email',
        timezone: 'PST'
      },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      customFields: {}
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@globalmfg.com',
      phone: '+1-555-1002',
      position: 'VP of Operations',
      companyId: '2',
      leadSource: 'Referral',
      tags: ['operations', 'budget-holder'],
      socialProfiles: {
        linkedin: 'https://linkedin.com/in/sarahjohnson'
      },
      preferences: {
        communicationMethod: 'phone',
        timezone: 'EST'
      },
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
      customFields: {}
    }
  ];

  const leads: Lead[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah.chen@techcorp.com',
      phone: '+1-555-2001',
      company: 'TechCorp Solutions',
      position: 'CTO',
      stage: 'qualified',
      score: 92,
      source: 'LinkedIn',
      assignedTo: 'user1',
      value: 85000,
      probability: 85,
      status: 'active',
      industry: 'Technology',
      tags: ['enterprise', 'decision-maker', 'high-value'],
      notes: 'CTO at fast-growing tech company. Looking for enterprise CRM solution to scale sales operations. Has budget approved and timeline of Q1 implementation.',
      createdAt: new Date('2024-01-18'),
      lastContact: '2024-01-20'
    },
    {
      id: '2',
      name: 'Michael Rodriguez',
      email: 'michael.rodriguez@healthplus.com',
      phone: '+1-555-2002',
      company: 'HealthPlus Medical',
      position: 'VP of Operations',
      stage: 'contacted',
      score: 78,
      source: 'Referral',
      assignedTo: 'user2',
      value: 45000,
      probability: 60,
      status: 'active',
      industry: 'Healthcare',
      tags: ['healthcare', 'operations', 'compliance'],
      notes: 'VP of Operations at regional healthcare provider. Interested in patient management and compliance solutions. Evaluating multiple vendors.',
      createdAt: new Date('2024-01-17'),
      lastContact: '2024-01-19'
    },
    {
      id: '3',
      name: 'Jennifer Kim',
      email: 'jennifer.kim@financegroup.com',
      phone: '+1-555-2003',
      company: 'Finance Group LLC',
      position: 'CFO',
      stage: 'proposal',
      score: 88,
      source: 'Trade Show',
      assignedTo: 'user1',
      value: 65000,
      probability: 70,
      status: 'active',
      industry: 'Finance',
      tags: ['finance', 'cfo', 'budget-holder'],
      notes: 'CFO looking for financial reporting and analytics platform. Met at FinTech conference. Very interested in ROI tracking features.',
      createdAt: new Date('2024-01-16'),
      lastContact: '2024-01-21'
    },
    {
      id: '4',
      name: 'David Thompson',
      email: 'david.thompson@manufacturing.com',
      phone: '+1-555-2004',
      company: 'Advanced Manufacturing Inc',
      position: 'Director of Operations',
      stage: 'new',
      score: 65,
      source: 'Website',
      assignedTo: 'user2',
      value: 35000,
      probability: 30,
      status: 'active',
      industry: 'Manufacturing',
      tags: ['manufacturing', 'operations', 'digital-transformation'],
      notes: 'Operations director at mid-size manufacturing company. Exploring digital transformation initiatives. Initial interest in process automation.',
      createdAt: new Date('2024-01-15'),
      lastContact: '2024-01-16'
    },
    {
      id: '5',
      name: 'Emily Watson',
      email: 'emily.watson@retailchain.com',
      phone: '+1-555-2005',
      company: 'Retail Chain Plus',
      position: 'VP of Sales',
      stage: 'qualified',
      score: 82,
      source: 'Cold Email',
      assignedTo: 'user1',
      value: 55000,
      probability: 75,
      status: 'active',
      industry: 'Retail',
      tags: ['retail', 'sales-vp', 'multi-location'],
      notes: 'VP of Sales at growing retail chain. Looking for CRM to manage sales across 50+ locations. Impressed with our multi-location features.',
      createdAt: new Date('2024-01-14'),
      lastContact: '2024-01-20'
    },
    {
      id: '6',
      name: 'Robert Chang',
      email: 'robert.chang@edutech.com',
      phone: '+1-555-2006',
      company: 'EduTech Innovations',
      position: 'Founder & CEO',
      stage: 'won',
      score: 95,
      source: 'Referral',
      assignedTo: 'user2',
      value: 75000,
      probability: 100,
      status: 'active',
      industry: 'Education',
      tags: ['education', 'founder', 'closed-won'],
      notes: 'Founder of EdTech startup. Signed annual contract for student management platform. Very satisfied with onboarding process.',
      createdAt: new Date('2024-01-10'),
      lastContact: '2024-01-22'
    },
    {
      id: '7',
      name: 'Lisa Park',
      email: 'lisa.park@realestate.com',
      phone: '+1-555-2007',
      company: 'Premier Real Estate',
      position: 'Sales Manager',
      stage: 'contacted',
      score: 70,
      source: 'Social Media',
      assignedTo: 'user1',
      value: 28000,
      probability: 45,
      status: 'nurturing',
      industry: 'Real Estate',
      tags: ['real-estate', 'sales-manager', 'lead-management'],
      notes: 'Sales manager at real estate firm. Interested in lead management and client tracking features. Needs to see ROI before moving forward.',
      createdAt: new Date('2024-01-12'),
      lastContact: '2024-01-18'
    },
    {
      id: '8',
      name: 'James Wilson',
      email: 'james.wilson@consulting.com',
      phone: '+1-555-2008',
      company: 'Strategic Consulting Partners',
      position: 'Managing Partner',
      stage: 'proposal',
      score: 86,
      source: 'Website',
      assignedTo: 'user2',
      value: 95000,
      probability: 80,
      status: 'active',
      industry: 'Consulting',
      tags: ['consulting', 'partner', 'high-value'],
      notes: 'Managing partner at boutique consulting firm. Needs CRM for client relationship management and project tracking. Proposal under review.',
      createdAt: new Date('2024-01-11'),
      lastContact: '2024-01-21'
    }
  ];

  const deals: Deal[] = [
    {
      id: '1',
      name: 'TechCorp Enterprise License',
      contactId: '1',
      companyId: '1',
      stage: 'proposal',
      value: 50000,
      probability: 75,
      expectedCloseDate: new Date('2024-02-15'),
      assignedTo: 'user1',
      products: [
        {
          id: 'prod1',
          name: 'Enterprise Software License',
          quantity: 1,
          unitPrice: 50000,
          discount: 0
        }
      ],
      competitors: ['CompetitorA', 'CompetitorB'],
      lostReason: '',
      tags: ['enterprise', 'high-value'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      customFields: {}
    }
  ];

  const activities: Activity[] = [
    {
      id: '1',
      type: 'call',
      subject: 'Discovery Call with John Smith',
      description: 'Discussed requirements and timeline',
      contactId: '1',
      dealId: '1',
      userId: 'user1',
      duration: 30,
      outcome: 'positive',
      scheduledAt: new Date('2024-01-20T10:00:00'),
      completedAt: new Date('2024-01-20T10:30:00'),
      createdAt: new Date('2024-01-20'),
      customFields: {}
    }
  ];

  const tasks: Task[] = [
    {
      id: '1',
      title: 'Follow up with TechCorp',
      description: 'Send proposal document',
      assignedTo: 'user1',
      contactId: '1',
      dealId: '1',
      priority: 'high',
      status: 'pending',
      dueDate: new Date('2024-01-25'),
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
      customFields: {}
    }
  ];

  const emailTemplates: EmailTemplate[] = [
    {
      id: '1',
      name: 'Welcome Email',
      subject: 'Welcome to our platform!',
      body: 'Hi {{firstName}}, welcome to our platform. We\'re excited to work with you!',
      category: 'onboarding',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  const sequences: Sequence[] = [
    {
      id: '1',
      name: 'New Lead Nurture',
      description: 'Automated sequence for new leads',
      isActive: true,
      steps: [
        {
          id: 'step1',
          type: 'email',
          templateId: '1',
          delay: 0,
          conditions: []
        }
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  const employees: Employee[] = [
    {
      id: 'user1',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@company.com',
      role: 'Sales',
      department: 'Sales',
      phone: '+1-555-3001',
      hireDate: new Date('2023-06-01'),
      status: 'active',
      permissions: ['crm:read', 'crm:write'],
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date('2023-06-01')
    },
    {
      id: 'user2',
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob@company.com',
      role: 'Manager',
      department: 'Sales',
      phone: '+1-555-3002',
      hireDate: new Date('2023-03-15'),
      status: 'active',
      permissions: ['crm:read', 'crm:write', 'crm:admin'],
      createdAt: new Date('2023-03-15'),
      updatedAt: new Date('2023-03-15')
    }
  ];

  const meetings: Meeting[] = [
    {
      id: '1',
      title: 'Sales Review Meeting',
      description: 'Weekly sales team review',
      startTime: new Date('2024-01-22T14:00:00'),
      endTime: new Date('2024-01-22T15:00:00'),
      attendees: ['user1', 'user2'],
      contactId: '1',
      dealId: '1',
      location: 'Conference Room A',
      meetingLink: 'https://zoom.us/j/123456789',
      status: 'scheduled',
      summary: '',
      actionItems: [],
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20')
    }
  ];

  return {
    leads,
    companies,
    contacts,
    activities,
    emailTemplates,
    sequences,
    deals,
    tasks,
    employees,
    meetings
  };
};