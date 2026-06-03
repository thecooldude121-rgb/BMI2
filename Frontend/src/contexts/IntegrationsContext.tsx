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

  const fetchIntegrations = async () => {
    setIsLoading(true);
    try {
      const mockConnected: ConnectedIntegration[] = [
        {
          id: '1',
          type: 'lead_generation',
          name: 'LEAD GENERATION CONNECTOR',
          icon: '🎯',
          status: 'connected',
          currentProvider: {
            id: 'apollo',
            name: 'Apollo.io',
            authType: 'rest_api',
          },
          supportedProviders: [
            { id: 'apollo', name: 'Apollo.io', authType: 'rest_api' },
            { id: 'zoominfo', name: 'ZoomInfo', authType: 'rest_api' },
            { id: 'lusha', name: 'Lusha', authType: 'rest_api' },
            { id: 'custom', name: 'Custom API', authType: 'api_key' },
          ],
          authType: 'rest_api',
          sync: {
            lastSyncAt: new Date(Date.now() - 2 * 60 * 1000),
            syncCount: 1850,
            syncStatus: 'success',
          },
          stats: [
            { label: '1,850 leads imported', value: '' },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          type: 'email',
          name: 'EMAIL CONNECTOR',
          icon: '📧',
          status: 'connected',
          currentProvider: {
            id: 'gmail',
            name: 'Gmail',
            authType: 'oauth2',
          },
          supportedProviders: [
            { id: 'gmail', name: 'Gmail', authType: 'oauth2' },
            { id: 'outlook', name: 'Outlook', authType: 'oauth2' },
            { id: 'yahoo', name: 'Yahoo', authType: 'oauth2' },
            { id: 'custom', name: 'IMAP/SMTP', authType: 'imap_smtp' },
          ],
          authType: 'oauth2',
          sync: {
            lastSyncAt: new Date(Date.now() - 30 * 1000),
            syncCount: 320,
            syncStatus: 'success',
          },
          stats: [
            { label: '320 emails today', value: '' },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          type: 'calendar',
          name: 'CALENDAR CONNECTOR',
          icon: '📅',
          status: 'connected',
          currentProvider: {
            id: 'google-calendar',
            name: 'Google Calendar',
            authType: 'oauth',
          },
          supportedProviders: [
            { id: 'google-calendar', name: 'Google Calendar', authType: 'oauth' },
            { id: 'outlook-calendar', name: 'Outlook Calendar', authType: 'oauth' },
            { id: 'custom', name: 'CalDAV', authType: 'caldav' },
          ],
          authType: 'oauth',
          sync: {
            lastSyncAt: new Date(Date.now() - 5 * 60 * 1000),
            syncCount: 156,
            syncStatus: 'success',
          },
          stats: [
            { label: '156 meetings synced', value: '' },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '4',
          type: 'communication',
          name: 'COMMUNICATION CONNECTOR',
          icon: '💬',
          status: 'connected',
          currentProvider: {
            id: 'slack',
            name: 'Slack',
            authType: 'webhook',
          },
          supportedProviders: [
            { id: 'slack', name: 'Slack', authType: 'webhook' },
            { id: 'teams', name: 'Microsoft Teams', authType: 'webhook' },
            { id: 'discord', name: 'Discord', authType: 'webhook' },
            { id: 'custom', name: 'Custom Webhook', authType: 'webhook' },
          ],
          authType: 'webhook',
          sync: {
            lastSyncAt: new Date(Date.now() - 1 * 60 * 1000),
            syncCount: 89,
            syncStatus: 'success',
          },
          stats: [
            { label: '89 notifications sent', value: '' },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '5',
          type: 'video_meeting',
          name: 'VIDEO MEETING CONNECTOR',
          icon: '📞',
          status: 'connected',
          currentProvider: {
            id: 'zoom',
            name: 'Zoom',
            authType: 'oauth2',
          },
          supportedProviders: [
            { id: 'zoom', name: 'Zoom', authType: 'oauth2' },
            { id: 'google-meet', name: 'Google Meet', authType: 'oauth2' },
            { id: 'teams-meeting', name: 'Microsoft Teams', authType: 'oauth2' },
            { id: 'custom', name: 'Custom Meeting API', authType: 'api_key' },
          ],
          authType: 'oauth2',
          sync: {
            lastSyncAt: new Date(Date.now() - 10 * 60 * 1000),
            syncCount: 35,
            syncStatus: 'success',
          },
          stats: [
            { label: '35 meetings today', value: '' },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockAvailable: AvailableIntegration[] = [
        {
          id: 'hrms',
          type: 'hrms',
          name: 'HRMS CONNECTOR',
          icon: '🏢',
          status: 'available',
          isPremium: true,
          description: 'Auto-generate warm B2B leads from recruitment database',
          supportedTools: ['BambooHR', 'Workday', 'ADP, Greenhouse', 'Your custom HRMS via API/Webhook'],
          benefits: [
            '33% higher close rate vs cold leads',
            'Auto-generate warm B2B leads from recruitment database',
          ],
        },
        {
          id: 'payment',
          type: 'payment',
          name: 'PAYMENT CONNECTOR',
          icon: '💰',
          status: 'available',
          description: 'Track payments and invoices in CRM',
          supportedTools: ['Stripe', 'PayPal, Square', 'Any payment API'],
          benefits: [
            'Track payments and invoices in CRM',
            'Auto-update deal when payment made',
          ],
        },
        {
          id: 'e_signature',
          type: 'e_signature',
          name: 'E-SIGNATURE CONNECTOR',
          icon: '📝',
          status: 'available',
          description: 'Send contracts for signature and track completion',
          supportedTools: ['DocuSign', 'Adobe Sign', 'PandaDoc', 'Custom API'],
          benefits: [
            'Send contracts for signature and track completion',
            'Auto-update deal stage',
          ],
        },
        {
          id: 'storage',
          type: 'storage',
          name: 'STORAGE CONNECTOR',
          icon: '🗄️',
          status: 'available',
          description: 'Store documents and files automatically',
          supportedTools: ['Google Drive', 'Dropbox', 'OneDrive, Box', 'Custom storage API'],
          benefits: [
            'Store documents and files automatically',
            'Auto-attach to deals and contacts',
          ],
        },
        {
          id: 'analytics',
          type: 'analytics',
          name: 'ANALYTICS CONNECTOR',
          icon: '📊',
          status: 'available',
          description: 'Track website visits and conversions',
          supportedTools: ['Google Analytics', 'Mixpanel', 'Custom analytics'],
          benefits: [
            'Track website visits and conversions',
            'Link analytics data to leads/deals',
          ],
        },
      ];

      const mockApiCredentials: APICredentials = {
        apiKey: 'sk_live_abc123456789defghijklmnopqrstuvwxyz',
        webhookUrl: 'https://api.bmi-crm.com/webhooks/user_alex123',
        createdAt: new Date(),
      };

      setConnectedIntegrations(mockConnected);
      setAvailableIntegrations(mockAvailable);
      setApiCredentials(mockApiCredentials);
    } catch (error) {
      console.error('IntegrationsContext: Failed to load integrations:', error);
    } finally {
      setIsLoading(false);
    }
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

  const generateApiKey = async () => {
    const newApiKey = `sk_live_${Math.random().toString(36).substring(2)}`;
    const newWebhookUrl = `https://api.bmi-crm.com/webhooks/user_${Math.random().toString(36).substring(2, 8)}`;

    setApiCredentials({
      apiKey: newApiKey,
      webhookUrl: newWebhookUrl,
      createdAt: new Date(),
    });
  };

  const refreshApiKey = async () => {
    await generateApiKey();
  };

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
