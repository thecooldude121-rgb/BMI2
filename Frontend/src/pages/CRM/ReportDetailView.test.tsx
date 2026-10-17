import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

/**
 * REPORT DETAIL BY ID — reports replay step e. Every figure comes from the run;
 * provenance is on the page; "Shared with N people" comes from the real grants;
 * an old slug address shows no sample data and sends no request; an id you may
 * not see is one honest "not found".
 */
const api = vi.hoisted(() => ({
  fetchReport: vi.fn(), runSavedReport: vi.fn(), deleteReport: vi.fn(),
  fetchGrants: vi.fn(), setGrant: vi.fn(), revokeGrant: vi.fn(), fetchRoster: vi.fn(),
  fetchTransferCandidates: vi.fn(), transferReport: vi.fn(),
}));
vi.mock('../../utils/reportsApi', async () => ({
  ...(await vi.importActual<object>('../../utils/reportsApi')),
  fetchReport: api.fetchReport, runSavedReport: api.runSavedReport, deleteReport: api.deleteReport,
  fetchGrants: api.fetchGrants, setGrant: api.setGrant, revokeGrant: api.revokeGrant,
  fetchTransferCandidates: api.fetchTransferCandidates, transferReport: api.transferReport,
}));
vi.mock('../../utils/usersApi', async () => ({
  ...(await vi.importActual<object>('../../utils/usersApi')), fetchRoster: api.fetchRoster,
}));

import ReportDetailView from './ReportDetailView';
import { ReportsApiError, type Provenance } from '../../utils/reportsApi';

const ID = '3f2b8c1e-9a4d-4c6b-8e21-5d7f0a9b1c23';
const OWNER = { can_view: true, can_edit: true, can_delete: true, can_share: true, can_transfer: false };
const VIEWER = { can_view: true, can_edit: false, can_delete: false, can_share: false, can_transfer: false };

const REPORT = {
  status: 'saved',
  id: ID, name: 'Won value by source and stage', description: 'Stored description', category: 'Sales',
  definition: { v: 1, base: 'deals', joins: ['companies'], filters: [{ field: 'deals.source', op: 'ne', value: 'x' }] },
  owner_id: 5, owner_name: 'Dee Admin', created_at: '', updated_at: '', ownerless: false, abilities: OWNER,
};

const prov = (over: Partial<Provenance> = {}): Provenance => ({
  rows_returned: 2, rows_matched: 4, rows_seeded: 3, rows_real: 1, seeded_share: 0.75, mostly_seeded: true,
  excluded_test: 1, coverage: [{ join: 'companies', label: 'Accounts', matched: 2, of: 4 }],
  truncated: false, row_limit: 1000,
  disclosure: 'Based on 4 rows — 3 of them seeded demo data, 1 real. 2 of 4 have no accounts linked and are not counted. 1 test record excluded.',
  ...over,
});

// Two dimensions then a metric: aliases dim_0, dim_1, metric_0 — not position.
const RUN = {
  columns: [
    { key: 'deals.source', label: 'Source', kind: 'dimension' },
    { key: 'deals.stage', label: 'Stage', kind: 'dimension' },
    { key: 'metric:0', label: 'Sum of Value', kind: 'metric' },
  ],
  rows: [
    { dim_0: 'referral', dim_1: 'won', metric_0: '300' },
    { dim_0: 'web', dim_1: 'open', metric_0: '700' },
  ],
  provenance: prov(), ms: 12,
};

let path = '';
const Where = () => { path = useLocation().pathname; return null; };
const show = (url = `/crm/reports/${ID}`) => render(
  <MemoryRouter initialEntries={[url]}>
    <Routes>
      <Route path="/crm/reports/:reportId" element={<><ReportDetailView /><Where /></>} />
      <Route path="/crm/reports" element={<><p>Reports list</p><Where /></>} />
      <Route path="/crm/custom-report-builder" element={<Where />} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchReport.mockResolvedValue(REPORT);
  api.runSavedReport.mockResolvedValue(RUN);
  api.fetchGrants.mockResolvedValue({ grants: [{ user_id: 7 }, { user_id: 8 }], grantLevels: ['view', 'edit'] });
});

describe('old /crm/reports/<slug> addresses', () => {
  it('show an honest out-of-date message, send NO request, and never echo the slug or any figure', async () => {
    const { container } = show('/crm/reports/quarterly-revenue-performance');
    expect(screen.getByTestId('report-outdated-address')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'This report address is out of date' })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/quarterly|revenue|performance/i);
    expect(container.textContent).not.toMatch(/₹|\$\d|Sample|GlobalCorp|Alex Rodriguez/);
    expect(api.fetchReport).not.toHaveBeenCalled();
    expect(api.runSavedReport).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Go to Reports' }));
    expect(path).toBe('/crm/reports');
  });
});

describe('a saved report, by id', () => {
  it('heads the page with the STORED name and renders the run under the right columns', async () => {
    show();
    expect(await screen.findByRole('heading', { level: 1, name: 'Won value by source and stage' })).toBeInTheDocument();
    const table = await screen.findByTestId('report-results');
    const rows = within(table).getAllByRole('row');
    expect(within(rows[0]).getAllByRole('columnheader').map(h => h.textContent)).toEqual(['Source', 'Stage', 'Sum of Value']);
    expect(within(rows[1]).getAllByRole('cell').map(c => c.textContent)).toEqual(['referral', 'won', '300']);
    expect(within(rows[2]).getAllByRole('cell').map(c => c.textContent)).toEqual(['web', 'open', '700']);
    expect(api.runSavedReport).toHaveBeenCalledWith(ID);
  });

  it('shows the provenance ON THE PAGE: seeded vs real, test rows left out, unlinked rows, row limit', async () => {
    show();
    await screen.findByTestId('provenance');
    expect(screen.getByTestId('provenance-disclosure')).toHaveTextContent(RUN.provenance.disclosure);
    expect(screen.getByText('Most of this report is seeded demo data.')).toBeInTheDocument();
    expect(screen.getByTestId('tile-seeded')).toHaveTextContent(/3 of 4.*1 real row/);
    expect(screen.getByTestId('tile-test')).toHaveTextContent(/Test records left out\s*1/);
    expect(screen.getByTestId('tile-coverage')).toHaveTextContent('2 of 4 have no accounts linked and are not counted.');
    expect(screen.getByTestId('tile-limit')).toHaveTextContent(/Complete.*All 2 result rows are shown \(limit 1,000\)/);
    expect(screen.getByTestId('report-summary')).toHaveTextContent(/Data: Deals.*Linked: Accounts.*Grouped by Source.*Grouped by Stage.*Sum of Value.*1 filter/);
  });

  it('an unmeasurable seeded share reads "Not recorded" — never 0', async () => {
    api.runSavedReport.mockResolvedValue({ ...RUN, provenance: prov({ rows_seeded: null, rows_real: null, seeded_share: null, mostly_seeded: false }) });
    show();
    const tile = await screen.findByTestId('tile-seeded');
    expect(tile).toHaveTextContent('Not recorded');
    expect(tile.textContent).not.toMatch(/\b0 of\b/);
  });

  it('a result cut off at the row limit says so, on the tile and under the table', async () => {
    api.runSavedReport.mockResolvedValue({ ...RUN, provenance: prov({ truncated: true, row_limit: 2 }) });
    show();
    expect(await screen.findByTestId('tile-limit')).toHaveTextContent(/Cut off.*first 2 rows\. There are more/);
    expect(screen.getByText('First 2 rows · there are more')).toBeInTheDocument();
  });

  it('"Shared with N people" comes from the real grants', async () => {
    show();
    expect(await screen.findByTestId('report-shared-with')).toHaveTextContent('Shared with 2 people');
    expect(api.fetchGrants).toHaveBeenCalledWith(ID);
  });

  it('no grants reads "Not shared"; a FAILED grants load never does', async () => {
    api.fetchGrants.mockResolvedValueOnce({ grants: [], grantLevels: [] });
    const { unmount } = show();
    expect(await screen.findByText('Not shared')).toBeInTheDocument();
    unmount();
    api.fetchGrants.mockRejectedValueOnce(new Error('boom'));
    show();
    expect(await screen.findByText("Couldn't load who it's shared with")).toBeInTheDocument();
    expect(screen.queryByText('Not shared')).toBeNull();
  });
});

describe('not found', () => {
  it('a 404 (absent, or not shared with you) is ONE honest message, and nothing is run', async () => {
    api.fetchReport.mockRejectedValue(new ReportsApiError('Report not found', 404));
    show();
    expect(await screen.findByTestId('report-not-found')).toHaveTextContent("This report doesn't exist, or it isn't shared with you");
    expect(screen.queryByText(/forbidden|permission denied|403/i)).toBeNull();
    expect(api.runSavedReport).not.toHaveBeenCalled();
    expect(api.fetchGrants).not.toHaveBeenCalled();
  });
});

describe('controls follow the served abilities', () => {
  it('a view-only grantee gets no Share, Edit or Delete at all', async () => {
    api.fetchReport.mockResolvedValue({ ...REPORT, abilities: VIEWER });
    show();
    await screen.findByTestId('report-results');
    for (const name of [/^Share$/, /Edit/, /Delete/]) expect(screen.queryByRole('button', { name })).toBeNull();
    expect(screen.getByRole('button', { name: /Export · Coming soon/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Schedule · Coming soon/ })).toBeDisabled();
  });

  it('the owner gets Share, Delete, and Edit — which opens this report in the builder (step f)', async () => {
    show();
    await screen.findByTestId('report-results');
    expect(screen.getByRole('button', { name: /^Share$/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /^Delete$/ })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: /^Edit$/ }));
    expect(path).toBe('/crm/custom-report-builder');
  });

  it('a DRAFT says so: only you can see it and it cannot be shared yet (no Share control)', async () => {
    api.fetchReport.mockResolvedValue({ ...REPORT, status: 'draft', abilities: { ...OWNER, can_share: false } });
    show();
    await screen.findByTestId('report-results');
    expect(screen.getByText('This is a draft')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 }).previousElementSibling?.textContent ?? '').toMatch(/Draft/);
    expect(screen.queryByRole('button', { name: /^Share$/ })).toBeNull();
  });
});

describe('run failures', () => {
  it('a re-run that fails CLEARS the previous table rather than leaving old figures under the error', async () => {
    show();
    await screen.findByTestId('report-results');
    api.runSavedReport.mockRejectedValueOnce(new ReportsApiError('Reports are not available right now.', 503));
    await userEvent.click(screen.getByRole('button', { name: /Re-run/ }));
    expect(await screen.findByTestId('report-error-unavailable')).toHaveTextContent('Nothing was run');
    expect(screen.queryByTestId('report-results')).toBeNull();
    expect(screen.queryByTestId('provenance')).toBeNull();
  });

  it('a stale definition (409) says it can no longer run', async () => {
    api.runSavedReport.mockRejectedValue(new ReportsApiError('This saved report can no longer run: Unknown field', 409));
    show();
    expect(await screen.findByTestId('report-error-stale')).toHaveTextContent('This report can no longer run');
  });
});

describe('delete', () => {
  it('navigates away only after the server confirmed it; a refusal keeps the dialog with the reason', async () => {
    api.deleteReport.mockRejectedValueOnce(new ReportsApiError('Report not found', 404));
    show();
    await screen.findByTestId('report-results');
    await userEvent.click(screen.getByRole('button', { name: /^Delete$/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete report' }));
    expect(await screen.findByText('The report was not deleted')).toBeInTheDocument();
    expect(path).toBe(`/crm/reports/${ID}`);

    api.deleteReport.mockResolvedValueOnce(undefined);
    await userEvent.click(screen.getByRole('button', { name: 'Delete report' }));
    await waitFor(() => expect(path).toBe('/crm/reports'));
    expect(api.deleteReport).toHaveBeenCalledWith(ID);
  });
});

describe('share dialog', () => {
  it('offers only ACTIVE members who are not the owner, and the count follows the saved grants', async () => {
    api.fetchRoster.mockResolvedValue({ members: [
      { id: '5', name: 'Dee Admin', email: 'dee@x.test', isActive: true },
      { id: '7', name: 'Ann Viewer', email: 'ann@x.test', isActive: true },
      { id: '9', name: 'Bo New', email: 'bo@x.test', isActive: true },
      { id: '11', name: 'Gone Person', email: 'gone@x.test', isActive: false },
    ] });
    api.fetchGrants.mockResolvedValue({ grants: [{ user_id: 7, level: 'view', name: 'Ann Viewer', email: 'ann@x.test', created_at: '' }], grantLevels: ['view', 'edit'] });
    show();
    expect(await screen.findByTestId('report-shared-with')).toHaveTextContent('Shared with 1 person');
    await userEvent.click(screen.getByRole('button', { name: /^Share$/ }));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText('Bo New');
    expect(within(dialog).queryByText('Gone Person')).toBeNull();
    expect(within(dialog).queryByText('Dee Admin')).toBeNull();
    expect(dialog).toHaveTextContent('Nobody is emailed');

    api.setGrant.mockResolvedValue(undefined);
    api.fetchGrants.mockResolvedValue({ grants: [
      { user_id: 7, level: 'view', name: 'Ann Viewer', email: 'ann@x.test', created_at: '' },
      { user_id: 9, level: 'view', name: 'Bo New', email: 'bo@x.test', created_at: '' },
    ], grantLevels: ['view', 'edit'] });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Give view access' }));
    expect(api.setGrant).toHaveBeenCalledWith(ID, 9, 'view');
    await userEvent.click(within(dialog).getByRole('button', { name: /close/i }));
    expect(await screen.findByTestId('report-shared-with')).toHaveTextContent('Shared with 2 people');
  });
});

describe('admin transfer of an ownerless report', () => {
  const ADMIN_ON_OWNERLESS = { can_view: true, can_edit: false, can_delete: true, can_share: false, can_transfer: true };
  const OWNERLESS = { ...REPORT, ownerless: true, owner_name: 'Olu Former', abilities: ADMIN_ON_OWNERLESS };
  const RECORD = {
    from_user_id: 4, from_user_name: 'Olu Former', to_user_id: 9, to_user_name: 'Bo New',
    transferred_by: 5, transferred_by_name: 'Dee Admin', transferred_at: '2026-10-17T10:00:00Z',
  };
  beforeEach(() => {
    api.fetchReport.mockResolvedValue(OWNERLESS);
    api.fetchTransferCandidates.mockResolvedValue([
      { id: 5, name: 'Dee Admin', email: 'dee@x.test' },
      { id: 9, name: 'Bo New', email: 'bo@x.test' },
    ]);
  });

  it('an admin sees Transfer next to Delete only when the server says can_transfer', async () => {
    show();
    expect(await screen.findByText('Owner Olu Former is deactivated')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button').map(b => b.textContent?.trim());
    expect(buttons.indexOf('Transfer') + 1).toBe(buttons.indexOf('Delete'));
    expect(screen.queryByRole('button', { name: /^Share$/ })).toBeNull();
  });

  it('no Transfer for anyone else (can_transfer false)', async () => {
    api.fetchReport.mockResolvedValue({ ...REPORT, abilities: OWNER });
    show();
    await screen.findByTestId('report-results');
    expect(screen.queryByRole('button', { name: 'Transfer' })).toBeNull();
  });

  it("picks from step c's candidates (not the roster), and reports success only after the server recorded it", async () => {
    let finish: (v: unknown) => void = () => {};
    api.transferReport.mockReturnValue(new Promise(r => { finish = r; }));
    show();
    await userEvent.click(await screen.findByRole('button', { name: 'Transfer' }));
    const dialog = await screen.findByRole('dialog');
    const select = await within(dialog).findByRole('combobox');
    expect(within(select).getAllByRole('option').map(o => o.textContent)).toEqual(
      ['Choose an active member…', 'Dee Admin · dee@x.test', 'Bo New · bo@x.test']);
    expect(api.fetchTransferCandidates).toHaveBeenCalledWith(ID);
    expect(api.fetchRoster).not.toHaveBeenCalled();
    expect(within(dialog).getByRole('button', { name: 'Transfer' })).toBeDisabled();
    await userEvent.selectOptions(select, '9');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Transfer' }));
    expect(api.transferReport).toHaveBeenCalledWith(ID, 9);
    expect(screen.queryByTestId('report-transferred')).toBeNull();     // not before the 2xx
    finish({ report: { ...REPORT, abilities: { ...VIEWER, can_view: false } }, transfer: RECORD });
    const done = await screen.findByTestId('report-transferred');
    expect(done).toHaveTextContent('Transferred to Bo New');
    expect(done).toHaveTextContent(/moved by Dee Admin from Olu Former/);
  });

  it('a refusal keeps the dialog open with the reason, and nothing claims success', async () => {
    api.transferReport.mockRejectedValue(new ReportsApiError('to_user_id does not name an active member of this workspace', 400));
    show();
    await userEvent.click(await screen.findByRole('button', { name: 'Transfer' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.selectOptions(await within(dialog).findByRole('combobox'), '9');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Transfer' }));
    expect(await within(dialog).findByText('The report was not transferred')).toBeInTheDocument();
    expect(dialog).toHaveTextContent('does not name an active member');
    expect(screen.queryByTestId('report-transferred')).toBeNull();
  });

  it('an ownerless DRAFT: the notice speaks to the admin, and a transfer says it stays a draft', async () => {
    api.fetchReport.mockResolvedValue({ ...OWNERLESS, status: 'draft' });
    api.transferReport.mockResolvedValue({ report: { ...REPORT, status: 'draft', abilities: { ...VIEWER, can_view: false } }, transfer: RECORD });
    show();
    expect(await screen.findByText(/Its owner is no longer active, so as an admin you can view, delete or transfer it/)).toBeInTheDocument();
    expect(screen.queryByText(/Only you can see it/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Transfer' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.selectOptions(await within(dialog).findByRole('combobox'), '9');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Transfer' }));
    expect(await screen.findByTestId('report-transferred')).toHaveTextContent('It is still a draft, private to them until they save it');
  });

  it('transferring to yourself keeps you on the report, now with owner controls', async () => {
    api.transferReport.mockResolvedValue({ report: { ...REPORT, abilities: OWNER }, transfer: { ...RECORD, to_user_id: 5, to_user_name: 'Dee Admin' } });
    show();
    await userEvent.click(await screen.findByRole('button', { name: 'Transfer' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.selectOptions(await within(dialog).findByRole('combobox'), '5');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Transfer' }));
    expect(await screen.findByRole('button', { name: /^Share$/ })).toBeEnabled();
    expect(screen.queryByTestId('report-transferred')).toBeNull();
    expect(screen.getByText('Owner: Dee Admin')).toBeInTheDocument();
  });
});
