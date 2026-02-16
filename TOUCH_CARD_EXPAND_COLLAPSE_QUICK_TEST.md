# Touch Card Expand/Collapse - Quick Test Guide (5 min)

## 🎯 Access
Navigate to: `/demo/campaign-wizard-step3`

---

## Test 1: Default State (30 seconds)

### Check Initial View

**Touch 1:**
- [ ] Expanded (body visible)
- [ ] Down arrow (▼) visible
- [ ] All fields showing (name, channel, delay, subject, body)
- [ ] Can see and edit content

**Touches 2-5:**
- [ ] Collapsed (header only)
- [ ] Right arrow (▶) visible
- [ ] Subject line preview shows in gray
- [ ] No editable fields visible
- [ ] Compact, scannable view

### Visual Check
```
[1] TOUCH 1 - Initial Outreach        [⋮] [▼]  ← Expanded
    [All fields visible below]

[2] TOUCH 2 - Follow-up               [⋮] [▶]  ← Collapsed
    Timing: Wait 3 days | Channel: Email
    Subject: Following up...

[3] TOUCH 3 - Value Share             [⋮] [▶]  ← Collapsed
    ...
```

---

## Test 2: Collapse Touch 1 (30 seconds)

### Action: Click down arrow (▼) on Touch 1

**Expected:**
- [ ] Body section collapses smoothly
- [ ] Animation takes ~300ms
- [ ] Arrow rotates to right (▶)
- [ ] Subject line preview appears in header
- [ ] Only header visible now
- [ ] No jank or stuttering

**Visual:**
```
Before:
[1] TOUCH 1                           [⋮] [▼]
    ├─ All fields visible

After:
[1] TOUCH 1                           [⋮] [▶]
    Timing: Immediately | Channel: Email
    Subject: Let's connect...
```

---

## Test 3: Expand Touch 2 (30 seconds)

### Method 1: Click Arrow

**Action:** Click right arrow (▶) on Touch 2

**Expected:**
- [ ] Body section expands smoothly
- [ ] Animation takes ~300ms
- [ ] Arrow rotates to down (▼)
- [ ] All fields become visible
- [ ] Can now edit touch

### Method 2: Click Header

**Action:** Click anywhere on Touch 2's header (not arrow)

**Expected:**
- [ ] Same behavior as clicking arrow
- [ ] Body expands smoothly
- [ ] Arrow rotates
- [ ] Convenient quick-expand

**Visual:**
```
Collapsed (before):
[2] TOUCH 2 - Follow-up               [⋮] [▶]
    ← Click anywhere here

Expanded (after):
[2] TOUCH 2 - Follow-up               [⋮] [▼]
├─────────────────────────────────────────────┤
│ Touch Name: [ Follow-up ]                   │
│ Channel: [ Email ] Delay: [ 3 ] [ days ]   │
│ Subject: [ Following up... ]                │
│ Body: [ Hi {{firstName}}... ]               │
```

---

## Test 4: Multiple Expansions (30 seconds)

### Action: Expand Touches 3 and 4

1. Click Touch 3 header → Expands
2. Click Touch 4 header → Expands

**Check:**
- [ ] Touch 2 stays expanded
- [ ] Touch 3 expands successfully
- [ ] Touch 4 expands successfully
- [ ] All three can be expanded simultaneously
- [ ] No limit on expanded touches
- [ ] Page scrollable if needed

**State:**
```
[1] Collapsed  ▶
[2] Expanded   ▼
[3] Expanded   ▼
[4] Expanded   ▼
[5] Collapsed  ▶
```

---

## Test 5: Collapse Multiple (30 seconds)

### Action: Collapse Touches 2, 3, 4

Click each down arrow (▼)

**Check:**
- [ ] Each collapses smoothly
- [ ] Subject previews appear
- [ ] Clean, compact view returns
- [ ] Can see all 5 touches at once

**Final State:**
```
[1] Collapsed  ▶
[2] Collapsed  ▶
[3] Collapsed  ▶
[4] Collapsed  ▶
[5] Collapsed  ▶
```

---

## Test 6: Input Interaction (30 seconds)

### Expand Touch 1

**Action:** Click various inputs and fields

1. Click subject input
   - [ ] Input receives focus
   - [ ] Cursor appears
   - [ ] Card does NOT collapse
   - [ ] Can type normally

2. Click body textarea
   - [ ] Textarea receives focus
   - [ ] Cursor appears
   - [ ] Card does NOT collapse
   - [ ] Can type normally

3. Click channel dropdown
   - [ ] Dropdown opens
   - [ ] Card does NOT collapse
   - [ ] Can select option

4. Click delay number input
   - [ ] Input receives focus
   - [ ] Card does NOT collapse
   - [ ] Can change value

**Validation:** No inputs cause accidental collapse ✓

---

## Test 7: Action Menu Button (15 seconds)

### Action: Click three-dots menu (⋮)

**Check:**
- [ ] Card does NOT expand (if collapsed)
- [ ] Card does NOT collapse (if expanded)
- [ ] Button has independent behavior
- [ ] (Menu functionality TBD)

---

## Test 8: State Persistence (1 min)

### Setup State

1. Collapse Touch 1 → [▶]
2. Expand Touch 3 → [▼]
3. Expand Touch 5 → [▼]

**Current State:**
```
[1] Collapsed  ▶
[2] Collapsed  ▶
[3] Expanded   ▼
[4] Collapsed  ▶
[5] Expanded   ▼
```

### Refresh Page

**Action:** Press F5 or Ctrl+R to refresh

**Expected After Reload:**
- [ ] Touch 1 still collapsed
- [ ] Touch 2 still collapsed
- [ ] Touch 3 still expanded
- [ ] Touch 4 still collapsed
- [ ] Touch 5 still expanded
- [ ] Exact same state as before refresh

**Check localStorage:**
```javascript
// Open Console (F12)
localStorage.getItem('campaignWizardExpandedTouches')
// Should show: "[3,5]"
```

---

## Test 9: Add New Touch (30 seconds)

### Action: Click "Add Touch" button

**Expected for New Touch 6:**
- [ ] Touch 6 appears at bottom
- [ ] Touch 6 is EXPANDED by default
- [ ] Down arrow (▼) showing
- [ ] All fields visible
- [ ] Subject input has focus
- [ ] Ready to edit immediately

**Visual:**
```
[1-5] ... (existing touches)

[6] TOUCH 6                           [⋮] [▼]  ← NEW, Auto-expanded
├─────────────────────────────────────────────┤
│ Touch Name: [ Touch 6 ]_                    │
│ Subject: [ ]_ ← cursor here                 │
│ ...                                         │
```

---

## Test 10: Animation Smoothness (30 seconds)

### Rapid Toggle Test

**Action:** Rapidly click expand/collapse on Touch 2

1. Click ▶ → Expand
2. Wait 150ms (mid-animation)
3. Click ▼ → Collapse
4. Wait 150ms (mid-animation)
5. Click ▶ → Expand

**Check:**
- [ ] No animation glitches
- [ ] Smooth transitions even when interrupted
- [ ] Arrow rotation smooth
- [ ] Height animation smooth
- [ ] Opacity fade smooth
- [ ] No flickering or jumps

---

## Test 11: Header Hover States (15 seconds)

### Collapsed Card Hover

**Action:** Hover over Touch 2 header (collapsed)

**Expected:**
- [ ] Background turns light gray
- [ ] Smooth color transition
- [ ] Indicates clickability
- [ ] Cursor changes to pointer

### Expanded Card Hover

**Action:** Hover over Touch 1 header (expanded)

**Expected:**
- [ ] Background turns light gray
- [ ] Same as collapsed hover
- [ ] Can collapse by clicking header

### Button Hover

**Action:** Hover over arrow button or menu button

**Expected:**
- [ ] Button background darker gray
- [ ] Independent of header hover
- [ ] Clear visual feedback

---

## Test 12: Subject Line Preview (30 seconds)

### Check Preview Display

**Touch 2 (collapsed):**
- [ ] Subject line shows in gray below metadata
- [ ] Truncated with ellipsis if too long
- [ ] Format: "Subject: [text]"

**Expand Touch 2:**
- [ ] Subject preview disappears from header
- [ ] Subject input shows in body

**Edit subject in body:**
1. Type new subject: "New follow-up message"
2. Collapse Touch 2

**Check:**
- [ ] Header shows: "Subject: New follow-up message"
- [ ] Preview updates automatically

**Touch without subject:**
1. Add Touch 6 (no subject yet)
2. Don't enter subject
3. Collapse Touch 6

**Check:**
- [ ] No subject line shown in header
- [ ] Clean appearance without empty "Subject:" label

---

## Test 13: All Fields Visible When Expanded (30 seconds)

### Expand any touch

**Check all fields present:**
- [ ] Touch Name input with label
- [ ] Channel dropdown with label
- [ ] Delay number input
- [ ] Delay unit dropdown (hours/days)
- [ ] Subject Line input with label
- [ ] Email Body textarea with label
- [ ] Variable helper text below body
- [ ] All labels clear and readable
- [ ] All inputs properly styled
- [ ] Proper spacing between fields

---

## Pass/Fail Summary

| Test | Status | Notes |
|------|--------|-------|
| Default state | [ ] | Touch 1 expanded, rest collapsed |
| Collapse animation | [ ] | 300ms smooth |
| Expand animation | [ ] | 300ms smooth |
| Arrow rotation | [ ] | Smooth transition |
| Click header to expand | [ ] | Works correctly |
| Multiple expansions | [ ] | No conflicts |
| Input clicks | [ ] | Don't collapse card |
| Action menu isolation | [ ] | Independent behavior |
| State persistence | [ ] | Survives refresh |
| New touch auto-expand | [ ] | Opens by default |
| Rapid toggle | [ ] | No glitches |
| Hover states | [ ] | Visual feedback |
| Subject preview | [ ] | Shows when collapsed |

---

## Common Issues to Check

❌ **Touch 1 not expanded by default**
- Check localStorage initialization
- Verify Set includes [1]

❌ **Animation not smooth**
- Check transition CSS properties
- Verify duration-300 class
- Check for conflicting styles

❌ **Click inputs collapses card**
- Verify stopPropagation on all inputs
- Check event handler chain

❌ **State not persisting**
- Check localStorage write in useEffect
- Verify JSON serialization
- Check browser storage quota

❌ **Arrow not rotating**
- Check transition CSS
- Verify conditional icon rendering
- Check className application

❌ **Subject preview not showing**
- Check conditional rendering logic
- Verify !isExpanded condition
- Check truncate CSS

---

## Quick Smoke Test (1 min)

1. Load page → Touch 1 expanded ✓
2. Click Touch 2 header → Expands ✓
3. Click Touch 2 arrow → Collapses ✓
4. Add Touch 6 → Auto-expands ✓
5. Type in subject → No collapse ✓
6. Refresh page → State preserved ✓

✅ **PASS** if all behaviors work smoothly

---

## Animation Timing Check

Use browser DevTools to verify:

1. Open DevTools (F12)
2. Go to "Performance" tab
3. Click "Record"
4. Click expand arrow
5. Stop recording

**Check timeline:**
- [ ] Animation duration = ~300ms
- [ ] 60fps frame rate
- [ ] No layout thrashing
- [ ] Smooth transform/opacity changes

---

## Time to Complete: ~5 minutes
## Expected Result: All tests pass ✅
