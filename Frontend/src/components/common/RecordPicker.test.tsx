import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

/** The shared server-search picker (slice 6). */
const api = vi.hoisted(() => ({ searchRecords: vi.fn() }));
vi.mock('../../utils/recordSearch', async () => ({ ...(await vi.importActual<object>('../../utils/recordSearch')), searchRecords: api.searchRecords }));
import RecordPicker from './RecordPicker';
import type { RecordOption } from '../../utils/recordSearch';

function Host({ onPick }: { onPick?: (v: RecordOption | null) => void }) {
  const [v, setV] = useState<RecordOption | null>(null);
  return <RecordPicker kinds={['contact', 'company', 'deal', 'lead']} value={v} onChange={x => { setV(x); onPick?.(x); }} label="Find record" />;
}
beforeEach(() => {
  vi.clearAllMocks();
  api.searchRecords.mockImplementation(async (kind: string, q: string) => ({
    total: 4312, options: [{ kind, id: `${kind}-1`, label: `${q || 'Recent'} ${kind}`, detail: 'Kora' }, { kind, id: `${kind}-2`, label: `Second ${kind}` }],
  }));
});

describe('RecordPicker', () => {
  it('searches the server for the typed text and says how many it is not showing', async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.type(screen.getByRole('combobox', { name: 'Find record' }), 'Ana');
    await waitFor(() => expect(api.searchRecords).toHaveBeenLastCalledWith('contact', 'Ana'));
    expect(await screen.findByText('Showing 2 of 4,312 — keep typing to narrow.')).toBeInTheDocument();
  });

  it('LEADS are offered, and switching type searches that type', async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.click(screen.getByRole('radio', { name: 'Lead' }));
    await user.click(screen.getByRole('combobox', { name: 'Find record' }));
    await waitFor(() => expect(api.searchRecords).toHaveBeenLastCalledWith('lead', ''));
    expect(await screen.findByRole('option', { name: /Recent lead/ })).toBeInTheDocument();
  });

  it('keyboard: ↓ then Enter picks; the pick shows as a chip that can be cleared', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(<Host onPick={onPick} />);
    const box = screen.getByRole('combobox', { name: 'Find record' });
    await user.type(box, 'Ko');
    await screen.findByRole('option', { name: /Second contact/ });
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onPick).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'contact-2' }));
    expect(screen.getByTestId('record-picker-value')).toHaveTextContent('Second contact');
    await user.click(screen.getByRole('button', { name: 'Clear Second contact' }));
    expect(onPick).toHaveBeenLastCalledWith(null);
  });

  it('a failed search says so — never "no matches"', async () => {
    api.searchRecords.mockRejectedValue(new Error('HTTP 500'));
    const user = userEvent.setup();
    render(<Host />);
    await user.type(screen.getByRole('combobox', { name: 'Find record' }), 'x');
    expect(await screen.findByText('The search failed — HTTP 500')).toBeInTheDocument();
    expect(screen.queryByText(/No contact matches/)).toBeNull();
  });

  it('an empty result names the query', async () => {
    api.searchRecords.mockResolvedValue({ total: 0, options: [] });
    const user = userEvent.setup();
    render(<Host />);
    await user.type(screen.getByRole('combobox', { name: 'Find record' }), 'zzz');
    expect(await screen.findByText('No contact matches “zzz”.')).toBeInTheDocument();
  });
});
