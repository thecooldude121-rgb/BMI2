import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MergeReviewModal from './MergeReviewModal';
import type { Lead } from '../../types/lead';

/**
 * Merging is "Coming soon" (disabled 2026-10-03; real merge is step 8).
 * The modal used to fire two lead writes without checking either and toast
 * "Leads merged" regardless. It must now be impossible to trigger, and it must
 * make no write and claim no success — while the read-only comparison stays.
 */
const mk = (id: string, first: string): Lead => ({
  id, first_name: first, last_name: 'Ray', email: `${first.toLowerCase()}@x.co`,
  company: 'Contoso', status: 'new', tags: [],
} as unknown as Lead);

describe('MergeReviewModal — merging is coming soon', () => {
  it('the merge action is disabled, labelled, and clicking it does nothing', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const a = mk('1', 'Ana'); const b = mk('2', 'Ann');
    render(
      <MergeReviewModal
        lead={a} candidateId="2" allLeads={[a, b]}
        candidates={[{ leadId: '2', signals: [], score: 90 } as any]}
        isOpen onClose={vi.fn()}
      />,
    );
    const btn = screen.getByRole('button', { name: /Merge Leads — coming soon/ });
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Merging leads is coming soon/)).toBeInTheDocument();
    // The comparison is still there to read.
    expect(screen.getByText('Merge Duplicate Leads')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
