import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Upload, Search, ChevronDown, Mail, Phone, Eye, Target, Building2, Globe, Edit, Download, Trash2, Tag, Grid, List, Columns, UserPlus, Archive, Calendar } from 'lucide-react';
import { NotAvailableBadge } from '../../components/common/NotAvailable';
import type { LucideIcon } from 'lucide-react';
import { Contact, ContactFilters, ContactStatus, ContactSource } from '../../types/contact';
import {
  fetchContacts,
  createContactViaAPI,
  updateContactViaAPI,
  deleteContactViaAPI,
  bulkUpdateContactsViaAPI,
} from '../../utils/contactsApi';
import { useToast } from '../../contexts/ToastContext';
import { toCsv } from '../../utils/csv';
import { describeBulk } from '../../utils/describeBulk';
import ContactForm from '../../components/CRM/ContactForm';
import ImportContactsModal from '../../components/CRM/ImportContactsModal';
import ContactActionMenu from '../../components/CRM/ContactActionMenu';
import ReengagementModal from '../../components/CRM/ReengagementModal';
import AssignOwnerModal from '../../components/CRM/AssignOwnerModal';



const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  /** Set while a write is in flight, so the UI can't fire the same one twice. */
  const [busy, setBusy] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /** Bumped to refetch — a CSV import can create hundreds of rows at once. */
  const [reloadKey, setReloadKey] = useState(0);

  // PHASE 2: contacts now come from /api/v1/contacts, which has had full CRUD
  // all along. Errors are surfaced rather than swallowed into an empty list.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchContacts()
      .then(rows => { if (!cancelled) { setContacts(rows); setLoadError(null); } })
      .catch(e => { if (!cancelled) setLoadError(e?.message ?? 'Could not load contacts'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);
  /**
   * ONLY 'list' renders. The union used to carry 'grid' and 'kanban' too, and
   * all three `viewMode ===` uses in this file were button styling — clicking
   * Kanban set the state, restyled the button, and left `main.innerHTML`
   * BYTE-IDENTICAL: same table, same 20 rows, 37,090 characters before and
   * after. Verified by clicking it in the running app, not by reading the file.
   *
   * Narrowed rather than merely fixed, for the same reason as ActivitiesPage:
   * `setViewMode('grid')` is now a type error, so a mode cannot be reintroduced
   * by adding a button without the render that makes it mean something.
   */
  const [viewMode, setViewMode] = useState<'list'>('list');

  const [showContactForm, setShowContactForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showReengagementModal, setShowReengagementModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [reengageContact, setReengageContact] = useState<Contact | null>(null);
  /** Ids the owner picker will apply to — empty means the picker is closed. */
  const [assigningIds, setAssigningIds] = useState<string[]>([]);

  const [filters, setFilters] = useState<ContactFilters>({
    status: 'all',
    source: 'all',
    tags: 'all',
    searchQuery: '',
    sortBy: 'lastContact',
    sortOrder: 'desc'
  });

  // PHASE 2: these were the literals 147 / 23 / 45 / 12 / 8, shown above a table
  // of 6 sample records. Now derived from the contacts actually loaded.
  // activeDeals / fromLeadGen / fromHRMS stay 0 until contacts carry deal links
  // and a source column — reporting a number with no data behind it is what
  // Phase 0 removed everywhere else.
  const stats = useMemo(() => ({
    total: contacts.length,
    activeDeals: contacts.filter(c => c.activeDeal).length,
    fromLeadGen: contacts.filter(c => c.source === 'lead-gen').length,
    fromHRMS: contacts.filter(c => c.source === 'hrms').length,
    vip: contacts.filter(c => c.tags?.includes('VIP')).length,
  }), [contacts]);

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
          aVal = a.lastContact?.date ?? '';
          bVal = b.lastContact?.date ?? '';
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

  /**
   * Every value in contacts_source_check has a badge. The previous version was
   * a switch over four of the seven and returned null for the rest, so a
   * contact whose source was 'referral', 'converted' or 'event' showed a blank
   * cell that read as "no source recorded".
   *
   * Absence gets its own rendering, because most existing rows genuinely have
   * no source: the mapper used to default those to 'manual', which reported
   * every one of them as hand-entered.
   */
  const SOURCE_BADGES: Record<ContactSource, { label: string; className: string; Icon: LucideIcon }> = {
    'lead-gen':  { label: '🎯 Lead Gen',  className: 'bg-blue-50 border-blue-200 text-blue-700',       Icon: Target },
    'hrms':      { label: '🏢 HRMS',      className: 'bg-orange-50 border-orange-200 text-orange-700', Icon: Building2 },
    'website':   { label: '🌐 Website',   className: 'bg-green-50 border-green-200 text-green-700',    Icon: Globe },
    'referral':  { label: '🤝 Referral',  className: 'bg-purple-50 border-purple-200 text-purple-700', Icon: UserPlus },
    'event':     { label: '📅 Event',     className: 'bg-pink-50 border-pink-200 text-pink-700',       Icon: Calendar },
    'converted': { label: '↗️ Converted', className: 'bg-indigo-50 border-indigo-200 text-indigo-700', Icon: Target },
    'manual':    { label: '✍️ Manual',    className: 'bg-gray-100 border-gray-300 text-gray-700',      Icon: Edit },
    'import':    { label: '📥 Imported',  className: 'bg-teal-50 border-teal-200 text-teal-700',       Icon: Upload },
  };

  const getSourceBadge = (source?: ContactSource) => {
    if (!source) return <span className="text-sm text-gray-400">Not recorded</span>;
    const { label, className, Icon } = SOURCE_BADGES[source];
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1.5 border rounded-lg ${className}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    );
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

  /**
   * Every write below goes to /api/v1/contacts and only updates local state
   * after the server confirms. Previously each one was a setState plus a
   * "✅ ... successfully!" alert: the list read real contacts, so the fake
   * confirmation was completely credible, and the change was gone on refresh.
   *
   * The server owns ids. The old code minted `String(contacts.length + 1)`,
   * which collides the moment the loaded list is stale and does not match the
   * CT001 scheme the table actually uses.
   */
  const handleSaveContact = async (contactData: Partial<Contact>) => {
    setBusy(true);
    try {
      if (editingContact) {
        const saved = await updateContactViaAPI(editingContact.id, contactData);
        setContacts(prev => prev.map(c => (c.id === saved.id ? saved : c)));
        addToast(`${saved.name} updated`, 'success');
      } else {
        const saved = await createContactViaAPI(contactData);
        setContacts(prev => [saved, ...prev]);
        addToast(`${saved.name} created`, 'success');
      }
      setShowContactForm(false);
      setEditingContact(null);
    } catch (e) {
      // The form stays open with the user's input intact — closing it on
      // failure would lose what they typed.
      addToast(e instanceof Error ? e.message : 'Could not save this contact', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!window.confirm(`Delete ${contact?.name ?? 'this contact'}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteContactViaAPI(contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
      addToast(`${contact?.name ?? 'Contact'} deleted`, 'success');
    } catch (e) {
      // A contact named by a quote comes back as a 409 with a message that says
      // so, which is worth showing verbatim rather than replacing.
      addToast(e instanceof Error ? e.message : 'Could not delete this contact', 'error');
    } finally {
      setBusy(false);
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

  /**
   * `setStatusFor` backs archive, mark-inactive and the bulk status action.
   * All three used to be a local setState; 'inactive' is a real column value
   * now (migration 020), so they persist.
   *
   * Note archive maps to 'inactive', not to 'do-not-contact'. Those mean
   * different things — see the ContactStatus doc comment — and conflating them
   * would silently suppress contacts a user only meant to shelve.
   */
  const setStatusFor = async (ids: string[], status: ContactStatus, pastTense: string) => {
    if (ids.length === 0) return;
    setBusy(true);
    try {
      const result = await bulkUpdateContactsViaAPI('status', ids, { status });
      setContacts(prev => prev.map(c => (ids.includes(c.id) ? { ...c, status } : c)));
      addToast(describeBulk(result, pastTense), result.affected > 0 ? 'success' : 'warning');
      setSelectedContacts([]);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Could not update these contacts', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleArchiveContact = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!window.confirm(`Archive ${contact?.name ?? 'this contact'}? They will be marked inactive.`)) return;
    await setStatusFor([contactId], 'inactive', 'Archived');
  };

  const handleMarkInactive = (contactId: string) => setStatusFor([contactId], 'inactive', 'Marked inactive');

  const handleBulkMarkInactive = () => setStatusFor(selectedContacts, 'inactive', 'Marked inactive');

  const handleBulkAddTag = async () => {
    const tag = window.prompt(`Tag to add to ${selectedContacts.length} contact(s):`)?.trim();
    if (!tag) return;
    setBusy(true);
    try {
      const result = await bulkUpdateContactsViaAPI('tag', selectedContacts, { tag });
      // Mirror the server's append-without-duplicating rule locally.
      setContacts(prev => prev.map(c =>
        selectedContacts.includes(c.id) && !c.tags.includes(tag)
          ? { ...c, tags: [...c.tags, tag] }
          : c));
      addToast(describeBulk(result, `Added the tag "${tag}" to`), result.affected > 0 ? 'success' : 'warning');
      setSelectedContacts([]);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Could not add that tag', 'error');
    } finally {
      setBusy(false);
    }
  };

  /**
   * Owner assignment, for one contact or a selection. Real as of migration 020
   * — contacts.owner_id is an FK to users(id). The menu item used to alert
   * "Assign contact functionality - opens team member selector".
   */
  const handleAssignOwner = async (ownerId: number | null) => {
    const ids = assigningIds;
    if (ids.length === 0) return;
    setBusy(true);
    try {
      const result = await bulkUpdateContactsViaAPI('owner', ids, { owner_id: ownerId });
      // ownerName is a join result, so it cannot be derived locally for a real
      // id. Clearing it on assign keeps the row from displaying the PREVIOUS
      // owner's name against the new id; the next load fills it in.
      setContacts(prev => prev.map(c =>
        ids.includes(c.id)
          ? { ...c, ownerId: ownerId ?? undefined, ownerName: undefined }
          : c));
      addToast(describeBulk(result, ownerId === null ? 'Unassigned' : 'Assigned'),
               result.affected > 0 ? 'success' : 'warning');
      setAssigningIds([]);
      setSelectedContacts([]);
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Could not assign these contacts', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleAddTagTo = async (contactId: string) => {
    const tag = window.prompt('Tag to add:')?.trim();
    if (!tag) return;
    setBusy(true);
    try {
      await bulkUpdateContactsViaAPI('tag', [contactId], { tag });
      setContacts(prev => prev.map(c =>
        c.id === contactId && !c.tags.includes(tag) ? { ...c, tags: [...c.tags, tag] } : c));
      addToast(`Tagged "${tag}"`, 'success');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Could not add that tag', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedContacts.length} contact(s)? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const result = await bulkUpdateContactsViaAPI('delete', selectedContacts);
      setContacts(prev => prev.filter(c => !selectedContacts.includes(c.id)));
      addToast(describeBulk(result, 'Deleted'), result.affected > 0 ? 'success' : 'warning');
      setSelectedContacts([]);
    } catch (e) {
      // One 23503 rolls the whole batch back, and the message says so. Do not
      // remove anything from the list in that case.
      addToast(e instanceof Error ? e.message : 'Could not delete these contacts', 'error');
    } finally {
      setBusy(false);
    }
  };

  /**
   * Export is genuinely client-side — the rows are already loaded, so no
   * endpoint is needed and this is real, not a placeholder.
   *
   * Fields are RFC-4180 quoted. The previous version interpolated raw values
   * into a comma-joined string, so a company name like "Acme, Inc." shifted
   * every later column on that row, and a note containing a newline split it
   * into two broken rows. A silently corrupted export is worse than none.
   */
  const handleBulkExport = () => {
    const rows = contacts.filter(c => selectedContacts.includes(c.id));
    if (rows.length === 0) { addToast('Select at least one contact to export', 'warning'); return; }

    const csv = toCsv(
      ['Name','Company','Position','Email','Phone','Mobile','Department','City','Country','Source','Status','Owner','Tags'],
      rows.map(c => [
        c.name, c.company, c.position, c.email, c.phone, c.mobile, c.department,
        c.city, c.country, c.source, c.status, c.ownerName, c.tags.join('; '),
      ]),
    );

    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts_export_${rows.length}.csv`;
    a.click();
    // Revoking is what actually frees the blob; without it the data stays in
    // memory for the life of the document.
    window.URL.revokeObjectURL(url);
    addToast(`Exported ${rows.length} contact${rows.length === 1 ? '' : 's'} to CSV`, 'success');
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
            <Button
              onClick={handleAddContact}
            >
              <Plus className="h-4 w-4" />
              <span>Add Contact</span>
            </Button>
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
            {/*
              * AccountsPage's pattern, applied verbatim: the view that exists
              * gates the render; the views that do not are DISABLED and
              * labelled. CLAUDE.md: "a List/Grid/Kanban toggle that only
              * restyles its buttons is a bug… if a view isn't built, disable the
              * button and label it."
              *
              * Grid and Kanban are not built and are NOT being invented here.
              * AccountsPage could offer Grid because it already had card markup
              * for its mobile layout to gate on; this page has a table and
              * nothing else, so a grid means designing a contact card — and a
              * kanban means first deciding what the columns are (status? owner?
              * lead score?), which is a product question, not a layout one.
              */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`px-3 py-1.5 rounded-md transition-colors font-medium text-sm flex items-center space-x-1 ${
                  viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
                <span>List</span>
              </button>
              {([
                { label: 'Grid',   Icon: Grid },
                { label: 'Kanban', Icon: Columns },
              ] as const).map(({ label, Icon }) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  aria-disabled="true"
                  title={`${label} view is not available yet`}
                  className="px-3 py-1.5 rounded-md font-medium text-sm flex items-center space-x-1 text-gray-400 cursor-not-allowed"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  <NotAvailableBadge label="Soon" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contacts Table. Gated on the view rather than rendered unconditionally
          — that gate is the whole point of the toggle above. */}
      <div className="px-8 py-6" hidden={viewMode !== 'list'}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* An error must not look like an empty list — that is precisely how the
              broken lead endpoints stayed hidden. Loading, failed and genuinely
              empty are three different states and read differently here. */}
          {loadError && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-4">
              <p className="text-sm font-medium text-red-800">Could not load contacts</p>
              <p className="mt-1 text-sm text-red-700">{loadError}</p>
            </div>
          )}
          {loading && !loadError && (
            <div className="px-6 py-10 text-center text-sm text-gray-500">Loading contacts…</div>
          )}
          {!loading && !loadError && filteredContacts.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-gray-900">No contacts yet</p>
              <p className="mt-1 text-sm text-gray-600">
                {contacts.length === 0
                  ? 'Add your first contact to get started.'
                  : 'No contacts match the current filters.'}
              </p>
            </div>
          )}
          <div className="overflow-x-auto" hidden={loading || !!loadError || filteredContacts.length === 0}>
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
                          <div className="text-sm font-semibold text-gray-900">{contact.lastContact?.date ?? '—'}</div>
                          <div className="text-xs text-gray-600 capitalize">{contact.lastContact?.type ?? 'no activity recorded'}</div>
                          {contact.lastContact?.details?.includes('AI Notes') && (
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
                                {contact.lastContact
                                  ? `${contact.lastContact.date} (${contact.lastContact.details || contact.lastContact.type})`
                                  : 'no activity recorded'}
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
                                  <Button
                                    onClick={() => handleReengage(contact)}
                                  >
                                    Re-engage
                                  </Button>
                                  <button
                                    onClick={() => handleArchiveContact(contact.id)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                  >
                                    Archive
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    onClick={() => handleEmailContact(contact)}
                                  >
                                    <Mail className="h-4 w-4" />
                                    <span>Email</span>
                                  </Button>
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
                                onEdit={() => handleEditContact(contact)}
                                onDelete={() => handleDeleteContact(contact.id)}
                                onAssign={() => setAssigningIds([contact.id])}
                                onAddTag={() => handleAddTagTo(contact.id)}
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
              {/* Was "of 147 contacts" — a literal left behind when the KPI tiles
                  above were put on real data in 13/n. The tiles said 20 and this
                  line said 147, on the same screen. */}
              Showing {filteredContacts.length} of {contacts.length} contact{contacts.length === 1 ? '' : 's'}
              {filteredContacts.length !== contacts.length && ' (filtered)'}
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
              {selectedContacts.length} contact{selectedContacts.length === 1 ? '' : 's'} selected
            </div>
            {/* Every one of these now writes to the server, so all of them are
                disabled while a request is in flight — the old versions were
                local setState and could not fail, so double-clicking was
                harmless. It is not any more. */}
            <div className="flex items-center space-x-3">
              <Button variant="secondary" onClick={() => setAssigningIds(selectedContacts)} disabled={busy}>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span>Assign to…</span>
              </Button>
              <Button variant="secondary" onClick={handleBulkAddTag} disabled={busy}>
                <Tag className="h-4 w-4" aria-hidden="true" />
                <span>Add Tag</span>
              </Button>
              <Button variant="secondary" onClick={handleBulkMarkInactive} disabled={busy}>
                <Archive className="h-4 w-4" aria-hidden="true" />
                <span>Mark Inactive</span>
              </Button>
              <Button onClick={handleBulkExport} disabled={busy}>
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Export</span>
              </Button>
              <Button variant="danger" onClick={handleBulkDelete} disabled={busy}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Delete</span>
              </Button>
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
        onImported={() => setReloadKey(k => k + 1)}
      />

      <ReengagementModal
        isOpen={showReengagementModal}
        onClose={() => setShowReengagementModal(false)}
        contactName={reengageContact?.name || ''}
      />

      <AssignOwnerModal
        isOpen={assigningIds.length > 0}
        onClose={() => setAssigningIds([])}
        count={assigningIds.length}
        onAssign={handleAssignOwner}
        busy={busy}
      />
    </div>
  );
};

export default ContactsPage;
