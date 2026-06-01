import React, { useState } from 'react';
import {
  Shield, AlertTriangle, Globe, Smartphone, Lock, Eye, Activity, FileText,
  Search, Filter, Download, Upload, RefreshCw, CheckCircle, XCircle, Clock,
  MapPin, Wifi, Key, User, Database, Settings, TrendingUp, BarChart, Target,
  Zap, AlertCircle, Info, Play, Pause, Trash2, Edit, Plus, X, Save, Bell,
  Fingerprint, Cpu, Monitor, HardDrive, Chrome, Server, GitBranch, Users
} from 'lucide-react';

interface ThreatEvent {
  id: string;
  type: 'login_attempt' | 'suspicious_ip' | 'data_access' | 'policy_violation' | 'malware_detected';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source: string;
  ipAddress: string;
  location: string;
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  userId?: string;
}

interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  trustScore: number;
  status: 'trusted' | 'monitored' | 'blocked';
  lastAccess: string;
  ipAddress: string;
  location: string;
  userId: string;
  userName: string;
  compliance: {
    osVersion: boolean;
    securityPatches: boolean;
    encryption: boolean;
    antivirus: boolean;
  };
}

interface IPRule {
  id: string;
  type: 'whitelist' | 'blacklist' | 'geo_block';
  ipAddress?: string;
  cidrRange?: string;
  country?: string;
  reason: string;
  createdAt: string;
  enabled: boolean;
  hitCount: number;
}

interface ComplianceRequirement {
  id: string;
  framework: 'GDPR' | 'HIPAA' | 'SOX' | 'PCI-DSS';
  category: string;
  requirement: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  lastAudited: string;
  evidence: string[];
  responsible: string;
}

const AdvancedSecurity: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'threats' | 'devices' | 'network' | 'compliance' | 'audit'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const [threatEvents, setThreatEvents] = useState<ThreatEvent[]>([
    {
      id: '1',
      type: 'login_attempt',
      severity: 'critical',
      title: 'Multiple Failed Login Attempts',
      description: 'Brute force attack detected from suspicious IP address',
      source: 'Authentication System',
      ipAddress: '192.168.100.45',
      location: 'Unknown (VPN detected)',
      timestamp: '2024-01-21T15:30:00Z',
      status: 'active',
      userId: 'unknown'
    },
    {
      id: '2',
      type: 'suspicious_ip',
      severity: 'high',
      title: 'Access from High-Risk Country',
      description: 'Login attempt from geo-blocked region detected',
      source: 'Network Monitor',
      ipAddress: '203.0.113.45',
      location: 'Eastern Europe',
      timestamp: '2024-01-21T14:15:00Z',
      status: 'investigating',
      userId: 'user_123'
    },
    {
      id: '3',
      type: 'data_access',
      severity: 'high',
      title: 'Unusual Data Export Volume',
      description: 'User exported 10,000+ records outside normal pattern',
      source: 'DLP System',
      ipAddress: '10.0.0.125',
      location: 'Corporate Network',
      timestamp: '2024-01-21T13:00:00Z',
      status: 'investigating',
      userId: 'user_456'
    },
    {
      id: '4',
      type: 'policy_violation',
      severity: 'medium',
      title: 'Password Policy Violation',
      description: 'User attempted to set weak password',
      source: 'Policy Engine',
      ipAddress: '10.0.0.89',
      location: 'Office - New York',
      timestamp: '2024-01-21T12:30:00Z',
      status: 'resolved',
      userId: 'user_789'
    }
  ]);

  const [devices, setDevices] = useState<DeviceInfo[]>([
    {
      id: '1',
      name: 'MacBook Pro',
      type: 'desktop',
      os: 'macOS 14.2',
      browser: 'Chrome 120.0',
      trustScore: 95,
      status: 'trusted',
      lastAccess: '2024-01-21T15:45:00Z',
      ipAddress: '10.0.0.125',
      location: 'New York, USA',
      userId: 'user_123',
      userName: 'John Smith',
      compliance: {
        osVersion: true,
        securityPatches: true,
        encryption: true,
        antivirus: true
      }
    },
    {
      id: '2',
      name: 'iPhone 15 Pro',
      type: 'mobile',
      os: 'iOS 17.2',
      browser: 'Safari 17.0',
      trustScore: 88,
      status: 'trusted',
      lastAccess: '2024-01-21T14:30:00Z',
      ipAddress: '172.16.0.45',
      location: 'San Francisco, USA',
      userId: 'user_456',
      userName: 'Sarah Johnson',
      compliance: {
        osVersion: true,
        securityPatches: true,
        encryption: true,
        antivirus: false
      }
    },
    {
      id: '3',
      name: 'Windows Desktop',
      type: 'desktop',
      os: 'Windows 10',
      browser: 'Edge 119.0',
      trustScore: 62,
      status: 'monitored',
      lastAccess: '2024-01-21T11:00:00Z',
      ipAddress: '192.168.1.88',
      location: 'London, UK',
      userId: 'user_789',
      userName: 'David Brown',
      compliance: {
        osVersion: false,
        securityPatches: false,
        encryption: true,
        antivirus: true
      }
    }
  ]);

  const [ipRules, setIpRules] = useState<IPRule[]>([
    {
      id: '1',
      type: 'geo_block',
      country: 'North Korea',
      reason: 'High-risk country - regulatory requirement',
      createdAt: '2024-01-01T00:00:00Z',
      enabled: true,
      hitCount: 45
    },
    {
      id: '2',
      type: 'blacklist',
      ipAddress: '192.168.100.45',
      reason: 'Brute force attack source',
      createdAt: '2024-01-21T15:30:00Z',
      enabled: true,
      hitCount: 127
    },
    {
      id: '3',
      type: 'whitelist',
      cidrRange: '10.0.0.0/8',
      reason: 'Corporate network range',
      createdAt: '2024-01-01T00:00:00Z',
      enabled: true,
      hitCount: 15234
    },
    {
      id: '4',
      type: 'geo_block',
      country: 'Russia',
      reason: 'Elevated threat level',
      createdAt: '2024-01-15T00:00:00Z',
      enabled: true,
      hitCount: 89
    }
  ]);

  const [complianceRequirements] = useState<ComplianceRequirement[]>([
    {
      id: '1',
      framework: 'GDPR',
      category: 'Data Protection',
      requirement: 'Right to erasure implementation',
      status: 'compliant',
      lastAudited: '2024-01-15T00:00:00Z',
      evidence: ['deletion-workflow.pdf', 'audit-log-export.csv'],
      responsible: 'Data Protection Officer'
    },
    {
      id: '2',
      framework: 'GDPR',
      category: 'Consent Management',
      requirement: 'Explicit consent collection and tracking',
      status: 'compliant',
      lastAudited: '2024-01-10T00:00:00Z',
      evidence: ['consent-forms.pdf', 'tracking-system.docx'],
      responsible: 'Legal Team'
    },
    {
      id: '3',
      framework: 'HIPAA',
      category: 'Access Control',
      requirement: 'Unique user identification',
      status: 'compliant',
      lastAudited: '2024-01-18T00:00:00Z',
      evidence: ['user-management-policy.pdf'],
      responsible: 'Security Team'
    },
    {
      id: '4',
      framework: 'SOX',
      category: 'Audit Trail',
      requirement: 'Immutable audit logs for financial data',
      status: 'partial',
      lastAudited: '2024-01-12T00:00:00Z',
      evidence: ['audit-implementation.pdf'],
      responsible: 'IT Audit'
    },
    {
      id: '5',
      framework: 'HIPAA',
      category: 'Encryption',
      requirement: 'Data encryption at rest and in transit',
      status: 'compliant',
      lastAudited: '2024-01-20T00:00:00Z',
      evidence: ['encryption-policy.pdf', 'ssl-certificate.pem'],
      responsible: 'Infrastructure Team'
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'login_attempt': return Lock;
      case 'suspicious_ip': return MapPin;
      case 'data_access': return Database;
      case 'policy_violation': return AlertTriangle;
      case 'malware_detected': return Shield;
      default: return AlertCircle;
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop': return Monitor;
      case 'mobile': return Smartphone;
      case 'tablet': return Smartphone;
      default: return Monitor;
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'green';
      case 'partial': return 'yellow';
      case 'non_compliant': return 'red';
      case 'not_applicable': return 'gray';
      default: return 'gray';
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Security Dashboard', icon: Shield },
    { id: 'threats', label: 'Threat Monitor', icon: AlertTriangle },
    { id: 'devices', label: 'Device Management', icon: Smartphone },
    { id: 'network', label: 'Network Security', icon: Globe },
    { id: 'compliance', label: 'Compliance', icon: FileText },
    { id: 'audit', label: 'Advanced Audit', icon: Eye }
  ];

  const securityScore = 87;
  const activeThreats = threatEvents.filter(t => t.status === 'active').length;
  const trustedDevices = devices.filter(d => d.status === 'trusted').length;
  const complianceRate = Math.round(
    (complianceRequirements.filter(r => r.status === 'compliant').length /
    complianceRequirements.length) * 100
  );

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
              <h1 className="text-3xl font-bold text-gray-900">Advanced Security</h1>
              <p className="text-gray-600 mt-1">Enterprise threat protection and compliance management</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{securityScore}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Security Score</div>
            <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${securityScore}%` }} />
            </div>
          </div>

          <div className={`rounded-lg p-4 border ${
            activeThreats > 0 ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className={`h-5 w-5 ${activeThreats > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <span className={`text-2xl font-bold ${activeThreats > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {activeThreats}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active Threats</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{trustedDevices}/{devices.length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Trusted Devices</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Globe className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{ipRules.filter(r => r.enabled).length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active IP Rules</div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4 border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-5 w-5 text-teal-600" />
              <span className="text-2xl font-bold text-teal-600">{complianceRate}%</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Compliance Rate</div>
            <div className="w-full bg-teal-200 rounded-full h-1.5 mt-2">
              <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${complianceRate}%` }} />
            </div>
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
        {/* Security Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Security Command Center</h2>
              <p className="text-gray-600">Real-time security monitoring and threat intelligence</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Threats */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Recent Security Events</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
                </div>
                <div className="space-y-3">
                  {threatEvents.slice(0, 4).map(threat => {
                    const Icon = getThreatIcon(threat.type);
                    const severityColor = getSeverityColor(threat.severity);
                    return (
                      <div key={threat.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className={`w-10 h-10 bg-${severityColor}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-5 w-5 text-${severityColor}-600`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-sm font-semibold text-gray-900">{threat.title}</h4>
                            <span className={`px-2 py-0.5 bg-${severityColor}-100 text-${severityColor}-800 rounded-full text-xs font-semibold uppercase ml-2 flex-shrink-0`}>
                              {threat.severity}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{threat.description}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span>{threat.location}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{new Date(threat.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Device Trust Status */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Device Trust Status</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Manage</button>
                </div>
                <div className="space-y-3">
                  {devices.map(device => {
                    const Icon = getDeviceIcon(device.type);
                    return (
                      <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            device.status === 'trusted' ? 'bg-green-100' :
                            device.status === 'monitored' ? 'bg-yellow-100' :
                            'bg-red-100'
                          }`}>
                            <Icon className={`h-5 w-5 ${
                              device.status === 'trusted' ? 'text-green-600' :
                              device.status === 'monitored' ? 'text-yellow-600' :
                              'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{device.name}</div>
                            <div className="text-xs text-gray-600">{device.userName} • {device.os}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">{device.trustScore}</div>
                          <div className="text-xs text-gray-600">Trust Score</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compliance Status */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Compliance Framework Status</h3>
                <div className="space-y-4">
                  {['GDPR', 'HIPAA', 'SOX', 'PCI-DSS'].map(framework => {
                    const requirements = complianceRequirements.filter(r => r.framework === framework);
                    const compliantCount = requirements.filter(r => r.status === 'compliant').length;
                    const percentage = requirements.length > 0 ? (compliantCount / requirements.length) * 100 : 0;

                    return (
                      <div key={framework}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{framework}</span>
                          <span className="text-sm font-bold text-gray-900">{Math.round(percentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              percentage >= 90 ? 'bg-green-600' :
                              percentage >= 70 ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Network Security */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Network Security Rules</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Corporate Network</div>
                        <div className="text-xs text-gray-600">10.0.0.0/8 whitelisted</div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-blue-600">15.2K hits</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Blocked Countries</div>
                        <div className="text-xs text-gray-600">{ipRules.filter(r => r.type === 'geo_block').length} regions</div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-red-600">134 blocked</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Blacklisted IPs</div>
                        <div className="text-xs text-gray-600">{ipRules.filter(r => r.type === 'blacklist').length} addresses</div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-orange-600">127 hits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Threat Monitor Tab */}
        {activeTab === 'threats' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Threat Monitoring</h2>
                <p className="text-gray-600">Real-time security threat detection and response</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors">
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search threats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Threat Timeline */}
            <div className="space-y-4">
              {threatEvents
                .filter(t => selectedSeverity === 'all' || t.severity === selectedSeverity)
                .map(threat => {
                  const Icon = getThreatIcon(threat.type);
                  const severityColor = getSeverityColor(threat.severity);
                  return (
                    <div key={threat.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`w-12 h-12 bg-${severityColor}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`h-6 w-6 text-${severityColor}-600`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{threat.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{threat.description}</p>
                              </div>
                              <span className={`px-3 py-1 bg-${severityColor}-100 text-${severityColor}-800 rounded-full text-xs font-semibold uppercase ml-4 flex-shrink-0`}>
                                {threat.severity}
                              </span>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                              <div>
                                <span className="text-gray-600">Source:</span>
                                <span className="ml-2 font-semibold text-gray-900">{threat.source}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">IP Address:</span>
                                <span className="ml-2 font-mono text-gray-900">{threat.ipAddress}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Location:</span>
                                <span className="ml-2 font-semibold text-gray-900">{threat.location}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Status:</span>
                                <span className={`ml-2 font-semibold capitalize ${
                                  threat.status === 'active' ? 'text-red-600' :
                                  threat.status === 'investigating' ? 'text-orange-600' :
                                  threat.status === 'resolved' ? 'text-green-600' :
                                  'text-gray-600'
                                }`}>
                                  {threat.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 text-xs text-gray-500">
                              Detected: {new Date(threat.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
                        <button className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          Investigate
                        </button>
                        <button className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          Mark Resolved
                        </button>
                        <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                          False Positive
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Device Management Tab */}
        {activeTab === 'devices' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Device Management & Trust</h2>
                <p className="text-gray-600">Monitor and manage device access and compliance</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors">
                <Plus className="h-4 w-4" />
                <span>Register Device</span>
              </button>
            </div>

            <div className="space-y-4">
              {devices.map(device => {
                const Icon = getDeviceIcon(device.type);
                return (
                  <div key={device.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          device.status === 'trusted' ? 'bg-green-100' :
                          device.status === 'monitored' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          <Icon className={`h-7 w-7 ${
                            device.status === 'trusted' ? 'text-green-600' :
                            device.status === 'monitored' ? 'text-yellow-600' :
                            'text-red-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
                              <p className="text-sm text-gray-600">{device.userName} • {device.os}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-2xl font-bold text-gray-900">{device.trustScore}</span>
                                <Fingerprint className="h-5 w-5 text-gray-600" />
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                                device.status === 'trusted' ? 'bg-green-100 text-green-800' :
                                device.status === 'monitored' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {device.status}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                            <div>
                              <span className="text-gray-600">Browser:</span>
                              <span className="ml-2 font-semibold text-gray-900">{device.browser}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">IP:</span>
                              <span className="ml-2 font-mono text-gray-900">{device.ipAddress}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Location:</span>
                              <span className="ml-2 font-semibold text-gray-900">{device.location}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Last Access:</span>
                              <span className="ml-2 text-gray-900">{new Date(device.lastAccess).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Compliance Checks */}
                          <div className="border-t border-gray-200 pt-4">
                            <div className="text-sm font-semibold text-gray-700 mb-3">Compliance Status:</div>
                            <div className="grid grid-cols-4 gap-3">
                              <div className="flex items-center space-x-2">
                                {device.compliance.osVersion ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="text-sm text-gray-700">OS Version</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {device.compliance.securityPatches ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="text-sm text-gray-700">Security Patches</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {device.compliance.encryption ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="text-sm text-gray-700">Encryption</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {device.compliance.antivirus ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="text-sm text-gray-700">Antivirus</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2">
                      <button className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        View Details
                      </button>
                      <button className="px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                        Change Status
                      </button>
                      <button className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        Block Device
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Network Security Tab */}
        {activeTab === 'network' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Network Security Controls</h2>
                <p className="text-gray-600">Manage IP rules, geo-blocking, and network access policies</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors">
                <Plus className="h-4 w-4" />
                <span>Add Rule</span>
              </button>
            </div>

            <div className="space-y-4">
              {ipRules.map(rule => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          rule.type === 'whitelist' ? 'bg-green-100' :
                          rule.type === 'blacklist' ? 'bg-red-100' :
                          'bg-orange-100'
                        }`}>
                          {rule.type === 'whitelist' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : rule.type === 'blacklist' ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <Globe className="h-5 w-5 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 capitalize">
                              {rule.type.replace('_', ' ')}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {rule.enabled ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{rule.reason}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Target:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {rule.country || rule.ipAddress || rule.cidrRange}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Hit Count:</span>
                          <span className="ml-2 font-semibold text-blue-600">{rule.hitCount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <span className="ml-2 text-gray-900">{new Date(rule.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Compliance Management</h2>
                <p className="text-gray-600">Track regulatory compliance and generate audit reports</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors">
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </button>
            </div>

            {/* Compliance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {['GDPR', 'HIPAA', 'SOX', 'PCI-DSS'].map(framework => {
                const requirements = complianceRequirements.filter(r => r.framework === framework);
                const compliantCount = requirements.filter(r => r.status === 'compliant').length;
                const percentage = requirements.length > 0 ? (compliantCount / requirements.length) * 100 : 0;

                return (
                  <div key={framework} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-center mb-3">
                      <div className="text-3xl font-bold text-gray-900">{Math.round(percentage)}%</div>
                      <div className="text-sm font-semibold text-gray-700">{framework}</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          percentage >= 90 ? 'bg-green-600' :
                          percentage >= 70 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-2 text-center">
                      {compliantCount} of {requirements.length} compliant
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compliance Requirements */}
            <div className="space-y-4">
              {complianceRequirements.map(req => {
                const statusColor = getComplianceColor(req.status);
                return (
                  <div key={req.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-3 py-1 bg-${statusColor}-100 text-${statusColor}-800 rounded-full text-xs font-semibold uppercase`}>
                            {req.framework}
                          </span>
                          <span className="text-sm text-gray-600">{req.category}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{req.requirement}</h3>

                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <span className={`ml-2 font-semibold capitalize text-${statusColor}-600`}>
                              {req.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Last Audited:</span>
                            <span className="ml-2 text-gray-900">{new Date(req.lastAudited).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Responsible:</span>
                            <span className="ml-2 font-semibold text-gray-900">{req.responsible}</span>
                          </div>
                        </div>

                        {req.evidence.length > 0 && (
                          <div>
                            <span className="text-sm font-semibold text-gray-700">Evidence Files:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {req.evidence.map((file, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                  {file}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
                      <button className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        View Details
                      </button>
                      <button className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        Upload Evidence
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Advanced Audit Tab */}
        {activeTab === 'audit' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Advanced Audit & Monitoring</h2>
                <p className="text-gray-600">Search, filter, and analyze security audit logs</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2 transition-colors">
                  <Filter className="h-4 w-4" />
                  <span>Advanced Filter</span>
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors">
                  <Download className="h-4 w-4" />
                  <span>Export Logs</span>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search audit logs by user, action, IP address, or resource..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>All Event Types</option>
                  <option>Login</option>
                  <option>Data Access</option>
                  <option>Configuration Change</option>
                  <option>Permission Change</option>
                </select>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>All Users</option>
                  <option>Administrators</option>
                  <option>Regular Users</option>
                </select>
                <input
                  type="date"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="End Date"
                />
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      { time: '15:45:23', user: 'john.smith@company.com', action: 'Login', resource: 'Authentication', ip: '10.0.0.125', status: 'Success' },
                      { time: '15:30:12', user: 'sarah.j@company.com', action: 'Export Data', resource: 'Leads Module', ip: '10.0.0.89', status: 'Success' },
                      { time: '15:15:45', user: 'admin@company.com', action: 'Permission Change', resource: 'User: david.brown', ip: '10.0.0.1', status: 'Success' },
                      { time: '14:50:33', user: 'unknown', action: 'Login Attempt', resource: 'Authentication', ip: '192.168.100.45', status: 'Failed' },
                      { time: '14:30:18', user: 'mike.chen@company.com', action: 'Update Deal', resource: 'Deal #1234', ip: '10.0.0.67', status: 'Success' }
                    ].map((log, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.user}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.action}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.resource}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{log.ip}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            log.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSecurity;
