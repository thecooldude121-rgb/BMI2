# Delete User - Quick Test Guide

**Test Time:** 3 minutes
**Status:** Ready to test

---

## Test 1: Open Delete Modal (30 sec)

**Steps:**
1. Navigate to `/crm/settings/team`
2. Find any inactive user card (gray background)
3. Click **Delete** button (red)

**Expected Results:**
- ✅ Large modal opens
- ✅ Header is RED with white text
- ✅ Title: "⚠️ DELETE USER PERMANENTLY"
- ✅ Danger warning with 🚨 emoji

---

## Test 2: Verify Modal Content (1 min)

**Check Danger Banner:**
- ✅ Red background (bg-red-100)
- ✅ Text: "🚨 DANGER: This action CANNOT be undone"
- ✅ Subtext: "All data will be permanently deleted..."

**Check User Details:**
- ✅ Shows: User: [Name]
- ✅ Shows: Email: [Email]
- ✅ Gray background box

**Check Deletion List:**
```
This will PERMANENTLY DELETE:
❌ User account
❌ Login credentials
❌ All assigned deals (8 deals)
❌ All assigned contacts (15 contacts)
❌ All activities (124 activities)
❌ All coaching notes (5 notes)
❌ All email history
❌ All documents shared
```
- ✅ 8 items with red X icons
- ✅ Counts shown dynamically
- ✅ Red text (text-red-700)

**Check Warning Box:**
- ✅ Yellow background
- ✅ Text: "⚠️ IMPORTANT:"
- ✅ 3 bullet points about cannot undo

**Check Reassignment Dropdowns:**
- ✅ Title: "Before deleting, you MUST reassign:"
- ✅ 3 separate dropdowns:
  1. Reassign [X] deals to:
  2. Reassign [X] contacts to:
  3. Reassign [X] open tasks to:
- ✅ Each starts with "Select a user..."
- ✅ Shows active users with roles

**Check Email Confirmation:**
- ✅ Label: "To confirm deletion, type the user's email:"
- ✅ Input field present
- ✅ Placeholder shows email
- ✅ Help text: "Type [email] exactly"

**Check Buttons:**
- ✅ Cancel (gray, left)
- ✅ I Want to Deactivate Instead (blue, left)
- ✅ Delete User Permanently (RED, right, DISABLED)

---

## Test 3: Validation - Try to Delete (45 sec)

**Steps:**
1. Leave all dropdowns empty
2. Leave email field empty
3. Try clicking "Delete User Permanently"

**Expected Results:**
- ✅ Button is GRAY and DISABLED
- ✅ Cursor shows "not-allowed"
- ✅ Button doesn't respond to clicks

**Now fill just email:**
4. Type correct email (e.g., alex@bmi.com)
5. Try clicking delete again

**Expected Results:**
- ✅ Button still DISABLED
- ✅ Need reassignments too

**Now fill dropdowns:**
6. Select manager for deals dropdown
7. Select manager for contacts dropdown
8. Button still disabled
9. Select manager for tasks dropdown
10. Button ENABLES (turns red)

**Expected Results:**
- ✅ Button changes to RED
- ✅ Background: bg-red-600
- ✅ Cursor: pointer
- ✅ Hover effect works

---

## Test 4: Error Validation (1 min)

**Steps:**
1. Open delete modal
2. Fill all 3 dropdowns
3. Type WRONG email: "wrong@example.com"
4. Click "Delete User Permanently"

**Expected Results:**
- ✅ Modal stays open
- ✅ Error appears below email field
- ✅ Red text with alert icon
- ✅ Message: "Email does not match. Please type '[correct email]' exactly"
- ✅ Email field gets red border

**Fix Email:**
5. Type correct email
6. Click delete again

**Should work now**

**Test Missing Reassignments:**
7. Clear email field
8. Clear all dropdowns
9. Type correct email
10. Click delete

**Expected Results:**
- ✅ Error: "You must reassign all deals, contacts, and tasks before deleting"
- ✅ Red borders on empty dropdowns

---

## Test 5: Complete Delete (45 sec)

**Steps:**
1. Open delete modal for any user
2. Select reassignments:
   - Deals → Sarah Chen
   - Contacts → John Smith
   - Tasks → Sarah Chen
3. Type exact email (case-sensitive)
4. Verify button is RED and enabled
5. Click "Delete User Permanently"

**Expected Results:**
- ✅ Modal closes immediately
- ✅ Toast appears: "[Name] has been permanently deleted"
- ✅ User removed from team list
- ✅ Page scrolls to top automatically
- ✅ Available seats increase by 1
- ✅ Console shows activity log

**Console Log Should Show:**
```javascript
{
  action: 'User Deleted Permanently',
  user: 'Alex Rodriguez',
  email: 'alex@bmi.com',
  deletedBy: 'Admin',
  dealsReassignedTo: 'Sarah Chen (8 deals)',
  contactsReassignedTo: 'John Smith (15 contacts)',
  tasksReassignedTo: 'Sarah Chen (3 tasks)',
  timestamp: [ISO timestamp],
  note: 'User and all associated data permanently deleted',
  recoverable: 'NO'
}
```

---

## Test 6: Deactivate Instead (30 sec)

**Steps:**
1. Open delete modal for any user
2. Read through the modal
3. Click "I Want to Deactivate Instead" (blue button, left side)

**Expected Results:**
- ✅ Delete modal closes
- ✅ Deactivate modal opens IMMEDIATELY
- ✅ Same user is selected
- ✅ Shows deactivate form (different modal)
- ✅ All deactivate fields visible
- ✅ Can complete deactivation from here

**Complete Deactivation:**
4. Fill deactivate form
5. Click "Deactivate User"
6. User deactivated (not deleted)

**Verify:**
- ✅ User card turns gray
- ✅ INACTIVE badge appears
- ✅ All data preserved
- ✅ Can reactivate later

---

## Test 7: Cancel Button (15 sec)

**Steps:**
1. Open delete modal
2. Fill some fields:
   - Select 2 dropdowns
   - Type partial email
3. Click "Cancel" button

**Expected Results:**
- ✅ Modal closes
- ✅ User not deleted
- ✅ No changes made

**Reopen Modal:**
4. Click delete button again

**Verify:**
- ✅ All fields reset to empty
- ✅ No previous selections
- ✅ Email field blank
- ✅ Form clean slate

---

## Test 8: Reassignment Dropdowns (30 sec)

**Steps:**
1. Open delete modal
2. Check deals dropdown

**Expected Results:**
- ✅ Shows "Select a user..." first
- ✅ Lists active users
- ✅ Shows roles in parentheses
- ✅ Example: "Sarah Chen (Manager)"
- ✅ Does NOT show inactive users
- ✅ Does NOT show the user being deleted

**Check All 3 Dropdowns:**
3. Verify contacts dropdown (same list)
4. Verify tasks dropdown (same list)

**Select Different Users:**
5. Deals → Sarah Chen
6. Contacts → John Smith
7. Tasks → Emily Davis

**Expected Results:**
- ✅ Can select different users for each
- ✅ Can select same user for multiple
- ✅ All combinations work

---

## Visual Verification

### Modal Header
```
┌──────────────────────────────────────────┐
│ [!] ⚠️ DELETE USER PERMANENTLY      [X] │
└──────────────────────────────────────────┘
↑ RED background (bg-red-600)
↑ WHITE text
```

### Danger Warning
```
┌──────────────────────────────────────────┐
│ ⚠️ 🚨 DANGER: This action CANNOT be     │
│    undone                                │
│                                          │
│    All data will be permanently deleted  │
│    and cannot be recovered.              │
└──────────────────────────────────────────┘
↑ Red background (bg-red-100)
↑ Bold text
```

### Deletion List
```
This will PERMANENTLY DELETE:
❌ User account                    ← Red X icon
❌ Login credentials
❌ All assigned deals (8 deals)    ← Count shown
❌ All assigned contacts (15...)   ← Count shown
❌ All activities (124 activities) ← Count shown
❌ All coaching notes (5 notes)    ← Count shown
❌ All email history
❌ All documents shared
```

### Reassignment Section
```
Before deleting, you MUST reassign:

Reassign 8 deals to:
┌────────────────────────────────────────┐
│ Sarah Chen (Manager)              [▼] │
└────────────────────────────────────────┘

Reassign 15 contacts to:
┌────────────────────────────────────────┐
│ John Smith (Director)             [▼] │
└────────────────────────────────────────┘

Reassign 3 open tasks to:
┌────────────────────────────────────────┐
│ Sarah Chen (Manager)              [▼] │
└────────────────────────────────────────┘
```

### Email Confirmation
```
To confirm deletion, type the user's email:
┌────────────────────────────────────────┐
│ alex@bmi.com                           │
└────────────────────────────────────────┘
Type alex@bmi.com exactly
```

### Button States

**Disabled (default):**
```
[Delete User Permanently]
↑ Gray (bg-gray-300)
↑ Not clickable
```

**Enabled (all valid):**
```
[Delete User Permanently]
↑ RED (bg-red-600)
↑ Bold text
↑ Clickable
```

---

## Common Issues & Solutions

### Issue: Delete button won't enable
**Check:**
- ✅ All 3 dropdowns selected?
- ✅ Email matches exactly?
- ✅ Email is case-sensitive
- ✅ No extra spaces in email?

### Issue: Error "Email does not match"
**Solution:**
- Copy the email from help text
- Paste exactly
- Check for spaces
- Check capitalization

### Issue: Error "must reassign all..."
**Solution:**
- Fill all 3 dropdowns
- All must have valid selection
- "Select a user..." is not valid

### Issue: No users in dropdown
**Solution:**
- Need at least one other active user
- Cannot delete if only user
- Check other users not all inactive

### Issue: Modal doesn't open
**Solution:**
- Try with inactive user
- Active users may have different flow
- Check browser console for errors

---

## Comparison: Delete vs. Deactivate

### Delete Modal
```
⚠️ DELETE USER PERMANENTLY
🚨 DANGER: Cannot be undone
❌ Deletes ALL data
Required: Email + 3 reassignments
Button: RED "Delete User Permanently"
Result: User gone forever
```

### Deactivate Modal
```
Deactivate User: [Name]
⚠️ Are you sure?
✅ Preserves ALL data
Optional: Reassignment
Button: Red "Deactivate User"
Result: User inactive, can reactivate
```

---

## Safety Checklist

**Before Deleting:**
- [ ] Is this truly necessary?
- [ ] Could deactivate work instead?
- [ ] Have you reassigned all data?
- [ ] Is the email correct?
- [ ] Are you certain data won't be needed?
- [ ] Have you checked with team?

**After Deleting:**
- [x] User removed from list
- [x] Toast notification shown
- [x] Activity logged
- [x] Seat freed
- [x] Cannot be recovered
- [x] All data gone

---

## Success Criteria

**All tests pass if:**
- ✅ Modal opens with red header
- ✅ Danger warning displays
- ✅ Deletion list shows 8 items
- ✅ Counts display dynamically
- ✅ Yellow warning box appears
- ✅ 3 reassignment dropdowns work
- ✅ Email confirmation required
- ✅ Validation prevents deletion
- ✅ Button disabled until valid
- ✅ Error messages clear
- ✅ "Deactivate Instead" works
- ✅ Delete removes user
- ✅ Activity logs correctly
- ✅ Toast notification works
- ✅ Page scrolls to top
- ✅ No console errors

---

## Browser Testing

**Recommended Browsers:**
- Chrome/Edge (recommended)
- Firefox
- Safari

**All features should work in all modern browsers.**

---

## Important Notes

⚠️ **WARNING:** Delete is PERMANENT and CANNOT be undone.

✅ **RECOMMENDATION:** Use Deactivate for 99% of cases.

❌ **DANGER:** All data will be lost forever.

✅ **ALTERNATIVE:** Click "I Want to Deactivate Instead"

---

**Total Test Time:** ~3 minutes
**Status:** Ready for production ✅
**Safety Level:** MAXIMUM 🔒
