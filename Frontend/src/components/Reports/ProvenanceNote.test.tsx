import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProvenanceNote from './ProvenanceNote';
import type { Provenance } from '../../utils/reportsApi';

/**
 * THE SEEDED-DATA DISCLOSURE.
 *
 * The requirement carried forward from Wave 8 is not "show a coverage number".
 * It is that a reader can never mistake seeded demo rows for their own data, and
 * can never mistake "we did not measure this" for "the answer is zero".
 *
 * So the properties pinned here are about what CANNOT be rendered:
 *   - the sentence is never rewritten, reworded or recomposed client-side
 *   - `rows_seeded: null` never renders as 0, or as 0%
 *   - coverage and the seeded share are never collapsed into one figure
 */

const p = (over: Partial<Provenance> = {}): Provenance => ({
  rows_returned: 10,
  rows_matched: 10,
  rows_seeded: 2,
  rows_real: 8,
  seeded_share: 0.2,
  mostly_seeded: false,
  excluded_test: 0,
  coverage: [],
  truncated: false,
  row_limit: 5000,
  disclosure: '2 of 10 rows (20%) are seeded demo data.',
  ...over,
});

describe('the disclosure sentence is the server\'s, verbatim', () => {
  it('renders exactly what the server composed', () => {
    render(<ProvenanceNote provenance={p()} />);
    expect(screen.getByText('2 of 10 rows (20%) are seeded demo data.')).toBeInTheDocument();
  });

  it('renders an unfamiliar sentence unchanged rather than reformatting it', () => {
    // The server owns the wording. If it changes the sentence, this component
    // must carry the new one through — not fall back to a phrasing of its own,
    // which is how two descriptions of the same data start to disagree.
    const odd = 'Every row in this report is seeded demo data. None of it is yours.';
    render(<ProvenanceNote provenance={p({ disclosure: odd })} />);
    expect(screen.getByText(odd)).toBeInTheDocument();
  });
});

describe('unmeasurable is not zero', () => {
  it('says the seeded count is not recorded, and never shows 0 or 0%', () => {
    render(<ProvenanceNote provenance={p({
      rows_seeded: null, rows_real: null, seeded_share: null,
      disclosure: 'Whether these rows are seeded demo data is not recorded for this module.',
    })} />);

    // Said in BOTH places — the sentence and the figure — which is why this
    // matches all of them rather than expecting exactly one.
    expect(screen.getAllByText(/not recorded/i).length).toBeGreaterThan(0);

    // The whole point: an unmeasured share must not read as a measured zero.
    // Asserted over the element's full text, so a stray "0" anywhere in the
    // note fails rather than only a standalone text node.
    const text = screen.getByTestId('provenance-note').textContent ?? '';
    expect(text).not.toMatch(/\b0\b/);
    expect(text).not.toMatch(/0%/);
  });
});

describe('coverage and the seeded share are separate facts', () => {
  it('renders a coverage entry alongside the seeded share, not merged into it', () => {
    render(<ProvenanceNote provenance={p({
      coverage: [{ join: 'companies', label: 'Account', matched: 3, of: 24 }],
    })} />);

    // Both numbers are present and distinguishable.
    expect(screen.getByTestId('provenance-note')).toHaveTextContent(/Account/);
    expect(screen.getByTestId('provenance-note')).toHaveTextContent(/3/);
    expect(screen.getByTestId('provenance-note')).toHaveTextContent(/24/);
    expect(screen.getByTestId('provenance-note')).toHaveTextContent(/20%|2 of 10/);
  });
});

describe('a mostly-seeded or truncated result is escalated, not just annotated', () => {
  it('marks mostly-seeded on the element, so it cannot be styled away silently', () => {
    render(<ProvenanceNote provenance={p({
      rows_seeded: 9, rows_real: 1, seeded_share: 0.9, mostly_seeded: true,
      disclosure: '9 of 10 rows (90%) are seeded demo data.',
    })} />);
    expect(screen.getByTestId('provenance-note')).toHaveAttribute('data-mostly-seeded', 'true');
  });

  it('states truncation, because a capped result answers a different question', () => {
    render(<ProvenanceNote provenance={p({
      rows_returned: 5000, rows_matched: 5000, truncated: true,
      disclosure: 'Showing the first 5,000 rows; more matched.',
    })} />);
    expect(screen.getByText(/first 5,000 rows/)).toBeInTheDocument();
  });

  it('does not escalate an ordinary result', () => {
    render(<ProvenanceNote provenance={p()} />);
    expect(screen.getByTestId('provenance-note')).toHaveAttribute('data-mostly-seeded', 'false');
  });
});
