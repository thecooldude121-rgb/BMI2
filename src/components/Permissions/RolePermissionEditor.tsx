import React, { useState, useEffect } from 'react';
import {
  Check, Square, MinusSquare, ChevronDown, ChevronRight,
  Save, X, AlertCircle, CheckCircle, Eye, Lock
} from 'lucide-react';

interface PermissionState {
  read: boolean;
  write: boolean;
  delete: boolean;
  export: boolean;
  import: boolean;
  hide: boolean;
}

interface FieldPermission extends PermissionState {
  fieldName: string;
  displayName: string;
}

interface ModulePermissions {
  moduleName: string;
  displayName: string;
  permissions: PermissionState;
  fields: FieldPermission[];
  expanded: boolean;
}

interface RolePermissionEditorProps {
  roleId: string;
  roleName: string;
  onSave: (permissions: Record<string, any>) => Promise<boolean>;
}

const MODULES = [
  {
    id: 'leads',
    name: 'Leads',
    fields: [
      { id: 'name', name: 'Name' },
      { id: 'email', name: 'Email' },
      { id: 'phone', name: 'Phone' },
      { id: 'company', name: 'Company' },
      { id: 'status', name: 'Status' },
      { id: 'source', name: 'Source' },
      { id: 'score', name: 'Lead Score' }
    ]
  },
  {
    id: 'deals',
    name: 'Deals',
    fields: [
      { id: 'name', name: 'Deal Name' },
      { id: 'amount', name: 'Amount' },
      { id: 'stage', name: 'Stage' },
      { id: 'probability', name: 'Probability' },
      { id: 'close_date', name: 'Close Date' },
      { id: 'owner', name: 'Owner' }
    ]
  },
  {
    id: 'contacts',
    name: 'Contacts',
    fields: [
      { id: 'first_name', name: 'First Name' },
      { id: 'last_name', name: 'Last Name' },
      { id: 'email', name: 'Email' },
      { id: 'phone', name: 'Phone' },
      { id: 'position', name: 'Position' },
      { id: 'account', name: 'Account' }
    ]
  },
  {
    id: 'accounts',
    name: 'Accounts',
    fields: [
      { id: 'name', name: 'Account Name' },
      { id: 'industry', name: 'Industry' },
      { id: 'revenue', name: 'Annual Revenue' },
      { id: 'employees', name: 'Employees' },
      { id: 'website', name: 'Website' }
    ]
  }
];

const PERMISSION_TYPES = [
  { key: 'read', label: 'Read', description: 'View records' },
  { key: 'write', label: 'Write', description: 'Create and edit' },
  { key: 'delete', label: 'Delete', description: 'Remove records' },
  { key: 'export', label: 'Export', description: 'Export data' },
  { key: 'import', label: 'Import', description: 'Import data' },
  { key: 'hide', label: 'Hide', description: 'Hide from view' }
];

export const RolePermissionEditor: React.FC<RolePermissionEditorProps> = ({
  roleId,
  roleName,
  onSave
}) => {
  const [modules, setModules] = useState<ModulePermissions[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    initializePermissions();
  }, [roleId]);

  const initializePermissions = () => {
    const initialModules: ModulePermissions[] = MODULES.map(module => ({
      moduleName: module.id,
      displayName: module.name,
      permissions: {
        read: false,
        write: false,
        delete: false,
        export: false,
        import: false,
        hide: false
      },
      fields: module.fields.map(field => ({
        fieldName: field.id,
        displayName: field.name,
        read: false,
        write: false,
        delete: false,
        export: false,
        import: false,
        hide: false
      })),
      expanded: false
    }));
    setModules(initialModules);
  };

  const getCheckboxState = (moduleIdx: number, permType: keyof PermissionState): 'checked' | 'unchecked' | 'indeterminate' => {
    const module = modules[moduleIdx];
    const fields = module.fields;

    const checkedCount = fields.filter(f => f[permType]).length;

    if (checkedCount === 0) return 'unchecked';
    if (checkedCount === fields.length) return 'checked';
    return 'indeterminate';
  };

  const toggleModulePermission = (moduleIdx: number, permType: keyof PermissionState) => {
    const newModules = [...modules];
    const state = getCheckboxState(moduleIdx, permType);
    const newValue = state !== 'checked';

    newModules[moduleIdx].permissions[permType] = newValue;
    newModules[moduleIdx].fields.forEach(field => {
      field[permType] = newValue;
    });

    setModules(newModules);
    setHasChanges(true);
  };

  const toggleFieldPermission = (moduleIdx: number, fieldIdx: number, permType: keyof PermissionState) => {
    const newModules = [...modules];
    newModules[moduleIdx].fields[fieldIdx][permType] = !newModules[moduleIdx].fields[fieldIdx][permType];

    const allChecked = newModules[moduleIdx].fields.every(f => f[permType]);
    const anyChecked = newModules[moduleIdx].fields.some(f => f[permType]);
    newModules[moduleIdx].permissions[permType] = allChecked;

    setModules(newModules);
    setHasChanges(true);
  };

  const toggleModuleExpansion = (moduleIdx: number) => {
    const newModules = [...modules];
    newModules[moduleIdx].expanded = !newModules[moduleIdx].expanded;
    setModules(newModules);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const permissionsData: Record<string, any> = {};
    modules.forEach(module => {
      permissionsData[module.moduleName] = {
        module: module.permissions,
        fields: {}
      };
      module.fields.forEach(field => {
        permissionsData[module.moduleName].fields[field.fieldName] = {
          read: field.read,
          write: field.write,
          delete: field.delete,
          export: field.export,
          import: field.import,
          hide: field.hide
        };
      });
    });

    const success = await onSave(permissionsData);

    setSaving(false);
    if (success) {
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleDiscard = () => {
    initializePermissions();
    setHasChanges(false);
  };

  const renderCheckbox = (state: 'checked' | 'unchecked' | 'indeterminate', onClick: () => void) => {
    return (
      <button
        onClick={onClick}
        className="w-5 h-5 flex items-center justify-center border-2 rounded transition-colors hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{
          borderColor: state === 'unchecked' ? '#d1d5db' : '#3b82f6',
          backgroundColor: state === 'unchecked' ? 'white' : '#3b82f6'
        }}
        aria-label={state === 'checked' ? 'Checked' : state === 'indeterminate' ? 'Partially checked' : 'Unchecked'}
      >
        {state === 'checked' && <Check className="h-3 w-3 text-white" />}
        {state === 'indeterminate' && <MinusSquare className="h-3 w-3 text-white" />}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Role Permissions</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure module and field-level permissions for <span className="font-medium">{roleName}</span>
          </p>
        </div>

        {hasChanges && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Unsaved changes</span>
            </div>
            <button
              onClick={handleDiscard}
              disabled={saving}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <X className="h-4 w-4 inline mr-1" />
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 inline mr-1" />
                  Save Permissions
                </>
              )}
            </button>
          </div>
        )}

        {saveSuccess && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Saved successfully</span>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Click module-level checkboxes to grant access to all fields</li>
              <li>• Expand modules to set field-specific permissions</li>
              <li>• Partial selection (minus icon) means some fields have the permission</li>
              <li>• Changes sync instantly with the global Permission Matrix</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header Row */}
        <div className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
          <div className="grid grid-cols-7 gap-4 p-4">
            <div className="font-semibold text-gray-700">Module / Field</div>
            {PERMISSION_TYPES.map(perm => (
              <div key={perm.key} className="text-center">
                <p className="font-semibold text-gray-700 text-sm">{perm.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{perm.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Module Rows */}
        <div className="divide-y divide-gray-200">
          {modules.map((module, moduleIdx) => (
            <div key={module.moduleName}>
              {/* Module Row */}
              <div className="bg-white hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-7 gap-4 p-4 items-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleModuleExpansion(moduleIdx)}
                      className="p-1 hover:bg-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={module.expanded ? 'Collapse' : 'Expand'}
                    >
                      {module.expanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                    <span className="font-medium text-gray-900">{module.displayName}</span>
                    <span className="text-xs text-gray-500">({module.fields.length} fields)</span>
                  </div>

                  {PERMISSION_TYPES.map(perm => (
                    <div key={perm.key} className="flex justify-center">
                      {renderCheckbox(
                        getCheckboxState(moduleIdx, perm.key as keyof PermissionState),
                        () => toggleModulePermission(moduleIdx, perm.key as keyof PermissionState)
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Rows */}
              {module.expanded && (
                <div className="bg-gray-50">
                  {module.fields.map((field, fieldIdx) => (
                    <div
                      key={field.fieldName}
                      className="grid grid-cols-7 gap-4 p-4 pl-16 items-center border-t border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Lock className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-700">{field.displayName}</span>
                      </div>

                      {PERMISSION_TYPES.map(perm => (
                        <div key={perm.key} className="flex justify-center">
                          {renderCheckbox(
                            field[perm.key as keyof PermissionState] ? 'checked' : 'unchecked',
                            () => toggleFieldPermission(moduleIdx, fieldIdx, perm.key as keyof PermissionState)
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      {hasChanges && (
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleDiscard}
            disabled={saving}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      )}
    </div>
  );
};
