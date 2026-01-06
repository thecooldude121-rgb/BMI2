# John Smith Enrichment - Mock Data Guide

## Overview
Complete mock data structure for John Smith's lead enrichment workflow, from initial "not enriched" state through completion.

---

## Data Files

### Primary File
**Location:** `src/utils/johnSmithEnrichmentData.ts`

**Exports:**
1. `johnSmithLead` - Base lead information
2. `johnSmithEnrichmentData` - Enrichment state data
3. `johnSmithEnrichedFields` - Complete enriched field results (15 fields)
4. `johnSmithEnrichmentHistory` - Post-enrichment history entry

---

## 1. Base Lead Data (`johnSmithLead`)

```typescript
{
  id: "lead_002",
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@acme.com",
  phone: "+1 (555) 123-4567",
  title: "VP Sales",
  company: "Acme Corp",
  website: "acme.com",
  industry: "Technology",
  companySize: "200-500",
  source: "apollo",
  aiScore: 78,
  status: "new",
  enrichmentStatus: "not_enriched",
  lastEnriched: null,
  tags: ["Enterprise", "High Priority"],
  notes: "Reached out via LinkedIn last week"
}
```

**Key Fields:**
- **enrichmentStatus:** `"not_enriched"` (will change to `"enriching"` then `"enriched"`)
- **lastEnriched:** `null` (no enrichment yet)
- **aiScore:** 78/100 (7.8 dots filled out of 10)

---

## 2. Enrichment State Data (`johnSmithEnrichmentData`)

### Hero Card Information
```typescript
{
  leadId: 'lead_002',
  firstName: 'John',
  lastName: 'Smith',
  leadTitle: 'VP Sales',
  leadCompany: 'Acme Corp',
  score: 78,
  source: 'Apollo',
  status: 'enriching',
  startedAt: 'Just now'
}
```

### Data Sources Configuration

#### Apollo.io (Source 1 - Starts Immediately)
```typescript
{
  id: 'apollo',
  name: 'Apollo.io',
  icon: '🎯',
  status: 'fetching',          // Active from start
  progress: 45,                // Starting progress
  estimatedTime: '2s',
  lastSync: null,              // No previous sync
  fieldsEnriched: 0,           // Will update to 9
  confidence: null,            // Will update to 92%
  responseTime: null           // Will update to 1.8s
}
```

**Animation Path:**
- Initial: 45% progress
- Increments: +3% every 150ms
- Completion: ~2 seconds
- Final State: 100%, status → 'success'

#### ZoomInfo (Source 2 - Starts After Apollo)
```typescript
{
  id: 'zoominfo',
  name: 'ZoomInfo',
  icon: '🎯',
  status: 'queued',            // Waiting initially
  progress: 0,                 // Not started
  estimatedTime: '3s',
  lastSync: null,
  fieldsEnriched: 0,           // Will update to 6
  confidence: null,            // Will update to 89%
  responseTime: null           // Will update to 2.1s
}
```

**Animation Path:**
- Initial: Queued/Waiting
- Trigger: When overall progress > 60%
- Starts: Progress jumps to 5%
- Increments: +3% every 150ms
- Completion: ~2 seconds after start
- Final State: 100%, status → 'success'

---

## 3. Enriched Fields Data (`johnSmithEnrichedFields`)

**Total Fields: 15**
- Contact Info: 4 fields
- Company Info: 6 fields
- Professional Details: 5 fields

### Contact Info (4 Fields)

#### 1. Email (Confirmed)
```typescript
{
  id: "email",
  label: "Email",
  icon: "📧",
  before: "john.smith@acme.com",
  after: "john.smith@acme.com",    // Same - confirmed correct
  source: "apollo",
  confidence: 100,
  enrichedAt: "2025-01-06T12:45:00Z",
  status: "confirmed"                // No change, just verified
}
```

#### 2. Direct Phone (Updated)
```typescript
{
  id: "direct_phone",
  label: "Direct Phone",
  icon: "📱",
  before: "+1 (555) 123-4567",
  after: "+1 (415) 555-0198",        // Updated to correct number
  source: "apollo",
  confidence: 92,
  enrichedAt: "2025-01-06T12:45:00Z",
  status: "updated"                   // Changed from before
}
```

#### 3. LinkedIn Profile (Added)
```typescript
{
  id: "linkedin",
  label: "LinkedIn Profile",
  icon: "💼",
  before: null,                       // Didn't exist
  after: "linkedin.com/in/johnsmith-vpsales",
  source: "zoominfo",
  confidence: 95,
  enrichedAt: "2025-01-06T12:45:00Z",
  status: "added"                     // Newly discovered
}
```

#### 4. Mobile Phone (Added)
```typescript
{
  id: "mobile_phone",
  label: "Mobile Phone",
  icon: "📱",
  before: null,
  after: "+1 (415) 555-0299",
  source: "apollo",
  confidence: 88,
  enrichedAt: "2025-01-06T12:45:00Z",
  status: "added"
}
```

---

### Company Info (6 Fields)

#### 1. Company Size (Updated)
```typescript
{
  id: "company_size",
  label: "Company Size",
  icon: "🏢",
  before: "200-500",                  // Range
  after: "350 employees",             // Exact number
  source: "apollo",
  confidence: 96,
  status: "updated"
}
```

#### 2. Annual Revenue (Added)
```typescript
{
  id: "annual_revenue",
  label: "Annual Revenue",
  icon: "💰",
  before: null,
  after: "$45M - $50M",
  source: "zoominfo",
  confidence: 85,
  status: "added"
}
```

#### 3. Industry (Updated)
```typescript
{
  id: "industry",
  label: "Industry",
  icon: "🏭",
  before: "Technology",               // Generic
  after: "Enterprise Software - CRM Solutions",  // Specific
  source: "apollo",
  confidence: 98,
  status: "updated"
}
```

#### 4. Founded Year (Added)
```typescript
{
  id: "founded_year",
  label: "Founded Year",
  icon: "📅",
  before: null,
  after: "2015",
  source: "apollo",
  confidence: 100,
  status: "added"
}
```

#### 5. Total Funding (Added)
```typescript
{
  id: "total_funding",
  label: "Total Funding",
  icon: "💵",
  before: null,
  after: "$35M (Series B)",
  source: "zoominfo",
  confidence: 93,
  status: "added"
}
```

#### 6. Company Website (Updated)
```typescript
{
  id: "company_website",
  label: "Company Website",
  icon: "🌐",
  before: "acme.com",
  after: "https://www.acme.com",      // Full URL format
  source: "apollo",
  confidence: 100,
  status: "updated"
}
```

---

### Professional Details (5 Fields)

#### 1. Job Title (Updated)
```typescript
{
  id: "job_title",
  label: "Job Title",
  icon: "💼",
  before: "VP Sales",
  after: "Vice President of Sales",   // Full title
  source: "apollo",
  confidence: 100,
  status: "updated"
}
```

#### 2. Seniority Level (Added)
```typescript
{
  id: "seniority_level",
  label: "Seniority Level",
  icon: "📊",
  before: null,
  after: "VP-Level",
  source: "zoominfo",
  confidence: 98,
  status: "added"
}
```

#### 3. Department (Added)
```typescript
{
  id: "department",
  label: "Department",
  icon: "🏢",
  before: null,
  after: "Sales & Business Development",
  source: "apollo",
  confidence: 96,
  status: "added"
}
```

#### 4. Years in Role (Added)
```typescript
{
  id: "years_in_role",
  label: "Years in Role",
  icon: "📅",
  before: null,
  after: "3.2 years",
  source: "zoominfo",
  confidence: 89,
  status: "added"
}
```

#### 5. Education (Added)
```typescript
{
  id: "education",
  label: "Education",
  icon: "🎓",
  before: null,
  after: "MBA - Harvard Business School, BS Marketing - UCLA",
  source: "apollo",
  confidence: 94,
  status: "added"
}
```

---

## 4. Enrichment History (`johnSmithEnrichmentHistory`)

**After first enrichment completes:**

```typescript
[
  {
    id: "enrich_001",
    timestamp: "2025-01-06T12:45:00Z",
    status: "success",
    fieldsEnriched: 15,
    sources: [
      { name: "Apollo.io", fields: 9 },
      { name: "ZoomInfo", fields: 6 }
    ],
    duration: "4.8s",
    triggeredBy: "auto",
    triggeredByUser: null
  }
]
```

**Field Breakdown by Source:**
- **Apollo.io (9 fields):**
  - Email (confirmed)
  - Direct Phone (updated)
  - Mobile Phone (added)
  - Company Size (updated)
  - Industry (updated)
  - Founded Year (added)
  - Company Website (updated)
  - Job Title (updated)
  - Department (added)
  - Education (added)

- **ZoomInfo (6 fields):**
  - LinkedIn Profile (added)
  - Annual Revenue (added)
  - Total Funding (added)
  - Seniority Level (added)
  - Years in Role (added)

---

## Field Status Types

### 1. Confirmed (✓)
- **Meaning:** Existing data verified as correct
- **Badge:** Green checkmark
- **Example:** Email remains the same
- **Count:** 1 field

### 2. Updated (↻)
- **Meaning:** Existing data refined or corrected
- **Badge:** Blue refresh icon
- **Example:** Phone number corrected, Industry made more specific
- **Count:** 5 fields

### 3. Added (★)
- **Meaning:** Brand new data discovered
- **Badge:** Yellow star
- **Example:** LinkedIn profile, Education, Funding info
- **Count:** 9 fields

---

## Confidence Scores

**Distribution:**
- **100% (Perfect):** 4 fields (Email, Job Title, Founded Year, Website)
- **95-99% (Excellent):** 4 fields (Industry, Seniority, Company Size, LinkedIn)
- **90-94% (Very Good):** 4 fields (Direct Phone, Total Funding, Education, Department)
- **85-89% (Good):** 3 fields (Annual Revenue, Mobile Phone, Years in Role)

**Average Confidence:** 94.5%

---

## Data Source Contribution

### Apollo.io
- **Fields:** 9 out of 15 (60%)
- **Categories:** Contact (3), Company (4), Professional (2)
- **Average Confidence:** 96.3%
- **Specialties:** Contact details, Company basics, Job info

### ZoomInfo
- **Fields:** 6 out of 15 (40%)
- **Categories:** Contact (1), Company (2), Professional (3)
- **Average Confidence:** 91.7%
- **Specialties:** Professional details, Company financials, Career info

---

## Timeline & Animation

### Phase 1: Initial Load (0s)
```
Apollo: 45% (fetching)
ZoomInfo: 0% (queued)
Overall: 45%
```

### Phase 2: Apollo Fetches (0-2s)
```
Apollo: 45% → 100% (success)
ZoomInfo: 0% (queued)
Overall: 45% → 65%
```

### Phase 3: ZoomInfo Starts (2s)
```
Apollo: 100% (success)
ZoomInfo: 5% (fetching)
Overall: 65%
```

### Phase 4: ZoomInfo Fetches (2-4s)
```
Apollo: 100% (success)
ZoomInfo: 5% → 100% (success)
Overall: 65% → 100%
```

### Phase 5: Completion (4.8s)
```
Success Toast: "✅ Successfully enriched John Smith's data"
Auto-redirect: After 1.5s
Total Time: ~6 seconds
```

---

## Usage in Components

### JohnSmithEnrichmentPage.tsx
**Imports:**
```typescript
import {
  johnSmithEnrichmentData,
  type JohnSmithDataSource
} from '../../utils/johnSmithEnrichmentData';
```

**State Management:**
```typescript
const data = johnSmithEnrichmentData;
const [dataSources, setDataSources] = useState(data.dataSources);
const [enrichProgress, setEnrichProgress] = useState(45);
```

**Animation Logic:**
- Interval: 150ms
- Progress increment: +2% (overall), +3% (per source)
- State transitions: queued → fetching → success

---

## After Enrichment Redirect

**Destination:** `/lead-generation/leads/lead_002/enrichment`
- Same route, but now shows Sarah Lee style page
- All 15 fields displayed in cards
- History shows 1 entry
- Re-enrich button active
- Configure Fields button visible

---

## Testing the Mock Data

### Visual Verification
1. **Check Hero Card:**
   - Name: John Smith
   - Title: VP Sales @ Acme Corp
   - Score: 78/100 (7.8 dots)
   - Source: Apollo

2. **Watch Data Sources:**
   - Apollo starts at 45%
   - ZoomInfo shows "Queued"
   - Progress bars animate smoothly
   - Both complete with green checkmarks

3. **Monitor Overall Progress:**
   - Starts at 45%
   - Increments every 150ms
   - Reaches 100% in ~4.8s
   - Success toast appears

4. **Verify Empty States:**
   - Enriched Fields: "0 fields - Loading..."
   - History: "No enrichment history yet"

### After Completion
1. **Check All 15 Fields Display**
2. **Verify Source Attribution** (9 Apollo, 6 ZoomInfo)
3. **Confirm Confidence Scores** (85-100%)
4. **Review Status Badges** (1 confirmed, 5 updated, 9 added)
5. **Check History Entry** (1 success entry, 4.8s duration)

---

## Build Status
✅ Mock data structure complete
✅ All 15 fields defined
✅ Source attribution accurate
✅ Confidence scores realistic
✅ Status types properly distributed
✅ TypeScript types exported
✅ Build successful
