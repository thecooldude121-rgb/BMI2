// ─── Currency Configuration ───────────────────────────────────────────────────
// Single source of truth for all supported currencies.
// To add a new currency: append one entry to SUPPORTED_CURRENCIES below.
// Nothing else needs to change in the UI or utilities.

export interface CurrencyConfig {
  code: string;       // ISO 4217 code
  symbol: string;     // Display symbol
  name: string;       // Full name shown in selector
  locale: string;     // BCP 47 locale for Intl.NumberFormat
  symbolPosition: 'prefix' | 'suffix'; // Where the symbol appears
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$',  name: 'US Dollar',            locale: 'en-US',  symbolPosition: 'prefix' },
  { code: 'EUR', symbol: '€',  name: 'Euro',                 locale: 'de-DE',  symbolPosition: 'prefix' },
  { code: 'GBP', symbol: '£',  name: 'British Pound',        locale: 'en-GB',  symbolPosition: 'prefix' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham',          locale: 'ar-AE',  symbolPosition: 'suffix' },
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee',         locale: 'en-IN',  symbolPosition: 'prefix' },
  { code: 'SAR', symbol: '﷼',  name: 'Saudi Riyal',          locale: 'ar-SA',  symbolPosition: 'suffix' },
  { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira',       locale: 'en-NG',  symbolPosition: 'prefix' },
  { code: 'ZAR', symbol: 'R',  name: 'South African Rand',   locale: 'en-ZA',  symbolPosition: 'prefix' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar',     locale: 'en-SG',  symbolPosition: 'prefix' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar',      locale: 'en-CA',  symbolPosition: 'prefix' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar',    locale: 'en-AU',  symbolPosition: 'prefix' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',         locale: 'ja-JP',  symbolPosition: 'prefix' },
];

// Lookup map for O(1) access by code
export const CURRENCY_MAP: Record<string, CurrencyConfig> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((c) => [c.code, c])
);

// System base currency used for normalized reporting
// In a real org, this would come from org settings / tenant config
export const BASE_CURRENCY_CODE = 'USD';

export const getCurrency = (code: string): CurrencyConfig =>
  CURRENCY_MAP[code] ?? CURRENCY_MAP[BASE_CURRENCY_CODE];
