import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Upload, Eye, Plus, Target, Users, 
  Building, Globe, MapPin, DollarSign, TrendingUp, Star, Zap,
  ArrowLeft, Settings, RefreshCw, Database, Bot, Sparkles,
  ChevronDown, ChevronUp, X, Save, Play, Pause, CheckCircle,
  AlertCircle, Clock, Mail, Phone, Calendar, Tag, Briefcase,
  Award, Code, Cpu, Shield, Heart, Banknote, Factory, GraduationCap,
  Home, Car, Plane, Ship, Truck, Wrench, Palette, Music, Camera,
  Book, Coffee, Gamepad2, Headphones, Monitor, Smartphone, Tablet,
  Wifi, Cloud, Server, HardDrive, Lock, Key, UserCheck, FileText,
  BarChart3, PieChart, LineChart, Activity, Layers, Grid, List,
  Columns, Rows, Table, Archive, Folder, FolderOpen, File,
  Image, Video, Mic, Speaker, Volume2, VolumeX, Bell, BellOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchFilters {
  // Person Filters
  jobTitles: string[];
  seniority: string[];
  departments: string[];
  experienceYears: { min: number; max: number };
  skills: string[];
  certifications: string[];
  education: string[];
  languages: string[];
  
  // Company Filters
  industries: string[];
  companySize: string[];
  revenue: { min: number; max: number };
  fundingStage: string[];
  foundedYear: { min: number; max: number };
  technologies: string[];
  businessModel: string[];
  companyType: string[];
  
  // Geography Filters
  countries: string[];
  states: string[];
  cities: string[];
  regions: string[];
  timezone: string[];
  
  // Engagement Filters
  buyingIntent: string[];
  websiteActivity: string[];
  contentEngagement: string[];
  socialActivity: string[];
  emailEngagement: string[];
  
  // Contact Info Filters
  hasEmail: boolean;
  hasPhone: boolean;
  hasLinkedIn: boolean;
  emailDeliverability: string[];
  phoneType: string[];
  
  // Custom Filters
  customTags: string[];
  dataQuality: { min: number; max: number };
  lastEnriched: string;
  source: string[];
}

interface SearchPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  filters: Partial<SearchFilters>;
  category: 'persona' | 'industry' | 'custom';
}

interface DataProvider {
  id: string;
  name: string;
  type: 'linkedin' | 'database' | 'api' | 'custom';
  status: 'active' | 'inactive' | 'error';
  coverage: string;
  cost: string;
  quality: number;
}

interface SearchResult {
  id: string;
  type: 'person' | 'company';
  name: string;
  title?: string;
  company?: string;
  industry?: string;
  location: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  score: number;
  aiScore: number;
  dataQuality: number;
  lastEnriched: string;
  source: string[];
  buyingIntent: 'high' | 'medium' | 'low';
  tags: string[];
}

const ProspectDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Partial<SearchFilters>>({});
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [searchError, setSearchError] = useState<string>('');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [estimatedResults, setEstimatedResults] = useState(0);
  const [searchInsights, setSearchInsights] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [searchName, setSearchName] = useState('');

  // Data Providers
  const dataProviders: DataProvider[] = [
    { id: 'linkedin', name: 'LinkedIn Sales Navigator', type: 'linkedin', status: 'active', coverage: '900M+ profiles', cost: '$79/mo', quality: 95 },
    { id: 'apollo', name: 'Apollo.io', type: 'database', status: 'active', coverage: '275M+ contacts', cost: '$49/mo', quality: 92 },
    { id: 'zoominfo', name: 'ZoomInfo', type: 'database', status: 'active', coverage: '150M+ profiles', cost: '$99/mo', quality: 94 },
    { id: 'clearbit', name: 'Clearbit', type: 'api', status: 'active', coverage: '20M+ companies', cost: '$99/mo', quality: 96 },
    { id: 'hunter', name: 'Hunter.io', type: 'api', status: 'active', coverage: '100M+ emails', cost: '$49/mo', quality: 88 },
    { id: 'builtwith', name: 'BuiltWith', type: 'api', status: 'active', coverage: '50M+ websites', cost: '$295/mo', quality: 90 }
  ];

  // Search Presets
  const searchPresets: SearchPreset[] = [
    {
      id: 'enterprise-ctos',
      name: 'Enterprise CTOs',
      description: 'Chief Technology Officers at large enterprises',
      icon: Cpu,
      category: 'persona',
      filters: {
        jobTitles: ['CTO', 'Chief Technology Officer', 'VP of Technology'],
        seniority: ['C-Level', 'VP'],
        companySize: ['1000-5000', '5000+'],
        industries: ['Technology', 'Software', 'SaaS'],
        revenue: { min: 50000000, max: 1000000000 }
      }
    },
    {
      id: 'healthcare-directors',
      name: 'Healthcare Directors',
      description: 'Operations and IT directors in healthcare',
      icon: Heart,
      category: 'persona',
      filters: {
        jobTitles: ['Director', 'VP of Operations', 'IT Director'],
        seniority: ['Director', 'VP'],
        industries: ['Healthcare', 'Medical Devices', 'Pharmaceuticals'],
        companySize: ['200-1000', '1000+']
      }
    },
    {
      id: 'fintech-founders',
      name: 'FinTech Founders',
      description: 'Founders and executives in financial technology',
      icon: Banknote,
      category: 'persona',
      filters: {
        jobTitles: ['Founder', 'CEO', 'Co-Founder'],
        seniority: ['C-Level', 'Founder'],
        industries: ['Financial Services', 'FinTech', 'Banking'],
        fundingStage: ['Seed', 'Series A', 'Series B'],
        technologies: ['Blockchain', 'AI/ML', 'API']
      }
    },
    {
      id: 'saas-growth',
      name: 'SaaS Growth Leaders',
      description: 'Growth and marketing leaders at SaaS companies',
      icon: TrendingUp,
      category: 'persona',
      filters: {
        jobTitles: ['VP of Growth', 'Head of Marketing', 'Growth Manager'],
        seniority: ['VP', 'Director', 'Manager'],
        industries: ['SaaS', 'Software', 'Technology'],
        companySize: ['50-200', '200-1000'],
        buyingIntent: ['high', 'medium']
      }
    },
    {
      id: 'manufacturing-ops',
      name: 'Manufacturing Operations',
      description: 'Operations leaders in manufacturing',
      icon: Factory,
      category: 'industry',
      filters: {
        jobTitles: ['Operations Manager', 'Plant Manager', 'VP of Operations'],
        industries: ['Manufacturing', 'Industrial', 'Automotive'],
        companySize: ['500-1000', '1000+']
      }
    },
    {
      id: 'ecommerce-executives',
      name: 'E-commerce Executives',
      description: 'Leadership at e-commerce and retail companies',
      icon: Globe,
      category: 'industry',
      filters: {
        jobTitles: ['CEO', 'VP of Sales', 'Head of E-commerce'],
        industries: ['E-commerce', 'Retail', 'Consumer Goods'],
        technologies: ['Shopify', 'Magento', 'WooCommerce']
      }
    }
  ];

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'person',
      name: 'Sarah Chen',
      title: 'Chief Technology Officer',
      company: 'TechCorp Solutions',
      industry: 'Software',
      location: 'San Francisco, CA',
      email: 'sarah.chen@techcorp.com',
      phone: '+1-555-0101',
      linkedinUrl: 'https://linkedin.com/in/sarahchen',
      score: 92,
      aiScore: 88,
      dataQuality: 95,
      lastEnriched: '2024-01-20',
      source: ['LinkedIn', 'Apollo'],
      buyingIntent: 'high',
      tags: ['enterprise', 'decision-maker', 'tech-leader']
    },
    {
      id: '2',
      type: 'person',
      name: 'Michael Rodriguez',
      title: 'VP of Engineering',
      company: 'InnovateTech Inc',
      industry: 'Technology',
      location: 'Austin, TX',
      email: 'michael.r@innovatetech.com',
      phone: '+1-555-0102',
      linkedinUrl: 'https://linkedin.com/in/michaelrodriguez',
      score: 87,
      aiScore: 85,
      dataQuality: 92,
      lastEnriched: '2024-01-19',
      source: ['ZoomInfo', 'Clearbit'],
      buyingIntent: 'medium',
      tags: ['engineering', 'vp-level', 'growth-stage']
    },
    {
      id: '3',
      type: 'company',
      name: 'HealthTech Solutions',
      industry: 'Healthcare Technology',
      location: 'Boston, MA',
      score: 89,
      aiScore: 91,
      dataQuality: 88,
      lastEnriched: '2024-01-18',
      source: ['Clearbit', 'BuiltWith'],
      buyingIntent: 'high',
      tags: ['healthcare', 'series-b', 'hipaa-compliant']
    }
  ];

  const executeSearch = async () => {
    setIsSearching(true);
    setSearchError('');
    
    try {
      console.log('Executing search with filters:', filters);
      console.log('Search query:', searchQuery);
      
      // Validate search criteria
      if (!searchQuery.trim() && Object.keys(filters).length === 0) {
        setSearchError('Please enter a search query or select at least one filter');
        setIsSearching(false);
        return;
      }
      
      // Simulate API call with actual filter processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock search results based on actual filters and query
      const mockResults = generateSearchResults(searchQuery, filters);
      
      setSearchResults(mockResults);
      setSearchExecuted(true);
      setEstimatedResults(mockResults.length);
      
      console.log('Search completed. Results:', mockResults.length);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  const generateSearchResults = (query: string, searchFilters: any): SearchResult[] => {
    // Base mock data
    const baseResults: SearchResult[] = [
      {
        id: '1',
        type: 'person',
        name: 'Sarah Chen',
        title: 'Chief Technology Officer',
        company: 'TechCorp Solutions',
        industry: 'Technology',
        location: 'San Francisco, CA',
        email: 'sarah.chen@techcorp.com',
        phone: '+1-555-0101',
        linkedinUrl: 'https://linkedin.com/in/sarahchen',
        leadScore: 92,
        aiScore: 88,
        dataQuality: 95,
        lastEnriched: '2024-01-20T10:00:00Z',
        sources: ['LinkedIn', 'Apollo'],
        buyingIntent: 'high',
        companySize: '500-1000',
        revenue: '$50M-$100M',
        fundingStage: 'Series B',
        technologies: ['React', 'AWS', 'Kubernetes'],
        verified: { email: true, phone: true, linkedin: true }
      },
      {
        id: '2',
        type: 'person',
        name: 'Michael Rodriguez',
        title: 'VP of Operations',
        company: 'HealthPlus Medical',
        industry: 'Healthcare',
        location: 'Boston, MA',
        email: 'michael.rodriguez@healthplus.com',
        phone: '+1-555-0102',
        linkedinUrl: 'https://linkedin.com/in/michaelrodriguez',
        leadScore: 78,
        aiScore: 82,
        dataQuality: 87,
        lastEnriched: '2024-01-19T14:30:00Z',
        sources: ['ZoomInfo', 'Clearbit'],
        buyingIntent: 'medium',
        companySize: '200-500',
        revenue: '$10M-$50M',
        fundingStage: 'Private',
        technologies: ['Epic', 'Cerner', 'Microsoft Azure'],
        verified: { email: true, phone: false, linkedin: true }
      },
      {
        id: '3',
        type: 'person',
        name: 'Jennifer Kim',
        title: 'Chief Financial Officer',
        company: 'Finance Group LLC',
        industry: 'Financial Services',
        location: 'New York, NY',
        email: 'jennifer.kim@financegroup.com',
        phone: '+1-555-0103',
        linkedinUrl: 'https://linkedin.com/in/jenniferkim',
        leadScore: 85,
        aiScore: 90,
        dataQuality: 93,
        lastEnriched: '2024-01-18T16:20:00Z',
        sources: ['LinkedIn', 'Apollo', 'Hunter'],
        buyingIntent: 'high',
        companySize: '100-200',
        revenue: '$10M-$50M',
        fundingStage: 'Series A',
        technologies: ['Salesforce', 'QuickBooks', 'Tableau'],
        verified: { email: true, phone: true, linkedin: true }
      },
      {
        id: '4',
        type: 'company',
        name: 'InnovateAI Corp',
        industry: 'Artificial Intelligence',
        location: 'Seattle, WA',
        website: 'https://innovateai.com',
        companySize: '50-100',
        revenue: '$5M-$10M',
        fundingStage: 'Seed',
        technologies: ['Python', 'TensorFlow', 'AWS'],
        leadScore: 88,
        aiScore: 91,
        dataQuality: 89,
        lastEnriched: '2024-01-20T09:15:00Z',
        sources: ['Crunchbase', 'BuiltWith'],
        buyingIntent: 'medium',
        verified: { email: false, phone: false, linkedin: false }
      },
      {
        id: '5',
        type: 'person',
        name: 'Alex Thompson',
        title: 'Head of Growth',
        company: 'StartupX Innovation',
        industry: 'Technology',
        location: 'Austin, TX',
        email: 'alex.thompson@startupx.io',
        phone: '+1-555-0105',
        linkedinUrl: 'https://linkedin.com/in/alexthompson',
        leadScore: 76,
        aiScore: 79,
        dataQuality: 84,
        lastEnriched: '2024-01-17T11:45:00Z',
        sources: ['Apollo', 'Hunter'],
        buyingIntent: 'high',
        companySize: '10-50',
        revenue: '$1M-$5M',
        fundingStage: 'Pre-Seed',
        technologies: ['React', 'Node.js', 'MongoDB'],
        verified: { email: true, phone: false, linkedin: true }
      }
    ];
    
    let filteredResults = [...baseResults];
    
    // Apply search query filter
    if (query.trim()) {
      const queryLower = query.toLowerCase();
      filteredResults = filteredResults.filter(result => 
        result.name.toLowerCase().includes(queryLower) ||
        result.title?.toLowerCase().includes(queryLower) ||
        result.company?.toLowerCase().includes(queryLower) ||
        result.industry.toLowerCase().includes(queryLower) ||
        result.location.toLowerCase().includes(queryLower)
      );
    }
    
    // Apply person filters
    if (searchFilters.person?.jobTitles?.length > 0) {
      filteredResults = filteredResults.filter(result => 
        result.type === 'company' || 
        searchFilters.person.jobTitles.some((title: string) => 
          result.title?.toLowerCase().includes(title.toLowerCase())
        )
      );
    }
    
    if (searchFilters.person?.seniority?.length > 0) {
      filteredResults = filteredResults.filter(result => 
        result.type === 'company' ||
        searchFilters.person.seniority.some((level: string) => {
          const title = result.title?.toLowerCase() || '';
          switch (level) {
            case 'C-Level':
              return title.includes('ceo') || title.includes('cto') || title.includes('cfo') || title.includes('chief');
            case 'VP':
              return title.includes('vp') || title.includes('vice president');
            case 'Director':
              return title.includes('director');
            case 'Manager':
              return title.includes('manager');
            default:
              return true;
          }
        })
      );
    }
    
    // Apply company filters
    if (searchFilters.company?.industries?.length > 0) {
      filteredResults = filteredResults.filter(result => 
        searchFilters.company.industries.includes(result.industry)
      );
    }
    
    if (searchFilters.company?.companySizes?.length > 0) {
      filteredResults = filteredResults.filter(result => 
        result.companySize && searchFilters.company.companySizes.includes(result.companySize)
      );
    }
    
    if (searchFilters.company?.fundingStages?.length > 0) {
      filteredResults = filteredResults.filter(result => 
        result.fundingStage && searchFilters.company.fundingStages.includes(result.fundingStage)
      );
    }
    
    // Apply geography filters
    if (searchFilters.geography?.countries?.length > 0) {
      filteredResults = filteredResults.filter(result => 
        searchFilters.geography.countries.some((country: string) => 
          result.location.includes(country)
        )
      );
    }
    
    // Apply engagement filters
    if (searchFilters.engagement?.buyingIntent?.length > 0) {
      filteredResults = filteredResults.filter(result => 
        result.buyingIntent && searchFilters.engagement.buyingIntent.includes(result.buyingIntent)
      );
    }
    
    // Apply technology filters
    if (searchFilters.technology?.technologies?.length > 0) {
      filteredResults = filteredResults.filter(result => 
        result.technologies?.some((tech: string) => 
          searchFilters.technology.technologies.some((filterTech: string) => 
            tech.toLowerCase().includes(filterTech.toLowerCase())
          )
        )
      );
    }
    
    return filteredResults;
  };
  
  const clearAllFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSearchResults([]);
    setSearchExecuted(false);
    setEstimatedResults(0);
    setSearchError('');
  };
  
  const saveCurrentSearch = () => {
    const searchConfig = {
      id: Date.now().toString(),
      name: searchQuery || 'Custom Search',
      query: searchQuery,
      filters: filters,
      createdAt: new Date().toISOString()
    };
    
    setSavedSearches(prev => [...prev, searchConfig]);
    console.log('Search saved:', searchConfig);
  };
  
  const loadSavedSearch = (search: any) => {
    setSearchQuery(search.query);
    setFilters(search.filters);
    setEstimatedResults(0);
    setSearchResults([]);
    setSearchExecuted(false);
  };
  
  const applyPersonaPreset = (preset: any) => {
    setFilters(preset.filters);
    setSearchQuery(preset.query || '');
    setEstimatedResults(0);
    setSearchResults([]);
    setSearchExecuted(false);
    console.log('Applied persona preset:', preset.name);
  };
  
  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    console.log(`Executing bulk action: ${action} on ${selectedIds.length} items`);
    
    switch (action) {
      case 'enrich':
        // Simulate enrichment
        setSearchResults(prev => prev.map(result => 
          selectedIds.includes(result.id) 
            ? { ...result, dataQuality: Math.min(100, result.dataQuality + 5) }
            : result
        ));
        break;
      case 'export':
        // Simulate export
        const exportData = searchResults.filter(r => selectedIds.includes(r.id));
        console.log('Exporting data:', exportData);
        break;
      case 'addToSequence':
        console.log('Adding to sequence:', selectedIds);
        break;
      case 'addToList':
        console.log('Adding to list:', selectedIds);
        break;
    }
    
    setSelectedResults([]);
  };
  
  // Real-time search estimation
  const updateEstimation = () => {
    if (!searchQuery.trim() && Object.keys(filters).length === 0) {
      setEstimatedResults(0);
      return;
    }
    
    // Simulate real-time estimation based on filters
    let estimation = 15420; // Base database size
    
    // Apply filter-based estimation
    if (filters.person?.jobTitles?.length > 0) {
      estimation = Math.floor(estimation * 0.3); // Job titles reduce pool
    }
    if (filters.person?.seniority?.length > 0) {
      estimation = Math.floor(estimation * 0.4); // Seniority reduces pool
    }
    if (filters.company?.industries?.length > 0) {
      estimation = Math.floor(estimation * 0.2); // Industry focus
    }
    if (filters.company?.companySizes?.length > 0) {
      estimation = Math.floor(estimation * 0.3); // Company size filter
    }
    if (filters.geography?.countries?.length > 0) {
      estimation = Math.floor(estimation * 0.5); // Geographic filter
    }
    
    // Search query impact
    if (searchQuery.trim()) {
      estimation = Math.floor(estimation * 0.6); // Text search narrows results
    }
    
    setEstimatedResults(Math.max(1, estimation));
  };
  
  // Update estimation when filters or query change
  React.useEffect(() => {
    updateEstimation();
  }, [filters, searchQuery]);

  useEffect(() => {
    // Simulate real-time search estimation
    const timer = setTimeout(() => {
      const activeFilters = Object.keys(filters).length;
      const baseResults = 15420;
      const reduction = activeFilters * 0.15;
      setEstimatedResults(Math.max(100, Math.floor(baseResults * (1 - reduction))));
      
      // Generate search insights
      const insights = [];
      if (filters.industries?.includes('Technology')) {
        insights.push('Technology sector shows 23% higher response rates');
      }
      if (filters.seniority?.includes('C-Level')) {
        insights.push('C-Level contacts have 45% higher deal values');
      }
      if (filters.companySize?.includes('1000+')) {
        insights.push('Enterprise companies have 67% longer sales cycles');
      }
      setSearchInsights(insights);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleSearch = async () => {
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 1500);
  };

  const handlePresetSelect = (preset: SearchPreset) => {
    setSelectedPreset(preset.id);
    setFilters(preset.filters);
    setSearchQuery(preset.name);
  };

  const handleBulkEnrichment = () => {
    console.log('Starting bulk enrichment for', selectedResults.length, 'results');
  };

  const handleExport = () => {
    console.log('Exporting', selectedResults.length, 'results');
  };

  const saveSearch = () => {
    if (!searchName.trim()) return;
    
    const savedSearch = {
      id: Date.now().toString(),
      name: searchName,
      filters,
      query: searchQuery,
      estimatedResults,
      savedAt: new Date().toISOString()
    };
    
    setSavedSearches(prev => [...prev, savedSearch]);
    setShowSaveSearch(false);
    setSearchName('');
  };

  const renderFilterSection = (
    id: string,
    title: string,
    icon: React.ElementType,
    children: React.ReactNode
  ) => {
    const Icon = icon;
    const isCollapsed = collapsedSections.has(id);

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Icon className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900">{title}</span>
          </div>
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {!isCollapsed && (
          <div className="p-4 bg-white">
            {children}
          </div>
        )}
      </div>
    );
  };

  const renderMultiSelect = (
    options: string[],
    selectedValues: string[] = [],
    onChange: (values: string[]) => void,
    placeholder: string = "Select options..."
  ) => (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedValues.map(value => (
          <span key={value} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {value}
            <button
              onClick={() => onChange(selectedValues.filter(v => v !== value))}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <select
        onChange={(e) => {
          if (e.target.value && !selectedValues.includes(e.target.value)) {
            onChange([...selectedValues, e.target.value]);
          }
          e.target.value = '';
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">{placeholder}</option>
        {options.filter(option => !selectedValues.includes(option)).map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  const renderRangeFilter = (
    min: number,
    max: number,
    onChange: (range: { min: number; max: number }) => void,
    label: string,
    format?: (value: number) => string
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">
          {format ? format(min) : min} - {format ? format(max) : max}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          placeholder="Min"
          value={min || ''}
          onChange={(e) => onChange({ min: Number(e.target.value), max })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="Max"
          value={max || ''}
          onChange={(e) => onChange({ min, max: Number(e.target.value) })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Advanced Filters Sidebar */}
      <div className={`bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
        showAdvancedFilters ? 'w-96' : 'w-0'
      } overflow-hidden`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
            <button
              onClick={() => setShowAdvancedFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">200+ criteria available</p>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto h-full">
          {/* Person Filters */}
          {renderFilterSection(
            'person',
            'Person Criteria',
            Users,
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Titles</label>
                {renderMultiSelect(
                  ['CEO', 'CTO', 'VP of Engineering', 'Director of IT', 'Head of Sales', 'VP of Marketing', 'Operations Manager', 'Product Manager'],
                  filters.jobTitles,
                  (values) => setFilters(prev => ({ ...prev, jobTitles: values })),
                  "Select job titles..."
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seniority Level</label>
                {renderMultiSelect(
                  ['C-Level', 'VP', 'Director', 'Manager', 'Senior', 'Individual Contributor'],
                  filters.seniority,
                  (values) => setFilters(prev => ({ ...prev, seniority: values })),
                  "Select seniority levels..."
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departments</label>
                {renderMultiSelect(
                  ['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'Product', 'IT', 'Customer Success'],
                  filters.departments,
                  (values) => setFilters(prev => ({ ...prev, departments: values })),
                  "Select departments..."
                )}
              </div>

              <div>
                {renderRangeFilter(
                  filters.experienceYears?.min || 0,
                  filters.experienceYears?.max || 30,
                  (range) => setFilters(prev => ({ ...prev, experienceYears: range })),
                  'Years of Experience'
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills & Technologies</label>
                {renderMultiSelect(
                  ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'Machine Learning', 'Data Science', 'DevOps'],
                  filters.skills,
                  (values) => setFilters(prev => ({ ...prev, skills: values })),
                  "Select skills..."
                )}
              </div>
            </div>
          )}

          {/* Company Filters */}
          {renderFilterSection(
            'company',
            'Company Criteria',
            Building,
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industries</label>
                {renderMultiSelect(
                  ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Real Estate', 'SaaS', 'E-commerce', 'FinTech'],
                  filters.industries,
                  (values) => setFilters(prev => ({ ...prev, industries: values })),
                  "Select industries..."
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                {renderMultiSelect(
                  ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'],
                  filters.companySize,
                  (values) => setFilters(prev => ({ ...prev, companySize: values })),
                  "Select company sizes..."
                )}
              </div>

              <div>
                {renderRangeFilter(
                  filters.revenue?.min || 0,
                  filters.revenue?.max || 1000000000,
                  (range) => setFilters(prev => ({ ...prev, revenue: range })),
                  'Annual Revenue',
                  (value) => `$${(value / 1000000).toFixed(0)}M`
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Funding Stage</label>
                {renderMultiSelect(
                  ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'IPO', 'Private', 'Bootstrapped'],
                  filters.fundingStage,
                  (values) => setFilters(prev => ({ ...prev, fundingStage: values })),
                  "Select funding stages..."
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Technologies Used</label>
                {renderMultiSelect(
                  ['Salesforce', 'HubSpot', 'AWS', 'Google Cloud', 'Microsoft Azure', 'Slack', 'Zoom', 'Shopify', 'WordPress', 'React'],
                  filters.technologies,
                  (values) => setFilters(prev => ({ ...prev, technologies: values })),
                  "Select technologies..."
                )}
              </div>
            </div>
          )}

          {/* Geography Filters */}
          {renderFilterSection(
            'geography',
            'Geography & Location',
            MapPin,
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Countries</label>
                {renderMultiSelect(
                  ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Australia', 'India', 'Singapore'],
                  filters.countries,
                  (values) => setFilters(prev => ({ ...prev, countries: values })),
                  "Select countries..."
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">US States</label>
                {renderMultiSelect(
                  ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Massachusetts', 'Washington', 'Colorado'],
                  filters.states,
                  (values) => setFilters(prev => ({ ...prev, states: values })),
                  "Select states..."
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Major Cities</label>
                {renderMultiSelect(
                  ['San Francisco', 'New York', 'Los Angeles', 'Chicago', 'Boston', 'Seattle', 'Austin', 'Denver'],
                  filters.cities,
                  (values) => setFilters(prev => ({ ...prev, cities: values })),
                  "Select cities..."
                )}
              </div>
            </div>
          )}

          {/* Engagement Filters */}
          {renderFilterSection(
            'engagement',
            'Engagement & Intent',
            Activity,
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Buying Intent</label>
                {renderMultiSelect(
                  ['High', 'Medium', 'Low', 'Unknown'],
                  filters.buyingIntent,
                  (values) => setFilters(prev => ({ ...prev, buyingIntent: values })),
                  "Select intent levels..."
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website Activity</label>
                {renderMultiSelect(
                  ['Pricing Page Visits', 'Demo Requests', 'Content Downloads', 'Multiple Sessions', 'Long Session Duration'],
                  filters.websiteActivity,
                  (values) => setFilters(prev => ({ ...prev, websiteActivity: values })),
                  "Select activity types..."
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Social Activity</label>
                {renderMultiSelect(
                  ['LinkedIn Active', 'Twitter Active', 'Recent Posts', 'Industry Engagement', 'Thought Leadership'],
                  filters.socialActivity,
                  (values) => setFilters(prev => ({ ...prev, socialActivity: values })),
                  "Select social activities..."
                )}
              </div>
            </div>
          )}

          {/* Contact Info Filters */}
          {renderFilterSection(
            'contact',
            'Contact Information',
            Mail,
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasEmail || false}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasEmail: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Has Email Address</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasPhone || false}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasPhone: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Has Phone Number</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasLinkedIn || false}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasLinkedIn: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Has LinkedIn Profile</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Deliverability</label>
                {renderMultiSelect(
                  ['Valid', 'Risky', 'Invalid', 'Unknown'],
                  filters.emailDeliverability,
                  (values) => setFilters(prev => ({ ...prev, emailDeliverability: values })),
                  "Select deliverability..."
                )}
              </div>
            </div>
          )}

          {/* Data Quality Filters */}
          {renderFilterSection(
            'quality',
            'Data Quality & Sources',
            Database,
            <div className="space-y-4">
              <div>
                {renderRangeFilter(
                  filters.dataQuality?.min || 0,
                  filters.dataQuality?.max || 100,
                  (range) => setFilters(prev => ({ ...prev, dataQuality: range })),
                  'Data Quality Score (%)'
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Sources</label>
                {renderMultiSelect(
                  ['LinkedIn', 'Apollo', 'ZoomInfo', 'Clearbit', 'Hunter.io', 'BuiltWith', 'Crunchbase'],
                  filters.source,
                  (values) => setFilters(prev => ({ ...prev, source: values })),
                  "Select data sources..."
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Enriched</label>
                <select
                  value={filters.lastEnriched || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, lastEnriched: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any time</option>
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/lead-generation/dashboard')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Prospect Discovery</h1>
                  <p className="text-gray-600 text-lg">AI-powered prospect and company discovery platform</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`flex items-center px-4 py-3 border rounded-xl text-sm transition-colors shadow-sm ${
                    showAdvancedFilters 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                  {Object.keys(filters).length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {Object.keys(filters).length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setShowSaveSearch(true)}
                  className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Search
                </button>
                
                <button className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-md">
                  <Database className="h-4 w-4 mr-2" />
                  Enrich Database
                </button>
              </div>
            </div>

            {/* Data Providers Status */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
              {dataProviders.map(provider => (
                <div key={provider.id} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    provider.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs font-medium text-gray-700">{provider.name}</span>
                  <span className="text-xs text-gray-500">{provider.quality}%</span>
                </div>
              ))}
            </div>

            {/* Search Interface */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for prospects, companies, or use natural language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Search Presets */}
              <div className="flex flex-wrap gap-3">
                {searchPresets.map(preset => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      className={`flex items-center space-x-2 px-4 py-2 border rounded-xl text-sm transition-colors ${
                        selectedPreset === preset.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Search Insights & Estimation */}
        {(estimatedResults > 0 || searchInsights.length > 0) && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200 px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span className="text-lg font-semibold text-purple-900">
                    ~{estimatedResults.toLocaleString()} results estimated
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">AI Quality Score: 94%</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {searchInsights.map((insight, index) => (
                  <div key={index} className="flex items-center space-x-2 px-3 py-1 bg-white rounded-lg border border-purple-200">
                    <Sparkles className="h-3 w-3 text-purple-600" />
                    <span className="text-xs text-purple-800">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 px-8 py-8">
          {searchResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Discover Your Next Customers</h3>
              <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                Use our AI-powered search to find high-quality prospects and companies. 
                Start with a preset or build your own custom search criteria.
              </p>
              
              {/* Quick Start Presets */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {searchPresets.slice(0, 3).map(preset => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-all text-left group"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">{preset.name}</h4>
                      </div>
                      <p className="text-gray-600">{preset.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Search Results ({searchResults.length.toLocaleString()})
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Avg Quality: 92%</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleBulkEnrichment}
                    disabled={selectedResults.length === 0}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Enrich Selected ({selectedResults.length})
                  </button>
                  
                  <button
                    onClick={handleExport}
                    disabled={selectedResults.length === 0}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(result => (
                  <div key={result.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedResults.includes(result.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedResults(prev => [...prev, result.id]);
                            } else {
                              setSelectedResults(prev => prev.filter(id => id !== result.id));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {result.type === 'person' ? (
                            result.name.charAt(0)
                          ) : (
                            <Building className="h-6 w-6" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {result.dataQuality}% Quality
                        </span>
                        <div className={`w-2 h-2 rounded-full ${
                          result.buyingIntent === 'high' ? 'bg-red-500' :
                          result.buyingIntent === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                        }`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">{result.name}</h4>
                      {result.title && (
                        <p className="text-sm text-gray-600 mb-1">{result.title}</p>
                      )}
                      {result.company && (
                        <p className="text-sm text-gray-600">{result.company}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{result.location}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{result.industry}</span>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="text-lg font-bold text-blue-600">{result.score}</p>
                        <p className="text-xs text-gray-600">Lead Score</p>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <p className="text-lg font-bold text-purple-600">{result.aiScore}</p>
                        <p className="text-xs text-gray-600">AI Score</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="text-lg font-bold text-green-600">{result.dataQuality}</p>
                        <p className="text-xs text-gray-600">Quality</p>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      {result.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-700 truncate">{result.email}</span>
                        </div>
                      )}
                      {result.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-700">{result.phone}</span>
                        </div>
                      )}
                      {result.linkedinUrl && (
                        <div className="flex items-center space-x-2">
                          <Globe className="h-3 w-3 text-gray-400" />
                          <a href={result.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {result.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {result.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{result.tags.length - 3} more</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                        <Plus className="h-4 w-4 mr-1" />
                        Add to List
                      </button>
                      <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        <Zap className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                      <span>Enriched {result.lastEnriched}</span>
                      <div className="flex space-x-1">
                        {result.source.map(src => (
                          <span key={src} className="bg-gray-100 px-1 rounded">{src}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bulk Actions */}
              {selectedResults.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4 z-50">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedResults.length} selected
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleBulkEnrichment}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Enrich
                      </button>
                      <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                        Add to Sequence
                      </button>
                      <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                        Add to List
                      </button>
                      <button
                        onClick={handleExport}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        Export
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedResults([])}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Search Modal */}
      {showSaveSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Save Search</h3>
              <button onClick={() => setShowSaveSearch(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Name</label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter search name..."
                />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Search Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Filters: {Object.keys(filters).length}</p>
                  <p>Estimated Results: {estimatedResults.toLocaleString()}</p>
                  <p>Query: {searchQuery || 'No query'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveSearch(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveSearch}
                disabled={!searchName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Save Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectDiscovery;