# Screen 9.2 - Quick Visual Test Guide
**5-Minute Visual Verification Checklist**

Navigate to: `/team/2`

---

## ✅ SECTION 1: Profile Header (0:30)

**Look for:**
- [ ] Blue circle with "SC" initials
- [ ] "Sarah Chen" in large bold text
- [ ] "Sales Manager" under name
- [ ] Green "Active" badge
- [ ] Email icon → `sarah@bmi.com`
- [ ] Phone icon → `555-0001`
- [ ] Manager: John Smith (ID: 5)
- [ ] Location: San Francisco, CA

**Quick Test:** Click email icon → should open mail client

---

## ✅ SECTION 2: Performance Metrics (0:45)

**Count 6 metric cards in 3×2 grid:**

Row 1:
- [ ] **12** Active Deals (blue briefcase icon)
- [ ] **$680K** Total Pipeline (green target icon)
- [ ] **8 This Q** Won Deals (yellow trophy icon)

Row 2:
- [ ] **72%** Win Rate (blue trending up icon)
- [ ] **108%** Quota Attainment (green target icon)
- [ ] **45 days** Avg Sales Cycle (blue clock icon)

**Quick Test:** All numbers bold and large, icons colorful

---

## ✅ SECTION 3: HRMS Leads (1:30)

**Header should show:**
- [ ] "HRMS-Sourced Leads (Sarah's Specialty)"
- [ ] Blue "HRMS Advantage" badge
- [ ] "2 leads | $215,000 pipeline"

**Card 1: DataFlow Inc**
- [ ] Company name "DataFlow Inc" bold
- [ ] "$120,000" in large text
- [ ] "Qualified (65%)" stage badge
- [ ] Blue "🎯 HRMS Connection" section
- [ ] "Emma Wilson" as recruited employee
- [ ] "Show Context" button

**Quick Test:** Click "Show Context" → paragraph expands

**Card 2: BigCo Enterprise**
- [ ] "$95,000" value
- [ ] "Proposal (70%)" stage
- [ ] "Alex Johnson" as recruited employee
- [ ] All same sections as Card 1

**Quick Test:** Both cards have identical structure

---

## ✅ SECTION 4: Active Deals (0:45)

**Count 5 deal cards:**

1. [ ] DataFlow Inc - **[HRMS]** blue badge
2. [ ] BigCo Enterprise - **[HRMS]** blue badge
3. [ ] TechVision Corp - no badge
4. [ ] CloudStart Solutions - no badge
5. [ ] Innovation Labs - no badge

**Quick Test:** First 2 deals have blue HRMS badges

---

## ✅ SECTION 5: Recent Contacts (0:30)

**Count 5 contact cards:**

1. [ ] Emma Wilson - **[HRMS]** badge
2. [ ] Alex Johnson - **[HRMS]** badge
3. [ ] Michael Chen - no badge
4. [ ] Lisa Martinez - no badge
5. [ ] Robert Kim - no badge

**Quick Test:** Each card has [Email] [Call] [View Profile] buttons

---

## ✅ SECTION 6: Recent Activities (0:45)

**Count 5 activity cards with icons:**

1. [ ] 📞 Phone Call - Emma Wilson - "2 hours ago"
2. [ ] ✉️ Email - Alex Johnson - "Yesterday"
3. [ ] 🤝 Meeting - Michael Chen - "3 days ago"
4. [ ] ✅ Task - Lisa Martinez - "5 days ago"
5. [ ] 📞 Phone Call - Lisa Martinez - "1 week ago"

**Quick Test:** Each has emoji sentiment and colored tags

---

## ✅ SECTION 7: Coaching Notes (1:15)

**Header:**
- [ ] "Coaching Notes (3 Total, Showing All)"
- [ ] Blue "Add Note" button (top right)

**Amber Permissions Banner:**
- [ ] Amber background with warning icon
- [ ] "Coaching Notes Permissions:" header
- [ ] Two columns: "Who Can View" and "Who Can Add Notes"

**Coaching Note 1:**
- [ ] "Coaching Note 1" title
- [ ] "[note_001]" badge in blue
- [ ] "Dec 10, 2024" date with calendar icon
- [ ] "John Smith (Sales Director, Manager ID: 5)"
- [ ] "Manager+ only" amber badge
- [ ] [Edit] and [Delete] buttons (top right)
- [ ] White card with note content
- [ ] "🎯 Focus Areas:" section (3 bullets)
- [ ] "📈 Development Goals:" section (2 bullets)
- [ ] Green "Exceeding Expectations" badge

**Quick Test:** Hover over card → should elevate with shadow

**Coaching Note 2:**
- [ ] "[note_002]" badge
- [ ] "Nov 15, 2024"
- [ ] Focus Areas: 3 items
- [ ] Development Goals: 2 items
- [ ] "Exceeds Expectations" green badge

**Coaching Note 3:**
- [ ] "[note_003]" badge
- [ ] "Oct 5, 2024"
- [ ] Focus Areas: 3 items
- [ ] **NO Development Goals** (correct - optional)
- [ ] 🏆 Achievement section with trophy icon
- [ ] "First HRMS lead conversion..." text
- [ ] 📅 Next Review: Nov 15, 2024
- [ ] "Exceeds Expectations" green badge

**Quick Test:** Click "Add Note" → form opens with 5 fields

---

## VISUAL DESIGN CHECKS (0:30)

**Colors:**
- [ ] Blue accents for primary buttons (#3B82F6)
- [ ] Green badges for positive metrics
- [ ] Amber/Yellow for HRMS and warnings
- [ ] Gray/Slate for neutral content

**Spacing:**
- [ ] Consistent gaps between cards
- [ ] No overlapping elements
- [ ] Proper padding inside cards

**Typography:**
- [ ] Large bold numbers for metrics
- [ ] Clear section headings
- [ ] Readable body text
- [ ] No text cutoff

**Icons:**
- [ ] All Lucide icons rendering
- [ ] Icons properly colored
- [ ] Consistent sizes

---

## INTERACTION TESTS (0:30)

**Click Tests:**
1. [ ] Click "Show Context" on HRMS lead → expands
2. [ ] Click "Hide Context" → collapses
3. [ ] Click "Add Note" button → form appears
4. [ ] Click "Cancel" in form → form closes
5. [ ] Hover over coaching note → card elevates

**Scroll Test:**
- [ ] Page scrolls smoothly
- [ ] All sections load without lag
- [ ] No layout shifts during scroll

---

## TOTAL TIME: 5 MINUTES

**Pass Criteria:**
- All checkboxes checked ✅
- No visual glitches
- All interactions smooth
- Data displays correctly

**If all tests pass:** Screen 9.2 is production-ready! ✅

---

## TROUBLESHOOTING

**If coaching notes don't appear:**
- Check you're viewing as Manager role
- Navigate to `/team/2` (Sarah Chen)

**If HRMS badges missing:**
- Look for blue badges on first 2 deals
- Check contact cards for Emma Wilson and Alex Johnson

**If metrics wrong:**
- Verify numbers: 12, $680K, 8, 72%, 108%, 45 days

**If form doesn't open:**
- Click "Add Note" button in top right of Coaching Notes section
- Check for blue form with 5 fields
