import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, UserPlus, Briefcase, Building2, Users, ListChecks,
  CalendarDays, Sparkles, UsersRound, Blocks, FileBarChart, Settings,
  LineChart, CheckSquare, Calendar, FileText,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  /** A pill after the label — e.g. "Preview" on a page that is not built. */
  badge?: string;
}

/**
 * THE navigation list. Exported so the mobile drawer renders these exact rows
 * rather than a second copy of them.
 *
 * A duplicated nav list is the same defect class as the duplicated
 * assignable-roles list CLAUDE.md records: two lists that must agree will
 * disagree, and the failure is silent — a destination added here and forgotten
 * there is simply missing on phones, with no type error and no failing test.
 * `MobileNavDrawer` therefore renders `<SidebarNav />`, not its own markup.
 *
 * FIGMA ("BMI CRM V1", Settings frames 75:39868), decided 2026-10-05:
 * the first group is the Settings frame's list, in its order. The frames are
 * not consistent — the Forecast, Tasks, Calendar and Documents frames each add
 * their own page — so those four sit in a "More" group rather than losing
 * their only link (Venkat's call). Dropped from the nav with this change:
 *   - Pinned Views ("My Open Deals", "Closing This Week", "Stalled"): links to
 *     /crm/deals?owner=me / ?closeDate=thisWeek / ?stalled=true — and NOTHING
 *     reads those parameters, so each opened the unfiltered Deals list while
 *     claiming to be a filter.
 *   - Calls and Analytics: still routed (/crm/calls, /analytics), no longer in
 *     the sidebar, as decided.
 *
 * Icons are Lucide, as the frames use. lucide-react 0.344 predates two of
 * them, so `Briefcase` stands in for BriefcaseBusiness and `FileBarChart` for
 * FileChartColumn — the closest glyphs in the installed version.
 */
export const navGroups: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { name: 'Dashboard',    href: '/crm/dashboard',  icon: LayoutDashboard },
      { name: 'Leads',        href: '/crm/leads',      icon: UserPlus },
      { name: 'Deals',        href: '/crm/deals',      icon: Briefcase },
      // Was once '/accounts', a placeholder telling the user to "navigate to
      // CRM → Accounts". The real accounts list is CRMModule's /crm/accounts.
      { name: 'Accounts',     href: '/crm/accounts',   icon: Building2 },
      { name: 'Contacts',     href: '/crm/contacts',   icon: Users },
      // The superset view, routed and API-backed. It was once reachable from no
      // navigation at all, which made manual activity logging undiscoverable.
      { name: 'Activities',   href: '/crm/activities', icon: ListChecks },
      { name: 'Meetings',     href: '/crm/meetings',   icon: CalendarDays },
      // Not built (Phase 2). The page says so; the badge says so before the click.
      { name: 'AI Copilot',   href: '/crm/ai-copilot', icon: Sparkles, badge: 'Preview' },
      { name: 'Team',         href: '/team',           icon: UsersRound },
      { name: 'Integrations', href: '/integrations',   icon: Blocks },
      { name: 'Reports',      href: '/crm/reports',    icon: FileBarChart },
      /*
       * POINTS AT /crm/settings, NOT /settings. This link used to go to the
       * latter — the dead Supabase tree — so the Settings screens that are
       * actually wired were unreachable from the main nav. CLAUDE.md lesson 5;
       * pinned by settingsNavigation.test.tsx.
       */
      { name: 'Settings',     href: '/crm/settings',   icon: Settings },
    ],
  },
  {
    label: 'More',
    items: [
      { name: 'Forecast',  href: '/crm/forecast',  icon: LineChart },
      { name: 'Tasks',     href: '/crm/tasks',     icon: CheckSquare },
      { name: 'Calendar',  href: '/calendar',      icon: Calendar },
      { name: 'Documents', href: '/crm/documents', icon: FileText },
    ],
  },
];

/**
 * The nav rows. Shared verbatim by the desktop sidebar and the mobile drawer.
 *
 * `onNavigate` fires on every destination click. The desktop sidebar passes
 * nothing; the drawer passes its close handler, because a drawer that stays
 * open over the page it just navigated to is a drawer the user has to dismiss
 * before they can see what they asked for.
 */
export const SidebarNav: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => (
  <nav aria-label="Main" className="flex flex-col gap-4">
    {navGroups.map((group, gi) => (
      <div key={gi}>
        {group.label && (
          // ink-secondary, not ink-muted: Figma's muted grey is 4.17:1 on the
          // sidebar, under AA for 12px text (see tailwind.config.js).
          <p className="px-2.5 pb-1.5 text-xs font-semibold uppercase leading-[18px] text-ink-secondary">
            {group.label}
          </p>
        )}
        <ul className="flex flex-col gap-1">
          {group.items.map(({ name, href, icon: Icon, badge }) => (
            <li key={name}>
              <NavLink
                to={href}
                end={href === '/crm/dashboard'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex h-[38px] items-center gap-2.5 rounded-card px-2.5 text-sm leading-[22px] transition-colors ${
                    isActive
                      ? 'bg-brand-100 font-semibold text-brand-600'
                      : 'text-ink hover:bg-black/5'
                  }`
                }
              >
                <Icon className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                <span className="flex-1 truncate">{name}</span>
                {/* The space keeps the accessible name "AI Copilot Preview",
                    not "AI CopilotPreview"; flex layout ignores it visually. */}
                {badge && ' '}
                {badge && (
                  <span className="shrink-0 rounded-full bg-brand-50 px-2 py-[3px] text-xs font-semibold leading-[18px] text-brand-600">
                    {badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </nav>
);

/**
 * The desktop sidebar, below the full-width top bar (Figma). `hidden lg:flex`
 * — below 1024px it does not render at all, which is why `MobileNavDrawer`
 * exists.
 *
 * Three things the Figma sidebar draws are deliberately NOT rendered, because
 * nothing real backs them:
 *   - the workspace caption ("NORTHSTAR · INDIA & MEA") — the session carries
 *     only a workspace id, and a mockup's workspace name is not ours;
 *   - the "Data integrity" card ("…states are labelled at source") — a claim
 *     about every screen, and not yet true of every screen (CLAUDE.md lists
 *     surfaces still showing unexplained scores);
 *   - "Workspace connected" — a health indicator with no health check behind it.
 * The old collapse toggle is gone too: the Figma sidebar has none.
 */
const Sidebar: React.FC = () => (
  <aside className="hidden lg:flex w-[216px] shrink-0 flex-col overflow-y-auto border-r border-line bg-surface-sidebar px-3 py-[18px]">
    <SidebarNav />
  </aside>
);

export default Sidebar;
