import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRelatedRecordOptions, MODULE_LABEL } from './useRelatedRecordOptions';

/**
 * The "Related record" picker's options.
 *
 * WHAT BROKE, and what these pin. Uploading a document with any related record
 * failed with "module must be one of: lead, deal, contact, account, activity".
 * Two independent causes, one behind the other:
 *
 *  1. The form sent CAPITALISED modules — 'Deal', 'Account', 'Contact' —
 *     against a lowercase allowlist. Now prevented by the `DocumentModule`
 *     union, so it cannot compile; asserted here as a value-level guarantee
 *     too, since these options ARE what the form submits.
 *
 *  2. The picker offered four hardcoded lists of ids that DO NOT EXIST —
 *     deal_acme_001, account_acme, contact_john_smith, act_bigco_001 — where
 *     real ids are D002, C002, CT001. Even lowercased, the server rejected
 *     `record_id` as naming nothing in the workspace. So the options must come
 *     from the fetches, and these tests assert the fabricated ids are gone.
 */

vi.mock('../utils/dealsApi', () => ({ fetchDeals: vi.fn() }));
vi.mock('../utils/accountsApi', () => ({ fetchAccounts: vi.fn() }));
vi.mock('../utils/contactsApi', () => ({ fetchContacts: vi.fn() }));
vi.mock('../utils/activitiesApi', () => ({ fetchActivities: vi.fn() }));

import { fetchDeals } from '../utils/dealsApi';
import { fetchAccounts } from '../utils/accountsApi';
import { fetchContacts } from '../utils/contactsApi';
import { fetchActivities } from '../utils/activitiesApi';

const asMock = (f: unknown) => f as unknown as ReturnType<typeof vi.fn>;

/** Real id shapes from this workspace. */
const REAL = {
  deals:      [{ id: 'D042', name: 'Moving Walls – DOOH', company_name: 'Moving Walls' }],
  accounts:   [{ id: 'C002', name: 'Acme Corp', industry: 'Technology' }],
  contacts:   [{ id: 'CT001', name: 'Nancy Wilson', company: 'FinSolve Ltd' }],
  activities: [{ id: 'a1b2', subject: 'Discovery call', type: 'call' }],
};

beforeEach(() => {
  asMock(fetchDeals).mockResolvedValue(REAL.deals);
  asMock(fetchAccounts).mockResolvedValue(REAL.accounts);
  asMock(fetchContacts).mockResolvedValue(REAL.contacts);
  asMock(fetchActivities).mockResolvedValue(REAL.activities);
});
afterEach(() => vi.clearAllMocks());

describe('useRelatedRecordOptions', () => {
  it('fetches nothing until the modal is open', () => {
    renderHook(() => useRelatedRecordOptions(false));
    expect(fetchDeals).not.toHaveBeenCalled();
    expect(fetchActivities).not.toHaveBeenCalled();
  });

  it('offers all four record types, with REAL ids', async () => {
    const { result } = renderHook(() => useRelatedRecordOptions(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.options.map(o => o.id).sort())
      .toEqual(['C002', 'CT001', 'D042', 'a1b2']);
    expect(result.current.options.map(o => o.module).sort())
      .toEqual(['account', 'activity', 'contact', 'deal']);
  });

  it('EVERY module is lowercase — the exact bug that broke uploads', async () => {
    /*
     * The server compares verbatim against
     * ['lead','deal','contact','account','activity'], so 'Deal' is a 400.
     * The type makes it uncompilable; this makes it untrue at runtime as well.
     */
    const { result } = renderHook(() => useRelatedRecordOptions(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const VALID = ['lead', 'deal', 'contact', 'account', 'activity'];
    for (const o of result.current.options) {
      expect(o.module).toBe(o.module.toLowerCase());
      expect(VALID, `module '${o.module}' is not in the server's allowlist`).toContain(o.module);
    }
  });

  it('none of the four fabricated id sets can appear', async () => {
    const { result } = renderHook(() => useRelatedRecordOptions(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const ids = result.current.options.map(o => o.id);
    for (const fake of ['deal_acme_001', 'account_acme', 'contact_john_smith', 'act_bigco_001']) {
      expect(ids).not.toContain(fake);
    }
  });

  it('one failing endpoint costs one type, not the whole picker', async () => {
    // allSettled: a broken contacts endpoint must not make the upload
    // unusable for deals.
    asMock(fetchContacts).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useRelatedRecordOptions(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.failed).toEqual(['contacts']);
    expect(result.current.options.map(o => o.module)).toContain('deal');
    expect(result.current.options.map(o => o.module)).not.toContain('contact');
  });

  it('a wrong-shaped payload degrades instead of throwing', async () => {
    // The boundary lesson from the Team pages: `for (const x of {})` inside a
    // hook takes the whole modal down.
    asMock(fetchDeals).mockResolvedValue({ not: 'an array' } as never);
    const { result } = renderHook(() => useRelatedRecordOptions(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.failed).toContain('deals');
    expect(result.current.options.map(o => o.module)).toContain('account');
  });

  it('skips records with no id rather than emitting an empty record_id', async () => {
    // `module` without `record_id` is its own 400 ("must be supplied together").
    asMock(fetchDeals).mockResolvedValue([{ name: 'No id here' }, ...REAL.deals]);
    const { result } = renderHook(() => useRelatedRecordOptions(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const deals = result.current.options.filter(o => o.module === 'deal');
    expect(deals).toHaveLength(1);
    expect(deals[0].id).toBe('D042');
  });

  it('falls back to a real field for the label, never a placeholder', async () => {
    asMock(fetchContacts).mockResolvedValue([{ id: 'CT099', email: 'x@bmicrm.com' }]);
    const { result } = renderHook(() => useRelatedRecordOptions(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const c = result.current.options.find(o => o.module === 'contact');
    // The email, because that is true — not "Unknown Contact".
    expect(c?.name).toBe('x@bmicrm.com');
  });
});

describe('MODULE_LABEL', () => {
  it('labels every module the server accepts', () => {
    for (const m of ['lead', 'deal', 'contact', 'account', 'activity'] as const) {
      expect(MODULE_LABEL[m]).toBeTruthy();
    }
  });
});
