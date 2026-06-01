import React, { useState } from 'react';
import { 
  X, Users, Trash2, Edit, Mail, Tag, Archive, 
  Target, DollarSign, Calendar, AlertTriangle, Check 
} from 'lucide-react';
import { Pipeline } from '../../types/deals';

interface BulkActionsBarProps {
  selectedCount: number;
  onAction: (action: string, dealIds: string[], params?: any) => Promise<void>;
  onClear: () => void;
  users: any[];
  pipelines: Pipeline[];
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onAction,
  onClear,
  users,
  pipelines
}) => {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleAction = async (action: string, params?: any) => {
    setIsLoading(true);
    try {
      await onAction(action, [], params);
      // Close modals
      setShowTransferModal(false);
      setShowStageModal(false);
      setShowTagModal(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newTags.includes(tagInput.trim())) {
      setNewTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const bulkActions = [
    {
      id: 'transfer',
      label: 'Transfer Owner',
      icon: Users,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => setShowTransferModal(true)
    },
    {
      id: 'stage',
      label: 'Change Stage',
      icon: Target,
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => setShowStageModal(true)
    },
    {
      id: 'tag',
      label: 'Add Tags',
      icon: Tag,
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => setShowTagModal(true)
    },
    {
      id: 'email',
      label: 'Send Email',
      icon: Mail,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      onClick: () => console.log('Send bulk email')
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: Archive,
      color: 'bg-gray-600 hover:bg-gray-700',
      onClick: () => handleAction('archive')
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      color: 'bg-red-600 hover:bg-red-700',
      onClick: () => setShowDeleteConfirm(true)
    }
  ];

  return (
    <>
      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4 z-40">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              {selectedCount} deal{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex space-x-2">
            {bulkActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  disabled={isLoading}
                  className={`flex items-center px-3 py-2 text-white rounded-lg text-sm transition-colors disabled:opacity-50 ${action.color}`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {action.label}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={onClear}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Transfer Owner Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Transfer Ownership</h3>
              <button onClick={() => setShowTransferModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Owner
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select new owner...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('transfer', { newOwnerId: selectedUser })}
                disabled={!selectedUser || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Transfer {selectedCount} Deal{selectedCount > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Stage Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Change Stage</h3>
              <button onClick={() => setShowStageModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pipeline
                </label>
                <select
                  value={selectedPipeline}
                  onChange={(e) => {
                    setSelectedPipeline(e.target.value);
                    setSelectedStage('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select pipeline...</option>
                  {pipelines.map(pipeline => (
                    <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
                  ))}
                </select>
              </div>
              
              {selectedPipeline && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stage
                  </label>
                  <div className="space-y-2">
                    {pipelines.find(p => p.id === selectedPipeline)?.stages.map(stage => (
                      <button
                        key={stage.id}
                        onClick={() => setSelectedStage(stage.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          selectedStage === stage.id
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          <span className="font-medium text-gray-900">{stage.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{stage.probability}%</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowStageModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('update-stage', { newStageId: selectedStage })}
                disabled={!selectedStage || isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                Update {selectedCount} Deal{selectedCount > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tags Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add Tags</h3>
              <button onClick={() => setShowTagModal(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags to Add
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {newTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tag name..."
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowTagModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('add-tags', { tags: newTags })}
                disabled={newTags.length === 0 || isLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                Add Tags to {selectedCount} Deal{selectedCount > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete {selectedCount} deal{selectedCount > 1 ? 's' : ''}? 
              This will permanently remove all associated data including activities, emails, and attachments.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('delete')}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : `Delete ${selectedCount} Deal${selectedCount > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActionsBar;