import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Lead } from '../../types/lead';

/**
 * "Link to existing" is ON (decided 2026-10-14, slice 6b): an existing contact
 * and/or account, picked by SERVER search, linked through the conversion
 * endpoint's 'link' modes. It was disabled because its pickers had listed
 * sample data.
 */
const m = vi.hoisted(() => ({ convertLead: vi.fn(), fetchAccountsPage: vi.fn(), fetchContactsPage: vi.fn() }));
vi.mock('../../contexts/LeadContext', () => ({ useLeads: () => ({ leads: [], convertLead: m.convertLead }) }));
vi.mock('../../utils/accountsApi', async () => ({ ...(await vi.importActual<object>('../../utils/accountsApi')), fetchAccountsPage: m.fetchAccountsPage }));
vi.mock('../../utils/contactsApi', async () => ({ ...(await vi.importActual<object>('../../utils/contactsApi')), fetchContactsPage: m.fetchContactsPage }));
import LeadConversionWizard from './LeadConversionWizard';

const lead = { id: '42', first_name: 'Priya', last_name: 'Menon', full_name: 'Priya Menon', email: 'priya@contoso.com', company: 'Contoso',
  source: 'website', status: 'qualified', tags: [], call_count: 0, email_sent_count: 0 } as unknown as Lead;
const readiness = { state: 'ready_for_deal', label: 'Ready', checklist: [] } as any;

beforeEach(() => {
  vi.clearAllMocks();
  m.fetchAccountsPage.mockResolvedValue({ accounts: [{ id: 'C204', name: 'Contoso Ltd' }], total: 1 });
  m.fetchContactsPage.mockResolvedValue({ contacts: [{ id: 'CT9', name: 'Priya M', email: 'pm@contoso.com' }], total: 1 });
  m.convertLead.mockResolvedValue({ lead: { ...lead, status: 'converted' }, contact: { id: 'CT900', name: 'Priya Menon', created: true }, company: { id: 'C204', name: 'Contoso Ltd', created: false }, deal: null });
});

it('links an EXISTING account (a new contact from the lead) through company.mode = link', async () => {
  const user = userEvent.setup();
  render(<LeadConversionWizard lead={lead} readiness={readiness} isOpen onClose={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: /Link to Existing/ }));
  await user.click(screen.getByRole('button', { name: /Next/ }));
  // Nothing picked yet: cannot continue.
  expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
  await user.type(screen.getByRole('combobox', { name: 'Search accounts' }), 'Contoso');
  await user.click(await screen.findByRole('option', { name: /Contoso Ltd/ }));
  await user.click(screen.getByRole('button', { name: /Next/ }));
  await user.click(screen.getByRole('button', { name: /Convert Lead/ }));
  expect(m.convertLead).toHaveBeenCalledWith('42', expect.objectContaining({
    contact: { mode: 'create' }, company: { mode: 'link', company_id: 'C204' }, deal: null,
  }));
});

it('links an EXISTING contact through contact.mode = link', async () => {
  const user = userEvent.setup();
  render(<LeadConversionWizard lead={lead} readiness={readiness} isOpen onClose={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: /Link to Existing/ }));
  await user.click(screen.getByRole('button', { name: /Next/ }));
  await user.type(screen.getByRole('combobox', { name: 'Search contacts' }), 'Priya');
  await user.click(await screen.findByRole('option', { name: /Priya M/ }));
  await user.click(screen.getByRole('button', { name: /Next/ }));
  await user.click(screen.getByRole('button', { name: /Convert Lead/ }));
  expect(m.convertLead).toHaveBeenCalledWith('42', expect.objectContaining({
    contact: { mode: 'link', contact_id: 'CT9' }, company: { mode: 'none' },
  }));
});
