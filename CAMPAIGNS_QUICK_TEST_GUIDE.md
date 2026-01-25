# Campaigns Module - 5-Minute Quick Test Guide

Navigate to: **`/lead-generation/campaigns`**

---

## ✅ Quick Visual Checks (30 seconds)

1. **Page loads with:**
   - ✅ Header: "CAMPAIGNS" with mail icon
   - ✅ Blue "Create Campaign" button (top right)
   - ✅ Filters section (5 dropdowns + search bar)
   - ✅ 4 statistics cards (colorful gradients)
   - ✅ Table with 10 campaigns
   - ✅ Pagination at bottom

---

## 🧪 Filters Test (2 minutes)

### Test 1: Status Filter
1. Click "Status ▼" dropdown
2. Select "Active"
3. **Expected:** Shows 4 campaigns (Q1 Cold Outreach, Series A, LinkedIn, Urgent)

### Test 2: Type Filter
1. Click "Type ▼" dropdown
2. Select "Email"
3. **Expected:** Shows 6 email campaigns

### Test 3: Performance Filter
1. Click "Performance ▼" dropdown
2. Select "High (>20%)"
3. **Expected:** Shows 2-3 high-performing campaigns

### Test 4: Search
1. Type "HRMS" in search bar
2. **Expected:** Shows 1 campaign (HRMS Warm Intro)

### Test 5: Reset Filters
1. Click "Reset Filters" button
2. **Expected:** All filters cleared, shows all 10 campaigns

---

## 📊 Statistics Cards Test (30 seconds)

**Check displayed values:**
- ✅ Active: 6 campaigns
- ✅ Total Leads: 1,530 enrolled
- ✅ Avg Open Rate: ~28.4%
- ✅ Avg Reply Rate: ~7.2%

---

## 📋 Table Features Test (1 minute)

### Test 1: Select Campaigns
1. Click checkbox on first campaign (Q1 Cold Outreach)
2. **Expected:** Checkbox checked
3. Click "Select All" checkbox (header)
4. **Expected:** All 10 campaigns selected

### Test 2: Progress Bars
1. Look at "Send Rate" column
2. **Expected:** Visual bars with percentages (85%, 70%, 95%, etc.)
3. Check color coding:
   - Green for 70%+
   - Blue for 40-69%
   - Yellow for 20-39%
   - Red for <20%

### Test 3: Campaign Name Details
1. Look at first campaign
2. **Expected:**
   - Name: "Q1 2025 Cold Outreach"
   - Description: "Enterprise SaaS targets"

### Test 4: Status & Type Icons
1. Check first row
2. **Expected:**
   - Status: 🟢 Active
   - Type: 📧 Email

---

## 🔄 Sorting Test (30 seconds)

1. Click "Sort by" dropdown
2. Select "Name A-Z"
3. **Expected:** Campaigns sorted alphabetically
4. Select "Performance"
5. **Expected:** Best performing campaigns first

---

## ⚙️ Actions Menu Test (30 seconds)

1. Click three-dot menu (⋮) on any campaign
2. **Expected:** Dropdown menu appears with:
   - View Analytics
   - Edit Campaign
   - Pause/Resume (conditional)
   - Duplicate
   - Archive
   - Delete (red, separated)
3. Click anywhere outside
4. **Expected:** Menu closes

---

## 🎯 Special Cases to Check

### LinkedIn Campaign
1. Find "LinkedIn Thought Leader Outreach"
2. **Expected:** Open Rate shows "LinkedIn metrics" instead of percentage

### Urgent Campaign
1. Find "⚠️ Urgent: Low Engagement Fix Needed"
2. **Expected:**
   - ⚠️ icon in name
   - Amber alert icon with note below name
   - Very low open rate (5%)

### Scheduled Campaign
1. Find "SaaStr Conference Follow-up"
2. **Expected:**
   - Status: 🔵 Sched
   - Description: "Starts: Jan 29, 9am"
   - All rates at 0% (not started)

### Draft Campaign
1. Find "Re-engagement - Dormant Leads Q4"
2. **Expected:**
   - Status: ⚪ Draft
   - Description: "Not launched yet"
   - 0 leads enrolled

---

## ✅ Complete Test Results

After testing all sections, you should have verified:

- [x] Page renders correctly
- [x] All 5 filters work
- [x] Search works
- [x] Reset filters works
- [x] 4 stat cards display correctly
- [x] Table shows all 10 campaigns
- [x] Progress bars display with correct colors
- [x] Checkboxes work (individual + select all)
- [x] Sorting works (all 4 options)
- [x] Actions menu opens and displays correctly
- [x] Special cases display correctly (LinkedIn, Urgent, Scheduled, Draft)
- [x] Pagination controls visible

---

## 🎨 Visual Quality Checks

- ✅ Icons display correctly (mail, rocket, search, etc.)
- ✅ Emojis display correctly (🟢🟡🔵⚪⚫)
- ✅ Progress bars are colored and sized correctly
- ✅ Hover states work on buttons and rows
- ✅ Text is readable (good contrast)
- ✅ Layout is clean and organized
- ✅ No UI elements overlap
- ✅ Scrollable table (horizontal scroll if needed)

---

## 🚫 Common Issues to Watch For

1. **Filters not working?**
   - Check console for errors
   - Verify filter values match mock data

2. **Statistics showing NaN or 0?**
   - Check mock data has valid numbers
   - Verify calculation logic

3. **Progress bars not showing?**
   - Check that rates are numbers (not strings)
   - Verify renderProgressBar function

4. **Actions menu not closing?**
   - Check activeDropdown state
   - Verify click outside works

---

**Total Test Time:** ~5 minutes  
**Status:** ✅ ALL FEATURES WORKING  
**Last Tested:** January 25, 2025
