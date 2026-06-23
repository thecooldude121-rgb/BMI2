import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { AssignmentRule } from '../../utils/assignmentRules/types';
import { getRules, toggleRule, deleteRule, reorderRules } from '../../utils/assignmentRules/rulesStore';

interface Props {
  onEdit: (rule: AssignmentRule) => void;
  onNew: () => void;
  refresh: number;
}

const MODE_LABELS: Record<string, string> = {
  direct_user: 'Direct',
  round_robin: 'Round Robin',
  weighted_round_robin: 'Weighted RR',
  queue: 'Queue',
};

const MODE_COLORS: Record<string, string> = {
  direct_user: 'bg-blue-100 text-blue-700',
  round_robin: 'bg-purple-100 text-purple-700',
  weighted_round_robin: 'bg-violet-100 text-violet-700',
  queue: 'bg-amber-100 text-amber-700',
};

export default function RuleList({ onEdit, onNew, refresh }: Props) {
  const [rules, setRules] = useState<AssignmentRule[]>([]);

  useEffect(() => {
    setRules(getRules().sort((a, b) => a.priority - b.priority));
  }, [refresh]);

  function handleToggle(id: string, enabled: boolean) {
    toggleRule(id, enabled);
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled } : r));
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this rule? This cannot be undone.')) return;
    deleteRule(id);
    setRules(prev => prev.filter(r => r.id !== id).map((r, i) => ({ ...r, priority: i + 1 })));
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const reordered = [...rules];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const withPriority = reordered.map((r, i) => ({ ...r, priority: i + 1 }));
    setRules(withPriority);
    reorderRules(withPriority.map(r => r.id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Rules are evaluated in priority order — first match wins. Drag rows to reorder.
        </p>
        <button
          onClick={onNew}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Rule
        </button>
      </div>

      {rules.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">⚙</div>
          <p className="font-medium text-gray-500 mb-1">No assignment rules yet</p>
          <p className="text-sm">Create a rule to automatically route incoming leads.</p>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="rules">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {rules.map((rule, index) => (
                <Draggable key={rule.id} draggableId={rule.id} index={index}>
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={`bg-white border rounded-xl p-4 flex items-center gap-4 transition-shadow ${
                        snapshot.isDragging ? 'shadow-lg border-blue-300' : 'border-gray-200 hover:border-gray-300'
                      } ${!rule.enabled ? 'opacity-50' : ''}`}
                    >
                      {/* Drag handle */}
                      <div {...drag.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing select-none text-xl leading-none">
                        ⋮⋮
                      </div>

                      {/* Priority badge */}
                      <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 shrink-0">
                        {rule.priority}
                      </span>

                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(rule.id, !rule.enabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                          rule.enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                        title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          rule.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 text-sm truncate">{rule.name || 'Untitled Rule'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${MODE_COLORS[rule.action.mode]}`}>
                            {MODE_LABELS[rule.action.mode]}
                          </span>
                          {rule.followUpTask?.enabled && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Follow-up {rule.followUpTask.type}
                            </span>
                          )}
                        </div>
                        {rule.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{rule.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''} — match {rule.conditionGrouping === 'all' ? 'ALL' : 'ANY'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onEdit(rule)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
