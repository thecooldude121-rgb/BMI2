import React, { useState } from 'react';
import { FileText, Download, Calendar, Users, TrendingUp, BarChart3, Filter } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const ReportsPage: React.FC = () => {
  const { employees, tasks } = useData();
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [dateRange, setDateRange] = useState('30');

  const reportTypes = [
    { id: 'attendance', name: 'Attendance Report', icon: Calendar },
    { id: 'employee', name: 'Employee Report', icon: Users },
    { id: 'performance', name: 'Performance Report', icon: TrendingUp },
    { id: 'workflow', name: 'Workflow Report', icon: BarChart3 }
  ];

  // Mock attendance data for reports
  const attendanceStats = {
    totalEmployees: employees.length,
    avgAttendance: 92.5,
    totalWorkingDays: 22,
    totalAbsences: 8,
    lateArrivals: 12
  };

  // Mock performance data
  const performanceStats = {
    tasksCompleted: tasks.filter(t => t.status === 'completed').length,
    tasksInProgress: tasks.filter(t => t.status === 'in-progress').length,
    tasksPending: tasks.filter(t => t.status === 'pending').length,
    avgCompletionTime: 3.2
  };

  const generateReport = () => {
    // Mock report generation
    console.log(`Generating ${selectedReport} report for last ${dateRange} days`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">HR Reports</h2>
          <p className="text-gray-600">Generate and analyze HR metrics and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button
            onClick={generateReport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`p-4 border rounded-lg text-left transition-colors ${
              selectedReport === report.id
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <report.icon className={`h-6 w-6 ${
                selectedReport === report.id ? 'text-green-600' : 'text-gray-400'
              }`} />
              <span className="font-medium">{report.name}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Report Content */}
      {selectedReport === 'attendance' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Attendance Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{attendanceStats.avgAttendance}%</p>
              <p className="text-sm text-gray-600">Average Attendance</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{attendanceStats.totalWorkingDays}</p>
              <p className="text-sm text-gray-600">Working Days</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{attendanceStats.totalAbsences}</p>
              <p className="text-sm text-gray-600">Total Absences</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Present
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Absent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => {
                  const daysPresent = Math.floor(Math.random() * 3) + 20; // 20-22 days
                  const daysAbsent = 22 - daysPresent;
                  const attendancePercent = Math.round((daysPresent / 22) * 100);
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={employee.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
                            alt={employee.name}
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {daysPresent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {daysAbsent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            attendancePercent >= 95 ? 'text-green-600' :
                            attendancePercent >= 90 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {attendancePercent}%
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                attendancePercent >= 95 ? 'bg-green-500' :
                                attendancePercent >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${attendancePercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'employee' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Employee Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{employees.length}</p>
              <p className="text-sm text-gray-600">Total Employees</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {employees.filter(e => e.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {new Set(employees.map(e => e.department)).size}
              </p>
              <p className="text-sm text-gray-600">Departments</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                ${Math.round(employees.reduce((sum, emp) => sum + (emp.salary || 0), 0) / employees.length / 1000)}K
              </p>
              <p className="text-sm text-gray-600">Avg Salary</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Department Breakdown</h4>
            {Object.entries(employees.reduce((acc, emp) => {
              acc[emp.department] = (acc[emp.department] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="font-medium text-gray-900">{dept}</span>
                <span className="text-sm text-gray-600">{count} employees</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedReport === 'performance' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{performanceStats.tasksCompleted}</p>
              <p className="text-sm text-gray-600">Tasks Completed</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{performanceStats.tasksInProgress}</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{performanceStats.tasksPending}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{performanceStats.avgCompletionTime}</p>
              <p className="text-sm text-gray-600">Avg Days to Complete</p>
            </div>
          </div>

          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Detailed performance analytics coming soon</p>
          </div>
        </div>
      )}

      {selectedReport === 'workflow' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Workflow Analytics</h3>
          
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Workflow analytics and insights coming soon</p>
            <p className="text-sm text-gray-500 mt-2">Track workflow completion rates, bottlenecks, and efficiency metrics</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;