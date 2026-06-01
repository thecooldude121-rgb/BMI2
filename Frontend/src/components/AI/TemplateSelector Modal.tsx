import { useState } from 'react';
import { X, Mail, Search, FileText } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
}

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'VP Sales Intro',
    subject: 'Quick introduction - {{company_name}}',
    body: 'Hi {{first_name}},\n\nI noticed your company recently {{recent_event}}. I wanted to reach out because...\n\nBest regards,\n{{sender_name}}',
    category: 'Outreach'
  },
  {
    id: '2',
    name: 'Follow-up',
    subject: 'Following up on our conversation',
    body: 'Hi {{first_name}},\n\nI wanted to follow up on our recent conversation about {{topic}}.\n\nWould you be available for a quick call this week?\n\nBest,\n{{sender_name}}',
    category: 'Follow-up'
  },
  {
    id: '3',
    name: 'Demo Request',
    subject: 'Product demo - {{product_name}}',
    body: 'Hi {{first_name}},\n\nThank you for your interest in {{product_name}}. I would love to show you a personalized demo.\n\nWhen would be a good time for you?\n\nRegards,\n{{sender_name}}',
    category: 'Demo'
  },
  {
    id: '4',
    name: 'Proposal Follow-up',
    subject: 'Re: Proposal for {{company_name}}',
    body: 'Hi {{first_name}},\n\nI wanted to check if you had a chance to review the proposal I sent last week.\n\nHappy to answer any questions you may have.\n\nBest,\n{{sender_name}}',
    category: 'Follow-up'
  },
  {
    id: '5',
    name: 'Case Study Share',
    subject: 'How {{customer_name}} achieved {{result}}',
    body: 'Hi {{first_name}},\n\nI thought you might be interested in this case study about how {{customer_name}} achieved {{result}} using our solution.\n\n[Link to case study]\n\nLet me know if you would like to discuss how we can help {{company_name}} achieve similar results.\n\nRegards,\n{{sender_name}}',
    category: 'Content'
  }
];

export default function TemplateSelectorModal({
  isOpen,
  onClose,
  onSelect
}: TemplateSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', ...new Set(mockTemplates.map(t => t.category))];

  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Select Email Template
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => {
                  onSelect(template);
                  onClose();
                }}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded group-hover:bg-purple-100 group-hover:text-purple-700">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Subject:</span> {template.subject}
                </p>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {template.body}
                </p>
              </button>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No templates found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
