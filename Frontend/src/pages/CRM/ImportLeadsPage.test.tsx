import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * H2 (2026-10-14): no provider is wired, so every provider control is a
 * disabled "Coming soon" — the Connect modal ended in alert(), "Import now" ran
 * a fake progress bar, and the cards listed other vendors' marketing claims.
 */
vi.mock('../../components/Leads/ImportWizard/ImportWizard', () => ({ default: () => null }));
import ImportLeadsPage from './ImportLeadsPage';

it('provider Connect buttons are disabled, and the false copy is gone', () => {
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  const { container } = render(<MemoryRouter><ImportLeadsPage /></MemoryRouter>);
  const connects = screen.getAllByRole('button', { name: 'Connect · Coming soon' });
  expect(connects.length).toBe(4);
  connects.forEach(b => expect(b).toBeDisabled());
  const text = container.textContent ?? '';
  for (const lie of [/Benefits/, /100M\+/, /Auto-Sync/i, /AI Scoring/i, /Alex Rodriguez/, /How It Works/i]) {
    expect(text, String(lie)).not.toMatch(lie);
  }
  expect(screen.getByRole('button', { name: /Start CSV Import/ })).toBeEnabled();
  expect(alertSpy).not.toHaveBeenCalled();
});
