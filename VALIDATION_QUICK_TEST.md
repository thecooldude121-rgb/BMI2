# Quick Test Guide - BANT Validation

## 🚀 Test Empty BANT Modal (2 minutes)

### Option 1: Modify Mock Data (Recommended)
1. Open: `src/pages/LeadGeneration/LeadQualificationPage.tsx`
2. Find the `qualificationData` state (line ~55)
3. Change the `bantData` values:

```typescript
bantData: {
  budget: {
    status: '',  // Change from 'confirmed' to ''
    range: '$50K - $100K',
    timeline: 'Q1 2025',
    notes: ''
  },
  authority: {
    status: '',  // Change from 'decision_maker' to ''
    role: 'Final Approver',
    stakeholders: '',
    process: ''
  },
  need: {
    status: '',  // Change from 'urgent' to ''
    painPoints: [],
    impact: ''
  },
  timeline: {
    status: '',  // Change from 'immediate' to ''
    closeDate: '2025-02-15',
    milestones: [],
    drivers: ''
  }
}
```

4. Save and refresh the page
5. Click "Qualify & Sync" button
6. ✅ IncompleteBantModal should appear!

---

## 🎯 What You'll See

### Empty BANT Modal Display:
```
┌─────────────────────────────────────────────────┐
│  ⚠️  INCOMPLETE QUALIFICATION                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  You haven't completed the BANT assessment.    │
│                                                 │
│  Current BANT Score: 0/20 ❌                    │
│                                                 │
│  Missing (4/4):                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ ❌ Budget: Not assessed (-5 points)     │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ ❌ Authority: Not assessed (-5 points)  │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ ❌ Need: Not assessed (-5 points)       │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ ❌ Timeline: Not assessed (-5 points)   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  📊 Did you know?                               │
│  Leads without BANT assessment have 40%        │
│  lower conversion rates.                        │
│                                                 │
│  What would you like to do?                    │
│                                                 │
│  [✏️ Complete BANT Assessment] [💾 Save Draft] │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Actions Available:
1. **Complete BANT Assessment** (Blue button)
   - Closes modal
   - Smooth scrolls to BANT Framework section
   - User can fill in fields

2. **Save as Draft** (Gray button)
   - Saves current state
   - Shows success toast
   - Keeps modal closed

---

## 🧪 Test All 3 Scenarios

### Scenario 1: Empty BANT (0/20)
**Status Values**: All empty `''`
**Expected**: IncompleteBantModal
**Result**: ❌ Blocks qualification

### Scenario 2: Low BANT (8/20)
**Status Values**:
- Budget: `'unknown'`
- Authority: `'end_user'`
- Need: `'nice_to_have'`
- Timeline: `'long_term'`
**Expected**: QualifyLeadModal with warning
**Result**: ⚠️ Allows with warning

### Scenario 3: Good BANT (20/20)
**Status Values** (Default):
- Budget: `'confirmed'`
- Authority: `'decision_maker'`
- Need: `'urgent'`
- Timeline: `'immediate'`
**Expected**: QualifyLeadModal, no warning
**Result**: ✅ Normal flow

---

## 🎨 Visual Indicators

### Color Coding
- **Red badges** = Missing fields
- **Yellow banner** = Low score warning
- **Blue button** = Primary action
- **Gray button** = Secondary action
- **Green** = Good score (>= 15)

### Status Icons
- ❌ = Missing/Not assessed
- ⚠️ = Warning
- ✅ = Complete/Good
- 📊 = Information

---

## ⚡ Quick Reset

To restore default (full BANT):
```typescript
status: 'confirmed'    // Budget
status: 'decision_maker'  // Authority
status: 'urgent'          // Need
status: 'immediate'       // Timeline
```

Save file and refresh page.

---

## 📱 Test Flow

```
1. Empty BANT
   ↓
2. Click "Qualify & Sync"
   ↓
3. See IncompleteBantModal
   ↓
4. Click "Complete BANT Assessment"
   ↓
5. Scroll to BANT section
   ↓
6. Fill fields (give low scores)
   ↓
7. Click "Qualify & Sync" again
   ↓
8. See warning in QualifyLeadModal
   ↓
9. Can still proceed
```

---

## ✅ Success Criteria

- [ ] Empty BANT triggers IncompleteBantModal
- [ ] Modal shows all 4 missing fields
- [ ] Score displays as "0/20 ❌"
- [ ] "Complete BANT" button scrolls smoothly
- [ ] Low score shows yellow warning
- [ ] Good score shows no warning
- [ ] All colors match design specs

---

## 🎯 Key Validation Points

1. **NO fields filled** → Block with modal
2. **At least 1 field filled** → Allow (with warning if < 15)
3. **Score >= 15** → Allow (no warning)
4. **Score < 15** → Allow (with warning)

---

**Total Test Time**: ~5 minutes
**Difficulty**: Easy
**Prerequisites**: Access to code editor
