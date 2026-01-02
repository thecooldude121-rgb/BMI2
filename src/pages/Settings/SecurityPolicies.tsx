import React, { useState, useEffect } from 'react';
import {
  Shield, Lock, Globe, Smartphone, Monitor, AlertTriangle, CheckCircle,
  XCircle, Eye, EyeOff, Info, Plus, X, Trash2, Download, Save, RefreshCw,
  Activity, Clock, MapPin, Users, Key, Bell, FileText, TrendingUp, Zap
} from 'lucide-react';

interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  historyCount: number;
  expiryDays: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  lockoutType: 'temporary' | 'permanent';
}

interface TwoFactorSettings {
  enabled: boolean;
  smsEnabled: boolean;
  authenticatorEnabled: boolean;
  backupCodesGenerated: boolean;
  backupCodesCount: number;
  bypassRoles: string[];
  bypassUsers: string[];
  enforcementMode: 'optional' | 'required' | 'admin_only';
}

interface IPRestriction {
  id: string;
  type: 'whitelist' | 'blacklist';
  ipAddress: string;
  ipRange?: string;
  description: string;
  country?: string;
  createdAt: string;
  createdBy: string;
}

interface TrustedDevice {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  fingerprint: string;
  browser: string;
  os: string;
  lastUsed: string;
  ipAddress: string;
  location: string;
  trusted: boolean;
}

interface SessionSettings {
  idleTimeout: number;
  absoluteTimeout: number;
  maxConcurrentSessions: number;
  forceLogoutOnPasswordChange: boolean;
  trackLocation: boolean;
}

interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'ip_blocked' | 'device_changed' | 'password_changed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userName?: string;
  description: string;
  ipAddress?: string;
  location?: string;
  timestamp: string;
  resolved: boolean;
}

const SecurityPolicies: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'password' | '2fa' | 'ip' | 'devices' | 'monitoring'>('password');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>({
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    historyCount: 12,
    expiryDays: 90,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    lockoutType: 'temporary'
  });

  const [twoFactorSettings, setTwoFactorSettings] = useState<TwoFactorSettings>({
    enabled: false,
    smsEnabled: true,
    authenticatorEnabled: true,
    backupCodesGenerated: false,
    backupCodesCount: 10,
    bypassRoles: [],
    bypassUsers: [],
    enforcementMode: 'optional'
  });

  const [ipRestrictions, setIpRestrictions] = useState<IPRestriction[]>([
    {
      id: '1',
      type: 'whitelist',
      ipAddress: '192.168.1.0/24',
      description: 'Office Network',
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: 'admin@company.com'
    }
  ]);

  const [sessionSettings, setSessionSettings] = useState<SessionSettings>({
    idleTimeout: 30,
    absoluteTimeout: 480,
    maxConcurrentSessions: 3,
    forceLogoutOnPasswordChange: true,
    trackLocation: true
  });

  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([
    {
      id: '1',
      userId: 'user1',
      deviceName: 'MacBook Pro',
      deviceType: 'desktop',
      fingerprint: 'fp_abc123xyz',
      browser: 'Chrome 120',
      os: 'macOS 14.0',
      lastUsed: '2024-01-20T15:30:00Z',
      ipAddress: '192.168.1.100',
      location: 'San Francisco, CA',
      trusted: true
    },
    {
      id: '2',
      userId: 'user1',
      deviceName: 'iPhone 15',
      deviceType: 'mobile',
      fingerprint: 'fp_def456uvw',
      browser: 'Safari 17',
      os: 'iOS 17',
      lastUsed: '2024-01-21T09:15:00Z',
      ipAddress: '192.168.1.105',
      location: 'San Francisco, CA',
      trusted: true
    }
  ]);

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      type: 'failed_login',
      severity: 'medium',
      userId: 'user1',
      userName: 'john.doe@company.com',
      description: 'Multiple failed login attempts from suspicious IP',
      ipAddress: '203.0.113.45',
      location: 'Unknown Location',
      timestamp: '2024-01-21T14:22:00Z',
      resolved: false
    },
    {
      id: '2',
      type: 'suspicious_activity',
      severity: 'high',
      userId: 'user2',
      userName: 'jane.smith@company.com',
      description: 'Login from new location without 2FA',
      ipAddress: '198.51.100.23',
      location: 'Moscow, Russia',
      timestamp: '2024-01-21T13:45:00Z',
      resolved: false
    },
    {
      id: '3',
      type: 'password_changed',
      severity: 'low',
      userId: 'user3',
      userName: 'bob.wilson@company.com',
      description: 'Password changed successfully',
      ipAddress: '192.168.1.102',
      location: 'San Francisco, CA',
      timestamp: '2024-01-21T11:30:00Z',
      resolved: true
    }
  ]);

  const [newIPRestriction, setNewIPRestriction] = useState({
    type: 'whitelist' as 'whitelist' | 'blacklist',
    ipAddress: '',
    ipRange: '',
    description: '',
    country: ''
  });

  const [showAddIPModal, setShowAddIPModal] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const calculatePasswordStrength = (): number => {
    let score = 0;
    if (passwordPolicy.minLength >= 12) score += 20;
    else if (passwordPolicy.minLength >= 8) score += 10;

    if (passwordPolicy.requireUppercase) score += 15;
    if (passwordPolicy.requireLowercase) score += 15;
    if (passwordPolicy.requireNumbers) score += 15;
    if (passwordPolicy.requireSpecialChars) score += 15;

    if (passwordPolicy.historyCount >= 10) score += 10;
    if (passwordPolicy.expiryDays <= 90 && passwordPolicy.expiryDays > 0) score += 10;

    return Math.min(score, 100);
  };

  const calculateSecurityScore = (): number => {
    let score = 0;

    score += calculatePasswordStrength() * 0.3;

    if (twoFactorSettings.enabled) score += 25;
    if (twoFactorSettings.authenticatorEnabled) score += 5;
    if (twoFactorSettings.backupCodesGenerated) score += 5;

    if (ipRestrictions.length > 0) score += 15;

    if (sessionSettings.idleTimeout <= 30) score += 5;
    if (sessionSettings.maxConcurrentSessions <= 3) score += 5;

    return Math.min(Math.round(score), 100);
  };

  const handleSavePasswordPolicy = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSave2FASettings = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddIPRestriction = () => {
    if (!newIPRestriction.ipAddress) {
      alert('IP Address is required');
      return;
    }

    const newRestriction: IPRestriction = {
      id: Date.now().toString(),
      type: newIPRestriction.type,
      ipAddress: newIPRestriction.ipAddress,
      ipRange: newIPRestriction.ipRange,
      description: newIPRestriction.description,
      country: newIPRestriction.country,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user@company.com'
    };

    setIpRestrictions([...ipRestrictions, newRestriction]);
    setNewIPRestriction({
      type: 'whitelist',
      ipAddress: '',
      ipRange: '',
      description: '',
      country: ''
    });
    setShowAddIPModal(false);
  };

  const handleRemoveIPRestriction = (id: string) => {
    setIpRestrictions(ipRestrictions.filter(ip => ip.id !== id));
  };

  const handleGenerateBackupCodes = () => {
    const codes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    setBackupCodes(codes);
    setTwoFactorSettings({
      ...twoFactorSettings,
      backupCodesGenerated: true,
      backupCodesCount: codes.length
    });
    setShowBackupCodes(true);
  };

  const handleRevokeDevice = (id: string) => {
    setTrustedDevices(trustedDevices.map(device =>
      device.id === id ? { ...device, trusted: false } : device
    ));
  };

  const handleResolveSecurityEvent = (id: string) => {
    setSecurityEvents(securityEvents.map(event =>
      event.id === id ? { ...event, resolved: true } : event
    ));
  };

  const exportSecurityReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      securityScore: calculateSecurityScore(),
      passwordPolicy,
      twoFactorSettings,
      ipRestrictions,
      sessionSettings,
      securityEvents: securityEvents.filter(e => !e.resolved),
      trustedDevices: trustedDevices.filter(d => d.trusted).length
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-report-${Date.now()}.json`;
    link.click();
  };

  const securityScore = calculateSecurityScore();
  const passwordStrength = calculatePasswordStrength();

  const tabs = [
    { id: 'password', label: 'Password Policies', icon: Lock },
    { id: '2fa', label: '2FA Settings', icon: Smartphone },
    { id: 'ip', label: 'IP Restrictions', icon: Globe },
    { id: 'devices', label: 'Device Management', icon: Monitor },
    { id: 'monitoring', label: 'Security Monitoring', icon: Activity }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Security Policies</h1>
              <p className="text-gray-600 mt-1">Enterprise-grade security configuration and monitoring</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportSecurityReport}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Security Score */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Overall Security Score</h3>
              <p className="text-sm text-gray-600">Real-time assessment of your security posture</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">{securityScore}%</div>
              <div className="text-sm text-gray-600 mt-1">
                {securityScore >= 90 ? 'Excellent' : securityScore >= 70 ? 'Good' : securityScore >= 50 ? 'Fair' : 'Needs Improvement'}
              </div>
            </div>
          </div>
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
                securityScore >= 90 ? 'bg-green-500' :
                securityScore >= 70 ? 'bg-blue-500' :
                securityScore >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${securityScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Save Success Message */}
      {saveSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800 font-medium">Settings saved successfully!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600 -mb-px'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Password Policies Tab */}
        {activeTab === 'password' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password Policy Configuration</h2>
              <p className="text-gray-600">Define password requirements and account lockout rules</p>
            </div>

            {/* Password Strength Indicator */}
            <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Current Policy Strength</h3>
                <span className="text-2xl font-bold text-blue-600">{passwordStrength}%</span>
              </div>
              <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password Length */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  min="6"
                  max="128"
                  value={passwordPolicy.minLength}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, minLength: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 12 or more characters</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Maximum Password Length
                </label>
                <input
                  type="number"
                  min="8"
                  max="256"
                  value={passwordPolicy.maxLength}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, maxLength: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Character Requirements */}
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Character Requirements</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={passwordPolicy.requireUppercase}
                      onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireUppercase: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Require Uppercase Letters (A-Z)</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={passwordPolicy.requireLowercase}
                      onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireLowercase: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Require Lowercase Letters (a-z)</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={passwordPolicy.requireNumbers}
                      onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireNumbers: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Require Numbers (0-9)</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={passwordPolicy.requireSpecialChars}
                      onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireSpecialChars: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Require Special Characters (!@#$%)</span>
                  </label>
                </div>
              </div>

              {/* Password History */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password History Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={passwordPolicy.historyCount}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, historyCount: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Prevent reuse of last N passwords</p>
              </div>

              {/* Password Expiry */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password Expiry (days)
                </label>
                <select
                  value={passwordPolicy.expiryDays}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, expiryDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0}>Never</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>180 days</option>
                </select>
              </div>

              {/* Account Lockout */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Login Attempts
                </label>
                <select
                  value={passwordPolicy.maxLoginAttempts}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, maxLoginAttempts: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={3}>3 attempts</option>
                  <option value={5}>5 attempts</option>
                  <option value={10}>10 attempts</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lockout Duration
                </label>
                <select
                  value={passwordPolicy.lockoutDuration}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, lockoutDuration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={-1}>Permanent (admin unlock required)</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSavePasswordPolicy}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{loading ? 'Saving...' : 'Save Password Policy'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2FA Settings Tab */}
        {activeTab === '2fa' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
              <p className="text-gray-600">Configure multi-factor authentication for enhanced security</p>
            </div>

            <div className="space-y-6">
              {/* Enable 2FA */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                      <Smartphone className="h-5 w-5 text-blue-600" />
                      <span>Enable Two-Factor Authentication</span>
                    </h3>
                    <p className="text-sm text-gray-600">
                      Require users to provide a second form of authentication in addition to their password
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={twoFactorSettings.enabled}
                      onChange={(e) => setTwoFactorSettings({ ...twoFactorSettings, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {twoFactorSettings.enabled && (
                <>
                  {/* Enforcement Mode */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Enforcement Mode
                    </label>
                    <select
                      value={twoFactorSettings.enforcementMode}
                      onChange={(e) => setTwoFactorSettings({ ...twoFactorSettings, enforcementMode: e.target.value as any })}
                      className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="optional">Optional (users can enable)</option>
                      <option value="required">Required for all users</option>
                      <option value="admin_only">Required for admins only</option>
                    </select>
                  </div>

                  {/* Authentication Methods */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Authentication Methods</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="h-5 w-5 text-gray-600" />
                          <div>
                            <div className="font-medium text-gray-900">SMS Authentication</div>
                            <div className="text-sm text-gray-600">Send verification codes via SMS</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={twoFactorSettings.smsEnabled}
                          onChange={(e) => setTwoFactorSettings({ ...twoFactorSettings, smsEnabled: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Key className="h-5 w-5 text-gray-600" />
                          <div>
                            <div className="font-medium text-gray-900">Authenticator App</div>
                            <div className="text-sm text-gray-600">Google Authenticator, Authy, or similar apps</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={twoFactorSettings.authenticatorEnabled}
                          onChange={(e) => setTwoFactorSettings({ ...twoFactorSettings, authenticatorEnabled: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Backup Codes */}
                  <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Backup Recovery Codes</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Generate one-time backup codes for account recovery if 2FA is unavailable
                        </p>
                        {twoFactorSettings.backupCodesGenerated && (
                          <div className="flex items-center space-x-2 text-sm text-green-700">
                            <CheckCircle className="h-4 w-4" />
                            <span>{twoFactorSettings.backupCodesCount} backup codes generated</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleGenerateBackupCodes}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-2 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Generate Codes</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave2FASettings}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{loading ? 'Saving...' : 'Save 2FA Settings'}</span>
              </button>
            </div>
          </div>
        )}

        {/* IP Restrictions Tab */}
        {activeTab === 'ip' && (
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">IP Restrictions & Network Security</h2>
                <p className="text-gray-600">Control access based on IP addresses and geographic locations</p>
              </div>
              <button
                onClick={() => setShowAddIPModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add IP Restriction</span>
              </button>
            </div>

            {/* IP Restrictions List */}
            <div className="space-y-3">
              {ipRestrictions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Globe className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No IP restrictions configured</p>
                  <p className="text-sm text-gray-500 mt-1">Add whitelist or blacklist rules to control access</p>
                </div>
              ) : (
                ipRestrictions.map((restriction) => (
                  <div
                    key={restriction.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          restriction.type === 'whitelist'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {restriction.type === 'whitelist' ? 'Whitelist' : 'Blacklist'}
                        </span>
                        <span className="font-mono font-semibold text-gray-900">{restriction.ipAddress}</span>
                      </div>
                      <p className="text-sm text-gray-600">{restriction.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Added by {restriction.createdBy}</span>
                        <span>•</span>
                        <span>{new Date(restriction.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveIPRestriction(restriction.id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Device Management Tab */}
        {activeTab === 'devices' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Device & Session Management</h2>
              <p className="text-gray-600">Monitor and manage trusted devices and active sessions</p>
            </div>

            {/* Session Settings */}
            <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Session Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Idle Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={sessionSettings.idleTimeout}
                    onChange={(e) => setSessionSettings({ ...sessionSettings, idleTimeout: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Absolute Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="1440"
                    value={sessionSettings.absoluteTimeout}
                    onChange={(e) => setSessionSettings({ ...sessionSettings, absoluteTimeout: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Concurrent Sessions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={sessionSettings.maxConcurrentSessions}
                    onChange={(e) => setSessionSettings({ ...sessionSettings, maxConcurrentSessions: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="forceLogout"
                    checked={sessionSettings.forceLogoutOnPasswordChange}
                    onChange={(e) => setSessionSettings({ ...sessionSettings, forceLogoutOnPasswordChange: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="forceLogout" className="text-sm text-gray-700">
                    Force logout on password change
                  </label>
                </div>
              </div>
            </div>

            {/* Trusted Devices */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Trusted Devices</h3>
              <div className="space-y-3">
                {trustedDevices.map((device) => (
                  <div
                    key={device.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      device.trusted
                        ? 'bg-white border-gray-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        device.trusted ? 'bg-blue-100' : 'bg-red-100'
                      }`}>
                        <Monitor className={`h-6 w-6 ${device.trusted ? 'text-blue-600' : 'text-red-600'}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{device.deviceName}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>{device.browser} • {device.os}</div>
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{device.location}</span>
                            </span>
                            <span>•</span>
                            <span>{device.ipAddress}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Last used: {new Date(device.lastUsed).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {device.trusted ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <button
                            onClick={() => handleRevokeDevice(device.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Revoke
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-red-600 font-medium">Revoked</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Security Monitoring & Alerts</h2>
              <p className="text-gray-600">Real-time security events and suspicious activity detection</p>
            </div>

            {/* Security Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">
                    {securityEvents.filter(e => !e.resolved).length}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-700">Active Alerts</div>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">
                    {securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-700">High Priority</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    {trustedDevices.filter(d => d.trusted).length}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-700">Trusted Devices</div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-2xl font-bold text-yellow-600">24h</span>
                </div>
                <div className="text-sm font-medium text-gray-700">Monitoring Window</div>
              </div>
            </div>

            {/* Security Events */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Recent Security Events</h3>
              <div className="space-y-3">
                {securityEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-start justify-between p-4 rounded-lg border ${
                      event.resolved
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : event.severity === 'critical'
                        ? 'bg-red-50 border-red-200'
                        : event.severity === 'high'
                        ? 'bg-orange-50 border-orange-200'
                        : event.severity === 'medium'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          event.severity === 'critical' ? 'bg-red-600 text-white' :
                          event.severity === 'high' ? 'bg-orange-600 text-white' :
                          event.severity === 'medium' ? 'bg-yellow-600 text-white' :
                          'bg-blue-600 text-white'
                        }`}>
                          {event.severity.toUpperCase()}
                        </span>
                        <span className="font-semibold text-gray-900">{event.userName || 'System'}</span>
                        {event.resolved && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 mb-2">{event.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        {event.ipAddress && (
                          <span className="flex items-center space-x-1">
                            <Globe className="h-3 w-3" />
                            <span>{event.ipAddress}</span>
                          </span>
                        )}
                        {event.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    {!event.resolved && (
                      <button
                        onClick={() => handleResolveSecurityEvent(event.id)}
                        className="ml-4 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add IP Restriction Modal */}
      {showAddIPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Add IP Restriction</h3>
              <button
                onClick={() => setShowAddIPModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Restriction Type
                </label>
                <select
                  value={newIPRestriction.type}
                  onChange={(e) => setNewIPRestriction({ ...newIPRestriction, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="whitelist">Whitelist (Allow only)</option>
                  <option value="blacklist">Blacklist (Block)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  IP Address *
                </label>
                <input
                  type="text"
                  value={newIPRestriction.ipAddress}
                  onChange={(e) => setNewIPRestriction({ ...newIPRestriction, ipAddress: e.target.value })}
                  placeholder="192.168.1.1 or 192.168.1.0/24"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newIPRestriction.description}
                  onChange={(e) => setNewIPRestriction({ ...newIPRestriction, description: e.target.value })}
                  placeholder="e.g., Office Network, VPN Gateway"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Country (Optional)
                </label>
                <input
                  type="text"
                  value={newIPRestriction.country}
                  onChange={(e) => setNewIPRestriction({ ...newIPRestriction, country: e.target.value })}
                  placeholder="e.g., United States"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddIPModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIPRestriction}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Restriction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Backup Recovery Codes</h3>
              <button
                onClick={() => setShowBackupCodes(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Important</p>
                    <p>Save these codes securely. Each code can only be used once for account recovery.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 bg-gray-100 rounded border border-gray-300 font-mono text-sm text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const codesText = backupCodes.join('\n');
                  navigator.clipboard.writeText(codesText);
                  alert('Backup codes copied to clipboard!');
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy All Codes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityPolicies;
