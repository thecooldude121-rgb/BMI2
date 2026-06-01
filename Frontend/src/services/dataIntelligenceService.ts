import { supabase } from '../lib/supabase';
import type {
  ProspectIntentSignal,
  ProspectJobChange,
  CompanyTechStack,
  ProspectBuyerIntent,
  CompanyFundingTrigger,
  DataIntelligenceAlert,
  TrendingIntentTopic,
  IntentSignalFilters,
  JobChangeFilters,
  TechStackFilters,
  BuyerIntentFilters,
  FundingTriggerFilters,
  IntentSignalStats,
  BuyerIntentBreakdown,
  TechStackSummary,
  FundingTriggerSummary
} from '../types/dataIntelligence';

export const intentSignalService = {
  async getIntentSignals(filters?: IntentSignalFilters) {
    let query = supabase
      .from('prospect_intent_signals')
      .select('*')
      .order('detected_at', { ascending: false });

    if (filters) {
      if (filters.prospect_id) query = query.eq('prospect_id', filters.prospect_id);
      if (filters.signal_type?.length) query = query.in('signal_type', filters.signal_type);
      if (filters.signal_source?.length) query = query.in('signal_source', filters.signal_source);
      if (filters.intent_topic) query = query.ilike('intent_topic', `%${filters.intent_topic}%`);
      if (filters.min_score) query = query.gte('intent_score', filters.min_score);
      if (filters.max_score) query = query.lte('intent_score', filters.max_score);
      if (filters.date_from) query = query.gte('detected_at', filters.date_from);
      if (filters.date_to) query = query.lte('detected_at', filters.date_to);
      if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);
    }

    return query;
  },

  async createIntentSignal(signal: Partial<ProspectIntentSignal>) {
    return supabase
      .from('prospect_intent_signals')
      .insert(signal)
      .select()
      .single();
  },

  async getIntentStats(prospectId: string): Promise<IntentSignalStats> {
    const { data: signals } = await supabase
      .from('prospect_intent_signals')
      .select('*')
      .eq('prospect_id', prospectId)
      .eq('is_active', true);

    if (!signals || signals.length === 0) {
      return {
        total_signals: 0,
        avg_intent_score: 0,
        top_topics: [],
        signal_distribution: {} as any,
        source_distribution: {} as any,
        recent_signals: []
      };
    }

    const topicsMap = new Map<string, { count: number; totalScore: number }>();
    const signalDist: Record<string, number> = {};
    const sourceDist: Record<string, number> = {};

    signals.forEach(signal => {
      const topic = signal.intent_topic;
      if (!topicsMap.has(topic)) {
        topicsMap.set(topic, { count: 0, totalScore: 0 });
      }
      const topicData = topicsMap.get(topic)!;
      topicData.count++;
      topicData.totalScore += signal.intent_score;

      signalDist[signal.signal_type] = (signalDist[signal.signal_type] || 0) + 1;
      sourceDist[signal.signal_source] = (sourceDist[signal.signal_source] || 0) + 1;
    });

    const topTopics = Array.from(topicsMap.entries())
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        avg_score: Math.round(data.totalScore / data.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const avgScore = Math.round(
      signals.reduce((sum, s) => sum + s.intent_score, 0) / signals.length
    );

    return {
      total_signals: signals.length,
      avg_intent_score: avgScore,
      top_topics: topTopics,
      signal_distribution: signalDist as any,
      source_distribution: sourceDist as any,
      recent_signals: signals.slice(0, 10)
    };
  },

  async getTrendingTopics(industry?: string, timeWindowHours: number = 24) {
    let query = supabase
      .from('trending_intent_topics')
      .select('*')
      .eq('time_window_hours', timeWindowHours)
      .order('trending_score', { ascending: false })
      .limit(20);

    if (industry) {
      query = query.eq('industry', industry);
    }

    return query;
  }
};

export const jobChangeService = {
  async getJobChanges(filters?: JobChangeFilters) {
    let query = supabase
      .from('prospect_job_changes')
      .select('*')
      .order('detected_at', { ascending: false });

    if (filters) {
      if (filters.prospect_id) query = query.eq('prospect_id', filters.prospect_id);
      if (filters.change_type) query = query.eq('change_type', filters.change_type);
      if (filters.new_company_id) query = query.eq('new_company_id', filters.new_company_id);
      if (filters.min_confidence) query = query.gte('confidence_score', filters.min_confidence);
      if (filters.alert_sent !== undefined) query = query.eq('alert_sent', filters.alert_sent);
      if (filters.date_from) query = query.gte('detected_at', filters.date_from);
      if (filters.date_to) query = query.lte('detected_at', filters.date_to);
    }

    return query;
  },

  async createJobChange(jobChange: Partial<ProspectJobChange>) {
    return supabase
      .from('prospect_job_changes')
      .insert(jobChange)
      .select()
      .single();
  },

  async markAlertSent(jobChangeId: string) {
    return supabase
      .from('prospect_job_changes')
      .update({
        alert_sent: true,
        alert_sent_at: new Date().toISOString()
      })
      .eq('id', jobChangeId);
  },

  async getPendingAlerts() {
    return supabase
      .from('prospect_job_changes')
      .select('*')
      .eq('alert_sent', false)
      .order('detected_at', { ascending: false });
  }
};

export const techStackService = {
  async getTechStack(filters?: TechStackFilters) {
    let query = supabase
      .from('company_tech_stack')
      .select('*')
      .order('first_detected_at', { ascending: false });

    if (filters) {
      if (filters.account_id) query = query.eq('account_id', filters.account_id);
      if (filters.tech_category?.length) query = query.in('tech_category', filters.tech_category);
      if (filters.technology_name) query = query.ilike('technology_name', `%${filters.technology_name}%`);
      if (filters.is_installed !== undefined) query = query.eq('is_installed', filters.is_installed);
      if (filters.min_confidence) query = query.gte('installation_confidence', filters.min_confidence);
    }

    return query;
  },

  async addTechnology(tech: Partial<CompanyTechStack>) {
    return supabase
      .from('company_tech_stack')
      .upsert(tech)
      .select()
      .single();
  },

  async getTechStackSummary(accountId: string): Promise<TechStackSummary> {
    const { data: techStack } = await supabase
      .from('company_tech_stack')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_installed', true);

    if (!techStack || techStack.length === 0) {
      return {
        total_technologies: 0,
        by_category: {} as any,
        recent_additions: [],
        top_vendors: []
      };
    }

    const categoryCount: Record<string, number> = {};
    const vendorCount: Record<string, number> = {};

    techStack.forEach(tech => {
      categoryCount[tech.tech_category] = (categoryCount[tech.tech_category] || 0) + 1;
      if (tech.vendor) {
        vendorCount[tech.vendor] = (vendorCount[tech.vendor] || 0) + 1;
      }
    });

    const topVendors = Object.entries(vendorCount)
      .map(([vendor, count]) => ({ vendor, tech_count: count }))
      .sort((a, b) => b.tech_count - a.tech_count)
      .slice(0, 5);

    const recentAdditions = [...techStack]
      .sort((a, b) => new Date(b.first_detected_at).getTime() - new Date(a.first_detected_at).getTime())
      .slice(0, 5);

    return {
      total_technologies: techStack.length,
      by_category: categoryCount as any,
      recent_additions: recentAdditions,
      top_vendors: topVendors
    };
  }
};

export const buyerIntentService = {
  async getBuyerIntent(filters?: BuyerIntentFilters) {
    let query = supabase
      .from('prospect_buyer_intent')
      .select('*')
      .order('composite_score', { ascending: false });

    if (filters) {
      if (filters.prospect_id) query = query.eq('prospect_id', filters.prospect_id);
      if (filters.min_composite_score) query = query.gte('composite_score', filters.min_composite_score);
      if (filters.max_composite_score) query = query.lte('composite_score', filters.max_composite_score);
      if (filters.trend_direction) query = query.eq('trend_direction', filters.trend_direction);
      if (filters.date_from) query = query.gte('last_calculated_at', filters.date_from);
      if (filters.date_to) query = query.lte('last_calculated_at', filters.date_to);
    }

    return query;
  },

  async calculateBuyerIntent(prospectId: string) {
    const { data, error } = await supabase.rpc('calculate_buyer_intent_score', {
      p_prospect_id: prospectId
    });

    if (error) throw error;
    return data;
  },

  async getBuyerIntentBreakdown(prospectId: string): Promise<BuyerIntentBreakdown | null> {
    const { data, error } = await supabase
      .from('prospect_buyer_intent')
      .select('*')
      .eq('prospect_id', prospectId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      composite_score: data.composite_score,
      components: {
        engagement: data.engagement_score || 0,
        fit: data.fit_score || 0,
        timing: data.timing_score || 0,
        authority: data.authority_score || 0
      },
      trend: data.trend_direction || 'stable',
      velocity: data.score_velocity || 0,
      score_history: data.score_history || []
    };
  }
};

export const fundingTriggerService = {
  async getFundingTriggers(filters?: FundingTriggerFilters) {
    let query = supabase
      .from('company_funding_triggers')
      .select('*')
      .order('announced_at', { ascending: false });

    if (filters) {
      if (filters.account_id) query = query.eq('account_id', filters.account_id);
      if (filters.trigger_type) query = query.eq('trigger_type', filters.trigger_type);
      if (filters.funding_stage?.length) query = query.in('funding_stage', filters.funding_stage);
      if (filters.min_amount) query = query.gte('funding_amount', filters.min_amount);
      if (filters.priority_level?.length) query = query.in('priority_level', filters.priority_level);
      if (filters.is_processed !== undefined) query = query.eq('is_processed', filters.is_processed);
      if (filters.date_from) query = query.gte('announced_at', filters.date_from);
      if (filters.date_to) query = query.lte('announced_at', filters.date_to);
    }

    return query;
  },

  async createFundingTrigger(trigger: Partial<CompanyFundingTrigger>) {
    return supabase
      .from('company_funding_triggers')
      .insert(trigger)
      .select()
      .single();
  },

  async markAsProcessed(triggerId: string) {
    return supabase
      .from('company_funding_triggers')
      .update({
        is_processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', triggerId);
  },

  async getFundingSummary(accountId?: string): Promise<FundingTriggerSummary> {
    let query = supabase
      .from('company_funding_triggers')
      .select('*');

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data: triggers } = await query;

    if (!triggers || triggers.length === 0) {
      return {
        total_triggers: 0,
        total_amount: 0,
        by_stage: {} as any,
        by_priority: {} as any,
        unprocessed_count: 0,
        recent_triggers: []
      };
    }

    const stageCount: Record<string, number> = {};
    const priorityCount: Record<string, number> = {};
    let totalAmount = 0;
    let unprocessedCount = 0;

    triggers.forEach(trigger => {
      if (trigger.funding_stage) {
        stageCount[trigger.funding_stage] = (stageCount[trigger.funding_stage] || 0) + 1;
      }
      priorityCount[trigger.priority_level] = (priorityCount[trigger.priority_level] || 0) + 1;
      if (trigger.funding_amount) {
        totalAmount += trigger.funding_amount;
      }
      if (!trigger.is_processed) {
        unprocessedCount++;
      }
    });

    const recentTriggers = [...triggers]
      .sort((a, b) => new Date(b.announced_at).getTime() - new Date(a.announced_at).getTime())
      .slice(0, 5);

    return {
      total_triggers: triggers.length,
      total_amount: totalAmount,
      by_stage: stageCount as any,
      by_priority: priorityCount as any,
      unprocessed_count: unprocessedCount,
      recent_triggers: recentTriggers
    };
  }
};

export const alertService = {
  async getAlerts(userId: string) {
    return supabase
      .from('data_intelligence_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  },

  async createAlert(alert: Partial<DataIntelligenceAlert>) {
    return supabase
      .from('data_intelligence_alerts')
      .insert(alert)
      .select()
      .single();
  },

  async updateAlert(alertId: string, updates: Partial<DataIntelligenceAlert>) {
    return supabase
      .from('data_intelligence_alerts')
      .update(updates)
      .eq('id', alertId)
      .select()
      .single();
  },

  async deleteAlert(alertId: string) {
    return supabase
      .from('data_intelligence_alerts')
      .delete()
      .eq('id', alertId);
  },

  async toggleAlert(alertId: string, enabled: boolean) {
    return supabase
      .from('data_intelligence_alerts')
      .update({ is_enabled: enabled })
      .eq('id', alertId);
  }
};

export const dataIntelligenceService = {
  intentSignals: intentSignalService,
  jobChanges: jobChangeService,
  techStack: techStackService,
  buyerIntent: buyerIntentService,
  fundingTriggers: fundingTriggerService,
  alerts: alertService
};

export default dataIntelligenceService;
