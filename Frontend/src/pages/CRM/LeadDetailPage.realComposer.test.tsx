import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { Lead } from '../../types/lead';

/**
 * Lesson 1 ("a hand-written payload is not the UI's payload"): the main Lead
 * detail tests stub the composer. This one drives the REAL OutreachComposer
 * end to end inside the page and checks the request it produces — the shape
 * the backend suite (roundTrip.leadTransitions) already proves the server
 * accepts and records as contact.
 */

const api = vi.hoisted(() => ({
  fetchLeadByIdFromAPI: vi.fn(),
  fetchActivitiesFromAPI: vi.fn(async () => []),
  fetchNotesFromAPI: vi.fn(async () => []),
  fetchLeadStageHistory: vi.fn(async () => []),
  createActivityViaAPI: vi.fn(async () => ({ id: 'a1' })),
  createNoteViaAPI: vi.fn(),
}));
vi.mock('../../utils/leadsApi', async () => ({ ...(await vi.importActual<object>('../../utils/leadsApi')), ...api }));
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../contexts/LeadContext', () => ({
  useLeads: () => ({ updateLead: vi.fn(), deleteLead: vi.fn(), leads: [], lastWriteErrorRef: { current: null } }),
}));
vi.mock('../../services/documentsService', () => ({ documentsService: { loadDocuments: vi.fn(async () => ({ data: [], count: 0 })) } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 5, name: 'David Kumar' } }) }));
vi.mock('../../hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock('../../components/Leads/LeadConversionWizard', () => ({ default: () => null }));
vi.mock('../../components/Leads/MergeReviewModal', () => ({ default: () => null }));

import LeadDetailPage from './LeadDetailPage';

const LEAD = {
  id: '42', first_name: 'Amina', last_name: 'Farsi', full_name: 'Amina Farsi', email: 'a@example.test',
  company: 'GulfAxis', status: 'new', score: 0, source: 'Website', owner_id: '', tags: [], custom_fields: {},
  enrichment_data: {}, created_at: '2026-10-01T09:00:00Z', updated_at: '2026-10-01T09:00:00Z', created_by: '',
  email_opens_count: 0, email_clicks_count: 0, page_views_count: 0, meeting_count: 0, call_count: 0,
  email_sent_count: 0, ai_recommendations: [],
} as unknown as Lead;

beforeEach(() => { vi.clearAllMocks(); api.fetchLeadByIdFromAPI.mockResolvedValue(LEAD); });

describe('Lead detail × the real composer', () => {
  it('"Log call" → "Log & Save" sends a completed outbound call to the activities endpoint', async () => {
    render(
      <MemoryRouter initialEntries={['/crm/leads/42']}>
        <Routes><Route path="/crm/leads/:id" element={<LeadDetailPage />} /></Routes>
      </MemoryRouter>,
    );
    await userEvent.click(await screen.findByRole('button', { name: /log call/i }));
    // The follow-up option is real now (a task); left unticked, no task is made.
    expect(screen.getByRole('checkbox', { name: /set follow-up/i })).not.toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: /log & save/i }));

    await waitFor(() => expect(api.createActivityViaAPI).toHaveBeenCalledTimes(1));
    const [leadId, body] = api.createActivityViaAPI.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(leadId).toBe('42');
    expect(body).toMatchObject({ type: 'call', direction: 'outbound', status: 'completed', subject: 'Outbound call with Amina Farsi' });
    expect(typeof body.completed_at).toBe('string');
    expect(body).not.toHaveProperty('next_follow_up_date');
  });
});
