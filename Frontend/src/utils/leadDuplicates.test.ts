import { describe, it, expect } from 'vitest';
import { findDuplicates, computeRisk, buildDomainSet } from './leadDuplicates';
import { makeLead } from '../__tests__/fixtures/leadFixtures';

// ── findDuplicates ─────────────────────────────────────────────────────────────

describe('findDuplicates', () => {
  it('returns empty array when pool has only self', () => {
    const lead = makeLead({ id: 'a' });
    expect(findDuplicates(lead, [lead])).toEqual([]);
  });

  it('returns empty array when no signals match', () => {
    const lead = makeLead({ id: 'a', email: 'a@acme.com', first_name: 'Alice', last_name: 'Adams', company: 'Acme' });
    const other = makeLead({ id: 'b', email: 'b@beta.com', first_name: 'Bob', last_name: 'Brown', company: 'Beta' });
    expect(findDuplicates(lead, [lead, other])).toEqual([]);
  });

  it('exact email match → high risk', () => {
    const lead  = makeLead({ id: 'a', email: 'same@corp.com' });
    const other = makeLead({ id: 'b', email: 'same@corp.com' });
    const result = findDuplicates(lead, [lead, other]);
    expect(result).toHaveLength(1);
    expect(result[0].risk).toBe('high');
    expect(result[0].signals[0].type).toBe('email');
    expect(result[0].signals[0].strength).toBe('exact');
  });

  it('email match is case-insensitive', () => {
    const lead  = makeLead({ id: 'a', email: 'User@Corp.COM' });
    const other = makeLead({ id: 'b', email: 'user@corp.com' });
    const result = findDuplicates(lead, [lead, other]);
    expect(result).toHaveLength(1);
    expect(result[0].risk).toBe('high');
  });

  it('exact phone match (after stripping formatting) → high risk', () => {
    const lead  = makeLead({ id: 'a', email: 'a@acme.com', phone: '(555) 123-4567' });
    const other = makeLead({ id: 'b', email: 'b@beta.com', phone: '5551234567' });
    const result = findDuplicates(lead, [lead, other]);
    expect(result).toHaveLength(1);
    expect(result[0].risk).toBe('high');
    expect(result[0].signals[0].type).toBe('phone');
  });

  it('short phone (< 7 digits) is not matched', () => {
    // Different names to avoid name-similarity signal
    const lead  = makeLead({ id: 'a', email: 'a@acme.com', phone: '12345', first_name: 'Alice', last_name: 'Adams', company: 'Acme' });
    const other = makeLead({ id: 'b', email: 'b@beta.com', phone: '12345', first_name: 'Bob',   last_name: 'Brown', company: 'Beta' });
    expect(findDuplicates(lead, [lead, other])).toHaveLength(0);
  });

  it('non-generic corporate domain alone → low risk (only 1 medium signal)', () => {
    const lead  = makeLead({ id: 'a', email: 'alice@corp.com', first_name: 'Alice', last_name: 'Adams', company: 'Acme' });
    const other = makeLead({ id: 'b', email: 'bob@corp.com',   first_name: 'Bob',   last_name: 'Brown', company: 'Beta' });
    const result = findDuplicates(lead, [lead, other]);
    expect(result).toHaveLength(1);
    expect(result[0].risk).toBe('low');
    expect(result[0].signals.some(s => s.type === 'domain')).toBe(true);
  });

  it('generic domain (gmail.com) is not treated as company domain signal', () => {
    const lead  = makeLead({ id: 'a', email: 'alice@gmail.com', first_name: 'Alice', last_name: 'Adams', company: 'Acme' });
    const other = makeLead({ id: 'b', email: 'bob@gmail.com',   first_name: 'Bob',   last_name: 'Brown', company: 'Beta' });
    const result = findDuplicates(lead, [lead, other]);
    expect(result).toHaveLength(0);
  });

  it('domain + fuzzy name match → medium risk', () => {
    // "Alic Smith" vs "Alice Smith" → levenshtein ratio ≥ 0.85 → high name signal
    // high name, no company match → strength='medium' (no coStr)
    // domain + other signal → medium
    const lead  = makeLead({ id: 'a', email: 'alice@corp.com', first_name: 'Alice', last_name: 'Smith', company: 'Acme' });
    const other = makeLead({ id: 'b', email: 'alic@corp.com',  first_name: 'Alic',  last_name: 'Smith', company: 'Beta' });
    const result = findDuplicates(lead, [lead, other]);
    expect(result).toHaveLength(1);
    expect(result[0].risk).toBe('medium');
  });

  it('exact name + exact company (no email overlap) → high risk', () => {
    const lead  = makeLead({ id: 'a', email: 'a@acme.com', first_name: 'Alice', last_name: 'Smith', company: 'Corp' });
    const other = makeLead({ id: 'b', email: 'b@beta.com', first_name: 'Alice', last_name: 'Smith', company: 'Corp' });
    const result = findDuplicates(lead, [lead, other]);
    expect(result).toHaveLength(1);
    expect(result[0].risk).toBe('high');
    expect(result[0].signals[0].type).toBe('name_company');
  });

  it('excludes self (same id)', () => {
    const lead = makeLead({ id: 'same', email: 'a@corp.com' });
    const pool = [lead, makeLead({ id: 'other', email: 'b@corp.com' })];
    const result = findDuplicates(lead, pool);
    expect(result.every(c => c.leadId !== 'same')).toBe(true);
  });

  it('excludes disqualified candidates', () => {
    const lead  = makeLead({ id: 'a', email: 'same@corp.com' });
    const dq    = makeLead({ id: 'b', email: 'same@corp.com', status: 'disqualified' });
    expect(findDuplicates(lead, [lead, dq])).toHaveLength(0);
  });

  it('sorts results: high before medium before low', () => {
    const lead  = makeLead({ id: 'a', email: 'alice@corp.com', first_name: 'Alice', last_name: 'Smith', company: 'Corp', phone: '5551234567' });
    // high — exact email
    const b = makeLead({ id: 'b', email: 'alice@corp.com' });
    // medium — domain + name
    const c = makeLead({ id: 'c', email: 'alic@corp.com', first_name: 'Alic', last_name: 'Smith', company: 'Beta' });
    // low — domain only
    const d = makeLead({ id: 'd', email: 'dave@corp.com', first_name: 'Dave', last_name: 'Jones', company: 'Other' });
    const result = findDuplicates(lead, [lead, b, c, d]);
    expect(result[0].risk).toBe('high');
    const risks = result.map(r => r.risk);
    // high comes first
    expect(risks.indexOf('high')).toBeLessThan(risks.indexOf('medium'));
    expect(risks.indexOf('medium')).toBeLessThan(risks.indexOf('low'));
  });
});

// ── computeRisk ────────────────────────────────────────────────────────────────

describe('computeRisk', () => {
  it('returns low for empty candidates', () => {
    expect(computeRisk([])).toBe('low');
  });

  it('returns high when any candidate has high risk', () => {
    const candidates = [
      { leadId: 'a', signals: [], risk: 'medium' as const },
      { leadId: 'b', signals: [], risk: 'high' as const },
    ];
    expect(computeRisk(candidates)).toBe('high');
  });

  it('returns medium when highest is medium', () => {
    const candidates = [
      { leadId: 'a', signals: [], risk: 'low' as const },
      { leadId: 'b', signals: [], risk: 'medium' as const },
    ];
    expect(computeRisk(candidates)).toBe('medium');
  });

  it('returns low when all candidates are low', () => {
    const candidates = [{ leadId: 'a', signals: [], risk: 'low' as const }];
    expect(computeRisk(candidates)).toBe('low');
  });
});

// ── buildDomainSet ─────────────────────────────────────────────────────────────

describe('buildDomainSet', () => {
  it('includes non-generic domain that appears 2+ times', () => {
    const leads = [
      makeLead({ id: 'a', email: 'a@corp.com' }),
      makeLead({ id: 'b', email: 'b@corp.com' }),
    ];
    expect(buildDomainSet(leads).has('corp.com')).toBe(true);
  });

  it('excludes singleton domain', () => {
    const leads = [makeLead({ id: 'a', email: 'a@corp.com' })];
    expect(buildDomainSet(leads).has('corp.com')).toBe(false);
  });

  it('excludes generic domains regardless of count', () => {
    const leads = [
      makeLead({ id: 'a', email: 'a@gmail.com' }),
      makeLead({ id: 'b', email: 'b@gmail.com' }),
    ];
    expect(buildDomainSet(leads).has('gmail.com')).toBe(false);
  });

  it('returns empty set for leads without email', () => {
    const leads = [makeLead({ id: 'a', email: undefined }), makeLead({ id: 'b' })];
    expect(buildDomainSet(leads).size).toBe(0);
  });
});
