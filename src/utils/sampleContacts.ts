import { Contact } from '../types/contact';

export const sampleContacts: Contact[] = [
  {
    id: '1',
    name: 'John Smith',
    company: 'Acme Corp',
    position: 'VP Sales',
    email: 'john@acme.com',
    phone: '+1 555-0123',
    source: 'lead-gen',
    tags: ['VIP', 'Decision Maker'],
    status: 'active',
    lastContact: {
      date: 'Nov 15',
      type: 'meeting',
      details: 'Meeting with AI Notes'
    },
    aiEnriched: true,
    enrichedDataPoints: 12,
    activeDeal: {
      title: 'Acme - $50K',
      value: 50000,
      stage: 'Proposal'
    },
    createdAt: '2024-09-15',
    updatedAt: '2024-11-15'
  },
  {
    id: '2',
    name: 'Sarah Lee',
    company: 'TechStart Inc',
    position: 'CFO',
    email: 'sarah@techstart.com',
    phone: '+1 555-0456',
    source: 'hrms',
    sourceDetails: '🏢 From HRMS: Recruited Nov 2024',
    tags: ['Hot Lead'],
    status: 'active',
    lastContact: {
      date: 'Nov 14',
      type: 'email',
      details: 'Email sent'
    },
    activeDeal: {
      title: 'TechStart - $42K',
      value: 42000,
      stage: 'Negotiation'
    },
    createdAt: '2024-10-20',
    updatedAt: '2024-11-14'
  },
  {
    id: '3',
    name: 'Mike Chen',
    company: 'BigCo Enterprise',
    position: 'Director Ops',
    email: 'mike@bigco.com',
    phone: '+1 555-0789',
    source: 'manual',
    sourceDetails: 'Added at: SaaS Summit 2024',
    tags: ['Champion'],
    status: 'active',
    lastContact: {
      date: 'Nov 10',
      type: 'call',
      details: 'Call - 15 mins'
    },
    activeDeal: {
      title: 'BigCo - $75K',
      value: 75000,
      stage: 'Qualified'
    },
    nextAction: {
      type: 'Follow up',
      dueDate: 'Nov 16'
    },
    createdAt: '2024-10-01',
    updatedAt: '2024-11-10'
  },
  {
    id: '4',
    name: 'Lisa Wong',
    company: 'StartCo',
    position: 'CEO',
    email: 'lisa@startco.com',
    phone: '+1 555-0321',
    source: 'website',
    sourceDetails: 'Originally: Website form → Converted',
    tags: ['Decision Maker'],
    status: 'active',
    lastContact: {
      date: 'Nov 13',
      type: 'call',
      details: 'Call - 20 mins'
    },
    activeDeal: {
      title: 'StartCo - $28K',
      value: 28000,
      stage: 'Proposal'
    },
    createdAt: '2024-09-28',
    updatedAt: '2024-11-13'
  },
  {
    id: '5',
    name: 'David Kumar',
    company: 'InnovateLabs',
    position: 'CTO',
    email: 'david@innovatelabs.com',
    source: 'lead-gen',
    tags: [],
    status: 'inactive',
    lastContact: {
      date: 'Nov 5',
      type: 'email',
      details: 'Email sent'
    },
    warningMessage: '⚠️ No response in 10 days',
    createdAt: '2024-08-15',
    updatedAt: '2024-11-05'
  },
  {
    id: '6',
    name: 'Emma Wilson',
    company: 'DataFlow Inc',
    position: 'VP Marketing',
    email: 'emma@dataflow.com',
    phone: '+1 555-0987',
    source: 'hrms',
    sourceDetails: '🏢 From HRMS: Recruited from DataFlow',
    tags: ['VIP', 'C-Level'],
    status: 'active',
    lastContact: {
      date: 'Nov 12',
      type: 'meeting',
      details: 'Meeting with AI Notes'
    },
    activeDeal: {
      title: 'DataFlow - $95K',
      value: 95000,
      stage: 'Negotiation'
    },
    createdAt: '2024-09-10',
    updatedAt: '2024-11-12'
  }
];
