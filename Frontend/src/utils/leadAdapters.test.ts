import { describe, it, expect } from 'vitest';
import type { Lead } from '../types/lead';
import { toLeadDomain } from './leadAdapters';

// ── Minimal valid Lead fixture ────────────────────────────────────────────────
// Satisfies every required field in the Lead interface.

const baseLead: Lead = {
  id:                 'lead-test-1',
  first_name:         'Jane',
  last_name:          'Smith',
  email:              'jane@acme.com',
  phone:              '+1-555-0100',
  company:            'Acme Corp',
  position:           'VP of Sales',
  source:             'Website',
  owner_id:           'owner-1',
  score:              75,
  ai_score:           75,
  status:             'new',
  temperature:        'warm',
  estimated_value:    0,
  probability:        0,
  currency:           'USD',
  email_opt_in:       true,
  sms_opt_in:         false,
  call_opt_in:        true,
  do_not_contact:     false,
  gdpr_consent:       false,
  is_qualified:       false,
  is_deleted:         false,
  email_opens_count:  0,
  email_clicks_count: 0,
  page_views_count:   0,
  meeting_count:      0,
  call_count:         0,
  email_sent_count:   0,
  ai_recommendations: [],
  automation_paused:  false,
  tags:               [],
  custom_fields:      {},
  enrichment_data:    {},
  created_at:         '2024-01-01T00:00:00Z',
  updated_at:         '2024-01-02T00:00:00Z',
  created_by:         'user-1',
};

// ── Test 1: fullName and avatarInitials ───────────────────────────────────────

describe('toLeadDomain — identity', () => {
  it('computes fullName as first_name + last_name', () => {
    const domain = toLeadDomain(baseLead);
    expect(domain.fullName).toBe('Jane Smith');
  });

  it('computes avatarInitials as uppercased first letters', () => {
    const domain = toLeadDomain(baseLead);
    expect(domain.avatarInitials).toBe('JS');
  });

  it('handles missing last_name gracefully', () => {
    const domain = toLeadDomain({ ...baseLead, first_name: 'Cher', last_name: '' });
    expect(domain.fullName).toBe('Cher');
    expect(domain.avatarInitials).toBe('C');
  });
});

// ── Test 2: lifecycleStage maps correctly for all 4 status values ─────────────

describe('toLeadDomain — lifecycleStage', () => {
  it("maps 'new' → 'lead'", () => {
    expect(toLeadDomain({ ...baseLead, status: 'new' }).lifecycleStage).toBe('lead');
  });

  it("maps 'contacted' → 'mql'", () => {
    expect(toLeadDomain({ ...baseLead, status: 'contacted' }).lifecycleStage).toBe('mql');
  });

  it("maps 'qualified' → 'sql'", () => {
    expect(toLeadDomain({ ...baseLead, status: 'qualified' }).lifecycleStage).toBe('sql');
  });

  it("maps 'lost' → 'lead'", () => {
    expect(toLeadDomain({ ...baseLead, status: 'lost' }).lifecycleStage).toBe('lead');
  });
});

// ── Test 3: All 5 score fields compute correctly from score = 75 ──────────────

describe('toLeadDomain — score fields (score = 75)', () => {
  const domain = toLeadDomain({ ...baseLead, score: 75 });

  it('overallScore is a passthrough of score', () => {
    expect(domain.overallScore).toBe(75);
  });

  it('fitScore = Math.round(75 * 0.35) = 26', () => {
    expect(domain.fitScore).toBe(26);
  });

  it('intentScore = Math.round(75 * 0.30) = 23', () => {
    expect(domain.intentScore).toBe(23);
  });

  it('engagementScore = Math.round(75 * 0.20) = 15', () => {
    expect(domain.engagementScore).toBe(15);
  });

  it('confidenceScore = Math.round(75 * 0.15) = 11', () => {
    expect(domain.confidenceScore).toBe(11);
  });
});

// ── Test 4: conversionReadiness thresholds ────────────────────────────────────

describe('toLeadDomain — conversionReadiness', () => {
  it("returns 'high' for score 85 (>= 80)", () => {
    expect(toLeadDomain({ ...baseLead, score: 85 }).conversionReadiness).toBe('high');
  });

  it("returns 'medium' for score 55 (>= 50)", () => {
    expect(toLeadDomain({ ...baseLead, score: 55 }).conversionReadiness).toBe('medium');
  });

  it("returns 'low' for score 35 (< 50)", () => {
    expect(toLeadDomain({ ...baseLead, score: 35 }).conversionReadiness).toBe('low');
  });
});

// ── Test 5: consentStatus derives all 4 variants ──────────────────────────────

describe('toLeadDomain — consentStatus', () => {
  it("'full' when both email_opt_in and call_opt_in are true", () => {
    expect(
      toLeadDomain({ ...baseLead, email_opt_in: true, call_opt_in: true }).consentStatus
    ).toBe('full');
  });

  it("'email_only' when only email_opt_in is true", () => {
    expect(
      toLeadDomain({ ...baseLead, email_opt_in: true, call_opt_in: false }).consentStatus
    ).toBe('email_only');
  });

  it("'call_only' when only call_opt_in is true", () => {
    expect(
      toLeadDomain({ ...baseLead, email_opt_in: false, call_opt_in: true }).consentStatus
    ).toBe('call_only');
  });

  it("'none' when both are false", () => {
    expect(
      toLeadDomain({ ...baseLead, email_opt_in: false, call_opt_in: false }).consentStatus
    ).toBe('none');
  });
});

// ── Test 6: qualificationChecklist has 6 items ────────────────────────────────

describe('toLeadDomain — qualificationChecklist', () => {
  it('always returns exactly 6 items', () => {
    expect(toLeadDomain(baseLead).qualificationChecklist).toHaveLength(6);
  });

  it('passes email check when email is present', () => {
    const list = toLeadDomain(baseLead).qualificationChecklist;
    expect(list.find(i => i.criterion === 'Has valid email')?.passed).toBe(true);
  });

  it('fails email check when email is missing', () => {
    const list = toLeadDomain({ ...baseLead, email: undefined }).qualificationChecklist;
    expect(list.find(i => i.criterion === 'Has valid email')?.passed).toBe(false);
  });

  it('passes score check when ai_score >= 60', () => {
    const list = toLeadDomain({ ...baseLead, ai_score: 75 }).qualificationChecklist;
    expect(list.find(i => i.criterion === 'Score above 60')?.passed).toBe(true);
  });

  it('fails score check when ai_score < 60', () => {
    const list = toLeadDomain({ ...baseLead, ai_score: 40 }).qualificationChecklist;
    expect(list.find(i => i.criterion === 'Score above 60')?.passed).toBe(false);
  });
});

// ── Test 7: scoreDrivers for scores 85, 65, 45, 25 ───────────────────────────

describe('toLeadDomain — scoreDrivers', () => {
  it('score 85: positive has 3 drivers, negative is empty', () => {
    const d = toLeadDomain({ ...baseLead, score: 85 });
    expect(d.scoreDriversPositive).toEqual([
      'Strong company fit', 'High engagement signals', 'Decision-maker contact',
    ]);
    expect(d.scoreDriversNegative).toEqual([]);
  });

  it('score 65: positive has 2 drivers, negative has 1', () => {
    const d = toLeadDomain({ ...baseLead, score: 65 });
    expect(d.scoreDriversPositive).toEqual(['Good company fit', 'Moderate engagement']);
    expect(d.scoreDriversNegative).toEqual(['Limited recent activity']);
  });

  it('score 45: positive has 1 driver, negative has 2', () => {
    const d = toLeadDomain({ ...baseLead, score: 45 });
    expect(d.scoreDriversPositive).toEqual(['Some engagement signals']);
    expect(d.scoreDriversNegative).toEqual(['Low engagement', 'No recent contact']);
  });

  it('score 25: positive is empty, negative has 3 drivers', () => {
    const d = toLeadDomain({ ...baseLead, score: 25 });
    expect(d.scoreDriversPositive).toEqual([]);
    expect(d.scoreDriversNegative).toEqual([
      'Very low engagement', 'No qualification data', 'No recent contact',
    ]);
  });
});

// ── Test 8: enrichmentStatus ──────────────────────────────────────────────────

describe('toLeadDomain — enrichmentStatus', () => {
  it("'enriched' when ai_score > 0", () => {
    expect(toLeadDomain({ ...baseLead, ai_score: 55 }).enrichmentStatus).toBe('enriched');
  });

  it("'pending' when ai_score is 0", () => {
    expect(toLeadDomain({ ...baseLead, ai_score: 0 }).enrichmentStatus).toBe('pending');
  });

  it("'pending' when ai_score is undefined", () => {
    expect(toLeadDomain({ ...baseLead, ai_score: undefined }).enrichmentStatus).toBe('pending');
  });
});
