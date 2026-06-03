import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
// Supabase removed — all lead data now comes from the Express backend
// which connects directly to PostgreSQL (bmi_crm database in pgAdmin 4).
import {
  fetchLeadsFromAPI,
  fetchLeadByIdFromAPI,
  createLeadViaAPI,
  updateLeadViaAPI,
  deleteLeadViaAPI,
} from '../utils/leadsApi';
import { useAuth } from './AuthContext';
import {
  Lead,
  LeadActivity,
  LeadNote,
  LeadTask,
  LeadEmail,
  LeadCall,
  LeadMeeting,
  Tag,
  LeadPipeline,
  LeadPipelineStage,
  LeadView,
  LeadAIInsight,
  LeadFilters,
  BulkOperation,
  LeadEnrichmentRequest,
  LeadEnrichmentResponse
} from '../types/lead';

interface LeadContextType {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  selectedLeadIds: string[];
  currentFilters: LeadFilters;
  currentView: LeadView | null;
  views: LeadView[];
  pipelines: LeadPipeline[];
  tags: Tag[];

  fetchLeads: (filters?: LeadFilters) => Promise<void>;
  getLead: (id: string) => Promise<Lead | null>;
  createLead: (lead: Partial<Lead>) => Promise<Lead | null>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<boolean>;
  deleteLead: (id: string) => Promise<boolean>;
  bulkDeleteLeads: (ids: string[]) => Promise<boolean>;

  getLeadActivities: (leadId: string) => Promise<LeadActivity[]>;
  createActivity: (activity: Partial<LeadActivity>) => Promise<LeadActivity | null>;
  updateActivity: (id: string, updates: Partial<LeadActivity>) => Promise<boolean>;

  getLeadNotes: (leadId: string) => Promise<LeadNote[]>;
  createNote: (note: Partial<LeadNote>) => Promise<LeadNote | null>;
  updateNote: (id: string, updates: Partial<LeadNote>) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;

  getLeadTasks: (leadId: string) => Promise<LeadTask[]>;
  createTask: (task: Partial<LeadTask>) => Promise<LeadTask | null>;
  updateTask: (id: string, updates: Partial<LeadTask>) => Promise<boolean>;

  getLeadEmails: (leadId: string) => Promise<LeadEmail[]>;
  sendEmail: (email: Partial<LeadEmail>) => Promise<LeadEmail | null>;

  getLeadCalls: (leadId: string) => Promise<LeadCall[]>;
  logCall: (call: Partial<LeadCall>) => Promise<LeadCall | null>;

  getLeadMeetings: (leadId: string) => Promise<LeadMeeting[]>;
  scheduleMeeting: (meeting: Partial<LeadMeeting>) => Promise<LeadMeeting | null>;

  getLeadInsights: (leadId: string) => Promise<LeadAIInsight[]>;
  acknowledgeInsight: (id: string) => Promise<boolean>;
  dismissInsight: (id: string) => Promise<boolean>;

  enrichLead: (request: LeadEnrichmentRequest) => Promise<LeadEnrichmentResponse | null>;
  calculateLeadScore: (lead: Lead) => number;

  applyFilters: (filters: LeadFilters) => void;
  clearFilters: () => void;

  setSelectedLeadIds: (ids: string[]) => void;
  executeBulkOperation: (operation: BulkOperation) => Promise<boolean>;

  fetchViews: () => Promise<void>;
  createView: (view: Partial<LeadView>) => Promise<LeadView | null>;
  updateView: (id: string, updates: Partial<LeadView>) => Promise<boolean>;
  deleteView: (id: string) => Promise<boolean>;
  applyView: (view: LeadView) => void;

  fetchPipelines: () => Promise<void>;
  fetchTags: () => Promise<void>;
  createTag: (tag: Partial<Tag>) => Promise<Tag | null>;

  convertLead: (leadId: string, createDeal: boolean) => Promise<{ contactId?: string; dealId?: string } | null>;

  detectDuplicates: (leadId: string) => Promise<any[]>;
  mergeLeads: (primaryId: string, secondaryIds: string[]) => Promise<boolean>;

  exportLeads: (leadIds: string[], format: 'csv' | 'xlsx') => Promise<string | null>;
  importLeads: (file: File, mapping: Record<string, string>) => Promise<{ success: number; failed: number }>;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadProvider');
  }
  return context;
};

interface LeadProviderProps {
  children: ReactNode;
}

export const LeadProvider: React.FC<LeadProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<LeadFilters>({});
  const [currentView, setCurrentView] = useState<LeadView | null>(null);
  const [views, setViews] = useState<LeadView[]>([]);
  const [pipelines, setPipelines] = useState<LeadPipeline[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const fetchLeads = useCallback(async (filters?: LeadFilters) => {
    setLoading(true);
    setError(null);
    try {
      // Calls Express /api/v1/leads → PostgreSQL (bmi_crm) via pg.Pool
      const data = await fetchLeadsFromAPI(filters);
      setLeads(data);
    } catch (err: any) {
      setError(err.message);
      console.error('[LeadContext] fetchLeads:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getLead = async (id: string): Promise<Lead | null> => {
    return fetchLeadByIdFromAPI(id);
  };

  const createLead = async (lead: Partial<Lead>): Promise<Lead | null> => {
    const payload = { ...lead, owner_id: lead.owner_id || user?.id };
    const created = await createLeadViaAPI(payload);
    if (created) setLeads(prev => [created, ...prev]);
    return created;
  };

  const updateLead = async (id: string, updates: Partial<Lead>): Promise<boolean> => {
    const updated = await updateLeadViaAPI(id, updates);
    if (updated) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      return true;
    }
    return false;
  };

  const deleteLead = async (id: string): Promise<boolean> => {
    const ok = await deleteLeadViaAPI(id);
    if (ok) setLeads(prev => prev.filter(l => l.id !== id));
    return ok;
  };

  const bulkDeleteLeads = async (ids: string[]): Promise<boolean> => {
    try {
      await Promise.all(ids.map(id => deleteLeadViaAPI(id)));
      setLeads(prev => prev.filter(l => !ids.includes(l.id)));
      return true;
    } catch {
      return false;
    }
  };

  // ── Activity / Note / Task / Email / Call / Meeting / Insight ────────────
  // These tables (lead_activities, lead_notes, lead_tasks, lead_emails,
  // lead_calls, lead_meetings, lead_ai_insights) do not exist in the current
  // PostgreSQL schema (migrate.ts). They were Supabase-only.
  // All stubs return empty/null — no network calls, no errors.
  // Add the corresponding tables + backend routes when those features are built.
  const getLeadActivities  = async (_leadId: string): Promise<LeadActivity[]>  => [];
  const createActivity     = async (_a: Partial<LeadActivity>): Promise<LeadActivity | null>  => null;
  const updateActivity     = async (_id: string, _u: Partial<LeadActivity>): Promise<boolean> => false;

  const getLeadNotes  = async (_leadId: string): Promise<LeadNote[]>  => [];
  const createNote    = async (_n: Partial<LeadNote>): Promise<LeadNote | null>  => null;
  const updateNote    = async (_id: string, _u: Partial<LeadNote>): Promise<boolean>  => false;
  const deleteNote    = async (_id: string): Promise<boolean>  => false;

  const getLeadTasks  = async (_leadId: string): Promise<LeadTask[]>  => [];
  const createTask    = async (_t: Partial<LeadTask>): Promise<LeadTask | null>  => null;
  const updateTask    = async (_id: string, _u: Partial<LeadTask>): Promise<boolean>  => false;

  const getLeadEmails = async (_leadId: string): Promise<LeadEmail[]>  => [];
  const sendEmail     = async (_e: Partial<LeadEmail>): Promise<LeadEmail | null>  => null;

  const getLeadCalls  = async (_leadId: string): Promise<LeadCall[]>   => [];
  const logCall       = async (_c: Partial<LeadCall>): Promise<LeadCall | null>   => null;

  const getLeadMeetings   = async (_leadId: string): Promise<LeadMeeting[]>    => [];
  const scheduleMeeting   = async (_m: Partial<LeadMeeting>): Promise<LeadMeeting | null> => null;

  const getLeadInsights   = async (_leadId: string): Promise<LeadAIInsight[]>  => [];
  const acknowledgeInsight = async (_id: string): Promise<boolean> => false;
  const dismissInsight     = async (_id: string): Promise<boolean> => false;

  const enrichLead = async (request: LeadEnrichmentRequest): Promise<LeadEnrichmentResponse | null> => {
    return {
      person_data: {
        full_name: 'John Doe',
        position: 'CEO',
        seniority: 'Executive',
        department: 'Leadership'
      },
      company_data: {
        name: 'Acme Corp',
        industry: 'Technology',
        size: '100-500',
        revenue: 50000000
      },
      confidence: 0.95
    };
  };

  const calculateLeadScore = (lead: Lead): number => {
    let score = 0;

    if (lead.email_opens_count > 0) score += Math.min(lead.email_opens_count * 2, 20);
    if (lead.email_clicks_count > 0) score += Math.min(lead.email_clicks_count * 5, 25);
    if (lead.meeting_count > 0) score += Math.min(lead.meeting_count * 10, 30);

    if (lead.last_activity_date) {
      const daysSince = Math.floor((Date.now() - new Date(lead.last_activity_date).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince <= 7) score += 15;
      else if (daysSince <= 30) score += 10;
    }

    if (lead.position) {
      if (/CEO|CTO|CFO|VP|President/i.test(lead.position)) score += 15;
      else if (/Director|Manager/i.test(lead.position)) score += 10;
    }

    return Math.min(100, Math.max(0, score));
  };

  const applyFilters = (filters: LeadFilters) => {
    setCurrentFilters(filters);
    fetchLeads(filters);
  };

  const clearFilters = () => {
    setCurrentFilters({});
    fetchLeads();
  };

  const executeBulkOperation = async (operation: BulkOperation): Promise<boolean> => {
    try {
      switch (operation.operation) {
        case 'update_owner':
          await Promise.all(operation.lead_ids.map(id =>
            updateLeadViaAPI(id, { owner_id: operation.parameters?.owner_id })
          ));
          break;
        case 'add_tags':
          for (const leadId of operation.lead_ids) {
            const lead = await getLead(leadId);
            if (lead) {
              const newTags = [...new Set([...lead.tags, ...(operation.parameters?.tags || [])])];
              await updateLeadViaAPI(leadId, { tags: newTags });
            }
          }
          break;
        case 'delete':
          await bulkDeleteLeads(operation.lead_ids);
          break;
        default:
          return false;
      }
      await fetchLeads(currentFilters);
      return true;
    } catch (err: any) {
      console.error('[LeadContext] executeBulkOperation:', err.message);
      return false;
    }
  };

  // Views are not in the PostgreSQL schema yet — stubs keep the interface intact
  const fetchViews  = async () => { setViews([]); };
  const createView  = async (_v: Partial<LeadView>): Promise<LeadView | null> => null;
  const updateView  = async (id: string, updates: Partial<LeadView>): Promise<boolean> => {
    setViews(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    return true;
  };
  const deleteView  = async (id: string): Promise<boolean> => {
    setViews(prev => prev.filter(v => v.id !== id));
    return true;
  };

  const applyView = (view: LeadView) => {
    setCurrentView(view);
    applyFilters(view.filters);
  };

  // lead_pipelines, tags, lead_duplicates don't exist in the DB schema yet — stubs
  const fetchPipelines  = async () => { setPipelines([]); };
  const fetchTags       = async () => { setTags([]); };
  const createTag       = async (_t: Partial<Tag>): Promise<Tag | null> => null;
  const convertLead     = async (_leadId: string, createDeal: boolean): Promise<{ contactId?: string; dealId?: string } | null> =>
    ({ contactId: undefined, dealId: createDeal ? undefined : undefined });
  const detectDuplicates = async (_leadId: string): Promise<any[]> => [];

  const mergeLeads = async (primaryId: string, secondaryIds: string[]): Promise<boolean> => {
    return true;
  };

  const exportLeads = async (leadIds: string[], format: 'csv' | 'xlsx'): Promise<string | null> => {
    return 'export_url';
  };

  const importLeads = async (file: File, mapping: Record<string, string>): Promise<{ success: number; failed: number }> => {
    return { success: 0, failed: 0 };
  };

  useEffect(() => {
    if (user) {
      fetchLeads();
      fetchViews();
      fetchPipelines();
      fetchTags();
    }
  }, [user, fetchLeads]);

  const value: LeadContextType = {
    leads,
    loading,
    error,
    selectedLeadIds,
    currentFilters,
    currentView,
    views,
    pipelines,
    tags,
    fetchLeads,
    getLead,
    createLead,
    updateLead,
    deleteLead,
    bulkDeleteLeads,
    getLeadActivities,
    createActivity,
    updateActivity,
    getLeadNotes,
    createNote,
    updateNote,
    deleteNote,
    getLeadTasks,
    createTask,
    updateTask,
    getLeadEmails,
    sendEmail,
    getLeadCalls,
    logCall,
    getLeadMeetings,
    scheduleMeeting,
    getLeadInsights,
    acknowledgeInsight,
    dismissInsight,
    enrichLead,
    calculateLeadScore,
    applyFilters,
    clearFilters,
    setSelectedLeadIds,
    executeBulkOperation,
    fetchViews,
    createView,
    updateView,
    deleteView,
    applyView,
    fetchPipelines,
    fetchTags,
    createTag,
    convertLead,
    detectDuplicates,
    mergeLeads,
    exportLeads,
    importLeads
  };

  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>;
};
