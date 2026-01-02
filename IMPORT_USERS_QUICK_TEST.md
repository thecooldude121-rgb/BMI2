# Import Users - Quick Test Guide

## 🚀 Quick Test (5 Minutes)

### Access Import Feature
```
1. Navigate to: /crm/team-management
2. Look for: "Import Users" button (next to Export)
3. Click: "Import Users"
4. ✅ Modal opens with "Import Team Members" title
```

---

## 📥 Test Flow 1: Download Template

### Step 1: Download Template
```
1. See: "STEP 1: DOWNLOAD TEMPLATE" section
2. Click: Blue "Download CSV Template" button
3. ✅ File downloads: team_members_import_template.csv
4. Open file in text editor or Excel
5. Verify: 3 sample users with all fields
```

**Expected Template Content**:
```csv
Full Name,Email,Phone,Role,Department,Manager Email,Team,Status
John Doe,john.doe@company.com,...,sales_rep,Sales,...,West Coast,active
Jane Smith,jane.smith@company.com,...,account_executive,Sales,...,East Coast,active
Bob Johnson,bob.j@company.com,...,sales_manager,Sales,...,Enterprise,active
```

---

## 📤 Test Flow 2: Upload Valid File

### Step 2A: Drag & Drop
```
1. Drag template CSV file
2. Hover over gray drop zone
3. ✅ Drop zone turns blue
4. Release file
5. ✅ Processing spinner appears
6. ✅ File name shows: "team_members_import_template.csv"
7. ✅ Step 3 section appears
```

### Step 2B: File Picker (Alternative)
```
1. Click: Gray "Choose File" button
2. Select: CSV file from dialog
3. ✅ File uploads and validates
4. ✅ Step 3 section appears
```

---

## ✅ Test Flow 3: Review Results (Valid CSV)

### Expected Results for Template
```
Step 3: Review & Import section shows:

✅ 3 valid users (green)
⚠️ 0 warnings (if any, yellow)
❌ 0 errors (if any, red)

Valid Users Preview:
• John Doe (john.doe@company.com) - Sales Representative
• Jane Smith (jane.smith@company.com) - Account Executive
• Bob Johnson (bob.j@company.com) - Sales Manager

Seat Check:
• Current: X/5 seats used
• Active users to import: 3
• After import: (X+3)/5 seats
✓ Seat check passed (if seats available)
```

### Buttons Available
```
[Cancel] - Gray, left
[Import 3 Valid Users] - Blue, right (enabled if seats available)
```

---

## ⚠️ Test Flow 4: Duplicate Detection

### Create Test CSV with Duplicate
```csv
Full Name,Email,Phone,Role,Department,Manager Email,Team,Status
New User,new.user@company.com,,sales_rep,Sales,,West,active
Sarah Chen,sarah.chen@company.com,,sales_rep,Sales,,West,active
```
Note: sarah.chen@company.com already exists in system

### Expected Results
```
✅ 1 valid user
⚠️ 1 warning
  • Row 3: Email sarah.chen@company.com already exists in the system
  Action: These users will be skipped

[Import 1 Valid Users] button enabled
```

---

## ❌ Test Flow 5: Validation Errors

### Create Test CSV with Errors
```csv
Full Name,Email,Phone,Role,Department,Manager Email,Team,Status
,test1@company.com,,sales_rep,Sales,,West,active
Test User,invalid-email,,sales_rep,Sales,,West,active
Test User,test3@company.com,,super_admin,Sales,,West,active
Test User,test4@company.com,,sales_rep,,,West,active
```

### Expected Results
```
✅ 0 valid users
❌ 4 errors
  • Row 2: Full Name is required
  • Row 3: Invalid email format
  • Row 4: Invalid role "super_admin". Valid roles: sales_rep, account_executive, sales_manager, team_lead, director
  • Row 5: Department is required

Buttons:
[Cancel] [Fix Errors]

"Import Valid Users" button NOT shown (no valid users)
```

### Test Fix Errors
```
1. Click: "Fix Errors" button
2. ✅ Upload resets
3. ✅ Step 3 disappears
4. ✅ Can upload new file
```

---

## 🔢 Test Flow 6: Seat Limit Check

### Scenario A: Under Limit (Should Pass)
```
Setup: 2/5 seats used
Upload: CSV with 2 active users

Expected:
✅ Seat check passed
• Current: 2/5 seats used
• After import: 4/5 seats
✓ Seat check passed (green background)

[Import 2 Valid Users] - ENABLED (blue)
```

### Scenario B: Over Limit (Should Block)
```
Setup: 3/5 seats used
Upload: CSV with 5 active users

Expected:
❌ Seat check FAILED
• Current: 3/5 seats used
• After import: 8/5 (⚠️ Over limit)
⚠️ Action required: Upgrade plan or reduce import to 2 active users
(red background)

[Import 5 Valid Users] - DISABLED (gray, cursor-not-allowed)
```

### Scenario C: Inactive Users Don't Count
```
Setup: 3/5 seats used
Upload: CSV with 1 active, 4 inactive users

Expected:
✅ Seat check passed
• Active users to import: 1
• After import: 4/5 seats
✓ Seat check passed

[Import 5 Valid Users] - ENABLED
Note: All 5 imported, but only 1 uses a seat
```

---

## 🎯 Test Flow 7: Complete Import

### Execute Import
```
1. Upload valid CSV with 3 users
2. Verify seat check passes
3. Click: "Import 3 Valid Users" button
4. ✅ Modal closes immediately
5. ✅ Success toast appears:
   "3 team members imported successfully."
6. ✅ Team member list updates
7. ✅ New users visible in grid/list
```

### Verify New Users in List
```
1. Scroll team member list
2. Look for: New users from CSV
3. Check: Names match CSV
4. Check: Roles match CSV
5. Check: Avatars created (initials)
6. Check: Joined date is today
```

---

## 🚫 Test Flow 8: File Validation

### Test Wrong File Type
```
1. Try to upload .xlsx file
2. ✅ Alert: "Please upload a CSV file"
3. File rejected
```

### Test Large File
```
1. Create CSV with 150 rows
2. Upload file
3. ✅ Alert: "Maximum 100 users per import"
4. File rejected
```

### Test File Over 5MB
```
1. Upload large CSV (>5MB)
2. ✅ Alert: "File size exceeds 5MB limit"
3. File rejected
```

---

## 🎨 Visual Verification

### Modal Appearance
```
Width: ~768px
Height: Scrollable (max viewport - 200px)
Background: White with gray overlay
Border: Rounded corners
Shadow: Large drop shadow
```

### Step Sections
```
Each step has:
- Uppercase label in gray
- Section content in colored boxes
- Clear spacing between steps
```

### Color Coding
```
Step 1: Blue background box
Step 2: Gray background box with white drop zone
Step 3:
  - Valid: Green border and background
  - Warnings: Yellow border and background
  - Errors: Red border and background
  - Seat check pass: Green
  - Seat check fail: Red
```

### Icons Check
```
✅ Download icon (Step 1)
✅ FileText icon (Step 2 drop zone)
✅ CheckCircle icon (valid)
✅ AlertTriangle icon (warnings)
✅ AlertCircle icon (errors)
```

---

## 🔄 Test Edge Cases

### Empty CSV
```
Upload: CSV with only header row
Expected:
✅ 0 valid users
Step 3 shows but no results
Import button not shown
```

### All Inactive Users
```
Upload: CSV with 5 users, all inactive
Expected:
✅ 5 valid users
Seat check: 0 active users to import
✓ Seat check passed (even if no seats available)
[Import 5 Valid Users] - ENABLED
```

### Mixed Status
```
Upload: 3 active, 2 inactive
Expected:
✅ 5 valid users
Seat check: Only 3 active users counted
```

### Extra Columns in CSV
```
CSV with extra columns beyond template
Expected: Extra columns ignored, import works
```

### Missing Optional Fields
```
Upload: CSV without Phone, Manager Email, Team
Expected:
✅ Import succeeds
Optional fields show as empty/default
```

---

## ⌨️ Keyboard Navigation Test

### Modal Controls
```
1. Press Tab: Focus moves through modal
2. Press Escape: Modal closes
3. Verify: Focus returns to "Import Users" button
```

### File Input
```
1. Tab to "Choose File" button
2. Press Enter/Space: Opens file picker
3. Select file
4. Verify: File uploads
```

---

## 🎬 Complete Test Script (2 Minutes)

```
1. Click "Import Users" → Modal opens ✅
2. Click "Download Template" → File downloads ✅
3. Drag template file to drop zone → Uploads ✅
4. See Step 3 results:
   - 3 valid users ✅
   - 0 warnings ✅
   - 0 errors ✅
   - Seat check passed ✅
5. Click "Import 3 Valid Users" → Success ✅
6. Toast: "3 team members imported" ✅
7. Modal closes ✅
8. New users in list ✅
```

---

## 📋 Testing Checklist

**Modal Functionality**
- [ ] Modal opens on button click
- [ ] Modal closes on X button
- [ ] Modal closes on Cancel button
- [ ] Modal closes on outside click
- [ ] Modal closes after successful import

**Step 1: Download**
- [ ] Template downloads successfully
- [ ] Template has correct headers
- [ ] Template has sample data
- [ ] Template is valid CSV format

**Step 2: Upload**
- [ ] Drag & drop works
- [ ] File picker works
- [ ] File name displays after upload
- [ ] Processing spinner shows
- [ ] Invalid file types rejected
- [ ] Large files rejected
- [ ] 100+ row files rejected

**Step 3: Validation**
- [ ] Valid users count correct
- [ ] Valid users list displays
- [ ] Warnings count correct
- [ ] Warning messages clear
- [ ] Errors count correct
- [ ] Error messages descriptive
- [ ] Seat check calculates correctly
- [ ] Over-limit blocks import

**Import Process**
- [ ] Import button enabled when valid
- [ ] Import button disabled when over limit
- [ ] Users added to team list
- [ ] Success toast displays
- [ ] Toast message accurate
- [ ] Modal closes after import

**Edge Cases**
- [ ] Empty CSV handled
- [ ] All duplicates handled
- [ ] All errors handled
- [ ] Mixed status handled
- [ ] Optional fields work
- [ ] Extra columns ignored

**Visual & UX**
- [ ] Colors correct (green/yellow/red)
- [ ] Icons display properly
- [ ] Text readable
- [ ] Spacing consistent
- [ ] Responsive on mobile
- [ ] No layout shifts

---

## 🐛 Common Issues & Fixes

**Issue**: Modal doesn't open
**Fix**: Check browser console for errors

**Issue**: File upload shows error
**Fix**: Verify file is .csv, under 5MB, under 100 rows

**Issue**: All users show as errors
**Fix**: Check CSV header row matches template exactly

**Issue**: Can't import despite valid users
**Fix**: Check seat availability, may be over limit

**Issue**: Imported users missing data
**Fix**: Verify CSV columns map correctly

**Issue**: Toast doesn't appear
**Fix**: Check ToastContext is available

---

## ✅ Success Criteria

All tests should pass:
- ✅ Modal opens and closes properly
- ✅ Template downloads correctly
- ✅ File upload works (drag & drop and picker)
- ✅ Validation catches all error types
- ✅ Duplicate detection works
- ✅ Seat checking accurate
- ✅ Import adds users successfully
- ✅ Success toast displays
- ✅ No console errors
- ✅ Build completes successfully

**If all checked: Feature is ready for production! 🎉**
