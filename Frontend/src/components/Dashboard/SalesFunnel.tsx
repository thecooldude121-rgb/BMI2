import React from 'react';
import { useData } from '../../contexts/DataContext';

const SalesFunnel: React.FC = () => {
  const { leads } = useData();

  const funnelData = [
    { stage: 'New', count: leads.filter(l => l.stage === 'new').length, color: 'bg-gray-400' },
    { stage: 'Contacted', count: leads.filter(l => l.stage === 'contacted').length, color: 'bg-blue-400' },
    { stage: 'Qualified', count: leads.filter(l => l.stage === 'qualified').length, color: 'bg-yellow-400' },
    { stage: 'Proposal', count: leads.filter(l => l.stage === 'proposal').length, color: 'bg-orange-400' },
    { stage: 'Won', count: leads.filter(l => l.stage === 'won').length, color: 'bg-green-400' }
  ];

  const maxCount = Math.max(...funnelData.map(d => d.count));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Funnel</h3>
      
      <div className="space-y-4">
        {funnelData.map((stage, index) => {
          const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          
          return (
            <div key={stage.stage} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                <span className="text-sm text-gray-500">{stage.count} leads</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${stage.color} transition-all duration-500 ease-out`}
                  style={{ width: `${percentage}%` }}
                ></div>
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
            <p className="text-2xl font-bold text-green-600">{funnelData[4].count}</p>
            <p className="text-sm text-gray-500">Won</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {leads.length > 0 ? Math.round((funnelData[4].count / leads.length) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-500">Conversion Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesFunnel;