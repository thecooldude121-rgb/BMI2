import React, { useState, useRef } from 'react';
import { X, Upload, FileText, File, Image, FileSpreadsheet, Presentation, CheckCircle } from 'lucide-react';

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberEmail: string;
  onShare: (documentData: {
    documentSource: 'library' | 'upload';
    documentName: string;
    documentType?: string;
    file?: File;
    message: string;
    permission: 'view' | 'edit' | 'download';
    expires: 'never' | '7days' | '30days' | '90days';
  }) => void;
}

const RECENT_DOCUMENTS = [
  { id: '1', name: 'Q4_Performance_Template.xlsx', type: 'spreadsheet', size: '245 KB' },
  { id: '2', name: 'Coaching_Framework.pdf', type: 'pdf', size: '1.2 MB' },
  { id: '3', name: 'Sales_Playbook_2024.docx', type: 'document', size: '3.4 MB' },
  { id: '4', name: 'HRMS_Best_Practices.pptx', type: 'presentation', size: '5.8 MB' }
];

const getFileIcon = (type: string) => {
  switch (type) {
    case 'spreadsheet':
      return FileSpreadsheet;
    case 'pdf':
      return FileText;
    case 'document':
      return File;
    case 'presentation':
      return Presentation;
    case 'image':
      return Image;
    default:
      return FileText;
  }
};

export const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  isOpen,
  onClose,
  memberName,
  memberEmail,
  onShare
}) => {
  const [documentSource, setDocumentSource] = useState<'library' | 'upload'>('library');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [message, setMessage] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit' | 'download'>('view');
  const [expires, setExpires] = useState<'never' | '7days' | '30days' | '90days'>('never');
  const [sharing, setSharing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const firstName = memberName.split(' ')[0];
  const selectedDoc = RECENT_DOCUMENTS.find(doc => doc.id === selectedDocId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setDocumentTitle(file.name);
      setDocumentSource('upload');
      setSelectedDocId('');
    }
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
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);
      setDocumentTitle(file.name);
      setDocumentSource('upload');
      setSelectedDocId('');
    }
  };

  const handleDocumentSelect = (docId: string) => {
    setSelectedDocId(docId);
    setDocumentSource('library');
    setUploadedFile(null);
    const doc = RECENT_DOCUMENTS.find(d => d.id === docId);
    if (doc) {
      setDocumentTitle(doc.name);
    }
  };

  const handleShare = async () => {
    const documentName = documentSource === 'library' ? selectedDoc?.name || documentTitle : documentTitle;

    if (!documentName) return;

    setSharing(true);
    await onShare({
      documentSource,
      documentName,
      documentType: documentSource === 'library' ? selectedDoc?.type : uploadedFile?.type,
      file: uploadedFile || undefined,
      message,
      permission,
      expires
    });
    setSharing(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setDocumentSource('library');
    setSelectedDocId('');
    setUploadedFile(null);
    setDocumentTitle('');
    setMessage('');
    setPermission('view');
    setExpires('never');
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const isValid = (documentSource === 'library' && selectedDocId) ||
                   (documentSource === 'upload' && uploadedFile);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Share Document with {memberName}</h2>
            <p className="text-sm text-slate-600 mt-1">{memberEmail}</p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Source Tabs */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setDocumentSource('library')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                documentSource === 'library'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Choose from Library
            </button>
            <button
              onClick={() => setDocumentSource('upload')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                documentSource === 'upload'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Upload New
            </button>
          </div>

          {/* Recent Documents (Library Tab) */}
          {documentSource === 'library' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Recent Documents
              </label>
              <div className="space-y-2">
                {RECENT_DOCUMENTS.map((doc) => {
                  const Icon = getFileIcon(doc.type);
                  return (
                    <label
                      key={doc.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedDocId === doc.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="document"
                        checked={selectedDocId === doc.id}
                        onChange={() => handleDocumentSelect(doc.id)}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <Icon className="w-5 h-5 text-slate-500 ml-3 mr-2" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">{doc.name}</div>
                        <div className="text-xs text-slate-500">{doc.size}</div>
                      </div>
                      {selectedDocId === doc.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload New Document (Upload Tab) */}
          {documentSource === 'upload' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Upload New Document
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                {uploadedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-900">{uploadedFile.name}</div>
                      <div className="text-xs text-slate-500">
                        {(uploadedFile.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setDocumentTitle('');
                      }}
                      className="ml-4 p-1 hover:bg-slate-200 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 mb-2">
                      Drag and drop your file here, or
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Choose File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                    />
                    <p className="text-xs text-slate-500 mt-3">
                      Supported: PDF, DOC, XLS, PPT, TXT, Images (Max 50MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Document Title */}
          {(selectedDoc || uploadedFile) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Document Title
              </label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Document title"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${firstName}, here's the document we discussed...`}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Permissions</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="permission"
                  checked={permission === 'view'}
                  onChange={() => setPermission('view')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Can View</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="permission"
                  checked={permission === 'edit'}
                  onChange={() => setPermission('edit')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Can Edit</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="permission"
                  checked={permission === 'download'}
                  onChange={() => setPermission('download')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Can Download</span>
              </label>
            </div>
          </div>

          {/* Expires */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Expires</label>
            <select
              value={expires}
              onChange={(e) => setExpires(e.target.value as typeof expires)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="never">Never</option>
              <option value="7days">7 days</option>
              <option value="30days">30 days</option>
              <option value="90days">90 days</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs">D</kbd>
            <span className="ml-2">to share document</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={sharing || !isValid}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {sharing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Sharing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Share Document
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareDocumentModal;
