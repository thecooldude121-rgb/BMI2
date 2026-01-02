export interface LeadPersona {
  id: string;
  name: string;
  industry: string[];
  jobTitles: string[];
  companySize: string[];
  avgDealValue: number;
  conversionRate: number;
  avgSalesCycle: number;
  keyIndicators: string[];
}

export interface AIRecommendation {
  type: 'lead_scoring' | 'next_action' | 'persona_match' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  actionItems: string[];
  relatedTo?: string;
}

class AIEngine {
  private personas: LeadPersona[] = [
    {
      id: 'enterprise-tech-cto',
      name: 'Enterprise Tech CTO',
      industry: ['Technology', 'Software'],
      jobTitles: ['CTO', 'VP of Technology', 'Chief Technology Officer'],
      companySize: ['1000+', '500-1000'],
      avgDealValue: 150000,
      conversionRate: 0.35,
      avgSalesCycle: 90,
      keyIndicators: ['Innovation', 'Scalability', 'Security']
    },
    {
      id: 'healthcare-director',
      name: 'Healthcare Operations Director',
      industry: ['Healthcare', 'Medical'],
      jobTitles: ['Director of Operations', 'Operations Manager', 'VP of Operations'],
      companySize: ['200-500', '500-1000'],
      avgDealValue: 75000,
      conversionRate: 0.28,
      avgSalesCycle: 120,
      keyIndicators: ['Compliance', 'Efficiency', 'Patient Care']
    },
    {
      id: 'finance-cfo',
      name: 'Finance Executive',
      industry: ['Finance', 'Banking', 'Insurance'],
      jobTitles: ['CFO', 'Finance Director', 'VP of Finance'],
      companySize: ['100-500', '500-1000'],
      avgDealValue: 100000,
      conversionRate: 0.32,
      avgSalesCycle: 75,
      keyIndicators: ['ROI', 'Cost Reduction', 'Compliance']
    }
  ];

  scoreLeadFit(lead: any): number {
    let score = 50; // Base score

    // Industry match
    const matchingPersona = this.personas.find(persona => 
      persona.industry.includes(lead.industry)
    );
    if (matchingPersona) {
      score += 20;
      
      // Job title match
      if (matchingPersona.jobTitles.some(title => 
        lead.position.toLowerCase().includes(title.toLowerCase())
      )) {
        score += 15;
      }
    }

    // Company size indicators (estimated from deal value)
    if (lead.value > 100000) score += 10;
    if (lead.value > 50000) score += 5;

    // Engagement indicators
    if (lead.stage === 'qualified' || lead.stage === 'proposal') score += 10;
    if (lead.lastContact) score += 5;

    // Source quality
    const highQualitySources = ['Referral', 'LinkedIn', 'Trade Show'];
    if (highQualitySources.includes(lead.source)) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  generateRecommendations(leads: any[], deals: any[], tasks: any[]): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];

    // High-priority leads to follow up
    const highScoreLeads = leads.filter(lead => 
      this.scoreLeadFit(lead) > 80 && lead.stage === 'contacted'
    );
    
    if (highScoreLeads.length > 0) {
      recommendations.push({
        type: 'opportunity',
        title: 'High-Priority Leads Need Attention',
        description: `${highScoreLeads.length} high-scoring leads are waiting for follow-up`,
        confidence: 0.9,
        actionItems: [
          'Schedule discovery calls with top-scoring leads',
          'Send personalized follow-up emails',
          'Research company pain points'
        ],
        relatedTo: 'leads'
      });
    }

    // Persona-based lead generation
    const wonDeals = deals.filter(deal => deal.stage === 'closed-won');
    if (wonDeals.length > 0) {
      recommendations.push({
        type: 'persona_match',
        title: 'Target Similar Prospects',
        description: 'Based on your closed-won deals, focus on Healthcare and Technology sectors',
        confidence: 0.85,
        actionItems: [
          'Search for CTOs in healthcare technology companies',
          'Target companies with 500+ employees',
          'Focus on decision-makers with innovation budgets'
        ],
        relatedTo: 'lead-generation'
      });
    }

    // Deal velocity insights
    const activeDeals = deals.filter(deal => !deal.stage.startsWith('closed'));
    const stagnantDeals = activeDeals.filter(deal => {
      const daysSinceCreated = (new Date().getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated > 60;
    });

    if (stagnantDeals.length > 0) {
      recommendations.push({
        type: 'next_action',
        title: 'Stagnant Deals Need Action',
        description: `${stagnantDeals.length} deals have been inactive for over 60 days`,
        confidence: 0.8,
        actionItems: [
          'Schedule check-in calls with prospects',
          'Review and update deal stages',
          'Identify and address blocking issues'
        ],
        relatedTo: 'deals'
      });
    }

    return recommendations;
  }

  generateSimilarLeads(baseLead: any, allLeads: any[]): any[] {
    const baseScore = this.scoreLeadFit(baseLead);
    
    return allLeads
      .filter(lead => lead.id !== baseLead.id)
      .map(lead => ({
        ...lead,
        similarityScore: this.calculateSimilarity(baseLead, lead),
        fitScore: this.scoreLeadFit(lead)
      }))
      .filter(lead => lead.similarityScore > 0.6 && lead.fitScore > baseScore - 20)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 10);
  }

  private calculateSimilarity(lead1: any, lead2: any): number {
    let similarity = 0;
    let factors = 0;

    // Industry match
    if (lead1.industry === lead2.industry) {
      similarity += 0.3;
    }
    factors += 0.3;

    // Position similarity
    if (lead1.position.toLowerCase().includes('director') && lead2.position.toLowerCase().includes('director')) {
      similarity += 0.2;
    } else if (lead1.position.toLowerCase().includes('manager') && lead2.position.toLowerCase().includes('manager')) {
      similarity += 0.15;
    }
    factors += 0.2;

    // Value range similarity
    const valueDiff = Math.abs(lead1.value - lead2.value) / Math.max(lead1.value, lead2.value);
    if (valueDiff < 0.3) similarity += 0.25;
    factors += 0.25;

    // Source similarity
    if (lead1.source === lead2.source) {
      similarity += 0.15;
    }
    factors += 0.15;

    // Stage similarity
    if (lead1.stage === lead2.stage) {
      similarity += 0.1;
    }
    factors += 0.1;

    return similarity / factors;
  }

  predictDealOutcome(deal: any, historicalDeals: any[]): { probability: number; timeToClose: number; recommendations: string[] } {
    const similarDeals = historicalDeals.filter(d => 
      d.stage === 'closed-won' || d.stage === 'closed-lost'
    );

    const avgCloseTime = similarDeals.reduce((sum, d) => {
      const daysDiff = (new Date(d.expectedCloseDate).getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return sum + daysDiff;
    }, 0) / similarDeals.length;

    const winRate = similarDeals.filter(d => d.stage === 'closed-won').length / similarDeals.length;

    let adjustedProbability = deal.probability / 100;
    
    // Adjust based on deal age
    const dealAge = (new Date().getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (dealAge > avgCloseTime * 1.5) {
      adjustedProbability *= 0.8; // Reduce probability for stagnant deals
    }

    const recommendations = [];
    if (adjustedProbability < 0.5) {
      recommendations.push('Schedule stakeholder alignment call', 'Identify and address objections');
    }
    if (dealAge > avgCloseTime) {
      recommendations.push('Create urgency with limited-time offers', 'Involve senior leadership');
    }

    return {
      probability: Math.round(adjustedProbability * 100),
      timeToClose: Math.max(1, avgCloseTime - dealAge),
      recommendations
    };
  }
}

export const aiEngine = new AIEngine();