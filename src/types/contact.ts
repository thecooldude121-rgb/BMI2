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
  lastContact: {
    date: string;
    type: 'meeting' | 'email' | 'call';
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
