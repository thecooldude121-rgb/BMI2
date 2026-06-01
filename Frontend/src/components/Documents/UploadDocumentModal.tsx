import React, { useState, useRef } from 'react';
import { X, Upload, Search, Tag, Users, Building2, TrendingUp, Phone, FileText, AlertCircle, Link2 } from 'lucide-react';
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

const MOCK_DEALS = [
  { id: 'deal_acme_001', name: 'Acme Corp - $50K' },
  { id: 'deal_techstart_001', name: 'TechStart - $42K' },
  { id: 'deal_bigco_001', name: 'BigCo - $75K' },
  { id: 'deal_innovate_001', name: 'InnovateLabs - $38K' },
  { id: 'deal_startco_001', name: 'StartCo - $28K' },
  { id: 'deal_health_001', name: 'HealthPlus - $62K' }
];

const MOCK_ACCOUNTS = [
  { id: 'account_acme', name: 'Acme Corp' },
  { id: 'account_techstart', name: 'TechStart Inc' },
  { id: 'account_bigco', name: 'BigCo Enterprise' },
  { id: 'account_dataflow', name: 'DataFlow Inc' },
  { id: 'account_innovate', name: 'InnovateLabs' },
  { id: 'account_startco', name: 'StartCo' },
  { id: 'account_health', name: 'HealthPlus' }
];

const MOCK_CONTACTS = [
  { id: 'contact_john_smith', name: 'John Smith - Acme Corp' },
  { id: 'contact_sarah_lee', name: 'Sarah Lee - TechStart Inc' },
  { id: 'contact_mike_chen', name: 'Mike Chen - BigCo Enterprise' },
  { id: 'contact_david_park', name: 'David Park - InnovateLabs' },
  { id: 'contact_lisa_martinez', name: 'Lisa Martinez - StartCo' },
  { id: 'contact_amanda_foster', name: 'Amanda Foster - HealthPlus' }
];

const MOCK_ACTIVITIES = [
  { id: 'act_bigco_001', name: 'Discovery Call (Dec 7) - BigCo' },
  { id: 'act_acme_meeting_001', name: 'Demo Meeting (Nov 28) - Acme' },
  { id: 'act_techstart_003', name: 'Discovery Call (Dec 3) - TechStart' }
];

const TEAM_MEMBERS = [
  { id: 'user_sarah_chen', name: 'Sarah Chen' },
  { id: 'user_mike', name: 'Mike Johnson' },
  { id: 'user_emily', name: 'Emily Davis' }
];

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
  const [dealSearch, setDealSearch] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Pre-fill context when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (contextDeal) {
        setSelectedDeal(contextDeal);
        setDealSearch(contextDeal.name);
      }
      if (contextAccount) {
        setSelectedAccount(contextAccount);
        setAccountSearch(contextAccount.name);
      }
      if (contextContact) {
        setSelectedContact(contextContact);
        setContactSearch(contextContact.name);
      }
      if (contextActivity) {
        setSelectedActivity(contextActivity);
        setActivitySearch(contextActivity.name);
      }
    }
  }, [isOpen, contextDeal, contextAccount, contextContact, contextActivity]);
  const [visibility, setVisibility] = useState<'private' | 'team' | 'company'>('team');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>(['user_sarah_chen', 'user_mike']);

  const [showDealDropdown, setShowDealDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);

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

  const filteredDeals = MOCK_DEALS.filter(deal =>
    deal.name.toLowerCase().includes(dealSearch.toLowerCase())
  );

  const filteredAccounts = MOCK_ACCOUNTS.filter(account =>
    account.name.toLowerCase().includes(accountSearch.toLowerCase())
  );

  const filteredContacts = MOCK_CONTACTS.filter(contact =>
    contact.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const filteredActivities = MOCK_ACTIVITIES.filter(activity =>
    activity.name.toLowerCase().includes(activitySearch.toLowerCase())
  );

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

      let relatedEntityType: string | undefined;
      let relatedEntityId: string | undefined;
      let relatedEntityName: string | undefined;

      if (selectedDeal) {
        relatedEntityType = 'Deal';
        relatedEntityId = selectedDeal.id;
        relatedEntityName = selectedDeal.name;
      } else if (selectedAccount) {
        relatedEntityType = 'Account';
        relatedEntityId = selectedAccount.id;
        relatedEntityName = selectedAccount.name;
      } else if (selectedContact) {
        relatedEntityType = 'Contact';
        relatedEntityId = selectedContact.id;
        relatedEntityName = selectedContact.name;
      }

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
              owner_name: 'Alex Rodriguez',
              related_entity_type: relatedEntityType,
              related_entity_id: relatedEntityId,
              related_entity_name: relatedEntityName,
              activity_id: selectedActivity?.id,
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
            deal_id: selectedDeal?.id || null,
            account_id: selectedAccount?.id || null,
            contact_id: selectedContact?.id || null,
            activity_id: selectedActivity?.id || null,
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
              ? { ...f, status: 'error', error: error.message || 'Upload failed' }
              : f
          ));
          showToast(`Failed to upload ${fileData.file.name}: ${error.message}`, 'error');
        }
      }

      setUploadProgress(100);
      setUploadedDocuments(uploadedDocs);

      const failedCount = validFiles.length - uploadedDocs.length;
      if (failedCount > 0) {
        showToast(
          `${uploadedDocs.length} document(s) uploaded successfully, ${failedCount} failed`,
          uploadedDocs.length > 0 ? 'success' : 'error'
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
    setDealSearch('');
    setAccountSearch('');
    setContactSearch('');
    setActivitySearch('');
    setSelectedDeal(null);
    setSelectedAccount(null);
    setSelectedContact(null);
    setSelectedActivity(null);
    setDescription('');
    setTagInput('');
    setTags([]);
    setVisibility('team');
    setSelectedTeamMembers(['user_sarah_chen', 'user_mike']);
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
    setDealSearch('');
    setAccountSearch('');
    setContactSearch('');
    setActivitySearch('');
    setSelectedDeal(null);
    setSelectedAccount(null);
    setSelectedContact(null);
    setSelectedActivity(null);
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
            <input
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
            <select
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

            {/* Deal */}
            <div className="mb-3 relative">
              <label className="block text-sm mb-1" style={{ color: '#6b7280' }}>Deal:</label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedDeal ? selectedDeal.name : dealSearch}
                  onChange={(e) => {
                    setDealSearch(e.target.value);
                    setSelectedDeal(null);
                    setShowDealDropdown(true);
                  }}
                  onFocus={() => setShowDealDropdown(true)}
                  placeholder="Search deals..."
                  className="w-full px-3 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2"
                  style={{ border: '1px solid #e5e7eb', color: '#1f2937' }}
                  disabled={uploading}
                />
                <TrendingUp className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
              </div>
              {showDealDropdown && !selectedDeal && filteredDeals.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-48 overflow-y-auto" style={{ border: '1px solid #e5e7eb' }}>
                  {filteredDeals.map(deal => (
                    <button
                      key={deal.id}
                      onClick={() => {
                        setSelectedDeal(deal);
                        setDealSearch('');
                        setShowDealDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                      style={{ color: '#1f2937' }}
                    >
                      {deal.name}
                    </button>
                  ))}
                </div>
              )}
              {selectedDeal && (
                <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: '#667eea' }}>
                  <TrendingUp className="w-3 h-3" />
                  <span>{selectedDeal.name}</span>
                  <button
                    onClick={() => setSelectedDeal(null)}
                    className="ml-auto text-xs hover:underline"
                    style={{ color: '#ef4444' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Account */}
            <div className="mb-3 relative">
              <label className="block text-sm mb-1" style={{ color: '#6b7280' }}>Account:</label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedAccount ? selectedAccount.name : accountSearch}
                  onChange={(e) => {
                    setAccountSearch(e.target.value);
                    setSelectedAccount(null);
                    setShowAccountDropdown(true);
                  }}
                  onFocus={() => setShowAccountDropdown(true)}
                  placeholder="Search accounts..."
                  className="w-full px-3 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2"
                  style={{ border: '1px solid #e5e7eb', color: '#1f2937' }}
                  disabled={uploading}
                />
                <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
              </div>
              {showAccountDropdown && !selectedAccount && filteredAccounts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-48 overflow-y-auto" style={{ border: '1px solid #e5e7eb' }}>
                  {filteredAccounts.map(account => (
                    <button
                      key={account.id}
                      onClick={() => {
                        setSelectedAccount(account);
                        setAccountSearch('');
                        setShowAccountDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                      style={{ color: '#1f2937' }}
                    >
                      {account.name}
                    </button>
                  ))}
                </div>
              )}
              {selectedAccount && (
                <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: '#667eea' }}>
                  <Building2 className="w-3 h-3" />
                  <span>{selectedAccount.name}</span>
                  <button
                    onClick={() => setSelectedAccount(null)}
                    className="ml-auto text-xs hover:underline"
                    style={{ color: '#ef4444' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="mb-3 relative">
              <label className="block text-sm mb-1" style={{ color: '#6b7280' }}>Contact:</label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedContact ? selectedContact.name : contactSearch}
                  onChange={(e) => {
                    setContactSearch(e.target.value);
                    setSelectedContact(null);
                    setShowContactDropdown(true);
                  }}
                  onFocus={() => setShowContactDropdown(true)}
                  placeholder="Search contacts..."
                  className="w-full px-3 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2"
                  style={{ border: '1px solid #e5e7eb', color: '#1f2937' }}
                  disabled={uploading}
                />
                <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
              </div>
              {showContactDropdown && !selectedContact && filteredContacts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-48 overflow-y-auto" style={{ border: '1px solid #e5e7eb' }}>
                  {filteredContacts.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        setSelectedContact(contact);
                        setContactSearch('');
                        setShowContactDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                      style={{ color: '#1f2937' }}
                    >
                      {contact.name}
                    </button>
                  ))}
                </div>
              )}
              {selectedContact && (
                <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: '#667eea' }}>
                  <Users className="w-3 h-3" />
                  <span>{selectedContact.name}</span>
                  <button
                    onClick={() => setSelectedContact(null)}
                    className="ml-auto text-xs hover:underline"
                    style={{ color: '#ef4444' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Activity */}
            <div className="relative">
              <label className="block text-sm mb-1" style={{ color: '#6b7280' }}>Activity:</label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedActivity ? selectedActivity.name : activitySearch}
                  onChange={(e) => {
                    setActivitySearch(e.target.value);
                    setSelectedActivity(null);
                    setShowActivityDropdown(true);
                  }}
                  onFocus={() => setShowActivityDropdown(true)}
                  placeholder="Search activities..."
                  className="w-full px-3 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2"
                  style={{ border: '1px solid #e5e7eb', color: '#1f2937' }}
                  disabled={uploading}
                />
                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
              </div>
              {showActivityDropdown && !selectedActivity && filteredActivities.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-48 overflow-y-auto" style={{ border: '1px solid #e5e7eb' }}>
                  {filteredActivities.map(activity => (
                    <button
                      key={activity.id}
                      onClick={() => {
                        setSelectedActivity(activity);
                        setActivitySearch('');
                        setShowActivityDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                      style={{ color: '#1f2937' }}
                    >
                      {activity.name}
                    </button>
                  ))}
                </div>
              )}
              {selectedActivity && (
                <div className="mt-1 flex items-center gap-2 text-sm" style={{ color: '#667eea' }}>
                  <Phone className="w-3 h-3" />
                  <span>{selectedActivity.name}</span>
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="ml-auto text-xs hover:underline"
                    style={{ color: '#ef4444' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
              Description: <span className="text-xs font-normal" style={{ color: '#9ca3af' }}>(optional)</span>
            </label>
            <textarea
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
                {TEAM_MEMBERS.map(member => (
                  <label key={member.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTeamMembers.includes(member.id)}
                      onChange={() => toggleTeamMember(member.id)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#667eea' }}
                      disabled={uploading}
                    />
                    <span className="text-sm" style={{ color: '#1f2937' }}>{member.name}</span>
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
