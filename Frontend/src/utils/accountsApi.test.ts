import { describe, it, expect } from 'vitest';
import { mapRowToAccount } from './accountsApi';

/** Slice 3b: an unrecorded size stays unrecorded — it defaulted to '1-10' (and the edit form saved it back). */
describe('mapRowToAccount — size', () => {
  it('no size -> undefined, never "1-10"', () => {
    expect(mapRowToAccount({ id: 'C1', name: 'A', size: null } as never).accountSize).toBeUndefined();
  });
  it('a recorded band is mapped', () => {
    expect(mapRowToAccount({ id: 'C2', name: 'B', size: '51-200' } as never).accountSize).toBe('51-200');
  });
});
