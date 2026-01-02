export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: TeamRole;
  title: string;
  department: string;
  phone?: string;
  location: string;
  status: 'active' | 'away' | 'offline';
  joinedDate: string;
  reportsTo?: string;
  territory?: string;
  quota?: number;
  performance: {
    dealsWon: number;
    dealsClosed: number;
    revenue: number;
    quotaAttainment: number;
    activitiesLogged: number;
    averageResponseTime: number;
  };
  metrics: {
    leadsConverted: number;
    avgDealSize: number;
    winRate: number;
    pipelineValue: number;
  };
  permissions: string[];
  lastActive: string;
  skills: string[];
}

export type TeamRole =
  | 'admin'
  | 'sales_manager'
  | 'sales_rep'
  | 'account_executive'
  | 'sales_development_rep'
  | 'customer_success'
  | 'marketing';

export interface Team {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  members: string[];
  createdDate: string;
  quota: number;
  territory?: string;
  performance: {
    totalRevenue: number;
    quotaAttainment: number;
    dealsWon: number;
    avgDealCycle: number;
  };
}

export interface TeamActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  description: string;
  timestamp: string;
  type: 'deal' | 'lead' | 'contact' | 'activity' | 'meeting' | 'task';
  relatedId?: string;
  relatedName?: string;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number;
  quotaAttainment: number;
  dealsWon: number;
  dealsInProgress: number;
  avgDealSize: number;
  avgWinRate: number;
  totalPipeline: number;
  activitiesThisWeek: number;
}

export interface Territory {
  id: string;
  name: string;
  region: string;
  assignedTo: string[];
  accounts: number;
  revenue: number;
  quota: number;
  color: string;
}

export interface TeamGoal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: 'revenue' | 'deals' | 'activities' | 'meetings';
  deadline: string;
  assignedTo: string[];
  priority: 'high' | 'medium' | 'low';
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
}

export interface TeamLeaderboard {
  period: 'week' | 'month' | 'quarter' | 'year';
  rankings: {
    memberId: string;
    memberName: string;
    avatar?: string;
    rank: number;
    score: number;
    metric: string;
    change: number;
    badges: string[];
  }[];
}
