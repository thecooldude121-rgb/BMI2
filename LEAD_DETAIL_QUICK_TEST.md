# Lead Detail View - Quick Test Guide

## Quick Access
1. Navigate to `/lead-generation/leads/1`
2. Or go to Lead Generation > Leads > Click any lead card

## Visual Verification Checklist

### ✅ Top Navigation (3 seconds)
- [ ] Module tabs visible: Dashboard | Leads | Intelligence | Campaigns | Analytics | Settings
- [ ] "Leads" tab has blue background (active state)
- [ ] Breadcrumb shows: Dashboard > Leads > Sarah Lee

### ✅ Hero Section (5 seconds)
- [ ] 🏢 icon before "Sarah Lee"
- [ ] Title shows: CFO at TechStart Inc
- [ ] Score shows: 92/100 with colored dots
- [ ] HRMS Source badge visible
- [ ] Status: New (green badge)
- [ ] Contact info: email, phone, LinkedIn links
- [ ] 5 action buttons: Email | Call | Add to Sequence | Qualify | More

### ✅ Left Column - Top Section (10 seconds)
- [ ] **AI INSIGHTS** card has purple gradient background
- [ ] Overall Score: 92/100 (Top 5%)
- [ ] Score breakdown shows three categories with dots
- [ ] HRMS Bonus section shows +33%
- [ ] Conversion probability: 67%
- [ ] "Why This Score?" shows 4 checkmarks and 1 warning
- [ ] Recommended Actions lists 3 items

### ✅ Left Column - Middle Sections (15 seconds)
- [ ] **Company Information** card with re-enrich button
- [ ] Shows company details in 2-column grid
- [ ] Tech stack chips: AWS, Salesforce, Slack, Stripe
- [ ] Recent news shows 3 items
- [ ] **Decision Makers Found (3)** card
- [ ] Sarah Lee highlighted with "This lead" badge
- [ ] Other two decision makers have "Add Lead" buttons

### ✅ Left Column - HRMS & Intelligence (10 seconds)
- [ ] **FROM HRMS** card has purple background and border
- [ ] Shows recruited date, employee, recruiter, placement fee
- [ ] "Warm Lead Advantage" section with 4 checkmarks
- [ ] [View in HRMS Module] button
- [ ] **Intelligence Signal** card has orange background
- [ ] Shows 💰 Funding signal
- [ ] AI Analysis lists 3 insights
- [ ] Related Signals shows 2 items

### ✅ Left Column - Bottom Sections (5 seconds)
- [ ] **Activity History** shows timeline with 3 activities
- [ ] Green dots on timeline
- [ ] Timestamps visible (Just now, 10m ago, 5m ago)
- [ ] **Notes & Files** section
- [ ] 1 note visible from Sarah C.
- [ ] Files shows (0) with upload button

### ✅ Right Column - Score Card (10 seconds)
- [ ] **AI Lead Score** shows 92/100 (large centered)
- [ ] Score dots displayed
- [ ] "Excellent!" text
- [ ] Three breakdown scores with explanations
- [ ] Purple HRMS Bonus section
- [ ] Shows calculation: Base 69 + 23 = 92 🚀
- [ ] Conversion Probability: 67%
- [ ] [View Score History] button

### ✅ Right Column - Recommendations (5 seconds)
- [ ] **Next Best Actions** card
- [ ] 4 numbered actions with emoji icons
- [ ] Each has reason in parentheses
- [ ] Blue "Why These Actions?" box with 3 bullet points

### ✅ Right Column - Similar & Sources (5 seconds)
- [ ] **Similar Leads (3)** card
- [ ] 3 leads listed with icons (🏢 or 🔔)
- [ ] Each shows score and [View Lead] link
- [ ] **Enrichment Sources** card
- [ ] 4 sources with checkmarks and dates
- [ ] [Configure Sources] button

## Interactive Tests (2 minutes)

### Click Tests
1. **Back Navigation**
   - [ ] Click back arrow button → returns to leads list

2. **Breadcrumb Navigation**
   - [ ] Click "Dashboard" in breadcrumb → goes to dashboard
   - [ ] Click "Leads" in breadcrumb → goes to leads list

3. **Module Tabs**
   - [ ] Click "Dashboard" tab → navigates to dashboard
   - [ ] Click "Intelligence" tab → navigates to intelligence
   - [ ] Return to leads and click a lead to get back

4. **Action Buttons (Hero)**
   - [ ] Hover over Email button → cursor changes
   - [ ] Hover over Call button → cursor changes
   - [ ] Hover over Qualify button → cursor changes

5. **Re-enrich Data**
   - [ ] Click "Re-enrich Data" button → shows loading spinner
   - [ ] Wait 2 seconds → spinner stops

6. **Similar Leads**
   - [ ] Hover over similar lead cards → background changes

7. **Add Note**
   - [ ] Click "+ Add Note" button → modal should appear (if implemented)

## Quick Smoke Test (30 seconds)
1. Load `/lead-generation/leads/1`
2. Verify page loads without errors
3. Check purple AI INSIGHTS card is visible
4. Check purple FROM HRMS card is visible
5. Check orange Intelligence Signal card is visible
6. Scroll down to verify all sections render
7. Check right column shows score card
8. Click back button to verify navigation works

## Color Verification
- [ ] Purple cards/sections: AI INSIGHTS, FROM HRMS, HRMS Bonus panels
- [ ] Orange card: Intelligence Signal
- [ ] White cards: All other sections
- [ ] Blue elements: Active tab, action buttons, scores
- [ ] Green elements: Status badge, checkmarks, score dots

## Data Verification
- [ ] Lead Name: Sarah Lee
- [ ] Company: TechStart Inc
- [ ] Score: 92/100
- [ ] HRMS Bonus: +33%
- [ ] Conversion: 67%
- [ ] Funding: $10M Series A
- [ ] Decision Makers: 3 people
- [ ] Similar Leads: 3 leads

## Total Test Time
- Visual Check: ~1 minute
- Interactive Tests: ~2 minutes
- **Total: ~3 minutes**

## Pass Criteria
All checkboxes should be checked for the page to be considered complete and working.
