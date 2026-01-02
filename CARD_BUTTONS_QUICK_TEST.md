# Card Buttons - Quick Test Guide

**Test Time:** 2 minutes
**Status:** Ready to test

---

## Test 1: Reset Password Button (30 sec)

**Steps:**
1. Navigate to `/crm/settings/team`
2. Find any team member card (e.g., Alex Rodriguez)
3. Click **"Reset Password"** button (middle button, has 🔑 icon)

**Expected Results:**
- ✅ Modal opens with title: "Reset Password for Alex Rodriguez"
- ✅ Shows user email: alex@bmi.com
- ✅ Shows orange warning about user logout
- ✅ Has two buttons: "Cancel" and "Send Reset Link"

**Test Actions:**
4. Click **"Send Reset Link"** button
5. Verify modal closes
6. Verify toast appears: "Password reset email sent to alex@bmi.com"
7. Check browser console for activity log

---

## Test 2: Send Email Button (1 min)

**Steps:**
1. Stay on `/crm/settings/team`
2. Find any team member card (e.g., Sarah Chen)
3. Click **"Send Email"** button (third button, has ✉️ icon)

**Expected Results:**
- ✅ Email composer modal opens
- ✅ Title: "Send Email to Sarah Chen"
- ✅ **To:** sarah@bmi.com (pre-filled, gray background)
- ✅ **From:** admin@bmi.com (pre-filled, gray background)
- ✅ **Subject:** [Empty field]
- ✅ **Body:** [Empty textarea]
- ✅ Template dropdown shows "None (blank email)"

**Test Actions:**
4. Type in Subject: "Test email"
5. Type in Body: "This is a test message"
6. Click **"Send Email"** (blue button, bottom right)
7. Verify modal closes
8. Verify toast appears: "Email sent to Sarah Chen"
9. Check browser console for activity log

---

## Test 3: Email Template (45 sec)

**Steps:**
1. Click "Send Email" on any team member card
2. Open **Template** dropdown at top of modal
3. Select **"Meeting Request"**

**Expected Results:**
- ✅ Subject auto-fills: "Meeting Request - [User Name]"
- ✅ Body auto-fills with template text starting with "Hi [FirstName],"
- ✅ You can still edit both fields

**Test Actions:**
4. Edit the body text (add your own message)
5. Click **"Send Email"**
6. Verify toast: "Email sent to [User Name]"
7. Check console - should log template: "meeting"

---

## Test 4: Save Draft (30 sec)

**Steps:**
1. Click "Send Email" on any card
2. Type some subject: "Draft test"
3. Type some body: "Testing draft save"
4. Click **"Save Draft"** (gray button)

**Expected Results:**
- ✅ Toast appears: "Email draft saved"
- ✅ Modal **stays open** (doesn't close)
- ✅ Console logs draft save activity
- ✅ You can continue editing or close

**Test Actions:**
5. Click **"Cancel"** or X to close modal
6. Verify modal closes without additional action

---

## Test 5: Cancel/Close (15 sec)

**Steps:**
1. Click "Send Email" on any card
2. Type something in subject
3. Click **"Cancel"** button (bottom left)

**Expected Results:**
- ✅ Modal closes immediately
- ✅ No toast shown
- ✅ No activity logged

**Alternative:**
- Click **X** button (top right) → Same result

---

## Visual Reference

### Team Member Card Layout
```
┌─────────────────────────────────────┐
│  [AR]  Alex Rodriguez              │
│        Sales Manager                │
│        alex@bmi.com                 │
│                                     │
│  Quick Stats:                       │
│  • Active Deals: 8                  │
│  • Pipeline: $890K                  │
│                                     │
│  [View Profile]  ← Blue button      │
│  [Reset Password]  ← Gray button    │
│  [Send Email]  ← Gray button        │
└─────────────────────────────────────┘
```

### Reset Password Modal
```
┌────────────────────────────────────┐
│ 🔑 Reset Password for Alex R.  [X]│
├────────────────────────────────────┤
│                                    │
│ ⚠️  This will send a password     │
│     reset link to:                 │
│                                    │
│     📧 alex@bmi.com                │
│                                    │
│ ℹ️  The user will be logged out   │
│    of all active sessions.         │
│                                    │
│     [Cancel]  [Send Reset Link]    │
└────────────────────────────────────┘
```

### Email Composer Modal
```
┌────────────────────────────────────┐
│ Send Email to Sarah Chen       [X] │
├────────────────────────────────────┤
│ Template: [None (blank)      ▼]    │
│                                    │
│ To:   sarah@bmi.com   (disabled)   │
│ From: admin@bmi.com   (disabled)   │
│ CC:   [optional]                   │
│ BCC:  [optional]                   │
│                                    │
│ Subject: [                    ]    │
│                                    │
│ Body:                              │
│ ┌─────────────────────────────┐   │
│ │                             │   │
│ │                             │   │
│ │                             │   │
│ └─────────────────────────────┘   │
│                                    │
│ 📎 Attach files (drag & drop)      │
│                                    │
│  [Cancel] [Save Draft] [Send Email]│
└────────────────────────────────────┘
```

---

## Button Behavior Summary

| Button | Icon | Modal | Pre-filled | User Fills | Toast |
|--------|------|-------|------------|------------|-------|
| View Profile | 👤 | None | N/A | N/A | "Loading [Name]'s profile" |
| Reset Password | 🔑 | Reset Password | Name, Email | Nothing | "Password reset email sent to [email]" |
| Send Email | ✉️ | Email Composer | To, From | Subject, Body | "Email sent to [Name]" |

---

## Common Issues & Solutions

### Issue: Modal doesn't open
**Solution:** Check browser console for errors

### Issue: Email fields not pre-filled
**Solution:** Verify team member has email in mock data

### Issue: Toast doesn't appear
**Solution:** Check ToastContext is working

### Issue: Template doesn't apply
**Solution:** Select template from dropdown, wait for fields to update

### Issue: Modal won't close
**Solution:** Click X or Cancel button, or press Escape

---

## Success Criteria

**All tests pass if:**
- ✅ Reset Password button opens correct modal
- ✅ Reset Password shows user info correctly
- ✅ Reset Password toast shows with email
- ✅ Send Email button opens composer
- ✅ Email composer has blank subject/body
- ✅ Email composer has pre-filled To/From
- ✅ Templates work and can be edited
- ✅ Send Email shows toast with user name
- ✅ Save Draft keeps modal open
- ✅ Cancel/Close works without action
- ✅ No console errors

---

**Total Test Time:** ~2 minutes
**Status:** Ready for production ✅
