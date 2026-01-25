# Disqualification Modal - Visual Reference

Complete visual guide showing all interactions and states.

---

## 🎨 Modal Layout

```
┌────────────────────────────────────────────────────────────────┐
│  [X] DISQUALIFY LEAD                                      [×]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  [SL]  Sarah Lee                                         │ │
│  │        Chief Financial Officer @ TechStart Inc           │ │
│  │        Email: sarah.lee@techstart.com                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ⚠️ WARNING: High Quality Lead                                │
│  AI Score: 92/100 (Excellent)                                 │
│  BANT Score: 20/20 (Excellent)                                │
│                                                                │
│  Disqualification Reason: *Required                           │
│  [Select reason ▼                                        🔍]  │
│                                                                │
│  Additional Details: Optional                       0/500     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Future Re-engagement: *Required                              │
│  ○ Re-engage in 3 months (Apr 6, 2025)                        │
│  ○ Re-engage in 6 months (Jul 6, 2025)                        │
│  ● Re-engage in 12 months (Jan 6, 2026)                       │
│  ○ Do not contact again                                       │
│                                                                │
│  If re-engagement selected:                                   │
│  ☑ Create calendar reminder                                   │
│  ☑ Add to re-engagement campaign                              │
│  ☑ Monitor for trigger events (funding, hiring, etc.)         │
│                                                                │
│  Notify Team:                                                 │
│  ☑ Send disqualification notification to John Smith           │
│  ☐ CC: Sales Manager                                          │
│  ☐ Add note to Slack #sales channel                           │
│                                                                │
│  IMPORTANT                                                    │
│  • Move lead to "Disqualified" status                         │
│  • Remove from active pipeline                                │
│  • Add to disqualified leads list                             │
│  • Pause all automated sequences                              │
│  • Update lead history with reason                            │
│  You can re-qualify this lead later if needed.                │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  [❌ Confirm Disqualification]            [Cancel]            │
└────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Reason Dropdown (Closed)

```
┌────────────────────────────────────────────────┐
│ [Select reason ▼                          🔍] │
└────────────────────────────────────────────────┘
```

**State:** Closed  
**Color:** Gray border  
**Icon:** Search icon (right)

---

## 2️⃣ Reason Dropdown (Open - No Search)

```
┌────────────────────────────────────────────────┐
│ [Select reason ▼                          🔍] │
├────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐ │
│ │ Type to search...                          │ │
│ ├────────────────────────────────────────────┤ │
│ │ BUDGET ISSUES                              │ │
│ │   No budget available                      │ │
│ │   Budget too small for our solution        │ │
│ │   Budget allocated to competitor           │ │
│ │   Budget frozen/on hold                    │ │
│ │ AUTHORITY ISSUES                           │ │
│ │   Not the decision maker                   │ │
│ │   Cannot reach decision maker              │ │
│ │   Stakeholder turnover                     │ │
│ │ NEED/FIT ISSUES                            │ │
│ │   No immediate business need               │ │
│ │   Poor fit for our product/service         │ │
│ │   Outside our target market                │ │
│ │   Already using competitor (satisfied)     │ │
│ │ ... (more categories)                      │ │
│ └────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

**State:** Open  
**Features:**
- Search input at top
- 8 categories
- 24 total reasons
- Scrollable
- Hover highlight

---

## 3️⃣ Reason Dropdown (Open - With Search)

```
┌────────────────────────────────────────────────┐
│ [Select reason ▼                          🔍] │
├────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐ │
│ │ budget                              🔍     │ │
│ ├────────────────────────────────────────────┤ │
│ │ BUDGET ISSUES                              │ │
│ │   No budget available                      │ │
│ │   Budget too small for our solution        │ │
│ │   Budget allocated to competitor           │ │
│ │   Budget frozen/on hold                    │ │
│ └────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

**State:** Filtered  
**Search:** "budget"  
**Results:** 4 matching reasons  
**Categories:** Only shows categories with matches

---

## 4️⃣ Reason Dropdown (No Results)

```
┌────────────────────────────────────────────────┐
│ [Select reason ▼                          🔍] │
├────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐ │
│ │ xyz123                              🔍     │ │
│ ├────────────────────────────────────────────┤ │
│ │                                            │ │
│ │    No reasons found matching "xyz123"      │ │
│ │                                            │ │
│ └────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

**State:** Empty  
**Search:** "xyz123"  
**Results:** 0 matches  
**Display:** Centered empty state message

---

## 5️⃣ Character Counter States

**Empty (0 chars):**
```
Additional Details: Optional                       0/500
┌──────────────────────────────────────────────────────┐
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Partial (250 chars):**
```
Additional Details: Optional                     250/500
┌──────────────────────────────────────────────────────┐
│ Bootstrap startup with no funding...                 │
└──────────────────────────────────────────────────────┘
```

**At Limit (500 chars):**
```
Additional Details: Optional                     500/500  <-- RED
┌──────────────────────────────────────────────────────┐
│ Bootstrap startup with no funding. No budget allo... │
└──────────────────────────────────────────────────────┘
```

**Color Changes:**
- 0-499 chars: Gray text
- 500 chars: Red text + bold

---

## 6️⃣ Competitor Field (Hidden)

**Reason:** "No budget available"

```
(Competitor field not shown)
```

---

## 7️⃣ Competitor Field (Visible)

**Reason:** "Lost deal to competitor"

```
Competitor (if applicable):
┌────────────────────────────────────────────────┐
│ [Select competitor ▼]                          │
└────────────────────────────────────────────────┘

Options:
  - Workday
  - Oracle Financials
  - SAP
  - NetSuite
  - Salesforce
  - HubSpot
  - Zoho
  - Other (specify)
```

---

## 8️⃣ Re-engagement Options (Normal)

```
Future Re-engagement: *Required

○ Re-engage in 3 months (Apr 6, 2025)
○ Re-engage in 6 months (Jul 6, 2025)
● Re-engage in 12 months (Jan 6, 2026)
○ Do not contact again
```

**Selected:** 12 months  
**Date:** Jan 6, 2026

---

## 9️⃣ Re-engagement Options (Do Not Contact)

```
Future Re-engagement: *Required

○ Re-engage in 3 months (Apr 6, 2025)
○ Re-engage in 6 months (Jul 6, 2025)
○ Re-engage in 12 months (Jan 6, 2026)
● Do not contact again

┌────────────────────────────────────────────────────┐
│ ⚠️ Lead will be permanently marked as do-not-con.. │
└────────────────────────────────────────────────────┘
                    RED WARNING
```

**Selected:** Do not contact  
**Warning:** Red background with alert icon

---

## 🔟 Re-engagement Actions (Enabled)

**When:** 3/6/12 months selected

```
If re-engagement selected:
┌────────────────────────────────────────────────────┐
│ ☑ Create calendar reminder                        │
│ ☑ Add to re-engagement campaign                   │
│ ☑ Monitor for trigger events (funding, hiring...) │
└────────────────────────────────────────────────────┘
                BLUE BACKGROUND
```

**State:** All enabled  
**Default:** All checked  
**Color:** Blue background

---

## 1️⃣1️⃣ Re-engagement Actions (Disabled)

**When:** "Do not contact" selected

```
(Blue panel hidden - no checkboxes shown)
```

**State:** Completely hidden  
**Reason:** Not applicable for "never"

---

## 1️⃣2️⃣ Notification Options

```
Notify Team:
☑ Send disqualification notification to John Smith
☐ CC: Sales Manager
☐ Add note to Slack #sales channel
```

**Defaults:**
- Owner notification: ✅ Checked
- CC Manager: ❌ Unchecked
- Slack: ❌ Unchecked

---

## 1️⃣3️⃣ Validation Error

**Missing Reason:**

```
Disqualification Reason: *Required
┌────────────────────────────────────────────────┐
│ [Select reason ▼                          🔍] │  <-- RED BORDER
└────────────────────────────────────────────────┘
⚠️ Please select a disqualification reason         <-- RED TEXT
```

**Error State:**
- Red border on field
- Error icon + message below

---

## 1️⃣4️⃣ Confirmation Dialog

```
┌──────────────────────────────────────────────┐
│ CONFIRM DISQUALIFICATION                     │
├──────────────────────────────────────────────┤
│                                              │
│ Are you sure you want to disqualify         │
│ Sarah Lee?                                   │
│                                              │
│ Reason: No budget available                  │
│ Re-engage: 12 months (Jan 6, 2026)           │
│                                              │
├──────────────────────────────────────────────┤
│ [Yes, Disqualify]          [Cancel]          │
└──────────────────────────────────────────────┘
```

**Overlay:** Dark background (60% opacity)  
**Position:** Centered  
**Z-index:** 60 (above main modal)

---

## 1️⃣5️⃣ Discard Changes Dialog

```
┌──────────────────────────────────────────────┐
│ Discard Changes?                             │
├──────────────────────────────────────────────┤
│                                              │
│ You have unsaved changes. Are you sure you  │
│ want to close this modal without saving?    │
│                                              │
├──────────────────────────────────────────────┤
│ [Discard Changes]      [Keep Editing]        │
└──────────────────────────────────────────────┘
```

**Overlay:** Dark background (60% opacity)  
**Position:** Centered  
**Z-index:** 60 (above main modal)

---

## 🎯 Color Legend

**Borders:**
- Default: Gray (`border-gray-300`)
- Error: Red (`border-red-300`)
- Focus: Red ring (`ring-red-500`)

**Backgrounds:**
- Lead info: Gray (`bg-gray-50`)
- High quality warning: Amber (`bg-amber-50`)
- Re-engagement panel: Blue (`bg-blue-50`)
- Do not contact warning: Red (`bg-red-50`)
- Important section: Red (`bg-red-50`)
- Dialog overlay: Black 60% (`bg-black bg-opacity-60`)

**Text:**
- Default: Gray-900
- Labels: Gray-700
- Hints: Gray-600
- Errors: Red-500
- Warnings: Amber-800 / Red-800

**Buttons:**
- Primary (Disqualify): Red-500 → Red-600
- Secondary (Cancel): White with Gray border
- Confirm (Yes): Red-500 → Red-600
- Keep Editing: White with Gray border

---

## 📊 State Flow Diagram

```
┌─────────────┐
│ Modal Opens │
└──────┬──────┘
       │
       v
┌──────────────────┐
│ Empty Form       │
│ • No reason      │
│ • No details     │
│ • 3 months       │
└──────┬───────────┘
       │
       v
┌──────────────────┐     Click Cancel
│ User Fills Form  │────────────────┐
└──────┬───────────┘                │
       │                            v
       │                    ┌────────────────┐
       │                    │ Has Form Data? │
       │                    └───┬────────┬───┘
       │                        │        │
       │                     Yes│        │No
       │                        │        │
       │                        v        v
       │                ┌──────────┐  Close
       │                │ Discard  │  Directly
       │                │ Dialog   │
       │                └────┬─────┘
       │                     │
       │              Discard│   Keep
       │                     v   Editing
       v                   Close   ↓
┌──────────────────┐              Return
│ Click Confirm    │
└──────┬───────────┘
       │
       v
┌──────────────────┐
│ Validation       │
└──────┬───────────┘
       │
   No  │   Yes
Error  │   ↓
  ↓    v
Return ┌──────────────┐
       │ Confirm      │
       │ Dialog       │
       └──────┬───────┘
              │
          Yes │   Cancel
              │     ↓
              v   Return
       ┌────────────┐
       │ onConfirm  │
       │ Called     │
       └──────┬─────┘
              │
              v
       ┌────────────┐
       │ Reset Form │
       └──────┬─────┘
              │
              v
       ┌────────────┐
       │ Close Modal│
       └────────────┘
```

---

## 🎬 Animation Timeline

**Modal Open:**
1. Backdrop fades in (0.2s)
2. Modal slides in from center (0.3s)
3. Content fades in (0.2s)

**Dropdown Open:**
1. Dropdown slides down (0.2s)
2. Search input appears with autofocus
3. List items fade in (0.1s)

**Dialog Open:**
1. Backdrop darkens (0.2s)
2. Dialog scales in (0.3s)
3. Content appears (0.2s)

**Validation Error:**
1. Border turns red (0.2s)
2. Error message fades in (0.3s)
3. Shake animation (0.4s)

---

**Visual Reference Complete** ✅  
**Last Updated:** January 25, 2025
