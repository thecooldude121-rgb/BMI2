// ─── Attachment constants ──────────────────────────────────────────────────────

export const ATTACHMENT_MAX_FILES = 10;
export const ATTACHMENT_MAX_SIZE_MB = 25;
export const ATTACHMENT_MAX_SIZE_BYTES = 25 * 1024 * 1024;
export const ATTACHMENT_TOTAL_QUOTA_BYTES = 10 * 25 * 1024 * 1024; // 250 MB

export const ACCEPTED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg',
] as const;

export const ACCEPTED_MIME_TYPES: readonly string[] = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
];

// ─── AttachedFile type ────────────────────────────────────────────────────────

export type AttachedFileStatus = 'valid' | 'error_size' | 'error_type' | 'error_duplicate';

export interface AttachedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  extension: string;
  status: AttachedFileStatus;
  errorMessage: string | undefined;
  addedAt: Date;
}

// ─── File type config ─────────────────────────────────────────────────────────

interface FileTypeConfig {
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  badgeColor: string;
  label: string;
}

export const FILE_TYPE_CONFIG: Record<string, FileTypeConfig> = {
  pdf:  { icon: '📄', bgColor: 'bg-red-50',    textColor: 'text-red-700',    borderColor: 'border-red-200',    badgeColor: 'bg-red-100',    label: 'PDF' },
  doc:  { icon: '📝', bgColor: 'bg-blue-50',   textColor: 'text-blue-700',   borderColor: 'border-blue-200',   badgeColor: 'bg-blue-100',   label: 'Word' },
  docx: { icon: '📝', bgColor: 'bg-blue-50',   textColor: 'text-blue-700',   borderColor: 'border-blue-200',   badgeColor: 'bg-blue-100',   label: 'Word' },
  xls:  { icon: '📊', bgColor: 'bg-green-50',  textColor: 'text-green-700',  borderColor: 'border-green-200',  badgeColor: 'bg-green-100',  label: 'Excel' },
  xlsx: { icon: '📊', bgColor: 'bg-green-50',  textColor: 'text-green-700',  borderColor: 'border-green-200',  badgeColor: 'bg-green-100',  label: 'Excel' },
  ppt:  { icon: '📋', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200', badgeColor: 'bg-orange-100', label: 'PowerPoint' },
  pptx: { icon: '📋', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200', badgeColor: 'bg-orange-100', label: 'PowerPoint' },
  png:  { icon: '🖼️', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200', badgeColor: 'bg-purple-100', label: 'Image' },
  jpg:  { icon: '🖼️', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200', badgeColor: 'bg-purple-100', label: 'Image' },
  jpeg: { icon: '🖼️', bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200', badgeColor: 'bg-purple-100', label: 'Image' },
};

export const DEFAULT_FILE_CONFIG: FileTypeConfig = {
  icon: '📎',
  bgColor: 'bg-gray-50',
  textColor: 'text-gray-700',
  borderColor: 'border-gray-200',
  badgeColor: 'bg-gray-100',
  label: 'File',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot === -1 || dot === filename.length - 1) return '';
  return filename.slice(dot + 1).toLowerCase();
}

export function isDuplicateFile(newFile: File, existing: AttachedFile[]): boolean {
  return existing.some(f => f.name === newFile.name && f.size === newFile.size);
}
