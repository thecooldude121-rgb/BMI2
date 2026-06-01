import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, Info } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  usedCount: number;
  openRate: number;
  replyRate: number;
}

const EmailTemplatesManager: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateSubject, setNewTemplateSubject] = useState('');
  const [newTemplateBody, setNewTemplateBody] = useState('');

  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'VP Sales Introduction',
      subject: 'Quick question about {{company_name}}',
      body: `Hi {{first_name}},

I noticed {{company_name}} recently {{recent_news}}. Congrats on the growth!

I work with similar {{industry}} companies to help streamline their sales process...`,
      usedCount: 45,
      openRate: 62,
      replyRate: 18
    },
    {
      id: '2',
      name: 'Follow-up After Demo',
      subject: 'Great talking with you, {{first_name}}',
      body: `Hi {{first_name}},

Thanks for taking the time to chat today! As we discussed, here's a summary of next steps...`,
      usedCount: 78,
      openRate: 85,
      replyRate: 45
    },
    {
      id: '3',
      name: 'Proposal Sent',
      subject: '{{company_name}} Proposal - {{deal_value}}',
      body: `Hi {{first_name}},

As discussed, I've attached our proposal for {{deal_name}}...`,
      usedCount: 34,
      openRate: 91,
      replyRate: 67
    }
  ]);

  const mergeFields = {
    'Contact Fields': [
      '{{first_name}}',
      '{{last_name}}',
      '{{email}}',
      '{{phone}}',
      '{{title}}',
      '{{company_name}}',
      '{{industry}}'
    ],
    'Deal Fields': [
      '{{deal_name}}',
      '{{deal_value}}',
      '{{deal_stage}}',
      '{{close_date}}'
    ],
    'Account Fields': [
      '{{account_name}}',
      '{{account_size}}',
      '{{account_revenue}}'
    ],
    'AI Fields': [
      '{{recent_news}}',
      '{{pain_points}}',
      '{{tech_stack}}'
    ],
    'Sender Fields': [
      '{{my_name}}',
      '{{my_title}}',
      '{{my_email}}',
      '{{my_phone}}'
    ]
  };

  const handleEditTemplate = (id: string) => {
    alert(`Editing template ${id}...`);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== id));
      alert('Template deleted successfully!');
    }
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateSubject.trim() || !newTemplateBody.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: newTemplateName,
      subject: newTemplateSubject,
      body: newTemplateBody,
      usedCount: 0,
      openRate: 0,
      replyRate: 0
    };

    setTemplates([...templates, newTemplate]);
    setNewTemplateName('');
    setNewTemplateSubject('');
    setNewTemplateBody('');
    setShowCreateForm(false);
    alert('Template saved successfully!');
  };

  const handleCancelCreate = () => {
    setNewTemplateName('');
    setNewTemplateSubject('');
    setNewTemplateBody('');
    setShowCreateForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Templates</h2>
          <p className="text-sm text-gray-600 mt-1">Create and manage email templates for outreach and follow-ups</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="h-4 w-4" />
          Create New
        </button>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">OUTREACH TEMPLATES (Used in Modules 2, 3, 5)</h3>
          </div>

          <div className="p-6 space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-white">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTemplate(template.id)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                      >
                        [Edit]
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
                      >
                        [Del]
                      </button>
                    </div>
                  </div>

                  <div className="px-4 py-3 space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Subject: </span>
                      <span className="text-sm text-gray-900">{template.subject}</span>
                    </div>

                    <div className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded border border-gray-200">
                      {template.body}
                    </div>

                    <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                      Used: {template.usedCount} times | Open rate: {template.openRate}% | Reply rate: {template.replyRate}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">AVAILABLE MERGE FIELDS (For personalization)</h3>
          </div>

          <div className="p-6 space-y-4">
            {Object.entries(mergeFields).map(([category, fields]) => (
              <div key={category}>
                <p className="text-sm font-medium text-gray-700 mb-2">{category}:</p>
                <div className="flex flex-wrap gap-2">
                  {fields.map((field) => (
                    <code
                      key={field}
                      className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded border border-gray-300 font-mono"
                    >
                      {field}
                    </code>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {showCreateForm && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">CREATE NEW TEMPLATE</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name:
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Cold Outreach"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line:
                </label>
                <input
                  type="text"
                  value={newTemplateSubject}
                  onChange={(e) => setNewTemplateSubject(e.target.value)}
                  placeholder="e.g., Quick question about {{company_name}}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body:
                </label>
                <textarea
                  value={newTemplateBody}
                  onChange={(e) => setNewTemplateBody(e.target.value)}
                  placeholder="Hi {{first_name}},&#10;&#10;I noticed..."
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use merge fields like {'{'}{'{'} first_name {'}'}{'}'}  from the list above to personalize your email
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancelCreate}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTemplatesManager;
