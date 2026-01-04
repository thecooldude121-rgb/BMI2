# Lead Discovery Dashboard - Clickable Interactions Guide

## Complete Implementation Summary

All clickable interactions have been implemented on the Lead Discovery Dashboard. This guide shows every interactive element and what happens when clicked.

---

## HEADER ACTIONS

### [+ Import Leads] Button
- **Action**: Navigates to `/lead-generation/import`
- Opens import modal with tabs for Apollo.io, ZoomInfo, CSV, and Manual entry

### [⚙️ Settings] Button
- **Action**: Navigates to `/lead-generation/settings`
- Opens Settings & Integrations page

### [🔍 Search] Icon
- **Action**: Toggles search bar display
- Shows global search input field for leads, companies, and contacts
- Auto-focuses on input when opened
- Press X icon to close

### [🔔 Notifications] Icon
- **Action**: Opens notifications dropdown
- Shows recent activity including:
  - New leads added
  - Company signals detected
  - Email replies received
- Click "View all notifications" to see full list
- Red dot indicator shows unread notifications

### [👤 Profile] Icon
- **Action**: Opens profile menu dropdown
- Menu options:
  - Profile Settings → `/settings/profile`
  - Account Settings → `/settings`
  - Logout

---

## STATS CARDS (All Clickable!)

### Total Leads (450)
- **Click**: Navigate to `/lead-generation/prospects`
- Shows all leads in list view

### New Today (35 +12%)
- **Click**: Navigate to `/lead-generation/prospects?filter=today`
- Filters to show only today's leads

### HRMS Leads (45)
- **Click**: Navigate to `/lead-generation/prospects?source=hrms`
- Filters to show only HRMS-sourced leads
- Highlighted in blue (warm leads!)

### Qualified Leads (180 - 40%)
- **Click**: Navigate to `/lead-generation/prospects?status=qualified`
- Shows only qualified leads ready for sales

### Synced to CRM (150 - 33%)
- **Click**: Navigate to `/lead-generation/prospects?status=synced`
- Shows leads already synced to CRM

### Avg Score (72/100)
- **Click**: Navigate to `/lead-generation/analytics`
- Opens Analytics Dashboard with scoring details

---

## AI INSIGHTS SECTION

### "View Sales Intelligence Feed →"
- **Click**: Navigate to `/lead-generation/signals`
- Opens full Sales Intelligence Feed page (Screen 4.1)

### "View HRMS Leads →"
- **Click**: Navigate to `/lead-generation/prospects?source=hrms`
- Filters prospects page to HRMS source only

### "View Campaign Analytics →"
- **Click**: Navigate to `/lead-generation/analytics`
- Opens Campaign Analytics page (Screen 7.3)

### Recommended Actions (All 3 are clickable!)
1. **"Follow up with 15 leads who opened emails"**
   - **Click**: Navigate to `/lead-generation/prospects?filter=opened_emails`

2. **"Enrich 23 new leads from Apollo.io import"**
   - **Click**: Navigate to `/lead-generation/prospects?needs_enrichment=true`

3. **"Qualify 8 HRMS leads before end of week"**
   - **Click**: Navigate to `/lead-generation/prospects?source=hrms&status=new`

---

## INTELLIGENCE HIGHLIGHTS (Latest Company Signals)

### Signal Title (e.g., "TechStart Inc raised $10M Series A")
- **Click**: Navigate to `/lead-generation/signals/{signal-id}`
- Opens detailed intelligence signal view (Screen 4.2)

### Company Name (e.g., "TechStart Inc")
- **Click**: Opens Company Preview Modal
- Shows quick overview:
  - Company details
  - Recent signals
  - Industry, employees, location
- Button: "View Full Profile" → Navigate to company detail page

### [Add to Leads] Button
- **Click**: Creates new lead from signal
- **Toast**: "Lead created successfully!" ✅
- Button becomes disabled with green checkmark

### [Auto-added] Badge
- **Status**: Already added (disabled state)
- Shows green checkmark icon
- Cannot be clicked

### "View All Signals →"
- **Click**: Navigate to `/lead-generation/signals`
- Opens full Intelligence Feed

---

## RECENT LEADS TABLE

### Lead Name (e.g., "Sarah Lee")
- **Click**: Navigate to `/lead-generation/prospects/{lead-id}`
- Opens Lead Detail View (Screen 2.2)

### Company Name (e.g., "TechStart Inc")
- **Click**: Navigate to `/lead-generation/prospects/{lead-id}`
- Opens same Lead Detail View

### Source Badge (🏢 HRMS, 🎯 Apollo, 🔔 Intent, ✍️ Manual)
- **Click**: Navigate to `/lead-generation/prospects?source={source}`
- Filters prospects list by that source

### Score Badge (e.g., "92")
- **Click**: Navigate to `/lead-generation/scoring/{lead-id}`
- Opens Lead Scoring & Qualification page (Screen 6.1)

### [View] Button
- **Click**: Navigate to `/lead-generation/prospects/{lead-id}`
- Opens Lead Detail View

### Dynamic Action Button (changes based on status):

**For "New" leads:**
- **[Enrich] Button**
- **Click**: Starts enrichment process
- **Toast**: "Lead enrichment started..." → "Lead enriched successfully!" ✅

**For "Contacted" leads:**
- **[Qualify] Button**
- **Click**: Navigate to `/lead-generation/scoring/{lead-id}`
- Opens qualification workflow

**For "Qualified" leads:**
- **[Sync] Button**
- **Click**: Syncs lead to CRM
- **Toast**: "Synced to CRM successfully!" ✅

### [...] Dropdown Menu (More Actions)
- **Click**: Opens action menu with 4 options:

1. **📄 Edit lead**
   - Navigate to `/lead-generation/prospects/{lead-id}/edit`

2. **📧 Add to sequence**
   - Navigate to `/lead-generation/sequences?add={lead-id}`

3. **👤 Assign to user**
   - Shows assignment dialog
   - **Toast**: "Lead assigned" ✅

4. **🗑️ Delete lead** (red text)
   - Deletes the lead
   - **Toast**: "Lead deleted" ✅

### "View All Leads →"
- **Click**: Navigate to `/lead-generation/prospects`
- Opens full prospects list (450 total leads)

---

## QUICK ACTIONS SECTION

### Import Leads Card

**[Apollo.io] Button**
- **Click**: Navigate to `/lead-generation/import/apollo`
- Opens Apollo.io import modal

**[ZoomInfo] Button**
- **Click**: Navigate to `/lead-generation/import/zoominfo`
- Opens ZoomInfo import modal

**[CSV Upload] Button**
- **Click**: Navigate to `/lead-generation/import/csv`
- Opens CSV import wizard

### Add Manual Lead Card

**[Quick Form] Button**
- **Click**: Navigate to `/crm/leads/add`
- Opens Screen 3.1 (Add/Import Leads) with Manual tab active

### Configure Integrations Card

**[Apollo.io] Button**
- **Click**: Navigate to `/integrations?filter=apollo`
- Opens Apollo.io settings page

**[ZoomInfo] Button**
- **Click**: Navigate to `/integrations?filter=zoominfo`
- Opens ZoomInfo settings page

**[CRM Sync] Button**
- **Click**: Navigate to `/integrations?filter=crm`
- Opens CRM sync settings

---

## TOAST NOTIFICATIONS

The dashboard uses toast notifications for user feedback:

- ✅ **Success** (Green):
  - "Lead created successfully!"
  - "Lead enriched successfully!"
  - "Synced to CRM successfully!"
  - "Lead assigned"
  - "Lead deleted"

- ℹ️ **Info** (Blue):
  - "Lead enrichment started..."

---

## DROPDOWN CLOSE BEHAVIOR

All dropdowns close when:
- Clicking outside the dropdown
- Selecting a menu item
- Pressing ESC key (browser default)

---

## NAVIGATION SUMMARY

### Main Navigation Targets:
1. `/lead-generation/prospects` - Lead List View (Screen 2.1)
2. `/lead-generation/prospects/{id}` - Lead Detail View (Screen 2.2)
3. `/lead-generation/signals` - Sales Intelligence Feed (Screen 4.1)
4. `/lead-generation/signals/{id}` - Intelligence Detail View (Screen 4.2)
5. `/lead-generation/scoring/{id}` - Lead Scoring (Screen 6.1)
6. `/lead-generation/analytics` - Analytics Dashboard (Screen 7.1)
7. `/lead-generation/import` - Import Leads Modal
8. `/lead-generation/settings` - Settings & Integrations (Screen 9.1)
9. `/integrations` - Integrations Hub
10. `/crm/leads/add` - Add Lead Form (Screen 3.1)

### Query Parameters for Filtering:
- `?source=hrms` - Filter by HRMS source
- `?source=apollo` - Filter by Apollo source
- `?status=qualified` - Filter by qualified status
- `?status=synced` - Filter by synced status
- `?filter=today` - Filter to today's leads
- `?filter=opened_emails` - Filter to leads who opened emails
- `?needs_enrichment=true` - Filter to leads needing enrichment

---

## TESTING CHECKLIST

To test all interactions:

1. ✅ Click each stat card (6 total)
2. ✅ Click search icon, type query, close
3. ✅ Open notifications dropdown
4. ✅ Open profile menu
5. ✅ Click each AI insight link (3 total)
6. ✅ Click each recommended action (3 total)
7. ✅ Click signal title and company name
8. ✅ Click "Add to Leads" button
9. ✅ Click lead names and company names in table
10. ✅ Click source badges
11. ✅ Click score badges
12. ✅ Click View, Enrich/Qualify/Sync buttons
13. ✅ Open dropdown menu (...) and test all 4 options
14. ✅ Click all Quick Actions buttons (9 total)
15. ✅ Test company preview modal

---

## Implementation Notes

- All interactions use React Router's `useNavigate()` for navigation
- Toast notifications use the `ToastContext` from the app
- Dropdowns auto-close when clicking outside
- Hover states provide visual feedback on all clickable elements
- All buttons have proper transition animations
- Modal overlays have semi-transparent backgrounds
- Search input auto-focuses when opened

**Total Interactive Elements: 50+**
