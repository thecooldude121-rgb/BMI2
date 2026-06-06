import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, AlertTriangle, Plus, X, CalendarDays, Edit2,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RevenueInstallment {
  label: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'upcoming' | 'overdue';
}

export interface RevenueSchedule {
  type: 'upfront' | 'milestone' | 'recurring' | 'custom';
  currency: string;
  totalValue: number;
  installments: RevenueInstallment[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_INSTALLMENT: RevenueInstallment = {
  label: '',
  amount: 0,
  dueDate: '',
  status: 'upcoming',
};

const TYPE_CONFIG: Record<RevenueSchedule['type'], { label: string; badgeCx: string }> = {
  upfront:   { label: 'One-time',        badgeCx: 'bg-gray-100 text-gray-700' },
  milestone: { label: 'Milestone-based', badgeCx: 'bg-purple-100 text-purple-700' },
  recurring: { label: 'Recurring',       badgeCx: 'bg-blue-100 text-blue-700' },
  custom:    { label: 'Custom',          badgeCx: 'bg-amber-100 text-amber-700' },
};

const TYPE_BUTTONS: Array<{ value: RevenueSchedule['type']; label: string }> = [
  { value: 'upfront',   label: 'One-time' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'custom',    label: 'Custom' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface RevenueTimelineProps {
  schedule?: RevenueSchedule | null;
  defaultCurrency?: string;
  onSave: (schedule: RevenueSchedule) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const RevenueTimeline: React.FC<RevenueTimelineProps> = ({
  schedule,
  defaultCurrency = 'USD',
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<RevenueSchedule>(() =>
    schedule
      ? { ...schedule, installments: schedule.installments.map(i => ({ ...i })) }
      : { type: 'milestone', currency: defaultCurrency, totalValue: 0, installments: [{ ...EMPTY_INSTALLMENT }] }
  );

  useEffect(() => {
    if (schedule && !isEditing) {
      setDraft({ ...schedule, installments: schedule.installments.map(i => ({ ...i })) });
    }
  }, [schedule, isEditing]);

  const updateInstallment = (index: number, field: keyof RevenueInstallment, value: string | number) => {
    setDraft(prev => ({
      ...prev,
      installments: prev.installments.map((inst, i) =>
        i === index ? { ...inst, [field]: value } : inst
      ),
    }));
  };

  const addInstallment = () => {
    setDraft(prev => ({
      ...prev,
      installments: [...prev.installments, { ...EMPTY_INSTALLMENT }],
    }));
  };

  const removeInstallment = (index: number) => {
    if (draft.installments.length <= 1) return;
    setDraft(prev => ({
      ...prev,
      installments: prev.installments.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    const totalValue = draft.installments.reduce((sum, i) => sum + (i.amount || 0), 0);
    onSave({ ...draft, totalValue });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(
      schedule
        ? { ...schedule, installments: schedule.installments.map(i => ({ ...i })) }
        : { type: 'milestone', currency: defaultCurrency, totalValue: 0, installments: [{ ...EMPTY_INSTALLMENT }] }
    );
    setIsEditing(false);
  };

  const fmtSchedule = (amount: number) =>
    formatCurrency(amount, (schedule ?? draft).currency || defaultCurrency);

  // ── Section header ───────────────────────────────────────────────────────────

  const header = (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">Revenue Timeline</h3>
      </div>
      {schedule && !isEditing && (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <Edit2 className="h-3 w-3" />
          Edit
        </button>
      )}
    </div>
  );

  // ── Empty state ──────────────────────────────────────────────────────────────

  if (!schedule && !isEditing) {
    return (
      <div>
        {header}
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          No payment schedule set — Add schedule
        </button>
      </div>
    );
  }

  // ── Editing form ─────────────────────────────────────────────────────────────

  if (isEditing) {
    return (
      <div>
        {header}
        <div className="space-y-4">

          {/* Type selector — 4 pill buttons */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Schedule Type</div>
            <div className="flex gap-2 flex-wrap">
              {TYPE_BUTTONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDraft(d => ({ ...d, type: value }))}
                  className={`px-3 py-1.5 text-sm rounded-full border font-medium transition-colors ${
                    draft.type === value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Installment rows */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Payment Installments</div>
            <div className="space-y-2">
              {draft.installments.map((inst, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inst.label}
                    onChange={e => updateInstallment(i, 'label', e.target.value)}
                    placeholder="Label"
                    className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                  <div className="relative flex-shrink-0 w-24">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                    <input
                      type="number"
                      value={inst.amount || ''}
                      onChange={e => updateInstallment(i, 'amount', Number(e.target.value))}
                      placeholder="0"
                      min={0}
                      className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                  <input
                    type="text"
                    value={inst.dueDate}
                    onChange={e => updateInstallment(i, 'dueDate', e.target.value)}
                    placeholder="30 Jun 2026"
                    className="flex-shrink-0 w-28 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  />
                  <select
                    value={inst.status}
                    onChange={e => updateInstallment(i, 'status', e.target.value as RevenueInstallment['status'])}
                    className="flex-shrink-0 w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeInstallment(i)}
                    disabled={draft.installments.length <= 1}
                    title="Remove installment"
                    className="flex-shrink-0 flex items-center justify-center w-6 h-6 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addInstallment}
              className="mt-2 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add installment
            </button>
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Schedule
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ── Display view ─────────────────────────────────────────────────────────────

  if (!schedule) return null;

  const paidAmount = schedule.installments
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  const remaining = schedule.totalValue - paidAmount;
  const pct = schedule.totalValue > 0 ? Math.round((paidAmount / schedule.totalValue) * 100) : 0;
  const typeInfo = TYPE_CONFIG[schedule.type];

  return (
    <div>
      {header}

      {/* Type badge */}
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full mb-3 ${typeInfo.badgeCx}`}>
        {typeInfo.label}
      </span>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1.5">
          Revenue Collected:{' '}
          <span className="font-medium text-gray-700">{fmtSchedule(paidAmount)}</span>
          {' of '}
          <span className="font-medium text-gray-700">{fmtSchedule(schedule.totalValue)}</span>
          {' '}
          <span className="text-gray-400">({pct}%)</span>
        </div>
        <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Installment list */}
      <div className="mb-3">
        {schedule.installments.map((inst, i) => {
          const isPaid    = inst.status === 'paid';
          const isOverdue = inst.status === 'overdue';
          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0 ${isPaid ? 'opacity-60' : ''}`}
            >
              {isPaid ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              ) : isOverdue ? (
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Clock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-sm font-medium ${isOverdue ? 'text-red-700' : 'text-gray-800'}`}>
                    {inst.label || `Payment ${i + 1}`}
                  </span>
                  <span className={`text-sm font-semibold flex-shrink-0 ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                    {fmtSchedule(inst.amount)}
                  </span>
                </div>
                <div className={`text-xs mt-0.5 flex items-center gap-1.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                  {inst.dueDate}
                  {isOverdue && (
                    <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium text-[10px]">Overdue</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary line */}
      <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span className="font-medium text-gray-700">Total:</span> {fmtSchedule(schedule.totalValue)}
        {' · '}
        <span className="font-medium text-green-700">Paid:</span> {fmtSchedule(paidAmount)}
        {' · '}
        <span className="font-medium text-blue-600">Remaining:</span> {fmtSchedule(remaining)}
      </div>
    </div>
  );
};
