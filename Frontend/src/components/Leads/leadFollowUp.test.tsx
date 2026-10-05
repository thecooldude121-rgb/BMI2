import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import type { Lead } from '../../types/lead';

/**
 * Lead follow-ups (Group B item 11): pure date helpers (no time-zone shift),
 * the Lead detail follow-up card, and the logging hook's "activity saved but
 * follow-up failed" path — which must be reported as exactly that.
 */

const api = vi.hoisted(() => ({
  createLeadFollowUp: vi.fn(), rescheduleFollowUp: vi.fn(), completeFollowUp: vi.fn(),
  createActivityViaAPI: vi.fn(), createNoteViaAPI: vi.fn(),
}));
vi.mock('../../utils/leadFollowUp', async () => ({
  ...(await vi.importActual<object>('../../utils/leadFollowUp')),
  createLeadFollowUp: api.createLeadFollowUp, rescheduleFollowUp: api.rescheduleFollowUp, completeFollowUp: api.completeFollowUp,
}));
vi.mock('../../utils/leadsApi', async () => ({
  ...(await vi.importActual<object>('../../utils/leadsApi')),
  createActivityViaAPI: api.createActivityViaAPI, createNoteViaAPI: api.createNoteViaAPI,
}));

import { followUpStatus, localToday, formatDueDate } from '../../utils/leadFollowUp';
import LeadFollowUpCard from './LeadFollowUpCard';
import { useLogLeadActivity } from '../../hooks/useLogLeadActivity';

const LEAD = { id: '42', first_name: 'Amina', last_name: 'Farsi', full_name: 'Amina Farsi' } as unknown as Lead;

beforeEach(() => { vi.clearAllMocks(); });

describe('follow-up date helpers', () => {
  it('localToday uses the LOCAL calendar, never UTC (00:30 in India is still that day)', () => {
    const lateNight = new Date(2026, 9, 5, 0, 30);   // 5 Oct 00:30 local
    expect(localToday(lateNight)).toBe('2026-10-05');
  });

  it('formats a due date without passing through a Date', () => {
    expect(formatDueDate('2099-01-15')).toBe('15 Jan 2099');
  });

  it('overdue / today / upcoming / none', () => {
    expect(followUpStatus('2026-10-04', '2026-10-05')).toEqual({ tone: 'danger', label: 'Follow-up overdue · 4 Oct' + (new Date().getFullYear() === 2026 ? '' : ' 2026') });
    expect(followUpStatus('2026-10-05', '2026-10-05')).toEqual({ tone: 'warning', label: 'Follow-up due today' });
    expect(followUpStatus('2026-10-06', '2026-10-05')?.tone).toBe('neutral');
    expect(followUpStatus(undefined, '2026-10-05')).toBeNull();
  });
});

describe('LeadFollowUpCard', () => {
  it('sets a follow-up: creates the task, and reports success only after the server confirms', async () => {
    let resolve!: (v: unknown) => void;
    api.createLeadFollowUp.mockImplementation(() => new Promise(r => { resolve = r; }));
    const onChanged = vi.fn();
    render(<LeadFollowUpCard lead={LEAD} assignedTo="David Kumar" onChanged={onChanged} />);
    expect(screen.getByText('None set')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Due on'), '2099-01-15');
    await userEvent.click(screen.getByRole('button', { name: 'Set follow-up' }));
    expect(api.createLeadFollowUp).toHaveBeenCalledWith('42', '2099-01-15', 'Follow up with Amina Farsi', 'David Kumar');
    expect(onChanged).not.toHaveBeenCalled();
    resolve({ id: 'T9' });
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith('Follow-up set for 15 Jan 2099'));
  });

  it('with an open follow-up: reschedule moves THAT task, Mark done completes it', async () => {
    api.rescheduleFollowUp.mockResolvedValue({ id: 'T9' });
    api.completeFollowUp.mockResolvedValue({ id: 'T9' });
    const onChanged = vi.fn();
    const lead = { ...LEAD, next_follow_up_date: '2099-01-15', next_follow_up_task_id: 'T9' } as Lead;
    render(<LeadFollowUpCard lead={lead} onChanged={onChanged} />);
    expect(screen.getByText('Follow-up 15 Jan 2099')).toBeInTheDocument();
    const date = screen.getByLabelText('Move to');
    await userEvent.clear(date);
    await userEvent.type(date, '2099-02-01');
    await userEvent.click(screen.getByRole('button', { name: 'Reschedule' }));
    await waitFor(() => expect(api.rescheduleFollowUp).toHaveBeenCalledWith('T9', '2099-02-01'));
    await userEvent.click(screen.getByRole('button', { name: 'Mark done' }));
    await waitFor(() => expect(api.completeFollowUp).toHaveBeenCalledWith('T9'));
    expect(api.createLeadFollowUp).not.toHaveBeenCalled();
  });

  it('a refusal is shown, and nothing is reported as changed', async () => {
    api.createLeadFollowUp.mockRejectedValue(new Error('due_date must be a valid date'));
    const onChanged = vi.fn();
    render(<LeadFollowUpCard lead={LEAD} onChanged={onChanged} />);
    await userEvent.type(screen.getByLabelText('Due on'), '2099-01-15');
    await userEvent.click(screen.getByRole('button', { name: 'Set follow-up' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('due_date must be a valid date');
    expect(onChanged).not.toHaveBeenCalled();
  });
});

describe('useLogLeadActivity — activity + follow-up', () => {
  const CALL = { type: 'call', status: 'completed', subject: 'Call' } as never;

  it('creates the follow-up AFTER the activity saved', async () => {
    api.createActivityViaAPI.mockResolvedValue({ id: 'a1' });
    api.createLeadFollowUp.mockResolvedValue({ id: 'T1' });
    const { result } = renderHook(() => useLogLeadActivity());
    let ok = false;
    await act(async () => { ok = await result.current.save('42', CALL, { date: '2099-01-15', type: 'call', title: 'Follow up' }); });
    expect(ok).toBe(true);
    expect(api.createLeadFollowUp).toHaveBeenCalledWith('42', '2099-01-15', 'Follow up', undefined);
    expect(result.current.followUpErrorRef.current).toBeNull();
  });

  it('activity saved but follow-up refused: saved=true AND the follow-up error is kept for the caller to report', async () => {
    api.createActivityViaAPI.mockResolvedValue({ id: 'a1' });
    api.createLeadFollowUp.mockRejectedValue(new Error('related_to_id does not name a lead in this workspace'));
    const { result } = renderHook(() => useLogLeadActivity());
    let ok = false;
    await act(async () => { ok = await result.current.save('42', CALL, { date: '2099-01-15', type: 'call', title: 'Follow up' }); });
    expect(ok).toBe(true);
    expect(result.current.followUpErrorRef.current).toMatch(/does not name a lead/);
  });

  it('no follow-up is attempted when the activity itself is refused', async () => {
    api.createActivityViaAPI.mockRejectedValue(new Error('subject is required'));
    const { result } = renderHook(() => useLogLeadActivity());
    await act(async () => { await result.current.save('42', CALL, { date: '2099-01-15', type: 'call', title: 'Follow up' }); });
    expect(api.createLeadFollowUp).not.toHaveBeenCalled();
  });
});
