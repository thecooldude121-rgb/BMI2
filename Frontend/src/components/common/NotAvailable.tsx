import React from 'react';
import { Construction } from 'lucide-react';

/**
 * Honest placeholders for surfaces that are not implemented yet.
 *
 * WHY THIS EXISTS
 * A disabled control tells a user a feature is not ready. A success toast tells
 * them their data is safe. This codebase did the second in ~500 places — fake
 * "Saved!" / "Imported!" / "Deleted!" confirmations for writes that never
 * happened. That is worse than an unfinished feature: it destroys trust in the
 * data the product *does* store.
 *
 * CONVENTION
 * Any surface with no working backend renders <NotAvailable> instead of a
 * control that lies. Two consequences worth keeping:
 *   1. `grep -rl NotAvailable src/` is a live inventory of what is unfinished.
 *   2. Wiring a feature up = deleting one <NotAvailable>, so the count only
 *      ever goes down. That is the progress metric for Phases 2-3.
 *
 * Do NOT use this to hide a bug. It marks work that has not been done, not
 * work that is broken.
 */

interface NotAvailableProps {
  /** What the user was trying to do, in their words — e.g. "Exporting your data". */
  feature: string;
  /** Optional: what is true today, or what they can do instead. */
  detail?: string;
  className?: string;
}

export const NotAvailable: React.FC<NotAvailableProps> = ({ feature, detail, className = '' }) => (
  // Figma "Supporting state" styling (subtle surface, hairline border).
  <div
    className={`rounded-card border border-line bg-surface-subtle p-4 ${className}`}
    data-not-available={feature}
  >
    <div className="flex items-start gap-3">
      <Construction className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink-muted" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold leading-5 text-ink">{feature} is not available yet</p>
        {detail && <p className="mt-1 text-xs leading-[18px] text-ink-muted">{detail}</p>}
      </div>
    </div>
  </div>
);

/** Inline marker for a single control or list row that has no backend behind it. */
export const NotAvailableBadge: React.FC<{ label?: string; className?: string }> = ({
  label = 'Not available yet',
  className = '',
}) => (
  <span
    className={`inline-flex items-center rounded-full bg-surface-sunken px-2 py-[3px] text-xs font-semibold leading-[18px] text-ink-secondary ${className}`}
  >
    {label}
  </span>
);

/**
 * Props for a control that must stay visible (to keep a layout legible) but
 * must not appear actionable. Spread onto a <button>:
 *   <button {...stubControl('Bulk delete')} className="...">Delete</button>
 */
export const stubControl = (feature: string) => ({
  disabled: true,
  'aria-disabled': true as const,
  title: `${feature} is not available yet`,
  className: 'cursor-not-allowed opacity-50',
});
