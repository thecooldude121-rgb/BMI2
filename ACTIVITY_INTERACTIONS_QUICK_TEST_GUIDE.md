# Activity Detail Page - Quick Interaction Test Guide

## 🎯 How to Test All Common Interactions

### Test URLs (Use these in your browser):

1. **Meeting:** `/crm/activities/ACT-2025-001`
2. **Call:** `/crm/activities/ACT-2025-002`
3. **Email:** `/crm/activities/ACT-2025-003`
4. **Task:** `/crm/activities/ACT-2025-005`
5. **Note:** `/crm/activities/ACT-2025-006`

---

## 📍 NAVIGATION TESTS (Top of Page)

### Breadcrumb Navigation
1. Click **"Dashboard"** → Should go to `/`
2. Click **"CRM"** → Should go to `/crm`
3. Click **"Activities"** → Should go to `/crm/activities`
4. **Current activity name** → Not clickable (just displayed)

**✅ Pass if:** All breadcrumb links work and current page is white text

---

## 📋 RELATED ACTIVITIES (Right Sidebar)

### Individual Activity Cards
1. Find "Related Activities" section
2. Click ANY activity card → Should navigate to that activity's detail page
3. **Hover** over card → Background should change to gray

**Example cards to test:**
- "Warm intro" (email)
- "Initial outreach" (call)
- "Lead created" (lead)

### View All Button
1. Click **"View All (X) →"** button
2. Should navigate to `/crm/activities?account=...` or `/crm/activities?contact=...`
3. Check URL has filter parameter

**✅ Pass if:** Button navigates with proper filter in URL

---

## 🎴 RELATED RECORD CARDS (Right Sidebar)

### Deal Card
1. Find "Related Deal" section
2. Click anywhere on the deal card
3. Should navigate to `/crm/deals/{deal-id}`

**Test on all 5 activities:**
- Meeting → TechStart Inc ($42,000)
- Call → BigCo Inc ($85,000)
- Email → Acme Corp ($50,000)
- Task → InnovateLabs ($120,000)
- Note → StartCo ($28,000)

### Contact Card - EMAIL TEST ⚠️ CRITICAL
1. Find "Primary Contact" section
2. Click the **email address** (blue text)
3. **Should:** Open email composer modal
4. **Should NOT:** Open your email client (like Gmail, Outlook)

**Test emails:**
- sarah.lee@techstart.com (Meeting)
- mike.chen@bigco.com (Call)
- john.smith@acmecorp.com (Email)

### Contact Card - PHONE TEST ⚠️ CRITICAL
1. Find "Primary Contact" section
2. Click the **phone number** (blue text)
3. **Should:** Open call log form
4. **Should NOT:** Initiate device phone call

**Test phones:**
- +1 (555) 234-5678 (Meeting)
- +1 (555) 789-0123 (Call)
- +1 (555) 345-6789 (Email)

### Contact Card Navigation
1. Click anywhere on contact card (NOT email/phone)
2. Should navigate to `/crm/contacts/{contact-id}`

### Account Card
1. Find "Account" section
2. Click anywhere on the account card
3. Should navigate to `/crm/accounts/{account-id}`

**✅ Pass if:** Card navigates but email/phone buttons open modals

---

## 📜 ACTIVITY HISTORY TESTS

### Basic Timeline (All Activities)
1. Scroll to "Activity History" section
2. Timeline should display with blue dots
3. Each item shows: action, user, time

**✅ Pass if:** History displays as informational timeline

### Attachment Preview Tests

**Meeting (ACT-2025-001):**
1. Find history item: "Added Implementation_Timeline.xlsx"
2. Click the filename (should have paperclip icon)
3. PDF preview modal should open

**Also test:**
- "Added TechStart_Proposal_v2.pdf" (Meeting)
- "Added call notes" with BigCo_Call_Notes_Dec7.pdf (Call)
- "Attachment opened: Acme_Corp_Proposal_Enterprise.pdf" (Email)
- "Completed checklist" with InnovateLabs_Case_Study.pdf (Task)
- "Added reference document" with comp_analysis.pdf (Note)

**✅ Pass if:** Clicking filename opens preview modal

### Expandable Details Tests

**Meeting (ACT-2025-001):**
1. Find history item: "Enabled AI features"
2. Click **"Show more details"**
3. Details should expand with gray background
4. Should show: "Activated AI Note Taker, Auto Recording..."

**Also test on:**
- "Updated agenda" (Meeting) → Shows agenda change details
- "System auto-updated deal stage" (Call) → Shows AI logic
- "Email opened (1st time)" (Email) → Shows tracking data
- "Updated priority" (Task) → Shows business reasoning
- "Shared with Sales Team" (Note) → Shows distribution list

**✅ Pass if:** Details expand/collapse smoothly with full text

### Combined Features Test

**Meeting - "Added TechStart_Proposal_v2.pdf":**
1. Should have BOTH paperclip icon AND "Show more details"
2. Click attachment → Opens preview
3. Click "Show more details" → Expands details
4. Both should work independently

**✅ Pass if:** Can interact with both attachment and details

---

## 🔄 COMPLETE TEST FLOWS

### Flow 1: Navigate Through Related Records
1. Start at Meeting detail (ACT-2025-001)
2. Click Related Deal "TechStart Inc" → Goes to deal
3. From deal, click back to meeting
4. Click Primary Contact "Sarah Lee" → Goes to contact
5. From contact, click back to meeting
6. Click Account "TechStart Inc" → Goes to account

**✅ Pass if:** All navigation works both ways

### Flow 2: Email a Contact from Activity
1. Go to Email detail (ACT-2025-003)
2. In Primary Contact card, click "john.smith@acmecorp.com"
3. Email composer modal should open
4. Parent card should NOT navigate
5. Close modal

**✅ Pass if:** Modal opens, no navigation happens

### Flow 3: View Filtered Activities
1. Go to any activity detail page
2. In Related Activities, click "View All (X) →"
3. Should go to activities list
4. Check URL has `?account=...` or `?contact=...`
5. Activities list should be filtered

**✅ Pass if:** Activities list shows filtered results

### Flow 4: Explore Activity History
1. Go to Note detail (ACT-2025-006)
2. Scroll to Activity History
3. Click "Show more details" on 3 different items
4. Click attachment "comp_analysis.pdf"
5. All should work independently

**✅ Pass if:** All history interactions work

---

## 📊 TEST CHECKLIST (Print and Check Off)

### Navigation (3 tests)
- [ ] Dashboard breadcrumb
- [ ] CRM breadcrumb
- [ ] Activities breadcrumb

### Related Activities (2 tests)
- [ ] Activity card click (navigate)
- [ ] View All button (with filter)

### Related Records (5 tests)
- [ ] Deal card (navigate)
- [ ] Contact card (navigate)
- [ ] Contact email (open modal, NOT mailto)
- [ ] Contact phone (open modal, NOT tel)
- [ ] Account card (navigate)

### Activity History (3 tests)
- [ ] Timeline display
- [ ] Attachment preview (6 examples)
- [ ] Expandable details (10 examples)

### **TOTAL:** 13 core interactions × 5 activity types = **65 test cases**

---

## 🎨 VISUAL CUES TO LOOK FOR

### Working Correctly:
- ✅ Hover effects (gray background on cards)
- ✅ Blue text for clickable items
- ✅ ChevronRight icons (→)
- ✅ ExternalLink icons on cards
- ✅ Paperclip icons on attachments
- ✅ Cursor changes to pointer on hover

### Watch Out For:
- ❌ Email client opening (Gmail, Outlook) → Should NOT happen
- ❌ Phone dialer opening → Should NOT happen
- ❌ Broken navigation links
- ❌ Missing hover states
- ❌ Layout breaking when details expand

---

## 🚀 QUICK 5-MINUTE TEST

**Test just these to verify everything works:**

1. **Breadcrumb:** Click "Activities" → Goes to list ✅
2. **Related Activity:** Click any activity card → Navigates ✅
3. **Deal Card:** Click deal → Goes to deal detail ✅
4. **Email:** Click contact email → Opens modal (NOT mailto) ✅
5. **Attachment:** Click any PDF name → Opens preview ✅
6. **Details:** Click "Show more details" → Expands ✅

**If all 6 work, the entire system is functional!**

---

## 📞 TROUBLESHOOTING

### Email Opens Gmail/Outlook Instead of Modal
**Problem:** Using `<a href="mailto:">` instead of button
**Fix:** Already implemented with `onClick` handlers

### Phone Opens Device Dialer
**Problem:** Using `<a href="tel:">` instead of button
**Fix:** Already implemented with `onClick` handlers

### Clicking Email/Phone Navigates Card
**Problem:** Event bubbling
**Fix:** Already implemented with `e.stopPropagation()`

### Details Don't Expand
**Check:** Is there a `details` property on the history item?
**Fix:** Test data includes 10+ items with details

### Attachment Click Does Nothing
**Check:** Is there an `attachment` property on the history item?
**Fix:** Test data includes 6 items with attachments

---

## ✅ EXPECTED TEST RESULTS

**All interactions should work identically across all 5 activity types:**
- Meeting (ACT-2025-001) ✅
- Call (ACT-2025-002) ✅
- Email (ACT-2025-003) ✅
- Task (ACT-2025-005) ✅
- Note (ACT-2025-006) ✅

**No exceptions. No special cases. 100% consistency.**

---

**Happy Testing! 🎉**
