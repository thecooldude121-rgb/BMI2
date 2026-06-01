import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DuplicateCheckPanelProps {
  duplicates: any[];
  onViewDeal: (dealId: string) => void;
  onMerge: () => void;
}

export const DuplicateCheckPanel: React.FC<DuplicateCheckPanelProps> = ({
  duplicates,
  onViewDeal,
  onMerge
}) => {
  if (duplicates.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border-2 border-yellow-300 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <AlertTriangle className="h-6 w-6 text-yellow-600" />
        <h2 className="text-lg font-bold text-gray-900">⚠️ DUPLICATE CHECK</h2>
      </div>

      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-3">
        <div className="text-sm font-semibold text-yellow-900 mb-1">🔍 Similar deal exists:</div>
      </div>

      <div className="space-y-3">
        {duplicates.map((dup) => (
          <div key={dup.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="font-medium text-gray-900 mb-2">{dup.name}</div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>${(dup.value / 1000).toFixed(0)}K | {dup.stage} Stage</div>
              <div>Owner: {dup.owner}</div>
              <div>Created: {dup.createdDate}</div>
            </div>
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={() => onViewDeal(dup.id)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                View Existing Deal
              </button>
              <button
                onClick={onMerge}
                className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium transition-colors"
              >
                Merge
              </button>
              <button
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
              >
                Save Anyway
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
