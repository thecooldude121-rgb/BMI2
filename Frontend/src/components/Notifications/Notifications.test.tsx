import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { NotificationRow } from '../../utils/notificationsApi';

/**
 * Group A item 5: the bell and the Inbox read the server's feed. The badge is
 * the server's unread count of STORED events only — due follow-ups never add
 * to it (approved 2026-10-10) — and read state changes only after a 2xx.
 */
const api = vi.hoisted(() => ({
  fetchNotifications: vi.fn(), fetchDueFollowUps: vi.fn(), markNotificationRead: vi.fn(), markAllNotificationsRead: vi.fn(),
}));
vi.mock('../../utils/notificationsApi', async () => ({
  ...(await vi.importActual<object>('../../utils/notificationsApi')), ...api,
}));

import { describeNotification, notificationHref } from '../../utils/notificationsApi';
import NotificationsBell from './NotificationsBell';
import InboxPage from '../../pages/CRM/InboxPage';

const row = (o: Partial<NotificationRow> = {}): NotificationRow => ({
  id: 'n1', type: 'deal_stage_changed', entity_type: 'deal', entity_id: 'D9', entity_name: 'Kora Platform',
  detail: { from_stage: 'Prospecting', to_stage: 'Qualified' }, actor_name: 'David Kumar',
  created_at: new Date().toISOString(), read_at: null, ...o,
});
const page = (data: NotificationRow[], unread: number, total = data.length) => ({ success: true, data, total, unread_count: unread, limit: 25, offset: 0 });
const noDue = { overdue_count: 0, today_count: 0, items: [] };
const renderIn = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => { vi.clearAllMocks(); api.fetchDueFollowUps.mockResolvedValue(noDue); });

describe('notification copy', () => {
  it('each type says what happened, from stored facts only', () => {
    expect(describeNotification(row())).toBe('David Kumar moved Kora Platform from Prospecting to Qualified');
    expect(describeNotification(row({ type: 'lead_assigned', entity_type: 'lead', entity_name: 'Nia Okafor' }))).toBe('David Kumar assigned you the lead Nia Okafor');
    expect(describeNotification(row({ type: 'deal_assigned', actor_name: null }))).toBe('Someone assigned you the deal Kora Platform');
    expect(describeNotification(row({ type: 'lead_converted', entity_type: 'lead', entity_name: 'Nia Okafor' }))).toBe('David Kumar converted your lead Nia Okafor');
  });
  it('a converted lead opens the deal it became; others open their record', () => {
    expect(notificationHref(row({ type: 'lead_converted', entity_type: 'lead', entity_id: '7', detail: { deal_id: 'D60' } }))).toBe('/crm/deals/D60');
    expect(notificationHref(row({ type: 'lead_assigned', entity_type: 'lead', entity_id: '7' }))).toBe('/crm/leads/7');
    expect(notificationHref(row())).toBe('/crm/deals/D9');
  });
});

describe('NotificationsBell', () => {
  it('the badge is the SERVER unread count; due follow-ups never add to it', async () => {
    api.fetchNotifications.mockResolvedValue(page([], 0));
    api.fetchDueFollowUps.mockResolvedValue({ overdue_count: 4, today_count: 2, items: [] });
    renderIn(<NotificationsBell buttonClass="" />);
    await waitFor(() => expect(api.fetchNotifications).toHaveBeenCalled());
    expect(screen.queryByTestId('unread-badge')).toBeNull();
    // ...including after the panel has loaded the due list.
    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(await screen.findByText('4 overdue')).toBeInTheDocument();
    expect(screen.queryByTestId('unread-badge')).toBeNull();
  });

  it('shows the unread count, then the Due section and the feed when opened', async () => {
    api.fetchNotifications.mockResolvedValue(page([row(), row({ id: 'n2', read_at: '2026-10-09T10:00:00Z' })], 1));
    api.fetchDueFollowUps.mockResolvedValue({ overdue_count: 1, today_count: 1, items: [
      { lead_id: 5, lead_name: 'Emma Davis', company: 'EduNext', due: '2026-10-08', task_id: 'T1', overdue: true },
      { lead_id: 6, lead_name: 'Raj Patel', company: null, due: '2026-10-10', task_id: 'T2', overdue: false },
    ] });
    renderIn(<NotificationsBell buttonClass="" />);
    expect(await screen.findByTestId('unread-badge')).toHaveTextContent('1');
    await userEvent.click(screen.getByRole('button', { name: /notifications, 1 unread/i }));
    const dueSection = await screen.findByTestId('due-section');
    expect(within(dueSection).getByText('1 overdue')).toBeInTheDocument();
    expect(within(dueSection).getByText('1 today')).toBeInTheDocument();
    expect(within(dueSection).getByText(/Follow up with Emma Davis · EduNext/)).toBeInTheDocument();
    expect(screen.getAllByText('David Kumar moved Kora Platform from Prospecting to Qualified')).toHaveLength(2);
  });

  it('opening an unread item marks it read on the server', async () => {
    api.fetchNotifications.mockResolvedValue(page([row()], 1));
    api.markNotificationRead.mockResolvedValue({ data: { id: 'n1' } });
    renderIn(<NotificationsBell buttonClass="" />);
    await userEvent.click(await screen.findByRole('button', { name: /notifications/i }));
    await userEvent.click(await screen.findByText(/moved Kora Platform/));
    await waitFor(() => expect(api.markNotificationRead).toHaveBeenCalledWith('n1'));
  });

  it('mark all read: a refusal is shown, and the items stay unread', async () => {
    api.fetchNotifications.mockResolvedValue(page([row()], 1));
    api.markAllNotificationsRead.mockRejectedValue(new Error('Request failed (HTTP 500)'));
    renderIn(<NotificationsBell buttonClass="" />);
    await userEvent.click(await screen.findByRole('button', { name: /notifications/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Mark all read' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 500');
    expect(screen.getByTestId('unread-badge')).toHaveTextContent('1');
  });

  it('a feed that fails to load says so — never an empty "Nothing yet"', async () => {
    api.fetchNotifications.mockRejectedValue(new Error('down'));
    renderIn(<NotificationsBell buttonClass="" />);
    await userEvent.click(await screen.findByRole('button', { name: /notifications/i }));
    expect(await screen.findByText('Notifications could not load.')).toBeInTheDocument();
    expect(screen.queryByText(/nothing yet/i)).toBeNull();
  });
});

describe('InboxPage', () => {
  it('pages with the server total and asks the server for the next page', async () => {
    api.fetchNotifications.mockResolvedValue(page(Array.from({ length: 25 }, (_, k) => row({ id: `n${k}` })), 30, 30));
    renderIn(<InboxPage />);
    expect(await screen.findByText('Showing 1–25 of 30')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(api.fetchNotifications).toHaveBeenLastCalledWith({ limit: 25, offset: 25, unread: false }));
  });

  it('empty and failed are different states', async () => {
    api.fetchNotifications.mockResolvedValueOnce(page([], 0));
    const { unmount } = renderIn(<InboxPage />);
    expect(await screen.findByText('Nothing here yet')).toBeInTheDocument();
    unmount();
    api.fetchNotifications.mockRejectedValueOnce(new Error('down'));
    renderIn(<InboxPage />);
    expect(await screen.findByText('The inbox could not load')).toBeInTheDocument();
    expect(screen.queryByText('Nothing here yet')).toBeNull();
  });
});
