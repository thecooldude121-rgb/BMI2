# Quick Actions Toolbar - Role-Based Test Card

## 🎯 Quick Visual Test (5 Minutes)

**Test URL:** `http://localhost:5173/team/2`

---

## Test Each Role - Check Button Visibility

### 1️⃣ CEO
**Switch to:** CEO

**Expected Buttons (6 total):**
```
✅ [📧 Send Email]
✅ [📞 Schedule Call]
✅ [🤝 Sched Meeting]
✅ [✅ Create Task]
✅ [📝 Add Note]
❌ [Share Document] ← Should NOT appear
✅ [⋮ More Actions]
```

**Click More Actions - Expected Menu:**
```
✅ View All Deals
✅ View All Contacts
✅ View All Activities
────────────────────
✅ View Calendar
✅ Schedule 1-on-1
```

**Result:** ☐ PASS / ☐ FAIL

---

### 2️⃣ VP
**Switch to:** VP

**Expected Buttons (6 total):**
```
✅ [📧 Send Email]
✅ [📞 Schedule Call]
✅ [🤝 Sched Meeting]
✅ [✅ Create Task]
✅ [📝 Add Note]
❌ [Share Document] ← Should NOT appear
✅ [⋮ More Actions]
```

**Click More Actions - Expected Menu:**
```
✅ View All Deals
✅ View All Contacts
✅ View All Activities
────────────────────
✅ View Calendar
✅ Schedule 1-on-1
```

**Result:** ☐ PASS / ☐ FAIL

---

### 3️⃣ Manager ⭐ (FULL ACCESS)
**Switch to:** Manager

**Expected Buttons (7 total - MOST COMPLETE):**
```
✅ [📧 Send Email]
✅ [📞 Schedule Call]
✅ [🤝 Sched Meeting]
✅ [✅ Create Task]
✅ [📝 Add Note]
✅ [📄 Share Document] ← UNIQUE to Manager!
✅ [⋮ More Actions]
```

**Click More Actions - Expected Menu:**
```
✅ View All Deals
✅ View All Contacts
✅ View All Activities
────────────────────
✅ View Calendar
✅ Schedule 1-on-1
```

**Result:** ☐ PASS / ☐ FAIL

---

### 4️⃣ Admin
**Switch to:** Admin

**Expected Buttons (6 total):**
```
✅ [📧 Send Email]
✅ [📞 Schedule Call]
✅ [🤝 Sched Meeting]
✅ [✅ Create Task]
❌ [Add Note] ← Should NOT appear (not a people manager)
✅ [📄 Share Document]
✅ [⋮ More Actions]
```

**Click More Actions - Expected Menu:**
```
✅ View All Deals
✅ View All Contacts
✅ View All Activities
────────────────────
✅ View Calendar
❌ Schedule 1-on-1 ← Should NOT appear
```

**Result:** ☐ PASS / ☐ FAIL

---

### 5️⃣ Rep (MINIMAL - EMAIL ONLY)
**Switch to:** Rep

**Expected Buttons (2 total - MINIMAL):**
```
✅ [📧 Send Email] ← ONLY action button
❌ [Schedule Call] ← Should NOT appear
❌ [Sched Meeting] ← Should NOT appear
❌ [Create Task] ← Should NOT appear
❌ [Add Note] ← Should NOT appear
❌ [Share Document] ← Should NOT appear
✅ [⋮ More Actions] ← Limited options
```

**Click More Actions - Expected Menu:**
```
❌ View All Deals ← Should NOT appear
❌ View All Contacts ← Should NOT appear
❌ View All Activities ← Should NOT appear
────────────────────
✅ Request Access
```

**Expected Toast:** "Limited access - contact manager"

**Result:** ☐ PASS / ☐ FAIL

---

### 6️⃣ Analyst (READ-ONLY)
**Switch to:** Analyst

**Expected Buttons (2 total - EXPORT FOCUS):**
```
✅ [📧 Send Email]
❌ [Schedule Call] ← Should NOT appear
❌ [Sched Meeting] ← Should NOT appear
❌ [Create Task] ← Should NOT appear
❌ [Add Note] ← Should NOT appear
❌ [Share Document] ← Should NOT appear
✅ [⋮ More Actions] ← Export options
```

**Click More Actions - Expected Menu:**
```
✅ View All Deals (read-only)
✅ View All Contacts (read-only)
✅ View All Activities (read-only)
────────────────────
✅ Export Data
```

**Expected Toast:** "Export feature coming soon"

**Result:** ☐ PASS / ☐ FAIL

---

### 7️⃣ Support (NO ACCESS)
**Switch to:** Support

**Expected Toolbar:**
```
❌ NO TOOLBAR VISIBLE
❌ No "Quick Actions:" label
❌ No buttons at all
```

**Expected:** Entire toolbar section is hidden

**Result:** ☐ PASS / ☐ FAIL

---

## 📊 Quick Reference Matrix

| Role | Buttons | Email | Call | Meeting | Task | Note | Share | More |
|------|---------|-------|------|---------|------|------|-------|------|
| CEO | 6 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| VP | 6 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Manager** | **7** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | 6 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Rep | 2 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| Analyst | 2 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| Support | 0 | — | — | — | — | — | — | — |

---

## ✅ Quick Checklist

### Full Access Roles (5-7 buttons):
- [ ] **CEO** - 6 buttons (no Share)
- [ ] **VP** - 6 buttons (no Share)
- [ ] **Manager** - 7 buttons (ALL)
- [ ] **Admin** - 6 buttons (no Note)

### Limited Access Roles (2 buttons):
- [ ] **Rep** - 2 buttons (Email + Request)
- [ ] **Analyst** - 2 buttons (Email + Export)

### No Access:
- [ ] **Support** - 0 buttons (hidden)

---

## 🎯 Key Differentiators to Verify

### 1. Share Document Button
- ✅ **Manager:** Has it
- ✅ **Admin:** Has it
- ❌ **CEO:** Does NOT have it
- ❌ **VP:** Does NOT have it
- ❌ **All others:** Do NOT have it

### 2. Add Note Button
- ✅ **CEO:** Has it
- ✅ **VP:** Has it
- ✅ **Manager:** Has it
- ❌ **Admin:** Does NOT have it
- ❌ **All others:** Do NOT have it

### 3. Action Buttons (Call, Meeting, Task)
- ✅ **CEO, VP, Manager, Admin:** Have all
- ❌ **Rep, Analyst:** Do NOT have any

### 4. Schedule 1-on-1 (in dropdown)
- ✅ **CEO, VP, Manager:** Have it
- ❌ **Admin:** Does NOT have it
- ❌ **All others:** Do NOT have it

### 5. Special Dropdown Options
- **Rep:** "Request Access" only
- **Analyst:** "Export Data" added
- **Support:** No dropdown (toolbar hidden)

---

## 💡 Testing Tips

### Quick Visual Scan
1. Count the buttons
2. Look for Share Document (Manager/Admin only)
3. Look for Add Note (CEO/VP/Manager only)
4. Check dropdown for special options

### Expected Button Counts
- **7 buttons:** Manager only ⭐
- **6 buttons:** CEO, VP, Admin
- **2 buttons:** Rep, Analyst
- **0 buttons:** Support

### Common Mistakes to Watch For
- ❌ CEO having Share Document
- ❌ VP having Share Document
- ❌ Admin having Add Note
- ❌ Rep having any action buttons
- ❌ Analyst having any action buttons
- ❌ Support seeing ANY toolbar

---

## 📝 Test Results

**Date:** _____________
**Tester:** _____________

**Roles Tested:** _____ / 7

**Passed:** _____ / 7
**Failed:** _____ / 7

**Issues Found:**
```
[List any discrepancies here]
```

---

## 🎉 Success Criteria

**ALL roles must show correct buttons:**
- [ ] CEO: 6 buttons (no Share)
- [ ] VP: 6 buttons (no Share)
- [ ] Manager: 7 buttons (ALL)
- [ ] Admin: 6 buttons (no Note)
- [ ] Rep: 2 buttons (Email + More)
- [ ] Analyst: 2 buttons (Email + More)
- [ ] Support: 0 buttons (hidden)

**Dropdown menus correct:**
- [ ] Manager/CEO/VP have Schedule 1-on-1
- [ ] Admin does NOT have Schedule 1-on-1
- [ ] Analyst has Export Data
- [ ] Rep has Request Access

**All interactions work:**
- [ ] Buttons open correct modals
- [ ] Toast notifications appear
- [ ] Dropdowns close after selection

---

**Test Complete?** ☐ Yes / ☐ No

**Ready for Production?** ☐ Yes / ☐ No
