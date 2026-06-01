import React from 'react';
import { Building2, TrendingUp, Users, Target, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';

interface HRMSIntelligencePanelProps {
  hasConnection: boolean;
  connectedSince?: string;
  contactName?: string;
  contactRole?: string;
  employeeCount?: number;
  departments?: string[];
  recentHires?: number;
  attritionRate?: number;
}

const HRMSIntelligencePanel: React.FC<HRMSIntelligencePanelProps> = ({
  hasConnection,
  connectedSince = 'June 2024',
  contactName = 'Sarah Chen',
  contactRole = 'VP of HR',
  employeeCount = 450,
  departments = ['Engineering', 'Sales', 'Marketing', 'Operations', 'HR'],
  recentHires = 35,
  attritionRate = 8
}) => {
  if (!hasConnection) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">HRMS INTELLIGENCE</h3>
          </div>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
            UNIQUE DIFFERENTIATOR
          </span>
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-bold text-green-900">HRMS Connected</span>
          </div>
          <p className="text-sm text-green-800">
            Connected since {connectedSince} via {contactName} ({contactRole})
          </p>
        </div>

        {/* Key Insights */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Key Insights</h4>

          <div className="space-y-4">
            {/* Employee Growth */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900">Strong Growth Trajectory</p>
                  <p className="text-sm text-blue-800 mt-1">
                    {recentHires} new hires in last 90 days ({Math.round((recentHires / employeeCount) * 100)}% growth)
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Current headcount: {employeeCount} employees
                  </p>
                </div>
              </div>
            </div>

            {/* Attrition Rate */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-900">Low Attrition Rate</p>
                  <p className="text-sm text-green-800 mt-1">
                    {attritionRate}% annual attrition (Industry avg: 15%)
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Indicates high employee satisfaction
                  </p>
                </div>
              </div>
            </div>

            {/* Department Structure */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Users className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Department Structure</p>
                  <p className="text-sm text-gray-800 mt-1">
                    {departments.length} active departments
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {departments.map((dept, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategic Implications */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Strategic Implications</h4>

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Budget Timing</p>
                <p className="text-sm text-gray-700 mt-1">
                  Rapid hiring suggests increased budget allocation. Perfect timing for solution expansion.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Opportunity Sizing</p>
                <p className="text-sm text-gray-700 mt-1">
                  With {employeeCount} employees and low attrition, company is stable and growing. Ideal for long-term partnership.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Competitive Advantage</p>
                <p className="text-sm text-gray-700 mt-1">
                  This HRMS connection gives you unique insights competitors don't have. Leverage it!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-bold text-gray-900 mb-4">Recommended Actions</h4>

          <div className="space-y-3">
            {/* Action 1 */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    1. Leverage growth data in proposal
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Highlight scalability for {recentHires}+ new hires
                  </p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap ml-2">
                  Create Doc
                </button>
              </div>
            </div>

            {/* Action 2 */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    2. Position as retention tool
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Low {attritionRate}% attrition = product helps employee satisfaction
                  </p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap ml-2">
                  Add Note
                </button>
              </div>
            </div>

            {/* Action 3 */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    3. Connect with {contactName}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Reinforce relationship with your HRMS champion
                  </p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap ml-2">
                  Schedule Call
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Why This Matters */}
        <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm font-bold text-purple-900 mb-2">Why This Matters:</p>
          <p className="text-sm text-purple-800">
            Most salespeople guess about company health. You have real data showing {contactName}'s company is growing fast ({recentHires} hires) with happy employees ({attritionRate}% attrition). This is a major competitive advantage!
          </p>
        </div>
      </div>
    </div>
  );
};

export default HRMSIntelligencePanel;
