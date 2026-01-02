# Team Capacity Tooltips - Quick Test Guide

## 🎯 Quick Test (1 Minute)

### Navigation
```
1. Login as Admin
2. Click "Settings" in sidebar
3. Click "Team Management"
4. Scroll to "Team Capacity" section
```

---

## 📊 Test Each Card

### Card 1: Active Members (Blue)
```
ACTION:
Hover over the blue "Active Members" card

EXPECTED:
✅ Cursor changes to question mark (?)
✅ Dark tooltip appears above card
✅ Tooltip shows:
   "3 team members with active accounts.
    All members have logged in within the last 7 days."
✅ Tooltip fades in smoothly
✅ Tooltip disappears when mouse moves away
```

**Visual**:
```
┌─────────────────────────────────────────────┐
│ 3 team members with active accounts.        │
│ All members have logged in within last 7d.  │
└──────────────────▲───────────────────────────┘
                   │
┌──────────────────────────────────────────────┐
│ 👥 Active Members                            │
│                                              │
│ 3                                            │
│ 2 inactive, 0 pending                        │
└──────────────────────────────────────────────┘
```

---

### Card 2: Available Seats (Green)
```
ACTION:
Hover over the green "Available Seats" card

EXPECTED:
✅ Cursor changes to question mark (?)
✅ Dark tooltip appears above card
✅ Tooltip shows:
   "2 seats remaining on your Professional plan.
    You can add 2 more team members without upgrading."
✅ Smooth fade animation
```

**Visual**:
```
┌─────────────────────────────────────────────┐
│ 2 seats remaining on Professional plan.     │
│ You can add 2 more team members.            │
└──────────────────▲───────────────────────────┘
                   │
┌──────────────────────────────────────────────┐
│ ✓ Available Seats                            │
│                                              │
│ 2                                            │
│ $50/seat/month                               │
└──────────────────────────────────────────────┘
```

---

### Card 3: Total Capacity (Purple)
```
ACTION:
Hover over the purple "Total Capacity" card

EXPECTED:
✅ Cursor changes to question mark (?)
✅ Dark tooltip appears above card
✅ Tooltip shows:
   "Your Professional plan includes 5 user seats.
    Upgrade to Business (15 seats) or add individual seats."
✅ Text is clear and readable
```

**Visual**:
```
┌─────────────────────────────────────────────┐
│ Your Professional plan includes 5 seats.    │
│ Upgrade to Business (15) or add seats.      │
└──────────────────▲───────────────────────────┘
                   │
┌──────────────────────────────────────────────┐
│ 💼 Total Capacity                            │
│                                              │
│ 5                                            │
│ Professional plan                            │
└──────────────────────────────────────────────┘
```

---

### Card 4: Last Updated (Orange)
```
ACTION:
Hover over the orange "Last Updated" card

EXPECTED:
✅ Cursor changes to question mark (?)
✅ Dark tooltip appears above card
✅ Tooltip shows:
   "User data syncs automatically in real-time.
    Last manual refresh: 2 hours ago."
✅ Tooltip positioned correctly
```

**Visual**:
```
┌─────────────────────────────────────────────┐
│ User data syncs automatically in real-time. │
│ Last manual refresh: 2 hours ago.           │
└──────────────────▲───────────────────────────┘
                   │
┌──────────────────────────────────────────────┐
│ 🔄 Last Updated                              │
│                                              │
│ 2 hours ago                                  │
│ Auto-sync enabled                            │
└──────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

### All Tests Pass If:
- [x] Cursor changes to `?` (help cursor) on all 4 cards
- [x] Tooltip appears on hover for all 4 cards
- [x] Tooltip disappears on mouse out for all 4 cards
- [x] Tooltips are dark gray with white text
- [x] Text is readable (good contrast)
- [x] Tooltips are centered above cards
- [x] Animation is smooth (fade in/out)
- [x] No console errors
- [x] No layout shifts or jumps
- [x] Cards remain display-only (no click action)

---

## 🎨 Visual Verification

### Tooltip Appearance
```
Background: Dark gray (#111827)
Text: White (#FFFFFF)
Font Size: 12px
Padding: 8px 12px
Border Radius: 8px
Shadow: Yes (drop shadow)
Position: Above card, centered
Width: Auto (fits content)
Lines: 2 lines per tooltip
```

### Card Appearance (No Changes)
```
Card 1 (Active Members):
- Background: Blue gradient (from-blue-50 to-blue-100)
- Border: Blue (border-blue-200)
- Icon: Users (blue)

Card 2 (Available Seats):
- Background: Green gradient (from-green-50 to-green-100)
- Border: Green (border-green-200)
- Icon: CheckCircle (green)

Card 3 (Total Capacity):
- Background: Purple gradient (from-purple-50 to-purple-100)
- Border: Purple (border-purple-200)
- Icon: Briefcase (purple)

Card 4 (Last Updated):
- Background: Orange gradient (from-orange-50 to-orange-100)
- Border: Orange (border-orange-200)
- Icon: RefreshCw (orange)
```

---

## 🐛 Common Issues Check

### Issue 1: Tooltip Doesn't Appear
**Check**:
- Is page loaded completely?
- Are you hovering directly over the card?
- Try refreshing the page

---

### Issue 2: Cursor Doesn't Change
**Check**:
- Browser might override cursor styles
- Try different browser
- Native tooltip should still show

---

### Issue 3: Tooltip Text Cut Off
**Check**:
- Browser window wide enough?
- Zoom level at 100%?
- Try fullscreen mode

---

### Issue 4: Tooltip Blocks View
**Not an issue**:
- Tooltip has `pointer-events-none`
- Won't interfere with interactions
- Just informational

---

## 🔄 Quick Comparison Test

### Before (Without Tooltips)
```
Hover over card → Nothing happens
User confused about what metrics mean
Need to check documentation
```

### After (With Tooltips)
```
Hover over card → Helpful tooltip appears
User understands metric immediately
No need to leave page
Better UX
```

---

## 📱 Mobile Testing (Optional)

### On Mobile Devices
```
1. Tap and hold on a card
2. Native browser tooltip should appear
3. Or tap to see title attribute
4. Custom CSS tooltip may not show (expected)
```

**Note**: Mobile primarily uses native tooltips via the `title` attribute.

---

## ⚡ Speed Test

### Rapid Hover Test
```
1. Quickly move mouse across all 4 cards
2. ✅ Each tooltip should appear instantly
3. ✅ Each tooltip should disappear smoothly
4. ✅ No lag or stuttering
5. ✅ No tooltip remains stuck
```

---

## 🎯 One-Sentence Test

**Hover over each of the 4 colored metric cards and verify a dark tooltip with helpful text appears above each one.**

---

## 📋 Final Checklist

### Pre-Test
- [ ] Logged in as Admin
- [ ] On Team Management page
- [ ] Team Capacity section visible
- [ ] All 4 cards displayed

### During Test
- [ ] Active Members tooltip works
- [ ] Available Seats tooltip works
- [ ] Total Capacity tooltip works
- [ ] Last Updated tooltip works

### Post-Test
- [ ] No errors in console (F12)
- [ ] No visual glitches
- [ ] Cards still display-only
- [ ] Feature approved ✓

---

## 🎉 Expected Result

**All 4 metric cards now provide contextual help on hover, improving user understanding and reducing support questions.**

**Time to Test**: 60 seconds
**Difficulty**: Easy
**Result**: Enhanced user experience with no functional changes

---

## 📍 Page Location Reminder

```
URL: /settings/team-management
Route: Settings → Team Management
Section: Team Capacity Overview (2nd section on page)
Access: Admin only
Cards: 4 metric cards in a row
```

---

## ✨ Success!

If all 4 tooltips show correctly, the feature is complete and working as designed!
