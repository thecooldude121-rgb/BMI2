import React, { useState } from 'react';
import { Plus, GripVertical, Pencil, Trash2, Save } from 'lucide-react';

type DealStage = {
  id: string;
  name: string;
  probability: number;
  color: string;
};

const DealStages: React.FC = () => {
  const [stages, setStages] = useState<DealStage[]>([
    { id: '1', name: 'Qualification', probability: 10, color: '#3B82F6' },
    { id: '2', name: 'Needs Analysis', probability: 25, color: '#8B5CF6' },
    { id: '3', name: 'Proposal', probability: 50, color: '#EC4899' },
    { id: '4', name: 'Negotiation', probability: 75, color: '#F59E0B' },
    { id: '5', name: 'Closed Won', probability: 100, color: '#10B981' }
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Deal Stages</h2>
          <p className="text-sm text-gray-600 mt-1">Configure your sales pipeline stages</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Stage
        </button>
      </div>

      <div className="space-y-3">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <button className="text-gray-400 hover:text-gray-600 cursor-move">
              <GripVertical className="h-5 w-5" />
            </button>

            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: stage.color }}
            />

            <div className="flex-1">
              <div className="font-medium text-gray-900">{stage.name}</div>
              <div className="text-sm text-gray-500">Win probability: {stage.probability}%</div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                <Pencil className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-yellow-900 mb-2">Important Note:</h4>
        <p className="text-sm text-yellow-800">
          Changing or deleting stages will affect existing deals. Make sure to update deals before making major changes.
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default DealStages;
