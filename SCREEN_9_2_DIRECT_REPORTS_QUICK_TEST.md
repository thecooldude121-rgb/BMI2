# Direct Reports Section - 5 Minute Quick Test
**Fast Verification Guide**

---

## 🎯 QUICK START

**URL:** `/team/2` (Sarah Chen - Manager with 2 reports)
**Time:** 5 minutes
**Prerequisites:** Application running

---

## ✅ TEST CHECKLIST

### 1️⃣ Section Visibility (30 seconds)

**Steps:**
1. Go to `/team/2`
2. Scroll down past performance metrics
3. Look for "Direct Reports (2)" section

**Verify:**
- [ ] Section appears after performance metrics
- [ ] Section appears before HRMS section
- [ ] Header shows "👥 Direct Reports (2)"
- [ ] [View Team →] button visible

**Screenshot Location:** Below performance metrics

---

### 2️⃣ Report Cards (1 minute)

**Steps:**
1. Locate the two report cards
2. Check first card (Alex Rodriguez)
3. Check second card (Emily Davis)

**Verify Alex Rodriguez:**
- [ ] Avatar shows "AR" on blue background
- [ ] Name: "Alex Rodriguez"
- [ ] Role: "Sales Representative"
- [ ] Email: "alex@bmi.com"
- [ ] Active Deals: 8 deals
- [ ] Pipeline: $450,000
- [ ] Win Rate: 67% (Solid performer)
- [ ] Last Activity: 2 hours ago
- [ ] Status: ✅ Active
- [ ] Member since: Oct 1, 2024
- [ ] [View Profile] button visible

**Verify Emily Davis:**
- [ ] Avatar shows "ED" on blue background
- [ ] Name: "Emily Davis"
- [ ] Role: "Sales Representative"
- [ ] Email: "emily@bmi.com"
- [ ] Active Deals: 5 deals
- [ ] Pipeline: $280,000
- [ ] Win Rate: 65% (On track)
- [ ] Last Activity: 5 hours ago
- [ ] Status: ✅ Active
- [ ] Member since: Oct 1, 2024
- [ ] [View Profile] button visible

---

### 3️⃣ Quick Actions (1 minute)

**Steps:**
1. Find Alex Rodriguez's card
2. Locate quick action buttons at bottom
3. Click each button to verify

**Verify Buttons Exist:**
- [ ] 📧 Email button
- [ ] 📞 Schedule Call button
- [ ] 🤝 1-on-1 button

**Test Email:**
1. Click [📧 Email]
2. [ ] Email modal opens
3. [ ] "To:" field shows "alex@bmi.com"
4. Click [Cancel] or [X] to close

**Test Schedule Call:**
1. Click [📞 Schedule Call]
2. [ ] Schedule Call modal opens
3. [ ] "Team Member" field shows "Alex Rodriguez"
4. [ ] Field is disabled (grayed out)
5. [ ] Can select date/time
6. [ ] Can select duration (15/30/45/60 mins)
7. [ ] Can enter call purpose
8. Click [Cancel] to close

**Test 1-on-1:**
1. Click [🤝 1-on-1]
2. [ ] Schedule 1-on-1 modal opens
3. [ ] "Team Member" field shows "Alex Rodriguez"
4. [ ] Field is disabled (grayed out)
5. [ ] Can select date/time
6. [ ] Can select meeting type
7. [ ] Can enter agenda items
8. Click [Cancel] to close

---

### 4️⃣ Team Rollup Stats (1 minute)

**Steps:**
1. Scroll to "📊 TEAM ROLLUP STATS" section
2. Verify 4 metric cards
3. Check calculations

**Verify Metric Cards:**
- [ ] Card 1: 💼 Total Deals = 13 (Combined)
- [ ] Card 2: 🎯 Total Pipeline = $730K (+8% vs LM)
- [ ] Card 3: 🏆 Avg Win Rate = 66% (Team avg)
- [ ] Card 4: 📅 Team Activity = Active (Last 24hrs)

**Verify Team Quota:**
- [ ] Shows "Team Quota Attainment: 106%"
- [ ] Shows "Alex: 104%, Emily: 108%"

**Verify Calculations:**
- Total Deals: 8 + 5 = 13 ✅
- Total Pipeline: $450K + $280K = $730K ✅
- Avg Win Rate: (67 + 65) / 2 = 66% ✅
- Avg Quota: (104 + 108) / 2 = 106% ✅

---

### 5️⃣ Coaching Alert (30 seconds)

**Steps:**
1. Scroll to bottom of Direct Reports section
2. Locate coaching alert box

**Verify:**
- [ ] Yellow background box visible
- [ ] ⚠️ icon present
- [ ] Header: "Coaching Attention Needed:"
- [ ] Message: "None at this time - team performing well"

---

### 6️⃣ Navigation Tests (1 minute)

**Test 1: View Profile**
1. Click [View Profile] on Alex's card
2. [ ] Navigates to `/team/3`
3. [ ] Toast shows "Loading Alex Rodriguez's profile"
4. [ ] Alex's profile loads
5. Use back button to return

**Test 2: View Team**
1. Click [View Team →] in section header
2. [ ] Navigates to `/team`
3. [ ] Team list page loads

---

### 7️⃣ Non-Manager View (30 seconds)

**Steps:**
1. Navigate to `/team/3` (Alex Rodriguez - no reports)
2. Scroll through entire page

**Verify:**
- [ ] Direct Reports section does NOT appear
- [ ] No errors in console
- [ ] Other sections display normally

---

## 🎨 VISUAL CHECKS

### Card Design
- [ ] Cards have gradient background (slate-50 to white)
- [ ] Cards have slate-200 border
- [ ] Cards have hover shadow effect
- [ ] Avatar circles are blue gradient
- [ ] Spacing between cards is consistent

### Team Stats Design
- [ ] Section has blue-50 to slate-50 gradient
- [ ] Section has blue-200 border
- [ ] Metric cards are white with slate borders
- [ ] Cards are in 4-column grid
- [ ] Emoji icons visible (💼🎯🏆📅)

### Coaching Alert Design
- [ ] Yellow-50 background
- [ ] Yellow-200 border
- [ ] ⚠️ emoji visible
- [ ] Text is readable

---

## 🚨 COMMON ISSUES

### Issue 1: Section Not Showing
**Cause:** Viewing non-manager profile
**Fix:** Navigate to `/team/2` (Sarah Chen)

### Issue 2: Data Not Showing
**Cause:** directReports array missing
**Fix:** Verify Sarah Chen's data includes directReports

### Issue 3: Modals Not Opening
**Cause:** Event handler not connected
**Fix:** Check console for errors

### Issue 4: Navigation Not Working
**Cause:** React Router issue
**Fix:** Ensure routes are set up correctly

---

## ⏱️ TIME BREAKDOWN

- Section Visibility: 30s
- Report Cards: 1m
- Quick Actions: 1m
- Team Stats: 1m
- Coaching Alert: 30s
- Navigation: 1m
- Non-Manager: 30s

**Total: 5 minutes**

---

## ✅ PASS CRITERIA

**All tests pass if:**
- ✅ Section appears for managers only
- ✅ 2 report cards display correctly
- ✅ All data accurate (deals, pipeline, win rate, etc.)
- ✅ All 3 quick actions work (email, call, 1-on-1)
- ✅ Team stats calculations correct
- ✅ Navigation works to profiles and team list
- ✅ Section hidden for non-managers
- ✅ No console errors

---

## 🎯 QUICK VISUAL TEST

**Can you see these elements?**

```
✅ Header: "👥 Direct Reports (2)" with [View Team →]

✅ Card 1:
   [AR] Alex Rodriguez [View Profile]
   Sales Representative | alex@bmi.com
   8 deals | $450,000 | 67% | 2 hours ago
   [📧 Email] [📞 Schedule Call] [🤝 1-on-1]

✅ Card 2:
   [ED] Emily Davis [View Profile]
   Sales Representative | emily@bmi.com
   5 deals | $280,000 | 65% | 5 hours ago
   [📧 Email] [📞 Schedule Call] [🤝 1-on-1]

✅ Stats:
   💼 13 Deals | 🎯 $730K | 🏆 66% | 📅 Active
   Team Quota: 106% (Alex: 104%, Emily: 108%)

✅ Alert:
   ⚠️ Coaching Attention Needed:
   None at this time - team performing well
```

**If you see all of the above:** ✅ TEST PASSED!

---

## 🐛 DEBUGGING TIPS

### Check Browser Console
```javascript
// Verify data loaded
console.log(member.directReports)

// Should show:
[
  { id: '3', name: 'Alex Rodriguez', ... },
  { id: '4', name: 'Emily Davis', ... }
]
```

### Check Network Tab
- No API calls needed (uses mock data)
- Navigation should update URL only

### Check React DevTools
- Component: DirectReportsSection
- Props: reports (array of 2)
- State: Modal states (false when closed)

---

## 📸 SCREENSHOT CHECKLIST

Take screenshots of:
1. ✅ Full Direct Reports section
2. ✅ Alex Rodriguez's card (expanded)
3. ✅ Team Rollup Stats section
4. ✅ Schedule Call modal (open)
5. ✅ Schedule 1-on-1 modal (open)
6. ✅ Non-manager page (section absent)

---

## ✅ FINAL VERIFICATION

After completing all tests:

- [ ] All checkboxes marked
- [ ] All calculations verified
- [ ] All modals tested
- [ ] All navigation tested
- [ ] No console errors
- [ ] Visual design matches spec
- [ ] Screenshots taken

**Status:** ✅ READY FOR DEMO

---

**Test Date:** December 26, 2024
**Tested By:** ___________
**Result:** PASS / FAIL
**Notes:** ___________
