import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ConnectedIntegration,
  AvailableIntegration,
  CustomIntegration,
  IntegrationStats,
  APICredentials,
  IntegrationProvider,
} from '../types/integrations';

interface IntegrationsContextType {
  connectedIntegrations: ConnectedIntegration[];
  availableIntegrations: AvailableIntegration[];
  customIntegrations: CustomIntegration[];
  stats: IntegrationStats;
  apiCredentials: APICredentials | null;
  isLoading: boolean;
  connectIntegration: (integration: AvailableIntegration, config: Record<string, any>) => Promise<void>;
  disconnectIntegration: (integrationId: string) => Promise<void>;
  configureIntegration: (integrationId: string, config: Record<string, any>) => Promise<void>;
  switchProvider: (integrationId: string, provider: IntegrationProvider) => Promise<void>;
  generateApiKey: () => Promise<void>;
  refreshApiKey: () => Promise<void>;
  fetchIntegrations: () => Promise<void>;
}

const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

export const useIntegrations = () => {
  const context = useContext(IntegrationsContext);
  if (!context) {
    throw new Error('useIntegrations must be used within IntegrationsProvider');
  }
  return context;
};

export const IntegrationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([]);
  const [availableIntegrations, setAvailableIntegrations] = useState<AvailableIntegration[]>([]);
  const [customIntegrations, setCustomIntegrations] = useState<CustomIntegration[]>([]);
  const [apiCredentials, setApiCredentials] = useState<APICredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const stats: IntegrationStats = {
    activeConnectors: connectedIntegrations.length,
    availableConnectors: availableIntegrations.length,
    totalSyncsToday: connectedIntegrations.reduce((sum, int) => sum + int.sync.syncCount, 0),
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  // PHASE 2: there is no integrations backend. This used to synthesise the whole
  // subsystem in place: two connectors reported status 'connected' (Apollo.io and
  // an email provider) while wired to nothing, a catalogue of "available"
  // connectors, and an APICredentials object carrying a literal
  // sk_live_... key plus a webhook URL. Those were rendered into inputs with
  // copy-to-clipboard buttons, so the fake secret could be carried out of the app
  // into a config file or a ticket, where it is indistinguishable from a real
  // leaked key. All three setters ran inside the try unconditionally, so the catch
  // never had anything to catch.
  //
  // Empty until a real endpoint exists. IntegrationsHub guards its panels on
  // length and its credentials block on apiCredentials being non-null, so an
  // honest empty state renders instead of a specimen.
  const fetchIntegrations = async () => {
    setIsLoading(true);
    setConnectedIntegrations([]);
    setAvailableIntegrations([]);
    setApiCredentials(null);
    setIsLoading(false);
  };

  const connectIntegration = async (integration: AvailableIntegration, config: Record<string, any>) => {
    const newConnected: ConnectedIntegration = {
      id: Date.now().toString(),
      type: integration.type,
      name: integration.name,
      icon: integration.icon,
      status: 'connected',
      currentProvider: {
        id: config.provider.toLowerCase().replace(/\s+/g, '-'),
        name: config.provider,
        authType: 'api_key',
      },
      supportedProviders: integration.supportedTools.map(tool => ({
        id: tool.toLowerCase().replace(/\s+/g, '-'),
        name: tool,
        authType: 'api_key',
      })),
      authType: 'api_key',
      sync: {
        lastSyncAt: new Date(),
        syncCount: 0,
        syncStatus: 'success',
      },
      stats: [],
      config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConnectedIntegrations(prev => [...prev, newConnected]);
    setAvailableIntegrations(prev => prev.filter(i => i.id !== integration.id));
  };

  const disconnectIntegration = async (integrationId: string) => {
    const integration = connectedIntegrations.find(i => i.id === integrationId);
    if (integration) {
      const availableVersion: AvailableIntegration = {
        id: integration.type,
        type: integration.type,
        name: integration.name,
        icon: integration.icon,
        status: 'available',
        description: '',
        supportedTools: integration.supportedProviders.map(p => p.name),
        benefits: [],
      };
      setAvailableIntegrations(prev => [...prev, availableVersion]);
    }
    setConnectedIntegrations(prev => prev.filter(i => i.id !== integrationId));
  };

  const configureIntegration = async (integrationId: string, config: Record<string, any>) => {
    setConnectedIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, config: { ...integration.config, ...config }, updatedAt: new Date() }
          : integration
      )
    );
  };

  const switchProvider = async (integrationId: string, provider: IntegrationProvider) => {
    setConnectedIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? {
              ...integration,
              currentProvider: provider,
              authType: provider.authType,
              updatedAt: new Date(),
            }
          : integration
      )
    );
  };

  // These minted a credential client-side — an "sk_live_" prefix concatenated with
  // Math.random().toString(36) — and set it as the user's live API key. A key issued by the browser is not a
  // key: nothing server-side would ever accept it, and a user who copied it out of
  // the "regenerate" flow would be carrying a plausible-looking secret that
  // authenticates nothing. Issuing credentials is a server responsibility and no
  // endpoint exists, so this throws rather than fabricating. It is unreachable
  // from the UI today: IntegrationsHub renders the credentials block, including
  // the regenerate control, only when `apiCredentials` is non-null, and it stays
  // null above.
  const notImplemented = () => {
    throw new Error(
      'API credentials are issued by the backend, and no endpoint exists yet. ' +
      'Refusing to generate a key client-side — see FABRICATED_DATA_AUDIT.md (F22).'
    );
  };

  const generateApiKey = async () => notImplemented();

  const refreshApiKey = async () => notImplemented();

  return (
    <IntegrationsContext.Provider
      value={{
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
        generateApiKey,
        refreshApiKey,
        fetchIntegrations,
      }}
    >
      {children}
    </IntegrationsContext.Provider>
  );
};
