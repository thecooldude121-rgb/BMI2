# Campaign Wizard Navigation Buttons - Quick Test Card

## 🎯 Previous Button Test (2 min)

### Visual Check
- [ ] Gray button with border on bottom left
- [ ] Label: "← Previous: Basic Info"
- [ ] Hover effect changes color

### Click Test
1. Select "Cold Outreach" template
2. Click "Previous: Basic Info"
3. **✓ Verify:** Scroll to top, return to Step 1

### Keyboard Test
1. Select any template
2. Press **Alt + ←** (Windows) or **Option + ←** (Mac)
3. **✓ Verify:** Same behavior as clicking

### Loading State
1. Click Next, then immediately click Previous
2. **✓ Verify:** Previous button disabled during loading

---

## 🎯 Next Button Test (3 min)

### Disabled State (No Template)
1. Don't select any template
2. Look at Next button
3. **✓ Verify:**
   - Gray background
   - Gray text
   - Cursor shows "not-allowed"
   - Can't click

### Enabled State (Template Selected)
1. Select "Cold Outreach"
2. Look at Next button
3. **✓ Verify:**
   - Blue background
   - White text
   - Hover shows shadow
   - Label: "Next: Build Sequence →"

### Loading State
1. Click Next button
2. **✓ Verify:**
   - Shows spinner icon
   - Text: "Loading..."
   - Lasts at least 500ms
   - Can't double-click

### Error Message
1. Clear template selection (if possible)
2. Try to click Next
3. **✓ Verify:** Toast shows "⚠️ Please select a template or start from scratch"

### Template Loading Behavior
1. Select "Start from Scratch"
2. Click Next
3. **✓ Verify:** Console logs "Loading empty sequence builder"

4. Go back, select "Cold Outreach"
5. Click Next
6. **✓ Verify:** Console logs "Loading 5 pre-filled touches"

---

## ⚡ Speed Tests

### Minimum Load Time
1. Open DevTools Console
2. Select template
3. Note time before clicking Next
4. Click Next
5. Note time when loading completes
6. **✓ Verify:** At least 500ms elapsed

### Scroll Behavior
1. Scroll to bottom of Step 2
2. Click Next
3. **✓ Verify:** Page scrolls to top smoothly before navigation

---

## 🔗 Integration Tests

### Draft Persistence
1. Select "LinkedIn Outreach"
2. Click Previous
3. Click Next from Step 1
4. **✓ Verify:** "LinkedIn Outreach" still selected

### Progress Tracker
1. On Step 2, note progress indicators
2. Click Next
3. **✓ Verify:** Step 3 becomes active, Step 2 shows checkmark

---

## 📊 Pass/Fail Summary

| Feature | Pass | Fail | Notes |
|---------|------|------|-------|
| Previous button click | [ ] | [ ] | |
| Previous keyboard shortcut | [ ] | [ ] | |
| Next disabled state | [ ] | [ ] | |
| Next enabled state | [ ] | [ ] | |
| Next loading state | [ ] | [ ] | |
| 500ms minimum load | [ ] | [ ] | |
| Scroll to top | [ ] | [ ] | |
| Draft auto-save | [ ] | [ ] | |
| Error validation | [ ] | [ ] | |

---

## 🚀 Expected Results

**All checks should pass:**
- Previous button works via click and keyboard
- Next button validates template selection
- Loading state prevents double-clicks
- Minimum 500ms load time enforced
- Smooth scroll to top on navigation
- Draft saved automatically
- Clean error messages for invalid states

**Time to complete:** ~5 minutes
