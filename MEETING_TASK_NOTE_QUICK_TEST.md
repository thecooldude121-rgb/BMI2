# Meeting, Task, Note - Quick Test (6 Minutes)

## 🎯 Test All 3 Features

**URL:** `http://localhost:5173/team/2`

---

## Test 1: Schedule Meeting (2 minutes)

### Open Modal
**Action:** Press `M` key (or click Schedule Meeting button)

**Expected:**
```
✅ Modal opens
✅ Title: "Schedule Meeting with Sarah Chen"
✅ Contact: sarah@bmi.com
✅ Meeting Type: "1-on-1" selected (default)
✅ Date: Next week (auto-filled)
✅ Time: 10:00 AM
✅ Duration: 30 min selected
✅ Location: Video selected
✅ "Agenda Template" dropdown visible (for 1-on-1s)
✅ Subject: Empty
✅ Additional Attendees: Empty
✅ Recurring: One-time selected
✅ Both reminders: Checked
```

### Test Agenda Template
**Action:** Click "Agenda Template" dropdown

**Expected:**
```
✅ See 6 options:
   - Custom (write your own)
   - General Check-in
   - Performance Review
   - Goal Setting
   - Coaching Session
   - Career Development
```

**Action:** Select "Performance Review"

**Expected:**
```
✅ Agenda field auto-fills with template content:
   "1. Review key metrics and achievements
    2. Areas of strength
    3. Growth opportunities
    4. Development plan
    5. Questions and feedback"
```

### Test Video Link Generation
**Action:** Click "Generate Zoom Link" button

**Expected:**
```
✅ Button shows "Generating..." with spinner
✅ After ~1 second: Link appears in input field
✅ Format: https://zoom.us/j/[numbers]
✅ "Clear" button appears next to link
✅ Link is editable
```

### Test Meeting Type Switch
**Action:** Select "Team Meeting" radio button

**Expected:**
```
✅ "Agenda Template" dropdown disappears
✅ (Templates only for 1-on-1s)
```

**Action:** Select "1-on-1" again

**Expected:**
```
✅ "Agenda Template" dropdown reappears
```

### Test Location Types
**Action:** Select "Office" radio button

**Expected:**
```
✅ Text input appears below
✅ Placeholder: "Enter room name or details"
```

**Action:** Select "External Location"

**Expected:**
```
✅ Text input appears
✅ Placeholder: "Enter address or location"
```

**Action:** Select "Video" again

### Add Attendee
**Action:**
- Type "john@company.com" in attendee field
- Click "Add" button

**Expected:**
```
✅ Email appears as blue pill/tag below
✅ X button to remove
✅ Input field clears
```

### Schedule Meeting
**Action:**
- Enter subject: "Q4 Performance Review"
- Click "Schedule Meeting"

**Expected:**
```
✅ Button shows "Scheduling..." with spinner
✅ Toast appears: "1-on-1 scheduled with Sarah Chen for [date] at 10:00 AM"
✅ Modal closes
✅ Console log shows complete activity:
   {
     type: "Meeting Scheduled",
     meetingType: "1-on-1",
     with: "Sarah Chen",
     subject: "Q4 Performance Review",
     locationType: "video",
     videoLink: "[zoom link]",
     agenda: "[template content]",
     additionalAttendees: ["john@company.com"],
     ...
   }
```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 2: Create Task (2 minutes)

### Open Modal
**Action:** Press `T` key (or click Create Task button)

**Expected:**
```
✅ Modal opens
✅ Title: "Create Task"
✅ Subtitle: "Task for Sarah Chen"
✅ Assign To: "Sarah Chen" selected
✅ Task Title: Empty
✅ Description: Empty
✅ Due Date: 2 days from now (auto-filled)
✅ Priority: "Medium" selected
✅ Related To: "Team Member" selected
✅ Blue box shows: "Related to: Sarah Chen"
✅ Reminder: Checked
✅ Create button: DISABLED (no title yet)
```

### Test Assign To Dropdown
**Action:** Click "Assign To" dropdown

**Expected:**
```
✅ See options:
   - Sarah Chen (selected)
   - John Martinez (CEO)
   - Michael Torres (VP Sales)
   - Emily Watson (Admin)
   - David Kim (Analyst)
```

### Test Priority Levels
**Action:** Click each priority radio button

**Expected:**
```
✅ Low - Slate color
✅ Medium - Blue color (default)
✅ High - Orange color
✅ Urgent - Red color
```

**Action:** Select "High"

### Test Related To Options
**Action:** Click "Deal" radio button

**Expected:**
```
✅ Blue info box disappears
✅ (Only shown for "Team Member")
```

**Action:** Click "Team Member" again

**Expected:**
```
✅ Blue box reappears: "Related to: Sarah Chen"
```

### Create Task
**Action:**
- Enter title: "Review Q4 performance data"
- Enter description: "Please review your Q4 numbers and prepare for our 1-on-1"
- Keep due date (2 days from now)
- Keep "High" priority
- Keep "Team Member" related-to
- Keep reminder checked
- Click "Create Task"

**Expected:**
```
✅ Button shows "Creating..." with spinner
✅ Toast appears: "Task created for Sarah Chen"
✅ Modal closes
✅ Console log shows:
   {
     type: "Task Assigned",
     taskTitle: "Review Q4 performance data",
     assignedTo: "Sarah Chen",
     priority: "high",
     dueDate: "[date]",
     relatedTo: "team",
     sendReminder: true,
     status: "Pending"
   }
```

**Result:** ☐ PASS / ☐ FAIL

---

## Test 3: Add Note (2 minutes)

### Open Modal
**Action:** Press `N` key (or click Add Note button)

**Expected:**
```
✅ Modal opens
✅ Title: "Add Note about Sarah Chen"
✅ Contact: sarah@bmi.com
✅ Note Type: "Coaching Note" selected
✅ Date: Today (auto-filled)
✅ Subject: Empty
✅ Note Content: Empty (large textarea)
✅ Focus Areas section: Visible (8 checkboxes)
✅ Development Goals: Visible (textarea)
✅ Visibility: "Private" selected
✅ Blue info box about coaching notes: Visible
✅ Save button: DISABLED (no subject/content yet)
```

### Test Note Types
**Action:** Select "General Note" radio button

**Expected:**
```
✅ Focus Areas section: Hidden
✅ Development Goals section: Hidden
✅ (Only for coaching notes)
```

**Action:** Select "Coaching Note" again

**Expected:**
```
✅ Focus Areas section: Visible again
✅ Development Goals section: Visible again
```

### Test Focus Areas
**Action:** Check these boxes:
- ☑ Pipeline Management
- ☑ HRMS Strategy

**Expected:**
```
✅ Both checkboxes checked
✅ Blue tags appear below checkboxes:
   [Pipeline Management] [HRMS Strategy]
```

**Action:** Uncheck "Pipeline Management"

**Expected:**
```
✅ Checkbox unchecked
✅ Tag removed
✅ Only [HRMS Strategy] remains
```

**Action:** Check it again

### Test Visibility Options
**Action:** Select "Shared" radio button

**Expected:**
```
✅ Radio selected
✅ Description shows: "Leadership team and HR can access"
```

**Action:** Select "Private" again

**Expected:**
```
✅ Description shows: "Only you and your managers can view"
```

### Save Note
**Action:**
- Keep "Coaching Note" selected
- Keep today's date
- Enter subject: "Q4 Performance Discussion"
- Enter content: "Sarah's Q4 performance has been exceptional. Win rate of 72% exceeds team average. HRMS lead strategy is working well."
- Keep "Pipeline Management" and "HRMS Strategy" checked
- Enter development goals: "- Lead HRMS training in Q1\n- Mentor junior reps"
- Keep "Private" visibility
- Click "Save Note"

**Expected:**
```
✅ Button shows "Saving..." with spinner
✅ Toast appears: "Coaching note added for Sarah Chen"
✅ Modal closes
✅ Console log shows:
   {
     type: "coaching",
     about: "Sarah Chen",
     subject: "Q4 Performance Discussion",
     content: "[full content]",
     focusAreas: ["Pipeline Management", "HRMS Strategy"],
     developmentGoals: "- Lead HRMS training in Q1...",
     visibility: "private",
     status: "Active"
   }
```

**Result:** ☐ PASS / ☐ FAIL

---

## Quick Keyboard Test (30 seconds)

**Actions:**
1. Press `M` → Meeting modal opens
2. Press `Esc` → Modal closes
3. Press `T` → Task modal opens
4. Press `Esc` → Modal closes
5. Press `N` → Note modal opens
6. Press `Esc` → Modal closes

**Try typing:**
1. Open any modal
2. Click in subject field
3. Press `M` or `T` or `N`
4. **Expected:** Letter appears in field, does NOT open new modal

**Result:** ☐ PASS / ☐ FAIL

---

## Console Logs Check

### After Schedule Meeting
```javascript
Meeting Activity Logged: {
  id: "meeting-[timestamp]",
  type: "Meeting Scheduled",
  meetingType: "1-on-1",
  with: "Sarah Chen",
  date: "2024-12-20",
  time: "10:00",
  duration: "30 minutes",
  locationType: "video",
  videoLink: "https://zoom.us/j/...",
  subject: "Q4 Performance Review",
  agenda: "[template or custom content]",
  agendaTemplate: "Performance Review",
  additionalAttendees: ["john@company.com"],
  recurring: "one-time",
  reminders: { fifteenMin: true, oneDay: true },
  status: "Scheduled",
  isOneOnOne: true
}
```

### After Create Task
```javascript
Task Activity Logged: {
  id: "task-[timestamp]",
  type: "Task Assigned",
  taskTitle: "Review Q4 performance data",
  assignedTo: "Sarah Chen",
  assignedBy: "Manager",
  dueDate: "2024-12-15",
  priority: "high",
  description: "Please review your Q4 numbers...",
  relatedTo: "team",
  relatedEntity: "Sarah Chen",
  sendReminder: true,
  status: "Pending"
}
```

### After Add Note
```javascript
Coaching Note Saved: {
  id: "note-[timestamp]",
  type: "coaching",
  about: "Sarah Chen",
  date: "2024-12-13",
  subject: "Q4 Performance Discussion",
  content: "Sarah's Q4 performance has been exceptional...",
  focusAreas: ["Pipeline Management", "HRMS Strategy"],
  developmentGoals: "- Lead HRMS training in Q1...",
  visibility: "private",
  author: "Manager",
  status: "Active"
}
```

---

## Expected Toasts

### Meeting Toasts
- ✅ "1-on-1 scheduled with Sarah Chen for Dec 20 at 10:00 AM"
- ✅ "Team Meeting scheduled with Sarah Chen for Dec 20 at 10:00 AM"
- ✅ "Client Meeting scheduled with Sarah Chen for Dec 20 at 10:00 AM"

### Task Toast
- ✅ "Task created for Sarah Chen"

### Note Toasts
- ✅ "Coaching note added for Sarah Chen"
- ✅ "General note added for Sarah Chen"
- ✅ "Meeting note added for Sarah Chen"

---

## 📊 Quick Results

**Test 1 (Meeting):** ☐ PASS / ☐ FAIL
**Test 2 (Task):** ☐ PASS / ☐ FAIL
**Test 3 (Note):** ☐ PASS / ☐ FAIL
**Keyboard Test:** ☐ PASS / ☐ FAIL

**Overall:** ☐ ALL PASS / ☐ NEEDS FIX

---

## ✅ Critical Features Checklist

### Schedule Meeting
- [ ] Opens via M key
- [ ] 3 meeting types work
- [ ] Agenda template auto-fills
- [ ] Zoom link generates (1s delay)
- [ ] Location types show correct fields
- [ ] Additional attendees add/remove
- [ ] Recurring options selectable
- [ ] Validation works (subject required)
- [ ] Console logs complete activity
- [ ] Toast shows meeting type + date/time

### Create Task
- [ ] Opens via T key
- [ ] Assign To dropdown populated
- [ ] Due date defaults to 2 days from now
- [ ] 4 priority levels work
- [ ] Related-to shows info box for team
- [ ] Validation works (title required)
- [ ] Console logs complete activity
- [ ] Toast shows assignee name

### Add Note
- [ ] Opens via N key
- [ ] 3 note types work
- [ ] Date defaults to today
- [ ] Focus areas show for coaching notes
- [ ] Development goals show for coaching notes
- [ ] Multi-select checkboxes work
- [ ] Tags appear for selected areas
- [ ] 2 visibility options work
- [ ] Info box shows for coaching notes
- [ ] Validation works (subject + content required)
- [ ] Console logs complete note
- [ ] Toast shows note type

---

## 🚨 Common Issues

### ❌ Modal Not Opening
- Check if another modal is already open
- Try keyboard shortcut instead
- Verify you're on correct page (/team/2)

### ❌ Keyboard Shortcut Not Working
- Make sure you're not typing in an input field
- Close any open modal first
- Try clicking button instead

### ❌ Button Stays Disabled
- Meeting: Verify subject has content
- Task: Verify title has content
- Note: Verify subject AND content have text
- Check console for errors

### ❌ Template Not Auto-Filling
- Only works for 1-on-1 meetings
- Select meeting type "1-on-1" first
- Then select agenda template

### ❌ Focus Areas Not Showing
- Only visible for "Coaching Note" type
- Switch to coaching note to see them

---

## Success Criteria

**All tests must show:**
1. ✅ Modals open via keyboard AND buttons
2. ✅ Conditional fields show/hide correctly
3. ✅ Auto-fill features work
4. ✅ Generation features work (Zoom link)
5. ✅ Multi-select features work (attendees, focus areas)
6. ✅ Validation prevents empty submission
7. ✅ Console logs show complete data
8. ✅ Toast messages are dynamic and accurate
9. ✅ Cancel/X close without saving
10. ✅ All date pickers have proper restrictions

---

**Test Date:** __________
**Tester:** __________
**Time Taken:** ______ minutes
**Status:** ☐ Ready for Production / ☐ Needs Work
