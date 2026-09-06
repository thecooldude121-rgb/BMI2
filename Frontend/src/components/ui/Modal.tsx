import React, { useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';

/**
 * The dialog primitive.
 *
 * There are 255 hand-rolled modal overlays in this tree and they disagree with
 * each other on nearly everything: backdrop tint, panel radius, whether there
 * is a header, whether Escape works, whether the close button is an icon or a
 * word. Two of the 255 were announced to a screen reader.
 *
 * This exists so new modals are correct without anyone having to remember the
 * list. It supplies:
 *   - role="dialog" + aria-modal, with aria-labelledby wired to the real title
 *     node via useId(), so the dialog is announced by name
 *   - Escape to close, focus moved in on open and restored on close, and a Tab
 *     cycle that stays inside the panel (see useModalA11y)
 *   - backdrop click to close, without the bug where a drag that starts inside
 *     the panel and ends on the backdrop closes the dialog
 *   - the panel chrome the majority of existing modals already draw by hand
 *
 * The title is a required prop rather than an optional one because a dialog
 * with no accessible name announces as just "dialog", which is worse than the
 * unlabelled div it replaced. Pass `titleHidden` for a dialog whose heading
 * would be visually redundant — the name is still there for assistive tech.
 */

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Widths measured from the existing modals; these five cover nearly all of them. */
const SIZES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]',
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Accessible name. Required — see note above. */
  title: string;
  /** Render the title for assistive tech only. */
  titleHidden?: boolean;
  description?: string;
  size?: ModalSize;
  children: React.ReactNode;
  /** Pinned to the bottom of the panel, outside the scrolling body. */
  footer?: React.ReactNode;
  /** For a confirmation that must be answered rather than dismissed. */
  dismissible?: boolean;
  /** Extra classes for the panel. */
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  titleHidden = false,
  description,
  size = 'md',
  children,
  footer,
  dismissible = true,
  className = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // useId, not a module counter: two instances of the same modal component
  // (a list row's edit dialog, say) would otherwise emit the same DOM id and
  // both aria-labelledby references would resolve to the first one.
  const titleId = useId();
  const descId = useId();

  useModalA11y(panelRef, {
    isOpen,
    onClose,
    closeOnEscape: dismissible,
    // Without this, focus opens on the header's close button — first in DOM
    // order — and the user's first Enter discards the dialog.
    initialFocusRef: bodyRef,
  });

  // Tracks where a mousedown began. Without this, selecting text in the panel
  // and releasing past its edge registers as a backdrop click and throws away
  // whatever the user was doing.
  const pressStartedOnBackdrop = useRef(false);

  if (!isOpen) return null;

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    pressStartedOnBackdrop.current = e.target === e.currentTarget;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (!dismissible) return;
    if (e.target === e.currentTarget && pressStartedOnBackdrop.current) onClose();
    pressStartedOnBackdrop.current = false;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`flex max-h-[90vh] w-full ${SIZES[size]} flex-col rounded-xl bg-white shadow-xl ${className}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className={
                titleHidden ? 'sr-only' : 'truncate text-lg font-semibold text-gray-900'
              }
            >
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label={`Close ${title}`}
              className="-m-1 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
