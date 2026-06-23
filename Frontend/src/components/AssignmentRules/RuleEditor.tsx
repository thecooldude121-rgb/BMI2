import React, { useState } from 'react';
import type {
  AssignmentRule, RuleCondition, ConditionField, ConditionOp,
  BusinessHoursValue, FollowUpTaskConfig,
} from '../../utils/assignmentRules/types';
import {
  FIELD_LABELS, PERSONA_PRESETS, COMPANY_SIZE_OPTIONS,
  SOURCE_OPTIONS, WEEKDAY_LABELS,
} from '../../utils/assignmentRules/types';
import { upsertRule, newConditionId } from '../../utils/assignmentRules/rulesStore';
import { getTerritories } from '../../utils/assignmentRules/territoryStore';
import { TEAM_MEMBERS } from '../../utils/leadOwnerRouting';

interface Props {
  rule: AssignmentRule;
  onSave: () => void;
  onCancel: () => void;
}

// ── Field → allowed ops ──────────────────────────────────────────────────────
const FIELD_OPS: Record<ConditionField, { op: ConditionOp; label: string }[]> = {
  source:         [{ op: 'equals', label: 'is' }, { op: 'not_equals', label: 'is not' }, { op: 'in', label: 'is one of' }, { op: 'not_in', label: 'is none of' }],
  score:          [{ op: 'gte', label: '≥' }, { op: 'lte', label: '≤' }, { op: 'between', label: 'between' }],
  territory:      [{ op: 'in', label: 'is in' }, { op: 'not_in', label: 'is not in' }],
  persona:        [{ op: 'in', label: 'is one of' }, { op: 'not_in', label: 'is not' }],
  company_size:   [{ op: 'in', label: 'is one of' }, { op: 'not_in', label: 'is not' }],
  business_hours: [{ op: 'equals', label: 'is within' }],
  tags:           [{ op: 'contains', label: 'contains' }, { op: 'not_contains', label: 'does not contain' }],
  availability:   [{ op: 'equals', label: 'is available (stub)' }],
};

function defaultValue(field: ConditionField, op: ConditionOp): unknown {
  if (field === 'score') {
    if (op === 'between') return [50, 80];
    return 50;
  }
  if (field === 'business_hours') {
    return { startHour: 9, endHour: 18, days: [1, 2, 3, 4, 5], timezone: 'America/New_York' } as BusinessHoursValue;
  }
  if (['in', 'not_in'].includes(op)) return [];
  return '';
}

// ── Condition value editors ──────────────────────────────────────────────────

function SourceValueEditor({ cond, onChange }: { cond: RuleCondition; onChange: (v: unknown) => void }) {
  const isMulti = cond.op === 'in' || cond.op === 'not_in';
  if (isMulti) {
    const arr = (cond.value as string[] | undefined) ?? [];
    return (
      <div className="flex flex-wrap gap-1.5">
        {SOURCE_OPTIONS.map(s => {
          const checked = arr.includes(s);
          return (
            <button key={s} type="button"
              onClick={() => onChange(checked ? arr.filter(x => x !== s) : [...arr, s])}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                checked ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'
              }`}
            >{s}</button>
          );
        })}
      </div>
    );
  }
  return (
    <select value={(cond.value as string) ?? ''} onChange={e => onChange(e.target.value)}
      className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">— select —</option>
      {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

function ScoreValueEditor({ cond, onChange }: { cond: RuleCondition; onChange: (v: unknown) => void }) {
  if (cond.op === 'between') {
    const [lo, hi] = (cond.value as [number, number] | undefined) ?? [50, 80];
    return (
      <div className="flex items-center gap-2 text-sm">
        <input type="number" min={0} max={100} value={lo}
          onChange={e => onChange([Number(e.target.value), hi])}
          className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <span className="text-gray-400">to</span>
        <input type="number" min={0} max={100} value={hi}
          onChange={e => onChange([lo, Number(e.target.value)])}
          className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <input type="range" min={0} max={100} value={(cond.value as number) ?? 50}
        onChange={e => onChange(Number(e.target.value))} className="w-24" />
      <span className="text-sm font-semibold text-gray-700 w-8">{(cond.value as number) ?? 50}</span>
    </div>
  );
}

function TerritoryValueEditor({ cond, onChange }: { cond: RuleCondition; onChange: (v: unknown) => void }) {
  const territories = getTerritories();
  const arr = (cond.value as string[] | undefined) ?? [];
  return (
    <div className="flex flex-wrap gap-1.5">
      {territories.map(t => {
        const checked = arr.includes(t.name);
        return (
          <button key={t.id} type="button"
            onClick={() => onChange(checked ? arr.filter(x => x !== t.name) : [...arr, t.name])}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              checked ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'
            }`}
          >{t.name}</button>
        );
      })}
      {territories.length === 0 && <span className="text-xs text-gray-400">No territories defined yet.</span>}
    </div>
  );
}

function PersonaValueEditor({ cond, onChange }: { cond: RuleCondition; onChange: (v: unknown) => void }) {
  const arr = (cond.value as string[] | undefined) ?? [];
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.keys(PERSONA_PRESETS).map(p => {
        const checked = arr.includes(p);
        return (
          <button key={p} type="button"
            onClick={() => onChange(checked ? arr.filter(x => x !== p) : [...arr, p])}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              checked ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'
            }`}
          >{p}</button>
        );
      })}
    </div>
  );
}

function CompanySizeEditor({ cond, onChange }: { cond: RuleCondition; onChange: (v: unknown) => void }) {
  const arr = (cond.value as string[] | undefined) ?? [];
  return (
    <div className="flex flex-wrap gap-1.5">
      {COMPANY_SIZE_OPTIONS.map(s => {
        const checked = arr.includes(s);
        return (
          <button key={s} type="button"
            onClick={() => onChange(checked ? arr.filter(x => x !== s) : [...arr, s])}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              checked ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'
            }`}
          >{s}</button>
        );
      })}
    </div>
  );
}

function BusinessHoursEditor({ cond, onChange }: { cond: RuleCondition; onChange: (v: unknown) => void }) {
  const v = (cond.value as BusinessHoursValue | undefined) ?? { startHour: 9, endHour: 18, days: [1, 2, 3, 4, 5], timezone: 'America/New_York' };
  function update(patch: Partial<BusinessHoursValue>) { onChange({ ...v, ...patch }); }
  const COMMON_TZ = ['America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'UTC'];

  return (
    <div className="space-y-3 bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-600 text-xs">From</label>
          <input type="number" min={0} max={23} value={v.startHour}
            onChange={e => update({ startHour: Number(e.target.value) })}
            className="w-14 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <label className="text-gray-600 text-xs">To</label>
          <input type="number" min={0} max={23} value={v.endHour}
            onChange={e => update({ endHour: Number(e.target.value) })}
            className="w-14 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={v.timezone} onChange={e => update({ timezone: e.target.value })}
          className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
          {COMMON_TZ.map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>
      <div className="flex gap-1.5">
        {WEEKDAY_LABELS.map((d, i) => {
          const active = v.days.includes(i);
          return (
            <button key={d} type="button"
              onClick={() => update({ days: active ? v.days.filter(x => x !== i) : [...v.days, i].sort() })}
              className={`w-9 h-9 rounded-lg text-xs font-medium border transition-colors ${
                active ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'
              }`}
            >{d}</button>
          );
        })}
      </div>
    </div>
  );
}

function TagValueEditor({ cond, onChange }: { cond: RuleCondition; onChange: (v: unknown) => void }) {
  return (
    <input value={(cond.value as string) ?? ''} onChange={e => onChange(e.target.value)}
      placeholder="tag keyword"
      className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500" />
  );
}

function ConditionValueEditor({ cond, onChange }: { cond: RuleCondition; onChange: (v: unknown) => void }) {
  switch (cond.field) {
    case 'source':         return <SourceValueEditor cond={cond} onChange={onChange} />;
    case 'score':          return <ScoreValueEditor cond={cond} onChange={onChange} />;
    case 'territory':      return <TerritoryValueEditor cond={cond} onChange={onChange} />;
    case 'persona':        return <PersonaValueEditor cond={cond} onChange={onChange} />;
    case 'company_size':   return <CompanySizeEditor cond={cond} onChange={onChange} />;
    case 'business_hours': return <BusinessHoursEditor cond={cond} onChange={onChange} />;
    case 'tags':           return <TagValueEditor cond={cond} onChange={onChange} />;
    case 'availability':   return <span className="text-xs text-gray-400 italic">Always passes (stub)</span>;
    default:               return null;
  }
}

// ── Action editor ─────────────────────────────────────────────────────────────

function ActionEditor({ rule, onChange }: { rule: AssignmentRule; onChange: (patch: Partial<AssignmentRule>) => void }) {
  const { action } = rule;
  const users = TEAM_MEMBERS;
  const allUserIds = action.userIds ?? [];

  function setMode(mode: typeof action.mode) {
    const base = { ...action, mode };
    if (mode === 'direct_user') delete (base as any).userIds;
    if (mode === 'queue') { base.userIds = ['queue_unassigned']; delete (base as any).userId; }
    onChange({ action: base });
  }

  function toggleUser(id: string) {
    const ids = allUserIds.includes(id) ? allUserIds.filter(x => x !== id) : [...allUserIds, id];
    onChange({ action: { ...action, userIds: ids } });
  }

  function setWeight(id: string, w: number) {
    onChange({ action: { ...action, weights: { ...(action.weights ?? {}), [id]: w } } });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Assignment Mode</label>
        <div className="flex flex-wrap gap-2">
          {(['direct_user', 'round_robin', 'weighted_round_robin', 'queue'] as const).map(m => {
            const labels: Record<string, string> = {
              direct_user: 'Direct User', round_robin: 'Round Robin',
              weighted_round_robin: 'Weighted RR', queue: 'Queue',
            };
            return (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  action.mode === m ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'
                }`}
              >{labels[m]}</button>
            );
          })}
        </div>
      </div>

      {action.mode === 'direct_user' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Assign To</label>
          <select value={action.userId ?? ''} onChange={e => onChange({ action: { ...action, userId: e.target.value } })}
            className="px-2.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— select user —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
      )}

      {(action.mode === 'round_robin' || action.mode === 'weighted_round_robin') && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Pool of Users</label>
          <div className="space-y-2">
            {users.map(u => {
              const checked = allUserIds.includes(u.id);
              return (
                <div key={u.id} className="flex items-center gap-3">
                  <input type="checkbox" id={`u-${u.id}`} checked={checked} onChange={() => toggleUser(u.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                  <label htmlFor={`u-${u.id}`} className="text-sm text-gray-700 flex-1">{u.label}</label>
                  {action.mode === 'weighted_round_robin' && checked && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">Weight</span>
                      <input type="number" min={1} max={10} value={action.weights?.[u.id] ?? 1}
                        onChange={e => setWeight(u.id, Number(e.target.value))}
                        className="w-14 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {action.mode === 'queue' && (
        <p className="text-sm text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Leads will be placed in the shared queue for manual claiming.
        </p>
      )}
    </div>
  );
}

// ── Follow-up task editor ─────────────────────────────────────────────────────

function FollowUpEditor({ config, onChange }: {
  config: FollowUpTaskConfig;
  onChange: (c: FollowUpTaskConfig) => void;
}) {
  return (
    <div className={`space-y-3 rounded-xl border p-4 transition-colors ${config.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="followup-on" checked={config.enabled}
          onChange={e => onChange({ ...config, enabled: e.target.checked })}
          className="w-4 h-4 text-green-600 rounded border-gray-300" />
        <label htmlFor="followup-on" className="text-sm font-medium text-gray-700">Create follow-up task on match</label>
      </div>

      {config.enabled && (
        <div className="grid grid-cols-2 gap-3 pl-6">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Task Type</label>
            <select value={config.type} onChange={e => onChange({ ...config, type: e.target.value as any })}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Due In (hours)</label>
            <input type="number" min={1} max={720} value={config.dueInHours}
              onChange={e => onChange({ ...config, dueInHours: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Task Title</label>
            <input value={config.title} onChange={e => onChange({ ...config, title: e.target.value })}
              placeholder="e.g. Welcome call — executive referral"
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

const BLANK_FOLLOW_UP: FollowUpTaskConfig = { enabled: false, type: 'call', dueInHours: 24, title: '' };

export default function RuleEditor({ rule: initial, onSave, onCancel }: Props) {
  const [rule, setRule] = useState<AssignmentRule>({
    ...initial,
    followUpTask: initial.followUpTask ?? BLANK_FOLLOW_UP,
  });
  const [errors, setErrors] = useState<string[]>([]);

  function patch(p: Partial<AssignmentRule>) { setRule(r => ({ ...r, ...p })); }

  function addCondition() {
    const field: ConditionField = 'source';
    const op: ConditionOp = 'equals';
    const newCond: RuleCondition = { id: newConditionId(), field, op, value: defaultValue(field, op) };
    patch({ conditions: [...rule.conditions, newCond] });
  }

  function updateCondition(id: string, updates: Partial<RuleCondition>) {
    setRule(r => ({
      ...r,
      conditions: r.conditions.map(c => {
        if (c.id !== id) return c;
        const next = { ...c, ...updates };
        if (updates.field || updates.op) {
          next.value = defaultValue(next.field, next.op);
        }
        return next;
      }),
    }));
  }

  function removeCondition(id: string) {
    patch({ conditions: rule.conditions.filter(c => c.id !== id) });
  }

  function validate(): boolean {
    const errs: string[] = [];
    if (!rule.name.trim()) errs.push('Rule name is required.');
    if (rule.action.mode === 'direct_user' && !rule.action.userId) errs.push('Select a user for direct assignment.');
    if (['round_robin', 'weighted_round_robin'].includes(rule.action.mode) && (rule.action.userIds?.length ?? 0) < 2) {
      errs.push('Select at least 2 users for round robin.');
    }
    setErrors(errs);
    return errs.length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    upsertRule(rule);
    onSave();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {initial.name ? `Edit: ${initial.name}` : 'New Assignment Rule'}
        </h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 space-y-1">
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {/* Basic info */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name <span className="text-red-500">*</span></label>
          <input value={rule.name} onChange={e => patch({ name: e.target.value })}
            placeholder="e.g. Executive Referrals → Account Manager"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input value={rule.description} onChange={e => patch({ description: e.target.value })}
            placeholder="Optional — explain what this rule does"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="rule-enabled" checked={rule.enabled}
            onChange={e => patch({ enabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded border-gray-300" />
          <label htmlFor="rule-enabled" className="text-sm text-gray-700">Rule is active</label>
        </div>
      </div>

      {/* Conditions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Conditions</h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>Match</span>
            {(['all', 'any'] as const).map(g => (
              <button key={g} type="button" onClick={() => patch({ conditionGrouping: g })}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  rule.conditionGrouping === g ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:border-blue-400'
                }`}
              >{g === 'all' ? 'ALL (AND)' : 'ANY (OR)'}</button>
            ))}
            <span>conditions</span>
          </div>
        </div>

        <div className="space-y-2">
          {rule.conditions.length === 0 && (
            <p className="text-sm text-gray-400 py-2">No conditions — this rule will always match (catch-all).</p>
          )}
          {rule.conditions.map(cond => {
            const ops = FIELD_OPS[cond.field] ?? [];
            return (
              <div key={cond.id} className="flex items-start gap-2 bg-gray-50 rounded-xl p-3 flex-wrap">
                <select value={cond.field}
                  onChange={e => updateCondition(cond.id, { field: e.target.value as ConditionField, op: FIELD_OPS[e.target.value as ConditionField][0].op })}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {(Object.keys(FIELD_LABELS) as ConditionField[]).map(f => (
                    <option key={f} value={f}>{FIELD_LABELS[f]}</option>
                  ))}
                </select>

                {cond.field !== 'business_hours' && cond.field !== 'availability' && (
                  <select value={cond.op} onChange={e => updateCondition(cond.id, { op: e.target.value as ConditionOp })}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {ops.map(o => <option key={o.op} value={o.op}>{o.label}</option>)}
                  </select>
                )}

                <div className="flex-1 min-w-0">
                  <ConditionValueEditor cond={cond} onChange={v => updateCondition(cond.id, { value: v })} />
                </div>

                <button onClick={() => removeCondition(cond.id)}
                  className="text-red-400 hover:text-red-600 text-lg leading-none px-1 shrink-0 mt-0.5">×</button>
              </div>
            );
          })}
          <button onClick={addCondition}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium py-1">
            + Add Condition
          </button>
        </div>
      </div>

      {/* Action */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Assignment Action</h3>
        <ActionEditor rule={rule} onChange={patch} />
      </div>

      {/* Follow-up task */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Follow-Up Task</h3>
        <FollowUpEditor
          config={rule.followUpTask ?? BLANK_FOLLOW_UP}
          onChange={c => patch({ followUpTask: c })}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button onClick={onCancel}
          className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          Cancel
        </button>
        <button onClick={handleSave}
          className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          Save Rule
        </button>
      </div>
    </div>
  );
}
