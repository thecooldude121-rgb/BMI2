import React from 'react';
import { ConnectedIntegration } from '../../types/integrations';

interface IntegrationCardProps {
  integration: ConnectedIntegration;
  onConfigure: (integration: ConnectedIntegration) => void;
  onSwitch: (integration: ConnectedIntegration) => void;
  onDisconnect: (integration: ConnectedIntegration) => void;
  onAction?: (integration: ConnectedIntegration) => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onConfigure,
  onSwitch,
  onDisconnect,
  onAction,
}) => {
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:border-[#667eea] hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{integration.icon}</div>
          <div>
            <h3 className="text-[18px] font-semibold text-gray-900">{integration.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-[13px] text-[#10b981]">
                <span className="w-2 h-2 bg-[#10b981] rounded-full"></span>
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-[13px] text-gray-500 mb-1">Currently using:</p>
          <p className="text-[16px] font-bold text-gray-900">{integration.currentProvider.name}</p>
        </div>

        <div>
          <p className="text-[13px] text-gray-500 mb-1">Type:</p>
          <p className="text-[14px] text-gray-700">{integration.authType.replace('_', ' ').toUpperCase()}</p>
        </div>

        <div>
          <p className="text-[13px] text-gray-500 mb-1">Last sync:</p>
          <p className="text-[14px] text-gray-700">{getTimeAgo(integration.sync.lastSyncAt)}</p>
        </div>

        {integration.stats.map((stat, index) => (
          <div key={index}>
            <p className="text-[13px] text-gray-700">{stat.label}: <span className="font-medium">{stat.value}</span></p>
          </div>
        ))}

        <div>
          <p className="text-[13px] text-gray-500 mb-1">Supports:</p>
          <p className="text-[14px] text-gray-700">
            {integration.supportedProviders.slice(0, 3).map(p => p.name).join(', ')}
            {integration.supportedProviders.length > 3 && ', or ANY custom API'}
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-[#e5e7eb] pt-4">
        <button
          onClick={() => onConfigure(integration)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-medium text-gray-700 bg-gray-50 border border-[#e5e7eb] rounded-lg hover:bg-gray-100 transition-all duration-200"
        >
          <span>⚙️</span>
          Configure
        </button>

        <button
          onClick={() => onSwitch(integration)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-medium text-[#667eea] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all duration-200"
        >
          <span>🔄</span>
          Switch Tool
        </button>

        <button
          onClick={() => onDisconnect(integration)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all duration-200"
        >
          <span>🔌</span>
          Disconnect
        </button>

        {onAction && integration.type === 'lead_generation' && (
          <button
            onClick={() => onAction(integration)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-medium text-[#10b981] bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all duration-200"
          >
            <span>📥</span>
            Import Leads
          </button>
        )}
      </div>
    </div>
  );
};
