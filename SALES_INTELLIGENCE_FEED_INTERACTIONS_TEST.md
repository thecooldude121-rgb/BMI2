# Sales Intelligence Feed - Complete Clickable Interactions Test Guide

**Screen:** 4.1 - Sales Intelligence Feed
**Route:** `/lead-generation/intelligence`
**Last Updated:** January 5, 2026

---

## ✅ TEST CHECKLIST

### 1️⃣ BREADCRUMB NAVIGATION
- [ ] Click "Dashboard" → Navigates to `/lead-generation/dashboard` (Screen 1.1)
- [ ] "Sales Intelligence" text displays as active/current

### 2️⃣ HEADER ACTIONS
- [ ] Click "Configure" button → Navigates to `/lead-generation/settings?section=intelligence` (Screen 9.1)

### 3️⃣ STATS CARDS (All Clickable)

**Total Signals Card:**
- [ ] Click card → Clears all filters
- [ ] Shows all 450 signals
- [ ] Signal type resets to "All"
- [ ] Date range resets to "Last 7 Days"
- [ ] Search query cleared

**New This Week Card:**
- [ ] Click card → Filters to "Last 7 Days"
- [ ] Date range dropdown updates to "Last 7 Days"

**Leads Created Card:**
- [ ] Click card → Navigates to `/lead-generation/leads?source=intelligence`
- [ ] Shows leads filtered by "Source: Intelligence"

**Conversion Rate Card:**
- [ ] Click card → Opens Conversion Funnel Modal
- [ ] Modal shows:
  - Signals Monitored: 450
  - Leads Created: 15 (3.3% conversion)
  - Converted to Contacts: 13 (86.7% conversion)
  - Deals Created: 8 (61.5% conversion)
  - Overall Conversion Rate: 85%
- [ ] Close button works

---

## 4️⃣ FILTER BAR

### Signal Type Filters (Multi-Select Pills)
- [ ] "All" button → Shows all signals (default state)
- [ ] "💰 Funding" button → Filters to funding signals only
- [ ] "📈 Hiring" button → Filters to hiring signals only
- [ ] "🚀 Product" button → Filters to product launch signals only
- [ ] "🌍 Expansion" button → Filters to expansion signals only
- [ ] Active filter highlighted in blue/green/pink/orange
- [ ] Inactive filters show gray background

### Additional Filters

**Date Range Dropdown:**
- [ ] Shows "Last 7 Days" as default
- [ ] Options: Last 7 Days, Last 30 Days, Last Quarter, Custom
- [ ] Selecting "Custom" opens date picker (future enhancement)

**Industry Dropdown:**
- [ ] Shows "All Industries" as default
- [ ] Options: FinTech, HealthTech, SaaS, Manufacturing, E-commerce, Other
- [ ] Filters signals by selected industry

**Company Size Dropdown:**
- [ ] Shows "All Sizes" as default
- [ ] Options: 1-50, 51-200, 201-500, 500+ employees
- [ ] Filters signals by company size

**Search Bar:**
- [ ] Real-time search as you type
- [ ] Searches: company name, event description, keywords
- [ ] Search icon visible on right side

### Sort and View Controls

**Sort Dropdown:**
- [ ] Most Recent (default)
- [ ] Oldest First
- [ ] Highest Score
- [ ] Signal Type

**View Toggle:**
- [ ] 📋 List View (default - card layout)
- [ ] 🔲 Grid View (compact cards)
- [ ] 📊 Table View (data table)

---

## 5️⃣ SIGNAL CARD INTERACTIONS

### Card 1-4: NEW SIGNALS (TechStart, DataFlow, Acme, InnovateLabs)

**Company Name (Blue Link):**
- [ ] Click company name → Opens Company Preview Modal
- [ ] Modal shows:
  - Company details (industry, employees, location, lead score)
  - All signals for this company
  - Current signal highlighted in green
  - Related signals in gray boxes
- [ ] "Close" button works
- [ ] "View Full Details" button → Navigates to Screen 4.2

**Signal Title:**
- [ ] Click title → Navigates to `/lead-generation/intelligence/{signalId}` (Screen 4.2)
- [ ] Shows full intelligence detail view

**Related Signals Link:**
- [ ] Click "Related Signals: →" → Opens Company Preview Modal
- [ ] Shows all signals for the company

**[➕ Add to Leads] Button:**
- [ ] Click button → Opens "Add to Leads" Modal
- [ ] Modal displays:
  - Company info (name, industry, AI score)
  - Decision makers list with checkboxes (all checked by default)
  - "Add to Sequence" dropdown (optional)
  - Sequence options: Cold Outreach, Warm Introduction, Product Demo
- [ ] "Cancel" button closes modal
- [ ] "Create Single Lead" button → Navigates to lead creation with pre-filled data
- [ ] "Create Multiple Leads" button → Creates leads for all selected decision makers
- [ ] After creation → Navigate to Screen 2.2 (Lead Detail View)

**[👁️ View Details] Button:**
- [ ] Click button → Navigates to Screen 4.2 (Intelligence Detail View)

**[🔕 Dismiss] Button:**
- [ ] Click button → Opens "Dismiss Modal"
- [ ] Modal displays:
  - "Why are you dismissing {company}?" prompt
  - Reason dropdown (required):
    - Not Interested
    - Company Too Small
    - Wrong Industry
    - Already Contacted
    - Other
  - Note field (optional)
- [ ] "Cancel" button closes modal
- [ ] "Dismiss Signal" button disabled until reason selected
- [ ] After dismissal → Card marked as dismissed, moved to bottom
- [ ] Confirmation message appears

**[... More] Menu:**
- [ ] Click button → Opens dropdown menu with:
  - ⭐ Add to Watch List
  - 🕐 Set Reminder
  - 📤 Share with Team
  - 🔗 Export Signal
  - ⚠️ Report Inaccurate (red text)
- [ ] Each menu item shows correct icon
- [ ] Menu closes when clicking outside
- [ ] Menu closes when selecting an option

---

### Card 5: CONVERTED SIGNAL (CloudNine Inc)

**Status Badge:**
- [ ] Shows "✅ Converted to Lead"
- [ ] Green text color

**Status Details Box:**
- [ ] Green background (bg-green-50)
- [ ] Shows: "Lead Created: Jessica Park (CEO) - Score: 88/100"
- [ ] Shows: "Added: Nov 8, 2024 by Sarah C."

**[View Lead] Button:**
- [ ] Primary blue button
- [ ] Click button → Navigates to `/lead-generation/leads/{signalId}` (Screen 2.2)
- [ ] Shows Lead Detail View for Jessica Park

**[View Details] Button:**
- [ ] Secondary button with border
- [ ] Click button → Navigates to Screen 4.2 (Intelligence Detail View)

---

### Card 6: DISMISSED SIGNAL (SmallBiz Inc)

**Status Badge:**
- [ ] Shows "❌ Dismissed"
- [ ] Red text color

**Status Details Box:**
- [ ] Red background (bg-red-50)
- [ ] Shows: "Reason: Company too small (below 10 employees)"
- [ ] Shows: "Dismissed by: Mike J. on Nov 1, 2024"

**[Undo Dismiss] Button:**
- [ ] Orange button (bg-orange-600)
- [ ] Click button → Removes dismissed status
- [ ] Card moved back to top as "🟢 New Signal"
- [ ] Confirmation message appears

**[View Details] Button:**
- [ ] Secondary button with border
- [ ] Click button → Navigates to Screen 4.2 (Intelligence Detail View)

---

## 6️⃣ PAGINATION

**Status Text:**
- [ ] Shows "Showing 6 of 450 signals"
- [ ] Updates based on filters applied

**Pagination Controls:**
- [ ] "← Previous" button (disabled on page 1)
- [ ] Page number buttons: 1 (active/blue), 2, 3, ..., 75
- [ ] Active page highlighted in blue
- [ ] "Next →" button (enabled when more pages available)
- [ ] Click page number → Jumps to that page
- [ ] "Load More..." option for infinite scroll (future enhancement)

---

## 7️⃣ MODAL BEHAVIORS

### All Modals:
- [ ] Appear with semi-transparent black backdrop
- [ ] Centered on screen
- [ ] Clickable X close button in top-right
- [ ] Clicking backdrop closes modal
- [ ] ESC key closes modal (future enhancement)

### Add to Leads Modal:
- [ ] Sticky header and footer
- [ ] Scrollable content area
- [ ] Pre-fills company data from signal
- [ ] Decision makers checkboxes functional
- [ ] Sequence dropdown works
- [ ] Button states update correctly

### Dismiss Modal:
- [ ] Reason dropdown required
- [ ] Submit button disabled until reason selected
- [ ] Optional note field works
- [ ] Validation feedback shown

### Company Preview Modal:
- [ ] Displays company information grid
- [ ] Shows all related signals
- [ ] Current signal highlighted
- [ ] Two action buttons work correctly

### Conversion Funnel Modal:
- [ ] Displays full funnel with stages
- [ ] Shows conversion percentages
- [ ] Visual arrows between stages
- [ ] Color-coded stages (blue → green → pink → orange)
- [ ] Overall conversion rate at bottom

---

## 8️⃣ VISUAL STATES

### Hover States:
- [ ] Stats cards show shadow on hover
- [ ] Filter buttons darken on hover
- [ ] Action buttons show hover effect
- [ ] Company name link changes color on hover
- [ ] Signal title link changes color on hover
- [ ] Menu items highlight on hover

### Active States:
- [ ] Selected filter button has solid color background
- [ ] Active page number has blue background
- [ ] Currently viewing signal type highlighted

### Loading States:
- [ ] (Future) Loading spinner while fetching signals
- [ ] (Future) Skeleton cards while loading

### Empty States:
- [ ] (Future) No results message when filters return no signals
- [ ] (Future) Empty state illustration and message

---

## 9️⃣ RESPONSIVE BEHAVIOR

- [ ] Layout adjusts for smaller screens
- [ ] Stats cards stack vertically on mobile
- [ ] Filter dropdowns remain accessible
- [ ] Modals scale appropriately
- [ ] Pagination controls wrap on small screens
- [ ] Signal cards remain readable on mobile

---

## 🔟 DATA ACCURACY

### All 6 Signal Cards Display Correctly:

**Card 1 - TechStart Inc:**
- [ ] Type: 💰 Funding
- [ ] Score: 88/100
- [ ] Status: 🟢 New Signal
- [ ] Time: 2 hours ago
- [ ] Details: $10M Series A, Accel Partners

**Card 2 - DataFlow Inc:**
- [ ] Type: 📈 Hiring
- [ ] Score: 85/100
- [ ] Status: 🟢 New Signal
- [ ] Time: 5 hours ago
- [ ] Decision Makers: Robert Chang, Emma Wilson

**Card 3 - Acme Corp:**
- [ ] Type: 🚀 Product Launch
- [ ] Score: 78/100
- [ ] Status: 🟡 In Review
- [ ] Time: 1 day ago
- [ ] Product: Enterprise Analytics Platform

**Card 4 - InnovateLabs:**
- [ ] Type: 🌍 Expansion
- [ ] Score: 72/100
- [ ] Status: 🟢 New Signal
- [ ] Time: 3 days ago
- [ ] New Office: Austin, TX (2,500 sq ft)

**Card 5 - CloudNine Inc:**
- [ ] Type: 💰 Funding
- [ ] Score: 88/100
- [ ] Status: ✅ Converted to Lead
- [ ] Time: 1 week ago
- [ ] Converted To: Jessica Park (CEO)

**Card 6 - SmallBiz Inc:**
- [ ] Type: 📈 Hiring
- [ ] Score: 45/100
- [ ] Status: ❌ Dismissed
- [ ] Time: 2 weeks ago
- [ ] Dismissed By: Mike J. on Nov 1, 2024

---

## ⚡ QUICK 5-MINUTE TEST

**Essential Flow Test:**

1. **Stats Interaction** (30 seconds)
   - Click Conversion Rate stat → Verify funnel modal opens
   - Close modal → Click Leads Created stat → Verify navigation

2. **Filter Interaction** (45 seconds)
   - Click "Funding" filter → Verify only funding signals show
   - Click "All" → Verify all signals return
   - Type "TechStart" in search → Verify filtering works

3. **Card Actions - New Signal** (60 seconds)
   - Click "Add to Leads" on TechStart → Verify modal opens
   - Check decision makers checkboxes → Close modal
   - Click "TechStart Inc" company name → Verify preview modal
   - Close → Click signal title → Verify detail navigation

4. **Card Actions - Converted** (30 seconds)
   - Find CloudNine card → Click "View Lead" → Verify navigation
   - Go back → Click "View Details" → Verify navigation

5. **Card Actions - Dismissed** (30 seconds)
   - Find SmallBiz card → Click "Undo Dismiss"
   - Verify card moves to top and status changes to New

6. **Dismiss Flow** (60 seconds)
   - Click "Dismiss" on any new signal
   - Select reason: "Not Interested"
   - Add note: "Testing dismiss flow"
   - Click "Dismiss Signal" → Verify confirmation

7. **More Actions Menu** (30 seconds)
   - Click "..." button on any new signal
   - Verify menu opens with 5 options
   - Click outside → Verify menu closes

---

## 🎯 SUCCESS CRITERIA

**All interactions should:**
- ✅ Respond immediately to clicks
- ✅ Navigate to correct routes
- ✅ Open correct modals
- ✅ Display accurate data
- ✅ Show proper visual feedback
- ✅ Handle edge cases gracefully
- ✅ Maintain consistent styling
- ✅ Work across different browsers

---

## 📊 COVERAGE SUMMARY

**Total Clickable Elements:** 50+
- Breadcrumb navigation: 1
- Header actions: 1
- Stats cards: 4
- Filter buttons: 5
- Dropdown filters: 4
- Card actions per signal: 3-5
- Modal interactions: 4 modals × 3 actions each
- Pagination: 8 controls

**Total Test Cases:** 100+

---

## 🐛 KNOWN ISSUES / FUTURE ENHANCEMENTS

- [ ] Custom date range picker not yet implemented
- [ ] Infinite scroll "Load More" not yet implemented
- [ ] ESC key to close modals not yet implemented
- [ ] Grid/Table view switching not yet fully implemented
- [ ] Real-time notifications not yet implemented
- [ ] Keyboard navigation not yet implemented
- [ ] Screen reader support needs testing

---

## ✨ TEST RESULT

**Date Tested:** _____________
**Tester:** _____________
**Pass Rate:** _____ / 100+
**Status:** ⬜ PASS  ⬜ FAIL  ⬜ NEEDS WORK

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
