import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserPlus, Users, Building, DollarSign,
  Activity, FileText, BarChart3, Target, Calendar, UserCheck,
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

const navGroups: { label?: string; items: NavItem[] }[] = [
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
      { name: 'Accounts',  href: '/accounts',      icon: Building },
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
      { name: 'HRMS',            href: '/hrms',                         icon: UserCheck },
      { name: 'Lead Generation', href: '/lead-generation/dashboard',    icon: Target },
      { name: 'Analytics',       href: '/analytics',                    icon: BarChart3 },
      { name: 'Calendar',        href: '/calendar',                     icon: Calendar },
      { name: 'Team',            href: '/team',                         icon: Users },
      { name: 'Integrations',    href: '/integrations',                 icon: Plug },
      { name: 'Leaderboard',     href: '/crm/gamification/leaderboard', icon: Trophy },
    ],
  },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Activities']);

  const toggleExpand = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

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
            <div className="flex items-center justify-center w-7 h-7 bg-blue-600 rounded-lg shrink-0">
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
          className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shrink-0"
        >
          {collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />
          }
        </button>
      </div>

      {/* Nav */}
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
                                  className={({ isActive }) =>
                                    `flex items-center gap-3 pl-10 pr-4 py-2 text-sm transition-colors ${
                                      isActive
                                        ? 'text-white bg-blue-600/20 border-l-2 border-blue-500'
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
                      title={collapsed ? item.name : undefined}
                      className={({ isActive }) =>
                        `flex items-center py-2 text-sm transition-colors ${
                          collapsed ? 'justify-center px-0' : 'gap-3 px-4'
                        } ${
                          isActive
                            ? 'text-white bg-blue-600 border-l-2 border-blue-400'
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

      {/* Settings pinned at bottom */}
      <div className="border-t border-gray-700 py-2">
        <NavLink
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            `flex items-center py-2.5 text-sm transition-colors ${
              collapsed ? 'justify-center px-0' : 'gap-3 px-4'
            } ${
              isActive
                ? 'text-white bg-blue-600'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`
          }
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
