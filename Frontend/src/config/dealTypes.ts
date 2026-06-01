// ─── Deal Type Configuration ──────────────────────────────────────────────────
// id   → analytics/DB/payload value (snake_case enum, stable)
// label → display text shown to the user
// description → tooltip / helper context
//
// To add a new type: append one entry. The id goes to the DB and reporting
// pipelines; the label is UI-only and can change without breaking analytics.

export interface DealType {
  id: string;
  label: string;
  description: string;
}

export const DEAL_TYPES: DealType[] = [
  {
    id: 'new-business',
    label: 'New Business',
    description: 'First-time sale to a new customer',
  },
  {
    id: 'upsell',
    label: 'Upsell',
    description: 'Selling a higher-tier product to an existing customer',
  },
  {
    id: 'cross-sell',
    label: 'Cross-sell',
    description: 'Selling an additional product to an existing customer',
  },
  {
    id: 'renewal',
    label: 'Renewal',
    description: 'Renewing an existing contract or subscription',
  },
  {
    id: 'reactivation',
    label: 'Reactivation',
    description: 'Re-engaging a churned or lapsed customer',
  },
];

export const DEFAULT_DEAL_TYPE = DEAL_TYPES[0]; // new-business

export const getDealType = (id: string): DealType =>
  DEAL_TYPES.find(d => d.id === id) ?? DEFAULT_DEAL_TYPE;
