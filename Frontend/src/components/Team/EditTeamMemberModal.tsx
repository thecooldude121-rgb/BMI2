import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Eye, Shield, Check } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  jobTitle: string;
  department: string;
  status: 'Active' | 'Inactive';
  manager: string;
  team: string;
  joinDate: string;
  lastLogin: string;
  twoFactorEnabled: boolean;
  employeeId: string;
  initials: string;
  avatarColor: string;
}

interface EditTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onSave: (updatedMember: TeamMember, changes: any) => void;
  allMembers: TeamMember[];
}

const EditTeamMemberModal: React.FC<EditTeamMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onSave,
  allMembers
}) => {
  const [formData, setFormData] = useState<TeamMember | null>(null);
  const [requirePasswordReset, setRequirePasswordReset] = useState(false);
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (member) {
      setFormData({ ...member });
      setRequirePasswordReset(false);
      setErrors({});
    }
  }, [member]);

  if (!isOpen || !member || !formData) return null;

  const roles = [
    'CEO / Owner',
    'VP / Director',
    'Sales Manager',
    'Sales Representative',
    'Account Executive',
    'Admin',
    'Analyst',
    'Support'
  ];

  const departments = [
    'Sales',
    'Marketing',
    'Engineering',
    'Customer Success',
    'Operations',
    'Finance',
    'HR'
  ];

  const teams = [
    'Sales East',
    'Sales West',
    'Enterprise Sales',
    'SMB Sales',
    'Marketing Team',
    'Engineering Team',
    'Support Team'
  ];

  // Get potential managers (exclude self and anyone who reports to this person)
  const potentialManagers = allMembers.filter(m =>
    m.id !== member.id &&
    m.status === 'Active' &&
    (m.role === 'CEO / Owner' || m.role === 'VP / Director' || m.role === 'Sales Manager')
  );

  const getPermissionLevel = (role: string): string => {
    switch (role) {
      case 'CEO / Owner':
        return 'Full Access';
      case 'VP / Director':
        return 'Advanced User';
      case 'Sales Manager':
        return 'Team Manager';
      case 'Admin':
        return 'System Admin';
      default:
        return 'Standard User';
    }
  };

  const handleInputChange = (field: keyof TeamMember, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    // Track changes
    const changes: any = {};

    if (formData.name !== member.name) {
      changes.name = { from: member.name, to: formData.name };
    }
    if (formData.phone !== member.phone) {
      changes.phone = { from: member.phone, to: formData.phone };
    }
    if (formData.role !== member.role) {
      changes.role = { from: member.role, to: formData.role };
    }
    if (formData.department !== member.department) {
      changes.department = { from: member.department, to: formData.department };
    }
    if (formData.manager !== member.manager) {
      changes.manager = { from: member.manager, to: formData.manager };
    }
    if (formData.team !== member.team) {
      changes.team = { from: member.team, to: formData.team };
    }
    if (formData.status !== member.status) {
      changes.status = { from: member.status, to: formData.status };
    }
    if (formData.twoFactorEnabled !== member.twoFactorEnabled) {
      changes.twoFactorEnabled = { from: member.twoFactorEnabled, to: formData.twoFactorEnabled };
    }
    if (requirePasswordReset) {
      changes.requirePasswordReset = true;
    }

    onSave(formData, changes);
  };

  const handleDeactivate = () => {
    if (confirm(`Are you sure you want to deactivate ${member.name}?\n\nThey will lose access immediately and their seat will be freed.`)) {
      const deactivatedMember = { ...formData, status: 'Inactive' as const };
      onSave(deactivatedMember, {
        status: { from: member.status, to: 'Inactive' },
        deactivated: true
      });
    }
  };

  const handleDelete = () => {
    const confirmed = confirm(
      `⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to permanently delete ${member.name}?\n\nThis will:\n- Remove the user account\n- Delete ALL associated data\n- Cannot be undone\n\nType "${member.name}" to confirm deletion.`
    );

    if (confirmed) {
      const secondConfirm = prompt(`Type "${member.name}" to confirm deletion:`);
      if (secondConfirm === member.name) {
        onSave(formData, { deleted: true });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Team Member: {member.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* BASIC INFORMATION */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Basic Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Cannot be changed - contact support to update email
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="555-0000"
                />
              </div>
            </div>
          </div>

          {/* ROLE & PERMISSIONS */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Role & Permissions
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Role
                </label>
                <p className="text-sm text-gray-600 mb-3">{member.role}</p>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Change Role To
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.role ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-900">
                    Permissions: {getPermissionLevel(formData.role)}
                  </p>
                </div>
                <p className="text-xs text-blue-700 mb-2">
                  Auto-updates based on role
                </p>
                <button
                  onClick={() => setShowPermissionsMatrix(!showPermissionsMatrix)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  View Permissions Matrix
                </button>
              </div>

              {showPermissionsMatrix && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-xs">
                  <h4 className="font-semibold text-gray-900 mb-3">Permission Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">View All Records</span>
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Edit Own Records</span>
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Delete Records</span>
                      {formData.role === 'CEO / Owner' || formData.role === 'Admin' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Manage Team</span>
                      {formData.role === 'CEO / Owner' || formData.role === 'VP / Director' || formData.role === 'Sales Manager' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">System Settings</span>
                      {formData.role === 'CEO / Owner' || formData.role === 'Admin' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DEPARTMENT & REPORTING */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Department & Reporting
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reports To (Manager)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Current: {member.manager}
                </p>
                <select
                  value={formData.manager}
                  onChange={(e) => handleInputChange('manager', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No Manager</option>
                  {potentialManagers.map(manager => (
                    <option key={manager.id} value={manager.name}>
                      {manager.name} ({manager.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team
                </label>
                <select
                  value={formData.team}
                  onChange={(e) => handleInputChange('team', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ACCOUNT STATUS */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Account Status
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'Active'}
                      onChange={() => handleInputChange('status', 'Active')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'Inactive'}
                      onChange={() => handleInputChange('status', 'Inactive')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Inactive</span>
                  </label>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Current Status</p>
                    <p className="font-medium text-gray-900">{member.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Member Since</p>
                    <p className="font-medium text-gray-900">{member.joinDate}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Last Login</p>
                    <p className="font-medium text-gray-900">{member.lastLogin}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.twoFactorEnabled}
                      onChange={(e) => handleInputChange('twoFactorEnabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Two-factor authentication enabled</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requirePasswordReset}
                      onChange={(e) => setRequirePasswordReset(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Require password reset</span>
                  </label>
                  {requirePasswordReset && (
                    <p className="text-xs text-orange-600 ml-6">
                      User will be logged out and required to reset password
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div>
            <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-4">
              Danger Zone
            </h3>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  Careful - these actions cannot be easily undone
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <button
                    onClick={handleDeactivate}
                    disabled={formData.status === 'Inactive'}
                    className="w-full px-4 py-2 bg-white border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Deactivate User
                  </button>
                  <p className="text-xs text-red-700 mt-1">
                    User loses access, seat freed, data kept
                  </p>
                </div>

                <div>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete User Permanently
                  </button>
                  <p className="text-xs text-red-700 mt-1">
                    Removes user and ALL associated data
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTeamMemberModal;
