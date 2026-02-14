# Campaign Tags Input - Quick Test Guide (2 Minutes)

## Access
**URL**: `/demo/campaign-wizard-step1`
**Location**: Scroll down to "Campaign Tags (Optional)" section

## Quick Test Sequence

### Test 1: Add First Tag (15 seconds)
1. Click the input field
2. Border turns blue with ring ✓
3. Type "Enterprise"
4. Press Enter
5. Blue pill appears: [🏷️ Enterprise] [×] ✓
6. Input clears, ready for next tag ✓
7. Counter shows "1/10 tags" ✓

### Test 2: Add Second Tag (15 seconds)
1. Type "SaaS"
2. Press Enter
3. Another pill appears: [🏷️ SaaS] [×] ✓
4. Counter shows "2/10 tags" ✓

### Test 3: Add Tag with Comma (15 seconds)
1. Type "Product Launch"
2. Press comma (,)
3. Tag added without pressing Enter ✓
4. Input clears automatically ✓

### Test 4: Remove Tag (15 seconds)
1. Hover over "Enterprise" pill
2. × button highlights ✓
3. Click × button
4. Pill fades out and disappears ✓
5. Counter updates to "2/10 tags" ✓

### Test 5: Suggestions Dropdown (30 seconds)
1. Click input field
2. Dropdown appears with suggested tags ✓
3. See: "Enterprise", "SaaS", "SMB", "Webinar", etc. ✓
4. Type "ent"
5. List filters to show only "Enterprise" ✓
6. Press Down Arrow
7. "Enterprise" highlights in blue ✓
8. Press Enter
9. Tag added from suggestion ✓

### Test 6: Duplicate Prevention (20 seconds)
1. Add tag "Webinar"
2. Try to add "Webinar" again
3. See error: "Tag already exists" ✓
4. Try "webinar" (lowercase)
5. Same error (case-insensitive) ✓
6. Error disappears after 3 seconds ✓

### Test 7: Character Limit (20 seconds)
1. Type "ThisIsAVeryLongTagName"
2. Input stops at 20 characters ✓
3. Counter shows: "20/20" in red ✓
4. Press Enter
5. Tag added ✓

### Test 8: Max Tags Limit (20 seconds)
1. Add tags until you have 10 total
2. Counter shows "10/10 tags" ✓
3. Input field disappears ✓
4. Background turns gray (disabled) ✓
5. Remove one tag
6. Input field reappears ✓

### Test 9: Special Characters Validation (15 seconds)
1. Type "Test@Tag"
2. Press Enter
3. Error: "Only letters, numbers, spaces, dashes, and underscores allowed" ✓
4. Type "Test-Tag" (dash is ok)
5. Press Enter
6. Tag added successfully ✓

### Test 10: Keyboard Shortcuts (15 seconds)
1. Add 3 tags
2. Focus input (empty)
3. Press Backspace
4. Last tag removed ✓
5. Type "Test"
6. Press Escape
7. Suggestions dropdown closes ✓

### Test 11: Auto-Save (10 seconds)
1. Add any tag
2. See "Auto-saving tags..." with pulsing dot ✓
3. Wait 5 seconds
4. Console shows: "Tags auto-saved: ['Enterprise', 'SaaS']" ✓
5. Indicator disappears ✓

## Visual States Checklist

### Input Container States
- [ ] Default: Gray border, white background
- [ ] Focus: Blue border + blue ring
- [ ] Error: Red border + red ring
- [ ] Disabled (10 tags): Gray background, no input

### Tag Pills
- [ ] Blue background (#dbeafe)
- [ ] Blue text (#1e40af)
- [ ] Tag icon (🏷️) on left
- [ ] × button on right
- [ ] Hover on ×: darker blue + blue background
- [ ] Fade-in animation on add
- [ ] Fade-out animation on remove

### Suggestions Dropdown
- [ ] White background with shadow
- [ ] "Suggested tags" header with chevron
- [ ] Each suggestion has tag icon
- [ ] Hover: light gray background
- [ ] Highlighted (arrow keys): blue background
- [ ] Max height 200px with scroll

## Expected Console Output
```
Tags auto-saved: ['Enterprise', 'SaaS', 'Product Launch']
```

## Validation Tests

### Valid Tags
- "Enterprise" ✓
- "Product-Launch" ✓
- "Q1_2025" ✓
- "Test 123" ✓

### Invalid Tags
- "Test@Tag" ✗ (special character)
- "Test#Tag" ✗ (special character)
- "" ✗ (empty)
- (duplicate) ✗ (already exists)

## Keyboard Shortcuts Reference

| Key | Action |
|-----|--------|
| Enter | Add tag (or select highlighted suggestion) |
| Comma (,) | Add tag |
| Backspace | Remove last tag (when input empty) |
| Escape | Close suggestions dropdown |
| Arrow Down | Navigate down suggestions |
| Arrow Up | Navigate up suggestions |

## All Features Working ✓
- ✅ Blue pill badges with tag icon
- ✅ × button to remove tags
- ✅ Enter or comma to add tags
- ✅ Auto-suggest dropdown
- ✅ Arrow keys to navigate suggestions
- ✅ Click suggestion to add
- ✅ Duplicate prevention (case-insensitive)
- ✅ Max 10 tags limit
- ✅ Max 20 characters per tag
- ✅ Character counter
- ✅ Validation (no special characters)
- ✅ Backspace removes last tag
- ✅ Auto-save after 5 seconds
- ✅ Fade animations
- ✅ Disabled state when full
