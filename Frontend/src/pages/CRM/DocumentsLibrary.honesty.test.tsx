import { it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * H2 (2026-10-14): no fabricated view / download counts, no sorts on fields
 * that do not exist, and Download fetches the real file.
 */
const toast = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ showToast: toast }) }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: '5', name: 'Dee Admin', role: 'Admin' } }) }));

import DocumentsLibrary from './DocumentsLibrary';

const ROW = {
  id: 'doc-1', name: 'Kora proposal.pdf', file_type: 'application/pdf', file_size: 2048, category: 'Proposal',
  description: null, module: null, record_id: null, version: 1, tags: [], uploaded_by: 'Dee Admin',
  created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z', storage_key: 'k', is_starred: false,
};
const calls: string[] = [];
afterEach(() => { vi.unstubAllGlobals(); calls.length = 0; toast.mockReset(); });

it('shows no view/download counts or sorts, and Download hits the content endpoint', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    calls.push(String(url));
    if (String(url).includes('/content')) return new Response(new Blob(['%PDF']), { status: 200, headers: { 'Content-Disposition': 'attachment; filename="Kora proposal.pdf"' } });
    if (String(url).includes('/favorites')) return new Response(JSON.stringify({ data: [] }), { status: 200 });
    return new Response(JSON.stringify({ data: [ROW], count: 1 }), { status: 200 });
  }));
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} }));
  const { container } = render(<MemoryRouter><DocumentsLibrary /></MemoryRouter>);
  await screen.findAllByText('Kora proposal.pdf');
  expect(container.textContent).not.toMatch(/\d+ views|\d+ downloads|Most Viewed|Most Downloaded|you viewed|View All \(\d+\)/);
  // Both download controls — the recent strip's and the card's — fetch the file.
  const buttons = screen.getAllByTitle('Download');
  expect(buttons.length).toBe(2);
  for (const btn of buttons) {
    calls.length = 0; toast.mockReset();
    await userEvent.click(btn);
    await waitFor(() => expect(calls.some(u => u.includes('/documents/doc-1/content'))).toBe(true));
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Downloaded Kora proposal.pdf', 'success'));
  }
});
