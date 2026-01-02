import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  current?: boolean;
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items }) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from current path if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/dashboard' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Convert segment to readable label
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (segment === 'crm') label = 'CRM';
      if (segment === 'hrms') label = 'HRMS';
      if (segment === 'lead-generation') label = 'Lead Generation';
      
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        current: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Link
        to="/dashboard"
        className="flex items-center hover:text-gray-900 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbItems.slice(1).map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className={`hover:text-gray-900 transition-colors ${
                item.current ? 'text-gray-900 font-semibold cursor-default' : ''
              }`}
            >
              {item.label}
            </button>
          ) : item.href && !item.current ? (
            <Link
              to={item.href}
              className="hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={item.current ? 'text-gray-900 font-medium' : ''}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNav;