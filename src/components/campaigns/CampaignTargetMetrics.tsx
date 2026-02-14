import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, X } from 'lucide-react';

interface MetricField {
  id: string;
  label: string;
  type: 'percentage' | 'count' | 'currency';
  placeholder: string;
  industryAvg: number;
  min: number;
  max: number;
  hint: string;
}

const METRICS: MetricField[] = [
  {
    id: 'openRate',
    label: 'Target Open Rate',
    type: 'percentage',
    placeholder: 'e.g., 30',
    industryAvg: 25,
    min: 0,
    max: 100,
    hint: 'Industry avg: 25%'
  },
  {
    id: 'replyRate',
    label: 'Target Reply Rate',
    type: 'percentage',
    placeholder: 'e.g., 15',
    industryAvg: 10,
    min: 0,
    max: 100,
    hint: 'Industry avg: 10%'
  },
  {
    id: 'opportunities',
    label: 'Target Opportunities',
    type: 'count',
    placeholder: 'e.g., 50',
    industryAvg: 0,
    min: 1,
    max: 10000,
    hint: 'Number of qualified opportunities'
  },
  {
    id: 'revenue',
    label: 'Target Revenue',
    type: 'currency',
    placeholder: 'e.g., 100000',
    industryAvg: 0,
    min: 1,
    max: 10000000,
    hint: 'Expected revenue from campaign'
  }
];

interface CampaignTargetMetricsProps {
  values: Record<string, number | null>;
  onChange: (values: Record<string, number | null>) => void;
}

export default function CampaignTargetMetrics({ values, onChange }: CampaignTargetMetricsProps) {
  const [focused, setFocused] = useState<string | null>(null);
  const [displayValues, setDisplayValues] = useState<Record<string, string>>(
    Object.keys(values).reduce((acc, key) => ({
      ...acc,
      [key]: values[key] !== null ? String(values[key]) : ''
    }), {})
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Auto-save after 5 seconds of inactivity
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      console.log('Target metrics auto-saved:', values);
      setHasChanges(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [values, hasChanges]);

  const formatValue = useCallback((value: string, type: MetricField['type']): string => {
    if (!value) return '';

    const numValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(numValue)) return '';

    switch (type) {
      case 'percentage':
        return String(numValue);
      case 'count':
        return String(Math.floor(numValue));
      case 'currency':
        return String(Math.floor(numValue));
      default:
        return value;
    }
  }, []);

  const getDisplayValue = useCallback((value: string, type: MetricField['type'], isFocused: boolean): string => {
    if (!value) return '';

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';

    if (isFocused) {
      return String(numValue);
    }

    switch (type) {
      case 'percentage':
        return `${numValue}%`;
      case 'count':
        return numValue.toLocaleString();
      case 'currency':
        return `$${numValue.toLocaleString()}`;
      default:
        return value;
    }
  }, []);

  const handleValueChange = useCallback((metricId: string, rawValue: string, metric: MetricField) => {
    const cleanValue = rawValue.replace(/[^0-9.]/g, '');

    if (cleanValue === '') {
      setDisplayValues(prev => ({ ...prev, [metricId]: '' }));
      onChange({ ...values, [metricId]: null });
      setHasChanges(true);
      return;
    }

    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return;

    // Apply constraints
    let constrainedValue = numValue;
    if (numValue < metric.min) constrainedValue = metric.min;
    if (numValue > metric.max) constrainedValue = metric.max;

    // Round based on type
    if (metric.type === 'count' || metric.type === 'currency') {
      constrainedValue = Math.floor(constrainedValue);
    }

    setDisplayValues(prev => ({ ...prev, [metricId]: String(constrainedValue) }));
    onChange({ ...values, [metricId]: constrainedValue });
    setHasChanges(true);
  }, [values, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, metric: MetricField) => {
    const currentValue = values[metric.id] || 0;
    const increment = (e.metaKey || e.ctrlKey) ? 10 : 1;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(currentValue + increment, metric.max);
      handleValueChange(metric.id, String(newValue), metric);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(currentValue - increment, metric.min);
      handleValueChange(metric.id, String(newValue), metric);
    }
  }, [values, handleValueChange]);

  const handleClear = useCallback((metricId: string) => {
    setDisplayValues(prev => ({ ...prev, [metricId]: '' }));
    onChange({ ...values, [metricId]: null });
    setHasChanges(true);
  }, [values, onChange]);

  const getComparison = useCallback((value: number | null, industryAvg: number) => {
    if (value === null || industryAvg === 0) return null;

    if (value > industryAvg) {
      return {
        icon: TrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        text: `${Math.round(((value - industryAvg) / industryAvg) * 100)}% above average`
      };
    } else if (value < industryAvg) {
      return {
        icon: TrendingDown,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        text: `${Math.round(((industryAvg - value) / industryAvg) * 100)}% below average`
      };
    }
    return null;
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          Target Metrics (Optional)
        </h3>
        <p className="text-sm text-gray-500">
          Set performance goals for your campaign
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {METRICS.map((metric) => {
          const value = values[metric.id];
          const isFocused = focused === metric.id;
          const comparison = getComparison(value, metric.industryAvg);
          const hasValue = displayValues[metric.id] !== '';

          return (
            <div key={metric.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {metric.label}
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={getDisplayValue(displayValues[metric.id], metric.type, isFocused)}
                  onChange={(e) => handleValueChange(metric.id, e.target.value, metric)}
                  onKeyDown={(e) => handleKeyDown(e, metric)}
                  onFocus={() => setFocused(metric.id)}
                  onBlur={() => setFocused(null)}
                  placeholder={metric.placeholder}
                  className={`
                    w-full px-3 py-2 pr-8 border rounded-lg
                    transition-all duration-200
                    ${isFocused
                      ? 'border-blue-500 ring-2 ring-blue-100 outline-none'
                      : 'border-gray-300'
                    }
                    hover:border-gray-400
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                  `}
                />

                {hasValue && (
                  <button
                    onClick={() => handleClear(metric.id)}
                    className="
                      absolute right-2 top-1/2 -translate-y-1/2
                      p-1 rounded
                      text-gray-400 hover:text-gray-600 hover:bg-gray-100
                      transition-colors
                    "
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Industry average hint */}
              {metric.industryAvg > 0 && !comparison && (
                <p className="text-xs text-gray-500">
                  {metric.hint}
                </p>
              )}

              {/* Comparison indicator */}
              {comparison && (
                <div className={`
                  flex items-center gap-1.5 px-2 py-1.5 rounded-md
                  ${comparison.bgColor}
                  transition-all duration-200
                `}>
                  <comparison.icon className={`w-3.5 h-3.5 ${comparison.color}`} />
                  <span className={`text-xs font-medium ${comparison.color}`}>
                    {comparison.text}
                  </span>
                </div>
              )}

              {/* Regular hint for non-percentage fields */}
              {metric.industryAvg === 0 && (
                <p className="text-xs text-gray-500">
                  {metric.hint}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Helper text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          <span className="font-medium">Pro tip:</span> Use arrow keys to adjust values (Cmd/Ctrl + Up/Down for +10/-10)
        </p>
      </div>

      {/* Auto-save indicator */}
      {hasChanges && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
          <span>Auto-saving in 5 seconds...</span>
        </div>
      )}
    </div>
  );
}
