import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
// All data comes from the Express backend → PostgreSQL (bmi_crm in pgAdmin 4).
import {
  fetchLeadsFromAPI,
  fetchLeadByIdFromAPI,
  createLeadViaAPI,
  updateLeadViaAPI,
  deleteLeadViaAPI,
  fetchActivitiesFromAPI,
  createActivityViaAPI,
  updateActivityViaAPI,
  fetchNotesFromAPI,
  createNoteViaAPI,
  updateNoteViaAPI,
  deleteNoteViaAPI,
  fetchTasksFromAPI,
  createTaskViaAPI,
  updateTaskViaAPI,
  fetchEmailsFromAPI,
  logEmailViaAPI,
  fetchCallsFromAPI,
  logCallViaAPI,
  fetchMeetingsFromAPI,
  scheduleMeetingViaAPI,
  fetchTagsFromAPI,
  createTagViaAPI,
  fetchViewsFromAPI,
  createViewViaAPI,
  updateViewViaAPI,
  deleteViewViaAPI,
  enrichLeadViaAPI,
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

  // ── Activities ────────────────────────────────────────────────────────────
  const getLeadActivities = (leadId: string) => fetchActivitiesFromAPI(leadId);

  const createActivity = async (activity: Partial<LeadActivity>): Promise<LeadActivity | null> => {
    if (!activity.lead_id) return null;
    return createActivityViaAPI(activity.lead_id, activity);
  };

  const updateActivity = async (id: string, updates: Partial<LeadActivity>): Promise<boolean> => {
    if (!updates.lead_id) return false;
    return updateActivityViaAPI(updates.lead_id, id, updates);
  };

  // ── Notes ─────────────────────────────────────────────────────────────────
  const getLeadNotes = (leadId: string) => fetchNotesFromAPI(leadId);

  const createNote = async (note: Partial<LeadNote>): Promise<LeadNote | null> => {
    if (!note.lead_id) return null;
    return createNoteViaAPI(note.lead_id, note);
  };

  const updateNote = async (id: string, updates: Partial<LeadNote>): Promise<boolean> => {
    if (!updates.lead_id) return false;
    return updateNoteViaAPI(updates.lead_id, id, updates);
  };

  const deleteNote = async (id: string, leadId?: string): Promise<boolean> => {
    if (!leadId) return false;
    return deleteNoteViaAPI(leadId, id);
  };

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const getLeadTasks = (leadId: string) => fetchTasksFromAPI(leadId);

  const createTask = async (task: Partial<LeadTask>): Promise<LeadTask | null> => {
    if (!task.lead_id) return null;
    return createTaskViaAPI(task.lead_id, task);
  };

  const updateTask = async (id: string, updates: Partial<LeadTask>): Promise<boolean> => {
    if (!updates.lead_id) return false;
    return updateTaskViaAPI(updates.lead_id, id, updates);
  };

  // ── Emails ────────────────────────────────────────────────────────────────
  const getLeadEmails = (leadId: string) => fetchEmailsFromAPI(leadId);

  const sendEmail = async (email: Partial<LeadEmail>): Promise<LeadEmail | null> => {
    if (!email.lead_id) return null;
    return logEmailViaAPI(email.lead_id, { ...email, direction: 'outbound', sent_at: new Date().toISOString() });
  };

  // ── Calls ─────────────────────────────────────────────────────────────────
  const getLeadCalls = (leadId: string) => fetchCallsFromAPI(leadId);

  const logCall = async (call: Partial<LeadCall>): Promise<LeadCall | null> => {
    if (!call.lead_id) return null;
    return logCallViaAPI(call.lead_id, call);
  };

  // ── Meetings ──────────────────────────────────────────────────────────────
  const getLeadMeetings = (leadId: string) => fetchMeetingsFromAPI(leadId);

  const scheduleMeeting = async (meeting: Partial<LeadMeeting>): Promise<LeadMeeting | null> => {
    if (!meeting.lead_id) return null;
    return scheduleMeetingViaAPI(meeting.lead_id, meeting);
  };

  // ── AI Insights (no DB table yet — interface stubs) ───────────────────────
  const getLeadInsights    = async (_leadId: string): Promise<LeadAIInsight[]> => [];
  const acknowledgeInsight = async (_id: string): Promise<boolean> => false;
  const dismissInsight     = async (_id: string): Promise<boolean> => false;

  // ── Enrichment ────────────────────────────────────────────────────────────
  const enrichLead = async (request: LeadEnrichmentRequest): Promise<LeadEnrichmentResponse | null> => {
    return enrichLeadViaAPI(request.lead_id);
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

  // ── Views ─────────────────────────────────────────────────────────────────
  const fetchViews = useCallback(async () => {
    const data = await fetchViewsFromAPI();
    setViews(data);
  }, []);

  const createView = async (view: Partial<LeadView>): Promise<LeadView | null> => {
    const created = await createViewViaAPI(view);
    if (created) setViews(prev => [...prev, created]);
    return created;
  };

  const updateView = async (id: string, updates: Partial<LeadView>): Promise<boolean> => {
    const ok = await updateViewViaAPI(id, updates);
    if (ok) setViews(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    return ok;
  };

  const deleteView = async (id: string): Promise<boolean> => {
    const ok = await deleteViewViaAPI(id);
    if (ok) setViews(prev => prev.filter(v => v.id !== id));
    return ok;
  };

  const applyView = (view: LeadView) => {
    setCurrentView(view);
    applyFilters(view.filters);
  };

  // ── Tags ──────────────────────────────────────────────────────────────────
  const fetchTags = async () => {
    const data = await fetchTagsFromAPI();
    setTags(data);
  };

  const createTag = async (tag: Partial<Tag>): Promise<Tag | null> => {
    const created = await createTagViaAPI(tag);
    if (created) setTags(prev => [...prev, created]);
    return created;
  };

  // Pipelines have no DB table yet — stub keeps the interface intact
  const fetchPipelines = async () => { setPipelines([]); };
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
