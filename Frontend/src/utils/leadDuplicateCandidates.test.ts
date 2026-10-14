import { describe, it, expect, vi, beforeEach } from 'vitest';

/** Lead duplicate candidates come from the SERVER (slice 6b), not 50 preloaded leads. */
const api = vi.hoisted(() => ({ fetchLeadsPage: vi.fn(), checkLeadDuplicates: vi.fn() }));
vi.mock('./leadsApi', () => ({ fetchLeadsPage: api.fetchLeadsPage, checkLeadDuplicates: api.checkLeadDuplicates }));
import { findLeadDuplicateCandidates } from './leadDuplicateCandidates';
import { applyServerDuplicates } from '../components/Leads/ImportWizard/importValidator';

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchLeadsPage.mockResolvedValue({ leads: [{ id: '7', first_name: 'Ana', last_name: 'Ray', email: 'ana@kora.example', company: 'Kora' }], total: 1 });
  api.checkLeadDuplicates.mockResolvedValue([{ id: 9, first_name: 'Ana', last_name: 'R', email: null, phone: '+91 80 1234 5678', company: null, stage: 'new', matched_on: 'phone' }]);
});

describe('findLeadDuplicateCandidates', () => {
  it('searches email / last name / company AND asks the exact phone check; unions; drops the lead itself', async () => {
    const pool = await findLeadDuplicateCandidates({ id: '7', email: 'ana@kora.example', last_name: 'Ray', company: 'Kora', phone: '+91 80 1234 5678' });
    expect(api.fetchLeadsPage.mock.calls.map(([q]) => q.search)).toEqual(['ana@kora.example', 'Ray', 'Kora']);
    expect(api.checkLeadDuplicates).toHaveBeenCalledWith([{ email: 'ana@kora.example', phone: '+91 80 1234 5678', company: 'Kora', last_name: 'Ray' }], '7');
    expect(pool.map(l => String(l.id))).toEqual(['9']);   // 7 is the subject itself
  });

  it('a failing query THROWS — never "no duplicates"', async () => {
    api.checkLeadDuplicates.mockRejectedValue(new Error('HTTP 500'));
    await expect(findLeadDuplicateCandidates({ email: 'x@y.example' })).rejects.toThrow('HTTP 500');
  });
});

describe('applyServerDuplicates (CSV import)', () => {
  it('flags exactly the rows the server matched, named from the match', () => {
    const rows = [0, 1, 2].map(index => ({ index, raw: {}, mapped: {}, validation: { tier: 'ok', issues: [] }, isDuplicate: false })) as any;
    const out = applyServerDuplicates(rows, [null, { id: 42, first_name: 'Bo', last_name: 'Lin', email: 'bo@x.example' }, null]);
    expect(out.map(r => r.isDuplicate)).toEqual([false, true, false]);
    expect(out[1].duplicateMatch).toEqual({ id: '42', name: 'Bo Lin', email: 'bo@x.example' });
  });
});
