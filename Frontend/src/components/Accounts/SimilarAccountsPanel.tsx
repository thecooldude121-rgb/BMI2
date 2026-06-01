import React from 'react';
import { TrendingUp, Building2, ExternalLink } from 'lucide-react';

interface SimilarAccount {
  id: string;
  name: string;
  similarity: number;
  industry: string;
  employeeCount: number;
  hasHRMSConnection: boolean;
  recruitedCount?: number;
  dealValue: number;
  daysToClose: number;
  keySuccess: string;
}

interface SimilarAccountsPanelProps {
  accounts: SimilarAccount[];
  onAccountClick: (id: string) => void;
}

const SimilarAccountsPanel: React.FC<SimilarAccountsPanelProps> = ({
  accounts,
  onAccountClick
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-bold text-gray-900">Similar Successful Accounts</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Based on: Industry, Size, HRMS connection
      </p>

      <div className="space-y-4">
        {accounts.map((account, idx) => (
          <div
            key={account.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onAccountClick(account.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">{idx + 1}. {account.name}</span>
                  <span className="text-sm text-blue-600 font-medium">
                    ({account.similarity}% similar)
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <Building2 className="h-3 w-3" />
                  <span>{account.industry}, {account.employeeCount} employees</span>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>

            {account.hasHRMSConnection && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                  HRMS Connection ({account.recruitedCount} recruit{account.recruitedCount !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div>
                <p className="text-gray-600">Closed</p>
                <p className="font-semibold text-green-600">
                  ${(account.dealValue / 1000).toFixed(0)}K in {account.daysToClose} days
                </p>
              </div>
              <div>
                <p className="text-gray-600">Key Success</p>
                <p className="font-medium text-gray-900 text-xs">{account.keySuccess}</p>
              </div>
            </div>

            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View Account →
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm font-medium text-blue-900">
          💡 Pattern: HRMS-connected accounts in this industry close 33% faster with 67% win rate!
        </p>
      </div>
    </div>
  );
};

export default SimilarAccountsPanel;
