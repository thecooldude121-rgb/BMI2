// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The "own leads" display filter (step 5). It used to run in the browser and
 * compare lead.owner_id — a field the API never set — so a sales user saw NO
 * leads at all. It is now sent to the server as assigned_to_user_id, so the
 * total matches the rows. Still a display filter, not a security control
 * (CLAUDE.md, ratified 2026-10-03).
 */
let currentUser = { id: '7', name: 'Rep', role: 'sales' };
vi.mock('../contexts/CurrentUserContext', () => ({
  useCurrentUser: () => ({ currentUser, setRole: () => {}, isRoleOverridden: false }),
}));
vi.mock('../contexts/LeadContext', () => ({
  useLeads: () => ({ leads: [], fetchLeads: vi.fn(), views: [], fetchViews: vi.fn(), createView: vi.fn(),
    updateView: vi.fn(), deleteView: vi.fn(), writeVersion: 0 }),
}));
const page = vi.fn(); const summary = vi.fn();
vi.mock('../utils/leadsApi', () => ({
  fetchLeadsPage: (...a: unknown[]) => page(...a),
  fetchLeadSummary: (...a: unknown[]) => summary(...a),
}));
import { useLeadsPageState } from './useLeadsPageState';

beforeEach(() => {
  page.mockReset().mockResolvedValue({ leads: [], total: 0 });
  summary.mockReset().mockResolvedValue({ total: 0, source_quality_week: { top_source: null, top_source_avg_score: 0, top_source_count: 0, weekly_leads: 0 } });
});

describe('own-leads display filter', () => {
  it('a sales user (no view_all) sends assigned_to_user_id = their id, for the list AND the summary', async () => {
    currentUser = { id: '7', name: 'Rep', role: 'sales' };
    renderHook(() => useLeadsPageState());
    await waitFor(() => expect(page).toHaveBeenCalled());
    expect(page.mock.calls[0][0]).toMatchObject({ assigned_to_user_id: '7' });
    expect(summary).toHaveBeenCalledWith('7');
  });

  it('fails CLOSED: a user without view_all and without a numeric id gets no fetch and a stated reason', async () => {
    currentUser = { id: '', name: '', role: 'sales' };
    const { result } = renderHook(() => useLeadsPageState());
    await waitFor(() => expect(result.current.listUnavailableReason).toMatch(/no user id/));
    expect(page).not.toHaveBeenCalled();
  });
});
