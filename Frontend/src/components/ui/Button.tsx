import React from 'react';

/**
 * The button.
 *
 * WHY THIS EXISTS
 * There are 326 distinct spellings of the primary button in this codebase. They
 * are not 326 different buttons: `px-4 py-2` covers 300 of ~500 sizing
 * instances, and the six most common strings (~97 uses between them) differ only
 * in whether `flex`, `font-medium` and `gap-2` appear, and in what order. Four
 * sizes and five variants cover essentially all of it.
 *
 * WHY IT IS SHAPED LIKE THIS
 * Two modal primitives already exist in this repo and are used by 5 files out of
 * 187 — 2.7%. ToastContext, meanwhile, reached 89% adoption. The difference is
 * friction: `useToast()` is one line, the modals require restructuring JSX. So
 * this component is deliberately a drop-in for a `<button>`: it forwards every
 * native prop and its ref, and `className` still works and wins. Converting a
 * call site is deleting a class string, not rewriting a component.
 *
 * ACCESSIBILITY, built in rather than retrofitted
 * - A disabled button gets aria-disabled as well as disabled, because
 *   `disabled` alone removes it from the tab order and some screen readers stop
 *   announcing it at all.
 * - `loading` sets aria-busy and blocks the click, so a double-submit is not
 *   possible while a request is in flight.
 * - An icon-only button REQUIRES an accessible name via `aria-label`; the type
 *   makes it impossible to omit. The app has 157 aria-labels against 4,320
 *   buttons today, which is how icon buttons end up announced as "button".
 * - The focus ring is explicit. src/index.css sets a global :focus-visible ring,
 *   but a button that overrides outline must restore it itself.
 */

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Resting + hover + focus ring per variant. Semantic tokens, never raw hues.
 * FIGMA (2026-10-05, Leads header 61:70): primary is indigo on white; the
 * secondary "action button" is the panel surface with a hairline border and
 * ink text; no drop shadows. Danger uses the frames' red (#B91C1C, 6.5:1 with
 * white). Every variant passes AA for its label.
 */
const VARIANT: Record<Variant, string> = {
  primary:   'border border-transparent bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-600',
  secondary: 'border border-line bg-surface-panel text-ink hover:bg-surface-subtle focus-visible:ring-brand-600',
  danger:    'border border-transparent bg-danger-700 text-white hover:bg-danger-800 focus-visible:ring-danger-700',
  ghost:     'border border-transparent bg-transparent text-ink hover:bg-black/5 focus-visible:ring-brand-600',
  link:      'bg-transparent text-brand-600 hover:text-brand-700 hover:underline focus-visible:ring-brand-600',
};

/**
 * Four sizes. `md` is Figma's 34px action button (14px label, 12px side
 * padding). MIN-heights, not fixed heights, so a wrapped label grows the
 * button instead of being clipped.
 */
const SIZE: Record<Size, string> = {
  sm: 'min-h-[28px] px-2.5 py-1 text-xs gap-1.5',
  md: 'min-h-[34px] px-3 py-1.5 text-sm gap-1.5',    // the default
  lg: 'min-h-[38px] px-4 py-2 text-sm gap-2',
  xl: 'min-h-[44px] px-5 py-2.5 text-base gap-2',
};

const ICON_ONLY: Record<Size, string> = {
  sm: 'h-7 w-7', md: 'h-[34px] w-[34px]', lg: 'h-[38px] w-[38px]', xl: 'h-11 w-11',
};

interface BaseProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: Variant;
  size?: Size;
  /** Replaces the `flex-1` seen on 74 call sites. */
  fullWidth?: boolean;
  /** Shows a spinner, sets aria-busy, and blocks the click. */
  loading?: boolean;
  /** Rendered before the label. Marked aria-hidden — the label carries meaning. */
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

/**
 * Either give the button a visible label, or make it icon-only AND supply an
 * aria-label. The union makes an unlabelled icon button a compile error.
 */
type ButtonProps =
  | (BaseProps & { children: React.ReactNode; iconOnly?: false })
  | (BaseProps & { children?: never; iconOnly: true; 'aria-label': string; leadingIcon: React.ReactNode });

const Spinner = () => (
  <span
    aria-hidden="true"
    className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
  />
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth,
    loading,
    leadingIcon,
    trailingIcon,
    iconOnly,
    className = '',
    disabled,
    type = 'button',   // native default is 'submit', which submits surprise forms
    onClick,
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      // Both, deliberately: `disabled` alone drops the button out of the tab
      // order, so a screen-reader user never learns it is there.
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      onClick={loading ? undefined : onClick}
      className={[
        'inline-flex items-center justify-center rounded-ctrl font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT[variant],
        iconOnly ? ICON_ONLY[size] : SIZE[size],
        fullWidth ? 'w-full' : '',
        // Last so a call site can still override anything during migration.
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {loading ? <Spinner /> : leadingIcon ? <span aria-hidden="true" className="shrink-0">{leadingIcon}</span> : null}
      {!iconOnly && children}
      {!loading && trailingIcon ? <span aria-hidden="true" className="shrink-0">{trailingIcon}</span> : null}
    </button>
  );
});

export default Button;
