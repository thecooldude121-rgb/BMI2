import React from 'react';
import { DollarSign, X, TrendingUp } from 'lucide-react';

interface FundingSectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  onAddFundingRound: () => void;
  onRemoveFundingRound: (id: string) => void;
  onUpdateFundingRound: (id: string, field: string, value: any) => void;
}

const FundingSection: React.FC<FundingSectionProps> = ({
  formData,
  onChange,
  onAddFundingRound,
  onRemoveFundingRound,
  onUpdateFundingRound,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
        Funding Information
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Funding Raised
          </label>
          <div className="flex items-center">
            <span className="text-gray-600 mr-2">$</span>
            <input
              type="number"
              value={formData.totalFunding}
              onChange={(e) => onChange('totalFunding', parseFloat(e.target.value) || 0)}
              className="w-48 px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="15000000"
            />
          </div>
        </div>

        {formData.fundingRounds && formData.fundingRounds.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Funding Rounds
            </label>
            <div className="space-y-4">
              {formData.fundingRounds.map((round: any, index: number) => (
                <div key={round.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Round #{index + 1}</span>
                    <button
                      onClick={() => onRemoveFundingRound(round.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Round Name
                      </label>
                      <input
                        type="text"
                        value={round.roundName}
                        onChange={(e) => onUpdateFundingRound(round.id, 'roundName', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        placeholder="Series A"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <div className="flex items-center">
                        <span className="text-gray-600 mr-2 text-sm">$</span>
                        <input
                          type="number"
                          value={round.amount}
                          onChange={(e) => onUpdateFundingRound(round.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          placeholder="10000000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={round.date.month}
                          onChange={(e) => onUpdateFundingRound(round.id, 'date', { ...round.date, month: e.target.value })}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        >
                          <option value="">Month</option>
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                        <select
                          value={round.date.year}
                          onChange={(e) => onUpdateFundingRound(round.id, 'date', { ...round.date, year: parseInt(e.target.value) })}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        >
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {round.date.year === new Date().getFullYear() && (
                      <label className="flex items-center text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={round.isRecent || false}
                          onChange={(e) => onUpdateFundingRound(round.id, 'isRecent', e.target.checked)}
                          className="mr-2"
                        />
                        Recent Round
                      </label>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Lead Investor
                      </label>
                      <input
                        type="text"
                        value={round.leadInvestor}
                        onChange={(e) => onUpdateFundingRound(round.id, 'leadInvestor', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        placeholder="Sequoia Capital"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Other Investors
                      </label>
                      <input
                        type="text"
                        value={round.otherInvestors}
                        onChange={(e) => onUpdateFundingRound(round.id, 'otherInvestors', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        placeholder="a16z, Y Combinator"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onAddFundingRound}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          + Add Funding Round
        </button>

        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Valuation
          </label>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <span className="text-gray-600 mr-2">$</span>
              <input
                type="number"
                value={formData.estimatedValuation}
                onChange={(e) => onChange('estimatedValuation', parseFloat(e.target.value) || 0)}
                className="w-48 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="50000000"
              />
            </div>
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={formData.isValuationEstimated}
                onChange={(e) => onChange('isValuationEstimated', e.target.checked)}
                className="mr-2"
              />
              Estimated
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundingSection;
