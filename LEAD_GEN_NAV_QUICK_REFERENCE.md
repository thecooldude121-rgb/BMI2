# Lead Generation Navigation - Quick Reference

## Navigation Bar Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [Dashboard] [Leads] [Intelligence] [Campaigns] [Analytics]    [Settings ⚙️] │
└────────────────────────────────────────────────────────────────────────────┘
   ↑ Active = Blue background with white text
   ↑ Inactive = Gray text with transparent background
```

## Tab Quick Links

| Tab | Path | Purpose | Key Features |
|-----|------|---------|--------------|
| **Dashboard** | `/lead-generation/dashboard` | Overview & Insights | Stats, AI Insights, Signals, Recent Leads |
| **Leads** | `/lead-generation/leads` | Lead Management | Search, Filter, Bulk Actions, Export |
| **Intelligence** | `/lead-generation/intelligence` | Sales Signals | Company signals, Intent data, Auto-add |
| **Campaigns** | `/lead-generation/campaigns` | Email Campaigns | Campaign management, Performance metrics |
| **Analytics** | `/lead-generation/analytics` | Performance Data | Metrics, Reports, ROI tracking |
| **Settings** | `/lead-generation/settings` | Configuration | Integrations, Preferences, Rules |

## Visual Indicators

### Tab States
- **Active Tab:** Blue (#3b82f6) background + White text + Blue bottom border
- **Inactive Tab:** Gray text + Transparent background
- **Hover:** Light gray background

### Icons
- Settings tab includes a gear icon (⚙️)
- All other tabs are text-only

## Quick Navigation from Dashboard

### Clickable Stats Cards
```
[Total Leads: 450] → Leads page
[New Today: 23] → Leads page (filtered by today)
[HRMS Leads: 45] → Leads page (filtered by HRMS)
[Qualified: 150] → Leads page (filtered by qualified)
[Synced to CRM: 150] → Leads page (filtered by synced)
[Avg Score: 72] → Analytics page
```

### AI Insights Section
```
Company Signals → Intelligence page
HRMS Leads → Leads page (HRMS filter)
Email Performance → Analytics page
Recommended Actions → Leads page (filtered)
```

### Intelligence Highlights
```
Each signal → Intelligence page
[Add to Leads] button → Creates lead + Shows toast
Company name → Company profile page
```

### Recent Leads Table
```
Lead name → Lead detail page
Company name → Lead detail page
Source badge → Leads page (filtered by source)
Score → Lead scoring page
[View] button → Lead detail page
[Sync] button → Syncs to CRM + Shows toast
[Enrich] button → Enriches lead + Shows toast
```

## Page Highlights

### 1. Dashboard Page
- 6 stats cards
- AI Insights with purple gradient
- 5 company signals
- 10 recent leads
- 3 quick action cards

### 2. Leads Page
**NEW PAGE - Complete lead management interface**
- Search bar (name, company, email)
- Filter dropdown (All, New, Contacted, Qualified, HRMS, High Score)
- Bulk selection checkboxes
- Bulk action bar (Send Email, Add to Sequence)
- Full lead table with:
  - Checkbox | Lead | Company | Source | Score | Status | Actions
- Action buttons: Email, Call, View, More
- Pagination (450+ leads)

### 3. Intelligence Page
**NEW PAGE - Sales intelligence dashboard**
- 5 stat cards (Total, Funding, Hiring, HRMS, Launches)
- AI Intelligence Insights panel (blue gradient)
- Search and filter controls
- Signal cards with:
  - Signal type icon and label
  - Company name (clickable)
  - AI score
  - Time ago
  - Source
  - [Add to Leads] or [Auto-added] button
  - [View Details] button
- Filter by signal type
- Pagination (127+ signals)

### 4. Campaigns Page
**NEW PAGE - Campaign management**
- 4 stats cards:
  - Total Campaigns: 5
  - Total Recipients: 1,125
  - Avg Open Rate: 63%
  - Total Replies: 87
- Tab filters: All, Active, Paused, Drafts
- Campaign cards showing:
  - Campaign name and status
  - Type (Email/Sequence)
  - Recipients count
  - Performance metrics (Sent, Opened, Clicked, Replied)
  - Rates (Open %, Click %, Reply %)
  - Action buttons (Play/Pause, Analytics, Settings)
- [New Campaign] button

### 5. Analytics Page
**Existing page - Enhanced with nav integration**

### 6. Settings Page
**Existing page - Enhanced with nav integration**

## Color Scheme

### Lead Generation Brand Colors
- **Primary:** Blue (#3b82f6)
- **Success:** Green (#10b981)
- **Warning:** Orange (#f97316)
- **Info:** Purple (#8b5cf6)

### Signal Type Colors
- 💰 Funding: Green
- 📈 Hiring: Blue
- 🚀 Product Launch: Purple
- 🏢 HRMS Event: Orange
- 🌍 Expansion: Yellow

### Status Colors
- New: Blue
- Contacted: Orange
- Qualified: Green

## Implementation Files

```
src/
├── components/
│   └── LeadGeneration/
│       └── LeadGenNavigation.tsx          [NEW]
└── pages/
    └── LeadGeneration/
        ├── LeadGenerationModule.tsx       [UPDATED]
        ├── LeadGenerationDashboard.tsx    [EXISTING]
        ├── LeadsListPage.tsx              [NEW]
        ├── IntelligencePage.tsx           [NEW]
        ├── CampaignsPage.tsx              [NEW]
        ├── AnalyticsPage.tsx              [EXISTING]
        └── SettingsPage.tsx               [EXISTING]
```

## Test Navigation Flow

### Test 1: Tab Switching
1. Start at Dashboard
2. Click "Leads" → Verify blue highlight + leads page
3. Click "Intelligence" → Verify blue highlight + signals page
4. Click "Campaigns" → Verify blue highlight + campaigns page
5. Click "Analytics" → Verify blue highlight + analytics page
6. Click "Settings" → Verify blue highlight + settings page
7. Click "Dashboard" → Back to overview

### Test 2: Dashboard Navigation
1. Click "Total Leads" stat → Goes to Leads page
2. Click "HRMS Leads" stat → Goes to Leads page filtered by HRMS
3. Click AI Insight recommendation → Goes to filtered leads
4. Click company signal → Goes to Intelligence page
5. Click recent lead name → Goes to lead detail
6. Click source badge → Goes to Leads filtered by source

### Test 3: Deep Linking
1. Paste URL: `/lead-generation/intelligence`
2. Verify Intelligence tab is highlighted
3. Verify correct page content loads

## Key Differences from CRM

| Feature | Lead Gen | CRM |
|---------|----------|-----|
| **Primary Color** | Blue (#3b82f6) | Purple (#667eea) |
| **Tab Count** | 6 tabs | 7 tabs + dropdown |
| **Settings** | Tab with icon | In dropdown menu |
| **Focus** | Lead acquisition | Full sales cycle |
| **Layout** | Horizontal tabs | Horizontal tabs |

## Success Indicators

✅ All 6 tabs visible and clickable
✅ Active tab shows blue background
✅ Settings tab shows gear icon
✅ URL changes on tab click
✅ Page content loads correctly
✅ Back button works correctly
✅ Deep linking works
✅ Dashboard integrations navigate correctly
✅ Build completes successfully

## Quick Access URLs

```bash
/lead-generation/dashboard      # Overview
/lead-generation/leads          # Lead management
/lead-generation/intelligence   # Sales signals
/lead-generation/campaigns      # Email campaigns
/lead-generation/analytics      # Performance
/lead-generation/settings       # Configuration
```

## Notes

- Navigation persists across all Lead Generation pages
- Active state is automatically detected from URL
- All navigation uses React Router (no page reloads)
- Mobile responsive (will adapt for smaller screens)
- Consistent with overall application navigation patterns
