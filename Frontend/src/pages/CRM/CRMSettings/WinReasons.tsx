import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';

const WinReasons: React.FC = () => {
  const [winReasons] = useState(['Better pricing', 'Feature superiority', 'Customer service', 'Brand reputation']);
  const [lossReasons] = useState(['Price too high', 'Missing features', 'Lost to competitor', 'No budget']);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Win/Loss Reasons</h2>
        <p className="text-sm text-gray-600 mt-1">Track why deals are won or lost</p>
      </div>

      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Win Reasons</h3>
            <button className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-2">
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {winReasons.map((reason) => (
              <div key={reason} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-gray-700">{reason}</span>
                <button className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Loss Reasons</h3>
            <button className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-2">
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {lossReasons.map((reason) => (
              <div key={reason} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-gray-700">{reason}</span>
                <button className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
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

export default WinReasons;
