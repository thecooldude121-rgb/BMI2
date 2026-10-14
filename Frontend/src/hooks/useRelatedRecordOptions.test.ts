import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

/**
 * The document upload picker searches the SERVER (slice 6). It loaded the first
 * 200 deals, accounts, contacts and activities and filtered them in the browser.
 */
const api = vi.hoisted(() => ({
  fetchDealsPage: vi.fn(), fetchAccountsPage: vi.fn(), fetchContactsPage: vi.fn(), fetchActivitiesPage: vi.fn(), fetchLeadsPage: vi.fn(),
}));
vi.mock('../utils/dealsApi', () => ({ fetchDealsPage: api.fetchDealsPage }));
vi.mock('../utils/accountsApi', () => ({ fetchAccountsPage: api.fetchAccountsPage }));
vi.mock('../utils/contactsApi', () => ({ fetchContactsPage: api.fetchContactsPage }));
vi.mock('../utils/activitiesApi', () => ({ fetchActivitiesPage: api.fetchActivitiesPage }));
vi.mock('../utils/leadsApi', () => ({ fetchLeadsPage: api.fetchLeadsPage }));

import { useRelatedRecordOptions, MODULE_LABEL } from './useRelatedRecordOptions';

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchDealsPage.mockResolvedValue({ deals: [{ id: 'D002', name: 'Kora renewal', company_name: 'Kora' }], total: 40, limit: 10, offset: 0 });
  api.fetchAccountsPage.mockResolvedValue({ accounts: [{ id: 'C002', name: 'Kora', industry: 'EdTech' }], total: 1 });
  api.fetchContactsPage.mockResolvedValue({ contacts: [{ id: 'CT001', name: '', email: 'ana@kora.example', company: 'Kora' }], total: 1 });
  api.fetchActivitiesPage.mockResolvedValue({ activities: [{ id: 'a1', subject: 'Kora call', type: 'call' }], total: 1 });
});

describe('useRelatedRecordOptions — server search', () => {
  it('asks nothing while disabled', () => {
    renderHook(() => useRelatedRecordOptions(false, 'kora'));
    expect(api.fetchDealsPage).not.toHaveBeenCalled();
  });

  it('sends the typed text to all four list endpoints, 10 each, and returns REAL ids', async () => {
    const { result } = renderHook(() => useRelatedRecordOptions(true, 'kora'));
    await waitFor(() => expect(result.current.options).toHaveLength(4));
    for (const f of [api.fetchDealsPage, api.fetchAccountsPage, api.fetchContactsPage, api.fetchActivitiesPage]) {
      expect(f).toHaveBeenCalledWith(expect.objectContaining({ search: 'kora', limit: 10 }));
    }
    expect(result.current.options.map(o => `${o.module}:${o.id}`)).toEqual(['deal:D002', 'account:C002', 'contact:CT001', 'activity:a1']);
    // A contact with no name falls back to a real field, never a placeholder.
    expect(result.current.options[2].name).toBe('ana@kora.example');
    // 40 deals match and 1 is shown: 39 more the picker must admit to.
    expect(result.current.hidden).toBe(39);
  });

  it('one failing endpoint costs one type, not the whole picker', async () => {
    api.fetchAccountsPage.mockRejectedValue(new Error('down'));
    const { result } = renderHook(() => useRelatedRecordOptions(true, ''));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.failed).toEqual(['accounts']);
    expect(result.current.options.map(o => o.module)).toEqual(['deal', 'contact', 'activity']);
  });

  it('a wrong-shaped reply degrades to a failed type instead of throwing', async () => {
    api.fetchDealsPage.mockResolvedValue({ deals: 'nope', total: 0 });
    const { result } = renderHook(() => useRelatedRecordOptions(true, ''));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.failed).toContain('deals');
  });

  it('skips records with no id rather than emitting an empty record_id', async () => {
    api.fetchDealsPage.mockResolvedValue({ deals: [{ id: '', name: 'Ghost' }, { id: 'D9', name: 'Real' }], total: 2, limit: 10, offset: 0 });
    const { result } = renderHook(() => useRelatedRecordOptions(true, ''));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.options.filter(o => o.module === 'deal').map(o => o.id)).toEqual(['D9']);
    expect(MODULE_LABEL.account).toBe('Account');
  });
});
