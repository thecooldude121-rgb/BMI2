# Quick Test Guide - Partial BANT Modal

## 🎯 5-Minute Test

### Setup: Missing Timeline Field

**1. Edit Mock Data**
File: `src/pages/LeadGeneration/LeadQualificationPage.tsx`
Line: ~110 (find `bantData`)

```typescript
timeline: {
  status: '',  // ⬅️ Change from 'immediate' to ''
  closeDate: '2025-02-15',
  milestones: [],
  drivers: ''
}
```

**2. Save and Navigate**
- URL: `/lead-gen/leads/sarah-lee/qualify`
- Click: "Qualify & Sync" button

**3. Expected Result**
✅ PartialBantModal appears!

---

## 📋 What You'll See

### Modal Display
```
┌─────────────────────────────────────────────┐
│  ⚠️  PARTIAL BANT ASSESSMENT                 │
├─────────────────────────────────────────────┤
│                                             │
│  ⚠️ Your BANT assessment is incomplete.     │
│                                             │
│  Current BANT Score: 14/20 (70%)            │
│  [██████████████░░░░░░] 70%                 │
│                                             │
│  Completed (3/4):                           │
│  ┌────────────────────────────────────────┐│
│  │ ✅ Budget: Confirmed ($50K-$100K)  +5 ││
│  └────────────────────────────────────────┘│
│  ┌────────────────────────────────────────┐│
│  │ ✅ Authority: Decision Maker       +5 ││
│  └────────────────────────────────────────┘│
│  ┌────────────────────────────────────────┐│
│  │ ✅ Need: Urgent                    +5 ││
│  └────────────────────────────────────────┘│
│                                             │
│  Missing (1/4):                             │
│  ┌────────────────────────────────────────┐│
│  │ ❌ Timeline: Not assessed  -5 points  ││
│  └────────────────────────────────────────┘│
│                                             │
│  💡 Recommendation                          │
│  Complete Timeline assessment to improve   │
│  qualification accuracy.                    │
│                                             │
│  Do you want to:                            │
│                                             │
│  [✅ Qualify Anyway (14/20)] [✏️ Complete Timeline] │
│  [💾 Save as Draft]                         │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🧪 Test All 3 Buttons

### Button 1: "Qualify Anyway (14/20)"
**Action**: Click green button
**Expected**:
- PartialBantModal closes
- QualifyLeadModal opens
- Shows qualification confirmation
- Can proceed with 14/20 score

### Button 2: "Complete Timeline"
**Action**: Click blue button
**Expected**:
- Modal closes
- Page scrolls smoothly to BANT section
- Timeline field is visible
- User can fill the field
- Focus on BANT Framework

### Button 3: "Save as Draft"
**Action**: Click gray button
**Expected**:
- Modal closes
- Success toast appears
- "Draft saved successfully" message
- Stays on qualification page
- Can continue later

---

## 🎨 Visual Verification

### Score Display
- ✅ Shows "14/20 (70%)"
- ✅ Yellow progress bar at 70%
- ✅ Yellow warning icon
- ✅ Yellow background banner

### Completed Fields (Green)
- ✅ Green background (#f0fdf4)
- ✅ Green border
- ✅ Green checkmark icon
- ✅ "+5" score in green

### Missing Fields (Red)
- ✅ Red background (#fef2f2)
- ✅ Red border
- ✅ Red X icon
- ✅ "-5 points" in red

### Buttons
- ✅ "Qualify Anyway": Emerald/Green
- ✅ "Complete Timeline": Blue
- ✅ "Save as Draft": Gray
- ✅ All have icons

---

## 🔄 Test Different Scenarios

### Scenario A: Missing 2 Fields (Low Score)
**Setup**:
```typescript
need: { status: '' },      // Clear
timeline: { status: '' }   // Clear
```
**Expected**:
- Score: 10/20 (50%)
- 2 completed, 2 missing
- Low score warning in recommendation

### Scenario B: Missing 3 Fields (Very Low)
**Setup**:
```typescript
authority: { status: '' }, // Clear
need: { status: '' },      // Clear
timeline: { status: '' }   // Clear
```
**Expected**:
- Score: 5/20 (25%)
- 1 completed, 3 missing
- Strong warning message

### Scenario C: Mixed Scores
**Setup**:
```typescript
budget: { status: 'unknown' },     // 2 points
authority: { status: 'end_user' }, // 2 points
need: { status: '' },              // 0 points
timeline: { status: '' }           // 0 points
```
**Expected**:
- Score: 4/20 (20%)
- Shows lower scores (+2, +2)
- 2 completed, 2 missing

---

## ✅ Success Checklist

### Display
- [ ] Modal appears for partial BANT
- [ ] Score shows correctly (X/20)
- [ ] Percentage shows correctly
- [ ] Progress bar width matches percentage
- [ ] Completed fields listed in green
- [ ] Missing fields listed in red
- [ ] Score values correct (+5, +4, +2)

### Functionality
- [ ] "Qualify Anyway" opens QualifyLeadModal
- [ ] "Complete [Field]" scrolls to BANT
- [ ] "Save as Draft" shows toast
- [ ] Modal close button (X) works
- [ ] Clicking outside closes modal
- [ ] All buttons have hover effects

### Content
- [ ] Field names display correctly
- [ ] Values show (e.g., "$50K-$100K")
- [ ] Recommendation text appropriate
- [ ] Button labels dynamic (field name)
- [ ] Low score warning appears if < 15

---

## 🚀 Quick Reset

To restore full BANT (all fields filled):
```typescript
budget: { status: 'confirmed' },
authority: { status: 'decision_maker' },
need: { status: 'urgent' },
timeline: { status: 'immediate' }
```

Save and refresh page.

---

## 📊 Score Reference

### Maximum Points per Field: 5

**Budget**:
- Confirmed: 5
- Likely: 4
- Unknown: 2

**Authority**:
- Decision Maker: 5
- Influencer: 4
- End User: 2

**Need**:
- Urgent: 5
- Important: 4
- Nice to have: 2

**Timeline**:
- Immediate: 5
- Short-term: 4
- Long-term: 2

**Total Max**: 20 points

---

## 🎯 What Makes This Modal Different?

### vs. IncompleteBantModal (All Empty)
- Shows **progress** (not just "nothing done")
- Allows **qualification** (not blocked)
- Shows **what's completed** (positive reinforcement)
- More **encouraging** tone

### vs. QualifyLeadModal (All Complete)
- Appears **before** final confirmation
- Shows **missing fields** clearly
- Provides **completion option**
- Gives **choice** to proceed or complete

---

## 💡 Pro Testing Tips

1. **Test Edge Case**: Fill only 1 field
   - Should show 1 green, 3 red
   - Score should be 2-5/20
   - Still allows qualification

2. **Test All Values**: Try different statuses
   - Unknown/End User/Nice to have
   - Verify lower scores (2-4 points)
   - Check display values

3. **Test Smooth Scroll**:
   - Click "Complete [Field]"
   - Watch for smooth animation
   - Verify BANT section visible

4. **Test Multiple Rounds**:
   - Open modal
   - Complete field
   - Click qualify again
   - Should show updated score

---

## 🎓 Understanding the Flow

```
Start: Partial BANT filled
  |
  v
Click "Qualify & Sync"
  |
  v
PartialBantModal appears
  |
  ├─ Qualify Anyway ──> QualifyLeadModal ──> Success
  |
  ├─ Complete Field ──> Scroll to BANT ──> Fill ──> Try again
  |
  └─ Save as Draft ──> Toast ──> Stay on page
```

---

**Test Duration**: 5 minutes
**Difficulty**: Easy
**Prerequisites**: Code editor access
**Best For**: Verifying partial BANT scenarios
