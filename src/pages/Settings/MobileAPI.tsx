import React, { useState } from 'react';
import {
  Smartphone, Code, Key, Globe, Zap, Shield, Book, Download, Copy, Eye,
  CheckCircle, AlertCircle, Activity, BarChart, Users, Settings, RefreshCw,
  Lock, Server, Database, Webhook, MessageSquare, Bell, Calendar, FileText
} from 'lucide-react';

const MobileAPI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mobile' | 'api' | 'docs' | 'monitoring'>('mobile');

  const tabs = [
    { id: 'mobile', label: 'Mobile App', icon: Smartphone },
    { id: 'api', label: 'API & SDKs', icon: Code },
    { id: 'docs', label: 'Documentation', icon: Book },
    { id: 'monitoring', label: 'Monitoring', icon: Activity }
  ];

  const mobileFeatures = [
    {
      icon: Smartphone,
      title: 'Progressive Web App (PWA)',
      description: 'Native app-like experience with offline capabilities, push notifications, and biometric authentication',
      status: 'Available'
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Real-time alerts for critical updates, deal changes, and task reminders',
      status: 'Available'
    },
    {
      icon: Database,
      title: 'Offline Sync',
      description: 'Work without internet connection with automatic data synchronization when online',
      status: 'Available'
    },
    {
      icon: Lock,
      title: 'Biometric Auth',
      description: 'Fingerprint and face recognition for secure mobile access',
      status: 'Available'
    }
  ];

  const apiEndpoints = [
    { method: 'GET', endpoint: '/api/v1/leads', description: 'List all leads with filtering and pagination' },
    { method: 'POST', endpoint: '/api/v1/leads', description: 'Create a new lead record' },
    { method: 'GET', endpoint: '/api/v1/deals/:id', description: 'Retrieve deal details by ID' },
    { method: 'PUT', endpoint: '/api/v1/deals/:id', description: 'Update existing deal' },
    { method: 'DELETE', endpoint: '/api/v1/leads/:id', description: 'Delete lead record' },
    { method: 'POST', endpoint: '/api/v1/activities', description: 'Log activity or interaction' },
    { method: 'GET', endpoint: '/api/v1/analytics/sales', description: 'Retrieve sales analytics data' },
    { method: 'POST', endpoint: '/api/v1/webhooks', description: 'Register webhook endpoint' }
  ];

  const sdkLanguages = [
    { name: 'JavaScript/TypeScript', icon: Code, status: 'Available', downloads: '5.2K' },
    { name: 'Python', icon: Code, status: 'Available', downloads: '3.8K' },
    { name: 'Java', icon: Code, status: 'Available', downloads: '2.1K' },
    { name: 'PHP', icon: Code, status: 'Available', downloads: '1.9K' },
    { name: 'Ruby', icon: Code, status: 'Beta', downloads: '845' },
    { name: 'Go', icon: Code, status: 'Beta', downloads: '672' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mobile & API Platform</h1>
              <p className="text-gray-600 mt-1">Mobile applications and developer APIs</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">1,247</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Mobile Users</div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Code className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">45</span>
            </div>
            <div className="text-sm font-medium text-gray-700">API Keys Active</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">2.5M</span>
            </div>
            <div className="text-sm font-medium text-gray-700">API Calls/Month</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <Webhook className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">18</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Active Webhooks</div>
          </div>

          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-teal-600" />
              <span className="text-2xl font-bold text-teal-600">99.9%</span>
            </div>
            <div className="text-sm font-medium text-gray-700">API Uptime</div>
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
        {/* Mobile App Tab */}
        {activeTab === 'mobile' && (
          <div className="p-6">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Mobile Application</h2>
              <p className="text-gray-600">Progressive Web App with native capabilities</p>
            </div>

            {/* Mobile Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {mobileFeatures.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            {feature.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Screenshots Section */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 border-2 border-dashed border-green-300">
              <div className="text-center">
                <Smartphone className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-gray-900 mb-2">Mobile-First CRM Experience</h4>
                <p className="text-gray-600 mb-6">
                  Full CRM functionality optimized for smartphones and tablets with touch-friendly interface
                </p>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900 text-sm">Lead Management</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <BarChart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900 text-sm">Deal Pipeline</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900 text-sm">Activities</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-900 text-sm">Analytics</div>
                  </div>
                </div>
                <button className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                  Install Mobile App
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API & SDKs Tab */}
        {activeTab === 'api' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">RESTful API & SDKs</h2>
              <p className="text-gray-600">Comprehensive API access for custom integrations</p>
            </div>

            {/* API Key Management */}
            <div className="mb-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">API Key Management</h3>
                  <p className="text-sm text-gray-600">Your primary API key for authentication</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>Generate New Key</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-4 py-3 bg-white rounded-lg border border-gray-300 font-mono text-sm">
                  bmi_live_sk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
                </code>
                <button className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Copy className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <RefreshCw className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* API Endpoints */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">API Endpoints</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apiEndpoints.map((endpoint, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                            endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                            endpoint.method === 'PUT' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {endpoint.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-gray-900">{endpoint.endpoint}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{endpoint.description}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            Try it →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SDK Libraries */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">SDK Libraries</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sdkLanguages.map((sdk, idx) => {
                  const Icon = sdk.icon;
                  return (
                    <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-6 w-6 text-gray-600" />
                          <h4 className="font-semibold text-gray-900">{sdk.name}</h4>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          sdk.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sdk.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">{sdk.downloads} downloads</div>
                      <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Install SDK</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Documentation Tab */}
        {activeTab === 'docs' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">API Documentation</h2>
              <p className="text-gray-600">Comprehensive guides and reference documentation</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Book className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Getting Started Guide</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Quick start tutorial for API authentication and first API call
                    </p>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Read Guide →
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Code className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">API Reference</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Complete endpoint documentation with request/response examples
                    </p>
                    <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                      Browse Reference →
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Authentication Guide</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      OAuth 2.0, JWT tokens, and API key authentication methods
                    </p>
                    <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                      Security Docs →
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Webhook className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Webhooks Documentation</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Real-time event notifications and webhook setup guide
                    </p>
                    <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                      Webhook Guide →
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Use Cases & Examples</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Real-world integration examples and code snippets
                    </p>
                    <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                      View Examples →
                    </button>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Error Handling</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Error codes, troubleshooting guides, and best practices
                    </p>
                    <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                      Error Reference →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Example Section */}
            <div className="mt-8 bg-gray-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Quick Start Example</h3>
                <button className="p-2 text-gray-400 hover:text-white">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
{`// Initialize BMI CRM API Client
const bmi = require('@bmi/crm-api');

const client = new bmi.Client({
  apiKey: 'your_api_key_here'
});

// Fetch leads with filters
const leads = await client.leads.list({
  status: 'new',
  limit: 10
});

// Create a new deal
const deal = await client.deals.create({
  name: 'Enterprise Contract',
  amount: 50000,
  stage: 'proposal'
});

console.log('Deal created:', deal.id);`}
              </pre>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">API Monitoring & Analytics</h2>
              <p className="text-gray-600">Track API usage, performance, and health metrics</p>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="text-center">
                  <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-gray-900">2.5M</div>
                  <div className="text-sm text-gray-600">API Calls This Month</div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="text-center">
                  <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-gray-900">142ms</div>
                  <div className="text-sm text-gray-600">Avg Response Time</div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-gray-900">99.9%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-gray-900">3</div>
                  <div className="text-sm text-gray-600">Errors Today</div>
                </div>
              </div>
            </div>

            {/* API Health Status */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">API Health Status</h3>
              <div className="space-y-3">
                {[
                  { service: 'Authentication API', status: 'Operational', uptime: '100%' },
                  { service: 'Leads API', status: 'Operational', uptime: '99.98%' },
                  { service: 'Deals API', status: 'Operational', uptime: '99.95%' },
                  { service: 'Webhook Delivery', status: 'Operational', uptime: '99.91%' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-900">{item.service}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-green-600 font-semibold">{item.status}</span>
                      <span className="text-sm text-gray-600">Uptime: {item.uptime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage by Endpoint */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Top API Endpoints</h3>
              <div className="space-y-3">
                {[
                  { endpoint: '/api/v1/leads', calls: 892340, percentage: 35 },
                  { endpoint: '/api/v1/deals', calls: 634520, percentage: 25 },
                  { endpoint: '/api/v1/activities', calls: 508416, percentage: 20 },
                  { endpoint: '/api/v1/analytics', calls: 381312, percentage: 15 }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-mono text-gray-700">{item.endpoint}</span>
                      <span className="text-sm font-semibold text-gray-900">{item.calls.toLocaleString()} calls</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileAPI;
