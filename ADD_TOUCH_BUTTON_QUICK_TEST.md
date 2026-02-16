# Add Touch Button - Quick Test Guide (5 min)

## 🎯 Access
Navigate to: `/demo/campaign-wizard-step3`

---

## Test 1: Button Visibility & States (1 min)

### Initial State (5 touches from template)
- [ ] "Add Touch" button visible at top right
- [ ] Button is blue with white text
- [ ] Button shows plus icon and "Add Touch" label
- [ ] Section header shows "Sequence Touches (5/10)"
- [ ] Hover changes to darker blue

### Visual Check
```
Sequence Touches (5/10)                     [+ Add Touch]
                                             ↑ Blue button
```

---

## Test 2: Adding First Custom Touch (1 min)

### Action: Click "Add Touch"

**Expected Results:**
- [ ] New touch card appears at bottom
- [ ] Touch is numbered "6" (after existing 5)
- [ ] Touch name is "Touch 6"
- [ ] Touch shows "Email • Wait 3 days"
- [ ] Touch is expanded (shows inputs)
- [ ] Subject input field visible and empty
- [ ] Body textarea visible with template
- [ ] Page scrolls smoothly to new touch
- [ ] Subject input has cursor focus (blinking)
- [ ] Success toast: "✓ Touch 6 added"
- [ ] Counter updates to "(6/10)"
- [ ] Total Touches in overview panel = 6
- [ ] Est. Duration updates to 17 days (14 + 3)

### Body Template Check
Should show:
```
Hi {{firstName}},

[Your message here]

Best regards,
{{senderName}}
```

---

## Test 3: Adding Multiple Touches (1 min)

### Action: Click "Add Touch" 4 more times

**After each click check:**
- [ ] Touch 7 added → Counter: (7/10), Duration: 20 days
- [ ] Touch 8 added → Counter: (8/10), Duration: 23 days
- [ ] Touch 9 added → Counter: (9/10), Duration: 26 days
- [ ] Touch 10 added → Counter: (10/10), Duration: 29 days

**At 10 touches:**
- [ ] "Add Touch" button turns gray
- [ ] Button is disabled (no hover effect)
- [ ] "Add Another Touch" dashed button disappears
- [ ] Hovering shows tooltip: "Maximum 10 touches per campaign"

---

## Test 4: Maximum Touches Warning (1 min)

### Action: Click disabled "Add Touch" button

**Expected Modal:**
```
⚠️  Maximum Touches Reached

You've reached the maximum limit of 10 touches
per campaign. To add more touches, please remove
an existing touch first.

┌─────────────────────────────────────┐
│ 💡 Why this limit?                  │
│ Campaigns with more than 10 touches │
│ typically have diminishing returns  │
│ and may appear overly aggressive to │
│ prospects.                          │
└─────────────────────────────────────┘

             [OK, Got It]
```

**Modal Checks:**
- [ ] Modal appears with backdrop
- [ ] Amber warning icon visible
- [ ] Message explains limit clearly
- [ ] Educational callout present
- [ ] "OK, Got It" button visible

**Close Methods:**
- [ ] Click "OK, Got It" → Modal closes
- [ ] Click backdrop → Modal closes
- [ ] Press ESC key → Modal closes
- [ ] Click X button → Modal closes

---

## Test 5: Keyboard Shortcut (30 seconds)

### Reload Page (back to 5 touches)

**Windows/Linux:**
- [ ] Press `Ctrl + N`
- [ ] Touch 6 is added
- [ ] Same behavior as clicking button

**Mac:**
- [ ] Press `Cmd + N`
- [ ] Touch 6 is added
- [ ] Same behavior as clicking button

**At Maximum (10 touches):**
- [ ] Press `Ctrl/Cmd + N`
- [ ] Warning modal appears
- [ ] No touch added

---

## Test 6: Channel Inheritance (30 seconds)

### Reload page to start fresh

**Test Email → Email:**
1. Default template has email touches
2. Click "Add Touch"
3. [ ] New touch channel = "Email"
4. [ ] Subject input shown
5. [ ] Body textarea shown
6. [ ] No LinkedIn message field

**Note:** LinkedIn inheritance would need a template with LinkedIn touches or manual channel switching (future feature).

---

## Test 7: Scroll & Focus Behavior (30 seconds)

### Action: Add touches and observe

**Scroll Behavior:**
- [ ] Page scrolls smoothly (not instant)
- [ ] New touch centers in viewport
- [ ] Animation takes ~300ms
- [ ] No jarring jumps

**Focus Behavior:**
- [ ] Subject input receives focus
- [ ] Cursor blinks in input
- [ ] Can immediately start typing
- [ ] No need to click input first

---

## Test 8: Sequence Overview Updates (30 seconds)

### Monitor the blue overview panel at top

**Initial (5 touches):**
```
Total Touches: 5  |  Est. Duration: 14 days
```

**Add Touch 6 (3-day delay):**
```
Total Touches: 6  |  Est. Duration: 17 days
```
- [ ] Total Touches updates instantly
- [ ] Duration recalculates correctly (14 + 3 = 17)
- [ ] Channel remains "Email"
- [ ] Template name unchanged ("Cold Outreach")

**Add Touch 7:**
```
Total Touches: 7  |  Est. Duration: 20 days
```
- [ ] Continues updating correctly

---

## Test 9: Auto-Save Integration (30 seconds)

### Check Console Logs

**After clicking "Add Touch":**
1. Open browser console (F12)
2. Click "Add Touch"
3. [ ] See log: "Auto-saving sequence data"
4. [ ] Wait 500ms
5. [ ] See log: "Sequence auto-saved successfully"
6. [ ] Success toast appears after save

---

## Test 10: Empty State (30 seconds)

### Use Custom Blank Template

If available (or clear all touches):

**Empty State Shows:**
```
     [+]

No touches yet

Add your first touch to start building your sequence

       [Add First Touch]
```

**Click "Add First Touch":**
- [ ] Touch 1 is created
- [ ] Touch name: "Touch 1"
- [ ] Channel: Email (default)
- [ ] Delay: 3 days
- [ ] Touch is expanded and focused
- [ ] Counter shows "(1/10)"

---

## Pass/Fail Summary

| Test | Status | Notes |
|------|--------|-------|
| Button visibility | [ ] | |
| Button states | [ ] | |
| Adding first touch | [ ] | |
| Touch numbering | [ ] | |
| Expansion & focus | [ ] | |
| Scroll behavior | [ ] | |
| Adding multiple | [ ] | |
| 10-touch limit | [ ] | |
| Warning modal | [ ] | |
| Modal close methods | [ ] | |
| Keyboard shortcut | [ ] | |
| Channel inheritance | [ ] | |
| Overview updates | [ ] | |
| Duration calculation | [ ] | |
| Counter display | [ ] | |
| Auto-save logs | [ ] | |
| Empty state | [ ] | |

---

## Common Issues to Check

❌ **Button not visible**
- Check you're on correct route
- Scroll down to sequence section

❌ **Touch not expanding**
- Check expandedTouches state
- Verify inputs are rendering

❌ **No scroll behavior**
- Check touchRefs are set
- Verify setTimeout delays

❌ **Focus not working**
- Check subjectInputRefs are set
- Verify input exists in DOM

❌ **Modal not showing at 10 touches**
- Verify sequences.length >= 10
- Check showMaxTouchesWarning state

❌ **Keyboard shortcut not working**
- Check event listener is attached
- Verify Ctrl/Cmd + N isn't blocked by browser

❌ **Counter not updating**
- Check sequences.length in render
- Verify state is updating

---

## Quick Smoke Test (1 min)

1. Load `/demo/campaign-wizard-step3`
2. Click "Add Touch"
3. New touch appears, expands, scrolls, focuses ✓
4. Add 4 more touches (total 10)
5. Button turns gray ✓
6. Click gray button → Modal appears ✓
7. Press Ctrl/Cmd + N → Modal appears (already at max) ✓
8. Check overview panel shows 10 touches, 29 days ✓

✅ **PASS** if all behaviors work as expected

---

## Time to Complete: ~5 minutes
## Expected Result: All tests pass ✅
