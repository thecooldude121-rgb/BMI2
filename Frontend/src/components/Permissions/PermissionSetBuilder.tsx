import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Check, AlertTriangle } from 'lucide-react';

interface PermissionSetBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (set: any) => void;
  existingSet?: any;
  isInUse?: boolean;
  appliedRolesCount?: number;
}

interface ModulePermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
  export: boolean;
  import: boolean;
  hide: boolean;
}

interface FieldPermission {
  fieldName: string;
  read: boolean;
  write: boolean;
  hide: boolean;
}

const MODULES = [
  {
    id: 'leads',
    name: 'Leads',
    fields: ['Name', 'Email', 'Phone', 'Company', 'Status', 'Lead Source', 'Lead Score']
  },
  {
    id: 'deals',
    name: 'Deals',
    fields: ['Deal Name', 'Amount', 'Stage', 'Close Date', 'Probability', 'Account']
  },
  {
    id: 'accounts',
    name: 'Accounts',
    fields: ['Account Name', 'Industry', 'Annual Revenue', 'Owner', 'Phone', 'Website']
  },
  {
    id: 'contacts',
    name: 'Contacts',
    fields: ['First Name', 'Last Name', 'Email', 'Phone', 'Title', 'Account']
  },
  {
    id: 'cases',
    name: 'Cases',
    fields: ['Subject', 'Priority', 'Status', 'Type', 'Origin', 'Account']
  }
];

export const PermissionSetBuilder: React.FC<PermissionSetBuilderProps> = ({
  isOpen,
  onClose,
  onSave,
  existingSet,
  isInUse = false,
  appliedRolesCount = 0
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'global' | 'specific'>('global');
  const [selectedBusinessUnits, setSelectedBusinessUnits] = useState<string[]>([]);
  const [modulePermissions, setModulePermissions] = useState<Record<string, ModulePermissions>>({});
  const [fieldPermissions, setFieldPermissions] = useState<Record<string, FieldPermission[]>>({});
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (existingSet) {
      setName(existingSet.name);
      setDescription(existingSet.description || '');

      const perms: Record<string, ModulePermissions> = {};
      const fields: Record<string, FieldPermission[]> = {};

      MODULES.forEach(module => {
        const modPerms = existingSet.permissions[module.id] || {};
        perms[module.id] = {
          read: modPerms.read || false,
          write: modPerms.write || false,
          delete: modPerms.delete || false,
          export: modPerms.export || false,
          import: modPerms.import || false,
          hide: modPerms.hide || false
        };

        fields[module.id] = module.fields.map(fieldName => ({
          fieldName,
          read: modPerms.fieldPermissions?.[fieldName]?.read ?? true,
          write: modPerms.fieldPermissions?.[fieldName]?.write ?? true,
          hide: modPerms.fieldPermissions?.[fieldName]?.hide ?? false
        }));
      });

      setModulePermissions(perms);
      setFieldPermissions(fields);
    } else {
      const perms: Record<string, ModulePermissions> = {};
      const fields: Record<string, FieldPermission[]> = {};

      MODULES.forEach(module => {
        perms[module.id] = {
          read: false,
          write: false,
          delete: false,
          export: false,
          import: false,
          hide: false
        };

        fields[module.id] = module.fields.map(fieldName => ({
          fieldName,
          read: true,
          write: true,
          hide: false
        }));
      });

      setModulePermissions(perms);
      setFieldPermissions(fields);
    }
  }, [existingSet]);

  if (!isOpen) return null;

  const toggleModuleExpanded = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const updateModulePermission = (moduleId: string, permission: keyof ModulePermissions) => {
    setModulePermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [permission]: !prev[moduleId]?.[permission]
      }
    }));
  };

  const selectAllModulePermissions = (moduleId: string) => {
    setModulePermissions(prev => ({
      ...prev,
      [moduleId]: {
        read: true,
        write: true,
        delete: true,
        export: true,
        import: true,
        hide: false
      }
    }));
  };

  const clearAllModulePermissions = (moduleId: string) => {
    setModulePermissions(prev => ({
      ...prev,
      [moduleId]: {
        read: false,
        write: false,
        delete: false,
        export: false,
        import: false,
        hide: false
      }
    }));
  };

  const updateFieldPermission = (moduleId: string, fieldIndex: number, permission: keyof FieldPermission) => {
    setFieldPermissions(prev => ({
      ...prev,
      [moduleId]: prev[moduleId].map((field, idx) =>
        idx === fieldIndex
          ? { ...field, [permission]: typeof field[permission] === 'boolean' ? !field[permission] : field[permission] }
          : field
      )
    }));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a permission set name');
      return;
    }

    const permissions: Record<string, any> = {};
    const modulesCovered: string[] = [];

    MODULES.forEach(module => {
      const modPerms = modulePermissions[module.id];
      if (modPerms && Object.values(modPerms).some(v => v === true)) {
        permissions[module.id] = {
          ...modPerms,
          fieldPermissions: fieldPermissions[module.id]?.reduce((acc, field) => {
            acc[field.fieldName] = {
              read: field.read,
              write: field.write,
              hide: field.hide
            };
            return acc;
          }, {} as Record<string, any>)
        };
        modulesCovered.push(module.name);
      }
    });

    const permissionSet = {
      id: existingSet?.id || `ps-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      permissions,
      modulesCovered,
      appliedToRoles: existingSet?.appliedToRoles || [],
      createdAt: existingSet?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      visibility,
      businessUnits: selectedBusinessUnits
    };

    onSave(permissionSet);
  };

  const hasAnyPermission = (moduleId: string) => {
    const perms = modulePermissions[moduleId];
    return perms && Object.values(perms).some(v => v === true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {existingSet ? `Edit "${existingSet.name}"` : 'Create Permission Set'}
            </h3>
            {isInUse && (
              <p className="text-sm text-orange-600 mt-1">
                Currently applied to {appliedRolesCount} role(s)
              </p>
            )}
          </div>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isInUse && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Warning: Set In Use</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This permission set is applied to {appliedRolesCount} role(s). Changes will sync immediately to all applied roles.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Marketing Manager Baseline"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as 'global' | 'specific')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="global">Global (All Business Units)</option>
                  <option value="specific">Specific Business Units</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this permission set is for..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-base font-semibold text-gray-900 mb-4">Permission Matrix</h4>

              <div className="space-y-2">
                {MODULES.map((module) => {
                  const isExpanded = expandedModules.has(module.id);
                  const perms = modulePermissions[module.id] || {};
                  const hasPerms = hasAnyPermission(module.id);

                  return (
                    <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className={`p-4 ${hasPerms ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleModuleExpanded(module.id)}
                              className="p-1 hover:bg-white rounded"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                            <span className="font-medium text-gray-900">{module.name}</span>
                            {hasPerms && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {Object.values(perms).filter(v => v === true).length} enabled
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => selectAllModulePermissions(module.id)}
                              className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
                            >
                              Select All
                            </button>
                            <button
                              onClick={() => clearAllModulePermissions(module.id)}
                              className="text-xs text-gray-600 hover:text-gray-700 px-2 py-1"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-6 gap-2">
                          {(['read', 'write', 'delete', 'export', 'import', 'hide'] as const).map((perm) => (
                            <label
                              key={perm}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={perms[perm] || false}
                                onChange={() => updateModulePermission(module.id, perm)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 capitalize">{perm}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="bg-white p-4 border-t border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Field-Level Permissions</h5>
                          <div className="space-y-2">
                            {fieldPermissions[module.id]?.map((field, idx) => (
                              <div key={idx} className="flex items-center space-x-4 py-2 border-b border-gray-100 last:border-b-0">
                                <span className="text-sm text-gray-700 w-40">{field.fieldName}</span>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={field.read}
                                    onChange={() => updateFieldPermission(module.id, idx, 'read')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-600">Read</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={field.write}
                                    onChange={() => updateFieldPermission(module.id, idx, 'write')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-600">Write</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={field.hide}
                                    onChange={() => updateFieldPermission(module.id, idx, 'hide')}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-600">Hide</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {existingSet ? 'Save Changes' : 'Create Permission Set'}
          </button>
        </div>
      </div>
    </div>
  );
};
