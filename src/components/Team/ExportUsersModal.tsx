import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TeamMember } from '../../types/team';

interface ExportUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onExport: (format: 'csv' | 'pdf' | 'json', message: string) => void;
}

interface ExportFields {
  basicInfo: boolean;
  rolePermissions: boolean;
  departmentManager: boolean;
  accountStatus: boolean;
  lastLogin: boolean;
  performanceStats: boolean;
  loginHistory: boolean;
  auditLog: boolean;
}

type FilterType = 'all' | 'active' | 'inactive' | 'role' | 'department';

export default function ExportUsersModal({
  isOpen,
  onClose,
  teamMembers,
  onExport
}: ExportUsersModalProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'json'>('csv');
  const [fields, setFields] = useState<ExportFields>({
    basicInfo: true,
    rolePermissions: true,
    departmentManager: true,
    accountStatus: true,
    lastLogin: true,
    performanceStats: true,
    loginHistory: false,
    auditLog: false
  });
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  if (!isOpen) return null;

  const toggleField = (field: keyof ExportFields) => {
    setFields({ ...fields, [field]: !fields[field] });
  };

  const getFilteredMembers = (): TeamMember[] => {
    switch (filterType) {
      case 'active':
        return teamMembers.filter(m => m.status === 'active');
      case 'inactive':
        return teamMembers.filter(m => m.status === 'inactive');
      case 'role':
        return selectedRole ? teamMembers.filter(m => m.role === selectedRole) : teamMembers;
      case 'department':
        return selectedDepartment ? teamMembers.filter(m => m.department === selectedDepartment) : teamMembers;
      default:
        return teamMembers;
    }
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const generateCSV = () => {
    const filteredMembers = getFilteredMembers();

    const headers: string[] = [];
    if (fields.basicInfo) headers.push('Full Name', 'Email', 'Phone');
    if (fields.rolePermissions) headers.push('Role', 'Title');
    if (fields.departmentManager) headers.push('Department', 'Manager');
    if (fields.accountStatus) headers.push('Status', 'Joined Date');
    if (fields.lastLogin) headers.push('Last Login');
    if (fields.performanceStats) headers.push('Active Deals', 'Pipeline Value', 'Closed Deals');
    if (fields.loginHistory) headers.push('Total Logins (90 days)');
    if (fields.auditLog) headers.push('Last Admin Action');

    const rows = filteredMembers.map(member => {
      const row: string[] = [];
      if (fields.basicInfo) {
        row.push(member.name, member.email, member.phone || 'N/A');
      }
      if (fields.rolePermissions) {
        row.push(member.role, member.title || 'N/A');
      }
      if (fields.departmentManager) {
        row.push(member.department, member.manager || 'N/A');
      }
      if (fields.accountStatus) {
        row.push(member.status, formatDate(member.joinedDate));
      }
      if (fields.lastLogin) {
        row.push(formatDate(member.lastLogin));
      }
      if (fields.performanceStats) {
        row.push(
          String(member.activeDeals || 0),
          `$${(member.pipelineValue || 0).toLocaleString()}`,
          String(member.closedDeals || 0)
        );
      }
      if (fields.loginHistory) {
        row.push(String(member.totalLogins90Days || 0));
      }
      if (fields.auditLog) {
        row.push(member.lastAdminAction || 'None');
      }
      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','))
    ].join('\n');

    const date = new Date().toISOString().split('T')[0];
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `team_members_${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return `User list exported successfully. ${filteredMembers.length} users exported to CSV.`;
  };

  const generatePDF = () => {
    const filteredMembers = getFilteredMembers();
    const date = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toLocaleString();

    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Team Members Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #1e40af;
      font-size: 28px;
    }
    .header .meta {
      color: #6b7280;
      font-size: 14px;
      margin-top: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 12px;
    }
    th {
      background-color: #f3f4f6;
      color: #1f2937;
      text-align: left;
      padding: 12px 8px;
      border: 1px solid #e5e7eb;
      font-weight: 600;
    }
    td {
      padding: 10px 8px;
      border: 1px solid #e5e7eb;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .status-active {
      color: #059669;
      font-weight: 600;
    }
    .status-inactive {
      color: #dc2626;
      font-weight: 600;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #6b7280;
      text-align: center;
    }
    .summary {
      background: #eff6ff;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .summary strong {
      color: #1e40af;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Team Members Report</h1>
    <div class="meta">
      <div>Export Date: ${timestamp}</div>
      <div>Total Members: ${filteredMembers.length}</div>
    </div>
  </div>

  <div class="summary">
    <strong>Export Details:</strong><br>
    Format: PDF Report<br>
    Filter: ${filterType === 'all' ? 'All Users' : filterType === 'active' ? 'Active Only' : filterType === 'inactive' ? 'Inactive Only' : filterType === 'role' ? `Role: ${selectedRole}` : `Department: ${selectedDepartment}`}<br>
    Active Members: ${filteredMembers.filter(m => m.status === 'active').length}<br>
    Inactive Members: ${filteredMembers.filter(m => m.status === 'inactive').length}
  </div>

  <table>
    <thead>
      <tr>
        ${fields.basicInfo ? '<th>Name</th><th>Email</th><th>Phone</th>' : ''}
        ${fields.rolePermissions ? '<th>Role</th><th>Title</th>' : ''}
        ${fields.departmentManager ? '<th>Department</th><th>Manager</th>' : ''}
        ${fields.accountStatus ? '<th>Status</th><th>Joined</th>' : ''}
        ${fields.lastLogin ? '<th>Last Login</th>' : ''}
        ${fields.performanceStats ? '<th>Active Deals</th><th>Pipeline</th><th>Closed</th>' : ''}
      </tr>
    </thead>
    <tbody>
`;

    filteredMembers.forEach(member => {
      htmlContent += '<tr>';
      if (fields.basicInfo) {
        htmlContent += `<td>${member.name}</td><td>${member.email}</td><td>${member.phone || 'N/A'}</td>`;
      }
      if (fields.rolePermissions) {
        htmlContent += `<td>${member.role}</td><td>${member.title || 'N/A'}</td>`;
      }
      if (fields.departmentManager) {
        htmlContent += `<td>${member.department}</td><td>${member.manager || 'N/A'}</td>`;
      }
      if (fields.accountStatus) {
        const statusClass = member.status === 'active' ? 'status-active' : 'status-inactive';
        htmlContent += `<td class="${statusClass}">${member.status}</td><td>${formatDate(member.joinedDate)}</td>`;
      }
      if (fields.lastLogin) {
        htmlContent += `<td>${formatDate(member.lastLogin)}</td>`;
      }
      if (fields.performanceStats) {
        htmlContent += `<td>${member.activeDeals || 0}</td><td>$${(member.pipelineValue || 0).toLocaleString()}</td><td>${member.closedDeals || 0}</td>`;
      }
      htmlContent += '</tr>';
    });

    htmlContent += `
    </tbody>
  </table>

  <div class="footer">
    <p>This report was generated from the Team Management System on ${timestamp}</p>
    <p>© ${new Date().getFullYear()} BMI Corporation. All rights reserved.</p>
  </div>
</body>
</html>
`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `team_members_report_${date}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return `PDF report exported successfully. ${filteredMembers.length} users included. (Note: HTML version generated - open in browser and print to PDF)`;
  };

  const generateJSON = () => {
    const filteredMembers = getFilteredMembers();
    const date = new Date().toISOString().split('T')[0];

    const jsonData = {
      exportDate: new Date().toISOString(),
      exportFormat: 'json',
      filterApplied: filterType,
      totalMembers: filteredMembers.length,
      members: filteredMembers.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
        title: member.title,
        department: member.department,
        manager: member.manager,
        status: member.status,
        joinedDate: member.joinedDate,
        lastLogin: member.lastLogin,
        location: member.location,
        territory: member.territory,
        avatar: member.avatar,
        performance: {
          activeDeals: member.activeDeals || 0,
          pipelineValue: member.pipelineValue || 0,
          closedDeals: member.closedDeals || 0,
          revenue: member.revenue || 0,
          quota: member.quota || 0,
          quotaAttainment: member.quotaAttainment || 0
        }
      }))
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `team_members_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return `JSON data exported successfully. ${filteredMembers.length} users exported for API/developer use.`;
  };

  const handleExport = () => {
    let message = '';

    switch (exportFormat) {
      case 'csv':
        message = generateCSV();
        break;
      case 'pdf':
        message = generatePDF();
        break;
      case 'json':
        message = generateJSON();
        break;
    }

    onExport(exportFormat, message);
    onClose();
  };

  const filteredCount = getFilteredMembers().length;
  const activeCount = teamMembers.filter(m => m.status === 'active').length;
  const inactiveCount = teamMembers.filter(m => m.status === 'inactive').length;

  const uniqueRoles = Array.from(new Set(teamMembers.map(m => m.role)));
  const uniqueDepartments = Array.from(new Set(teamMembers.map(m => m.department)));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Export Team Members</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Export Format */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Export Format:
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="radio"
                    name="format"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-sm text-gray-900 font-medium">CSV (Spreadsheet)</span>
                </label>
                <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="radio"
                    name="format"
                    checked={exportFormat === 'pdf'}
                    onChange={() => setExportFormat('pdf')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-sm text-gray-900 font-medium">PDF (Printable Report)</span>
                </label>
                <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="radio"
                    name="format"
                    checked={exportFormat === 'json'}
                    onChange={() => setExportFormat('json')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-sm text-gray-900 font-medium">JSON (Developer Export)</span>
                </label>
              </div>
            </div>

            {/* Include Fields */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Include:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fields.basicInfo}
                    onChange={() => toggleField('basicInfo')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">Basic info (name, email, phone)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fields.rolePermissions}
                    onChange={() => toggleField('rolePermissions')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">Role and permissions</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fields.departmentManager}
                    onChange={() => toggleField('departmentManager')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">Department and manager</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fields.accountStatus}
                    onChange={() => toggleField('accountStatus')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">Account status</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fields.lastLogin}
                    onChange={() => toggleField('lastLogin')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">Last login date</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fields.performanceStats}
                    onChange={() => toggleField('performanceStats')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">Performance stats (deals, pipeline)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fields.loginHistory}
                    onChange={() => toggleField('loginHistory')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">Login history (last 90 days)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={fields.auditLog}
                    onChange={() => toggleField('auditLog')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">Audit log (admin actions only)</span>
                </label>
              </div>
            </div>

            {/* Filter Export */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Filter Export:
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="radio"
                    name="filter"
                    checked={filterType === 'all'}
                    onChange={() => setFilterType('all')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-sm text-gray-900">All users ({teamMembers.length})</span>
                </label>
                <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="radio"
                    name="filter"
                    checked={filterType === 'active'}
                    onChange={() => setFilterType('active')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-sm text-gray-900">Active only ({activeCount})</span>
                </label>
                <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="radio"
                    name="filter"
                    checked={filterType === 'inactive'}
                    onChange={() => setFilterType('inactive')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-sm text-gray-900">Inactive only ({inactiveCount})</span>
                </label>
                <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="radio"
                    name="filter"
                    checked={filterType === 'role'}
                    onChange={() => setFilterType('role')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-sm text-gray-900 flex-1">By role:</span>
                  {filterType === 'role' && (
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Select role</option>
                      {uniqueRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  )}
                </label>
                <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="radio"
                    name="filter"
                    checked={filterType === 'department'}
                    onChange={() => setFilterType('department')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-sm text-gray-900 flex-1">By department:</span>
                  {filterType === 'department' && (
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Select dept</option>
                      {uniqueDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  )}
                </label>
              </div>
            </div>

            {/* Export Summary */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">{filteredCount} user{filteredCount !== 1 ? 's' : ''}</span> will be exported in{' '}
                <span className="font-semibold text-gray-900">{exportFormat.toUpperCase()}</span> format
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={filteredCount === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filteredCount === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
