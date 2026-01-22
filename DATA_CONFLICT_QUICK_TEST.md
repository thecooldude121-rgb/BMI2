# ⚡ Data Conflict Modal - Quick Test Guide

## 🎯 2-Minute Quick Test

### Step 1: Open Modal
```
✓ Click "Trigger Data Conflict" button
✓ Modal opens with orange warning header
✓ Shows "DATA CONFLICT DETECTED" title
```

### Step 2: Review Conflicts
```
✓ See 3 conflicts displayed:
  • Conflict 1: Company Size (Apollo 94% vs ZoomInfo 87%)
  • Conflict 2: Annual Revenue (Apollo 82% vs ZoomInfo 91%)
  • Conflict 3: Direct Phone (Apollo 88% vs ZoomInfo 85%)
✓ Each shows confidence badges and source info
✓ Recommendations displayed with 💡 icon
```

### Step 3: Test Resolution Strategies
```
✓ Click "Use recommendations" → See auto-selections
✓ Click "Always prefer Apollo.io" → All switch to Apollo
✓ Click "Always prefer ZoomInfo" → All switch to ZoomInfo
✓ Click individual radio buttons → Strategy changes to "manual"
```

### Step 4: Check Selection Summary
```
✓ Summary shows: "X fields from Apollo, Y from ZoomInfo"
✓ Updates in real-time as selections change
```

### Step 5: Accept or Cancel
```
✓ Click "Accept Selections" → Modal closes, action logged
✓ OR click "Use All Apollo" → Quick select all Apollo
✓ OR click "Use All ZoomInfo" → Quick select all ZoomInfo
✓ OR click "Cancel" → Modal closes without changes
```

---

## 📊 Expected Results

### Default State (Recommendations)
- **Conflict 1:** Apollo selected (94% confidence)
- **Conflict 2:** ZoomInfo selected (91% confidence)
- **Conflict 3:** Apollo selected (88% confidence)
- **Summary:** Apollo: 2 fields, ZoomInfo: 1 field

### All Apollo Strategy
- **All Conflicts:** Apollo selected
- **Summary:** Apollo: 3 fields, ZoomInfo: 0 fields

### All ZoomInfo Strategy
- **All Conflicts:** ZoomInfo selected
- **Summary:** Apollo: 0 fields, ZoomInfo: 3 fields

---

## 🎨 Visual Checks

### Colors
- ✓ Orange header (warning theme)
- ✓ Blue for Apollo data
- ✓ Purple for ZoomInfo data
- ✓ Blue border/background on selected options
- ✓ Green "Accept Selections" button

### Layout
- ✓ Header with close button
- ✓ Scrollable content area
- ✓ Three conflict cards with radio selections
- ✓ Resolution strategy options below conflicts
- ✓ Selection summary panel
- ✓ Recommendations box with 💡 icon
- ✓ Fixed footer with action buttons

### Interactive Elements
- ✓ Radio buttons work
- ✓ Entire card is clickable
- ✓ Selected state shows blue highlight
- ✓ Hover effects on buttons
- ✓ Strategy radio updates on manual selection

---

## 🧪 All Test Scenarios

| Scenario | Action | Expected Result |
|----------|--------|----------------|
| **1. Open Modal** | Click trigger button | Modal appears with 3 conflicts |
| **2. Recommendations** | Select "Use recommendations" | Apollo: 2, ZoomInfo: 1 |
| **3. All Apollo** | Select "Always prefer Apollo" | Apollo: 3, ZoomInfo: 0 |
| **4. All ZoomInfo** | Select "Always prefer ZoomInfo" | Apollo: 0, ZoomInfo: 3 |
| **5. Manual Mix** | Click individual options | Mixed selection, strategy = manual |
| **6. Quick Apollo** | Click "Use All Apollo" button | Instant apply all Apollo |
| **7. Quick ZoomInfo** | Click "Use All ZoomInfo" button | Instant apply all ZoomInfo |
| **8. Accept** | Click "Accept Selections" | Apply & log selections |
| **9. Cancel** | Click "Cancel" | Close without saving |
| **10. Close X** | Click X button | Close without saving |

---

## 📝 Action Log Verification

After each action, verify the action log shows:

**Trigger:**
```
⚠️ Data conflict detected during enrichment
📊 3 conflicting fields found between Apollo and ZoomInfo
```

**Accept Selections:**
```
✅ Accepted conflict resolution using strategy: [strategy_name]
📊 Apollo selected for X fields, ZoomInfo for Y fields
   • Company Size: [value] (Source)
   • Annual Revenue: [value] (Source)
   • Direct Phone: [value] (Source)
💾 Lead updated with selected data
```

**Use All Apollo:**
```
🔄 Using all Apollo.io data for conflicting fields
   • Company Size: 85 employees
   • Annual Revenue: $10M - $15M
   • Direct Phone: +1 (415) 234-5678
💾 Lead updated with Apollo.io data
```

**Cancel:**
```
Modal closed without resolution
```

---

## 🔍 Confidence Score Check

| Field | Apollo | ZoomInfo | Winner |
|-------|---------|----------|--------|
| Company Size | 94% | 87% | Apollo ✅ |
| Annual Revenue | 82% | 91% | ZoomInfo ✅ |
| Direct Phone | 88% | 85% | Apollo ✅ |

---

## ✅ Pass/Fail Checklist

- [ ] Modal opens on trigger
- [ ] 3 conflicts displayed correctly
- [ ] Each conflict shows both sources
- [ ] Confidence badges visible (blue/purple)
- [ ] Recommendations shown with 💡
- [ ] Radio buttons functional
- [ ] Entire card clickable
- [ ] Blue highlight on selection
- [ ] 4 resolution strategies work
- [ ] Selection summary updates
- [ ] "Use All Apollo" works
- [ ] "Use All ZoomInfo" works
- [ ] "Accept Selections" works
- [ ] "Cancel" closes modal
- [ ] Action log updates correctly
- [ ] Scrolling works for long content
- [ ] Modal is responsive
- [ ] Close X button works

---

## 🚀 Demo Page Location

**URL:** `/lead-generation/data-conflict-demo`

**Components:**
- Control panel with trigger button
- Conflict statistics panel
- Mock data structure display
- Confidence comparison charts
- Detailed comparison table
- Action log with timestamps

---

## 💡 Quick Tips

1. **Fastest Test:** Click trigger → Accept → Check log (30 seconds)
2. **Visual Test:** Focus on colors and layout (1 minute)
3. **Interaction Test:** Try all strategies and buttons (2 minutes)
4. **Edge Cases:** Test cancel and close actions (30 seconds)

**Total Time:** ~4 minutes for complete verification

---

## 🎯 Success Criteria

✅ All conflicts display correctly with confidence scores
✅ Resolution strategies work as expected
✅ Selection summary updates in real-time
✅ Quick action buttons work instantly
✅ Action log captures all decisions
✅ Visual design matches specification
✅ Modal is fully responsive
✅ No console errors

---

## 📞 Support

If any test fails, check:
1. Browser console for errors
2. Mock data in `dataConflictMockData.ts`
3. Component logic in `DataConflictModal.tsx`
4. Demo page in `DataConflictDemo.tsx`
