import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordSettings from './PasswordSettings';

/**
 * Change your own password — frontend round trip.
 *
 * The one that matters here is the TOKEN CONTRACT. The endpoint bumps
 * `users.token_version`, which kills the token the request was made with, and
 * returns a replacement. A client that does not store it succeeds at changing
 * the password and 401s on its very next request — a failure that appears one
 * interaction later, in a different part of the app, and looks like a session
 * bug rather than a bug here. So it is pinned twice: that the token is stored,
 * and that a FAILED change never touches it.
 *
 * The server side is `Backend/src/__tests__/roundTrip.profile.test.ts`, which
 * proves the reissue and the revocation against real Postgres.
 */

const applyReissuedToken = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ applyReissuedToken, adoptUser: vi.fn() }),
}));

let fetchMock: ReturnType<typeof vi.fn>;
let stored: Record<string, string>;

const bodyOf = (call: number) => JSON.parse((fetchMock.mock.calls[call][1] as RequestInit).body as string);

/** Fill the three fields the way a user does. */
async function fillForm(user: ReturnType<typeof userEvent.setup>, current: string, next: string, confirm = next) {
  await user.type(screen.getByLabelText('Current Password'), current);
  await user.type(screen.getByLabelText('New Password'), next);
  await user.type(screen.getByLabelText('Confirm New Password'), confirm);
}

beforeEach(() => {
  applyReissuedToken.mockClear();
  stored = { authToken: 'old-token' };
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => stored[k] ?? null,
    setItem: (k: string, v: string) => { stored[k] = v; },
    removeItem: (k: string) => { delete stored[k]; },
    clear: () => { stored = {}; }, key: () => null, length: 0,
  } as unknown as Storage);

  fetchMock = vi.fn(async () => ({
    ok: true, status: 200,
    json: async () => ({
      success: true,
      message: 'Password updated',
      token: 'reissued-token',
      other_sessions_signed_out: true,
    }),
  } as Response));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('PasswordSettings — change your own password', () => {
  it('actually POSTs to /auth/change-password with the field names the server reads', async () => {
    const user = userEvent.setup();
    render(<PasswordSettings />);

    await fillForm(user, 'old-secret-1', 'new-secret-2');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    // handleSave used to be console.log('Updating password'). A request leaving
    // the client at all is the first thing to prove.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:5001/api/v1/auth/change-password');
    expect((init as RequestInit).method).toBe('POST');
    expect(((init as RequestInit).headers as Record<string, string>).Authorization)
      .toBe('Bearer old-token');

    // snake_case, matching authController — not the form's camelCase names.
    expect(bodyOf(0)).toEqual({ current_password: 'old-secret-1', new_password: 'new-secret-2' });
    // The confirmation is a local typing check; the server never sees it.
    expect(bodyOf(0)).not.toHaveProperty('confirm_password');
  });

  it('STORES THE REISSUED TOKEN — without this the next request 401s', async () => {
    const user = userEvent.setup();
    render(<PasswordSettings />);

    await fillForm(user, 'old-secret-1', 'new-secret-2');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => expect(applyReissuedToken).toHaveBeenCalledTimes(1));
    expect(applyReissuedToken).toHaveBeenCalledWith('reissued-token');
  });

  it('reports success only after a real 200, and says other sessions ended', async () => {
    const user = userEvent.setup();
    render(<PasswordSettings />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await fillForm(user, 'old-secret-1', 'new-secret-2');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    const ok = await screen.findByRole('status');
    expect(ok).toHaveTextContent(/password updated/i);
    expect(ok).toHaveTextContent(/signed out/i);
    // Cleared, so the old password is not left sitting in the DOM.
    expect(screen.getByLabelText('Current Password')).toHaveValue('');
    expect(screen.getByLabelText('New Password')).toHaveValue('');
  });

  it('a wrong current password shows the server\'s reason and does NOT touch the token', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false, status: 400,
      json: async () => ({ success: false, message: 'Current password is incorrect' }),
    } as Response));

    const user = userEvent.setup();
    render(<PasswordSettings />);
    await fillForm(user, 'wrong-guess', 'new-secret-2');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    // The session is untouched by a refused change — replacing a token here
    // would sign the user out for guessing wrong.
    expect(applyReissuedToken).not.toHaveBeenCalled();
    expect(stored.authToken).toBe('old-token');
  });

  it('the rate limiter\'s 429 reaches the user as its own message', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false, status: 429,
      json: async () => ({ success: false, message: 'Too many attempts. Try again in 15 minutes.' }),
    } as Response));

    const user = userEvent.setup();
    render(<PasswordSettings />);
    await fillForm(user, 'wrong-again', 'new-secret-2');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Too many attempts/);
  });

  it('a mismatched confirmation never reaches the server', async () => {
    const user = userEvent.setup();
    render(<PasswordSettings />);
    await fillForm(user, 'old-secret-1', 'new-secret-2', 'new-secret-3');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('an empty form never reaches the server', async () => {
    const user = userEvent.setup();
    render(<PasswordSettings />);
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/current password and a new one/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('states the rule the SERVER enforces, and not a policy it does not have', async () => {
    render(<PasswordSettings />);

    expect(screen.getByText(/At least 8 characters long/)).toBeInTheDocument();
    expect(screen.getByText(/Different from your current password/)).toBeInTheDocument();

    // The old list promised four rules authController does not apply. A
    // checklist that is not the rule is the UI asserting something untrue.
    expect(screen.queryByText(/uppercase and lowercase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/at least one number/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/special character/i)).not.toBeInTheDocument();
  });

  it('a short password is refused by the server and reported, not pre-judged by a fake rule', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false, status: 400,
      json: async () => ({ success: false, message: 'New password must be at least 8 characters' }),
    } as Response));

    const user = userEvent.setup();
    render(<PasswordSettings />);
    await fillForm(user, 'old-secret-1', 'short');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('New password must be at least 8 characters');
  });
});
