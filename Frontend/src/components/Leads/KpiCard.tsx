import React from 'react';
import Badge from '../ui/Badge';

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
  /**
   * The figure cannot be computed honestly yet — e.g. it needs every lead and
   * the page holds one server page (step 5 pagination), or it reads a column
   * that does not exist. Renders a dash, a "Coming soon" badge and this reason,
   * and is NOT clickable: a card that shows a number computed over 20 rows, or
   * "All follow-ups on track" over a column nothing writes, is a false figure.
   */
  comingSoon?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title, value, subtitle, delta, deltaLabel,
  warning, danger, neutral, icon,
  onClick, isActive, badge, comingSoon,
}) => {
  if (comingSoon) {
    return (
      // Figma KPI card, in its "Coming soon" state (decided 2026-10-05).
      <div className="relative rounded-card border border-line bg-surface-panel p-4" data-coming-soon="true">
        <Badge tone="neutral" className="absolute right-3 top-3">Coming soon</Badge>
        <div className="mb-2 flex items-center gap-2">
          {icon && <span className="flex-shrink-0 text-ink-muted" aria-hidden="true">{icon}</span>}
          <span className="text-xs font-semibold leading-[18px] text-ink">{title}</span>
        </div>
        <div className="text-2xl font-bold leading-8 text-ink-muted" aria-label={`${title}: not available yet`}>—</div>
        <p className="mt-1 text-xs leading-[18px] text-ink-muted">{comingSoon}</p>
      </div>
    );
  }
  // ── Colour tokens ──────────────────────────────────────────────────────────
  // Figma value colours: red / amber for a warning figure, ink otherwise.
  const valueColor =
    danger  ? 'text-danger-700'  :
    warning ? 'text-warning-700' :
    neutral ? 'text-ink'         :
              'text-ink-heading';

  const borderClass = isActive ? 'border-transparent ring-2 ring-brand-600' : 'border-line';

  const iconColor =
    danger  ? 'text-danger-700'  :
    warning ? 'text-warning-700' :
              'text-ink-muted';

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
        relative rounded-card border bg-surface-panel p-4 transition-shadow duration-150
        ${borderClass}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
      `}
    >
      {/* Badge */}
      {badge && (
        <Badge tone="neutral" className="absolute right-3 top-3">{badge}</Badge>
      )}

      {/* Icon + Title row */}
      <div className="mb-2 flex items-center gap-2">
        {icon && (
          <span className={`flex-shrink-0 ${iconColor}`}>
            {icon}
          </span>
        )}
        <span className="text-xs font-semibold leading-[18px] text-ink">
          {title}
        </span>
      </div>

      {/* Primary value */}
      <div className={`truncate text-2xl font-bold leading-8 ${valueColor}`}>
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-1 text-xs leading-[18px] text-ink-muted">{subtitle}</p>
      )}

      {/* Delta */}
      {showDelta && (
        <p className={`mt-1 text-xs font-medium ${deltaPositive ? 'text-success-700' : 'text-danger-700'}`}>
          {deltaPositive ? '↑' : '↓'}{' '}
          {deltaPositive ? '+' : ''}{delta}
          {deltaLabel ? ` ${deltaLabel}` : ''}
        </p>
      )}
    </div>
  );
};

export default KpiCard;
