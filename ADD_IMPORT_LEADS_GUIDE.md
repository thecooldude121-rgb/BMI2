# Add/Import Leads Page - Complete Guide

**Screen 3.1: Add/Import Leads Form**

Complete implementation of the comprehensive lead import system with 5 different import methods.

---

## Access Points

### From Leads List Page:
1. Click **"Import Leads"** button (top right, Upload icon)
2. Click **"+ Add Lead"** button (top right, blue button)

Both buttons navigate to: `/lead-generation/leads/add-import`

---

## Tab Navigation

The page includes 5 tabs for different import methods:

1. **Manual Entry** - Single lead form entry
2. **CSV Import** - Bulk import from spreadsheet (3-step wizard)
3. **Apollo.io** - Direct API integration with search
4. **ZoomInfo** - Direct API integration with filters
5. **LinkedIn** - LinkedIn profile and Sales Navigator imports

---

## Tab 1: Manual Entry

### Complete Form Fields:

**Contact Information:**
- First Name * (required)
- Last Name * (required)
- Email * (required)
  - Auto-enrich button → Click to fetch data from email
- Phone
- Job Title
- LinkedIn URL

**Company Information:**
- Company Name * (required)
- Website
- Industry (dropdown)
  - SaaS, FinTech, HealthTech, Manufacturing, E-commerce, Other
- Company Size (dropdown)
  - 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+ employees

**Lead Details:**
- Lead Source (dropdown)
  - ✍️ Manual, 🌐 Website, 📞 Trade Show, 📧 Referral, 📱 Conference
- Lead Owner (dropdown)
  - Unassigned, Me (Sarah C.), Alex T., Mike J., Round-robin (Auto)
- Tags (comma-separated)
- Notes (textarea)

### Duplicate Detection:

When potential duplicate found:
- Yellow warning box appears
- Shows existing lead details
- 3 action buttons:
  - **View Existing Lead** → Navigate to existing lead
  - **Add Anyway** → Create duplicate
  - **Merge & Update** → Update existing with new data

### Advanced Options (Expandable):

- ☐ Auto-enrich after creation (Apollo.io + ZoomInfo)
- ☐ Add to email sequence: [Select Sequence dropdown]
- ☐ Notify lead owner via email
- ☐ Skip duplicate check

### Action Buttons:
- **Cancel** → Return to leads list
- **Save as Draft** → Save without creating
- **Create Lead** → Submit and create lead

---

## Tab 2: CSV Import

### 3-Step Wizard:

#### Step 1: Upload File

**Upload Area:**
- Drag & Drop zone for CSV files
- Browse Files button
- Supported: .csv, .xlsx, .xls
- Max: 10,000 rows, 5MB

**Sample Template:**
- Download Sample CSV Template button
- Pre-formatted with example data

#### Step 2: Map Columns

**Column Mapping:**
- Shows all detected CSV columns
- Map each to Lead Gen field:
  - First Name
  - Last Name
  - Email
  - Phone
  - Title
  - Company Name
  - Website
  - Industry
  - Company Size
  - Notes
  - Skip (ignore column)

**Preview Table:**
- Shows first 5 rows
- Displays: Name, Email, Company, Title, Phone
- Verifies mapping is correct

#### Step 3: Import Settings

**Import Options:**
- ☑ Skip duplicate leads (match by email)
- ☐ Update existing leads if duplicate found
- ☑ Auto-assign leads using: [Round-robin dropdown]
- ☑ Auto-enrich after import (Apollo.io + ZoomInfo)
- ☐ Add all leads to sequence: [Select Sequence dropdown]

**Default Values:**
- Lead Source: [CSV Import dropdown]
- Status: [New dropdown]
- Tags: [CSV Import, Bulk Upload]

**Import Summary:**
- Total Rows: 250
- Valid Leads: 245 ✅
- Duplicates: 5 (will be skipped) ⚠️
- Invalid: 0 ❌

**Import Progress (During Import):**
- Progress bar showing percentage
- Real-time count: "145 of 245 leads (59%)"
- Status updates:
  - ✅ 140 leads created
  - 🔄 5 leads enriching...
  - ⏳ 100 leads remaining
- Estimated time: 2 minutes

---

## Tab 3: Apollo.io

### Connection Status:
- ✅ Connected
- API Credits: 450 / 500 remaining
- Last Sync: Nov 15, 2024 at 2:30 PM
- ⚙️ Configure API button

### Search Filters:

**Available Filters:**
- Job Titles (comma-separated)
- Company (search by name)
- Industry (dropdown)
- Location (text input)
- Company Size (dropdown)
- Revenue Range (dropdown)
- Technologies Used (comma-separated)

**Actions:**
- Clear button → Reset all filters
- Search button → Execute search

### Search Results:

**Results Table (5 sample leads shown):**
1. Sarah Lee - CFO - TechStart Inc - Score: 85
2. John Smith - VP Sales - Acme Corp - Score: 78
3. Emma Wilson - VP Marketing - InnovateLabs - Score: 82
4. Michael Torres - CTO - BigCo Enterprise - Score: 68
5. Lisa Anderson - Director - StartCo - Score: 71

**Columns Displayed:**
- Checkbox (select)
- Name/Title
- Company (with industry, employees, revenue)
- Location
- Email (with Verified✅ badge)
- Score

**Selection:**
- Checkbox per row
- Select All checkbox
- "X of 125 selected" counter

**Pagination:**
- [1] [2] [3] ... [25] [Next →]

### Import Settings:

- ☑ Skip duplicates
- ☑ Auto-enrich company data
- ☑ Auto-assign using: [Round-robin]
- ☐ Add to sequence: [Select Sequence]

**Credits Display:**
- Credits Required: 4 leads × 1 credit = 4 credits
- Remaining After Import: 446 credits

### Actions:
- Cancel → Return to leads
- Import Selected (4) → Import checked leads

---

## Tab 4: ZoomInfo

### Connection Status:
- ✅ Connected
- API Credits: 230 / 300 remaining
- Last Sync: Nov 14, 2024 at 10:15 AM
- ⚙️ Configure API button

**Similar interface to Apollo.io with:**
- Search Filters: Job Title, Company, Location, Industry, Size
- Results Table: Name, Company, Email, Phone, LinkedIn
- Import Settings: Duplicates, Enrichment, Assignment

---

## Tab 5: LinkedIn

### Connection Status:
- ⚪ Not Connected

### Import Methods:

#### 1️⃣ LinkedIn Profile URL

**Input:**
- Enter LinkedIn Profile URL field
- Example: https://linkedin.com/in/sarah-lee-cfo
- **Fetch Profile** button

**Action:**
- Fetches public profile data
- Creates lead from LinkedIn profile

#### 2️⃣ LinkedIn Sales Navigator Export (CSV)

**Upload:**
- Upload Sales Navigator CSV button
- File input field

**Instructions:**
1. Go to Sales Navigator search results
2. Click "Export" button
3. Download CSV file
4. Upload here

#### 3️⃣ Connect LinkedIn Account (Coming Soon)

**Feature:**
- 🔗 Connect LinkedIn Account button (disabled)
- Will enable direct import from:
  - LinkedIn Connections
  - Saved Leads
  - Sales Navigator Lists

---

## Visual Design

### Color Scheme:
- **Primary Action:** Blue (#2563EB) - Create, Import, Search buttons
- **Secondary Action:** White with gray border - Cancel, Back, Clear
- **Warning:** Yellow (#FCD34D) - Duplicate warnings
- **Success:** Green (#10B981) - Connected status, checkmarks
- **Progress:** Blue progress bar

### Icons:
- 📥 Page header icon
- 📁 Upload area
- 📄 Download template
- ⚙️ Configure API
- ✅ Connected status
- 🤖 Auto-enrich
- 🏢 Company fields
- 👤 Contact fields

### Layout:
- Clean, centered forms (max-w-4xl for manual/CSV, max-w-6xl for API tabs)
- White cards on gray-50 background
- Clear section dividers
- Responsive grid layouts (2 columns for form fields)

---

## Key Features

### 1. Duplicate Prevention
- Automatic detection by email
- Warning before creating duplicates
- Merge option to update existing leads

### 2. Auto-Enrichment
- Checkbox to enable Apollo.io + ZoomInfo enrichment
- Fetches company data, tech stack, revenue, employees
- Updates lead profile automatically

### 3. Round-Robin Assignment
- Automatically distributes leads across team
- Fair distribution algorithm
- Can assign to specific owner or leave unassigned

### 4. Batch Import
- CSV: Up to 10,000 rows
- Apollo.io: Multiple selection with pagination
- Real-time progress tracking

### 5. Sequence Integration
- Add leads to email sequences during import
- Available for all import methods
- Nurture automation starts immediately

---

## Testing Guide

### Manual Entry Test:
1. Navigate to Leads → Click "Add Lead"
2. Fill in form fields:
   - First Name: John
   - Last Name: Smith
   - Email: john@example.com
   - Company: Test Corp
3. Click "🤖 Auto-enrich from Email"
4. Expand "Advanced Options"
5. Check "Auto-enrich after creation"
6. Click "Create Lead"
7. Verify redirect to leads list

### CSV Import Test:
1. Navigate to Leads → Click "Import Leads"
2. Click "CSV Import" tab
3. Click "Download Sample CSV Template"
4. Upload a CSV file (or use Browse Files)
5. Verify Step 2 shows column mapping
6. Adjust mappings if needed
7. Click "Next" to Step 3
8. Review import summary
9. Check import options
10. Click "Start Import"
11. Watch progress bar
12. Verify success message

### Apollo.io Test:
1. Navigate to Leads → Click "Import Leads"
2. Click "Apollo.io" tab
3. Enter search filters:
   - Job Titles: CFO, VP Sales
   - Industry: SaaS
4. Click "Search"
5. Select 2-3 leads using checkboxes
6. Review import settings
7. Check credit calculation
8. Click "Import Selected (X)"
9. Verify import success

### LinkedIn Test:
1. Navigate to Leads → Click "Import Leads"
2. Click "LinkedIn" tab
3. Enter a LinkedIn profile URL
4. Click "Fetch Profile"
5. Verify lead creation

---

## Form Validation

### Required Fields (Manual Entry):
- First Name *
- Last Name *
- Email *
- Company Name *

**Validation:**
- Shows alert if required fields are empty
- Email must be valid format
- LinkedIn URL must be valid URL format

### CSV Validation:
- File size < 5MB
- Max 10,000 rows
- Valid CSV format
- Email required in mapped columns

### Apollo/ZoomInfo:
- At least one lead must be selected
- Sufficient API credits available

---

## Navigation

### Entry Points:
- From Leads List: "Import Leads" button
- From Leads List: "+ Add Lead" button
- Direct URL: `/lead-generation/leads/add-import`

### Exit Points:
- Cancel button → `/lead-generation/leads`
- Close (X) button → `/lead-generation/leads`
- After successful import → `/lead-generation/leads`
- After creating lead → `/lead-generation/leads`

### Breadcrumb:
Dashboard > Leads > Add/Import Leads

---

## Success Criteria

✅ All 5 tabs are functional and accessible
✅ Manual entry form has all required fields
✅ CSV import wizard has 3 complete steps
✅ Apollo.io shows search results and selection
✅ ZoomInfo tab shows similar interface
✅ LinkedIn tab shows 3 import methods
✅ Duplicate detection works
✅ Auto-enrich option available
✅ Import progress shows real-time updates
✅ Navigation buttons work correctly
✅ Form validation prevents invalid submissions
✅ Success messages and redirects work

---

## Integration Points

### With Existing Features:
- **Leads List:** Add/Import buttons navigate here
- **Email Sequences:** Can add leads to sequences during import
- **Team Management:** Round-robin assignment across team
- **Data Enrichment:** Apollo.io and ZoomInfo integration
- **Duplicate Detection:** Checks against existing leads database

### API Integrations:
- **Apollo.io:** Search, fetch contact data
- **ZoomInfo:** Search, fetch company data
- **LinkedIn:** Profile scraping (future)
- **Supabase:** Store lead data

---

## Notes

- All import methods create leads with consistent data structure
- Progress bars provide real-time feedback for long operations
- API credit tracking prevents over-usage
- CSV template ensures correct data format
- Duplicate detection prevents data quality issues

The Add/Import Leads page is now a comprehensive lead ingestion hub that supports multiple sources and bulk operations while maintaining data quality through validation and duplicate detection.
