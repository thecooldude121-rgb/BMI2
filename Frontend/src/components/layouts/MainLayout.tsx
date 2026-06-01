import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../navigation/Sidebar';
import TopNav from '../navigation/TopNav';
import BreadcrumbNav from '../navigation/BreadcrumbNav';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <BreadcrumbNav />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;