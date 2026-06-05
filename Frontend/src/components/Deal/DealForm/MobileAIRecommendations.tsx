import React, { useState } from 'react';
import { Lightbulb, Tag, TrendingUp, User, Calendar, CheckCircle2 } from 'lucide-react';
import { hasSeniorBuyer, StakeholderContact } from '../../../config/contactRoles';

interface MobileAIRecommendationsProps {
  formData: any;
  onApplyRecommendation: (field: string, value: any) => void;
}

export const MobileAIRecommendations: React.FC<MobileAIRecommendationsProps> = ({
  formData,
  onApplyRecommendation,
}) => {
  const [showAll, setShowAll] = useState(false);

  const recommendations: { id: number; title: string; reason: string; action: () => void; icon: React.ElementType }[] = [];

  if (!formData.tags.includes('Competitor Switch') && formData.source?.includes('lead-gen')) {
    recommendations.push({
      id: 1, title: 'Add Tag: "Competitor Switch"', reason: 'Currently using existing solution',
      action: () => onApplyRecommendation('tags', [...formData.tags, 'Competitor Switch']),
      icon: Tag,
    });
  }
  if (formData.priority !== 'High' && parseFloat(formData.dealValue) >= 45000) {
    recommendations.push({
      id: 2, title: 'Set Priority to "High"', reason: 'Large deal, good fit',
      action: () => onApplyRecommendation('priority', 'High'),
      icon: TrendingUp,
    });
  }
  const additionalContacts: StakeholderContact[] = formData.additionalContacts ?? [];
  if (!hasSeniorBuyer(formData.contactRole, additionalContacts)) {
    recommendations.push({
      id: 3, title: 'Add Decision Maker', reason: 'Deals with a senior buyer close 40% more often',
      action: () => {},
      icon: User,
    });
  }
  if (formData.closeDate) {
    const d = new Date(formData.closeDate);
    d.setDate(d.getDate() - 3);
    recommendations.push({
      id: 4,
      title: `Move Close Date to ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      reason: 'Similar deals close ~3 days early',
      action: () => onApplyRecommendation('closeDate', d.toISOString().split('T')[0]),
      icon: Calendar,
    });
  }
  recommendations.push({
    id: 5, title: 'Schedule discovery call', reason: 'Best practice for this stage',
    action: () => {},
    icon: CheckCircle2,
  });

  if (recommendations.length === 0) return null;

  const visible = showAll ? recommendations : recommendations.slice(0, 2);
  const hidden = recommendations.length - 2;

  return (
    <div className="block lg:hidden bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-semibold text-gray-800">AI Recommendations</span>
      </div>
      <div className="space-y-2">
        {visible.map(rec => {
          const Icon = rec.icon;
          return (
            <div key={rec.id} className="flex items-center justify-between gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2 min-w-0">
                <Icon className="h-3.5 w-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{rec.title}</p>
                  <p className="text-xs text-gray-500">{rec.reason}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={rec.action}
                className="flex-shrink-0 text-xs font-medium px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[36px]"
              >
                Apply
              </button>
            </div>
          );
        })}
      </div>
      {!showAll && hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          See {hidden} more recommendation{hidden !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
};
