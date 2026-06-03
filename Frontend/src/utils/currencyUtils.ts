// ─── Currency Utilities ───────────────────────────────────────────────────────
// All functions are pure (no side-effects, no external calls) so they can be
// imported directly into unit tests without any mocking setup.

import { getCurrency, BASE_CURRENCY_CODE, CURRENCY_MAP } from '../config/currencies';

// ─── Mock FX Rates ────────────────────────────────────────────────────────────
// Rates are expressed as: 1 USD = N <currency>
// To integrate a live FX API, replace the MOCK_RATES lookup in
// getExchangeRate() with a cached API call (e.g. exchangerate-api.com).
// The signatures of all exported functions remain unchanged.
//
// TODO: Replace with live rates from GET /api/v1/fx-rates or
//       https://api.exchangerate-api.com/v4/latest/USD
const MOCK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  INR: 83.12,
  SAR: 3.75,
  NGN: 1550.0,
  ZAR: 18.63,
  SGD: 1.34,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.50,
};

// Returns rate: how many units of `toCurrency` equal 1 USD
const getExchangeRate = (currencyCode: string): number =>
  MOCK_RATES[currencyCode] ?? 1.0;

// ─── Exported Pure Helpers ────────────────────────────────────────────────────

/**
 * Formats a numeric amount using the correct locale and currency symbol.
 * Always produces consistent output regardless of the user's browser locale.
 *
 * @example formatCurrency(50000, 'AED') → 'AED 50,000.00'
 * @example formatCurrency(50000, 'USD') → '$50,000.00'
 * @example formatCurrency(50000, 'INR') → '₹50,000.00'
 */
export const formatCurrency = (amount: number, currencyCode: string): string => {
  if (isNaN(amount)) return formatCurrency(0, currencyCode);

  try {
    return new Intl.NumberFormat(getCurrency(currencyCode).locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if browser doesn't support the currency code
    const cfg = getCurrency(currencyCode);
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return cfg.symbolPosition === 'prefix'
      ? `${cfg.symbol}${formatted}`
      : `${formatted} ${cfg.symbol}`;
  }
};

/**
 * Compact format for display in tight spaces (e.g. AI panels, cards).
 * Abbreviates to K / M / B.
 *
 * @example formatCurrencyCompact(50000, 'USD') → '$50K'
 * @example formatCurrencyCompact(1200000, 'EUR') → '€1.2M'
 */
export const formatCurrencyCompact = (amount: number, currencyCode: string): string => {
  if (isNaN(amount) || amount === 0) return formatCurrency(0, currencyCode);
  const cfg = getCurrency(currencyCode);

  let value: string;
  if (amount >= 1_000_000_000) value = `${(amount / 1_000_000_000).toFixed(1)}B`;
  else if (amount >= 1_000_000)  value = `${(amount / 1_000_000).toFixed(1)}M`;
  else if (amount >= 1_000)      value = `${(amount / 1_000).toFixed(0)}K`;
  else                           value = `${amount}`;

  return cfg.symbolPosition === 'prefix' ? `${cfg.symbol}${value}` : `${value} ${cfg.symbol}`;
};

/**
 * Converts an amount in any supported currency to the system base currency (USD).
 * Used to populate base_amount_usd in the API payload for reporting.
 *
 * @example convertToBaseCurrency(50000, 'AED') → 13623.98 (approx)
 * @example convertToBaseCurrency(1000, 'USD')  → 1000.00
 */
export const convertToBaseCurrency = (amount: number, fromCurrency: string): number => {
  if (fromCurrency === BASE_CURRENCY_CODE) return round2(amount);
  const rate = getExchangeRate(fromCurrency);
  if (rate === 0) return 0;
  return round2(amount / rate);
};

/**
 * Converts a base-currency amount (USD) to a target display currency.
 * Useful for showing "equivalent in your currency" hints.
 *
 * @example convertFromBaseCurrency(13623, 'AED') → 50,000.41
 */
export const convertFromBaseCurrency = (baseAmount: number, toCurrency: string): number => {
  if (toCurrency === BASE_CURRENCY_CODE) return round2(baseAmount);
  return round2(baseAmount * getExchangeRate(toCurrency));
};

/**
 * Parses a raw amount string (with commas, currency symbols, spaces) to a number.
 * Returns NaN if the string cannot be parsed as a valid positive number.
 *
 * @example parseAmountInput('50,000')   → 50000
 * @example parseAmountInput('$1,200.5') → 1200.5
 * @example parseAmountInput('abc')      → NaN
 * @example parseAmountInput('-100')     → NaN  (negative not allowed)
 */
export const parseAmountInput = (raw: string): number => {
  if (!raw) return NaN;
  // Reject negatives before stripping symbols (strip would remove the minus sign)
  if (raw.trim().startsWith('-')) return NaN;
  // Strip all non-numeric characters except decimal point
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < 0) return NaN;
  return num;
};

/**
 * Returns the currency symbol for a given code.
 * Safe — falls back to the code itself if not found.
 *
 * @example getCurrencySymbol('USD') → '$'
 * @example getCurrencySymbol('AED') → 'د.إ'
 */
export const getCurrencySymbol = (code: string): string =>
  CURRENCY_MAP[code]?.symbol ?? code;

/**
 * Validates a deal value string.
 * Returns an error message string, or null if valid.
 * The max cap is always evaluated in USD-equivalent terms.
 */
export const validateDealValue = (raw: string, currencyCode: string): string | null => {
  if (!raw || raw.trim() === '') return 'Deal value is required';
  const num = parseAmountInput(raw);
  if (isNaN(num)) return 'Deal value must be a valid number';
  if (num <= 0) return `Deal value must be greater than ${getCurrencySymbol(currencyCode)}0`;
  const usdEquivalent = convertToBaseCurrency(num, currencyCode);
  if (usdEquivalent > 10_000_000) {
    return `Deal value exceeds the maximum allowed (${formatCurrency(10_000_000, BASE_CURRENCY_CODE)} equivalent)`;
  }
  return null;
};

/**
 * Returns a display string for the exchange rate of 1 unit of `currency` in USD.
 * Used in informational tooltips. Examples: "0.2725", "1.087", "0.0120"
 */
export const getRateToUsdDisplay = (currency: string): string => {
  if (currency === BASE_CURRENCY_CODE) return '1.0000';
  const rate = convertToBaseCurrency(1, currency);
  if (rate >= 1)    return rate.toFixed(2);
  if (rate >= 0.01) return rate.toFixed(4);
  return rate.toFixed(6);
};

/** Last date the MOCK_RATES table was reviewed. Update when rates are refreshed. */
export const RATES_SNAPSHOT_DATE = 'Jun 2026 (approximate)';

// ─── Internal helpers ─────────────────────────────────────────────────────────

const round2 = (n: number): number => Math.round(n * 100) / 100;
