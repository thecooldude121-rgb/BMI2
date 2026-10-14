import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth, type LoginResult } from './AuthContext';

/** login() reads the per-email count from the RateLimit header the server exposes. */
afterEach(() => { vi.unstubAllGlobals(); });

function Probe({ onReady }: { onReady: (login: (e: string, p: string) => Promise<LoginResult>) => void }) {
  const { login } = useAuth();
  onReady(login);
  return null;
}

it('maps "login-email" r and Retry-After onto the result', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: false, message: 'Too many attempts. Please try again later.' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', RateLimit: '"login-ip"; r=20; t=900, "login-email"; r=0; t=600', 'Retry-After': '600' },
  })));
  let login!: (e: string, p: string) => Promise<LoginResult>;
  render(<AuthProvider><Probe onReady={l => { login = l; }} /></AuthProvider>);
  let result!: LoginResult;
  await act(async () => { result = await login('a@b.example', 'x'); });
  expect(result).toEqual({ ok: false, message: 'Too many attempts. Please try again later.', attemptsRemaining: 0, retryAfterSeconds: 600 });
});

describe('without the header', () => {
  it('reports no count at all', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'Invalid email or password' }), { status: 401 })));
    let login!: (e: string, p: string) => Promise<LoginResult>;
    render(<AuthProvider><Probe onReady={l => { login = l; }} /></AuthProvider>);
    let result!: LoginResult;
    await act(async () => { result = await login('a@b.example', 'x'); });
    expect(result.attemptsRemaining).toBeUndefined();
  });
});
