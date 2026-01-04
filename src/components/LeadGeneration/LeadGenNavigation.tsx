import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';

const LeadGenNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: 'Dashboard', path: '/lead-generation/dashboard' },
    { label: 'Leads', path: '/lead-generation/leads' },
    { label: 'Intelligence', path: '/lead-generation/intelligence' },
    { label: 'Campaigns', path: '/lead-generation/campaigns' },
    { label: 'Analytics', path: '/lead-generation/analytics' }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActivePath = (path: string) => {
    if (path === '/lead-generation/dashboard') {
      return location.pathname === '/lead-generation' ||
             location.pathname === '/lead-generation/' ||
             location.pathname === '/lead-generation/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                  isActivePath(item.path)
                    ? 'border-b-2 text-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={
                  isActivePath(item.path)
                    ? {
                        backgroundColor: '#3b82f6',
                        borderBottomColor: '#3b82f6',
                        color: '#ffffff'
                      }
                    : {}
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/lead-generation/settings')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 ${
              isActivePath('/lead-generation/settings')
                ? 'border-b-2 text-white'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            style={
              isActivePath('/lead-generation/settings')
                ? {
                    backgroundColor: '#3b82f6',
                    borderBottomColor: '#3b82f6',
                    color: '#ffffff'
                  }
                : {}
            }
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadGenNavigation;
