export type IntegrationStatus = 'connected' | 'available' | 'disconnected';

export type IntegrationType =
  | 'lead_generation'
  | 'email'
  | 'calendar'
  | 'communication'
  | 'video_meeting'
  | 'hrms'
  | 'payment'
  | 'e_signature'
  | 'storage'
  | 'analytics'
  | 'custom';

export type AuthType = 'oauth' | 'oauth2' | 'api_key' | 'webhook' | 'rest_api' | 'imap_smtp' | 'caldav';

export interface IntegrationProvider {
  id: string;
  name: string;
  logo?: string;
  authType: AuthType;
  isDefault?: boolean;
}

export interface IntegrationSync {
  lastSyncAt: Date;
  syncCount: number;
  syncStatus: 'success' | 'failed' | 'pending';
  syncMessage?: string;
}

export interface ConnectedIntegration {
  id: string;
  type: IntegrationType;
  name: string;
  icon: string;
  status: 'connected';
  currentProvider: IntegrationProvider;
  supportedProviders: IntegrationProvider[];
  authType: AuthType;
  sync: IntegrationSync;
  stats: {
    label: string;
    value: string | number;
  }[];
  config?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailableIntegration {
  id: string;
  type: IntegrationType;
  name: string;
  icon: string;
  status: 'available';
  isPremium?: boolean;
  description: string;
  supportedTools: string[];
  benefits: string[];
  features?: string[];
}

export interface CustomIntegration {
  id: string;
  name: string;
  icon: string;
  type: 'custom';
  status: IntegrationStatus;
  authType: AuthType;
  apiEndpoint?: string;
  webhookUrl?: string;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type Integration = ConnectedIntegration | AvailableIntegration | CustomIntegration;

export interface IntegrationConfig {
  apiKey?: string;
  webhookUrl?: string;
  endpoint?: string;
  credentials?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface IntegrationStats {
  activeConnectors: number;
  availableConnectors: number;
  totalSyncsToday: number;
}

export interface APICredentials {
  apiKey: string;
  webhookUrl: string;
  createdAt: Date;
  expiresAt?: Date;
}
