import React, { useState } from 'react';
import type { AssignmentResult } from '../../utils/assignmentRules/types';
import { COMPANY_SIZE_OPTIONS, SOURCE_OPTIONS, WEEKDAY_LABELS } from '../../utils/assignmentRules/types';
import { evaluateAssignmentRules } from '../../utils/assignmentRules/evaluationEngine';
import { getRules } from '../../utils/assignmentRules/rulesStore';
import { getTerritories } from '../../utils/assignmentRules/territoryStore';
import { TEAM_MEMBERS } from '../../utils/leadOwnerRouting';

interface MockLead {
  source: string;
  score: number;
  position: string;
  company: string;
  company_size: string;
  country: string;
  city: string;
  tags: string;
}

const BLANK: MockLead = {
  source: '',
  score: 50,
  position: '',
  company: '',
  company_size: '',
  country: '',
  city: '',
  tags: '',
};

function ResultBadge({ result }: { result: AssignmentResult }) {
  if (!result.matched && !result.assignedUserId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-700">No match — lead will be unassigned</p>
        <p className="text-xs text-amber-600 mt-1">{result.reason}</p>
      </div>
    );
  }
  const modeLabel: Record<string, string> = {
    direct_user: 'Direct assignment',
    round_robin: 'Round robin',
    weighted_round_robin: 'Weighted round robin',
    queue: 'Queued',
  };
  const isRule = !!result.ruleId;
  return (
    <div className={`rounded-xl border p-4 ${isRule ? 'border-green-200 bg-green-50' : 'border-blue-100 bg-blue-50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-sm font-semibold ${isRule ? 'text-green-700' : 'text-blue-700'}`}>
          {isRule ? `Rule matched: "${result.ruleName}"` : 'Fallback routing'}
        </span>
      </div>
      <p className="text-sm text-gray-700">
        Assign to <strong>{result.assignedUserLabel ?? result.assignedUserId ?? 'queue'}</strong>
        {result.mode && <span className="text-gray-400 ml-1">({modeLabel[result.mode] ?? result.mode})</span>}
      </p>
      {result.followUpTask && (
        <p className="text-xs text-green-700 mt-1">
          Follow-up task: {result.followUpTask.type} — "{result.followUpTask.title}" in {result.followUpTask.dueInHours}h
        </p>
      )}
    </div>
  );
}

function TraceRow({ trace }: { trace: AssignmentResult['trace'] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (trace.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rule Evaluation Trace</h4>
      {trace.map(rt => (
        <div key={rt.ruleId} className={`rounded-lg border text-xs overflow-hidden ${rt.matched ? 'border-green-200' : 'border-gray-200'}`}>
          <button
            className={`w-full flex items-center justify-between px-3 py-2 text-left font-medium ${
              rt.matched ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'
            }`}
            onClick={() => setOpen(o => o === rt.ruleId ? null : rt.ruleId)}
          >
            <span className="flex items-center gap-2">
              <span>{rt.matched ? '✓' : '✗'}</span>
              <span>{rt.ruleName}</span>
              {rt.skipReason && <span className="text-gray-400">({rt.skipReason})</span>}
            </span>
            <span className="text-gray-400">{open === rt.ruleId ? '▲' : '▼'}</span>
          </button>
          {open === rt.ruleId && rt.conditionResults.length > 0 && (
            <div className="px-3 py-2 space-y-1 border-t border-gray-100 bg-white">
              <p className="text-gray-400 mb-1">Match mode: {rt.grouping === 'all' ? 'ALL conditions must pass' : 'ANY condition must pass'}</p>
              {rt.conditionResults.map(c => (
                <div key={c.conditionId} className={`flex items-start gap-2 py-1 ${c.passed ? 'text-green-700' : 'text-red-600'}`}>
                  <span className="shrink-0 mt-0.5">{c.passed ? '✓' : '✗'}</span>
                  <span className="flex-1">{c.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SimulationPanel() {
  const [lead, setLead] = useState<MockLead>(BLANK);
  const [result, setResult] = useState<AssignmentResult | null>(null);
  const [simTime, setSimTime] = useState<string>('');

  function set<K extends keyof MockLead>(k: K, v: MockLead[K]) {
    setLead(prev => ({ ...prev, [k]: v }));
    setResult(null);
  }

  function runSim() {
    const now = simTime ? new Date(simTime) : new Date();
    const tags = lead.tags.split(',').map(t => t.trim()).filter(Boolean);
    const res = evaluateAssignmentRules(
      {
        source: lead.source || undefined,
        score: lead.score,
        position: lead.position || undefined,
        company: lead.company || undefined,
        company_size: lead.company_size || undefined,
        country: lead.country || undefined,
        city: lead.city || undefined,
        tags,
      } as any,
      { rules: getRules(), territories: getTerritories(), now, peek: true },
    );
    setResult(res);
  }

  function reset() { setLead(BLANK); setResult(null); setSimTime(''); }

  return (
    <div className="max-w-2xl space-y-5">
      <p className="text-sm text-gray-500">
        Enter mock lead attributes to preview which rule would fire and who would be assigned.
        Simulation runs in <strong>peek mode</strong> — round-robin indexes are not advanced.
      </p>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Mock Lead Attributes</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lead Source</label>
            <select value={lead.source} onChange={e => set('source', e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— none —</option>
              {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lead Score (0–100)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={100} value={lead.score}
                onChange={e => set('score', Number(e.target.value))}
                className="flex-1" />
              <span className="text-sm font-semibold w-8 text-right text-gray-700">{lead.score}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Position / Title</label>
            <input value={lead.position} onChange={e => set('position', e.target.value)}
              placeholder="e.g. VP of Sales"
              className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Company Size</label>
            <select value={lead.company_size} onChange={e => set('company_size', e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— none —</option>
              {COMPANY_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
            <input value={lead.country} onChange={e => set('country', e.target.value)}
              placeholder="e.g. India"
              className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input value={lead.city} onChange={e => set('city', e.target.value)}
              placeholder="e.g. Mumbai"
              className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma-separated)</label>
          <input value={lead.tags} onChange={e => set('tags', e.target.value)}
            placeholder="enterprise, vip"
            className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Simulate Time <span className="text-gray-400">(leave blank for now)</span>
          </label>
          <input type="datetime-local" value={simTime} onChange={e => { setSimTime(e.target.value); setResult(null); }}
            className="px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={runSim}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Run Simulation
          </button>
          <button onClick={reset}
            className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Reset
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Simulation Result</h3>
          <ResultBadge result={result} />
          <TraceRow trace={result.trace} />
        </div>
      )}
    </div>
  );
}
