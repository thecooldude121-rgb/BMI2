// Enterprise Deals Module Types
import { DealOwnerInfo, DealValueHistoryEntry } from './dealManagement';
export type { DealOwnerInfo, DealValueHistoryEntry };

export interface Deal {
  id: string;
  dealNumber: string;
  name: string;
  
  // Basic Information
  accountId?: string;
  contactId?: string;
  ownerId: string;
  ownerInfo?: DealOwnerInfo;
  dealValueHistory?: DealValueHistoryEntry[];
  pipelineId: string;
  stageId: string;
  
  // Financial
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  probability: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  
  // Classification
  dealType: 'new-business' | 'existing-business' | 'upsell' | 'renewal';
  leadSource?: string;
  campaignId?: string;

  // Source Attribution
  source?: 'manual' | 'lead-gen' | 'referral' | 'inbound' | 'hrms';
  leadGenTool?: 'apollo' | 'zoominfo' | 'linkedin-sales-nav' | 'hunter' | 'seamless' | 'other';

  // AI Intelligence
  aiHealthScore?: number;
  aiWinProbability?: number;
  aiInsights?: string[];
  aiRecommendations?: string[];
  aiLastAnalyzedAt?: string;

  // Journey Tracking
  journeySteps?: JourneyStep[];

  // Content
  description?: string;
  nextSteps?: string;
  notes?: string;
  
  // Metadata
  tags: string[];
  customFields: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  health: 'healthy' | 'at-risk' | 'stalled';
  
  // Relationships
  activities: DealActivity[];
  emails: DealEmail[];
  attachments: DealAttachment[];
  
  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastActivityAt?: string;
  stageHistory: StageHistoryEntry[];
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  isDefault: boolean;
  isActive: boolean;
  dealTypes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  color: string;
  position: number;
  probability: number;
  isClosedWon: boolean;
  isClosedLost: boolean;
  requirements?: string[];
}

export interface DealActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  status: 'planned' | 'completed' | 'cancelled';
  scheduledAt?: string;
  completedAt?: string;
  duration?: number;
  outcome?: string;
  createdBy: string;
  createdAt: string;
}

export interface DealEmail {
  id: string;
  subject: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status: 'draft' | 'sent' | 'delivered' | 'opened' | 'replied';
  sentAt?: string;
  openedAt?: string;
  fromEmail: string;
  toEmails: string[];
  createdAt: string;
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
  toStageId: string;
  enteredAt: string;
  exitedAt?: string;
  duration?: number;
  changedBy: string;
  reason?: string;
}

export interface JourneyStep {
  id: string;
  stage: 'lead-gen' | 'lead' | 'contact' | 'opportunity' | 'deal';
  timestamp: string;
  source?: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface DealFilters {
  search?: string;
  status?: string;
  ownerId?: string;
  pipelineId?: string;
  stageId?: string;
  dealType?: string;
  priority?: string;
  health?: string;
  amountRange?: { min: number; max: number };
  dateRange?: { start: string; end: string };
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface DealColumn {
  id: string;
  name: string;
  field: string;
  width?: number;
  visible: boolean;
  sortable: boolean;
  filterable: boolean;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'select' | 'user';
}

export interface CustomView {
  id: string;
  name: string;
  description?: string;
  filters: DealFilters;
  columns: DealColumn[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isDefault: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

export interface BulkAction {
  id: string;
  name: string;
  icon: string;
  description: string;
  requiresConfirmation: boolean;
  action: (dealIds: string[], params?: any) => Promise<void>;
}

export interface DealTemplate {
  id: string;
  name: string;
  description?: string;
  dealData: Partial<Deal>;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

// Default columns configuration
export const DEFAULT_DEAL_COLUMNS: DealColumn[] = [
  { id: 'name', name: 'Deal Name', field: 'name', visible: true, sortable: true, filterable: true, type: 'text' },
  { id: 'pipeline', name: 'Pipeline', field: 'pipelineId', visible: true, sortable: true, filterable: true, type: 'select' },
  { id: 'account', name: 'Account', field: 'accountId', visible: true, sortable: true, filterable: true, type: 'select' },
  { id: 'amount', name: 'Amount', field: 'amount', visible: true, sortable: true, filterable: true, type: 'currency' },
  { id: 'stage', name: 'Stage', field: 'stageId', visible: true, sortable: true, filterable: true, type: 'select' },
  { id: 'owner', name: 'Owner', field: 'ownerId', visible: true, sortable: true, filterable: true, type: 'user' },
  { id: 'probability', name: 'Probability', field: 'probability', visible: true, sortable: true, filterable: true, type: 'percentage' },
  { id: 'closeDate', name: 'Close Date', field: 'expectedCloseDate', visible: true, sortable: true, filterable: true, type: 'date' },
  { id: 'created', name: 'Created', field: 'createdAt', visible: false, sortable: true, filterable: false, type: 'date' },
  { id: 'lastActivity', name: 'Last Activity', field: 'lastActivityAt', visible: false, sortable: true, filterable: false, type: 'date' }
];

// Sample pipeline data
export const SAMPLE_PIPELINES: Pipeline[] = [
  {
    id: 'sales-pipeline',
    name: 'Sales Pipeline',
    description: 'Standard sales process',
    isDefault: true,
    isActive: true,
    dealTypes: ['new-business', 'existing-business'],
    stages: [
      { id: 'lead', name: 'Lead', color: '#6B7280', position: 1, probability: 10, isClosedWon: false, isClosedLost: false },
      { id: 'qualified', name: 'Qualified', color: '#3B82F6', position: 2, probability: 25, isClosedWon: false, isClosedLost: false },
      { id: 'proposal', name: 'Proposal', color: '#F59E0B', position: 3, probability: 50, isClosedWon: false, isClosedLost: false },
      { id: 'negotiation', name: 'Negotiation', color: '#EF4444', position: 4, probability: 75, isClosedWon: false, isClosedLost: false },
      { id: 'closed-won', name: 'Closed Won', color: '#10B981', position: 5, probability: 100, isClosedWon: true, isClosedLost: false },
      { id: 'closed-lost', name: 'Closed Lost', color: '#6B7280', position: 6, probability: 0, isClosedWon: false, isClosedLost: true }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'enterprise-pipeline',
    name: 'Enterprise Pipeline',
    description: 'Extended process for enterprise deals',
    isDefault: false,
    isActive: true,
    dealTypes: ['new-business'],
    stages: [
      { id: 'discovery', name: 'Discovery', color: '#8B5CF6', position: 1, probability: 5, isClosedWon: false, isClosedLost: false },
      { id: 'qualification', name: 'Qualification', color: '#3B82F6', position: 2, probability: 15, isClosedWon: false, isClosedLost: false },
      { id: 'technical-eval', name: 'Technical Evaluation', color: '#06B6D4', position: 3, probability: 30, isClosedWon: false, isClosedLost: false },
      { id: 'proposal', name: 'Proposal', color: '#F59E0B', position: 4, probability: 50, isClosedWon: false, isClosedLost: false },
      { id: 'negotiation', name: 'Negotiation', color: '#EF4444', position: 5, probability: 75, isClosedWon: false, isClosedLost: false },
      { id: 'legal-review', name: 'Legal Review', color: '#EC4899', position: 6, probability: 85, isClosedWon: false, isClosedLost: false },
      { id: 'closed-won', name: 'Closed Won', color: '#10B981', position: 7, probability: 100, isClosedWon: true, isClosedLost: false },
      { id: 'closed-lost', name: 'Closed Lost', color: '#6B7280', position: 8, probability: 0, isClosedWon: false, isClosedLost: true }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];