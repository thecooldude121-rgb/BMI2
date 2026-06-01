import React, { useState } from 'react';
import { 
  Users, Search, Filter, Plus, Download, Upload, Eye, Edit, ArrowLeft,
  MoreHorizontal, Star, Mail, Phone, MessageSquare, Calendar,
  Target, Zap, Tag, Globe, Building, MapPin, Clock, TrendingUp,
  CheckSquare, X, Settings, RefreshCw, ArrowUpDown, Columns
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Prospect } from '../../types/leadGeneration';

const ProspectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');

  // Mock prospects data
  const mockProspects: Prospect[] = [
    {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Chen',
      fullName: 'Sarah Chen',
      email: 'sarah.chen@techcorp.com',
      phone: '+1-555-0101',
      linkedinUrl: 'https://linkedin.com/in/sarahchen',
      title: 'Chief Technology Officer',
      seniority: 'C-Level',
      department: 'Technology',
      functions: ['Engineering', 'Product'],
      companyId: 'comp1',
      companyName: 'TechCorp Solutions',
      companyDomain: 'techcorp.com',
      companyIndustry: 'Software',
      companySize: '500-1000',
      companyLocation: 'San Francisco, CA',
      leadSource: 'Apollo Discovery',
      leadStatus: 'qualified',
      leadScore: 92,
      aiScore: 88,
      temperature: 'hot',
      emailStatus: 'valid',
      lastContactedAt: '2024-01-20T10:00:00Z',
      engagementLevel: 'high',
      activeSequences: ['seq1'],
      campaignHistory: [],
      tags: ['enterprise', 'decision-maker', 'high-priority'],
      customFields: {},
      notes: 'CTO at fast-growing tech company. Very interested in our enterprise solution.',
      ownerId: 'user1',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
      enrichmentStatus: 'enriched',
      dataQuality: 95
    },
    {
      id: '2',
      firstName: 'Michael',
      lastName: 'Rodriguez',
      fullName: 'Michael Rodriguez',
      email: 'michael.rodriguez@healthplus.com',
      phone: '+1-555-0102',
      linkedinUrl: 'https://linkedin.com/in/michaelrodriguez',
      title: 'VP of Operations',
      seniority: 'VP',
      department: 'Operations',
      functions: ['Operations', 'Strategy'],
      companyId: 'comp2',
      companyName: 'HealthPlus Medical',
      companyDomain: 'healthplus.com',
      companyIndustry: 'Healthcare',
      companySize: '200-500',
      companyLocation: 'Boston, MA',
      leadSource: 'LinkedIn',
      leadStatus: 'contacted',
      leadScore: 78,
      aiScore: 82,
      temperature: 'warm',
      emailStatus: 'valid',
      lastContactedAt: '2024-01-18T14:30:00Z',
      engagementLevel: 'medium',
      activeSequences: [],
      campaignHistory: [],
      tags: ['healthcare', 'operations'],
      customFields: {},
      notes: 'VP of Operations interested in process automation solutions.',
      ownerId: 'user2',
      createdAt: '2024-01-12T11:00:00Z',
      updatedAt: '2024-01-18T14:30:00Z',
      enrichmentStatus: 'enriched',
      dataQuality: 87
    },
    {
      id: '3',
      firstName: 'Jennifer',
      lastName: 'Kim',
      fullName: 'Jennifer Kim',
      email: 'jennifer.kim@financegroup.com',
      phone: '+1-555-0103',
      linkedinUrl: 'https://linkedin.com/in/jenniferkim',
      title: 'Chief Financial Officer',
      seniority: 'C-Level',
      department: 'Finance',
      functions: ['Finance', 'Strategy'],
      companyId: 'comp3',
      companyName: 'Finance Group LLC',
      companyDomain: 'financegroup.com',
      companyIndustry: 'Financial Services',
      companySize: '100-200',
      companyLocation: 'New York, NY',
      leadSource: 'Trade Show',
      leadStatus: 'interested',
      leadScore: 85,
      aiScore: 90,
      temperature: 'hot',
      emailStatus: 'valid',
      lastContactedAt: '2024-01-19T16:00:00Z',
      engagementLevel: 'high',
      activeSequences: ['seq2'],
      campaignHistory: [],
      tags: ['finance', 'cfo', 'budget-holder'],
      customFields: {},
      notes: 'CFO looking for financial reporting solutions. High budget authority.',
      ownerId: 'user1',
      createdAt: '2024-01-10T13:00:00Z',
      updatedAt: '2024-01-19T16:00:00Z',
      enrichmentStatus: 'enriched',
      dataQuality: 93
    }
  ];

  const [prospects] = useState<Prospect[]>(mockProspects);

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = prospect.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || prospect.leadStatus === statusFilter;
    const matchesScore = scoreFilter === 'all' || 
                        (scoreFilter === 'high' && prospect.leadScore >= 80) ||
                        (scoreFilter === 'medium' && prospect.leadScore >= 60 && prospect.leadScore < 80) ||
                        (scoreFilter === 'low' && prospect.leadScore < 60);
    const matchesOwner = ownerFilter === 'all' || prospect.ownerId === ownerFilter;
    
    return matchesSearch && matchesStatus && matchesScore && matchesOwner;
  });

  const handleSelectProspect = (prospectId: string) => {
    setSelectedProspects(prev =>
      prev.includes(prospectId)
        ? prev.filter(id => id !== prospectId)
        : [...prev, prospectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProspects.length === filteredProspects.length) {
      setSelectedProspects([]);
    } else {
      setSelectedProspects(filteredProspects.map(p => p.id));
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800 border-blue-200',
      contacted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      replied: 'bg-green-100 text-green-800 border-green-200',
      interested: 'bg-purple-100 text-purple-800 border-purple-200',
      not_interested: 'bg-red-100 text-red-800 border-red-200',
      unqualified: 'bg-gray-100 text-gray-800 border-gray-200',
      qualified: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getTemperatureColor = (temp: string) => {
    const colors = {
      hot: 'text-red-500',
      warm: 'text-orange-500',
      cold: 'text-blue-500'
    };
    return colors[temp as keyof typeof colors] || 'text-gray-500';
  };

  const renderTableView = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedProspects.length === filteredProspects.length && filteredProspects.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Prospect
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Contact Info
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Last Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProspects.map((prospect) => (
              <tr key={prospect.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProspects.includes(prospect.id)}
                    onChange={() => handleSelectProspect(prospect.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {prospect.firstName.charAt(0)}{prospect.lastName.charAt(0)}
                    </div>
                    <div>
                      <button
                        onClick={() => navigate(`/lead-generation/prospects/${prospect.id}`)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {prospect.fullName}
                      </button>
                      <p className="text-sm text-gray-600">{prospect.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${getTemperatureColor(prospect.temperature)}`} />
                        <span className="text-xs text-gray-500">{prospect.seniority}</span>
                        {prospect.tags.length > 0 && (
                          <div className="flex space-x-1">
                            {prospect.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <button
                      onClick={() => navigate(`/lead-generation/companies/${prospect.companyId}`)}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors"
                    >
                      {prospect.companyName}
                    </button>
                    <p className="text-sm text-gray-600">{prospect.companyIndustry}</p>
                    <p className="text-xs text-gray-500">{prospect.companySize} • {prospect.companyLocation}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(prospect.leadStatus)}`}>
                    {prospect.leadStatus.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(prospect.leadScore)}`}>
                        {prospect.leadScore}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">Lead</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(prospect.aiScore)}`}>
                        {prospect.aiScore}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">AI</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-900">{prospect.email}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        prospect.emailStatus === 'valid' ? 'bg-green-500' :
                        prospect.emailStatus === 'risky' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                    {prospect.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">{prospect.phone}</span>
                      </div>
                    )}
                    {prospect.linkedinUrl && (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-3 w-3 text-gray-400" />
                        <a 
                          href={prospect.linkedinUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          LinkedIn
                        </a>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    {prospect.lastContactedAt ? (
                      <>
                        <p className="text-sm text-gray-900">
                          {new Date(prospect.lastContactedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.floor((new Date().getTime() - new Date(prospect.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </p>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Never contacted</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/lead-generation/prospects/${prospect.id}`)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                      title="Send Email"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Add to Sequence"
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="More Actions"
                    >
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

  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProspects.map((prospect) => (
        <div key={prospect.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedProspects.includes(prospect.id)}
                onChange={() => handleSelectProspect(prospect.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {prospect.firstName.charAt(0)}{prospect.lastName.charAt(0)}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getTemperatureColor(prospect.temperature)}`} />
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(prospect.leadScore)}`}>
                {prospect.leadScore}
              </span>
            </div>
          </div>

          {/* Prospect Info */}
          <div className="mb-4">
            <button
              onClick={() => navigate(`/lead-generation/prospects/${prospect.id}`)}
              className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              {prospect.fullName}
            </button>
            <p className="text-sm text-gray-600">{prospect.title}</p>
            <p className="text-xs text-gray-500">{prospect.seniority} • {prospect.department}</p>
          </div>

          {/* Company Info */}
          <div className="mb-4">
            <button
              onClick={() => navigate(`/lead-generation/companies/${prospect.companyId}`)}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors"
            >
              {prospect.companyName}
            </button>
            <p className="text-sm text-gray-600">{prospect.companyIndustry}</p>
            <p className="text-xs text-gray-500">{prospect.companySize} • {prospect.companyLocation}</p>
          </div>

          {/* Status & Engagement */}
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(prospect.leadStatus)}`}>
              {prospect.leadStatus.replace('_', ' ')}
            </span>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Engagement:</span>
              <span className={`text-xs font-medium ${
                prospect.engagementLevel === 'high' ? 'text-green-600' :
                prospect.engagementLevel === 'medium' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {prospect.engagementLevel}
              </span>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900 truncate">{prospect.email}</span>
              <span className={`w-2 h-2 rounded-full ${
                prospect.emailStatus === 'valid' ? 'bg-green-500' :
                prospect.emailStatus === 'risky' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>
            {prospect.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{prospect.phone}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {prospect.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {prospect.tags.slice(0, 3).map(tag => (
                <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
              {prospect.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{prospect.tags.length - 3} more</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/lead-generation/prospects/${prospect.id}`)}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </button>
            <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
              <Mail className="h-4 w-4" />
            </button>
            <button className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
              <Zap className="h-4 w-4" />
            </button>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>Added {new Date(prospect.createdAt).toLocaleDateString()}</span>
            <span>Quality: {prospect.dataQuality}%</span>
          </div>
        </div>
      ))}
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
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Prospects</h1>
                <p className="text-gray-600 text-lg">Manage and engage with your prospect database</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-all ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-l transition-all ${
                    viewMode === 'cards'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  }`}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Cards
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
                Find Prospects
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
                  placeholder="Search prospects, companies, emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-96 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2.5 border rounded-xl text-sm transition-colors shadow-sm ${
                  showFilters 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 hover:bg-gray-50 bg-white'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="replied">Replied</option>
                <option value="interested">Interested</option>
                <option value="qualified">Qualified</option>
              </select>
              
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="all">All Scores</option>
                <option value="high">High (80+)</option>
                <option value="medium">Medium (60-79)</option>
                <option value="low">Low (&lt;60)</option>
              </select>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span>{filteredProspects.length} of {prospects.length} prospects</span>
              {selectedProspects.length > 0 && (
                <>
                  <span>•</span>
                  <span>{selectedProspects.length} selected</span>
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
                <p className="text-sm font-medium text-gray-600">Total Prospects</p>
                <p className="text-3xl font-bold text-gray-900">{prospects.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Score (80+)</p>
                <p className="text-3xl font-bold text-gray-900">
                  {prospects.filter(p => p.leadScore >= 80).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Star className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contacted</p>
                <p className="text-3xl font-bold text-gray-900">
                  {prospects.filter(p => p.leadStatus !== 'new').length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Replied</p>
                <p className="text-3xl font-bold text-gray-900">
                  {prospects.filter(p => p.leadStatus === 'replied').length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {viewMode === 'table' ? renderTableView() : renderCardsView()}

        {/* Bulk Actions Bar */}
        {selectedProspects.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-4 z-50">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedProspects.length} prospect{selectedProspects.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  Add to Sequence
                </button>
                <button className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                  Add to List
                </button>
                <button className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
                  Assign Owner
                </button>
                <button className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors">
                  Add Tags
                </button>
              </div>
              <button
                onClick={() => setSelectedProspects([])}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredProspects.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No prospects found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || scoreFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by discovering new prospects'
              }
            </p>
            <button
              onClick={() => navigate('/lead-generation/discovery')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Search className="h-4 w-4 mr-2 inline" />
              Find Prospects
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProspectsPage;