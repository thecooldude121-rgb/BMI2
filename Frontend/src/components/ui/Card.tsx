import React from 'react';

/**
 * Containers from the frames.
 *
 * `Card` — Figma "Content card": the panel surface, a hairline border, 8px
 * radius, 16px padding. `padding="lg"` is the summary card (20px, 12px radius).
 *
 * `SectionHeading` — Figma "Section heading": 24px semibold in the heading
 * indigo, a 14px muted line under it, optional actions on the right. It renders
 * an <h2>; the page title (PageHeader) is the <h1>.
 */
type Padding = 'none' | 'md' | 'lg';

const PADDING: Record<Padding, string> = {
  none: 'rounded-card',
  md:   'rounded-card p-4',
  lg:   'rounded-xl p-5',
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
}

export const Card: React.FC<CardProps> = ({ padding = 'md', className = '', children, ...rest }) => (
  <div className={`border border-line bg-surface-panel ${PADDING[padding]} ${className}`} {...rest}>
    {children}
  </div>
);

export interface SectionHeadingProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ title, description, actions, className = '' }) => (
  <div className={`flex items-end justify-between gap-4 ${className}`}>
    <div className="flex min-w-0 flex-col gap-0.5">
      <h2 className="text-2xl font-semibold leading-8 text-ink-heading">{title}</h2>
      {description && <p className="text-sm leading-[22px] text-ink-muted">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

export default Card;
