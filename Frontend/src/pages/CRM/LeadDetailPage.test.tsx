import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { Lead } from '../../types/lead';

/**
 * Lead detail (Figma phase 3). These pin the WIRING the rebuild fixed, not the
 * pixels: every write waits for the server, the timeline is server rows only,
 * a failed source is never an empty timeline, and the fake controls are gone.
 */

const api = vi.hoisted(() => ({
  fetchLeadByIdFromAPI: vi.fn(),
  fetchActivitiesFromAPI: vi.fn(),
  fetchNotesFromAPI: vi.fn(),
  fetchLeadStageHistory: vi.fn(),
  createActivityViaAPI: vi.fn(),
  createNoteViaAPI: vi.fn(),
}));
vi.mock('../../utils/leadsApi', async () => ({ ...(await vi.importActual<object>('../../utils/leadsApi')), ...api }));

const toast = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ showToast: toast }) }));

const ctx = vi.hoisted(() => ({
  updateLead: vi.fn(async () => true),
  deleteLead: vi.fn(async () => true),
  leads: [] as Lead[],
  lastWriteErrorRef: { current: null as string | null },
}));
vi.mock('../../contexts/LeadContext', () => ({ useLeads: () => ctx }));
const docs = vi.hoisted(() => ({ loadDocuments: vi.fn(async () => ({ data: [], count: 0 })), uploadDocument: vi.fn(), downloadDocument: vi.fn() }));
vi.mock('../../services/documentsService', () => ({ documentsService: docs }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 5, name: 'David Kumar' } }) }));
vi.mock('../../hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));

// The composer is stubbed: these tests are about what the PAGE does with a
// submitted activity. It renders the page's `error` and `submitting` props.
vi.mock('../../components/Leads/OutreachComposer', () => ({
  default: ({ initialChannel, onSubmit, error, submitting }: {
    initialChannel: string; onSubmit: (a: object) => void; error?: string | null; submitting?: boolean;
  }) => (
    <div role="dialog" aria-label="composer">
      {error && <p role="alert">{error}</p>}
      <button disabled={submitting} onClick={() => onSubmit(initialChannel === 'note'
        ? { type: 'note', status: 'completed', subject: 'Note', description: 'Wants UAE hosting' }
        : { type: 'call', direction: 'outbound', status: 'completed', subject: 'Outbound call with Amina', outcome: 'Connected', completed_at: '2026-10-05T10:00:00Z' })}>
        submit {initialChannel}
      </button>
    </div>
  ),
}));
vi.mock('../../components/Leads/LeadConversionWizard', () => ({ default: () => null }));
vi.mock('../../components/Leads/MergeReviewModal', () => ({ default: () => null }));

import LeadDetailPage from './LeadDetailPage';

const LEAD: Lead = {
  id: '42', first_name: 'Amina', last_name: 'Farsi', full_name: 'Amina Farsi',
  email: 'amina@example.test', phone: '+971 50 000 0000', company: 'GulfAxis', position: 'Director',
  industry: 'Banking', status: 'new', score: 40, source: 'Website', owner_id: '', tags: [],
  custom_fields: {}, enrichment_data: {}, created_at: '2026-10-01T09:00:00Z', updated_at: '2026-10-02T09:00:00Z',
  created_by: '', temperature: 'cold', estimated_value: 0, probability: 0, currency: 'USD',
  email_opt_in: true, sms_opt_in: false, call_opt_in: true, do_not_contact: false, gdpr_consent: false,
  is_qualified: false, is_deleted: false, email_opens_count: 0, email_clicks_count: 0, page_views_count: 0,
  meeting_count: 0, call_count: 0, email_sent_count: 0, ai_recommendations: [], automation_paused: false,
} as unknown as Lead;

const renderPage = () => render(
  <MemoryRouter initialEntries={['/crm/leads/42']}>
    <Routes>
      <Route path="/crm/leads/:id" element={<LeadDetailPage />} />
      <Route path="/crm/leads" element={<p>leads list</p>} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  vi.clearAllMocks();
  ctx.leads = [];
  ctx.lastWriteErrorRef.current = null;
  api.fetchLeadByIdFromAPI.mockResolvedValue(LEAD);
  api.fetchActivitiesFromAPI.mockResolvedValue([]);
  api.fetchNotesFromAPI.mockResolvedValue([]);
  api.fetchLeadStageHistory.mockResolvedValue([]);
});

describe('LeadDetailPage — writes wait for the server', () => {
  it('logging a call POSTs the activity, and only THEN says "Call logged" and shows the server row', async () => {
    let resolvePost!: (v: unknown) => void;
    api.createActivityViaAPI.mockImplementation(() => new Promise(r => { resolvePost = r; }));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /log call/i }));
    await userEvent.click(screen.getByRole('button', { name: 'submit call' }));

    expect(api.createActivityViaAPI).toHaveBeenCalledWith('42', expect.objectContaining({
      type: 'call', status: 'completed', subject: 'Outbound call with Amina', outcome: 'Connected',
    }));
    // In flight: no success yet, and the submit is disabled against a double-save.
    expect(toast).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'submit call' })).toBeDisabled();

    api.fetchActivitiesFromAPI.mockResolvedValue([
      { id: 'a1', type: 'call', status: 'completed', subject: 'Outbound call with Amina', outcome: 'Connected', completed_at: '2026-10-05T10:00:00Z' },
    ]);
    resolvePost({ id: 'a1' });

    await waitFor(() => expect(toast).toHaveBeenCalledWith('Call logged', 'success'));
    expect(screen.queryByRole('dialog', { name: 'composer' })).toBeNull();
    expect(await within(await screen.findByTestId('lead-timeline')).findByText('Outbound call with Amina')).toBeInTheDocument();
  });

  it('a refused save keeps the composer open with the server message, and says nothing succeeded', async () => {
    api.createActivityViaAPI.mockRejectedValue(new Error('subject is required'));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /log call/i }));
    await userEvent.click(screen.getByRole('button', { name: 'submit call' }));

    expect(await within(screen.getByRole('dialog', { name: 'composer' })).findByRole('alert')).toHaveTextContent('subject is required');
    expect(toast).not.toHaveBeenCalledWith(expect.anything(), 'success');
  });

  it('a note goes to the notes endpoint and appears under Notes', async () => {
    api.createNoteViaAPI.mockResolvedValue({ id: 'n1' });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /add note/i }));
    api.fetchNotesFromAPI.mockResolvedValue([{ id: 'n1', content: 'Wants UAE hosting', created_at: '2026-10-05T10:00:00Z' }]);
    await userEvent.click(screen.getByRole('button', { name: 'submit note' }));

    expect(api.createNoteViaAPI).toHaveBeenCalledWith('42', { content: 'Wants UAE hosting' });
    expect(api.createActivityViaAPI).not.toHaveBeenCalled();
    expect(await within(await screen.findByTestId('lead-notes')).findByText('Wants UAE hosting')).toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith('Note saved', 'success');
  });

  it('a refused delete does not navigate away or claim success', async () => {
    ctx.deleteLead.mockResolvedValueOnce(false);
    ctx.lastWriteErrorRef.current = 'Only admins and managers can delete leads.';
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /more options/i }));
    await userEvent.click(screen.getByRole('button', { name: /delete lead/i }));
    await userEvent.click(within(screen.getByRole('dialog', { name: 'Delete lead' })).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith('Only admins and managers can delete leads.', 'error'));
    expect(screen.queryByText('leads list')).toBeNull();
  });
});

describe('LeadDetailPage — the timeline is server rows, and a failure is never "empty"', () => {
  it('renders stage-history moves with who made them and any override', async () => {
    api.fetchLeadStageHistory.mockResolvedValue([
      { id: 'h2', lead_id: 42, from_stage: 'new', to_stage: 'qualified', qualification_override: true,
        unmet_criteria: ['recorded contact'], reason: 'Met at expo', changed_by_user_id: 5, changed_by_name: 'David Kumar', changed_at: '2026-10-03T09:00:00Z' },
      { id: 'h1', lead_id: 42, from_stage: null, to_stage: 'new', qualification_override: false,
        unmet_criteria: null, reason: null, changed_by_user_id: 5, changed_by_name: 'David Kumar', changed_at: '2026-10-01T09:00:00Z' },
    ]);
    renderPage();
    const tl = await screen.findByTestId('lead-timeline');
    expect(within(tl).getByText('New → Qualified by David Kumar')).toBeInTheDocument();
    expect(within(tl).getByText(/Qualification gate overridden \(unmet: recorded contact\) · Reason: Met at expo/)).toBeInTheDocument();
    expect(within(tl).getByText('Lead created as New')).toBeInTheDocument();
  });

  it('a failed source is reported as a failure, not as "Nothing recorded yet"', async () => {
    api.fetchLeadStageHistory.mockRejectedValue(new Error('boom'));
    renderPage();
    expect(await screen.findByText('Stage history could not be loaded')).toBeInTheDocument();
    expect(screen.queryByText('Nothing recorded yet')).toBeNull();
  });

  it('a lead the server cannot load is an error with Retry — not "Lead not found"', async () => {
    api.fetchLeadByIdFromAPI.mockRejectedValue(new Error('500 Internal Server Error'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('This lead could not load');
    expect(screen.queryByText('Lead not found')).toBeNull();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});

describe('LeadDetailPage — no fake controls, no unexplained verdicts', () => {
  it('Edit opens the real editor route (it used to open a blank page, then was disabled)', async () => {
    render(
      <MemoryRouter initialEntries={['/crm/leads/42']}>
        <Routes>
          <Route path="/crm/leads/:id" element={<LeadDetailPage />} />
          <Route path="/crm/leads/:id/edit" element={<p>editor route</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(screen.getByText('editor route')).toBeInTheDocument();
  });

  it('has no re-enrich and no fake reminder; file upload is real (Group B item 12)', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1, name: 'Amina Farsi' });
    expect(screen.queryByText(/re-enrich/i)).toBeNull();
    expect(screen.queryByText(/set reminder/i)).toBeNull();
    expect(screen.getByRole('button', { name: /upload file/i })).toBeEnabled();
    expect(docs.loadDocuments).toHaveBeenCalledWith({ entity_type: 'lead', entity_id: '42', limit: 50 });
  });

  it('shows the stored score as a value, without stars or a "potential" verdict', async () => {
    renderPage();
    expect(await screen.findByText('Stored score 40')).toBeInTheDocument();
    expect(screen.queryByText(/⭐/)).toBeNull();
    expect(screen.queryByText(/potential/i)).toBeNull();
  });

  it('the score panel claims no "last updated" time it does not have (it used to show NOW)', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1, name: 'Amina Farsi' });
    expect(screen.queryByText(/last updated:/i)).toBeNull();
    expect(screen.queryByText(/auto-generated/i)).toBeNull();
  });

  it('the recommended action is "Coming soon" — no canned advice', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1, name: 'Amina Farsi' });
    expect(screen.queryByText(/contact this lead today/i)).toBeNull();
    expect(screen.queryByText(/within 24 hours/i)).toBeNull();
    expect(document.querySelector('[data-coming-soon="true"]')).toHaveTextContent('Recommended action');
  });

  it('shows the migration-063 fields, says "Not recorded" for empty ones, and never assumes a currency', async () => {
    api.fetchLeadByIdFromAPI.mockResolvedValue({
      ...LEAD, mobile: '+971 55 111 2222', company_size: '1000+', website: 'gulfaxis.example',
      city: 'Dubai', country: 'United Arab Emirates', estimated_value: 2200000, currency: null, priority: 'high',
    });
    renderPage();
    await screen.findByRole('heading', { level: 1, name: 'Amina Farsi' });
    const value = (label: string) => screen.getAllByText(label).find(el => el.tagName === 'DT')!.nextElementSibling!;
    expect(value('Mobile')).toHaveTextContent('+971 55 111 2222');
    expect(value('Employees')).toHaveTextContent('1000+ employees');
    expect(value('Location')).toHaveTextContent('Dubai, United Arab Emirates');
    expect(value('Website').querySelector('a')).toHaveAttribute('href', 'https://gulfaxis.example');
    expect(value('Est. value')).toHaveTextContent('22,00,000 · currency not recorded');
    expect(value('Priority')).toHaveTextContent('High');
    expect(screen.getByText(/amina@example.test · \+971 50 000 0000 · Dubai, United Arab Emirates/)).toBeInTheDocument();
  });

  it('an empty profile field reads "Not recorded", never a fabricated default', async () => {
    api.fetchLeadByIdFromAPI.mockResolvedValue({ ...LEAD, estimated_value: null });
    renderPage();
    await screen.findByRole('heading', { level: 1, name: 'Amina Farsi' });
    const dt = screen.getAllByText('Employees').find(el => el.tagName === 'DT')!;
    expect(dt.nextElementSibling).toHaveTextContent('Not recorded');
    expect(screen.getAllByText('Est. value').find(el => el.tagName === 'DT')!.nextElementSibling).toHaveTextContent('Not recorded');
  });

  it('an unassigned lead says so rather than inventing an owner', async () => {
    renderPage();
    expect(await screen.findByText('Unassigned')).toBeInTheDocument();
  });
});
