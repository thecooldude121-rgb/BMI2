import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserPlus, Users, Building, DollarSign,
  Activity, FileText, BarChart3, Calendar,
  Plug, Settings, Trophy, ChevronDown, ChevronRight,
  Building2, Phone, Video, CheckSquare, PanelLeftClose,
  PanelLeftOpen, Bookmark, Clock, PauseCircle
} from 'lucide-react';

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  children?: { name: string; href: string; icon: React.ElementType }[];
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
 */
export const navGroups: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { name: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'CRM',
    items: [
      { name: 'Leads',     href: '/crm/leads',     icon: UserPlus },
      { name: 'Contacts',  href: '/crm/contacts',  icon: Users },
      // Was '/accounts', which rendered a placeholder telling the user to
      // "navigate to CRM → Accounts" — a sidebar entry that does not exist.
      // The real accounts list is CRMModule's /crm/accounts.
      { name: 'Accounts',  href: '/crm/accounts',  icon: Building },
      { name: 'Deals',     href: '/crm/deals',     icon: DollarSign },
      {
        name: 'Pinned Views', icon: Bookmark,
        children: [
          { name: 'My Open Deals',       href: '/crm/deals?owner=me',           icon: DollarSign },
          { name: 'Closing This Week',   href: '/crm/deals?closeDate=thisWeek', icon: Clock },
          { name: 'Stalled',             href: '/crm/deals?stalled=true',       icon: PauseCircle },
        ],
      },
      { name: 'Forecast',  href: '/crm/forecast',  icon: BarChart3 },
      {
        name: 'Activities', icon: Activity,
        children: [
          // The superset view, listed first. It was routed and API-backed but
          // reachable from NO navigation at all, which made the manual
          // activity-logging surface undiscoverable — a page nobody can find is
          // not a built feature. A second, fabricated feed used to sit at
          // /crm/activities/all; it was deleted rather than linked.
          { name: 'All Activities', href: '/crm/activities', icon: Activity },
          { name: 'Tasks',    href: '/crm/tasks',    icon: CheckSquare },
          { name: 'Meetings', href: '/crm/meetings', icon: Video },
          { name: 'Calls',    href: '/crm/calls',    icon: Phone },
        ],
      },
      { name: 'Documents', href: '/crm/documents', icon: FileText },
      { name: 'Reports',   href: '/crm/reports',   icon: BarChart3 },
    ],
  },
  {
    label: 'Modules',
    items: [
      { name: 'Analytics',       href: '/analytics',                    icon: BarChart3 },
      { name: 'Calendar',        href: '/calendar',                     icon: Calendar },
      { name: 'Team',            href: '/team',                         icon: Users },
      { name: 'Integrations',    href: '/integrations',                 icon: Plug },
      { name: 'Leaderboard',     href: '/crm/gamification/leaderboard', icon: Trophy },
    ],
  },
];

/**
 * The scrolling nav list plus the pinned Settings row — everything below the
 * logo. Shared verbatim by the desktop sidebar and the mobile drawer.
 *
 * `onNavigate` fires on every destination click. The desktop sidebar passes
 * nothing; the drawer passes its close handler, because a drawer that stays
 * open over the page it just navigated to is a drawer the user has to dismiss
 * before they can see what they asked for.
 */
export const SidebarNav: React.FC<{
  collapsed?: boolean;
  onNavigate?: () => void;
}> = ({ collapsed = false, onNavigate }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['Activities']);

  const toggleExpand = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <>
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {/* Group label — only when expanded */}
            {!collapsed && group.label && (
              <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                {group.label}
              </p>
            )}
            {/* Divider line in collapsed mode between groups */}
            {collapsed && gi > 0 && (
              <div className="mx-3 mb-2 border-t border-gray-700" />
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isItemExpanded = expandedItems.includes(item.name);

                /* ── Expandable item (e.g. Activities) ── */
                if (item.children) {
                  if (collapsed) {
                    // In collapsed mode just show the parent icon, no children
                    return (
                      <li key={item.name}>
                        <button
                          title={item.name}
                          onClick={() => toggleExpand(item.name)}
                          className="w-full flex items-center justify-center py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  }

                  return (
                    <li key={item.name}>
                      <button
                        onClick={() => toggleExpand(item.name)}
                        aria-expanded={isItemExpanded}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="whitespace-nowrap">{item.name}</span>
                        </span>
                        {isItemExpanded
                          ? <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                          : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                      {isItemExpanded && (
                        <ul className="bg-gray-800/50 py-1">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <li key={child.name}>
                                <NavLink
                                  to={child.href}
                                  onClick={onNavigate}
                                  className={({ isActive }) =>
                                    `flex items-center gap-3 pl-10 pr-4 py-2 text-sm transition-colors ${
                                      isActive
                                        ? 'text-white bg-brand-600/20 border-l-2 border-blue-500'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                    }`
                                  }
                                >
                                  <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="whitespace-nowrap">{child.name}</span>
                                </NavLink>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

                /* ── Regular nav item ── */
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href!}
                      end={item.href === '/crm/dashboard'}
                      onClick={onNavigate}
                      title={collapsed ? item.name : undefined}
                      className={({ isActive }) =>
                        `flex items-center py-2 text-sm transition-colors ${
                          collapsed ? 'justify-center px-0' : 'gap-3 px-4'
                        } ${
                          isActive
                            ? 'text-white bg-brand-600 border-l-2 border-blue-400'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="whitespace-nowrap">{item.name}</span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/*
        * Settings pinned at bottom.
        *
        * POINTS AT /crm/settings, NOT /settings. This link used to go to the
        * latter — the dead Supabase tree — so the three Settings screens that
        * are actually wired (workspace preferences, the team roster, your
        * profile and password) were unreachable from the main nav, and the page
        * a user landed on was the one with no backend. That is CLAUDE.md's
        * lesson 5 in its original form: the fix was verified at one route while
        * the nav pointed at another.
        */}
      <div className="border-t border-gray-700 py-2 shrink-0">
        <NavLink
          to="/crm/settings"
          onClick={onNavigate}
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            `flex items-center py-2.5 text-sm transition-colors ${
              collapsed ? 'justify-center px-0' : 'gap-3 px-4'
            } ${
              isActive
                ? 'text-white bg-brand-600'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`
          }
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Settings</span>}
        </NavLink>
      </div>
    </>
  );
};

/**
 * The desktop sidebar. `hidden lg:flex` — below 1024px it does not render at
 * all, which is why `MobileNavDrawer` exists.
 */
const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative hidden lg:flex flex-col min-h-screen bg-gray-900 text-gray-300 shrink-0 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Logo + Toggle button row */}
      <div className={`flex items-center border-b border-gray-700 h-14 shrink-0 ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
        {/* Logo — hidden when collapsed */}
        {!collapsed && (
          <div
            className="flex items-center gap-2 cursor-pointer overflow-hidden"
            onClick={() => navigate('/crm/dashboard')}
          >
            <div className="flex items-center justify-center w-7 h-7 bg-brand-600 rounded-lg shrink-0">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight whitespace-nowrap">
              BMI Platform
            </span>
          </div>
        )}

        {/* Collapse / Expand toggle */}
        <button
          onClick={() => setCollapsed(prev => !prev)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shrink-0"
        >
          {collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />
          }
        </button>
      </div>

      <SidebarNav collapsed={collapsed} />
    </aside>
  );
};

export default Sidebar;
