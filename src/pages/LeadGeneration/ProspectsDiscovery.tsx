import React, { useState } from 'react';
import {
  Search, Filter, Download, Upload, Save, Star, TrendingUp, Building2,
  MapPin, Briefcase, Code, Globe, Linkedin, Mail, Phone, Users, Calendar,
  Eye, Edit, Trash2, Plus, X, CheckCircle, AlertCircle, Clock, Zap,
  Target, DollarSign, BarChart3, RefreshCw, Sparkles, ChevronDown, ChevronUp,
  ExternalLink, Copy, Share2, FileText, Settings, SlidersHorizontal
} from 'lucide-react';

interface Prospect {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  location: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  companySize: string;
  revenue?: string;
  techStack: string[];
  buyingIntent: 'high' | 'medium' | 'low';
  leadScore: number;
  status: 'new' | 'contacted' | 'qualified' | 'nurturing' | 'converted';
  lastActivity?: string;
  source: string;
  enriched: boolean;
  tags: string[];
  notes?: string;
}

interface SavedView {
  id: string;
  name: string;
  filters: any;
  isDefault: boolean;
}

const ProspectsDiscovery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [showEnrichModal, setShowEnrichModal] = useState(false);
  const [editingProspect, setEditingProspect] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [filters, setFilters] = useState({
    title: '',
    location: '',
    company: '',
    industry: '',
    techStack: [] as string[],
    buyingIntent: 'all',
    minLeadScore: 0,
    status: 'all',
    companySize: 'all'
  });

  const [prospects, setProspects] = useState<Prospect[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      title: 'VP of Sales',
      company: 'TechCorp Inc.',
      industry: 'SaaS',
      location: 'San Francisco, CA',
      email: 'sarah.johnson@techcorp.com',
      phone: '+1 (415) 555-0123',
      linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
      companySize: '500-1000',
      revenue: '$50M-$100M',
      techStack: ['Salesforce', 'HubSpot', 'Slack'],
      buyingIntent: 'high',
      leadScore: 92,
      status: 'new',
      lastActivity: '2024-01-21T15:30:00Z',
      source: 'LinkedIn',
      enriched: true,
      tags: ['Enterprise', 'Hot Lead', 'Q1 Priority']
    },
    {
      id: '2',
      name: 'Michael Chen',
      title: 'Director of Marketing',
      company: 'Growth Solutions',
      industry: 'Marketing',
      location: 'New York, NY',
      email: 'mchen@growthsolutions.com',
      linkedinUrl: 'https://linkedin.com/in/michaelchen',
      companySize: '100-500',
      revenue: '$10M-$50M',
      techStack: ['Marketo', 'Google Analytics', 'Tableau'],
      buyingIntent: 'medium',
      leadScore: 78,
      status: 'contacted',
      lastActivity: '2024-01-20T10:00:00Z',
      source: 'Website',
      enriched: true,
      tags: ['Mid-Market', 'Follow-up']
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      title: 'CTO',
      company: 'DataStream Analytics',
      industry: 'Data Analytics',
      location: 'Austin, TX',
      email: 'emily.r@datastream.io',
      phone: '+1 (512) 555-0456',
      linkedinUrl: 'https://linkedin.com/in/emilyrodriguez',
      companySize: '50-100',
      revenue: '$5M-$10M',
      techStack: ['AWS', 'Python', 'Docker', 'Kubernetes'],
      buyingIntent: 'high',
      leadScore: 88,
      status: 'qualified',
      lastActivity: '2024-01-21T09:15:00Z',
      source: 'Referral',
      enriched: true,
      tags: ['Technical Buyer', 'High Priority']
    },
    {
      id: '4',
      name: 'David Kim',
      title: 'Head of Business Development',
      company: 'Innovate Labs',
      industry: 'Technology',
      location: 'Seattle, WA',
      email: 'david.kim@innovatelabs.com',
      companySize: '1000+',
      revenue: '$100M+',
      techStack: ['Microsoft Dynamics', 'Power BI'],
      buyingIntent: 'low',
      leadScore: 65,
      status: 'nurturing',
      lastActivity: '2024-01-18T14:30:00Z',
      source: 'Conference',
      enriched: false,
      tags: ['Enterprise', 'Long Sales Cycle']
    },
    {
      id: '5',
      name: 'Jessica Martinez',
      title: 'Sales Operations Manager',
      company: 'CloudFirst Solutions',
      industry: 'Cloud Services',
      location: 'Denver, CO',
      email: 'jmartinez@cloudfirst.com',
      phone: '+1 (303) 555-0789',
      linkedinUrl: 'https://linkedin.com/in/jessicamartinez',
      companySize: '100-500',
      revenue: '$10M-$50M',
      techStack: ['Salesforce', 'ZoomInfo', 'Outreach'],
      buyingIntent: 'medium',
      leadScore: 73,
      status: 'contacted',
      lastActivity: '2024-01-19T16:45:00Z',
      source: 'LinkedIn',
      enriched: true,
      tags: ['Decision Maker', 'Active']
    }
  ]);

  const [savedViews] = useState<SavedView[]>([
    { id: '1', name: 'All Prospects', filters: {}, isDefault: true },
    { id: '2', name: 'High Intent Leads', filters: { buyingIntent: 'high' }, isDefault: false },
    { id: '3', name: 'Enterprise Prospects', filters: { companySize: '1000+' }, isDefault: false },
    { id: '4', name: 'Recently Contacted', filters: { status: 'contacted' }, isDefault: false }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'blue';
      case 'contacted': return 'yellow';
      case 'qualified': return 'green';
      case 'nurturing': return 'purple';
      case 'converted': return 'teal';
      default: return 'gray';
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'orange';
  };

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = searchQuery === '' ||
      prospect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prospect.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prospect.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters =
      (filters.title === '' || prospect.title.toLowerCase().includes(filters.title.toLowerCase())) &&
      (filters.location === '' || prospect.location.toLowerCase().includes(filters.location.toLowerCase())) &&
      (filters.company === '' || prospect.company.toLowerCase().includes(filters.company.toLowerCase())) &&
      (filters.industry === '' || prospect.industry.toLowerCase().includes(filters.industry.toLowerCase())) &&
      (filters.buyingIntent === 'all' || prospect.buyingIntent === filters.buyingIntent) &&
      (filters.status === 'all' || prospect.status === filters.status) &&
      (filters.companySize === 'all' || prospect.companySize === filters.companySize) &&
      prospect.leadScore >= filters.minLeadScore;

    return matchesSearch && matchesFilters;
  });

  const handleSelectAll = () => {
    if (selectedProspects.length === filteredProspects.length) {
      setSelectedProspects([]);
    } else {
      setSelectedProspects(filteredProspects.map(p => p.id));
    }
  };

  const handleSelectProspect = (id: string) => {
    if (selectedProspects.includes(id)) {
      setSelectedProspects(selectedProspects.filter(pid => pid !== id));
    } else {
      setSelectedProspects([...selectedProspects, id]);
    }
  };

  const handleBulkEnrich = () => {
    setShowEnrichModal(true);
  };

  const handleBulkExport = () => {
    const exportData = prospects.filter(p => selectedProspects.includes(p.id));
    console.log('Exporting:', exportData);
  };

  const analytics = {
    totalProspects: prospects.length,
    highIntent: prospects.filter(p => p.buyingIntent === 'high').length,
    avgLeadScore: Math.round(prospects.reduce((sum, p) => sum + p.leadScore, 0) / prospects.length),
    enriched: prospects.filter(p => p.enriched).length,
    qualified: prospects.filter(p => p.status === 'qualified').length,
    conversion: 12.5
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Prospects Discovery</h1>
              <p className="text-gray-600 mt-1">Intelligent lead generation and prospecting</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Save View</span>
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Prospect</span>
            </button>
          </div>
        </div>

        {/* Analytics Panel */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{analytics.totalProspects}</span>
            </div>
            <div className="text-sm text-gray-600">Total Prospects</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{analytics.highIntent}</span>
            </div>
            <div className="text-sm text-gray-600">High Intent</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{analytics.avgLeadScore}</span>
            </div>
            <div className="text-sm text-gray-600">Avg Score</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{analytics.enriched}</span>
            </div>
            <div className="text-sm text-gray-600">Enriched</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-teal-600" />
              <span className="text-2xl font-bold text-teal-600">{analytics.qualified}</span>
            </div>
            <div className="text-sm text-gray-600">Qualified</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{analytics.conversion}%</span>
            </div>
            <div className="text-sm text-gray-600">Conversion</div>
          </div>
        </div>

        {/* Saved Views */}
        <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
          {savedViews.map(view => (
            <button
              key={view.id}
              className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center space-x-2 ${
                view.isDefault
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{view.name}</span>
              {view.isDefault && <Star className="h-3 w-3" />}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, company, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4" />
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              <Upload className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g., VP, Director"
                  value={filters.title}
                  onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="City, State"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  placeholder="Company name"
                  value={filters.company}
                  onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input
                  type="text"
                  placeholder="e.g., SaaS, Tech"
                  value={filters.industry}
                  onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buying Intent</label>
                <select
                  value={filters.buyingIntent}
                  onChange={(e) => setFilters({ ...filters, buyingIntent: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="nurturing">Nurturing</option>
                  <option value="converted">Converted</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                <select
                  value={filters.companySize}
                  onChange={(e) => setFilters({ ...filters, companySize: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="1-50">1-50</option>
                  <option value="50-100">50-100</option>
                  <option value="100-500">100-500</option>
                  <option value="500-1000">500-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Lead Score</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minLeadScore}
                  onChange={(e) => setFilters({ ...filters, minLeadScore: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 text-center">{filters.minLeadScore}</div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedProspects.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">
                {selectedProspects.length} prospect{selectedProspects.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkEnrich}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 text-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Enrich All</span>
                </button>
                <button
                  onClick={handleBulkExport}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4" />
                  <span>Email Campaign</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prospects Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProspects.length === filteredProspects.length && filteredProspects.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Prospect</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tech Stack</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Intent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProspects.map(prospect => {
                const isEditing = editingProspect === prospect.id;
                const statusColor = getStatusColor(prospect.status);
                const intentColor = getIntentColor(prospect.buyingIntent);
                const scoreColor = getScoreColor(prospect.leadScore);

                return (
                  <tr key={prospect.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProspects.includes(prospect.id)}
                        onChange={() => handleSelectProspect(prospect.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center space-x-2">
                            <span>{prospect.name}</span>
                            {prospect.enriched && (
                              <Sparkles className="h-3 w-3 text-purple-600" title="Enriched" />
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{prospect.title}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <a
                              href={`mailto:${prospect.email}`}
                              className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                            >
                              <Mail className="h-3 w-3" />
                              <span>Email</span>
                            </a>
                            {prospect.linkedinUrl && (
                              <a
                                href={prospect.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                              >
                                <Linkedin className="h-3 w-3" />
                                <span>LinkedIn</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{prospect.company}</div>
                        <div className="text-sm text-gray-600">{prospect.industry}</div>
                        <div className="text-xs text-gray-500 mt-1">{prospect.companySize} employees</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>{prospect.location}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {prospect.techStack.slice(0, 2).map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                        {prospect.techStack.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            +{prospect.techStack.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 bg-${intentColor}-100 text-${intentColor}-800 rounded-full text-xs font-semibold uppercase flex items-center space-x-1 w-fit`}>
                        <Zap className="h-3 w-3" />
                        <span>{prospect.buyingIntent}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div
                            className={`bg-${scoreColor}-600 h-2 rounded-full`}
                            style={{ width: `${prospect.leadScore}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold text-${scoreColor}-600`}>{prospect.leadScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 bg-${statusColor}-100 text-${statusColor}-800 rounded-full text-xs font-semibold uppercase`}>
                        {prospect.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end space-x-1">
                        {!prospect.enriched && (
                          <button
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Enrich"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingProspect(isEditing ? null : prospect.id)}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Send Email"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                          title="Copy"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Results Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {filteredProspects.length} of {prospects.length} prospects
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white">Previous</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white">2</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Enrich Modal */}
      {showEnrichModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI-Powered Enrichment</h3>
                  <p className="text-sm text-gray-600">Enrich {selectedProspects.length} prospects with additional data</p>
                </div>
              </div>
              <button onClick={() => setShowEnrichModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Enrichment Options:</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600" />
                      <span className="text-sm text-gray-700">Company information (size, revenue, industry)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600" />
                      <span className="text-sm text-gray-700">Contact details (phone, email verification)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600" />
                      <span className="text-sm text-gray-700">Technology stack analysis</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600" />
                      <span className="text-sm text-gray-700">Social media profiles (LinkedIn, Twitter)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600" />
                      <span className="text-sm text-gray-700">Buying intent signals</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600" />
                      <span className="text-sm text-gray-700">AI-generated lead score</span>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <strong>Credits Required:</strong> {selectedProspects.length * 2} credits
                      <br />
                      <span className="text-gray-600">Estimated completion time: 2-3 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowEnrichModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>Start Enrichment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectsDiscovery;
