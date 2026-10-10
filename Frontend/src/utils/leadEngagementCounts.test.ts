import { describe, it, expect } from 'vitest';
import { mapRowToLead } from './leadsApi';
import { LeadScoringEngine } from './leadScoring';
import { computeMultiFactorScore } from './leadScoring/multiFactorScore';
import { explainScore } from './leadScoring/scoreExplainer';
import { buildSalesMemory } from './leadTimeline';
import { makeLead } from '../__tests__/fixtures/leadFixtures';

/**
 * Engagement scoring fix (2026-10-10). Calls, meetings and emails sent are the
 * SERVER's counts of logged activity — no longer a hardcoded 0 — and email
 * opens, clicks and page views, which nothing records, are "not tracked": null,
 * never 0, and never the basis of a claim like "no opens".
 */
const untracked = { email_opens_count: null, email_clicks_count: null, page_views_count: null };

describe('mapRowToLead — engagement fields', () => {
  it('takes the counts the server served; an absent count is unknown (null), not 0', () => {
    const l = mapRowToLead({ id: 1, call_count: 3, meeting_count: '2', email_sent_count: 0 });
    expect([l.call_count, l.meeting_count, l.email_sent_count]).toEqual([3, 2, 0]);
    expect(mapRowToLead({ id: 1 }).call_count).toBeNull();
  });
  it('opens / clicks / page views are always null — even if a row claimed a number', () => {
    const l = mapRowToLead({ id: 1, email_opens_count: 9, email_clicks_count: 4, page_views_count: 7 });
    expect([l.email_opens_count, l.email_clicks_count, l.page_views_count]).toEqual([null, null, null]);
  });
});

describe('scoring with real counts and untracked signals', () => {
  const lead = makeLead({ ...untracked, call_count: 3, meeting_count: 2, email_sent_count: 2 });
  const factor = (name: string) => LeadScoringEngine.calculateDetailedScore(lead).factors.find(f => f.name === name)!;

  it('logged calls and meetings now score (they read "0 calls" before)', () => {
    const depth = factor('Engagement Depth');
    expect(depth.description).toBe('2 meetings, 3 calls, page views not tracked');
    expect(depth.points).toBe(8 + 5); // meetings capped at 8, calls capped at 5
  });

  it('email opens and clicks say "not tracked", never "0 opens"', () => {
    const email = factor('Email Engagement');
    expect(email.description).toBe('Email opens and clicks are not tracked');
    expect(email.points).toBe(0);
  });

  it('no next-best-action or signal is built on untracked opens', () => {
    const { nextBestActions } = LeadScoringEngine.calculateDetailedScore(lead);
    expect(nextBestActions).not.toContain('Try different email subject lines');
    const expl = explainScore(lead, computeMultiFactorScore(lead));
    const labels = JSON.stringify(expl);
    expect(labels).not.toMatch(/no opens/i);
    expect(labels).toMatch(/2 emails sent/);
    expect(buildSalesMemory(lead)).not.toMatch(/no opens/i);
    expect(buildSalesMemory(lead)).toMatch(/2 emails; 3 calls; 2 meetings/);
  });

  it('an unknown count earns nothing and says it is unknown', () => {
    const unknown = makeLead({ ...untracked, call_count: null, meeting_count: null, email_sent_count: null });
    const depth = LeadScoringEngine.calculateDetailedScore(unknown).factors.find(f => f.name === 'Engagement Depth')!;
    expect(depth.description).toBe('meetings unknown, calls unknown, page views not tracked');
    expect(depth.points).toBe(0);
  });
});
