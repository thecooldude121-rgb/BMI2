import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../navigation/Sidebar';
import TopNav from '../navigation/TopNav';
import BreadcrumbNav from '../navigation/BreadcrumbNav';

// Routes that own their own frozen header — suppress breadcrumb and top padding
const SELF_HEADER_PATTERNS = [
  /^\/crm\/deals$/,
  /^\/crm\/deals\/(add|create)$/,
  /^\/crm\/deals\/[^/]+\/edit$/,
];

const MainLayout: React.FC = () => {
  const { pathname } = useLocation();
  const selfHeader = SELF_HEADER_PATTERNS.some(re => re.test(pathname));

  return (
    // h-screen + overflow-hidden constrains the layout to viewport height so
    // <main> becomes the real scroll container and sticky positioning works.
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <TopNav />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className={selfHeader ? 'px-6 pb-6' : 'p-6'}>
            {!selfHeader && <BreadcrumbNav />}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;