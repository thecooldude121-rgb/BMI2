import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MoreVertical, Plug, Settings, Bot, Calendar, FileText, Users } from 'lucide-react';

const CRMNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: 'Dashboard', path: '/crm' },
    { label: 'Leads', path: '/crm/leads' },
    { label: 'Contacts', path: '/crm/contacts' },
    { label: 'Accounts', path: '/crm/accounts' },
    { label: 'Deals', path: '/crm/deals' },
    { label: 'Activities', path: '/crm/activities' },
    { label: 'Reports', path: '/crm/reports' }
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
    if (path === '/crm') {
      return location.pathname === '/crm' || location.pathname === '/crm/' || location.pathname === '/crm/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-8">
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
                      backgroundColor: '#667eea',
                      borderBottomColor: '#667eea',
                      color: '#ffffff'
                    }
                  : {}
              }
            >
              {item.label}
            </button>
          ))}

          {/* Actions Dropdown with Integrations */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="px-4 py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
              title="Actions"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {isActionsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => {
                    navigate('/crm/ai-copilot');
                    setIsActionsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Bot className="h-4 w-4" />
                  AI Copilot
                </button>
                <button
                  onClick={() => {
                    navigate('/crm/meetings');
                    setIsActionsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Calendar className="h-4 w-4" />
                  Meetings
                </button>
                <button
                  onClick={() => {
                    navigate('/crm/documents');
                    setIsActionsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <FileText className="h-4 w-4" />
                  Documents
                </button>
                <button
                  onClick={() => {
                    navigate('/crm/team');
                    setIsActionsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Users className="h-4 w-4" />
                  Team
                </button>
                <div className="border-t border-gray-200 my-1"></div>

                <button
                  onClick={() => {
                    navigate('/crm/integrations');
                    setIsActionsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Plug className="h-4 w-4" />
                  Integrations
                </button>
                <button
                  onClick={() => {
                    navigate('/crm/settings');
                    setIsActionsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Settings className="h-4 w-4" />
                  CRM Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMNavigation;
