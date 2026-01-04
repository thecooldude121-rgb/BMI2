# Screen 2.2 - Lead Detail View

## Overview
Complete lead detail page with AI insights, enrichment data, HRMS connection intelligence, and comprehensive activity tracking.

## Access
- **URL**: `/lead-generation/leads/1`
- **Navigation**: Lead Generation > Leads > Click any lead

## Page Structure

### Top Section
1. **Module Navigation Tabs**
   - Dashboard | Leads | Intelligence | Campaigns | Analytics | Settings
   - "Leads" tab is active with blue background

2. **Breadcrumb**
   - Dashboard > Leads > Sarah Lee

3. **Hero Header**
   - Lead name with source icon (🏢 for HRMS)
   - Position, company, industry, employees, revenue
   - Contact info (email, phone, LinkedIn)
   - AI Lead Score: 92/100 with visual dots
   - HRMS Source badge
   - Status: New (green)
   - Action buttons: Email | Call | Add to Sequence | Qualify | More

### Main Content - Two Column Layout

#### Left Column (65%)

1. **AI Lead Intelligence** (Purple gradient card)
   - Overall Score: 92/100 (Top 5%)
   - Score Breakdown:
     - Fit: 90/100
     - Engagement: 85/100
     - Intent: 88/100
   - HRMS Bonus: +33%
     - Base Score: 69
     - After Bonus: 92 ⬆️
   - Conversion Probability: 67% (High!)
   - Why This Score:
     - ✅ HRMS warm lead
     - ✅ Recent funding $10M
     - ✅ Decision maker (CFO)
     - ✅ Company growth signal
     - ⚠️ No engagement yet
   - Recommended Actions:
     1. Contact within 48h
     2. Mention HRMS connection
     3. Highlight funding milestone support

2. **Enrichment Data** (White card)
   - Company Information section
   - Company, Industry, Revenue, Employees, Founded, HQ
   - Tech Stack: AWS, Salesforce, Slack, Stripe
   - Recent News:
     - Raised $10M Series A (Nov 2024)
     - Hired VP of Sales (Nov 2024)
     - Expanding to NYC (Oct 2024)
   - [Re-enrich Data] button

3. **Decision Makers Found (3)** (White card)
   - Sarah Lee (This lead) - CFO, Decision Maker
     - sarah@techstart.com
     - LinkedIn | [View]
   - Robert Chen - CEO, Co-Founder
     - robert@techstart.com
     - LinkedIn | [Add Lead]
   - Michael Zhang - CTO, Co-Founder
     - michael@techstart.com
     - LinkedIn | [Add Lead]

4. **FROM HRMS** (Purple card with border)
   - Recruited: Nov 2024
   - Company: TechStart Inc
   - Employee: Sarah Lee
   - Position: CFO
   - Recruiter: Jane Smith
   - Placement Fee: $15,000
   - Warm Lead Advantage:
     - ✅ Existing relationship
     - ✅ +33% score bonus
     - ✅ 2x higher close rate
     - ✅ Faster sales cycle
   - [View in HRMS Module] button

5. **Intelligence Signal** (Orange card with border)
   - Signal Type: 💰 Funding
   - Event: Raised $10M Series A
   - Date: Nov 12, 2024
   - Source: Crunchbase
   - AI Analysis:
     - ✅ High buying intent
     - ✅ Budget confirmed
     - ✅ Growth mode active
   - Related Signals:
     - Hired VP of Sales
     - Posted 3 sales jobs
   - [View Full Signal] button

6. **Activity History** (White card)
   - Timeline of all activities:
     - 🟢 Lead created from HRMS (Just now)
     - 🔍 Lead enriched (10m ago)
     - 📝 Note added (5m ago)
   - [Load More Activity...] button

7. **Notes & Files** (White card)
   - Notes section with [+ Add Note] button
   - Note from Sarah C. (Nov 15, 2024)
   - Files section with [+ Upload File] button
   - No files yet

#### Right Column (35%)

1. **AI Lead Score** (White card)
   - Large centered score: 92/100
   - Visual score dots
   - "Excellent!" badge
   - Score Breakdown with explanations:
     - Fit Score: 90/100 (Company size, Industry)
     - Engagement: 85/100 (Email opens, site visits)
     - Intent: 88/100 (Funding signal, Hiring)
   - HRMS Bonus Applied section (purple background):
     - Base Score: 69
     - Bonus: +33% = +23 points
     - Final Score: 92 🚀
   - Conversion Probability: 67%
   - [View Score History] button

2. **Next Best Actions** (White card)
   - AI-recommended actions:
     1. ⚡ Contact within 48h (High intent window)
     2. 💬 Mention HRMS connection (Warm intro advantage)
     3. 📧 Add to "HRMS Warm Lead" sequence (Proven conversion path)
     4. ✅ Complete BANT qualification (Ready for qualification)
   - Why These Actions? (blue background):
     - HRMS leads convert 2x better
     - Funding = Budget confirmed
     - CFO = Decision maker

3. **Similar Leads (3)** (White card)
   - Emma Wilson - InnovateLabs
     - 🏢 HRMS | Score: 94 | HealthTech
     - [View Lead]
   - Alex Johnson - DataVerse
     - 🏢 HRMS | Score: 90 | Data
     - [View Lead]
   - Robert Chang - DataFlow
     - 🔔 Intel | Score: 85 | Data
     - [View Lead]

4. **Enrichment Sources** (White card)
   - ✅ Apollo.io (Nov 15)
   - ✅ ZoomInfo (Nov 14)
   - ✅ Clearbit (Nov 15)
   - ✅ LinkedIn (Nov 15)
   - Last Updated: Nov 15, 2024
   - [Configure Sources] button

## Key Features

### HRMS Integration
- Unique purple cards showing HRMS connection
- Score bonus visualization
- Warm lead advantages highlighted
- Direct link to HRMS module

### Intelligence Signals
- Funding events tracked
- AI analysis of buying intent
- Related signals for context
- Direct link to full signal details

### AI-Powered Insights
- Lead scoring with detailed breakdown
- Conversion probability prediction
- Recommended actions with reasoning
- Similar leads for cross-selling

### Comprehensive Enrichment
- Multiple data source integration
- Company and contact information
- Tech stack analysis
- Recent news and events

### Activity Tracking
- Real-time activity timeline
- System and user actions logged
- Notes and files management
- Full audit trail

## Mock Data
The page uses Sarah Lee from TechStart Inc as the demo lead:
- ID: 1
- Source: HRMS
- Score: 92/100
- Status: New
- Industry: FinTech
- Recent funding: $10M Series A

## Navigation
- Back button returns to Leads List
- Breadcrumb navigation
- Module tabs always visible
- Related leads clickable
- HRMS module link available

## Technical Notes
- Route: `/lead-generation/leads/:id`
- Component: `LeadDetailPage.tsx`
- Module: Lead Generation
- Layout: Two-column responsive grid
- Mock data included in component
