# Schedule Call - Quick Test Guide (2 Minutes)

## 🎯 Quick Visual Test

**URL:** `http://localhost:5173/team/2`

---

## Test 1: Open Modal via Button (10 seconds)

1. **Action:** Click **Schedule Call** button in Quick Actions toolbar
2. **Expected Result:**
   ```
   ✅ Modal opens
   ✅ Title: "Schedule Call with Sarah Chen"
   ✅ Contact: sarah@bmi.com
   ✅ Date: Tomorrow's date (auto-filled)
   ✅ Time: 2:00 PM
   ✅ Duration: 30 min (selected)
   ✅ Call Type: Video Call (selected)
   ✅ Video Link: "Generate Zoom Link" button visible
   ✅ Subject: Empty
   ✅ Notes: Empty (optional)
   ✅ Both calendar checkboxes: Checked
   ✅ Schedule button: DISABLED (no subject yet)
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 2: Keyboard Shortcut (10 seconds)

1. **Action:** Close modal, press `C` key
2. **Expected Result:**
   ```
   ✅ Modal opens instantly
   ✅ Same appearance as button click
   ```

3. **Action:** Type in subject field, press `C`
4. **Expected Result:**
   ```
   ✅ Letter "c" appears in field
   ✅ Does NOT open second modal
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 3: Call Type Switching (20 seconds)

### A. Phone Call
1. **Action:** Select "Phone Call" radio button
2. **Expected:**
   ```
   ✅ Video Link section disappears
   ✅ Phone Number field appears
   ✅ Phone: "555-0001" (auto-filled)
   ✅ Field is editable
   ```

### B. Video Call
1. **Action:** Select "Video Call" radio button
2. **Expected:**
   ```
   ✅ Phone Number field disappears
   ✅ Video Link section appears
   ✅ "Generate Zoom Link" button visible
   ```

### C. In-Person
1. **Action:** Select "In-Person" radio button
2. **Expected:**
   ```
   ✅ Phone Number field hidden
   ✅ Video Link section hidden
   ✅ Only basic fields visible
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 4: Generate Zoom Link (15 seconds)

1. **Action:**
   - Select "Video Call"
   - Click "Generate Zoom Link" button

2. **Expected:**
   ```
   ✅ Button shows: "Generating..." with spinner
   ✅ After ~1 second: Link appears in input field
   ✅ Format: https://zoom.us/j/[numbers]
   ✅ "Clear" button appears next to link
   ✅ Link is editable
   ```

3. **Action:** Click "Clear" button
4. **Expected:**
   ```
   ✅ Link clears
   ✅ "Generate Zoom Link" button returns
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 5: Schedule Video Call (20 seconds)

1. **Action:**
   - Open modal
   - Keep date: Tomorrow
   - Keep time: 2:00 PM
   - Keep duration: 30 min
   - Keep call type: Video Call
   - Generate Zoom link
   - Enter subject: "Q4 Performance Review"
   - Enter notes: "Discuss goals and progress"
   - Keep both checkboxes checked
   - Click "Schedule Call"

2. **Expected Result:**
   ```
   ✅ Button shows: [video icon] + "Scheduling..." with spinner
   ✅ Toast appears: "Video Call scheduled with Sarah Chen for [date] at 2:00 PM"
   ✅ Modal closes
   ✅ Console log shows complete activity object:
      {
        type: "Call Scheduled",
        with: "Sarah Chen",
        callType: "video",
        videoLink: "[zoom link]",
        subject: "Q4 Performance Review",
        notes: "Discuss goals and progress",
        status: "Scheduled",
        ...
      }
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 6: Schedule Phone Call (15 seconds)

1. **Action:**
   - Open modal
   - Select "Phone Call"
   - Verify phone: "555-0001"
   - Enter subject: "Quick Check-in"
   - Click "Schedule Call"

2. **Expected:**
   ```
   ✅ Button shows: [phone icon] + "Scheduling..."
   ✅ Toast: "Phone Call scheduled with Sarah Chen for [date] at 2:00 PM"
   ✅ Modal closes
   ✅ Console log shows:
      {
        callType: "phone",
        phoneNumber: "555-0001",
        videoLink: undefined
      }
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 7: Schedule In-Person Meeting (15 seconds)

1. **Action:**
   - Open modal
   - Select "In-Person"
   - Enter subject: "Office Meeting"
   - Enter notes: "Meet in Conference Room A"
   - Click "Schedule Call"

2. **Expected:**
   ```
   ✅ Button shows: [mappin icon] + "Scheduling..."
   ✅ Toast: "In-Person Meeting scheduled with Sarah Chen for [date] at 2:00 PM"
   ✅ Modal closes
   ✅ Console log shows:
      {
        callType: "inperson",
        phoneNumber: undefined,
        videoLink: undefined,
        notes: "Meet in Conference Room A"
      }
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 8: Validation (15 seconds)

1. **Action:** Open modal (all defaults)
2. **Expected:**
   ```
   ✅ "Schedule Call" button DISABLED (gray)
   ✅ Reason: No subject entered
   ```

3. **Action:** Enter subject: "Test"
4. **Expected:**
   ```
   ✅ "Schedule Call" button ENABLED (blue)
   ✅ Icon changes with call type selection
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 9: Date Restrictions (10 seconds)

1. **Action:** Click on date picker
2. **Expected:**
   ```
   ✅ Past dates are disabled/grayed out
   ✅ Can only select today or future dates
   ✅ Default is tomorrow
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 10: Cancel Action (10 seconds)

1. **Action:**
   - Open modal
   - Fill in fields
   - Click "Cancel"

2. **Expected:**
   ```
   ✅ Modal closes
   ✅ No toast shown
   ✅ No activity logged in console
   ```

3. **Action:** Open modal, click X button
4. **Expected:**
   ```
   ✅ Same as Cancel
   ```

**Result:** ☐ PASS / ☐ FAIL

---

## 📊 Quick Results

**Total Tests:** 10
**Passed:** _____ / 10
**Failed:** _____ / 10

**Overall:** ☐ ALL PASS / ☐ NEEDS FIX

---

## 🎯 Critical Features Checklist

### Visual Elements
- [ ] Modal opens correctly
- [ ] All fields present and styled
- [ ] Icons on radio buttons
- [ ] Generate Zoom button works
- [ ] Buttons styled correctly

### Call Types
- [ ] Phone Call shows phone field
- [ ] Video Call shows video section
- [ ] In-Person hides both
- [ ] Icons change on button

### Functionality
- [ ] C key opens modal
- [ ] Generate Zoom link works (1s delay)
- [ ] Schedule creates activity
- [ ] Validation works
- [ ] Cancel closes without saving

### Feedback
- [ ] Toast on schedule (with details)
- [ ] Loading states show
- [ ] Console logs activity
- [ ] Buttons disable/enable correctly
- [ ] Dynamic toast messages

---

## 🔍 Console Log Check

### After Schedule Call
Look for:
```javascript
Call Activity Logged: {
  id: "call-[timestamp]",
  type: "Call Scheduled",
  with: "Sarah Chen",
  withEmail: "sarah@bmi.com",
  date: "2024-12-15",
  time: "14:00",
  formattedDateTime: "Dec 15, 2024 at 2:00 PM PST",
  duration: "30 minutes",
  callType: "video",
  videoLink: "https://zoom.us/j/...",
  subject: "[your subject]",
  notes: "[your notes]",
  status: "Scheduled",
  timestamp: "[ISO timestamp]",
  sendInvite: true,
  addToCalendar: true,
  relatedTo: "Sarah Chen (Team Member)"
}
```

---

## 💡 Quick Tips

### Opening Modal
- **Button:** Click "Schedule Call" in Quick Actions toolbar
- **Keyboard:** Press `C` (when not typing)
- **Location:** Top of page (sticky toolbar)

### Call Types
1. **Phone Call:** Shows phone number field
2. **Video Call:** Shows Zoom link generator
3. **In-Person:** Shows neither

### Duration Options
- 15 minutes
- 30 minutes (default)
- 1 hour

### Button Icons
- Phone Call: 📞 Phone icon
- Video Call: 📹 Video icon
- In-Person: 📍 MapPin icon

### Expected Toasts
- ✅ "Phone Call scheduled with Sarah Chen for [date] at [time]"
- ✅ "Video Call scheduled with Sarah Chen for [date] at [time]"
- ✅ "In-Person Meeting scheduled with Sarah Chen for [date] at [time]"

---

## 🚨 Common Issues to Watch For

### ❌ Modal Not Opening
- Check if Quick Actions toolbar is visible
- Try pressing C key instead
- Verify no other modal is open

### ❌ Keyboard Shortcut Not Working
- Make sure you're not typing in an input field
- Close any other open modals first
- Focus should be on the page

### ❌ Button Stays Disabled
- Verify subject field has content
- Date and time should have values (auto-filled)
- Check console for errors

### ❌ Zoom Link Not Generating
- Wait 1 full second (simulated delay)
- Check console for errors
- Try Clear and regenerate

### ❌ Wrong Call Type Icon
- Icon should match selected call type
- Phone: 📞 icon
- Video: 📹 icon
- In-Person: 📍 icon

---

## ✅ Success Criteria

**All tests must:**
1. ✅ Modal opens via button AND keyboard
2. ✅ All 3 call types work correctly
3. ✅ Zoom link generates in 1 second
4. ✅ Phone field appears for phone calls
5. ✅ Schedule creates activity with correct data
6. ✅ Validation works (subject required)
7. ✅ Console logs show complete data
8. ✅ Toast messages are dynamic (match call type)
9. ✅ Cancel/X close without saving
10. ✅ Date picker restricts past dates

---

**Test Date:** __________
**Tester:** __________
**Version:** Current
**Status:** ☐ Ready for Production / ☐ Needs Work
