// Data Enrichment and Validation Types

export type EnrichmentStatus = 'pending' | 'processing' | 'complete' | 'failed' | 'partial';
export type EmailVerificationStatus = 'verified' | 'unverified' | 'invalid' | 'risky';
export type DataQualityLevel = 'excellent' | 'good' | 'fair' | 'poor';
export type EnrichmentProvider = 'clearbit' | 'zoominfo' | 'apollo' | 'hunter' | 'manual';

export interface EnrichmentJob {
  id: string;
  prospectId: string;
  status: EnrichmentStatus;
  provider: EnrichmentProvider;
  dataTypes: EnrichmentDataType[];
  startedAt: string;
  completedAt?: string;
  creditsUsed: number;
  results?: EnrichmentResult;
  errors?: EnrichmentError[];
}

export type EnrichmentDataType =
  | 'email_validation'
  | 'phone_validation'
  | 'linkedin_profile'
  | 'company_data'
  | 'social_profiles'
  | 'news_updates'
  | 'tech_stack'
  | 'funding_data';

export interface EnrichmentResult {
  dataType: EnrichmentDataType;
  data: any;
  confidence: number;
  provider: EnrichmentProvider;
  timestamp: string;
}

export interface EnrichmentError {
  dataType: EnrichmentDataType;
  error: string;
  provider: EnrichmentProvider;
  timestamp: string;
}

export interface EmailValidation {
  email: string;
  isValid: boolean;
  status: EmailVerificationStatus;
  deliverability: 'deliverable' | 'undeliverable' | 'unknown';
  isDisposable: boolean;
  isRoleBased: boolean;
  bounceRisk: 'low' | 'medium' | 'high';
  provider: string;
  verifiedAt: string;
  smtpCheck: boolean;
  mxRecords: boolean;
}

export interface PhoneValidation {
  phone: string;
  isValid: boolean;
  formatted: string;
  countryCode: string;
  lineType: 'mobile' | 'landline' | 'voip' | 'unknown';
  carrier?: string;
  verifiedAt: string;
}

export interface LinkedInProfile {
  url: string;
  photoUrl?: string;
  headline?: string;
  connections?: number;
  experience: LinkedInExperience[];
  education: LinkedInEducation[];
  skills: string[];
  endorsements: number;
  recommendations: number;
  lastUpdated: string;
}

export interface LinkedInExperience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface LinkedInEducation {
  school: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
}

export interface CompanyData {
  name: string;
  domain: string;
  logoUrl?: string;
  description?: string;
  industry?: string;
  employeeCount?: number;
  employeeRange?: string;
  revenue?: number;
  revenueRange?: string;
  founded?: number;
  location?: CompanyLocation;
  techStack?: string[];
  socialProfiles?: SocialProfiles;
  fundingData?: FundingData;
  newsUpdates?: NewsUpdate[];
  lastUpdated: string;
}

export interface CompanyLocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface SocialProfiles {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  github?: string;
  instagram?: string;
}

export interface FundingData {
  totalFunding?: number;
  lastFundingAmount?: number;
  lastFundingDate?: string;
  fundingRounds?: number;
  investors?: string[];
  stage?: string;
}

export interface NewsUpdate {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary?: string;
}

export interface DataQualityReport {
  overallScore: number;
  level: DataQualityLevel;
  completeness: number;
  accuracy: number;
  freshness: number;
  validations: ValidationResult[];
  missingFields: string[];
  staleFields: StaleField[];
  lastAssessed: string;
}

export interface ValidationResult {
  field: string;
  isValid: boolean;
  status: 'valid' | 'invalid' | 'warning' | 'unchecked';
  message?: string;
  checkedAt: string;
}

export interface StaleField {
  field: string;
  lastUpdated: string;
  daysOld: number;
  isStale: boolean;
}

export interface DataCompletenessProfile {
  prospectId: string;
  completeness: number;
  checklist: CompletenessItem[];
  suggestedActions: string[];
  criticalMissing: string[];
  lastUpdated: string;
}

export interface CompletenessItem {
  field: string;
  label: string;
  completed: boolean;
  required: boolean;
  weight: number;
}

export interface DuplicateProspect {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  similarity: number;
  matchedFields: string[];
  createdAt: string;
}

export interface EnrichmentConfig {
  autoEnrichOnCreate: boolean;
  enabledProviders: EnrichmentProvider[];
  defaultProvider: EnrichmentProvider;
  autoValidateEmail: boolean;
  autoValidatePhone: boolean;
  duplicateDetection: boolean;
  batchSize: number;
  retryAttempts: number;
  cacheExpiry: number;
}

export interface EnrichmentCredits {
  provider: EnrichmentProvider;
  remaining: number;
  total: number;
  costPerEnrichment: number;
  resetDate?: string;
}

export interface EnrichmentQueueItem {
  id: string;
  prospectId: string;
  dataTypes: EnrichmentDataType[];
  priority: 'high' | 'medium' | 'low';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  scheduledFor: string;
  createdAt: string;
  processedAt?: string;
}

export const ENRICHMENT_DATA_TYPE_LABELS: Record<EnrichmentDataType, string> = {
  email_validation: 'Email Validation',
  phone_validation: 'Phone Validation',
  linkedin_profile: 'LinkedIn Profile',
  company_data: 'Company Data',
  social_profiles: 'Social Profiles',
  news_updates: 'News & Updates',
  tech_stack: 'Tech Stack',
  funding_data: 'Funding Data'
};

export const ENRICHMENT_PROVIDER_LABELS: Record<EnrichmentProvider, string> = {
  clearbit: 'Clearbit',
  zoominfo: 'ZoomInfo',
  apollo: 'Apollo.io',
  hunter: 'Hunter.io',
  manual: 'Manual Entry'
};

export const ENRICHMENT_COSTS: Record<EnrichmentProvider, Record<EnrichmentDataType, number>> = {
  clearbit: {
    email_validation: 0.1,
    phone_validation: 0.1,
    linkedin_profile: 1.0,
    company_data: 1.0,
    social_profiles: 0.5,
    news_updates: 0.5,
    tech_stack: 0.75,
    funding_data: 0.75
  },
  zoominfo: {
    email_validation: 0.2,
    phone_validation: 0.2,
    linkedin_profile: 2.0,
    company_data: 2.0,
    social_profiles: 1.0,
    news_updates: 1.0,
    tech_stack: 1.5,
    funding_data: 1.5
  },
  apollo: {
    email_validation: 0.1,
    phone_validation: 0.1,
    linkedin_profile: 0.5,
    company_data: 0.5,
    social_profiles: 0.25,
    news_updates: 0.25,
    tech_stack: 0.5,
    funding_data: 0.5
  },
  hunter: {
    email_validation: 0.05,
    phone_validation: 0.05,
    linkedin_profile: 0.5,
    company_data: 0.5,
    social_profiles: 0.25,
    news_updates: 0.25,
    tech_stack: 0.5,
    funding_data: 0.5
  },
  manual: {
    email_validation: 0,
    phone_validation: 0,
    linkedin_profile: 0,
    company_data: 0,
    social_profiles: 0,
    news_updates: 0,
    tech_stack: 0,
    funding_data: 0
  }
};

export const CRITICAL_FIELDS = [
  'email',
  'firstName',
  'lastName',
  'companyName',
  'jobTitle'
];

export const COMPLETENESS_WEIGHTS: Record<string, number> = {
  email: 15,
  phone: 10,
  firstName: 10,
  lastName: 10,
  companyName: 10,
  jobTitle: 10,
  linkedinUrl: 8,
  industry: 5,
  location: 5,
  companySize: 5,
  companyWebsite: 5,
  notes: 4,
  tags: 3
};
