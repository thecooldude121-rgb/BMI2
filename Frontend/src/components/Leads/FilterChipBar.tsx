import React from 'react';
import { X } from 'lucide-react';
import type {
  AdvancedFilter, FilterCondition, FilterFieldId,
  FilterOperator, FilterValue,
} from '../../types/leadFilter';
import {
  FILTER_FIELDS, OPERATOR_CHIP_LABELS,
} from '../../types/leadFilter';

// ── Value display helper ──────────────────────────────────────────────────────

const NO_VALUE_OPERATORS = new Set<FilterOperator>([
  'is_empty', 'date_is_empty', 'text_is_empty', 'is_overdue', 'is_true', 'is_false',
]);

function formatValue(fieldId: FilterFieldId, operator: FilterOperator, value: FilterValue): string {
  if (NO_VALUE_OPERATORS.has(operator) || value === null || value === undefined) return '';

  const meta = FILTER_FIELDS.find(f => f.id === fieldId);

  if (Array.isArray(value)) {
    // between: [number, number]
    if (value.length === 2 && typeof value[0] === 'number') {
      return `${value[0]} – ${value[1]}`;
    }
    // string[]: is_any_of / is_none_of
    if (meta?.valueOptions) {
      const map = Object.fromEntries(meta.valueOptions.map(o => [o.value, o.label]));
      return (value as string[]).map(v => map[v] ?? v).join(' / ');
    }
    return (value as string[]).join(' / ');
  }

  if (typeof value === 'number') {
    if (operator === 'within_last_n_days') return `${value} days`;
    if (operator === 'before_n_days_ago')  return `${value} days ago`;
    return String(value);
  }

  if (typeof value === 'boolean') return '';

  // string — try to look up label
  if (meta?.valueOptions) {
    const opt = meta.valueOptions.find(o => o.value === value);
    if (opt) return opt.label;
  }
  return String(value);
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FilterChipBarProps {
  advancedFilter:     AdvancedFilter;
  onRemoveCondition:  (groupId: string, conditionId: string) => void;
  onRemoveGroup:      (groupId: string) => void;
  onClearAll:         () => void;
  onOpenDrawer:       () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

const FilterChipBar: React.FC<FilterChipBarProps> = ({
  advancedFilter, onRemoveCondition, onClearAll, onOpenDrawer,
}) => {
  const multipleGroups = advancedFilter.groups.length > 1;

  return (
    <div className="flex items-center gap-2 flex-wrap py-1">
      {advancedFilter.groups.map(group => {
        if (group.conditions.length === 0) return null;
        return (
          <React.Fragment key={group.id}>
            {/* Group label — only shown when multiple groups */}
            {multipleGroups && (
              <span className="text-xs text-gray-400 font-medium shrink-0">
                {group.name} ({group.logic})
              </span>
            )}

            {group.conditions.map((condition: FilterCondition) => {
              const meta    = FILTER_FIELDS.find(f => f.id === condition.fieldId);
              const opLabel = OPERATOR_CHIP_LABELS[condition.operator] ?? condition.operator;
              const valStr  = formatValue(condition.fieldId, condition.operator, condition.value);

              return (
                <span
                  key={condition.id}
                  onClick={onOpenDrawer}
                  className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs cursor-pointer hover:bg-blue-100 transition-colors shrink-0"
                >
                  <span className="font-medium">{meta?.label ?? condition.fieldId}</span>
                  <span className="opacity-70">{opLabel}</span>
                  {valStr && <span className="font-medium">{valStr}</span>}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onRemoveCondition(group.id, condition.id);
                    }}
                    className="ml-0.5 hover:text-blue-900 opacity-60 hover:opacity-100"
                    aria-label="Remove filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </React.Fragment>
        );
      })}

      <button
        onClick={onClearAll}
        className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap shrink-0 ml-auto"
      >
        Clear all filters
      </button>
    </div>
  );
};

export default FilterChipBar;
