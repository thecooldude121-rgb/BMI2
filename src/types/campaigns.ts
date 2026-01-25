export type CampaignStatus = 'active' | 'paused' | 'scheduled' | 'draft' | 'completed' | 'archived';
export type CampaignType = 'email' | 'multi-channel' | 'linkedin';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  type: CampaignType;
  template: string;
  leadsCount: number;
  sendRate: number;
  sentCount: number;
  openRate: number;
  openCount: number;
  replyRate: number;
  replyCount: number;
  conversionRate: number;
  conversionCount: number;
  createdAt: string;
  scheduledFor?: string;
  completedAt?: string;
  archivedAt?: string;
  owner: string;
  tags: string[];
  notes?: string;
}

export interface CampaignFilters {
  search: string;
  status: CampaignStatus | 'all';
  type: CampaignType | 'all';
  template: string | 'all';
  performance: 'all' | 'high' | 'medium' | 'low';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year';
}

export interface CampaignStatistics {
  activeCampaigns: number;
  totalLeads: number;
  avgOpenRate: number;
  avgReplyRate: number;
}
