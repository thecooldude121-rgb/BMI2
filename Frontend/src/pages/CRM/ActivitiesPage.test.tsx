import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Group A item 4, slice 4b — Activities on the server. The page loaded 200
 * rows, filtered nothing (five dropdowns and the search box were dead), listed
 * three invented owners, counted its tiles from the loaded rows, and popped
 * "Meeting cancelled" / "Task marked as complete!" over an unchanged database.
 * (2026-10-10 also removed its HRMS sample and a Quick Filters bar of invented
 * counts — asserted again below.)
 */
const api = vi.hoisted(() => ({
  fetchActivitiesPage: vi.fn(), fetchActivitySummary: vi.fn(), updateActivity: vi.fn(),
  fetchUsers: vi.fn(), fetchContacts: vi.fn(), fetchAccounts: vi.fn(), fetchDeals: vi.fn(), createActivity: vi.fn(),
}));
vi.mock('../../utils/activitiesApi', async () => ({
  ...(await vi.importActual<object>('../../utils/activitiesApi')),
  fetchActivitiesPage: api.fetchActivitiesPage, fetchActivitySummary: api.fetchActivitySummary,
  updateActivity: api.updateActivity, createActivity: api.createActivity,
}));
vi.mock('../../utils/usersApi', async () => ({ ...(await vi.importActual<object>('../../utils/usersApi')), fetchUsers: api.fetchUsers }));
vi.mock('../../utils/contactsApi', () => ({ fetchContacts: api.fetchContacts }));
vi.mock('../../utils/accountsApi', () => ({ fetchAccounts: api.fetchAccounts }));
vi.mock('../../utils/dealsApi', () => ({ fetchDeals: api.fetchDeals }));

import ActivitiesPage from './ActivitiesPage';

const now = new Date().toISOString();
const act = (k: number, extra: Record<string, unknown> = {}) => ({
  id: `a${k}`, subject: `Activity ${k}`, type: 'call', direction: null, status: 'completed', priority: null,
  description: null, outcome: null, duration: null, scheduled_at: null, completed_at: now, created_by: null,
  assigned_to: k % 2 ? 'Dee Admin' : null, created_at: now, updated_at: null,
  lead_id: null, deal_id: null, contact_id: null, company_id: 'C1', company_name: 'Kora', ...extra,
});
const SUMMARY = { total: 60, today: 4, this_week: 9, overdue: 3, meetings_today: 1, calls_today: 2 };
const lastPage = () => api.fetchActivitiesPage.mock.calls[api.fetchActivitiesPage.mock.calls.length - 1][0];
const lastSummary = () => api.fetchActivitySummary.mock.calls[api.fetchActivitySummary.mock.calls.length - 1][0];

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchActivitiesPage.mockImplementation(async (q: { offset: number; limit: number }) => ({
    activities: Array.from({ length: Math.min(q.limit, 60 - q.offset) }, (_, k) => act(q.offset + k)), total: 60,
  }));
  api.fetchActivitySummary.mockResolvedValue(SUMMARY);
  api.fetchUsers.mockResolvedValue([{ id: 7, first_name: 'Dee', last_name: 'Admin', displayName: 'Dee Admin' }]);
  api.fetchContacts.mockResolvedValue([{ id: 'CT1', name: 'Ana Ray', email: 'ana@x.example' }]);
  api.fetchAccounts.mockResolvedValue([{ id: 'C1', name: 'Kora' }]);
  api.fetchDeals.mockResolvedValue([{ id: 'D1', name: 'Kora renewal' }]);
});
const renderPage = () => render(<MemoryRouter><ActivitiesPage /></MemoryRouter>);
const ready = () => screen.findByText(/^Showing 1–25 of 60 activities/);

describe('Activities — server page, server counts, real filters', () => {
  it('asks for page 1 and shows the SERVER total and tiles', async () => {
    renderPage();
    await ready();
    expect(lastPage()).toMatchObject({ limit: 25, offset: 0 });
    expect(screen.getByTestId('tile-total')).toHaveTextContent('60');
    expect(screen.getByTestId('tile-overdue')).toHaveTextContent('3');
    expect(screen.getByTestId('tile-calls_today')).toHaveTextContent('2');
  });

  it('every filter reaches the server, for the list AND the tiles', async () => {
    renderPage();
    await ready();
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'meeting');
    await waitFor(() => expect(lastPage()).toMatchObject({ type: 'meeting', offset: 0 }));
    // The owner list is the roster, not three invented names.
    expect(within(screen.getByLabelText('Owner')).queryByText('Alex Rodriguez')).toBeNull();
    await userEvent.selectOptions(screen.getByLabelText('Owner'), 'Dee Admin');
    await userEvent.selectOptions(screen.getByLabelText('Related'), 'contact');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'overdue');
    await waitFor(() => expect(lastPage()).toMatchObject({ assigned_to: 'Dee Admin', linked: 'contact', state: 'overdue' }));
    expect(lastSummary()).toMatchObject({ type: 'meeting', assigned_to: 'Dee Admin', linked: 'contact', state: 'overdue' });
    await userEvent.selectOptions(screen.getByLabelText('Date'), 'today');
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    await waitFor(() => expect(lastPage()).toMatchObject({ occurred_after: midnight.toISOString() }));
    await userEvent.type(screen.getByPlaceholderText('Search activity subjects…'), 'renewal');
    await waitFor(() => expect(lastPage()).toMatchObject({ search: 'renewal' }));
  });

  it('Next asks for the next page', async () => {
    renderPage();
    await ready();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(lastPage()).toMatchObject({ offset: 25 }));
  });

  it('Mark complete is a real save, reported only after the 2xx, then reloads', async () => {
    api.fetchActivitiesPage.mockResolvedValue({ activities: [act(1, { status: 'planned', completed_at: null, scheduled_at: '2020-01-01T10:00:00Z' })], total: 1 });
    let resolve!: () => void;
    api.updateActivity.mockImplementation(() => new Promise<void>(r => { resolve = r; }));
    renderPage();
    const card = await screen.findByTestId('activity-a1');
    expect(within(card).getByText('Overdue')).toBeInTheDocument();
    const before = api.fetchActivitiesPage.mock.calls.length;
    await userEvent.click(within(card).getByRole('button', { name: 'Mark complete' }));
    expect(api.updateActivity).toHaveBeenCalledWith('a1', { status: 'completed' });
    expect(screen.queryByText('Marked “Activity 1” complete.')).toBeNull();
    resolve();
    expect(await screen.findByText('Marked “Activity 1” complete.')).toBeInTheDocument();
    await waitFor(() => expect(api.fetchActivitiesPage.mock.calls.length).toBeGreaterThan(before));
  });

  it('Cancel confirms, then saves status cancelled; a refusal is shown', async () => {
    api.fetchActivitiesPage.mockResolvedValue({ activities: [act(1, { status: 'planned', completed_at: null, scheduled_at: '2099-01-01T10:00:00Z' })], total: 1 });
    api.updateActivity.mockRejectedValue(new Error('Activity not found'));
    renderPage();
    const card = await screen.findByTestId('activity-a1');
    await userEvent.click(within(card).getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel activity' }));
    expect(api.updateActivity).toHaveBeenCalledWith('a1', { status: 'cancelled' });
    expect(await screen.findByText('“Activity 1” was not cancelled — Activity not found')).toBeInTheDocument();
  });

  it('no fake successes: nothing calls alert, and the actions with nothing behind them are gone', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { container } = renderPage();
    await ready();
    for (const label of ['Join Meeting', 'Share with Team', 'View Transcript', 'Play Recording', 'Escalate']) {
      expect(screen.queryByText(label)).toBeNull();
    }
    expect(screen.getByTitle('Export is coming soon')).toBeDisabled();
    expect(screen.getByTitle('Calendar view is coming soon')).toBeDisabled();
    expect(container.textContent).not.toMatch(/HRMS/i);
    expect(screen.queryByText(/Quick Filters/i)).toBeNull();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('a grouped view says it regroups THIS page, not every activity', async () => {
    renderPage();
    await ready();
    await userEvent.click(screen.getByRole('button', { name: /By owner/i }));
    expect(screen.getByTestId('grouping-note')).toHaveTextContent('Grouped from the 25 activities on this page, of 60 in all.');
  });

  it('Log activity chooses the record, then opens the real form for it', async () => {
    renderPage();
    await ready();
    await userEvent.click(screen.getByRole('button', { name: /Log activity/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Log activity' });
    await waitFor(() => expect(within(dialog).getByRole('option', { name: 'Ana Ray' })).toBeInTheDocument());
    await userEvent.selectOptions(within(dialog).getByLabelText('Contact'), 'CT1');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText(/Contact: Ana Ray/)).toBeInTheDocument();
  });

  it('a failed load is an error with a retry; failed counts read "—", never 0', async () => {
    api.fetchActivitiesPage.mockRejectedValueOnce(new Error('HTTP 500'));
    api.fetchActivitySummary.mockRejectedValue(new Error('nope'));
    renderPage();
    expect(await screen.findByText('Could not load activities')).toBeInTheDocument();
    expect(screen.queryByText('No activity logged yet')).toBeNull();
    expect(screen.getByTestId('tile-total')).toHaveTextContent('—');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await ready();
  });

  it('Figma layout: no AI-insights sample panel, coloured tiles with captions, Title Case views', async () => {
    renderPage();
    await ready();
    expect(screen.queryByText(/AI insights/i)).toBeNull();
    expect(screen.queryByText(/Sample content/i)).toBeNull();
    expect(screen.getByTestId('tile-overdue').className).toMatch(/danger-700/);
    expect(screen.getByText('Since Monday')).toBeInTheDocument();
    for (const v of ['Timeline', 'By Type', 'By Owner', 'By Account']) {
      expect(screen.getByRole('button', { name: new RegExp(v) })).toBeInTheDocument();
    }
  });
});
