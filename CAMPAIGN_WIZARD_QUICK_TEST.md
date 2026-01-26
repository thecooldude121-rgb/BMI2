# CAMPAIGN CREATION WIZARD - 3-MINUTE QUICK TEST

## Test Objective
Verify the complete 6-step campaign creation wizard works correctly.

---

## QUICK TEST SCRIPT

### Access (10 seconds)
1. Navigate to `/lead-generation/campaigns`
2. Verify "Create Campaign" button visible (top-right, blue with rocket icon)
3. Click "Create Campaign"
4. **Expected**: Navigate to `/lead-generation/campaigns/create`

---

### Step 1: Basic Info (20 seconds)
1. **Verify Progress Tracker**:
   - Step 1 circle is blue with "1" inside
   - Step 1 label says "Basic Info" with "← Current"
   - All other steps are gray with "Not started"

2. **Fill Form**:
   - Campaign Name: `"Test Q1 2025 Campaign"`
   - Description: `"Testing campaign wizard functionality"`
   - Click "Email" type card (should highlight blue)
   - Goal: `"Book 50 demo calls"`

3. **Verify UI**:
   - Pro tip callout visible (blue background)
   - All inputs accept text
   - Email card shows blue border when selected

4. **Navigate**:
   - Click "Next: Template →" button (bottom right)
   - **Expected**: Advance to Step 2

---

### Step 2: Template Selection (30 seconds)
1. **Verify Progress Tracker**:
   - Step 1 shows green circle with checkmark + "✓ Complete"
   - Step 2 shows blue circle with "2" + "← Current"
   - Line between steps 1-2 is green

2. **Verify Templates**:
   - 6 template cards displayed in 3x2 grid
   - Each card shows:
     - Icon (📧, ✨, 🔄, 📅, 🎯, ⚡)
     - Template name
     - Touch count
     - Channel type
     - "Perfect for" bullet points
     - Performance metrics (or "No pre-set data")
     - Select/Start button

3. **Template Cards to Check**:
   - Cold Outreach: 5-touch, 28% open, 8% reply
   - Warm Intro: 3-touch, 55% open, 20% reply
   - Re-engagement: 4-touch, 18% open, 5% reply
   - Event Follow-up: 3-touch, N/A, 12% reply
   - Trial Follow-up: 5-touch, 42% open, 15% reply
   - Start from Scratch: Build your own, no data

4. **Select Template**:
   - Click "Select Template" on "Cold Outreach"
   - **Expected**: Auto-advance to Step 3

---

### Step 3: Sequence Builder (10 seconds)
1. **Verify Progress Tracker**:
   - Steps 1-2 green with checkmarks
   - Step 3 blue + current
   - Green line from 1 to 3

2. **Verify Content**:
   - Placeholder UI shows 🔀 icon
   - Text: "Sequence builder will be configured here"
   - Shows selected template: "cold-outreach"

3. **Navigate**:
   - Click "Next: Leads →"
   - **Expected**: Advance to Step 4

---

### Step 4: Lead Selection (10 seconds)
1. **Verify Progress Tracker**:
   - Steps 1-3 green
   - Step 4 blue + current
   - Green line through 1-4

2. **Verify Content**:
   - Placeholder UI shows 👥 icon
   - Text: "Lead selection interface will be configured here"

3. **Navigate**:
   - Click "Next: Settings →"
   - **Expected**: Advance to Step 5

---

### Step 5: Settings (30 seconds)
1. **Verify Progress Tracker**:
   - Steps 1-4 green
   - Step 5 blue + current
   - Green line through 1-5

2. **Verify Settings Panel**:
   - 6 settings displayed in bordered boxes
   - Each has title, description, and toggle/input

3. **Check Default Values**:
   - ✅ Send Time Optimization: ON (blue toggle)
   - ✅ Timezone Aware: ON
   - ✅ Business Hours Only: ON
   - Daily Send Limit: 50
   - ✅ Stop on Reply: ON
   - ✅ Stop on Unsubscribe: ON

4. **Test Interactions**:
   - Click "Send Time Optimization" toggle
     - Should turn OFF (gray)
   - Click it again
     - Should turn ON (blue)
   - Change Daily Send Limit to `100`
     - Input should update

5. **Navigate**:
   - Click "Next: Review →"
   - **Expected**: Advance to Step 6

---

### Step 6: Review & Launch (20 seconds)
1. **Verify Progress Tracker**:
   - Steps 1-5 green
   - Step 6 blue + current
   - Green line through 1-6
   - Next button should be disabled (gray)

2. **Verify Campaign Summary**:
   - Name: "Test Q1 2025 Campaign"
   - Type: "email"
   - Template: "cold-outreach"
   - Daily Limit: "100 emails/day" (if changed in Step 5)

3. **Verify Action Buttons**:
   - 🚀 Launch Campaign (green, left)
   - 💾 Save as Draft (gray, right)
   - Both buttons same width, side by side

---

### Test Navigation (20 seconds)
1. **Backward Navigation**:
   - Click "← Previous: Settings"
   - **Expected**: Return to Step 5
   - Verify Step 5 is current (blue)
   - Verify data persists (Daily Limit still 100)

2. **Forward Navigation**:
   - Click "Next: Review →"
   - **Expected**: Return to Step 6

3. **Multiple Backward Clicks**:
   - Click Previous 5 times
   - **Expected**: Return to Step 1
   - Verify Previous button is disabled (gray)
   - Verify all form data persists

---

### Test Save Draft (10 seconds)
1. From any step, click "💾 Save Draft" (top right)
2. **Expected**:
   - Console log shows: "Saving draft: [form data]"
   - Navigate back to `/lead-generation/campaigns`

---

### Test Exit Methods (10 seconds)
1. Click "Create Campaign" again to restart wizard
2. Fill in campaign name
3. Click "✕" button (top right)
4. **Expected**: Return to campaigns page

5. Restart wizard again
6. Click "← Back to Campaigns" (top left)
7. **Expected**: Return to campaigns page

---

## TOTAL TEST TIME
**Target**: 3 minutes
**Actual**: ~2.5 - 3.5 minutes depending on reading speed

---

## SUCCESS CRITERIA

### Must Work:
- ✅ Wizard loads without errors
- ✅ All 6 steps display correctly
- ✅ Progress tracker updates on navigation
- ✅ Forward/backward navigation works
- ✅ Template selection auto-advances
- ✅ Form data persists between steps
- ✅ Toggle switches work
- ✅ Save Draft returns to campaigns
- ✅ Exit methods return to campaigns

### Visual Checks:
- ✅ Progress tracker shows correct colors
- ✅ Template cards in 3x2 grid
- ✅ Settings toggles aligned right
- ✅ Previous button disabled on Step 1
- ✅ Next button disabled on Step 6
- ✅ Blue info callouts visible
- ✅ Icons display correctly

### Data Validation:
- ✅ Campaign name persists across steps
- ✅ Template selection remembered
- ✅ Settings changes persist
- ✅ Summary shows correct data

---

## COMMON ISSUES & FIXES

### Issue: Page doesn't load
**Check**: Route is configured in LeadGenerationModule.tsx
**Fix**: Verify import and route path

### Issue: Progress tracker doesn't update
**Check**: currentStep state is changing
**Fix**: Check handleNext/handlePrevious functions

### Issue: Template cards not showing
**Check**: campaignTemplates array is defined
**Fix**: Verify template data structure

### Issue: Navigation buttons don't work
**Check**: Step bounds (1-6)
**Fix**: Verify conditional logic in handlers

### Issue: Form data doesn't persist
**Check**: formData state is being updated
**Fix**: Verify useState and setFormData calls

---

## BROWSER TESTING

### Desktop Browsers:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Mobile Browsers:
- ⚠️ Chrome Mobile (layout may vary)
- ⚠️ Safari Mobile (layout may vary)

**Note**: Wizard optimized for desktop use. Mobile experience may require horizontal scrolling on template grid.

---

## PERFORMANCE CHECKS

### Load Time:
- Initial render: < 1 second
- Step transitions: < 100ms
- Toggle animations: Smooth, no lag

### Console Errors:
- Should be zero errors
- Warnings acceptable for dev mode

### Memory:
- No memory leaks on navigation
- No excessive re-renders

---

## ACCESSIBILITY QUICK CHECK

1. **Tab Navigation**:
   - Press Tab key repeatedly
   - Should cycle through: inputs, type cards, buttons
   - Visual focus indicator visible

2. **Keyboard Shortcuts**:
   - Enter key on template card should select it
   - Space bar on toggles should switch them

3. **Screen Reader**:
   - Labels present on all inputs
   - Button purposes clear

---

## SCREENSHOT CHECKLIST

Capture these views for documentation:

1. ✅ Step 1 with form filled
2. ✅ Step 2 showing all 6 templates
3. ✅ Step 5 with all settings visible
4. ✅ Step 6 summary view
5. ✅ Progress tracker at each step
6. ✅ Mobile view (if responsive)

---

## FINAL VALIDATION

After completing full test:

```
✅ Wizard accessible from campaigns page
✅ All 6 steps render correctly
✅ Progress tracker accurate
✅ Navigation works both directions
✅ Form data persists
✅ Templates display with correct data
✅ Settings toggles functional
✅ Summary shows accurate info
✅ Save Draft works
✅ Exit methods work
✅ No console errors
✅ Smooth animations
✅ Professional appearance
```

**If all checked**: ✅ **WIZARD READY FOR USE**

---

## NEXT ITERATION PRIORITIES

Based on this test, these features need implementation:

1. **Step 3: Sequence Builder**
   - Touch configuration UI
   - Email content editor
   - Delay settings

2. **Step 4: Lead Selection**
   - Lead list filtering
   - Import/upload
   - Lead count display

3. **Step 6: Enhanced Review**
   - Full campaign preview
   - Email preview
   - Scheduling options

4. **General Enhancements**:
   - Auto-save functionality
   - Resume draft editing
   - Field validation messages
   - Success/error toasts
