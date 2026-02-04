# CAMPAIGN WIZARD STEP 1 - QUICK TEST GUIDE

## 🚀 Access the Demo
**URL**: `/demo/campaign-wizard-step1`

---

## ✅ QUICK TEST CHECKLIST

### Test 1: Valid Campaign Name (2 minutes)
```
1. Click Campaign Name field
   ✓ Border turns blue
   ✓ Blue glow appears

2. Type: "Q1 2025 Enterprise Outreach"
   ✓ Character counter updates: 28/100 chars
   ✓ Auto-save timer starts

3. Wait 5 seconds (don't type)
   ✓ "Saving..." appears
   ✓ "Saved 10:30 AM" appears

4. Click outside the field
   ✓ Green checkmark appears
   ✓ Green border
   ✓ Success message: "✓ Campaign name is valid"
   ✓ Next button turns blue (enabled)
```

---

### Test 2: Empty Field Error (30 seconds)
```
1. Click Campaign Name field
   ✓ Border turns blue

2. Click outside WITHOUT typing
   ✓ Red border appears
   ✓ Red alert icon
   ✓ Error: "❌ Campaign name is required"
   ✓ Next button stays gray (disabled)
```

---

### Test 3: Too Short Error (30 seconds)
```
1. Type: "Hi"
   ✓ Counter: 2/100 chars

2. Click outside field
   ✓ Red border
   ✓ Error: "⚠️ Name must be at least 5 characters"
   ✓ Next button disabled
```

---

### Test 4: Character Limit (30 seconds)
```
1. Type exactly 100 characters:
   "This is a very long campaign name that will test the maximum character limit for the input field okay"

2. Observe:
   ✓ Counter: 100/100 chars (RED, BOLD)
   ✓ Cannot type more characters
   ✓ Green checkmark (if valid)

3. Try typing more:
   ✓ Prevented from typing
```

---

### Test 5: Invalid Characters (1 minute)
```
Test each character separately:

1. Type: "Campaign < Test"
   ✓ Error: "❌ Name cannot contain < > / \ |"

2. Type: "Campaign > Test"
   ✓ Same error

3. Type: "Campaign / Test"
   ✓ Same error

4. Type: "Campaign \ Test"
   ✓ Same error

5. Type: "Campaign | Test"
   ✓ Same error

6. Type: "Campaign & Test"
   ✓ Success (& is allowed)
```

---

### Test 6: Duplicate Name (30 seconds)
```
Try these existing campaign names:

1. Type: "Q4 2024 Holiday Campaign"
   ✓ Error: "⚠️ A campaign with this name already exists"

2. Type: "q4 2024 holiday campaign" (lowercase)
   ✓ Same error (case insensitive)

3. Type: "New Year Product Launch"
   ✓ Same error

4. Type: "Spring Sales Initiative"
   ✓ Same error

5. Type: "Q1 2025 New Campaign"
   ✓ Success (unique name)
```

---

### Test 7: Auto-Save Timer Reset (1 minute)
```
1. Click Campaign Name field

2. Type: "Q"
   ✓ Timer starts (5 seconds)

3. Wait 2 seconds, then type: "1"
   ✓ Timer RESETS to 5 seconds

4. Wait 2 seconds, then type: " 2025"
   ✓ Timer RESETS again

5. STOP typing for full 5 seconds
   ✓ "Saving..." appears
   ✓ "Saved [time]" appears
```

---

### Test 8: Character Counter Colors (1 minute)
```
1. Type 50 characters:
   ✓ Counter: 50/100 chars (GRAY)

2. Type to 90 characters:
   ✓ Counter: 90/100 chars (ORANGE, bold)

3. Type to 100 characters:
   ✓ Counter: 100/100 chars (RED, bold)
```

---

### Test 9: Campaign Objective Dropdown (30 seconds)
```
1. Click Campaign Objective dropdown
   ✓ Opens with 6 options

2. Hover over options
   ✓ Blue highlight on hover

3. Click "Lead Generation"
   ✓ Dropdown closes
   ✓ "Lead Generation" selected

4. Click dropdown again
   ✓ "Lead Generation" shown with checkmark
```

---

### Test 10: Description Textarea (1 minute)
```
1. Click Description field
   ✓ Border turns blue

2. Type a long description (200+ chars)
   ✓ Counter updates in real-time
   ✓ Text wraps to new lines

3. Type to 450 characters
   ✓ Counter turns ORANGE

4. Type to 500 characters
   ✓ Counter turns RED
   ✓ Cannot type more
```

---

### Test 11: Complete Form Submission (1 minute)
```
1. Enter valid campaign name:
   "Q1 2025 Enterprise Outreach"
   ✓ Green checkmark

2. Select objective:
   "Lead Generation"

3. Enter description (optional):
   "Targeting enterprise prospects..."

4. Click Next button
   ✓ Success screen appears
   ✓ Green checkmark icon
   ✓ "Step 1 Complete!" message
   ✓ All data displayed correctly

5. Click "Start Over"
   ✓ Returns to empty form

6. Fill form again and click "Continue to Step 2"
   ✓ Ready for Step 2 (template selection)
```

---

## 🎯 ALL VISUAL STATES

### Campaign Name Input States

**1. DEFAULT** (Gray border, empty)
```
┌────────────────────────────────────────┐
│ Enter campaign name...                 │
└────────────────────────────────────────┘
                            0/100 chars
```

**2. FOCUSED** (Blue border, blue glow)
```
┌────────────────────────────────────────┐
│ Q1 2025 Enterprise O|                  │  ← Cursor blinking
└────────────────────────────────────────┘
                           20/100 chars
```

**3. VALID** (Green border, checkmark)
```
┌────────────────────────────────────────┐
│ Q1 2025 Enterprise Outreach         ✓  │  ← Green checkmark
└────────────────────────────────────────┘
✓ Campaign name is valid   28/100 chars
```

**4. ERROR** (Red border, alert icon)
```
┌────────────────────────────────────────┐
│ Hi                                  ⚠  │  ← Red alert
└────────────────────────────────────────┘
⚠️ Name must be at least 5 characters
                            2/100 chars
```

**5. DISABLED** (Gray background)
```
┌────────────────────────────────────────┐
│ Loading campaign data...               │  ← Gray bg
└────────────────────────────────────────┘
```

---

## 🐛 EXPECTED BEHAVIORS

### Auto-Save
- ✅ Starts 5 seconds after last keystroke
- ✅ Resets on every new keystroke
- ✅ Shows "Saving..." during save
- ✅ Shows "Saved [time]" after save
- ✅ Only saves valid data (5+ chars)

### Character Counter
- ✅ Gray: 0-89 characters
- ✅ Orange: 90-99 characters
- ✅ Red: 100 characters
- ✅ Prevents typing beyond 100

### Validation
- ✅ Runs on blur (click away)
- ✅ Not on focus
- ✅ Not during typing
- ✅ On form submission

### Next Button
- ✅ Disabled: Gray background, no hover
- ✅ Enabled: Blue background, hover effect
- ✅ Enables only when name is valid
- ✅ Objective & description optional

---

## 📊 ERROR MESSAGES REFERENCE

| Error Type | Emoji | Message |
|------------|-------|---------|
| Empty field | ❌ | Campaign name is required |
| Too short | ⚠️ | Name must be at least 5 characters |
| Too long | ❌ | Maximum 100 characters |
| Duplicate | ⚠️ | A campaign with this name already exists |
| Invalid chars | ❌ | Name cannot contain < > / \\ \| |

---

## 🔑 KEYBOARD SHORTCUTS

| Key | Action |
|-----|--------|
| Tab | Move to next field |
| Shift+Tab | Move to previous field |
| Enter (on Next) | Submit form |
| Escape (in dropdown) | Close dropdown |
| Arrow Down (dropdown) | Next option |
| Arrow Up (dropdown) | Previous option |

---

## 📱 RESPONSIVE BREAKPOINTS

### Desktop (> 1024px)
- Full progress bar (6 steps visible)
- Form: max-w-3xl (centered)
- All fields: Full width

### Tablet (768px - 1024px)
- Compact progress bar
- Form: Slightly narrower
- All fields: Full width

### Mobile (< 768px)
- Progress: Simplified dots
- Form: Full width, less padding
- Buttons: Full width or stacked

---

## 🎨 COLOR REFERENCE

### Borders
- Default: `#e5e7eb` (Gray 200)
- Focus: `#3b82f6` (Blue 500)
- Valid: `#86efac` (Green 300)
- Error: `#ef4444` (Red 500)

### Text
- Labels: `#111827` (Gray 900)
- Placeholder: `#9ca3af` (Gray 400)
- Success: `#16a34a` (Green 600)
- Error: `#dc2626` (Red 600)

### Buttons
- Enabled: `#2563eb` (Blue 600)
- Enabled Hover: `#1d4ed8` (Blue 700)
- Disabled: `#d1d5db` (Gray 300)

---

## 🏆 SUCCESS CRITERIA

Form is valid and ready to submit when:

✅ Campaign name is 5-100 characters
✅ Campaign name passes all validations
✅ No error messages present
✅ Green checkmark visible
✅ Next button is blue (enabled)

Optional fields (not required):
- Campaign Objective
- Description

---

## 💡 TIPS FOR TESTING

1. **Use the sidebar guide**: Fixed guide in bottom-right shows all test cases

2. **Test auto-save**: Type, then wait 5 full seconds without moving mouse

3. **Test character limit**: Copy-paste long text to reach 100 chars quickly

4. **Test duplicates**: Use exact names from the list:
   - "Q4 2024 Holiday Campaign"
   - "New Year Product Launch"
   - "Spring Sales Initiative"

5. **Test invalid chars**: Try each one: `< > / \ |`

6. **Test form reset**: Use "Start Over" button on success screen

7. **Watch console**: Form data logged on submission

8. **Test keyboard nav**: Use Tab to move between fields

---

## 🚨 COMMON ISSUES

### Issue: Auto-save not triggering
**Fix**: Wait full 5 seconds without typing or moving mouse

### Issue: Can't type in field
**Fix**: Check if disabled state is active (gray background)

### Issue: Next button won't enable
**Fix**: Ensure campaign name is valid (5+ chars, no errors)

### Issue: Error won't clear
**Fix**: Fix the underlying issue (add chars, remove invalid chars, etc.)

### Issue: Character counter wrong
**Fix**: Refresh page, counter should match exactly

---

## ⏱️ TOTAL TEST TIME

**Complete test suite**: ~15 minutes
- Quick smoke test: ~3 minutes
- All interactions: ~15 minutes
- Thorough testing: ~30 minutes

---

## 📞 DEMO ACCESS

**Development URL**: `http://localhost:5173/demo/campaign-wizard-step1`
**Production URL**: `/demo/campaign-wizard-step1`

---

## 📝 NEXT STEPS

After completing Step 1:
1. ✅ Click "Next: Select Template"
2. 🔄 Proceed to Step 2 (Template Selection)
3. 🎨 Choose from 6 campaign templates
4. ⏭️ Continue to Step 3 (Sequence Builder)

---

Ready to test all interactions! Navigate to `/demo/campaign-wizard-step1` and start with Test 1.
