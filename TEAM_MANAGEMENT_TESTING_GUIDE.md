# Team Management - Quick Testing Guide

## Access Path
**CRM** → Click 3-dot menu (⋮) → **CRM Settings** → Left sidebar → **TEAM MANAGEMENT**

## Quick Test Checklist

### ✅ 1. Header Section (5 seconds)
- [ ] Title displays: "👥 Team Management"
- [ ] Subtitle: "User management, roles, and access control"
- [ ] Three buttons visible: "Add New Team Member", "Import Users", "Export User List"

### ✅ 2. Team Capacity Overview (10 seconds)
- [ ] **Active Members Card**: Shows "10" with "1 inactive, 1 pending"
- [ ] **Available Seats Card**: Shows "8" with "$49/seat/month"
- [ ] **Total Capacity Card**: Shows "20" with "Professional plan"
- [ ] **Last Updated Card**: Shows "2 hours ago" with "Auto-sync enabled"

- [ ] **Plan Details Panel**:
  - Included seats: 20 users
  - Used seats: 12 users (60% utilized)
  - Available seats: 8
  - Monthly cost: $980 (12 seats × $49)
  - "Upgrade Plan" button visible

### ✅ 3. Team Members List (30 seconds)

#### Count Verification
- [ ] Header shows "Current Team Members (12)"
- [ ] Search box present in top-right
- [ ] Three filter dropdowns visible

#### Filter Testing
Test each filter dropdown:

**Role Filter:**
- [ ] All Roles (shows 12)
- [ ] Administrator (shows 1 - John Smith)
- [ ] Sales Manager (shows 1 - Sarah Chen)
- [ ] Sales Representative (shows 4)
- [ ] Account Executive (shows 2)
- [ ] Marketing Manager (shows 2)
- [ ] Customer Success (shows 2)

**Status Filter:**
- [ ] All Status (shows 12)
- [ ] Active (shows 10)
- [ ] Inactive (shows 1 - Jennifer Brown)
- [ ] Pending (shows 1 - Kevin Taylor)
- [ ] Suspended (shows 0)

**Department Filter:**
- [ ] All Departments (shows 12)
- [ ] Sales (shows 6)
- [ ] Marketing (shows 2)
- [ ] Customer Success (shows 2)
- [ ] Executive (shows 1)

#### Search Testing
- [ ] Search "Sarah" → Shows Sarah Chen
- [ ] Search "alex@bmi.com" → Shows Alex Rodriguez
- [ ] Search "manager" → No results (searches name/email only)
- [ ] Clear search → Shows all 12 again

### ✅ 4. Individual User Cards (60 seconds)

#### Test Card 1: John Smith (CEO)
- [ ] **Avatar**: Red gradient with "JS"
- [ ] **Name**: John Smith
- [ ] **Title**: Chief Executive Officer
- [ ] **Employee ID**: EMP-001
- [ ] **Edit and ⋮ buttons** visible

**Contact Info (Left Column):**
- [ ] Email: john.smith@bmi.com
- [ ] Phone: 555-0000
- [ ] Location: San Francisco, CA
- [ ] Timezone: PST (UTC-8)

**Details (Right Column):**
- [ ] Status: ✅ Active (green badge)
- [ ] Role: Administrator
- [ ] Permissions: Full Admin Access
- [ ] Department: Executive

**Reporting Structure:**
- [ ] Manages: 3 direct reports (Sarah Chen, David Park, Lisa Anderson)

**Dates:**
- [ ] Member since: Jan 15, 2024
- [ ] Last login: Dec 27, 2024 at 10:30 AM PST

**Quick Stats (Blue panel):**
- [ ] Active Deals: 5
- [ ] Pipeline: $2.1M
- [ ] Additional: CEO - Full system access

**Action Buttons:**
- [ ] View Profile button (blue)
- [ ] Reset Password button
- [ ] Send Email button

#### Test Card 2: Sarah Chen (Sales Manager)
- [ ] **Avatar**: Blue gradient with "SC"
- [ ] **Manages**: 3 direct reports shown
- [ ] **Reports to**: John Smith
- [ ] **Stats**: 12 deals, $680K, Team Performance: 106% quota

#### Test Card 3: Jennifer Brown (Inactive User)
- [ ] **Avatar**: Gray gradient with "JB"
- [ ] **Status**: ⏸️ Inactive (gray badge)
- [ ] **Last Login**: Nov 30, 2024
- [ ] **Quick Stats**: 0 deals, $0 pipeline
- [ ] **Additional Info**: Account inactive since Dec 1

#### Test Card 4: Kevin Taylor (Pending Invite)
- [ ] **Avatar**: Yellow gradient with "KT"
- [ ] **Status**: ⏳ Pending (yellow badge)
- [ ] **Last Login**: Never
- [ ] **Permissions**: Pending Activation
- [ ] **Additional Info**: Invitation sent Dec 20, awaiting acceptance

### ✅ 5. Multi-Filter Combinations (20 seconds)

Test these combinations:
- [ ] Active + Sales → Shows 5 members
- [ ] Active + Sales Representative → Shows 3 members
- [ ] Inactive + Sales → Shows 1 member (Jennifer Brown)
- [ ] Pending + Sales → Shows 1 member (Kevin Taylor)
- [ ] Active + Marketing → Shows 2 members
- [ ] Active + Customer Success → Shows 2 members

### ✅ 6. Quick Actions Panel (10 seconds)
- [ ] **View Team Performance** → Icon, title, description visible
- [ ] **Configure Role Permissions** → Shows "Phase 2 feature" note
- [ ] **View User Activity Report** → Description about login/usage stats
- [ ] **Audit Log** → Description about user management changes
- [ ] All buttons show hover effect
- [ ] All buttons have right arrow icon

### ✅ 7. User Profiles Spot Check

Verify these specific users are present:

**Sales Department:**
- [ ] Sarah Chen (Sales Manager)
- [ ] Alex Rodriguez (Senior Sales Representative)
- [ ] Emily Davis (Sales Representative)
- [ ] James Wilson (Sales Representative)
- [ ] Mike Johnson (Account Executive)

**Marketing Department:**
- [ ] David Park (Marketing Manager)
- [ ] Rachel Kim (Marketing Specialist)

**Customer Success:**
- [ ] Lisa Anderson (Customer Success Manager)
- [ ] Tom Martinez (Customer Success Specialist)

### ✅ 8. Location & Timezone Verification
- [ ] John Smith: San Francisco, CA - PST
- [ ] Sarah Chen: New York, NY - EST
- [ ] Alex Rodriguez: Austin, TX - CST
- [ ] Emily Davis: Boston, MA - EST
- [ ] Mike Johnson: Chicago, IL - CST
- [ ] David Park: Seattle, WA - PST

### ✅ 9. Reporting Hierarchy
- [ ] John Smith reports to: Nobody (CEO)
- [ ] Sarah Chen reports to: John Smith
- [ ] Alex Rodriguez reports to: Sarah Chen
- [ ] David Park reports to: John Smith
- [ ] Lisa Anderson reports to: John Smith
- [ ] Tom Martinez reports to: Lisa Anderson

### ✅ 10. Count Validation
Final count at bottom of list:
- [ ] "Showing 12 of 12 users" (when no filters applied)
- [ ] Count updates correctly when filters applied

## Performance Metrics Validation

### Expected Pipeline by Team Member:
1. John Smith: $2.1M
2. Sarah Chen: $680K
3. Emily Davis: $520K
4. Alex Rodriguez: $450K
5. James Wilson: $385K
6. Mike Johnson: $320K
7. Lisa Anderson: $150K
8. Tom Martinez: $95K
9. Others: $0 (Marketing/Inactive/Pending)

**Total Team Pipeline**: ~$4.7M

## Color Theme Validation

Each user should have unique gradient:
- Red: John Smith
- Blue: Sarah Chen
- Green: Alex Rodriguez
- Purple: Emily Davis
- Orange: Mike Johnson
- Pink: David Park
- Teal: James Wilson
- Yellow: Rachel Kim
- Cyan: Lisa Anderson
- Indigo: Tom Martinez
- Gray: Jennifer Brown (inactive)
- Yellow: Kevin Taylor (pending)

## Edge Cases to Test

### Empty States (via filters):
- [ ] Role: Suspended → Shows 0 users with "Showing 0 of 12 users"
- [ ] Department: Operations → Shows 0 users
- [ ] Search: "zzz123" → Shows 0 users

### Search Combinations:
- [ ] Search + Filter: "alex" + Sales → Shows Alex Rodriguez
- [ ] Case insensitive: "SARAH" → Shows Sarah Chen
- [ ] Partial email: "@bmi.com" → Shows all 12

## Common Issues to Watch For

❌ **Don't See These Problems:**
- Missing user cards
- Incorrect count in header
- Broken avatar gradients
- Missing status badges
- Incorrect reporting relationships
- Filters not working
- Search not working
- Missing action buttons

✅ **Expected Behavior:**
- All 12 users load immediately
- Filters work instantly
- Search is real-time
- All buttons are clickable (even if not functional yet)
- Hover effects work
- Responsive layout at different screen sizes

## Quick Performance Test

Time these operations:
- Initial page load: < 1 second
- Apply filter: Instant
- Search query: Instant
- Scroll through all users: Smooth

## Mobile Responsive Check

If testing on smaller screens:
- [ ] Cards stack vertically
- [ ] Two-column layouts become single column
- [ ] Filter dropdowns remain accessible
- [ ] Action buttons wrap appropriately
- [ ] Text remains readable

## Success Criteria

All sections display correctly with:
- ✅ 12 total team members
- ✅ 10 active, 1 inactive, 1 pending
- ✅ Accurate department distributions
- ✅ Working search and filters
- ✅ All user details present
- ✅ Proper color coding
- ✅ Correct reporting relationships
- ✅ Quick actions panel visible

## Time to Complete Full Test

**Quick Check**: 2 minutes (just verify all sections render)
**Thorough Test**: 5 minutes (test all filters and verify key data)
**Complete Test**: 10 minutes (check every user card and combination)

## Test Status Report Template

```
TEAM MANAGEMENT - TEST RESULTS
Date: ___________
Tester: ___________

✅ Header Section: PASS / FAIL
✅ Team Capacity: PASS / FAIL
✅ User List: PASS / FAIL (___/12 users shown)
✅ Filters: PASS / FAIL (Role: ___, Status: ___, Dept: ___)
✅ Search: PASS / FAIL
✅ Quick Actions: PASS / FAIL

Issues Found:
1. ___________
2. ___________

Notes:
___________
```
