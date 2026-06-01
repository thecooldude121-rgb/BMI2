import React, { useState, useEffect } from 'react';
import { Cpu, Search, Filter, Award, X } from 'lucide-react';
import { techStackService } from '../../services/dataIntelligenceService';
import type { CompanyTechStack, TechCategory, TechStackSummary } from '../../types/dataIntelligence';

interface TechnographicFilterWidgetProps {
  accountId?: string;
  onFilterChange?: (categories: TechCategory[]) => void;
}

const TECH_CATEGORIES: { value: TechCategory; label: string; icon: string }[] = [
  { value: 'crm', label: 'CRM', icon: '📊' },
  { value: 'marketing_automation', label: 'Marketing Automation', icon: '📧' },
  { value: 'sales_engagement', label: 'Sales Engagement', icon: '💼' },
  { value: 'email_marketing', label: 'Email Marketing', icon: '✉️' },
  { value: 'analytics', label: 'Analytics', icon: '📈' },
  { value: 'business_intelligence', label: 'Business Intelligence', icon: '🔍' },
  { value: 'customer_support', label: 'Customer Support', icon: '🎧' },
  { value: 'helpdesk', label: 'Helpdesk', icon: '🆘' },
  { value: 'live_chat', label: 'Live Chat', icon: '💬' },
  { value: 'project_management', label: 'Project Management', icon: '📋' },
  { value: 'collaboration', label: 'Collaboration', icon: '👥' },
  { value: 'productivity', label: 'Productivity', icon: '⚡' },
  { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
  { value: 'payment_processing', label: 'Payment Processing', icon: '💳' },
  { value: 'cloud_infrastructure', label: 'Cloud Infrastructure', icon: '☁️' },
  { value: 'security', label: 'Security', icon: '🔒' },
  { value: 'development_tools', label: 'Development Tools', icon: '🛠️' },
  { value: 'accounting', label: 'Accounting', icon: '💰' },
  { value: 'hr_management', label: 'HR Management', icon: '👔' },
  { value: 'video_conferencing', label: 'Video Conferencing', icon: '📹' }
];

const TechnographicFilterWidget: React.FC<TechnographicFilterWidgetProps> = ({
  accountId,
  onFilterChange
}) => {
  const [techStack, setTechStack] = useState<CompanyTechStack[]>([]);
  const [summary, setSummary] = useState<TechStackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<TechCategory[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    if (accountId) {
      loadTechStack();
    }
  }, [accountId]);

  const loadTechStack = async () => {
    if (!accountId) return;

    setLoading(true);
    try {
      const { data } = await techStackService.getTechStack({ account_id: accountId });
      setTechStack(data || []);

      const summaryData = await techStackService.getTechStackSummary(accountId);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading tech stack:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (category: TechCategory) => {
    const newSelected = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newSelected);
    onFilterChange?.(newSelected);
  };

  const getConfidenceColor = (confidence?: number): string => {
    if (!confidence) return 'bg-gray-100 text-gray-700';
    if (confidence >= 90) return 'bg-green-100 text-green-700';
    if (confidence >= 70) return 'bg-blue-100 text-blue-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const filteredTechStack = techStack.filter(tech =>
    tech.technology_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.tech_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedCategories = showAllCategories
    ? TECH_CATEGORIES
    : TECH_CATEGORIES.slice(0, 10);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Technographic Data</h3>
              <p className="text-sm text-gray-600">Technology stack & tools</p>
            </div>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">{summary.total_technologies}</div>
              <div className="text-xs text-purple-700">Technologies</div>
            </div>
            <div className="text-center p-3 bg-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-pink-900">{Object.keys(summary.by_category).length}</div>
              <div className="text-xs text-pink-700">Categories</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{summary.top_vendors.length}</div>
              <div className="text-xs text-blue-700">Top Vendors</div>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search technologies..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
            <Filter className="h-4 w-4 mr-2 text-purple-600" />
            Filter by Category
          </h4>
          {selectedCategories.length > 0 && (
            <button
              onClick={() => {
                setSelectedCategories([]);
                onFilterChange?.([]);
              }}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {displayedCategories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryToggle(cat.value)}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategories.includes(cat.value)
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-400'
              }`}
            >
              <span className="mr-1.5">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
        {!showAllCategories && TECH_CATEGORIES.length > 10 && (
          <button
            onClick={() => setShowAllCategories(true)}
            className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Show {TECH_CATEGORIES.length - 10} more categories
          </button>
        )}
      </div>

      <div className="p-6">
        {filteredTechStack.length === 0 ? (
          <div className="text-center py-8">
            <Cpu className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No technologies found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm ? 'Try a different search term' : 'Technology data will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTechStack.map((tech) => {
              const categoryInfo = TECH_CATEGORIES.find(c => c.value === tech.tech_category);

              return (
                <div
                  key={tech.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-xl">{categoryInfo?.icon || '🔧'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {tech.technology_name}
                        </h4>
                        {tech.integration_count > 0 && (
                          <span className="flex items-center text-xs text-blue-600">
                            <Award className="h-3 w-3 mr-1" />
                            {tech.integration_count} integrations
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs text-gray-500 capitalize">
                          {tech.tech_category.replace(/_/g, ' ')}
                        </span>
                        {tech.vendor && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-gray-600">{tech.vendor}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {tech.installation_confidence && (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceColor(tech.installation_confidence)}`}>
                        {tech.installation_confidence}% confident
                      </span>
                    )}
                    {tech.is_installed && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {summary && summary.top_vendors.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Top Vendors</h4>
          <div className="flex flex-wrap gap-2">
            {summary.top_vendors.map((vendor, idx) => (
              <div
                key={idx}
                className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-900">{vendor.vendor}</span>
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                  {vendor.tech_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnographicFilterWidget;
