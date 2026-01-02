import React from 'react';
import { useData } from '../../contexts/DataContext';

const LeadScoreChart: React.FC = () => {
  const { leads } = useData();

  const scoreRanges = [
    { range: '90-100', min: 90, max: 100, color: 'bg-green-500' },
    { range: '80-89', min: 80, max: 89, color: 'bg-blue-500' },
    { range: '70-79', min: 70, max: 79, color: 'bg-yellow-500' },
    { range: '60-69', min: 60, max: 69, color: 'bg-orange-500' },
    { range: '0-59', min: 0, max: 59, color: 'bg-red-500' }
  ];

  const scoreData = scoreRanges.map(range => ({
    ...range,
    count: leads.filter(lead => lead.score >= range.min && lead.score <= range.max).length
  }));

  const maxCount = Math.max(...scoreData.map(d => d.count));
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Lead Score Distribution</h3>
      
      <div className="mb-6">
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
          <p className="text-3xl font-bold text-gray-900">{avgScore}</p>
          <p className="text-sm text-gray-600">Average Lead Score</p>
        </div>
      </div>

      <div className="space-y-4">
        {scoreData.map(range => {
          const percentage = maxCount > 0 ? (range.count / maxCount) * 100 : 0;
          
          return (
            <div key={range.range} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{range.range}</span>
                <span className="text-sm text-gray-500">{range.count} leads</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${range.color} transition-all duration-500 ease-out`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            <span className="font-medium text-green-600">
              {scoreData.filter(d => d.min >= 80).reduce((sum, d) => sum + d.count, 0)}
            </span> high-quality leads (80+)
          </p>
          <p>
            <span className="font-medium text-orange-600">
              {scoreData.filter(d => d.max < 70).reduce((sum, d) => sum + d.count, 0)}
            </span> leads need attention (&lt;70)
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeadScoreChart;