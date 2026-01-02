# Seat Availability - Quick Test Guide

## 🚀 Quick Test (2 Minutes)

### Test Flow Diagram
```
Click "Add New Team Member"
         ↓
    Check: availableSeats > 0?
         ↓                    ↓
       YES                   NO
         ↓                    ↓
  Add Team Member      No Seats Available
      Modal                  Modal
```

## 📊 Current Setup
- **Plan**: Professional Plan
- **Total Seats**: 5
- **Seat Usage**: Based on `status: 'active'` members only

## ✅ Test 1: Seats Available (Normal Flow)

**When**: Less than 5 active members

1. Go to: `/crm/team-management`
2. Click: **"Add New Team Member"**
3. ✅ **Add Team Member Modal** opens
4. Fill form and submit
5. ✅ Member added successfully

**Visual**: Blue modal, form with 6 sections, "Add Team Member" button

---

## 🚫 Test 2: No Seats Available (Error Flow)

**When**: Exactly 5 active members

1. Add members until 5 are active
2. Click: **"Add New Team Member"**
3. ✅ **No Seats Available Modal** appears instead

**Visual**: Warning icon (yellow), three upgrade options, three buttons

---

## 🔍 No Seats Modal - What You'll See

```
┌─────────────────────────────────────────┐
│ No Available Seats                   [X]│
├─────────────────────────────────────────┤
│                                         │
│  ⚠️  You've reached your plan limit     │
│                                         │
│  Your Professional Plan includes        │
│  5 seats, and all 5 are currently      │
│  in use.                                │
│                                         │
│  To add more team members, you can:     │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 1. Deactivate an existing user    │ │
│  │    to free a seat                 │ │
│  │    Mark an inactive user as       │ │
│  │    deactivated                    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 2. Upgrade to Business Plan       │ │
│  │    (15 seats)                     │ │← BLUE
│  │    Get 10 additional seats +      │  (Recommended)
│  │    advanced features              │ │
│  │    $299/month                     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 3. Add individual seats           │ │
│  │    Purchase additional seats as   │ │
│  │    needed                         │ │
│  │    $49/month per additional seat  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Cancel] [Deactivate User] [Upgrade]  │
│            ▲                    ▲       │
│          Gray                 Blue      │
└─────────────────────────────────────────┘
```

---

## 🎯 Test Each Button

### Cancel Button
- Click: **Cancel**
- ✅ Modal closes
- ✅ Stay on Team Management page

### Deactivate User Button
- Click: **Deactivate User**
- ✅ Modal closes
- ✅ Toast: "Navigate to user management to deactivate users"

### Upgrade Plan Button
- Click: **Upgrade Plan**
- ✅ Modal closes
- ✅ Toast: "Opening billing and upgrade options..."

---

## 🔄 Test Seat Liberation

**Goal**: Free up a seat by deactivating a user

### Before
```
Active Members: 5
Available Seats: 0
Click "Add New Team Member" → No Seats Modal ❌
```

### Change Status (Manually in browser console or by editing state)
```javascript
// Change one member's status from 'active' to 'inactive'
teamMembers[0].status = 'inactive'
```

### After
```
Active Members: 4
Available Seats: 1
Click "Add New Team Member" → Add Modal ✅
```

---

## 📱 Status Types & Seat Counting

| Status | Counts Toward Limit? | Example |
|--------|---------------------|---------|
| `active` | ✅ YES | Sarah Chen (working) |
| `away` | ❌ NO | Out of office |
| `offline` | ❌ NO | Not logged in |
| `inactive` | ❌ NO | Deactivated user |

**Only `active` status uses a seat!**

---

## 🎨 Visual Indicators

### Warning Icon
- Yellow circle with exclamation mark
- 48px size
- Located at top of modal content

### Option Boxes
1. **Deactivate**: Gray background
2. **Upgrade**: Blue background (highlighted)
3. **Add Seats**: Gray background

### Buttons
- **Cancel**: White with gray border (left)
- **Deactivate User**: White with gray border (center)
- **Upgrade Plan**: Blue background (right, primary)

---

## 🐛 Edge Cases to Test

1. **Exactly 5 active**: No seats modal ✅
2. **4 active, 1 inactive**: Add modal opens ✅
3. **0 active**: Add modal opens ✅
4. **Click outside modal**: Modal closes ✅
5. **Press Escape**: Modal closes ✅
6. **Click X button**: Modal closes ✅

---

## 💡 Quick Debug

### Check Seat Count in Console
```javascript
// Paste in browser console
const activeCount = teamMembers.filter(m => m.status === 'active').length;
console.log('Active members:', activeCount);
console.log('Available seats:', 5 - activeCount);
```

### Force No Seats Scenario
```javascript
// Make first 5 members active
teamMembers.slice(0, 5).forEach(m => m.status = 'active');
// Now click "Add New Team Member"
```

### Force Seats Available Scenario
```javascript
// Make only 3 members active
teamMembers.forEach((m, i) => {
  m.status = i < 3 ? 'active' : 'inactive';
});
// Now click "Add New Team Member"
```

---

## ✨ Expected Behavior Summary

| Active Members | Available Seats | Button Click Result |
|---------------|----------------|---------------------|
| 0 | 5 | Add Modal opens |
| 1 | 4 | Add Modal opens |
| 2 | 3 | Add Modal opens |
| 3 | 2 | Add Modal opens |
| 4 | 1 | Add Modal opens |
| 5 | 0 | **No Seats Modal** |

---

## 🎬 Test Script (30 seconds)

```
1. Navigate to /crm/team-management
2. Look at team member list
3. Count active members (green status)
4. If < 5: Add modal should open
5. If = 5: No seats modal should open
6. Test one button in no seats modal
7. Verify toast message appears
8. ✅ Done!
```

---

## 🔧 Troubleshooting

**Problem**: Modal doesn't open at all
- Check: Button is clickable?
- Check: No console errors?

**Problem**: Wrong modal opens
- Check: Count active members (status === 'active')
- Check: availableSeats calculation

**Problem**: Buttons don't work
- Check: Toast notifications appear?
- Check: Modal closes after click?

---

## 📝 Success Checklist

- [ ] Click button with seats available → Add modal
- [ ] Click button with no seats → No seats modal
- [ ] No seats modal shows correct numbers
- [ ] All three options are visible
- [ ] Cancel button works
- [ ] Deactivate button shows toast
- [ ] Upgrade button shows toast
- [ ] X button closes modal
- [ ] Modal styling looks correct
- [ ] No console errors

**All checked? You're good to go! 🎉**
