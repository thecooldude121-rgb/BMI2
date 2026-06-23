// Lead Scoring System Types

export interface ScoreComponent {
  name: string;
  value: number;
  maxValue: number;
  percentage: number;
  factors: ScoreFactor[];
}

export interface ScoreFactor {
  label: string;
  value: number;
  weight: number;
  description: string;
}

export interface LeadScoreBreakdown {
  totalScore: number;
  engagementScore: ScoreComponent;
  fitScore: ScoreComponent;
  intentScore: ScoreComponent;
  confidenceScore?: ScoreComponent;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  changeAmount: number;
}

export interface ScoreTrendPoint {
  date: string;
  score: number;
  engagementScore: number;
  fitScore: number;
  intentScore: number;
}

export interface AIScoreInsight {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  explanation: string[];
  similarDeals: SimilarDeal[];
  recommendedActions: RecommendedAction[];
  buyingSignals: BuyingSignal[];
}

export interface SimilarDeal {
  id: string;
  companyName: string;
  score: number;
  dealValue: number;
  closeDate: string;
  similarity: number;
}

export interface RecommendedAction {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'demo' | 'content';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
}

export interface BuyingSignal {
  type: string;
  signal: string;
  timestamp: string;
  strength: 'strong' | 'medium' | 'weak';
}

export interface ScoringRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  category: 'engagement' | 'fit' | 'intent';
  conditions: RuleCondition[];
  action: RuleAction;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  type: 'add' | 'subtract' | 'set';
  points: number;
  component: 'engagement' | 'fit' | 'intent';
}

export interface PriorityLevel {
  level: 'critical' | 'high' | 'medium' | 'low';
  color: string;
  bgColor: string;
  label: string;
  minScore: number;
}

export interface PriorityProspect {
  id: string;
  name: string;
  company: string;
  email: string;
  score: number;
  priority: PriorityLevel['level'];
  lastContactDate?: string;
  daysSinceContact: number;
  buyingSignals: number;
  urgencyScore: number;
  recommendedAction: string;
  avatar?: string;
}

export interface ScoreAnalytics {
  distribution: ScoreDistribution[];
  conversionRates: ConversionRate[];
  velocityMetrics: VelocityMetric[];
  accuracyReport: AccuracyReport;
}

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface ConversionRate {
  scoreRange: string;
  prospects: number;
  converted: number;
  rate: number;
}

export interface VelocityMetric {
  period: string;
  averageChange: number;
  fastestGrowers: { id: string; name: string; change: number }[];
}

export interface AccuracyReport {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  falsePositives: number;
  falseNegatives: number;
}

export interface ScoreChange {
  id: string;
  prospectId: string;
  oldScore: number;
  newScore: number;
  change: number;
  component: 'engagement' | 'fit' | 'intent' | 'total';
  reason: string;
  ruleId?: string;
  timestamp: string;
  triggeredBy: string;
}

export const PRIORITY_LEVELS: Record<PriorityLevel['level'], PriorityLevel> = {
  critical: {
    level: 'critical',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    label: 'Critical',
    minScore: 85
  },
  high: {
    level: 'high',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    label: 'High',
    minScore: 70
  },
  medium: {
    level: 'medium',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    label: 'Medium',
    minScore: 50
  },
  low: {
    level: 'low',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    label: 'Low',
    minScore: 0
  }
};

export const FIELD_OPTIONS = [
  { value: 'company_size', label: 'Company Size', type: 'number' },
  { value: 'industry', label: 'Industry', type: 'string' },
  { value: 'seniority_level', label: 'Seniority Level', type: 'string' },
  { value: 'job_title', label: 'Job Title', type: 'string' },
  { value: 'email_opens', label: 'Email Opens', type: 'number' },
  { value: 'email_clicks', label: 'Email Clicks', type: 'number' },
  { value: 'website_visits', label: 'Website Visits', type: 'number' },
  { value: 'content_downloads', label: 'Content Downloads', type: 'number' },
  { value: 'demo_requests', label: 'Demo Requests', type: 'number' },
  { value: 'pricing_views', label: 'Pricing Page Views', type: 'number' },
  { value: 'days_since_contact', label: 'Days Since Last Contact', type: 'number' },
  { value: 'engagement_level', label: 'Engagement Level', type: 'string' }
];

export const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals', types: ['string', 'number'] },
  { value: 'not_equals', label: 'Not Equals', types: ['string', 'number'] },
  { value: 'greater_than', label: 'Greater Than', types: ['number'] },
  { value: 'less_than', label: 'Less Than', types: ['number'] },
  { value: 'contains', label: 'Contains', types: ['string'] },
  { value: 'in', label: 'In List', types: ['string'] },
  { value: 'between', label: 'Between', types: ['number'] }
];
