import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TargetsSettings from './TargetsSettings';
import { quarterLabelFor, shiftQuarter } from '../../../utils/targetsApi';

/**
 * Settings → Sales Targets — frontend round trip at the fetch seam.
 *
 * Same standard as the other Settings pages: render the REAL component, act
 * through it, assert the exact request that left the client, and assert the
 * UI shows what the SERVER returned. roundTrip.targets.test.ts proves the
 * server side against Postgres; together they are the round trip.
 *
 * The rules (who may edit, which seniority levels, which activity targets,
 * whether the self-service toggle is offered) come ONLY from the mocked
 * server envelope here — so if the component ever grows a local copy of one,
 * the "exactly the served list" assertions below fail.
 */

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
let fetchMock: Mock<FetchFn>;
const PERIOD = quarterLabelFor(new Date());

const ROWS = [
  {
    user_id: 2, name: 'Sam Okafor', email: 'sam@example.com', role: 'sales',
    manager_id: 1, manager_name: 'Priya Nair', profile: null, quota: null, can_edit: true,
  },
  {
    user_id: 3, name: 'Lee Chen', email: 'lee@example.com', role: 'sales',
    manager_id: null, manager_name: null,
    profile: { seniority: 'senior', ramp_start_date: '2026-07-01', territory: 'Gulf', product_line: null },
    quota: { quota_amount: 250000, currency: 'AED', activity_targets: { calls_per_week: 40 } },
    can_edit: false,
  },
];

function envelope(over: Record<string, unknown> = {}) {
  return {
    success: true, data: ROWS,
    period: { label: PERIOD },
    // Deliberately NOT the server's real lists — proves the UI renders what
    // it is sent rather than a copy of its own.
    seniority_levels: ['junior', 'lead'],
    activity_target_keys: ['calls_per_week', 'meetings_per_week'],
    activity_target_max: 1000,
    reps_set_own_targets: false,
    can_change_self_service: false,
    ...over,
  };
}

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body } as Response);
const callsTo = (part: string, method = 'GET') => fetchMock.mock.calls.filter(
  ([url, init]) => String(url).includes(part) && (init?.method ?? 'GET') === method);
const bodyOf = (call: [string, RequestInit?]) => JSON.parse(call[1]?.body as string);

function server(over: { targets?: Record<string, unknown>; onPut?: (url: string, body: unknown) => Response } = {}) {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (!init?.method && url.includes('/targets?')) return ok(envelope(over.targets));
    if (init?.method === 'PUT') {
      const body = JSON.parse(init.body as string);
      return over.onPut ? over.onPut(url, body) : ok({ success: true, data: body });
    }
    return ok({ success: true, data: {} });
  });
  vi.stubGlobal('fetch', fetchMock);
}

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k === 'authToken' ? 'test-token' : null),
    setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
  } as unknown as Storage);
  server();
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('TargetsSettings', () => {
  it('loads the CURRENT quarter and shows unset values as unset — never zeros', async () => {
    render(<TargetsSettings />);
    const sam = await screen.findByTestId('target-row-2');
    expect(callsTo(`/targets?period=${encodeURIComponent(PERIOD)}`)).toHaveLength(1);

    expect(within(sam).getByText('Priya Nair')).toBeInTheDocument();
    expect(within(sam).getByText('Not recorded')).toBeInTheDocument();   // profile null
    expect(within(sam).getByText('Not set')).toBeInTheDocument();        // quota null
    expect(within(sam).getByText('None set')).toBeInTheDocument();       // no activity targets
    expect(within(sam).queryByText(/\b0\b/)).not.toBeInTheDocument();

    const lee = screen.getByTestId('target-row-3');
    expect(within(lee).getByText('No manager recorded')).toBeInTheDocument();
    expect(within(lee).getByText('AED 250,000')).toBeInTheDocument();
    expect(within(lee).getByText('Calls / week: 40')).toBeInTheDocument();
    expect(within(lee).getByText('No product line')).toBeInTheDocument();
  });

  it('offers an edit control ONLY where the server said can_edit — no disabled decoy', async () => {
    render(<TargetsSettings />);
    await screen.findByTestId('target-row-2');
    expect(screen.getByRole('button', { name: 'Edit targets for Sam Okafor' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit targets for Lee Chen' })).not.toBeInTheDocument();
  });

  it('the editor offers EXACTLY the served seniority levels and activity targets', async () => {
    const user = userEvent.setup();
    render(<TargetsSettings />);
    await user.click(await screen.findByRole('button', { name: 'Edit targets for Sam Okafor' }));

    const seniority = screen.getByLabelText('Seniority') as HTMLSelectElement;
    expect([...seniority.options].map(o => o.value)).toEqual(['', 'junior', 'lead']);
    expect(screen.getByLabelText('Calls / week')).toBeInTheDocument();
    expect(screen.getByLabelText('Meetings / week')).toBeInTheDocument();
    expect(screen.queryByLabelText('Emails / week')).not.toBeInTheDocument();
  });

  it('saves a quota with activity targets: the exact PUT /quotas body, no profile write, then refetches', async () => {
    const user = userEvent.setup();
    render(<TargetsSettings />);
    await user.click(await screen.findByRole('button', { name: 'Edit targets for Sam Okafor' }));

    const save = screen.getByRole('button', { name: 'Save targets' });
    expect(save).toBeDisabled();   // nothing changed yet

    await user.type(screen.getByLabelText(`Quota for ${PERIOD}`), '120000');
    await user.selectOptions(screen.getByLabelText('Currency'), 'INR');
    await user.type(screen.getByLabelText('Calls / week'), '40');
    await user.click(save);

    await waitFor(() => expect(callsTo('/quotas', 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo('/quotas', 'PUT')[0] as [string, RequestInit])).toEqual({
      user_id: 2, period_label: PERIOD, quota_amount: 120000, currency: 'INR',
      // Blank is sent as null — CLEAR — not as a zero target.
      activity_targets: { calls_per_week: 40, meetings_per_week: null },
    });
    expect(callsTo('/profile', 'PUT')).toHaveLength(0);
    // Re-read from the server rather than trusting the form.
    await waitFor(() => expect(callsTo('/targets?')).toHaveLength(2));
    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
  });

  it('a profile-only edit sends only the changed field, and no quota write', async () => {
    const user = userEvent.setup();
    render(<TargetsSettings />);
    await user.click(await screen.findByRole('button', { name: 'Edit targets for Sam Okafor' }));
    await user.type(screen.getByLabelText('Territory / vertical'), '  Kenya ');
    await user.click(screen.getByRole('button', { name: 'Save targets' }));

    await waitFor(() => expect(callsTo('/targets/2/profile', 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo('/targets/2/profile', 'PUT')[0] as [string, RequestInit])).toEqual({ territory: 'Kenya' });
    expect(callsTo('/quotas', 'PUT')).toHaveLength(0);
  });

  it('activity targets without a quota amount are explained, and nothing is sent', async () => {
    const user = userEvent.setup();
    render(<TargetsSettings />);
    await user.click(await screen.findByRole('button', { name: 'Edit targets for Sam Okafor' }));
    await user.type(screen.getByLabelText('Calls / week'), '30');
    await user.click(screen.getByRole('button', { name: 'Save targets' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/stored with the quota/);
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(0);
  });

  it('a refusal shows the SERVER\'s reason verbatim and claims no success', async () => {
    server({
      onPut: () => ({
        ok: false, status: 403,
        json: async () => ({ success: false, message: 'You can set targets only for people who report directly to you.' }),
      } as Response),
    });
    const user = userEvent.setup();
    render(<TargetsSettings />);
    await user.click(await screen.findByRole('button', { name: 'Edit targets for Sam Okafor' }));
    await user.type(screen.getByLabelText(`Quota for ${PERIOD}`), '5');
    await user.click(screen.getByRole('button', { name: 'Save targets' }));

    expect(await screen.findByRole('alert'))
      .toHaveTextContent('You can set targets only for people who report directly to you.');
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('the self-service toggle is offered only when served, and flips it through PUT /workspace', async () => {
    const { unmount } = render(<TargetsSettings />);
    expect(await screen.findByText(/cannot set their own targets/)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    unmount();

    server({ targets: { can_change_self_service: true } });
    const user = userEvent.setup();
    render(<TargetsSettings />);
    const box = await screen.findByRole('checkbox', { name: /Let people set their own targets/ });
    expect(box).not.toBeChecked();
    await user.click(box);
    await waitFor(() => expect(callsTo('/workspace', 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo('/workspace', 'PUT')[0] as [string, RequestInit])).toEqual({ reps_set_own_targets: true });
  });

  it('the quarter arrows fetch the neighbouring quarter', async () => {
    const user = userEvent.setup();
    render(<TargetsSettings />);
    await screen.findByTestId('target-row-2');
    await user.click(screen.getByRole('button', { name: 'Previous quarter' }));
    const prev = shiftQuarter(PERIOD, -1);
    await waitFor(() => expect(callsTo(`/targets?period=${encodeURIComponent(prev)}`)).toHaveLength(1));
  });

  it('a failed load says so instead of rendering an empty table as though it were the truth', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false, status: 500, json: async () => ({ success: false, message: 'Internal Server Error' }),
    } as Response));
    render(<TargetsSettings />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Internal Server Error');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('shiftQuarter', () => {
  it('rolls across year boundaries', () => {
    expect(shiftQuarter('Q1 2027', -1)).toBe('Q4 2026');
    expect(shiftQuarter('Q4 2026', 1)).toBe('Q1 2027');
    expect(shiftQuarter('Q3 2026', 0)).toBe('Q3 2026');
  });
});
