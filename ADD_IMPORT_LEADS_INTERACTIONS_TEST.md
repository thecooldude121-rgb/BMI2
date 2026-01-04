# Add / Import Leads - Clickable Interactions Test Guide

## Navigation Path
Access via: `/lead-generation/leads` → Click "Add / Import Leads" button

---

## Module Navigation (Top Bar)
All tabs navigate to their respective pages:
- Dashboard → `/lead-generation/dashboard`
- **Leads** → `/lead-generation/leads` (Active)
- Intelligence → `/lead-generation/intelligence`
- Campaigns → `/lead-generation/campaigns`
- Analytics → `/lead-generation/analytics`
- Settings → `/lead-generation/settings`

---

## Breadcrumb Navigation
- Dashboard → Goes to Dashboard
- Leads → Goes to Leads list
- Add/Import Leads → Current page (not clickable)

---

## Tab Navigation (Main Content)
5 tabs available:
1. **Manual Entry** - Single lead form
2. **CSV Import** - Bulk upload wizard
3. **Apollo.io** - Third-party integration
4. **ZoomInfo** - Third-party integration
5. **LinkedIn** - Profile/CSV import

---

## TAB 1: MANUAL ENTRY - Interactive Elements

### Auto-Enrichment
- **Email field** → On blur, checks for duplicates automatically
- **🤖 Auto-enrich from Email** button → Fetches data from Apollo/ZoomInfo
  - Shows loading spinner while enriching
  - Pre-fills: name, phone, title, LinkedIn, company, website, industry, size

### Duplicate Detection
- **Check for Duplicates** button → Manually trigger duplicate check
- When duplicate found, panel appears with 3 options:
  - **View Existing Lead** → Opens lead detail in new tab
  - **Add Anyway** → Creates duplicate (bypasses check)
  - **Merge & Update** → Updates existing lead with new data
- **✕ Close** button → Dismisses duplicate warning

### Advanced Options
- **▼ Expand/Collapse** → Toggle advanced options section
- **Add to email sequence** checkbox → Shows sequence dropdown when checked
  - Dropdown includes: HRMS Warm Lead, New Customer Outreach, Product Demo, Re-engagement

### Form Actions
- **Cancel** → Returns to Leads list
- **Save as Draft** → Saves lead as draft, returns to list
- **Create Lead** → Validates form, creates lead, shows success message

---

## TAB 2: CSV IMPORT - Interactive Elements

### Step 1: Upload File
- **Drag & Drop area** → Drop CSV/Excel file to upload
- **Browse Files** button → Opens file picker
- **Download Sample CSV Template** → Downloads pre-formatted template
- Auto-advances to Step 2 after successful upload

### Step 2: Map Columns
- **Column mapping dropdowns** → Map CSV columns to system fields
- **Preview table** → Shows first 5 rows with mapped data
- **Back** → Return to Step 1
- **Next** → Advance to Step 3

### Step 3: Import Settings
- **Checkboxes** for import options (skip duplicates, auto-enrich, etc.)
- **Round-robin dropdown** → Select assignment method
- **Progress bar** → Real-time import progress (0-100%)
- **Start Import** button → Begins import, shows progress
- After completion → Navigates to Leads list filtered by "Source: CSV Import"

---

## TAB 3: APOLLO.IO - Interactive Elements

### Header Actions
- **⚙️ Configure API** → Opens Settings > Integrations > Apollo.io

### Search Filters
- Input fields: Job Titles, Company, Location
- Dropdowns: Industry, Company Size, Revenue Range, Technologies Used
- **Clear** button → Resets all filters
- **Search** button → Executes search with current filters

### Results Table
- **Select All checkbox** (header) → Selects/deselects all visible leads
- **Individual checkboxes** → Select specific leads for import
- **Lead name** → Opens preview modal (placeholder)
- **Company name** → Opens company modal (placeholder)
- **Email** → Copies to clipboard (placeholder)
- **Pagination** → Navigate between result pages

### Import Actions
- **Credit calculation** → Updates dynamically based on selection
- **Import Selected (#)** button → Imports checked leads, deducts credits
  - Disabled when no leads selected
  - Shows count of selected leads

---

## TAB 4: ZOOMINFO - Interactive Elements

### Header Actions
- **⚙️ Configure API** → Opens Settings > Integrations > ZoomInfo

Similar structure to Apollo.io with ZoomInfo-specific data.

---

## TAB 5: LINKEDIN - Interactive Elements

### Method 1: Profile URL
- **LinkedIn URL input** → Enter profile URL
- **Fetch Profile** button → Scrapes profile, pre-fills manual form
  - Shows alert with fetching progress
  - Switches to Manual Entry tab with pre-filled data

### Method 2: Sales Navigator CSV
- **File upload** → Upload Sales Navigator CSV export
  - Shows processing alert
  - Switches to CSV Import tab at Step 2

### Method 3: Connect Account
- **🔗 Connect LinkedIn Account** → Coming Soon alert
  - Currently disabled
  - Will enable OAuth flow in future

---

## Integration Points

### HRMS Integration
- Manual Entry → Lead Source dropdown includes "HRMS (Auto-populated)"
- Notes field can reference HRMS connections

### Auto-Enrichment
- Available in Manual Entry (per-lead)
- Available in CSV Import (bulk)
- Available in Apollo.io/ZoomInfo imports

### Email Sequences
- Advanced Options → Add to sequence checkbox
- CSV Import → Bulk add to sequence option
- Apollo.io Import → Add imported leads to sequence

### Duplicate Detection
- Manual Entry → Automatic on email blur
- CSV Import → Skip duplicates option
- Apollo.io → Skip duplicates checkbox

---

## Keyboard Shortcuts (Future Enhancement)
Currently no keyboard shortcuts implemented. Potential additions:
- `Ctrl/Cmd + S` → Save draft
- `Ctrl/Cmd + Enter` → Submit form
- `Esc` → Close modals/return to list

---

## Error States

### Form Validation
- Required fields marked with red asterisk (*)
- Alert shown if required fields missing on submit

### File Upload
- Max 10,000 rows
- Max 5MB file size
- Supported formats: .csv, .xlsx, .xls
- Error alert shown if validation fails

### API Integration
- Connection status shown (Connected/Not Connected)
- Credit balance displayed
- Error handling for failed API calls

---

## Loading States

### Manual Entry
- Auto-enrich button shows spinner while processing
- "Enriching..." text replaces button label

### CSV Import
- Progress bar with percentage (0-100%)
- Real-time counts: created, enriching, remaining
- Estimated time remaining shown

### Apollo.io Import
- Import button disabled during processing
- Success/error messages after completion

---

## Success Flows

### Manual Entry Success
1. Form validation passes
2. Lead created alert
3. Navigate to Leads list (or lead detail)

### CSV Import Success
1. All validation passes
2. Progress bar reaches 100%
3. Success alert: "245 leads created successfully"
4. Navigate to Leads list filtered by source

### Apollo.io Import Success
1. Selected leads validated
2. Credits deducted
3. Import progress shown
4. Navigate to Leads list filtered by source

---

## Test Scenarios

### Scenario 1: Create Single Lead
1. Navigate to Manual Entry tab
2. Fill required fields: First Name, Last Name, Email, Company
3. Enter email: john@acme.com
4. Blur email field → Duplicate warning appears
5. Click "Merge & Update" → Lead merged, return to list

### Scenario 2: Auto-Enrich Lead
1. Enter email: test@example.com
2. Click "🤖 Auto-enrich from Email"
3. Wait for enrichment (loading spinner)
4. Form auto-populated with data
5. Click "Create Lead" → Success

### Scenario 3: CSV Import
1. Switch to CSV Import tab
2. Click "Download Sample CSV Template"
3. Click "Browse Files" and select CSV
4. Map columns in Step 2
5. Click "Next" to Step 3
6. Configure import settings
7. Click "Start Import" → Progress bar shows
8. After completion → View imported leads

### Scenario 4: Apollo.io Import
1. Switch to Apollo.io tab
2. Enter search filters
3. Click "Search"
4. Select 4 leads using checkboxes
5. Verify credit calculation: 4 × 1 = 4 credits
6. Click "Import Selected (4)"
7. View imported leads filtered by source

### Scenario 5: LinkedIn Profile Fetch
1. Switch to LinkedIn tab
2. Enter URL: https://linkedin.com/in/sarah-lee-cfo
3. Click "Fetch Profile"
4. Alert shows progress
5. Switched to Manual Entry with pre-filled data
6. Review and create lead

---

## Notes for Developers

### State Management
- All tabs share the same component state
- Tab switching preserves form data
- CSV wizard maintains step progress

### Navigation Flow
- Most actions eventually return to Leads list
- Some actions open new tabs/windows
- Settings links include query params for context

### Mock Data
- Apollo.io results: 5 sample leads
- CSV preview: 5 sample rows
- All API calls simulated with timeouts

### Future Enhancements
- Real API integration
- Websocket for real-time import progress
- Drag-and-drop file upload
- Keyboard shortcuts
- Undo/Redo functionality
