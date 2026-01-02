import React, { useState } from 'react';
import {
  Zap, Webhook, Globe, Database, RefreshCw, CheckCircle, XCircle, AlertTriangle,
  Plus, Trash2, Edit, Play, Pause, Copy, Eye, EyeOff, Download, Upload, Settings,
  Search, Filter, Clock, TrendingUp, Activity, Mail, MessageSquare, BarChart,
  Cloud, DollarSign, Share2, HelpCircle, Code, Link, Save, TestTube, X, Info,
  ArrowRight, Package, Star, Users, Shield, ChevronRight, ExternalLink
} from 'lucide-react';

interface Webhook {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  type: 'outbound' | 'inbound';
  events: string[];
  authType: 'none' | 'api_key' | 'bearer' | 'oauth';
  authValue?: string;
  headers: Record<string, string>;
  payload: string;
  retryAttempts: number;
  retryBackoff: 'linear' | 'exponential';
  enabled: boolean;
  lastTriggered?: string;
  successRate: number;
  totalCalls: number;
  createdAt: string;
}

interface APIConnection {
  id: string;
  name: string;
  baseUrl: string;
  authType: 'api_key' | 'bearer' | 'basic' | 'oauth2';
  authConfig: Record<string, any>;
  headers: Record<string, string>;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  timeout: number;
  enabled: boolean;
  lastUsed?: string;
  totalRequests: number;
  avgResponseTime: number;
  healthStatus: 'healthy' | 'degraded' | 'down';
  createdAt: string;
}

interface PlatformIntegration {
  id: string;
  name: string;
  category: 'email' | 'communication' | 'analytics' | 'storage' | 'payment' | 'social' | 'support' | 'marketing';
  description: string;
  icon: string;
  provider: string;
  installed: boolean;
  configured: boolean;
  version: string;
  rating: number;
  reviews: number;
  features: string[];
  requiresOAuth: boolean;
  pricing: 'free' | 'paid' | 'freemium';
}

interface DataSync {
  id: string;
  name: string;
  sourceSystem: string;
  targetSystem: string;
  syncType: 'one_way' | 'bi_directional';
  direction: 'push' | 'pull' | 'both';
  schedule: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'manual';
  fieldMapping: Record<string, string>;
  lastSync?: string;
  nextSync?: string;
  recordsSynced: number;
  errors: number;
  status: 'active' | 'paused' | 'error';
  enabled: boolean;
}

const Integrations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'webhooks' | 'api' | 'platforms' | 'sync' | 'marketplace'>('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showAPIModal, setShowAPIModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: '1',
      name: 'Lead Created Notification',
      url: 'https://api.slack.com/webhooks/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
      method: 'POST',
      type: 'outbound',
      events: ['lead.created', 'lead.converted'],
      authType: 'bearer',
      headers: { 'Content-Type': 'application/json' },
      payload: '{"text": "New lead created: {{lead.name}}"}',
      retryAttempts: 3,
      retryBackoff: 'exponential',
      enabled: true,
      lastTriggered: '2024-01-21T15:30:00Z',
      successRate: 98.5,
      totalCalls: 1234,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Deal Updated to CRM',
      url: 'https://crm.company.com/api/deals/update',
      method: 'PUT',
      type: 'outbound',
      events: ['deal.updated', 'deal.stage_changed'],
      authType: 'api_key',
      authValue: 'sk_live_*********************',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': '***' },
      payload: '{"id": "{{deal.id}}", "stage": "{{deal.stage}}"}',
      retryAttempts: 5,
      retryBackoff: 'exponential',
      enabled: true,
      lastTriggered: '2024-01-21T14:00:00Z',
      successRate: 99.2,
      totalCalls: 856,
      createdAt: '2024-01-10T09:00:00Z'
    }
  ]);

  const [apiConnections, setApiConnections] = useState<APIConnection[]>([
    {
      id: '1',
      name: 'Stripe Payment API',
      baseUrl: 'https://api.stripe.com/v1',
      authType: 'bearer',
      authConfig: { token: 'sk_live_*********************' },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      rateLimit: { requestsPerMinute: 100, requestsPerHour: 1000 },
      timeout: 30000,
      enabled: true,
      lastUsed: '2024-01-21T16:00:00Z',
      totalRequests: 5432,
      avgResponseTime: 245,
      healthStatus: 'healthy',
      createdAt: '2024-01-05T10:00:00Z'
    },
    {
      id: '2',
      name: 'SendGrid Email API',
      baseUrl: 'https://api.sendgrid.com/v3',
      authType: 'api_key',
      authConfig: { apiKey: 'SG.*********************' },
      headers: { 'Content-Type': 'application/json' },
      rateLimit: { requestsPerMinute: 600, requestsPerHour: 10000 },
      timeout: 15000,
      enabled: true,
      lastUsed: '2024-01-21T15:45:00Z',
      totalRequests: 12456,
      avgResponseTime: 180,
      healthStatus: 'healthy',
      createdAt: '2024-01-08T14:00:00Z'
    }
  ]);

  const [platformIntegrations] = useState<PlatformIntegration[]>([
    {
      id: '1',
      name: 'Slack',
      category: 'communication',
      description: 'Send notifications and manage team communications directly from your CRM',
      icon: '💬',
      provider: 'Slack Technologies',
      installed: true,
      configured: true,
      version: '2.4.0',
      rating: 4.8,
      reviews: 2341,
      features: ['Real-time notifications', 'Two-way messaging', 'Channel integration', 'Bot commands'],
      requiresOAuth: true,
      pricing: 'free'
    },
    {
      id: '2',
      name: 'Mailchimp',
      category: 'email',
      description: 'Sync contacts and automate email marketing campaigns',
      icon: '📧',
      provider: 'Intuit Mailchimp',
      installed: true,
      configured: true,
      version: '3.1.2',
      rating: 4.6,
      reviews: 1876,
      features: ['Contact sync', 'Campaign automation', 'Analytics', 'List management'],
      requiresOAuth: true,
      pricing: 'freemium'
    },
    {
      id: '3',
      name: 'Stripe',
      category: 'payment',
      description: 'Process payments and manage subscriptions',
      icon: '💳',
      provider: 'Stripe Inc',
      installed: true,
      configured: true,
      version: '1.8.5',
      rating: 4.9,
      reviews: 3542,
      features: ['Payment processing', 'Subscription management', 'Invoice generation', 'Refunds'],
      requiresOAuth: false,
      pricing: 'paid'
    },
    {
      id: '4',
      name: 'Google Analytics',
      category: 'analytics',
      description: 'Track and analyze customer behavior and campaign performance',
      icon: '📊',
      provider: 'Google LLC',
      installed: false,
      configured: false,
      version: '4.2.1',
      rating: 4.7,
      reviews: 4123,
      features: ['Event tracking', 'Custom reports', 'User segmentation', 'Goal tracking'],
      requiresOAuth: true,
      pricing: 'free'
    },
    {
      id: '5',
      name: 'Zoom',
      category: 'communication',
      description: 'Schedule and manage video meetings with leads and customers',
      icon: '📹',
      provider: 'Zoom Video Communications',
      installed: false,
      configured: false,
      version: '5.0.3',
      rating: 4.5,
      reviews: 1654,
      features: ['Meeting scheduling', 'Recording integration', 'Calendar sync', 'Participant tracking'],
      requiresOAuth: true,
      pricing: 'freemium'
    },
    {
      id: '6',
      name: 'Zendesk',
      category: 'support',
      description: 'Connect support tickets with CRM records for better customer service',
      icon: '🎫',
      provider: 'Zendesk Inc',
      installed: false,
      configured: false,
      version: '2.9.0',
      rating: 4.4,
      reviews: 2876,
      features: ['Ticket sync', 'Customer history', 'SLA tracking', 'Agent collaboration'],
      requiresOAuth: true,
      pricing: 'paid'
    },
    {
      id: '7',
      name: 'HubSpot',
      category: 'marketing',
      description: 'Bi-directional sync with HubSpot CRM and marketing automation',
      icon: '🎯',
      provider: 'HubSpot Inc',
      installed: false,
      configured: false,
      version: '3.5.1',
      rating: 4.6,
      reviews: 3241,
      features: ['Contact sync', 'Deal pipeline', 'Email tracking', 'Marketing automation'],
      requiresOAuth: true,
      pricing: 'freemium'
    },
    {
      id: '8',
      name: 'LinkedIn',
      category: 'social',
      description: 'Enrich lead data and track social engagement',
      icon: '👔',
      provider: 'LinkedIn Corporation',
      installed: false,
      configured: false,
      version: '1.4.2',
      rating: 4.3,
      reviews: 1432,
      features: ['Profile enrichment', 'Lead generation', 'InMail integration', 'Company insights'],
      requiresOAuth: true,
      pricing: 'paid'
    }
  ]);

  const [dataSyncs, setDataSyncs] = useState<DataSync[]>([
    {
      id: '1',
      name: 'Salesforce Contact Sync',
      sourceSystem: 'BMI CRM',
      targetSystem: 'Salesforce',
      syncType: 'bi_directional',
      direction: 'both',
      schedule: 'hourly',
      fieldMapping: {
        'email': 'Email',
        'firstName': 'FirstName',
        'lastName': 'LastName',
        'phone': 'Phone'
      },
      lastSync: '2024-01-21T15:00:00Z',
      nextSync: '2024-01-21T16:00:00Z',
      recordsSynced: 1245,
      errors: 3,
      status: 'active',
      enabled: true
    },
    {
      id: '2',
      name: 'Mailchimp Audience Sync',
      sourceSystem: 'BMI CRM',
      targetSystem: 'Mailchimp',
      syncType: 'one_way',
      direction: 'push',
      schedule: 'daily',
      fieldMapping: {
        'email': 'email_address',
        'firstName': 'FNAME',
        'lastName': 'LNAME'
      },
      lastSync: '2024-01-21T02:00:00Z',
      nextSync: '2024-01-22T02:00:00Z',
      recordsSynced: 8432,
      errors: 12,
      status: 'active',
      enabled: true
    }
  ]);

  const handleTestWebhook = async (id: string) => {
    setTestingConnection(id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert('Webhook test successful! Response: 200 OK');
    setTestingConnection(null);
  };

  const handleTestAPI = async (id: string) => {
    setTestingConnection(id);
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert('API connection test successful! Response time: 245ms');
    setTestingConnection(null);
  };

  const handleInstallIntegration = (integration: PlatformIntegration) => {
    if (integration.requiresOAuth) {
      alert(`Redirecting to ${integration.name} OAuth authorization...`);
    } else {
      alert(`Installing ${integration.name}... Please configure API credentials.`);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      email: Mail,
      communication: MessageSquare,
      analytics: BarChart,
      storage: Cloud,
      payment: DollarSign,
      social: Share2,
      support: HelpCircle,
      marketing: TrendingUp
    };
    return icons[category] || Package;
  };

  const filteredIntegrations = platformIntegrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const tabs = [
    { id: 'marketplace', label: 'Marketplace', icon: Package },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'api', label: 'API Connections', icon: Globe },
    { id: 'platforms', label: 'My Integrations', icon: Zap },
    { id: 'sync', label: 'Data Sync', icon: RefreshCw }
  ];

  const categories = [
    { id: 'all', label: 'All', icon: Package },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    { id: 'payment', label: 'Payment', icon: DollarSign },
    { id: 'marketing', label: 'Marketing', icon: TrendingUp },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'social', label: 'Social', icon: Share2 }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
              <p className="text-gray-600 mt-1">Connect your CRM with third-party applications and services</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {platformIntegrations.filter(p => p.installed).length}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Installed</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Webhook className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{webhooks.filter(w => w.enabled).length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active Webhooks</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Globe className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{apiConnections.filter(a => a.enabled).length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">API Connections</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <RefreshCw className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{dataSyncs.filter(s => s.enabled).length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active Syncs</div>
          </div>

          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
              <span className="text-2xl font-bold text-teal-600">
                {webhooks.reduce((acc, w) => acc + w.totalCalls, 0) + apiConnections.reduce((acc, a) => acc + a.totalRequests, 0)}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Total API Calls</div>
          </div>
        </div>
      </div>

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
        {/* Integration Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <div className="p-6">
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search integrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                        selectedCategory === category.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{category.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Integration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => {
                const CategoryIcon = getCategoryIcon(integration.category);
                return (
                  <div
                    key={integration.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-4xl">{integration.icon}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                          <p className="text-xs text-gray-500">{integration.provider}</p>
                        </div>
                      </div>
                      {integration.installed && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Installed
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{integration.description}</p>

                    {/* Rating */}
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(integration.rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {integration.rating} ({integration.reviews})
                      </span>
                    </div>

                    {/* Features */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {integration.features.slice(0, 3).map((feature, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {feature}
                          </span>
                        ))}
                        {integration.features.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{integration.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleInstallIntegration(integration)}
                      className={`w-full py-2 rounded-lg font-medium transition-colors ${
                        integration.installed
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {integration.installed ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Settings className="h-4 w-4" />
                          <span>Configure</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Plus className="h-4 w-4" />
                          <span>Install</span>
                        </div>
                      )}
                    </button>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center space-x-2">
                        <CategoryIcon className="h-3 w-3" />
                        <span className="capitalize">{integration.category}</span>
                      </div>
                      <span className="capitalize">{integration.pricing}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredIntegrations.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No integrations found</p>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Webhook Management</h2>
                <p className="text-gray-600">Configure outbound and inbound webhooks for real-time data exchange</p>
              </div>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowWebhookModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Webhook</span>
              </button>
            </div>

            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className={`border rounded-lg p-6 transition-all ${
                    webhook.enabled
                      ? 'border-gray-200 bg-white hover:shadow-md'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          webhook.type === 'outbound' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <Webhook className={`h-5 w-5 ${
                            webhook.type === 'outbound' ? 'text-blue-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{webhook.name}</h3>
                          <p className="text-sm text-gray-600 font-mono">{webhook.url}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <span className="text-sm text-gray-600">Method:</span>
                          <span className="ml-2 font-semibold text-gray-900">{webhook.method}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Type:</span>
                          <span className="ml-2 font-semibold text-gray-900 capitalize">{webhook.type}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Auth:</span>
                          <span className="ml-2 font-semibold text-gray-900 capitalize">
                            {webhook.authType.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Events */}
                      <div className="mt-4">
                        <span className="text-sm font-semibold text-gray-700 mb-2 block">Trigger Events:</span>
                        <div className="flex flex-wrap gap-2">
                          {webhook.events.map((event, idx) => (
                            <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Success Rate</div>
                          <div className="text-2xl font-bold text-green-600">{webhook.successRate}%</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Total Calls</div>
                          <div className="text-2xl font-bold text-blue-600">{webhook.totalCalls}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Last Triggered</div>
                          <div className="text-sm font-medium text-gray-900">
                            {webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleString() : 'Never'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleTestWebhook(webhook.id)}
                        disabled={testingConnection === webhook.id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Test Webhook"
                      >
                        {testingConnection === webhook.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(webhook);
                          setShowWebhookModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setWebhooks(webhooks.map(w =>
                            w.id === webhook.id ? { ...w, enabled: !w.enabled } : w
                          ));
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          webhook.enabled
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={webhook.enabled ? 'Disable' : 'Enable'}
                      >
                        {webhook.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this webhook?')) {
                            setWebhooks(webhooks.filter(w => w.id !== webhook.id));
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {webhooks.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No webhooks configured</p>
                  <p className="text-sm text-gray-500 mt-1">Create your first webhook to start receiving real-time notifications</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* API Connections Tab */}
        {activeTab === 'api' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">API Connection Manager</h2>
                <p className="text-gray-600">Manage REST API connections and authentication</p>
              </div>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowAPIModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add API Connection</span>
              </button>
            </div>

            <div className="space-y-4">
              {apiConnections.map((api) => (
                <div
                  key={api.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          api.healthStatus === 'healthy' ? 'bg-green-100' :
                          api.healthStatus === 'degraded' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          <Globe className={`h-5 w-5 ${
                            api.healthStatus === 'healthy' ? 'text-green-600' :
                            api.healthStatus === 'degraded' ? 'text-yellow-600' :
                            'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{api.name}</h3>
                          <p className="text-sm text-gray-600 font-mono">{api.baseUrl}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          api.healthStatus === 'healthy' ? 'bg-green-100 text-green-800' :
                          api.healthStatus === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {api.healthStatus.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div>
                          <span className="text-sm text-gray-600">Auth Type:</span>
                          <span className="ml-2 font-semibold text-gray-900 capitalize">
                            {api.authType.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Rate Limit:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {api.rateLimit.requestsPerMinute}/min
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Timeout:</span>
                          <span className="ml-2 font-semibold text-gray-900">{api.timeout}ms</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Total Requests:</span>
                          <span className="ml-2 font-semibold text-gray-900">{api.totalRequests}</span>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center space-x-6">
                        <div>
                          <div className="text-xs text-gray-600">Avg Response Time</div>
                          <div className="text-lg font-bold text-blue-600">{api.avgResponseTime}ms</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Last Used</div>
                          <div className="text-sm font-medium text-gray-900">
                            {api.lastUsed ? new Date(api.lastUsed).toLocaleString() : 'Never'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleTestAPI(api.id)}
                        disabled={testingConnection === api.id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Test Connection"
                      >
                        {testingConnection === api.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(api);
                          setShowAPIModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this API connection?')) {
                            setApiConnections(apiConnections.filter(a => a.id !== api.id));
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Integrations Tab */}
        {activeTab === 'platforms' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">My Integrations</h2>
              <p className="text-gray-600">Manage your installed platform integrations</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platformIntegrations.filter(p => p.installed).map((integration) => {
                const CategoryIcon = getCategoryIcon(integration.category);
                return (
                  <div
                    key={integration.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-4xl">{integration.icon}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                          <p className="text-xs text-gray-500">v{integration.version}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        integration.configured
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {integration.configured ? 'Active' : 'Setup Required'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

                    <div className="flex space-x-2">
                      <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                        Settings
                      </button>
                      <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {platformIntegrations.filter(p => p.installed).length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No integrations installed</p>
                <p className="text-sm text-gray-500 mt-1">Browse the marketplace to install integrations</p>
              </div>
            )}
          </div>
        )}

        {/* Data Sync Tab */}
        {activeTab === 'sync' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Data Synchronization</h2>
                <p className="text-gray-600">Manage data sync between BMI CRM and external systems</p>
              </div>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowSyncModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Sync</span>
              </button>
            </div>

            <div className="space-y-4">
              {dataSyncs.map((sync) => (
                <div
                  key={sync.id}
                  className={`border rounded-lg p-6 transition-all ${
                    sync.status === 'active' ? 'border-gray-200 bg-white' :
                    sync.status === 'paused' ? 'border-gray-200 bg-gray-50 opacity-60' :
                    'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          sync.status === 'active' ? 'bg-green-100' :
                          sync.status === 'paused' ? 'bg-gray-100' :
                          'bg-red-100'
                        }`}>
                          <RefreshCw className={`h-5 w-5 ${
                            sync.status === 'active' ? 'text-green-600' :
                            sync.status === 'paused' ? 'text-gray-600' :
                            'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{sync.name}</h3>
                          <p className="text-sm text-gray-600">
                            {sync.sourceSystem} {sync.direction === 'both' ? '↔' : '→'} {sync.targetSystem}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <span className="ml-2 font-semibold text-gray-900 capitalize">
                            {sync.syncType.replace('_', '-')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Schedule:</span>
                          <span className="ml-2 font-semibold text-gray-900 capitalize">
                            {sync.schedule.replace('_', ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Records Synced:</span>
                          <span className="ml-2 font-semibold text-green-600">{sync.recordsSynced}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Errors:</span>
                          <span className={`ml-2 font-semibold ${sync.errors > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {sync.errors}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-xs text-gray-600">
                        <span>Last sync: {sync.lastSync ? new Date(sync.lastSync).toLocaleString() : 'Never'}</span>
                        <span>•</span>
                        <span>Next sync: {sync.nextSync ? new Date(sync.nextSync).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => alert('Manual sync started...')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Sync Now"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(sync);
                          setShowSyncModal(true);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDataSyncs(dataSyncs.map(s =>
                            s.id === sync.id
                              ? { ...s, status: s.status === 'active' ? 'paused' : 'active' }
                              : s
                          ));
                        }}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title={sync.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {sync.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this sync?')) {
                            setDataSyncs(dataSyncs.filter(s => s.id !== sync.id));
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Integrations;
