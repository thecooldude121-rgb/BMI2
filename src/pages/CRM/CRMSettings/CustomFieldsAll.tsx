import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface CustomField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options?: string;
  placeholder?: string;
  default?: string;
  suffix?: string;
  range?: string;
  label?: string;
}

const CustomFieldsAll: React.FC = () => {
  const [leadsFields, setLeadsFields] = useState<CustomField[]>([
    {
      id: '1',
      name: 'Budget Range',
      type: 'Dropdown',
      options: '<$10K, $10K-$50K, $50K-$100K, >$100K',
      required: false
    },
    {
      id: '2',
      name: 'Decision Timeline',
      type: 'Dropdown',
      options: 'Immediate, 1-3 months, 3-6 months, 6+ months',
      required: false
    }
  ]);

  const [contactsFields, setContactsFields] = useState<CustomField[]>([
    {
      id: '1',
      name: 'LinkedIn Profile',
      type: 'URL',
      placeholder: 'https://linkedin.com/in/',
      required: false
    },
    {
      id: '2',
      name: 'Preferred Contact Method',
      type: 'Radio',
      options: 'Email, Phone, LinkedIn',
      default: 'Email',
      required: true
    }
  ]);

  const [accountsFields, setAccountsFields] = useState<CustomField[]>([
    {
      id: '1',
      name: 'Parent Company',
      type: 'Text',
      required: false
    },
    {
      id: '2',
      name: 'Target Account',
      type: 'Checkbox',
      label: 'Mark as target account',
      default: 'Unchecked',
      required: false
    }
  ]);

  const [dealsFields, setDealsFields] = useState<CustomField[]>([
    {
      id: '1',
      name: 'Contract Length',
      type: 'Dropdown',
      options: 'Monthly, Quarterly, Annual, Multi-year',
      required: true
    },
    {
      id: '2',
      name: 'Discount Approved',
      type: 'Number',
      suffix: '%',
      range: '0-50',
      required: false
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFieldModule, setNewFieldModule] = useState('Leads');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('Text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const handleEditField = (module: string, fieldId: string) => {
    alert(`Editing ${module} field ${fieldId}...`);
  };

  const handleDeleteField = (module: string, fieldId: string) => {
    if (window.confirm('Are you sure you want to delete this custom field?')) {
      switch (module) {
        case 'Leads':
          setLeadsFields(leadsFields.filter(f => f.id !== fieldId));
          break;
        case 'Contacts':
          setContactsFields(contactsFields.filter(f => f.id !== fieldId));
          break;
        case 'Accounts':
          setAccountsFields(accountsFields.filter(f => f.id !== fieldId));
          break;
        case 'Deals':
          setDealsFields(dealsFields.filter(f => f.id !== fieldId));
          break;
      }
      alert('Custom field deleted successfully!');
    }
  };

  const handleAddField = (module: string) => {
    setNewFieldModule(module);
    setShowCreateForm(true);
  };

  const handleCreateField = () => {
    if (!newFieldLabel.trim()) {
      alert('Please enter a field label');
      return;
    }

    const newField: CustomField = {
      id: Date.now().toString(),
      name: newFieldLabel,
      type: newFieldType,
      required: newFieldRequired
    };

    switch (newFieldModule) {
      case 'Leads':
        setLeadsFields([...leadsFields, newField]);
        break;
      case 'Contacts':
        setContactsFields([...contactsFields, newField]);
        break;
      case 'Accounts':
        setAccountsFields([...accountsFields, newField]);
        break;
      case 'Deals':
        setDealsFields([...dealsFields, newField]);
        break;
    }

    setNewFieldLabel('');
    setNewFieldType('Text');
    setNewFieldRequired(false);
    setShowCreateForm(false);
    alert(`Custom field added to ${newFieldModule} successfully!`);
  };

  const handleCancelCreate = () => {
    setNewFieldLabel('');
    setNewFieldType('Text');
    setNewFieldRequired(false);
    setShowCreateForm(false);
  };

  const renderField = (field: CustomField, module: string) => (
    <div key={field.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-900">{field.name}</h4>
          <div className="flex gap-2">
            <button
              onClick={() => handleEditField(module, field.id)}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
            >
              [Edit]
            </button>
            <button
              onClick={() => handleDeleteField(module, field.id)}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
            >
              [Delete]
            </button>
          </div>
        </div>
        <div className="space-y-1 text-sm text-gray-700">
          <div>Type: <span className="font-medium">{field.type}</span></div>
          {field.options && <div>Options: <span className="font-medium">{field.options}</span></div>}
          {field.placeholder && <div>Placeholder: <span className="font-medium">{field.placeholder}</span></div>}
          {field.default && <div>Default: <span className="font-medium">{field.default}</span></div>}
          {field.suffix && <div>Suffix: <span className="font-medium">{field.suffix}</span></div>}
          {field.range && <div>Range: <span className="font-medium">{field.range}</span></div>}
          {field.label && <div>Label: <span className="font-medium">{field.label}</span></div>}
          <div>Required: <span className="font-medium">{field.required ? 'Yes' : 'No'}</span></div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Custom Fields (Add fields to all modules)</h2>
        <p className="text-sm text-gray-600 mt-1">Configure custom fields for Leads, Contacts, Accounts, and Deals</p>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">LEADS (Module 2)</h3>
            <button
              onClick={() => handleAddField('Leads')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Custom fields for leads:</p>
            <div className="space-y-3">
              {leadsFields.map(field => renderField(field, 'Leads'))}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">CONTACTS (Module 3)</h3>
            <button
              onClick={() => handleAddField('Contacts')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Custom fields for contacts:</p>
            <div className="space-y-3">
              {contactsFields.map(field => renderField(field, 'Contacts'))}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">ACCOUNTS (Module 4)</h3>
            <button
              onClick={() => handleAddField('Accounts')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Custom fields for accounts:</p>
            <div className="space-y-3">
              {accountsFields.map(field => renderField(field, 'Accounts'))}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">DEALS (Module 5)</h3>
            <button
              onClick={() => handleAddField('Deals')}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Custom fields for deals:</p>
            <div className="space-y-3">
              {dealsFields.map(field => renderField(field, 'Deals'))}
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-blue-50">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">CREATE NEW CUSTOM FIELD</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apply to:
                </label>
                <select
                  value={newFieldModule}
                  onChange={(e) => setNewFieldModule(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Leads">Leads</option>
                  <option value="Contacts">Contacts</option>
                  <option value="Accounts">Accounts</option>
                  <option value="Deals">Deals</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Options: Leads, Contacts, Accounts, Deals</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Label:
                </label>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter field label"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Type:
                </label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                  <option value="Dropdown">Dropdown</option>
                  <option value="Radio">Radio</option>
                  <option value="Checkbox">Checkbox</option>
                  <option value="Date">Date</option>
                  <option value="URL">URL</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Options: Text, Number, Dropdown, Radio, Checkbox, Date, URL, Email, Phone
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Make this field required</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  onClick={handleCancelCreate}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateField}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Field
                </button>
              </div>
            </div>
          </div>
        )}

        {!showCreateForm && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">CREATE NEW CUSTOM FIELD</h3>
            </div>

            <div className="p-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Plus className="h-5 w-5" />
                Add New Custom Field
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomFieldsAll;
