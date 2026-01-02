# Quick Test Guide: All 6 Document Filtering Scenarios
**Fast verification guide for all scenarios**

---

## Quick Access Demo Page

**Navigate to:** `/crm/documents/context-demo`

This page provides clickable buttons to test all 6 scenarios instantly.

---

## Scenario Quick Tests

### ✅ Scenario 1: Deal → Documents
**Test URL:**
```
/crm/documents?deal_id=deal_acme_001&deal_name=Acme%20Corp%20-%20Enterprise%20Plan
```

**Expected Results:**
- ✅ Banner shows "Deal: Acme Corp - Enterprise Plan"
- ✅ Briefcase icon displayed
- ✅ 6 documents shown
- ✅ "Deals" filter auto-checked
- ✅ Documents: Proposal, Discount Form, Recording, RFP, 2 Transcripts

**Quick Verify:** All documents should have `deal_id: "deal_acme_001"`

---

### ✅ Scenario 2: Account → Documents
**Test URL:**
```
/crm/documents?account_id=account_techstart&account_name=TechStart%20Inc&hrms_connected=true
```

**Expected Results:**
- ✅ Banner shows "Account: TechStart Inc"
- ✅ Building2 icon displayed
- ✅ Blue "HRMS Connected" badge visible
- ✅ 11 documents shown
- ✅ "Accounts" filter auto-checked
- ✅ Documents: Contract, HRMS Placement, Proposals, Case Study, etc.

**Quick Verify:** All documents should have `account_id: "account_techstart"`

**Special Check:** Look for HRMS badge in top-right of banner

---

### ✅ Scenario 3: Contact → Documents
**Test URL:**
```
/crm/documents?contact_id=contact_sarah_lee&contact_name=Sarah%20Lee&title=CFO&account_name=TechStart%20Inc&hrms_connected=true
```

**Expected Results:**
- ✅ Banner shows "Contact: Sarah Lee, CFO at TechStart Inc"
- ✅ UserCheck icon displayed
- ✅ Blue "HRMS Connected" badge visible
- ✅ 10 documents shown
- ✅ "Contacts" filter auto-checked
- ✅ Documents: HRMS Placement, Contract, Email Thread, NDA, Resume, etc.

**Quick Verify:** All documents should have `contact_id: "contact_sarah_lee"`

**Special Check:** Look for rich context (CFO, TechStart Inc) and HRMS badge

---

### ✅ Scenario 4: Activity → Documents
**Test URL:**
```
/crm/documents?activity_id=act_techstart_001&activity_name=TechStart%20Discovery%20Call&activity_type=Meeting
```

**Expected Results:**
- ✅ Banner shows "Activity: TechStart Discovery Call (Meeting)"
- ✅ Calendar icon displayed
- ✅ 2 documents shown
- ✅ "Activities" filter auto-checked
- ✅ Documents: Meeting Agenda, Discovery Call Recording

**Quick Verify:** All documents should have `activity_id: "act_techstart_001"`

**Special Check:** Activity type "(Meeting)" should be shown in parentheses

---

### ✅ Scenario 5: Email Attachments
**Test URL:**
```
/crm/documents?category=Email%20Attachments
```

**Expected Results:**
- ✅ Banner shows "Email Attachments"
- ✅ FolderOpen icon displayed
- ✅ 9 documents shown
- ✅ "Email Attachments" category selected
- ✅ Documents: Technical Requirements, RFP, Questions, Insurance Cert, Security Questionnaire, etc.

**Quick Verify:** All documents should have `category: "Email Attachments"`

**Special Check:** Look for email sender info in source details (e.g., "from mike.chen@bigco.com")

---

### ✅ Scenario 6: AI-Generated Transcripts
**Test URL (Option 1 - Category only):**
```
/crm/documents?category=Meeting%20Materials
```

**Test URL (Option 2 - Source only):**
```
/crm/documents?source=AI
```

**Test URL (Option 3 - Combined - RECOMMENDED):**
```
/crm/documents?category=Meeting%20Materials&source=AI
```

**Expected Results:**
- ✅ Banner shows "Meeting Materials" or "AI Documents"
- ✅ FolderOpen or Zap icon displayed
- ✅ 13 documents shown (when using Option 3)
- ✅ "Meeting Materials" category selected
- ✅ "AI" source selected
- ✅ Documents: All AI-generated meeting transcripts

**Quick Verify:**
- All documents should have `category: "Meeting Materials"`
- All documents should have `source: "AI"`
- All documents should have `subcategory: "Transcript"`
- All documents should show uploader "System (AI)"

**Special Check:** Look for consistent AI attribution across all 13 transcripts

---

## Common Elements to Verify (All Scenarios)

### Context Banner
- ✅ Blue background (bg-blue-50)
- ✅ Appropriate icon for scenario type
- ✅ Clear descriptive text
- ✅ Document count displayed
- ✅ "Clear Filter" button visible

### Breadcrumb Trail
- ✅ Dashboard link (clickable)
- ✅ Documents link (clickable, clears filter)
- ✅ Current filter shown (not clickable)
- ✅ ChevronRight separators

### Sidebar Filters
- ✅ Appropriate filter auto-checked
- ✅ Filter stays checked while viewing
- ✅ Filter unchecks when cleared

### Clear Filter Button
- ✅ Button visible in banner
- ✅ Click shows all documents (40+)
- ✅ URL parameters cleared
- ✅ Toast notification appears
- ✅ Context banner disappears

---

## Quick Visual Checklist

### For Each Scenario:

**1. Initial Load**
- [ ] Page loads without errors
- [ ] Context banner appears immediately
- [ ] Correct icon displayed
- [ ] Document count accurate

**2. Content Display**
- [ ] Expected number of documents shown
- [ ] All documents match filter criteria
- [ ] Document cards render correctly
- [ ] No missing data

**3. Interactions**
- [ ] Sidebar filter auto-checked
- [ ] Breadcrumb links work
- [ ] Clear Filter button functional
- [ ] Navigation smooth

**4. Special Features**
- [ ] HRMS badges (Scenarios 2, 3)
- [ ] Rich contact context (Scenario 3)
- [ ] Activity type (Scenario 4)
- [ ] Email sender info (Scenario 5)
- [ ] AI attribution (Scenario 6)

---

## Document Count Quick Reference

| Scenario | Expected Count | What to Look For |
|----------|---------------|------------------|
| 1. Deal (Acme) | 6 | Proposals, contracts, recordings |
| 2. Account (TechStart) | 11 | HRMS docs, contracts, proposals |
| 3. Contact (Sarah Lee) | 10 | Personal docs, HRMS, contracts |
| 4. Activity (Discovery Call) | 2 | Agenda, recording |
| 5. Email Attachments | 9 | Email sender info visible |
| 6. AI Transcripts | 13 | All show "system_ai" uploader |

---

## Common Test Scenarios

### Test 1: Sequential Navigation
1. Test Scenario 1
2. Click "Clear Filter"
3. Test Scenario 2
4. Click "Clear Filter"
5. Continue for all 6 scenarios

**Expected:** Each scenario shows correct count, filters apply/clear cleanly

---

### Test 2: URL Direct Navigation
1. Copy/paste each test URL directly
2. Verify page loads with correct filter
3. Verify document count matches

**Expected:** Direct URL navigation works perfectly

---

### Test 3: Context Persistence
1. Navigate to Scenario 1
2. Click on a document
3. Use browser back button
4. Verify filter still applied

**Expected:** Filter context persists through navigation

---

### Test 4: Multiple Parameter Handling
1. Test Scenario 2 (3 parameters)
2. Test Scenario 3 (5 parameters)
3. Test Scenario 6 (2 parameters combined)

**Expected:** All parameters parsed and applied correctly

---

## Error Scenarios to Test

### Test with Invalid Data
1. Use invalid `deal_id`: `/crm/documents?deal_id=invalid_deal`
   - **Expected:** Banner shows, 0 documents, no errors

2. Use missing name parameters: `/crm/documents?deal_id=deal_acme_001`
   - **Expected:** Banner shows "Deal: Deal" (default), documents filtered correctly

3. Use invalid `hrms_connected` value: `/crm/documents?account_id=account_techstart&hrms_connected=invalid`
   - **Expected:** No HRMS badge, documents filtered correctly

---

## Performance Checks

| Action | Expected Time | How to Test |
|--------|--------------|-------------|
| URL parsing | < 50ms | Use browser dev tools Network tab |
| Filter application | < 100ms | Observe visual response time |
| Banner render | < 50ms | Should appear instantly |
| Clear filter | < 50ms | Should reset instantly |

---

## Browser Testing

Test in multiple browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

Verify:
- [ ] URL parameters work
- [ ] Filters apply correctly
- [ ] Context banner displays
- [ ] Icons render properly
- [ ] Clear button functional

---

## Mobile Testing

Test on mobile viewport (< 768px):
- [ ] Context banner responsive
- [ ] Document cards stack properly
- [ ] Clear button accessible
- [ ] Touch interactions work
- [ ] Text readable

---

## Keyboard Navigation

Test keyboard accessibility:
- [ ] Tab through context banner
- [ ] Tab to Clear Filter button
- [ ] Enter key activates Clear Filter
- [ ] Tab through document cards
- [ ] All interactive elements reachable

---

## Quick Debug Guide

### If documents don't show:
1. Check browser console for errors
2. Verify document IDs in mock data
3. Check filter logic in DocumentsLibrary.tsx:2077-2131

### If context banner doesn't appear:
1. Check URL parameters are correctly formatted
2. Verify useEffect at DocumentsLibrary.tsx:1794-1846
3. Check contextFilter state

### If Clear Filter doesn't work:
1. Verify handleClearContextFilter at DocumentsLibrary.tsx:2065-2072
2. Check searchParams.set functionality
3. Verify toast notification system

### If sidebar doesn't sync:
1. Check setSelectedRelatedTo calls
2. Verify selectedCategories state
3. Check selectedSources state

---

## Final Verification Checklist

### All Scenarios Working:
- [ ] Scenario 1: Deal filtering ✅
- [ ] Scenario 2: Account filtering ✅
- [ ] Scenario 3: Contact filtering ✅
- [ ] Scenario 4: Activity filtering ✅
- [ ] Scenario 5: Email filtering ✅
- [ ] Scenario 6: AI transcript filtering ✅

### Core Features Working:
- [ ] URL parameters parsed ✅
- [ ] Documents filtered correctly ✅
- [ ] Context banner displays ✅
- [ ] Clear filter functional ✅
- [ ] Sidebar syncs ✅
- [ ] Breadcrumbs work ✅

### Special Features Working:
- [ ] HRMS badges (Scenarios 2, 3) ✅
- [ ] Rich contact context (Scenario 3) ✅
- [ ] Activity type display (Scenario 4) ✅
- [ ] Email sender info (Scenario 5) ✅
- [ ] AI attribution (Scenario 6) ✅

### Build and Deploy:
- [ ] Build succeeds ✅
- [ ] No console errors ✅
- [ ] No TypeScript errors ✅
- [ ] All routes accessible ✅

---

## Success Criteria

**All 6 scenarios PASS if:**
1. ✅ Each scenario shows correct document count
2. ✅ Context banner displays with appropriate icon
3. ✅ Sidebar filters auto-check correctly
4. ✅ Clear Filter returns to all documents view
5. ✅ No console errors during testing
6. ✅ Build completes successfully
7. ✅ Special features work (HRMS badges, AI attribution, etc.)

---

## Test Result Summary Template

```
SCENARIO TEST RESULTS
Date: ___________
Tester: ___________

Scenario 1 (Deal): [ ] PASS [ ] FAIL
Scenario 2 (Account): [ ] PASS [ ] FAIL
Scenario 3 (Contact): [ ] PASS [ ] FAIL
Scenario 4 (Activity): [ ] PASS [ ] FAIL
Scenario 5 (Email): [ ] PASS [ ] FAIL
Scenario 6 (AI): [ ] PASS [ ] FAIL

Build Status: [ ] SUCCESS [ ] FAIL

Overall: [ ] ALL PASS [ ] SOME FAIL

Notes:
________________________________
________________________________
________________________________
```

---

**Last Updated:** December 12, 2024
**Status:** ✅ All scenarios verified and working
**Build Status:** ✅ SUCCESS
**Ready for:** Production deployment
