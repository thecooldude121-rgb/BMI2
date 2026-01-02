# Direct Reports - Role-Based Visibility Quick Test

## 🚀 Quick Test (3 Minutes)

### Prerequisites
- App running at `http://localhost:5173`
- Navigate to: `/team/2` (Sarah Chen's profile)

---

## Test Scenarios

### ✅ Scenario 1: Manager View (Default)
**Expected:** Full access to Direct Reports section

1. Set role switcher to: **Manager**
2. Scroll to **Direct Reports** section
3. **Verify:**
   - [ ] Section is visible
   - [ ] Shows "Direct Reports (2)" header
   - [ ] Shows Alex Rodriguez card
   - [ ] Shows Emily Davis card
   - [ ] Each card has 3 action buttons:
     - [ ] 📧 Email
     - [ ] 📞 Schedule Call
     - [ ] 🤝 1-on-1
   - [ ] Team Rollup Stats visible
   - [ ] Coaching Attention alert visible (green)

**Result:** ✅ PASS / ❌ FAIL

---

### ✅ Scenario 2: CEO View
**Expected:** Full access (same as Manager)

1. Set role switcher to: **CEO**
2. **Verify:**
   - [ ] Direct Reports section visible
   - [ ] All action buttons visible
   - [ ] Team stats visible
   - [ ] Banner shows: "Can view all direct reports, schedule meetings, full access to all data"

**Result:** ✅ PASS / ❌ FAIL

---

### ✅ Scenario 3: VP View
**Expected:** Full access (same as Manager)

1. Set role switcher to: **VP**
2. **Verify:**
   - [ ] Direct Reports section visible
   - [ ] All action buttons visible
   - [ ] Team stats visible
   - [ ] Banner shows: "Can view direct reports, schedule meetings, view performance data"

**Result:** ✅ PASS / ❌ FAIL

---

### ✅ Scenario 4: Rep View
**Expected:** Direct Reports section HIDDEN

1. Set role switcher to: **Rep**
2. **Verify:**
   - [ ] Direct Reports section is NOT visible
   - [ ] Section completely removed from page
   - [ ] Banner shows: "Direct Reports section hidden - Reps don't see team structure"
   - [ ] Only basic profile info visible

**Result:** ✅ PASS / ❌ FAIL

---

### ✅ Scenario 5: Admin View
**Expected:** Read-only access, no action buttons

1. Set role switcher to: **Admin**
2. Scroll to **Direct Reports** section
3. **Verify:**
   - [ ] Section is visible
   - [ ] Shows "Direct Reports (2)" header
   - [ ] Shows both report cards
   - [ ] Only **View Profile** button visible
   - [ ] NO Email button
   - [ ] NO Schedule Call button
   - [ ] NO 1-on-1 button
   - [ ] Team stats visible
   - [ ] Banner shows: "Read-only access - Can view but not schedule 1-on-1s"

**Result:** ✅ PASS / ❌ FAIL

---

### ✅ Scenario 6: Analyst View
**Expected:** Read-only access, no action buttons

1. Set role switcher to: **Analyst**
2. Scroll to **Direct Reports** section
3. **Verify:**
   - [ ] Section is visible
   - [ ] Shows "Direct Reports (2)" header
   - [ ] Shows both report cards
   - [ ] Only **View Profile** button visible
   - [ ] NO Email button
   - [ ] NO Schedule Call button
   - [ ] NO 1-on-1 button
   - [ ] Team stats visible
   - [ ] Banner shows: "Read-only access - Data visibility for analysis only"

**Result:** ✅ PASS / ❌ FAIL

---

### ✅ Scenario 7: Support View
**Expected:** No access to performance data

1. Set role switcher to: **Support**
2. **Verify:**
   - [ ] Direct Reports section not visible
   - [ ] Limited profile view
   - [ ] Banner shows: "No access to team performance data"

**Result:** ✅ PASS / ❌ FAIL

---

## Interactive Tests

### Test 1: Email Button (Manager Role)
1. Set role: **Manager**
2. Click **📧 Email** on Alex's card
3. **Verify:** Email modal opens with Alex's email pre-filled

### Test 2: Schedule Call Button (Manager Role)
1. Set role: **Manager**
2. Click **📞 Schedule Call** on Emily's card
3. **Verify:** Schedule call modal opens with Emily's name

### Test 3: 1-on-1 Button (Manager Role)
1. Set role: **Manager**
2. Click **🤝 1-on-1** on Alex's card
3. **Verify:** 1-on-1 scheduling modal opens

### Test 4: View Profile Button (All Roles)
1. Test with roles: **Manager**, **CEO**, **Admin**, **Analyst**
2. Click **View Profile** on any report card
3. **Verify:** Navigates to team member's profile page

---

## Visual Verification

### Role Switcher Banner
**For each role, verify the banner message:**

| Role | Expected Message |
|------|------------------|
| CEO | ✅ Can view all direct reports, schedule meetings, full access to all data |
| VP | ✅ Can view direct reports, schedule meetings, view performance data |
| Manager | ✅ Viewing own team - Full access to direct reports and all actions |
| Rep | ❌ Direct Reports section hidden - Reps don't see team structure |
| Admin | ⚠️ Read-only access - Can view but not schedule 1-on-1s |
| Analyst | ⚠️ Read-only access - Data visibility for analysis only |
| Support | ❌ No access to team performance data |

---

## Expected Button Matrix

| Role | View Profile | Email | Schedule Call | 1-on-1 |
|------|--------------|-------|---------------|--------|
| CEO | ✅ | ✅ | ✅ | ✅ |
| VP | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ❌ | ❌ | ❌ |
| Analyst | ✅ | ❌ | ❌ | ❌ |
| Rep | — | — | — | — |
| Support | — | — | — | — |

**Legend:**
- ✅ = Button visible and functional
- ❌ = Button hidden
- — = Section not visible

---

## Troubleshooting

### Issue: Direct Reports not showing for Manager
**Solution:** Make sure you're on `/team/2` and role is set to "Manager"

### Issue: Action buttons not showing for Admin
**Solution:** This is correct - Admin has read-only access

### Issue: Rep can see Direct Reports
**Solution:** Bug - Rep should see no Direct Reports section at all

### Issue: Role switcher not changing view
**Solution:** Refresh page or check console for errors

---

## Summary Checklist

- [ ] Manager sees full Direct Reports with all buttons
- [ ] CEO sees full Direct Reports with all buttons
- [ ] VP sees full Direct Reports with all buttons
- [ ] Admin sees Direct Reports but NO action buttons
- [ ] Analyst sees Direct Reports but NO action buttons
- [ ] Rep sees NO Direct Reports section
- [ ] Support sees NO Direct Reports section
- [ ] Role switcher banner shows correct message for each role
- [ ] All clickable buttons work correctly
- [ ] Navigation to profiles works

---

## Test Status

**Total Scenarios:** 7
**Passed:** _____
**Failed:** _____
**Date Tested:** _____________
**Tester:** _____________

---

## Notes

Use this space for any observations or issues found during testing:

```
[Your notes here]
```

---

**All tests passing?** ✅ Implementation is complete and ready for production!
