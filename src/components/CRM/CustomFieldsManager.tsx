import React, { useState } from 'react';
import { Plus, X, Edit, Save, Trash2, Settings, Type, Hash, Calendar, CheckSquare, List } from 'lucide-react';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'datetime' | 'select' | 'multiselect' | 'boolean' | 'textarea' | 'url';
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  entityType: 'lead' | 'contact' | 'deal' | 'account' | 'task' | 'activity';
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CustomFieldsManagerProps {
  entityType: 'lead' | 'contact' | 'deal' | 'account' | 'task' | 'activity';
  fields: CustomFieldDefinition[];
  onFieldsChange: (fields: CustomFieldDefinition[]) => void;
}

const CustomFieldsManager: React.FC<CustomFieldsManagerProps> = ({
  entityType,
  fields,
  onFieldsChange
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);
  const [newField, setNewField] = useState<Partial<CustomFieldDefinition>>({
    type: 'text',
    required: false,
    isActive: true,
    entityType,
    options: []
  });

  const fieldTypeIcons = {
    text: Type,
    number: Hash,
    email: Type,
    phone: Type,
    date: Calendar,
    datetime: Calendar,
    select: List,
    multiselect: List,
    boolean: CheckSquare,
    textarea: Type,
    url: Type
  };

  const fieldTypes = [
    { value: 'text', label: 'Single Line Text' },
    { value: 'textarea', label: 'Multi-line Text' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'url', label: 'URL' },
    { value: 'date', label: 'Date' },
    { value: 'datetime', label: 'Date & Time' },
    { value: 'select', label: 'Dropdown' },
    { value: 'multiselect', label: 'Multi-Select' },
    { value: 'boolean', label: 'Checkbox' }
  ];

  const addField = () => {
    if (!newField.name || !newField.label) return;

    const field: CustomFieldDefinition = {
      id: Date.now().toString(),
      name: newField.name.toLowerCase().replace(/\s+/g, '_'),
      label: newField.label,
      type: newField.type as CustomFieldDefinition['type'],
      required: newField.required || false,
      options: newField.options || [],
      defaultValue: newField.defaultValue,
      validation: newField.validation,
      entityType,
      position: fields.length + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onFieldsChange([...fields, field]);
    setNewField({
      type: 'text',
      required: false,
      isActive: true,
      entityType,
      options: []
    });
    setShowNewFieldForm(false);
  };

  const updateField = (updatedField: CustomFieldDefinition) => {
    const updatedFields = fields.map(field =>
      field.id === updatedField.id
        ? { ...updatedField, updatedAt: new Date().toISOString() }
        : field
    );
    onFieldsChange(updatedFields);
    setEditingField(null);
  };

  const deleteField = (fieldId: string) => {
    onFieldsChange(fields.filter(field => field.id !== fieldId));
  };

  const toggleFieldActive = (fieldId: string) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId
        ? { ...field, isActive: !field.isActive, updatedAt: new Date().toISOString() }
        : field
    );
    onFieldsChange(updatedFields);
  };

  const renderFieldForm = (field: Partial<CustomFieldDefinition>, isNew = false) => {
    const IconComponent = fieldTypeIcons[field.type as keyof typeof fieldTypeIcons] || Type;

    return (
      <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <IconComponent className="h-5 w-5 mr-2 text-blue-600" />
            {isNew ? 'Add New Field' : 'Edit Field'}
          </h4>
          <button
            onClick={() => {
              if (isNew) setShowNewFieldForm(false);
              else setEditingField(null);
            }}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field Label *
            </label>
            <input
              type="text"
              value={field.label || ''}
              onChange={(e) => {
                if (isNew) {
                  setNewField(prev => ({ ...prev, label: e.target.value }));
                } else {
                  setEditingField(prev => prev ? { ...prev, label: e.target.value } : null);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter field label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field Type *
            </label>
            <select
              value={field.type || 'text'}
              onChange={(e) => {
                if (isNew) {
                  setNewField(prev => ({ ...prev, type: e.target.value as CustomFieldDefinition['type'] }));
                } else {
                  setEditingField(prev => prev ? { ...prev, type: e.target.value as CustomFieldDefinition['type'] } : null);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {fieldTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {(field.type === 'select' || field.type === 'multiselect') && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options (one per line)
              </label>
              <textarea
                rows={4}
                value={(field.options || []).join('\n')}
                onChange={(e) => {
                  const options = e.target.value.split('\n').filter(option => option.trim());
                  if (isNew) {
                    setNewField(prev => ({ ...prev, options }));
                  } else {
                    setEditingField(prev => prev ? { ...prev, options } : null);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) => {
                  if (isNew) {
                    setNewField(prev => ({ ...prev, required: e.target.checked }));
                  } else {
                    setEditingField(prev => prev ? { ...prev, required: e.target.checked } : null);
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Required field</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              if (isNew) setShowNewFieldForm(false);
              else setEditingField(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (isNew) {
                addField();
              } else if (editingField) {
                updateField(editingField);
              }
            }}
            disabled={!field.label}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {isNew ? 'Add Field' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="h-6 w-6 mr-3 text-blue-600" />
            Custom Fields for {entityType.charAt(0).toUpperCase() + entityType.slice(1)}s
          </h3>
          <p className="text-gray-600 mt-1">Configure custom fields to capture additional information</p>
        </div>
        <button
          onClick={() => setShowNewFieldForm(true)}
          className="flex items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Field
        </button>
      </div>

      {/* New Field Form */}
      {showNewFieldForm && renderFieldForm(newField, true)}

      {/* Existing Fields */}
      <div className="grid gap-4">
        {fields.map((field) => {
          const IconComponent = fieldTypeIcons[field.type];
          
          return (
            <div key={field.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              {editingField?.id === field.id ? (
                renderFieldForm(editingField)
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${field.isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <IconComponent className={`h-5 w-5 ${field.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${field.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {fieldTypes.find(t => t.value === field.type)?.label} • 
                        {field.isActive ? ' Active' : ' Inactive'}
                        {field.options && field.options.length > 0 && ` • ${field.options.length} options`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleFieldActive(field.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        field.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {field.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => setEditingField(field)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteField(field.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {fields.length === 0 && !showNewFieldForm && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No custom fields defined</h3>
          <p className="text-gray-600 mb-6">Add custom fields to capture specific information for your {entityType}s</p>
          <button
            onClick={() => setShowNewFieldForm(true)}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors mx-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Custom Field
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomFieldsManager;