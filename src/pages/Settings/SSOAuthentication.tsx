import React, { useState } from 'react';
import {
  Key, Shield, Users, CheckCircle, XCircle, AlertTriangle, Download, Upload,
  Save, RefreshCw, Settings, Globe, Lock, Cloud, Server, Smartphone, FileText,
  Copy, Eye, EyeOff, Plus, Trash2, Edit, X, TestTube, Zap, Activity
} from 'lucide-react';

interface SAMLConfig {
  id: string;
  name: string;
  idpEntityId: string;
  idpSSOUrl: string;
  idpSLOUrl: string;
  certificate: string;
  attributeMapping: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  customLoginUrl: string;
  enabled: boolean;
  lastTested?: string;
  testStatus?: 'success' | 'failed' | 'pending';
}

interface OAuthProvider {
  id: string;
  name: string;
  provider: 'google' | 'microsoft' | 'github' | 'custom';
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
  enabled: boolean;
  usePKCE: boolean;
  lastConnected?: string;
}

interface LDAPConfig {
  id: string;
  name: string;
  serverUrl: string;
  port: number;
  useSSL: boolean;
  baseDN: string;
  bindDN: string;
  bindPassword: string;
  userFilter: string;
  groupFilter: string;
  syncEnabled: boolean;
  syncInterval: number;
  enabled: boolean;
  lastSync?: string;
  testStatus?: 'success' | 'failed' | 'pending';
}

interface MFAProvider {
  id: string;
  name: string;
  type: 'totp' | 'sms' | 'email';
  provider: string;
  config: Record<string, any>;
  enabled: boolean;
}

interface AuthPolicy {
  id: string;
  name: string;
  priority: number;
  methods: string[];
  fallbackMethod: string;
  jitProvisioning: boolean;
  accountLinking: boolean;
  domainRouting: string[];
  enabled: boolean;
}

const SSOAuthentication: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'saml' | 'oauth' | 'ldap' | 'mfa' | 'policies'>('saml');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const [samlConfigs, setSamlConfigs] = useState<SAMLConfig[]>([
    {
      id: '1',
      name: 'Okta SAML',
      idpEntityId: 'http://www.okta.com/exk123456',
      idpSSOUrl: 'https://dev-123456.okta.com/app/dev-123456_myapp_1/exk123456/sso/saml',
      idpSLOUrl: 'https://dev-123456.okta.com/app/dev-123456_myapp_1/exk123456/slo/saml',
      certificate: '-----BEGIN CERTIFICATE-----\nMIIDpDCCAoygAwIBAgIGAXxxx...\n-----END CERTIFICATE-----',
      attributeMapping: {
        email: 'email',
        firstName: 'firstName',
        lastName: 'lastName',
        role: 'role'
      },
      customLoginUrl: 'https://company.com/saml/login',
      enabled: true,
      lastTested: '2024-01-21T10:30:00Z',
      testStatus: 'success'
    }
  ]);

  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([
    {
      id: '1',
      name: 'Google Workspace',
      provider: 'google',
      clientId: '123456789-abc123.apps.googleusercontent.com',
      clientSecret: 'GOCSPX-*********************',
      scopes: ['openid', 'email', 'profile'],
      redirectUri: 'https://app.company.com/auth/google/callback',
      enabled: true,
      usePKCE: true,
      lastConnected: '2024-01-20T15:00:00Z'
    },
    {
      id: '2',
      name: 'Microsoft Azure AD',
      provider: 'microsoft',
      clientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      clientSecret: '*********************',
      scopes: ['openid', 'email', 'profile', 'User.Read'],
      redirectUri: 'https://app.company.com/auth/microsoft/callback',
      enabled: true,
      usePKCE: false,
      lastConnected: '2024-01-21T09:00:00Z'
    }
  ]);

  const [ldapConfigs, setLdapConfigs] = useState<LDAPConfig[]>([
    {
      id: '1',
      name: 'Corporate Active Directory',
      serverUrl: 'ldap://ad.company.com',
      port: 389,
      useSSL: true,
      baseDN: 'DC=company,DC=com',
      bindDN: 'CN=Service Account,OU=Services,DC=company,DC=com',
      bindPassword: '*********************',
      userFilter: '(&(objectClass=user)(sAMAccountName={username}))',
      groupFilter: '(&(objectClass=group)(member={userDN}))',
      syncEnabled: true,
      syncInterval: 24,
      enabled: true,
      lastSync: '2024-01-21T02:00:00Z',
      testStatus: 'success'
    }
  ]);

  const [mfaProviders, setMfaProviders] = useState<MFAProvider[]>([
    {
      id: '1',
      name: 'Google Authenticator (TOTP)',
      type: 'totp',
      provider: 'google-authenticator',
      config: { issuer: 'BMI Platform', digits: 6, period: 30 },
      enabled: true
    },
    {
      id: '2',
      name: 'Twilio SMS',
      type: 'sms',
      provider: 'twilio',
      config: { accountSid: 'AC***', authToken: '***', fromNumber: '+1234567890' },
      enabled: false
    }
  ]);

  const [authPolicies, setAuthPolicies] = useState<AuthPolicy[]>([
    {
      id: '1',
      name: 'Corporate Users',
      priority: 1,
      methods: ['SAML', 'OAuth'],
      fallbackMethod: 'Local',
      jitProvisioning: true,
      accountLinking: true,
      domainRouting: ['@company.com', '@subsidiary.com'],
      enabled: true
    },
    {
      id: '2',
      name: 'External Partners',
      priority: 2,
      methods: ['OAuth', 'Local'],
      fallbackMethod: 'Local',
      jitProvisioning: false,
      accountLinking: false,
      domainRouting: [],
      enabled: true
    }
  ]);

  const [showSAMLModal, setShowSAMLModal] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [showLDAPModal, setShowLDAPModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);

  const handleTestSAML = async (id: string) => {
    setTestingConnection(id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSamlConfigs(samlConfigs.map(config =>
      config.id === id
        ? { ...config, testStatus: 'success', lastTested: new Date().toISOString() }
        : config
    ));
    setTestingConnection(null);
  };

  const handleTestLDAP = async (id: string) => {
    setTestingConnection(id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLdapConfigs(ldapConfigs.map(config =>
      config.id === id
        ? { ...config, testStatus: 'success' }
        : config
    ));
    setTestingConnection(null);
  };

  const handleExportSAMLMetadata = (config: SAMLConfig) => {
    const metadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${config.idpEntityId}">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${config.idpSLOUrl}"/>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${config.idpSSOUrl}" index="0"/>
  </SPSSODescriptor>
</EntityDescriptor>`;

    const blob = new Blob([metadata], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saml-metadata-${config.name.toLowerCase().replace(/\s+/g, '-')}.xml`;
    link.click();
  };

  const handleSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const tabs = [
    { id: 'saml', label: 'SAML 2.0', icon: Shield },
    { id: 'oauth', label: 'OAuth / OIDC', icon: Key },
    { id: 'ldap', label: 'LDAP / AD', icon: Server },
    { id: 'mfa', label: 'MFA Integration', icon: Smartphone },
    { id: 'policies', label: 'Auth Policies', icon: Settings }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
              <Key className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SSO & Authentication</h1>
              <p className="text-gray-600 mt-1">Configure enterprise identity providers and authentication methods</p>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{samlConfigs.filter(c => c.enabled).length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">SAML Providers</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Key className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{oauthProviders.filter(p => p.enabled).length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">OAuth Providers</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Server className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{ldapConfigs.filter(c => c.enabled).length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">LDAP/AD Connections</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <Smartphone className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{mfaProviders.filter(p => p.enabled).length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">MFA Methods</div>
          </div>
        </div>
      </div>

      {/* Save Success Message */}
      {saveSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800 font-medium">Configuration saved successfully!</span>
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
        {/* SAML 2.0 Tab */}
        {activeTab === 'saml' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">SAML 2.0 Configuration</h2>
                <p className="text-gray-600">Configure SAML identity providers for single sign-on</p>
              </div>
              <button
                onClick={() => {
                  setEditingConfig(null);
                  setShowSAMLModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add SAML Provider</span>
              </button>
            </div>

            <div className="space-y-4">
              {samlConfigs.map((config) => (
                <div
                  key={config.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                        {config.enabled ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                            Inactive
                          </span>
                        )}
                        {config.testStatus === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Entity ID:</span>
                          <span className="ml-2 text-gray-900 font-mono text-xs">{config.idpEntityId}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">SSO URL:</span>
                          <span className="ml-2 text-gray-900 font-mono text-xs">{config.idpSSOUrl}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Custom Login:</span>
                          <span className="ml-2 text-gray-900 font-mono text-xs">{config.customLoginUrl}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Tested:</span>
                          <span className="ml-2 text-gray-900">{config.lastTested ? new Date(config.lastTested).toLocaleString() : 'Never'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleTestSAML(config.id)}
                        disabled={testingConnection === config.id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Test Connection"
                      >
                        {testingConnection === config.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleExportSAMLMetadata(config)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Export Metadata"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingConfig(config);
                          setShowSAMLModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSamlConfigs(samlConfigs.filter(c => c.id !== config.id))}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Attribute Mapping */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Attribute Mapping</h4>
                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-1 text-gray-900 font-mono">{config.attributeMapping.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">First Name:</span>
                        <span className="ml-1 text-gray-900 font-mono">{config.attributeMapping.firstName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Name:</span>
                        <span className="ml-1 text-gray-900 font-mono">{config.attributeMapping.lastName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Role:</span>
                        <span className="ml-1 text-gray-900 font-mono">{config.attributeMapping.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {samlConfigs.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No SAML providers configured</p>
                  <p className="text-sm text-gray-500 mt-1">Add your first SAML identity provider to enable SSO</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OAuth / OIDC Tab */}
        {activeTab === 'oauth' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">OAuth 2.0 / OpenID Connect</h2>
                <p className="text-gray-600">Configure OAuth providers for social login and enterprise SSO</p>
              </div>
              <button
                onClick={() => {
                  setEditingConfig(null);
                  setShowOAuthModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add OAuth Provider</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {oauthProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        provider.provider === 'google' ? 'bg-red-100' :
                        provider.provider === 'microsoft' ? 'bg-blue-100' :
                        provider.provider === 'github' ? 'bg-gray-100' :
                        'bg-purple-100'
                      }`}>
                        {provider.provider === 'google' && <Globe className="h-5 w-5 text-red-600" />}
                        {provider.provider === 'microsoft' && <Cloud className="h-5 w-5 text-blue-600" />}
                        {provider.provider === 'github' && <Key className="h-5 w-5 text-gray-600" />}
                        {provider.provider === 'custom' && <Key className="h-5 w-5 text-purple-600" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                        <p className="text-xs text-gray-600 capitalize">{provider.provider}</p>
                      </div>
                    </div>
                    {provider.enabled ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div>
                      <span className="text-gray-600">Client ID:</span>
                      <div className="mt-1 font-mono text-xs bg-gray-50 p-2 rounded border border-gray-200">
                        {provider.clientId}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Redirect URI:</span>
                      <div className="mt-1 font-mono text-xs bg-gray-50 p-2 rounded border border-gray-200">
                        {provider.redirectUri}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Scopes:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {provider.scopes.map((scope, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                    {provider.usePKCE && (
                      <div className="flex items-center space-x-2 text-xs text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        <span>PKCE Enabled</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-600">
                      Last connected: {provider.lastConnected ? new Date(provider.lastConnected).toLocaleDateString() : 'Never'}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingConfig(provider);
                          setShowOAuthModal(true);
                        }}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setOauthProviders(oauthProviders.filter(p => p.id !== provider.id))}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LDAP / AD Tab */}
        {activeTab === 'ldap' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">LDAP / Active Directory Integration</h2>
                <p className="text-gray-600">Connect to your corporate directory for user authentication and sync</p>
              </div>
              <button
                onClick={() => {
                  setEditingConfig(null);
                  setShowLDAPModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add LDAP Connection</span>
              </button>
            </div>

            <div className="space-y-4">
              {ldapConfigs.map((config) => (
                <div
                  key={config.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                        {config.enabled ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                            Inactive
                          </span>
                        )}
                        {config.useSSL && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center space-x-1">
                            <Lock className="h-3 w-3" />
                            <span>SSL</span>
                          </span>
                        )}
                        {config.testStatus === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Server:</span>
                          <span className="ml-2 text-gray-900 font-mono text-xs">{config.serverUrl}:{config.port}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Base DN:</span>
                          <span className="ml-2 text-gray-900 font-mono text-xs">{config.baseDN}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Sync Status:</span>
                          <span className="ml-2 text-gray-900">
                            {config.syncEnabled ? `Every ${config.syncInterval}h` : 'Disabled'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Sync:</span>
                          <span className="ml-2 text-gray-900">{config.lastSync ? new Date(config.lastSync).toLocaleString() : 'Never'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleTestLDAP(config.id)}
                        disabled={testingConnection === config.id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Test Connection"
                      >
                        {testingConnection === config.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingConfig(config);
                          setShowLDAPModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setLdapConfigs(ldapConfigs.filter(c => c.id !== config.id))}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Search Filters</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-600">User Filter:</span>
                        <div className="mt-1 font-mono bg-gray-50 p-2 rounded border border-gray-200">
                          {config.userFilter}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Group Filter:</span>
                        <div className="mt-1 font-mono bg-gray-50 p-2 rounded border border-gray-200">
                          {config.groupFilter}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MFA Integration Tab */}
        {activeTab === 'mfa' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Multi-Factor Authentication Integration</h2>
              <p className="text-gray-600">Configure MFA providers for additional security layer</p>
            </div>

            <div className="space-y-4">
              {mfaProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        provider.type === 'totp' ? 'bg-blue-100' :
                        provider.type === 'sms' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        {provider.type === 'totp' && <Smartphone className="h-6 w-6 text-blue-600" />}
                        {provider.type === 'sms' && <Activity className="h-6 w-6 text-green-600" />}
                        {provider.type === 'email' && <FileText className="h-6 w-6 text-purple-600" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{provider.type.toUpperCase()} Authentication</p>
                        {provider.type === 'totp' && (
                          <p className="text-xs text-gray-500 mt-1">
                            {provider.config.digits}-digit codes, {provider.config.period}s validity
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {provider.enabled ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Enabled
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                          Disabled
                        </span>
                      )}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={provider.enabled}
                          onChange={(e) => {
                            setMfaProviders(mfaProviders.map(p =>
                              p.id === provider.id ? { ...p, enabled: e.target.checked } : p
                            ));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* MFA Statistics */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4">MFA Adoption Statistics</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold text-blue-600">67%</div>
                  <div className="text-sm text-gray-600 mt-1">Users with MFA Enabled</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">89%</div>
                  <div className="text-sm text-gray-600 mt-1">TOTP Usage Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">145</div>
                  <div className="text-sm text-gray-600 mt-1">Active MFA Sessions</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Authentication Policies Tab */}
        {activeTab === 'policies' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Policies</h2>
              <p className="text-gray-600">Define authentication method priorities and routing rules</p>
            </div>

            <div className="space-y-4">
              {authPolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          Priority {policy.priority}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">{policy.name}</h3>
                        {policy.enabled ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Authentication Methods</h4>
                          <div className="flex flex-wrap gap-2">
                            {policy.methods.map((method, idx) => (
                              <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                {method}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            Fallback: <span className="font-semibold">{policy.fallbackMethod}</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Features</h4>
                          <div className="space-y-1 text-sm">
                            {policy.jitProvisioning && (
                              <div className="flex items-center space-x-2 text-green-700">
                                <CheckCircle className="h-4 w-4" />
                                <span>Just-in-Time Provisioning</span>
                              </div>
                            )}
                            {policy.accountLinking && (
                              <div className="flex items-center space-x-2 text-green-700">
                                <CheckCircle className="h-4 w-4" />
                                <span>Account Linking</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {policy.domainRouting.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Domain Routing</h4>
                          <div className="flex flex-wrap gap-2">
                            {policy.domainRouting.map((domain, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-mono">
                                {domain}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={policy.enabled}
                          onChange={(e) => {
                            setAuthPolicies(authPolicies.map(p =>
                              p.id === policy.id ? { ...p, enabled: e.target.checked } : p
                            ));
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Authentication Flow Diagram */}
            <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Authentication Flow Priority</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-blue-100 rounded-lg p-4 text-center">
                  <Shield className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold text-blue-900">SAML 2.0</div>
                  <div className="text-xs text-blue-700 mt-1">Highest Priority</div>
                </div>
                <Zap className="h-5 w-5 text-gray-400" />
                <div className="flex-1 bg-green-100 rounded-lg p-4 text-center">
                  <Key className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold text-green-900">OAuth 2.0</div>
                  <div className="text-xs text-green-700 mt-1">Medium Priority</div>
                </div>
                <Zap className="h-5 w-5 text-gray-400" />
                <div className="flex-1 bg-purple-100 rounded-lg p-4 text-center">
                  <Server className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="font-semibold text-purple-900">LDAP/AD</div>
                  <div className="text-xs text-purple-700 mt-1">Low Priority</div>
                </div>
                <Zap className="h-5 w-5 text-gray-400" />
                <div className="flex-1 bg-gray-200 rounded-lg p-4 text-center">
                  <Lock className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">Local Auth</div>
                  <div className="text-xs text-gray-700 mt-1">Fallback</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{loading ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>
    </div>
  );
};

export default SSOAuthentication;
