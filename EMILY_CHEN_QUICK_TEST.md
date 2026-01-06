# Emily Chen - 5-Minute Review Workflow Test

## 🚀 Quick Test Script

Navigate to: `/lead-generation/leads/lead_004/enrichment`

---

## ✅ Test 1: Accept Field (45 seconds)

**Steps:**
1. ✓ Find "📱 Direct Phone" card (orange background)
2. ✓ Note confidence: 58% 🔴 LOW
3. ✓ Click "✅ Accept" button
4. ✓ Observe:
   - Card turns green
   - Shows "✅ Accepted" badge
   - Toast: "✅ Field accepted"
5. ✓ Click "Undo" button
6. ✓ Verify:
   - Card returns to orange
   - Shows review buttons again

**Pass Criteria:**
- State transition smooth
- Toast appears
- Undo works correctly

---

## ✅ Test 2: Reject Field (45 seconds)

**Steps:**
1. ✓ Find "📱 Mobile Phone" card
2. ✓ Note confidence: 62% 🟡 MEDIUM
3. ✓ Click "❌ Reject" button
4. ✓ Observe:
   - Card turns gray with 60% opacity
   - Shows "❌ Rejected" badge
   - Value has strikethrough
   - Toast: "❌ Field rejected"
5. ✓ Click "Undo" button
6. ✓ Verify card returns to review state

**Pass Criteria:**
- Gray state with strikethrough
- Toast confirmation
- Undo restores properly

---

## ✅ Test 3: Edit Manually (30 seconds)

**Steps:**
1. ✓ Find "💰 Annual Revenue" card
2. ✓ Click "✏️ Edit Manually" button
3. ✓ Observe:
   - Toast: "✏️ Opening editor..."
4. ✓ (Editor opens - simulated for now)

**Pass Criteria:**
- Button responds
- Toast appears
- Clear feedback

---

## ✅ Test 4: Accept All (60 seconds)

**Steps:**
1. ✓ Refresh page to reset all fields
2. ✓ Note "5 fields need review" in warning banner
3. ✓ Click "Accept All" button
4. ✓ Observe:
   - All 5 low confidence cards turn green
   - Toast: "✅ Accepted 5 fields"
   - "Accept All" button becomes disabled
   - "Reject All" button becomes disabled
5. ✓ Verify counter shows "0 need review"

**Pass Criteria:**
- All fields accepted simultaneously
- Buttons disabled after action
- Counter updates correctly

---

## ✅ Test 5: Reject All (60 seconds)

**Steps:**
1. ✓ Refresh page to reset
2. ✓ Click "Reject All" button
3. ✓ Observe:
   - All 5 cards turn gray
   - All values show strikethrough
   - Toast: "❌ Rejected 5 fields"
   - Both bulk buttons disabled
4. ✓ Verify counter shows "0 need review"

**Pass Criteria:**
- All fields rejected together
- Visual feedback clear
- Buttons properly disabled

---

## ✅ Test 6: Filter Views (90 seconds)

**Test 6a: Low Confidence Filter (default)**
1. ✓ Page loads with this filter active
2. ✓ Verify shows only 5 orange cards
3. ✓ No high confidence fields visible

**Test 6b: All Fields Filter**
1. ✓ Select "All Fields" from dropdown
2. ✓ Verify shows:
   - "⚠️ REVIEW REQUIRED" section (5 fields)
   - "✅ HIGH CONFIDENCE" section
   - First 2 high confidence fields visible
   - "Show 11 more..." collapse link
3. ✓ Click "Show 11 more high-confidence fields ▼"
4. ✓ Verify all 11 high confidence fields expand

**Test 6c: High Confidence Only Filter**
1. ✓ Select "High Confidence Only" from dropdown
2. ✓ Verify shows only 11 green/white cards
3. ✓ No orange warning cards visible

**Pass Criteria:**
- Filter changes view correctly
- Expand/collapse works
- Counts are accurate

---

## ✅ Test 7: Review & Approve Workflow (90 seconds)

**Steps:**
1. ✓ Reset page (refresh if needed)
2. ✓ Accept "Direct Phone" field
3. ✓ Accept "Annual Revenue" field
4. ✓ Reject "Mobile Phone" field
5. ✓ Reject "Years in Role" field
6. ✓ Leave "Office Location" in pending state
7. ✓ Verify counter shows "1 need review"
8. ✓ Click "✅ Review & Approve" button (green, top right)
9. ✓ Observe:
   - Toast: "🔄 Processing approval..."
10. ✓ Wait 1.5 seconds
11. ✓ Observe:
    - Toast: "✅ All fields reviewed and approved"
    - Navigation to leads list page

**Pass Criteria:**
- Mixed states work together
- Counter updates dynamically
- Navigation completes workflow
- Toasts show progress

---

## ✅ Test 8: Data Source Cards (30 seconds)

**Apollo.io Card:**
1. ✓ Find Apollo card (left side)
2. ✓ Verify shows:
   - ⚠️ Low Confidence status
   - "10 fields (5 low)"
   - "Avg: 68% confidence"
   - Yellow/orange indicators

**ZoomInfo Card:**
2. ✓ Find ZoomInfo card (right side)
3. ✓ Verify shows:
   - ✅ Connected status
   - "6 fields enriched"
   - "Avg: 92% confidence"
   - Green indicators

**Pass Criteria:**
- Clear distinction between sources
- Metrics displayed correctly
- Status icons appropriate

---

## 🎯 VISUAL CHECKLIST

### Low Confidence Fields (5 total)
- ✅ Orange border and background
- ✅ ⚠️ warning icon
- ✅ Confidence % with color-coded badge
- ✅ Confidence note (e.g., "LOW - Verify manually")
- ✅ Three action buttons visible
- ✅ Before/After values shown

### High Confidence Fields (11 total)
- ✅ Gray border, white background
- ✅ ✓ checkmark icon
- ✅ "✅ HIGH" confidence badge
- ✅ "Auto-approved" note
- ✅ No action buttons (read-only)
- ✅ Green checkmark on After value

### Accepted State
- ✅ Green border and background
- ✅ "✅ Accepted" badge
- ✅ [Undo] button only
- ✅ No strikethrough

### Rejected State
- ✅ Gray border and background
- ✅ 60% opacity
- ✅ "❌ Rejected" badge
- ✅ Strikethrough on value
- ✅ [Undo] button only

---

## 📊 CONFIDENCE LEVEL VERIFICATION

| Field | Confidence | Badge | Color | Status |
|-------|-----------|-------|-------|--------|
| Direct Phone | 58% | 🔴 LOW | Red | Review |
| Mobile Phone | 62% | 🟡 MEDIUM | Yellow | Review |
| Annual Revenue | 65% | 🟡 MEDIUM | Yellow | Review |
| Years in Role | 55% | 🔴 LOW | Red | Review |
| Office Location | 68% | 🟡 MEDIUM | Yellow | Review |
| Email | 97% | ✅ HIGH | Green | Auto |
| LinkedIn | 94% | ✅ HIGH | Green | Auto |
| Job Title | 96% | ✅ HIGH | Green | Auto |
| Company Size | 88% | ✅ HIGH | Green | Auto |
| (7 more...) | 85%+ | ✅ HIGH | Green | Auto |

---

## ⏱️ TIMING VERIFICATION

| Action | Expected Duration | Visual Feedback |
|--------|------------------|-----------------|
| Accept Field | Instant | Green transition |
| Reject Field | Instant | Gray transition |
| Edit Field | Instant | Toast only |
| Accept All | Instant | All turn green |
| Reject All | Instant | All turn gray |
| Undo | Instant | Return to orange |
| Review & Approve | 1.5s | Toast → Navigate |

---

## 🎲 STATE COMBINATIONS TO TEST

**Combination 1: Mixed States**
- 2 Accepted
- 2 Rejected
- 1 Pending
- Verify counter shows "1"

**Combination 2: All Accepted**
- Accept all 5 fields manually (one by one)
- Verify counter shows "0"
- Verify bulk buttons disabled

**Combination 3: All Rejected**
- Reject all 5 fields manually
- Verify counter shows "0"
- Verify bulk buttons disabled

**Combination 4: After Bulk Accept**
- Use Accept All
- Try to click individual Undo
- Verify can undo any field

**Combination 5: After Bulk Reject**
- Use Reject All
- Try to click individual Undo
- Verify can undo any field

---

## ✅ PASS/FAIL CRITERIA

### Test PASSES if:
- ✅ All 5 low confidence fields identified
- ✅ Accept changes to green with badge
- ✅ Reject changes to gray with strikethrough
- ✅ Undo restores pending state
- ✅ Accept All affects all pending fields
- ✅ Reject All affects all pending fields
- ✅ Bulk buttons disable when 0 pending
- ✅ Filters show correct field sets
- ✅ Review & Approve navigates away
- ✅ All toasts appear correctly
- ✅ No console errors

### Test FAILS if:
- ❌ Fields don't change state
- ❌ Undo doesn't work
- ❌ Counter doesn't update
- ❌ Bulk actions miss some fields
- ❌ Filters show wrong fields
- ❌ Review workflow doesn't complete
- ❌ Toasts don't appear
- ❌ Console shows errors

---

## 📊 EXPECTED RESULTS

After running all tests, you should have verified:

1. **Individual Actions:** Accept, Reject, Edit, Undo all work per field
2. **Bulk Actions:** Accept All and Reject All handle multiple fields
3. **State Management:** Fields track accepted/rejected/pending correctly
4. **Visual Feedback:** Colors, badges, strikethrough, opacity all correct
5. **Filtering:** Can view by confidence level
6. **Workflow:** Complete review process from start to navigation
7. **Toast Notifications:** All actions provide feedback
8. **Counter Accuracy:** Pending count updates correctly

---

## 🎉 COMPLETION

Total Test Time: ~7 minutes (slightly longer for thorough testing)

If all tests pass:
✅ Emily Chen low confidence review workflow is working correctly!

**Key Differentiator:**
Unlike John Smith (fully enriched) or Michael Torres (partial failure), Emily Chen demonstrates the **data quality review workflow** where enrichment succeeded but confidence scores require human judgment before use.

Next Steps:
- Test on mobile viewport
- Test with screen reader for accessibility
- Test rapid state changes
- Test browser back/forward buttons
