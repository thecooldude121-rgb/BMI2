# CRM Sync Modals - 5-Minute Quick Test

## 🎯 Quick Test Guide

Test both CRM sync modals in under 5 minutes.

---

## 🚀 Setup (30 seconds)

1. Navigate to: `/lead-gen/leads/sarah-lee/qualify`
2. Complete all 4 BANT fields
3. Scroll down to Qualification Decision section

---

## ✅ Test 1: Confirmation Modal - All Sections (2 minutes)

### Open Modal

1. Click "Qualify & Sync" button
2. **Expect**: CRMSyncConfirmationModal opens
3. **Expect**: Large modal, scrollable content

### Verify Lead Information

1. **Check Icon**: Blue User icon
2. **Check Fields**:
   - Name: Sarah Lee ✓
   - Company: TechStart Inc ✓
   - Title: Chief Financial Officer ✓
   - Email: sarah.lee@techstart.com ✓
   - Phone: +1 (415) 234-5678 ✓

### Verify Qualification Scores

1. **Check Icon**: Emerald TrendingUp icon
2. **Check AI Score**:
   - Text: "AI Score: 92/100 (Excellent)" ✓
   - Dots: ●●●●●●●●●○ (9 filled, 1 empty) ✓
   - Filled dots are emerald ✓
3. **Check BANT Score**:
   - Text: "BANT Score: 20/20 (Perfect)" ✓
4. **Check Status Change**:
   - Text: "Contacted → Qualified ✅" ✓
   - "Qualified" is emerald and bold ✓

### Verify Opportunity Preview

1. **Check Panel**: Blue background with blue border ✓
2. **Check Icon**: Blue Briefcase icon ✓
3. **Check Fields**:
   - Opportunity Name: TechStart Inc - Chief Financial Officer ✓
   - Amount: $75,000 (emerald, bold) ✓
   - Close Date: Feb 15, 2025 ✓
   - Stage: Discovery (blue) ✓
   - Probability: 40% ✓
   - Type: New Business ✓
   - Owner: John Smith (Senior AE) ✓

### Verify Actions List

1. **Check Title**: "✅ This action will:" ✓
2. **Check 9 Actions**:
   - Update lead status to "Qualified" ✓
   - Create CRM opportunity (ID: auto-generated) ✓
   - Sync contact information (5 fields) ✓
   - Sync company information (8 fields) ✓
   - Sync BANT assessment (4 components) ✓
   - Sync enrichment data (20 fields) ✓
   - Add qualification notes to CRM activity ✓
   - Send email notification to John Smith ✓
   - Create calendar reminder for demo ✓

### Verify Important Warnings

1. **Check Panel**: Red background with red border ✓
2. **Check Icon**: Red AlertCircle ✓
3. **Check 4 Warnings**:
   - This action cannot be undone ✓
   - Lead will be removed from Lead Gen tool active list ✓
   - All future updates must be made in CRM ✓
   - Estimated sync time: 5-10 seconds ✓

### Test Expandable Sections

1. **Contact Information (default expanded)**:
   - Icon: ChevronDown ✓
   - Content visible: Email, Phone, LinkedIn, Mobile, Office Location ✓
   - Green CheckCircle icon ✓
   - Click header → Collapses ✓
   - Icon changes to ChevronRight ✓
   - Click again → Expands ✓

2. **Company Information (default collapsed)**:
   - Icon: ChevronRight ✓
   - Click header → Expands ✓
   - Shows: Company Name, Industry, Size, Revenue, Location, Website, Founded Year, Description ✓
   - Hover: Light gray background ✓

3. **BANT Assessment**:
   - Click → Expands ✓
   - Shows: Budget Status, Authority Level, Need Assessment, Timeline Details ✓

4. **Professional Details**:
   - Click → Expands ✓
   - Shows: Title, Department, Seniority, Skills, Education, Years of Experience, Certifications ✓

5. **Qualification Notes & History**:
   - Click → Expands ✓
   - Shows: All qualification notes, activity history, and engagement timeline ✓

### Verify Buttons

1. **Confirm Button** (left):
   - Icon: CheckCircle ✓
   - Text: "Confirm & Sync to CRM" ✓
   - Color: Emerald 600 ✓
   - Hover: Emerald 700 ✓

2. **Cancel Button** (right):
   - Text: "Cancel" ✓
   - Color: White with gray border ✓
   - Hover: Gray 50 ✓

3. **Close Button** (top-right):
   - Icon: X ✓
   - Click → Modal closes ✓

✅ **PASS** if all checks completed

---

## ✅ Test 2: Progress Modal - Full Sync (2 minutes)

### Start Sync

1. Click "Qualify & Sync" again
2. Confirmation modal opens
3. Click "Confirm & Sync to CRM"
4. **Expect**: Confirmation modal closes
5. **Expect**: Progress modal opens immediately

### Verify Initial State

1. **Check Title**: "SYNCING TO CRM..." (centered) ✓
2. **Check Progress Bar**:
   - Gray background ✓
   - Emerald fill ✓
   - Rounded corners ✓
3. **Check Percentage**: "0%" initially ✓
4. **Check Footer**: "Please wait, this may take a few seconds..." ✓

### Watch Steps Execute (observe for ~6 seconds)

**Step 1** (0-800ms):
- Status changes: Gray circle → Blue spinning loader ✓
- Text changes: Gray → Blue ✓
- Progress bar: 0% → 14% ✓
- After 800ms: Blue loader → Green checkmark ✓
- Text changes: Blue → Emerald ✓

**Step 2** (800-1600ms):
- "Contact data synced (5 fields)" ✓
- Same animation pattern ✓
- Progress bar: 14% → 28% ✓

**Step 3** (1600-2400ms):
- "Company data synced (8 fields)" ✓
- Progress bar: 28% → 42% ✓

**Step 4** (2400-3200ms):
- "BANT assessment synced (4 components)" ✓
- Progress bar: 42% → 57% ✓

**Step 5** (3200-4000ms):
- "Creating CRM opportunity..." ✓
- Progress bar: 57% → 71% ✓

**Step 6** (4000-4800ms):
- "Sending notification to John Smith..." ✓
- Progress bar: 71% → 85% ✓

**Step 7** (4800-5600ms):
- "Creating calendar reminder..." ✓
- Progress bar: 85% → 100% ✓

### Verify Completion

1. **After 5600ms**:
   - All 7 steps show green checkmarks ✓
   - Progress bar shows 100% ✓
   - Percentage shows "100%" ✓
   - All text is emerald ✓

2. **After 6600ms** (1 second pause):
   - Modal auto-closes ✓
   - Success toast appears ✓
   - Toast text: "✅ Lead qualified and synced to CRM" ✓
   - Toast is green ✓

3. **After ~7600ms**:
   - Navigate to /lead-gen/leads ✓

✅ **PASS** if all steps executed correctly

---

## ✅ Test 3: Incomplete BANT Warning (1 minute)

### Setup

1. Navigate to qualification page
2. Fill only Budget, Authority, Need (leave Timeline empty)
3. BANT Score: 15/20
4. Click "Qualify & Sync"
5. PartialBantModal appears
6. Click "Qualify Anyway (15/20)"

### Verify Warning Banner

1. **Expect**: CRMSyncConfirmationModal opens
2. **Check Banner**:
   - Position: Top of modal, after intro text ✓
   - Background: Yellow 50 ✓
   - Border: Yellow 200 ✓
   - Icon: Yellow AlertCircle ✓
   - Title: "Warning: Incomplete BANT Assessment" ✓
   - Message: "BANT score is 15/20. This lead will be flagged as 'Partial BANT' in CRM for follow-up." ✓

3. **Check Scores Section**:
   - AI Score: 92/100 (Excellent) ✓
   - BANT Score: 15/20 (Good) ✓

4. Can still proceed with "Confirm & Sync to CRM" ✓

✅ **PASS** if warning displays correctly

---

## ✅ Test 4: Cancel Behavior (30 seconds)

### Test Cancel Button

1. Open CRMSyncConfirmationModal
2. Click "Cancel" button
3. **Expect**: Modal closes immediately ✓
4. **Expect**: No sync initiated ✓
5. **Expect**: No toast message ✓
6. **Expect**: Remain on qualification page ✓

### Test X Button

1. Open modal again
2. Click X in top-right corner
3. **Expect**: Same behavior as Cancel ✓
4. Modal closes, no sync ✓

✅ **PASS** if cancellation works correctly

---

## ✅ Test 5: Progress Modal - Cannot Dismiss (30 seconds)

### Test Non-Dismissible

1. Start sync process
2. Progress modal opens
3. **Try to close**:
   - Look for close button → None visible ✓
   - Click outside modal → Nothing happens ✓
   - Press ESC key → Nothing happens ✓
   - Cannot dismiss manually ✓

4. **Wait for completion**:
   - Must wait for all 7 steps ✓
   - Auto-closes only after completion ✓

✅ **PASS** if modal cannot be dismissed

---

## ✅ Test 6: Scrolling & Sticky Elements (30 seconds)

### Test Sticky Header

1. Open CRMSyncConfirmationModal
2. Scroll down to bottom
3. **Expect**: Header stays at top ✓
4. **Expect**: Title visible ✓
5. **Expect**: Close button accessible ✓

### Test Sticky Footer

1. Scroll back to top
2. **Expect**: Footer stays at bottom ✓
3. **Expect**: Buttons always visible ✓
4. **Expect**: No layout shifts ✓

✅ **PASS** if sticky elements work

---

## 📊 Quick Test Results

| Test | Expected Behavior | Pass/Fail |
|------|------------------|-----------|
| 1. Confirmation Modal - All Sections | Complete display with all data | ☐ |
| 2. Progress Modal - Full Sync | 7 steps execute, auto-close | ☐ |
| 3. Incomplete BANT Warning | Yellow banner displays | ☐ |
| 4. Cancel Behavior | Modal closes, no sync | ☐ |
| 5. Cannot Dismiss Progress | User cannot close modal | ☐ |
| 6. Sticky Elements | Header/footer stay visible | ☐ |

---

## 🐛 Common Issues & Fixes

### Issue: Modal doesn't open
**Fix**: Check that BANT fields are filled and "Qualify & Sync" button is enabled

### Issue: Progress stops mid-way
**Fix**: Check browser console for errors, verify interval timer is running

### Issue: No navigation after sync
**Fix**: Check that handleSyncComplete is called and navigation logic works

### Issue: Expandable sections don't work
**Fix**: Check that click handlers are attached and state updates

### Issue: AI score dots don't match
**Fix**: Verify score calculation: filledDots = Math.floor(score / 10)

---

## ✅ All Tests Pass?

If all checkboxes are checked:
- ✅ Both modals working correctly
- ✅ Complete sync flow functional
- ✅ Ready for production
- ✅ Professional UX experience

If any test fails:
1. Note which test failed
2. Check browser console for errors
3. Verify modal props are passed correctly
4. Check state management in LeadQualificationPage
5. Report issue with specific test number

---

**Test Duration**: ~5 minutes
**Complexity**: Easy to Medium
**Prerequisites**: Completed BANT fields

---

*Quick Test Guide v1.0*
*Last Updated: January 8, 2026*
