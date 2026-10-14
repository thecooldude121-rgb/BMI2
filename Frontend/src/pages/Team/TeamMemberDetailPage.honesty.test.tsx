import { it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

/**
 * H2 (2026-10-14): quick actions that only collected input are "Coming soon",
 * Create Task opens the real form, copy confirms only after the clipboard took
 * it, and the page speaks in the ratified roles (no CEO / VP / Analyst).
 */
const toast = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ showToast: toast }) }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: '5', name: 'Dee Admin', role: 'Admin' } }) }));
vi.mock('../../utils/dealsApi', async () => ({ ...(await vi.importActual<object>('../../utils/dealsApi')), fetchDealsPage: vi.fn().mockResolvedValue({ deals: [], total: 0 }) }));
const member = { id: '9', name: 'Ravi Rep', email: 'ravi@x.example', role: 'sales', department: null, status: 'active', isActive: true,
  lastLoginAt: null, createdAt: '2026-01-01T00:00:00.000Z', initials: 'RR', avatarColor: '', managerName: null, managerId: null };
vi.mock('../../hooks/useTeamPerformance', async () => ({
  ...(await vi.importActual<object>('../../hooks/useTeamPerformance')),
  useTeamPerformance: () => ({ loading: false, error: null, period: 'Q4 2026', members: [{
    member, openCount: 0, openValue: 0, openUnconverted: 0, wonCount: 0, wonValue: 0, wonUnconverted: 0, lostCount: 0,
    winRate: null, quota: null, quotaCurrency: null, attainment: null, directReports: [] }] }),
}));
import TeamMemberDetailPage from './TeamMemberDetailPage';

it('quick actions: real Create Task, the rest disabled; copy waits for the clipboard; ratified roles only', async () => {
  const user = userEvent.setup();
  const writeText = vi.fn().mockRejectedValue(new Error('denied'));
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  const { container } = render(
    <MemoryRouter initialEntries={['/team/9']}>
      <Routes>
        <Route path="/team/:id" element={<TeamMemberDetailPage />} />
        <Route path="/crm/tasks" element={<p>task form</p>} />
      </Routes>
    </MemoryRouter>,
  );
  for (const label of ['Send Email', 'Schedule Call', 'Schedule Meeting', 'Add Note', 'Share Document']) {
    expect(screen.getByRole('button', { name: `${label} · Coming soon` })).toBeDisabled();
  }
  expect(container.textContent).not.toMatch(/\bCEO\b|\bVP\b|Analyst/);
  await user.click(screen.getByRole('button', { name: /More Actions/ }));
  await user.click(screen.getByRole('button', { name: /Copy Email Address/ }));
  expect(writeText).toHaveBeenCalledWith('ravi@x.example');
  expect(toast).not.toHaveBeenCalledWith('Email address copied', 'success');
  expect(toast).toHaveBeenCalledWith(expect.stringMatching(/Could not copy/), 'error');
  await user.click(screen.getByRole('button', { name: /Create Task/ }));
  expect(await screen.findByText('task form')).toBeInTheDocument();
  void within;
});
