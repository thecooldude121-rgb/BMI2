import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContactsPage from './ContactsPage';
import ActivitiesPage from './ActivitiesPage';

/**
 * A FAILED FETCH MUST NOT RENDER A COUNT.
 *
 * Measured on the live app with the API unreachable: Contacts rendered
 * "0 Total Contacts · 0 Active Deals · 0 From Lead Gen · 0 From HRMS ·
 * 0 VIP Contacts" after 2 failed requests, and Activities rendered
 * "0 Total · 0 Today · 0 This Week · 0 Overdue" after 2 more. Both pages already
 * had a correct three-state list BELOW those tiles, so the same screen said
 * "could not load" and "you have none" simultaneously.
 *
 * These tests reject the fetch rather than mocking the page's own state, because
 * the defect was in what the tiles DERIVE from an empty array — state-poking
 * would set the array to empty and prove nothing about which case it came from.
 *
 * AND THEY ASSERT THE FETCH WAS ACTUALLY CALLED. The first version of this file
 * did not, and passed for the wrong reason: this jsdom build has no
 * `localStorage`, so `getAuthHeaders()` threw "Cannot read properties of
 * undefined (reading 'getItem')" before `fetch` was reached. The error banner
 * appeared, every assertion held, and the network path was never exercised —
 * lesson 12, in a component test. `src/test/setup.ts` now provides an in-memory
 * localStorage, and the call count is asserted so the same masking cannot
 * recur silently.
 */

const failFetch = () => vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 5, name: 'David Kumar', role: 'admin' }, logout: vi.fn(), loading: false }),
}));

const realFetch = global.fetch;
beforeEach(() => { global.fetch = failFetch() as unknown as typeof fetch; });
afterEach(() => { global.fetch = realFetch; vi.clearAllMocks(); });

const renderPage = (Page: React.ComponentType) =>
  render(<MemoryRouter><Page /></MemoryRouter>);

const fetchCalls = () => (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

describe('ContactsPage KPI tiles', () => {
  it('shows no count at all when the fetch fails', async () => {
    renderPage(ContactsPage);

    // The error must actually be reached — otherwise this test passes on a
    // page that is merely still loading, which is lesson 2's shape.
    await waitFor(() => expect(screen.getByText(/could not load contacts/i)).toBeInTheDocument());
    expect(fetchCalls(), 'the page never reached the network — this test would pass on a thrown error instead').toBeGreaterThan(0);

    for (const label of ['Total Contacts', 'Active Deals', 'From Lead Gen', 'From HRMS', 'VIP Contacts']) {
      const tile = screen.getByText(label).parentElement!;
      expect(tile.textContent, `"${label}" still reports a number after a failed fetch`).toContain('—');
      expect(tile.textContent).not.toMatch(/\b0\b/);
    }
  });
});

describe('ActivitiesPage KPI tiles', () => {
  it('shows no count at all when the fetch fails', async () => {
    renderPage(ActivitiesPage);

    await waitFor(() => expect(screen.getByText(/could not load activities/i)).toBeInTheDocument());
    expect(fetchCalls(), 'the page never reached the network').toBeGreaterThan(0);

    for (const label of ['Total', 'Today', 'This Week', 'Overdue']) {
      const tile = screen.getAllByText(label)[0].parentElement!;
      expect(tile.textContent, `"${label}" still reports a number after a failed fetch`).toContain('—');
    }
  });

  it('does not tint the Overdue tile as an alert when the count is unknown', async () => {
    renderPage(ActivitiesPage);
    await waitFor(() => expect(screen.getByText(/could not load activities/i)).toBeInTheDocument());

    // An orange tile around a dash reads as "overdue work exists and we cannot
    // show it", which is a claim about the data.
    const tile = screen.getAllByText('Overdue')[0].parentElement!;
    expect(tile.className).not.toContain('orange');
    expect(tile.textContent).not.toContain('⚠️');
  });
});

/**
 * ReportsPage's badge asserted PROVENANCE, which is why it gets its own test.
 *
 * Measured live: 14 failed requests, and the header still read "Figures are
 * live" above "REVENUE WON $0 / From 0 closed-won deals". A badge that vouches
 * for the numbers is worse than a wrong number — it tells the reader the zeros
 * were measured. The subtitles under those cards ("No deals closed yet") are
 * claims about the DATA, not about the request.
 */
describe('ReportsPage freshness badge', () => {
  it('says it could not load, and never asserts liveness, on a failed fetch', async () => {
    const { default: ReportsPage } = await import('./ReportsPage');
    render(<MemoryRouter><ReportsPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getAllByText(/couldn't load live figures/i).length).toBeGreaterThan(0));
    expect(fetchCalls(), 'the page never reached the network').toBeGreaterThan(0);
    expect(screen.queryByText(/figures are live/i)).toBeNull();
  });

  it('offers a retry rather than leaving a page refresh as the only option', async () => {
    const { default: ReportsPage } = await import('./ReportsPage');
    render(<MemoryRouter><ReportsPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getAllByText(/couldn't load live figures/i).length).toBeGreaterThan(0));
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

/**
 * DocumentsLibrary's sidebar counts.
 *
 * Measured live: with the API unreachable the sidebar read "All Documents (0)"
 * beside a list whose empty state said the same thing, so an empty library and a
 * broken request were indistinguishable. CLAUDE.md already records this page's
 * counts as a prior fabrication site — the strip once advertised 247 documents
 * over a correctly-empty list — so the counts get their own test rather than
 * riding on the list's.
 */
describe('DocumentsLibrary sidebar counts', () => {
  it('omits the counts rather than zeroing them when the fetch fails', async () => {
    const { default: DocumentsLibrary } = await import('./DocumentsLibrary');
    render(<MemoryRouter><DocumentsLibrary /></MemoryRouter>);

    const allDocs = await waitFor(() => screen.getByText('All Documents'));
    expect(fetchCalls(), 'the page never reached the network').toBeGreaterThan(0);

    // The count sits in a sibling span within the same button.
    const row = allDocs.closest('button')!;
    expect(row.textContent, 'the sidebar still reports a document count after a failed fetch').toContain('—');
    expect(row.textContent).not.toContain('(0)');
  });

  it('omits EVERY facet count, not just the quick filters', async () => {
    const { default: DocumentsLibrary } = await import('./DocumentsLibrary');
    render(<MemoryRouter><DocumentsLibrary /></MemoryRouter>);
    await waitFor(() => screen.getByText('All Documents'));

    // Found by walking the real page with the API failing: the quick-filter
    // counts had been fixed and the category, file-type, related-to and date
    // counts below them still read "(0)" — the same defect one block down.
    for (const label of ['Proposal', 'Contract', 'Presentation']) {
      const row = screen.getByText(new RegExp(`${label}$`)).closest('button');
      if (!row) continue;
      expect(row.textContent, `"${label}" still reports a count after a failed fetch`).toContain('—');
    }
  });

  it('keeps the Favorites count, which is local state and genuinely known', async () => {
    const { default: DocumentsLibrary } = await import('./DocumentsLibrary');
    render(<MemoryRouter><DocumentsLibrary /></MemoryRouter>);

    const favorites = await waitFor(() => screen.getByText('Favorites'));
    // `starredDocs` is per-viewer local state, never fetched, so a failed
    // request does not make it unknown.
    expect(favorites.closest('button')!.textContent).toContain('(0)');
  });
});
