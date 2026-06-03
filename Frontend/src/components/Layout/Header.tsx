import React, { useState } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import {
  Bell, Search, Settings, Menu, Plus, Mail, Building2,
  Users, UserPlus, DollarSign, Phone, Activity, LayoutDashboard,
  UserCheck, Target, BarChart3, Calendar, ChevronDown, X, MoreHorizontal,
  Building, Trophy, LogOut, Plug, FileText, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
}

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showAppMenu, setShowAppMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const isCRMPage = location.pathname.startsWith('/crm') || location.pathname.startsWith('/accounts');

  const crmNavigation = [
    { name: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard },
    { name: 'Leads', href: '/crm/leads', icon: UserPlus },
    { name: 'Contacts', href: '/crm/contacts', icon: Users },
    { name: 'Accounts', href: '/accounts', icon: Building },
    { name: 'Deals', href: '/crm/deals', icon: DollarSign },
    { name: 'Activities', href: '/crm/activities', icon: Activity },
    { name: 'Documents', href: '/crm/documents', icon: FileText },
  ];

  const actionsNavigation = [
    { name: 'Leaderboard', href: '/crm/gamification/leaderboard', icon: Trophy },
    { name: 'Integrations', href: '/integrations', icon: Plug },
  ];

  const moreNavigation = [
    { name: 'Leaderboard', href: '/crm/gamification/leaderboard', icon: Trophy },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Reports', href: '/crm/reports', icon: BarChart3 },
    { name: 'Analytics', href: '/analytics', icon: Target },
    { name: 'Tasks', href: '/crm/tasks', icon: Phone },
    // "Forecast" replaces "Pipeline" label — /crm/pipeline is the analytics page,
    // not the Kanban board. Kanban lives under "Deals".
    { name: 'Forecast', href: '/crm/pipeline', icon: TrendingUp },
    { name: 'Gamification', href: '/crm/gamification', icon: Trophy },
  ];

  const appModules = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'CRM', href: '/crm', icon: Users },
    { name: 'HRMS', href: '/hrms', icon: UserCheck },
    { name: 'Lead Generation', href: '/lead-generation/dashboard', icon: Target },
    { name: 'Integrations', href: '/integrations', icon: Plug },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const createMenuItems = [
    { name: 'Add Lead', action: () => navigate('/crm/leads/new'), icon: UserPlus },
    { name: 'Create Deal', action: () => navigate('/deals/create'), icon: DollarSign },
    { name: 'Add Contact', action: () => navigate('/crm/contacts/new'), icon: Users },
    { name: 'Add Company', action: () => navigate('/accounts/new'), icon: Building2 },
    { name: 'Schedule Meeting', action: () => navigate('/calendar/new'), icon: Calendar },
    { name: 'Add Task', action: () => navigate('/crm/tasks/new'), icon: Phone },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Section - Company Name and Navigation */}
        <div className="flex items-center space-x-8">
          {/* Company Name */}
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">BMI Platform</span>
          </div>

          {/* CRM Navigation (only show on CRM pages) */}
          {isCRMPage && (
            <nav className="hidden md:flex items-center space-x-3">
              {crmNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `group inline-flex items-center py-2 px-2.5 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Icon className="mr-1.5 h-4 w-4" />
                    {item.name}
                  </NavLink>
                );
              })}

              {/* Actions Menu (three dots) */}
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className={`group inline-flex items-center py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    showActionsMenu
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {showActionsMenu && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Actions
                    </div>
                    {actionsNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={() => setShowActionsMenu(false)}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          <Icon className="mr-3 h-4 w-4 text-gray-400" />
                          {item.name}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* More Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`group inline-flex items-center py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    showMoreMenu
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {showMoreMenu && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      More CRM
                    </div>
                    {moreNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={() => setShowMoreMenu(false)}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          <Icon className="mr-3 h-4 w-4 text-gray-400" />
                          {item.name}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          )}
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search leads, deals, contacts, companies..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Right Section - Actions and Profile */}
        <div className="flex items-center space-x-3">
          {/* Create Menu */}
          <div className="relative">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
            
            {showCreateMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Quick Create
                </div>
                {createMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        item.action();
                        setShowCreateMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <Icon className="mr-3 h-4 w-4 text-gray-400" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notifications */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* Email Sync */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative transition-colors">
            <Mail className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* App Menu */}
          <div className="relative">
            <button
              onClick={() => setShowAppMenu(!showAppMenu)}
              className="flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LayoutDashboard className="h-5 w-5" />
            </button>
            
            {showAppMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  All Modules
                </div>
                <div className="grid grid-cols-1 gap-1 p-2">
                  {appModules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <button
                        key={module.name}
                        onClick={() => {
                          navigate(module.href);
                          setShowAppMenu(false);
                        }}
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
                      >
                        <Icon className="mr-3 h-4 w-4 text-gray-400" />
                        {module.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <img
                src={user?.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
                alt={user?.name}
                className="h-8 w-8 rounded-full object-cover"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="mr-3 h-4 w-4 text-gray-400" />
                  Profile Settings
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                    navigate('/login');
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside handlers */}
      {(showCreateMenu || showAppMenu || showProfileMenu || showMoreMenu || showActionsMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowCreateMenu(false);
            setShowAppMenu(false);
            setShowProfileMenu(false);
            setShowMoreMenu(false);
            setShowActionsMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;