import React from 'react';

export interface KpiCardProps {
  title:       string;
  value:       string | number;
  subtitle?:   string;
  delta?:      number;
  deltaLabel?: string;
  warning?:    boolean;
  danger?:     boolean;
  neutral?:    boolean;
  icon?:       React.ReactNode;
  onClick?:    () => void;
  isActive?:   boolean;
  badge?:      string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title, value, subtitle, delta, deltaLabel,
  warning, danger, neutral, icon,
  onClick, isActive, badge,
}) => {
  // ── Colour tokens ──────────────────────────────────────────────────────────
  const valueColor =
    danger  ? 'text-red-600'    :
    warning ? 'text-amber-600'  :
    neutral ? 'text-gray-700'   :
              'text-gray-900';

  const borderClass =
    isActive ? 'ring-2 ring-blue-500 border-transparent' :
    danger   ? 'border-red-200'   :
    warning  ? 'border-amber-200' :
               'border-gray-200';

  const iconColor =
    danger  ? 'text-red-500'   :
    warning ? 'text-amber-500' :
              'text-gray-400';

  // ── Delta indicator ────────────────────────────────────────────────────────
  const showDelta = delta !== undefined && delta !== 0;
  const deltaPositive = (delta ?? 0) > 0;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      onClick={onClick}
      className={`
        relative bg-white rounded-lg border p-5 shadow-sm transition-shadow duration-150
        ${borderClass}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
      `}
    >
      {/* Badge */}
      {badge && (
        <span className="absolute top-3 right-3 text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">
          {badge}
        </span>
      )}

      {/* Icon + Title row */}
      <div className="flex items-center space-x-2 mb-3">
        {icon && (
          <span className={`flex-shrink-0 ${iconColor}`}>
            {icon}
          </span>
        )}
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-none">
          {title}
        </span>
      </div>

      {/* Primary value */}
      <div className={`text-3xl font-bold leading-none truncate ${valueColor}`}>
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1.5 leading-snug">{subtitle}</p>
      )}

      {/* Delta */}
      {showDelta && (
        <p className={`text-xs font-medium mt-1.5 ${deltaPositive ? 'text-green-600' : 'text-red-500'}`}>
          {deltaPositive ? '↑' : '↓'}{' '}
          {deltaPositive ? '+' : ''}{delta}
          {deltaLabel ? ` ${deltaLabel}` : ''}
        </p>
      )}
    </div>
  );
};

export default KpiCard;
