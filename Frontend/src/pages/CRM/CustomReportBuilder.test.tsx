import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomReportBuilder from './CustomReportBuilder';

/**
 * CUSTOM REPORT BUILDER — frontend round trip.
 *
 * The page is rendered for real and `fetch` is the seam, so what is asserted is
 * the request that actually left the client and the UI the SERVER's response
 * produced.
 *
 * What these tests are really for: this page had no backend at all. It ticked a
 * `setInterval` progress bar to 100%, waited on a `setTimeout`, and reported
 * success against a database with no reports table. So the properties below are
 * mostly about absences — no invented pickers, no result without a run, no
 * progress bar measuring nothing — because those are what regress silently.
 */

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useSearchParams: () => [new URLSearchParams(search), vi.fn()],
}));
vi.mock('../../components/CRM/CRMNavigation', () => ({ default: () => null }));

let search = '';
let fetchMock: ReturnType<typeof vi.fn>;

const REGISTRY = {
  success: true,
  data: [],
  modules: [
    { key: 'deals', label: 'Deals', joins: ['companies'] },
    { key: 'companies', label: 'Companies', joins: [] },
  ],
  fields: [
    { key: 'deals.value', label: 'Deal value', type: 'number', module: 'deals', aggregatable: true },
    { key: 'deals.name', label: 'Deal name', type: 'string', module: 'deals', aggregatable: false },
    { key: 'deals.source', label: 'Source', type: 'enum', module: 'deals', aggregatable: false },
    { key: 'companies.industry', label: 'Industry', type: 'enum', module: 'companies', aggregatable: false },
  ],
  grant_levels: ['view', 'edit'],
  aggregations: [
    { id: 'count', needs_field: false },
    { id: 'sum', needs_field: true },
  ],
  operators: [
    { id: 'eq', arity: 1, applies_to: null },
    { id: 'contains', arity: 1, applies_to: ['string'] },
    { id: 'is_null', arity: 0, applies_to: null },
    { id: 'between', arity: 2, applies_to: null },
  ],
};

const PROVENANCE = {
  rows_returned: 2, rows_matched: 2, rows_seeded: 2, rows_real: 0,
  seeded_share: 1, mostly_seeded: true, excluded_test: 0, coverage: [],
  truncated: false, row_limit: 5000,
  disclosure: 'All 2 rows are seeded demo data.',
};

/**
 * The run endpoints spread the result at the TOP LEVEL (`{ success, ...run }`),
 * unlike every other endpoint here, which nests under `data`. Pinned on the
 * server by roundTrip.reportRun.test.ts; if that changes, this fixture is wrong.
 */
const RUN_OK = {
  success: true,
  columns: [
    { key: 'companies.industry', label: 'Industry', kind: 'dimension' },
    { key: 'sum:deals.value', label: 'Sum of Deal value', kind: 'metric' },
  ],
  rows: [
    { dim_0: 'EdTech', metric_0: '120000' },
    { dim_0: 'IT Services', metric_0: '80000' },
  ],
  provenance: PROVENANCE,
  ms: 41,
};

function mockServer(over: Partial<{
  registryStatus: number;
  /** A 200 that OMITS registry keys — distinct from a failed request. */
  registryOverride: Record<string, unknown>;
  report: unknown;
  onRun: () => Response;
  onPost: (body: unknown) => Response;
}> = {}) {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const u = String(url);

    if (method === 'POST' && u.endsWith('/reports/run')) {
      return over.onRun ? over.onRun() : { ok: true, status: 200, json: async () => RUN_OK } as Response;
    }
    if (method === 'GET' && /\/reports\/[^/]+\/run$/.test(u)) {
      return over.onRun ? over.onRun() : { ok: true, status: 200, json: async () => RUN_OK } as Response;
    }
    if (method === 'POST' && u.endsWith('/reports')) {
      return over.onPost
        ? over.onPost(init?.body ? JSON.parse(init.body as string) : undefined)
        : { ok: true, status: 201, json: async () => ({ success: true, data: { id: 'R1', name: 'Saved one' } }) } as Response;
    }
    if (method === 'GET' && u.endsWith('/reports')) {
      const status = over.registryStatus ?? 200;
      return { ok: status === 200, status, json: async () => (
        status === 200
          ? { ...REGISTRY, ...(over.registryOverride ?? {}) }
          : { success: false, message: 'Registry unavailable' }
      ) } as Response;
    }
    if (method === 'GET' && /\/reports\/[^/]+$/.test(u)) {
      return { ok: true, status: 200, json: async () => ({ success: true, data: over.report }) } as Response;
    }
    throw new Error(`unexpected request: ${method} ${u}`);
  });
  vi.stubGlobal('fetch', fetchMock);
}

beforeEach(() => {
  vi.clearAllMocks();
  search = '';
  navigate.mockReset();
});

describe('the pickers are the SERVED registry, and nothing else', () => {
  it('offers the served modules', async () => {
    mockServer();
    render(<CustomReportBuilder />);
    const select = await screen.findByLabelText('Report on');
    expect(select).toHaveTextContent('Deals');
    expect(select).toHaveTextContent('Companies');
  });

  it('does NOT offer the fabrications the old page carried', async () => {
    /*
     * These four are the reason Phase 4 was a rewrite and not a rewiring:
     *   Revenue          — not a module
     *   HRMS Connection  — a SEPARATE PRODUCT this CRM must never join to
     *   Deal Health      — no such column; the spec claims it, it never shipped
     *   Last Activity    — no such column
     * A picker offering an HRMS join is a product-boundary violation shipped as
     * a dropdown, so its absence is asserted rather than assumed.
     */
    mockServer();
    render(<CustomReportBuilder />);
    await screen.findByLabelText('Report on');

    for (const gone of [/HRMS/i, /Deal Health/i, /Last Activity/i]) {
      expect(screen.queryByText(gone)).not.toBeInTheDocument();
    }
    // "Revenue" must not appear as a data source. (It is legitimate as a
    // CATEGORY name, which is why this checks the module picker specifically.)
    expect(screen.getByLabelText('Report on')).not.toHaveTextContent('Revenue');
  });

  it('offers no fields at all when the registry cannot be loaded, rather than a guessed list', async () => {
    mockServer({ registryStatus: 500 });
    render(<CustomReportBuilder />);
    expect(await screen.findByText(/no fields are offered rather than a\s+guessed list/i))
      .toBeInTheDocument();
    expect(screen.queryByLabelText('Report on')).not.toBeInTheDocument();
  });

  it('offers NOTHING when a 200 response omits the registry, rather than a local fallback', async () => {
    /*
     * This is the case a failed request does NOT cover, and the distinction
     * matters: a 500 never reaches the client's `?? []` default at all. A 200
     * that omits `modules` does, and that default is the single place a
     * fabricated picker list could be reintroduced — which is how this page
     * came to offer "Revenue" and "HRMS Connection" in the first place.
     *
     * Found by mutation-testing: substituting a local fallback list passed the
     * whole suite until this test existed.
     */
    mockServer({ registryOverride: { modules: undefined, fields: undefined } });
    render(<CustomReportBuilder />);

    const select = await screen.findByLabelText('Report on');
    // No options at all — an empty picker is honest; an invented one is not.
    expect(select.querySelectorAll('option')).toHaveLength(0);
    expect(select).not.toHaveTextContent('Revenue');
    expect(select).not.toHaveTextContent('Deals');
  });

  it('hides an operator the server would refuse for the chosen field type', async () => {
    // `contains` is declared text-only. On a number field it must not be
    // offered — the server answers 400, and a UI that shows you a door the
    // server will not open is the defect this project keeps removing.
    mockServer();
    const user = userEvent.setup();
    render(<CustomReportBuilder />);
    await screen.findByLabelText('Report on');

    await user.click(screen.getByRole('button', { name: /Add filter/i }));
    const opSelect = await screen.findByLabelText('Filter operator 1');
    const fieldSelect = screen.getByLabelText('Filter field 1');

    // Default field is the first available — deals.value, a number.
    expect(fieldSelect).toHaveValue('deals.value');
    expect(opSelect).not.toHaveTextContent('contains');

    // Switch to a text field and it becomes available.
    await user.selectOptions(fieldSelect, 'deals.name');
    expect(screen.getByLabelText('Filter operator 1')).toHaveTextContent('contains');
  });
});

describe('there is no result until the server produces one', () => {
  it('shows no rows and no progress bar before Run is pressed', async () => {
    mockServer();
    render(<CustomReportBuilder />);
    await screen.findByLabelText('Report on');

    expect(screen.getByText(/there are no sample rows here/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    // The old page ticked a setInterval to 100% while nothing ran.
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders the rows the server returned, under the right headings', async () => {
    mockServer();
    const user = userEvent.setup();
    render(<CustomReportBuilder />);
    await screen.findByLabelText('Report on');

    await user.click(screen.getByRole('button', { name: /^Run$/ }));

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(screen.getByText('EdTech')).toBeInTheDocument();
    expect(screen.getByText('120000')).toBeInTheDocument();
    expect(screen.getByText('Sum of Deal value')).toBeInTheDocument();
  });

  it('discards a shown result as soon as the definition changes', async () => {
    // A stale table under an edited definition is a figure that no longer
    // describes what the screen says it describes.
    mockServer();
    const user = userEvent.setup();
    render(<CustomReportBuilder />);
    await screen.findByLabelText('Report on');

    await user.click(screen.getByRole('button', { name: /^Run$/ }));
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Add measure/i }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('the disclosure travels with the result', () => {
  it('renders the server\'s sentence above the table', async () => {
    mockServer();
    const user = userEvent.setup();
    render(<CustomReportBuilder />);
    await screen.findByLabelText('Report on');

    await user.click(screen.getByRole('button', { name: /^Run$/ }));

    const note = await screen.findByTestId('provenance-note');
    expect(note).toHaveTextContent('All 2 rows are seeded demo data.');
    expect(note).toHaveAttribute('data-mostly-seeded', 'true');

    // Above the figures, not below them: the reader must meet the disclosure
    // before the numbers, not after.
    const table = screen.getByRole('table');
    expect(note.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('a saved report that no longer compiles (409)', () => {
  const stale = {
    id: 'R9', name: 'Old report', description: null, category: null,
    definition: { v: 1, base: 'deals', dimensions: [], metrics: [{ agg: 'count' }] },
    owner_id: 1, owner_name: 'Me', created_at: '', updated_at: '',
    abilities: { can_view: true, can_edit: true, can_delete: true, can_share: true },
  };

  it('says the report needs fixing, shows no rows, and does not blame the user\'s input', async () => {
    search = 'id=R9';
    mockServer({
      report: stale,
      onRun: () => ({ ok: false, status: 409, json: async () => ({
        success: false, message: 'Field "deals.health_score" is no longer available.',
      }) }) as Response,
    });
    const user = userEvent.setup();
    render(<CustomReportBuilder />);
    await screen.findByLabelText('Report on');

    await user.click(screen.getByRole('button', { name: /^Run$/ }));

    expect(await screen.findByText(/can no longer run/i)).toBeInTheDocument();
    // The server's reason is shown verbatim — it is the only part that says
    // WHICH field went away.
    expect(screen.getByText(/deals\.health_score/)).toBeInTheDocument();
    // No partial result.
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    // Distinguished from an input error: a 409 is not "you typed it wrong".
    expect(screen.queryByText(/Couldn.t run this report/i)).not.toBeInTheDocument();
  });

  it('still lets the definition be edited, which is the way out of a 409', async () => {
    search = 'id=R9';
    mockServer({
      report: stale,
      onRun: () => ({ ok: false, status: 409, json: async () => ({
        success: false, message: 'gone',
      }) }) as Response,
    });
    const user = userEvent.setup();
    render(<CustomReportBuilder />);
    await screen.findByLabelText('Report on');
    await user.click(screen.getByRole('button', { name: /^Run$/ }));
    await screen.findByText(/can no longer run/i);

    // The editor is still live, and touching it clears the error.
    await user.click(screen.getByRole('button', { name: /Add measure/i }));
    expect(screen.queryByText(/can no longer run/i)).not.toBeInTheDocument();
  });

  it('a 400 on an ad-hoc run reads as an input problem, not a stale report', async () => {
    mockServer({
      onRun: () => ({ ok: false, status: 400, json: async () => ({
        success: false, message: 'Filter on "deals.value" with "eq" needs a value',
      }) }) as Response,
    });
    const user = userEvent.setup();
    render(<CustomReportBuilder />);
    await screen.findByLabelText('Report on');

    await user.click(screen.getByRole('button', { name: /^Run$/ }));

    expect(await screen.findByText(/Couldn.t run this report/i)).toBeInTheDocument();
    expect(screen.queryByText(/can no longer run/i)).not.toBeInTheDocument();
  });
});

describe('saving sends the definition the editor is holding', () => {
  it('posts the real definition and reports the name the server stored', async () => {
    let sent: unknown;
    mockServer({
      onPost: (body) => {
        sent = body;
        return { ok: true, status: 201, json: async () => ({
          success: true, data: { id: 'R2', name: 'Won by industry' },
        }) } as Response;
      },
    });
    const user = userEvent.setup();
    render(<CustomReportBuilder />);
    await screen.findByLabelText('Report on');

    await user.type(screen.getByLabelText(/Name/), 'Won by industry');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));

    await waitFor(() => expect(sent).toBeTruthy());
    const body = sent as { name: string; definition: { v: number; base: string } };
    expect(body.name).toBe('Won by industry');
    // The definition is the editor's state, not a translated copy of it.
    expect(body.definition.v).toBe(1);
    expect(body.definition.base).toBe('deals');

    expect(await screen.findByText(/Saved as/)).toHaveTextContent('Won by industry');
  });

  it('refuses to save without a name, and sends no request', async () => {
    mockServer();
    const user = userEvent.setup();
    render(<CustomReportBuilder />);
    await screen.findByLabelText('Report on');

    await user.click(screen.getByRole('button', { name: /^Save$/ }));

    expect(await screen.findByText(/A name is required/)).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(c => (c[1] as RequestInit)?.method === 'POST')).toHaveLength(0);
  });

  it('surfaces a save failure instead of a success message', async () => {
    mockServer({
      onPost: () => ({ ok: false, status: 400, json: async () => ({
        success: false, message: 'A report called "Dupe" already exists.',
      }) }) as Response,
    });
    const user = userEvent.setup();
    render(<CustomReportBuilder />);
    await screen.findByLabelText('Report on');

    await user.type(screen.getByLabelText(/Name/), 'Dupe');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));

    expect(await screen.findByText(/already exists/)).toBeInTheDocument();
    expect(screen.queryByText(/Saved as/)).not.toBeInTheDocument();
  });
});
