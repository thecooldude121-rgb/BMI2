import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * The "attempts left" banner shows the SERVER's per-email count (2026-10-13).
 * It was a browser counter that reset on reload, counted any failure (a
 * network error included) and invented a 5-minute lockout the server never set.
 */
const auth = vi.hoisted(() => ({ login: vi.fn() }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: null, loading: false, login: auth.login }) }));

import Login from './Login';

const signIn = async (email = 'asha@kora.example') => {
  const user = userEvent.setup();
  render(<MemoryRouter><Login /></MemoryRouter>);
  await user.type(document.getElementById('email')!, email);
  await user.type(document.getElementById('password')!, 'wrong-password');
  await user.click(screen.getByRole('button', { name: /^Sign In$/ }));
  return user;
};

beforeEach(() => { vi.clearAllMocks(); });

describe('Login — attempts left come from the server', () => {
  it('shows the server\'s remaining count and window', async () => {
    auth.login.mockResolvedValue({ ok: false, message: 'Invalid email or password', attemptsRemaining: 2, retryAfterSeconds: 840 });
    await signIn();
    expect(await screen.findByText(/2 sign-in attempts left for this email before a pause of about 14 minutes\./)).toBeInTheDocument();
  });

  it('says nothing while plenty remain, or when the server sent no count', async () => {
    auth.login.mockResolvedValueOnce({ ok: false, message: 'Invalid email or password', attemptsRemaining: 4 });
    await signIn();
    await screen.findByText('Invalid email or password');
    expect(screen.queryByText(/attempts? left/)).toBeNull();
  });

  it('never counts in the browser: five refusals with no header show no banner and no invented lockout', async () => {
    auth.login.mockResolvedValue({ ok: false, message: 'Could not reach the server. Check your connection and try again.' });
    const user = await signIn();
    for (let k = 0; k < 5; k++) await user.click(screen.getByRole('button', { name: /^Sign In$/ }));
    expect(auth.login).toHaveBeenCalledTimes(6);
    expect(screen.queryByText(/attempts? (left|remaining)/)).toBeNull();
    expect(screen.queryByText(/try again in 5 minutes/i)).toBeNull();
  });
});
