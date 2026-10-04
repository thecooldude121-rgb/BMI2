import React from 'react';

/**
 * The empty / loading / error state block (Figma "Supporting state", Settings
 * 75:40067, and the "Bucket empty states" sections): the subtle surface, a
 * hairline border, a 14px title and a 12px explanation.
 *
 * CLAUDE.md: "Every list / dashboard / report needs a real EmptyState that
 * explains why it's empty and offers a primary action." So `reason` is
 * REQUIRED — an empty state that does not say why is a blank space — and
 * `action` is where the primary action goes.
 *
 * `tone="error"` is the frame's red variant: for a load that FAILED. A failed
 * load must never render as an empty list — an empty list reads as "there is
 * nothing", which is a different and false statement.
 */
export interface EmptyStateProps {
  title: string;
  /** Why it is empty (or what failed). Required. */
  reason: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'default' | 'error';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title, reason, action, icon, tone = 'default', className = '',
}) => {
  const isError = tone === 'error';
  return (
    <div
      role={isError ? 'alert' : undefined}
      data-empty-state={isError ? 'error' : 'empty'}
      className={`flex flex-col items-start gap-2 rounded-card border border-line p-[14px] ${
        isError ? 'bg-danger-100 text-danger-700' : 'bg-surface-subtle'
      } ${className}`}
    >
      {icon && <span className={isError ? '' : 'text-ink-muted'} aria-hidden="true">{icon}</span>}
      <p className={`text-sm font-semibold leading-5 ${isError ? '' : 'text-ink'}`}>{title}</p>
      <div className={`text-xs leading-[18px] ${isError ? '' : 'text-ink-muted'}`}>{reason}</div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
};

export default EmptyState;
