import React, { useState, useEffect } from 'react';
import { User, Upload, Save, Edit2, CheckCircle, AlertCircle, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import FormModal from '../../../components/common/FormModal';

const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [showChangeAvatarModal, setShowChangeAvatarModal] = useState(false);
  const [selectedAvatarColor, setSelectedAvatarColor] = useState('#667eea');

  const [profileData, setProfileData] = useState({
    fullName: 'Alex Rodriguez',
    firstName: 'Alex',
    lastName: 'Rodriguez',
    email: user?.email || 'alex.rodriguez@bmi.com',
    phone: '+1 (555) 123-4567',
    jobTitle: 'Sales Representative',
    department: 'Sales',
    location: 'San Francisco, CA',
    timezone: 'PST (UTC-8)',
    language: 'English (US)',
    memberSince: 'Oct 1, 2024',
    lastLogin: 'Dec 13, 2024 at 9:45 AM'
  });

  const [editFormData, setEditFormData] = useState({
    firstName: 'Alex',
    lastName: 'Rodriguez',
    email: user?.email || 'alex.rodriguez@bmi.com',
    phone: '+1 (555) 123-4567',
    jobTitle: 'Sales Representative',
    department: 'Sales',
    location: 'San Francisco, CA',
    timezone: 'America/Los_Angeles',
    language: 'en-US'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [changeEmailData, setChangeEmailData] = useState({
    newEmail: '',
    password: ''
  });

  const [emailVisibility, setEmailVisibility] = useState<'public' | 'private'>('private');

  const avatarColors = [
    { name: 'Blue', value: '#667eea' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Red', value: '#dc2626' }
  ];

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 2;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 2;
    if (/[a-z]/.test(password)) strength += 2;
    if (/[0-9]/.test(password)) strength += 2;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength <= 3) return { label: 'Weak', color: 'bg-red-500', width: '30%' };
    if (strength <= 6) return { label: 'Medium', color: 'bg-yellow-500', width: '60%' };
    return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = calculatePasswordStrength(passwordData.newPassword);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: passwordData.newPassword.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(passwordData.newPassword) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(passwordData.newPassword) },
    { label: 'Contains number (recommended)', met: /[0-9]/.test(passwordData.newPassword), recommended: true },
    { label: 'Contains special character (!@#$%)', met: /[^A-Za-z0-9]/.test(passwordData.newPassword), recommended: false }
  ];

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSavingProfile(true);
    try {
      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: editFormData.firstName,
          last_name: editFormData.lastName,
          phone: editFormData.phone,
          job_title: editFormData.jobTitle,
          department: editFormData.department,
          location: editFormData.location,
          timezone: editFormData.timezone,
          language: editFormData.language
        }
      });

      if (error) throw error;

      // Update local state
      setProfileData({
        ...profileData,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        fullName: `${editFormData.firstName} ${editFormData.lastName}`,
        phone: editFormData.phone,
        jobTitle: editFormData.jobTitle,
        department: editFormData.department,
        location: editFormData.location
      });

      setIsEditingProfile(false);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showToast('Please fill in all password fields', 'error');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password updated successfully. All other sessions have been logged out.', 'success');
    } catch (error) {
      console.error('Error updating password:', error);
      showToast('Failed to update password. Please check your current password.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!changeEmailData.newEmail || !changeEmailData.password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(changeEmailData.newEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: changeEmailData.newEmail
      });

      if (error) throw error;

      showToast(`Verification email sent to ${changeEmailData.newEmail}`, 'success');
      setShowChangeEmailModal(false);
      setChangeEmailData({ newEmail: '', password: '' });
    } catch (error) {
      console.error('Error changing email:', error);
      showToast('Failed to change email', 'error');
    }
  };

  const handleSaveAvatarColor = () => {
    showToast('Avatar color updated', 'success');
    setShowChangeAvatarModal(false);
  };

  const handleSaveEmailVisibility = async () => {
    try {
      if (user) {
        const { error } = await supabase.auth.updateUser({
          data: {
            email_visibility: emailVisibility
          }
        });

        if (error) throw error;

        showToast(`Email visibility set to ${emailVisibility}`, 'success');
      }
    } catch (error) {
      console.error('Error updating email visibility:', error);
      showToast('Failed to update email visibility', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your personal information and security</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              PROFILE INFORMATION
            </h3>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>

          <div className="p-6">
            {!isEditingProfile ? (
              <div className="space-y-4">
                <div className="flex items-start gap-6">
                  <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
                    AR
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{profileData.fullName}</h4>
                    <p className="text-sm text-gray-600">{profileData.jobTitle}</p>
                    <p className="text-sm text-gray-600">{profileData.email}</p>
                    <p className="text-sm text-gray-600">{profileData.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-3 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Full Name</div>
                    <div className="text-sm text-gray-900 mt-1">{profileData.fullName}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Email</div>
                    <div className="text-sm text-gray-900 mt-1">{profileData.email}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Phone</div>
                    <div className="text-sm text-gray-900 mt-1">{profileData.phone}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Job Title</div>
                    <div className="text-sm text-gray-900 mt-1">{profileData.jobTitle}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Department</div>
                    <div className="text-sm text-gray-900 mt-1">{profileData.department}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Location</div>
                    <div className="text-sm text-gray-900 mt-1">{profileData.location}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Timezone</div>
                    <div className="text-sm text-gray-900 mt-1">{profileData.timezone}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Language</div>
                    <div className="text-sm text-gray-900 mt-1">{profileData.language}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Member Since</div>
                    <div className="text-sm text-gray-900 mt-1">{profileData.memberSince}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase">Last Login</div>
                    <div className="text-sm text-gray-900 mt-1">{profileData.lastLogin}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex gap-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setShowChangeAvatarModal(true)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Change Avatar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
                    AR
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </button>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF (max. 2MB)</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                    <input
                      type="text"
                      value={editFormData.jobTitle}
                      onChange={(e) => setEditFormData({ ...editFormData, jobTitle: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      value={editFormData.department}
                      onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>Sales</option>
                      <option>Marketing</option>
                      <option>Support</option>
                      <option>Management</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={editFormData.location}
                      onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select
                      value={editFormData.timezone}
                      onChange={(e) => setEditFormData({ ...editFormData, timezone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    value={editFormData.language}
                    onChange={(e) => setEditFormData({ ...editFormData, language: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">CHANGE PASSWORD</h3>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Password strength:</span>
                    <span className="font-medium">{strengthInfo.label}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strengthInfo.color} transition-all duration-300`}
                      style={{ width: strengthInfo.width }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {passwordData.newPassword && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Password Requirements:</h4>
                <div className="space-y-2">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {req.met ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : req.recommended ? (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ${req.met ? 'text-green-700' : req.recommended ? 'text-yellow-700' : 'text-red-700'}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleUpdatePassword}
                disabled={!passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword || isUpdatingPassword}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
              <button
                onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">EMAIL PREFERENCES</h3>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Primary Email</label>
              <div className="flex items-center gap-3">
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
                <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Verified
                </span>
              </div>
              <button
                onClick={() => setShowChangeEmailModal(true)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Change Email
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Email Visibility</label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="emailVisibility"
                    checked={emailVisibility === 'public'}
                    onChange={() => setEmailVisibility('public')}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Public (visible to all team members)</div>
                    <div className="text-xs text-gray-500">Your email will be visible to everyone in your organization</div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="emailVisibility"
                    checked={emailVisibility === 'private'}
                    onChange={() => setEmailVisibility('private')}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Private (only visible to admins)</div>
                    <div className="text-xs text-gray-500">Your email will only be visible to system administrators</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveEmailVisibility}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Email Modal */}
      <FormModal
        isOpen={showChangeEmailModal}
        title="Change Email Address"
        onClose={() => {
          setShowChangeEmailModal(false);
          setChangeEmailData({ newEmail: '', password: '' });
        }}
        onSubmit={handleChangeEmail}
        submitLabel="Change Email"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Email:
            </label>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              {profileData.email}
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Verified
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Email:
            </label>
            <input
              type="email"
              value={changeEmailData.newEmail}
              onChange={(e) => setChangeEmailData({ ...changeEmailData, newEmail: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="new.email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password (for verification):
            </label>
            <input
              type="password"
              value={changeEmailData.password}
              onChange={(e) => setChangeEmailData({ ...changeEmailData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                You'll need to verify your new email address. We'll send a verification link.
              </div>
            </div>
          </div>
        </div>
      </FormModal>

      {/* Change Avatar Modal */}
      <FormModal
        isOpen={showChangeAvatarModal}
        title="Change Avatar"
        onClose={() => setShowChangeAvatarModal(false)}
        onSubmit={handleSaveAvatarColor}
        submitLabel="Save"
        maxWidth="sm"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Current Avatar:
            </label>
            <div
              className="h-20 w-20 rounded-lg flex items-center justify-center text-white text-2xl font-semibold"
              style={{ backgroundColor: selectedAvatarColor }}
            >
              AR
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload New Photo
            </label>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Choose File
            </button>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF (max. 2MB)</p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Or Choose Initials Color:
            </label>
            <div className="grid grid-cols-5 gap-3">
              {avatarColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedAvatarColor(color.value)}
                  className={`h-12 w-12 rounded-lg transition-all ${
                    selectedAvatarColor === color.value
                      ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
};

export default ProfileSettings;
