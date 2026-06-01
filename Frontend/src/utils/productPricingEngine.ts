// ─── Product Pricing Engine ───────────────────────────────────────────────────
// Pure functions — no React, no side-effects, fully unit-testable.
// All pricing logic lives here. Components and the form page stay display-only.

import { getCatalogProduct, CADENCE_MONTHS, BillingCadence } from '../config/productCatalog';
import { convertFromBaseCurrency } from './currencyUtils';

export interface PriceSuggestion {
  amount: number;           // suggested deal value in the selected currency
  amountUSD: number;        // same value in USD (for AI insights / probability calc)
  basis: string;            // human-readable explanation: "Annual · $2,499/mo × 12"
  productName: string;
  cadence: BillingCadence;
  hasData: true;
}

export interface NoPriceSuggestion {
  hasData: false;
  reason: string;           // why no suggestion was generated
}

export type PriceResult = PriceSuggestion | NoPriceSuggestion;

/**
 * Returns a suggested deal value for a given product + contract term + currency.
 *
 * Logic:
 *   1. Look up product in the catalog.
 *   2. If no baseMonthlyPrice (Custom Solution), return NoPriceSuggestion.
 *   3. Multiply baseMonthlyPrice × cadenceMonths.
 *   4. Round to the nearest clean number (100 below $10K, 500 below $100K, 1000 above).
 *   5. Convert from USD to the selected display currency using currencyUtils.
 *
 * @example
 *   getSuggestedDealValue('Enterprise Plan', 'Annual', 'USD')
 *   → { amount: 30000, amountUSD: 30000, basis: 'Annual · $2,499/mo × 12', ... }
 *
 *   getSuggestedDealValue('Enterprise Plan', 'Annual', 'AED')
 *   → { amount: 110100, amountUSD: 30000, basis: 'Annual · $2,499/mo × 12 (converted to AED)', ... }
 *
 *   getSuggestedDealValue('Custom Solution', 'Annual', 'USD')
 *   → { hasData: false, reason: 'Custom Solution uses custom pricing' }
 */
export const getSuggestedDealValue = (
  productId: string,
  contractTerm: string,
  currency: string
): PriceResult => {
  const product = getCatalogProduct(productId);

  if (!product) {
    return { hasData: false, reason: 'Product not found in catalog' };
  }

  if (product.baseMonthlyPrice === null) {
    return { hasData: false, reason: `${product.name} uses custom pricing` };
  }

  const cadence = contractTerm as BillingCadence;
  const months = CADENCE_MONTHS[cadence] ?? CADENCE_MONTHS['Annual'];
  const rawUSD = product.baseMonthlyPrice * months;
  const roundedUSD = roundToClean(rawUSD);

  // Convert to display currency if needed
  const displayAmount = currency === 'USD'
    ? roundedUSD
    : roundToClean(convertFromBaseCurrency(roundedUSD, currency));

  const isFX = currency !== 'USD';
  const basis = isFX
    ? `${cadence} · $${product.baseMonthlyPrice.toLocaleString()}/mo × ${months} (converted to ${currency})`
    : `${cadence} · $${product.baseMonthlyPrice.toLocaleString()}/mo × ${months}`;

  return {
    hasData: true,
    amount: displayAmount,
    amountUSD: roundedUSD,
    basis,
    productName: product.name,
    cadence,
  };
};

/**
 * Returns true if the current deal value matches the catalog suggestion amount.
 * Used to determine whether the field is showing a catalog-applied value or a
 * user-entered value — without relying on a separate "user edited" flag.
 */
export const valueMatchesSuggestion = (
  rawValueStr: string,
  suggestion: PriceResult
): boolean => {
  if (!suggestion.hasData) return false;
  const current = parseFloat(rawValueStr.toString().replace(/,/g, ''));
  return !isNaN(current) && current === suggestion.amount;
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Rounds a raw calculated price to a "clean" number appropriate for quoting.
 *   < $1,000   → nearest $10
 *   < $10,000  → nearest $100
 *   < $100,000 → nearest $500
 *   ≥ $100,000 → nearest $1,000
 */
const roundToClean = (n: number): number => {
  if (n < 1_000)   return Math.round(n / 10)    * 10;
  if (n < 10_000)  return Math.round(n / 100)   * 100;
  if (n < 100_000) return Math.round(n / 500)   * 500;
  return               Math.round(n / 1_000)    * 1_000;
};
