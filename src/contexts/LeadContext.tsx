import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
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
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
      }

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.temperature && filters.temperature.length > 0) {
        query = query.in('temperature', filters.temperature);
      }

      if (filters?.owner_id && filters.owner_id.length > 0) {
        query = query.in('owner_id', filters.owner_id);
      }

      if (filters?.score_min !== undefined) {
        query = query.gte('score', filters.score_min);
      }

      if (filters?.score_max !== undefined) {
        query = query.lte('score', filters.score_max);
      }

      if (filters?.value_min !== undefined) {
        query = query.gte('estimated_value', filters.value_min);
      }

      if (filters?.value_max !== undefined) {
        query = query.lte('estimated_value', filters.value_max);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setLeads(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getLead = async (id: string): Promise<Lead | null> => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error fetching lead:', err);
      return null;
    }
  };

  const createLead = async (lead: Partial<Lead>): Promise<Lead | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          owner_id: lead.owner_id || user.id,
          created_by: user.id,
          score: 0,
          estimated_value: lead.estimated_value || 0,
          probability: lead.probability || 0,
          currency: lead.currency || 'USD',
          status: lead.status || 'new',
          temperature: lead.temperature || 'cold',
          email_opt_in: lead.email_opt_in !== false,
          sms_opt_in: lead.sms_opt_in || false,
          call_opt_in: lead.call_opt_in !== false,
          do_not_contact: lead.do_not_contact || false,
          gdpr_consent: lead.gdpr_consent || false,
          is_qualified: lead.is_qualified || false,
          email_opens_count: 0,
          email_clicks_count: 0,
          page_views_count: 0,
          meeting_count: 0,
          call_count: 0,
          email_sent_count: 0,
          automation_paused: false,
          tags: lead.tags || [],
          custom_fields: lead.custom_fields || {},
          enrichment_data: lead.enrichment_data || {},
          ai_recommendations: []
        })
        .select()
        .single();

      if (error) throw error;

      setLeads(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating lead:', err);
      return null;
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_by: user.id
        })
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => prev.map(lead =>
        lead.id === id ? { ...lead, ...updates } : lead
      ));

      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating lead:', err);
      return false;
    }
  };

  const deleteLead = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => prev.filter(lead => lead.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting lead:', err);
      return false;
    }
  };

  const bulkDeleteLeads = async (ids: string[]): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .in('id', ids);

      if (error) throw error;

      setLeads(prev => prev.filter(lead => !ids.includes(lead.id)));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error bulk deleting leads:', err);
      return false;
    }
  };

  const getLeadActivities = async (leadId: string): Promise<LeadActivity[]> => {
    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      return [];
    }
  };

  const createActivity = async (activity: Partial<LeadActivity>): Promise<LeadActivity | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .insert({
          ...activity,
          created_by: user.id,
          owner_id: activity.owner_id || user.id,
          status: activity.status || 'planned',
          participants: activity.participants || [],
          attendees: activity.attendees || [],
          attachments: activity.attachments || [],
          related_entities: activity.related_entities || [],
          custom_fields: activity.custom_fields || {},
          automation_triggered: activity.automation_triggered || false
        })
        .select()
        .single();

      if (error) throw error;

      if (activity.lead_id) {
        await updateLead(activity.lead_id, {
          last_activity_date: new Date().toISOString()
        });
      }

      return data;
    } catch (err: any) {
      console.error('Error creating activity:', err);
      return null;
    }
  };

  const updateActivity = async (id: string, updates: Partial<LeadActivity>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lead_activities')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error updating activity:', err);
      return false;
    }
  };

  const getLeadNotes = async (leadId: string): Promise<LeadNote[]> => {
    try {
      const { data, error } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      return [];
    }
  };

  const createNote = async (note: Partial<LeadNote>): Promise<LeadNote | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lead_notes')
        .insert({
          ...note,
          created_by: user.id,
          is_pinned: note.is_pinned || false,
          mentions: note.mentions || [],
          attachments: note.attachments || [],
          is_private: note.is_private || false,
          is_deleted: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error creating note:', err);
      return null;
    }
  };

  const updateNote = async (id: string, updates: Partial<LeadNote>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lead_notes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error updating note:', err);
      return false;
    }
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lead_notes')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error deleting note:', err);
      return false;
    }
  };

  const getLeadTasks = async (leadId: string): Promise<LeadTask[]> => {
    try {
      const { data, error } = await supabase
        .from('lead_tasks')
        .select('*')
        .eq('lead_id', leadId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      return [];
    }
  };

  const createTask = async (task: Partial<LeadTask>): Promise<LeadTask | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lead_tasks')
        .insert({
          ...task,
          created_by: user.id,
          assigned_to: task.assigned_to || user.id,
          priority: task.priority || 'medium',
          status: task.status || 'open',
          depends_on_task_ids: task.depends_on_task_ids || [],
          subtasks: task.subtasks || [],
          automation_triggered: task.automation_triggered || false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error creating task:', err);
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<LeadTask>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lead_tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error updating task:', err);
      return false;
    }
  };

  const getLeadEmails = async (leadId: string): Promise<LeadEmail[]> => {
    try {
      const { data, error } = await supabase
        .from('lead_emails')
        .select('*')
        .eq('lead_id', leadId)
        .order('sent_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching emails:', err);
      return [];
    }
  };

  const sendEmail = async (email: Partial<LeadEmail>): Promise<LeadEmail | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lead_emails')
        .insert({
          ...email,
          created_by: user.id,
          direction: email.direction || 'outbound',
          sent_at: new Date().toISOString(),
          status: 'sent',
          open_count: 0,
          click_count: 0,
          cc_emails: email.cc_emails || [],
          bcc_emails: email.bcc_emails || [],
          attachments: email.attachments || [],
          tracking_enabled: email.tracking_enabled !== false
        })
        .select()
        .single();

      if (error) throw error;

      if (email.lead_id) {
        const lead = await getLead(email.lead_id);
        if (lead) {
          await updateLead(email.lead_id, {
            last_email_sent_at: new Date().toISOString(),
            email_sent_count: lead.email_sent_count + 1
          });
        }
      }

      return data;
    } catch (err: any) {
      console.error('Error sending email:', err);
      return null;
    }
  };

  const getLeadCalls = async (leadId: string): Promise<LeadCall[]> => {
    try {
      const { data, error } = await supabase
        .from('lead_calls')
        .select('*')
        .eq('lead_id', leadId)
        .order('started_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching calls:', err);
      return [];
    }
  };

  const logCall = async (call: Partial<LeadCall>): Promise<LeadCall | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lead_calls')
        .insert({
          ...call,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      if (call.lead_id) {
        const lead = await getLead(call.lead_id);
        if (lead) {
          await updateLead(call.lead_id, {
            call_count: lead.call_count + 1,
            last_contact_date: new Date().toISOString()
          });
        }
      }

      return data;
    } catch (err: any) {
      console.error('Error logging call:', err);
      return null;
    }
  };

  const getLeadMeetings = async (leadId: string): Promise<LeadMeeting[]> => {
    try {
      const { data, error } = await supabase
        .from('lead_meetings')
        .select('*')
        .eq('lead_id', leadId)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching meetings:', err);
      return [];
    }
  };

  const scheduleMeeting = async (meeting: Partial<LeadMeeting>): Promise<LeadMeeting | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lead_meetings')
        .insert({
          ...meeting,
          created_by: user.id,
          status: meeting.status || 'planned',
          duration_minutes: meeting.duration_minutes || 30,
          attendees: meeting.attendees || [],
          reminder_sent: false,
          follow_up_created: false
        })
        .select()
        .single();

      if (error) throw error;

      if (meeting.lead_id) {
        const lead = await getLead(meeting.lead_id);
        if (lead) {
          await updateLead(meeting.lead_id, {
            meeting_count: lead.meeting_count + 1
          });
        }
      }

      return data;
    } catch (err: any) {
      console.error('Error scheduling meeting:', err);
      return null;
    }
  };

  const getLeadInsights = async (leadId: string): Promise<LeadAIInsight[]> => {
    try {
      const { data, error } = await supabase
        .from('lead_ai_insights')
        .select('*')
        .eq('lead_id', leadId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching insights:', err);
      return [];
    }
  };

  const acknowledgeInsight = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('lead_ai_insights')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error acknowledging insight:', err);
      return false;
    }
  };

  const dismissInsight = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('lead_ai_insights')
        .update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
          dismissed_by: user.id
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error dismissing insight:', err);
      return false;
    }
  };

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
    if (!user) return false;

    try {
      switch (operation.operation) {
        case 'update_owner':
          await supabase
            .from('leads')
            .update({ owner_id: operation.parameters?.owner_id })
            .in('id', operation.lead_ids);
          break;

        case 'update_status':
          await supabase
            .from('leads')
            .update({ status: operation.parameters?.status })
            .in('id', operation.lead_ids);
          break;

        case 'add_tags':
          for (const leadId of operation.lead_ids) {
            const lead = await getLead(leadId);
            if (lead) {
              const newTags = [...new Set([...lead.tags, ...(operation.parameters?.tags || [])])];
              await updateLead(leadId, { tags: newTags });
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
      console.error('Error executing bulk operation:', err);
      return false;
    }
  };

  const fetchViews = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('lead_views')
        .select('*')
        .or(`created_by.eq.${user.id},is_public.eq.true,is_system.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setViews(data || []);
    } catch (err: any) {
      console.error('Error fetching views:', err);
    }
  };

  const createView = async (view: Partial<LeadView>): Promise<LeadView | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('lead_views')
        .insert({
          ...view,
          created_by: user.id,
          is_default: view.is_default || false,
          is_public: view.is_public || false,
          is_system: false,
          sort_order: view.sort_order || 'asc',
          columns: view.columns || []
        })
        .select()
        .single();

      if (error) throw error;

      setViews(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      console.error('Error creating view:', err);
      return null;
    }
  };

  const updateView = async (id: string, updates: Partial<LeadView>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lead_views')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setViews(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
      return true;
    } catch (err: any) {
      console.error('Error updating view:', err);
      return false;
    }
  };

  const deleteView = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lead_views')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setViews(prev => prev.filter(v => v.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error deleting view:', err);
      return false;
    }
  };

  const applyView = (view: LeadView) => {
    setCurrentView(view);
    applyFilters(view.filters);
  };

  const fetchPipelines = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_pipelines')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPipelines(data || []);
    } catch (err: any) {
      console.error('Error fetching pipelines:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTags(data || []);
    } catch (err: any) {
      console.error('Error fetching tags:', err);
    }
  };

  const createTag = async (tag: Partial<Tag>): Promise<Tag | null> => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          ...tag,
          usage_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      setTags(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      console.error('Error creating tag:', err);
      return null;
    }
  };

  const convertLead = async (leadId: string, createDeal: boolean): Promise<{ contactId?: string; dealId?: string } | null> => {
    return { contactId: 'contact_123', dealId: createDeal ? 'deal_123' : undefined };
  };

  const detectDuplicates = async (leadId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('lead_duplicates')
        .select('*')
        .or(`lead_id_1.eq.${leadId},lead_id_2.eq.${leadId}`)
        .eq('status', 'pending');

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error detecting duplicates:', err);
      return [];
    }
  };

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
