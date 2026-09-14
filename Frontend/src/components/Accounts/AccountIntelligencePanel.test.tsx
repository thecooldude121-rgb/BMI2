import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccountIntelligencePanel from './AccountIntelligencePanel';
import type { AccountIntelligence } from '../../utils/accountIntelligenceApi';

/**
 * The property under test is that the panel's FOUR empty-ish states stay
 * distinguishable on screen.
 *
 * This page's history is the reason: it previously rendered invented scores and
 * a fabricated timeline, and the lesson recorded at the top of
 * EnhancedAccountDetailView is that an absence presented as a fact is the same
 * class of bug. "Lead Gen isn't connected", "this account has no domain", "the
 * request failed" and "connected, asked, nothing recorded" must never read as
 * the same blank list.
 */
describe('AccountIntelligencePanel', () => {
  it('shows a loading state rather than an empty one while in flight', () => {
    const { container } = render(<AccountIntelligencePanel data={null} loading error={null} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText(/no signals recorded/i)).not.toBeInTheDocument();
  });

  it('not connected says so, and does not claim there are no signals', () => {
    render(<AccountIntelligencePanel data={{ status: 'not_linked', signals: [] }} loading={false} error={null} />);
    expect(screen.getByText(/Lead Gen is not connected to this workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/Connected Modules/i)).toBeInTheDocument();
    expect(screen.queryByText(/no signals/i)).not.toBeInTheDocument();
  });

  it('no domain is its own message, not "not connected" and not "no signals"', () => {
    render(<AccountIntelligencePanel data={{ status: 'no_domain', signals: [] }} loading={false} error={null} />);
    expect(screen.getByText(/no website domain recorded/i)).toBeInTheDocument();
    expect(screen.queryByText(/not connected to this workspace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no signals recorded/i)).not.toBeInTheDocument();
  });

  it('a failure says the request did not complete, not that there is nothing', () => {
    render(<AccountIntelligencePanel data={null} loading={false} error="ECONNREFUSED" />);
    expect(screen.getByText(/Couldn't load account intelligence right now/i)).toBeInTheDocument();
    expect(screen.getByText(/does not mean there are no signals/i)).toBeInTheDocument();
  });

  it('connected with nothing recorded names the domain it actually asked about', () => {
    const data: AccountIntelligence = { status: 'ok', signals: [], company_domain: 'northwind.example' };
    render(<AccountIntelligencePanel data={data} loading={false} error={null} />);
    expect(screen.getByText(/has no signals recorded for/i)).toBeInTheDocument();
    expect(screen.getByText('northwind.example')).toBeInTheDocument();
  });

  it('renders each signal with its category, date and source link', () => {
    const data: AccountIntelligence = {
      status: 'ok',
      company_domain: 'northwind.example',
      signals: [
        { id: 's1', source: 'sample', category: 'funding', headline: 'Raises Series B', url: 'https://e.example/f', published_at: '2026-09-10T00:00:00.000Z' },
        { id: 's2', source: null, category: 'hiring', headline: 'Hiring 14 engineers', url: null, published_at: null },
      ],
    };
    render(<AccountIntelligencePanel data={data} loading={false} error={null} />);

    expect(screen.getByText('Raises Series B')).toBeInTheDocument();
    expect(screen.getByText('Hiring 14 engineers')).toBeInTheDocument();
    expect(screen.getByText('Funding')).toBeInTheDocument();
    expect(screen.getByText('Hiring')).toBeInTheDocument();

    // Exactly one source link — the signal with no url gets none, rather than a
    // dead link or an invented one.
    const links = screen.getAllByRole('link', { name: /source/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://e.example/f');
    expect(links[0]).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('an unfamiliar category still renders, labelled with what Lead Gen sent', () => {
    const data: AccountIntelligence = {
      status: 'ok',
      signals: [{ id: 's9', source: null, category: 'partnership', headline: 'Signed a reseller deal', url: null, published_at: null }],
    };
    render(<AccountIntelligencePanel data={data} loading={false} error={null} />);
    // Lead Gen owns this vocabulary and can add to it without this page
    // shipping first; dropping the row would lose real information.
    expect(screen.getByText('Signed a reseller deal')).toBeInTheDocument();
    expect(screen.getByText('partnership')).toBeInTheDocument();
  });
});
