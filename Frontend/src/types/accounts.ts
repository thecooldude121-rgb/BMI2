export interface EnhancedAccount {
  id: string;
  name: string;
  accountNumber?: string;
  parentAccountId?: string;
  type: 'prospect' | 'customer' | 'partner' | 'vendor' | 'competitor';
  industry: string;
  subIndustry?: string;
  accountSize: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1001-5000' | '5000+';
  annualRevenue?: number;
  revenueCurrency: string;
  employeeCount?: number;

  website?: string;
  phone?: string;
  fax?: string;
  email?: string;

  billingAddress: Address;
  shippingAddress: Address;

  description?: string;
  businessModel?: string;
  foundingYear?: number;
  stockSymbol?: string;
  territory?: string;

  status: 'active' | 'inactive' | 'archived' | 'suspended';
  rating: 'hot' | 'warm' | 'cold';
  priority: 'low' | 'medium' | 'high' | 'critical';

  source: 'lead-gen' | 'hrms' | 'manual' | 'partner' | 'website' | 'referral';
  sourceDetails?: string;
  hrmsConnection?: {
    hasConnection: boolean;
    recruitedEmployees?: number;
    lastRecruitmentDate?: string;
    recruitedContacts?: Array<{
      name: string;
      position: string;
      dateRecruited: string;
    }>;
  };

  ownerId: string;
  assignedTeamId?: string;

  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;

  customFields: Record<string, any>;
  tags: string[];

  healthScore?: number;
  engagementScore?: number;

  firstContactDate?: string;
  lastActivityDate?: string;
  lastContactedDate?: string;
  nextFollowUpDate?: string;

  dataConsent: boolean;
  dataConsentDate?: string;
  doNotContact: boolean;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  deletedAt?: string;

  hierarchy?: AccountHierarchy;
  relatedContacts?: AccountContact[];
  relatedDeals?: AccountDeal[];
  recentActivities?: AccountActivity[];
  stats?: AccountStats;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface AccountHierarchy {
  parentAccount?: EnhancedAccount;
  childAccounts: EnhancedAccount[];
  level: number;
  path: string[];
}

export interface AccountContact {
  id: string;
  accountId: string;
  contactId: string;
  contact?: Contact;
  relationshipType: 'business' | 'technical' | 'billing' | 'executive' | 'other';
  isPrimary: boolean;
  title?: string;
  department?: string;
  influenceLevel: 'low' | 'medium' | 'high' | 'decision_maker';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  position?: string;
  department?: string;
  linkedinUrl?: string;
  isPrimary: boolean;
  status: 'active' | 'inactive' | 'bounced' | 'unsubscribed';
}

export interface AccountDeal {
  id: string;
  accountId: string;
  dealId: string;
  deal?: Deal;
  isPrimaryAccount: boolean;
  createdAt: string;
}

export interface Deal {
  id: string;
  name: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate?: string;
  status: 'open' | 'won' | 'lost';
}

export interface AccountActivity {
  id: string;
  accountId: string;
  activityType: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'sms' | 'whatsapp' | 'linkedin' | 'demo' | 'proposal' | 'document' | 'support_ticket' | 'site_visit' | 'contract_signed';
  subject: string;
  description?: string;

  contactId?: string;
  dealId?: string;

  direction?: 'inbound' | 'outbound';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  outcome?: string;

  scheduledAt?: string;
  completedAt?: string;
  durationMinutes?: number;

  location?: string;
  meetingUrl?: string;
  recordingUrl?: string;

  participants: ActivityParticipant[];
  attendees: string[];
  attachmentUrls: string[];

  createdBy: string;
  assignedTo?: string;
  automated: boolean;
  automationId?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ActivityParticipant {
  id: string;
  type: 'user' | 'contact' | 'external';
  name: string;
  email?: string;
  role?: string;
}

export interface AccountNote {
  id: string;
  accountId: string;
  parentNoteId?: string;
  content: string;
  noteType: 'general' | 'internal' | 'customer_facing' | 'decision' | 'risk' | 'opportunity';

  mentions: Mention[];
  mentionedUsers: string[];

  attachments: NoteAttachment[];

  isPrivate: boolean;
  visibleToTeam: boolean;

  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;

  reactions: Record<string, string[]>;
  replies?: AccountNote[];
}

export interface Mention {
  userId: string;
  userName: string;
  position: number;
}

export interface NoteAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

export interface AccountDocument {
  id: string;
  accountId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  storagePath: string;

  documentType: 'contract' | 'proposal' | 'invoice' | 'presentation' | 'report' | 'legal' | 'other';
  description?: string;
  version: number;

  relatedDealId?: string;
  relatedActivityId?: string;

  isConfidential: boolean;
  accessLevel: 'private' | 'team' | 'account' | 'public';

  uploadedBy: string;
  uploadedAt: string;

  downloadedCount: number;
  lastAccessedAt?: string;
  lastAccessedBy?: string;

  createdAt: string;
}

export interface AccountCustomField {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'email' | 'phone' | 'url' | 'date' | 'datetime' | 'select' | 'multiselect' | 'boolean' | 'textarea' | 'currency' | 'percentage';

  isRequired: boolean;
  defaultValue?: string;
  options?: any;
  validationRules?: ValidationRule[];

  displayOrder: number;
  isVisible: boolean;
  isSearchable: boolean;
  helpText?: string;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message: string;
}

export interface AccountAuditLog {
  id: string;
  accountId: string;
  action: 'created' | 'updated' | 'deleted' | 'viewed' | 'exported' | 'imported' | 'merged' | 'restored';
  entityType: string;

  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields: string[];

  userId: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;

  description?: string;
  metadata: Record<string, any>;

  createdAt: string;
}

export interface AccountWorkflow {
  id: string;
  name: string;
  description?: string;

  triggerType: 'created' | 'updated' | 'field_changed' | 'status_changed' | 'time_based' | 'manual';
  triggerConditions: WorkflowCondition[];

  actions: WorkflowAction[];

  isActive: boolean;
  runOnce: boolean;
  priority: number;

  executionCount: number;
  successCount: number;
  failureCount: number;
  lastExecutedAt?: string;
  lastError?: string;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty' | 'starts_with' | 'ends_with';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'create_task' | 'send_email' | 'assign_user' | 'update_field' | 'create_activity' | 'send_notification' | 'webhook' | 'update_status' | 'add_tag' | 'create_deal';
  parameters: Record<string, any>;
  delay?: number;
  condition?: WorkflowCondition;
}

export interface AccountDuplicate {
  id: string;
  accountId1: string;
  accountId2: string;
  account1?: EnhancedAccount;
  account2?: EnhancedAccount;
  confidenceScore: number;

  matchingFields: string[];
  similarityDetails: Record<string, any>;

  status: 'pending' | 'confirmed' | 'not_duplicate' | 'merged' | 'ignored';
  reviewedBy?: string;
  reviewedAt?: string;
  mergedIntoAccountId?: string;

  detectedAt: string;
}

export interface AccountImport {
  id: string;
  fileName: string;
  fileSize: number;

  fieldMapping: Record<string, string>;
  importOptions: ImportOptions;

  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

  totalRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  errors: ImportError[];

  createdAccountIds: string[];

  importedBy: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ImportOptions {
  skipDuplicates: boolean;
  updateExisting: boolean;
  validateData: boolean;
  createMissingContacts: boolean;
  defaultOwnerId?: string;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface AccountStats {
  totalContacts: number;
  totalDeals: number;
  totalActivities: number;
  totalDocuments: number;
  totalNotes: number;

  openDealsValue: number;
  wonDealsValue: number;
  dealConversionRate: number;

  lastActivityDate?: string;
  daysInactive: number;
  activitiesThisMonth: number;
  activitiesLastMonth: number;

  healthScore: number;
  engagementScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AccountFilter {
  search?: string;
  type?: string[];
  industry?: string[];
  accountSize?: string[];
  status?: string[];
  rating?: string[];
  ownerId?: string[];
  tags?: string[];
  customFields?: Record<string, any>;
  dateRange?: {
    field: 'createdAt' | 'updatedAt' | 'lastActivityDate' | 'lastContactedDate';
    from?: string;
    to?: string;
  };
  healthScoreRange?: {
    min?: number;
    max?: number;
  };
  revenueRange?: {
    min?: number;
    max?: number;
  };
}

export interface AccountView {
  id: string;
  name: string;
  description?: string;
  filter: AccountFilter;
  columns: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isDefault: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

export interface BulkAction {
  action: 'update_status' | 'update_owner' | 'add_tags' | 'remove_tags' | 'merge' | 'delete' | 'export' | 'assign_team';
  accountIds: string[];
  parameters?: Record<string, any>;
}

export interface MergeAccountsRequest {
  primaryAccountId: string;
  secondaryAccountIds: string[];
  mergeStrategy: {
    contacts: 'move_all' | 'keep_primary' | 'manual_select';
    deals: 'move_all' | 'keep_primary' | 'manual_select';
    activities: 'move_all' | 'keep_primary';
    notes: 'move_all' | 'keep_primary';
    documents: 'move_all' | 'keep_primary';
    customFields: 'prefer_primary' | 'prefer_secondary' | 'merge';
  };
  preserveHistory: boolean;
}

export interface AccountKPI {
  totalAccounts: number;
  activeAccounts: number;
  newAccountsThisMonth: number;
  newAccountsLastMonth: number;
  accountsWithRecentActivity: number;
  accountsAtRisk: number;

  averageHealthScore: number;
  averageEngagementScore: number;
  averageDealValue: number;

  totalDeals: number;
  totalRevenue: number;
  totalContacts: number;
  hrmsAccounts: number;

  topAccountsByRevenue: EnhancedAccount[];
  topAccountsByDeals: EnhancedAccount[];
  accountsByIndustry: Record<string, number>;
  accountsBySize: Record<string, number>;
  accountsByType: Record<string, number>;
}
