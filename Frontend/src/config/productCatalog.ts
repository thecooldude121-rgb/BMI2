// ─── Product Catalog ──────────────────────────────────────────────────────────
// Source of truth for product pricing and billing cadence compatibility.
// To add a product: append one entry. To change a price: edit baseMonthlyPrice.
// The pricing engine reads this config — no JSX or component code needs updating.

export type BillingCadence = 'Monthly' | 'Quarterly' | 'Annual' | 'Multi-year';

export interface CatalogProduct {
  id: string;              // matches the product select option value
  name: string;
  baseMonthlyPrice: number | null;  // null = custom pricing, no suggestion generated
  defaultCurrency: 'USD';
  supportedCadences: BillingCadence[];
  description: string;
}

export const PRODUCT_CATALOG: CatalogProduct[] = [
  {
    id: 'Basic Plan',
    name: 'Basic Plan',
    baseMonthlyPrice: 299,
    defaultCurrency: 'USD',
    supportedCadences: ['Monthly', 'Annual'],
    description: 'Core CRM features for small teams',
  },
  {
    id: 'Growth Plan',
    name: 'Growth Plan',
    baseMonthlyPrice: 799,
    defaultCurrency: 'USD',
    supportedCadences: ['Monthly', 'Quarterly', 'Annual'],
    description: 'Advanced automation and reporting',
  },
  {
    id: 'Enterprise Plan',
    name: 'Enterprise Plan',
    baseMonthlyPrice: 2499,
    defaultCurrency: 'USD',
    supportedCadences: ['Annual', 'Multi-year'],
    description: 'Full platform with dedicated support and custom integrations',
  },
  {
    id: 'Add-on Module',
    name: 'Add-on Module',
    baseMonthlyPrice: 199,
    defaultCurrency: 'USD',
    supportedCadences: ['Monthly', 'Annual'],
    description: 'Extension module added to an existing plan',
  },
  {
    id: 'Custom Solution',
    name: 'Custom Solution',
    baseMonthlyPrice: null,   // custom pricing — no suggestion generated
    defaultCurrency: 'USD',
    supportedCadences: ['Monthly', 'Quarterly', 'Annual', 'Multi-year'],
    description: 'Fully custom scope and pricing — discuss with sales',
  },
];

// ─── Billing cadence multipliers ──────────────────────────────────────────────
// Maps a billing cadence to the number of months billed per contract period.
// Annual rounding is applied by the pricing engine to produce clean numbers.
export const CADENCE_MONTHS: Record<BillingCadence, number> = {
  'Monthly':    1,
  'Quarterly':  3,
  'Annual':     12,
  'Multi-year': 24,
};

export const getCatalogProduct = (id: string): CatalogProduct | undefined =>
  PRODUCT_CATALOG.find(p => p.id === id);
