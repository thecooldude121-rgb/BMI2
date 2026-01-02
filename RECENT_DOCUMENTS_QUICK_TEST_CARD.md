# Recent Documents - Quick Test Card
**⚡ 2-Minute Testing Guide**

---

## ✅ PASS Criteria (Must Work)

### **1. Basic Display**
- [ ] Section appears at top of Documents page
- [ ] Shows 5 compact cards (180px × 140px)
- [ ] Each card shows: icon, name, category badge, time
- [ ] Quick action buttons visible (eye, download)

### **2. Click Actions**
- [ ] Click card → Navigate to document detail
- [ ] Click eye icon → Toast: "Preview: {name}"
- [ ] Click download icon → Toast: "Downloading: {name}"
- [ ] Click "View All (15) →" → Filter to recent docs

### **3. Visual Feedback**
- [ ] Hover card → Lifts up, shadow increases
- [ ] Card border changes to blue on hover
- [ ] Full filename shows in tooltip

### **4. Collapse/Expand**
- [ ] Click ▲ icon → Section collapses to one line
- [ ] Click ▼ icon → Section expands

### **5. Filter Hiding**
- [ ] Apply ANY filter → Recent section HIDES
- [ ] Clear all filters → Recent section APPEARS
- [ ] Navigate to Deal docs → Recent section HIDES
- [ ] Return to All Documents → Recent section APPEARS

---

## 🚨 FAIL Scenarios (Must NOT Happen)

- [ ] ❌ Recent section shows when filters active
- [ ] ❌ Click card navigates AND shows preview
- [ ] ❌ Recent section shows in deal/account context
- [ ] ❌ Layout breaks on small screens
- [ ] ❌ Console errors on interaction
- [ ] ❌ Cards overlap or misaligned

---

## 🧪 5-Minute Smoke Test

```
1. Load /crm/documents
   → ✅ Recent section visible at top

2. Hover any card
   → ✅ Card lifts, shadow increases

3. Click first card
   → ✅ Navigate to document detail

4. Go back
   → ✅ Return to documents page

5. Click eye icon on second card
   → ✅ Toast: "Preview: TechStart_Contract.docx"

6. Click download icon on third card
   → ✅ Toast: "Downloading: BigCo_Discovery_Call_Transcript.pdf"

7. Click "View All (15) →"
   → ✅ Toast: "Showing all recent documents"
   → ✅ Filter changes to "recent"

8. Click "Proposal" category filter
   → ✅ Recent section HIDES

9. Click "Clear All Filters"
   → ✅ Recent section REAPPEARS

10. Click collapse button (▲)
    → ✅ Section shrinks to "Recent Documents (5) [▼]"

11. Click expand button (▼)
    → ✅ Section expands, shows 5 cards

TOTAL TIME: ~5 minutes
```

---

## 🎯 Critical Test Matrix

| Scenario | Recent Visible? | Expected | Result |
|----------|-----------------|----------|--------|
| Page load (no filters) | ✅ YES | YES | ☐ |
| Category filter applied | ❌ NO | NO | ☐ |
| Search query entered | ❌ NO | NO | ☐ |
| Deal context active | ❌ NO | NO | ☐ |
| All filters cleared | ✅ YES | YES | ☐ |

---

## 📱 Responsive Quick Check

**Desktop (1920px):**
- [ ] 5 cards visible in one row
- [ ] No horizontal scroll

**Tablet (1024px):**
- [ ] 4-5 cards visible
- [ ] Horizontal scroll available

**Mobile (375px):**
- [ ] 1-2 cards visible
- [ ] Swipe to scroll works

---

## 🐛 Known Issues (Non-Blocking)

1. **Accessibility:** Cards not keyboard navigable
   - Impact: Screen reader users affected
   - Workaround: Mouse/touch navigation works
   - Fix: Planned for next sprint

2. **Invalid Date:** Doesn't handle null dates explicitly
   - Impact: Minimal (edge case)
   - Workaround: Mock data always valid
   - Fix: Planned enhancement

---

## 🔍 Edge Cases to Check

- [ ] **Empty state:** Set recentDocuments = [] → Shows "No recent documents yet"
- [ ] **Long filename:** 100+ chars → Truncates with ellipsis, tooltip shows full
- [ ] **Rapid clicking:** Click multiple buttons quickly → All actions execute
- [ ] **Collapse while hovering:** Hover card, then collapse → No errors

---

## 📊 Performance Check

**Load Time:**
- [ ] Recent section appears < 100ms after page load
- [ ] No visible delay or flicker

**Interactions:**
- [ ] Hover response instant (< 50ms)
- [ ] Click navigation smooth (no lag)
- [ ] Collapse/expand animation smooth

---

## ✨ Visual Polish Check

**Colors:**
- [ ] File icons have distinct colors (PDF=blue, XLS=green, etc.)
- [ ] Category badges have proper colors (Proposal=blue, Contract=green)
- [ ] Hover border is blue (#3b82f6 / border-blue-300)

**Spacing:**
- [ ] 16px gap between cards
- [ ] 24px padding around section (px-6)
- [ ] 24px margin below section (mb-6)

**Typography:**
- [ ] Document names: 14px, font-medium, gray-900
- [ ] Times: 13px (text-xs), gray-500
- [ ] Section title: 16px (text-base), font-semibold

---

## 🔥 Stress Tests (Optional)

### **Test 1: Rapid State Changes**
```
1. Apply filter → Clear → Apply → Clear (repeat 10x)
2. Expected: Recent section shows/hides correctly
3. Check: No console errors, smooth transitions
```

### **Test 2: Navigation Storm**
```
1. Click card 1 → Back → Click card 2 → Back (repeat 5x)
2. Expected: Navigation works, no state corruption
3. Check: Recent section always displays correctly on return
```

### **Test 3: Multi-Action Combo**
```
1. Hover card 1
2. While hovering, click preview on card 2
3. Immediately click download on card 3
4. Click "View All"
5. Expected: All actions execute, no conflicts
```

---

## 📝 Test Results Template

```
Date: _____________
Tester: _____________
Browser: _____________
OS: _____________

Basic Display:        ☐ PASS  ☐ FAIL
Click Actions:        ☐ PASS  ☐ FAIL
Visual Feedback:      ☐ PASS  ☐ FAIL
Collapse/Expand:      ☐ PASS  ☐ FAIL
Filter Hiding:        ☐ PASS  ☐ FAIL
Responsive:           ☐ PASS  ☐ FAIL

Overall Status:       ☐ PASS  ☐ FAIL

Issues Found:
___________________________________________
___________________________________________
___________________________________________

Additional Notes:
___________________________________________
___________________________________________
___________________________________________
```

---

## 🎬 Recording Checklist

**If recording demo video:**
1. Start at /crm/documents (Recent section visible)
2. Hover to show lift effect
3. Click card to navigate
4. Go back
5. Click preview and download buttons
6. Show collapse/expand
7. Apply filter (section hides)
8. Clear filter (section appears)
9. Navigate to deal (context filter)
10. Return to documents

**Duration:** ~60 seconds

---

## 💡 Quick Fixes

**If Recent section doesn't appear:**
- Check: Are any filters active?
- Check: Is context filter set (deal_id in URL)?
- Check: Is `recentDocuments` array populated?
- Check: Is `isLoading` or `error` true?

**If cards don't display correctly:**
- Check: Mock data has 5 documents?
- Check: Each doc has all required fields?
- Check: Console for errors?

**If clicks don't work:**
- Check: onClick handlers attached?
- Check: e.stopPropagation() on action buttons?
- Check: navigate() function available?

---

## 🎯 Success Metrics

**Feature is successful if:**
- ✅ All 5 basic tests PASS
- ✅ No console errors during interaction
- ✅ Filter hiding logic 100% correct
- ✅ Visual polish looks professional
- ✅ Performance feels instant

**Ready for production if:**
- ✅ All critical tests PASS
- ✅ Known issues documented
- ✅ User experience smooth
- ✅ No data loss scenarios

---

**Quick Test Status:** ☐ PASS ☐ FAIL ☐ NEEDS WORK

**Tested By:** _________________ **Date:** _________
