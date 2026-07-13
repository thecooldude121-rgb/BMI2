import { describe, it, expect } from 'vitest';
import { computeConversionReadiness, DEAL_CONVERSION_THRESHOLDS } from './conversionReadiness';
import type { MultiFactorScore, MultiFactorDim } from './leadScoring/multiFactorScore';
import { makeLead } from '../__tests__/fixtures/leadFixtures';

const T = DEAL_CONVERSION_THRESHOLDS;

function dim(score: number): MultiFactorDim {
  return { score, band: 'medium', bandLabel: 'Medium', detail: 'test' };
}

function makeMFS(overrides: {
  fit?: number; intent?: number; engagement?: number; confidence?: number; overall?: number;
} = {}): MultiFactorScore {
  const fit        = overrides.fit        ?? 70;
  const intent     = overrides.intent     ?? 50;
  const engagement = overrides.engagement ?? 50;
  const confidence = overrides.confidence ?? 60;
  const overall    = overrides.overall    ?? 70;
  return {
    fitScore:        dim(fit),
    intentScore:     dim(intent),
    engagementScore: dim(engagement),
    confidenceScore: dim(confidence),
    overallScore:    overall,
    overallBand:     'high',
    overallBandLabel: 'High',
  };
}

// Fully-qualified lead that meets all deal thresholds (used as base in most tests)
const QUALIFIED_LEAD = makeLead({
  is_qualified: true,
  email: 'jane@acme.com',
  company: 'Acme',
});

const ABOVE_THRESHOLD = makeMFS({ fit: T.fitScore + 5, intent: T.intentScore + 5, overall: T.overallScore + 5 });
const BELOW_THRESHOLD = makeMFS({ fit: T.fitScore - 1, intent: T.intentScore - 1, overall: T.overallScore - 1 });

describe('computeConversionReadiness', () => {
  describe('converted status', () => {
    it('returns ready_for_deal with label "Converted" regardless of scores', () => {
      const lead = makeLead({ status: 'converted' });
      const result = computeConversionReadiness(lead, BELOW_THRESHOLD);
      expect(result.state).toBe('ready_for_deal');
      expect(result.label).toBe('Converted');
      expect(result.reasons).toHaveLength(0);
    });
  });

  describe('sales_accepted status', () => {
    it('returns ready_for_account_contact when deal threshold not met', () => {
      const lead = makeLead({ status: 'sales_accepted', email: 'j@acme.com', company: 'Acme' });
      const result = computeConversionReadiness(lead, BELOW_THRESHOLD);
      expect(result.state).toBe('ready_for_account_contact');
      expect(result.label).toBe('Sales accepted');
      expect(result.reasons.some(r => r.includes('raise'))).toBe(true);
    });

    it('returns ready_for_deal when deal threshold is met', () => {
      const lead = makeLead({ status: 'sales_accepted', email: 'j@acme.com', company: 'Acme' });
      const result = computeConversionReadiness(lead, ABOVE_THRESHOLD);
      expect(result.state).toBe('ready_for_deal');
    });
  });

  describe('terminal statuses', () => {
    it('lost → not_ready', () => {
      const lead = makeLead({ status: 'lost' });
      const result = computeConversionReadiness(lead, ABOVE_THRESHOLD);
      expect(result.state).toBe('not_ready');
      expect(result.reasons[0]).toMatch(/disqualified or lost/);
    });

    it('disqualified → not_ready', () => {
      const lead = makeLead({ status: 'disqualified' });
      const result = computeConversionReadiness(lead, ABOVE_THRESHOLD);
      expect(result.state).toBe('not_ready');
    });
  });

  describe('very low fit', () => {
    it('fit < 25 and not qualified → not_ready', () => {
      const lead = makeLead({ is_qualified: false });
      const mfs = makeMFS({ fit: 20 });
      const result = computeConversionReadiness(lead, mfs);
      expect(result.state).toBe('not_ready');
      expect(result.reasons[0]).toMatch(/ICP fit score/);
    });

    it('fit < 25 but qualified is NOT blocked by the fit check', () => {
      // The terminal+fit check is: isTerminal || (fit < 25 && !isQualified)
      // So a qualified lead with low fit passes this gate and continues
      const lead = makeLead({ is_qualified: true, email: 'j@acme.com', company: 'Acme' });
      const mfs = makeMFS({ fit: 20, overall: T.overallScore + 5, intent: T.intentScore + 5 });
      const result = computeConversionReadiness(lead, mfs);
      // qualified + contact + company + above threshold → ready_for_deal
      expect(result.state).toBe('ready_for_deal');
    });
  });

  describe('ready_for_deal', () => {
    it('qualified + contact + company + above threshold → ready_for_deal', () => {
      const result = computeConversionReadiness(QUALIFIED_LEAD, ABOVE_THRESHOLD);
      expect(result.state).toBe('ready_for_deal');
      expect(result.label).toBe('Ready for deal');
      expect(result.reasons).toHaveLength(0);
    });
  });

  describe('ready_for_account_contact', () => {
    it('qualified + contact + company + below threshold → ready_for_account_contact', () => {
      const result = computeConversionReadiness(QUALIFIED_LEAD, BELOW_THRESHOLD);
      expect(result.state).toBe('ready_for_account_contact');
      expect(result.label).toBe('Ready for account + contact');
      expect(result.reasons.some(r => r.includes('raise'))).toBe(true);
    });
  });

  describe('ready_for_contact', () => {
    it('qualified + contact info + no company → ready_for_contact (add company reason)', () => {
      const lead = makeLead({ is_qualified: true, email: 'j@acme.com', company: undefined });
      const result = computeConversionReadiness(lead, ABOVE_THRESHOLD);
      expect(result.state).toBe('ready_for_contact');
      expect(result.reasons[0]).toMatch(/company name/);
    });

    it('qualified + no contact info → ready_for_contact (add contact reason)', () => {
      const lead = makeLead({ is_qualified: true, email: undefined, phone: undefined, mobile: undefined, company: 'Acme' });
      const result = computeConversionReadiness(lead, ABOVE_THRESHOLD);
      expect(result.state).toBe('ready_for_contact');
      expect(result.reasons[0]).toMatch(/email or phone/);
    });
  });

  describe('needs_qualification', () => {
    it('not qualified + fit ≥ 40 + overall ≥ 40 → needs_qualification', () => {
      const lead = makeLead({ is_qualified: false, email: 'j@acme.com', company: 'Acme' });
      const mfs = makeMFS({ fit: 45, overall: 50 });
      const result = computeConversionReadiness(lead, mfs);
      expect(result.state).toBe('needs_qualification');
      expect(result.reasons[0]).toMatch(/qualify/i);
    });

    it('appends "add email or phone" reason when contact info missing', () => {
      const lead = makeLead({ is_qualified: false, email: undefined, phone: undefined, mobile: undefined, company: 'Acme' });
      const mfs = makeMFS({ fit: 45, overall: 50 });
      const result = computeConversionReadiness(lead, mfs);
      expect(result.state).toBe('needs_qualification');
      expect(result.reasons.some(r => r.includes('email or phone'))).toBe(true);
    });
  });

  describe('needs_enrichment', () => {
    it('low confidence + not enriched → needs_enrichment', () => {
      // fit=30 (≥ 25, so passes the low-fit gate) but < 40 (so needs_qualification doesn't fire)
      // overall=30 (< 40, so needs_qualification requires overall ≥ 40 — doesn't fire)
      // confidence=30 (< 40) + no enriched_at → needs_enrichment
      const lead = makeLead({ is_qualified: false, enriched_at: undefined });
      const mfs = makeMFS({ fit: 30, confidence: 30, overall: 30 });
      const result = computeConversionReadiness(lead, mfs);
      expect(result.state).toBe('needs_enrichment');
      expect(result.reasons[0]).toMatch(/enrich/i);
    });

    it('low confidence but already enriched does NOT trigger needs_enrichment', () => {
      const lead = makeLead({ is_qualified: false, enriched_at: '2026-01-01T00:00:00.000Z' });
      const mfs = makeMFS({ fit: 30, confidence: 30, overall: 30 });
      const result = computeConversionReadiness(lead, mfs);
      // Falls through to default not_ready
      expect(result.state).toBe('not_ready');
    });
  });

  describe('checklist', () => {
    it('includes all 7 items', () => {
      const result = computeConversionReadiness(QUALIFIED_LEAD, ABOVE_THRESHOLD);
      expect(result.checklist).toHaveLength(7);
    });

    it('marks "Formally qualified" as met when is_qualified is true', () => {
      const result = computeConversionReadiness(QUALIFIED_LEAD, ABOVE_THRESHOLD);
      const item = result.checklist.find(c => c.label === 'Formally qualified');
      expect(item?.met).toBe(true);
    });

    it('marks "Email or phone on file" as met when email present', () => {
      const result = computeConversionReadiness(QUALIFIED_LEAD, ABOVE_THRESHOLD);
      const item = result.checklist.find(c => c.label === 'Email or phone on file');
      expect(item?.met).toBe(true);
    });
  });
});
