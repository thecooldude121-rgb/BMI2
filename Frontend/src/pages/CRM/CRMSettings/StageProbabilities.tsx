import React from 'react';
import { Save } from 'lucide-react';

const StageProbabilities: React.FC = () => {
  const stages = [
    { name: 'Qualification', probability: 10 },
    { name: 'Needs Analysis', probability: 25 },
    { name: 'Proposal', probability: 50 },
    { name: 'Negotiation', probability: 75 },
    { name: 'Closed Won', probability: 100 }
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Stage Probabilities</h2>
        <p className="text-sm text-gray-600 mt-1">Set win probability for each stage</p>
      </div>

      <div className="space-y-4">
        {stages.map((stage) => (
          <div key={stage.name}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">{stage.name}</label>
              <span className="text-sm font-semibold text-blue-600">{stage.probability}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={stage.probability}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#3B82F6' }}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Probabilities
        </button>
      </div>
    </div>
  );
};

export default StageProbabilities;
