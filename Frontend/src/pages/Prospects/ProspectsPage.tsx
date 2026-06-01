import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Filter, X, ChevronDown, Star, StarOff, Trash2, Edit, Save,
  TrendingUp, Users, Target, Award, Zap, Plus, Download, MoreVertical,
  Check, Tag as TagIcon, Calendar, Mail, Phone, Sparkles, FileText,
  RefreshCw, Undo, Settings, AlertCircle, CheckCircle, Briefcase, Building
} from 'lucide-react';

interface Prospect {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  status: 'New' | 'Contacted' | 'Replied' | 'Interested' | 'Qualified' | 'Converted';
  priority: 'Low' | 'Medium' | 'High' | 'Hot';
  leadScore: number;
  tags: string[];
  aiRecommendation: string;
  lastActivity: string;
  owner: string;
  enrichmentStatus: 'Pending' | 'Enriched' | 'Failed';
  intentLevel: 'Low' | 'Medium' | 'High';
  isPinned: boolean;
  notes: string;
  source: string;
  createdAt: string;
}

interface SmartList {
  id: string;
  name: string;
  filters: any;
  autoRefresh: boolean;
  isPinned: boolean;
}

const SAMPLE_PROSPECTS: Prospect[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    title: 'VP of Sales',
    company: 'TechCorp Inc',
    email: 'sarah.johnson@techcorp.com',
    phone: '555-0101',
    status: 'Qualified',
    priority: 'Hot',
    leadScore: 92,
    tags: ['Enterprise', 'Hot Lead', 'Tech'],
    aiRecommendation: 'High-value prospect with strong buying signals. Schedule executive meeting within 48 hours.',
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'John Smith',
    enrichmentStatus: 'Enriched',
    intentLevel: 'High',
    isPinned: true,
    notes: 'Attended webinar, very engaged',
    source: 'Webinar',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Michael Chen',
    title: 'CTO',
    company: 'DataFlow Systems',
    email: 'michael.chen@dataflow.com',
    phone: '555-0102',
    status: 'Interested',
    priority: 'High',
    leadScore: 85,
    tags: ['Tech', 'Decision Maker'],
    aiRecommendation: 'Technical decision maker. Provide technical documentation and schedule product demo.',
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'Jane Doe',
    enrichmentStatus: 'Enriched',
    intentLevel: 'High',
    isPinned: false,
    notes: 'Requesting technical docs',
    source: 'Website',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    title: 'Marketing Director',
    company: 'Growth Partners',
    email: 'emily.r@growthpartners.com',
    phone: '555-0103',
    status: 'Replied',
    priority: 'Medium',
    leadScore: 68,
    tags: ['Marketing', 'Mid-Market'],
    aiRecommendation: 'Positive response. Send case studies and ROI calculator.',
    lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'John Smith',
    enrichmentStatus: 'Enriched',
    intentLevel: 'Medium',
    isPinned: false,
    notes: 'Interested in ROI',
    source: 'LinkedIn',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    name: 'David Kim',
    title: 'CEO',
    company: 'StartupXYZ',
    email: 'david@startupxyz.com',
    phone: '555-0104',
    status: 'Contacted',
    priority: 'High',
    leadScore: 78,
    tags: ['Startup', 'Founder'],
    aiRecommendation: 'Founder seeking solutions. High urgency, short sales cycle expected.',
    lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'Jane Doe',
    enrichmentStatus: 'Pending',
    intentLevel: 'High',
    isPinned: false,
    notes: 'Quick implementation needed',
    source: 'Referral',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    title: 'Operations Manager',
    company: 'Global Logistics Co',
    email: 'l.anderson@globallogistics.com',
    phone: '555-0105',
    status: 'New',
    priority: 'Low',
    leadScore: 45,
    tags: ['Logistics', 'Operations'],
    aiRecommendation: 'New lead. Send welcome email with industry-specific value proposition.',
    lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    owner: 'John Smith',
    enrichmentStatus: 'Failed',
    intentLevel: 'Low',
    isPinned: false,
    notes: 'Downloaded whitepaper',
    source: 'Content Download',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '6',
    name: 'James Wilson',
    title: 'Product Manager',
    company: 'InnovateTech',
    email: 'j.wilson@innovatetech.com',
    phone: '555-0106',
    status: 'Qualified',
    priority: 'Hot',
    leadScore: 95,
    tags: ['Enterprise', 'Hot Lead', 'Product'],
    aiRecommendation: 'Extremely qualified. Budget approved, decision timeline is 2 weeks. Priority follow-up.',
    lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    owner: 'Jane Doe',
    enrichmentStatus: 'Enriched',
    intentLevel: 'High',
    isPinned: true,
    notes: 'Ready to purchase',
    source: 'Direct Inquiry',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const ProspectsPage: React.FC = () => {
  const [prospects, setProspects] = useState<Prospect[]>(SAMPLE_PROSPECTS);
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>(SAMPLE_PROSPECTS);
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof Prospect } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [undoStack, setUndoStack] = useState<Array<{ id: string; field: keyof Prospect; oldValue: any }>>([]);
  const [saveMessage, setSaveMessage] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedIntentLevels, setSelectedIntentLevels] = useState<string[]>([]);
  const [selectedEnrichmentStatuses, setSelectedEnrichmentStatuses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeSmartList, setActiveSmartList] = useState('all');
  const [smartLists, setSmartLists] = useState<SmartList[]>([
    { id: 'hot', name: 'My Hot Leads', filters: {}, autoRefresh: true, isPinned: true }
  ]);
  const [showSmartListModal, setShowSmartListModal] = useState(false);
  const [newSmartListName, setNewSmartListName] = useState('');

  const [showRowActions, setShowRowActions] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const STATUS_COLORS = {
    New: 'bg-blue-100 text-blue-800 border-blue-300',
    Contacted: 'bg-purple-100 text-purple-800 border-purple-300',
    Replied: 'bg-green-100 text-green-800 border-green-300',
    Interested: 'bg-amber-100 text-amber-800 border-amber-300',
    Qualified: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Converted: 'bg-cyan-100 text-cyan-800 border-cyan-300'
  };

  const PRIORITY_COLORS = {
    Low: 'bg-gray-100 text-gray-700 border-gray-300',
    Medium: 'bg-blue-100 text-blue-700 border-blue-300',
    High: 'bg-orange-100 text-orange-700 border-orange-300',
    Hot: 'bg-red-100 text-red-700 border-red-300'
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-blue-500';
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'text-blue-700 bg-blue-100';
    if (score >= 70) return 'text-emerald-700 bg-emerald-100';
    if (score >= 40) return 'text-amber-700 bg-amber-100';
    return 'text-red-700 bg-red-100';
  };

  useEffect(() => {
    if (editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedStatuses, selectedPriorities, selectedTags, scoreRange,
      selectedOwners, selectedIntentLevels, selectedEnrichmentStatuses, activeSmartList, prospects]);

  const applyFilters = () => {
    let filtered = [...prospects];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.company.toLowerCase().includes(query) ||
        p.title.toLowerCase().includes(query)
      );
    }

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(p => selectedStatuses.includes(p.status));
    }

    if (selectedPriorities.length > 0) {
      filtered = filtered.filter(p => selectedPriorities.includes(p.priority));
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(p => p.tags.some(tag => selectedTags.includes(tag)));
    }

    if (selectedOwners.length > 0) {
      filtered = filtered.filter(p => selectedOwners.includes(p.owner));
    }

    if (selectedIntentLevels.length > 0) {
      filtered = filtered.filter(p => selectedIntentLevels.includes(p.intentLevel));
    }

    if (selectedEnrichmentStatuses.length > 0) {
      filtered = filtered.filter(p => selectedEnrichmentStatuses.includes(p.enrichmentStatus));
    }

    filtered = filtered.filter(p => p.leadScore >= scoreRange[0] && p.leadScore <= scoreRange[1]);

    switch (activeSmartList) {
      case 'hot':
        filtered = filtered.filter(p => p.priority === 'Hot' || p.leadScore >= 85);
        break;
      case 'high-score':
        filtered = filtered.filter(p => p.leadScore >= 80);
        break;
      case 'needs-followup':
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(p => new Date(p.lastActivity) < sevenDaysAgo);
        break;
      case 'qualified':
        filtered = filtered.filter(p => p.status === 'Qualified');
        break;
      case 'pinned':
        filtered = filtered.filter(p => p.isPinned);
        break;
      case 'new-this-week':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(p => new Date(p.createdAt) >= weekAgo);
        break;
    }

    setFilteredProspects(filtered);
  };

  const startEdit = (id: string, field: keyof Prospect) => {
    const prospect = prospects.find(p => p.id === id);
    if (prospect) {
      setEditingCell({ id, field });
      setEditValue(prospect[field]);
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = () => {
    if (!editingCell) return;

    const oldProspect = prospects.find(p => p.id === editingCell.id);
    if (!oldProspect) return;

    const oldValue = oldProspect[editingCell.field];

    setUndoStack([...undoStack, { id: editingCell.id, field: editingCell.field, oldValue }]);

    setProspects(prospects.map(p =>
      p.id === editingCell.id ? { ...p, [editingCell.field]: editValue } : p
    ));

    setSaveMessage('✓ Saved');
    setTimeout(() => setSaveMessage(''), 2000);

    setEditingCell(null);
    setEditValue('');
  };

  const undo = () => {
    if (undoStack.length === 0) return;

    const lastEdit = undoStack[undoStack.length - 1];
    setProspects(prospects.map(p =>
      p.id === lastEdit.id ? { ...p, [lastEdit.field]: lastEdit.oldValue } : p
    ));

    setUndoStack(undoStack.slice(0, -1));
    setSaveMessage('✓ Undone');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const toggleProspectSelection = (id: string) => {
    const newSelection = new Set(selectedProspects);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedProspects(newSelection);
  };

  const toggleAllProspects = () => {
    if (selectedProspects.size === filteredProspects.length) {
      setSelectedProspects(new Set());
    } else {
      setSelectedProspects(new Set(filteredProspects.map(p => p.id)));
    }
  };

  const togglePin = (id: string) => {
    setProspects(prospects.map(p =>
      p.id === id ? { ...p, isPinned: !p.isPinned } : p
    ));
  };

  const deleteProspect = (id: string) => {
    if (confirm('Delete this prospect?')) {
      setProspects(prospects.filter(p => p.id !== id));
      selectedProspects.delete(id);
      setSelectedProspects(new Set(selectedProspects));
    }
  };

  const enrichProspect = (id: string) => {
    setProspects(prospects.map(p =>
      p.id === id ? { ...p, enrichmentStatus: 'Pending' as const } : p
    ));

    setTimeout(() => {
      setProspects(prospects.map(p =>
        p.id === id ? { ...p, enrichmentStatus: 'Enriched' as const } : p
      ));
      setSaveMessage('✓ Enriched');
      setTimeout(() => setSaveMessage(''), 2000);
    }, 1500);
  };

  const addQuickTag = (id: string, tag: string) => {
    setProspects(prospects.map(p =>
      p.id === id ? { ...p, tags: [...new Set([...p.tags, tag])] } : p
    ));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedTags([]);
    setScoreRange([0, 100]);
    setSelectedOwners([]);
    setSelectedIntentLevels([]);
    setSelectedEnrichmentStatuses([]);
    setActiveSmartList('all');
  };

  const saveCurrentAsSmartList = () => {
    if (!newSmartListName.trim()) return;

    const newList: SmartList = {
      id: Date.now().toString(),
      name: newSmartListName,
      filters: {
        searchQuery,
        selectedStatuses,
        selectedPriorities,
        selectedTags,
        scoreRange,
        selectedOwners,
        selectedIntentLevels,
        selectedEnrichmentStatuses
      },
      autoRefresh: false,
      isPinned: false
    };

    setSmartLists([...smartLists, newList]);
    setNewSmartListName('');
    setShowSmartListModal(false);
  };

  const allTags = Array.from(new Set(prospects.flatMap(p => p.tags)));
  const allOwners = Array.from(new Set(prospects.map(p => p.owner)));

  const kpis = {
    total: prospects.length,
    newThisWeek: prospects.filter(p => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(p.createdAt) >= weekAgo;
    }).length,
    qualified: prospects.filter(p => p.status === 'Qualified').length,
    conversionRate: Math.round((prospects.filter(p => p.status === 'Converted').length / prospects.length) * 100),
    avgScore: Math.round(prospects.reduce((sum, p) => sum + p.leadScore, 0) / prospects.length),
    activeToday: prospects.filter(p => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(p.lastActivity) >= today;
    }).length
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const renderEditableCell = (prospect: Prospect, field: keyof Prospect, type: 'text' | 'select' | 'number' = 'text', options?: string[]) => {
    const isEditing = editingCell?.id === prospect.id && editingCell?.field === field;

    if (isEditing) {
      if (type === 'select' && options) {
        return (
          <select
            ref={editInputRef as any}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      }

      return (
        <input
          ref={editInputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(type === 'number' ? parseInt(e.target.value) : e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    }

    return (
      <div
        onClick={() => startEdit(prospect.id, field)}
        className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            startEdit(prospect.id, field);
          }
        }}
        aria-label={`Edit ${field}`}
      >
        {prospect[field]?.toString() || '-'}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
            <p className="text-sm text-gray-600 mt-1">Comprehensive prospect management with inline editing</p>
          </div>
          <div className="flex items-center space-x-2">
            {saveMessage && (
              <span className="text-sm text-green-600 font-medium animate-fade-in">{saveMessage}</span>
            )}
            {undoStack.length > 0 && (
              <button
                onClick={undo}
                className="flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Undo last change"
              >
                <Undo className="h-4 w-4 mr-2" />
                Undo
              </button>
            )}
            <button
              onClick={() => setShowSmartListModal(true)}
              className="flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Save current view as smart list"
            >
              <Save className="h-4 w-4 mr-2" />
              Save View
            </button>
            <button
              className="flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="Export prospects"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Add new prospect"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Prospect
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-6 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Total</p>
                <p className="text-xl font-bold text-blue-700">{kpis.total}</p>
              </div>
              <Users className="h-6 w-6 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">New (7d)</p>
                <p className="text-xl font-bold text-green-700">{kpis.newThisWeek}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 font-medium">Qualified</p>
                <p className="text-xl font-bold text-emerald-700">{kpis.qualified}</p>
              </div>
              <Target className="h-6 w-6 text-emerald-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">Conv. Rate</p>
                <p className="text-xl font-bold text-purple-700">{kpis.conversionRate}%</p>
              </div>
              <Award className="h-6 w-6 text-purple-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 font-medium">Avg Score</p>
                <p className="text-xl font-bold text-amber-700">{kpis.avgScore}</p>
              </div>
              <Sparkles className="h-6 w-6 text-amber-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600 font-medium">Active Today</p>
                <p className="text-xl font-bold text-red-700">{kpis.activeToday}</p>
              </div>
              <Zap className="h-6 w-6 text-red-600 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Smart Lists Sidebar */}
        <div className="w-56 bg-white border-r border-gray-200 p-3 overflow-y-auto flex-shrink-0">
          <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Smart Lists</h3>
          <div className="space-y-1">
            {[
              { id: 'all', label: 'All Prospects', icon: Users, count: prospects.length },
              { id: 'hot', label: 'My Hot Leads', icon: Zap, count: prospects.filter(p => p.priority === 'Hot' || p.leadScore >= 85).length, pinned: true },
              { id: 'high-score', label: 'High Score (80+)', icon: TrendingUp, count: prospects.filter(p => p.leadScore >= 80).length },
              { id: 'needs-followup', label: 'Needs Follow-up', icon: Calendar, count: prospects.filter(p => new Date(p.lastActivity) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length },
              { id: 'qualified', label: 'Qualified', icon: Target, count: prospects.filter(p => p.status === 'Qualified').length },
              { id: 'pinned', label: 'Pinned', icon: Star, count: prospects.filter(p => p.isPinned).length },
              { id: 'new-this-week', label: 'New This Week', icon: Plus, count: kpis.newThisWeek }
            ].map(list => {
              const Icon = list.icon;
              return (
                <button
                  key={list.id}
                  onClick={() => setActiveSmartList(list.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    activeSmartList === list.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-pressed={activeSmartList === list.id}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="truncate">{list.label}</span>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeSmartList === list.id ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {list.count}
                  </span>
                </button>
              );
            })}
          </div>

          {smartLists.length > 1 && (
            <>
              <div className="mt-4 mb-2">
                <h3 className="text-xs font-semibold text-gray-700 uppercase">Custom Lists</h3>
              </div>
              {smartLists.filter(l => l.id !== 'hot').map(list => (
                <button
                  key={list.id}
                  onClick={() => setActiveSmartList(list.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    activeSmartList === list.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{list.name}</span>
                  {list.autoRefresh && <RefreshCw className="h-3 w-3" />}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Search and Filters */}
          <div className="bg-white border-b border-gray-200 p-3 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search prospects..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Search prospects"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  showFilters ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                aria-label="Toggle filters"
                aria-pressed={showFilters}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {(selectedStatuses.length + selectedPriorities.length + selectedTags.length + selectedOwners.length + selectedIntentLevels.length + selectedEnrichmentStatuses.length) > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                    {selectedStatuses.length + selectedPriorities.length + selectedTags.length + selectedOwners.length + selectedIntentLevels.length + selectedEnrichmentStatuses.length}
                  </span>
                )}
              </button>

              {(searchQuery || selectedStatuses.length > 0 || selectedPriorities.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  aria-label="Clear all filters"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </button>
              )}
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-6 gap-3 text-sm">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <div className="space-y-1">
                      {['New', 'Contacted', 'Replied', 'Interested', 'Qualified', 'Converted'].map(status => (
                        <label key={status} className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStatuses.includes(status)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStatuses([...selectedStatuses, status]);
                              } else {
                                setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                              }
                            }}
                            className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                    <div className="space-y-1">
                      {['Hot', 'High', 'Medium', 'Low'].map(priority => (
                        <label key={priority} className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPriorities.includes(priority)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPriorities([...selectedPriorities, priority]);
                              } else {
                                setSelectedPriorities(selectedPriorities.filter(p => p !== priority));
                              }
                            }}
                            className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700">{priority}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Intent Level */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Intent</label>
                    <div className="space-y-1">
                      {['High', 'Medium', 'Low'].map(level => (
                        <label key={level} className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedIntentLevels.includes(level)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIntentLevels([...selectedIntentLevels, level]);
                              } else {
                                setSelectedIntentLevels(selectedIntentLevels.filter(i => i !== level));
                              }
                            }}
                            className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Enrichment */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Enrichment</label>
                    <div className="space-y-1">
                      {['Enriched', 'Pending', 'Failed'].map(status => (
                        <label key={status} className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedEnrichmentStatuses.includes(status)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEnrichmentStatuses([...selectedEnrichmentStatuses, status]);
                              } else {
                                setSelectedEnrichmentStatuses(selectedEnrichmentStatuses.filter(s => s !== status));
                              }
                            }}
                            className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Owner */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Owner</label>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {allOwners.map(owner => (
                        <label key={owner} className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedOwners.includes(owner)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOwners([...selectedOwners, owner]);
                              } else {
                                setSelectedOwners(selectedOwners.filter(o => o !== owner));
                              }
                            }}
                            className="w-3 h-3 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700">{owner}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Score Range */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Score: {scoreRange[0]}-{scoreRange[1]}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={scoreRange[1]}
                      onChange={(e) => setScoreRange([scoreRange[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={scoreRange[0]}
                      onChange={(e) => setScoreRange([parseInt(e.target.value), scoreRange[1]])}
                      className="w-full mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedProspects.size > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 p-3 flex items-center justify-between flex-shrink-0">
              <span className="text-sm font-medium text-blue-900">
                {selectedProspects.size} selected
              </span>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1.5 text-xs bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  Enrich All
                </button>
                <button className="px-3 py-1.5 text-xs bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  Update Status
                </button>
                <button className="px-3 py-1.5 text-xs bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  Add Tags
                </button>
                <button className="px-3 py-1.5 text-xs bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  Assign Owner
                </button>
                <button className="px-3 py-1.5 text-xs bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  Send Email
                </button>
                <button className="px-3 py-1.5 text-xs bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
                  <Trash2 className="h-3 w-3 inline mr-1" />
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="flex-1 overflow-auto min-h-0">
            <div className="min-w-max">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="border-b border-gray-200">
                    <th className="w-10 px-3 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProspects.size === filteredProspects.length && filteredProspects.length > 0}
                        onChange={toggleAllProspects}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Title</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Company</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Priority</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Score</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Owner</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Tags</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Last Activity</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProspects.map(prospect => (
                    <tr key={prospect.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProspects.has(prospect.id)}
                          onChange={() => toggleProspectSelection(prospect.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          aria-label={`Select ${prospect.name}`}
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {prospect.isPinned && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                          {renderEditableCell(prospect, 'name')}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm">{renderEditableCell(prospect, 'title')}</td>
                      <td className="px-3 py-2 text-sm">{renderEditableCell(prospect, 'company')}</td>
                      <td className="px-3 py-2 text-sm">{renderEditableCell(prospect, 'email')}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${STATUS_COLORS[prospect.status]}`}>
                          {prospect.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${PRIORITY_COLORS[prospect.priority]}`}>
                          {prospect.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getScoreColor(prospect.leadScore)}`}
                              style={{ width: `${prospect.leadScore}%` }}
                            />
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getScoreBadgeColor(prospect.leadScore)}`}>
                            {prospect.leadScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm">{renderEditableCell(prospect, 'owner')}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {prospect.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                          {prospect.tags.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                              +{prospect.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        {formatDate(prospect.lastActivity)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1 relative">
                          <button
                            onClick={() => enrichProspect(prospect.id)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            title="Enrich data"
                            aria-label="Enrich prospect data"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => togglePin(prospect.id)}
                            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            title={prospect.isPinned ? 'Unpin' : 'Pin'}
                            aria-label={prospect.isPinned ? 'Unpin' : 'Pin'}
                          >
                            {prospect.isPinned ? (
                              <Star className="h-3.5 w-3.5 fill-yellow-500" />
                            ) : (
                              <StarOff className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Send email"
                            aria-label="Send email"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="p-1 text-green-600 hover:bg-green-50 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            title="Make call"
                            aria-label="Make call"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => addQuickTag(prospect.id, 'Follow-up')}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            title="Add tag"
                            aria-label="Add tag"
                          >
                            <TagIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                            title="Add note"
                            aria-label="Add note"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProspect(prospect.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setShowRowActions(showRowActions === prospect.id ? null : prospect.id)}
                            className="p-1 text-gray-400 hover:bg-gray-50 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                            title="More actions"
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredProspects.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No prospects found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Smart List Modal */}
      {showSmartListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Current View as Smart List</h3>
            <input
              type="text"
              value={newSmartListName}
              onChange={(e) => setNewSmartListName(e.target.value)}
              placeholder="Enter list name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowSmartListModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentAsSmartList}
                disabled={!newSmartListName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectsPage;
