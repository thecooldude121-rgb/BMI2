import { describe, it, expect } from 'vitest';
import { evaluateQualification, unmetCriteria, isGatedMove } from '../utils/leadQualification';

/**
 * The qualification criteria, pure. Ratified 2026-10-03 as the three the
 * Kanban modal already used: email or phone, a company, a recorded last contact.
 */
describe('leadQualification', () => {
  const full = { email: 'a@b.co', phone: null, company: 'Contoso', last_contact: '2026-09-30' };

  it('a lead with all three passes', () => {
    expect(unmetCriteria(full)).toEqual([]);
    expect(evaluateQualification(full).every(c => c.met)).toBe(true);
  });

  it('phone alone satisfies the contact-method criterion', () => {
    expect(unmetCriteria({ ...full, email: null, phone: '+91 98' })).toEqual([]);
  });

  it('blank strings count as missing, not present', () => {
    const ids = unmetCriteria({ email: '  ', phone: '', company: ' ', last_contact: null }).map(c => c.id);
    expect(ids).toEqual(['contact_method', 'company', 'last_contact']);
  });

  it('names exactly the unmet criteria', () => {
    expect(unmetCriteria({ ...full, last_contact: null }).map(c => c.id)).toEqual(['last_contact']);
    expect(unmetCriteria({ ...full, company: null }).map(c => c.id)).toEqual(['company']);
  });

  it('only ENTERING the qualifying lane is gated', () => {
    expect(isGatedMove('new', 'qualified')).toBe(true);
    expect(isGatedMove('engaged', 'sales_accepted')).toBe(true);
    expect(isGatedMove(null, 'qualified')).toBe(true);
    // Already inside the lane:
    expect(isGatedMove('qualified', 'sales_accepted')).toBe(false);
    // Leaving it, or moving elsewhere:
    expect(isGatedMove('qualified', 'nurture')).toBe(false);
    expect(isGatedMove('new', 'engaged')).toBe(false);
  });
});
