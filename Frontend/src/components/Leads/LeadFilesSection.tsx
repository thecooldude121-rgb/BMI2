import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Download, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import Alert from '../ui/Alert';
import EmptyState from '../ui/EmptyState';
import { documentsService } from '../../services/documentsService';
import type { Document } from '../../services/documentsService';

/**
 * A lead's files (Group B item 12, v1 approved 2026-10-05): the EXISTING
 * Documents system, local disk, no new storage. Files are documents with
 * module 'lead' and the lead's id — the server proves that id belongs to the
 * caller's workspace on upload (documentsController.parentRefError) and
 * serves the bytes only through the authenticated /documents/:id/content.
 *
 * Upload success is reported only after the server returns the stored record;
 * a refusal (size, type, workspace) is shown verbatim. Deleting stays in the
 * Documents library, where it is limited to admins and managers.
 */
export interface LeadFilesSectionProps {
  leadId: string;
  ownerName?: string;
  onUploaded?: (name: string) => void;
}

const fmtSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const LeadFilesSection: React.FC<LeadFilesSectionProps> = ({ leadId, ownerName, onUploaded }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<Document[]>([]);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const load = useCallback(() => {
    setState('loading');
    documentsService.loadDocuments({ entity_type: 'lead', entity_id: leadId, limit: 50 })
      .then(r => { setFiles(r.data); setState('ok'); })
      .catch(e => { setLoadError(e instanceof Error ? e.message : 'Files could not be loaded.'); setState('error'); });
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    setProgress(0);
    try {
      await documentsService.uploadDocument({
        name: file.name, file, category: 'Other', owner_name: ownerName ?? '',
        related_entity_type: 'lead', related_entity_id: leadId,
      }, p => setProgress(p));
      onUploaded?.(file.name);
      load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'The file was not uploaded.');
    } finally {
      setProgress(null);
    }
  };

  const download = async (doc: Document) => {
    setDownloadError(null);
    try { await documentsService.downloadDocument(doc.id); }
    catch (err) { setDownloadError(err instanceof Error ? err.message : 'The file could not be downloaded.'); }
  };

  return (
    <div className="flex flex-col gap-2" data-testid="lead-files">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" className="sr-only" aria-label="Choose a file to attach" onChange={e => void onPick(e)} />
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} loading={progress !== null}
          leadingIcon={<Upload className="h-3.5 w-3.5" />}>
          {progress !== null ? `Uploading ${Math.round(progress)}%` : 'Upload file'}
        </Button>
        <span className="text-xs text-ink-muted">Up to 25 MB. Kept in Documents, linked to this lead.</span>
      </div>
      {uploadError && <Alert tone="danger" title="The file was not uploaded">{uploadError}</Alert>}
      {downloadError && <Alert tone="danger" title="Download failed">{downloadError}</Alert>}
      {state === 'loading' && <p className="text-xs text-ink-muted" role="status">Loading files…</p>}
      {state === 'error' && (
        <EmptyState tone="error" title="Files could not load" reason={loadError ?? 'The server did not answer.'}
          action={<Button variant="secondary" size="sm" onClick={load}>Retry</Button>} />
      )}
      {state === 'ok' && files.length === 0 && <p className="text-xs text-ink-muted">No files attached yet.</p>}
      {state === 'ok' && files.length > 0 && (
        <ul className="flex flex-col divide-y divide-line">
          {files.map(f => (
            <li key={f.id} className="flex items-center gap-2 py-2">
              <FileText className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{f.name}</p>
                <p className="text-xs text-ink-muted">{fmtSize(f.file_size)} · {fmtDate(f.created_at)}{f.owner_name ? ` · ${f.owner_name}` : ''}</p>
              </div>
              <Button variant="ghost" size="sm" iconOnly aria-label={`Download ${f.name}`}
                leadingIcon={<Download className="h-3.5 w-3.5" />} onClick={() => void download(f)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LeadFilesSection;
