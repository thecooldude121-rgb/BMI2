import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Quick Add and the Import wizard offer the workspace's REAL users as owners
 * (Venkat, 2026-10-14). They offered TEAM_MEMBERS placeholder queues ("SDR
 * Team", "HR Partner", "Account Manager"), stored as free-text owner names.
 */
const m = vi.hoisted(() => ({ fetchUsers: vi.fn(), createLead: vi.fn() }));
vi.mock('../../utils/usersApi', () => ({ fetchUsers: m.fetchUsers }));
vi.mock('../../contexts/LeadContext', () => ({ useLeads: () => ({ createLead: m.createLead, leads: [] }) }));

import QuickAddLeadModal from './QuickAddLeadModal';
import Step4Rules from './ImportWizard/Step4Rules';
import Step5Confirm from './ImportWizard/Step5Confirm';
import { DEFAULT_RULES, type ImportRules } from './ImportWizard/types';

const USERS = [
  { id: 7, first_name: 'Dee', last_name: 'Admin', displayName: 'Dee Admin', email: 'd@x', role: 'admin', department: null },
  { id: 9, first_name: 'Ravi', last_name: 'Rep', displayName: 'Ravi Rep', email: 'r@x', role: 'sales', department: null },
];
beforeEach(() => { vi.clearAllMocks(); m.fetchUsers.mockResolvedValue(USERS); m.createLead.mockResolvedValue({ id: '1' }); });

const noFakes = (select: HTMLElement) => {
  for (const fake of ['SDR Team', 'HR Partner', 'Account Manager']) expect(within(select).queryByRole('option', { name: fake })).toBeNull();
};

describe('Quick Add — real owners', () => {
  it('lists the roster and sends assigned_to_user_id', async () => {
    const user = userEvent.setup();
    render(<QuickAddLeadModal onClose={() => {}} onSuccess={() => {}} />);
    const owner = screen.getByLabelText('Assigned To');
    await within(owner).findByRole('option', { name: 'Ravi Rep' });
    noFakes(owner);
    await user.type(screen.getByPlaceholderText('Jane'), 'Asha');
    await user.type(screen.getByPlaceholderText('jane@company.com'), 'asha@kora.example');
    await user.selectOptions(screen.getByLabelText('Source'), 'Website');
    await user.selectOptions(owner, '9');
    await user.click(screen.getByRole('button', { name: /Add Lead/ }));
    const p = m.createLead.mock.calls[0][0];
    expect(p.assigned_to_user_id).toBe(9);
    expect(p).not.toHaveProperty('owner_id');
    expect(p).not.toHaveProperty('score');
  });

  it('unassigned sends no owner at all', async () => {
    const user = userEvent.setup();
    render(<QuickAddLeadModal onClose={() => {}} onSuccess={() => {}} />);
    await within(screen.getByLabelText('Assigned To')).findByRole('option', { name: 'Dee Admin' });
    await user.type(screen.getByPlaceholderText('Jane'), 'Ben');
    await user.type(screen.getByPlaceholderText('jane@company.com'), 'ben@kora.example');
    await user.selectOptions(screen.getByLabelText('Source'), 'Manual');
    await user.click(screen.getByRole('button', { name: /Add Lead/ }));
    expect(m.createLead.mock.calls[0][0].assigned_to_user_id).toBeUndefined();
  });
});

describe('Import wizard — real owners', () => {
  it('Step 4 offers the roster and records BOTH the id and its name in one update', async () => {
    const onRulesChange = vi.fn();
    const user = userEvent.setup();
    render(<Step4Rules rules={DEFAULT_RULES} onRulesChange={onRulesChange} />);
    const owner = screen.getByLabelText('Assign To');
    await within(owner).findByRole('option', { name: 'Ravi Rep' });
    noFakes(owner);
    await user.selectOptions(owner, '9');
    expect(onRulesChange).toHaveBeenLastCalledWith(expect.objectContaining({ defaultOwnerId: '9', defaultOwnerLabel: 'Ravi Rep' }));
  });

  it('Step 5 confirms the chosen person by name', () => {
    const rules: ImportRules = { ...DEFAULT_RULES, defaultOwnerId: '9', defaultOwnerLabel: 'Ravi Rep' };
    render(<Step5Confirm validatedRows={[]} skipErrors={false} rules={rules} onConfirm={() => {}} />);
    expect(screen.getByText('Ravi Rep')).toBeInTheDocument();
  });
});
