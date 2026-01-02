import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Plus, Download, Eye, Mail, Zap, MoreVertical,
  ChevronDown, ChevronRight, Star, Tag as TagIcon, MessageSquare,
  ArrowUpDown, Columns, X, Clock, TrendingUp, CheckSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ProspectQuickViewModal from '../../components/Prospects/ProspectQuickViewModal';
import BulkActionsToolbar from '../../components/Prospects/BulkActionsToolbar';
import AdvancedFilterPanel from '../../components/Prospects/AdvancedFilterPanel';

interface Prospect {
  id: string;
  fullName: string;
  title: string;
  companyName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  companyLocation?: string;
  leadScore: number;
  aiScore: number;
  dataQuality: number;
  leadStatus: string;
  tags: string[];
  lastContactedAt?: string;
  createdAt: string;
}

interface Column {
  id: string;
  label: string;
  visible: boolean;
  sortable: boolean;
}

const EnhancedProspectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [quickViewProspect, setQuickViewProspect] = useState<Prospect | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [columns, setColumns] = useState<Column[]>([
    { id: 'name', label: 'Name', visible: true, sortable: true },
    { id: 'company', label: 'Company', visible: true, sortable: true },
    { id: 'status', label: 'Status', visible: true, sortable: true },
    { id: 'score', label: 'Score', visible: true, sortable: true },
    { id: 'email', label: 'Email', visible: false, sortable: false },
    { id: 'phone', label: 'Phone', visible: false, sortable: false },
    { id: 'tags', label: 'Tags', visible: true, sortable: false },
    { id: 'lastActivity', label: 'Last Activity', visible: true, sortable: true },
    { id: 'addedDate', label: 'Added Date', visible: false, sortable: true }
  ]);

  const [filters, setFilters] = useState({
    statuses: [] as string[],
    leadScoreMin: 0,
    leadScoreMax: 100,
    aiScoreMin: 0,
    aiScoreMax: 100,
    qualityScoreMin: 0,
    qualityScoreMax: 100,
    tags: [] as string[],
    companySizes: [] as string[]
  });

  // Mock data
  const mockProspects: Prospect[] = [
    {
      id: '1',
      fullName: 'Sarah Chen',
      title: 'Chief Technology Officer',
      companyName: 'TechCorp Solutions',
      email: 'sarah.chen@techcorp.com',
      phone: '+1-555-0101',
      linkedinUrl: 'https://linkedin.com/in/sarahchen',
      companyLocation: 'San Francisco, CA',
      leadScore: 92,
      aiScore: 88,
      dataQuality: 95,
      leadStatus: 'qualified',
      tags: ['enterprise', 'decision-maker', 'high-priority'],
      lastContactedAt: '2024-01-20T10:00:00Z',
      createdAt: '2024-01-15T09:00:00Z'
    },
    {
      id: '2',
      fullName: 'Michael Rodriguez',
      title: 'VP of Operations',
      companyName: 'HealthPlus Medical',
      email: 'michael.rodriguez@healthplus.com',
      phone: '+1-555-0102',
      linkedinUrl: 'https://linkedin.com/in/michaelrodriguez',
      companyLocation: 'Boston, MA',
      leadScore: 78,
      aiScore: 82,
      dataQuality: 87,
      leadStatus: 'contacted',
      tags: ['healthcare', 'operations'],
      lastContactedAt: '2024-01-18T14:30:00Z',
      createdAt: '2024-01-12T11:00:00Z'
    },
    {
      id: '3',
      fullName: 'Emily Watson',
      title: 'Marketing Director',
      companyName: 'RetailCo Inc',
      email: 'emily.watson@retailco.com',
      phone: '+1-555-0103',
      companyLocation: 'New York, NY',
      leadScore: 65,
      aiScore: 70,
      dataQuality: 78,
      leadStatus: 'new',
      tags: ['marketing', 'retail'],
      createdAt: '2024-01-19T08:00:00Z'
    }
  ];

  useEffect(() => {
    fetchProspects();
  }, []);

  useEffect(() => {
    filterAndSortProspects();
  }, [prospects, searchQuery, filters, sortColumn, sortDirection]);

  const fetchProspects = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setProspects(mockProspects);
      setIsLoading(false);
    }, 1000);
  };

  const filterAndSortProspects = () => {
    let filtered = [...prospects];

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.statuses.length > 0) {
      filtered = filtered.filter(p => filters.statuses.includes(p.leadStatus));
    }

    filtered = filtered.filter(p =>
      p.leadScore >= filters.leadScoreMin &&
      p.leadScore <= filters.leadScoreMax &&
      p.aiScore >= filters.aiScoreMin &&
      p.aiScore <= filters.aiScoreMax
    );

    if (filters.tags.length > 0) {
      filtered = filtered.filter(p =>
        filters.tags.some(tag => p.tags.includes(tag))
      );
    }

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortColumn) {
        case 'name':
          aVal = a.fullName;
          bVal = b.fullName;
          break;
        case 'company':
          aVal = a.companyName;
          bVal = b.companyName;
          break;
        case 'score':
          aVal = a.leadScore;
          bVal = b.leadScore;
          break;
        case 'status':
          aVal = a.leadStatus;
          bVal = b.leadStatus;
          break;
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredProspects(filtered);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProspects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProspects.map(p => p.id)));
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('desc');
    }
  };

  const handleStatusChange = async (prospectId: string, newStatus: string) => {
    // Update status optimistically
    setProspects(prospects.map(p =>
      p.id === prospectId ? { ...p, leadStatus: newStatus } : p
    ));
    // In production: await supabase.from('prospects').update({ leadStatus: newStatus }).eq('id', prospectId);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700 border-blue-200',
      contacted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      qualified: 'bg-green-100 text-green-700 border-green-200',
      unqualified: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || colors.new;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffDays = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const paginatedProspects = filteredProspects.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredProspects.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Prospects</h1>
              <p className="text-gray-600 mt-1">{filteredProspects.length} total prospects</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(filters.statuses.length > 0 || filters.tags.length > 0) && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {filters.statuses.length + filters.tags.length}
                  </span>
                )}
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={() => navigate('/lead-generation/prospects/new')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Prospect
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, email..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              {filteredProspects.length} result{filteredProspects.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredProspects.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No prospects found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery ? `No prospects match "${searchQuery}"` : 'Get started by adding your first prospect'}
              </p>
              <button
                onClick={() => {
                  if (searchQuery) setSearchQuery('');
                  else navigate('/lead-generation/prospects/new');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {searchQuery ? 'Clear Search' : 'Add Prospect'}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredProspects.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                    </th>
                    <th className="w-12"></th>
                    {columns.filter(c => c.visible).map(column => (
                      <th
                        key={column.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => column.sortable && handleSort(column.id)}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column.label}</span>
                          {column.sortable && sortColumn === column.id && (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="w-32 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedProspects.map((prospect) => (
                    <React.Fragment key={prospect.id}>
                      <tr
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onMouseEnter={() => setHoveredRowId(prospect.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(prospect.id)}
                            onChange={() => toggleSelection(prospect.id)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleExpanded(prospect.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {expandedIds.has(prospect.id) ? (
                              <ChevronDown className="h-4 w-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-600" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-900">{prospect.fullName}</div>
                          <div className="text-sm text-gray-600">{prospect.title}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-gray-900">{prospect.companyName}</div>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={prospect.leadStatus}
                            onChange={(e) => handleStatusChange(prospect.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={`px-3 py-1 rounded-full text-sm font-semibold border cursor-pointer ${getStatusColor(prospect.leadStatus)}`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="unqualified">Unqualified</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="text-lg font-bold text-gray-900">{prospect.leadScore}</div>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${prospect.leadScore}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {prospect.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                            {prospect.tags.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                +{prospect.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {prospect.lastContactedAt ? getTimeAgo(prospect.lastContactedAt) : 'Never'}
                        </td>
                        <td className="px-4 py-4">
                          {hoveredRowId === prospect.id && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickViewProspect(prospect);
                                }}
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Quick View"
                              >
                                <Eye className="h-4 w-4 text-gray-600" />
                              </button>
                              <button
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Send Email"
                              >
                                <Mail className="h-4 w-4 text-gray-600" />
                              </button>
                              <button
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="Add to Sequence"
                              >
                                <Zap className="h-4 w-4 text-gray-600" />
                              </button>
                              <button
                                className="p-2 hover:bg-gray-200 rounded transition-colors"
                                title="More Actions"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-600" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {expandedIds.has(prospect.id) && (
                        <tr>
                          <td colSpan={9} className="px-4 py-4 bg-gray-50">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Recent Activities</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Mail className="h-4 w-4" />
                                    <span>Sent introduction email - 2d ago</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Status changed to Qualified - 3d ago</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredProspects.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Showing {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, filteredProspects.length)} of {filteredProspects.length}
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 border rounded ${
                      page === p
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Components */}
      <ProspectQuickViewModal
        isOpen={!!quickViewProspect}
        onClose={() => setQuickViewProspect(null)}
        prospect={quickViewProspect}
        onViewFull={(id) => navigate(`/lead-generation/prospects/${id}`)}
      />

      <BulkActionsToolbar
        selectedCount={selectedIds.size}
        totalCount={filteredProspects.length}
        onDeselectAll={() => setSelectedIds(new Set())}
        onAddToSequence={() => {}}
        onChangeStatus={(status) => {}}
        onAddTags={(tags) => {}}
        onExport={() => {}}
        onDelete={() => {}}
      />

      <AdvancedFilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
        onClear={() => setFilters({
          statuses: [],
          leadScoreMin: 0,
          leadScoreMax: 100,
          aiScoreMin: 0,
          aiScoreMax: 100,
          qualityScoreMin: 0,
          qualityScoreMax: 100,
          tags: [],
          companySizes: []
        })}
        onSavePreset={() => {}}
      />
    </div>
  );
};

export default EnhancedProspectsPage;
