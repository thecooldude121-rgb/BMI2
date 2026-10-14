import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

/**
 * H1 (2026-10-13) — the account form collects only columns `companies` has, and
 * shows nothing invented. mapAccountToPayload is the real one (not mocked), so
 * "what reaches the API" is asserted through the code that builds the request.
 */
const m = vi.hoisted(() => ({
  createAccount: vi.fn(), updateAccount: vi.fn(), showToast: vi.fn(),
  fetchIndustries: vi.fn(), fetchAccountsPage: vi.fn(), useAccountById: vi.fn(),
}));
vi.mock('../../contexts/AccountsContext', () => ({ useAccounts: () => ({ createAccount: m.createAccount, updateAccount: m.updateAccount }) }));
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ showToast: m.showToast }) }));
vi.mock('../../utils/industriesApi', () => ({ fetchIndustries: m.fetchIndustries }));
vi.mock('../../hooks/useAccountById', () => ({ useAccountById: m.useAccountById }));
vi.mock('../../utils/accountsApi', async () => ({ ...(await vi.importActual<object>('../../utils/accountsApi')), fetchAccountsPage: m.fetchAccountsPage }));

import AccountFormPage from './AccountFormPage';
import { mapAccountToPayload } from '../../utils/accountsApi';

const ACCOUNT = {
  id: 'C9', name: 'Vertex Academy', industry: 'Education', domain: 'vertex.example', website: 'https://vertex.example',
  phone: '+91 80 1234', description: 'K-12', accountSize: '51-200', annualRevenue: 5000000,
  billingAddress: { street: '1 MG Road', city: 'Bengaluru', state: 'KA', postalCode: '560001', country: 'India' },
};
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  m.fetchIndustries.mockResolvedValue(['Education', 'IT Services']);
  m.fetchAccountsPage.mockResolvedValue({ accounts: [], total: 0 });
  m.useAccountById.mockReturnValue({ account: ACCOUNT, loading: false, error: null });
  m.updateAccount.mockResolvedValue(undefined);
});
const renderAt = (url: string) => render(
  <MemoryRouter initialEntries={[url]}>
    <Routes>
      <Route path="/crm/accounts/:accountId/edit" element={<AccountFormPage />} />
      <Route path="/crm/accounts/new" element={<AccountFormPage />} />
      <Route path="/crm/accounts/:accountId" element={<p>account page</p>} />
    </Routes>
  </MemoryRouter>,
);

describe('Edit Account — only what saves, nothing invented', () => {
  it('shows none of the fabrications', async () => {
    const { container } = renderAt('/crm/accounts/C9/edit');
    await screen.findByDisplayValue('Vertex Academy');
    const text = container.textContent ?? '';
    for (const lie of [/Alex Rodriguez/, /Last Modified/, /0 deals/, /0 contacts/, /Verified/, /AI Suggestion/i, /HRMS/, /TechStart/, /Save as Draft/i]) {
      expect(text, String(lie)).not.toMatch(lie);
    }
  });

  it('every input maps to a column — the payload survives mapAccountToPayload whole', async () => {
    const user = userEvent.setup();
    renderAt('/crm/accounts/C9/edit');
    const name = await screen.findByDisplayValue('Vertex Academy');
    await user.clear(name); await user.type(name, 'Vertex Learning');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));
    await waitFor(() => expect(m.updateAccount).toHaveBeenCalledTimes(1));
    const [id, payload] = m.updateAccount.mock.calls[0];
    expect(id).toBe('C9');
    expect(Object.keys(payload).sort()).toEqual(
      ['accountSize', 'annualRevenue', 'billingAddress', 'description', 'domain', 'industry', 'name', 'phone', 'website'].sort());
    expect(payload).not.toHaveProperty('customFields');
    expect(payload).not.toHaveProperty('tags');
    expect(mapAccountToPayload(payload)).toEqual({
      name: 'Vertex Learning', domain: 'vertex.example', industry: 'Education', size: '51-200', revenue: 5000000,
      website: 'https://vertex.example', phone: '+91 80 1234', description: 'K-12',
      street: '1 MG Road', city: 'Bengaluru', state: 'KA', country: 'India', zip_code: '560001',
    });
    expect(await screen.findByText('account page')).toBeInTheDocument();
    expect(m.showToast).toHaveBeenCalledWith('success', 'Account updated');
  });

  it('a refused save shows the server\'s message, keeps the input and says nothing succeeded', async () => {
    m.updateAccount.mockRejectedValue(new Error('industry must be one of: …'));
    const user = userEvent.setup();
    renderAt('/crm/accounts/C9/edit');
    await screen.findByDisplayValue('Vertex Academy');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));
    expect(await screen.findByText('industry must be one of: …')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Vertex Academy')).toBeInTheDocument();
    expect(m.showToast).not.toHaveBeenCalledWith('success', expect.anything());
  });

  it('completeness counts filled fields and claims no verification', async () => {
    renderAt('/crm/accounts/C9/edit');
    await screen.findByDisplayValue('Vertex Academy');
    expect(screen.getByTestId('completeness')).toHaveTextContent('11 of 11 fields filled');
  });

  it('a stored draft is OFFERED inline — no browser dialog', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    localStorage.setItem('account-form-draft-v2-new', JSON.stringify({ data: { name: 'Draft Co' }, timestamp: Date.now() }));
    m.useAccountById.mockReturnValue({ account: null, loading: false, error: null });
    const user = userEvent.setup();
    renderAt('/crm/accounts/new');
    await user.click(await screen.findByRole('button', { name: 'Restore' }));
    expect(screen.getByDisplayValue('Draft Co')).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('accepts long top-level domains (the old 6-letter cap refused .education)', async () => {
    m.useAccountById.mockReturnValue({ account: { ...ACCOUNT, website: 'https://vertex.education' }, loading: false, error: null });
    const user = userEvent.setup();
    renderAt('/crm/accounts/C9/edit');
    await screen.findByDisplayValue('Vertex Academy');
    await user.click(screen.getByRole('button', { name: /^Save$/ }));
    await waitFor(() => expect(m.updateAccount).toHaveBeenCalledTimes(1));
  });
});
