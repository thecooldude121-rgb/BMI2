# Screen 9.2 - Navigation Quick Guide
**Visual Reference for All Navigation Paths**

---

## 🗺️ NAVIGATION MAP

```
┌─────────────────────────────────────────────────────────────┐
│                    SCREEN 9.2                                │
│              Team Member Detail Page                         │
│                 (Sarah Chen)                                 │
└─────────────────────────────────────────────────────────────┘
                          ▲  │
                          │  │
        ┌─────────────────┘  └─────────────────┐
        │                                       │
   INCOMING                                OUTGOING
        │                                       │
        ▼                                       ▼

┌─────────────────────┐              ┌─────────────────────┐
│   FROM THESE PAGES  │              │   TO THESE PAGES    │
└─────────────────────┘              └─────────────────────┘

✅ Team List (9.1)                   ✅ Team List (9.1)
   Click member name                    Click [Team] breadcrumb

✅ Deal Detail (5.2) NEW!             ✅ Manager Profile (9.2)
   Click owner card                     Click manager name

✅ Manager Link (9.2)                 ✅ Deals List (5.1)
   Click "Reports to"                   Click [View All →]

✅ Direct URL                         ✅ Deal Detail (5.2)
   /team/:id                            Click deal name

⚠️ Contact Detail (3.2)               ✅ Contacts List (3.1)
   (Not shown in UI)                    Click [View All →]

⚠️ Activity Feed (6.1)                ✅ Contact Detail (3.2)
   (Not shown in UI)                    Click contact name

                                      ✅ Account Detail (4.2)
                                         Click company name

                                      ✅ Activity Feed (6.1)
                                         Click [View All →]

                                      ✅ HRMS Dashboard
                                         Click [View in HRMS]

                                      ✅ Lead Detail (2.2)
                                         Click [View Lead]

                                      ✅ Calendar (13.1)
                                         Click [View Calendar]
```

---

## 🎯 MOST COMMON FLOWS

### 1. Team → Member → Back
```
Team List → Sarah Chen → [Team] → Team List
```

### 2. Deal → Owner → Team
```
Deal Detail → Click Owner Card → Team Profile
```
**NEW!** This is the newly implemented navigation path.

### 3. Member → Deal → Owner (Circular)
```
Sarah's Profile → Deal → Owner: Sarah → Sarah's Profile
```

### 4. Member → Manager → Team
```
Sarah Chen → Reports to: John Smith → John's Profile
```

---

## 📍 WHERE TO CLICK

### On Screen 9.2 (Outgoing)

**Header Area:**
```
[Team] > Sarah Chen        ← Click [Team] to go back
```

**Profile Section:**
```
Reports to: [John Smith]   ← Click name for manager profile
```

**Action Buttons:**
```
[Schedule 1-on-1]  [View Calendar]  [Send Email]
                    ↑ Click for calendar
```

**Sections:**
```
Assigned Deals (12 active)  [View All →]
├─ DataFlow Inc - $120K     ← Click deal name
├─ TechCorp - $85K          ← Click deal name
└─ ...

Assigned Contacts (24)      [View All →]
├─ Michael Torres           ← Click contact name
│  @ DataFlow Inc           ← Click company name
└─ ...

Recent Activity (47)        [View All →]
├─ Call with Michael...
└─ ...
```

**HRMS Section:**
```
[View in HRMS System]       ← Click for HRMS dashboard
[View Lead Details]         ← Click for lead detail
```

---

### On Deal Detail Page (Incoming - NEW!)

**Hero Section:**
```
┌─────────────────────────────────────────────────┐
│  Acme Corp - Enterprise Plan      [Edit] [...]  │
│  $50,000 • Proposal                              │
├─────────────────────────────────────────────────┤
│  ┌────────┐  ┌────────┐  ┌──────────────────┐  │
│  │$50,000 │  │Mar 15  │  │ Alex Rodriguez  │←─┤─ Click here!
│  │ Amount │  │ Close  │  │     Owner        │  │
│  └────────┘  └────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────┘
                              ↓
                    Goes to /team/3
                    (Alex's Profile)
```

**Visual Cues:**
- Purple gradient card
- Hover: Darker purple
- Cursor: Pointer
- Name underlines on hover
- Tooltip: "View team member profile"

---

## 🧪 QUICK TESTS

### Test 1: Deal → Team (2 minutes)
1. Go to `/deals/1`
2. Find purple "Owner" card
3. Hover - should see darker purple
4. Click - should go to team profile

### Test 2: Circular Navigation (3 minutes)
1. Start at `/team/2` (Sarah)
2. Click any deal
3. Click owner (if Sarah)
4. Should return to `/team/2`

### Test 3: All Outgoing (5 minutes)
On `/team/2`, click each:
- [Team] breadcrumb
- Manager name
- [View All →] for deals
- A deal name
- [View All →] for contacts
- A contact name
- A company name
- [View All →] for activities
- [View in HRMS System]
- [View Calendar]

All should navigate correctly.

---

## 🎨 VISUAL INDICATORS

### Clickable Elements on Screen 9.2

| Element | Visual Cue | Action |
|---------|-----------|---------|
| [Team] breadcrumb | Blue, underline on hover | → Team List |
| Manager name | Blue, underline on hover | → Manager Profile |
| Deal name | Blue, underline on hover | → Deal Detail |
| Contact name | Blue, underline on hover | → Contact Detail |
| Company name | Blue, underline on hover | → Account Detail |
| [View All →] | Blue, underline on hover | → List pages |
| Buttons | Colored, hover effect | Various actions |

### NEW! Clickable Owner Card on Deal Detail

| Element | Visual Cue | Action |
|---------|-----------|---------|
| Owner card | Purple gradient | → Team Profile |
| Hover state | Darker purple | Shows clickable |
| Cursor | Pointer | Indicates link |
| Name | Underline on hover | Shows target |
| Tooltip | "View team member..." | Explains action |

---

## 📊 NAVIGATION STATUS

```
INCOMING (To Screen 9.2)
✅ ████████████████ 67%  (4/6 working)

OUTGOING (From Screen 9.2)
✅ ████████████████████████ 100%  (11/11 working)

OVERALL
✅ ██████████████████████ 88%  (15/17 working)
```

---

## 💡 TIPS

### For Users:
- Blue text = Clickable link
- Hover to see if element is clickable
- Use breadcrumbs to navigate back
- [View All →] links go to filtered lists

### For Developers:
- All navigation uses React Router
- Toast notifications on navigation
- Type-safe with TypeScript
- Consistent hover effects
- Optional IDs prevent crashes

---

## 🚀 KEYBOARD SHORTCUTS (Future)

Not yet implemented, but could add:
- `Cmd/Ctrl + ←` - Go back to previous page
- `Cmd/Ctrl + Click` - Open in new tab
- `Esc` - Close modals
- `B` - Back to team list

---

**Status:** ✅ 88% Complete
**Critical Paths:** ✅ 100% Working
**Most Used Paths:** ✅ All Implemented

---

**Last Updated:** December 26, 2024
