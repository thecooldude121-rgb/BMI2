import React from 'react';

/**
 * The page header every screen uses (Figma "Leads header", 61:65): an optional
 * eyebrow, the title, an optional one-line description, and actions aligned to
 * the bottom right.
 *
 * Screens adopt it one at a time as they are rebuilt (Figma rollout, phase 3);
 * this file is the single definition so they cannot drift apart.
 *
 * The eyebrow is a prop, never a default: the frames show captions such as
 * "PIPELINE INTAKE · INDIA & MEA", which describe the mockup's workspace, not
 * ours. Pass one only when it states something true.
 */
export interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, eyebrow, description, actions }) => (
  <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex min-w-0 flex-col gap-1">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase text-brand-600">{eyebrow}</p>
      )}
      <h1 className="text-[32px] font-bold leading-10 text-ink">{title}</h1>
      {description && (
        <p className="text-sm leading-[22px] text-ink-muted">{description}</p>
      )}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

export default PageHeader;
