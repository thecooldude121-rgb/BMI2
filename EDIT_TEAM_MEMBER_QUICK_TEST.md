# Edit Team Member Modal - Quick Test Guide

## 2-Minute Test Script

### Test 1: Open Modal (15 seconds)
```
1. Navigate to Settings → Team Management
2. Click Edit button (pencil icon) on Alex Rodriguez card
3. Verify modal opens with title "Edit Team Member: Alex Rodriguez"

✓ PASS if modal opens and shows Alex's data
```

### Test 2: Edit Basic Info (20 seconds)
```
1. Change Full Name to "Alex M. Rodriguez"
2. Change Phone to "555-9999"
3. Note that Email is disabled (gray, cursor not-allowed)
4. Click Save Changes

✓ PASS if:
  - Name updates in card
  - Phone updates in card
  - Toast shows: "Alex M. Rodriguez has been updated"
  - Modal closes
```

### Test 3: Change Role (20 seconds)
```
1. Click Edit on Mike Johnson
2. Change Role from "Sales Representative" to "Sales Manager"
3. Note "Permissions: Team Manager" updates automatically
4. Click "View Permissions Matrix" to expand
5. Verify checkmark appears next to "Manage Team"
6. Click Save Changes

✓ PASS if:
  - Permission level updates automatically
  - Matrix shows correct permissions
  - Toast mentions role change
```

### Test 4: View Permissions (15 seconds)
```
1. Click Edit on any user
2. Click "View Permissions Matrix" button
3. Verify permissions list appears with checkmarks

Permissions shown:
  ✓ View All Records
  ✓ Edit Own Records
  ✓/— Delete Records (role-dependent)
  ✓/— Manage Team (role-dependent)
  ✓/— System Settings (role-dependent)

✓ PASS if matrix toggles open/closed
```

### Test 5: Change Department & Manager (20 seconds)
```
1. Click Edit on Mike Johnson
2. Change Department to "Marketing"
3. Change Reports To to "Alex Rodriguez"
4. Change Team to "Marketing Team"
5. Click Save Changes

✓ PASS if:
  - All fields update
  - Toast notification appears
  - Console shows change log
```

### Test 6: Validation (15 seconds)
```
1. Click Edit on any user
2. Clear the Full Name field
3. Click Save Changes

✓ PASS if:
  - Red border appears on field
  - Error message: "Full name is required"
  - Modal stays open
  - No toast appears
```

### Test 7: Cancel Changes (10 seconds)
```
1. Click Edit on Sarah Chen
2. Change name to "Sarah X. Chen"
3. Change phone to "555-7777"
4. Click Cancel button

✓ PASS if:
  - Modal closes
  - No changes saved
  - Card shows original data
```

### Test 8: Deactivate User (20 seconds)
```
1. Click Edit on Mike Johnson
2. Scroll to Danger Zone (red section)
3. Click "Deactivate User" button
4. Click OK in confirmation dialog

✓ PASS if:
  - Confirmation dialog appears
  - User status changes to Inactive
  - Toast: "Mike Johnson has been deactivated"
  - Card shows inactive badge
```

### Test 9: Delete Confirmation (15 seconds)
```
1. Click Edit on any user
2. Scroll to Danger Zone
3. Click "Delete User Permanently"
4. Read the warning message
5. Click Cancel (don't actually delete)

✓ PASS if:
  - Warning message is clear and scary
  - Requires typing name to confirm
  - Cancel works properly
```

### Test 10: Security Settings (10 seconds)
```
1. Click Edit on Alex Rodriguez
2. Scroll to Account Status section
3. Toggle "Two-factor authentication enabled" checkbox
4. Check "Require password reset" checkbox
5. Note warning appears: "User will be logged out..."
6. Click Save Changes

✓ PASS if:
  - Checkboxes toggle
  - Warning shows/hides appropriately
  - Changes save successfully
```

---

## Visual Verification Checklist

### Modal Appearance
- [ ] Modal width: 800px on desktop
- [ ] Backdrop: semi-transparent black
- [ ] Modal centered on screen
- [ ] Scrollable if content exceeds viewport
- [ ] Sticky header with title and X button
- [ ] Sticky footer with Cancel and Save buttons

### Section Styling
- [ ] Basic Information: gray background (bg-gray-50)
- [ ] Role & Permissions: gray background with blue info box
- [ ] Department & Reporting: gray background
- [ ] Account Status: gray background with white info card
- [ ] Danger Zone: red background (bg-red-50) with red border

### Interactive Elements
- [ ] All inputs have blue focus ring
- [ ] Disabled email field has gray background
- [ ] Dropdowns show chevron icon
- [ ] Checkboxes and radio buttons styled properly
- [ ] Buttons have hover states
- [ ] Permission matrix expands/collapses smoothly

### Validation Feedback
- [ ] Red borders on invalid fields
- [ ] Error messages in red text below fields
- [ ] Errors clear when field is corrected
- [ ] Success toast after save

---

## Console Log Check

After saving changes, check browser console for:

```javascript
User Updated: {
  action: 'User Updated',
  user: 'Alex M. Rodriguez',
  updatedBy: 'Admin User',
  changes: {
    name: { from: 'Alex Rodriguez', to: 'Alex M. Rodriguez' },
    phone: { from: '555-0002', to: '555-9999' }
  },
  timestamp: '2024-12-28T...'
}
```

---

## Common Issues & Solutions

### Issue: Modal doesn't open
**Solution:** Check that Edit button has onClick handler and showEditModal state

### Issue: Changes don't save
**Solution:** Check validation errors (red borders), fix required fields

### Issue: Email field is editable
**Solution:** Should be disabled, check for `disabled` attribute

### Issue: Permission matrix doesn't show
**Solution:** Click "View Permissions Matrix" button to expand

### Issue: Delete doesn't require confirmation
**Solution:** Should show 2 confirmations - alert and prompt for name

### Issue: Toast doesn't appear
**Solution:** Check ToastContext is available, look for errors in console

---

## Success Criteria

✅ All 10 test scenarios pass
✅ Visual styling matches specifications
✅ Validation prevents invalid submissions
✅ Activity logs appear in console
✅ Toast notifications work for all actions
✅ Modal closes properly after save/cancel
✅ Changes persist in user list
✅ Danger zone actions require confirmation

**If all checkboxes above are ✅, feature is production-ready!**
