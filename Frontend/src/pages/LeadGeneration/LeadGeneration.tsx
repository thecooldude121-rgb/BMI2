import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Download, Upload, Plus, LayoutGrid, List, 
  Users, Target, TrendingUp, DollarSign, Calendar, Phone, Mail, 
  Video, CheckSquare, MoreHorizontal, Star, Eye, Edit, Trash2,
  ArrowUpDown, ChevronDown, X, Settings, RefreshCw, Bell,
  Activity, Clock, Globe, Building, Tag, Zap, Bot, Sparkles,
  UserPlus, Database, Layers, BookOpen, Briefcase, MapPin,
  ExternalLink, Copy, Send, MessageSquare, LinkedinIcon,
  FileText, AlertCircle, CheckCircle, TrendingDown
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { aiEngine } from '../../utils/aiEngine';

// Enhanced Lead interface with Apollo.io-style features
interface EnhancedLead {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  industry: string;
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  status: 'active' | 'inactive' | 'nurturing';
  score: number;
  aiScore: number;
  value: number;
  probability: number;
  source: string;
  assignedTo: string;
  createdAt: string;
  lastContact?: string;
  notes?: string;
  tags?: string[];
  temperature: 'hot' | 'warm' | 'cold';
  nextAction?: string;
  lastActivity?: string;
  customFields?: Record<string, any>;
  
  // Apollo.io-style enrichment data
  enrichment: {
    verified: boolean;
    emailValid: boolean;
    phoneValid: boolean;
    linkedinUrl?: string;
    twitterUrl?: string;
    companyDomain?: string;
    companySize?: string;
    companyRevenue?: string;
    companyFunding?: string;
    technologies?: string[];
    intent?: 'high' | 'medium' | 'low';
    buyingSignals?: string[];
    lastEnriched?: string;
  };
  
  // Account-based data
  account: {
    id?: string;
    name: string;
    domain?: string;
    industry: string;
    size: string;
    revenue?: string;
    location?: string;
    employees?: number;
    founded?: string;
    description?: string;
  };
}

interface SearchFilters {
  search: string;
  industry: string[];
  position: string[];
  companySize: string[];
  location: string[];
  technologies: string[];
  stage: string;
  status: string;
  assignedTo: string;
  source: string[];
  scoreRange: [number, number];
  valueRange: [number, number];
  dateRange: string;
  tags: string[];
  intent: string[];
  verified: boolean | null;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
  lastUsed: string;
}

const LeadGeneration: React.FC = () => {
  const { leads: rawLeads, employees, updateLead, deleteLead, addLead } = useData();
  const navigate = useNavigate();
  
  // Enhanced leads with AI scoring and enrichment
  const [leads, setLeads] = useState<EnhancedLead[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'accounts'>('grid');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortBy, setSortBy] = useState<string>('aiScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showEnrichmentPanel, setShowEnrichmentPanel] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    industry: [],
    position: [],
    companySize: [],
    location: [],
    technologies: [],
    stage: 'all',
    status: 'all',
    assignedTo: 'all',
    source: [],
    scoreRange: [0, 100],
    valueRange: [0, 1000000],
    dateRange: 'all',
    tags: [],
    intent: [],
    verified: null
  });

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: '1',
      name: 'High-Value Tech CTOs',
      filters: {
        ...filters,
        industry: ['Technology'],
        position: ['CTO', 'VP Technology'],
        valueRange: [50000, 500000],
        scoreRange: [80, 100]
      },
      createdAt: '2024-01-15',
      lastUsed: '2024-01-20'
    },
    {
      id: '2',
      name: 'Healthcare Decision Makers',
      filters: {
        ...filters,
        industry: ['Healthcare'],
        position: ['Director', 'VP', 'Chief'],
        companySize: ['500-1000', '1000+']
      },
      createdAt: '2024-01-10',
      lastUsed: '2024-01-18'
    }
  ]);

  // Initialize enhanced leads with AI scoring and enrichment
  useEffect(() => {
    const enhancedLeads: EnhancedLead[] = rawLeads.map(lead => ({
      ...lead,
      firstName: lead.name.split(' ')[0] || '',
      lastName: lead.name.split(' ').slice(1).join(' ') || '',
      aiScore: aiEngine.scoreLeadFit(lead),
      temperature: lead.score > 80 ? 'hot' : lead.score > 60 ? 'warm' : 'cold',
      nextAction: getNextAction(lead),
      lastActivity: getLastActivity(lead.id),
      enrichment: {
        verified: Math.random() > 0.3,
        emailValid: Math.random() > 0.1,
        phoneValid: Math.random() > 0.2,
        linkedinUrl: Math.random() > 0.4 ? `https://linkedin.com/in/${lead.name.toLowerCase().replace(' ', '')}` : undefined,
        twitterUrl: Math.random() > 0.7 ? `https://twitter.com/${lead.name.toLowerCase().replace(' ', '')}` : undefined,
        companyDomain: `${lead.company.toLowerCase().replace(/\s+/g, '')}.com`,
        companySize: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'][Math.floor(Math.random() * 6)],
        companyRevenue: ['$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M+'][Math.floor(Math.random() * 4)],
        companyFunding: Math.random() > 0.6 ? ['Seed', 'Series A', 'Series B', 'Series C'][Math.floor(Math.random() * 4)] : undefined,
        technologies: ['Salesforce', 'HubSpot', 'AWS', 'Microsoft', 'Google Workspace'].slice(0, Math.floor(Math.random() * 3) + 1),
        intent: Math.random() > 0.5 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
        buyingSignals: Math.random() > 0.4 ? ['Job posting for sales roles', 'Recent funding round'] : [],
        lastEnriched: new Date().toISOString()
      },
      account: {
        id: `account-${lead.id}`,
        name: lead.company,
        domain: `${lead.company.toLowerCase().replace(/\s+/g, '')}.com`,
        industry: lead.industry,
        size: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'][Math.floor(Math.random() * 6)],
        revenue: ['$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M+'][Math.floor(Math.random() * 4)],
        location: ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA'][Math.floor(Math.random() * 5)],
        employees: Math.floor(Math.random() * 5000) + 50,
        founded: String(2000 + Math.floor(Math.random() * 24)),
        description: `${lead.company} is a leading company in the ${lead.industry} industry.`
      }
    }));
    setLeads(enhancedLeads);
  }, [rawLeads]);

  const getNextAction = (lead: any): string => {
    if (lead.stage === 'new') return 'Initial outreach';
    if (lead.stage === 'contacted') return 'Follow up call';
    if (lead.stage === 'qualified') return 'Send proposal';
    if (lead.stage === 'proposal') return 'Schedule demo';
    return 'Continue nurturing';
  };

  const getLastActivity = (leadId: string): string => {
    const activities = ['Called', 'Emailed', 'LinkedIn message', 'Demo completed'];
    return activities[Math.floor(Math.random() * activities.length)] + ' ' + 
           Math.floor(Math.random() * 7 + 1) + ' days ago';
  };

  // Advanced filtering logic
  const filteredLeads = leads.filter(lead => {
    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableText = `${lead.name} ${lead.company} ${lead.email} ${lead.position}`.toLowerCase();
      if (!searchableText.includes(searchLower)) return false;
    }

    // Multi-select filters
    if (filters.industry.length > 0 && !filters.industry.includes(lead.industry)) return false;
    if (filters.position.length > 0 && !filters.position.some(pos => lead.position.toLowerCase().includes(pos.toLowerCase()))) return false;
    if (filters.companySize.length > 0 && !filters.companySize.includes(lead.account.size)) return false;
    if (filters.source.length > 0 && !filters.source.includes(lead.source)) return false;
    if (filters.tags.length > 0 && !filters.tags.some(tag => lead.tags?.includes(tag))) return false;
    if (filters.intent.length > 0 && !filters.intent.includes(lead.enrichment.intent || 'low')) return false;

    // Single select filters
    if (filters.stage !== 'all' && lead.stage !== filters.stage) return false;
    if (filters.status !== 'all' && lead.status !== filters.status) return false;
    if (filters.assignedTo !== 'all' && lead.assignedTo !== filters.assignedTo) return false;

    // Range filters
    if (lead.score < filters.scoreRange[0] || lead.score > filters.scoreRange[1]) return false;
    if (lead.value < filters.valueRange[0] || lead.value > filters.valueRange[1]) return false;

    // Boolean filters
    if (filters.verified !== null && lead.enrichment.verified !== filters.verified) return false;

    return true;
  }).sort((a, b) => {
    let aValue = a[sortBy as keyof EnhancedLead];
    let bValue = b[sortBy as keyof EnhancedLead];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Calculate KPIs
  const kpis = {
    totalLeads: leads.length,
    verifiedLeads: leads.filter(l => l.enrichment.verified).length,
    highIntentLeads: leads.filter(l => l.enrichment.intent === 'high').length,
    avgScore: Math.round(leads.reduce((sum, l) => sum + l.aiScore, 0) / leads.length),
    conversionRate: leads.length > 0 ? Math.round((leads.filter(l => l.stage === 'won').length / leads.length) * 100) : 0,
    totalValue: leads.reduce((sum, l) => sum + l.value, 0),
    avgDealSize: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.value, 0) / leads.length) : 0,
    newThisWeek: leads.filter(l => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(l.createdAt) > weekAgo;
    }).length
  };

  // Bulk enrichment function
  const enrichSelectedLeads = async () => {
    setIsEnriching(true);
    // Simulate enrichment API call
    setTimeout(() => {
      setLeads(prev => prev.map(lead => 
        selectedLeads.includes(lead.id) 
          ? {
              ...lead,
              enrichment: {
                ...lead.enrichment,
                verified: true,
                emailValid: true,
                phoneValid: Math.random() > 0.2,
                lastEnriched: new Date().toISOString()
              }
            }
          : lead
      ));
      setIsEnriching(false);
      setSelectedLeads([]);
    }, 2000);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === paginatedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(paginatedLeads.map(lead => lead.id));
    }
  };

  const saveSearch = () => {
    const searchName = prompt('Enter a name for this search:');
    if (searchName) {
      const newSearch: SavedSearch = {
        id: Date.now().toString(),
        name: searchName,
        filters: { ...filters },
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };
      setSavedSearches(prev => [...prev, newSearch]);
    }
  };

  const loadSavedSearch = (search: SavedSearch) => {
    setFilters(search.filters);
    setSavedSearches(prev => prev.map(s => 
      s.id === search.id 
        ? { ...s, lastUsed: new Date().toISOString() }
        : s
    ));
  };

  const exportLeads = () => {
    const csvData = selectedLeads.length > 0 
      ? leads.filter(lead => selectedLeads.includes(lead.id))
      : filteredLeads;
    
    const csv = [
      ['Name', 'Email', 'Phone', 'Company', 'Position', 'Industry', 'Score', 'AI Score', 'Value', 'Stage', 'Source'].join(','),
      ...csvData.map(lead => [
        lead.name,
        lead.email,
        lead.phone,
        lead.company,
        lead.position,
        lead.industry,
        lead.score,
        lead.aiScore,
        lead.value,
        lead.stage,
        lead.source
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const renderKPICard = (title: string, value: string | number, icon: React.ElementType, change?: string, color = 'blue') => {
    const Icon = icon;
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600 text-blue-100',
      green: 'from-green-500 to-green-600 text-green-100',
      purple: 'from-purple-500 to-purple-600 text-purple-100',
      orange: 'from-orange-500 to-orange-600 text-orange-100',
      red: 'from-red-500 to-red-600 text-red-100'
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {change && (
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                {change}
              </p>
            )}
          </div>
          <div className={`p-4 rounded-xl bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} shadow-lg`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </div>
    );
  };

  const renderAdvancedFilters = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={saveSearch}
            className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Save Search
          </button>
          <button
            onClick={() => setFilters({
              search: '',
              industry: [],
              position: [],
              companySize: [],
              location: [],
              technologies: [],
              stage: 'all',
              status: 'all',
              assignedTo: 'all',
              source: [],
              scoreRange: [0, 100],
              valueRange: [0, 1000000],
              dateRange: 'all',
              tags: [],
              intent: [],
              verified: null
            })}
            className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Industry Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
          <select
            multiple
            value={filters.industry}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              industry: Array.from(e.target.selectedOptions, option => option.value)
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            size={4}
          >
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail</option>
            <option value="Education">Education</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Consulting">Consulting</option>
          </select>
        </div>

        {/* Position Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
          <select
            multiple
            value={filters.position}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              position: Array.from(e.target.selectedOptions, option => option.value)
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            size={4}
          >
            <option value="CEO">CEO</option>
            <option value="CTO">CTO</option>
            <option value="VP">VP</option>
            <option value="Director">Director</option>
            <option value="Manager">Manager</option>
            <option value="Founder">Founder</option>
          </select>
        </div>

        {/* Company Size Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
          <select
            multiple
            value={filters.companySize}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              companySize: Array.from(e.target.selectedOptions, option => option.value)
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            size={4}
          >
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="501-1000">501-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
        </div>

        {/* Intent Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Buying Intent</label>
          <select
            multiple
            value={filters.intent}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              intent: Array.from(e.target.selectedOptions, option => option.value)
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            size={3}
          >
            <option value="high">High Intent</option>
            <option value="medium">Medium Intent</option>
            <option value="low">Low Intent</option>
          </select>
        </div>
      </div>

      {/* Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lead Score Range: {filters.scoreRange[0]} - {filters.scoreRange[1]}
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="0"
              max="100"
              value={filters.scoreRange[0]}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                scoreRange: [Number(e.target.value), prev.scoreRange[1]] 
              }))}
              className="flex-1"
            />
            <input
              type="range"
              min="0"
              max="100"
              value={filters.scoreRange[1]}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                scoreRange: [prev.scoreRange[0], Number(e.target.value)] 
              }))}
              className="flex-1"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deal Value Range: ${filters.valueRange[0].toLocaleString()} - ${filters.valueRange[1].toLocaleString()}
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="0"
              max="1000000"
              step="5000"
              value={filters.valueRange[0]}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                valueRange: [Number(e.target.value), prev.valueRange[1]] 
              }))}
              className="flex-1"
            />
            <input
              type="range"
              min="0"
              max="1000000"
              step="5000"
              value={filters.valueRange[1]}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                valueRange: [prev.valueRange[0], Number(e.target.value)] 
              }))}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Boolean Filters */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Data Quality</label>
        <div className="flex items-center space-x-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.verified === true}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                verified: e.target.checked ? true : null 
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Verified contacts only</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSavedSearches = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Searches</h3>
      <div className="space-y-3">
        {savedSearches.map(search => (
          <div key={search.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div>
              <h4 className="font-medium text-gray-900">{search.name}</h4>
              <p className="text-sm text-gray-500">Last used: {new Date(search.lastUsed).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadSavedSearch(search)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Load
              </button>
              <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLeadCard = (lead: EnhancedLead) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={selectedLeads.includes(lead.id)}
            onChange={() => handleSelectLead(lead.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
          </div>
          <div>
            <button
              onClick={() => navigate(`/lead-generation/leads/${lead.id}`)}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {lead.name}
            </button>
            <p className="text-sm text-gray-600">{lead.position}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            lead.temperature === 'hot' ? 'bg-red-500' :
            lead.temperature === 'warm' ? 'bg-orange-500' : 'bg-blue-500'
          }`} />
          {lead.enrichment.verified && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Company Info */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Building className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">{lead.company}</span>
          <span className="text-sm text-gray-500">• {lead.industry}</span>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{lead.account.size} employees</span>
          <span>{lead.account.revenue}</span>
          <span>{lead.account.location}</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{lead.email}</span>
          {lead.enrichment.emailValid && (
            <CheckCircle className="h-3 w-3 text-green-500" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{lead.phone}</span>
          {lead.enrichment.phoneValid && (
            <CheckCircle className="h-3 w-3 text-green-500" />
          )}
        </div>
        {lead.enrichment.linkedinUrl && (
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <a 
              href={lead.enrichment.linkedinUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              LinkedIn Profile
            </a>
          </div>
        )}
      </div>

      {/* Scores */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">Score: {lead.score}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Bot className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">AI: {lead.aiScore}</span>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">${lead.value.toLocaleString()}</span>
        </div>
      </div>

      {/* Stage and Status */}
      <div className="flex items-center space-x-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          lead.stage === 'won' ? 'bg-green-100 text-green-800' :
          lead.stage === 'qualified' ? 'bg-blue-100 text-blue-800' :
          lead.stage === 'proposal' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          lead.status === 'active' ? 'bg-green-100 text-green-800' :
          lead.status === 'nurturing' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
        </span>
      </div>

      {/* Technologies */}
      {lead.enrichment.technologies && lead.enrichment.technologies.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Technologies:</p>
          <div className="flex flex-wrap gap-1">
            {lead.enrichment.technologies.slice(0, 3).map((tech, index) => (
              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                {tech}
              </span>
            ))}
            {lead.enrichment.technologies.length > 3 && (
              <span className="text-xs text-gray-500">+{lead.enrichment.technologies.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {/* Buying Signals */}
      {lead.enrichment.buyingSignals && lead.enrichment.buyingSignals.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <Zap className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              {lead.enrichment.buyingSignals[0]}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Mail className="h-4 w-4" />
          </button>
          <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
            <Phone className="h-4 w-4" />
          </button>
          <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500">
          {lead.lastActivity}
        </div>
      </div>
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              {[
                { key: 'name', label: 'Lead' },
                { key: 'company', label: 'Company' },
                { key: 'position', label: 'Position' },
                { key: 'industry', label: 'Industry' },
                { key: 'score', label: 'Score' },
                { key: 'value', label: 'Value' },
                { key: 'stage', label: 'Stage' },
                { key: 'enrichment', label: 'Data Quality' },
                { key: 'actions', label: 'Actions' }
              ].map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => column.key !== 'actions' && column.key !== 'enrichment' && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column.label}</span>
                    {column.key !== 'actions' && column.key !== 'enrichment' && (
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedLeads.map((lead) => (
              <tr 
                key={lead.id} 
                className={`hover:bg-gray-50 transition-colors ${
                  selectedLeads.includes(lead.id) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedLeads.includes(lead.id)}
                    onChange={() => handleSelectLead(lead.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                    </div>
                    <div>
                      <button 
                        onClick={() => navigate(`/lead-generation/leads/${lead.id}`)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {lead.name}
                      </button>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{lead.email}</span>
                        {lead.enrichment.emailValid && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lead.company}</p>
                    <p className="text-xs text-gray-500">{lead.account.size} • {lead.account.location}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{lead.position}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{lead.industry}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          lead.score >= 90 ? 'text-green-600 bg-green-100' :
                          lead.score >= 80 ? 'text-blue-600 bg-blue-100' :
                          lead.score >= 70 ? 'text-yellow-600 bg-yellow-100' :
                          lead.score >= 60 ? 'text-orange-600 bg-orange-100' :
                          'text-red-600 bg-red-100'
                        }`}>
                          {lead.score}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          lead.aiScore >= 90 ? 'text-green-600 bg-green-100' :
                          lead.aiScore >= 80 ? 'text-blue-600 bg-blue-100' :
                          lead.aiScore >= 70 ? 'text-yellow-600 bg-yellow-100' :
                          lead.aiScore >= 60 ? 'text-orange-600 bg-orange-100' :
                          'text-red-600 bg-red-100'
                        }`}>
                          AI: {lead.aiScore}
                        </span>
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${lead.aiScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-green-600">${lead.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{lead.probability}% probability</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    lead.stage === 'won' ? 'bg-green-100 text-green-800' :
                    lead.stage === 'qualified' ? 'bg-blue-100 text-blue-800' :
                    lead.stage === 'proposal' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {lead.enrichment.verified && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-600">Verified</span>
                      </div>
                    )}
                    {lead.enrichment.intent === 'high' && (
                      <div className="flex items-center space-x-1">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <span className="text-xs text-orange-600">High Intent</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => navigate(`/lead-generation/leads/${lead.id}`)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAccountsView = () => {
    const accountGroups = leads.reduce((acc, lead) => {
      const accountKey = lead.company;
      if (!acc[accountKey]) {
        acc[accountKey] = {
          account: lead.account,
          leads: []
        };
      }
      acc[accountKey].leads.push(lead);
      return acc;
    }, {} as Record<string, { account: any; leads: EnhancedLead[] }>);

    return (
      <div className="space-y-6">
        {Object.entries(accountGroups).map(([accountName, group]) => (
          <div key={accountName} className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Account Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {accountName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{accountName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>{group.account.industry}</span>
                      <span>•</span>
                      <span>{group.account.size} employees</span>
                      <span>•</span>
                      <span>{group.account.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-blue-600">{group.account.domain}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{group.leads.length} contacts</p>
                  <p className="text-lg font-bold text-green-600">
                    ${group.leads.reduce((sum, lead) => sum + lead.value, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Leads in Account */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.leads.map(lead => (
                  <div key={lead.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <button
                          onClick={() => navigate(`/lead-generation/leads/${lead.id}`)}
                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {lead.name}
                        </button>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-gray-600">{lead.aiScore}</span>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{lead.position}</p>
                    <div className="flex items-center space-x-2 mb-2">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{lead.email}</span>
                      {lead.enrichment.emailValid && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lead.stage === 'won' ? 'bg-green-100 text-green-800' :
                        lead.stage === 'qualified' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.stage}
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        ${lead.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-2">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Lead Generation</h1>
                <p className="text-gray-600 text-lg">Apollo.io-style prospecting and lead intelligence platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-l transition-all ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <List className="h-4 w-4 mr-2" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('accounts')}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-l transition-all ${
                    viewMode === 'accounts'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <Building className="h-4 w-4 mr-2" />
                  Accounts
                </button>
              </div>

              <button 
                onClick={() => setShowEnrichmentPanel(true)}
                className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white"
              >
                <Database className="h-4 w-4 mr-2" />
                Enrich Data
              </button>
              
              <button 
                onClick={exportLeads}
                className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {renderKPICard('Total Leads', kpis.totalLeads, Users, '+12%', 'blue')}
            {renderKPICard('Verified', kpis.verifiedLeads, CheckCircle, '+8%', 'green')}
            {renderKPICard('High Intent', kpis.highIntentLeads, Zap, '+15%', 'orange')}
            {renderKPICard('Avg AI Score', kpis.avgScore, Bot, '+5%', 'purple')}
          </div>

          {/* Search and Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leads, companies, emails, positions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 pr-4 py-2.5 w-96 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
              
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center px-4 py-2.5 border rounded-xl text-sm transition-colors shadow-sm ${
                  showAdvancedFilters 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50 bg-white'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </button>
              
              <button className="flex items-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span>{filteredLeads.length} of {leads.length} leads</span>
              <span>•</span>
              <span>Pipeline Value: ${kpis.totalValue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Saved Searches:</span>
            {savedSearches.slice(0, 3).map(search => (
              <button
                key={search.id}
                onClick={() => loadSavedSearch(search)}
                className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                {search.name}
              </button>
            ))}
            <button className="text-sm text-blue-600 hover:text-blue-800">View all</button>
          </div>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="px-6 py-6 bg-gray-50 border-b border-gray-200">
          {renderAdvancedFilters()}
        </div>
      )}

      {/* AI Insights Banner */}
      <div className="px-6 py-4">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Bot className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-900">AI Lead Intelligence</h3>
                <p className="text-purple-700">
                  {leads.filter(l => l.aiScore > 85).length} high-potential leads identified • 
                  {leads.filter(l => l.enrichment.intent === 'high').length} high-intent prospects • 
                  {leads.filter(l => l.enrichment.buyingSignals && l.enrichment.buyingSignals.length > 0).length} buying signals detected
                </p>
              </div>
            </div>
            <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Sparkles className="h-4 w-4 mr-2" />
              View AI Insights
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedLeads.map(lead => renderLeadCard(lead))}
          </div>
        )}
        
        {viewMode === 'table' && renderTableView()}
        {viewMode === 'accounts' && renderAccountsView()}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-6 py-4 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>per page</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Floating Bar */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4 z-50">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={enrichSelectedLeads}
                disabled={isEnriching}
                className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {isEnriching ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Enrich Data
              </button>
              <button className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                <Send className="h-4 w-4 mr-2" />
                Add to Sequence
              </button>
              <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Owner
              </button>
              <button 
                onClick={exportLeads}
                className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
            <button
              onClick={() => setSelectedLeads([])}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Enrichment Panel */}
      {showEnrichmentPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
          <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-2xl rounded-2xl bg-white">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Database className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Data Enrichment</h2>
                  <p className="text-gray-600">Enhance your leads with verified contact data and company intelligence</p>
                </div>
              </div>
              <button
                onClick={() => setShowEnrichmentPanel(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Verification</h3>
                <p className="text-sm text-gray-600 mb-4">Verify email addresses and improve deliverability</p>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Verify Emails
                </button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <Phone className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Enrichment</h3>
                <p className="text-sm text-gray-600 mb-4">Find and verify phone numbers for your contacts</p>
                <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Find Phones
                </button>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
                <Building className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Company Data</h3>
                <p className="text-sm text-gray-600 mb-4">Enrich with company size, revenue, and technographics</p>
                <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Enrich Companies
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredLeads.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
          <p className="text-gray-600 mb-6">
            {filters.search || filters.industry.length > 0 
              ? 'Try adjusting your search or filters'
              : 'Start prospecting to build your lead database'
            }
          </p>
          <button 
            onClick={() => navigate('/crm/leads/new')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            Add Your First Lead
          </button>
        </div>
      )}
    </div>
  );
};

export default LeadGeneration;