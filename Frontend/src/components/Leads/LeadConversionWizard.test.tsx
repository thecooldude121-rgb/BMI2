import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeadConversionWizard from './LeadConversionWizard';
import { LeadConversionError } from '../../utils/leadsApi';
import type { Lead } from '../../types/lead';

/**
 * Step 5 slice B — the conversion wizard talks to the real endpoint.
 * Ratified rules pinned here:
 *   - a deal value is REQUIRED: blank blocks Convert, and nothing defaults to 0;
 *   - a duplicate email is offered as an explicit "Link to …" choice — the first
 *     request is always 'create', and linking happens only on the rep's click;
 *   - no owner picker; the converter owns the records;
 *   - step 4 shows the ids the SERVER returned, never client-minted ones.
 */
const convertLead = vi.fn();
vi.mock('../../contexts/LeadContext', () => ({
  useLeads: () => ({ leads: [], convertLead }),
}));

const lead = {
  id: '42', first_name: 'Priya', last_name: 'Menon', full_name: 'Priya Menon',
  email: 'priya@contoso.com', company: 'Contoso', source: 'website', status: 'qualified',
  tags: [], call_count: 0, email_sent_count: 0,
} as unknown as Lead;
const readiness = { state: 'ready_for_deal', label: 'Ready for deal', checklist: [] } as any;

const serverResult = {
  lead: { ...lead, status: 'converted' },
  contact: { id: 'CT101', name: 'Priya Menon', created: true },
  company: { id: 'C055', name: 'Contoso', created: true },
  deal: { id: 'D099', name: 'Contoso — Priya Menon' },
};

async function reachStep3() {
  render(<LeadConversionWizard lead={lead} readiness={readiness} isOpen onClose={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: /Next/ }));   // path (defaults to contact+account+deal)
  await userEvent.click(screen.getByRole('button', { name: /Next/ }));   // duplicates
}

// mockClear, not mockReset: in this vitest version mockReset() followed by a
// throwing async implementation surfaces the rejection into the test body even
// though the component catches it (diagnosed 2026-10-03). Each test sets its
// own behaviour; the default refuses, so an unexpected call cannot pass quietly.
beforeEach(() => {
  convertLead.mockClear();
  convertLead.mockImplementation(async () => { throw new Error('convertLead called unexpectedly'); });
});

describe('LeadConversionWizard', () => {
  it('a blank deal value blocks Convert; nothing is sent until a value is entered', async () => {
    await reachStep3();
    const convert = screen.getByRole('button', { name: /Convert Lead/ });
    expect(screen.getByLabelText('Deal Value')).toHaveValue(null);      // starts blank, not 0
    expect(convert).toBeDisabled();
    expect(screen.getByText(/Required — enter the deal value/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Deal Value'), '125000');
    expect(convert).toBeEnabled();
    expect(convertLead).not.toHaveBeenCalled();
  });

  it('sends the real request and shows the ids the SERVER returned', async () => {
    convertLead.mockResolvedValue(serverResult);
    await reachStep3();
    await userEvent.type(screen.getByLabelText('Deal Value'), '125000');
    await userEvent.click(screen.getByRole('button', { name: /Convert Lead/ }));

    expect(convertLead).toHaveBeenCalledWith('42', {
      contact: { mode: 'create' },
      company: { mode: 'create' },
      deal: { name: 'Contoso — Priya Menon', value: 125000 },
    });
    expect(await screen.findByText('Conversion complete')).toBeInTheDocument();
    for (const id of ['CT101', 'C055', 'D099']) expect(screen.getByText(id)).toBeInTheDocument();
    expect(screen.queryByText(/cnt_|acc_|deal_\d/)).toBeNull();
  });

  it('a duplicate email is offered as an explicit link — first create, then link only on click', async () => {
    convertLead
      .mockRejectedValueOnce(new LeadConversionError(409, {
        code: 'CONTACT_EMAIL_EXISTS', message: 'A contact with this email already exists',
        existing_contact: { id: 'CT007', name: 'Priya M' },
      }))
      .mockResolvedValueOnce({ ...serverResult, contact: { id: 'CT007', name: 'Priya M', created: false } });
    await reachStep3();
    await userEvent.type(screen.getByLabelText('Deal Value'), '5000');
    await userEvent.click(screen.getByRole('button', { name: /Convert Lead/ }));

    expect(await screen.findByText(/A contact with this email already exists/)).toBeInTheDocument();
    expect(convertLead).toHaveBeenCalledTimes(1);
    expect(convertLead.mock.calls[0][1].contact).toEqual({ mode: 'create' });   // never auto-linked
    expect(screen.getByRole('button', { name: /Convert Lead/ })).toBeDisabled(); // must answer first

    await userEvent.click(screen.getByRole('button', { name: 'Link to Priya M' }));
    await waitFor(() => expect(convertLead).toHaveBeenCalledTimes(2));
    expect(convertLead.mock.calls[1][1].contact).toEqual({ mode: 'link', contact_id: 'CT007' });
    expect(await screen.findByText(/existing contact, linked/)).toBeInTheDocument();
  });

  it('cancelling the duplicate offer sends nothing further', async () => {
    convertLead.mockRejectedValueOnce(new LeadConversionError(409, {
      code: 'CONTACT_EMAIL_EXISTS', message: 'exists', existing_contact: { id: 'CT007', name: 'Priya M' },
    }));
    await reachStep3();
    await userEvent.type(screen.getByLabelText('Deal Value'), '5000');
    await userEvent.click(screen.getByRole('button', { name: /Convert Lead/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('button', { name: /Link to/ })).toBeNull();
    expect(convertLead).toHaveBeenCalledTimes(1);
  });

  it('any other refusal shows the server message, stays on step 3, and says nothing was saved', async () => {
    convertLead.mockImplementation(async () => {
      throw new LeadConversionError(409, {
        code: 'LEAD_NOT_QUALIFIED', message: 'Only a qualified or sales-accepted lead can be converted; this lead is new.',
      });
    });
    await reachStep3();
    await userEvent.type(screen.getByLabelText('Deal Value'), '5000');
    await userEvent.click(screen.getByRole('button', { name: /Convert Lead/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('this lead is new');
    expect(screen.getByText(/no records were created/)).toBeInTheDocument();
    expect(screen.queryByText('Conversion complete')).toBeNull();
  });

  it('has no owner picker — the converter owns the records (interim rule)', async () => {
    await reachStep3();
    expect(screen.queryByRole('combobox', { name: 'Owner' })).toBeNull();
    expect(screen.getByText(/new records will be owned by you/)).toBeInTheDocument();
  });
});
