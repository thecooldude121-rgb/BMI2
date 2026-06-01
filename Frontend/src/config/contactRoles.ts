// ─── Contact Role Configuration ───────────────────────────────────────────────
// Shared constants for deal stakeholder roles.
//
// id            → analytics-safe enum used in DB/payload (never change)
// label         → display text shown in dropdowns and chips
// description   → tooltip / AI context
// isSeniorBuyer → true for roles that indicate a senior buying authority;
//                 used for the missing-buyer advisory and AI recommendations
// chipColor     → Tailwind color key for preview chips

export interface ContactRole {
  id: string;
  label: string;
  description: string;
  isSeniorBuyer: boolean;
  chipColor: 'blue' | 'green' | 'amber' | 'purple' | 'gray' | 'red';
}

export const CONTACT_ROLES: ContactRole[] = [
  {
    id: 'champion',
    label: 'Champion',
    description: 'Internal advocate who drives adoption and sells internally',
    isSeniorBuyer: false,
    chipColor: 'blue',
  },
  {
    id: 'decision-maker',
    label: 'Decision Maker',
    description: 'Has final authority to approve or reject the deal',
    isSeniorBuyer: true,
    chipColor: 'green',
  },
  {
    id: 'economic-buyer',
    label: 'Economic Buyer',
    description: 'Controls the budget and signs off on spend',
    isSeniorBuyer: true,
    chipColor: 'green',
  },
  {
    id: 'influencer',
    label: 'Influencer',
    description: 'Shapes opinion without formal authority',
    isSeniorBuyer: false,
    chipColor: 'purple',
  },
  {
    id: 'technical-evaluator',
    label: 'Technical Evaluator',
    description: 'Assesses technical fit, security, and integration',
    isSeniorBuyer: false,
    chipColor: 'amber',
  },
  {
    id: 'user',
    label: 'User',
    description: 'End user of the product',
    isSeniorBuyer: false,
    chipColor: 'gray',
  },
  {
    id: 'legal-procurement',
    label: 'Legal / Procurement',
    description: 'Reviews contracts, compliance, and vendor terms',
    isSeniorBuyer: false,
    chipColor: 'amber',
  },
  {
    id: 'blocker-detractor',
    label: 'Blocker / Detractor',
    description: 'Actively opposing or slowing the deal',
    isSeniorBuyer: false,
    chipColor: 'red',
  },
];

export const DEFAULT_CONTACT_ROLE = CONTACT_ROLES[0]; // champion

export const getContactRole = (id: string): ContactRole =>
  CONTACT_ROLES.find(r => r.id === id) ?? DEFAULT_CONTACT_ROLE;

// ─── Stakeholder type ─────────────────────────────────────────────────────────
// Shared shape for both primary and additional contacts.
// isPrimary distinguishes the required lead contact from optional stakeholders.

export interface StakeholderContact {
  id: string;         // temp key (uuid-like) for list reconciliation
  name: string;
  email?: string;
  title?: string;     // job title e.g. "VP Engineering"
  role: string;       // ContactRole id
  isPrimary: boolean;
}

// ─── Advisory helper ──────────────────────────────────────────────────────────

/**
 * Returns true if at least one stakeholder (primary or additional) has a role
 * with isSeniorBuyer: true (Decision Maker or Economic Buyer).
 * Used for the missing-buyer advisory and AI recommendations.
 */
export const hasSeniorBuyer = (
  primaryRole: string,
  additionalContacts: StakeholderContact[]
): boolean => {
  if (getContactRole(primaryRole).isSeniorBuyer) return true;
  return additionalContacts.some(c => getContactRole(c.role).isSeniorBuyer);
};

/** Tailwind classes for a role chip by color key. */
export const roleChipClasses = (color: ContactRole['chipColor']): string => {
  const map: Record<ContactRole['chipColor'], string> = {
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    green:  'bg-green-50 text-green-700 border-green-100',
    amber:  'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    gray:   'bg-gray-50 text-gray-600 border-gray-200',
    red:    'bg-red-50 text-red-700 border-red-100',
  };
  return map[color];
};
