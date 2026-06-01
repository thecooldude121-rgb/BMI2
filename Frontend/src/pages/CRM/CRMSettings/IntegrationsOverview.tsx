import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, CheckCircle, Settings, XCircle, FileText, Upload, Activity } from 'lucide-react';

interface ConnectedIntegration {
  id: string;
  name: string;
  category: string;
  lastSync: string;
  syncDetails: string;
  icon: string;
}

const IntegrationsOverview: React.FC = () => {
  const navigate = useNavigate();
  const [showLogs, setShowLogs] = useState(false);

  const stats = {
    active: 5,
    available: 5,
    totalSyncs: 2450
  };

  const connectedIntegrations: ConnectedIntegration[] = [
    {
      id: 'apollo',
      name: 'Apollo.io',
      category: 'Lead Generation',
      lastSync: '2 minutes ago',
      syncDetails: '1,234 leads imported',
      icon: '🚀'
    },
    {
      id: 'gmail',
      name: 'Gmail',
      category: 'Email',
      lastSync: 'Just now',
      syncDetails: '45 emails today',
      icon: '📧'
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      category: 'Calendar',
      lastSync: '5 min ago',
      syncDetails: '12 meetings synced',
      icon: '📅'
    },
    {
      id: 'slack',
      name: 'Slack',
      category: 'Communication',
      lastSync: '1 min ago',
      syncDetails: '8 notifications sent',
      icon: '💬'
    },
    {
      id: 'zoom',
      name: 'Zoom',
      category: 'Video Meetings',
      lastSync: '10 min ago',
      syncDetails: '3 meetings today',
      icon: '📹'
    }
  ];

  const handleConfigure = (integration: ConnectedIntegration) => {
    console.log('Configuring', integration.name);
  };

  const handleDisconnect = (integration: ConnectedIntegration) => {
    if (confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      console.log('Disconnecting', integration.name);
    }
  };

  const handleViewAllIntegrations = () => {
    navigate('/crm/integrations');
  };

  const handleConnectNew = () => {
    navigate('/crm/integrations');
  };

  const handleImportLeads = () => {
    navigate('/crm/leads/import');
  };

  const handleViewLogs = () => {
    setShowLogs(!showLogs);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your connected apps and services</p>
        </div>
        <button
          onClick={handleViewAllIntegrations}
          className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-2"
        >
          Manage All
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">INTEGRATION OVERVIEW</h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-3xl font-bold text-gray-900">{stats.active}</div>
                <div className="text-sm text-gray-600 mt-1">Active</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-3xl font-bold text-gray-900">{stats.available}</div>
                <div className="text-sm text-gray-600 mt-1">Available</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-3xl font-bold text-gray-900">{stats.totalSyncs.toLocaleString()}</div>
                <div className="text-sm text-gray-600 mt-1">Syncs</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Connected Integrations:</h4>
              <div className="space-y-4">
                {connectedIntegrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{integration.icon}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-gray-900">
                              {integration.category} ({integration.name})
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Last sync: {integration.lastSync} | {integration.syncDetails}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfigure(integration)}
                          className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          Configure
                        </button>
                        <button
                          onClick={() => handleDisconnect(integration)}
                          className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={handleViewAllIntegrations}
                  className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  View All Integrations
                  <ExternalLink className="h-4 w-4" />
                </button>
                <p className="text-xs text-gray-500 mt-1">(Navigate to Screen 10.1)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">QUICK ACTIONS</h3>
          </div>

          <div className="p-6 space-y-3">
            <button
              onClick={handleConnectNew}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              + Connect New Integration
            </button>
            <p className="text-xs text-gray-500 text-center -mt-1">Navigate to Screen 10.1</p>

            <button
              onClick={handleImportLeads}
              className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Leads
            </button>
            <p className="text-xs text-gray-500 text-center -mt-1">Navigate to Screen 2.3</p>

            <button
              onClick={handleViewLogs}
              className="w-full px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Activity className="h-4 w-4" />
              View Integration Logs
            </button>
            <p className="text-xs text-gray-500 text-center -mt-1">Show integration activity history</p>
          </div>
        </div>

        {showLogs && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">INTEGRATION ACTIVITY LOGS</h3>
              <button
                onClick={() => setShowLogs(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Gmail sync completed</div>
                    <div className="text-xs text-gray-600">Just now - 45 emails synchronized</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Slack notification sent</div>
                    <div className="text-xs text-gray-600">1 minute ago - 8 notifications delivered</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Apollo.io sync completed</div>
                    <div className="text-xs text-gray-600">2 minutes ago - 1,234 leads imported</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Google Calendar sync completed</div>
                    <div className="text-xs text-gray-600">5 minutes ago - 12 meetings synchronized</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Zoom sync completed</div>
                    <div className="text-xs text-gray-600">10 minutes ago - 3 meetings synchronized</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  View Full Activity History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsOverview;
