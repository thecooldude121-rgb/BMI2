import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamManagement from './TeamManagement';

/**
 * Team Management — frontend round trip.
 *
 * Same standard as checkpoint 1: render the REAL page, act through it, assert
 * the request that actually left the client, and assert the UI reflects what the
 * SERVER returned. `fetch` is the seam.
 *
 * This page previously ran on a 44-field fabricated model. These tests also
 * pin that the invented sections are LABELLED rather than silently rendering
 * plausible numbers, because that is the failure this whole codebase has been
 * unwinding.
 */

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'Admin' } }),
}));
const showToast = vi.fn();
vi.mock('../../../contexts/ToastContext', () => ({ useToast: () => ({ showToast }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

const rows = [
  {
    id: 1, first_name: 'Priya', last_name: 'Nair', email: 'priya@example.com',
    role: 'manager', department: 'Sales', is_active: true,
    last_login_at: '2026-09-01T10:30:00.000Z', created_at: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 2, first_name: 'Sam', last_name: 'Okafor', email: 'sam@example.com',
    role: 'sales', department: null, is_active: true,
    last_login_at: null, created_at: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 3, first_name: 'Dee', last_name: 'Activated', email: 'dee@example.com',
    role: 'sales', department: 'Support', is_active: false,
    last_login_at: '2026-08-01T08:00:00.000Z', created_at: '2026-03-01T09:00:00.000Z',
  },
];

let fetchMock: ReturnType<typeof vi.fn>;
/** Requests made to a URL containing `part`. */
const callsTo = (part: string) => fetchMock.mock.calls.filter((c) => String(c[0]).includes(part));

function mockServer(overrides: Partial<{
  users: unknown;
  /**
   * The envelope field `GET /users` really sends — the roles THIS caller may
   * assign, computed server-side by `rolesAssignableBy`. Defaults to absent,
   * which is what a caller who may not change roles receives, so the existing
   * tests below see no role controls.
   *
   * The shape here is pinned on the server by
   * `Backend/src/__tests__/roundTrip.userRoles.test.ts` — "GET /users tells an
   * ADMIN…", "…never offers a MANAGER the admin role…" and "…offers a SALES
   * user nothing at all". If those three change, these fixtures are wrong.
   */
  assignableRoles: string[];
  invites: unknown;
  /** What GET /invites reports this caller may invite someone AS. */
  invitableRoles: string[];
  onPost: (url: string, body: unknown) => Response;
  onPatch: (url: string, body: unknown) => Response;
}> = {}) {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (method === 'GET' && url.includes('/users')) {
      return { ok: true, status: 200, json: async () => ({
        success: true,
        data: overrides.users ?? rows,
        ...(overrides.assignableRoles ? { assignable_roles: overrides.assignableRoles } : {}),
      }) } as Response;
    }
    if (method === 'PATCH' && overrides.onPatch) {
      return overrides.onPatch(url, init?.body ? JSON.parse(init.body as string) : undefined);
    }
    if (method === 'GET' && url.includes('/invites')) {
      return { ok: true, status: 200, json: async () => ({
        success: true,
        data: overrides.invites ?? [],
        // GET /invites carries the invite form's role options — see
        // `Backend/src/__tests__/roundTrip.userManagement.test.ts`,
        // "GET /invites serves the role options…". There is no client-side
        // fallback: an absent field means an empty picker, deliberately, so
        // these fixtures must send what the server sends.
        assignable_roles: overrides.invitableRoles ?? ['sales', 'manager', 'hr', 'admin'],
      }) } as Response;
    }
    if (overrides.onPost) return overrides.onPost(url, init?.body ? JSON.parse(init.body as string) : undefined);
    return { ok: true, status: 200, json: async () => ({ success: true, data: {} }) } as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
}

beforeEach(() => {
  showToast.mockReset();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k === 'authToken' ? 'test-token' : null),
    setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
  } as unknown as Storage);
  mockServer();
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('TeamManagement — the real roster', () => {
  it('loads members from the API, asking for inactive ones too', async () => {
    render(<TeamManagement />);
    await waitFor(() => expect(callsTo('/users').length).toBe(1));

    const [url, init] = callsTo('/users')[0];
    // The screen that manages deactivation must not hide deactivated people.
    expect(url).toBe('http://localhost:5001/api/v1/users?include_inactive=true');
    expect(((init as RequestInit).headers as Record<string, string>).Authorization).toBe('Bearer test-token');

    expect(await screen.findByText('Priya Nair')).toBeInTheDocument();
    expect(screen.getByText('Sam Okafor')).toBeInTheDocument();
    // The deactivated member IS listed, and marked.
    expect(screen.getByText('Dee Activated')).toBeInTheDocument();
    expect(screen.getByText('INACTIVE')).toBeInTheDocument();
  });

  it('renders the real fields, and says "Never signed in" rather than inventing a date', async () => {
    render(<TeamManagement />);
    await screen.findByText('Priya Nair');

    expect(screen.getByText('priya@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Sales').length).toBeGreaterThan(0);   // department, and the role label
    // last_login_at is null for Sam — the absence is stated, not backfilled.
    expect(screen.getAllByText(/Never signed in/).length).toBeGreaterThan(0);
    // A member with no department says so instead of showing a made-up one.
    expect(screen.getByText('No department set')).toBeInTheDocument();
  });

  it('the fabricated sections are LABELLED, and their invented numbers are gone', async () => {
    render(<TeamManagement />);
    await screen.findByText('Priya Nair');

    // Per-member deal stats and billing were invented; both now say so.
    expect(screen.getAllByText(/Per-member deal statistics is not available yet/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Billing and plan management is not available yet/i)).toBeInTheDocument();

    // And the figures themselves are not on the page any more.
    expect(screen.queryByText(/Quick Stats/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Monthly cost/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Upgrade Options/i)).not.toBeInTheDocument();
    // Employee ids and job titles had no columns.
    expect(screen.queryByText(/^ID: /)).not.toBeInTheDocument();
  });

  it('a failed load says so instead of rendering an empty roster as though it were the team', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false, status: 500, json: async () => ({ success: false, message: 'Internal Server Error' }),
    } as Response));

    render(<TeamManagement />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('Priya Nair')).not.toBeInTheDocument();
  });
});

describe('TeamManagement — deactivate', () => {
  it('POSTs to the real endpoint and renders the state the server returned', async () => {
    const user = userEvent.setup();
    mockServer({
      onPost: (url) => {
        expect(url).toBe('http://localhost:5001/api/v1/users/1/deactivate');
        return {
          ok: true, status: 200,
          json: async () => ({ success: true, data: { ...rows[0], is_active: false } }),
        } as Response;
      },
    });
    render(<TeamManagement />);
    await screen.findByText('Priya Nair');

    // Drive it the way a user does: the member's Deactivate action, then confirm.
    await user.click(screen.getAllByRole('button', { name: /^deactivate$/i })[0]);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(/Deactivate Priya Nair\?/);
    // The confirmation states what actually happens — soft, reversible.
    expect(dialog).toHaveTextContent(/Nothing is deleted/i);

    await user.click(within(dialog).getByRole('button', { name: /^deactivate$/i }));

    await waitFor(() => expect(callsTo('/deactivate').length).toBe(1));
    expect((callsTo('/deactivate')[0][1] as RequestInit).method).toBe('POST');

    // The row now shows inactive because the SERVER said so.
    await waitFor(() => expect(screen.getAllByText('INACTIVE').length).toBe(2));
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('was deactivated'), 'success');
  });

  it('a 409 shows the server\'s real reason and leaves the member active', async () => {
    const user = userEvent.setup();
    mockServer({
      onPost: () => ({
        ok: false, status: 409,
        json: async () => ({ success: false, message: 'Cannot deactivate the last admin or manager in this workspace' }),
      } as Response),
    });
    render(<TeamManagement />);
    await screen.findByText('Priya Nair');

    await user.click(screen.getAllByRole('button', { name: /^deactivate$/i })[0]);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^deactivate$/i }));

    // The server's words, verbatim — the client does not pre-guess this rule.
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cannot deactivate the last admin or manager in this workspace',
    );
    // Still one inactive member, not two: nothing changed.
    await waitFor(() => expect(screen.getAllByText('INACTIVE').length).toBe(1));
  });

  it('reactivate calls the real endpoint and reflects the response', async () => {
    const user = userEvent.setup();
    mockServer({
      onPost: (url) => {
        expect(url).toContain('/users/3/reactivate');
        return {
          ok: true, status: 200,
          json: async () => ({ success: true, data: { ...rows[2], is_active: true } }),
        } as Response;
      },
    });
    render(<TeamManagement />);
    await screen.findByText('Dee Activated');

    await user.click(screen.getByRole('button', { name: /reactivate/i }));
    await waitFor(() => expect(callsTo('/reactivate').length).toBe(1));
    // The INACTIVE badge is gone because the server returned is_active: true.
    await waitFor(() => expect(screen.queryByText('INACTIVE')).not.toBeInTheDocument());
  });
});

describe('TeamManagement — invite', () => {
  const openInvite = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: /invite a member/i }));
    return screen.findByLabelText('Email address');
  };

  it('submits the email and role to POST /invites', async () => {
    const user = userEvent.setup();
    mockServer({
      onPost: () => ({
        ok: true, status: 201,
        json: async () => ({
          success: true,
          invite: { id: 'inv-1', email: 'new@example.com', role: 'sales', expires_at: '2026-09-10T00:00:00.000Z' },
          email_sent: false,
          accept_url: 'http://localhost:5173/register?invite=abc123',
          note: 'Email transport is "log", which does not deliver mail. Send this link to the invitee yourself.',
        }),
      } as Response),
    });
    render(<TeamManagement />);
    await screen.findByText('Priya Nair');

    const email = await openInvite(user);
    await user.type(email, 'new@example.com');
    await user.selectOptions(screen.getByLabelText('Role'), 'manager');
    await user.click(screen.getByRole('button', { name: /send invite/i }));

    await waitFor(() => expect(callsTo('/invites').filter(c => (c[1] as RequestInit)?.method === 'POST').length).toBe(1));
    const post = callsTo('/invites').find(c => (c[1] as RequestInit)?.method === 'POST')!;
    expect(JSON.parse((post[1] as RequestInit).body as string)).toEqual({
      email: 'new@example.com', role: 'manager',
    });
  });

  it('says NO EMAIL WAS SENT and shows the real link, rather than implying delivery', async () => {
    const user = userEvent.setup();
    mockServer({
      onPost: () => ({
        ok: true, status: 201,
        json: async () => ({
          success: true,
          invite: { id: 'inv-1', email: 'new@example.com', role: 'sales', expires_at: '2026-09-10T00:00:00.000Z' },
          email_sent: false,
          accept_url: 'http://localhost:5173/register?invite=abc123',
          note: 'Email transport is "log", which does not deliver mail. Send this link to the invitee yourself.',
        }),
      } as Response),
    });
    render(<TeamManagement />);
    await screen.findByText('Priya Nair');

    const email = await openInvite(user);
    await user.type(email, 'new@example.com');
    await user.click(screen.getByRole('button', { name: /send invite/i }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/Invite created for new@example.com/);
    // The honest part: it must NOT claim an email went out.
    expect(status).toHaveTextContent(/No email was sent/i);
    expect(status).toHaveTextContent(/does not deliver mail/i);
    // And the admin gets the actual link to pass on.
    expect(status).toHaveTextContent('http://localhost:5173/register?invite=abc123');
  });

  it('when the server DOES deliver, it says so and shows no link', async () => {
    const user = userEvent.setup();
    mockServer({
      onPost: () => ({
        ok: true, status: 201,
        json: async () => ({
          success: true,
          invite: { id: 'inv-2', email: 'sent@example.com', role: 'sales', expires_at: '2026-09-10T00:00:00.000Z' },
          email_sent: true,
        }),
      } as Response),
    });
    render(<TeamManagement />);
    await screen.findByText('Priya Nair');

    const email = await openInvite(user);
    await user.type(email, 'sent@example.com');
    await user.click(screen.getByRole('button', { name: /send invite/i }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/An email has been sent/i);
    expect(status).not.toHaveTextContent(/register\?invite=/);
  });

  it('a rejected invite shows the server\'s reason', async () => {
    const user = userEvent.setup();
    mockServer({
      onPost: () => ({
        ok: false, status: 409,
        json: async () => ({ success: false, message: 'That person is already a member of this workspace' }),
      } as Response),
    });
    render(<TeamManagement />);
    await screen.findByText('Priya Nair');

    const email = await openInvite(user);
    await user.type(email, 'priya@example.com');
    await user.click(screen.getByRole('button', { name: /send invite/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That person is already a member of this workspace',
    );
  });

  it('outstanding invites are listed from the real endpoint', async () => {
    mockServer({
      invites: [{
        id: 'inv-9', email: 'waiting@example.com', role: 'sales',
        expires_at: '2026-09-20T00:00:00.000Z', created_at: '2026-09-01T00:00:00.000Z',
      }],
    });
    render(<TeamManagement />);
    expect(await screen.findByText(/Invites awaiting acceptance \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('waiting@example.com')).toBeInTheDocument();
  });
});

describe('TeamManagement — actions with no endpoint', () => {
  it('hard delete is not offered as though it worked', async () => {
    const user = userEvent.setup();
    render(<TeamManagement />);
    await screen.findByText('Dee Activated');

    // The Delete control still exists but must not claim to purge anything, and
    // must NOT quietly deactivate instead — that would tell someone a record
    // was destroyed when it was not.
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(showToast).toHaveBeenCalledWith(
      expect.stringMatching(/not available/i),
      'warning',
    );
    // No write of any kind left the client.
    expect(callsTo('/deactivate').length).toBe(0);
    expect(fetchMock.mock.calls.filter(c => (c[1] as RequestInit)?.method === 'POST').length).toBe(0);
  });
});

/**
 * ── The role picker ────────────────────────────────────────────────────────
 *
 * These drive the real component against the real contract of
 * `GET /users` + `PATCH /users/:id/role`. The server half of that contract —
 * that `assignable_roles` really excludes `admin` for a manager, and that
 * `can_change_role` really is false for someone who outranks the caller — is
 * pinned separately in `Backend/src/__tests__/roundTrip.userRoles.test.ts`
 * against real Postgres. Neither half is worth much alone: the backend tests
 * prove the server computes the rule, these prove the UI renders nothing the
 * rule did not permit.
 */
describe('TeamManagement — the role picker', () => {
  /** Rows as an ADMIN caller sees them: everyone touchable. */
  const asAdmin = rows.map(r => ({ ...r, can_change_role: true }));
  const ADMIN_ROLES = ['sales', 'manager', 'hr', 'admin'];

  const roleButtonFor = (name: string) =>
    screen.queryByRole('button', { name: `Change role for ${name}` });

  it('populates the picker from the SERVER list — a manager is never shown "admin"', async () => {
    // Exactly what the server sends a manager: no admin in assignable_roles,
    // and the admin row marked untouchable.
    mockServer({
      users: [
        { ...rows[0], can_change_role: true },                       // Priya, manager
        { ...rows[1], can_change_role: true },                       // Sam, sales
        { ...rows[2], role: 'admin', can_change_role: false },       // Dee, admin
      ],
      assignableRoles: ['sales', 'manager', 'hr'],
    });
    render(<TeamManagement />);
    await screen.findByText('Sam Okafor');

    await userEvent.click(roleButtonFor('Sam Okafor')!);
    const select = await screen.findByLabelText('New role');
    const options = within(select).getAllByRole('option').map(o => (o as HTMLOptionElement).value);

    // THE ASSERTION: admin is not an option at all, not merely rejected later.
    expect(options).not.toContain('admin');
    expect(options).toEqual(['sales', 'manager', 'hr']);
  });

  it('renders NO role control for someone already above the caller — not a disabled one', async () => {
    mockServer({
      users: [
        { ...rows[0], can_change_role: true },                        // Priya — touchable
        { ...rows[2], role: 'admin', can_change_role: false },        // Dee — an admin, above a manager
      ],
      assignableRoles: ['sales', 'manager', 'hr'],
    });
    render(<TeamManagement />);
    await screen.findByText('Dee Activated');

    // Absent, not disabled. queryByRole returns null only if it is not rendered
    // at all — a disabled button would still be found here.
    expect(roleButtonFor('Dee Activated')).toBeNull();
    expect(roleButtonFor('Priya Nair')).not.toBeNull();

    // And the role is still SHOWN, just not editable.
    expect(screen.getAllByText(/Admin/).length).toBeGreaterThan(0);
  });

  it('shows the sign-out consequence BEFORE confirming, and again for your own account', async () => {
    mockServer({ users: asAdmin, assignableRoles: ADMIN_ROLES });
    render(<TeamManagement />);
    await screen.findByText('Sam Okafor');

    await userEvent.click(roleButtonFor('Sam Okafor')!);
    // Present as soon as the dialog opens — before any request is made.
    expect(
      screen.getByText(/signs Sam Okafor out of their current session/i),
    ).toBeInTheDocument();
    expect(callsTo('/users/').length).toBe(0);   // nothing sent yet

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // The caller is user id 1 — Priya's row. Changing your OWN role signs YOU
    // out, and the notice has to say so rather than talking about "them".
    await userEvent.click(roleButtonFor('Priya Nair')!);
    expect(screen.getByText(/signs you out of your current session/i)).toBeInTheDocument();
  });

  it('will not submit a no-op: confirm is disabled while the picker sits on the current role', async () => {
    mockServer({ users: asAdmin, assignableRoles: ADMIN_ROLES });
    render(<TeamManagement />);
    await screen.findByText('Sam Okafor');

    await userEvent.click(roleButtonFor('Sam Okafor')!);
    const confirm = screen.getByRole('button', { name: 'Change role' });

    // Opens on the member's current role, so it starts disabled and says why.
    expect(confirm).toBeDisabled();
    expect(screen.getByText(/already Sales/i)).toBeInTheDocument();

    // A click on a disabled button must not fire a request. Asserting the
    // request count matters more than asserting the attribute: this project
    // has already recorded a test that "passed" because a disabled button
    // meant the handler never ran and nothing was being tested.
    await userEvent.click(confirm);
    expect(fetchMock.mock.calls.filter(c => (c[1] as RequestInit)?.method === 'PATCH')).toHaveLength(0);

    // Choose a different role and it becomes available.
    await userEvent.selectOptions(screen.getByLabelText('New role'), 'manager');
    expect(screen.getByRole('button', { name: 'Change role' })).toBeEnabled();
  });

  it('sends the PATCH and renders the SERVER row back', async () => {
    mockServer({
      users: asAdmin,
      assignableRoles: ADMIN_ROLES,
      onPatch: () => ({
        ok: true, status: 200,
        json: async () => ({ success: true, data: { ...rows[1], role: 'manager' } }),
      } as Response),
    });
    render(<TeamManagement />);
    await screen.findByText('Sam Okafor');

    await userEvent.click(roleButtonFor('Sam Okafor')!);
    await userEvent.selectOptions(screen.getByLabelText('New role'), 'manager');
    await userEvent.click(screen.getByRole('button', { name: 'Change role' }));

    await waitFor(() => {
      const patches = fetchMock.mock.calls.filter(c => (c[1] as RequestInit)?.method === 'PATCH');
      expect(patches).toHaveLength(1);
      expect(String(patches[0][0])).toBe('http://localhost:5001/api/v1/users/2/role');
      expect(JSON.parse((patches[0][1] as RequestInit).body as string)).toEqual({ role: 'manager' });
    });

    // Closed on success, and the toast repeats the sign-out consequence.
    await waitFor(() => expect(screen.queryByLabelText('New role')).toBeNull());
    expect(showToast).toHaveBeenCalledWith(
      expect.stringMatching(/sign in again/i), 'success',
    );
  });

  it('a 409 from the last-admin guard is shown inline, verbatim, and the dialog stays open', async () => {
    const serverMessage =
      'You are the last admin or manager in this workspace — promote someone else before changing your own role';
    mockServer({
      users: asAdmin,
      assignableRoles: ADMIN_ROLES,
      onPatch: () => ({
        ok: false, status: 409,
        json: async () => ({ success: false, message: serverMessage }),
      } as Response),
    });
    render(<TeamManagement />);
    await screen.findByText('Priya Nair');

    await userEvent.click(roleButtonFor('Priya Nair')!);
    await userEvent.selectOptions(screen.getByLabelText('New role'), 'sales');
    await userEvent.click(screen.getByRole('button', { name: 'Change role' }));

    // Verbatim — the server's wording is the only part that tells the user what
    // to do instead, so it must not be replaced by "Could not change role".
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(serverMessage);

    // The dialog stays open so the reason sits next to the control that caused
    // it, and the roster is unchanged.
    expect(screen.getByLabelText('New role')).toBeInTheDocument();
    expect(screen.getByText('Priya Nair')).toBeInTheDocument();
  });

  it('shows no role controls at all when the server assigns the caller no roles', async () => {
    // What a sales user receives: rows with can_change_role false and an empty
    // assignable_roles. The roster still loads — pickers depend on it.
    mockServer({ users: rows.map(r => ({ ...r, can_change_role: false })) });
    render(<TeamManagement />);
    await screen.findByText('Priya Nair');

    expect(screen.queryAllByRole('button', { name: /^Change role for/ })).toHaveLength(0);
  });
});

/**
 * ── The invite form's role options ─────────────────────────────────────────
 *
 * These replace `src/utils/invitableRoles.test.ts`, which tested a client-side
 * copy of the server's rule. The copy is deleted, so testing it would be
 * testing nothing; what matters now is that the form renders the SERVED list
 * and only that. The server half is pinned in
 * `Backend/src/__tests__/roundTrip.userManagement.test.ts`.
 */
describe('TeamManagement — the invite role picker', () => {
  const openInvite = async () => {
    await screen.findByText('Priya Nair');
    await userEvent.click(screen.getByRole('button', { name: /invite a member/i }));
    return screen.findByLabelText('Role');
  };
  const optionsOf = (select: HTMLElement) =>
    within(select).getAllByRole('option').map(o => (o as HTMLOptionElement).value);

  it('offers HR — the option the deleted client-side mirror had silently dropped', async () => {
    // invitableRolesFor() listed sales/manager/admin. The server's
    // ASSIGNABLE_ROLES has always included hr, so the form could not invite an
    // HR user and nothing anywhere said so. This is that regression, pinned.
    mockServer({ invitableRoles: ['sales', 'manager', 'hr', 'admin'] });
    render(<TeamManagement />);

    expect(optionsOf(await openInvite())).toEqual(['sales', 'manager', 'hr', 'admin']);
  });

  it('never offers a MANAGER the admin role — the list is the server\'s', async () => {
    mockServer({ invitableRoles: ['sales', 'manager', 'hr'] });
    render(<TeamManagement />);

    const options = optionsOf(await openInvite());
    expect(options).not.toContain('admin');
    expect(options).toEqual(['sales', 'manager', 'hr']);
  });

  it('sends a role that was actually offered, not a hardcoded default', async () => {
    // The old code initialised inviteRole to 'sales' regardless of what the
    // picker showed, so a caller whose served list did not start with 'sales'
    // could submit a role they never saw selected.
    let sent: unknown = null;
    mockServer({
      invitableRoles: ['manager', 'hr'],
      onPost: (_url, body) => { sent = body; return {
        ok: true, status: 201,
        json: async () => ({ success: true, invite: { id: 'i1', email: 'x@y.z', role: 'manager', expires_at: '' }, email_sent: true }),
      } as Response; },
    });
    render(<TeamManagement />);

    const select = await openInvite();
    expect((select as HTMLSelectElement).value).toBe('manager');   // first served role, not 'sales'

    await userEvent.type(screen.getByLabelText('Email address'), 'new@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send invite/i }));

    await waitFor(() => expect(sent).toEqual({ email: 'new@example.com', role: 'manager' }));
  });

  it('offers nothing and will not send when the server grants this caller no roles', async () => {
    mockServer({ invitableRoles: [] });
    render(<TeamManagement />);

    const select = await openInvite();
    // queryAllByRole, not getAllByRole: an empty select has no options at all
    // and getAll throws rather than returning [].
    expect(within(select).queryAllByRole('option')).toEqual([]);
    await userEvent.type(screen.getByLabelText('Email address'), 'new@example.com');
    // Not offered as though it might work — the server would refuse it.
    expect(screen.getByRole('button', { name: /send invite/i })).toBeDisabled();
  });
});
