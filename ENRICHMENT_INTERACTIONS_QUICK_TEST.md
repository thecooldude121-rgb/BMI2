# Lead Enrichment Page - Quick Test Guide

## 🚀 Quick Test (2 Minutes)

### Test 1: Enrich Now Button
1. Click **"🔄 Enrich Now"**
2. Watch progress bar animate (0-100%)
3. See field count update (0/20 → 20/20)
4. Toast notifications appear
5. Button re-enables after 3.2 seconds

**Expected:** Smooth animation, disabled state during enrichment

---

### Test 2: Configure Fields
1. Click **"⚙️ Configure Fields"**
2. Toggle between Auto/Manual modes
3. Check/uncheck field categories (Manual mode)
4. Change frequency dropdown
5. Click **Save** or **Cancel**

**Expected:** Modal opens, selections work, modal closes

---

### Test 3: Data Source Details
1. Click **"[View Details]"** on Apollo.io card
2. See connection status, API key, rate limits
3. Scroll through 12 enriched fields
4. Click **Close**
5. Repeat for ZoomInfo card (8 fields)

**Expected:** Detailed modal with all source info

---

### Test 4: Field Cards (Any Field)
1. Click any enriched field card (e.g., Email)
2. See field history modal
3. View change history timeline
4. Check verification status
5. Try action buttons (Edit, Revert, Verify)
6. Click **Close**

**Expected:** Field details with complete history

---

### Test 5: Auto-Enrich Toggle
1. Click **"🔄 Auto-Enrich: ON"** button
2. Watch it change to OFF (gray)
3. Toast notification appears
4. Click again to toggle back to ON (green)

**Expected:** Color changes, toast notification

---

### Test 6: Filters
1. Use **"All Fields ▼"** dropdown
   - Select "Contact Information" → See 5 fields
   - Select "Company Information" → See 8 fields
   - Select "Professional Details" → See 7 fields
2. Use **"Filter by Source ▼"** dropdown
   - Select "Apollo.io" → See 12 fields
   - Select "ZoomInfo" → See 8 fields

**Expected:** Fields filter correctly by category and source

---

### Test 7: History Details
1. Click **"[View Details]"** on first history entry
2. See detailed enrichment info
3. Scroll through Apollo.io fields (12)
4. Scroll through ZoomInfo fields (8)
5. Check API logs section
6. Click **Close**

**Expected:** Complete enrichment details with all fields listed

---

### Test 8: Navigation
1. Click **"← Back to Lead Details"**
2. Should navigate to leads list page

**Expected:** Navigation works correctly

---

## 🎯 Visual Checks

### Status Badges
- ✅ **NEW** badges (green) on 13 added fields
- ✅ **UPDATED** badges (blue) on 7 updated fields

### Hover Effects
- ✅ Field cards show shadow on hover
- ✅ Cursor changes to pointer
- ✅ Smooth transitions

### Loading State
- ✅ Progress bar animates smoothly
- ✅ Field count updates
- ✅ Button disabled and gray during enrichment

---

## 📊 Field Count Reference

**Total:** 20 fields
- **Contact Information:** 5 fields
- **Company Information:** 8 fields
- **Professional Details:** 7 fields

**By Source:**
- **Apollo.io:** 12 fields
- **ZoomInfo:** 8 fields

**By Status:**
- **NEW (Added):** 13 fields
- **UPDATED:** 7 fields

---

## 🔄 Interactive Elements Count

- **Buttons:** 7 main buttons (Back, Enrich Now, Configure, 2x View Details, Toggle, 2 filters)
- **Clickable Field Cards:** 20 cards
- **History View Details:** 3 buttons
- **Modals:** 4 modal types
- **Dropdowns:** 2 filter dropdowns

---

## ✅ Success Criteria

All interactions should:
1. Respond immediately to clicks
2. Show appropriate modals/states
3. Display correct data
4. Close properly
5. Have smooth animations
6. Show toast notifications where applicable
