# Context-Aware Filtering - Visual Test Guide
**What You Should See When Testing**

---

## How to Start Testing

1. Open your browser to: `http://localhost:5173/crm/documents-demo`
2. You'll see a page with 6 colorful scenario cards
3. Click any "Test Scenario" button to see it in action

---

## Visual Test: Scenario 1 - Deal Context

### STEP 1: Click "Test Scenario 1" Button
**What Happens:**
- Page navigates to: `/crm/documents?deal_id=deal_acme_001`

### STEP 2: Look for Context Banner (Top of Page)
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔵 Blue Background Banner                                      │
│                                                                  │
│ [💼 Icon] 🔍 Showing documents for: Acme Corp - $50K (Deal)   │
│             3 documents found                [Clear Filter] ←   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**✓ Verify:**
- Banner has blue background
- Briefcase icon visible
- Text says "Acme Corp - $50K (Deal)"
- Shows "3 documents found"
- Clear Filter button present

### STEP 3: Check Breadcrumb (Below Banner)
```
Dashboard > Documents > Deal: Acme Corp - $50K
            ↑ clickable
```

**✓ Verify:**
- Breadcrumb shows context path
- "Documents" link is clickable

### STEP 4: Look at Document Grid
**You Should See ONLY These 3 Documents:**
1. 📄 Acme_Corp_Proposal_v2.pdf
2. 📄 Acme_Discount_Approval_Form.pdf
3. 🎥 Acme_Meeting_Recording.mp4

**✓ Verify:**
- Only 3 documents visible
- All are related to Acme Corp
- No other documents shown

### STEP 5: Check Sidebar Filters (Left Side)
**✓ Verify:**
- "Deals" checkbox is checked ☑
- Other checkboxes unchecked ☐

### STEP 6: Click "Clear Filter" Button
**What Happens:**
- Context banner disappears
- All documents now visible (13+ documents)
- Breadcrumb changes to: "Dashboard > Documents"
- Toast notification: "Filter cleared"

**✓ Verify:**
- Banner removed
- More documents visible
- Toast appeared
- URL changed to: `/crm/documents`

---

## Visual Test: Scenario 2 - Account Context

### STEP 1: Click "Test Scenario 2" Button
**What Happens:**
- Page navigates to: `/crm/documents?account_id=account_techstart`

### STEP 2: Context Banner Appears
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔵 Blue Background Banner                                      │
│                                                                  │
│ [🏢 Icon] 🔍 Showing documents for: TechStart Inc (Account)   │
│             5+ documents found               [Clear Filter] ←   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**✓ Verify:**
- Building icon (not briefcase)
- Text says "TechStart Inc (Account)"
- Shows 5+ documents
- Blue background

### STEP 3: Check Documents
**You Should See TechStart-Related Documents:**
- TechStart_Enterprise_Contract.docx
- TechStart_Onboarding_Guide.pdf
- HRMS_TechStart_Placement_Agreement.pdf
- Documents linked to TechStart account
- Sarah Lee-related docs (she works at TechStart)

**✓ Verify:**
- All documents related to TechStart
- May include employee documents
- No unrelated documents

### STEP 4: Sidebar Shows
- ☑ "Accounts" checked
- ☐ Other filters unchecked

---

## Visual Test: Scenario 3 - Contact Context

### STEP 1: Click "Test Scenario 3" Button
**What Happens:**
- Page navigates to: `/crm/documents?contact_id=contact_sarah_lee`

### STEP 2: Context Banner
```
┌─────────────────────────────────────────────────────────────────┐
│ [👤 Icon] 🔍 Showing documents for: Sarah Lee (Contact)       │
│             4 documents found                [Clear Filter]     │
└─────────────────────────────────────────────────────────────────┘
```

**✓ Verify:**
- User icon visible
- Text says "Sarah Lee (Contact)"
- Shows 4 documents

### STEP 3: Documents Visible
**You Should See Sarah-Related Documents:**
- Sarah_Lee_Employment_Contract.pdf
- Sarah_Lee_Resume.pdf
- Documents she's involved in
- Meeting notes with Sarah

**✓ Verify:**
- All documents related to Sarah Lee
- Both personal and work documents
- Correct count (4 documents)

---

## Visual Test: Scenario 4 - Activity Context

### STEP 1: Click "Test Scenario 4" Button
**URL:** `/crm/documents?activity_id=act_bigco_001`

### STEP 2: Context Banner
```
┌────────────────────────────────────────────────────────────────────┐
│ [📅 Icon] 🔍 Showing documents for: TechStart Discovery Call    │
│             (Activity)                                             │
│             2 documents found                 [Clear Filter]       │
└────────────────────────────────────────────────────────────────────┘
```

**✓ Verify:**
- Calendar icon
- Text says "TechStart Discovery Call (Activity)"
- Shows 2 documents

### STEP 3: Documents Visible
**Meeting Attachments:**
- BigCo_Discovery_Call_Transcript.pdf
- BigCo_Meeting_Notes.pdf

**✓ Verify:**
- Only 2 documents
- Both are meeting-related
- No other documents

---

## Visual Test: Scenario 5 - Email Context

### STEP 1: Click "Test Scenario 5" Button
**URL:** `/crm/documents?category=Email%20Attachments`

### STEP 2: Context Banner
```
┌────────────────────────────────────────────────────────────────┐
│ [📧 Icon] 🔍 Showing documents for: Email (Email Attachments)│
│             Multiple documents found        [Clear Filter]     │
└────────────────────────────────────────────────────────────────┘
```

**✓ Verify:**
- Mail/Folder icon
- Text mentions "Email Attachments"
- Multiple documents shown

### STEP 3: Sidebar Shows
- ☑ "Email Attachments" category checked
- ☑ "Email" source checked
- Both filters active simultaneously

**✓ Verify:**
- Two filters applied at once
- All shown documents are email attachments

---

## Visual Test: Scenario 6 - AI Context

### STEP 1: Click "Test Scenario 6" Button
**URL:** `/crm/documents?source=AI&category=Meeting%20Materials`

### STEP 2: Context Banner
```
┌──────────────────────────────────────────────────────────────────┐
│ [⚡ Icon] 🔍 Showing documents for: AI Assistant                │
│             (Meeting Materials)                                  │
│             Multiple documents found          [Clear Filter]     │
└──────────────────────────────────────────────────────────────────┘
```

**✓ Verify:**
- Lightning bolt icon (AI)
- Text says "AI Assistant"
- Shows AI-generated documents

### STEP 3: Documents Visible
**AI-Generated Documents:**
- Meeting transcripts
- AI-generated summaries
- Auto-created notes
- All from AI source

**✓ Verify:**
- All documents are AI-generated
- Category is "Meeting Materials"
- Both filters active

---

## Common Elements Across All Scenarios

### Context Banner Always Shows:
1. **Icon** (changes based on context type)
2. **Text:** "Showing documents for: [Entity Name] ([Type])"
3. **Document Count:** "X documents found"
4. **Clear Filter Button** (right side)
5. **Blue Background** (bg-blue-50)

### Breadcrumb Always Shows:
```
Dashboard > Documents > [Context Type]: [Entity Name]
```

### Sidebar Always:
- Auto-checks relevant filter
- Can add more filters on top
- Combines with context (AND logic)

### Documents Always:
- Filtered to show only relevant items
- Can be searched within context
- Can be sorted
- Grid or list view works

---

## Interactive Features to Test

### Test: Add More Filters
1. Navigate to any context
2. Check a file type filter (e.g., "PDF")
3. **Result:** Further refines results
4. **Verify:** Only PDFs from context shown

### Test: Search Within Context
1. Navigate to TechStart account context
2. Type "contract" in search box
3. **Result:** Only TechStart contracts shown
4. **Verify:** Search works within filtered set

### Test: Switch Views
1. Navigate to any context
2. Click "List View" / "Grid View" button
3. **Result:** View changes, context persists
4. **Verify:** Context banner still visible

### Test: Upload Document
1. Navigate to deal context
2. Click "Upload Document"
3. **Verify:** Deal field pre-filled in upload modal
4. **Expected:** New document auto-links to deal

### Test: Clear and Re-Filter
1. Navigate to deal context (3 docs)
2. Click "Clear Filter" (all docs)
3. Click "Test Scenario 2" (account context)
4. **Verify:** Switches to new context smoothly

---

## What Success Looks Like

### ✅ Successful Test Shows:
- Context banner appears with correct info
- Document count matches expected
- Only relevant documents visible
- Sidebar filters sync automatically
- Clear Filter button works
- Breadcrumb updates correctly
- No console errors
- Smooth transitions
- Toast notifications appear

### ❌ Test Fails If:
- Banner doesn't appear
- Wrong documents shown
- Document count incorrect
- Sidebar filters don't sync
- Clear Filter doesn't work
- Console shows errors
- Page crashes or freezes

---

## Quick Visual Checklist

```
Test Scenario 1 (Deal):
[ ] Blue banner appears
[ ] Briefcase icon shown
[ ] Shows "Acme Corp - $50K (Deal)"
[ ] 3 documents visible
[ ] "Deals" filter checked
[ ] Clear Filter button works

Test Scenario 2 (Account):
[ ] Blue banner appears
[ ] Building icon shown
[ ] Shows "TechStart Inc (Account)"
[ ] 5+ documents visible
[ ] "Accounts" filter checked
[ ] Clear Filter button works

Test Scenario 3 (Contact):
[ ] Blue banner appears
[ ] User icon shown
[ ] Shows "Sarah Lee (Contact)"
[ ] 4 documents visible
[ ] "Contacts" filter checked
[ ] Clear Filter button works

Test Scenario 4 (Activity):
[ ] Blue banner appears
[ ] Calendar icon shown
[ ] Shows activity name
[ ] 2 documents visible
[ ] "Activities" filter checked
[ ] Clear Filter button works

Test Scenario 5 (Email):
[ ] Blue banner appears
[ ] Folder/Mail icon shown
[ ] Shows "Email Attachments"
[ ] Multiple documents visible
[ ] Both category and source checked
[ ] Clear Filter button works

Test Scenario 6 (AI):
[ ] Blue banner appears
[ ] Lightning icon shown
[ ] Shows "AI Assistant"
[ ] AI documents visible
[ ] Both filters checked
[ ] Clear Filter button works
```

---

## Screenshot Locations (What to Capture)

If taking screenshots for documentation:

1. **Context Banner** (top of page, blue bar)
2. **Breadcrumb** (below banner)
3. **Document Grid** (filtered results)
4. **Sidebar Filters** (left side, showing checked boxes)
5. **Clear Filter Button** (before and after clicking)
6. **Demo Page** (scenario cards)

---

## Performance Expectations

### Fast Operations:
- Context detection: < 50ms
- Filter application: < 100ms
- Clear filter: < 50ms
- View switching: < 100ms

### User Should NOT Experience:
- Lag when clicking scenarios
- Delay in banner appearing
- Slow document filtering
- Freezing or stuttering
- Flash of unfiltered content

---

## Final Checklist

Before marking test as complete:

- [ ] Tested all 6 scenarios
- [ ] Verified context banners
- [ ] Checked document filtering
- [ ] Tested Clear Filter button
- [ ] Verified sidebar sync
- [ ] Tested breadcrumb navigation
- [ ] Tried additional filters
- [ ] Tested search within context
- [ ] Switched view modes
- [ ] No console errors
- [ ] Smooth user experience

---

**Ready to Test!**

Start at: http://localhost:5173/crm/documents-demo

**Estimated Test Time:** 5-10 minutes

---

## Need Help?

If something doesn't look right:
1. Check console for errors (F12)
2. Verify URL has correct parameters
3. Try refreshing the page
4. Check that you're in `/crm/documents` route
5. Ensure build completed successfully

---

**Happy Testing!** 🎉
