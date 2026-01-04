# Lead Detail Integration Points - Quick Test Guide

**5-Minute Visual Test for All 7 Integration Points**

Navigate to: `/lead-generation/leads/LEAD-2024-1567` (Sarah Lee)

---

## ✅ Test 1: HRMS Integration (CRITICAL)

### Hero Header Check:
1. Look for **purple badge** showing "🏢 HRMS Source"
2. Click the badge → Should scroll to HRMS section
3. See **Score: 92/100** prominently displayed

### HRMS Section Check:
1. Scroll down to find **purple-bordered section**
2. Verify these details are visible:
   - Recruited: Nov 2024
   - Position: CFO
   - Recruiter: Jane Smith (**click it** → modal opens)
   - Placement Fee: $15,000 (**click it** → breakdown modal)
3. Click "🏢 View in HRMS Module" button
4. See 4 "Warm Lead Advantages" with checkmarks

### HRMS Bonus in Score Card:
1. Look at **right column**, top card
2. Find purple box showing "🏢 HRMS Bonus Applied"
3. Verify calculation:
   - Base Score: 69
   - HRMS Bonus: +23 pts (+33%)
   - Final: 92/100

**✅ PASS CRITERIA:** Purple badge visible, HRMS section prominent, bonus calculation displayed, recruiter and fee are clickable

---

## ✅ Test 2: Sales Intelligence Integration

### Intelligence Signal Section:
1. Find section with **orange to yellow gradient**
2. Verify signal details:
   - 💰 Icon visible
   - Event: "Raised $10M Series A"
   - Date: Nov 12, 2024
   - Source: Crunchbase
3. Read 3 AI Analysis points
4. Click **"View Full Signal"** → Should navigate to intelligence page
5. Click **"Related Signals"** → Modal with 2 related signals opens

**✅ PASS CRITERIA:** Orange gradient section visible, signal details displayed, both buttons functional

---

## ✅ Test 3: Lead Gen Integration (Enrichment)

### Enrichment Data Section:
1. Find section with 🏢 icon showing "ENRICHMENT DATA"
2. Click **"Re-enrich Data"** → Shows "Enriching..." animation
3. See Tech Stack pills:
   - AWS, Salesforce, Slack, Stripe
   - Click any pill → Alert with details
4. See Recent News (3 items):
   - Each has title, date, source
   - Click any news → Modal opens

### Decision Makers:
1. Find "👥 DECISION MAKERS" section
2. Verify 3 contacts listed:
   - Sarah Lee (Current Lead)
   - Robert Chen - Has "Add Lead" button
   - Michael Zhang - Has "Add Lead" button
3. Click **"Add Lead"** on Robert Chen → Modal opens

### Enrichment Sources (Right Column):
1. Find "🔗 ENRICHMENT SOURCES" panel
2. See 4 sources with checkmarks:
   - Apollo.io, ZoomInfo, Clearbit, LinkedIn
3. Click any source → Details modal opens
4. Click "Configure Sources" → Navigate to settings

**✅ PASS CRITERIA:** Tech stack clickable, news items clickable, decision makers show add buttons, sources clickable

---

## ✅ Test 4: AI Elements

### AI Insights Panel:
1. Find **blue-to-purple gradient box** at top of left column
2. Header shows "🤖 AI INSIGHTS"
3. See 4 recommendation cards:
   - Each has emoji, text, priority badge
4. **Click each card:**
   - Card 1 (⚡ Contact 48h) → Opens email composer
   - Card 2 (💬 Mention HRMS) → Copies template text
   - Card 3 (📧 Add to sequence) → Opens sequence dropdown
   - Card 4 (✅ BANT) → Navigate to qualify page

### AI Score Card (Right Column):
1. See large "92/100" in green text
2. Three progress bars with different colors:
   - Fit: 90/100 (green bar)
   - Engagement: 85/100 (blue bar)
   - Intent: 88/100 (purple bar)
3. Each has explanation text below
4. Purple HRMS Bonus box visible
5. "Why This Score?" section with 5 bullets
6. Click "View Score History →" → Modal opens

**✅ PASS CRITERIA:** Purple accent throughout, all 4 AI cards clickable, score breakdown visible, HRMS bonus prominent

---

## ✅ Test 5: Email Sequence Integration

### Add to Sequence Button:
1. Find **purple button** in hero header
2. Says "Add to Sequence" with down arrow
3. Click it → Dropdown opens with 4 options:
   - **"HRMS Warm Lead Sequence"** (at top)
   - "New Customer Outreach"
   - "Product Launch Follow-up"
   - "Create New Sequence" (separated by border)
4. Click "HRMS Warm Lead Sequence" → Alert confirms
5. Check activity timeline → Should log the addition

**✅ PASS CRITERIA:** Purple button visible, dropdown shows HRMS sequence first, clicking adds to sequence

---

## ✅ Test 6: CRM Sync Integration

### More Actions Dropdown:
1. Find **"More"** button in hero header (rightmost)
2. Click it → Dropdown opens
3. Verify these CRM options exist:
   - **"Sync to CRM Now"** (with RefreshCw icon)
   - **"Convert to Contact"** (with Users icon)
4. Click "Sync to CRM Now" → Alert confirms syncing
5. Click "Convert to Contact" → Navigate to CRM contact form

### Other Actions Available:
- Edit Lead
- Assign to User
- Change Status
- Mark as Disqualified
- Export Lead Data
- Delete Lead (red, at bottom)

**✅ PASS CRITERIA:** More dropdown contains sync and convert options, clicking triggers appropriate action

---

## ✅ Test 7: Activity Tracking

### Activity Timeline:
1. Find "📋 ACTIVITY TIMELINE" section
2. See 3 activity entries:
   - 👤 Lead created from HRMS event
   - 🔍 Lead enriched automatically
   - 📝 Note added by Sarah C.
3. **Click each activity** → Expands to show description
4. Verify each shows:
   - Icon
   - Title
   - Time ago
   - Actor name
   - "Automated" badge for system actions
5. Click "Load More Activity..." button

### What Timeline Should Track:
- Lead creation (HRMS)
- Enrichment events (Apollo, ZoomInfo)
- Score updates
- User notes
- Status changes
- Emails sent
- Calls logged
- Sequence additions
- Intelligence signals

**✅ PASS CRITERIA:** Timeline shows HRMS creation, enrichment, expandable cards, clear attribution

---

## Additional Quick Checks

### Contact Methods (Hero):
- [ ] Email link clickable → Opens email composer
- [ ] Phone link clickable → Opens call logger
- [ ] LinkedIn link clickable → Opens in new tab

### Quick Action Buttons (Hero):
- [ ] Email button (blue) → Opens composer
- [ ] Call button (green) → Opens logger
- [ ] Add to Sequence button (purple) → Opens dropdown
- [ ] Qualify button (orange) → Navigate to qualify page

### Status Badge:
- [ ] Shows "New 🟢 ▼" with green background
- [ ] Clickable → Dropdown with 4 status options
- [ ] Changing status shows alert

### Notes & Files:
- [ ] "Add Note" button → Opens note editor modal
- [ ] "Upload File" button → Opens file upload modal
- [ ] Existing notes visible in yellow boxes

### Similar Leads (Right Column):
- [ ] Shows 3 similar leads
- [ ] Each shows: Name, company, source icon, score
- [ ] Each card clickable → Navigate to that lead
- [ ] "View All Similar Leads" button at bottom

---

## Visual Checklist

### Color Coding Verification:
- [ ] Purple used for HRMS (badges, sections, buttons)
- [ ] Orange gradient for Intelligence signals
- [ ] Blue-to-purple gradient for AI elements
- [ ] Blue for email actions
- [ ] Green for call actions
- [ ] Purple for sequences

### Icons Verification:
- [ ] 🏢 for HRMS
- [ ] 🔔/💰 for Intelligence
- [ ] 🤖 for AI
- [ ] 👥 for Decision Makers
- [ ] 📋 for Activity
- [ ] ⭐ for Score

---

## Integration Navigation Test

### Verify These Links Work:
1. "🏢 View in HRMS Module" → `/hrms`
2. "View Full Signal" → `/lead-generation/intelligence/{id}`
3. "Qualify" button → `/lead-generation/leads/qualify/{id}`
4. "Create New Sequence" → `/lead-generation/sequences/new`
5. "Configure Sources" → `/lead-generation/settings`
6. "Convert to Contact" → `/crm/contacts/new`

---

## Modal Test

### Verify These Modals Open:
1. [ ] Email Composer (click Email button)
2. [ ] Call Logger (click Call button)
3. [ ] Score History (click score or "View Score History")
4. [ ] Note Editor (click "Add Note")
5. [ ] File Upload (click "Upload File")
6. [ ] News Modal (click any news item)
7. [ ] Related Signals (click "Related Signals")
8. [ ] Fee Breakdown (click "$15,000")
9. [ ] Recruiter Modal (click "Jane Smith")
10. [ ] Enrichment Details (click any source)
11. [ ] Create Lead Modal (click "Add Lead" on decision maker)

---

## Success Criteria Summary

### HRMS Integration:
✅ Badge visible and clickable
✅ Dedicated purple section
✅ Bonus calculation shown
✅ Link to HRMS module

### Intelligence:
✅ Orange gradient section
✅ Signal details complete
✅ Links to intelligence module

### Enrichment:
✅ Tech stack clickable
✅ News items clickable
✅ Decision makers with actions
✅ Sources panel functional

### AI Elements:
✅ Purple accent throughout
✅ 4 clickable recommendation cards
✅ Complete score breakdown
✅ HRMS bonus highlighted

### Sequences:
✅ Purple button in hero
✅ HRMS sequence listed first
✅ Add to sequence works

### CRM Sync:
✅ Sync option in More menu
✅ Convert option available
✅ Actions trigger correctly

### Activity:
✅ Complete timeline
✅ HRMS events logged
✅ Expandable items
✅ Clear attribution

---

## Test Result

If all 7 integration points pass:
**✅ COMPLETE** - All integration points are functional and well-integrated

The Lead Detail page successfully integrates:
- HRMS recruitment data (prominently featured)
- Sales intelligence signals
- Data enrichment (Apollo, ZoomInfo)
- AI scoring and recommendations
- Email sequences
- CRM synchronization
- Activity tracking

Each integration is visually distinct, highly interactive, and provides clear value to the user.
