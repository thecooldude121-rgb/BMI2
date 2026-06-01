import { supabase } from '../lib/supabase';

export interface UserSettings {
  id?: string;
  user_id?: string;
  language: string;
  timezone: string;
  date_format: string;
  time_format: string;
  week_starts_on: string;
  currency: string;
  theme: string;
  density: string;
  default_deals_view: string;
  default_leads_view: string;
  items_per_page: number;
  default_landing_page: string;
}

export interface DashboardWidget {
  id?: string;
  user_id?: string;
  widget_name: string;
  enabled: boolean;
  position: number;
  settings?: any;
}

export interface NotificationPreferences {
  id?: string;
  user_id?: string;
  email_frequency: string;
  email_new_leads: boolean;
  email_deal_updates: boolean;
  email_tasks: boolean;
  email_meetings: boolean;
  inapp_enabled: boolean;
  inapp_sound: boolean;
  desktop_notifications: boolean;
  slack_enabled: boolean;
  slack_channel?: string;
}

export interface EmailTemplate {
  id?: string;
  user_id?: string;
  name: string;
  subject: string;
  body: string;
  category: 'outreach' | 'followup';
  usage_count?: number;
  open_rate?: number;
  reply_rate?: number;
}

export interface PipelineStage {
  id?: string;
  name: string;
  probability: number;
  color: string;
  position: number;
  is_system: boolean;
}

export interface WinLossReason {
  id?: string;
  reason: string;
  type: 'won' | 'lost';
  usage_count?: number;
}

export interface CustomField {
  id?: string;
  user_id?: string;
  module: 'leads' | 'contacts' | 'accounts' | 'deals';
  field_name: string;
  field_type: string;
  options?: any;
  is_required: boolean;
  placeholder?: string;
  default_value?: string;
  position: number;
}

export interface ApiKey {
  id?: string;
  user_id?: string;
  name: string;
  key_hash: string;
  key_preview: string;
  scopes?: any[];
  last_used_at?: string;
  expires_at?: string;
}

export interface UserSession {
  id?: string;
  user_id?: string;
  device: string;
  location: string;
  ip_address: string;
  user_agent?: string;
  is_current: boolean;
  last_active_at?: string;
}

export interface DataExport {
  id?: string;
  user_id?: string;
  format: 'CSV' | 'JSON' | 'Excel';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_size?: number;
  file_url?: string;
  expires_at?: string;
  created_at?: string;
  completed_at?: string;
}

class SettingsService {
  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }

    return data;
  }

  async upsertUserSettings(settings: UserSettings): Promise<boolean> {
    const { error } = await supabase
      .from('user_settings')
      .upsert(settings, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating user settings:', error);
      return false;
    }

    return true;
  }

  // Dashboard Widgets
  async getDashboardWidgets(userId: string): Promise<DashboardWidget[]> {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('user_id', userId)
      .order('position');

    if (error) {
      console.error('Error fetching widgets:', error);
      return [];
    }

    return data || [];
  }

  async upsertWidget(widget: DashboardWidget): Promise<boolean> {
    const { error } = await supabase
      .from('dashboard_widgets')
      .upsert(widget, { onConflict: 'user_id, widget_name' });

    if (error) {
      console.error('Error updating widget:', error);
      return false;
    }

    return true;
  }

  // Notification Preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }

    return data;
  }

  async upsertNotificationPreferences(prefs: NotificationPreferences): Promise<boolean> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert(prefs, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }

    return true;
  }

  // Email Templates
  async getEmailTemplates(userId: string, category?: string): Promise<EmailTemplate[]> {
    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('user_id', userId);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching email templates:', error);
      return [];
    }

    return data || [];
  }

  async createEmailTemplate(template: EmailTemplate): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from('email_templates')
      .insert(template)
      .select()
      .single();

    if (error) {
      console.error('Error creating email template:', error);
      return null;
    }

    return data;
  }

  async updateEmailTemplate(id: string, template: Partial<EmailTemplate>): Promise<boolean> {
    const { error } = await supabase
      .from('email_templates')
      .update({ ...template, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating email template:', error);
      return false;
    }

    return true;
  }

  async deleteEmailTemplate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting email template:', error);
      return false;
    }

    return true;
  }

  // Pipeline Stages
  async getPipelineStages(): Promise<PipelineStage[]> {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .select('*')
      .order('position');

    if (error) {
      console.error('Error fetching pipeline stages:', error);
      return [];
    }

    return data || [];
  }

  async createPipelineStage(stage: PipelineStage): Promise<PipelineStage | null> {
    const { data, error } = await supabase
      .from('pipeline_stages')
      .insert(stage)
      .select()
      .single();

    if (error) {
      console.error('Error creating pipeline stage:', error);
      return null;
    }

    return data;
  }

  async updatePipelineStage(id: string, stage: Partial<PipelineStage>): Promise<boolean> {
    const { error } = await supabase
      .from('pipeline_stages')
      .update(stage)
      .eq('id', id);

    if (error) {
      console.error('Error updating pipeline stage:', error);
      return false;
    }

    return true;
  }

  async deletePipelineStage(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pipeline stage:', error);
      return false;
    }

    return true;
  }

  async reorderPipelineStages(stages: { id: string; position: number }[]): Promise<boolean> {
    const updates = stages.map(stage =>
      supabase
        .from('pipeline_stages')
        .update({ position: stage.position })
        .eq('id', stage.id)
    );

    const results = await Promise.all(updates);
    const hasError = results.some(result => result.error);

    if (hasError) {
      console.error('Error reordering pipeline stages');
      return false;
    }

    return true;
  }

  // Win/Loss Reasons
  async getWinLossReasons(type?: 'won' | 'lost'): Promise<WinLossReason[]> {
    let query = supabase.from('win_loss_reasons').select('*');

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching win/loss reasons:', error);
      return [];
    }

    return data || [];
  }

  async createWinLossReason(reason: WinLossReason): Promise<WinLossReason | null> {
    const { data, error } = await supabase
      .from('win_loss_reasons')
      .insert(reason)
      .select()
      .single();

    if (error) {
      console.error('Error creating win/loss reason:', error);
      return null;
    }

    return data;
  }

  async updateWinLossReason(id: string, reason: Partial<WinLossReason>): Promise<boolean> {
    const { error } = await supabase
      .from('win_loss_reasons')
      .update(reason)
      .eq('id', id);

    if (error) {
      console.error('Error updating win/loss reason:', error);
      return false;
    }

    return true;
  }

  async deleteWinLossReason(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('win_loss_reasons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting win/loss reason:', error);
      return false;
    }

    return true;
  }

  // Custom Fields
  async getCustomFields(userId: string, module?: string): Promise<CustomField[]> {
    let query = supabase
      .from('custom_fields')
      .select('*')
      .eq('user_id', userId);

    if (module) {
      query = query.eq('module', module);
    }

    const { data, error } = await query.order('position');

    if (error) {
      console.error('Error fetching custom fields:', error);
      return [];
    }

    return data || [];
  }

  async createCustomField(field: CustomField): Promise<CustomField | null> {
    const { data, error } = await supabase
      .from('custom_fields')
      .insert(field)
      .select()
      .single();

    if (error) {
      console.error('Error creating custom field:', error);
      return null;
    }

    return data;
  }

  async updateCustomField(id: string, field: Partial<CustomField>): Promise<boolean> {
    const { error } = await supabase
      .from('custom_fields')
      .update(field)
      .eq('id', id);

    if (error) {
      console.error('Error updating custom field:', error);
      return false;
    }

    return true;
  }

  async deleteCustomField(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('custom_fields')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting custom field:', error);
      return false;
    }

    return true;
  }

  // API Keys
  async getApiKeys(userId: string): Promise<ApiKey[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }

    return data || [];
  }

  async createApiKey(apiKey: ApiKey): Promise<ApiKey | null> {
    const { data, error } = await supabase
      .from('api_keys')
      .insert(apiKey)
      .select()
      .single();

    if (error) {
      console.error('Error creating API key:', error);
      return null;
    }

    return data;
  }

  async deleteApiKey(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting API key:', error);
      return false;
    }

    return true;
  }

  // User Sessions
  async getUserSessions(userId: string): Promise<UserSession[]> {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });

    if (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }

    return data || [];
  }

  async deleteSession(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting session:', error);
      return false;
    }

    return true;
  }

  async deleteAllOtherSessions(userId: string, currentSessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
      .neq('id', currentSessionId);

    if (error) {
      console.error('Error deleting other sessions:', error);
      return false;
    }

    return true;
  }

  // Data Exports
  async getDataExports(userId: string): Promise<DataExport[]> {
    const { data, error } = await supabase
      .from('data_exports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching data exports:', error);
      return [];
    }

    return data || [];
  }

  async requestDataExport(userId: string, format: 'CSV' | 'JSON' | 'Excel'): Promise<DataExport | null> {
    const { data, error} = await supabase
      .from('data_exports')
      .insert({
        user_id: userId,
        format,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();

    if (error) {
      console.error('Error requesting data export:', error);
      return null;
    }

    return data;
  }
}

export const settingsService = new SettingsService();
