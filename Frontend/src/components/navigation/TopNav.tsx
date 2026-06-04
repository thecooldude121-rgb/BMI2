import React, { useState } from 'react';
import { Search, Bell, Settings, ChevronDown, Plus, Mail, Building2, MoreVertical, Target, DollarSign, Users, Bot, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const TopNav: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showCRMMenu, setShowCRMMenu] = useState(false);

  const notifications = [
    { id: '1', title: 'New lead assigned', message: 'John Doe from TechCorp', time: '5 min ago', unread: true },
    { id: '2', title: 'Deal stage updated', message: 'Enterprise deal moved to negotiation', time: '1 hour ago', unread: true },
    { id: '3', title: 'Meeting reminder', message: 'Demo call in 30 minutes', time: '2 hours ago', unread: false }
  ];

  const createMenuItems = [
    { name: 'Add Lead', action: () => navigate('/crm/leads/new'), icon: Target },
    { name: 'Create Deal', action: () => navigate('/crm/deals/create'), icon: DollarSign },
    { name: 'Add Contact', action: () => navigate('/crm/contacts/new'), icon: Users },
    { name: 'Schedule Meeting', action: () => navigate('/calendar/new'), icon: Calendar }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 relative z-50">
      {/* Left Section - Search */}
      <div className="flex-1 max-w-2xl">
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
      <div className="flex items-center space-x-4">
        {/* Create Menu */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-200">
                Notifications
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      notification.unread ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {notification.unread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-gray-200">
                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Email Sync */}
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative transition-colors">
          <Mail className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full"></span>
        </button>

        {/* CRM Quick Menu */}
        <div className="relative">
          <button
            onClick={() => setShowCRMMenu(!showCRMMenu)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="CRM Quick Menu"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {showCRMMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                CRM Quick Access
              </div>
              <button
                onClick={() => {
                  navigate('/crm/leads');
                  setShowCRMMenu(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Target className="mr-3 h-4 w-4 text-gray-400" />
                Leads
              </button>
              <button
                onClick={() => {
                  navigate('/accounts');
                  setShowCRMMenu(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Building2 className="mr-3 h-4 w-4 text-gray-400" />
                Accounts
              </button>
              <button
                onClick={() => {
                  navigate('/crm/contacts');
                  setShowCRMMenu(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Users className="mr-3 h-4 w-4 text-gray-400" />
                Contacts
              </button>
              <button
                onClick={() => {
                  navigate('/crm/deals');
                  setShowCRMMenu(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <DollarSign className="mr-3 h-4 w-4 text-gray-400" />
                Deals
              </button>
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={() => {
                  navigate('/crm/ai-copilot');
                  setShowCRMMenu(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Bot className="mr-3 h-4 w-4 text-blue-500" />
                <span className="flex items-center gap-2">
                  AI Assistant
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">NEW</span>
                </span>
              </button>
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={() => {
                  navigate('/settings');
                  setShowCRMMenu(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Settings className="mr-3 h-4 w-4 text-gray-400" />
                CRM Settings
              </button>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="h-5 w-5" />
        </button>

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
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside handlers */}
      {(showCreateMenu || showNotifications || showProfileMenu || showCRMMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowCreateMenu(false);
            setShowNotifications(false);
            setShowProfileMenu(false);
            setShowCRMMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default TopNav;