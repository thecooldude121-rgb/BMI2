import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Users, UserCheck, Clock, FileText } from 'lucide-react';
import EmployeesPage from './EmployeesPage';
import WorkflowsPage from './WorkflowsPage';
import AttendancePage from './AttendancePage';
import ReportsPage from './ReportsPage';

const HRMSModule: React.FC = () => {
  const navigation = [
    { name: 'Employees', href: '/hrms/employees', icon: Users },
    { name: 'Workflows', href: '/hrms/workflows', icon: UserCheck },
    { name: 'Attendance', href: '/hrms/attendance', icon: Clock },
    { name: 'Reports', href: '/hrms/reports', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">HRMS</h1>
        <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
          Add Employee
        </button>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Content */}
      <Routes>
        <Route path="/" element={<EmployeesPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </div>
  );
};

export default HRMSModule;