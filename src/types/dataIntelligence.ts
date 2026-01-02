export type IntentSignalType =
  | 'website_visit'
  | 'content_download'
  | 'pricing_page_view'
  | 'demo_request'
  | 'feature_research'
  | 'competitor_research'
  | 'integration_research'
  | 'case_study_view'
  | 'documentation_access'
  | 'api_documentation'
  | 'trial_signup'
  | 'webinar_attendance'
  | 'email_engagement'
  | 'social_engagement';

export type IntentSource =
  | 'first_party'
  | 'third_party'
  | 'social_media'
  | 'content_syndication'
  | 'review_sites'
  | 'community_forums'
  | 'search_behavior'
  | 'ad_engagement';

export type TechCategory =
  | 'crm'
  | 'marketing_automation'
  | 'sales_engagement'
  | 'email_marketing'
  | 'analytics'
  | 'business_intelligence'
  | 'data_warehouse'
  | 'etl'
  | 'customer_support'
  | 'helpdesk'
  | 'live_chat'
  | 'chatbot'
  | 'project_management'
  | 'collaboration'
  | 'productivity'
  | 'communication'
  | 'ecommerce'
  | 'payment_processing'
  | 'subscription_billing'
  | 'invoicing'
  | 'hr_management'
  | 'recruiting'
  | 'payroll'
  | 'benefits'
  | 'cloud_infrastructure'
  | 'hosting'
  | 'cdn'
  | 'security'
  | 'development_tools'
  | 'version_control'
  | 'ci_cd'
  | 'monitoring'
  | 'accounting'
  | 'erp'
  | 'inventory'
  | 'supply_chain'
  | 'social_media_management'
  | 'seo'
  | 'advertising'
  | 'content_management'
  | 'video_conferencing'
  | 'telephony'
  | 'contact_center'
  | 'unified_communications'
  | 'identity_management'
  | 'authentication'
  | 'compliance'
  | 'data_privacy'
  | 'machine_learning'
  | 'ai_platform'
  | 'data_science'
  | 'nlp';

export type FundingStage =
  | 'seed'
  | 'series_a'
  | 'series_b'
  | 'series_c'
  | 'series_d_plus'
  | 'ipo'
  | 'acquisition'
  | 'merger'
  | 'private_equity'
  | 'venture_debt';

export type AlertChannel = 'email' | 'slack' | 'webhook' | 'in_app' | 'sms';

export type AlertPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TrendDirection = 'increasing' | 'stable' | 'decreasing';

export interface ProspectIntentSignal {
  id: string;
  prospect_id: string;
  signal_type: IntentSignalType;
  signal_source: IntentSource;
  intent_topic: string;
  intent_score: number;
  confidence_level: number;
  signal_data: Record<string, any>;
  detected_at: string;
  expires_at?: string;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProspectJobChange {
  id: string;
  prospect_id: string;
  previous_title?: string;
  new_title: string;
  previous_company?: string;
  new_company?: string;
  previous_company_id?: string;
  new_company_id?: string;
  change_type: string;
  detected_at: string;
  verified_at?: string;
  confidence_score: number;
  source: string;
  alert_sent: boolean;
  alert_sent_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CompanyTechStack {
  id: string;
  account_id: string;
  technology_name: string;
  tech_category: TechCategory;
  vendor?: string;
  is_installed: boolean;
  installation_confidence?: number;
  first_detected_at: string;
  last_verified_at?: string;
  usage_indicators: Record<string, any>;
  integration_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProspectBuyerIntent {
  id: string;
  prospect_id: string;
  composite_score: number;
  engagement_score?: number;
  fit_score?: number;
  timing_score?: number;
  authority_score?: number;
  trend_direction?: TrendDirection;
  score_velocity?: number;
  last_calculated_at: string;
  decay_factor: number;
  score_history: Array<{
    score: number;
    calculated_at: string;
  }>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CompanyFundingTrigger {
  id: string;
  account_id: string;
  trigger_type: string;
  funding_stage?: FundingStage;
  funding_amount?: number;
  currency: string;
  valuation?: number;
  announced_at: string;
  lead_investor?: string;
  investors: string[];
  deal_stage?: string;
  priority_level: AlertPriority;
  action_items: string[];
  trigger_data: Record<string, any>;
  is_processed: boolean;
  processed_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DataIntelligenceAlert {
  id: string;
  user_id: string;
  alert_name: string;
  alert_type: string;
  alert_channels: AlertChannel[];
  alert_priority: AlertPriority;
  filter_criteria: Record<string, any>;
  frequency_minutes: number;
  is_enabled: boolean;
  last_triggered_at?: string;
  trigger_count: number;
  delivery_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TrendingIntentTopic {
  id: string;
  topic_name: string;
  industry?: string;
  trending_score: number;
  signal_count: number;
  unique_prospects: number;
  momentum_score?: number;
  velocity?: number;
  calculated_at: string;
  time_window_hours: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface IntentSignalFilters {
  prospect_id?: string;
  signal_type?: IntentSignalType[];
  signal_source?: IntentSource[];
  intent_topic?: string;
  min_score?: number;
  max_score?: number;
  date_from?: string;
  date_to?: string;
  is_active?: boolean;
}

export interface JobChangeFilters {
  prospect_id?: string;
  change_type?: string;
  new_company_id?: string;
  min_confidence?: number;
  alert_sent?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface TechStackFilters {
  account_id?: string;
  tech_category?: TechCategory[];
  technology_name?: string;
  is_installed?: boolean;
  min_confidence?: number;
}

export interface BuyerIntentFilters {
  prospect_id?: string;
  min_composite_score?: number;
  max_composite_score?: number;
  trend_direction?: TrendDirection;
  date_from?: string;
  date_to?: string;
}

export interface FundingTriggerFilters {
  account_id?: string;
  trigger_type?: string;
  funding_stage?: FundingStage[];
  min_amount?: number;
  priority_level?: AlertPriority[];
  is_processed?: boolean;
  date_from?: string;
  date_to?: string;
}

export interface IntentSignalStats {
  total_signals: number;
  avg_intent_score: number;
  top_topics: Array<{
    topic: string;
    count: number;
    avg_score: number;
  }>;
  signal_distribution: Record<IntentSignalType, number>;
  source_distribution: Record<IntentSource, number>;
  recent_signals: ProspectIntentSignal[];
}

export interface BuyerIntentBreakdown {
  composite_score: number;
  components: {
    engagement: number;
    fit: number;
    timing: number;
    authority: number;
  };
  trend: TrendDirection;
  velocity: number;
  score_history: Array<{
    score: number;
    date: string;
  }>;
}

export interface TechStackSummary {
  total_technologies: number;
  by_category: Record<TechCategory, number>;
  recent_additions: CompanyTechStack[];
  top_vendors: Array<{
    vendor: string;
    tech_count: number;
  }>;
}

export interface FundingTriggerSummary {
  total_triggers: number;
  total_amount: number;
  by_stage: Record<FundingStage, number>;
  by_priority: Record<AlertPriority, number>;
  unprocessed_count: number;
  recent_triggers: CompanyFundingTrigger[];
}
