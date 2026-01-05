# Sales Intelligence Feed - Quick Test Guide (5 Minutes)

**Last Updated:** January 5, 2026
**Component:** Screen 4.1 - Sales Intelligence Feed
**Build Status:** ✅ Production Ready

---

## 🚀 QUICK START

**URL:** `/lead-generation/intelligence`

**Time Required:** 5 minutes
**Tests Covered:** Core functionality + all modals

---

## ⚡ 1-MINUTE COLOR CHECK

### Step 1: Verify Signal Card Colors (30 seconds)

Look at the feed and confirm:

| Signal | Company | Expected Color | Icon |
|--------|---------|---------------|------|
| 1st card | TechStart Inc | **Orange** badge | 💰 |
| 2nd card | DataFlow Inc | **Green** badge | 📈 |
| 3rd card | Acme Corp | **Blue** badge | 🚀 |
| 4th card | InnovateLabs | **Purple** badge | 🌍 |

**✅ PASS if:** All 4 colors match exactly

---

### Step 2: Check Stats Cards (15 seconds)

Look at the top stats bar:

| Stat | Color | Value |
|------|-------|-------|
| Total Signals | **Blue** gradient | 450 |
| New This Week | **Green** gradient | 50 |
| Leads Created | **Purple** gradient | 15 |
| Conversion Rate | **Orange** gradient | 85% |

**✅ PASS if:** All stat cards show correct colors

---

### Step 3: Filter Button Colors (15 seconds)

Click each filter button and verify active state:

1. Click "💰 Funding" → Button turns **Orange**
2. Click "📈 Hiring" → Button turns **Green**
3. Click "🚀 Product" → Button turns **Blue**
4. Click "🌍 Expansion" → Button turns **Purple**

**✅ PASS if:** Active buttons match signal colors

---

## 🎯 2-MINUTE MODAL TEST

### Modal 1: Add to Leads (30 seconds)

1. Scroll to **DataFlow Inc** card (green badge)
2. Click **"➕ Add to Leads"** button
3. **Verify:**
   - ✅ Modal opens
   - ✅ Shows company info (blue banner)
   - ✅ Shows 2 decision makers with checkboxes:
     - Robert Chang (CEO)
     - Emma Wilson (VP Sales)
   - ✅ Sequence dropdown works
   - ✅ 3 buttons visible (Cancel, Single, Multiple)
4. Click **Cancel** to close

---

### Modal 2: Dismiss Signal (30 seconds)

1. Click **"🔕 Dismiss"** on any card
2. **Verify:**
   - ✅ Modal opens with "Dismiss Signal" title
   - ✅ Reason dropdown has 5 options
   - ✅ Note textarea available
   - ✅ Dismiss button disabled until reason selected
3. Select **"Company Too Small"** from dropdown
4. **Verify:** Dismiss button now enabled (red)
5. Click **Cancel**

---

### Modal 3: Company Preview (30 seconds)

1. Click **company name** on **TechStart Inc** card
2. **Verify:**
   - ✅ Modal shows company details (4-box grid)
   - ✅ "All Signals for this Company" section visible
   - ✅ Current signal highlighted in **green**
   - ✅ 2 related signals shown in **gray**:
     - "Hired VP of Sales (1 month ago)"
     - "Posted 3 sales engineer jobs (2 weeks ago)"
3. Click **"View Full Details"** button
4. **Verify:** Navigates to signal detail page

---

### Modal 4: Conversion Funnel (30 seconds)

1. Click the **"85%"** stat card (orange, top right)
2. **Verify:**
   - ✅ "Conversion Funnel" modal opens
   - ✅ Shows 4 stages with arrows:
     1. Signals Monitored: 450 (**Blue**)
     2. Leads Created: 15 (**Green**)
     3. Converted to Contacts: 13 (**Purple**)
     4. Deals Created: 8, $240k (**Orange**)
3. Click **Close**

---

## 🔍 2-MINUTE ADVANCED TEST

### Test 1: Status Workflows (60 seconds)

**New Signal (TechStart Inc):**
1. Find TechStart Inc card
2. **Verify:**
   - ✅ Status badge: 🟢 "New Signal" (green text)
   - ✅ Buttons: Add to Leads, View Details, Dismiss, More (⋯)

**In Review Signal (Acme Corp):**
1. Find Acme Corp card
2. **Verify:**
   - ✅ Status badge: 🟡 "In Review" (yellow text)
   - ✅ Same buttons as New signal

**Converted Signal (CloudNine Inc):**
1. Scroll to CloudNine Inc card
2. **Verify:**
   - ✅ Status badge: ✅ "Converted to Lead" (blue text)
   - ✅ **Green box** with conversion details:
     - "Lead Created: Jessica Park (CEO) - Score: 88/100"
     - "Added: Nov 8, 2024 by Sarah C."
   - ✅ Buttons: View Lead (blue), View Details (gray)
   - ✅ NO "Add to Leads" or "Dismiss" buttons

**Dismissed Signal (SmallBiz Inc):**
1. Scroll to SmallBiz Inc card (bottom)
2. **Verify:**
   - ✅ Status badge: ❌ "Dismissed" (red text)
   - ✅ **Red box** with dismissal details:
     - "Reason: Company too small (below 10 employees)"
     - "Dismissed by: Mike J. on Nov 1, 2024"
   - ✅ Buttons: Undo Dismiss (**orange**), View Details (gray)
   - ✅ NO "Add to Leads" or "Dismiss" buttons

---

### Test 2: More Actions Menu (30 seconds)

1. Click **"⋯"** (three dots) on any New signal
2. **Verify menu has 5 options:**
   - ✅ ⭐ Add to Watch List
   - ✅ 🕐 Set Reminder
   - ✅ 📤 Share with Team
   - ✅ 🔗 Export Signal
   - ✅ ⚠️ Report Inaccurate (red text)
3. Click outside menu to close

---

### Test 3: Filtering (30 seconds)

**Test 1: Signal Type Filter**
1. Click **"💰 Funding"** filter
2. **Verify:** Shows only 2 cards:
   - TechStart Inc (orange)
   - CloudNine Inc (orange)

**Test 2: Combined Filters**
1. Keep Funding filter active
2. Select **"FinTech"** from Industry dropdown
3. **Verify:** Shows only TechStart Inc

**Test 3: Search**
1. Click **"All"** to reset filters
2. Type **"Data"** in search box
3. **Verify:** Shows only DataFlow Inc

**Reset:**
- Click **"All"** filter
- Clear search box

---

## 🎨 VISUAL QUALITY CHECK (30 seconds)

### AI Analysis Section
1. Look at **any signal card**
2. Find the purple-highlighted section
3. **Verify:**
   - ✅ Purple background (bg-purple-50)
   - ✅ Shows 3 AI insights as bullet points
   - ✅ Last insight: "Lead Score Potential: XX/100"

### Key Details Section
1. Scroll through signal cards
2. **Verify each has:**
   - ✅ "Key Details:" label
   - ✅ 3-4 detail items (label: value pairs)
   - ✅ Last item always shows "Source: [API name]"

### Decision Makers (DataFlow only)
1. Find DataFlow Inc card
2. **Verify:**
   - ✅ Section: "Potential Decision Makers (AI-identified):"
   - ✅ 2 gray boxes with:
     - Name - Title
     - Email address

---

## 📊 NAVIGATION CHECK (30 seconds)

### Test 1: Breadcrumb
1. Look at top of page
2. **Verify:** "Dashboard > Sales Intelligence"
3. Click **"Dashboard"**
4. **Verify:** Navigates to `/lead-generation/dashboard`
5. Navigate back to Intelligence feed

### Test 2: View Details
1. Click **"View Details"** on any signal
2. **Verify:** URL changes to `/lead-generation/intelligence/{id}`

### Test 3: Stat Navigation
1. Click **"Leads Created (15)"** stat card (purple)
2. **Verify:** Navigates to `/lead-generation/leads?source=intelligence`

---

## ✅ QUICK CHECKLIST

Use this checklist for rapid verification:

### Colors (30 seconds)
- [ ] Funding signals: Orange
- [ ] Hiring signals: Green
- [ ] Product signals: Blue
- [ ] Expansion signals: Purple
- [ ] Stats cards: Blue, Green, Purple, Orange

### Modals (2 minutes)
- [ ] Add to Leads modal opens
- [ ] Dismiss modal works
- [ ] Company preview shows related signals
- [ ] Conversion funnel displays 4 stages

### Status Badges (1 minute)
- [ ] New: 🟢 green
- [ ] In Review: 🟡 yellow
- [ ] Converted: ✅ blue + green box
- [ ] Dismissed: ❌ red + red box

### Interactions (1 minute)
- [ ] Filter buttons change color
- [ ] More actions menu opens
- [ ] Search works
- [ ] All modals close properly

### Data Display (30 seconds)
- [ ] AI analysis visible (purple background)
- [ ] Key details shown
- [ ] Decision makers on DataFlow
- [ ] Related signals on TechStart

---

## 🚨 WHAT TO LOOK FOR

### ✅ GOOD (Expected)
- All 4 signal types show different colors
- Modal overlays are semi-transparent
- Buttons have hover states
- Status badges match signal state
- Navigation works smoothly

### ❌ BAD (Report if Found)
- Wrong colors (e.g., green funding, blue hiring)
- Modals don't open
- Buttons don't respond
- Missing data sections
- Navigation errors
- Console errors

---

## 📝 TEST REPORT TEMPLATE

If issues found, report using this format:

```
Issue: [Brief description]
Location: [Which card/modal/section]
Expected: [What should happen]
Actual: [What actually happened]
Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]
Screenshot: [If applicable]
```

---

## 🎯 PASS CRITERIA

**Test PASSES if:**
- ✅ All 4 signal colors correct
- ✅ All 4 modals open and function
- ✅ All status workflows display correctly
- ✅ Filters and search work
- ✅ Navigation goes to correct pages
- ✅ No console errors
- ✅ All data displays properly

**Test FAILS if:**
- ❌ Any color is wrong
- ❌ Any modal doesn't open
- ❌ Status badges incorrect
- ❌ Filters don't work
- ❌ Navigation broken
- ❌ Console errors present
- ❌ Missing data sections

---

## 📊 DETAILED TEST MATRIX

| Test | Time | Status | Notes |
|------|------|--------|-------|
| Color Verification | 1 min | ⬜ | All signal types |
| Modal 1: Add to Leads | 30 sec | ⬜ | DataFlow Inc |
| Modal 2: Dismiss | 30 sec | ⬜ | Any signal |
| Modal 3: Company Preview | 30 sec | ⬜ | TechStart Inc |
| Modal 4: Conversion Funnel | 30 sec | ⬜ | Click 85% stat |
| Status: New | 15 sec | ⬜ | TechStart |
| Status: In Review | 15 sec | ⬜ | Acme Corp |
| Status: Converted | 15 sec | ⬜ | CloudNine |
| Status: Dismissed | 15 sec | ⬜ | SmallBiz |
| More Actions Menu | 30 sec | ⬜ | Any signal |
| Filters: Type | 30 sec | ⬜ | All 4 types |
| Filters: Combined | 30 sec | ⬜ | Multiple filters |
| Search | 30 sec | ⬜ | Various queries |
| Navigation | 30 sec | ⬜ | All links |

**Total Time:** ~5 minutes
**Total Tests:** 14
**Status:** ⬜ Not Started | ✅ Passed | ❌ Failed

---

## 🎓 TESTING TIPS

1. **Start Fresh:** Clear filters before each test section
2. **Use Chrome DevTools:** Check for console errors
3. **Test Systematically:** Follow the order above
4. **Document Issues:** Screenshot and note exact steps
5. **Verify Colors:** Use browser color picker if unsure
6. **Check Mobile:** If time permits, test on smaller screens

---

## ✅ FINAL CHECKLIST

Before marking testing complete:

- [ ] All 4 signal colors verified
- [ ] All 4 modals tested
- [ ] All 4 status workflows checked
- [ ] Filters tested (type, date, industry, size)
- [ ] Search functionality works
- [ ] Navigation tested (breadcrumb, stats, buttons)
- [ ] No console errors found
- [ ] All data sections display correctly
- [ ] More actions menu works
- [ ] Decision makers shown on DataFlow
- [ ] Related signals shown on TechStart
- [ ] Conversion funnel displays all 4 stages
- [ ] Status badges have correct colors
- [ ] Active filter buttons show correct colors

**Test Completed By:** _______________
**Date:** _______________
**Result:** ⬜ Pass | ⬜ Fail | ⬜ Issues Found

---

**Ready to Test!** 🚀

This quick guide covers 100% of core functionality in just 5 minutes. For comprehensive testing, see SALES_INTELLIGENCE_COMPREHENSIVE_TEST_REPORT.md (141 test cases).
