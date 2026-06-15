import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type FieldKey =
  | 'stage' | 'owner' | 'value' | 'closeDate' | 'lastActivity' | 'health' | 'contact';

export type OperatorKey =
  | 'isAnyOf' | 'isNoneOf'
  | 'greaterThan' | 'lessThan' | 'between'
  | 'before' | 'after'
  | 'olderThan' | 'within'
  | 'is' | 'isNot' | 'scoreBelow' | 'scoreAbove'
  | 'isSet' | 'isNotSet';

export type Conjunction = 'AND' | 'OR';

export interface FilterCondition {
  id: string;
  field: FieldKey;
  operator: OperatorKey;
  valueStrings: string[];
  valueNumber: number | null;
  valueNumber2: number | null;
  valueDate: string;
  valueDate2: string;
}

// ── Field / operator config ───────────────────────────────────────────────────
const FIELD_LABELS: Record<FieldKey, string> = {
  stage:        'Stage',
  owner:        'Owner',
  value:        'Value',
  closeDate:    'Close Date',
  lastActivity: 'Last Activity',
  health:       'Health',
  contact:      'Contact',
};

type OperatorDef = { key: OperatorKey; label: string };
type ValueInputType = 'multiSelect' | 'currency' | 'currency2' | 'date' | 'days' | 'tier' | 'score' | 'none';

type FieldDef = {
  operators: OperatorDef[];
  defaultOperator: OperatorKey;
  valueType: (op: OperatorKey) => ValueInputType;
};

const FIELD_DEFS: Record<FieldKey, FieldDef> = {
  stage: {
    operators: [
      { key: 'isAnyOf',  label: 'is any of' },
      { key: 'isNoneOf', label: 'is none of' },
    ],
    defaultOperator: 'isAnyOf',
    valueType: () => 'multiSelect',
  },
  owner: {
    operators: [
      { key: 'isAnyOf',  label: 'is any of' },
      { key: 'isNoneOf', label: 'is none of' },
    ],
    defaultOperator: 'isAnyOf',
    valueType: () => 'multiSelect',
  },
  value: {
    operators: [
      { key: 'greaterThan', label: 'is greater than' },
      { key: 'lessThan',    label: 'is less than' },
      { key: 'between',     label: 'is between' },
    ],
    defaultOperator: 'greaterThan',
    valueType: (op) => op === 'between' ? 'currency2' : 'currency',
  },
  closeDate: {
    operators: [
      { key: 'before', label: 'is before' },
      { key: 'after',  label: 'is after' },
    ],
    defaultOperator: 'before',
    valueType: () => 'date',
  },
  lastActivity: {
    operators: [
      { key: 'olderThan', label: 'older than' },
      { key: 'within',    label: 'within last' },
    ],
    defaultOperator: 'olderThan',
    valueType: () => 'days',
  },
  health: {
    operators: [
      { key: 'is',         label: 'is' },
      { key: 'isNot',      label: 'is not' },
      { key: 'scoreBelow', label: 'score is below' },
      { key: 'scoreAbove', label: 'score is above' },
    ],
    defaultOperator: 'is',
    valueType: (op) => (op === 'scoreBelow' || op === 'scoreAbove') ? 'score' : 'tier',
  },
  contact: {
    operators: [
      { key: 'isNotSet', label: 'is missing' },
      { key: 'isSet',    label: 'is set' },
    ],
    defaultOperator: 'isNotSet',
    valueType: () => 'none',
  },
};

const HEALTH_TIERS = [
  { value: 'strong', label: 'Healthy', activeClass: 'bg-green-100 text-green-700 border-green-300', dot: 'bg-green-500' },
  { value: 'fair',   label: 'Watch',   activeClass: 'bg-amber-100 text-amber-700 border-amber-300', dot: 'bg-amber-500' },
  { value: 'weak',   label: 'At Risk', activeClass: 'bg-red-100   text-red-700   border-red-300',   dot: 'bg-red-500'   },
] as const;

const SCORE_HINT = (score: number) =>
  score < 40 ? '(At Risk range)' : score < 70 ? '(Watch range)' : '(Healthy range)';

// ── Public helper: create a blank condition ───────────────────────────────────
export function makeCondition(field: FieldKey = 'stage'): FilterCondition {
  return {
    id: Math.random().toString(36).slice(2),
    field,
    operator: FIELD_DEFS[field].defaultOperator,
    valueStrings: [],
    valueNumber: null,
    valueNumber2: null,
    valueDate: '',
    valueDate2: '',
  };
}

// ── MultiSelect ───────────────────────────────────────────────────────────────
function MultiSelectInput({
  options,
  selected,
  onChange,
  placeholder,
  getLabel,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  getLabel?: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = getLabel ?? ((v: string) => v);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-start gap-1.5 min-w-[160px] max-w-[300px] text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors"
      >
        <span className="flex-1 text-left">
          {selected.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {selected.map(v => (
                <span
                  key={v}
                  className="inline-flex items-center gap-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium px-1.5 py-0.5 rounded"
                >
                  <span className="capitalize">{label(v)}</span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); toggle(v); }}
                    className="ml-0.5 text-indigo-400 hover:text-indigo-700 leading-none"
                  >×</button>
                </span>
              ))}
            </span>
          )}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-[60] min-w-[180px] max-h-[220px] overflow-y-auto">
          {options.map(opt => (
            <label
              key={opt}
              className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 capitalize">{label(opt)}</span>
            </label>
          ))}
          {options.length === 0 && (
            <p className="text-xs text-gray-400 px-3 py-2">No options available</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Value input — switches shape based on field + operator ────────────────────
function ValueInput({
  condition,
  stageOptions,
  ownerOptions,
  onChange,
}: {
  condition: FilterCondition;
  stageOptions: string[];
  ownerOptions: string[];
  onChange: (partial: Partial<FilterCondition>) => void;
}) {
  const vtype = FIELD_DEFS[condition.field].valueType(condition.operator);

  if (vtype === 'multiSelect') {
    const opts = condition.field === 'stage' ? stageOptions : ownerOptions;
    return (
      <MultiSelectInput
        options={opts}
        selected={condition.valueStrings}
        onChange={v => onChange({ valueStrings: v })}
        placeholder="Choose…"
      />
    );
  }

  if (vtype === 'currency') {
    return (
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">$</span>
        <input
          type="number"
          min={0}
          placeholder="0"
          value={condition.valueNumber ?? ''}
          onChange={e => onChange({ valueNumber: e.target.value ? parseFloat(e.target.value) : null })}
          className="w-32 text-sm border border-gray-200 rounded-lg pl-6 pr-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>
    );
  }

  if (vtype === 'currency2') {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">$</span>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={condition.valueNumber ?? ''}
            onChange={e => onChange({ valueNumber: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-28 text-sm border border-gray-200 rounded-lg pl-6 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <span className="text-sm text-gray-400">and</span>
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">$</span>
          <input
            type="number"
            min={0}
            placeholder="∞"
            value={condition.valueNumber2 ?? ''}
            onChange={e => onChange({ valueNumber2: e.target.value ? parseFloat(e.target.value) : null })}
            className="w-28 text-sm border border-gray-200 rounded-lg pl-6 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      </div>
    );
  }

  if (vtype === 'date') {
    return (
      <input
        type="date"
        value={condition.valueDate}
        onChange={e => onChange({ valueDate: e.target.value })}
        className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
    );
  }

  if (vtype === 'days') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          placeholder="7"
          value={condition.valueNumber ?? ''}
          onChange={e => onChange({ valueNumber: e.target.value ? parseInt(e.target.value) : null })}
          className="w-20 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <span className="text-sm text-gray-500">days</span>
      </div>
    );
  }

  if (vtype === 'tier') {
    const isSingleSelect = condition.operator === 'is';
    return (
      <div className="flex gap-1.5">
        {HEALTH_TIERS.map(({ value, label, activeClass, dot }) => {
          const isActive = condition.valueStrings.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                if (isSingleSelect) {
                  onChange({ valueStrings: isActive ? [] : [value] });
                } else {
                  const next = isActive
                    ? condition.valueStrings.filter(x => x !== value)
                    : [...condition.valueStrings, value];
                  onChange({ valueStrings: next });
                }
              }}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                isActive
                  ? activeClass
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  if (vtype === 'score') {
    const score = condition.valueNumber;
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          placeholder="0–100"
          value={score ?? ''}
          onChange={e => onChange({ valueNumber: e.target.value ? parseInt(e.target.value) : null })}
          className="w-24 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        {score !== null && (
          <span className="text-xs text-gray-400">{SCORE_HINT(score)}</span>
        )}
      </div>
    );
  }

  // 'none' — no value input (e.g. Contact is missing / is set)
  return null;
}

// ── Single condition row ──────────────────────────────────────────────────────
function ConditionRow({
  condition,
  index,
  conjunction,
  stageOptions,
  ownerOptions,
  onChange,
  onRemove,
}: {
  condition: FilterCondition;
  index: number;
  conjunction: Conjunction;
  stageOptions: string[];
  ownerOptions: string[];
  onChange: (id: string, partial: Partial<FilterCondition>) => void;
  onRemove: (id: string) => void;
}) {
  const cfg = FIELD_DEFS[condition.field];

  const handleFieldChange = (newField: FieldKey) => {
    const def = FIELD_DEFS[newField];
    onChange(condition.id, {
      field: newField,
      operator: def.defaultOperator,
      valueStrings: [],
      valueNumber: null,
      valueNumber2: null,
      valueDate: '',
      valueDate2: '',
    });
  };

  const handleOperatorChange = (newOp: OperatorKey) => {
    // Reset value when switching between tier ↔ score operators to avoid stale state
    const oldType = cfg.valueType(condition.operator);
    const newType = cfg.valueType(newOp);
    const resetValues = oldType !== newType
      ? { valueStrings: [], valueNumber: null, valueNumber2: null }
      : {};
    onChange(condition.id, { operator: newOp, ...resetValues });
  };

  return (
    <div className="flex items-start gap-2 group">
      {/* Row label */}
      <div className="w-[52px] flex-shrink-0 flex items-center justify-end pt-[9px]">
        {index === 0 ? (
          <span className="text-xs text-gray-400 font-medium">Where</span>
        ) : (
          <span className={`text-xs font-bold tracking-wide ${
            conjunction === 'AND' ? 'text-indigo-500' : 'text-violet-500'
          }`}>
            {conjunction}
          </span>
        )}
      </div>

      {/* Field */}
      <select
        value={condition.field}
        onChange={e => handleFieldChange(e.target.value as FieldKey)}
        className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer hover:border-gray-300 transition-colors"
      >
        {(Object.keys(FIELD_LABELS) as FieldKey[]).map(f => (
          <option key={f} value={f}>{FIELD_LABELS[f]}</option>
        ))}
      </select>

      {/* Operator */}
      <select
        value={condition.operator}
        onChange={e => handleOperatorChange(e.target.value as OperatorKey)}
        className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer hover:border-gray-300 transition-colors"
      >
        {cfg.operators.map(op => (
          <option key={op.key} value={op.key}>{op.label}</option>
        ))}
      </select>

      {/* Value */}
      <div className="flex-1 min-w-0">
        <ValueInput
          condition={condition}
          stageOptions={stageOptions}
          ownerOptions={ownerOptions}
          onChange={partial => onChange(condition.id, partial)}
        />
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(condition.id)}
        title="Remove condition"
        className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all mt-0.5"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface AdvancedFilterBuilderProps {
  conditions: FilterCondition[];
  conjunction: Conjunction;
  onConditionsChange: (conditions: FilterCondition[]) => void;
  onConjunctionChange: (conj: Conjunction) => void;
  stageOptions: string[];
  ownerOptions: string[];
  onClose: () => void;
}

export function AdvancedFilterBuilder({
  conditions,
  conjunction,
  onConditionsChange,
  onConjunctionChange,
  stageOptions,
  ownerOptions,
  onClose,
}: AdvancedFilterBuilderProps) {
  const addCondition = () => {
    onConditionsChange([...conditions, makeCondition('stage')]);
  };

  const updateCondition = (id: string, partial: Partial<FilterCondition>) => {
    onConditionsChange(conditions.map(c => c.id === id ? { ...c, ...partial } : c));
  };

  const removeCondition = (id: string) => {
    onConditionsChange(conditions.filter(c => c.id !== id));
  };

  return (
    <div className="bg-gray-50/80 border-b border-gray-200 px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-800">Filter builder</span>
          {conditions.length > 0 && (
            <span className="text-xs text-gray-400">
              applied on top of quick filters with AND logic
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
          title="Close filter builder"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* AND / OR toggle — only shown when 2+ conditions */}
      {conditions.length > 1 && (
        <div className="flex items-center gap-2 mb-3 pl-[60px]">
          <span className="text-xs text-gray-500">Match</span>
          {(['AND', 'OR'] as const).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => onConjunctionChange(c)}
              className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors ${
                conjunction === c
                  ? c === 'AND'
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                    : 'bg-violet-100 text-violet-700 border-violet-300'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            >
              {c === 'AND' ? 'ALL conditions' : 'ANY condition'}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {conditions.length === 0 && (
        <p className="text-sm text-gray-400 pl-[60px] pb-2">
          No conditions yet — add one to start filtering.
        </p>
      )}

      {/* Condition rows */}
      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <ConditionRow
            key={condition.id}
            condition={condition}
            index={index}
            conjunction={conjunction}
            stageOptions={stageOptions}
            ownerOptions={ownerOptions}
            onChange={updateCondition}
            onRemove={removeCondition}
          />
        ))}
      </div>

      {/* Add condition */}
      <button
        type="button"
        onClick={addCondition}
        className="mt-3 ml-[60px] flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add condition
      </button>
    </div>
  );
}
