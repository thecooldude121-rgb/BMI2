# Deactivate User - Quick Test Guide

**Test Time:** 3 minutes
**Status:** Ready to test

---

## Test 1: Open Deactivation Modal (30 sec)

**Steps:**
1. Navigate to `/crm/settings/team`
2. Find any active user card (e.g., Alex Rodriguez)
3. Click ⋮ (three dots) in top-right of card
4. Click **"Deactivate User"** from dropdown

**Expected Results:**
- ✅ Large modal opens
- ✅ Title: "Deactivate User: Alex Rodriguez"
- ✅ Warning banner shows: "Are you sure you want to deactivate this user?"

---

## Test 2: Verify Modal Content (1 min)

**Check User Details Section:**
- ✅ Shows: User: Alex Rodriguez
- ✅ Shows: Email: alex@bmi.com
- ✅ Shows: Role: Sales Representative

**Check Current Activity:**
- ✅ Active Deals: 8 deals ($450K)
- ✅ Assigned Contacts: 15 contacts
- ✅ Open Tasks: 3 tasks

**Check What Happens List:**
- ✅ 6 items with green checkmarks
- ✅ "User loses access immediately"
- ✅ "Cannot log in to system"
- ✅ "All data is preserved"
- ✅ "Deals/contacts remain assigned"
- ✅ "Can be reactivated later"
- ✅ "Frees up 1 subscription seat"

**Check Reassignment Dropdown:**
- ✅ Default: "Keep assigned to Alex Rodriguez (recommended)"
- ✅ Shows manager options: "Reassign to [Manager] ([Role])"
- ✅ Shows: "Choose different owner per item"

**Check Notification Checkbox:**
- ✅ Checked by default
- ✅ Label: "Send notification email to user"
- ✅ Subtext: "Alex Rodriguez will be notified of deactivation"

**Check Reason Field:**
- ✅ Textarea present
- ✅ Placeholder: 'E.g., "Left company", "On leave", etc.'
- ✅ Optional (can leave blank)

**Check Buttons:**
- ✅ Cancel (gray)
- ✅ Deactivate User (red)

---

## Test 3: Deactivate User (45 sec)

**Steps:**
1. In modal, select reassignment: "Sarah Chen (Manager)"
2. Keep notification checkbox checked
3. Type reason: "Testing deactivation"
4. Click **"Deactivate User"** button

**Expected Results:**
- ✅ Modal closes immediately
- ✅ Toast appears: "Alex Rodriguez has been deactivated. Notification email sent."
- ✅ User card updates (see below)
- ✅ Browser console shows activity log

**Console Log Should Show:**
```javascript
{
  action: 'User Deactivated',
  user: 'Alex Rodriguez',
  email: 'alex@bmi.com',
  deactivatedBy: 'Admin',
  reason: 'Testing deactivation',
  dealsReassignedTo: 'Sarah Chen',
  notificationSent: true,
  timestamp: [ISO timestamp]
}
```

---

## Test 4: Verify Inactive Card Appearance (30 sec)

**Find Alex Rodriguez's card (now inactive):**

**Visual Changes:**
- ✅ Card background: GRAY (bg-slate-100)
- ✅ Avatar: GRAY (no color gradient)
- ✅ Name has GRAY text
- ✅ **INACTIVE badge** displayed next to name
- ✅ Job title GRAYED OUT
- ✅ No Edit button (⋮ icon)
- ✅ Status badge shows: ⚫ Inactive

**Buttons Changed:**
- ✅ [View Profile] - Blue (still present)
- ✅ [Reactivate] - GREEN button with green border
- ✅ [Delete] - RED button with red border
- ❌ No "Reset Password" button
- ❌ No "Send Email" button

**Example Layout:**
```
┌─────────────────────────────────────┐
│ [AR] Alex Rodriguez [INACTIVE]     │
│      Sales Representative           │  (all grayed)
│      ID: EMP001                     │
│                                     │
│ Status: ⚫ Inactive                 │
│                                     │
│ [View Profile] [Reactivate] [Delete]│
└─────────────────────────────────────┘
```

---

## Test 5: Reactivate User (30 sec)

**Steps:**
1. Stay on same page with Alex's inactive card
2. Click **"Reactivate"** button (green)

**Expected Results:**
- ✅ Immediate UI update (no modal)
- ✅ Card background returns to WHITE
- ✅ Avatar returns to COLORFUL gradient
- ✅ Name text returns to DARK
- ✅ INACTIVE badge DISAPPEARS
- ✅ Edit button (⋮) reappears
- ✅ Buttons change back to: View Profile, Reset Password, Send Email
- ✅ Status badge: 🟢 Active
- ✅ Toast: "Alex Rodriguez has been reactivated"
- ✅ Console logs reactivation

**Console Log Should Show:**
```javascript
{
  action: 'User Reactivated',
  user: 'Alex Rodriguez',
  reactivatedBy: 'Admin',
  timestamp: [ISO timestamp]
}
```

---

## Test 6: Deactivate Without Notification (30 sec)

**Steps:**
1. Open deactivate modal for another user
2. Leave reassignment as "Keep assigned"
3. UNCHECK "Send notification email" checkbox
4. Leave reason blank
5. Click "Deactivate User"

**Expected Results:**
- ✅ Modal closes
- ✅ Toast: "[Name] has been deactivated" (NO notification message)
- ✅ User card turns gray
- ✅ INACTIVE badge appears
- ✅ Console log shows `notificationSent: false`
- ✅ Console log shows `reason: 'Not specified'`
- ✅ Console log shows `dealsReassignedTo: 'Not reassigned'`

---

## Test 7: Verify Edit Button Hidden (15 sec)

**Steps:**
1. Find any INACTIVE user card
2. Look at top-right corner

**Expected Results:**
- ✅ No Edit button (pencil icon)
- ✅ Only ⋮ (three dots) menu button visible
- ✅ Dropdown still works
- ✅ Can access other actions

**Compare with Active User:**
- Active user: Has Edit button AND ⋮ menu
- Inactive user: Only ⋮ menu (no Edit button)

---

## Test 8: Delete Inactive User (30 sec)

**Steps:**
1. Find inactive user card
2. Click **"Delete"** button (red)
3. Delete confirmation modal opens
4. Click "Delete User Permanently"

**Expected Results:**
- ✅ Delete modal opens
- ✅ Shows permanent deletion warning
- ✅ User removed from list
- ✅ Toast: "[Name] has been permanently deleted"
- ✅ Available seats don't change (already freed)

---

## Visual Comparison

### Active User Card
```
┌────────────────────────────────────┐
│ 🔵 Alex Rodriguez                 │  ← Colored avatar
│    Sales Representative            │  ← Dark text
│                                    │
│ Status: 🟢 Active                 │  ← Green dot
│                                    │
│ [View Profile]                     │  ← Blue
│ [Reset Password]                   │  ← Gray
│ [Send Email]                       │  ← Gray
└────────────────────────────────────┘
    ↑ White background
```

### Inactive User Card
```
┌────────────────────────────────────┐
│ ⚪ Alex Rodriguez [INACTIVE]      │  ← Gray avatar + badge
│    Sales Representative            │  ← Gray text
│                                    │
│ Status: ⚫ Inactive                │  ← Gray dot
│                                    │
│ [View Profile]                     │  ← Blue
│ [Reactivate]                       │  ← Green
│ [Delete]                           │  ← Red
└────────────────────────────────────┘
    ↑ Gray background (slate-100)
```

---

## Modal Screenshot Reference

### Top Section
```
┌──────────────────────────────────────────┐
│ ⚠️ Deactivate User: Alex Rodriguez  [X] │
├──────────────────────────────────────────┤
│ ⚠️ Are you sure you want to deactivate  │
│    this user?                            │
├──────────────────────────────────────────┤
│ User Details:                            │
│ User:  Alex Rodriguez                    │
│ Email: alex@bmi.com                      │
│ Role:  Sales Representative              │
└──────────────────────────────────────────┘
```

### Middle Section
```
┌──────────────────────────────────────────┐
│ Current Activity:                        │
│ • Active Deals: 8 deals ($450K)          │
│ • Assigned Contacts: 15 contacts         │
│ • Open Tasks: 3 tasks                    │
├──────────────────────────────────────────┤
│ What happens when deactivated:           │
│ ✅ User loses access immediately         │
│ ✅ Cannot log in to system               │
│ ✅ All data is preserved                 │
│ ✅ Deals/contacts remain assigned        │
│ ✅ Can be reactivated later              │
│ ✅ Frees up 1 subscription seat          │
└──────────────────────────────────────────┘
```

### Bottom Section
```
┌──────────────────────────────────────────┐
│ Reassign deals and contacts to:         │
│ [Keep assigned to Alex Rodriguez ▼]     │
│                                          │
│ ☑ Send notification email to user       │
│   Alex Rodriguez will be notified...    │
│                                          │
│ Reason for deactivation (optional):     │
│ ┌────────────────────────────────────┐  │
│ │ E.g., "Left company"...            │  │
│ └────────────────────────────────────┘  │
│                                          │
│           [Cancel] [Deactivate User]     │
└──────────────────────────────────────────┘
```

---

## Common Issues & Solutions

### Issue: Modal doesn't show user stats
**Solution:** Stats come from `quickStats` in mock data. Verify mock data has these fields.

### Issue: No managers in reassignment dropdown
**Solution:** Need at least one active user with role: manager, vp, or ceo.

### Issue: Card doesn't turn gray
**Solution:** Check browser cache. Hard refresh (Ctrl+Shift+R).

### Issue: Edit button still shows on inactive
**Solution:** Status must be exactly 'inactive' (lowercase).

### Issue: Reactivate doesn't work
**Solution:** Check browser console for errors. Verify state update logic.

---

## Success Criteria

**All tests pass if:**
- ✅ Modal opens with complete information
- ✅ User details display correctly
- ✅ Activity stats show accurate numbers
- ✅ Reassignment dropdown populates
- ✅ Notification checkbox works
- ✅ Reason field accepts input
- ✅ Deactivate updates card appearance
- ✅ Card turns gray with INACTIVE badge
- ✅ Avatar becomes gray
- ✅ Edit button hidden for inactive
- ✅ Buttons change for inactive users
- ✅ Reactivate restores card
- ✅ Toast notifications work
- ✅ Activity logs correctly
- ✅ No console errors

---

## Browser Testing

**Recommended Browsers:**
- Chrome/Edge (recommended)
- Firefox
- Safari

**All features should work in all modern browsers.**

---

**Total Test Time:** ~3 minutes
**Status:** Ready for production ✅
