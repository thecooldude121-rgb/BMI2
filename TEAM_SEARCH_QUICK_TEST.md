# Team Search - Quick Test Guide

## 🎯 2-Minute Test

### Step 1: Basic Name Search (20 seconds)
```
1. Navigate to Settings → Team Management
2. Click in the search field
3. Type "sarah"

EXPECTED:
✅ Only Sarah Chen card appears
✅ Count shows "Showing 1 of 3 users"
✅ × button appears on right side
✅ Results update instantly (no delay)
```

---

### Step 2: Email Search (15 seconds)
```
1. Click × button to clear
2. Type "@bmi.com"

EXPECTED:
✅ All 3 users appear (all have @bmi.com)
✅ Count shows "Showing 3 of 3 users"
✅ Filters across all email addresses
```

---

### Step 3: Phone Search (15 seconds)
```
1. Clear search (click ×)
2. Type "555-0001"

EXPECTED:
✅ Only Sarah Chen appears
✅ Matches her phone number
✅ Count updates to "Showing 1 of 3 users"
```

---

### Step 4: Empty State (20 seconds)
```
1. Clear search
2. Type "nonexistent"

EXPECTED:
✅ Empty state appears
✅ Large search icon (gray circle)
✅ Message: "No results match your search for 'nonexistent'"
✅ "Clear All Filters" button visible
```

---

### Step 5: Clear with Escape (15 seconds)
```
1. Type "sarah"
2. Press Escape key

EXPECTED:
✅ Search field clears
✅ All 3 users reappear
✅ Focus removed from search field
✅ × button disappears
```

---

### Step 6: Clear All Filters (15 seconds)
```
1. Type "xyz" (trigger empty state)
2. Click "Clear All Filters" button

EXPECTED:
✅ Search cleared
✅ All filters reset
✅ All users visible
✅ Empty state disappears
```

---

## ✅ Quick Checklist

### Search Works
- [ ] Type instantly filters results
- [ ] No lag or delay
- [ ] Member count updates
- [ ] × button appears when typing

### Multi-Field Search
- [ ] Searches name ("sarah")
- [ ] Searches email ("@bmi.com")
- [ ] Searches phone ("555-0001")
- [ ] Searches role ("manager")
- [ ] Searches department ("sales")

### Clear Functions
- [ ] × button clears search
- [ ] Escape key clears search
- [ ] "Clear All Filters" resets everything

### Empty State
- [ ] Shows when no results
- [ ] Displays search query
- [ ] Clear button works

---

## 🎨 Visual Check

### Search Input
```
┌─────────────────────────────────────────────┐
│ 🔍 Search by name, email, phone...     [×] │
└─────────────────────────────────────────────┘

Elements:
✓ Search icon (left, gray)
✓ Placeholder text (gray)
✓ × button (right, when typing)
✓ Blue focus ring (when active)
✓ Width: ~384px
```

---

### Empty State
```
┌──────────────────────────────────────┐
│                                      │
│        🔍 (in gray circle)           │
│                                      │
│    No team members found             │
│                                      │
│  No results match your search        │
│  for "nonexistent"                   │
│                                      │
│  Try adjusting your search terms     │
│  or filters                          │
│                                      │
│    [Clear All Filters]               │
│     (blue button)                    │
│                                      │
└──────────────────────────────────────┘
```

---

## 🔄 Test Scenarios

### Scenario 1: Sales Manager Search
```
INPUT: "manager"
RESULT: Sarah Chen (Sales Manager)
WHY: Matches job title
```

---

### Scenario 2: Department Search
```
INPUT: "sales"
RESULT: Sarah Chen, Michael Rodriguez
WHY: Both in Sales department
```

---

### Scenario 3: Partial Name
```
INPUT: "che"
RESULT: Sarah Chen
WHY: "che" is in "Chen"
```

---

### Scenario 4: Case Insensitive
```
INPUT: "SARAH"
RESULT: Sarah Chen
WHY: Search ignores case
```

---

### Scenario 5: Email Domain
```
INPUT: "bmi"
RESULT: All users
WHY: All have @bmi.com emails
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Type | Start filtering |
| Escape | Clear search |
| Tab | Next element |

---

## 📱 Mobile Test (Optional)

1. Resize browser to 375px
2. Search field takes full width
3. × button easy to tap
4. Empty state centers properly
5. Text remains readable

---

## 🐛 Common Issues

### Issue: Search doesn't clear
**Solution**: Click × button or press Escape

### Issue: No results shown
**Check**: Filters might be active (role, status, dept)
**Solution**: Click "Clear All Filters"

### Issue: Unexpected results
**Note**: Search looks across 6 fields (name, email, phone, title, dept, role)

---

## 🎉 Success Criteria

All tests pass if:
- ✅ Search filters instantly
- ✅ × button clears search
- ✅ Escape key works
- ✅ Empty state appears correctly
- ✅ "Clear All Filters" resets everything
- ✅ Multi-field search working
- ✅ Case-insensitive matching
- ✅ Member count accurate

**Total Test Time**: ~2 minutes
**Difficulty**: Easy
**Status**: Production ready ✅
