# Email Composer - Quick Test Guide (2 Minutes)

## 🎯 Quick Visual Test

**URL:** `http://localhost:5173/team/2`

---

## Test 1: Open Modal via Button (15 seconds)

1. **Action:** Click **Send Email** button in Quick Actions toolbar
2. **Expected Result:**
   ```
   ✅ Modal opens
   ✅ Title: "Send Email to Sarah Chen"
   ✅ To: sarah@bmi.com (gray/disabled)
   ✅ From: john.smith@company.com (gray/disabled)
   ✅ CC: empty
   ✅ BCC: empty
   ✅ Template dropdown showing "None (blank email)"
   ✅ Subject: empty
   ✅ Message: empty with placeholder
   ✅ Attachments section with "Add Files" button
   ✅ Footer: [Cancel] [Save as Draft] [Send Email]
   ✅ Buttons disabled (no content yet)
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 2: Keyboard Shortcut (10 seconds)

1. **Action:** Close modal, press `E` key
2. **Expected Result:**
   ```
   ✅ Modal opens instantly
   ✅ Same appearance as button click
   ```

3. **Action:** Type in subject field, press `E`
4. **Expected Result:**
   ```
   ✅ Letter "e" appears in field
   ✅ Does NOT open second modal
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 3: Template Selection (20 seconds)

1. **Action:** Open Template dropdown
2. **Expected Options:**
   ```
   ✅ None (blank email)
   ✅ General Follow-up
   ✅ Meeting Request
   ✅ Performance Check-in
   ✅ Resource Sharing
   ```

3. **Action:** Select "Performance Check-in"
4. **Expected Result:**
   ```
   ✅ Subject fills: "Performance Check-in - Sarah Chen"
   ✅ Body fills with template text starting with "Hi Sarah,"
   ✅ Fields are editable
   ✅ Buttons now enabled
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 4: Add Attachments (15 seconds)

1. **Action:** Click "Add Files" button
2. **Action:** Select 1-2 files
3. **Expected Result:**
   ```
   ✅ Files appear in list with 📎 icon
   ✅ Each file has remove button (X)
   ✅ File names displayed correctly
   ```

4. **Action:** Click X on one file
5. **Expected Result:**
   ```
   ✅ File removed from list
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 5: Save as Draft (15 seconds)

1. **Action:**
   - Enter subject: "Test Draft"
   - Enter body: "Draft message"
   - Click "Save as Draft"

2. **Expected Result:**
   ```
   ✅ Button shows loading: "Saving..."
   ✅ Toast appears: "Email saved as draft"
   ✅ Modal STAYS OPEN (important!)
   ✅ Console log shows draft object
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 6: Send Email (15 seconds)

1. **Action:**
   - Enter subject: "Test Email"
   - Enter body: "Test message"
   - Click "Send Email"

2. **Expected Result:**
   ```
   ✅ Button shows loading: "Sending..."
   ✅ Toast appears: "Email sent to Sarah Chen"
   ✅ Modal CLOSES
   ✅ Console log shows activity object with:
      - type: "Email"
      - to: "Sarah Chen"
      - subject, body, timestamp
      - status: "Sent"
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 7: Validation (20 seconds)

1. **Action:** Open modal (empty fields)
2. **Expected:**
   ```
   ✅ "Save as Draft" button DISABLED (gray)
   ✅ "Send Email" button DISABLED (gray)
   ```

3. **Action:** Enter only subject
4. **Expected:**
   ```
   ✅ Buttons still DISABLED
   ```

5. **Action:** Enter body text
6. **Expected:**
   ```
   ✅ "Save as Draft" button ENABLED (blue outline)
   ✅ "Send Email" button ENABLED (blue solid)
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 8: Cancel Actions (10 seconds)

1. **Action:** Enter text, click "Cancel"
2. **Expected:**
   ```
   ✅ Modal closes
   ✅ No toast shown
   ```

3. **Action:** Open modal, click X button
4. **Expected:**
   ```
   ✅ Modal closes
   ✅ No toast shown
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## 📊 Quick Results

**Total Tests:** 8
**Passed:** _____ / 8
**Failed:** _____ / 8

**Overall:** ☐ ALL PASS / ☐ NEEDS FIX

---

## 🎯 Critical Features Checklist

### Visual Elements
- [ ] Modal opens correctly
- [ ] Pre-filled fields (To, From)
- [ ] All 5 templates available
- [ ] Attachment upload works
- [ ] Buttons styled correctly

### Functionality
- [ ] E key opens modal
- [ ] Template auto-fills work
- [ ] Save draft keeps modal open
- [ ] Send closes modal
- [ ] Validation works

### Feedback
- [ ] Toast on save draft
- [ ] Toast on send
- [ ] Loading states show
- [ ] Console logs activity
- [ ] Buttons disable/enable correctly

---

## 🔍 Console Log Check

### After Send Email
Look for:
```javascript
Email Activity Logged: {
  id: "email-[timestamp]",
  type: "Email",
  to: "Sarah Chen",
  toEmail: "sarah@bmi.com",
  subject: "[your subject]",
  body: "[your message]",
  template: "[template name]",
  date: "[ISO timestamp]",
  timestamp: "[readable time]",
  status: "Sent",
  relatedTo: "Sarah Chen (Team Member)",
  attachmentCount: [number]
}
```

### After Save Draft
Look for:
```javascript
Email Draft Saved: {
  id: "draft-[timestamp]",
  to: "sarah@bmi.com",
  toName: "Sarah Chen",
  subject: "[your subject]",
  body: "[your message]",
  template: "[template name]",
  savedAt: "[ISO timestamp]",
  status: "Draft"
}
```

---

## 💡 Quick Tips

### Opening Modal
- **Button:** Click "Send Email" in Quick Actions toolbar
- **Keyboard:** Press `E` (when not typing)
- **Location:** Top of page (sticky toolbar)

### Template Names
1. None (blank email)
2. General Follow-up
3. Meeting Request
4. Performance Check-in
5. Resource Sharing

### Button States
- **Gray/Disabled:** When subject OR body is empty
- **Blue Outline (Draft):** When both have content
- **Blue Solid (Send):** When both have content

### Expected Toasts
- ✅ "Email sent to Sarah Chen" (on send)
- ✅ "Email saved as draft" (on save)

---

## 🚨 Common Issues to Watch For

### ❌ Modal Not Opening
- Check if Quick Actions toolbar is visible
- Verify role allows Send Email button
- Try pressing E key instead

### ❌ Keyboard Shortcut Not Working
- Make sure you're not typing in an input field
- Close any other open modals first
- Focus should be on the page, not in a field

### ❌ Buttons Stay Disabled
- Verify BOTH subject AND body have content
- Even a space counts as content
- Check console for errors

### ❌ Template Not Filling
- Verify dropdown shows selected template
- Try selecting different template first
- Check if fields are actually editable

---

## ✅ Success Criteria

**All tests must:**
1. ✅ Modal opens via button AND keyboard
2. ✅ All 5 templates work
3. ✅ Attachments can be added/removed
4. ✅ Draft saves and keeps modal open
5. ✅ Send closes modal with toast
6. ✅ Validation works correctly
7. ✅ Console logs show correct data
8. ✅ Cancel/X close without saving

---

**Test Date:** __________
**Tester:** __________
**Version:** Current
**Status:** ☐ Ready for Production / ☐ Needs Work
