# Direct Reports - Mock Data Specifications
**Complete Data Structure & Coaching Alert System**
**Date:** December 26, 2024

---

## 🎯 OVERVIEW

This document describes the complete mock data structure for the Direct Reports section, including all fields, calculations, and the intelligent coaching alert system with green/yellow/red indicators.

---

## 👥 SARAH CHEN'S DIRECT REPORTS

Sarah Chen (ID: '2', Sales Manager) has 2 direct reports:

### Report 1: Alex Rodriguez

**Basic Information:**
```typescript
id: '1'
name: 'Alex Rodriguez'
initials: 'AR'
role: 'Sales Representative'
email: 'alex@bmi.com'
phone: '555-0002'
photoColor: '#3b82f6' (Blue)
status: 'active'
memberSince: 'Oct 1, 2024'
reportsTo: 'Sarah Chen'
reportsToId: '2'
```

**Performance Metrics:**
```typescript
activeDeals: 8
pipeline: '$450,000'
pipelineValue: 450000
winRate: 67 (percentage)
quota: '$432,000'
quotaValue: 432000
quotaAttainment: 104 (percentage)
performanceLabel: 'Solid performer'
```

**Activity Information:**
```typescript
lastActivityType: 'Phone call with prospect'
lastActivity: '2 hours ago'
lastActivityDate: 'Dec 13, 2024 at 2:00 PM PST'
activityStatus: 'Active (recent engagement)'
```

**Coaching Status:**
```typescript
coachingStatus: {
  needsAttention: false
  last1on1: 'Dec 8, 2024'
  next1on1: 'Dec 20, 2024'
  performanceTrend: 'Steady'
}
```

**Analysis:**
- ✅ Green Status (Performing Well)
- Win rate 67% (above 65% threshold)
- Pipeline at 104% of quota (above 90% threshold)
- Active within last 24 hours
- Steady performance trend

---

### Report 2: Emily Davis

**Basic Information:**
```typescript
id: '4'
name: 'Emily Davis'
initials: 'ED'
role: 'Sales Representative'
email: 'emily@bmi.com'
phone: '555-0004'
photoColor: '#3b82f6' (Blue)
status: 'active'
memberSince: 'Oct 1, 2024'
reportsTo: 'Sarah Chen'
reportsToId: '2'
```

**Performance Metrics:**
```typescript
activeDeals: 5
pipeline: '$280,000'
pipelineValue: 280000
winRate: 65 (percentage)
quota: '$260,000'
quotaValue: 260000
quotaAttainment: 108 (percentage)
performanceLabel: 'On track'
```

**Activity Information:**
```typescript
lastActivityType: 'Email to prospect'
lastActivity: '5 hours ago'
lastActivityDate: 'Dec 13, 2024 at 11:00 AM PST'
activityStatus: 'Active'
```

**Coaching Status:**
```typescript
coachingStatus: {
  needsAttention: false
  last1on1: 'Dec 9, 2024'
  next1on1: 'Dec 22, 2024'
  performanceTrend: 'Improving'
}
```

**Analysis:**
- ✅ Green Status (Performing Well)
- Win rate 65% (at threshold, acceptable)
- Pipeline at 108% of quota (well above 90% threshold)
- Active within last 24 hours
- Improving performance trend

---

## 📊 TEAM ROLLUP STATISTICS

### Combined Performance

**Deal Metrics:**
```typescript
totalDeals: 13 (8 + 5)
totalPipeline: $730,000 ($450K + $280K)
totalQuota: $692,000 ($432K + $260K)
```

**Average Metrics:**
```typescript
avgWinRate: 66% ((67 + 65) / 2)
avgQuota: 106% ((104 + 108) / 2)
```

**Trend Comparison:**
```typescript
pipelineChange: '+8%'
lastMonthPipeline: $676,000
currentPipeline: $730,000
calculation: ($730K - $676K) / $676K = 7.988% ≈ 8%
```

**Activity Health:**
```typescript
activityHealth: 'Excellent'
avgResponseTime: '2.1 hours'
membersActive24hrs: 2 (both members)
```

### Individual Attainments

**Breakdown:**
- Alex Rodriguez: 104% ($450K / $432K)
- Emily Davis: 108% ($280K / $260K)

**Display Format:**
```
Team Quota Attainment: 106%
($730K actual / $692K quota)

Alex: 104%, Emily: 108%
```

---

## 🚦 COACHING ALERT SYSTEM

### Alert Thresholds

The system evaluates each team member against these criteria:

#### 🟢 GREEN (Performing Well)
**Criteria:**
- Win Rate ≥ 65%
- Pipeline ≥ 90% of quota
- Active within last 24 hours
- No overdue critical tasks

**Status Message:**
```
"None at this time - team performing well"
```

**Visual:**
- Background: Green-50 (`bg-green-50`)
- Border: Green-200 (`border-green-200`)
- Icon: ✅

---

#### 🟡 YELLOW (Needs Attention)
**Criteria:**
- Win Rate 55-64% OR
- Pipeline 80-89% of quota OR
- Inactive 1-3 days OR
- 1-3 overdue tasks OR
- coachingStatus.needsAttention = true

**Status Message:**
```
"Consider coaching intervention"
[Count] member(s) need attention: [Names]
```

**Visual:**
- Background: Yellow-50 (`bg-yellow-50`)
- Border: Yellow-200 (`border-yellow-200`)
- Icon: ⚠️

---

#### 🔴 RED (Urgent Attention)
**Criteria:**
- Win Rate < 55% OR
- Pipeline < 80% of quota OR
- Inactive > 3 days OR
- 4+ overdue tasks

**Status Message:**
```
"Urgent coaching needed"
[Count] member(s) require urgent attention: [Names]
```

**Visual:**
- Background: Red-50 (`bg-red-50`)
- Border: Red-200 (`border-red-200`)
- Icon: 🔴

---

### Current Team Status

**Sarah Chen's Team: 🟢 GREEN**

**Calculation:**
```typescript
// Check for urgent (red) issues
atRisk = reports.filter(r =>
  r.winRate < 55 ||
  (r.pipelineValue / r.quotaValue) < 0.80
);
// Result: 0 members

// Check for attention (yellow) needed
needsAttention = reports.filter(r =>
  r.winRate < 65 ||
  (r.pipelineValue / r.quotaValue) < 0.90 ||
  r.coachingStatus.needsAttention
);
// Result: 0 members

// Alex: 67% win rate, 104% quota ✅
// Emily: 65% win rate, 108% quota ✅

// Final status: GREEN
```

**Message:** "None at this time - team performing well"

---

## 🎨 VISUAL DISPLAY

### Report Card Layout

```
┌─────────────────────────────────────────────────┐
│ [AR] Alex Rodriguez        [View Profile] 📈    │
│ Sales Representative                      Steady │
│ alex@bmi.com | 555-0002                          │
│                                                   │
│ Performance:                                      │
│ 🎯 Active Deals: 8 deals                         │
│ 💰 Pipeline: $450,000 (104% of $432,000 quota)  │
│ 📈 Win Rate: 67% (Solid performer)               │
│ 🕐 Last Activity: 2 hours ago                    │
│    Phone call with prospect                      │
│    Dec 13, 2024 at 2:00 PM PST                   │
│                                                   │
│ Coaching Schedule:                                │
│ Last 1-on-1: Dec 8, 2024                         │
│ Next 1-on-1: Dec 20, 2024                        │
│                                                   │
│ Status: ✅ Active | Member since: Oct 1, 2024    │
│                                                   │
│ [📧 Email] [📞 Schedule Call] [🤝 1-on-1]       │
└─────────────────────────────────────────────────┘
```

### Team Rollup Stats Layout

```
┌─────────────────────────────────────────────────┐
│ 📊 TEAM ROLLUP STATS                             │
├─────────────────────────────────────────────────┤
│                                                   │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│ │💼 13 │ │🎯$730K│ │🏆 66%│ │📅Active│         │
│ │Deals │ │+8% LM│ │Team  │ │24hrs │           │
│ └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                   │
│ Team Quota Attainment: 106%                      │
│ ($730K actual / $692K quota)                     │
│ Alex: 104% | Emily: 108%                         │
│                                                   │
│ Team Activity Health: Excellent                  │
│ Average Response Time: 2.1 hours                 │
│ Members Exceeding Expectations: 2                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ✅ Coaching Attention Needed:                    │
│ None at this time - team performing well         │
└─────────────────────────────────────────────────┘
```

---

## 🔧 DATA STRUCTURE REFERENCE

### DirectReport Interface

```typescript
interface DirectReport {
  // Basic Information
  id: string;                    // Unique team member ID
  name: string;                  // Full name
  initials: string;              // Avatar initials (2 chars)
  role: string;                  // Job title
  email: string;                 // Email address
  phone: string;                 // Phone number
  photoColor: string;            // Avatar background color (hex)
  status: 'active' | 'inactive'; // Employment status
  memberSince: string;           // Join date (formatted)
  reportsTo: string;             // Manager name
  reportsToId: string;           // Manager ID

  // Performance Metrics
  activeDeals: number;           // Current deal count
  pipeline: string;              // Pipeline value (formatted)
  pipelineValue: number;         // Pipeline value (numeric)
  winRate: number;               // Win rate percentage
  quota: string;                 // Quota target (formatted)
  quotaValue: number;            // Quota target (numeric)
  quotaAttainment: number;       // Quota percentage
  performanceLabel: string;      // Performance description

  // Activity Information
  lastActivityType: string;      // Type of last activity
  lastActivity: string;          // Relative time
  lastActivityDate: string;      // Full date/time
  activityStatus: string;        // Activity health

  // Coaching Status
  coachingStatus: {
    needsAttention: boolean;     // Manual flag
    last1on1: string;            // Last 1-on-1 date
    next1on1: string;            // Next 1-on-1 date
    performanceTrend: string;    // Trend description
  };
}
```

---

## 📝 FIELD FORMATTING RULES

### Currency Values

**Formatted (string):**
- Use dollar sign and commas: `$450,000`
- For millions: `$2.5M`
- For thousands: `$450K` (in summaries only)

**Numeric (number):**
- Pure number: `450000`
- Used for calculations only

### Dates

**memberSince:**
- Format: "Month Day, Year"
- Example: "Oct 1, 2024"

**last1on1 / next1on1:**
- Format: "Month Day, Year"
- Example: "Dec 8, 2024"

**lastActivityDate:**
- Format: "Month Day, Year at Hour:Minute AM/PM Timezone"
- Example: "Dec 13, 2024 at 2:00 PM PST"

### Relative Time (lastActivity)

**Format:** "[Number] [unit] ago"
- "2 hours ago"
- "5 hours ago"
- "1 day ago"
- "3 days ago"

### Performance Labels

Based on win rate:
- 90%+: "Outstanding"
- 75-89%: "Excellent"
- 70-74%: "Top performer"
- 65-69%: "Strong performer" or "Solid performer"
- 60-64%: "On track"
- 55-59%: "Developing"
- 50-54%: "Needs improvement"
- <50%: "Requires attention"

### Status Values

**Must be exactly:**
- `'active'` - Currently employed
- `'inactive'` - No longer employed

---

## 🧪 TEST SCENARIOS

### Scenario 1: All Green (Current)

**Setup:**
- Alex: 67% win rate, 104% quota
- Emily: 65% win rate, 108% quota

**Expected:**
- Alert Level: 🟢 GREEN
- Message: "None at this time - team performing well"
- Count: 0 members need attention

---

### Scenario 2: One Yellow

**Setup:**
- Alex: 67% win rate, 104% quota (green)
- Emily: 62% win rate, 85% quota (yellow)

**Expected:**
- Alert Level: 🟡 YELLOW
- Message: "Consider coaching intervention"
- Details: "1 member needs attention: Emily Davis"
- Count: 1

---

### Scenario 3: One Red

**Setup:**
- Alex: 67% win rate, 104% quota (green)
- Emily: 52% win rate, 75% quota (red)

**Expected:**
- Alert Level: 🔴 RED
- Message: "Urgent coaching needed"
- Details: "1 member requires urgent attention: Emily Davis"
- Count: 1

---

### Scenario 4: Mixed Yellow and Red

**Setup:**
- Alex: 60% win rate, 85% quota (yellow)
- Emily: 52% win rate, 75% quota (red)

**Expected:**
- Alert Level: 🔴 RED (worst case takes priority)
- Message: "Urgent coaching needed"
- Details: "1 member requires urgent attention: Emily Davis"
- Note: Alex also needs attention but red takes priority

---

## 💡 CALCULATION EXAMPLES

### Team Quota Attainment

```typescript
// Individual quotas
alexQuota = 432000
emilyQuota = 260000
totalQuota = 692000

// Individual pipelines
alexPipeline = 450000
emilyPipeline = 280000
totalPipeline = 730000

// Individual attainment
alexAttainment = (450000 / 432000) * 100 = 104.17% ≈ 104%
emilyAttainment = (280000 / 260000) * 100 = 107.69% ≈ 108%

// Team attainment
teamAttainment = (730000 / 692000) * 100 = 105.49% ≈ 106%

// Alternative calculation (average of individuals)
avgAttainment = (104 + 108) / 2 = 106%
```

### Pipeline Change

```typescript
lastMonth = 676000
currentMonth = 730000
change = currentMonth - lastMonth = 54000
percentage = (54000 / 676000) * 100 = 7.988% ≈ 8%

display = "+8%"
```

### Average Win Rate

```typescript
alexWinRate = 67
emilyWinRate = 65
avgWinRate = (67 + 65) / 2 = 66

display = "66%"
```

---

## 🎯 VISIBILITY RULES

### Show Direct Reports Section IF:

1. Member has role:
   - "Sales Manager" OR
   - "Sales Director" OR
   - "VP" OR
   - "CEO"

2. AND Member has:
   - `directReports` array exists
   - `directReports.length > 0`

### Hide Direct Reports Section IF:

1. Member has role:
   - "Sales Representative" OR
   - "Account Executive" OR
   - Any individual contributor role

2. OR Member has:
   - `directReports` array is null/undefined
   - `directReports.length === 0`

3. OR Viewing user:
   - Has role "Rep" (limited access)

---

## ✅ DATA VALIDATION

### Required Fields (Must Not Be Empty)

- id
- name
- initials
- role
- email
- phone
- status
- memberSince
- pipeline/pipelineValue
- quota/quotaValue
- winRate
- quotaAttainment
- lastActivity

### Optional Fields

- photoColor (defaults to blue if missing)
- reportsTo (for individual contributors)
- coachingStatus (entire object can be optional)

---

## 🔄 FUTURE ENHANCEMENTS

### Planned Fields

```typescript
interface DirectReportEnhanced extends DirectReport {
  // Additional metrics
  dealsClosedThisMonth: number;
  dealsClosedLastMonth: number;
  avgDealSize: number;
  avgDealCycle: number;

  // Activity metrics
  callsMade: number;
  emailsSent: number;
  meetingsHeld: number;

  // Performance trends
  winRateTrend: 'up' | 'down' | 'stable';
  pipelineTrend: 'up' | 'down' | 'stable';

  // Risk indicators
  atRiskDeals: number;
  overdueActivities: number;
}
```

---

## 📚 RELATED FILES

- Component: `/src/components/Team/DirectReportsSection.tsx`
- Page: `/src/pages/Team/TeamMemberDetailPage.tsx`
- Documentation: `SCREEN_9_2_DIRECT_REPORTS_IMPLEMENTATION.md`

---

**Document Version:** 2.0
**Last Updated:** December 26, 2024
**Status:** ✅ PRODUCTION DATA
