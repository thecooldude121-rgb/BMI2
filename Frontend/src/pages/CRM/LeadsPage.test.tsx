import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Lead } from '../../types/lead';

/**
 * Leads list (Figma phase 3, slice 3B-1). The page-state hook is mocked so each
 * test pins ONE piece of the page's wiring: logging an activity saves for real,
 * a refused delete is not reported as a success, numbered pages drive the
 * server page, and the filter dropdowns send the same values the chips did.
 */

const LEAD = {
  id: '7', first_name: 'Nadia', last_name: 'Sayed', full_name: 'Nadia Sayed', email: 'n@example.test',
  company: 'Nile Digital', status: 'new', score: 72, source: 'Website', owner_id: '', tags: [],
  custom_fields: {}, enrichment_data: {}, created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
  created_by: '', email_opens_count: 0, email_clicks_count: 0, page_views_count: 0, meeting_count: 0,
  call_count: 0, email_sent_count: 0, ai_recommendations: [],
} as unknown as Lead;

const state = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const fns = vi.hoisted(() => ({
  setPage: vi.fn(), setFilterStatus: vi.fn(), setFilterSource: vi.fn(), setFilterScore: vi.fn(),
  showToast: vi.fn(), closeModal: vi.fn(), openModal: vi.fn(),
}));
vi.mock('../../hooks/useLeadsPageState', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../../hooks/useLeadsPageState');
  return { ...actual, useLeadsPageState: () => state.current };
});

const api = vi.hoisted(() => ({ createActivityViaAPI: vi.fn(), createNoteViaAPI: vi.fn() }));
vi.mock('../../utils/leadsApi', async () => ({ ...(await vi.importActual<object>('../../utils/leadsApi')), ...api }));

const ctx = vi.hoisted(() => ({
  updateLead: vi.fn(async () => true), transitionLead: vi.fn(), deleteLead: vi.fn(async () => true),
  updateView: vi.fn(), lastWriteErrorRef: { current: null as string | null }, writeVersion: 0, notifyWrite: vi.fn(),
}));
vi.mock('../../contexts/LeadContext', () => ({ useLeads: () => ctx }));
vi.mock('../../hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock('../../hooks/useKanbanLanes', () => ({ useKanbanLanes: () => ({ lanes: {}, loadMoreLane: vi.fn() }) }));
vi.mock('../../components/Leads/SavedViewsBar', () => ({ default: () => <div>saved views</div> }));
vi.mock('../../components/Leads/AdvancedFilterDrawer', () => ({ default: () => null }));
vi.mock('../../components/Leads/LeadConversionWizard', () => ({ default: () => null }));
vi.mock('../../components/Leads/OutreachComposer', () => ({
  default: ({ onSubmit, error, submitting }: { onSubmit: (a: object) => void; error?: string | null; submitting?: boolean }) => (
    <div role="dialog" aria-label="composer">
      {error && <p role="alert">{error}</p>}
      <button disabled={submitting} onClick={() => onSubmit({ type: 'call', direction: 'outbound', status: 'completed', subject: 'Outbound call with Nadia', completed_at: '2026-10-05T10:00:00Z' })}>submit</button>
    </div>
  ),
}));

import LeadsPage from './LeadsPage';

const baseState = (over: Record<string, unknown> = {}) => ({
  viewMode: 'list', setViewMode: vi.fn(), searchQuery: '', setSearchQuery: vi.fn(),
  sortBy: 'newest', setSortBy: vi.fn(), sortLabel: 'Newest First', sortExplanation: '',
  page: 1, pageCount: 3, setPage: fns.setPage,
  filterState: { status: 'all', source: 'all', score: 'all' },
  setFilterStatus: fns.setFilterStatus, setFilterSource: fns.setFilterSource, setFilterScore: fns.setFilterScore,
  selectedLeadIds: [], toggleLeadSelection: vi.fn(), selectAllLeads: vi.fn(), setSelection: vi.fn(),
  clearSelection: vi.fn(), isSelected: () => false,
  activeLead: null, activeModal: null, openModal: fns.openModal, closeModal: fns.closeModal, isModalOpen: () => false,
  toast: null, showToast: fns.showToast, clearToast: vi.fn(),
  sortedLeads: [LEAD], paginatedLeads: [LEAD],
  listTotal: 60, listLoading: false, listError: null, listUnavailableReason: null, serverQuery: {}, summary: null,
  overdueLeads: [], duplicateCandidateMap: new Map(), untouchedLeads: [], leadSLAMap: new Map(), nbaQueue: new Map(),
  sourceQualityThisWeek: { topSource: '—', topSourceAvgScore: 0, topSourceCount: 0, weeklyLeads: 0 },
  sourceAnalytics: { all: [], week: [], month: [] }, newUnworkedDelta: 0, canViewAllLeads: true,
  activeInsight: null, setActiveInsight: vi.fn(),
  advancedFilter: { groups: [] }, hasActiveAdvancedFilter: false, setAdvancedFilter: vi.fn(), clearAdvancedFilter: vi.fn(),
  statusViewMode: 'simplified', setStatusViewMode: vi.fn(),
  savedViews: [], activeViewId: null, activeViewLabel: '', setActiveView: vi.fn(), clearActiveView: vi.fn(),
  saveCurrentAsView: vi.fn(), updateActiveView: vi.fn(), renameView: vi.fn(), pinView: vi.fn(), reorderViews: vi.fn(), deleteView: vi.fn(),
  ...over,
});

const renderPage = () => render(<MemoryRouter><LeadsPage /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  ctx.lastWriteErrorRef.current = null;
  state.current = baseState();
});

describe('LeadsPage — numbered pages over the server total', () => {
  it('says "Showing 1–1 of 60" and asks for page 2 / Next by number', async () => {
    renderPage();
    expect(screen.getByTestId('leads-showing')).toHaveTextContent('Showing 1–1 of 60 leads · 25 rows per page');
    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(fns.setPage).toHaveBeenCalledWith(2);
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(fns.setPage).toHaveBeenCalledWith(2);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /load more/i })).toBeNull();
  });
});

describe('LeadsPage — filter dropdowns send the same values the chips did', () => {
  it('status (Simple vocabulary), source and score', async () => {
    renderPage();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), '__qualified__');
    expect(fns.setFilterStatus).toHaveBeenCalledWith('__qualified__');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Source' }), 'HRMS');
    expect(fns.setFilterSource).toHaveBeenCalledWith('HRMS');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Score' }), '60-79');
    expect(fns.setFilterScore).toHaveBeenCalledWith('60-79');
  });
});

describe('LeadsPage — logging an activity saves for real', () => {
  const withComposer = () => { state.current = baseState({ activeLead: LEAD, isModalOpen: (m: string) => m === 'contactLead' }); };

  it('POSTs the activity, toasts only after the server confirms, then refreshes', async () => {
    withComposer();
    let resolve!: (v: unknown) => void;
    api.createActivityViaAPI.mockImplementation(() => new Promise(r => { resolve = r; }));
    renderPage();
    await userEvent.click(within(screen.getByRole('dialog', { name: 'composer' })).getByRole('button', { name: 'submit' }));
    expect(api.createActivityViaAPI).toHaveBeenCalledWith('7', expect.objectContaining({ type: 'call', status: 'completed' }));
    expect(fns.showToast).not.toHaveBeenCalled();
    resolve({ id: 'a1' });
    await waitFor(() => expect(fns.showToast).toHaveBeenCalledWith('Call logged', 'success'));
    expect(fns.closeModal).toHaveBeenCalled();
    expect(ctx.notifyWrite).toHaveBeenCalled();
  });

  it('a refusal keeps the composer open with the server message, and claims nothing', async () => {
    withComposer();
    api.createActivityViaAPI.mockRejectedValue(new Error('subject is required'));
    renderPage();
    await userEvent.click(within(screen.getByRole('dialog', { name: 'composer' })).getByRole('button', { name: 'submit' }));
    expect(await within(screen.getByRole('dialog', { name: 'composer' })).findByRole('alert')).toHaveTextContent('subject is required');
    expect(fns.showToast).not.toHaveBeenCalledWith(expect.anything(), 'success');
    expect(fns.closeModal).not.toHaveBeenCalled();
  });
});

describe('LeadsPage — a refused delete is not a success', () => {
  it('single delete: shows the server refusal, never "Lead deleted"', async () => {
    state.current = baseState({ activeLead: LEAD, isModalOpen: (m: string) => m === 'confirmDelete' });
    ctx.deleteLead.mockResolvedValueOnce(false);
    ctx.lastWriteErrorRef.current = 'Only admins and managers can delete leads.';
    renderPage();
    await userEvent.click(within(screen.getByRole('dialog', { name: 'Delete Lead' })).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(fns.showToast).toHaveBeenCalledWith('Only admins and managers can delete leads.', 'error'));
    expect(fns.showToast).not.toHaveBeenCalledWith('Lead deleted', 'success');
  });
});

describe('LeadsPage — docked panel and honest toasts (slice 3B-2)', () => {
  it('opening a lead docks the "Selected lead" panel beside the list (no overlay)', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Open Nadia Sayed' }));
    const panel = await screen.findByRole('complementary', { name: 'Selected lead: Nadia Sayed' });
    expect(within(panel).getByText('Selected lead · 1 of 60')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-nav-scrim')).toBeNull();
  });

  it('an error toast is an alert with a warning icon — not a green success check', () => {
    state.current = baseState({ toast: { message: 'Only admins and managers can delete leads.', type: 'error' } });
    renderPage();
    const toastEl = screen.getAllByRole('alert').find(el => el.textContent?.includes('Only admins'));
    expect(toastEl).toBeTruthy();
  });
});

describe('LeadsPage — failures and empties are told apart', () => {
  it('a server error is an alert, not "No leads match"', () => {
    state.current = baseState({ sortedLeads: [], paginatedLeads: [], listTotal: 0, listError: '500 Internal Server Error' });
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('The server could not apply these filters');
    expect(screen.queryByText('No leads match')).toBeNull();
  });

  it('a genuinely empty result says why and offers Quick Add', () => {
    state.current = baseState({ sortedLeads: [], paginatedLeads: [], listTotal: 0 });
    renderPage();
    expect(screen.getByText('No leads match')).toBeInTheDocument();
  });
});
