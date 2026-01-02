# Screen 9.2: Team Member Detail View - Test Guide

## Navigation
**Access:** Click on any team member name from Screen 9.1 (Team Performance Page)
**URL:** `/team/2` (Sarah Chen)

---

## ✅ SECTION 1: Breadcrumb Navigation
```
Team › Sarah Chen
```
- Click "Team" → Returns to Team Performance page
- Current location: "Sarah Chen" (not clickable)

---

## ✅ SECTION 2: Profile Header

### Information Displayed:
- **Avatar:** Blue circle with initials "SC"
- **Name:** Sarah Chen
- **Status Badge:** ✅ Active (green badge)
- **Role:** Sales Manager
- **Contact Info:**
  - Email: sarah@bmi.com
  - Phone: 555-0001
- **Reporting Structure:** Reports to: John Smith (Director)
- **Timeline:**
  - Member since: Oct 1, 2024
  - Last active: 2 hours ago

### Action Buttons (Role-Based):
1. **Schedule 1-on-1** - Manager+ only
2. **View Calendar** - All roles
3. **Send Email** - All roles

---

## ✅ SECTION 3: Performance Metrics (6 Cards)

### Card 1: Active Deals
- **Value:** 12
- **Trend:** +3 vs LM (last month)
- **Icon:** 💼 Briefcase

### Card 2: Total Pipeline
- **Value:** $680K
- **Trend:** +15% MoM (month over month)
- **Icon:** 🎯 Target

### Card 3: Won Deals
- **Value:** 8
- **Period:** This Q (quarter)
- **Icon:** 📈 Trending Up

### Card 4: Win Rate
- **Value:** 72%
- **Comparison:** Above avg
- **Icon:** 🏆 Trophy

### Card 5: Quota Attainment
- **Value:** 108%
- **Status:** On target
- **Icon:** 🎯 Target

### Card 6: Avg Cycle
- **Value:** 45 days
- **Trend:** -5 days (improvement)
- **Icon:** ⏱️ Clock

---

## ✅ SECTION 4: HRMS-Sourced Leads

**Visibility:** CEO, VP, Manager, Admin, Analyst roles only
**Header:** "Sarah benefits from 2 recruitment-powered opportunities"

### Lead 1: DataFlow Inc
```
Value: $120,000
Contact: Emma Wilson (VP Engineering)
Recruited: Oct 15, 2025
Current Stage: Qualified
Close Probability: 65% (+33% HRMS bonus)
Expected Close: Jan 30, 2026
```

**Recruitment Context:**
> Emma Wilson was hired by your company's HR team as a Senior Software Engineer. This creates a warm introduction opportunity with DataFlow Inc, where Emma previously served as VP Engineering. Leverage this connection for a trusted approach.

**Actions:**
- [View Lead Details]
- [View Deal]
- [Contact Emma]

### Lead 2: BigCo Enterprise
```
Value: $95,000
Contact: Alex Johnson (CTO)
Recruited: Sep 22, 2025
Current Stage: Proposal
Close Probability: 70% (+33% HRMS bonus)
Expected Close: Feb 15, 2026
```

**Recruitment Context:**
> Alex Johnson was hired by your company's HR team as a Solutions Architect. Previously CTO at BigCo Enterprise. Strong relationship can accelerate deal progression.

**Actions:**
- [View Lead Details]
- [View Deal]
- [Contact Alex]

### HRMS Advantage Banner:
> 💡 These recruitment-sourced leads have a 33% higher close rate compared to cold outreach. Total HRMS pipeline: $215,000

**Action Button:**
- [View in HRMS System] → Navigates to /hrms/dashboard

---

## ✅ SECTION 5: Assigned Deals

**Header:** "Assigned Deals (12 active)"
**Action:** [View All →]

### Table Columns:
1. Deal Name (with 🏢 badge for HRMS leads)
2. Value
3. Stage
4. Probability
5. Close Date

### Sample Data (5 of 12):
| Deal Name | Value | Stage | Probability | Close Date |
|-----------|-------|-------|-------------|------------|
| DataFlow Inc 🏢 | $120K | Qualified | 65% | Jan 30, '26 |
| BigCo Enterprise 🏢 | $95K | Proposal | 70% | Feb 15, '26 |
| TechVision Corp | $85K | Negotiation | 80% | Dec 31, '25 |
| CloudStart Solutions | $65K | Qualified | 50% | Jan 15, '26 |
| Innovation Labs | $110K | Proposal | 60% | Feb 1, '26 |

**Footer:** "Showing 5 of 12 deals"

---

## ✅ SECTION 6: Assigned Contacts

**Header:** "Assigned Contacts (24 contacts)"
**Action:** [View All →]

### Table Columns:
1. Contact Name (with 🏢 badge for HRMS contacts)
2. Company
3. Title
4. Last Contact

### Sample Data (5 of 24):
| Contact Name | Company | Title | Last Contact |
|--------------|---------|-------|--------------|
| Emma Wilson 🏢 | DataFlow Inc | VP Eng | 2 days ago |
| Alex Johnson 🏢 | BigCo Enterprise | CTO | 1 week ago |
| Michael Chen | TechVision Corp | CEO | 3 days ago |
| Lisa Martinez | CloudStart Sol | VP Sales | 5 days ago |
| Robert Kim | Innovation Labs | Director | 1 week ago |

**Footer:** "Showing 5 of 24 contacts"

---

## ✅ SECTION 7: Recent Activity

**Header:** "Recent Activity"
**Action:** [View All →]

### Activity 1: Call
```
Type: 📞 Call
Contact: Emma Wilson (DataFlow Inc)
Time: 2 hours ago
Description: Discussed pricing options for enterprise plan. Emma is positive
about moving forward. Follow-up scheduled for next week.
Duration: 35 minutes
Outcome: Positive (green)
```

### Activity 2: Email
```
Type: ✉️ Email
Contact: Alex Johnson (BigCo Enterprise)
Time: Yesterday
Subject: "Updated Proposal - Q1 2026 Implementation"
Description: Sent updated proposal with revised timeline. Awaiting response.
```

### Activity 3: Meeting
```
Type: 🤝 Meeting
Contact: Michael Chen (TechVision Corp)
Time: 3 days ago
Description: Product demo completed. Client impressed with features. Moving to
negotiation stage. Waiting for legal review.
Duration: 1 hour
Attendees: 4
Outcome: Excellent (green)
```

### Activity 4: Task
```
Type: 📋 Task Completed
Contact: CloudStart
Time: 5 days ago
Description: Sent follow-up materials after initial discovery call. Scheduled
next meeting for Dec 20.
```

### Activity 5: Call
```
Type: 📞 Call
Contact: Lisa Martinez (CloudStart Solutions)
Time: 1 week ago
Description: Discovery call to understand requirements. Identified 3 key pain
points. Good fit for our enterprise solution.
Duration: 45 minutes
Outcome: Qualified (green)
```

**Footer:** "Showing 5 of 47 activities"

---

## ✅ SECTION 8: Coaching Notes

**Visibility:** Manager, VP, CEO, Admin roles only
**Header:** "Coaching Notes"
**Action:** [+ Add Note]

### Add Note Feature (Manager+):
When clicking "+ Add Note":
1. Blue form appears
2. Fields:
   - Large textarea for note content
   - Optional "Focus Areas" field
3. Buttons:
   - [Save Note] - Blue
   - [Cancel] - Gray border

### Note 1:
```
Date: Dec 10, 2024
Author: John Smith (Director)
Actions: [Edit] [Delete]

Content:
Sarah continues to excel with HRMS-sourced leads. Her approach to leveraging
warm introductions is exemplary. Suggested she mentor junior reps on this
strategy. Pipeline velocity improved 20% MoM.

Focus Areas: Scale HRMS strategy, mentor team
```

### Note 2:
```
Date: Nov 15, 2024
Author: John Smith (Director)
Actions: [Edit] [Delete]

Content:
Strong performance this quarter. Win rate 72% exceeds team average of 67%.
Excellent at relationship building. Working on shortening sales cycles further
through better qualification.

Focus Areas: Improve qualification process
```

### Note 3:
```
Date: Oct 5, 2024
Author: John Smith (Director)
Actions: [Edit] [Delete]

Content:
First HRMS lead converted successfully (DataFlow Inc). This validates the HRMS
integration strategy. Sarah effectively used the recruitment connection to build
trust quickly. Encouraged to document the approach for team training.

Achievement: First HRMS conversion (green text)
```

**Footer:** "Showing 3 of 3 notes"

---

## 🎯 ROLE-BASED VISIBILITY TESTING

### View as Manager (DEFAULT):
- ✅ All sections visible
- ✅ HRMS section visible
- ✅ Coaching notes visible
- ✅ Can add coaching notes
- ✅ Schedule 1-on-1 button visible

### View as Rep:
- ✅ Profile visible
- ✅ Performance metrics visible
- ✅ Deals visible
- ✅ Contacts visible
- ✅ Activities visible
- ❌ HRMS section HIDDEN
- ❌ Coaching notes HIDDEN
- ❌ Schedule 1-on-1 button HIDDEN

### View as Analyst:
- ✅ All sections visible
- ✅ HRMS section visible (read-only)
- ✅ Coaching notes visible
- ❌ Cannot add coaching notes
- ❌ Schedule 1-on-1 button HIDDEN

### View as Admin:
- ✅ All sections visible
- ✅ HRMS section visible
- ✅ Coaching notes visible
- ✅ Can add coaching notes
- ✅ Schedule 1-on-1 button visible

---

## 🎨 DESIGN VALIDATION

### Color Scheme:
- **Primary Blue:** Buttons, icons, links (#2563EB)
- **Orange/HRMS:** HRMS badges, integration sections (#EA580C)
- **Green:** Success states, positive outcomes (#10B981)
- **Slate:** Text hierarchy (800, 700, 600, 500)
- **Backgrounds:** Gradient from slate-50 via blue-50 to slate-100

### Visual Hierarchy:
1. Profile Header (largest, most prominent)
2. Performance Metrics (6 equal cards)
3. HRMS Section (highlighted with orange gradient)
4. Tabular sections (Deals, Contacts)
5. Timeline sections (Activities, Notes)

### Spacing:
- Section margin: 6 (mb-6)
- Card padding: 4-6
- Grid gaps: 4
- Icon sizes: 4-6 (w-4 h-4 to w-6 h-6)

### Interactions:
- All buttons have hover states
- Tables have row hover effects
- Links change color on hover
- Action buttons have subtle transitions

---

## 🔗 CLICKABLE INTERACTIONS

### Profile Section:
- Manager name → Navigate to manager profile
- Schedule 1-on-1 → Schedule meeting
- View Calendar → Open calendar view
- Send Email → Open email composer

### HRMS Section:
- View Lead Details → Navigate to lead
- View Deal → Navigate to deal
- Contact [Name] → Open contact
- View in HRMS System → Navigate to /hrms/dashboard

### Deals Section:
- View All → Navigate to full deals list
- Deal row → Navigate to deal detail

### Contacts Section:
- View All → Navigate to full contacts list
- Contact row → Navigate to contact detail

### Activities Section:
- View All → Navigate to full activity feed

### Coaching Notes:
- + Add Note → Open note form
- Edit icon → Edit note
- Delete icon → Delete note (with confirmation)

---

## ✅ SUCCESS CRITERIA

All sections display correctly with:
- ✅ Proper data for Sarah Chen
- ✅ 2 HRMS leads with full context
- ✅ 6 performance metric cards
- ✅ 5 deals (2 marked as HRMS)
- ✅ 5 contacts (2 marked as HRMS)
- ✅ 5 recent activities with varied types
- ✅ 3 coaching notes
- ✅ Role-based visibility working
- ✅ Breadcrumb navigation functional
- ✅ All interactive elements responsive
- ✅ HRMS badges consistently styled
- ✅ Clean, professional design
- ✅ No console errors
- ✅ Builds successfully

---

## 📝 TESTING CHECKLIST

- [ ] Navigate from Team Performance to member detail
- [ ] Verify breadcrumb shows "Team › Sarah Chen"
- [ ] Check profile header displays all information
- [ ] Verify 6 performance metrics show correct data
- [ ] Confirm HRMS section shows 2 leads with contexts
- [ ] Check deals table shows 5 deals (2 with HRMS badge)
- [ ] Verify contacts table shows 5 contacts (2 with HRMS badge)
- [ ] Check activity feed shows 5 activities with icons
- [ ] Verify coaching notes show 3 notes
- [ ] Test "+ Add Note" functionality
- [ ] Switch roles and verify visibility changes
- [ ] Test all clickable elements
- [ ] Verify responsive design
- [ ] Check color consistency
- [ ] Confirm no console errors

---

**Implementation Date:** December 25, 2024
**Status:** ✅ Complete
**Route:** `/team/:id` (Example: `/team/2`)
