// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLeadsPageState } from './useLeadsPageState';
import type { Lead } from '../types/lead';

// ── Mock LeadContext ──────────────────────────────────────────────────────────

const mockFetchLeads = vi.fn();
const mockFetchViews = vi.fn();
const mockCreateView = vi.fn();
const mockDeleteView = vi.fn();

vi.mock('../contexts/LeadContext', () => ({
  useLeads: vi.fn(),
}));

/**
 * CurrentUserContext, explicitly.
 *
 * These tests used to supply no user at all, and passed because the context
 * defaulted to a hardcoded admin — so every lead was visible without anyone
 * asking for it. That default is gone: the context now derives from the real
 * session, and with no provider mounted the value is ANONYMOUS, which correctly
 * sees nothing. The subject here is filtering, sorting and pagination, not
 * permission gating, so the user is stated rather than inherited. `manager`
 * holds leads.view_all, and the id matches BASE_LEAD.owner_id so the
 * owner-based path is exercised too.
 */
vi.mock('../contexts/CurrentUserContext', () => ({
  useCurrentUser: () => ({
    currentUser: { id: 'owner-1', name: 'Test Manager', role: 'manager' },
    setRole: () => {},
    isRoleOverridden: false,
  }),
}));

/**
 * The server is the seam now (step 5 pagination): filtering, sorting, paging and
 * the KPI figures are the SERVER's job, so these tests assert the QUERY the hook
 * sends and that it shows exactly the rows / total / summary that came back.
 */
const mockFetchLeadsPage = vi.fn();
const mockFetchLeadSummary = vi.fn();
vi.mock('../utils/leadsApi', () => ({
  fetchLeadsPage: (...a: unknown[]) => mockFetchLeadsPage(...a),
  fetchLeadSummary: (...a: unknown[]) => mockFetchLeadSummary(...a),
}));

import { useLeads } from '../contexts/LeadContext';
const mockUseLeads = vi.mocked(useLeads);
const lastQuery = () => mockFetchLeadsPage.mock.calls[mockFetchLeadsPage.mock.calls.length - 1][0];

// ── Base Lead fixture ─────────────────────────────────────────────────────────

const BASE_LEAD: Lead = {
  id:                 '1',
  first_name:         'Jane',
  last_name:          'Smith',
  owner_id:           'owner-1',
  status:             'new',
  temperature:        'warm',
  score:              85,
  ai_score:           85,
  estimated_value:    0,
  probability:        0,
  currency:           'USD',
  source:             'Website',
  custom_fields:      {},
  enrichment_data:    {},
  email_opt_in:       true,
  sms_opt_in:         false,
  call_opt_in:        true,
  do_not_contact:     false,
  gdpr_consent:       false,
  is_qualified:       false,
  is_deleted:         false,
  email_opens_count:  0,
  email_clicks_count: 0,
  page_views_count:   0,
  meeting_count:      0,
  call_count:         0,
  email_sent_count:   0,
  ai_recommendations: [],
  automation_paused:  false,
  tags:               [],
  created_at:         '2024-01-01T00:00:00Z',
  updated_at:         '2024-01-01T00:00:00Z',
  created_by:         'user-1',
};

const LEAD_A: Lead = { ...BASE_LEAD, id: '1', first_name: 'Alice', last_name: 'Adams', score: 90, ai_score: 90, status: 'new', source: 'Website' };
const LEAD_B: Lead = { ...BASE_LEAD, id: '2', first_name: 'Bob',   last_name: 'Brown', score: 70, ai_score: 70, status: 'qualified', source: 'HRMS', email: 'bob@test.com' };
const LEAD_C: Lead = { ...BASE_LEAD, id: '3', first_name: 'Carol', last_name: 'Clark', score: 40, ai_score: 40, status: 'lost', source: 'Manual', email: 'carol@test.com' };
const TEST_LEADS = [LEAD_A, LEAD_B, LEAD_C];

function setupMock(leads: Lead[] = TEST_LEADS) {
  mockUseLeads.mockReturnValue({
    leads,
    fetchLeads:  mockFetchLeads,
    loading:     false,
    updateLead:  vi.fn(),
    deleteLead:  vi.fn(),
    views:       [],
    fetchViews:  mockFetchViews,
    createView:  mockCreateView,
    deleteView:  mockDeleteView,
  } as any);
}

const SUMMARY = {
  total: 1234, new_today: 2, hot: 300, imported_this_week: 5, new_unworked: 17,
  new_unworked_this_week: 4, new_unworked_last_week: 1, untouched: 40, ready_to_convert: 90,
  source_quality_week: { top_source: 'Website', top_source_avg_score: 71, top_source_count: 9, weekly_leads: 20 },
};

beforeEach(() => {
  vi.clearAllMocks();
  setupMock();
  mockFetchLeadsPage.mockResolvedValue({ leads: TEST_LEADS, total: 1234 });
  mockFetchLeadSummary.mockResolvedValue(SUMMARY);
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useLeadsPageState — initial state', () => {
  it('starts with list view, empty search, and all-filters', () => {
    const { result } = renderHook(() => useLeadsPageState());
    expect(result.current.viewMode).toBe('list');
    expect(result.current.searchQuery).toBe('');
    expect(result.current.filterState).toEqual({ status: 'all', source: 'all', score: 'all' });
  });

  it('starts sorted by Newest — priority is a client-computed score the server cannot order by yet', async () => {
    const { result } = renderHook(() => useLeadsPageState());
    expect(result.current.sortBy).toBe('newest');
    await waitFor(() => expect(mockFetchLeadsPage).toHaveBeenCalled());
    expect(lastQuery()).toMatchObject({ sort: 'newest', limit: 25, offset: 0 });
  });

  it('starts with no selection and no active modal', () => {
    const { result } = renderHook(() => useLeadsPageState());
    expect(result.current.selectedLeadIds).toEqual([]);
    expect(result.current.activeModal).toBeNull();
    expect(result.current.activeLead).toBeNull();
  });
});

describe('useLeadsPageState — view mode', () => {
  it('setViewMode switches between list / grid / kanban', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.setViewMode('grid'); });
    expect(result.current.viewMode).toBe('grid');
    act(() => { result.current.setViewMode('kanban'); });
    expect(result.current.viewMode).toBe('kanban');
  });
});

describe('useLeadsPageState — server list', () => {
  it('shows the SERVER\'s rows and its real total, not the length of the page', async () => {
    const { result } = renderHook(() => useLeadsPageState());
    await waitFor(() => expect(result.current.sortedLeads).toHaveLength(3));
    expect(result.current.listTotal).toBe(1234);
  });

  it('a status / source / score filter is sent to the server, not applied to the page', async () => {
    const { result } = renderHook(() => useLeadsPageState());
    await waitFor(() => expect(mockFetchLeadsPage).toHaveBeenCalled());
    act(() => { result.current.setFilterStatus('__qualified__'); });
    await waitFor(() => expect(lastQuery()).toMatchObject({ status: '__qualified__', offset: 0 }));
    act(() => { result.current.setFilterSource('HRMS'); });
    await waitFor(() => expect(lastQuery()).toMatchObject({ source: 'HRMS' }));
    act(() => { result.current.setFilterScore('80-100'); });
    await waitFor(() => expect(lastQuery()).toMatchObject({ score_band: '80-100' }));
    act(() => { result.current.resetFilters(); });
    await waitFor(() => expect(lastQuery()).toMatchObject({ status: 'all', source: 'all', score_band: 'all' }));
  });

  it('search is debounced, then sent', async () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.setSearchQuery('acme'); });
    await waitFor(() => expect(lastQuery()).toMatchObject({ search: 'acme' }), { timeout: 1500 });
  });

  it('a server-supported sort is sent; an unsupported one is NOT fetched and says why', async () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.setSortBy('score_low_high'); });
    await waitFor(() => expect(lastQuery()).toMatchObject({ sort: 'score_low_high' }));
    const calls = mockFetchLeadsPage.mock.calls.length;
    act(() => { result.current.setSortBy('priority'); });
    await waitFor(() => expect(result.current.listUnavailableReason).toMatch(/coming soon/));
    expect(mockFetchLeadsPage.mock.calls.length).toBe(calls);
    expect(result.current.sortedLeads).toHaveLength(0);
  });

  it('a server refusal is surfaced, not swallowed into an empty list', async () => {
    mockFetchLeadsPage.mockImplementation(async () => { throw new Error('filtering on sla_stale is not available yet'); });
    const { result } = renderHook(() => useLeadsPageState());
    await waitFor(() => expect(result.current.listError).toMatch(/not available yet/));
  });
});

describe('useLeadsPageState — selection', () => {
  it('toggleLeadSelection adds then removes a lead id', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.toggleLeadSelection('1'); });
    expect(result.current.selectedLeadIds).toContain('1');
    act(() => { result.current.toggleLeadSelection('1'); });
    expect(result.current.selectedLeadIds).not.toContain('1');
  });

  it('selectAllLeads selects all loaded leads, second call deselects', async () => {
    const { result } = renderHook(() => useLeadsPageState());
    await waitFor(() => expect(result.current.sortedLeads).toHaveLength(3));
    act(() => { result.current.selectAllLeads(); });
    expect(result.current.selectedLeadIds).toHaveLength(3);
    act(() => { result.current.selectAllLeads(); });
    expect(result.current.selectedLeadIds).toHaveLength(0);
  });

  it('clearSelection empties the selection', async () => {
    const { result } = renderHook(() => useLeadsPageState());
    await waitFor(() => expect(result.current.sortedLeads).toHaveLength(3));
    act(() => { result.current.selectAllLeads(); });
    act(() => { result.current.clearSelection(); });
    expect(result.current.selectedLeadIds).toHaveLength(0);
  });

  it('isSelected returns correct boolean', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.toggleLeadSelection('2'); });
    expect(result.current.isSelected('2')).toBe(true);
    expect(result.current.isSelected('1')).toBe(false);
  });
});

describe('useLeadsPageState — modal management', () => {
  it('openModal sets activeModal; closeModal clears it', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.openModal('convertLead'); });
    expect(result.current.activeModal).toBe('convertLead');
    expect(result.current.isModalOpen('convertLead')).toBe(true);
    act(() => { result.current.closeModal(); });
    expect(result.current.activeModal).toBeNull();
  });

  it('openModal with lead sets activeLead', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.openModal('contactLead', LEAD_A); });
    expect(result.current.activeLead?.id).toBe('1');
  });

  it('isModalOpen returns false for a different modal id', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.openModal('confirmDelete'); });
    expect(result.current.isModalOpen('convertLead')).toBe(false);
  });
});

describe('useLeadsPageState — toast', () => {
  it('showToast sets toast with message and type, auto-clears after 3000ms', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.showToast('Saved!', 'success'); });
    expect(result.current.toast).toEqual({ message: 'Saved!', type: 'success' });
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.toast).toBeNull();
  });

  it('showToast defaults type to success', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.showToast('Done'); });
    expect(result.current.toast?.type).toBe('success');
  });

  it('clearToast immediately nulls the toast', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.showToast('Hello', 'info'); });
    act(() => { result.current.clearToast(); });
    expect(result.current.toast).toBeNull();
  });
});

describe('useLeadsPageState — numbered pages (Figma: "Showing 1–25 of N")', () => {
  it('asks the server for 25 rows at the page\'s offset and REPLACES the rows (not appends)', async () => {
    const page1 = Array.from({ length: 25 }, (_, i) => ({ ...BASE_LEAD, id: `p1-${i}` }));
    const page3 = Array.from({ length: 10 }, (_, i) => ({ ...BASE_LEAD, id: `p3-${i}` }));
    mockFetchLeadsPage.mockResolvedValueOnce({ leads: page1, total: 60 }).mockResolvedValueOnce({ leads: page3, total: 60 });
    const { result } = renderHook(() => useLeadsPageState());
    await waitFor(() => expect(result.current.sortedLeads).toHaveLength(25));
    expect(result.current.pageCount).toBe(3);
    act(() => { result.current.setPage(3); });
    await waitFor(() => expect(result.current.sortedLeads).toHaveLength(10));
    expect(lastQuery()).toMatchObject({ limit: 25, offset: 50 });
    expect(result.current.sortedLeads[0].id).toBe('p3-0');
    expect(result.current.page).toBe(3);
  });

  it('clamps setPage to the real range', async () => {
    mockFetchLeadsPage.mockResolvedValue({ leads: TEST_LEADS, total: 30 });
    const { result } = renderHook(() => useLeadsPageState());
    await waitFor(() => expect(result.current.listTotal).toBe(30));
    act(() => { result.current.setPage(99); });
    expect(result.current.page).toBe(2);
    act(() => { result.current.setPage(0); });
    expect(result.current.page).toBe(1);
  });

  it('a filter change goes back to page 1', async () => {
    mockFetchLeadsPage.mockResolvedValue({ leads: TEST_LEADS, total: 80 });
    const { result } = renderHook(() => useLeadsPageState());
    await waitFor(() => expect(result.current.listTotal).toBe(80));
    act(() => { result.current.setPage(3); });
    await waitFor(() => expect(lastQuery()).toMatchObject({ offset: 50 }));
    act(() => { result.current.setFilterStatus('__qualified__'); });
    await waitFor(() => expect(lastQuery()).toMatchObject({ status: '__qualified__', offset: 0 }));
    expect(result.current.page).toBe(1);
  });
});

describe('useLeadsPageState — KPI figures and insights', () => {
  it('kpiMetrics come from the server summary over ALL leads', async () => {
    const { result } = renderHook(() => useLeadsPageState());
    await waitFor(() => expect(result.current.kpiMetrics.total).toBe(1234));
    expect(result.current.kpiMetrics).toMatchObject({ newToday: 2, hot: 300, importedThisWeek: 5 });
    expect(result.current.newUnworkedDelta).toBe(3);
    expect(result.current.sourceQualityThisWeek).toMatchObject({ topSource: 'Website', topSourceAvgScore: 71 });
  });

  it('the New Unworked insight filters to exactly what it counts', async () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.setActiveInsight('untouched'); });
    await waitFor(() => expect(lastQuery()).toMatchObject({ insight: 'new_unworked' }));
  });

  it.each(['overdue', 'duplicateRisk', 'slaBreach', 'nbaAction'] as const)(
    'the %s insight is Coming soon — not fetched, and never a silently unfiltered list', async (insight) => {
      const { result } = renderHook(() => useLeadsPageState());
      await waitFor(() => expect(mockFetchLeadsPage).toHaveBeenCalled());
      act(() => { result.current.setActiveInsight(insight); });
      await waitFor(() => expect(result.current.listUnavailableReason).toMatch(/coming soon/i));
      expect(result.current.sortedLeads).toHaveLength(0);
    });

  it('duplicate detection is empty, not computed over one page', async () => {
    const { result } = renderHook(() => useLeadsPageState());
    await waitFor(() => expect(result.current.sortedLeads).toHaveLength(3));
    expect(result.current.duplicateCandidateMap.size).toBe(0);
    expect(result.current.duplicateRiskLeads).toHaveLength(0);
  });
});
