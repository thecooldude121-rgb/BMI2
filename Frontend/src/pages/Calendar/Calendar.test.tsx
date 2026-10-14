import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

/**
 * Group A item 4, slice 4a — the Calendar reads exactly the visible weeks.
 * It fetched 500 tasks whatever month was on screen, and drew meetings from a
 * DataContext stub that was always empty.
 */
const api = vi.hoisted(() => ({
  fetchTasksByDay: vi.fn(), fetchTasksPage: vi.fn(), fetchTaskSummary: vi.fn(), fetchMeetingsInWindow: vi.fn(),
}));
vi.mock('../../utils/activitiesApi', async () => ({ ...(await vi.importActual<object>('../../utils/activitiesApi')), ...api }));
vi.mock('../../utils/meetingsApi', async () => ({ ...(await vi.importActual<object>('../../utils/meetingsApi')), fetchMeetingsInWindow: api.fetchMeetingsInWindow }));

import Calendar from './Calendar';
import { localDay } from '../../utils/dates';

const now = new Date();
const first = new Date(now.getFullYear(), now.getMonth(), 1);
const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - ((first.getDay() + 6) % 7)); // Monday first
const gridEnd = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + 41);
const TODAY = localDay(now);
// Never today: the page opens with today selected, so clicking MID must change the selection.
const MID = localDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() === 15 ? 16 : 15));

const task = (id: string, title: string, due: string, status = 'pending') => ({
  id, title, description: null, type: 'call', priority: 'high', status, assigned_to: 'Dee',
  related_to_type: null, related_to_id: null, due_date: due, completed_at: null, created_at: '', updated_at: null,
});

function Where() { const l = useLocation(); return <p data-testid="where">{l.pathname}{l.search}</p>; }
const renderCal = () => render(
  <MemoryRouter initialEntries={['/calendar']}>
    <Routes>
      <Route path="/calendar" element={<Calendar />} />
      <Route path="*" element={<Where />} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchTasksByDay.mockResolvedValue({
    total: 9, days: [{ day: MID, total: 9, open: 8, tasks: [task('T1', 'Call Kora', MID), task('T2', 'Send deck', MID), task('T3', 'Done thing', MID, 'completed')] }],
  });
  api.fetchTasksPage.mockResolvedValue({ tasks: [task('T9', 'Due soon task', TODAY)], total: 6 });
  api.fetchTaskSummary.mockResolvedValue({ as_of: TODAY, all: 30, mine: 1, open: 20, overdue: 4, today: 1, upcoming: 9, no_date: 6, completed: 10 });
  api.fetchMeetingsInWindow.mockResolvedValue({ meetings: [], total: 0 });
});

describe('Calendar — exactly the visible weeks, from the server', () => {
  it('asks for tasks by day over the 42-day grid, and meetings over the same window', async () => {
    renderCal();
    await screen.findByText('Call Kora');
    expect(api.fetchTasksByDay).toHaveBeenCalledWith(localDay(gridStart), localDay(gridEnd));
    const [from, to] = api.fetchMeetingsInWindow.mock.calls[0];
    expect(from).toEqual(gridStart);
    expect(to).toEqual(new Date(gridEnd.getFullYear(), gridEnd.getMonth(), gridEnd.getDate() + 1));
  });

  it('a crowded day shows three chips and the SERVER\'s remaining count', async () => {
    renderCal();
    await screen.findByText('Call Kora');
    expect(screen.getByTestId(`more-${MID}`)).toHaveTextContent('+6 more tasks');
  });

  it('next month asks for that month\'s weeks', async () => {
    renderCal();
    await screen.findByText('Call Kora');
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    const nf = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const ns = new Date(nf.getFullYear(), nf.getMonth(), 1 - ((nf.getDay() + 6) % 7));
    await waitFor(() => expect(api.fetchTasksByDay).toHaveBeenLastCalledWith(localDay(ns), expect.any(String)));
  });

  it('Week and Day are disabled and labelled, not dead toggles', async () => {
    renderCal();
    await screen.findByText('Call Kora');
    expect(screen.getByTitle('Week view is coming soon')).toBeDisabled();
    expect(screen.getByTitle('Day view is coming soon')).toBeDisabled();
  });

  it('a real meeting lands on its LOCAL day; a capped window says so', async () => {
    // The same day as MID — which moves to the 16th when today is the 15th —
    // so the meeting never lands on today's cell. (Hard-coding the 15th failed
    // this test on the 15th of every month.)
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() === 15 ? 16 : 15, 10, 30);
    api.fetchMeetingsInWindow.mockImplementation(async (_f: Date, _t: Date, limit: number) =>
      limit === 5 ? { meetings: [], total: 0 }
        : { meetings: [{ id: 'MTG1', title: 'QBR with Kora', date: at.toISOString(), related_to_id: 'D1' }], total: 250 });
    renderCal();
    expect(await screen.findByText(/QBR with Kora/)).toBeInTheDocument();
    expect(screen.getByTestId(`day-${MID}`)).toHaveTextContent('QBR with Kora');
    expect(screen.getByText('Showing the first 1 of 250 meetings in these weeks.')).toBeInTheDocument();
  });

  it('the rail uses server counts: due soon total, overdue, and undated tasks', async () => {
    renderCal();
    expect(await screen.findByText('Next 7 days · 6 open')).toBeInTheDocument();
    expect(screen.getByText('4 overdue')).toBeInTheDocument();
    expect(screen.getByTestId('undated-note')).toHaveTextContent('6 open tasks have no due date');
    expect(api.fetchTasksPage).toHaveBeenCalledWith(expect.objectContaining({ bucket: 'open', due_after: TODAY, sort: 'due_date' }));
    expect(api.fetchTaskSummary).toHaveBeenCalledWith(TODAY);
  });

  it('selecting a day loads THAT day\'s tasks from the server; New task carries the date', async () => {
    renderCal();
    await screen.findByText('Call Kora');
    api.fetchTasksPage.mockResolvedValueOnce({ tasks: [task('T1', 'Call Kora', MID)], total: 9 });
    await userEvent.click(screen.getByTestId(`day-${MID}`));
    await waitFor(() => expect(api.fetchTasksPage).toHaveBeenCalledWith(expect.objectContaining({ due_after: MID, due_before: MID })));
    expect(await screen.findByTestId('selected-summary')).toHaveTextContent('9 tasks · 0 meetings');
    expect(screen.getByText('Showing 1 of 9.')).toBeInTheDocument();
    // [0] is the page header's; [1] is the selected day's.
    await userEvent.click(screen.getAllByRole('button', { name: 'New task' })[1]);
    expect(screen.getByTestId('where')).toHaveTextContent(`/crm/tasks?new=1&due=${MID}`);
  });

  it('a failed task load is an error with a retry that really refetches', async () => {
    api.fetchTasksByDay.mockRejectedValueOnce(new Error('HTTP 500'));
    renderCal();
    expect(await screen.findByText('Tasks could not load for these weeks')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Call Kora')).toBeInTheDocument();
  });

  it('opens with TODAY selected (the frame never shows an empty day card)', async () => {
    renderCal();
    await screen.findByText('Call Kora');
    expect(screen.getByTestId(`day-${TODAY}`)).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(api.fetchTasksPage).toHaveBeenCalledWith(expect.objectContaining({ due_after: TODAY, due_before: TODAY })));
    expect(screen.getByRole('button', { name: /New Meeting · Soon/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Block Time · Soon/ })).toBeDisabled();
  });

  it('the grid starts on MONDAY (weeks run Monday–Sunday everywhere)', async () => {
    renderCal();
    await screen.findByText('Call Kora');
    const headers = screen.getAllByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/).map(e => e.textContent);
    expect(headers.slice(0, 7)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(api.fetchTasksByDay.mock.calls[0][0]).toBe(localDay(gridStart));
    expect(gridStart.getDay()).toBe(1);
  });
});
