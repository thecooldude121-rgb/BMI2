# Lead Detail Page - Integration Points Guide

**Sarah Lee Lead Detail - All Integration Points Mapped**

This guide shows all integration points on the Lead Detail page and how to interact with them.

---

## 1. HRMS Integration (CRITICAL - FRONT AND CENTER)

### Hero Header Section
**Location:** Top of page, below breadcrumb

**HRMS Badge:**
- Purple badge showing "🏢 HRMS Source"
- Click to scroll to HRMS Connection section
- Visual indicator: Purple background with Building icon

**Score Display:**
- Shows "92/100 (Top 5%)"
- Click to open Score History modal
- Displays prominently next to status

### HRMS Connection Section
**Location:** Left column, dedicated purple-bordered section

**Content Displayed:**
- **Recruited:** Nov 2024
- **Position:** CFO
- **Recruiter:** Jane Smith (HRMS team) - **CLICKABLE** → Opens recruiter contact modal
- **Placement Fee:** $15,000 - **CLICKABLE** → Opens fee breakdown modal
- **Warm Lead Advantages:** 4 bullet points with checkmarks

**Actions:**
- "🏢 View in HRMS Module" button → Navigates to HRMS module

**Visual Distinction:**
- Purple background (bg-purple-50)
- Purple border (border-purple-200)
- 🏢 Orange icon throughout
- Section ID: #hrms-section for deep linking

### AI Score Card - HRMS Bonus
**Location:** Right column, AI Lead Score Card

**HRMS Bonus Section:**
- Shows "🏢 HRMS Bonus Applied"
- Base Score: 69
- HRMS Bonus: +23 pts (+33%)
- Final Score: 92/100
- Purple background with border
- Prominently displayed

**Score Impact Visualization:**
- Three progress bars: Fit (90), Engagement (85), Intent (88)
- "Why This Score?" section lists HRMS advantage first
- Conversion probability: 67%

---

## 2. Sales Intelligence Integration

### Intelligence Signal Section
**Location:** Left column, after HRMS section

**Signal Details:**
- **Type:** Funding (with 💰 icon)
- **Event:** "Raised $10M Series A"
- **Date:** Nov 12, 2024
- **Source:** Crunchbase
- **AI Analysis:** 3 bullet points
  - High buying intent (budget confirmed)
  - Growth mode active (scaling team)
  - Sales team expansion (3 sales jobs posted)

**Related Signals:**
- "Related Signals" button → Opens modal with:
  - "Hired VP of Sales" - Oct 2024
  - "Posted 3 sales engineer jobs" - Nov 2024

**Actions:**
- "View Full Signal" button → Navigate to `/lead-generation/intelligence/{id}`
- "Related Signals" button → Opens related signals modal

**Visual Design:**
- Orange to yellow gradient background
- Orange border
- 🎯 Target icon in header

---

## 3. Lead Gen Integration (Apollo.io / ZoomInfo)

### Enrichment Data Section
**Location:** Left column, after AI Insights

**Company Information:**
- Industry: FinTech (Financial Technology)
- Revenue: $8M (from Apollo.io)
- Employees: 45
- Founded: 2019
- Headquarters: San Francisco, CA

**Tech Stack:** (Each clickable for details)
- AWS (Cloud Infrastructure)
- Salesforce (CRM)
- Slack (Team Collaboration)
- Stripe (Payment Processing)

**Recent News:** (Each clickable)
- Raised $10M Series A - Nov 2024 - TechCrunch
- Hired VP of Sales - Oct 2024 - LinkedIn
- Expanding to NYC office - Nov 2024 - Company Blog

**Actions:**
- "Re-enrich Data" button → Fetches latest data from APIs
- Click any tech stack item → See integration opportunity
- Click any news item → Open news detail modal

### Enrichment Sources Panel
**Location:** Right column, bottom

**Data Sources:**
- ✅ Apollo.io - Nov 15, 2024
- ✅ ZoomInfo - Nov 14, 2024
- ✅ Clearbit - Nov 15, 2024
- ✅ LinkedIn - Nov 15, 2024

**Actions:**
- Click any source → Opens enrichment details modal
- "Configure Sources" button → Navigate to settings

### Decision Makers Section
**Location:** Left column, after enrichment data

**3 Key Contacts Found:**
1. **Sarah Lee** - CFO (Current Lead)
2. **Robert Chen** - CEO - "View" + "Add Lead" buttons
3. **Michael Zhang** - CTO - "View" + "Add Lead" buttons

**Actions:**
- "View" → Opens LinkedIn profile
- "Add Lead" → Opens create lead modal for that decision maker

---

## 4. AI Elements

### AI Insights Panel
**Location:** Top of left column

**Visual Design:**
- Large blue-to-purple gradient box
- 🤖 AI INSIGHTS header with Zap icon
- Purple accent throughout

**4 Clickable Recommendations:**
1. ⚡ "Contact within 48h" (HIGH PRIORITY) → Opens email composer
2. 💬 "Mention HRMS connection" (HIGH PRIORITY) → Copies template text
3. 📧 "Add to 'HRMS Warm Lead' email sequence" (MEDIUM) → Opens sequence dropdown
4. ✅ "Complete BANT qualification" (MEDIUM) → Navigate to qualify page

**Interactive:**
- Each card is clickable
- Hover effect: border changes to blue, shadow appears
- Priority badges: RED for high, ORANGE for medium

### AI Lead Score Card
**Location:** Right column, top

**Complete Breakdown:**
- **Overall Score:** 92/100 (5xl bold green text)
- **Rating:** Excellent
- **Percentile:** Top 5%
- **Score History Link:** "View Score History →"

**Three Score Components:**
1. **Fit Score:** 90/100
   - Green progress bar
   - Reason: "Company size matches ICP, Industry = FinTech"

2. **Engagement Score:** 85/100
   - Blue progress bar
   - Reason: "No engagement yet, but high potential"

3. **Intent Score:** 88/100
   - Purple progress bar
   - Reason: "Recent funding $10M, Hiring signals"

**HRMS Bonus Box:**
- Purple background
- Shows calculation: 69 → +23 pts → 92
- "🏢 HRMS Bonus Applied" label

**Why This Score?**
- 5 bullet points explaining factors
- HRMS advantage listed first
- Visual checkmarks and warnings

**Conversion Probability:**
- 67% High conversion chance
- Visual indicator included

---

## 5. Email Sequence Integration

### Quick Action: Add to Sequence
**Location:** Hero header, quick actions bar

**Dropdown Menu:**
- "HRMS Warm Lead Sequence" (recommended)
- "New Customer Outreach"
- "Product Launch Follow-up"
- "Create New Sequence" (creates new)

**Actions:**
- Click any sequence → Adds lead to that sequence
- Activity timeline will log the addition
- Future emails from sequence will appear in timeline

**Visual:**
- Purple button with Plus icon
- ChevronDown indicates dropdown
- Purple accent matches AI/HRMS theme

---

## 6. CRM Sync Integration

### More Actions Dropdown
**Location:** Hero header, rightmost button

**CRM Integration Options:**
- **"Sync to CRM Now"** → Syncs data to CRM immediately
- **"Convert to Contact"** → Creates CRM contact (navigates to `/crm/contacts/new`)

**Other Actions in Dropdown:**
- Edit Lead
- Assign to User
- Change Status
- Mark as Disqualified
- Export Lead Data
- Delete Lead (red, bottom of menu)

**Feedback:**
- Alert messages confirm actions
- BANT qualification recommended before sync
- Once synced, CRM deal data will appear on page

---

## 7. Activity Tracking

### Activity Timeline
**Location:** Left column, comprehensive timeline

**Event Types Tracked:**

1. **System Actions (Automated):**
   - 👤 Lead created from HRMS event
   - 🔍 Lead enriched automatically (Apollo, ZoomInfo, Clearbit)
   - ⚙️ Score updates
   - 📊 HRMS bonus applied

2. **User Actions:**
   - 📝 Notes added
   - 📞 Calls logged
   - ✉️ Emails sent
   - 📊 Status changes
   - 👥 Assignment changes

3. **Integration Events:**
   - 🏢 HRMS creation
   - 🔔 Intelligence signals detected
   - 📧 Sequence emails sent/opened
   - 💰 Funding events
   - 👔 Hiring signals

**Interactive Features:**
- Click any activity → Expands to show full description
- Each shows: Icon, Title, Description, Time ago, Actor
- "Automated" badge for system actions
- "Load More Activity..." button at bottom

**Visual Design:**
- Left border timeline style
- Expandable cards
- Clear actor attribution
- Relative timestamps

---

## 8. Contact Information & Quick Actions

### Contact Methods (Always Visible)
**Location:** Hero header, below name

**Three Contact Methods:**
1. ✉️ Email: sarah@techstart.com (clickable) → Opens email composer
2. 📞 Phone: +1 555-0456 (clickable) → Opens call logger
3. 🔗 LinkedIn (clickable) → Opens in new tab

**Quick Action Buttons:**
- **Email** (Blue) → Opens email composer with pre-filled template
- **Call** (Green) → Opens call logger
- **Add to Sequence** (Purple) → Opens sequence dropdown
- **Qualify** (Orange) → Navigate to BANT qualification

---

## 9. Additional Features

### Status Management
**Location:** Hero header

**Current Status:**
- Clickable badge showing "New 🟢 ▼"
- Color-coded: Green for New
- Dropdown with options: New, Contacted, Qualified, Lost

### Notes & Files
**Location:** Left column, bottom

**Actions:**
- "Add Note" button → Opens note editor modal
- "Upload File" button → Opens file upload modal
- Yellow sticky-note style for existing notes
- Author and timestamp on each note

### Similar Leads
**Location:** Right column

**3 Similar Leads Displayed:**
- Each shows: Name, Company, Source icon, Score, Industry
- Clickable cards → Navigate to that lead's detail page
- "View All Similar Leads" button at bottom

---

## Color Coding System

**Integration Visual Identity:**
- 🏢 **HRMS:** Purple (#8B5CF6) - Purple backgrounds, borders, badges
- 🔔 **Intelligence:** Orange (#F97316) - Orange to yellow gradients
- 🤖 **AI Elements:** Purple/Blue gradient - Consistent purple accent
- ✉️ **Email:** Blue (#2563EB) - Blue buttons and links
- 📞 **Call:** Green (#16A34A) - Green buttons
- 🎯 **Sequences:** Purple (#9333EA) - Purple buttons

---

## Modal Interactions

**Available Modals:**
1. Email Composer - Pre-filled with HRMS context
2. Call Logger - Log call details
3. Score History - View score changes over time
4. Note Editor - Add notes
5. File Upload - Upload documents
6. News Modal - View news details
7. Related Signals - View all intelligence signals
8. Fee Breakdown - HRMS placement fee details
9. Recruiter Modal - Jane Smith contact info
10. Enrichment Details - Data source details
11. Create Lead Modal - Add new lead for decision maker

---

## Navigation Links

**Outbound Links:**
- `/hrms` - View in HRMS Module
- `/lead-generation/intelligence/{id}` - View full intelligence signal
- `/lead-generation/leads/qualify/{id}` - BANT qualification
- `/lead-generation/sequences/new` - Create new sequence
- `/lead-generation/settings` - Configure enrichment sources
- `/crm/contacts/new` - Convert to CRM contact

---

## Key Interaction Patterns

### HRMS Integration Flow:
1. See 🏢 HRMS badge in hero
2. Click to scroll to HRMS section
3. View recruiter details (clickable)
4. View placement fee (clickable)
5. See HRMS bonus in score card
6. "View in HRMS Module" to see full details

### Intelligence Signal Flow:
1. View signal in dedicated section
2. Read AI analysis
3. Click "View Full Signal" for details
4. Click "Related Signals" for more context
5. Use signal info in outreach

### Enrichment Flow:
1. View enriched company data
2. Click "Re-enrich Data" to update
3. Click individual data points for details
4. View enrichment sources panel
5. Configure sources in settings

### Lead Scoring Flow:
1. View overall score in hero
2. Click to see score history
3. View detailed breakdown in right panel
4. Understand HRMS bonus impact
5. Read "Why This Score?" explanation
6. Check conversion probability

---

## Testing Checklist

- [ ] HRMS badge visible and clickable
- [ ] Score card shows HRMS bonus
- [ ] HRMS section displays all details
- [ ] Recruiter name is clickable
- [ ] Placement fee is clickable
- [ ] Intelligence signal section visible
- [ ] Related signals button works
- [ ] Enrichment data displayed
- [ ] Tech stack items clickable
- [ ] Recent news items clickable
- [ ] Re-enrich button functional
- [ ] Decision makers section shows 3 contacts
- [ ] Add Lead buttons work
- [ ] AI recommendations are clickable
- [ ] Each recommendation has correct action
- [ ] Add to Sequence dropdown works
- [ ] Sequence options display
- [ ] Sync to CRM option in More menu
- [ ] Convert to Contact option works
- [ ] Activity timeline displays all events
- [ ] Timeline items are expandable
- [ ] All modals open correctly
- [ ] Navigation links work
- [ ] Contact methods are clickable
- [ ] Quick action buttons functional

---

## Summary

The Lead Detail page is a **comprehensive integration hub** that brings together:
- HRMS recruitment data (prominently featured)
- Sales intelligence signals
- Data enrichment from multiple sources
- AI scoring and recommendations
- Email sequence management
- CRM synchronization
- Complete activity tracking

Every integration point is:
- **Visually distinct** with color coding
- **Highly interactive** with clickable elements
- **Well-documented** with clear labels
- **Action-oriented** with clear next steps
- **Context-aware** based on data source

The HRMS integration is the **star feature** with purple highlighting throughout and multiple touchpoints across the page.
