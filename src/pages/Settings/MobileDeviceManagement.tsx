import React, { useState } from 'react';
import {
  Smartphone, Tablet, Monitor, Shield, Lock, Wifi, Battery, Signal,
  CheckCircle, XCircle, AlertTriangle, Clock, MapPin, Download, Upload,
  Settings, Eye, Edit, Trash2, RefreshCw, Search, Filter, Plus, X,
  Power, Zap, Globe, Bell, Activity, BarChart, TrendingUp, Users,
  Key, Database, FileText, Save, Play, Pause, RotateCcw, QrCode
} from 'lucide-react';

interface MobileDevice {
  id: string;
  deviceName: string;
  deviceType: 'smartphone' | 'tablet' | 'desktop';
  os: string;
  osVersion: string;
  appVersion: string;
  userId: string;
  userName: string;
  status: 'active' | 'inactive' | 'compromised' | 'pending';
  lastSync: string;
  enrollmentDate: string;
  category: 'corporate' | 'personal' | 'byod';
  compliance: {
    encrypted: boolean;
    screenLock: boolean;
    upToDate: boolean;
    vpnConfigured: boolean;
  };
  battery?: number;
  storage?: {
    used: number;
    total: number;
  };
  location?: string;
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  settings: {
    minPinLength?: number;
    biometricRequired?: boolean;
    encryptionRequired?: boolean;
    screenLockTimeout?: number;
    vpnRequired?: boolean;
    jailbreakDetection?: boolean;
  };
  assignedDevices: number;
}

interface PWAConfig {
  appName: string;
  version: string;
  deploymentStatus: 'live' | 'staging' | 'development';
  lastDeployed: string;
  activeUsers: number;
  installCount: number;
  performance: {
    avgLoadTime: number;
    crashRate: number;
    offlineSupport: boolean;
  };
}

const MobileDeviceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'devices' | 'policies' | 'pwa' | 'analytics'>('devices');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const [devices, setDevices] = useState<MobileDevice[]>([
    {
      id: '1',
      deviceName: 'iPhone 15 Pro',
      deviceType: 'smartphone',
      os: 'iOS',
      osVersion: '17.2.1',
      appVersion: '2.5.0',
      userId: 'user_123',
      userName: 'John Smith',
      status: 'active',
      lastSync: '2024-01-21T15:45:00Z',
      enrollmentDate: '2024-01-01T00:00:00Z',
      category: 'corporate',
      compliance: {
        encrypted: true,
        screenLock: true,
        upToDate: true,
        vpnConfigured: true
      },
      battery: 87,
      storage: { used: 45, total: 128 },
      location: 'New York, USA'
    },
    {
      id: '2',
      deviceName: 'Samsung Galaxy S24',
      deviceType: 'smartphone',
      os: 'Android',
      osVersion: '14.0',
      appVersion: '2.5.0',
      userId: 'user_456',
      userName: 'Sarah Johnson',
      status: 'active',
      lastSync: '2024-01-21T15:30:00Z',
      enrollmentDate: '2024-01-10T00:00:00Z',
      category: 'byod',
      compliance: {
        encrypted: true,
        screenLock: true,
        upToDate: true,
        vpnConfigured: false
      },
      battery: 62,
      storage: { used: 89, total: 256 },
      location: 'San Francisco, USA'
    },
    {
      id: '3',
      deviceName: 'iPad Pro 12.9"',
      deviceType: 'tablet',
      os: 'iPadOS',
      osVersion: '17.2',
      appVersion: '2.4.8',
      userId: 'user_789',
      userName: 'David Brown',
      status: 'pending',
      lastSync: '2024-01-21T12:00:00Z',
      enrollmentDate: '2024-01-20T00:00:00Z',
      category: 'personal',
      compliance: {
        encrypted: true,
        screenLock: true,
        upToDate: false,
        vpnConfigured: false
      },
      battery: 45,
      storage: { used: 156, total: 512 },
      location: 'London, UK'
    },
    {
      id: '4',
      deviceName: 'OnePlus 12',
      deviceType: 'smartphone',
      os: 'Android',
      osVersion: '13.0',
      appVersion: '2.3.5',
      userId: 'user_012',
      userName: 'Mike Chen',
      status: 'compromised',
      lastSync: '2024-01-19T18:00:00Z',
      enrollmentDate: '2023-12-15T00:00:00Z',
      category: 'byod',
      compliance: {
        encrypted: false,
        screenLock: false,
        upToDate: false,
        vpnConfigured: false
      },
      battery: 23,
      storage: { used: 112, total: 128 },
      location: 'Tokyo, Japan'
    }
  ]);

  const [securityPolicies] = useState<SecurityPolicy[]>([
    {
      id: '1',
      name: 'Enterprise Standard',
      description: 'Standard security policy for corporate-owned devices',
      enabled: true,
      settings: {
        minPinLength: 6,
        biometricRequired: true,
        encryptionRequired: true,
        screenLockTimeout: 5,
        vpnRequired: true,
        jailbreakDetection: true
      },
      assignedDevices: 45
    },
    {
      id: '2',
      name: 'BYOD Basic',
      description: 'Basic security requirements for personal devices',
      enabled: true,
      settings: {
        minPinLength: 4,
        biometricRequired: false,
        encryptionRequired: true,
        screenLockTimeout: 10,
        vpnRequired: false,
        jailbreakDetection: true
      },
      assignedDevices: 23
    },
    {
      id: '3',
      name: 'Executive Level',
      description: 'Enhanced security for executive team members',
      enabled: true,
      settings: {
        minPinLength: 8,
        biometricRequired: true,
        encryptionRequired: true,
        screenLockTimeout: 2,
        vpnRequired: true,
        jailbreakDetection: true
      },
      assignedDevices: 8
    }
  ]);

  const [pwaConfig] = useState<PWAConfig>({
    appName: 'BMI CRM Mobile',
    version: '2.5.0',
    deploymentStatus: 'live',
    lastDeployed: '2024-01-15T00:00:00Z',
    activeUsers: 1247,
    installCount: 3856,
    performance: {
      avgLoadTime: 1.2,
      crashRate: 0.08,
      offlineSupport: true
    }
  });

  const tabs = [
    { id: 'devices', label: 'Device Inventory', icon: Smartphone },
    { id: 'policies', label: 'Security Policies', icon: Shield },
    { id: 'pwa', label: 'PWA Administration', icon: Globe },
    { id: 'analytics', label: 'Mobile Analytics', icon: BarChart }
  ];

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'smartphone': return Smartphone;
      case 'tablet': return Tablet;
      case 'desktop': return Monitor;
      default: return Smartphone;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'gray';
      case 'compromised': return 'red';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'corporate': return 'blue';
      case 'personal': return 'purple';
      case 'byod': return 'orange';
      default: return 'gray';
    }
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || device.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const complianceScore = Math.round(
    (devices.filter(d =>
      d.compliance.encrypted &&
      d.compliance.screenLock &&
      d.compliance.upToDate
    ).length / devices.length) * 100
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mobile Device Management</h1>
              <p className="text-gray-600 mt-1">Manage mobile devices, policies, and security settings</p>
            </div>
          </div>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Enroll Device</span>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{devices.length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Total Devices</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {devices.filter(d => d.status === 'active').length}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active Devices</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{complianceScore}%</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Compliance Rate</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                {devices.filter(d => d.status === 'compromised' || d.status === 'pending').length}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Needs Attention</div>
          </div>

          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-teal-600" />
              <span className="text-2xl font-bold text-teal-600">{pwaConfig.activeUsers}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active Users</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all whitespace-nowrap ${
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
        {/* Device Inventory Tab */}
        {activeTab === 'devices' && (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Registered Devices</h2>
                <div className="flex space-x-2">
                  <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2 text-sm">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                  <button className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2 text-sm">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search devices or users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="compromised">Compromised</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredDevices.map(device => {
                const DeviceIcon = getDeviceIcon(device.deviceType);
                const statusColor = getStatusColor(device.status);
                const categoryColor = getCategoryColor(device.category);

                return (
                  <div key={device.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`w-14 h-14 bg-${statusColor}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <DeviceIcon className={`h-7 w-7 text-${statusColor}-600`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{device.deviceName}</h3>
                            <span className={`px-3 py-1 bg-${statusColor}-100 text-${statusColor}-800 rounded-full text-xs font-semibold uppercase`}>
                              {device.status}
                            </span>
                            <span className={`px-3 py-1 bg-${categoryColor}-100 text-${categoryColor}-800 rounded-full text-xs font-semibold capitalize`}>
                              {device.category}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            {device.userName} • {device.os} {device.osVersion} • App v{device.appVersion}
                          </div>

                          <div className="grid grid-cols-5 gap-4 mb-3">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-xs text-gray-600">Last Sync</div>
                                <div className="text-sm font-medium text-gray-900">
                                  {new Date(device.lastSync).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                            {device.battery && (
                              <div className="flex items-center space-x-2">
                                <Battery className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="text-xs text-gray-600">Battery</div>
                                  <div className="text-sm font-medium text-gray-900">{device.battery}%</div>
                                </div>
                              </div>
                            )}
                            {device.storage && (
                              <div className="flex items-center space-x-2">
                                <Database className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="text-xs text-gray-600">Storage</div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {device.storage.used}/{device.storage.total}GB
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-xs text-gray-600">Location</div>
                                <div className="text-sm font-medium text-gray-900">{device.location}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Signal className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-xs text-gray-600">Enrolled</div>
                                <div className="text-sm font-medium text-gray-900">
                                  {new Date(device.enrollmentDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Compliance Status */}
                          <div className="border-t border-gray-200 pt-3">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Compliance Status:</div>
                            <div className="flex flex-wrap gap-2">
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${
                                device.compliance.encrypted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {device.compliance.encrypted ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                <span className="text-xs font-medium">Encrypted</span>
                              </div>
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${
                                device.compliance.screenLock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {device.compliance.screenLock ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                <span className="text-xs font-medium">Screen Lock</span>
                              </div>
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${
                                device.compliance.upToDate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {device.compliance.upToDate ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                <span className="text-xs font-medium">Up to Date</span>
                              </div>
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${
                                device.compliance.vpnConfigured ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {device.compliance.vpnConfigured ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                <span className="text-xs font-medium">VPN</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Sync">
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Lock">
                          <Lock className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Wipe">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Security Policies Tab */}
        {activeTab === 'policies' && (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Mobile Security Policies</h2>
                  <p className="text-gray-600">Configure security requirements for mobile devices</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Policy</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {securityPolicies.map(policy => (
                <div key={policy.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{policy.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          policy.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {policy.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{policy.description}</p>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">PIN Length</div>
                          <div className="text-lg font-bold text-gray-900">{policy.settings.minPinLength} digits</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Screen Lock</div>
                          <div className="text-lg font-bold text-gray-900">{policy.settings.screenLockTimeout} min</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Assigned Devices</div>
                          <div className="text-lg font-bold text-blue-600">{policy.assignedDevices}</div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Security Features:</div>
                        <div className="flex flex-wrap gap-2">
                          {policy.settings.biometricRequired && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              Biometric Auth
                            </span>
                          )}
                          {policy.settings.encryptionRequired && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                              Encryption Required
                            </span>
                          )}
                          {policy.settings.vpnRequired && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                              VPN Required
                            </span>
                          )}
                          {policy.settings.jailbreakDetection && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                              Jailbreak Detection
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PWA Administration Tab */}
        {activeTab === 'pwa' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Progressive Web App Administration</h2>
              <p className="text-gray-600">Manage PWA deployment, configuration, and performance</p>
            </div>

            {/* App Status Overview */}
            <div className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pwaConfig.appName}</h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">Version: <span className="font-semibold">{pwaConfig.version}</span></span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                      pwaConfig.deploymentStatus === 'live' ? 'bg-green-100 text-green-800' :
                      pwaConfig.deploymentStatus === 'staging' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {pwaConfig.deploymentStatus}
                    </span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Deploy Update</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <Users className="h-6 w-6 text-blue-600 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{pwaConfig.activeUsers.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <Download className="h-6 w-6 text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{pwaConfig.installCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Installs</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <Zap className="h-6 w-6 text-orange-600 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{pwaConfig.performance.avgLoadTime}s</div>
                  <div className="text-sm text-gray-600">Avg Load Time</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <Activity className="h-6 w-6 text-purple-600 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{pwaConfig.performance.crashRate}%</div>
                  <div className="text-sm text-gray-600">Crash Rate</div>
                </div>
              </div>
            </div>

            {/* PWA Configuration Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">App Manifest</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Display Mode:</span>
                    <span className="font-semibold text-gray-900">Standalone</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Theme Color:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-600 rounded"></div>
                      <span className="font-semibold text-gray-900">#2563eb</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orientation:</span>
                    <span className="font-semibold text-gray-900">Portrait</span>
                  </div>
                  <button className="w-full mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                    Edit Manifest
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Bell className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      Enabled
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subscribers:</span>
                    <span className="font-semibold text-gray-900">892</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Notifications:</span>
                    <span className="font-semibold text-gray-900">156</span>
                  </div>
                  <button className="w-full mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                    Configure Notifications
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Database className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Offline Support</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cache Strategy:</span>
                    <span className="font-semibold text-gray-900">Network First</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cached Assets:</span>
                    <span className="font-semibold text-gray-900">142 files</span>
                  </div>
                  <button className="w-full mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                    Manage Cache
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Performance</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lighthouse Score:</span>
                    <span className="font-semibold text-green-600">94/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">First Contentful Paint:</span>
                    <span className="font-semibold text-gray-900">0.8s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time to Interactive:</span>
                    <span className="font-semibold text-gray-900">1.9s</span>
                  </div>
                  <button className="w-full mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                    View Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Mobile Analytics & Monitoring</h2>
              <p className="text-gray-600">Track device usage, performance, and security metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Device Distribution */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Device Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">iOS Devices</span>
                      <span className="text-sm font-bold text-gray-900">50%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Android Devices</span>
                      <span className="text-sm font-bold text-gray-900">50%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Device Categories</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Corporate</span>
                      <span className="text-sm font-bold text-gray-900">25%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">BYOD</span>
                      <span className="text-sm font-bold text-gray-900">50%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Personal</span>
                      <span className="text-sm font-bold text-gray-900">25%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* App Usage Stats */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">App Usage Statistics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Daily Active Users</div>
                      <div className="text-2xl font-bold text-gray-900">847</div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Avg Session Duration</div>
                      <div className="text-2xl font-bold text-gray-900">12.5 min</div>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Data Synced Today</div>
                      <div className="text-2xl font-bold text-gray-900">2.3 GB</div>
                    </div>
                    <RefreshCw className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Security Incidents */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Security Incidents</h3>
                <div className="space-y-3">
                  {[
                    { type: 'Failed Login Attempts', count: 3, severity: 'low' },
                    { type: 'Jailbreak Detected', count: 1, severity: 'high' },
                    { type: 'Policy Violations', count: 2, severity: 'medium' },
                    { type: 'Unauthorized Access', count: 0, severity: 'critical' }
                  ].map((incident, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className={`h-5 w-5 ${
                          incident.severity === 'critical' ? 'text-red-600' :
                          incident.severity === 'high' ? 'text-orange-600' :
                          incident.severity === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                        <span className="text-sm font-medium text-gray-900">{incident.type}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        incident.count > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {incident.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Device Enrollment Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Enroll New Device</h3>
              <button onClick={() => setShowEnrollModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto flex items-center justify-center mb-4">
                  <QrCode className="h-32 w-32 text-gray-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Scan QR Code to Enroll</h4>
                <p className="text-gray-600">
                  Open the BMI CRM Mobile app and scan this QR code to register your device
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <strong>Manual Enrollment:</strong> You can also enroll by entering the device code
                    <code className="block mt-2 px-3 py-2 bg-white rounded border border-blue-300 font-mono text-sm">
                      BMI-ENROLL-X7K9-2M4N
                    </code>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowEnrollModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Email Instructions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileDeviceManagement;
