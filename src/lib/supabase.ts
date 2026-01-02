import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: 'admin' | 'manager' | 'sales' | 'hr' | 'user';
          department: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          role?: 'admin' | 'manager' | 'sales' | 'hr' | 'user';
          department?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          role?: 'admin' | 'manager' | 'sales' | 'hr' | 'user';
          department?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          name: string;
          domain: string | null;
          industry: string | null;
          company_size: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | 'unknown';
          annual_revenue: number | null;
          website: string | null;
          phone: string | null;
          description: string | null;
          address: any;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain?: string | null;
          industry?: string | null;
          company_size?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | 'unknown';
          annual_revenue?: number | null;
          website?: string | null;
          phone?: string | null;
          description?: string | null;
          address?: any;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string | null;
          industry?: string | null;
          company_size?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+' | 'unknown';
          annual_revenue?: number | null;
          website?: string | null;
          phone?: string | null;
          description?: string | null;
          address?: any;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      deals: {
        Row: {
          id: string;
          deal_number: string;
          name: string;
          owner_id: string;
          deal_type: 'new-business' | 'existing-business' | 'upsell' | 'renewal' | 'cross-sell';
          country: string;
          pipeline_id: string;
          account_id: string | null;
          contact_id: string | null;
          amount: number;
          currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';
          closing_date: string | null;
          stage_id: string;
          probability: number;
          status: 'active' | 'won' | 'lost' | 'archived';
          created_by: string;
          platform_fee: number;
          custom_fee: number;
          license_fee: number;
          onboarding_fee: number;
          total_amount: number;
          description: string | null;
          tags: any;
          custom_fields: any;
          created_at: string;
          updated_at: string;
          last_activity_at: string | null;
        };
        Insert: {
          id?: string;
          deal_number?: string;
          name: string;
          owner_id: string;
          deal_type?: 'new-business' | 'existing-business' | 'upsell' | 'renewal' | 'cross-sell';
          country?: string;
          pipeline_id: string;
          account_id?: string | null;
          contact_id?: string | null;
          amount?: number;
          currency?: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';
          closing_date?: string | null;
          stage_id: string;
          probability?: number;
          status?: 'active' | 'won' | 'lost' | 'archived';
          created_by: string;
          platform_fee?: number;
          custom_fee?: number;
          license_fee?: number;
          onboarding_fee?: number;
          description?: string | null;
          tags?: any;
          custom_fields?: any;
          created_at?: string;
          updated_at?: string;
          last_activity_at?: string | null;
        };
        Update: {
          id?: string;
          deal_number?: string;
          name?: string;
          owner_id?: string;
          deal_type?: 'new-business' | 'existing-business' | 'upsell' | 'renewal' | 'cross-sell';
          country?: string;
          pipeline_id?: string;
          account_id?: string | null;
          contact_id?: string | null;
          amount?: number;
          currency?: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';
          closing_date?: string | null;
          stage_id?: string;
          probability?: number;
          status?: 'active' | 'won' | 'lost' | 'archived';
          created_by?: string;
          platform_fee?: number;
          custom_fee?: number;
          license_fee?: number;
          onboarding_fee?: number;
          description?: string | null;
          tags?: any;
          custom_fields?: any;
          created_at?: string;
          updated_at?: string;
          last_activity_at?: string | null;
        };
      };
    };
    Views: {
      deal_analytics_view: {
        Row: {
          id: string;
          deal_number: string;
          name: string;
          owner_id: string;
          owner_name: string;
          deal_type: string;
          country: string;
          amount: number;
          total_amount: number;
          probability: number;
          status: string;
          closing_date: string | null;
          created_at: string;
          last_activity_at: string | null;
          stage_name: string;
          stage_color: string;
          stage_position: number;
          pipeline_name: string;
          account_name: string | null;
          account_industry: string | null;
          contact_name: string | null;
          contact_email: string | null;
          days_in_current_stage: number | null;
          activity_count: number;
          completed_activities: number;
          open_tasks: number;
          email_count: number;
          weighted_amount: number;
        };
      };
    };
    Functions: {
      get_deal_forecast: {
        Args: {
          forecast_months?: number;
          user_filter?: string;
        };
        Returns: {
          month_year: string;
          forecasted_amount: number;
          weighted_amount: number;
          deal_count: number;
        }[];
      };
    };
  };
};

// Helper functions for common operations
export const dealService = {
  async getDeals(filters?: any) {
    let query = supabase
      .from('deals')
      .select(`
        *,
        owner:profiles!deals_owner_id_fkey(first_name, last_name, email),
        stage:pipeline_stages!deals_stage_id_fkey(name, color, probability),
        account:accounts(name, industry),
        contact:contacts(first_name, last_name, email),
        products:deal_products(*),
        attachments:deal_attachments(*)
      `)
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.owner_id) query = query.eq('owner_id', filters.owner_id);
      if (filters.stage_id) query = query.eq('stage_id', filters.stage_id);
      if (filters.status) query = query.eq('status', filters.status);
    }

    return query;
  },

  async getDealById(id: string) {
    return supabase
      .from('deals')
      .select(`
        *,
        owner:profiles!deals_owner_id_fkey(first_name, last_name, email, avatar_url),
        stage:pipeline_stages!deals_stage_id_fkey(name, color, probability),
        pipeline:pipelines(name, description),
        account:accounts(name, industry, website, phone),
        contact:contacts(first_name, last_name, email, phone, position),
        products:deal_products(*),
        attachments:deal_attachments(*),
        activities:activities(*),
        tasks:tasks(*),
        emails:emails(*),
        stage_history:deal_stage_history(
          *,
          from_stage:pipeline_stages!deal_stage_history_from_stage_id_fkey(name),
          to_stage:pipeline_stages!deal_stage_history_to_stage_id_fkey(name),
          changed_by_user:profiles!deal_stage_history_changed_by_fkey(first_name, last_name)
        )
      `)
      .eq('id', id)
      .single();
  },

  async createDeal(deal: any) {
    return supabase
      .from('deals')
      .insert(deal)
      .select()
      .single();
  },

  async updateDeal(id: string, updates: any) {
    return supabase
      .from('deals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  async deleteDeal(id: string) {
    return supabase
      .from('deals')
      .delete()
      .eq('id', id);
  }
};

export const pipelineService = {
  async getPipelines() {
    return supabase
      .from('pipelines')
      .select(`
        *,
        stages:pipeline_stages(*)
      `)
      .eq('is_active', true)
      .order('created_at');
  },

  async getStages(pipelineId: string) {
    return supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('position');
  }
};

export const customFieldService = {
  async getFieldDefinitions(entityType: string) {
    return supabase
      .from('custom_field_definitions')
      .select('*')
      .eq('entity_type', entityType)
      .eq('is_active', true)
      .order('position');
  },

  async getFieldValues(entityType: string, entityId: string) {
    return supabase
      .from('custom_field_values')
      .select(`
        *,
        field_definition:custom_field_definitions(*)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);
  },

  async saveFieldValue(fieldDefinitionId: string, entityType: string, entityId: string, value: any) {
    return supabase
      .from('custom_field_values')
      .upsert({
        field_definition_id: fieldDefinitionId,
        entity_type: entityType,
        entity_id: entityId,
        value: value
      });
  }
};