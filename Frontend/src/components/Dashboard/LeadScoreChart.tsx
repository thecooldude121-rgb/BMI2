import React from 'react';
import type { Lead } from '../../types/lead';

/**
 * Takes leads as a prop instead of calling useData().
 *
 * leads.score is a real column, so this widget's arithmetic was already sound —
 * it was only reading it from sample data. The buckets and the average are
 * unchanged; what is new is that an all-zero-score dataset now says so instead
 * of drawing a full red bar and an average of 0 as though that were a finding.
 */

interface LeadScoreChartProps {
  leads: Lead[];
}

const SCORE_RANGES = [
  { range: '90-100', min: 90, max: 100, color: 'bg-green-500' },
  { range: '80-89', min: 80, max: 89, color: 'bg-blue-500' },
  { range: '70-79', min: 70, max: 79, color: 'bg-yellow-500' },
  { range: '60-69', min: 60, max: 69, color: 'bg-orange-500' },
  { range: '0-59', min: 0, max: 59, color: 'bg-red-500' },
];

const LeadScoreChart: React.FC<LeadScoreChartProps> = ({ leads }) => {
  const scoreData = SCORE_RANGES.map((range) => ({
    ...range,
    count: leads.filter((lead) => lead.score >= range.min && lead.score <= range.max).length,
  }));

  const maxCount = Math.max(...scoreData.map((d) => d.count), 0);
  const avgScore =
    leads.length > 0
      ? Math.round(leads.reduce((sum, lead) => sum + (lead.score ?? 0), 0) / leads.length)
      : null;

  // A tree of zeroes is not a score distribution. Say so rather than rendering
  // a chart that implies every lead was assessed and scored badly.
  const anyScored = leads.some((l) => (l.score ?? 0) > 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Lead Score Distribution</h3>

      {leads.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">No leads yet.</p>
      ) : !anyScored ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          No leads have been scored yet.
        </p>
      ) : (
        <>
          <div className="mb-6">
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">{avgScore}</p>
              <p className="text-sm text-gray-600">Average Lead Score</p>
            </div>
          </div>

          <div className="space-y-4">
            {scoreData.map((range) => {
              const percentage = maxCount > 0 ? (range.count / maxCount) * 100 : 0;

              return (
                <div key={range.range} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{range.range}</span>
                    <span className="text-sm text-gray-500">
                      {range.count} {range.count === 1 ? 'lead' : 'leads'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${range.color} transition-all duration-500 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                <span className="font-medium text-green-600">
                  {scoreData.filter((d) => d.min >= 80).reduce((sum, d) => sum + d.count, 0)}
                </span>{' '}
                high-quality leads (80+)
              </p>
              <p>
                <span className="font-medium text-orange-600">
                  {scoreData.filter((d) => d.max < 70).reduce((sum, d) => sum + d.count, 0)}
                </span>{' '}
                leads need attention (&lt;70)
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeadScoreChart;
