import React, { useState, useMemo, useEffect } from 'react';
import { Upload, Search, Download, Trash2, FileText, Image as ImageIcon, FileSpreadsheet, File, Star, Users, Calendar, FolderOpen, ChevronDown, ChevronRight, Filter, MoreVertical, Eye, Share2, Edit2, Briefcase, CheckSquare, Square, AlertCircle, Link2, Grid3x3, List, Phone, Mail, Building2, Zap, UserCheck, Play, Menu, X, Plus, XCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UploadDocumentModal from '../../components/Documents/UploadDocumentModal';
import DragDropOverlay from '../../components/Documents/DragDropOverlay';
import RecentDocumentsSection from '../../components/Documents/RecentDocumentsSection';
import DocumentPreviewModal from '../../components/Documents/DocumentPreviewModal';
import { documentsService, Document as ServiceDocument } from '../../services/documentsService';
import { useWorkspaceMembers, toShareTarget } from '../../hooks/useWorkspaceMembers';

interface Document {
  id?: string;
  document_id: string;
  document_name: string;
  name?: string;
  file_type: string;
  file_size: number;
  file_url: string;

  category: string;
  subcategory?: string;
  tags: string[];

  deal_id?: string | null;
  account_id?: string | null;
  contact_id?: string | null;
  activity_id?: string | null;

  related_entity_type?: string | null;
  related_entity_id?: string | null;
  related_entity_name?: string | null;

  uploaded_by: string;
  uploaded_date?: string;
  created_at?: string;
  last_modified_by?: string;
  last_modified_date?: string;
  modified_at?: string;
  updated_at?: string;

  version: number;
  /*
   * REAL COLUMNS the local interface omitted. `module` + `record_id` are how a
   * document links to a deal/account/contact — a free-text module name and a
   * free-text id, with NO foreign key. The interface instead declared four
   * separate id columns (deal_id, account_id, contact_id, activity_id) that do
   * not exist on the table, so all four link filters matched nothing.
   */
  module?: string | null;
  record_id?: string | null;
  parent_document_id?: string | null;

  description?: string;
  source?: string;
  source_detail?: string;

  visibility?: string;
  shared_with?: string[];

  view_count?: number;
  download_count?: number;
  access_count?: number;
  last_viewed_date?: string;
  last_accessed_at?: string;

  status?: string;
  owner_name?: string;
  is_starred?: boolean;
  starred?: boolean;
}

/*
 * FILTER VOCABULARIES ONLY — every count here is now DERIVED, not declared.
 *
 * These lists carried hardcoded totals that could not all be true at once:
 * categories summed to 208, file types to 247, related-to to 582, sources to
 * 199, owners to 260 and date ranges to 247. And `documents` holds ZERO ROWS —
 * so the sidebar claimed 247 documents beside a main list that correctly showed
 * none. An empty list contradicted by a populated sidebar is worse than either
 * alone: it reads as a loading bug rather than an empty workspace.
 *
 * Counts come from `facets` below, computed off the same fetched array the list
 * renders. No second data path — the service call was already there.
 */
const CATEGORIES = [
  { name: 'Proposal', icon: '\u{1F4C4}' },
  { name: 'Contract', icon: '\u{1F4CB}' },
  { name: 'Presentation', icon: '\u{1F4CA}' },
  { name: 'Case Study', icon: '\u{1F4D1}' },
  { name: 'Pricing', icon: '\u{1F4B0}' },
  { name: 'Meeting Materials', icon: '\u{1F91D}' },
  { name: 'Email Attachments', icon: '\u{1F4E7}' }
];

const FILE_TYPES = [
  { type: 'pdf',  label: 'PDF' },
  { type: 'docx', label: 'Word' },
  { type: 'pptx', label: 'PowerPoint' },
  { type: 'xlsx', label: 'Excel' },
  { type: 'mp4',  label: 'Video' }
];

/*
 * `module` is the real column behind "related to" — a free-text module name
 * paired with `record_id`. The old list counted against four separate id
 * columns (deal_id, account_id, contact_id, activity_id) that DO NOT EXIST on
 * the table, so every one of those filters matched nothing.
 */
const RELATED_TO = [
  { type: 'deals',      label: 'Deals' },
  { type: 'accounts',   label: 'Accounts' },
  { type: 'contacts',   label: 'Contacts' },
  { type: 'activities', label: 'Activities' },
  { type: 'unlinked',   label: 'Unlinked' }
];

/*
 * RECENT_DOCUMENTS_MOCK held five invented documents — Acme_Corp_Proposal_v2,
 * TechStart_Enterprise_Contract, a BigCo call transcript, a demo deck and a
 * DataFlow case study — each with a view_count, a last_viewed_by name, and
 * deal_id / account_id links to records that do not exist.
 *
 * They rendered in the "Recent Documents" strip ALONGSIDE a correctly-empty
 * main list, which is how one page came to assert both that you have five
 * documents and that you have none. `recentDocuments` is now derived from the
 * real fetched set.
 */

/*
 * SOURCES and OWNERS are gone.
 *
 * SOURCES filtered on a `source` column that does not exist (Manual Upload /
 * Email Attachment / AI-Generated / Calendar Recording, with counts). Nothing
 * on `documents` records how a file arrived.
 *
 * OWNERS named four people with per-person document counts. `uploaded_by` IS a
 * real column, but it holds a free-text name — so the honest owner list is
 * whichever names appear in the data, which `facets.owners` derives.
 */
const DATE_RANGES = [
  { label: 'Today', days: 0 },
  { label: 'This Week', days: 7 },
  { label: 'This Month', days: 30 },
  { label: 'Last 3 Months', days: 90 },
  { label: 'Older', days: 999 }
];

// PHASE 2: 1,510 lines of MOCK_DOCUMENTS fixtures were deleted here. They were
// rendered whenever the document service failed OR returned nothing — and the
// Supabase backend it called was never configured, so that was every load.
// Documents now come from /api/v1/documents; an empty library renders as empty.

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Proposal': 'bg-[#3b82f6] text-white',
    'Contract': 'bg-[#10b981] text-white',
    'Presentation': 'bg-[#f59e0b] text-white',
    'Case Study': 'bg-[#8b5cf6] text-white',
    'Pricing': 'bg-[#14b8a6] text-white',
    'Meeting Materials': 'bg-[#6366f1] text-white',
    'Email Attachments': 'bg-[#06b6d4] text-white'
  };
  return colors[category] || 'bg-gray-100 text-gray-700';
};

const DocumentsLibrary: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [documents, setDocuments] = useState<Document[]>([]);
  /**
   * The five most recently created documents, DERIVED from the fetched set.
   *
   * Was `useState(RECENT_DOCUMENTS_MOCK)` — five invented files that rendered
   * beside a correctly-empty main list. A const, not state, so there is no
   * setter to repopulate it from a fixture by accident.
   */
  /**
   * SIDEBAR COUNTS, DERIVED FROM THE FETCHED SET.
   *
   * Every one of these was a hardcoded literal, and the six lists disagreed
   * with each other — categories summed to 208, file types to 247, related-to
   * to 582. With zero documents in the table the sidebar was advertising 247
   * of them next to a main list that correctly showed none.
   *
   * Computed off `documents`, which the existing documentsService call already
   * populates, rather than through a second request. `GET /documents` supports
   * no facet endpoint and does not need one at this scale; if the library ever
   * paginates server-side these counts have to move to the server, because
   * counting a page is not counting the set. Noted here so that is a decision
   * rather than a surprise.
   */
  /**
   * A FACET COUNT WITH NO SOURCE BEHIND IT RENDERS `—`, NOT A NUMBER.
   *
   * Every count in this sidebar is tallied from `documents`, so a failed fetch
   * turned all of them into confident zeros: "All Documents (0)", "Proposal (0)",
   * "Contract (0)" and so on, beside a list whose empty state said the same
   * thing. An empty library and a broken request were indistinguishable — and
   * this sidebar is already on record in CLAUDE.md as a fabrication site, having
   * once advertised 247 documents over a correctly-empty list.
   *
   * One helper rather than the same ternary at five call sites, because five
   * copies of a rule is five chances for one of them to drift.
   *
   * `—` is the repo's existing idiom for an unsourced figure (AccountsPage's
   * `{dealStats ? kpis.totalDeals : '—'}`).
   */
  const facetCount = (n: number): string => (error || isLoading ? '—' : String(n));

  const facets = useMemo(() => {
    const tally = (values: (string | null | undefined)[]) => {
      const out = new Map<string, number>();
      for (const v of values) {
        if (!v) continue;
        out.set(v, (out.get(v) ?? 0) + 1);
      }
      return out;
    };

    const byCategory = tally(documents.map(d => d.category));
    const byFileType = tally(documents.map(d => (d.file_type ?? '').toLowerCase()));
    const byModule   = tally(documents.map(d => (d.module ?? '').toLowerCase()));
    const byOwner    = tally(documents.map(d => d.uploaded_by));

    const dayMs = 24 * 60 * 60 * 1000;
    const ageInDays = (iso: string | null | undefined) => {
      if (!iso) return null;
      const t = new Date(iso).getTime();
      return Number.isFinite(t) ? Math.floor((Date.now() - t) / dayMs) : null;
    };

    /** Buckets are exclusive and ordered, so a document is counted once. */
    const dateBucket = (days: number | null): string | null => {
      if (days === null) return null;
      if (days <= 0) return 'Today';
      if (days <= 7) return 'This Week';
      if (days <= 30) return 'This Month';
      if (days <= 90) return 'Last 3 Months';
      return 'Older';
    };
    const byDate = tally(documents.map(d => dateBucket(ageInDays(d.created_at))));

    return {
      total: documents.length,
      starred: documents.filter(d => d.is_starred).length,
      category: (name: string) => byCategory.get(name) ?? 0,
      fileType: (type: string) => byFileType.get(type.toLowerCase()) ?? 0,
      /** 'unlinked' means no module recorded, which is a real state. */
      relatedTo: (type: string) =>
        type === 'unlinked'
          ? documents.filter(d => !d.module).length
          : byModule.get(type.toLowerCase()) ?? 0,
      dateRange: (label: string) => byDate.get(label) ?? 0,
      /** Derived owner list, for when the sidebar section is restored. */
      owners: [...byOwner.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count })),
    };
  }, [documents]);

  const recentDocuments = useMemo(
    () => [...documents]
      .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
      .slice(0, 5),
    [documents],
  );
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'my' | 'shared' | 'recent' | 'favorites'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);
  const [selectedRelatedTo, setSelectedRelatedTo] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc' | 'views' | 'downloads'>('recent');
  const [listSortColumn, setListSortColumn] = useState<'name' | 'category' | 'size' | 'owner' | 'uploaded'>('uploaded');
  const [listSortDirection, setListSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [starredDocs, setStarredDocs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  /** Chosen share recipients — nothing is selected by default. */
  const [shareRecipients, setShareRecipients] = useState<Set<string>>(new Set());
  const [shareDocument, setShareDocument] = useState<Document | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDocument, setEditDocument] = useState<Document | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState<string | null>(null);
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedCardIndex, setFocusedCardIndex] = useState<number>(-1);
  const [totalCount, setTotalCount] = useState(0);
  const [isDragOverPage, setIsDragOverPage] = useState(false);
  const [isDraggingOverTarget, setIsDraggingOverTarget] = useState(false);
  const [dragFileCount, setDragFileCount] = useState(0);
  const [preloadedFiles, setPreloadedFiles] = useState<File[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const itemsPerPage = 25;
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const dragCounter = React.useRef(0);

  // Context-aware filtering state
  const [contextFilter, setContextFilter] = useState<{
    type: 'deal' | 'account' | 'contact' | 'activity' | 'category' | 'source' | null;
    id: string | null;
    name: string | null;
    title?: string;
    accountName?: string;
    activityType?: string;
  }>({ type: null, id: null, name: null });

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (selectedOwners.length > 0) {
        filters.owner = selectedOwners[0];
      }

      if (selectedCategories.length > 0) {
        filters.category = selectedCategories[0];
      }

      if (selectedFilter === 'favorites') {
        filters.starred = true;
      }

      if (searchQuery) {
        filters.search = searchQuery;
      }

      const { data, count } = await documentsService.loadDocuments(filters);

      // PHASE 2: an empty result used to substitute MOCK_DOCUMENTS here, so
      // "you have no documents" was indistinguishable from "here are eight
      // fabricated ones". An empty library is a legitimate state; render it.

      const formattedDocs: Document[] = data.map((doc: ServiceDocument) => ({
        id: doc.id,
        document_id: doc.document_id,
        document_name: doc.name,
        name: doc.name,
        file_type: doc.file_type,
        file_size: doc.file_size,
        file_url: doc.file_url || '',
        category: doc.category,
        tags: [],
        deal_id: null,
        account_id: null,
        contact_id: null,
        activity_id: doc.activity_id || null,
        related_entity_type: doc.related_entity_type || null,
        related_entity_id: doc.related_entity_id || null,
        related_entity_name: doc.related_entity_name || null,
        uploaded_by: doc.owner_name,
        uploaded_date: doc.created_at,
        created_at: doc.created_at,
        last_modified_date: doc.modified_at || doc.updated_at,
        modified_at: doc.modified_at || doc.updated_at,
        updated_at: doc.updated_at,
        version: doc.version,
        description: doc.description || '',
        view_count: doc.access_count,
        access_count: doc.access_count,
        last_viewed_date: doc.last_accessed_at || '',
        last_accessed_at: doc.last_accessed_at,
        owner_name: doc.owner_name,
        is_starred: doc.is_starred || doc.starred,
        starred: doc.is_starred || doc.starred,
      }));

      setDocuments(formattedDocs);
      setTotalCount(count);

      // getUserFavorites returns an array of ids; starredDocs is a Set.
      const favorites = await documentsService.getUserFavorites();
      setStarredDocs(new Set(favorites));
    } catch (err: any) {
      // PHASE 2: this used to swallow the failure and show MOCK_DOCUMENTS, with
      // an explicit `setError(null); // Don't show error when using mock data`.
      // The Supabase backend it called was never configured, so that path ran
      // every single time and the library only ever displayed fixtures.
      setDocuments([]);
      setTotalCount(0);
      setError(err?.message ?? 'Could not load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedSort = localStorage.getItem('documents_sort');
    if (savedSort) {
      setSortBy(savedSort as any);
    }
  }, []);

  // Context-aware filtering: Read URL parameters on mount
  useEffect(() => {
    const dealId = searchParams.get('deal_id');
    const accountId = searchParams.get('account_id');
    const contactId = searchParams.get('contact_id');
    const activityId = searchParams.get('activity_id');
    const category = searchParams.get('category');
    const source = searchParams.get('source');
    const dealName = searchParams.get('deal_name');
    // `?? undefined`: searchParams.get returns null for a missing key, but the
    // contextFilter fields are optional (string | undefined), not nullable.
    const accountName = searchParams.get('account_name') ?? undefined;
    const contactName = searchParams.get('contact_name');
    const activityName = searchParams.get('activity_name');
    const activityType = searchParams.get('activity_type') ?? undefined;
    const title = searchParams.get('title') ?? undefined;

    if (dealId) {
      setContextFilter({ type: 'deal', id: dealId, name: dealName || 'Deal' });
      setSelectedRelatedTo(['Deals']);
    } else if (accountId) {
      setContextFilter({
        type: 'account',
        id: accountId,
        name: accountName || 'Account',
      });
      setSelectedRelatedTo(['Accounts']);
    } else if (contactId) {
      setContextFilter({
        type: 'contact',
        id: contactId,
        name: contactName || 'Contact',
        title,
        accountName,
      });
      setSelectedRelatedTo(['Contacts']);
    } else if (activityId) {
      setContextFilter({
        type: 'activity',
        id: activityId,
        name: activityName || 'Activity',
        activityType
      });
      setSelectedRelatedTo(['Activities']);
    } else if (category && source) {
      // Both category and source present (e.g., AI transcripts)
      setContextFilter({
        type: 'category',
        id: category,
        name: `${source} ${category}`
      });
      setSelectedCategories([category]);
      setSelectedSources([source]);
    } else if (category) {
      setContextFilter({ type: 'category', id: category, name: category });
      setSelectedCategories([category]);
    } else if (source) {
      setContextFilter({ type: 'source', id: source, name: source });
      setSelectedSources([source]);
    }
  }, [searchParams]);

  useEffect(() => {
    loadDocuments();
  }, [currentPage, selectedOwners, selectedCategories, selectedFilter, searchQuery]);

  // Drag and drop file upload
  useEffect(() => {
    const handlePageDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer?.types.includes('Files')) {
        dragCounter.current++;
        if (dragCounter.current === 1) {
          setIsDragOverPage(true);
          const itemCount = e.dataTransfer?.items?.length || 1;
          setDragFileCount(itemCount);
        }
      }
    };

    const handlePageDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
      setIsDraggingOverTarget(true);
    };

    const handlePageDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragOverPage(false);
        setIsDraggingOverTarget(false);
        setDragFileCount(0);
      }
    };

    const handlePageDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      dragCounter.current = 0;
      setIsDragOverPage(false);
      setIsDraggingOverTarget(false);
      setDragFileCount(0);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        setPreloadedFiles(fileArray);
        setUploadModalOpen(true);
      }
    };

    document.body.addEventListener('dragenter', handlePageDragEnter);
    document.body.addEventListener('dragover', handlePageDragOver);
    document.body.addEventListener('dragleave', handlePageDragLeave);
    document.body.addEventListener('drop', handlePageDrop);

    return () => {
      document.body.removeEventListener('dragenter', handlePageDragEnter);
      document.body.removeEventListener('dragover', handlePageDragOver);
      document.body.removeEventListener('dragleave', handlePageDragLeave);
      document.body.removeEventListener('drop', handlePageDrop);
    };
  }, []);

  /**
   * `uploaded_by` holds a display NAME already, so there is nothing to look up.
   * This used to map a synthetic key ('user_alex') to a label ('Alex
   * Rodriguez') through the deleted OWNERS list; an unrecognised key fell
   * through to itself, which is why 'user_alex' was rendering verbatim in some
   * places.
   */
  const getUserLabel = (uploadedBy: string): string => uploadedBy || 'Not recorded';

  const handleUpload = async (newDocument: Document) => {
    await loadDocuments();
    setCurrentPage(1);
    showToast('Document uploaded successfully', 'success');
  };

  const handleDeleteConfirm = async () => {
    try {
      const docIds = Array.from(selectedDocs).map(docId => {
        const doc = documents.find(d => d.document_id === docId);
        return doc?.id || '';
      }).filter(Boolean);

      if (docIds.length === 0) {
        showToast('No documents selected', 'error');
        return;
      }

      await documentsService.deleteDocuments(docIds);
      showToast(`${docIds.length} document(s) deleted successfully`, 'success');
      setSelectedDocs(new Set());
      setDeleteModalOpen(false);
      await loadDocuments();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete documents', 'error');
    }
  };

  const handleToggleStar = async (docId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const doc = documents.find(d => d.document_id === docId);
      if (!doc?.id) return;

      // toggleFavorite returns the NEW starred state as a boolean.
      const isStarred = await documentsService.toggleFavorite(doc.id);

      const newStarred = new Set(starredDocs);
      if (isStarred) {
        newStarred.add(doc.id);
      } else {
        newStarred.delete(doc.id);
      }
      setStarredDocs(newStarred);

      setDocuments(prev => prev.map(d =>
        d.document_id === docId
          ? { ...d, is_starred: isStarred, starred: isStarred }
          : d
      ));

      showToast(
        isStarred ? 'Added to favorites' : 'Removed from favorites',
        'success'
      );
    } catch (error: any) {
      showToast(error.message || 'Failed to update favorite', 'error');
    }
  };

  const handleDownloadSelected = async () => {
    try {
      setDownloadProgress({ current: 0, total: selectedDocs.size });

      // downloadDocument now fetches the bytes (the route needs an auth header,
      // so a plain link would 401) and hands them to the browser itself.
      let current = 0;
      const failures: string[] = [];
      for (const docId of Array.from(selectedDocs)) {
        const doc = documents.find(d => d.document_id === docId);
        if (doc?.id) {
          try {
            await documentsService.downloadDocument(doc.id);
          } catch (e: any) {
            // Keep going: one missing file should not abandon the rest of the
            // selection. Report exactly which ones failed.
            failures.push(`${doc.name || doc.id}: ${e?.message ?? 'failed'}`);
          }
        }
        current++;
        setDownloadProgress({ current, total: selectedDocs.size });
      }

      setTimeout(() => setDownloadProgress(null), 2000);
      const ok = selectedDocs.size - failures.length;
      if (failures.length === 0) {
        showToast(`${ok} document(s) downloaded`, 'success');
      } else if (ok === 0) {
        showToast(`Nothing downloaded — ${failures[0]}`, 'error');
      } else {
        showToast(`${ok} downloaded, ${failures.length} failed — ${failures[0]}`, 'warning');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to download documents', 'error');
      setDownloadProgress(null);
    }
  };

  const handleShareConfirm = async (userIds: string[]) => {
    try {
      if (!shareDocument?.id) return;

      await documentsService.shareDocument(shareDocument.id, {
        user_ids: userIds,
        permission: 'view',
      });

      showToast(`Document shared with ${userIds.length} user(s)`, 'success');
      setShareModalOpen(false);
      setShareDocument(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to share document', 'error');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleListSort = (column: 'name' | 'category' | 'size' | 'owner' | 'uploaded') => {
    if (listSortColumn === column) {
      setListSortDirection(listSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setListSortColumn(column);
      setListSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedDocuments.map(d => d.document_id));
      setSelectedDocs(allIds);
    } else {
      setSelectedDocs(new Set());
    }
  };

  const handleSelectDoc = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const handleDocumentClick = (docId: string) => {
    navigate(`/crm/documents/${docId}`);
  };

  const handleClearContextFilter = () => {
    setContextFilter({ type: null, id: null, name: null });
    setSelectedRelatedTo([]);
    setSelectedCategories([]);
    setSelectedSources([]);
    setSearchParams({});
    showToast('Filter cleared - showing all documents', 'success');
  };

  const filteredDocuments = useMemo(() => {
    let docs = [...documents];

    // Context-aware filtering: Filter by specific entity IDs
    if (contextFilter.type && contextFilter.id) {
      if (contextFilter.type === 'deal') {
        docs = docs.filter(d => d.deal_id === contextFilter.id);
      } else if (contextFilter.type === 'account') {
        docs = docs.filter(d => d.account_id === contextFilter.id);
      } else if (contextFilter.type === 'contact') {
        docs = docs.filter(d => d.contact_id === contextFilter.id);
      } else if (contextFilter.type === 'activity') {
        docs = docs.filter(d => d.activity_id === contextFilter.id);
      }
    }

    // Quick filters
    if (selectedFilter === 'my') {
      docs = docs.filter(d => d.uploaded_by === 'Alex Rodriguez' || d.owner_name === 'Alex Rodriguez');
    } else if (selectedFilter === 'shared') {
      docs = docs.filter(d => d.shared_with && d.shared_with.length > 0);
    } else if (selectedFilter === 'recent') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      docs = docs.filter(d => {
        const date = d.last_modified_date || d.modified_at || d.updated_at || d.created_at;
        return date && new Date(date) >= weekAgo;
      });
    } else if (selectedFilter === 'favorites') {
      docs = docs.filter(d => d.is_starred || d.starred || (d.id && starredDocs.has(d.id)));
    }

    // Categories filter
    if (selectedCategories.length > 0) {
      docs = docs.filter(d => selectedCategories.includes(d.category));
    }

    // File types filter
    if (selectedFileTypes.length > 0) {
      docs = docs.filter(d => selectedFileTypes.includes(d.file_type));
    }

    // Related to filter (if not already filtered by context)
    if (selectedRelatedTo.length > 0 && !contextFilter.type) {
      docs = docs.filter(d => {
        if (selectedRelatedTo.includes('Deals') && d.deal_id) return true;
        if (selectedRelatedTo.includes('Accounts') && d.account_id) return true;
        if (selectedRelatedTo.includes('Contacts') && d.contact_id) return true;
        if (selectedRelatedTo.includes('Activities') && d.activity_id) return true;
        if (selectedRelatedTo.includes('Unlinked') && !d.deal_id && !d.account_id && !d.contact_id && !d.activity_id) return true;
        return false;
      });
    }

    // Sources filter
    if (selectedSources.length > 0) {
      docs = docs.filter(d => d.source && selectedSources.includes(d.source));
    }

    // Owners filter
    if (selectedOwners.length > 0) {
      docs = docs.filter(d => selectedOwners.includes(d.uploaded_by));
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      docs = docs.filter(d =>
        (d.document_name || d.name || '').toLowerCase().includes(query) ||
        (d.description || '').toLowerCase().includes(query) ||
        d.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (sortBy === 'recent') {
      docs.sort((a, b) => {
        const dateA = a.last_modified_date || a.modified_at || a.updated_at || a.created_at || '';
        const dateB = b.last_modified_date || b.modified_at || b.updated_at || b.created_at || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    } else if (sortBy === 'oldest') {
      docs.sort((a, b) => {
        const dateA = a.last_modified_date || a.modified_at || a.updated_at || a.created_at || '';
        const dateB = b.last_modified_date || b.modified_at || b.updated_at || b.created_at || '';
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
    } else if (sortBy === 'name-asc') {
      docs.sort((a, b) => (a.document_name || a.name || '').localeCompare(b.document_name || b.name || ''));
    } else if (sortBy === 'name-desc') {
      docs.sort((a, b) => (b.document_name || b.name || '').localeCompare(a.document_name || a.name || ''));
    } else if (sortBy === 'size-desc') {
      docs.sort((a, b) => b.file_size - a.file_size);
    } else if (sortBy === 'size-asc') {
      docs.sort((a, b) => a.file_size - b.file_size);
    } else if (sortBy === 'views') {
      docs.sort((a, b) => (b.view_count || b.access_count || 0) - (a.view_count || a.access_count || 0));
    } else if (sortBy === 'downloads') {
      docs.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
    }

    return docs;
  }, [documents, searchQuery, selectedFilter, selectedCategories, selectedFileTypes, selectedRelatedTo, selectedSources, selectedOwners, selectedDateRange, sortBy, starredDocs, contextFilter]);

  const paginatedDocuments = useMemo(() => {
    let docs = [...filteredDocuments];

    if (viewMode === 'list') {
      docs.sort((a, b) => {
        let compareValue = 0;

        if (listSortColumn === 'name') {
          compareValue = a.document_name.localeCompare(b.document_name);
        } else if (listSortColumn === 'category') {
          compareValue = a.category.localeCompare(b.category);
        } else if (listSortColumn === 'size') {
          compareValue = a.file_size - b.file_size;
        } else if (listSortColumn === 'owner') {
          const ownerA = getUserLabel(a.uploaded_by);
          const ownerB = getUserLabel(b.uploaded_by);
          compareValue = ownerA.localeCompare(ownerB);
        } else if (listSortColumn === 'uploaded') {
          // uploaded_date is optional; `?? 0` sorts an undated document last
          // instead of producing NaN, which makes the comparator non-deterministic
          // and can corrupt the whole sort order.
          compareValue = new Date(a.uploaded_date ?? 0).getTime() - new Date(b.uploaded_date ?? 0).getTime();
        }

        return listSortDirection === 'asc' ? compareValue : -compareValue;
      });
    }

    const start = (currentPage - 1) * itemsPerPage;
    return docs.slice(start, start + itemsPerPage);
  }, [filteredDocuments, currentPage, viewMode, listSortColumn, listSortDirection]);

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on '/'
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Open upload modal on 'U'
      if (e.key === 'u' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setUploadModalOpen(true);
        return;
      }

      // Close modals on 'Escape'
      if (e.key === 'Escape') {
        setUploadModalOpen(false);
        setShareModalOpen(false);
        setEditModalOpen(false);
        setDeleteModalOpen(false);
        setMoreMenuOpen(null);
        return;
      }

      // Select all on Ctrl/Cmd + A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        handleSelectAll(selectedDocs.size !== paginatedDocuments.length);
        return;
      }

      // Delete selected on Delete key
      if (e.key === 'Delete' && selectedDocs.size > 0 && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setDeleteModalOpen(true);
        return;
      }

      // Navigate cards with arrow keys
      if (document.activeElement?.getAttribute('data-card-index')) {
        const currentIndex = parseInt(document.activeElement.getAttribute('data-card-index') || '0');

        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, paginatedDocuments.length - 1);
          const nextCard = document.querySelector(`[data-card-index="${nextIndex}"]`) as HTMLElement;
          nextCard?.focus();
          setFocusedCardIndex(nextIndex);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          const prevCard = document.querySelector(`[data-card-index="${prevIndex}"]`) as HTMLElement;
          prevCard?.focus();
          setFocusedCardIndex(prevIndex);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleDocumentClick(paginatedDocuments[currentIndex].document_id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedDocs, paginatedDocuments]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFileIcon = (type: Document['file_type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-16 h-16" style={{ color: '#dc2626' }} />;
      case 'docx':
        return <FileText className="w-16 h-16" style={{ color: '#2563eb' }} />;
      case 'xlsx':
        return <FileSpreadsheet className="w-16 h-16" style={{ color: '#16a34a' }} />;
      case 'pptx':
        return <File className="w-16 h-16" style={{ color: '#ea580c' }} />;
      case 'mp4':
        return <Play className="w-16 h-16" style={{ color: '#9333ea' }} />;
      case 'jpg':
      case 'png':
        return <ImageIcon className="w-16 h-16" style={{ color: '#6b7280' }} />;
      default:
        return <File className="w-16 h-16" style={{ color: '#6b7280' }} />;
    }
  };

  const getFileIconSmall = (type: Document['file_type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5" style={{ color: '#dc2626' }} />;
      case 'docx':
        return <FileText className="w-5 h-5" style={{ color: '#2563eb' }} />;
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5" style={{ color: '#16a34a' }} />;
      case 'pptx':
        return <File className="w-5 h-5" style={{ color: '#ea580c' }} />;
      case 'mp4':
        return <Play className="w-5 h-5" style={{ color: '#9333ea' }} />;
      case 'jpg':
      case 'png':
        return <ImageIcon className="w-5 h-5" style={{ color: '#6b7280' }} />;
      default:
        return <File className="w-5 h-5" style={{ color: '#6b7280' }} />;
    }
  };

  const getFileExtension = (type: Document['file_type']): string => {
    return type.toUpperCase();
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
    setCurrentPage(1);
  };

  const toggleFileType = (type: string) => {
    setSelectedFileTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    setCurrentPage(1);
  };

  const toggleRelatedTo = (relatedType: string) => {
    setSelectedRelatedTo(prev =>
      prev.includes(relatedType) ? prev.filter(r => r !== relatedType) : [...prev, relatedType]
    );
    setCurrentPage(1);
  };



  const toggleDocSelection = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const toggleStar = (docId: string) => {
    const newStarred = new Set(starredDocs);
    if (newStarred.has(docId)) {
      newStarred.delete(docId);
      showToast('Removed from favorites', 'success');
    } else {
      newStarred.add(docId);
      showToast('Added to favorites', 'success');
    }
    setStarredDocs(newStarred);
  };

  const selectAll = () => {
    if (selectedDocs.size === paginatedDocuments.length && paginatedDocuments.length > 0) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(paginatedDocuments.map(d => d.document_id)));
    }
  };

  const handleBulkDownload = async () => {
    const total = selectedDocs.size;
    setDownloadProgress({ current: 0, total });
    showToast(`Preparing download... 0 of ${total} files`, 'success');

    let current = 0;
    for (const docId of selectedDocs) {
      await new Promise(resolve => setTimeout(resolve, 200));
      current++;
      setDownloadProgress({ current, total });
      if (current < total) {
        showToast(`Preparing download... ${current} of ${total} files`, 'success');
      }
    }

    showToast(`✓ ${total} documents downloaded`, 'success');
    setDownloadProgress(null);
    setSelectedDocs(new Set());
  };

  const handleBulkDelete = () => {
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    const deletedDocs = Array.from(selectedDocs);
    setDocuments(prev => prev.filter(doc => !selectedDocs.has(doc.document_id)));
    showToast(`✓ ${deletedDocs.length} document${deletedDocs.length !== 1 ? 's' : ''} deleted`, 'success');
    setSelectedDocs(new Set());
    setDeleteModalOpen(false);
  };

  /*
   * Workspace members for the share picker, from the SAME hook
   * DocumentDetailPage uses — one list, one source. See
   * `useWorkspaceMembers` for what the three hardcoded lists claimed.
   */
  const { members, loading: membersLoading, error: membersError } = useWorkspaceMembers();
  const shareTargets = useMemo(() => members.map(toShareTarget), [members]);

  const toggleShareRecipient = (userId: string) => {
    setShareRecipients(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  };

  const getSelectedDocuments = () => {
    return documents.filter(doc => selectedDocs.has(doc.document_id));
  };

  /*
   * `getRelatedEntityName` AND `getActivityName` WERE DELETED HERE, and they
   * were a landmine rather than merely dead.
   *
   * Both were lookup tables of invented ids to invented content — and the
   * content carried VALUES, not just names: 'deal_acme_001' -> 'Acme Corp -
   * $50K', 'deal_health_001' -> 'HealthPlus - $62K', 'act_bigco_001' ->
   * 'Discovery Call (Dec 7)'.
   *
   * They never fired, because they were keyed on `doc.deal_id`,
   * `doc.account_id` and `doc.activity_id` — and NONE OF THOSE COLUMNS EXISTS.
   * `documents` has `module` and `record_id` (verified against
   * information_schema); the four separate id columns the old local `Document`
   * type declared were never deployed.
   *
   * Deleted rather than left dead precisely BECAUSE they never fired: the
   * moment someone adds a `deal_id` — which the tracked `module`/`record_id`
   * FK work would plausibly do — every document pointing at an unknown deal
   * would start rendering "Acme Corp - $50K" with nothing behind it, and the
   * person adding the column would have no reason to suspect a fabricated
   * fallback was waiting. Related-entity names belong to whatever resolves
   * `module` + `record_id` for real; until then the column is simply absent.
   */

  const handleNavigateToEntity = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();

    if (doc.related_entity_type && doc.related_entity_id) {
      const type = doc.related_entity_type.toLowerCase();
      if (type === 'deal') {
        navigate(`/crm/deals/${doc.related_entity_id}`);
      } else if (type === 'account') {
        navigate(`/crm/accounts/${doc.related_entity_id}`);
      } else if (type === 'contact') {
        navigate(`/crm/contacts/${doc.related_entity_id}`);
      }
    } else if (doc.deal_id) {
      navigate(`/crm/deals/${doc.deal_id}`);
    } else if (doc.account_id) {
      navigate(`/crm/accounts/${doc.account_id}`);
    } else if (doc.contact_id) {
      navigate(`/crm/contacts/${doc.contact_id}`);
    }
  };

  const handleNavigateToActivity = (e: React.MouseEvent, activityId: string) => {
    e.stopPropagation();
    navigate(`/crm/activities/${activityId}`);
  };

  const handleCardClick = (e: React.MouseEvent, docId: string) => {
    if ((e.target as HTMLElement).closest('button, input[type="checkbox"], a')) {
      return;
    }
    navigate(`/crm/documents/${docId}`);
  };

  const handleCheckboxClick = (docId: string) => {
    setSelectedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategories([category]);
    setSelectedFilter('all');
    setCurrentPage(1);
    setSidebarOpen(false);
    showToast(`Filtering by category: ${category}`, 'success');
  };

  const handleSourceFilter = (source: string) => {
    setSelectedSources([source]);
    setSelectedFilter('all');
    setCurrentPage(1);
    setSidebarOpen(false);
    showToast(`Filtering by source: ${source}`, 'success');
  };

  const handleViewDocument = (doc: Document) => {
    if (doc.file_type.toLowerCase().includes('pdf') || doc.file_type.toLowerCase().includes('image') || doc.file_type.toLowerCase().includes('jpg') || doc.file_type.toLowerCase().includes('png')) {
      showToast(`Opening preview for ${doc.document_name}`, 'info');
    } else {
      handleDownloadDocument(doc);
    }
  };

  const handleDownloadDocument = (doc: Document) => {
    setDocuments(prev => prev.map(d =>
      d.document_id === doc.document_id
        ? { ...d, download_count: (d.download_count || 0) + 1 }
        : d
    ));
    showToast(`Downloading ${doc.document_name}`, 'success');
  };

  const handleShareDocument = (doc: Document) => {
    setShareDocument(doc);
    setShareModalOpen(true);
    setMoreMenuOpen(null);
  };

  const handleEditDocument = (doc: Document) => {
    setEditDocument(doc);
    setEditModalOpen(true);
    setMoreMenuOpen(null);
  };

  const handleToggleFavorite = (docId: string) => {
    setStarredDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
        showToast('Removed from favorites', 'success');
      } else {
        newSet.add(docId);
        showToast('Added to favorites', 'success');
      }
      return newSet;
    });
    setMoreMenuOpen(null);
  };

  const handleArchiveDocument = (docId: string) => {
    setDocuments(prev => prev.map(doc =>
      doc.document_id === docId
        ? { ...doc, status: 'Archived' as any }
        : doc
    ));
    showToast('Document archived', 'success');
    setMoreMenuOpen(null);
  };

  const handleDeleteSingleDocument = (doc: Document) => {
    setDocuments(prev => prev.filter(d => d.document_id !== doc.document_id));
    showToast(`✓ ${doc.document_name} deleted`, 'success');
    setMoreMenuOpen(null);
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedFilter('all');
    setSelectedCategories([]);
    setSelectedFileTypes([]);
    setSelectedRelatedTo([]);
    setSelectedSources([]);
    setSelectedOwners([]);
    setSelectedDateRange(null);
    setCurrentPage(1);
    showToast('All filters cleared', 'success');
  };

  const hasActiveFilters = () => {
    return (
      searchQuery.length > 0 ||
      selectedFilter !== 'all' ||
      selectedCategories.length > 0 ||
      selectedFileTypes.length > 0 ||
      selectedRelatedTo.length > 0 ||
      selectedSources.length > 0 ||
      selectedOwners.length > 0 ||
      selectedDateRange !== null
    );
  };

  const handleRetryLoad = () => {
    setError(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast('Documents loaded successfully', 'success');
    }, 800);
  };

  // Recent Documents handlers
  const handleRecentViewAll = () => {
    setSelectedFilter('recent');
    showToast('Showing all recent documents', 'info');

    setTimeout(() => {
      const gridElement = document.querySelector('[data-documents-grid]');
      if (gridElement) {
        gridElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleClearRecentFilter = () => {
    setSelectedFilter('all');
    showToast('Showing all documents', 'info');
  };

  const handleRecentPreview = (doc: any) => {
    setPreviewDocument(doc);
    setPreviewModalOpen(true);
  };

  const handleRecentDownload = (doc: any) => {
    showToast(`Downloading: ${doc.document_name}`, 'success');
  };

  const handleClosePreviewModal = () => {
    setPreviewModalOpen(false);
    setPreviewDocument(null);
  };

  const handlePreviewDownload = (doc: any) => {
    showToast(`Downloading: ${doc.document_name}`, 'success');
    handleDownloadDocument(doc);
  };

  const handlePreviewViewDetails = (doc: any) => {
    setPreviewModalOpen(false);
    navigate(`/crm/documents/${doc.document_id}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Skeleton Loader Component
  const SkeletonCard = () => (
    <div className="bg-white rounded-lg overflow-hidden animate-pulse" style={{ border: '1px solid #e5e7eb' }}>
      <div style={{ height: '160px', backgroundColor: '#f3f4f6' }} />
      <div className="p-4 space-y-3">
        <div style={{ height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '75%' }} />
        <div className="flex gap-2">
          <div style={{ height: '20px', width: '60px', backgroundColor: '#e5e7eb', borderRadius: '12px' }} />
          <div style={{ height: '20px', width: '50px', backgroundColor: '#e5e7eb', borderRadius: '12px' }} />
        </div>
        <div style={{ height: '14px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '90%' }} />
        <div style={{ height: '14px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '60%' }} />
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(12)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );

  const SidebarContent = () => (
    <div className="p-6 space-y-6">
      {/* Quick Filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Quick Filters
        </h3>
        <div className="space-y-2">
          {[
            /*
             * 'My Documents' and 'Shared with Me' are GONE rather than derived.
             * `uploaded_by` is a free-text name with nothing tying it to the
             * session, so "mine" is not answerable — and there is no
             * document_shares table at all, so "shared with me" has no source
             * whatsoever. They used to read 89 and 34.
             *
             * The three that remain are computed from the fetched set.
             */
            { id: 'all', label: 'All Documents', count: facets.total },
            { id: 'recent', label: 'Recent', count: facets.dateRange('This Week') },
            { id: 'favorites', label: 'Favorites', count: facets.starred }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => { setSelectedFilter(filter.id as any); setCurrentPage(1); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left text-sm hover:bg-[#f3f4f6]"
            >
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ border: '2px solid #667eea' }}
              >
                {selectedFilter === filter.id && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#667eea' }} />
                )}
              </div>
              <span className={`flex-1 ${selectedFilter === filter.id ? 'font-semibold' : ''}`} style={{ color: selectedFilter === filter.id ? '#667eea' : '#4b5563' }}>
                {filter.label}
              </span>
              {/*
                A COUNT IS OMITTED, NOT ZEROED, WHEN NOTHING LOADED. With the API
                unreachable this sidebar read "All Documents (0)" — a count
                derived from an empty array, sitting beside a list whose empty
                state says the same thing, so a reader cannot tell an empty
                library from a broken request. `—` is the repo's idiom for a
                figure with no source (AccountsPage's `{dealStats ? … : '—'}`).

                Favorites is exempt: `starredDocs` is local per-viewer state, not
                fetched, so it is genuinely known even when the fetch failed.
              */}
              <span className="text-[13px]" style={{ color: '#6b7280' }}>
                ({filter.id === 'favorites' ? starredDocs.size : facetCount(filter.count)})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* By Category */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          By Category
        </h3>
        <div className="space-y-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.name}
              onClick={() => { toggleCategory(cat.name); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left text-sm ${
                selectedCategories.includes(cat.name)
                  ? 'bg-[#eff6ff] text-[#667eea]'
                  : 'text-[#4b5563] hover:bg-[#eff6ff]'
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedCategories.includes(cat.name) ? (
                  <CheckSquare className="w-4 h-4" style={{ color: '#667eea' }} />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
                <span>{cat.icon} {cat.name}</span>
              </div>
              <span className="text-[13px] text-[#6b7280]">({facetCount(facets.category(cat.name))})</span>
            </button>
          ))}
        </div>
      </div>

      {/* By File Type */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <File className="w-4 h-4" />
          By File Type
        </h3>
        <div className="space-y-2">
          {FILE_TYPES.map(ft => (
            <button
              key={ft.type}
              onClick={() => { toggleFileType(ft.type); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left text-sm ${
                selectedFileTypes.includes(ft.type)
                  ? 'bg-[#eff6ff] text-[#667eea]'
                  : 'text-[#4b5563] hover:bg-[#eff6ff]'
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedFileTypes.includes(ft.type) ? (
                  <CheckSquare className="w-4 h-4" style={{ color: '#667eea' }} />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
                <span>{ft.label}</span>
              </div>
              <span className="text-[13px] text-[#6b7280]">({facetCount(facets.fileType(ft.type))})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Related To */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Related To
        </h3>
        <div className="space-y-2">
          {RELATED_TO.map(rt => (
            <button
              key={rt.type}
              onClick={() => { toggleRelatedTo(rt.type); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left text-sm ${
                selectedRelatedTo.includes(rt.type)
                  ? 'bg-[#eff6ff] text-[#667eea]'
                  : 'text-[#4b5563] hover:bg-[#eff6ff]'
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedRelatedTo.includes(rt.type) ? (
                  <CheckSquare className="w-4 h-4" style={{ color: '#667eea' }} />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
                <span>{rt.label}</span>
              </div>
              <span className="text-[13px] text-[#6b7280]">({facetCount(facets.relatedTo(rt.type))})</span>
            </button>
          ))}
        </div>
      </div>

      {/*
        THE "BY SOURCE" AND "BY OWNER" SIDEBAR SECTIONS WERE HERE.

        By Source filtered on a `source` column that does not exist. Nothing on
        `documents` records how a file arrived, so Manual Upload / Email
        Attachment / AI-Generated / Calendar Recording were four filters that
        could never match anything, above four invented counts.

        By Owner listed four named people with per-person totals. `uploaded_by`
        IS a real column, but it holds a free-text NAME — so a fixed list of
        four is wrong in both directions: it offers people who may have
        uploaded nothing and omits anyone who did. `facets.owners` derives an
        honest list; it is not rendered yet because with zero documents a
        section header over an empty list reads as broken. Restore it when the
        table has rows.
      */}

      {/* By Date */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          By Date
        </h3>
        <div className="space-y-2">
          {DATE_RANGES.map(range => (
            <button
              key={range.label}
              onClick={() => {
                setSelectedDateRange(selectedDateRange === range.label ? null : range.label);
                setCurrentPage(1);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-left text-sm ${
                selectedDateRange === range.label
                  ? 'bg-[#eff6ff] text-[#667eea]'
                  : 'text-[#4b5563] hover:bg-[#eff6ff]'
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedDateRange === range.label ? (
                  <CheckSquare className="w-4 h-4" style={{ color: '#667eea' }} />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
                <span>{range.label}</span>
              </div>
              <span className="text-[13px] text-[#6b7280]">({facetCount(facets.dateRange(range.label))})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#f9fafb' }}>
      {/* Breadcrumb */}
      <div className="bg-white px-8 py-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div className="flex items-center text-sm" style={{ color: '#6b7280' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="hover:text-[#667eea] transition-colors"
          >
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          {contextFilter.type && contextFilter.name ? (
            <>
              <button
                onClick={handleClearContextFilter}
                className="hover:text-[#667eea] transition-colors"
              >
                Documents
              </button>
              <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              <span style={{ color: '#1f2937' }} className="font-medium">
                {contextFilter.type === 'deal' && `Deal: ${contextFilter.name}`}
                {contextFilter.type === 'account' && `Account: ${contextFilter.name}`}
                {contextFilter.type === 'contact' && `Contact: ${contextFilter.name}`}
                {contextFilter.type === 'activity' && `Activity: ${contextFilter.name}`}
                {contextFilter.type === 'category' && contextFilter.name}
                {contextFilter.type === 'source' && `${contextFilter.name} Documents`}
              </span>
            </>
          ) : (
            <span style={{ color: '#1f2937' }} className="font-medium">Documents</span>
          )}
        </div>
      </div>

      {/* Context Banner */}
      {contextFilter.type && contextFilter.name && (
        <div className="bg-blue-50 border-b border-blue-100 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                {contextFilter.type === 'deal' && <Briefcase className="w-5 h-5 text-blue-600" />}
                {contextFilter.type === 'account' && <Building2 className="w-5 h-5 text-blue-600" />}
                {contextFilter.type === 'contact' && <UserCheck className="w-5 h-5 text-blue-600" />}
                {contextFilter.type === 'activity' && <Calendar className="w-5 h-5 text-blue-600" />}
                {contextFilter.type === 'category' && <FolderOpen className="w-5 h-5 text-blue-600" />}
                {contextFilter.type === 'source' && <Zap className="w-5 h-5 text-blue-600" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedCategories.length > 0 || selectedSources.length > 0 || searchQuery ? 'Showing' : 'Showing documents for:'}
                  </span>
                  {selectedCategories.length > 0 && (
                    <span className="font-semibold text-blue-700">
                      {selectedCategories.join(', ')}
                    </span>
                  )}
                  {selectedCategories.length > 0 && (contextFilter.type === 'deal' || contextFilter.type === 'account' || contextFilter.type === 'contact' || contextFilter.type === 'activity') && (
                    <span className="text-sm font-medium text-blue-900">for:</span>
                  )}
                  <span className="font-semibold text-blue-700">
                    {contextFilter.name}
                    {contextFilter.type === 'deal' && ' (Deal)'}
                    {contextFilter.type === 'account' && ' (Account)'}
                    {contextFilter.type === 'contact' && contextFilter.title && contextFilter.accountName && (
                      ` (${contextFilter.title} at ${contextFilter.accountName})`
                    )}
                    {contextFilter.type === 'contact' && !contextFilter.title && !contextFilter.accountName && ' (Contact)'}
                    {contextFilter.type === 'activity' && contextFilter.activityType && ` (${contextFilter.activityType})`}
                    {contextFilter.type === 'activity' && !contextFilter.activityType && ' (Activity)'}
                  </span>
                  {searchQuery && (
                    <span className="text-sm text-blue-900">
                      matching <span className="font-semibold">"{searchQuery}"</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            <button
              onClick={handleClearContextFilter}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              {selectedCategories.length > 0 || selectedSources.length > 0 || searchQuery ? 'Clear All Filters' : 'Clear Filter'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-8 py-8" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" style={{ color: '#667eea' }} />
            </button>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
              <FolderOpen className="w-6 h-6" style={{ color: '#667eea' }} />
            </div>
            <div>
              <h1 className="font-bold" style={{ fontSize: '28px', color: '#1f2937' }}>Documents Library</h1>
              <p className="text-sm" style={{ color: '#6b7280' }}>Manage and organize all your business documents</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            style={{ backgroundColor: '#667eea' }}
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#9ca3af' }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2"
              style={{ border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" style={{ color: '#9ca3af' }} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ border: '1px solid #e5e7eb' }}
            >
              {viewMode === 'grid' ? (
                <>
                  <Grid3x3 className="w-4 h-4" style={{ color: '#667eea' }} />
                  <span style={{ color: '#1f2937' }}>Grid</span>
                </>
              ) : (
                <>
                  <List className="w-4 h-4" style={{ color: '#667eea' }} />
                  <span style={{ color: '#1f2937' }}>List</span>
                </>
              )}
              <ChevronDown className="w-4 h-4" style={{ color: '#9ca3af' }} />
            </button>

            {viewDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10" style={{ border: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => {
                    setViewMode('grid');
                    setViewDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ border: '2px solid #667eea' }}>
                    {viewMode === 'grid' && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#667eea' }} />
                    )}
                  </div>
                  <Grid3x3 className="w-4 h-4" style={{ color: '#6b7280' }} />
                  <span className="text-sm" style={{ color: '#1f2937' }}>Grid View</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode('list');
                    setViewDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ border: '2px solid #667eea' }}>
                    {viewMode === 'list' && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#667eea' }} />
                    )}
                  </div>
                  <List className="w-4 h-4" style={{ color: '#6b7280' }} />
                  <span className="text-sm" style={{ color: '#1f2937' }}>List View</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - Desktop */}
        <div className="hidden lg:block bg-white overflow-y-auto" style={{ width: '300px', minWidth: '300px', borderRight: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <SidebarContent />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white z-50 overflow-y-auto shadow-2xl">
              <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: '#e5e7eb' }}>
                <h3 className="font-semibold" style={{ color: '#1f2937' }}>Filters</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </div>
          </>
        )}

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              {/* Toolbar */}
              <div className="bg-white rounded-lg p-4 mb-6" style={{ border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <span className="text-sm" style={{ color: '#6b7280' }}>
                      Showing <span className="font-semibold" style={{ color: '#1f2937' }}>{filteredDocuments.length}</span> documents
                    </span>

                    <div className="relative">
                      <button
                        onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                        style={{ border: '1px solid #e5e7eb' }}
                      >
                        <span style={{ color: '#6b7280' }}>Sort by:</span>
                        <span style={{ color: '#1f2937' }}>
                          {sortBy === 'recent' && 'Most Recent'}
                          {sortBy === 'oldest' && 'Oldest First'}
                          {sortBy === 'name-asc' && 'Name (A-Z)'}
                          {sortBy === 'name-desc' && 'Name (Z-A)'}
                          {sortBy === 'size-desc' && 'Largest Size'}
                          {sortBy === 'size-asc' && 'Smallest Size'}
                          {sortBy === 'views' && 'Most Viewed'}
                          {sortBy === 'downloads' && 'Most Downloaded'}
                        </span>
                        <ChevronDown className="w-4 h-4" style={{ color: '#6b7280' }} />
                      </button>

                      {sortDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setSortDropdownOpen(false)}
                          />
                          <div
                            className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg z-20"
                            style={{ border: '1px solid #e5e7eb' }}
                          >
                            <div className="py-1">
                              {[
                                { value: 'recent', label: 'Most Recent' },
                                { value: 'oldest', label: 'Oldest First' },
                                { value: 'name-asc', label: 'Name (A-Z)' },
                                { value: 'name-desc', label: 'Name (Z-A)' },
                                { value: 'size-desc', label: 'Largest Size' },
                                { value: 'size-asc', label: 'Smallest Size' },
                                { value: 'views', label: 'Most Viewed' },
                                { value: 'downloads', label: 'Most Downloaded' }
                              ].map(option => (
                                <button
                                  key={option.value}
                                  onClick={() => {
                                    setSortBy(option.value as any);
                                    setSortDropdownOpen(false);
                                    localStorage.setItem('documents_sort', option.value);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                                >
                                  <div
                                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ border: '2px solid #667eea' }}
                                  >
                                    {sortBy === option.value && (
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#667eea' }} />
                                    )}
                                  </div>
                                  <span style={{ color: sortBy === option.value ? '#667eea' : '#1f2937' }}>
                                    {option.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedDocs.size > 0 && (
                      <span className="text-sm font-medium" style={{ color: '#667eea' }}>
                        {selectedDocs.size} document{selectedDocs.size !== 1 ? 's' : ''} selected
                      </span>
                    )}

                    <button
                      onClick={selectAll}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ border: '1px solid #e5e7eb' }}
                    >
                      {selectedDocs.size === paginatedDocuments.length && paginatedDocuments.length > 0 ? (
                        <>
                          <CheckSquare className="w-4 h-4" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4" />
                          Select All
                        </>
                      )}
                    </button>

                    {selectedDocs.size > 0 && (
                      <>
                        <button
                          onClick={handleBulkDownload}
                          disabled={downloadProgress !== null}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: '#667eea' }}
                        >
                          <Download className="w-4 h-4" />
                          {downloadProgress ? `Downloading... ${downloadProgress.current}/${downloadProgress.total}` : 'Download'}
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-white rounded-lg hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: '#ef4444' }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filters Chips */}
              {(selectedCategories.length > 0 || selectedSources.length > 0 || selectedOwners.length > 0 || selectedFileTypes.length > 0) && (
                <div className="bg-white rounded-lg p-4 mb-4" style={{ border: '1px solid #e5e7eb' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: '#6b7280' }}>Active Filters:</span>

                    {selectedCategories.map(cat => (
                      <div
                        key={cat}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ backgroundColor: '#eff6ff', color: '#667eea' }}
                      >
                        <span>{cat}</span>
                        <button
                          onClick={() => {
                            setSelectedCategories(prev => prev.filter(c => c !== cat));
                            showToast(`Removed filter: ${cat}`, 'success');
                          }}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {selectedSources.map(source => (
                      <div
                        key={source}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ backgroundColor: '#f0fdf4', color: '#10b981' }}
                      >
                        <span>Source: {source}</span>
                        <button
                          onClick={() => {
                            setSelectedSources(prev => prev.filter(s => s !== source));
                            showToast(`Removed filter: ${source}`, 'success');
                          }}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {selectedOwners.map(owner => (
                      <div
                        key={owner}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ backgroundColor: '#fef3c7', color: '#d97706' }}
                      >
                        <span>Owner: {owner}</span>
                        <button
                          onClick={() => {
                            setSelectedOwners(prev => prev.filter(o => o !== owner));
                            showToast(`Removed filter: ${owner}`, 'success');
                          }}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {selectedFileTypes.map(type => (
                      <div
                        key={type}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{ backgroundColor: '#fce7f3', color: '#db2777' }}
                      >
                        <span>Type: {type}</span>
                        <button
                          onClick={() => {
                            setSelectedFileTypes(prev => prev.filter(t => t !== type));
                            showToast(`Removed filter: ${type}`, 'success');
                          }}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        setSelectedCategories([]);
                        setSelectedSources([]);
                        setSelectedOwners([]);
                        setSelectedFileTypes([]);
                        showToast('All filters cleared', 'success');
                      }}
                      className="ml-2 text-sm font-medium hover:opacity-70 transition-opacity"
                      style={{ color: '#667eea' }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && <LoadingSkeleton />}

              {/* Error State */}
              {error && !isLoading && (
                <div className="bg-white rounded-lg p-12 text-center" style={{ border: '1px solid #e5e7eb' }}>
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef2f2' }}>
                      <AlertCircle className="w-10 h-10" style={{ color: '#ef4444' }} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1f2937' }}>
                    Unable to load documents
                  </h3>
                  <p className="text-base mb-6" style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto 24px' }}>
                    Check your internet connection
                  </p>
                  <button
                    onClick={handleRetryLoad}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#667eea' }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Recent Documents Section - Only show on "All Documents" view with no filters */}
              {!error && !hasActiveFilters() && !contextFilter.type && (
                <div className="mb-6">
                  <RecentDocumentsSection
                    // Narrowed to the real columns the strip can show. The
                    // local Document type still carries legacy aliases — see the
                    // type-alignment note in CLAUDE.md — so this maps explicitly
                    // rather than passing the whole row.
                    recentDocuments={recentDocuments.map(d => ({
                      id: d.id ?? d.document_id,
                      name: d.name ?? d.document_name,
                      file_type: d.file_type,
                      file_size: d.file_size,
                      category: d.category,
                      created_at: d.created_at,
                      uploaded_by: d.uploaded_by,
                      file_url: d.file_url,
                    }))}
                    onViewAll={handleRecentViewAll}
                    onPreview={handleRecentPreview}
                    onDownload={handleRecentDownload}
                    isRecentFilterActive={selectedFilter === 'recent'}
                    onClearRecentFilter={handleClearRecentFilter}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Grid View */}
              {!isLoading && !error && viewMode === 'grid' && paginatedDocuments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" data-documents-grid>
                  {paginatedDocuments.map((doc, index) => {
                    /*
                     * `relatedEntity` and `activityName` came from the deleted
                     * lookup tables above. `documents` has no deal/account/
                     * activity id column to resolve, so both are null until
                     * `module` + `record_id` are resolved for real — which is
                     * the tracked FK decision, not something a card can guess.
                     */
                    const relatedEntity: string | null = null;
                    const activityName: string | null = null;
                    const isStarred = starredDocs.has(doc.document_id);

                    return (
                      <div
                        key={doc.document_id}
                        tabIndex={0}
                        data-card-index={index}
                        className="bg-white rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          width: '280px',
                          border: selectedDocs.has(doc.document_id) ? '2px solid #667eea' : '1px solid #e5e7eb',
                          backgroundColor: selectedDocs.has(doc.document_id) ? '#eff6ff' : '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => handleCardClick(e, doc.document_id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        }}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <input
                              type="checkbox"
                              checked={selectedDocs.has(doc.document_id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleCheckboxClick(doc.document_id);
                              }}
                              className="mt-1"
                              style={{ width: '18px', height: '18px', accentColor: '#667eea' }}
                            />
                            <div className="flex-1 flex justify-center">
                              {getFileIcon(doc.file_type)}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(doc.document_id);
                              }}
                              className="p-0.5"
                            >
                              <Star
                                className="w-4 h-4"
                                style={isStarred ? { fill: '#facc15', color: '#facc15' } : { color: '#d1d5db' }}
                              />
                            </button>
                          </div>

                          <h3
                            className="font-semibold mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer"
                            style={{ fontSize: '16px', color: '#1f2937', minHeight: '40px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/crm/documents/${doc.document_id}`);
                            }}
                          >
                            {doc.document_name}
                          </h3>

                          <div className="flex items-center gap-1 mb-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryFilter(doc.category);
                              }}
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(doc.category)} hover:opacity-80 transition-opacity`}
                            >
                              {doc.category}
                            </button>
                          </div>

                          {(doc.source === 'AI' || doc.source === 'Email' || doc.source === 'Calendar') && (
                            <div className="mb-3 space-y-1">
                              {doc.source === 'AI' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSourceFilter('AI');
                                  }}
                                  onMouseEnter={() => setHoveredBadge('ai-' + doc.document_id)}
                                  onMouseLeave={() => setHoveredBadge(null)}
                                  className="flex items-center gap-1 relative hover:opacity-80 transition-opacity"
                                  style={{ fontSize: '10px', color: '#a855f7' }}
                                  title="Auto-generated from meeting recording"
                                >
                                  <Zap className="w-3 h-3" />
                                  <span>AI-Generated</span>
                                </button>
                              )}
                              {doc.source === 'Email' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSourceFilter('Email');
                                  }}
                                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                                  style={{ fontSize: '10px', color: '#06b6d4' }}
                                  title="Synced from Gmail"
                                >
                                  <Mail className="w-3 h-3" />
                                  <span>From: Gmail</span>
                                </button>
                              )}
                              {doc.source === 'Calendar' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSourceFilter('Calendar');
                                  }}
                                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                                  style={{ fontSize: '10px', color: '#10b981' }}
                                  title="Synced from Calendar"
                                >
                                  <Calendar className="w-3 h-3" />
                                  <span>From: Calendar</span>
                                </button>
                              )}
                              {doc.visibility === 'Company' && !doc.deal_id && (
                                <div className="flex items-center gap-1" style={{ fontSize: '10px', color: '#667eea' }} title="Available to entire company">
                                  <Star className="w-3 h-3" />
                                  <span>Reusable Template</span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mb-2">
                            <UserCheck className="w-3 h-3" style={{ color: '#9ca3af' }} />
                            <span style={{ fontSize: '13px', color: '#6b7280' }}>{getUserLabel(doc.uploaded_by)}</span>
                          </div>

                          <div className="flex items-center gap-2 mb-3" style={{ fontSize: '13px', color: '#6b7280' }}>
                            <Calendar className="w-3 h-3" />
                            <span>{doc.last_modified_date ? formatDate(doc.last_modified_date) : '—'}</span>
                            <span>•</span>
                            <span>{formatFileSize(doc.file_size)}</span>
                          </div>

                          <div className="flex items-center gap-3 mb-3" style={{ fontSize: '13px', color: '#6b7280' }}>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{doc.view_count || 0} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Download className="w-3 h-3" />
                              <span>{doc.download_count || 0} downloads</span>
                            </div>
                          </div>

                          <div className="mb-4 pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
                            <p style={{ fontSize: '13px', color: '#6b7280' }} className="mb-2">Related to:</p>
                            {relatedEntity ? (
                              <div className="space-y-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (doc.deal_id) {
                                      navigate(`/crm/deals/${doc.deal_id}`);
                                    } else if (doc.account_id) {
                                      navigate(`/crm/accounts/${doc.account_id}`);
                                    }
                                  }}
                                  className="flex items-center gap-1 w-full hover:opacity-80 transition-opacity"
                                  style={{ fontSize: '13px', color: '#667eea' }}
                                >
                                  <Briefcase className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{relatedEntity}</span>
                                  <span className="flex-shrink-0">→</span>
                                </button>
                                {activityName && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/crm/activities/${doc.activity_id}`);
                                    }}
                                    className="flex items-center gap-1 w-full hover:opacity-80 transition-opacity"
                                    style={{ fontSize: '13px', color: '#667eea' }}
                                  >
                                    <Phone className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{activityName}</span>
                                    <span className="flex-shrink-0">→</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                                {doc.visibility === 'Company' && (
                                  <div className="flex items-center gap-1" style={{ color: '#667eea' }}>
                                    <Users className="w-3 h-3" />
                                    <span>Shared with Company</span>
                                  </div>
                                )}
                                {doc.visibility === 'Team' && doc.shared_with && doc.shared_with.length > 0 && (
                                  <div className="flex items-center gap-1" style={{ color: '#667eea' }}>
                                    <Users className="w-3 h-3" />
                                    <span>Shared with {doc.shared_with.length} people</span>
                                  </div>
                                )}
                                {!relatedEntity && doc.visibility === 'Private' && (
                                  <span>(No specific deal)</span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDocument(doc);
                              }}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              style={{ fontSize: '13px', border: '1px solid #e5e7eb', height: '32px' }}
                              title="View"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadDocument(doc);
                              }}
                              className="p-2 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              style={{ border: '1px solid #e5e7eb', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Download"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareDocument(doc);
                              }}
                              className="p-2 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              style={{ border: '1px solid #e5e7eb', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Share"
                            >
                              <Share2 className="w-3 h-3" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMoreMenuOpen(moreMenuOpen === doc.document_id ? null : doc.document_id);
                                }}
                                className="p-2 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                style={{ border: '1px solid #e5e7eb', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="More"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>

                              {moreMenuOpen === doc.document_id && (
                                <div
                                  className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg z-50"
                                  style={{ border: '1px solid #e5e7eb' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => handleEditDocument(doc)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                    style={{ color: '#1f2937' }}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                    Edit Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleToggleFavorite(doc.document_id);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                    style={{ color: '#1f2937' }}
                                  >
                                    <Star className="w-4 h-4" />
                                    {starredDocs.has(doc.document_id) ? 'Remove from Favorites' : 'Add to Favorites'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      showToast('New version upload started', 'info');
                                      setMoreMenuOpen(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                    style={{ color: '#1f2937' }}
                                  >
                                    <Upload className="w-4 h-4" />
                                    Create New Version
                                  </button>
                                  <div style={{ borderTop: '1px solid #e5e7eb' }} />
                                  <button
                                    onClick={() => handleArchiveDocument(doc.document_id)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                    style={{ color: '#6b7280' }}
                                  >
                                    <FolderOpen className="w-4 h-4" />
                                    Archive
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSingleDocument(doc)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                    style={{ color: '#ef4444' }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* List View - Same as before but with updated colors */}
              {viewMode === 'list' && paginatedDocuments.length > 0 && (
                <div className="bg-white rounded-lg overflow-hidden" style={{ border: '1px solid #e5e7eb' }} data-documents-grid>
                  <table className="w-full">
                    <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <tr>
                        <th className="w-10 px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedDocs.size === paginatedDocuments.length && paginatedDocuments.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: '#667eea' }}
                          />
                        </th>
                        <th
                          onClick={() => handleListSort('name')}
                          className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          style={{ color: '#374151' }}
                        >
                          <div className="flex items-center gap-2">
                            Name
                            {listSortColumn === 'name' && (
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${listSortDirection === 'asc' ? 'rotate-180' : ''}`}
                                style={{ color: '#667eea' }}
                              />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleListSort('category')}
                          className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          style={{ color: '#374151' }}
                        >
                          <div className="flex items-center gap-2">
                            Category
                            {listSortColumn === 'category' && (
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${listSortDirection === 'asc' ? 'rotate-180' : ''}`}
                                style={{ color: '#667eea' }}
                              />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleListSort('size')}
                          className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          style={{ color: '#374151' }}
                        >
                          <div className="flex items-center gap-2">
                            Size
                            {listSortColumn === 'size' && (
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${listSortDirection === 'asc' ? 'rotate-180' : ''}`}
                                style={{ color: '#667eea' }}
                              />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleListSort('owner')}
                          className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          style={{ color: '#374151' }}
                        >
                          <div className="flex items-center gap-2">
                            Owner
                            {listSortColumn === 'owner' && (
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${listSortDirection === 'asc' ? 'rotate-180' : ''}`}
                                style={{ color: '#667eea' }}
                              />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleListSort('uploaded')}
                          className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          style={{ color: '#374151' }}
                        >
                          <div className="flex items-center gap-2">
                            Uploaded
                            {listSortColumn === 'uploaded' && (
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${listSortDirection === 'asc' ? 'rotate-180' : ''}`}
                                style={{ color: '#667eea' }}
                              />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody style={{ backgroundColor: '#ffffff' }}>
                      {paginatedDocuments.map(doc => {
                        return (
                          <tr
                            key={doc.document_id}
                            onClick={() => handleDocumentClick(doc.document_id)}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            style={{
                              backgroundColor: selectedDocs.has(doc.document_id) ? '#eff6ff' : '',
                              borderBottom: '1px solid #e5e7eb'
                            }}
                          >
                            <td
                              className="px-4 py-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={selectedDocs.has(doc.document_id)}
                                onChange={() => handleSelectDoc(doc.document_id)}
                                style={{ width: '16px', height: '16px', accentColor: '#667eea' }}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  {getFileIconSmall(doc.file_type)}
                                </div>
                                <span className="text-sm font-medium truncate" style={{ color: '#1f2937' }}>
                                  {doc.document_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(doc.category)}`}>
                                {doc.category}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm" style={{ color: '#1f2937' }}>
                                {formatFileSize(doc.file_size)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm" style={{ color: '#6b7280' }}>
                                {getUserLabel(doc.uploaded_by).split(' ')[0]} {getUserLabel(doc.uploaded_by).split(' ')[1]?.[0]}.
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm" style={{ color: '#6b7280' }}>
                                {doc.uploaded_date ? formatDate(doc.uploaded_date) : '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && paginatedDocuments.length === 0 && (
                <div className="bg-white rounded-lg p-12 text-center" style={{ border: '1px solid #e5e7eb' }}>
                  {contextFilter.type && contextFilter.id ? (
                    // Context-aware Empty State
                    <>
                      <div className="flex items-center justify-center mb-6">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
                          <FileText className="w-10 h-10" style={{ color: '#3b82f6' }} />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-3" style={{ color: '#1f2937' }}>
                        No documents found
                      </h3>
                      <p className="text-base mb-6" style={{ color: '#6b7280', maxWidth: '500px', margin: '0 auto 24px' }}>
                        {contextFilter.type === 'deal' && `No documents attached to this deal yet.`}
                        {contextFilter.type === 'account' && `No documents attached to this account yet.`}
                        {contextFilter.type === 'contact' && `No documents attached to this contact yet.`}
                        {contextFilter.type === 'activity' && `No documents attached to this activity yet.`}
                        {contextFilter.type === 'category' && `No documents in this category yet.`}
                        {contextFilter.type === 'source' && `No documents from this source yet.`}
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => setUploadModalOpen(true)}
                          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: '#3b82f6' }}
                        >
                          <Plus className="w-4 h-4" />
                          Upload Document
                        </button>
                        <button
                          onClick={handleClearContextFilter}
                          className="px-6 py-3 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          style={{ border: '2px solid #3b82f6', color: '#3b82f6' }}
                        >
                          Clear Filter
                        </button>
                      </div>
                    </>
                  ) : hasActiveFilters() ? (
                    // Filtered Empty State
                    <>
                      <div className="flex items-center justify-center mb-6">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                          <FileText className="w-10 h-10" style={{ color: '#9ca3af' }} />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-3" style={{ color: '#1f2937' }}>
                        No documents found
                      </h3>
                      <p className="text-base mb-6" style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto 24px' }}>
                        Try adjusting your filters or search terms
                      </p>
                      <button
                        onClick={handleClearAllFilters}
                        className="px-6 py-3 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        style={{ border: '2px solid #667eea', color: '#667eea' }}
                      >
                        Clear All Filters
                      </button>
                    </>
                  ) : (
                    // First Time Empty State
                    <>
                      <div className="flex items-center justify-center mb-6">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#eef2ff' }}>
                          <FileText className="w-10 h-10" style={{ color: '#667eea' }} />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-3" style={{ color: '#1f2937' }}>
                        No documents yet
                      </h3>
                      <p className="text-base mb-6" style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto 24px' }}>
                        Upload your first document to get started
                      </p>
                      <button
                        onClick={() => setUploadModalOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#667eea' }}
                      >
                        <Plus className="w-4 h-4" />
                        Upload Document
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-4" style={{ borderTop: '1px solid #e5e7eb' }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-sm" style={{ color: '#6b7280' }}>
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredDocuments.length)} of{' '}
                  {filteredDocuments.length} documents
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ border: '1px solid #e5e7eb' }}
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 rounded-lg text-sm transition-colors"
                          style={
                            currentPage === pageNum
                              ? { backgroundColor: '#667eea', color: 'white' }
                              : { border: '1px solid #e5e7eb', color: '#374151' }
                          }
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ border: '1px solid #e5e7eb' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drag and Drop Overlay */}
      <DragDropOverlay
        isVisible={isDragOverPage}
        isDraggingOver={isDraggingOverTarget}
        fileCount={dragFileCount}
      />

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={uploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setPreloadedFiles([]);
        }}
        onUpload={handleUpload}
        preloadedFiles={preloadedFiles}
        contextDeal={contextFilter.type === 'deal' && contextFilter.id ? { id: contextFilter.id, name: contextFilter.name || 'Deal' } : null}
        contextAccount={contextFilter.type === 'account' && contextFilter.id ? { id: contextFilter.id, name: contextFilter.name || 'Account' } : null}
        contextContact={contextFilter.type === 'contact' && contextFilter.id ? { id: contextFilter.id, name: contextFilter.name || 'Contact' } : null}
        contextActivity={contextFilter.type === 'activity' && contextFilter.id ? { id: contextFilter.id, name: contextFilter.name || 'Activity' } : null}
      />

      {/* Share Document Modal */}
      {shareModalOpen && shareDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="text-lg font-semibold" style={{ color: '#1f2937' }}>
                Share Document
              </h3>
              <button
                onClick={() => {
                  setShareModalOpen(false);
                  setShareDocument(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto" style={{ flex: '1 1 auto' }}>
              <p className="text-sm mb-4 font-medium" style={{ color: '#1f2937' }}>
                {shareDocument.document_name}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#1f2937' }}>
                  Share with:
                </label>
                <input aria-label="Share with:"
                  type="text"
                  placeholder="Search team members..."
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid #e5e7eb' }}
                />
              </div>

              {/*
                REAL WORKSPACE MEMBERS, from the same fetch DocumentDetailPage
                uses. This was a hardcoded array of three strings —
                'Sarah Chen (Sales Team)', 'Mike Johnson (Manager)',
                'Emily Davis (Sales Rep)' — with the first TWO PRE-CHECKED, so
                the modal opened already proposing to share with two specific
                colleagues.
                The roles were wrong as well as hardcoded: all three of those
                people are `sales` on the server; none is a Manager. And
                DocumentDetailPage carried a DIFFERENT invented list, so the
                same product named two different teams on adjacent screens.
                Nothing is pre-checked now: a default recipient is a decision,
                not a convenience.
              */}
              <div className="mb-4 space-y-2">
                {membersLoading && (
                  <p className="text-sm text-gray-500">Loading workspace members…</p>
                )}
                {membersError && (
                  <p role="alert" className="text-sm text-red-600">{membersError}</p>
                )}
                {!membersLoading && !membersError && shareTargets.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No other members in this workspace. Invite colleagues from
                    Settings → Team to share documents with them.
                  </p>
                )}
                {shareTargets.map((member) => (
                  <label
                    key={member.user_id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={shareRecipients.has(member.user_id)}
                      onChange={() => toggleShareRecipient(member.user_id)}
                      className="w-4 h-4"
                      style={{ accentColor: '#667eea' }}
                    />
                    <span className="text-sm" style={{ color: '#1f2937' }}>
                      {member.user_name}
                      <span className="text-gray-500"> — {member.user_role}</span>
                    </span>
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-2 mb-4 p-2 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  style={{ accentColor: '#667eea' }}
                />
                <span className="text-sm" style={{ color: '#1f2937' }}>Send email notification</span>
              </label>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#1f2937' }}>
                  Copy link:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://bmi.com/docs/${shareDocument.document_id}`}
                    className="flex-1 px-3 py-2 rounded-lg text-sm bg-gray-50"
                    style={{ border: '1px solid #e5e7eb', color: '#6b7280' }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://bmi.com/docs/${shareDocument.document_id}`);
                      showToast('Link copied to clipboard', 'success');
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ border: '1px solid #e5e7eb', color: '#1f2937' }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t" style={{ borderColor: '#e5e7eb' }}>
              <button
                onClick={() => {
                  setShareModalOpen(false);
                  setShareDocument(null);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #e5e7eb', color: '#1f2937' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast('Document shared with 2 people', 'success');
                  setShareModalOpen(false);
                  setShareDocument(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#667eea' }}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {editModalOpen && editDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="text-lg font-semibold" style={{ color: '#1f2937' }}>
                Edit Document Details
              </h3>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditDocument(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4" style={{ flex: '1 1 auto' }}>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1f2937' }}>
                  Document Name
                </label>
                <input aria-label="Document Name"
                  type="text"
                  defaultValue={editDocument.document_name}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid #e5e7eb' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1f2937' }}>
                  Category
                </label>
                <select aria-label="Category"
                  defaultValue={editDocument.category}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid #e5e7eb' }}
                >
                  <option value="Proposal">Proposal</option>
                  <option value="Contract">Contract</option>
                  <option value="Presentation">Presentation</option>
                  <option value="Agreement">Agreement</option>
                  <option value="Report">Report</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1f2937' }}>
                  Description
                </label>
                <textarea aria-label="Description"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ border: '1px solid #e5e7eb' }}
                  placeholder="Add a description..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t" style={{ borderColor: '#e5e7eb' }}>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditDocument(null);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #e5e7eb', color: '#1f2937' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast('Document details updated', 'success');
                  setEditModalOpen(false);
                  setEditDocument(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#667eea' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="text-lg font-semibold" style={{ color: '#1f2937' }}>
                Delete Documents?
              </h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto" style={{ flex: '1 1 auto' }}>
              <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                Are you sure you want to delete {selectedDocs.size} document{selectedDocs.size !== 1 ? 's' : ''}? This action cannot be undone.
              </p>

              <div className="mt-4">
                <p className="text-sm font-medium mb-2" style={{ color: '#1f2937' }}>
                  Documents to delete:
                </p>
                <div className="bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                  {getSelectedDocuments().slice(0, 5).map(doc => (
                    <div key={doc.document_id} className="flex items-start gap-2 mb-2 last:mb-0">
                      <span style={{ color: '#667eea', marginTop: '2px' }}>•</span>
                      <span className="text-sm" style={{ color: '#1f2937' }}>{doc.document_name}</span>
                    </div>
                  ))}
                  {selectedDocs.size > 5 && (
                    <div className="flex items-start gap-2 mt-2 pt-2" style={{ borderTop: '1px solid #e5e7eb' }}>
                      <span style={{ color: '#667eea' }}>•</span>
                      <span className="text-sm font-medium" style={{ color: '#667eea' }}>
                        ... ({selectedDocs.size - 5} more)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t" style={{ borderColor: '#e5e7eb' }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #e5e7eb', color: '#1f2937' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#ef4444' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        document={previewDocument}
        isOpen={previewModalOpen}
        onClose={handleClosePreviewModal}
        onDownload={handlePreviewDownload}
        onViewDetails={handlePreviewViewDetails}
      />
    </div>
  );
};

export default DocumentsLibrary;
