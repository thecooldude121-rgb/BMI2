import { Lead } from '../types/lead';

export interface ScoreFactor {
  name: string;
  points: number;
  maxPoints: number;
  description: string;
  category: 'engagement' | 'demographics' | 'firmographics' | 'behavior' | 'timing';
}

export interface LeadScoreBreakdown {
  totalScore: number;
  factors: ScoreFactor[];
  recommendations: string[];
  nextBestActions: string[];
}

export class LeadScoringEngine {
  static calculateDetailedScore(lead: Lead): LeadScoreBreakdown {
    const factors: ScoreFactor[] = [];
    let totalScore = 0;

    const emailEngagement = this.scoreEmailEngagement(lead);
    factors.push(emailEngagement);
    totalScore += emailEngagement.points;

    const activityRecency = this.scoreActivityRecency(lead);
    factors.push(activityRecency);
    totalScore += activityRecency.points;

    const companySize = this.scoreCompanySize(lead);
    factors.push(companySize);
    totalScore += companySize.points;

    const jobTitle = this.scoreJobTitle(lead);
    factors.push(jobTitle);
    totalScore += jobTitle.points;

    const engagementDepth = this.scoreEngagementDepth(lead);
    factors.push(engagementDepth);
    totalScore += engagementDepth.points;

    const dataCompleteness = this.scoreDataCompleteness(lead);
    factors.push(dataCompleteness);
    totalScore += dataCompleteness.points;

    const demographics = this.scoreDemographics(lead);
    factors.push(demographics);
    totalScore += demographics.points;

    totalScore = Math.min(100, Math.max(0, totalScore));

    const recommendations = this.generateRecommendations(lead, totalScore, factors);
    const nextBestActions = this.getNextBestActions(lead, factors);

    return {
      totalScore,
      factors,
      recommendations,
      nextBestActions
    };
  }

  private static scoreEmailEngagement(lead: Lead): ScoreFactor {
    let points = 0;
    const maxPoints = 20;

    if (lead.email_opens_count > 0) {
      points += Math.min(lead.email_opens_count * 2, 10);
    }

    if (lead.email_clicks_count > 0) {
      points += Math.min(lead.email_clicks_count * 5, 10);
    }

    return {
      name: 'Email Engagement',
      points: Math.min(points, maxPoints),
      maxPoints,
      description: `${lead.email_opens_count} opens, ${lead.email_clicks_count} clicks`,
      category: 'engagement'
    };
  }

  private static scoreActivityRecency(lead: Lead): ScoreFactor {
    let points = 0;
    const maxPoints = 15;

    if (lead.last_activity_date) {
      const daysSince = Math.floor((Date.now() - new Date(lead.last_activity_date).getTime()) / (1000 * 60 * 60 * 24));

      if (daysSince <= 1) points = 15;
      else if (daysSince <= 3) points = 12;
      else if (daysSince <= 7) points = 10;
      else if (daysSince <= 14) points = 7;
      else if (daysSince <= 30) points = 5;
      else if (daysSince <= 60) points = 2;
    }

    return {
      name: 'Activity Recency',
      points,
      maxPoints,
      description: lead.last_activity_date
        ? `Last activity: ${this.formatTimeAgo(lead.last_activity_date)}`
        : 'No recent activity',
      category: 'timing'
    };
  }

  private static scoreCompanySize(lead: Lead): ScoreFactor {
    let points = 0;
    const maxPoints = 15;

    const sizeMap: Record<string, number> = {
      '1000+': 15,
      '501-1000': 13,
      '201-500': 11,
      '51-200': 9,
      '11-50': 6,
      '1-10': 3
    };

    if (lead.company_size && sizeMap[lead.company_size]) {
      points = sizeMap[lead.company_size];
    }

    return {
      name: 'Company Size',
      points,
      maxPoints,
      description: lead.company_size || 'Unknown',
      category: 'firmographics'
    };
  }

  private static scoreJobTitle(lead: Lead): ScoreFactor {
    let points = 0;
    const maxPoints = 20;

    if (!lead.position) {
      return {
        name: 'Job Title',
        points: 0,
        maxPoints,
        description: 'Not provided',
        category: 'demographics'
      };
    }

    const title = lead.position.toLowerCase();

    if (/\b(ceo|chief executive|founder|president|owner)\b/i.test(title)) {
      points = 20;
    } else if (/\b(cto|cfo|coo|cmo|chief|vp|vice president)\b/i.test(title)) {
      points = 18;
    } else if (/\b(director|head of)\b/i.test(title)) {
      points = 15;
    } else if (/\b(manager|lead|senior)\b/i.test(title)) {
      points = 12;
    } else if (/\b(coordinator|specialist|analyst)\b/i.test(title)) {
      points = 8;
    } else {
      points = 5;
    }

    return {
      name: 'Job Title',
      points,
      maxPoints,
      description: lead.position,
      category: 'demographics'
    };
  }

  private static scoreEngagementDepth(lead: Lead): ScoreFactor {
    let points = 0;
    const maxPoints = 15;

    if (lead.meeting_count > 0) points += Math.min(lead.meeting_count * 5, 8);
    if (lead.call_count > 0) points += Math.min(lead.call_count * 3, 5);
    if (lead.page_views_count > 3) points += 2;

    return {
      name: 'Engagement Depth',
      points: Math.min(points, maxPoints),
      maxPoints,
      description: `${lead.meeting_count} meetings, ${lead.call_count} calls, ${lead.page_views_count} page views`,
      category: 'behavior'
    };
  }

  private static scoreDataCompleteness(lead: Lead): ScoreFactor {
    let points = 0;
    const maxPoints = 10;
    let completedFields = 0;
    const totalFields = 8;

    if (lead.email) completedFields++;
    if (lead.phone) completedFields++;
    if (lead.company) completedFields++;
    if (lead.position) completedFields++;
    if (lead.industry) completedFields++;
    if (lead.company_size) completedFields++;
    if (lead.website) completedFields++;
    if (lead.linkedin_url) completedFields++;

    points = Math.round((completedFields / totalFields) * maxPoints);

    return {
      name: 'Data Completeness',
      points,
      maxPoints,
      description: `${completedFields}/${totalFields} fields completed`,
      category: 'demographics'
    };
  }

  private static scoreDemographics(lead: Lead): ScoreFactor {
    let points = 0;
    const maxPoints = 5;

    if (lead.email && !this.isPersonalEmail(lead.email)) {
      points += 2;
    }

    if (lead.country && ['United States', 'Canada', 'United Kingdom'].includes(lead.country)) {
      points += 1;
    }

    if (lead.industry && ['Technology', 'Finance', 'Healthcare', 'Manufacturing'].includes(lead.industry)) {
      points += 2;
    }

    return {
      name: 'Demographics',
      points: Math.min(points, maxPoints),
      maxPoints,
      description: 'Location and industry alignment',
      category: 'demographics'
    };
  }

  private static isPersonalEmail(email: string): boolean {
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return personalDomains.includes(domain);
  }

  private static generateRecommendations(lead: Lead, totalScore: number, factors: ScoreFactor[]): string[] {
    const recommendations: string[] = [];

    if (totalScore >= 80) {
      recommendations.push('🔥 Hot lead! Schedule a call immediately');
      recommendations.push('Consider fast-tracking to qualified stage');
    } else if (totalScore >= 60) {
      recommendations.push('Warm lead - continue nurturing with value content');
      recommendations.push('Schedule a discovery call this week');
    } else if (totalScore >= 40) {
      recommendations.push('Enroll in email nurture sequence');
      recommendations.push('Research company and personalize outreach');
    } else {
      recommendations.push('Needs more qualification data');
      recommendations.push('Consider re-engaging with targeted content');
    }

    const emailFactor = factors.find(f => f.name === 'Email Engagement');
    if (emailFactor && emailFactor.points < 5) {
      recommendations.push('Low email engagement - try different messaging');
    }

    const activityFactor = factors.find(f => f.name === 'Activity Recency');
    if (activityFactor && activityFactor.points === 0) {
      recommendations.push('No recent activity - this lead may be cold');
    }

    const dataFactor = factors.find(f => f.name === 'Data Completeness');
    if (dataFactor && dataFactor.points < 5) {
      recommendations.push('Incomplete data - enrich lead information');
    }

    return recommendations;
  }

  private static getNextBestActions(lead: Lead, factors: ScoreFactor[]): string[] {
    const actions: string[] = [];

    if (lead.email_opens_count > 2 && lead.email_clicks_count > 0 && lead.meeting_count === 0) {
      actions.push('Schedule demo or discovery call');
    }

    if (lead.meeting_count > 0 && !lead.is_qualified) {
      actions.push('Qualify lead based on BANT criteria');
    }

    if (lead.last_activity_date) {
      const daysSince = Math.floor((Date.now() - new Date(lead.last_activity_date).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 14) {
        actions.push('Re-engage with personalized email');
      }
    }

    if (!lead.linkedin_url) {
      actions.push('Research and connect on LinkedIn');
    }

    if (lead.email_opens_count === 0 && lead.email_sent_count > 0) {
      actions.push('Try different email subject lines');
    }

    if (actions.length === 0) {
      actions.push('Send personalized introduction email');
      actions.push('Research company and decision makers');
    }

    return actions.slice(0, 3);
  }

  private static formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} year${interval > 1 ? 's' : ''} ago`;

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval > 1 ? 's' : ''} ago`;

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval > 1 ? 's' : ''} ago`;

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval > 1 ? 's' : ''} ago`;

    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval > 1 ? 's' : ''} ago`;

    return 'Just now';
  }

  static getTemperature(score: number): 'hot' | 'warm' | 'cold' | 'frozen' {
    if (score >= 80) return 'hot';
    if (score >= 60) return 'warm';
    if (score >= 40) return 'cold';
    return 'frozen';
  }

  static getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  static shouldAutoQualify(lead: Lead, score: number): boolean {
    return score >= 75 &&
           lead.meeting_count > 0 &&
           lead.email_clicks_count > 2 &&
           !!lead.company &&
           !!lead.position;
  }

  static getPriority(score: number, temperature: string): 'urgent' | 'high' | 'medium' | 'low' {
    if (score >= 85 && temperature === 'hot') return 'urgent';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  static getFollowUpTiming(lead: Lead, score: number): string {
    const lastActivityDays = lead.last_activity_date
      ? Math.floor((Date.now() - new Date(lead.last_activity_date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (score >= 80) {
      return 'Within 24 hours';
    } else if (score >= 60) {
      if (lastActivityDays > 7) return 'Within 2-3 days';
      return 'Within 3-5 days';
    } else if (score >= 40) {
      return 'Within 1-2 weeks';
    } else {
      return 'Monthly check-in';
    }
  }
}

export class LeadEnrichmentEngine {
  static async enrichFromEmail(email: string): Promise<any> {
    const domain = email.split('@')[1];

    return {
      person: {
        email,
        verified: true,
        deliverable: 'valid'
      },
      company: {
        domain,
        name: this.extractCompanyName(domain),
        estimated_size: '50-200'
      },
      confidence: 0.85
    };
  }

  static async enrichFromDomain(domain: string): Promise<any> {
    return {
      company: {
        domain,
        name: this.extractCompanyName(domain),
        industry: 'Technology',
        employee_count: 150,
        annual_revenue: 10000000,
        location: {
          city: 'San Francisco',
          state: 'CA',
          country: 'United States'
        }
      },
      confidence: 0.80
    };
  }

  static async enrichFromLinkedIn(linkedinUrl: string): Promise<any> {
    return {
      person: {
        full_name: 'John Doe',
        position: 'VP of Sales',
        seniority: 'VP',
        department: 'Sales',
        linkedin_url: linkedinUrl,
        skills: ['Sales', 'Business Development', 'SaaS']
      },
      confidence: 0.90
    };
  }

  private static extractCompanyName(domain: string): string {
    const name = domain.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  static async detectIntent(lead: Lead): Promise<{
    hasIntent: boolean;
    signals: string[];
    confidence: number;
  }> {
    const signals: string[] = [];
    let confidence = 0;

    if (lead.page_views_count > 5) {
      signals.push('High page view count');
      confidence += 0.2;
    }

    if (lead.email_clicks_count > 3) {
      signals.push('Multiple email clicks');
      confidence += 0.25;
    }

    if (lead.meeting_count > 0) {
      signals.push('Attended meetings');
      confidence += 0.3;
    }

    if (lead.last_activity_date) {
      const daysSince = Math.floor((Date.now() - new Date(lead.last_activity_date).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince <= 3) {
        signals.push('Recent engagement');
        confidence += 0.25;
      }
    }

    return {
      hasIntent: confidence >= 0.5,
      signals,
      confidence: Math.min(confidence, 1)
    };
  }

  static getBuyingSignals(lead: Lead): string[] {
    const signals: string[] = [];

    if (lead.email_clicks_count > 2) {
      signals.push('Clicked pricing page');
    }

    if (lead.page_views_count > 5) {
      signals.push('Visited website multiple times');
    }

    if (lead.meeting_count > 0) {
      signals.push('Attended product demo');
    }

    if (lead.call_count > 1) {
      signals.push('Multiple conversations');
    }

    return signals;
  }
}
