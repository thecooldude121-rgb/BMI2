import { ExternalLink, Calendar, Mail, FileText } from 'lucide-react';

interface DealRecommendation {
  name: string;
  value: string;
  stage: string;
  badge: {
    icon: string;
    text: string;
    type: 'warning' | 'success' | 'info';
  };
  whyFocus: string[];
  nextAction: {
    title: string;
    details: string[];
  };
  actions: Array<{
    label: string;
    icon?: JSX.Element;
    onClick: () => void;
  }>;
}

interface DealRecommendationCardProps {
  deal: DealRecommendation;
  index: number;
}

export default function DealRecommendationCard({ deal, index }: DealRecommendationCardProps) {
  const badgeColors = {
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200'
  };

  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-2 mb-3">
        <h3 className="text-sm font-bold text-gray-900">
          {index}. {deal.name} - {deal.value}
        </h3>
        <span className="text-xs text-gray-500">({deal.stage})</span>
      </div>

      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium mb-4 ${badgeColors[deal.badge.type]}`}>
        <span>{deal.badge.icon}</span>
        <span>{deal.badge.text}</span>
      </div>

      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">Why focus here:</p>
        <ul className="space-y-1.5">
          {deal.whyFocus.map((reason, idx) => (
            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-gray-400 mt-1">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">Next Action:</p>
        {deal.nextAction.details.map((detail, idx) => (
          <p key={idx} className="text-sm text-gray-700 mb-1">{detail}</p>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {deal.actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
