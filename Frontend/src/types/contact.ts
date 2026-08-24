export interface Contact {
  id: string;
  name: string;
  company: string;
  position: string;
  email: string;
  phone?: string;
  source: 'lead-gen' | 'hrms' | 'manual' | 'website';
  sourceDetails?: string;
  tags: string[];
  status: 'active' | 'inactive';

  // Real columns on the contacts table, previously missing from this type.
  companyId?: string;
  department?: string;
  linkedinUrl?: string;
  isPrimary?: boolean;

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
  status: 'all' | 'active' | 'inactive';
  source: 'all' | 'lead-gen' | 'hrms' | 'manual' | 'website';
  tags: 'all' | string;
  searchQuery: string;
  sortBy: 'lastContact' | 'name' | 'company' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
