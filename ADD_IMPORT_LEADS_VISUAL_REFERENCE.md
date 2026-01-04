# Add/Import Leads - Visual Structure Reference

**Quick visual map of the entire Add/Import Leads interface**

---

## Page Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ BREADCRUMB: Dashboard > Leads > Add/Import Leads                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ HEADER                                                                  │
│ 📥 Add/Import Leads                                        [✕ Close]   │
│ Import leads from multiple sources or add manually                     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ TAB NAVIGATION (5 tabs)                                                │
│ [Manual Entry] [CSV Import] [Apollo.io] [ZoomInfo] [LinkedIn]         │
│       ↑                                                                │
│     Active                                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tab 1: Manual Entry - Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Manual Lead Entry Form                                                  │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ CONTACT INFORMATION                                                 ││
│ │ ─────────────────────────────────────────────────────────────────   ││
│ │                                                                     ││
│ │ [First Name *____] [Last Name *____]                                ││
│ │ [Email *_________] [Phone__________]                                ││
│ │ 🤖 [Auto-enrich from Email]                                        ││
│ │ [Job Title______] [LinkedIn URL___]                                 ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ COMPANY INFORMATION                                                 ││
│ │ ─────────────────────────────────────────────────────────────────   ││
│ │                                                                     ││
│ │ [Company Name *_] [Website________]                                 ││
│ │ [Industry... ▼  ] [Company Size ▼]                                  ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ LEAD DETAILS                                                        ││
│ │ ─────────────────────────────────────────────────────────────────   ││
│ │                                                                     ││
│ │ [Lead Source ▼] [Lead Owner ▼]                                      ││
│ │ [Tags (comma-separated)_______________________]                     ││
│ │ [Notes___________________________________________]                  ││
│ │ [________________________________________________]                  ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ ⚠️ DUPLICATE DETECTION (if found)                                   ││
│ │ Potential duplicate: John Smith - Acme Corp                         ││
│ │ [View Existing] [Add Anyway] [Merge & Update]                       ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│ ADVANCED OPTIONS                                          [▼ Expand]   │
│ ☑ Auto-enrich after creation                                          │
│ ☐ Add to sequence: [Select... ▼]                                      │
│ ☐ Notify lead owner                                                    │
│ ☐ Skip duplicate check                                                 │
│                                                                         │
│              [Cancel] [Save as Draft] [Create Lead]                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tab 2: CSV Import - Visual Flow

```
STEP 1: UPLOAD FILE
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│            ┌───────────────────────────────────────────┐              │
│            │                                           │              │
│            │     📁 Drag & Drop CSV File Here         │              │
│            │              or                           │              │
│            │        [Browse Files]                     │              │
│            │                                           │              │
│            │  .csv, .xlsx, .xls (Max 10,000 rows)     │              │
│            │                                           │              │
│            └───────────────────────────────────────────┘              │
│                                                                         │
│    📄 Download Sample CSV Template                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

STEP 2: MAP COLUMNS
┌─────────────────────────────────────────────────────────────────────────┐
│ File: leads_export.csv (250 rows detected)                             │
│                                                                         │
│ CSV Column           →    Lead Gen Field                               │
│ ─────────────────────────────────────────────────────────────────────  │
│ "First Name"         →    [First Name ▼]                               │
│ "Last Name"          →    [Last Name ▼]                                │
│ "Email Address"      →    [Email ▼]                                    │
│ ...                                                                     │
│                                                                         │
│ PREVIEW (First 5 rows)                                                 │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Name      │ Email         │ Company    │ Title      │ Phone      │ │
│ │ John Smith│ john@acme.com │ Acme Corp  │ VP Sales   │ +1...      │ │
│ │ Sarah Lee │ sarah@tech... │ TechStart  │ CFO        │ +1...      │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│                                          [Back] [Next]                  │
└─────────────────────────────────────────────────────────────────────────┘

STEP 3: IMPORT SETTINGS
┌─────────────────────────────────────────────────────────────────────────┐
│ Import Options:                                                         │
│ ☑ Skip duplicate leads                                                │
│ ☐ Update existing leads                                               │
│ ☑ Auto-assign using: [Round-robin ▼]                                 │
│ ☑ Auto-enrich after import                                            │
│                                                                         │
│ Default Values:                                                         │
│ Lead Source: [CSV Import ▼]                                           │
│ Status: [New ▼]                                                        │
│ Tags: [CSV Import, Bulk Upload_________________]                       │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ IMPORT SUMMARY                                                      ││
│ │ • Total: 250                                                        ││
│ │ • Valid: 245 ✅                                                     ││
│ │ • Duplicates: 5 ⚠️                                                 ││
│ │ • Invalid: 0 ❌                                                     ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│ IMPORT PROGRESS (when importing)                                       │
│ Importing... 145 of 245 leads (59%)                                    │
│ ████████████████████░░░░░░░░░░░░░░░░░░                                │
│ ✅ 140 created | 🔄 5 enriching | ⏳ 100 remaining                    │
│                                                                         │
│                              [Cancel] [Back] [Start Import]            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tab 3: Apollo.io - Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Apollo.io Lead Import                                                   │
│                                                                         │
│ ✅ Connected | Credits: 450/500 | Last Sync: Nov 15    [⚙️ Config]   │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ SEARCH FILTERS                                                      ││
│ │                                                                     ││
│ │ Job Titles: [VP Sales, CFO, CTO___________________]                ││
│ │ Company: [____________] Industry: [Select... ▼]                     ││
│ │ Location: [____________] Size: [Select... ▼]                        ││
│ │                                                                     ││
│ │                                          [Clear] [Search]           ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│ SEARCH RESULTS (125 leads found)                                       │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │☐│Name/Title     │Company        │Location  │Email         │Score   ││
│ │─┼───────────────┼───────────────┼──────────┼──────────────┼────────││
│ │☑│Sarah Lee      │TechStart Inc  │SF, CA    │sarah@tech.com│ 85     ││
│ │ │CFO            │FinTech, 45 emp│          │Verified✅    │        ││
│ │─┼───────────────┼───────────────┼──────────┼──────────────┼────────││
│ │☑│John Smith     │Acme Corp      │NY, NY    │john@acme.com │ 78     ││
│ │ │VP Sales       │SaaS, 75 emp   │          │Verified✅    │        ││
│ │─┼───────────────┼───────────────┼──────────┼──────────────┼────────││
│ │☐│Emma Wilson    │InnovateLabs   │Austin, TX│emma@innov.com│ 82     ││
│ │ │...            │...            │...       │...           │...     ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│ ☐ Select All | 2 of 125 selected                                      │
│ [1] [2] [3] ... [25] [Next →]                                          │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ IMPORT SETTINGS                                                     ││
│ │ ☑ Skip duplicates                                                  ││
│ │ ☑ Auto-enrich company data                                         ││
│ │ ☑ Auto-assign using: [Round-robin ▼]                              ││
│ │                                                                     ││
│ │ Credits: 2 leads × 1 = 2 credits | Remaining: 448                  ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│                                          [Cancel] [Import Selected (2)]│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tab 4: ZoomInfo - Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ZoomInfo Lead Import                                                    │
│                                                                         │
│ ✅ Connected | Credits: 230/300 | Last Sync: Nov 14    [⚙️ Config]   │
│                                                                         │
│ [Similar interface to Apollo.io with ZoomInfo-specific filters]        │
│                                                                         │
│ Search Filters: Job Title, Company, Location, Industry, Size           │
│ Results Table: Name, Company, Email, Phone, LinkedIn                   │
│ Import Settings: Duplicates, Enrichment, Assignment                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tab 5: LinkedIn - Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ LinkedIn Lead Import                                                    │
│                                                                         │
│ ⚪ Not Connected                                                        │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ 1️⃣ LINKEDIN PROFILE URL                                            ││
│ │                                                                     ││
│ │ Enter LinkedIn Profile URL:                                         ││
│ │ [https://linkedin.com/in/sarah-lee-cfo_____] [Fetch Profile]       ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ 2️⃣ LINKEDIN SALES NAVIGATOR EXPORT (CSV)                           ││
│ │                                                                     ││
│ │ Upload Sales Navigator CSV:                                         ││
│ │ [Browse Files]                                                      ││
│ │                                                                     ││
│ │ Instructions:                                                       ││
│ │ 1. Go to Sales Navigator search results                            ││
│ │ 2. Click "Export" button                                           ││
│ │ 3. Download CSV file                                               ││
│ │ 4. Upload here                                                     ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ 3️⃣ CONNECT LINKEDIN ACCOUNT (Coming Soon)                          ││
│ │                                                                     ││
│ │ [🔗 Connect LinkedIn Account] (disabled)                           ││
│ │                                                                     ││
│ │ Enable direct import from:                                          ││
│ │ • LinkedIn Connections                                              ││
│ │ • Saved Leads                                                       ││
│ │ • Sales Navigator Lists                                             ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Color Guide

### Button Colors:
```
[Create Lead]       → bg-blue-600 text-white (Primary action)
[Import Selected]   → bg-blue-600 text-white (Primary action)
[Search]            → bg-blue-600 text-white (Primary action)

[Cancel]            → border-gray-300 (Secondary)
[Back]              → border-gray-300 (Secondary)
[Save as Draft]     → border-gray-300 (Secondary)

[Browse Files]      → bg-blue-50 text-blue-700 (File input)
```

### Status Colors:
```
✅ Connected        → text-green-600
⚪ Not Connected    → text-gray-400
⚠️ Duplicates       → bg-yellow-50 border-yellow-200
```

### Progress Colors:
```
Progress Bar        → bg-blue-600
Background          → bg-gray-200
```

---

## Component Sizes

### Form Widths:
```
Manual Entry:       max-w-4xl (1024px)
CSV Import:         max-w-4xl (1024px)
Apollo.io:          max-w-6xl (1536px)
ZoomInfo:           max-w-6xl (1536px)
LinkedIn:           max-w-4xl (1024px)
```

### Grid Layouts:
```
Form Fields:        grid-cols-2 gap-4
CSV Mapping:        grid-cols-3 gap-4
```

---

## Icon Reference

### Page Icons:
- 📥 Page header (Add/Import Leads)
- 📁 Drag & drop area
- 📄 Download template
- ⚙️ Configure API
- 🤖 Auto-enrich

### Action Icons:
- Upload (Import button)
- Plus (Add button)
- X (Close button)
- Search (Search button)
- Download (Export button)
- Settings (Configure button)
- RefreshCw (Re-enrich button)
- ChevronDown (Expand/collapse)

### Status Icons:
- CheckCircle (✅ Connected, Verified)
- AlertCircle (⚠️ Warnings)
- Users (Team actions)
- Clock (Time indicators)

---

## Responsive Breakpoints

### Desktop (> 1024px):
- Full 2-column forms
- Wide tables
- Side-by-side layouts

### Tablet (768px - 1024px):
- 2-column forms maintained
- Tables scroll horizontally
- Buttons maintain size

### Mobile (< 768px):
- Single column forms
- Tabs scroll horizontally
- Buttons stack vertically
- Tables scroll with fixed headers

---

## State Indicators

### Loading States:
```
Importing...        → Animated progress bar
Enriching...        → Spinner icon (animate-spin)
Searching...        → Loading indicator
```

### Success States:
```
✅ Lead created     → Green checkmark + alert
✅ Import complete  → Success message + redirect
✅ Connected        → Green status badge
```

### Error States:
```
❌ Invalid data     → Red error message
⚠️ Duplicate found  → Yellow warning box
❌ No credits       → Disabled button
```

---

## Quick Reference: Key Elements by Tab

### Manual Entry:
- 3 sections (Contact, Company, Lead Details)
- 13 form fields (6 required)
- Auto-enrich button
- Advanced options expandable
- 3 action buttons

### CSV Import:
- 3-step wizard
- Drag & drop upload
- Column mapping (11 fields)
- Preview table (5 rows)
- Progress bar during import

### Apollo.io:
- Connection status
- 6 search filters
- Results table (5 columns)
- Checkbox selection
- Credit calculation
- Pagination

### ZoomInfo:
- Same structure as Apollo
- Different API endpoint
- ZoomInfo branding

### LinkedIn:
- 3 import methods
- Profile URL input
- CSV upload
- Coming soon feature
- Instructions provided

---

This visual reference provides a quick way to understand the entire Add/Import Leads interface structure and layout without reading lengthy documentation.
