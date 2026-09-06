import { useEffect, useRef } from 'react';

/**
 * The four things a hand-rolled modal in this codebase is missing.
 *
 * A survey of the tree found 255 modal overlays. Two were announced to screen
 * readers, seventeen of 128 files handled Escape, and none trapped focus. The
 * practical effect for someone using a keyboard: the overlay appears, focus is
 * still on the button behind it, Tab walks through the page underneath rather
 * than the dialog, and Escape does nothing — so there is no way out except a
 * mouse.
 *
 * This hook fixes that for an existing modal without rewriting its markup.
 * Prefer the `Modal` primitive for new code, which calls this internally and
 * also supplies the role/aria wiring and the standard chrome. Reach for the
 * hook directly when a modal's layout is too custom to fit the primitive.
 *
 *   const ref = useRef<HTMLDivElement>(null);
 *   useModalA11y(ref, { isOpen, onClose });
 *   ...
 *   <div ref={ref} role="dialog" aria-modal="true" aria-label="Edit deal">
 *
 * What it does while open:
 *   - Escape calls onClose.
 *   - Focus moves into the dialog on open — the first focusable element in
 *     `initialFocusRef` if given, else the first in the container, else the
 *     container itself.
 *   - Tab and Shift+Tab cycle within the dialog instead of escaping it.
 *   - On close, focus returns to whatever held it before the dialog opened, so
 *     the user is not dumped at the top of the document.
 *   - Body scroll is locked, so the page behind does not scroll under the
 *     overlay.
 *
 * All of it is a no-op while `isOpen` is false, and every listener and style
 * change is reverted on cleanup.
 */

/**
 * Elements that can hold focus. `:not([disabled])` matters because a disabled
 * control still matches the base selectors but cannot be focused — including it
 * makes the "first focusable element" land on nothing.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * A focusable element inside a collapsed section is in the DOM but cannot be
 * focused, and including it makes the "first focusable element" land on nothing.
 *
 * Deliberately NOT `offsetParent !== null`, the usual shorthand. offsetParent is
 * null for any position:fixed element — which every modal panel here is — and
 * jsdom has no layout engine so it returns null for everything. Both would
 * classify the entire dialog as invisible and disable the trap outright.
 */
const isVisible = (el: HTMLElement): boolean => {
  if (el.closest('[hidden]')) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden';
};

const focusableWithin = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible);

export interface ModalA11yOptions {
  isOpen: boolean;
  /** Called on Escape. Omit to opt out of Escape-to-close. */
  onClose?: () => void;
  /** Set false for a modal that must be dismissed by an explicit choice. */
  closeOnEscape?: boolean;
  /** Set false to keep the page behind scrollable (e.g. a non-blocking panel). */
  lockScroll?: boolean;
  /**
   * Region to take initial focus from, when the first focusable element in the
   * container is not the one the user wants.
   *
   * The close button sits in the header, so it is first in DOM order and would
   * otherwise take focus on open — meaning the user's first Enter throws the
   * dialog away. Point this at the body so focus lands on the first real
   * control, and the header is still reachable by Shift+Tab.
   */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

export function useModalA11y(
  containerRef: React.RefObject<HTMLElement | null>,
  {
    isOpen,
    onClose,
    closeOnEscape = true,
    lockScroll = true,
    initialFocusRef,
  }: ModalA11yOptions,
): void {
  // Held in a ref, not state: capturing the previously focused element must not
  // itself trigger a render, and it has to survive every render while open.
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // onClose is frequently an inline arrow, so a new identity every render. Kept
  // in a ref so the key listener below is attached once per open rather than
  // torn down and rebuilt on each render of the parent.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // The container needs to be focusable for the fallback below to work, but
    // must stay out of the Tab order itself.
    if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');

    // Prefer the body region, then anything in the dialog, then the dialog
    // itself — so a dialog with no controls at all still pulls focus off the
    // page behind it.
    const preferred = initialFocusRef?.current
      ? focusableWithin(initialFocusRef.current)
      : [];
    const fallback = focusableWithin(container);
    (preferred[0] ?? fallback[0] ?? container).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && onCloseRef.current) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab') return;

      // Re-queried on every Tab rather than cached at open: the contents of a
      // dialog change as the user types, expands a section, or a step advances,
      // and a stale list would trap focus on a removed element.
      const focusable = focusableWithin(container);
      if (focusable.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === container)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (active instanceof Node && !container.contains(active)) {
        // Focus escaped some other way — a click on the page behind, or a
        // programmatic focus() elsewhere. Pull it back.
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    const previousOverflow = lockScroll ? document.body.style.overflow : null;
    if (lockScroll) document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      if (previousOverflow !== null) document.body.style.overflow = previousOverflow;

      // Only restore focus if it is still inside the dialog. If the close
      // handler already moved focus somewhere deliberate — navigating to a new
      // record, say — stealing it back would fight the app.
      const active = document.activeElement;
      const stillInside =
        active instanceof Node &&
        (container.contains(active) || active === document.body);
      if (stillInside && previouslyFocused.current?.isConnected) {
        previouslyFocused.current.focus();
      }
    };
    // containerRef is a stable ref object; its .current is read inside.
  }, [isOpen, closeOnEscape, lockScroll, containerRef, initialFocusRef]);
}
