import React, { useState, useEffect } from 'react';
import { X, Plus, Tag, Check } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
  category: string;
}

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTags: string[];
  availableTags: Tag[];
  onSave: (tags: string[]) => void;
  onCreateTag?: (name: string, color: string, category: string) => void;
}

export const TagManagementModal: React.FC<TagManagementModalProps> = ({
  isOpen,
  onClose,
  currentTags,
  availableTags,
  onSave,
  onCreateTag
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [newTagCategory, setNewTagCategory] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    setSelectedTags(currentTags);
  }, [currentTags]);

  if (!isOpen) return null;

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleSave = () => {
    onSave(selectedTags);
    onClose();
  };

  const handleCreateTag = () => {
    if (newTagName.trim() && onCreateTag) {
      onCreateTag(newTagName.trim(), newTagColor, newTagCategory.trim());
      setSelectedTags([...selectedTags, newTagName.trim()]);
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setNewTagCategory('');
      setShowCreateForm(false);
    }
  };

  const categories = Array.from(new Set(availableTags.map(t => t.category).filter(Boolean)));

  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Indigo', value: '#6366F1' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Tags</h2>
            <p className="text-sm text-gray-600 mt-1">Select or create tags for this prospect</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase">Available Tags</h3>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Tag
              </button>
            </div>

            {showCreateForm && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tag Name</label>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Enter tag name..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map(color => (
                        <button
                          key={color.value}
                          onClick={() => setNewTagColor(color.value)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            newTagColor === color.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category (optional)</label>
                    <input
                      type="text"
                      value={newTagCategory}
                      onChange={(e) => setNewTagCategory(e.target.value)}
                      placeholder="e.g., Industry, Size, Priority..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      Create Tag
                    </button>
                  </div>
                </div>
              </div>
            )}

            {categories.map(category => (
              <div key={category} className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter(tag => tag.category === category)
                    .map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.name)}
                        className={`flex items-center px-3 py-1.5 rounded-lg border-2 transition-all ${
                          selectedTags.includes(tag.name)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm text-gray-700">{tag.name}</span>
                        {selectedTags.includes(tag.name) && (
                          <Check className="h-4 w-4 text-blue-600 ml-2" />
                        )}
                      </button>
                    ))}
                </div>
              </div>
            ))}

            {availableTags.filter(tag => !tag.category).length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Other</h4>
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter(tag => !tag.category)
                    .map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.name)}
                        className={`flex items-center px-3 py-1.5 rounded-lg border-2 transition-all ${
                          selectedTags.includes(tag.name)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm text-gray-700">{tag.name}</span>
                        {selectedTags.includes(tag.name) && (
                          <Check className="h-4 w-4 text-blue-600 ml-2" />
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Tags ({selectedTags.length})</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTags.length === 0 ? (
                <p className="text-sm text-gray-500">No tags selected</p>
              ) : (
                selectedTags.map(tagName => {
                  const tag = availableTags.find(t => t.name === tagName);
                  return (
                    <span
                      key={tagName}
                      className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: tag?.color ? `${tag.color}20` : '#E5E7EB',
                        color: tag?.color || '#4B5563'
                      }}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tagName}
                    </span>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Tags
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagManagementModal;
