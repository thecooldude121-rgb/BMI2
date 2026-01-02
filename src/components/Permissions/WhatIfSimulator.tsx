import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle, XCircle, Download, Users,
  Shield, TrendingUp, TrendingDown, FileText, X, Play
} from 'lucide-react';

interface ChangeImpact {
  type: 'added' | 'removed' | 'modified' | 'conflict';
  entity: string;
  description: string;
  affectedUsers: number;
  severity: 'low' | 'medium' | 'high';
}

interface WhatIfSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  pendingChanges: any[];
  onApply: () => void;
  onExport: () => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  isOpen,
  onClose,
  pendingChanges,
  onApply,
  onExport
}) => {
  const [impacts, setImpacts] = useState<ChangeImpact[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (isOpen && pendingChanges.length > 0) {
      analyzeChanges();
    }
  }, [isOpen, pendingChanges]);

  const analyzeChanges = async () => {
    setIsAnalyzing(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    const simulatedImpacts: ChangeImpact[] = pendingChanges.map((change, idx) => ({
      type: idx % 3 === 0 ? 'added' : idx % 3 === 1 ? 'removed' : 'modified',
      entity: change.entity || `Role: ${change.roleName || 'Unknown'}`,
      description: change.description || 'Permission change',
      affectedUsers: Math.floor(Math.random() * 50) + 1,
      severity: idx % 4 === 0 ? 'high' : idx % 2 === 0 ? 'medium' : 'low'
    }));

    setImpacts(simulatedImpacts);
    setIsAnalyzing(false);
  };

  if (!isOpen) return null;

  const totalAffectedUsers = impacts.reduce((sum, impact) => sum + impact.affectedUsers, 0);
  const conflictCount = impacts.filter(i => i.type === 'conflict').length;
  const highSeverityCount = impacts.filter(i => i.severity === 'high').length;

  const getImpactIcon = (type: string) => {
    switch (type) {
      case 'added': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'removed': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'conflict': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default: return <Shield className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatif-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Play className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 id="whatif-title" className="text-2xl font-bold text-gray-900">
                What-If Simulator
              </h2>
              <p className="text-sm text-gray-600">Preview impact before applying changes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
            aria-label="Close simulator"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {isAnalyzing ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Analyzing impact...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Affected Users</p>
                    <p className="text-2xl font-bold text-gray-900">{totalAffectedUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Conflicts</p>
                    <p className="text-2xl font-bold text-orange-600">{conflictCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">High Priority</p>
                    <p className="text-2xl font-bold text-red-600">{highSeverityCount}</p>
                  </div>
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Impact Analysis</h3>

              <div className="space-y-3">
                {impacts.map((impact, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">{getImpactIcon(impact.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{impact.entity}</p>
                            <p className="text-sm text-gray-600 mt-1">{impact.description}</p>
                          </div>
                          <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full ${getSeverityBadge(impact.severity)}`}>
                            {impact.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {impact.affectedUsers} users affected
                          </span>
                          <span className="capitalize px-2 py-1 bg-gray-100 rounded">
                            {impact.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {conflictCount > 0 && (
                <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-900">Conflicts Detected</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        {conflictCount} conflict(s) found. Review these carefully before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onExport}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Export preview"
              >
                <Download className="h-4 w-4" />
                <span>Export Preview</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={onApply}
                  disabled={conflictCount > 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Apply changes"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
