import { useState } from 'react';
import { PreviewBanner } from '../../components/common/PreviewBanner';
import type { AssignmentRule } from '../../utils/assignmentRules/types';
import { createBlankRule, resetRulesToDefaults } from '../../utils/assignmentRules/rulesStore';
import RuleList from '../../components/AssignmentRules/RuleList';
import RuleEditor from '../../components/AssignmentRules/RuleEditor';
import TerritoryManager from '../../components/AssignmentRules/TerritoryManager';
import SimulationPanel from '../../components/AssignmentRules/SimulationPanel';

type Tab = 'rules' | 'territories' | 'simulation';

export default function AssignmentRulesPage() {
  const [tab, setTab] = useState<Tab>('rules');
  const [editing, setEditing] = useState<AssignmentRule | null>(null);
  const [listKey, setListKey] = useState(0);

  function refresh() { setListKey(k => k + 1); }

  function handleSave() { setEditing(null); refresh(); }
  function handleNew() { setEditing(createBlankRule()); }
  function handleEdit(rule: AssignmentRule) { setEditing(rule); }

  function handleReset() {
    if (!confirm('Reset all assignment rules to factory defaults? All custom rules will be deleted.')) return;
    resetRulesToDefaults();
    refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 pt-4">
        <PreviewBanner
          detail="These rules are stored in this browser only and are NOT applied to any lead. New leads are not routed by them."
          insteadTry="Server-side assignment rules on the real user list are coming soon. Choose an owner on the lead form."
        />
      </div>
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assignment Rules</h1>
              {/* It said "Automatically route incoming leads". Nothing applies these
                  rules: they live in this browser, and no lead create path reads
                  them (H2, 2026-10-14). */}
              <p className="text-sm text-gray-500 mt-1">
                Draft routing rules by source, score and territory, and try them in the simulator.
              </p>
            </div>
            {tab === 'rules' && !editing && (
              <button onClick={handleReset}
                className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-lg transition-colors">
                Reset to Defaults
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 border-b border-gray-200 -mb-px">
            {([
              { id: 'rules',       label: 'Rules' },
              { id: 'territories', label: 'Territories' },
              { id: 'simulation',  label: 'Simulation' },
            ] as { id: Tab; label: string }[]).map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setEditing(null); }}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        {tab === 'rules' && !editing && (
          <RuleList onEdit={handleEdit} onNew={handleNew} refresh={listKey} />
        )}

        {tab === 'rules' && editing && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <RuleEditor rule={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
          </div>
        )}

        {tab === 'territories' && <TerritoryManager />}

        {tab === 'simulation' && <SimulationPanel />}
      </div>
    </div>
  );
}
