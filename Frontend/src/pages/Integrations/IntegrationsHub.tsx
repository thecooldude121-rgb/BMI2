import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntegrations } from '../../contexts/IntegrationsContext';
import { useToast } from '../../contexts/ToastContext';
import { IntegrationCard } from '../../components/Integrations/IntegrationCard';
import { AvailableIntegrationCard } from '../../components/Integrations/AvailableIntegrationCard';
import {
  ConfigureModal,
  SwitchProviderModal,
  ConnectModal,
  LearnMoreModal,
  DisconnectConfirmModal,
  RegenerateApiKeyModal,
  TestWebhookModal,
  AddCustomIntegrationModal,
} from '../../components/Integrations/IntegrationModals';
import { ConnectedIntegration, AvailableIntegration, IntegrationType } from '../../types/integrations';

type FilterStatus = 'all' | 'connected' | 'available';

export const IntegrationsHub: React.FC = () => {
  console.log('IntegrationsHub: Component rendering');

  let contextData;
  try {
    contextData = useIntegrations();
    console.log('IntegrationsHub: Context data loaded', {
      hasConnected: !!contextData.connectedIntegrations,
      hasAvailable: !!contextData.availableIntegrations,
      isLoading: contextData.isLoading
    });
  } catch (error) {
    console.error('IntegrationsHub: Context error', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Integrations</h1>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const {
    connectedIntegrations,
    availableIntegrations,
    customIntegrations,
    stats,
    apiCredentials,
    isLoading,
    connectIntegration,
    disconnectIntegration,
    configureIntegration,
    switchProvider,
    refreshApiKey,
  } = contextData;

  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<IntegrationType | 'all'>('all');
  const [showConnectedToggle, setShowConnectedToggle] = useState(true);
  const [showAvailableToggle, setShowAvailableToggle] = useState(true);
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [learnMoreModalOpen, setLearnMoreModalOpen] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [regenerateApiKeyModalOpen, setRegenerateApiKeyModalOpen] = useState(false);
  const [testWebhookModalOpen, setTestWebhookModalOpen] = useState(false);
  const [addCustomModalOpen, setAddCustomModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<ConnectedIntegration | AvailableIntegration | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const handleConfigure = (integration: ConnectedIntegration) => {
    setSelectedIntegration(integration);
    setConfigureModalOpen(true);
  };

  const handleSwitch = (integration: ConnectedIntegration) => {
    setSelectedIntegration(integration);
    setSwitchModalOpen(true);
  };

  const handleDisconnect = (integration: ConnectedIntegration) => {
    setSelectedIntegration(integration);
    setDisconnectModalOpen(true);
  };

  const confirmDisconnect = async () => {
    if (selectedIntegration && 'currentProvider' in selectedIntegration) {
      await disconnectIntegration(selectedIntegration.id);
      showToast(`${selectedIntegration.name} disconnected successfully`, 'success');
      setDisconnectModalOpen(false);
    }
  };

  const handleConnectClick = (integration: AvailableIntegration) => {
    setSelectedIntegration(integration);
    setConnectModalOpen(true);
  };

  const handleLearnMore = (integration: AvailableIntegration) => {
    setSelectedIntegration(integration);
    setLearnMoreModalOpen(true);
  };

  const handleImportLeads = (integration: ConnectedIntegration) => {
    showToast(`Opening lead import from ${integration.currentProvider.name}`, 'info');
    navigate('/leads/import?source=' + integration.currentProvider.id);
  };

  const copyToClipboard = (text: string, type: 'key' | 'webhook') => {
    navigator.clipboard.writeText(text);
    const message = type === 'key' ? 'API Key copied to clipboard' : 'Webhook URL copied to clipboard';
    showToast(message, 'success');
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  const handleSaveConfigure = async (config: Record<string, any>) => {
    if (selectedIntegration && 'currentProvider' in selectedIntegration) {
      await configureIntegration(selectedIntegration.id, config);
      showToast(`${selectedIntegration.name} updated successfully`, 'success');
    }
  };

  const handleSwitchProvider = async (provider: any) => {
    if (selectedIntegration && 'currentProvider' in selectedIntegration) {
      await switchProvider(selectedIntegration.id, provider);
      showToast(`Switched to ${provider.name}`, 'success');
    }
  };

  const handleConnectSubmit = async (config: Record<string, any>) => {
    if (selectedIntegration && 'description' in selectedIntegration) {
      await connectIntegration(selectedIntegration, config);
      showToast(`${selectedIntegration.name} connected successfully`, 'success');
    }
  };

  const handleRegenerateApiKey = async () => {
    await refreshApiKey();
    showToast('New API key generated. Update your integrations.', 'success');
    setRegenerateApiKeyModalOpen(false);
  };

  const filteredConnected = (connectedIntegrations || []).filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.currentProvider.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || integration.type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredAvailable = (availableIntegrations || []).filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.supportedTools.some(tool => tool.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || integration.type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const showConnected = showConnectedToggle;
  const showAvailable = showAvailableToggle;

  console.log('IntegrationsHub: Render check', {
    isLoading,
    connectedCount: connectedIntegrations?.length,
    availableCount: availableIntegrations?.length,
    filteredConnectedCount: filteredConnected.length,
    filteredAvailableCount: filteredAvailable.length
  });

  if (isLoading) {
    console.log('IntegrationsHub: Showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (!connectedIntegrations && !availableIntegrations) {
    console.log('IntegrationsHub: No data available');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Integration Data</h1>
          <p className="text-gray-600 mb-4">
            Unable to load integrations data. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  console.log('IntegrationsHub: Rendering main content');

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-4">
            Dashboard › <span className="text-gray-900 font-medium">Integrations</span>
          </nav>
        </div>

        <div className="bg-white rounded-lg border border-[#e5e7eb] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔌</span>
              <h1 className="text-[28px] font-bold text-gray-900">Integration Hub</h1>
            </div>
            <button
              onClick={() => setAddCustomModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#667eea] rounded-lg hover:bg-[#5568d3] transition-all duration-200"
            >
              + Add Custom
            </button>
          </div>

          <p className="text-[14px] text-gray-600 mb-4">
            Connect your tools and automate your workflow with generic connectors
          </p>

          <div className="flex flex-wrap gap-6 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <span className="font-medium text-gray-900">{stats.activeConnectors} Active Connectors</span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔗</span>
              <span className="font-medium text-gray-900">{stats.availableConnectors} Available</span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📈</span>
              <span className="font-medium text-gray-900">{stats.totalSyncsToday.toLocaleString()} syncs today</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e5e7eb] p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#667eea] focus:border-transparent transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as IntegrationType | 'all')}
                className="px-4 py-2 text-sm font-medium border border-[#e5e7eb] rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                <option value="all">All Connectors ({connectedIntegrations.length + availableIntegrations.length})</option>
                <option value="lead_generation">Lead Generation</option>
                <option value="email">Email</option>
                <option value="calendar">Calendar</option>
                <option value="communication">Communication</option>
                <option value="video_meeting">Video Meetings</option>
                <option value="hrms">HRMS</option>
                <option value="payment">Payments</option>
                <option value="e_signature">E-Signature</option>
                <option value="storage">Storage</option>
                <option value="analytics">Analytics</option>
              </select>

              <button
                onClick={() => setShowConnectedToggle(!showConnectedToggle)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  showConnectedToggle
                    ? 'bg-[#667eea] text-white'
                    : 'bg-[#e5e7eb] text-gray-700'
                }`}
              >
                {showConnectedToggle && '✓'} Connected
              </button>
              <button
                onClick={() => setShowAvailableToggle(!showAvailableToggle)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  showAvailableToggle
                    ? 'bg-[#667eea] text-white'
                    : 'bg-[#e5e7eb] text-gray-700'
                }`}
              >
                {showAvailableToggle && '✓'} Available
              </button>
            </div>
          </div>
        </div>

        {showConnected && filteredConnected.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[18px] font-semibold text-gray-900 mb-4">Connected Connectors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredConnected.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConfigure={handleConfigure}
                  onSwitch={handleSwitch}
                  onDisconnect={handleDisconnect}
                  onAction={handleImportLeads}
                />
              ))}
            </div>
          </div>
        )}

        {showAvailable && filteredAvailable.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[18px] font-semibold text-gray-900 mb-4">Available Connectors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailable.map((integration) => (
                <AvailableIntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={handleConnectClick}
                  onLearnMore={handleLearnMore}
                />
              ))}
            </div>
          </div>
        )}

        {searchQuery && filteredConnected.length === 0 && filteredAvailable.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[14px] text-gray-600 mb-4">No integrations found matching "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-[#667eea] text-white rounded-lg hover:bg-[#5568d3] transition-all duration-200"
            >
              Clear Search
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg border border-[#e5e7eb] p-6 mb-6">
          <h2 className="text-[18px] font-semibold text-gray-900 mb-4">Custom Integrations</h2>
          {customIntegrations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[14px] text-gray-600 mb-2">No custom integrations yet.</p>
              <p className="text-[14px] text-gray-500">
                Click <span className="font-medium text-[#667eea]">[+ Add Custom]</span> to connect your proprietary tools via API or Webhook.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customIntegrations.map((integration) => (
                <div key={integration.id} className="bg-[#f9fafb] rounded-lg p-6 border border-[#e5e7eb]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{integration.icon}</span>
                    <h3 className="text-[16px] font-bold text-gray-900">{integration.name}</h3>
                  </div>
                  <p className="text-[14px] text-gray-600">{integration.authType}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {apiCredentials && (
          <div className="bg-white rounded-lg border border-[#e5e7eb] p-6">
            <h2 className="text-[18px] font-semibold text-gray-900 mb-4">BMI CRM API</h2>
            <p className="text-[14px] text-gray-600 mb-4">Allow external tools to integrate with YOUR BMI CRM:</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-2">API Key:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiCredentials.apiKey}
                    readOnly
                    className="flex-1 px-4 py-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-gray-900 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(apiCredentials.apiKey, 'key')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-[#e5e7eb] rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    {copiedKey ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button
                    onClick={() => setRegenerateApiKeyModalOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-[#e5e7eb] rounded-lg hover:bg-gray-50 transition-all duration-200"
                    title="Regenerate API Key"
                  >
                    🔄
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-2">Webhook URL:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiCredentials.webhookUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-gray-900 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(apiCredentials.webhookUrl, 'webhook')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-[#e5e7eb] rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    {copiedWebhook ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    showToast('Opening API documentation...', 'info');
                    window.open('https://docs.bmi-crm.com/api', '_blank');
                  }}
                  className="px-4 py-2 text-[14px] font-medium text-[#667eea] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200"
                >
                  📖 View API Documentation
                </button>
                <button
                  onClick={() => setTestWebhookModalOpen(true)}
                  className="px-4 py-2 text-[14px] font-medium text-[#10b981] bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all duration-200"
                >
                  🧪 Test Webhook
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedIntegration && 'currentProvider' in selectedIntegration && (
        <>
          <ConfigureModal
            integration={selectedIntegration}
            isOpen={configureModalOpen}
            onClose={() => setConfigureModalOpen(false)}
            onSave={handleSaveConfigure}
          />
          <SwitchProviderModal
            integration={selectedIntegration}
            isOpen={switchModalOpen}
            onClose={() => setSwitchModalOpen(false)}
            onSwitch={handleSwitchProvider}
          />
          <DisconnectConfirmModal
            integration={selectedIntegration}
            isOpen={disconnectModalOpen}
            onClose={() => setDisconnectModalOpen(false)}
            onConfirm={confirmDisconnect}
          />
        </>
      )}

      {selectedIntegration && 'description' in selectedIntegration && (
        <>
          <ConnectModal
            integration={selectedIntegration}
            isOpen={connectModalOpen}
            onClose={() => setConnectModalOpen(false)}
            onConnect={handleConnectSubmit}
          />
          <LearnMoreModal
            integration={selectedIntegration}
            isOpen={learnMoreModalOpen}
            onClose={() => setLearnMoreModalOpen(false)}
          />
        </>
      )}

      <AddCustomIntegrationModal
        isOpen={addCustomModalOpen}
        onClose={() => setAddCustomModalOpen(false)}
        onAdd={(integration) => {
          showToast('Custom integration added successfully', 'success');
          setAddCustomModalOpen(false);
        }}
      />

      <RegenerateApiKeyModal
        isOpen={regenerateApiKeyModalOpen}
        onClose={() => setRegenerateApiKeyModalOpen(false)}
        onConfirm={handleRegenerateApiKey}
        apiKey={apiCredentials?.apiKey || ''}
      />

      <TestWebhookModal
        isOpen={testWebhookModalOpen}
        onClose={() => setTestWebhookModalOpen(false)}
        webhookUrl={apiCredentials?.webhookUrl || ''}
      />
    </div>
  );
};
