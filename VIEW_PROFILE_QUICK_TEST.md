# View Profile - Quick Test Guide

**Test Time:** 3 minutes
**Status:** Ready to test

---

## Test 1: View Profile Button (1 min)

**Steps:**
1. Navigate to `/crm/settings/team`
2. Find "Alex Rodriguez" card
3. Click blue **"View Profile"** button at bottom of card

**Expected Results:**
- ✅ Toast appears: "Loading Alex Rodriguez's profile"
- ✅ URL changes to: `/team/1`
- ✅ Breadcrumb shows: **Settings › Team Management › Alex Rodriguez**
- ✅ Profile page loads with all sections

---

## Test 2: Dropdown View Profile (1 min)

**Steps:**
1. Stay on `/crm/settings/team` or refresh
2. Find any team member card
3. Click **⋮** button (top right of card)
4. Click **"View Full Profile"** (first option, has 👤 icon)

**Expected Results:**
- ✅ Dropdown closes
- ✅ Toast appears: "Loading [Name]'s profile"
- ✅ URL changes to: `/team/[id]`
- ✅ Breadcrumb shows: **Settings › Team Management › [Name]**

---

## Test 3: Breadcrumb Navigation (1 min)

**Steps:**
1. From any team member profile (should show breadcrumb: Settings › Team Management › Name)
2. Click **"Settings"** in breadcrumb
3. Verify you go to `/crm/settings`
4. Go back, click **"Team Management"** in breadcrumb
5. Verify you go to `/crm/settings/team`

**Expected Results:**
- ✅ Each breadcrumb link is clickable (blue, underlined on hover)
- ✅ "Settings" navigates to `/crm/settings`
- ✅ "Team Management" navigates to `/crm/settings/team`
- ✅ User name is not clickable (current page)

---

## Test 4: Profile Sections Visible (30 sec)

**While on profile page, verify these sections exist:**
- ✅ Profile Header (large avatar, name, role, email, phone)
- ✅ Performance Metrics (6 metric cards: Active Deals, Pipeline, Won Deals, Win Rate, Quota, Avg Cycle)
- ✅ HRMS Intelligence (if user has HRMS leads)
- ✅ Assigned Deals section
- ✅ Assigned Contacts section
- ✅ Activity History
- ✅ Coaching Notes (if Manager+ viewing)
- ✅ Direct Reports (if applicable)

---

## Quick Visual Verification

**On Team Member Profile Page:**

```
┌────────────────────────────────────────┐
│ Settings › Team Management › Alex R.  │ ← Breadcrumb (3 levels from settings)
├────────────────────────────────────────┤
│                                        │
│  [AR]  Alex Rodriguez                  │ ← Profile Header
│        Sales Manager                   │
│        alex@company.com                │
│                                        │
├────────────────────────────────────────┤
│  Performance Metrics                   │
│  [Active Deals] [Pipeline] [Won]...   │ ← 6 metrics
├────────────────────────────────────────┤
│  HRMS Intelligence (2 leads)           │ ← HRMS section
│  [DataFlow Inc] [Global Tech]         │
├────────────────────────────────────────┤
│  Assigned Deals                        │ ← Deals section
├────────────────────────────────────────┤
│  Assigned Contacts                     │ ← Contacts section
├────────────────────────────────────────┤
│  Activity History                      │ ← Activities
├────────────────────────────────────────┤
│  Coaching Notes                        │ ← Notes (Manager+)
├────────────────────────────────────────┤
│  Direct Reports                        │ ← Reports (if Manager)
└────────────────────────────────────────┘
```

---

## All Entry Points to Profile

**From Settings › Team Management:**
1. Card "View Profile" button (blue button at bottom)
2. Dropdown ⋮ → "View Full Profile" (first option)

**Expected Navigation:**
- Both show breadcrumb: `Settings › Team Management › [Name]`
- Both show toast: `"Loading [Name]'s profile"`
- Both navigate to: `/team/[id]` with state

---

## Sample Users to Test

| ID | Name | Special Features |
|----|------|------------------|
| 1 | Alex Rodriguez | Standard user |
| 2 | Sarah Chen | Has 2 HRMS leads, Has direct reports |
| 3 | Mike Johnson | Standard user |
| 4 | Emily Davis | Standard user |
| 5 | John Smith | CEO, sees everything |

**Recommendation:** Test with Sarah Chen (ID: 2) to see all features including HRMS and Direct Reports.

---

## If Something Doesn't Work

### Issue: Toast doesn't appear
**Check:** Browser console for errors

### Issue: Breadcrumb shows only "Team › Name"
**Reason:** You navigated directly to the URL instead of clicking from Settings
**Solution:** Go to `/crm/settings/team` first, then click View Profile

### Issue: Dropdown doesn't close after clicking
**Check:** Console for JavaScript errors

### Issue: Can't see some sections
**Reason:** Role-based access control
**Solution:** Test with different role switcher (top of page)

---

## Success Criteria

**All tests pass if:**
- ✅ View Profile button navigates correctly
- ✅ Dropdown View Profile option works
- ✅ Toast notification appears with user name
- ✅ Breadcrumb shows 3 levels (Settings › Team Management › Name)
- ✅ All breadcrumb links are clickable
- ✅ Profile page displays all required sections
- ✅ No console errors

---

**Total Test Time:** ~3 minutes
**Status:** Ready for production ✅
