import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { Lead } from '../../types/lead';

/**
 * The lead editor (Group A item 1). Pins: only CHANGED fields are sent; success
 * waits for the server; a refusal keeps the input; blank means NULL; the client
 * checks mirror the server's.
 */

const api = vi.hoisted(() => ({ fetchLeadByIdFromAPI: vi.fn(), saveLeadViaAPI: vi.fn() }));
vi.mock('../../utils/leadsApi', async () => ({ ...(await vi.importActual<object>('../../utils/leadsApi')), ...api }));
const toast = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ showToast: toast }) }));
const notifyWrite = vi.hoisted(() => vi.fn());
vi.mock('../../contexts/LeadContext', () => ({ useLeads: () => ({ notifyWrite }) }));

import LeadEditPage, { diffLeadForm, validateLeadForm } from './LeadEditPage';

const LEAD = {
  id: '42', first_name: 'Amina', last_name: 'Farsi', email: 'amina@example.test', phone: '+971 50 000 0000',
  company: 'GulfAxis', position: 'Director', source: 'Website', tags: ['uae'], status: 'new', score: 40,
  estimated_value: 2200000, currency: null, city: 'Dubai', owner_name: undefined,
} as unknown as Lead;

const renderEditor = () => render(
  <MemoryRouter initialEntries={['/crm/leads/42/edit']}>
    <Routes>
      <Route path="/crm/leads/:id/edit" element={<LeadEditPage />} />
      <Route path="/crm/leads/:id" element={<p>lead page</p>} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchLeadByIdFromAPI.mockResolvedValue(LEAD);
});

describe('LeadEditPage', () => {
  it('prefills from the stored lead, and Save is disabled until something changes', async () => {
    renderEditor();
    expect(await screen.findByRole('textbox', { name: /first name/i })).toHaveValue('Amina');
    expect(screen.getByRole('textbox', { name: 'City' })).toHaveValue('Dubai');
    expect(screen.getByRole('textbox', { name: 'Estimated deal value' })).toHaveValue('2200000');
    expect(screen.getAllByRole('button', { name: 'No changes' })[0]).toBeDisabled();
  });

  it('sends ONLY the changed fields, then shows success and returns to the lead after the server confirms', async () => {
    let resolve!: (v: unknown) => void;
    api.saveLeadViaAPI.mockImplementation(() => new Promise(r => { resolve = r; }));
    renderEditor();
    const city = await screen.findByRole('textbox', { name: 'City' });
    await userEvent.clear(city);
    await userEvent.type(city, 'Abu Dhabi');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Company size' }), '1000+');
    await userEvent.click(screen.getAllByRole('button', { name: 'Save lead' })[0]);

    expect(api.saveLeadViaAPI).toHaveBeenCalledWith('42', { city: 'Abu Dhabi', company_size: '1000+' });
    expect(toast).not.toHaveBeenCalled();
    resolve({ ...LEAD, city: 'Abu Dhabi' });
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Lead saved', 'success'));
    expect(await screen.findByText('lead page')).toBeInTheDocument();
    expect(notifyWrite).toHaveBeenCalled();
  });

  it('a refusal keeps the user on the form with their input and the server message', async () => {
    api.saveLeadViaAPI.mockRejectedValue(new Error('city must be at most 100 characters'));
    renderEditor();
    const city = await screen.findByRole('textbox', { name: 'City' });
    await userEvent.clear(city);
    await userEvent.type(city, 'Somewhere');
    await userEvent.click(screen.getAllByRole('button', { name: 'Save lead' })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent('city must be at most 100 characters');
    expect(screen.getByRole('textbox', { name: 'City' })).toHaveValue('Somewhere');
    expect(screen.queryByText('lead page')).toBeNull();
    expect(toast).not.toHaveBeenCalledWith('Lead saved', 'success');
  });

  it('a blank email is caught before any request is made', async () => {
    renderEditor();
    const email = await screen.findByRole('textbox', { name: /work email/i });
    await userEvent.clear(email);
    await userEvent.click(screen.getAllByRole('button', { name: 'Save lead' })[0]);
    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(api.saveLeadViaAPI).not.toHaveBeenCalled();
  });

  it('shows the owner but does not let the form edit it (owner pickers are item 8)', async () => {
    renderEditor();
    const owner = await screen.findByRole('textbox', { name: /owner/i });
    expect(owner).toHaveAttribute('readonly');
    expect(owner).toHaveValue('Unassigned');
  });
});

describe('diffLeadForm / validateLeadForm', () => {
  const base = {
    first_name: 'A', last_name: '', email: 'a@x.example', phone: '', mobile: '', company: '', position: '', industry: '',
    source: '', source_detail: '', utm_source: '', utm_medium: '', utm_campaign: '', referral_contact: '', department: '',
    priority: '', value: '', currency: '', company_size: '', website: '', linkedin_url: '', city: 'Dubai', country: '',
    notes: '', tags: '',
  };

  it('blank means NULL, value is a number, tags split on commas, unchanged fields are omitted', () => {
    expect(diffLeadForm(base, { ...base, city: '', value: '1500.5', tags: 'a, b ,,c' }))
      .toEqual({ city: null, value: 1500.5, tags: ['a', 'b', 'c'] });
    expect(diffLeadForm(base, { ...base, city: ' Dubai ' })).toEqual({});
  });

  it('validation mirrors the server: required name and email, a non-negative value', () => {
    expect(validateLeadForm({ ...base, first_name: ' ', email: 'nope', value: '-1' }))
      .toEqual({ first_name: 'First name is required.', email: 'This does not look like an email address.', value: 'Enter a number of zero or more.' });
    expect(validateLeadForm(base)).toEqual({});
  });
});
