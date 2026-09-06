import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
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
import { Lead, LeadActivity, LeadNote, LeadTask, LeadEmail, LeadCall, LeadMeeting, Tag, LeadPipeline, LeadView, LeadAIInsight, LeadFilters, BulkOperation, LeadEnrichmentRequest, LeadEnrichmentResponse } from '../types/lead';

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
  /** Server message from the last rejected write, so a caller can show the real
   *  reason instead of reporting success. Cleared on the next successful write.
   *  Use for RENDERING. */
  lastWriteError: string | null;
  /** Same, for failed READS. Separate channel on purpose: a successful background
   *  refresh must not wipe the reason a save failed before the user sees it. */
  lastReadError: string | null;
  lastReadErrorRef: React.MutableRefObject<string | null>;
  /** The same message, readable synchronously. A caller that awaits updateLead()
   *  and then reads state still holds the pre-call closure value, so it would see
   *  null and fall back to a generic string — which is how the conversion wizard
   *  reported "the server rejected it" without saying why. Read this instead when
   *  you need the reason immediately after the await. */
  lastWriteErrorRef: React.MutableRefObject<string | null>;
  deleteLead: (id: string) => Promise<boolean>;
  bulkDeleteLeads: (ids: string[]) => Promise<boolean>;

  getLeadActivities: (leadId: string) => Promise<LeadActivity[]>;
  createActivity: (activity: Partial<LeadActivity>) => Promise<LeadActivity | null>;
  updateActivity: (id: string, updates: Partial<LeadActivity>) => Promise<boolean>;

  getLeadNotes: (leadId: string) => Promise<LeadNote[]>;
  createNote: (note: Partial<LeadNote>) => Promise<LeadNote | null>;
  updateNote: (id: string, updates: Partial<LeadNote>) => Promise<boolean>;
  deleteNote: (id: string, leadId: string) => Promise<boolean>;

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
  const [lastWriteError, setLastWriteError] = useState<string | null>(null);
  const lastWriteErrorRef = useRef<string | null>(null);
  const [lastReadError, setLastReadError] = useState<string | null>(null);
  const lastReadErrorRef = useRef<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<LeadFilters>({});
  const [currentView, setCurrentView] = useState<LeadView | null>(null);
  const [views, setViews] = useState<LeadView[]>([]);
  const [pipelines, setPipelines] = useState<LeadPipeline[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // ── Error plumbing ────────────────────────────────────────────────────────
  //
  // Every function in leadsApi now THROWS on a rejected request; it used to
  // catch and return null / false / [], which made a 400, an expired token and a
  // genuinely empty list the same value at the call site. These two guards keep
  // each wrapper's existing return contract — consumers already treat null/false
  // /[] as "no result" — while recording the real server message so a caller can
  // show it.
  //
  // Two deliberate details, both learned the hard way in this module:
  //
  //  1. Reads and writes record to SEPARATE channels. If a read cleared
  //     lastWriteError, a background refresh succeeding right after a failed
  //     save would wipe the reason before the user ever saw it.
  //  2. Each channel has a ref as well as state. A caller that awaits a wrapper
  //     and then reads the state variable still holds its pre-call closure value,
  //     because React has not re-rendered yet — it would see null and fall back to
  //     a generic string. Read the ref when you need the reason immediately after
  //     an await; read the state when you are rendering.
  const recordWrite = (scope: string, message: string | null) => {
    lastWriteErrorRef.current = message;
    setLastWriteError(message);
    if (message) console.error(`[LeadContext] ${scope}:`, message);
  };
  const recordRead = (scope: string, message: string | null) => {
    lastReadErrorRef.current = message;
    setLastReadError(message);
    if (message) console.error(`[LeadContext] ${scope}:`, message);
  };

  async function guardWrite<T>(scope: string, op: () => Promise<T>, fallback: T): Promise<T> {
    try {
      const result = await op();
      recordWrite(scope, null);
      return result;
    } catch (err: any) {
      recordWrite(scope, err?.message || `${scope} failed.`);
      return fallback;
    }
  }

  async function guardRead<T>(scope: string, op: () => Promise<T>, fallback: T): Promise<T> {
    try {
      const result = await op();
      recordRead(scope, null);
      return result;
    } catch (err: any) {
      recordRead(scope, err?.message || `${scope} failed.`);
      return fallback;
    }
  }

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

  const getLead = (id: string): Promise<Lead | null> =>
    guardRead('getLead', () => fetchLeadByIdFromAPI(id), null);

  const createLead = async (lead: Partial<Lead>): Promise<Lead | null> => {
    const payload = { ...lead, owner_id: lead.owner_id || user?.id };
    const created = await guardWrite('createLead', () => createLeadViaAPI(payload), null);
    if (created) setLeads(prev => [created, ...prev]);
    return created;
  };

  // Keeps its Promise<boolean> contract — every existing consumer already treats
  // false as failure — but no longer loses WHY. updateLeadViaAPI now throws with
  // the server's message; that message is recorded on `lastWriteError` so a caller
  // can show the real reason instead of guessing or, worse, reporting success.
  const updateLead = async (id: string, updates: Partial<Lead>): Promise<boolean> => {
    try {
      await updateLeadViaAPI(id, updates);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      lastWriteErrorRef.current = null;
      setLastWriteError(null);
      return true;
    } catch (err: any) {
      const message = err?.message || 'The server rejected the update.';
      console.error('[LeadContext] updateLead:', message);
      lastWriteErrorRef.current = message;
      setLastWriteError(message);
      return false;
    }
  };

  const deleteLead = async (id: string): Promise<boolean> => {
    const ok = await guardWrite('deleteLead', () => deleteLeadViaAPI(id), false);
    if (ok) setLeads(prev => prev.filter(l => l.id !== id));
    return ok;
  };

  const bulkDeleteLeads = async (ids: string[]): Promise<boolean> => {
    const ok = await guardWrite(
      'bulkDeleteLeads',
      async () => { await Promise.all(ids.map(id => deleteLeadViaAPI(id))); return true; },
      false,
    );
    if (ok) setLeads(prev => prev.filter(l => !ids.includes(l.id)));
    return ok;
  };

  // ── Activities ────────────────────────────────────────────────────────────
  const getLeadActivities = (leadId: string) =>
    guardRead('getLeadActivities', () => fetchActivitiesFromAPI(leadId), []);

  const createActivity = async (activity: Partial<LeadActivity>): Promise<LeadActivity | null> => {
    if (!activity.lead_id) return null;
    return guardWrite('createActivity', () => createActivityViaAPI(activity.lead_id!, activity), null);
  };

  const updateActivity = async (id: string, updates: Partial<LeadActivity>): Promise<boolean> => {
    if (!updates.lead_id) return false;
    return guardWrite('updateActivity', () => updateActivityViaAPI(updates.lead_id!, id, updates), false);
  };

  // ── Notes ─────────────────────────────────────────────────────────────────
  const getLeadNotes = (leadId: string) =>
    guardRead('getLeadNotes', () => fetchNotesFromAPI(leadId), []);

  const createNote = async (note: Partial<LeadNote>): Promise<LeadNote | null> => {
    if (!note.lead_id) return null;
    return guardWrite('createNote', () => createNoteViaAPI(note.lead_id!, note), null);
  };

  const updateNote = async (id: string, updates: Partial<LeadNote>): Promise<boolean> => {
    if (!updates.lead_id) return false;
    return guardWrite('updateNote', () => updateNoteViaAPI(updates.lead_id!, id, updates), false);
  };

  const deleteNote = (id: string, leadId: string): Promise<boolean> =>
    guardWrite('deleteNote', () => deleteNoteViaAPI(leadId, id), false);

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const getLeadTasks = (leadId: string) =>
    guardRead('getLeadTasks', () => fetchTasksFromAPI(leadId), []);

  const createTask = async (task: Partial<LeadTask>): Promise<LeadTask | null> => {
    if (!task.lead_id) return null;
    return guardWrite('createTask', () => createTaskViaAPI(task.lead_id!, task), null);
  };

  const updateTask = async (id: string, updates: Partial<LeadTask>): Promise<boolean> => {
    if (!updates.lead_id) return false;
    return guardWrite('updateTask', () => updateTaskViaAPI(updates.lead_id!, id, updates), false);
  };

  // ── Emails ────────────────────────────────────────────────────────────────
  const getLeadEmails = (leadId: string) =>
    guardRead('getLeadEmails', () => fetchEmailsFromAPI(leadId), []);

  const sendEmail = async (email: Partial<LeadEmail>): Promise<LeadEmail | null> => {
    if (!email.lead_id) return null;
    return guardWrite('sendEmail', () => logEmailViaAPI(email.lead_id!, { ...email, direction: 'outbound', sent_at: new Date().toISOString() }), null);
  };

  // ── Calls ─────────────────────────────────────────────────────────────────
  const getLeadCalls = (leadId: string) =>
    guardRead('getLeadCalls', () => fetchCallsFromAPI(leadId), []);

  const logCall = async (call: Partial<LeadCall>): Promise<LeadCall | null> => {
    if (!call.lead_id) return null;
    return guardWrite('logCall', () => logCallViaAPI(call.lead_id!, call), null);
  };

  // ── Meetings ──────────────────────────────────────────────────────────────
  const getLeadMeetings = (leadId: string) =>
    guardRead('getLeadMeetings', () => fetchMeetingsFromAPI(leadId), []);

  const scheduleMeeting = async (meeting: Partial<LeadMeeting>): Promise<LeadMeeting | null> => {
    if (!meeting.lead_id) return null;
    return guardWrite('scheduleMeeting', () => scheduleMeetingViaAPI(meeting.lead_id!, meeting), null);
  };

  // ── AI Insights (no DB table yet — interface stubs) ───────────────────────
  const getLeadInsights    = async (_leadId: string): Promise<LeadAIInsight[]> => [];
  const acknowledgeInsight = async (_id: string): Promise<boolean> => false;
  const dismissInsight     = async (_id: string): Promise<boolean> => false;

  // ── Enrichment ────────────────────────────────────────────────────────────
  const enrichLead = (request: LeadEnrichmentRequest): Promise<LeadEnrichmentResponse | null> =>
    guardWrite('enrichLead', () => enrichLeadViaAPI(request.lead_id), null);

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
      recordWrite('executeBulkOperation', err?.message || 'Bulk operation failed.');
      return false;
    }
  };

  // ── Views ─────────────────────────────────────────────────────────────────
  const fetchViews = useCallback(async () => {
    const data = await guardRead('fetchViews', () => fetchViewsFromAPI(), []);
    setViews(data);
  }, []);

  const createView = async (view: Partial<LeadView>): Promise<LeadView | null> => {
    const created = await guardWrite('createView', () => createViewViaAPI(view), null);
    if (created) setViews(prev => [...prev, created]);
    return created;
  };

  const updateView = async (id: string, updates: Partial<LeadView>): Promise<boolean> => {
    const ok = await guardWrite('updateView', () => updateViewViaAPI(id, updates), false);
    if (ok) setViews(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    return ok;
  };

  const deleteView = async (id: string): Promise<boolean> => {
    const ok = await guardWrite('deleteView', () => deleteViewViaAPI(id), false);
    if (ok) setViews(prev => prev.filter(v => v.id !== id));
    return ok;
  };

  const applyView = (view: LeadView) => {
    setCurrentView(view);
    applyFilters(view.filters);
  };

  // ── Tags ──────────────────────────────────────────────────────────────────
  const fetchTags = async () => {
    const data = await guardRead('fetchTags', () => fetchTagsFromAPI(), []);
    setTags(data);
  };

  const createTag = async (tag: Partial<Tag>): Promise<Tag | null> => {
    const created = await guardWrite('createTag', () => createTagViaAPI(tag), null);
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
    lastWriteError,
    lastWriteErrorRef,
    lastReadError,
    lastReadErrorRef,
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
