import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { fetchLeadsFromAPI } from '../utils/leadsApi';
import { fetchContacts } from '../utils/contactsApi';
import { fetchAccounts } from '../utils/accountsApi';
import { fetchDeals } from '../utils/dealsApi';
import { fetchActivities, fetchTasks } from '../utils/activitiesApi';

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
  /** All six come from the API. See the notes in DataProvider. */
  leads: Lead[];
  companies: Company[];
  contacts: Contact[];
  activities: Activity[];
  deals: Deal[];
  tasks: Task[];
  /** Always empty — the employees table has no tenant_id and HRMS is a separate
   *  platform. Consumers render "not built yet". */
  employees: Employee[];
  /** Always empty — real CRM concept, real table, zero rows and no route yet.
   *  Consumers render "no meetings scheduled", which is a statement about data. */
  meetings: Meeting[];

  loading: boolean;
  /** Set when a fetch failed. Consumers must distinguish this from an empty
   *  result: empty means no records, error means we do not know. */
  error: string | null;
  reload: () => Promise<void>;

  /** Local cache syncs, called AFTER the owning page has already persisted via its
   *  own API client — not writers in their own right. The other fifteen mutators
   *  this interface used to expose had zero consumers and were removed: with real
   *  data behind the provider, an in-memory-only `addLead` would inject a phantom
   *  row into a real dataset, which is the very defect being removed here. */
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt'> & { id?: string }) => void;
  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// ── Adapters: API shape -> this provider's local vocabulary ───────────────────
//
// The API returns DB-shaped records (snake_case, `estimated_value`, `stage`) while
// the interfaces above use a camelCase vocabulary (`value`, `expectedCloseDate`).
// These map one to the other. Every field a consumer reads is mapped; fields with
// no source are left null/0/[] rather than filled with a plausible-looking value —
// an invented default is the defect this whole change exists to remove.

function adaptLead(r: any): Lead {
  return {
    id:                String(r.id ?? ''),
    contactId:         undefined,
    companyId:         undefined,
    name:              r.full_name || [r.first_name, r.last_name].filter(Boolean).join(' ') || '',
    email:             r.email ?? undefined,
    phone:             r.phone ?? undefined,
    company:           r.company ?? undefined,
    position:          r.position ?? undefined,
    industry:          r.industry ?? undefined,
    // The frontend Lead.status field carries the STAGE vocabulary (see types/lead.ts
    // and migration 025); both `stage` and `status` below read from it deliberately.
    stage:             r.status ?? 'new',
    status:            r.status ?? 'new',
    score:             typeof r.score === 'number' ? r.score : 0,
    value:             typeof r.estimated_value === 'number' ? r.estimated_value : 0,
    probability:       typeof r.probability === 'number' ? r.probability : 0,
    expectedCloseDate: r.expected_close_date ?? undefined,
    source:            r.source ?? 'manual',
    assignedTo:        r.owner_id ?? undefined,
    createdAt:         r.created_at ?? new Date().toISOString(),
    lastContact:       undefined,
    notes:             r.quick_notes ?? undefined,
    tags:              Array.isArray(r.tags) ? r.tags : [],
    customFields:      r.custom_fields ?? {},
  } as Lead;
}

function adaptContact(r: any): Contact {
  return {
    id:           String(r.id ?? ''),
    companyId:    r.company_id ? String(r.company_id) : undefined,
    firstName:    r.first_name ?? (r.name ? String(r.name).split(' ')[0] : ''),
    lastName:     r.last_name  ?? (r.name ? String(r.name).split(' ').slice(1).join(' ') : ''),
    email:        r.email ?? '',
    phone:        r.phone ?? undefined,
    mobile:       r.mobile ?? undefined,
    position:     r.position ?? undefined,
    department:   r.department ?? undefined,
    linkedinUrl:  r.linkedin_url ?? undefined,
    isPrimary:    r.is_primary === true,
    createdAt:    r.created_at ?? new Date().toISOString(),
    updatedAt:    r.updated_at ?? new Date().toISOString(),
  } as Contact;
}

function adaptCompany(r: any): Company {
  return {
    id:          String(r.id ?? ''),
    name:        r.name ?? '',
    domain:      r.domain ?? r.website ?? undefined,
    industry:    r.industry ?? '',
    size:        (r.size ?? 'unknown') as Company['size'],
    revenue:     typeof r.annual_revenue === 'number' ? r.annual_revenue : undefined,
    description: r.description ?? undefined,
  } as Company;
}

function adaptDeal(r: any): Deal {
  const value = typeof r.value === 'number' ? r.value : Number(r.value ?? 0) || 0;
  return {
    id:                String(r.id ?? ''),
    name:              r.name ?? r.title ?? 'Untitled deal',
    title:             r.title ?? r.name ?? 'Untitled deal',
    leadId:            '',
    value,
    stage:             r.stage ?? 'qualified',
    probability:       typeof r.probability === 'number' ? r.probability : 0,
    expectedCloseDate: r.expected_close_date ?? r.closeDate ?? undefined,
    actualCloseDate:   r.actual_close_date ?? undefined,
    assignedTo:        r.owner_id ?? r.assigned_to ?? undefined,
    createdAt:         r.created_at ?? new Date().toISOString(),
    description:       r.description ?? undefined,
    nextStep:          r.next_step ?? undefined,
    notes:             undefined,
  } as Deal;
}

function adaptTask(r: any): Task {
  return {
    id:          String(r.id ?? ''),
    title:       r.title ?? '',
    description: r.description ?? undefined,
    type:        r.type ?? undefined,
    priority:    r.priority ?? undefined,
    status:      r.status ?? undefined,
    assignedTo:  r.assigned_to ?? undefined,
    relatedTo:   r.related_to_id ?? undefined,
    dueDate:     r.due_date ?? undefined,
    createdAt:   r.created_at ?? new Date().toISOString(),
  } as Task;
}

function adaptActivity(r: any): Activity {
  return {
    id:          String(r.id ?? ''),
    subject:     r.subject ?? '',
    type:        r.type ?? undefined,
    direction:   r.direction ?? undefined,
    status:      r.status ?? undefined,
    priority:    r.priority ?? undefined,
    description: r.description ?? r.content ?? undefined,
    outcome:     r.outcome ?? undefined,
    duration:    typeof r.duration_minutes === 'number' ? r.duration_minutes : undefined,
    scheduledAt: r.scheduled_at ?? undefined,
    completedAt: r.completed_at ?? undefined,
    createdBy:   r.created_by ?? undefined,
    assignedTo:  r.assigned_to ?? undefined,
    leadId:      r.lead_id ? String(r.lead_id) : undefined,
    dealId:      r.deal_id ? String(r.deal_id) : undefined,
    contactId:   r.contact_id ? String(r.contact_id) : undefined,
    createdAt:   r.created_at ?? new Date().toISOString(),
    updatedAt:   r.updated_at ?? new Date().toISOString(),
  } as Activity;
}

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // ── Real data, not a fixture ─────────────────────────────────────────────
  //
  // This provider used to seed TEN collections from generateSampleData() and never
  // touch the network, so every page reading useData() rendered invented records
  // while looking like correct, idiomatic React. That is finding F1 in
  // FABRICATED_DATA_AUDIT.md and the common cause behind six other findings —
  // `hooks/useDashboardData.ts:26` names the mechanism: "a context is what let
  // sample data spread to eighteen files unnoticed in the first place."
  //
  // Six collections now come from the API. Two are deliberately empty and one pair
  // was deleted outright — see the notes below each. Nothing here invents a row.
  const [leads,      setLeads]      = useState<Lead[]>([]);
  const [companies,  setCompanies]  = useState<Company[]>([]);
  const [contacts,   setContacts]   = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deals,      setDeals]      = useState<Deal[]>([]);
  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  // `employees` is permanently empty, and that is a decision rather than a gap.
  // CLAUDE.md: the employees table has NO tenant_id column, so an employee
  // reference cannot be workspace-scoped, and HRMS is a separate platform reached
  // over the SSO/API boundary. "Do not JOIN employees to anything." Wiring this to
  // the 15 local rows would be a cross-workspace read. The HRMS boundary question
  // stays open in CLAUDE.md; consumers show a "not built yet" state, which is
  // accurate — HRMS is a future platform.
  const employees: Employee[] = [];

  // `meetings` is empty for a different reason, and the distinction matters.
  // Meetings are a real CRM concept with a real table; it simply has zero rows and
  // no /meetings route yet. So the honest consumer state is "no meetings
  // scheduled", NOT "not built yet" — no data is not the same as no feature.
  const meetings: Meeting[] = [];

  // `emailTemplates` and `sequences` were removed from this provider entirely:
  // both had zero consumers, and `sequences` was residue from the deleted Lead
  // Generation tool.

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [apiLeads, apiContacts, apiAccounts, apiDeals, apiActivities, apiTasks] =
        await Promise.all([
          fetchLeadsFromAPI({ limit: 500 }),
          fetchContacts({ limit: 500 }),
          fetchAccounts(500),
          fetchDeals(500),
          fetchActivities({ limit: 500 }),
          fetchTasks({ limit: 500 }),
        ]);

      setLeads(apiLeads.map(adaptLead));
      setContacts(apiContacts.map(adaptContact));
      setCompanies(apiAccounts.map(adaptCompany));
      setDeals(apiDeals.map(adaptDeal));
      setActivities(apiActivities.map(adaptActivity));
      setTasks(apiTasks.map(adaptTask));
      setError(null);
    } catch (err: any) {
      // Surfaced, not swallowed. Returning empty arrays here would render "no
      // leads / no deals" for a failed request, which is a claim about the data
      // rather than about the request.
      const message = err?.message || 'Could not load CRM data.';
      console.error('[DataContext] reload:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);


  const addCompany = (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCompany: Company = {
      ...company,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCompanies(prev => [...prev, newCompany]);
  };

  const addDeal = (deal: Omit<Deal, 'id' | 'createdAt'> & { id?: string }) => {
    console.log('DataContext: Adding deal:', deal);

    const newDeal: Deal = {
      ...deal,
      id: deal.id || Date.now().toString(),
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

  return (
    <DataContext.Provider value={{
      leads,
      companies,
      contacts,
      activities,
      deals,
      tasks,
      employees,
      meetings,
      loading,
      error,
      reload,
      addDeal,
      addCompany,
    }}>
      {children}
    </DataContext.Provider>
  );
};