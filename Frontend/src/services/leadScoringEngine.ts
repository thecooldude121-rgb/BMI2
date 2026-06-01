import {
  LeadScoreBreakdown,
  ScoreComponent,
  ScoringRule,
  AIScoreInsight,
  PriorityProspect,
  ScoreTrendPoint,
  PRIORITY_LEVELS
} from '../types/leadScoring';

export class LeadScoringEngine {
  private static instance: LeadScoringEngine;
  private scoringRules: ScoringRule[] = [];

  private constructor() {
    this.loadDefaultRules();
  }

  static getInstance(): LeadScoringEngine {
    if (!LeadScoringEngine.instance) {
      LeadScoringEngine.instance = new LeadScoringEngine();
    }
    return LeadScoringEngine.instance;
  }

  private loadDefaultRules() {
    this.scoringRules = [
      {
        id: '1',
        name: 'Large Company Bonus',
        description: 'Add points for companies with 500+ employees',
        enabled: true,
        priority: 1,
        category: 'fit',
        conditions: [
          {
            field: 'company_size',
            operator: 'greater_than',
            value: 500
          }
        ],
        action: {
          type: 'add',
          points: 10,
          component: 'fit'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        id: '2',
        name: 'High Engagement Bonus',
        description: 'Reward prospects with multiple email opens',
        enabled: true,
        priority: 2,
        category: 'engagement',
        conditions: [
          {
            field: 'email_opens',
            operator: 'greater_than',
            value: 3
          }
        ],
        action: {
          type: 'add',
          points: 5,
          component: 'engagement'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      },
      {
        id: '3',
        name: 'Demo Request Intent',
        description: 'High intent signal from demo request',
        enabled: true,
        priority: 1,
        category: 'intent',
        conditions: [
          {
            field: 'demo_requests',
            operator: 'greater_than',
            value: 0
          }
        ],
        action: {
          type: 'add',
          points: 15,
          component: 'intent'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      }
    ];
  }

  calculateEngagementScore(prospect: any): ScoreComponent {
    const emailOpens = prospect.emailOpens || 0;
    const emailClicks = prospect.emailClicks || 0;
    const emailReplies = prospect.emailReplies || 0;
    const websiteVisits = prospect.websiteVisits || 0;

    const factors = [
      {
        label: 'Email Opens',
        value: Math.min(emailOpens * 2, 8),
        weight: 0.3,
        description: `${emailOpens} email opens`
      },
      {
        label: 'Email Clicks',
        value: Math.min(emailClicks * 3, 9),
        weight: 0.3,
        description: `${emailClicks} link clicks`
      },
      {
        label: 'Email Replies',
        value: Math.min(emailReplies * 5, 8),
        weight: 0.25,
        description: `${emailReplies} replies received`
      },
      {
        label: 'Website Visits',
        value: Math.min(websiteVisits * 1.5, 5),
        weight: 0.15,
        description: `${websiteVisits} site visits`
      }
    ];

    const value = Math.round(factors.reduce((sum, f) => sum + f.value, 0));
    const maxValue = 30;

    return {
      name: 'Engagement',
      value: Math.min(value, maxValue),
      maxValue,
      percentage: Math.round((value / maxValue) * 100),
      factors
    };
  }

  calculateFitScore(prospect: any): ScoreComponent {
    const companySize = prospect.companySize || 0;
    const industry = prospect.industry || '';
    const seniorityLevel = prospect.seniorityLevel || '';
    const budgetIndicator = prospect.budgetIndicator || 0;

    const factors = [
      {
        label: 'Company Size Match',
        value: this.getCompanySizeScore(companySize),
        weight: 0.35,
        description: `${companySize} employees`
      },
      {
        label: 'Industry Match',
        value: this.getIndustryScore(industry),
        weight: 0.25,
        description: `${industry || 'Unknown'} industry`
      },
      {
        label: 'Seniority Level',
        value: this.getSeniorityScore(seniorityLevel),
        weight: 0.25,
        description: `${seniorityLevel || 'Unknown'} level`
      },
      {
        label: 'Budget Indicators',
        value: Math.min(budgetIndicator * 2, 6),
        weight: 0.15,
        description: `Budget score: ${budgetIndicator}`
      }
    ];

    const value = Math.round(factors.reduce((sum, f) => sum + f.value, 0));
    const maxValue = 40;

    return {
      name: 'Fit',
      value: Math.min(value, maxValue),
      maxValue,
      percentage: Math.round((value / maxValue) * 100),
      factors
    };
  }

  calculateIntentScore(prospect: any): ScoreComponent {
    const contentDownloads = prospect.contentDownloads || 0;
    const demoRequests = prospect.demoRequests || 0;
    const pricingViews = prospect.pricingViews || 0;
    const repeatedVisits = prospect.repeatedVisits || 0;

    const factors = [
      {
        label: 'Content Downloads',
        value: Math.min(contentDownloads * 3, 6),
        weight: 0.2,
        description: `${contentDownloads} downloads`
      },
      {
        label: 'Demo Requests',
        value: Math.min(demoRequests * 10, 10),
        weight: 0.4,
        description: `${demoRequests} demo requests`
      },
      {
        label: 'Pricing Page Views',
        value: Math.min(pricingViews * 4, 8),
        weight: 0.25,
        description: `${pricingViews} pricing views`
      },
      {
        label: 'Repeated Visits',
        value: Math.min(repeatedVisits * 1.5, 6),
        weight: 0.15,
        description: `${repeatedVisits} return visits`
      }
    ];

    const value = Math.round(factors.reduce((sum, f) => sum + f.value, 0));
    const maxValue = 30;

    return {
      name: 'Intent',
      value: Math.min(value, maxValue),
      maxValue,
      percentage: Math.round((value / maxValue) * 100),
      factors
    };
  }

  calculateLeadScore(prospect: any): LeadScoreBreakdown {
    const engagementScore = this.calculateEngagementScore(prospect);
    const fitScore = this.calculateFitScore(prospect);
    const intentScore = this.calculateIntentScore(prospect);

    const totalScore = engagementScore.value + fitScore.value + intentScore.value;
    const previousScore = prospect.previousScore || totalScore;
    const changeAmount = totalScore - previousScore;

    return {
      totalScore,
      engagementScore,
      fitScore,
      intentScore,
      lastUpdated: new Date().toISOString(),
      trend: changeAmount > 0 ? 'up' : changeAmount < 0 ? 'down' : 'stable',
      changeAmount
    };
  }

  generateAIInsights(prospect: any, scoreBreakdown: LeadScoreBreakdown): AIScoreInsight {
    const explanation: string[] = [];
    const confidence = this.calculateConfidence(scoreBreakdown);

    if (scoreBreakdown.engagementScore.value > 20) {
      explanation.push('High engagement with email campaigns and content');
    }
    if (scoreBreakdown.fitScore.value > 30) {
      explanation.push('Strong fit with ideal customer profile');
    }
    if (scoreBreakdown.intentScore.value > 20) {
      explanation.push('Showing strong buying signals and intent');
    }

    if (prospect.jobTitle?.toLowerCase().includes('director') ||
        prospect.jobTitle?.toLowerCase().includes('vp') ||
        prospect.jobTitle?.toLowerCase().includes('c-level')) {
      explanation.push('Job title indicates decision-making authority');
    }

    if (prospect.companySize > 500) {
      explanation.push('Company size matches enterprise segment');
    }

    const recommendedActions = this.generateRecommendedActions(scoreBreakdown, prospect);
    const buyingSignals = this.identifyBuyingSignals(prospect);
    const similarDeals = this.findSimilarDeals(prospect);

    return {
      score: scoreBreakdown.totalScore,
      confidence,
      explanation,
      similarDeals,
      recommendedActions,
      buyingSignals
    };
  }

  private calculateConfidence(scoreBreakdown: LeadScoreBreakdown): 'high' | 'medium' | 'low' {
    const dataCompleteness =
      (scoreBreakdown.engagementScore.value > 0 ? 1 : 0) +
      (scoreBreakdown.fitScore.value > 0 ? 1 : 0) +
      (scoreBreakdown.intentScore.value > 0 ? 1 : 0);

    if (dataCompleteness === 3 && scoreBreakdown.totalScore > 60) return 'high';
    if (dataCompleteness >= 2) return 'medium';
    return 'low';
  }

  private generateRecommendedActions(scoreBreakdown: LeadScoreBreakdown, prospect: any): RecommendedAction[] {
    const actions: RecommendedAction[] = [];

    if (scoreBreakdown.intentScore.value > 20 && scoreBreakdown.totalScore > 70) {
      actions.push({
        id: '1',
        type: 'call',
        priority: 'high',
        title: 'Schedule Discovery Call',
        description: 'Prospect is showing high buying intent. Reach out immediately.',
        expectedImpact: '+15 points if contacted within 24 hours'
      });
    }

    if (scoreBreakdown.engagementScore.value < 10) {
      actions.push({
        id: '2',
        type: 'email',
        priority: 'medium',
        title: 'Send Personalized Email',
        description: 'Low engagement. Send targeted content to re-engage.',
        expectedImpact: '+5 points for email open'
      });
    }

    if (scoreBreakdown.intentScore.value > 15 && prospect.demoRequests > 0) {
      actions.push({
        id: '3',
        type: 'demo',
        priority: 'high',
        title: 'Book Product Demo',
        description: 'Prospect requested demo. Schedule within 48 hours.',
        expectedImpact: '+20 points upon demo completion'
      });
    }

    return actions;
  }

  private identifyBuyingSignals(prospect: any): BuyingSignal[] {
    const signals: BuyingSignal[] = [];

    if (prospect.pricingViews > 2) {
      signals.push({
        type: 'pricing_interest',
        signal: 'Multiple pricing page views',
        timestamp: new Date().toISOString(),
        strength: 'strong'
      });
    }

    if (prospect.demoRequests > 0) {
      signals.push({
        type: 'demo_request',
        signal: 'Requested product demonstration',
        timestamp: new Date().toISOString(),
        strength: 'strong'
      });
    }

    if (prospect.repeatedVisits > 5) {
      signals.push({
        type: 'repeated_engagement',
        signal: 'Frequent website visits',
        timestamp: new Date().toISOString(),
        strength: 'medium'
      });
    }

    return signals;
  }

  private findSimilarDeals(prospect: any): SimilarDeal[] {
    return [
      {
        id: '1',
        companyName: 'Acme Corp',
        score: 85,
        dealValue: 50000,
        closeDate: '2024-01-15',
        similarity: 92
      },
      {
        id: '2',
        companyName: 'TechStart Inc',
        score: 78,
        dealValue: 35000,
        closeDate: '2024-02-20',
        similarity: 87
      }
    ];
  }

  private getCompanySizeScore(size: number): number {
    if (size >= 1000) return 14;
    if (size >= 500) return 12;
    if (size >= 200) return 10;
    if (size >= 50) return 8;
    return 5;
  }

  private getIndustryScore(industry: string): number {
    const targetIndustries = ['software', 'technology', 'finance', 'healthcare'];
    return targetIndustries.includes(industry.toLowerCase()) ? 10 : 6;
  }

  private getSeniorityScore(level: string): number {
    const levelLower = level.toLowerCase();
    if (levelLower.includes('c-level') || levelLower.includes('ceo') ||
        levelLower.includes('cto') || levelLower.includes('cfo')) return 10;
    if (levelLower.includes('vp') || levelLower.includes('director')) return 8;
    if (levelLower.includes('manager')) return 6;
    return 4;
  }

  calculatePriority(prospect: any, scoreBreakdown: LeadScoreBreakdown): PriorityProspect['priority'] {
    const score = scoreBreakdown.totalScore;
    const daysSinceContact = prospect.daysSinceContact || 0;
    const urgencyScore = score + (daysSinceContact > 7 ? 10 : 0);

    if (urgencyScore >= 85 || (score >= 75 && daysSinceContact > 14)) return 'critical';
    if (urgencyScore >= 70) return 'high';
    if (urgencyScore >= 50) return 'medium';
    return 'low';
  }

  generateScoreTrend(prospectId: string): ScoreTrendPoint[] {
    const trend: ScoreTrendPoint[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      trend.push({
        date: date.toISOString().split('T')[0],
        score: 50 + Math.random() * 30,
        engagementScore: 10 + Math.random() * 15,
        fitScore: 20 + Math.random() * 15,
        intentScore: 10 + Math.random() * 15
      });
    }

    return trend;
  }

  setScoringRules(rules: ScoringRule[]) {
    this.scoringRules = rules;
  }

  getScoringRules(): ScoringRule[] {
    return this.scoringRules;
  }
}

export const leadScoringEngine = LeadScoringEngine.getInstance();
