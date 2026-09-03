import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileSettings from './ProfileSettings';

/**
 * Your profile — frontend round trip.
 *
 * The standard set by GeneralPreferences.test.tsx and TeamManagement.test.tsx:
 * render the REAL component, drive it the way a user does, assert the request
 * that actually left the client, and assert the UI shows what the SERVER
 * returned rather than what was typed. `fetch` is the seam.
 *
 * What this does not prove: that the server behaves as mocked. That is
 * `Backend/src/__tests__/roundTrip.profile.test.ts`, which exercises the same
 * two endpoints against real Postgres — including the 409 this file mocks.
 * Neither suite is the round trip on its own.
 */

const me = {
  id: 7,
  email: 'david@bmicrm.com',
  first_name: 'David',
  last_name: 'Kim',
  role: 'admin',
  department: 'Sales',
  avatar_url: null as string | null,
  is_active: true,
  created_at: '2026-01-15T09:00:00.000Z',
  last_login_at: '2026-09-03T08:30:00.000Z',
  workspace_id: 'ws-1',
};

const adoptUser = vi.fn();

// The page reads AuthContext only to push the saved row back into the session.
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ adoptUser, applyReissuedToken: vi.fn() }),
}));

let fetchMock: ReturnType<typeof vi.fn>;

const bodyOf = (call: number) => JSON.parse((fetchMock.mock.calls[call][1] as RequestInit).body as string);

beforeEach(() => {
  adoptUser.mockClear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k === 'authToken' ? 'test-token' : null),
    setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
  } as unknown as Storage);

  fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    if (!init?.method) {
      return { ok: true, status: 200, json: async () => ({ success: true, user: me }) } as Response;
    }
    const patch = JSON.parse(init.body as string);
    return {
      ok: true, status: 200,
      json: async () => ({ success: true, data: { ...me, ...patch } }),
    } as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('ProfileSettings — your own account', () => {
  it('loads THIS user from GET /auth/me, not from local state', async () => {
    render(<ProfileSettings />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:5001/api/v1/auth/me');
    expect((init as RequestInit | undefined)?.method).toBeUndefined();      // a GET
    expect(((init as RequestInit).headers as Record<string, string>).Authorization)
      .toBe('Bearer test-token');

    expect(await screen.findByText('David Kim')).toBeInTheDocument();
    expect(screen.getAllByText('david@bmicrm.com').length).toBeGreaterThan(0);
  });

  it('the placeholder identity is GONE — not merely hidden', async () => {
    // The page rendered "Alex Rodriguez", a San Francisco address, a
    // "+1 (555) 123-4567" phone and a December 2024 last login, none of which
    // belonged to anyone. Asserting their absence is what stops them coming
    // back as a "default" the next time the page is edited.
    render(<ProfileSettings />);
    await screen.findByText('David Kim');

    expect(screen.queryByText(/Alex Rodriguez/)).not.toBeInTheDocument();
    expect(screen.queryByText(/San Francisco/)).not.toBeInTheDocument();
    expect(screen.queryByText(/555\) 123-4567/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dec 13, 2024/)).not.toBeInTheDocument();
  });

  it('the NotAvailable banner is gone, because the endpoints exist now', async () => {
    const { container } = render(<ProfileSettings />);
    await screen.findByText('David Kim');
    expect(container.querySelector('[data-not-available]')).toBeNull();
    expect(screen.queryByText(/is not available yet/)).not.toBeInTheDocument();
  });

  it('shows the real read-only columns: role, department, member since, last login', async () => {
    render(<ProfileSettings />);
    await screen.findByText('David Kim');

    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
    expect(screen.getByText('Sales')).toBeInTheDocument();
    // created_at 2026-01-15 and last_login_at 2026-09-03, both real columns.
    // Matched loosely on purpose: both dates go through toLocaleDateString with
    // an undefined locale, so day/month order follows whatever locale the run
    // has. Pinning "15 Jan 2026" would pass here and fail on a US machine, which
    // is a test asserting the runner's locale rather than the component.
    expect(screen.getByText(/Jan.*15.*2026|15.*Jan.*2026/)).toBeInTheDocument();
    expect(screen.getByText(/Sep.*3.*2026|3.*Sep.*2026/)).toBeInTheDocument();
  });

  it('an account that has never signed in says so, rather than showing a date', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: true, status: 200,
      json: async () => ({ success: true, user: { ...me, last_login_at: null } }),
    } as Response));

    render(<ProfileSettings />);
    expect(await screen.findByText('Never signed in')).toBeInTheDocument();
  });

  it('a null department is "Not set", not an invented one', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: true, status: 200,
      json: async () => ({ success: true, user: { ...me, department: null } }),
    } as Response));

    render(<ProfileSettings />);
    await screen.findByText('David Kim');
    expect(screen.getByText('Not set')).toBeInTheDocument();
  });

  it('PATCHes only the CHANGED fields and renders the server response', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings />);
    await screen.findByText('David Kim');

    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    const first = screen.getByLabelText('First Name');
    await user.clear(first);
    await user.type(first, 'Dave');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('http://localhost:5001/api/v1/auth/me');
    expect((init as RequestInit).method).toBe('PATCH');

    // Email is untouched, so it is NOT resent. Resending it would make every
    // save a candidate for the UNIQUE(tenant_id, email) 409 for no reason.
    expect(bodyOf(1)).toEqual({ first_name: 'Dave' });

    expect(await screen.findByText('Dave Kim')).toBeInTheDocument();
  });

  it('renders the SERVER\'s value, not the typed one, when they differ', async () => {
    // The server trims. If the form rendered its own state, a normalised value
    // would silently diverge from what is stored.
    fetchMock.mockImplementation(async (_u: string, init?: RequestInit) => {
      if (!init?.method) return { ok: true, status: 200, json: async () => ({ success: true, user: me }) } as Response;
      return {
        ok: true, status: 200,
        json: async () => ({ success: true, data: { ...me, first_name: 'Trimmed' } }),
      } as Response;
    });

    const user = userEvent.setup();
    render(<ProfileSettings />);
    await screen.findByText('David Kim');

    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    const first = screen.getByLabelText('First Name');
    await user.clear(first);
    await user.type(first, '   whatever i typed   ');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Trimmed Kim')).toBeInTheDocument();
  });

  it('pushes the saved row into the session, so the top bar is not stale', async () => {
    // Lesson 3 in CLAUDE.md, one layer out: the page can be right and the app
    // still show the old name, because the header reads AuthContext.
    const user = userEvent.setup();
    render(<ProfileSettings />);
    await screen.findByText('David Kim');

    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    const last = screen.getByLabelText('Last Name');
    await user.clear(last);
    await user.type(last, 'Kimura');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(adoptUser).toHaveBeenCalledTimes(1));
    expect(adoptUser.mock.calls[0][0]).toMatchObject({ last_name: 'Kimura', email: 'david@bmicrm.com' });
  });

  it('a duplicate email is a clean 409 message, and the form keeps the old value', async () => {
    fetchMock.mockImplementation(async (_u: string, init?: RequestInit) => {
      if (!init?.method) return { ok: true, status: 200, json: async () => ({ success: true, user: me }) } as Response;
      return {
        ok: false, status: 409,
        json: async () => ({
          success: false,
          message: 'Someone in this workspace already uses that email address',
        }),
      } as Response;
    });

    const user = userEvent.setup();
    render(<ProfileSettings />);
    await screen.findByText('David Kim');

    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    const email = screen.getByLabelText('Email Address');
    await user.clear(email);
    await user.type(email, 'taken@bmicrm.com');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // The server's words, verbatim — not "Save failed".
    expect(await screen.findByRole('alert'))
      .toHaveTextContent('Someone in this workspace already uses that email address');
    // And nothing was adopted: a rejected write must not move the session.
    expect(adoptUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Email Address')).toHaveValue('taken@bmicrm.com');
  });

  it('a failed load is an error, not an empty form that looks like an empty account', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false, status: 401, json: async () => ({ success: false, message: 'Not authorised' }),
    } as Response));

    render(<ProfileSettings />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Not authorised');
    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
  });

  it('saving with nothing changed sends no request at all', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings />);
    await screen.findByText('David Kim');

    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // The server refuses an empty body with a 400; there is no reason to make
    // the round trip to be told.
    await waitFor(() => expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('offers no control for a field with no column, and none for role', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings />);
    await screen.findByText('David Kim');
    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    // Editable: exactly the three PATCH /auth/me accepts.
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();

    // No column behind any of these, so no control for them.
    for (const gone of ['Phone Number', 'Job Title', 'Location', 'Timezone', 'Language']) {
      expect(screen.queryByLabelText(gone)).not.toBeInTheDocument();
    }
    // Role is a real column but the server refuses it here — offering the
    // control would be an offer to escalate that the server would decline.
    expect(screen.queryByLabelText('Role')).not.toBeInTheDocument();
  });

  it('claims nothing about email verification, and offers no second password form', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings />);
    await screen.findByText('David Kim');

    // There is no verification step anywhere in this product.
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
    expect(screen.queryByText(/verification link/i)).not.toBeInTheDocument();
    // Email visibility controlled nothing, and the avatar modal reported a save
    // it never made.
    expect(screen.queryByText(/Email Visibility/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /change avatar/i })).not.toBeInTheDocument();
    // The password form lives under Account -> Password, wired to its endpoint.
    expect(screen.queryByText(/CHANGE PASSWORD/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    // Said out loud, because it is surprising and the old modal claimed otherwise.
    expect(screen.getByText(/no confirmation email/i)).toBeInTheDocument();
  });
});
