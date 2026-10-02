import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportDetailView from './ReportDetailView';

/**
 * SAVED REPORT DETAIL — frontend round trip.
 *
 * The page is rendered for real and `fetch` is the seam. The properties that
 * matter most here are about the URL and about absences:
 *
 *   - the id in the URL is what is REQUESTED (not a slug, not a name)
 *   - the heading is the STORED name (not one reconstructed from the URL)
 *   - four distinct failures stay distinct: gone/not-shared, stale, timed out,
 *     everything else
 *   - no fabricated rows, no dead export or schedule control
 */

const navigate = vi.fn();
let params: Record<string, string> = {};
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useParams: () => params,
}));
vi.mock('../../components/CRM/CRMNavigation', () => ({ default: () => null }));

let fetchMock: ReturnType<typeof vi.fn>;

const REPORT = {
  id: 'R7',
  name: 'Won revenue by industry',
  description: 'Closed-won value grouped by account industry.',
  category: 'Revenue Reports',
  definition: { v: 1, base: 'deals', dimensions: [{ field: 'companies.industry' }], metrics: [{ agg: 'sum', field: 'deals.value' }] },
  owner_id: 3,
  owner_name: 'Priya Nair',
  created_at: '2026-09-01T09:00:00.000Z',
  updated_at: '2026-09-02T09:00:00.000Z',
  abilities: { can_view: true, can_edit: true, can_delete: true, can_share: true },
};

const PROVENANCE = {
  rows_returned: 2, rows_matched: 2, rows_seeded: 2, rows_real: 0,
  seeded_share: 1, mostly_seeded: true, excluded_test: 1,
  coverage: [{ kind: 'join', key: 'companies', label: 'Account', matched: 16, of: 24 }],
  currencies: null,
  truncated: false, row_limit: 5000,
  disclosure: 'All 2 rows are seeded demo data. 8 of 24 have no account linked and are not counted.',
};

/** The run endpoints spread at the TOP level: `{ success, ...run }`. */
const RUN = {
  success: true,
  report: { id: 'R7', name: 'Won revenue by industry' },
  columns: [
    { key: 'companies.industry', label: 'Industry', kind: 'dimension' },
    { key: 'sum:deals.value', label: 'Sum of Deal value', kind: 'metric' },
  ],
  rows: [
    { dim_0: 'EdTech', metric_0: '963000' },
    { dim_0: 'IT Services', metric_0: '412000' },
  ],
  provenance: PROVENANCE,
  ms: 63,
};

function mockServer(over: Partial<{
  report: unknown;
  reportStatus: number;
  runStatus: number;
  runMessage: string;
  grants: unknown[];
  roster: unknown[];
  onPut: (body: unknown) => Response;
  onDelete: () => Response;
}> = {}) {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const u = String(url);

    if (method === 'GET' && /\/reports\/[^/]+\/run$/.test(u)) {
      const status = over.runStatus ?? 200;
      return { ok: status === 200, status, json: async () => (
        status === 200 ? RUN : { success: false, message: over.runMessage ?? 'run failed' }
      ) } as Response;
    }
    if (method === 'GET' && /\/reports\/[^/]+\/grants$/.test(u)) {
      return { ok: true, status: 200, json: async () => ({
        success: true, data: over.grants ?? [], grant_levels: ['view', 'edit'],
      }) } as Response;
    }
    if (method === 'PUT' && /\/grants$/.test(u)) {
      return over.onPut
        ? over.onPut(init?.body ? JSON.parse(init.body as string) : undefined)
        : { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
    }
    if (method === 'DELETE' && /\/reports\/[^/]+$/.test(u)) {
      return over.onDelete ? over.onDelete() : { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
    }
    if (method === 'GET' && u.includes('/users')) {
      return { ok: true, status: 200, json: async () => ({
        success: true, data: over.roster ?? [], assignable_roles: [],
      }) } as Response;
    }
    if (method === 'GET' && /\/reports\/[^/]+$/.test(u)) {
      const status = over.reportStatus ?? 200;
      return { ok: status === 200, status, json: async () => (
        status === 200
          ? { success: true, data: over.report ?? REPORT }
          : { success: false, message: 'Report not found' }
      ) } as Response;
    }
    throw new Error(`unexpected request: ${method} ${u}`);
  });
  vi.stubGlobal('fetch', fetchMock);
}

const urlsFetched = () => fetchMock.mock.calls.map(c => String(c[0]));

beforeEach(() => {
  vi.clearAllMocks();
  navigate.mockReset();
  params = { reportId: 'R7' };
});

describe('the route parameter is a report ID, and it is what gets requested', () => {
  it('fetches the report and its run by the id from the URL', async () => {
    mockServer();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    expect(urlsFetched().some(u => u.endsWith('/reports/R7'))).toBe(true);
    expect(urlsFetched().some(u => u.endsWith('/reports/R7/run'))).toBe(true);
  });

  it('renders the STORED name, not a name rebuilt from the URL', async () => {
    /*
     * The old page derived its heading by title-casing the slug, so
     * "Won revenue by industry" would have rendered as "Won Revenue By
     * Industry" — the URL describing the data instead of the reverse. Here the
     * id carries no words at all, so the heading can only come from the server.
     */
    params = { reportId: 'R7' };
    mockServer();
    render(<ReportDetailView />);

    expect(await screen.findByRole('heading', { name: 'Won revenue by industry' }))
      .toBeInTheDocument();
    expect(screen.queryByText('Won Revenue By Industry')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /R7/ })).not.toBeInTheDocument();
  });

  it('an id with URL-unsafe characters is encoded, not concatenated raw', async () => {
    params = { reportId: 'a/b c' };
    mockServer();
    render(<ReportDetailView />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(urlsFetched().some(u => u.includes('a%2Fb%20c'))).toBe(true);
  });
});

describe('every figure comes from the run, and none from a fixture', () => {
  it('renders the returned rows under the returned headings', async () => {
    mockServer();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    expect(screen.getByText('EdTech')).toBeInTheDocument();
    expect(screen.getByText('963000')).toBeInTheDocument();
    expect(screen.getByText('Sum of Deal value')).toBeInTheDocument();
  });

  it('shows none of the fixture names the old page invented', async () => {
    /*
     * `getReportData(slug)` returned rows naming "GlobalCorp Industries",
     * "TechVision Solutions", and owners "Alex Rodriguez" / "Sarah Chen" — the
     * same fixture family as the deleted meeting and gamification data. It sat
     * behind a PREVIEW banner, which is not enough for rows that name people
     * and quote their numbers.
     */
    mockServer();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    for (const invented of [
      /GlobalCorp/, /TechVision/, /InnovateNow/, /DataStream/, /CloudFirst/,
      /Alex Rodriguez/, /Sarah Chen/, /Mike Johnson/, /Emily Davis/,
    ]) {
      expect(screen.queryByText(invented)).not.toBeInTheDocument();
    }
  });

  it('offers no SCHEDULE control, because scheduling still is not built', async () => {
    /*
     * UPDATED IN PHASE 7. This asserted that EXPORT had no control either,
     * which was correct while export was fake — the old menu was `console.log`
     * behind a "Report exported successfully" toast and a "View File" button
     * pointing at a file never written.
     *
     * Export is real now, so that half of the assertion is gone and the export
     * tests below replace it. Scheduling is still not built, and its absence
     * still needs pinning: a dead control is worse than none, because a user
     * plans around it.
     */
    mockServer();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    expect(screen.queryByRole('button', { name: /schedule/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Scheduled delivery isn.t built yet/i)).toBeInTheDocument();
  });

  it('an empty result is stated as a result, not as a failure', async () => {
    mockServer();
    fetchMock.mockImplementation(async (url: string) => {
      const u = String(url);
      if (/\/run$/.test(u)) {
        return { ok: true, status: 200, json: async () => ({ ...RUN, rows: [] }) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ success: true, data: REPORT }) } as Response;
    });
    render(<ReportDetailView />);

    expect(await screen.findByText(/No rows matched/i)).toBeInTheDocument();
    expect(screen.getByText(/a result, not a failure/i)).toBeInTheDocument();
  });
});

describe('the seeded-data disclosure is carried through, via the shared note', () => {
  it('renders the server\'s sentence above the table and flags mostly-seeded', async () => {
    mockServer();
    render(<ReportDetailView />);
    const note = await screen.findByTestId('provenance-note');

    expect(note).toHaveTextContent('All 2 rows are seeded demo data.');
    expect(note).toHaveAttribute('data-mostly-seeded', 'true');

    // Before the figures, not after them.
    const table = screen.getByRole('table');
    expect(note.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows coverage as its own figure, not folded into the seeded share', async () => {
    mockServer();
    render(<ReportDetailView />);
    const note = await screen.findByTestId('provenance-note');
    expect(note).toHaveTextContent(/Account/);
    expect(note).toHaveTextContent(/16/);
  });
});

describe('the four failures stay four different failures', () => {
  it('404: one message for "gone" and "not shared with you"', async () => {
    mockServer({ reportStatus: 404 });
    render(<ReportDetailView />);

    expect(await screen.findByTestId('report-error-missing')).toBeInTheDocument();
    // Deliberately NOT distinguished — telling a prober which ids exist is the
    // same leak as a login that says whether the email was known.
    expect(screen.getByText(/doesn.t exist, or isn.t shared with you/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('409: the definition is stale, and it points at the builder for someone who can edit', async () => {
    mockServer({ runStatus: 409, runMessage: 'Unknown field "deals.health_score"' });
    render(<ReportDetailView />);

    expect(await screen.findByTestId('report-error-stale')).toBeInTheDocument();
    expect(screen.getByText(/can no longer run/i)).toBeInTheDocument();
    expect(screen.getByText(/deals\.health_score/)).toBeInTheDocument();
    expect(screen.getByText(/Open it in the builder/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('409 for a VIEWER says to ask the owner, since they cannot fix it', async () => {
    mockServer({
      runStatus: 409,
      runMessage: 'gone',
      report: { ...REPORT, abilities: { can_view: true, can_edit: false, can_delete: false, can_share: false } },
    });
    render(<ReportDetailView />);

    await screen.findByTestId('report-error-stale');
    expect(screen.getByText(/Ask its owner/i)).toBeInTheDocument();
    expect(screen.queryByText(/Open it in the builder/i)).not.toBeInTheDocument();
  });

  it('504: timed out, and no partial table', async () => {
    mockServer({ runStatus: 504, runMessage: 'timeout' });
    render(<ReportDetailView />);

    expect(await screen.findByTestId('report-error-timeout')).toBeInTheDocument();
    expect(screen.getByText(/took too long/i)).toBeInTheDocument();
    // A cut-off query's partial answer is not a smaller correct answer.
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('a RE-RUN that fails clears the table it is replacing', async () => {
    /*
     * The gap initial-load tests cannot cover: on first load `run` is already
     * null, so nothing proves the failure path clears it. A re-run starts from
     * a rendered table, and leaving that table under an error banner is the
     * worst of both — figures presented as current, from a run that just
     * failed.
     *
     * Found by mutation-testing: removing `setRun(null)` from the catch passed
     * the entire suite until this test existed.
     */
    let runCalls = 0;
    mockServer();
    fetchMock.mockImplementation(async (url: string) => {
      const u = String(url);
      if (/\/run$/.test(u)) {
        runCalls += 1;
        return runCalls === 1
          ? { ok: true, status: 200, json: async () => RUN } as Response
          : { ok: false, status: 504, json: async () => ({ success: false, message: 'timeout' }) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ success: true, data: REPORT }) } as Response;
    });

    const user = userEvent.setup();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /Re-run/i }));

    expect(await screen.findByTestId('report-error-timeout')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    // And the disclosure goes with it — a note describing rows that are no
    // longer shown is a statement about nothing.
    expect(screen.queryByTestId('provenance-note')).not.toBeInTheDocument();
  });

  it('anything else reads as a generic failure, not as one of the specific three', async () => {
    mockServer({ runStatus: 500, runMessage: 'boom' });
    render(<ReportDetailView />);

    expect(await screen.findByTestId('report-error-other')).toBeInTheDocument();
    expect(screen.queryByTestId('report-error-stale')).not.toBeInTheDocument();
    expect(screen.queryByTestId('report-error-missing')).not.toBeInTheDocument();
  });
});

describe('controls come from the served abilities, and absence means no control', () => {
  it('an owner gets edit, share and delete', async () => {
    mockServer();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Share/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
  });

  it('a view-only grantee gets NONE of them — not disabled ones', async () => {
    mockServer({
      report: { ...REPORT, abilities: { can_view: true, can_edit: false, can_delete: false, can_share: false } },
    });
    render(<ReportDetailView />);
    await screen.findByRole('table');

    // A disabled control advertises an action that does not exist for you.
    expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Share/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
    // Re-run is available to anyone who can view.
    expect(screen.getByRole('button', { name: /Re-run/i })).toBeInTheDocument();
  });

  it('an editor who is not the owner cannot delete or share — those are owner-only', async () => {
    mockServer({
      report: { ...REPORT, abilities: { can_view: true, can_edit: true, can_delete: false, can_share: false } },
    });
    render(<ReportDetailView />);
    await screen.findByRole('table');

    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Share/i })).not.toBeInTheDocument();
  });

  it('Edit opens the builder on THIS report id', async () => {
    mockServer();
    const user = userEvent.setup();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /Edit/i }));
    expect(navigate).toHaveBeenCalledWith('/crm/custom-report-builder?id=R7');
  });
});

describe('an ownerless report is a real state, and says so', () => {
  it('names the absence rather than printing a blank byline', async () => {
    // The owner FK is ON DELETE SET NULL: a report outlives its creator.
    mockServer({ report: { ...REPORT, owner_id: null, owner_name: null } });
    render(<ReportDetailView />);
    await screen.findByRole('table');

    expect(screen.getByText(/No owner/i)).toBeInTheDocument();
  });
});

describe('sharing writes real grants', () => {
  const roster = [
    { id: 4, first_name: 'Sam', last_name: 'Okafor', email: 'sam@example.com', role: 'sales', is_active: true, created_at: '' },
    { id: 5, first_name: 'Dee', last_name: 'Gone', email: 'dee@example.com', role: 'sales', is_active: false, created_at: '' },
  ];

  it('lists current grants and grants view access by user id', async () => {
    let put: unknown;
    mockServer({
      roster,
      grants: [{ user_id: 9, level: 'view', name: 'Ana Silva', email: 'ana@example.com', created_at: '' }],
      onPut: (body) => {
        put = body;
        return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
      },
    });
    const user = userEvent.setup();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /Share/i }));
    expect(await screen.findByText(/ana@example.com/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Give view access/i }));
    await waitFor(() => expect(put).toBeTruthy());
    // By id, and `view` is the floor a share grants.
    expect(put).toEqual({ user_id: 4, level: 'view' });
  });

  it('does not offer to share with a deactivated account', async () => {
    mockServer({ roster });
    const user = userEvent.setup();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /Share/i }));
    expect(await screen.findByText(/sam@example.com/)).toBeInTheDocument();
    // Granting access nobody can use reads as a share that worked.
    expect(screen.queryByText(/dee@example.com/)).not.toBeInTheDocument();
  });

  it('says private means no grants, rather than showing a private toggle', async () => {
    mockServer({ roster: [] });
    const user = userEvent.setup();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /Share/i }));
    expect(await screen.findByText(/Only you/i)).toBeInTheDocument();
    // There is no `visibility` column, so there is nothing to toggle.
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('promises no email, because report sharing is not wired to the mailer', async () => {
    mockServer({ roster });
    const user = userEvent.setup();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /Share/i }));
    expect(await screen.findByText(/Nobody is emailed/i)).toBeInTheDocument();
  });
});

describe('delete', () => {
  it('confirms first, then returns to the list', async () => {
    let deleted = false;
    mockServer({
      onDelete: () => {
        deleted = true;
        return { ok: true, status: 200, json: async () => ({ success: true }) } as Response;
      },
    });
    const user = userEvent.setup();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /Delete/i }));
    // Says what is and is not destroyed.
    expect(await screen.findByText(/are not touched/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Delete report/i }));
    await waitFor(() => expect(deleted).toBe(true));
    expect(navigate).toHaveBeenCalledWith('/crm/reports', { replace: true });
  });

  it('cancelling deletes nothing', async () => {
    let deleted = false;
    mockServer({
      onDelete: () => { deleted = true; return { ok: true, status: 200, json: async () => ({}) } as Response; },
    });
    const user = userEvent.setup();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /Delete/i }));
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(deleted).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('a canned report is presented as what it is', () => {
  const CANNED = {
    ...REPORT,
    id: 'canned:revenue-by-industry',
    name: 'Revenue by Industry',
    owner_id: null,
    owner_name: null,
    is_canned: true,
    caveat: 'Industry lives on the account, so only linked deals can be placed in a band.',
    abilities: { can_view: true, can_edit: false, can_delete: false, can_share: false },
  };

  beforeEach(() => { params = { reportId: 'canned:revenue-by-industry' }; });

  it('says "Built in" rather than "No owner"', async () => {
    /*
     * A canned report genuinely has no owner row, and the ownerless wording
     * ("the person who created this no longer has an account") would be a
     * false statement about a report the product ships. Sending a fake owner
     * name would have been the shorter fix and the wrong one.
     */
    mockServer({ report: CANNED });
    render(<ReportDetailView />);
    await screen.findByRole('table');

    expect(screen.getByText('Built in')).toBeInTheDocument();
    expect(screen.queryByText(/No owner/i)).not.toBeInTheDocument();
  });

  it('offers no edit, share or delete, because nobody owns it', async () => {
    mockServer({ report: CANNED });
    render(<ReportDetailView />);
    await screen.findByRole('table');

    for (const name of [/Edit/i, /Share/i, /Delete/i]) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: /Re-run/i })).toBeInTheDocument();
  });

  it('shows the structural caveat ABOVE the per-run note, since they answer different questions', async () => {
    // The caveat describes the DATA MODEL and is true of every run; the note
    // describes what THIS run measured. Collapsing them loses the reason or
    // the number.
    mockServer({ report: CANNED });
    render(<ReportDetailView />);
    const note = await screen.findByTestId('provenance-note');
    const caveat = screen.getByText(/Industry lives on the account/);

    expect(caveat).toBeInTheDocument();
    expect(caveat.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('still shows the caveat when the run FAILS', async () => {
    // The reason the report is limited does not stop being true because the
    // query timed out.
    mockServer({ report: CANNED, runStatus: 504, runMessage: 'timeout' });
    render(<ReportDetailView />);
    await screen.findByTestId('report-error-timeout');
    expect(screen.getByText(/Industry lives on the account/)).toBeInTheDocument();
  });
});

describe('the NULL bucket is named, not left as a dash', () => {
  it('renders "Not recorded" for a null DIMENSION and a dash for a null METRIC', async () => {
    /*
     * On live data the largest row of the by-owner report is the null one — 15
     * of 16 deals — and an em-dash there reads as "no data in this cell"
     * rather than "these are the deals nobody is linked to". The words match
     * the server's disclosure sentence exactly so the two can be matched by eye.
     */
    mockServer();
    fetchMock.mockImplementation(async (url: string) => {
      const u = String(url);
      if (/\/run$/.test(u)) {
        return { ok: true, status: 200, json: async () => ({
          ...RUN,
          rows: [{ dim_0: null, metric_0: null }],
        }) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ success: true, data: REPORT }) } as Response;
    });
    render(<ReportDetailView />);
    await screen.findByRole('table');

    expect(screen.getByText('Not recorded')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('CSV export', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  /*
   * The old page's export menu was `console.log` behind a "Report exported
   * successfully" toast and a "View File" button, so a user went looking on
   * disk for a file that was never written. What is pinned here is that a
   * request is actually MADE, and that a failure is reported rather than
   * swallowed.
   */
  /**
   * Minimal: spy on the ANCHOR'S click and stub the object-URL pair, nothing
   * else.
   *
   * The first version of this mocked `document.createElement` wholesale, which
   * broke React's own rendering — the next test found an empty <body> and
   * failed for a reason unrelated to what it was testing. A test double that
   * replaces a DOM primitive takes the framework with it.
   */
  const stubDownload = () => {
    const saved: { name: string | null } = { name: null };
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) { saved.name = this.download; });
    const createObjectURL = vi.fn(() => 'blob:x');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL, revokeObjectURL }));
    return { click, saved };
  };

  it('requests the export endpoint for THIS report and saves what the server named', async () => {
    const { click, saved } = stubDownload();
    mockServer();
    fetchMock.mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes('/export.csv')) {
        return {
          ok: true, status: 200,
          headers: { get: () => 'attachment; filename="deals-by-name-2026-09-23.csv"' },
          blob: async () => new Blob(['x']),
        } as unknown as Response;
      }
      if (/\/run$/.test(u)) return { ok: true, status: 200, json: async () => RUN } as Response;
      return { ok: true, status: 200, json: async () => ({ success: true, data: REPORT }) } as Response;
    });

    const user = userEvent.setup();
    render(<ReportDetailView />);
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: /Export CSV/i }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(urlsFetched().some(u => u.endsWith('/reports/R7/export.csv'))).toBe(true);
    // The server names the file; the client does not invent one.
    expect(saved.name).toBe('deals-by-name-2026-09-23.csv');
  });

  it('reports a failed export instead of silently saving nothing', async () => {
    stubDownload();
    mockServer();
    fetchMock.mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes('/export.csv')) {
        return { ok: false, status: 409, json: async () => ({
          success: false, message: 'Unknown field "deals.gone"',
        }) } as Response;
      }
      if (/\/run$/.test(u)) return { ok: true, status: 200, json: async () => RUN } as Response;
      return { ok: true, status: 200, json: async () => ({ success: true, data: REPORT }) } as Response;
    });

    const user = userEvent.setup();
    render(<ReportDetailView />);
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: /Export CSV/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Couldn.t export this report/);
    expect(screen.getByRole('alert')).toHaveTextContent('deals.gone');
  });

  it('still says scheduling is not built, so nobody plans around it', async () => {
    mockServer();
    render(<ReportDetailView />);
    await screen.findByRole('table');
    expect(screen.getByText(/Scheduled delivery isn.t built yet/i)).toBeInTheDocument();
  });
});

describe('Excel export', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  const stub = () => {
    const saved: { name: string | null } = { name: null };
    vi.spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) { saved.name = this.download; });
    vi.stubGlobal('URL', Object.assign(Object.create(URL), {
      createObjectURL: () => 'blob:x', revokeObjectURL: vi.fn(),
    }));
    return saved;
  };

  it('hits the .xlsx endpoint, not the .csv one', async () => {
    const saved = stub();
    mockServer();
    fetchMock.mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes('/export.xlsx')) {
        return {
          ok: true, status: 200,
          headers: { get: () => 'attachment; filename="deals-2026-09-23.xlsx"' },
          blob: async () => new Blob(['PK']),
        } as unknown as Response;
      }
      if (/\/run$/.test(u)) return { ok: true, status: 200, json: async () => RUN } as Response;
      return { ok: true, status: 200, json: async () => ({ success: true, data: REPORT }) } as Response;
    });

    const user = userEvent.setup();
    render(<ReportDetailView />);
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: /Export Excel/i }));

    await waitFor(() => expect(saved.name).toBe('deals-2026-09-23.xlsx'));
    expect(urlsFetched().some(u => u.endsWith('/reports/R7/export.xlsx'))).toBe(true);
    expect(urlsFetched().some(u => u.endsWith('/export.csv'))).toBe(false);
  });

  it('offers all three formats, each hitting its own endpoint', async () => {
    /*
     * UPDATED IN PHASE 7. This asserted PDF was NOT offered, which was correct
     * while it did not exist — absent rather than disabled, because a disabled
     * control advertises something unavailable. pdfkit was approved and PDF is
     * real now, so the assertion inverts.
     */
    const saved = stub();
    mockServer();
    fetchMock.mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes('/export.pdf')) {
        return {
          ok: true, status: 200,
          headers: { get: () => 'attachment; filename="deals-2026-10-03.pdf"' },
          blob: async () => new Blob(['%PDF-']),
        } as unknown as Response;
      }
      if (/\/run$/.test(u)) return { ok: true, status: 200, json: async () => RUN } as Response;
      return { ok: true, status: 200, json: async () => ({ success: true, data: REPORT }) } as Response;
    });

    const user = userEvent.setup();
    render(<ReportDetailView />);
    await screen.findByRole('table');

    for (const name of [/Export CSV/i, /Export Excel/i, /Export PDF/i]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }

    await user.click(screen.getByRole('button', { name: /Export PDF/i }));
    await waitFor(() => expect(saved.name).toBe('deals-2026-10-03.pdf'));
    expect(urlsFetched().some(u => u.endsWith('/reports/R7/export.pdf'))).toBe(true);
  });
});
