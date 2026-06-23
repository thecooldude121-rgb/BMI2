import React, { useState } from 'react';
import { getSLAConfig, saveSLAConfig, resetSLAConfig, DEFAULT_SLA_CONFIG } from '../../utils/leadSla/config';
import type { SLAConfig } from '../../utils/leadSla/config';

const SOURCE_KEYS = ['Website', 'Referral', 'HRMS', 'Lead Gen', 'Manual', 'LinkedIn', 'Cold Email', 'Trade Show', 'Social Media'];

function deepClone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

function SectionCard({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function NumInput({ label, value, onChange, min, max, step, unit }: {
  label: string; value: number; onChange: (n: number) => void;
  min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min ?? 0}
          max={max}
          step={step ?? 1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-20 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {unit && <span className="text-sm text-gray-500 w-10">{unit}</span>}
      </div>
    </div>
  );
}

export default function SLAConfigPage() {
  const [config, setConfig] = useState<SLAConfig>(() => deepClone(getSLAConfig()));
  const [saved, setSaved] = useState(false);

  function patch<K extends keyof SLAConfig>(section: K, value: SLAConfig[K]) {
    setConfig(c => ({ ...c, [section]: value }));
    setSaved(false);
  }

  function handleSave() {
    saveSLAConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    if (!confirm('Reset all SLA settings to factory defaults?')) return;
    resetSLAConfig();
    setConfig(deepClone(DEFAULT_SLA_CONFIG));
    setSaved(false);
  }

  const fr = config.firstResponse;
  const fu = config.followUp;
  const st = config.stale;
  const esc = config.escalation;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SLA Configuration</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure response-time thresholds for first contact, follow-up, and stale lead detection.
              Changes take effect immediately for all lead rows, KPI cards, and filters.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded-lg transition-colors"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">

        {/* First Response */}
        <SectionCard
          title="First-Response SLA"
          description="How long a new lead can wait without any contact before breaching SLA. Source-specific thresholds override the default."
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">At-Risk Threshold</span>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={50} max={95} step={5}
                  value={Math.round(fr.atRiskPct * 100)}
                  onChange={e => patch('firstResponse', { ...fr, atRiskPct: Number(e.target.value) / 100 })}
                  className="w-28"
                />
                <span className="text-sm font-semibold text-gray-700 w-10 text-right">
                  {Math.round(fr.atRiskPct * 100)}%
                </span>
                <span className="text-xs text-gray-400">of limit</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hours-to-breach by source</p>
              {SOURCE_KEYS.map(src => (
                <div key={src} className="flex items-center justify-between gap-4">
                  <label className="text-sm text-gray-700 w-28">{src}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={1} max={168} step={1}
                      value={fr.thresholds[src] ?? fr.defaultHours}
                      onChange={e => {
                        const val = Number(e.target.value);
                        const newThresholds = { ...fr.thresholds };
                        if (val === fr.defaultHours) {
                          delete newThresholds[src];
                        } else {
                          newThresholds[src] = val;
                        }
                        patch('firstResponse', { ...fr, thresholds: newThresholds });
                      }}
                      className="w-20 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500 w-8">hours</span>
                    {fr.thresholds[src] != null && (
                      <button
                        onClick={() => {
                          const t = { ...fr.thresholds };
                          delete t[src];
                          patch('firstResponse', { ...fr, thresholds: t });
                        }}
                        className="text-xs text-gray-400 hover:text-red-500"
                        title="Reset to default"
                      >
                        ↺
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 pt-2 border-t border-dashed border-gray-200">
                <label className="text-sm font-medium text-gray-700">Default (all other sources)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={1} max={168}
                    value={fr.defaultHours}
                    onChange={e => patch('firstResponse', { ...fr, defaultHours: Number(e.target.value) })}
                    className="w-20 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500 w-8">hours</span>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Follow-Up SLA */}
        <SectionCard
          title="Follow-Up SLA"
          description="Grace window after a follow-up date passes before the lead is considered breached. Within the window = At Risk."
        >
          <NumInput
            label="Grace window"
            value={fu.graceHours}
            onChange={v => patch('followUp', { ...fu, graceHours: v })}
            min={0} max={48} unit="hours"
          />
          <p className="text-xs text-gray-400">
            At Risk: follow-up date has passed but grace window has not expired.
            Breached: grace window expired.
          </p>
        </SectionCard>

        {/* Stale Lead SLA */}
        <SectionCard
          title="Stale Lead Detection"
          description="Flags active leads that haven't had any activity in too long. Only applies to non-terminal statuses."
        >
          <div className="space-y-3">
            <NumInput
              label="At-Risk after"
              value={st.atRiskDays}
              onChange={v => patch('stale', { ...st, atRiskDays: v })}
              min={1} max={st.breachDays - 1} unit="days"
            />
            <NumInput
              label="Breached after"
              value={st.breachDays}
              onChange={v => patch('stale', { ...st, breachDays: Math.max(v, st.atRiskDays + 1) })}
              min={2} max={365} unit="days"
            />
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Active statuses (cannot be changed here)</p>
              <div className="flex flex-wrap gap-1.5">
                {st.activeStatuses.map(s => (
                  <span key={s} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Terminal statuses (lost, converted, unqualified) are always excluded.</p>
            </div>
          </div>
        </SectionCard>

        {/* Escalation */}
        <SectionCard
          title="Manager Escalation"
          description="A lead is flagged for escalation when its SLA overage exceeds this multiple of the original threshold."
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm text-gray-700">Escalation multiplier</span>
              <p className="text-xs text-gray-400 mt-0.5">
                E.g. multiplier 2× on a 4h first-response limit → escalate after 8h.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number" min={1.1} max={10} step={0.5}
                value={esc.multiplier}
                onChange={e => patch('escalation', { multiplier: Number(e.target.value) })}
                className="w-20 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">×</span>
            </div>
          </div>
        </SectionCard>

        {/* Save bar */}
        <div className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl px-6 py-4">
          <p className="text-sm text-gray-500">
            Settings are saved in your browser and applied immediately.
            Swap <code className="bg-gray-100 px-1 rounded text-xs">bmi_sla_config</code> for an API call to persist to the backend.
          </p>
          <button
            onClick={handleSave}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-colors ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}
