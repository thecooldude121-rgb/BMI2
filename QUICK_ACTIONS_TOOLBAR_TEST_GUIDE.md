# Quick Actions Toolbar - Visual Test Guide

## 🚀 Quick Test (3 Minutes)

### Test URL
```
http://localhost:5173/team/2
```

---

## Test 1: Toolbar Visibility

### ✅ For Manager Role
1. Set role switcher to: **Manager**
2. Scroll to top of profile
3. **Look for toolbar below profile header**

**Expected Result:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Quick Actions:  [📧 Send Email] [📞 Schedule Call]             │
│                 [🤝 Sched Meeting] [✅ Create Task]            │
│                 [📝 Add Note] [📄 Share Document]              │
│                 [⋮ More Actions]                                │
└─────────────────────────────────────────────────────────────────┘
```

✅ PASS / ❌ FAIL: _____

---

### ✅ For CEO Role
1. Set role switcher to: **CEO**
2. **Toolbar should be visible** with all buttons

✅ PASS / ❌ FAIL: _____

---

### ✅ For Admin Role
1. Set role switcher to: **Admin**
2. **Toolbar should be visible** with all buttons

✅ PASS / ❌ FAIL: _____

---

### ❌ For Analyst Role
1. Set role switcher to: **Analyst**
2. **Toolbar should be HIDDEN**

✅ PASS / ❌ FAIL: _____

---

### ❌ For Rep Role
1. Set role switcher to: **Rep**
2. **Toolbar should be HIDDEN**

✅ PASS / ❌ FAIL: _____

---

## Test 2: Sticky Behavior

### Steps:
1. Set role to: **Manager**
2. Scroll to top of page
3. **Slowly scroll down**
4. Watch the toolbar

**Expected Result:**
- Toolbar should **stick to top** of viewport
- Should remain visible while scrolling
- Should stay above all content (z-index: 10)

**Visual Check:**
```
[Toolbar stays here] ← Always at top
─────────────────────────────────────
Content scrolls underneath
• Performance Metrics
• Direct Reports
• Activities
• etc.
```

✅ PASS / ❌ FAIL: _____

---

## Test 3: Button Interactions

### Test 3.1: Send Email Button
1. Click **📧 Send Email**
2. **Expected:** Email modal opens
3. **Expected:** Email field pre-filled with member email
4. Close modal

✅ PASS / ❌ FAIL: _____

---

### Test 3.2: Schedule Call Button
1. Click **📞 Schedule Call**
2. **Expected:** Call scheduling modal opens
3. Close modal

✅ PASS / ❌ FAIL: _____

---

### Test 3.3: Schedule Meeting Button
1. Click **🤝 Sched Meeting**
2. **Expected:** Meeting scheduler modal opens
3. Close modal

✅ PASS / ❌ FAIL: _____

---

### Test 3.4: Create Task Button
1. Click **✅ Create Task**
2. **Expected:** Task creation modal opens
3. **Verify Fields:**
   - [ ] Task Title input
   - [ ] Assign To dropdown
   - [ ] Due Date picker
   - [ ] Priority dropdown
   - [ ] Description textarea
4. Close modal

✅ PASS / ❌ FAIL: _____

---

### Test 3.5: Add Note Button (Manager Only)
1. Ensure role is: **Manager** or **CEO**
2. Click **📝 Add Note**
3. **Expected:** Coaching note editor opens
4. Close modal

✅ PASS / ❌ FAIL: _____

---

### Test 3.6: Share Document Button
1. Click **📄 Share Document**
2. **Expected:** Share document modal opens
3. **Verify Fields:**
   - [ ] Document dropdown
   - [ ] Share with (email) input
   - [ ] Message textarea
   - [ ] Allow editing checkbox
4. Close modal

✅ PASS / ❌ FAIL: _____

---

### Test 3.7: More Actions Dropdown
1. Click **⋮ More Actions**
2. **Expected:** Dropdown menu appears

**Verify Menu Items:**
- [ ] 💼 View All Deals
- [ ] 👥 View All Contacts
- [ ] 📊 View All Activities
- [ ] (divider line)
- [ ] 📅 View Calendar
- [ ] 🤝 Schedule 1-on-1 (if Manager)

✅ PASS / ❌ FAIL: _____

---

### Test 3.8: Dropdown Actions
1. Click **⋮ More Actions**
2. Click **View All Deals**
3. **Expected:** Navigate to deals page
4. **Expected:** Toast notification appears

✅ PASS / ❌ FAIL: _____

---

## Test 4: Visual Design

### Toolbar Style Checklist
- [ ] White background
- [ ] Bottom border (light gray)
- [ ] Subtle shadow
- [ ] Padding: ~24px horizontal, ~16px vertical
- [ ] "Quick Actions:" label visible

### Button Style Checklist
- [ ] Light gray background (slate-100)
- [ ] Rounded corners
- [ ] Icons 16x16px
- [ ] Text: small, medium weight
- [ ] Gap between icon and text

### Hover Effects
1. Hover over **Send Email** button
2. **Expected:** Background darkens slightly (slate-200)
3. **Expected:** Smooth transition
4. Repeat for other buttons

✅ PASS / ❌ FAIL: _____

---

## Test 5: Responsive Behavior

### On Different Roles

#### Manager
- [ ] All 7 action buttons visible
- [ ] Add Note button included
- [ ] More Actions dropdown works

#### CEO
- [ ] All 7 action buttons visible
- [ ] Add Note button included
- [ ] Schedule 1-on-1 in dropdown

#### Admin
- [ ] All action buttons visible
- [ ] Can create tasks
- [ ] Cannot add coaching notes (button hidden)

#### Analyst
- [ ] Toolbar completely hidden
- [ ] No action buttons visible

#### Rep
- [ ] Toolbar completely hidden
- [ ] Clean profile view

---

## Test 6: Toast Notifications

### For Each Action:
1. Click **Schedule Call**
2. **Expected:** Toast appears: "Scheduling call with Sarah Chen"
3. Verify toast style and position

Repeat for:
- [ ] Create Task → "Creating task"
- [ ] Add Note → "Adding coaching note"
- [ ] Share Document → "Opening share document"

✅ PASS / ❌ FAIL: _____

---

## Test 7: More Actions Dropdown Behavior

### Dropdown Opening
1. Click **More Actions** button
2. **Expected:** Dropdown appears below button
3. **Expected:** Dropdown is right-aligned
4. **Expected:** White background with shadow

✅ PASS / ❌ FAIL: _____

---

### Dropdown Closing
1. Open dropdown
2. Click any menu item
3. **Expected:** Dropdown closes
4. **Expected:** Action executes

✅ PASS / ❌ FAIL: _____

---

### Outside Click (Manual Test)
1. Open dropdown
2. Click somewhere else on page
3. **Expected:** Dropdown should close (if implemented)

✅ PASS / ❌ FAIL: _____

---

## Visual Reference

### Expected Toolbar Appearance

```
┌──────────────────────────────────────────────────────────────────────┐
│ Quick Actions:   ┌─────────────┐ ┌──────────────┐ ┌───────────────┐│
│                  │ 📧          │ │ 📞           │ │ 🤝            ││
│                  │ Send Email  │ │Schedule Call │ │Sched Meeting  ││
│                  └─────────────┘ └──────────────┘ └───────────────┘│
│                                                                      │
│                  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐│
│                  │ ✅          │ │ 📝           │ │ 📄            ││
│                  │ Create Task │ │ Add Note     │ │Share Document ││
│                  └─────────────┘ └──────────────┘ └───────────────┘│
│                                                                      │
│                  ┌───────────────┐                                  │
│                  │ ⋮             │                                  │
│                  │ More Actions  │                                  │
│                  └───────────────┘                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Expected More Actions Dropdown

```
                           ┌────────────────────────┐
                           │ 💼 View All Deals     │
                           │ 👥 View All Contacts  │
                           │ 📊 View All Activities│
                           ├────────────────────────┤
                           │ 📅 View Calendar      │
                           │ 🤝 Schedule 1-on-1    │
                           └────────────────────────┘
```

---

## Quick Checklist Summary

**Toolbar Visibility:**
- [ ] Visible for Manager
- [ ] Visible for CEO
- [ ] Visible for Admin
- [ ] Hidden for Analyst
- [ ] Hidden for Rep

**Sticky Behavior:**
- [ ] Sticks to top when scrolling
- [ ] Always accessible
- [ ] Stays above content

**Button Interactions:**
- [ ] Send Email works
- [ ] Schedule Call works
- [ ] Schedule Meeting works
- [ ] Create Task works
- [ ] Add Note works (Manager/CEO)
- [ ] Share Document works
- [ ] More Actions dropdown works

**Visual Design:**
- [ ] Correct colors
- [ ] Proper spacing
- [ ] Hover effects
- [ ] Icon sizes correct

**Functionality:**
- [ ] All modals open correctly
- [ ] Toast notifications appear
- [ ] Navigation works
- [ ] Dropdown closes after selection

---

## Test Results

**Total Tests:** 15
**Passed:** _____
**Failed:** _____
**Date:** _____________
**Tester:** _____________

---

## Notes

Use this space for observations or issues:

```
[Your notes here]
```

---

## Common Issues to Watch For

| Issue | What to Check |
|-------|---------------|
| Toolbar not sticking | Check `position: sticky` and `top-0` |
| Hidden for wrong roles | Verify `canTakeDirectReportActions` logic |
| Buttons not clickable | Check z-index and event handlers |
| Dropdown not positioning | Check `absolute` positioning in dropdown |
| Modals not opening | Verify state variables and handlers |
| Icons wrong size | Check `w-4 h-4` classes |

---

**All tests passing?** ✅ Ready for production!
