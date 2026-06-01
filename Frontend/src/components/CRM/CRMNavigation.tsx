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

  return null;
};

export default CRMNavigation;
