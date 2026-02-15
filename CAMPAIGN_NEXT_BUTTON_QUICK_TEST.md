# Campaign Next Button - Quick Test Guide (3 Minutes)

## Access
**URL**: `/demo/campaign-wizard-step1`
**Location**: Bottom right of page (in footer section)

## Visual Check (10 seconds)
```
Scroll to bottom of page:

┌─────────────────────────────────────────────┐
│                                             │
│  ⌘ + Enter          [Next: Select Template →]
│  to continue         (button, bottom right)│
│  (keyboard hint)                            │
└─────────────────────────────────────────────┘

✓ Footer has border-top (gray line)
✓ Keyboard hint on left
✓ Next button on right
✓ Button is gray (disabled initially)
```

## Quick Test Sequence

### Test 1: Initial State - Button Disabled (15 seconds)
1. Load page: `/demo/campaign-wizard-step1`
2. Scroll to bottom
3. See Next button: **Gray background** ✓
4. Button text: "Next: Select Template →" ✓
5. Cursor changes to not-allowed when hovering ✓
6. Click button → Nothing happens ✓
7. Press Cmd/Ctrl + Enter → Nothing happens ✓

**Expected**: Button is disabled when form is empty

### Test 2: Requirements Checklist (20 seconds)
1. Scroll up to see the gray checklist box
2. See three requirements with gray circles:
   ```
   ○ Campaign Name (min 5 characters)
   ○ Campaign Type
   ○ Campaign Owner
   ```
3. All items show gray ○ (not complete) ✓
4. Text says "Required to Continue:" at top ✓
5. Bottom text: "All other fields are optional..." ✓

### Test 3: Fill Campaign Name (15 seconds)
1. Click "Campaign Name" input at top
2. Type: "Test Campaign 2025" (more than 5 chars)
3. Scroll down to requirements checklist
4. First item now shows: **✓ Campaign Name** (green) ✓
5. Text has strikethrough ✓
6. Other two items still gray ○ ✓
7. Scroll to bottom
8. Button still gray (disabled) ✓

**Expected**: One requirement complete, button still disabled

### Test 4: Select Campaign Type (15 seconds)
1. Scroll to "Campaign Type" section
2. Click "Multi-channel" card
3. Card becomes selected (blue border) ✓
4. Scroll to requirements checklist
5. Second item now shows: **✓ Campaign Type** (green) ✓
6. Text has strikethrough ✓
7. Two items complete, one incomplete ✓
8. Button still gray (disabled) ✓

**Expected**: Two requirements complete, button still disabled

### Test 5: Select Campaign Owner - Button Enables (20 seconds)
1. Scroll to "Campaign Owner" dropdown
2. Click dropdown
3. See list of team members ✓
4. Select "Sarah Johnson" (or any owner)
5. Dropdown shows selected name ✓
6. Scroll to requirements checklist
7. Third item now shows: **✓ Campaign Owner** (green) ✓
8. All three items have green checkmarks ✓
9. All text has strikethrough ✓
10. Scroll to bottom
11. Button is now **BLUE** (enabled) ✓

**Expected**: All requirements met, button becomes blue!

### Test 6: Button Enabled State (10 seconds)
1. Button is blue (#2563eb) ✓
2. Text is white ✓
3. Cursor changes to pointer on hover ✓
4. Hover makes button darker blue ✓
5. Button has subtle shadow ✓
6. Shadow increases on hover ✓

### Test 7: Keyboard Hint Display (5 seconds)
1. Look at left side of footer
2. See keyboard hint:
   ```
   ⌘ + Enter (Mac)
   OR
   Ctrl + Enter (Windows/Linux)
   ```
3. Keys shown in gray boxes ✓
4. Text: "to continue" ✓
5. Font is smaller, gray color ✓

### Test 8: Click Next Button (30 seconds)
**Most important test**

1. Make sure all three requirements are met (✓✓✓)
2. Button is blue (enabled)
3. Click "Next: Select Template →" button
4. **Immediately** watch button change:
   - Text changes to "Loading..." ✓
   - Spinning loader appears ✓
   - Button stays blue ✓
   - Button becomes disabled ✓
5. Wait ~1 second (auto-save happening)
6. Console should show:
   ```
   "Auto-saving before proceeding to Step 2..."
   "Manually saved draft"
   "Draft saved: {campaignName: '...', ...}"
   ```
7. Toast notification appears: "✅ Draft saved successfully" ✓
8. Page scrolls to top smoothly ✓
9. Would navigate to Step 2 (template selection) ✓

**Expected**: Auto-save → Toast → Scroll → Navigate

### Test 9: Keyboard Shortcut (15 seconds)
1. Reload page
2. Fill all three required fields:
   - Name: "Keyboard Test Campaign"
   - Type: Email Only
   - Owner: Mike Chen
3. Click anywhere on page (don't focus button)
4. Press **⌘ + Enter** (Mac) or **Ctrl + Enter** (Windows)
5. Same behavior as clicking button:
   - Button shows "Loading..." ✓
   - Auto-save triggers ✓
   - Toast appears ✓
   - Would navigate to Step 2 ✓

**Expected**: Keyboard shortcut works from anywhere!

### Test 10: Validation - Missing Name (20 seconds)
1. Reload page
2. Leave "Campaign Name" empty or < 5 chars
3. Select Campaign Type: Multi-channel
4. Select Owner: Sarah Johnson
5. Button is gray (disabled) ✓
6. Try clicking → Nothing happens ✓
7. Try Cmd/Ctrl + Enter → Nothing happens ✓
8. Requirements checklist shows:
   ```
   ○ Campaign Name (incomplete)
   ✓ Campaign Type (complete)
   ✓ Campaign Owner (complete)
   ```

**Expected**: Cannot proceed without valid name

### Test 11: Validation - Missing Type (25 seconds)
1. Reload page
2. Fill Campaign Name: "Test Campaign 123"
3. Select Owner: Alex Rivera
4. **Don't select Campaign Type**
5. Button is gray (disabled) ✓
6. Scroll down and force-click button (if possible in code)
7. OR type in console: `handleNext()` (if testing manually)
8. Red error appears below Campaign Type section:
   ```
   ⚠️ Please select a campaign type to continue
   ```
9. Page scrolls to type section ✓
10. Type section centered in viewport ✓
11. Button stays on same page (no navigation) ✓

**Expected**: Shows error, scrolls to field, stays on page

### Test 12: Validation - Missing Owner (30 seconds)
1. Reload page
2. Fill Campaign Name: "Owner Test Campaign"
3. Select Campaign Type: LinkedIn Only
4. **Don't select Owner**
5. Button is gray (disabled) ✓
6. Can't click button (remains disabled) ✓
7. Force validation by pressing Cmd/Ctrl + Enter
8. Nothing happens (shortcut respects disabled state) ✓
9. If you could bypass and call handleNext():
   - Error message appears: "⚠️ Campaign owner is required" (red text)
   - Error toast: "Please select a campaign owner" (red notification)
   - Scrolls to owner dropdown
   - Centers in viewport
   - Dropdown might get focus

**Expected**: Owner validation prevents proceeding

### Test 13: Optional Fields (15 seconds)
1. Fill only the 3 required fields:
   - Name: "Required Only Campaign"
   - Type: Multi-channel
   - Owner: Sarah Johnson
2. Leave these EMPTY:
   - Description
   - Campaign Goal
   - Target Metrics (Leads, Meetings, Revenue)
   - Tags
   - Collaborators
3. Button is blue (enabled) ✓
4. Click Next
5. Proceeds to Step 2 successfully ✓
6. No errors about empty optional fields ✓

**Expected**: Optional fields don't block navigation

### Test 14: Loading State Interactions (20 seconds)
1. Fill all required fields
2. Click "Next" button
3. While "Loading..." is showing:
   - Try clicking button again → No effect ✓
   - Button is disabled ✓
   - Cursor: wait ✓
   - Try Cmd/Ctrl + Enter → No effect ✓
   - Can't double-submit ✓
   - Can still interact with form fields ✓
4. Wait for auto-save to complete
5. Navigation proceeds
6. Loading state resets

**Expected**: Cannot interact with button while loading

### Test 15: Requirements Update in Real-Time (15 seconds)
1. Start with empty form
2. Watch requirements checklist
3. Type name slowly: "T" "e" "s" "t"
4. After 5 characters: ○ → ✓ (green checkmark appears) ✓
5. Click "Email Only" type
6. Immediately: ○ → ✓ (second checkmark) ✓
7. Select owner from dropdown
8. Immediately: ○ → ✓ (third checkmark) ✓
9. All three items now green with strikethrough ✓
10. Button turns blue immediately ✓

**Expected**: Real-time updates as user fills form

## Button State Checklist

### Disabled State (Gray)
- [ ] Background: #d1d5db (light gray)
- [ ] Text: #6b7280 (gray)
- [ ] Cursor: not-allowed
- [ ] No hover effect
- [ ] Click does nothing
- [ ] Keyboard shortcut disabled

### Enabled State (Blue)
- [ ] Background: #2563eb (blue)
- [ ] Text: #ffffff (white)
- [ ] Cursor: pointer
- [ ] Has subtle shadow
- [ ] Hover: darker blue (#1d4ed8)
- [ ] Hover: larger shadow
- [ ] Click: scale down effect

### Loading State (Blue with Spinner)
- [ ] Background: #2563eb (blue)
- [ ] Text: "Loading..."
- [ ] Spinning loader icon
- [ ] Cursor: wait
- [ ] Disabled (no clicks)
- [ ] No hover effect

## Keyboard Hint Variations

### Mac Users
```
⌘ + Enter
to continue
```
- Shows Command symbol (⌘)

### Windows/Linux Users
```
Ctrl + Enter
to continue
```
- Shows "Ctrl" text

### Visual Style
- Gray boxes around keys
- Light gray border
- Monospace font for keys
- Normal font for "to continue"
- Small text (14px)

## Requirements Checklist States

### All Incomplete
```
Required to Continue:
○ Campaign Name (min 5 characters)
○ Campaign Type
○ Campaign Owner
```

### Partially Complete
```
Required to Continue:
✓ Campaign Name (min 5 characters)  ← green, strikethrough
✓ Campaign Type                      ← green, strikethrough
○ Campaign Owner                     ← gray, normal text
```

### All Complete
```
Required to Continue:
✓ Campaign Name (min 5 characters)  ← all green
✓ Campaign Type                      ← all strikethrough
✓ Campaign Owner                     ← button enabled
```

## Error Message Examples

### Campaign Name Error
```
(Below campaign name input)
⚠️ Campaign name must be at least 5 characters
(Red text, 14px)
```

### Campaign Type Error
```
(Below type selector section)
┌───────────────────────────────────────┐
│ ⚠️ Please select a campaign type to │
│    continue                           │
└───────────────────────────────────────┘
(Light red background, red border)
```

### Campaign Owner Error
```
(Below owner dropdown)
⚠️ Campaign owner is required
(Red text)

+

Toast notification (top right):
❌ Please select a campaign owner
(Red toast, auto-dismiss in 3s)
```

## Console Output Examples

### Successful Navigation
```javascript
// When clicking Next with all fields valid:
"Auto-saving before proceeding to Step 2..."
"Manually saved draft"
"Draft saved: {
  campaignName: 'Test Campaign 2025',
  campaignType: 'multi-channel',
  ownerId: '3',
  // ... other fields
}"
```

### Save Failure (Still Proceeds)
```javascript
"Auto-saving before proceeding to Step 2..."
"Error saving before navigation: [error details]"
// Toast: "Proceeding without saving"
// Still navigates to Step 2
```

### Validation Errors
```javascript
// Nothing logged for validation errors
// Errors shown in UI only
```

## Common Issues & Solutions

### Issue 1: Button Won't Enable
**Symptoms**: All fields filled, button still gray

**Check**:
1. Campaign name has 5+ characters? (not just 4)
2. Campaign type actually selected? (blue border around card)
3. Owner actually selected? (shows name in dropdown)
4. Look at requirements checklist - all three green?

**Solution**: Verify each requirement individually

### Issue 2: Can't Click Button
**Symptoms**: Button is blue but clicking doesn't work

**Check**:
1. Is button showing "Loading..."? (wait for it to finish)
2. Are you clicking the actual button? (not keyboard hint)
3. Is there a modal open? (close modals first)
4. Console errors? (check browser console)

**Solution**: Wait for any pending operations to complete

### Issue 3: Keyboard Shortcut Not Working
**Symptoms**: Cmd/Ctrl + Enter does nothing

**Check**:
1. Are all requirements met? (button must be blue)
2. Is button in loading state? (wait for it to finish)
3. Are you pressing the right keys? (⌘ on Mac, Ctrl on Windows)
4. Is focus trapped in a modal? (close modal first)

**Solution**: Ensure button is enabled and no modals are open

### Issue 4: Validation Error Doesn't Show
**Symptoms**: Click button, no error message appears

**Reality**: If button is disabled, you can't click it!

**Check**:
1. Is button actually disabled (gray)?
2. If yes, validation prevents clicking entirely
3. Look at requirements checklist to see what's missing
4. Fill missing requirements to enable button

**Solution**: This is correct behavior - disabled buttons can't be clicked

### Issue 5: Auto-Save Seems Slow
**Symptoms**: Loading state lasts longer than expected

**Normal**:
- Auto-save: ~1 second (simulated API call)
- Transition: 300ms
- Total: ~1.3 seconds

**Too Slow**:
- If taking >3 seconds, check network
- Check console for errors
- May be actual API delay in production

**Solution**: This is normal behavior, not a bug

## Success Criteria

All tests pass if:
- ✅ Button starts gray (disabled)
- ✅ Requirements checklist shows 3 items
- ✅ Checklist updates in real-time (○ → ✓)
- ✅ Button turns blue when all requirements met
- ✅ Hover effect works on enabled button
- ✅ Click triggers loading state
- ✅ Shows "Loading..." with spinner
- ✅ Auto-save completes (~1 second)
- ✅ Toast notification appears
- ✅ Page scrolls to top smoothly
- ✅ Would navigate to Step 2
- ✅ Keyboard shortcut works (⌘/Ctrl + Enter)
- ✅ Keyboard hint displays correctly
- ✅ Validation prevents proceeding
- ✅ Error messages show for invalid fields
- ✅ Scroll to error behavior works
- ✅ Optional fields don't block navigation
- ✅ No console errors

## Quick Visual Test (30 seconds)

**Fastest way to verify everything works:**

1. Load page → Button gray ✓
2. Type name "Test Campaign" → First ✓
3. Click "Multi-channel" → Second ✓
4. Select owner → Third ✓, Button blue ✓
5. Click Next → Loading spinner ✓
6. Wait → Toast appears ✓
7. See navigation → Success ✓

**If all above work, feature is complete!**

## Test Timing

- Quick check: 30 seconds (visual test only)
- Basic tests (1-7): ~2 minutes
- All tests (1-15): ~5 minutes
- Comprehensive with variations: ~10 minutes

**Recommended**: Run tests 1-9 for thorough verification (~3 minutes)

Navigate to `/demo/campaign-wizard-step1` and scroll to the bottom to test the Next button with validation and auto-save!
