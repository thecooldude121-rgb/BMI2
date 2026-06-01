import React, { useState, useEffect } from 'react';
import {
  Key, Webhook, Link as LinkIcon, Copy, Check, Plus, Trash2, Edit,
  Eye, EyeOff, Power, AlertCircle, ExternalLink, Code, FileText,
  Settings, RefreshCw, Activity, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface APIKey {
  id: string;
  name: string;
  key_hash: string;
  permissions: any;
  last_used_at: string | null;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret: string;
  last_triggered_at: string | null;
  created_at: string;
}

interface SSOConfig {
  id: string;
  provider: 'SAML' | 'LDAP' | 'AD';
  config: any;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
}

export const APIIntegrationsPanel: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'api' | 'webhooks' | 'sso'>('api');
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [ssoConfigs, setSSOConfigs] = useState<SSOConfig[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newAPIKey, setNewAPIKey] = useState({
    name: '',
    expires_at: '',
    permissions: {}
  });

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    secret: ''
  });

  useEffect(() => {
    loadData();
  }, [activeSection]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSection === 'api') {
        const { data, error } = await supabase
          .from('api_keys')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setApiKeys(data);
      } else if (activeSection === 'webhooks') {
        const { data, error } = await supabase
          .from('webhooks')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setWebhooks(data);
      } else if (activeSection === 'sso') {
        const { data, error } = await supabase
          .from('sso_configurations')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) setSSOConfigs(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAPIKey = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'bmi_';
    for (let i = 0; i < 32; i++) {
      key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return key;
  };

  const createAPIKey = async () => {
    if (!newAPIKey.name.trim()) return;

    setLoading(true);
    try {
      const key = generateAPIKey();
      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          name: newAPIKey.name,
          key_hash: key,
          permissions: newAPIKey.permissions,
          expires_at: newAPIKey.expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setApiKeys([data, ...apiKeys]);
      setGeneratedKey(key);
      setShowKeyModal(true);
      setShowCreateModal(false);
      setNewAPIKey({ name: '', expires_at: '', permissions: {} });
    } catch (error) {
      console.error('Error creating API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim()) return;

    setLoading(true);
    try {
      const secret = `whsec_${generateAPIKey().slice(4)}`;
      const { data, error } = await supabase
        .from('webhooks')
        .insert([{
          ...newWebhook,
          secret,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setWebhooks([data, ...webhooks]);
      setShowCreateModal(false);
      setNewWebhook({ name: '', url: '', events: [], secret: '' });
    } catch (error) {
      console.error('Error creating webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAPIKeyStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      setApiKeys(apiKeys.map(key =>
        key.id === id ? { ...key, is_active: !isActive } : key
      ));
    } catch (error) {
      console.error('Error toggling API key:', error);
    }
  };

  const deleteAPIKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setApiKeys(apiKeys.filter(key => key.id !== id));
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const availableEvents = [
    'role.created',
    'role.updated',
    'role.deleted',
    'permission.changed',
    'user.assigned',
    'approval.requested',
    'approval.completed'
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">API & Integrations</h2>
            <p className="text-sm text-gray-600 mt-1">Manage API keys, webhooks, and SSO configurations</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Create new ${activeSection}`}
          >
            <Plus className="h-5 w-5" />
            <span>
              {activeSection === 'api' && 'Create API Key'}
              {activeSection === 'webhooks' && 'Add Webhook'}
              {activeSection === 'sso' && 'Configure SSO'}
            </span>
          </button>
        </div>

        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveSection('api')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeSection === 'api' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-pressed={activeSection === 'api'}
          >
            <Key className="h-4 w-4" />
            <span>API Keys</span>
          </button>
          <button
            onClick={() => setActiveSection('webhooks')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeSection === 'webhooks' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-pressed={activeSection === 'webhooks'}
          >
            <Webhook className="h-4 w-4" />
            <span>Webhooks</span>
          </button>
          <button
            onClick={() => setActiveSection('sso')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeSection === 'sso' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-pressed={activeSection === 'sso'}
          >
            <LinkIcon className="h-4 w-4" />
            <span>SSO/LDAP</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'api' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Code className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">API Documentation</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Use these API keys to integrate with our RESTful API. View full documentation for endpoints and examples.
                  </p>
                  <a
                    href="#"
                    className="inline-flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="h-4 w-4" />
                    <span>View API Docs</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {apiKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Key className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600 mb-4">No API keys created yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create First API Key
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="bg-white border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{key.name}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            key.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 mb-3">
                          <code className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded font-mono">
                            {key.key_hash.slice(0, 20)}...
                          </code>
                          <button
                            onClick={() => copyToClipboard(key.key_hash)}
                            className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            aria-label="Copy API key"
                          >
                            {copiedKey ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                          <span>Expires: {new Date(key.expires_at).toLocaleDateString()}</span>
                          {key.last_used_at && (
                            <span className="flex items-center">
                              <Activity className="h-3 w-3 mr-1" />
                              Last used: {new Date(key.last_used_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleAPIKeyStatus(key.id, key.is_active)}
                          className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            key.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                          }`}
                          aria-label={key.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteAPIKey(key.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                          aria-label="Delete API key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'webhooks' && (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Webhook className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-purple-900 mb-1">Webhook Events</h3>
                  <p className="text-sm text-purple-800">
                    Configure webhooks to receive real-time notifications when permission events occur.
                  </p>
                </div>
              </div>
            </div>

            {webhooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Webhook className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600 mb-4">No webhooks configured</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add First Webhook
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="bg-white border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{webhook.name}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            webhook.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {webhook.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{webhook.url}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                        >
                          {event}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {webhook.last_triggered_at
                          ? `Last triggered: ${new Date(webhook.last_triggered_at).toLocaleString()}`
                          : 'Never triggered'}
                      </span>
                      <button className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'sso' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <LinkIcon className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">SSO Integration</h3>
                  <p className="text-sm text-green-800">
                    Configure Single Sign-On (SSO) with SAML, LDAP, or Active Directory for seamless user authentication.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {['SAML', 'LDAP', 'Active Directory'].map((provider) => (
                <button
                  key={provider}
                  className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <LinkIcon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 mb-1">{provider}</h3>
                  <p className="text-sm text-gray-600">Configure {provider}</p>
                </button>
              ))}
            </div>

            {ssoConfigs.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Configured SSO Providers</h3>
                {ssoConfigs.map((config) => (
                  <div
                    key={config.id}
                    className="bg-white border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{config.provider}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            config.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {config.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {config.last_sync_at
                            ? `Last sync: ${new Date(config.last_sync_at).toLocaleString()}`
                            : 'Never synced'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <Settings className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && activeSection === 'api' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Create API Key</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAPIKey.name}
                  onChange={(e) => setNewAPIKey({ ...newAPIKey, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Production API Key"
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={newAPIKey.expires_at}
                  onChange={(e) => setNewAPIKey({ ...newAPIKey, expires_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 1 year from now</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={createAPIKey}
                disabled={!newAPIKey.name.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {loading ? 'Creating...' : 'Create Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && activeSection === 'webhooks' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add Webhook</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Slack Notifications"
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://your-domain.com/webhook"
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events to Subscribe</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event] });
                          } else {
                            setNewWebhook({ ...newWebhook, events: newWebhook.events.filter(e => e !== event) });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-700">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={createWebhook}
                disabled={!newWebhook.name.trim() || !newWebhook.url.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {loading ? 'Creating...' : 'Create Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">API Key Created!</h3>
              </div>
              <p className="text-sm text-gray-600 ml-15">
                Save this key now - you won't be able to see it again
              </p>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <code className="block text-sm text-gray-800 break-all font-mono">{generatedKey}</code>
              </div>

              <button
                onClick={() => copyToClipboard(generatedKey)}
                className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {copiedKey ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                <span>{copiedKey ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowKeyModal(false)}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                I've Saved the Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
