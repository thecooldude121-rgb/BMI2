export interface DealTag {
  id: string;
  label: string;
  category: string;
  color: string;
  textColor: string;
  borderColor: string;
  isCustom: boolean;
  usageCount: number;
}

export const ALL_DEAL_TAGS: DealTag[] = [
  // ── Deal Stage Context — indigo ──────────────────────────────────────────
  { id: 'hot',          label: 'Hot',          category: 'Deal Stage Context', color: 'bg-indigo-100', textColor: 'text-indigo-700', borderColor: 'border-indigo-300', isCustom: false, usageCount: 48 },
  { id: 'warm',         label: 'Warm',         category: 'Deal Stage Context', color: 'bg-indigo-100', textColor: 'text-indigo-700', borderColor: 'border-indigo-300', isCustom: false, usageCount: 42 },
  { id: 'cold',         label: 'Cold',         category: 'Deal Stage Context', color: 'bg-indigo-100', textColor: 'text-indigo-700', borderColor: 'border-indigo-300', isCustom: false, usageCount: 31 },
  { id: 'fast-track',   label: 'Fast Track',   category: 'Deal Stage Context', color: 'bg-indigo-100', textColor: 'text-indigo-700', borderColor: 'border-indigo-300', isCustom: false, usageCount: 22 },
  { id: 'at-risk',      label: 'At Risk',      category: 'Deal Stage Context', color: 'bg-indigo-100', textColor: 'text-indigo-700', borderColor: 'border-indigo-300', isCustom: false, usageCount: 17 },
  { id: 'stalled',      label: 'Stalled',      category: 'Deal Stage Context', color: 'bg-indigo-100', textColor: 'text-indigo-700', borderColor: 'border-indigo-300', isCustom: false, usageCount: 14 },
  { id: 'reactivation', label: 'Reactivation', category: 'Deal Stage Context', color: 'bg-indigo-100', textColor: 'text-indigo-700', borderColor: 'border-indigo-300', isCustom: false, usageCount: 9  },

  // ── Deal Size — blue ─────────────────────────────────────────────────────
  { id: 'enterprise',  label: 'Enterprise',  category: 'Deal Size', color: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300', isCustom: false, usageCount: 50 },
  { id: 'mid-market',  label: 'Mid-Market',  category: 'Deal Size', color: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300', isCustom: false, usageCount: 38 },
  { id: 'smb',         label: 'SMB',         category: 'Deal Size', color: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300', isCustom: false, usageCount: 33 },
  { id: 'high-value',  label: 'High Value',  category: 'Deal Size', color: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300', isCustom: false, usageCount: 27 },
  { id: 'whale',       label: 'Whale',       category: 'Deal Size', color: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300', isCustom: false, usageCount: 8  },
  { id: 'starter',     label: 'Starter',     category: 'Deal Size', color: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300', isCustom: false, usageCount: 19 },

  // ── Industry — green ─────────────────────────────────────────────────────
  { id: 'saas',          label: 'SaaS',          category: 'Industry', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300', isCustom: false, usageCount: 45 },
  { id: 'fintech',       label: 'Fintech',       category: 'Industry', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300', isCustom: false, usageCount: 29 },
  { id: 'retail',        label: 'Retail',        category: 'Industry', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300', isCustom: false, usageCount: 24 },
  { id: 'healthcare',    label: 'Healthcare',    category: 'Industry', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300', isCustom: false, usageCount: 21 },
  { id: 'manufacturing', label: 'Manufacturing', category: 'Industry', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300', isCustom: false, usageCount: 18 },
  { id: 'real-estate',   label: 'Real Estate',   category: 'Industry', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300', isCustom: false, usageCount: 15 },
  { id: 'logistics',     label: 'Logistics',     category: 'Industry', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300', isCustom: false, usageCount: 12 },
  { id: 'edtech',        label: 'EdTech',        category: 'Industry', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300', isCustom: false, usageCount: 10 },
  { id: 'media',         label: 'Media',         category: 'Industry', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300', isCustom: false, usageCount: 8  },
  { id: 'government',    label: 'Government',    category: 'Industry', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300', isCustom: false, usageCount: 6  },
  { id: 'bfsi',          label: 'BFSI',          category: 'Industry', color: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300', isCustom: false, usageCount: 13 },

  // ── Product Interest — purple ────────────────────────────────────────────
  { id: 'hrms-module',   label: 'HRMS Module',   category: 'Product Interest', color: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-300', isCustom: false, usageCount: 35 },
  { id: 'crm-module',    label: 'CRM Module',    category: 'Product Interest', color: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-300', isCustom: false, usageCount: 40 },
  { id: 'analytics',     label: 'Analytics',     category: 'Product Interest', color: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-300', isCustom: false, usageCount: 28 },
  { id: 'api-access',    label: 'API Access',    category: 'Product Interest', color: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-300', isCustom: false, usageCount: 22 },
  { id: 'integration',   label: 'Integration',   category: 'Product Interest', color: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-300', isCustom: false, usageCount: 31 },
  { id: 'custom-build',  label: 'Custom Build',  category: 'Product Interest', color: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-300', isCustom: false, usageCount: 14 },
  { id: 'white-label',   label: 'White Label',   category: 'Product Interest', color: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-300', isCustom: false, usageCount: 7  },
  { id: 'full-suite',    label: 'Full Suite',    category: 'Product Interest', color: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-300', isCustom: false, usageCount: 19 },

  // ── Relationship — amber ─────────────────────────────────────────────────
  { id: 'referral',           label: 'Referral',           category: 'Relationship', color: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-300', isCustom: false, usageCount: 36 },
  { id: 'champion-present',   label: 'Champion Present',   category: 'Relationship', color: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-300', isCustom: false, usageCount: 25 },
  { id: 'executive-sponsor',  label: 'Executive Sponsor',  category: 'Relationship', color: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-300', isCustom: false, usageCount: 20 },
  { id: 'cold-outreach-tag',  label: 'Cold Outreach',      category: 'Relationship', color: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-300', isCustom: false, usageCount: 30 },
  { id: 'inbound-tag',        label: 'Inbound',            category: 'Relationship', color: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-300', isCustom: false, usageCount: 28 },
  { id: 'partnership',        label: 'Partnership',        category: 'Relationship', color: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-300', isCustom: false, usageCount: 15 },
  { id: 'warm-introduction',  label: 'Warm Introduction',  category: 'Relationship', color: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-300', isCustom: false, usageCount: 22 },

  // ── Competitive — red ────────────────────────────────────────────────────
  { id: 'vs-salesforce',         label: 'vs Salesforce',         category: 'Competitive', color: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300', isCustom: false, usageCount: 32 },
  { id: 'vs-hubspot',            label: 'vs HubSpot',            category: 'Competitive', color: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300', isCustom: false, usageCount: 27 },
  { id: 'vs-zoho',               label: 'vs Zoho',               category: 'Competitive', color: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300', isCustom: false, usageCount: 19 },
  { id: 'vs-pipedrive',          label: 'vs Pipedrive',          category: 'Competitive', color: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300', isCustom: false, usageCount: 14 },
  { id: 'incumbent-vendor',      label: 'Incumbent Vendor',      category: 'Competitive', color: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300', isCustom: false, usageCount: 21 },
  { id: 'green-field',           label: 'Green Field',           category: 'Competitive', color: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300', isCustom: false, usageCount: 18 },
  { id: 'competitive-bake-off',  label: 'Competitive Bake-off',  category: 'Competitive', color: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300', isCustom: false, usageCount: 11 },
  { id: 'sole-source',           label: 'Sole Source',           category: 'Competitive', color: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300', isCustom: false, usageCount: 8  },

  // ── Geography — teal ─────────────────────────────────────────────────────
  { id: 'india',          label: 'India',          category: 'Geography', color: 'bg-teal-100', textColor: 'text-teal-700', borderColor: 'border-teal-300', isCustom: false, usageCount: 44 },
  { id: 'mena',           label: 'MENA',           category: 'Geography', color: 'bg-teal-100', textColor: 'text-teal-700', borderColor: 'border-teal-300', isCustom: false, usageCount: 26 },
  { id: 'southeast-asia', label: 'Southeast Asia', category: 'Geography', color: 'bg-teal-100', textColor: 'text-teal-700', borderColor: 'border-teal-300', isCustom: false, usageCount: 22 },
  { id: 'us',             label: 'US',             category: 'Geography', color: 'bg-teal-100', textColor: 'text-teal-700', borderColor: 'border-teal-300', isCustom: false, usageCount: 38 },
  { id: 'europe',         label: 'Europe',         category: 'Geography', color: 'bg-teal-100', textColor: 'text-teal-700', borderColor: 'border-teal-300', isCustom: false, usageCount: 30 },
  { id: 'apac',           label: 'APAC',           category: 'Geography', color: 'bg-teal-100', textColor: 'text-teal-700', borderColor: 'border-teal-300', isCustom: false, usageCount: 24 },
  { id: 'middle-east',    label: 'Middle East',    category: 'Geography', color: 'bg-teal-100', textColor: 'text-teal-700', borderColor: 'border-teal-300', isCustom: false, usageCount: 17 },
  { id: 'africa',         label: 'Africa',         category: 'Geography', color: 'bg-teal-100', textColor: 'text-teal-700', borderColor: 'border-teal-300', isCustom: false, usageCount: 10 },
];
