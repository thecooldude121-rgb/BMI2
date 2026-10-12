import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Group A item 4, slice 5a — every /crm/dashboard figure is a server figure.
 * It counted the 500 newest rows of each table in the browser, picked Top Deals
 * from them, and looked for meetings inside the 20 newest activities.
 */
const api = vi.hoisted(() => ({
  fetchDealsSummary: vi.fn(), fetchDealsPage: vi.fn(), fetchContactsPage: vi.fn(),
  fetchAccountsSummary: vi.fn(), fetchActivitiesPage: vi.fn(), fetchMeetingsInWindow: vi.fn(),
}));
vi.mock('../../utils/dealsApi', async () => ({ ...(await vi.importActual<object>('../../utils/dealsApi')), fetchDealsSummary: api.fetchDealsSummary, fetchDealsPage: api.fetchDealsPage }));
vi.mock('../../utils/contactsApi', async () => ({ ...(await vi.importActual<object>('../../utils/contactsApi')), fetchContactsPage: api.fetchContactsPage }));
vi.mock('../../utils/accountsApi', async () => ({ ...(await vi.importActual<object>('../../utils/accountsApi')), fetchAccountsSummary: api.fetchAccountsSummary }));
vi.mock('../../utils/activitiesApi', async () => ({ ...(await vi.importActual<object>('../../utils/activitiesApi')), fetchActivitiesPage: api.fetchActivitiesPage }));
vi.mock('../../utils/meetingsApi', async () => ({ ...(await vi.importActual<object>('../../utils/meetingsApi')), fetchMeetingsInWindow: api.fetchMeetingsInWindow }));
vi.mock('../../components/Dashboard/SalesIntelligenceGuide', () => ({ default: () => null }));
vi.mock('../../components/CRM/CRMNavigation', () => ({ default: () => null }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 5, name: 'Dee Admin', role: 'admin' } }) }));

import CRMDashboard from './CRMDashboard';
import { localDay } from '../../utils/dates';

const stageRow = (pipeline_id: string, pipeline_name: string, slug: string, name: string, stage_type: string, count: number, value_usd: number, unconverted = 0) =>
  ({ pipeline_id, pipeline_name, stage_id: `${pipeline_id}-${slug}`, slug, name, position: 1, stage_type, count, value_usd, unconverted });
const SUMMARY = {
  as_of: localDay(new Date()), total: 1240, unstaged: 0,
  open: { count: 800, value_usd: 2_400_000, unconverted: 12 },
  won: { count: 300, value_usd: 900_000, unconverted: 0 },
  lost: { count: 200 },
  win_rate: { value: 0.6, won: 300, lost: 200, sample_size: 500 },
  closing_soon: { days: 7, count: 14, value_usd: 50_000, unconverted: 1 },
  by_stage: [
    stageRow('new-business', 'New business', 'proposal', 'Proposal', 'open', 600, 2_000_000, 12),
    stageRow('new-business', 'New business', 'closed-won', 'Closed Won', 'won', 250, 800_000),
    stageRow('renewals', 'Renewals', 'renewed', 'Renewed', 'won', 50, 100_000),
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchDealsSummary.mockResolvedValue(SUMMARY);
  api.fetchContactsPage.mockResolvedValue({ contacts: [], total: 1234 });
  api.fetchAccountsSummary.mockResolvedValue({ accounts: 777 });
  api.fetchDealsPage.mockResolvedValue({
    deals: [
      { id: 'D1', name: 'Kora expansion', value: '90000', currency: 'USD', base_amount_usd: '90000', stage: 'proposal', probability: 60 },
      { id: 'D2', name: 'Rupee deal', value: '125000', currency: 'INR', base_amount_usd: null, stage: 'qualified', probability: null },
    ],
    total: 800, limit: 3, offset: 0,
  });
  api.fetchActivitiesPage.mockResolvedValue({ activities: [], total: 0 });
  api.fetchMeetingsInWindow.mockResolvedValue({
    meetings: [{ id: 'MTG1', title: 'QBR with Kora', date: new Date(Date.now() + 86_400_000).toISOString() }], total: 9,
  });
});
const renderDash = () => render(<MemoryRouter><CRMDashboard /></MemoryRouter>);

describe('/crm/dashboard — server figures only', () => {
  it('tiles are the server totals (past 500), with "not in USD" stated', async () => {
    renderDash();
    expect(await screen.findByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('1,240')).toBeInTheDocument();
    expect(screen.getByText('777')).toBeInTheDocument();
    expect(screen.getByText('800 open deals · 12 not in USD')).toBeInTheDocument();
    expect(screen.getByText('14 closing in the next 7 days')).toBeInTheDocument();
    expect(api.fetchDealsSummary).toHaveBeenCalledWith(localDay(new Date()));
  });

  it('pipeline by stage is the server\'s breakdown across pipelines, in its order', async () => {
    renderDash();
    const first = await screen.findByTestId('stage-new-business-proposal');
    expect(first).toHaveTextContent('New business · Proposal');
    expect(first).toHaveTextContent('600 deals');
    expect(first).toHaveTextContent('+ 12 not in USD');
    expect(screen.getByTestId('stage-renewals-renewed')).toHaveTextContent('Renewals · Renewed');
  });

  it('win rate is won / decided, all time, with its sample', async () => {
    renderDash();
    const p = await screen.findByTestId('pipeline-summary');
    expect(p).toHaveTextContent('Win rate 60% (300 won of 500 decided, all time, all pipelines)');
  });

  it('with nothing decided the win rate is "not yet measurable", never 0%', async () => {
    api.fetchDealsSummary.mockResolvedValue({ ...SUMMARY, win_rate: { value: null, won: 0, lost: 0, sample_size: 0 } });
    renderDash();
    expect(await screen.findByTestId('pipeline-summary')).toHaveTextContent('not yet measurable');
  });

  it('Top Deals asks the server for open deals by USD value; a deal with no USD amount says so', async () => {
    renderDash();
    expect(await screen.findByText('1. Kora expansion')).toBeInTheDocument();
    expect(api.fetchDealsPage).toHaveBeenCalledWith({ stage_type: 'open', sort: 'base_amount_usd', dir: 'desc', limit: 3, offset: 0 });
    expect(screen.getByText('INR 125,000 · not in USD')).toBeInTheDocument();
  });

  it('Upcoming Meetings come from the Meetings module over the next 7 days', async () => {
    renderDash();
    expect(await screen.findByText('QBR with Kora')).toBeInTheDocument();
    const [from, to, limit] = api.fetchMeetingsInWindow.mock.calls[0];
    expect(Math.round((to.getTime() - from.getTime()) / 86_400_000)).toBe(7);
    expect(limit).toBe(3);
    expect(screen.getByText('Showing 1 of 9 meetings in the next 7 days.')).toBeInTheDocument();
  });

  it('a failed total reads "—" with the reason, never 0', async () => {
    api.fetchDealsSummary.mockRejectedValue(new Error('HTTP 500'));
    renderDash();
    const alert = await screen.findByText(/Some totals could not load — HTTP 500/);
    expect(alert).toBeInTheDocument();
    const dealsTile = screen.getByText('Deals').parentElement!;
    expect(within(dealsTile).getByText('—')).toBeInTheDocument();
    expect(screen.getByText(/The pipeline could not load/)).toBeInTheDocument();
  });
});
