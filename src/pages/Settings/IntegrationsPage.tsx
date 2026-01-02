import React, { useState, useEffect } from 'react';
import {
  Cloud, Check, X, AlertCircle, RefreshCw, Settings, Plus,
  ArrowLeft, Zap, Link as LinkIcon, Clock, Activity, TrendingUp,
  Database, Play, Pause, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CRMIntegration, CRMProvider, IntegrationStatus, SyncFrequency } from '../../types/workflowAutomation';

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState<CRMIntegration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<CRMIntegration | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CRMProvider | null>(null);

  const crmProviders: Array<{
    id: CRMProvider;
    name: string;
    icon: string;
    description: string;
    color: string;
  }> = [
    {
      id: 'salesforce',
      name: 'Salesforce',
      icon: '☁️',
      description: 'Sync leads, contacts, and opportunities',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      icon: '🎯',
      description: 'Connect your HubSpot CRM data',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'pipedrive',
      name: 'Pipedrive',
      icon: '🚀',
      description: 'Bidirectional pipeline sync',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'zoho',
      name: 'Zoho CRM',
      icon: '📊',
      description: 'Enterprise CRM integration',
      color: 'from-purple-500 to-pink-600'
    }
  ];

  const getStatusBadge = (status: IntegrationStatus) => {
    const badges = {
      connected: { color: 'bg-green-100 text-green-700 border-green-300', label: 'Connected', icon: Check },
      disconnected: { color: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Disconnected', icon: X },
      error: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Error', icon: AlertCircle },
      pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'Pending', icon: Clock }
    };
    return badges[status];
  };

  const handleConnect = (provider: CRMProvider) => {
    setSelectedProvider(provider);
    setShowConnectModal(true);
  };

  const handleOAuthConnect = () => {
    console.log('Initiating OAuth flow for:', selectedProvider);
    alert(`OAuth flow for ${selectedProvider} would open here`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Cloud className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
                <p className="text-gray-600 text-lg">Connect your CRM and tools for seamless data sync</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">CRM Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {crmProviders.map((provider) => {
              const connected = integrations.find(i => i.provider === provider.id && i.is_active);

              return (
                <div
                  key={provider.id}
                  className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className={`p-3 bg-gradient-to-r ${provider.color} rounded-lg w-fit mb-4`}>
                    <span className="text-3xl">{provider.icon}</span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{provider.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{provider.description}</p>

                  {connected ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(connected.status).color}`}>
                          {React.createElement(getStatusBadge(connected.status).icon, { className: 'h-3 w-3 mr-1' })}
                          {getStatusBadge(connected.status).label}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedIntegration(connected)}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        <Settings className="h-4 w-4 inline mr-2" />
                        Configure
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(provider.id)}
                      className={`w-full px-4 py-2 bg-gradient-to-r ${provider.color} text-white rounded-lg hover:shadow-md transition-all text-sm font-semibold`}
                    >
                      <Plus className="h-4 w-4 inline mr-2" />
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {integrations.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Active Integrations</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {integrations.map((integration) => {
                const provider = crmProviders.find(p => p.id === integration.provider);
                if (!provider) return null;

                return (
                  <div key={integration.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`p-2 bg-gradient-to-r ${provider.color} rounded-lg`}>
                          <span className="text-2xl">{provider.icon}</span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{integration.connection_name}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getStatusBadge(integration.status).color}`}>
                              {React.createElement(getStatusBadge(integration.status).icon, { className: 'h-3 w-3 mr-1' })}
                              {getStatusBadge(integration.status).label}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Sync: {integration.sync_frequency.replace('_', ' ')}
                            </span>
                            <span className="flex items-center">
                              <Activity className="h-4 w-4 mr-1" />
                              Direction: {integration.sync_direction.replace(/_/g, ' ')}
                            </span>
                            {integration.last_sync_at && (
                              <span className="flex items-center">
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Last sync: {new Date(integration.last_sync_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedIntegration(integration)}
                        className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showConnectModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Connect {crmProviders.find(p => p.id === selectedProvider)?.name}</h2>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <LinkIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Secure OAuth Connection</h3>
                    <p className="text-sm text-blue-700">
                      You'll be redirected to {crmProviders.find(p => p.id === selectedProvider)?.name} to authorize access.
                      We only request permissions needed for syncing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">What will be synced:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-2" />
                    Leads and Contacts
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-2" />
                    Opportunities and Deals
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-2" />
                    Activities and Tasks
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-600 mr-2" />
                    Custom Fields (configurable)
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center space-x-3">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOAuthConnect}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <LinkIcon className="h-4 w-4 inline mr-2" />
                Connect Now
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-gray-900">Integration Settings</h2>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getStatusBadge(selectedIntegration.status).color}`}>
                    {React.createElement(getStatusBadge(selectedIntegration.status).icon, { className: 'h-3 w-3 mr-1' })}
                    {getStatusBadge(selectedIntegration.status).label}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedIntegration(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Sync Status</span>
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{selectedIntegration.last_sync_status || 'Never'}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900">Last Synced</span>
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm font-bold text-green-900">
                    {selectedIntegration.last_sync_at
                      ? new Date(selectedIntegration.last_sync_at).toLocaleString()
                      : 'Never'}
                  </p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-900">Errors</span>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-900">{selectedIntegration.sync_errors_count}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Sync Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sync Frequency
                    </label>
                    <select
                      value={selectedIntegration.sync_frequency}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="realtime">Real-time</option>
                      <option value="every_15min">Every 15 minutes</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="manual">Manual only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sync Direction
                    </label>
                    <select
                      value={selectedIntegration.sync_direction}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="bidirectional">Bidirectional</option>
                      <option value="platform_to_crm">Platform to CRM</option>
                      <option value="crm_to_platform">CRM to Platform</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conflict Resolution
                    </label>
                    <select
                      value={selectedIntegration.conflict_resolution}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="most_recent_wins">Most Recent Wins</option>
                      <option value="crm_wins">CRM Wins</option>
                      <option value="platform_wins">Platform Wins</option>
                      <option value="manual">Manual Resolution</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  <RefreshCw className="h-4 w-4 inline mr-2" />
                  Sync Now
                </button>
                <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
                <button className="px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsPage;
