# Michael Torres - 5-Minute Interaction Test

## 🚀 Quick Test Script

Navigate to: `/lead-generation/leads/lead_003/enrichment`

---

## ✅ Test 1: Retry ZoomInfo Only (30 seconds)

**Steps:**
1. ✓ Locate orange "🔄 Retry ZoomInfo Only" button at top
2. ✓ Click button
3. ✓ Observe:
   - Button shows "Retrying..."
   - Toast: "🔄 Retrying ZoomInfo enrichment..."
4. ✓ Wait 3 seconds
5. ✓ Result (random):
   - Success: "✅ ZoomInfo enrichment successful (3 fields added)"
   - OR Failure: "❌ ZoomInfo still failing - Check API settings"

**Pass Criteria:**
- Button disabled during retry
- Toast appears
- Completes after 3 seconds
- Clear success or failure message

---

## ✅ Test 2: View Error Log (60 seconds)

**Steps:**
1. ✓ Find orange warning banner near top
2. ✓ Click "View Error Log" button
3. ✓ Verify modal shows:
   - Title: "ERROR DETAILS"
   - Service: ZoomInfo API
   - Error Code: TIMEOUT
   - Timestamp present
   - Error message readable
   - Retry Attempts: 1
   - 3 suggested actions listed
4. ✓ Click "🔄 Retry Now"
   - Modal closes
   - Retry starts (same as Test 1)
5. ✓ Open modal again, click "Close"
   - Modal simply closes

**Pass Criteria:**
- Modal displays all information
- Retry Now triggers retry
- Close button works
- Modal can be reopened

---

## ✅ Test 3: Individual Field Retry (90 seconds)

**Test 3a: Direct Phone**
1. ✓ Scroll to "CONTACT INFORMATION"
2. ✓ Find "📱 Direct Phone" card (orange background)
3. ✓ Click "🔄 Retry ZoomInfo"
4. ✓ Observe:
   - Button: "Retrying..."
   - After line: "🔄 Retrying..."
   - Toast: "🔄 Retrying field enrichment..."
5. ✓ Wait 2 seconds
6. ✓ Result (70% success rate):
   - "✓ Field updated" OR
   - "Failed to enrich field - retry again"

**Test 3b: Annual Revenue**
1. ✓ Scroll to "COMPANY INFORMATION"
2. ✓ Find "💰 Annual Revenue" card
3. ✓ Click "🔄 Retry ZoomInfo"
4. ✓ Same behavior as 3a

**Test 3c: Seniority Level**
1. ✓ Scroll to "PROFESSIONAL DETAILS"
2. ✓ Find "📊 Seniority Level" card
3. ✓ Click "🔄 Retry ZoomInfo"
4. ✓ Same behavior as 3a

**Pass Criteria:**
- Each field can retry independently
- Loading state clear
- Toast feedback immediate
- 2-second completion

---

## ✅ Test 4: Data Source Retry (20 seconds)

**Steps:**
1. ✓ Scroll to "ENRICHMENT DATA SOURCES"
2. ✓ Find ZoomInfo card (shows ❌ Failed)
3. ✓ Verify error message visible
4. ✓ Click "🔄 Retry" button on ZoomInfo card
5. ✓ Same behavior as Test 1

**Pass Criteria:**
- ZoomInfo shows failed state
- Retry button present
- Triggers same retry as header button

---

## 🎯 VISUAL CHECKLIST

### Apollo.io Card Should Show:
- ✅ Green checkmark "✅ Connected"
- ✅ "8 fields enriched"
- ✅ "Confidence: 96%"
- ✅ "Response Time: 2.3s"

### ZoomInfo Card Should Show:
- ✅ Red X "❌ Failed"
- ✅ "0 fields enriched"
- ✅ "Response Time: 10.8s (timeout)"
- ✅ Error message box
- ✅ Retry button

### Missing Fields Should Show:
- ✅ Orange background
- ✅ "❌ Not Available" badge
- ✅ "(empty)" for both Before and After
- ✅ Error message box
- ✅ "🔄 Retry ZoomInfo" button

---

## ⏱️ TIMING VERIFICATION

| Action | Expected Duration |
|--------|------------------|
| Global Retry | 3 seconds |
| Field Retry | 2 seconds |
| Toast Display | ~3 seconds visible |
| Modal Open | Instant |
| Modal Close | Instant |

---

## 🎲 RANDOMNESS CHECK

**Test Multiple Times:**
1. ✓ Click "Retry ZoomInfo Only" 5 times
   - Should see mix of success/failure (~50/50)

2. ✓ Click field retries 5 times each
   - Should see mostly success (~70/30)

---

## ✅ PASS/FAIL CRITERIA

### Test PASSES if:
- ✅ All buttons are clickable
- ✅ Loading states show correctly
- ✅ Toasts appear with correct messages
- ✅ Timing is accurate (3s and 2s)
- ✅ Modal displays all information
- ✅ Random success/failure works
- ✅ No console errors

### Test FAILS if:
- ❌ Buttons don't respond
- ❌ No loading feedback
- ❌ Toasts don't appear
- ❌ Modal missing information
- ❌ Always succeeds or always fails
- ❌ Console shows errors

---

## 📊 EXPECTED RESULTS

After running all tests, you should have seen:

1. **Global Retry:** Works from multiple locations (header, banner, modal, data source card)
2. **Error Modal:** Shows detailed error with suggested actions
3. **Field Retries:** Each field can be retried independently
4. **Visual Feedback:** Clear loading states, toasts, and status changes
5. **Realistic Behavior:** Random success/failure simulates real API calls

---

## 🎉 COMPLETION

Total Test Time: ~5 minutes

If all tests pass:
✅ All clickable interactions are working correctly!

Next Steps:
- Test in different browsers
- Test on mobile viewport
- Test rapid clicking edge cases
- Test simultaneous actions
