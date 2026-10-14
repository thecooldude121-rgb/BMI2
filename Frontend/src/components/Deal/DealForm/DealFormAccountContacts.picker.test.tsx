import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Slice 6b (decided 2026-10-14): the deal's account is a REAL account picked by
 * server search, or empty. It was free text with suggestions from the first 50
 * deals' company names, and it never set company_id.
 */
const m = vi.hoisted(() => ({ fetchAccountsPage: vi.fn() }));
vi.mock('../../../utils/accountsApi', async () => ({ ...(await vi.importActual<object>('../../../utils/accountsApi')), fetchAccountsPage: m.fetchAccountsPage }));
import { DealFormAccountContacts } from './DealFormAccountContacts';

const base = { accountId: '', accountName: '', primaryContactName: '', contactRole: 'champion', additionalContacts: [] };

it('searches accounts on the server and hands back a real account id', async () => {
  m.fetchAccountsPage.mockResolvedValue({ accounts: [{ id: 'C204', name: 'Kora Labs', industry: 'EdTech' }], total: 1 });
  const onAccountPick = vi.fn();
  const user = userEvent.setup();
  render(<DealFormAccountContacts formData={base} onChange={() => {}} onAccountPick={onAccountPick} />);
  await user.type(screen.getByRole('combobox', { name: 'Search accounts' }), 'Kora');
  await user.click(await screen.findByRole('option', { name: /Kora Labs/ }));
  expect(m.fetchAccountsPage).toHaveBeenCalledWith(expect.objectContaining({ search: 'Kora', limit: 10 }));
  expect(onAccountPick).toHaveBeenCalledWith(expect.objectContaining({ kind: 'company', id: 'C204', label: 'Kora Labs' }));
});

it('a legacy deal with only a company NAME says it is unlinked — nothing is matched by name', () => {
  render(<DealFormAccountContacts formData={{ ...base, accountName: 'TechCorp' }} onChange={() => {}} onAccountPick={() => {}} />);
  expect(screen.getByTestId('unlinked-company-name')).toHaveTextContent('“TechCorp” but is not linked to an account');
  expect(screen.getByRole('combobox', { name: 'Search accounts' })).toBeInTheDocument();
});

it('a linked deal shows its account as a clearable choice', async () => {
  const onAccountPick = vi.fn();
  render(<DealFormAccountContacts formData={{ ...base, accountId: 'C204', accountName: 'Kora Labs' }} onChange={() => {}} onAccountPick={onAccountPick} />);
  await userEvent.click(screen.getByRole('button', { name: 'Clear Kora Labs' }));
  expect(onAccountPick).toHaveBeenCalledWith(null);
});
