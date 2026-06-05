import React, { useEffect, useRef, useState } from 'react';
import { Briefcase, Award, UserCheck } from 'lucide-react';
import { getUsers } from '../../../utils/dealsApi';
import { DealTag } from '../../../config/dealTags';
import { DealTagBrowserModal } from './DealTagBrowserModal';

interface DealFormOwnershipProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  validationErrors?: Record<string, string>;
}

export const DealFormOwnership: React.FC<DealFormOwnershipProps> = ({
  formData,
  onChange,
  validationErrors = {},
}) => {
  const [owners, setOwners] = useState<any[]>([]);

  // ── Tag modal state ────────────────────────────────────────────────────────
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [customTags, setCustomTags] = useState<DealTag[]>([]);
  const browseTagsBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    getUsers().then((users) => {
      setOwners(users);
      if ((!formData.owner || formData.owner === 'current-user') && users.length > 0) {
        onChange('owner', `${users[0].first_name} ${users[0].last_name}`);
      }
    }).catch(() => {});
  }, []);

  const sources = [
    { id: 'lead-gen-apollo',  name: 'Lead Gen (Apollo.io)' },
    { id: 'lead-gen-zoominfo', name: 'Lead Gen (ZoomInfo)' },
    { id: 'hrms',             name: '🏢 HRMS (Recruitment)' },
    { id: 'website',          name: 'Website (Contact Form)' },
    { id: 'manual',           name: 'Manual Entry' },
    { id: 'referral',         name: 'Referral' },
    { id: 'event',            name: 'Event/Trade Show' },
    { id: 'partner',          name: 'Partner' },
    { id: 'inbound',          name: 'Inbound Marketing' },
    { id: 'cold-outreach',    name: 'Cold Outreach' },
    { id: 'other',            name: 'Other' },
  ];

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const popularTags = ['Enterprise', 'SaaS', 'High Value', 'Hot', 'Warm', 'Cold', 'Fast Track'];

  // ── Tag handlers ───────────────────────────────────────────────────────────
  const handleAddTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      onChange('tags', [...formData.tags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    onChange('tags', formData.tags.filter((t: string) => t !== tag));
  };

  const openTagModal = () => {
    setTagModalOpen(true);
  };

  const closeTagModal = () => {
    setTagModalOpen(false);
    // Restore focus to the button that opened the modal
    setTimeout(() => browseTagsBtnRef.current?.focus(), 0);
  };

  const applyTagsFromModal = (tags: string[]) => {
    onChange('tags', tags);
    closeTagModal();
  };

  const handleCreateCustomTag = (tag: DealTag) => {
    setCustomTags(prev => [...prev, tag]);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 lg:p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-4 lg:mb-6 pb-3 border-b border-gray-100">
        <div className="p-2 bg-purple-50 rounded-lg">
          <UserCheck className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">Ownership & Tracking</h2>
          <p className="text-xs text-gray-500">Owner, source, priority and tags</p>
        </div>
      </div>

      <div className="space-y-4 lg:space-y-5">
        {/* Deal Owner */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deal Owner: <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.owner}
            onChange={(e) => onChange('owner', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select owner…</option>
            {owners.map((u) => (
              <option key={u.id} value={`${u.first_name} ${u.last_name}`}>
                {u.first_name} {u.last_name} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source: <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.source}
            onChange={(e) => onChange('source', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
              validationErrors.source
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          >
            <option value="">Select source...</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>{source.name}</option>
            ))}
          </select>
          {validationErrors.source && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.source}</p>
          )}
        </div>

        {/* HRMS Connection Details */}
        {formData.source === 'hrms' && (
          <div className="p-5 bg-gradient-to-br from-orange-50 via-orange-50 to-yellow-50 rounded-xl border-2 border-orange-300 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="h-6 w-6 text-orange-600" />
              <h3 className="text-base font-bold text-orange-900">🏢 HRMS Connection Detected!</h3>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-300">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="h-5 w-5 text-green-700" />
                  <span className="text-sm font-bold text-green-900">💡 Warm Intro Advantage!</span>
                </div>
                <div className="text-sm text-green-800 space-y-1">
                  <div>
                    <span className="font-bold">{formData.hrmsConnection?.recruited || 'Sarah Lee'} (CFO)</span>
                    {' '}was recruited from <span className="font-bold">TechStart</span> on{' '}
                    <span className="font-bold">Nov 14, 2024</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-green-300">
                    Historical data: <span className="font-bold text-green-900">33% higher close rate!</span>
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    Recommended: Use this warm intro advantage in your outreach
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-900 mb-1">Recruited Person:</label>
                <select
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  value={formData.hrmsConnection?.recruited || ''}
                  onChange={(e) => onChange('hrmsConnection', { ...formData.hrmsConnection, recruited: e.target.value })}
                >
                  <option value="Sarah Lee">Sarah Lee</option>
                  <option value="Mike Chen">Mike Chen</option>
                  <option value="David Kumar">David Kumar</option>
                  <option value="Emily Wong">Emily Wong</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-900 mb-1">Recruitment Date:</label>
                <input
                  type="date"
                  value={formData.hrmsConnection?.recruitmentDate || '2024-11-14'}
                  onChange={(e) => onChange('hrmsConnection', { ...formData.hrmsConnection, recruitmentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
              </div>

              <button
                type="button"
                className="w-full px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors shadow-sm"
              >
                View Full HRMS Details →
              </button>
            </div>
          </div>
        )}

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority:</label>
          <select
            value={formData.priority}
            onChange={(e) => onChange('priority', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags:</label>

          {/* Selected tag chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Popular tag quick-add chips */}
          <div className="text-sm text-gray-600 mb-2">Popular tags:</div>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                disabled={formData.tags.includes(tag)}
                className="px-3 py-1 bg-gray-50 text-gray-700 text-sm rounded-full hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Browse All Tags — fixed: type="button" prevents form submission */}
          <button
            ref={browseTagsBtnRef}
            type="button"
            onClick={openTagModal}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Browse All Tags
          </button>
        </div>
      </div>

      {/* Tag Browser Modal */}
      <DealTagBrowserModal
        isOpen={tagModalOpen}
        currentTags={formData.tags}
        customTags={customTags}
        onApply={applyTagsFromModal}
        onClose={closeTagModal}
        onCreateCustomTag={handleCreateCustomTag}
      />
    </div>
  );
};
