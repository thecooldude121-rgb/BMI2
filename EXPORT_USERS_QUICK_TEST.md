# Export Team Members - Quick Test Guide

## 🚀 Quick Test (3 Minutes)

### Access Export Feature
```
1. Navigate to: /crm/team-management
2. Look for: "Export" button (between header and Import Users)
3. Click: "Export"
4. ✅ Modal opens with "Export Team Members" title
```

---

## 📊 Test Flow 1: Basic CSV Export

### Step 1: Default Settings Test
```
1. Modal opens
2. ✅ CSV (Spreadsheet) is pre-selected
3. ✅ First 6 checkboxes are checked:
   - Basic info
   - Role and permissions
   - Department and manager
   - Account status
   - Last login date
   - Performance stats
4. ✅ Last 2 checkboxes are unchecked:
   - Login history
   - Audit log
5. ✅ "All users (X)" is selected
6. ✅ Summary shows: "X users will be exported in CSV format"
```

### Step 2: Execute Export
```
1. Click: Blue "Export" button
2. ✅ File downloads immediately
3. ✅ Filename: team_members_2024-12-13.csv (today's date)
4. ✅ Toast appears: "User list exported successfully. X users exported to CSV."
5. ✅ Modal closes
```

### Step 3: Verify CSV Content
```
1. Open downloaded CSV in Excel or text editor
2. ✅ Header row present with column names
3. ✅ Data rows match team member count
4. ✅ All selected fields are columns
5. ✅ Data is properly formatted
6. ✅ No weird characters or broken formatting
```

**Expected Columns**:
```
Full Name, Email, Phone, Role, Title, Department, Manager, Status, Joined Date, Last Login, Active Deals, Pipeline Value, Closed Deals
```

---

## 📄 Test Flow 2: PDF Export

### Step 1: Select PDF Format
```
1. Click "Export" button
2. Click: "PDF (Printable Report)" radio button
3. ✅ Radio button fills with blue dot
4. ✅ Summary updates to "...in PDF format"
5. Keep all other defaults
6. Click: "Export"
```

### Step 2: Verify HTML/PDF File
```
1. ✅ File downloads: team_members_report_2024-12-13.html
2. ✅ Toast shows PDF note: "(Note: HTML version generated - open in browser and print to PDF)"
3. ✅ Modal closes
```

### Step 3: Open and Review
```
1. Open HTML file in browser (double-click or drag to browser)
2. ✅ See professional report layout
3. ✅ Company header with "Team Members Report"
4. ✅ Export date and timestamp
5. ✅ Summary box with statistics:
   - Export Date
   - Format
   - Filter applied
   - Active/Inactive counts
6. ✅ Table with all users
7. ✅ Alternating row colors (gray/white)
8. ✅ Status color-coded (green=active, red=inactive)
9. ✅ Footer with company info
```

### Step 4: Print to PDF
```
1. Press Ctrl+P (Windows) or Cmd+P (Mac)
2. Select: "Save as PDF" or "Microsoft Print to PDF"
3. Click: Save
4. ✅ PDF file created successfully
5. ✅ PDF looks professional and print-ready
```

---

## 🔧 Test Flow 3: JSON Export

### Step 1: Select JSON Format
```
1. Click "Export" button
2. Click: "JSON (Developer Export)" radio button
3. ✅ Summary updates to "...in JSON format"
4. Click: "Export"
```

### Step 2: Verify JSON File
```
1. ✅ File downloads: team_members_2024-12-13.json
2. ✅ Toast: "JSON data exported successfully..."
3. Open file in text editor or VS Code
```

### Step 3: Validate JSON Structure
```
1. ✅ File is valid JSON (no parse errors)
2. ✅ Root object has:
   - exportDate
   - exportFormat: "json"
   - filterApplied
   - totalMembers
   - members (array)
3. ✅ Each member has nested "performance" object
4. ✅ Pretty-printed (2-space indentation)
5. ✅ All data included (not filtered by checkboxes)
```

**Test JSON Validity**:
```
1. Go to: jsonlint.com
2. Paste file contents
3. Click: "Validate JSON"
4. ✅ Shows "Valid JSON"
```

---

## 🎯 Test Flow 4: Field Selection

### Test Custom Fields (CSV)
```
1. Click "Export"
2. Keep CSV selected
3. Uncheck all except:
   - Basic info ✓
   - Performance stats ✓
4. All others unchecked
5. Click "Export"
```

**Verify**:
```
1. Open CSV
2. ✅ Only 6 columns present:
   - Full Name
   - Email
   - Phone
   - Active Deals
   - Pipeline Value
   - Closed Deals
3. ✅ Other columns excluded
```

### Test All Fields (CSV)
```
1. Click "Export"
2. Check ALL 8 checkboxes (including Login history and Audit log)
3. Click "Export"
```

**Verify**:
```
1. Open CSV
2. ✅ Maximum columns present (13-15 columns)
3. ✅ Includes login history data
4. ✅ Includes audit log data
```

---

## 🔍 Test Flow 5: Filter - Active Only

### Step 1: Apply Active Filter
```
1. Click "Export"
2. In "Filter Export" section:
3. Click: "Active only (X)" radio button
4. ✅ Summary updates to show active count
5. ✅ Number in summary matches number in filter label
6. Click "Export"
```

### Step 2: Verify Filtered Data
```
1. Open CSV/PDF/JSON
2. Count total rows/users
3. ✅ Count matches "Active only" count
4. ✅ All users have status = "active"
5. ✅ No inactive users included
```

---

## 🔍 Test Flow 6: Filter - By Role

### Step 1: Select Role Filter
```
1. Click "Export"
2. Click: "By role:" radio button
3. ✅ Dropdown appears next to label
4. Click dropdown
5. ✅ Shows all available roles:
   - sales_rep
   - account_executive
   - sales_manager
   - team_lead
   - director (if any)
6. Select: "sales_manager"
7. ✅ Summary updates to show filtered count
8. Click "Export"
```

### Step 2: Verify Role Filter
```
1. Open CSV
2. Look at "Role" column
3. ✅ All rows have "sales_manager" as role
4. ✅ No other roles present
5. ✅ Count matches filter count
```

---

## 🔍 Test Flow 7: Filter - By Department

### Step 1: Select Department Filter
```
1. Click "Export"
2. Click: "By department:" radio button
3. ✅ Dropdown appears
4. Click dropdown
5. ✅ Shows all departments from your team
6. Select: "Sales"
7. ✅ Summary updates
8. Click "Export"
```

### Step 2: Verify Department Filter
```
1. Open CSV
2. Look at "Department" column
3. ✅ All rows have "Sales" as department
4. ✅ No other departments present
5. ✅ Count matches filter count
```

---

## 🔍 Test Flow 8: Filter - Inactive Only

### If You Have Inactive Users
```
1. Click "Export"
2. Select: "Inactive only (X)"
3. ✅ Summary shows inactive count
4. Click "Export"
5. Verify CSV: All users have status = "inactive"
```

### If No Inactive Users
```
1. Click "Export"
2. Select: "Inactive only (0)"
3. ✅ Summary shows: "0 users will be exported"
4. ✅ Export button is DISABLED (gray, not clickable)
5. ✅ Cursor shows "not-allowed" on hover
6. Cannot proceed with export
```

---

## ⚡ Test Flow 9: Real-Time Summary Updates

### Test Dynamic Count
```
1. Click "Export"
2. Note summary: "X users will be exported in CSV format"
3. Change format to PDF
4. ✅ Summary updates: "...in PDF format"
5. Change to JSON
6. ✅ Summary updates: "...in JSON format"
7. Change filter to "Active only"
8. ✅ Summary count changes to active count
9. Change filter to "By role" and select "sales_rep"
10. ✅ Summary count changes again
```

**Expected**: Summary updates immediately without clicking anything

---

## 🎨 Visual Verification

### Modal Appearance
```
Width: ~500px
Height: Scrollable (max viewport - 200px)
Background: White
Overlay: Gray semi-transparent
Border: Rounded corners
Shadow: Large drop shadow
```

### Section Layout
```
1. Header: "Export Team Members" with X button
2. Export Format: 3 radio options in gray boxes
3. Include: 8 checkboxes with labels
4. Filter Export: 5 radio options, 2 with dropdowns
5. Summary: Blue info box with count and format
6. Footer: Cancel (gray) and Export (blue) buttons
```

### Color Verification
```
✅ Radio buttons: Blue when selected
✅ Checkboxes: Blue when checked
✅ Summary box: Light blue background (#EFF6FF)
✅ Export button: Blue (#2563EB)
✅ Export button hover: Darker blue
✅ Export button disabled: Gray (#9CA3AF)
✅ Radio option backgrounds: Light gray (#F9FAFB)
✅ Radio option hover: Slightly darker gray
```

---

## 🧪 Edge Case Tests

### Test 1: No Users (Empty Team)
```
Setup: Remove all team members (not likely in real scenario)
1. Click "Export"
2. Summary shows: "0 users will be exported"
3. ✅ Export button is disabled
4. Cannot export
```

### Test 2: All Fields Unchecked
```
1. Click "Export"
2. Uncheck ALL 8 checkboxes
3. Click "Export"
4. Expected: Either disabled or exports empty columns
```

### Test 3: Rapid Format Changes
```
1. Click "Export"
2. Rapidly click: CSV → PDF → JSON → CSV → PDF
3. ✅ Summary updates correctly each time
4. ✅ No UI lag or errors
5. ✅ Last selection is honored on export
```

### Test 4: Dropdown Without Selection
```
1. Click "Export"
2. Select "By role" radio
3. Do NOT select any role from dropdown
4. Click "Export"
5. ✅ Exports all users (no filter applied)
```

### Test 5: Multiple Modal Opens
```
1. Click "Export" → Modal opens
2. Click "Cancel" → Modal closes
3. Click "Export" again → Modal opens
4. ✅ All settings reset to defaults
5. ✅ No previous selections retained
6. Click X to close → Modal closes
7. Click "Export" again → Modal opens
8. ✅ Still defaults
```

### Test 6: Large Team Export (if applicable)
```
If you have 50+ users:
1. Export as CSV
2. ✅ File generates quickly (< 1 second)
3. Export as PDF
4. ✅ File generates (may take 2-3 seconds)
5. ✅ No browser freeze
```

---

## ⌨️ Keyboard Navigation Test

### Modal Controls
```
1. Click "Export" button
2. Press Tab repeatedly
3. ✅ Focus moves through:
   - Close button (X)
   - CSV radio
   - PDF radio
   - JSON radio
   - Each checkbox (8 total)
   - Each filter radio (5 total)
   - Dropdowns (when parent radio selected)
   - Cancel button
   - Export button
4. Press Escape
5. ✅ Modal closes
6. Press Enter while focused on "Export" button
7. ✅ Export executes
```

---

## 📱 Responsive Test (if applicable)

### Desktop (1024px+)
```
✅ Modal centered
✅ 500px width
✅ All content visible
✅ Buttons side-by-side
```

### Tablet (768px - 1023px)
```
✅ Modal width adjusts
✅ Still centered
✅ All content accessible
✅ May need scroll for long content
```

### Mobile (< 768px)
```
✅ Modal width: 95vw
✅ Buttons stack vertically
✅ Dropdowns full width
✅ Text readable
✅ Touch targets adequate
```

---

## 🎬 Complete Test Script (2 Minutes)

### Speed Run Test
```
1. Click "Export" → ✅ Modal opens
2. Keep all defaults → ✅ CSV, 6 fields, All users
3. Verify summary → ✅ "X users in CSV format"
4. Click "Export" → ✅ CSV downloads
5. Toast appears → ✅ Success message
6. Modal closes → ✅ Back to page

7. Click "Export" again → ✅ Modal opens
8. Select PDF → ✅ Radio updates
9. Select "Active only" → ✅ Summary updates
10. Click "Export" → ✅ HTML downloads
11. Toast appears → ✅ PDF note included
12. Open HTML → ✅ Professional report

13. Click "Export" again → ✅ Modal opens
14. Select JSON → ✅ Radio updates
15. Select "By role" → ✅ Dropdown appears
16. Select "sales_rep" → ✅ Count updates
17. Click "Export" → ✅ JSON downloads
18. Toast appears → ✅ Developer note
19. Validate JSON → ✅ Valid structure

✅ All 3 formats work perfectly!
```

---

## 📋 Testing Checklist

**Modal Functionality**
- [ ] Modal opens on Export button click
- [ ] Modal closes on X button click
- [ ] Modal closes on Cancel button
- [ ] Modal closes on outside click
- [ ] Modal closes after export (not on error)

**Export Formats**
- [ ] CSV radio selectable
- [ ] PDF radio selectable
- [ ] JSON radio selectable
- [ ] Only one format selected at a time
- [ ] Summary updates when format changes

**Field Selection**
- [ ] All 8 checkboxes functional
- [ ] Can check/uncheck any combination
- [ ] Default state correct (6 checked, 2 unchecked)
- [ ] Field selection affects CSV columns
- [ ] JSON exports all data regardless

**Filter Options**
- [ ] All users filter works
- [ ] Active only filter works
- [ ] Inactive only filter works
- [ ] By role filter works
- [ ] By department filter works
- [ ] Dropdowns appear conditionally
- [ ] Count updates when filter changes
- [ ] Summary count accurate

**CSV Export**
- [ ] File downloads automatically
- [ ] Filename correct (with date)
- [ ] Content matches selections
- [ ] Headers present
- [ ] Data properly formatted
- [ ] Special characters escaped
- [ ] Opens in Excel correctly

**PDF Export**
- [ ] HTML file downloads
- [ ] Content professionally formatted
- [ ] Header and footer present
- [ ] Table styled correctly
- [ ] Status color-coded
- [ ] Summary box included
- [ ] Prints to PDF successfully

**JSON Export**
- [ ] JSON file downloads
- [ ] Valid JSON structure
- [ ] All fields included
- [ ] Nested performance object
- [ ] Pretty-printed (readable)
- [ ] Parses without errors

**Toast Notifications**
- [ ] Success toast appears
- [ ] Message accurate (count, format)
- [ ] Toast auto-dismisses
- [ ] Toast positioned correctly

**UI/UX**
- [ ] Summary updates real-time
- [ ] Export button disabled when 0 users
- [ ] Disabled state visually clear
- [ ] Colors correct (blue, gray)
- [ ] Icons display properly
- [ ] Text readable
- [ ] No layout shifts

**Edge Cases**
- [ ] 0 users handled
- [ ] No fields selected handled
- [ ] Large teams (100+) work
- [ ] Special characters in data work
- [ ] Multiple exports in succession work
- [ ] Modal reset between opens

---

## 🐛 Common Issues & Quick Fixes

**Issue**: Modal doesn't open
**Fix**: Check browser console, refresh page

**Issue**: Export button disabled
**Fix**: Check filtered count, must be > 0

**Issue**: CSV all in one column in Excel
**Fix**: Use Excel's "Data → From Text" import wizard

**Issue**: PDF is HTML file
**Fix**: This is correct! Open in browser and print to PDF

**Issue**: JSON won't parse
**Fix**: Validate at jsonlint.com, check for errors

**Issue**: Wrong user count
**Fix**: Check filter selection, verify team data

**Issue**: Missing columns in CSV
**Fix**: Verify field checkboxes are checked

**Issue**: Dropdown doesn't appear
**Fix**: Click the corresponding radio button first

---

## ✅ Success Criteria

**All tests pass if:**
- ✅ Modal opens and closes properly
- ✅ All 3 formats export successfully
- ✅ Field selection affects output
- ✅ All 5 filters work correctly
- ✅ Files download automatically
- ✅ Success toast appears
- ✅ No console errors
- ✅ Build completes successfully
- ✅ CSV opens in Excel correctly
- ✅ PDF looks professional
- ✅ JSON is valid

**If all checked: Feature is production-ready! 🎉**
