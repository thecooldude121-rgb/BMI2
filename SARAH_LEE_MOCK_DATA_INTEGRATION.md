# Sarah Lee Mock Data Integration

## Overview

Sarah Lee is a comprehensive mock lead with HRMS connection, representing a warm lead from TechStart Inc. This document explains where Sarah Lee's data is integrated across the CRM module.

## Lead Information

- **Name**: Sarah Lee
- **Title**: CFO
- **Company**: TechStart Inc
- **Industry**: FinTech
- **Source**: HRMS (Recruited Nov 2024)
- **Lead Score**: 92/100 (Top 5%, Excellent)
- **Conversion Probability**: 67% (High)
- **Email**: sarah@techstart.com
- **Phone**: +1 555-0456
- **LinkedIn**: linkedin.com/in/sarahlee-cfo

## Mock Data Locations

### 1. **Primary Lead Data** - `src/utils/sampleData.ts`
- **ID**: `1`
- **Location**: `leads` array (first entry)
- **Contains**: Basic lead information, score, value, stage, tags, notes

```typescript
{
  id: '1',
  name: 'Sarah Lee',
  company: 'TechStart Inc',
  position: 'CFO',
  score: 92,
  source: 'HRMS',
  value: 42000,
  probability: 67,
  status: 'active',
  industry: 'FinTech',
  tags: ['hrms-warm-lead', 'decision-maker', 'high-priority', 'hot']
}
```

### 2. **Contact Data** - `src/utils/sampleContacts.ts`
- **ID**: `2`
- **Contains**: Contact information, active deal, AI score, enrichment data, HRMS bonus

```typescript
{
  id: '2',
  name: 'Sarah Lee',
  company: 'TechStart Inc',
  position: 'CFO',
  source: 'hrms',
  aiScore: 92,
  conversionProbability: 67,
  hrmsBonus: true,
  enrichmentData: {
    companySize: '45 employees',
    companyRevenue: '$8M',
    recentFunding: '$10M Series A'
  }
}
```

### 3. **Detailed Lead Data** - `src/utils/sarahLeeMockData.ts`
- **NEW FILE**: Comprehensive mock data for Sarah Lee
- **Contains**: Full lead detail information including:
  - Lead information
  - AI Lead Score breakdown (fit, engagement, intent, HRMS bonus)
  - Enrichment data (company details, tech stack, recent news)
  - Decision makers (Sarah Lee, Robert Chen, Michael Zhang)
  - HRMS connection details
  - Intelligence signals (funding, hiring, expansion)
  - Activity timeline
  - Notes
  - AI recommendations
  - Similar leads

**Usage**:
```typescript
import { sarahLeeMockData } from '@/utils/sarahLeeMockData';

// Access comprehensive lead data
const leadDetail = sarahLeeMockData.leadInfo;
const aiScore = sarahLeeMockData.aiLeadScore;
const hrmsConnection = sarahLeeMockData.hrmsConnection;
```

### 4. **Lead Discovery Data** - `src/utils/leadDiscoveryMockData.ts`
- **Location**: `recentLeads` array (first entry)
- **ID**: `1`
- **Contains**: Recent lead summary for dashboard

Also includes related company signals:
- **Funding Signal**: TechStart Inc raised $10M Series A (ID: `1`)
- **HRMS Event**: Sarah Lee recruited from TechStart Inc (ID: `4`)
- **Hiring Signal**: TechStart hired VP of Sales (ID: `6`)
- **Expansion Signal**: TechStart expanding to NYC office (ID: `7`)

### 5. **Account Data** - `src/utils/sampleAccountsData.ts`
- **Account ID**: `acc_002`
- **Account Number**: `ACC-002`
- **Contains**: TechStart Inc company information with HRMS connection

```typescript
{
  id: 'acc_002',
  name: 'TechStart Inc',
  industry: 'FinTech',
  employeeCount: 45,
  annualRevenue: 8000000,
  source: 'hrms',
  hrmsConnection: {
    hasConnection: true,
    recruitedEmployees: 1,
    recruitedContacts: [
      { name: 'Sarah Lee', position: 'CFO', dateRecruited: '2024-11-15' }
    ]
  },
  relatedContacts: [
    { id: 'c3', name: 'Sarah Lee', role: 'CFO', email: 'sarah@techstart.com' },
    { id: 'c4', name: 'Mike Chen', role: 'CTO' },
    { id: 'c5', name: 'Lisa Wang', role: 'VP Ops' }
  ],
  relatedDeals: [
    { id: 'd2', name: 'TechStart - Growth', amount: 42000, stage: 'Negotiation' },
    { id: 'd3', name: 'TechStart - Add-on', amount: 18000, stage: 'Proposal' }
  ]
}
```

### 6. **TechStart Company Data** - `src/utils/techstartMockData.ts`
- **Contains**: Comprehensive TechStart Inc account information
- **Includes**:
  - Account details
  - HRMS intelligence
  - Metrics
  - Deals
  - Contacts
  - Activities
  - AI insights
  - Similar accounts

## AI Lead Score Breakdown

### Overall Score: 92/100 (Top 5%, Excellent)

1. **Fit Score**: 90/100
   - Company size matches ICP
   - Industry = FinTech (target vertical)

2. **Engagement Score**: 85/100
   - No engagement yet, but high potential
   - HRMS warm connection provides advantage

3. **Intent Score**: 88/100
   - Recent funding $10M Series A
   - Hiring signals (VP Sales hire)
   - Expansion plans (NYC office)

4. **HRMS Bonus**: +33%
   - Base Score: 69/100
   - Bonus Points: +23
   - Final Score: 92/100

### Conversion Probability: 67% (High)

### Why This Score:
- ✅ HRMS warm lead
- ✅ Recent funding $10M
- ✅ Decision maker (CFO)
- ✅ Company growth signals
- ⚠️ No engagement yet (never contacted)

## Enrichment Data

### Company Information
- **Revenue**: $8M (Source: Apollo.io)
- **Employees**: 45
- **Founded**: 2019
- **Headquarters**: San Francisco, CA

### Tech Stack
- AWS (Cloud Infrastructure)
- Salesforce (CRM) - Opportunity!
- Slack (Team Collaboration)
- Stripe (Payment Processing)

### Recent News
1. Raised $10M Series A (Nov 2024)
2. Hired VP of Sales (Oct 2024)
3. Expanding to NYC office (Nov 2024)

## Decision Makers

### 1. Sarah Lee (This Lead)
- **Title**: CFO
- **Role**: Decision Maker
- **Email**: sarah@techstart.com
- **LinkedIn**: Available

### 2. Robert Chen
- **Title**: CEO, Co-Founder
- **Email**: robert@techstart.com
- **LinkedIn**: Available
- **Action**: Can create separate lead

### 3. Michael Zhang
- **Title**: CTO, Co-Founder
- **Email**: michael@techstart.com
- **LinkedIn**: Available
- **Action**: Can create separate lead

## HRMS Connection

### Details
- **Recruited**: Nov 2024
- **Recruiter**: Jane Smith (HRMS team)
- **Placement Fee**: $15,000

### Warm Lead Advantages
- Existing relationship through recruitment
- +33% score bonus applied
- 2x higher close rate vs traditional leads
- Faster sales cycle (avg 3 weeks vs 7 weeks)

## Intelligence Signals

### Primary Signal: 💰 Funding
- **Event**: Raised $10M Series A
- **Date**: Nov 12, 2024
- **Source**: Crunchbase
- **Lead**: Sequoia Capital
- **Participants**: Andreessen Horowitz, Y Combinator

### AI Analysis
- High buying intent (budget confirmed)
- Growth mode active (scaling team)
- Sales team expansion (3 sales jobs posted)

### Related Signals
- Hired VP of Sales (Oct 2024)
- Posted 3 sales engineer jobs (Nov 2024)
- Expanding to NYC office (Nov 2024)

## Activity Timeline

### Nov 15, 2024 - Just now
- **Action**: Lead created from HRMS event
- **Source**: HRMS recruitment
- **Auto-assigned to**: Sarah C.
- **Initial score**: 92/100
- **By**: System (Auto)

### Nov 15, 2024 - 10 minutes ago
- **Action**: Lead enriched automatically
- **Sources**: Apollo.io (+12 data points), ZoomInfo, Clearbit
- **By**: System (Auto-enrichment)

### Nov 15, 2024 - 5 minutes ago
- **Action**: Note added by Sarah C.
- **Content**: "High priority HRMS lead - Contact ASAP"
- **By**: Sarah C.

## AI Recommendations

1. ⚡ **Contact within 48h** (High intent window)
2. 💬 **Mention HRMS connection** (Warm intro advantage)
3. 📧 **Add to "HRMS Warm Lead" email sequence**
4. ✅ **Complete BANT qualification**

## Similar Leads

1. **Emma Wilson** - InnovateLabs
   - Source: HRMS
   - Score: 94/100
   - Industry: HealthTech

2. **Alex Johnson** - DataVerse
   - Source: HRMS
   - Score: 90/100
   - Industry: Data Platform

3. **Robert Chang** - DataFlow Inc
   - Source: Intelligence
   - Score: 85/100
   - Industry: Data Analytics

## Integration Points

### CRM Module Integration

1. **Leads Page** (`src/pages/CRM/LeadsPage.tsx`)
   - Sarah Lee appears in leads list
   - Shows score: 92/100
   - HRMS badge displayed

2. **Lead Detail Page** (`src/pages/CRM/LeadDetailPage.tsx`)
   - Use `sarahLeeMockData` for comprehensive view
   - Display AI score breakdown
   - Show HRMS connection badge
   - Intelligence signals section
   - Activity timeline

3. **Lead Generation Dashboard** (`src/pages/LeadGeneration/LeadGenerationDashboard.tsx`)
   - Sarah Lee in "Recent Leads" section
   - TechStart signals in "Company Signals"

4. **Accounts Page** (`src/pages/Accounts/AccountsListView.tsx`)
   - TechStart Inc with HRMS connection badge
   - Shows Sarah Lee as primary contact

5. **Account Detail View** (`src/pages/Accounts/EnhancedAccountDetailView.tsx`)
   - Use `techstartMockData` for comprehensive account view
   - Display HRMS intelligence panel
   - Show recruited employees section

## Usage Examples

### Display Lead Detail
```typescript
import { sarahLeeMockData } from '@/utils/sarahLeeMockData';

function LeadDetailPage() {
  const lead = sarahLeeMockData;

  return (
    <div>
      <h1>{lead.leadInfo.fullName}</h1>
      <div>Score: {lead.aiLeadScore.overallScore}/100</div>
      <div>Company: {lead.leadInfo.company}</div>
      {lead.hrmsConnection && (
        <Badge>HRMS Warm Lead</Badge>
      )}
    </div>
  );
}
```

### Access Company Intelligence
```typescript
import { techstartMockData } from '@/utils/techstartMockData';

const hrmsIntel = techstartMockData.hrms_intelligence;
const recruitedEmployees = hrmsIntel.recruited_employees; // Sarah Lee
const strategicAdvantage = hrmsIntel.strategic_advantage_metrics;
```

### Get Recent Signals
```typescript
import { companySignals } from '@/utils/leadDiscoveryMockData';

// Filter TechStart signals
const techstartSignals = companySignals.filter(
  signal => signal.company === 'TechStart Inc'
);
// Returns: Funding, HRMS event, Hiring, Expansion
```

## Type Definitions

All type definitions are available in:
- `src/types/lead.ts` - Lead types
- `src/types/contact.ts` - Contact types (updated with new fields)
- `src/types/accounts.ts` - Account types
- `src/utils/sarahLeeMockData.ts` - LeadDetailData interface

## Testing

Use Sarah Lee mock data to test:
- ✅ HRMS lead creation flow
- ✅ Lead scoring with HRMS bonus
- ✅ Enrichment data display
- ✅ Intelligence signals
- ✅ Warm lead workflows
- ✅ Account-lead relationships
- ✅ Decision maker identification
- ✅ AI recommendations

## Summary

Sarah Lee is now fully integrated across the CRM module with:
- ✅ Complete lead profile with HRMS connection
- ✅ AI lead score breakdown (92/100 with +33% HRMS bonus)
- ✅ Company enrichment data (TechStart Inc)
- ✅ Intelligence signals (funding, hiring, expansion)
- ✅ Activity timeline
- ✅ Decision makers
- ✅ Similar leads
- ✅ Account integration
- ✅ Mock data synced across all modules

All data is consistent and ready for testing and demonstration purposes.
