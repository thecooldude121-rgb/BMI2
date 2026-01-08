# CRM Sync Clickable Interactions - 5-Minute Quick Test

## 🚀 Fast Interactive Testing Guide

Test all clickable interactions in 5 minutes or less.

---

## ⚡ Quick Test 1: Accordion Expand/Collapse (30 seconds)

**Steps**:
1. Open modal: Navigate to Sarah Lee → Click "Qualify & Sync"
2. Click "Company Information (8/8 selected)" → Section expands ▼
3. Click "BANT Assessment (4/4 selected)" → Section expands ▼
4. Click "Company Information" again → Section collapses ▶
5. Click "Contact Information (5/5 selected)" → Section collapses ▶

**Expected**:
- ✅ Chevron icons rotate smoothly
- ✅ Field lists slide in/out
- ✅ Multiple sections can be open simultaneously
- ✅ Smooth animations, no glitches

---

## ⚡ Quick Test 2: Field Selection Checkboxes (45 seconds)

**Steps**:
1. Open modal
2. Contact Information is expanded by default
3. Uncheck "Mobile Phone" checkbox
4. Watch: Checkmark turns gray, text becomes lighter
5. Watch: Header updates from "(5/5 selected)" → "(4/5 selected)"
6. Re-check "Mobile Phone"
7. Watch: Checkmark turns green, text becomes darker
8. Watch: Header updates back to "(5/5 selected)"
9. Expand "BANT Assessment"
10. Uncheck "Need" and "Timeline"
11. Watch: Header shows "(2/4 selected)"

**Expected**:
- ✅ Checkboxes toggle correctly
- ✅ Visual feedback instant
- ✅ Checkmark color changes (green ↔ gray)
- ✅ Text color changes (dark ↔ light)
- ✅ Count updates in real-time
- ✅ No lag or delays

---

## ⚡ Quick Test 3: Critical Field Warning (1 minute)

**Steps**:
1. Open modal
2. Expand "Contact Information"
3. Find "Email*" (red asterisk = critical)
4. Uncheck "Email*"
5. Click "Confirm & Sync to CRM" button
6. Warning dialog appears: "Warning: You have deselected critical fields (Email)..."
7. Click "Cancel" on warning
8. Verify: Still on confirmation modal
9. Re-check "Email*"
10. Click "Confirm & Sync to CRM" again
11. Verify: No warning this time (would proceed to progress modal)

**Expected**:
- ✅ Red asterisk visible on critical fields
- ✅ Warning appears when critical field unchecked
- ✅ Warning message lists "Email"
- ✅ Cancel keeps you on modal
- ✅ No warning when all critical fields checked

---

## ⚡ Quick Test 4: Multiple Critical Fields Warning (1 minute)

**Steps**:
1. Open modal
2. Uncheck "Email*" in Contact Information
3. Expand "BANT Assessment"
4. Uncheck "Budget*" (critical)
5. Uncheck "Authority*" (critical)
6. Expand "Qualification Notes"
7. Uncheck "AI Score*" (critical)
8. Click "Confirm & Sync to CRM"
9. Warning dialog shows: "Email, Budget, Authority, AI Score"
10. Click "OK" to proceed anyway

**Expected**:
- ✅ Single warning lists all 4 critical fields
- ✅ Warning message clear and readable
- ✅ OK allows proceeding with partial sync
- ✅ All 4 deselected critical fields listed

**Critical Fields to Test**:
- Email* (Contact Information)
- Budget* (BANT Assessment)
- Authority* (BANT Assessment)
- AI Score* (Qualification Notes & History)

---

## ⚡ Quick Test 5: Cancel Button (30 seconds)

**Steps**:
1. Open modal
2. Make changes:
   - Uncheck 3 random fields
   - Expand 2 more sections
3. Click "Cancel" button
4. Modal closes immediately
5. Verify: Return to qualification page
6. Open modal again
7. Verify: All fields are selected (5/5, 8/8, etc.)
8. Verify: Only Contact Information is expanded

**Expected**:
- ✅ Cancel closes modal instantly
- ✅ No sync happens
- ✅ State resets on reopen
- ✅ Back to default: all selected, 1 section expanded

---

## ⚡ Quick Test 6: Visual Hover States (30 seconds)

**Steps**:
1. Open modal
2. Hover over "Confirm & Sync to CRM" button → Darkens
3. Hover over "Cancel" button → Light gray background
4. Hover over "Company Information" header → Light gray background
5. Hover over any checkbox → Cursor becomes pointer
6. Hover over field text → No special effect (correct)

**Expected**:
- ✅ Buttons have hover states
- ✅ Accordion headers have hover states
- ✅ Checkboxes show pointer cursor
- ✅ Smooth transitions, no jumps

---

## ⚡ Quick Test 7: All Sections Expanded (30 seconds)

**Steps**:
1. Open modal
2. Expand all 5 sections one by one:
   - Contact Information (already open)
   - Company Information
   - BANT Assessment
   - Professional Details
   - Qualification Notes & History
3. Scroll through entire modal
4. Verify: All 30 fields visible
5. Verify: No layout issues
6. Collapse all 5 sections

**Expected**:
- ✅ All sections can be open simultaneously
- ✅ Scroll works smoothly
- ✅ No visual glitches
- ✅ Sticky header/footer remain fixed
- ✅ 30 total fields visible

---

## ⚡ Quick Test 8: Selection Persistence (30 seconds)

**Steps**:
1. Open modal
2. Expand "Professional Details"
3. Uncheck "Skills" and "Education"
4. Verify: Header shows "(5/7 selected)"
5. Collapse "Professional Details"
6. Verify: Header STILL shows "(5/7 selected)" (state persisted)
7. Expand "Professional Details" again
8. Verify: Same 2 fields still unchecked
9. Re-check both fields
10. Verify: Header returns to "(7/7 selected)"

**Expected**:
- ✅ Selection state persists through collapse/expand
- ✅ Count shows correct state even when collapsed
- ✅ Fields remain unchecked when section reopened

---

## ⚡ Quick Test 9: Real-Time Count Updates (30 seconds)

**Steps**:
1. Open modal with Contact Information expanded
2. Watch header: "(5/5 selected)"
3. Uncheck 1st field → "(4/5 selected)"
4. Uncheck 2nd field → "(3/5 selected)"
5. Uncheck 3rd field → "(2/5 selected)"
6. Re-check 1st field → "(3/5 selected)"
7. Re-check 2nd field → "(4/5 selected)"
8. Re-check 3rd field → "(5/5 selected)"

**Expected**:
- ✅ Count updates instantly with each click
- ✅ No delay or lag
- ✅ Accurate count at all times
- ✅ Format: "(X/Y selected)" where X ≤ Y

---

## ⚡ Quick Test 10: Critical Field Asterisk Display (30 seconds)

**Steps**:
1. Open modal
2. Find fields with red asterisk (*):
   - Contact Info: "Email*"
   - BANT: "Budget*", "Authority*"
   - Notes: "AI Score*"
3. Verify: Red asterisk appears after field name
4. Verify: Only these 4 fields have asterisks
5. Count total: Should be 4 critical fields out of 30 total

**Expected**:
- ✅ Red asterisk (*) visible after critical field names
- ✅ Only 4 fields have asterisks
- ✅ Asterisk remains visible even when field unchecked

---

## 📊 Quick Visual Checklist

### **Section Headers (5 total)**
- [ ] Contact Information (5/5 selected)
- [ ] Company Information (8/8 selected)
- [ ] BANT Assessment (4/4 selected)
- [ ] Professional Details (7/7 selected)
- [ ] Qualification Notes & History (6/6 selected)

### **Critical Fields (4 total)**
- [ ] Email* (Contact Information)
- [ ] Budget* (BANT Assessment)
- [ ] Authority* (BANT Assessment)
- [ ] AI Score* (Qualification Notes)

### **Interactive Elements**
- [ ] Confirm button (green, hover darkens)
- [ ] Cancel button (white, hover gray)
- [ ] 5 accordion headers (hover gray)
- [ ] 30 checkboxes (all clickable)
- [ ] Chevron icons (rotate on click)

---

## ✅ Pass/Fail Criteria

**PASS if**:
- ✅ All accordions expand/collapse smoothly
- ✅ All checkboxes toggle correctly
- ✅ Counts update in real-time
- ✅ Critical field warning appears when needed
- ✅ Cancel closes modal without syncing
- ✅ Visual states change correctly (colors, icons)
- ✅ No console errors
- ✅ No visual glitches or layout issues

**FAIL if**:
- ❌ Accordions don't expand/collapse
- ❌ Checkboxes don't toggle
- ❌ Counts don't update
- ❌ Warning doesn't appear for critical fields
- ❌ Visual states incorrect
- ❌ Console errors present
- ❌ Layout breaks or glitches occur

---

## 🎯 Complete Test in 5 Minutes

**1 min**: Tests 1-2 (Accordions + Checkboxes)
**1 min**: Test 3 (Critical field warning - single)
**1 min**: Test 4 (Critical field warning - multiple)
**30 sec**: Test 5 (Cancel button)
**30 sec**: Test 6 (Hover states)
**30 sec**: Test 7 (All sections)
**30 sec**: Test 8 (Persistence)
**30 sec**: Test 9 (Real-time counts)
**30 sec**: Test 10 (Asterisks)

**Total: 5 minutes**

---

## 🐛 Common Issues to Watch For

1. **Checkbox doesn't toggle**: Check onChange handler
2. **Count doesn't update**: Check state management
3. **Warning doesn't appear**: Check critical fields array
4. **Colors don't change**: Check conditional classes
5. **Accordion won't expand**: Check toggleSection function
6. **Layout breaks**: Check flex/grid properties
7. **Cancel doesn't reset**: Check initial state

---

## 📝 Quick Test Report Template

```
CRM Sync Clickable Interactions Test
Date: ___________
Tested By: ___________

Test 1 - Accordions:           [ ] Pass  [ ] Fail
Test 2 - Checkboxes:          [ ] Pass  [ ] Fail
Test 3 - Critical Warning:    [ ] Pass  [ ] Fail
Test 4 - Multiple Critical:   [ ] Pass  [ ] Fail
Test 5 - Cancel Button:       [ ] Pass  [ ] Fail
Test 6 - Hover States:        [ ] Pass  [ ] Fail
Test 7 - All Sections:        [ ] Pass  [ ] Fail
Test 8 - Persistence:         [ ] Pass  [ ] Fail
Test 9 - Real-Time Counts:    [ ] Pass  [ ] Fail
Test 10 - Asterisks:          [ ] Pass  [ ] Fail

Overall: [ ] PASS  [ ] FAIL

Issues Found:
_________________________________
_________________________________

Notes:
_________________________________
_________________________________
```

---

**Status**: ✅ Quick Test Guide Ready
**Time Required**: 5 minutes
**Coverage**: All interactive features

---

*Quick Test v1.0*
*January 8, 2026*
