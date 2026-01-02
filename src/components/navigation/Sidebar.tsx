import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, DollarSign, Target, BarChart3, Calendar,
  Settings, UserCheck, Building2, Phone, Mail, Activity, CheckSquare,
  TrendingUp, Zap, Award, Plug, Trophy
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      permission: 'dashboard'
    },
    {
      name: 'CRM',
      icon: Users,
      permission: 'crm',
      children: [
        { name: 'Leads', href: '/crm/leads', icon: Target },
        { name: 'Accounts', href: '/accounts', icon: Building2 },
        { name: 'Contacts', href: '/crm/contacts', icon: Users },
        { name: 'Deals', href: '/crm/deals', icon: DollarSign },
        { name: 'Pipeline', href: '/crm/pipeline', icon: TrendingUp },
        { name: 'Activities', href: '/crm/activities', icon: Activity },
        { name: 'Tasks', href: '/crm/tasks', icon: CheckSquare },
        { name: 'Settings', href: '/settings', icon: Settings }
      ]
    },
    {
      name: 'HRMS',
      icon: UserCheck,
      permission: 'hrms',
      children: [
        { name: 'Employees', href: '/hrms/employees', icon: Users },
        { name: 'Workflows', href: '/hrms/workflows', icon: CheckSquare },
        { name: 'Attendance', href: '/hrms/attendance', icon: Calendar },
        { name: 'Reports', href: '/hrms/reports', icon: BarChart3 }
      ]
    },
    {
      name: 'Lead Generation',
      href: '/lead-generation',
      icon: Target,
      permission: 'lead-generation'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      permission: 'analytics'
    },
    {
      name: 'Calendar',
      href: '/calendar',
      icon: Calendar,
      permission: 'calendar'
    },
    {
      name: 'Integrations',
      href: '/integrations',
      icon: Plug,
      permission: 'integrations'
    },
    {
      name: 'Team',
      href: '/team',
      icon: Users,
      permission: 'team'
    },
    {
      name: 'Gamification',
      icon: Award,
      permission: 'gamification',
      children: [
        { name: 'Leaderboard', href: '/gamification/leaderboard', icon: Trophy },
        { name: 'Achievements', href: '/gamification/achievements', icon: Award },
        { name: 'Challenges', href: '/gamification/challenges', icon: Zap }
      ]
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      permission: 'settings'
    }
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const isParentActive = (children: any[]) => {
    return children.some(child => isActiveRoute(child.href));
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">BMI Platform</h1>
            <p className="text-xs text-gray-500">Business Intelligence</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img
            src={user?.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
            alt={user?.name}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          if (!hasPermission(item.permission)) return null;

          const IconComponent = item.icon;

          if (item.children) {
            const isExpanded = isParentActive(item.children);
            
            return (
              <div key={item.name}>
                <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                  isExpanded ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  <IconComponent className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
                {isExpanded && (
                  <div className="ml-6 mt-2 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                              isActive
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`
                          }
                        >
                          <ChildIcon className="mr-3 h-4 w-4" />
                          {child.name}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.href!}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <IconComponent className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;