# Team Feature - Manual Test Script (20 Minutes)

## 🎯 Purpose
Step-by-step manual testing script to verify all Team features work correctly in the browser.

**Prerequisites:**
- Dev server running: `npm run dev`
- Browser: Chrome/Firefox/Safari
- Console open (F12)

---

## 🚀 Setup (1 minute)

1. Open browser to `http://localhost:5173/team/2`
2. Open browser console (F12)
3. Verify page loads without errors
4. Set role selector to "Manager" (if available)

**Expected:**
- ✅ Page loads
- ✅ No console errors
- ✅ Sarah Chen's profile visible
- ✅ Performance metrics display
- ✅ Quick Actions toolbar visible

---

## Test Suite 1: Page Load & Display (2 minutes)

### 1.1 Hero Section
**Check:**
- [ ] Avatar shows "SC" initials
- [ ] Name: "Sarah Chen"
- [ ] Role: "Account Executive"
- [ ] Status badge: "Active" (green)
- [ ] Email: sarah@bmi.com (clickable)
- [ ] Phone: +1 (555) 234-5678 (clickable)
- [ ] Location: San Francisco, CA
- [ ] Timezone: PST (UTC-8)
- [ ] Department: Sales
- [ ] Team: West Coast Team
- [ ] Member since: Jan 2022
- [ ] Last active: 2 hours ago

### 1.2 Performance Metrics (6 cards)
**Check:**
- [ ] Active Deals: 12 (+2 this month)
- [ ] Total Pipeline: $2.4M (+8% vs last month)
- [ ] Won Deals Q4: 8 deals
- [ ] Win Rate: 65% (vs 58% team avg)
- [ ] Quota Attainment: 112% (exceeded)
- [ ] Avg Sales Cycle: 45 days (vs 52 team avg)

### 1.3 Quick Actions Toolbar
**Check:**
- [ ] Send Email button visible
- [ ] Schedule Call button visible
- [ ] Sched Meeting button visible
- [ ] Create Task button visible
- [ ] Add Note button visible
- [ ] Share Document button visible
- [ ] More Actions button visible
- [ ] All buttons have icons
- [ ] Toolbar is sticky (scroll down to verify)

---

## Test Suite 2: Keyboard Shortcuts (3 minutes)

### 2.1 Test Each Shortcut
**Instructions:** Press each key and verify modal opens

- [ ] Press `E` → Email modal opens
- [ ] Press `Esc` → Modal closes
- [ ] Press `C` → Call modal opens
- [ ] Press `Esc` → Modal closes
- [ ] Press `M` → Meeting modal opens
- [ ] Press `Esc` → Modal closes
- [ ] Press `T` → Task modal opens
- [ ] Press `Esc` → Modal closes
- [ ] Press `N` → Note modal opens
- [ ] Press `Esc` → Modal closes
- [ ] Press `D` → Document modal opens
- [ ] Press `Esc` → Modal closes
- [ ] Press `A` → Dropdown opens
- [ ] Press `A` → Dropdown closes

### 2.2 Typing Safety Test
**Instructions:** Verify shortcuts don't fire while typing

- [ ] Press `E` to open email modal
- [ ] Click in Subject field
- [ ] Type "meeting" → Should type letters, NOT open meeting modal
- [ ] Press `Esc` to close
- [ ] ✅ Passed typing safety test

---

## Test Suite 3: Email Modal (2 minutes)

### 3.1 Open & Display
- [ ] Click "Send Email" or press `E`
- [ ] Modal title: "Send Email to Sarah Chen"
- [ ] Recipient pre-filled: sarah@bmi.com (read-only)
- [ ] CC/BCC fields collapsed by default

### 3.2 Template Test
- [ ] Click "Template" dropdown
- [ ] See 5 templates:
  - [ ] General Follow-up
  - [ ] Meeting Request
  - [ ] Thank You Note
  - [ ] Status Update
  - [ ] Introduction
- [ ] Select "General Follow-up"
- [ ] Subject auto-fills
- [ ] Body auto-fills
- [ ] ✅ Template works

### 3.3 Send Email
- [ ] Edit body: Add "Let's connect soon"
- [ ] Click "Send Email"
- [ ] Toast appears: "Email sent to Sarah Chen"
- [ ] Check console: See "Email Activity Logged: {...}"
- [ ] Modal closes
- [ ] ✅ Email sent successfully

---

## Test Suite 4: Call Modal (2 minutes)

### 4.1 Open & Display
- [ ] Click "Schedule Call" or press `C`
- [ ] Modal title: "Schedule Call with Sarah Chen"
- [ ] Date defaults to tomorrow
- [ ] Time defaults to 2:00 PM
- [ ] Duration: 30 minutes

### 4.2 Video Call Test
- [ ] Select "Video Call"
- [ ] Phone number field disappears
- [ ] "Generate Zoom Link" button appears
- [ ] Click "Generate Zoom Link"
- [ ] Wait 1 second
- [ ] See link: "https://zoom.us/j/..."
- [ ] ✅ Zoom link generated

### 4.3 Schedule Call
- [ ] Enter subject: "Q4 Check-in"
- [ ] Enter notes: "Discuss quarterly performance"
- [ ] Check "Send calendar invite"
- [ ] Click "Schedule Call"
- [ ] Toast: "Video Call scheduled with Sarah Chen for [date] at [time]"
- [ ] Check console: See activity log with videoLink
- [ ] Modal closes
- [ ] ✅ Call scheduled

---

## Test Suite 5: Meeting Modal (2 minutes)

### 5.1 Open & Display
- [ ] Click "Sched Meeting" or press `M`
- [ ] Modal title: "Schedule Meeting with Sarah Chen"
- [ ] Meeting type: "1-on-1" selected
- [ ] Location: "Video" selected

### 5.2 Agenda Template Test
- [ ] Click "Agenda Template" dropdown
- [ ] See 6 templates
- [ ] Select "Performance Review"
- [ ] Agenda field auto-fills with template
- [ ] See structured agenda text
- [ ] ✅ Template auto-fill works

### 5.3 Schedule Meeting
- [ ] Enter subject: "Q4 Review"
- [ ] Keep auto-filled agenda
- [ ] Check "Generate Zoom link"
- [ ] Click "Schedule Meeting"
- [ ] Toast: "1-on-1 scheduled with Sarah Chen for [date] at [time]"
- [ ] Check console: See activity log with agenda template
- [ ] Modal closes
- [ ] ✅ Meeting scheduled

---

## Test Suite 6: Task Modal (1.5 minutes)

### 6.1 Open & Display
- [ ] Click "Create Task" or press `T`
- [ ] Modal title: "Create Task"
- [ ] "Assign to" shows "Sarah Chen"
- [ ] See 5 team members in dropdown

### 6.2 Priority Test
- [ ] Select "High" priority
- [ ] Badge turns orange
- [ ] Icon changes to alert circle
- [ ] ✅ Priority visual works

### 6.3 Create Task
- [ ] Enter title: "Review Q4 data"
- [ ] Enter description: "Analyze performance metrics"
- [ ] Keep "High" priority
- [ ] Keep reminder checked
- [ ] See info box: "Related to: Sarah Chen"
- [ ] Click "Create Task"
- [ ] Toast: "Task created for Sarah Chen"
- [ ] Check console: See task log with priority "high"
- [ ] Modal closes
- [ ] ✅ Task created

---

## Test Suite 7: Note Modal (2 minutes)

### 7.1 Open & Display
- [ ] Click "Add Note" or press `N`
- [ ] Modal title: "Add Note about Sarah Chen"
- [ ] "Coaching Note" selected by default
- [ ] See info box about coaching notes

### 7.2 Focus Areas Test
- [ ] See 8 focus area checkboxes
- [ ] Check "Pipeline Management"
- [ ] Check "HRMS Strategy"
- [ ] See blue tags appear below
- [ ] Tags show selected areas
- [ ] ✅ Multi-select works

### 7.3 Save Note
- [ ] Enter subject: "Q4 Discussion"
- [ ] Enter content: "Great performance this quarter. Sarah exceeded quota and showed strong HRMS lead generation skills."
- [ ] Keep "Private" visibility
- [ ] Click "Save Note"
- [ ] Toast: "Coaching note added for Sarah Chen"
- [ ] Check console: See note log with focusAreas array
- [ ] Modal closes
- [ ] ✅ Note saved

---

## Test Suite 8: Document Modal (2 minutes)

### 8.1 Open & Display - Library Tab
- [ ] Click "Share Document" or press `D`
- [ ] Modal title: "Share Document with Sarah Chen"
- [ ] "Library" tab active (default)
- [ ] See 4 recent documents:
  - [ ] Q4_Performance_Template.xlsx (245 KB)
  - [ ] Coaching_Framework.pdf (1.2 MB)
  - [ ] Sales_Playbook_2024.docx (3.4 MB)
  - [ ] HRMS_Best_Practices.pptx (5.8 MB)

### 8.2 Select Document
- [ ] Click "Q4_Performance_Template.xlsx"
- [ ] Radio button checks
- [ ] Blue border appears
- [ ] Checkmark icon shows
- [ ] Document title auto-fills
- [ ] ✅ Selection works

### 8.3 Share Document
- [ ] Enter message: "Please review before our meeting"
- [ ] Keep "Can View" selected
- [ ] Change "Expires" to "7 days"
- [ ] Click "Share Document"
- [ ] Toast: "Document shared with Sarah Chen"
- [ ] Check console: See document log with permission + expires
- [ ] Modal closes
- [ ] ✅ Document shared

### 8.4 Upload Tab Test
- [ ] Press `D` again
- [ ] Click "Upload New" tab
- [ ] See drag & drop zone
- [ ] See "Choose File" button
- [ ] (Optional) Drag a file onto zone
- [ ] (Optional) See file info display
- [ ] Click "Cancel"
- [ ] ✅ Upload tab works

---

## Test Suite 9: More Actions Dropdown (2 minutes)

### 9.1 Open & Display
- [ ] Click "More Actions" or press `A`
- [ ] Dropdown opens below button
- [ ] See 12 menu items (if Admin/CEO) or 10 items (if Manager)
- [ ] See icons for all items
- [ ] See 2-3 divider lines
- [ ] All text readable

### 9.2 View Actions Test
- [ ] Hover "View Calendar" → Background changes to slate-50
- [ ] Click "View Calendar"
- [ ] Dropdown closes
- [ ] Toast: "Viewing Sarah Chen's calendar"
- [ ] (May navigate to calendar page)

### 9.3 Utility Actions Test
- [ ] Press `A` again
- [ ] Click "Copy Email Address"
- [ ] Dropdown closes
- [ ] Toast: "Email address copied"
- [ ] Paste (Ctrl+V) to verify: sarah@bmi.com
- [ ] ✅ Clipboard works

### 9.4 Refresh Test
- [ ] Press `A` again
- [ ] Click "Refresh Data"
- [ ] Dropdown closes
- [ ] Toast 1: "Refreshing profile data..."
- [ ] Wait 1 second
- [ ] Toast 2: "Profile data refreshed"
- [ ] ✅ Loading state works

### 9.5 Click Outside Test
- [ ] Press `A` to open
- [ ] Click anywhere outside dropdown
- [ ] Dropdown closes
- [ ] ✅ Click-outside works

### 9.6 Toggle Test
- [ ] Press `A` → Opens
- [ ] Press `A` → Closes
- [ ] Press `A` → Opens
- [ ] Press `Esc` → Closes
- [ ] ✅ Toggle works

---

## Test Suite 10: Direct Reports (2 minutes)

### 10.1 Section Display
- [ ] Scroll down to "Direct Reports (3)"
- [ ] See 3 team member cards
- [ ] Grid layout (3 columns on large screen)

### 10.2 Alex Rivera Card
**Check:**
- [ ] Name: Alex Rivera
- [ ] Role: Senior Account Executive
- [ ] Email: alex@bmi.com
- [ ] Status badge: "Active" (green)
- [ ] Active Deals: 8
- [ ] Pipeline: $450K
- [ ] Win Rate: 75%
- [ ] Quota: 95%
- [ ] Performance badge: "On Track" (green)
- [ ] Last 1-on-1: Dec 11, 2024
- [ ] Next 1-on-1: Dec 18, 2024
- [ ] 7 Quick Action buttons visible

### 10.3 Maya Patel Card
**Check:**
- [ ] Name: Maya Patel
- [ ] Performance badge: "Needs Attention" (red/orange)
- [ ] Quota: 78% (below target)
- [ ] All elements visible

### 10.4 Jordan Lee Card
**Check:**
- [ ] Name: Jordan Lee
- [ ] Performance badge: "On Track" (green)
- [ ] All elements visible

### 10.5 Quick Action on Report
- [ ] Click "Send Email" on Alex Rivera's card
- [ ] Modal opens: "Send Email to Alex Rivera"
- [ ] Recipient: alex@bmi.com
- [ ] ✅ Correct member pre-filled
- [ ] Close modal

---

## Test Suite 11: Console Checks (1 minute)

### 11.1 Review Console Logs
**Check console for:**
- [ ] "Email Activity Logged: {...}"
- [ ] "Call Scheduled Activity: {...}"
- [ ] "Meeting Activity Logged: {...}"
- [ ] "Task Activity Logged: {...}"
- [ ] "Coaching Note Saved: {...}"
- [ ] "Document Shared Activity: {...}"

### 11.2 Verify Activity Data Structure
**Each log should contain:**
- [ ] Correct activity type
- [ ] Team member name/email
- [ ] All form field values
- [ ] Timestamp
- [ ] Status
- [ ] No sensitive data exposed

---

## Test Suite 12: Responsive Design (Optional - 1 minute)

### 12.1 Mobile View
- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar
- [ ] Select "iPhone 12 Pro" or similar
- [ ] Refresh page

**Check:**
- [ ] Page renders without horizontal scroll
- [ ] Quick Actions stack vertically
- [ ] Metrics cards stack (1 column)
- [ ] Direct Reports stack (1 column)
- [ ] Modals fit screen width
- [ ] Text readable
- [ ] Buttons tappable

### 12.2 Tablet View
- [ ] Select "iPad" or similar
- [ ] Refresh page

**Check:**
- [ ] 2-column layout for cards
- [ ] Quick Actions wrap appropriately
- [ ] Everything readable

---

## 🎯 Test Results Summary

### Quick Checklist
- [ ] Page loads without errors
- [ ] All 7 Quick Actions work
- [ ] All 8 keyboard shortcuts work
- [ ] All 6 modals open/close correctly
- [ ] All templates auto-fill
- [ ] All generation features work (Zoom links)
- [ ] All activity logs to console
- [ ] All toasts appear with correct messages
- [ ] More Actions dropdown works (12 items)
- [ ] Direct Reports section displays (3 members)
- [ ] Click-outside-to-close works
- [ ] Clipboard operations work
- [ ] No console errors
- [ ] Responsive design works

### Issues Found
**List any issues here:**

1. _______________________________________
2. _______________________________________
3. _______________________________________

### Overall Assessment
- [ ] ✅ All features working - READY FOR PRODUCTION
- [ ] ⚠️ Minor issues - Needs minor fixes
- [ ] ❌ Major issues - Needs significant work

---

## 📝 Notes & Observations

**Performance:**
- Page load time: _____ seconds
- Modal open speed: _____ (Fast/Medium/Slow)
- Overall responsiveness: _____ (Excellent/Good/Poor)

**User Experience:**
- Navigation clarity: _____
- Button labels: _____
- Error messages: _____
- Loading states: _____
- Overall polish: _____

**Browser Compatibility:**
- Chrome: _____ (Pass/Fail)
- Firefox: _____ (Pass/Fail)
- Safari: _____ (Pass/Fail)
- Edge: _____ (Pass/Fail)

---

## 🐛 Bug Report Template

**If you find a bug, use this template:**

**Bug #:** _____
**Severity:** Critical / Major / Minor
**Component:** _____
**Steps to Reproduce:**
1. _____
2. _____
3. _____

**Expected:** _____
**Actual:** _____
**Console Errors:** _____
**Screenshot:** (Attach if available)

---

## ✅ Sign-Off

**Tester:** _____________________
**Date:** _____________________
**Time Taken:** _____ minutes
**Tests Passed:** _____ / 100+
**Overall Status:** Pass / Fail

**Approved for Production:** [ ] Yes [ ] No

**Notes:**
_________________________________
_________________________________
_________________________________

---

**Test Script Version:** 1.0.0
**Last Updated:** December 2024
**Purpose:** Manual verification of Team Feature implementation
