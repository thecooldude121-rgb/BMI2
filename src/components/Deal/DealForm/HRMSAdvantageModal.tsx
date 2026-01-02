import React from 'react';
import { X, Briefcase, TrendingUp, Clock, Award } from 'lucide-react';

interface HRMSAdvantageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseAdvantage: () => void;
  hrmsData: {
    recruitedPerson: string;
    title?: string;
    company: string;
    recruitmentDate: string;
  };
}

export const HRMSAdvantageModal: React.FC<HRMSAdvantageModalProps> = ({
  isOpen,
  onClose,
  onUseAdvantage,
  hrmsData
}) => {
  if (!isOpen) return null;

  const formattedDate = new Date(hrmsData.recruitmentDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">🏢 HRMS CONNECTION DETECTED!</h2>
                <p className="text-orange-100 text-sm">Your #1 competitive advantage</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">Warm Connection Identified</h3>
                <p className="text-blue-800 leading-relaxed">
                  <span className="font-bold">{hrmsData.recruitedPerson}</span>
                  {hrmsData.title && <span> ({hrmsData.title})</span>} was recruited from{' '}
                  <span className="font-bold">{hrmsData.company}</span> on{' '}
                  <span className="font-bold">{formattedDate}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300">
            <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center space-x-2">
              <span>💡</span>
              <span>WARM INTRO ADVANTAGE:</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-green-900 text-lg">33% higher close rate</div>
                  <div className="text-sm text-green-700">Historical data from 500+ HRMS deals</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-green-900 text-lg">Win probability boosted to 75%</div>
                  <div className="text-sm text-green-700">+15% advantage from warm introduction</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-green-900 text-lg">Faster sales cycle (avg 35 days)</div>
                  <div className="text-sm text-green-700">vs. 50 days for cold outreach</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-5 border-2 border-orange-200">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">✅</span>
              <h3 className="text-base font-bold text-orange-900">Auto-Actions Applied:</h3>
            </div>
            <div className="space-y-2 text-sm text-orange-800">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Source automatically set to <span className="font-bold">"HRMS (Recruitment)"</span></span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Win probability increased by <span className="font-bold">+15%</span></span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Priority suggested as <span className="font-bold">"High"</span></span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
            <h4 className="text-sm font-bold text-blue-900 mb-2">💡 Recommended Next Steps:</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0">1.</span>
                <span>Reference the HRMS connection in your outreach message</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0">2.</span>
                <span>Schedule a warm introduction call with {hrmsData.recruitedPerson}</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="flex-shrink-0">3.</span>
                <span>Leverage shared context to build rapport faster</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-end space-x-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onUseAdvantage}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 font-bold transition-colors shadow-lg flex items-center space-x-2"
          >
            <Briefcase className="h-5 w-5" />
            <span>Use HRMS Advantage</span>
          </button>
        </div>
      </div>
    </div>
  );
};
