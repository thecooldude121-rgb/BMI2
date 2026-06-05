import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Paperclip } from 'lucide-react';
import {
  ATTACHMENT_MAX_FILES,
  ATTACHMENT_MAX_SIZE_BYTES,
  ATTACHMENT_TOTAL_QUOTA_BYTES,
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  FILE_TYPE_CONFIG,
  DEFAULT_FILE_CONFIG,
  AttachedFile,
  formatFileSize,
  getFileExtension,
  isDuplicateFile,
} from '../../../config/attachments';

export type { AttachedFile };

interface DealFormAttachmentsProps {
  onValidFilesChange: (files: AttachedFile[]) => void;
}

const tempId = () => `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const DealFormAttachments: React.FC<DealFormAttachmentsProps> = ({
  onValidFilesChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // ── Derived values ─────────────────────────────────────────────────────────
  const validFiles = attachedFiles.filter(f => f.status === 'valid');
  const errorFiles = attachedFiles.filter(f => f.status !== 'valid');
  const totalValidSizeBytes = validFiles.reduce((s, f) => s + f.size, 0);
  const isAtLimit = validFiles.length >= ATTACHMENT_MAX_FILES;
  const quotaPercent = Math.min((totalValidSizeBytes / ATTACHMENT_TOTAL_QUOTA_BYTES) * 100, 100);
  const slotsRemaining = ATTACHMENT_MAX_FILES - validFiles.length;
  const quotaBarColor = quotaPercent >= 90 ? 'bg-red-500' : quotaPercent >= 70 ? 'bg-amber-500' : 'bg-green-500';

  // Notify parent whenever the attached files list changes
  useEffect(() => {
    onValidFilesChange(attachedFiles.filter(f => f.status === 'valid'));
  }, [attachedFiles]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Process incoming files ─────────────────────────────────────────────────
  const processNewFiles = useCallback((incoming: FileList | File[]) => {
    const incomingArr = Array.from(incoming);

    setAttachedFiles(prev => {
      const currentValidCount = prev.filter(f => f.status === 'valid').length;
      const remaining = ATTACHMENT_MAX_FILES - currentValidCount;

      if (remaining <= 0) {
        setAttachmentError(`Maximum ${ATTACHMENT_MAX_FILES} files already added.`);
        return prev;
      }

      const toProcess = incomingArr.slice(0, remaining);
      const skipped = incomingArr.length - toProcess.length;

      const newItems: AttachedFile[] = toProcess.map(file => {
        const ext = getFileExtension(file.name);
        const isValidType =
          (ACCEPTED_EXTENSIONS as readonly string[]).includes(ext) &&
          ACCEPTED_MIME_TYPES.includes(file.type);
        const isValidSize = file.size <= ATTACHMENT_MAX_SIZE_BYTES;
        const isDupe = isDuplicateFile(file, prev);

        if (isDupe) {
          return {
            id: tempId(), file, name: file.name, size: file.size, extension: ext,
            status: 'error_duplicate' as const,
            errorMessage: `"${file.name}" is already in the list.`,
            addedAt: new Date(),
          };
        }
        if (!isValidType) {
          return {
            id: tempId(), file, name: file.name, size: file.size, extension: ext,
            status: 'error_type' as const,
            errorMessage: `Unsupported file type (.${ext || 'unknown'}). Accepted: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG, JPG.`,
            addedAt: new Date(),
          };
        }
        if (!isValidSize) {
          return {
            id: tempId(), file, name: file.name, size: file.size, extension: ext,
            status: 'error_size' as const,
            errorMessage: `File is ${formatFileSize(file.size)} — max allowed is ${formatFileSize(ATTACHMENT_MAX_SIZE_BYTES)}.`,
            addedAt: new Date(),
          };
        }
        return {
          id: tempId(), file, name: file.name, size: file.size, extension: ext,
          status: 'valid' as const,
          errorMessage: undefined,
          addedAt: new Date(),
        };
      });

      if (skipped > 0) {
        setAttachmentError(
          `${skipped} file${skipped > 1 ? 's were' : ' was'} not added — maximum ${ATTACHMENT_MAX_FILES} files allowed.`
        );
      } else {
        setAttachmentError('');
      }

      return [...prev, ...newItems];
    });
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
    setAttachmentError('');
  }, []);

  const dismissErrorFile = useCallback((fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const dismissAllErrors = useCallback(() => {
    setAttachedFiles(prev => prev.filter(f => f.status === 'valid'));
  }, []);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isAtLimit) setIsDraggingOver(true);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isAtLimit) setIsDraggingOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear when the drag leaves the zone entirely, not just a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (!isAtLimit) processNewFiles(e.dataTransfer.files);
  };
  const handleZoneClick = () => {
    if (!isAtLimit) fileInputRef.current?.click();
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isAtLimit) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 lg:p-6 shadow-sm">

      {/* Section header */}
      <div className="flex items-center space-x-3 mb-4 lg:mb-6 pb-3 border-b border-gray-100">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Paperclip className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Attachments
            <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
          </h2>
          <p className="text-xs text-gray-500">Proposals, contracts, briefs, or supporting files</p>
        </div>
        {attachedFiles.length > 0 && (
          <span className="text-xs text-gray-400">
            {validFiles.length}/{ATTACHMENT_MAX_FILES} files
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={handleZoneClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={
          isAtLimit
            ? 'Maximum files reached. Remove a file to add another.'
            : `Add up to ${slotsRemaining} more file${slotsRemaining !== 1 ? 's' : ''}. Press Enter or Space to browse.`
        }
        aria-disabled={isAtLimit}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
          isAtLimit
            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
            : isDraggingOver
            ? 'border-indigo-400 bg-indigo-50 scale-[1.01] cursor-copy'
            : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50 cursor-pointer'
        }`}
      >
        {isAtLimit ? (
          <>
            <p className="text-2xl mb-1">✅</p>
            <p className="text-sm font-medium text-gray-500">Maximum {ATTACHMENT_MAX_FILES} files added</p>
            <p className="text-xs text-gray-400 mt-1">Remove a file below to add another</p>
          </>
        ) : isDraggingOver ? (
          <>
            <p className="text-2xl mb-1">📂</p>
            <p className="text-sm font-medium text-indigo-600">Drop files here</p>
          </>
        ) : (
          <>
            <p className="text-2xl mb-1">☁️</p>
            <p className="text-sm font-medium text-gray-700">
              Drag files here or{' '}
              <span className="text-indigo-500 underline underline-offset-2">click to browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG, JPG · 25 MB max per file
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {slotsRemaining} slot{slotsRemaining !== 1 ? 's' : ''} remaining
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.map(e => `.${e}`).join(',')}
          className="hidden"
          onChange={e => {
            if (e.target.files) processNewFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Quota bar — shown once at least one file is present */}
      {attachedFiles.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              <span className="font-medium text-gray-700">{validFiles.length}</span>
              {' / '}{ATTACHMENT_MAX_FILES} files
            </span>
            <span>
              <span className="font-medium text-gray-700">{formatFileSize(totalValidSizeBytes)}</span>
              {' / 250 MB total'}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${quotaBarColor}`}
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
          {quotaPercent >= 90 && (
            <p className="text-xs text-red-600">
              Storage almost full —{' '}
              {formatFileSize(ATTACHMENT_TOTAL_QUOTA_BYTES - totalValidSizeBytes)} remaining
            </p>
          )}
        </div>
      )}

      {/* Error banner */}
      {attachmentError && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
        >
          <span className="text-base flex-shrink-0 leading-none mt-0.5">⚠️</span>
          <p className="flex-1 text-xs text-amber-800">{attachmentError}</p>
          <button
            type="button"
            onClick={() => setAttachmentError('')}
            className="flex-shrink-0 text-amber-400 hover:text-amber-700 transition-colors font-medium"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Error file summary row */}
      {errorFiles.length > 0 && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-red-600">
            ⚠️ {errorFiles.length} file{errorFiles.length > 1 ? 's' : ''} could not be added — see errors below
          </span>
          <button
            type="button"
            onClick={dismissAllErrors}
            className="text-xs text-gray-500 hover:text-red-500 underline underline-offset-2 transition-colors"
          >
            Dismiss all errors
          </button>
        </div>
      )}

      {/* File list */}
      {attachedFiles.length > 0 && (
        <ul className="mt-3 space-y-2">
          {attachedFiles.map(file => {
            const config = FILE_TYPE_CONFIG[file.extension] ?? DEFAULT_FILE_CONFIG;
            const isError = file.status !== 'valid';
            return (
              <li
                key={file.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                  isError
                    ? 'bg-red-50 border-red-200'
                    : `${config.bgColor} ${config.borderColor}`
                }`}
              >
                {/* Type icon */}
                <span className="text-2xl flex-shrink-0 leading-none">
                  {isError ? '⚠️' : config.icon}
                </span>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isError ? 'text-red-700' : 'text-gray-800'}`}>
                    {file.name}
                  </p>
                  {isError ? (
                    <p className="text-xs text-red-600 mt-0.5">{file.errorMessage}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {config.label} · {formatFileSize(file.size)}
                    </p>
                  )}
                </div>

                {/* Type badge — valid files only, hidden on mobile to save space */}
                {!isError && (
                  <span className={`hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${config.badgeColor} ${config.textColor}`}>
                    {config.label}
                  </span>
                )}

                {/* Remove / dismiss button — larger tap target on mobile */}
                <button
                  type="button"
                  onClick={() => isError ? dismissErrorFile(file.id) : removeFile(file.id)}
                  title={isError ? 'Dismiss' : `Remove ${file.name}`}
                  className="w-9 h-9 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 text-base sm:text-sm font-medium"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
