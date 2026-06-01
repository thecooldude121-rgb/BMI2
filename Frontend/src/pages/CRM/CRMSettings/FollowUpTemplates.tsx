import React from 'react';
import { Plus, Mail, Copy, Pencil, Trash2 } from 'lucide-react';

const FollowUpTemplates: React.FC = () => {
  const templates = [
    { id: '1', name: 'First Follow-up', subject: 'Following up on our conversation', opens: 178, clicks: 56 },
    { id: '2', name: 'Second Follow-up', subject: 'Checking in', opens: 134, clicks: 42 },
    { id: '3', name: 'Final Follow-up', subject: 'Last chance to connect', opens: 98, clicks: 31 }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Follow-up Templates</h2>
          <p className="text-sm text-gray-600 mt-1">Templates for follow-up emails</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </button>
      </div>

      <div className="space-y-3">
        {templates.map((template) => (
          <div key={template.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600">{template.subject}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                  <Copy className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>{template.opens} opens</span>
              <span>{template.clicks} clicks</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FollowUpTemplates;
