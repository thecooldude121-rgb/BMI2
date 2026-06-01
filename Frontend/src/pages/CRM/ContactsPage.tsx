import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Upload,
  Search,
  ChevronDown,
  Mail,
  Phone,
  Eye,
  Target,
  Building2,
  Globe,
  Edit,
  CheckSquare,
  Download,
  Trash2,
  Tag,
  Grid,
  List,
  Columns
} from 'lucide-react';
import { Contact, ContactFilters } from '../../types/contact';
import { sampleContacts } from '../../utils/sampleContacts';
import ContactForm from '../../components/CRM/ContactForm';
import ImportContactsModal from '../../components/CRM/ImportContactsModal';
import ContactActionMenu from '../../components/CRM/ContactActionMenu';
import ReengagementModal from '../../components/CRM/ReengagementModal';

type ViewMode = 'list' | 'grid' | 'kanban';

const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>(sampleContacts);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [showContactForm, setShowContactForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showReengagementModal, setShowReengagementModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [reengageContact, setReengageContact] = useState<Contact | null>(null);

  const [filters, setFilters] = useState<ContactFilters>({
    status: 'all',
    source: 'all',
    tags: 'all',
    searchQuery: '',
    sortBy: 'lastContact',
    sortOrder: 'desc'
  });

  // Calculate stats - showing mock totals for demo
  const stats = useMemo(() => {
    return {
      total: 147,
      activeDeals: 23,
      fromLeadGen: 45,
      fromHRMS: 12,
      vip: 8
    };
  }, []);

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let filtered = [...contacts];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    // Source filter
    if (filters.source !== 'all') {
      filtered = filtered.filter(c => c.source === filters.source);
    }

    // Tags filter
    if (filters.tags !== 'all') {
      filtered = filtered.filter(c => c.tags.includes(filters.tags));
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.company.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (filters.sortBy) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'company':
          aVal = a.company;
          bVal = b.company;
          break;
        case 'createdAt':
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        case 'lastContact':
        default:
          aVal = a.lastContact.date;
          bVal = b.lastContact.date;
      }

      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [contacts, filters]);

  const toggleContactSelection = (id: string) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'lead-gen':
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">🎯 Lead Gen</span>
          </div>
        );
      case 'hrms':
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
            <Building2 className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">🏢 HRMS</span>
          </div>
        );
      case 'website':
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <Globe className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">🌐 Website</span>
          </div>
        );
      case 'manual':
        return (
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg">
            <Edit className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">✍️ Manual</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'VIP':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'Decision Maker':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'Champion':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'C-Level':
        return 'bg-purple-100 text-purple-800 border border-purple-300';
      case 'Hot Lead':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const handleAddContact = () => {
    navigate('/crm/contacts/new');
  };

  const handleEditContact = (contact: Contact) => {
    navigate(`/crm/contacts/${contact.id}/edit`);
  };

  const handleSaveContact = (contactData: any) => {
    if (editingContact) {
      setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, ...contactData } : c));
      alert('✅ Contact updated successfully!');
    } else {
      const newContact: Contact = {
        ...contactData,
        id: String(contacts.length + 1),
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setContacts(prev => [...prev, newContact]);
      alert('✅ Contact created successfully!');
    }
  };

  const handleImportContacts = (file: File) => {
    alert(`Importing contacts from ${file.name}...`);
  };

  const handleDeleteContact = (contactId: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      setContacts(prev => prev.filter(c => c.id !== contactId));
      alert('✅ Contact deleted successfully!');
    }
  };

  const handleEmailContact = (contact: Contact) => {
    window.location.href = `mailto:${contact.email}`;
  };

  const handleCallContact = (contact: Contact) => {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`;
    }
  };

  const handleViewContact = (contactId: string) => {
    navigate(`/crm/contacts/${contactId}`);
  };

  const handleViewDeal = (dealId: string) => {
    navigate(`/crm/deals/${dealId}`);
  };

  const handleReengage = (contact: Contact) => {
    setReengageContact(contact);
    setShowReengagementModal(true);
  };

  const handleArchiveContact = (contactId: string) => {
    if (window.confirm('Are you sure you want to archive this contact?')) {
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, status: 'inactive' as const } : c));
      alert('✅ Contact archived successfully!');
    }
  };

  const handleAssignContact = () => {
    alert('Assign contact functionality - opens team member selector');
  };

  const handleAddToDeal = () => {
    alert('Add to deal functionality - opens deal selector');
  };

  const handleAddTag = () => {
    alert('Add tag functionality - opens tag selector');
  };

  const handleMarkInactive = (contactId: string) => {
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, status: 'inactive' as const } : c));
    alert('Contact marked as inactive!');
  };

  const handleBulkAssign = () => {
    alert(`Assigning ${selectedContacts.length} contacts to team member...`);
  };

  const handleBulkAddTag = () => {
    alert(`Adding tag to ${selectedContacts.length} contacts...`);
  };

  const handleBulkExport = () => {
    const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));
    const csv = [
      'Name,Company,Position,Email,Phone,Source,Status',
      ...selectedContactsData.map(c =>
        `${c.name},${c.company},${c.position},${c.email},${c.phone || ''},${c.source},${c.status}`
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_export.csv';
    a.click();
    alert('✅ Contacts exported successfully!');
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedContacts.length} contacts?`)) {
      setContacts(prev => prev.filter(c => !selectedContacts.includes(c.id)));
      setSelectedContacts([]);
      alert('✅ Contacts deleted successfully!');
    }
  };

  const handleLaunchReengagement = (campaign: any) => {
    alert(`Launching ${campaign.type} campaign for ${campaign.contactName}!`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
              <p className="text-gray-600 text-lg mt-1">
                Manage all your business contacts and relationships
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
            <button
              onClick={handleAddContact}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
            <div className="text-sm text-blue-700 font-medium mt-1">Total Contacts</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-3xl font-bold text-green-900">{stats.activeDeals}</div>
            <div className="text-sm text-green-700 font-medium mt-1">Active Deals</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="text-3xl font-bold text-purple-900">{stats.fromLeadGen}</div>
            <div className="text-sm text-purple-700 font-medium mt-1">From Lead Gen</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="text-3xl font-bold text-orange-900">{stats.fromHRMS}</div>
            <div className="text-sm text-orange-700 font-medium mt-1">From HRMS</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-900">{stats.vip}</div>
            <div className="text-sm text-yellow-700 font-medium mt-1">VIP Contacts</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 space-y-4">
        {/* Filter Pills */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Source:</span>
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value as any })}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="lead-gen">Lead Gen</option>
              <option value="hrms">HRMS</option>
              <option value="manual">Manual</option>
              <option value="website">Website</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Tags:</span>
            <select
              value={filters.tags}
              onChange={(e) => setFilters({ ...filters, tags: e.target.value as any })}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="VIP">VIP</option>
              <option value="Decision Maker">Decision Maker</option>
              <option value="Champion">Champion</option>
            </select>
          </div>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, company..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="lastContact">Sort: Last Contact (Recent)</option>
              <option value="name">Sort: Name</option>
              <option value="company">Sort: Company</option>
              <option value="createdAt">Sort: Date Added</option>
            </select>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md transition-colors font-medium text-sm flex items-center space-x-1 ${
                  viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md transition-colors font-medium text-sm flex items-center space-x-1 ${
                  viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="h-4 w-4" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-md transition-colors font-medium text-sm flex items-center space-x-1 ${
                  viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Columns className="h-4 w-4" />
                <span>Kanban</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Name/Company</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Source</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Tags</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Last Contact</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <React.Fragment key={contact.id}>
                    <tr className={`hover:bg-blue-50 transition-all duration-200 border-b border-gray-100 ${contact.status === 'inactive' ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => toggleContactSelection(contact.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div
                              onClick={() => handleViewContact(contact.id)}
                              className="text-base font-bold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                            >
                              {contact.name}
                            </div>
                            {contact.tags.includes('VIP') && (
                              <span className="text-yellow-500" title="VIP Contact">⭐</span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-700">{contact.company}</div>
                          <div className="text-xs text-gray-500">{contact.position}</div>
                          <div className="text-xs text-blue-600 hover:underline cursor-pointer">{contact.email}</div>
                          {contact.phone && (
                            <div className="text-xs text-gray-600">{contact.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getSourceBadge(contact.source)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {contact.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className={`px-2.5 py-1 text-xs rounded-full font-semibold ${getTagColor(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length > 3 && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-semibold border border-gray-300">
                              +{contact.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-gray-900">{contact.lastContact.date}</div>
                          <div className="text-xs text-gray-600 capitalize">{contact.lastContact.type}</div>
                          {contact.lastContact.details?.includes('AI Notes') && (
                            <div className="text-xs text-purple-600 font-medium flex items-center space-x-1">
                              <span>🤖</span>
                              <span>AI Notes</span>
                            </div>
                          )}
                          {contact.nextAction && (
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              Next: {contact.nextAction.type}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setExpandedContact(expandedContact === contact.id ? null : contact.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <ChevronDown className={`h-5 w-5 text-gray-600 transition-transform ${expandedContact === contact.id ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                    </tr>
                    {expandedContact === contact.id && (
                      <tr>
                        <td colSpan={6} className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5">
                          <div className="space-y-3.5">
                            {/* AI Enrichment */}
                            {contact.aiEnriched && (
                              <div className="flex items-center space-x-2 px-4 py-2 bg-purple-50 border-l-4 border-purple-500 rounded-r-lg">
                                <span className="text-lg">🤖</span>
                                <span className="text-sm font-semibold text-purple-700">AI Enriched:</span>
                                <span className="text-sm text-purple-600 font-medium">+{contact.enrichedDataPoints} data points</span>
                              </div>
                            )}

                            {/* HRMS Source Details - CRITICAL DIFFERENTIATOR */}
                            {contact.sourceDetails && contact.source === 'hrms' && (
                              <div className="flex items-center space-x-2 px-4 py-2.5 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
                                <span className="text-lg">🏢</span>
                                <span className="text-sm font-semibold text-orange-700">{contact.sourceDetails}</span>
                                <span className="ml-2 px-2 py-0.5 bg-orange-200 text-orange-800 text-xs font-bold rounded-full">UNIQUE</span>
                              </div>
                            )}

                            {/* Other Source Details */}
                            {contact.sourceDetails && contact.source !== 'hrms' && (
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-gray-700 font-medium">{contact.sourceDetails}</span>
                              </div>
                            )}

                            {/* Active Deal */}
                            {contact.activeDeal && (
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-green-600 font-semibold">💼 Active Deal:</span>
                                <span
                                  onClick={() => handleViewDeal(contact.id)}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer underline decoration-2 transition-colors"
                                >
                                  {contact.activeDeal.title} ({contact.activeDeal.stage})
                                </span>
                                <span className="text-gray-500">•</span>
                                <span className="text-sm font-bold text-green-700">${contact.activeDeal.value.toLocaleString()}</span>
                              </div>
                            )}

                            {/* Last Contact */}
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-gray-600 font-medium">Last contact:</span>
                              <span className="text-gray-700">
                                {contact.lastContact.date} ({contact.lastContact.details || contact.lastContact.type})
                              </span>
                            </div>

                            {/* Next Action */}
                            {contact.nextAction && (
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-blue-600 font-medium">Next:</span>
                                <span className="text-gray-700">
                                  {contact.nextAction.type} (Due: {contact.nextAction.dueDate})
                                </span>
                              </div>
                            )}

                            {/* Warning */}
                            {contact.warningMessage && (
                              <div className="text-sm text-red-600 font-medium">
                                {contact.warningMessage}
                              </div>
                            )}

                            {/* Status Message for Inactive */}
                            {contact.status === 'inactive' && !contact.warningMessage && (
                              <div className="text-sm text-gray-600">
                                Status: Inactive - No recent activity
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 mt-3">
                              {contact.status === 'inactive' ? (
                                <>
                                  <button
                                    onClick={() => handleReengage(contact)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                  >
                                    Re-engage
                                  </button>
                                  <button
                                    onClick={() => handleArchiveContact(contact.id)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                  >
                                    Archive
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEmailContact(contact)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-1"
                                  >
                                    <Mail className="h-4 w-4" />
                                    <span>Email</span>
                                  </button>
                                  <button
                                    onClick={() => handleCallContact(contact)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-1"
                                  >
                                    <Phone className="h-4 w-4" />
                                    <span>Call</span>
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleViewContact(contact.id)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center space-x-1"
                              >
                                <Eye className="h-4 w-4" />
                                <span>View</span>
                              </button>
                              <ContactActionMenu
                                contactId={contact.id}
                                onEdit={() => handleEditContact(contact)}
                                onDelete={() => handleDeleteContact(contact.id)}
                                onAssign={handleAssignContact}
                                onAddToDeal={handleAddToDeal}
                                onAddTag={handleAddTag}
                                onMarkInactive={() => handleMarkInactive(contact.id)}
                              />
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

          {/* Pagination */}
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredContacts.length} of 147 contacts
            </div>
            <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium">
              Load More...
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedContacts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-500 shadow-lg px-8 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="text-sm font-medium text-gray-900">
              {selectedContacts.length} contacts selected
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBulkAssign}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm flex items-center space-x-2"
              >
                <span>Assign to...</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={handleBulkAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm flex items-center space-x-2"
              >
                <Tag className="h-4 w-4" />
                <span>Add Tag</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={handleBulkExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ContactForm
        isOpen={showContactForm}
        onClose={() => setShowContactForm(false)}
        onSave={handleSaveContact}
        initialData={editingContact}
      />

      <ImportContactsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportContacts}
      />

      <ReengagementModal
        isOpen={showReengagementModal}
        onClose={() => setShowReengagementModal(false)}
        contactName={reengageContact?.name || ''}
        onLaunch={handleLaunchReengagement}
      />
    </div>
  );
};

export default ContactsPage;
