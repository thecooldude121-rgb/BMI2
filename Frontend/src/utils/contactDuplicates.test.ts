import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * One contact duplicate rule, from the server (slice 6b, decided 2026-10-14):
 * candidates by email / name / company / phone digits, scored by the shared
 * engine, a shared email domain ALONE never counted.
 */
const api = vi.hoisted(() => ({ fetchContactsPage: vi.fn() }));
vi.mock('./contactsApi', () => ({ fetchContactsPage: api.fetchContactsPage }));
import { findContactDuplicates } from './contactDuplicates';

const c = (id: string, name: string, email: string, phone = '', company = 'Kora') => ({ id, name, email, phone, company });

beforeEach(() => { vi.clearAllMocks(); });

describe('findContactDuplicates', () => {
  it('asks the server for email, last name, company and phone digits', async () => {
    api.fetchContactsPage.mockResolvedValue({ contacts: [], total: 0 });
    await findContactDuplicates({ email: 'ana@kora.example', last_name: 'Ray', company: 'Kora', phone: '+91 80-1234 5678' });
    const qs = api.fetchContactsPage.mock.calls.map(([q]) => q);
    expect(qs).toEqual(expect.arrayContaining([
      expect.objectContaining({ search: 'ana@kora.example' }),
      expect.objectContaining({ search: 'Ray' }),
      expect.objectContaining({ search: 'Kora' }),
      expect.objectContaining({ phone_digits: '918012345678' }),
    ]));
  });

  it('an exact email is a duplicate; a colleague on the same domain is NOT, and is counted', async () => {
    api.fetchContactsPage.mockResolvedValue({ contacts: [
      c('CT1', 'Ana Ray', 'ana@kora.example'),
      c('CT2', 'Tom Wu', 'tom@kora.example'),
    ], total: 2 });
    const r = await findContactDuplicates({ email: 'ana@kora.example', last_name: 'Ray', first_name: 'Ana' });
    expect(r.matches.map(m => m.id)).toEqual(['CT1']);
    expect(r.domainOnly).toBe(1);
    expect(r.byId.get('CT2')?.name).toBe('Tom Wu');
  });

  it('a record never matches itself (edit mode)', async () => {
    api.fetchContactsPage.mockResolvedValue({ contacts: [c('CT1', 'Ana Ray', 'ana@kora.example')], total: 1 });
    const r = await findContactDuplicates({ id: 'CT1', email: 'ana@kora.example' });
    expect(r.matches).toEqual([]);
  });

  it('a failed query THROWS — "could not check" is never "no duplicates"', async () => {
    api.fetchContactsPage.mockRejectedValue(new Error('HTTP 500'));
    await expect(findContactDuplicates({ email: 'ana@kora.example' })).rejects.toThrow('HTTP 500');
  });

  it('with nothing identifying, asks nothing', async () => {
    const r = await findContactDuplicates({ first_name: 'A' });
    expect(api.fetchContactsPage).not.toHaveBeenCalled();
    expect(r.matches).toEqual([]);
  });
});
