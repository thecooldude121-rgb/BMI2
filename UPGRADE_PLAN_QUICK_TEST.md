# Upgrade Plan Modal - Quick Test Guide

## 🎯 2-Minute Test

### Step 1: Open Modal (15 seconds)
```
1. Login as Admin
2. Navigate: Settings → Team Management
3. Scroll to "Team Capacity" section
4. Click blue "Upgrade Plan" button

EXPECTED:
✅ Modal opens with fade-in
✅ Background darkens (overlay)
✅ Shows "Professional ($149/month)" as current plan
✅ Three plan cards visible
```

---

### Step 2: Test Billing Toggle (20 seconds)
```
ACTION: Click the toggle switch

START STATE:
- Toggle on left (Monthly)
- Business: $299/month
- Add Seat: $49/month
- No savings badge

CLICK TOGGLE →

NEW STATE:
✅ Toggle slides to right (blue)
✅ Shows "Annual"
✅ Green "Save 20%" badge appears
✅ Business: $287/month ($3,444/year - save $144)
✅ Add Seat: $47/month ($564/year per seat)

CLICK AGAIN →
✅ Returns to monthly view
```

---

### Step 3: Test Business Upgrade (30 seconds)
```
1. Keep toggle on "Monthly"
2. Find blue card (middle) with "POPULAR" badge
3. Click "Upgrade to Business" button

EXPECTED:
✅ Toast appears: "Upgrading to Business plan (monthly)..."
✅ Wait 2 seconds
✅ Modal closes
✅ Success toast: "Plan upgraded successfully! Your new seats are now available."
```

---

### Step 4: Test Enterprise Contact (20 seconds)
```
1. Reopen modal (click "Upgrade Plan" button)
2. Find gray card (right side)
3. Click "Contact Sales" button

EXPECTED:
✅ Toast: "Redirecting to contact sales..."
✅ Wait 1.5 seconds
✅ Modal closes
✅ Success toast: "Sales team will contact you within 24 hours"
```

---

### Step 5: Test Add Seat (20 seconds)
```
1. Reopen modal
2. Find green card (left side)
3. Click "Add Seat" button

EXPECTED:
✅ Toast: "Adding seat to your plan..."
✅ Wait 1.5 seconds
✅ Modal closes
✅ Success toast: "Seat added successfully! You now have 1 additional seat."
```

---

### Step 6: Test Close (15 seconds)
```
1. Reopen modal
2. Click X button (top-right corner)

EXPECTED:
✅ Modal closes immediately
✅ No toast messages
✅ Can reopen modal again
```

---

## ✅ Success Checklist

### Modal Display
- [ ] Modal opens when button clicked
- [ ] Modal centered on screen
- [ ] Background overlay present (dark)
- [ ] Shows current plan in header
- [ ] X close button visible

### Three Plan Cards
- [ ] Business plan (blue, middle) - POPULAR badge
- [ ] Enterprise plan (gray, right) - Custom pricing
- [ ] Add Seats plan (green, left) - $49/seat

### Billing Toggle
- [ ] Toggle switches smoothly
- [ ] Prices update when toggled
- [ ] "Save 20%" badge appears on Annual
- [ ] Annual savings shown correctly

### Buttons Work
- [ ] "Upgrade to Business" → Success toast
- [ ] "Contact Sales" → Success toast
- [ ] "Add Seat" → Success toast
- [ ] X button closes modal
- [ ] Each action closes modal

### Visual Quality
- [ ] Cards aligned properly
- [ ] Icons display correctly
- [ ] Typography clear and readable
- [ ] Colors match design (blue, gray, green)
- [ ] Animations smooth

---

## 🎨 Visual Reference

### Expected Layout
```
┌────────────────────────────────────────────────────────────┐
│ Choose Your Plan                                      [X]  │
│ Current Plan: Professional ($149/month)                    │
├────────────────────────────────────────────────────────────┤
│       Monthly [○────] Annual  💚 Save 20%                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐           │
│  │  GREEN   │    │   BLUE   │    │   GRAY   │           │
│  │          │    │ POPULAR  │    │          │           │
│  │ 👥 Add   │    │ 📈 Bus   │    │ 🛡️ Ent   │           │
│  │ Seats    │    │ iness    │    │ erprise  │           │
│  │          │    │          │    │          │           │
│  │ $49/mo   │    │ $299/mo  │    │ Custom   │           │
│  │          │    │          │    │          │           │
│  │ [Add]    │    │[Upgrade] │    │[Contact] │           │
│  └──────────┘    └──────────┘    └──────────┘           │
│                                                            │
│  ⚡ All plans include: ...                                 │
└────────────────────────────────────────────────────────────┘
```

---

## 🐛 Common Issues

### Issue 1: Modal Doesn't Open
**Solution**:
- Verify you're on Team Management page
- Check you're logged in as Admin
- Try refreshing the page

---

### Issue 2: Toggle Not Working
**Solution**:
- Click directly on the toggle switch
- Ensure page is fully loaded
- Check console for errors (F12)

---

### Issue 3: Button Doesn't Respond
**Solution**:
- Wait for any pending actions to complete
- Check that modal is fully rendered
- Verify JavaScript is enabled

---

## 📊 Test Matrix

| Action | Expected Result | Pass/Fail |
|--------|----------------|-----------|
| Open modal | Modal appears | ☐ |
| Toggle to Annual | Prices change, badge shows | ☐ |
| Toggle to Monthly | Returns to monthly view | ☐ |
| Business upgrade | Toast → Modal closes → Success | ☐ |
| Enterprise contact | Toast → Modal closes → Success | ☐ |
| Add seat | Toast → Modal closes → Success | ☐ |
| Close with X | Modal closes immediately | ☐ |
| Reopen modal | Works after close | ☐ |

---

## 🎯 One-Line Test

**Click "Upgrade Plan" → Toggle billing → Test all 3 upgrade buttons → Verify toasts and modal closes**

---

## 📱 Mobile Test (Optional)

1. Open on mobile device or resize browser to 375px
2. Click "Upgrade Plan" button
3. ✅ Modal takes full width
4. ✅ Cards stack vertically
5. ✅ All buttons reachable
6. ✅ Text readable without zooming
7. ✅ Toggle works with touch

---

## ⏱️ Expected Timings

| Action | Duration |
|--------|----------|
| Modal open animation | Instant |
| Toggle switch | Instant |
| Business upgrade | 2 seconds |
| Enterprise contact | 1.5 seconds |
| Add seat | 1.5 seconds |
| Modal close | Instant |

---

## 🎉 Success Result

**If all checks pass**:
- Upgrade Plan feature is working correctly
- All three upgrade paths functional
- Billing toggle operational
- Toast notifications displaying
- Modal interactions smooth

**Total Test Time**: ~2 minutes
**Difficulty**: Easy
**Status**: Production ready ✅
