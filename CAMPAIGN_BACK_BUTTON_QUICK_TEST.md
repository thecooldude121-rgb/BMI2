# Campaign Back Button - Quick Test Guide (2 Minutes)

## Access
**URL**: `/demo/campaign-wizard-step1`
**Location**: Top left, above progress tracker
**Label**: "← Back to Campaigns"

## Visual Check (5 seconds)
```
Look at top left of page:

← Back to Campaigns
↑ ChevronLeft icon + text

✓ Icon on left (16px arrow)
✓ Text on right (14px, gray)
✓ Horizontal layout (flex)
✓ Above progress tracker
```

## Quick Test Sequence

### Test 1: Initial State - No Changes (15 seconds)
**Fastest test - verifies basic navigation**

1. Load page: `/demo/campaign-wizard-step1`
2. Look at top left
3. See "← Back to Campaigns" (gray text) ✓
4. **Don't touch any form fields** (leave everything empty)
5. Click "← Back to Campaigns"
6. **No modal appears** ✓
7. Would navigate to campaigns list immediately ✓
8. Clean exit, no confirmation needed ✓

**Expected**: Immediate navigation when no changes made

### Test 2: Hover Effect (5 seconds)
```
1. Hover mouse over "← Back to Campaigns"
2. Text color: gray-600 → gray-900 (darker) ✓
3. Arrow icon slides left by 4px ✓
4. Smooth 200ms animation ✓
5. Cursor changes to pointer ✓

Expected: Visual feedback on hover
```

### Test 3: With Changes - Modal Appears (30 seconds)
**Most important test**

1. Load page (fresh start)
2. Type campaign name: "Test Campaign 2025"
3. Select campaign type: "Multi-channel"
4. Click "← Back to Campaigns" at top left
5. **Modal appears**: "Unsaved Changes" ✓
6. Modal shows message: "You have unsaved changes. What would you like to do?" ✓
7. See three buttons:
   ```
   [Save Draft]  [Discard]  [Cancel]
   (blue)        (red)      (gray)
   ```
8. Modal lists changes made ✓
9. Modal has overlay (dark background) ✓

**Expected**: Modal appears when changes exist

### Test 4: Save Draft from Modal (20 seconds)
```
1. Have modal open (from Test 3)
2. Click "Save Draft" button (blue)
3. Button shows "Saving..." with spinner ✓
4. Wait ~1 second ✓
5. Toast appears top right: "✅ Draft saved" ✓
6. Modal closes ✓
7. Would navigate to campaigns list ✓
8. Changes are preserved ✓

Expected: Save, then navigate
```

### Test 5: Discard Changes from Modal (15 seconds)
```
1. Make changes (type name)
2. Click "← Back to Campaigns"
3. Modal appears
4. Click "Discard" button (red)
5. Modal closes immediately ✓
6. Toast appears: "ℹ️ Changes discarded" ✓
7. Would navigate to campaigns list ✓
8. Changes are lost (expected) ✓

Expected: Discard and navigate immediately
```

### Test 6: Cancel from Modal (10 seconds)
```
1. Make changes (select type)
2. Click "← Back to Campaigns"
3. Modal appears
4. Click "Cancel" button (gray)
5. Modal closes ✓
6. Stay on current page ✓
7. All changes still in form ✓
8. Can continue editing ✓
9. Can click Back button again ✓

Expected: Close modal, stay on page
```

### Test 7: After Manual Save - No Modal (20 seconds)
```
1. Make changes (type name, select type)
2. Click "Save Draft" button (top right)
3. Wait for save to complete
4. Toast: "✅ Draft saved successfully" ✓
5. Changes are saved ✓
6. Now click "← Back to Campaigns"
7. **No modal appears** ✓
8. Navigate immediately ✓
9. Because hasChanges = false after save ✓

Expected: No modal after manual save
```

### Test 8: Comparison with Cancel Button (15 seconds)
```
Location Check:
1. "← Back to Campaigns" is TOP LEFT ✓
2. "Cancel" button is TOP RIGHT ✓
3. Different positions ✓

Behavior Check:
1. Make changes (type name)
2. Click "← Back to Campaigns" → Modal appears ✓
3. Click Cancel in modal (stay on page)
4. Click "Cancel" button (top right) → Same modal appears ✓
5. Both buttons have identical behavior ✓

Expected: Same modal, different locations
```

## Button States Checklist

### Default State
- [ ] Color: #4b5563 (gray-600)
- [ ] Font-size: 14px
- [ ] Icon: ChevronLeft (16px)
- [ ] Gap: 8px between icon and text
- [ ] Cursor: pointer

### Hover State
- [ ] Color: #111827 (gray-900) - darker
- [ ] Icon slides left: translateX(-4px)
- [ ] Transition: 200ms smooth
- [ ] Cursor: pointer

### Focus State (Keyboard)
- [ ] Blue outline appears
- [ ] 2px outline width
- [ ] 2px offset from button
- [ ] Accessible and visible

## Modal States Checklist

### Modal Appearance
- [ ] Width: 500px
- [ ] White background
- [ ] Dark overlay (50% opacity)
- [ ] Centered on screen
- [ ] Title: "Unsaved Changes"
- [ ] Description text
- [ ] Three buttons visible

### Button Layout
```
[Save Draft]  [Discard]  [Cancel]
   Blue          Red        Gray

Left to right arrangement
Equal spacing between buttons
```

### Save Draft Button
- [ ] Background: Blue (#2563eb)
- [ ] Text: White
- [ ] Shows "Saving..." when clicked
- [ ] Spinner appears during save
- [ ] Disabled while saving

### Discard Button
- [ ] Background: Red (#ef4444)
- [ ] Text: White
- [ ] Immediate action (no loading)
- [ ] Destructive color (warning)

### Cancel Button
- [ ] Background: Gray (#6b7280)
- [ ] Text: White
- [ ] Closes modal
- [ ] Stays on page

## Toast Notifications

### After Save Draft
```
┌──────────────────┐
│ ✅ Draft saved   │
└──────────────────┘

Color: Green
Position: Top right
Duration: 3 seconds
Auto-dismiss: Yes
```

### After Discard
```
┌────────────────────────┐
│ ℹ️ Changes discarded   │
└────────────────────────┘

Color: Blue
Position: Top right
Duration: 3 seconds
Auto-dismiss: Yes
```

### After Save Error
```
┌──────────────────────────────────┐
│ ❌ Failed to save draft. Retrying...│
└──────────────────────────────────┘

Color: Red
Position: Top right
Duration: 5 seconds
Auto-dismiss: Yes
```

## Common Scenarios

### Scenario 1: Quick Exit (No Changes)
```
Time: 5 seconds

1. Load page
2. Don't touch anything
3. Click Back
4. Navigate away immediately

Result: Clean exit ✓
```

### Scenario 2: Save Work and Exit
```
Time: 30 seconds

1. Fill campaign name
2. Select campaign type
3. Select owner
4. Click Back
5. Modal appears
6. Click "Save Draft"
7. Wait for save
8. Toast appears
9. Navigate away

Result: Work preserved ✓
```

### Scenario 3: Abandon Work
```
Time: 15 seconds

1. Type some data
2. Change mind
3. Click Back
4. Modal appears
5. Click "Discard"
6. Changes lost (expected)
7. Navigate away

Result: Clean exit, no save ✓
```

### Scenario 4: Keep Working
```
Time: 15 seconds

1. Fill some fields
2. Click Back (by mistake)
3. Modal appears
4. Click "Cancel"
5. Modal closes
6. Stay on page
7. All data intact
8. Continue editing

Result: No data loss, continue work ✓
```

### Scenario 5: Save Then Back
```
Time: 25 seconds

1. Fill form fields
2. Click "Save Draft" (top right)
3. Wait for save to complete
4. Toast: "Draft saved successfully"
5. Click "← Back to Campaigns"
6. No modal appears
7. Navigate immediately
8. Because already saved

Result: Smooth exit after manual save ✓
```

## Keyboard Testing

### Tab Navigation
```
1. Press Tab from top of page
2. First focus: "← Back to Campaigns"
3. Blue outline appears
4. Press Enter or Space
5. Same as clicking with mouse
6. Modal appears (if changes)

Expected: Fully keyboard accessible
```

### Escape Key
```
1. Make changes
2. Click Back → Modal opens
3. Press Escape key
4. Modal closes
5. Stay on page
6. Same as clicking Cancel

Expected: Escape closes modal
```

## Visual Layout Check

### Page Header
```
┌──────────────────────────────────────────┐
│ ← Back to Campaigns                      │  ← TOP LEFT
│                                          │
│ ● → ○ → ○ → ○ → ○ → ○                  │  ← Progress tracker
│ 1   2   3   4   5   6                   │
│                                          │
│              [Save Draft]  [Cancel]      │  ← TOP RIGHT
└──────────────────────────────────────────┘

Spacing:
- Back button: margin-bottom: 24px
- Progress tracker: below back button
- Action buttons: aligned to right
```

### Modal Layout
```
┌──────────────────────────────────────┐
│                                      │
│  Unsaved Changes                     │  ← Title
│  ────────────────────────            │
│                                      │
│  You have unsaved changes. What     │  ← Message
│  would you like to do?              │
│                                      │
│  • Changes made to campaign name     │  ← Change list
│  • Changes made to campaign type     │
│                                      │
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ Save │  │Discard│ │Cancel│      │  ← Buttons
│  │Draft │  │       │ │      │      │
│  └──────┘  └──────┘  └──────┘      │
│                                      │
└──────────────────────────────────────┘

Width: 500px
Padding: 32px
Border-radius: 12px
Shadow: Large, soft
```

## Issues to Watch For

### Issue 1: Modal Doesn't Appear
**Symptom**: Click Back, no modal shows

**Check**:
1. Are there actually changes? (type something)
2. Has draft been saved? (check for save toast)
3. Is hasChanges = false? (if saved, no modal needed)

**Solution**: Make changes without saving first

### Issue 2: Can't Click Outside Modal
**Symptom**: Click overlay, modal doesn't close

**Reality**: This is correct behavior!

**Reason**:
- Must click a button
- Prevents accidental dismissal
- User must make explicit choice

**Solution**: Press Escape or click Cancel button

### Issue 3: Save Button Doesn't Work
**Symptom**: Click Save Draft, nothing happens

**Check**:
1. Is button showing "Saving..."? (wait for it)
2. Check console for errors
3. Network connectivity?
4. Database accessible?

**Solution**: Wait for save, check network, retry

### Issue 4: Back vs Cancel Confusion
**Symptom**: Two buttons do the same thing?

**Clarification**:
- Back: Top LEFT (← Back to Campaigns)
- Cancel: Top RIGHT (Cancel button)
- Same modal behavior (both check for changes)
- Different visual position only
- User can use either one

**Solution**: This is expected behavior

### Issue 5: Browser Back Button
**Symptom**: Browser back shows different dialog

**Clarification**:
- Custom Back button: Shows custom modal
- Browser back (⬅️): Shows browser dialog
- Different UI, same purpose
- Both protect unsaved changes

**Solution**: Use custom Back button for better UX

## Quick Test Timing

- **Fastest check**: Test 1 (15 seconds) - No changes navigation
- **Essential test**: Test 3 (30 seconds) - With changes modal
- **Complete test**: All 8 tests (~2.5 minutes)
- **Full validation**: All tests + edge cases (~5 minutes)

## Success Criteria

All tests pass if:
- ✅ Button appears at top left
- ✅ Hover effect works (darker, arrow slides)
- ✅ No changes → Navigate immediately
- ✅ With changes → Modal appears
- ✅ Save Draft → Saves then navigates
- ✅ Discard → Navigates immediately
- ✅ Cancel → Closes modal, stays on page
- ✅ After manual save → No modal
- ✅ Toast notifications appear
- ✅ Keyboard accessible
- ✅ Same behavior as Cancel button
- ✅ No auto-save on back
- ✅ No console errors

## 30-Second Super Quick Test

**Fastest way to verify it works:**

1. Load page → See "← Back to Campaigns" top left ✓
2. Click it → Navigate immediately (no changes) ✓
3. Reload page → Type "Test" ✓
4. Click Back → Modal appears ✓
5. Click Discard → Navigate away ✓

**If all above work, feature is complete!**

Navigate to `/demo/campaign-wizard-step1` and look for the Back button at the top left!
