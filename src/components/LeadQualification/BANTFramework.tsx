import React, { useState } from 'react';
import { Clipboard, DollarSign, User, Target, Clock } from 'lucide-react';

interface BANTData {
  budget: {
    status: string;
    range: string;
    timeline: string;
    notes: string;
  };
  authority: {
    status: string;
    role: string;
    stakeholders: string;
    process: string;
  };
  need: {
    status: string;
    painPoints: string[];
    impact: string;
  };
  timeline: {
    status: string;
    closeDate: string;
    milestones: Array<{ date: string; description: string }>;
    drivers: string;
  };
}

interface BANTFrameworkProps {
  bantData: BANTData;
  onUpdate: (data: BANTData) => void;
}

const BANTFramework: React.FC<BANTFrameworkProps> = ({ bantData, onUpdate }) => {
  const [localData, setLocalData] = useState<BANTData>(bantData);

  const calculateBANTScore = () => {
    let budgetScore = 0;
    let authorityScore = 0;
    let needScore = 0;
    let timelineScore = 0;

    if (localData.budget.status === 'confirmed') budgetScore = 5;
    else if (localData.budget.status === 'likely') budgetScore = 4;
    else if (localData.budget.status === 'unknown') budgetScore = 2;

    if (localData.authority.status === 'decision_maker') authorityScore = 5;
    else if (localData.authority.status === 'influencer') authorityScore = 4;
    else if (localData.authority.status === 'end_user') authorityScore = 2;

    if (localData.need.status === 'urgent') needScore = 5;
    else if (localData.need.status === 'important') needScore = 4;
    else if (localData.need.status === 'nice_to_have') needScore = 2;

    if (localData.timeline.status === 'immediate') timelineScore = 5;
    else if (localData.timeline.status === 'short_term') timelineScore = 4;
    else if (localData.timeline.status === 'long_term') timelineScore = 2;

    return { budgetScore, authorityScore, needScore, timelineScore };
  };

  const scores = calculateBANTScore();
  const totalScore = scores.budgetScore + scores.authorityScore + scores.needScore + scores.timelineScore;

  const getScoreDots = (score: number): JSX.Element[] => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < score ? 'text-green-500' : 'text-gray-300'}>
        ●
      </span>
    ));
  };

  const handleUpdate = (section: keyof BANTData, field: string, value: any) => {
    const updated = {
      ...localData,
      [section]: {
        ...localData[section],
        [field]: value
      }
    };
    setLocalData(updated);
    onUpdate(updated);
  };

  const togglePainPoint = (point: string) => {
    const painPoints = localData.need.painPoints.includes(point)
      ? localData.need.painPoints.filter(p => p !== point)
      : [...localData.need.painPoints, point];

    handleUpdate('need', 'painPoints', painPoints);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <Clipboard className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            BANT QUALIFICATION FRAMEWORK
          </h2>
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm text-gray-600 mb-6">
          Complete the BANT assessment to qualify this lead:
        </p>

        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">
                BUDGET (Has the prospect allocated budget?)
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
                <div className="flex gap-4">
                  {['confirmed', 'likely', 'unknown', 'no_budget'].map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="budget-status"
                        checked={localData.budget.status === status}
                        onChange={() => handleUpdate('budget', 'status', status)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Range:
                </label>
                <select
                  value={localData.budget.range}
                  onChange={(e) => handleUpdate('budget', 'range', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="$0 - $25K">$0 - $25K</option>
                  <option value="$25K - $50K">$25K - $50K</option>
                  <option value="$50K - $100K">$50K - $100K</option>
                  <option value="$100K - $250K">$100K - $250K</option>
                  <option value="$250K+">$250K+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Timeline:
                </label>
                <select
                  value={localData.budget.timeline}
                  onChange={(e) => handleUpdate('budget', 'timeline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Q1 2025">Q1 2025</option>
                  <option value="Q2 2025">Q2 2025</option>
                  <option value="Q3 2025">Q3 2025</option>
                  <option value="Q4 2025">Q4 2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes:</label>
                <textarea
                  value={localData.budget.notes}
                  onChange={(e) => handleUpdate('budget', 'notes', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Budget details and notes..."
                />
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                AUTHORITY (Is the prospect a decision-maker?)
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
                <div className="flex gap-4">
                  {['decision_maker', 'influencer', 'end_user', 'unknown'].map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="authority-status"
                        checked={localData.authority.status === status}
                        onChange={() => handleUpdate('authority', 'status', status)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decision-Making Role:
                </label>
                <select
                  value={localData.authority.role}
                  onChange={(e) => handleUpdate('authority', 'role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Final Approver">Final Approver</option>
                  <option value="Budget Holder">Budget Holder</option>
                  <option value="Influencer">Influencer</option>
                  <option value="Champion">Champion</option>
                  <option value="End User">End User</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Stakeholders:
                </label>
                <input
                  type="text"
                  value={localData.authority.stakeholders}
                  onChange={(e) => handleUpdate('authority', 'stakeholders', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="List other stakeholders..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Process:
                </label>
                <textarea
                  value={localData.authority.process}
                  onChange={(e) => handleUpdate('authority', 'process', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the approval process..."
                />
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">
                NEED (Does the prospect have a clear business need?)
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
                <div className="flex gap-4">
                  {['urgent', 'important', 'nice_to_have', 'none'].map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="need-status"
                        checked={localData.need.status === status}
                        onChange={() => handleUpdate('need', 'status', status)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pain Points:
                </label>
                <div className="space-y-2">
                  {[
                    'Manual financial reporting processes',
                    'Lack of real-time analytics',
                    'Scaling challenges with current tools',
                    'Compliance requirements',
                    'Integration with existing systems'
                  ].map((point) => (
                    <label key={point} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localData.need.painPoints.includes(point)}
                        onChange={() => togglePainPoint(point)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{point}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Impact:
                </label>
                <textarea
                  value={localData.need.impact}
                  onChange={(e) => handleUpdate('need', 'impact', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the business impact..."
                />
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">
                TIMELINE (When does the prospect need a solution?)
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
                <div className="flex gap-4 flex-wrap">
                  {[
                    { value: 'immediate', label: 'Immediate (0-30 days)' },
                    { value: 'short_term', label: 'Short-term (1-3 mo)' },
                    { value: 'long_term', label: 'Long-term (3-6 mo)' },
                    { value: 'no_timeline', label: 'No Timeline' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="timeline-status"
                        checked={localData.timeline.status === option.value}
                        onChange={() => handleUpdate('timeline', 'status', option.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Close Date:
                </label>
                <input
                  type="date"
                  value={localData.timeline.closeDate}
                  onChange={(e) => handleUpdate('timeline', 'closeDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Milestones:
                </label>
                <div className="space-y-2">
                  {localData.timeline.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="font-medium">• {milestone.date}:</span>
                      <span>{milestone.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Drivers:
                </label>
                <textarea
                  value={localData.timeline.drivers}
                  onChange={(e) => handleUpdate('timeline', 'drivers', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What's driving the urgency?"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📊</span>
              <h3 className="font-semibold text-gray-900">BANT SCORE SUMMARY</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Budget:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm space-x-0.5">{getScoreDots(scores.budgetScore)}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {scores.budgetScore}/5
                  </span>
                  <span className="text-xs text-gray-600">
                    ({localData.budget.status.replace('_', ' ')})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Authority:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm space-x-0.5">{getScoreDots(scores.authorityScore)}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {scores.authorityScore}/5
                  </span>
                  <span className="text-xs text-gray-600">
                    ({localData.authority.status.replace('_', ' ')})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Need:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm space-x-0.5">{getScoreDots(scores.needScore)}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {scores.needScore}/5
                  </span>
                  <span className="text-xs text-gray-600">
                    ({localData.need.status.replace('_', ' ')})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Timeline:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm space-x-0.5">{getScoreDots(scores.timelineScore)}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {scores.timelineScore}/5
                  </span>
                  <span className="text-xs text-gray-600">
                    ({localData.timeline.status.replace('_', ' ')})
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-green-200 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Overall BANT:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {totalScore}/20
                    </span>
                    <span className={`text-sm font-semibold ${
                      totalScore >= 18 ? 'text-green-600' :
                      totalScore >= 15 ? 'text-blue-600' :
                      totalScore >= 12 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {totalScore >= 18 ? '✅ HIGHLY QUALIFIED' :
                       totalScore >= 15 ? '✅ QUALIFIED' :
                       totalScore >= 12 ? '⚠️ NEEDS WORK' :
                       '❌ NOT QUALIFIED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BANTFramework;
