// ─── Attachment Configuration ─────────────────────────────────────────────────
// All file-upload limits and accepted types in one place.
// Change here to update validation everywhere — no scattered magic numbers.

export const ATTACHMENT_CONFIG = {
  maxFiles: 10,
  maxFileSizeBytes: 25 * 1024 * 1024,      // 25 MB per file
  maxTotalSizeBytes: 100 * 1024 * 1024,    // 100 MB total across all files

  // MIME types accepted by the file input and validated on drop
  acceptedMimeTypes: new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
  ]),

  // Human-readable string for the file input accept attribute and helper text
  acceptedExtensions: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg',
  acceptedLabel: 'PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG, JPG',
} as const;

/** Returns a human-readable file size string. */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return                             `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Returns null if the file is valid, or an error string if not. */
export const validateAttachmentFile = (
  file: File,
  existingTotalBytes: number
): string | null => {
  if (!ATTACHMENT_CONFIG.acceptedMimeTypes.has(file.type)) {
    return `${file.name}: unsupported file type`;
  }
  if (file.size > ATTACHMENT_CONFIG.maxFileSizeBytes) {
    return `${file.name}: exceeds the 25 MB per-file limit`;
  }
  if (existingTotalBytes + file.size > ATTACHMENT_CONFIG.maxTotalSizeBytes) {
    return `Adding ${file.name} would exceed the 100 MB total limit`;
  }
  return null;
};
