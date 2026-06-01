import { DisqualificationData } from '../components/LeadQualification/DisqualifyLeadModal';
import {
  DisqualificationRecord,
  calculateReEngagementDate,
  getReasonById,
  getCompetitorById
} from '../utils/disqualificationMockData';

export interface DisqualifyLeadParams {
  leadId: string;
  data: DisqualificationData;
  userId: string;
}

export interface ReEngagementTask {
  id: string;
  leadId: string;
  scheduledDate: string;
  type: 'calendar' | 'campaign' | 'monitor';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface DisqualificationNotification {
  id: string;
  leadId: string;
  recipient: string;
  type: 'email' | 'slack';
  status: 'sent' | 'pending' | 'failed';
  sentAt?: string;
}

export class DisqualificationService {
  static async disqualifyLead(params: DisqualifyLeadParams): Promise<DisqualificationRecord> {
    const { leadId, data, userId } = params;

    const reEngagementDate = calculateReEngagementDate(data.reEngagementPeriod);

    const record: DisqualificationRecord = {
      leadId,
      reason: data.reason,
      reasonCategory: this.getCategoryForReason(data.reason),
      additionalDetails: data.additionalDetails || '',
      competitor: data.competitor || null,
      reEngagement: data.reEngagementPeriod,
      reEngagementDate,
      reEngagementActions: {
        calendarReminder: data.createCalendarReminder,
        addToCampaign: data.addToReEngagementCampaign,
        monitorTriggers: data.monitorTriggerEvents
      },
      notifications: {
        notifyOwner: data.notifyOwner,
        ccManager: data.ccSalesManager,
        slackChannel: data.notifySlack
      },
      disqualifiedBy: userId,
      disqualifiedAt: new Date().toISOString()
    };

    await this.updateLeadStatus(leadId, 'disqualified');

    await this.saveDisqualificationRecord(record);

    if (data.reEngagementPeriod !== 'never') {
      await this.scheduleReEngagement(leadId, data, reEngagementDate);
    }

    await this.sendNotifications(leadId, data, record);

    await this.pauseSequences(leadId);

    await this.addToHistory(leadId, record);

    return record;
  }

  private static getCategoryForReason(reason: string): string {
    const categoryMapping: { [key: string]: string } = {
      'No budget available': 'budgetIssues',
      'Budget too small for our solution': 'budgetIssues',
      'Budget allocated to competitor': 'budgetIssues',
      'Budget frozen/on hold': 'budgetIssues',
      'Not the decision maker': 'authorityIssues',
      'Cannot reach decision maker': 'authorityIssues',
      'Stakeholder turnover': 'authorityIssues',
      'No immediate business need': 'needFitIssues',
      'Poor fit for our product/service': 'needFitIssues',
      'Outside our target market': 'needFitIssues',
      'Already using competitor (satisfied)': 'needFitIssues',
      'Timeline is too long (>6 months)': 'timelineIssues',
      'No defined timeline': 'timelineIssues',
      'Project postponed indefinitely': 'timelineIssues',
      'Lost deal to competitor': 'competition',
      'Competitor already selected': 'competition',
      'Cannot compete on price': 'competition',
      'No response to outreach (3+ attempts)': 'leadUnresponsive',
      'Contact left the company': 'leadUnresponsive',
      'Contact bounced/invalid': 'leadUnresponsive',
      'Company went out of business': 'companyIssues',
      'Company acquired/merged': 'companyIssues',
      'Hiring freeze': 'companyIssues',
      'Other (specify below)': 'other'
    };

    return categoryMapping[reason] || 'other';
  }

  private static async updateLeadStatus(leadId: string, status: string): Promise<void> {
    console.log(`[DisqualificationService] Updating lead ${leadId} to status: ${status}`);

    // In production, this would update Supabase:
    // await supabase
    //   .from('leads')
    //   .update({ status, updated_at: new Date().toISOString() })
    //   .eq('id', leadId);
  }

  private static async saveDisqualificationRecord(record: DisqualificationRecord): Promise<void> {
    console.log('[DisqualificationService] Saving disqualification record:', record);

    // In production, this would save to Supabase:
    // await supabase
    //   .from('disqualifications')
    //   .insert(record);
  }

  private static async scheduleReEngagement(
    leadId: string,
    data: DisqualificationData,
    reEngagementDate: string
  ): Promise<void> {
    console.log(`[DisqualificationService] Scheduling re-engagement for ${leadId} on ${reEngagementDate}`);

    const tasks: Partial<ReEngagementTask>[] = [];

    if (data.createCalendarReminder) {
      tasks.push({
        leadId,
        scheduledDate: reEngagementDate,
        type: 'calendar',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }

    if (data.addToReEngagementCampaign) {
      tasks.push({
        leadId,
        scheduledDate: reEngagementDate,
        type: 'campaign',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }

    if (data.monitorTriggerEvents) {
      tasks.push({
        leadId,
        scheduledDate: reEngagementDate,
        type: 'monitor',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }

    // In production, save to Supabase:
    // await supabase
    //   .from('re_engagement_tasks')
    //   .insert(tasks);

    console.log('[DisqualificationService] Created re-engagement tasks:', tasks);
  }

  private static async sendNotifications(
    leadId: string,
    data: DisqualificationData,
    record: DisqualificationRecord
  ): Promise<void> {
    console.log('[DisqualificationService] Sending notifications for', leadId);

    const notifications: Partial<DisqualificationNotification>[] = [];

    if (data.notifyOwner) {
      notifications.push({
        leadId,
        recipient: 'owner',
        type: 'email',
        status: 'pending'
      });
    }

    if (data.ccSalesManager) {
      notifications.push({
        leadId,
        recipient: 'sales_manager',
        type: 'email',
        status: 'pending'
      });
    }

    if (data.notifySlack) {
      notifications.push({
        leadId,
        recipient: '#sales',
        type: 'slack',
        status: 'pending'
      });
    }

    // In production, save to Supabase and send:
    // await supabase
    //   .from('notifications')
    //   .insert(notifications);
    //
    // await this.sendEmailNotifications(notifications.filter(n => n.type === 'email'));
    // await this.sendSlackNotifications(notifications.filter(n => n.type === 'slack'));

    console.log('[DisqualificationService] Queued notifications:', notifications);
  }

  private static async pauseSequences(leadId: string): Promise<void> {
    console.log(`[DisqualificationService] Pausing all sequences for lead ${leadId}`);

    // In production:
    // await supabase
    //   .from('sequence_enrollments')
    //   .update({ status: 'paused', paused_at: new Date().toISOString() })
    //   .eq('lead_id', leadId)
    //   .eq('status', 'active');
  }

  private static async addToHistory(leadId: string, record: DisqualificationRecord): Promise<void> {
    console.log(`[DisqualificationService] Adding disqualification to history for lead ${leadId}`);

    const historyEntry = {
      leadId,
      action: 'disqualified',
      details: {
        reason: record.reason,
        additionalDetails: record.additionalDetails,
        competitor: record.competitor,
        reEngagement: record.reEngagement
      },
      performedBy: record.disqualifiedBy,
      timestamp: record.disqualifiedAt
    };

    // In production:
    // await supabase
    //   .from('lead_history')
    //   .insert(historyEntry);

    console.log('[DisqualificationService] History entry created:', historyEntry);
  }

  static async requalifyLead(leadId: string, userId: string, reason: string): Promise<void> {
    console.log(`[DisqualificationService] Re-qualifying lead ${leadId}`);

    await this.updateLeadStatus(leadId, 'new');

    await this.cancelReEngagementTasks(leadId);

    await this.addToHistory(leadId, {
      leadId,
      reason: 'Re-qualified',
      reasonCategory: 'other',
      additionalDetails: reason,
      competitor: null,
      reEngagement: 'never',
      reEngagementDate: '',
      reEngagementActions: {
        calendarReminder: false,
        addToCampaign: false,
        monitorTriggers: false
      },
      notifications: {
        notifyOwner: false,
        ccManager: false,
        slackChannel: false
      },
      disqualifiedBy: userId,
      disqualifiedAt: new Date().toISOString()
    });
  }

  private static async cancelReEngagementTasks(leadId: string): Promise<void> {
    console.log(`[DisqualificationService] Cancelling re-engagement tasks for lead ${leadId}`);

    // In production:
    // await supabase
    //   .from('re_engagement_tasks')
    //   .update({ status: 'cancelled' })
    //   .eq('lead_id', leadId)
    //   .eq('status', 'pending');
  }

  static async getDisqualificationHistory(leadId: string): Promise<DisqualificationRecord[]> {
    console.log(`[DisqualificationService] Fetching disqualification history for lead ${leadId}`);

    // In production:
    // const { data, error } = await supabase
    //   .from('disqualifications')
    //   .select('*')
    //   .eq('lead_id', leadId)
    //   .order('disqualified_at', { ascending: false });
    //
    // if (error) throw error;
    // return data;

    return [];
  }

  static async getPendingReEngagements(date?: string): Promise<ReEngagementTask[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    console.log(`[DisqualificationService] Fetching pending re-engagements for ${targetDate}`);

    // In production:
    // const { data, error } = await supabase
    //   .from('re_engagement_tasks')
    //   .select('*')
    //   .eq('status', 'pending')
    //   .lte('scheduled_date', targetDate);
    //
    // if (error) throw error;
    // return data;

    return [];
  }

  static async getDisqualificationStats(startDate?: string, endDate?: string) {
    console.log('[DisqualificationService] Fetching disqualification stats');

    // In production:
    // const { data, error } = await supabase
    //   .from('disqualifications')
    //   .select('*')
    //   .gte('disqualified_at', startDate || '2020-01-01')
    //   .lte('disqualified_at', endDate || '2030-12-31');
    //
    // if (error) throw error;
    //
    // Process data to generate stats...

    return {
      total: 0,
      byCategory: {},
      byReason: {},
      byCompetitor: {},
      byReEngagement: {},
      averageReEngagementDays: 0
    };
  }
}

export const simulateDisqualification = async (
  leadId: string,
  data: DisqualificationData
): Promise<DisqualificationRecord> => {
  console.log('=== DISQUALIFICATION SIMULATION ===');
  console.log('Lead ID:', leadId);
  console.log('Data:', JSON.stringify(data, null, 2));

  const result = await DisqualificationService.disqualifyLead({
    leadId,
    data,
    userId: 'demo_user_001'
  });

  console.log('=== DISQUALIFICATION COMPLETE ===');
  console.log('Record:', JSON.stringify(result, null, 2));

  return result;
};

export default DisqualificationService;
