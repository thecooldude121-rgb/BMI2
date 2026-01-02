# Team Filter Dropdowns - Quick Test Guide

## 🎯 3-Minute Test

### Step 1: View Filter Counts (30 seconds)
```
1. Navigate to Settings → Team Management
2. Click "● All Roles (3) ▼" dropdown

EXPECTED:
✅ Dropdown opens showing all options
✅ Each option has a count: (X)
✅ All Roles shows (3)
✅ Sales Manager shows (1)
✅ Sales Rep shows (1)
✅ Account Executive shows (1)
✅ CEO, VP, Admin, Analyst, Support show (0)
✅ Current selection (All) has ● filled circle
✅ Other options have ○ empty circle
```

---

### Step 2: Filter by Role (25 seconds)
```
1. From the open dropdown, select "Sales Manager"
2. Dropdown closes

EXPECTED:
✅ Dropdown now shows: ● Sales Manager (1)
✅ Only Sarah Chen card visible
✅ "× Clear Filters" button appears (blue text)
✅ "1 result" text appears next to button
✅ Bottom count: "Showing 1 of 3 users"
```

---

### Step 3: Filter by Department (25 seconds)
```
1. Click "× Clear Filters" to reset
2. Click "● All Departments (3) ▼" dropdown
3. Select "Sales"

EXPECTED:
✅ Dropdown shows: ● Sales (2)
✅ Sarah Chen and Michael Rodriguez visible
✅ Emily Brown (Marketing) hidden
✅ "× Clear Filters" button appears
✅ "2 results" text appears
✅ Bottom count: "Showing 2 of 3 users"
```

---

### Step 4: Filter by Status (20 seconds)
```
1. Click "× Clear Filters" to reset
2. Click "● All Status (3) ▼" dropdown
3. Select "Active"

EXPECTED:
✅ Dropdown shows: ● Active (3)
✅ All 3 users visible (all are active)
✅ "× Clear Filters" button appears
✅ "3 results" text appears
```

---

### Step 5: Combine Multiple Filters (30 seconds)
```
1. Click "× Clear Filters" to reset
2. Select Role: "Sales Manager"
3. Select Department: "Sales"

EXPECTED:
✅ Only Sarah Chen visible (Sales Manager in Sales dept)
✅ Role dropdown: ● Sales Manager (1)
✅ Dept dropdown: ● Sales (2)
✅ "× Clear Filters" button visible
✅ "1 result" text visible
✅ Bottom count: "Showing 1 of 3 users"
```

---

### Step 6: Clear Filters Button (15 seconds)
```
1. With filters active, click "× Clear Filters"

EXPECTED:
✅ All dropdowns reset to "All"
✅ Role: ● All Roles (3)
✅ Status: ● All Status (3)
✅ Dept: ● All Departments (3)
✅ All 3 users visible
✅ "× Clear Filters" button disappears
✅ Results counter disappears
```

---

### Step 7: Empty State with Filter (20 seconds)
```
1. Click "All Roles" dropdown
2. Select "CEO"

EXPECTED:
✅ Empty state appears (no CEOs in team)
✅ Dropdown shows: ● CEO (0)
✅ Large search icon in gray circle
✅ "No team members found" message
✅ "Clear All Filters" button in empty state
✅ "0 results" text visible
```

---

### Step 8: Visual Indicators (15 seconds)
```
1. Click "× Clear Filters" (if needed)
2. Open "All Roles" dropdown
3. Note the circles:
   - All Roles has ● (filled)
   - Others have ○ (empty)
4. Select "Sales Rep"
5. Open dropdown again
6. Note the circles changed:
   - Sales Rep has ● (filled)
   - All Roles has ○ (empty)

EXPECTED:
✅ ● indicates currently selected option
✅ ○ indicates available but not selected
✅ Circles clearly distinguishable
```

---

## ✅ Quick Checklist

### Dropdown Functionality
- [ ] All 3 dropdowns visible (Role, Status, Department)
- [ ] Each dropdown shows counts: (X)
- [ ] Dropdowns open on click
- [ ] Options have ● or ○ indicators
- [ ] Selected option marked with ●
- [ ] Min widths appropriate (~200px)

### Filtering Behavior
- [ ] Selecting filter updates results instantly
- [ ] User cards filter correctly
- [ ] Counts accurate for each option
- [ ] Multiple filters work together (AND)
- [ ] Empty state shows when no matches

### Clear Filters Button
- [ ] Appears when any filter active
- [ ] Blue text with X icon
- [ ] Hover effect works (darker blue)
- [ ] Clicking resets all filters
- [ ] Disappears when all on "All"

### Results Counter
- [ ] Shows when filter active
- [ ] Format: "X result" or "X results"
- [ ] Updates in real-time
- [ ] Gray text, right of button

### Integration
- [ ] Works with search functionality
- [ ] Combines with other filters (AND)
- [ ] Member count updates correctly
- [ ] Smooth transitions

---

## 🎨 Visual Check

### Filter Bar Layout
```
┌────────────────────────────────────────────────────────────────────┐
│ [● All Roles (3) ▼] [● All Status (3) ▼] [● All Departments (3) ▼]│
└────────────────────────────────────────────────────────────────────┘

With Active Filters:
┌──────────────────────────────────────────────────────────────────────────────┐
│ [● Sales Manager (1) ▼] [● Active (3) ▼] [● Sales (2) ▼] [× Clear Filters] [1 result]│
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### Dropdown Open State
```
┌────────────────────────────┐
│ ○ All Roles (3)            │ ← Not selected now
├────────────────────────────┤
│ ○ CEO (0)                  │
│ ○ VP / Director (0)        │
│ ● Sales Manager (1)        │ ← Currently selected
│ ○ Sales Rep (1)            │
│ ○ Account Executive (1)    │
│ ○ Admin (0)                │
│ ○ Analyst (0)              │
│ ○ Support (0)              │
└────────────────────────────┘
```

---

## 🔄 Test Scenarios

### Scenario 1: Single Role Filter
```
ACTION: Select "Sales Manager"

RESULT:
✅ Shows: Sarah Chen only
✅ Dropdown: ● Sales Manager (1)
✅ Button: × Clear Filters
✅ Counter: 1 result
```

---

### Scenario 2: Single Department Filter
```
ACTION: Select "Sales"

RESULT:
✅ Shows: Sarah Chen + Michael Rodriguez
✅ Dropdown: ● Sales (2)
✅ Button: × Clear Filters
✅ Counter: 2 results
```

---

### Scenario 3: Role + Department
```
ACTION:
  - Role: Sales Manager
  - Department: Sales

RESULT:
✅ Shows: Sarah Chen only
✅ Role: ● Sales Manager (1)
✅ Dept: ● Sales (2)
✅ Counter: 1 result
```

---

### Scenario 4: Status Filter (All Active)
```
ACTION: Select "Active"

RESULT:
✅ Shows: All 3 users
✅ Status: ● Active (3)
✅ Counter: 3 results
```

---

### Scenario 5: Filter with No Matches
```
ACTION: Select "CEO"

RESULT:
✅ Empty state appears
✅ Role: ● CEO (0)
✅ Counter: 0 results
✅ Message: "No team members found"
```

---

### Scenario 6: Filter + Search
```
ACTION:
  - Type "sarah" in search
  - Select Department: "Sales"

RESULT:
✅ Shows: Sarah Chen only
✅ Matches both filters
✅ Counter: 1 result
```

---

## 📊 Count Verification

### Role Counts
```
Default team (3 members):
  All Roles: 3
  CEO: 0
  VP / Director: 0
  Sales Manager: 1 (Sarah)
  Sales Rep: 1 (Michael)
  Account Executive: 1 (Emily)
  Admin: 0
  Analyst: 0
  Support: 0
```

---

### Status Counts
```
Default team (3 members):
  All Status: 3
  Active: 3 (Sarah, Michael, Emily)
  Inactive: 0
  Pending: 0
  Suspended: 0
```

---

### Department Counts
```
Default team (3 members):
  All Departments: 3
  Sales: 2 (Sarah, Michael)
  Marketing: 1 (Emily)
  Customer Success: 0
  Operations: 0
  Executive: 0
  Engineering: 0
  Product: 0
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Move to next dropdown |
| Space/Enter | Open dropdown |
| Arrow Up/Down | Navigate options |
| Enter | Select option |
| Esc | Close dropdown |

---

## 🐛 Common Issues

### Issue: Counts seem wrong
**Check**: Counts reflect total users, not filtered
**Example**: "Sales (2)" means 2 total in Sales, even if filters hide some

### Issue: No results shown
**Check**: Multiple filters active (AND logic)
**Solution**: Clear filters to see all users

### Issue: Clear button doesn't appear
**Check**: All filters must be on "All"
**Note**: Button only shows when at least one filter is not "All"

### Issue: Counts don't update
**Refresh**: Counts are real-time; if stuck, refresh page
**Check**: JavaScript errors in console

---

## 🎉 Success Criteria

All tests pass if:
- ✅ All 3 dropdowns show counts
- ✅ Counts accurate for each option
- ✅ Visual indicators (●/○) work
- ✅ Filtering updates results instantly
- ✅ Multiple filters combine (AND logic)
- ✅ "Clear Filters" button appears/works
- ✅ Results counter shows correct count
- ✅ Empty state appears when needed
- ✅ Integration with search works
- ✅ Member count updates correctly

**Total Test Time**: ~3 minutes
**Difficulty**: Easy
**Status**: Production ready ✅

---

## 📱 Mobile Quick Test

1. Resize to 375px width
2. Dropdowns remain functional
3. Native mobile picker appears (iOS/Android)
4. Clear button touch-friendly (44px min)
5. Results counter visible

---

## 🔍 Debug Checklist

If something doesn't work:

1. **Check Console**: Any JavaScript errors?
2. **Verify Data**: Are team members loaded?
3. **Test Individual**: Try each filter alone
4. **Clear Cache**: Hard refresh (Ctrl+Shift+R)
5. **Check Build**: Run `npm run build`
6. **Verify Imports**: All icons imported (X)?

---

## 📝 Test Report Template

```
TESTER: __________
DATE: __________

✅ Filter Dropdowns:
  [ ] Role dropdown works
  [ ] Status dropdown works
  [ ] Department dropdown works
  [ ] Counts displayed
  [ ] Visual indicators (●/○)

✅ Filtering:
  [ ] Single filter works
  [ ] Multiple filters combine
  [ ] Results update instantly
  [ ] Empty state shows

✅ Clear Filters:
  [ ] Button appears when needed
  [ ] Clicking resets filters
  [ ] Button disappears after clear

✅ Results Counter:
  [ ] Shows when filtering
  [ ] Accurate count
  [ ] Proper format

✅ Integration:
  [ ] Works with search
  [ ] Member count accurate
  [ ] No errors in console

ISSUES FOUND:
_________________________
_________________________

OVERALL: PASS / FAIL
```

---

## 🚀 Quick Demo Script

**For presentations** (1 minute):

1. "Here are our team filters with live counts"
2. Click Role dropdown → "See counts for each role"
3. Select "Sales Manager" → "Sarah Chen appears"
4. "Notice the filled circle and Clear Filters button"
5. Click Department → Select "Sales"
6. "Filters combine: only Sales Managers in Sales"
7. Click "Clear Filters" → "Everything resets"
8. "Fast, intuitive, and shows exactly what you need"

**Time**: 60 seconds
**Impact**: High
**Simplicity**: Very clear
