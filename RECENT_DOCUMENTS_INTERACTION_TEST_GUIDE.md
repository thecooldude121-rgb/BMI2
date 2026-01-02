# Recent Documents - Quick Interaction Test Guide
**5-Minute Comprehensive Test**

---

## 🎯 Quick Test Checklist

### **1. PAGE LOAD TEST** (30 seconds)

**Action:** Navigate to `/crm/documents`

**Expected:**
```
✓ Recent Documents section appears at top
✓ Shows "RECENT DOCUMENTS (Last 5 you viewed)"
✓ Shows 5 compact cards in horizontal row
✓ Shows "View All (15) →" link
✓ Shows collapse button [⌃]
✓ Section positioned above main document grid
```

---

### **2. COMPACT CARD VISUAL TEST** (30 seconds)

**Check Each Card Shows:**
```
✓ File icon (32×32px, colored by type)
✓ Document name (max 2 lines, truncates)
✓ Category badge (colored, e.g., "Proposal" in blue)
✓ "Related:" label (if has deal/account)
✓ Deal/Account link with arrow (→)
✓ File size (e.g., "2.4 MB")
✓ View count (e.g., "12 views")
✓ Time ago (e.g., "2 hours ago")
✓ Two action buttons [👁️] [⬇️]
```

**Card Dimensions:**
```
✓ Width: 180px
✓ Height: 180px
✓ Gap between cards: 16px
✓ Border: 1px gray
```

---

### **3. HOVER EFFECTS TEST** (1 minute)

**Test 1: Hover Over Card**
```
1. Move mouse over any card
2. Expected:
   ✓ Card lifts slightly (2px)
   ✓ Shadow appears (deeper shadow)
   ✓ Border turns blue
   ✓ Cursor becomes pointer
   ✓ Transition is smooth (200ms)
```

**Test 2: Hover Over Action Buttons**
```
1. Hover over [👁️ View] button
2. Expected:
   ✓ Button background turns light blue
   ✓ Icon turns blue
   ✓ Transition is smooth

3. Hover over [⬇️ Download] button
4. Expected:
   ✓ Same blue background/icon effect
```

**Test 3: Hover Over Deal Link**
```
1. Hover over "📊 Acme - $50K →"
2. Expected:
   ✓ Text turns darker blue
   ✓ Underline appears
   ✓ Cursor becomes pointer
```

---

### **4. CLICK CARD TEST** (30 seconds)

**Action:** Click anywhere on card (NOT on buttons/links)

**Expected:**
```
1. Card border flashes blue briefly (200ms)
2. Page navigates immediately
3. URL becomes: /crm/documents/{document_id}
4. Document detail page loads
```

**Example:**
```
Click "Acme_Corp_Proposal_v2.pdf" card
→ URL: /crm/documents/doc_acme_proposal_v2
```

---

### **5. CLICK DEAL/ACCOUNT LINK TEST** (30 seconds)

**Action:** Click "📊 Acme Corp - $50K →" link

**Expected:**
```
1. Link highlights (darker blue + underline)
2. Page navigates immediately
3. Card does NOT navigate (stopPropagation works)
4. URL becomes: /crm/deals/{deal_id}
5. Deal detail page loads
```

**Verify:**
```
✓ Only deal link triggered (not card)
✓ Navigation was to deal page, not document page
```

---

### **6. PREVIEW BUTTON TEST** (2 minutes)

**Action:** Click [👁️ View] button on any card

**Expected:**
```
1. Button highlights (blue background)
2. Card does NOT navigate (stopPropagation works)
3. Preview modal opens instantly
4. Modal shows:
   ✓ "Document Preview" header
   ✓ Document name
   ✓ Category badge, file size, page count
   ✓ Preview area (gray background)
   ✓ "Page 1 of 15" indicator
   ✓ [< Previous] [Next >] buttons
   ✓ [⬇️ Download] [📤 Share] buttons
   ✓ [View Full Details →] button (blue)
   ✓ Keyboard shortcuts footer
   ✓ [× Close] button
```

**Verify:**
```
✓ Body scroll is blocked (can't scroll page behind modal)
✓ Modal backdrop is dark (50% black)
✓ Previous button is disabled (on page 1)
```

---

### **7. MODAL PAGE NAVIGATION TEST** (1 minute)

**Test 1: Click Next Button**
```
1. Click [Next >] button
2. Expected:
   ✓ Page counter changes: "Page 1 of 15" → "Page 2 of 15"
   ✓ Previous button becomes enabled
   ✓ Transition is instant
```

**Test 2: Click Previous Button**
```
1. Click [< Previous] button
2. Expected:
   ✓ Page counter changes: "Page 2 of 15" → "Page 1 of 15"
   ✓ Previous button becomes disabled again
```

**Test 3: Keyboard Navigation**
```
1. Press Right Arrow key
2. Expected: Page advances to page 2

3. Press Left Arrow key
4. Expected: Page goes back to page 1

5. Press Right Arrow 14 times
6. Expected:
   ✓ Reaches page 15
   ✓ Next button becomes disabled
```

---

### **8. MODAL DOWNLOAD TEST** (20 seconds)

**Action:** Click [⬇️ Download] button in modal

**Expected:**
```
1. Toast notification appears
2. Message: "Downloading: Acme_Corp_Proposal_v2.pdf"
3. Toast is green (success color)
4. Modal stays open (doesn't close)
5. Can continue using modal
```

---

### **9. MODAL SHARE TEST** (20 seconds)

**Action:** Click [📤 Share] button in modal

**Expected:**
```
1. Alert box appears
2. Message: "Share functionality would open a share modal"
3. Click OK on alert
4. Modal stays open
```

---

### **10. MODAL VIEW DETAILS TEST** (20 seconds)

**Action:** Click [View Full Details →] button in modal

**Expected:**
```
1. Modal closes smoothly (fade out)
2. Page navigates immediately
3. URL becomes: /crm/documents/{document_id}
4. Document detail page loads
5. Body scroll is restored
```

---

### **11. MODAL CLOSE METHODS TEST** (1 minute)

**Test 1: Close Button**
```
1. Open preview modal
2. Click [× Close] button in top-right
3. Expected:
   ✓ Modal closes smoothly
   ✓ Backdrop fades out
   ✓ Body scroll restored
   ✓ Returns to document library
```

**Test 2: Escape Key**
```
1. Open preview modal
2. Press Escape key
3. Expected:
   ✓ Same result as clicking close button
```

**Test 3: Backdrop Click**
```
1. Open preview modal
2. Click on dark area outside modal
3. Expected:
   ✓ Same result as clicking close button
```

**Test 4: Enter Key**
```
1. Open preview modal
2. Press Enter key
3. Expected:
   ✓ Navigates to document detail page
   ✓ Modal closes
   ✓ Same as clicking "View Full Details"
```

---

### **12. DOWNLOAD BUTTON TEST** (20 seconds)

**Action:** Click [⬇️] button on card (NOT in modal)

**Expected:**
```
1. Button highlights (blue background)
2. Card does NOT navigate (stopPropagation works)
3. Toast notification appears
4. Message: "Downloading: Acme_Corp_Proposal_v2.pdf"
5. Toast is green (success color)
```

---

### **13. VIEW ALL LINK TEST** (20 seconds)

**Action:** Click "View All (15) →" in section header

**Expected:**
```
1. Link text turns darker blue
2. Toast notification appears
3. Message: "Showing all recent documents"
4. Filter badge appears: "Recent"
5. Can see all 15 documents in grid below
```

---

### **14. COLLAPSE/EXPAND TEST** (30 seconds)

**Test 1: Collapse**
```
1. Click [⌃] button in section header
2. Expected:
   ✓ Section collapses to single line
   ✓ Shows: "📄 Recent Documents (5) [⌄]"
   ✓ Cards disappear
   ✓ View All link disappears
   ✓ Smooth transition
```

**Test 2: Expand**
```
1. Click [⌄] button in collapsed header
2. Expected:
   ✓ Section expands to full view
   ✓ Cards reappear
   ✓ View All link reappears
   ✓ Smooth transition
```

---

### **15. KEYBOARD SHORTCUTS COMPREHENSIVE TEST** (1 minute)

**Setup:** Open preview modal

**Test Sequence:**
```
1. Press Esc
   ✓ Modal closes

2. Re-open modal, press Right Arrow 3 times
   ✓ Advances to page 4

3. Press Left Arrow 2 times
   ✓ Goes back to page 2

4. Press Enter
   ✓ Navigates to document detail page

5. Go back to library, open modal again
6. Press Esc immediately
   ✓ Modal closes quickly
```

**Verify:**
```
✓ All keyboard shortcuts work
✓ No conflicts with other shortcuts
✓ Shortcuts only work when modal is open
```

---

## 🎯 Edge Cases to Test

### **1. Truncation Test**

**Long Document Name:**
```
1. Find card with long name
2. Expected:
   ✓ Name truncates with "..." after 2 lines
   ✓ Hover shows tooltip with full name (if implemented)
```

**Long Deal Name:**
```
1. Find card with long deal name
2. Expected:
   ✓ Deal name truncates with "..."
   ✓ Arrow (→) still visible
   ✓ Still clickable
```

---

### **2. No Related Entity Test**

**Find Card Without Deal/Account:**
```
1. Look for card with no "Related:" section
2. Expected:
   ✓ No "Related:" label shown
   ✓ Card height adjusts appropriately
   ✓ Still looks balanced
```

---

### **3. Different File Types Test**

**Check Icon Colors:**
```
1. PDF card: ✓ Red/blue icon
2. DOCX card: ✓ Blue icon
3. XLSX card: ✓ Green icon
4. PPTX card: ✓ Orange/purple icon
5. Image card: ✓ Green icon
```

---

### **4. Modal at Different Pages Test**

**Test Navigation Boundaries:**
```
1. Open modal, navigate to page 15
2. Click Next
   ✓ Button disabled, stays on page 15

3. Click Previous
   ✓ Goes to page 14

4. Close and re-open modal
   ✓ Resets to page 1
```

---

### **5. Rapid Interaction Test**

**Test Performance:**
```
1. Hover rapidly over multiple cards
   ✓ No lag or stutter

2. Click cards rapidly
   ✓ Navigates correctly each time

3. Open/close modal rapidly (5 times)
   ✓ No errors
   ✓ Scroll always restored

4. Spam keyboard shortcuts
   ✓ No unexpected behavior
```

---

## ✅ Complete Test Results Template

```
Date: __________
Tester: __________

[ ] 1. Page Load Test
[ ] 2. Compact Card Visual Test
[ ] 3. Hover Effects Test
[ ] 4. Click Card Test
[ ] 5. Click Deal/Account Link Test
[ ] 6. Preview Button Test
[ ] 7. Modal Page Navigation Test
[ ] 8. Modal Download Test
[ ] 9. Modal Share Test
[ ] 10. Modal View Details Test
[ ] 11. Modal Close Methods Test
[ ] 12. Download Button Test
[ ] 13. View All Link Test
[ ] 14. Collapse/Expand Test
[ ] 15. Keyboard Shortcuts Test

Edge Cases:
[ ] Truncation Test
[ ] No Related Entity Test
[ ] Different File Types Test
[ ] Modal Boundaries Test
[ ] Rapid Interaction Test

Issues Found:
_______________________________
_______________________________
_______________________________

Overall Status: PASS / FAIL
```

---

## 🚀 Quick Smoke Test (1 Minute)

**Bare Minimum Test:**

1. ✓ Page loads with Recent Documents section
2. ✓ Hover over card → card lifts and turns blue
3. ✓ Click card → navigates to document detail
4. ✓ Click [👁️] on any card → modal opens
5. ✓ Press Esc → modal closes
6. ✓ Click [⌃] → section collapses
7. ✓ Click [⌄] → section expands

**If all 7 pass:** Core functionality works ✅

---

## 💡 Testing Tips

1. **Use different browsers:** Test in Chrome, Firefox, Safari
2. **Test responsive:** Try different screen sizes
3. **Check console:** No errors should appear
4. **Test with real data:** Use actual document names/sizes
5. **Test animations:** Watch for smooth transitions
6. **Accessibility:** Tab through elements, check focus states

---

## 🐛 Common Issues to Watch For

| Issue | Symptom | Expected Fix |
|-------|---------|--------------|
| **Card doesn't navigate** | Click does nothing | Check `navigate()` call |
| **Modal won't close** | Esc/X don't work | Check event listeners |
| **Scroll not blocked** | Can scroll behind modal | Check `overflow: hidden` |
| **Hover not working** | No blue border | Check hover state |
| **Buttons trigger card** | Both navigate | Check `stopPropagation()` |
| **No keyboard shortcuts** | Keys don't work | Check modal `isOpen` state |

---

## ✅ Success Criteria

**All Tests Must Pass:**
- ✅ No console errors
- ✅ No visual glitches
- ✅ All hover effects work
- ✅ All click targets work
- ✅ Modal functions completely
- ✅ Keyboard shortcuts work
- ✅ Performance is smooth (60fps)
- ✅ Animations are fluid
- ✅ No broken navigation
- ✅ Scroll behavior correct

---

**Version:** 1.0.0
**Test Duration:** 5 minutes (full) / 1 minute (smoke)
**Last Updated:** December 12, 2024
**Status:** ✅ Ready for Testing
