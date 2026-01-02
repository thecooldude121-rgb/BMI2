import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Edit, Trash2, Search, Grid as GridIcon, List,
  ChevronRight, X, UserPlus, UserMinus, Filter, Check, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserGroup {
  id: string;
  name: string;
  description: string;
  parent_group_id: string | null;
  is_dynamic: boolean;
  dynamic_criteria: any;
  member_count?: number;
  created_at: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  added_at: string;
}

export const UserGroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    parent_group_id: null as string | null,
    is_dynamic: false,
    dynamic_criteria: {}
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_group_members')
        .select('*')
        .eq('group_id', groupId);

      if (error) throw error;

      const membersData: GroupMember[] = (data || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        user_name: `User ${m.user_id.slice(0, 8)}`,
        user_email: `user@example.com`,
        added_at: m.added_at
      }));

      setMembers(membersData);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const createGroup = async () => {
    if (!newGroup.name.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_groups')
        .insert([{
          name: newGroup.name,
          description: newGroup.description,
          parent_group_id: newGroup.parent_group_id,
          is_dynamic: newGroup.is_dynamic,
          dynamic_criteria: newGroup.dynamic_criteria
        }])
        .select()
        .single();

      if (error) throw error;

      setGroups([data, ...groups]);
      setShowCreateModal(false);
      setNewGroup({
        name: '',
        description: '',
        parent_group_id: null,
        is_dynamic: false,
        dynamic_criteria: {}
      });
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      setGroups(groups.filter(g => g.id !== groupId));
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setShowMembersPanel(false);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    } finally {
      setLoading(false);
    }
  };

  const openMembersPanel = (group: UserGroup) => {
    setSelectedGroup(group);
    setShowMembersPanel(true);
    loadGroupMembers(group.id);
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getNestedGroups = (parentId: string | null = null, level: number = 0): any[] => {
    return groups
      .filter(g => g.parent_group_id === parentId)
      .map(group => ({
        ...group,
        level,
        children: getNestedGroups(group.id, level + 1)
      }));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Groups</h2>
            <p className="text-sm text-gray-600 mt-1">Manage user groups and memberships</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Create new group"
          >
            <Plus className="h-5 w-5" />
            <span>Create Group</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search groups"
            />
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <GridIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading && groups.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Users className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Create your first user group to get started'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Group
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => openMembersPanel(group)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      {group.is_dynamic && (
                        <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full mt-1">
                          Dynamic
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGroup(group);
                        setShowCreateModal(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Edit group"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGroup(group.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="Delete group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {group.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">{group.member_count || 0} members</span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Group Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGroups.map((group) => (
                  <tr
                    key={group.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => openMembersPanel(group)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-900">{group.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{group.description || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {group.is_dynamic ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                          Dynamic
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          Static
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {group.member_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroup(group);
                            setShowCreateModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                          aria-label="Edit group"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGroup(group.id);
                          }}
                          className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                          aria-label="Delete group"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedGroup ? 'Edit Group' : 'Create New Group'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedGroup(null);
                }}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Sales Team"
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the group's purpose"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGroup.is_dynamic}
                    onChange={(e) => setNewGroup({ ...newGroup, is_dynamic: e.target.checked })}
                    className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Dynamic Group</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Automatically add users based on criteria
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedGroup(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                disabled={!newGroup.name.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {loading ? 'Saving...' : selectedGroup ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMembersPanel && selectedGroup && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{selectedGroup.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{members.length} members</p>
            </div>
            <button
              onClick={() => setShowMembersPanel(false)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
              aria-label="Close panel"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
              <UserPlus className="h-5 w-5" />
              <span>Add Members</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Users className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600">No members in this group</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {member.user_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.user_name}</p>
                        <p className="text-xs text-gray-500">{member.user_email}</p>
                      </div>
                    </div>
                    <button
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label="Remove member"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
