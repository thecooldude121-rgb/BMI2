import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Login from './Login';

/**
 * Login incident 2026-10-16: the backend was not running. The page must say so
 * plainly — never anything that reads like a wrong password. Drives the REAL
 * AuthProvider with a fetch that fails the way a stopped server does, rather
 * than mocking login()'s result.
 */
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

const signIn = async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><AuthProvider><Login /></AuthProvider></MemoryRouter>);
  await user.type(document.getElementById('email')!, 'asha@kora.example');
  await user.type(document.getElementById('password')!, 'correct-horse-battery');
  await user.click(screen.getByRole('button', { name: /^Sign In$/ }));
};

const expectCantReach = async () => {
  const msg = await screen.findByText(/Can't reach the server/);
  // The error box says only that — nothing about the credentials.
  expect(msg.textContent).not.toMatch(/invalid|incorrect|wrong|password/i);
  expect(screen.queryByText(/invalid email|incorrect|wrong password/i)).toBeNull();
  expect(screen.queryByText(/attempts? left/)).toBeNull();
};

describe('Login when the backend cannot be reached', () => {
  it('a refused connection (server not running) says "Can\'t reach the server"', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await signIn();
    await expectCantReach();
  });

  it.each([502, 503, 504])('a %i from a gateway with no message says the same', async status => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>Bad Gateway</html>', { status, headers: { 'Content-Type': 'text/html' } })));
    await signIn();
    await expectCantReach();
  });

  it('a real wrong-password answer still shows the server\'s own message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: false, message: 'Invalid email or password' }), { status: 401 })));
    await signIn();
    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.queryByText(/Can't reach the server/)).toBeNull();
  });
});
