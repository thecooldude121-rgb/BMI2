import { describe, it, expect, vi, afterEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AccountIntelligencePanel from './AccountIntelligencePanel';

/**
 * The panel, rendered from a mocked server envelope only.
 *
 * WHAT THESE PIN — in the order that matters for PLACEHOLDER content:
 *  1. Sample content is never mistakable for real: the badge renders, and no
 *     source, date or link appears when the provider supplied none.
 *  2. The four states stay four. Only an `ok` response with an empty list says
 *     "this account has no signals".
 *  3. `preview` is read from the PAYLOAD, not inferred from the provider name,
 *     so a future real provider is not silently disclaimed and a future mock
 *     is not silently trusted.
 */

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
let fetchMock: Mock<FetchFn>;

const envelope = (over: Record<string, unknown> = {}) => ({
  success: true,
  data: {
    status: 'ok',
    company_domain: 'example.test',
    provider: 'mock',
    preview: true,
    preview_note: 'PREVIEW · SAMPLE CONTENT — these items are placeholders, not real news.',
    signals: [
      {
        category: 'news', headline: 'Sample: company announces a regional expansion',
        summary: 'Placeholder text.', source: null, url: null, published_at: null,
      },
      {
        category: 'hiring', headline: 'Sample: several open engineering roles posted',
        summary: 'Placeholder text.', source: null, url: null, published_at: null,
      },
    ],
    ...over,
  },
});

function server(body: unknown, status = 200) {
  fetchMock = vi.fn(async () => ({
    ok: status >= 200 && status < 300, status, json: async () => body,
  } as Response));
  vi.stubGlobal('fetch', fetchMock);
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('sample content is labelled and unsourced', () => {
  it('renders the PREVIEW · SAMPLE CONTENT badge and its note', async () => {
    server(envelope());
    render(<AccountIntelligencePanel companyId="C001" />);

    // The phrase appears twice on purpose — once as the badge, once inside
    // the note — so this targets the badge element specifically rather
    // than asserting the phrase is unique.
    await waitFor(() => expect(
      screen.getByText('Preview · sample content', { selector: 'span' }),
    ).toBeInTheDocument());
    expect(screen.getByText(/these items are placeholders, not real news/i)).toBeInTheDocument();
  });

  it('renders NO source, date or link when the provider supplied none', async () => {
    server(envelope());
    render(<AccountIntelligencePanel companyId="C001" />);

    await waitFor(() => expect(screen.getByText(/regional expansion/)).toBeInTheDocument());
    // The strongest claim an item can make is a link. There must be none.
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(/Read more/)).not.toBeInTheDocument();
  });

  it('DOES render a source and link when a real provider supplies them', async () => {
    // The inverse, so the test above is not passing merely because the panel
    // cannot render these at all.
    server(envelope({
      preview: false, preview_note: null, provider: 'leadgen',
      signals: [{
        category: 'news', headline: 'Real headline', summary: 'Real summary.',
        source: 'Some Outlet', url: 'https://example.test/article', published_at: '2026-09-01',
      }],
    }));
    render(<AccountIntelligencePanel companyId="C001" />);

    await waitFor(() => expect(screen.getByText('Real headline')).toBeInTheDocument());
    expect(screen.getByText(/Some Outlet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Read more/ })).toBeInTheDocument();
    // ...and no sample-content badge, because the payload said preview: false.
    expect(screen.queryByText(/Preview · sample content/i)).not.toBeInTheDocument();
  });

  it('takes `preview` from the payload, not from the provider name', async () => {
    // A provider called "mock" that declares preview:false is contradictory,
    // and the panel must follow the declared flag rather than the name — the
    // name is not a contract.
    server(envelope({ preview: false, preview_note: null }));
    render(<AccountIntelligencePanel companyId="C001" />);

    await waitFor(() => expect(screen.getByText(/regional expansion/)).toBeInTheDocument());
    expect(screen.queryByText(/Preview · sample content/i)).not.toBeInTheDocument();
  });
});

describe('the four states stay four', () => {
  it('"no domain" says so, and is not an empty signal list', async () => {
    server(envelope({
      status: 'no_domain', company_domain: null, signals: [], preview_note: null,
      detail: 'This account has no website domain recorded, so there is nothing to look up.',
    }));
    render(<AccountIntelligencePanel companyId="C001" />);

    await waitFor(() => expect(screen.getByText(/no website domain recorded/)).toBeInTheDocument());
    expect(screen.getByText(/Add a domain on the account/)).toBeInTheDocument();
    expect(screen.queryByText(/No signals are recorded/)).not.toBeInTheDocument();
  });

  it('a provider error says it could not load — not that there is nothing', async () => {
    server(envelope({ status: 'error', signals: [], preview_note: null, detail: 'Upstream timed out.' }));
    render(<AccountIntelligencePanel companyId="C001" />);

    await waitFor(() => expect(screen.getByText(/Couldn.t load signals/)).toBeInTheDocument());
    expect(screen.getByText(/Upstream timed out/)).toBeInTheDocument();
    expect(screen.queryByText(/No signals are recorded/)).not.toBeInTheDocument();
  });

  it('a TRANSPORT failure is also not an empty result', async () => {
    server({ message: 'Company not found' }, 404);
    render(<AccountIntelligencePanel companyId="C404" />);

    await waitFor(() => expect(screen.getByText(/Couldn.t load signals/)).toBeInTheDocument());
    expect(screen.getByText(/Company not found/)).toBeInTheDocument();
  });

  it('only an OK response with an empty list means "no signals"', async () => {
    server(envelope({ signals: [], preview_note: null }));
    render(<AccountIntelligencePanel companyId="C001" />);

    await waitFor(() => expect(screen.getByText(/No signals are recorded for example.test/)).toBeInTheDocument());
    expect(screen.queryByText(/Couldn.t load signals/)).not.toBeInTheDocument();
  });
});
