import React from 'react';
import type { Lead } from '../../types/lead';

/**
 * Takes leads as a prop instead of calling useData().
 *
 * Two changes beyond the data source. It read `lead.stage`, which does not
 * exist on the frontend Lead type — the DB column IS called stage, but
 * mapRowToLead puts it on `status`, so every bucket matched nothing and the
 * funnel would have rendered five zeroes against real data. And the stage list
 * now matches the leads_stage_check constraint exactly:
 * new | contacted | qualified | proposal | won | lost.
 *
 * 'lost' is shown alongside the rest rather than dropped. A funnel that only
 * counts progress overstates the pipeline, and the previous version's
 * conversion rate divided won by ALL leads including still-open ones, which
 * understates it. Both are now stated for what they are.
 */

interface SalesFunnelProps {
  leads: Lead[];
}

const STAGES: { key: Lead['status']; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: 'bg-gray-400' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-400' },
  { key: 'qualified', label: 'Qualified', color: 'bg-yellow-400' },
  { key: 'proposal', label: 'Proposal', color: 'bg-orange-400' },
  { key: 'won', label: 'Won', color: 'bg-green-400' },
  { key: 'lost', label: 'Lost', color: 'bg-red-400' },
];

const SalesFunnel: React.FC<SalesFunnelProps> = ({ leads }) => {
  const funnelData = STAGES.map((s) => ({
    ...s,
    count: leads.filter((l) => l.status === s.key).length,
  }));

  const maxCount = Math.max(...funnelData.map((d) => d.count), 0);
  const won = funnelData.find((d) => d.key === 'won')?.count ?? 0;
  const lost = funnelData.find((d) => d.key === 'lost')?.count ?? 0;

  // Denominator is decided leads only. Dividing won by every lead — including
  // ones still in play — reports a rate that can only rise later, which is not
  // a conversion rate.
  const decided = won + lost;
  const conversionRate = decided > 0 ? Math.round((won / decided) * 100) : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Funnel</h3>

      {leads.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">No leads yet.</p>
      ) : (
        <>
          <div className="space-y-4">
            {funnelData.map((stage) => {
              const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;

              return (
                <div key={stage.key} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                    <span className="text-sm text-gray-500">
                      {stage.count} {stage.count === 1 ? 'lead' : 'leads'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${stage.color} transition-all duration-500 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
                <p className="text-sm text-gray-500">Total Leads</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{won}</p>
                <p className="text-sm text-gray-500">Won</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {conversionRate === null ? '—' : `${conversionRate}%`}
                </p>
                <p className="text-sm text-gray-500">
                  {conversionRate === null ? 'No decided leads' : 'Won of decided'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesFunnel;
