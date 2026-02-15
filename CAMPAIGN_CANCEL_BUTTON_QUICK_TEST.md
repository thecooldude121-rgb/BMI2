# Campaign Cancel Button - Quick Test Guide (2 Minutes)

## Access
**URL**: `/demo/campaign-wizard-step1`
**Location**: Top right corner (next to Save Draft button)

## Visual Check (5 seconds)
```
Look at top right corner:

[💾 Save Draft]  [✕]
                  ↑
            Cancel button

✓ Square button (40x40px)
✓ X icon centered
✓ Gray border, white background
✓ Next to Save Draft button
✓ 12px gap between buttons
```

## Quick Test Sequence

### Test 1: Button Appearance (10 seconds)
1. Load page: `/demo/campaign-wizard-step1`
2. Look at top right corner
3. See two buttons side by side: ✓
   - Left: [💾 Save Draft]
   - Right: [✕] Cancel button
4. Cancel button is square (40x40px) ✓
5. X icon is centered ✓
6. White background, gray border ✓

### Test 2: Hover Effect (5 seconds)
1. Hover over ✕ button
2. Background changes to light gray ✓
3. Border becomes darker ✓
4. Icon slightly enlarges (10%) ✓
5. Smooth transition (200ms) ✓

### Test 3: Cancel with No Changes (15 seconds)
**Important**: This test requires NO CHANGES to form

1. Load fresh page (no edits)
2. Form is pristine:
   - No campaign name entered
   - No fields modified
   - No "● Unsaved changes" indicator
3. Click ✕ button
4. **Expected**: Immediate navigation ✓
5. **No modal appears** ✓
6. Navigates back (history.back() or to campaigns) ✓
7. No toast notification ✓

### Test 4: Cancel with Unsaved Changes (45 seconds)
**Most important test**

#### Step 1: Create Unsaved Changes (5 seconds)
1. Type in "Campaign Name": "Test Campaign"
2. See indicator: "● Unsaved changes" ✓
3. hasChanges = true ✓

#### Step 2: Click Cancel Button (5 seconds)
4. Click ✕ button
5. Modal appears: ✓
   ```
   ┌─────────────────────────────────┐
   │ ⚠️  Discard Changes?       [×] │
   │    You have unsaved changes...  │
   ├─────────────────────────────────┤
   │ What would you like to do?     │
   │                                 │
   │ [Blue Card] Save Draft          │
   │ [Red Card] Discard Changes      │
   │                                 │
   │ [Save Draft] [Discard Changes]  │
   │ [Cancel]                        │
   └─────────────────────────────────┘
   ```

#### Step 3: Verify Modal Elements (10 seconds)
6. Modal elements visible:
   - [ ] Warning icon (⚠️ yellow circle)
   - [ ] Heading: "Discard Changes?"
   - [ ] Subheading: "You have unsaved changes..."
   - [ ] Blue card with Save icon
   - [ ] Red card with Trash icon
   - [ ] Save Draft button (blue)
   - [ ] Discard Changes button (red)
   - [ ] Cancel button (gray)
   - [ ] Close × button (top right)
   - [ ] Dark overlay behind modal

#### Step 4: Read Option Cards (10 seconds)
7. Blue card says:
   - "💾 Save Draft"
   - "Your progress will be saved and you can continue later"
   - Blue background (#eff6ff)
   - Blue border
8. Red card says:
   - "🗑️ Discard Changes"
   - "All changes will be permanently deleted"
   - Red background (#fef2f2)
   - Red border

#### Step 5: Test Cancel Action (5 seconds)
9. Click gray [Cancel] button at bottom
10. Modal closes ✓
11. Still on Campaign Wizard page ✓
12. Form data still there ("Test Campaign" still in field) ✓
13. "● Unsaved changes" still visible ✓
14. No toast notification ✓

### Test 5: Save Draft via Cancel Modal (30 seconds)
1. Have unsaved changes (type: "Save Test Campaign")
2. Click ✕ button
3. Modal opens ✓
4. Click [💾 Save Draft] button (blue, left side)
5. Button changes to "Saving..." ✓
6. Button disabled ✓
7. Wait 1 second (simulated save)
8. Modal closes ✓
9. Toast appears: "✅ Draft saved" ✓
10. Would navigate to campaigns list ✓
11. Console: "Manually saved draft" ✓

### Test 6: Discard Changes via Cancel Modal (25 seconds)
1. Have unsaved changes (type: "Discard Test")
2. Click ✕ button
3. Modal opens ✓
4. Click [🗑️ Discard Changes] button (red, right side)
5. Modal closes immediately ✓
6. No loading state ✓
7. Toast appears: "ℹ️ Changes discarded" ✓
8. Toast is info/blue color ✓
9. Would navigate to campaigns list ✓
10. Changes lost (form data discarded) ✓

### Test 7: Close Modal with × Button (10 seconds)
1. Have unsaved changes
2. Click ✕ cancel button
3. Modal opens
4. Click [×] button in top right of modal ✓
5. Modal closes ✓
6. Same as clicking Cancel ✓
7. Stay on page ✓
8. Changes preserved ✓

### Test 8: Close Modal by Clicking Outside (10 seconds)
1. Have unsaved changes
2. Click ✕ cancel button
3. Modal opens
4. Click on dark overlay (outside modal box) ✓
5. Modal closes ✓
6. Stay on page ✓
7. Changes preserved ✓

### Test 9: Close Modal with Escape Key (10 seconds)
1. Have unsaved changes
2. Click ✕ cancel button
3. Modal opens
4. Press Escape key ✓
5. Modal closes ✓
6. Stay on page ✓
7. Changes preserved ✓

### Test 10: Modal Animation (10 seconds)
1. Click ✕ button
2. Watch modal appear:
   - [ ] Overlay fades in (200ms)
   - [ ] Modal zooms in slightly
   - [ ] Modal slides up from bottom
   - [ ] Smooth animation (300ms)
3. Click Cancel
4. Watch modal disappear:
   - [ ] Modal zooms out
   - [ ] Overlay fades out
   - [ ] Smooth exit (200ms)

### Test 11: Button Disabled During Save (15 seconds)
1. Have unsaved changes
2. Click ✕ button
3. Modal opens
4. Click [Save Draft]
5. While "Saving..." shown:
   - [ ] Save Draft button disabled
   - [ ] Discard Changes button disabled
   - [ ] Cancel button disabled
   - [ ] All buttons show reduced opacity
   - [ ] Cursor: wait on Save Draft
   - [ ] Cursor: not-allowed on others
6. After save completes:
   - [ ] Modal closes
   - [ ] Buttons re-enable

### Test 12: Keyboard Navigation (20 seconds)
1. Have unsaved changes
2. Click ✕ button
3. Modal opens
4. Press Tab key
5. Focus moves to Save Draft button ✓
6. Press Tab again
7. Focus moves to Discard Changes button ✓
8. Press Tab again
9. Focus moves to Cancel button ✓
10. Press Tab again
11. Focus moves to Close × button ✓
12. Press Shift+Tab
13. Focus moves backward ✓
14. Press Escape
15. Modal closes ✓

### Test 13: Cancel During Auto-Save (25 seconds)
**Edge case test**

1. Type campaign name: "Auto Save Test"
2. Wait 3 seconds (auto-save countdown at 2 seconds)
3. Click ✕ button
4. Modal opens
5. Wait for auto-save to trigger (2 more seconds)
6. Save Draft button outside modal shows "Saving..." ✓
7. Auto-save completes
8. "● Unsaved changes" disappears ✓
9. Modal still open ✓
10. Click any option (Save/Discard/Cancel)
11. Works correctly ✓

### Test 14: Multiple Button Layout (10 seconds)
**Visual layout check**

1. Look at top right corner
2. Verify layout:
   ```
   ┌───────────────────────┐  ┌────┐
   │ 💾 Save Draft         │  │ ✕  │
   │ Last saved: 30s ago   │  └────┘
   │ ● Unsaved changes     │
   └───────────────────────┘

   Gap: 12px (gap-3)
   Alignment: Top (items-start)
   ```
3. Save Draft takes up more space ✓
4. Cancel button is compact square ✓
5. Both buttons aligned at top ✓
6. Last saved text doesn't affect Cancel button ✓

### Test 15: Rapid Clicking (10 seconds)
1. Have unsaved changes
2. Click ✕ button 5 times rapidly
3. Only one modal opens ✓
4. No duplicate modals ✓
5. No console errors ✓
6. Modal opens only once ✓

## Visual States Checklist

### Cancel Button States
- [ ] Default: White bg, gray border, gray icon
- [ ] Hover: Light gray bg, darker border, darker icon
- [ ] Click: Brief press effect
- [ ] Disabled: N/A (button never disabled)

### Modal Elements
- [ ] Overlay: Semi-transparent black (50%)
- [ ] Warning icon: Yellow circle, orange triangle
- [ ] Heading: "Discard Changes?" (18px, bold)
- [ ] Subheading: Gray text (14px)
- [ ] Blue card: Light blue bg, blue border
- [ ] Red card: Light red bg, red border
- [ ] Save button: Blue (#2563eb)
- [ ] Discard button: Red (#dc2626)
- [ ] Cancel button: White with gray border
- [ ] Close × button: Gray, top right

### Toast Notifications
- [ ] Save: "✅ Draft saved" (green)
- [ ] Discard: "ℹ️ Changes discarded" (blue)
- [ ] No toast on cancel/close

## Common Scenarios

### Scenario 1: Quick Exit (No Changes)
```
1. Open wizard
2. Don't make any edits
3. Click ✕
4. Exits immediately
```
**Time**: 5 seconds

### Scenario 2: Save Before Leaving
```
1. Edit form
2. Click ✕
3. Modal appears
4. Click "Save Draft"
5. Saves and exits
```
**Time**: 10 seconds

### Scenario 3: Discard and Start Over
```
1. Edit form extensively
2. Realize it's wrong
3. Click ✕
4. Modal appears
5. Click "Discard Changes"
6. All gone, exits
```
**Time**: 10 seconds

### Scenario 4: False Alarm
```
1. Edit form
2. Click ✕ (accidentally)
3. Modal appears
4. Click "Cancel" or Escape
5. Back to editing
```
**Time**: 5 seconds

## Button Comparison

### Save Draft Button vs Cancel Button

| Feature | Save Draft | Cancel |
|---------|-----------|---------|
| **Shape** | Rectangle | Square |
| **Size** | Auto width | 40x40px |
| **Icon** | 💾 Save | ✕ Close |
| **Purpose** | Save changes | Exit wizard |
| **States** | 5 states | 2 states |
| **Modal** | UnsavedChangesModal | DiscardChangesModal |
| **Auto-function** | Yes (auto-save) | No |
| **Indicators** | Yes (time, changes) | No |

### Modal Comparison

| Feature | UnsavedChangesModal | DiscardChangesModal |
|---------|---------------------|---------------------|
| **Trigger** | Navigate via Next | Click Cancel (✕) |
| **Context** | Moving forward | Exiting wizard |
| **Options** | 3 buttons | 3 buttons |
| **Button 1** | Save & Exit | Save Draft |
| **Button 2** | Exit Without Saving | Discard Changes |
| **Button 3** | Cancel | Cancel |
| **Visual** | Simple list | Option cards |
| **Colors** | Gray buttons | Blue + Red buttons |
| **Icon** | ⚠️ Warning | ⚠️ Warning |

## Expected Console Output

### Cancel with No Changes
```javascript
// No output
// Silent navigation
```

### Cancel → Save Draft
```javascript
"Manually saved draft"
"Draft saved: { campaignName: 'Test Campaign', ... }"
```

### Cancel → Discard Changes
```javascript
// Production would show:
// "Deleting draft for user: [user_id]"
// "Draft deleted"
```

### Cancel → Cancel (Close Modal)
```javascript
// No output
```

## Keyboard Shortcuts Summary

| Key | Action |
|-----|--------|
| Click ✕ | Open modal (if changes) or exit (if no changes) |
| Tab | Move to next button in modal |
| Shift+Tab | Move to previous button |
| Enter | Activate focused button |
| Space | Activate focused button |
| Escape | Close modal (same as Cancel) |
| Click outside | Close modal (same as Cancel) |

## Edge Cases to Verify

### Edge Case 1: No onCancel Prop
1. Component used without onCancel callback
2. Click ✕ button
3. Uses window.history.back() ✓
4. Goes to previous page ✓

### Edge Case 2: With onCancel Prop
1. Component used with onCancel={() => navigate('/campaigns')}
2. Click ✕ button
3. Calls custom callback ✓
4. Navigates to campaigns page ✓

### Edge Case 3: Save Fails
1. Click ✕ with changes
2. Click "Save Draft"
3. Simulate API failure
4. Modal stays open ✓
5. Error toast appears ✓
6. User can try again ✓

### Edge Case 4: Form Auto-Saved Already
1. Make changes
2. Wait for auto-save (5 seconds)
3. hasChanges becomes false
4. Click ✕ button
5. Exits immediately (no modal) ✓
6. No confirmation needed ✓

## Success Criteria

All tests pass if:
- ✅ Cancel button visible and styled correctly
- ✅ Hover effect works smoothly
- ✅ No changes = immediate exit
- ✅ Has changes = modal appears
- ✅ Modal shows all elements correctly
- ✅ Save Draft button saves and exits
- ✅ Discard Changes button discards and exits
- ✅ Cancel button closes modal
- ✅ Close × button works
- ✅ Click outside closes modal
- ✅ Escape key closes modal
- ✅ Keyboard navigation works
- ✅ Toast notifications appear correctly
- ✅ Animations smooth
- ✅ No console errors

## Quick Visual Test (30 seconds)

**Fastest way to verify everything works:**

1. Load page
2. See ✕ button next to Save Draft ✓
3. Type "Test"
4. Click ✕
5. See modal with 2 cards and 3 buttons ✓
6. Click Cancel
7. Modal closes ✓
8. Click ✕ again
9. Click "Discard Changes"
10. See toast and navigate ✓

**If all above work, feature is complete!**

## Total Test Time

- Quick check: 30 seconds
- Basic tests (1-6): ~2 minutes
- All tests (1-15): ~5 minutes
- Comprehensive: ~10 minutes with edge cases

**Recommended**: Run tests 1-6 for quick verification (2 minutes)

Navigate to `/demo/campaign-wizard-step1` to test the Cancel/Close button with unsaved changes modal!
