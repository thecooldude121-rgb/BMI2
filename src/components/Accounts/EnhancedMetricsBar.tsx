import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricDetail {
  label: string;
  value: string | number;
}

interface Metric {
  title: string;
  value: string;
  subtitle?: string;
  details: MetricDetail[];
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
}

interface EnhancedMetricsBarProps {
  metrics: Metric[];
}

const EnhancedMetricsBar: React.FC<EnhancedMetricsBarProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map((metric, idx) => (
        <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
            {metric.trend && (
              <div className={`flex items-center text-sm font-medium ${
                metric.trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trend.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {metric.trend.value}
              </div>
            )}
          </div>

          <div className="text-sm font-medium text-gray-900 mb-3">{metric.title}</div>

          {metric.subtitle && (
            <div className="text-xs text-gray-600 mb-2">{metric.subtitle}</div>
          )}

          <div className="space-y-1 pt-2 border-t border-gray-100">
            {metric.details.map((detail, detailIdx) => (
              <div key={detailIdx} className="flex justify-between text-xs">
                <span className="text-gray-600">{detail.label}:</span>
                <span className="text-gray-900 font-medium">{detail.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EnhancedMetricsBar;
