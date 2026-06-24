import React from 'react';
import { Lightbulb, Tag, TrendingUp, User, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { hasSeniorBuyer, StakeholderContact } from '../../../config/contactRoles';

interface AIRecommendationsPanelProps {
  formData: any;
  onApplyRecommendation: (field: string, value: any) => void;
}

export const AIRecommendationsPanel: React.FC<AIRecommendationsPanelProps> = ({
  formData,
  onApplyRecommendation
}) => {
  const recommendations = [];

  if (!formData.tags.includes('Competitor Switch') && formData.source.includes('lead-gen')) {
    recommendations.push({
      id: 1,
      title: 'Add Tag: "Competitor Switch"',
      reason: 'Currently using existing solution',
      action: () => onApplyRecommendation('tags', [...formData.tags, 'Competitor Switch']),
      icon: Tag
    });
  }

  if (formData.priority !== 'High' && parseFloat(formData.dealValue) >= 45000) {
    recommendations.push({
      id: 2,
      title: 'Priority: Set to "High"',
      reason: 'Large deal, good fit',
      action: () => onApplyRecommendation('priority', 'High'),
      icon: TrendingUp
    });
  }

  const additionalContacts: StakeholderContact[] = formData.additionalContacts ?? [];

  // Detractor recommendation — surfaces before the generic senior-buyer nudge
  const detractors: string[] = [];
  if ((formData.primaryContactSentiment || 'neutral') === 'negative' && formData.primaryContactName) {
    detractors.push(formData.primaryContactName);
  }
  additionalContacts
    .filter(c => c.sentiment === 'negative' && c.name.trim())
    .forEach(c => detractors.push(c.name));
  if (detractors.length > 0) {
    recommendations.push({
      id: recommendations.length + 1,
      title: `⚠️ ${detractors[0]} is flagged as a detractor — prepare objection handling before next meeting`,
      reason: 'Detractors can stall deals late in the cycle',
      action: () => {},
      icon: AlertTriangle,
    });
  }

  if (!hasSeniorBuyer(formData.contactRole, additionalContacts)) {
    recommendations.push({
      id: 3,
      title: 'Add a Decision Maker or Economic Buyer',
      reason: 'Deals without a senior buyer role close 40% less often',
      action: () => {},
      icon: User
    });
  }

  if (formData.closeDate) {
    const closeDate = new Date(formData.closeDate);
    const suggestedDate = new Date(closeDate);
    suggestedDate.setDate(suggestedDate.getDate() - 3);
    recommendations.push({
      id: 4,
      title: `Close Date: Move to ${suggestedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      reason: 'Similar deals close 3 days early',
      action: () => onApplyRecommendation('closeDate', suggestedDate.toISOString().split('T')[0]),
      icon: Calendar
    });
  }

  recommendations.push({
    id: 5,
    title: 'Next Step: Schedule discovery call',
    reason: 'Best practice for this stage',
    action: () => {},
    icon: CheckCircle2
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Lightbulb className="h-6 w-6 text-yellow-600" />
        <h2 className="text-lg font-bold text-gray-900">💡 AI RECOMMENDATIONS</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">Based on data analysis:</p>

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          return (
            <div key={rec.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start space-x-2 mb-2">
                <Icon className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{rec.id}. {rec.title}</div>
                  <div className="text-xs text-gray-600 mt-1">Reason: {rec.reason}</div>
                </div>
              </div>
              <button
                onClick={rec.action}
                className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                {rec.title.includes('Add Tag') || rec.title.includes('Priority') || rec.title.includes('Close Date') ? 'Apply' : rec.title.includes('Contact') ? 'Find & Add CEO' : 'Create Task'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
