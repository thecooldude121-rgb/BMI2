import { describe, it, expect } from 'vitest';
import { mapRowToLead } from './leadsApi';
import { LeadScoringEngine } from './leadScoring';
import type { Lead } from '../types/lead';

/**
 * Group A item 1: the migration-063 fields reach the Lead, and the rule-based
 * score reads columns that EXIST (it read company_size / website / linkedin_url /
 * country, none of which were stored, and recency from a field nothing sets).
 */

const ROW = {
  id: 7, first_name: 'Amina', last_name: 'Farsi', email: 'amina@gulfaxis.example', stage: 'new', score: 40,
  source: 'Website', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z',
};

describe('mapRowToLead — migration 063 fields', () => {
  it('maps every profile field, the stored value and currency', () => {
    const l = mapRowToLead({
      ...ROW, mobile: '+971', website: 'gulfaxis.example', linkedin_url: 'li/amina', city: 'Dubai',
      country: 'United Arab Emirates', company_size: '1000+', department: 'IT', source_detail: 'Security page',
      priority: 'high', value: '2200000.00', currency: 'INR', utm_source: 'linkedin', referral_contact: 'Rohan',
    });
    expect(l).toMatchObject({
      mobile: '+971', website: 'gulfaxis.example', linkedin_url: 'li/amina', city: 'Dubai', country: 'United Arab Emirates',
      company_size: '1000+', department: 'IT', source_detail: 'Security page', priority: 'high',
      estimated_value: 2200000, currency: 'INR', utm_source: 'linkedin', referral_contact: 'Rohan',
    });
  });

  it('nothing is defaulted: no value is null (not 0), no currency is null (not "USD"), absent fields stay absent', () => {
    const l = mapRowToLead({ ...ROW, value: null, currency: null, city: '' });
    expect(l.estimated_value).toBeNull();
    expect(l.currency).toBeNull();
    expect(l).not.toHaveProperty('city');
    expect(l).not.toHaveProperty('company_size');
  });
});

const score = (l: Partial<Lead>) => {
  const { factors } = LeadScoringEngine.calculateDetailedScore({ ...mapRowToLead(ROW), ...l } as Lead);
  return Object.fromEntries(factors.map(f => [f.name, f]));
};

describe('rule-based score reads real columns', () => {
  it('company size now counts (it could never be satisfied)', () => {
    expect(score({})['Company Size'].points).toBe(0);
    expect(score({ company_size: '1000+' })['Company Size'].points).toBe(15);
  });

  it('data completeness counts website, LinkedIn and company size', () => {
    const bare = score({})['Data Completeness'].points;
    const full = score({ phone: '+1', company: 'GulfAxis', position: 'CTO', industry: 'Finance', company_size: '1000+', website: 'g.example', linkedin_url: 'li/a' })['Data Completeness'];
    expect(full.points).toBe(10);
    expect(full.description).toBe('8/8 fields completed');
    expect(bare).toBeLessThan(10);
  });

  it('activity recency reads the real last contact (it read a field nothing sets)', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(score({})['Activity Recency'].points).toBe(0);
    const f = score({ last_contact_date: today })['Activity Recency'];
    expect(f.points).toBe(15);
    expect(f.description).toMatch(/^Last contact:/);
  });

  it('no country is favoured: a UAE lead and a US lead get the same location point', () => {
    const uae = score({ country: 'United Arab Emirates' })['Demographics'].points;
    const us = score({ country: 'United States' })['Demographics'].points;
    const none = score({})['Demographics'].points;
    expect(uae).toBe(us);
    expect(uae).toBe(none + 1);
  });
});
