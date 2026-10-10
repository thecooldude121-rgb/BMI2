import { describe, it, expect } from 'vitest';
import { mapApiDeal } from './dealCards';

/** Migration 066: an unknown USD amount stays unknown on the card — never the native value. */
describe('mapApiDeal — base_amount_usd', () => {
  it('a null base stays undefined (an INR deal must not read as "≈ $125K")', () => {
    expect(mapApiDeal({ id: 'D1', value: '125000', currency: 'INR', base_amount_usd: null }, 'prospecting').baseAmountUsd).toBeUndefined();
  });
  it('a real base is used as-is', () => {
    expect(mapApiDeal({ id: 'D2', value: '36725', currency: 'AED', base_amount_usd: '10000' }, 'prospecting').baseAmountUsd).toBe(10000);
  });
});
