import React, { useState } from 'react';
import { Plus, Edit, Trash2, Copy, Eye, Mail, Search, Filter, Tag } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'cold-outreach' | 'follow-up' | 'proposal' | 'demo-invite' | 'closing';
  tags: string[];
  variables: TemplateVariable[];
  isActive: boolean;
  usageCount: number;
  openRate: number;
  replyRate: number;
  createdAt: string;
  updatedAt: string;
}

interface TemplateVariable {
  name: string;
  label: string;
  defaultValue?: string;
  required: boolean;
}

const EmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Cold Outreach - Tech Companies',
      subject: 'Quick question about {{company_name}}\'s growth plans',
      body: 'Hi {{first_name}},\n\nI noticed {{company_name}} has been expanding rapidly in the {{industry}} space...',
      category: 'cold-outreach',
      tags: ['technology', 'growth', 'expansion'],
      variables: [
        { name: 'first_name', label: 'First Name', required: true },
        { name: 'company_name', label: 'Company Name', required: true },
        { name: 'industry', label: 'Industry', required: false }
      ],
      isActive: true,
      usageCount: 45,
      openRate: 34.2,
      replyRate: 8.7,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20'
    },
    {
      id: '2',
      name: 'Follow-up After Demo',
      subject: 'Thanks for your time today, {{first_name}}',
      body: 'Hi {{first_name}},\n\nThank you for taking the time to see our demo today...',
      category: 'follow-up',
      tags: ['demo', 'follow-up', 'next-steps'],
      variables: [
        { name: 'first_name', label: 'First Name', required: true },
        { name: 'demo_date', label: 'Demo Date', required: false }
      ],
      isActive: true,
      usageCount: 23,
      openRate: 67.8,
      replyRate: 23.4,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'cold-outreach', label: 'Cold Outreach' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'demo-invite', label: 'Demo Invite' },
    { value: 'closing', label: 'Closing' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: EmailTemplate['category']) => {
    const colors = {
      'cold-outreach': 'bg-blue-100 text-blue-800',
      'follow-up': 'bg-green-100 text-green-800',
      'proposal': 'bg-purple-100 text-purple-800',
      'demo-invite': 'bg-orange-100 text-orange-800',
      'closing': 'bg-red-100 text-red-800'
    };
    return colors[category];
  };

  const duplicateTemplate = (template: EmailTemplate) => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      usageCount: 0,
      openRate: 0,
      replyRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const previewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Templates</h2>
          <p className="text-gray-600">Create and manage reusable email templates for your sequences</p>
        </div>
        <button
          onClick={() => setShowTemplateForm(true)}
          className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white rounded-xl border border-gray-200">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>{category.label}</option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
            {/* Template Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                  {template.category.replace('-', ' ')}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => previewTemplate(template)}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="p-2 text-gray-400 hover:text-green-600 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => duplicateTemplate(template)}
                  className="p-2 text-gray-400 hover:text-purple-600 rounded-lg transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Template Preview */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Subject:</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">{template.subject}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border line-clamp-3">
                {template.body}
              </p>
            </div>

            {/* Template Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{template.usageCount}</p>
                <p className="text-xs text-gray-600">Used</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{template.openRate}%</p>
                <p className="text-xs text-gray-600">Open Rate</p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded-lg">
                <p className="text-lg font-bold text-purple-600">{template.replyRate}%</p>
                <p className="text-xs text-gray-600">Reply Rate</p>
              </div>
            </div>

            {/* Template Tags */}
            {template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-6">Create your first email template to get started</p>
          <button
            onClick={() => setShowTemplateForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create Template
          </button>
        </div>
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h3>
              <button onClick={() => setSelectedTemplate(null)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Template Content</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-900">{selectedTemplate.subject}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
                    <div className="p-4 bg-gray-50 rounded-lg border max-h-64 overflow-y-auto">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                        {selectedTemplate.body}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Template Variables</h4>
                <div className="space-y-3">
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable.name} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-900">{{variable.name}}</span>
                        {variable.required && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Required</span>
                        )}
                      </div>
                      <p className="text-sm text-blue-700 mt-1">{variable.label}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{selectedTemplate.openRate}%</p>
                      <p className="text-sm text-gray-600">Open Rate</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{selectedTemplate.replyRate}%</p>
                      <p className="text-sm text-gray-600">Reply Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;

/*
CRM Email Templates Component

Purpose: Comprehensive email template management for sales sequences

Features:
- Template creation and editing with rich text editor
- Variable insertion and personalization
- Category-based organization
- Performance tracking (open rates, reply rates)
- Template preview and testing
- Bulk template operations
- A/B testing capabilities

API Integration Points:
1. GET /api/templates/email - Fetch all email templates
2. POST /api/templates/email - Create new template
3. PUT /api/templates/email/{id} - Update existing template
4. DELETE /api/templates/email/{id} - Delete template
5. POST /api/templates/email/{id}/test - Send test email
6. GET /api/templates/email/{id}/analytics - Get template performance

TODO:
- Add rich text editor for email body
- Implement template A/B testing
- Add template sharing between team members
- Include spam score checking
- Add template version history
- Implement template approval workflow
*/