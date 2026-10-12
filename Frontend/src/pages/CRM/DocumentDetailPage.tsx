import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Download, Share2, Archive, Trash2, X, Plus, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, SectionHeading } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { inputClass, textareaClass } from '../../components/ui/Field';
import PageHeader from '../../components/Layout/PageHeader';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { fetchDocument, downloadDocument, updateDocument, deleteDocument, type DocumentRecord } from '../../utils/documentsApi';

/**
 * Document detail — H1 (2026-10-13). Everything on this page is the stored
 * document; every action is a real request or is labelled "Coming soon".
 *
 * WHAT THIS REPLACED (1,357 lines). The page loaded the real row, then:
 *   - "Description updated successfully" after setting local state only;
 *   - comments and replies "posted successfully" into React state (there is no
 *     comments table) — gone on reload;
 *   - tags added and removed locally while `documents.tags` exists and was never written;
 *   - "Sharing access removed" over a sharing model that does not exist;
 *   - "Opening editor…", "File upload feature coming soon", "Email composer…"
 *     shown as SUCCESS toasts over console.log;
 *   - a restore-version action over a version list that is always empty;
 *   - a Delete that said it was unavailable and then navigated back to the
 *     library anyway, which reads as a delete that worked;
 *   - an activity log written in the browser on every view, by the viewer;
 *   - breadcrumb links that toasted "Navigating…" and waited a second.
 *
 * Now: description and tags save through PUT /documents/:id and the page
 * reloads the row (success only after the 2xx); Download fetches the real bytes;
 * Delete is DELETE /documents/:id (admin / manager — a refusal is shown
 * verbatim); Share and Archive are disabled "Coming soon"; related records,
 * versions, comments, sharing and activity are listed as not recorded.
 */

const fmtSize = (v: DocumentRecord['file_size']) => {
  const n = typeof v === 'string' ? Number(v) : v;
  if (n == null || !Number.isFinite(n)) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null;

const DocumentDetailPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ notFound: boolean; message: string } | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState<'description' | 'tags' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!documentId) return;
    const r = await fetchDocument(documentId);
    if (r.ok) { setDoc(r.document); setDescription(r.document.description ?? ''); setLoadError(null); }
    else { setDoc(null); setLoadError({ notFound: r.notFound, message: r.message }); }
    setLoading(false);
  }, [documentId]);
  useEffect(() => { setLoading(true); void load(); }, [load]);

  const tags = doc?.tags ?? [];

  const saveDescription = async () => {
    if (!doc) return;
    setSaving('description'); setActionError(null); setNotice(null);
    const r = await updateDocument(doc.id, { description: description.trim() });
    setSaving(null);
    if (!r.ok) { setActionError(`The description was not saved — ${r.message}`); return; }
    await load();
    setEditingDescription(false);
    setNotice('Description saved.');
  };

  const saveTags = async (next: string[], done: string) => {
    if (!doc) return;
    setSaving('tags'); setActionError(null); setNotice(null);
    const r = await updateDocument(doc.id, { tags: next });
    setSaving(null);
    if (!r.ok) { setActionError(`The tags were not saved — ${r.message}`); return; }
    await load();
    setNewTag('');
    setNotice(done);
  };
  const addTag = () => {
    const t = newTag.trim();
    if (!t) return;
    if (tags.some(x => x.toLowerCase() === t.toLowerCase())) { setActionError(`“${t}” is already a tag.`); return; }
    void saveTags([...tags, t], `Tag “${t}” added.`);
  };

  const download = async () => {
    if (!doc) return;
    setActionError(null); setNotice(null);
    const r = await downloadDocument(doc.id, doc.name);
    if (r.ok) setNotice(`Downloaded ${doc.name}.`);
    else setActionError(r.message ?? 'The download failed.');
  };

  const remove = async () => {
    if (!doc) return;
    setDeleting(true);
    const r = await deleteDocument(doc.id);
    setDeleting(false);
    setConfirmDelete(false);
    if (!r.ok) { setActionError(`“${doc.name}” was not deleted — ${r.message}`); return; }
    // Navigation only AFTER the server confirmed.
    navigate('/crm/documents', { replace: true });
  };

  if (loading) return <p className="py-12 text-center text-sm text-ink-muted">Loading document…</p>;
  if (loadError || !doc) {
    return (
      <EmptyState
        tone={loadError?.notFound ? undefined : 'error'}
        title={loadError?.notFound ? 'Document not found' : 'The document could not load'}
        reason={loadError?.notFound ? 'It may have been deleted, or the link is wrong.' : loadError?.message ?? ''}
        action={<Button variant="secondary" onClick={() => navigate('/crm/documents')}>Back to Documents</Button>}
      />
    );
  }

  const meta = [
    doc.category,
    doc.version != null ? `Version ${doc.version}` : null,
    doc.uploaded_by ? `uploaded by ${doc.uploaded_by}` : null,
    doc.created_at ? `on ${new Date(doc.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}` : null,
  ].filter(Boolean).join(' · ');
  // A stored upload is served by the content endpoint; a linked document has only a URL.
  const linkOnly = !doc.storage_key && !!doc.file_url;

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link to="/crm/documents" className="font-medium text-brand-600 hover:underline">Documents</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{doc.name}</span>
      </nav>

      <PageHeader
        eyebrow="Document detail"
        title={doc.name}
        description={meta || undefined}
        actions={
          <>
            {linkOnly && (
              <Button variant="secondary" onClick={() => window.open(doc.file_url!, '_blank', 'noopener')}>
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> Open link
              </Button>
            )}
            {!linkOnly && (
              <Button onClick={() => void download()}><Download className="h-4 w-4" aria-hidden="true" /> Download</Button>
            )}
            <Button variant="secondary" disabled title="Sharing a document is coming soon">
              <Share2 className="h-4 w-4" aria-hidden="true" /> Share · Coming soon
            </Button>
          </>
        }
      />

      {notice && <Alert tone="success" title={notice} action={<Button variant="link" onClick={() => setNotice(null)}>Dismiss</Button>} />}
      {actionError && <Alert tone="danger" title={actionError} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-3">
            <SectionHeading
              title="Description"
              actions={!editingDescription && <Button variant="secondary" onClick={() => setEditingDescription(true)}>Edit</Button>}
            />
            {editingDescription ? (
              <>
                <label className="sr-only" htmlFor="doc-description">Description</label>
                <textarea id="doc-description" className={textareaClass()} value={description} onChange={e => setDescription(e.target.value)} />
                <div className="flex gap-2">
                  <Button onClick={() => void saveDescription()} disabled={saving === 'description'}>
                    {saving === 'description' ? 'Saving…' : 'Save description'}
                  </Button>
                  <Button variant="secondary" disabled={saving === 'description'}
                    onClick={() => { setDescription(doc.description ?? ''); setEditingDescription(false); }}>Cancel</Button>
                </div>
              </>
            ) : (
              <p className="whitespace-pre-wrap text-sm text-ink" data-testid="doc-description">
                {doc.description?.trim() || <span className="text-ink-muted">No description.</span>}
              </p>
            )}
          </Card>

          <Card className="space-y-3">
            <SectionHeading title="Tags" />
            {tags.length === 0 && <p className="text-sm text-ink-muted">No tags.</p>}
            <ul className="flex flex-wrap gap-2" aria-label="Tags">
              {tags.map(t => (
                <li key={t} className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1 text-xs text-ink">
                  {t}
                  <button type="button" aria-label={`Remove tag ${t}`} disabled={saving === 'tags'}
                    onClick={() => void saveTags(tags.filter(x => x !== t), `Tag “${t}” removed.`)}
                    className="rounded-full p-0.5 hover:bg-surface-panel disabled:opacity-50">
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="doc-new-tag">New tag</label>
              <input id="doc-new-tag" className={inputClass()} placeholder="Add a tag" value={newTag}
                onChange={e => setNewTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
              <Button variant="secondary" onClick={addTag} disabled={!newTag.trim() || saving === 'tags'}>
                <Plus className="h-4 w-4" aria-hidden="true" /> {saving === 'tags' ? 'Saving…' : 'Add'}
              </Button>
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <SectionHeading title="File details" />
            <dl className="mt-2 space-y-1.5 text-sm">
              {([
                ['Type', doc.file_type],
                ['Size', fmtSize(doc.file_size)],
                ['Version', doc.version != null ? String(doc.version) : null],
                ['Uploaded by', doc.uploaded_by],
                ['Uploaded', fmtDate(doc.created_at)],
                ['Updated', fmtDate(doc.updated_at)],
              ] as const).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="text-right text-ink">{v ?? <span className="text-ink-muted">Not recorded</span>}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="space-y-2">
            <SectionHeading title="Record actions" />
            <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete document
            </Button>
            <Button variant="secondary" className="w-full" disabled title="Archiving is coming soon">
              <Archive className="h-4 w-4" aria-hidden="true" /> Archive · Coming soon
            </Button>
            <p className="text-xs text-ink-muted">Deleting is available to admins and managers, and removes the stored file.</p>
          </Card>

          <Card className="space-y-2">
            <SectionHeading title="Unavailable information" />
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
              <li>Related deal, account or contacts — the record link is not resolved yet.</li>
              <li>Version history, comments, sharing and an activity log — none of these are recorded.</li>
              <li>Views and downloads — not tracked.</li>
            </ul>
          </Card>
        </aside>
      </div>

      <ConfirmationModal
        isOpen={confirmDelete}
        type="danger"
        title="Delete document"
        message={`Delete “${doc.name}”? The stored file is removed too.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete document'}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => { void remove(); }}
      />
    </div>
  );
};

export default DocumentDetailPage;
