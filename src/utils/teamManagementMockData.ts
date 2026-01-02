export type UserRole = 'ceo' | 'vp' | 'manager' | 'rep' | 'account_executive' | 'admin' | 'analyst' | 'support';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type Department = 'Sales' | 'Marketing' | 'Customer Success' | 'Operations' | 'Finance' | 'HR' | 'Engineering' | 'Product' | 'Executive' | 'Other';

export interface TeamMember {
  // Basic Identity
  id: string;
  name: string;
  displayName: string;
  initials: string;
  photoInitials: string;
  photoColor: string;
  email: string;
  phone: string;

  // Role & Permissions
  role: UserRole;
  roleId: string;
  jobTitle: string;
  permissionsLevel: string;
  permissionSet: string[];
  permissions: string;

  // Organization
  status: UserStatus;
  department: Department;
  team?: string;
  reportsTo?: string;
  reportsToId?: string;
  manager?: string;
  directReports?: string[];
  directReportIds?: string[];

  // Account Management
  employeeId: string;
  memberSince: string;
  accountCreatedBy: string;
  accountCreatedDate: string;

  // Login & Activity Tracking
  lastLogin: string;
  loginFrequency: string;
  averageLoginsPerWeek: number;
  totalLogins: number;
  failedLoginAttempts: number;

  // Performance Stats
  quickStats: {
    activeDeals: number;
    pipeline: string;
    winRate?: number;
    quotaAttainment?: number;
    teamPerformance?: string;
    hrmsConnections?: number;
    additionalInfo?: string;
  };

  // Security & Verification
  twoFactorAuthentication: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  passwordLastChanged: string;
  securityQuestionsSet: boolean;
  accountLocked?: boolean;

  // Location & Preferences
  location: string;
  timezone: string;
  language: string;
  dateFormat: string;
  currency: string;

  // UI
  avatarColor: string;
}

export interface TeamCapacity {
  activeMembers: number;
  inactiveMembers: number;
  pendingInvites: number;
  availableSeats: number;
  totalCapacity: number;
  lastUpdated: string;
  plan: string;
  planTier: string;
  utilization: number;
  costPerSeat: number;
  monthlyCost: number;
  nextBillingDate: string;
  planRenewal: string;
  autoSyncStatus: string;
  lastSync: string;
  nextSync: string;
  upgradeOptions: {
    business: { seats: number; price: string };
    enterprise: { seats: string; price: string };
  };
}

export interface RoleDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissionLevel: number;
  canManageTeam: boolean;
  canViewAllRecords: boolean;
  canEditAllRecords: boolean;
  canDeleteRecords: boolean;
  canManageSettings: boolean;
  canAccessReports: boolean;
  canExportData: boolean;
  memberCount: number;
}

export interface PermissionSet {
  id: string;
  name: string;
  description: string;
  permissions: {
    module: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }[];
}

export interface DepartmentInfo {
  id: string;
  name: Department;
  headId: string;
  headName: string;
  memberCount: number;
  targetQuota: string;
  currentPerformance: string;
  performancePercent: number;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  location: string;
}

export interface AuditLogEntry {
  id: string;
  performedBy: string;
  performedById: string;
  action: 'user_added' | 'user_edited' | 'user_deleted' | 'role_changed' | 'permissions_modified' | 'user_activated' | 'user_deactivated';
  targetUser: string;
  targetUserId: string;
  timestamp: string;
  changes: string;
  reason?: string;
}

export const mockTeamMembers: TeamMember[] = [
  {
    // Basic Identity
    id: '1',
    name: 'Alex Rodriguez',
    displayName: 'Alex Rodriguez',
    initials: 'AR',
    photoInitials: 'AR',
    photoColor: '#3b82f6',
    email: 'alex@bmi.com',
    phone: '555-0002',

    // Role & Permissions
    role: 'rep',
    roleId: 'rep',
    jobTitle: 'Sales Representative',
    permissionsLevel: 'Standard User',
    permissionSet: [
      'View own data only',
      'Manage own deals/contacts/activities',
      'View team directory (names/emails only)',
      'No admin access'
    ],
    permissions: 'Standard User',

    // Organization
    status: 'active',
    department: 'Sales',
    team: 'Sales East',
    reportsTo: 'Sarah Chen',
    reportsToId: '2',
    manager: 'Sarah Chen',

    // Account Management
    employeeId: 'EMP-001234',
    memberSince: 'Oct 1, 2024',
    accountCreatedBy: 'Admin (initial setup)',
    accountCreatedDate: 'Oct 1, 2024 at 9:00 AM PST',

    // Login & Activity Tracking
    lastLogin: 'Dec 13, 2024 at 9:45 AM PST',
    loginFrequency: 'Daily',
    averageLoginsPerWeek: 7,
    totalLogins: 74,
    failedLoginAttempts: 0,

    // Performance Stats
    quickStats: {
      activeDeals: 8,
      pipeline: '$450,000',
      winRate: 67,
      quotaAttainment: 104,
      additionalInfo: 'Login Frequency: Daily'
    },

    // Security & Verification
    twoFactorAuthentication: true,
    emailVerified: true,
    phoneVerified: true,
    passwordLastChanged: 'Nov 15, 2024',
    securityQuestionsSet: true,

    // Location & Preferences
    location: 'San Francisco, CA',
    timezone: 'PST (UTC-8)',
    language: 'English (US)',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',

    // UI
    avatarColor: 'from-blue-500 to-blue-600'
  },
  {
    // Basic Identity
    id: '2',
    name: 'Sarah Chen',
    displayName: 'Sarah Chen',
    initials: 'SC',
    photoInitials: 'SC',
    photoColor: '#3b82f6',
    email: 'sarah@bmi.com',
    phone: '555-0001',

    // Role & Permissions
    role: 'manager',
    roleId: 'manager',
    jobTitle: 'Sales Manager',
    permissionsLevel: 'Manager + Team Lead',
    permissionSet: [
      'View team data (direct reports)',
      'Add coaching notes for direct reports',
      'Schedule 1-on-1s',
      'Cannot add/remove users (Admin only)'
    ],
    permissions: 'Manager + Team Lead',

    // Organization
    status: 'active',
    department: 'Sales',
    team: 'Sales East (Team Lead)',
    reportsTo: 'John Smith',
    reportsToId: '5',
    manager: 'John Smith',
    directReportIds: ['1'],
    directReports: ['Alex Rodriguez', 'Emily Davis'],

    // Account Management
    employeeId: 'EMP-001235',
    memberSince: 'Oct 1, 2024',
    accountCreatedBy: 'Admin (initial setup)',
    accountCreatedDate: 'Oct 1, 2024 at 9:00 AM PST',

    // Login & Activity Tracking
    lastLogin: 'Dec 13, 2024 at 9:30 AM PST',
    loginFrequency: 'Daily',
    averageLoginsPerWeek: 7,
    totalLogins: 75,
    failedLoginAttempts: 0,

    // Performance Stats
    quickStats: {
      activeDeals: 12,
      pipeline: '$680,000',
      winRate: 72,
      quotaAttainment: 108,
      teamPerformance: '106%',
      hrmsConnections: 2,
      additionalInfo: 'Team Performance: 106% quota'
    },

    // Security & Verification
    twoFactorAuthentication: true,
    emailVerified: true,
    phoneVerified: true,
    passwordLastChanged: 'Oct 20, 2024',
    securityQuestionsSet: true,

    // Location & Preferences
    location: 'San Francisco, CA',
    timezone: 'PST (UTC-8)',
    language: 'English (US)',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',

    // UI
    avatarColor: 'from-blue-500 to-blue-600'
  },
  {
    // Basic Identity
    id: '3',
    name: 'Mike Johnson',
    displayName: 'Mike Johnson',
    initials: 'MJ',
    photoInitials: 'MJ',
    photoColor: '#3b82f6',
    email: 'mike@bmi.com',
    phone: '555-0003',

    // Role & Permissions
    role: 'account_executive',
    roleId: 'account_executive',
    jobTitle: 'Account Executive',
    permissionsLevel: 'Standard User',
    permissionSet: [
      'View own data only',
      'Manage own deals/contacts/activities',
      'View team directory (names/emails only)',
      'No admin access'
    ],
    permissions: 'Standard User',

    // Organization
    status: 'active',
    department: 'Sales',
    team: 'Sales West',
    reportsTo: 'John Smith',
    reportsToId: '5',
    manager: 'John Smith',

    // Account Management
    employeeId: 'EMP-001236',
    memberSince: 'Oct 1, 2024',
    accountCreatedBy: 'Admin (initial setup)',
    accountCreatedDate: 'Oct 1, 2024 at 9:00 AM PST',

    // Login & Activity Tracking
    lastLogin: 'Dec 13, 2024 at 8:15 AM PST',
    loginFrequency: 'Daily',
    averageLoginsPerWeek: 7,
    totalLogins: 73,
    failedLoginAttempts: 0,

    // Performance Stats
    quickStats: {
      activeDeals: 6,
      pipeline: '$320,000',
      winRate: 58,
      quotaAttainment: 102,
      hrmsConnections: 1,
      additionalInfo: 'HRMS Connections: 1 lead'
    },

    // Security & Verification
    twoFactorAuthentication: true,
    emailVerified: true,
    phoneVerified: true,
    passwordLastChanged: 'Nov 1, 2024',
    securityQuestionsSet: true,

    // Location & Preferences
    location: 'Los Angeles, CA',
    timezone: 'PST (UTC-8)',
    language: 'English (US)',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',

    // UI
    avatarColor: 'from-blue-500 to-blue-600'
  },
  {
    // Basic Identity
    id: '4',
    name: 'Emily Davis',
    displayName: 'Emily Davis',
    initials: 'ED',
    photoInitials: 'ED',
    photoColor: '#8b5cf6',
    email: 'emily@bmi.com',
    phone: '555-0004',

    // Role & Permissions
    role: 'rep',
    roleId: 'rep',
    jobTitle: 'Sales Representative',
    permissionsLevel: 'Standard User',
    permissionSet: [
      'View own data only',
      'Manage own deals/contacts/activities',
      'View team directory (names/emails only)',
      'No admin access'
    ],
    permissions: 'Standard User',

    // Organization
    status: 'active',
    department: 'Sales',
    team: 'Sales East',
    reportsTo: 'Sarah Chen',
    reportsToId: '2',
    manager: 'Sarah Chen',

    // Account Management
    employeeId: 'EMP-001237',
    memberSince: 'Oct 1, 2024',
    accountCreatedBy: 'Admin (initial setup)',
    accountCreatedDate: 'Oct 1, 2024 at 9:00 AM PST',

    // Login & Activity Tracking
    lastLogin: 'Dec 13, 2024 at 7:30 AM PST',
    loginFrequency: 'Daily',
    averageLoginsPerWeek: 7,
    totalLogins: 72,
    failedLoginAttempts: 0,

    // Performance Stats
    quickStats: {
      activeDeals: 5,
      pipeline: '$280,000',
      winRate: 62,
      quotaAttainment: 98,
      additionalInfo: 'Login Frequency: Daily'
    },

    // Security & Verification
    twoFactorAuthentication: true,
    emailVerified: true,
    phoneVerified: true,
    passwordLastChanged: 'Nov 10, 2024',
    securityQuestionsSet: true,

    // Location & Preferences
    location: 'San Francisco, CA',
    timezone: 'PST (UTC-8)',
    language: 'English (US)',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',

    // UI
    avatarColor: 'from-purple-500 to-purple-600'
  },
  {
    // Basic Identity
    id: '5',
    name: 'John Smith',
    displayName: 'John Smith',
    initials: 'JS',
    photoInitials: 'JS',
    photoColor: '#ef4444',
    email: 'john@bmi.com',
    phone: '555-0005',

    // Role & Permissions
    role: 'admin',
    roleId: 'admin',
    jobTitle: 'Sales Director',
    permissionsLevel: 'Full Admin Access',
    permissionSet: [
      'Full user management (add/edit/delete)',
      'Assign roles and permissions',
      'View all data',
      'Cannot add coaching notes (not people manager)',
      'System administration'
    ],
    permissions: 'Full Admin Access',

    // Organization
    status: 'active',
    department: 'Sales',
    team: 'Leadership',
    reportsTo: 'CEO',
    reportsToId: 'ceo-001',
    manager: 'CEO',
    directReportIds: ['2', '3'],
    directReports: ['Sarah Chen', 'Mike Johnson'],

    // Account Management
    employeeId: 'EMP-001238',
    memberSince: 'Oct 1, 2024',
    accountCreatedBy: 'System Admin',
    accountCreatedDate: 'Oct 1, 2024 at 9:00 AM PST',

    // Login & Activity Tracking
    lastLogin: 'Dec 13, 2024 at 8:00 AM PST',
    loginFrequency: 'Daily',
    averageLoginsPerWeek: 7,
    totalLogins: 76,
    failedLoginAttempts: 0,

    // Performance Stats
    quickStats: {
      activeDeals: 15,
      pipeline: '$1,200,000',
      winRate: 78,
      quotaAttainment: 115,
      teamPerformance: '110%',
      hrmsConnections: 3,
      additionalInfo: 'Director - Full system access'
    },

    // Security & Verification
    twoFactorAuthentication: true,
    emailVerified: true,
    phoneVerified: true,
    passwordLastChanged: 'Oct 15, 2024',
    securityQuestionsSet: true,

    // Location & Preferences
    location: 'San Francisco, CA',
    timezone: 'PST (UTC-8)',
    language: 'English (US)',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',

    // UI
    avatarColor: 'from-red-500 to-red-600'
  }
];

export const mockTeamCapacity: TeamCapacity = {
  activeMembers: 5,
  inactiveMembers: 0,
  pendingInvites: 0,
  availableSeats: 2,
  totalCapacity: 5,
  lastUpdated: '2 hours ago',
  plan: 'Professional',
  planTier: '2 of 4 (Starter, Professional, Business, Enterprise)',
  utilization: 60,
  costPerSeat: 49,
  monthlyCost: 147,
  nextBillingDate: 'Jan 1, 2025',
  planRenewal: 'Annual',
  autoSyncStatus: 'Enabled',
  lastSync: 'Dec 13, 2024 at 2:00 PM PST',
  nextSync: 'Continuous (real-time)',
  upgradeOptions: {
    business: { seats: 15, price: '$299/month' },
    enterprise: { seats: 'Unlimited', price: 'Custom pricing' }
  }
};

export const mockRoleDefinitions: RoleDefinition[] = [
  {
    id: 'role-1',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with all permissions',
    permissionLevel: 100,
    canManageTeam: true,
    canViewAllRecords: true,
    canEditAllRecords: true,
    canDeleteRecords: true,
    canManageSettings: true,
    canAccessReports: true,
    canExportData: true,
    memberCount: 1
  },
  {
    id: 'role-2',
    name: 'sales_manager',
    displayName: 'Sales Manager',
    description: 'Manage sales team and view all sales records',
    permissionLevel: 80,
    canManageTeam: true,
    canViewAllRecords: true,
    canEditAllRecords: true,
    canDeleteRecords: false,
    canManageSettings: false,
    canAccessReports: true,
    canExportData: true,
    memberCount: 1
  },
  {
    id: 'role-3',
    name: 'sales_rep',
    displayName: 'Sales Representative',
    description: 'Standard sales user with own record access',
    permissionLevel: 50,
    canManageTeam: false,
    canViewAllRecords: false,
    canEditAllRecords: false,
    canDeleteRecords: false,
    canManageSettings: false,
    canAccessReports: false,
    canExportData: false,
    memberCount: 4
  },
  {
    id: 'role-4',
    name: 'account_executive',
    displayName: 'Account Executive',
    description: 'Manage key accounts and enterprise deals',
    permissionLevel: 60,
    canManageTeam: false,
    canViewAllRecords: false,
    canEditAllRecords: false,
    canDeleteRecords: false,
    canManageSettings: false,
    canAccessReports: true,
    canExportData: false,
    memberCount: 2
  },
  {
    id: 'role-5',
    name: 'marketing_manager',
    displayName: 'Marketing Manager',
    description: 'Manage marketing campaigns and lead generation',
    permissionLevel: 70,
    canManageTeam: true,
    canViewAllRecords: true,
    canEditAllRecords: false,
    canDeleteRecords: false,
    canManageSettings: false,
    canAccessReports: true,
    canExportData: true,
    memberCount: 2
  },
  {
    id: 'role-6',
    name: 'customer_success',
    displayName: 'Customer Success',
    description: 'Manage customer relationships and support',
    permissionLevel: 60,
    canManageTeam: false,
    canViewAllRecords: true,
    canEditAllRecords: false,
    canDeleteRecords: false,
    canManageSettings: false,
    canAccessReports: true,
    canExportData: false,
    memberCount: 2
  }
];

export const mockPermissionSets: PermissionSet[] = [
  {
    id: 'perm-1',
    name: 'Full Access',
    description: 'Complete access to all modules',
    permissions: [
      { module: 'Prospects', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'Leads', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'Accounts', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'Deals', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'Contacts', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'Meetings', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'Documents', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'Reports', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { module: 'Settings', canView: true, canCreate: true, canEdit: true, canDelete: true }
    ]
  },
  {
    id: 'perm-2',
    name: 'Sales Manager',
    description: 'Manager-level access for sales operations',
    permissions: [
      { module: 'Prospects', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'Leads', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'Accounts', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'Deals', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'Contacts', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'Meetings', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'Documents', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'Reports', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'Settings', canView: false, canCreate: false, canEdit: false, canDelete: false }
    ]
  },
  {
    id: 'perm-3',
    name: 'Standard User',
    description: 'Basic user access to own records',
    permissions: [
      { module: 'Prospects', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'Leads', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'Accounts', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'Deals', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'Contacts', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'Meetings', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { module: 'Documents', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { module: 'Reports', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { module: 'Settings', canView: false, canCreate: false, canEdit: false, canDelete: false }
    ]
  }
];

export const mockDepartments: DepartmentInfo[] = [
  {
    id: 'dept-1',
    name: 'Sales',
    headId: '2',
    headName: 'Sarah Chen',
    memberCount: 6,
    targetQuota: '$3.2M',
    currentPerformance: '$2.8M',
    performancePercent: 88
  },
  {
    id: 'dept-2',
    name: 'Marketing',
    headId: '6',
    headName: 'David Park',
    memberCount: 2,
    targetQuota: 'N/A',
    currentPerformance: '450 MQLs',
    performancePercent: 112
  },
  {
    id: 'dept-3',
    name: 'Customer Success',
    headId: '9',
    headName: 'Lisa Anderson',
    memberCount: 2,
    targetQuota: '95% CSAT',
    currentPerformance: '94% CSAT',
    performancePercent: 99
  },
  {
    id: 'dept-4',
    name: 'Executive',
    headId: '1',
    headName: 'John Smith',
    memberCount: 1,
    targetQuota: 'N/A',
    currentPerformance: 'Strategic',
    performancePercent: 100
  }
];

export const mockUserActivityLogs: UserActivityLog[] = [
  {
    id: 'log-1',
    userId: '2',
    userName: 'Sarah Chen',
    action: 'Login',
    details: 'Successful login',
    timestamp: 'Dec 27, 2024 at 9:30 AM PST',
    ipAddress: '192.168.1.45',
    device: 'Chrome on MacOS',
    location: 'New York, NY'
  },
  {
    id: 'log-2',
    userId: '3',
    userName: 'Alex Rodriguez',
    action: 'Deal Created',
    details: 'Created deal "TechStart Enterprise License"',
    timestamp: 'Dec 27, 2024 at 9:45 AM PST',
    ipAddress: '192.168.1.67',
    device: 'Chrome on Windows',
    location: 'Austin, TX'
  },
  {
    id: 'log-3',
    userId: '5',
    userName: 'Mike Johnson',
    action: 'HRMS Connection',
    details: 'Connected to TechStart HRMS',
    timestamp: 'Dec 27, 2024 at 8:15 AM PST',
    ipAddress: '192.168.1.89',
    device: 'Safari on MacOS',
    location: 'Chicago, IL'
  },
  {
    id: 'log-4',
    userId: '6',
    userName: 'David Park',
    action: 'Campaign Launched',
    details: 'Launched email campaign "Q1 Product Launch"',
    timestamp: 'Dec 27, 2024 at 9:00 AM PST',
    ipAddress: '192.168.1.23',
    device: 'Chrome on MacOS',
    location: 'Seattle, WA'
  },
  {
    id: 'log-5',
    userId: '4',
    userName: 'Emily Davis',
    action: 'Report Generated',
    details: 'Generated "Sales Pipeline Analysis" report',
    timestamp: 'Dec 27, 2024 at 8:20 AM PST',
    ipAddress: '192.168.1.34',
    device: 'Firefox on Windows',
    location: 'Boston, MA'
  }
];

export const mockAuditLog: AuditLogEntry[] = [
  {
    id: 'audit-1',
    performedBy: 'John Smith',
    performedById: '1',
    action: 'user_added',
    targetUser: 'Kevin Taylor',
    targetUserId: '12',
    timestamp: 'Dec 20, 2024 at 2:15 PM PST',
    changes: 'Added new user with role: Sales Representative',
    reason: 'New hire for Q1 expansion'
  },
  {
    id: 'audit-2',
    performedBy: 'John Smith',
    performedById: '1',
    action: 'user_deactivated',
    targetUser: 'Jennifer Brown',
    targetUserId: '11',
    timestamp: 'Dec 1, 2024 at 10:30 AM PST',
    changes: 'Changed status from Active to Inactive',
    reason: 'Employee resigned, final day Nov 30'
  },
  {
    id: 'audit-3',
    performedBy: 'Sarah Chen',
    performedById: '2',
    action: 'role_changed',
    targetUser: 'Alex Rodriguez',
    targetUserId: '3',
    timestamp: 'Nov 15, 2024 at 3:45 PM PST',
    changes: 'Changed role from Sales Rep to Senior Sales Rep',
    reason: 'Promotion after exceeding Q3 targets'
  },
  {
    id: 'audit-4',
    performedBy: 'John Smith',
    performedById: '1',
    action: 'permissions_modified',
    targetUser: 'David Park',
    targetUserId: '6',
    timestamp: 'Nov 1, 2024 at 9:00 AM PST',
    changes: 'Added marketing automation permissions',
    reason: 'Required for campaign management tools'
  },
  {
    id: 'audit-5',
    performedBy: 'John Smith',
    performedById: '1',
    action: 'user_added',
    targetUser: 'Tom Martinez',
    targetUserId: '10',
    timestamp: 'Jul 10, 2024 at 11:00 AM PST',
    changes: 'Added new user with role: Customer Success Specialist',
    reason: 'Customer base expansion'
  },
  {
    id: 'audit-6',
    performedBy: 'Sarah Chen',
    performedById: '2',
    action: 'user_edited',
    targetUser: 'James Wilson',
    targetUserId: '7',
    timestamp: 'May 20, 2024 at 2:30 PM PST',
    changes: 'Updated phone number and timezone',
    reason: 'Employee relocation to Denver'
  },
  {
    id: 'audit-7',
    performedBy: 'John Smith',
    performedById: '1',
    action: 'user_activated',
    targetUser: 'Lisa Anderson',
    targetUserId: '9',
    timestamp: 'Apr 20, 2024 at 9:00 AM PST',
    changes: 'Activated account after onboarding completion',
    reason: 'Completed new hire training'
  }
];

export interface TeamPerformanceMetrics {
  totalRevenue: string;
  targetRevenue: string;
  attainmentPercent: number;
  activitiesCompleted: number;
  averageDealSize: string;
  averageSalesyCycle: string;
  winRate: number;
  teamProductivity: number;
}

export const mockTeamPerformanceMetrics: TeamPerformanceMetrics = {
  totalRevenue: '$2.8M',
  targetRevenue: '$3.2M',
  attainmentPercent: 88,
  activitiesCompleted: 1247,
  averageDealSize: '$85K',
  averageSalesyCycle: '45 days',
  winRate: 32,
  teamProductivity: 94
};

export interface InvitePendingUser {
  id: string;
  email: string;
  role: UserRole;
  department: Department;
  invitedBy: string;
  invitedById: string;
  invitedOn: string;
  expiresOn: string;
  status: 'pending' | 'expired';
}

export const mockPendingInvites: InvitePendingUser[] = [
  {
    id: 'invite-1',
    email: 'kevin.taylor@bmi.com',
    role: 'sales_rep',
    department: 'Sales',
    invitedBy: 'John Smith',
    invitedById: '1',
    invitedOn: 'Dec 20, 2024',
    expiresOn: 'Jan 3, 2025',
    status: 'pending'
  }
];

export const getRoleDisplayName = (role: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    admin: 'Administrator',
    sales_manager: 'Sales Manager',
    sales_rep: 'Sales Representative',
    account_executive: 'Account Executive',
    marketing_manager: 'Marketing Manager',
    customer_success: 'Customer Success'
  };
  return roleMap[role] || role;
};

export const getStatusBadgeClass = (status: UserStatus): string => {
  const statusMap: Record<UserStatus, string> = {
    active: 'bg-green-100 text-green-800 border-green-300',
    inactive: 'bg-gray-100 text-gray-800 border-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    suspended: 'bg-red-100 text-red-800 border-red-300'
  };
  return statusMap[status] || statusMap.inactive;
};

export const getStatusIcon = (status: UserStatus): string => {
  const iconMap: Record<UserStatus, string> = {
    active: '✅',
    inactive: '⏸️',
    pending: '⏳',
    suspended: '🚫'
  };
  return iconMap[status] || '❓';
};
