# Team Management Mock Data Guide

## Overview
This guide documents the comprehensive mock data structure for the Team Management section (Section 11) of CRM Settings.

## Section Metadata

- **Section ID**: 11
- **Section Name**: Team Management
- **Section Icon**: 👥
- **Section Description**: User management, roles, and access control
- **Access Level**: Admin Only
- **Route**: `/settings#team-management`
- **Alternative Route**: `/settings/team-management`

## Data Structure

### 1. Team Members (`mockTeamMembers`)

**Total Members**: 12 users across all departments and statuses

#### Team Composition:
- **Active Members**: 10
- **Inactive Members**: 1 (Jennifer Brown)
- **Pending Invites**: 1 (Kevin Taylor)

#### By Department:
- **Sales**: 6 members (John Smith, Sarah Chen, Alex Rodriguez, Emily Davis, Mike Johnson, James Wilson)
- **Marketing**: 2 members (David Park, Rachel Kim)
- **Customer Success**: 2 members (Lisa Anderson, Tom Martinez)
- **Executive**: 1 member (John Smith)
- **Operations**: 0 members (expandable)

#### By Role:
- **Administrator**: 1 (John Smith)
- **Sales Manager**: 1 (Sarah Chen)
- **Sales Representative**: 4 (Alex Rodriguez, Emily Davis, James Wilson, Kevin Taylor-pending)
- **Account Executive**: 2 (Mike Johnson, Jennifer Brown-inactive)
- **Marketing Manager**: 2 (David Park, Rachel Kim)
- **Customer Success**: 2 (Lisa Anderson, Tom Martinez)

#### Team Member Properties:
```typescript
interface TeamMember {
  id: string;                    // Unique identifier
  name: string;                  // Full name
  initials: string;              // Avatar initials
  email: string;                 // Work email
  phone: string;                 // Contact number
  role: UserRole;                // System role
  status: UserStatus;            // Account status
  department: Department;        // Department assignment
  reportsTo?: string;            // Manager name
  reportsToId?: string;          // Manager ID
  directReports?: string[];      // Team member names
  directReportIds?: string[];    // Team member IDs
  memberSince: string;           // Join date
  lastLogin: string;             // Last activity
  permissions: string;           // Permission summary
  avatarColor: string;           // Gradient color class
  quickStats: {                  // Performance metrics
    activeDeals: number;
    pipeline: string;
    additionalInfo?: string;
  };
  location: string;              // City, State
  timezone: string;              // Timezone info
  employeeId: string;            // Employee ID
  jobTitle: string;              // Job title
}
```

### 2. Team Capacity (`mockTeamCapacity`)

```typescript
interface TeamCapacity {
  activeMembers: 10;           // Currently active users
  inactiveMembers: 1;          // Deactivated users
  pendingInvites: 1;           // Pending invitations
  availableSeats: 8;           // Unused seats
  totalCapacity: 20;           // Plan capacity
  lastUpdated: '2 hours ago';  // Sync timestamp
  plan: 'Professional';        // Subscription plan
  utilization: 60;             // Percentage used
  costPerSeat: 49;             // Price per seat
  monthlyCost: 980;            // Total monthly cost
}
```

### 3. Role Definitions (`mockRoleDefinitions`)

6 predefined roles with different permission levels (0-100):

1. **Administrator** (Level 100)
   - Full system access
   - Team management
   - Settings control
   - 1 member

2. **Sales Manager** (Level 80)
   - Team management
   - All sales records
   - Reports access
   - 1 member

3. **Sales Representative** (Level 50)
   - Own records only
   - Standard access
   - 4 members

4. **Account Executive** (Level 60)
   - Key accounts
   - Reports access
   - 2 members

5. **Marketing Manager** (Level 70)
   - Team management
   - Campaign access
   - 2 members

6. **Customer Success** (Level 60)
   - Customer records
   - Support tools
   - 2 members

### 4. Permission Sets (`mockPermissionSets`)

3 permission templates defining module access:

1. **Full Access**: Complete CRUD on all modules
2. **Sales Manager**: Manager-level access, no delete/settings
3. **Standard User**: Basic user access to own records

Each permission set defines access for:
- Prospects
- Leads
- Accounts
- Deals
- Contacts
- Meetings
- Documents
- Reports
- Settings

### 5. Departments (`mockDepartments`)

4 departments with performance metrics:

1. **Sales**
   - Head: Sarah Chen
   - Members: 6
   - Target: $3.2M
   - Performance: $2.8M (88%)

2. **Marketing**
   - Head: David Park
   - Members: 2
   - Target: N/A
   - Performance: 450 MQLs (112%)

3. **Customer Success**
   - Head: Lisa Anderson
   - Members: 2
   - Target: 95% CSAT
   - Performance: 94% CSAT (99%)

4. **Executive**
   - Head: John Smith
   - Members: 1
   - Strategic oversight

### 6. User Activity Logs (`mockUserActivityLogs`)

5 recent activity entries tracking:
- Login events
- Deal creation
- HRMS connections
- Campaign launches
- Report generation

Each log includes:
- User identification
- Action type
- Detailed description
- Timestamp
- IP address
- Device information
- Geographic location

### 7. Audit Log (`mockAuditLog`)

7 audit entries documenting:
- User additions
- User deactivations
- Role changes
- Permission modifications
- User activations
- User edits

Each entry includes:
- Performer (who made the change)
- Action type
- Target user (who was affected)
- Timestamp
- Change details
- Reason for change

### 8. Team Performance Metrics (`mockTeamPerformanceMetrics`)

Overall team statistics:
- Total Revenue: $2.8M
- Target Revenue: $3.2M
- Attainment: 88%
- Activities Completed: 1,247
- Average Deal Size: $85K
- Average Sales Cycle: 45 days
- Win Rate: 32%
- Team Productivity: 94%

### 9. Pending Invites (`mockPendingInvites`)

Outstanding user invitations:
- Email address
- Assigned role
- Department
- Invited by (name and ID)
- Invitation date
- Expiration date
- Status (pending/expired)

## Key Team Members Profiles

### John Smith (CEO)
- **Role**: Administrator
- **Status**: Active
- **Location**: San Francisco, CA
- **Reports**: 3 direct reports (Sarah Chen, David Park, Lisa Anderson)
- **Stats**: 5 deals, $2.1M pipeline
- **Special**: Full system access, CEO

### Sarah Chen (Sales Manager)
- **Role**: Sales Manager
- **Status**: Active
- **Location**: New York, NY
- **Reports to**: John Smith
- **Manages**: 3 direct reports (Alex, Emily, James)
- **Stats**: 12 deals, $680K pipeline, 106% quota
- **Special**: Top performing team

### Alex Rodriguez (Senior Sales Rep)
- **Role**: Sales Representative
- **Status**: Active
- **Location**: Austin, TX
- **Reports to**: Sarah Chen
- **Stats**: 8 deals, $450K pipeline, Daily login
- **Special**: Promoted from Sales Rep

### Jennifer Brown (Inactive)
- **Role**: Account Executive
- **Status**: Inactive
- **Last Login**: Nov 30, 2024
- **Reason**: Resigned, account deactivated Dec 1

### Kevin Taylor (Pending)
- **Role**: Sales Representative
- **Status**: Pending
- **Location**: Phoenix, AZ
- **Invited**: Dec 20, 2024
- **Special**: New hire, awaiting acceptance

## Helper Functions

### `getRoleDisplayName(role: UserRole): string`
Converts role codes to display-friendly names.

### `getStatusBadgeClass(status: UserStatus): string`
Returns Tailwind CSS classes for status badges:
- Active: Green
- Inactive: Gray
- Pending: Yellow
- Suspended: Red

### `getStatusIcon(status: UserStatus): string`
Returns emoji icons for status:
- Active: ✅
- Inactive: ⏸️
- Pending: ⏳
- Suspended: 🚫

## Usage in Components

```typescript
import {
  mockTeamMembers,
  mockTeamCapacity,
  mockRoleDefinitions,
  mockDepartments,
  mockAuditLog,
  getRoleDisplayName,
  getStatusBadgeClass,
  getStatusIcon,
  type TeamMember,
  type UserRole,
  type UserStatus
} from '../../../utils/teamManagementMockData';

// Use in component
const teamMembers = mockTeamMembers;
const capacity = mockTeamCapacity;

// Apply filters
const filteredMembers = teamMembers.filter(member => {
  return member.status === 'active' &&
         member.department === 'Sales';
});

// Display user info
{teamMembers.map(member => (
  <div key={member.id}>
    <h3>{member.name}</h3>
    <span className={getStatusBadgeClass(member.status)}>
      {getStatusIcon(member.status)} {member.status}
    </span>
    <p>Role: {getRoleDisplayName(member.role)}</p>
  </div>
))}
```

## Color Coding

Each team member has a unique avatar gradient:
- John Smith: Red gradient
- Sarah Chen: Blue gradient
- Alex Rodriguez: Green gradient
- Emily Davis: Purple gradient
- Mike Johnson: Orange gradient
- David Park: Pink gradient
- James Wilson: Teal gradient
- Rachel Kim: Yellow gradient
- Lisa Anderson: Cyan gradient
- Tom Martinez: Indigo gradient
- Jennifer Brown: Gray (inactive)
- Kevin Taylor: Yellow (pending)

## Testing Scenarios

### Scenario 1: Filter by Status
- Active: 10 members
- Inactive: 1 member
- Pending: 1 member

### Scenario 2: Filter by Role
- Admin: 1
- Sales Manager: 1
- Sales Rep: 4
- Account Executive: 2
- Marketing Manager: 2
- Customer Success: 2

### Scenario 3: Filter by Department
- Sales: 6
- Marketing: 2
- Customer Success: 2
- Executive: 1

### Scenario 4: Search Functionality
Test with:
- Names (e.g., "Sarah", "Alex")
- Emails (e.g., "sarah@bmi.com")
- Partial matches

### Scenario 5: Multi-Filter
- Active Sales Representatives: 3
- Active Marketing: 2
- Pending Sales: 1

## Best Practices

1. **Filtering**: Always use the provided filter functions to maintain consistency
2. **Display Names**: Use `getRoleDisplayName()` instead of raw role values
3. **Status Badges**: Use `getStatusBadgeClass()` and `getStatusIcon()` for consistent styling
4. **Avatar Colors**: Apply the `avatarColor` property directly to gradient backgrounds
5. **Audit Trail**: Reference `mockAuditLog` for user management history

## Future Enhancements

Placeholder data is provided for Phase 2 features:
- Permission matrix editor
- Role hierarchy visualization
- User activity analytics
- Team performance dashboards
- Advanced filtering options
- Bulk user operations

## Data Integrity

All relationships are maintained:
- `reportsToId` matches valid user IDs
- `directReportIds` reference existing users
- Department heads are actual team members
- Audit log entries reference real user IDs
- Permission sets align with role definitions
