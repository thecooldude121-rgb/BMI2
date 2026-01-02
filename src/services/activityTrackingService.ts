import {
  Activity,
  ActivityType,
  EngagementMetrics,
  EngagementLevel,
  EngagementHeatmap,
  TimelineGroup,
  UpcomingActivity
} from '../types/activityTimeline';

export class ActivityTrackingService {
  private static instance: ActivityTrackingService;

  private constructor() {}

  static getInstance(): ActivityTrackingService {
    if (!ActivityTrackingService.instance) {
      ActivityTrackingService.instance = new ActivityTrackingService();
    }
    return ActivityTrackingService.instance;
  }

  async logActivity(prospectId: string, activity: Partial<Activity>): Promise<Activity> {
    const newActivity: Activity = {
      id: `activity-${Date.now()}`,
      prospectId,
      type: activity.type!,
      title: activity.title!,
      description: activity.description,
      details: activity.details,
      performedBy: 'current-user-id',
      performedByName: 'Current User',
      timestamp: new Date().toISOString(),
      metadata: activity.metadata
    };

    // In production, save to Supabase
    return newActivity;
  }

  async getActivities(prospectId: string): Promise<Activity[]> {
    // Mock data - in production, fetch from Supabase
    return this.generateMockActivities(prospectId);
  }

  groupActivitiesByDate(activities: Activity[]): TimelineGroup[] {
    const grouped = new Map<string, Activity[]>();

    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(activity);
    });

    const groups: TimelineGroup[] = [];
    grouped.forEach((activities, date) => {
      groups.push({
        date,
        displayDate: this.formatGroupDate(date),
        activities: activities.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      });
    });

    return groups.sort((a, b) => b.date.localeCompare(a.date));
  }

  calculateEngagementMetrics(activities: Activity[]): EngagementMetrics {
    const now = Date.now();
    const lastActivity = activities.length > 0 ?
      new Date(activities[0].timestamp).getTime() : now;
    const daysSinceLastActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

    const emailsSent = activities.filter(a => a.type === 'email_sent').length;
    const emailsOpened = activities.filter(a => a.type === 'email_opened').length;
    const emailsClicked = activities.filter(a => a.type === 'email_clicked').length;
    const emailsReplied = activities.filter(a => a.type === 'email_replied').length;

    const emailEngagementRate = emailsSent > 0 ?
      ((emailsOpened + emailsClicked + emailsReplied) / emailsSent) * 100 : 0;
    const responseRate = emailsSent > 0 ? (emailsReplied / emailsSent) * 100 : 0;

    const weeklyActivities = activities.filter(a => {
      const activityDate = new Date(a.timestamp).getTime();
      return now - activityDate < 7 * 24 * 60 * 60 * 1000;
    }).length;

    const monthlyActivities = activities.filter(a => {
      const activityDate = new Date(a.timestamp).getTime();
      return now - activityDate < 30 * 24 * 60 * 60 * 1000;
    }).length;

    let engagementLevel: EngagementLevel = 'cold';
    if (daysSinceLastActivity < 3 && emailEngagementRate > 50) {
      engagementLevel = 'hot';
    } else if (daysSinceLastActivity < 7 && emailEngagementRate > 25) {
      engagementLevel = 'warm';
    }

    let activityTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (weeklyActivities > monthlyActivities / 4) {
      activityTrend = 'increasing';
    } else if (weeklyActivities < monthlyActivities / 6) {
      activityTrend = 'decreasing';
    }

    return {
      prospectId: activities[0]?.prospectId || '',
      engagementLevel,
      totalActivities: activities.length,
      lastActivityDate: activities[0]?.timestamp || '',
      daysSinceLastActivity,
      emailsSent,
      emailsOpened,
      emailsClicked,
      emailsReplied,
      callsMade: activities.filter(a => a.type === 'call_made').length,
      meetingsHeld: activities.filter(a => a.type === 'meeting_completed').length,
      websiteVisits: activities.filter(a => a.type === 'website_visit').length,
      documentsViewed: activities.filter(a => a.type === 'document_viewed').length,
      emailEngagementRate,
      responseRate,
      averageResponseTime: 48,
      activityTrend,
      weeklyActivityCount: weeklyActivities,
      monthlyActivityCount: monthlyActivities
    };
  }

  generateEngagementHeatmap(activities: Activity[]): EngagementHeatmap[] {
    const heatmap: EngagementHeatmap[] = [];
    const activityCountByDate = new Map<string, number>();

    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      activityCountByDate.set(date, (activityCountByDate.get(date) || 0) + 1);
    });

    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = activityCountByDate.get(dateStr) || 0;

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count >= 10) level = 4;
      else if (count >= 7) level = 3;
      else if (count >= 4) level = 2;
      else if (count >= 1) level = 1;

      heatmap.push({
        date: dateStr,
        activityCount: count,
        level
      });
    }

    return heatmap;
  }

  async getUpcomingActivities(prospectId?: string): Promise<UpcomingActivity[]> {
    // Mock data - in production, fetch from Supabase
    const now = new Date();
    const upcoming: UpcomingActivity[] = [
      {
        id: '1',
        prospectId: prospectId || 'prospect-1',
        prospectName: 'John Doe',
        type: 'call_made',
        title: 'Follow-up Call',
        description: 'Discuss product demo feedback',
        scheduledFor: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        isOverdue: false,
        dueIn: 'in 2 hours',
        assignedTo: 'current-user',
        status: 'pending'
      },
      {
        id: '2',
        prospectId: prospectId || 'prospect-2',
        prospectName: 'Jane Smith',
        type: 'meeting_scheduled',
        title: 'Demo Meeting',
        description: 'Product demonstration',
        scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        isOverdue: false,
        dueIn: 'tomorrow',
        assignedTo: 'current-user',
        status: 'pending'
      },
      {
        id: '3',
        prospectId: prospectId || 'prospect-3',
        prospectName: 'Bob Johnson',
        type: 'email_sent',
        title: 'Send Proposal',
        scheduledFor: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        isOverdue: true,
        dueIn: '2 hours ago',
        assignedTo: 'current-user',
        status: 'pending'
      }
    ];

    return upcoming;
  }

  private formatGroupDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  private generateMockActivities(prospectId: string): Activity[] {
    const activities: Activity[] = [];
    const types: ActivityType[] = [
      'email_sent', 'email_opened', 'email_clicked', 'call_made',
      'meeting_completed', 'note_added', 'website_visit'
    ];

    for (let i = 0; i < 20; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      activities.push({
        id: `activity-${i}`,
        prospectId,
        type,
        title: this.getActivityTitle(type),
        description: this.getActivityDescription(type),
        details: this.getActivityDetails(type),
        performedBy: 'user-1',
        performedByName: 'Sarah Johnson',
        timestamp: date.toISOString()
      });
    }

    return activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private getActivityTitle(type: ActivityType): string {
    const titles: Record<string, string> = {
      email_sent: 'Sent email: Product Introduction',
      email_opened: 'Opened email: Product Introduction',
      email_clicked: 'Clicked link in email',
      call_made: 'Called prospect',
      meeting_completed: 'Completed demo meeting',
      note_added: 'Added note',
      website_visit: 'Visited pricing page'
    };
    return titles[type] || 'Activity';
  }

  private getActivityDescription(type: ActivityType): string {
    const descriptions: Record<string, string> = {
      email_sent: 'Sent initial outreach email introducing our solution',
      email_opened: 'Prospect opened the email after 2 hours',
      call_made: 'Discussed pain points and current solutions',
      meeting_completed: 'Demonstrated key features, very positive response'
    };
    return descriptions[type] || '';
  }

  private getActivityDetails(type: ActivityType): any {
    if (type === 'email_sent' || type === 'email_opened') {
      return {
        emailSubject: 'Introduction to Our Solution',
        openCount: 3,
        clickCount: 1
      };
    }
    if (type === 'call_made') {
      return {
        callDuration: 1800,
        callOutcome: 'connected',
        callNotes: 'Great conversation, interested in features'
      };
    }
    return {};
  }
}

export const activityTrackingService = ActivityTrackingService.getInstance();
