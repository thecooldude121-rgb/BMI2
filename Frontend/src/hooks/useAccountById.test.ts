import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAccountById } from './useAccountById';

/**
 * Slice 3b: detail / edit / merge load their account BY ID from the server (they
 * looked it up in the context's first 200). "Not found" and "failed" differ.
 */
const realFetch = global.fetch;
afterEach(() => { global.fetch = realFetch; });
const respond = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue({ ok: status < 400, status, json: () => Promise.resolve(body) });

describe('useAccountById', () => {
  it('loads the account from GET /companies/:id — no 200-row limit', async () => {
    global.fetch = respond(200, { data: { id: 'C201', name: 'Number 201' } }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAccountById('C201'));
    await waitFor(() => expect(result.current.account?.name).toBe('Number 201'));
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('/companies/C201');
  });
  it('a 404 is "not found" (null), not an error', async () => {
    global.fetch = respond(404, { message: 'Company not found' }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAccountById('C999'));
    await waitFor(() => expect(result.current.account).toBeNull());
    expect(result.current.error).toBeNull();
  });
  it('any other failure is an error — never "not found"', async () => {
    global.fetch = respond(500, { message: 'boom' }) as unknown as typeof fetch;
    const { result } = renderHook(() => useAccountById('C1'));
    await waitFor(() => expect(result.current.error).toBe('boom'));
    expect(result.current.account).toBeUndefined();
  });
});
