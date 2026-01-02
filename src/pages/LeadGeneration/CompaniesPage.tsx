import React, { useState } from 'react';
import { 
  Building, Search, Filter, Plus, Download, Upload, Eye, Edit, ArrowLeft,
  MoreHorizontal, Globe, MapPin, Users, DollarSign, TrendingUp,
  Target, Star, Zap, Tag, Calendar, ArrowUpDown, X, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Company } from '../../types/leadGeneration';

const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // Mock companies data
  const mockCompanies: Company[] = [
    {
      id: 'comp1',
      name: 'TechCorp Solutions',
      domain: 'techcorp.com',
      website: 'https://techcorp.com',
      industry: 'Software',
      subIndustry: 'Enterprise Software',
      description: 'Leading enterprise software solutions provider specializing in CRM and automation tools',
      founded: 2015,
      employeeCount: 750,
      employeeRange: '500-1000',
      annualRevenue: 50000000,
      revenueRange: '$50M-$100M',
      headquarters: {
        street: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'United States',
        postalCode: '94105'
      },
      locations: [],
      technologies: [],
      techStack: ['React', 'Node.js', 'AWS', 'MongoDB', 'Kubernetes'],
      socialProfiles: [
        { platform: 'linkedin', url: 'https://linkedin.com/company/techcorp', followers: 15000 },
        { platform: 'twitter', url: 'https://twitter.com/techcorp', followers: 8500 }
      ],
      logoUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      fundingStage: 'Series B',
      totalFunding: 25000000,
      lastFundingDate: '2023-06-15',
      investors: ['Sequoia Capital', 'Andreessen Horowitz'],
      alexaRank: 15000,
      monthlyVisitors: 250000,
      prospectCount: 45,
      contactedCount: 12,
      repliedCount: 3,
      tags: ['enterprise', 'saas', 'high-growth'],
      customFields: {
        'Decision Timeline': 'Q2 2024',
        'Budget Range': '$100K-$500K',
        'Current Solution': 'Salesforce'
      },
      ownerId: 'user1',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
      dataQuality: 92,
      enrichmentStatus: 'enriched',
      lastEnrichedAt: '2024-01-20T10:00:00Z'
    },
    {
      id: 'comp2',
      name: 'HealthPlus Medical',
      domain: 'healthplus.com',
      website: 'https://healthplus.com',
      industry: 'Healthcare',
      subIndustry: 'Medical Devices',
      description: 'Regional healthcare provider with focus on patient care innovation',
      founded: 2008,
      employeeCount: 350,
      employeeRange: '200-500',
      annualRevenue: 25000000,
      revenueRange: '$10M-$50M',
      headquarters: {
        city: 'Boston',
        state: 'MA',
        country: 'United States'
      },
      locations: [],
      technologies: [],
      techStack: ['Epic', 'Cerner', 'Microsoft Azure'],
      socialProfiles: [],
      prospectCount: 28,
      contactedCount: 8,
      repliedCount: 2,
      tags: ['healthcare', 'medical'],
      customFields: {},
      createdAt: '2024-01-12T11:00:00Z',
      updatedAt: '2024-01-18T16:20:00Z',
      dataQuality: 87,
      enrichmentStatus: 'enriched'
    },
    {
      id: 'comp3',
      name: 'Finance Group LLC',
      domain: 'financegroup.com',
      website: 'https://financegroup.com',
      industry: 'Financial Services',
      subIndustry: 'Investment Management',
      description: 'Boutique investment management firm serving high-net-worth clients',
      founded: 2012,
      employeeCount: 125,
      employeeRange: '100-200',
      annualRevenue: 15000000,
      revenueRange: '$10M-$50M',
      headquarters: {
        city: 'New York',
        state: 'NY',
        country: 'United States'
      },
      locations: [],
      technologies: [],
      techStack: ['Bloomberg Terminal', 'Salesforce', 'Microsoft Office'],
      socialProfiles: [],
      prospectCount: 18,
      contactedCount: 6,
      repliedCount: 4,
      tags: ['finance', 'investment'],
      customFields: {},
      createdAt: '2024-01-08T13:00:00Z',
      updatedAt: '2024-01-19T12:15:00Z',
      dataQuality: 94,
      enrichmentStatus: 'enriched'
    }
  ];

  const [companies] = useState<Company[]>(mockCompanies);

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || company.industry === industryFilter;
    const matchesSize = sizeFilter === 'all' || company.employeeRange === sizeFilter;
    const matchesLocation = locationFilter === 'all' || company.headquarters.country === locationFilter;
    
    return matchesSearch && matchesIndustry && matchesSize && matchesLocation;
  });

  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCompanies.length === filteredCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(filteredCompanies.map(c => c.id));
    }
  };

  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredCompanies.map((company) => (
        <div key={company.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedCompanies.includes(company.id)}
                onChange={() => handleSelectCompany(company.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                {company.name.charAt(0)}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-900">{company.dataQuality}</span>
            </div>
          </div>

          {/* Company Info */}
          <div className="mb-4">
            <button
              onClick={() => navigate(`/lead-generation/companies/${company.id}`)}
              className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              {company.name}
            </button>
            <p className="text-sm text-gray-600">{company.industry}</p>
            <p className="text-xs text-gray-500">{company.employeeRange} employees</p>
          </div>

          {/* Key Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <a 
                href={company.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 truncate"
              >
                {company.domain}
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{company.headquarters.city}, {company.headquarters.country}</span>
            </div>
            {company.revenueRange && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{company.revenueRange}</span>
              </div>
            )}
            {company.fundingStage && (
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{company.fundingStage}</span>
              </div>
            )}
          </div>

          {/* Prospect Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-blue-50 rounded">
              <p className="text-lg font-bold text-blue-600">{company.prospectCount}</p>
              <p className="text-xs text-gray-600">Prospects</p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <p className="text-lg font-bold text-green-600">{company.contactedCount}</p>
              <p className="text-xs text-gray-600">Contacted</p>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <p className="text-lg font-bold text-purple-600">{company.repliedCount}</p>
              <p className="text-xs text-gray-600">Replied</p>
            </div>
          </div>

          {/* Tech Stack */}
          {company.techStack.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Technologies:</p>
              <div className="flex flex-wrap gap-1">
                {company.techStack.slice(0, 3).map(tech => (
                  <span key={tech} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {tech}
                  </span>
                ))}
                {company.techStack.length > 3 && (
                  <span className="text-xs text-gray-500">+{company.techStack.length - 3} more</span>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {company.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {company.tags.map(tag => (
                <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/lead-generation/companies/${company.id}`)}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </button>
            <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
              <Users className="h-4 w-4" />
            </button>
            <button className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
              <Target className="h-4 w-4" />
            </button>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>Added {new Date(company.createdAt).toLocaleDateString()}</span>
            <span>Quality: {company.dataQuality}%</span>
          </div>
        </div>
      ))}
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
                  checked={selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Industry
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Prospects
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Quality
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCompanies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(company.id)}
                    onChange={() => handleSelectCompany(company.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <button
                        onClick={() => navigate(`/lead-generation/companies/${company.id}`)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {company.name}
                      </button>
                      <div className="flex items-center space-x-2 mt-1">
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 hover:text-blue-600"
                        >
                          {company.domain}
                        </a>
                        {company.fundingStage && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {company.fundingStage}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{company.industry}</p>
                    {company.subIndustry && (
                      <p className="text-sm text-gray-600">{company.subIndustry}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{company.employeeRange}</p>
                    <p className="text-sm text-gray-600">{company.employeeCount} employees</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{company.headquarters.city}, {company.headquarters.country}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm font-bold text-blue-600">{company.prospectCount}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-green-600">{company.contactedCount}</p>
                      <p className="text-xs text-gray-500">Contacted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-purple-600">{company.repliedCount}</p>
                      <p className="text-xs text-gray-500">Replied</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{company.dataQuality}%</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${company.dataQuality}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/lead-generation/companies/${company.id}`)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors">
                      <Users className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors">
                      <Target className="h-4 w-4" />
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

  return (
    <div className="min-h-screen bg-gray-50">
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
                <Building className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
                <p className="text-gray-600 text-lg">Discover and analyze target companies</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-all ${
                    viewMode === 'cards'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-l transition-all ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Table
                </button>
              </div>

              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </button>
              
              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              
              <button
                onClick={() => navigate('/lead-generation/discovery')}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Find Companies
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies, domains, industries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-96 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
              
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="all">All Industries</option>
                <option value="Software">Software</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
              </select>
              
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="all">All Sizes</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
              
              <button className="flex items-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </button>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span>{filteredCompanies.length} of {companies.length} companies</span>
              {selectedCompanies.length > 0 && (
                <>
                  <span>•</span>
                  <span>{selectedCompanies.length} selected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                <p className="text-3xl font-bold text-gray-900">{companies.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Prospects</p>
                <p className="text-3xl font-bold text-gray-900">
                  {companies.reduce((sum, c) => sum + c.prospectCount, 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contacted</p>
                <p className="text-3xl font-bold text-gray-900">
                  {companies.reduce((sum, c) => sum + c.contactedCount, 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Quality</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(companies.reduce((sum, c) => sum + c.dataQuality, 0) / companies.length)}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Star className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {viewMode === 'cards' ? renderCardsView() : renderTableView()}

        {/* Bulk Actions Bar */}
        {selectedCompanies.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4 z-50">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedCompanies.length} compan{selectedCompanies.length > 1 ? 'ies' : 'y'} selected
              </span>
              <div className="flex space-x-2">
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  Find Prospects
                </button>
                <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                  Add to List
                </button>
                <button className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
                  Enrich Data
                </button>
                <button className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors">
                  Add Tags
                </button>
              </div>
              <button
                onClick={() => setSelectedCompanies([])}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredCompanies.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || industryFilter !== 'all' || sizeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by discovering new companies'
              }
            </p>
            <button
              onClick={() => navigate('/lead-generation/discovery')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Search className="h-4 w-4 mr-2 inline" />
              Find Companies
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompaniesPage;