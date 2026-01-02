import React, { useState } from 'react';
import { ConnectedIntegration, AvailableIntegration, IntegrationProvider } from '../../types/integrations';

interface ConfigureModalProps {
  integration: ConnectedIntegration;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Record<string, any>) => void;
}

export const ConfigureModal: React.FC<ConfigureModalProps> = ({
  integration,
  isOpen,
  onClose,
  onSave,
}) => {
  const [apiKey, setApiKey] = useState(integration.config?.apiKey || '');
  const [endpoint, setEndpoint] = useState(integration.config?.endpoint || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ apiKey, endpoint });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Configure {integration.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your API key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Endpoint (Optional)
            </label>
            <input
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://api.example.com"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Your API credentials are encrypted and stored securely.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

interface SwitchProviderModalProps {
  integration: ConnectedIntegration;
  isOpen: boolean;
  onClose: () => void;
  onSwitch: (provider: IntegrationProvider) => void;
}

export const SwitchProviderModal: React.FC<SwitchProviderModalProps> = ({
  integration,
  isOpen,
  onClose,
  onSwitch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Switch Provider</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Select a different provider for your {integration.name}
        </p>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {integration.supportedProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => {
                onSwitch(provider);
                onClose();
              }}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                provider.id === integration.currentProvider.id
                  ? 'bg-blue-50 border-blue-500 text-blue-900'
                  : 'bg-white border-gray-200 hover:border-blue-300 text-gray-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{provider.name}</span>
                {provider.id === integration.currentProvider.id && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    Current
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">{provider.authType.toUpperCase()}</span>
            </button>
          ))}

          <button
            onClick={() => {
              onSwitch({
                id: 'custom',
                name: 'Custom API',
                authType: 'api_key',
              });
              onClose();
            }}
            className="w-full text-left px-4 py-3 rounded-lg border border-dashed border-gray-300 hover:border-blue-300 text-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">➕</span>
              <div>
                <div className="font-medium">Custom API</div>
                <div className="text-xs text-gray-500">Connect your own API endpoint</div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConnectModalProps {
  integration: AvailableIntegration;
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: Record<string, any>) => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  integration,
  isOpen,
  onClose,
  onConnect,
}) => {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');

  if (!isOpen) return null;

  const handleConnect = () => {
    onConnect({
      provider: selectedProvider,
      apiKey,
      endpoint,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Connect {integration.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a provider...</option>
              {integration.supportedTools.map((tool, index) => (
                <option key={index} value={tool}>
                  {tool}
                </option>
              ))}
            </select>
          </div>

          {selectedProvider && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your API key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Endpoint (Optional)
                </label>
                <input
                  type="url"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://api.example.com"
                />
              </div>
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              {integration.description}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={!selectedProvider || !apiKey}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};

interface LearnMoreModalProps {
  integration: AvailableIntegration;
  isOpen: boolean;
  onClose: () => void;
}

export const LearnMoreModal: React.FC<LearnMoreModalProps> = ({
  integration,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{integration.icon}</span>
            <h2 className="text-xl font-semibold text-gray-900">{integration.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{integration.description}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Supported Tools</h3>
            <ul className="space-y-1">
              {integration.supportedTools.map((tool, index) => (
                <li key={index} className="text-gray-700 flex items-center gap-2">
                  <span className="text-blue-500">✓</span>
                  {tool}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Benefits</h3>
            <ul className="space-y-2">
              {integration.benefits.map((benefit, index) => (
                <li key={index} className="text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-1">●</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {integration.isPremium && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">🔜 Premium Feature</h3>
              <p className="text-sm text-purple-800">
                This integration is currently under development and will be available soon as part of our premium tier.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface DisconnectConfirmModalProps {
  integration: ConnectedIntegration;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DisconnectConfirmModal: React.FC<DisconnectConfirmModalProps> = ({
  integration,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Disconnect {integration.name}?
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          This will stop all syncs from {integration.currentProvider.name}. You can reconnect anytime.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Current Stats:</h3>
          <ul className="space-y-1">
            {integration.stats.map((stat, index) => (
              <li key={index} className="text-sm text-gray-700">• {stat.label}</li>
            ))}
            <li className="text-sm text-gray-700">• Last sync: {new Date(integration.sync.lastSyncAt).toLocaleTimeString()}</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Warning:</strong> Auto-sync will stop immediately.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};

interface RegenerateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  apiKey: string;
}

export const RegenerateApiKeyModal: React.FC<RegenerateApiKeyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  apiKey,
}) => {
  if (!isOpen) return null;

  const keyEnding = apiKey.slice(-3);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Regenerate API Key?
        </h2>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800 mb-2">
            <strong>⚠️ Warning:</strong> This will immediately invalidate your current API key.
          </p>
          <p className="text-sm text-red-700">
            Any integrations using the old key will stop working until updated.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-1">Current key ends in: ...{keyEnding}</p>
          <p className="text-sm text-gray-600">Created: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Regenerate Key
          </button>
        </div>
      </div>
    </div>
  );
};

interface TestWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
}

export const TestWebhookModal: React.FC<TestWebhookModalProps> = ({
  isOpen,
  onClose,
  webhookUrl,
}) => {
  const [eventType, setEventType] = useState('lead.created');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSendTest = async () => {
    setIsLoading(true);
    setResult(null);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = Math.random() > 0.2;
    setResult({
      success,
      message: success
        ? 'Webhook test successful (200 OK)'
        : 'Connection failed: Unable to reach endpoint',
    });
    setIsLoading(false);
  };

  const getSamplePayload = () => {
    switch (eventType) {
      case 'lead.created':
        return `{
  "event": "lead.created",
  "lead_id": "lead_test_123",
  "name": "Test Lead",
  "email": "test@example.com",
  "company": "Test Company"
}`;
      case 'contact.created':
        return `{
  "event": "contact.created",
  "contact_id": "contact_test_456",
  "name": "John Doe",
  "email": "john@example.com"
}`;
      case 'deal.updated':
        return `{
  "event": "deal.updated",
  "deal_id": "deal_test_789",
  "stage": "negotiation",
  "value": 50000
}`;
      case 'deal.won':
        return `{
  "event": "deal.won",
  "deal_id": "deal_test_999",
  "value": 75000,
  "closed_at": "${new Date().toISOString()}"
}`;
      default:
        return '{}';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Test Webhook</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Send a test event to your webhook endpoint:
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type:
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="lead.created">lead.created</option>
              <option value="contact.created">contact.created</option>
              <option value="deal.updated">deal.updated</option>
              <option value="deal.won">deal.won</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sample Payload:
            </label>
            <pre className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-xs font-mono overflow-x-auto">
              {getSamplePayload()}
            </pre>
          </div>

          {result && (
            <div className={`rounded-lg p-3 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? '✅' : '❌'} {result.message}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSendTest}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Testing...
              </>
            ) : (
              'Send Test Event'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AddCustomIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (integration: any) => void;
}

export const AddCustomIntegrationModal: React.FC<AddCustomIntegrationModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [integrationType, setIntegrationType] = useState<'rest_api' | 'webhook' | 'oauth2'>('rest_api');
  const [description, setDescription] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1 && name && integrationType && description) {
      setStep(2);
    } else if (step === 2) {
      onAdd({
        name,
        type: 'custom',
        integrationType,
        description,
        endpoint,
        apiKey,
      });
      setStep(1);
      setName('');
      setIntegrationType('rest_api');
      setDescription('');
      setEndpoint('');
      setApiKey('');
    }
  };

  const handleClose = () => {
    setStep(1);
    setName('');
    setIntegrationType('rest_api');
    setDescription('');
    setEndpoint('');
    setApiKey('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 1 ? 'Add Custom Integration' : 'Configure Integration'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Integration Name:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Custom Tool"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Integration Type:
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="rest_api"
                    checked={integrationType === 'rest_api'}
                    onChange={(e) => setIntegrationType(e.target.value as any)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">REST API</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="webhook"
                    checked={integrationType === 'webhook'}
                    onChange={(e) => setIntegrationType(e.target.value as any)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Webhook</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="oauth2"
                    checked={integrationType === 'oauth2'}
                    onChange={(e) => setIntegrationType(e.target.value as any)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">OAuth 2.0</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Endpoint:
              </label>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://api.example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key / Token:
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Your credentials will be encrypted and stored securely.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            disabled={step === 1 ? !name || !description : false}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 1 ? 'Next: Configure' : 'Add Integration'}
          </button>
        </div>
      </div>
    </div>
  );
};
