import React, { useId } from 'react';

/**
 * Form fields (Figma Settings "Field" 75:40012): a 12px semibold label, a 36px
 * control on the panel surface with a hairline border and 6px radius, then an
 * optional 12px help line.
 *
 * `Field` wires the accessibility a hand-rolled field forgets: the label is
 * bound to the control by id, help and error text are announced through
 * aria-describedby, and an error sets aria-invalid. It clones its single child
 * control to do that, so any <input>/<select>/<textarea> works unchanged.
 *
 * Read-only values (Figma "Role · set by an administrator") use the readonly
 * surface with INK text rather than the frame's muted grey at 75% opacity,
 * which measures 3.9:1 or lower — the value is information the user needs to
 * read, so it keeps body contrast.
 */
const CONTROL_BASE =
  'w-full rounded-ctrl border bg-surface-panel px-2.5 text-sm leading-[22px] text-ink ' +
  'placeholder:text-ink-muted transition-colors focus:border-brand-600 focus:outline-none ' +
  'focus:ring-2 focus:ring-brand-600/30 disabled:cursor-not-allowed disabled:bg-surface-readonly ' +
  'read-only:bg-surface-readonly';

/** Class strings, exported so a call site that cannot use <Field> still matches. */
export const inputClass = (invalid = false) =>
  `${CONTROL_BASE} h-9 ${invalid ? 'border-danger-700' : 'border-line'}`;
export const selectClass = inputClass;
export const textareaClass = (invalid = false) =>
  `${CONTROL_BASE} min-h-[88px] py-2 ${invalid ? 'border-danger-700' : 'border-line'}`;

export interface FieldProps {
  label: string;
  /** Exactly one form control. */
  children: React.ReactElement;
  help?: React.ReactNode;
  /** A server or validation message. Sets aria-invalid on the control. */
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ label, children, help, error, required, className = '' }) => {
  const autoId = useId();
  const id = (children.props as { id?: string }).id ?? autoId;
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  const control = React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    required: required || (children.props as { required?: boolean }).required,
  });

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-semibold leading-[18px] text-ink">
        {label}
        {required && <span className="text-danger-700" aria-hidden="true"> *</span>}
      </label>
      {control}
      {error && (
        <p id={errorId} className="text-xs leading-[18px] text-danger-700">{error}</p>
      )}
      {help && (
        <p id={helpId} className="text-xs leading-[18px] text-ink-muted">{help}</p>
      )}
    </div>
  );
};

export default Field;
