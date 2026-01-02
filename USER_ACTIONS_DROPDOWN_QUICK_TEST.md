# User Actions Dropdown - Quick Test Card (2 Minutes)

## Visual Quick Test

### Test 1: Dropdown Opens (5 seconds)
```
ACTION:
- Click ⋮ button on any user card

EXPECTED:
✓ Dropdown appears below button
✓ 9 menu items visible
✓ 2 divider lines present
✓ Last 2 items in red text
```

### Test 2: Dropdown Closes (5 seconds)
```
ACTION:
- Open dropdown
- Click outside dropdown area

EXPECTED:
✓ Dropdown closes
✓ Button returns to normal state
```

### Test 3: Reset Password Flow (15 seconds)
```
ACTION:
1. Click ⋮ → "Reset Password"
2. Review modal content
3. Click "Reset Password" button

EXPECTED:
✓ Orange modal appears
✓ Shows key icon and warning
✓ Lists 3 consequences
✓ Lists 3 user steps
✓ Toast: "Password reset email sent to [email]"
✓ Console log appears
```

### Test 4: View Activity Log (20 seconds)
```
ACTION:
1. Click ⋮ → "View Activity Log"
2. Review activity cards
3. Click filter buttons
4. Click Close

EXPECTED:
✓ Large modal with activity history
✓ 8 activity entries shown
✓ Color-coded cards (green login, red failed, orange password)
✓ Each card shows timestamp, IP, device, location
✓ Filters work: All Activity, Login/Logout, Security Events
✓ Shows "8 of 8 activities" at bottom
```

### Test 5: Deactivate User (15 seconds)
```
ACTION:
1. Click ⋮ → "Deactivate User"
2. Review modal
3. Click "Deactivate User"

EXPECTED:
✓ Red warning modal
✓ Lists 4 consequences clearly
✓ Blue info box: "can reactivate later"
✓ Toast: "[Name] has been deactivated"
✓ User status changes to Inactive
✓ Console log appears
```

### Test 6: Delete User (20 seconds)
```
ACTION:
1. Click ⋮ → "Delete User"
2. Try typing wrong name
3. Type correct name
4. Click "Delete Permanently"

EXPECTED:
✓ Scary red/orange modal
✓ Red background on header
✓ Lists 4 consequences with × symbols
✓ Input field for name
✓ Button disabled until name matches
✓ Error appears if name wrong
✓ User removed from list after deletion
✓ Toast: "[Name] has been permanently deleted"
```

### Test 7: Send Welcome Email (5 seconds)
```
ACTION:
- Click ⋮ → "Send Welcome Email Again"

EXPECTED:
✓ No modal (instant action)
✓ Toast: "Welcome email sent to [email]"
✓ Console log appears
```

### Test 8: Edit User (5 seconds)
```
ACTION:
- Click ⋮ → "Edit User"

EXPECTED:
✓ Opens Edit Team Member modal
✓ Same as clicking Edit button
```

### Test 9: View Profile (5 seconds)
```
ACTION:
- Click ⋮ → "View Full Profile"

EXPECTED:
✓ Navigates to /team/[user-id]
✓ Route changes in URL
```

### Test 10: Unlock Account Option (10 seconds)
```
ACTION:
- Open dropdown on different users
- Look for "Unlock Account" option

EXPECTED:
✓ Option only appears if account locked
✓ Most users won't have this option
✓ If present, clicking unlocks account
```

---

## Console Log Verification

After each action, check browser console for:

**Reset Password:**
```javascript
Password Reset: {
  action: 'Password Reset',
  user: 'Alex Rodriguez',
  initiatedBy: 'Admin User',
  timestamp: '2024-12-28T...'
}
```

**Welcome Email:**
```javascript
Welcome Email Sent: {
  action: 'Welcome Email Resent',
  user: 'Mike Johnson',
  sentBy: 'Admin User',
  timestamp: '2024-12-28T...'
}
```

**Unlock Account:**
```javascript
Account Unlocked: {
  action: 'Account Unlocked',
  user: 'Sarah Chen',
  unlockedBy: 'Admin User',
  timestamp: '2024-12-28T...'
}
```

**Deactivate:**
```javascript
User Deactivated: {
  action: 'User Deactivated',
  user: 'Alex Rodriguez',
  deactivatedBy: 'Admin User',
  timestamp: '2024-12-28T...'
}
```

**Delete:**
```javascript
User Deleted: {
  action: 'User Permanently Deleted',
  user: 'Mike Johnson',
  deletedBy: 'Admin User',
  timestamp: '2024-12-28T...'
}
```

---

## Visual Checklist

### Dropdown Menu
- [ ] Width: 256px
- [ ] Right-aligned with button
- [ ] White background, gray border
- [ ] Shadow visible
- [ ] Icons left-aligned
- [ ] Text left-aligned
- [ ] Hover: blue-50 background
- [ ] Destructive actions in red
- [ ] 2 divider lines present

### Reset Password Modal
- [ ] Orange color scheme
- [ ] Key icon in header
- [ ] Orange warning banner
- [ ] 3 bullet points: "This will"
- [ ] 3 numbered steps: "User will need to"
- [ ] Cancel button: gray
- [ ] Reset button: orange

### Activity Log Modal
- [ ] Blue color scheme
- [ ] Large modal (max-w-4xl)
- [ ] 3 filter buttons at top
- [ ] Activity cards color-coded
- [ ] Green for login
- [ ] Red for failed login
- [ ] Orange for password change
- [ ] Gray for logout
- [ ] Blue for profile update
- [ ] Each card shows 4 details (time, IP, device, location)

### Deactivate Modal
- [ ] Red warning icon
- [ ] Red border on alert
- [ ] 4 consequences listed
- [ ] Icons for each consequence
- [ ] Blue info box at bottom
- [ ] Cancel button: gray
- [ ] Deactivate button: red

### Delete Modal
- [ ] Red-50 background on header
- [ ] Red-100 double border on alert
- [ ] Trash icon
- [ ] 4 consequences with × symbols
- [ ] Input field for name
- [ ] Yellow alternative suggestion
- [ ] Button disabled when invalid
- [ ] Button enabled when name matches
- [ ] Cancel button: gray
- [ ] Delete button: red (or gray when disabled)

---

## Common Issues & Solutions

### Issue: Dropdown doesn't open
**Check:** Button has onClick handler, ref is assigned

### Issue: Dropdown appears in wrong position
**Check:** buttonRef is correctly passed and position calculated

### Issue: Dropdown doesn't close on outside click
**Check:** Click-outside listener is working, refs are correct

### Issue: Modal doesn't show
**Check:** State is set correctly, selectedMember is not null

### Issue: Delete button always disabled
**Check:** confirmText matches userName exactly (case-sensitive)

### Issue: Activity Log shows empty
**Check:** Mock data is imported, filter is not too restrictive

### Issue: Console logs don't appear
**Check:** Console is open, action handler is called

### Issue: Toast doesn't show
**Check:** ToastContext is available, showToast is called

---

## Success Criteria

✅ All 10 test scenarios pass
✅ Dropdown opens/closes correctly
✅ All modals open with correct content
✅ All modals close properly
✅ Console logs appear for all actions
✅ Toast notifications show for all actions
✅ User state updates correctly (deactivate/delete)
✅ Delete requires name typing
✅ Activity log shows filtered data
✅ Click outside closes dropdown

**If all ✅, feature is production-ready!**
