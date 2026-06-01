import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Bell, Mail, Plus, Settings, LogOut, ChevronDown,
  UserPlus, DollarSign, Users, Building2, Calendar, Phone
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Derives a human-readable page label from the current pathname
const getPageLabel = (pathname: string): string => {
  if (pathname.startsWith('/crm/deals'))         return 'Deals';
  if (pathname.startsWith('/crm/leads'))         return 'Leads';
  if (pathname.startsWith('/crm/contacts'))      return 'Contacts';
  if (pathname.startsWith('/crm/accounts'))      return 'Accounts';
  if (pathname.startsWith('/crm/activities'))    return 'Activities';
  if (pathname.startsWith('/crm/tasks'))         return 'Tasks';
  if (pathname.startsWith('/crm/meetings'))      return 'Meetings';
  if (pathname.startsWith('/crm/calls'))         return 'Calls';
  if (pathname.startsWith('/crm/reports'))       return 'Reports';
  if (pathname.startsWith('/crm/pipeline'))      return 'Pipeline';
  if (pathname.startsWith('/crm'))               return 'CRM';
  if (pathname.startsWith('/accounts'))          return 'Accounts';
  if (pathname.startsWith('/hrms'))              return 'HRMS';
  if (pathname.startsWith('/analytics'))         return 'Analytics';
  if (pathname.startsWith('/calendar'))          return 'Calendar';
  if (pathname.startsWith('/lead-generation'))   return 'Lead Generation';
  if (pathname.startsWith('/sequences'))         return 'Sequences';
  if (pathname.startsWith('/integrations'))      return 'Integrations';
  if (pathname.startsWith('/team'))              return 'Team';
  if (pathname.startsWith('/settings'))          return 'Settings';
  if (pathname.startsWith('/dashboard'))         return 'Dashboard';
  return 'BMI Platform';
};

const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const pageLabel = getPageLabel(pathname);

  const createMenuItems = [
    { name: 'Add Lead',         action: () => navigate('/crm/leads/new'),    icon: UserPlus },
    { name: 'Create Deal',      action: () => navigate('/crm/deals/add'),    icon: DollarSign },
    { name: 'Add Contact',      action: () => navigate('/crm/contacts/new'), icon: Users },
    { name: 'Add Company',      action: () => navigate('/accounts/new'),     icon: Building2 },
    { name: 'Schedule Meeting', action: () => navigate('/calendar/new'),     icon: Calendar },
    { name: 'Add Task',         action: () => navigate('/crm/tasks/new'),    icon: Phone },
  ];

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-40 sticky top-0">
      {/* Page context label — left */}
      <div className="flex items-center min-w-0">
        <span className="text-base font-semibold text-gray-800 truncate">{pageLabel}</span>
      </div>

      {/* Search + actions — right */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search leads, deals, contacts..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Quick Create */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
          {showCreateMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                Quick Create
              </p>
              {createMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => { item.action(); setShowCreateMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Icon className="h-4 w-4 text-gray-400" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Mail */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Mail className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-green-500 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <img
              src={user?.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
              alt={user?.name}
              className="h-7 w-7 rounded-full object-cover"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{user?.role}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-400" />
                Profile Settings
              </button>
              <button
                onClick={() => { logout(); setShowProfileMenu(false); navigate('/login'); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Close dropdowns on outside click */}
      {(showCreateMenu || showProfileMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowCreateMenu(false); setShowProfileMenu(false); }}
        />
      )}
    </header>
  );
};

export default TopBar;
