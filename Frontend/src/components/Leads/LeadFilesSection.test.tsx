import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Lead files (Group B item 12) — the existing Documents system. Pins: the list
 * is the lead's own documents, an upload is linked to the lead and reported only
 * after the server stored it, and failures are shown, never swallowed.
 */
const docs = vi.hoisted(() => ({ loadDocuments: vi.fn(), uploadDocument: vi.fn(), downloadDocument: vi.fn() }));
vi.mock('../../services/documentsService', () => ({ documentsService: docs }));

import LeadFilesSection from './LeadFilesSection';

const DOC = { id: 'DOC1', name: 'security-requirements.pdf', file_size: 1887436, created_at: '2026-10-02T09:00:00Z', owner_name: 'David Kumar' };

beforeEach(() => {
  vi.clearAllMocks();
  docs.loadDocuments.mockResolvedValue({ data: [DOC], count: 1 });
});

describe('LeadFilesSection', () => {
  it('lists the lead\'s documents with size, date and a download', async () => {
    render(<LeadFilesSection leadId="42" />);
    expect(await screen.findByText('security-requirements.pdf')).toBeInTheDocument();
    expect(docs.loadDocuments).toHaveBeenCalledWith({ entity_type: 'lead', entity_id: '42', limit: 50 });
    expect(screen.getByText(/1\.8 MB · 2 Oct 2026 · David Kumar/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Download security-requirements.pdf' }));
    expect(docs.downloadDocument).toHaveBeenCalledWith('DOC1');
  });

  it('uploads linked to THIS lead, and reports it only after the server stored it', async () => {
    let resolve!: (v: unknown) => void;
    docs.uploadDocument.mockImplementation(() => new Promise(r => { resolve = r; }));
    const onUploaded = vi.fn();
    render(<LeadFilesSection leadId="42" ownerName="David Kumar" onUploaded={onUploaded} />);
    await screen.findByText('security-requirements.pdf');
    const file = new File(['x'], 'org-chart.png', { type: 'image/png' });
    await userEvent.upload(screen.getByLabelText('Choose a file to attach'), file);
    expect(docs.uploadDocument).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'org-chart.png', related_entity_type: 'lead', related_entity_id: '42', owner_name: 'David Kumar' }),
      expect.any(Function),
    );
    expect(onUploaded).not.toHaveBeenCalled();
    resolve({ id: 'DOC2' });
    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith('org-chart.png'));
    expect(docs.loadDocuments).toHaveBeenCalledTimes(2);   // refreshed after the upload
  });

  it('an upload refusal is shown verbatim and nothing is reported', async () => {
    docs.uploadDocument.mockRejectedValue(new Error('"big.zip" is 30.0 MB. The limit is 25 MB.'));
    const onUploaded = vi.fn();
    render(<LeadFilesSection leadId="42" onUploaded={onUploaded} />);
    await screen.findByText('security-requirements.pdf');
    await userEvent.upload(screen.getByLabelText('Choose a file to attach'), new File(['x'], 'big.zip'));
    expect(await screen.findByRole('alert')).toHaveTextContent('The limit is 25 MB.');
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it('a failed load is an error with Retry — never "No files attached"', async () => {
    docs.loadDocuments.mockRejectedValue(new Error('500'));
    render(<LeadFilesSection leadId="42" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Files could not load');
    expect(screen.queryByText('No files attached yet.')).toBeNull();
  });
});
