// Shared Types for BMI Platform CRM Client
// Common interfaces and types used across the client application

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'sales' | 'hr' | 'user';
  department: string;
  avatar?: string;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface FilterParams {
  [key: string]: any;
}

// CRM Entity Base Interface
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

// Lead Management
export interface Lead extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  industry?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  score: number;
  ownerId: string;
  tags: string[];
  customFields: Record<string, any>;
}

// Contact Management
export interface Contact extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  position?: string;
  department?: string;
  accountId?: string;
  ownerId: string;
  tags: string[];
  customFields: Record<string, any>;
}

// Account/Company Management
export interface Account extends BaseEntity {
  name: string;
  domain?: string;
  industry?: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  revenue?: number;
  website?: string;
  phone?: string;
  address?: Address;
  ownerId: string;
  tags: string[];
  customFields: Record<string, any>;
}

// Deal Management
export interface Deal extends BaseEntity {
  name: string;
  amount: number;
  currency: string;
  stage: string;
  probability: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  accountId?: string;
  contactId?: string;
  ownerId: string;
  tags: string[];
  customFields: Record<string, any>;
}

// Activity Management
export interface Activity extends BaseEntity {
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  status: 'planned' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledAt?: string;
  completedAt?: string;
  duration?: number;
  outcome?: string;
  ownerId: string;
  relatedTo: ActivityRelation[];
}

export interface ActivityRelation {
  entityType: 'lead' | 'contact' | 'deal' | 'account';
  entityId: string;
  isPrimary: boolean;
}

// Task Management
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completedAt?: string;
  assignedTo: string;
  relatedTo?: ActivityRelation[];
}

// Utility Types
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  entityType: 'lead' | 'contact' | 'deal' | 'account';
}

// Analytics Types
export interface DashboardMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  totalDeals: number;
  wonDeals: number;
  pipelineValue: number;
  conversionRate: number;
  avgDealSize: number;
  activeTasks: number;
}

export interface SalesFunnelData {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
}

export interface TeamPerformance {
  userId: string;
  name: string;
  role: string;
  leadsCount: number;
  dealsCount: number;
  revenue: number;
  conversionRate: number;
}

// Gamification Types
export interface GameStats {
  userId: string;
  points: number;
  level: number;
  rank: number;
  achievements: string[];
  streak: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  points: number;
  category: 'sales' | 'activity' | 'collaboration' | 'milestone';
  earned: boolean;
  earnedAt?: string;
}

// Form Types
export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string[];
  assignedTo?: string[];
  tags?: string[];
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// Export utility type helpers
export type EntityType = 'lead' | 'contact' | 'deal' | 'account' | 'task' | 'activity';
export type EntityStatus = 'active' | 'inactive' | 'archived';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note';