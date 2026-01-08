import React from 'react';
import { CheckCircle, XCircle, Save, ArrowLeft } from 'lucide-react';

interface QualificationDecisionProps {
  aiScore: number;
  bantScore: number;
  finalStatus: string;
  assignedTo: string;
  notes: string;
  onUpdateStatus: (status: string) => void;
  onUpdateAssignee: (assignee: string) => void;
  onUpdateNotes: (notes: string) => void;
  onQualify: () => void;
  onDisqualify: () => void;
  onSaveDraft: () => void;
}

const QualificationDecision: React.FC<QualificationDecisionProps> = ({
  aiScore,
  bantScore,
  finalStatus,
  assignedTo,
  notes,
  onUpdateStatus,
  onUpdateAssignee,
  onUpdateNotes,
  onQualify,
  onDisqualify,
  onSaveDraft
}) => {
  const isHighlyQualified = aiScore >= 85 && bantScore >= 18;

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            QUALIFICATION DECISION
          </h2>
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm text-gray-600 mb-6">
          Based on AI Score ({aiScore}/100) and BANT Assessment ({bantScore}/20):
        </p>

        <div className={`rounded-lg p-6 mb-6 ${
          isHighlyQualified
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300'
            : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-6 w-6 text-gray-900" />
            <h3 className="text-lg font-bold text-gray-900">
              {isHighlyQualified ? 'RECOMMENDED ACTION: QUALIFY LEAD' : 'RECOMMENDED ACTION: NEEDS MORE INFO'}
            </h3>
          </div>

          {isHighlyQualified ? (
            <>
              <p className="text-sm text-gray-700 mb-4">
                This lead shows strong buying signals:
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>High AI score ({aiScore}/100)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Perfect BANT score ({bantScore}/20)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>C-level decision maker</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Confirmed budget ($75K)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Immediate timeline (30 days)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>HRMS warm lead (33% higher conversion)</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">Suggested Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Schedule product demo (by Jan 15)</li>
                  <li>Prepare custom proposal</li>
                  <li>Assign to senior sales rep</li>
                  <li>Sync to CRM immediately</li>
                </ol>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-4">
                This lead needs additional qualification:
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-yellow-600">⚠️</span>
                  <span>Moderate AI score ({aiScore}/100)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-yellow-600">⚠️</span>
                  <span>BANT assessment incomplete</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">Recommended Actions:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Conduct discovery call to confirm BANT</li>
                  <li>Verify budget and timeline</li>
                  <li>Identify all stakeholders</li>
                  <li>Re-assess after gathering more information</li>
                </ol>
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Final Qualification Status:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="final-status"
                  value="qualified"
                  checked={finalStatus === 'qualified'}
                  onChange={(e) => onUpdateStatus(e.target.value)}
                  className="h-4 w-4 text-emerald-600"
                />
                <span className={`text-sm font-medium ${finalStatus === 'qualified' ? 'text-emerald-600' : 'text-gray-700'}`}>
                  Qualified
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="final-status"
                  value="needs_more_info"
                  checked={finalStatus === 'needs_more_info'}
                  onChange={(e) => onUpdateStatus(e.target.value)}
                  className="h-4 w-4 text-yellow-500"
                />
                <span className={`text-sm font-medium ${finalStatus === 'needs_more_info' ? 'text-yellow-600' : 'text-gray-700'}`}>
                  Needs More Info
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="final-status"
                  value="disqualified"
                  checked={finalStatus === 'disqualified'}
                  onChange={(e) => onUpdateStatus(e.target.value)}
                  className="h-4 w-4 text-red-500"
                />
                <span className={`text-sm font-medium ${finalStatus === 'disqualified' ? 'text-red-600' : 'text-gray-700'}`}>
                  Disqualified
                </span>
              </label>
            </div>
          </div>

          {finalStatus === 'disqualified' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disqualification Reason (if applicable):
              </label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide reason for disqualification..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Sales Rep:
            </label>
            <select
              value={assignedTo}
              onChange={(e) => onUpdateAssignee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="John Smith (Senior AE)">John Smith (Senior AE)</option>
              <option value="Emily Chen (AE)">Emily Chen (AE)</option>
              <option value="Michael Torres (Senior AE)">Michael Torres (Senior AE)</option>
              <option value="Sarah Johnson (AE)">Sarah Johnson (AE)</option>
              <option value="David Kim (Team Lead)">David Kim (Team Lead)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes:
            </label>
            <textarea
              value={notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any additional notes or context..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onQualify}
              disabled={finalStatus !== 'qualified'}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                finalStatus === 'qualified'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              Qualify & Sync to CRM
            </button>

            <button
              onClick={onSaveDraft}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              <Save className="h-5 w-5" />
              Save as Draft
            </button>

            <button
              onClick={onDisqualify}
              disabled={finalStatus !== 'disqualified'}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                finalStatus === 'disqualified'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <XCircle className="h-5 w-5" />
              Disqualify Lead
            </button>

            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium ml-auto"
            >
              <ArrowLeft className="h-5 w-5" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Target: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <circle cx="12" cy="12" r="6" strokeWidth="2" />
    <circle cx="12" cy="12" r="2" strokeWidth="2" />
  </svg>
);

export default QualificationDecision;
