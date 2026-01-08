# Validation Modals - 5-Minute Quick Test

## 🎯 Quick Test Guide

Test all clickable interactions in the validation modals in under 5 minutes.

---

## 🚀 Setup (30 seconds)

1. Navigate to: `/lead-gen/leads/sarah-lee/qualify`
2. Scroll down to BANT section
3. Note current field states

---

## ✅ Test 1: IncompleteBantModal (90 seconds)

### Setup
Clear all BANT fields to empty state.

### Test "Complete BANT Assessment"

1. Click "Qualify & Sync" button
2. **Expect**: IncompleteBantModal appears
3. **Verify**: Shows "0/20" score
4. **Verify**: Shows all 4 fields missing
5. Click "✏️ Complete BANT Assessment"
6. **Expect**: Modal closes smoothly
7. **Expect**: Page scrolls to Budget field
8. **Expect**: Budget field has blue glow
9. **Expect**: Budget field has light blue background
10. **Expect**: First radio button is focused (blue ring)
11. **Wait 2 seconds**
12. **Expect**: Blue glow fades away
13. ✅ **PASS** if all expectations met

### Test "Save as Draft"

1. Click "Qualify & Sync" again
2. IncompleteBantModal appears
3. Click "💾 Save as Draft"
4. **Expect**: Modal closes
5. **Expect**: Toast: "💾 Draft saved - Complete BANT when ready"
6. **Expect**: Stay on page (no navigation)
7. ✅ **PASS** if all expectations met

---

## ✅ Test 2: PartialBantModal - Budget Missing (90 seconds)

### Setup
Fill 3 fields, leave Budget empty:
- Authority: Decision Maker
- Need: Urgent
- Timeline: Immediate
- Budget: **Empty**

### Test "Complete Budget"

1. Click "Qualify & Sync"
2. **Expect**: PartialBantModal appears
3. **Verify**: Shows "15/20" score
4. **Verify**: Button says "✏️ Complete Budget"
5. **Verify**: Shows 3 completed, 1 missing
6. Click "✏️ Complete Budget"
7. **Expect**: Modal closes
8. **Expect**: Scrolls to Budget field (not another field!)
9. **Expect**: Budget field highlighted (blue glow)
10. **Expect**: First Budget radio focused
11. **Wait 2 seconds**
12. **Expect**: Highlight fades
13. ✅ **PASS** if all expectations met

### Test "Qualify Anyway"

1. Click "Qualify & Sync" again
2. PartialBantModal appears
3. Click "✅ Qualify Anyway (15/20)"
4. **Expect**: PartialBantModal closes
5. **Expect**: QualifyLeadModal opens
6. **Expect**: Shows score in confirmation
7. Click X to close modal
8. ✅ **PASS** if all expectations met

### Test "Save as Draft"

1. Click "Qualify & Sync" again
2. Click "💾 Save as Draft"
3. **Expect**: Modal closes
4. **Expect**: Toast appears
5. **Expect**: Stay on page
6. ✅ **PASS** if all expectations met

---

## ✅ Test 3: PartialBantModal - Timeline Missing (60 seconds)

### Setup
Fill 3 fields, leave Timeline empty:
- Budget: Confirmed
- Authority: Decision Maker
- Need: Important
- Timeline: **Empty**

### Test "Complete Timeline"

1. Click "Qualify & Sync"
2. **Expect**: PartialBantModal appears
3. **Verify**: Button says "✏️ Complete Timeline"
4. Click "✏️ Complete Timeline"
5. **Expect**: Scrolls to Timeline field (BOTTOM of page)
6. **Expect**: Timeline field highlighted
7. **Expect**: Timeline radio focused
8. ✅ **PASS** if scrolls to correct field

---

## ✅ Test 4: Smart Field Detection (60 seconds)

### Setup
Leave multiple fields empty:
- Budget: **Empty**
- Authority: **Empty**
- Need: Urgent
- Timeline: **Empty**

### Test Priority

1. Click "Qualify & Sync"
2. PartialBantModal appears
3. **Verify**: Button says "✏️ Complete Budget"
4. **Reasoning**: Budget is first in priority order
5. Click button
6. **Expect**: Scrolls to Budget (not Authority or Timeline)
7. ✅ **PASS** if prioritizes correctly

**Priority Order**: Budget → Authority → Need → Timeline

---

## ✅ Test 5: Visual Effects (30 seconds)

### Quick Visual Check

1. Trigger any modal
2. Click any "Complete [Field]" button
3. Observe the target field:

**Check**:
- [ ] Smooth scroll animation (not instant)
- [ ] Blue glow around entire field card
- [ ] Light blue background tint
- [ ] Glow is visible and noticeable
- [ ] Not too bright or jarring
- [ ] Fades smoothly after 2 seconds
- [ ] Focus ring on radio button

✅ **PASS** if all visual checks passed

---

## ✅ Test 6: Toast Messages (30 seconds)

### Test Toast Content

1. Click "Save as Draft" from any modal
2. **Verify**: Toast says "💾 Draft saved - Complete BANT when ready"
3. **Verify**: Toast is green (success)
4. **Verify**: Toast auto-dismisses after ~3 seconds
5. ✅ **PASS** if toast correct

---

## 📊 Quick Test Results

| Test | Expected Behavior | Pass/Fail |
|------|------------------|-----------|
| 1a. Incomplete - Complete BANT | Scrolls to Budget, highlights, focuses | ☐ |
| 1b. Incomplete - Save Draft | Modal closes, toast shows, stays on page | ☐ |
| 2a. Partial - Complete Budget | Scrolls to Budget field specifically | ☐ |
| 2b. Partial - Qualify Anyway | Opens QualifyLeadModal | ☐ |
| 2c. Partial - Save Draft | Modal closes, toast shows | ☐ |
| 3. Complete Timeline | Scrolls to Timeline (bottom) | ☐ |
| 4. Smart Detection | Prioritizes Budget first | ☐ |
| 5. Visual Effects | Blue glow, light tint, smooth fade | ☐ |
| 6. Toast Messages | Correct text and styling | ☐ |

---

## 🐛 Common Issues & Fixes

### Issue: No scroll happens
**Fix**: Check that field IDs exist (`bant-budget`, etc.)

### Issue: Highlights don't appear
**Fix**: Check browser console for errors

### Issue: Focus not working
**Fix**: Ensure radio buttons exist in the field

### Issue: Modal doesn't close
**Fix**: Check that state handlers are called

### Issue: Wrong field highlighted
**Fix**: Verify field name passed matches label

---

## ✅ All Tests Pass?

If all checkboxes are checked:
- ✅ Implementation is working correctly
- ✅ Ready for production use
- ✅ UX is smooth and polished

If any test fails:
1. Note which test failed
2. Check browser console for errors
3. Verify field IDs in BANTFramework.tsx
4. Check handler implementations in LeadQualificationPage.tsx
5. Report issue with specific test number

---

## 🎯 Expected Results Summary

**IncompleteBantModal**:
- Complete BANT → Scroll to first missing field
- Save Draft → Close modal, show toast

**PartialBantModal**:
- Complete [Field] → Scroll to that specific field
- Qualify Anyway → Open confirmation modal
- Save Draft → Close modal, show toast

**Visual Effects**:
- Smooth scroll animation
- Blue glow + light background
- Auto-focus on radio button
- 2-second fade out

**Smart Behavior**:
- Detects first missing field
- Dynamic button text
- Proper priority order
- Error handling

---

**Test Duration**: ~5 minutes
**Complexity**: Easy
**Prerequisites**: None (uses existing data)

---

*Quick Test Guide v1.0*
*Last Updated: January 8, 2026*
