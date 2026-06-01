import React, { useState } from 'react';
import { Settings, Tag, X, Users } from 'lucide-react';

interface CRMSettingsSectionProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

const CRMSettingsSection: React.FC<CRMSettingsSectionProps> = ({
  formData,
  onChange,
  onAddTag,
  onRemoveTag,
}) => {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
    }
  };

  const popularTags = ['FinTech', 'SaaS', 'Series A', 'High Growth', 'Enterprise', 'SMB', 'Hot Lead'];

  return (
    <>
      {/* Tech Stack */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-xl mr-2">⚡</span>
          Tech Stack
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Infrastructure
            </label>
            <input
              type="text"
              value={formData.infrastructure}
              onChange={(e) => onChange('infrastructure', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="AWS, Docker, Kubernetes"
            />
            <p className="mt-1 text-xs text-gray-500">Separate with commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CRM & Sales Tools
            </label>
            <input
              type="text"
              value={formData.crmTools}
              onChange={(e) => onChange('crmTools', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Salesforce, HubSpot"
            />
            {formData.crmTools.toLowerCase().includes('salesforce') && (
              <p className="mt-1 text-xs text-yellow-600 flex items-center">
                🎯 Using Salesforce = Opportunity to switch!
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Development Tools
            </label>
            <input
              type="text"
              value={formData.devTools}
              onChange={(e) => onChange('devTools', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="GitHub, Jira, Slack"
            />
          </div>
        </div>
      </div>

      {/* CRM Settings */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-blue-600" />
          CRM Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Owner <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.accountOwner}
              onChange={(e) => onChange('accountOwner', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Alex Rodriguez">Alex Rodriguez</option>
              <option value="Sarah Chen">Sarah Chen</option>
              <option value="Mike Johnson">Mike Johnson</option>
              <option value="Emily Davis">Emily Davis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.accountStatus}
              onChange={(e) => onChange('accountStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Prospect">Prospect</option>
              <option value="Customer">Customer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => onChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => onRemoveTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Add tag"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Tag className="h-4 w-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-2">Popular tags:</p>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => onAddTag(tag)}
                    disabled={formData.tags.includes(tag)}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Source
            </label>
            <select
              value={formData.accountSource}
              onChange={(e) => onChange('accountSource', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Lead Gen">Lead Gen</option>
              <option value="HRMS (Recruitment)">HRMS (Recruitment)</option>
              <option value="Manual">Manual</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Partner">Partner</option>
              <option value="Event">Event</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={formData.hasHRMSConnection}
                onChange={(e) => onChange('hasHRMSConnection', e.target.checked)}
                className="mr-2"
              />
              <span className="font-medium text-gray-700">This account has HRMS connection</span>
            </label>
            {formData.hasHRMSConnection && (
              <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm">
                View HRMS Details
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notes & Attachments */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-xl mr-2">📝</span>
          Notes & Attachments
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
              placeholder="Add notes about this account..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <button className="flex items-center justify-center space-x-2 mx-auto text-blue-600 hover:text-blue-700">
                <span className="text-2xl">📎</span>
                <span className="font-medium">Upload Files</span>
              </button>
              <p className="text-xs text-gray-500 mt-2">
                (or drag & drop here)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supported: PDF, DOC, XLS, PNG, JPG (Max 25MB)
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CRMSettingsSection;
