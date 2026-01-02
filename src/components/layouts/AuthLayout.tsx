import React from 'react';
import { Outlet } from 'react-router-dom';
import { Building2 } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">BMI Platform</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">
            Business Management Intelligence
          </h2>
        </div>

        {/* Auth Content */}
        <div className="bg-white rounded-2xl shadow-xl">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 BMI Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;