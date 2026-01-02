# Deal Form Mock Data - Complete Guide

**Date:** December 6, 2025
**Feature:** Comprehensive Mock Data for Deal Creation & Editing
**Build Status:** ✅ SUCCESS

---

## Overview

The Deal Add/Edit form now includes comprehensive mock data for demonstrating both **Edit Mode** (Acme Corp) and **Create Mode** with intelligent HRMS auto-detection (TechStart Inc).

---

## Mock Data Scenarios

### Scenario 1: Edit Mode - Acme Corp Deal

**Access Path:** `/crm/deals/1/edit` (or any deal ID)

**Pre-populated Data:**

```typescript
{
  dealName: 'Acme Corp - Enterprise Plan',
  dealValue: '50000',
  currency: 'USD',
  closeDate: '2026-03-15',
  stage: 'proposal',
  probability: 67,
  accountId: 'acc-1',
  accountName: 'Acme Corp',
  primaryContactId: 'con-2',
  primaryContactName: 'John Smith',
  contactRole: 'Champion',
  owner: 'current-user' (Alex Rodriguez),
  source: 'lead-gen-apollo',
  priority: 'High',
  tags: ['VIP', 'Enterprise', 'Hot Lead'],
  product: 'Enterprise Plan',
  contractTerm: 'Annual',
  paymentTerms: 'Net 30',
  description: 'Enterprise plan for 75-person SaaS company...',
  nextSteps: '1. Send proposal by Dec 10\n2. Schedule demo...'
}
```

**Associated Account:**
```typescript
{
  id: 'acc-1',
  name: 'Acme Corp',
  employees: '75 employees',
  industry: 'SaaS',
  revenue: '$12M revenue',
  primaryContact: 'John Smith (VP Sales)',
  avgDealSize: 50000,
  winRate: 68
}
```

**Associated Contact:**
```typescript
{
  id: 'con-2',
  name: 'John Smith',
  title: 'VP Sales',
  company: 'Acme Corp',
  email: 'john@acme.com',
  phone: '+1 555-0123'
}
```

**User Experience:**
1. Navigate to `/crm/deals/1/edit`
2. Page loads with title: "✏️ Edit Deal: Acme Corp - Enterprise Plan"
3. All fields pre-populated with existing data
4. Smart search panel hidden (account already linked)
5. Account and contact cards displayed
6. Toast notification: "Loaded deal: Acme Corp - Enterprise Plan"
7. Validation checklist shows 100% complete
8. Save button active and ready

---

### Scenario 2: Create Mode - TechStart Inc (HRMS Connection)

**Access Path:** `/crm/deals/add` or `/crm/deals/create`

**Step-by-Step Flow:**

#### Step 1: Smart Search Appears
- Page loads with "Add New Deal" title
- Smart Deal Creation panel visible
- Search box ready for input

#### Step 2: User Types "TechStart"
User enters "tech" or "techstart" in search box.

**Search Results Show:**
```
🏢 TechStart Inc (Account) [🏢 HRMS badge]
   60 employees | Technology | $8M revenue
   Contact: Sarah Lee (CFO)
   🏢 HRMS Connection

👤 Sarah Lee (Contact)
   CFO at TechStart Inc
   🏢 HRMS Connection
```

#### Step 3: User Selects TechStart Account

**Immediate Actions:**
1. Toast notification appears: "🏢 HRMS Connection detected! Win probability boosted by 7%"
2. Smart search panel closes
3. "Selected: TechStart Inc" panel appears

**AI Auto-populated Panel Displays:**

```
🤖 AI Auto-populated:                    [🏢 HRMS badge]

• Account: TechStart Inc
• Contact: Sarah Lee (CFO)
• Suggested Value: $40K - $45K (Based on company size & industry)
• Suggested Close Date: 45 days (Jan 20, 2026)
• Win Probability: 75% (+7% HRMS boost!)

[Green success box:]
🎉 Warm Intro Advantage Detected!
HRMS connection increases close rate by 33%

[Orange "Apply All Suggestions" button]
```

#### Step 4: Form Auto-Populated

**Fields Automatically Set:**
- **Account:** TechStart Inc
- **Source:** 🏢 HRMS (Recruitment) ← Auto-selected!
- **HRMS Connection:**
  - Recruited: Sarah Lee
  - Recruitment Date: Nov 14, 2024
- **Primary Contact:** Sarah Lee (CFO)

**HRMS Panel Appears:**
Orange gradient panel shows:
```
🏢 HRMS Connection Details

This deal came from HRMS recruitment:
Recruited: [Sarah Lee ▼]
Recruitment Date: [Nov 14, 2024] 📅

💡 Warm intro advantage!
Historical data: 33% higher close rate

[View HRMS Details]
```

#### Step 5: User Clicks "Apply All Suggestions"

**Additional Fields Populated:**
- **Deal Value:** $42,000 (midpoint of $40K-$45K range)
- **Close Date:** 45 days from today
- **Probability:** 75% (base 68% + 7% HRMS boost)

**Toast:** "AI suggestions applied successfully"

#### Step 6: User Completes Deal

**Remaining Required Fields:**
- Deal Name: User enters "TechStart Inc - Growth Package"
- Stage: Defaults to "Prospecting" (can change to "Qualified")
- Owner: Defaults to "Alex Rodriguez (You)"
- Priority: User sets to "High"
- Tags: User adds "HRMS", "Warm Intro", "Fast Track"

**Validation Checklist Shows:**
- ✅ All 8 required fields complete
- Data Quality: 100% (Excellent)
- Status: "Ready to save!"

#### Step 7: Deal Preview Shows

```
[TS] TechStart Inc - Growth Package

$42,000

🟢 Qualified (Stage 2 of 6)

Close: January 20, 2026
45 days away

🤖 75% Win Probability
[████████████████████████████░░░░]

👤 Sarah Lee (Champion)
Owner: Alex Rodriguez

[HRMS] [Warm Intro] [Fast Track]
```

---

## Mock Data Details

### Available Accounts

#### 1. Acme Corp (Standard)
```typescript
{
  id: 'acc-1',
  name: 'Acme Corp',
  employees: '75 employees',
  industry: 'SaaS',
  revenue: '$12M revenue',
  primaryContact: 'John Smith (VP Sales)',
  avgDealSize: 50000,
  winRate: 68,
  isHRMS: false
}
```
**Search Terms:** "acme", "corp", "acme corp"
**Use Case:** Standard B2B SaaS deal

#### 2. TechStart Inc (HRMS Connection)
```typescript
{
  id: 'acc-3',
  name: 'TechStart Inc',
  employees: '60 employees',
  industry: 'Technology',
  revenue: '$8M revenue',
  primaryContact: 'Sarah Lee (CFO)',
  avgDealSize: 42000,
  winRate: 68,
  isHRMS: true,
  recruitedPerson: 'Sarah Lee'
}
```
**Search Terms:** "tech", "techstart", "start"
**Use Case:** HRMS warm intro deal
**Special:** Auto-selects HRMS source, +7% win probability boost

#### 3. BigCo Enterprise (Large Deal)
```typescript
{
  id: 'acc-2',
  name: 'BigCo Enterprise',
  employees: '200 employees',
  industry: 'Manufacturing',
  contacts: 'Mike Chen +3 more',
  avgDealSize: 75000,
  winRate: 72,
  isHRMS: false
}
```
**Search Terms:** "big", "bigco", "enterprise"
**Use Case:** Large enterprise deal

### Available Contacts

#### 1. Sarah Lee (HRMS Connection)
```typescript
{
  id: 'con-1',
  name: 'Sarah Lee',
  title: 'CFO',
  company: 'TechStart Inc',
  source: 'HRMS Connection',
  isHRMS: true
}
```
**Search Terms:** "sarah", "lee", "techstart", "cfo"
**Special:** Shows HRMS badge, auto-selects HRMS source

#### 2. John Smith (Standard)
```typescript
{
  id: 'con-2',
  name: 'John Smith',
  title: 'VP Sales',
  company: 'Acme Corp',
  email: 'john@acme.com'
}
```
**Search Terms:** "john", "smith", "acme", "vp"
**Use Case:** Standard B2B contact

---

## HRMS Auto-Detection Logic

### Detection Triggers

**Account-Based Detection:**
```typescript
const isHRMS = account.isHRMS || account.name.toLowerCase().includes('techstart');
```

**Contact-Based Detection:**
```typescript
const isHRMS = contact.isHRMS || contact.source === 'HRMS Connection';
```

### When HRMS Detected

**1. Automatic Actions:**
- Source field set to "hrms"
- HRMS connection object created:
  ```typescript
  {
    recruited: 'Sarah Lee',
    recruitmentDate: '2024-11-14'
  }
  ```

**2. UI Changes:**
- Orange HRMS badge appears
- Toast notification with HRMS detection
- HRMS connection panel displays
- Win probability gets +7% boost
- AI suggestions panel shows orange gradient
- "Apply All" button becomes orange

**3. Win Probability Boost:**
```typescript
const baseWinRate = account.winRate || 68;  // 68%
const hrmsBoost = isHRMS ? 7 : 0;           // +7%
const finalProbability = 75%;                // = 68% + 7%
```

**4. Toast Messages:**
- Account selection: "🏢 HRMS Connection detected! Win probability boosted by 7%"
- Contact selection: "🏢 HRMS Connection detected! This is a warm intro opportunity"

---

## AI Suggestions Calculation

### Standard Account (Acme Corp)

**Input Data:**
- avgDealSize: $50,000
- winRate: 68%

**Generated Suggestions:**
```typescript
{
  dealValue: '50000',
  valueRange: '$45K - $55K',  // ±10%
  closeDate: '2026-03-15',    // +45 days
  closeDays: 45,
  probability: 68,             // Base win rate
  contact: 'John Smith (VP Sales)',
  isHRMS: false
}
```

### HRMS Account (TechStart Inc)

**Input Data:**
- avgDealSize: $42,000
- winRate: 68%
- isHRMS: true

**Generated Suggestions:**
```typescript
{
  dealValue: '42000',
  valueRange: '$40K - $45K',  // ±10%
  closeDate: '2026-01-20',    // +45 days
  closeDays: 45,
  probability: 75,             // 68% + 7% HRMS boost
  contact: 'Sarah Lee (CFO)',
  isHRMS: true                 // ← Triggers special UI
}
```

**Calculation Logic:**
```typescript
const baseWinRate = account.winRate || 68;
const hrmsBoost = isHRMS ? 7 : 0;
const probability = Math.min(baseWinRate + hrmsBoost, 100);
// Result: 68 + 7 = 75%
```

---

## Duplicate Detection

### Triggers
Duplicate check runs when:
- Account name contains "acme" (case-insensitive)
- Deal value equals "50000"

### Mock Duplicate
```typescript
{
  id: 'deal-123',
  name: 'Acme Corp - Enterprise',
  value: 50000,
  stage: 'Proposal',
  owner: 'Alex Rodriguez',
  createdDate: 'Nov 15, 2025'
}
```

### User Experience
When duplicate detected:
1. Orange warning panel appears at bottom of right sidebar
2. Shows existing deal details
3. Three action buttons:
   - **View Existing Deal** (opens in new tab)
   - **Merge** (shows merge modal)
   - **Save Anyway** (ignores warning)

---

## Testing Scenarios

### Test 1: Edit Existing Acme Corp Deal
```
Steps:
1. Navigate to /crm/deals/1/edit
2. Verify all fields pre-populated
3. Verify John Smith contact details shown
4. Verify validation checklist at 100%
5. Change deal value to $60,000
6. Click "Save Deal"
7. Verify success toast and navigation

Expected Result:
✅ Form loads with all Acme Corp data
✅ Can edit and save changes
✅ No HRMS indicators (standard deal)
```

### Test 2: Create TechStart Deal with HRMS
```
Steps:
1. Navigate to /crm/deals/add
2. Type "tech" in smart search
3. Click on "TechStart Inc (Account)"
4. Verify HRMS toast notification
5. Verify orange HRMS badge on AI panel
6. Verify win probability shows 75%
7. Click "Apply All Suggestions"
8. Verify source auto-set to HRMS
9. Verify orange HRMS panel appears
10. Complete deal name
11. Click "Save Deal"

Expected Result:
✅ HRMS detected automatically
✅ Win probability boosted to 75%
✅ Source set to HRMS (Recruitment)
✅ Warm intro message displayed
✅ Orange-themed UI elements
✅ 33% close rate boost mentioned
```

### Test 3: Search for Sarah Lee Contact
```
Steps:
1. Navigate to /crm/deals/add
2. Type "sarah" in smart search
3. Verify contact shows HRMS badge
4. Click on "Sarah Lee (Contact)"
5. Verify HRMS detection toast
6. Verify source set to HRMS

Expected Result:
✅ Contact shows HRMS indicator
✅ HRMS auto-detection works
✅ Source field auto-populated
```

### Test 4: Search by Company Name in Contacts
```
Steps:
1. Navigate to /crm/deals/add
2. Type "techstart" in smart search
3. Verify both account AND contact appear
4. Both should show HRMS badges

Expected Result:
✅ Account: TechStart Inc with HRMS badge
✅ Contact: Sarah Lee with HRMS badge
✅ Search works on contact's company name
```

### Test 5: Standard Deal (No HRMS)
```
Steps:
1. Navigate to /crm/deals/add
2. Type "bigco" in smart search
3. Click on "BigCo Enterprise"
4. Verify NO HRMS indicators
5. Verify win probability at 72% (no boost)
6. Verify purple theme (not orange)

Expected Result:
✅ No HRMS badges
✅ Standard purple AI panel
✅ No HRMS connection panel
✅ Win probability = base rate (72%)
```

### Test 6: Duplicate Detection
```
Steps:
1. Navigate to /crm/deals/add
2. Search and select "Acme Corp"
3. Set value to $50,000
4. Verify duplicate warning appears
5. Click "View Existing Deal"
6. Verify opens in new tab

Expected Result:
✅ Duplicate detected for Acme + $50K
✅ Warning panel shows at bottom right
✅ Existing deal details displayed
✅ All three action buttons work
```

---

## UI Indicators Summary

### HRMS Visual Indicators

**1. Search Results:**
- Orange building icon (accounts)
- Orange HRMS badge chip
- "🏢 HRMS Connection" text with briefcase icon

**2. AI Auto-populated Panel:**
- Orange-purple gradient background
- Orange HRMS badge in header
- "+7% HRMS boost!" in probability line
- Green success box: "Warm Intro Advantage"
- Orange "Apply All" button

**3. HRMS Connection Panel:**
- Orange gradient background (from-orange-50 to-orange-100)
- Orange border (border-orange-300)
- Recruited person dropdown
- Recruitment date picker
- Green success box: "33% higher close rate"
- Orange "View HRMS Details" button

**4. Form Source Field:**
- "🏢 HRMS (Recruitment)" option
- Auto-selected when HRMS detected
- Triggers panel expansion

### Color Coding

**Standard Deals:**
- 🔵 Blue: Account icons
- 🟣 Purple: AI features
- 🟢 Green: Contact icons
- ⚪ Gray: Secondary actions

**HRMS Deals:**
- 🟠 Orange: Primary HRMS indicators
- 🟣 Purple: AI features (with orange accents)
- 🟢 Green: Success/advantage messages
- 🟡 Amber: Warm intro highlights

---

## Data Flow Diagram

```
User Action          →  Detection  →  State Update  →  UI Update
────────────────────────────────────────────────────────────────
Search "TechStart"  →  Query match  →  Results array  →  HRMS badge
Click account       →  isHRMS check →  Auto-populate  →  Orange theme
                    →  Toast notify →  Source = HRMS  →  Panel shows
                    →  +7% boost   →  Probability↑   →  Green box
Apply suggestions   →  Copy values  →  Form fields   →  Preview update
Save deal           →  Validation   →  Submit data   →  Navigation
```

---

## Backend Integration Notes

### For Future Implementation

**1. Account Lookup:**
```typescript
// Check if account has HRMS recruitment history
const account = await db.accounts.findById(accountId);
const hrmsConnection = await db.hrms.findByAccount(accountId);

if (hrmsConnection) {
  account.isHRMS = true;
  account.recruitedPerson = hrmsConnection.contactName;
  account.recruitmentDate = hrmsConnection.date;
}
```

**2. Contact Lookup:**
```typescript
// Check if contact came from HRMS
const contact = await db.contacts.findById(contactId);
const hrmsRecord = await db.hrms.findByContact(contactId);

if (hrmsRecord) {
  contact.isHRMS = true;
  contact.source = 'HRMS Connection';
}
```

**3. Win Probability Calculation:**
```typescript
// Server-side probability calculation
const baseProbability = calculateBaseProbability(deal);
const hrmsBoost = deal.source === 'hrms' ? 7 : 0;
const finalProbability = Math.min(baseProbability + hrmsBoost, 100);

// Log for analytics
logDealProbability(dealId, {
  base: baseProbability,
  hrmsBoost,
  final: finalProbability,
  factors: calculationFactors
});
```

**4. HRMS Attribution Tracking:**
```typescript
// Track HRMS-sourced deals
if (deal.source === 'hrms') {
  await db.analytics.trackHRMSDeal({
    dealId,
    recruitedPerson: deal.hrmsConnection.recruited,
    recruitmentDate: deal.hrmsConnection.recruitmentDate,
    expectedCloseRate: 1.33, // 33% boost
    probability: deal.probability
  });
}
```

---

## Analytics & Reporting

### Metrics to Track

**HRMS Deal Performance:**
- Number of deals from HRMS
- Average deal value (HRMS vs non-HRMS)
- Win rate (HRMS vs non-HRMS)
- Average sales cycle (days)
- Close rate improvement (expected 33%)

**Sample Report:**
```
HRMS-Sourced Deals Performance (Q4 2025)
──────────────────────────────────────────
Total HRMS Deals:     23
Avg Deal Value:       $47,800
Win Rate:             81% (vs 61% standard)
Improvement:          +20% (vs 33% expected)
Avg Cycle:            38 days (vs 45 days)
Revenue Generated:    $890,000
```

---

## Troubleshooting

### Issue: HRMS Not Detected

**Symptoms:**
- TechStart shows no HRMS badge
- No HRMS toast notification
- Win probability not boosted

**Checks:**
1. Verify account data: `account.isHRMS === true`
2. Verify detection logic: Check `handleAccountSelect` function
3. Check console for errors
4. Verify `aiSuggestions.isHRMS` is set

**Fix:**
- Ensure account object has `isHRMS: true` property
- Ensure detection logic runs on selection

### Issue: Duplicate Detection Not Working

**Symptoms:**
- Creating duplicate Acme Corp deal
- No warning panel appears

**Checks:**
1. Verify account name includes "acme"
2. Verify deal value equals "50000" (string)
3. Check `checkForDuplicates` function runs

**Fix:**
- Check useEffect dependency array includes both fields
- Verify case-insensitive comparison

### Issue: Edit Mode Not Loading Data

**Symptoms:**
- Form blank in edit mode
- No pre-populated fields

**Checks:**
1. Verify URL has deal ID: `/crm/deals/:id/edit`
2. Check `isEditMode` boolean is true
3. Check `loadDealData` function runs
4. Verify useEffect dependencies

**Fix:**
- Ensure `useParams()` extracts ID correctly
- Check useEffect runs on mount: `[id, isEditMode]`

---

## Configuration

### Adding New Mock Accounts

```typescript
// In SmartSearchPanel.tsx
const newAccount = {
  id: 'acc-4',
  type: 'account',
  name: 'New Company Inc',
  employees: '100 employees',
  industry: 'Software',
  revenue: '$15M revenue',
  primaryContact: 'Jane Doe (CEO)',
  avgDealSize: 60000,
  winRate: 70,
  isHRMS: false  // Set true for HRMS connection
};
```

### Adjusting HRMS Boost

```typescript
// In ComprehensiveDealFormPage.tsx
// Current: +7% boost
const hrmsBoost = isHRMS ? 7 : 0;

// To change boost amount:
const hrmsBoost = isHRMS ? 10 : 0;  // +10% boost
```

### Customizing Close Rate Message

```typescript
// In TipsHelpPanel.tsx or AI panels
// Current: "33% higher close rate"

// Change to:
"40% higher close rate"
"2x close rate"
"Significantly higher success rate"
```

---

## Build Status

```bash
$ npm run build
✓ 1727 modules transformed
✓ built in 12.15s

dist/index.html                     0.45 kB │ gzip:   0.29 kB
dist/assets/index-D_1RuV2k.css     88.56 kB │ gzip:  12.79 kB
dist/assets/index-F0myomEd.js   2,528.97 kB │ gzip: 486.82 kB
```

**Status:** ✅ SUCCESS

---

## Conclusion

The Deal Form now includes comprehensive mock data demonstrating:

✅ **Edit Mode**: Pre-filled Acme Corp deal with complete data
✅ **HRMS Detection**: Auto-detects TechStart Inc HRMS connection
✅ **Win Probability Boost**: +7% for HRMS deals (75% vs 68%)
✅ **Smart Search**: Searches accounts and contacts by multiple fields
✅ **Visual Indicators**: Orange HRMS badges and themed panels
✅ **Duplicate Detection**: Warns when similar deal exists
✅ **AI Suggestions**: Context-aware recommendations with HRMS boost
✅ **Toast Notifications**: Immediate feedback on HRMS detection
✅ **Form Auto-Population**: Source and connection details auto-filled

The mock data provides a complete demonstration of the unique HRMS integration feature and standard deal workflows.

---

**Documentation Completed:** December 6, 2025
**Developer:** AI Agent
**Status:** ✅ READY FOR DEMO
