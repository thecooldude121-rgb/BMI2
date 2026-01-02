# All 7 Quick Actions - Quick Test (10 Minutes)

## 🎯 Test All Features

**URL:** `http://localhost:5173/team/2`
**Member:** Sarah Chen
**Role:** Set to Manager

---

## ⌨️ Keyboard Shortcuts Reference

```
E - Send Email
C - Schedule Call
M - Schedule Meeting
T - Create Task
N - Add Note
D - Share Document
A - More Actions (dropdown)
Esc - Close anything
```

---

## Test 1: Send Email (1 minute)

**Actions:**
1. Press `E`
2. See modal: "Send Email to Sarah Chen"
3. Click "Template" dropdown
4. Select "General Follow-up"
5. See subject + body auto-fill
6. Type in body: "Let's connect soon"
7. Click "Send Email"
8. Toast: "Email sent to Sarah Chen"
9. Check console for log

**Result:** ☐ PASS / ☐ FAIL

---

## Test 2: Schedule Call (1 minute)

**Actions:**
1. Press `C`
2. See modal: "Schedule Call with Sarah Chen"
3. Keep tomorrow's date
4. Select "Video Call"
5. Click "Generate Zoom Link"
6. Wait 1 second - see link appear
7. Enter subject: "Q4 Check-in"
8. Click "Schedule Call"
9. Toast: "Video Call scheduled..."
10. Check console for log

**Result:** ☐ PASS / ☐ FAIL

---

## Test 3: Schedule Meeting (1.5 minutes)

**Actions:**
1. Press `M`
2. See modal: "Schedule Meeting with Sarah Chen"
3. Keep "1-on-1" selected
4. Click "Agenda Template"
5. Select "Performance Review"
6. See agenda auto-fill
7. Keep "Video" location
8. Enter subject: "Q4 Review"
9. Click "Schedule Meeting"
10. Toast: "1-on-1 scheduled..."
11. Check console for log

**Result:** ☐ PASS / ☐ FAIL

---

## Test 4: Create Task (1 minute)

**Actions:**
1. Press `T`
2. See modal: "Create Task"
3. Keep "Sarah Chen" assigned
4. Enter title: "Review Q4 data"
5. Select "High" priority (orange)
6. See "Related to: Sarah Chen" info box
7. Keep reminder checked
8. Click "Create Task"
9. Toast: "Task created for Sarah Chen"
10. Check console for log

**Result:** ☐ PASS / ☐ FAIL

---

## Test 5: Add Note (1.5 minutes)

**Actions:**
1. Press `N`
2. See modal: "Add Note about Sarah Chen"
3. Keep "Coaching Note" selected
4. Enter subject: "Q4 Discussion"
5. Enter content: "Great performance this quarter"
6. Check "Pipeline Management"
7. Check "HRMS Strategy"
8. See blue tags appear
9. Keep "Private" visibility
10. Click "Save Note"
11. Toast: "Coaching note added..."
12. Check console for log

**Result:** ☐ PASS / ☐ FAIL

---

## Test 6: Share Document (2 minutes)

**Actions:**
1. Press `D`
2. See modal: "Share Document with Sarah Chen"
3. Keep "Library" tab
4. Click "Q4_Performance_Template.xlsx"
5. See blue border + checkmark
6. Enter message: "Please review"
7. Select "Can View"
8. Change expires to "7 days"
9. Click "Share Document"
10. Toast: "Document shared..."
11. Check console for log

**Now test upload:**
12. Press `D` again
13. Click "Upload New" tab
14. See drag & drop zone
15. (Optional) Drop a file or click Choose File
16. See file info appear
17. Click Cancel

**Result:** ☐ PASS / ☐ FAIL

---

## Test 7: More Actions Dropdown (2 minutes)

**Actions:**
1. Press `A`
2. See dropdown with 12 items
3. See 3 section dividers
4. Hover items - see bg change
5. Click "View Calendar"
6. See navigation + toast
7. Go back to /team/2
8. Press `A`
9. Click "Copy Email Address"
10. Toast: "Email address copied"
11. Paste: verify `sarah@bmi.com`
12. Press `A`
13. Click "Refresh Data"
14. Toast: "Refreshing..." then "refreshed"

**Test admin items (if Admin/CEO):**
15. Press `A`
16. See "User Settings" at bottom
17. See "View Audit Log" at bottom
18. Click outside - dropdown closes

**Result:** ☐ PASS / ☐ FAIL

---

## Quick Keyboard Test (30 seconds)

**Actions:**
1. Press `E` → Modal opens
2. Press `Esc` → Modal closes
3. Press `C` → Modal opens
4. Press `Esc` → Modal closes
5. Press `M` → Modal opens
6. Press `Esc` → Modal closes
7. Press `T` → Modal opens
8. Press `Esc` → Modal closes
9. Press `N` → Modal opens
10. Press `Esc` → Modal closes
11. Press `D` → Modal opens
12. Press `Esc` → Modal closes
13. Press `A` → Dropdown opens
14. Press `A` → Dropdown closes

**Typing Safety Test:**
15. Press `E` to open email modal
16. Click in Subject field
17. Press `M` → Letter "m" appears in field
18. Should NOT open meeting modal
19. Press `Esc` to close

**Result:** ☐ PASS / ☐ FAIL

---

## Console Logs Check

### After Each Action, Verify Console Shows:

**Email:**
```javascript
Email Activity Logged: {
  type: "Email",
  to: "Sarah Chen",
  subject: "...",
  status: "Sent"
}
```

**Call:**
```javascript
Call Scheduled Activity: {
  type: "Call Scheduled",
  with: "Sarah Chen",
  callType: "video",
  videoLink: "https://zoom.us/..."
}
```

**Meeting:**
```javascript
Meeting Activity Logged: {
  type: "Meeting Scheduled",
  meetingType: "1-on-1",
  agendaTemplate: "Performance Review"
}
```

**Task:**
```javascript
Task Activity Logged: {
  type: "Task Assigned",
  priority: "high",
  relatedTo: "team"
}
```

**Note:**
```javascript
Coaching Note Saved: {
  type: "coaching",
  focusAreas: ["Pipeline Management", "HRMS Strategy"]
}
```

**Document:**
```javascript
Document Shared Activity: {
  type: "Document Shared",
  documentName: "Q4_Performance_Template.xlsx",
  permission: "view",
  expires: "7days"
}
```

---

## Expected Toasts

### All 7 Actions Should Show:

1. ✅ "Email sent to Sarah Chen"
2. ✅ "Video Call scheduled with Sarah Chen for Dec 15 at 2:00 PM"
3. ✅ "1-on-1 scheduled with Sarah Chen for Dec 20 at 10:00 AM"
4. ✅ "Task created for Sarah Chen"
5. ✅ "Coaching note added for Sarah Chen"
6. ✅ "Document shared with Sarah Chen"
7. ✅ "Email address copied" (or other More Actions feedback)

---

## 📊 Quick Results

**Test 1 (Email):** ☐ PASS / ☐ FAIL
**Test 2 (Call):** ☐ PASS / ☐ FAIL
**Test 3 (Meeting):** ☐ PASS / ☐ FAIL
**Test 4 (Task):** ☐ PASS / ☐ FAIL
**Test 5 (Note):** ☐ PASS / ☐ FAIL
**Test 6 (Document):** ☐ PASS / ☐ FAIL
**Test 7 (More Actions):** ☐ PASS / ☐ FAIL
**Keyboard Test:** ☐ PASS / ☐ FAIL

**Overall:** ☐ ALL PASS / ☐ NEEDS FIX

---

## ✅ Critical Features Checklist

### Email
- [ ] Opens via E key
- [ ] 5 templates available
- [ ] Template auto-fills subject + body
- [ ] Attachments can be added
- [ ] Save Draft works
- [ ] Send logs activity
- [ ] Toast shows recipient

### Call
- [ ] Opens via C key
- [ ] 3 call types work
- [ ] Video generates Zoom link
- [ ] Phone shows number field
- [ ] Calendar reminders work
- [ ] Logs complete activity
- [ ] Toast shows call type + date/time

### Meeting
- [ ] Opens via M key
- [ ] 3 meeting types work
- [ ] 1-on-1 shows agenda templates
- [ ] Templates auto-fill
- [ ] Zoom link generates
- [ ] Multiple attendees work
- [ ] Recurring options work
- [ ] Logs complete activity
- [ ] Toast shows meeting type

### Task
- [ ] Opens via T key
- [ ] Assign to dropdown populated
- [ ] 4 priority levels work
- [ ] Colors show for priorities
- [ ] Team member shows info box
- [ ] Reminder checkbox works
- [ ] Logs activity
- [ ] Toast shows assignee

### Note
- [ ] Opens via N key
- [ ] 3 note types work
- [ ] Coaching shows focus areas
- [ ] Multi-select checkboxes work
- [ ] Tags appear for selections
- [ ] Development goals field works
- [ ] 2 visibility options work
- [ ] Info box shows
- [ ] Logs complete note
- [ ] Toast shows note type

### Document
- [ ] Opens via D key
- [ ] 2 tabs work (Library/Upload)
- [ ] 4 recent documents shown
- [ ] Radio select works
- [ ] Drag & drop works
- [ ] File picker works
- [ ] File info displays
- [ ] 3 permissions work
- [ ] 4 expiration options work
- [ ] Logs activity
- [ ] Toast shows

### More Actions
- [ ] Opens via A key
- [ ] 12 items visible
- [ ] Icons show for all
- [ ] 3 dividers present
- [ ] Hover effect works
- [ ] View Calendar navigates
- [ ] Copy Email works (clipboard)
- [ ] Refresh Data works
- [ ] Export shows toasts
- [ ] Admin items show (if admin)
- [ ] Click outside closes
- [ ] A toggles open/close

---

## 🚨 Common Issues

### ❌ Modal Not Opening
- Check keyboard shortcut
- Try clicking button instead
- Verify no other modal open
- Check console for errors

### ❌ Template Not Working
- Verify correct modal open
- Check template dropdown visible
- For meetings: Must select "1-on-1" first
- Select template from dropdown

### ❌ Zoom Link Not Generating
- Wait full 1 second
- Check for loading spinner
- Should see link in input field
- Try clicking button again

### ❌ Dropdown Not Showing
- Press A key
- Check More Actions button clicked
- Verify not in modal
- Try clicking outside then A again

### ❌ Clipboard Not Working
- Browser may block clipboard access
- Try clicking button instead of keyboard
- Check browser permissions
- Paste to verify

---

## Success Criteria

**All tests must show:**
1. ✅ Modals open via keyboard AND buttons
2. ✅ Templates auto-fill correctly
3. ✅ Conditional fields show/hide properly
4. ✅ Generation features work (Zoom links)
5. ✅ Multi-select features work
6. ✅ Validation prevents empty submissions
7. ✅ Console logs show complete data
8. ✅ Toast messages are accurate
9. ✅ Cancel/X/Esc close without saving
10. ✅ All keyboard shortcuts work
11. ✅ Dropdown toggles and closes
12. ✅ Navigation works from dropdown

---

## 🎯 Performance Targets

**Speed:**
- Modal opens: < 100ms
- Template fills: Instant
- Zoom link: ~1 second
- Activity logs: Instant
- Toasts appear: Instant
- Navigation: < 200ms

**UX:**
- No layout shifts
- Smooth animations
- Clear feedback
- No errors in console
- Keyboard shortcuts always work
- Dropdown closes appropriately

---

## 📝 Test Notes

**Environment:**
- URL: http://localhost:5173/team/2
- Browser: _____________
- Role: _____________
- Date: _____________

**Issues Found:**
(Write any issues here)

**Overall Assessment:**
☐ Ready for Production
☐ Minor Issues (list above)
☐ Major Issues (needs work)

**Tester:** _____________
**Time Taken:** ______ minutes
**Pass Rate:** _____ / 8 tests

---

**Last Updated:** December 2024
**Version:** 1.0.0
**Purpose:** Quick verification of all 7 Quick Actions
