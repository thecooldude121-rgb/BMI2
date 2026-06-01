import React, { useState } from 'react';
import { 
  X, Plus, Eye, Edit, Trash2, Save, Star, Users, 
  Lock, Globe, Search, Filter, Settings 
} from 'lucide-react';
import { CustomView, DealFilters, DealColumn } from '../../types/deals';

interface CustomViewManagerProps {
  views: CustomView[];
  activeView: string;
  onViewChange: (viewId: string) => void;
  onViewSave: (view: CustomView) => void;
  onClose: () => void;
}

const CustomViewManager: React.FC<CustomViewManagerProps> = ({
  views,
  activeView,
  onViewChange,
  onViewSave,
  onClose
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingView, setEditingView] = useState<CustomView | null>(null);
  const [newViewName, setNewViewName] = useState('');
  const [newViewDescription, setNewViewDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const predefinedViews = [
    {
      id: 'all-deals',
      name: 'All Deals',
      description: 'View all deals across all pipelines',
      icon: Eye,
      isDefault: true
    },
    {
      id: 'my-deals',
      name: 'My Deals',
      description: 'Deals assigned to me',
      icon: Users,
      isDefault: true
    },
    {
      id: 'high-value',
      name: 'High Value Deals',
      description: 'Deals over $50,000',
      icon: Star,
      isDefault: true
    },
    {
      id: 'closing-soon',
      name: 'Closing This Month',
      description: 'Deals expected to close within 30 days',
      icon: Filter,
      isDefault: true
    },
    {
      id: 'at-risk',
      name: 'At Risk Deals',
      description: 'Deals that need attention',
      icon: Filter,
      isDefault: true
    }
  ];

  const handleCreateView = () => {
    if (!newViewName.trim()) return;

    const newView: CustomView = {
      id: `view-${Date.now()}`,
      name: newViewName,
      description: newViewDescription,
      filters: {},
      columns: [],
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      isDefault: false,
      isPublic,
      createdBy: 'current-user',
      createdAt: new Date().toISOString()
    };

    onViewSave(newView);
    setShowCreateForm(false);
    setNewViewName('');
    setNewViewDescription('');
    setIsPublic(false);
  };

  const handleDeleteView = (viewId: string) => {
    if (confirm('Are you sure you want to delete this view?')) {
      // In a real app, this would call an API to delete the view
      console.log('Deleting view:', viewId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Views</h2>
            <p className="text-gray-600">Create and manage custom deal views</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create View
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Create View Form */}
          {showCreateForm && (
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New View</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    View Name *
                  </label>
                  <input
                    type="text"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter view name..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={newViewDescription}
                    onChange={(e) => setNewViewDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Describe this view..."
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="public-view"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="public-view" className="ml-2 text-sm text-gray-700">
                    Make this view public (visible to all team members)
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateView}
                    disabled={!newViewName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create View
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Predefined Views */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Views</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predefinedViews.map((view) => {
                const Icon = view.icon;
                return (
                  <button
                    key={view.id}
                    onClick={() => onViewChange(view.id)}
                    className={`p-4 border rounded-xl text-left transition-all hover:shadow-md ${
                      activeView === view.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        activeView === view.id ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          activeView === view.id ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{view.name}</h4>
                        <p className="text-sm text-gray-600">{view.description}</p>
                      </div>
                      {view.isDefault && (
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                          System
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Views */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Views</h3>
            {views.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No custom views</h3>
                <p className="text-gray-600 mb-6">Create custom views to save your favorite filters and layouts</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Create Your First View
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {views.map((view) => (
                  <div
                    key={view.id}
                    className={`p-4 border rounded-xl transition-all hover:shadow-md ${
                      activeView === view.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{view.name}</h4>
                          {view.isPublic ? (
                            <Globe className="h-4 w-4 text-green-600" title="Public view" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-400" title="Private view" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{view.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created {new Date(view.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onViewChange(view.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Apply View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingView(view)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit View"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteView(view.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete View"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* View Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {Object.keys(view.filters).length} filter{Object.keys(view.filters).length !== 1 ? 's' : ''}
                      </span>
                      <span>
                        {view.columns.filter(c => c.visible).length} column{view.columns.filter(c => c.visible).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomViewManager;