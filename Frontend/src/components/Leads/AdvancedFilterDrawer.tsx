import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Plus, Trash2, GripVertical, ChevronDown, Copy, Pencil, Check } from 'lucide-react';
import type {
  AdvancedFilter, FilterGroup, FilterCondition,
  FilterFieldId, FilterOperator, FilterValue, GroupLogic,
} from '../../types/leadFilter';
import {
  FILTER_FIELDS, FILTER_FIELD_CATEGORIES,
  OPERATOR_FULL_LABELS,
} from '../../types/leadFilter';
import { applyAdvancedFilter } from '../../utils/leadFilterEngine';
import type { Lead } from '../../types/lead';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdvancedFilterDrawerProps {
  open:            boolean;
  advancedFilter:  AdvancedFilter;
  leads:           Lead[];
  onChange:        (filter: AdvancedFilter) => void;
  onClose:         () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyCondition(fieldId: FilterFieldId = 'status'): FilterCondition {
  const meta = FILTER_FIELDS.find(f => f.id === fieldId)!;
  return {
    id:       crypto.randomUUID(),
    fieldId,
    operator: meta.allowedOperators[0],
    value:    null,
  };
}

function emptyGroup(index: number): FilterGroup {
  return {
    id:         crypto.randomUUID(),
    name:       `Group ${index}`,
    logic:      'AND',
    conditions: [emptyCondition()],
  };
}

const NO_VALUE_OPERATORS = new Set<FilterOperator>([
  'is_empty', 'date_is_empty', 'text_is_empty', 'is_overdue', 'is_true', 'is_false',
]);

const MULTI_VALUE_OPERATORS = new Set<FilterOperator>(['is_any_of', 'is_none_of']);

// ── Value input ───────────────────────────────────────────────────────────────

interface ValueInputProps {
  fieldId:   FilterFieldId;
  operator:  FilterOperator;
  value:     FilterValue;
  leads:     Lead[];
  onChange:  (v: FilterValue) => void;
}

function ValueInput({ fieldId, operator, value, leads, onChange }: ValueInputProps) {
  const meta = FILTER_FIELDS.find(f => f.id === fieldId);

  if (NO_VALUE_OPERATORS.has(operator)) return null;

  if (operator === 'between') {
    const [lo, hi] = Array.isArray(value) ? (value as [number, number]) : [0, 100];
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={lo}
          onChange={e => onChange([Number(e.target.value), hi])}
          className="w-16 border rounded px-2 py-1 text-xs"
          placeholder="Min"
        />
        <span className="text-xs text-gray-400">–</span>
        <input
          type="number"
          value={hi}
          onChange={e => onChange([lo, Number(e.target.value)])}
          className="w-16 border rounded px-2 py-1 text-xs"
          placeholder="Max"
        />
      </div>
    );
  }

  if (MULTI_VALUE_OPERATORS.has(operator) && meta?.valueOptions) {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto border rounded p-2 bg-white">
        {meta.valueOptions.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={e => {
                const next = e.target.checked
                  ? [...selected, opt.value]
                  : selected.filter(v => v !== opt.value);
                onChange(next);
              }}
              className="rounded"
            />
            {opt.label}
          </label>
        ))}
      </div>
    );
  }

  if (operator === 'within_last_n_days' || operator === 'before_n_days_ago') {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={e => onChange(Number(e.target.value))}
          className="w-16 border rounded px-2 py-1 text-xs"
          min={1}
          placeholder="N"
        />
        <span className="text-xs text-gray-400">days</span>
      </div>
    );
  }

  if (operator === 'after_date' || operator === 'before_date') {
    return (
      <input
        type="date"
        value={typeof value === 'string' ? value : ''}
        onChange={e => onChange(e.target.value)}
        className="border rounded px-2 py-1 text-xs"
      />
    );
  }

  // country with is/is_not/is_any_of: distinct dropdown
  if (fieldId === 'country' && (operator === 'is' || operator === 'is_not')) {
    const countries = useMemo(
      () => Array.from(new Set(leads.map(l => l.country).filter(Boolean))).sort(),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [leads],
    );
    return (
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={e => onChange(e.target.value)}
        className="border rounded px-2 py-1 text-xs"
      >
        <option value="">Select…</option>
        {countries.map(c => <option key={c} value={c!}>{c}</option>)}
      </select>
    );
  }

  if (meta?.valueOptions && (operator === 'is' || operator === 'is_not')) {
    return (
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={e => onChange(e.target.value)}
        className="border rounded px-2 py-1 text-xs"
      >
        <option value="">Select…</option>
        {meta.valueOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  // numeric single value
  if (meta?.category === 'numeric') {
    return (
      <input
        type="number"
        value={typeof value === 'number' ? value : ''}
        onChange={e => onChange(Number(e.target.value))}
        className="w-20 border rounded px-2 py-1 text-xs"
        placeholder="Value"
      />
    );
  }

  // text fallback
  return (
    <input
      type="text"
      value={typeof value === 'string' ? value : ''}
      onChange={e => onChange(e.target.value)}
      className="border rounded px-2 py-1 text-xs flex-1 min-w-0"
      placeholder="Value"
    />
  );
}

// ── Condition Row ─────────────────────────────────────────────────────────────

interface ConditionRowProps {
  condition: FilterCondition;
  leads:     Lead[];
  onChange:  (updated: FilterCondition) => void;
  onDelete:  () => void;
}

function ConditionRow({ condition, leads, onChange, onDelete }: ConditionRowProps) {
  const meta = FILTER_FIELDS.find(f => f.id === condition.fieldId);

  const handleFieldChange = (fieldId: FilterFieldId) => {
    const newMeta = FILTER_FIELDS.find(f => f.id === fieldId)!;
    onChange({
      ...condition,
      fieldId,
      operator: newMeta.allowedOperators[0],
      value:    null,
    });
  };

  const handleOperatorChange = (operator: FilterOperator) => {
    onChange({ ...condition, operator, value: null });
  };

  return (
    <div className="flex items-start gap-2 py-1.5">
      <GripVertical className="h-4 w-4 text-gray-300 mt-1.5 shrink-0 cursor-grab" />

      {/* Field selector */}
      <select
        value={condition.fieldId}
        onChange={e => handleFieldChange(e.target.value as FilterFieldId)}
        className="border rounded px-2 py-1 text-xs w-40 shrink-0"
      >
        {Object.entries(FILTER_FIELD_CATEGORIES).map(([cat, fieldIds]) => (
          <optgroup key={cat} label={cat}>
            {fieldIds.map(id => {
              const f = FILTER_FIELDS.find(f => f.id === id)!;
              return <option key={id} value={id}>{f.label}</option>;
            })}
          </optgroup>
        ))}
      </select>

      {/* Operator selector */}
      <select
        value={condition.operator}
        onChange={e => handleOperatorChange(e.target.value as FilterOperator)}
        className="border rounded px-2 py-1 text-xs w-36 shrink-0"
      >
        {meta?.allowedOperators.map(op => (
          <option key={op} value={op}>{OPERATOR_FULL_LABELS[op]}</option>
        ))}
      </select>

      {/* Value input */}
      <div className="flex-1 min-w-0">
        <ValueInput
          fieldId={condition.fieldId}
          operator={condition.operator}
          value={condition.value}
          leads={leads}
          onChange={v => onChange({ ...condition, value: v })}
        />
      </div>

      <button
        onClick={onDelete}
        className="text-gray-300 hover:text-red-500 mt-1 shrink-0"
        aria-label="Remove condition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Group Card ────────────────────────────────────────────────────────────────

interface GroupCardProps {
  group:        FilterGroup;
  leads:        Lead[];
  groupIndex:   number;
  onUpdate:     (g: FilterGroup) => void;
  onDelete:     () => void;
  onDuplicate:  () => void;
}

function GroupCard({ group, leads, groupIndex, onUpdate, onDelete, onDuplicate }: GroupCardProps) {
  const [menuOpen, setMenuOpen]     = useState(false);
  const [renaming, setRenaming]     = useState(false);
  const [nameInput, setNameInput]   = useState(group.name);
  const menuRef = useRef<HTMLDivElement>(null);

  // close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const commitRename = () => {
    onUpdate({ ...group, name: nameInput.trim() || group.name });
    setRenaming(false);
  };

  const toggleLogic = () =>
    onUpdate({ ...group, logic: group.logic === 'AND' ? 'OR' : 'AND' });

  const addCondition = () =>
    onUpdate({ ...group, conditions: [...group.conditions, emptyCondition()] });

  const updateCondition = (idx: number, updated: FilterCondition) => {
    const conditions = [...group.conditions];
    conditions[idx] = updated;
    onUpdate({ ...group, conditions });
  };

  const deleteCondition = (idx: number) => {
    const conditions = group.conditions.filter((_, i) => i !== idx);
    onUpdate({ ...group, conditions });
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm mb-3">
      {/* Group header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          {renaming ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') { setRenaming(false); setNameInput(group.name); }
                }}
                className="border rounded px-2 py-0.5 text-xs w-28"
              />
              <button onClick={commitRename} className="text-green-600 hover:text-green-700">
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold text-gray-600">{group.name}</span>
          )}

          <button
            onClick={toggleLogic}
            className="text-xs px-2 py-0.5 rounded-full border font-medium bg-white hover:bg-gray-100 text-gray-600"
            title="Toggle AND / OR logic within this group"
          >
            {group.logic}
          </button>
        </div>

        {/* ⋯ menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="text-gray-400 hover:text-gray-600 p-0.5"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 w-36 py-1">
              <button
                onClick={() => { setRenaming(true); setMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2"
              >
                <Pencil className="h-3.5 w-3.5" /> Rename
              </button>
              <button
                onClick={() => { onDuplicate(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button
                onClick={() => { onDelete(); setMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete group
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conditions */}
      <div className="px-3 py-1">
        {group.conditions.map((cond, idx) => (
          <React.Fragment key={cond.id}>
            {idx > 0 && (
              <div className="text-xs text-gray-400 pl-6 py-0.5">{group.logic}</div>
            )}
            <ConditionRow
              condition={cond}
              leads={leads}
              onChange={updated => updateCondition(idx, updated)}
              onDelete={() => deleteCondition(idx)}
            />
          </React.Fragment>
        ))}
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={addCondition}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Add condition
        </button>
      </div>
    </div>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────

export default function AdvancedFilterDrawer({
  open, advancedFilter, leads, onChange, onClose,
}: AdvancedFilterDrawerProps) {
  const [draft, setDraft] = useState<AdvancedFilter>({ groups: [] });

  // Sync draft when drawer opens
  useEffect(() => {
    if (open) setDraft(advancedFilter);
  }, [open, advancedFilter]);

  // Live count — debounced 200ms
  const [count, setCount] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!open) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const dupes = new Set<string>(
        Object.entries(
          leads.reduce((acc, l) => {
            const d = l.email?.split('@')[1];
            if (d) acc[d] = (acc[d] ?? 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        )
          .filter(([, n]) => n > 1)
          .map(([d]) => d),
      );
      setCount(applyAdvancedFilter(leads, draft, dupes).length);
    }, 200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [draft, leads, open]);

  const addGroup = useCallback(() => {
    setDraft(d => ({
      groups: [...d.groups, emptyGroup(d.groups.length + 1)],
    }));
  }, []);

  const updateGroup = useCallback((idx: number, updated: FilterGroup) => {
    setDraft(d => {
      const groups = [...d.groups];
      groups[idx] = updated;
      return { groups };
    });
  }, []);

  const deleteGroup = useCallback((idx: number) => {
    setDraft(d => ({ groups: d.groups.filter((_, i) => i !== idx) }));
  }, []);

  const duplicateGroup = useCallback((idx: number) => {
    setDraft(d => {
      const original = d.groups[idx];
      const copy: FilterGroup = {
        ...original,
        id:   crypto.randomUUID(),
        name: `${original.name} (copy)`,
        conditions: original.conditions.map(c => ({ ...c, id: crypto.randomUUID() })),
      };
      const groups = [...d.groups];
      groups.splice(idx + 1, 0, copy);
      return { groups };
    });
  }, []);

  const handleApply = () => {
    onChange(draft);
    onClose();
  };

  const handleClear = () => {
    const empty: AdvancedFilter = { groups: [] };
    setDraft(empty);
    onChange(empty);
    onClose();
  };

  const totalConditions = draft.groups.reduce((s, g) => s + g.conditions.length, 0);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] bg-gray-50 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Advanced Filters</h2>
            {totalConditions > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                {totalConditions} condition{totalConditions !== 1 ? 's' : ''} · groups combine with AND
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Groups scroll area */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {draft.groups.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No filter groups yet.</p>
              <p className="text-xs mt-1">Add a group to start filtering.</p>
            </div>
          ) : (
            draft.groups.map((group, idx) => (
              <GroupCard
                key={group.id}
                group={group}
                leads={leads}
                groupIndex={idx}
                onUpdate={updated => updateGroup(idx, updated)}
                onDelete={() => deleteGroup(idx)}
                onDuplicate={() => duplicateGroup(idx)}
              />
            ))
          )}

          <button
            onClick={addGroup}
            className="w-full border-2 border-dashed border-gray-200 rounded-lg py-3 text-xs text-gray-400 hover:border-blue-300 hover:text-blue-500 flex items-center justify-center gap-1.5 transition-colors mt-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add filter group
          </button>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-white border-t px-4 py-3 flex items-center gap-3">
          <div className="flex-1 text-xs text-gray-500">
            {count !== null && (
              <span>
                {count} lead{count !== 1 ? 's' : ''} match
              </span>
            )}
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded border hover:border-gray-400 transition-colors"
          >
            Clear all
          </button>
          <button
            onClick={handleApply}
            className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded font-medium transition-colors"
          >
            Apply filters
          </button>
        </div>
      </div>
    </>
  );
}
