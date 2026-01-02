import React, { useState } from 'react';
import { X, Star, Bell, Folder, Tag, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchCriteria: {
    filters: Record<string, any>;
    query?: string;
  };
  resultCount: number;
  onSaved?: () => void;
}

const PREDEFINED_TAGS = [
  'Sales', 'Marketing', 'Research', 'Q1 Campaign', 'Q2 Campaign',
  'Enterprise', 'SMB', 'High Priority', 'Follow-up', 'Cold Outreach'
];

const FOLDERS = [
  { value: 'personal', label: 'Personal' },
  { value: 'team', label: 'Team Shared' },
  { value: 'client', label: 'Client Research' }
];

const SaveSearchModal: React.FC<SaveSearchModalProps> = ({
  isOpen,
  onClose,
  searchCriteria,
  resultCount,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [folder, setFolder] = useState('personal');
  const [isFavorite, setIsFavorite] = useState(false);
  const [createAlert, setCreateAlert] = useState(false);
  const [alertFrequency, setAlertFrequency] = useState('daily');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag && !selectedTags.includes(customTag)) {
      setSelectedTags([...selectedTags, customTag]);
      setCustomTag('');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a search name');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Save to Supabase
      const { data, error: saveError } = await supabase
        .from('saved_searches')
        .insert([
          {
            name: name.trim(),
            description: description.trim() || null,
            criteria: searchCriteria,
            result_count: resultCount,
            tags: selectedTags,
            folder,
            is_favorite: isFavorite,
            run_count: 0,
            last_run_at: null
          }
        ])
        .select()
        .single();

      if (saveError) throw saveError;

      // If create alert is enabled, create alert
      if (createAlert && data) {
        await supabase
          .from('search_alerts')
          .insert([
            {
              saved_search_id: data.id,
              name: `Alert: ${name}`,
              frequency: alertFrequency,
              delivery_channels: ['in_app'],
              threshold_count: 1,
              is_active: true
            }
          ]);
      }

      // Show success notification
      if (onSaved) onSaved();
      onClose();

      // Reset form
      setName('');
      setDescription('');
      setSelectedTags([]);
      setFolder('personal');
      setIsFavorite(false);
      setCreateAlert(false);
    } catch (err: any) {
      console.error('Error saving search:', err);
      setError(err.message || 'Failed to save search');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Save Search</h2>
            <p className="text-sm text-gray-600 mt-1">
              ~{resultCount.toLocaleString()} prospects match your criteria
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Search Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Search Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Enterprise CTOs in SaaS"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this search..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                placeholder="Add custom tag..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addCustomTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <Tag className="h-4 w-4" />
              </button>
            </div>

            {/* Selected Custom Tags */}
            {selectedTags.filter(t => !PREDEFINED_TAGS.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTags
                  .filter(t => !PREDEFINED_TAGS.includes(t))
                  .map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center"
                    >
                      {tag}
                      <button
                        onClick={() => toggleTag(tag)}
                        className="ml-2 hover:text-green-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Folder */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              <Folder className="h-4 w-4 inline mr-1" />
              Folder
            </label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {FOLDERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Set as Favorite */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Star className={`h-5 w-5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
              <div>
                <div className="font-semibold text-gray-900">Set as Favorite</div>
                <div className="text-sm text-gray-600">Quick access from favorites tab</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Create Alert */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Bell className={`h-5 w-5 ${createAlert ? 'text-blue-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-semibold text-gray-900">Create Alert</div>
                  <div className="text-sm text-gray-600">Get notified of new matches</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={createAlert}
                  onChange={(e) => setCreateAlert(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {createAlert && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Frequency
                </label>
                <select
                  value={alertFrequency}
                  onChange={(e) => setAlertFrequency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="realtime">Real-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Search
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSearchModal;
