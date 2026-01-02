// Prospect filtering types

export type ProspectStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'nurturing';
export type EngagementLevel = 'high' | 'medium' | 'low';
export type CompanySize = '<50' | '50-200' | '200-500' | '500-1000' | '1000+';

export interface ScoreRange {
  min: number;
  max: number;
}

export interface DateRange {
  from?: string;
  to?: string;
}

export interface LocationFilter {
  city?: string;
  state?: string;
  country?: string;
}

export interface ProspectFilters {
  // Status filters
  statuses: ProspectStatus[];

  // Score ranges
  leadScore: ScoreRange;
  aiScore: ScoreRange;
  qualityScore: ScoreRange;

  // Company filters
  companySizes: CompanySize[];
  industries: string[];

  // Date ranges
  createdDate: DateRange;
  lastContactedDate: DateRange;
  lastUpdatedDate: DateRange;

  // Tags and engagement
  tags: string[];
  engagementLevels: EngagementLevel[];

  // Location
  location: LocationFilter;

  // Search
  searchQuery: string;
}

export interface FilterChip {
  id: string;
  category: string;
  label: string;
  value: string | string[];
  onRemove: () => void;
}

export interface SavedFilterSet {
  id: string;
  name: string;
  description?: string;
  filters: ProspectFilters;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export const DEFAULT_FILTERS: ProspectFilters = {
  statuses: [],
  leadScore: { min: 0, max: 100 },
  aiScore: { min: 0, max: 100 },
  qualityScore: { min: 0, max: 100 },
  companySizes: [],
  industries: [],
  createdDate: {},
  lastContactedDate: {},
  lastUpdatedDate: {},
  tags: [],
  engagementLevels: [],
  location: {},
  searchQuery: ''
};

export const INDUSTRIES: FilterOption[] = [
  { value: 'software', label: 'Software' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'education', label: 'Education' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'technology', label: 'Technology' },
  { value: 'telecommunications', label: 'Telecommunications' }
];

export const COMPANY_SIZE_OPTIONS: FilterOption[] = [
  { value: '<50', label: '1-49 employees' },
  { value: '50-200', label: '50-200 employees' },
  { value: '200-500', label: '200-500 employees' },
  { value: '500-1000', label: '500-1,000 employees' },
  { value: '1000+', label: '1,000+ employees' }
];

export const STATUS_OPTIONS: FilterOption[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'unqualified', label: 'Unqualified' },
  { value: 'nurturing', label: 'Nurturing' }
];

export const ENGAGEMENT_OPTIONS: FilterOption[] = [
  { value: 'high', label: 'High (Replied)' },
  { value: 'medium', label: 'Medium (Opened)' },
  { value: 'low', label: 'Low (Not Opened)' }
];
