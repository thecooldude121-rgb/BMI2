# Screen 9.2: Team Member Detail - Visual Layout Map

## Quick Navigation
**Access:** Click any member name from Team Performance page
**URL:** `/team/2` (Sarah Chen example)

---

## 📐 COMPLETE LAYOUT STRUCTURE

```
┌──────────────────────────────────────────────────────────────────────┐
│ [ROLE SWITCHER BAR - Testing Only]                                  │
│ Testing View: [Dropdown: CEO|VP|Manager|Rep|Admin|Analyst|Support]  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ BREADCRUMB                                                           │
│ [Team] › Sarah Chen                                                  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ PROFILE HEADER                                                       │
│ ┌────┐                                                               │
│ │ SC │  Sarah Chen                         Status: ✅ Active         │
│ │Blue│  Sales Manager                                               │
│ └────┘  sarah@bmi.com | 555-0001                                    │
│         Reports to: John Smith (Director)                           │
│         Member since: Oct 1, 2024 | Last active: 2 hours ago        │
│                                                                      │
│ [Schedule 1-on-1] [View Calendar] [Send Email]                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 📊 PERFORMANCE METRICS                                               │
├──────────────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│ │💼    │ │🎯    │ │📈    │ │🏆    │ │🎯    │ │⏱️    │            │
│ │Active│ │Total │ │Won   │ │Win   │ │Quota │ │Avg   │            │
│ │Deals │ │Pipe  │ │Deals │ │Rate  │ │Attn  │ │Cycle │            │
│ │  12  │ │$680K │ │  8   │ │ 72%  │ │ 108% │ │45 day│            │
│ │+3 LM │ │+15%  │ │ThisQ │ │Above │ │Target│ │-5 day│            │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘            │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 🏢 HRMS-SOURCED LEADS (Orange gradient background)                   │
│ Sarah benefits from 2 recruitment-powered opportunities              │
├──────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ 1. DataFlow Inc                               $120,000         │  │
│ │    Contact: Emma Wilson (VP Engineering)                       │  │
│ │    Recruited: Oct 15, 2025 | Stage: Qualified                 │  │
│ │    Probability: 65% (+33% bonus) | Close: Jan 30, 2026        │  │
│ │                                                                │  │
│ │    📋 Recruitment Context (Blue background):                   │  │
│ │    Emma Wilson was hired by your company's HR team as a       │  │
│ │    Senior Software Engineer. This creates a warm intro...     │  │
│ │                                                                │  │
│ │    [View Lead Details] [View Deal] [Contact Emma]             │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ 2. BigCo Enterprise                            $95,000         │  │
│ │    Contact: Alex Johnson (CTO)                                 │  │
│ │    Recruited: Sep 22, 2025 | Stage: Proposal                  │  │
│ │    Probability: 70% (+33% bonus) | Close: Feb 15, 2026        │  │
│ │                                                                │  │
│ │    📋 Recruitment Context (Blue background):                   │  │
│ │    Alex Johnson was hired by your company's HR team as a      │  │
│ │    Solutions Architect. Previously CTO at BigCo Enterprise... │  │
│ │                                                                │  │
│ │    [View Lead Details] [View Deal] [Contact Alex]             │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ 💡 HRMS Lead Advantage:                                              │
│ These leads have 33% higher close rate vs cold outreach.            │
│ Total HRMS pipeline: $215,000                                        │
│                                                                      │
│ [View in HRMS System]                                                │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 💼 ASSIGNED DEALS (12 active)                         [View All →]  │
├──────────────────────────────────────────────────────────────────────┤
│ Deal Name             │ Value   │ Stage       │ Prob   │Close Date  │
│ ──────────────────────┼─────────┼─────────────┼────────┼────────────│
│ DataFlow Inc - 🏢     │ $120K   │ Qualified   │ 65%    │Jan 30,'26  │
│ BigCo Enterprise - 🏢 │ $95K    │ Proposal    │ 70%    │Feb 15,'26  │
│ TechVision Corp       │ $85K    │ Negotiation │ 80%    │Dec 31,'25  │
│ CloudStart Solutions  │ $65K    │ Qualified   │ 50%    │Jan 15,'26  │
│ Innovation Labs       │ $110K   │ Proposal    │ 60%    │Feb 1,'26   │
│                                                                      │
│ Showing 5 of 12 deals                                                │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 👥 ASSIGNED CONTACTS (24 contacts)                    [View All →]  │
├──────────────────────────────────────────────────────────────────────┤
│ Contact Name      │ Company          │ Title     │ Last Contact     │
│ ──────────────────┼──────────────────┼───────────┼──────────────────│
│ Emma Wilson - 🏢  │ DataFlow Inc     │ VP Eng    │ 2 days ago       │
│ Alex Johnson - 🏢 │ BigCo Enterprise │ CTO       │ 1 week ago       │
│ Michael Chen      │ TechVision Corp  │ CEO       │ 3 days ago       │
│ Lisa Martinez     │ CloudStart Sol   │ VP Sales  │ 5 days ago       │
│ Robert Kim        │ Innovation Labs  │ Director  │ 1 week ago       │
│                                                                      │
│ Showing 5 of 24 contacts                                             │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 📅 RECENT ACTIVITY                                    [View All →]  │
├──────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ 📞 Call - Emma Wilson (DataFlow Inc)         2 hours ago       │  │
│ │ Discussed pricing options for enterprise plan. Emma is        │  │
│ │ positive about moving forward. Follow-up scheduled.            │  │
│ │ Duration: 35 minutes | Outcome: Positive                       │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ ✉️ Email - Alex Johnson (BigCo Enterprise)    Yesterday       │  │
│ │ Subject: "Updated Proposal - Q1 2026 Implementation"           │  │
│ │ Sent updated proposal with revised timeline. Awaiting response.│  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ 🤝 Meeting - Michael Chen (TechVision)        3 days ago       │  │
│ │ Product demo completed. Client impressed. Moving to            │  │
│ │ negotiation stage. Waiting for legal review.                   │  │
│ │ Duration: 1 hour | Attendees: 4 | Outcome: Excellent           │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ 📋 Task Completed - Follow-up CloudStart      5 days ago       │  │
│ │ Sent follow-up materials after initial discovery call.         │  │
│ │ Scheduled next meeting for Dec 20.                             │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ 📞 Call - Lisa Martinez (CloudStart Sol)     1 week ago        │  │
│ │ Discovery call to understand requirements. Identified 3 key    │  │
│ │ pain points. Good fit for our enterprise solution.             │  │
│ │ Duration: 45 minutes | Outcome: Qualified                      │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ Showing 5 of 47 activities                                           │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ 📝 COACHING NOTES (Manager+ only)                      [+ Add Note]  │
├──────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Dec 10, 2024 | By: John Smith (Director)    [Edit] [Delete]   │  │
│ │ ──────────────────────────────────────────────────────────────  │  │
│ │ Sarah continues to excel with HRMS-sourced leads. Her          │  │
│ │ approach to leveraging warm introductions is exemplary...      │  │
│ │                                                                │  │
│ │ Focus Areas: Scale HRMS strategy, mentor team                  │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Nov 15, 2024 | By: John Smith (Director)    [Edit] [Delete]   │  │
│ │ ──────────────────────────────────────────────────────────────  │  │
│ │ Strong performance this quarter. Win rate 72% exceeds team     │  │
│ │ average of 67%. Excellent at relationship building...          │  │
│ │                                                                │  │
│ │ Focus Areas: Improve qualification process                     │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Oct 5, 2024 | By: John Smith (Director)     [Edit] [Delete]   │  │
│ │ ──────────────────────────────────────────────────────────────  │  │
│ │ First HRMS lead converted successfully (DataFlow Inc). This    │  │
│ │ validates the HRMS integration strategy...                     │  │
│ │                                                                │  │
│ │ Achievement: First HRMS conversion                             │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ Showing 3 of 3 notes                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 KEY VISUAL ELEMENTS

### Color Coding:
- **Blue (#2563EB):** Primary actions, links, performance icons
- **Orange (#EA580C):** HRMS-related items, integration badges
- **Green (#10B981):** Positive trends, success states
- **Slate:** Text hierarchy (darker = more important)
- **Background:** Gradient slate-50 → blue-50 → slate-100

### Section Backgrounds:
- **White Cards:** All main sections
- **Orange Gradient:** HRMS section only
- **Blue Info Boxes:** Recruitment context, insights
- **Slate-50:** Metrics cards, activity cards, note cards

### Icons:
- **Profile:** Mail, Phone, Calendar
- **Metrics:** Briefcase, Target, TrendingUp, Trophy, Clock
- **HRMS:** Building2 (orange)
- **Activities:** Phone, Mail, Video, CheckCircle
- **Notes:** MessageSquare, Edit2, Trash2

### Typography:
- **Headings:** Bold, slate-800
- **Subheadings:** Semibold, slate-700
- **Body:** Regular, slate-600
- **Labels:** Small, slate-500

---

## 🔄 RESPONSIVE BEHAVIOR

### Desktop (1024px+):
- 6-column grid for metrics
- Full tables visible
- Side-by-side layouts where appropriate

### Tablet (768px-1023px):
- 3-column grid for metrics (2 rows)
- Tables scroll horizontally if needed
- Stacked sections

### Mobile (< 768px):
- 2-column grid for metrics (3 rows)
- Tables convert to cards
- All sections stack vertically

---

## 📱 INTERACTION STATES

### Hover States:
- Buttons: Darken background
- Table rows: Light slate background
- Links: Underline + color change
- Cards: Subtle shadow increase

### Active States:
- Buttons: Slightly darker + scale
- Inputs: Blue ring focus state
- Dropdowns: Blue border

### Disabled States:
- Reduced opacity (0.5)
- No hover effects
- Cursor: not-allowed

---

## 🎨 SPACING SYSTEM

### Padding:
- Cards: p-6 (24px)
- Buttons: px-4 py-2 (16px/8px)
- Sections: p-8 (32px page container)
- Small items: p-4 (16px)

### Margins:
- Between sections: mb-6 (24px)
- Between elements: mb-4 (16px)
- Between small items: mb-2 (8px)

### Gaps:
- Grid gaps: gap-4 (16px)
- Flex gaps: gap-2 or gap-3 (8px/12px)

---

## ✅ ACCESSIBILITY

### Semantic HTML:
- Proper heading hierarchy (h1, h2, h3)
- Table elements with proper headers
- Button vs link distinction
- Form labels where needed

### Keyboard Navigation:
- All interactive elements focusable
- Logical tab order
- Visible focus indicators
- Skip links for long content

### Screen Readers:
- Alt text for meaningful icons
- ARIA labels where needed
- Proper role attributes
- Status announcements

---

## 🚀 QUICK TEST SCENARIOS

### Scenario 1: View Full Profile
1. Navigate from team list
2. Verify all 8 sections load
3. Check data accuracy
4. Test role switcher

### Scenario 2: HRMS Integration
1. Switch to Manager role
2. Verify HRMS section visible
3. Check 2 leads displayed
4. Verify badges on deals/contacts
5. Test "View in HRMS" button

### Scenario 3: Coaching Notes
1. Switch to Manager role
2. Click "+ Add Note"
3. Fill in form
4. Verify save/cancel
5. Check edit/delete icons

### Scenario 4: Role-Based Access
1. Switch to Rep role
2. Verify HRMS hidden
3. Verify coaching notes hidden
4. Verify Schedule button hidden
5. Confirm other sections visible

---

**Implementation:** Complete ✅
**Build Status:** Passing ✅
**Route:** `/team/:id`
**Test User:** Sarah Chen (ID: 2)
