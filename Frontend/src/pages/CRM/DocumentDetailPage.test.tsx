import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

/**
 * H1 (2026-10-13) — Document detail shows the stored row and saves for real.
 *
 * Replaces the share-picker tests: the page's share modal is gone (sharing has
 * no table, endpoint or permission model — CLAUDE.md "Document sharing does not
 * exist"), and Share is a disabled "Coming soon". The roster-consistency
 * property those tests guarded now applies only to the surfaces that still
 * render a picker (the library and the upload modal).
 */
const api = vi.hoisted(() => ({
  fetchDocument: vi.fn(), updateDocument: vi.fn(), deleteDocument: vi.fn(), downloadDocument: vi.fn(),
}));
vi.mock('../../utils/documentsApi', () => api);

import DocumentDetailPage from './DocumentDetailPage';

const row = (over: Record<string, unknown> = {}) => ({
  id: 'doc-1', name: 'Proposal.pdf', file_url: null, file_type: 'application/pdf', file_size: 2048,
  category: 'Proposal', description: 'Old text', module: null, record_id: null, version: 2, tags: ['q4'],
  uploaded_by: 'David Kumar', created_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-09-02T00:00:00.000Z',
  storage_key: 'k/1', checksum_sha256: null, ...over,
});
let stored = row();
beforeEach(() => {
  vi.clearAllMocks();
  stored = row();
  api.fetchDocument.mockImplementation(async () => ({ ok: true, document: stored }));
  api.updateDocument.mockImplementation(async (_id: string, patch: Record<string, unknown>) => { stored = { ...stored, ...patch }; return { ok: true }; });
  api.deleteDocument.mockResolvedValue({ ok: true });
  api.downloadDocument.mockResolvedValue({ ok: true });
});
const renderPage = () => render(
  <MemoryRouter initialEntries={['/crm/documents/doc-1']}>
    <Routes>
      <Route path="/crm/documents/:documentId" element={<DocumentDetailPage />} />
      <Route path="/crm/documents" element={<p>library</p>} />
    </Routes>
  </MemoryRouter>,
);

describe('Document detail — real saves, nothing local-only', () => {
  it('the description saves through the API and the page shows the RELOADED row', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const box = screen.getByLabelText('Description');
    await user.clear(box); await user.type(box, 'Signed copy');
    await user.click(screen.getByRole('button', { name: 'Save description' }));
    expect(api.updateDocument).toHaveBeenCalledWith('doc-1', { description: 'Signed copy' });
    expect(await screen.findByText('Description saved.')).toBeInTheDocument();
    expect(screen.getByTestId('doc-description')).toHaveTextContent('Signed copy');
    expect(api.fetchDocument).toHaveBeenCalledTimes(2);
  });

  it('a refused description save keeps the editor and says it was not saved', async () => {
    api.updateDocument.mockResolvedValue({ ok: false, message: 'Could not save (500).' });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    await user.type(screen.getByLabelText('Description'), ' more');
    await user.click(screen.getByRole('button', { name: 'Save description' }));
    expect(await screen.findByText('The description was not saved — Could not save (500).')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toHaveValue('Old text more');
    expect(screen.queryByText('Description saved.')).toBeNull();
  });

  it('tags are written to documents.tags — add and remove', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByLabelText('New tag'), 'signed');
    await user.click(screen.getByRole('button', { name: /Add/ }));
    expect(api.updateDocument).toHaveBeenCalledWith('doc-1', { tags: ['q4', 'signed'] });
    await within(screen.getByRole('list', { name: 'Tags' })).findByText('signed');
    await user.click(screen.getByRole('button', { name: 'Remove tag q4' }));
    expect(api.updateDocument).toHaveBeenLastCalledWith('doc-1', { tags: ['signed'] });
  });

  it('Delete calls the API and leaves the page ONLY after it succeeds; a 403 is shown verbatim', async () => {
    api.deleteDocument.mockResolvedValueOnce({ ok: false, message: 'Insufficient permissions' });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Delete document/ }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete document' }));
    expect(await screen.findByText('“Proposal.pdf” was not deleted — Insufficient permissions')).toBeInTheDocument();
    expect(screen.queryByText('library')).toBeNull();

    await user.click(screen.getByRole('button', { name: /Delete document/ }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete document' }));
    expect(await screen.findByText('library')).toBeInTheDocument();
    expect(api.deleteDocument).toHaveBeenCalledTimes(2);
  });

  it('no comments, sharing, versions or activity log; Share and Archive are disabled', async () => {
    const { container } = renderPage();
    await screen.findByRole('button', { name: 'Edit' });
    expect(screen.getByTitle('Sharing a document is coming soon')).toBeDisabled();
    expect(screen.getByTitle('Archiving is coming soon')).toBeDisabled();
    for (const gone of [/Post comment/i, /Restore/i, /Upload new version/i, /viewed document/i, /Send via email/i]) {
      expect(container.textContent ?? '', String(gone)).not.toMatch(gone);
    }
  });

  it('a missing document says so; an unreachable server is an error, not "not found"', async () => {
    api.fetchDocument.mockResolvedValueOnce({ ok: false, notFound: true, message: 'Not found' });
    const { unmount } = renderPage();
    expect(await screen.findByText('Document not found')).toBeInTheDocument();
    unmount();
    api.fetchDocument.mockResolvedValueOnce({ ok: false, notFound: false, message: 'Could not reach the server.' });
    renderPage();
    expect(await screen.findByText('The document could not load')).toBeInTheDocument();
  });
});
