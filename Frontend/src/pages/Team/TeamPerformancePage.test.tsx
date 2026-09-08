import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TeamPerformancePage from './TeamPerformancePage';

/**
 * Team Performance — frontend round trip.
 *
 * Same standard as TeamManagement's: render the REAL page, let it fetch, and
 * assert what it shows against what the SERVER returned. `fetch` is the seam.
 *
 * WHAT THESE PIN, and why each one is here rather than being obvious:
 *
 *  1. NULL IS NOT ZERO, three times over. A rep with no closed deals has no
 *     win rate — showing 0% would assert they lose everything. A period with
 *     no quota row has no target — showing $0 asserts a target of nothing and
 *     0% asserts total failure against it. `quotas` is EMPTY in the live
 *     workspace right now, so this is the state the page is actually in, not a
 *     hypothetical.
 *  2. THE ROSTER AND THE REPORTING LINE COME FROM THE SERVER. The deleted
 *     fixture asserted an org chart that did not exist ("Sarah Chen" managing
 *     two people, reporting to "John Smith", who was never a user). A
 *     manager_id of null must render as "Not set", which is the true state of
 *     every row in the live workspace today.
 *  3. UNATTRIBUTED DEALS ARE ANNOUNCED. 20 of 25 live deals have no
 *     `assigned_to_user_id`, so per-person figures necessarily sum to less
 *     than the Deals page. Two pages disagreeing silently is this project's
 *     signature defect; the page must say so out loud.
 *  4. NO FABRICATED ROLE VOCABULARY. The old filter offered four invented job
 *     titles. Options must come from the roster that loaded.
 */

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1', name: 'Alex Rodriguez', email: 'alex@bmicrm.com', role: 'Sales' } }),
}));
const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

const USERS = [
  { id: 1, first_name: 'Alex', last_name: 'Rodriguez', email: 'alex@bmicrm.com',
    role: 'sales', department: 'Sales', is_active: true, last_login_at: null,
    created_at: '2026-01-01T00:00:00.000Z', manager_id: null, manager_name: null },
  { id: 2, first_name: 'Sarah', last_name: 'Chen', email: 'sarah@bmicrm.com',
    role: 'sales', department: 'Sales', is_active: true, last_login_at: null,
    created_at: '2026-01-01T00:00:00.000Z', manager_id: null, manager_name: null },
];

/** Two stages, so won/lost classification is real rather than defaulted. */
const PIPELINES = [{
  id: 'p1', name: 'Sales', slug: 'sales', is_default: true, archived_at: null,
  stages: [
    { id: 's1', name: 'Proposal', slug: 'proposal', stage_type: 'open', color: 'blue', position: 1, archived_at: null },
    { id: 's2', name: 'Won',      slug: 'won',      stage_type: 'won',  color: 'green', position: 2, archived_at: null },
    { id: 's3', name: 'Lost',     slug: 'lost',     stage_type: 'lost', color: 'red',   position: 3, archived_at: null },
  ],
}];

let fetchMock: ReturnType<typeof vi.fn>;

function mockServer(opts: {
  users?: unknown[]; deals?: unknown[]; quotas?: unknown[];
} = {}) {
  const users  = opts.users  ?? USERS;
  const deals  = opts.deals  ?? [];
  const quotas = opts.quotas ?? [];

  fetchMock = vi.fn(async (url: string) => {
    const u = String(url);
    const json = (data: unknown, extra: Record<string, unknown> = {}) =>
      ({ ok: true, status: 200, json: async () => ({ success: true, data, ...extra }) });

    if (u.includes('/pipelines')) return json(PIPELINES);
    if (u.includes('/quotas'))    return json(quotas);
    if (u.includes('/deals'))     return json(deals);
    if (u.includes('/users'))     return json(users);
    throw new Error(`unexpected fetch: ${u}`);
  });
  vi.stubGlobal('fetch', fetchMock);
}

beforeEach(() => {
  // Same stub as TeamManagement.test.tsx — there is no real localStorage in
  // this environment, and the API clients read the token from it.
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k === 'authToken' ? 'test-token' : null),
    setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
  } as unknown as Storage);
  navigate.mockClear();
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('TeamPerformancePage — computed from the workspace', () => {
  it('renders the roster the server returned, not a fixture', async () => {
    mockServer();
    render(<TeamPerformancePage />);

    await waitFor(() => expect(screen.getByText('Alex Rodriguez')).toBeInTheDocument());
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    // The real workspace domain, proving these came from the response and not
    // from the deleted `@bmi.com` fixture.
    expect(screen.getByText('alex@bmicrm.com')).toBeInTheDocument();
    expect(screen.getByText('sarah@bmicrm.com')).toBeInTheDocument();
    // "John Smith" was in the fixture's reporting line and was never a user.
    expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
  });

  it('a null manager_id renders "Not set" — the true state of every live row', async () => {
    mockServer();
    render(<TeamPerformancePage />);
    await waitFor(() => expect(screen.getByText('Alex Rodriguez')).toBeInTheDocument());
    expect(screen.getAllByText('Not set').length).toBeGreaterThanOrEqual(2);
  });

  it('resolves the reporting line by manager_id, and links to that person', async () => {
    mockServer({
      users: [
        USERS[0],
        { ...USERS[1], manager_id: 1, manager_name: 'Alex Rodriguez' },
      ],
    });
    render(<TeamPerformancePage />);
    await waitFor(() => expect(screen.getByText('Sarah Chen')).toBeInTheDocument());
    // The manager's name appears as a link in Sarah's row, from the server's
    // tenant-matched `manager_name` — never resolved client-side.
    const link = screen.getByRole('button', { name: 'Alex Rodriguez' });
    expect(link).toBeInTheDocument();
  });

  it('NO QUOTA ROW renders "Not set", never $0 or 0%', async () => {
    // The live state: quotas is empty. A zero here would assert a target of
    // nothing and total failure against it.
    mockServer({
      deals: [{ id: 'D1', value: 50000, stage: 'proposal', pipeline_id: 'sales', assigned_to_user_id: 1 }],
      quotas: [],
    });
    render(<TeamPerformancePage />);

    await waitFor(() => expect(screen.getByText('Alex Rodriguez')).toBeInTheDocument());
    expect(screen.getByText('No quota entered for this period')).toBeInTheDocument();
    // Not a fabricated zero anywhere in the quota column.
    expect(screen.queryByText('$0')).not.toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('NO CLOSED DEALS means no win rate — not 0%', async () => {
    mockServer({
      deals: [{ id: 'D1', value: 50000, stage: 'proposal', pipeline_id: 'sales', assigned_to_user_id: 1 }],
    });
    render(<TeamPerformancePage />);

    await waitFor(() => expect(screen.getByText('No deals closed yet')).toBeInTheDocument());
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('computes win rate and attainment from real rows once they exist', async () => {
    mockServer({
      deals: [
        { id: 'D1', value: 100000, stage: 'won',      pipeline_id: 'sales', assigned_to_user_id: 1 },
        { id: 'D2', value:  50000, stage: 'lost',     pipeline_id: 'sales', assigned_to_user_id: 1 },
        { id: 'D3', value:  25000, stage: 'proposal', pipeline_id: 'sales', assigned_to_user_id: 1 },
      ],
      quotas: [{ user_id: 1, period_label: 'Q3 2026', quota_amount: 200000 }],
    });
    render(<TeamPerformancePage />);

    // 1 won of 2 closed = 50%. The open deal must NOT count against it.
    await waitFor(() => expect(screen.getAllByText('50%').length).toBeGreaterThan(0));
    // 100000 won of a 200000 quota = 50% attainment.
    expect(screen.getByText(/\$100K won of \$200K/)).toBeInTheDocument();
  });

  it('ANNOUNCES deals that belong to nobody, and names the owner string', async () => {
    mockServer({
      deals: [
        { id: 'D1', value: 100000, stage: 'proposal', pipeline_id: 'sales', assigned_to_user_id: 1 },
        { id: 'D2', value: 300000, stage: 'proposal', pipeline_id: 'sales', assigned_to_user_id: null, assigned_to: 'John Smith' },
        { id: 'D3', value:  50000, stage: 'proposal', pipeline_id: 'sales', assigned_to_user_id: null, assigned_to: null },
      ],
    });
    render(<TeamPerformancePage />);

    await waitFor(() => expect(
      screen.getByText(/2 deals worth \$350K are not attributed to anyone/),
    ).toBeInTheDocument());
    // It says WHOSE attribution is missing, not merely how many.
    expect(screen.getByText(/"John Smith"/)).toBeInTheDocument();
  });

  it('role filter options come from the roster, not a fabricated title list', async () => {
    mockServer();
    render(<TeamPerformancePage />);
    await waitFor(() => expect(screen.getByText('Alex Rodriguez')).toBeInTheDocument());

    const select = screen.getByLabelText('Filter by role') as HTMLSelectElement;
    const options = Array.from(select.options).map(o => o.textContent);
    expect(options).toContain('sales');
    // Invented titles from the deleted fixture.
    expect(options).not.toContain('Sales Director');
    expect(options).not.toContain('Account Executive');
  });

  it('an empty roster gets a real EmptyState explaining why', async () => {
    mockServer({ users: [] });
    render(<TeamPerformancePage />);
    await waitFor(() => expect(
      screen.getByText('No people in this workspace yet'),
    ).toBeInTheDocument());
  });

  it('a failed deals fetch is reported, not absorbed into a zero', async () => {
    // A pipeline total of $0 because the request failed is indistinguishable
    // from a genuinely empty pipeline unless the page says so.
    fetchMock = vi.fn(async (url: string) => {
      const u = String(url);
      if (u.includes('/deals')) return { ok: false, status: 500, json: async () => ({}) };
      const data = u.includes('/pipelines') ? PIPELINES : u.includes('/users') ? USERS : [];
      return { ok: true, status: 200, json: async () => ({ success: true, data }) };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<TeamPerformancePage />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Could not load deals/));
  });

  it('does not link a deal count to a filter the Deals page cannot apply', async () => {
    // `/deals` is not a route (deals live at `/crm/deals`) and
    // DealsKanbanPage reads no query params, so the old links navigated
    // nowhere useful while appearing to filter.
    mockServer({
      deals: [{ id: 'D1', value: 100000, stage: 'proposal', pipeline_id: 'sales', assigned_to_user_id: 1 }],
    });
    render(<TeamPerformancePage />);
    await waitFor(() => expect(screen.getByText('Alex Rodriguez')).toBeInTheDocument());

    expect(screen.queryByRole('button', { name: 'View Deals' })).not.toBeInTheDocument();
    for (const call of navigate.mock.calls) {
      expect(String(call[0])).not.toMatch(/^\/deals/);
      expect(String(call[0])).not.toMatch(/member=/);
    }
  });
});
