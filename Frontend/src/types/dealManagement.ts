// Comprehensive Deal Management Types
export interface DealType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DealPipeline {
  id: string;
  name: string;
  description?: string;
  stages: DealStage[];
  isDefault: boolean;
  isActive: boolean;
  dealType?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealStage {
  id: string;
  name: string;
  description?: string;
  color: string;
  position: number;
  probability: number;
  isClosedWon: boolean;
  isClosedLost: boolean;
  requirements?: string[];
  automations?: StageAutomation[];
}

export interface StageAutomation {
  id: string;
  trigger: 'enter' | 'exit' | 'duration';
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface AutomationAction {
  type: 'create_task' | 'send_email' | 'assign_user' | 'update_field' | 'create_activity';
  parameters: Record<string, any>;
}

export interface Deal {
  id: string;
  dealNumber: string; // Auto-generated sequential number
  name: string;
  
  // Ownership & Classification
  ownerId: string;
  dealType: string;
  country: string;
  
  // Basic Information
  pipelineId: string;
  accountId?: string; // Company
  contactId?: string; // Primary contact
  amount: number;
  currency: string;
  closingDate?: string;
  stageId: string;
  probability: number;
  createdBy: string;
  
  // Financial Details
  products: DealProduct[];
  platformFee: number;
  customFee: number;
  licenseFee: number;
  onboardingFee: number;
  totalAmount: number;
  
  // Metadata
  description?: string;
  tags: string[];
  attachments: DealAttachment[];
  customFields: Record<string, any>;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  
  // Audit Trail
  stageHistory: StageHistoryEntry[];
  
  // Relationships
  activities: DealActivity[];
  emails: DealEmail[];
  tasks: DealTask[];
  meetings: DealMeeting[];
}

export interface DealProduct {
  id: string;
  productId: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  totalPrice: number;
  category?: string;
}

export interface DealAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface StageHistoryEntry {
  id: string;
  fromStageId?: string;
  fromStageName?: string;
  toStageId: string;
  toStageName: string;
  enteredAt: string;
  exitedAt?: string;
  duration?: number; // in hours
  changedBy: string;
  reason?: string;
  notes?: string;
}

export interface DealActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  status: 'open' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledAt?: string;
  completedAt?: string;
  duration?: number;
  outcome?: string;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealEmail {
  id: string;
  subject: string;
  body: string;
  fromEmail: string;
  toEmails: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  direction: 'inbound' | 'outbound';
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied';
  scheduledAt?: string;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  threadId?: string;
  attachments: EmailAttachment[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface DealTask {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completedAt?: string;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealMeeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingUrl?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  attendees: MeetingAttendee[];
  organizer: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingAttendee {
  id: string;
  type: 'user' | 'contact' | 'external';
  email: string;
  name: string;
  response?: 'pending' | 'accepted' | 'declined' | 'tentative';
  attended?: boolean;
}

export interface DealFilters {
  ownerId?: string;
  stageId?: string;
  dealType?: string;
  country?: string;
  amountRange?: {
    min: number;
    max: number;
  };
  closingDateRange?: {
    start: string;
    end: string;
  };
  probability?: {
    min: number;
    max: number;
  };
  tags?: string[];
  searchTerm?: string;
}

export interface DealViewSettings {
  view: 'kanban' | 'list';
  columns: DealColumn[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  groupBy?: string;
  filters: DealFilters;
}

export interface DealColumn {
  id: string;
  name: string;
  field: string;
  width?: number;
  visible: boolean;
  sortable: boolean;
  filterable: boolean;
}

// Default pipeline stages
export const DEFAULT_DEAL_STAGES: DealStage[] = [
  {
    id: 'lead',
    name: 'Lead',
    color: '#6B7280',
    position: 1,
    probability: 10,
    isClosedWon: false,
    isClosedLost: false
  },
  {
    id: 'qualified',
    name: 'Qualified',
    color: '#3B82F6',
    position: 2,
    probability: 25,
    isClosedWon: false,
    isClosedLost: false
  },
  {
    id: 'proposal',
    name: 'Proposal',
    color: '#F59E0B',
    position: 3,
    probability: 50,
    isClosedWon: false,
    isClosedLost: false
  },
  {
    id: 'negotiation',
    name: 'Negotiation',
    color: '#EF4444',
    position: 4,
    probability: 75,
    isClosedWon: false,
    isClosedLost: false
  },
  {
    id: 'closed-won',
    name: 'Closed Won',
    color: '#10B981',
    position: 5,
    probability: 100,
    isClosedWon: true,
    isClosedLost: false
  },
  {
    id: 'closed-lost',
    name: 'Closed Lost',
    color: '#6B7280',
    position: 6,
    probability: 0,
    isClosedWon: false,
    isClosedLost: true
  }
];

// Default deal columns for list view
export const DEFAULT_DEAL_COLUMNS: DealColumn[] = [
  { id: 'name', name: 'Deal Name', field: 'name', visible: true, sortable: true, filterable: true },
  { id: 'amount', name: 'Amount', field: 'amount', visible: true, sortable: true, filterable: true },
  { id: 'stage', name: 'Stage', field: 'stageId', visible: true, sortable: true, filterable: true },
  { id: 'probability', name: 'Probability', field: 'probability', visible: true, sortable: true, filterable: true },
  { id: 'owner', name: 'Owner', field: 'ownerId', visible: true, sortable: true, filterable: true },
  { id: 'account', name: 'Account', field: 'accountId', visible: true, sortable: true, filterable: true },
  { id: 'contact', name: 'Contact', field: 'contactId', visible: true, sortable: true, filterable: true },
  { id: 'closingDate', name: 'Closing Date', field: 'closingDate', visible: true, sortable: true, filterable: true },
  { id: 'createdAt', name: 'Created', field: 'createdAt', visible: true, sortable: true, filterable: false }
];