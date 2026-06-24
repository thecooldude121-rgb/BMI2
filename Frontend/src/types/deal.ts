// Comprehensive Deal Management Types for Best-in-Class CRM
export interface Deal {
  id: string;
  dealNumber: string;
  name: string;
  
  // Ownership & Classification
  ownerId: string;
  dealType: 'new-business' | 'upsell' | 'cross-sell' | 'renewal' | 'reactivation';
  country: string;

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

  // Basic Information
  pipelineId: string;
  accountId?: string;
  contactId?: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';
  closingDate?: string;
  stageId: string;
  probability: number;
  createdBy: string;
  
  // Financial Details
  platformFee: number;
  customFee: number;
  licenseFee: number;
  onboardingFee: number;
  totalAmount: number;
  
  // Products & Line Items
  products: DealProduct[];
  
  // Metadata
  description?: string;
  tags: string[];
  attachments: DealAttachment[];
  
  // Activity Planning
  nextSteps: string;
  plannedActivities: PlannedActivity[];
  
  // Communication
  emailThreads: EmailThread[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  
  // Draft state
  isDraft: boolean;
  draftSavedAt?: string;
}

export interface DealProduct {
  id: string;
  productId?: string;
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
  preview?: string;
}

export interface PlannedActivity {
  id: string;
  type: 'task' | 'call' | 'meeting' | 'email';
  title: string;
  description?: string;
  scheduledAt?: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high';
  status: 'planned' | 'completed';
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: string[];
  lastMessageAt: string;
  messageCount: number;
  status: 'active' | 'archived';
}

export interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
  isDefault: boolean;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  probability: number;
  position: number;
}

export interface Account {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  size?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  accountId?: string;
}

// Planned Activity interface
export interface PlannedActivity {
  id: string;
  type: 'task' | 'call' | 'meeting' | 'email';
  title: string;
  description?: string;
  scheduledAt?: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high';
  status: 'planned' | 'completed';
}

export interface DealFormData {
  // Ownership & Classification
  ownerId: string;
  dealType: string;
  country: string;
  
  // Basic Information
  name: string;
  pipelineId: string;
  accountId: string;
  contactId: string;
  amount: number;
  currency: string;
  closingDate: string;
  stageId: string;
  probability: number;
  
  // Financial Details
  platformFee: number;
  customFee: number;
  licenseFee: number;
  onboardingFee: number;
  
  // Products
  products: DealProduct[];
  
  // Additional
  description: string;
  tags: string[];
  nextSteps: string;
  plannedActivities: PlannedActivity[];
}

export interface JourneyStep {
  id: string;
  stage: 'lead-gen' | 'lead' | 'contact' | 'opportunity' | 'deal';
  timestamp: string;
  source?: string;
  details: string;
  metadata?: Record<string, any>;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface DealTemplate {
  id: string;
  name: string;
  description?: string;
  templateData: Partial<DealFormData>;
  createdBy: string;
  createdAt: string;
}