import React from 'react';
import { AvailableIntegration } from '../../types/integrations';

interface AvailableIntegrationCardProps {
  integration: AvailableIntegration;
  onConnect: (integration: AvailableIntegration) => void;
  onLearnMore: (integration: AvailableIntegration) => void;
}

export const AvailableIntegrationCard: React.FC<AvailableIntegrationCardProps> = ({
  integration,
  onConnect,
  onLearnMore,
}) => {
  return (
    <div className="bg-white rounded-[8px] border border-[#e5e7eb] p-6 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:border-[#667eea] hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{integration.icon}</div>
          <div>
            <h3 className="text-[18px] font-semibold text-gray-900">{integration.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-[13px] text-gray-500">
                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                Available
              </span>
              {integration.isPremium && (
                <span className="text-[13px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                  Coming Soon
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-[14px] text-gray-700 mb-2">{integration.description}</p>
        </div>

        {integration.supportedTools.length > 0 && (
          <div>
            <p className="text-[13px] text-gray-500 mb-2">
              Connect {integration.type === 'hrms' ? 'ANY HRMS' :
                      integration.type === 'payment' ? 'ANY payment gateway' :
                      integration.type === 'e_signature' ? 'ANY e-signature' :
                      integration.type === 'storage' ? 'ANY storage' :
                      integration.type === 'analytics' ? 'ANY analytics platform' : 'ANY tool'}:
            </p>
            <ul className="space-y-1">
              {integration.supportedTools.map((tool, index) => (
                <li key={index} className="text-[14px] text-gray-700 flex items-center gap-2">
                  <span className="text-[#667eea]">•</span>
                  {tool}
                </li>
              ))}
            </ul>
          </div>
        )}

        {integration.benefits.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#e5e7eb]">
            {integration.benefits.map((benefit, index) => (
              <p key={index} className="text-[14px] text-gray-600 mb-2">
                {benefit}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-[#e5e7eb] pt-4">
        <button
          onClick={() => onConnect(integration)}
          disabled={integration.isPremium}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-medium rounded-lg transition-all duration-200 ${
            integration.isPremium
              ? 'text-gray-400 bg-gray-100 border border-[#e5e7eb] cursor-not-allowed'
              : 'text-white bg-[#667eea] hover:bg-[#5568d3]'
          }`}
        >
          <span>🔗</span>
          {integration.isPremium ? 'Coming Soon' : `Connect ${integration.type === 'hrms' ? 'HRMS' :
            integration.type === 'payment' ? 'Payment' :
            integration.type === 'e_signature' ? 'E-Signature' :
            integration.type === 'storage' ? 'Storage' :
            integration.type === 'analytics' ? 'Analytics' : ''}`}
        </button>

        <button
          onClick={() => onLearnMore(integration)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-medium text-gray-700 bg-gray-50 border border-[#e5e7eb] rounded-lg hover:bg-gray-100 transition-all duration-200"
        >
          <span>📖</span>
          Learn More
        </button>
      </div>
    </div>
  );
};
