import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * 2026-10-10: the Activities page showed HRMS sample content (a separate
 * product — sample data naming it encodes a cross-product read) and a "Quick
 * Filters" bar of hardcoded counts on buttons that did nothing. Both are gone;
 * the stat cards carry the real counts.
 */
vi.mock('../../utils/activitiesApi', async () => ({
  ...(await vi.importActual<object>('../../utils/activitiesApi')),
  fetchActivities: vi.fn().mockResolvedValue([
    { id: 'a1', subject: 'Discovery call', type: 'call', status: 'completed', created_at: new Date().toISOString(), completed_at: new Date().toISOString() },
  ]),
}));
import ActivitiesPage from './ActivitiesPage';

describe('ActivitiesPage — no cross-product samples, no invented counts', () => {
  it('mentions HRMS nowhere and has no Quick Filters bar', async () => {
    const { container } = render(<MemoryRouter><ActivitiesPage /></MemoryRouter>);
    expect(await screen.findAllByText('Discovery call')).not.toHaveLength(0);
    expect(container.textContent).not.toMatch(/HRMS/i);
    expect(screen.queryByText(/Quick Filters/i)).toBeNull();
    expect(screen.queryByText(/My Open Tasks/i)).toBeNull();
  });
});
