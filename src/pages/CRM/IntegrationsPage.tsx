import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Settings,
  Zap,
  Link as LinkIcon,
  X,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  status: 'connected' | 'not-connected';
  logo: string;
  tier: 'native' | 'third-party';
  lastSync?: string;
  totalImported?: number;
  autoSync?: boolean;
  frequency?: string;
  assignedTo?: string;
  leadStatus?: string;
  tags?: string[];
  aiScoring?: boolean;
  features?: string[];
  requiresSubscription?: boolean;
  apiLimits?: boolean;
  syncType?: string;
}

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const [configForm, setConfigForm] = useState({
    assignedTo: 'Alex Rodriguez (You)',
    defaultStatus: 'New',
    tags: 'Lead Gen, Apollo',
    syncFrequency: 'Every 6 hours',
    aiScoring: true
  });

  const integrations: Integration[] = [
    {
      id: 'bmi-leadgen',
      name: 'BMI Lead Generation Tool',
      status: 'connected',
      logo: '⭐',
      tier: 'native',
      lastSync: 'Real-time',
      totalImported: 3547,
      autoSync: true,
      frequency: 'Real-time (instant)',
      syncType: 'Real-time sync (instant)',
      assignedTo: 'Alex Rodriguez (You)',
      leadStatus: 'New',
      tags: ['Lead Gen', 'BMI Native'],
      aiScoring: true,
      features: [
        'Real-time sync (instant)',
        'No API limits',
        'Unlimited leads',
        'Advanced AI scoring included',
        'FREE with CRM subscription'
      ],
      apiLimits: false,
      requiresSubscription: false
    },
    {
      id: 'bmi-hrms',
      name: 'BMI HRMS Module',
      status: 'connected',
      logo: '⭐',
      tier: 'native',
      lastSync: 'Real-time',
      totalImported: 892,
      autoSync: true,
      frequency: 'Real-time (instant)',
      syncType: 'Real-time sync',
      assignedTo: 'Alex Rodriguez (You)',
      leadStatus: 'New',
      tags: ['HRMS', 'B2B', 'BMI Native'],
      aiScoring: true,
      features: [
        'Recruitment data → B2B leads',
        'Real-time sync',
        'FREE with CRM subscription'
      ],
      apiLimits: false,
      requiresSubscription: false
    },
    {
      id: 'apollo',
      name: 'Apollo.io',
      status: 'not-connected',
      logo: '🚀',
      tier: 'third-party',
      syncType: 'API-based sync (every 6 hours)',
      features: [
        'API-based sync (every 6 hours)',
        'Subject to Apollo.io API limits',
        'Requires Apollo.io subscription'
      ],
      apiLimits: true,
      requiresSubscription: true
    },
    {
      id: 'zoominfo',
      name: 'ZoomInfo',
      status: 'not-connected',
      logo: '🔍',
      tier: 'third-party',
      syncType: 'API-based sync',
      features: [
        'Access to 100M+ B2B contacts',
        'Advanced company intelligence',
        'Direct dial phone numbers',
        'Requires ZoomInfo subscription'
      ],
      apiLimits: true,
      requiresSubscription: true
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Sales Navigator',
      status: 'not-connected',
      logo: '💼',
      tier: 'third-party',
      syncType: 'API-based sync',
      features: [
        'Advanced LinkedIn search',
        'InMail capabilities',
        'Lead recommendations',
        'Requires LinkedIn Sales Navigator subscription'
      ],
      apiLimits: true,
      requiresSubscription: true
    }
  ];

  const handleConfigure = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigForm({
      assignedTo: integration.assignedTo || 'Alex Rodriguez (You)',
      defaultStatus: integration.leadStatus || 'New',
      tags: integration.tags?.join(', ') || '',
      syncFrequency: integration.frequency || 'Every 6 hours',
      aiScoring: integration.aiScoring || false
    });
    setShowConfigModal(true);
  };

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowConnectModal(true);
  };

  const handleDisconnectClick = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowDisconnectModal(true);
  };

  const handleConfirmDisconnect = () => {
    setShowDisconnectModal(false);
    setTimeout(() => {
      alert(`${selectedIntegration?.name} has been disconnected. Auto-sync has been stopped.`);
    }, 100);
  };

  const handleSaveConfig = () => {
    setShowConfigModal(false);
    setTimeout(() => {
      alert('Configuration saved successfully!');
    }, 100);
  };

  const handleCompleteConnection = () => {
    setShowConnectModal(false);
    setTimeout(() => {
      alert(`${selectedIntegration?.name} connected successfully! You can now start importing leads.`);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/crm/leads')}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Leads</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-start space-x-3">
          <LinkIcon className="h-8 w-8 text-blue-600 mt-1" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Lead Generation Integrations
            </h1>
            <p className="text-gray-600 text-lg mb-3">
              Connect your lead generation tools and start syncing leads automatically
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-blue-900 font-medium">
                BMI CRM integrates with any lead generation tool. For the best experience, use our native BMI Lead Gen Tool with real-time sync, unlimited leads, and advanced AI scoring included FREE.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

        {/* Tier 1: Native Integrations */}
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">⭐ NATIVE INTEGRATIONS</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">Recommended</span>
          </div>
          <div className="space-y-4">
            {integrations.filter(i => i.tier === 'native').map((integration) => (
              <div
                key={integration.id}
                className="bg-white rounded-lg shadow-sm border-2 border-blue-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl">{integration.logo}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-bold text-gray-900">{integration.name}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">RECOMMENDED</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {integration.status === 'connected' ? (
                          <span className="flex items-center text-sm text-green-600 font-medium">
                            <Check className="h-4 w-4 mr-1" />
                            Connected
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Not Connected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 mb-4">
                  {integration.features?.map((feature, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-sm">
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <button
                        onClick={() => handleConfigure(integration)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => navigate(`/crm/leads?source=${integration.id}`)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        View Leads
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Connect {integration.name}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier 2: Third-Party Integrations */}
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🔗 THIRD-PARTY INTEGRATIONS</h2>
          </div>
          <div className="space-y-4">
            {integrations.filter(i => i.tier === 'third-party').map((integration) => (
              <div
                key={integration.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-4xl">{integration.logo}</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{integration.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {integration.status === 'connected' ? (
                          <span className="flex items-center text-sm text-green-600 font-medium">
                            <Check className="h-4 w-4 mr-1" />
                            Connected
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Not Connected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 mb-4">
                  {integration.features?.map((feature, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-sm">
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Sales Messaging for Apollo.io */}
                {integration.id === 'apollo' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-900">
                      <span className="font-semibold">Keep using Apollo.io!</span> Our CRM integrates seamlessly. However, many customers switch to our BMI Lead Gen tool because it integrates deeper, syncs instantly, and has no API limits.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <button
                        onClick={() => handleConfigure(integration)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => handleDisconnectClick(integration)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Connect {integration.name}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Configure Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Configure {selectedIntegration?.name} Settings
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-assign to
                </label>
                <select
                  value={configForm.assignedTo}
                  onChange={(e) => setConfigForm({...configForm, assignedTo: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Alex Rodriguez (You)</option>
                  <option>Sarah Johnson</option>
                  <option>Mike Chen</option>
                  <option>Round Robin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Lead Status
                </label>
                <select
                  value={configForm.defaultStatus}
                  onChange={(e) => setConfigForm({...configForm, defaultStatus: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>New</option>
                  <option>Contacted</option>
                  <option>Qualified</option>
                  <option>Unqualified</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={configForm.tags}
                  onChange={(e) => setConfigForm({...configForm, tags: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lead Gen, Apollo, Outbound"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-sync Frequency
                </label>
                <select
                  value={configForm.syncFrequency}
                  onChange={(e) => setConfigForm({...configForm, syncFrequency: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Every 1 hour</option>
                  <option>Every 3 hours</option>
                  <option>Every 6 hours</option>
                  <option>Every 12 hours</option>
                  <option>Daily</option>
                  <option>Manual only</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">AI-Powered Lead Scoring</p>
                  <p className="text-sm text-gray-600">Automatically score leads using AI</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configForm.aiScoring}
                    onChange={(e) => setConfigForm({...configForm, aiScoring: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Disconnect {selectedIntegration?.name}?
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to disconnect this integration? Auto-sync will be stopped and you won't receive new leads automatically.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisconnect}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Integration Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Connect {selectedIntegration?.name}
              </h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Enter your {selectedIntegration?.name} API key to connect and start importing leads.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your API key"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                You can find your API key in {selectedIntegration?.name} settings
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteConnection}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default IntegrationsPage;
