import React, { useState } from 'react';
import {
  Sparkles, Upload, Download, Play, Pause, CheckCircle,
  AlertCircle, Clock, Users, Building, Mail, Phone,
  Globe, Target, TrendingUp, Eye, Settings, Filter,
  Search, Plus, X, RefreshCw, BarChart3, Zap, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataEnrichmentJob } from '../../types/leadGeneration';

const DataEnrichmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock enrichment jobs data
  const mockJobs: DataEnrichmentJob[] = [
    {
      id: '1',
      name: 'Enterprise CTOs Enrichment',
      type: 'person',
      status: 'completed',
      inputType: 'list',
      inputData: { listId: 'list1', listName: 'Enterprise CTOs' },
      enrichmentFields: ['email', 'phone', 'linkedin', 'work_history'],
      providers: ['Apollo', 'ZoomInfo', 'LinkedIn'],
      totalRecords: 245,
      processedRecords: 245,
      enrichedRecords: 198,
      failedRecords: 47,
      results: [],
      errors: [],
      ownerId: 'user1',
      createdAt: '2024-01-18T09:00:00Z',
      updatedAt: '2024-01-18T11:30:00Z',
      completedAt: '2024-01-18T11:30:00Z'
    },
    {
      id: '2',
      name: 'Healthcare Companies Data',
      type: 'company',
      status: 'running',
      inputType: 'search_results',
      inputData: { searchQuery: 'Healthcare companies 200+ employees' },
      enrichmentFields: ['revenue', 'funding', 'technologies', 'employee_count'],
      providers: ['Crunchbase', 'BuiltWith', 'Apollo'],
      totalRecords: 156,
      processedRecords: 89,
      enrichedRecords: 76,
      failedRecords: 13,
      results: [],
      errors: [],
      ownerId: 'user2',
      createdAt: '2024-01-20T14:00:00Z',
      updatedAt: '2024-01-20T15:45:00Z'
    },
    {
      id: '3',
      name: 'Startup Founders CSV Import',
      type: 'both',
      status: 'pending',
      inputType: 'csv',
      inputData: { fileName: 'startup_founders.csv', recordCount: 89 },
      enrichmentFields: ['email', 'phone', 'company_info', 'funding_info'],
      providers: ['Apollo', 'Crunchbase'],
      totalRecords: 89,
      processedRecords: 0,
      enrichedRecords: 0,
      failedRecords: 0,
      results: [],
      errors: [],
      ownerId: 'user1',
      createdAt: '2024-01-20T16:00:00Z',
      updatedAt: '2024-01-20T16:00:00Z'
    }
  ];

  const [jobs] = useState<DataEnrichmentJob[]>(mockJobs);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      running: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'running':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'person':
        return <Users className="h-4 w-4" />;
      case 'company':
        return <Building className="h-4 w-4" />;
      case 'both':
        return <Target className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const calculateProgress = (job: DataEnrichmentJob) => {
    if (job.totalRecords === 0) return 0;
    return Math.round((job.processedRecords / job.totalRecords) * 100);
  };

  const calculateSuccessRate = (job: DataEnrichmentJob) => {
    if (job.processedRecords === 0) return 0;
    return Math.round((job.enrichedRecords / job.processedRecords) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Data Enrichment</h1>
                <p className="text-gray-600 text-lg">Enhance your prospect data with AI-powered enrichment</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </button>
              
              <button className="flex items-center px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </button>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Enrichment
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
                  placeholder="Search enrichment jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-96 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              
              <button className="flex items-center px-4 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <span>{filteredJobs.length} of {jobs.length} jobs</span>
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
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{jobs.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Records Enriched</p>
                <p className="text-3xl font-bold text-gray-900">
                  {jobs.reduce((sum, j) => sum + j.enrichedRecords, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(
                    jobs.reduce((sum, j) => sum + j.enrichedRecords, 0) /
                    Math.max(1, jobs.reduce((sum, j) => sum + j.processedRecords, 0)) * 100
                  )}%
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Running Jobs</p>
                <p className="text-3xl font-bold text-gray-900">
                  {jobs.filter(j => j.status === 'running').length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Play className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Enrichment Jobs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Enrichment Jobs</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{filteredJobs.length} jobs</span>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredJobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedJobs.includes(job.id)}
                      onChange={() => {
                        setSelectedJobs(prev =>
                          prev.includes(job.id)
                            ? prev.filter(id => id !== job.id)
                            : [...prev, job.id]
                        );
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    
                    <div className="p-3 bg-purple-100 rounded-lg">
                      {getTypeIcon(job.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{job.name}</h4>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(job.status)}
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Input</p>
                          <p className="text-sm font-medium text-gray-900">
                            {job.inputType === 'list' ? `List: ${job.inputData.listName}` :
                             job.inputType === 'csv' ? `CSV: ${job.inputData.fileName}` :
                             'Search Results'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">{job.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Records</p>
                          <p className="text-sm font-medium text-gray-900">{job.totalRecords.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Success Rate</p>
                          <p className="text-sm font-medium text-gray-900">{calculateSuccessRate(job)}%</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {job.status === 'running' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Progress</span>
                            <span className="text-sm font-medium text-gray-900">{calculateProgress(job)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${calculateProgress(job)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Results Summary */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-lg font-bold text-blue-600">{job.processedRecords}</p>
                          <p className="text-xs text-gray-600">Processed</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-lg font-bold text-green-600">{job.enrichedRecords}</p>
                          <p className="text-xs text-gray-600">Enriched</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-lg font-bold text-red-600">{job.failedRecords}</p>
                          <p className="text-xs text-gray-600">Failed</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-lg font-bold text-purple-600">{calculateSuccessRate(job)}%</p>
                          <p className="text-xs text-gray-600">Success</p>
                        </div>
                      </div>

                      {/* Enrichment Fields */}
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Enrichment Fields:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.enrichmentFields.map(field => (
                            <span key={field} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                              {field.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Providers */}
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Data Providers:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.providers.map(provider => (
                            <span key={provider} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {provider}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                    {job.status === 'running' && (
                      <button className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors">
                        <Pause className="h-4 w-4" />
                      </button>
                    )}
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
                  <span>
                    {job.completedAt 
                      ? `Completed ${new Date(job.completedAt).toLocaleDateString()}`
                      : `Updated ${new Date(job.updatedAt).toLocaleDateString()}`
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No enrichment jobs found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start enriching your prospect data to get better results'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Create Enrichment Job
            </button>
          </div>
        )}
      </div>

      {/* Create Enrichment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Enrichment Job</h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter job name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enrichment Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <button className="p-4 border border-purple-500 bg-purple-50 rounded-xl text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm font-medium">Person</p>
                    <p className="text-xs text-gray-500">Contact details</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-xl text-center hover:bg-gray-50 transition-colors">
                    <Building className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium">Company</p>
                    <p className="text-xs text-gray-500">Company data</p>
                  </button>
                  <button className="p-4 border border-gray-200 rounded-xl text-center hover:bg-gray-50 transition-colors">
                    <Target className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">Both</p>
                    <p className="text-xs text-gray-500">Complete data</p>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="source" value="list" className="h-4 w-4 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">From List</p>
                      <p className="text-xs text-gray-500">Select an existing prospect list</p>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-purple-500 bg-purple-50 rounded-lg cursor-pointer">
                    <input type="radio" name="source" value="csv" defaultChecked className="h-4 w-4 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Upload CSV</p>
                      <p className="text-xs text-gray-500">Upload a CSV file with prospect data</p>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="source" value="search" className="h-4 w-4 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Search Results</p>
                      <p className="text-xs text-gray-500">Use results from prospect discovery</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fields to Enrich</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'email', label: 'Email Address', icon: Mail },
                    { id: 'phone', label: 'Phone Number', icon: Phone },
                    { id: 'linkedin', label: 'LinkedIn Profile', icon: Globe },
                    { id: 'work_history', label: 'Work History', icon: Building },
                    { id: 'company_info', label: 'Company Details', icon: Building },
                    { id: 'technologies', label: 'Technologies Used', icon: Zap }
                  ].map(field => {
                    const Icon = field.icon;
                    return (
                      <label key={field.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4 text-purple-600 focus:ring-purple-500" />
                        <Icon className="h-4 w-4 ml-3 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-700">{field.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
                Start Enrichment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataEnrichmentPage;