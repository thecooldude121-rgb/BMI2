import { describe, it, expect } from 'vitest';
import { computeNBA } from './engine';
import { HEALTHY_SLA_RESULT } from '../leadSla/engine';
import type { LeadSLAResult } from '../leadSla/engine';
import type { MultiFactorScore, MultiFactorDim } from '../leadScoring/multiFactorScore';
import { makeLead } from '../../__tests__/fixtures/leadFixtures';

function dim(score: number): MultiFactorDim {
  return { score, band: 'medium', bandLabel: 'Medium', detail: 'test' };
}

function makeMFS(overrides: { fit?: number; intent?: number; engagement?: number; confidence?: number; overall?: number } = {}): MultiFactorScore {
  const fit        = overrides.fit        ?? 50;
  const intent     = overrides.intent     ?? 40;
  const engagement = overrides.engagement ?? 50;
  const confidence = overrides.confidence ?? 60;
  const overall    = overrides.overall    ?? 55;
  return {
    fitScore:        dim(fit),
    intentScore:     dim(intent),
    engagementScore: dim(engagement),
    confidenceScore: dim(confidence),
    overallScore:    overall,
    overallBand:     'medium',
    overallBandLabel: 'Medium',
  };
}

function breachedSLA(): LeadSLAResult {
  return {
    ...HEALTHY_SLA_RESULT,
    firstResponse: {
      severity: 'breached', ageHours: 30, limitHours: 24,
      pct: 1.25, resolvedAt: null, escalate: false,
    },
    overall: 'breached',
  };
}

// Moderate MFS — avoids triggering high-fit/intent or low-score branches
const MODERATE_MFS = makeMFS({ fit: 50, intent: 35, overall: 50, confidence: 60 });

describe('computeNBA — priority stack', () => {
  it('step 1: isDuplicateRisk → merge_duplicate, high priority', () => {
    const lead = makeLead({ status: 'new' });
    const result = computeNBA(lead, { isDuplicateRisk: true, slaResult: HEALTHY_SLA_RESULT, mfs: MODERATE_MFS });
    expect(result.action.id).toBe('merge_duplicate');
    expect(result.priority).toBe('high');
  });

  it('step 2: converted + no deal linked → create_deal, high', () => {
    const lead = makeLead({ status: 'converted', converted_to_deal_id: undefined });
    const result = computeNBA(lead, { slaResult: HEALTHY_SLA_RESULT, mfs: MODERATE_MFS });
    expect(result.action.id).toBe('create_deal');
    expect(result.priority).toBe('high');
  });

  it('step 3: converted + deal linked → view_deal, low', () => {
    const lead = makeLead({ status: 'converted', converted_to_deal_id: 'deal-123' });
    const result = computeNBA(lead, { slaResult: HEALTHY_SLA_RESULT, mfs: MODERATE_MFS });
    expect(result.action.id).toBe('view_deal');
    expect(result.priority).toBe('low');
  });

  it('step 4: SLA first-response breached → call_now, urgent', () => {
    const lead = makeLead({ status: 'new', first_contact_date: undefined });
    const result = computeNBA(lead, { isDuplicateRisk: false, slaResult: breachedSLA(), mfs: MODERATE_MFS });
    expect(result.action.id).toBe('call_now');
    expect(result.priority).toBe('urgent');
  });

  it('step 5: overdue + untouched → contact_now, urgent', () => {
    const lead = makeLead({ status: 'new' });
    const result = computeNBA(lead, {
      isOverdue: true, isUntouched: true,
      slaResult: HEALTHY_SLA_RESULT, mfs: MODERATE_MFS,
    });
    expect(result.action.id).toBe('contact_now');
    expect(result.priority).toBe('urgent');
  });

  it('step 6: overdue but not untouched → follow_up_now, high', () => {
    const lead = makeLead({ status: 'new' });
    const result = computeNBA(lead, {
      isOverdue: true, isUntouched: false,
      slaResult: HEALTHY_SLA_RESULT, mfs: MODERATE_MFS,
    });
    expect(result.action.id).toBe('follow_up_now');
    expect(result.priority).toBe('high');
  });

  it('step 7: new status + no contact → source-native first action', () => {
    const lead = makeLead({ status: 'new', source: 'inbound', last_contact_date: undefined });
    const result = computeNBA(lead, {
      isOverdue: false, isUntouched: false,
      slaResult: HEALTHY_SLA_RESULT, mfs: MODERATE_MFS,
    });
    // inbound → playbook first action drives label; action comes from playbook
    expect(result.priority).toBe('high');
    expect(result.reason).toMatch(/no contact logged/i);
  });

  it('step 8: high fit + intent + active status → book_discovery', () => {
    const lead = makeLead({ status: 'engaged', last_contact_date: '2026-05-01T00:00:00.000Z' });
    const highMFS = makeMFS({ fit: 70, intent: 55 });
    const result = computeNBA(lead, {
      isOverdue: false, isUntouched: false,
      slaResult: HEALTHY_SLA_RESULT, mfs: highMFS,
    });
    expect(result.action.id).toBe('book_discovery');
    expect(result.priority).toBe('high');
  });

  it('step 8 does not fire when intent below threshold (50)', () => {
    // 'nurture' is in inProgressStatuses; high fit but intent=45 < 50 → step 8 misses
    // readiness: not qualified → needs_qualification (not handled by step 9)
    // step 12 for nurture → check_in
    const lead = makeLead({ status: 'nurture', last_contact_date: '2026-05-25T00:00:00.000Z', is_qualified: false });
    const highFitLowIntentMFS = makeMFS({ fit: 70, intent: 45, overall: 55 });
    const result = computeNBA(lead, {
      isOverdue: false, isUntouched: false,
      slaResult: HEALTHY_SLA_RESULT, mfs: highFitLowIntentMFS,
    });
    expect(result.action.id).toBe('check_in');
  });

  it('step 10: low confidence + not enriched → enrich', () => {
    // 'new' + last_contact_date set (step 7 doesn't fire); fit=30 < 65 (step 8 misses)
    // readiness: !qualified, fit=30 < 40 → not needs_qualification; confidence=30 → needs_enrichment
    // step 9 doesn't handle needs_enrichment → step 10 fires
    const lead = makeLead({
      status: 'new',
      last_contact_date: '2026-05-28T00:00:00.000Z',
      is_qualified: false,
      enriched_at: undefined,
    });
    const lowConfMFS = makeMFS({ fit: 30, intent: 25, confidence: 30, overall: 30 });
    const result = computeNBA(lead, {
      isOverdue: false, isUntouched: false,
      slaResult: HEALTHY_SLA_RESULT, mfs: lowConfMFS,
    });
    expect(result.action.id).toBe('enrich');
  });

  it('step 11: very low scores + not qualified → mark_nurture', () => {
    // 'new' + last_contact_date (step 7 misses); very low scores → step 11 fires
    // enriched_at set to avoid step 10; status not 'qualified' → mark_nurture
    const lead = makeLead({
      status: 'new',
      last_contact_date: '2026-05-28T00:00:00.000Z',
      is_qualified: false,
      enriched_at: '2026-01-01T00:00:00.000Z',
    });
    const veryLowMFS = makeMFS({ fit: 20, intent: 15, overall: 20, confidence: 60 });
    const result = computeNBA(lead, {
      isOverdue: false, isUntouched: false,
      slaResult: HEALTHY_SLA_RESULT, mfs: veryLowMFS,
    });
    expect(result.action.id).toBe('mark_nurture');
    expect(result.priority).toBe('low');
  });
});

describe('computeNBA — status-based defaults (step 12)', () => {
  function defaultResult(status: Parameters<typeof makeLead>[0]['status']) {
    const lead = makeLead({
      status,
      last_contact_date: '2026-05-25T00:00:00.000Z',
      is_qualified: status === 'qualified',
    });
    // moderate scores to avoid triggering earlier steps
    return computeNBA(lead, {
      isOverdue: false, isUntouched: false,
      slaResult: HEALTHY_SLA_RESULT, mfs: MODERATE_MFS,
    });
  }

  it('assigned → send_first_outreach', () => {
    expect(defaultResult('assigned').action.id).toBe('send_first_outreach');
  });

  it('enriching → enrich', () => {
    expect(defaultResult('enriching').action.id).toBe('enrich');
  });

  it('attempting_contact → follow_up', () => {
    expect(defaultResult('attempting_contact').action.id).toBe('follow_up');
  });

  it('nurture → check_in', () => {
    expect(defaultResult('nurture').action.id).toBe('check_in');
  });

  it('lost → revive', () => {
    expect(defaultResult('lost').action.id).toBe('revive');
  });

  it('disqualified → revive', () => {
    expect(defaultResult('disqualified').action.id).toBe('revive');
  });
});
