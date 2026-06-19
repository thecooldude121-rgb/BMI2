// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
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

import { useLeads } from '../contexts/LeadContext';
const mockUseLeads = vi.mocked(useLeads);

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

beforeEach(() => {
  vi.clearAllMocks();
  setupMock();
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

  it('starts with score_high_low sort and correct sortLabel', () => {
    const { result } = renderHook(() => useLeadsPageState());
    expect(result.current.sortBy).toBe('score_high_low');
    expect(result.current.sortLabel).toBe('Score (High to Low)');
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

describe('useLeadsPageState — filters', () => {
  it('setFilterStatus narrows filteredLeads to matching status', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.setFilterStatus('qualified'); });
    expect(result.current.filteredLeads).toHaveLength(1);
    expect(result.current.filteredLeads[0].id).toBe('2');
  });

  it('setFilterSource narrows filteredLeads by source substring', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.setFilterSource('HRMS'); });
    expect(result.current.filteredLeads).toHaveLength(1);
    expect(result.current.filteredLeads[0].id).toBe('2');
  });

  it('setFilterScore narrows filteredLeads to 80-100 band', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.setFilterScore('80-100'); });
    expect(result.current.filteredLeads).toHaveLength(1);
    expect(result.current.filteredLeads[0].id).toBe('1');
  });

  it('resetFilters restores all filters to all', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.setFilterStatus('qualified'); });
    act(() => { result.current.resetFilters(); });
    expect(result.current.filterState).toEqual({ status: 'all', source: 'all', score: 'all' });
    expect(result.current.filteredLeads).toHaveLength(3);
  });
});

describe('useLeadsPageState — sorting', () => {
  it('default sort score_high_low puts highest score first', () => {
    const { result } = renderHook(() => useLeadsPageState());
    expect(result.current.sortedLeads[0].id).toBe('1'); // score 90
  });

  it('setSortBy score_low_high reverses score order', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.setSortBy('score_low_high'); });
    expect(result.current.sortedLeads[0].id).toBe('3'); // score 40
  });

  it('setSortBy name_az puts Alice before Bob before Carol', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.setSortBy('name_az'); });
    expect(result.current.sortedLeads.map(l => l.first_name)).toEqual(['Alice', 'Bob', 'Carol']);
  });

  it('sortLabel updates when sortBy changes', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.setSortBy('name_az'); });
    expect(result.current.sortLabel).toBe('Name (A-Z)');
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

  it('selectAllLeads selects all sorted leads, second call deselects', () => {
    const { result } = renderHook(() => useLeadsPageState());
    act(() => { result.current.selectAllLeads(); });
    expect(result.current.selectedLeadIds).toHaveLength(3);
    act(() => { result.current.selectAllLeads(); });
    expect(result.current.selectedLeadIds).toHaveLength(0);
  });

  it('clearSelection empties the selection', () => {
    const { result } = renderHook(() => useLeadsPageState());
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

describe('useLeadsPageState — pagination', () => {
  it('loadMore increases displayedCount by 20', () => {
    const { result } = renderHook(() => useLeadsPageState());
    const initial = result.current.displayedCount;
    act(() => { result.current.loadMore(); });
    expect(result.current.displayedCount).toBe(initial + 20);
  });

  it('paginatedLeads is a slice of sortedLeads up to displayedCount', () => {
    const { result } = renderHook(() => useLeadsPageState());
    expect(result.current.paginatedLeads.length).toBeLessThanOrEqual(result.current.displayedCount);
  });
});

describe('useLeadsPageState — insight selectors', () => {
  it('readyToConvertLeads contains only qualified leads', () => {
    const { result } = renderHook(() => useLeadsPageState());
    expect(result.current.readyToConvertLeads).toHaveLength(1);
    expect(result.current.readyToConvertLeads[0].id).toBe('2');
  });

  it('duplicateRiskLeads returns leads sharing the same email', () => {
    const dupLead: Lead = { ...BASE_LEAD, id: '4', email: 'bob@test.com' };
    setupMock([...TEST_LEADS, dupLead]);
    const { result } = renderHook(() => useLeadsPageState());
    const dupeIds = result.current.duplicateRiskLeads.map(l => l.id);
    expect(dupeIds).toContain('2');
    expect(dupeIds).toContain('4');
  });

  it('kpiMetrics.total equals the full lead count', () => {
    const { result } = renderHook(() => useLeadsPageState());
    expect(result.current.kpiMetrics.total).toBe(3);
  });

  it('domainLeads length equals contextLeads length', () => {
    const { result } = renderHook(() => useLeadsPageState());
    expect(result.current.domainLeads).toHaveLength(3);
  });
});
