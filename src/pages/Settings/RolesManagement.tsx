import React, { useState, useEffect } from 'react';
import {
  Users, ChevronDown, ChevronRight, Plus, Copy, Trash2, Edit2,
  Save, X, Search, AlertCircle, CheckCircle, Shield, Clock,
  User, Calendar, FileText, Eye, EyeOff, Info, Move, List, GitBranch, ArrowLeft
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { SystemRole } from '../../types/settings';
import { RolePermissionEditor } from '../../components/Permissions/RolePermissionEditor';
import { RoleHierarchyView } from '../../components/Permissions/RoleHierarchyView';
import BreadcrumbNav, { BreadcrumbItem } from '../../components/navigation/BreadcrumbNav';

interface RoleNode extends SystemRole {
  children: RoleNode[];
  expanded?: boolean;
}

interface PermissionSummary {
  direct: number;
  inherited: number;
  total: number;
  conflicts: number;
}

const RolesManagement: React.FC = () => {
  const {
    roles,
    permissions,
    fetchRoles,
    fetchPermissions,
    createRole,
    updateRole,
    deleteRole,
    getRoleHierarchy
  } = useSettings();

  const [roleTree, setRoleTree] = useState<RoleNode[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');
  const [settingsHome, setSettingsHome] = useState<(() => void) | undefined>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [parentRoleForNew, setParentRoleForNew] = useState<string | null>(null);
  const [draggedRole, setDraggedRole] = useState<RoleNode | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showPermissionEditor, setShowPermissionEditor] = useState(false);
  const [editedRole, setEditedRole] = useState<Partial<SystemRole>>({});
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    description: '',
    business_unit: '',
    parent_role_id: ''
  });
  const [nameError, setNameError] = useState('');
  const [parentError, setParentError] = useState('');
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    buildRoleTree();
  }, [roles]);

  const loadData = async () => {
    await fetchRoles();
    await fetchPermissions();
  };

  const buildRoleTree = () => {
    const roleMap = new Map<string, RoleNode>();
    const tree: RoleNode[] = [];

    roles.forEach(role => {
      roleMap.set(role.id, { ...role, children: [], expanded: true });
    });

    roles.forEach(role => {
      const node = roleMap.get(role.id);
      if (node) {
        if (role.parent_role_id && roleMap.has(role.parent_role_id)) {
          roleMap.get(role.parent_role_id)!.children.push(node);
        } else {
          tree.push(node);
        }
      }
    });

    setRoleTree(tree);
  };

  const toggleExpand = (roleId: string) => {
    const toggleNode = (nodes: RoleNode[]): RoleNode[] => {
      return nodes.map(node => {
        if (node.id === roleId) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children.length > 0) {
          return { ...node, children: toggleNode(node.children) };
        }
        return node;
      });
    };
    setRoleTree(toggleNode(roleTree));
  };

  const handleSelectRole = (role: RoleNode) => {
    setSelectedRole(role);
    setEditedRole(role);
    setIsEditing(false);
    setShowPermissions(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedRole) return;

    const success = await updateRole(selectedRole.id, editedRole);
    if (success) {
      setIsEditing(false);
      await fetchRoles();
      const updatedRole = roles.find(r => r.id === selectedRole.id);
      if (updatedRole) {
        setSelectedRole({ ...updatedRole, children: selectedRole.children });
      }
    }
  };

  const handleSavePermissions = async (permissions: Record<string, any>): Promise<boolean> => {
    if (!selectedRole) return false;

    try {
      const success = await updateRole(selectedRole.id, { permissions });
      if (success) {
        await fetchRoles();
        const updatedRole = roles.find(r => r.id === selectedRole.id);
        if (updatedRole) {
          setSelectedRole({ ...updatedRole, children: selectedRole.children });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving permissions:', error);
      return false;
    }
  };

  const validateRoleName = (name: string): boolean => {
    setNameError('');

    if (!name.trim()) {
      setNameError('⚠️ Role name is required');
      return false;
    }

    const duplicateRole = roles.find(
      r => r.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (duplicateRole) {
      setNameError('A role with this name already exists');
      return false;
    }

    return true;
  };

  const validateParentRole = (parentId: string): boolean => {
    setParentError('');

    if (!parentId) return true;

    const parent = roles.find(r => r.id === parentId);
    if (!parent) {
      setParentError('Invalid parent role');
      return false;
    }

    return true;
  };

  const handleRoleNameChange = (name: string) => {
    setNewRoleData({ ...newRoleData, name });
    setNameError('');

    if (name.trim().length > 0) {
      const suggestions = roles
        .map(r => r.name)
        .filter(n => n.toLowerCase().includes(name.toLowerCase()))
        .slice(0, 5);
      setRoleSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleCreateRole = async () => {
    if (!validateRoleName(newRoleData.name)) return;

    const parentId = newRoleData.parent_role_id || parentRoleForNew;
    if (parentId && !validateParentRole(parentId)) return;

    try {
      const result = await createRole({
        name: newRoleData.name.trim(),
        description: newRoleData.description,
        parent_role_id: parentId || undefined,
        business_unit: newRoleData.business_unit || undefined,
        hierarchy_level: 1,
        permissions: {},
        restrictions: {}
      });

      if (result) {
        setShowCreateModal(false);
        setNewRoleData({ name: '', description: '', business_unit: '', parent_role_id: '' });
        setParentRoleForNew(null);
        setNameError('');
        setParentError('');
        await fetchRoles();
      }
    } catch (error: any) {
      if (error.message?.includes('Circular')) {
        setParentError('Circular parent reference detected. This would create an infinite loop.');
      } else if (error.message?.includes('duplicate')) {
        setNameError('A role with this name already exists');
      } else {
        console.error('Error creating role:', error);
      }
    }
  };

  const handleCloneRole = async () => {
    if (!selectedRole) return;

    const result = await createRole({
      name: `${selectedRole.name} (Copy)`,
      description: selectedRole.description,
      parent_role_id: selectedRole.parent_role_id,
      hierarchy_level: selectedRole.hierarchy_level,
      permissions: { ...selectedRole.permissions },
      restrictions: { ...selectedRole.restrictions }
    });

    if (result) {
      setShowCloneModal(false);
      await fetchRoles();
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    if (selectedRole.children.length > 0) {
      alert('Cannot delete a role with child roles. Please reassign or delete child roles first.');
      return;
    }

    const success = await deleteRole(selectedRole.id);
    if (success) {
      setShowDeleteModal(false);
      setSelectedRole(null);
      await fetchRoles();
    }
  };

  const handleCreateChildRole = (parentRole: RoleNode) => {
    setParentRoleForNew(parentRole.id);
    setShowCreateModal(true);
  };

  const detectCycle = (roleId: string, newParentId: string): boolean => {
    let currentId: string | undefined = newParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === roleId) return true;
      if (visited.has(currentId)) return false;
      visited.add(currentId);

      const parent = roles.find(r => r.id === currentId);
      currentId = parent?.parent_role_id;
    }

    return false;
  };

  const handleDragStart = (role: RoleNode) => {
    setDraggedRole(role);
  };

  const handleDrop = async (targetRole: RoleNode) => {
    if (!draggedRole || draggedRole.id === targetRole.id) return;

    if (detectCycle(draggedRole.id, targetRole.id)) {
      alert('Cannot move role: This would create a circular hierarchy.');
      setDraggedRole(null);
      return;
    }

    const success = await updateRole(draggedRole.id, {
      parent_role_id: targetRole.id,
      hierarchy_level: targetRole.hierarchy_level + 1
    });

    if (success) {
      await fetchRoles();
    }
    setDraggedRole(null);
  };

  const getPermissionSummary = (role: RoleNode): PermissionSummary => {
    const directPerms = Object.keys(role.permissions || {}).length;
    let inheritedPerms = 0;
    let currentParentId = role.parent_role_id;

    while (currentParentId) {
      const parent = roles.find(r => r.id === currentParentId);
      if (parent) {
        inheritedPerms += Object.keys(parent.permissions || {}).length;
        currentParentId = parent.parent_role_id;
      } else {
        break;
      }
    }

    return {
      direct: directPerms,
      inherited: inheritedPerms,
      total: directPerms + inheritedPerms,
      conflicts: 0
    };
  };

  const filterRoles = (nodes: RoleNode[], query: string): RoleNode[] => {
    if (!query) return nodes;

    return nodes.filter(node => {
      const matches = node.name.toLowerCase().includes(query.toLowerCase()) ||
                     (node.description?.toLowerCase().includes(query.toLowerCase()));
      const childMatches = filterRoles(node.children, query);

      if (matches || childMatches.length > 0) {
        return true;
      }
      return false;
    }).map(node => ({
      ...node,
      children: filterRoles(node.children, query),
      expanded: query ? true : node.expanded
    }));
  };

  const renderRoleTreeNode = (node: RoleNode, level: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isSelected = selectedRole?.id === node.id;
    const permSummary = getPermissionSummary(node);

    return (
      <div key={node.id}>
        <div
          draggable
          onDragStart={() => handleDragStart(node)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(node)}
          onClick={() => handleSelectRole(node)}
          className={`
            flex items-center space-x-2 px-3 py-2 cursor-pointer rounded-lg
            transition-colors group
            ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'}
            ${draggedRole?.id === node.id ? 'opacity-50' : ''}
          `}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {node.expanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-gray-900 truncate">{node.name}</span>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex-shrink-0">
                  L{node.hierarchy_level}
                </span>
                {node.business_unit && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded truncate">
                    {node.business_unit}
                  </span>
                )}
              </div>
            </div>
          </div>

          {permSummary.total > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">
              {permSummary.total}
            </span>
          )}

          {permSummary.conflicts > 0 && (
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          )}

          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateChildRole(node);
              }}
              className="p-1 hover:bg-blue-100 rounded"
              title="Create child role"
            >
              <Plus className="h-3 w-3 text-blue-600" />
            </button>
          </div>
        </div>

        {hasChildren && node.expanded && (
          <div>
            {node.children.map(child => renderRoleTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredTree = filterRoles(roleTree, searchQuery);

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Settings', onClick: () => window.history.back() }
    ];

    if (viewMode === 'hierarchy') {
      breadcrumbs.push({ label: 'Roles & Permissions', current: false });
      breadcrumbs.push({ label: 'Hierarchy View', current: true });
    } else if (selectedRole && isEditing) {
      breadcrumbs.push({ label: 'Roles & Permissions', onClick: () => setSelectedRole(null) });
      breadcrumbs.push({ label: selectedRole.name, onClick: () => setIsEditing(false) });
      breadcrumbs.push({ label: 'Edit', current: true });
    } else if (selectedRole && showPermissionEditor) {
      breadcrumbs.push({ label: 'Roles & Permissions', onClick: () => setSelectedRole(null) });
      breadcrumbs.push({ label: selectedRole.name, onClick: () => setShowPermissionEditor(false) });
      breadcrumbs.push({ label: 'Permissions', current: true });
    } else if (selectedRole) {
      breadcrumbs.push({ label: 'Roles & Permissions', onClick: () => setSelectedRole(null) });
      breadcrumbs.push({ label: selectedRole.name, current: true });
    } else {
      breadcrumbs.push({ label: 'Roles & Permissions', current: true });
    }

    return breadcrumbs;
  };

  const handleHierarchyRoleSelect = (role: any) => {
    const roleNode = roleTree.find(node => findRoleInTree(node, role.id));
    if (roleNode) {
      const foundNode = findRoleNodeById(roleNode, role.id);
      if (foundNode) {
        handleSelectRole(foundNode);
      }
    } else {
      handleSelectRole({ ...role, children: [], expanded: true });
    }
  };

  const findRoleInTree = (node: RoleNode, roleId: string): boolean => {
    if (node.id === roleId) return true;
    return node.children.some(child => findRoleInTree(child, roleId));
  };

  const findRoleNodeById = (node: RoleNode, roleId: string): RoleNode | null => {
    if (node.id === roleId) return node;
    for (const child of node.children) {
      const found = findRoleNodeById(child, roleId);
      if (found) return found;
    }
    return null;
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar - Role Tree (hidden in hierarchy view) */}
      {viewMode === 'list' && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
            </div>
            <button
              onClick={() => {
                setParentRoleForNew(null);
                setShowCreateModal(true);
              }}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              title="Create new role"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                <List className="h-4 w-4 mr-1.5" />
                List
              </button>
              <button
                onClick={() => setViewMode('hierarchy')}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'hierarchy'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                <GitBranch className="h-4 w-4 mr-1.5" />
                Hierarchy
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredTree.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">No roles found</p>
            </div>
          ) : (
            filteredTree.map(node => renderRoleTreeNode(node))
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center justify-between">
              <span>Total Roles:</span>
              <span className="font-medium">{roles.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hierarchy Levels:</span>
              <span className="font-medium">{Math.max(...roles.map(r => r.hierarchy_level), 0)}</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Hierarchy View */}
      {viewMode === 'hierarchy' && (
        <div className="flex-1 h-full flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <BreadcrumbNav items={getBreadcrumbs()} />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GitBranch className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Role Hierarchy</h2>
                <p className="text-sm text-gray-600">Organizational structure and reporting relationships</p>
              </div>
            </div>
            <button
              onClick={() => {
                setParentRoleForNew(null);
                setShowCreateModal(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </button>
            </div>
          </div>
          <div className="flex-1">
            <RoleHierarchyView
              roles={roles.map(r => ({
                ...r,
                user_count: 0
              }))}
              onSelectRole={handleHierarchyRoleSelect}
              selectedRoleId={selectedRole?.id}
            />
          </div>
        </div>
      )}

      {/* Main Content - Role Details (shown when in list view) */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-y-auto">
        {selectedRole ? (
          <div className="max-w-4xl mx-auto p-8">
            <BreadcrumbNav items={getBreadcrumbs()} />

            {/* Back Button */}
            <button
              onClick={() => {
                if (showPermissionEditor) {
                  setShowPermissionEditor(false);
                } else if (isEditing) {
                  setIsEditing(false);
                } else {
                  setSelectedRole(null);
                }
              }}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>

            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedRole.name || ''}
                        onChange={(e) => setEditedRole({ ...editedRole, name: e.target.value })}
                        className="text-2xl font-bold text-gray-900 w-full border-b-2 border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold text-gray-900">{selectedRole.name}</h1>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        Level {selectedRole.hierarchy_level}
                      </span>
                      {selectedRole.business_unit && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                          {selectedRole.business_unit}
                        </span>
                      )}
                      {selectedRole.is_system && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                          System Role
                        </span>
                      )}
                      {selectedRole.is_active ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedRole(selectedRole);
                        }}
                        className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        disabled={selectedRole.is_system}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => setShowCloneModal(true)}
                        className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Clone
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        disabled={selectedRole.is_system}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  {isEditing ? (
                    <textarea
                      value={editedRole.description || ''}
                      onChange={(e) => setEditedRole({ ...editedRole, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-600">{selectedRole.description || 'No description provided'}</p>
                  )}
                </div>

                {selectedRole.parent_role_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Role</label>
                    <p className="text-gray-900">
                      {roles.find(r => r.id === selectedRole.parent_role_id)?.name || 'Unknown'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-sm text-gray-600">{new Date(selectedRole.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Last Modified</p>
                    <p className="text-sm text-gray-600">{new Date(selectedRole.updated_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Created By</p>
                    <p className="text-sm text-gray-600">{selectedRole.created_by}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Role ID</p>
                    <p className="text-sm text-gray-600 font-mono">{selectedRole.id.substring(0, 8)}...</p>
                  </div>
                </div>
              </div>

              {/* Role Metadata */}
              <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Role</label>
                  {isEditing ? (
                    <select
                      value={editedRole.parent_role_id || ''}
                      onChange={(e) => setEditedRole({ ...editedRole, parent_role_id: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (Root Level)</option>
                      {roles
                        .filter(r => r.id !== selectedRole.id)
                        .map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name} (Level {role.hierarchy_level})
                          </option>
                        ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {selectedRole.parent_role_id
                        ? roles.find(r => r.id === selectedRole.parent_role_id)?.name || 'Unknown'
                        : 'None (Root Level)'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Unit</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedRole.business_unit || ''}
                      onChange={(e) => setEditedRole({ ...editedRole, business_unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Sales Department"
                    />
                  ) : (
                    <p className="text-gray-900">{selectedRole.business_unit || 'Not assigned'}</p>
                  )}
                </div>

                {selectedRole.description && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    {isEditing ? (
                      <textarea
                        value={editedRole.description || ''}
                        onChange={(e) => setEditedRole({ ...editedRole, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-900">{selectedRole.description}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Permissions Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Permissions Summary</h3>
                <button
                  onClick={() => setShowPermissions(!showPermissions)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  {showPermissions ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Show Details
                    </>
                  )}
                </button>
              </div>

              {(() => {
                const permSummary = getPermissionSummary(selectedRole);
                return (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium mb-1">Direct Permissions</p>
                      <p className="text-2xl font-bold text-blue-700">{permSummary.direct}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-medium mb-1">Inherited</p>
                      <p className="text-2xl font-bold text-green-700">{permSummary.inherited}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 font-medium mb-1">Total</p>
                      <p className="text-2xl font-bold text-gray-700">{permSummary.total}</p>
                    </div>
                  </div>
                );
              })()}

              {showPermissions && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Permission Inheritance Path</h4>
                  {(() => {
                    const path: SystemRole[] = [];
                    let currentId = selectedRole.parent_role_id;

                    while (currentId) {
                      const parent = roles.find(r => r.id === currentId);
                      if (parent) {
                        path.push(parent);
                        currentId = parent.parent_role_id;
                      } else {
                        break;
                      }
                    }

                    if (path.length === 0) {
                      return <p className="text-sm text-gray-500">No inherited permissions (root role)</p>;
                    }

                    return (
                      <div className="space-y-2">
                        {path.reverse().map((role, idx) => (
                          <div key={role.id} className="flex items-center space-x-3 text-sm">
                            <span className="text-gray-400">↓</span>
                            <span className="font-medium text-gray-700">{role.name}</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {Object.keys(role.permissions || {}).length} permissions
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center space-x-3 text-sm">
                          <span className="text-gray-400">↓</span>
                          <span className="font-medium text-blue-600">{selectedRole.name} (Current)</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {(() => {
                const permSummary = getPermissionSummary(selectedRole);
                return permSummary.conflicts > 0 && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">Permission Conflicts Detected</p>
                        <p className="text-sm text-amber-700 mt-1">
                          {permSummary.conflicts} permission(s) have conflicting settings with inherited permissions.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Permission Editor Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Configure Permissions</h3>
                <button
                  onClick={() => setShowPermissionEditor(!showPermissionEditor)}
                  className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {showPermissionEditor ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Permission Editor
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Permission Editor
                    </>
                  )}
                </button>
              </div>

              {showPermissionEditor ? (
                <RolePermissionEditor
                  roleId={selectedRole.id}
                  roleName={selectedRole.name}
                  onSave={handleSavePermissions}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="mb-2">Click "Show Permission Editor" to configure module and field-level permissions</p>
                  <p className="text-sm">Changes will sync instantly with the global Permission Matrix</p>
                </div>
              )}
            </div>

            {/* Child Roles */}
            {selectedRole.children.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Child Roles ({selectedRole.children.length})</h3>
                <div className="space-y-2">
                  {selectedRole.children.map(child => (
                    <div
                      key={child.id}
                      onClick={() => handleSelectRole(child)}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{child.name}</span>
                        <span className="text-xs text-gray-500">Level {child.hierarchy_level}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Role Selected</h3>
              <p className="text-gray-600">Select a role from the tree to view details</p>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {parentRoleForNew ? 'Create Child Role' : 'Create New Role'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRoleData({ name: '', description: '', business_unit: '' });
                  setParentRoleForNew(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {parentRoleForNew && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    <strong>Parent Role:</strong> {roles.find(r => r.id === parentRoleForNew)?.name}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newRoleData.name}
                    onChange={(e) => handleRoleNameChange(e.target.value)}
                    onFocus={() => setShowSuggestions(roleSuggestions.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      nameError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Sales Manager - North Region"
                    aria-required="true"
                    aria-invalid={!!nameError}
                    aria-describedby={nameError ? 'name-error' : undefined}
                  />
                  {showSuggestions && roleSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {roleSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewRoleData({ ...newRoleData, name: suggestion });
                            setShowSuggestions(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                        >
                          <span className="text-sm text-gray-900">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {nameError && (
                  <p id="name-error" className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {nameError}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Enter a custom role name or select from suggestions
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Role
                </label>
                <select
                  value={newRoleData.parent_role_id || parentRoleForNew || ''}
                  onChange={(e) => {
                    setNewRoleData({ ...newRoleData, parent_role_id: e.target.value });
                    setParentError('');
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    parentError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={!!parentRoleForNew}
                  aria-describedby={parentError ? 'parent-error' : undefined}
                >
                  <option value="">None (Root Level - Level 1)</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} (Level {role.hierarchy_level})
                    </option>
                  ))}
                </select>
                {parentError && (
                  <p id="parent-error" className="mt-1 text-sm text-red-600 flex items-center" role="alert">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {parentError}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Child roles automatically inherit parent's level + 1
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newRoleData.description}
                  onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the role's responsibilities and access level"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Unit</label>
                <input
                  type="text"
                  value={newRoleData.business_unit}
                  onChange={(e) => setNewRoleData({ ...newRoleData, business_unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Sales Department, North Region"
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRoleData({ name: '', description: '', business_unit: '', parent_role_id: '' });
                  setParentRoleForNew(null);
                  setNameError('');
                  setParentError('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={!newRoleData.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Confirmation Modal */}
      {showCloneModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Clone Role</h3>
              <button
                onClick={() => setShowCloneModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Create a copy of <strong>{selectedRole.name}</strong> with all its permissions and settings?
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  The cloned role will have the same hierarchy level and parent role. You can modify it after creation.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCloneModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCloneRole}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                Clone Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Delete Role</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Warning: This action cannot be undone</p>
                    <p className="text-sm text-red-700 mt-1">
                      Deleting this role will permanently remove all associated permissions and settings.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete <strong>{selectedRole.name}</strong>?
              </p>
              {selectedRole.children.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-amber-900">
                    This role has {selectedRole.children.length} child role(s). You must reassign or delete them first.
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRole}
                disabled={selectedRole.children.length > 0}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesManagement;
