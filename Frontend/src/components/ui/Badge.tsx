import React from 'react';

/**
 * The status pill (Figma "Status badge": full radius, 8px × 3px padding, 12px
 * semibold). One component so a status reads the same on every screen.
 *
 * Tones are the frames' own pairs — the `-100` background with the `-700`
 * text from the semantic scales — and every pair passes WCAG AA for 12px text
 * (success 4.84, danger 5.30, warning 4.51, brand 5.62). `neutral` is the one
 * deliberate departure: Figma draws muted grey on the sunken surface, which is
 * 4.27:1, so neutral uses `ink-secondary` there (4.95) — see tailwind.config.js.
 *
 * A badge states a fact the caller already has. It is not a place to invent a
 * status: "Coming soon" is honest; a coloured "Healthy" over no measurement is
 * the fabricated-metric defect CLAUDE.md keeps removing.
 */
export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-ink-secondary',
  brand:   'bg-brand-50 text-brand-600',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger:  'bg-danger-100 text-danger-700',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', className = '', children, ...rest }) => (
  <span
    data-tone={tone}
    className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-[3px] text-xs font-semibold leading-[18px] ${TONE[tone]} ${className}`}
    {...rest}
  >
    {children}
  </span>
);

export default Badge;
