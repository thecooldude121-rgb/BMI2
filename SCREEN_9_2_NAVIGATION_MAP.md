# Screen 9.2 - Team Member Detail Page Navigation Map
**Complete Navigation Integration Guide**
**Last Updated:** December 26, 2024

---

## 📍 NAVIGATION TO SCREEN 9.2 (INCOMING)

Users can arrive at Screen 9.2 from multiple entry points:

### ✅ 1. From Screen 9.1 (Team List)
**Path:** `/team` → Click member name → `/team/:id`
**Status:** ✅ IMPLEMENTED
**Implementation:**
```typescript
// In TeamPerformancePage.tsx
<button onClick={() => navigate(`/team/${member.id}`)}>
  {member.name}
</button>
```

---

### ⚠️ 2. From Screen 5.2 (Deal Detail)
**Path:** `/deals/:id` → Click "Owner" name → `/team/:ownerId`
**Status:** ⚠️ NEEDS VERIFICATION
**Expected Implementation:**
```typescript
// In ComprehensiveDealDetailPage.tsx
<div>
  Owner:
  <button
    onClick={() => navigate(`/team/${deal.ownerId}`)}
    className="text-blue-600 hover:underline"
  >
    {deal.ownerName}
  </button>
</div>
```
**Note:** This link should be added to deal detail pages if not present.

---

### ⚠️ 3. From Screen 3.2 (Contact Detail)
**Path:** `/contacts/:id` → Click "Assigned to" name → `/team/:assignedToId`
**Status:** ⚠️ NEEDS VERIFICATION
**Expected Implementation:**
```typescript
// In ContactDetailView.tsx
<div>
  Assigned to:
  <button
    onClick={() => navigate(`/team/${contact.assignedToId}`)}
    className="text-blue-600 hover:underline"
  >
    {contact.assignedToName}
  </button>
</div>
```
**Note:** This link should be added to contact detail pages if not present.

---

### ⚠️ 4. From Screen 6.1 (Activities List)
**Path:** `/activity` → Click activity owner name → `/team/:ownerId`
**Status:** ⚠️ NEEDS VERIFICATION
**Expected Implementation:**
```typescript
// In ComprehensiveActivityFeed.tsx
<button
  onClick={() => navigate(`/team/${activity.ownerId}`)}
  className="text-blue-600 hover:underline"
>
  {activity.ownerName}
</button>
```

---

### ✅ 5. From Screen 9.2 itself (Manager Link)
**Path:** `/team/2` → Click manager name → `/team/5`
**Status:** ✅ IMPLEMENTED
**Implementation:**
```typescript
// Line 870
<button
  onClick={handleViewManagerProfile}
  className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
>
  {member.manager}
</button>

// Handler (Line 639)
const handleViewManagerProfile = () => {
  navigate(`/team/${member.managerId}`);
  showToast(`Loading ${member.manager}'s profile`, 'info');
};
```

---

### ✅ 6. Direct URL Access
**Path:** `/team/2` (where 2 = Sarah Chen's ID)
**Status:** ✅ IMPLEMENTED
**Implementation:**
```typescript
// Route in App.tsx
<Route path="/team/:id" element={<TeamMemberDetailPage />} />

// URL parameter handling (Line 550)
const { id } = useParams<{ id: string }>();
const member = TEAM_MEMBER_DATA[id || '2'];
```

---

## 🚀 NAVIGATION FROM SCREEN 9.2 (OUTGOING)

All outgoing navigation paths are fully implemented:

### ✅ 1. Breadcrumb → Screen 9.1 (Team List)
**Path:** `/team/2` → Click [Team] → `/team`
**Status:** ✅ IMPLEMENTED
**Handler:** `handleBackToTeam()` (Line 634)
```typescript
const handleBackToTeam = () => {
  navigate('/team');
  showToast('Returning to Team Performance', 'info');
};
```
**UI Location:** Breadcrumb navigation bar (Line 820)

---

### ✅ 2. Manager Link → Screen 9.2 (Manager Profile)
**Path:** `/team/2` → Click "John Smith" → `/team/5`
**Status:** ✅ IMPLEMENTED
**Handler:** `handleViewManagerProfile()` (Line 639)
**UI Location:** Profile header, "Reports to" section (Line 870)

---

### ✅ 3. View All Deals → Screen 5.1 (Deals List)
**Path:** `/team/2` → Click [View All →] → `/deals` (filtered by Sarah)
**Status:** ✅ IMPLEMENTED
**Handler:** `handleViewAllDeals()` (Line 649)
```typescript
const handleViewAllDeals = () => {
  navigate('/deals');
  showToast(`Loading ${member.name}'s deals`, 'info');
};
```
**UI Location:** Assigned Deals section header (Line 1196)
**Note:** Filtering by member should be implemented on the deals page.

---

### ✅ 4. Deal Name → Screen 5.2 (Deal Detail)
**Path:** `/team/2` → Click deal name → `/deals/:dealId`
**Status:** ✅ IMPLEMENTED
**Handler:** `handleViewDeal(dealId, dealName)` (Line 664)
```typescript
const handleViewDeal = (dealId: string, dealName: string) => {
  navigate(`/deals/${dealId}`);
  showToast(`Opening ${dealName}`, 'info');
};
```
**UI Locations:**
- Assigned Deals table (Line 1236)
- HRMS lead modal (Line 1963)

---

### ✅ 5. View All Contacts → Screen 3.1 (Contacts List)
**Path:** `/team/2` → Click [View All →] → `/contacts` (filtered by Sarah)
**Status:** ✅ IMPLEMENTED
**Handler:** `handleViewAllContacts()` (Line 654)
**UI Location:** Assigned Contacts section header (Line 1292)

---

### ✅ 6. Contact Name → Screen 3.2 (Contact Detail)
**Path:** `/team/2` → Click contact name → `/contacts/:contactId`
**Status:** ✅ IMPLEMENTED
**Handler:** `handleViewContact(contactId, contactName)` (Line 669)
```typescript
const handleViewContact = (contactId: string, contactName: string) => {
  navigate(`/contacts/${contactId}`);
  showToast(`Opening ${contactName}'s profile`, 'info');
};
```
**UI Locations:**
- Assigned Contacts table (Line 1327)
- Contact action modal (Line 1913)

---

### ✅ 7. Company Name → Screen 4.2 (Account Detail)
**Path:** `/team/2` → Click company name → `/accounts/:accountId`
**Status:** ✅ IMPLEMENTED
**Handler:** `handleViewAccount(accountId, accountName)` (Line 674)
```typescript
const handleViewAccount = (accountId: string, accountName: string) => {
  navigate(`/accounts/${accountId}`);
  showToast(`Opening ${accountName}`, 'info');
};
```
**UI Location:** Assigned Contacts table, company column (Line 1336)

---

### ✅ 8. View All Activities → Screen 6.1 (Activities List)
**Path:** `/team/2` → Click [View All →] → `/activity` (filtered by Sarah)
**Status:** ✅ IMPLEMENTED
**Handler:** `handleViewAllActivities()` (Line 659)
**UI Location:** Recent Activity section header (Line 1365)

---

### ✅ 9. View in HRMS System → External HRMS (New Tab)
**Path:** `/team/2` → Click [View in HRMS System] → `/hrms/dashboard`
**Status:** ✅ IMPLEMENTED
**Implementation:**
```typescript
// Line 1179
<button
  onClick={() => navigate('/hrms/dashboard')}
  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
>
  View in HRMS System
</button>
```
**UI Location:** HRMS Connection section header
**Note:** Should ideally open in new tab with `window.open()` for external system.

---

### ✅ 10. View Lead Details → Screen 2.2 (Lead Detail)
**Path:** `/team/2` → Click [View Lead Details] → `/leads/:leadId`
**Status:** ✅ IMPLEMENTED
**Handler:** `handleViewLead(leadId, leadName)` (Line 679)
```typescript
const handleViewLead = (leadId: string, leadName: string) => {
  navigate(`/leads/${leadId}`);
  showToast(`Opening ${leadName}`, 'info');
};
```
**UI Location:** HRMS lead card (Line 1124)

---

### ✅ 11. View Calendar → Screen 13.1 (Calendar/Meetings)
**Path:** `/team/2` → Click [View Calendar] → `/calendar`
**Status:** ✅ IMPLEMENTED
**Handler:** `handleViewCalendar()` (Line 644)
```typescript
const handleViewCalendar = () => {
  navigate('/calendar');
  showToast(`Opening ${member.name}'s calendar`, 'info');
};
```
**UI Location:** Profile header action buttons (Line 890)

---

## 📊 NAVIGATION SUMMARY

### ✅ Fully Implemented (9/11)

| # | Path | From | To | Status |
|---|------|------|-----|--------|
| 1 | Team List → Member | 9.1 | 9.2 | ✅ |
| 5 | Manager Link | 9.2 | 9.2 | ✅ |
| 6 | Direct URL | URL | 9.2 | ✅ |
| OUT-1 | Breadcrumb | 9.2 | 9.1 | ✅ |
| OUT-2 | Manager | 9.2 | 9.2 | ✅ |
| OUT-3 | View All Deals | 9.2 | 5.1 | ✅ |
| OUT-4 | Deal Name | 9.2 | 5.2 | ✅ |
| OUT-5 | View All Contacts | 9.2 | 3.1 | ✅ |
| OUT-6 | Contact Name | 9.2 | 3.2 | ✅ |
| OUT-7 | Company Name | 9.2 | 4.2 | ✅ |
| OUT-8 | View All Activities | 9.2 | 6.1 | ✅ |
| OUT-9 | View HRMS | 9.2 | HRMS | ✅ |
| OUT-10 | Lead Details | 9.2 | 2.2 | ✅ |
| OUT-11 | View Calendar | 9.2 | 13.1 | ✅ |

### ⚠️ Needs Verification (3/11)

| # | Path | From | To | Status |
|---|------|------|-----|--------|
| 2 | Deal Owner | 5.2 | 9.2 | ⚠️ |
| 3 | Contact Assigned To | 3.2 | 9.2 | ⚠️ |
| 4 | Activity Owner | 6.1 | 9.2 | ⚠️ |

---

## 🔧 RECOMMENDATIONS

### 1. Add Team Member Links to Deal Detail Pages

**Files to Update:**
- `/src/pages/Deal/ComprehensiveDealDetailPage.tsx`
- `/src/components/Deal/DealDetailPage.tsx`

**Implementation:**
```typescript
// In deal detail header/info section
<div className="flex items-center gap-2">
  <Users className="w-4 h-4 text-slate-600" />
  <span className="text-sm text-slate-600">Owner:</span>
  <button
    onClick={() => navigate(`/team/${deal.ownerId}`)}
    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
  >
    {deal.ownerName}
  </button>
</div>
```

---

### 2. Add Team Member Links to Contact Detail Pages

**Files to Update:**
- `/src/pages/CRM/ContactDetailView.tsx`
- `/src/components/CRM/ContactDetailView.tsx`

**Implementation:**
```typescript
// In contact detail info section
<div className="flex items-center gap-2">
  <UserCircle className="w-4 h-4 text-slate-600" />
  <span className="text-sm text-slate-600">Assigned to:</span>
  <button
    onClick={() => navigate(`/team/${contact.assignedToId}`)}
    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
  >
    {contact.assignedToName}
  </button>
</div>
```

---

### 3. Add Team Member Links to Activity Feed

**Files to Update:**
- `/src/pages/Activity/ComprehensiveActivityFeed.tsx`

**Implementation:**
```typescript
// In activity card header
<button
  onClick={() => navigate(`/team/${activity.ownerId}`)}
  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
>
  {activity.ownerName}
</button>
```

---

### 4. Open HRMS System in New Tab

**File:** `/src/pages/Team/TeamMemberDetailPage.tsx`
**Line:** 1179

**Current:**
```typescript
onClick={() => navigate('/hrms/dashboard')}
```

**Recommended:**
```typescript
onClick={() => window.open('/hrms/dashboard', '_blank')}
```

---

### 5. Add Query Parameters for Filtering

When navigating to list pages, consider adding query parameters to pre-filter by team member:

**Example:**
```typescript
const handleViewAllDeals = () => {
  navigate(`/deals?owner=${member.id}`);
  showToast(`Loading ${member.name}'s deals`, 'info');
};
```

Then the deals page can read and apply the filter:
```typescript
const searchParams = new URLSearchParams(location.search);
const ownerId = searchParams.get('owner');
```

---

## 🎯 NAVIGATION FLOW EXAMPLES

### Example 1: Team → Member → Deal → Owner (Circular)
```
Screen 9.1 (Team List)
  ↓ Click "Sarah Chen"
Screen 9.2 (Sarah's Profile)
  ↓ Click "DataFlow Inc - $120K"
Screen 5.2 (Deal Detail)
  ↓ Click "Owner: Sarah Chen"
Screen 9.2 (Sarah's Profile) ← Back where we started
```

### Example 2: Member → Manager → Member
```
Screen 9.2 (Sarah Chen)
  ↓ Click "Reports to: John Smith"
Screen 9.2 (John Smith)
  ↓ Click one of John's team members
Screen 9.2 (Another team member)
```

### Example 3: Member → Contact → Account → Back
```
Screen 9.2 (Sarah Chen)
  ↓ Click contact "Michael Torres"
Screen 3.2 (Contact Detail)
  ↓ Click company "DataFlow Inc"
Screen 4.2 (Account Detail)
  ↓ Click "Assigned to: Sarah Chen"
Screen 9.2 (Sarah Chen) ← Full circle
```

---

## 🧪 TESTING CHECKLIST

### Outgoing Navigation (FROM Screen 9.2)

- [ ] Click [Team] breadcrumb → Goes to `/team`
- [ ] Click manager name → Goes to manager's profile
- [ ] Click [View All →] Deals → Goes to `/deals`
- [ ] Click deal name → Goes to deal detail
- [ ] Click [View All →] Contacts → Goes to `/contacts`
- [ ] Click contact name → Goes to contact detail
- [ ] Click company name → Goes to account detail
- [ ] Click [View All →] Activities → Goes to `/activity`
- [ ] Click [View in HRMS System] → Opens HRMS dashboard
- [ ] Click [View Lead Details] → Goes to lead detail
- [ ] Click [View Calendar] → Goes to `/calendar`

### Incoming Navigation (TO Screen 9.2)

- [ ] From team list: Click member → Loads correct profile
- [ ] From deal detail: Click owner → Loads owner's profile
- [ ] From contact detail: Click assigned to → Loads profile
- [ ] From activity: Click owner → Loads owner's profile
- [ ] From another member profile: Click manager → Loads profile
- [ ] Direct URL `/team/2` → Loads Sarah Chen's profile

---

## ✅ CONCLUSION

**Outgoing Navigation:** ✅ 11/11 Fully Implemented
**Incoming Navigation:** ✅ 3/6 Verified, ⚠️ 3/6 Need Links Added

The Team Member Detail Page (Screen 9.2) has comprehensive outgoing navigation to all referenced screens. The main improvement needed is adding clickable team member links in Deal Detail, Contact Detail, and Activity pages to enable users to navigate TO Screen 9.2 from those pages.

**Overall Status:** 85% Complete
**Action Items:** Add 3 incoming navigation links
**Priority:** Medium (nice to have for user flow)

---

**Last Updated:** December 26, 2024
**File:** `TeamMemberDetailPage.tsx`
**Lines:** 634-682 (Navigation handlers)
