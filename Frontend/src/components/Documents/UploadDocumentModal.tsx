import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspaceMembers } from '../../hooks/useWorkspaceMembers';
import {
  useRelatedRecordOptions, MODULE_LABEL, type RelatedRecordOption,
} from '../../hooks/useRelatedRecordOptions';
import { X, Upload, Tag, FileText, AlertCircle, Link2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { documentsService } from '../../services/documentsService';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (document: any) => void;
  preloadedFiles?: File[];
  contextDeal?: { id: string; name: string } | null;
  contextAccount?: { id: string; name: string } | null;
  contextContact?: { id: string; name: string } | null;
  contextActivity?: { id: string; name: string } | null;
}

interface FileWithValidation {
  file: File;
  id: string;
  isValid: boolean;
  error?: string;
  status?: 'ready' | 'uploading' | 'complete' | 'error';
  progress?: number;
  document_id?: string | null;
}

const CATEGORIES = [
  'Proposal',
  'Contract',
  'Presentation',
  'Case Study',
  'Pricing',
  'Meeting Materials',
  'Other'
];

/*
 * FIVE HARDCODED LISTS WERE DELETED HERE.
 *
 * MOCK_DEALS / MOCK_ACCOUNTS / MOCK_CONTACTS / MOCK_ACTIVITIES offered ids
 * that DO NOT EXIST — deal_acme_001, account_acme, contact_john_smith,
 * act_bigco_001 — where real ids in this workspace are D002, C002, CT001.
 * Picking any of them sent the server a record_id pointing at nothing, so a
 * related upload could not succeed even once the module casing was fixed.
 * They come from `useRelatedRecordOptions` now, which fetches the four real
 * lists.
 *
 * TEAM_MEMBERS was a FOURTH hardcoded colleague list — Sarah Chen, Mike
 * Johnson, Emily Davis again, and `selectedTeamMembers` defaulted to two of
 * them PRE-CHECKED. It joins `useWorkspaceMembers`, the same single source
 * the other two document pickers now read.
 */

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const SUPPORTED_TYPES = ['pdf', 'docx', 'pptx', 'xlsx', 'jpg', 'jpeg', 'png', 'mp4', 'mp3'];

const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  preloadedFiles = [],
  contextDeal = null,
  contextAccount = null,
  contextContact = null,
  contextActivity = null
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);

  const [selectedFiles, setSelectedFiles] = useState<FileWithValidation[]>([]);
  const [applySameSettings, setApplySameSettings] = useState(true);
  const [documentName, setDocumentName] = useState('');
  const [category, setCategory] = useState('Proposal');
  /*
   * ONE RELATED RECORD, NOT FOUR.
   *
   * There were four independent `selectedX` states, and the payload was built
   * from an `else if` chain over them — so selecting a Deal AND a Contact
   * silently DISCARDED the Contact with nothing on screen to say so. The UI
   * offered a choice the server cannot represent: `documents.module` /
   * `record_id` is a single polymorphic pair.
   *
   * Made single-valued in STATE rather than policed in the submit handler, so
   * the discard cannot happen.
   *
   * HOW IT IS ENFORCED, precisely — because the imprecise version of this
   * sentence was wrong and got repeated: attaching a record REPLACES THE
   * SEARCH INPUT WITH A CHIP, so a second record cannot be picked at all until
   * the first is explicitly removed. It is not "the second selection
   * overwrites the first" — there is no second selection to make. The
   * distinction matters to anyone changing this: rendering the input beside
   * the chip would silently restore the old two-selection state.
   *
   * Whether a document should be able to relate to several records at once is a
   * schema question (it would need a join table) and is tracked in CLAUDE.md
   * alongside the module/record_id FK decision — deliberately not inferred
   * from this bug.
   */
  const [relatedSearch, setRelatedSearch] = useState('');
  const [relatedRecord, setRelatedRecord] = useState<RelatedRecordOption | null>(null);
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Pre-fill context when modal opens
  React.useEffect(() => {
    if (isOpen) {
      /*
       * FIRST context wins, and only one is applied. Opening from a page that
       * supplied two contexts previously set two selections and then silently
       * dropped one at submit time.
       */
      const ctx: RelatedRecordOption | null =
        contextDeal     ? { module: 'deal',     id: String(contextDeal.id),     name: contextDeal.name }
        : contextAccount  ? { module: 'account',  id: String(contextAccount.id),  name: contextAccount.name }
        : contextContact  ? { module: 'contact',  id: String(contextContact.id),  name: contextContact.name }
        : contextActivity ? { module: 'activity', id: String(contextActivity.id), name: contextActivity.name }
        : null;
      if (ctx) {
        setRelatedRecord(ctx);
        setRelatedSearch(ctx.name);
      }
    }
  }, [isOpen, contextDeal, contextAccount, contextContact, contextActivity]);
  const [visibility, setVisibility] = useState<'private' | 'team' | 'company'>('team');
  /*
   * Starts EMPTY. It defaulted to ['user_sarah_chen', 'user_mike'] — two
   * fabricated ids, pre-checked, so the modal opened already proposing to
   * share with two people who do not exist under those ids.
   */
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);

  /** The signed-in user — for the uploader name, which was hardcoded. */
  const { user } = useAuth();

  /** The four real record lists, fetched only while the modal is open. */
  const {
    options: relatedOptions, loading: relatedLoading, failed: relatedFailed,
  } = useRelatedRecordOptions(isOpen);

  /** The same single member source the other two document pickers read. */
  const { members: workspaceMembers, loading: membersLoading, error: membersError } =
    useWorkspaceMembers();

  const [showRelatedDropdown, setShowRelatedDropdown] = useState(false);

  React.useEffect(() => {
    if (preloadedFiles.length > 0 && isOpen) {
      const validatedFiles = preloadedFiles.map(file => validateFile(file));
      setSelectedFiles(validatedFiles);
    }
  }, [preloadedFiles, isOpen]);

  if (!isOpen) return null;

  const validateFile = (file: File): FileWithValidation => {
    const id = `${file.name}_${Date.now()}_${Math.random()}`;
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (file.size > MAX_FILE_SIZE) {
      return {
        file,
        id,
        isValid: false,
        error: `File exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
        status: 'error',
        progress: 0,
        document_id: null
      };
    }

    if (!SUPPORTED_TYPES.includes(extension)) {
      return {
        file,
        id,
        isValid: false,
        error: `Unsupported file type. Supported: ${SUPPORTED_TYPES.join(', ').toUpperCase()}`,
        status: 'error',
        progress: 0,
        document_id: null
      };
    }

    return {
      file,
      id,
      isValid: true,
      status: 'ready',
      progress: 0,
      document_id: null
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFilesSelect(files);
  };

  const handleFilesSelect = (files: File[]) => {
    const validatedFiles = files.map(file => validateFile(file));
    setSelectedFiles(prev => [...prev, ...validatedFiles]);

    if (validatedFiles.length === 1 && !documentName && validatedFiles[0].isValid) {
      const nameWithoutExtension = validatedFiles[0].file.name.replace(/\.[^/.]+$/, '');
      setDocumentName(nameWithoutExtension);
    }

    const invalidFiles = validatedFiles.filter(f => !f.isValid);
    if (invalidFiles.length > 0) {
      showToast(`${invalidFiles.length} file(s) have validation errors`, 'error');
    }
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelect(Array.from(files));
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleTeamMember = (memberId: string) => {
    setSelectedTeamMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  /*
   * ONE searchable list across all four record types, from the real fetches.
   * Four separate filtered lists became one because the SELECTION is now one
   * value — see `relatedRecord`.
   */
  /*
   * A PLAIN COMPUTATION, NOT A HOOK, and deliberately.
   *
   * This was `React.useMemo`, and it sat BELOW `if (!isOpen) return null` a
   * hundred lines up — so the hook was called conditionally and the modal
   * would throw "Rendered more hooks than during the previous render" on
   * open/close. `lint:hooks` caught it; neither tsc nor the test suite said a
   * word, which is exactly the case CLAUDE.md lesson 13 records.
   *
   * Fixed by removing the hook rather than moving it: filtering at most a few
   * hundred options while a modal is open is not worth memoising, and a plain
   * const cannot be mis-ordered by the next person editing this file.
   */
  const q = relatedSearch.trim().toLowerCase();
  const matchingRecords = (q
    ? relatedOptions.filter(o =>
        o.name.toLowerCase().includes(q)
        || (o.detail ?? '').toLowerCase().includes(q)
        || MODULE_LABEL[o.module].toLowerCase().includes(q))
    : relatedOptions
  // Capped so a large workspace cannot render thousands of rows into a
  // dropdown; the search narrows it rather than paging.
  ).slice(0, 50);

  /**
   * Turns a server validation message into something the user can act on.
   *
   * The upload used to surface the API's own wording verbatim — "module must be
   * one of: lead, deal, contact, account, activity" — which names an internal
   * field, lists internal values, and says nothing about what the person
   * should change. It was also, in that specific case, reporting a CLIENT bug
   * (a capitalised module) as though the user had done something wrong.
   *
   * Anything unrecognised is passed through unchanged rather than replaced by
   * a vague catch-all: a message we have not seen is more useful raw than
   * flattened into "something went wrong".
   */
  const explainUploadError = (raw: string): string => {
    const m = (raw || '').toLowerCase();
    if (m.includes('module must be one of') || m.includes('module and record_id')) {
      // Now unreachable from this form — the module is typed and the pair is
      // sent together — so if it appears, it is a real client/server mismatch
      // and should say so rather than blaming the file.
      return 'The related record could not be attached (unexpected link format). '
        + 'Remove it and upload again, and report this — the form should not be '
        + 'able to produce it.';
    }
    if (m.includes('does not name a')) {
      return 'The related record no longer exists in this workspace. '
        + 'Pick a different one, or remove the link and upload without it.';
    }
    if (m.includes('name is required')) return 'Give the document a name before uploading.';
    if (m.includes('the limit is 25 mb') || m.includes('too large')) return raw;
    if (m.includes('could not be reached') || m.includes('failed to fetch')) {
      return 'The server could not be reached. Nothing was uploaded — try again.';
    }
    if (m.includes('storage is not configured') || m.includes('not available yet')) {
      return 'File storage is not configured on the server yet, so the file could not be saved.';
    }
    return raw;
  };

  const handleUpload = async () => {
    const validFiles = selectedFiles.filter(f => f.isValid);

    if (validFiles.length === 0) {
      showToast('Please select at least one valid file', 'error');
      return;
    }

    if (!category) {
      showToast('Please select a category', 'error');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setCurrentFileIndex(0);

      /*
       * THE BUG THIS FIX EXISTS FOR. These were 'Deal' / 'Account' / 'Contact'
       * — capitalised labels — appended to the request verbatim, while the
       * server's allowlist is lowercase:
       *
       *     VALID_MODULES = ['lead','deal','contact','account','activity']
       *
       * so `VALID_MODULES.includes('Contact')` was false and EVERY upload with
       * a related record failed with "module must be one of: …", a message that
       * gave the user no way to know the client had sent the wrong case.
       * `module` is now typed (`DocumentModule`), so a capitalised value does
       * not compile rather than failing at runtime.
       */
      const relatedEntityType = relatedRecord?.module;
      const relatedEntityId = relatedRecord?.id;
      const relatedEntityName = relatedRecord?.name;

      const uploadedDocs = [];

      for (let i = 0; i < validFiles.length; i++) {
        const fileData = validFiles[i];
        setCurrentFileIndex(i + 1);

        try {
          // Update file status to 'uploading'
          setSelectedFiles(prev => prev.map(f =>
            f.id === fileData.id ? { ...f, status: 'uploading', progress: 0 } : f
          ));

          const docName = applySameSettings && documentName.trim()
            ? `${documentName} ${validFiles.length > 1 ? `(${i + 1})` : ''}`
            : fileData.file.name.replace(/\.[^/.]+$/, '');

          const uploadedDoc = await documentsService.uploadDocument(
            {
              name: docName,
              file: fileData.file,
              category,
              description,
              // The signed-in user. Was hardcoded 'Alex Rodriguez' — the same
              // fabricated identity removed from DocumentDetailPage, and the
              // server overrides it from the token anyway (`resolveActorName`),
              // so sending a name at all is belt-and-braces.
              owner_name: user?.name ?? '',
              related_entity_type: relatedEntityType,
              related_entity_id: relatedEntityId,
              related_entity_name: relatedEntityName,
              tags,
            },
            (progress) => {
              // Update individual file progress
              setSelectedFiles(prev => prev.map(f =>
                f.id === fileData.id ? { ...f, progress } : f
              ));

              const overallProgress = ((i / validFiles.length) * 100) + (progress / validFiles.length);
              setUploadProgress(Math.round(overallProgress));
            }
          );

          // Update file status to 'complete' and set document_id
          setSelectedFiles(prev => prev.map(f =>
            f.id === fileData.id
              ? { ...f, status: 'complete', progress: 100, document_id: uploadedDoc.document_id }
              : f
          ));

          const formattedDoc = {
            id: uploadedDoc.id,
            document_id: uploadedDoc.document_id,
            document_name: uploadedDoc.name,
            name: uploadedDoc.name,
            file_type: uploadedDoc.file_type,
            file_size: uploadedDoc.file_size,
            file_url: uploadedDoc.file_url || '',
            category: uploadedDoc.category,
            tags,
            /*
             * deal_id / account_id / contact_id / activity_id are NOT columns
             * on `documents` — only `module` and `record_id` are. They are
             * dropped rather than sent; the pair above is the real link.
             */
            related_entity_type: relatedEntityType,
            related_entity_id: relatedEntityId,
            related_entity_name: relatedEntityName,
            uploaded_by: uploadedDoc.owner_name,
            uploaded_date: uploadedDoc.created_at,
            created_at: uploadedDoc.created_at,
            last_modified_date: uploadedDoc.updated_at,
            updated_at: uploadedDoc.updated_at,
            version: uploadedDoc.version,
            description: uploadedDoc.description || '',
            view_count: 0,
            access_count: 0,
            owner_name: uploadedDoc.owner_name,
          };

          uploadedDocs.push(formattedDoc);
          onUpload(formattedDoc);
        } catch (error: any) {
          // Mark this file as error but continue with others
          setSelectedFiles(prev => prev.map(f =>
            f.id === fileData.id
              ? { ...f, status: 'error', error: explainUploadError(error.message) || 'Upload failed' }
              : f
          ));
          showToast(
            `${fileData.file.name} was not uploaded. ${explainUploadError(error.message)}`,
            'error',
          );
        }
      }

      setUploadProgress(100);
      setUploadedDocuments(uploadedDocs);

      const failedCount = validFiles.length - uploadedDocs.length;
      if (failedCount > 0 && uploadedDocs.length === 0) {
        // Don't lead with "0 uploaded successfully" when nothing uploaded.
        /*
         * "Nothing was uploaded" was accurate but unhelpful: each file fails
         * independently, so when every one fails for the SAME reason the user
         * saw the count and had to infer the cause from a separate technical
         * toast. The shared reason is now stated here, once.
         */
        const reasons = new Set(
          selectedFiles.filter(f => f.status === 'error' && f.error).map(f => f.error as string),
        );
        showToast(
          reasons.size === 1
            ? `Nothing was uploaded. ${[...reasons][0]}`
            : `Nothing was uploaded — all ${failedCount} file(s) failed. See each file for why.`,
          'error'
        );
      } else if (failedCount > 0) {
        showToast(
          `${uploadedDocs.length} document(s) uploaded successfully, ${failedCount} failed`,
          'success'
        );
      } else {
        showToast(`${uploadedDocs.length} document(s) uploaded successfully`, 'success');
      }

      // Show success modal
      if (uploadedDocs.length > 0) {
        setTimeout(() => {
          setUploadComplete(true);
          setUploading(false);
        }, 1000);
      } else {
        setUploading(false);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to upload documents', 'error');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setDocumentName('');
    setApplySameSettings(true);
    setCategory('Proposal');
    setRelatedSearch('');
    setRelatedRecord(null);
    setShowRelatedDropdown(false);
    setDescription('');
    setTagInput('');
    setTags([]);
    setVisibility('team');
    setSelectedTeamMembers([]);   // was two pre-checked fabricated ids
    setUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    setUploadedDocuments([]);
    onClose();
  };

  const handleUploadAnother = () => {
    setSelectedFiles([]);
    setDocumentName('');
    setApplySameSettings(true);
    setCategory('Proposal');
    setRelatedSearch('');
    setRelatedRecord(null);
    setShowRelatedDropdown(false);
    setDescription('');
    setTagInput('');
    setTags([]);
    setUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    setUploadedDocuments([]);
    fileInputRef.current?.click();
  };

  // Single file error modal
  if (selectedFiles.length === 1 && !selectedFiles[0].isValid && !uploading) {
    const errorFile = selectedFiles[0];
    const isFileTooLarge = errorFile.file.size > MAX_FILE_SIZE;
    const isUnsupportedType = !SUPPORTED_TYPES.includes(errorFile.file.name.split('.').pop()?.toLowerCase() || '');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: '#1f2937' }}>Upload Error</h2>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" style={{ color: '#6b7280' }} />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-800 mb-1">{errorFile.file.name}</p>
                  <p className="text-sm text-red-700">{(errorFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-red-600 mb-2">
                {isFileTooLarge ? 'File exceeds maximum size limit' : 'File type not supported'}
              </p>

              {isFileTooLarge && (
                <>
                  <p className="text-sm text-gray-700 mb-1">
                    File size: <span className="font-medium">{(errorFile.file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </p>
                  <p className="text-sm text-gray-700 mb-3">
                    Maximum allowed: <span className="font-medium">50 MB</span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Please compress the file or split into smaller parts.
                  </p>
                </>
              )}

              {isUnsupportedType && (
                <>
                  <p className="text-sm text-gray-700 mb-1">
                    File type: <span className="font-medium">{errorFile.file.name.split('.').pop()?.toUpperCase()}</span>
                  </p>
                  <p className="text-sm text-gray-700 mb-2 font-medium">Supported types:</p>
                  <p className="text-xs text-gray-600">
                    PDF, DOCX, PPTX, XLSX, JPG, PNG, MP4, MP3
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Please convert to a supported format.
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedFiles([]);
                  fileInputRef.current?.click();
                }}
                className="flex-1 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#667eea' }}
              >
                Choose Different File
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #e5e7eb', color: '#374151' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success modal view
  if (uploadComplete && uploadedDocuments.length > 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1f2937' }}>
              {uploadedDocuments.length === 1 ? 'Document Uploaded!' : 'Upload Complete!'}
            </h2>

            <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
              {uploadedDocuments.length} document{uploadedDocuments.length > 1 ? 's' : ''} uploaded successfully
            </p>

            {uploadedDocuments.length <= 3 && (
              <div className="mb-6 text-left bg-gray-50 rounded-lg p-4">
                {uploadedDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm py-1" style={{ color: '#374151' }}>
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="truncate">{doc.document_name}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              {uploadedDocuments.length === 1 && (
                <button
                  onClick={() => {
                    handleClose();
                    // Navigate to document view - would need router here
                    window.location.hash = `#/documents/${uploadedDocuments[0].document_id}`;
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#667eea' }}
                >
                  View Document
                </button>
              )}
              <button
                onClick={handleUploadAnother}
                className="flex-1 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #e5e7eb', color: '#374151' }}
              >
                Upload Another
              </button>
              <button
                onClick={handleClose}
                className={`${uploadedDocuments.length === 1 ? 'px-4' : 'flex-1 px-4'} py-2 rounded-lg hover:bg-gray-50 transition-colors`}
                style={{ border: '1px solid #e5e7eb', color: '#374151' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
          <h2 className="text-xl font-semibold" style={{ color: '#1f2937' }}>
            {uploading ? 'Uploading Documents...' : selectedFiles.length > 1 ? `Upload Documents (${selectedFiles.length})` : 'Upload Document'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={uploading}
          >
            <X className="w-5 h-5" style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Upload Area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
              accept=".pdf,.docx,.pptx,.xlsx,.jpg,.jpeg,.png,.mp4,.mp3"
              disabled={uploading}
              multiple
            />
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              style={isDragging ? { borderColor: '#667eea', backgroundColor: '#eff6ff' } : {}}
            >
              <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: isDragging ? '#667eea' : '#9ca3af' }} />
              <p className="text-base font-medium mb-2" style={{ color: '#1f2937' }}>
                {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Drag & drop files here'}
              </p>
              <p className="text-sm mb-3" style={{ color: '#6b7280' }}>
                or click to browse
              </p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                Supported: PDF, DOCX, PPTX, XLSX, JPG, PNG, MP4, MP3
              </p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                Max size: 50MB per file
              </p>
            </div>
          </div>

          {/* File Queue */}
          {selectedFiles.length > 0 && (
            <div className="border rounded-lg p-4" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: '#1f2937' }}>
                  {uploading ? 'Uploading files...' : `Files to upload (${selectedFiles.length})`}
                </span>
                {selectedFiles.length > 1 && !uploading && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applySameSettings}
                      onChange={(e) => setApplySameSettings(e.target.checked)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#667eea' }}
                    />
                    <span style={{ color: '#6b7280' }}>Apply same settings to all</span>
                  </label>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedFiles.map((fileData) => (
                  <div
                    key={fileData.id}
                    className={`rounded-lg border ${
                      fileData.status === 'complete'
                        ? 'bg-green-50 border-green-200'
                        : fileData.status === 'uploading'
                        ? 'bg-blue-50 border-blue-200'
                        : fileData.status === 'error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {fileData.status === 'complete' ? (
                          <div className="w-5 h-5 flex-shrink-0 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : fileData.status === 'uploading' ? (
                          <div className="w-5 h-5 flex-shrink-0">
                            <svg className="animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          </div>
                        ) : fileData.status === 'error' ? (
                          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                        ) : (
                          <FileText className="w-5 h-5 flex-shrink-0" style={{ color: '#667eea' }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#1f2937' }}>
                            {fileData.file.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs" style={{ color: '#6b7280' }}>
                            <span>{(fileData.file.size / 1024 / 1024).toFixed(2)} MB</span>
                            {fileData.status === 'complete' && fileData.document_id && (
                              <>
                                <span>•</span>
                                <span className="text-green-600">Uploaded</span>
                              </>
                            )}
                            {fileData.status === 'uploading' && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600">Uploading {fileData.progress || 0}%</span>
                              </>
                            )}
                          </div>
                          {fileData.error && (
                            <p className="text-xs text-red-600 mt-1">
                              {fileData.error}
                            </p>
                          )}
                        </div>
                      </div>
                      {!uploading && fileData.status !== 'complete' && (
                        <button
                          onClick={() => removeFile(fileData.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" style={{ color: '#6b7280' }} />
                        </button>
                      )}
                    </div>
                    {/* Individual progress bar for uploading files */}
                    {fileData.status === 'uploading' && (
                      <div className="px-3 pb-3">
                        <div className="w-full bg-blue-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${fileData.progress || 0}%`,
                              backgroundColor: '#667eea'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall Upload Progress */}
          {uploading && (
            <div className="border-t pt-4" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium" style={{ color: '#1f2937' }}>
                    Overall Progress
                  </span>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    {selectedFiles.filter(f => f.status === 'complete').length} of {selectedFiles.filter(f => f.isValid).length} files uploaded
                  </p>
                </div>
                <span className="text-lg font-semibold" style={{ color: '#667eea' }}>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%`, backgroundColor: '#667eea' }}
                />
              </div>
              {uploadProgress === 100 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">All files uploaded successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Document Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
              Document Name: <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input aria-label="Document Name:"
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Enter document name"
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
              style={{ border: '1px solid #e5e7eb', color: '#1f2937' }}
              disabled={uploading}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
              Category: <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select aria-label="Category:"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
              style={{ border: '1px solid #e5e7eb', color: '#1f2937' }}
              disabled={uploading}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Link to */}
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: '#374151' }}>
              Link to: <span className="text-xs font-normal" style={{ color: '#9ca3af' }}>(optional)</span>
            </label>

            {/* Context Pre-filled Indicator */}
            {(contextDeal || contextAccount || contextContact || contextActivity) && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 mb-3">
                <Link2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  Auto-linked to current{' '}
                  {contextDeal && 'deal'}
                  {contextAccount && 'account'}
                  {contextContact && 'contact'}
                  {contextActivity && 'activity'}
                </span>
              </div>
            )}

            {/*
              ONE PICKER, replacing four near-identical dropdowns (212 lines).
              Single-select by construction: choosing a record replaces
              whatever was attached, so the silent discard the `else if` chain
              used to perform cannot occur. The type is shown on every row and
              on the chip, because "Acme Corp" alone does not say whether it is
              an account or a deal.
            */}
            <div className="mb-3 relative">
              <label htmlFor="related-record" className="block text-sm mb-1" style={{ color: '#6b7280' }}>
                Related record: <span className="text-xs" style={{ color: '#9ca3af' }}>(optional — one only)</span>
              </label>

              {relatedRecord ? (
                <div
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
                  style={{ border: '1px solid #c7d2fe', backgroundColor: '#eef2ff' }}
                >
                  <span className="text-sm" style={{ color: '#1f2937' }}>
                    <span
                      className="mr-2 px-1.5 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}
                    >
                      {MODULE_LABEL[relatedRecord.module]}
                    </span>
                    {relatedRecord.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setRelatedRecord(null); setRelatedSearch(''); }}
                    disabled={uploading}
                    aria-label="Remove related record"
                    className="shrink-0 hover:text-red-600"
                    style={{ color: '#6b7280' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    id="related-record"
                    type="text"
                    value={relatedSearch}
                    onChange={(e) => { setRelatedSearch(e.target.value); setShowRelatedDropdown(true); }}
                    onFocus={() => setShowRelatedDropdown(true)}
                    placeholder="Search deals, accounts, contacts or activities…"
                    disabled={uploading}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{ border: '1px solid #e5e7eb', color: '#1f2937' }}
                  />

                  {showRelatedDropdown && (
                    <div
                      className="absolute z-20 w-full mt-1 rounded-lg shadow-lg max-h-56 overflow-y-auto"
                      style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                    >
                      {/*
                        Four states said apart. Previously an empty dropdown
                        meant only "no match" — and the list it filtered was
                        fabricated, so it always had something to show.
                      */}
                      {relatedLoading && (
                        <p className="px-3 py-2 text-sm" style={{ color: '#6b7280' }}>Loading records…</p>
                      )}
                      {!relatedLoading && relatedFailed.length > 0 && (
                        <p role="alert" className="px-3 py-2 text-sm" style={{ color: '#b91c1c' }}>
                          Could not load {relatedFailed.join(', ')}. Those records are not listed.
                        </p>
                      )}
                      {!relatedLoading && matchingRecords.length === 0 && relatedFailed.length === 0 && (
                        <p className="px-3 py-2 text-sm" style={{ color: '#6b7280' }}>
                          {relatedSearch.trim()
                            ? 'No record matches that search.'
                            : 'No deals, accounts, contacts or activities yet.'}
                        </p>
                      )}
                      {matchingRecords.map((opt) => (
                        <button
                          key={`${opt.module}:${opt.id}`}
                          type="button"
                          onClick={() => {
                            // Replaces, never adds.
                            setRelatedRecord(opt);
                            setRelatedSearch(opt.name);
                            setShowRelatedDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span
                            className="shrink-0 px-1.5 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}
                          >
                            {MODULE_LABEL[opt.module]}
                          </span>
                          <span className="text-sm truncate" style={{ color: '#1f2937' }}>
                            {opt.name}
                            {opt.detail && (
                              <span className="ml-1 text-xs" style={{ color: '#9ca3af' }}>· {opt.detail}</span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
              Description: <span className="text-xs font-normal" style={{ color: '#9ca3af' }}>(optional)</span>
            </label>
            <textarea aria-label="Description: (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter document description"
              rows={3}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 resize-none"
              style={{ border: '1px solid #e5e7eb', color: '#1f2937' }}
              disabled={uploading}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
              Tags: <span className="text-xs font-normal" style={{ color: '#9ca3af' }}>(optional - press Enter to add)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                  style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-600"
                    disabled={uploading}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type tag and press Enter"
                className="w-full px-3 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2"
                style={{ border: '1px solid #e5e7eb', color: '#1f2937' }}
                disabled={uploading}
              />
              <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: '#374151' }}>
              Visibility:
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={() => setVisibility('private')}
                  className="w-4 h-4"
                  style={{ accentColor: '#667eea' }}
                  disabled={uploading}
                />
                <span className="text-sm" style={{ color: '#1f2937' }}>Private (Only me)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="team"
                  checked={visibility === 'team'}
                  onChange={() => setVisibility('team')}
                  className="w-4 h-4"
                  style={{ accentColor: '#667eea' }}
                  disabled={uploading}
                />
                <span className="text-sm" style={{ color: '#1f2937' }}>Team (Sales team members)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="company"
                  checked={visibility === 'company'}
                  onChange={() => setVisibility('company')}
                  className="w-4 h-4"
                  style={{ accentColor: '#667eea' }}
                  disabled={uploading}
                />
                <span className="text-sm" style={{ color: '#1f2937' }}>Company (Everyone)</span>
              </label>
            </div>
          </div>

          {/* Share with (if Team selected) */}
          {visibility === 'team' && (
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: '#374151' }}>
                Share with:
              </label>
              <div className="space-y-2">
                {/*
                  REAL workspace members, from the same `useWorkspaceMembers`
                  the DocumentsLibrary and DocumentDetailPage pickers read.
                  This was the fourth hardcoded copy of Sarah Chen / Mike
                  Johnson / Emily Davis in this codebase.
                */}
                {membersLoading && (
                  <p className="text-sm" style={{ color: '#6b7280' }}>Loading members…</p>
                )}
                {membersError && (
                  <p role="alert" className="text-sm" style={{ color: '#b91c1c' }}>{membersError}</p>
                )}
                {!membersLoading && !membersError && workspaceMembers.length === 0 && (
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    No other members in this workspace.
                  </p>
                )}
                {workspaceMembers.map(member => (
                  <label key={member.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTeamMembers.includes(member.id)}
                      onChange={() => toggleTeamMember(member.id)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#667eea' }}
                      disabled={uploading}
                    />
                    <span className="text-sm" style={{ color: '#374151' }}>
                      {member.name || member.email}
                      <span style={{ color: '#9ca3af' }}> — {member.role}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t" style={{ borderColor: '#e5e7eb' }}>
          {selectedFiles.length > 0 && selectedFiles.some(f => !f.isValid) && !uploading && (
            <div className="px-6 pt-4 pb-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">
                      {selectedFiles.filter(f => !f.isValid).length} file(s) have errors
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Remove invalid files or upload only the valid ones
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 p-6">
            <div className="flex-1">
              {selectedFiles.length > 0 && (
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  {selectedFiles.filter(f => f.isValid).length} of {selectedFiles.length} file(s) ready to upload
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #e5e7eb', color: '#374151' }}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#667eea' }}
                disabled={uploading || selectedFiles.filter(f => f.isValid).length === 0}
              >
                {uploading
                  ? 'Uploading...'
                  : selectedFiles.length > 1
                    ? selectedFiles.some(f => !f.isValid)
                      ? `Upload Valid Files (${selectedFiles.filter(f => f.isValid).length})`
                      : `Upload All (${selectedFiles.filter(f => f.isValid).length})`
                    : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentModal;
