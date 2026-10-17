import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

/**
 * THE REPORT BUILDER — reports replay step f. Everything it offers is served;
 * the preview is a real run with provenance; "Save draft" / "Save" persist
 * through the API and confirm only after the 2xx; a draft is a real state (072).
 */
const api = vi.hoisted(() => ({
  fetchRegistry: vi.fn(), fetchReport: vi.fn(), createReport: vi.fn(), updateReport: vi.fn(), runDefinition: vi.fn(),
}));
vi.mock('../../utils/reportsApi', async () => ({
  ...(await vi.importActual<object>('../../utils/reportsApi')),
  fetchRegistry: api.fetchRegistry, fetchReport: api.fetchReport, createReport: api.createReport,
  updateReport: api.updateReport, runDefinition: api.runDefinition,
}));

import CustomReportBuilder from './CustomReportBuilder';
import { ReportsApiError } from '../../utils/reportsApi';

const ID = '3f2b8c1e-9a4d-4c6b-8e21-5d7f0a9b1c23';
const REGISTRY = {
  reports: [],
  modules: [
    { key: 'deals', label: 'Deals', joins: ['companies'] },
    { key: 'companies', label: 'Accounts', joins: [] },
  ],
  fields: [
    { key: 'deals.source', label: 'Source', type: 'enum', module: 'deals', aggregatable: false },
    { key: 'deals.name', label: 'Deal name', type: 'string', module: 'deals', aggregatable: false },
    { key: 'deals.value', label: 'Value', type: 'number', module: 'deals', aggregatable: true },
    { key: 'companies.industry', label: 'Industry', type: 'enum', module: 'companies', aggregatable: false },
  ],
  aggregations: [{ id: 'count', needs_field: false }, { id: 'sum', needs_field: true }],
  operators: [
    { id: 'eq', arity: 1, applies_to: null }, { id: 'contains', arity: 1, applies_to: ['string'] },
    { id: 'between', arity: 2, applies_to: null }, { id: 'is_null', arity: 0, applies_to: null },
  ],
};
const OWNER = { can_view: true, can_edit: true, can_delete: true, can_share: true, can_transfer: false };
const saved = (over: Record<string, unknown> = {}) => ({
  id: ID, name: 'Pipeline by source', description: null, category: null, owner_id: 5, owner_name: 'Dee',
  created_at: '', updated_at: '', ownerless: false, status: 'saved', abilities: OWNER,
  definition: { v: 1, base: 'deals', joins: [], dimensions: [{ field: 'deals.source' }], metrics: [{ agg: 'count' }], filters: [], sort: [] },
  ...over,
});
const RUN = {
  columns: [{ key: 'deals.source', label: 'Source', kind: 'dimension' }, { key: 'metric:0', label: 'Count of rows', kind: 'metric' }],
  rows: [{ dim_0: 'referral', metric_0: '2' }],
  provenance: {
    rows_returned: 1, rows_matched: 2, rows_seeded: 0, rows_real: 2, seeded_share: 0, mostly_seeded: false,
    excluded_test: 0, coverage: [], truncated: false, row_limit: 5000, disclosure: 'Based on 2 rows, none of it seeded demo data.',
  },
  ms: 4,
};

let where = '';
const Where = () => { const l = useLocation(); where = l.pathname + l.search; return null; };
const show = (url = '/crm/custom-report-builder') => render(
  <MemoryRouter initialEntries={[url]}>
    <Routes>
      <Route path="/crm/custom-report-builder" element={<><CustomReportBuilder /><Where /></>} />
      <Route path="*" element={<Where />} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchRegistry.mockResolvedValue(REGISTRY);
  api.runDefinition.mockResolvedValue(RUN);
});

describe('what the builder offers is served', () => {
  it('data sources are exactly the served modules — no Revenue, no HRMS', async () => {
    const { container } = show();
    const group = await screen.findByRole('group', { name: 'Data source' });
    expect(within(group).getAllByRole('button').map(b => b.textContent)).toEqual(['Deals', 'Accounts']);
    expect(container.textContent).not.toMatch(/HRMS|Deal Health/);
  });

  it('a registry that fails to load offers nothing, and says so', async () => {
    api.fetchRegistry.mockRejectedValue(new Error('Request failed (500)'));
    show();
    expect(await screen.findByTestId('builder-load-error')).toHaveTextContent('Nothing is offered rather than a guessed list');
    expect(screen.queryByRole('group', { name: 'Data source' })).toBeNull();
  });

  it('a 200 that omits the modules offers no data source rather than a local fallback', async () => {
    api.fetchRegistry.mockResolvedValue({ ...REGISTRY, modules: [] });
    show();
    expect(await screen.findByTestId('builder-no-modules')).toHaveTextContent('There is nothing to report on');
    expect(screen.queryByRole('button', { name: 'Deals' })).toBeNull();
  });

  it('operators follow the field type ("contains" only on text) and their arity sets the value inputs', async () => {
    show();
    await screen.findByRole('group', { name: 'Data source' });
    await userEvent.click(screen.getByRole('button', { name: /Add filter/ }));
    const opSel = screen.getByRole('combobox', { name: 'Filter 1 operator' });
    expect(within(opSel).getAllByRole('option').map(o => o.textContent)).toEqual(['is', 'is between', 'is empty']);   // Source is enum
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filter 1 field' }), 'deals.name');
    expect(within(screen.getByRole('combobox', { name: 'Filter 1 operator' })).getAllByRole('option').map(o => o.textContent)).toContain('contains');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filter 1 operator' }), 'is_null');
    expect(screen.queryByRole('textbox', { name: 'Filter 1 value' })).toBeNull();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filter 1 operator' }), 'between');
    expect(screen.getByRole('textbox', { name: 'Filter 1 value' })).toHaveAttribute('placeholder', 'from, to');
  });

  it('what the frame draws but is not built is disabled "Coming soon"', async () => {
    show();
    await screen.findByRole('group', { name: 'Data source' });
    expect(screen.getByRole('button', { name: /Chart \+ table · Coming soon/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Matrix · Coming soon/ })).toBeDisabled();
    expect(screen.getByText(/Custom formulas are not built yet/)).toBeInTheDocument();
    expect(screen.getByText(/Scheduled delivery/).closest('p')).toHaveTextContent(/Scheduled delivery is not built yet/);
  });
});

describe('controls', () => {
  it('remove buttons show their icon (an icon-only button draws it from leadingIcon)', async () => {
    show();
    await screen.findByRole('group', { name: 'Data source' });
    await userEvent.click(screen.getByRole('button', { name: /Add filter/ }));
    await userEvent.click(screen.getByRole('button', { name: /Add breakdown/ }));
    for (const name of ['Remove filter 1', 'Remove breakdown 1']) {
      expect(screen.getByRole('button', { name }).querySelector('svg')).not.toBeNull();
    }
  });
});

describe('discard changes', () => {
  it('is offered only once something has changed', async () => {
    show();
    await screen.findByRole('group', { name: 'Data source' });
    expect(screen.queryByRole('heading', { name: 'Discard changes?' })).toBeNull();
    await userEvent.type(screen.getByLabelText('Report name *'), 'x');
    expect(screen.getByRole('heading', { name: 'Discard changes?' })).toBeInTheDocument();
  });
});

describe('preview', () => {
  it('runs the CURRENT definition and shows provenance; an edit clears the preview', async () => {
    show();
    await screen.findByRole('group', { name: 'Data source' });
    await userEvent.click(screen.getByRole('button', { name: /Add breakdown/ }));
    await userEvent.click(screen.getByRole('button', { name: /Run preview/ }));
    expect(api.runDefinition).toHaveBeenCalledWith(expect.objectContaining({ base: 'deals', dimensions: [{ field: 'deals.source' }] }));
    expect(await screen.findByTestId('provenance-disclosure')).toHaveTextContent('Based on 2 rows, none of it seeded demo data.');
    expect(screen.getByTestId('preview-results')).toHaveTextContent('referral');
    await userEvent.click(screen.getByRole('button', { name: /Add measure/ }));
    expect(screen.queryByTestId('preview-results')).toBeNull();
  });

  it('a refused preview shows the server reason, never sample rows', async () => {
    api.runDefinition.mockRejectedValue(new ReportsApiError('Unknown field "deals.gone"', 400));
    show();
    await screen.findByRole('group', { name: 'Data source' });
    await userEvent.click(screen.getByRole('button', { name: /Run preview/ }));
    expect(await screen.findByText('Unknown field "deals.gone"')).toBeInTheDocument();
    expect(screen.queryByTestId('preview-results')).toBeNull();
  });
});

describe('saving, and drafts', () => {
  it('a name is required before anything can be saved', async () => {
    show();
    await screen.findByRole('group', { name: 'Data source' });
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByTestId('builder-validation')).toHaveTextContent('Required');
  });

  it('"Save draft" stores a DRAFT and says "Saved as draft" only after the 2xx', async () => {
    let finish: (v: unknown) => void = () => {};
    api.createReport.mockReturnValue(new Promise(r => { finish = r; }));
    show();
    await screen.findByRole('group', { name: 'Data source' });
    await userEvent.type(screen.getByLabelText('Report name *'), 'Pipeline by source');
    await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(api.createReport).toHaveBeenCalledWith(expect.objectContaining({ name: 'Pipeline by source', status: 'draft' }));
    expect(screen.queryByText('Saved as draft')).toBeNull();
    finish(saved({ status: 'draft' }));
    expect(await screen.findByText('Saved as draft')).toBeInTheDocument();
    expect(screen.getByTestId('save-result')).toHaveTextContent('Only you can see it');
    await waitFor(() => expect(where).toBe(`/crm/custom-report-builder?id=${ID}`));
  });

  it('"Save" stores a saved report and says "Saved"', async () => {
    api.createReport.mockResolvedValue(saved());
    show();
    await screen.findByRole('group', { name: 'Data source' });
    await userEvent.type(screen.getByLabelText('Report name *'), 'Pipeline by source');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(api.createReport).toHaveBeenCalledWith(expect.objectContaining({ status: 'saved' }));
    expect(await screen.findByTestId('save-result')).toHaveTextContent(/^Saved/);
    expect(screen.getByTestId('save-result')).not.toHaveTextContent('Saved as draft');
  });

  it('a refused save keeps the input and shows the server reason', async () => {
    api.createReport.mockRejectedValue(new ReportsApiError('A report with that name already exists in this workspace', 409));
    show();
    await screen.findByRole('group', { name: 'Data source' });
    await userEvent.type(screen.getByLabelText('Report name *'), 'Taken');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Not saved')).toBeInTheDocument();
    expect(screen.getByTestId('save-result')).toHaveTextContent('already exists');
    expect(screen.getByLabelText('Report name *')).toHaveValue('Taken');
    expect(where).toBe('/crm/custom-report-builder');
  });

  it('editing a SAVED report: no "Save draft" (it cannot go back); Save updates it', async () => {
    api.fetchReport.mockResolvedValue(saved());
    api.updateReport.mockResolvedValue(saved({ name: 'Renamed' }));
    show(`/crm/custom-report-builder?id=${ID}`);
    expect(await screen.findByLabelText('Report name *')).toHaveValue('Pipeline by source');
    expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
    await userEvent.clear(screen.getByLabelText('Report name *'));
    await userEvent.type(screen.getByLabelText('Report name *'), 'Renamed');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(api.updateReport).toHaveBeenCalledWith(ID, expect.objectContaining({ name: 'Renamed', status: 'saved' }));
  });

  it('editing a DRAFT: "Save draft" keeps it a draft, "Save report" makes it a saved report', async () => {
    api.fetchReport.mockResolvedValue(saved({ status: 'draft' }));
    api.updateReport.mockResolvedValue(saved({ status: 'saved' }));
    show(`/crm/custom-report-builder?id=${ID}`);
    expect(await screen.findByText(/Only you can see this report until you save it/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Save report' }));
    expect(api.updateReport).toHaveBeenCalledWith(ID, expect.objectContaining({ status: 'saved' }));
    expect(await screen.findByTestId('save-result')).toHaveTextContent(/^Saved/);
  });

  it('someone who may only view a report gets no editor', async () => {
    api.fetchReport.mockResolvedValue(saved({ abilities: { ...OWNER, can_edit: false, can_delete: false, can_share: false } }));
    show(`/crm/custom-report-builder?id=${ID}`);
    expect(await screen.findByTestId('builder-view-only')).toHaveTextContent('You can view this report but not edit it');
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('an id you cannot see is one honest "not found"', async () => {
    api.fetchReport.mockRejectedValue(new ReportsApiError('Report not found', 404));
    show(`/crm/custom-report-builder?id=${ID}`);
    expect(await screen.findByTestId('builder-not-found')).toHaveTextContent("doesn't exist, or it isn't shared with you");
  });
});
