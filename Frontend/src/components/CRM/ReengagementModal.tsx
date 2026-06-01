import React, { useState } from 'react';
import { X, Mail, Phone, MessageSquare } from 'lucide-react';

interface ReengagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  onLaunch: (campaign: any) => void;
}

const ReengagementModal: React.FC<ReengagementModalProps> = ({
  isOpen,
  onClose,
  contactName,
  onLaunch
}) => {
  const [selectedCampaign, setSelectedCampaign] = useState('email');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const campaigns = [
    {
      id: 'email',
      name: 'Email Sequence',
      icon: Mail,
      description: 'Send a 3-part email sequence over 2 weeks'
    },
    {
      id: 'call',
      name: 'Phone Outreach',
      icon: Phone,
      description: 'Schedule call with personalized talking points'
    },
    {
      id: 'combined',
      name: 'Multi-Channel',
      icon: MessageSquare,
      description: 'Combine email, calls, and LinkedIn touches'
    }
  ];

  const handleLaunch = () => {
    onLaunch({
      type: selectedCampaign,
      message,
      contactName
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Re-engage Contact</h2>
            <p className="text-sm text-gray-600 mt-1">{contactName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Campaign Type
            </label>
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const Icon = campaign.icon;
                return (
                  <div
                    key={campaign.id}
                    onClick={() => setSelectedCampaign(campaign.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedCampaign === campaign.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-lg ${
                          selectedCampaign === campaign.id
                            ? 'bg-blue-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            selectedCampaign === campaign.id
                              ? 'text-blue-600'
                              : 'text-gray-600'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {campaign.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {campaign.description}
                        </p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                          selectedCampaign === campaign.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedCampaign === campaign.id && (
                          <div className="h-2 w-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a personalized message to include in the campaign..."
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Campaign Preview</h3>
            <p className="text-sm text-yellow-800">
              This campaign will be launched immediately and tracked in your Sequences dashboard.
              You'll receive notifications for any responses.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Launch Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReengagementModal;
