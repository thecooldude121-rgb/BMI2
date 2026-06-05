import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { calculateDealHealthScore, ItemStatus } from '../../../utils/dealHealthScore';

interface MobileHealthScoreBarProps {
  formData: any;
}

const itemIcon = (status: ItemStatus) => {
  if (status === 'earned')  return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />;
  if (status === 'partial') return <AlertCircle  className="h-3.5 w-3.5 text-amber-500 flex-shrink-0"   />;
  return                           <Circle       className="h-3.5 w-3.5 text-gray-300 flex-shrink-0"    />;
};

export const MobileHealthScoreBar: React.FC<MobileHealthScoreBarProps> = ({ formData }) => {
  const [expanded, setExpanded] = useState(false);
  const result = calculateDealHealthScore(formData);

  const barColor =
    result.tier === 'green'  ? 'bg-emerald-500' :
    result.tier === 'yellow' ? 'bg-amber-500'   :
                               'bg-red-500';

  const scoreColor =
    result.tier === 'green'  ? 'text-emerald-600' :
    result.tier === 'yellow' ? 'text-amber-600'   :
                               'text-red-600';

  return (
    <div className="block lg:hidden bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(p => !p)}
        className="w-full px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${result.score}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 truncate">
              Health Score:{' '}
              <span className={`font-bold ${scoreColor}`}>{result.score}/100</span>
              {' — '}{result.label}
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
          : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-100 space-y-2 pt-2">
          {result.items.map(item => (
            <div key={item.id} className="flex items-start gap-2">
              {itemIcon(item.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${
                    item.status === 'earned' ? 'text-gray-600' :
                    item.status === 'partial' ? 'text-amber-700' : 'text-gray-400'
                  }`}>{item.label}</span>
                  {item.status !== 'earned' && (
                    <span className={`text-xs font-semibold ml-2 flex-shrink-0 ${
                      item.status === 'partial' ? 'text-amber-500' : 'text-gray-300'
                    }`}>+{item.max - item.earned} pts</span>
                  )}
                </div>
                {item.status !== 'earned' && (
                  <p className="text-xs text-gray-400 leading-tight mt-0.5">{item.tip}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
