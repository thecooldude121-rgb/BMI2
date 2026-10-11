import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Group A item 4, slice 4a — the Tasks page reads one server page of one tab,
 * and every count from GET /tasks/summary. It loaded 500 tasks once and
 * counted every tab and tile from them. "Today" is the viewer's local day.
 */
const api = vi.hoisted(() => ({
  fetchTasksPage: vi.fn(), fetchTaskSummary: vi.fn(), setTaskStatus: vi.fn(), deleteTask: vi.fn(),
}));
vi.mock('../../utils/activitiesApi', async () => ({ ...(await vi.importActual<object>('../../utils/activitiesApi')), ...api }));
vi.mock('../../utils/contactsApi', () => ({ fetchContacts: vi.fn().mockResolvedValue([]) }));
vi.mock('../../utils/accountsApi', () => ({ fetchAccounts: vi.fn().mockResolvedValue([]) }));
vi.mock('../../utils/dealsApi', () => ({ fetchDeals: vi.fn().mockResolvedValue([]) }));
vi.mock('../../utils/usersApi', () => ({ fetchUsers: vi.fn().mockResolvedValue([]) }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 5, name: 'Dee Admin', role: 'admin' } }) }));

import TasksPage from './TasksPage';
import { localDay } from '../../utils/dates';

const TODAY = localDay(new Date());
const task = (k: number, extra: Record<string, unknown> = {}) => ({
  id: `T${k}`, title: `Task ${k}`, description: null, type: 'call', priority: 'medium', status: 'pending',
  assigned_to: 'Dee Admin', related_to_type: null, related_to_id: null, due_date: TODAY,
  completed_at: null, created_at: '2026-10-01T00:00:00Z', updated_at: null, ...extra,
});
const SUMMARY = { as_of: TODAY, all: 60, mine: 12, open: 40, overdue: 7, today: 3, upcoming: 20, no_date: 10, completed: 20 };
const lastPageQuery = () => api.fetchTasksPage.mock.calls[api.fetchTasksPage.mock.calls.length - 1][0];
const lastSummaryCall = () => api.fetchTaskSummary.mock.calls[api.fetchTaskSummary.mock.calls.length - 1];

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchTasksPage.mockImplementation(async (q: { offset: number; limit: number }) => ({
    tasks: Array.from({ length: Math.min(q.limit, 60 - q.offset) }, (_, k) => task(q.offset + k)), total: 60,
  }));
  api.fetchTaskSummary.mockResolvedValue(SUMMARY);
});
const renderPage = (url = '/crm/tasks') => render(<MemoryRouter initialEntries={[url]}><TasksPage /></MemoryRouter>);

describe('Tasks — one server page, server counts', () => {
  it('asks for page 1 of "All" with the viewer\'s day, and shows the SERVER total and counts', async () => {
    renderPage();
    expect(await screen.findByText('Showing 1–25 of 60 tasks · 25 rows per page')).toBeInTheDocument();
    expect(lastPageQuery()).toMatchObject({ bucket: 'all', today: TODAY, limit: 25, offset: 0 });
    expect(lastSummaryCall()[0]).toBe(TODAY);
    expect(screen.getByTestId('tab-count-overdue')).toHaveTextContent('7');
    expect(screen.getByTestId('kpi-open')).toHaveTextContent('40');
    expect(screen.getByTestId('kpi-completed')).toHaveTextContent('20');
    expect(screen.getByText('10 without a due date')).toBeInTheDocument();
  });

  it('a tab is a server query, not a filter over loaded rows', async () => {
    renderPage();
    await screen.findByText(/Showing 1–25 of 60/);
    await userEvent.click(screen.getByRole('tab', { name: /Overdue/ }));
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ bucket: 'overdue', today: TODAY, offset: 0 }));
  });

  it('Next asks for the next page; a filter returns to page 1 and narrows the counts too', async () => {
    renderPage();
    await screen.findByText(/Showing 1–25 of 60/);
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ offset: 25 }));
    await userEvent.selectOptions(screen.getByLabelText('Priority'), 'high');
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ priority: 'high', offset: 0 }));
    expect(lastSummaryCall()[1]).toMatchObject({ priority: 'high' });
    await userEvent.click(screen.getByRole('button', { name: /Not linked/ }));
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ related_to_type: 'none' }));
    await userEvent.type(screen.getByPlaceholderText('Search task titles…'), 'renewal');
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ search: 'renewal' }));
    expect(lastSummaryCall()[1]).toMatchObject({ search: 'renewal', related_to_type: 'none' });
  });

  it('a status change says "Saved" only after the server confirms, then reloads', async () => {
    let resolve!: (t: unknown) => void;
    api.setTaskStatus.mockImplementation(() => new Promise(r => { resolve = r; }));
    renderPage();
    await screen.findByText(/Showing 1–25 of 60/);
    const before = api.fetchTasksPage.mock.calls.length;
    await userEvent.selectOptions(screen.getByLabelText('Status of Task 0'), 'completed');
    expect(screen.getByText('Saving…')).toBeInTheDocument();
    expect(screen.queryByText('Saved')).toBeNull();
    resolve(task(0, { status: 'completed' }));
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    await waitFor(() => expect(api.fetchTasksPage.mock.calls.length).toBeGreaterThan(before));
  });

  it('a refused status change stays on the row and does not reload', async () => {
    api.setTaskStatus.mockRejectedValue(new Error('status must be one of: pending'));
    renderPage();
    await screen.findByText(/Showing 1–25 of 60/);
    const before = api.fetchTasksPage.mock.calls.length;
    await userEvent.selectOptions(screen.getByLabelText('Status of Task 0'), 'completed');
    expect(await screen.findByText('Not saved — status must be one of: pending')).toBeInTheDocument();
    expect(api.fetchTasksPage.mock.calls.length).toBe(before);
  });

  it('delete confirms inline, calls the server, and reports only after a 2xx', async () => {
    let resolve!: () => void;
    api.deleteTask.mockImplementation(() => new Promise<void>(r => { resolve = r; }));
    renderPage();
    await screen.findByText(/Showing 1–25 of 60/);
    const row = screen.getByText('Task 3').closest('tr')!;
    await userEvent.click(within(row).getByRole('button', { name: /Delete/ }));
    const confirm = screen.getByRole('alertdialog', { name: 'Delete task' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Delete task' }));
    expect(api.deleteTask).toHaveBeenCalledWith('T3');
    expect(screen.queryByText('Deleted “Task 3”.')).toBeNull();
    resolve();
    expect(await screen.findByText('Deleted “Task 3”.')).toBeInTheDocument();
  });

  it('a refused delete is shown and nothing is reported as deleted', async () => {
    api.deleteTask.mockRejectedValue(new Error('Insufficient permissions'));
    renderPage();
    await screen.findByText(/Showing 1–25 of 60/);
    await userEvent.click(within(screen.getByText('Task 3').closest('tr')!).getByRole('button', { name: /Delete/ }));
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete task' }));
    expect(await screen.findByText('“Task 3” was not deleted — Insufficient permissions')).toBeInTheDocument();
    expect(screen.queryByText(/^Deleted/)).toBeNull();
  });

  it('a failed list load is an error with a retry, never an empty tab', async () => {
    api.fetchTasksPage.mockRejectedValueOnce(new Error('Failed (HTTP 500)'));
    renderPage();
    expect(await screen.findByText('The tasks could not load')).toBeInTheDocument();
    expect(screen.queryByText('No tasks yet')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/Showing 1–25 of 60/)).toBeInTheDocument();
  });

  it('a failed summary shows "—", never a zero', async () => {
    api.fetchTaskSummary.mockRejectedValue(new Error('nope'));
    renderPage();
    expect(await screen.findByText('The task counts could not load')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-overdue')).toHaveTextContent('—');
  });

  it('?bucket=overdue opens that tab; Kanban is disabled and labelled', async () => {
    renderPage('/crm/tasks?bucket=overdue');
    await waitFor(() => expect(lastPageQuery()).toMatchObject({ bucket: 'overdue' }));
    expect(screen.getByTitle('Kanban view is coming soon')).toBeDisabled();
  });

  it('?new=1&due= opens the form with that due date (the calendar\'s "New task")', async () => {
    renderPage('/crm/tasks?new=1&due=2026-10-20');
    expect(await screen.findByDisplayValue('2026-10-20')).toBeInTheDocument();
  });
});
