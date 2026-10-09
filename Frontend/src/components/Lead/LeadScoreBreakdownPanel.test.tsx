import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LeadScoreBreakdownPanel from './LeadScoreBreakdownPanel';
import { computeMultiFactorScore } from '../../utils/leadScoring/multiFactorScore';
import { makeLead } from '../../__tests__/fixtures/leadFixtures';

/**
 * Group A item 3 — the score panel's "last updated". The score is recalculated
 * on every open, so the panel says so and gives the time its INPUTS last
 * changed (the record's updated_at). It must never show "now".
 */
afterEach(() => { vi.useRealTimers(); });

describe('LeadScoreBreakdownPanel — when the score inputs last changed', () => {
  it('shows the record\'s updated_at, never the current time', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 10, 18, 0));
    const lead = makeLead({ updated_at: new Date(2026, 8, 3, 9, 15).toISOString() });
    render(<LeadScoreBreakdownPanel multiFactorScore={computeMultiFactorScore(lead)} lead={lead} />);
    const line = screen.getByTestId('score-inputs-changed');
    expect(line).toHaveTextContent('Recalculated on open · inputs last changed 3 Sept 2026, 09:15');
    expect(line.textContent).not.toMatch(/10 Oct 2026/);
  });

  it('a record with no stored time shows no "last changed" claim at all', () => {
    const lead = makeLead({ updated_at: '' });
    render(<LeadScoreBreakdownPanel multiFactorScore={computeMultiFactorScore(lead)} lead={lead} />);
    expect(screen.queryByTestId('score-inputs-changed')).toBeNull();
    expect(screen.queryByText(/last updated/i)).toBeNull();
  });
});

import { mapRowToLead } from '../../utils/leadsApi';
describe('mapRowToLead — updated_at is never invented', () => {
  it('falls back to created_at (a true bound), never to the current time', () => {
    expect(mapRowToLead({ id: 1, created_at: '2026-01-02T03:04:05Z' }).updated_at).toBe('2026-01-02T03:04:05Z');
    expect(mapRowToLead({ id: 1 }).updated_at).toBe('');
  });
});
