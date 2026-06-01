import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Save } from 'lucide-react';

interface DealStage {
  id: string;
  name: string;
  probability: number;
  avgDays: number;
  color: string;
  colorName: string;
  locked?: boolean;
}

const PipelineSettings: React.FC = () => {
  const [stages, setStages] = useState<DealStage[]>([
    { id: '1', name: 'PROSPECTING', probability: 10, avgDays: 7, color: '#3b82f6', colorName: 'Blue' },
    { id: '2', name: 'QUALIFIED', probability: 25, avgDays: 14, color: '#8b5cf6', colorName: 'Purple' },
    { id: '3', name: 'PROPOSAL', probability: 50, avgDays: 10, color: '#f59e0b', colorName: 'Orange' },
    { id: '4', name: 'NEGOTIATION', probability: 75, avgDays: 7, color: '#10b981', colorName: 'Green' },
    { id: '5', name: 'CLOSED-WON', probability: 100, avgDays: 0, color: '#059669', colorName: 'Dark Green', locked: true },
    { id: '6', name: 'CLOSED-LOST', probability: 0, avgDays: 0, color: '#dc2626', colorName: 'Red', locked: true }
  ]);

  const [lostReasons, setLostReasons] = useState([
    'Budget constraints',
    'Chose competitor',
    'No response / Ghosted',
    'Timing not right',
    'Not a good fit',
    'Other'
  ]);

  const [wonReasons, setWonReasons] = useState([
    'Best price',
    'Best features',
    'HRMS connection (warm lead)',
    'Referral / Relationship',
    'Superior support'
  ]);

  const [autoMoveToClosed, setAutoMoveToClosed] = useState(true);
  const [autoMoveToLost, setAutoMoveToLost] = useState(false);
  const [staleAlerts, setStaleAlerts] = useState(true);

  const handleEditStage = (id: string) => {
    alert(`Editing stage ${id}...`);
  };

  const handleDeleteStage = (id: string) => {
    if (window.confirm('Are you sure you want to delete this stage?')) {
      setStages(stages.filter(s => s.id !== id));
      alert('Stage deleted successfully!');
    }
  };

  const handleMoveStageUp = (index: number) => {
    if (index === 0) return;
    const newStages = [...stages];
    [newStages[index - 1], newStages[index]] = [newStages[index], newStages[index - 1]];
    setStages(newStages);
  };

  const handleMoveStageDown = (index: number) => {
    if (index >= stages.length - 3) return;
    const newStages = [...stages];
    [newStages[index], newStages[index + 1]] = [newStages[index + 1], newStages[index]];
    setStages(newStages);
  };

  const handleAddStage = () => {
    alert('Add new stage dialog would open here...');
  };

  const handleEditReason = (type: string, reason: string) => {
    alert(`Editing ${type} reason: ${reason}`);
  };

  const handleDeleteReason = (type: string, reason: string) => {
    if (window.confirm(`Delete this ${type} reason?`)) {
      if (type === 'lost') {
        setLostReasons(lostReasons.filter(r => r !== reason));
      } else {
        setWonReasons(wonReasons.filter(r => r !== reason));
      }
      alert('Reason deleted successfully!');
    }
  };

  const handleAddReason = (type: string) => {
    alert(`Add new ${type} reason dialog would open here...`);
  };

  const handleSaveChanges = () => {
    alert('All pipeline settings saved successfully!');
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pipeline Settings (Controls Module 5 - Deals)</h2>
        <p className="text-sm text-gray-600 mt-1">Configure stages, reasons, and automation rules for your sales pipeline</p>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">DEAL STAGES</h3>
            <button
              onClick={handleAddStage}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Stage
            </button>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Define the stages of your sales pipeline:</p>

            <div className="space-y-3">
              {stages.map((stage, index) => (
                <div key={stage.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-white p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: stage.color }}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {index + 1}. {stage.name}
                          </h4>
                          <div className="mt-2 space-y-1 text-sm text-gray-700">
                            <div>Win Probability: <span className="font-medium">{stage.probability}%</span></div>
                            {!stage.locked && (
                              <div>Average Days in Stage: <span className="font-medium">{stage.avgDays} days</span></div>
                            )}
                            <div>Color: <span className="font-medium">{stage.color} ({stage.colorName})</span></div>
                          </div>
                          {stage.locked && (
                            <div className="text-xs text-gray-500 italic mt-2">(Cannot be deleted or moved)</div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditStage(stage.id)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                        >
                          [Edit]
                        </button>
                        {!stage.locked && (
                          <>
                            <button
                              onClick={() => handleDeleteStage(stage.id)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
                            >
                              [Delete]
                            </button>
                            <div className="flex flex-col">
                              <button
                                onClick={() => handleMoveStageUp(index)}
                                disabled={index === 0}
                                className="px-2 text-gray-600 hover:bg-gray-100 rounded-t border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleMoveStageDown(index)}
                                disabled={index >= stages.length - 3}
                                className="px-2 text-gray-600 hover:bg-gray-100 rounded-b border border-gray-200 border-t-0 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleSaveChanges}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">LOST REASONS</h3>
            <button
              onClick={() => handleAddReason('lost')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Reason
            </button>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Track why deals are lost:</p>

            <div className="space-y-2">
              {lostReasons.map((reason) => (
                <div key={reason} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">•</span>
                    <span className="text-gray-900">{reason}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditReason('lost', reason)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                    >
                      [Edit]
                    </button>
                    <button
                      onClick={() => handleDeleteReason('lost', reason)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
                    >
                      [Del]
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4 italic">(Used in Module 5 when marking deal as lost)</p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">WON REASONS (Optional)</h3>
            <button
              onClick={() => handleAddReason('won')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Reason
            </button>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Track why deals are won:</p>

            <div className="space-y-2">
              {wonReasons.map((reason) => (
                <div key={reason} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">•</span>
                    <span className="text-gray-900">{reason}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditReason('won', reason)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                    >
                      [Edit]
                    </button>
                    <button
                      onClick={() => handleDeleteReason('won', reason)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
                    >
                      [Del]
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">PIPELINE AUTOMATION</h3>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Auto-move deals:</p>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoMoveToClosed}
                    onChange={(e) => setAutoMoveToClosed(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm text-gray-900">Auto-move to "Closed-Won" when payment received</div>
                    <div className="text-xs text-gray-500">(via Payment Connector - Module 10)</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoMoveToLost}
                    onChange={(e) => setAutoMoveToLost(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="text-sm text-gray-900">Auto-move to "Closed-Lost" after 90 days in Proposal</div>
                </label>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Stale deal alerts:</p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={staleAlerts}
                  onChange={(e) => setStaleAlerts(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="text-sm text-gray-900">Alert when deal has no activity for 5+ days</div>
              </label>
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleSaveChanges}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineSettings;
