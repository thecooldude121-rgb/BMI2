// ─── Competitor Configuration ─────────────────────────────────────────────────
// Seeded list of common competitors for the "Competing Against" field.
// To add a competitor: append one entry. The id is stable for analytics.
// Reps can also enter free-text custom competitors not in this list.
//
// category is used for future grouping/filtering in win-loss reports.

export type CompetitorCategory = 'crm' | 'erp' | 'marketing' | 'analytics' | 'other';

export interface CompetitorOption {
  id: string;
  name: string;
  category: CompetitorCategory;
}

// Shape stored in formData and payload — covers both seeded and custom entries
export interface Competitor {
  id: string;        // config id for seeded, or 'custom-<uuid-prefix>' for free-text
  name: string;      // display name
  isCustom: boolean; // true when the rep typed it rather than selecting from list
}

export const COMPETITORS: CompetitorOption[] = [
  { id: 'salesforce',          name: 'Salesforce',           category: 'crm'       },
  { id: 'hubspot',             name: 'HubSpot',              category: 'crm'       },
  { id: 'pipedrive',           name: 'Pipedrive',            category: 'crm'       },
  { id: 'zoho-crm',            name: 'Zoho CRM',             category: 'crm'       },
  { id: 'microsoft-dynamics',  name: 'Microsoft Dynamics',   category: 'crm'       },
  { id: 'monday-crm',          name: 'Monday.com',           category: 'crm'       },
  { id: 'freshsales',          name: 'Freshsales',           category: 'crm'       },
  { id: 'close-crm',           name: 'Close',                category: 'crm'       },
  { id: 'copper',              name: 'Copper',               category: 'crm'       },
  { id: 'sap',                 name: 'SAP',                  category: 'erp'       },
  { id: 'oracle',              name: 'Oracle',               category: 'erp'       },
  { id: 'marketo',             name: 'Marketo',              category: 'marketing' },
  { id: 'none',                name: 'No Competition',       category: 'other'     },
];

// Popular quick-add picks shown when search input is empty
export const POPULAR_COMPETITORS: string[] = [
  'salesforce', 'hubspot', 'pipedrive', 'zoho-crm', 'microsoft-dynamics',
];

export const getCompetitorById = (id: string): CompetitorOption | undefined =>
  COMPETITORS.find(c => c.id === id);
