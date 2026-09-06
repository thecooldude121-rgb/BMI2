import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DealSlideoutPanel from './DealSlideoutPanel';

/**
 * The panel must become VISIBLE even when no animation frame is ever painted.
 *
 * This is a regression test for a bug that produced no error, no failed
 * request and nothing on screen. The panel reached its open position only
 * through `requestAnimationFrame(() => setIsVisible(true))`, and rAF callbacks
 * do not run while the document is hidden. A click in a tab that was not
 * frontmost therefore mounted the dialog, fetched the deal, and left it parked
 * at `translate-x-full` — one full viewport width off-screen — with
 * role="dialog" aria-modal="true" still announcing it as open.
 *
 * The hidden document is reproduced here by stubbing rAF to never call back,
 * which is exactly what a hidden document does and is deterministic, unlike
 * dispatching visibilitychange and hoping the browser agrees.
 */
const deal = {
  id: 'D019', name: 'TechCorp – Growth Plan – Jun 2026', title: 'TechCorp – Growth Plan – Jun 2026',
  value: '24000.00', currency: 'USD', stage: 'renewal-quoted', pipeline_id: 'renewals',
  probability: 75, company_name: 'TechCorp', assigned_to: null, expected_close_date: null,
};

const panel = (dealId: string | null) => (
  <MemoryRouter>
    <DealSlideoutPanel dealId={dealId} onClose={() => {}} onNavigateToFull={() => {}} onDealUpdate={() => {}} />
  </MemoryRouter>
);

const dialog = () => document.querySelector('[role="dialog"]') as HTMLElement | null;

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k === 'authToken' ? 'test-token' : null),
    setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
  } as unknown as Storage);
  vi.stubGlobal('fetch', vi.fn(async (url: any) => {
    const isDetail = /\/deals\/D\d+/.test(String(url));
    return {
      ok: true, status: 200,
      json: async () => ({ success: true, data: isDetail ? deal : [] }),
    } as Response;
  }));
});

afterEach(() => { vi.unstubAllGlobals(); });

describe('DealSlideoutPanel visibility', () => {
  it('opens when the document is hidden and no animation frame ever fires', async () => {
    // rAF that registers the callback and never calls it — a hidden document.
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    render(panel('D019'));
    await waitFor(() => expect(dialog()).toBeTruthy());

    // THE ASSERTION. Before the fix this stayed translate-x-full forever.
    await waitFor(
      () => expect(dialog()!.className).toContain('translate-x-0'),
      { timeout: 2000 },
    );
    expect(dialog()!.className).not.toContain('translate-x-full');
  });

  it('still uses the animation frame when there is one, so the slide is preserved', async () => {
    // rAF that defers, as a real one does — the panel must paint CLOSED first
    // or the CSS transition has nothing to animate from.
    let frame: FrameRequestCallback | null = null;
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => { frame = cb; return 1; }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    render(panel('D019'));
    await waitFor(() => expect(dialog()).toBeTruthy());

    // Before the frame runs it is still in the closed position.
    expect(dialog()!.className).toContain('translate-x-full');

    frame!(0);
    await waitFor(() => expect(dialog()!.className).toContain('translate-x-0'));
  });
});
