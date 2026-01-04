# Add/Import Leads - 5-Minute Quick Test

**Fast verification of all 5 import tabs and key features**

Navigate to: `/lead-generation/leads/add-import`

---

## Quick Access Test

### From Leads List:
1. Navigate to `/lead-generation/leads`
2. Look for two buttons in top right:
   - **"Import Leads"** (Upload icon, white button)
   - **"+ Add Lead"** (Plus icon, blue button)
3. Click either button → Should navigate to Add/Import page

**✅ PASS:** Both buttons navigate to `/lead-generation/leads/add-import`

---

## Tab Navigation Test

### Verify all 5 tabs are present:
- [ ] Manual Entry (active by default)
- [ ] CSV Import
- [ ] Apollo.io
- [ ] ZoomInfo
- [ ] LinkedIn

**Click each tab:** Should switch content without page reload

**✅ PASS:** All 5 tabs clickable and show different content

---

## Tab 1: Manual Entry

### Form Fields Check:
1. **Contact Information section:**
   - [ ] First Name * field
   - [ ] Last Name * field
   - [ ] Email * field (with 🤖 Auto-enrich button below)
   - [ ] Phone field
   - [ ] Job Title field
   - [ ] LinkedIn URL field

2. **Company Information section:**
   - [ ] Company Name * field
   - [ ] Website field
   - [ ] Industry dropdown (6 options)
   - [ ] Company Size dropdown (6 options)

3. **Lead Details section:**
   - [ ] Lead Source dropdown (5 options with icons)
   - [ ] Lead Owner dropdown (5 options)
   - [ ] Tags field (comma-separated)
   - [ ] Notes textarea

### Advanced Options:
1. Click **"Advanced Options"** with dropdown icon
2. Verify section expands showing:
   - [ ] Auto-enrich checkbox
   - [ ] Add to sequence checkbox + dropdown
   - [ ] Notify owner checkbox
   - [ ] Skip duplicate check checkbox

### Action Buttons:
- [ ] Cancel button (gray)
- [ ] Save as Draft button (gray)
- [ ] Create Lead button (blue)

### Test Submit:
1. Leave form blank
2. Click "Create Lead"
3. Should show alert: "Please fill in all required fields"

**✅ PASS:** Form has all sections, validation works, advanced options expand

---

## Tab 2: CSV Import

### Step 1: Upload File
1. Click "CSV Import" tab
2. Verify you see:
   - [ ] "Step 1 of 3: Upload File" header
   - [ ] Drag & drop area with 📁 icon
   - [ ] "Browse Files" button
   - [ ] File format info: ".csv, .xlsx, .xls (Max 10,000 rows, 5MB)"
   - [ ] "📄 Download Sample CSV Template" link

### Mock Upload Test:
1. Click "Browse Files" button
2. File input should appear
3. Select any file (or click area - will trigger file input)

**Note:** Actual file upload will show Step 2 in real implementation

### Step 2: Map Columns (Auto-shown after upload mock)
After clicking file input, should see:
- [ ] "Step 2 of 3: Map Columns" header
- [ ] File name shown: "leads_export.csv (250 rows detected)"
- [ ] Column mapping table (11 rows)
  - Each row: CSV Column → Dropdown → Lead Gen Field
- [ ] Preview table showing first 5 rows
  - Columns: Name, Email, Company, Title, Phone
- [ ] Back button
- [ ] Next button

### Step 3: Import Settings
1. Click "Next" button from Step 2
2. Should see:
   - [ ] "Step 3 of 3: Import Settings" header
   - [ ] Import Options (4 checkboxes)
   - [ ] Default Values section (Source, Status, Tags)
   - [ ] Import Summary box (blue background)
     - Total: 250, Valid: 245, Duplicates: 5, Invalid: 0
   - [ ] Cancel, Back, Start Import buttons

### Test Import:
1. Click "Start Import" button
2. Should show progress:
   - [ ] "Importing..." text with percentage
   - [ ] Blue progress bar animating
   - [ ] Status updates (created, enriching, remaining)
   - [ ] Estimated time

**✅ PASS:** All 3 steps visible, wizard flows correctly, progress shows

---

## Tab 3: Apollo.io

### Connection Status:
1. Click "Apollo.io" tab
2. At top, verify:
   - [ ] "✅ Connected" status (green)
   - [ ] "API Credits: 450 / 500 remaining"
   - [ ] "Last Sync: Nov 15, 2024 at 2:30 PM"
   - [ ] "⚙️ Configure API" button (top right)

### Search Filters:
- [ ] Job Titles field
- [ ] Company field
- [ ] Industry dropdown
- [ ] Location field
- [ ] Company Size dropdown
- [ ] Clear button
- [ ] Search button (blue, with Search icon)

### Search Results:
- [ ] "Search Results (125 leads found)" header
- [ ] Results table with 5 sample leads
- [ ] Each lead shows:
  - Checkbox
  - Name + Title
  - Company + Industry + Revenue
  - Location
  - Email + Verified✅
  - Score
- [ ] "Select All" checkbox at bottom
- [ ] Selection counter: "X of 125 selected"
- [ ] Pagination: [1] [2] [3] ... [25] [Next →]

### Import Settings:
- [ ] Skip duplicates checkbox (checked)
- [ ] Auto-enrich checkbox (checked)
- [ ] Auto-assign checkbox (checked) + dropdown
- [ ] Add to sequence checkbox + dropdown
- [ ] Credits calculation: "4 leads × 1 credit = 4 credits"
- [ ] Remaining display

### Test Selection:
1. Check 2-3 lead checkboxes
2. Verify counter updates: "3 of 125 selected"
3. Verify credits update: "3 leads × 1 credit = 3 credits"
4. Click "Import Selected (3)" button
5. Should show import confirmation

**✅ PASS:** Connection shown, filters present, results selectable, import button works

---

## Tab 4: ZoomInfo

### Quick Check:
1. Click "ZoomInfo" tab
2. Should see similar layout to Apollo.io:
   - [ ] Connection status (✅ Connected)
   - [ ] API Credits: 230 / 300
   - [ ] Last Sync date
   - [ ] Configure API button
3. Message: "Similar interface to Apollo.io with ZoomInfo-specific filters"

**✅ PASS:** Tab loads, shows ZoomInfo branding, similar structure

---

## Tab 5: LinkedIn

### Connection Status:
1. Click "LinkedIn" tab
2. Should see:
   - [ ] "⚪ Not Connected" status (gray circle)

### Three Import Methods:

#### Method 1: Profile URL
- [ ] Section header: "1️⃣ LinkedIn Profile URL"
- [ ] Input field with placeholder
- [ ] "Fetch Profile" button

#### Method 2: Sales Navigator CSV
- [ ] Section header: "2️⃣ LinkedIn Sales Navigator Export (CSV)"
- [ ] "Upload Sales Navigator CSV:" label
- [ ] File browse button
- [ ] Instructions box (gray background) with 4 steps

#### Method 3: Connect Account (Coming Soon)
- [ ] Section header: "3️⃣ Connect LinkedIn Account (Coming Soon)"
- [ ] "🔗 Connect LinkedIn Account" button (disabled/gray)
- [ ] Feature list:
  - LinkedIn Connections
  - Saved Leads
  - Sales Navigator Lists

**✅ PASS:** All 3 methods visible, instructions clear, coming soon noted

---

## Visual Design Check

### Overall Layout:
- [ ] Clean white cards on gray background
- [ ] Consistent padding and spacing
- [ ] Clear section dividers
- [ ] Readable font sizes
- [ ] Professional color scheme

### Color Coding:
- [ ] Blue buttons for primary actions (Create, Import, Search)
- [ ] Gray/white buttons for secondary actions (Cancel, Back)
- [ ] Green checkmarks for connected status
- [ ] Yellow for warnings (duplicates)

### Icons:
- [ ] 📥 in page header
- [ ] Upload, Plus, Download icons in buttons
- [ ] Settings gear icon
- [ ] Checkmarks for verified items
- [ ] Progress indicators

**✅ PASS:** Design is clean, professional, consistent throughout

---

## Navigation Test

### Breadcrumb:
- [ ] Shows: "Dashboard > Leads > Add/Import Leads"
- [ ] "Dashboard" is clickable → navigates
- [ ] "Leads" is clickable → navigates
- [ ] "Add/Import Leads" is current (bold)

### Close Button:
- [ ] X button in top right of header
- [ ] Click it → Should navigate back to `/lead-generation/leads`

### Cancel Buttons:
- [ ] Every tab has Cancel button
- [ ] Click any Cancel → Should navigate to leads list

**✅ PASS:** All navigation works, breadcrumb functional

---

## Responsive Check (Optional)

1. Resize browser window to mobile width (< 768px)
2. Verify:
   - [ ] Tabs stack or scroll horizontally
   - [ ] Form fields stack vertically
   - [ ] Tables scroll horizontally
   - [ ] Buttons remain accessible

**✅ PASS:** Layout adjusts for mobile

---

## Summary Checklist

**Page Access:**
- [ ] From Leads: "Import Leads" button works
- [ ] From Leads: "+ Add Lead" button works
- [ ] Direct URL works: `/lead-generation/leads/add-import`

**Tabs:**
- [ ] Manual Entry - Complete form with all sections
- [ ] CSV Import - 3-step wizard functional
- [ ] Apollo.io - Search results and selection
- [ ] ZoomInfo - Similar to Apollo interface
- [ ] LinkedIn - 3 import methods shown

**Key Features:**
- [ ] Form validation on Manual Entry
- [ ] CSV progress bar animates
- [ ] Apollo lead selection works
- [ ] Advanced options expandable
- [ ] All buttons functional
- [ ] Navigation works (breadcrumb, close, cancel)

**Visual Quality:**
- [ ] Professional design
- [ ] Consistent styling
- [ ] Clear labels and instructions
- [ ] Proper spacing and alignment

---

## Common Issues to Check

### If tabs don't switch:
- Check that activeTab state updates
- Verify tab buttons have onClick handlers

### If CSV steps don't progress:
- Check csvStep state updates in upload handler
- Verify Next/Back buttons update state

### If Apollo selection doesn't work:
- Check selectedApolloLeads state
- Verify toggleApolloLead function

### If forms don't submit:
- Check validation logic
- Verify navigate function works
- Check form state updates

---

## Test Result

If all sections pass:
**✅ COMPLETE** - Add/Import Leads page is fully functional

The page successfully provides:
- 5 different import methods
- Complete manual entry form
- CSV bulk import wizard
- API integration interfaces (Apollo, ZoomInfo)
- LinkedIn import options
- Validation and progress tracking
- Clean, professional UI

**Ready for user testing and production use!**
