import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GeneralPreferences from './GeneralPreferences';

/**
 * Workspace settings — frontend round trip.
 *
 * The standard, matching the backend suite: render the REAL form, submit it,
 * assert the request that actually left the client (method, URL, payload), and
 * assert the UI reflects what the SERVER returned rather than what was typed.
 * `fetch` is the seam — everything above it is the real component.
 *
 * What this does not prove: that the server behaves as mocked. That is the
 * backend suite's job, and roundTrip.workspace.test.ts covers it against real
 * Postgres. These two together are the round trip; neither is on its own.
 */

const ws = {
  id: 'ws-1',
  name: 'Default Organization',
  slug: 'default-organization',
  timezone: null as string | null,
  default_currency: null as string | null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: null as string | null,
};

let fetchMock: ReturnType<typeof vi.fn>;

/** The body of the Nth fetch call, parsed. */
const bodyOf = (call: number) => JSON.parse((fetchMock.mock.calls[call][1] as RequestInit).body as string);

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k === 'authToken' ? 'test-token' : null),
    setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
  } as unknown as Storage);

  fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    if (!init || init.method === undefined) {
      return { ok: true, status: 200, json: async () => ({ success: true, data: ws }) } as Response;
    }
    // Echo the update back the way the server does — from the stored row.
    const patch = JSON.parse(init.body as string);
    return {
      ok: true, status: 200,
      json: async () => ({ success: true, data: { ...ws, ...patch } }),
    } as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('GeneralPreferences — workspace settings', () => {
  it('loads the real workspace and shows what the server returned', async () => {
    render(<GeneralPreferences />);

    // It fetched, with the auth header — not from local state.
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:5001/api/v1/workspace');
    expect((init as RequestInit | undefined)?.method).toBeUndefined();   // a GET
    expect(((init as RequestInit).headers as Record<string, string>).Authorization).toBe('Bearer test-token');

    expect(await screen.findByLabelText('Workspace Name')).toHaveValue('Default Organization');
    expect(screen.getByLabelText('Workspace Slug')).toHaveValue('default-organization');
  });

  it('an unset timezone and currency are shown as unset, not as invented defaults', async () => {
    render(<GeneralPreferences />);
    // The server returns null; the form must not silently present UTC/USD as
    // though the workspace had chosen them.
    expect(await screen.findByLabelText('Timezone')).toHaveValue('');
    expect(screen.getByLabelText('Default Currency')).toHaveValue('');
  });

  it('submits ONLY the changed fields, and renders the server response', async () => {
    const user = userEvent.setup();
    render(<GeneralPreferences />);
    await screen.findByLabelText('Workspace Name');

    await user.selectOptions(screen.getByLabelText('Default Currency'), 'INR');
    await user.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('http://localhost:5001/api/v1/workspace');
    expect((init as RequestInit).method).toBe('PUT');

    // Only the field that changed. Sending name/slug unchanged would risk
    // clobbering them with whatever this form happened to be holding.
    expect(bodyOf(1)).toEqual({ default_currency: 'INR' });

    await waitFor(() => expect(screen.getByLabelText('Default Currency')).toHaveValue('INR'));
    expect(await screen.findByRole('status')).toHaveTextContent(/saved/i);
  });

  it('renders the SERVER\'s value, not the typed one, when they differ', async () => {
    // The server upper-cases a currency. If the form rendered its own state
    // instead of the response, a normalised value would silently diverge from
    // what is stored — the class of bug this whole suite exists for.
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (!init?.method) return { ok: true, status: 200, json: async () => ({ success: true, data: ws }) } as Response;
      return {
        ok: true, status: 200,
        json: async () => ({ success: true, data: { ...ws, name: 'Normalised By Server' } }),
      } as Response;
    });

    const user = userEvent.setup();
    render(<GeneralPreferences />);
    const name = await screen.findByLabelText('Workspace Name');
    await user.clear(name);
    await user.type(name, 'whatever i typed');
    await user.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => expect(screen.getByLabelText('Workspace Name')).toHaveValue('Normalised By Server'));
  });

  it('clearing the timezone sends null — distinct from omitting it', async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      const withTz = { ...ws, timezone: 'Asia/Kolkata' };
      if (!init?.method) return { ok: true, status: 200, json: async () => ({ success: true, data: withTz }) } as Response;
      const patch = JSON.parse(init.body as string);
      return { ok: true, status: 200, json: async () => ({ success: true, data: { ...withTz, ...patch } }) } as Response;
    });

    const user = userEvent.setup();
    render(<GeneralPreferences />);
    await waitFor(() => expect(screen.getByLabelText('Timezone')).toHaveValue('Asia/Kolkata'));

    await user.selectOptions(screen.getByLabelText('Timezone'), '');
    await user.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(bodyOf(1)).toEqual({ timezone: null });
  });

  /**
   * REGRESSION. Intl.supportedValuesOf('timeZone') returns CANONICAL names
   * only — it lists Asia/Calcutta and omits Asia/Kolkata — while the server
   * validates with Intl.DateTimeFormat, which accepts both. So a workspace
   * storing the alias had no matching <option> and the select rendered "Not
   * set" for a timezone that was set. Found by the test above; the stored value
   * is now always merged into the list.
   */
  it('a stored timezone the canonical list omits is still displayed, not shown as unset', async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      const aliased = { ...ws, timezone: 'Asia/Kolkata' };
      if (!init?.method) return { ok: true, status: 200, json: async () => ({ success: true, data: aliased }) } as Response;
      const patch = JSON.parse(init.body as string);
      return { ok: true, status: 200, json: async () => ({ success: true, data: { ...aliased, ...patch } }) } as Response;
    });

    render(<GeneralPreferences />);
    await waitFor(() => expect(screen.getByLabelText('Timezone')).toHaveValue('Asia/Kolkata'));
    expect(screen.getByRole('option', { name: 'Asia/Kolkata' })).toBeInTheDocument();
  });

  it('shows the server\'s real reason when a save is rejected, and does not claim success', async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (!init?.method) return { ok: true, status: 200, json: async () => ({ success: true, data: ws }) } as Response;
      return {
        ok: false, status: 409,
        json: async () => ({ success: false, message: 'That slug is already taken by another workspace' }),
      } as Response;
    });

    const user = userEvent.setup();
    render(<GeneralPreferences />);
    const slug = await screen.findByLabelText('Workspace Slug');
    await user.clear(slug);
    await user.type(slug, 'taken-slug');
    await user.click(screen.getByRole('button', { name: /save preferences/i }));

    // The server's words, verbatim — not "Something went wrong".
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('That slug is already taken by another workspace');
    // And no success indicator alongside the failure.
    expect(screen.queryByText(/^Saved$/)).not.toBeInTheDocument();
  });

  it('a 403 for the wrong role surfaces the real message', async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (!init?.method) return { ok: true, status: 200, json: async () => ({ success: true, data: ws }) } as Response;
      return { ok: false, status: 403, json: async () => ({ success: false, message: 'Insufficient permissions' }) } as Response;
    });

    const user = userEvent.setup();
    render(<GeneralPreferences />);
    const name = await screen.findByLabelText('Workspace Name');
    await user.clear(name);
    await user.type(name, 'Renamed By Sales');
    await user.click(screen.getByRole('button', { name: /save preferences/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient permissions');
  });

  it('a failed load says so instead of rendering an empty form as though it were the workspace', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false, status: 500, json: async () => ({ success: false, message: 'Internal Server Error' }),
    } as Response));

    render(<GeneralPreferences />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    // No form pretending to hold real values.
    expect(screen.queryByLabelText('Workspace Name')).not.toBeInTheDocument();
  });

  it('Save is disabled until something actually changes', async () => {
    const user = userEvent.setup();
    render(<GeneralPreferences />);
    await screen.findByLabelText('Workspace Name');

    const save = screen.getByRole('button', { name: /save preferences/i });
    expect(save).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Default Currency'), 'AED');
    expect(save).toBeEnabled();
  });

  it('the display preferences with no backend are labelled, not wired to a silent no-op', async () => {
    const user = userEvent.setup();
    render(<GeneralPreferences />);
    await screen.findByLabelText('Workspace Name');

    // Labelled honestly...
    expect(screen.getByText(/Display preferences is not available yet/i)).toBeInTheDocument();
    // ...and the controls that would have lied are gone, not merely disabled.
    expect(screen.queryByLabelText('Date Format')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Week Starts On')).not.toBeInTheDocument();

    // Saving must never post a field the server would silently discard.
    await user.selectOptions(screen.getByLabelText('Default Currency'), 'INR');
    await user.click(screen.getByRole('button', { name: /save preferences/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(Object.keys(bodyOf(1))).toEqual(['default_currency']);
  });
});
