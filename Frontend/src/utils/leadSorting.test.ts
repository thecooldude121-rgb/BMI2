import { describe, it, expect } from 'vitest';
import { sortLeads, getSortDescription, priorityScore, SORT_OPTIONS } from './leadSorting';
import type { Lead } from '../types/lead';

// ── Fixture factory ───────────────────────────────────────────────────────────

function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id:                    'test-id',
    first_name:            'Test',
    last_name:             'Lead',
    full_name:             'Test Lead',
    email:                 'test@example.com',
    phone:                 '',
    company:               'Acme',
    position:              'Manager',
    status:                'new',
    temperature:           'warm',
    score:                 50,
    ai_score:              50,
    source:                'Manual',
    owner_id:              'owner-1',
    created_at:            new Date().toISOString(),
    updated_at:            new Date().toISOString(),
    created_by:            'system',
    last_contact_date:     undefined,
    next_follow_up_date:   undefined,
    estimated_value:       0,
    probability:           0,
    currency:              'USD',
    tags:                  [],
    custom_fields:         {},
    enrichment_data:       {},
    email_opt_in:          false,
    sms_opt_in:            false,
    call_opt_in:           false,
    do_not_contact:        false,
    gdpr_consent:          false,
    is_qualified:          false,
    is_deleted:            false,
    email_opens_count:     0,
    email_clicks_count:    0,
    page_views_count:      0,
    meeting_count:         0,
    call_count:            0,
    email_sent_count:      0,
    ai_recommendations:    [],
    automation_paused:     false,
    ...overrides,
  } as Lead;
}

const noDupes = new Set<string>();

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 3_600_000).toISOString();
}

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('sortLeads — score_high_low', () => {
  it('returns leads in descending score order', () => {
    const leads = [
      makeLead({ id: 'a', ai_score: 40 }),
      makeLead({ id: 'b', ai_score: 90 }),
      makeLead({ id: 'c', ai_score: 65 }),
    ];
    const result = sortLeads(leads, 'score_high_low', noDupes);
    expect(result.map(l => l.ai_score)).toEqual([90, 65, 40]);
  });
});

describe('sortLeads — score_low_high', () => {
  it('returns leads in ascending score order', () => {
    const leads = [
      makeLead({ id: 'a', ai_score: 40 }),
      makeLead({ id: 'b', ai_score: 90 }),
      makeLead({ id: 'c', ai_score: 65 }),
    ];
    const result = sortLeads(leads, 'score_low_high', noDupes);
    expect(result.map(l => l.ai_score)).toEqual([40, 65, 90]);
  });
});

describe('sortLeads — priority', () => {
  it('overdue + never-contacted lead ranks higher than same score with no urgency', () => {
    const urgent = makeLead({
      id:                  'urgent',
      ai_score:            90,
      next_follow_up_date: daysAgo(1),       // overdue
      last_contact_date:   undefined,         // never contacted
      status:              'new',
    });
    const calm = makeLead({
      id:                  'calm',
      ai_score:            90,
      next_follow_up_date: daysFromNow(10),   // future follow-up
      last_contact_date:   daysAgo(0),        // contacted today
      status:              'new',
    });
    const result = sortLeads([calm, urgent], 'priority', noDupes);
    expect(result[0].id).toBe('urgent');
  });
});

describe('sortLeads — recently_active', () => {
  it('most recently contacted lead ranks first', () => {
    const recent = makeLead({ id: 'recent', last_contact_date: daysAgo(1) });
    const older  = makeLead({ id: 'older',  last_contact_date: daysAgo(30) });
    const result = sortLeads([older, recent], 'recently_active', noDupes);
    expect(result[0].id).toBe('recent');
  });

  it('leads with no contact date sort last', () => {
    const contacted = makeLead({ id: 'contacted', last_contact_date: daysAgo(60) });
    const never     = makeLead({ id: 'never',     last_contact_date: undefined });
    const result = sortLeads([never, contacted], 'recently_active', noDupes);
    expect(result[0].id).toBe('contacted');
    expect(result[1].id).toBe('never');
  });
});

describe('sortLeads — most_engaged', () => {
  it('high score + recent contact ranks above high score + old contact', () => {
    const engaged = makeLead({ id: 'engaged', ai_score: 80, last_contact_date: daysAgo(5) });
    const stale   = makeLead({ id: 'stale',   ai_score: 80, last_contact_date: daysAgo(20) });
    const result = sortLeads([stale, engaged], 'most_engaged', noDupes);
    expect(result[0].id).toBe('engaged');
  });
});

describe('sortLeads — newest', () => {
  it('lead created today ranks above lead created yesterday', () => {
    const today     = makeLead({ id: 'today',     created_at: daysAgo(0) });
    const yesterday = makeLead({ id: 'yesterday', created_at: daysAgo(1) });
    const result = sortLeads([yesterday, today], 'newest', noDupes);
    expect(result[0].id).toBe('today');
  });
});

describe('sortLeads — oldest', () => {
  it('oldest lead ranks first', () => {
    const old  = makeLead({ id: 'old',    created_at: daysAgo(30) });
    const new_ = makeLead({ id: 'recent', created_at: daysAgo(1) });
    const result = sortLeads([new_, old], 'oldest', noDupes);
    expect(result[0].id).toBe('old');
  });
});

describe('sortLeads — closest_to_qualification', () => {
  it('orders by status stage: qualified > contacted > new > lost', () => {
    const leads = [
      makeLead({ id: 'lost',      status: 'lost' }),
      makeLead({ id: 'new',       status: 'new' }),
      makeLead({ id: 'qualified', status: 'qualified' }),
      makeLead({ id: 'contacted', status: 'contacted' }),
    ];
    const result = sortLeads(leads, 'closest_to_qualification', noDupes);
    expect(result.map(l => l.id)).toEqual(['qualified', 'contacted', 'new', 'lost']);
  });

  it('within same status, higher score ranks first', () => {
    const hi = makeLead({ id: 'hi', status: 'new', ai_score: 80 });
    const lo = makeLead({ id: 'lo', status: 'new', ai_score: 30 });
    const result = sortLeads([lo, hi], 'closest_to_qualification', noDupes);
    expect(result[0].id).toBe('hi');
  });
});

describe('sortLeads — highest_duplicate_risk', () => {
  it('risk leads appear before non-risk leads', () => {
    const dupes = new Set(['acme.com']);
    const riskLead    = makeLead({ id: 'risk',    email: 'alice@acme.com',    ai_score: 40 });
    const safeLeadHi  = makeLead({ id: 'safe-hi', email: 'bob@unique.com',   ai_score: 99 });
    const result = sortLeads([safeLeadHi, riskLead], 'highest_duplicate_risk', dupes);
    expect(result[0].id).toBe('risk');
  });

  it('within risk group, higher score ranks first', () => {
    const dupes = new Set(['acme.com']);
    const hi = makeLead({ id: 'hi', email: 'a@acme.com', ai_score: 80 });
    const lo = makeLead({ id: 'lo', email: 'b@acme.com', ai_score: 30 });
    const result = sortLeads([lo, hi], 'highest_duplicate_risk', dupes);
    expect(result[0].id).toBe('hi');
  });
});

describe('sortLeads — sla_breach_first', () => {
  it('Website lead > 4h old breaches SLA and ranks above outbound lead < 24h old', () => {
    const breached = makeLead({
      id:         'breached',
      status:     'new',
      source:     'Website',
      created_at: hoursAgo(5),           // 5h > 4h SLA
      last_contact_date: undefined,
    });
    const safe = makeLead({
      id:         'safe',
      status:     'new',
      source:     'Manual',
      created_at: hoursAgo(2),           // 2h < 24h SLA
      last_contact_date: undefined,
    });
    const result = sortLeads([safe, breached], 'sla_breach_first', noDupes);
    expect(result[0].id).toBe('breached');
  });

  it('non-breached leads sort after all breached leads', () => {
    const breached = makeLead({
      id: 'b', status: 'new', source: 'Website',
      created_at: hoursAgo(10), last_contact_date: undefined,
    });
    const contacted = makeLead({
      id: 'c', status: 'contacted', source: 'Website',
      created_at: hoursAgo(10),
    });
    const result = sortLeads([contacted, breached], 'sla_breach_first', noDupes);
    expect(result[0].id).toBe('b');
  });
});

describe('sortLeads — ready_to_convert_first', () => {
  it('qualified lead with score ≥ 60 ranks before non-qualified high-score lead', () => {
    const ready   = makeLead({ id: 'ready',   status: 'qualified', ai_score: 70 });
    const highRaw = makeLead({ id: 'high-raw', status: 'new',      ai_score: 95 });
    const result = sortLeads([highRaw, ready], 'ready_to_convert_first', noDupes);
    expect(result[0].id).toBe('ready');
  });
});

describe('sortLeads — unknown mode', () => {
  it('returns same number of leads without throwing', () => {
    const leads = [makeLead({ id: 'a' }), makeLead({ id: 'b' })];
    // Cast to bypass TS — simulates a stored view with an old/unknown sort value
    const result = sortLeads(leads, 'name_az' as any, noDupes);
    expect(result).toHaveLength(2);
  });
});

describe('sortLeads — immutability', () => {
  it('never mutates the input array', () => {
    const a = makeLead({ id: 'a', ai_score: 10 });
    const b = makeLead({ id: 'b', ai_score: 90 });
    const original = [a, b];
    sortLeads(original, 'score_high_low', noDupes);
    // original order must be preserved
    expect(Object.is(original[0], a)).toBe(true);
    expect(Object.is(original[1], b)).toBe(true);
  });
});

describe('priorityScore', () => {
  it('returns exactly 100 for a perfect lead: score=100, overdue, never contacted, qualified+score≥60', () => {
    const perfect = makeLead({
      ai_score:            100,
      next_follow_up_date: daysAgo(1),   // overdue → bonus 100
      last_contact_date:   undefined,     // never contacted → penalty 100
      status:              'qualified',   // qualifies for conversionBonus
    });
    // 100*0.4 + 100*0.3 + 100*0.2 + 100*0.1 = 100
    expect(priorityScore(perfect)).toBeCloseTo(100, 0);
  });
});

describe('getSortDescription', () => {
  it('returns a non-empty string for all 11 valid SortMode values', () => {
    const allModes = SORT_OPTIONS.map(o => o.mode);
    expect(allModes).toHaveLength(11);
    for (const mode of allModes) {
      const desc = getSortDescription(mode);
      expect(desc.length).toBeGreaterThan(0);
    }
  });
});
