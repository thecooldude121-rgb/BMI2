# Direct Reports - Setup Guide for Developers
**How to Add Direct Reports to Team Members**

---

## 🎯 OVERVIEW

This guide explains how to add direct reports to team members in the system. The Direct Reports section automatically appears for any team member who has the `directReports` array populated.

---

## 📝 QUICK SETUP

### Step 1: Define the Direct Reports Data

Add the `directReports` array to a team member in `TEAM_MEMBER_DATA` object in `/src/pages/Team/TeamMemberDetailPage.tsx`:

```typescript
const TEAM_MEMBER_DATA: Record<string, TeamMemberDetail> = {
  '2': {
    id: '2',
    name: 'Sarah Chen',
    role: 'Sales Manager',
    // ... other fields ...
    directReports: [
      {
        id: '3',                        // Team member ID (for navigation)
        name: 'Alex Rodriguez',         // Full name
        initials: 'AR',                 // For avatar
        role: 'Sales Representative',   // Job title
        email: 'alex@bmi.com',          // Email address
        status: 'active',               // 'active' or 'inactive'
        memberSince: 'Oct 1, 2024',     // Join date
        activeDeals: 8,                 // Current deals count
        pipeline: '$450,000',           // Formatted pipeline value
        pipelineValue: 450000,          // Numeric pipeline value
        winRate: 67,                    // Win rate percentage
        winRateLabel: 'Solid performer', // Performance label
        lastActivity: '2 hours ago',    // Time since last activity
        quotaAttainment: 104            // Quota percentage
      },
      // Add more reports...
    ]
  }
};
```

---

## 📊 DATA STRUCTURE REFERENCE

### DirectReport Interface

```typescript
interface DirectReport {
  id: string;                    // Required: Team member ID
  name: string;                  // Required: Full name
  initials: string;              // Required: 2-letter initials
  role: string;                  // Required: Job title
  email: string;                 // Required: Email address
  status: 'active' | 'inactive'; // Required: Employment status
  memberSince: string;           // Required: Join date
  activeDeals: number;           // Required: Deal count
  pipeline: string;              // Required: Formatted value ($450,000)
  pipelineValue: number;         // Required: Numeric value (450000)
  winRate: number;               // Required: Percentage (67)
  winRateLabel: string;          // Required: Label ("Solid performer")
  lastActivity: string;          // Required: Time ("2 hours ago")
  quotaAttainment: number;       // Required: Percentage (104)
}
```

---

## 🏢 EXAMPLE SCENARIOS

### Scenario 1: Manager with 2 Reports (Current)

**Sarah Chen (Manager)**
- Alex Rodriguez (Sales Rep)
- Emily Davis (Sales Rep)

```typescript
'2': {
  id: '2',
  name: 'Sarah Chen',
  role: 'Sales Manager',
  directReports: [
    {
      id: '3',
      name: 'Alex Rodriguez',
      initials: 'AR',
      role: 'Sales Representative',
      email: 'alex@bmi.com',
      status: 'active',
      memberSince: 'Oct 1, 2024',
      activeDeals: 8,
      pipeline: '$450,000',
      pipelineValue: 450000,
      winRate: 67,
      winRateLabel: 'Solid performer',
      lastActivity: '2 hours ago',
      quotaAttainment: 104
    },
    {
      id: '4',
      name: 'Emily Davis',
      initials: 'ED',
      role: 'Sales Representative',
      email: 'emily@bmi.com',
      status: 'active',
      memberSince: 'Oct 1, 2024',
      activeDeals: 5,
      pipeline: '$280,000',
      pipelineValue: 280000,
      winRate: 65,
      winRateLabel: 'On track',
      lastActivity: '5 hours ago',
      quotaAttainment: 108
    }
  ]
}
```

---

### Scenario 2: Director with 3 Managers

**John Smith (Director)**
- Sarah Chen (Manager)
- Michael Brown (Manager)
- Jennifer Lee (Manager)

```typescript
'5': {
  id: '5',
  name: 'John Smith',
  role: 'Sales Director',
  directReports: [
    {
      id: '2',
      name: 'Sarah Chen',
      initials: 'SC',
      role: 'Sales Manager',
      email: 'sarah@bmi.com',
      status: 'active',
      memberSince: 'Jan 15, 2024',
      activeDeals: 12,
      pipeline: '$680,000',
      pipelineValue: 680000,
      winRate: 72,
      winRateLabel: 'Top performer',
      lastActivity: '1 hour ago',
      quotaAttainment: 108
    },
    {
      id: '6',
      name: 'Michael Brown',
      initials: 'MB',
      role: 'Sales Manager',
      email: 'michael@bmi.com',
      status: 'active',
      memberSince: 'Mar 1, 2024',
      activeDeals: 10,
      pipeline: '$520,000',
      pipelineValue: 520000,
      winRate: 68,
      winRateLabel: 'Strong performer',
      lastActivity: '30 minutes ago',
      quotaAttainment: 102
    },
    {
      id: '7',
      name: 'Jennifer Lee',
      initials: 'JL',
      role: 'Sales Manager',
      email: 'jennifer@bmi.com',
      status: 'active',
      memberSince: 'Feb 10, 2024',
      activeDeals: 11,
      pipeline: '$590,000',
      pipelineValue: 590000,
      winRate: 70,
      winRateLabel: 'Excellent',
      lastActivity: '2 hours ago',
      quotaAttainment: 110
    }
  ]
}
```

---

### Scenario 3: Manager with Underperformer

**David Wilson (Manager)**
- Tom Anderson (needs attention)
- Lisa Martinez (performing well)

```typescript
'8': {
  id: '8',
  name: 'David Wilson',
  role: 'Sales Manager',
  directReports: [
    {
      id: '9',
      name: 'Tom Anderson',
      initials: 'TA',
      role: 'Sales Representative',
      email: 'tom@bmi.com',
      status: 'active',
      memberSince: 'Sep 1, 2024',
      activeDeals: 3,
      pipeline: '$150,000',
      pipelineValue: 150000,
      winRate: 45,
      winRateLabel: 'Needs improvement',
      lastActivity: '3 days ago',
      quotaAttainment: 62
    },
    {
      id: '10',
      name: 'Lisa Martinez',
      initials: 'LM',
      role: 'Sales Representative',
      email: 'lisa@bmi.com',
      status: 'active',
      memberSince: 'Aug 15, 2024',
      activeDeals: 9,
      pipeline: '$480,000',
      pipelineValue: 480000,
      winRate: 75,
      winRateLabel: 'Outstanding',
      lastActivity: '1 hour ago',
      quotaAttainment: 115
    }
  ]
}
```

---

## 🎨 PERFORMANCE LABELS GUIDE

Use these suggested labels based on win rate:

| Win Rate | Label | Use For |
|----------|-------|---------|
| 90%+ | "Outstanding" | Top performers |
| 75-89% | "Excellent" | High performers |
| 70-74% | "Top performer" | Above average |
| 65-69% | "Strong performer" | Good performance |
| 60-64% | "Solid performer" | Average performance |
| 55-59% | "On track" | Meeting expectations |
| 50-54% | "Developing" | New or learning |
| 45-49% | "Needs improvement" | Below expectations |
| <45% | "Requires attention" | Underperforming |

---

## 📊 TEAM STATISTICS

The component automatically calculates:

### Total Deals
Sum of all activeDeals:
```typescript
totalDeals = reports.reduce((sum, r) => sum + r.activeDeals, 0)
```

### Total Pipeline
Sum of all pipelineValue:
```typescript
totalPipeline = reports.reduce((sum, r) => sum + r.pipelineValue, 0)
```

### Average Win Rate
Average of all winRate:
```typescript
avgWinRate = reports.reduce((sum, r) => sum + r.winRate, 0) / reports.length
```

### Average Quota Attainment
Average of all quotaAttainment:
```typescript
avgQuota = reports.reduce((sum, r) => sum + r.quotaAttainment, 0) / reports.length
```

---

## 🔧 FORMATTING GUIDELINES

### Pipeline Values

**Formatted (pipeline):**
- Use dollar sign: `$`
- Use commas: `$450,000`
- No decimals for whole thousands
- Examples: `$450,000`, `$1,200,000`, `$85,000`

**Numeric (pipelineValue):**
- No formatting
- Pure number: `450000`
- Used for calculations

### Dates

**memberSince:**
- Format: "Month Day, Year"
- Examples: "Oct 1, 2024", "Jan 15, 2024"

**lastActivity:**
- Relative time format
- Examples:
  - "2 hours ago"
  - "30 minutes ago"
  - "3 days ago"
  - "1 week ago"

### Status Values

**Must be exactly:**
- `'active'` - Currently employed
- `'inactive'` - No longer employed

**Display:**
- active: ✅ Active (green)
- inactive: ⚪ Inactive (gray)

---

## 🚀 ADDING A NEW REPORT (STEP-BY-STEP)

### Step 1: Get Team Member Data
Collect this information:
- ID (must match existing team member if they have a profile)
- Full name
- Initials (first letter of first + last name)
- Role/title
- Email address
- Join date
- Current performance metrics

### Step 2: Add to directReports Array
```typescript
'2': {  // Manager's ID
  // ... manager data ...
  directReports: [
    // ... existing reports ...
    {
      id: 'NEW_ID',              // ← Add new report here
      name: 'New Person',
      initials: 'NP',
      role: 'Sales Representative',
      email: 'new@bmi.com',
      status: 'active',
      memberSince: 'Dec 1, 2024',
      activeDeals: 4,
      pipeline: '$200,000',
      pipelineValue: 200000,
      winRate: 60,
      winRateLabel: 'Solid performer',
      lastActivity: '1 hour ago',
      quotaAttainment: 95
    }
  ]
}
```

### Step 3: Verify
1. Save the file
2. Navigate to manager's profile page
3. Verify new report appears
4. Verify calculations update
5. Test navigation to report's profile (if exists)

---

## 🧪 TESTING CHECKLIST

After adding direct reports:

- [ ] Section appears on manager's page
- [ ] Correct number shown in header (e.g., "Direct Reports (3)")
- [ ] All report cards display
- [ ] All data accurate (name, role, email, metrics)
- [ ] Team statistics calculate correctly
- [ ] [View Profile] navigates to correct page
- [ ] Quick actions work (Email, Call, 1-on-1)
- [ ] No console errors
- [ ] No TypeScript errors

---

## 🐛 COMMON MISTAKES

### Mistake 1: Wrong ID
```typescript
// ❌ WRONG - Using arbitrary ID
id: 'report1'

// ✅ CORRECT - Using actual team member ID
id: '3'  // Must match TeamMemberDetailPage route
```

### Mistake 2: Inconsistent Format
```typescript
// ❌ WRONG - No $ sign, wrong format
pipeline: '450000',
pipelineValue: '$450,000',

// ✅ CORRECT
pipeline: '$450,000',
pipelineValue: 450000,
```

### Mistake 3: Wrong Status Value
```typescript
// ❌ WRONG - String doesn't match type
status: 'employed',

// ✅ CORRECT - Must be 'active' or 'inactive'
status: 'active',
```

### Mistake 4: Missing Required Fields
```typescript
// ❌ WRONG - Missing fields
{
  id: '3',
  name: 'Alex Rodriguez',
  email: 'alex@bmi.com'
}

// ✅ CORRECT - All fields present
{
  id: '3',
  name: 'Alex Rodriguez',
  initials: 'AR',
  role: 'Sales Representative',
  email: 'alex@bmi.com',
  status: 'active',
  memberSince: 'Oct 1, 2024',
  activeDeals: 8,
  pipeline: '$450,000',
  pipelineValue: 450000,
  winRate: 67,
  winRateLabel: 'Solid performer',
  lastActivity: '2 hours ago',
  quotaAttainment: 104
}
```

---

## 🔮 FUTURE ENHANCEMENTS

### Real-Time Updates
Currently uses mock data. Future: fetch from database.

```typescript
// Future implementation
useEffect(() => {
  const fetchDirectReports = async () => {
    const reports = await api.getDirectReports(memberId);
    setDirectReports(reports);
  };
  fetchDirectReports();
}, [memberId]);
```

### Coaching Alerts
Logic to detect team members needing attention:

```typescript
const needsAttention = reports.filter(r =>
  r.winRate < 60 ||
  r.quotaAttainment < 80 ||
  r.lastActivity.includes('days ago')
);
```

### Performance Trends
Add historical data:

```typescript
interface DirectReport {
  // ... existing fields ...
  trend: {
    dealsChange: number;
    pipelineChange: number;
    winRateChange: number;
  };
}
```

---

## 📚 RELATED FILES

- Component: `/src/components/Team/DirectReportsSection.tsx`
- Page: `/src/pages/Team/TeamMemberDetailPage.tsx`
- Types: DirectReport interface (in TeamMemberDetailPage.tsx)
- Documentation: `SCREEN_9_2_DIRECT_REPORTS_IMPLEMENTATION.md`

---

## ✅ SUMMARY

**To add direct reports:**
1. Add `directReports` array to manager in TEAM_MEMBER_DATA
2. Include all required fields for each report
3. Use correct formatting for values
4. Test the implementation
5. Verify calculations

**The section will automatically:**
- Appear for managers with reports
- Hide for non-managers
- Calculate team statistics
- Enable navigation and quick actions

---

**Document Version:** 1.0
**Last Updated:** December 26, 2024
**Maintainer:** Development Team
