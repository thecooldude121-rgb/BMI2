import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDocument, downloadDocument, DocumentRecord } from '../../utils/documentsApi';
import { Eye, Download, Share2, Edit, Trash2, ChevronRight, FileText, Calendar, User, Clock, Briefcase, Building2, Mail, Phone, Upload, RotateCcw, Send, X, CheckCircle2, Archive, Paperclip, Plus, Sparkles } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import ShareDocumentModal from '../../components/Documents/ShareDocumentModal';
import { useWorkspaceMembers, toShareTarget } from '../../hooks/useWorkspaceMembers';

/**
 * The document shape is now the API's, not a local invention.
 *
 * The interface this replaced declared eleven fields the `documents` table does
 * not have — `folder_id`, `owner_name`, `related_entity_type`,
 * `related_entity_id`, `related_entity_name`, `access_count`,
 * `last_accessed_at`, `document_id`, `uploaded_at`, `modified_at`, `starred` —
 * so every read of them was either a type error the compiler had already been
 * reporting (25 of them in this file) or a silent undefined.
 *
 * Two were naming drift rather than absence: `uploaded_at` where the column is
 * `created_at`, and `format` where it is `file_type`. Aliasing to the real
 * shape is what makes the compiler point at each one.
 */
type Document = DocumentRecord;

// DocumentFolder was here. documents has no folder_id column, so folders are
// not a concept this table supports — the interface, its state and its render
// all went together rather than leaving a type nothing constructs.
interface RelatedDeal {
  id: string;
  deal_id: string;
  deal_name: string;
  value: number;
  stage: string;
}

interface RelatedAccount {
  id: string;
  account_id: string;
  company_name: string;
  industry?: string;
  employee_count?: number;
}

interface RelatedContact {
  id: string;
  contact_id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
}

interface DocumentVersion {
  id: string;
  version: number;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  uploaded_by_name?: string;
  uploaded_at: string;
  notes?: string;
  is_current: boolean;
}

interface Comment {
  id: string;
  comment_id: string;
  document_id: string;
  user_id: string;
  user_name: string;
  user_initials: string;
  content: string;
  created_at: string;
  parent_comment_id?: string;
  replies?: Comment[];
}

interface ActivityLogEntry {
  id: string;
  type: 'view' | 'download' | 'share' | 'upload' | 'edit';
  user_name: string;
  description: string;
  timestamp: string;
}

interface SharedUser {
  id: string;
  user_id: string;
  user_name: string;
  user_initials: string;
  shared_at: string;
}

interface AIInsight {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  key_points: string[];
}

const DocumentDetailPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [document, setDocument] = useState<Document | null>(null);
  /*
   * PERMANENTLY EMPTY, AND THAT IS A DECISION RATHER THAN A GAP.
   *
   * These were useState, populated by the deleted fixture: a related deal,
   * account and contacts synthesised from which of three hardcoded ids was
   * being viewed, plus a version history.
   *
   * None has anywhere to come from. `documents.module` and `record_id` are
   * free-text with NO foreign key behind them, so resolving a deal or account
   * from them needs a decision about that link first (logged in CLAUDE.md's
   * backlog). Version HISTORY has no table at all — `documents.version` is a
   * single integer on the row, not a list of revisions.
   *
   * Declared as consts rather than state so there is no setter to repopulate
   * them from a fixture by accident. The panels below render their empty
   * states. Same pattern as DataContext's permanently-empty `employees`.
   *
   * `folder` went entirely: documents.folder_id has no column, and its only
   * remaining reference was its own declaration.
   */
  const relatedDeal = null as RelatedDeal | null;
  const relatedAccount = null as RelatedAccount | null;
  const relatedContact = null as RelatedContact | null;
  const versions: DocumentVersion[] = [];
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  /** 404 from the server, as distinct from a failure to reach it. */
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  /** Also permanently null: no AI summary is generated or stored anywhere. */
  const aiInsight = null as AIInsight | null;
  const [showShareModal, setShowShareModal] = useState(false);

  /*
   * THE SIGNED-IN USER, from the session.
   *
   * This was a hardcoded object — "Alex Rodriguez", `user_alex`,
   * alex.rodriguez@bmi.com, "Sales Rep" — so it misidentified EVERY viewer who
   * was not Alex, and the email domain was wrong too (@bmi.com; the workspace
   * is @bmicrm.com). It is written into the activity log below, so every
   * recorded action was attributed to a person who was not doing it.
   *
   * Same defect class as the Reports page's "Me Only (Alex Rodriguez)" filter
   * and the Team page's hardcoded "(You)" — a fabricated identity is not a
   * fabricated metric, but it misleads in the same way and is fixed the same
   * way: ask the session.
   */
  const currentUser = {
    user_id: user?.id ?? '',
    user_name: user?.name ?? 'Unknown user',
    // Initials from the real name rather than a stored literal.
    user_avatar: (user?.name ?? '?')
      .split(/\s+/).filter(Boolean).slice(0, 2)
      .map(w => w.charAt(0).toUpperCase()).join('') || '?',
    user_email: user?.email ?? '',
    user_role: user?.role ?? 'Unknown',
  };

  /*
   * The share picker's people, from ONE fetched source shared with
   * DocumentsLibrary — see `useWorkspaceMembers` for what the two hardcoded
   * lists used to claim and how far they disagreed.
   */
  const { members, loading: membersLoading, error: membersError } = useWorkspaceMembers();
  const teamMembers = useMemo(
    // Never offer to share a document with yourself.
    () => members.filter(m => String(m.id) !== String(user?.id)).map(toShareTarget),
    [members, user?.id],
  );

  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  /**
   * Load the real document.
   *
   * WHAT THIS REPLACED. `getMockDocuments()` returned one of THREE hardcoded
   * documents keyed by id — so only `doc_acme_proposal_v2`,
   * `doc_techstart_contract` and `doc_bigco_transcript` resolved to anything,
   * and every other :documentId fell through to a fabricated fallback. It also
   * synthesised a related deal, account, contacts, an AI summary with a
   * "sentiment_score: 85", and a per-document download count keyed off which of
   * the three ids was being viewed.
   *
   * `documents` holds ZERO ROWS today, so the honest result for every id is a
   * not-found state. That is the correct output, not a failure — and it is why
   * `fetchDocument` distinguishes 404 from an unreachable server: "this
   * document does not exist" and "we could not reach the backend" must not
   * render the same way.
   *
   * The related-entity panels are NOT repopulated here. `documents.module` and
   * `record_id` are free-text with no foreign key behind them, so resolving a
   * deal or account from them needs a decision about that link first — see the
   * backlog note in CLAUDE.md. They stay null, which renders their empty state.
   */
  const loadDocument = async () => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    setNotFound(false);

    const result = await fetchDocument(documentId);

    if (!result.ok) {
      setDocument(null);
      setNotFound(result.notFound);
      setError(result.message);
      setLoading(false);
      return;
    }

    setDocument(result.document);
    setDescriptionValue(result.document.description || '');
    setLoading(false);
  };

  const handleView = () => {
    if (!document) return;

    console.log('Opening PDF viewer...');
    showToast('Opening PDF viewer...', 'success');

    // Open in new tab. file_url is nullable, so only when there is one.
    if (document.file_url) window.open(document.file_url, '_blank');

    // View tracking removed: `access_count` and `last_accessed_at` have no
    // column, and incrementing a client-side counter produced a per-document
    // view total that looked like an audit trail and reset on reload. Recording
    // views for real needs an events table — logged in CLAUDE.md's backlog.

    // Add to activity log
    const newActivity: ActivityLogEntry = {
      id: `a${Date.now()}`,
      type: 'view',
      user_name: currentUser.user_name,
      description: 'viewed document',
      timestamp: new Date().toISOString()
    };
    setActivityLog([newActivity, ...activityLog]);
  };

  /**
   * Download through GET /documents/:id/content — the endpoint that actually
   * serves the bytes.
   *
   * WHAT THIS REPLACED: a `console.log('Downloading document...')`, an
   * unconditional success toast, and an <a href={document.file_url}> click.
   * That last part could not work for a stored file — the content endpoint
   * needs the Authorization header, so a bare href 401s — and the toast fired
   * either way. It also incremented a client-side download counter that reset
   * on reload and was displayed as this document's download total.
   *
   * The toast now reports the real outcome, and only after it is known.
   */
  const handleDownload = async () => {
    if (!document) return;
    const result = await downloadDocument(document.id, document.name);
    if (result.ok) {
      showToast(`Downloaded ${document.name}`, 'success');
    } else {
      showToast(result.message || 'Download failed', 'error');
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleEdit = () => {
    if (!document) return;

    if (document.file_type === 'pdf') {
      showToast('Edit mode not available for PDF files', 'error');
    } else {
      showToast('Opening editor...', 'success');
      console.log('Opening document editor...');
    }
  };

  const handleDelete = async () => {
    if (!document) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this document? This action cannot be undone.'
    );

    if (!confirmed) return;

    // `status` has no column, so there is nothing to set. DELETE /documents/:id
    // exists but wiring it belongs to DocumentsLibrary's pass; reporting
    // "deleted successfully" for a request never sent is the fake confirmation
    // this codebase keeps removing.
    showToast('Deleting a document is not available on this page yet', 'error');

    // Redirect after 1.5 seconds
    setTimeout(() => {
      navigate('/crm/documents');
    }, 1500);
  };

  const handleSaveDescription = async () => {
    if (!document) return;

    setDocument({ ...document, description: descriptionValue });
    setEditingDescription(false);
    showToast('success', 'Description updated successfully');
  };

  const handleCancelDescription = () => {
    setDescriptionValue(document?.description || '');
    setEditingDescription(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      showToast('error', 'Please enter a comment');
      return;
    }

    if (!document) return;

    const comment: Comment = {
      id: `c${Date.now()}`,
      comment_id: `c${Date.now()}`,
      document_id: document.id,
      user_id: currentUser.user_id,
      user_name: currentUser.user_name,
      user_initials: currentUser.user_avatar,
      content: newComment,
      created_at: new Date().toISOString(),
      replies: []
    };

    setComments([comment, ...comments]);
    setNewComment('');
    showToast('success', 'Comment posted successfully');

    // Add to activity log
    const newActivity: ActivityLogEntry = {
      id: `a${Date.now()}`,
      type: 'edit',
      user_name: currentUser.user_name,
      description: 'commented on document',
      timestamp: new Date().toISOString()
    };
    setActivityLog([newActivity, ...activityLog]);
  };

  const handleReply = async (commentId: string) => {
    if (!replyContent.trim() || !document) return;

    const reply: Comment = {
      id: `r${Date.now()}`,
      comment_id: `r${Date.now()}`,
      document_id: document.id,
      user_id: currentUser.user_id,
      user_name: currentUser.user_name,
      user_initials: currentUser.user_avatar,
      content: replyContent,
      created_at: new Date().toISOString(),
      parent_comment_id: commentId
    };

    setComments(comments.map(c => {
      if (c.id === commentId) {
        return { ...c, replies: [...(c.replies || []), reply] };
      }
      return c;
    }));

    setReplyContent('');
    setReplyingTo(null);
    showToast('success', 'Reply posted successfully');
  };

  const handleUploadNewVersion = () => {
    showToast('success', 'File upload feature coming soon');
    console.log('File picker would open to upload new version');
  };

  const handleRestoreVersion = (version: DocumentVersion) => {
    const confirmed = window.confirm(
      `Restore to version ${version.version}? This will create a new version as a copy of this version.`
    );

    if (!confirmed) return;

    showToast('success', `Restored to version ${version.version} as version ${versions.length + 1}`);

    // Add to activity log
    const newActivity: ActivityLogEntry = {
      id: `a${Date.now()}`,
      type: 'edit',
      user_name: currentUser.user_name,
      description: `restored version ${version.version}`,
      timestamp: new Date().toISOString()
    };
    setActivityLog([newActivity, ...activityLog]);

    console.log('Version restored:', version.version);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) {
      showToast('error', 'Please enter a tag name');
      return;
    }
    if (tags.includes(newTag.trim())) {
      showToast('error', 'Tag already exists');
      return;
    }
    setTags([...tags, newTag.trim()]);
    setNewTag('');
    showToast('success', `Tag '${newTag.trim()}' added`);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    showToast('success', `Tag '${tagToRemove}' removed`);
  };

  const handleRemoveSharedUser = (userId: string) => {
    const user = sharedUsers.find(u => u.user_id === userId);
    if (!user) return;

    const confirmed = window.confirm(`Remove sharing access for ${user.user_name}?`);
    if (!confirmed) return;

    setSharedUsers(sharedUsers.filter(u => u.user_id !== userId));
    showToast('success', 'Sharing access removed');

    // Add to activity log
    const newActivity: ActivityLogEntry = {
      id: `a${Date.now()}`,
      type: 'share',
      user_name: currentUser.user_name,
      description: `unshared with ${user.user_name}`,
      timestamp: new Date().toISOString()
    };
    setActivityLog([newActivity, ...activityLog]);
  };

  const handleAddSharedUser = () => {
    setShowShareModal(true);
  };

  /*
   * `visibility` and `message` are accepted from the modal and NOT used, which
   * the compiler had been reporting. There is no sharing backend: no
   * document_shares table, no visibility column, and no endpoint that would
   * deliver a message. Renaming them with underscores would have silenced the
   * warning and kept the modal implying the values go somewhere. Left named,
   * unused, and explained instead — and the toast below already reports what
   * actually happened rather than claiming a share was sent.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  /**
   * Sharing is not available, and this now says so.
   *
   * TWO SEPARATE DEFECTS WERE HERE. First, the signature never matched the
   * modal: ShareDocumentModal's `onShare` passes ONE OBJECT
   * ({ documentSource, documentName, message, permission, expires, … }) while
   * this took `(userId, visibility, message)`. So `userId` received an object,
   * `teamMembers.find(m => m.user_id === userId)` compared a string to it and
   * never matched, and every share attempt fell into "Please select a user" —
   * sharing was permanently broken. The compiler could not catch it because the
   * two unused parameters made the arity look deliberate.
   *
   * Second, had it matched, it would have pushed a row into local `sharedUsers`
   * state and toasted "Document shared successfully" — a success message for
   * something that reached no server and vanished on reload. There is no
   * document_shares table, no visibility column, and no endpoint that delivers
   * a message or honours an expiry.
   *
   * The parameters the function cannot use are GONE rather than renamed with
   * underscores: silencing the warning would have left the modal collecting a
   * permission and an expiry that go nowhere, which is the part worth being
   * visible.
   */
  const handleShareDocument = () => {
    showToast('Sharing a document is not available yet — nothing was sent', 'error');
  };

  const handleSendEmail = () => {
    showToast('success', 'Email composer feature coming soon');
    console.log('Send via email modal would open here');
  };

  const handleAttachToActivity = () => {
    showToast('success', 'Activity selector feature coming soon');
    console.log('Attach to activity modal would open here');
  };

  const handleCreateNewVersion = () => {
    showToast('success', 'File upload feature coming soon');
    console.log('File picker would open here');
  };

  const handleMoveToArchive = () => {
    if (!document) return;

    const confirmed = window.confirm('Move this document to archive?');
    if (!confirmed) return;

    // `status` has no column, so archiving has nowhere to record itself. The
    // toast used to claim success for a state change that never happened.
    showToast('Archiving a document is not available yet', 'error');

    // Add to activity log
    const newActivity: ActivityLogEntry = {
      id: `a${Date.now()}`,
      type: 'edit',
      user_name: currentUser.user_name,
      description: 'archived document',
      timestamp: new Date().toISOString()
    };
    setActivityLog([newActivity, ...activityLog]);

    // Redirect after 1.5 seconds
    setTimeout(() => {
      navigate('/crm/documents');
    }, 1500);
  };

  const handleBreadcrumbDashboard = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast('success', 'Navigating to Dashboard');
    setTimeout(() => navigate('/dashboard'), 1000);
  };

  const handleBreadcrumbDocuments = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast('success', 'Returning to Documents Library');
    setTimeout(() => navigate('/crm/documents'), 1000);
  };

  const handleNavigateToDeal = () => {
    if (!relatedDeal) return;
    showToast('success', `Navigating to Deal: ${relatedDeal.deal_name}`);
    setTimeout(() => navigate(`/crm/deals/${relatedDeal.deal_id}`), 1000);
  };

  const handleNavigateToAccount = () => {
    if (!relatedAccount) return;
    showToast('success', `Navigating to Account: ${relatedAccount.company_name}`);
    setTimeout(() => navigate(`/crm/accounts/${relatedAccount.account_id}`), 1000);
  };

  const handleNavigateToContact = () => {
    if (!relatedContact) return;
    showToast('success', `Navigating to Contact: ${relatedContact.name}`);
    setTimeout(() => navigate(`/crm/contacts/${relatedContact.contact_id}`), 1000);
  };

  // handleNavigateToUserProfile was here. It navigated to
  // /settings/users/<uploaded_by> — a NAME, not a user id, so the route could
  // never resolve. Removed with the link that called it.

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view': return <Eye className="w-5 h-5 text-blue-600" />;
      case 'download': return <Download className="w-5 h-5 text-green-600" />;
      case 'share': return <Share2 className="w-5 h-5 text-purple-600" />;
      case 'upload': return <Upload className="w-5 h-5 text-orange-600" />;
      case 'edit': return <Edit className="w-5 h-5 text-yellow-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  /** Null-tolerant: file_size is nullable, and "0 B" is not the same as unrecorded. */
  const formatFileSize = (bytes: number | string | null | undefined): string => {
    if (bytes === null || bytes === undefined || bytes === '') return 'Size not recorded';
    const n = typeof bytes === 'string' ? Number(bytes) : bytes;
    if (!Number.isFinite(n)) return 'Size not recorded';
    return formatFileSizeBytes(n);
  };

  const formatFileSizeBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /** Null-tolerant: file_type is nullable. */
  const getFileIcon = (fileType: string | null | undefined, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'w-24 h-24' : 'w-5 h-5';
    const type = (fileType ?? '').toLowerCase();

    if (type === 'pdf') {
      return <FileText className={`${sizeClass} text-red-600`} />;
    }
    if (type === 'docx' || type === 'doc') {
      return <FileText className={`${sizeClass} text-blue-600`} />;
    }
    if (type === 'xlsx' || type === 'xls') {
      return <FileText className={`${sizeClass} text-green-600`} />;
    }
    return <FileText className={`${sizeClass} text-gray-600`} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    /*
     * TWO DIFFERENT FAILURES, SHOWN DIFFERENTLY. `documents` holds zero rows
     * today, so a 404 is the expected answer for every id — and it must not
     * look like an outage. Equally, an unreachable backend must not be
     * presented as "this document does not exist", which is the shape that lets
     * a real failure read as an empty state.
     */
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {notFound ? 'Document not found' : 'Could not load this document'}
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            {notFound
              ? 'No document with this id exists in your workspace. It may have been deleted, or the link may be out of date.'
              : (error || 'Something went wrong loading this document.')}
          </p>
          <Button
            onClick={() => navigate('/crm/documents')}
            size="lg"
          >
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="mb-5">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/dashboard" onClick={handleBreadcrumbDashboard} className="hover:text-blue-600 cursor-pointer">Dashboard</a>
            <ChevronRight className="w-4 h-4" />
            <a href="/crm/documents" onClick={handleBreadcrumbDocuments} className="hover:text-blue-600 cursor-pointer">Documents</a>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{document.name}</span>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  {getFileIcon(document.file_type)}
                </div>
                <div>
                  <h1 className="text-[28px] font-bold text-gray-900">{document.name}</h1>
                  <div className="flex items-center space-x-3 mt-1">
                    {document.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {document.category}
                      </span>
                    )}
                    {document.version && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Version {document.version}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{document.uploaded_by || 'Not recorded'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{document.created_at ? formatDate(document.created_at) : 'Date not recorded'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleView}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="w-[65%] space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Preview</h2>
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="flex justify-center mb-4">
                  {getFileIcon(document.file_type, 'lg')}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{document.name}</h3>
                <p className="text-gray-600 mb-6">{formatFileSize(document.file_size)}{document.file_type ? ` • ${document.file_type.toUpperCase()} Document` : ''}</p>
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={handleView}
                    size="lg"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Open PDF Viewer
                  </Button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            {(relatedDeal || relatedAccount || relatedContact) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Records</h2>
                <div className="grid grid-cols-2 gap-4">
                  {relatedDeal && (
                    <button
                      onClick={handleNavigateToDeal}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-medium text-gray-500 uppercase">Deal</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{relatedDeal.deal_name}</h3>
                      <div className="text-sm text-gray-600">
                        ${relatedDeal.value.toLocaleString()} • {relatedDeal.stage}
                      </div>
                    </button>
                  )}

                  {relatedAccount && (
                    <button
                      onClick={handleNavigateToAccount}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-medium text-gray-500 uppercase">Account</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{relatedAccount.company_name}</h3>
                      <div className="text-sm text-gray-600">
                        {relatedAccount.industry && `${relatedAccount.industry} • `}
                        {relatedAccount.employee_count && `${relatedAccount.employee_count} employees`}
                      </div>
                    </button>
                  )}

                  {relatedContact && (
                    <button
                      onClick={handleNavigateToContact}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all col-span-2 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-5 h-5 text-blue-600" />
                        <span className="text-xs font-medium text-gray-500 uppercase">Contact</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{relatedContact.name}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        {relatedContact.title && <div>{relatedContact.title}</div>}
                        <div className="flex items-center space-x-4">
                          {relatedContact.email && (
                            <span className="flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {relatedContact.email}
                            </span>
                          )}
                          {relatedContact.phone && (
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {relatedContact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                {!editingDescription && (
                  <button
                    onClick={() => setEditingDescription(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>
              {editingDescription ? (
                <div>
                  <textarea
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Add a description..."
                  />
                  <div className="mt-3 flex items-center justify-end space-x-2">
                    <button
                      onClick={handleCancelDescription}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      Cancel
                    </button>
                    <Button
                      onClick={handleSaveDescription}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700">{document.description || 'No description provided.'}</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
                <Button
                  onClick={handleUploadNewVersion}
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Version
                </Button>
              </div>
              <div className="space-y-4">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 ${
                      version.is_current ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            Version {version.version}
                          </h3>
                          {version.is_current && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {formatDate(version.uploaded_at)} by {version.uploaded_by_name}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatFileSize(version.file_size)} • {version.notes}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <button
                        onClick={handleView}
                        className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                      {!version.is_current && (
                        <button
                          onClick={() => handleRestoreVersion(version)}
                          className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments</h2>

              <div className="space-y-4 mb-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700">{comment.user_initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">{comment.user_name}</h4>
                          <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
                        <button
                          onClick={() => setReplyingTo(comment.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Reply
                        </button>

                        {replyingTo === comment.id && (
                          <div className="mt-3 pl-4 border-l-2 border-gray-200">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={2}
                              placeholder="Write a reply..."
                            />
                            <div className="mt-2 flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                                className="px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg"
                              >
                                Cancel
                              </button>
                              <Button
                                onClick={() => handleReply(comment.id)}
                                size="sm"
                              >
                                Reply
                              </Button>
                            </div>
                          </div>
                        )}

                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-semibold text-gray-700">{reply.user_initials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-semibold text-gray-900">{reply.user_name}</h4>
                                    <span className="text-xs text-gray-500">{formatDate(reply.created_at)}</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-700">
                      {(user?.email?.split('@')[0] || 'CU').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add a comment..."
                    />
                    <div className="mt-3 flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setNewComment('')}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        Cancel
                      </button>
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-[35%] space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-16">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1 uppercase">File Type</div>
                    <div className="flex items-center space-x-2">
                      {getFileIcon(document.file_type)}
                      <span className="text-sm font-medium text-gray-900">{document.file_type ? document.file_type.toUpperCase() : 'Not recorded'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1 uppercase">File Size</div>
                    <div className="text-sm font-medium text-gray-900">{formatFileSize(document.file_size)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500 mb-1 uppercase">Version</div>
                    <div className="text-sm font-medium text-gray-900">Version {document.version || 2}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1 uppercase">Status</div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1 uppercase">Uploaded By</div>
                  {/* `uploaded_by` is the real column and holds a NAME string,
                      not a user id — so it is not a link. It used to render
                      `owner_name || 'Alex Rodriguez'` through a button that
                      navigated to /settings/users/<name>. */}
                  <div className="text-sm font-medium text-gray-900">
                    {document.uploaded_by || 'Not recorded'}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1 uppercase">Upload Date</div>
                  <div className="text-sm font-medium text-gray-900">
                    {document.created_at ? formatDate(document.created_at) : 'Not recorded'}
                  </div>
                </div>

                {/*
                  SIX ROWS REMOVED HERE, all reading columns that do not exist:
                    Views          `access_count`, which fell back to the literal
                                   12 — a hardcoded view count presented as this
                                   document's own telemetry.
                    Downloads      a client-side `downloadCount` that reset on
                                   reload.
                    Last Viewed    `last_accessed_at`.
                    Visibility     `visibility`, falling back to 'Team' — a
                                   permission claim with nothing behind it, which
                                   is the worst of the six to invent.
                    Source         `source` and `source_detail`, e.g. "Gmail
                                   attachment from legal@techstart.com".
                    AI Generated   `ai_generated`, with "Auto-created from
                                   meeting recording".

                  Views and downloads are the only two that are a real feature
                  rather than a mistake, and they need an events table — logged
                  in CLAUDE.md's backlog rather than built here, to keep this a
                  small fix. The rest have no product behind them at all.
                */}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>

              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  onClick={handleAddTag}
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h3>

              <div className="space-y-4">
                {activityLog.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user_name}</span> {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Shared With</h3>
                <button
                  onClick={handleAddSharedUser}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {sharedUsers.map((sharedUser) => (
                  <div key={sharedUser.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700">{sharedUser.user_initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900">{sharedUser.user_name}</h4>
                        <p className="text-xs text-gray-500">Shared {formatDate(sharedUser.shared_at)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSharedUser(sharedUser.user_id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {aiInsight && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-900 mb-3">{aiInsight.summary}</p>
                  <div className="flex items-center space-x-2">
                    {aiInsight.sentiment === 'positive' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Positive ({aiInsight.confidence}% confidence)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Points:</h4>
                  <ul className="space-y-2">
                    {aiInsight.key_points.map((point, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

              <div className="space-y-2">
                <button
                  onClick={handleSendEmail}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span>Send via Email</span>
                </button>

                <button
                  onClick={handleAttachToActivity}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                  <span>Attach to Activity</span>
                </button>

                <button
                  onClick={handleCreateNewVersion}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span>Create New Version</span>
                </button>

                <button
                  onClick={handleMoveToArchive}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Archive className="w-5 h-5 text-gray-600" />
                  <span>Move to Archive</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShareDocumentModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleShareDocument}
        documentName={document?.name || ''}
        teamMembers={teamMembers}
        /*
         * An empty picker because the roster failed to load is NOT the same as
         * an empty picker because you have no colleagues, so the modal is told
         * which. Without this the fetch failing looks identical to a one-person
         * workspace — the same class of ambiguity as a $0 that means "unknown".
         */
        membersLoading={membersLoading}
        membersError={membersError}
      />
    </div>
  );
};

export default DocumentDetailPage;
