import React from 'react';
// lucide-react 0.344 names: CheckCircle2 is Figma's "circle-check",
// AlertTriangle its "triangle-alert" (renamed in later versions, same glyphs).
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

/**
 * The inline alert (Figma Settings "Alert" 75:39993 / 75:40057): a tinted
 * 8px-radius block with an icon, a 14px semibold title and a 12px message.
 *
 * HONEST FEEDBACK: a `success` alert is for an outcome the SERVER confirmed —
 * the Settings frame's own copy is "The server confirmed first name, last name
 * and email changes". Render it after a 2xx, never before one. An error alert
 * shows the server's message and leaves the user's input in place.
 *
 * `danger` announces assertively (role="alert"); the other tones politely
 * (role="status"), so a routine confirmation does not interrupt a screen
 * reader mid-sentence.
 */
export type AlertTone = 'success' | 'danger' | 'warning' | 'info';

const TONE: Record<AlertTone, { box: string; Icon: React.ElementType }> = {
  success: { box: 'bg-success-100 text-success-700', Icon: CheckCircle2 },
  danger:  { box: 'bg-danger-100 text-danger-700',   Icon: AlertTriangle },
  warning: { box: 'bg-warning-100 text-warning-700', Icon: AlertTriangle },
  info:    { box: 'bg-brand-50 text-brand-700',      Icon: Info },
};

export interface AlertProps {
  tone: AlertTone;
  title: React.ReactNode;
  children?: React.ReactNode;
  /** Optional trailing control, e.g. a Retry button. */
  action?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ tone, title, children, action, className = '' }) => {
  const { box, Icon } = TONE[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      data-tone={tone}
      className={`flex items-center gap-2.5 rounded-card p-3 ${box} ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-semibold leading-5">{title}</p>
        {children && <div className="text-xs leading-[18px]">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export default Alert;
