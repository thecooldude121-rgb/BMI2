import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, Calendar, Users, TrendingUp } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'partial';
  hoursWorked: number;
  notes?: string;
}

const AttendancePage: React.FC = () => {
  const { employees } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  // Mock attendance data - in a real app, this would come from an API
  const attendanceRecords: AttendanceRecord[] = [
    {
      id: '1',
      employeeId: '1',
      date: selectedDate,
      checkIn: '09:00',
      checkOut: '17:30',
      status: 'present',
      hoursWorked: 8.5,
    },
    {
      id: '2',
      employeeId: '2',
      date: selectedDate,
      checkIn: '09:15',
      checkOut: '17:45',
      status: 'late',
      hoursWorked: 8.5,
      notes: '15 minutes late due to traffic'
    },
    {
      id: '3',
      employeeId: '3',
      date: selectedDate,
      checkIn: '08:45',
      checkOut: '17:00',
      status: 'present',
      hoursWorked: 8.25,
    },
    {
      id: '4',
      employeeId: '4',
      date: selectedDate,
      checkIn: '09:30',
      checkOut: '13:00',
      status: 'partial',
      hoursWorked: 3.5,
      notes: 'Left early for doctor appointment'
    },
    {
      id: '5',
      employeeId: '5',
      date: selectedDate,
      status: 'absent',
      hoursWorked: 0,
      notes: 'Sick leave'
    }
  ];

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  };

  const getEmployeeAvatar = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1';
  };

  const getStatusColor = (status: AttendanceRecord['status']) => {
    const colors = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-orange-100 text-orange-800'
    };
    return colors[status];
  };

  const getStatusIcon = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'partial':
        return <Clock className="h-5 w-5 text-orange-600" />;
    }
  };

  const filteredRecords = selectedEmployee === 'all' 
    ? attendanceRecords 
    : attendanceRecords.filter(record => record.employeeId === selectedEmployee);

  // Calculate stats
  const totalEmployees = employees.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'partial').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
  const avgHours = attendanceRecords.reduce((sum, r) => sum + r.hoursWorked, 0) / attendanceRecords.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Tracking</h2>
          <p className="text-gray-600">Monitor employee attendance and working hours</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Employees</option>
            {employees.map(employee => (
              <option key={employee.id} value={employee.id}>{employee.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Present Today</p>
              <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
              <p className="text-sm text-green-600">
                {totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0}% attendance
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Absent Today</p>
              <p className="text-2xl font-bold text-gray-900">{absentCount}</p>
              <p className="text-sm text-gray-500">{lateCount} late arrivals</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Hours</p>
              <p className="text-2xl font-bold text-gray-900">{avgHours.toFixed(1)}</p>
              <p className="text-sm text-gray-500">per employee</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Attendance for {new Date(selectedDate).toLocaleDateString()}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours Worked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-8 w-8 rounded-full object-cover"
                        src={getEmployeeAvatar(record.employeeId)}
                        alt={getEmployeeName(record.employeeId)}
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {getEmployeeName(record.employeeId)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(record.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkIn || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkOut || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.hoursWorked > 0 ? `${record.hoursWorked}h` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {record.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                    <button className="text-gray-600 hover:text-gray-800">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <Calendar className="h-5 w-5 text-blue-600 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium">Mark Attendance</p>
              <p className="text-xs text-gray-500">Bulk update for today</p>
            </div>
          </button>
          <button className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <Clock className="h-5 w-5 text-green-600 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium">Generate Report</p>
              <p className="text-xs text-gray-500">Monthly attendance report</p>
            </div>
          </button>
          <button className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <TrendingUp className="h-5 w-5 text-purple-600 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium">View Trends</p>
              <p className="text-xs text-gray-500">Attendance analytics</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;