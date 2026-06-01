import React, { useState } from 'react';
import { X, Info, Eye, EyeOff } from 'lucide-react';
import { TeamMember } from '../../types/team';

type UserRole = 'ceo' | 'vp' | 'manager' | 'rep' | 'account_executive' | 'admin' | 'analyst' | 'support';
type Department = 'Sales' | 'Marketing' | 'Customer Success' | 'Operations' | 'Finance' | 'HR' | 'Engineering' | 'Product' | 'Executive' | 'Other';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newMember: Partial<TeamMember>) => void;
  existingMembers: TeamMember[];
}

export default function AddTeamMemberModal({ isOpen, onClose, onAdd, existingMembers }: AddTeamMemberModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'sales_rep' as any,
    department: 'Sales',
    reportsTo: '',
    team: 'Sales East',
    status: 'active' as 'active' | 'away' | 'offline',
    loginMethod: 'email',
    sendWelcomeEmail: true,
    requirePasswordChange: true,
    enableTwoFactor: true,
    employeeNumber: `EMP-${Math.random().toString().slice(2, 8)}`,
    startDate: new Date().toISOString().split('T')[0],
    timezone: 'PST (UTC-8)',
    language: 'English (US)',
    location: 'Remote'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPermissions, setShowPermissions] = useState(false);

  const roleOptions: { value: string; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'sales_manager', label: 'Sales Manager' },
    { value: 'sales_rep', label: 'Sales Representative' },
    { value: 'account_executive', label: 'Account Executive' },
    { value: 'sales_development_rep', label: 'Sales Development Rep' },
    { value: 'customer_success', label: 'Customer Success' },
    { value: 'marketing', label: 'Marketing' }
  ];

  const departmentOptions: Department[] = [
    'Sales',
    'Marketing',
    'Customer Success',
    'Operations',
    'Finance',
    'HR',
    'Engineering',
    'Product',
    'Executive',
    'Other'
  ];

  const teamOptions = ['Sales East', 'Sales West', 'Enterprise', 'SMB', 'Mid-Market'];

  const managerOptions = existingMembers
    .filter(m => ['admin', 'sales_manager'].includes(m.role))
    .map(m => ({ value: m.id, label: `${m.name} (${getRoleLabel(m.role)})` }));

  function getRoleLabel(role: string): string {
    const roleMap: Record<string, string> = {
      'admin': 'Admin',
      'sales_manager': 'Sales Manager',
      'sales_rep': 'Sales Rep',
      'account_executive': 'Account Executive',
      'sales_development_rep': 'SDR',
      'customer_success': 'Customer Success',
      'marketing': 'Marketing'
    };
    return roleMap[role] || role;
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2 || formData.fullName.length > 100) {
      newErrors.fullName = 'Name must be between 2 and 100 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (existingMembers.some(m => m.email.toLowerCase() === formData.email.toLowerCase())) {
      newErrors.email = 'This email is already in use';
    }

    // Phone validation (optional)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Manager validation (required for non-admins/managers)
    if (!['admin', 'sales_manager'].includes(formData.role) && !formData.reportsTo) {
      newErrors.reportsTo = 'Manager is required for this role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const manager = managerOptions.find(m => m.value === formData.reportsTo);

    const newMember: Partial<TeamMember> = {
      id: `user-${Date.now()}`,
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone || undefined,
      role: formData.role as any,
      title: getRoleLabel(formData.role),
      department: formData.department,
      status: formData.status,
      reportsTo: manager?.label || undefined,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=random`,
      joinedDate: formData.startDate,
      lastActive: new Date().toISOString(),
      location: formData.location,
      skills: [],
      permissions: [],
      performance: {
        dealsWon: 0,
        dealsClosed: 0,
        revenue: 0,
        quotaAttainment: 0,
        activitiesLogged: 0,
        averageResponseTime: 0
      },
      metrics: {
        leadsConverted: 0,
        avgDealSize: 0,
        winRate: 0,
        pipelineValue: 0
      }
    };

    onAdd(newMember);
    onClose();
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Add New Team Member</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* BASIC INFORMATION */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.fullName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="email@example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">Will be used for login</p>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                  <p className="mt-1 text-xs text-gray-500">Optional</p>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ROLE & PERMISSIONS */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Role & Permissions
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Permissions: Standard User</p>
                      <p className="text-xs text-blue-700 mt-1">Auto-assigned based on role</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPermissions(!showPermissions)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showPermissions ? 'Hide' : 'View'} Permissions Details
                    </button>
                  </div>
                  {showPermissions && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <ul className="text-xs text-blue-900 space-y-1">
                        <li>✓ View and manage assigned leads</li>
                        <li>✓ Create and update deals</li>
                        <li>✓ Access team calendar</li>
                        <li>✓ Generate reports</li>
                        {['admin', 'sales_manager'].includes(formData.role) && (
                          <>
                            <li>✓ Manage team members</li>
                            <li>✓ Configure settings</li>
                          </>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DEPARTMENT & REPORTING */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Department & Reporting
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value as Department)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reports To (Manager)
                    {!['admin', 'sales_manager'].includes(formData.role) && (
                      <span className="text-red-500"> *</span>
                    )}
                  </label>
                  <select
                    value={formData.reportsTo}
                    onChange={(e) => handleChange('reportsTo', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.reportsTo ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={['admin', 'sales_manager'].includes(formData.role)}
                  >
                    <option value="">
                      {['admin', 'sales_manager'].includes(formData.role) ? 'None (Manager)' : 'Select manager'}
                    </option>
                    {managerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Filtered by role hierarchy
                  </p>
                  {errors.reportsTo && (
                    <p className="mt-1 text-sm text-red-600">{errors.reportsTo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team
                  </label>
                  <select
                    value={formData.team}
                    onChange={(e) => handleChange('team', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {teamOptions.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ACCOUNT SETTINGS */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Account Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="active"
                        checked={formData.status === 'active'}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="inactive"
                        checked={formData.status === 'inactive'}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Inactive</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Login Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="email"
                        checked={formData.loginMethod === 'email'}
                        onChange={(e) => handleChange('loginMethod', e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Email/Password</span>
                    </label>
                    <label className="flex items-center opacity-50 cursor-not-allowed">
                      <input
                        type="radio"
                        value="sso"
                        disabled
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">SSO (if configured)</span>
                    </label>
                    <label className="flex items-center opacity-50 cursor-not-allowed">
                      <input
                        type="radio"
                        value="google"
                        disabled
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Google OAuth</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sendWelcomeEmail}
                      onChange={(e) => handleChange('sendWelcomeEmail', e.target.checked)}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm text-gray-700">Send welcome email with login link</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.requirePasswordChange}
                      onChange={(e) => handleChange('requirePasswordChange', e.target.checked)}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm text-gray-700">Require password change on first login</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.enableTwoFactor}
                      onChange={(e) => handleChange('enableTwoFactor', e.target.checked)}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm text-gray-700">Enable two-factor authentication (recommended)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* ADDITIONAL DETAILS */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Additional Details (Optional)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Number
                  </label>
                  <input
                    type="text"
                    value={formData.employeeNumber}
                    onChange={(e) => handleChange('employeeNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="Auto-generated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Remote, New York, San Francisco"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>PST (UTC-8)</option>
                    <option>MST (UTC-7)</option>
                    <option>CST (UTC-6)</option>
                    <option>EST (UTC-5)</option>
                    <option>GMT (UTC+0)</option>
                    <option>IST (UTC+5:30)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">* Required fields</p>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Add Team Member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
