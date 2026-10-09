import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Inbox, Settings, LogOut, ChevronDown, Plus,
  DollarSign, Users, UserPlus, Building2, CheckSquare,
  Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GlobalSearch from './GlobalSearch';
import NotificationsBell from '../Notifications/NotificationsBell';

// The section label beside the brand (Figma shows one word, e.g. "Settings").
// `parent` is kept for callers and tests; the bar renders only `label`.
const getBreadcrumb = (pathname: string): { parent?: string; label: string } => {
  if (pathname.startsWith('/crm/deals'))         return { parent: 'CRM', label: 'Deals' };
  if (pathname.startsWith('/crm/forecast'))       return { parent: 'CRM', label: 'Forecast' };
  if (pathname.startsWith('/crm/leads'))         return { parent: 'CRM', label: 'Leads' };
  if (pathname.startsWith('/crm/contacts'))      return { parent: 'CRM', label: 'Contacts' };
  if (pathname.startsWith('/crm/accounts'))      return { parent: 'CRM', label: 'Accounts' };
  if (pathname.startsWith('/crm/activities'))    return { parent: 'CRM', label: 'Activities' };
  if (pathname.startsWith('/crm/tasks'))         return { parent: 'CRM', label: 'Tasks' };
  if (pathname.startsWith('/crm/meetings'))      return { parent: 'CRM', label: 'Meetings' };
  if (pathname.startsWith('/crm/inbox'))         return { parent: 'CRM', label: 'Inbox' };
  if (pathname.startsWith('/crm/calls'))         return { parent: 'CRM', label: 'Calls' };
  if (pathname.startsWith('/crm/reports'))       return { parent: 'CRM', label: 'Reports' };
  if (pathname.startsWith('/crm/documents'))     return { parent: 'CRM', label: 'Documents' };
  if (pathname.startsWith('/crm/ai-copilot'))    return { parent: 'CRM', label: 'AI Copilot' };
  // Before the generic /crm line, or Settings would read as plain "CRM".
  if (pathname.startsWith('/crm/settings'))      return { parent: 'CRM', label: 'Settings' };
  if (pathname.startsWith('/crm/dashboard'))     return { label: 'Dashboard' };
  if (pathname.startsWith('/crm'))               return { label: 'CRM' };
  if (pathname.startsWith('/analytics'))         return { label: 'Analytics' };
  if (pathname.startsWith('/calendar'))          return { label: 'Calendar' };
  if (pathname.startsWith('/sequences'))         return { label: 'Sequences' };
  if (pathname.startsWith('/integrations'))      return { label: 'Integrations' };
  if (pathname.startsWith('/team'))              return { label: 'Team' };
  if (pathname.startsWith('/settings'))          return { label: 'Settings' };
  if (pathname.startsWith('/dashboard'))         return { label: 'Dashboard' };
  return { label: 'BMI Platform' };
};

export const NEW_MENU_ITEMS = [
/**
 * Three of these five were broken, and two of them failed in the worst possible
 * way — `/crm/deals/new` and `/accounts/new` had no route, fell through to
 * `/deals/:id` and `/accounts/:accountId`, and rendered "Could not load deal —
 * Deal not found" and "Account not found" for records the user had just asked to
 * create. `/crm/tasks/new` had no route at all and rendered a blank page.
 *
 * `new` is now a declared route on deals and accounts (and reserved against ever
 * reading as an id again — see `utils/reservedRouteSegments`).
 *
 * Task is the odd one out ON PURPOSE. There is no task create PAGE and there
 * should not be: creating a task is `TaskFormModal`, already built, already
 * wired to the API, and already opened by "New task" on the tasks list. So this
 * item goes to the list and asks it to open that modal, rather than inventing a
 * second create surface for the same record.
 */
  { label: 'New Deal',    icon: DollarSign,  href: '/crm/deals/new' },
  { label: 'New Contact', icon: Users,        href: '/crm/contacts/new' },
  { label: 'New Lead',    icon: UserPlus,     href: '/crm/leads/new' },
  { label: 'New Account', icon: Building2,    href: '/crm/accounts/new' },
  { label: 'New Task',    icon: CheckSquare,  href: '/crm/tasks?new=1' },
];

/*
 * There is NO notification feed. The bell used to render five invented alerts
 * (a closing Acme deal, an overdue GlobalTech contract, a reply from "Sarah
 * Chen", an "AI insight" about a Meridian deal) and a red "5" badge on every
 * page — fabricated data in the one place a user glances at most. Removed
 * 2026-10-03. The bell stays as a visible empty state; the badge returns only
 * with a real notifications source.
 */

/** Up to two initials from a display name; '?' when there is none. */
export const initialsOf = (name?: string | null): string => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

/** Figma's 36px square tool button (Inbox, Notifications). */
const toolButton =
  'flex h-9 w-9 items-center justify-center rounded-card border border-line text-ink transition-colors';

/**
 * The full-width top bar (Figma "Top bar", 75:39846): brand and current
 * section on the left; search, + New, inbox, notifications and the profile on
 * the right.
 *
 * Three controls here used to look live and do nothing. They keep their Figma
 * place and say "coming soon" instead (CLAUDE.md, Honest Feedback):
 *   - search accepted typing and searched nothing — it was disabled, and is
 *     REAL since Group B item 10 (GlobalSearch: leads, contacts, accounts,
 *     deals; Ctrl/⌘+K focuses it);
 *   - the mail button had no handler and wore a green "unread" dot — now a
 *     disabled Inbox, no dot;
 *   - the avatar fell back to a STOCK PHOTO of a stranger for any user without
 *     one — now the user's initials.
 * "+ New" is not in the frame; it is kept because it is real (every item is a
 * routed create surface — see NEW_MENU_ITEMS) and removing it would take away
 * working functionality for a pixel match.
 *
 * `onOpenMobileNav` is supplied by Layout below the `lg` breakpoint, where the
 * sidebar does not render. It is optional so TopBar still mounts standalone in
 * tests and in any future shell that has no drawer.
 */
const TopBar: React.FC<{ onOpenMobileNav?: () => void }> = ({ onOpenMobileNav }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);

  const crumb = getBreadcrumb(pathname);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) setShowNewMenu(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface-panel px-4 lg:px-6">
      {/* Brand and section — left */}
      <div className="flex min-w-0 items-center gap-[18px]">
        <div className="flex min-w-0 items-center gap-2.5 lg:w-[192px]">
          {/*
            * Below `lg` the sidebar is `hidden`, so this button is the ONLY way to
            * reach any other page. It sits in the left group so it stays pinned to
            * the left edge and can never be pushed off-screen by the actions,
            * which is exactly what happened to the mail button and the profile
            * menu before.
            */}
          {onOpenMobileNav && (
            <button
              type="button"
              onClick={onOpenMobileNav}
              aria-label="Open navigation menu"
              className="lg:hidden -ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-card text-ink hover:bg-black/5 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/crm/dashboard')}
            className="flex min-w-0 items-center gap-2.5 rounded-card"
            aria-label="BMI Platform — go to dashboard"
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-card bg-brand-600 text-sm font-bold text-white">
              B
            </span>
            <span className="hidden truncate text-base font-bold leading-6 text-ink sm:inline">BMI Platform</span>
          </button>
        </div>
        <span className="hidden truncate text-sm font-semibold leading-[22px] text-ink-muted md:inline" data-testid="topbar-section">
          {crumb.label}
        </span>
      </div>

      {/* Global tools — right */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">

        {/* Global search — real since Group B item 10 (it was a disabled box). */}
        <GlobalSearch />

        {/* + New */}
        <div className="relative" ref={newMenuRef}>
          <button
            onClick={() => setShowNewMenu(v => !v)}
            aria-label="Create new record"
            aria-expanded={showNewMenu}
            className="flex h-9 items-center gap-1.5 rounded-card bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showNewMenu ? 'rotate-180' : ''}`} />
          </button>
          {showNewMenu && (
            <div className="absolute right-0 z-50 mt-2 w-48 rounded-card border border-line bg-surface-panel py-2 shadow-lg">
              {NEW_MENU_ITEMS.map(({ label, icon: Icon, href }) => (
                <button
                  key={label}
                  onClick={() => { navigate(href); setShowNewMenu(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-ink transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <Icon className="h-4 w-4 text-ink-muted" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Inbox — the internal activity feed (Group A item 5), not email. */}
        <button
          type="button"
          onClick={() => navigate('/crm/inbox')}
          aria-label="Inbox"
          title="Inbox"
          className={`${toolButton} hidden hover:bg-black/5 sm:flex`}
        >
          <Inbox className="h-[18px] w-[18px]" />
        </button>

        {/* Notifications — real since Group A item 5. */}
        <NotificationsBell buttonClass={toolButton} />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-label="Account menu"
            aria-expanded={showProfileMenu}
            className="flex items-center gap-3 rounded-card py-1 pl-1 pr-1 transition-colors hover:bg-black/5 sm:pr-2"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-[34px] w-[34px] rounded-full object-cover" />
            ) : (
              <span
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
                aria-hidden="true"
                data-testid="topbar-initials"
              >
                {initialsOf(user?.name)}
              </span>
            )}
            <div className="hidden flex-col items-start gap-px text-left sm:flex">
              <p className="text-sm font-semibold leading-tight text-ink">{user?.name}</p>
              {/* 'Unknown' is AuthContext's fail-closed role. Spelled out here
                  so the caption reads as a real statement rather than a
                  one-word mystery under someone's name. */}
              <p className="text-xs leading-[18px] text-ink-muted">
                {user?.role === 'Unknown' ? 'Unknown role' : user?.role}
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 z-50 mt-2 w-48 rounded-card border border-line bg-surface-panel py-1 shadow-lg">
              <div className="border-b border-line px-4 py-2">
                <p className="text-sm font-medium text-ink">{user?.name}</p>
                <p className="truncate text-xs text-ink-muted">{user?.email}</p>
              </div>
              {/*
                * This item is labelled "Profile Settings" and used to navigate to
                * /settings — a tree with no profile page on it at all. It now goes
                * where the profile actually is.
                */}
              <button
                onClick={() => { navigate('/crm/settings'); setShowProfileMenu(false); }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-ink transition-colors hover:bg-black/5"
              >
                <Settings className="h-4 w-4 text-ink-muted" />
                Profile Settings
              </button>
              <button
                onClick={() => { logout(); setShowProfileMenu(false); navigate('/login'); }}
                className="flex w-full items-center gap-3 border-t border-line px-4 py-2 text-sm text-red-700 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {showProfileMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
      )}
    </header>
  );
};

export default TopBar;
