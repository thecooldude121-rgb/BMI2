import React, { createContext, useContext, useState, ReactNode } from 'react';
import { generateSampleData } from '../utils/sampleData';
import { sampleDeals } from '../utils/sampleDeals';

export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry: string;
  size: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | 'unknown';
  revenue?: number;
  description?: string;
  website?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  position?: string;
  department?: string;
  linkedinUrl?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  subject: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'demo' | 'proposal';
  direction: 'inbound' | 'outbound';
  status: 'planned' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
  outcome?: string;
  duration?: number;
  scheduledAt?: string;
  completedAt?: string;
  createdBy: string;
  assignedTo: string;
  leadId?: string;
  dealId?: string;
  contactId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  templateType: 'cold_outreach' | 'follow_up' | 'proposal' | 'demo_invite' | 'meeting_reminder';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  steps: SequenceStep[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceStep {
  id: string;
  stepNumber: number;
  stepType: 'email' | 'call' | 'linkedin' | 'wait';
  delayDays: number;
  templateId?: string;
  subject?: string;
  body?: string;
  isActive: boolean;
}

export interface Lead {
  id: string;
  contactId?: string;
  companyId?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  industry: string;
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  status: 'active' | 'inactive' | 'nurturing';
  score: number;
  value: number;
  probability: number;
  expectedCloseDate?: string;
  source: string;
  assignedTo: string;
  createdAt: string;
  lastContact?: string;
  notes?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface Deal {
  id: string;
  name: string;
  title: string;
  leadId: string;
  value: number;
  stage: 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate: string;
  actualCloseDate?: string;
  assignedTo: string;
  createdAt: string;
  description?: string;
  nextStep?: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'call' | 'email' | 'meeting' | 'follow-up' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo: string;
  relatedTo?: { type: 'lead' | 'deal' | 'employee'; id: string };
  dueDate: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Sales' | 'HR' | 'Manager';
  department: string;
  hireDate: string;
  status: 'active' | 'inactive';
  avatar?: string;
  salary?: number;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  attendees: string[];
  type: 'sales-call' | 'internal' | 'client-meeting';
  relatedTo?: { type: 'lead' | 'deal'; id: string };
  summary?: string;
  actionItems?: string[];
  createdAt: string;
}

interface DataContextType {
  leads: Lead[];
  companies: Company[];
  contacts: Contact[];
  activities: Activity[];
  emailTemplates: EmailTemplate[];
  sequences: Sequence[];
  deals: Deal[];
  tasks: Task[];
  employees: Employee[];
  meetings: Meeting[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  updateLead: (id: string, lead: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCompany: (id: string, company: Partial<Company>) => void;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActivity: (id: string, activity: Partial<Activity>) => void;
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt'>) => void;
  updateDeal: (id: string, deal: Partial<Deal>) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  importLeads: (leads: Omit<Lead, 'id' | 'createdAt'>[]) => void;
  exportData: (type: 'leads' | 'contacts' | 'deals') => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const sampleData = generateSampleData();
  
  // Add sample deals to existing deals
  const initialDeals = [
    ...sampleData.deals,
    ...sampleDeals.map(deal => ({
      id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      ...deal
    }))
  ];
  
  const [leads, setLeads] = useState<Lead[]>(sampleData.leads);
  const [companies, setCompanies] = useState<Company[]>(sampleData.companies);
  const [contacts, setContacts] = useState<Contact[]>(sampleData.contacts);
  const [activities, setActivities] = useState<Activity[]>(sampleData.activities);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(sampleData.emailTemplates);
  const [sequences, setSequences] = useState<Sequence[]>(sampleData.sequences);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [tasks, setTasks] = useState<Task[]>(sampleData.tasks);
  const [employees, setEmployees] = useState<Employee[]>(sampleData.employees);
  const [meetings, setMeetings] = useState<Meeting[]>(sampleData.meetings);

  const addLead = (lead: Omit<Lead, 'id' | 'createdAt'>) => {
    const newLead: Lead = {
      ...lead,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setLeads(prev => [...prev, newLead]);
  };

  const updateLead = (id: string, leadUpdate: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, ...leadUpdate } : lead
    ));
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
  };

  const addCompany = (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCompany: Company = {
      ...company,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCompanies(prev => [...prev, newCompany]);
  };

  const updateCompany = (id: string, companyUpdate: Partial<Company>) => {
    setCompanies(prev => prev.map(company => 
      company.id === id ? { ...company, ...companyUpdate, updatedAt: new Date().toISOString() } : company
    ));
  };

  const addContact = (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setContacts(prev => [...prev, newContact]);
  };

  const updateContact = (id: string, contactUpdate: Partial<Contact>) => {
    setContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, ...contactUpdate, updatedAt: new Date().toISOString() } : contact
    ));
  };

  const addActivity = (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setActivities(prev => [...prev, newActivity]);
  };

  const updateActivity = (id: string, activityUpdate: Partial<Activity>) => {
    setActivities(prev => prev.map(activity => 
      activity.id === id ? { ...activity, ...activityUpdate, updatedAt: new Date().toISOString() } : activity
    ));
  };

  const addDeal = (deal: Omit<Deal, 'id' | 'createdAt'>) => {
    console.log('DataContext: Adding deal:', deal);
    
    const newDeal: Deal = {
      ...deal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      // Ensure all required fields are present
      title: deal.title || deal.name || 'Untitled Deal',
      name: deal.name || deal.title || 'Untitled Deal'
    };
    
    console.log('DataContext: New deal object:', newDeal);
    setDeals(prev => [...prev, newDeal]);
    
    // Show success notification
    console.log('DataContext: Deal added to state. Total deals:', deals.length + 1);
    
    return newDeal;
  };

  const updateDeal = (id: string, dealUpdate: Partial<Deal>) => {
    setDeals(prev => prev.map(deal => 
      deal.id === id ? { ...deal, ...dealUpdate } : deal
    ));
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, taskUpdate: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...taskUpdate } : task
    ));
  };

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString()
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  const updateEmployee = (id: string, employeeUpdate: Partial<Employee>) => {
    setEmployees(prev => prev.map(employee => 
      employee.id === id ? { ...employee, ...employeeUpdate } : employee
    ));
  };

  const importLeads = (newLeads: Omit<Lead, 'id' | 'createdAt'>[]) => {
    const leadsWithIds = newLeads.map(lead => ({
      ...lead,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    }));
    setLeads(prev => [...prev, ...leadsWithIds]);
  };

  const exportData = (type: 'leads' | 'contacts' | 'deals'): string => {
    let data: any[] = [];
    let headers: string[] = [];

    switch (type) {
      case 'leads':
        data = leads;
        headers = ['name', 'email', 'phone', 'company', 'position', 'industry', 'stage', 'score', 'value', 'source', 'createdAt'];
        break;
      case 'contacts':
        data = contacts;
        headers = ['firstName', 'lastName', 'email', 'phone', 'position', 'department', 'createdAt'];
        break;
      case 'deals':
        data = deals;
        headers = ['name', 'value', 'stage', 'probability', 'expectedCloseDate', 'createdAt'];
        break;
    }

    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  return (
    <DataContext.Provider value={{
      leads,
      companies,
      contacts,
      activities,
      emailTemplates,
      sequences,
      deals,
      tasks,
      employees,
      meetings,
      addLead,
      updateLead,
      deleteLead,
      addCompany,
      updateCompany,
      addContact,
      updateContact,
      addActivity,
      updateActivity,
      addDeal,
      updateDeal,
      addTask,
      updateTask,
      addEmployee,
      updateEmployee,
      importLeads,
      exportData
    }}>
      {children}
    </DataContext.Provider>
  );
};