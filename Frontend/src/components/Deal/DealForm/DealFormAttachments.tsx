import React, { useRef, useState, useCallback } from 'react';
import { Paperclip, UploadCloud, X, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react';
import {
  ATTACHMENT_CONFIG,
  formatFileSize,
  validateAttachmentFile,
} from '../../../config/attachments';
import { uploadFile } from '../../../utils/attachmentUploadService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttachmentStatus = 'pending' | 'uploading' | 'uploaded' | 'error';

export interface AttachmentItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: AttachmentStatus;
  uploadedUrl?: string;
  error?: string;
}

interface DealFormAttachmentsProps {
  attachments: AttachmentItem[];
  onChange: (attachments: AttachmentItem[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tempId = () => `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const fileIcon = (type: string) => {
  if (type.includes('pdf'))                   return '📄';
  if (type.includes('word') || type.includes('msword')) return '📝';
  if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📋';
  if (type.startsWith('image/'))              return '🖼️';
  return '📎';
};

// ─── Component ────────────────────────────────────────────────────────────────

export const DealFormAttachments: React.FC<DealFormAttachmentsProps> = ({
  attachments,
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const totalBytes = attachments.reduce((s, a) => s + a.size, 0);

  // ── File acceptance ────────────────────────────────────────────────────────

  const addFiles = useCallback(async (files: FileList | File[]) => {
    setGlobalError(null);
    const incoming = Array.from(files);

    if (attachments.length + incoming.length > ATTACHMENT_CONFIG.maxFiles) {
      setGlobalError(`Maximum ${ATTACHMENT_CONFIG.maxFiles} files allowed.`);
      return;
    }

    const newItems: AttachmentItem[] = [];
    let runningTotal = totalBytes;

    for (const file of incoming) {
      const err = validateAttachmentFile(file, runningTotal);
      if (err) { setGlobalError(err); return; }
      runningTotal += file.size;
      newItems.push({
        id: tempId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
      });
    }

    const updated = [...attachments, ...newItems];
    onChange(updated);

    // Start mock upload for each new item
    for (const item of newItems) {
      startUpload(item, updated);
    }
  }, [attachments, totalBytes, onChange]);

  const startUpload = async (item: AttachmentItem, currentList: AttachmentItem[]) => {
    // Mark as uploading
    const setStatus = (patch: Partial<AttachmentItem>) =>
      onChange(
        currentList.map(a => (a.id === item.id ? { ...a, ...patch } : a))
      );

    // We need a ref-like approach: read latest list from closure updates
    // Instead, we re-read from the latest attachments state via the parent onChange
    const markUploading = (list: AttachmentItem[]) =>
      list.map(a => a.id === item.id ? { ...a, status: 'uploading' as AttachmentStatus } : a);
    const markUploaded = (list: AttachmentItem[], url: string) =>
      list.map(a => a.id === item.id ? { ...a, status: 'uploaded' as AttachmentStatus, uploadedUrl: url } : a);
    const markError = (list: AttachmentItem[], error: string) =>
      list.map(a => a.id === item.id ? { ...a, status: 'error' as AttachmentStatus, error } : a);

    onChange(markUploading(currentList));

    try {
      const result = await uploadFile(item.file);
      // Use functional update pattern to always work on latest list
      onChange(prev => markUploaded(prev, result.url));
    } catch (err: any) {
      onChange(prev => markError(prev, err.message ?? 'Upload failed'));
    }
  };

  const remove = (id: string) => {
    onChange(attachments.filter(a => a.id !== id));
    setGlobalError(null);
  };

  const retryUpload = (item: AttachmentItem) => {
    const reset = attachments.map(a =>
      a.id === item.id ? { ...a, status: 'uploading' as AttachmentStatus, error: undefined } : a
    );
    onChange(reset);
    startUpload({ ...item, status: 'uploading' }, reset);
  };

  // ── Drag and drop ─────────────────────────────────────────────────────────

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  // ── Status indicators ─────────────────────────────────────────────────────

  const StatusIcon: React.FC<{ item: AttachmentItem }> = ({ item }) => {
    if (item.status === 'uploaded')  return <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />;
    if (item.status === 'uploading') return <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />;
    if (item.status === 'error')     return <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
    return <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />;
  };

  const uploadedCount  = attachments.filter(a => a.status === 'uploaded').length;
  const pendingCount   = attachments.filter(a => a.status === 'pending' || a.status === 'uploading').length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* Section header */}
      <div className="flex items-center space-x-3 mb-6 pb-3 border-b border-gray-100">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Paperclip className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900">
            Attachments
            <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
          </h2>
          <p className="text-xs text-gray-500">Proposals, contracts, briefs, or supporting files</p>
        </div>
        {attachments.length > 0 && (
          <span className="text-xs text-gray-400">
            {uploadedCount}/{attachments.length} uploaded · {formatFileSize(totalBytes)}
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
        }`}
      >
        <UploadCloud className={`h-8 w-8 mx-auto mb-2 transition-colors ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700">
          {isDragging ? 'Drop files here' : 'Drag files here or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {ATTACHMENT_CONFIG.acceptedLabel}
        </p>
        <p className="text-xs text-gray-400">
          Max {ATTACHMENT_CONFIG.maxFiles} files · {formatFileSize(ATTACHMENT_CONFIG.maxFileSizeBytes)} per file
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ATTACHMENT_CONFIG.acceptedExtensions}
          className="hidden"
          onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* Global validation error */}
      {globalError && (
        <div className="mt-3 flex items-start space-x-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{globalError}</span>
        </div>
      )}

      {/* File list */}
      {attachments.length > 0 && (
        <ul className="mt-4 space-y-2">
          {attachments.map(item => (
            <li
              key={item.id}
              className={`flex items-start space-x-3 px-3 py-2.5 rounded-lg border text-sm ${
                item.status === 'error'
                  ? 'bg-red-50 border-red-100'
                  : item.status === 'uploaded'
                  ? 'bg-emerald-50 border-emerald-100'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* File icon */}
              <span className="text-lg flex-shrink-0 leading-none mt-0.5">
                {fileIcon(item.type)}
              </span>

              {/* Name + size + error */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{item.name}</p>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-xs text-gray-500">{formatFileSize(item.size)}</span>
                  {item.status === 'uploading' && (
                    <span className="text-xs text-blue-500">Uploading…</span>
                  )}
                  {item.status === 'uploaded' && (
                    <span className="text-xs text-emerald-600">Ready</span>
                  )}
                  {item.status === 'pending' && (
                    <span className="text-xs text-gray-400">Waiting</span>
                  )}
                </div>
                {item.status === 'error' && item.error && (
                  <p className="text-xs text-red-600 mt-0.5">{item.error}</p>
                )}
              </div>

              {/* Status + actions */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <StatusIcon item={item} />
                {item.status === 'error' && (
                  <button
                    type="button"
                    onClick={() => retryUpload(item)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  disabled={item.status === 'uploading'}
                  className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={`Remove ${item.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Summary note when all uploaded */}
      {pendingCount === 0 && uploadedCount > 0 && (
        <p className="mt-3 text-xs text-emerald-600 flex items-center space-x-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>
            {uploadedCount} file{uploadedCount > 1 ? 's' : ''} ready · metadata will be included in save payload.
            Full storage integration pending backend upload API.
          </span>
        </p>
      )}
    </div>
  );
};
