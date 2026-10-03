import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KanbanQualifyModal from './KanbanQualifyModal';
import type { Lead } from '../../types/lead';

/**
 * Step 5 — the qualify modal defers to the server.
 *   - it stays open until the server confirms (no success before the save);
 *   - a refusal shows the SERVER's message and keeps the modal open;
 *   - an override needs a reason, and only a role the server allows sees it;
 *   - the advisory score never forces an override.
 */
const lead = (extra: Partial<Lead> = {}): Lead => ({
  id: '1', first_name: 'Ana', last_name: 'Ray', email: 'ana@x.co', company: 'Contoso',
  last_contact_date: '2026-09-30', score: 80, status: 'engaged',
  ...extra,
} as Lead);

describe('KanbanQualifyModal', () => {
  it('stays open while the server is deciding, and closes only after it confirms', async () => {
    let resolve!: (v: null) => void;
    const onConfirm = vi.fn(() => new Promise<null>(r => { resolve = r; }));
    const onClose = vi.fn();
    render(<KanbanQualifyModal lead={lead()} canOverride={false} onConfirm={onConfirm} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Move to Qualifying' }));
    expect(onConfirm).toHaveBeenCalledWith({});
    expect(onClose).not.toHaveBeenCalled();          // no success before the save
    resolve(null);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('a server refusal is shown verbatim and the modal stays open', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn(async () => ({
      message: 'This lead does not meet the qualification criteria: has a recorded last contact.',
      unmetCriteria: [{ id: 'last_contact', label: 'Has a recorded last contact' }],
      canOverride: false,
    }));
    render(<KanbanQualifyModal lead={lead()} canOverride={false} onConfirm={onConfirm} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Move to Qualifying' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('has a recorded last contact');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /override/i })).toBeNull();
  });

  it('a low score alone does NOT force an override — it is advisory', () => {
    render(<KanbanQualifyModal lead={lead({ score: 10 })} canOverride={false} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Move to Qualifying' })).toBeEnabled();
  });

  it('a manager overriding must give a reason, and the reason is sent', async () => {
    const onConfirm = vi.fn(async () => null);
    render(<KanbanQualifyModal lead={lead({ company: '' })} canOverride onConfirm={onConfirm} onClose={vi.fn()} />);

    const button = screen.getByRole('button', { name: 'Override and move' });
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Reason for override'), 'Met at the expo');
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onConfirm).toHaveBeenCalledWith({ override: true, reason: 'Met at the expo' });
  });

  it('a role that cannot override sees no override control, only the explanation', () => {
    render(<KanbanQualifyModal lead={lead({ company: '' })} canOverride={false} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /override/i })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Move to Qualifying' })).toBeNull();
    expect(screen.getByText(/Only a manager or admin can override/)).toBeInTheDocument();
  });
});
