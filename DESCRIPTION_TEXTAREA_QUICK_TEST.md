# DESCRIPTION TEXTAREA - QUICK TEST GUIDE

## 🚀 Access
**URL**: `/demo/campaign-wizard-step1`
**Location**: Below Campaign Name and Objective fields

---

## ✅ 5-MINUTE QUICK TEST

### Test 1: Auto-Expand (1 minute)
```
1. Click Description textarea
   ✓ Border turns blue with glow
   ✓ Formatting toolbar appears: [B] [I] [≡] | [Markdown]
   ✓ Blue help box appears with markdown tips

2. Type this text (press Enter after each line):
   "Targeting enterprise prospects for Q1 pipeline building.

   Focus on decision makers in tech companies.

   Key objectives:
   - Build relationships
   - Demonstrate ROI"

3. Observe:
   ✓ Starts at 4 rows
   ✓ Smoothly expands to 5, then 6, then 7 rows
   ✓ Height increases with smooth animation
   ✓ No scrollbar yet
```

---

### Test 2: Character Counter (1 minute)
```
1. Type 50 characters:
   "This is a test description for the new campaign."
   ✓ Counter: 50/500 (gray)

2. Continue typing to 420 characters
   ✓ Counter: 420/500 (orange, bold)
   ✓ "80 chars remaining" (orange)
   ✓ Orange warning box appears

3. Continue to 490 characters
   ✓ Counter: 490/500 (red, bold)
   ✓ "10 chars remaining" (red)

4. Type to exactly 500 characters
   ✓ Counter: 500/500 (red, bold)
   ✓ "0 chars remaining" (red)
   ✓ Red error box: "Character limit reached"
   ✓ Cannot type more
```

---

### Test 3: Auto-Save (1 minute)
```
1. Type: "Test auto-save functionality"
   ✓ Character counter updates

2. STOP typing and wait 5 seconds (don't touch anything)
   ✓ After 5 seconds: "Saving..." appears
   ✓ After 5.5 seconds: "Saved 10:30 AM" appears

3. Type more: " with timer"
   ✓ Timer resets

4. Wait another 5 seconds
   ✓ Saves again with new timestamp
```

---

### Test 4: Ctrl+Enter Quick Save (30 seconds)
```
1. Type: "Quick save test"

2. Press Ctrl+Enter (or Cmd+Enter on Mac)
   ✓ "Saving..." appears immediately (no 5s wait!)
   ✓ "Saved [time]" appears after 500ms
   ✓ Focus moves to next field
   ✓ Toolbar disappears
```

---

### Test 5: Markdown Formatting (1 minute)
```
1. Click Description field

2. Type: "This will be bold"

3. Select the word "bold"

4. Click [B] button in toolbar
   ✓ Text becomes: "This will be **bold**"
   ✓ Counter increases by 4 (for the **)

5. Type: "This will be italic"

6. Select "italic", click [I] button
   ✓ Text becomes: "This will be *italic*"
   ✓ Counter increases by 2

7. Click [≡] List button
   ✓ Inserts "- list item" on new line
   ✓ Cursor ready to type
```

---

### Test 6: Markdown Info Tooltip (15 seconds)
```
1. Focus textarea (toolbar appears)

2. Hover mouse over [Markdown ℹ] icon
   ✓ Dark tooltip appears showing:
     • **bold** → bold
     • *italic* → italic
     • - list item → • list item

3. Move mouse away
   ✓ Tooltip disappears
```

---

### Test 7: Max Rows Warning (30 seconds)
```
1. Type or paste 10+ lines of text

2. Observe behavior:
   ✓ Expands to 6 rows
   ✓ Expands to 7 rows
   ✓ Expands to 8 rows (STOPS)
   ✓ Yellow warning box appears:
     "Maximum rows reached"
   ✓ Scrollbar appears
   ✓ Can still type (not at char limit)
```

---

## 🎯 ALL VISUAL STATES TO VERIFY

### 1. Empty + Not Focused
```
Description (Optional)
┌────────────────────────────────────────┐
│ Briefly describe the purpose...       │
│ ...markdown formatting...              │
└────────────────────────────────────────┘
                                  0/500
```
- Border: Gray
- No toolbar
- Multi-line placeholder

---

### 2. Focused + Empty
```
Description (Optional)
[B] [I] [≡] | [Markdown]  ← Toolbar appears

┌────────────────────────────────────────┐
│ |                                      │  ← Cursor
└────────────────────────────────────────┘

[ℹ️ Markdown Formatting Tips]  ← Blue help box
• Use **bold** for emphasis
• Use *italic* for subtle emphasis
• Use - for bullet points
• Press Ctrl+Enter to save quickly

Tip: Press Ctrl+Enter to save and continue
                                  0/500
```
- Border: Blue with glow
- Toolbar: Visible
- Help box: Blue markdown tips

---

### 3. Typing (Normal)
```
Description (Optional)        [Saving...]
[B] [I] [≡] | [Markdown]

┌────────────────────────────────────────┐
│ Targeting enterprise prospects...|     │
└────────────────────────────────────────┘

Tip: Press Ctrl+Enter...  447 chars remaining
                                 53/500
```
- Counter: Gray (normal)
- Chars remaining: Shown

---

### 4. Auto-Expanded (5+ lines)
```
Description (Optional)  [Saved 10:30 AM]
[B] [I] [≡] | [Markdown]

┌────────────────────────────────────────┐
│ Line 1                                 │
│                                        │
│ Line 2                                 │
│                                        │
│ Line 3                                 │
│ Line 4|                                │  ← 6 rows now
└────────────────────────────────────────┘
                                132/500
```
- Rows: Expanded from 4 to 6
- Smooth animation

---

### 5. Max Rows (8 rows)
```
Description (Optional)  [Saved 10:30 AM]
[B] [I] [≡] | [Markdown]

┌────────────────────────────────────────┐
│ Line 1                                 │
│ Line 2                                 │
│ Line 3                                 │
│ Line 4                                 │
│ Line 5                                 │
│ Line 6                                 │
│ Line 7                                 │
│ Line 8|                                │  ← 8 rows (max)
└────────────────────────────────────────┘↕
                                          Scrollbar

[⚠️ Maximum rows reached]  ← Yellow warning
The textarea won't expand further...
                                233/500
```
- Rows: Fixed at 8
- Scrollbar: Appears
- Warning: Yellow box

---

### 6. Approaching Limit (80%+)
```
Description (Optional)  [Saved 10:30 AM]
[B] [I] [≡] | [Markdown]

┌────────────────────────────────────────┐
│ [Long content... 420 characters]       │
└────────────────────────────────────────┘

[⚠️ Approaching character limit]  ← Orange warning
You have 80 characters remaining.

              80 chars remaining  ← Orange
                            420/500  ← Orange, bold
```
- Counter: Orange, bold
- Warning: Orange box

---

### 7. Limit Reached (500 chars)
```
Description (Optional)  [Saved 10:30 AM]
[B] [I] [≡] | [Markdown]

┌────────────────────────────────────────┐
│ [Maximum content... 500 characters]█   │  ← Cannot type
└────────────────────────────────────────┘

[❌ Character limit reached]  ← Red error
You've reached the maximum length of 500
characters.

               0 chars remaining  ← Red
                            500/500  ← Red, bold
```
- Counter: Red, bold
- Error: Red box
- Cannot type more

---

## 🎨 TOOLBAR BUTTONS

### Button Actions

**[B] Bold**
```
Click → Inserts **text**
With selection → Wraps selection in **...**
```

**[I] Italic**
```
Click → Inserts *text*
With selection → Wraps selection in *...*
```

**[≡] List**
```
Click → Inserts:
"
- list item"
on new line
```

**[Markdown ℹ]**
```
Hover → Shows tooltip with markdown examples
Leave → Tooltip disappears
```

---

## ⚠️ WARNING/ERROR BOXES

### 1. Empty State Help (Blue)
```
Trigger: Focus + empty field
Message: Markdown formatting tips
Color: Blue background
```

### 2. Max Rows (Yellow/Amber)
```
Trigger: 8 rows reached + length < 500
Message: "Maximum rows reached"
Color: Amber background
```

### 3. Approaching Limit (Orange)
```
Trigger: 400-499 characters (80-99%)
Message: "Approaching character limit"
Color: Orange background
```

### 4. Limit Reached (Red)
```
Trigger: Exactly 500 characters
Message: "Character limit reached"
Color: Red background
```

---

## ⌨️ KEYBOARD SHORTCUTS

| Shortcut | Action |
|----------|--------|
| **Ctrl+Enter** | Save and move to next field |
| Tab | Move to next field |
| Shift+Tab | Move to previous field |
| Enter | New line |
| Arrows | Navigate text |

---

## 🔢 CHARACTER COUNTER THRESHOLDS

| Characters | Counter Color | Font Weight | Extra Display |
|------------|---------------|-------------|---------------|
| 0-399 | Gray | Normal | Just counter |
| 400-449 | Orange | Medium | + "X chars remaining" |
| 450-499 | Red | Bold | + "X chars remaining" + warning box |
| 500 | Red | Bold | + "0 chars remaining" + error box |

---

## 📏 ROW AUTO-EXPAND RULES

| Content | Rows | Scrollbar | Note |
|---------|------|-----------|------|
| Empty | 4 | No | Minimum |
| 1-2 lines | 4 | No | Still minimum |
| 3-4 lines | 5-6 | No | Expands smoothly |
| 5-6 lines | 7-8 | No | Approaching max |
| 7+ lines | 8 | Yes | Max reached, scroll |

---

## 🐛 COMMON ISSUES & FIXES

### Issue: Auto-save not triggering
```
Fix: Wait FULL 5 seconds without typing
Verify: "Saving..." appears after exactly 5s
```

### Issue: Can't type more characters
```
Fix: You're at 500 char limit
Solution: Delete some text first
```

### Issue: Toolbar buttons don't work
```
Fix: Make sure textarea is focused (blue border)
Verify: Toolbar buttons are visible and clickable
```

### Issue: Textarea won't expand
```
Fix: You've reached 8 rows (max)
Solution: Use scrollbar to see more content
Note: Can still type, just won't expand vertically
```

### Issue: Ctrl+Enter doesn't work
```
Fix: Make sure you're focused in textarea
Note: Use Ctrl on Windows/Linux, Cmd on Mac
```

---

## ⏱️ AUTO-SAVE TIMING

**Standard Auto-Save**:
```
Type → Wait 5 seconds → Auto-save
Every keystroke resets the 5-second timer
```

**Quick Save (Ctrl+Enter)**:
```
Type → Press Ctrl+Enter → Immediate save (no wait)
```

**Blur Save**:
```
Type → Click outside → Immediate save
```

---

## ✨ MARKDOWN SUPPORT

### Syntax Supported

| Type | Input | Rendered |
|------|-------|----------|
| Bold | `**text**` | **text** |
| Italic | `*text*` | *text* |
| List | `- item` | • item |

### How to Use

**Method 1: Toolbar Buttons**
```
1. Type or select text
2. Click [B], [I], or [≡]
3. Markdown added automatically
```

**Method 2: Type Manually**
```
1. Type: **bold**
2. Type: *italic*
3. Type: - list item
```

---

## 📱 RESPONSIVE BEHAVIOR

### Desktop
- Toolbar: Full size buttons
- Help boxes: Full width
- All features visible

### Tablet
- Toolbar: Same size
- Help boxes: Slightly narrower
- All features work

### Mobile
- Toolbar: Smaller buttons, icons only
- Help boxes: Compact text
- Counter: May stack vertically

---

## ✅ SUCCESS CRITERIA

Description textarea is working correctly if:

✅ Starts at 4 rows
✅ Expands smoothly to 8 rows
✅ Character counter updates in real-time
✅ Counter changes color (gray → orange → red)
✅ Auto-saves after 5 seconds
✅ Ctrl+Enter saves immediately
✅ Toolbar appears on focus
✅ Markdown buttons insert syntax
✅ Warning boxes appear at thresholds
✅ Cannot type beyond 500 characters
✅ Scrollbar appears at 8 rows
✅ "Saved [time]" appears after save

---

## 🎯 COMPLETE TEST CHECKLIST

Use this checklist for thorough testing:

- [ ] Click textarea (focus)
- [ ] Type single line (stays 4 rows)
- [ ] Type 5+ lines (expands to 6+ rows)
- [ ] Type 10+ lines (stops at 8, scrollbar)
- [ ] Type to 50 chars (gray counter)
- [ ] Type to 420 chars (orange counter + warning)
- [ ] Type to 500 chars (red counter + error)
- [ ] Try typing more (prevented)
- [ ] Wait 5 seconds (auto-save)
- [ ] Type more, wait 5s again (saves again)
- [ ] Press Ctrl+Enter (immediate save)
- [ ] Click Bold button (inserts **)
- [ ] Select text, click Bold (wraps)
- [ ] Click Italic button (inserts *)
- [ ] Click List button (inserts -)
- [ ] Hover Markdown icon (tooltip shows)
- [ ] Click outside (blur save)
- [ ] Click back in (focus restores)
- [ ] Test on mobile/tablet (responsive)
- [ ] Use Tab key (moves to next field)
- [ ] Use Shift+Tab (moves to previous)

---

## 📞 QUICK ACCESS

**Demo URL**: `/demo/campaign-wizard-step1`
**Scroll to**: Description field (third field on page)

**Quick Flow**:
1. Fill Campaign Name: "Test Campaign Name"
2. Select Objective: "Lead Generation"
3. **Test Description field** ← Focus here!

---

Ready to test! Navigate to `/demo/campaign-wizard-step1` and scroll to the Description textarea.
