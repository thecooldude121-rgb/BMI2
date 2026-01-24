# Lead Qualification Validation - Quick Test Guide

## 5-Minute Validation Test

### Test 1: No BANT Filled (BLOCKING) - 1 minute

1. Navigate to: `/lead-generation/leads/sarah-lee/qualify`
2. **Important**: Clear all BANT fields (set all to first empty option)
3. Click **"Qualify & Sync"** button
4. **Expected**: 🚫 Incomplete BANT Modal appears

**Verify Modal Shows**:
- ⚠️ Title: "INCOMPLETE QUALIFICATION"
- Score display: "0/20 ❌"
- All 4 missing fields listed:
  - ❌ Budget: Not assessed (-5 points)
  - ❌ Authority: Not assessed (-5 points)
  - ❌ Need: Not assessed (-5 points)
  - ❌ Timeline: Not assessed (-5 points)
- Warning: "40% lower conversion rates"
- Two buttons only:
  - [✏️ Complete BANT Assessment]
  - [💾 Save as Draft]
- NO "Qualify Anyway" button (blocked!)

**Test Action Buttons**:
5. Click **"Complete BANT Assessment"**
6. **Expected**: Modal closes, page scrolls to Budget field
7. **Expected**: Budget field has blue glow for 2 seconds
8. **Expected**: First radio button auto-focused

---

### Test 2: Partial BANT (WARNING) - 2 minutes

1. Fill these BANT fields:
   - **Budget**: Select "Confirmed" → Enter range "$50K - $100K"
   - **Authority**: Select "Decision Maker" → Role "Final Approver"
   - **Need**: Select "Important" → Check 2-3 pain points
   - **Timeline**: Leave EMPTY (this is key!)

2. Click **"Qualify & Sync"** button
3. **Expected**: ⚠️ Partial BANT Modal appears

**Verify Modal Shows**:
- ⚠️ Title: "PARTIAL BANT ASSESSMENT"
- Score: "12/20 (60%)" or similar
- Progress bar at 60%
- **Completed section** with 3 green checkmarks:
  - ✅ Budget: Confirmed ($50K - $100K) +5
  - ✅ Authority: Decision Maker +5
  - ✅ Need: Important +4
- **Missing section** with 1 red X:
  - ❌ Timeline: Not assessed (-5 points)
- Recommendation: "Complete Timeline assessment"
- Three action buttons:
  - [✅ Qualify Anyway (12/20)]
  - [✏️ Complete Timeline]
  - [💾 Save as Draft]

**Test "Complete Timeline" Button**:
4. Click **"Complete Timeline"**
5. **Expected**: Modal closes, scrolls to Timeline field
6. **Expected**: Timeline field glows blue for 2 seconds
7. **Expected**: Timeline radio button focused

**Test "Qualify Anyway" Flow**:
8. Click **"Qualify & Sync"** again (Timeline still empty)
9. Partial BANT Modal appears again
10. Click **"Qualify Anyway (12/20)"**
11. **Expected**: CRM Sync Confirmation Modal appears
12. **Expected**: Shows BANT score with warning indicator
13. Can proceed with qualification ✅

---

### Test 3: Complete BANT (SUCCESS) - 1 minute

1. Fill ALL 4 BANT fields:
   - **Budget**: "Confirmed" + "$50K - $100K"
   - **Authority**: "Decision Maker" + "Final Approver"
   - **Need**: "Urgent" + 2-3 pain points
   - **Timeline**: "Immediate (0-30 days)" + future date

2. Verify BANT Score Summary shows 18-20/20
3. Click **"Qualify & Sync"** button
4. **Expected**: ✅ NO validation modal appears
5. **Expected**: Goes DIRECTLY to CRM Sync Confirmation Modal
6. **Expected**: Shows "✅ QUALIFIED" or score >= 15/20
7. Can proceed immediately ✅

---

### Test 4: Save Draft - 30 seconds

1. Fill only Budget field (any value)
2. Click **"Qualify & Sync"**
3. Partial BANT Modal appears
4. Click **"💾 Save as Draft"**
5. **Expected**: Toast notification: "💾 Draft saved - Complete BANT when ready"
6. **Expected**: Modal closes
7. **Expected**: Budget data still visible on page ✅

---

## Visual Checklist

### Incomplete BANT Modal
- [ ] Yellow warning icon
- [ ] "0/20 ❌" in red
- [ ] All 4 fields listed as missing
- [ ] Red X icons (❌) for each field
- [ ] "-5 points" for each field
- [ ] "40% lower conversion rates" warning
- [ ] Blue/gray button styling correct
- [ ] No "Qualify Anyway" option

### Partial BANT Modal
- [ ] Yellow warning icon
- [ ] Score like "12/20 (60%)" in yellow/orange
- [ ] Progress bar showing percentage
- [ ] Green checkmarks (✅) for completed fields
- [ ] "+5" or "+4" point indicators
- [ ] Red X (❌) for missing fields
- [ ] "-5 points" for missing fields
- [ ] "Complete [Field]" recommendation
- [ ] Three action buttons visible
- [ ] Emerald "Qualify Anyway" button

### Field Highlighting
- [ ] Smooth scroll animation
- [ ] Blue glow effect (3px shadow)
- [ ] Light blue background fade
- [ ] Lasts 2 seconds
- [ ] Auto-focus on first input

---

## Common Issues to Check

### Issue: Modal doesn't appear
- **Check**: Are ANY BANT fields filled? (0 = Incomplete, 1-3 = Partial)
- **Check**: Is BANT score < 15? (should show Partial modal)

### Issue: Can't qualify with partial BANT
- **Check**: "Qualify Anyway" button should be available in Partial modal
- **Check**: Only Incomplete modal (0/20) blocks qualification

### Issue: Field doesn't highlight
- **Check**: Wait 100ms for modal close animation
- **Check**: Ensure field IDs are correct (bant-budget, bant-authority, etc.)

### Issue: Score calculation wrong
- **Check**: Confirmed/Decision Maker/Urgent/Immediate = 5 points each
- **Check**: Likely/Influencer/Important/Short-term = 4 points each
- **Check**: Unknown/End User/Nice-to-have/Long-term = 2 points each

---

## Expected Results Summary

| Scenario | BANT Score | Modal Type | Can Qualify? |
|----------|-----------|------------|--------------|
| No fields filled | 0/20 | Incomplete | ❌ NO |
| 1-3 fields filled | 2-14/20 | Partial | ⚠️ YES (with warning) |
| All filled, low score | 8-14/20 | Partial/Warning | ⚠️ YES (with warning) |
| All filled, good score | 15-20/20 | None | ✅ YES (direct) |

---

## Quick Validation Checklist

- [ ] Incomplete modal appears when score = 0/20
- [ ] Incomplete modal blocks qualification
- [ ] Partial modal appears when 1-3 fields filled
- [ ] Partial modal allows "Qualify Anyway"
- [ ] Complete BANT goes directly to CRM Sync
- [ ] Field highlighting works on button click
- [ ] Save draft closes modal and shows toast
- [ ] Score calculation matches expected values
- [ ] Progress bar shows correct percentage
- [ ] All warnings display conversion rate data

---

**Time Required**: 5 minutes total
**Status**: Ready for UAT
**Last Updated**: 2025-01-24
