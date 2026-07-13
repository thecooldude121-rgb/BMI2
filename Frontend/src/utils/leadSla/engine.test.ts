import { describe, it, expect } from 'vitest';
import { computeLeadSLA } from './engine';
import type { SLAConfig } from './config';
import { makeLead } from '../../__tests__/fixtures/leadFixtures';

// Minimal inline config — avoids importing DEFAULT_SLA_CONFIG (which calls buildSLAThresholds)
const CFG: SLAConfig = {
  firstResponse: {
    thresholds: { referral: 4 },
    defaultHours: 24,
    atRiskPct: 0.75,
  },
  followUp: { graceHours: 2 },
  stale: {
    atRiskDays: 21,
    breachDays: 30,
    activeStatuses: ['new', 'assigned', 'enriching', 'attempting_contact', 'engaged', 'nurture'],
  },
  escalation: { multiplier: 2.0 },
};

// Reference point for all time-sensitive tests
const NOW = new Date('2026-06-01T12:00:00.000Z');

function hoursAgo(h: number): string {
  return new Date(NOW.getTime() - h * 3_600_000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(NOW.getTime() - d * 86_400_000).toISOString();
}

function daysFromNow(d: number): string {
  return new Date(NOW.getTime() + d * 86_400_000).toISOString();
}

// ── firstResponse track ────────────────────────────────────────────────────────

describe('computeLeadSLA — firstResponse', () => {
  it('is na for non-new leads', () => {
    const lead = makeLead({ status: 'engaged', created_at: hoursAgo(10) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.firstResponse.severity).toBe('na');
  });

  it('is resolved (healthy) when first_contact_date is set', () => {
    const lead = makeLead({ status: 'new', created_at: hoursAgo(30), first_contact_date: hoursAgo(1) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.firstResponse.severity).toBe('healthy');
    expect(result.firstResponse.resolvedAt).toBeTruthy();
  });

  it('healthy when age < 75% of limit', () => {
    // 17 hours / 24 hours = 0.708 < 0.75 → healthy
    const lead = makeLead({ status: 'new', created_at: hoursAgo(17) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.firstResponse.severity).toBe('healthy');
  });

  it('at_risk when age ≥ 75% of limit', () => {
    // 18 hours / 24 hours = 0.75 → at_risk boundary
    const lead = makeLead({ status: 'new', created_at: hoursAgo(18) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.firstResponse.severity).toBe('at_risk');
  });

  it('breached when age ≥ 100% of limit', () => {
    const lead = makeLead({ status: 'new', created_at: hoursAgo(25) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.firstResponse.severity).toBe('breached');
  });

  it('escalate=true when age ≥ limit × 2.0 multiplier', () => {
    // 24 × 2.0 = 48h to escalate
    const lead = makeLead({ status: 'new', created_at: hoursAgo(49) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.firstResponse.escalate).toBe(true);
  });

  it('uses source-specific threshold when source is in thresholds map', () => {
    // 'referral' threshold = 4 hours
    const lead = makeLead({ status: 'new', source: 'referral', created_at: hoursAgo(5) });
    const result = computeLeadSLA(lead, NOW, CFG);
    // 5 / 4 > 1.0 → breached
    expect(result.firstResponse.severity).toBe('breached');
    expect(result.firstResponse.limitHours).toBe(4);
  });
});

// ── followUp track ─────────────────────────────────────────────────────────────

describe('computeLeadSLA — followUp', () => {
  it('is na when no next_follow_up_date set', () => {
    const lead = makeLead({ status: 'new' });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.followUp.severity).toBe('na');
  });

  it('is na for statuses not in activeStatuses', () => {
    const lead = makeLead({ status: 'disqualified', next_follow_up_date: daysAgo(1) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.followUp.severity).toBe('na');
  });

  it('healthy when follow-up date is in the future', () => {
    const lead = makeLead({ status: 'new', next_follow_up_date: daysFromNow(2) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.followUp.severity).toBe('healthy');
  });

  it('at_risk when past due but within grace period', () => {
    // graceHours = 2; 1 hour overdue → at_risk
    const lead = makeLead({ status: 'new', next_follow_up_date: hoursAgo(1) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.followUp.severity).toBe('at_risk');
  });

  it('breached when past grace period', () => {
    // graceHours = 2; 3 hours overdue → breached
    const lead = makeLead({ status: 'new', next_follow_up_date: hoursAgo(3) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.followUp.severity).toBe('breached');
  });
});

// ── stale track ────────────────────────────────────────────────────────────────

describe('computeLeadSLA — stale', () => {
  it('is na for statuses not in activeStatuses', () => {
    const lead = makeLead({ status: 'converted', last_contact_date: daysAgo(60) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.stale.severity).toBe('na');
  });

  it('healthy when last contact is recent', () => {
    const lead = makeLead({ status: 'new', last_contact_date: daysAgo(5) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.stale.severity).toBe('healthy');
  });

  it('at_risk when past atRiskDays (21) but before breachDays (30)', () => {
    const lead = makeLead({ status: 'new', last_contact_date: daysAgo(22) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.stale.severity).toBe('at_risk');
  });

  it('breached when past breachDays (30)', () => {
    const lead = makeLead({ status: 'new', last_contact_date: daysAgo(31) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.stale.severity).toBe('breached');
  });

  it('falls back to created_at when no last_contact_date or last_activity_date', () => {
    const lead = makeLead({ status: 'new', created_at: daysAgo(31), last_contact_date: undefined });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.stale.severity).toBe('breached');
  });

  it('prefers last_activity_date over created_at', () => {
    const lead = makeLead({
      status: 'new',
      created_at: daysAgo(35),
      last_activity_date: daysAgo(5),
      last_contact_date: undefined,
    });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.stale.severity).toBe('healthy');
  });
});

// ── overall ────────────────────────────────────────────────────────────────────

describe('computeLeadSLA — overall severity', () => {
  it('overall = healthy when all tracks are na or healthy', () => {
    const lead = makeLead({ status: 'new', created_at: hoursAgo(1), last_contact_date: daysAgo(1) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.overall).toBe('healthy');
  });

  it('overall = worst non-na severity across tracks', () => {
    // stale is breached; firstResponse is na (because status has first_contact_date set)
    const lead = makeLead({
      status: 'new',
      first_contact_date: hoursAgo(1),
      last_contact_date: daysAgo(31),
    });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.overall).toBe('breached');
  });

  it('escalate=true when any track escalates', () => {
    const lead = makeLead({ status: 'new', created_at: hoursAgo(49) });
    const result = computeLeadSLA(lead, NOW, CFG);
    expect(result.escalate).toBe(true);
  });
});
