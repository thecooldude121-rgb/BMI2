import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Bell, Mail, Settings, LogOut, ChevronDown, Plus,
  DollarSign, Users, UserPlus, Building2, CheckSquare,
  AlertCircle, Sparkles, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const getBreadcrumb = (pathname: string): { parent?: string; label: string } => {
  if (pathname.startsWith('/crm/deals'))         return { parent: 'CRM', label: 'Deals' };
  if (pathname.startsWith('/crm/forecast'))       return { parent: 'CRM', label: 'Forecast' };
  if (pathname.startsWith('/crm/leads'))         return { parent: 'CRM', label: 'Leads' };
  if (pathname.startsWith('/crm/contacts'))      return { parent: 'CRM', label: 'Contacts' };
  if (pathname.startsWith('/crm/accounts'))      return { parent: 'CRM', label: 'Accounts' };
  if (pathname.startsWith('/crm/activities'))    return { parent: 'CRM', label: 'Activities' };
  if (pathname.startsWith('/crm/tasks'))         return { parent: 'CRM', label: 'Tasks' };
  if (pathname.startsWith('/crm/meetings'))      return { parent: 'CRM', label: 'Meetings' };
  if (pathname.startsWith('/crm/calls'))         return { parent: 'CRM', label: 'Calls' };
  if (pathname.startsWith('/crm/reports'))       return { parent: 'CRM', label: 'Reports' };
  if (pathname.startsWith('/crm'))               return { label: 'CRM' };
  if (pathname.startsWith('/hrms'))              return { label: 'HRMS' };
  if (pathname.startsWith('/analytics'))         return { label: 'Analytics' };
  if (pathname.startsWith('/calendar'))          return { label: 'Calendar' };
  if (pathname.startsWith('/lead-generation'))   return { label: 'Lead Generation' };
  if (pathname.startsWith('/sequences'))         return { label: 'Sequences' };
  if (pathname.startsWith('/integrations'))      return { label: 'Integrations' };
  if (pathname.startsWith('/settings'))          return { label: 'Settings' };
  if (pathname.startsWith('/dashboard'))         return { label: 'Dashboard' };
  return { label: 'BMI Platform' };
};

const NEW_MENU_ITEMS = [
  { label: 'New Deal',    icon: DollarSign,  href: '/crm/deals/new' },
  { label: 'New Contact', icon: Users,        href: '/crm/contacts/new' },
  { label: 'New Lead',    icon: UserPlus,     href: '/crm/leads/new' },
  { label: 'New Account', icon: Building2,    href: '/accounts/new' },
  { label: 'New Task',    icon: CheckSquare,  href: '/crm/tasks/new' },
];

const MOCK_NOTIFICATIONS = [
  { id: 'u1', group: 'URGENT',     icon: AlertCircle, color: 'text-red-500',    text: 'Acme Corp deal closing in 2 days — no next step set',         time: '5m' },
  { id: 'u2', group: 'URGENT',     icon: AlertCircle, color: 'text-red-500',    text: 'GlobalTech contract overdue — last activity 18 days ago',      time: '1h' },
  { id: 'f1', group: 'FOLLOW-UP',  icon: Bell,        color: 'text-amber-500',  text: 'Sarah Chen replied to your email about pricing',              time: '2h' },
  { id: 'f2', group: 'FOLLOW-UP',  icon: Bell,        color: 'text-amber-500',  text: 'Follow-up due: TechStart Expansion — scheduled for today',     time: '3h' },
  { id: 'a1', group: 'AI INSIGHT', icon: Sparkles,    color: 'text-indigo-500', text: 'Win probability on Meridian deal dropped 12% this week',       time: '1d' },
];

const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifRead, setNotifRead] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const crumb = getBreadcrumb(pathname);
  const unreadCount = notifRead ? 0 : MOCK_NOTIFICATIONS.length;

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) setShowNewMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const groupedNotifs = ['URGENT', 'FOLLOW-UP', 'AI INSIGHT'].map(g => ({
    group: g,
    items: MOCK_NOTIFICATIONS.filter(n => n.group === g),
  })).filter(g => g.items.length > 0);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-40 sticky top-0">
      {/* Breadcrumb — left */}
      <div className="flex items-center gap-1.5 min-w-0">
        {crumb.parent && (
          <>
            <span className="text-sm text-gray-400 font-medium">{crumb.parent}</span>
            <span className="text-gray-300">›</span>
          </>
        )}
        <span className="text-sm font-semibold text-gray-800 truncate">{crumb.label}</span>
      </div>

      {/* Actions — right */}
      <div className="flex items-center gap-2">

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search deals, contacts…"
            aria-label="Global search"
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white transition-colors"
          />
        </div>

        {/* + New button (8.1) */}
        <div className="relative" ref={newMenuRef}>
          <button
            onClick={() => setShowNewMenu(v => !v)}
            aria-label="Create new record"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showNewMenu ? 'rotate-180' : ''}`} />
          </button>
          {showNewMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
              {NEW_MENU_ITEMS.map(({ label, icon: Icon, href }) => (
                <button
                  key={label}
                  onClick={() => { navigate(href); setShowNewMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  <Icon className="h-4 w-4 text-gray-400" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications bell (8.2) */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(v => !v); }}
            aria-label={`${unreadCount} unread notifications`}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">Notifications</span>
                <div className="flex items-center gap-2">
                  {!notifRead && (
                    <button onClick={() => setNotifRead(true)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {groupedNotifs.map(({ group, items }) => (
                  <div key={group}>
                    <div className="px-4 py-2 bg-gray-50">
                      <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{group}</span>
                    </div>
                    {items.map(({ id, icon: Icon, color, text, time }) => (
                      <div key={id} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 ${notifRead ? 'opacity-60' : ''}`}>
                        <Icon className={`h-4 w-4 ${color} shrink-0 mt-0.5`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-700 leading-snug">{text}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{time} ago</p>
                        </div>
                        {!notifRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mail */}
        <button aria-label="Open mail" className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
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

      {showProfileMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
      )}
    </header>
  );
};

export default TopBar;
