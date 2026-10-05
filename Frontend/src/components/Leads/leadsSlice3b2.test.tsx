import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Lead } from '../../types/lead';
import { HEALTHY_SLA_RESULT } from '../../utils/leadSla';

/**
 * Leads list slice 3B-2 (Figma rows, inline bulk bar, docked panel). These pin
 * the honesty of each piece, not its pixels.
 */

vi.mock('../../contexts/LeadContext', () => ({ useLeads: () => ({ updateLead: vi.fn(async () => true) }) }));
const api = vi.hoisted(() => ({ fetchActivitiesFromAPI: vi.fn(), fetchLeadStageHistory: vi.fn() }));
vi.mock('../../utils/leadsApi', async () => ({ ...(await vi.importActual<object>('../../utils/leadsApi')), ...api }));

const docs = vi.hoisted(() => ({ loadDocuments: vi.fn(async () => ({ data: [], count: 0 })) }));
vi.mock('../../services/documentsService', () => ({ documentsService: docs }));

import LeadTableRow from './LeadTableRow';
import BulkActionBar from './BulkActionBar';
import LeadSelectedPanel from './LeadSelectedPanel';

const LEAD = {
  id: '9', first_name: 'Vikram', last_name: 'Rao', full_name: 'Vikram Rao', email: 'v@example.test',
  company: 'Kibo Telecom', position: 'CTO', status: 'attempting_contact', score: 61, source: 'Website',
  owner_id: '', tags: [], custom_fields: {}, enrichment_data: {}, created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z', created_by: '', email_opens_count: 0, email_clicks_count: 0,
  page_views_count: 0, meeting_count: 0, call_count: 0, email_sent_count: 0, ai_recommendations: [], probability: 0,
} as unknown as Lead;

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchActivitiesFromAPI.mockResolvedValue([]);
  api.fetchLeadStageHistory.mockResolvedValue([]);
});

describe('LeadTableRow (Figma "Lead row")', () => {
  const renderRow = (over = {}) => {
    const props = {
      lead: LEAD, isSelected: false, onToggleSelect: vi.fn(), onNavigate: vi.fn(), onGoTo: vi.fn(),
      onOpenModal: vi.fn(), onUpdateStatus: vi.fn(), isOverdue: false, isUntouched: false,
      slaResult: HEALTHY_SLA_RESULT, canConvert: true, canDelete: true, ...over,
    };
    render(<table><tbody><LeadTableRow {...props} /></tbody></table>);
    return props;
  };

  it('shows the stored score as "N stored" and no placeholder for features that do not exist', () => {
    renderRow();
    expect(screen.getByText('61 stored')).toBeInTheDocument();
    expect(screen.queryByText(/no ai insights/i)).toBeNull();
    expect(screen.queryByText(/no follow-up set/i)).toBeNull();
  });

  it('"Open" opens the lead; Edit goes to the editor; Assign owner and Add tag stay "coming soon"', async () => {
    const props = renderRow();
    await userEvent.click(screen.getByRole('button', { name: 'Open Vikram Rao' }));
    expect(props.onNavigate).toHaveBeenCalledWith('9');
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Vikram Rao' }));
    const menu = screen.getByRole('menu');
    const edit = within(menu).getByRole('menuitem', { name: /edit/i });
    expect(edit).toBeEnabled();
    await userEvent.click(edit);
    expect(props.onGoTo).toHaveBeenCalledWith('/crm/leads/9/edit');
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Vikram Rao' }));
    for (const item of within(screen.getByRole('menu')).getAllByRole('menuitem')) {
      if (/coming soon/i.test(item.textContent ?? '')) expect(item).toBeDisabled();
    }
    expect(props.onOpenModal).not.toHaveBeenCalledWith('editLead', expect.anything());
  });
});

describe('BulkActionBar (Figma "Bulk bar")', () => {
  const renderBar = () => {
    const props = {
      selectedIds: ['1', '2'], selectedLeads: [], totalFiltered: 38, isPageFullySelected: true, areAllFiltered: false,
      onSelectAllFiltered: vi.fn(), onClearSelection: vi.fn(), onChangeStatus: vi.fn(), onSetFollowUp: vi.fn(),
      onExport: vi.fn(), onConvert: vi.fn(), onArchive: vi.fn(), onDisqualify: vi.fn(), onOpenTerminalModal: vi.fn(),
      onDelete: vi.fn(), onToast: vi.fn(), canConvert: true, canDelete: true,
    };
    render(<BulkActionBar {...props} />);
    return props;
  };

  it('bulk conversion is "Convert unavailable", disabled — it used to promise a conversion it never made', () => {
    const props = renderBar();
    expect(screen.getByRole('button', { name: 'Convert unavailable' })).toBeDisabled();
    expect(props.onConvert).not.toHaveBeenCalled();
  });

  it('the status menu offers no Converted, Disqualified or Lost (refused, or needing a reason)', async () => {
    renderBar();
    await userEvent.click(screen.getByRole('button', { name: /set status/i }));
    const items = within(screen.getByRole('menu', { name: 'Lead status' })).getAllByRole('menuitem').map(b => b.textContent);
    expect(items).not.toContain('Converted');
    expect(items).not.toContain('Disqualified');
    expect(items).not.toContain('Lost');
    expect(items).toContain('Qualified');
  });

  it('never claims to select every filtered lead (only this page is loaded)', () => {
    renderBar();
    expect(screen.queryByText(/select all 38/i)).toBeNull();
  });

  it('Disqualify and Archive / Lost go through the reason modal', async () => {
    const props = renderBar();
    await userEvent.click(screen.getByRole('button', { name: /disqualify/i }));
    expect(props.onOpenTerminalModal).toHaveBeenCalledWith('disqualified');
    await userEvent.click(screen.getByRole('button', { name: /archive \/ lost/i }));
    expect(props.onOpenTerminalModal).toHaveBeenCalledWith('lost');
  });
});

describe('LeadSelectedPanel (Figma docked panel)', () => {
  const renderPanel = (over = {}) => {
    const props = {
      lead: LEAD, position: 18, total: 38, slaResult: HEALTHY_SLA_RESULT, isDuplicateRisk: false,
      hasPrev: true, hasNext: true, onPrev: vi.fn(), onNext: vi.fn(), onClose: vi.fn(), onOpenRecord: vi.fn(),
      onConvert: vi.fn(), onUpdateStatus: vi.fn(), onGoTo: vi.fn(), refreshKey: 0, ...over,
    };
    render(<LeadSelectedPanel {...props} />);
    return props;
  };

  it('shows its real position and the stored score without a verdict', async () => {
    renderPanel();
    expect(screen.getByText('Selected lead · 18 of 38')).toBeInTheDocument();
    expect(screen.getByText('61 · stored CRM value, not an AI score')).toBeInTheDocument();
    await waitFor(() => expect(api.fetchActivitiesFromAPI).toHaveBeenCalledWith('9'));
  });

  it('"Set Engaged" asks the page to move the lead (the server decides)', async () => {
    const props = renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Set Engaged' }));
    expect(props.onUpdateStatus).toHaveBeenCalledWith('engaged');
  });

  it('the Activity tab shows server rows; a failed load is an error, never "nothing recorded"', async () => {
    api.fetchActivitiesFromAPI.mockRejectedValue(new Error('500'));
    renderPanel();
    await userEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Activity could not load');
    expect(screen.queryByText('Nothing recorded yet')).toBeNull();
  });

  it('Files lists the lead\'s documents (Group B item 12), and Escape closes the panel', async () => {
    const props = renderPanel();
    await userEvent.click(screen.getByRole('tab', { name: 'Files' }));
    expect(await screen.findByText('No files attached yet.')).toBeInTheDocument();
    expect(docs.loadDocuments).toHaveBeenCalledWith({ entity_type: 'lead', entity_id: '9', limit: 50 });
    await userEvent.keyboard('{Escape}');
    expect(props.onClose).toHaveBeenCalled();
  });
});
