/**
 * Every value in these two unions is enforced by a CHECK constraint on
 * `contacts` (migration 020). The constraint is the authority — read it with
 *   SELECT pg_get_constraintdef(oid) FROM pg_constraint
 *    WHERE conrelid = 'contacts'::regclass AND contype = 'c';
 * and change it in a migration before widening either union here. Typing a
 * value the database rejects is how `leads.stage` came to be mishandled for
 * every real row.
 */
export type ContactSource =
  | 'lead-gen' | 'hrms' | 'converted' | 'manual' | 'website' | 'referral' | 'event';

/**
 * 'do-not-contact' is a suppression flag, NOT a synonym for 'inactive'.
 * inactive = not worth contacting; do-not-contact = must not be contacted.
 */
export type ContactStatus = 'active' | 'inactive' | 'do-not-contact';

export interface Contact {
  id: string;
  name: string;
  company: string;
  position: string;
  email: string;
  phone?: string;
  /**
   * OPTIONAL because contacts.source is nullable and most existing rows have
   * no source recorded. Defaulting it to 'manual' made the contacts list
   * report "✍️ Manual" for every one of them — an invented fact about where a
   * record came from. Guard before rendering.
   */
  source?: ContactSource;
  sourceDetails?: string;
  tags: string[];
  status: ContactStatus;

  // Real columns on the contacts table, previously missing from this type.
  companyId?: string;
  department?: string;
  linkedinUrl?: string;
  isPrimary?: boolean;
  mobile?: string;

  // Added by migration 020, so the contact form stops discarding these.
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  /** IANA zone name, e.g. 'America/Los_Angeles'. Not a display label. */
  timezone?: string;
  notes?: string;
  /** FK to users(id). Absent means genuinely unassigned — do not default it. */
  ownerId?: number;
  /** Resolved from the users join; absent when ownerId is absent. */
  ownerName?: string;

  /**
   * Now OPTIONAL. There is no activity data for contacts — no column, no API —
   * so a record loaded from the server genuinely has no last-contact date.
   * Making it required forced callers to invent one. Guard before reading.
   */
  lastContact?: {
    date: string;
    type: 'meeting' | 'email' | 'call' | 'note';
    details?: string;
  };
  aiEnriched?: boolean;
  enrichedDataPoints?: number;
  activeDeal?: {
    title: string;
    value: number;
    stage: string;
  };
  nextAction?: {
    type: string;
    dueDate: string;
  };
  warningMessage?: string;
  aiScore?: number;
  conversionProbability?: number;
  hrmsBonus?: boolean;
  enrichmentData?: {
    companySize?: string;
    companyRevenue?: string;
    recentFunding?: string;
    fundingDate?: string;
    industry?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ContactStats {
  total: number;
  activeDeals: number;
  fromLeadGen: number;
  fromHRMS: number;
  vip: number;
}

export interface ContactFilters {
  status: 'all' | ContactStatus;
  source: 'all' | ContactSource;
  tags: 'all' | string;
  searchQuery: string;
  sortBy: 'lastContact' | 'name' | 'company' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
