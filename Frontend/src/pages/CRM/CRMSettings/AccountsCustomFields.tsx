import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const AccountsCustomFields: React.FC = () => {
  const fields = [
    { name: 'Parent Company', type: 'Text', required: false },
    { name: 'SIC Code', type: 'Text', required: false },
    { name: 'D&B Rating', type: 'Number', required: false }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accounts Custom Fields</h2>
          <p className="text-sm text-gray-600 mt-1">Add custom fields to your accounts</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Field
        </button>
      </div>

      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">{field.name}</div>
              <div className="text-sm text-gray-600">
                Type: {field.type} {field.required && <span className="text-red-500">*</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                <Pencil className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountsCustomFields;
