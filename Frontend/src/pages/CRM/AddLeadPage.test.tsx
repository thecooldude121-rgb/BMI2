import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * H1 (2026-10-13) — Add Lead sends only what the server stores. It used to send
 * estimated_value and quick_notes (never read: the value and notes vanished),
 * collect an Address with no column, store a fabricated score of 50, offer
 * placeholder owner queues, and offer company sizes / a priority the server
 * refuses.
 */
const ctx = vi.hoisted(() => ({ createLead: vi.fn(), fetchUsers: vi.fn(), checkLeadDuplicates: vi.fn() }));
vi.mock('../../contexts/LeadContext', () => ({
  useLeads: () => ({ createLead: ctx.createLead, leads: [], lastWriteErrorRef: { current: null } }),
}));
vi.mock('../../utils/usersApi', () => ({ fetchUsers: ctx.fetchUsers }));
vi.mock('../../utils/leadsApi', async () => ({ ...(await vi.importActual<object>('../../utils/leadsApi')), checkLeadDuplicates: ctx.checkLeadDuplicates }));

import AddLeadPage from './AddLeadPage';

beforeEach(() => {
  vi.clearAllMocks();
  ctx.createLead.mockResolvedValue({ id: '1' });
  ctx.checkLeadDuplicates.mockResolvedValue([null]);
  ctx.fetchUsers.mockResolvedValue([
    { id: 7, first_name: 'Dee', last_name: 'Admin', displayName: 'Dee Admin', email: 'd@x', role: 'admin', department: null },
    { id: 9, first_name: 'Ravi', last_name: 'Rep', displayName: 'Ravi Rep', email: 'r@x', role: 'sales', department: null },
  ]);
});
const renderPage = () => render(<MemoryRouter><AddLeadPage /></MemoryRouter>);

async function fillCore(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Website/ }));
  await user.type(screen.getByPlaceholderText('Jane'), 'Asha');
  await user.type(screen.getByPlaceholderText('jane@company.com'), 'asha@kora.example');
  await user.type(screen.getByPlaceholderText('Acme Corporation'), 'Kora');
}

describe('Add Lead — the payload is what the server stores', () => {
  it('sends value + currency, notes, priority, city, country and a REAL user id; no score, no dead keys', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillCore(user);
    await user.selectOptions(await screen.findByLabelText('Assigned To'), '9');
    await user.selectOptions(screen.getByLabelText('Priority'), 'high');
    await user.click(screen.getByRole('button', { name: /Additional Details/ }));
    await user.type(screen.getByLabelText('Est. Deal Value'), '2200000');
    await user.selectOptions(screen.getByLabelText('Currency'), 'INR');
    await user.type(screen.getByLabelText('City'), 'Pune');
    await user.type(screen.getByLabelText('Country'), 'India');
    await user.type(screen.getByLabelText('Notes'), 'Met at the summit');
    await user.click(screen.getByRole('button', { name: /Save Lead/ }));

    expect(ctx.createLead).toHaveBeenCalledTimes(1);
    const p = ctx.createLead.mock.calls[0][0];
    expect(p).toMatchObject({
      value: 2200000, currency: 'INR', notes: 'Met at the summit', priority: 'high',
      city: 'Pune', country: 'India', assigned_to_user_id: 9, source: 'Website',
    });
    for (const dead of ['score', 'estimated_value', 'quick_notes', 'address', 'owner_id']) {
      expect(p, dead).not.toHaveProperty(dead);
    }
  });

  it('unassigned sends NO owner (it used to store an owner named "unassigned"); priority is not defaulted', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillCore(user);
    await user.click(screen.getByRole('button', { name: /Save Lead/ }));
    const p = ctx.createLead.mock.calls[0][0];
    expect(p.assigned_to_user_id).toBeUndefined();
    expect(p.owner_id).toBeUndefined();
    expect(p.priority).toBeUndefined();
    expect(p.score).toBeUndefined();
  });

  it('the owner picker is the workspace roster, not placeholder queues', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /Website/ }));
    const owner = await screen.findByLabelText('Assigned To');
    await within(owner).findByRole('option', { name: 'Ravi Rep' });
    for (const fake of ['SDR Team', 'Account Manager', 'HR Partner']) {
      expect(within(owner).queryByRole('option', { name: fake })).toBeNull();
    }
  });

  it('offers only the company sizes and priorities the server accepts', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /HRMS/ }));
    const sizes = within(screen.getByLabelText('Company Size')).getAllByRole('option').map(o => o.getAttribute('value'));
    expect(sizes).toEqual(['', '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']);
    const prios = within(screen.getByLabelText('Priority')).getAllByRole('option').map(o => o.getAttribute('value'));
    expect(prios).toEqual(['', 'low', 'medium', 'high']);
  });

  it('a deal value needs its currency; nothing is sent until one is chosen', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillCore(user);
    await user.click(screen.getByRole('button', { name: /Additional Details/ }));
    await user.type(screen.getByLabelText('Est. Deal Value'), '5000');
    await user.click(screen.getByRole('button', { name: /Save Lead/ }));
    expect(ctx.createLead).not.toHaveBeenCalled();
    expect(screen.getByText('Choose the currency of the deal value')).toBeInTheDocument();
  });

  it('the duplicate check asks the SERVER (every lead), and a match blocks the save until acknowledged', async () => {
    ctx.checkLeadDuplicates.mockResolvedValue([{ id: 777, first_name: 'Asha', last_name: 'Old', email: 'asha@kora.example', phone: null, company: 'Kora', stage: 'new', matched_on: 'email' }]);
    const user = userEvent.setup();
    renderPage();
    await fillCore(user);
    expect(await screen.findByText(/A lead with this email already exists/)).toBeInTheDocument();
    expect(ctx.checkLeadDuplicates).toHaveBeenLastCalledWith([{ email: 'asha@kora.example', phone: undefined }]);
    await user.click(screen.getByRole('button', { name: /Save Lead/ }));
    expect(ctx.createLead).not.toHaveBeenCalled();
    await user.click(screen.getByLabelText(/Still add as a separate lead/));
    await user.click(screen.getByRole('button', { name: /Save Lead/ }));
    expect(ctx.createLead).toHaveBeenCalledTimes(1);
  });
});
