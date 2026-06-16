import React, { useState } from 'react';
import { PauseCircle } from 'lucide-react';
import { useStalledConfig } from '../../../hooks/useStalledConfig';
import { DEFAULT_STALLED_CONFIG, StalledConfig } from '../../../utils/stalledDeal';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        checked ? 'bg-indigo-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

const StalledDealRules: React.FC = () => {
  const { config, setConfig, resetConfig } = useStalledConfig();
  const [draft, setDraft] = useState<StalledConfig>(() => ({
    ...config,
    criteria: {
      noActivity:   { ...config.criteria.noActivity },
      noNextStep:   { ...config.criteria.noNextStep },
      closeOverdue: { ...config.criteria.closeOverdue },
      dealAge:      { ...config.criteria.dealAge },
    },
  }));
  const [saved, setSaved] = useState(false);

  const updateCriterion = <K extends keyof StalledConfig['criteria']>(
    key: K,
    update: Partial<StalledConfig['criteria'][K]>,
  ) => {
    setDraft(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [key]: { ...prev.criteria[key], ...update },
      },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setConfig(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const fresh: StalledConfig = {
      ...DEFAULT_STALLED_CONFIG,
      criteria: {
        noActivity:   { ...DEFAULT_STALLED_CONFIG.criteria.noActivity },
        noNextStep:   { ...DEFAULT_STALLED_CONFIG.criteria.noNextStep },
        closeOverdue: { ...DEFAULT_STALLED_CONFIG.criteria.closeOverdue },
        dealAge:      { ...DEFAULT_STALLED_CONFIG.criteria.dealAge },
      },
    };
    setDraft(fresh);
    resetConfig();
    setSaved(false);
  };

  const dimmed = !draft.enabled ? 'opacity-50 pointer-events-none select-none' : '';

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <PauseCircle className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-gray-900">Stalled Deal Rules</h2>
      </div>
      <p className="text-sm text-gray-500 mb-0.5">
        Define when a deal is flagged as stalled. Rules use OR logic — any matching condition flags the deal.
      </p>
      <p className="text-xs text-amber-600 mb-6">Settings saved locally to this browser.</p>

      <div className="space-y-0.5">
        {/* Master toggle */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-800">Enable stall detection</p>
            <p className="text-xs text-gray-400 mt-0.5">When off, no deals are flagged as stalled</p>
          </div>
          <Toggle
            checked={draft.enabled}
            onChange={v => { setDraft(prev => ({ ...prev, enabled: v })); setSaved(false); }}
          />
        </div>

        <div className={dimmed}>
          {/* No Activity */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-gray-800">No recent activity</p>
              <p className="text-xs text-gray-400 mt-0.5">Days since last contact or logged activity</p>
            </div>
            <div className="flex items-center gap-3">
              {draft.criteria.noActivity.enabled && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={draft.criteria.noActivity.threshold}
                    onChange={e =>
                      updateCriterion('noActivity', { threshold: Math.max(1, Number(e.target.value) || 1) })
                    }
                    className="w-16 text-sm text-center border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-xs text-gray-500 whitespace-nowrap">days</span>
                </div>
              )}
              <Toggle
                checked={draft.criteria.noActivity.enabled}
                onChange={v => updateCriterion('noActivity', { enabled: v })}
              />
            </div>
          </div>

          {/* No Next Step */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-gray-800">No next step defined</p>
              <p className="text-xs text-gray-400 mt-0.5">Deal has no next step or follow-up action set</p>
            </div>
            <Toggle
              checked={draft.criteria.noNextStep.enabled}
              onChange={v => updateCriterion('noNextStep', { enabled: v })}
            />
          </div>

          {/* Close Date Overdue */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-gray-800">Close date has passed</p>
              <p className="text-xs text-gray-400 mt-0.5">Expected close date is in the past</p>
            </div>
            <Toggle
              checked={draft.criteria.closeOverdue.enabled}
              onChange={v => updateCriterion('closeOverdue', { enabled: v })}
            />
          </div>

          {/* Deal Age */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-gray-800">Deal age exceeds threshold</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Days since deal was created{' '}
                <span className="italic">(stage-level tracking coming soon)</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {draft.criteria.dealAge.enabled && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={draft.criteria.dealAge.threshold}
                    onChange={e =>
                      updateCriterion('dealAge', { threshold: Math.max(1, Number(e.target.value) || 1) })
                    }
                    className="w-16 text-sm text-center border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-xs text-gray-500 whitespace-nowrap">days</span>
                </div>
              )}
              <Toggle
                checked={draft.criteria.dealAge.enabled}
                onChange={v => updateCriterion('dealAge', { enabled: v })}
              />
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Changes take effect immediately — navigate back to Deals to see the updated count.
      </p>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={handleReset}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Reset to defaults
        </button>
        <button
          onClick={handleSave}
          className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {saved ? 'Saved!' : 'Save rules'}
        </button>
      </div>
    </div>
  );
};

export default StalledDealRules;
