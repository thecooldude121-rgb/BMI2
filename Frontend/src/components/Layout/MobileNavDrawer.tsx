import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogOut } from 'lucide-react';
import { SidebarNav } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Navigation below the `lg` breakpoint.
 *
 * WHAT THIS FIXES, stated plainly because the gap was total rather than
 * cosmetic: `Sidebar` is `hidden lg:flex`, and nothing replaced it. Rendered at
 * a real 390px viewport, the app had ZERO visible links — no hamburger, no
 * drawer, no tab bar — and the TopBar's last two controls (mail, and the
 * profile menu that holds Sign out) sat at x=414 and x=482 inside a 390px shell
 * whose parent is `overflow-hidden`, so they could not even be scrolled to. A
 * signed-in user on a phone could reach nothing and could not sign out. The
 * same was true at 768px, i.e. every tablet in portrait.
 *
 * The rows come from `SidebarNav`, not from a second list here — see the note
 * on `navGroups`.
 *
 * Sign out is repeated at the foot of the drawer even though the profile menu
 * also offers it. That is deliberate, not redundancy: the profile menu is the
 * surface that was unreachable, so the escape hatch should not depend on it
 * being laid out correctly.
 */
const MobileNavDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes. Registered only while open so the app has no stray global
  // key handler when the drawer is not on screen.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // The page behind a modal drawer must not scroll. Restores whatever was
  // there before rather than assuming '' — another overlay may own it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  // Move focus into the drawer when it opens, so a keyboard user is not left
  // tabbing through the page underneath.
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const handleSignOut = () => {
    logout();
    onClose();
    navigate('/login');
  };

  // z-300 clears the dev role switcher's z-200. A modal drawer must sit above a
  // debug badge, and at 390px the badge's expanded panel otherwise overlapped
  // this panel's right edge — the exact "never blocks nav chrome" rule the badge
  // was just moved to satisfy.
  return (
    <div className="lg:hidden fixed inset-0 z-[300]">
      {/* Scrim. Clicking it closes; it is not a control, so it carries no role
          and Escape above is the keyboard equivalent. */}
      <div
        className="absolute inset-0 bg-gray-900/60"
        onClick={onClose}
        data-testid="mobile-nav-scrim"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface-sidebar text-ink flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line bg-surface-panel h-16 px-4 shrink-0">
          <button
            type="button"
            onClick={() => { navigate('/crm/dashboard'); onClose(); }}
            className="flex items-center gap-2.5 overflow-hidden rounded-card"
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-card bg-brand-600 text-sm font-bold text-white">
              B
            </span>
            <span className="text-base font-bold text-ink whitespace-nowrap">
              BMI Platform
            </span>
          </button>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex items-center justify-center w-8 h-8 rounded-card text-ink-muted hover:text-ink hover:bg-black/5 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-[18px]">
          <SidebarNav onNavigate={onClose} />
        </div>

        <div className="border-t border-line px-3 py-2 shrink-0">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 h-[38px] px-2.5 rounded-card text-sm text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNavDrawer;
