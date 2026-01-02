# Screen 9.2: Team Member Detail - Quick Test Card

## 🚀 INSTANT ACCESS
**URL:** `/team/2`
**From:** Team Performance page → Click "Sarah Chen"

---

## ⚡ 1-MINUTE VISUAL CHECK

```
✅ Breadcrumb: "Team › Sarah Chen"
✅ Profile: Blue SC avatar + Active badge
✅ Metrics: 6 cards (12, $680K, 8, 72%, 108%, 45 days)
✅ HRMS: 2 orange-bordered leads
✅ Deals: 5 rows (2 with 🏢)
✅ Contacts: 5 rows (2 with 🏢)
✅ Activities: 5 cards (mixed icons)
✅ Notes: 3 coaching notes
```

---

## 🎯 CRITICAL FEATURES (2 MIN)

### 1. Role Switcher Test
```
Manager → All sections visible
Rep → HRMS + Notes hidden
Admin → All visible, can add notes
Analyst → All visible, read-only notes
```

### 2. HRMS Integration
```
✅ Orange gradient section
✅ 2 leads: DataFlow ($120K) + BigCo ($95K)
✅ Each has recruitment context box
✅ HRMS badges on deals table
✅ HRMS badges on contacts table
✅ "View in HRMS System" button
```

### 3. Coaching Notes (Manager+)
```
✅ "+ Add Note" button
✅ Click → Blue form appears
✅ 3 existing notes with Edit/Delete
✅ Each note has author + date
```

---

## 🔗 CLICKABLE ELEMENTS (1 MIN)

### Must-Click List:
1. ✅ "Team" in breadcrumb → Goes to /team
2. ✅ "Schedule 1-on-1" → Shows in Manager view
3. ✅ "View All →" on Deals → Navigate
4. ✅ "View All →" on Contacts → Navigate
5. ✅ "View All →" on Activities → Navigate
6. ✅ "View in HRMS System" → /hrms/dashboard
7. ✅ "+ Add Note" → Toggle form

---

## 📊 DATA VALIDATION

### Performance Metrics:
- Active Deals: **12** (+3 vs LM)
- Total Pipeline: **$680K** (+15% MoM)
- Won Deals: **8** (This Q)
- Win Rate: **72%** (Above avg)
- Quota: **108%** (On target)
- Avg Cycle: **45 days** (-5 days)

### HRMS Leads:
1. **DataFlow Inc**: $120K, Emma Wilson, Qualified, 65%
2. **BigCo Enterprise**: $95K, Alex Johnson, Proposal, 70%

### Top Deal:
- DataFlow Inc 🏢: $120K, Qualified, 65%, Jan 30 '26

### Recent Activity:
- Latest: Call with Emma Wilson, 2 hours ago

---

## 🎨 STYLE CHECKLIST

```
Background: ✅ Gradient (slate → blue → slate)
Cards: ✅ White with shadows
HRMS: ✅ Orange gradient
Tables: ✅ Clean borders, hover states
Icons: ✅ Colored (blue/green/orange)
Badges: ✅ Green "Active", Orange HRMS
Spacing: ✅ Consistent 16-24px
Typography: ✅ Clear hierarchy
```

---

## 🐛 COMMON ISSUES TO CHECK

- [ ] No console errors on load
- [ ] All images/icons render
- [ ] Tables don't overflow
- [ ] Buttons have hover states
- [ ] Role switcher changes visibility
- [ ] Breadcrumb navigation works
- [ ] HRMS section only for authorized roles
- [ ] Coaching notes only for Manager+
- [ ] All counts match (12 deals, 24 contacts, etc.)
- [ ] Orange HRMS badges consistent

---

## 🎭 ROLE BEHAVIOR MATRIX

| Role | HRMS | Notes | Schedule | Add Note |
|------|------|-------|----------|----------|
| CEO | ✅ | ✅ | ✅ | ✅ |
| VP | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ✅ |
| Rep | ❌ | ❌ | ❌ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ |
| Analyst | ✅ | ✅ | ❌ | ❌ |

---

## 🏃 SPEED TEST WORKFLOW

**30 Seconds:**
1. Load page
2. Verify 8 sections
3. Check HRMS orange section
4. Spot 🏢 badges

**1 Minute:**
5. Switch to Rep role
6. Verify HRMS hidden
7. Switch back to Manager
8. Verify HRMS visible

**2 Minutes:**
9. Click "+ Add Note"
10. Verify form appears
11. Click "View All" links
12. Check breadcrumb works

---

## ✅ PASS/FAIL CRITERIA

### ✅ PASS IF:
- All 8 sections render
- 2 HRMS leads visible
- 6 metric cards show data
- Role switcher changes views
- HRMS badges appear on 2 deals
- HRMS badges appear on 2 contacts
- 3 coaching notes display
- Breadcrumb navigates correctly

### ❌ FAIL IF:
- Console errors appear
- HRMS section missing
- Metrics show wrong numbers
- Role switcher doesn't work
- HRMS badges missing
- Coaching notes show to Rep
- Navigation broken
- Layout breaks on any screen size

---

## 📱 RESPONSIVE CHECK

### Desktop (> 1024px):
- 6 metric cards in one row
- Full tables visible
- All sections side-by-side where designed

### Tablet (768-1023px):
- 3 metric cards per row (2 rows)
- Tables may scroll
- Sections stack properly

### Mobile (< 768px):
- 2 metric cards per row (3 rows)
- Tables convert to cards
- All sections stack vertically

---

## 🎯 KEY SUCCESS INDICATORS

1. **Visual Hierarchy** ✅
   - Profile largest
   - Sections clear
   - HRMS stands out

2. **HRMS Integration** ✅
   - Orange theme consistent
   - Badges visible
   - Context clear

3. **Role Security** ✅
   - Rep can't see HRMS
   - Rep can't see notes
   - Manager can add notes

4. **Navigation** ✅
   - Breadcrumb works
   - All links active
   - "View All" buttons present

5. **Data Integrity** ✅
   - Numbers match design
   - 2 HRMS leads
   - 3 coaching notes
   - 5 activities

---

## 🔍 EDGE CASES

### Test These:
- [ ] Member with 0 HRMS leads (HRMS section hidden)
- [ ] Member with 100+ activities (pagination)
- [ ] Long company names (truncation)
- [ ] Very recent activity ("Just now")
- [ ] Missing manager (handled gracefully)
- [ ] Support role (no access? or limited?)

---

## 💡 PRO TIPS

**Speed Testing:**
- Use role switcher instead of logging out
- Check network tab for API calls
- Use React DevTools to inspect props
- Test on actual mobile device if possible

**Visual Testing:**
- Compare to design specs side-by-side
- Check color values in dev tools
- Verify spacing with rulers
- Test all hover states

**Functionality Testing:**
- Click every button once
- Test all navigation paths
- Verify forms work
- Check error states

---

## 📋 FINAL CHECKLIST

### Must-Have Features:
- [x] 8 distinct sections
- [x] Role-based visibility
- [x] HRMS integration
- [x] Coaching notes (Manager+)
- [x] Performance metrics
- [x] Recent activity feed
- [x] Deals/contacts tables
- [x] Breadcrumb navigation

### Quality Checks:
- [x] Clean design
- [x] Consistent spacing
- [x] Proper colors
- [x] Icons render
- [x] Hover states work
- [x] No console errors
- [x] Responsive layout
- [x] Fast load time

### Data Accuracy:
- [x] Sarah Chen profile
- [x] 12 active deals
- [x] 2 HRMS leads
- [x] 24 contacts
- [x] 47 activities
- [x] 3 coaching notes
- [x] Correct metrics

---

**Status:** ✅ Ready for Demo
**Build:** ✅ Passing
**Route:** `/team/2`
**Test Time:** ~5 minutes for full verification
