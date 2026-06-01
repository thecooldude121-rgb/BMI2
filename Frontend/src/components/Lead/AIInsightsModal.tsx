import React, { useState, useEffect } from 'react';
import { X, Sparkles, TrendingUp, AlertTriangle, Target, Users, Zap, Brain, CheckCircle, ArrowRight, Clock, DollarSign, ThumbsUp, MessageSquare } from 'lucide-react';
import { Lead } from '../../types/lead';
import { LeadScoringEngine, LeadEnrichmentEngine } from '../../utils/leadScoring';
import { aiEngine } from '../../utils/aiEngine';

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'trend';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
  affectedLeads: string[];
  confidence: number;
  impact: string;
}

const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ isOpen, onClose, leads }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'opportunities' | 'risks' | 'recommendations'>('all');

  useEffect(() => {
    if (isOpen) {
      generateInsights();
    }
  }, [isOpen, leads]);

  const generateInsights = async () => {
    setLoading(true);

    const generatedInsights: AIInsight[] = [];

    // 1. High-Score Leads Ready for Conversion
    const hotLeads = leads.filter(l => l.score >= 80 && l.stage !== 'won');
    if (hotLeads.length > 0) {
      generatedInsights.push({
        id: 'hot-leads',
        type: 'opportunity',
        priority: 'high',
        title: `${hotLeads.length} Hot Leads Ready for Immediate Action`,
        description: `You have ${hotLeads.length} leads with scores above 80 who are showing strong buying signals. These leads have high engagement and should be prioritized for conversion.`,
        actionItems: [
          'Schedule discovery calls within 24 hours',
          'Send personalized demo invitations',
          'Assign to top sales reps',
          'Create urgency with limited-time offers'
        ],
        affectedLeads: hotLeads.map(l => l.id),
        confidence: 0.95,
        impact: `Potential revenue: $${hotLeads.reduce((sum, l) => sum + l.value, 0).toLocaleString()}`
      });
    }

    // 2. Engagement Drop-off Detection
    const staleLeads = leads.filter(l => {
      if (!l.lastContact) return false;
      const daysSince = Math.floor((Date.now() - new Date(l.lastContact).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 14 && l.stage !== 'lost' && l.stage !== 'won' && l.score >= 60;
    });

    if (staleLeads.length > 0) {
      generatedInsights.push({
        id: 'stale-leads',
        type: 'risk',
        priority: 'high',
        title: `${staleLeads.length} High-Value Leads At Risk of Going Cold`,
        description: `These previously engaged leads haven't been contacted in over 2 weeks. Without action, they may lose interest and move to competitors.`,
        actionItems: [
          'Send re-engagement email campaigns',
          'Offer valuable content or resources',
          'Schedule check-in calls',
          'Update qualification status'
        ],
        affectedLeads: staleLeads.map(l => l.id),
        confidence: 0.88,
        impact: `At-risk revenue: $${staleLeads.reduce((sum, l) => sum + l.value, 0).toLocaleString()}`
      });
    }

    // 3. Email Engagement Patterns
    const highEmailEngagement = leads.filter(l => l.email_opens_count > 3 && l.email_clicks_count > 1 && !l.lastContact);
    if (highEmailEngagement.length > 0) {
      generatedInsights.push({
        id: 'email-engagement',
        type: 'opportunity',
        priority: 'high',
        title: `${highEmailEngagement.length} Leads Showing Strong Email Interest`,
        description: `These leads are actively engaging with your emails but haven't been contacted yet. They're signaling readiness for a conversation.`,
        actionItems: [
          'Reach out via phone immediately',
          'Send calendar invite for discovery call',
          'Personalize next touchpoint',
          'Share case studies relevant to their industry'
        ],
        affectedLeads: highEmailEngagement.map(l => l.id),
        confidence: 0.92,
        impact: 'High conversion potential - engaged but not contacted'
      });
    }

    // 4. Decision Maker Analysis
    const decisionMakers = leads.filter(l => {
      if (!l.position) return false;
      return /CEO|CTO|CFO|VP|President|Director|Head of/i.test(l.position);
    });

    if (decisionMakers.length > 0) {
      const uncontactedDMs = decisionMakers.filter(l => !l.lastContact);
      if (uncontactedDMs.length > 0) {
        generatedInsights.push({
          id: 'decision-makers',
          type: 'recommendation',
          priority: 'high',
          title: `${uncontactedDMs.length} Decision Makers Need Attention`,
          description: `You have ${uncontactedDMs.length} leads with decision-making authority who haven't been contacted. These should be your top priority.`,
          actionItems: [
            'Prioritize outreach to C-level contacts',
            'Use executive-level messaging',
            'Reference relevant industry trends',
            'Offer executive briefings or consultations'
          ],
          affectedLeads: uncontactedDMs.map(l => l.id),
          confidence: 0.90,
          impact: 'Shorter sales cycles with decision makers'
        });
      }
    }

    // 5. Company Size Opportunities
    const enterpriseLeads = leads.filter(l =>
      l.company_size && ['501-1000', '1000+'].includes(l.company_size) && l.score >= 70
    );

    if (enterpriseLeads.length > 0) {
      generatedInsights.push({
        id: 'enterprise',
        type: 'opportunity',
        priority: 'medium',
        title: `${enterpriseLeads.length} Enterprise Opportunities`,
        description: `You have qualified leads from large companies. These typically have longer sales cycles but higher contract values.`,
        actionItems: [
          'Assign to enterprise sales specialists',
          'Prepare multi-stakeholder demos',
          'Develop custom ROI analysis',
          'Plan for longer nurturing cycles'
        ],
        affectedLeads: enterpriseLeads.map(l => l.id),
        confidence: 0.85,
        impact: `Potential enterprise value: $${enterpriseLeads.reduce((sum, l) => sum + l.value, 0).toLocaleString()}`
      });
    }

    // 6. Low Score with High Activity
    const puzzlingLeads = leads.filter(l =>
      l.score < 50 && (l.meeting_count > 1 || l.call_count > 2)
    );

    if (puzzlingLeads.length > 0) {
      generatedInsights.push({
        id: 'low-score-high-activity',
        type: 'risk',
        priority: 'medium',
        title: `${puzzlingLeads.length} Leads with Activity But Low Scores`,
        description: `These leads have significant interaction but low scores. They may have qualification issues or need data updates.`,
        actionItems: [
          'Review lead qualification criteria',
          'Update missing information',
          'Reassess fit and interest level',
          'Consider if expectations are aligned'
        ],
        affectedLeads: puzzlingLeads.map(l => l.id),
        confidence: 0.78,
        impact: 'May require disqualification or re-qualification'
      });
    }

    // 7. Optimal Follow-up Timing
    const needFollowUp = leads.filter(l => {
      if (!l.lastContact) return false;
      const daysSince = Math.floor((Date.now() - new Date(l.lastContact).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince >= 3 && daysSince <= 7 && l.stage !== 'lost' && l.stage !== 'won';
    });

    if (needFollowUp.length > 0) {
      generatedInsights.push({
        id: 'follow-up-timing',
        type: 'recommendation',
        priority: 'medium',
        title: `${needFollowUp.length} Leads in Optimal Follow-up Window`,
        description: `These leads were last contacted 3-7 days ago, which is the ideal time for a follow-up to maintain momentum without being pushy.`,
        actionItems: [
          'Send follow-up emails today',
          'Reference previous conversations',
          'Share additional value or resources',
          'Propose next steps'
        ],
        affectedLeads: needFollowUp.map(l => l.id),
        confidence: 0.87,
        impact: 'Maintaining engagement momentum'
      });
    }

    // 8. Source Performance Analysis
    const sourcePerformance = analyzeSourcePerformance(leads);
    if (sourcePerformance.topSource) {
      generatedInsights.push({
        id: 'source-performance',
        type: 'trend',
        priority: 'low',
        title: `"${sourcePerformance.topSource}" is Your Best Performing Source`,
        description: `Leads from ${sourcePerformance.topSource} have ${sourcePerformance.conversionRate}% higher conversion rates. Consider increasing investment in this channel.`,
        actionItems: [
          'Allocate more budget to this source',
          'Analyze what makes these leads successful',
          'Replicate success patterns',
          'Reduce spend on underperforming sources'
        ],
        affectedLeads: [],
        confidence: 0.82,
        impact: 'Better ROI on lead generation spend'
      });
    }

    // 9. Incomplete Data Opportunities
    const incompleteLeads = leads.filter(l =>
      !l.phone || !l.company || !l.position || !l.industry
    );

    if (incompleteLeads.length > 10) {
      generatedInsights.push({
        id: 'incomplete-data',
        type: 'recommendation',
        priority: 'low',
        title: `${incompleteLeads.length} Leads with Incomplete Information`,
        description: `Many leads are missing key fields which limits scoring accuracy and personalization opportunities.`,
        actionItems: [
          'Enable data enrichment services',
          'Add progressive profiling to forms',
          'Train team on data collection',
          'Set up automated data validation'
        ],
        affectedLeads: incompleteLeads.map(l => l.id),
        confidence: 0.75,
        impact: 'Improved scoring and personalization'
      });
    }

    // 10. Win Pattern Recognition
    const wonLeads = leads.filter(l => l.stage === 'won');
    if (wonLeads.length >= 5) {
      const avgWonScore = wonLeads.reduce((sum, l) => sum + l.score, 0) / wonLeads.length;
      const similarLeads = leads.filter(l =>
        l.stage !== 'won' && l.stage !== 'lost' &&
        Math.abs(l.score - avgWonScore) <= 10
      );

      if (similarLeads.length > 0) {
        generatedInsights.push({
          id: 'win-pattern',
          type: 'opportunity',
          priority: 'high',
          title: `${similarLeads.length} Leads Match Your Win Pattern`,
          description: `These leads have characteristics similar to your previously won deals (average score: ${Math.round(avgWonScore)}). They have high likelihood of conversion.`,
          actionItems: [
            'Fast-track these opportunities',
            'Apply proven winning strategies',
            'Assign to your best closers',
            'Leverage case studies from similar wins'
          ],
          affectedLeads: similarLeads.map(l => l.id),
          confidence: 0.91,
          impact: `High probability conversions worth $${similarLeads.reduce((sum, l) => sum + l.value, 0).toLocaleString()}`
        });
      }
    }

    setInsights(generatedInsights);
    setLoading(false);
  };

  const analyzeSourcePerformance = (leads: Lead[]) => {
    const sources: Record<string, { total: number; won: number }> = {};

    leads.forEach(lead => {
      if (!sources[lead.source]) {
        sources[lead.source] = { total: 0, won: 0 };
      }
      sources[lead.source].total++;
      if (lead.stage === 'won') {
        sources[lead.source].won++;
      }
    });

    let topSource = '';
    let highestRate = 0;

    Object.entries(sources).forEach(([source, data]) => {
      if (data.total >= 5) {
        const rate = (data.won / data.total) * 100;
        if (rate > highestRate) {
          highestRate = rate;
          topSource = source;
        }
      }
    });

    return { topSource, conversionRate: Math.round(highestRate) };
  };

  const filteredInsights = insights.filter(insight => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'opportunities') return insight.type === 'opportunity';
    if (selectedTab === 'risks') return insight.type === 'risk';
    if (selectedTab === 'recommendations') return insight.type === 'recommendation' || insight.type === 'trend';
    return true;
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return TrendingUp;
      case 'risk': return AlertTriangle;
      case 'recommendation': return Target;
      case 'trend': return Sparkles;
      default: return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'text-green-600 bg-green-100';
      case 'risk': return 'text-red-600 bg-red-100';
      case 'recommendation': return 'text-blue-600 bg-blue-100';
      case 'trend': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[priority as keyof typeof colors];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">AI-Powered Lead Insights</h3>
                  <p className="text-purple-100 mt-1">
                    {insights.length} insights generated from {leads.length} leads
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mt-6">
              {[
                { id: 'all', label: 'All Insights', count: insights.length },
                { id: 'opportunities', label: 'Opportunities', count: insights.filter(i => i.type === 'opportunity').length },
                { id: 'risks', label: 'Risks', count: insights.filter(i => i.type === 'risk').length },
                { id: 'recommendations', label: 'Recommendations', count: insights.filter(i => i.type === 'recommendation' || i.type === 'trend').length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedTab === tab.id
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <span className="ml-4 text-gray-600">Analyzing leads with AI...</span>
              </div>
            ) : filteredInsights.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h3>
                <p className="text-gray-600">No insights in this category at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInsights.map((insight) => {
                  const Icon = getInsightIcon(insight.type);
                  return (
                    <div
                      key={insight.id}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all bg-white"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`p-3 rounded-xl ${getInsightColor(insight.type)}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{insight.title}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(insight.priority)}`}>
                                {insight.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-4">{insight.description}</p>

                            {/* Action Items */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <div className="flex items-center space-x-2 mb-3">
                                <Zap className="h-4 w-4 text-yellow-600" />
                                <span className="font-medium text-gray-900">Recommended Actions</span>
                              </div>
                              <ul className="space-y-2">
                                {insight.actionItems.map((action, idx) => (
                                  <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                                    <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span>{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Metrics */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-6 text-sm">
                                {insight.affectedLeads.length > 0 && (
                                  <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">{insight.affectedLeads.length} leads affected</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-2">
                                  <Brain className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-600">{Math.round(insight.confidence * 100)}% confidence</span>
                                </div>
                                {insight.impact && (
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">{insight.impact}</span>
                                  </div>
                                )}
                              </div>

                              {insight.affectedLeads.length > 0 && (
                                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                  View Leads
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Updated just now</span>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                Export Report
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsModal;
