# Quick Test Guide - All 11 CRM Settings Sections

**Time Required**: 5-10 minutes
**Prerequisites**: Application running locally

---

## How to Test

1. Start the application
2. Navigate to: **CRM → Settings** (or directly to `/crm/settings`)
3. Follow the checklist below

---

## Visual Checklist

### ✅ SECTION 1: ACCOUNT (User Icon)
- [ ] Click "Profile" → See profile settings page
- [ ] Click "Password" → See password change form

### ✅ SECTION 2: PREFERENCES (Palette Icon)
- [ ] Click "Preferences" → See unified preferences page
- [ ] Click "General (Legacy)" → See legacy general settings
- [ ] Click "Display (Legacy)" → See legacy display settings

### ✅ SECTION 3: INTEGRATIONS (Plug Icon)
- [ ] Click "Overview" → See integrations dashboard

### ✅ SECTION 4: NOTIFICATIONS (Bell Icon)
- [ ] Click "All Notifications" → See notification management
- [ ] Click "Email Alerts" → See email alert settings
- [ ] Click "In-App" → See in-app notification settings
- [ ] Click "Slack" → See Slack integration settings

### ✅ SECTION 5: SECURITY (Lock Icon)
- [ ] Click "All Security" → See security overview
- [ ] Click "2FA" → See two-factor auth setup
- [ ] Click "API Keys" → See API key management
- [ ] Click "Sessions" → See active sessions

### ✅ SECTION 6: BILLING (CreditCard Icon)
- [ ] Click "All Billing" → See billing overview
- [ ] Click "Plan" → See subscription plan details
- [ ] Click "Payment" → See payment methods
- [ ] Click "Invoices" → See invoice history

### ✅ SECTION 7: DATA & PRIVACY (Database Icon)
- [ ] Click "All Data & Privacy" → See privacy overview
- [ ] Click "Export" → See data export options
- [ ] Click "Delete" → See account deletion page

### ✅ SECTION 8: EMAIL TEMPLATES (Mail Icon)
- [ ] Click "All Email Templates" → See template library
- [ ] Click "Outreach" → See outreach templates
- [ ] Click "Follow-up" → See follow-up templates

### ✅ SECTION 9: PIPELINE SETTINGS (Target Icon)
- [ ] Click "All Pipeline Settings" → See pipeline overview
- [ ] Click "Deal Stages" → See stage management
- [ ] Click "Probabilities" → See probability settings
- [ ] Click "Win Reasons" → See win/loss reasons

### ✅ SECTION 10: CUSTOM FIELDS (Wrench Icon)
- [ ] Click "All Custom Fields" → See all custom fields
- [ ] Click "Leads" → See lead custom fields
- [ ] Click "Contacts" → See contact custom fields
- [ ] Click "Accounts" → See account custom fields
- [ ] Click "Deals" → See deal custom fields

### ✅ SECTION 11: TEAM MANAGEMENT (Users Icon) **NEW**
- [ ] Click "Team Overview" → See team management page
- [ ] Verify you see:
  - [ ] "Team management features are being built in Module 9" message
  - [ ] 4 coming features listed with icons
  - [ ] Current team: 3 members displayed
    - [ ] Alex Rodriguez (You) - Sales Representative
    - [ ] Sarah Chen - Sales Manager
    - [ ] Mike Johnson - Account Executive
  - [ ] "Manage Team" button (disabled with "Coming Soon" label)
  - [ ] 3 statistics cards at bottom:
    - [ ] Team Members: 3
    - [ ] Roles: 3
    - [ ] Activity: 100%

---

## What to Look For

### Navigation
- ✅ Sidebar sections are clearly labeled with icons
- ✅ Active subsection has blue background
- ✅ Inactive items show hover effect (gray background)
- ✅ Clicking subsections updates main content area

### Layout
- ✅ Left sidebar is sticky and stays visible when scrolling
- ✅ Content area on right displays correctly
- ✅ No layout breaks or overlapping elements

### Team Management Specifics
- ✅ Section appears last in sidebar
- ✅ "Team Overview" button is clickable
- ✅ Page shows placeholder/coming soon state
- ✅ Current team members display with avatars
- ✅ "Manage Team" button is disabled (gray with cursor-not-allowed)
- ✅ Statistics cards use different colors (blue, green, purple)

### Visual Design
- ✅ Icons render properly in all sections
- ✅ Typography is consistent
- ✅ Spacing looks balanced
- ✅ Colors match design system

---

## Expected Total Counts

- **Sections**: 11
- **Subsections**: 34
- **Components**: 35
- **Icons**: 11 (one per section)

---

## Quick Test (30 seconds)

Just want to verify it works? Do this:

1. Go to Settings
2. Click first item in each section (11 clicks)
3. Click Team Management → Team Overview
4. Verify page content loads each time

If all pages load without errors → ✅ **ALL SECTIONS WORKING**

---

## Keyboard Test

- [ ] Press Tab to navigate through sidebar items
- [ ] Press Enter to select a subsection
- [ ] Verify focus indicators are visible

---

## Mobile Test (Optional)

- [ ] Open on mobile device or narrow browser window
- [ ] Verify sidebar adapts to smaller screen
- [ ] Check that content remains readable
- [ ] Test touch interactions

---

## Common Issues to Check

❌ **If you see blank content**: Check browser console for errors
❌ **If navigation doesn't work**: Verify React Router is working
❌ **If styles look broken**: Clear cache and reload
❌ **If Team Management missing**: Verify latest build was used

---

## Success Criteria

✅ All 11 section headers visible in sidebar
✅ All 34 subsections are clickable
✅ Each subsection loads its corresponding page
✅ Team Management displays placeholder content correctly
✅ No console errors
✅ Layout is responsive and clean

---

**If all checks pass → All 11 sections are working correctly!**
