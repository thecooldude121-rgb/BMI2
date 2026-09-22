import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportsPage from './ReportsPage';

/**
 * REPORTS PAGE — the routing half of P3 Phase 5.
 *
 * This file exists for one property: **nothing on this page navigates to a
 * report by its name any more.**
 *
 * It used to. `handleViewReport(title)` did
 * `navigate('/crm/reports/' + title.toLowerCase().replace(/\s+/g, '-'))`, and
 * all 21 cards here are UNBACKED_REPORTS — a catalogue of reports that are NOT
 * built, each carrying a reason. So every "View" led to a page that invented
 * content for whatever the title spelled.
 *
 * The workspace's real saved reports are a separate, fetched list, and those
 * navigate by id.
 */

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/CRM/CRMNavigation', () => ({ default: () => null }));

// The headline figures come from live deals; this page's own wiring is not what
// Phase 5 changed, so the hook is stubbed to a quiet, empty workspace.
vi.mock('../../hooks/useDashboardData', () => ({
  // Shape taken from what the page actually destructures — including
  // `truncated`, which the page reads to say whether its totals are lower
  // bounds rather than facts.
  useDashboardData: () => ({
    deals: [], leads: [], contacts: [],
    loading: false, error: null, reload: vi.fn(),
    truncated: { deals: false, leads: false, contacts: false },
  }),
  dealValue: () => 0,
}));
vi.mock('../../hooks/useStageLookup', () => ({
  useStageLookup: () => ({ byId: {}, bySlug: {}, loading: false, error: null }),
}));

const SAVED = [
  {
    id: 'R7', name: 'Won revenue by industry', description: 'Closed-won by industry.',
    category: 'Revenue Reports',
    definition: { v: 1, base: 'deals' },
    owner_id: 3, owner_name: 'Priya Nair', created_at: '', updated_at: '',
    abilities: { can_view: true, can_edit: true, can_delete: true, can_share: true },
  },
  {
    id: 'R8', name: 'Pipeline by owner', description: null, category: null,
    definition: { v: 1, base: 'deals' },
    owner_id: 9, owner_name: 'Ana Silva', created_at: '', updated_at: '',
    // Shared with this caller: they may view but not delete.
    abilities: { can_view: true, can_edit: false, can_delete: false, can_share: false },
  },
];

function mockServer(over: Partial<{ reports: unknown[]; status: number }> = {}) {
  const fetchMock = vi.fn(async (url: string) => {
    const u = String(url);
    if (u.endsWith('/reports')) {
      const status = over.status ?? 200;
      return { ok: status === 200, status, json: async () => (
        status === 200
          ? {
              success: true, data: over.reports ?? SAVED,
              modules: [], fields: [], grant_levels: ['view', 'edit'],
              aggregations: [], operators: [],
            }
          : { success: false, message: 'Registry unavailable' }
      ) } as Response;
    }
    return { ok: true, status: 200, json: async () => ({ success: true, data: [] }) } as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.clearAllMocks();
  navigate.mockReset();
});

describe('saved reports navigate BY ID', () => {
  it('opens a saved report at /crm/reports/<id>', async () => {
    mockServer();
    const user = userEvent.setup();
    render(<ReportsPage />);

    const card = await screen.findByRole('button', { name: /Won revenue by industry/ });
    await user.click(card);

    expect(navigate).toHaveBeenCalledWith('/crm/reports/R7');
    // And specifically NOT the slug the old code would have produced.
    expect(navigate).not.toHaveBeenCalledWith('/crm/reports/won-revenue-by-industry');
  });

  it('distinguishes a report of yours from one shared with you', async () => {
    mockServer();
    render(<ReportsPage />);

    await screen.findByRole('button', { name: /Won revenue by industry/ });
    expect(screen.getByText(/Yours/)).toBeInTheDocument();
    expect(screen.getByText(/Shared with you/)).toBeInTheDocument();
  });

  it('offers to build one when there are none', async () => {
    mockServer({ reports: [] });
    render(<ReportsPage />);
    expect(await screen.findByText(/haven.t saved any reports yet/i)).toBeInTheDocument();
    expect(screen.getByText(/private until you share them/i)).toBeInTheDocument();
  });

  it('a failed load says so instead of showing an empty list', async () => {
    // "You have none" and "we could not ask" are different facts about the
    // user's own data, and showing the first for the second is a false one.
    mockServer({ status: 500 });
    render(<ReportsPage />);
    expect(await screen.findByText(/Couldn.t load your saved reports/i)).toBeInTheDocument();
    expect(screen.queryByText(/haven.t saved any reports yet/i)).not.toBeInTheDocument();
  });
});

describe('the unbuilt catalogue no longer pretends to be viewable', () => {
  it('renders no View control on any catalogue card', async () => {
    mockServer();
    render(<ReportsPage />);
    await screen.findByRole('button', { name: /Won revenue by industry/ });

    // There were 21 of these, each leading to a slug URL.
    expect(screen.queryByRole('button', { name: /^View$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^View Report$/ })).not.toBeInTheDocument();
  });

  it('never navigates to a report URL built from a display name', async () => {
    mockServer();
    const user = userEvent.setup();
    render(<ReportsPage />);
    await screen.findByRole('button', { name: /Won revenue by industry/ });

    // Click everything clickable, then assert no navigation looks slug-shaped.
    for (const b of screen.getAllByRole('button')) {
      await user.click(b).catch(() => undefined);
    }

    const reportNavs = navigate.mock.calls
      .map(c => String(c[0]))
      .filter(u => u.startsWith('/crm/reports/'));

    for (const u of reportNavs) {
      const id = u.slice('/crm/reports/'.length);
      // Every report navigation targets a served id, never a slugified title.
      expect(SAVED.map(r => r.id)).toContain(decodeURIComponent(id));
      expect(id).not.toMatch(/-/);
    }
  });
});
